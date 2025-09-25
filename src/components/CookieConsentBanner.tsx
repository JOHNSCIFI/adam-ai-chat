import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { Link } from 'react-router-dom';

const CookieConsentBanner = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setIsVisible(false);
    
    // Initialize analytics here if needed
    // analytics.init();
  };

  const handleDecline = () => {
    localStorage.setItem('cookie-consent', 'declined');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-lg p-4">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm text-foreground">
              We use cookies to enhance your experience and analyze our traffic. 
              By continuing to use our site, you agree to our{' '}
              <Link to="/cookie-policy" className="text-primary hover:underline">
                Cookie Policy
              </Link>
              .
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDecline}
              className="text-sm"
            >
              Decline
            </Button>
            <Button 
              size="sm" 
              onClick={handleAccept}
              className="text-sm bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Accept All
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleDecline}
              className="p-2"
              aria-label="Close cookie banner"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsentBanner;