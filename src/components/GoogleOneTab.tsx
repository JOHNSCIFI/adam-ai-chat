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
        const clientId = "217944304340-s9hdphrnpakgegrk3e64pujvu0g7rp99.apps.googleusercontent.com";
        
        console.log('=== GOOGLE ONE TAP V5 INIT (FINAL FIX) ===');
        console.log('Version: NO NONCE - Clean ID Token Only');
        console.log('Current origin:', window.location.origin);
        console.log('Client ID:', clientId);

        // CRITICAL: Do NOT provide nonce - let Google generate token without nonce field
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: false,
          // No nonce parameter - this prevents Google from adding nonce to token
        });
        
        console.log('Google One Tap initialized (no nonce mode)');

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
        console.log('=== GOOGLE ONE TAP CALLBACK V5 (FINAL FIX) ===');
        console.log('Credential received');
        console.log('Token length:', response.credential?.length || 0);
        
        // CRITICAL: Don't decode or extract nonce - just pass the raw token
        // Supabase will validate the Google ID token directly without nonce checking
        console.log('Calling Supabase signInWithIdToken (NO NONCE PARAM)...');
        
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: response.credential,
          // CRITICAL: Do NOT include nonce parameter at all
        });

        console.log('Supabase response:', { 
          hasData: !!data, 
          hasError: !!error,
          errorMessage: error?.message,
          hasUser: !!data?.user
        });

        if (error) {
          console.error('❌ Google One Tap sign in FAILED:', error.message);
          console.error('Full error:', error);
          
          // Fallback: Try regular OAuth as backup
          console.log('⚠️ Attempting fallback to regular Google OAuth...');
          const { error: oauthError } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: window.location.origin,
            }
          });
          
          if (oauthError) {
            console.error('❌ OAuth fallback also failed:', oauthError);
          }
        } else {
          console.log('✅ Successfully signed in with Google One Tap!');
          console.log('User:', data?.user?.email);
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