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
import { Paperclip, Mic, MicOff, ImageIcon, Globe, Edit3, BookOpen, Search, FileText, Plus, ChevronLeft, ChevronRight, X, Palette, BarChart3, Lightbulb, Settings, Zap, Menu } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import AuthModal from '@/components/AuthModal';
import VoiceModeButton from '@/components/VoiceModeButton';
import GoogleOneTab from '@/components/GoogleOneTab';
import { toast } from 'sonner';
import chatgptLogo from '@/assets/chatgpt-logo.png';
import chatgptLogoLight from '@/assets/chatgpt-logo-light.png';
import geminiLogo from '@/assets/gemini-logo.png';
import claudeLogo from '@/assets/claude-logo.png';
import deepseekLogo from '@/assets/deepseek-logo.png';
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
  type: 'pro'
}];
const suggestionButtons = [{
  icon: Edit3,
  label: 'Help me write',
  action: 'help-write'
}, {
  icon: BookOpen,
  label: 'Learn about',
  action: 'learn-about'
}, {
  icon: Search,
  label: 'Analyze Image',
  action: 'analyze-image'
}, {
  icon: FileText,
  label: 'Summarize text',
  action: 'summarize-text'
}];

const additionalButtons = [{
  icon: Lightbulb,
  label: 'Brainstorm',
  action: 'brainstorm'
}, {
  icon: Settings,
  label: 'Improve Writing',
  action: 'improve-writing'
}, {
  icon: Globe,
  label: 'Translate',
  action: 'translate'
}, {
  icon: Zap,
  label: 'Generate Ideas',
  action: 'generate-ideas'
}, {
  icon: BarChart3,
  label: 'Analyze Data',
  action: 'analyze-data'
}];

