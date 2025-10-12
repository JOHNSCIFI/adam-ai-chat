import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface SubscriptionCheckingOverlayProps {
  onComplete?: () => void;
}

export const SubscriptionCheckingOverlay = ({ onComplete }: SubscriptionCheckingOverlayProps) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if returning from Stripe
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    
    if (sessionId) {
      setShow(true);
      
      // Show toast notification
      const toastId = toast.loading('Confirming your subscription...', {
        duration: 15000,
      });

      // Wait for subscription to be confirmed
      const checkInterval = setInterval(() => {
        // CRITICAL: Use sessionStorage with correct key to match AuthContext
        const status = JSON.parse(sessionStorage.getItem('chatl_subscription_status') || '{"subscribed":false}');
        
        if (status.subscribed) {
          clearInterval(checkInterval);
          toast.success('Subscription activated! 🎉', { id: toastId });
          setShow(false);
          onComplete?.();
        }
      }, 500);

      // Timeout after 15 seconds
      const timeout = setTimeout(() => {
        clearInterval(checkInterval);
        toast.dismiss(toastId);
        toast.info('Please refresh the page to see your subscription status', {
          duration: 5000,
        });
        setShow(false);
        onComplete?.();
      }, 15000);

      return () => {
        clearInterval(checkInterval);
        clearTimeout(timeout);
      };
    }
  }, [onComplete]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-card border rounded-lg p-8 shadow-lg max-w-md mx-4">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <div className="text-center space-y-2">
            <h3 className="text-xl font-semibold">Activating Your Subscription</h3>
            <p className="text-muted-foreground">
              Please wait while we confirm your payment...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
