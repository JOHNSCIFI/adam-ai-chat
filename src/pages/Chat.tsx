import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useSidebar, SidebarTrigger } from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare, Plus, Paperclip, Copy, Check, X, FileText, ImageIcon, Mic, MicOff, Download, MoreHorizontal, Image as ImageIcon2, Palette, ChevronDown, ChevronUp, Bot } from 'lucide-react';
import { SendHorizontalIcon } from '@/components/ui/send-horizontal-icon';
import { StopIcon } from '@/components/ui/stop-icon';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ImagePopupModal } from '@/components/ImagePopupModal';
import { FileAnalyzer } from '@/components/FileAnalyzer';
import { ImageProcessingIndicator } from '@/components/ImageProcessingIndicator';

import AuthModal from '@/components/AuthModal';
import chatgptLogo from '@/assets/chatgpt-logo.png';
import chatgptLogoLight from '@/assets/chatgpt-logo-light.png';
import claudeLogo from '@/assets/claude-logo.png';

// Speech recognition will be accessed with type casting to avoid global conflicts
import { ImageAnalysisResult, analyzeImageComprehensively } from '@/utils/imageAnalysis';
const models = [{
  id: 'gpt-4o-mini',
  name: 'GPT-4o mini',
  shortLabel: 'GPT-4o mini',
  description: "Default model (fast + low cost)",
  type: 'free'
}, {
  id: 'gpt-4o',
  name: 'GPT-4o',
  shortLabel: 'GPT-4o',
  description: "High Quality option",
  type: 'pro'
}, {
  id: 'claude-sonnet-4',
  name: 'Claude Sonnet 4',
  shortLabel: 'Claude Sonnet 4',
  description: "Alternative for natural language and writing",
  type: 'pro'
}, {
  id: 'generate-image',
  name: 'Generate Image',
  shortLabel: 'Generate Image',
  description: "Create images with DALL·E 3",
  type: 'action'
}];
interface Message {
  id: string;
  chat_id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
  file_attachments?: FileAttachment[];
  image_analysis?: ImageAnalysisResult[]; // Store image analysis results
  model?: string; // Store the model used for assistant messages
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
  const { chatId } = useParams();
  const location = useLocation();
  const { user, userProfile } = useAuth();
  const { actualTheme } = useTheme();
  // Remove toast hook since we're not using toasts
  const { state: sidebarState, isMobile } = useSidebar();
  
  // Choose the appropriate ChatGPT logo based on theme
  const chatgptLogoSrc = actualTheme === 'dark' ? chatgptLogo : chatgptLogoLight;
  const collapsed = sidebarState === 'collapsed';

