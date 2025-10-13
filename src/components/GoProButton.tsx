import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Crown } from 'lucide-react';
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
        className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
        size="sm"
      >
        <Crown className="w-4 h-4 mr-2" />
        Go Pro
      </Button>
      
      <PricingModal 
        open={showPricingModal} 
        onOpenChange={setShowPricingModal} 
      />
    </>
  );
};
