import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MessageSquare, Send, Sparkles, Code, FileText, HelpCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function Index() {
  const { user, loading } = useAuth();
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

  const examplePrompts = [
    {
      icon: <Sparkles className="w-4 h-4" />,
      text: "Create a travel itinerary for a weekend in Paris"
    },
    {
      icon: <Code className="w-4 h-4" />,
      text: "Write a Python script to analyze data"
    },
    {
      icon: <FileText className="w-4 h-4" />,
      text: "Draft a professional email to a client"
    },
    {
      icon: <HelpCircle className="w-4 h-4" />,
      text: "Explain quantum physics in simple terms"
    }
  ];

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div className="text-xl font-semibold text-black">AdamGPT</div>
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            onClick={() => handleNewChat()}
            className="text-gray-700 border-gray-300 hover:bg-gray-50"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            New chat
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-32">
        <div className="w-full max-w-3xl">
          {/* Welcome Message */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-normal text-black mb-6">How can I help you today?</h1>
          </div>

          {/* Example Prompts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
            {examplePrompts.map((prompt, index) => (
              <button
                key={index}
                onClick={() => handleNewChat(prompt.text)}
                className="p-4 text-left border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-start space-x-3">
                  <div className="text-gray-500 mt-0.5 group-hover:text-gray-700">
                    {prompt.icon}
                  </div>
                  <span className="text-gray-700 text-sm leading-relaxed">
                    {prompt.text}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <form onSubmit={handleSubmit} className="relative">
            <div className="flex items-center border border-gray-300 rounded-2xl bg-white shadow-sm">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Message AdamGPT..."
                className="flex-1 px-4 py-3 text-base bg-transparent border-none outline-none placeholder-gray-500"
              />
              <button
                type="submit"
                disabled={!message.trim()}
                className="p-2 m-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:text-gray-500 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
          <div className="text-center mt-2">
            <p className="text-xs text-gray-500">
              AdamGPT can make mistakes. Check important info.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}