import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface GoogleAutoLoginProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GoogleAutoLogin({ isOpen, onClose }: GoogleAutoLoginProps) {
  const [loading, setLoading] = useState(false);
  const { signInWithGoogle } = useAuth();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (!error) {
        onClose();
      }
    } catch (error) {
      console.error('Google sign-in failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-trigger Google sign-in when modal opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        handleGoogleSignIn();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-[#2d2d2d] border-[#444] text-white">
        <div className="p-6">
          {/* Header with Google branding */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-white font-medium">Sign in to askdori.ai with google.com</span>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Account options */}
          <div className="space-y-3 mb-6">
            {/* Sample Google accounts - in real implementation, these would come from Google's account chooser */}
            <div 
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-[#3d3d3d] cursor-pointer transition-colors"
              onClick={handleGoogleSignIn}
            >
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                U
              </div>
              <div className="flex-1">
                <div className="font-medium text-white">Use your Google account</div>
                <div className="text-sm text-gray-400">Sign in with Google OAuth</div>
              </div>
            </div>

            <div 
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-[#3d3d3d] cursor-pointer transition-colors border border-[#444]"
              onClick={handleGoogleSignIn}
            >
              <svg className="w-8 h-8" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <div className="flex-1">
                <div className="font-medium text-white">Continue with Google</div>
                <div className="text-sm text-gray-400">Quick sign in option</div>
              </div>
            </div>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="text-center py-4">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-400">Connecting to Google...</p>
            </div>
          )}

          {/* Footer options */}
          <div className="border-t border-[#444] pt-4 space-y-2">
            <button 
              onClick={onClose}
              className="w-full text-left p-2 text-sm text-gray-400 hover:text-white hover:bg-[#3d3d3d] rounded"
            >
              Use another account
            </button>
            <button 
              onClick={onClose}
              className="w-full text-left p-2 text-sm text-gray-400 hover:text-white hover:bg-[#3d3d3d] rounded"
            >
              Sign in with email instead
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}