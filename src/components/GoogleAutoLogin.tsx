import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

interface GoogleAutoLoginProps {
  onClose: () => void;
}

// Mock Google accounts for demonstration
const mockGoogleAccounts = [
  {
    id: '1',
    name: 'John Smith',
    email: 'johnsmith@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=face',
    color: 'from-blue-500 to-purple-600'
  },
  {
    id: '2',
    name: 'Sarah Wilson',
    email: 'sarah.wilson@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b5bc?w=64&h=64&fit=crop&crop=face',
    color: 'from-pink-500 to-rose-600'
  },
  {
    id: '3',
    name: 'Mike Johnson',
    email: 'mike.johnson@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=face',
    color: 'from-green-500 to-teal-600'
  }
];

export default function GoogleAutoLogin({ onClose }: GoogleAutoLoginProps) {
  const { signInWithGoogle } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show popup after a short delay for smooth animation
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleAccountSelect = async (account: typeof mockGoogleAccounts[0]) => {
    // In a real implementation, you would handle specific account selection
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
          bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 
          rounded-lg shadow-2xl w-80 overflow-hidden
          transition-all duration-200 ease-out
          ${isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-gray-700 dark:text-gray-200 text-sm font-medium">
              Sign in to Adam AI with google.com
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Account List */}
        <div className="p-2">
          {mockGoogleAccounts.map((account, index) => (
            <div
              key={account.id}
              onClick={() => handleAccountSelect(account)}
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors group animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border-2 border-gray-200 dark:border-gray-600">
                <img 
                  src={account.avatar} 
                  alt={account.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to gradient avatar if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `<div class="w-full h-full bg-gradient-to-br ${account.color} flex items-center justify-center text-white font-semibold text-lg">${account.name.charAt(0)}</div>`;
                    }
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-gray-900 dark:text-white text-sm font-medium truncate">
                  {account.name}
                </div>
                <div className="text-gray-500 dark:text-gray-400 text-xs truncate">
                  {account.email}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
          <div className="text-xs text-gray-600 dark:text-gray-400 text-center">
            Choose an account to continue to Adam AI
          </div>
        </div>
      </div>
    </div>
  );
}