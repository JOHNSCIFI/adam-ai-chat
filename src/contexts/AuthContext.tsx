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
  
  // Initialize subscription status from localStorage to persist across tab switches
  const [subscriptionStatus, setSubscriptionStatus] = useState(() => {
    try {
      const stored = localStorage.getItem('subscription_status');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading subscription status from storage:', error);
    }
    return {
      subscribed: false,
      product_id: null,
      subscription_end: null
    };
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
            checkSubscription(false);
          }, 500);
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setUserProfile(null);
          
          // Clear subscription status and localStorage
          const emptyStatus = {
            subscribed: false,
            product_id: null,
            subscription_end: null
          };
          setSubscriptionStatus(emptyStatus);
          try {
            localStorage.removeItem('subscription_status');
          } catch (error) {
            console.error('Error clearing subscription status from storage:', error);
          }
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
    
    if (user) {
      // Check for returning from Stripe
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get('session_id');
      const isReturningFromStripe = sessionId || urlParams.has('success');
      
      if (isReturningFromStripe) {
        console.log('🔄 Detected return from Stripe, checking subscription...');
        
        // Function to check subscription with retries - verify with Stripe after checkout
        const checkWithRetries = async (attempt = 1, maxAttempts = 4) => {
          console.log(`🔍 Subscription check attempt ${attempt}/${maxAttempts}`);
          
          // Wait longer on first attempt for webhook to process
          const delay = attempt === 1 ? 3000 : 2000;
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Verify with Stripe to update database
          await checkSubscription(true);
          
          // Check if subscription was updated
          const currentStatus = JSON.parse(localStorage.getItem('subscription_status') || '{"subscribed":false}');
          
          if (currentStatus.subscribed) {
            console.log('✅ Subscription confirmed!');
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
          } else if (attempt < maxAttempts) {
            console.log(`⏳ Subscription not updated yet, retrying in ${delay}ms...`);
            checkWithRetries(attempt + 1, maxAttempts);
          } else {
            console.log('⚠️ Max retry attempts reached');
            // Clean up URL anyway
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        };
        
        checkWithRetries();
      } else {
        // Normal initial check
        checkSubscription(false);
      }
      
      // Periodic check (from database only) - every 2 minutes
      subscriptionCheckInterval = setInterval(() => {
        if (!isCheckingSubscription) {
          checkSubscription(false); // Just read from database, don't call Stripe
        }
      }, 120000); // Check every 2 minutes
    }

    return () => {
      if (subscriptionCheckInterval) {
        clearInterval(subscriptionCheckInterval);
      }
    };
  }, [user?.id]); // Only depend on user ID, not the entire user object

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

  const checkSubscription = async (verifyWithStripe = false) => {
    if (!user || isCheckingSubscription) {
      if (!user) {
        const emptyStatus = {
          subscribed: false,
          product_id: null,
          subscription_end: null
        };
        setSubscriptionStatus(emptyStatus);
        try {
          localStorage.removeItem('subscription_status');
        } catch (error) {
          console.error('Error clearing subscription status from storage:', error);
        }
      }
      return;
    }

    setIsCheckingSubscription(true);
    try {
      // Get subscription status from database
      const { data: dbSubscription } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();
      
      const newStatus = dbSubscription ? {
        subscribed: true,
        product_id: dbSubscription.product_id,
        subscription_end: dbSubscription.current_period_end
      } : {
        subscribed: false,
        product_id: null,
        subscription_end: null
      };
      
      const hasChanged = 
        newStatus.subscribed !== subscriptionStatus.subscribed ||
        newStatus.product_id !== subscriptionStatus.product_id ||
        newStatus.subscription_end !== subscriptionStatus.subscription_end;
      
      if (hasChanged) {
        console.log('Subscription loaded from database');
        setSubscriptionStatus(newStatus);
        try {
          localStorage.setItem('subscription_status', JSON.stringify(newStatus));
        } catch (error) {
          console.error('Error saving subscription status to storage:', error);
        }
      }
      
      // Only verify with Stripe when explicitly requested (after checkout)
      if (verifyWithStripe) {
        const { data, error } = await supabase.functions.invoke('check-subscription');
        
        if (error) {
          console.error('Error verifying with Stripe:', error);
        } else if (data) {
          const stripeStatus = {
            subscribed: data.subscribed || false,
            product_id: data.product_id || null,
            subscription_end: data.subscription_end || null
          };
          
          const stripeHasChanged = 
            stripeStatus.subscribed !== newStatus.subscribed ||
            stripeStatus.product_id !== newStatus.product_id ||
            stripeStatus.subscription_end !== newStatus.subscription_end;
          
          if (stripeHasChanged) {
            console.log('Subscription updated from Stripe verification');
            setSubscriptionStatus(stripeStatus);
            try {
              localStorage.setItem('subscription_status', JSON.stringify(stripeStatus));
            } catch (error) {
              console.error('Error saving subscription status to storage:', error);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    } finally {
      setIsCheckingSubscription(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    
    // Clear subscription status and localStorage
    const emptyStatus = {
      subscribed: false,
      product_id: null,
      subscription_end: null
    };
    setSubscriptionStatus(emptyStatus);
    try {
      localStorage.removeItem('subscription_status');
    } catch (error) {
      console.error('Error clearing subscription status from storage:', error);
    }
    
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