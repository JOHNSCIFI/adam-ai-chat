import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

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
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out');
          setSession(null);
          setUser(null);
        }
        setLoading(false);
      }
    );

    // Initial session check and auth callback handling
    handleAuthCallback();

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
        data: displayName ? { display_name: displayName } : {}
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

  const signOut = async () => {
    console.log('Signing out');
    await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut
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