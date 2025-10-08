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
import geminiLogo from '@/assets/gemini-logo.png';
import deepseekLogo from '@/assets/deepseek-logo.png';
import grokLogo from '@/assets/grok-logo.png';

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
  id: 'gpt-5',
  name: 'GPT-5',
  shortLabel: 'GPT-5',
  description: "Most advanced AI model",
  type: 'pro'
}, {
  id: 'claude-sonnet-4',
  name: 'Claude Sonnet 4',
  shortLabel: 'Sonnet 4',
  description: "Great for writing tasks",
  type: 'pro'
}, {
  id: 'gemini-2.5-flash',
  name: 'Gemini 2.5 Flash',
  shortLabel: 'Gemini 2.5',
  description: "Fast Google AI model",
  type: 'pro'
}, {
  id: 'deepseek-v2',
  name: 'DeepSeek V2',
  shortLabel: 'DeepSeek V2',
  description: "Advanced reasoning model",
  type: 'pro'
}, {
  id: 'grok-4',
  name: 'Grok 4',
  shortLabel: 'Grok 4',
  description: "Powerful AI from xAI",
  type: 'pro'
}, {
  id: 'generate-image',
  name: 'Generate Image',
  shortLabel: 'Generate Image',
  description: "Create images with DALL·E 3",
  type: 'pro'
}, {
  id: 'edit-image',
  name: 'Edit Image',
  shortLabel: 'Edit Image',
  description: "Edit images with DALL·E 3",
  type: 'pro'
}];

