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
    <div className="flex-1 flex flex-col bg-black min-h-screen">
      {/* Main Content - centered and minimalist */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="text-center mb-32">
          <h1 className="text-2xl font-normal text-white">
            How can I help, {userProfile?.display_name || user?.email?.split('@')[0] || 'there'}?
          </h1>
        </div>
      </div>

      {/* Input Area - minimalist design */}
      <div className="fixed bottom-0 left-0 right-0 bg-black">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <form onSubmit={handleSubmit} className="relative">
            <div className="flex items-center bg-gray-800 border border-gray-700 rounded-full shadow-sm">
              <div className="pl-4">
                <div className="w-5 h-5 text-gray-400">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 5v14m-7-7h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
              </div>
              
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask anything..."
                className="flex-1 bg-transparent border-none outline-none py-4 px-4 text-white placeholder-gray-400"
              />
              
              <Button
                type="submit"
                disabled={!message.trim()}
                size="sm"
                className="h-8 w-8 p-0 m-2 rounded-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600"
              >
                <Send className="h-4 w-4 text-white" />
              </Button>
            </div>
          </form>
          
          <p className="text-xs text-gray-500 text-center mt-3">
            AdamGPT can make mistakes. Check important info.
          </p>
        </div>
      </div>
    </div>
  );
}