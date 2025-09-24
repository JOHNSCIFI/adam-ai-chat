import React, { useState, useRef, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useMessageLimit } from '@/hooks/useMessageLimit';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Paperclip, Mic, MicOff, ImageIcon, Search, Bot, Brain, Sparkles, Zap, ChevronDown, Calculator, FileImage, FileText, Palette, Combine, Edit3 } from 'lucide-react';
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
  const [selectedModel, setSelectedModel] = useState('OpenAI GPT-4o mini');
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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
    // Navigate to image generation tool
    const toolId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    navigate(`/generate-image-openai/${toolId}`);
  };

  const handleSearchWebClick = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    // Navigate to AI search engine tool
    const toolId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    navigate(`/ai-search-engine/${toolId}`);
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
  const startRecording = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setIsRecording(true);
    // Add voice recording logic here
  };
  const stopRecording = () => {
    setIsRecording(false);
    // Add stop recording logic here
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

  // Available models from explore tools (AI Models category)
  const availableModels = [
    {
      id: 'openai-gpt-4o',
      name: 'OpenAI GPT-4o',
      description: 'Access to OpenAI\'s powerful GPT-4o model for complex tasks',
      icon: <Bot className="h-4 w-4" />,
      route: '/openai-gpt-4o'
    },
    {
      id: 'openai-gpt-4-1',
      name: 'OpenAI GPT-4.1',
      description: 'The flagship GPT-4 model for reliable and accurate responses',
      icon: <Bot className="h-4 w-4" />,
      route: '/openai-gpt-4-1'
    },
    {
      id: 'deepseek',
      name: 'DeepSeek',
      description: 'Advanced AI model great for most questions and tasks',
      icon: <Brain className="h-4 w-4" />,
      route: '/deepseek'
    },
    {
      id: 'google-gemini',
      name: 'Google Gemini',
      description: 'Google\'s most capable AI for a wide range of tasks',
      icon: <Sparkles className="h-4 w-4" />,
      route: '/google-gemini'
    },
    {
      id: 'grok-3-mini',
      name: 'Grok-3 Mini',
      description: 'Fast and lightweight AI model built for speed',
      icon: <Zap className="h-4 w-4" />,
      route: '/grok-3-mini'
    },
    {
      id: 'grok-4',
      name: 'Grok-4',
      description: 'Advanced AI model for tackling intricate challenges',
      icon: <Zap className="h-4 w-4" />,
      route: '/grok-4'
    }
  ];

  const handleModelClick = (model: any) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    const toolId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    navigate(`${model.route}/${toolId}`);
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
      </div>

      {/* Message Input Area */}
      <div className="w-full max-w-4xl">
        <div className="px-4 py-4">
          {/* File attachments preview */}
          {selectedFiles.length > 0 && <div className="mb-4 flex flex-wrap gap-2">
              {selectedFiles.map((file, index) => <div key={index} className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 text-sm">
                  <span className="truncate max-w-32">{file.name}</span>
                  <button onClick={() => removeFile(index)} className="text-muted-foreground hover:text-foreground">
                    ×
                  </button>
                </div>)}
            </div>}
          
          {/* Main Input Container */}
          <div className="relative">
            <Textarea 
              ref={textareaRef} 
              value={message} 
              onChange={handleInputChange} 
              onKeyDown={handleKeyDown} 
              placeholder="Type a message" 
              className={`w-full min-h-[120px] border rounded-2xl px-4 py-4 pb-16 resize-none bg-transparent focus-visible:ring-1 focus-visible:ring-ring text-foreground placeholder:text-muted-foreground ${actualTheme === 'light' ? 'bg-white border-gray-200' : 'bg-[hsl(var(--input))] border-border'}`}
              disabled={loading} 
            />
            
            {/* Bottom toolbar inside textarea */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Attachment button */}
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 hover:bg-muted/20 rounded-full flex-shrink-0"
                  onClick={handleFileUpload}
                  disabled={loading}
                >
                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                </Button>

                {/* Create image button */}
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 px-3 hover:bg-muted/20 rounded-full flex items-center gap-2"
                  onClick={handleCreateImageClick}
                  disabled={loading}
                >
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Create an image</span>
                </Button>

                {/* Search web button */}
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 px-3 hover:bg-muted/20 rounded-full flex items-center gap-2"
                  onClick={handleSearchWebClick}
                  disabled={loading}
                >
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Search the web</span>
                </Button>
              </div>

              <div className="flex items-center gap-2">
                {/* Model selector */}
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="h-8 w-auto min-w-[180px] bg-transparent border-0 focus:ring-0 text-sm">
                    <SelectValue />
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OpenAI GPT-4o mini">
                      <div className="flex flex-col items-start">
                        <span>OpenAI GPT-4o mini</span>
                        <span className="text-xs text-muted-foreground">OpenAI's Fastest Model</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="OpenAI GPT-4o">
                      <div className="flex flex-col items-start">
                        <span>OpenAI GPT-4o</span>
                        <span className="text-xs text-muted-foreground">Pro • OpenAI's Most Accurate Model</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="OpenAI GPT-5">
                      <div className="flex flex-col items-start">
                        <span>OpenAI GPT-5</span>
                        <span className="text-xs text-muted-foreground">Pro • OpenAI's Most Advanced Model</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Claude">
                      <div className="flex flex-col items-start">
                        <span>Claude</span>
                        <span className="text-xs text-muted-foreground">Pro • Anthropic's latest AI model</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="DeepSeek">
                      <div className="flex flex-col items-start">
                        <span>DeepSeek</span>
                        <span className="text-xs text-muted-foreground">Pro • Great for most questions</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Google Gemini">
                      <div className="flex flex-col items-start">
                        <span>Google Gemini</span>
                        <span className="text-xs text-muted-foreground">Google's most capable AI</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>

                {/* Voice button */}
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
              </div>
            </div>
          </div>

          {isAtLimit && <p className="text-center text-sm text-muted-foreground mt-4">
              Message limit reached.{' '}
              <Button variant="link" className="p-0 h-auto" onClick={() => navigate('/pricing-plans')}>
                Upgrade to continue
              </Button>
            </p>}
        </div>
      </div>

      {/* Available Models Section */}
      <div className="w-full max-w-4xl mt-8">
        <div className="px-4">
          <h3 className="text-lg font-semibold mb-4">Available models:</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {availableModels.map((model) => (
              <Card 
                key={model.id} 
                className="cursor-pointer hover:shadow-md transition-shadow bg-card border-border"
                onClick={() => handleModelClick(model)}
              >
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <div className="mb-2 text-muted-foreground">
                    {model.icon}
                  </div>
                  <h4 className="text-sm font-medium mb-1">{model.name}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-2">{model.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
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