  // Auto-deletion timer
  const autoDeleteTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

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
  const [messageRatings, setMessageRatings] = useState<{[key: string]: 'like' | 'dislike'}>({});
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedModel, setSelectedModel] = useState(() => {
    // Use model from navigation state if available, otherwise default to gpt-4o-mini
    return location.state?.selectedModel || 'gpt-4o-mini';
  });
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

  // Auto-deletion timer
  useEffect(() => {
    if (!chatId || !user || hasUserInteracted) return;

    // Clear any existing timer
    if (autoDeleteTimerRef.current) {
      clearTimeout(autoDeleteTimerRef.current);
    }

    // Set timer for 2 minutes (120 seconds)
    autoDeleteTimerRef.current = setTimeout(async () => {
      if (!hasUserInteracted) {
        try {
          console.log(`[AUTO-DELETE] Deleting inactive chat: ${chatId}`);
          
          // Delete the chat and its messages
          const { error: deleteError } = await supabase
            .from('chats')
            .delete()
            .eq('id', chatId);

          if (deleteError) {
            console.error('Error auto-deleting chat:', deleteError);
          } else {
            console.log(`[AUTO-DELETE] Successfully deleted chat: ${chatId}`);
            // Navigate to home page
            window.location.href = '/';
          }
        } catch (error) {
          console.error('Error in auto-delete:', error);
        }
      }
    }, 2 * 60 * 1000); // 2 minutes

    // Cleanup timer on unmount
    return () => {
      if (autoDeleteTimerRef.current) {
        clearTimeout(autoDeleteTimerRef.current);
      }
    };
  }, [chatId, user, hasUserInteracted]);

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

  const regenerateResponse = async (messageId: string) => {
    if (isGeneratingResponse || loading) {
      console.log('Skipping regenerate - already in progress');
      return;
    }

    // Find the assistant message to regenerate
    const assistantMessage = messages.find(msg => msg.id === messageId && msg.role === 'assistant');
    if (!assistantMessage) {
      console.error('Assistant message not found for regeneration');
      return;
    }

    // Find the user message that came before this assistant message
    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    let userMessage = '';
    let userModel = selectedModel; // Default to current selected model
    
    // Look backwards to find the previous user message
    for (let i = messageIndex - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        userMessage = messages[i].content;
        break;
      }
    }

    // Use the model from the original assistant message if available
    if (assistantMessage.model) {
      userModel = assistantMessage.model;
    }

    if (!userMessage) {
      console.error('No user message found before assistant message');
      return;
    }

    setIsGeneratingResponse(true);
    try {
      console.log('Regenerating response for user message:', userMessage, 'with model:', userModel);

      const webhookResponse = await fetch('https://adsgbt.app.n8n.cloud/webhook/adamGPT', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'text',
          message: userMessage,
          userId: user.id,
          chatId: chatId,
          model: userModel
        })
      });
      
      if (!webhookResponse.ok) {
        throw new Error(`Webhook request failed: ${webhookResponse.status}`);
      }
      
      const aiResponse = await webhookResponse.json();
      console.log('Regenerated webhook response:', aiResponse);
      
      if (aiResponse?.response || aiResponse?.content || aiResponse?.text) {
        const responseContent = aiResponse.response || aiResponse.content || aiResponse.text;

        // Handle image generation responses
        let fileAttachments: FileAttachment[] = [];
        if (aiResponse.image_url) {
          fileAttachments = [{
            id: crypto.randomUUID(),
            name: `generated_image_${Date.now()}.png`,
            size: 0,
            type: 'image/png',
            url: aiResponse.image_url
          }];
        }

        // Update the existing message instead of creating a new one
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { 
                ...msg, 
                content: responseContent, 
                file_attachments: fileAttachments,
                model: userModel 
              }
            : msg
        ));

        // Update the message in the database
        const { error: updateError } = await supabase
          .from('messages')
          .update({
            content: responseContent,
            model: userModel,
            file_attachments: fileAttachments.length > 0 ? JSON.stringify(fileAttachments) : null
          })
          .eq('id', messageId);

        if (updateError) {
          console.error('Error updating regenerated message:', updateError);
        }

        scrollToBottom();
      }
    } catch (error) {
      console.error('Error regenerating response:', error);
    } finally {
      setIsGeneratingResponse(false);
    }
  };

  const triggerAIResponse = async (userMessage: string, userMessageId: string) => {
    console.log('triggerAIResponse called:', {
      userMessage,
      userMessageId,
      isGeneratingResponse,
      loading,
      selectedModel
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

      // Send message directly to webhook with selected model
      console.log('Sending to webhook with model:', selectedModel);
      const webhookResponse = await fetch('https://adsgbt.app.n8n.cloud/webhook/adamGPT', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'text',
          message: userMessage,
          userId: user.id,
          chatId: originalChatId,
          model: selectedModel
        })
      });
      
      if (!webhookResponse.ok) {
        throw new Error(`Webhook request failed: ${webhookResponse.status}`);
      }
      
      const aiResponse = await webhookResponse.json();
      console.log('Webhook response received:', aiResponse);
      if (aiResponse?.response || aiResponse?.content || aiResponse?.text) {
        const responseContent = aiResponse.response || aiResponse.content || aiResponse.text;
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
          file_attachments: fileAttachments,
          model: selectedModel
        };

        // Only update UI if user is still viewing the original chat
        if (chatId === originalChatId) {
          setMessages(prev => [...prev, assistantMessage]);
          scrollToBottom();
        }

        // Clear image prompt when response is received (only for original chat)
        // Note: Image requests are now handled by webhook
        setCurrentImagePrompts(prev => {
          const newMap = new Map(prev);
          newMap.delete(originalChatId);
          return newMap;
        });

        // ALWAYS save to database with the ORIGINAL chat ID (not current chatId)
        console.log('Saving AI message to database for chat:', originalChatId);
        const {
          error: saveError
        } = await supabase.from('messages').insert({
          chat_id: originalChatId,
          content: responseContent,
          role: 'assistant',
          model: selectedModel,
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
    setIsImageMode(false); // Reset to original state after selecting style

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
                message: userMessage,
                model: selectedModel
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

            // Images are now handled by webhook - no need for separate storage
            persistentFileAttachments.push({
              id: `temp-file-${Date.now()}-${Math.random()}`,
              name: file.name,
              size: file.size,
              type: file.type,
              url: file.url // Use existing blob URL
            });
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
        // For images, analysis now handled by webhook only
        console.log('Image analysis skipped - using webhook only');
        
        // Return empty string - images are processed by webhook
        return '';
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
    // Embeddings disabled - all processing now goes through webhook only
    console.log('Embedding generation skipped - using webhook only');
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
    
    // Find the AI message being rated
    const aiMessage = messages.find(msg => msg.id === messageId && msg.role === 'assistant');
    if (!aiMessage) return;
    
    // Find the user message that preceded this AI message
    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    let userMessage = '';
    
    // Look backwards to find the previous user message
    for (let i = messageIndex - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        userMessage = messages[i].content;
        break;
      }
    }
    
    try {
      if (newRating) {
        await supabase.from('message_ratings' as any).upsert({
          message_id: messageId,
          user_id: user.id,
          rating: newRating,
          user_message: userMessage,
          ai_message: aiMessage.content
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
    if (!user || !chatId || messages.length === 0) return;
    
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
  const handleFileUpload = () => {
    fileInputRef.current?.click();
    setIsPopoverOpen(false);
  };
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      const combinedFiles = [...selectedFiles, ...newFiles];
      
      const totalSize = combinedFiles.reduce((sum, file) => sum + file.size, 0);
      const maxTotalSize = 100 * 1024 * 1024; // 100MB total per message

      if (totalSize > maxTotalSize) {
        toast.error('Total file size cannot exceed 100MB');
        event.target.value = '';
        return;
      }
      
      if (combinedFiles.length > 10) {
        toast.error('Maximum 10 files allowed per message');
        event.target.value = '';
        return;
      }
      
      setSelectedFiles(combinedFiles);
      toast.success(`${newFiles.length} file(s) added (${combinedFiles.length} total)`);
      // Reset the input
      event.target.value = '';
    }
  };
  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // OpenAI functions removed - all processing now goes through webhook only
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
      const isSecureContext = window.isSecureContext || window.location.protocol === 'https:' || window.location.hostname === 'localhost';
      const isChromeBased = /Chrome|Chromium|Edge/.test(navigator.userAgent) && !/Safari/.test(navigator.userAgent);
      console.log('🔐 Security context check:', {
        isSecureContext,
        isChromeBased,
        protocol: window.location.protocol,
        hostname: window.location.hostname,
        userAgent: navigator.userAgent
      });

      // For Chrome-based browsers on HTTP (non-localhost), show a helpful message
      if (isChromeBased && !isSecureContext && window.location.hostname !== 'localhost') {
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
    
    // Mark user interaction to prevent auto-deletion
    if (value.trim()) {
      setHasUserInteracted(true);
    }

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
      </div>
  }
  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      {/* Mobile Header with Sidebar Trigger */}
      {isMobile && (
        <div className="relative flex items-center p-3 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
          <SidebarTrigger 
            className="h-9 w-9 hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Open sidebar menu"
          />
          
          {/* Mobile Model Selector triggered by AdamGpt - Absolutely centered */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <Select value={selectedModel} onValueChange={setSelectedModel} onOpenChange={setIsModelDropdownOpen}>
              <SelectTrigger 
                className="bg-transparent border-0 hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-primary rounded-lg transition-all duration-200 h-auto p-2 [&>svg]:hidden"
                aria-label="Select AI model"
              >
                <div className="flex items-center justify-center gap-1 whitespace-nowrap">
                  <h1 className="text-lg font-semibold">AdamGpt</h1>
                  {isModelDropdownOpen ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </SelectTrigger>
              <SelectContent className="z-50 bg-background border shadow-lg rounded-lg p-1 min-w-[240px] max-w-[280px]" align="center">
                {models.map(model => (
                  <SelectItem 
                    key={model.id} 
                    value={model.id} 
                    className="rounded-md px-2 py-1.5 hover:bg-accent/60 focus-visible:bg-accent/60 transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-2 w-full">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {model.id.includes('gpt') ? (
                          <img src={chatgptLogoSrc} alt="OpenAI" className="w-3.5 h-3.5 object-contain flex-shrink-0" />
                        ) : model.id.includes('claude') ? (
                          <img src={claudeLogo} alt="Claude" className="w-3.5 h-3.5 object-contain flex-shrink-0" />
                        ) : (
                          <Bot className="h-3.5 w-3.5 flex-shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm truncate">{model.name}</div>
                          <div className="text-xs text-muted-foreground truncate">{model.description}</div>
                        </div>
                      </div>
                      {model.type === 'pro' && <span className="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded flex-shrink-0 ml-auto">Pro</span>}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Messages area - takes all available space above input */}
      <div 
        className="flex-1 overflow-y-auto pb-32 relative"
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragOver(true);
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          // Only hide overlay if leaving the entire messages area
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsDragOver(false);
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragOver(false);
          
          const newFiles = Array.from(e.dataTransfer.files);
          if (newFiles.length > 0) {
            // Combine existing files with new files
            const combinedFiles = [...selectedFiles, ...newFiles];
            
            const totalSize = combinedFiles.reduce((sum, file) => sum + file.size, 0);
            const maxTotalSize = 100 * 1024 * 1024; // 100MB total per message
            
            if (totalSize > maxTotalSize) {
              toast.error('Total file size cannot exceed 100MB');
              return;
            }
            
            if (combinedFiles.length > 10) {
              toast.error('Maximum 10 files allowed per message');
              return;
            }
            
            setSelectedFiles(combinedFiles);
            toast.success(`${newFiles.length} file(s) added (${combinedFiles.length} total)`);
          }
        }}
      >
        <div className={`w-full px-4 py-6 ${!isMobile ? '' : ''}`} style={!isMobile ? getContainerStyle() : {}}>
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
                       
                         {/* Message action buttons */}
                         <div className={`flex gap-1 mt-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                           {/* Copy button - always show */}
                           <Button variant="ghost" size="sm" className="h-7 w-7 p-0 bg-background/80 backdrop-blur-sm hover:bg-muted transition-opacity" onClick={() => copyToClipboard(message.content, message.id)}>
                             {copiedMessageId === message.id ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                           </Button>
                           
                           {/* Assistant message actions */}
                           {message.role === 'assistant' && (
                             <>
                               {/* Volume/Speaker button */}
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
                               
                                 {/* Refresh button - only show on last AI response */}
                                 {(() => {
                                   // Find the last assistant message
                                   const lastAssistantMessage = [...messages].reverse().find(msg => msg.role === 'assistant');
                                   return lastAssistantMessage && lastAssistantMessage.id === message.id;
                                 })() && (
                                   <Button 
                                     variant="ghost" 
                                     size="sm" 
                                     className="h-7 w-7 p-0 bg-background/80 backdrop-blur-sm hover:bg-muted transition-opacity"
                                     onClick={() => regenerateResponse(message.id)}
                                     disabled={isGeneratingResponse}
                                   >
                                     <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                       <path d="M21 2v6h-6"></path>
                                       <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
                                       <path d="M3 22v-6h6"></path>
                                       <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
                                     </svg>
                                   </Button>
                                 )}
                             </>
                           )}
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

      {/* Input area - mobile design matching Index page */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border/20">
        <div className={`px-3 py-3 ${!isMobile ? 'max-w-3xl mx-auto' : ''}`} style={!isMobile ? getContainerStyle() : {}}>
          {/* File attachments preview */}
          {selectedFiles.length > 0 && <div className="mb-3 flex flex-wrap gap-2">
              {selectedFiles.map((file, index) => <div key={index} className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 text-sm">
                  {getFileIcon(file.type)}
                  <span className="truncate max-w-32">{file.name}</span>
                  <button onClick={() => removeFile(index)} className="text-muted-foreground hover:text-foreground">
                    <X className="h-3 w-3" />
                  </button>
                </div>)}
            </div>}
          
          <div 
            className={`relative bg-background border border-border rounded-xl p-3 transition-all duration-200 ${
              isDragOver ? 'border-primary border-2 border-dashed bg-primary/5' : ''
            }`}
          >
            {/* Drag and drop overlay */}
            {isDragOver && (
              <div className="absolute inset-0 bg-primary/10 flex items-center justify-center z-50 rounded-xl border-2 border-dashed border-primary">
                <div className="text-center">
                  <Paperclip className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="text-base font-semibold text-primary">Drop files here</p>
                </div>
              </div>
            )}
            <Textarea 
              ref={textareaRef} 
              value={input} 
              onChange={handleInputChange} 
              onKeyDown={handleKeyDown} 
              placeholder={isImageMode ? "Describe an image..." : "ask me anything..."} 
              className="w-full min-h-[24px] border-0 resize-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 outline-none px-0 py-0 mb-3 text-sm" 
              rows={1}
            />
            
            {/* Mobile Image mode controls */}
            {isImageMode && (
              <div className="flex items-center gap-2 mb-3 flex-wrap animate-fade-in">
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
              </div>
            )}

            <div className="flex items-center justify-between">
              {/* Mobile controls */}
              {isMobile ? (
                <>
                  {/* Left side - Upload button */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 rounded-full border border-border/30 text-muted-foreground hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary flex-shrink-0" 
                        aria-label="Upload or create content"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48 p-2 bg-background border shadow-lg z-50" align="start">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start gap-2"
                        onClick={handleFileUpload}
                      >
                        <Paperclip className="h-4 w-4" />
                        Add photos & files
                      </Button>
                        <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start gap-2"
                        onClick={handleCreateImageClick}
                      >
                        <ImageIcon className="h-4 w-4" />
                        Generate an image
                      </Button>
                    </PopoverContent>
                  </Popover>

                  {/* Right side - Send/Voice controls */}
                  <div className="flex items-center gap-2 bg-muted/30 rounded-full p-1">
                    <Button 
                      size="sm" 
                      className={`h-7 w-7 rounded-full focus-visible:ring-2 focus-visible:ring-offset-1 flex-shrink-0 ${
                        input.trim().length > 0
                          ? 'bg-foreground hover:bg-foreground/90 focus-visible:ring-primary text-background'
                          : isRecording 
                            ? 'bg-red-500 hover:bg-red-600 focus-visible:ring-red-300 text-background' 
                            : 'bg-foreground hover:bg-foreground/90 focus-visible:ring-primary text-background'
                      }`} 
                      onClick={input.trim().length > 0 ? sendMessage : (isRecording ? stopRecording : startRecording)}
                      aria-label={input.trim().length > 0 ? "Send message" : (isRecording ? "Stop recording" : "Start voice recording")}
                      aria-pressed={isRecording}
                    >
                      {input.trim().length > 0 ? (
                        <SendHorizontalIcon className="h-3 w-3" />
                      ) : (
                        isRecording ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />
                      )}
                    </Button>
                    
                  </div>
                </>
              ) : (
                /* Desktop controls */
                <>
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
                        <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={handleCreateImageClick}>
                          <ImageIcon className="h-4 w-4" />
                          Generate an image
                        </Button>
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                      <SelectTrigger className="w-[180px] h-8 bg-background border border-border/50 rounded-full z-50">
                        <SelectValue>
                          <span className="text-sm font-medium">{selectedModelData?.shortLabel}</span>
                        </SelectValue>
                      </SelectTrigger>
                       <SelectContent className="z-50 bg-background border shadow-lg rounded-lg p-1 min-w-[200px] max-w-[280px]">
                          {models.map(model => <SelectItem key={model.id} value={model.id} className="px-2 py-1.5 rounded-md">
                              <div className="flex items-center justify-between gap-2 w-full">
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  {model.id.includes('gpt') ? (
                                    <img src={chatgptLogoSrc} alt="OpenAI" className="w-3.5 h-3.5 object-contain flex-shrink-0" />
                                  ) : model.id.includes('claude') ? (
                                     <img src={claudeLogo} alt="Claude" className="w-3.5 h-3.5 object-contain flex-shrink-0" />
                                   ) : (
                                     <Bot className="h-3.5 w-3.5 flex-shrink-0" />
                                   )}
                                  <div className="min-w-0 flex-1">
                                    <div className="font-medium text-sm truncate">{model.name}</div>
                                    <div className="text-xs text-muted-foreground truncate">{model.description}</div>
                                  </div>
                                </div>
                                {model.type === 'pro' && <span className="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded flex-shrink-0 ml-auto">Pro</span>}
                              </div>
                            </SelectItem>)}
                       </SelectContent>
                    </Select>
                    
                    <Button 
                      size="sm" 
                      className={`h-8 w-8 rounded-full border border-border/50 ${
                        input.trim().length > 0
                          ? 'bg-foreground hover:bg-foreground/90 text-background'
                          : isRecording 
                            ? 'bg-red-500 hover:bg-red-600 text-background' 
                            : 'bg-foreground hover:bg-foreground/90 text-background'
                      }`} 
                      onClick={input.trim().length > 0 ? sendMessage : (isRecording ? stopRecording : startRecording)}
                      aria-label={input.trim().length > 0 ? "Send message" : (isRecording ? "Stop recording" : "Start voice recording")}
                    >
                      {input.trim().length > 0 ? (
                        <SendHorizontalIcon className="h-4 w-4" />
                      ) : (
                        isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />
                      )}
                    </Button>
                    
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" multiple onChange={handleFileChange} className="hidden" accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.csv,.json,.xml,.py,.js,.html,.css,.md" />

      {/* Image popup modal */}
      {selectedImage && <ImagePopupModal isOpen={!!selectedImage} onClose={() => setSelectedImage(null)} imageUrl={selectedImage.url} prompt={selectedImage.name} />}

      {/* Image edit modal */}
      {showImageEditModal && imageToEdit && <ImageEditModal 
        isOpen={showImageEditModal} 
        onClose={() => {
          setShowImageEditModal(false);
          setImageToEdit(null);
        }} 
        imageFile={imageToEdit} 
        onSaveImage={async (editedBlob) => {
          try {
            // Edited images are now handled by webhook only
            console.log('Image editing completed - processed by webhook');
            toast.success('Image edited successfully');
          } catch (error) {
            console.error('Error with edited image:', error);
            toast.error('Failed to process edited image');
          }
        }} 
      />}

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        onSuccess={() => {
          // Focus back to textarea after successful login
          setTimeout(() => {
            textareaRef.current?.focus();
          }, 100);
        }} 
      />
    </div>
  );
}