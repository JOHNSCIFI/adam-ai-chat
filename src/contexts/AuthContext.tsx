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
  
  // Always start with no subscription - will be checked via Stripe API
  const [subscriptionStatus, setSubscriptionStatus] = useState({
    subscribed: false,
    product_id: null,
    subscription_end: null
  });
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(false);

  // Fetch user profile - only read, no updates to prevent 429 errors
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (existingProfile) {
        setUserProfile(existingProfile);
      }
    } catch (error) {
      // Silently fail
    }
  };

  useEffect(() => {
    // Handle auth callback from email verification
    const handleAuthCallback = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!error && data.session) {
        setSession(data.session);
        setUser(data.session.user);
      }
      setLoading(false);
    };
    
    // Set up auth state listener - ONLY ONCE on mount
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // CRITICAL: Only synchronous state updates here to prevent auth loops
        if (event === 'SIGNED_IN' && session) {
          setSession(session);
          setUser(session.user);
          
          // Defer subscription check to avoid auth loop
          setTimeout(() => {
            checkSubscription();
          }, 500);
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setUserProfile(null);
          
          // Clear subscription status and localStorage
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

    return () => {
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array - only run once on mount

  // Separate effect for subscription checks when user changes
  useEffect(() => {
    let subscriptionCheckInterval: NodeJS.Timeout | null = null;
    let realtimeChannel: any = null;
    
    if (user) {
      // Check subscription immediately via Stripe API
      checkSubscription();
      
      // Set up realtime listener for webhook updates
      realtimeChannel = supabase
        .channel(`user-subscription-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_subscriptions',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('🔔 Webhook updated subscription, refreshing from Stripe');
            // Refresh from Stripe when webhook updates database
            setTimeout(() => checkSubscription(), 1000);
          }
        )
        .subscribe();
      
      // Check for returning from Stripe
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get('session_id');
      const isReturningFromStripe = sessionId || urlParams.has('success');
      
      if (isReturningFromStripe) {
        console.log('🔄 Detected return from Stripe, verifying with retries...');
        
        // Function to check subscription with retries after Stripe checkout
        const checkWithRetries = async (attempt = 1, maxAttempts = 4) => {
          console.log(`🔍 Stripe verification attempt ${attempt}/${maxAttempts}`);
          
          const delay = attempt === 1 ? 3000 : 2000;
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Check Stripe directly
          await checkSubscription();
          
          if (subscriptionStatus.subscribed) {
            console.log('✅ Subscription confirmed!');
            window.history.replaceState({}, document.title, window.location.pathname);
          } else if (attempt < maxAttempts) {
            console.log(`⏳ Retrying in ${delay}ms...`);
            checkWithRetries(attempt + 1, maxAttempts);
          } else {
            console.log('⚠️ Max attempts reached');
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        };
        
        checkWithRetries();
      }
      
      // Periodic check via Stripe API - every 60 seconds
      subscriptionCheckInterval = setInterval(() => {
        if (!isCheckingSubscription) {
          checkSubscription();
        }
      }, 60000);
    }

    return () => {
      if (subscriptionCheckInterval) {
        clearInterval(subscriptionCheckInterval);
      }
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, [user?.id]);

  // Separate effect to handle profile fetching when user changes
  useEffect(() => {
    if (user) {
      fetchUserProfile(user.id);
    }
  }, [user?.id]); // Only run when user ID changes

  const signUp = async (email: string, password: string, displayName?: string) => {
    // Use current origin for redirects (works in test and production)
    const redirectUrl = window.location.origin + '/';
    
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
    const redirectUrl = window.location.origin + '/';
    
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
    const redirectUrl = window.location.origin + '/';
    
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
    const redirectUrl = window.location.origin + '/';
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${redirectUrl}reset-password`
    });
    
    return { error };
  };

  const checkSubscription = async () => {
    if (!user || isCheckingSubscription) {
      if (!user) {
        setSubscriptionStatus({
          subscribed: false,
          product_id: null,
          subscription_end: null
        });
      }
      return;
    }

    setIsCheckingSubscription(true);
    try {
      // ALWAYS check with Stripe API - it's the source of truth
      console.log('🔍 Checking subscription via Stripe API...');
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.error('❌ Error checking subscription with Stripe:', error);
        // On error, keep current state
      } else if (data) {
        const newStatus = {
          subscribed: data.subscribed || false,
          product_id: data.product_id || null,
          subscription_end: data.subscription_end || null
        };
        
        const hasChanged = 
          newStatus.subscribed !== subscriptionStatus.subscribed ||
          newStatus.product_id !== subscriptionStatus.product_id ||
          newStatus.subscription_end !== subscriptionStatus.subscription_end;
        
        if (hasChanged) {
          console.log('✅ Subscription status updated from Stripe:', newStatus);
          setSubscriptionStatus(newStatus);
        } else {
          console.log('ℹ️ Subscription status unchanged');
        }
      }
    } catch (error) {
      console.error('❌ Error checking subscription:', error);
    } finally {
      setIsCheckingSubscription(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    
    // Clear subscription status
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