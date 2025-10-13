import React, { useState } from 'react';
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
      <button
        onClick={() => setShowPricingModal(true)}
        aria-label="Upgrade Now"
        className="flex items-center gap-4 px-8 py-4 rounded-[36px] border-[2px] border-[#f2ede9] bg-white hover:-translate-y-1 transition-transform duration-150 shadow-[0_4px_8px_rgba(0,0,0,0.03)]"
      >
        {/* Custom Rocket Icon with gold gradient */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 512 512"
          width="42"
          height="42"
          fill="url(#goldGrad)"
        >
          <defs>
            <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#b0851e" />
              <stop offset="100%" stopColor="#d4aa3a" />
            </linearGradient>
          </defs>
          <path d="M505.1 19.1c-2.5-5.2-7.5-9-13.3-10.1-5.8-1.1-11.8.7-16 4.9L354.5 135.2c-33.3-8.4-68.2-8.4-101.5 0L194 69.3c-4.2-4.2-10.2-6-16-4.9s-10.8 4.9-13.3 10.1C107.5 152.3 64 286.9 64 384c0 70.7 57.3 128 128 128 97.1 0 231.7-43.5 319.5-100.7 5.2-2.5 9-7.5 10.1-13.3 1.1-5.8-.7-11.8-4.9-16l-65.9-59.1c8.4-33.3 8.4-68.2 0-101.5l121.3-121.3c4.2-4.2 6-10.2 4.9-16zM192 448c-35.3 0-64-28.7-64-64s28.7-64 64-64 64 28.7 64 64-28.7 64-64 64z" />
        </svg>

        {/* Text with gold gradient */}
        <span
          className="font-semibold leading-tight"
          style={{
            fontSize: 36,
            background: "linear-gradient(90deg,#b0851e,#d4aa3a)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            letterSpacing: "0.4px",
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
