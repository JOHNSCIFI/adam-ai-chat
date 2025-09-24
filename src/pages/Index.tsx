import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useMessageLimit } from '@/hooks/useMessageLimit';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Paperclip, Mic, MicOff, ImageIcon, Globe, Edit3, BookOpen, Search, FileText, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
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
      const newScroll = direction === 'left' 
        ? currentScroll - scrollAmount 
        : currentScroll + scrollAmount;
      
      modelsContainerRef.current.scrollTo({
        left: newScroll,
        behavior: 'smooth'
      });
    }
  };
  const selectedModelData = models.find(m => m.id === selectedModel);
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
        }} placeholder="Type a message..." className="w-full min-h-[24px] border-0 resize-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 outline-none px-0 py-0 mb-3" rows={1} />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full border border-border/50 text-muted-foreground" onClick={handleFileUpload}>
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 px-3 rounded-full border border-border/50 text-muted-foreground" onClick={handleCreateImage}>
                <ImageIcon className="h-4 w-4 mr-1" />Create an image
              </Button>
              
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
              
              <Button size="sm" className={`h-8 w-8 rounded-full border border-border/50 ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-foreground hover:bg-foreground/90'} text-background`} onClick={isRecording ? stopRecording : startRecording}>
                {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      

      <div className="w-full max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <h2 className="text-xl font-semibold">Available Models</h2>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-full border border-border/50"
              onClick={() => scrollModels('left')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-full border border-border/50"
              onClick={() => scrollModels('right')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="relative overflow-hidden">
          <div className="flex gap-4 overflow-x-auto scrollbar-hide" ref={modelsContainerRef} style={{ scrollBehavior: 'smooth' }}>
            {availableModels.map(model => (
              <div 
                key={model.id} 
                className={`flex-shrink-0 w-72 p-5 rounded-xl border cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${
                  model.selected 
                    ? 'border-primary/30 bg-primary/5 shadow-md' 
                    : 'border-border/60 bg-card hover:border-border hover:bg-accent/50'
                }`} 
                onClick={() => handleModelSelect(model.id)}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center border border-border/30">
                    <span className="text-lg">{model.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-sm truncate">{model.name}</h3>
                      {model.selected && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                      {model.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
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