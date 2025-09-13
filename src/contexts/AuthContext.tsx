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
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  console.log('AuthProvider rendering with Supabase');

  useEffect(() => {
    console.log('AuthProvider useEffect running with Supabase');
    
    // Handle auth callback from email verification
    const handleAuthCallback = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error getting session:', error);
      } else {
        console.log('Session from callback:', data.session?.user?.email);
        setSession(data.session);
        setUser(data.session?.user ?? null);
      }
      setLoading(false);
    };
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        // Handle email confirmation
        if (event === 'SIGNED_IN' && session) {
          console.log('User signed in successfully');
          setSession(session);
          setUser(session.user);
          
          // Fetch user profile after signin
          setTimeout(async () => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', session.user.id)
              .single();
            setUserProfile(profile);
          }, 0);
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out');
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
        console.error('Error fetching user profile:', error);
      }
    };

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, displayName?: string) => {
    console.log('Attempting to sign up:', email);
    // Use the actual Lovable project URL instead of localhost
    const redirectUrl = window.location.origin.includes('localhost') 
      ? 'https://95b51062-fa36-4119-b593-1ae2ac8718b2.sandbox.lovable.dev/'
      : `${window.location.origin}/`;
    
    console.log('Redirect URL:', redirectUrl);
    
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
    
    console.log('Signup result:', { error, user: data.user?.email });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    console.log('Attempting to sign in:', email);
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    console.log('Signin result:', { error, user: data.user?.email });
    return { error };
  };

  const signInWithGoogle = async () => {
    console.log('Attempting to sign in with Google');
    const redirectUrl = window.location.origin.includes('localhost') 
      ? 'https://95b51062-fa36-4119-b593-1ae2ac8718b2.sandbox.lovable.dev/'
      : `${window.location.origin}/`;
    
    console.log('Google OAuth redirect URL:', redirectUrl);
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          signup_method: 'google'
        }
      }
    });
    
    console.log('Google signin result:', { error });
    return { error };
  };

  const resetPassword = async (email: string) => {
    const redirectUrl = window.location.origin.includes('localhost') 
      ? 'https://95b51062-fa36-4119-b593-1ae2ac8718b2.sandbox.lovable.dev/'
      : `${window.location.origin}/`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${redirectUrl}auth?mode=recovery`
    });
    
    return { error };
  };

  const signOut = async () => {
    console.log('Signing out');
    await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    loading,
    userProfile,
    signUp,
    signIn,
    signInWithGoogle,
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