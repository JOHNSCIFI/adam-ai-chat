import React, { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  user: any | null;
  session: any | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  console.log('AuthProvider rendering - simplified version');

  // Remove Supabase temporarily to test
  useEffect(() => {
    console.log('AuthProvider useEffect running - simplified');
    setLoading(false);
  }, []);

  const signUp = async (email: string, password: string, displayName?: string) => {
    console.log('SignUp called:', email);
    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    console.log('SignIn called:', email);
    return { error: null };
  };

  const signOut = async () => {
    console.log('SignOut called');
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