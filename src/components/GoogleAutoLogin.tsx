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

export default function GoogleAutoLogin({ onClose }: GoogleAutoLoginProps) {
  const { signInWithGoogle } = useAuth();
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
        auto_select: false,
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
        window.google.accounts.id.renderButton(
          document.getElementById('google-signin-button'),
          { 
            type: 'standard',
            theme: 'outline', 
            size: 'large',
            text: 'signin_with',
            shape: 'rectangular',
            width: '280'
          }
        );
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
      const { error } = await signInWithGoogle();
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
    const { error } = await signInWithGoogle();
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

  return (
    <div className="fixed top-4 right-4 z-50">
      <div 
        className={`
          bg-white dark:bg-white border border-gray-200 rounded-2xl shadow-lg w-80 overflow-hidden
          transition-all duration-200 ease-out
          ${isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2'}
        `}
        style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-gray-700 text-base font-medium">
              Sign in
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Subtitle */}
        <div className="px-6 pt-4 pb-2">
          <p className="text-sm text-gray-600">Choose an account to continue to <span className="font-medium">Adam AI</span></p>
        </div>

        {/* Account List */}
        <div className="px-6 pb-6">
          {isLoadingAccounts ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
              <span className="ml-2 text-sm text-gray-500">Loading accounts...</span>
            </div>
          ) : (
            <div className="space-y-2">
              {googleAccounts.length > 0 ? (
                <>
                  {googleAccounts.map((account, index) => (
                    <div
                      key={account.id}
                      onClick={() => handleAccountSelect(account)}
                      className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors group animate-fade-in border border-gray-100 hover:border-gray-200"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-gray-200 flex items-center justify-center">
                        {account.picture ? (
                          <img 
                            src={account.picture} 
                            alt={account.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = `<div class="w-full h-full bg-blue-500 flex items-center justify-center text-white font-medium text-sm">${getInitials(account.name)}</div>`;
                              }
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-blue-500 flex items-center justify-center text-white font-medium text-sm">
                            {getInitials(account.name)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-gray-900 text-sm font-medium truncate">
                          {account.name}
                        </div>
                        <div className="text-gray-500 text-xs truncate">
                          {account.email}
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <>
                  {/* Google Sign-in Button when no accounts found */}
                  <div id="google-signin-button" className="mb-4"></div>
                  
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500 mb-3">
                      Sign in with your Google account to continue
                    </p>
                  </div>
                </>
              )}
              
              {/* Use another account option */}
              <div
                onClick={() => signInWithGoogle()}
                className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors border border-gray-100 hover:border-gray-200 mt-4"
              >
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-gray-700 text-sm font-medium">
                    Use another account
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}