const suggestionPrompts = {
  'help-write': [
    'Help me write an essay',
    'Help me write a cover letter',
    'Help me write a bedtime story',
    'Help me write a poem'
  ],
  'learn-about': [
    'Learn about time management',
    'Learn about stock trading',
    'Learn about negotiation skills for business deals',
    'Learn about handling difficult conversations'
  ],
  'analyze-image': [
    'Help me understand where this picture was taken',
    'Help me identify the plant in this image',
    'Help me understand the calories in the foods in this image',
    'Help me find the color codes used in this image'
  ],
  'summarize-text': [
    'Summarize text in a few sentences',
    'Summarize text by highlighting the key points',
    'Summarize text and provide the main takeaway',
    'Summarize text by condensing the most important information'
  ],
  'analyze-data': [
    'Help me find patterns in my data',
    'Help me understand trends in my data',
    'Help me summarize key insights from my data',
    'Help me create a bar chart'
  ],
  'brainstorm': [
    'Brainstorm ideas for a new product or service',
    'Brainstorm fun team-building activities',
    'Brainstorm ways to improve your productivity',
    'Brainstorm unique gift ideas for a loved one'
  ],
  'improve-writing': [
    'Improve writing by making it clearer and more concise',
    'Improve writing by adding more engaging details',
    'Improve writing to enhance the flow and readability',
    'Improve writing by simplifying complex sentences'
  ],
  'translate': [
    'Translate text by maintaining the length',
    'Translate text in a natural and local way',
    'Translate text while keeping the original meaning intact',
    'Translate text into multiple languages'
  ],
  'generate-ideas': [
    'Generate ideas for an innovative business model',
    'Generate ideas for a creative marketing campaign',
    'Generate ideas for a podcast episode',
    'Generate ideas for a unique bucket list'
  ]
};
const availableModels = [{
  id: 'gpt-4o-mini',
  name: 'OpenAI GPT-4o mini',
  description: 'GPT-4o mini, developed by OpenAI, stands as one of the most efficient AI models available.',
  icon: 'openai'
}, {
  id: 'gpt-4o',
  name: 'OpenAI GPT-4o',
  description: 'GPT-4o, OpenAI\'s newest flagship model, is designed for complex reasoning tasks.',
  icon: 'openai'
}, {
  id: 'gpt-5',
  name: 'OpenAI GPT-5',
  description: 'OpenAI\'s GPT-5 sets a new standard in artificial intelligence capabilities.',
  icon: 'openai'
}, {
  id: 'claude',
  name: 'Claude',
  description: 'Claude, Anthropic\'s advanced AI model, excels at detailed analysis and reasoning.',
  icon: 'claude'
}, {
  id: 'deepseek',
  name: 'DeepSeek',
  description: 'DeepSeek offers powerful AI capabilities for a wide range of applications.',
  icon: 'deepseek'
}, {
  id: 'gemini',
  name: 'Google Gemini',
  description: 'Gemini, Google\'s most advanced AI, is designed for multimodal understanding.',
  icon: 'gemini'
}];
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
      case 'gemini':
        return geminiLogo;
      case 'claude':
        return claudeLogo;
      case 'deepseek':
        return deepseekLogo;
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
  const [modelsScrollPosition, setModelsScrollPosition] = useState(0);
  const [isImageMode, setIsImageMode] = useState(false);
  const [isStylesOpen, setIsStylesOpen] = useState(false);
  const [voiceChatId, setVoiceChatId] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState<string | null>(null);
  const [showMoreButtons, setShowMoreButtons] = useState(false);
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modelsContainerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const { isMobile } = useSidebar();
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
  const handleCreateImage = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    const toolId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    navigate(`/generate-image-openai/${toolId}`);
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
      const {
        data: chatData,
        error: chatError
      } = await supabase.from('chats').insert([{
        user_id: user.id,
        title: message.slice(0, 50) || 'New Chat'
      }]).select().single();
      if (chatError) throw chatError;
      const {
        error: messageError
      } = await supabase.from('messages').insert({
        chat_id: chatData.id,
        content: message,
        role: 'user'
      });
      if (messageError) throw messageError;
      navigate(`/chat/${chatData.id}`);
    } catch (error) {
      console.error('Error starting chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceMessageSent = async (messageId: string, content: string, role: 'user' | 'assistant') => {
    console.log('Voice message sent:', { messageId, content, role });
    
    // Change model to Google Gemini when voice mode is used
    setSelectedModel('gemini');
    
    if (role === 'user') {
      // For user voice messages, create chat if needed and navigate
      if (!user) return;
      
      if (!voiceChatId) {
        // Create new chat with voice message
        try {
          const { data: chatData, error: chatError } = await supabase
            .from('chats')
            .insert({
              user_id: user.id,
              title: content.length > 50 ? content.substring(0, 47) + '...' : content
            })
            .select()
            .single();

          if (chatError) {
            console.error('Error creating voice chat:', chatError);
            return;
          }

          setVoiceChatId(chatData.id);
          // Navigate to the new chat
          navigate(`/chat/${chatData.id}`);
        } catch (error) {
          console.error('Error creating voice chat:', error);
        }
      } else {
        // Navigate to existing voice chat
        navigate(`/chat/${voiceChatId}`);
      }
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

  const handleSeeAllModels = () => {
    navigate('/explore-tools');
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

  const handleCreateImageClick = () => {
    setIsImageMode(true);
    setMessage('');
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
      {isMobile && (
        <div className="flex items-center justify-between p-3 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
          <SidebarTrigger 
            className="h-9 w-9 hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Open sidebar menu"
          />
          
          {/* Mobile Model Selector triggered by AdamGPT */}
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger 
              className="flex-1 bg-transparent border-0 hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-primary rounded-lg transition-all duration-200 h-auto p-2 [&>svg]:hidden"
              aria-label="Select AI model"
            >
              <div className="flex items-center justify-center gap-1">
                <h1 className="text-lg font-semibold">AdamGPT</h1>
                <span className="text-muted-foreground text-sm">﹀</span>
              </div>
            </SelectTrigger>
            <SelectContent className="z-50 bg-background/95 backdrop-blur-xl border border-border/80 shadow-2xl rounded-2xl p-2 min-w-[300px]" align="center">
              {models.map(model => {
                const modelData = availableModels.find(m => m.id === model.id);
                return (
                  <SelectItem 
                    key={model.id} 
                    value={model.id} 
                    className="rounded-xl px-3 py-3 hover:bg-accent/60 focus-visible:bg-accent/60 transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-primary/10 to-primary/20 backdrop-blur-sm rounded-xl flex items-center justify-center p-1.5 flex-shrink-0">
                          <img 
                            src={getModelIcon(modelData?.icon || 'openai')} 
                            alt={`${model.name} icon`} 
                            className="w-5 h-5 object-contain" 
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm text-foreground">{model.name}</div>
                          <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{model.description}</div>
                        </div>
                      </div>
                      {model.type === 'pro' && (
                        <span className="text-xs bg-gradient-to-r from-blue-500 to-purple-500 text-white px-2 py-1 rounded-full font-medium ml-2">
                          Pro
                        </span>
                      )}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          
          <div className="w-9"></div>
        </div>
      )}
      
      <div className="flex-1 flex flex-col items-center justify-center p-3 sm:p-6 max-w-4xl mx-auto w-full">
        {/* Google One Tap for unauthenticated users */}
        <GoogleOneTab />
      
      <div className="text-center mb-6 sm:mb-8">
        {user ? (
          <>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">{timeGreeting}, {displayName}</h1>
            <p className="text-muted-foreground text-base sm:text-lg">How can I help you today?</p>
          </>
        ) : (
          <>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">{timeGreeting}</h1>
            <p className="text-muted-foreground text-base sm:text-lg">How can I help you today?</p>
          </>
        )}
      </div>

      <div className="w-full max-w-3xl mb-4 sm:mb-6">
        <div className="relative bg-background border border-border rounded-xl sm:rounded-2xl p-3 sm:p-4">
          <Textarea 
            ref={textareaRef} 
            value={message} 
            onChange={handleInputChange} 
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleStartChat();
              }
            }}
            onFocus={e => {
              // Prevent default scroll behavior on mobile
              if (window.innerWidth < 768) {
                e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }}
            placeholder={isImageMode ? "Describe an image..." : "Type a message..."} 
            className="w-full min-h-[24px] border-0 resize-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 outline-none px-0 py-0 mb-3 text-sm sm:text-base" 
            rows={1}
            aria-label={isImageMode ? "Describe an image" : "Type your message"}
          />
          
          {/* Mobile-first redesigned input controls */}
          <div className="flex flex-col gap-3">
            {/* File upload controls row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {!isMobile && (
                  <>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-9 w-9 rounded-full border border-border/50 text-muted-foreground hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary flex-shrink-0" 
                      onClick={handleFileUpload}
                      aria-label="Upload file"
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    
                    {isImageMode && !selectedStyle ? (
                      <div className="flex items-center gap-2">
                        {/* Image mode indicator */}
                        <div className="group flex items-center gap-1 bg-muted px-3 py-2 rounded-full text-xs">
                          <ImageIcon className="h-3 w-3" />
                          <span>Image</span>
                          <button 
                            onClick={handleExitImageMode} 
                            className="opacity-70 group-hover:opacity-100 transition-opacity ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-primary"
                            aria-label="Exit image mode"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                        
                        {/* Styles dropdown */}
                        <Popover open={isStylesOpen} onOpenChange={setIsStylesOpen}>
                          <PopoverTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-9 px-3 text-xs gap-1 bg-muted hover:bg-muted/80 rounded-full border border-border/50 focus-visible:ring-2 focus-visible:ring-primary"
                              aria-label="Select image style"
                              aria-expanded={isStylesOpen}
                              aria-haspopup="true"
                            >
                              <Palette className="h-3 w-3" />
                              <span>Styles</span>
                              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-72 sm:w-80 p-3 sm:p-4 bg-background border shadow-lg z-50" align="start">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                              {imageStyles.map(style => 
                                <button 
                                  key={style.name} 
                                  onClick={() => handleStyleSelect(style)} 
                                  className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors text-center focus-visible:ring-2 focus-visible:ring-primary focus-visible:bg-muted"
                                  aria-label={`Select ${style.name} style`}
                                >
                                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center ${getStyleBackground(style.name)}`}>
                                    <span className={`text-xs font-medium ${style.name === 'Coloring Book' ? 'text-black' : 'text-foreground'}`}>
                                      {style.name.split(' ').map(word => word[0]).join('').slice(0, 2)}
                                    </span>
                                  </div>
                                  <span className="text-xs font-medium leading-tight">{style.name}</span>
                                </button>
                              )}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    ) : (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-9 px-3 rounded-full border border-border/50 text-muted-foreground hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary text-xs" 
                        onClick={handleCreateImageClick}
                        aria-label="Create an image"
                      >
                        <ImageIcon className="h-4 w-4 mr-2" />
                        <span>Create image</span>
                      </Button>
                    )}
                  </>
                )}
              </div>

              {/* Desktop model selector and voice controls */}
              {!isMobile && (
                <div className="flex items-center gap-2">
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger 
                      className="w-[200px] h-10 bg-background/80 backdrop-blur-sm border border-border/50 rounded-xl focus-visible:ring-2 focus-visible:ring-primary text-sm shadow-sm hover:bg-accent/50 transition-all duration-200"
                      aria-label="Select AI model"
                    >
                      <SelectValue>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-gradient-to-br from-primary/10 to-primary/20 rounded-lg flex items-center justify-center">
                            <img 
                              src={getModelIcon(availableModels.find(m => m.id === selectedModel)?.icon || 'openai')} 
                              alt={`${selectedModelData?.name} icon`} 
                              className="w-4 h-4 object-contain" 
                            />
                          </div>
                          <span className="font-medium truncate">{selectedModelData?.name}</span>
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="z-50 bg-background/95 backdrop-blur-xl border border-border/80 shadow-2xl rounded-2xl p-2 min-w-[320px]">
                      {models.map(model => {
                        const modelData = availableModels.find(m => m.id === model.id);
                        return (
                          <SelectItem 
                            key={model.id} 
                            value={model.id} 
                            className="rounded-xl px-3 py-3 hover:bg-accent/60 focus-visible:bg-accent/60 transition-all duration-200 cursor-pointer"
                          >
                            <div className="flex items-center gap-3 w-full">
                              <div className="w-8 h-8 bg-gradient-to-br from-primary/10 to-primary/20 backdrop-blur-sm rounded-xl flex items-center justify-center p-1.5">
                                <img 
                                  src={getModelIcon(modelData?.icon || 'openai')} 
                                  alt={`${model.name} icon`} 
                                  className="w-5 h-5 object-contain" 
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-sm">{model.name}</div>
                                <div className="text-xs text-muted-foreground mt-0.5">{model.description}</div>
                              </div>
                              {model.type === 'pro' && (
                                <span className="text-xs bg-gradient-to-r from-blue-500 to-purple-500 text-white px-2 py-1 rounded-full font-medium">
                                  Pro
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  
                  <Button 
                    size="sm" 
                    className={`h-9 w-9 rounded-full border border-border/50 focus-visible:ring-2 focus-visible:ring-offset-2 flex-shrink-0 ${
                      isRecording 
                        ? 'bg-red-500 hover:bg-red-600 focus-visible:ring-red-300' 
                        : 'bg-foreground hover:bg-foreground/90 focus-visible:ring-primary'
                    } text-background`} 
                    onClick={isRecording ? stopRecording : startRecording}
                    aria-label={isRecording ? "Stop recording" : "Start voice recording"}
                    aria-pressed={isRecording}
                  >
                    {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                  
                  <VoiceModeButton 
                    onMessageSent={handleVoiceMessageSent}
                    chatId={voiceChatId || 'temp'}
                    actualTheme={actualTheme}
                  />
                </div>
              )}
            </div>

            {/* Mobile controls - upload, dictation and voice mode buttons */}
            {isMobile && (
              <div className="flex justify-between items-center">
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
                  <PopoverContent className="w-52 p-2 bg-background/95 backdrop-blur-xl border border-border/80 shadow-2xl rounded-2xl z-50" align="start">
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-11 px-3 justify-start text-sm hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-primary rounded-xl transition-all duration-200"
                        onClick={handleFileUpload}
                      >
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500/10 to-blue-600/20 rounded-lg flex items-center justify-center mr-3">
                          <Paperclip className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium">Add File & Photo</div>
                          <div className="text-xs text-muted-foreground">Upload documents or images</div>
                        </div>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-11 px-3 justify-start text-sm hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-primary rounded-xl transition-all duration-200"
                        onClick={handleCreateImageClick}
                      >
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500/10 to-purple-600/20 rounded-lg flex items-center justify-center mr-3">
                          <ImageIcon className="h-4 w-4 text-purple-600" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium">Create Image</div>
                          <div className="text-xs text-muted-foreground">Generate AI artwork</div>
                        </div>
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
                
                <div className="flex items-center gap-2 bg-muted/30 rounded-full p-1">
                  <Button 
                    size="sm" 
                    className={`h-7 w-7 rounded-full focus-visible:ring-2 focus-visible:ring-offset-1 flex-shrink-0 ${
                      isRecording 
                        ? 'bg-red-500 hover:bg-red-600 focus-visible:ring-red-300' 
                        : 'bg-foreground hover:bg-foreground/90 focus-visible:ring-primary'
                    } text-background`} 
                    onClick={isRecording ? stopRecording : startRecording}
                    aria-label={isRecording ? "Stop recording" : "Start voice recording"}
                    aria-pressed={isRecording}
                  >
                    {isRecording ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
                  </Button>
                  
                  <VoiceModeButton 
                    onMessageSent={handleVoiceMessageSent}
                    chatId={voiceChatId || 'temp'}
                    actualTheme={actualTheme}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Suggestion buttons - horizontal scroll on mobile */}
      {!showSuggestions && (
        <div className="w-full max-w-3xl mb-4 sm:mb-6">
          {/* Mobile: Horizontal scroll like models */}
          <div className="sm:hidden">
            <div className="flex gap-2 overflow-x-auto pb-2 px-1 scrollbar-hide" role="group" aria-label="Quick suggestions">
              {suggestionButtons.map((suggestion, index) => (
                <Button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion.action)}
                  variant="ghost"
                  size="sm"
                  className="h-9 px-4 rounded-full border border-border/30 hover:border-border/60 hover:bg-accent/50 transition-all focus-visible:ring-2 focus-visible:ring-primary flex-shrink-0 whitespace-nowrap"
                  aria-label={`${suggestion.label} suggestion`}
                >
                  <suggestion.icon className="h-3.5 w-3.5 mr-1.5" />
                  <span className="text-sm font-medium">{suggestion.label}</span>
                </Button>
              ))}
              
              {/* Show "See More" button on mobile */}
              {!showMoreButtons && (
                <Button
                  onClick={() => handleSuggestionClick('see-more')}
                  variant="ghost"
                  size="sm"
                  className="h-9 px-4 rounded-full border border-border/30 hover:border-border/60 hover:bg-accent/50 transition-all focus-visible:ring-2 focus-visible:ring-primary flex-shrink-0 whitespace-nowrap"
                  aria-label="Show more suggestions"
                  aria-expanded={showMoreButtons}
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  <span className="text-sm font-medium">See More</span>
                </Button>
              )}
              
              {/* Additional buttons when "See More" is clicked - mobile */}
              {showMoreButtons && 
                additionalButtons.map((button, index) => (
                  <Button
                    key={`mobile-${index}`}
                    onClick={() => handleSuggestionClick(button.action)}
                    variant="ghost"
                    size="sm"
                    className="h-9 px-4 rounded-full border border-border/30 hover:border-border/60 hover:bg-accent/50 transition-all focus-visible:ring-2 focus-visible:ring-primary flex-shrink-0 whitespace-nowrap"
                    aria-label={`${button.label} suggestion`}
                  >
                    <button.icon className="h-3.5 w-3.5 mr-1.5" />
                    <span className="text-sm font-medium">{button.label}</span>
                  </Button>
                ))
              }
            </div>
          </div>

          {/* Desktop: Wrapped layout */}
          <div className="hidden sm:block">
            <div className="flex flex-wrap gap-2 justify-center">
              {suggestionButtons.map((suggestion, index) => (
                <Button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion.action)}
                  variant="ghost"
                  size="sm"
                  className="h-9 px-4 rounded-full border border-border/30 hover:border-border/60 hover:bg-accent/50 transition-all focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label={`${suggestion.label} suggestion`}
                >
                  <suggestion.icon className="h-3.5 w-3.5 mr-1.5" />
                  <span className="text-sm font-medium">{suggestion.label}</span>
                </Button>
              ))}
              
              {/* Show "See More" button only when additional buttons are not shown */}
              {!showMoreButtons && (
                <Button
                  onClick={() => handleSuggestionClick('see-more')}
                  variant="ghost"
                  size="sm"
                  className="h-9 px-4 rounded-full border border-border/30 hover:border-border/60 hover:bg-accent/50 transition-all focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label="Show more suggestions"
                  aria-expanded={showMoreButtons}
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  <span className="text-sm font-medium">See More</span>
                </Button>
              )}
            </div>
            
            {/* Additional buttons when "See More" is clicked - desktop */}
            {showMoreButtons && (
              <div className="flex flex-wrap gap-2 justify-center mt-2" role="group" aria-label="Additional suggestions">
                {additionalButtons.map((button, index) => (
                  <Button
                    key={index}
                    onClick={() => handleSuggestionClick(button.action)}
                    variant="ghost"
                    size="sm"
                    className="h-9 px-4 rounded-full border border-border/30 hover:border-border/60 hover:bg-accent/50 transition-all focus-visible:ring-2 focus-visible:ring-primary"
                    aria-label={`${button.label} suggestion`}
                  >
                    <button.icon className="h-3.5 w-3.5 mr-1.5" />
                    <span className="text-sm font-medium">{button.label}</span>
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Suggestion prompts */}
      {showSuggestions && suggestionPrompts[showSuggestions as keyof typeof suggestionPrompts] && (
        <div className="w-full max-w-3xl mb-4 sm:mb-6">
          <div className="space-y-4" role="list" aria-label="Suggested prompts">
            {suggestionPrompts[showSuggestions as keyof typeof suggestionPrompts].map((prompt, index) => (
              <div key={index} role="listitem">
                <button
                  onClick={() => handlePromptClick(prompt)}
                  className="w-full text-left p-3 rounded-lg hover:bg-accent/50 transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:bg-accent/50 min-h-[44px] flex items-center"
                  aria-label={`Use prompt: ${prompt}`}
                >
                  <span className="text-sm sm:text-base text-muted-foreground hover:text-foreground transition-colors">{prompt}</span>
                </button>
                {index < suggestionPrompts[showSuggestions as keyof typeof suggestionPrompts].length - 1 && (
                  <hr className="mt-4 border-border/50" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Models Section - only show when no suggestions are active */}
      {!showSuggestions && (
        <div className="w-full max-w-3xl mb-4 sm:mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" aria-hidden="true"></div>
              <h2 className="text-base sm:text-lg font-semibold">Available Models</h2>
            </div>
            <button 
              onClick={handleSeeAllModels}
              className="text-sm text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary rounded px-2 py-1"
              aria-label="View all available models"
            >
              See All
            </button>
          </div>
        <div className="relative" role="region" aria-label="Available AI models">
          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 scrollbar-hide" role="tablist">
            {availableModels.map((model) => (
              <button
                key={model.id}
                onClick={() => handleModelSelect(model.id)}
                className={`flex-shrink-0 w-56 sm:w-64 p-3 sm:p-4 rounded-xl border transition-all hover:shadow-md focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 text-left min-h-[120px] ${
                  selectedModel === model.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card hover:border-border/80'
                }`}
                role="tab"
                aria-selected={selectedModel === model.id}
                aria-label={`Select ${model.name} model`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center p-2">
                    <img 
                      src={getModelIcon(model.icon)} 
                      alt="" 
                      className="w-6 h-6 object-contain" 
                      aria-hidden="true"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm mb-1">{model.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {model.description}
                    </p>
                    {selectedModel === model.id && (
                      <div className="mt-2">
                        <span className="text-xs text-primary font-medium">Selected</span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
          {/* Navigation buttons - hidden on mobile, shown only when needed */}
          <button
            onClick={() => scrollModels('left')}
            className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-8 h-8 bg-background border border-border rounded-full items-center justify-center shadow-sm hover:shadow-md transition-shadow focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Scroll models left"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => scrollModels('right')}
            className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-8 h-8 bg-background border border-border rounded-full items-center justify-center shadow-sm hover:shadow-md transition-shadow focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Scroll models right"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        </div>
      )}

      

      

      <input 
        ref={fileInputRef} 
        type="file" 
        multiple 
        className="sr-only" 
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.csv,.json,.xml,.py,.js,.html,.css,.md"
        aria-label="File upload input"
      />
      
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => {
          setShowAuthModal(false);
          setPendingMessage('');
          localStorage.removeItem('pendingChatMessage');
        }} 
        onSuccess={async () => {
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
        }} 
      />
      </div>
    </div>;
}