import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
interface GoogleAutoLoginProps {
  onClose: () => void;
}
interface GoogleAccount {
  id: string;
  name: string;
  email: string;
  picture?: string;
}
declare global {
  interface Window {
    google: any;
  }
}
export default function GoogleAutoLogin({
  onClose
}: GoogleAutoLoginProps) {
  const {
    signInWithGoogle
  } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [googleAccounts, setGoogleAccounts] = useState<GoogleAccount[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  useEffect(() => {
    // Show popup after a short delay for smooth animation
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    // Load Google Identity Services library
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogleOneTap;
    document.head.appendChild(script);
    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);
  const initializeGoogleOneTap = () => {
    if (window.google) {
      // Initialize Google Identity Services
      window.google.accounts.id.initialize({
        client_id: process.env.GOOGLE_CLIENT_ID || '951036895540-4fpamfc4o55vm8pdbcvdd25gd5fsbsu4.apps.googleusercontent.com',
        callback: handleCredentialResponse,
        auto_select: false
      });

      // Try to show Google One Tap first (shows user's signed-in accounts)
      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // If One Tap fails, try to get accounts from previous sessions
          const storedAccounts = localStorage.getItem('google_accounts');
          if (storedAccounts) {
            try {
              const accounts = JSON.parse(storedAccounts);
              setGoogleAccounts(accounts);
              setIsLoadingAccounts(false);
            } catch (e) {
              console.error('Error parsing stored accounts:', e);
              setIsLoadingAccounts(false);
            }
          } else {
            setIsLoadingAccounts(false);
          }
        }
      });

      // Also render One Tap UI directly in the component
      setTimeout(() => {
        window.google.accounts.id.renderButton(document.getElementById('google-signin-button'), {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
          width: '280'
        });
      }, 100);
    }
  };
  const showAccountChooser = () => {
    if (window.google) {
      // Use Google's account chooser to show real user accounts
      window.google.accounts.oauth2.initTokenClient({
        client_id: process.env.GOOGLE_CLIENT_ID || '951036895540-4fpamfc4o55vm8pdbcvdd25gd5fsbsu4.apps.googleusercontent.com',
        scope: 'email profile',
        callback: (response: any) => {
          if (response.access_token) {
            fetchGoogleAccounts(response.access_token);
          }
        }
      }).requestAccessToken();
    }
  };
  const fetchGoogleAccounts = async (accessToken: string) => {
    try {
      // Fetch user's Google account info using People API
      const response = await fetch('https://people.googleapis.com/v1/people/me?personFields=names,emailAddresses,photos', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        const account = {
          id: data.resourceName || '1',
          name: data.names?.[0]?.displayName || 'Google User',
          email: data.emailAddresses?.[0]?.value || '',
          picture: data.photos?.[0]?.url
        };
        setGoogleAccounts([account]);
      }
    } catch (error) {
      console.error('Error fetching Google account info:', error);
      // Fallback to regular Google sign-in
      signInWithGoogle();
    } finally {
      setIsLoadingAccounts(false);
    }
  };
  const handleCredentialResponse = async (response: any) => {
    // Handle the credential response from Google One Tap
    try {
      // Decode the JWT token to get user info
      const payload = JSON.parse(atob(response.credential.split('.')[1]));

      // Sign in with the Google credential
      const {
        error
      } = await signInWithGoogle();
      if (!error) {
        // Store the user account info
        const account = {
          id: payload.sub,
          name: payload.name,
          email: payload.email,
          picture: payload.picture
        };
        localStorage.setItem('google_accounts', JSON.stringify([account]));
        onClose();
      }
    } catch (error) {
      console.error('Error processing Google credential:', error);
    }
  };
  const handleAccountSelect = async (account: GoogleAccount) => {
    // Prompt for Google sign-in for the selected account
    const {
      error
    } = await signInWithGoogle();
    if (!error) {
      // Store the selected account for future reference
      const updatedAccounts = [account, ...googleAccounts.filter(a => a.id !== account.id)];
      localStorage.setItem('google_accounts', JSON.stringify(updatedAccounts.slice(0, 3)));
      onClose();
    }
  };
  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 200);
  };
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };
  return <div className="fixed top-4 right-4 z-50">
      
    </div>;
}