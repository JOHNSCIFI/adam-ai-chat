import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

interface GoogleAutoLoginProps {
  onClose: () => void;
}

export default function GoogleAutoLogin({ onClose }: GoogleAutoLoginProps) {
  const { signInWithGoogle } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show popup after a short delay for smooth animation
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleGoogleSignIn = async () => {
    const { error } = await signInWithGoogle();
    if (!error) {
      onClose();
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 200); // Wait for animation to complete
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <div 
        className={`
          bg-gray-900 border border-gray-700 rounded-lg shadow-2xl p-4 w-80
          transition-all duration-200 ease-out
          ${isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">G</span>
            </div>
            <span className="text-white text-sm font-medium">
              Sign in to Adam AI with google.com
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-6 w-6 p-0 text-gray-400 hover:text-white hover:bg-gray-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Google Sign In Option */}
        <div 
          onClick={handleGoogleSignIn}
          className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors group"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-semibold text-lg">G</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-sm font-medium group-hover:text-blue-400 transition-colors">
              Continue with Google
            </div>
            <div className="text-gray-400 text-xs">
              Sign in to your Google account
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="my-3 border-t border-gray-700"></div>

        {/* Footer text */}
        <div className="text-xs text-gray-500 text-center">
          Choose an account to continue to Adam AI
        </div>
      </div>
    </div>
  );
}