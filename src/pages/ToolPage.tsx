import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useSidebar } from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare, Plus, Paperclip, Copy, Check, X, FileText, ImageIcon, Mic, MicOff, Download, MoreHorizontal, Image as ImageIcon2, Palette, ArrowLeft } from 'lucide-react';
import { SendHorizontalIcon } from '@/components/ui/send-horizontal-icon';
import { StopIcon } from '@/components/ui/stop-icon';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ImagePopupModal } from '@/components/ImagePopupModal';
import { FileAnalyzer } from '@/components/FileAnalyzer';
import { ImageProcessingIndicator } from '@/components/ImageProcessingIndicator';
import VoiceModeButton from '@/components/VoiceModeButton';

// Type declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

import { ImageAnalysisResult, analyzeImageComprehensively } from '@/utils/imageAnalysis';

interface Message {
  id: string;
  chat_id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
  file_attachments?: FileAttachment[];
  image_analysis?: ImageAnalysisResult[];
}

interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

interface ToolInfo {
  id: string;
  name: string;
  description: string;
  instructions: string;
  icon: React.ReactNode;
  allowImages?: boolean;
  allowFiles?: boolean;
}

const toolConfigs: Record<string, ToolInfo> = {
  'calculate-calories': {
    id: 'calculate-calories',
    name: 'Calculate Calories',
    description: 'Upload food images to get nutritional information and calorie counts',
    instructions: 'Upload an image of your meal and I\'ll analyze its nutritional content and estimate the calories for you.',
    icon: <span className="text-2xl">🥗</span>,
    allowImages: true,
    allowFiles: false
  },
  'openai-gpt-4o': {
    id: 'openai-gpt-4o',
    name: 'OpenAI GPT-4o',
    description: 'Access to OpenAI\'s powerful GPT-4o model for complex tasks',
    instructions: 'I\'m GPT-4o, OpenAI\'s advanced AI model. Ask me anything - I can help with complex reasoning, analysis, creative writing, coding, and more.',
    icon: <span className="text-2xl">🤖</span>,
    allowImages: true,
    allowFiles: true
  },
  'deepseek': {
    id: 'deepseek',
    name: 'DeepSeek',
    description: 'Advanced AI model great for most questions and tasks',
    instructions: 'I\'m DeepSeek, an advanced AI model. I excel at reasoning, analysis, and providing detailed responses to your questions.',
    icon: <span className="text-2xl">🧠</span>,
    allowImages: true,
    allowFiles: true
  },
  'google-gemini': {
    id: 'google-gemini',
    name: 'Google Gemini',
    description: 'Google\'s most capable AI for a wide range of tasks',
    instructions: 'I\'m Google Gemini, designed to handle a wide range of tasks including text generation, analysis, and multimodal understanding.',
    icon: <span className="text-2xl">✨</span>,
    allowImages: true,
    allowFiles: true
  },
  'generate-image-openai': {
    id: 'generate-image-openai',
    name: 'Generate Image with OpenAI',
    description: 'Create stunning images from text using OpenAI\'s image generation',
    instructions: 'Describe the image you want to create in detail, and I\'ll generate it for you using OpenAI\'s advanced image generation technology.',
    icon: <span className="text-2xl">🎨</span>,
    allowImages: false,
    allowFiles: false
  },
  'analyse-image-openai': {
    id: 'analyse-image-openai',
    name: 'Analyse Image with OpenAI',
    description: 'Get detailed analysis and insights from your images',
    instructions: 'Upload an image and I\'ll provide detailed analysis, describe what I see, extract text, or answer questions about it.',
    icon: <span className="text-2xl">🔍</span>,
    allowImages: true,
    allowFiles: false
  }
};

import { ImageEditModal } from '@/components/ImageEditModal';

