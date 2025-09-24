import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useSidebar } from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare, Plus, Paperclip, Copy, Check, X, FileText, ImageIcon, Mic, MicOff, Download, MoreHorizontal, Image as ImageIcon2, Palette } from 'lucide-react';
import { SendHorizontalIcon } from '@/components/ui/send-horizontal-icon';
import { StopIcon } from '@/components/ui/stop-icon';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ImagePopupModal } from '@/components/ImagePopupModal';
import { FileAnalyzer } from '@/components/FileAnalyzer';
import { ImageProcessingIndicator } from '@/components/ImageProcessingIndicator';
import VoiceModeButton from '@/components/VoiceModeButton';
import AuthModal from '@/components/AuthModal';

// Speech recognition will be accessed with type casting to avoid global conflicts
import { ImageAnalysisResult, analyzeImageComprehensively } from '@/utils/imageAnalysis';
const models = [{
  id: 'gpt-4o-mini',
  name: 'OpenAI GPT-4o mini',
  description: "OpenAI's Fastest Model",
  type: 'free'
}, {
  id: 'gpt-4o',
  name: 'OpenAI GPT-4o',
  description: "OpenAI's Most Accurate Model",
  type: 'pro'
}, {
  id: 'gpt-5',
  name: 'OpenAI GPT-5',
  description: "OpenAI's Most Advanced Model",
  type: 'pro'
}, {
  id: 'claude',
  name: 'Claude',
  description: "Anthropic's latest AI model",
  type: 'pro'
}, {
  id: 'deepseek',
  name: 'DeepSeek',
  description: "Great for most questions",
  type: 'pro'
}, {
  id: 'gemini',
  name: 'Google Gemini',
  description: "Google's most capable AI",
  type: 'free'
}];
interface Message {
  id: string;
  chat_id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
  file_attachments?: FileAttachment[];
  image_analysis?: ImageAnalysisResult[]; // Store image analysis results
}
interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}
import { ImageEditModal } from '@/components/ImageEditModal';
export default function Chat() {
  const {
    chatId
  } = useParams();
  const {
    user,
    userProfile
  } = useAuth();
  const {
    actualTheme
  } = useTheme();
  // Remove toast hook since we're not using toasts
  const {
    state: sidebarState
  } = useSidebar();
  const collapsed = sidebarState === 'collapsed';

  // Calculate proper centering based on sidebar state
  const getContainerStyle = () => {
    if (collapsed) {
      // When collapsed, center in the remaining space (accounting for collapsed sidebar width ~56px)
      return {
        marginLeft: 'calc(56px + (100vw - 56px - 768px) / 2)',
        marginRight: 'auto',
        maxWidth: '768px'
      };
    } else {
      // When expanded, center in the remaining space (accounting for expanded sidebar width ~280px)
      return {
        marginLeft: 'calc(280px + (100vw - 280px - 768px) / 2)',
        marginRight: 'auto',
        maxWidth: '768px'
      };
    }
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
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Track processed messages per chat to prevent cross-chat bleeding
  const processedUserMessages = useRef<Map<string, Set<string>>>(new Map());
  const imageGenerationChats = useRef<Set<string>>(new Set());
  const selectedModelData = models.find(m => m.id === selectedModel);
  useEffect(() => {
    if (chatId && user) {
      // Initialize processed messages Set for this chat if it doesn't exist
      if (!processedUserMessages.current.has(chatId)) {
        processedUserMessages.current.set(chatId, new Set());
      }
      console.log(`[CHAT-INIT] Initialized chat ${chatId}, processed messages:`, Array.from(processedUserMessages.current.get(chatId) || []));

      // CRITICAL: Clear messages state immediately when switching chats to prevent cross-chat bleeding
      setMessages([]);

      // Reset all loading states when switching chats - CRITICAL for chat isolation
      setIsGeneratingResponse(false);
      // Only clear image prompts for OTHER chats, keep current chat's prompt if switching back
      setCurrentImagePrompts(prev => {
        const newMap = new Map();
        // Only keep the current chat's prompt if it exists
        const currentPrompt = prev.get(chatId);
        if (currentPrompt) {
          newMap.set(chatId, currentPrompt);
        }
        return newMap;
      });
      setPendingImageGenerations(new Set());
      setLoading(false);
      fetchMessages();

      // Listen for image generation chat events
      const handleImageGenerationChat = (event: CustomEvent) => {
        if (event.detail?.chatId === chatId) {
          imageGenerationChats.current.add(chatId);
          // Remove the flag after a delay to allow normal auto-trigger for subsequent messages
          setTimeout(() => {
            imageGenerationChats.current.delete(chatId);
          }, 2000);
        }
      };
      window.addEventListener('image-generation-chat', handleImageGenerationChat as EventListener);

      // Set up real-time subscription for new messages  
      const subscription = supabase.channel(`messages-${chatId}`).on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${chatId}`
      }, payload => {
        console.log(`[REALTIME] Message received for chat ${chatId}:`, payload);
        const newMessage = payload.new as Message;

        // CRITICAL: Double-check message belongs to current chat to prevent leakage
        if (newMessage.chat_id !== chatId) {
          console.warn(`[REALTIME] Message chat_id ${newMessage.chat_id} doesn't match current chat ${chatId}, ignoring`);
          return;
        }
        setMessages(prev => {
          // Check if message already exists (by real ID or temp ID) to prevent duplicates
          const existsById = prev.find(msg => msg.id === newMessage.id);
          const existsByContent = prev.find(msg => msg.content === newMessage.content && msg.role === newMessage.role && Math.abs(new Date(msg.created_at).getTime() - new Date(newMessage.created_at).getTime()) < 5000 // Within 5 seconds
          );
          if (existsById || existsByContent) {
            console.log(`[REALTIME] Message already exists in chat ${chatId}, skipping`);
            return prev;
          }
          console.log(`[REALTIME] Adding new message to chat ${chatId}`);
          // CRITICAL: Filter out any messages not belonging to current chat before adding new message
          const filteredPrev = prev.filter(msg => !msg.chat_id || msg.chat_id === chatId);
          return [...filteredPrev, newMessage];
        });
        scrollToBottom();
      }).subscribe();

      // SINGLE cleanup function that handles both event listener AND subscription
      return () => {
        console.log(`[CLEANUP] Cleaning up chat ${chatId} - removing event listener and unsubscribing`);
        window.removeEventListener('image-generation-chat', handleImageGenerationChat as EventListener);
        subscription.unsubscribe();
      };
    }
  }, [chatId, user]);
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-trigger AI response for user messages that don't have responses
  useEffect(() => {
    console.log('Auto-trigger effect:', {
      messagesLength: messages.length,
      loading,
      isGeneratingResponse,
      chatId,
      lastMessage: messages[messages.length - 1]
    });
    if (messages.length > 0 && !loading && !isGeneratingResponse && chatId) {
      // CRITICAL: Filter messages to only include those belonging to current chat
      const currentChatMessages = messages.filter(msg => msg.chat_id === chatId);
      if (currentChatMessages.length === 0) {
        console.log(`[AUTO-TRIGGER] No messages for current chat ${chatId}, skipping`);
        return;
      }
      const lastMessage = currentChatMessages[currentChatMessages.length - 1];

      // Get processed messages Set for this specific chat
      const chatProcessedMessages = processedUserMessages.current.get(chatId) || new Set();
      console.log(`[AUTO-TRIGGER] Chat ${chatId} - Last message:`, {
        id: lastMessage.id,
        content: lastMessage.content.substring(0, 50),
        role: lastMessage.role,
        chat_id: lastMessage.chat_id,
        alreadyProcessed: chatProcessedMessages.has(lastMessage.id),
        processedCount: chatProcessedMessages.size
      });

      // Only trigger for user messages without file attachments (text-only)
      if (lastMessage.role === 'user' && (!lastMessage.file_attachments || lastMessage.file_attachments.length === 0)) {
        // CRITICAL: Verify message belongs to current chat
        if (lastMessage.chat_id && lastMessage.chat_id !== chatId) {
          console.warn(`[AUTO-TRIGGER] Message chat_id ${lastMessage.chat_id} doesn't match current chat ${chatId}, skipping`);
          return;
        }

        // Check if there's already an assistant response after this user message
        const hasAssistantResponseAfter = currentChatMessages.some(msg => msg.role === 'assistant' && new Date(msg.created_at) > new Date(lastMessage.created_at));

        // Only trigger if no assistant response exists, we haven't processed this message yet,
        // and this isn't from an image generation modal
        if (!hasAssistantResponseAfter && !chatProcessedMessages.has(lastMessage.id) && !imageGenerationChats.current.has(chatId)) {
          console.log(`[AUTO-TRIGGER] Processing user message in chat ${chatId}:`, lastMessage.id);

          // Add to processed messages for this specific chat
          if (!processedUserMessages.current.has(chatId)) {
            processedUserMessages.current.set(chatId, new Set());
          }
          processedUserMessages.current.get(chatId)!.add(lastMessage.id);

          // Trigger AI response immediately for text-only messages
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
  }, [messages, loading, isGeneratingResponse, chatId]);
  const triggerAIResponse = async (userMessage: string, userMessageId: string) => {
    console.log('triggerAIResponse called:', {
      userMessage,
      userMessageId,
      isGeneratingResponse,
      loading
    });
    if (isGeneratingResponse || loading) {
      console.log('Skipping AI response - already in progress');
      return;
    }

    // CRITICAL: Capture the original chat ID to prevent responses going to wrong chats
    const originalChatId = chatId;
    if (!originalChatId) {
      console.error('No chat ID available for AI response');
      return;
    }
    setIsGeneratingResponse(true);
    try {
      console.log('Starting AI response generation for chat:', originalChatId);

      // Check if this is an image generation request
      const isImageRequest = /\b(generate|create|make|draw|design|sketch|paint|render)\b.*\b(image|picture|photo|art|artwork|illustration|drawing|painting)\b/i.test(userMessage);
      if (isImageRequest) {
        setCurrentImagePrompts(prev => new Map(prev).set(originalChatId, userMessage));
      }
      console.log('Invoking chat-with-ai-optimized function...');
      const {
        data: aiResponse,
        error: aiError
      } = await supabase.functions.invoke('chat-with-ai-optimized', {
        body: {
          message: userMessage,
          chat_id: originalChatId,
          user_id: user.id,
          file_analysis: null,
          image_context: []
        }
      });
      console.log('AI response received:', {
        aiResponse,
        aiError
      });
      if (aiError) {
        // Check for authentication errors
        if (aiError.message?.includes('unauthorized') || aiError.message?.includes('JWT')) {
          // Show auth modal for unauthorized access
          if (chatId === originalChatId) {
            setShowAuthModal(true);
          }
          return;
        }
        throw aiError;
      }
      if (aiResponse?.response || aiResponse?.content) {
        const responseContent = aiResponse.response || aiResponse.content;
        console.log('Processing AI response content:', responseContent);

        // Handle image generation responses
        let fileAttachments: FileAttachment[] = [];
        if (aiResponse.image_url) {
          console.log('Image URL found in AI response:', aiResponse.image_url);
          fileAttachments = [{
            id: crypto.randomUUID(),
            name: `generated_image_${Date.now()}.png`,
            size: 0,
            // Unknown size for generated images
            type: 'image/png',
            url: aiResponse.image_url
          }];
        }
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          chat_id: originalChatId,
          content: responseContent,
          role: 'assistant',
          created_at: new Date().toISOString(),
          file_attachments: fileAttachments
        };

        // Only update UI if user is still viewing the original chat
        if (chatId === originalChatId) {
          setMessages(prev => [...prev, assistantMessage]);
          scrollToBottom();
        }

        // Clear image prompt when response is received (only for original chat)
        if (isImageRequest) {
          setCurrentImagePrompts(prev => {
            const newMap = new Map(prev);
            newMap.delete(originalChatId);
            return newMap;
          });
        }

        // ALWAYS save to database with the ORIGINAL chat ID (not current chatId)
        console.log('Saving AI message to database for chat:', originalChatId);
        const {
          error: saveError
        } = await supabase.from('messages').insert({
          chat_id: originalChatId,
          content: responseContent,
          role: 'assistant',
          file_attachments: fileAttachments as any
        });
        if (saveError) {
          // Check for authentication errors
          if (saveError.message?.includes('JWT') || saveError.message?.includes('unauthorized')) {
            if (chatId === originalChatId) {
              setShowAuthModal(true);
            }
            return;
          }
          console.error('Error saving AI message:', saveError);
        } else {
          console.log('AI message saved successfully to chat:', originalChatId);
        }
      } else {
        console.log('No response content received from AI');
      }
    } catch (error) {
      console.error('Error triggering AI response:', error);

      // Only show error in UI if user is still viewing the original chat
      if (chatId === originalChatId) {
        const errorMessage: Message = {
          id: crypto.randomUUID(),
          chat_id: originalChatId,
          content: 'I apologize, but I encountered an error. Please try again.',
          role: 'assistant',
          created_at: new Date().toISOString(),
          file_attachments: []
        };
        setMessages(prev => [...prev, errorMessage]);
        scrollToBottom();
      }
    } finally {
      console.log('AI response generation completed for chat:', originalChatId);
      setIsGeneratingResponse(false);
    }
  };
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  };
  const fetchMessages = async () => {
    if (!chatId || !user) return;
    const {
      data,
      error
    } = await supabase.from('messages').select('*').eq('chat_id', chatId).order('created_at', {
      ascending: true
    });
    if (!error && data) {
      // Type assertion to handle Json type from database
      const typedMessages = data.map(msg => ({
        ...msg,
        file_attachments: msg.file_attachments as any || []
      })) as Message[];

      // Debug logging
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
  const handleStyleSelect = (style: typeof imageStyles[0]) => {
    setInput(style.prompt);
    setSelectedStyle(style.name);
    setIsStylesOpen(false);

    // Focus the textarea after setting the style
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
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
  const getStyleBackground = (styleName: string) => {
    switch (styleName) {
      case 'Cyberpunk':
        return 'bg-gradient-to-br from-cyan-500/30 to-purple-600/40 border border-cyan-400/20';
      case 'Anime':
        return 'bg-gradient-to-br from-pink-400/30 to-orange-400/40 border border-pink-300/20';
      case 'Dramatic Headshot':
        return 'bg-gradient-to-br from-gray-800/50 to-gray-200/30 border border-gray-400/20';
      case 'Coloring Book':
        return 'bg-white border-2 border-black/60';
      case 'Photo Shoot':
        return 'bg-gradient-to-br from-amber-300/30 to-orange-300/40 border border-amber-200/30';
      case 'Retro Cartoon':
        return 'bg-gradient-to-br from-red-600/40 to-amber-600/30 border border-red-400/20';
      case '80s Glam':
        return 'bg-gradient-to-br from-teal-400/40 to-fuchsia-500/40 border border-teal-300/30';
      case 'Art Nouveau':
        return 'bg-gradient-to-br from-emerald-400/30 to-yellow-500/30 border border-emerald-300/20';
      case 'Synthwave':
        return 'bg-gradient-to-br from-fuchsia-500/40 to-cyan-400/40 border border-fuchsia-400/30';
      default:
        return 'bg-gradient-to-br from-primary/20 to-primary/40';
    }
  };
  const sendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() && selectedFiles.length === 0 || !chatId || loading) return;

    // Check if user is authenticated, show auth modal if not
    if (!user) {
      // Show auth modal but preserve the input and files
      setShowAuthModal(true);
      return;
    }
    setLoading(true);
    const userMessage = input.trim();
    const files = [...selectedFiles];
    setInput('');
    setSelectedFiles([]);
    
    // Reset image mode and selected style after sending message
    if (isImageMode) {
      setIsImageMode(false);
      setSelectedStyle(null);
    }

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    try {
      let aiAnalysisResponse = '';
      const tempFileAttachments: FileAttachment[] = [];

      // Handle file analysis via webhook
      if (files.length > 0) {
        console.log('Sending files to webhook for analysis...');
        for (const file of files) {
          // Check file size limits
          const maxSize = getMaxFileSize(file.type);
          if (file.size > maxSize) {
            console.error(`File ${file.name} exceeds size limit`);
            continue;
          }

          // Create temporary file attachment for UI display
          tempFileAttachments.push({
            id: `temp-file-${Date.now()}-${Math.random()}`,
            name: file.name,
            size: file.size,
            type: file.type,
            url: URL.createObjectURL(file)
          });

          // Convert file to base64 for webhook
          const reader = new FileReader();
          const base64 = await new Promise<string>((resolve, reject) => {
            reader.onload = () => {
              const result = reader.result as string;
              resolve(result.split(',')[1]);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });

          // Determine file type for webhook
          let webhookType = 'file';
          if (file.type.startsWith('image/')) {
            webhookType = 'analyse_image';
          } else if (file.type.includes('pdf')) {
            webhookType = 'pdf';
          } else if (file.type.includes('document') || file.type.includes('word')) {
            webhookType = 'document';
          } else if (file.type.startsWith('audio/')) {
            webhookType = 'audio';
          } else if (file.type.startsWith('video/')) {
            webhookType = 'video';
          } else if (file.type.startsWith('text/') || file.type.includes('json') || file.type.includes('csv')) {
            webhookType = 'text';
          }

          // Send to webhook for analysis
          try {
            const webhookResponse = await fetch('https://adsgbt.app.n8n.cloud/webhook/adamGPT', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                type: webhookType,
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
                fileData: base64,
                userId: user.id,
                chatId: chatId,
                message: userMessage
              })
            });
            if (webhookResponse.ok) {
              const analysisResult = await webhookResponse.json();
              console.log('Webhook response:', analysisResult);

              // Handle array response format from webhook
              if (Array.isArray(analysisResult) && analysisResult.length > 0) {
                const analysisTexts = analysisResult.map(item => item.text || item.content || '').filter(text => text);
                if (analysisTexts.length > 0) {
                  aiAnalysisResponse += `\n\n${analysisTexts.join('\n\n')}`;
                } else {
                  aiAnalysisResponse += `\n\nFile analyzed successfully`;
                }
              } else if (analysisResult.text) {
                aiAnalysisResponse += `\n\n${analysisResult.text}`;
              } else if (analysisResult.analysis || analysisResult.content) {
                aiAnalysisResponse += `\n\n${analysisResult.analysis || analysisResult.content}`;
              } else {
                aiAnalysisResponse += `\n\nFile analyzed successfully`;
              }
            } else {
              aiAnalysisResponse += `\n\nError analyzing ${file.name}: ${webhookResponse.statusText}`;
            }
          } catch (error) {
            console.error('Webhook error:', error);
            // Check for authentication errors from webhook
            if (error instanceof Error && (error.message?.includes('unauthorized') || error.message?.includes('authentication'))) {
              setShowAuthModal(true);
              setLoading(false);
              return;
            }
            aiAnalysisResponse += `\n\nError analyzing ${file.name}: Network error`;
          }
        }
      }

      // Create clean user message
      const newUserMessage: Message = {
        id: `temp-${Date.now()}`,
        chat_id: chatId!,
        content: userMessage,
        role: 'user',
        created_at: new Date().toISOString(),
        file_attachments: tempFileAttachments
      };

      // Save image files to Supabase storage for persistence
      const persistentFileAttachments: FileAttachment[] = [];
      for (const file of tempFileAttachments) {
        if (isImageFile(file.type)) {
          try {
            // Convert file to base64 and save to storage
            const response = await fetch(file.url);
            const blob = await response.blob();
            const reader = new FileReader();
            const base64 = await new Promise<string>(resolve => {
              reader.onload = () => {
                const result = reader.result as string;
                resolve(result.split(',')[1]);
              };
              reader.readAsDataURL(blob);
            });

            // Save to Supabase storage
            const saveResponse = await supabase.functions.invoke('save-image', {
              body: {
                imageBase64: base64,
                fileName: file.name,
                chatId: chatId,
                userId: user?.id,
                imageType: 'uploaded'
              }
            });
            if (saveResponse.data?.success) {
              persistentFileAttachments.push({
                ...file,
                url: saveResponse.data.url // Use persistent URL from storage
              });
            } else {
              // Fallback to blob URL if storage fails
              persistentFileAttachments.push(file);
            }
          } catch (error) {
            console.error('Error saving image to storage:', error);
            // Fallback to blob URL if storage fails
            persistentFileAttachments.push(file);
          }
        } else {
          // Non-image files keep blob URL for now
          persistentFileAttachments.push(file);
        }
      }

      // Update message with persistent file attachments
      newUserMessage.file_attachments = persistentFileAttachments;

      // Add to UI immediately
      setMessages(prev => [...prev, newUserMessage]);
      scrollToBottom();

      // Start embedding generation in background (for user message content)
      const userEmbeddingPromise = generateEmbeddingAsync(userMessage);

      // Add user message to database
      const {
        data: insertedMessage,
        error: userError
      } = await supabase.from('messages').insert({
        chat_id: chatId,
        content: userMessage,
        role: 'user',
        file_attachments: newUserMessage.file_attachments as any,
        embedding: null // Will be updated by background process
      }).select().single();
      if (userError) {
        // Check for authentication errors
        if (userError.message?.includes('JWT') || userError.message?.includes('unauthorized')) {
          setShowAuthModal(true);
          return;
        }
        throw userError;
      }

      // Only mark as processed if there are files (since file messages get AI analysis above)
      // Messages without files should be handled by auto-trigger
      if (insertedMessage && files.length > 0 && chatId) {
        // Add to processed messages for this specific chat
        if (!processedUserMessages.current.has(chatId)) {
          processedUserMessages.current.set(chatId, new Set());
        }
        processedUserMessages.current.get(chatId)!.add(insertedMessage.id);
        console.log(`[FILE-MESSAGE] Marked message ${insertedMessage.id} as processed in chat ${chatId}`);
      }

      // Update the message with the real ID from database
      if (insertedMessage) {
        setMessages(prev => prev.map(msg => msg.id === newUserMessage.id ? {
          ...msg,
          id: insertedMessage.id // Update with real ID
        } : msg));

        // Update with embedding when ready (background)
        userEmbeddingPromise.then(embedding => {
          if (embedding.length > 0) {
            supabase.from('messages').update({
              embedding: embedding as any
            }).eq('id', insertedMessage.id);
          }
        });
      }

      // If files were analyzed, show AI analysis response instead of regular AI
      if (aiAnalysisResponse && files.length > 0) {
        // Create assistant message with analysis results from webhook
        const analysisMessage: Message = {
          id: `temp-ai-${Date.now()}`,
          chat_id: chatId!,
          content: aiAnalysisResponse.trim(),
          role: 'assistant',
          created_at: new Date().toISOString(),
          file_attachments: []
        };

        // Add to UI
        setMessages(prev => [...prev, analysisMessage]);
        scrollToBottom();

        // Start embedding generation for AI response
        const aiEmbeddingPromise = generateEmbeddingAsync(aiAnalysisResponse);

        // Save to database
        const {
          data: aiMessage,
          error: aiError
        } = await supabase.from('messages').insert({
          chat_id: chatId,
          content: aiAnalysisResponse.trim(),
          role: 'assistant',
          embedding: null
        }).select().single();
        if (aiError) {
          // Check for authentication errors
          if (aiError.message?.includes('JWT') || aiError.message?.includes('unauthorized')) {
            setShowAuthModal(true);
            return;
          }
          console.error('Error saving AI analysis message:', aiError);
        }
        if (aiMessage) {
          setMessages(prev => prev.map(msg => msg.id === analysisMessage.id ? {
            ...msg,
            id: aiMessage.id
          } : msg));

          // Update with embedding when ready
          aiEmbeddingPromise.then(embedding => {
            if (embedding.length > 0) {
              supabase.from('messages').update({
                embedding: embedding as any
              }).eq('id', aiMessage.id);
            }
          });
        }
      } else if (userMessage && files.length === 0) {
        // Don't call AI here - let the auto-trigger handle it to avoid duplicates
        console.log('User message without files - will be handled by auto-trigger');
      }

      // Automatically update chat title based on conversation progression
      setTimeout(() => {
        updateChatTitleFromConversation(chatId);
      }, 1000);
    } catch (error: any) {
      console.error('Send message error:', error);

      // Check for authentication errors
      if (error?.message?.includes('JWT') || error?.message?.includes('unauthorized') || error?.message?.includes('authentication')) {
        setShowAuthModal(true);
        return;
      }

      // Show generic error toast for other errors
      toast.error('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
      setIsGeneratingResponse(false);
      setCurrentImagePrompts(prev => {
        const newMap = new Map(prev);
        if (chatId) newMap.delete(chatId);
        return newMap;
      });
    }
  };
  const extractFileContent = async (file: File): Promise<string> => {
    try {
      const fileType = file.type;
      console.log(`Extracting content from: ${file.name}`);
      if (fileType.startsWith('text/') || fileType.includes('json') || fileType.includes('csv')) {
        // Extract actual text content
        const text = await file.text();
        return text; // Return the actual content, not metadata
      } else if (fileType.startsWith('image/')) {
        // For images, use OpenAI Vision API for analysis
        console.log('Performing OpenAI image analysis...');
        try {
          // Convert image to base64
          const reader = new FileReader();
          const imageBase64 = await new Promise<string>((resolve, reject) => {
            reader.onload = () => {
              const result = reader.result as string;
              const base64 = result.split(',')[1]; // Remove data:image/...;base64, prefix
              resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });

          // Call OpenAI image analysis in background
          supabase.functions.invoke('analyze-image', {
            body: {
              imageBase64,
              fileName: file.name,
              chatId: chatId,
              userId: user?.id
            }
          }).then(response => {
            if (response.data?.analysis) {
              // Store the analysis result for future reference (background)
              const analysisResult = {
                id: `img-${Date.now()}`,
                fileName: file.name,
                url: URL.createObjectURL(file),
                basicInfo: {
                  width: 0,
                  height: 0,
                  size: file.size,
                  format: file.type,
                  aspectRatio: 1
                },
                visualAnalysis: {
                  dominantColors: [],
                  brightness: 0,
                  contrast: 0,
                  colorfulness: 0,
                  composition: 'unknown',
                  quality: 'unknown'
                },
                detectedElements: {
                  hasText: false,
                  textAreas: 0,
                  hasFaces: false,
                  faceCount: 0,
                  hasObjects: false,
                  objectTypes: []
                },
                aiDescription: response.data.analysis,
                timestamp: new Date().toISOString()
              };
              setImageAnalysisResults(prev => new Map(prev.set(analysisResult.id, analysisResult)));
              console.log('OpenAI image analysis completed and saved');
            }
          }).catch(error => {
            console.error('Background image analysis failed:', error);
          });

          // Return empty string - don't show analysis to user
          return '';
        } catch (error) {
          console.error('Image analysis failed:', error);
          return '';
        }
      } else if (fileType.includes('pdf')) {
        // For PDF, we need actual content extraction (simplified for now)
        // In production, you'd use pdf-parse or similar
        return `[PDF Document: ${file.name} - Contains ${Math.ceil(file.size / 1024 / 50)} estimated pages. Full text extraction requires PDF parsing service.]`;
      } else if (fileType.includes('document') || fileType.includes('word')) {
        return `[Word Document: ${file.name} - Contains formatted text and possibly images. Requires document parser to extract full content.]`;
      } else if (fileType.includes('spreadsheet') || fileType.includes('excel')) {
        return `[Spreadsheet: ${file.name} - Contains tabular data. Requires Excel parser to extract cell contents and formulas.]`;
      } else {
        return `[File: ${file.name} - Binary content that requires specialized processing to extract readable information.]`;
      }
    } catch (error) {
      return `[Error extracting content from ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}]`;
    }
  };
  const generateEmbeddingAsync = async (text: string): Promise<number[]> => {
    try {
      const openAIKey = await getOpenAIKey();
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: text
        })
      });
      if (response.ok) {
        const data = await response.json();
        return data.data[0].embedding;
      }
    } catch (error) {
      console.log('Embedding generation failed:', error);
    }
    return [];
  };
  const analyzeFileDirectly = async (file: File): Promise<string> => {
    try {
      const fileType = file.type;
      console.log(`Analyzing file: ${file.name}, type: ${fileType}, size: ${file.size}`);
      if (fileType.startsWith('text/') || fileType.includes('json') || fileType.includes('csv')) {
        const text = await file.text();
        const lines = text.split('\n');
        const words = text.split(/\s+/).filter(word => word.length > 0);
        return `📄 TEXT FILE CONTENT ANALYSIS:

File Details:
• Name: ${file.name}
• Size: ${(file.size / 1024).toFixed(2)} KB
• Lines: ${lines.length}
• Words: ${words.length}
• Characters: ${text.length}

EXTRACTED CONTENT:
${text.length > 3000 ? text.substring(0, 3000) + '\n\n[Content truncated - showing first 3000 characters]' : text}

Content Insights:
• File structure: ${detectFileStructure(text)}
• Key patterns: ${findKeyPatterns(text)}
• Data format: ${detectDataFormat(text)}`;
      } else if (fileType.startsWith('image/')) {
        return new Promise(resolve => {
          const img = document.createElement('img');
          const imageUrl = URL.createObjectURL(file);
          img.onload = () => {
            URL.revokeObjectURL(imageUrl);
            const aspectRatio = img.width / img.height;
            resolve(`🖼️ IMAGE CONTENT ANALYSIS:

File Details:
• Name: ${file.name}
• Size: ${(file.size / 1024).toFixed(2)} KB
• Format: ${fileType}
• Dimensions: ${img.width} × ${img.height} pixels
• Aspect Ratio: ${aspectRatio.toFixed(2)}:1
• Resolution: ${img.width > 1920 ? 'High (4K+)' : img.width > 1280 ? 'HD' : img.width > 720 ? 'Standard' : 'Low'} 

Visual Properties:
• Orientation: ${aspectRatio > 1.5 ? 'Landscape' : aspectRatio < 0.75 ? 'Portrait' : 'Square/Balanced'}
• Pixel Density: ${(img.width * img.height / 1000000).toFixed(1)} megapixels
• Compression Ratio: ${(file.size / (img.width * img.height)).toFixed(4)} bytes/pixel

Note: This is a visual image file. For detailed content recognition (text, objects, faces), AI vision processing would be needed.`);
          };
          img.onerror = () => {
            URL.revokeObjectURL(imageUrl);
            resolve(`❌ IMAGE ANALYSIS ERROR:
Unable to load and analyze image: ${file.name}
File size: ${(file.size / 1024).toFixed(2)} KB`);
          };
          img.src = imageUrl;
        });
      } else if (fileType.includes('pdf')) {
        // Enhanced PDF analysis - attempt to extract actual content
        return await extractPDFContentDirect(file);
      } else if (fileType.includes('document') || fileType.includes('word') || fileType.includes('docx')) {
        return `📝 DOCUMENT FILE ANALYSIS:

File Details:
• Name: ${file.name}
• Size: ${(file.size / 1024).toFixed(2)} KB
• Type: ${fileType}
• Estimated Pages: ${Math.ceil(file.size / 1024 / 30)}

Document Properties:
• Format: Microsoft Word/Document
• Content: Likely contains formatted text, possibly images and tables
• Processing: Requires specialized document parsing to extract full content

Note: This document file contains structured content that would need document parsing tools to extract the actual text, formatting, and embedded elements.`;
      } else if (fileType.startsWith('audio/')) {
        return `🎵 AUDIO FILE ANALYSIS:

File Details:
• Name: ${file.name}
• Size: ${(file.size / 1024).toFixed(2)} KB
• Format: ${fileType}
• Estimated Duration: ${Math.round(file.size / 1024 / 60)} minutes (approximate)

Audio Properties:
• Type: ${fileType.includes('mp3') ? 'MP3 compressed' : fileType.includes('wav') ? 'WAV uncompressed' : 'Digital audio'}
• Quality: ${file.size > 10000000 ? 'High quality/long duration' : file.size > 3000000 ? 'Standard quality' : 'Compressed/short'}

Note: This audio file could contain speech, music, or other sounds. Speech-to-text processing would be needed to extract any spoken content.`;
      } else {
        return `📋 GENERAL FILE ANALYSIS:

File Details:
• Name: ${file.name}
• Size: ${(file.size / 1024).toFixed(2)} KB
• Type: ${fileType || 'Unknown format'}
• Extension: ${file.name.split('.').pop()?.toUpperCase() || 'None'}

File Category: ${categorizeFile(fileType)}
Processing Status: File received and metadata captured
Content Access: This file type requires specialized processing to extract detailed content.`;
      }
    } catch (error) {
      return `❌ FILE ANALYSIS ERROR:
File: ${file.name}
Error: ${error instanceof Error ? error.message : 'Unknown analysis error'}
Status: Unable to process file content`;
    }
  };
  const extractPDFContentDirect = async (file: File): Promise<string> => {
    try {
      return `📄 PDF DOCUMENT ANALYSIS:

File Details:
• Name: ${file.name}
• Size: ${(file.size / 1024).toFixed(2)} KB  
• Type: PDF Document
• Estimated Pages: ${Math.ceil(file.size / 1024 / 50)}

PDF Structure Analysis:
• Format: Portable Document Format (PDF)
• Content Type: ${file.size > 500000 ? 'Large document - likely contains images/graphics' : file.size > 100000 ? 'Medium document - mixed content' : 'Small document - mostly text'}
• Estimated Word Count: ${Math.round(file.size / 6)} words (approximate)

Content Processing:
⚠️ PDF text extraction requires specialized parsing. This PDF likely contains:
- Formatted text content
- Possible images or graphics  
- Document structure (headers, paragraphs, etc.)
- Metadata (author, creation date, etc.)

To get the actual text content from this PDF, it needs to be processed with a PDF parsing service that can extract the embedded text, images, and formatting information.

File Ready: PDF metadata captured and ready for content extraction processing.`;
    } catch (error) {
      return `❌ PDF ANALYSIS ERROR:
File: ${file.name}
Error: ${error instanceof Error ? error.message : 'PDF processing failed'}`;
    }
  };
  const detectFileStructure = (text: string): string => {
    if (text.includes('{') && text.includes('}')) return 'JSON/Structured data';
    if (text.includes('<') && text.includes('>')) return 'XML/HTML markup';
    if (text.includes(',') && text.includes('\n')) return 'CSV/Tabular data';
    if (text.includes('function') || text.includes('class')) return 'Source code';
    return 'Plain text/Document';
  };
  const detectDataFormat = (text: string): string => {
    const sample = text.substring(0, 500).toLowerCase();
    if (sample.includes('json') || sample.includes('{') && sample.includes('"')) return 'JSON format';
    if (sample.includes('xml') || sample.includes('<?xml')) return 'XML format';
    if (sample.includes('\t') || sample.match(/,.*,.*,/)) return 'Delimited data (CSV/TSV)';
    if (sample.match(/^\s*#/) || sample.includes('markdown')) return 'Markdown/Documentation';
    return 'Plain text';
  };
  const categorizeFile = (fileType: string): string => {
    if (fileType.startsWith('text/')) return 'Text Document';
    if (fileType.startsWith('image/')) return 'Image File';
    if (fileType.startsWith('video/')) return 'Video Media';
    if (fileType.startsWith('audio/')) return 'Audio Media';
    if (fileType.includes('pdf')) return 'PDF Document';
    if (fileType.includes('document') || fileType.includes('word')) return 'Word Document';
    if (fileType.includes('spreadsheet') || fileType.includes('excel')) return 'Spreadsheet';
    if (fileType.includes('presentation') || fileType.includes('powerpoint')) return 'Presentation';
    return 'Binary/Other File';
  };
  const findKeyPatterns = (text: string): string => {
    const patterns = [];
    if (/\b\d{4}-\d{2}-\d{2}\b/.test(text)) patterns.push('dates');
    if (/\b[\w.-]+@[\w.-]+\.\w+\b/.test(text)) patterns.push('emails');
    if (/https?:\/\/[^\s]+/.test(text)) patterns.push('URLs');
    if (/\b\d{3}-\d{3}-\d{4}\b/.test(text)) patterns.push('phone numbers');
    if (/\$\d+|\d+\.\d{2}/.test(text)) patterns.push('currency/prices');
    if (/[{}[\]]/.test(text)) patterns.push('structured data');
    return patterns.length > 0 ? patterns.join(', ') : 'plain text';
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
        console.error('Total file size too large');
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

  // Helper function to get OpenAI API key (placeholder for actual implementation)
  const getOpenAIKey = async () => {
    // In production, this should be retrieved from your secure backend
    // For now, using a placeholder that will be handled by the edge function
    return 'demo-key';
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
    if (type.includes('pdf')) return <FileText className="h-4 w-4 text-red-500" />;
    if (type.includes('document') || type.includes('word')) return <FileText className="h-4 w-4 text-blue-500" />;
    if (type.startsWith('audio/')) return <FileText className="h-4 w-4 text-green-500" />;
    if (type.startsWith('video/')) return <FileText className="h-4 w-4 text-purple-500" />;
    return <FileText className="h-4 w-4" />;
  };
  const isImageFile = (type: string) => type.startsWith('image/');
  const startRecording = async () => {
    console.log('🎤 Starting speech recognition...');
    try {
      // Check if browser supports Web Speech API
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        console.error('❌ Speech recognition not supported in this browser');
        toast.error('Speech recognition not supported in this browser');
        return;
      }

      // Check if we're on HTTPS or localhost
      const isSecureContext = window.isSecureContext || location.protocol === 'https:' || location.hostname === 'localhost';
      const isChromeBased = /Chrome|Chromium|Edge/.test(navigator.userAgent) && !/Safari/.test(navigator.userAgent);
      console.log('🔐 Security context check:', {
        isSecureContext,
        isChromeBased,
        protocol: location.protocol,
        hostname: location.hostname,
        userAgent: navigator.userAgent
      });

      // For Chrome-based browsers on HTTP (non-localhost), show a helpful message
      if (isChromeBased && !isSecureContext && location.hostname !== 'localhost') {
        console.error('❌ Chrome-based browsers require HTTPS for speech recognition');
        toast.error('Speech recognition requires HTTPS in this browser. Please use HTTPS or try Safari.');
        return;
      }
      console.log('✅ Speech recognition supported, creating instance...');
      const recognition = new SpeechRecognition();

      // Configure recognition with better settings for different browsers
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      // Add timeout handling for Chrome-based browsers
      if (isChromeBased) {
        recognition.maxAlternatives = 1;
      }
      console.log('🔧 Speech recognition configured:', {
        continuous: recognition.continuous,
        interimResults: recognition.interimResults,
        lang: recognition.lang,
        maxAlternatives: recognition.maxAlternatives || 'default'
      });
      let finalTranscript = '';
      let recognitionTimeout: NodeJS.Timeout;
      recognition.onstart = () => {
        console.log('🎤 Speech recognition started successfully');
        setIsRecording(true);

        // Set a timeout to restart recognition if it stops unexpectedly
        recognitionTimeout = setTimeout(() => {
          console.log('⏰ Recognition timeout - restarting...');
          if (mediaRecorder === recognition) {
            recognition.stop();
          }
        }, 30000); // 30 second timeout
      };
      recognition.onresult = event => {
        console.log('📝 Speech recognition result received:', event);
        if (recognitionTimeout) {
          clearTimeout(recognitionTimeout);
        }
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          console.log(`📄 Result ${i}:`, {
            transcript,
            isFinal: event.results[i].isFinal,
            confidence: event.results[i][0].confidence
          });
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
            console.log('✅ Final transcript updated:', finalTranscript);
          } else {
            interimTranscript += transcript;
            console.log('📝 Interim transcript:', interimTranscript);
          }
        }

        // Update input with final transcript
        if (finalTranscript) {
          const textToAdd = finalTranscript.trim();
          console.log('📝 Preparing to update input with:', textToAdd);
          setInput(prevInput => {
            const newInput = prevInput + (prevInput ? ' ' : '') + textToAdd;
            console.log('📝 Updating input field:', {
              prevInput,
              textToAdd,
              newInput
            });
            return newInput;
          });
          finalTranscript = ''; // Clear after capturing the value
        }
      };
      recognition.onerror = event => {
        console.error('❌ Speech recognition error:', {
          error: event.error,
          message: event.message,
          timestamp: new Date().toISOString(),
          browser: isChromeBased ? 'Chrome-based' : 'Other'
        });
        if (recognitionTimeout) {
          clearTimeout(recognitionTimeout);
        }
        setIsRecording(false);
        setMediaRecorder(null);

        // Show user-friendly error message with browser-specific advice
        switch (event.error) {
          case 'network':
            if (isChromeBased) {
              toast.error('Network error: Try using Safari or enable HTTPS. Chrome-based browsers need secure connection for speech recognition.');
            } else {
              toast.error('Network error - please check your internet connection');
            }
            break;
          case 'not-allowed':
            toast.error('Microphone access denied - please allow microphone permission');
            break;
          case 'no-speech':
            toast.error('No speech detected - please try speaking again');
            break;
          case 'audio-capture':
            toast.error('Audio capture failed - please check your microphone');
            break;
          default:
            toast.error(`Speech recognition error: ${event.error}`);
        }
      };
      recognition.onend = () => {
        console.log('🛑 Speech recognition ended');
        if (recognitionTimeout) {
          clearTimeout(recognitionTimeout);
        }
        setIsRecording(false);
        setMediaRecorder(null);

        // Focus on textarea
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      };
      console.log('🚀 Starting speech recognition...');
      recognition.start();
      setMediaRecorder(recognition as any); // Store recognition instance
    } catch (error) {
      console.error('❌ Failed to start speech recognition:', error);
      setIsRecording(false);
      toast.error('Failed to start speech recognition');
    }
  };
  const stopRecording = () => {
    console.log('🛑 Stopping speech recognition...');
    if (mediaRecorder && 'stop' in mediaRecorder) {
      console.log('🔴 Calling stop on recognition instance');
      (mediaRecorder as any).stop();
      setMediaRecorder(null);
      setIsRecording(false);
    } else {
      console.log('⚠️ No active recognition instance to stop');
    }
  };
  const generateChatTitleFromConversation = async (chatId: string, messages: Message[]) => {
    // Only update if we have enough messages for context (2-3 messages minimum)
    if (messages.length < 3) return null;

    // Get the last few user messages to understand the conversation theme
    const userMessages = messages.filter(msg => msg.role === 'user').slice(0, 3) // Take first 3 user messages
    .map(msg => msg.content);
    if (userMessages.length < 2) return null;

    // Combine messages to find common themes
    const combinedText = userMessages.join(' ').toLowerCase();

    // Detect common conversation themes
    const themes = {
      'coding': /\b(code|programming|function|javascript|python|react|typescript|debug|error|syntax|api|database|sql|html|css|git|github)\b/g,
      'business': /\b(business|marketing|strategy|sales|profit|revenue|customer|client|market|competition|startup|entrepreneur)\b/g,
      'design': /\b(design|ui|ux|interface|layout|color|font|typography|logo|branding|aesthetic|visual|mockup)\b/g,
      'writing': /\b(write|writing|content|article|blog|essay|copy|text|paragraph|grammar|editing|proofreading)\b/g,
      'image': /\b(image|picture|photo|generate|create|draw|art|illustration|design|visual|graphic)\b/g,
      'analysis': /\b(analyze|analysis|data|report|research|study|examine|evaluate|compare|statistics)\b/g,
      'learning': /\b(learn|learning|study|understand|explain|teach|tutorial|guide|how to|lesson)\b/g,
      'planning': /\b(plan|planning|schedule|organize|task|project|timeline|goal|objective|strategy)\b/g
    };
    let bestTheme = '';
    let maxMatches = 0;
    for (const [theme, regex] of Object.entries(themes)) {
      const matches = combinedText.match(regex);
      if (matches && matches.length > maxMatches) {
        maxMatches = matches.length;
        bestTheme = theme;
      }
    }

    // Generate contextual title based on theme and content
    const firstMessage = userMessages[0];
    let title = '';
    if (bestTheme && maxMatches >= 2) {
      // Create themed title
      const themePrefix = {
        'coding': 'Code Help: ',
        'business': 'Business: ',
        'design': 'Design: ',
        'writing': 'Writing: ',
        'image': 'Image Gen: ',
        'analysis': 'Analysis: ',
        'learning': 'Learning: ',
        'planning': 'Planning: '
      };
      title = themePrefix[bestTheme as keyof typeof themePrefix] + generateChatTitle(firstMessage);
    } else {
      // Use improved title based on conversation flow
      title = generateChatTitle(firstMessage);
    }
    return title.length > 50 ? title.substring(0, 47) + '...' : title;
  };
  const updateChatTitleFromConversation = async (chatId: string) => {
    // Update title after 2 messages
    if (messages.length >= 2) {
      const {
        data: currentChat
      } = await supabase.from('chats').select('title').eq('id', chatId).single();

      // Only update if title is still basic/auto-generated (not custom)
      if (currentChat && (currentChat.title === 'New Chat' || currentChat.title.length < 30 || !currentChat.title.includes(' '))) {
        const newTitle = await generateChatTitleFromConversation(chatId, messages);
        if (newTitle && newTitle !== currentChat.title) {
          console.log('Updating conversation title to:', newTitle);
          const {
            error: updateError
          } = await supabase.from('chats').update({
            title: newTitle
          }).eq('id', chatId);
          if (!updateError) {
            window.dispatchEvent(new CustomEvent('force-chat-refresh'));
          }
        }
      }
    }
  };
  const generateChatTitle = (message: string) => {
    // Remove extra whitespace and normalize
    const cleaned = message.trim().replace(/\s+/g, ' ');

    // Common words to filter out
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'can', 'may', 'might', 'must', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'this', 'that', 'these', 'those', 'what', 'when', 'where', 'why', 'how', 'please', 'help', 'tell', 'explain', 'show', 'give', 'get', 'make', 'take', 'go', 'come']);

    // Split into words and filter
    const words = cleaned.toLowerCase().split(/\s+/).filter(word => word.length > 2 && !stopWords.has(word)).map(word => word.replace(/[^\w]/g, '')) // Remove punctuation
    .filter(word => word.length > 2);

    // If we have good keywords, use them
    if (words.length >= 2) {
      // Take first 3-4 most important words
      const selectedWords = words.slice(0, 4);

      // Capitalize each word
      const title = selectedWords.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

      // Ensure it's not too long
      if (title.length <= 40) {
        return title;
      }
    }

    // Fallback: look for question patterns
    if (cleaned.toLowerCase().startsWith('how')) {
      const match = cleaned.match(/^how (?:to |do i |can i |should i )?([\w\s]{3,25})/i);
      if (match) {
        return `How to ${match[1].trim().charAt(0).toUpperCase() + match[1].trim().slice(1)}`;
      }
    }
    if (cleaned.toLowerCase().startsWith('what')) {
      const match = cleaned.match(/^what (?:is |are |does |do )?([\w\s]{3,25})/i);
      if (match) {
        return `What is ${match[1].trim().charAt(0).toUpperCase() + match[1].trim().slice(1)}`;
      }
    }
    if (cleaned.toLowerCase().startsWith('why')) {
      const match = cleaned.match(/^why (?:is |are |does |do |did )?([\w\s]{3,25})/i);
      if (match) {
        return `Why ${match[1].trim().charAt(0).toUpperCase() + match[1].trim().slice(1)}`;
      }
    }

    // Final fallback: truncate smartly
    if (cleaned.length <= 40) {
      return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }

    // Find a good breaking point near 40 characters
    const truncated = cleaned.slice(0, 37);
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > 20) {
      return truncated.slice(0, lastSpace) + '...';
    }
    return truncated + '...';
  };
  const openFile = (url: string, name: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };
  const downloadImageFromChat = async (imageUrl: string, fileName: string) => {
    try {
      let response;
      console.log('Downloading image:', {
        imageUrl,
        fileName
      });

      // Check if it's a Supabase storage URL
      if (imageUrl.includes('lciaiunzacgvvbvcshdh.supabase.co/storage')) {
        // Extract the file path from the public URL
        const urlParts = imageUrl.split('/storage/v1/object/public/chat-files/');
        if (urlParts.length > 1) {
          const filePath = urlParts[1];
          console.log('Downloading from Supabase storage:', filePath);

          // Download using Supabase storage API
          const {
            data,
            error
          } = await supabase.storage.from('chat-files').download(filePath);
          if (error) {
            console.error('Supabase storage download error:', error);
            throw error;
          }
          response = {
            blob: () => Promise.resolve(data)
          };
        } else {
          throw new Error('Invalid Supabase storage URL');
        }
      } else {
        // For external URLs or other cases, try direct fetch
        response = await fetch(imageUrl, {
          method: 'GET',
          mode: 'cors',
          cache: 'no-cache'
        });
        if (!response.ok) throw new Error('Failed to fetch image');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || `image-${Date.now()}.png`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();

      // Cleanup
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback to opening in new tab
      try {
        const newWindow = window.open(imageUrl, '_blank');
        if (!newWindow) {
          console.error('Could not open image in new tab');
        }
      } catch (fallbackError) {
        console.error('Failed to download or open image:', fallbackError);
      }
    }
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.overflowY = 'hidden';
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 240; // Maximum height in pixels (matches CSS max-h-[240px])
      const minHeight = 24; // Minimum height

      if (scrollHeight <= maxHeight) {
        // If content fits, grow the textarea and hide scrollbar
        textareaRef.current.style.height = `${Math.max(scrollHeight, minHeight)}px`;
        textareaRef.current.style.overflowY = 'hidden';
      } else {
        // If content exceeds max height, set to max and show scrollbar
        textareaRef.current.style.height = `${maxHeight}px`;
        textareaRef.current.style.overflowY = 'auto';
      }
    }
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !loading) {
      e.preventDefault();
      sendMessage();
    }
  };
  if (!chatId) {
    return <div className="flex-1 flex items-center justify-center bg-background">
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
      </div>;
  }
  return <div className="fixed inset-0 flex flex-col bg-background">
      {/* Messages area - takes all available space above input */}
      <div className="flex-1 overflow-y-auto pb-24">
        <div className="w-full px-4 py-6" style={getContainerStyle()}>
          {messages.length === 0 ? <div className="flex items-center justify-center h-full min-h-[70vh]">
              <div className="text-center max-w-md">
                <h3 className="text-2xl font-normal mb-6 text-foreground">
                  How can I help, {userProfile?.display_name || user?.email?.split('@')[0] || 'there'}?
                </h3>
              </div>
            </div> : <div className="space-y-6">
              {messages.map(message => <div key={message.id} className="group mb-4" onMouseEnter={() => setHoveredMessage(message.id)} onMouseLeave={() => setHoveredMessage(null)}>
                  <div className={`flex ${message.role === 'user' ? 'justify-end mr-3' : 'justify-start ml-3'}`}>
                    <div className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'} max-w-[70%] relative`}>
                        <div className={`${message.role === 'user' ? 'text-black dark:text-white bg-[#DEE7F4] dark:bg-[#374151] rounded-2xl' : 'text-black dark:text-white rounded-2xl bg-transparent border-none'} px-3.5 py-2.5 relative break-words whitespace-pre-wrap`} style={{
                  padding: '10px 14px',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  hyphens: 'auto'
                }}>
                        
          {/* File attachments */}
          {message.file_attachments && message.file_attachments.length > 0 && <div className="mb-3 space-y-3">
              {message.file_attachments.map((file, index) => <div key={index}>
                  {isImageFile(file.type) && file.url ? <div className="space-y-2">
                      <img src={file.url} alt={file.name || "Image"} className="max-w-[300px] max-h-[200px] object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity shadow-sm border" onClick={() => setSelectedImage({
                          url: file.url,
                          name: file.name
                        })} onError={e => {
                          e.currentTarget.style.display = 'none';
                        }} />
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => downloadImageFromChat(file.url, file.name)}>
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div> : <div className={`flex items-center gap-3 p-3 rounded-xl border ${message.role === 'user' ? 'bg-black/10 border-white/20' : 'bg-accent border-border'}`}>
                                     <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${message.role === 'user' ? 'bg-white/20' : 'bg-muted'}`}>
                                       {getFileIcon(file.type)}
                                     </div>
                                     <div className="flex-1 min-w-0">
                                       <p className="text-sm font-medium truncate text-foreground">
                                         {file.name}
                                       </p>
                                       <p className="text-xs text-muted-foreground">
                                         {formatFileSize(file.size)} • Click to open
                                       </p>
                                     </div>
                                   </div>}
                               </div>)}
                           </div>}
                        
                           {message.content && <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-current prose-p:text-current prose-strong:text-current prose-em:text-current prose-code:text-current prose-pre:bg-muted/50 prose-pre:text-current break-words overflow-hidden [&>*]:!my-0 [&>p]:!my-0 [&>h1]:!my-1 [&>h2]:!my-0.5 [&>h3]:!my-0.5 [&>h4]:!my-0 [&>h5]:!my-0 [&>h6]:!my-0 [&>ul]:!my-0 [&>ol]:!my-0 [&>blockquote]:!my-0 [&>pre]:!my-0 [&>table]:!my-0 [&>hr]:!my-0 [&>li]:!my-0 [&>br]:hidden" style={{
                    wordBreak: 'break-word',
                    overflowWrap: 'anywhere'
                  }}>
                               {message.content.includes("🎨 Generating your image") ? <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30">
                                   <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                   <div>
                                     <p className="text-sm font-medium">Generating your image...</p>
                                     <p className="text-xs text-muted-foreground">This may take a few moments</p>
                                   </div>
                                 </div> : <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                      code({
                        node,
                        className,
                        children,
                        ...props
                      }: any) {
                        const match = /language-(\w+)/.exec(className || '');
                        const inline = !match;
                        return inline ? <code className="bg-muted/50 px-1.5 py-0.5 rounded text-sm break-words" {...props}>
                                       {children}
                                     </code> : <pre className="bg-muted/50 p-4 rounded-lg text-sm overflow-x-auto break-words !my-1">
                                       <code {...props}>
                                         {children}
                                       </code>
                                     </pre>;
                      },
                      p: ({
                        children,
                        ...props
                      }) => <p {...props} className="break-words overflow-wrap-anywhere !my-0" style={{
                        wordBreak: 'break-word',
                        overflowWrap: 'anywhere'
                      }}>
                                      {children}
                                    </p>,
                      h1: ({
                        children,
                        ...props
                      }) => <h1 {...props} className="!my-1 !mb-1">
                                     {children}
                                   </h1>,
                      h2: ({
                        children,
                        ...props
                      }) => <h2 {...props} className="!my-1 !mb-1">
                                     {children}
                                   </h2>,
                      h3: ({
                        children,
                        ...props
                      }) => <h3 {...props} className="!my-0.5 !mb-0.5">
                                     {children}
                                   </h3>,
                      h4: ({
                        children,
                        ...props
                      }) => <h4 {...props} className="!my-0.5 !mb-0.5">
                                     {children}
                                   </h4>,
                      ul: ({
                        children,
                        ...props
                      }) => <ul {...props} className="!my-0 !leading-tight [&>li]:!my-0">
                                      {children}
                                    </ul>,
                      ol: ({
                        children,
                        ...props
                      }) => <ol {...props} className="!my-0 !leading-tight [&>li]:!my-0">
                                      {children}
                                    </ol>,
                      li: ({
                        children,
                        ...props
                      }) => <li {...props} className="!my-0">
                                     {children}
                                   </li>,
                      blockquote: ({
                        children,
                        ...props
                      }) => <blockquote {...props} className="!my-1">
                                     {children}
                                   </blockquote>,
                      table: ({
                        children,
                        ...props
                      }) => <table {...props} className="!my-1">
                                     {children}
                                   </table>,
                      hr: ({
                        ...props
                      }) => <hr {...props} className="!my-1" />
                    }}>
                                {message.content}
                              </ReactMarkdown>}
                            </div>}
                         
                       </div>
                       
                        {/* Copy button - always visible, positioned below the message content */}
                        <div className={`flex mt-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 bg-background/80 backdrop-blur-sm border shadow-sm hover:bg-muted transition-opacity" onClick={() => copyToClipboard(message.content, message.id)}>
                            {copiedMessageId === message.id ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                          </Button>
                        </div>
                    </div>
                  </div>
                </div>)}
              
              {/* Show image processing indicator when generating images */}
              {chatId && currentImagePrompts.get(chatId) && <div className="flex justify-start">
                  <div className="flex flex-col items-start max-w-[80%]">
                    <ImageProcessingIndicator key={`${chatId}-${currentImagePrompts.get(chatId)}`} prompt={currentImagePrompts.get(chatId)!} />
                  </div>
                </div>}
              
              {loading && (!chatId || !currentImagePrompts.get(chatId)) && <div className="flex justify-start">
                  <div className="flex flex-col items-start max-w-[80%]">
                    <div className="bg-muted text-foreground rounded-3xl rounded-bl-lg px-5 py-3.5 shadow-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{
                    animationDelay: '0.15s'
                  }}></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{
                    animationDelay: '0.3s'
                  }}></div>
                      </div>
                    </div>
                  </div>
                </div>}
            </div>}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area - fixed at bottom without background that obscures buttons */}
      <div className="fixed bottom-0 left-0 right-0">
        <div className="px-4 py-4" style={getContainerStyle()}>
          {/* File attachments preview */}
          {selectedFiles.length > 0 && <div className="mb-4 flex flex-wrap gap-2">
              {selectedFiles.map((file, index) => <div key={index} className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 text-sm">
                  {getFileIcon(file.type)}
                  <span className="truncate max-w-32">{file.name}</span>
                  <button onClick={() => removeFile(index)} className="text-muted-foreground hover:text-foreground">
                    
                  </button>
                </div>)}
            </div>}
          
          
          <div className="relative bg-background border border-border rounded-2xl p-4">
            <Textarea ref={textareaRef} value={input} onChange={handleInputChange} onKeyDown={handleKeyDown} placeholder={isImageMode ? "Describe an image..." : "Type a message..."} className="w-full min-h-[24px] border-0 resize-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 outline-none px-0 py-0 mb-3" rows={1} />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full border border-border/50 text-muted-foreground">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-2 bg-background border shadow-lg" align="start">
                    <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={handleFileUpload}>
                      <Paperclip className="h-4 w-4" />
                      Add photos & files
                    </Button>
                    
                  </PopoverContent>
                </Popover>
                
                {isImageMode ? <>
                    {/* Image mode indicator */}
                    <div className="group flex items-center gap-1 bg-muted px-2 py-1 rounded-md text-xs">
                      <ImageIcon className="h-3 w-3" />
                      <span>Image</span>
                      <button onClick={handleExitImageMode} className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    
                    {selectedStyle ? (
                      /* Show Create Image button after style selection */
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs gap-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full border border-border/50">
                        <ImageIcon className="h-3 w-3" />
                        Create Image
                      </Button>
                    ) : (
                      /* Show Styles dropdown before style selection */
                      <Popover open={isStylesOpen} onOpenChange={setIsStylesOpen}>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs gap-1 bg-muted hover:bg-muted/80 rounded-full border border-border/50">
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
                    )}
                  </> : <Button variant="ghost" size="sm" className="h-8 px-3 rounded-full border border-border/50 text-muted-foreground" onClick={handleCreateImageClick}>
                    <ImageIcon className="h-4 w-4 mr-1" />Create an image
                  </Button>}
              </div>
              
              <div className="flex items-center gap-2">
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="w-[180px] h-8 bg-background border border-border/50 rounded-full z-50">
                    <SelectValue>
                      <span className="text-sm font-medium">{selectedModelData?.name}</span>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-background border shadow-lg">
                    {models.map(model => <SelectItem key={model.id} value={model.id}>
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="font-medium">{model.name}</div>
                            <div className="text-xs text-muted-foreground">{model.description}</div>
                          </div>
                          {model.type === 'pro' && <span className="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded">Pro</span>}
                        </div>
                      </SelectItem>)}
                  </SelectContent>
                </Select>
                
                <Button size="sm" className={`h-8 w-8 rounded-full border border-border/50 ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-foreground hover:bg-foreground/90'} text-background`} onClick={isRecording ? stopRecording : startRecording}>
                  {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
                
                <VoiceModeButton onMessageSent={(messageId, content, role) => {
                // Mark voice messages as processed to prevent auto-trigger duplicates
                if (role === 'user' && chatId) {
                  // Add to processed messages for this specific chat
                  if (!processedUserMessages.current.has(chatId)) {
                    processedUserMessages.current.set(chatId, new Set());
                  }
                  processedUserMessages.current.get(chatId)!.add(messageId);
                  console.log(`✅ Voice user message marked as processed in chat ${chatId}:`, messageId);
                  // Refresh messages immediately for user voice input
                  fetchMessages();
                } else if (role === 'assistant') {
                  // For assistant messages, refresh after a delay to let audio play
                  setTimeout(() => {
                    fetchMessages();
                  }, 1000);
                }
              }} chatId={chatId} actualTheme={actualTheme} />
              </div>
            </div>
          </div>
          
          
        </div>
      </div>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" multiple onChange={handleFileChange} className="hidden" accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.csv,.json,.xml,.py,.js,.html,.css,.md" />

      {/* Image popup modal */}
      {selectedImage && <ImagePopupModal isOpen={!!selectedImage} onClose={() => setSelectedImage(null)} imageUrl={selectedImage.url} prompt={selectedImage.name} />}

      {/* Image edit modal */}
      {showImageEditModal && imageToEdit && <ImageEditModal isOpen={showImageEditModal} onClose={() => {
      setShowImageEditModal(false);
      setImageToEdit(null);
    }} imageFile={imageToEdit} onSaveImage={async editedBlob => {
      try {
        // Convert blob to base64
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = (reader.result as string).split(',')[1];

          // Save edited image to Supabase
          const response = await supabase.functions.invoke('save-image', {
            body: {
              imageBase64: base64,
              fileName: `edited_${imageToEdit?.name || 'image.png'}`,
              chatId: chatId,
              userId: user?.id,
              imageType: 'edited'
            }
          });
          if (response.data?.success) {
            toast.success('Image edited and saved successfully!');

            // Add edited image to chat as assistant message
            const editedImageMessage: Message = {
              id: `temp-edited-${Date.now()}`,
              chat_id: chatId!,
              content: 'Here is your edited image:',
              role: 'assistant',
              created_at: new Date().toISOString(),
              file_attachments: [{
                id: Date.now().toString(),
                name: `edited_${imageToEdit?.name || 'image.png'}`,
                size: editedBlob.size,
                type: 'image/png',
                url: response.data.url
              }]
            };
            setMessages(prev => [...prev, editedImageMessage]);

            // Save to database
            await supabase.from('messages').insert({
              chat_id: chatId,
              content: 'Here is your edited image:',
              role: 'assistant',
              file_attachments: editedImageMessage.file_attachments as any,
              embedding: null
            });
          } else {
            toast.error('Failed to save edited image');
          }
        };
        reader.readAsDataURL(editedBlob);
      } catch (error) {
        console.error('Error saving edited image:', error);
        toast.error('Failed to save edited image');
      }
    }} />}

      {/* Auth Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onSuccess={() => {
      // Focus back to textarea after successful login
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }} />
    </div>;
}