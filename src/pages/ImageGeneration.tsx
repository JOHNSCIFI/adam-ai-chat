import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, ImageIcon } from 'lucide-react';
import { SendHorizontalIcon } from '@/components/ui/send-horizontal-icon';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useSidebar } from '@/components/ui/sidebar';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function ImageGeneration() {
  const { user } = useAuth();
  const { actualTheme } = useTheme();
  const { state: sidebarState } = useSidebar();
  const navigate = useNavigate();
  const collapsed = sidebarState === 'collapsed';

  const [newPrompt, setNewPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [sessionTitle] = useState('AI Image Generation');
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Calculate proper centering based on sidebar state
  const getContainerStyle = () => {
    if (collapsed) {
      return { 
        marginLeft: 'calc(56px + (100vw - 56px - 768px) / 2)', 
        marginRight: 'auto',
        maxWidth: '768px'
      };
    } else {
      return { 
        marginLeft: 'calc(280px + (100vw - 280px - 768px) / 2)', 
        marginRight: 'auto',
        maxWidth: '768px'
      };
    }
  };

  useEffect(() => {
    // No longer fetching generations since tables were removed
    // This page now focuses on creating new image generation requests
  }, [user]);

  // No longer needed since tables were removed
  // const fetchSessionTitle = async () => {
  //   if (!sessionId || !user) return;
  //   const { data, error } = await supabase
  //     .from('image_sessions')
  //     .select('title')
  //     .eq('id', sessionId)
  //     .eq('user_id', user.id)
  //     .single();
  //   if (data) {
  //     setSessionTitle(data.title);
  //   }
  // };

  // const fetchGenerations = async () => {
  //   if (!sessionId || !user) return;
  //   const { data, error } = await supabase
  //     .from('image_generations')
  //     .select('*')
  //     .eq('image_session_id', sessionId)
  //     .eq('user_id', user.id)
  //     .order('created_at', { ascending: true });
  //   if (data) {
  //     setGenerations(data);
  //   }
  // };

  const handleGenerate = async () => {
    if (!newPrompt.trim() || isGenerating) return;

    const promptText = newPrompt.trim();
    setNewPrompt('');
    setIsGenerating(true);

    try {
      // Create new chat with the prompt
      const { data: newChat, error } = await supabase
        .from('chats')
        .insert({
          user_id: user.id,
          title: promptText.length > 50 ? promptText.substring(0, 50) + '...' : promptText
        })
        .select()
        .single();

      if (error) throw error;

      // Add initial message to the chat
      await supabase
        .from('messages')
        .insert({
          chat_id: newChat.id,
          content: promptText,
          role: 'user'
        });

      // Navigate to the new chat
      navigate(`/chat/${newChat.id}`);
      
      // Trigger sidebar refresh
      window.dispatchEvent(new CustomEvent('force-chat-refresh'));
      
    } catch (error) {
      console.error('Error creating chat:', error);
      setIsGenerating(false);
      setNewPrompt(promptText);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  const downloadImage = async (imageUrl: string, prompt: string) => {
    try {
      let response;
      
      // Check if it's a Supabase storage URL
      if (imageUrl.includes('supabase') || imageUrl.includes('storage')) {
        // Use Supabase client for authenticated requests
        const { data, error } = await supabase.storage
          .from('chat-files')
          .download(imageUrl.split('/').pop() || `image-${Date.now()}`);
          
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
      a.download = `${prompt.slice(0, 30)}-${Date.now()}.png`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
      
      toast.success('Image downloaded successfully');
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback to opening in new tab
      try {
        const newWindow = window.open(imageUrl, '_blank');
        if (newWindow) {
          toast.success('Image opened in new tab - right-click to save');
        } else {
          toast.error('Please allow popups to download images');
        }
      } catch (fallbackError) {
        toast.error('Failed to download image. Please try right-clicking the image to save.');
      }
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      {/* Messages area - takes all available space above input */}
      <div className="flex-1 overflow-y-auto pb-24">
        <div className="w-full px-4 py-6" style={getContainerStyle()}>
          {/* Header */}
          <div className="border-b border-border/40 p-4 mb-6 -mx-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                <ImageIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">{sessionTitle}</h1>
                <p className="text-sm text-muted-foreground">AI Image Generation</p>
              </div>
            </div>
          </div>
          {/* Always show the empty state since we removed the generations table */}
          <div className="flex items-center justify-center h-full min-h-[70vh]">
            <div className="text-center max-w-md">
              <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-6">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-normal mb-6 text-foreground">
                What would you like me to create?
              </h3>
              <p className="text-muted-foreground">
                Describe any image and I'll generate it for you using AI.
              </p>
            </div>
          </div>
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Fixed input area at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border/40">
        <div className="w-full px-4 py-4" style={getContainerStyle()}>
          <div className="relative">
            <div className={`flex-1 flex items-center border rounded-3xl px-4 py-3 bg-white dark:bg-[hsl(var(--input))] border-gray-200 dark:border-border`}>
              <Textarea
                ref={textareaRef}
                value={newPrompt}
                onChange={(e) => setNewPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe the image you want to generate..."
                className="flex-1 min-h-[24px] max-h-[200px] border-0 resize-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0 py-0 text-foreground placeholder:text-muted-foreground break-words text-left"
                style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
                disabled={isGenerating}
                rows={1}
              />
              
              <div className="flex items-center gap-1 ml-2 pb-1">
                {/* Send button - always visible */}
                <Button
                  type="button"
                  onClick={handleGenerate}
                  disabled={!newPrompt.trim() || isGenerating}
                  size="sm"
                  className="h-8 w-8 p-0 rounded-full flex-shrink-0"
                  style={{ 
                    backgroundColor: newPrompt.trim() && !isGenerating
                      ? 'hsl(var(--primary))'
                      : 'hsl(var(--muted))',
                    color: newPrompt.trim() && !isGenerating
                      ? 'hsl(var(--primary-foreground))'
                      : 'hsl(var(--muted-foreground))'
                  }}
                >
                  <SendHorizontalIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground text-center mt-3">
            AI can make mistakes. Check important info.
          </p>
        </div>
      </div>
    </div>
  );
}