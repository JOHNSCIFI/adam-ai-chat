import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface MessageLimitState {
  messageCount: number;
  isLimitReached: boolean;
  hasUnlimitedAccess: boolean;
  incrementCount: () => void;
  resetCount: () => void;
  getSessionId: () => string;
}

const MESSAGE_LIMIT = 15;

// Generate a unique session ID for anonymous users
const generateSessionId = (): string => {
  let sessionId = localStorage.getItem('anonymous_session_id');
  if (!sessionId) {
    sessionId = `anon_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    localStorage.setItem('anonymous_session_id', sessionId);
  }
  return sessionId;
};

export function useMessageLimit(): MessageLimitState {
  const { user } = useAuth();
  const [messageCount, setMessageCount] = useState(0);
  const [hasUnlimitedAccess, setHasUnlimitedAccess] = useState(false);

  useEffect(() => {
    const loadMessageCount = async () => {
      if (user) {
        // Check user's subscription status
        try {
          const { data: subscription } = await supabase
            .from('user_subscriptions')
            .select('plan, status')
            .eq('user_id', user.id)
            .single();
          
          const hasSubscription = subscription && subscription.plan !== 'free' && subscription.status === 'active';
          setHasUnlimitedAccess(hasSubscription);
          
          if (!hasSubscription) {
            // Count messages from database for authenticated users
            const { count } = await supabase
              .from('messages')
              .select('id', { count: 'exact', head: true })
              .eq('chat_id', user.id);
            
            setMessageCount(count || 0);
          }
        } catch (error) {
          console.error('Error loading subscription:', error);
          setHasUnlimitedAccess(false);
          
          // Fallback to localStorage count
          const storedCount = localStorage.getItem(`messageCount_${user.id}`);
          if (storedCount) {
            setMessageCount(parseInt(storedCount, 10));
          }
        }
      } else {
        // For anonymous users, check database using session ID
        const sessionId = generateSessionId();
        try {
          const { count } = await supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('session_id', sessionId);
          
          setMessageCount(count || 0);
        } catch (error) {
          console.error('Error loading anonymous message count:', error);
          // Fallback to localStorage
          const storedCount = localStorage.getItem('messageCount_anonymous');
          if (storedCount) {
            setMessageCount(parseInt(storedCount, 10));
          }
        }
      }
    };

    loadMessageCount();
  }, [user]);

  const incrementCount = () => {
    if (hasUnlimitedAccess) return;
    
    const newCount = messageCount + 1;
    setMessageCount(newCount);
    
    // For anonymous users, the count is managed in the database via session_id
    // For authenticated users, we'll also store locally as backup
    if (user) {
      localStorage.setItem(`messageCount_${user.id}`, newCount.toString());
    } else {
      localStorage.setItem('messageCount_anonymous', newCount.toString());
    }
  };

  const resetCount = () => {
    setMessageCount(0);
    if (user) {
      localStorage.removeItem(`messageCount_${user.id}`);
    } else {
      localStorage.removeItem('messageCount_anonymous');
    }
  };

  const getSessionId = (): string => {
    return generateSessionId();
  };

  const isLimitReached = !hasUnlimitedAccess && messageCount >= MESSAGE_LIMIT;

  return {
    messageCount,
    isLimitReached,
    hasUnlimitedAccess,
    incrementCount,
    resetCount,
    getSessionId
  };
}