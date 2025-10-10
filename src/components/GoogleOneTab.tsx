import React, { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { logError, logInfo } from '@/utils/errorLogger';

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
        // Use environment variable for client ID (stored in Supabase secrets)
        const clientId = "217944304340-s9hdphrnpakgegrk3e64pujvu0g7rp99.apps.googleusercontent.com";

        // CRITICAL: Do NOT provide nonce - let Google generate token without nonce field
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: false,
          context: 'signin',
          ux_mode: 'popup',
          // No nonce parameter - this prevents Google from adding nonce to token
        });

        // Display the One Tap prompt
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            logInfo('Google One Tap not displayed');
          }
        });

        isInitialized.current = true;
      } catch (error) {
        logError('Failed to initialize Google One Tap');
      }
    };

    const handleCredentialResponse = async (response: any) => {
      try {
        // CRITICAL: Don't decode or extract nonce - just pass the raw token
        // Supabase will validate the Google ID token directly without nonce checking
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: response.credential,
          // CRITICAL: Do NOT include nonce parameter at all
        });

        if (error) {
          logError('Google One Tap authentication failed');
          
          // Fallback: Try regular OAuth as backup
          const { error: oauthError } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: window.location.origin,
            }
          });
          
          if (oauthError) {
            logError('OAuth authentication failed');
          }
        } else {
          onSuccess?.();
        }
      } catch (error) {
        logError('Authentication error occurred');
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
          // Silently handle cleanup errors
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