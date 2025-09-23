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

// Generate or get session ID for anonymous users
function getOrCreateSessionId(): string {
  let sessionId = localStorage.getItem('anonymous_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('anonymous_session_id', sessionId);
  }
  return sessionId;
}

export function useMessageLimit(): MessageLimitState {
  const { user } = useAuth();
  const [messageCount, setMessageCount] = useState(0);
  const [hasUnlimitedAccess, setHasUnlimitedAccess] = useState(false);

  useEffect(() => {
    const loadMessageCount = async () => {
      if (user) {
        // Check user's subscription status
        const { data: subscription } = await supabase
          .from('user_subscriptions')
          .select('plan')
          .eq('user_id', user.id)
          .single();
        
        const isSubscribed = subscription?.plan !== 'free' && !!subscription?.plan;
        setHasUnlimitedAccess(isSubscribed);
        
        // Count messages from database for authenticated users
        const { data: messages } = await supabase
          .from('messages')
          .select('id', { count: 'exact' })
          .eq('role', 'user')
          .order('created_at', { ascending: false });
        
        setMessageCount(messages?.length || 0);
      } else {
        // For non-authenticated users, count messages by session_id
        const sessionId = getOrCreateSessionId();
        const { data: messages } = await supabase
          .from('messages')
          .select('id', { count: 'exact' })
          .eq('session_id', sessionId)
          .eq('role', 'user');
        
        setMessageCount(messages?.length || 0);
        setHasUnlimitedAccess(false);
      }
    };

    loadMessageCount();
  }, [user]);

  const incrementCount = () => {
    if (hasUnlimitedAccess) return;
    setMessageCount(prev => prev + 1);
  };

  const resetCount = () => {
    setMessageCount(0);
  };

  const getSessionId = () => {
    return getOrCreateSessionId();
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