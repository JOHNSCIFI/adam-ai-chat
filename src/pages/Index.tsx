import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useMessageLimit } from '@/hooks/useMessageLimit';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Paperclip, Mic, MicOff, ImageIcon, Globe, Edit3, BookOpen, Search, FileText, Plus, ChevronLeft, ChevronRight, X, Palette, Radio, Square, Volume2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { v4 as uuidv4 } from 'uuid';
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
  
  // Voice mode states
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVoiceModeActive, setIsVoiceModeActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modelsContainerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  
  // Voice mode refs
  const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isCancelledRef = useRef(false);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    if (user && !pendingMessage) {
      const storedMessage = localStorage.getItem('pendingChatMessage');
      if (storedMessage) {
        localStorage.removeItem('pendingChatMessage');
        createChatWithMessage(user.id, storedMessage);
      }
    }
  }, [user]);

  // Cleanup on unmount only (remove dependency to prevent interference)
  React.useEffect(() => {
    return () => {
      // Only cleanup when component actually unmounts, not on state changes
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []); // Empty dependency array - only run on mount/unmount

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

  // Voice mode functions
  const startVoiceMode = async () => {
    console.log('🎤 Starting voice mode...');
    
    // Check authentication first
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    
    // Reset cancellation flag
    isCancelledRef.current = false;
    
    try {
      // Check if browser supports Web Speech API
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        console.error('❌ Speech recognition not supported in this browser');
        return;
      }

      // Check for HTTPS requirement
      const isSecureContext = window.isSecureContext || location.protocol === 'https:' || location.hostname === 'localhost';
      if (!isSecureContext) {
        console.error('❌ Speech recognition requires HTTPS');
        return;
      }

      console.log('✅ Speech recognition supported, creating instance...');
      const recognition = new SpeechRecognition();
      
      // Configure recognition
      recognition.continuous = false; // Process one phrase at a time
      recognition.interimResults = false; // Only final results
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;
      
      recognitionRef.current = recognition;
      
      // Set up event handlers
      recognition.onstart = () => {
        console.log('🎤 Speech recognition started');
        setIsListening(true);
      };
      
      recognition.onresult = async (event: any) => {
        const result = event.results[0];
        if (result.isFinal) {
          const transcript = result[0].transcript.trim();
          console.log('📝 Speech recognized:', transcript);
          
          // Check if cancelled before processing
          if (isCancelledRef.current) {
            console.log('🛑 Voice mode cancelled - ignoring transcript');
            return;
          }
          
          if (transcript) {
            setIsListening(false);
            setIsProcessing(true);
            await processUserSpeech(transcript);
          }
        }
      };
      
      recognition.onerror = (event: any) => {
        console.error('❌ Speech recognition error:', event.error);
        setIsListening(false);
        
        // Restart on certain errors
        if (event.error === 'no-speech') {
          setTimeout(() => {
            if (isVoiceModeActive && !isProcessing && !isPlaying) {
              try {
                recognition.start();
              } catch (restartError) {
                console.error('❌ Error restarting recognition:', restartError);
              }
            }
          }, 1000);
        }
      };
      
      recognition.onend = () => {
        console.log('🛑 Speech recognition ended');
        setIsListening(false);
      };
      
      setIsVoiceModeActive(true);
      recognition.start();
      
    } catch (error) {
      console.error('❌ Error starting voice mode:', error);
      setIsVoiceModeActive(false);
    }
  };

  const stopVoiceMode = () => {
    console.log('🛑 Stopping voice mode...');
    
    // Set cancellation flag
    isCancelledRef.current = true;
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    
    // Stop any ongoing speech synthesis
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    
    // Stop current audio if playing
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    
    setIsVoiceModeActive(false);
    setIsListening(false);
    setIsProcessing(false);
    setIsPlaying(false);
  };

  const speakText = async (text: string) => {
    console.log('🔊 Speaking text with OpenAI TTS:', text.substring(0, 50) + '...');
    
    // Check if cancelled before starting
    if (isCancelledRef.current) {
      console.log('🛑 Voice mode cancelled - not speaking');
      return;
    }
    
    setIsPlaying(true);
    
    try {
      console.log('🤖 Calling OpenAI TTS...');
      const { data: ttsResponse, error: ttsError } = await supabase.functions.invoke('text-to-speech', {
        body: {
          text: text,
          voice: 'alloy'
        }
      });

      console.log('🎵 TTS Response:', { 
        hasData: !!ttsResponse, 
        hasAudio: !!ttsResponse?.audioContent,
        error: ttsError,
        audioLength: ttsResponse?.audioContent?.length 
      });

      // Check if cancelled after TTS call
      if (isCancelledRef.current) {
        console.log('🛑 Voice mode cancelled - not playing audio');
        setIsPlaying(false);
        return;
      }

      if (ttsError || !ttsResponse?.audioContent) {
        console.error('❌ TTS error, falling back to browser TTS:', ttsError);
        fallbackToBrowserTTS(text);
        return;
      }

      // Create audio with proper format
      const audioFormat = ttsResponse.format || 'wav';
      const audioData = `data:audio/${audioFormat};base64,${ttsResponse.audioContent}`;
      const audio = new Audio(audioData);
      currentAudioRef.current = audio;
      
      console.log('🎵 Audio created with format:', audioFormat, 'Size:', ttsResponse.size);
      
      // Set up audio event handlers
      audio.onloadstart = () => console.log('🎵 Audio loading started');
      audio.oncanplay = () => console.log('🎵 Audio can play');
      audio.onloadeddata = () => console.log('🎵 Audio data loaded');
      
      audio.onended = () => {
        console.log('✅ OpenAI TTS playbook finished');
        currentAudioRef.current = null;
        
        // Check if cancelled before resuming
        if (isCancelledRef.current) {
          console.log('🛑 Voice mode cancelled - not resuming listening');
          setIsPlaying(false);
          return;
        }
        
        setIsPlaying(false);
        
        // Simply set voice mode back to active and start listening
        setTimeout(() => {
          if (!isProcessing && !isCancelledRef.current) {
            startVoiceMode();
          }
        }, 500);
      };
      
      audio.onerror = (error) => {
        console.error('❌ Audio playback error:', error);
        currentAudioRef.current = null;
        setIsPlaying(false);
        
        if (!isCancelledRef.current) {
          fallbackToBrowserTTS(text);
        }
      };
      
      // Play the audio
      try {
        console.log('🎵 Starting audio playback...');
        await audio.play();
      } catch (playError) {
        console.error('❌ Audio play failed:', playError);
        currentAudioRef.current = null;
        setIsPlaying(false);
        
        if (!isCancelledRef.current) {
          fallbackToBrowserTTS(text);
        }
      }
      
    } catch (error) {
      console.error('❌ TTS function call error:', error);
      setIsPlaying(false);
      
      if (!isCancelledRef.current) {
        fallbackToBrowserTTS(text);
      }
    }
  };

  const fallbackToBrowserTTS = (text: string) => {
    console.log('🔊 Using browser TTS as fallback');
    
    // Check if cancelled before starting
    if (isCancelledRef.current) {
      console.log('🛑 Voice mode cancelled - not using browser TTS');
      return;
    }
    
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      synthesisRef.current = utterance;
      
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.name.includes('Samantha') || 
        voice.name.includes('Alex') || 
        voice.name.includes('Karen') ||
        voice.lang.startsWith('en')
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      utterance.onend = () => {
        console.log('✅ Browser TTS finished');
        synthesisRef.current = null;
        
        // Check if cancelled before resuming
        if (isCancelledRef.current) {
          console.log('🛑 Voice mode cancelled - not resuming listening');
          setIsPlaying(false);
          return;
        }
        
        setIsPlaying(false);
        
        // Simply set voice mode back to active and start listening
        setTimeout(() => {
          if (!isProcessing && !isCancelledRef.current) {
            startVoiceMode();
          }
        }, 500);
      };
      
      utterance.onerror = (error) => {
        console.error('❌ Browser TTS error:', error);
        synthesisRef.current = null;
        setIsPlaying(false);
      };
      
      window.speechSynthesis.speak(utterance);
    } else {
      console.error('❌ No TTS available');
      setIsPlaying(false);
    }
  };

  const processUserSpeech = async (transcript: string) => {
    console.log('🎤 Processing user speech:', transcript);
    
    try {
      // Check if cancelled before processing
      if (isCancelledRef.current) {
        console.log('🛑 Voice mode cancelled - stopping user speech processing');
        return;
      }

      // For index page, just set the message and handle start chat
      setMessage(transcript);
      
      // Simulate message sent handling
      await handleStartChat();
      
    } catch (error) {
      console.error('❌ Error in processUserSpeech:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Main voice mode toggle function
  const handleVoiceModeToggle = () => {
    if (isVoiceModeActive) {
      stopVoiceMode();
    } else {
      startVoiceMode();
    }
  };

  // Helper functions for voice button styling
  const getVoiceButtonIcon = () => {
    if (isPlaying) {
      return <Volume2 className="h-4 w-4" />;
    } else if (isProcessing) {
      return <Square className="h-4 w-4 animate-pulse" />;
    } else if (isListening || isVoiceModeActive) {
      return <Radio className="h-4 w-4 animate-pulse" />;
    }
    return <Radio className="h-4 w-4" />;
  };

   const getVoiceButtonVariant = () => {
    if (isPlaying) {
      return actualTheme === 'dark' ? 'secondary' : 'outline';
    } else if (isProcessing) {
      return 'secondary';
    } else if (isListening || isVoiceModeActive) {
      return 'default';
    }
    return 'outline';
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
                </>
              ) : (
                <Button variant="ghost" size="sm" className="h-8 px-3 rounded-full border border-border/50 text-muted-foreground" onClick={handleCreateImageClick}>
                  <ImageIcon className="h-4 w-4 mr-1" />Create an image
                </Button>
              )}
            </div>
            
            <div className="flex items-center gap-2">
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
              
              {/* Voice Mode Button */}
              <Button
                variant={getVoiceButtonVariant()}
                size="sm"
                onClick={handleVoiceModeToggle}
                disabled={isProcessing}
                className={`
                  relative h-8 w-8 rounded-full overflow-hidden transition-all duration-300 ease-in-out transform-gpu border border-border/50
                  ${isListening 
                    ? 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30 scale-110 ring-4 ring-red-500/20 animate-pulse' 
                    : isVoiceModeActive
                      ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/30 scale-105 ring-2 ring-primary/30'
                      : 'hover:scale-105 bg-background border-2 border-border hover:bg-accent hover:text-accent-foreground'
                  }
                  ${isProcessing 
                    ? 'bg-gradient-to-br from-yellow-500 to-yellow-600 text-white animate-spin' 
                    : ''
                  }
                  ${isPlaying 
                    ? 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg shadow-green-500/30 scale-105' 
                    : ''
                  }
                  focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
                  before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-br before:from-white/20 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300
                `}
                title={
                  isPlaying 
                    ? 'AI is speaking... Click to stop' 
                    : isProcessing 
                      ? 'Processing your speech...' 
                      : isListening 
                        ? 'Listening... Speak now!'
                        : isVoiceModeActive 
                          ? 'Voice mode active - Click to stop' 
                          : 'Start voice conversation'
                }
              >
                <div className="relative z-10 flex items-center justify-center">
                  {getVoiceButtonIcon()}
                  
                  {/* Listening animation */}
                  {isListening && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-white/30 rounded-full animate-ping"></div>
                      <div className="absolute w-4 h-4 border-2 border-white/50 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
                    </div>
                  )}
                  
                  {/* Speaking animation */}
                  {isPlaying && (
                    <div className="absolute -inset-1 flex items-center justify-center">
                      <div className="w-8 h-8 border border-green-300/50 rounded-full animate-pulse"></div>
                      <div className="absolute w-10 h-10 border border-green-300/30 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                    </div>
                  )}
                  
                  {/* Processing animation */}
                  {isProcessing && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                    </div>
                  )}
                </div>
                
                {/* Glowing effect when active */}
                {isVoiceModeActive && !isListening && !isPlaying && !isProcessing && (
                  <div className="absolute inset-0 bg-primary/10 animate-pulse rounded-full"></div>
                )}
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