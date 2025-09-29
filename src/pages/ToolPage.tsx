import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useSidebar, SidebarTrigger } from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare, Plus, Paperclip, Copy, Check, X, FileText, ImageIcon, Mic, MicOff, Download, MoreHorizontal, Image as ImageIcon2, Palette, ArrowLeft, Volume2 } from 'lucide-react';
import { SendHorizontalIcon } from '@/components/ui/send-horizontal-icon';
import { StopIcon } from '@/components/ui/stop-icon';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ImagePopupModal } from '@/components/ImagePopupModal';
import { FileAnalyzer } from '@/components/FileAnalyzer';
import { ImageProcessingIndicator } from '@/components/ImageProcessingIndicator';
import VoiceModeButton from '@/components/VoiceModeButton';

// Speech recognition will be accessed with type casting to avoid global conflicts
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
const imageStyles = [{
  name: 'Cyberpunk',
  prompt: 'Create an image in a cyberpunk aesthetic: vivid neon accents, futuristic textures, glowing details, and high-contrast lighting.'
}, {
  name: 'Anime',
  prompt: 'Create an image in a detailed anime aesthetic: expressive eyes, smooth cel-shaded coloring, and clean linework. Emphasize emotion and character presence, with a sense of motion or atmosphere typical of anime scenes.'
}, {
  name: 'Dramatic Headshot',
  prompt: 'Create an ultra-realistic high-contrast black-and-white headshot, close up, black shadow background, 35mm lens, 4K quality, aspect ratio 4:3.'
}, {
  name: 'Coloring Book',
  prompt: 'Create an image in a children\'s coloring book style: bold, even black outlines on white, no shading or tone. Simplify textures into playful, easily recognizable shapes.'
}, {
  name: 'Photo Shoot',
  prompt: 'Create an ultra-realistic professional photo shoot with soft lighting.'
}, {
  name: 'Retro Cartoon',
  prompt: 'Create a retro 1950s cartoon style image, minimal vector art, Art Deco inspired, clean flat colors, geometric shapes, mid-century modern design, elegant silhouettes, UPA style animation, smooth lines, limited color palette (black, red, beige, brown, white), grainy paper texture background, vintage jazz club atmosphere, subtle lighting, slightly exaggerated character proportions, classy and stylish mood.'
}, {
  name: '80s Glam',
  prompt: 'Create a selfie styled like a cheesy 1980s mall glamour shot, foggy soft lighting, teal and magenta lasers in the background, feathered hair, shoulder pads, portrait studio vibes, ironic \'glam 4 life\' caption.'
}, {
  name: 'Art Nouveau',
  prompt: 'Create an image in an Art Nouveau style: flowing lines, organic shapes, floral motifs, and soft, decorative elegance.'
}, {
  name: 'Synthwave',
  prompt: 'Create an image in a synthwave aesthetic: retro-futuristic 1980s vibe with neon grids, glowing sunset, vibrant magenta-and-cyan gradients, chrome highlights, and a nostalgic outrun atmosphere.'
}];
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
  },
  'generate-image-nanobanana': {
    id: 'generate-image-nanobanana',
    name: 'Generate Image with NanoBanana',
    description: 'Create images using advanced NanoBanana AI technology',
    instructions: 'Describe the image you want to create in detail, and I\'ll generate it for you using NanoBanana\'s advanced AI technology.',
    icon: <span className="text-2xl">🍌</span>,
    allowImages: false,
    allowFiles: false
  },
  'combine-images-openai': {
    id: 'combine-images-openai',
    name: 'Combine Images with OpenAI',
    description: 'Merge and blend multiple images together using AI',
    instructions: 'Upload multiple images and describe how you want them combined, merged, or blended together.',
    icon: <span className="text-2xl">🔗</span>,
    allowImages: true,
    allowFiles: false
  },
  'edit-image-nanobanana': {
    id: 'edit-image-nanobanana',
    name: 'Edit Image with NanoBanana',
    description: 'Professional image editing powered by AI',
    instructions: 'Upload an image and describe the edits you want to make. I can adjust colors, add effects, remove objects, and more.',
    icon: <span className="text-2xl">✏️</span>,
    allowImages: true,
    allowFiles: false
  },
  'edit-image-openai': {
    id: 'edit-image-openai',
    name: 'Edit Image with OpenAI',
    description: 'Professional image editing powered by OpenAI',
    instructions: 'Upload an image and describe the edits you want to make. I can adjust colors, add effects, remove objects, and more.',
    icon: <span className="text-2xl">✏️</span>,
    allowImages: true,
    allowFiles: false
  },
  'analyse-files-openai': {
    id: 'analyse-files-openai',
    name: 'Analyse Files with OpenAI',
    description: 'Extract insights and information from various file types',
    instructions: 'Upload documents, PDFs, or other files and I\'ll analyze their content, extract key information, and answer questions about them.',
    icon: <span className="text-2xl">📄</span>,
    allowImages: false,
    allowFiles: true
  },
  'grok-4': {
    id: 'grok-4',
    name: 'Grok-4',
    description: 'Advanced AI model for tackling intricate challenges',
    instructions: 'I\'m Grok-4, designed to tackle complex problems with advanced reasoning and analysis capabilities.',
    icon: <span className="text-2xl">⚡</span>,
    allowImages: true,
    allowFiles: true
  }
};
import { ImageEditModal } from '@/components/ImageEditModal';
export default function ToolPage() {
  const {
    toolName,
    toolId
  } = useParams<{
    toolName: string;
    toolId: string;
  }>();
  const navigate = useNavigate();
  const {
    user,
    userProfile
  } = useAuth();
  const {
    actualTheme
  } = useTheme();
  const {
    state: sidebarState,
    isMobile
  } = useSidebar();
  const collapsed = sidebarState === 'collapsed';

  // Always center content on the entire page regardless of sidebar state
  const getContainerStyle = () => {
    return {
      marginLeft: 'auto',
      marginRight: 'auto',
      maxWidth: '768px',
      width: '100%'
    };
  };

  // Dynamic positioning for message input to center on available space
  const getMessageInputStyle = () => {
    // For mobile, always use full width at bottom
    if (isMobile) {
      return {
        position: 'fixed' as const,
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50
      };
    }
    
    const sidebarWidth = collapsed ? 56 : 240; // sidebar widths
    const availableWidth = window.innerWidth - sidebarWidth;
    const inputMaxWidth = 768; // max width of input container
    const inputWidth = Math.min(availableWidth - 32, inputMaxWidth); // 32px for padding
    const leftOffset = sidebarWidth + (availableWidth - inputWidth) / 2;
    return {
      position: 'fixed' as const,
      bottom: 0,
      left: `${leftOffset}px`,
      width: `${inputWidth}px`,
      zIndex: 50
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
  const [selectedImage, setSelectedImage] = useState<{
    url: string;
    name: string;
  } | null>(null);
  const [fileAnalyses, setFileAnalyses] = useState<Map<string, string>>(new Map());
  const [currentImagePrompts, setCurrentImagePrompts] = useState<Map<string, string>>(new Map());
  const [imageAnalysisResults, setImageAnalysisResults] = useState<Map<string, ImageAnalysisResult>>(new Map());
  const [showImageEditModal, setShowImageEditModal] = useState(false);
  const [imageToEdit, setImageToEdit] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [messageRatings, setMessageRatings] = useState<{[key: string]: 'like' | 'dislike'}>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const processedUserMessages = useRef<Map<string, Set<string>>>(new Map());
  const imageGenerationChats = useRef<Set<string>>(new Set());
  const toolConfig = toolName ? toolConfigs[toolName] : null;
  
  // Debug logging for tool configuration
  useEffect(() => {
    console.log('[DEBUG] Tool configuration:', {
      toolName,
      toolId,
      toolConfig: toolConfig ? { id: toolConfig.id, name: toolConfig.name } : null,
      allowImages: toolConfig?.allowImages,
      allowFiles: toolConfig?.allowFiles
    });
  }, [toolName, toolId, toolConfig]);
  useEffect(() => {
    if (toolId && user && toolConfig) {
      if (!processedUserMessages.current.has(toolId)) {
        processedUserMessages.current.set(toolId, new Set());
      }
      console.log(`[TOOL-INIT] Initialized tool ${toolId}, processed messages:`, Array.from(processedUserMessages.current.get(toolId) || []));
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
      loadMessageRatings();
      const handleImageGenerationChat = (event: CustomEvent) => {
        if (event.detail?.chatId === toolId) {
          imageGenerationChats.current.add(toolId);
          setTimeout(() => {
            imageGenerationChats.current.delete(toolId);
          }, 2000);
        }
      };
      window.addEventListener('image-generation-chat', handleImageGenerationChat as EventListener);
      const subscription = supabase.channel(`messages-${toolId}`).on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${toolId}`
      }, payload => {
        console.log(`[REALTIME] Message received for tool ${toolId}:`, payload);
        const newMessage = payload.new as Message;
        if (newMessage.chat_id !== toolId) {
          console.warn(`[REALTIME] Message chat_id ${newMessage.chat_id} doesn't match current tool ${toolId}, ignoring`);
          return;
        }
        setMessages(prev => {
          const existsById = prev.find(msg => msg.id === newMessage.id);
          const existsByContent = prev.find(msg => msg.content === newMessage.content && msg.role === newMessage.role && Math.abs(new Date(msg.created_at).getTime() - new Date(newMessage.created_at).getTime()) < 5000);
          if (existsById || existsByContent) {
            console.log(`[REALTIME] Message already exists in tool ${toolId}, skipping`);
            return prev;
          }
          console.log(`[REALTIME] Adding new message to tool ${toolId}`);
          const filteredPrev = prev.filter(msg => !msg.chat_id || msg.chat_id === toolId);
          return [...filteredPrev, newMessage];
        });
        scrollToBottom();
      }).subscribe();
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
      if (lastMessage.role === 'user' && (!lastMessage.file_attachments || lastMessage.file_attachments.length === 0)) {
        if (lastMessage.chat_id && lastMessage.chat_id !== toolId) {
          console.warn(`[AUTO-TRIGGER] Message chat_id ${lastMessage.chat_id} doesn't match current tool ${toolId}, skipping`);
          return;
        }

        // Skip AI response for calculate-calories tool - it only uses webhook
        if (toolConfig.id === 'calculate-calories') {
          console.log(`[AUTO-TRIGGER] Skipping AI response for calculate-calories tool`);
          return;
        }
        const hasAssistantResponseAfter = currentToolMessages.some(msg => msg.role === 'assistant' && new Date(msg.created_at) > new Date(lastMessage.created_at));
        if (!hasAssistantResponseAfter && !toolProcessedMessages.has(lastMessage.id) && !imageGenerationChats.current.has(toolId)) {
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
    console.log('triggerAIResponse called:', {
      userMessage,
      userMessageId,
      isGeneratingResponse,
      loading
    });
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
      const {
        data: aiResponse,
        error: aiError
      } = await supabase.functions.invoke('chat-with-ai-optimized', {
        body: {
          message: enhancedMessage,
          chat_id: originalToolId,
          user_id: user.id,
          file_analysis: null,
          image_context: []
        }
      });
      console.log('AI response received:', {
        aiResponse,
        aiError
      });
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
        const {
          error: saveError
        } = await supabase.from('messages').insert({
          chat_id: originalToolId,
          content: responseContent,
          role: 'assistant',
          file_attachments: fileAttachments as any
        });
        if (saveError) {
          console.error('Error saving AI message:', saveError);
        } else {
          console.log('AI message saved successfully to tool:', originalToolId);

          // Update chat title based on AI response if this is a new chat
          const firstWords = responseContent.split(' ').slice(0, 6).join(' ');
          const newTitle = firstWords.length > 30 ? firstWords.substring(0, 30) + '...' : firstWords;
          if (newTitle && newTitle !== `${toolConfig.name} Chat`) {
            const {
              error: titleError
            } = await supabase.from('chats').update({
              title: newTitle
            }).eq('id', originalToolId);
            if (titleError) {
              console.error('Error updating chat title:', titleError);
            } else {
              console.log('Chat title updated successfully');
            }
          }
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
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  };
  const fetchMessages = async () => {
    if (!toolId || !user) return;
    const {
      data,
      error
    } = await supabase.from('messages').select('*').eq('chat_id', toolId).order('created_at', {
      ascending: true
    });
    if (!error && data) {
      const typedMessages = data.map(msg => ({
        ...msg,
        file_attachments: msg.file_attachments as any || []
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
  const handleCreateImageClick = () => {
    setIsImageMode(true);
    setIsPopoverOpen(false);
    setInput('');
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };
  const handleExitImageMode = () => {
    setIsImageMode(false);
    setSelectedStyle(null);
    setInput('');
  };
  const handleStyleSelect = (style: typeof imageStyles[0]) => {
    setInput(style.prompt);
    setSelectedStyle(style.name);
    setIsStylesOpen(false);

    // Focus the textarea after setting the style
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };
  const getStyleBackground = (styleName: string) => {
    switch (styleName) {
      case 'Cyberpunk':
        return 'bg-gradient-to-br from-cyan-500/30 to-purple-600/40 border border-cyan-400/20';
      case 'Anime':
        return 'bg-gradient-to-br from-pink-400/30 to-orange-400/30 border border-pink-300/20';
      case 'Dramatic Headshot':
        return 'bg-gradient-to-br from-gray-600/40 to-black/60 border border-gray-500/20';
      case 'Coloring Book':
        return 'bg-white border border-black/40';
      case 'Photo Shoot':
        return 'bg-gradient-to-br from-blue-400/20 to-purple-400/30 border border-blue-300/20';
      case 'Retro Cartoon':
        return 'bg-gradient-to-br from-red-400/30 to-yellow-400/30 border border-red-300/20';
      case '80s Glam':
        return 'bg-gradient-to-br from-magenta-500/30 to-cyan-400/30 border border-magenta-400/20';
      case 'Art Nouveau':
        return 'bg-gradient-to-br from-green-400/30 to-teal-400/30 border border-green-300/20';
      case 'Synthwave':
        return 'bg-gradient-to-br from-purple-600/40 to-pink-500/40 border border-purple-400/20';
      default:
        return 'bg-muted border border-border/40';
    }
  };
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      if (toolConfig?.id === 'analyse-files-openai') {
        // Only allow non-image files for analyse-files-openai
        const nonImageFiles = Array.from(files).filter(file => !file.type.startsWith('image/'));
        if (nonImageFiles.length > 0) {
          setSelectedFiles(prev => [...prev, ...nonImageFiles]);
        }
        if (nonImageFiles.length !== files.length) {
          toast.error('Only non-image files are allowed for this tool');
        }
      } else if (!toolConfig?.allowFiles && toolConfig?.allowImages) {
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

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('[DEBUG] Drag over - toolConfig.id:', toolConfig?.id);
    
    // For calculate-calories, only allow images
    if (toolConfig?.id === 'calculate-calories') {
      const items = Array.from(e.dataTransfer.items);
      const hasImages = items.some(item => item.type.startsWith('image/'));
      if (hasImages) {
        console.log('[DEBUG] Calculate calories - allowing images only');
        setIsDragOver(true);
      }
      return;
    }
    
    // Allow drag over for tools that support images or files
    if (toolConfig?.allowImages || toolConfig?.allowFiles) {
      const items = Array.from(e.dataTransfer.items);
      
      if (toolConfig?.id === 'analyse-files-openai') {
        // For file analysis, accept non-image files
        const hasFiles = items.some(item => !item.type.startsWith('image/') && item.kind === 'file');
        console.log('[DEBUG] Has non-image files:', hasFiles, 'Items:', items.map(i => i.type));
        if (hasFiles) {
          setIsDragOver(true);
        }
      } else if (toolConfig?.allowImages) {
        // For all other image-accepting tools, accept image files
        const hasImages = items.some(item => item.type.startsWith('image/'));
        console.log('[DEBUG] Has images:', hasImages, 'Items:', items.map(i => i.type));
        if (hasImages) {
          setIsDragOver(true);
        }
      }
    }
  };

  // TTS functionality using existing browser TTS
  const speakMessage = (messageId: string, content: string) => {
    if (speakingMessageId === messageId) {
      // Stop current speech
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        setSpeakingMessageId(null);
        console.log('Speech manually stopped for message:', messageId);
      }
      return;
    }

    // Stop any current speech
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    setSpeakingMessageId(messageId);
    console.log('Starting speech for message:', messageId);
    
    const utterance = new SpeechSynthesisUtterance(content);
    
    // More robust event handling
    const resetSpeaking = () => {
      console.log('Speech ended for message:', messageId);
      setSpeakingMessageId(null);
    };

    utterance.onend = resetSpeaking;
    utterance.onerror = (error) => {
      console.log('Speech error for message:', messageId, error);
      resetSpeaking();
    };
    
    // Fallback mechanism - check if speech is still active after expected duration
    const maxDuration = Math.max(content.length * 100, 5000); // Estimate based on content length, minimum 5 seconds
    const fallbackTimer = setTimeout(() => {
      if (speakingMessageId === messageId && window.speechSynthesis) {
        if (!window.speechSynthesis.speaking) {
          console.log('Fallback: Speech appears to have ended without firing onend event');
          resetSpeaking();
        }
      }
    }, maxDuration);

    // Store the timer reference to clear it if speech ends normally
    utterance.addEventListener('end', () => {
      clearTimeout(fallbackTimer);
    });
    
    window.speechSynthesis.speak(utterance);
    
    // Additional monitoring for when speech synthesis state changes
    const monitorSpeech = setInterval(() => {
      if (speakingMessageId === messageId && !window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
        console.log('Monitor detected speech ended for message:', messageId);
        clearInterval(monitorSpeech);
        clearTimeout(fallbackTimer);
        resetSpeaking();
      }
    }, 500);

    // Clean up monitoring after reasonable time
    setTimeout(() => {
      clearInterval(monitorSpeech);
    }, maxDuration + 5000);
  };

  // Rating functionality
  const rateMessage = async (messageId: string, rating: 'like' | 'dislike') => {
    if (!user) return;
    
    const currentRating = messageRatings[messageId];
    const newRating = currentRating === rating ? null : rating;
    
    try {
      if (newRating) {
        await supabase.from('message_ratings' as any).upsert({
          message_id: messageId,
          user_id: user.id,
          rating: newRating
        });
        setMessageRatings(prev => ({ ...prev, [messageId]: newRating }));
      } else {
        await supabase.from('message_ratings' as any)
          .delete()
          .eq('message_id', messageId)
          .eq('user_id', user.id);
        setMessageRatings(prev => {
          const updated = { ...prev };
          delete updated[messageId];
          return updated;
        });
      }
    } catch (error) {
      console.error('Error saving rating:', error);
    }
  };

  // Load message ratings
  const loadMessageRatings = async () => {
    if (!user || !toolId || messages.length === 0) return;
    
    try {
      const { data } = await supabase
        .from('message_ratings' as any)
        .select('message_id, rating')
        .eq('user_id', user.id)
        .in('message_id', messages.map(m => m.id));
      
      if (data) {
        const ratingsMap: {[key: string]: 'like' | 'dislike'} = {};
        data.forEach((rating: any) => {
          ratingsMap[rating.message_id] = rating.rating;
        });
        setMessageRatings(ratingsMap);
      }
    } catch (error) {
      console.error('Error loading ratings:', error);
    }
  };

  // Try again functionality
  const retryMessage = async (messageId: string) => {
    // Find the assistant message and the user message before it
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex <= 0) return;
    
    const userMessage = messages[messageIndex - 1];
    if (userMessage.role !== 'user') return;
    
    // Trigger AI response again
    triggerAIResponse(userMessage.content, userMessage.id);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    console.log('[DEBUG] Drop - toolConfig.id:', toolConfig?.id);
    
    // For calculate-calories, only accept images
    if (toolConfig?.id === 'calculate-calories') {
      const files = Array.from(e.dataTransfer.files);
      const imageFiles = files.filter(file => file.type.startsWith('image/'));
      console.log('[DEBUG] Calculate calories - Image files dropped:', imageFiles.length);
      
      if (imageFiles.length > 0) {
        setSelectedFiles(prev => [...prev, ...imageFiles]);
        toast.success(`${imageFiles.length} image${imageFiles.length > 1 ? 's' : ''} added`);
      } else {
        toast.error('This tool only accepts image files');
      }
      return;
    }
    
    // Handle drops for tools that support images or files
    if (!toolConfig?.allowImages && !toolConfig?.allowFiles) {
      console.log('[DEBUG] Tool not supported for file drop');
      return;
    }

    const files = Array.from(e.dataTransfer.files);
    
    if (toolConfig?.id === 'analyse-files-openai') {
      // Only accept non-image files for analyse-files-openai
      const nonImageFiles = files.filter(file => !file.type.startsWith('image/'));
      
      console.log('[DEBUG] Files dropped:', files.length, 'Non-image files:', nonImageFiles.length);
      
      if (nonImageFiles.length > 0) {
        setSelectedFiles(prev => [...prev, ...nonImageFiles]);
        toast.success(`${nonImageFiles.length} file${nonImageFiles.length > 1 ? 's' : ''} added`);
      } else {
        toast.error('Only non-image files are allowed for this tool');
      }
    } else if (toolConfig?.allowImages) {
      // For all image-accepting tools, only accept image files
      const imageFiles = files.filter(file => file.type.startsWith('image/'));
      
      console.log('[DEBUG] Files dropped:', files.length, 'Image files:', imageFiles.length);
      
      if (imageFiles.length > 0) {
        setSelectedFiles(prev => [...prev, ...imageFiles]);
        toast.success(`${imageFiles.length} image${imageFiles.length > 1 ? 's' : ''} added`);
      } else {
        toast.error('Only image files are allowed for this tool');
      }
    }
  };

  const startRecording = () => {
    if (!user) {
      toast.error('Please sign in to use voice input');
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Speech recognition not supported in this browser');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.onresult = (event: any) => setInput(prev => prev + event.results[0][0].transcript);
    recognition.onend = () => setIsRecording(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    setIsRecording(false);
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
    if (!input.trim() && selectedFiles.length === 0 || loading || !toolConfig) return;
    setLoading(true);

    // Check if this is the first message in this tool session
    const isFirstMessage = messages.length === 0;
    let actualChatId = toolId!;

    // If this is the first message, create a new chat with proper UUID
    if (isFirstMessage) {
      actualChatId = crypto.randomUUID();

      // Create the chat entry
      const {
        error: chatError
      } = await supabase.from('chats').insert({
        id: actualChatId,
        user_id: user.id,
        title: `${toolConfig.name} Chat`,
        tool_id: toolName,
        tool_name: toolConfig.name,
        updated_at: new Date().toISOString()
      });
      if (chatError) {
        console.error('Error creating chat:', chatError);
        setLoading(false);
        return;
      }

      // Navigate to the new chat URL
      navigate(`/${toolName}/${actualChatId}`, {
        replace: true
      });
    }
    try {
      setLoading(true);
      
      // Clear selected files immediately when sending
      const filesToProcess = [...selectedFiles];
      setSelectedFiles([]);

      // Process file uploads first
      let fileAttachments: FileAttachment[] = [];
      let base64FileData: string | null = null;
      let fileInfo: any = null;
      if (filesToProcess.length > 0) {
        for (const file of filesToProcess) {
          console.log('Processing file:', file.name, 'Type:', file.type);

          // Convert file to base64 for all file types
          base64FileData = await new Promise<string>(resolve => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              // Remove data:*;base64, prefix
              const base64 = result.split(',')[1];
              resolve(base64);
            };
            reader.readAsDataURL(file);
          });

          // Save file to appropriate storage bucket
          const bucketName = file.type.startsWith('image/') ? 'chat-images' : 'chat-files';
          const fileName = `${user.id}/${actualChatId}_${Date.now()}_${file.name}`;
          console.log('Uploading to storage:', fileName, 'Bucket:', bucketName);
          
          const {
            data: uploadData,
            error: uploadError
          } = await supabase.storage.from(bucketName).upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });
          
          if (uploadError) {
            console.error('Error uploading file:', uploadError);
            toast.error(`Failed to upload ${file.name}`);
            continue;
          }
          console.log('Upload successful:', uploadData);

          // Get public URL
          const {
            data: urlData
          } = supabase.storage.from(bucketName).getPublicUrl(fileName);
          console.log('Public URL:', urlData.publicUrl);
          
          const fileAttachment: FileAttachment = {
            id: crypto.randomUUID(),
            name: file.name,
            size: file.size,
            type: file.type,
            url: urlData.publicUrl
          };
          fileAttachments.push(fileAttachment);

          // Store file info for webhook (use last file for webhook data)
          fileInfo = {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type
          };
        }
      }

      // Create user message with file attachments
      const userMessage: Message = {
        id: crypto.randomUUID(),
        chat_id: actualChatId,
        content: input,
        role: 'user',
        created_at: new Date().toISOString(),
        file_attachments: fileAttachments
      };

      // Display message in chat first
      setMessages(prev => [...prev, userMessage]);
      console.log('Message displayed with attachments:', fileAttachments);

      // Save user message to database
      const {
        error: saveError
      } = await supabase.from('messages').insert({
        chat_id: actualChatId,
        content: input,
        role: 'user',
        file_attachments: fileAttachments as any
      });
      if (saveError) {
        console.error('Error saving user message:', saveError);
      } else {
        console.log('Message saved to database');

        // Send webhook notification
        try {
          let webhookData: any;
          if (base64FileData && fileInfo) {
            // Send file analysis format
            webhookData = {
              type: toolName,
              // Use tool name as type
              fileName: fileInfo.fileName,
              fileSize: fileInfo.fileSize,
              fileType: fileInfo.fileType,
              fileData: base64FileData,
              chat_id: actualChatId,
              user_id: user.id,
              message: input,
              webhook_handler_url: `https://lciaiunzacgvvbvcshdh.supabase.co/functions/v1/webhook-handler`
            };
          } else {
            // Send text message format
            webhookData = {
              type: toolName,
              // Use tool name as type
              message: input,
              chat_id: actualChatId,
              user_id: user.id,
              webhook_handler_url: `https://lciaiunzacgvvbvcshdh.supabase.co/functions/v1/webhook-handler`
            };
          }
          console.log('Sending to webhook:', {
            type: webhookData.type,
            hasFile: !!base64FileData,
            fileType: fileInfo?.fileType,
            webhook_handler_url: webhookData.webhook_handler_url,
            chat_id: actualChatId
          });
          const webhookResponse = await fetch('https://adsgbt.app.n8n.cloud/webhook/adamGPT', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(webhookData)
          });
          console.log('Webhook response status:', webhookResponse.status);
          if (webhookResponse.ok) {
            const responseData = await webhookResponse.json();
            console.log('Webhook response data:', responseData);

            // If webhook returns response immediately, handle it
            console.log('Webhook responseData:', JSON.stringify(responseData, null, 2));
            if (responseData && (responseData.text || responseData.content || Array.isArray(responseData) || responseData.message && responseData.message.content)) {
              let responseContent = '';
              if (Array.isArray(responseData) && responseData.length > 0) {
                console.log('Processing array response:', responseData);
                // Handle the specific webhook format with message.content structure
                const analysisTexts = responseData.map(item => {
                  if (item.message && item.message.content) {
                    console.log('Found message.content:', item.message.content);
                    return item.message.content;
                  }
                  return item.text || item.content || '';
                }).filter(text => text);
                if (analysisTexts.length > 0) {
                  responseContent = analysisTexts.join('\n\n');
                  console.log('Final response content:', responseContent);
                }
              } else if (responseData.text) {
                responseContent = responseData.text;
              } else if (responseData.analysis || responseData.content) {
                responseContent = responseData.analysis || responseData.content;
              } else if (responseData.message && responseData.message.content) {
                responseContent = responseData.message.content;
              }
              if (responseContent) {
                console.log('Processing immediate webhook response:', responseContent);

                // Save AI response directly
                const {
                  error: saveError
                } = await supabase.from('messages').insert({
                  chat_id: actualChatId,
                  content: responseContent,
                  role: 'assistant'
                });
                if (saveError) {
                  console.error('Error saving immediate AI response:', saveError);
                } else {
                  console.log('Immediate AI response saved successfully');
                }
              }
            }
          } else {
            console.error('Webhook failed with status:', webhookResponse.status);
          }
        } catch (webhookError) {
          console.error('Error sending webhook:', webhookError);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setInput('');
      setLoading(false);
    }
  };
  if (!toolConfig) {
    return <div style={getContainerStyle()} className="flex-1 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Tool Not Found</h1>
          <p className="text-muted-foreground mb-4">The requested tool could not be found.</p>
          <Button onClick={() => navigate('/explore-tools')}>
            Back to Explore Tools
          </Button>
        </div>
      </div>;
  }
  return <div className="h-screen flex flex-col bg-background relative overflow-x-hidden">
      {/* Mobile Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 w-full flex items-center justify-between p-4 border-b border-border/40 bg-background/80 backdrop-blur-sm md:hidden">
        <div className="flex items-center gap-3">
          {isMobile && <SidebarTrigger className="mr-2" />}
        </div>
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <h1 className="text-lg font-bold">{toolConfig.name}</h1>
        </div>
        <div className="flex-1" />
      </div>

      {/* Web Navigation Bar - Always visible on desktop */}
      <div className="border-b border-border/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 hidden md:block">
        <div style={getContainerStyle()} className="flex items-center px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
              {toolConfig.icon}
            </div>
            <div>
              <h1 className="font-semibold text-lg">{toolConfig.name}</h1>
              <p className="text-sm text-muted-foreground">{toolConfig.description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div 
        className={`flex-1 overflow-y-auto pb-20 md:pb-0 ${isDragOver && (toolConfig?.allowImages || toolConfig?.allowFiles) ? 'bg-primary/5 border-2 border-dashed border-primary/30' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className={`${isMobile ? 'px-4 max-w-full overflow-x-hidden' : ''}`} style={isMobile ? {} : getContainerStyle()}>
          {/* Drag and drop indicator */}
          {isDragOver && (toolConfig?.allowImages || toolConfig?.allowFiles || toolConfig?.id === 'calculate-calories') && (
            <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm flex items-center justify-center">
              <div className="text-center p-8 border-2 border-dashed border-primary rounded-2xl bg-background/90">
                {toolConfig?.id === 'calculate-calories' ? (
                  <>
                    <ImageIcon className="h-12 w-12 mx-auto mb-4 text-primary" />
                    <h3 className="text-lg font-semibold mb-2">Drop your food images here</h3>
                    <p className="text-muted-foreground">JPG, PNG, WEBP and other image formats are supported</p>
                  </>
                ) : toolConfig.id === 'analyse-files-openai' ? (
                  <>
                    <FileText className="h-12 w-12 mx-auto mb-4 text-primary" />
                    <h3 className="text-lg font-semibold mb-2">Drop your files here</h3>
                    <p className="text-muted-foreground">Documents, PDFs, and other non-image files are supported</p>
                  </>
                ) : toolConfig?.allowImages ? (
                  <>
                    <ImageIcon className="h-12 w-12 mx-auto mb-4 text-primary" />
                    <h3 className="text-lg font-semibold mb-2">Drop your images here</h3>
                    <p className="text-muted-foreground">JPG, PNG, WEBP and other image formats are supported</p>
                  </>
                ) : (
                  <>
                    <FileText className="h-12 w-12 mx-auto mb-4 text-primary" />
                    <h3 className="text-lg font-semibold mb-2">Drop your files here</h3>
                    <p className="text-muted-foreground">Supported file formats can be uploaded</p>
                  </>
                )}
              </div>
            </div>
          )}
          
          {messages.length === 0 ?
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
            </div> :
        // Messages
        <div className="py-8 pb-32 space-y-8">
              {messages.map((message, index) => <div key={message.id} className={`flex flex-col gap-3 px-4 ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[75%] w-fit break-words rounded-2xl px-4 py-3 shadow-sm transition-all duration-200 ${
                    message.role === 'user' 
                      ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground shadow-primary/20' 
                      : 'bg-gradient-to-br from-muted/50 to-muted border border-border/50 text-foreground hover:shadow-md'
                  }`}>
                    {/* File attachments for user messages - show before text */}
                    {message.role === 'user' && message.file_attachments && message.file_attachments.length > 0 && <div className="mb-4 space-y-3 w-fit">
                        {message.file_attachments.map(file => <div key={file.id} className="w-fit">
                            {file.type.startsWith('image/') ? <img 
                              src={file.url} 
                              alt={file.name} 
                              className="max-w-48 sm:max-w-56 md:max-w-64 max-h-48 sm:max-h-56 md:max-h-64 object-cover cursor-pointer rounded-2xl border border-white/20 shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300" 
                              onClick={() => setSelectedImage({
                                url: file.url,
                                name: file.name
                              })} 
                            /> : <div className="flex items-center gap-3 p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 w-fit">
                                <FileText className="h-5 w-5 text-white/80" />
                                <span className="text-sm font-medium text-white/90">{file.name}</span>
                              </div>}
                          </div>)}
                      </div>}

                    <div className="prose prose-sm max-w-full break-words overflow-hidden dark:prose-invert prose-headings:text-current prose-p:text-current prose-strong:text-current prose-code:text-current"
                      style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.content}
                      </ReactMarkdown>
                    </div>
                    
                    {/* File attachments for assistant messages - show after text */}
                    {message.role === 'assistant' && message.file_attachments && message.file_attachments.length > 0 && <div className="mt-4 space-y-3 w-fit">
                        {message.file_attachments.map(file => <div key={file.id} className="w-fit">
                            {file.type.startsWith('image/') ? <img 
                              src={file.url} 
                              alt={file.name} 
                              className="max-w-48 sm:max-w-56 md:max-w-64 max-h-48 sm:max-h-56 md:max-h-64 object-cover cursor-pointer rounded-2xl border border-border/30 shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-300" 
                              onClick={() => setSelectedImage({
                                url: file.url,
                                name: file.name
                              })} 
                            /> : <div className="flex items-center gap-3 p-3 bg-accent/50 rounded-xl border border-border/30 w-fit">
                                <FileText className="h-5 w-5 text-muted-foreground" />
                                <span className="text-sm font-medium text-foreground">{file.name}</span>
                              </div>}
                          </div>)}
                      </div>}
                  </div>
                  
                  {/* Action buttons - positioned based on message role */}
                  <div className={`flex items-center gap-2 ${message.role === 'user' ? 'self-end' : 'self-start'}`}>
                    {/* Assistant message actions */}
                    {message.role === 'assistant' && (
                      <>
                        {/* Speaker button */}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 w-7 p-0 bg-background/80 backdrop-blur-sm hover:bg-muted transition-opacity"
                          onClick={() => speakMessage(message.id, message.content)}
                        >
                          {speakingMessageId === message.id ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="6" y="4" width="4" height="16"></rect>
                              <rect x="14" y="4" width="4" height="16"></rect>
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                              <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                            </svg>
                          )}
                        </Button>
                       
                        {/* Thumbs Up button - hide if disliked */}
                        {messageRatings[message.id] !== 'dislike' && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 w-7 p-0 bg-background/80 backdrop-blur-sm hover:bg-muted transition-opacity"
                            onClick={() => rateMessage(message.id, 'like')}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill={messageRatings[message.id] === 'like' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3z"></path>
                              <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                            </svg>
                          </Button>
                        )}
                        
                        {/* Thumbs Down button - hide if liked */}
                        {messageRatings[message.id] !== 'like' && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 w-7 p-0 bg-background/80 backdrop-blur-sm hover:bg-muted transition-opacity"
                            onClick={() => rateMessage(message.id, 'dislike')}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill={messageRatings[message.id] === 'dislike' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3z"></path>
                              <path d="M17 2h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path>
                            </svg>
                          </Button>
                        )}
                        
                        {/* Refresh/Try Again button */}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 w-7 p-0 bg-background/80 backdrop-blur-sm hover:bg-muted transition-opacity"
                          onClick={() => retryMessage(message.id)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 2v6h-6"></path>
                            <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
                            <path d="M3 22v-6h6"></path>
                            <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
                          </svg>
                        </Button>
                      </>
                    )}
                    
                    {/* Copy button - always visible */}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 w-7 p-0 bg-background/80 backdrop-blur-sm hover:bg-muted transition-opacity" 
                      onClick={() => copyToClipboard(message.content, message.id)}
                    >
                      {copiedMessageId === message.id ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>)}
              
              {/* Loading indicator */}
              {(loading || isGeneratingResponse) && <div className="flex justify-start px-4">
                  <div className="bg-gradient-to-br from-muted/50 to-muted border border-border/50 rounded-3xl px-6 py-4 max-w-[90%] animate-pulse shadow-sm">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce"></div>
                      <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <span className="ml-2 font-medium">AI is thinking...</span>
                    </div>
                  </div>
                </div>}
              
              <div ref={messagesEndRef} />
            </div>}
        </div>
      </div>

      {/* Input area - fixed at bottom, consistent styling */}
      <div className={`overflow-hidden ${isMobile ? 'bg-background border-t border-border/20' : 'bg-background/95 backdrop-blur-sm'}`} style={getMessageInputStyle()}>
        <div className={`${isMobile ? 'px-3 py-2' : 'px-4 py-3 md:py-4'}`}>
          <div className="w-full max-w-4xl mx-auto">
            {/* File attachments preview */}
            {selectedFiles.length > 0 && <div className="mb-3 md:mb-4 flex flex-wrap gap-2">
                {selectedFiles.map((file, index) => <div key={index} className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 text-sm">
                    {file.type.startsWith('image/') ? <ImageIcon className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                    <span className="truncate max-w-32">{file.name}</span>
                    <button onClick={() => removeFile(index)} className="text-muted-foreground hover:text-foreground">
                      <X className="h-3 w-3" />
                    </button>
                  </div>)}
              </div>}
            
            {/* Image mode indicator */}
            {isImageMode && <div className="flex items-center gap-2 mb-3 flex-wrap animate-fade-in">
                <div className="group flex items-center gap-1 bg-muted px-2 py-1 rounded-md text-xs">
                  <ImageIcon2 className="h-3 w-3" />
                  <span>Image</span>    
                  <button onClick={handleExitImageMode} className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </div>
                
                {/* Styles dropdown */}
                <Popover open={isStylesOpen} onOpenChange={setIsStylesOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs gap-1 bg-muted hover:bg-muted/80">
                      <Palette className="h-3 w-3" />
                      Styles
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-4 bg-background border shadow-lg" align="start">
                    <div className="grid grid-cols-3 gap-3">
                      {imageStyles.map(style => <button key={style.name} onClick={() => handleStyleSelect(style)} className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors text-center">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getStyleBackground(style.name)}`}>
                            <span className={`text-xs font-medium ${style.name === 'Coloring Book' ? 'text-black' : 'text-foreground'}`}>
                              {style.name.split(' ').map(word => word[0]).join('').slice(0, 2)}
                            </span>
                          </div>
                          <span className="text-xs font-medium leading-tight">{style.name}</span>
                        </button>)}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>}
            
            <div className="relative">
              <div className={`flex items-center border rounded-2xl ${isMobile ? 'px-3 py-2 gap-2' : 'px-4 py-3 md:rounded-3xl'} ${actualTheme === 'light' ? 'border-gray-200' : 'border-border'}`}>
                {/* Attachment button */}
                {(toolConfig.allowImages || toolConfig.allowFiles || toolConfig.id.includes('generate-image')) && 
                 toolConfig.id !== 'generate-image-openai' && 
                 toolConfig.id !== 'generate-image-nanobanana' && <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button type="button" variant="ghost" size="sm" className={`${isMobile ? 'h-8 w-8 p-0' : 'h-8 w-8 p-0 mr-2'} hover:bg-muted/20 rounded-full flex-shrink-0`}>
                        <Paperclip className={`${isMobile ? 'h-4 w-4' : 'h-4 w-4'} text-muted-foreground`} />
                      </Button>
                    </PopoverTrigger>
                     <PopoverContent className="w-48 p-2 bg-background border shadow-lg" align="start" side="bottom">
                         <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={() => {
                    handleFileUpload();
                    setIsPopoverOpen(false);
                  }}>
                          <Paperclip className="h-4 w-4" />
                          {toolConfig.id === 'analyse-image-openai' || toolConfig.id === 'calculate-calories' ? 'Add photo' : toolConfig.id === 'analyse-files-openai' ? 'Add files' : 'Add photos & files'}
                        </Button>
                        {toolConfig.id !== 'calculate-calories' && toolConfig.id !== 'analyse-files-openai' && toolConfig.id !== 'analyse-image-openai' && <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={handleCreateImageClick}>
                            <ImageIcon2 className="h-4 w-4" />
                            Create image
                          </Button>}
                     </PopoverContent>
                  </Popover>}
                
                {/* Create image button - only for image generation tools */}
                {(toolConfig.id === 'generate-image-openai' || toolConfig.id === 'generate-image-nanobanana') && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 flex-shrink-0 mr-2" 
                    onClick={handleCreateImageClick}
                    aria-label="Create an image"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                )}

                <Textarea
                  ref={textareaRef} 
                  value={input} 
                  onChange={e => setInput(e.target.value)} 
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }} 
                  placeholder={`Message ${toolConfig.name}...`} 
                  className={`flex-1 border-0 resize-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground placeholder:text-muted-foreground break-words text-left ${isMobile ? 'min-h-[32px] max-h-[60px] text-sm leading-5 px-1 py-1' : 'min-h-[24px] max-h-[200px] text-sm md:text-base px-0 py-0'}`} 
                  style={{
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word'
                  }} 
                  disabled={loading} 
                  rows={1} 
                />
                
                {/* Dictation button - only show on mobile when input is empty */}
                {isMobile && !input.trim() && (
                  <Button 
                    size="sm" 
                    variant="ghost"
                    className="h-8 w-8 p-0 rounded-full focus-visible:ring-2 focus-visible:ring-offset-1 flex-shrink-0 bg-muted/30 hover:bg-muted/50 text-muted-foreground hover:text-foreground" 
                    onClick={isRecording ? stopRecording : startRecording}
                    aria-label={isRecording ? "Stop recording" : "Start voice recording"}
                    aria-pressed={isRecording}
                  >
                    {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                )}

                {/* Dictation button - always show on desktop */}
                {!isMobile && (
                  <Button 
                    size="sm" 
                    variant="ghost"
                    className="h-8 w-8 p-0 rounded-full focus-visible:ring-2 focus-visible:ring-offset-1 flex-shrink-0 hover:bg-muted/50 focus-visible:ring-primary text-muted-foreground hover:text-foreground ml-2" 
                    onClick={isRecording ? stopRecording : startRecording}
                    aria-label={isRecording ? "Stop recording" : "Start voice recording"}
                    aria-pressed={isRecording}
                  >
                    {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                )}

                {/* Send button */}
                <Button 
                  type="submit" 
                  size="sm" 
                  onClick={handleSubmit}
                  disabled={(!input.trim() && selectedFiles.length === 0) || loading}
                  className={`${isMobile ? 'h-8 w-8' : 'h-8 w-8'} p-0 rounded-full flex-shrink-0`}
                >
                  <SendHorizontalIcon className={`${isMobile ? 'h-4 w-4' : 'h-4 w-4'}`} />
                </Button>
              </div>
            </div>
            
            
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
        accept={
          toolConfig.id === 'analyse-files-openai' 
            ? ".pdf,.doc,.docx,.txt,.csv,.json,.xml,.md,.html,.htm" // Include HTML files
            : toolConfig.allowImages && !toolConfig.allowFiles 
              ? "image/*" 
              : "*"
        } 
      />

      {/* Image popup modal */}
      {selectedImage && <ImagePopupModal isOpen={true} imageUrl={selectedImage.url} onClose={() => setSelectedImage(null)} />}
    </div>
}