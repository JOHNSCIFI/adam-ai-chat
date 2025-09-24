import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useMessageLimit } from '@/hooks/useMessageLimit';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Paperclip, Mic, MicOff, ImageIcon, Globe, Edit3, BookOpen, Search, FileText, Plus, ChevronLeft, ChevronRight, X, Palette } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import AuthModal from '@/components/AuthModal';
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
}, {
  icon: Plus,
  label: 'See More',
  action: 'see-more'
}];
const availableModels = [{
  id: 'gpt-4o-mini',
  name: 'OpenAI GPT-4o mini',
  description: 'GPT-4o mini, developed by OpenAI, stands as o...',
  icon: '🔄',
  selected: true
}, {
  id: 'gpt-4o',
  name: 'OpenAI GPT-4o',
  description: 'GPT-4o, OpenAI\'s newest flagship model, is...',
  icon: '🔄'
}, {
  id: 'gpt-5',
  name: 'OpenAI GPT-5',
  description: 'OpenAI\'s GPT-5 sets a new standard in...',
  icon: '🔄'
}, {
  id: 'google-gemini',
  name: 'Google Gemini',
  description: 'Gemini, Google\'s most advanced AI, is designe...',
  icon: '💎'
}];
export default function Index() {
  const {
    user,
    loading: authLoading
  } = useAuth();
  const {
    actualTheme
  } = useTheme();
  const {
    canSendMessage,
    isAtLimit,
    sessionId,
    incrementMessageCount
  } = useMessageLimit();
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
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modelsContainerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
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
    const suggestions = {
      'help-write': 'Help me write ',
      'learn-about': 'Tell me about ',
      'analyze-image': 'Analyze this image: ',
      'summarize-text': 'Summarize this text: ',
      'see-more': ''
    };
    if (action !== 'see-more') {
      setMessage(suggestions[action as keyof typeof suggestions]);
      textareaRef.current?.focus();
    }
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
  return <div className="flex-1 flex flex-col items-center justify-center p-6 min-h-screen max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Welcome to AI Chat</h1>
        <p className="text-muted-foreground text-lg">Start a conversation with AI or explore our tools</p>
      </div>

      <div className="w-full max-w-3xl mb-6">
        <div className="relative bg-background border border-border rounded-2xl p-4">

          <Textarea ref={textareaRef} value={message} onChange={handleInputChange} onKeyDown={e => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleStartChat();
          }
        }} placeholder={isImageMode ? "Describe an image..." : "Type a message..."} className="w-full min-h-[24px] border-0 resize-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 outline-none px-0 py-0 mb-3" rows={1} />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full border border-border/50 text-muted-foreground" onClick={handleFileUpload}>
                <Paperclip className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              {isImageMode ? (
                <>
                  {/* Image mode indicator */}
                  <div className="group flex items-center gap-1 bg-muted px-2 py-1 rounded-md text-xs">
                    <ImageIcon className="h-3 w-3" />
                    <span>Image</span>
                    <button onClick={handleExitImageMode} className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  
                  {/* Styles dropdown */}
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
                    <PopoverContent className="w-80 p-4 bg-background border shadow-lg" align="end">
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
                </>
              ) : (
                <Button variant="ghost" size="sm" className="h-8 px-3 rounded-full border border-border/50 text-muted-foreground" onClick={handleCreateImageClick}>
                  <ImageIcon className="h-4 w-4 mr-1" />Create an image
                </Button>
              )}
              
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="w-[200px] h-8 bg-transparent border border-border/50 rounded-full">
                  <SelectValue>
                    <span className="text-sm font-medium">{selectedModelData?.name}</span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
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
            </div>
          </div>
        </div>
      </div>

      

      

      <input ref={fileInputRef} type="file" multiple className="hidden" accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.csv,.json,.xml,.py,.js,.html,.css,.md" />
      
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
    </div>;
}