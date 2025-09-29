import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useMessageLimit } from '@/hooks/useMessageLimit';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { supabase } from '@/integrations/supabase/client';
import { Paperclip, Mic, MicOff, ImageIcon, Globe, Edit3, BookOpen, Search, FileText, Plus, ChevronLeft, ChevronRight, X, Palette, BarChart3, Lightbulb, Settings, Zap, Menu, ChevronDown, ChevronUp } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SendHorizontalIcon } from '@/components/ui/send-horizontal-icon';

import GoogleOneTab from '@/components/GoogleOneTab';
import AuthModal from '@/components/AuthModal';
import { toast } from 'sonner';
import chatgptLogo from '@/assets/chatgpt-logo.png';
import chatgptLogoLight from '@/assets/chatgpt-logo-light.png';

import claudeLogo from '@/assets/claude-logo.png';


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
  description: "Alternative for natural language and writing",
  type: 'pro'
}, {
  id: 'generate-image',
  name: 'Generate Image',
  shortLabel: 'Generate Image',
  description: "Create images with DALL·E 3",
  type: 'action'
}];

const emojiCategories = {
  'general': ['😊', '👍', '🔥', '💯', '🎉', '✨', '🚀', '💪', '🎯', '⭐'],
  'emotions': ['😍', '🥰', '😂', '🤔', '😮', '🙄', '😎', '🤗', '😴', '🤯'],
  'objects': ['📱', '💻', '🎮', '📸', '🎵', '📚', '✏️', '🔧', '💡', '🏆'],
  'nature': ['🌟', '🌙', '☀️', '🌈', '🌸', '🌿', '🍀', '🦋', '🌊', '🔮'],
  'food': ['🍕', '🍔', '🍰', '🍪', '☕', '🍵', '🥤', '🍎', '🥑', '🌮'],
  'activities': ['🎨', '🎪', '🎭', '🎬', '🎤', '🎸', '🏃', '🚴', '🏊', '✈️']
};

const suggestionsByCategory = {
  'code-review': ['Review this code for bugs', 'Optimize this function', 'Explain this algorithm', 'Suggest improvements'],
  'content-writing': ['Write a blog post about...', 'Create social media content', 'Draft an email', 'Write product descriptions'],
  'math-solving': ['Solve this equation', 'Explain this math concept', 'Calculate percentages', 'Help with statistics'],
  'language-help': ['Translate this text', 'Check grammar and spelling', 'Improve writing style', 'Explain language rules'],
  'creative-writing': ['Write a short story', 'Create a poem', 'Develop character ideas', 'Brainstorm plot concepts'],
  'data-analysis': ['Analyze this dataset', 'Create data visualizations', 'Explain trends', 'Generate insights'],
  'learning-help': ['Explain this concept simply', 'Create study materials', 'Quiz me on this topic', 'Provide examples'],
  'brainstorming': ['Generate ideas for...', 'Creative solutions to...', 'Marketing strategies', 'Product features'],
  'research-help': ['Research this topic', 'Find credible sources', 'Summarize findings', 'Compare different views'],
  'productivity': ['Create a schedule', 'Organize tasks', 'Set priorities', 'Time management tips'],
  'problem-solving': ['Help solve this problem', 'Break down complex issues', 'Find root causes', 'Generate solutions'],
  'text-summary': ['Summarize this text briefly', 'Condense into main points', 'Provide a short overview', 'Extract key takeaways'],
  'calorie-check': ['Estimate calories in this food', 'Analyze nutritional content', 'Check dietary information', 'Calculate meal calories'],
  'generate-image': ['Create an image of...', 'Generate artwork showing...', 'Design a visual representation of...', 'Produce an illustration of...']
};
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
  description: 'Excellent for natural language tasks, writing, and creative work.',
  icon: 'claude'
}, {
  id: 'generate-image',
  name: 'Generate Image',
  shortLabel: 'Generate Image',
  description: 'Create stunning images and artwork using DALL·E 3.',
  icon: 'openai'
}];

