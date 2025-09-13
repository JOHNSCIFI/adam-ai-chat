import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Send, Copy, Plus, Paperclip, X, FileText, Image as ImageIcon, Check, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
  chat_id: string;
  attachments?: FileAttachment[];
}

interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

export default function Chat() {
  const { chatId } = useParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hoveredMessage, setHoveredMessage] = useState<string | null>(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if ((!input.trim() && selectedFiles.length === 0) || !chatId || !user || loading) return;

    setLoading(true);
    const userMessage = input.trim();
    const files = [...selectedFiles];
    setInput('');
    setSelectedFiles([]);

    try {
      // Upload files to Supabase storage if any
      let fileAttachments: FileAttachment[] = [];
      
      if (files.length > 0) {
        for (const file of files) {
          const fileName = `${user.id}/${Date.now()}-${file.name}`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('chat-files')
            .upload(fileName, file);
            
          if (uploadError) {
            console.error('File upload error:', uploadError);
            toast({
              title: "File upload failed",
              description: `Failed to upload ${file.name}`,
              variant: "destructive",
            });
            continue;
          }
          
          // Get public URL for the file
          const { data: publicUrlData } = supabase.storage
            .from('chat-files')
            .getPublicUrl(fileName);
            
          fileAttachments.push({
            name: file.name,
            size: file.size,
            type: file.type,
            url: publicUrlData.publicUrl
          });
        }
      }

      // Add user message to database with file attachments
      const { error: userError } = await supabase
        .from('messages')
        .insert([{
          chat_id: chatId,
          content: userMessage,
          role: 'user',
          file_attachments: fileAttachments
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

  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (error) {
      // Silently handle error
    }
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
    setIsPopoverOpen(false);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const validFiles: File[] = [];
      let hasInvalidFiles = false;
      
      // File size limits (in bytes)
      const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
      const MAX_DOCUMENT_SIZE = 25 * 1024 * 1024; // 25MB
      const MAX_AUDIO_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
      const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB per message
      
      for (const file of Array.from(files)) {
        let maxSize = MAX_DOCUMENT_SIZE;
        
        if (file.type.startsWith('image/')) {
          maxSize = MAX_IMAGE_SIZE;
        } else if (file.type.startsWith('audio/') || file.type.startsWith('video/')) {
          maxSize = MAX_AUDIO_VIDEO_SIZE;
        }
        
        if (file.size > maxSize) {
          hasInvalidFiles = true;
          toast({
            title: "File too large",
            description: `${file.name} exceeds the ${formatFileSize(maxSize)} limit for ${file.type.split('/')[0]} files.`,
            variant: "destructive",
          });
          continue;
        }
        
        validFiles.push(file);
      }
      
      // Check total size
      const currentTotalSize = selectedFiles.reduce((sum, file) => sum + file.size, 0);
      const newTotalSize = validFiles.reduce((sum, file) => sum + file.size, 0);
      
      if (currentTotalSize + newTotalSize > MAX_TOTAL_SIZE) {
        toast({
          title: "Total file size too large",
          description: `Combined file size cannot exceed ${formatFileSize(MAX_TOTAL_SIZE)} per message.`,
          variant: "destructive",
        });
        return;
      }
      
      if (validFiles.length > 0) {
        setSelectedFiles(prev => [...prev, ...validFiles]);
      }
      
      // Reset the input
      event.target.value = '';
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const isImageFile = (type: string) => type.startsWith('image/');

  if (!chatId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center max-w-2xl px-6">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
            <MessageSquare className="text-2xl text-primary-foreground h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold mb-4 text-foreground">Welcome to adamGPT</h2>
          <p className="text-muted-foreground mb-8 text-base">Your intelligent AI assistant ready to help with any questions or tasks</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <div className="bg-card border border-border rounded-xl p-6 text-center hover:bg-accent/5 transition-colors">
              <div className="text-2xl mb-3">💬</div>
              <h3 className="font-semibold text-base mb-2">Natural Conversations</h3>
              <p className="text-sm text-muted-foreground">Chat naturally and get helpful responses</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 text-center hover:bg-accent/5 transition-colors">
              <div className="text-2xl mb-3">⚡</div>
              <h3 className="font-semibold text-base mb-2">Fast & Accurate</h3>
              <p className="text-sm text-muted-foreground">Get quick and reliable answers</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 text-center hover:bg-accent/5 transition-colors">
              <div className="text-2xl mb-3">🔒</div>
              <h3 className="font-semibold text-base mb-2">Secure & Private</h3>
              <p className="text-sm text-muted-foreground">Your conversations are protected</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background">
      {/* Messages area - max width centered like ChatGPT */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto w-full px-6 py-6">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full min-h-[70vh]">
              <div className="text-center max-w-md">
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-medium mb-2 text-foreground">How can I help you today?</h3>
                <p className="text-muted-foreground text-sm">Start a conversation with adamGPT</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message) => (
                <div 
                  key={message.id} 
                  className="group"
                  onMouseEnter={() => setHoveredMessage(message.id)}
                  onMouseLeave={() => setHoveredMessage(null)}
                >
                  <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'} max-w-[85%] relative`}>
                      <div className={`${
                        message.role === 'user' 
                          ? 'chat-user-bg text-foreground rounded-2xl rounded-br-md' 
                          : 'chat-ai-bg text-foreground rounded-2xl rounded-bl-md'
                      } px-4 py-3 shadow-sm`}>
                        
                        {/* File attachments */}
                        {message.file_attachments && message.file_attachments.length > 0 && (
                          <div className="mb-3 space-y-2">
                            {message.file_attachments.map((file, index) => (
                              <div key={index} className={`flex items-center gap-3 p-3 rounded-xl border ${
                                message.role === 'user' 
                                  ? 'bg-black/10 border-white/20' 
                                  : 'bg-accent border-border'
                              }`}>
                                {isImageFile(file.type) && file.url ? (
                                  <img 
                                    src={file.url} 
                                    alt={file.name} 
                                    className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                                  />
                                ) : (
                                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                    message.role === 'user' 
                                      ? 'bg-white/20' 
                                      : 'bg-muted'
                                  }`}>
                                    {getFileIcon(file.type)}
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate text-foreground">
                                    {file.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatFileSize(file.size)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {message.content && (
                          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                            {message.content}
                          </p>
                        )}
                      </div>
                      
                      {/* Copy button positioned absolutely to prevent layout shifts */}
                      {hoveredMessage === message.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(message.content, message.id)}
                          className={`absolute -bottom-8 h-8 w-8 p-0 chat-hover rounded-md opacity-0 group-hover:opacity-100 transition-all duration-150 ${
                            message.role === 'user' ? 'right-0' : 'left-0'
                          }`}
                        >
                          {copiedMessageId === message.id ? (
                            <Check className="h-4 w-4 text-primary animate-scale-in" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {loading && (
                <div className="flex justify-start">
                  <div className="flex flex-col items-start max-w-[85%]">
                    <div className="chat-ai-bg text-foreground rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input area - ChatGPT style */}
      <div className="border-t border-border bg-background">
        <div className="max-w-4xl mx-auto w-full px-6 py-4">
          <form onSubmit={sendMessage} className="relative">
            {/* File previews */}
            {selectedFiles.length > 0 && (
              <div className="mb-3 p-3 bg-accent/30 border border-border rounded-xl space-y-2 animate-fade-in">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 bg-background/50 rounded-lg group hover:bg-background/80 transition-colors duration-150">
                    {isImageFile(file.type) ? (
                      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                        <img 
                          src={URL.createObjectURL(file)} 
                          alt={file.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                        {getFileIcon(file.type)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 hover:bg-destructive/20 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
            {/* ChatGPT-style input field */}
            <div className="relative flex items-center chat-input-bg border border-border rounded-full px-4 py-3 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/40 transition-all duration-200 shadow-sm">
              <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-accent rounded-lg flex-shrink-0 transition-colors duration-150 mr-3"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-2 animate-scale-in border-border" align="start">
                  <Button
                    variant="ghost"
                    onClick={handleFileUpload}
                    className="w-full justify-start gap-3 h-10 px-3 hover:bg-accent transition-colors duration-150 text-sm"
                  >
                    <Paperclip className="h-4 w-4" />
                    Add photos & files
                  </Button>
                </PopoverContent>
              </Popover>
              
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message adamGPT..."
                disabled={loading}
                className="flex-1 border-0 bg-transparent placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 text-sm resize-none min-h-0 h-auto"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(e as any);
                  }
                }}
              />
              
              <Button 
                type="submit" 
                disabled={(!input.trim() && selectedFiles.length === 0) || loading}
                size="sm"
                className={`rounded-full h-8 w-8 p-0 ml-3 transition-all duration-150 ${
                  (input.trim() || selectedFiles.length > 0) && !loading 
                    ? 'bg-primary hover:bg-primary/90 text-primary-foreground hover:scale-105 shadow-sm' 
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                }`}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileChange}
              className="hidden"
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.csv,.json"
            />
            
            <p className="text-xs text-muted-foreground text-center mt-3">
              adamGPT can make mistakes. Consider checking important information.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}