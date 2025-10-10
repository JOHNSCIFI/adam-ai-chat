import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userProfile: any;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signInWithApple: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    
    // Handle auth callback from email verification
    const handleAuthCallback = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!error) {
        setSession(data.session);
        setUser(data.session?.user ?? null);
      }
      setLoading(false);
    };
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
          // Handle email confirmation
          if (event === 'SIGNED_IN' && session) {
            setSession(session);
            setUser(session.user);
            
            // Check if this is a new user and create/update profile
            setTimeout(async () => {
              // Determine signup method from session or user metadata
              let signupMethod = 'email';
              if (session.user.app_metadata?.provider === 'google' || 
                  session.user.user_metadata?.provider === 'google' ||
                  session.user.identities?.some(id => id.provider === 'google')) {
                signupMethod = 'google';
              } else if (session.user.app_metadata?.provider === 'apple' || 
                  session.user.user_metadata?.provider === 'apple' ||
                  session.user.identities?.some(id => id.provider === 'apple')) {
                signupMethod = 'apple';
              }
            
            // Check if profile exists
            const { data: existingProfile, error: fetchError } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', session.user.id)
              .single();
            
            if (!existingProfile && !fetchError) {
              // Create new profile
              const profileData: any = {
                user_id: session.user.id,
                email: session.user.email,
                signup_method: signupMethod
              };
              
              if (signupMethod === 'google') {
                profileData.display_name = session.user.user_metadata?.full_name || session.user.email?.split('@')[0];
                profileData.avatar_url = session.user.user_metadata?.avatar_url;
              } else if (signupMethod === 'apple') {
                profileData.display_name = session.user.user_metadata?.full_name || session.user.email?.split('@')[0];
                profileData.avatar_url = session.user.user_metadata?.avatar_url;
              } else {
                profileData.display_name = session.user.user_metadata?.display_name || session.user.email?.split('@')[0];
              }
              
              // Set default theme and accent color for new users
              await supabase.auth.updateUser({
                data: { 
                  theme: 'system',
                  accent_color: 'gray'
                }
              });
              
              await supabase
                .from('profiles')
                .insert(profileData);
              
              setUserProfile(profileData);
            } else if (existingProfile) {
              // Update existing profile if needed
              const updates: any = {};
              
              // Update signup method if not set
              if (!existingProfile.signup_method) {
                updates.signup_method = signupMethod;
              }
              
              // Update display name and avatar for Google and Apple users
              if (signupMethod === 'google' || signupMethod === 'apple') {
                if (!existingProfile.display_name || existingProfile.display_name !== session.user.user_metadata?.full_name) {
                  updates.display_name = session.user.user_metadata?.full_name || session.user.email?.split('@')[0];
                }
                if (!existingProfile.avatar_url || existingProfile.avatar_url !== session.user.user_metadata?.avatar_url) {
                  updates.avatar_url = session.user.user_metadata?.avatar_url;
                }
              }
              
              if (Object.keys(updates).length > 0) {
                await supabase
                  .from('profiles')
                  .update(updates)
                  .eq('user_id', session.user.id);
                  
                setUserProfile({ ...existingProfile, ...updates });
              } else {
                setUserProfile(existingProfile);
              }
            }
          }, 0);
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setUserProfile(null);
        }
        setLoading(false);
      }
    );

    // Initial session check and auth callback handling
    handleAuthCallback();

    // Fetch user profile for existing sessions
    const fetchUserProfile = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single();
        
        if (!error && data) {
          setUserProfile(data);
        }
      } catch (error) {
        // Silently fail
      }
    };

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, displayName?: string) => {
    // Use preview URL as primary redirect
    const redirectUrl = 'https://preview--adam-ai-chat.lovable.app/';
    
    console.log('🔐 Sign up attempt with redirect URL:', redirectUrl);
    
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: displayName ? { 
          display_name: displayName,
          signup_method: 'email'
        } : {
          signup_method: 'email'
        }
      }
    });
    
    console.log('📧 Sign up response:', { 
      hasError: !!error, 
      errorMessage: error?.message,
      hasUser: !!data?.user,
      hasSession: !!data?.session,
      userEmail: data?.user?.email
    });
    
    // Handle case where user exists but hasn't verified email - resend verification
    if (data?.user && !data?.session && !error) {
      console.log('✅ Sign up successful - verification email should be sent');
      return { error: null };
    }
    
    if (error) {
      console.error('❌ Sign up error:', error);
    }
    
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    return { error };
  };

  const signInWithGoogle = async () => {
    const redirectUrl = window.location.origin.includes('localhost')
      ? 'https://95b51062-fa36-4119-b593-1ae2ac8718b2.sandbox.lovable.dev/'
      : `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          signup_method: 'google'
        }
      }
    });
    
    return { error };
  };

  const signInWithApple = async () => {
    const redirectUrl = window.location.origin.includes('localhost')
      ? 'https://95b51062-fa36-4119-b593-1ae2ac8718b2.sandbox.lovable.dev/'
      : `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          signup_method: 'apple'
        }
      }
    });
    
    return { error };
  };

  const resetPassword = async (email: string) => {
    const redirectUrl = window.location.origin.includes('localhost') 
      ? 'https://95b51062-fa36-4119-b593-1ae2ac8718b2.sandbox.lovable.dev/'
      : `${window.location.origin}/`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${redirectUrl}reset-password`
    });
    
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    // Force page refresh after sign out
    window.location.href = '/';
  };

  const value = {
    user,
    session,
    loading,
    userProfile,
    signUp,
    signIn,
    signInWithGoogle,
    signInWithApple,
    signOut,
    resetPassword
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}