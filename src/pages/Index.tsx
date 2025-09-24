import React, { useState, useRef } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useMessageLimit } from '@/hooks/useMessageLimit';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { Paperclip, Mic, MicOff, ImageIcon, Image as ImageIcon2 } from 'lucide-react';
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
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  if (authLoading) {
    return <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>;
  }
  const handleFileUpload = () => {
    fileInputRef.current?.click();
    setIsPopoverOpen(false);
  };
  const handleCreateImageClick = () => {
    setIsPopoverOpen(false);
    // Navigate to image generation tool
    const toolId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    navigate(`/generate-image-openai/${toolId}`);
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
    setIsRecording(true);
    // Add voice recording logic here
  };
  const stopRecording = () => {
    setIsRecording(false);
    // Add stop recording logic here
  };
  const handleStartChat = async () => {
    if (!message.trim() || loading) return;
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
  return <div className="flex-1 flex flex-col items-center justify-center p-6 min-h-screen">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Welcome to AI Chat</h1>
        <p className="text-muted-foreground text-lg">
          Start a conversation with AI or explore our tools
        </p>
        {!user && <p className="text-sm text-muted-foreground mt-2">
            You can send up to 15 messages as a guest. Sign up for unlimited access.
          </p>}
      </div>

      {/* Message Input Area - Same design as Chat page */}
      <div className="w-full max-w-3xl">
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
          
          <div className="relative">
            <div className={`flex-1 flex items-center border rounded-3xl px-4 py-3 ${actualTheme === 'light' ? 'bg-white border-gray-200' : 'bg-[hsl(var(--input))] border-border'}`}>
              {/* Attachment button - left side inside input */}
              <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-muted/20 rounded-full flex-shrink-0 mr-2">
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-2 bg-background border shadow-lg" align="start">
                  <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={handleFileUpload}>
                    <Paperclip className="h-4 w-4" />
                    Add photos & files
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={handleCreateImageClick}>
                    <ImageIcon2 className="h-4 w-4" />
                    Create image
                  </Button>
                </PopoverContent>
              </Popover>
              
              <Textarea ref={textareaRef} value={message} onChange={handleInputChange} onKeyDown={handleKeyDown} placeholder="Message AI..." className="flex-1 min-h-[24px] border-0 resize-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0 py-0 text-foreground placeholder:text-muted-foreground break-words text-left scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent" style={{
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
              lineHeight: '1.5rem',
              height: '24px',
              overflowY: 'hidden'
            }} disabled={loading} rows={1} />
              
              <div className="flex items-center gap-1 ml-2 pb-1">
                {/* Dictation button */}
                <Button type="button" variant="ghost" size="sm" className={`h-8 w-8 p-0 hover:bg-muted/20 rounded-full flex-shrink-0 ${isRecording ? 'text-red-500' : 'text-muted-foreground'}`} onClick={isRecording ? stopRecording : startRecording} disabled={loading}>
                  {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
          
          

          {/* Action buttons below input */}
          

          {isAtLimit && <p className="text-center text-sm text-muted-foreground mt-4">
              Message limit reached.{' '}
              <Button variant="link" className="p-0 h-auto" onClick={() => navigate('/pricing-plans')}>
                Upgrade to continue
              </Button>
            </p>}
        </div>
      </div>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" multiple onChange={handleFileChange} className="hidden" accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.csv,.json,.xml,.py,.js,.html,.css,.md" />
    </div>;
}