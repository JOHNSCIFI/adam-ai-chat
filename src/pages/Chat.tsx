import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Send, Paperclip, Copy, Check, X, FileText, ImageIcon, User, Bot, MessageSquare, ChevronDown } from 'lucide-react';
import { FilePreviewModal } from '@/components/FilePreviewModal';
import { useToast } from '@/hooks/use-toast';
import { useResponsive } from '@/hooks/use-responsive';
import { useSidebar } from '@/contexts/SidebarContext';
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
  const { user } = useAuth();
  const { toast } = useToast();
  const { isMobile, isTablet } = useResponsive();
  const { isCollapsed } = useSidebar();
  
  const isMobileOrTablet = isMobile || isTablet;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [hoveredMessage, setHoveredMessage] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<{
    name: string;
    type: string;
    url: string;
    size: number;
  } | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (chatId && user) {
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
            const newMessage = {
              ...payload.new,
              file_attachments: Array.isArray(payload.new.file_attachments) ? (payload.new.file_attachments as unknown as FileAttachment[]) : []
            } as Message;
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
      console.log('Raw messages from database:', data);
      const typedMessages = data.map(msg => {
        console.log('Processing message:', msg.id, 'file_attachments:', msg.file_attachments);
        return {
          ...msg,
          file_attachments: Array.isArray(msg.file_attachments) ? (msg.file_attachments as unknown as FileAttachment[]) : []
        };
      }) as Message[];
      console.log('Typed messages:', typedMessages);
      setMessages(typedMessages);
    } else if (error) {
      console.error('Error fetching messages:', error);
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
      <div className="flex-1 flex items-center justify-center bg-[#343541] p-4">
        <div className="text-center max-w-2xl w-full">
          <div className="w-16 h-16 bg-[#10a37f] rounded-2xl flex items-center justify-center mx-auto mb-6 animate-bounce-in">
            <MessageSquare className="text-2xl text-white h-8 w-8" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-white">Welcome to AdamGPT</h2>
          <p className="text-gray-400 mb-8 text-base sm:text-lg">Your intelligent AI assistant ready to help with any questions or tasks</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <div className="bg-[#2f2f2f] border border-[#4a4a4a] rounded-xl p-6 text-center hover:bg-[#404040] transition-colors animate-fade-in">
              <div className="text-2xl mb-3">💬</div>
              <h3 className="font-semibold text-base mb-2 text-white">Natural Conversations</h3>
              <p className="text-sm text-gray-400">Chat naturally and get helpful responses</p>
            </div>
            <div className="bg-[#2f2f2f] border border-[#4a4a4a] rounded-xl p-6 text-center hover:bg-[#404040] transition-colors animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="text-2xl mb-3">⚡</div>
              <h3 className="font-semibold text-base mb-2 text-white">Fast & Accurate</h3>
              <p className="text-sm text-gray-400">Get quick and reliable answers</p>
            </div>
            <div className="bg-[#2f2f2f] border border-[#4a4a4a] rounded-xl p-6 text-center hover:bg-[#404040] transition-colors animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="text-2xl mb-3">🔒</div>
              <h3 className="font-semibold text-base mb-2 text-white">Secure & Private</h3>
              <p className="text-sm text-gray-400">Your conversations are protected</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[hsl(var(--bg))] relative">
      {/* Top Header */}
      <div className={`fixed top-0 right-0 z-20 bg-[hsl(var(--bg))] backdrop-blur-sm border-b border-[hsl(var(--border))] ${
        isMobileOrTablet ? 'left-0' : (isCollapsed ? 'left-16' : 'left-80')
      } transition-all duration-300`}>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-[hsl(var(--text))]">AdamGPT</h1>
            <ChevronDown className="h-4 w-4 text-[hsl(var(--muted))]" />
          </div>
        </div>
      </div>

      {/* Messages area - with top padding for fixed header */}
      <div className="flex-1 overflow-y-auto pt-16 pb-32 scrollbar-thin">
        <div className="w-full">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full min-h-[70vh]">
              <div className="text-center max-w-md px-4">
                <div className="w-12 h-12 bg-[hsl(var(--accent))] rounded-xl flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-medium mb-2 text-[hsl(var(--text))]">How can I help you today?</h3>
                <p className="text-[hsl(var(--muted))] text-sm">Start a conversation with AdamGPT</p>
              </div>
            </div>
          ) : (
            <div className="space-y-0">
              {messages.map((message) => (
                <div 
                  key={message.id} 
                  className={`group animate-message-in border-b border-[hsl(var(--border))]/10 last:border-b-0 ${
                    message.role === 'user' 
                      ? 'bg-[hsl(var(--bg))]' 
                      : 'bg-[hsl(var(--surface))]'
                  }`}
                  onMouseEnter={() => setHoveredMessage(message.id)}
                  onMouseLeave={() => setHoveredMessage(null)}
                >
                  <div className="max-w-3xl mx-auto px-6 py-8">
                    <div className={`flex gap-6 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        <div className={`w-8 h-8 rounded-sm flex items-center justify-center ${
                          message.role === 'user' 
                            ? 'bg-[hsl(var(--accent))] text-white' 
                            : 'bg-green-600 text-white'
                        }`}>
                          {message.role === 'user' ? (
                            <User className="h-4 w-4" />
                          ) : (
                            <div className="text-xs font-bold">A</div>
                          )}
                        </div>
                      </div>
                      
                      {/* Message Content */}
                      <div className={`flex-1 min-w-0 relative ${message.role === 'user' ? 'text-right' : ''}`}>
                        {/* File attachments */}
                        {message.file_attachments && message.file_attachments.length > 0 && (
                          <div className="mb-4 space-y-2">
                            {message.file_attachments.map((file, index) => (
                              <div 
                                key={index}
                                className="p-3 border border-[hsl(var(--border))] rounded-lg cursor-pointer hover:bg-[hsl(var(--sidebar-hover))] transition-colors bg-[hsl(var(--surface))]"
                                onClick={() => setPreviewFile(file)}
                              >
                                <div className="flex items-center gap-3">
                                  {getFileIcon(file.type)}
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm text-[hsl(var(--text))] truncate">{file.name}</p>
                                    <p className="text-xs text-[hsl(var(--muted))]">{formatFileSize(file.size)}</p>
                                  </div>
                                  {isImageFile(file.type) && (
                                    <div className="w-12 h-12 rounded overflow-hidden bg-[hsl(var(--muted))]/20">
                                      <img 
                                        src={file.url} 
                                        alt={file.name}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Message Text */}
                        <div className={`prose prose-sm max-w-none leading-relaxed ${
                          message.role === 'user' 
                            ? 'bg-[hsl(var(--accent))] text-white rounded-2xl px-4 py-3 inline-block max-w-lg ml-auto' 
                            : 'text-[hsl(var(--text))]'
                        }`}>
                          {message.role === 'user' ? (
                            <div className="whitespace-pre-wrap break-words text-white">
                              {message.content}
                            </div>
                          ) : (
                            <ReactMarkdown 
                              remarkPlugins={[remarkGfm]}
                              components={{
                                p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed text-[hsl(var(--text))]">{children}</p>,
                                code: ({ className, children, ...props }: any) => {
                                  const inline = 'inline' in props ? props.inline : false;
                                  const match = /language-(\w+)/.exec(className || '');
                                  return !inline ? (
                                    <pre className="code-block">
                                      <code className={className} {...props}>
                                        {children}
                                      </code>
                                    </pre>
                                  ) : (
                                    <code className="bg-[hsl(var(--muted))]/20 px-1.5 py-0.5 rounded text-sm text-[hsl(var(--text))]" {...props}>
                                      {children}
                                    </code>
                                  );
                                },
                                ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-1 text-[hsl(var(--text))]">{children}</ul>,
                                ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-1 text-[hsl(var(--text))]">{children}</ol>,
                                li: ({ children }) => <li className="leading-relaxed text-[hsl(var(--text))]">{children}</li>,
                                h1: ({ children }) => <h1 className="text-xl font-semibold mb-3 mt-6 first:mt-0 text-[hsl(var(--text))]">{children}</h1>,
                                h2: ({ children }) => <h2 className="text-lg font-semibold mb-2 mt-5 first:mt-0 text-[hsl(var(--text))]">{children}</h2>,
                                h3: ({ children }) => <h3 className="text-base font-semibold mb-2 mt-4 first:mt-0 text-[hsl(var(--text))]">{children}</h3>,
                                blockquote: ({ children }) => (
                                  <blockquote className="border-l-4 border-[hsl(var(--accent))] pl-4 italic my-4 text-[hsl(var(--text))]">
                                    {children}
                                  </blockquote>
                                ),
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                          )}
                        </div>
                        
                        {/* Copy button - positioned like ChatGPT */}
                        {message.role === 'assistant' && (
                          <div className="flex items-center gap-1 mt-4 -ml-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(message.content, message.id)}
                              className="h-8 w-8 p-0 text-[hsl(var(--muted))] hover:text-[hsl(var(--text))] hover:bg-[hsl(var(--sidebar-hover))] rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              {copiedMessageId === message.id ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area - fixed at bottom with ChatGPT styling */}
      <div className={`fixed bottom-0 right-0 bg-[hsl(var(--bg))] border-t border-[hsl(var(--border))] ${
        isMobileOrTablet ? 'left-0' : (isCollapsed ? 'left-16' : 'left-80')
      } transition-all duration-300`}>
        <div className="max-w-3xl mx-auto p-4">
          {/* File attachments preview */}
          {selectedFiles.length > 0 && (
            <div className="mb-4 p-3 bg-[hsl(var(--surface))] rounded-lg border border-[hsl(var(--border))]">
              <div className="flex flex-wrap gap-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 bg-[hsl(var(--muted))]/20 px-3 py-2 rounded-lg text-sm text-[hsl(var(--text))]">
                    {getFileIcon(file.type)}
                    <span className="truncate max-w-32">{file.name}</span>
                    <span className="text-xs text-[hsl(var(--muted))]">({formatFileSize(file.size)})</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="h-5 w-5 p-0 ml-2 text-[hsl(var(--muted))] hover:text-[hsl(var(--text))]"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Message input */}
          <form onSubmit={sendMessage} className="relative">
            <div className="flex items-end gap-3 bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-xl px-4 py-3 shadow-card composer">
              {/* File attachment button */}
              <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-2 h-auto text-[hsl(var(--muted))] hover:text-[hsl(var(--text))] hover:bg-[hsl(var(--sidebar-hover))] rounded-lg">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-56 p-2 bg-[hsl(var(--surface))] border border-[hsl(var(--border))] shadow-modal z-50" 
                  align="start"
                  side="top"
                  sideOffset={8}
                >
                  <div className="space-y-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleFileUpload}
                      className="w-full justify-start h-8 text-sm text-white hover:bg-[#4a4a4a]"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Upload files
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
              
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(e);
                  }
                }}
                placeholder="Ask anything"
                className="flex-1 min-h-[20px] max-h-32 resize-none bg-transparent border-none outline-none text-white placeholder:text-gray-400 text-sm leading-5"
                rows={1}
                style={{
                  height: 'auto',
                  minHeight: '20px'
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
                }}
                disabled={loading}
              />
              
              <Button 
                type="submit" 
                size="sm" 
                disabled={(!input.trim() && selectedFiles.length === 0) || loading}
                className="p-2 h-auto bg-[#19c37d] text-white hover:bg-[#10a37f] disabled:opacity-50 disabled:bg-[#565869] rounded-lg"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
          
          {/* Disclaimer */}
          <p className="text-xs text-gray-400 text-center mt-3">
            AdamGPT can make mistakes. Check important info.
          </p>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.csv,.json,.ppt,.pptx,.xls,.xlsx"
        />
      </div>

      {/* File Preview Modal */}
      <FilePreviewModal 
        open={!!previewFile} 
        onOpenChange={(open) => !open && setPreviewFile(null)} 
        file={previewFile} 
      />
    </div>
  );
}