// Suggestion buttons for quick actions
const suggestionButtons = [
  { label: 'Code Review', action: 'code-review', icon: FileText },
  { label: 'Writing Help', action: 'content-writing', icon: Edit3 },
  { label: 'Math Help', action: 'math-solving', icon: BarChart3 },
  { label: 'Learn Topic', action: 'learning-help', icon: BookOpen },
];

const additionalButtons = [
  { label: 'Creative Writing', action: 'creative-writing', icon: Lightbulb },
  { label: 'Data Analysis', action: 'data-analysis', icon: BarChart3 },
  { label: 'Brainstorming', action: 'brainstorming', icon: Zap },
  { label: 'Research Help', action: 'research-help', icon: Search },
  { label: 'Productivity', action: 'productivity', icon: Settings },
  { label: 'Problem Solving', action: 'problem-solving', icon: Lightbulb },
];

// Rename suggestionsByCategory to suggestionPrompts for consistency
const suggestionPrompts = suggestionsByCategory;

export default function Index() {
  const {
    user,
    loading: authLoading,
    userProfile
  } = useAuth();
  const {
    actualTheme
  } = useTheme();

  // Choose the appropriate ChatGPT logo based on theme
  const chatgptLogoSrc = actualTheme === 'dark' ? chatgptLogo : chatgptLogoLight;

  // Helper function to get model icon
  const getModelIcon = (iconType: string) => {
    switch (iconType) {
      case 'openai':
        return chatgptLogoSrc;
      case 'claude':
        return claudeLogo;
      default:
        return chatgptLogoSrc;
    }
  };
  const {
    canSendMessage,
    isAtLimit,
    sessionId,
    incrementMessageCount
  } = useMessageLimit();

  // Helper function to get time-based greeting
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return 'Good morning';
    } else if (hour >= 12 && hour < 17) {
      return 'Good afternoon';
    } else if (hour >= 17 && hour < 22) {
      return 'Good evening';
    } else {
      return 'Good night';
    }
  };
  const getDisplayName = () => {
    if (userProfile?.display_name) {
      return userProfile.display_name;
    }
    if (user?.user_metadata?.display_name) {
      return user.user_metadata.display_name;
    }
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'there';
  };
  const timeGreeting = getTimeBasedGreeting();
  const displayName = getDisplayName();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingMessage, setPendingMessage] = useState('');
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
  const [isDragOver, setIsDragOver] = useState(false);
  const [modelsScrollPosition, setModelsScrollPosition] = useState(0);
  const [isImageMode, setIsImageMode] = useState(false);
  const [isStylesOpen, setIsStylesOpen] = useState(false);
  
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState<string | null>(null);
  const [showMoreButtons, setShowMoreButtons] = useState(false);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modelsContainerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const {
    isMobile
  } = useSidebar();
  useEffect(() => {
    if (user && !pendingMessage) {
      const storedMessage = localStorage.getItem('pendingChatMessage');
      if (storedMessage) {
        localStorage.removeItem('pendingChatMessage');
        createChatWithMessage(user.id, storedMessage);
      }
    }
  }, [user]);
  if (authLoading) {
    return <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>;
  }
  const handleFileUpload = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    fileInputRef.current?.click();
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
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
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files]);
      toast.success(`${files.length} file(s) added successfully`);
    }
  };
  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <ImageIcon className="h-4 w-4" />;
    } else {
      return <FileText className="h-4 w-4" />;
    }
  };
  const handleSearchWeb = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    console.log('Search web functionality');
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;

    // Hide suggestions and show available models when text is cleared
    if (e.target.value.trim() === '') {
      setShowSuggestions(null);
      setShowMoreButtons(false);
    }
  };
  const startRecording = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.onresult = (event: any) => setMessage(prev => prev + event.results[0][0].transcript);
    recognition.onend = () => setIsRecording(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };
  const stopRecording = () => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  };
  const handleStartChat = async () => {
    if (!message.trim() || loading) return;
    if (!user) {
      setPendingMessage(message);
      localStorage.setItem('pendingChatMessage', message);
      setShowAuthModal(true);
      return;
    }
    if (!canSendMessage) {
      navigate('/pricing-plans');
      return;
    }
    setLoading(true);
    try {
      // Create new chat
      const {
        data: chatData,
        error: chatError
      } = await supabase.from('chats').insert([{
        user_id: user.id,
        title: message.slice(0, 50) || 'New Chat'
      }]).select().single();
      if (chatError) throw chatError;

      // Insert user message
      const {
        error: messageError
      } = await supabase.from('messages').insert({
        chat_id: chatData.id,
        content: message,
        role: 'user'
      });
      if (messageError) throw messageError;

      // Clear message and navigate immediately to chat page
      // Pass the selected model via navigation state so Chat page uses same model
      setMessage('');
      navigate(`/chat/${chatData.id}`, {
        replace: true,
        state: {
          selectedModel: selectedModel
        }
      });
    } catch (error) {
      console.error('Error starting chat:', error);
      toast.error('Failed to start chat. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  const createChatWithMessage = async (userId: string, messageToSend: string) => {
    if (!canSendMessage) {
      navigate('/pricing-plans');
      return;
    }
    setLoading(true);
    try {
      const {
        data: chatData,
        error: chatError
      } = await supabase.from('chats').insert([{
        user_id: userId,
        title: messageToSend.slice(0, 50) || 'New Chat'
      }]).select().single();
      if (chatError) throw chatError;
      const {
        error: messageError
      } = await supabase.from('messages').insert({
        chat_id: chatData.id,
        content: messageToSend,
        role: 'user'
      });
      if (messageError) throw messageError;
      navigate(`/chat/${chatData.id}`);
    } catch (error) {
      console.error('Error starting chat with message:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleSuggestionClick = (action: string) => {
    if (action === 'see-more') {
      setShowMoreButtons(true);
      return;
    }

    // Show specific suggestions for the clicked button
    setShowSuggestions(action);
    textareaRef.current?.focus();
  };
  const handlePromptClick = (prompt: string) => {
    setMessage(prompt);
    setShowSuggestions(null);
    setShowMoreButtons(false);
    textareaRef.current?.focus();
  };
  const handleModelSelect = (modelId: string) => {
    setSelectedModel(modelId);
  };
  const scrollModels = (direction: 'left' | 'right') => {
    if (modelsContainerRef.current) {
      const scrollAmount = 300;
      const currentScroll = modelsContainerRef.current.scrollLeft;
      const newScroll = direction === 'left' ? currentScroll - scrollAmount : currentScroll + scrollAmount;
      modelsContainerRef.current.scrollTo({
        left: newScroll,
        behavior: 'smooth'
      });
    }
  };
  const selectedModelData = models.find(m => m.id === selectedModel);
  const imageStyles = [{
    name: 'Cyberpunk',
    prompt: 'Create an image in a cyberpunk aesthetic: vivid neon accents, futuristic textures, glowing details, and high-contrast lighting.'
  }, {
    name: 'Anime',
    prompt: 'Create an image in an anime art style: clean lines, vibrant colors, expressive characters, and detailed backgrounds with a Japanese animation aesthetic.'
  }, {
    name: 'Minimalist',
    prompt: 'Create an image in a minimalist style: clean, simple composition with plenty of white space, limited color palette, and focus on essential elements only.'
  }, {
    name: 'Watercolor',
    prompt: 'Create an image in a watercolor painting style: soft, flowing colors that blend naturally, visible brush strokes, and delicate, artistic textures.'
  }, {
    name: 'Vintage',
    prompt: 'Create an image with a vintage aesthetic: sepia tones, aged textures, classic composition, and nostalgic mood reminiscent of old photographs.'
  }, {
    name: 'Photorealistic',
    prompt: 'Create a photorealistic image: highly detailed, accurate lighting, realistic textures, and lifelike appearance as if captured by a professional camera.'
  }, {
    name: 'Abstract',
    prompt: 'Create an abstract image: non-representational forms, bold colors, geometric or fluid shapes, and expressive artistic interpretation.'
  }, {
    name: 'Coloring Book',
    prompt: 'Create an image in a coloring book style: black line art on white background, clear outlines, simple shapes perfect for coloring.'
  }, {
    name: 'Synthwave',
    prompt: 'Create an image in a synthwave aesthetic: retro-futuristic 1980s vibe with neon grids, glowing sunset, vibrant magenta-and-cyan gradients, chrome highlights, and a nostalgic outrun atmosphere.'
  }];
  const handleStyleSelect = (style: typeof imageStyles[0]) => {
    setMessage(style.prompt);
    setSelectedStyle(style.name);
    setIsStylesOpen(false);
    setIsImageMode(false); // Exit image mode when style is selected

    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };
  const handleExitImageMode = () => {
    setIsImageMode(false);
    setSelectedStyle(null);
    setMessage('');
  };
  const getStyleBackground = (styleName: string) => {
    switch (styleName) {
      case 'Cyberpunk':
        return 'bg-gradient-to-br from-cyan-500/30 to-purple-600/40 border border-cyan-400/20';
      case 'Anime':
        return 'bg-gradient-to-br from-pink-400/30 to-orange-400/40 border border-pink-300/20';
      case 'Minimalist':
        return 'bg-gradient-to-br from-gray-100/50 to-gray-200/50 border border-gray-300/20';
      case 'Watercolor':
        return 'bg-gradient-to-br from-blue-300/30 to-green-300/40 border border-blue-200/20';
      case 'Vintage':
        return 'bg-gradient-to-br from-amber-400/30 to-orange-400/40 border border-amber-300/20';
      case 'Photorealistic':
        return 'bg-gradient-to-br from-slate-400/30 to-slate-600/40 border border-slate-300/20';
      case 'Abstract':
        return 'bg-gradient-to-br from-purple-400/30 to-red-400/40 border border-purple-300/20';
      case 'Coloring Book':
        return 'bg-gradient-to-br from-white to-gray-50 border border-gray-200';
      case 'Synthwave':
        return 'bg-gradient-to-br from-purple-500/30 to-pink-500/40 border border-purple-400/20';
      default:
        return 'bg-muted border border-border';
    }
  };
  return <div className="flex-1 flex flex-col min-h-screen">
      {/* Mobile Header with Sidebar Trigger */}
      {isMobile && <div className="relative flex items-center p-3 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
          <SidebarTrigger className="h-9 w-9 hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary" aria-label="Open sidebar menu" />
          
          {/* Mobile Model Selector triggered by AdamGpt - Absolutely centered */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <Select value={selectedModel} onValueChange={handleModelSelect} onOpenChange={setIsModelDropdownOpen}>
              <SelectTrigger className="bg-transparent border-0 hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-primary rounded-lg transition-all duration-200 h-auto p-2 [&>svg]:hidden" aria-label="Select AI model">
                <div className="flex items-center justify-center gap-1 whitespace-nowrap">
                  <span className="text-lg font-semibold">{selectedModelData?.shortLabel || 'AdamGpt'}</span>
                  {isModelDropdownOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
              </SelectTrigger>
              <SelectContent className="z-[100] bg-background/95 backdrop-blur-xl border border-border/80 shadow-2xl rounded-2xl p-2 w-[calc(100vw-2rem)] max-w-[300px]" align="center">
                {models.map(model => {
              const modelData = availableModels.find(m => m.id === model.id);
              return <SelectItem key={model.id} value={model.id} className="rounded-xl px-3 py-3 hover:bg-accent/60 focus-visible:bg-accent/60 transition-all duration-200 cursor-pointer">
                      <div className="flex items-center w-full">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-8 h-8 bg-gradient-to-br from-primary/10 to-primary/20 backdrop-blur-sm rounded-xl flex items-center justify-center p-1.5 flex-shrink-0">
                            <img src={getModelIcon(modelData?.icon || 'openai')} alt={`${model.name} icon`} className="w-5 h-5 object-contain" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm text-foreground">{model.name}</div>
                            <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{model.description}</div>
                          </div>
                        </div>
                        {model.type === 'pro' && <span className="text-xs bg-gradient-to-r from-blue-500 to-purple-500 text-white px-2 py-1 rounded-full font-medium flex-shrink-0 ml-auto">
                            Pro
                          </span>}
                      </div>
                    </SelectItem>;
            })}
              </SelectContent>
            </Select>
          </div>
        </div>}
      
      <div className="flex-1 flex flex-col items-center justify-center p-3 sm:p-6 max-w-4xl mx-auto w-full transition-all duration-200" onDragOver={e => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(true);
    }} onDragEnter={e => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(true);
    }} onDragLeave={e => {
      e.preventDefault();
      e.stopPropagation();
      // Only hide overlay if leaving the entire page area
      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
        setIsDragOver(false);
      }
    }} onDrop={e => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      if (!user) {
        setShowAuthModal(true);
        return;
      }
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        setSelectedFiles(prev => [...prev, ...files]);
      }
    }}>

        {/* Google One Tap for unauthenticated users */}
        <GoogleOneTab />
      
      <div className="text-center mb-6 sm:mb-8">
        {user ? <>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">{timeGreeting}, {displayName}</h1>
            <p className="text-muted-foreground text-base sm:text-lg">How can I help you today?</p>
          </> : <>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">{timeGreeting}</h1>
            <p className="text-muted-foreground text-base sm:text-lg">How can I help you today?</p>
          </>}
      </div>

      <div className="w-full max-w-3xl mb-4 sm:mb-6">
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
        
        <div className={`relative bg-background border border-border rounded-xl sm:rounded-2xl p-3 sm:p-4 transition-all duration-200 ${isDragOver ? 'border-primary border-2 border-dashed bg-primary/5' : ''}`}>
          {/* Drag and drop overlay */}
          {isDragOver && <div className="absolute inset-0 bg-primary/10 flex items-center justify-center z-50 rounded-xl border-2 border-dashed border-primary">
              <div className="text-center">
                <Paperclip className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-base font-semibold text-primary">Drop files here</p>
              </div>
            </div>}
          <Textarea ref={textareaRef} value={message} onChange={handleInputChange} onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleStartChat();
            }
          }} onFocus={e => {
            // Prevent default scroll behavior on mobile
            if (window.innerWidth < 768) {
              e.target.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
              });
            }
          }} placeholder={isImageMode ? "Describe an image..." : "ask me anything..."} className="w-full min-h-[24px] border-0 resize-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 outline-none px-0 py-0 mb-3 text-sm sm:text-base" rows={1} aria-label={isImageMode ? "Describe an image" : "Type your message"} />
          
          {/* Mobile-first redesigned input controls */}
          <div className="flex flex-col gap-3">
            {/* File upload controls row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {!isMobile && <>
                    <Button variant="ghost" size="sm" className="h-9 w-9 rounded-full border border-border/50 text-muted-foreground hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary flex-shrink-0" onClick={handleFileUpload} aria-label="Upload file">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    
                    {isImageMode && !selectedStyle ? <div className="flex items-center gap-2">
                        {/* Image mode indicator */}
                        <div className="group flex items-center gap-1 bg-muted px-3 py-2 rounded-full text-xs">
                          <ImageIcon className="h-3 w-3" />
                          <span>Image</span>
                          <button onClick={handleExitImageMode} className="opacity-70 group-hover:opacity-100 transition-opacity ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-primary" aria-label="Exit image mode">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                        
                        {/* Styles dropdown */}
                        <Popover open={isStylesOpen} onOpenChange={setIsStylesOpen}>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-9 px-3 text-xs gap-1 bg-muted hover:bg-muted/80 rounded-full border border-border/50 focus-visible:ring-2 focus-visible:ring-primary" aria-label="Select image style" aria-expanded={isStylesOpen} aria-haspopup="true">
                              <Palette className="h-3 w-3" />
                              <span>Styles</span>
                              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-72 sm:w-80 p-3 sm:p-4 bg-background border shadow-lg z-50" align="start">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                              {imageStyles.map(style => <button key={style.name} onClick={() => handleStyleSelect(style)} className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors text-center focus-visible:ring-2 focus-visible:ring-primary focus-visible:bg-muted" aria-label={`Select ${style.name} style`}>
                                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center ${getStyleBackground(style.name)}`}>
                                    <span className={`text-xs font-medium ${style.name === 'Coloring Book' ? 'text-black' : 'text-foreground'}`}>
                                      {style.name.split(' ').map(word => word[0]).join('').slice(0, 2)}
                                    </span>
                                  </div>
                                  <span className="text-xs font-medium leading-tight">{style.name}</span>
                                </button>)}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div> : <Button variant="ghost" size="sm" className="h-9 px-3 rounded-full border border-border/50 text-muted-foreground hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary text-xs" onClick={() => setSelectedModel('generate-image')} aria-label="Create an image">
                        <ImageIcon className="h-4 w-4 mr-2" />
                        <span>Generate an image</span>
                      </Button>}
                  </>}
              </div>

              {/* Desktop model selector and voice controls */}
              {!isMobile && <div className="flex items-center gap-2">
                  <Select value={selectedModel} onValueChange={handleModelSelect}>
                    <SelectTrigger className="w-[200px] h-10 bg-background/80 backdrop-blur-sm border border-border/50 rounded-xl focus-visible:ring-2 focus-visible:ring-primary text-sm shadow-sm hover:bg-accent/50 transition-all duration-200" aria-label="Select AI model">
                      <SelectValue>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-gradient-to-br from-primary/10 to-primary/20 rounded-lg flex items-center justify-center">
                            <img src={getModelIcon(availableModels.find(m => m.id === selectedModel)?.icon || 'openai')} alt={`${selectedModelData?.name} icon`} className="w-4 h-4 object-contain" />
                          </div>
                          <span className="font-medium truncate">{selectedModelData?.shortLabel}</span>
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="z-[100] bg-background/95 backdrop-blur-xl border border-border/80 shadow-2xl rounded-2xl p-2 w-[calc(100vw-2rem)] max-w-[320px]">
                      {models.map(model => {
                      const modelData = availableModels.find(m => m.id === model.id);
                      return <SelectItem key={model.id} value={model.id} className="rounded-xl px-3 py-3 hover:bg-accent/60 focus-visible:bg-accent/60 transition-all duration-200 cursor-pointer">
                            <div className="flex items-center w-full">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="w-8 h-8 bg-gradient-to-br from-primary/10 to-primary/20 backdrop-blur-sm rounded-xl flex items-center justify-center p-1.5 flex-shrink-0">
                                  <img src={getModelIcon(modelData?.icon || 'openai')} alt={`${model.name} icon`} className="w-5 h-5 object-contain" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-sm">{model.name}</div>
                                  <div className="text-xs text-muted-foreground mt-0.5">{model.description}</div>
                                </div>
                              </div>
                              {model.type === 'pro' && <span className="text-xs bg-gradient-to-r from-blue-500 to-purple-500 text-white px-2 py-1 rounded-full font-medium flex-shrink-0 ml-auto">
                                  Pro
                                </span>}
                            </div>
                          </SelectItem>;
                    })}
                    </SelectContent>
                  </Select>
                  
                  <Button 
                    size="sm" 
                    className={`h-9 w-9 rounded-full border border-border/50 focus-visible:ring-2 focus-visible:ring-offset-2 flex-shrink-0 ${
                      message.trim().length > 0
                        ? 'bg-foreground hover:bg-foreground/90 focus-visible:ring-primary text-background'
                        : isRecording 
                          ? 'bg-red-500 hover:bg-red-600 focus-visible:ring-red-300 text-background' 
                          : 'bg-foreground hover:bg-foreground/90 focus-visible:ring-primary text-background'
                    }`} 
                    onClick={message.trim().length > 0 ? handleStartChat : (isRecording ? stopRecording : startRecording)} 
                    aria-label={message.trim().length > 0 ? "Send message" : (isRecording ? "Stop recording" : "Start voice recording")} 
                    aria-pressed={isRecording}
                  >
                    {message.trim().length > 0 ? (
                      <SendHorizontalIcon className="h-4 w-4" />
                    ) : (
                      isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />
                    )}
                  </Button>
                  
                </div>}
            </div>

            {/* Mobile controls - upload, dictation and voice mode buttons */}
            {isMobile && <div className="flex justify-between items-center">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full border border-border/30 text-muted-foreground hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary flex-shrink-0" aria-label="Upload or create content">
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-2 bg-background border shadow-lg z-50" align="start">
                    <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={handleFileUpload}>
                      <Paperclip className="h-4 w-4" />
                      Add photos & files
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={() => setSelectedModel('generate-image')}>
                      <ImageIcon className="h-4 w-4" />
                      Create an image
                    </Button>
                  </PopoverContent>
                </Popover>
                
                <div className="flex items-center gap-2 bg-muted/30 rounded-full p-1">
                  <Button 
                    size="sm" 
                    className={`h-7 w-7 rounded-full focus-visible:ring-2 focus-visible:ring-offset-1 flex-shrink-0 ${
                      message.trim().length > 0
                        ? 'bg-foreground hover:bg-foreground/90 focus-visible:ring-primary text-background'
                        : isRecording 
                          ? 'bg-red-500 hover:bg-red-600 focus-visible:ring-red-300 text-background' 
                          : 'bg-foreground hover:bg-foreground/90 focus-visible:ring-primary text-background'
                    }`} 
                    onClick={message.trim().length > 0 ? handleStartChat : (isRecording ? stopRecording : startRecording)} 
                    aria-label={message.trim().length > 0 ? "Send message" : (isRecording ? "Stop recording" : "Start voice recording")} 
                    aria-pressed={isRecording}
                  >
                    {message.trim().length > 0 ? (
                      <SendHorizontalIcon className="h-3 w-3" />
                    ) : (
                      isRecording ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />
                    )}
                  </Button>
                  
                  
                </div>
              </div>}
          </div>
        </div>
      </div>

      {/* Suggestion buttons - horizontal scroll on mobile */}
      {!showSuggestions && <div className="w-full max-w-3xl mb-4 sm:mb-6">
          {/* Mobile: Horizontal scroll like models */}
          <div className="sm:hidden">
            <div className="flex gap-2 overflow-x-auto pb-2 px-1 scrollbar-hide" role="group" aria-label="Quick suggestions">
              {suggestionButtons.map((suggestion, index) => <Button key={index} onClick={() => handleSuggestionClick(suggestion.action)} variant="ghost" size="sm" className="h-9 px-4 rounded-full border border-border/30 hover:border-border/60 hover:bg-accent/50 transition-all focus-visible:ring-2 focus-visible:ring-primary flex-shrink-0 whitespace-nowrap" aria-label={`${suggestion.label} suggestion`}>
                  <suggestion.icon className="h-3.5 w-3.5 mr-1.5" />
                  <span className="text-sm font-medium">{suggestion.label}</span>
                </Button>)}
              
              {/* Show "See More" button on mobile */}
              {!showMoreButtons && <Button onClick={() => handleSuggestionClick('see-more')} variant="ghost" size="sm" className="h-9 px-4 rounded-full border border-border/30 hover:border-border/60 hover:bg-accent/50 transition-all focus-visible:ring-2 focus-visible:ring-primary flex-shrink-0 whitespace-nowrap" aria-label="Show more suggestions" aria-expanded={showMoreButtons}>
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  <span className="text-sm font-medium">See More</span>
                </Button>}
              
              {/* Additional buttons when "See More" is clicked - mobile */}
              {showMoreButtons && additionalButtons.map((button, index) => <Button key={`mobile-${index}`} onClick={() => handleSuggestionClick(button.action)} variant="ghost" size="sm" className="h-9 px-4 rounded-full border border-border/30 hover:border-border/60 hover:bg-accent/50 transition-all focus-visible:ring-2 focus-visible:ring-primary flex-shrink-0 whitespace-nowrap" aria-label={`${button.label} suggestion`}>
                    <button.icon className="h-3.5 w-3.5 mr-1.5" />
                    <span className="text-sm font-medium">{button.label}</span>
                  </Button>)}
            </div>
          </div>

          {/* Desktop: Wrapped layout */}
          <div className="hidden sm:block">
            <div className="flex flex-wrap gap-2 justify-center">
              {suggestionButtons.map((suggestion, index) => <Button key={index} onClick={() => handleSuggestionClick(suggestion.action)} variant="ghost" size="sm" className="h-9 px-4 rounded-full border border-border/30 hover:border-border/60 hover:bg-accent/50 transition-all focus-visible:ring-2 focus-visible:ring-primary" aria-label={`${suggestion.label} suggestion`}>
                  <suggestion.icon className="h-3.5 w-3.5 mr-1.5" />
                  <span className="text-sm font-medium">{suggestion.label}</span>
                </Button>)}
              
              {/* Show "See More" button only when additional buttons are not shown */}
              {!showMoreButtons && <Button onClick={() => handleSuggestionClick('see-more')} variant="ghost" size="sm" className="h-9 px-4 rounded-full border border-border/30 hover:border-border/60 hover:bg-accent/50 transition-all focus-visible:ring-2 focus-visible:ring-primary" aria-label="Show more suggestions" aria-expanded={showMoreButtons}>
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  <span className="text-sm font-medium">See More</span>
                </Button>}
            </div>
            
            {/* Additional buttons when "See More" is clicked - desktop */}
            {showMoreButtons && <div className="flex flex-wrap gap-2 justify-center mt-2" role="group" aria-label="Additional suggestions">
                {additionalButtons.map((button, index) => <Button key={index} onClick={() => handleSuggestionClick(button.action)} variant="ghost" size="sm" className="h-9 px-4 rounded-full border border-border/30 hover:border-border/60 hover:bg-accent/50 transition-all focus-visible:ring-2 focus-visible:ring-primary" aria-label={`${button.label} suggestion`}>
                    <button.icon className="h-3.5 w-3.5 mr-1.5" />
                    <span className="text-sm font-medium">{button.label}</span>
                  </Button>)}
              </div>}
          </div>
        </div>}

      {/* Suggestion prompts */}
      {showSuggestions && suggestionPrompts[showSuggestions as keyof typeof suggestionPrompts] && <div className="w-full max-w-3xl mb-4 sm:mb-6">
          <div className="space-y-4" role="list" aria-label="Suggested prompts">
            {suggestionPrompts[showSuggestions as keyof typeof suggestionPrompts].map((prompt, index) => <div key={index} role="listitem">
                <button onClick={() => handlePromptClick(prompt)} className="w-full text-left p-3 rounded-lg hover:bg-accent/50 transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:bg-accent/50 min-h-[44px] flex items-center" aria-label={`Use prompt: ${prompt}`}>
                  <span className="text-sm sm:text-base text-muted-foreground hover:text-foreground transition-colors">{prompt}</span>
                </button>
                {index < suggestionPrompts[showSuggestions as keyof typeof suggestionPrompts].length - 1 && <hr className="mt-4 border-border/50" />}
              </div>)}
          </div>
        </div>}

      {/* Available Models Section - only show when no suggestions are active */}
      {!showSuggestions}

      

      

      <input ref={fileInputRef} type="file" multiple className="sr-only" accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.csv,.json,.xml,.py,.js,.html,.css,.md" aria-label="File upload input" onChange={e => {
        const files = Array.from(e.target.files || []);
        setSelectedFiles(prev => [...prev, ...files]);
        if (files.length > 0) {
          toast.success(`${files.length} file(s) added successfully`);
        }
      }} />
      
      <AuthModal isOpen={showAuthModal} onClose={() => {
        setShowAuthModal(false);
        setPendingMessage('');
        localStorage.removeItem('pendingChatMessage');
      }} onSuccess={async () => {
        setShowAuthModal(false);
        if (pendingMessage.trim()) {
          const messageToSend = pendingMessage;
          setMessage(pendingMessage);
          setPendingMessage('');
          setTimeout(async () => {
            const {
              data: {
                session: currentSession
              }
            } = await supabase.auth.getSession();
            const currentUser = currentSession?.user;
            if (!currentUser) {
              console.error('No user found after auth, retrying...');
              setTimeout(async () => {
                const {
                  data: {
                    session: retrySession
                  }
                } = await supabase.auth.getSession();
                if (retrySession?.user) {
                  await createChatWithMessage(retrySession.user.id, messageToSend);
                } else {
                  console.error('Still no user found after retry');
                }
              }, 500);
              return;
            }
            await createChatWithMessage(currentUser.id, messageToSend);
          }, 300);
        } else {
          setTimeout(() => {
            textareaRef.current?.focus();
          }, 100);
        }
      }} />
      </div>
    </div>;
}