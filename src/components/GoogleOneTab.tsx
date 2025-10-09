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
  const nonceRef = useRef<string | null>(null);

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
        
        // CRITICAL FIX: Generate our own nonce so Google embeds it in the token
        const generateNonce = () => {
          const array = new Uint8Array(32);
          crypto.getRandomValues(array);
          return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
        };
        
        nonceRef.current = generateNonce();
        
        console.log('=== GOOGLE ONE TAP V4 INIT ===');
        console.log('Version: WITH CUSTOM NONCE');
        console.log('Current origin:', window.location.origin);
        console.log('Client ID:', clientId);
        console.log('Generated nonce (first 20 chars):', nonceRef.current.substring(0, 20) + '...');

        // CRITICAL: Pass our nonce to Google so it embeds it in the ID token
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: false,
          nonce: nonceRef.current,
        });
        
        console.log('Google One Tap initialized successfully with custom nonce');

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
        console.log('=== GOOGLE ONE TAP CALLBACK V4 ===');
        console.log('Credential received');
        console.log('Response keys:', Object.keys(response));
        console.log('Token length:', response.credential?.length || 0);
        
        // Decode JWT to extract nonce
        const decodeJWT = (token: string) => {
          try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
              return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
          } catch (e) {
            console.error('Failed to decode JWT:', e);
            return null;
          }
        };
        
        const tokenPayload = decodeJWT(response.credential);
        const tokenNonce = tokenPayload?.nonce;
        const ourNonce = nonceRef.current;
        
        console.log('Our generated nonce (first 20):', ourNonce?.substring(0, 20) + '...');
        console.log('Token nonce (first 20):', tokenNonce?.substring(0, 20) + '...');
        console.log('Nonces match:', tokenNonce === ourNonce);
        
        if (tokenNonce !== ourNonce) {
          console.error('❌ NONCE MISMATCH DETECTED!');
          console.error('Expected:', ourNonce);
          console.error('Got:', tokenNonce);
          return;
        }
        
        // CRITICAL: Use OUR generated nonce (not extracted from token)
        const authOptions: any = {
          provider: 'google',
          token: response.credential,
          nonce: ourNonce, // Use the nonce we generated and gave to Google
        };
        
        console.log('✅ Using our generated nonce for Supabase');
        console.log('Calling Supabase signInWithIdToken...');
        const { data, error } = await supabase.auth.signInWithIdToken(authOptions);

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