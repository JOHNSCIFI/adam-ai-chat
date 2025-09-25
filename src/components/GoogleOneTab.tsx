import React, { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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

      try {
        window.google.accounts.id.initialize({
          client_id: process.env.GOOGLE_CLIENT_ID || '1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com',
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        // Prompt for One Tap
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMomentByUser()) {
            console.log('Google One Tap was not displayed or was skipped');
          }
        });
      } catch (error) {
        console.error('Error initializing Google One Tap:', error);
      }
    };

    const handleCredentialResponse = async (response: any) => {
      try {
        // For Google One Tap, we need to use the Supabase OAuth flow
        // The JWT token from Google One Tap needs to be handled differently
        const { error } = await signInWithGoogle();
        
        if (error) {
          console.error('Google sign-in error:', error);
          toast.error('Failed to sign in with Google');
        } else {
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
          console.error('Error canceling Google One Tap:', error);
        }
      }
    };
  }, [user, signInWithGoogle, onSuccess]);

  // Don't render anything - Google One Tap handles its own UI
  return null;
}