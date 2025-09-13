import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Send, Sparkles, Code, FileText, HelpCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function Index() {
  const { user, loading, userProfile } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleNewChat = async (initialMessage?: string) => {
    const { data, error } = await supabase
      .from('chats')
      .insert([{
        user_id: user.id,
        title: initialMessage || 'New Chat'
      }])
      .select()
      .single();

    if (!error && data) {
      navigate(`/chat/${data.id}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      handleNewChat(message.trim());
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Header - clean like ChatGPT */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background">
        <div className="text-xl font-semibold text-foreground">AdamGPT</div>
        <div className="flex items-center space-x-4">
          
        </div>
      </div>

      {/* Main Content - centered like ChatGPT */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-32">
        <div className="w-full max-w-4xl">
          {/* Welcome Message */}
          <div className="text-center mb-12">
            <h1 className="text-3xl font-normal text-foreground mb-6">
              How can I help, {userProfile?.display_name || user?.email?.split('@')[0] || 'there'}?
            </h1>
          </div>
        </div>
      </div>

      {/* Input Area - ChatGPT style */}
      <div className="fixed bottom-0 left-0 right-0 bg-background">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <form onSubmit={handleSubmit} className="relative">
            <div className="flex items-center gap-2 bg-background border border-border rounded-3xl shadow-sm">
              <div className="flex-1 flex items-center">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask anything..."
                  className="flex-1 bg-transparent border-none outline-none py-3 px-4 text-foreground placeholder-muted-foreground resize-none"
                />
              </div>
              
              <Button
                type="submit"
                disabled={!message.trim()}
                size="sm"
                className="h-8 w-8 p-0 m-2 rounded-full"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
          
          <p className="text-xs text-muted-foreground text-center mt-2">
            AdamGPT can make mistakes. Check important info.
          </p>
        </div>
      </div>
    </div>
  );
}