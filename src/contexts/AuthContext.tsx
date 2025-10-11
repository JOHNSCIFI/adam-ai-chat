import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userProfile: any;
  subscriptionStatus: {
    subscribed: boolean;
    product_id: string | null;
    subscription_end: string | null;
  };
  checkSubscription: () => Promise<void>;
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
  const [subscriptionStatus, setSubscriptionStatus] = useState({
    subscribed: false,
    product_id: null,
    subscription_end: null
  });

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
            
            // Check subscription status after sign in
            setTimeout(async () => {
              try {
                const { data: subData } = await supabase.functions.invoke('check-subscription');
                if (subData) {
                  setSubscriptionStatus({
                    subscribed: subData.subscribed || false,
                    product_id: subData.product_id || null,
                    subscription_end: subData.subscription_end || null
                  });
                }
              } catch (error) {
                console.error('Error checking subscription:', error);
              }
            }, 500);
          }, 0);
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setUserProfile(null);
          setSubscriptionStatus({
            subscribed: false,
            product_id: null,
            subscription_end: null
          });
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
    // Use production domain for all redirects
    const redirectUrl = 'https://www.chatl.ai/';
    
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
      userEmail: data?.user?.email,
      emailConfirmedAt: data?.user?.email_confirmed_at,
      identitiesLength: data?.user?.identities?.length
    });
    
    // Check if user already exists and has confirmed their email
    if (data?.user && !data?.session && !error) {
      // If email is already confirmed OR user has no identities, they're an existing user
      if (data.user.email_confirmed_at || (data.user.identities && data.user.identities.length === 0)) {
        console.log('⚠️ User already exists with confirmed email');
        return { 
          error: { 
            message: 'User already registered',
            status: 400 
          } 
        };
      }
      
      // New user who needs to verify email
      return { error: null };
    }
    
    if (error) {
      // Don't log sensitive error details
      console.error('Sign up failed');
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
    const redirectUrl = 'https://www.chatl.ai/';
    
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
    const redirectUrl = 'https://www.chatl.ai/';
    
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
    const redirectUrl = 'https://www.chatl.ai/';
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${redirectUrl}reset-password`
    });
    
    return { error };
  };

  const checkSubscription = async () => {
    if (!user) {
      setSubscriptionStatus({
        subscribed: false,
        product_id: null,
        subscription_end: null
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.error('Error checking subscription:', error);
        return;
      }
      
      if (data) {
        setSubscriptionStatus({
          subscribed: data.subscribed || false,
          product_id: data.product_id || null,
          subscription_end: data.subscription_end || null
        });
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSubscriptionStatus({
      subscribed: false,
      product_id: null,
      subscription_end: null
    });
    // Force page refresh after sign out
    window.location.href = '/';
  };

  const value = {
    user,
    session,
    loading,
    userProfile,
    subscriptionStatus,
    checkSubscription,
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