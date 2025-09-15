import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare, Plus, Paperclip, Copy, Check, X, FileText, ImageIcon } from 'lucide-react';
import { SendHorizontalIcon } from '@/components/ui/send-horizontal-icon';
import { StopIcon } from '@/components/ui/stop-icon';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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

export default function Chat() {
  const { chatId } = useParams();
  const { user, userProfile } = useAuth();
  const { actualTheme } = useTheme();
  const { toast } = useToast();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [hoveredMessage, setHoveredMessage] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const processedUserMessages = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (chatId && user) {
      // Clear processed messages when changing chats
      processedUserMessages.current.clear();
      fetchMessages();
      
      // Set up real-time subscription for new messages
      const subscription = supabase
        .channel(`messages-${chatId}`)
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'messages',
            filter: `chat_id=eq.${chatId}`
          }, 
          (payload) => {
            console.log('New message received:', payload);
            const newMessage = payload.new as Message;
            setMessages(prev => {
              // Check if message already exists to prevent duplicates
              if (prev.find(msg => msg.id === newMessage.id)) {
                return prev;
              }
              return [...prev, newMessage];
            });
            scrollToBottom();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [chatId, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check if we need to trigger AI response for new user messages
  useEffect(() => {
    if (messages.length > 0 && !loading && !isGeneratingResponse && chatId) {
      const lastMessage = messages[messages.length - 1];
      
      // Only trigger AI if:
      // 1. Last message is from user
      // 2. There's no assistant message after this user message
      // 3. We haven't already processed this user message
      if (lastMessage.role === 'user' && !processedUserMessages.current.has(lastMessage.id)) {
        const hasAssistantResponseAfter = messages.some(msg => 
          msg.role === 'assistant' && 
          new Date(msg.created_at) > new Date(lastMessage.created_at)
        );
        
        if (!hasAssistantResponseAfter) {
          console.log('Triggering AI response for user message:', lastMessage.content);
          // Mark this message as processed to prevent duplicate responses
          processedUserMessages.current.add(lastMessage.id);
          triggerAIResponse(lastMessage.content, lastMessage.id);
        }
      }
    }
  }, [messages, loading, isGeneratingResponse, chatId]);

  const triggerAIResponse = async (userMessage: string, userMessageId: string) => {
    if (!chatId || !user || loading || isGeneratingResponse) {
      console.log('Skipping AI response - already in progress or missing data');
      return;
    }
    
    console.log(`Starting AI response for message: ${userMessageId}`);
    setIsGeneratingResponse(true);
    setLoading(true);
    
    try {
      console.log('Trigger: Send Message to AI (auto)');
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

      console.log('Webhook response status:', webhookResponse.status);

      if (webhookResponse.ok) {
        const responseData = await webhookResponse.json();
        console.log('Webhook response data:', responseData);

        let assistantResponse = '';
        if (Array.isArray(responseData)) {
          assistantResponse = responseData[0]?.output || responseData[0]?.value || responseData[0]?.message || '';
        } else {
          assistantResponse = responseData.output || responseData.value || responseData.message || responseData.response || '';
        }
        
        if (!assistantResponse) {
          assistantResponse = "I apologize, but I'm having trouble connecting right now. Please try again in a moment.";
        }
        
        // Add assistant response to database
        await supabase
          .from('messages')
          .insert([{
            chat_id: chatId,
            content: assistantResponse,
            role: 'assistant'
          }]);
        
        console.log(`AI response completed for message: ${userMessageId}`);
      } else {
        console.error('Webhook failed with status:', webhookResponse.status);
        throw new Error(`Webhook failed: ${webhookResponse.status}`);
      }
    } catch (error) {
      console.error('Auto AI response error:', error);
      // Remove the message from processed set on error so it can be retried
      processedUserMessages.current.delete(userMessageId);
    } finally {
      setLoading(false);
      setIsGeneratingResponse(false);
    }
  };

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
      // Type assertion to handle Json type from database
      const typedMessages = data.map(msg => ({
        ...msg,
        file_attachments: (msg.file_attachments as any) || []
      })) as Message[];
      setMessages(typedMessages);
    }
  };

  // File size limits based on ChatGPT recommendations
  const getMaxFileSize = (type: string) => {
    if (type.startsWith('image/')) return 10 * 1024 * 1024; // 10MB for images
    if (type.startsWith('video/')) return 100 * 1024 * 1024; // 100MB for videos
    if (type.startsWith('audio/')) return 50 * 1024 * 1024; // 50MB for audio
    if (type.includes('pdf') || type.includes('document') || type.includes('text')) return 25 * 1024 * 1024; // 25MB for documents
    return 20 * 1024 * 1024; // 20MB for other files
  };

  const getFileTypeCategory = (type: string) => {
    if (type.startsWith('image/')) return 'image';
    if (type.startsWith('video/')) return 'video';
    if (type.startsWith('audio/')) return 'audio';
    if (type.includes('pdf') || type.includes('document') || type.includes('text')) return 'document';
    return 'file';
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
        // Check file size limits
        const maxSize = getMaxFileSize(file.type);
        if (file.size > maxSize) {
          toast({
            title: "File too large",
            description: `${file.name} exceeds the ${formatFileSize(maxSize)} limit for ${getFileTypeCategory(file.type)} files.`,
            variant: "destructive",
          });
          continue;
        }

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

        // Get public URL for the uploaded file
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

      // Add user message to database with file attachments
      const { error: userError } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          content: userMessage,
          role: 'user',
          file_attachments: uploadedFiles as any // Cast to Json type for database
        });

      if (userError) throw userError;

      // Note: AI response will be automatically triggered by the useEffect hook
      // that detects new user messages - no need to call webhook here

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
      const totalSize = Array.from(files).reduce((sum, file) => sum + file.size, 0);
      const maxTotalSize = 100 * 1024 * 1024; // 100MB total per message
      
      if (totalSize > maxTotalSize) {
        toast({
          title: "Total file size too large",
          description: `Total file size cannot exceed ${formatFileSize(maxTotalSize)} per message.`,
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFiles(prev => [...prev, ...Array.from(files)]);
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
    <div className="flex-1 flex flex-col bg-background">
      {/* Header - same as Index page */}
      <div className="flex items-center justify-between px-6 py-4 bg-background">
        <div className="text-xl font-semibold text-foreground">AdamGPT</div>
      </div>

      {/* Messages area - centered between sidebar and right edge */}
      <div className="flex-1 overflow-y-auto pb-24">
        <div className="max-w-4xl mx-auto w-full px-6 py-6" style={{ marginLeft: 'calc((100vw - 280px) / 2 - 320px)', marginRight: 'calc((100vw - 280px) / 2 - 320px)' }}>
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full min-h-[70vh]">
              <div className="text-center max-w-md">
                <h3 className="text-2xl font-normal mb-6 text-foreground">
                  How can I help, {userProfile?.display_name || user?.email?.split('@')[0] || 'there'}?
                </h3>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message) => (
                <div 
                  key={message.id} 
                  className="group mb-4"
                  onMouseEnter={() => setHoveredMessage(message.id)}
                  onMouseLeave={() => setHoveredMessage(null)}
                >
                  <div className={`flex ${message.role === 'user' ? 'justify-end mr-3' : 'justify-start ml-3'}`}>
                    <div className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'} max-w-[70%] relative`}>
                      <div className={`${
                        message.role === 'user' 
                          ? 'bg-primary text-primary-foreground rounded-2xl' 
                          : 'text-foreground rounded-2xl'
                      } px-3.5 py-2.5 shadow-sm relative`} style={{ padding: '10px 14px' }}>
                        
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
                          <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-current prose-p:text-current prose-strong:text-current prose-em:text-current prose-code:text-current prose-pre:bg-muted/50 prose-pre:text-current">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                code({node, className, children, ...props}: any) {
                                  const match = /language-(\w+)/.exec(className || '');
                                  const inline = !match;
                                  return inline ? (
                                    <code className="bg-muted/50 px-1.5 py-0.5 rounded text-sm" {...props}>
                                      {children}
                                    </code>
                                  ) : (
                                    <pre className="bg-muted/50 p-4 rounded-lg text-sm overflow-x-auto">
                                      <code {...props}>
                                        {children}
                                      </code>
                                    </pre>
                                  );
                                },
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        )}
                        
                        {/* Copy button - always visible, positioned below message */}
                        {message.role === 'assistant' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-2 h-6 w-6 p-0 bg-background/60 backdrop-blur-sm border border-border/30 shadow-sm hover:bg-muted transition-all opacity-60 hover:opacity-100"
                            onClick={() => copyToClipboard(message.content, message.id)}
                          >
                            {copiedMessageId === message.id ? (
                              <Check className="h-3 w-3 text-green-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {loading && (
                <div className="flex justify-start">
                  <div className="flex flex-col items-start max-w-[80%]">
                    <div className="bg-muted text-foreground rounded-3xl rounded-bl-lg px-5 py-3.5 shadow-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area - fixed at bottom, centered with messages */}
      <div className="fixed bottom-0 left-0 right-0 bg-background">
        <div className="max-w-4xl mx-auto px-6 py-4" style={{ marginLeft: 'calc((100vw - 280px) / 2 - 320px)', marginRight: 'calc((100vw - 280px) / 2 - 320px)' }}>
          {/* File attachments preview */}
          {selectedFiles.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 text-sm">
                  {getFileIcon(file.type)}
                  <span className="truncate max-w-32">{file.name}</span>
                  <button 
                    onClick={() => removeFile(index)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <form onSubmit={sendMessage} className="relative">
            <div className="flex items-center gap-3">
              <div className={`flex-1 flex items-center border rounded-3xl px-4 py-2 ${actualTheme === 'light' ? 'bg-white border-gray-200' : 'bg-[hsl(var(--input))] border-border'}`}>
                <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-muted/20 rounded-full flex-shrink-0"
                    >
                      <Paperclip className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-2 bg-background border shadow-lg" align="start">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start gap-2"
                      onClick={handleFileUpload}
                    >
                      <Paperclip className="h-4 w-4" />
                      Attach files
                    </Button>
                  </PopoverContent>
                </Popover>
                
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Message AdamGPT..."
                  className="flex-1 bg-transparent border-none outline-none py-2 px-3 text-foreground placeholder:text-muted-foreground"
                  disabled={false}
                />
              </div>
              
              {(input.trim() || selectedFiles.length > 0) && (
                <Button
                  type="submit"
                  disabled={loading}
                  size="sm"
                  className="h-10 w-10 p-0 rounded-full flex-shrink-0"
                  style={{ 
                    backgroundColor: actualTheme === 'light' ? 'hsl(var(--user-message-bg))' : 'hsl(var(--primary))',
                    color: actualTheme === 'light' ? 'hsl(var(--foreground))' : 'hsl(var(--primary-foreground))'
                  }}
                >
                  {loading ? <StopIcon className="h-4 w-4" /> : <SendHorizontalIcon className="h-4 w-4" />}
                </Button>
              )}
            </div>
          </form>
          
          <p className="text-xs text-muted-foreground text-center mt-3">
            AdamGPT can make mistakes. Check important info.
          </p>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.csv,.json,.xml,.py,.js,.html,.css,.md"
      />
    </div>
  );
}