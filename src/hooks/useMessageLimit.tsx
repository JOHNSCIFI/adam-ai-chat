import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

// Generate browser-based session ID
const generateSessionId = () => {
  const stored = localStorage.getItem('anonymous_session_id');
  if (stored) return stored;
  
  const newId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem('anonymous_session_id', newId);
  return newId;
};

export const useMessageLimit = () => {
  const { user, userProfile } = useAuth();
  const [messageCount, setMessageCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const sessionId = !user ? generateSessionId() : null;
  
  // Free tier limits
  const FREE_MESSAGE_LIMIT = 15;
  
  // Check if user has subscription
  const hasSubscription = user && userProfile && 
    (userProfile.plan === 'pro' || userProfile.plan === 'ultra_pro');

  useEffect(() => {
    const fetchMessageCount = async () => {
      try {
        if (user) {
          // Authenticated user - get from messages table
          const { count, error } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('chat_id', user.id); // This might need adjustment based on how you count messages

          if (error) {
            console.error('Error fetching message count:', error);
          } else {
            setMessageCount(count || 0);
          }
        } else if (sessionId) {
          // Anonymous user - get from anonymous_messages table
          const { count, error } = await supabase
            .from('anonymous_messages')
            .select('*', { count: 'exact', head: true })
            .eq('session_id', sessionId)
            .eq('role', 'user');

          if (error) {
            console.error('Error fetching anonymous message count:', error);
          } else {
            setMessageCount(count || 0);
          }
        }
      } catch (error) {
        console.error('Error in fetchMessageCount:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessageCount();
  }, [user, sessionId]);

  const canSendMessage = () => {
    if (hasSubscription) return true;
    return messageCount < FREE_MESSAGE_LIMIT;
  };

  const incrementMessageCount = () => {
    setMessageCount(prev => prev + 1);
  };

  const isAtLimit = () => {
    if (hasSubscription) return false;
    return messageCount >= FREE_MESSAGE_LIMIT;
  };

  return {
    messageCount,
    canSendMessage: canSendMessage(),
    isAtLimit: isAtLimit(),
    hasSubscription,
    incrementMessageCount,
    loading,
    sessionId,
    limit: FREE_MESSAGE_LIMIT
  };
};