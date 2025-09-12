import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
  chat_id: string;
}

export default function Chat() {
  const { chatId } = useParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatId && user) {
      fetchMessages();
    }
  }, [chatId, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    if (!chatId || !user) return;

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMessages(data as Message[]);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !chatId || !user || loading) return;

    setLoading(true);
    const userMessage = input.trim();
    setInput('');

    try {
      // Add user message to database
      const { error: userError } = await supabase
        .from('messages')
        .insert([{
          chat_id: chatId,
          content: userMessage,
          role: 'user'
        }]);

      if (userError) throw userError;

      // Send message to n8n webhook and get AI response
      const webhookResponse = await fetch('https://adsgbt.app.n8n.cloud/webhook-test/adamGPT', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          chat_id: chatId,
          user_id: user.id
        }),
      });

      if (!webhookResponse.ok) {
        throw new Error('Failed to get AI response');
      }

      const responseData = await webhookResponse.json();
      const assistantResponse = responseData.response || "I apologize, but I couldn't process your request at the moment. Please try again.";
      
      // Add assistant response to database
      const { error: assistantError } = await supabase
        .from('messages')
        .insert([{
          chat_id: chatId,
          content: assistantResponse,
          role: 'assistant'
        }]);

      if (assistantError) throw assistantError;

      // Update chat title if it's the first message
      if (messages.length === 0) {
        await supabase
          .from('chats')
          .update({ title: userMessage.slice(0, 50) + (userMessage.length > 50 ? '...' : '') })
          .eq('id', chatId);
      }

      fetchMessages();
    } catch (error: any) {
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!chatId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center max-w-2xl px-6">
          <div className="w-20 h-20 bg-gradient-to-br from-sidebar-primary to-sidebar-primary/80 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl text-sidebar-primary-foreground font-bold">A</span>
          </div>
          <h2 className="text-3xl font-bold mb-4 text-foreground">Welcome to adamGPT</h2>
          <p className="text-xl text-muted-foreground mb-8">Your intelligent AI assistant ready to help with any questions or tasks</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            <div className="bg-card border rounded-2xl p-6 text-center">
              <div className="text-2xl mb-3">💬</div>
              <h3 className="font-semibold mb-2">Natural Conversations</h3>
              <p className="text-sm text-muted-foreground">Chat naturally and get helpful responses</p>
            </div>
            <div className="bg-card border rounded-2xl p-6 text-center">
              <div className="text-2xl mb-3">⚡</div>
              <h3 className="font-semibold mb-2">Fast & Accurate</h3>
              <p className="text-sm text-muted-foreground">Get quick and reliable answers</p>
            </div>
            <div className="bg-card border rounded-2xl p-6 text-center">
              <div className="text-2xl mb-3">🔒</div>
              <h3 className="font-semibold mb-2">Secure & Private</h3>
              <p className="text-sm text-muted-foreground">Your conversations are protected</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 bg-gradient-to-br from-sidebar-primary to-sidebar-primary/80 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-sidebar-primary-foreground font-bold">A</span>
              </div>
              <h3 className="text-2xl font-semibold mb-3 text-foreground">How can I help you today?</h3>
              <p className="text-muted-foreground text-lg">Start a conversation with adamGPT to get assistance with your questions</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="group">
              <div className={`flex gap-4 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    message.role === 'user' 
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground' 
                      : 'bg-gradient-to-br from-sidebar-primary to-sidebar-primary/80 text-sidebar-primary-foreground'
                  }`}>
                    {message.role === 'user' ? (
                      <span className="text-sm font-semibold">
                        {user?.email?.slice(0, 1).toUpperCase()}
                      </span>
                    ) : (
                      <span className="text-sm font-bold">A</span>
                    )}
                  </div>
                </div>
                
                {/* Message content */}
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium mb-2 ${
                    message.role === 'user' ? 'text-right' : 'text-left'
                  }`}>
                    <span className="text-foreground">
                      {message.role === 'user' ? 'You' : 'adamGPT'}
                    </span>
                  </div>
                  <div className={`prose prose-sm max-w-none ${
                    message.role === 'user' 
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground rounded-2xl rounded-tr-md px-4 py-3 ml-auto max-w-[85%] w-fit' 
                      : 'text-foreground'
                  }`}>
                    <p className="whitespace-pre-wrap break-words m-0 leading-relaxed">
                      {message.content}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        
        {loading && (
          <div className="group">
            <div className="flex gap-4">
              {/* AI Avatar */}
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sidebar-primary to-sidebar-primary/80 text-sidebar-primary-foreground flex items-center justify-center">
                  <span className="text-sm font-bold">A</span>
                </div>
              </div>
              
              {/* Typing indicator */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium mb-2 text-foreground">adamGPT</div>
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-sidebar-primary rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-sidebar-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-sidebar-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t bg-background/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto p-4">
          <form onSubmit={sendMessage} className="relative">
            <div className="relative flex items-end gap-2 bg-muted/50 border border-border/50 rounded-2xl p-3 focus-within:border-sidebar-primary/50 transition-colors">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message adamGPT..."
                disabled={loading}
                className="flex-1 border-0 bg-transparent placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 text-base resize-none min-h-[24px] max-h-32"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(e as any);
                  }
                }}
              />
              <Button 
                type="submit" 
                disabled={!input.trim() || loading}
                size="sm"
                className={`rounded-xl h-8 w-8 p-0 transition-all ${
                  input.trim() && !loading 
                    ? 'bg-sidebar-primary hover:bg-sidebar-primary/90 text-sidebar-primary-foreground' 
                    : 'bg-muted-foreground/20 text-muted-foreground cursor-not-allowed'
                }`}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              adamGPT can make mistakes. Consider checking important information.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}