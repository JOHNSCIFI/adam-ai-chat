import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  MessageSquare, 
  Send, 
  Paperclip, 
  Mic, 
  Copy, 
  Check, 
  FileText, 
  ImageIcon,
  X,
  Bot,
  User as UserIcon
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format, isToday, isYesterday } from 'date-fns';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
  file_attachments?: FileAttachment[];
}

interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

export function ModernChatInterface() {
  const { chatId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (chatId && user) {
      fetchMessages();
      setupRealtimeSubscription();
    }
  }, [chatId, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);

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
      const typedMessages = data.map(msg => ({
        ...msg,
        file_attachments: (msg.file_attachments as any) || []
      })) as Message[];
      setMessages(typedMessages);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!chatId) return;

    const subscription = supabase
      .channel(`messages-${chatId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${chatId}`
      }, (payload) => {
        const newMessage = payload.new as Message;
        setMessages(prev => {
          if (prev.find(msg => msg.id === newMessage.id)) {
            return prev;
          }
          return [...prev, newMessage];
        });
        scrollToBottom();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
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
      // Upload files to Supabase storage first
      const uploadedFiles: FileAttachment[] = [];
      
      for (const file of files) {
        const fileExtension = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('chat-files')
          .upload(fileName, file);

        if (uploadError) {
          console.error('File upload error:', uploadError);
          toast({
            title: "Upload failed",
            description: `Failed to upload ${file.name}`,
            variant: "destructive",
          });
          continue;
        }

        const { data: urlData } = supabase.storage
          .from('chat-files')
          .getPublicUrl(fileName);

        uploadedFiles.push({
          id: uploadData.id || Date.now().toString(),
          name: file.name,
          size: file.size,
          type: file.type,
          url: urlData.publicUrl
        });
      }

      // Add user message to database
      const { error: userError } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          content: userMessage,
          role: 'user',
          file_attachments: uploadedFiles as any
        });

      if (userError) throw userError;

      // Call AI service
      let assistantResponse = '';
      try {
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
        });

        if (webhookResponse.ok) {
          const responseData = await webhookResponse.json();
          assistantResponse = Array.isArray(responseData) 
            ? responseData[0]?.output || responseData[0]?.value || responseData[0]?.message || ''
            : responseData.output || responseData.value || responseData.message || responseData.response || '';
        }
      } catch (error) {
        console.error('AI service error:', error);
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
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setSelectedFiles(prev => [...prev, ...Array.from(files)]);
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

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return format(date, 'h:mm a');
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, 'h:mm a')}`;
    } else {
      return format(date, 'MMM d, h:mm a');
    }
  };

  const getUserInitials = () => {
    return user?.email?.slice(0, 2).toUpperCase() || 'U';
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const isImageFile = (type: string) => type.startsWith('image/');

  if (!chatId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-background to-background/95 p-4">
        <div className="text-center max-w-2xl w-full">
          <div className="w-20 h-20 bg-gradient-primary rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-custom-xl animate-bounce-in">
            <MessageSquare className="text-3xl text-white h-10 w-10" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            Welcome to adamGPT
          </h2>
          <p className="text-muted-foreground mb-12 text-lg leading-relaxed">
            Your intelligent AI assistant ready to help with any questions or tasks. 
            Start a conversation to unlock the power of AI.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { icon: '💬', title: 'Natural Conversations', desc: 'Chat naturally and get helpful responses' },
              { icon: '⚡', title: 'Fast & Accurate', desc: 'Get quick and reliable answers' },
              { icon: '🔒', title: 'Secure & Private', desc: 'Your conversations are protected' }
            ].map((feature, index) => (
              <div 
                key={index}
                className="bg-gradient-card border border-border/50 rounded-2xl p-8 text-center hover:shadow-custom-lg transition-all duration-300 hover:-translate-y-1 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="font-semibold text-lg mb-3">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-gradient-to-br from-background to-background/95">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full min-h-[60vh]">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-custom-lg">
                  <MessageSquare className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                  How can I help you today?
                </h3>
                <p className="text-muted-foreground">Start a conversation with adamGPT</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message, index) => (
                <div 
                  key={message.id} 
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in group`}
                >
                  <div className={`flex gap-3 max-w-[85%] sm:max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <Avatar className="w-8 h-8 shadow-custom-sm border-2 border-background">
                        <AvatarFallback className={`text-xs font-semibold ${
                          message.role === 'user' 
                            ? 'bg-gradient-primary text-white' 
                            : 'bg-gradient-to-br from-muted to-muted/80 text-muted-foreground'
                        }`}>
                          {message.role === 'user' ? getUserInitials() : <Bot className="h-4 w-4" />}
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    {/* Message content */}
                    <div className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className={`relative ${
                        message.role === 'user' 
                          ? 'chat-user-bg rounded-2xl rounded-br-md shadow-custom-md' 
                          : 'chat-ai-bg rounded-2xl rounded-bl-md shadow-custom-sm'
                      } px-4 py-3 transition-all duration-200 hover:shadow-custom-lg group-hover:scale-[1.01]`}>
                        
                        {/* File attachments */}
                        {message.file_attachments && message.file_attachments.length > 0 && (
                          <div className="mb-3 space-y-2">
                            {message.file_attachments.map((file, fileIndex) => (
                              <div key={fileIndex} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                                message.role === 'user' 
                                  ? 'bg-white/10 border-white/20' 
                                  : 'bg-accent/50 border-border/50'
                              }`}>
                                {isImageFile(file.type) && file.url ? (
                                  <img 
                                    src={file.url} 
                                    alt={file.name} 
                                    className="w-12 h-12 object-cover rounded-lg"
                                  />
                                ) : (
                                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                                    message.role === 'user' 
                                      ? 'bg-white/20' 
                                      : 'bg-muted'
                                  }`}>
                                    {getFileIcon(file.type)}
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">
                                    {file.name}
                                  </p>
                                  <p className="text-xs opacity-70">
                                    {formatFileSize(file.size)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Message text */}
                        {message.content && (
                          <div className={`prose prose-sm max-w-none ${
                            message.role === 'user' 
                              ? 'prose-invert text-white' 
                              : 'text-foreground'
                          }`}>
                            <ReactMarkdown 
                              remarkPlugins={[remarkGfm]}
                              components={{
                                code: ({node, inline, className, children, ...props}) => {
                                  const match = /language-(\w+)/.exec(className || '');
                                  return !inline ? (
                                    <div className="relative">
                                      <pre className={`${className} bg-muted/50 rounded-lg p-4 overflow-x-auto text-sm`} {...props}>
                                        <code>{children}</code>
                                      </pre>
                                    </div>
                                  ) : (
                                    <code className="bg-muted/50 px-1.5 py-0.5 rounded text-sm" {...props}>
                                      {children}
                                    </code>
                                  );
                                },
                                p: ({children}) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                                ul: ({children}) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                                ol: ({children}) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        )}

                        {/* Copy button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(message.content, message.id)}
                          className={`absolute -top-2 -right-2 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-all duration-200 ${
                            message.role === 'user' 
                              ? 'bg-white/20 hover:bg-white/30 text-white' 
                              : 'bg-background hover:bg-accent border shadow-custom-sm'
                          }`}
                        >
                          {copiedMessageId === message.id ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>

                      {/* Timestamp */}
                      <div className={`text-xs text-muted-foreground mt-2 px-1 ${
                        message.role === 'user' ? 'text-right' : 'text-left'
                      }`}>
                        {formatMessageTime(message.created_at)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {loading && (
                <div className="flex justify-start animate-fade-in">
                  <div className="flex gap-3 max-w-[80%]">
                    <Avatar className="w-8 h-8 shadow-custom-sm border-2 border-background">
                      <AvatarFallback className="bg-gradient-to-br from-muted to-muted/80 text-muted-foreground">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="chat-ai-bg rounded-2xl rounded-bl-md px-4 py-3 shadow-custom-sm">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse"></div>
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                        <span className="text-sm text-muted-foreground">Thinking...</span>
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

      {/* Input area */}
      <div className="border-t border-border bg-background/95 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto p-4">
          {/* Selected files */}
          {selectedFiles.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-2 bg-accent rounded-lg px-3 py-2 border">
                  {getFileIcon(file.type)}
                  <span className="text-sm font-medium truncate max-w-32">{file.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Input form */}
          <form onSubmit={sendMessage} className="relative">
            <div className="flex items-end gap-3 p-4 bg-gradient-card border border-border/50 rounded-2xl shadow-custom-lg focus-within:shadow-custom-xl transition-shadow duration-200">
              {/* File upload button */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleFileUpload}
                className="h-10 w-10 p-0 hover:bg-accent flex-shrink-0"
                disabled={loading}
              >
                <Paperclip className="h-4 w-4" />
              </Button>

              {/* Text input */}
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message adamGPT..."
                className="flex-1 min-h-[40px] max-h-[200px] border-0 bg-transparent resize-none focus-visible:ring-0 text-base placeholder:text-muted-foreground/70"
                disabled={loading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(e);
                  }
                }}
              />

              {/* Microphone button */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-10 w-10 p-0 hover:bg-accent flex-shrink-0"
                disabled={loading}
              >
                <Mic className="h-4 w-4" />
              </Button>

              {/* Send button */}
              <Button
                type="submit"
                size="sm"
                disabled={loading || (!input.trim() && selectedFiles.length === 0)}
                className="h-10 w-10 p-0 bg-gradient-primary hover:opacity-90 text-white shadow-custom-sm hover:shadow-custom-md transition-all duration-200 flex-shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>

          {/* Footer text */}
          <div className="text-center mt-3">
            <p className="text-xs text-muted-foreground">
              adamGPT can make mistakes. Check important info.
            </p>
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileChange}
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.csv,.json"
      />
    </div>
  );
}