const availableModels = [{
  id: 'gpt-4o-mini',
  name: 'GPT-4o mini',
  shortLabel: 'GPT-4o mini',
  description: 'Fast and cost-efficient model, perfect for most tasks.',
  icon: 'openai'
}, {
  id: 'gpt-4o',
  name: 'GPT-4o',
  shortLabel: 'GPT-4o',
  description: 'High-quality model for complex reasoning and accurate responses.',
  icon: 'openai'
}, {
  id: 'gpt-5',
  name: 'GPT-5',
  shortLabel: 'GPT-5',
  description: 'Most advanced OpenAI model with superior capabilities and reasoning.',
  icon: 'openai'
}, {
  id: 'claude-sonnet-4',
  name: 'Claude Sonnet 4',
  shortLabel: 'Sonnet 4',
  description: 'Great for writing tasks',
  icon: 'claude'
}, {
  id: 'gemini-2.5-flash',
  name: 'Gemini 2.5 Flash',
  shortLabel: 'Gemini 2.5',
  description: 'Fast Google AI model with multimodal capabilities.',
  icon: 'gemini',
  type: 'pro'
}, {
  id: 'deepseek-v2',
  name: 'DeepSeek V2',
  shortLabel: 'DeepSeek V2',
  description: 'Advanced reasoning model with strong performance.',
  icon: 'deepseek'
}, {
  id: 'grok-4',
  name: 'Grok 4',
  shortLabel: 'Grok 4',
  description: 'Powerful AI model from xAI with advanced capabilities.',
  icon: 'grok'
}, {
  id: 'generate-image',
  name: 'Generate Image',
  shortLabel: 'Generate Image',
  description: 'Create stunning images and artwork using DALL·E 3.',
  icon: 'openai'
}, {
  id: 'edit-image',
  name: 'Edit Image (DALL·E 3)',
  shortLabel: 'Edit Image',
  description: 'Edit and modify existing images using DALL·E 3.',
  icon: 'openai'
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
  
  // Helper function to get model icon
  const getModelIcon = (iconType: string) => {
    switch (iconType) {
      case 'openai':
        return chatgptLogoSrc;
      case 'claude':
        return claudeLogo;
      case 'gemini':
        return geminiLogo;
      case 'deepseek':
        return deepseekLogo;
      case 'grok':
        return grokLogo;
      default:
        return chatgptLogoSrc;
    }
  };
  
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
  const isRegeneratingRef = useRef(false); // Immediate lock to prevent duplicate regenerate calls
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioLevels, setAudioLevels] = useState<number[]>(Array(100).fill(0));
  const [tempTranscript, setTempTranscript] = useState('');
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
  const [regeneratingMessageId, setRegeneratingMessageId] = useState<string | null>(null);
  const regeneratingMessageIdRef = useRef<string | null>(null); // Ref to track current regenerating message ID
  const [hiddenMessageIds, setHiddenMessageIds] = useState<Set<string>>(new Set());
  const [selectedModel, setSelectedModel] = useState(() => {
    // Use model from navigation state if available, otherwise default to gpt-4o-mini
    return location.state?.selectedModel || 'gpt-4o-mini';
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const regenerateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const oldMessageBackupRef = useRef<{messageId: string, content: string, fileAttachments: FileAttachment[]} | null>(null);
  // Track processed messages per chat to prevent cross-chat bleeding
  const processedUserMessages = useRef<Map<string, Set<string>>>(new Map());
  const imageGenerationChats = useRef<Set<string>>(new Set());
  // Track if user manually selected a model (don't override from DB)
  const userSelectedModelRef = useRef<string | null>(null);
  // Track if a send is in progress to prevent duplicates
  const sendingInProgressRef = useRef(false);
  const selectedModelData = models.find(m => m.id === selectedModel);
  useEffect(() => {
    if (chatId && user) {
      // Initialize processed messages Set for this chat if it doesn't exist
      if (!processedUserMessages.current.has(chatId)) {
        processedUserMessages.current.set(chatId, new Set());
      }

      // CRITICAL: Clear messages state immediately when switching chats to prevent cross-chat bleeding
      setMessages([]);
      
      // CRITICAL: Clear user model selection when switching chats
      // This allows each chat to load its own model from DB
      userSelectedModelRef.current = null;
      console.log('[CHAT-SWITCH] Cleared user model selection for new chat');

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
      
      // Only fetch messages if we're NOT about to auto-send
      // Auto-send will show temp message and handle everything via realtime
      if (!shouldAutoSend.current) {
        console.log('[CHAT-INIT] Fetching messages normally');
        fetchMessages();
      } else {
        console.log('[CHAT-INIT] Skipping fetchMessages - auto-send will handle it');
      }

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

      // Set up real-time subscription for new messages with proper channel configuration
      const channel = supabase.channel(`messages-${chatId}`, {
        config: {
          broadcast: { self: true },
          presence: { key: chatId }
        }
      });

      channel
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`
        }, payload => {
          console.log('[REALTIME-INSERT] ===== NEW MESSAGE EVENT =====');
          console.log('[REALTIME-INSERT] Raw payload:', JSON.stringify(payload, null, 2));
          const newMessage = payload.new as Message;

          console.log('[REALTIME-INSERT] Message details:', {
            id: newMessage.id,
            role: newMessage.role,
            chat_id: newMessage.chat_id,
            currentChatId: chatId,
            content_length: newMessage.content?.length || 0,
            content_preview: newMessage.content?.substring(0, 100),
            hasFileAttachments: !!newMessage.file_attachments
          });

          // CRITICAL: Double-check message belongs to current chat to prevent leakage
          if (newMessage.chat_id !== chatId) {
            console.log('[REALTIME-INSERT] ❌ REJECTED - wrong chat_id');
            console.log('[REALTIME-INSERT] Expected:', chatId);
            console.log('[REALTIME-INSERT] Got:', newMessage.chat_id);
            return;
          }
          
          console.log('[REALTIME-INSERT] ✅ Message belongs to current chat');
          console.log('[REALTIME-INSERT] Message accepted:', {
            id: newMessage.id,
            role: newMessage.role,
            content: newMessage.content?.substring(0, 50),
            hasFileAttachments: !!newMessage.file_attachments,
            fileAttachmentsCount: newMessage.file_attachments?.length || 0,
            fileAttachments: newMessage.file_attachments
          });
          
          // If this is a new assistant message, clear ALL loading states immediately
          if (newMessage.role === 'assistant') {
            console.log('[REALTIME-INSERT] 🤖 Assistant message - clearing loading states');
            
            setLoading(false);
            setIsGeneratingResponse(false);
            
            // If we're regenerating, clear regeneration states AND remove the old hidden message
            // Use the ref to get the current regenerating message ID
            const currentRegeneratingId = regeneratingMessageIdRef.current;
            if (currentRegeneratingId) {
              console.log('[REALTIME-INSERT] Clearing regeneration states and removing old message:', currentRegeneratingId);
              
              // Clear the timeout
              if (regenerateTimeoutRef.current) {
                clearTimeout(regenerateTimeoutRef.current);
                regenerateTimeoutRef.current = null;
              }
              
              // Remove the old hidden message from state (it was deleted from DB but kept for animation)
              setMessages(prev => {
                const filtered = prev.filter(msg => msg.id !== currentRegeneratingId);
                console.log('[REALTIME-INSERT] Removed old message, remaining count:', filtered.length);
                return filtered;
              });
              
              // Clear regeneration states
              setRegeneratingMessageId(null);
              regeneratingMessageIdRef.current = null; // Clear the ref too
              isRegeneratingRef.current = false;
              setHiddenMessageIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(currentRegeneratingId);
                return newSet;
              });
              oldMessageBackupRef.current = null;
            }
          }
          
          // Add message to state immediately with forced re-render
          setMessages(prev => {
            console.log('[REALTIME-INSERT] 📝 Adding to state...');
            console.log('[REALTIME-INSERT] Current state has', prev.length, 'messages');
            console.log('[REALTIME-INSERT] Current messages:', prev.map(m => ({
              id: m.id.substring(0, 10),
              role: m.role,
              chat_id: m.chat_id
            })));
            
            // Check if message already exists to prevent duplicates
            const existsById = prev.find(msg => msg.id === newMessage.id);
            if (existsById) {
              console.log('[REALTIME-INSERT] ⚠️ Duplicate by ID - skipping');
              return prev;
            }
            
            // For user messages, check if there's a temp message to replace
            if (newMessage.role === 'user') {
              const tempMessageIndex = prev.findIndex(msg => 
                msg.id.startsWith('temp-') && 
                msg.role === 'user' &&
                msg.content === newMessage.content &&
                msg.chat_id === newMessage.chat_id
              );
              
              if (tempMessageIndex !== -1) {
                console.log('[REALTIME-INSERT] 🔄 Replacing temp message at index', tempMessageIndex);
                const updated = [...prev];
                updated[tempMessageIndex] = newMessage;
                return updated;
              }
            }
            
            const existsByContent = prev.find(msg => 
              msg.content === newMessage.content && 
              msg.role === newMessage.role && 
              Math.abs(new Date(msg.created_at).getTime() - new Date(newMessage.created_at).getTime()) < 5000
            );
            
            if (existsByContent) {
              console.log('[REALTIME-INSERT] ⚠️ Duplicate by content - skipping');
              return prev;
            }
            
            console.log('[REALTIME-INSERT] 🆕 Message is NEW - adding to state');
            
            // CRITICAL: Filter out any messages not belonging to current chat before adding new message
            const filteredPrev = prev.filter(msg => !msg.chat_id || msg.chat_id === chatId);
            console.log('[REALTIME-INSERT] After filtering by chat_id:', filteredPrev.length, 'messages');
            
            // Create new array with new message and sort by created_at to ensure proper ordering
            const newMessages = [...filteredPrev, newMessage].sort((a, b) => 
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
            console.log('[REALTIME-INSERT] ✅ Final message count:', newMessages.length);
            console.log('[REALTIME-INSERT] Final messages:', newMessages.map(m => ({
              id: m.id.substring(0, 10),
              role: m.role,
              preview: m.content?.substring(0, 30)
            })));
            
            // Force immediate scroll
            requestAnimationFrame(() => {
              scrollToBottom();
            });
            
            // Return new array to trigger re-render
            return newMessages;
          });
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`
        }, payload => {
          console.log('[REALTIME-UPDATE] Message updated:', payload.new);
          const updatedMessage = payload.new as Message;

          // CRITICAL: Double-check message belongs to current chat
          if (updatedMessage.chat_id !== chatId) {
            console.log('[REALTIME-UPDATE] Message rejected - wrong chat_id');
            return;
          }

          setMessages(prev => {
            const updated = prev.map(msg => 
              msg.id === updatedMessage.id 
                ? { 
                    ...msg, 
                    content: updatedMessage.content,
                    file_attachments: updatedMessage.file_attachments as any || []
                  }
                : msg
            );
            setTimeout(() => scrollToBottom(), 50);
            return updated;
          });
        })
        .on('postgres_changes', {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`
        }, payload => {
          console.log('[REALTIME-DELETE] Message deleted:', payload.old);
          const deletedMessage = payload.old as Message;

          // CRITICAL: Double-check message belongs to current chat
          if (deletedMessage.chat_id !== chatId) {
            console.log('[REALTIME-DELETE] Message rejected - wrong chat_id');
            return;
          }

          // Check if this message is being regenerated - if so, keep it visible with animation
          // Use the ref to get the current regenerating message ID
          const currentRegeneratingId = regeneratingMessageIdRef.current;
          if (currentRegeneratingId === deletedMessage.id) {
            console.log('[REALTIME-DELETE] Message is being regenerated, keeping in state with animation');
            return;
          }

          // Remove the deleted message from local state
          setMessages(prev => {
            console.log('[REALTIME-DELETE] Removing message from state:', deletedMessage.id);
            const filtered = prev.filter(msg => msg.id !== deletedMessage.id);
            console.log('[REALTIME-DELETE] Messages count after deletion:', filtered.length);
            return filtered;
          });
        })
        .subscribe(status => {
          console.log('[REALTIME-SUBSCRIPTION] Status:', status);
          if (status === 'SUBSCRIBED') {
            console.log('[REALTIME-SUBSCRIPTION] Successfully subscribed to messages for chat:', chatId);
          } else if (status === 'CHANNEL_ERROR') {
            console.error('[REALTIME-SUBSCRIPTION] Channel error for chat:', chatId);
          } else if (status === 'TIMED_OUT') {
            console.error('[REALTIME-SUBSCRIPTION] Subscription timed out for chat:', chatId);
          }
        });

      // SINGLE cleanup function that handles both event listener AND channel
      return () => {
        console.log('[REALTIME-CLEANUP] Unsubscribing from chat:', chatId);
        window.removeEventListener('image-generation-chat', handleImageGenerationChat as EventListener);
        channel.unsubscribe();
        supabase.removeChannel(channel);
      };
    }
  }, [chatId, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Add visibility change detection to prevent duplicate sends when switching tabs
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('[TAB-VISIBILITY] Tab hidden - user switched away');
      } else {
        console.log('[TAB-VISIBILITY] Tab visible - user returned');
        // Clear any stale locks when returning to tab
        const sendLockKey = `sending_${chatId}`;
        const lockTime = sessionStorage.getItem(`${sendLockKey}_time`);
        if (lockTime) {
          const elapsed = Date.now() - parseInt(lockTime);
          if (elapsed > 15000) { // Clear if older than 15 seconds
            console.log('[TAB-VISIBILITY] Clearing stale send lock');
            sessionStorage.removeItem(sendLockKey);
            sessionStorage.removeItem(`${sendLockKey}_time`);
            sendingInProgressRef.current = false;
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [chatId]);

  // Timer for recording duration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      setRecordingDuration(0);
      interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  // Auto-trigger AI response for user messages that don't have responses
  useEffect(() => {
    // Also check the ref for immediate synchronous state
    if (messages.length > 0 && !loading && !isGeneratingResponse && !isRegeneratingRef.current && chatId) {
      // CRITICAL: Filter messages to only include those belonging to current chat
      const currentChatMessages = messages.filter(msg => msg.chat_id === chatId);
      if (currentChatMessages.length === 0) {
        return;
      }
      const lastMessage = currentChatMessages[currentChatMessages.length - 1];

      // Get processed messages Set for this specific chat (with sessionStorage persistence)
      const storageKey = `processed_messages_${chatId}`;
      const storedProcessed = sessionStorage.getItem(storageKey);
      const chatProcessedMessages = processedUserMessages.current.get(chatId) || new Set(
        storedProcessed ? JSON.parse(storedProcessed) : []
      );

      // CRITICAL: Only trigger for text-only messages WITHOUT file attachments
      // Messages with file attachments are handled by the webhook, so we should NOT trigger here
      if (lastMessage.role === 'user' && (!lastMessage.file_attachments || lastMessage.file_attachments.length === 0)) {
        // CRITICAL: Verify message belongs to current chat
        if (lastMessage.chat_id && lastMessage.chat_id !== chatId) {
          return;
        }

        // Check if there's already an assistant response after this user message
        const hasAssistantResponseAfter = currentChatMessages.some(msg => 
          msg.role === 'assistant' && 
          new Date(msg.created_at) > new Date(lastMessage.created_at)
        );

        // Only trigger if no assistant response exists, we haven't processed this message yet,
        // and this isn't from an image generation modal
        if (!hasAssistantResponseAfter && !chatProcessedMessages.has(lastMessage.id) && !imageGenerationChats.current.has(chatId)) {
          console.log('[AUTO-TRIGGER] Processing message:', lastMessage.id, 'Model:', selectedModel);
          
          // CRITICAL: Mark as processed IMMEDIATELY in both ref and sessionStorage
          if (!processedUserMessages.current.has(chatId)) {
            processedUserMessages.current.set(chatId, new Set());
          }
          processedUserMessages.current.get(chatId)!.add(lastMessage.id);
          
          // Persist to sessionStorage
          const processedArray = Array.from(processedUserMessages.current.get(chatId)!);
          sessionStorage.setItem(storageKey, JSON.stringify(processedArray));

          // Trigger AI response with current selected model
          triggerAIResponse(lastMessage.content, lastMessage.id);
        }
      }
    }
  }, [messages, loading, isGeneratingResponse, chatId, selectedModel]);

  // Handle initial files and message from navigation (from home page)
  const hasProcessedInitialData = useRef(false);
  const shouldAutoSend = useRef(false);
  const autoSendTempMessage = useRef<Message | null>(null); // Store the entire temp message, not just ID
  
  // Check IMMEDIATELY if we should auto-send (before chat init effect runs)
  const initialFiles = location.state?.initialFiles;
  const initialMessage = location.state?.initialMessage;
  if ((initialMessage || (initialFiles && initialFiles?.length > 0)) && chatId && !hasProcessedInitialData.current) {
    shouldAutoSend.current = true;
    console.log('[CHAT-INITIAL] Set shouldAutoSend to true BEFORE chat init');
  }
  
  useEffect(() => {
    const initialFiles = location.state?.initialFiles;
    const initialMessage = location.state?.initialMessage;
    
    console.log('[CHAT-INITIAL] Checking for initial data:', {
      chatId,
      hasInitialMessage: !!initialMessage,
      hasInitialFiles: !!initialFiles,
      filesCount: initialFiles?.length || 0,
      hasProcessed: hasProcessedInitialData.current
    });
    
    // Handle message with or without files
    if ((initialMessage || (initialFiles && initialFiles.length > 0)) && chatId && !hasProcessedInitialData.current) {
      console.log('[CHAT-INITIAL] Processing from home page:', { initialFiles, initialMessage: initialMessage?.substring(0, 50) });
      hasProcessedInitialData.current = true;
      shouldAutoSend.current = true;
      
      // Set the message and files
      setInput(initialMessage || '');
      setSelectedFiles(initialFiles || []);
      
      console.log('[CHAT-INITIAL] Set input and files, will auto-send');
      
      // Clear the navigation state to prevent re-triggering
      window.history.replaceState({}, document.title);
    }
  }, [chatId, location.state]);

  // Auto-send when data is ready after being set from navigation
  useEffect(() => {
    if (shouldAutoSend.current && (input || selectedFiles.length > 0) && !loading && chatId) {
      console.log('[CHAT-INITIAL] Auto-sending message:', {
        hasInput: !!input,
        filesCount: selectedFiles.length,
        chatId,
        files: selectedFiles.map(f => ({ name: f.name, type: f.type, size: f.size }))
      });
      
      // Create temp ID
      const tempId = `temp-init-${Date.now()}`;
      
      // Create and display user message immediately BEFORE sending
      const tempUserMessage: Message = {
        id: tempId,
        chat_id: chatId,
        content: input.trim(),
        role: 'user',
        created_at: new Date().toISOString(),
        file_attachments: selectedFiles.map((file, index) => ({
          id: `temp-file-init-${Date.now()}-${index}`,
          name: file.name,
          size: file.size,
          type: file.type,
          url: URL.createObjectURL(file)
        }))
      };
      
      // Store the entire message in ref so sendMessage can find it
      autoSendTempMessage.current = tempUserMessage;
      console.log('[CHAT-INITIAL] Stored temp message in ref:', tempId);
      
      // Add message to UI immediately so user sees their image
      setMessages(prev => [...prev, tempUserMessage]);
      scrollToBottom();
      
      shouldAutoSend.current = false;
      
      // Delay to ensure message is rendered and real-time subscription is ready
      setTimeout(() => {
        sendMessage();
      }, 500);
    }
  }, [input, selectedFiles, loading, chatId]); // Removed 'messages' to prevent re-runs

  const regenerateResponse = async (messageId: string) => {
    // Immediate synchronous check to prevent race conditions
    if (isRegeneratingRef.current || isGeneratingResponse || loading) {
      console.log('[REGENERATE] Already regenerating, skipping duplicate call');
      return;
    }

    // Set lock immediately
    isRegeneratingRef.current = true;

    // Check if user is authenticated
    if (!user) {
      console.warn('[REGENERATE] User not authenticated');
      isRegeneratingRef.current = false;
      return;
    }

    // Find the assistant message to regenerate
    const assistantMessage = messages.find(msg => msg.id === messageId && msg.role === 'assistant');
    if (!assistantMessage) {
      return;
    }

    // Find the user message that came before this assistant message
    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    let userMessage = '';
    let userMessageAttachments: FileAttachment[] = [];
    let userModel = selectedModel; // Default to current selected model
    
    // Look backwards to find the previous user message
    for (let i = messageIndex - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        userMessage = messages[i].content;
        userMessageAttachments = messages[i].file_attachments || [];
        break;
      }
    }

    // Use the model from the original assistant message if available
    if (assistantMessage.model) {
      userModel = assistantMessage.model;
    }

    // Allow regeneration if there's either a message or file attachments
    if (!userMessage && userMessageAttachments.length === 0) {
      console.log('[REGENERATE] No message or attachments to regenerate');
      return;
    }

    console.log('[REGENERATE] User message:', userMessage || '(empty)');
    console.log('[REGENERATE] Attachments count:', userMessageAttachments.length);

    // Mark the message as regenerating (show animation, keep in database for now)
    console.log('[REGENERATE] Marking message as regenerating:', messageId);
    setRegeneratingMessageId(messageId);
    regeneratingMessageIdRef.current = messageId; // Set the ref for realtime handler
    setHiddenMessageIds(prev => {
      const newSet = new Set(prev);
      newSet.add(messageId);
      return newSet;
    });

    setIsGeneratingResponse(true);

    // Set timeout to handle if no response in 60 seconds
    regenerateTimeoutRef.current = setTimeout(() => {
      console.log('[REGENERATE] Timeout - no response in 60 seconds');
      
      // Clear regeneration states and restore message visibility
      setRegeneratingMessageId(null);
      regeneratingMessageIdRef.current = null; // Clear the ref
      setHiddenMessageIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(messageId);
        return newSet;
      });
      setIsGeneratingResponse(false);
      isRegeneratingRef.current = false;
      oldMessageBackupRef.current = null;
    }, 60000); // 60 seconds

    try {
      console.log('[REGENERATE] Starting regeneration with attachments:', userMessageAttachments);

      // Convert file URLs to base64 for webhook
      const fileAttachmentsForWebhook = await Promise.all(
        userMessageAttachments.map(async (file) => {
          try {
            if (file.type.startsWith('image/')) {
              console.log('[REGENERATE] Converting image to base64:', file.url);
              
              // Fetch the image
              const response = await fetch(file.url);
              if (!response.ok) {
                console.error('[REGENERATE] Failed to fetch image:', response.status);
                return null;
              }
              
              const blob = await response.blob();
              console.log('[REGENERATE] Image fetched, blob size:', blob.size);
              
              // Convert to PNG using canvas
              const img = new Image();
              const imgUrl = URL.createObjectURL(blob);
              
              await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = imgUrl;
              });
              
              console.log('[REGENERATE] Image loaded, dimensions:', img.width, 'x', img.height);

              const canvas = document.createElement('canvas');
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext('2d');
              ctx?.drawImage(img, 0, 0);
              URL.revokeObjectURL(imgUrl);

              // Convert to PNG base64
              const base64 = canvas.toDataURL('image/png').split(',')[1];
              console.log('[REGENERATE] Converted to base64, length:', base64.length);
              
              return {
                fileName: file.name,
                fileSize: file.size,
                fileType: 'image/png',
                fileData: base64,
                isImage: true
              };
            } else {
              // Handle non-image files (PDF, CSV, XML, etc.)
              console.log('[REGENERATE] Processing non-image file:', file.type);
              
              const response = await fetch(file.url);
              if (!response.ok) {
                console.error('[REGENERATE] Failed to fetch file:', response.status);
                return null;
              }
              
              const blob = await response.blob();
              const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                  const result = reader.result as string;
                  resolve(result.split(',')[1]);
                };
                reader.onerror = reject;
                reader.readAsDataURL(blob);
              });
              
              return {
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
                fileData: base64,
                isImage: false
              };
            }
          } catch (error) {
            console.error('[REGENERATE] Error processing file:', error);
            return null;
          }
        })
      );

      // Filter out null values
      const validAttachments = fileAttachmentsForWebhook.filter(f => f !== null);
      console.log('[REGENERATE] Valid attachments after conversion:', validAttachments.length);
      
      if (validAttachments.length > 0) {
        console.log('[REGENERATE] First attachment format check:', {
          hasFileName: 'fileName' in validAttachments[0],
          hasFileData: 'fileData' in validAttachments[0],
          hasUrl: 'url' in validAttachments[0]
        });
      }

      // Determine request type based on model and file type
      let requestType = 'text';
      
      // Check if this was originally an image generation request
      if (userModel === 'generate-image') {
        requestType = 'generate_image';
      } else if (validAttachments.length > 0) {
        // Check if the first attachment is an image
        requestType = validAttachments[0].isImage ? 'analyse-image' : 'analyse-files';
      }
      console.log('[REGENERATE] Request type:', requestType, 'Model:', userModel);

      // Build payload - send first attachment directly in the body
      let payload: any = {
        type: requestType,
        message: userMessage,
        userId: user.id,
        chatId: chatId,
        model: userModel
      };

      if (validAttachments.length > 0) {
        // Send first attachment directly in body
        const firstAttachment = validAttachments[0];
        payload.fileName = firstAttachment.fileName;
        payload.fileSize = firstAttachment.fileSize;
        payload.fileType = firstAttachment.fileType;
        payload.fileData = firstAttachment.fileData;
      }
      
      console.log('[REGENERATE] Sending webhook payload:', JSON.stringify(payload).substring(0, 500) + '...');

      // Call N8n webhook (N8n will call webhook-handler in background to create new message)
      console.log('[REGENERATE] Calling N8n webhook (N8n will call webhook-handler)');
      
      const webhookResponse = await fetch('https://adsgbt.app.n8n.cloud/webhook/adamGPT', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!webhookResponse.ok) {
        throw new Error(`Webhook request failed: ${webhookResponse.status}`);
      }
      
      console.log('[REGENERATE] Webhook called successfully, now deleting old message from database');
      
      // NOW delete the old message from database (webhook succeeded)
      const { error: deleteError } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);
      
      if (deleteError) {
        console.error('[REGENERATE] Error deleting old message:', deleteError);
        // Don't throw - webhook already succeeded, new message will arrive
      } else {
        console.log('[REGENERATE] Successfully deleted old message from database');
      }
      
      // Delete old image from storage if it exists
      if (assistantMessage.file_attachments && assistantMessage.file_attachments.length > 0) {
        for (const attachment of assistantMessage.file_attachments) {
          if (attachment.url && attachment.type.startsWith('image/')) {
            try {
              const urlObj = new URL(attachment.url);
              const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/public\/([^\/]+)\/(.+)/);
              
              if (pathMatch) {
                const bucketName = pathMatch[1];
                const filePath = pathMatch[2];
                
                console.log('[REGENERATE] Deleting old image from storage:', { bucketName, filePath });
                
                const { error: deleteStorageError } = await supabase.storage
                  .from(bucketName)
                  .remove([filePath]);
                  
                if (deleteStorageError) {
                  console.error('[REGENERATE] Error deleting old image from storage:', deleteStorageError);
                } else {
                  console.log('[REGENERATE] Successfully deleted old image from storage');
                }
              }
            } catch (error) {
              console.error('[REGENERATE] Error parsing image URL:', error);
            }
          }
        }
      }
      
      console.log('[REGENERATE] Webhook completed, fetching messages immediately...');
      
      // Immediately fetch messages to show new response without waiting for realtime
      setTimeout(() => {
        fetchMessages();
      }, 200);
      
      scrollToBottom();
      
      // Note: For image generation, we still need special handling
      const aiResponse = await webhookResponse.json();
      if (userModel === 'generate-image' && aiResponse.image_base64) {
        console.log('[REGENERATE] Image generation response received, calling webhook-handler...');
        
        const { data: handlerData, error: handlerError } = await supabase.functions.invoke('webhook-handler', {
          body: {
            chat_id: chatId,
            user_id: user.id,
            image_base64: aiResponse.image_base64,
            image_name: aiResponse.image_name || 'generated_image.png',
            image_type: aiResponse.image_type || 'image/png',
            model: 'generate-image'
          }
        });
        
        if (handlerError) {
          console.error('[REGENERATE] Webhook-handler error:', handlerError);
          throw handlerError;
        }
        
        console.log('[REGENERATE] Webhook-handler saved new message:', handlerData);
        console.log('[REGENERATE] Image generation: waiting for realtime subscription to add new message...');
        scrollToBottom();
        return;
      }
    } catch (error) {
      console.error('[REGENERATE] Error:', error);
      
      // Clear timeout on error
      if (regenerateTimeoutRef.current) {
        clearTimeout(regenerateTimeoutRef.current);
        regenerateTimeoutRef.current = null;
      }
      
      // Clear regeneration states and restore message visibility
      console.log('[REGENERATE] Error occurred, restoring message visibility');
      
      setIsGeneratingResponse(false);
      setRegeneratingMessageId(null);
      regeneratingMessageIdRef.current = null; // Clear the ref
      setHiddenMessageIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(messageId);
        return newSet;
      });
      isRegeneratingRef.current = false; // Release lock
      oldMessageBackupRef.current = null;
    }
  };

  const triggerAIResponse = async (userMessage: string, userMessageId: string) => {
    if (isGeneratingResponse || loading) {
      return;
    }

    // CRITICAL: Capture the original chat ID to prevent responses going to wrong chats
    const originalChatId = chatId;
    if (!originalChatId) {
      return;
    }
    
    // CRITICAL: Check if this message is already being processed using sessionStorage
    const triggerKey = `triggering_${originalChatId}_${userMessageId}`;
    if (sessionStorage.getItem(triggerKey)) {
      console.log('[AI-RESPONSE] Message already being processed, skipping duplicate:', userMessageId);
      return;
    }
    
    // Mark as being processed
    sessionStorage.setItem(triggerKey, 'true');
    
    // Clear the lock after 60 seconds (timeout)
    setTimeout(() => {
      sessionStorage.removeItem(triggerKey);
    }, 60000);
    
    // CRITICAL: Skip triggerAIResponse for image generation models
    // They have dedicated webhook handling in sendMessage to avoid duplicate calls
    if (selectedModel === 'generate-image' || selectedModel === 'edit-image') {
      console.log('[AI-RESPONSE] Skipping triggerAIResponse for image model:', selectedModel);
      sessionStorage.removeItem(triggerKey);
      return;
    }
    
    setIsGeneratingResponse(true);
    
    console.log('[AI-RESPONSE] Starting AI response for message:', userMessageId);
    console.log('[AI-RESPONSE] Using model:', selectedModel);
    
    try {
      // Send webhook for text-based models only
      // Image generation models are handled separately
      console.log('[AI-RESPONSE] Calling webhook with type: text, model:', selectedModel);
      
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
      
      console.log('[AI-RESPONSE] Webhook response status:', webhookResponse.status);
      
      if (!webhookResponse.ok) {
        throw new Error(`Webhook request failed: ${webhookResponse.status}`);
      }
      
      const aiResponse = await webhookResponse.json();
      console.log('[AI-RESPONSE] Received response from webhook:', { 
        hasResponse: !!aiResponse?.response, 
        hasContent: !!aiResponse?.content, 
        hasText: !!aiResponse?.text,
        hasImageUrl: !!aiResponse?.image_url,
        hasImageBase64: !!aiResponse?.image_base64,
        success: aiResponse?.success,
        messageId: aiResponse?.message_id
      });
      
      // If webhook returns success but no content, it means the message was saved by webhook-handler
      // Start polling to ensure we get the response even if realtime doesn't fire
      if (aiResponse?.success && !aiResponse?.response && !aiResponse?.content && !aiResponse?.text) {
        console.log('[AI-RESPONSE] Webhook saved message to DB, starting polling...');
        
        // Polling mechanism as fallback for when real-time doesn't fire
        let pollAttempts = 0;
        const maxPollAttempts = 20; // Poll for up to 40 seconds
        const pollInterval = 2000; // Poll every 2 seconds
        
        const pollForNewMessages = async () => {
          if (pollAttempts >= maxPollAttempts) {
            console.log('[AI-RESPONSE-POLLING] Max attempts reached');
            setIsGeneratingResponse(false);
            return;
          }
          
          pollAttempts++;
          console.log(`[AI-RESPONSE-POLLING] Attempt ${pollAttempts}/${maxPollAttempts}`);
          
          try {
            const { data: latestMessages, error: fetchError } = await supabase
              .from('messages')
              .select('*')
              .eq('chat_id', originalChatId)
              .order('created_at', { ascending: false })
              .limit(5);
            
            if (fetchError) {
              console.error('[AI-RESPONSE-POLLING] Error fetching messages:', fetchError);
              setTimeout(pollForNewMessages, pollInterval);
              return;
            }
            
            // Check if there's a new assistant message after the user message
            // CRITICAL: Fetch the actual user message from the database to get its timestamp
            // Don't rely on state or Date.now() which can cause timing issues
            const { data: userMessageData } = await supabase
              .from('messages')
              .select('created_at')
              .eq('id', userMessageId)
              .single();
            
            const userMessageTime = userMessageData 
              ? new Date(userMessageData.created_at).getTime() 
              : new Date(latestMessages[0]?.created_at || 0).getTime() - 1000;
            
            console.log('[AI-RESPONSE-POLLING] Comparing timestamps:', {
              userMessageId,
              userMessageTime: new Date(userMessageTime).toISOString(),
              latestMessagesCount: latestMessages?.length || 0,
              latestMessages: latestMessages?.map(m => ({
                id: m.id,
                role: m.role,
                created_at: m.created_at,
                isAfterUser: new Date(m.created_at).getTime() > userMessageTime
              }))
            });
            
            const newAssistantMessage = latestMessages?.find(
              msg => msg.role === 'assistant' && 
                     msg.id !== userMessageId &&
                     new Date(msg.created_at).getTime() > userMessageTime
            );
            
            if (newAssistantMessage) {
              console.log('[AI-RESPONSE-POLLING] ✅ Found matching assistant message:', newAssistantMessage.id);
            } else {
              console.log('[AI-RESPONSE-POLLING] ❌ No matching assistant message found');
            }
            
            if (newAssistantMessage) {
              console.log('[AI-RESPONSE-POLLING] ✅ Found new assistant message!', newAssistantMessage.id);
              
              // Check if already in state
              setMessages(prev => {
                const exists = prev.some(m => m.id === newAssistantMessage.id);
                if (exists) {
                  console.log('[AI-RESPONSE-POLLING] Message already in state');
                  return prev;
                }
                
                console.log('[AI-RESPONSE-POLLING] Adding message to state');
                const messageToAdd: Message = {
                  id: newAssistantMessage.id,
                  chat_id: newAssistantMessage.chat_id,
                  content: newAssistantMessage.content,
                  role: newAssistantMessage.role as 'assistant' | 'user',
                  created_at: newAssistantMessage.created_at,
                  file_attachments: (newAssistantMessage.file_attachments as any) || []
                };
                
                const newMessages = [...prev, messageToAdd].sort((a, b) => 
                  new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                );
                
                setIsGeneratingResponse(false);
                requestAnimationFrame(() => scrollToBottom());
                
                return newMessages;
              });
              
              // Stop polling
              return;
            }
            
            console.log('[AI-RESPONSE-POLLING] No new assistant message yet, retrying...');
            setTimeout(pollForNewMessages, pollInterval);
          } catch (pollError) {
            console.error('[AI-RESPONSE-POLLING] Error during polling:', pollError);
            setTimeout(pollForNewMessages, pollInterval);
          }
        };
        
        // Start polling after a short delay
        setTimeout(pollForNewMessages, 2000);
        return;
      }
      
      // Handle image_base64 by uploading to storage first
      if (aiResponse?.image_base64) {
        console.log('[AI-RESPONSE] Image base64 detected, calling webhook-handler to upload...');
        try {
          const { data: handlerData, error: handlerError } = await supabase.functions.invoke('webhook-handler', {
            body: {
              chat_id: originalChatId,
              user_id: user.id,
              image_base64: aiResponse.image_base64,
              image_name: aiResponse.image_name || `generated_${Date.now()}.png`,
              image_type: aiResponse.image_type || 'image/png'
            }
          });
          
          if (handlerError) {
            console.error('[AI-RESPONSE] Webhook-handler error:', handlerError);
          } else {
            console.log('[AI-RESPONSE] Image uploaded successfully via webhook-handler');
          }
        } catch (err) {
          console.error('[AI-RESPONSE] Failed to upload image:', err);
        }
        // The webhook-handler will insert the message with the image, so we can return early
        return;
      }
      
      if (aiResponse?.response || aiResponse?.content || aiResponse?.text) {
        const responseContent = aiResponse.response || aiResponse.content || aiResponse.text;

        // Handle image URL responses (legacy/direct URL format)
        let fileAttachments: FileAttachment[] = [];
        if (aiResponse.image_url) {
          console.log('[AI-RESPONSE] Image URL received from webhook:', aiResponse.image_url);
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
          content: aiResponse.image_url ? '' : responseContent, // Don't show text for image generation
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
        const {
          data: insertedAiMessage,
          error: saveError
        } = await supabase.from('messages').insert({
          chat_id: originalChatId,
          content: responseContent,
          role: 'assistant',
          file_attachments: fileAttachments as any
        }).select().single();
        
        // Update chat's updated_at timestamp to move it to top of sidebar
        await supabase
          .from('chats')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', originalChatId);
        
        if (saveError) {
          // Check for authentication errors
          if (saveError.message?.includes('JWT') || saveError.message?.includes('unauthorized')) {
            if (chatId === originalChatId) {
              setShowAuthModal(true);
            }
            return;
          }
        } else {
          // Update the message with the real database ID
          if (insertedAiMessage && chatId === originalChatId) {
            setMessages(prev => prev.map(msg => 
              msg.id === assistantMessage.id ? { ...msg, id: insertedAiMessage.id } : msg
            ));
          }
        }
      }
    } catch (error) {

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
      // Clear the trigger lock
      const triggerKey = `triggering_${originalChatId}_${userMessageId}`;
      sessionStorage.removeItem(triggerKey);
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
    
    // First, fetch the chat to get the model_id
    const { data: chatData, error: chatError } = await supabase
      .from('chats')
      .select('model_id')
      .eq('id', chatId)
      .maybeSingle();
    
    // CRITICAL: Only set model from DB if user hasn't manually selected one
    // This prevents the dropdown from resetting when switching tabs
    if (!chatError && chatData?.model_id && !userSelectedModelRef.current) {
      console.log('[FETCH-MESSAGES] Setting model from DB:', chatData.model_id);
      setSelectedModel(chatData.model_id);
    } else if (userSelectedModelRef.current) {
      console.log('[FETCH-MESSAGES] Preserving user-selected model:', userSelectedModelRef.current);
    }
    
    // Then fetch messages
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
  
  // Handle model selection - track user's manual selection to prevent DB override
  const handleModelChange = (modelId: string) => {
    console.log('[MODEL-CHANGE] User manually selected model:', modelId);
    setSelectedModel(modelId);
    userSelectedModelRef.current = modelId;
    
    // Update the chat's model in the database
    if (chatId) {
      supabase
        .from('chats')
        .update({ model_id: modelId })
        .eq('id', chatId)
        .then(({ error }) => {
          if (error) {
            console.error('[MODEL-CHANGE] Error updating chat model:', error);
          } else {
            console.log('[MODEL-CHANGE] Chat model updated in DB');
          }
        });
    }
  };
  
  const sendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // CRITICAL: Check if send is already in progress
    const sendLockKey = `sending_${chatId}`;
    if (sendingInProgressRef.current || sessionStorage.getItem(sendLockKey)) {
      console.log('[SEND] Already sending, preventing duplicate');
      return;
    }
    
    // Allow sending if there's text OR files
    if ((!input.trim() && selectedFiles.length === 0) || !chatId || loading) {
      console.log('[SEND] Validation failed:', {
        hasInput: !!input.trim(),
        hasFiles: selectedFiles.length > 0,
        chatId,
        loading
      });
      return;
    }

    // Check if user is authenticated, show auth modal if not
    if (!user) {
      // Show auth modal but preserve the input and files
      setShowAuthModal(true);
      return;
    }
    
    // CRITICAL: Set lock to prevent duplicate sends
    sendingInProgressRef.current = true;
    sessionStorage.setItem(sendLockKey, 'true');
    sessionStorage.setItem(`${sendLockKey}_time`, Date.now().toString());
    console.log('[SEND] Lock acquired');
    
    // Clear lock after 10 seconds (safety timeout)
    setTimeout(() => {
      sendingInProgressRef.current = false;
      sessionStorage.removeItem(sendLockKey);
      sessionStorage.removeItem(`${sendLockKey}_time`);
      console.log('[SEND] Lock released (timeout)');
    }, 10000);
    
    const userMessage = input.trim();
    const files = [...selectedFiles];
    
    console.log('[SEND] Proceeding with send:', {
      hasInput: !!userMessage,
      filesCount: files.length,
      hasAutoSendMessage: !!autoSendTempMessage.current
    });
    
    // Check if we're using the auto-send temp message
    let tempUserMessage: Message;
    
    if (autoSendTempMessage.current) {
      // Use the temp message created by auto-send
      console.log('[SEND] Using auto-send temp message:', autoSendTempMessage.current.id);
      tempUserMessage = autoSendTempMessage.current;
      
      // Clear the auto-send ref
      autoSendTempMessage.current = null;
    } else {
      // Normal send - create new temp message
      console.log('[SEND] Creating new temp message for manual send');
      tempUserMessage = {
        id: `temp-${Date.now()}`,
        chat_id: chatId!,
        content: userMessage,
        role: 'user',
        created_at: new Date().toISOString(),
        file_attachments: files.map((file, index) => ({
          id: `temp-file-${Date.now()}-${index}`,
          name: file.name,
          size: file.size,
          type: file.type,
          url: URL.createObjectURL(file)
        }))
      };
      setMessages(prev => [...prev, tempUserMessage]);
      scrollToBottom();
    }
    
    // Clear input and files immediately
    setInput('');
    setSelectedFiles([]);
    setLoading(true);
    
    // Reset image mode and selected style after sending message
    if (isImageMode) {
      setIsImageMode(false);
      setSelectedStyle(null);
    }

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    
    // Handle image generation mode via N8n webhook
    if (selectedModel === 'generate-image') {
      console.log('[IMAGE-GEN] Sending image generation request to webhook');
      
      try {
        // First, ensure the chat exists
        console.log('[IMAGE-GEN] Checking if chat exists:', chatId);
        const { data: existingChat, error: chatCheckError } = await supabase
          .from('chats')
          .select('id, user_id')
          .eq('id', chatId)
          .maybeSingle();
        
        if (chatCheckError) {
          console.error('[IMAGE-GEN] Error checking chat:', chatCheckError);
          throw chatCheckError;
        }
        
        // If chat doesn't exist, create it
        if (!existingChat) {
          console.log('[IMAGE-GEN] Chat does not exist, creating it...');
          const { data: newChat, error: createError } = await supabase
            .from('chats')
            .insert({
              id: chatId, // Use the chatId from URL
              user_id: user.id,
              title: userMessage.slice(0, 50) || 'New Chat'
            })
            .select()
            .single();
            
          if (createError) {
            console.error('[IMAGE-GEN] Error creating chat:', createError);
            throw createError;
          }
          console.log('[IMAGE-GEN] Chat created successfully:', newChat);
        } else {
          console.log('[IMAGE-GEN] Chat exists, proceeding...');
        }
        
        // Save user message to database
        const { data: insertedMessage, error: userError } = await supabase
          .from('messages')
          .insert({
            chat_id: chatId,
            content: userMessage,
            role: 'user',
            file_attachments: []
          })
          .select()
          .single();
          
        if (userError) throw userError;
        
        // CRITICAL: Mark this message as processed to prevent auto-trigger from handling it
        if (insertedMessage && chatId) {
          if (!processedUserMessages.current.has(chatId)) {
            processedUserMessages.current.set(chatId, new Set());
          }
          processedUserMessages.current.get(chatId)!.add(insertedMessage.id);
          
          // Persist to sessionStorage
          const storageKey = `processed_messages_${chatId}`;
          const processedArray = Array.from(processedUserMessages.current.get(chatId)!);
          sessionStorage.setItem(storageKey, JSON.stringify(processedArray));
          
          console.log('[IMAGE-GEN] Marked message as processed:', insertedMessage.id);
        }
        
        // Realtime subscription will handle updating temp message to real message
        
        // Send to N8n webhook for image generation
        console.log('[IMAGE-GEN] Calling N8n webhook with prompt:', userMessage);
        const webhookResponse = await fetch('https://adsgbt.app.n8n.cloud/webhook/adamGPT', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: 'generate_image',
            message: userMessage,
            userId: user.id,
            chatId: chatId,
            model: 'generate-image'
          })
        });
        
        console.log('[IMAGE-GEN] Webhook response status:', webhookResponse.status);
        console.log('[IMAGE-GEN] Webhook response ok:', webhookResponse.ok);
        
        if (!webhookResponse.ok) {
          const errorText = await webhookResponse.text();
          console.error('[IMAGE-GEN] Webhook error response:', errorText);
          throw new Error(`Webhook request failed: ${webhookResponse.status}`);
        }
        
        const webhookData = await webhookResponse.json();
        console.log('[IMAGE-GEN] Webhook response data:', webhookData);
        
        // Call webhook-handler to save the image
        if (webhookData && webhookData.image_base64) {
          console.log('[IMAGE-GEN] Calling webhook-handler to save image...');
          
          const { data: handlerData, error: handlerError } = await supabase.functions.invoke('webhook-handler', {
            body: {
              chat_id: chatId,
              user_id: user.id,
              image_base64: webhookData.image_base64,
              image_name: webhookData.image_name || 'generated_image.png',
              image_type: webhookData.image_type || 'image/png',
              model: 'generate-image' // Pass the model to webhook-handler
            }
          });
          
          if (handlerError) {
            console.error('[IMAGE-GEN] Webhook-handler error:', handlerError);
            throw handlerError;
          }
          
          console.log('[IMAGE-GEN] Webhook-handler response:', handlerData);
        }
        
      } catch (error: any) {
        console.error('[IMAGE-GEN] Error:', error);
        toast.error(error.message || 'Failed to generate image');
      } finally {
        setLoading(false);
      }
      return;
    }
    
    // CRITICAL: Mark message as processed to prevent auto-trigger useEffect from firing
    if (!processedUserMessages.current.has(chatId)) {
      processedUserMessages.current.set(chatId, new Set());
    }
    processedUserMessages.current.get(chatId)!.add(tempUserMessage.id);
    
    try {
      let aiAnalysisResponse = '';
      const tempFileAttachments: FileAttachment[] = [];

      // Process files first to get URLs
      if (files.length > 0) {
        console.log('Sending files to webhook for analysis...');
        for (const file of files) {
          // Check file size limits
          const maxSize = getMaxFileSize(file.type);
          if (file.size > maxSize) {
            console.error(`File ${file.name} exceeds size limit`);
            continue;
          }

          // For images, convert to PNG and upload to storage
          let finalFileUrl = '';
          let finalFileType = file.type;
          let finalFileName = file.name;
          let pngBase64 = '';

          if (file.type.startsWith('image/')) {
            try {
              console.log('[IMAGE-UPLOAD] Converting image to PNG format...');
              
              // Convert image to PNG using canvas
              const img = new Image();
              const imgUrl = URL.createObjectURL(file);
              
              await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = imgUrl;
              });

              const canvas = document.createElement('canvas');
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext('2d');
              ctx?.drawImage(img, 0, 0);
              URL.revokeObjectURL(imgUrl);

              // Convert to PNG base64
              pngBase64 = canvas.toDataURL('image/png').split(',')[1];
              
              // Convert base64 to blob for upload
              const pngBlob = await (await fetch(`data:image/png;base64,${pngBase64}`)).blob();
              
              // Upload to chat-images bucket
              const timestamp = Date.now();
              const fileExt = 'png';
              finalFileName = `${file.name.replace(/\.[^/.]+$/, '')}.png`;
              const filePath = `${user.id}/${chatId}/${timestamp}_${finalFileName}`;
              
              console.log('[IMAGE-UPLOAD] Uploading to storage:', filePath);
              
              const { data: uploadData, error: uploadError } = await supabase.storage
                .from('chat-images')
                .upload(filePath, pngBlob, {
                  contentType: 'image/png',
                  upsert: false
                });

              if (uploadError) {
                console.error('[IMAGE-UPLOAD] Upload error:', uploadError);
                throw uploadError;
              }

              console.log('[IMAGE-UPLOAD] Upload successful:', uploadData);

              // Get public URL
              const { data: urlData } = supabase.storage
                .from('chat-images')
                .getPublicUrl(filePath);

              finalFileUrl = urlData.publicUrl;
              finalFileType = 'image/png';
              
              console.log('[IMAGE-UPLOAD] Public URL:', finalFileUrl);
            } catch (error) {
              console.error('[IMAGE-UPLOAD] Error converting/uploading image:', error);
              // Fallback to original file
              finalFileUrl = URL.createObjectURL(file);
              pngBase64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve((reader.result as string).split(',')[1]);
                reader.onerror = reject;
                reader.readAsDataURL(file);
              });
            }
          } else {
            // For non-image files, upload to Supabase storage
            try {
              console.log('[FILE-UPLOAD] Uploading non-image file to storage');
              
              const filePath = `${user.id}/${chatId}/${Date.now()}_${finalFileName}`;
              
              const { data: uploadData, error: uploadError } = await supabase.storage
                .from('chat-files') // Use chat-files bucket for non-image files
                .upload(filePath, file, {
                  cacheControl: '3600',
                  upsert: false
                });

              if (uploadError) {
                console.error('[FILE-UPLOAD] Upload error:', uploadError);
                throw uploadError;
              }

              console.log('[FILE-UPLOAD] Upload successful:', uploadData);

              // Get public URL
              const { data: urlData } = supabase.storage
                .from('chat-files')
                .getPublicUrl(filePath);

              finalFileUrl = urlData.publicUrl;
              
              console.log('[FILE-UPLOAD] Public URL:', finalFileUrl);
            } catch (error) {
              console.error('[FILE-UPLOAD] Error uploading file:', error);
              // Fallback to blob URL (will only work in current session)
              finalFileUrl = URL.createObjectURL(file);
            }
          }

          // Create file attachment with storage URL
          tempFileAttachments.push({
            id: `temp-file-${Date.now()}-${Math.random()}`,
            name: finalFileName,
            size: file.size,
            type: finalFileType,
            url: finalFileUrl
          });

          // Convert file to base64 for webhook (PNG for images)
          let base64 = pngBase64;
          if (!file.type.startsWith('image/')) {
            const reader = new FileReader();
            base64 = await new Promise<string>((resolve, reject) => {
              reader.onload = () => {
                const result = reader.result as string;
                resolve(result.split(',')[1]);
              };
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });
          }

        }
      }

      // Update the temporary message with actual uploaded URLs
      setMessages(prev => prev.map(msg => 
        msg.id === tempUserMessage.id 
          ? { ...msg, file_attachments: tempFileAttachments }
          : msg
      ));

      // Start embedding generation in background (for user message content)
      const userEmbeddingPromise = generateEmbeddingAsync(userMessage);

      // CRITICAL: Save user message to database FIRST before calling webhook
      // This ensures proper ordering - user message arrives before AI response
      console.log('[FILE-MESSAGE] Saving user message to database with file attachments');
      const {
        data: insertedMessage,
        error: userError
      } = await supabase.from('messages').insert({
        chat_id: chatId,
        content: userMessage,
        role: 'user',
        file_attachments: tempFileAttachments as any,
        embedding: null // Will be updated by background process
      }).select().single();
      
      // Update chat's updated_at timestamp to move it to top of sidebar
      await supabase
        .from('chats')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', chatId);
      
      if (userError) {
        // Check for authentication errors
        if (userError.message?.includes('JWT') || userError.message?.includes('unauthorized')) {
          setShowAuthModal(true);
          return;
        }
        throw userError;
      }
      
      console.log('[FILE-MESSAGE] User message saved, ID:', insertedMessage?.id);

      // The realtime subscription will automatically replace the temp message with the real one
      // So we don't need to update locally - let realtime handle it to avoid race conditions
      
      // Update with embedding when ready (background)
      if (insertedMessage) {
        userEmbeddingPromise.then(embedding => {
          if (embedding.length > 0) {
            supabase.from('messages').update({
              embedding: embedding as any
            }).eq('id', insertedMessage.id);
          }
        });
      }

      // NOW call webhook for file analysis AFTER user message is saved to database
      // This ensures user message appears before AI response
      if (files.length > 0 && insertedMessage) {
        console.log('[WEBHOOK] User message saved, now calling webhook for analysis');
        
        for (const file of files) {
          const attachment = tempFileAttachments.find(a => a.name === file.name || a.name.includes(file.name.replace(/\.[^/.]+$/, '')));
          if (!attachment) continue;

          // Get base64 data
          let base64 = '';
          if (file.type.startsWith('image/')) {
            // For images, convert to PNG base64
            const img = new Image();
            const imgUrl = URL.createObjectURL(file);
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
              img.src = imgUrl;
            });
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0);
            URL.revokeObjectURL(imgUrl);
            base64 = canvas.toDataURL('image/png').split(',')[1];
          } else {
            // For non-images, read as base64
            const reader = new FileReader();
            base64 = await new Promise<string>((resolve, reject) => {
              reader.onload = () => resolve((reader.result as string).split(',')[1]);
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });
          }

          // For edit-image model, don't send type field
          const webhookType = selectedModel === 'edit-image' 
            ? null 
            : file.type.startsWith('image/') ? 'analyse-image' : 'analyse-files';
          
          try {
            console.log('[WEBHOOK] Sending file to webhook:', attachment.name);
            
            // Build webhook body conditionally based on model
            const webhookBody: any = {
              fileName: attachment.name,
              fileSize: file.size,
              fileType: attachment.type,
              fileData: base64,
              userId: user.id,
              chatId: chatId,
              message: userMessage,
              model: selectedModel
            };
            
            // Only add type field if not edit-image model
            if (webhookType !== null) {
              webhookBody.type = webhookType;
            }
            
            await fetch('https://adsgbt.app.n8n.cloud/webhook/adamGPT', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(webhookBody)
            });
            console.log('[WEBHOOK] File sent successfully, waiting for AI response via realtime');
            
            // Fallback polling mechanism for when real-time doesn't fire
            console.log('[WEBHOOK-POLLING] Starting polling mechanism as fallback');
            let pollAttempts = 0;
            const maxPollAttempts = 20; // Poll for up to 40 seconds (20 * 2s)
            const pollInterval = 2000; // Poll every 2 seconds
            
            const pollForNewMessages = async () => {
              if (pollAttempts >= maxPollAttempts) {
                console.log('[WEBHOOK-POLLING] Max attempts reached, stopping');
                return;
              }
              
              pollAttempts++;
              console.log(`[WEBHOOK-POLLING] Attempt ${pollAttempts}/${maxPollAttempts}`);
              
              try {
                // Fetch the latest messages to check for the assistant response
                const { data: latestMessages, error } = await supabase
                  .from('messages')
                  .select('*')
                  .eq('chat_id', chatId)
                  .order('created_at', { ascending: false })
                  .limit(5);
                
                if (error) {
                  console.error('[WEBHOOK-POLLING] Error fetching messages:', error);
                  setTimeout(pollForNewMessages, pollInterval);
                  return;
                }
                
                // Check if there's a new assistant message that's more recent than the user message
                const newAssistantMessage = latestMessages?.find(
                  msg => msg.role === 'assistant' && 
                         msg.id !== insertedMessage.id &&
                         new Date(msg.created_at) > new Date(insertedMessage.created_at)
                );
                
                if (newAssistantMessage) {
                  console.log('[WEBHOOK-POLLING] ✅ Found new assistant message!', newAssistantMessage.id);
                  console.log('[WEBHOOK-POLLING] Content preview:', newAssistantMessage.content?.substring(0, 100));
                  
                  // Check if this message is already in state
                  setMessages(prev => {
                    const exists = prev.some(m => m.id === newAssistantMessage.id);
                    if (exists) {
                      console.log('[WEBHOOK-POLLING] Message already in state, skipping');
                      return prev;
                    }
                    
                    console.log('[WEBHOOK-POLLING] Adding message to state');
                    const messageToAdd: Message = {
                      id: newAssistantMessage.id,
                      chat_id: newAssistantMessage.chat_id,
                      content: newAssistantMessage.content,
                      role: newAssistantMessage.role as 'assistant' | 'user',
                      created_at: newAssistantMessage.created_at,
                      file_attachments: (newAssistantMessage.file_attachments as any) || []
                    };
                    
                    const newMessages = [...prev, messageToAdd].sort((a, b) => 
                      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                    );
                    
                    // Clear loading states
                    setLoading(false);
                    setIsGeneratingResponse(false);
                    
                    // Scroll to bottom
                    requestAnimationFrame(() => scrollToBottom());
                    
                    return newMessages;
                  });
                  
                  // Stop polling
                  return;
                }
                
                console.log('[WEBHOOK-POLLING] No new assistant message yet, will retry');
                setTimeout(pollForNewMessages, pollInterval);
              } catch (pollError) {
                console.error('[WEBHOOK-POLLING] Error during polling:', pollError);
                setTimeout(pollForNewMessages, pollInterval);
              }
            };
            
            // Start polling after a short delay to let webhook process
            setTimeout(pollForNewMessages, 3000);
          } catch (error) {
            console.error('[WEBHOOK] Error sending file:', error);
          }
        }

        // Mark as processed to prevent auto-trigger
        if (chatId) {
          if (!processedUserMessages.current.has(chatId)) {
            processedUserMessages.current.set(chatId, new Set());
          }
          processedUserMessages.current.get(chatId)!.add(insertedMessage.id);
          
          // Persist to sessionStorage
          const storageKey = `processed_messages_${chatId}`;
          const processedArray = Array.from(processedUserMessages.current.get(chatId)!);
          sessionStorage.setItem(storageKey, JSON.stringify(processedArray));
          
          console.log(`[FILE-MESSAGE] Marked message ${insertedMessage.id} as processed`);
        }
        
        scrollToBottom();
      } else if (userMessage && files.length === 0) {
        // CRITICAL: Save text-only message to database immediately
        console.log('[TEXT-MESSAGE] Saving user message to database (no files)');
        
        const { data: insertedMessage, error: userError } = await supabase
          .from('messages')
          .insert({
            chat_id: chatId,
            content: userMessage,
            role: 'user',
            file_attachments: []
          })
          .select()
          .single();
        
        // Update chat's updated_at timestamp
        await supabase
          .from('chats')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', chatId);
        
        if (userError) {
          console.error('[TEXT-MESSAGE] Error saving message:', userError);
          if (userError.message?.includes('JWT') || userError.message?.includes('unauthorized')) {
            setShowAuthModal(true);
            return;
          }
          throw userError;
        }
        
        console.log('[TEXT-MESSAGE] User message saved, ID:', insertedMessage?.id);
        
        // The realtime subscription will replace the temp message with the real one
        // Now trigger AI response
        if (insertedMessage) {
          console.log('[TEXT-MESSAGE] Triggering AI response for message:', insertedMessage.id);
          
          // CRITICAL: Mark as processed BEFORE triggering to prevent auto-trigger duplicate
          if (!processedUserMessages.current.has(chatId)) {
            processedUserMessages.current.set(chatId, new Set());
          }
          processedUserMessages.current.get(chatId)!.add(insertedMessage.id);
          
          // Persist to sessionStorage
          const storageKey = `processed_messages_${chatId}`;
          const processedArray = Array.from(processedUserMessages.current.get(chatId)!);
          sessionStorage.setItem(storageKey, JSON.stringify(processedArray));
          
          await triggerAIResponse(userMessage, insertedMessage.id);
        }
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
      console.error('Failed to send message');
    } finally {
      // CRITICAL: Always release the send lock
      const sendLockKey = `sending_${chatId}`;
      sendingInProgressRef.current = false;
      sessionStorage.removeItem(sendLockKey);
      sessionStorage.removeItem(`${sendLockKey}_time`);
      console.log('[SEND] Lock released (finally)');
      
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
      console.log(`[FILES] ${newFiles.length} file(s) added (${combinedFiles.length} total)`);
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
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    
    try {
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      
      // Set up audio context and analyzer
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
      // Start speech recognition
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        
        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = 0; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          setTempTranscript(transcript);
        };
        
        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          if (event.error === 'no-speech' || event.error === 'audio-capture') {
            return;
          }
        };
        
        recognition.onend = () => {
          if (recognitionRef.current) {
            setIsRecording(false);
          }
        };
        
        recognitionRef.current = recognition;
        recognition.start();
      }
      
      setIsRecording(true);
      
      // Animate waveform based on audio levels
      const updateWaveform = () => {
        if (!analyserRef.current) return;
        
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Map audio data to 100 bars
        const bars = 100;
        const step = Math.floor(bufferLength / bars);
        const newLevels = [];
        
        for (let i = 0; i < bars; i++) {
          const index = i * step;
          const value = dataArray[index] || 0;
          // Normalize to 0-1 range and apply smoothing
          newLevels.push(value / 255);
        }
        
        setAudioLevels(newLevels);
        animationFrameRef.current = requestAnimationFrame(updateWaveform);
      };
      
      updateWaveform();
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error('Unable to access microphone');
    }
  };
  
  const stopRecording = () => {
    // Stop speech recognition
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    
    // Stop audio analysis
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Clean up audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    // Stop media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    analyserRef.current = null;
    setIsRecording(false);
    setAudioLevels(Array(100).fill(0));
    
    // Now set the input from temporary transcript
    setInput(tempTranscript);
    setTempTranscript('');
    
    // Focus textarea after stopping to show the text
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 150);
  };
  
  const cancelRecording = () => {
    // Stop speech recognition
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    
    // Stop audio analysis
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Clean up audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    // Stop media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    analyserRef.current = null;
    setIsRecording(false);
    setAudioLevels(Array(100).fill(0));
    
    // Discard the transcript without saving
    setTempTranscript('');
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
      </div>
  }
  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      {/* Mobile Header with Sidebar Trigger */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 flex items-center p-3 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
          <SidebarTrigger 
            className="h-9 w-9 hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Open sidebar menu"
          />
          
          {/* Mobile Model Selector triggered by AdamGpt - Absolutely centered */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <Select value={selectedModel} onValueChange={handleModelChange} onOpenChange={setIsModelDropdownOpen}>
              <SelectTrigger 
                className="bg-transparent border-0 hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-primary rounded-lg transition-all duration-200 h-auto p-2 [&>svg]:hidden"
                aria-label="Select AI model"
              >
                <div className="flex items-center justify-center gap-1 whitespace-nowrap">
                  <span className="text-lg font-semibold">{selectedModelData?.shortLabel || 'AdamGpt'}</span>
                  {isModelDropdownOpen ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </SelectTrigger>
              <SelectContent className="z-[100] bg-background/95 backdrop-blur-xl border border-border/80 shadow-2xl rounded-2xl p-2 w-[calc(100vw-2rem)] max-w-[300px]" align="center">
                {models.map(model => {
                  const modelData = availableModels.find(m => m.id === model.id);
                  return (
                     <SelectItem 
                      key={model.id} 
                      value={model.id} 
                      className="rounded-xl px-3 py-3 hover:bg-accent/60 focus-visible:bg-accent/60 transition-all duration-200 cursor-pointer"
                    >
                      <div className="flex items-center w-full gap-3">
                        <div className="relative flex-shrink-0">
                          <div className="w-8 h-8 bg-gradient-to-br from-primary/10 to-primary/20 backdrop-blur-sm rounded-xl flex items-center justify-center p-1.5">
                            <img src={getModelIcon(modelData?.icon || 'openai')} alt={`${model.name} icon`} className="w-5 h-5 object-contain" />
                          </div>
                          {model.type === 'pro' && (
                            <span className="absolute -top-1 -right-1 text-[8px] leading-none bg-gradient-to-r from-blue-500 to-purple-500 text-white px-1 py-0.5 rounded-full font-bold shadow-md">
                              PRO
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm text-foreground truncate">{model.name}</div>
                          <div className="text-xs text-muted-foreground mt-0.5 truncate">{model.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Messages area - takes all available space above input */}
      <div 
        className={`flex-1 overflow-y-auto pb-32 relative ${isMobile ? 'pt-[72px]' : ''}`}
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
            console.log(`[FILES] ${newFiles.length} file(s) added (${combinedFiles.length} total)`);
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
             </div> : <div className="space-y-6" key={`messages-${messages.length}-${messages[messages.length - 1]?.id || 'empty'}`}>
              {messages.map(message => {
                console.log('[CHAT-RENDER] Rendering message:', {
                  id: message.id,
                  role: message.role,
                  contentPreview: message.content?.substring(0, 50),
                  hasFileAttachments: !!message.file_attachments,
                  fileAttachmentsLength: message.file_attachments?.length || 0,
                  fileAttachments: message.file_attachments
                });
                
                return <div key={message.id} className="group mb-4" onMouseEnter={() => setHoveredMessage(message.id)} onMouseLeave={() => setHoveredMessage(null)}>
                  <div className={`flex ${message.role === 'user' ? 'justify-end mr-3' : 'justify-start ml-3'}`}>
                    <div className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'} max-w-[90%] sm:max-w-[80%] md:max-w-[70%] relative`}>
                        <div className={`${message.role === 'user' ? 'text-black dark:text-white bg-[#DEE7F4] dark:bg-[#374151] rounded-2xl' : 'text-black dark:text-white rounded-2xl bg-transparent border-none'} px-3.5 py-2.5 relative break-words whitespace-pre-wrap w-full`} style={{
                  padding: '10px 14px',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  hyphens: 'auto'
                }}>
                        
           {/* File attachments - hide while regenerating */}
           {message.file_attachments && message.file_attachments.length > 0 && regeneratingMessageId !== message.id && <div className="mb-3 space-y-3">
               {message.file_attachments.map((file, index) => {
                 console.log('[CHAT-RENDER] Rendering file attachment:', {
                   index,
                   fileName: file.name,
                   fileType: file.type,
                   fileUrl: file.url,
                   isImage: isImageFile(file.type),
                   hasUrl: !!file.url
                 });
                 
                  return <div key={index}>
                    {isImageFile(file.type) && file.url ? <div className="space-y-2">
                        <img src={file.url} alt={file.name || "Image"} className="max-w-full sm:max-w-[280px] md:max-w-[300px] max-h-[200px] object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity shadow-sm border" onClick={() => setSelectedImage({
                           url: file.url,
                           name: file.name
                         })} onError={e => {
                           console.error('[CHAT-RENDER] Image load error:', file.url);
                           e.currentTarget.style.display = 'none';
                         }} onLoad={() => {
                           console.log('[CHAT-RENDER] Image loaded successfully:', file.url);
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
                                </div>;
               })}
                            </div>}
                        
                            {/* Show think animation when regenerating or hidden */}
                            {(regeneratingMessageId === message.id || hiddenMessageIds.has(message.id)) && (
                              <div className="flex items-center space-x-2 py-8">
                                <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                              </div>
                            )}
                        
                            {/* Show message content if not hidden */}
                            {message.content && !hiddenMessageIds.has(message.id) && (
                                <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-current prose-p:text-current prose-strong:text-current prose-em:text-current prose-code:text-current prose-pre:bg-muted/50 prose-pre:text-current break-words overflow-hidden [&>*]:!my-0 [&>p]:!my-0 [&>h1]:!my-1 [&>h2]:!my-0.5 [&>h3]:!my-0.5 [&>h4]:!my-0 [&>h5]:!my-0 [&>h6]:!my-0 [&>ul]:!my-0 [&>ol]:!my-0 [&>blockquote]:!my-0 [&>pre]:!my-0 [&>table]:!my-0 [&>hr]:!my-0 [&>li]:!my-0 [&>br]:hidden" style={{
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
                                      </code> : <pre className="bg-muted/50 p-4 rounded-lg text-sm overflow-x-auto max-w-full break-words !my-1">
                                        <code className="block max-w-full" {...props}>
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
                        }) => <div className="overflow-x-auto max-w-full">
                                       <table {...props} className="!my-1 min-w-full">
                                         {children}
                                       </table>
                                     </div>,
                       hr: ({
                         ...props
                       }) => <hr {...props} className="!my-1" />
                     }}>
                                  {message.content}
                                </ReactMarkdown>}
                              </div>
                            )
                          }
                         
                       </div>
                       
                          {/* Message action buttons - hide while regenerating */}
                          {regeneratingMessageId !== message.id && (
                            <div className={`flex gap-1 mt-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                              {/* Copy button - always show */}
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 bg-background/80 backdrop-blur-sm hover:bg-muted transition-opacity" onClick={() => copyToClipboard(message.content, message.id)}>
                                {copiedMessageId === message.id ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                              </Button>
                           
                            {/* Assistant message actions */}
                            {message.role === 'assistant' && (
                              <>
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
                               
                                  {/* Refresh button - disappears immediately when user sends new message */}
                                  {(() => {
                                    // Find current message index
                                    const currentIndex = messages.findIndex(msg => msg.id === message.id);
                                    // Find the last assistant message
                                    const lastAssistantMessage = [...messages].reverse().find(msg => msg.role === 'assistant');
                                    
                                    if (!lastAssistantMessage || lastAssistantMessage.id !== message.id) {
                                      return false;
                                    }
                                    
                                    // Check if there are ANY messages after this one (user or assistant)
                                    const hasMessagesAfter = currentIndex < messages.length - 1;
                                    
                                    // Hide button immediately if there are any messages after it
                                    return !hasMessagesAfter;
                                   })() && (
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-7 w-7 p-0 bg-background/80 backdrop-blur-sm hover:bg-muted transition-opacity"
                                      onClick={() => regenerateResponse(message.id)}
                                      disabled={isGeneratingResponse}
                                    >
                                      {isGeneratingResponse ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                                        </svg>
                                      ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <path d="M21 2v6h-6"></path>
                                          <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
                                          <path d="M3 22v-6h6"></path>
                                          <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
                                        </svg>
                                      )}
                                    </Button>
                                  )}
                              </>
                            )}
                          </div>
                          )}
                    </div>
                  </div>
                 </div>;
               })}
              
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
            
            {/* Recording UI - appears below textarea when recording */}
            {isRecording && (
              <div className="flex items-center gap-0.5 sm:gap-2 py-1 sm:py-2 px-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 sm:h-7 sm:w-7 rounded-full text-foreground hover:text-foreground hover:bg-accent flex-shrink-0 p-0"
                  onClick={cancelRecording}
                  aria-label="Cancel recording"
                >
                  <X className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5" />
                </Button>
                
                <div className="flex-1 flex items-center justify-center gap-0.5 sm:gap-2 min-w-0 overflow-hidden">
                  {/* Real-time audio waveform visualization - mobile optimized */}
                  <div className="flex items-center justify-center gap-[0.5px] sm:gap-[2px] h-4 sm:h-8 flex-1 max-w-[320px] sm:max-w-[600px] min-w-0">
                    {audioLevels.map((level, i) => {
                      // Calculate height based on audio level
                      const minHeight = 2;
                      const maxHeight = isMobile ? 16 : 32;
                      const height = minHeight + (level * (maxHeight - minHeight));
                      
                      return (
                        <div
                          key={i}
                          className="w-[0.5px] sm:w-[2px] bg-foreground rounded-full transition-all duration-75 ease-out"
                          style={{
                            height: `${height}px`,
                          }}
                        />
                      );
                    })}
                  </div>
                  
                  {/* Timer */}
                  <span className="text-[9px] sm:text-xs font-medium tabular-nums text-foreground flex-shrink-0">
                    {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                  </span>
                </div>
                
                <Button
                  size="sm"
                  className="h-5 w-5 sm:h-7 sm:w-7 rounded-full bg-foreground text-background hover:bg-foreground/90 flex-shrink-0 p-0"
                  onClick={stopRecording}
                  aria-label="Send recording"
                >
                  <svg className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </Button>
              </div>
            )}
            
            {/* Mobile Image mode controls */}
            {!isRecording && isImageMode && (
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

            {!isRecording && (
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
                        Generate image
                      </Button>
                    </PopoverContent>
                  </Popover>

                  {/* Right side - Send/Voice controls */}
                  <div className="flex items-center gap-2 bg-muted/30 rounded-full p-1">
                    <Button 
                      size="sm" 
                      className={`h-7 w-7 rounded-full focus-visible:ring-2 focus-visible:ring-offset-1 flex-shrink-0 ${
                        input.trim().length > 0 || selectedFiles.length > 0
                          ? 'bg-foreground hover:bg-foreground/90 focus-visible:ring-primary text-background'
                          : isRecording 
                            ? 'bg-red-500 hover:bg-red-600 focus-visible:ring-red-300 text-background' 
                            : 'bg-foreground hover:bg-foreground/90 focus-visible:ring-primary text-background'
                      }`} 
                      onClick={input.trim().length > 0 || selectedFiles.length > 0 ? sendMessage : (isRecording ? stopRecording : startRecording)}
                      aria-label={input.trim().length > 0 || selectedFiles.length > 0 ? "Send message" : (isRecording ? "Stop recording" : "Start voice recording")}
                      aria-pressed={isRecording}
                    >
                      {input.trim().length > 0 || selectedFiles.length > 0 ? (
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
                          Generate image
                        </Button>
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Select value={selectedModel} onValueChange={handleModelChange}>
                      <SelectTrigger className="w-[180px] h-8 bg-background border border-border/50 rounded-full z-50">
                        <SelectValue>
                          <span className="text-sm font-medium">{selectedModelData?.shortLabel}</span>
                        </SelectValue>
                      </SelectTrigger>
                       <SelectContent className="z-[100] bg-background border shadow-lg rounded-lg p-1 w-[calc(100vw-2rem)] max-w-[280px]">
                           {models.map(model => <SelectItem key={model.id} value={model.id} className="px-2 py-1.5 rounded-md">
                                <div className="flex items-center w-full gap-2">
                                   <div className="relative flex-shrink-0">
                                     {model.id.includes('gpt') || model.id === 'generate-image' || model.id === 'edit-image' ? (
                                       <img src={chatgptLogoSrc} alt="OpenAI" className="w-5 h-5 object-contain" />
                                     ) : model.id.includes('claude') ? (
                                        <img src={claudeLogo} alt="Claude" className="w-5 h-5 object-contain" />
                                      ) : model.id.includes('gemini') ? (
                                        <img src={geminiLogo} alt="Gemini" className="w-5 h-5 object-contain" />
                                      ) : (
                                        <Bot className="h-5 w-5" />
                                      )}
                                      {model.type === 'pro' && (
                                        <span className="absolute -top-1 -right-1 text-[7px] leading-none bg-gradient-to-r from-blue-500 to-purple-500 text-white px-0.5 py-0.5 rounded-full font-bold shadow-sm">
                                          PRO
                                        </span>
                                      )}
                                   </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="font-medium text-sm truncate">{model.name}</div>
                                      <div className="text-xs text-muted-foreground truncate">{model.description}</div>
                                    </div>
                                </div>
                             </SelectItem>)}
                       </SelectContent>
                    </Select>
                    
                    <Button 
                      size="sm" 
                      className={`h-8 w-8 rounded-full border border-border/50 ${
                        input.trim().length > 0 || selectedFiles.length > 0
                          ? 'bg-foreground hover:bg-foreground/90 text-background'
                          : isRecording 
                            ? 'bg-red-500 hover:bg-red-600 text-background' 
                            : 'bg-foreground hover:bg-foreground/90 text-background'
                      }`} 
                      onClick={input.trim().length > 0 || selectedFiles.length > 0 ? sendMessage : (isRecording ? stopRecording : startRecording)}
                      aria-label={input.trim().length > 0 || selectedFiles.length > 0 ? "Send message" : (isRecording ? "Stop recording" : "Start voice recording")}
                    >
                      {input.trim().length > 0 || selectedFiles.length > 0 ? (
                        <SendHorizontalIcon className="h-4 w-4" />
                      ) : (
                        isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />
                      )}
                    </Button>
                    
                  </div>
                </>
              )}
            </div>
            )}
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