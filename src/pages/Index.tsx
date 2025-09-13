import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MessageSquare, Send, Sparkles, Code, FileText, HelpCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
export default function Index() {
  const {
    user,
    loading
  } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  if (loading) {
    return <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>;
  }
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  const handleNewChat = async (initialMessage?: string) => {
    const {
      data,
      error
    } = await supabase.from('chats').insert([{
      user_id: user.id,
      title: initialMessage || 'New Chat'
    }]).select().single();
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
  const examplePrompts = [{
    icon: <Sparkles className="w-4 h-4" />,
    text: "Create a travel itinerary for a weekend in Paris"
  }, {
    icon: <Code className="w-4 h-4" />,
    text: "Write a Python script to analyze data"
  }, {
    icon: <FileText className="w-4 h-4" />,
    text: "Draft a professional email to a client"
  }, {
    icon: <HelpCircle className="w-4 h-4" />,
    text: "Explain quantum physics in simple terms"
  }];
  return <div className="flex-1 flex flex-col bg-background">
      {/* Header - clean like ChatGPT */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background">
        <div className="text-xl font-semibold text-foreground">AdamGPT</div>
        <div className="flex items-center space-x-4">
          
        </div>
      </div>

      {/* Main Content - centered like ChatGPT */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-32">
        <div className="w-full max-w-4xl">
          {/* Welcome Message - exactly like ChatGPT */}
          <div className="text-center mb-12">
            <h1 className="text-3xl font-normal text-foreground mb-6">Where should we begin?</h1>
          </div>

          {/* Example Prompts - ChatGPT style */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
            {examplePrompts.map((prompt, index) => {})}
          </div>
        </div>
      </div>

      {/* Input Area - ChatGPT style */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <form onSubmit={handleSubmit} className="relative">
            <div className="flex items-center border border-border rounded-2xl bg-background shadow-sm">
              <input type="text" value={message} onChange={e => setMessage(e.target.value)} placeholder="Ask anything..." className="flex-1 px-4 py-3 text-base bg-transparent border-none outline-none placeholder-muted-foreground text-foreground" />
              <button type="submit" disabled={!message.trim()} className="p-2 m-2 bg-foreground text-background rounded-lg hover:bg-foreground/90 disabled:bg-muted disabled:text-muted-foreground transition-colors">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
          <div className="text-center mt-2">
            
          </div>
        </div>
      </div>
    </div>;
}