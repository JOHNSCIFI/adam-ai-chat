import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface MessageLimitState {
  messageCount: number;
  isLimitReached: boolean;
  hasUnlimitedAccess: boolean;
  incrementCount: () => void;
  resetCount: () => void;
}

const MESSAGE_LIMIT = 15;

export function useMessageLimit(): MessageLimitState {
  const { user } = useAuth();
  const [messageCount, setMessageCount] = useState(0);
  const [hasUnlimitedAccess, setHasUnlimitedAccess] = useState(false);

  useEffect(() => {
    if (user) {
      // Check user's subscription status
      // For now, we'll assume all authenticated users are free tier
      // In a real app, you'd check their subscription status
      setHasUnlimitedAccess(false);
      
      // Load message count from localStorage or database
      const storedCount = localStorage.getItem(`messageCount_${user.id}`);
      if (storedCount) {
        setMessageCount(parseInt(storedCount, 10));
      }
    } else {
      // For non-authenticated users, use session storage
      const storedCount = sessionStorage.getItem('messageCount_anonymous');
      if (storedCount) {
        setMessageCount(parseInt(storedCount, 10));
      }
    }
  }, [user]);

  const incrementCount = () => {
    if (hasUnlimitedAccess) return;
    
    const newCount = messageCount + 1;
    setMessageCount(newCount);
    
    // Store the count
    if (user) {
      localStorage.setItem(`messageCount_${user.id}`, newCount.toString());
    } else {
      sessionStorage.setItem('messageCount_anonymous', newCount.toString());
    }
  };

  const resetCount = () => {
    setMessageCount(0);
    if (user) {
      localStorage.removeItem(`messageCount_${user.id}`);
    } else {
      sessionStorage.removeItem('messageCount_anonymous');
    }
  };

  const isLimitReached = !hasUnlimitedAccess && messageCount >= MESSAGE_LIMIT;

  return {
    messageCount,
    isLimitReached,
    hasUnlimitedAccess,
    incrementCount,
    resetCount
  };
}