export default function ToolPage() {
  const { toolName, toolId } = useParams<{ toolName: string; toolId: string }>();
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const { actualTheme } = useTheme();
  const { state: sidebarState } = useSidebar();
  const collapsed = sidebarState === 'collapsed';

  // Center content on page regardless of sidebar state
  const getContainerStyle = () => {
    return { 
      marginLeft: 'auto',
      marginRight: 'auto',
      maxWidth: '768px',
      width: '100%'
    };
  };
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [hoveredMessage, setHoveredMessage] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [isImageMode, setIsImageMode] = useState(false);
  const [isStylesOpen, setIsStylesOpen] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [pendingImageGenerations, setPendingImageGenerations] = useState<Set<string>>(new Set());
  const [selectedImage, setSelectedImage] = useState<{ url: string; name: string } | null>(null);
  const [fileAnalyses, setFileAnalyses] = useState<Map<string, string>>(new Map());
  const [currentImagePrompts, setCurrentImagePrompts] = useState<Map<string, string>>(new Map());
  const [imageAnalysisResults, setImageAnalysisResults] = useState<Map<string, ImageAnalysisResult>>(new Map());
  const [showImageEditModal, setShowImageEditModal] = useState(false);
  const [imageToEdit, setImageToEdit] = useState<File | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const processedUserMessages = useRef<Map<string, Set<string>>>(new Map());
  const imageGenerationChats = useRef<Set<string>>(new Set());

  const toolConfig = toolName ? toolConfigs[toolName] : null;

  useEffect(() => {
    if (toolId && user && toolConfig) {
      if (!processedUserMessages.current.has(toolId)) {
        processedUserMessages.current.set(toolId, new Set());
      }
      console.log(`[TOOL-INIT] Initialized tool ${toolId}, processed messages:`, 
        Array.from(processedUserMessages.current.get(toolId) || []));
      
      setMessages([]);
      setIsGeneratingResponse(false);
      setCurrentImagePrompts(prev => {
        const newMap = new Map();
        const currentPrompt = prev.get(toolId);
        if (currentPrompt) {
          newMap.set(toolId, currentPrompt);
        }
        return newMap;
      });
      setPendingImageGenerations(new Set());
      setLoading(false);
      fetchMessages();

      const handleImageGenerationChat = (event: CustomEvent) => {
        if (event.detail?.chatId === toolId) {
          imageGenerationChats.current.add(toolId);
          setTimeout(() => {
            imageGenerationChats.current.delete(toolId);
          }, 2000);
        }
      };

      window.addEventListener('image-generation-chat', handleImageGenerationChat as EventListener);
      
      const subscription = supabase
        .channel(`messages-${toolId}`)
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'messages',
            filter: `chat_id=eq.${toolId}`
          }, 
          (payload) => {
            console.log(`[REALTIME] Message received for tool ${toolId}:`, payload);
            const newMessage = payload.new as Message;
            
            if (newMessage.chat_id !== toolId) {
              console.warn(`[REALTIME] Message chat_id ${newMessage.chat_id} doesn't match current tool ${toolId}, ignoring`);
              return;
            }
            
            setMessages(prev => {
              const existsById = prev.find(msg => msg.id === newMessage.id);
              const existsByContent = prev.find(msg => 
                msg.content === newMessage.content && 
                msg.role === newMessage.role &&
                Math.abs(new Date(msg.created_at).getTime() - new Date(newMessage.created_at).getTime()) < 5000
              );
              
              if (existsById || existsByContent) {
                console.log(`[REALTIME] Message already exists in tool ${toolId}, skipping`);
                return prev;
              }
              
              console.log(`[REALTIME] Adding new message to tool ${toolId}`);
              const filteredPrev = prev.filter(msg => !msg.chat_id || msg.chat_id === toolId);
              return [...filteredPrev, newMessage];
            });
            scrollToBottom();
          }
        )
        .subscribe();

      return () => {
        console.log(`[CLEANUP] Cleaning up tool ${toolId} - removing event listener and unsubscribing`);
        window.removeEventListener('image-generation-chat', handleImageGenerationChat as EventListener);
        subscription.unsubscribe();
      };
    }
  }, [toolId, user, toolConfig]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-trigger AI response for user messages that don't have responses
  useEffect(() => {
    console.log('Auto-trigger effect:', { 
      messagesLength: messages.length, 
      loading, 
      isGeneratingResponse, 
      toolId,
      lastMessage: messages[messages.length - 1]
    });
    
    if (messages.length > 0 && !loading && !isGeneratingResponse && toolId && toolConfig) {
      const currentToolMessages = messages.filter(msg => msg.chat_id === toolId);
      
      if (currentToolMessages.length === 0) {
        console.log(`[AUTO-TRIGGER] No messages for current tool ${toolId}, skipping`);
        return;
      }
      
      const lastMessage = currentToolMessages[currentToolMessages.length - 1];
      const toolProcessedMessages = processedUserMessages.current.get(toolId) || new Set();
      
      console.log(`[AUTO-TRIGGER] Tool ${toolId} - Last message:`, {
        id: lastMessage.id,
        content: lastMessage.content.substring(0, 50),
        role: lastMessage.role,
        chat_id: lastMessage.chat_id,
        alreadyProcessed: toolProcessedMessages.has(lastMessage.id),
        processedCount: toolProcessedMessages.size
      });
      
      if (lastMessage.role === 'user' && 
          (!lastMessage.file_attachments || lastMessage.file_attachments.length === 0)) {
        
        if (lastMessage.chat_id && lastMessage.chat_id !== toolId) {
          console.warn(`[AUTO-TRIGGER] Message chat_id ${lastMessage.chat_id} doesn't match current tool ${toolId}, skipping`);
          return;
        }
        
        const hasAssistantResponseAfter = currentToolMessages.some(msg => 
          msg.role === 'assistant' && 
          new Date(msg.created_at) > new Date(lastMessage.created_at)
        );
        
        if (!hasAssistantResponseAfter && 
            !toolProcessedMessages.has(lastMessage.id) &&
            !imageGenerationChats.current.has(toolId)) {
          console.log(`[AUTO-TRIGGER] Processing user message in tool ${toolId}:`, lastMessage.id);
          
          if (!processedUserMessages.current.has(toolId)) {
            processedUserMessages.current.set(toolId, new Set());
          }
          processedUserMessages.current.get(toolId)!.add(lastMessage.id);
          
          setTimeout(() => {
            console.log('Executing AI response trigger for:', lastMessage.content);
            triggerAIResponse(lastMessage.content, lastMessage.id);
          }, 100);
        } else {
          console.log('Message already processed, assistant response exists, or from image generation modal');
        }
      } else {
        console.log('Message has file attachments (webhook handled) or not a user message');
      }
    } else {
      console.log('Conditions not met for auto-trigger');
    }
  }, [messages, loading, isGeneratingResponse, toolId, toolConfig]);

  const triggerAIResponse = async (userMessage: string, userMessageId: string) => {
    console.log('triggerAIResponse called:', { userMessage, userMessageId, isGeneratingResponse, loading });
    
    if (isGeneratingResponse || loading || !toolConfig) {
      console.log('Skipping AI response - already in progress');
      return;
    }
    
    const originalToolId = toolId;
    if (!originalToolId) {
      console.error('No tool ID available for AI response');
      return;
    }
    
    setIsGeneratingResponse(true);
    
    try {
      console.log('Starting AI response generation for tool:', originalToolId);
      
      // Prepend tool instructions to user message
      const enhancedMessage = `${toolConfig.instructions}\n\nUser: ${userMessage}`;
      
      const isImageRequest = /\b(generate|create|make|draw|design|sketch|paint|render)\b.*\b(image|picture|photo|art|artwork|illustration|drawing|painting)\b/i.test(userMessage);
      
      if (isImageRequest) {
        setCurrentImagePrompts(prev => new Map(prev).set(originalToolId, userMessage));
      }
      
      console.log('Invoking chat-with-ai-optimized function...');
      const { data: aiResponse, error: aiError } = await supabase.functions.invoke('chat-with-ai-optimized', {
        body: {
          message: enhancedMessage,
          chat_id: originalToolId,
          user_id: user.id,
          file_analysis: null,
          image_context: []
        }
      });

      console.log('AI response received:', { aiResponse, aiError });

      if (aiError) throw aiError;

      if (aiResponse?.response || aiResponse?.content) {
        const responseContent = aiResponse.response || aiResponse.content;
        console.log('Processing AI response content:', responseContent);
        
        let fileAttachments: FileAttachment[] = [];
        if (aiResponse.image_url) {
          console.log('Image URL found in AI response:', aiResponse.image_url);
          fileAttachments = [{
            id: crypto.randomUUID(),
            name: `generated_image_${Date.now()}.png`,
            size: 0,
            type: 'image/png',
            url: aiResponse.image_url
          }];
        }
        
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          chat_id: originalToolId,
          content: responseContent,
          role: 'assistant',
          created_at: new Date().toISOString(),
          file_attachments: fileAttachments
        };
        
        if (toolId === originalToolId) {
          setMessages(prev => [...prev, assistantMessage]);
          scrollToBottom();
        }
        
        if (isImageRequest) {
          setCurrentImagePrompts(prev => {
            const newMap = new Map(prev);
            newMap.delete(originalToolId);
            return newMap;
          });
        }
        
        console.log('Saving AI message to database for tool:', originalToolId);
        const { error: saveError } = await supabase
          .from('messages')
          .insert({
            chat_id: originalToolId,
            content: responseContent,
            role: 'assistant',
            file_attachments: fileAttachments as any
          });
          
        if (saveError) {
          console.error('Error saving AI message:', saveError);
        } else {
          console.log('AI message saved successfully to tool:', originalToolId);
        }
      } else {
        console.log('No response content received from AI');
      }
    } catch (error) {
      console.error('Error triggering AI response:', error);
      
      if (toolId === originalToolId) {
        const errorMessage: Message = {
          id: crypto.randomUUID(),
          chat_id: originalToolId,
          content: 'I apologize, but I encountered an error. Please try again.',
          role: 'assistant',
          created_at: new Date().toISOString(),
          file_attachments: []
        };
        
        setMessages(prev => [...prev, errorMessage]);
        scrollToBottom();
      }
    } finally {
      console.log('AI response generation completed for tool:', originalToolId);
      setIsGeneratingResponse(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    if (!toolId || !user) return;

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', toolId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      const typedMessages = data.map(msg => ({
        ...msg,
        file_attachments: (msg.file_attachments as any) || []
      })) as Message[];
      
      typedMessages.forEach(msg => {
        if (msg.file_attachments && msg.file_attachments.length > 0) {
          console.log('Message with file attachments:', {
            messageId: msg.id,
            role: msg.role,
            fileAttachments: msg.file_attachments
          });
        }
      });
      
      setMessages(typedMessages);
    }
  };

  // File handling functions (copied from Chat.tsx)
  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      if (!toolConfig?.allowFiles && toolConfig?.allowImages) {
        const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
        setSelectedFiles(prev => [...prev, ...imageFiles]);
      } else {
        setSelectedFiles(prev => [...prev, ...Array.from(files)]);
      }
      event.target.value = '';
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 200;
      textareaRef.current.style.height = Math.min(scrollHeight, maxHeight) + 'px';
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  const handleSubmit = async () => {
    if ((!input.trim() && selectedFiles.length === 0) || loading || !toolConfig) return;

    setLoading(true);
    
    const userMessage: Message = {
      id: crypto.randomUUID(),
      chat_id: toolId!,
      content: input,
      role: 'user',
      created_at: new Date().toISOString(),
      file_attachments: []
    };
    
    setMessages(prev => [...prev, userMessage]);

    try {
      // Handle file uploads if any
      let fileAttachments: FileAttachment[] = [];
      if (selectedFiles.length > 0) {
        // Similar file processing logic from Chat.tsx
        // For now, simplified version
        console.log('Files selected:', selectedFiles);
      }

      // Save user message to database
      const { error: saveError } = await supabase
        .from('messages')
        .insert({
          chat_id: toolId,
          content: input,
          role: 'user',
          file_attachments: fileAttachments as any
        });

      if (saveError) {
        console.error('Error saving user message:', saveError);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setInput('');
      setSelectedFiles([]);
      setLoading(false);
    }
  };

  if (!toolConfig) {
    return (
      <div style={getContainerStyle()} className="flex-1 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Tool Not Found</h1>
          <p className="text-muted-foreground mb-4">The requested tool could not be found.</p>
          <Button onClick={() => navigate('/explore-tools')}>
            Back to Explore Tools
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background relative">
      {/* Tool Header - Only show when no messages */}
      {messages.length === 0 && (
        <div className="border-b border-border/40 bg-card/30 backdrop-blur-xl p-4">
          <div style={getContainerStyle()} className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                {toolConfig.icon}
              </div>
              <div>
                <h1 className="text-lg font-semibold">{toolConfig.name}</h1>
                <p className="text-sm text-muted-foreground">{toolConfig.description}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto">
        <div style={getContainerStyle()}>
          {messages.length === 0 ? (
            // Welcome message
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center max-w-2xl mx-auto p-8">
                <div className="mb-6 p-4 rounded-2xl bg-primary/10 w-fit mx-auto">
                  {toolConfig.icon}
                </div>
                <h2 className="text-2xl font-bold mb-3">{toolConfig.name}</h2>
                <p className="text-muted-foreground text-lg mb-6">
                  {toolConfig.instructions}
                </p>
              </div>
            </div>
          ) : (
            // Messages
            <div className="py-8 space-y-6">
              {messages.map((message, index) => (
                <div 
                  key={message.id}
                  className={`group relative flex gap-4 px-4 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                  onMouseEnter={() => setHoveredMessage(message.id)}
                  onMouseLeave={() => setHoveredMessage(null)}
                >
                  <div 
                    className={`relative max-w-[85%] rounded-2xl px-4 py-3 ${
                      message.role === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    }`}
                  >
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.content}
                      </ReactMarkdown>
                    </div>
                    
                    {/* File attachments */}
                    {message.file_attachments && message.file_attachments.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {message.file_attachments.map((file) => (
                          <div key={file.id} className="flex items-center gap-2">
                            {file.type.startsWith('image/') ? (
                              <img 
                                src={file.url} 
                                alt={file.name}
                                className="max-w-full h-auto rounded-lg cursor-pointer"
                                onClick={() => setSelectedImage({ url: file.url, name: file.name })}
                              />
                            ) : (
                              <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                                <FileText className="h-4 w-4" />
                                <span className="text-sm">{file.name}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Copy button */}
                    {hoveredMessage === message.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute -right-12 top-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                        onClick={() => copyToClipboard(message.content, message.id)}
                      >
                        {copiedMessageId === message.id ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Loading indicator */}
              {(loading || isGeneratingResponse) && (
                <div className="flex justify-start px-4">
                  <div className="bg-muted rounded-2xl px-4 py-3 max-w-[85%]">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="animate-pulse">Thinking...</div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input Area - fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0">
        <div className="px-4 py-4 mx-auto max-w-3xl w-full">
          {/* File attachments preview */}
          {selectedFiles.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 text-sm">
                  {file.type.startsWith('image/') ? (
                    <ImageIcon className="h-4 w-4" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
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
          
          <div className="relative max-w-2xl mx-auto">
            <div className={`flex items-center border rounded-2xl px-3 py-2 sm:px-4 sm:py-3 ${actualTheme === 'light' ? 'bg-white border-gray-200' : 'bg-[hsl(var(--input))] border-border'}`}>
              {/* Attachment button - left side inside input */}
              {(toolConfig.allowImages || toolConfig.allowFiles) && (
                <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-muted/20 rounded-full flex-shrink-0 mr-2"
                    >
                      <Paperclip className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-2 bg-background border shadow-lg" align="start">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start gap-2"
                      onClick={() => {
                        handleFileUpload();
                        setIsPopoverOpen(false);
                      }}
                    >
                      <Paperclip className="h-4 w-4" />
                      Add photos & files
                    </Button>
                  </PopoverContent>
                </Popover>
              )}
              
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder={`Message ${toolConfig.name}...`}
                className="flex-1 min-h-[24px] border-0 resize-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0 py-0 text-foreground placeholder:text-muted-foreground break-words text-left scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
                style={{ 
                  wordWrap: 'break-word', 
                  overflowWrap: 'break-word',
                  lineHeight: '1.5rem',
                  height: '24px',
                  overflowY: 'hidden'
                }}
                disabled={false}
                rows={1}
              />
              
              <div className="flex items-center gap-1 ml-2 sm:ml-3">
                {/* Dictation button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={`h-8 w-8 sm:h-9 sm:w-9 p-0 hover:bg-muted/20 rounded-full flex-shrink-0 ${isRecording ? 'text-red-500' : 'text-muted-foreground'}`}
                  onClick={isRecording ? () => {} : () => {}}
                  disabled={loading}
                >
                  {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
                
                {/* Send button - more prominent */}
                <Button
                  onClick={handleSubmit}
                  disabled={(!input.trim() && selectedFiles.length === 0) || loading}
                  className="h-9 w-9 sm:h-10 sm:w-10 p-0 bg-primary hover:bg-primary/90 rounded-full flex-shrink-0 shadow-lg"
                  size="sm"
                >
                  {loading ? (
                    <StopIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  ) : (
                    <SendHorizontalIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* File input */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
            multiple
            accept={toolConfig.allowImages && !toolConfig.allowFiles ? "image/*" : "*"}
          />
        </div>
      </div>

      {/* Image popup modal */}
      {selectedImage && (
        <ImagePopupModal
          isOpen={true}
          imageUrl={selectedImage.url}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </div>
  );
}