import React, { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface GoogleOneTabProps {
  onSuccess?: () => void;
}

declare global {
  interface Window {
    google: any;
  }
}

export default function GoogleOneTab({ onSuccess }: GoogleOneTabProps) {
  const { user, signInWithGoogle } = useAuth();
  const oneTabRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    // Don't show One Tap if user is already authenticated
    if (user || isInitialized.current) return;

    const loadGoogleScript = () => {
      if (window.google && window.google.accounts) {
        initializeGoogleOneTap();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = () => {
        if (window.google && window.google.accounts) {
          initializeGoogleOneTap();
        }
      };
      document.head.appendChild(script);
    };

    const initializeGoogleOneTap = async () => {
      if (isInitialized.current) return;
      
      try {
        // Use hardcoded client ID - no VITE_ variables
        const clientId = "217944304340-s9hdphrnpakgegrk3e64pujvu0g7rp99.apps.googleusercontent.com";
        
        console.log('Initializing Google One Tap (no nonce mode)');
        console.log('Current origin:', window.location.origin);

        // Don't use nonce - let Google handle it
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: false,
          // No nonce parameter - this prevents mismatch issues
        });

        // Display the One Tap prompt
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed()) {
            console.log('Google One Tap not displayed:', notification.getNotDisplayedReason());
          } else if (notification.isSkippedMoment()) {
            console.log('Google One Tap skipped:', notification.getSkippedReason());
          }
        });

        isInitialized.current = true;
      } catch (error) {
        console.error('Error initializing Google One Tap:', error);
      }
    };

    const handleCredentialResponse = async (response: any) => {
      try {
        console.log('Google One Tap credential received (v2), attempting sign in...');
        
        // Don't pass nonce - Supabase will validate the ID token directly
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: response.credential,
          // No nonce parameter
        });

        if (error) {
          console.error('Google One Tap sign in error:', error.message);
        } else {
          console.log('Successfully signed in with Google One Tap');
          onSuccess?.();
        }
      } catch (error) {
        console.error('Error processing Google One Tap response:', error);
      }
    };

    // Load Google script
    loadGoogleScript();

    // Cleanup function
    return () => {
      if (window.google && window.google.accounts) {
        try {
          window.google.accounts.id.cancel();
        } catch (error) {
          console.log('Error canceling Google One Tap:', error);
        }
      }
    };
  }, [user, signInWithGoogle, onSuccess]);

  // Don't render anything if user is authenticated
  if (user) return null;

  return (
    <div 
      ref={oneTabRef} 
      id="google-one-tap" 
      className="fixed top-0 left-0 right-0 z-50"
    />
  );
}