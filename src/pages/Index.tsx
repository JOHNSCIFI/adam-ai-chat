import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useMessageLimit } from '@/hooks/useMessageLimit';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

export default function Index() {
  const { user, loading: authLoading } = useAuth();
  const { canSendMessage, isAtLimit, sessionId, incrementMessageCount } = useMessageLimit();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  if (authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  const handleStartChat = async () => {
    if (!message.trim() || loading) return;

    if (!canSendMessage) {
      navigate('/pricing-plans');
      return;
    }

    setLoading(true);

    try {
      if (user) {
        // Authenticated user - create chat in database
        const { data: chatData, error: chatError } = await supabase
          .from('chats')
          .insert([{
            user_id: user.id,
            title: message.slice(0, 50) || 'New Chat'
          }])
          .select()
          .single();

        if (chatError) throw chatError;

        // Add initial message
        const { error: messageError } = await supabase
          .from('messages')
          .insert({
            chat_id: chatData.id,
            content: message,
            role: 'user'
          });

        if (messageError) throw messageError;

        navigate(`/chat/${chatData.id}`);
      } else if (sessionId) {
        // Anonymous user - save to anonymous messages and navigate to chat
        await supabase
          .from('anonymous_messages')
          .insert({
            session_id: sessionId,
            content: message,
            role: 'user'
          });

        incrementMessageCount();
        
        // For anonymous users, we can create a simple chat interface
        // You might want to create a special anonymous chat route
        navigate('/chat/anonymous');
      }
    } catch (error) {
      console.error('Error starting chat:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold mb-2">Welcome to AI Chat</CardTitle>
          <p className="text-muted-foreground">
            Start a conversation with AI or explore our tools
          </p>
          {!user && (
            <p className="text-sm text-muted-foreground mt-2">
              You can send up to 15 messages as a guest. Sign up for unlimited access.
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask me anything..."
            className="min-h-24 resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleStartChat();
              }
            }}
          />
          <div className="flex gap-2">
            <Button 
              className="flex-1" 
              disabled={!canSendMessage || !message.trim() || loading}
              onClick={handleStartChat}
            >
              {loading ? 'Starting...' : 'Start New Chat'}
            </Button>
            <Button variant="outline" onClick={() => navigate('/explore-tools')}>
              Explore Tools
            </Button>
          </div>
          {isAtLimit && (
            <p className="text-center text-sm text-muted-foreground">
              Message limit reached.{' '}
              <Button variant="link" className="p-0 h-auto" onClick={() => navigate('/pricing-plans')}>
                Upgrade to continue
              </Button>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}