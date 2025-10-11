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

  // Fetch and create/update user profile - defined once and reused
  const fetchUserProfile = async (userId: string, userSession: any) => {
    try {
      // Determine signup method from session or user metadata
      let signupMethod = 'email';
      if (userSession.user.app_metadata?.provider === 'google' || 
          userSession.user.user_metadata?.provider === 'google' ||
          userSession.user.identities?.some((id: any) => id.provider === 'google')) {
        signupMethod = 'google';
      } else if (userSession.user.app_metadata?.provider === 'apple' || 
          userSession.user.user_metadata?.provider === 'apple' ||
          userSession.user.identities?.some((id: any) => id.provider === 'apple')) {
        signupMethod = 'apple';
      }

      // Check if profile exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (!existingProfile && !fetchError) {
        // Create new profile
        const profileData: any = {
          user_id: userId,
          email: userSession.user.email,
          signup_method: signupMethod
        };
        
        if (signupMethod === 'google') {
          profileData.display_name = userSession.user.user_metadata?.full_name || userSession.user.email?.split('@')[0];
          profileData.avatar_url = userSession.user.user_metadata?.avatar_url;
        } else if (signupMethod === 'apple') {
          profileData.display_name = userSession.user.user_metadata?.full_name || userSession.user.email?.split('@')[0];
          profileData.avatar_url = userSession.user.user_metadata?.avatar_url;
        } else {
          profileData.display_name = userSession.user.user_metadata?.display_name || userSession.user.email?.split('@')[0];
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
          if (!existingProfile.display_name || existingProfile.display_name !== userSession.user.user_metadata?.full_name) {
            updates.display_name = userSession.user.user_metadata?.full_name || userSession.user.email?.split('@')[0];
          }
          if (!existingProfile.avatar_url || existingProfile.avatar_url !== userSession.user.user_metadata?.avatar_url) {
            updates.avatar_url = userSession.user.user_metadata?.avatar_url;
          }
        }
        
        if (Object.keys(updates).length > 0) {
          await supabase
            .from('profiles')
            .update(updates)
            .eq('user_id', userId);
            
          setUserProfile({ ...existingProfile, ...updates });
        } else {
          setUserProfile(existingProfile);
        }
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
        
        // Function to check subscription with retries
        const checkWithRetries = async (attempt = 1, maxAttempts = 4) => {
          console.log(`🔍 Subscription check attempt ${attempt}/${maxAttempts}`);
          
          // Wait longer on first attempt for webhook to process
          const delay = attempt === 1 ? 3000 : 2000;
          await new Promise(resolve => setTimeout(resolve, delay));
          
          await checkSubscription(false);
          
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
      
      // Periodic check (silently in background) - every 5 minutes
      subscriptionCheckInterval = setInterval(() => {
        if (!isCheckingSubscription) {
          checkSubscription(false);
        }
      }, 300000); // Check every 5 minutes
    }

    return () => {
      if (subscriptionCheckInterval) {
        clearInterval(subscriptionCheckInterval);
      }
    };
  }, [user?.id]); // Only depend on user ID, not the entire user object

  // Separate effect to handle profile fetching/creation when user changes
  useEffect(() => {
    if (user && session) {
      fetchUserProfile(user.id, session);
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

  const checkSubscription = async (showNotification = false) => {
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
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.error('Error checking subscription:', error);
        setIsCheckingSubscription(false);
        return;
      }
      
      if (data) {
        const newStatus = {
          subscribed: data.subscribed || false,
          product_id: data.product_id || null,
          subscription_end: data.subscription_end || null
        };
        
        // CRITICAL: Only update state if values actually changed
        // This prevents unnecessary re-renders in components using useAuth()
        const hasChanged = 
          newStatus.subscribed !== subscriptionStatus.subscribed ||
          newStatus.product_id !== subscriptionStatus.product_id ||
          newStatus.subscription_end !== subscriptionStatus.subscription_end;
        
        if (hasChanged) {
          console.log('Subscription status changed, updating state');
          setSubscriptionStatus(newStatus);
          
          // Persist to localStorage to maintain state across tab switches
          try {
            localStorage.setItem('subscription_status', JSON.stringify(newStatus));
          } catch (error) {
            console.error('Error saving subscription status to storage:', error);
          }
          
          // Only show notification if explicitly requested
          if (showNotification && newStatus.subscribed !== subscriptionStatus.subscribed) {
            // Notification will be handled by the calling component if needed
          }
        } else {
          console.log('Subscription status unchanged, skipping state update');
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