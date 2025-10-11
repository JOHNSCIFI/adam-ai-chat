import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Crown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export const GoProButton = () => {
  const navigate = useNavigate();
  const { subscriptionStatus, loadingSubscription } = useAuth();

  // Hide button while loading or if user has any subscription
  if (loadingSubscription || subscriptionStatus.subscribed) {
    return null;
  }

  return (
    <Button
      onClick={() => navigate('/pricing')}
      className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
      size="sm"
    >
      <Crown className="w-4 h-4 mr-2" />
      Go Pro
    </Button>
  );
};
