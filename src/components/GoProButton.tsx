import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Rocket } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PricingModal } from './PricingModal';

export const GoProButton = () => {
  const { subscriptionStatus, loadingSubscription } = useAuth();
  const [showPricingModal, setShowPricingModal] = useState(false);

  // Hide button while loading or if user has any subscription
  if (loadingSubscription || subscriptionStatus.subscribed) {
    return null;
  }

  return (
    <>
      <Button
        onClick={() => setShowPricingModal(true)}
        variant="premium"
        className="font-semibold text-lg px-6 py-5 rounded-[28px]"
      >
        <Rocket className="w-6 h-6 mr-2 text-gold fill-gold" />
        Upgrade Now
      </Button>
      
      <PricingModal 
        open={showPricingModal} 
        onOpenChange={setShowPricingModal} 
      />
    </>
  );
};
