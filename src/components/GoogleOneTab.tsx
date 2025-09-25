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
        // Get Google Client ID from Supabase settings
        const { data: { session } } = await supabase.auth.getSession();
        
        // For now, we'll get the client ID from environment or use a placeholder
        // In production, this should come from your Google OAuth app settings
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "your-google-client-id.apps.googleusercontent.com";
        
        if (!clientId || clientId === "your-google-client-id.apps.googleusercontent.com") {
          console.warn('Google Client ID not configured for One Tap');
          return;
        }

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
          prompt_parent_id: oneTabRef.current?.id,
        });

        // Display the One Tap prompt
        window.google.accounts.id.prompt((notification: any) => {
          console.log('Google One Tap notification:', notification);
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            console.log('Google One Tap was not displayed or was skipped');
          }
        });

        isInitialized.current = true;
      } catch (error) {
        console.error('Error initializing Google One Tap:', error);
      }
    };

    const handleCredentialResponse = async (response: any) => {
      try {
        console.log('Google One Tap credential received');
        
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: response.credential,
        });

        if (error) {
          console.error('Error signing in with Google One Tap:', error);
          // Fallback to regular Google OAuth
          await signInWithGoogle();
        } else {
          console.log('Successfully signed in with Google One Tap');
          onSuccess?.();
        }
      } catch (error) {
        console.error('Error processing Google One Tap response:', error);
        // Fallback to regular Google OAuth
        await signInWithGoogle();
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