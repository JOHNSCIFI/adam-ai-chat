import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PricingModal } from './PricingModal';
import rocketIcon from '@/assets/rocket-icon.png';

export const GoProButton = () => {
  const { subscriptionStatus, loadingSubscription } = useAuth();
  const [showPricingModal, setShowPricingModal] = useState(false);

  // Hide button while loading or if user has any subscription
  if (loadingSubscription || subscriptionStatus.subscribed) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setShowPricingModal(true)}
        aria-label="Upgrade Now"
        className="flex items-center gap-2 px-4 py-2 rounded-[20px] bg-transparent hover:-translate-y-0.5 transition-transform duration-150"
      >
        {/* Rocket Icon */}
        <img 
          src={rocketIcon} 
          alt="Rocket" 
          className="w-5 h-5"
          style={{
            filter: "brightness(0) saturate(100%) invert(49%) sepia(56%) saturate(475%) hue-rotate(7deg) brightness(95%) contrast(89%)"
          }}
        />

        {/* Text with gold gradient */}
        <span
          className="font-semibold leading-tight"
          style={{
            fontSize: 18,
            background: "linear-gradient(90deg,#b0851e,#d4aa3a)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            letterSpacing: "0.3px",
          }}
        >
          Upgrade Now
        </span>
      </button>
      
      <PricingModal 
        open={showPricingModal} 
        onOpenChange={setShowPricingModal} 
      />
    </>
  );
};
