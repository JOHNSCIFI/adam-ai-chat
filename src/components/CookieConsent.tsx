import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { X, Cookie, Settings } from 'lucide-react';

interface CookiePreferences {
  essential: boolean;
  functional: boolean;
  analytics: boolean;
}

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true, // Always true, cannot be disabled
    functional: false,
    analytics: false,
  });

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      // Show banner after a short delay
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // Load saved preferences
      try {
        const savedPreferences = JSON.parse(consent);
        setPreferences(savedPreferences);
        applyCookieSettings(savedPreferences);
      } catch (error) {
        console.error('Error parsing cookie consent:', error);
      }
    }
  }, []);

  const applyCookieSettings = (prefs: CookiePreferences) => {
    // Apply cookie settings based on preferences
    if (!prefs.functional) {
      // Remove functional cookies
      localStorage.removeItem('theme-preference');
      localStorage.removeItem('sidebar-state');
      localStorage.removeItem('user-preferences');
    }

    if (!prefs.analytics) {
      // Remove analytics cookies (if any are added in the future)
      // Currently we don't use analytics cookies
    }

    // Log consent for compliance
    console.log('Cookie consent applied:', prefs);
  };

  const handleAcceptAll = () => {
    const allAccepted = {
      essential: true,
      functional: true,
      analytics: false, // We don't currently use analytics
    };
    
    setPreferences(allAccepted);
    localStorage.setItem('cookie-consent', JSON.stringify(allAccepted));
    localStorage.setItem('cookie-consent-date', new Date().toISOString());
    applyCookieSettings(allAccepted);
    setShowBanner(false);
  };

  const handleRejectNonEssential = () => {
    const essentialOnly = {
      essential: true,
      functional: false,
      analytics: false,
    };
    
    setPreferences(essentialOnly);
    localStorage.setItem('cookie-consent', JSON.stringify(essentialOnly));
    localStorage.setItem('cookie-consent-date', new Date().toISOString());
    applyCookieSettings(essentialOnly);
    setShowBanner(false);
  };

  const handleSavePreferences = () => {
    localStorage.setItem('cookie-consent', JSON.stringify(preferences));
    localStorage.setItem('cookie-consent-date', new Date().toISOString());
    applyCookieSettings(preferences);
    setShowPreferences(false);
    setShowBanner(false);
  };

  const handlePreferenceChange = (type: keyof CookiePreferences, value: boolean) => {
    if (type === 'essential') return; // Essential cookies cannot be disabled
    
    setPreferences(prev => ({
      ...prev,
      [type]: value,
    }));
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Cookie Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
        <Card className="mx-auto max-w-4xl border-2 shadow-lg">
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <Cookie className="h-8 w-8 text-primary" />
              </div>
              
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">We use cookies</h3>
                  <p className="text-sm text-muted-foreground">
                    We use essential cookies to make our service work. We'd also like to use functional cookies to remember your preferences and improve your experience. You can review our{' '}
                    <a href="/cookies" className="text-primary hover:underline" target="_blank">
                      Cookie Policy
                    </a>{' '}
                    and{' '}
                    <a href="/privacy" className="text-primary hover:underline" target="_blank">
                      Privacy Policy
                    </a>{' '}
                    for more details.
                  </p>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Button onClick={handleAcceptAll} size="sm">
                    Accept All
                  </Button>
                  <Button 
                    onClick={handleRejectNonEssential} 
                    variant="outline" 
                    size="sm"
                  >
                    Reject Non-Essential
                  </Button>
                  <Button 
                    onClick={() => setShowPreferences(true)}
                    variant="ghost" 
                    size="sm"
                    className="gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Manage Preferences
                  </Button>
                </div>
              </div>
              
              <Button
                onClick={() => setShowBanner(false)}
                variant="ghost"
                size="sm"
                className="flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Preferences Modal */}
      <Dialog open={showPreferences} onOpenChange={setShowPreferences}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cookie className="h-5 w-5" />
              Cookie Preferences
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Choose which cookies you'd like to allow. Essential cookies are required for the service to function.
            </p>
            
            <div className="space-y-4">
              {/* Essential Cookies */}
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">Essential Cookies</h4>
                    <span className="text-xs bg-destructive text-destructive-foreground px-2 py-0.5 rounded">
                      Required
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Necessary for authentication, security, and basic functionality. Cannot be disabled.
                  </p>
                </div>
                <Switch 
                  checked={true} 
                  disabled 
                  className="opacity-50"
                />
              </div>

              {/* Functional Cookies */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">Functional Cookies</h4>
                    <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded">
                      Optional
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Remember your preferences like theme settings and interface customizations.
                  </p>
                </div>
                <Switch 
                  checked={preferences.functional}
                  onCheckedChange={(value) => handlePreferenceChange('functional', value)}
                />
              </div>

              {/* Analytics Cookies */}
              <div className="flex items-center justify-between p-4 border rounded-lg opacity-50">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">Analytics Cookies</h4>
                    <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded">
                      Not Used
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    We don't currently use analytics cookies. This is here for future use.
                  </p>
                </div>
                <Switch 
                  checked={false}
                  disabled
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                <a href="/cookies" className="text-primary hover:underline" target="_blank">
                  Learn more about cookies
                </a>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={() => setShowPreferences(false)} 
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button onClick={handleSavePreferences}>
                  Save Preferences
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}