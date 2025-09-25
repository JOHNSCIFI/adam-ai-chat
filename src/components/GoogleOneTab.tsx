import React, { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GoogleOneTabProps {
  onSuccess?: () => void;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: (callback?: (notification: any) => void) => void;
          renderButton: (element: HTMLElement, config: any) => void;
          cancel: () => void;
        };
      };
    };
  }
}

export default function GoogleOneTab({ onSuccess }: GoogleOneTabProps) {
  const { signInWithGoogle, user } = useAuth();
  const initialized = useRef(false);

  useEffect(() => {
    // Don't show if user is already authenticated
    if (user) return;

    const loadGoogleScript = () => {
      if (window.google || initialized.current) return;

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogleOneTap;
      document.head.appendChild(script);
    };

    const initializeGoogleOneTap = () => {
      if (!window.google || initialized.current) return;
      
      initialized.current = true;

      // Get Google Client ID from environment
      const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      
      if (!googleClientId || googleClientId === '1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com') {
        console.error('Google Client ID not configured. Please set VITE_GOOGLE_CLIENT_ID in your .env file');
        toast.error('Google authentication not configured properly');
        return;
      }

      console.log('Initializing Google One Tap with Client ID:', googleClientId);

      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
          use_fedcm_for_prompt: true, // Enable FedCM
        });

        console.log('Google One Tap initialized, prompting...');

        // Prompt for One Tap with better error handling
        window.google.accounts.id.prompt((notification: any) => {
          console.log('Google One Tap prompt notification:', notification);
          
          if (notification && typeof notification.isNotDisplayed === 'function' && notification.isNotDisplayed()) {
            console.log('Google One Tap was not displayed');
            toast.error('Google One Tap is not available. Please use the regular sign-in button.');
          } else if (notification && typeof notification.isSkippedMomentByUser === 'function' && notification.isSkippedMomentByUser()) {
            console.log('Google One Tap was skipped by user');
          } else if (notification && notification.isDismissedMoment && typeof notification.isDismissedMoment === 'function' && notification.isDismissedMoment()) {
            console.log('Google One Tap was dismissed');
          }
        });
      } catch (error) {
        console.error('Error initializing Google One Tap:', error);
        toast.error('Failed to initialize Google authentication');
      }
    };

    const handleCredentialResponse = async (response: any) => {
      console.log('Google One Tap credential response received:', response);
      
      try {
        if (!response.credential) {
          console.error('No credential in response');
          toast.error('Invalid Google sign-in response');
          return;
        }

        // Use Supabase's signInWithIdToken for Google One Tap
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: response.credential,
        });

        if (error) {
          console.error('Supabase Google sign-in error:', error);
          toast.error('Failed to sign in with Google: ' + error.message);
        } else {
          console.log('Successfully signed in with Google One Tap:', data);
          toast.success('Successfully signed in with Google!');
          onSuccess?.();
        }
      } catch (error) {
        console.error('Error handling Google credential:', error);
        toast.error('Failed to process Google sign-in');
      }
    };

    loadGoogleScript();

    return () => {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.cancel();
        } catch (error) {
          // Ignore cancellation errors as they're often due to API changes
          console.log('Google One Tap cleanup completed');
        }
      }
    };
  }, [user, signInWithGoogle, onSuccess]);

  // Don't render anything - Google One Tap handles its own UI
  return null;
}