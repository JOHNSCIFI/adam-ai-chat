import React, { useState, useRef, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useMessageLimit } from '@/hooks/useMessageLimit';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Paperclip, Mic, MicOff, ImageIcon, Search, ChevronLeft, ChevronRight, Bot, Brain, Sparkles, Zap } from 'lucide-react';
import AuthModal from '@/components/AuthModal';
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
  const [availableModelsIndex, setAvailableModelsIndex] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const availableModelsRef = useRef<HTMLDivElement>(null);

  // Available models data
  const aiModels = [
    { id: 'gpt-4o-mini', name: 'GPT-4o mini', icon: <Bot className="h-4 w-4" />, route: '/openai-gpt-4o' },
    { id: 'gpt-4o', name: 'GPT-4o', icon: <Bot className="h-4 w-4" />, route: '/openai-gpt-4o' },
    { id: 'gpt-5', name: 'GPT-5', icon: <Bot className="h-4 w-4" />, route: '/openai-gpt-4-1' },
    { id: 'claude', name: 'Claude', icon: <Brain className="h-4 w-4" />, route: '/deepseek' },
    { id: 'deepseek', name: 'DeepSeek', icon: <Brain className="h-4 w-4" />, route: '/deepseek' },
    { id: 'gemini', name: 'Google Gemini', icon: <Sparkles className="h-4 w-4" />, route: '/google-gemini' },
    { id: 'generate-image', name: 'Generate Image', icon: <ImageIcon className="h-4 w-4" />, route: '/generate-image-openai' },
    { id: 'ai-search', name: 'AI Search', icon: <Search className="h-4 w-4" />, route: '/ai-search-engine' }
  ];

  const modelOptions = [
    { value: 'gpt-4o-mini', label: 'OpenAI GPT-4o mini', subtitle: 'OpenAI\'s Fastest Model' },
    { value: 'gpt-4o', label: 'OpenAI GPT-4o', subtitle: 'OpenAI\'s Most Accurate Model', pro: true },
    { value: 'gpt-5', label: 'OpenAI GPT-5', subtitle: 'OpenAI\'s Most Advanced Model', pro: true },
    { value: 'claude', label: 'Claude', subtitle: 'Anthropic\'s latest AI model', pro: true },
    { value: 'deepseek', label: 'DeepSeek', subtitle: 'Great for most questions', pro: true },
    { value: 'gemini', label: 'Google Gemini', subtitle: 'Google\'s most capable AI' }
  ];
  // Check for pending message from OAuth flow
  useEffect(() => {
    if (user && !pendingMessage) {
      const storedMessage = localStorage.getItem('pendingChatMessage');
      if (storedMessage) {
        localStorage.removeItem('pendingChatMessage');
        // Create chat with the stored message
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
  
  const handleCreateImageClick = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    const toolId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    navigate(`/generate-image-openai/${toolId}`);
  };

  const handleSearchWebClick = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    const toolId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    navigate(`/ai-search-engine/${toolId}`);
  };

  const handleModelClick = (model: typeof aiModels[0]) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    const toolId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    navigate(`${model.route}/${toolId}`);
  };
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setSelectedFiles(prev => [...prev, ...Array.from(files)]);
      event.target.value = '';
    }
  };
  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);

    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = '24px';
    const scrollHeight = textarea.scrollHeight;
    const maxHeight = 200; // 200px max height

    if (scrollHeight > maxHeight) {
      textarea.style.height = `${maxHeight}px`;
      textarea.style.overflowY = 'auto';
    } else {
      textarea.style.height = `${scrollHeight}px`;
      textarea.style.overflowY = 'hidden';
    }
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleStartChat();
    }
  };
  const startRecording = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        await processAudioToText(audioBlob);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setAudioChunks([]);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    setIsRecording(false);
    setMediaRecorder(null);
  };

  const processAudioToText = async (audioBlob: Blob) => {
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        
        const response = await supabase.functions.invoke('speech-to-text', {
          body: { audio: base64Audio }
        });

        if (response.error) {
          throw response.error;
        }

        const { text } = response.data;
        if (text) {
          setMessage(prev => prev + (prev ? ' ' : '') + text);
          // Auto-resize textarea after adding text
          setTimeout(() => {
            if (textareaRef.current) {
              const textarea = textareaRef.current;
              textarea.style.height = '24px';
              const scrollHeight = textarea.scrollHeight;
              const maxHeight = 200;
              
              if (scrollHeight > maxHeight) {
                textarea.style.height = `${maxHeight}px`;
                textarea.style.overflowY = 'auto';
              } else {
                textarea.style.height = `${scrollHeight}px`;
                textarea.style.overflowY = 'hidden';
              }
            }
          }, 0);
        }
      };
      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error('Error processing audio:', error);
    }
  };

  const scrollAvailableModels = (direction: 'left' | 'right') => {
    if (availableModelsRef.current) {
      const scrollAmount = 200;
      const newScrollLeft = availableModelsRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
      availableModelsRef.current.scrollTo({ left: newScrollLeft, behavior: 'smooth' });
    }
  };
  const handleStartChat = async () => {
    if (!message.trim() || loading) return;
    if (!user) {
      setPendingMessage(message);
      // Store message in localStorage for OAuth flows
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
      if (user) {
        // Authenticated user - create chat in database
        const {
          data: chatData,
          error: chatError
        } = await supabase.from('chats').insert([{
          user_id: user.id,
          title: message.slice(0, 50) || 'New Chat'
        }]).select().single();
        if (chatError) throw chatError;

        // Add initial message
        const {
          error: messageError
        } = await supabase.from('messages').insert({
          chat_id: chatData.id,
          content: message,
          role: 'user'
        });
        if (messageError) throw messageError;
        navigate(`/chat/${chatData.id}`);
      } else if (sessionId) {
        // Anonymous user - save to anonymous messages and navigate to chat
        await supabase.from('anonymous_messages').insert({
          session_id: sessionId,
          content: message,
          role: 'user'
        });
        incrementMessageCount();

        // For anonymous users, we can create a simple chat interface
        // You might want to create a special anonymous chat route
        navigate('/chat/anonymous');
      }
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
      const { data: chatData, error: chatError } = await supabase
        .from('chats')
        .insert([{
          user_id: userId,
          title: messageToSend.slice(0, 50) || 'New Chat'
        }])
        .select()
        .single();
      
      if (chatError) throw chatError;
      
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
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

  return <div className="flex-1 flex flex-col items-center justify-center p-6 min-h-screen">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Welcome to AI Chat</h1>
        <p className="text-muted-foreground text-lg">
          Start a conversation with AI or explore our tools
        </p>
        {!user}
      </div>

      {/* Message Input Area */}
      <div className="w-full max-w-4xl">
        <div className="px-4 py-4">
          {/* File attachments preview */}
          {selectedFiles.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 text-sm">
                  <span className="truncate max-w-32">{file.name}</span>
                  <button onClick={() => removeFile(index)} className="text-muted-foreground hover:text-foreground">
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {/* Main input container */}
          <div className="relative bg-background border border-border rounded-2xl shadow-sm">
            {/* Textarea */}
            <div className="p-4 pb-2">
              <Textarea 
                ref={textareaRef} 
                value={message} 
                onChange={handleInputChange} 
                onKeyDown={handleKeyDown} 
                placeholder="Type a message" 
                className="w-full min-h-[24px] border-0 resize-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0 py-0 text-foreground placeholder:text-muted-foreground text-base" 
                style={{
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  lineHeight: '1.5rem',
                  height: '24px',
                  overflowY: 'hidden'
                }} 
                disabled={loading} 
                rows={1} 
              />
            </div>
            
            {/* Bottom section with buttons and model selector */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              {/* Left side buttons */}
              <div className="flex items-center gap-2">
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 px-2 text-muted-foreground hover:text-foreground"
                  onClick={handleFileUpload}
                >
                  <Paperclip className="h-4 w-4 mr-1" />
                </Button>
                
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 px-3 text-muted-foreground hover:text-foreground border border-border rounded-full"
                  onClick={handleCreateImageClick}
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Create an image
                </Button>
                
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 px-3 text-muted-foreground hover:text-foreground border border-border rounded-full"
                  onClick={handleSearchWebClick}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Search the web
                </Button>
              </div>
              
              {/* Right side - Model selector and voice button */}
              <div className="flex items-center gap-3">
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="w-48 h-8 border-0 bg-transparent text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border">
                    {modelOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="hover:bg-muted">
                        <div className="flex flex-col items-start">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{option.label}</span>
                            {option.pro && (
                              <span className="text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                                Pro
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">{option.subtitle}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* Voice button */}
                <Button 
                  type="button" 
                  variant={isRecording ? "default" : "secondary"}
                  size="sm" 
                  className={`h-8 w-8 p-0 rounded-full ${isRecording ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' : 'bg-foreground text-background hover:bg-foreground/90'}`}
                  onClick={isRecording ? stopRecording : startRecording} 
                  disabled={loading}
                >
                  <Mic className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Available Models Section */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">Available models</h3>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-full"
                  onClick={() => scrollAvailableModels('left')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-full"
                  onClick={() => scrollAvailableModels('right')}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div 
              ref={availableModelsRef}
              className="flex gap-3 overflow-x-auto scrollbar-hide pb-2"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {aiModels.map((model) => (
                <Button
                  key={model.id}
                  variant="outline"
                  size="sm"
                  className="flex-shrink-0 h-10 px-4 bg-background hover:bg-muted border-border rounded-full"
                  onClick={() => handleModelClick(model)}
                >
                  <div className="flex items-center gap-2">
                    {model.icon}
                    <span className="text-sm font-medium">{model.name}</span>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {isAtLimit && (
            <p className="text-center text-sm text-muted-foreground mt-4">
              Message limit reached.{' '}
              <Button variant="link" className="p-0 h-auto" onClick={() => navigate('/pricing-plans')}>
                Upgrade to continue
              </Button>
            </p>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" multiple onChange={handleFileChange} className="hidden" accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.csv,.json,.xml,.py,.js,.html,.css,.md" />
      
      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => {
          setShowAuthModal(false);
          setPendingMessage('');
          // Clear stored message if modal is closed without auth
          localStorage.removeItem('pendingChatMessage');
        }}
        onSuccess={async () => {
          setShowAuthModal(false);
           // If there's a pending message, send it
           if (pendingMessage.trim()) {
             const messageToSend = pendingMessage;
             setMessage(pendingMessage);
             setPendingMessage('');
             
             // Wait longer for the auth state to fully update
             setTimeout(async () => {
               // Get fresh session to ensure we have the latest user data
               const { data: { session: currentSession } } = await supabase.auth.getSession();
               const currentUser = currentSession?.user;
               
               if (!currentUser) {
                 console.error('No user found after auth, retrying...');
                 // Retry once more after additional delay
                 setTimeout(async () => {
                   const { data: { session: retrySession } } = await supabase.auth.getSession();
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
             // Focus back to textarea after successful login
             setTimeout(() => {
               textareaRef.current?.focus();
             }, 100);
           }
         }}
      />
    </div>;
}