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
    state: sidebarState
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
      // Process file uploads first
      let fileAttachments: FileAttachment[] = [];
      let base64ImageData: string | null = null;
      let imageFileInfo: any = null;
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          if (file.type.startsWith('image/')) {
            console.log('Processing image file:', file.name);

            // Convert image to base64
            base64ImageData = await new Promise<string>(resolve => {
              const reader = new FileReader();
              reader.onload = () => {
                const result = reader.result as string;
                // Remove data:image/jpeg;base64, prefix
                const base64 = result.split(',')[1];
                resolve(base64);
              };
              reader.readAsDataURL(file);
            });

            // Save image to Supabase storage with proper folder structure
            const fileName = `${user.id}/${actualChatId}_${Date.now()}_${file.name}`;
            console.log('Uploading to storage:', fileName);
            const {
              data: uploadData,
              error: uploadError
            } = await supabase.storage.from('chat-images').upload(fileName, file, {
              cacheControl: '3600',
              upsert: false
            });
            if (uploadError) {
              console.error('Error uploading image:', uploadError);
              toast.error('Failed to upload image');
              continue;
            }
            console.log('Upload successful:', uploadData);

            // Get public URL
            const {
              data: urlData
            } = supabase.storage.from('chat-images').getPublicUrl(fileName);
            console.log('Public URL:', urlData.publicUrl);
            const fileAttachment: FileAttachment = {
              id: crypto.randomUUID(),
              name: file.name,
              size: file.size,
              type: file.type,
              url: urlData.publicUrl
            };
            fileAttachments.push(fileAttachment);

            // Store image info for webhook
            imageFileInfo = {
              fileName: file.name,
              fileSize: file.size,
              fileType: file.type
            };
          }
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
          if (base64ImageData && imageFileInfo) {
            // Send image analysis format
            webhookData = {
              type: toolName,
              // Use tool name as type
              fileName: imageFileInfo.fileName,
              fileSize: imageFileInfo.fileSize,
              fileType: imageFileInfo.fileType,
              fileData: base64ImageData,
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
            hasImage: !!base64ImageData,
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
            if (responseData && (responseData.text || responseData.content || Array.isArray(responseData))) {
              let responseContent = '';
              if (Array.isArray(responseData) && responseData.length > 0) {
                const analysisTexts = responseData.map(item => item.text || item.content || '').filter(text => text);
                if (analysisTexts.length > 0) {
                  responseContent = analysisTexts.join('\n\n');
                }
              } else if (responseData.text) {
                responseContent = responseData.text;
              } else if (responseData.analysis || responseData.content) {
                responseContent = responseData.analysis || responseData.content;
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
      setSelectedFiles([]);
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
  return <div className="h-screen flex flex-col bg-background relative">
      {/* Tool Header - Only show when no messages */}
      {messages.length === 0 && <div className="border-b border-border/40 bg-card/30 backdrop-blur-xl p-4">
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
        </div>}

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto">
        <div style={getContainerStyle()}>
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
        <div className="py-8 pb-32 space-y-6">
              {messages.map((message, index) => <div key={message.id} className={`flex flex-col gap-2 px-4 ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${message.role === 'user' ? 'bg-primary text-primary-foreground' : ''}`}>
                    {/* File attachments for user messages - show before text */}
                    {message.role === 'user' && message.file_attachments && message.file_attachments.length > 0 && <div className="mb-3 space-y-2">
                        {message.file_attachments.map(file => <div key={file.id} className="flex items-center gap-2">
                            {file.type.startsWith('image/') ? <img src={file.url} alt={file.name} className="max-w-full h-auto rounded-lg cursor-pointer" onClick={() => setSelectedImage({
                    url: file.url,
                    name: file.name
                  })} /> : <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                                <FileText className="h-4 w-4" />
                                <span className="text-sm">{file.name}</span>
                              </div>}
                          </div>)}
                      </div>}

                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.content}
                      </ReactMarkdown>
                    </div>
                    
                    {/* File attachments for assistant messages - show after text */}
                    {message.role === 'assistant' && message.file_attachments && message.file_attachments.length > 0 && <div className="mt-3 space-y-2">
                        {message.file_attachments.map(file => <div key={file.id} className="flex items-center gap-2">
                            {file.type.startsWith('image/') ? <img src={file.url} alt={file.name} className="max-w-full h-auto rounded-lg cursor-pointer" onClick={() => setSelectedImage({
                    url: file.url,
                    name: file.name
                  })} /> : <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                                <FileText className="h-4 w-4" />
                                <span className="text-sm">{file.name}</span>
                              </div>}
                          </div>)}
                      </div>}
                  </div>
                  
                  {/* Copy button - always visible, positioned based on message role */}
                  <Button variant="ghost" size="sm" className={`h-6 w-6 p-0 text-muted-foreground hover:text-foreground ${message.role === 'user' ? 'self-end' : 'self-start'}`} onClick={() => copyToClipboard(message.content, message.id)}>
                    {copiedMessageId === message.id ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>)}
              
              {/* Loading indicator */}
              {(loading || isGeneratingResponse) && <div className="flex justify-start px-4">
                  <div className="bg-muted rounded-2xl px-4 py-3 max-w-[85%]">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="animate-pulse">Thinking...</div>
                    </div>
                  </div>
                </div>}
              
              <div ref={messagesEndRef} />
            </div>}
        </div>
      </div>

      {/* Input area - dynamically centered on available space */}
      <div className="overflow-hidden" style={getMessageInputStyle()}>
        <div className="px-4 py-4">
          
        </div>
      </div>

      {/* File input */}
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} multiple accept={toolConfig.allowImages && !toolConfig.allowFiles ? "image/*" : "*"} />

      {/* Image popup modal */}
      {selectedImage && <ImagePopupModal isOpen={true} imageUrl={selectedImage.url} onClose={() => setSelectedImage(null)} />}
    </div>;
}