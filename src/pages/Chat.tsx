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

  // Set up real-time subscription for messages
  useEffect(() => {
    if (!chatId || !user) return;

    const channel = supabase
      .channel('chat-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`
        },
        (payload) => {
          console.log('Trigger: New Message Received');
          setMessages(current => {
            const exists = current.find(m => m.id === payload.new.id);
            if (!exists) {
              return [...current, payload.new as Message];
            }
            return current;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, user]);

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

      // Send message to n8n webhook with retry logic
      console.log('Trigger: Send Message to AI');
      console.log('Sending webhook request to:', 'https://adsgbt.app.n8n.cloud/webhook/message');
      console.log('Webhook payload:', { message: userMessage, chat_id: chatId, user_id: user.id });
      
      let assistantResponse = '';
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
          
          const webhookResponse = await fetch('https://adsgbt.app.n8n.cloud/webhook/message', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: userMessage,
              chat_id: chatId,
              user_id: user.id
            }),
            signal: controller.signal
          });

          clearTimeout(timeoutId);
          console.log('Webhook response status:', webhookResponse.status);

          if (!webhookResponse.ok) {
            const errorText = await webhookResponse.text();
            console.error('Webhook error response:', errorText);
            throw new Error(`Webhook failed with status ${webhookResponse.status}`);
          }

          const responseData = await webhookResponse.json();
          console.log('Webhook response data:', responseData);

          // Handle different response formats from n8n webhook
          if (Array.isArray(responseData)) {
            assistantResponse = responseData[0]?.output || responseData[0]?.value || responseData[0]?.message || '';
          } else {
            assistantResponse = responseData.output || responseData.value || responseData.message || responseData.response || '';
          }
          
          if (assistantResponse) {
            break; // Success, exit retry loop
          }
          
        } catch (webhookError: any) {
          console.error(`Webhook attempt ${retryCount + 1} failed:`, webhookError);
          retryCount++;
          
          if (retryCount < maxRetries) {
            // Wait before retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
          }
        }
      }
      
      if (!assistantResponse) {
        assistantResponse = "I apologize, but I'm having trouble connecting right now. Please try again in a moment.";
      }
      
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

    } catch (error: any) {
      console.error('Send message error:', error);
      toast({
        title: "Error sending message",
        description: "Unable to send message. Please try again.",
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
          <div className="w-16 h-16 bg-gradient-to-br from-sidebar-primary to-sidebar-primary/80 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl text-sidebar-primary-foreground font-bold">A</span>
          </div>
          <h2 className="text-xl font-bold mb-3 text-foreground">Welcome to adamGPT</h2>
          <p className="text-sm text-muted-foreground mb-6">Your intelligent AI assistant ready to help with any questions or tasks</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-3xl mx-auto">
            <div className="bg-card border rounded-xl p-4 text-center">
              <div className="text-lg mb-2">💬</div>
              <h3 className="font-medium text-sm mb-1">Natural Conversations</h3>
              <p className="text-xs text-muted-foreground">Chat naturally and get helpful responses</p>
            </div>
            <div className="bg-card border rounded-xl p-4 text-center">
              <div className="text-lg mb-2">⚡</div>
              <h3 className="font-medium text-sm mb-1">Fast & Accurate</h3>
              <p className="text-xs text-muted-foreground">Get quick and reliable answers</p>
            </div>
            <div className="bg-card border rounded-xl p-4 text-center">
              <div className="text-lg mb-2">🔒</div>
              <h3 className="font-medium text-sm mb-1">Secure & Private</h3>
              <p className="text-xs text-muted-foreground">Your conversations are protected</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full min-h-[400px]">
              <div className="text-center max-w-md">
                <div className="w-12 h-12 bg-gradient-to-br from-sidebar-primary to-sidebar-primary/80 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-lg text-sidebar-primary-foreground font-bold">A</span>
                </div>
                <h3 className="text-lg font-medium mb-2 text-foreground">How can I help you today?</h3>
                <p className="text-muted-foreground text-sm">Start a conversation with adamGPT</p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className="group mb-8">
                <div className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sidebar-primary to-sidebar-primary/90 text-sidebar-primary-foreground flex items-center justify-center shadow-md ring-2 ring-sidebar-primary/20">
                        <span className="text-xs font-bold">A</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Message content */}
                  <div className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'} max-w-[75%] ${message.role === 'user' ? 'ml-16' : 'mr-16'}`}>
                    <div className={`${
                      message.role === 'user' 
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground rounded-[24px] rounded-br-[8px] shadow-lg' 
                        : 'bg-card text-card-foreground rounded-[24px] rounded-bl-[8px] border border-border shadow-sm hover:shadow-md transition-shadow'
                    } px-5 py-3.5 max-w-full relative group/message`}>
                      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed font-medium">
                        {message.content}
                      </p>
                    </div>
                    <div className={`flex items-center gap-2 mt-2 px-2 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      <span className="text-xs text-muted-foreground">
                        {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {message.role === 'user' && (
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sidebar-primary via-sidebar-primary to-sidebar-primary/90 text-sidebar-primary-foreground flex items-center justify-center shadow-md ring-2 ring-sidebar-primary/20">
                        <span className="text-xs font-medium">
                          {user?.email?.slice(0, 1).toUpperCase()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          
          {loading && (
            <div className="group mb-8">
              <div className="flex gap-4 justify-start">
                {/* AI Avatar */}
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sidebar-primary to-sidebar-primary/90 text-sidebar-primary-foreground flex items-center justify-center shadow-md ring-2 ring-sidebar-primary/20">
                    <span className="text-xs font-bold">A</span>
                  </div>
                </div>
                
                {/* Typing indicator */}
                <div className="bg-card text-card-foreground rounded-[24px] rounded-bl-[8px] px-5 py-3.5 border border-border shadow-sm mr-16 max-w-[75%]">
                  <div className="flex items-center space-x-1.5">
                    <div className="w-2 h-2 bg-sidebar-primary/70 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-sidebar-primary/70 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                    <div className="w-2 h-2 bg-sidebar-primary/70 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="border-t bg-background">
        <div className="max-w-3xl mx-auto p-4">
          <form onSubmit={sendMessage} className="relative">
            <div className="relative flex items-center gap-2 bg-muted/30 border border-input rounded-2xl px-4 py-3 focus-within:border-sidebar-primary/30 transition-all duration-200">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message adamGPT..."
                disabled={loading}
                className="flex-1 border-0 bg-transparent placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 text-sm min-h-[20px]"
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
                className={`rounded-lg h-7 w-7 p-0 transition-all ${
                  input.trim() && !loading 
                    ? 'bg-sidebar-primary hover:bg-sidebar-primary/90 text-sidebar-primary-foreground' 
                    : 'bg-muted text-muted-foreground cursor-not-allowed hover:bg-muted'
                }`}
              >
                <Send className="h-3.5 w-3.5" />
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