import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  loadingSubscription: boolean;
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

// SessionStorage key for caching subscription status
const SUBSCRIPTION_CACHE_KEY = 'chatl_subscription_status';

// Helper functions for sessionStorage management
const loadCachedSubscription = () => {
  try {
    const cached = sessionStorage.getItem(SUBSCRIPTION_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      console.log('📦 Loaded cached subscription:', parsed);
      return parsed;
    }
  } catch (error) {
    console.error('Error loading cached subscription:', error);
  }
  return null;
};

const saveCachedSubscription = (status: any) => {
  try {
    sessionStorage.setItem(SUBSCRIPTION_CACHE_KEY, JSON.stringify(status));
    console.log('💾 Saved subscription to cache:', status);
  } catch (error) {
    console.error('Error saving subscription to cache:', error);
  }
};

const clearCachedSubscription = () => {
  try {
    sessionStorage.removeItem(SUBSCRIPTION_CACHE_KEY);
    console.log('🗑️ Cleared subscription cache');
  } catch (error) {
    console.error('Error clearing subscription cache:', error);
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  
  // Try to load cached subscription status on mount
  const cachedStatus = loadCachedSubscription();
  const [subscriptionStatus, setSubscriptionStatus] = useState(cachedStatus || {
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
    let realtimeChannel: any = null;
    
    if (user) {
      // Load cached status immediately if available
      const cached = loadCachedSubscription();
      if (cached) {
        setSubscriptionStatus(cached);
        setLoadingSubscription(false);
      }
      
      // Then check subscription via Stripe API (verify cache)
      checkSubscription();
      
      // Set up realtime listener for webhook updates - this is the primary update mechanism
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
    } else {
      // User signed out
      setLoadingSubscription(false);
    }

    return () => {
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, [user?.id]);

  // Page Visibility API: Refresh subscription when user returns to tab
  useEffect(() => {
    let debounceTimeout: NodeJS.Timeout | null = null;
    
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        console.log('👁️ Page became visible, checking subscription status...');
        
        // Debounce to prevent multiple rapid checks
        if (debounceTimeout) {
          clearTimeout(debounceTimeout);
        }
        
        debounceTimeout = setTimeout(() => {
          checkSubscription();
        }, 300);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, [user]);

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
        const resetStatus = {
          subscribed: false,
          product_id: null,
          subscription_end: null
        };
        setSubscriptionStatus(resetStatus);
        clearCachedSubscription();
        setLoadingSubscription(false);
      }
      return;
    }

    setIsCheckingSubscription(true);
    setLoadingSubscription(true);
    try {
      // Check with Stripe API - source of truth
      console.log('🔍 Checking subscription via Stripe API...');
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.error('❌ Error checking subscription with Stripe:', error);
        // On error, keep cached status if available, otherwise assume no subscription
        const cached = loadCachedSubscription();
        if (!cached) {
          const resetStatus = {
            subscribed: false,
            product_id: null,
            subscription_end: null
          };
          setSubscriptionStatus(resetStatus);
          clearCachedSubscription();
        }
      } else if (data) {
        const newStatus = {
          subscribed: data.subscribed || false,
          product_id: data.product_id || null,
          subscription_end: data.subscription_end || null
        };
        
        console.log('✅ Subscription status updated from Stripe:', newStatus);
        setSubscriptionStatus(newStatus);
        
        // Save to sessionStorage for instant load on next page load
        saveCachedSubscription(newStatus);
      }
    } catch (error) {
      console.error('❌ Error checking subscription:', error);
      // On error, keep cached status if available
      const cached = loadCachedSubscription();
      if (!cached) {
        const resetStatus = {
          subscribed: false,
          product_id: null,
          subscription_end: null
        };
        setSubscriptionStatus(resetStatus);
        clearCachedSubscription();
      }
    } finally {
      setIsCheckingSubscription(false);
      setLoadingSubscription(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    
    // Clear subscription status and cache
    const resetStatus = {
      subscribed: false,
      product_id: null,
      subscription_end: null
    };
    setSubscriptionStatus(resetStatus);
    clearCachedSubscription();
    
    // Force page refresh after sign out
    window.location.href = '/';
  };

  const value = {
    user,
    session,
    loading,
    loadingSubscription,
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