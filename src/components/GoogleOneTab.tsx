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
        
        console.log('=== GOOGLE ONE TAP V3 INIT ===');
        console.log('Version: NO NONCE MODE');
        console.log('Current origin:', window.location.origin);
        console.log('Client ID:', clientId);

        // CRITICAL: No nonce parameter - Google One Tap doesn't properly support custom nonces
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: false,
        });
        
        console.log('Google One Tap initialized successfully');

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
        console.log('=== GOOGLE ONE TAP CALLBACK V3 ===');
        console.log('Credential received');
        console.log('Response keys:', Object.keys(response));
        console.log('Token length:', response.credential?.length || 0);
        
        // CRITICAL: No nonce parameter - this is the fix for "nonces mismatch" error
        console.log('Calling Supabase signInWithIdToken WITHOUT nonce...');
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: response.credential,
        });

        console.log('Supabase response:', { 
          hasData: !!data, 
          hasError: !!error,
          errorMessage: error?.message 
        });

        if (error) {
          console.error('❌ Google One Tap sign in FAILED:', error.message);
          console.error('Full error:', error);
        } else {
          console.log('✅ Successfully signed in with Google One Tap');
          console.log('User data:', data);
          onSuccess?.();
        }
      } catch (error) {
        console.error('❌ Error processing Google One Tap response:', error);
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