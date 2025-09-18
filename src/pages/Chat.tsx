import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useSidebar } from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare, Plus, Paperclip, Copy, Check, X, FileText, ImageIcon, Mic, MicOff, Download, MoreHorizontal } from 'lucide-react';
import { SendHorizontalIcon } from '@/components/ui/send-horizontal-icon';
import { StopIcon } from '@/components/ui/stop-icon';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ImagePopupModal } from '@/components/ImagePopupModal';
import { TypewriterText } from '@/components/TypewriterText';

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
  // Remove toast hook since we're not using toasts
  const { state: sidebarState } = useSidebar();
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
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [pendingImageGenerations, setPendingImageGenerations] = useState<Set<string>>(new Set());
  const [selectedImage, setSelectedImage] = useState<{ url: string; name: string } | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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
            console.log('New message received via realtime:', payload);
            const newMessage = payload.new as Message;
            setMessages(prev => {
              // Check if message already exists (by real ID or temp ID) to prevent duplicates
              const existsById = prev.find(msg => msg.id === newMessage.id);
              const existsByContent = prev.find(msg => 
                msg.content === newMessage.content && 
                msg.role === newMessage.role &&
                Math.abs(new Date(msg.created_at).getTime() - new Date(newMessage.created_at).getTime()) < 5000 // Within 5 seconds
              );
              
              if (existsById || existsByContent) {
                console.log('Message already exists, skipping realtime update');
                return prev;
              }
              
              console.log('Adding new message from realtime');
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
      console.log('Trigger: Send Message to AI via OpenAI (fast)');
      
      // Create placeholder assistant message immediately
      const tempAssistantMessage: Message = {
        id: `temp-ai-${Date.now()}`,
        content: '',
        role: 'assistant',
        created_at: new Date().toISOString(),
        file_attachments: []
      };

      // Add placeholder message to UI
      setMessages(prev => [...prev, tempAssistantMessage]);
      scrollToBottom();

      // Call the fast AI function
      const { data: aiResponse, error: aiError } = await supabase.functions.invoke('chat-with-ai-fast', {
        body: {
          message: userMessage,
          chat_id: chatId,
          user_id: user.id
        }
      });

      console.log('AI response received:', aiResponse);

      if (aiError) {
        console.error('AI function error:', aiError);
        throw new Error(`AI function failed: ${aiError.message}`);
      }

      if (aiResponse) {
        let assistantResponse = '';
        let fileAttachments: any[] = [];
        
        if (aiResponse.type === 'image_generated') {
          // Handle image generation response
          assistantResponse = aiResponse.content;
          
          // Add the image as an attachment
          if (aiResponse.image_url) {
            fileAttachments = [{
              id: Date.now().toString(),
              name: `generated_image_${Date.now()}.png`,
              size: 0,
              type: 'image/png',
              url: aiResponse.image_url
            }];
          }
        } else if (aiResponse.type === 'text') {
          // Handle regular text response
          assistantResponse = aiResponse.content;
        } else {
          assistantResponse = aiResponse.content || "I apologize, but I'm having trouble connecting right now. Please try again in a moment.";
        }
        
        // Update the placeholder message with actual content
        setMessages(prev => prev.map(msg => 
          msg.id === tempAssistantMessage.id 
            ? { 
                ...msg, 
                content: assistantResponse,
                file_attachments: fileAttachments
              }
            : msg
        ));
        
        scrollToBottom();
        console.log(`AI response completed for message: ${userMessageId}`);
      } else {
        console.error('No response from AI function');
        throw new Error('No response from AI function');
      }
    } catch (error) {
      console.error('Auto AI response error:', error);
      // Remove the message from processed set on error so it can be retried
      processedUserMessages.current.delete(userMessageId);
      
      // Remove placeholder message on error
      setMessages(prev => prev.filter(msg => !msg.id.startsWith('temp-ai-')));
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

  const sendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!input.trim() && selectedFiles.length === 0) || !chatId || !user || loading) return;

    setLoading(true);
    const userMessage = input.trim();
    const files = [...selectedFiles];
    setInput('');
    setSelectedFiles([]);
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      // Upload files to Supabase storage first
      const uploadedFiles: FileAttachment[] = [];
      
      for (const file of files) {
        // Check file size limits
        const maxSize = getMaxFileSize(file.type);
        if (file.size > maxSize) {
          console.error(`File ${file.name} exceeds size limit`);
          continue;
        }

        const fileExtension = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('chat-files')
          .upload(fileName, file);

        if (uploadError) {
          console.error('File upload error:', uploadError);
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

      // Create user message object
      const newUserMessage: Message = {
        id: `temp-${Date.now()}`, // Temporary ID
        content: userMessage,
        role: 'user',
        created_at: new Date().toISOString(),
        file_attachments: uploadedFiles
      };

      // Immediately add user message to UI
      setMessages(prev => [...prev, newUserMessage]);
      scrollToBottom();

  // Helper function to generate embeddings in background
  const generateEmbeddingBackground = async (text: string, messageId: string) => {
    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await getOpenAIKey()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: text,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        const embedding = data.data[0].embedding;
        
        // Update the message with the embedding in background
        await supabase
          .from('messages')
          .update({ embedding })
          .eq('id', messageId);
      }
    } catch (error) {
      console.log('Background embedding generation failed:', error);
    }
  };

  // Add user message to database with file attachments
  const { data: insertedMessage, error: userError } = await supabase
    .from('messages')
    .insert({
      chat_id: chatId,
      content: userMessage,
      role: 'user',
      file_attachments: uploadedFiles as any // Cast to Json type for database
    })
    .select()
    .single();

  if (userError) throw userError;

  // Generate embedding for user message (in background, don't wait)
  if (userMessage.trim() && insertedMessage) {
    generateEmbeddingBackground(userMessage, insertedMessage.id);
  }

  // Update the message with the real ID from database
  if (insertedMessage) {
    setMessages(prev => prev.map(msg => 
      msg.id === newUserMessage.id 
        ? { 
            ...insertedMessage, 
            file_attachments: uploadedFiles,
            role: insertedMessage.role as 'user' | 'assistant'
          } as Message
        : msg
    ));
  }

      // Note: AI response will be automatically triggered by the useEffect hook
      // that detects new user messages - no need to call webhook here

      // Update chat title if current title is "New Chat" (regardless of message count)
      console.log('Checking if we need to update chat title...');
      // Check current title to avoid overwriting custom titles
      const { data: currentChat } = await supabase
        .from('chats')
        .select('title')
        .eq('id', chatId)
        .single();
      
      console.log('Current chat title:', currentChat?.title);
      
      if (currentChat && currentChat.title === 'New Chat') {
        const generatedTitle = generateChatTitle(userMessage);
        console.log('Updating chat title to:', generatedTitle);
        const { error: updateError } = await supabase
          .from('chats')
          .update({ title: generatedTitle })
          .eq('id', chatId);
        
        if (updateError) {
          console.error('Error updating chat title:', updateError);
        } else {
          console.log('Chat title updated successfully');
          // Trigger sidebar refresh to show updated title
          window.dispatchEvent(new CustomEvent('force-chat-refresh'));
        }
      }

    } catch (error: any) {
      console.error('Send message error:', error);
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
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        // Create audio blob and send for transcription
        const blob = new Blob(chunks, { type: 'audio/webm' });
        await transcribeAudio(blob);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error('Recording failed:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setMediaRecorder(null);
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      // Create FormData with audio file
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      // Send to speech-to-text edge function
      const response = await supabase.functions.invoke('speech-to-text', {
        body: formData,
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data && response.data.text) {
        // Insert transcribed text into message input
        const transcribedText = response.data.text.trim();
        setInput(prev => prev + (prev ? ' ' : '') + transcribedText);
        
        // Focus on textarea
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }
    } catch (error: any) {
      console.error('Transcription error:', error);
    }
  };

  const generateChatTitle = (message: string) => {
    // Remove extra whitespace and normalize
    const cleaned = message.trim().replace(/\s+/g, ' ');
    
    // Common words to filter out
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'could', 'should', 'can', 'may', 'might', 'must', 'i', 'you', 'he', 'she',
      'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its',
      'our', 'their', 'this', 'that', 'these', 'those', 'what', 'when', 'where', 'why', 'how',
      'please', 'help', 'tell', 'explain', 'show', 'give', 'get', 'make', 'take', 'go', 'come'
    ]);
    
    // Split into words and filter
    const words = cleaned.toLowerCase().split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
      .map(word => word.replace(/[^\w]/g, '')) // Remove punctuation
      .filter(word => word.length > 2);
    
    // If we have good keywords, use them
    if (words.length >= 2) {
      // Take first 3-4 most important words
      const selectedWords = words.slice(0, 4);
      
      // Capitalize each word
      const title = selectedWords
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
        
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
      
      // Check if it's a Supabase storage URL
      if (imageUrl.includes('supabase') || imageUrl.includes('storage')) {
        // Use Supabase client for authenticated requests
        const { data, error } = await supabase.storage
          .from('chat-files')
          .download(imageUrl.split('/').pop() || fileName || `image-${Date.now()}`);
          
        if (error) throw error;
        response = { blob: () => Promise.resolve(data) };
      } else {
        // For external URLs, try direct fetch
        response = await fetch(imageUrl, {
          method: 'GET',
          mode: 'cors',
          cache: 'no-cache',
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
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 200; // Maximum height in pixels
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

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
    <div className="fixed inset-0 flex flex-col bg-background">
      {/* Messages area - takes all available space above input */}
      <div className="flex-1 overflow-y-auto pb-24">
        <div className="w-full px-4 py-6" style={getContainerStyle()}>
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
                            ? 'text-black dark:text-white bg-[#DEE7F4] dark:bg-[hsl(var(--user-message-bg))] rounded-2xl' 
                            : 'text-black dark:text-white rounded-2xl bg-transparent border-none'
                        } px-3.5 py-2.5 relative break-words whitespace-pre-wrap`} style={{ 
                          padding: '10px 14px',
                          wordWrap: 'break-word',
                          overflowWrap: 'break-word',
                          hyphens: 'auto'
                        }}>
                        
                         {/* File attachments */}
                         {message.file_attachments && message.file_attachments.length > 0 && (
                           <div className="mb-3 space-y-3">
                             {message.file_attachments.map((file, index) => (
                               <div key={index}>
                                 {isImageFile(file.type) && file.url ? (
                                   <div className="space-y-2">
                                     <img 
                                       src={file.url} 
                                       alt="Generated image" 
                                       className="max-w-[300px] max-h-[200px] object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity shadow-sm border"
                                       onClick={() => setSelectedImage({ url: file.url, name: file.name })}
                                     />
                                     <div className="flex gap-2">
                                       <Button
                                         variant="ghost"
                                         size="sm"
                                         className="h-7 px-2 text-xs"
                                         onClick={() => downloadImageFromChat(file.url, file.name)}
                                       >
                                         <Download className="h-3 w-3 mr-1" />
                                         Download
                                       </Button>
                                     </div>
                                   </div>
                                 ) : (
                                   <div 
                                     className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer hover:opacity-80 transition-opacity ${
                                       message.role === 'user' 
                                         ? 'bg-black/10 border-white/20' 
                                         : 'bg-accent border-border'
                                     }`}
                                     onClick={() => openFile(file.url, file.name)}
                                   >
                                     <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                       message.role === 'user' 
                                         ? 'bg-white/20' 
                                         : 'bg-muted'
                                     }`}>
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
                                   </div>
                                 )}
                               </div>
                             ))}
                           </div>
                         )}
                        
                          {message.content && (
                            <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-current prose-p:text-current prose-strong:text-current prose-em:text-current prose-code:text-current prose-pre:bg-muted/50 prose-pre:text-current break-words overflow-hidden [&>*]:!my-0 [&>p]:!my-0 [&>h1]:!my-2 [&>h2]:!my-1.5 [&>h3]:!my-1 [&>h4]:!my-0.5 [&>h5]:!my-0.5 [&>h6]:!my-0.5 [&>ul]:!my-0 [&>ol]:!my-0 [&>blockquote]:!my-0.5 [&>pre]:!my-0.5 [&>table]:!my-0.5 [&>hr]:!my-0.5 [&>li]:!my-0 [&>br]:!my-0" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                              {message.content.includes("🎨 Generating your image") ? (
                                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30">
                                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                  <div>
                                    <p className="text-sm font-medium">Generating your image...</p>
                                    <p className="text-xs text-muted-foreground">This may take a few moments</p>
                                  </div>
                                </div>
                              ) : message.role === 'assistant' ? (
                                // Use TypewriterText for assistant messages
                                <TypewriterText
                                  text={message.content}
                                  typeSpeed={50}
                                  backSpeed={30}
                                  className="break-words overflow-wrap-anywhere"
                                  onComplete={() => scrollToBottom()}
                                />
                              ) : (
                             <ReactMarkdown
                               remarkPlugins={[remarkGfm]}
                               components={{
                                 code({node, className, children, ...props}: any) {
                                   const match = /language-(\w+)/.exec(className || '');
                                   const inline = !match;
                                   return inline ? (
                                     <code className="bg-muted/50 px-1.5 py-0.5 rounded text-sm break-words" {...props}>
                                       {children}
                                     </code>
                                   ) : (
                                     <pre className="bg-muted/50 p-4 rounded-lg text-sm overflow-x-auto break-words !my-1">
                                       <code {...props}>
                                         {children}
                                       </code>
                                     </pre>
                                   );
                                 },
                                  p: ({children, ...props}) => (
                                    <p {...props} className="break-words overflow-wrap-anywhere !my-0" style={{wordBreak: 'break-word', overflowWrap: 'anywhere'}}>
                                      {children}
                                    </p>
                                  ),
                                 h1: ({children, ...props}) => (
                                   <h1 {...props} className="!my-1 !mb-1">
                                     {children}
                                   </h1>
                                 ),
                                 h2: ({children, ...props}) => (
                                   <h2 {...props} className="!my-1 !mb-1">
                                     {children}
                                   </h2>
                                 ),
                                 h3: ({children, ...props}) => (
                                   <h3 {...props} className="!my-0.5 !mb-0.5">
                                     {children}
                                   </h3>
                                 ),
                                 h4: ({children, ...props}) => (
                                   <h4 {...props} className="!my-0.5 !mb-0.5">
                                     {children}
                                   </h4>
                                 ),
                                  ul: ({children, ...props}) => (
                                    <ul {...props} className="!my-0 !leading-tight [&>li]:!my-0">
                                      {children}
                                    </ul>
                                  ),
                                  ol: ({children, ...props}) => (
                                    <ol {...props} className="!my-0 !leading-tight [&>li]:!my-0">
                                      {children}
                                    </ol>
                                  ),
                                 li: ({children, ...props}) => (
                                   <li {...props} className="!my-0">
                                     {children}
                                   </li>
                                 ),
                                 blockquote: ({children, ...props}) => (
                                   <blockquote {...props} className="!my-1">
                                     {children}
                                   </blockquote>
                                 ),
                                 table: ({children, ...props}) => (
                                   <table {...props} className="!my-1">
                                     {children}
                                   </table>
                                 ),
                                 hr: ({...props}) => (
                                   <hr {...props} className="!my-1" />
                                 ),
                               }}
                              >
                                {message.content}
                              </ReactMarkdown>
                              )}
                            </div>
                          )}
                         
                       </div>
                       
                        {/* Copy button - always visible, positioned below the message content */}
                        <div className={`flex mt-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 bg-background/80 backdrop-blur-sm border shadow-sm hover:bg-muted transition-opacity"
                            onClick={() => copyToClipboard(message.content, message.id)}
                          >
                            {copiedMessageId === message.id ? (
                              <Check className="h-3 w-3 text-green-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
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

      {/* Input area - fixed at bottom like ChatGPT */}
      <div className="fixed bottom-0 left-0 right-0 bg-background">
        <div className="px-4 py-4" style={getContainerStyle()}>
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
          
          <div className="relative">
            <div className={`flex-1 flex items-center border rounded-3xl px-4 py-3 ${actualTheme === 'light' ? 'bg-white border-gray-200' : 'bg-[hsl(var(--input))] border-border'}`}>
              {/* Attachment button - left side inside input */}
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
                    onClick={handleFileUpload}
                  >
                    <Paperclip className="h-4 w-4" />
                    Attach files
                  </Button>
                </PopoverContent>
              </Popover>
              
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Message AdamGPT..."
                className="flex-1 min-h-[24px] max-h-[200px] border-0 resize-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0 py-0 text-foreground placeholder:text-muted-foreground break-words text-left"
                style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
                disabled={loading}
                rows={1}
              />
              
              <div className="flex items-center gap-1 ml-2 pb-1">
                {/* Dictation button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={`h-8 w-8 p-0 hover:bg-muted/20 rounded-full flex-shrink-0 ${isRecording ? 'text-red-500' : 'text-muted-foreground'}`}
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={loading}
                >
                  {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
                
                {/* Send button - always visible */}
                <Button
                  type="button"
                  onClick={sendMessage}
                  disabled={(!input.trim() && selectedFiles.length === 0) || loading}
                  size="sm"
                  className="h-8 w-8 p-0 rounded-full flex-shrink-0"
                  style={{ 
                    backgroundColor: (input.trim() || selectedFiles.length > 0) && !loading
                      ? (actualTheme === 'light' ? 'hsl(var(--user-message-bg))' : 'hsl(var(--primary))')
                      : 'hsl(var(--muted))',
                    color: (input.trim() || selectedFiles.length > 0) && !loading
                      ? (actualTheme === 'light' ? 'hsl(var(--foreground))' : 'hsl(var(--primary-foreground))')
                      : 'hsl(var(--muted-foreground))'
                  }}
                >
                  {loading ? <StopIcon className="h-4 w-4" /> : <SendHorizontalIcon className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
          
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

      {/* Image popup modal */}
      {selectedImage && (
        <ImagePopupModal
          isOpen={!!selectedImage}
          onClose={() => setSelectedImage(null)}
          imageUrl={selectedImage.url}
          prompt={selectedImage.name}
        />
      )}
    </div>
  );
}