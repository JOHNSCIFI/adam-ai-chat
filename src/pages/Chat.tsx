import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare, Send, Paperclip, Copy, Check, X, FileText, ImageIcon } from 'lucide-react';
import { FilePreviewModal } from '@/components/FilePreviewModal';
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
  const { user } = useAuth();
  const { toast } = useToast();
  
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
      <div className="flex-1 flex items-center justify-center bg-background p-4">
        <div className="text-center max-w-2xl w-full">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6 animate-bounce-in">
            <MessageSquare className="text-2xl text-primary-foreground h-8 w-8" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-foreground">Welcome to adamGPT</h2>
          <p className="text-muted-foreground mb-8 text-base sm:text-lg">Your intelligent AI assistant ready to help with any questions or tasks</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <div className="bg-card border border-border rounded-xl p-6 text-center hover:bg-accent/5 transition-colors animate-fade-in">
              <div className="text-2xl mb-3">💬</div>
              <h3 className="font-semibold text-base mb-2">Natural Conversations</h3>
              <p className="text-sm text-muted-foreground">Chat naturally and get helpful responses</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 text-center hover:bg-accent/5 transition-colors animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="text-2xl mb-3">⚡</div>
              <h3 className="font-semibold text-base mb-2">Fast & Accurate</h3>
              <p className="text-sm text-muted-foreground">Get quick and reliable answers</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 text-center hover:bg-accent/5 transition-colors animate-fade-in" style={{ animationDelay: '0.2s' }}>
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
    <div className="flex-1 flex flex-col h-full bg-background relative">
      {/* Messages area - responsive max width with padding bottom for fixed input */}
      <div className="flex-1 overflow-y-auto pb-32">
        <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-4 sm:py-6">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full min-h-[70vh]">
              <div className="text-center max-w-md px-4">
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-medium mb-2 text-foreground">How can I help you today?</h3>
                <p className="text-muted-foreground text-sm">Start a conversation with adamGPT</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {messages.map((message) => (
                <div 
                  key={message.id} 
                  className="group animate-fade-in"
                  onMouseEnter={() => setHoveredMessage(message.id)}
                  onMouseLeave={() => setHoveredMessage(null)}
                >
                  <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'} max-w-[90%] sm:max-w-[85%] relative`}>
                      <div className={`${
                        message.role === 'user' 
                          ? 'chat-user-bg text-foreground rounded-2xl rounded-br-md' 
                          : 'chat-ai-bg text-foreground rounded-2xl rounded-bl-md'
                      } px-4 py-3 shadow-sm transition-all duration-200 hover:shadow-md`}>
                        
                        {/* File attachments */}
                        {message.file_attachments && message.file_attachments.length > 0 && (
                          <div className="mb-3 space-y-2">
                            {message.file_attachments.map((file, index) => (
                              <div 
                                key={index} 
                                className={`flex items-center gap-3 p-3 rounded-xl border transition-colors cursor-pointer hover:scale-105 ${
                                  message.role === 'user' 
                                    ? 'bg-black/10 border-white/20 hover:bg-black/20' 
                                    : 'bg-accent border-border hover:bg-accent/70'
                                }`}
                                onClick={() => setPreviewFile({
                                  name: file.name,
                                  type: file.type,
                                  url: file.url,
                                  size: file.size
                                })}
                              >
                                {isImageFile(file.type) && file.url ? (
                                  <img 
                                    src={file.url} 
                                    alt={file.name} 
                                    className="w-16 h-16 object-cover rounded-lg flex-shrink-0 shadow-sm"
                                  />
                                ) : (
                                  <div className={`w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0 ${
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
                                    {formatFileSize(file.size)} • Click to preview
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {message.content && (
                          <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-em:text-foreground prose-code:text-foreground prose-pre:bg-muted prose-pre:text-foreground">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                h1: ({children}) => <h1 className="text-xl font-bold mb-4 text-foreground">{children}</h1>,
                                h2: ({children}) => <h2 className="text-lg font-semibold mb-3 text-foreground">{children}</h2>,
                                h3: ({children}) => <h3 className="text-base font-medium mb-2 text-foreground">{children}</h3>,
                                p: ({children}) => <p className="mb-3 text-sm leading-relaxed text-foreground">{children}</p>,
                                strong: ({children}) => <strong className="font-semibold text-foreground">{children}</strong>,
                                em: ({children}) => <em className="italic text-foreground">{children}</em>,
                                ul: ({children}) => <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>,
                                ol: ({children}) => <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>,
                                li: ({children}) => <li className="text-sm text-foreground">{children}</li>,
                                code: ({children}) => <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono text-foreground">{children}</code>,
                                pre: ({children}) => <pre className="bg-muted p-3 rounded-md overflow-x-auto text-sm">{children}</pre>,
                                blockquote: ({children}) => <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground mb-3">{children}</blockquote>,
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        )}
                      </div>
                      
                      {/* Copy button - better positioning for mobile */}
                      {hoveredMessage === message.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`absolute ${message.role === 'user' ? 'left-0' : 'right-0'} top-0 -translate-y-8 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm border shadow-sm hover:shadow-md min-h-[32px] min-w-[32px]`}
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
              ))}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Fixed Input area at bottom */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 backdrop-blur-sm z-10">
        <div className="max-w-4xl mx-auto w-full p-3">
          <form onSubmit={sendMessage} className="space-y-3">
            {/* File attachments preview */}
            {selectedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 p-2 bg-muted/50 rounded-lg animate-fade-in">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 bg-background rounded-md p-2 border shadow-sm">
                    {getFileIcon(file.type)}
                    <span className="text-sm truncate max-w-[120px] sm:max-w-[150px]">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 hover:bg-destructive hover:text-destructive-foreground rounded-full"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Message input container */}
            <div className="flex items-end gap-2 p-3 rounded-xl border border-border bg-background shadow-sm focus-within:shadow-md transition-all duration-200">
              <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-accent rounded-full flex-shrink-0"
                    disabled={loading}
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent side="top" className="w-64 p-3 bg-popover border shadow-lg z-50">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Attach files</p>
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full justify-start h-auto p-3 hover:bg-accent rounded-lg"
                      onClick={handleFileUpload}
                    >
                      <Paperclip className="h-4 w-4 mr-2" />
                      <div className="text-left">
                        <div className="text-sm font-medium">Choose files</div>
                        <div className="text-xs text-muted-foreground">Images, documents, videos</div>
                      </div>
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
              
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 border-0 bg-transparent placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 text-base resize-none min-h-0 h-auto py-2"
                disabled={loading}
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
                className={`rounded-full h-8 w-8 p-0 flex-shrink-0 transition-all duration-200 min-h-[32px] min-w-[32px] ${
                  (input.trim() || selectedFiles.length > 0) && !loading 
                    ? 'bg-primary hover:bg-primary/90 text-primary-foreground hover:scale-105 shadow-sm' 
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                }`}
              >
                {loading ? (
                  <div className="animate-pulse-subtle">
                    <div className="w-4 h-4 rounded-full bg-current" />
                  </div>
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
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
            
            <p className="text-xs text-muted-foreground text-center">
              adamGPT can make mistakes. Consider checking important information.
            </p>
          </form>
        </div>
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