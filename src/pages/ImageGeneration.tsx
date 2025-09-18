import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useSidebar } from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/integrations/supabase/client';
import { ImageIcon, Plus, Download, Sparkles } from 'lucide-react';
import { SendHorizontalIcon } from '@/components/ui/send-horizontal-icon';
import { toast } from 'sonner';
import { ImagePopupModal } from '@/components/ImagePopupModal';

interface ImageGeneration {
  id: string;
  prompt: string;
  image_url: string | null;
  status: string;
  created_at: string;
}

export default function ImageGeneration() {
  const { sessionId } = useParams();
  const { user } = useAuth();
  const { actualTheme } = useTheme();
  const { state: sidebarState } = useSidebar();
  const collapsed = sidebarState === 'collapsed';

  const [generations, setGenerations] = useState<ImageGeneration[]>([]);
  const [newPrompt, setNewPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [sessionTitle, setSessionTitle] = useState('New Image Session');
  const [selectedImage, setSelectedImage] = useState<{url: string, prompt: string} | null>(null);
  
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
    if (sessionId && user) {
      fetchGenerations();
      fetchSessionTitle();
    }
  }, [sessionId, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [generations]);

  const fetchSessionTitle = async () => {
    if (!sessionId || !user) return;

    const { data, error } = await supabase
      .from('image_sessions')
      .select('title')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (data) {
      setSessionTitle(data.title);
    }
  };

  const fetchGenerations = async () => {
    if (!sessionId || !user) return;

    const { data, error } = await supabase
      .from('image_generations')
      .select('*')
      .eq('image_session_id', sessionId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (data) {
      setGenerations(data);
    }
  };

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
      window.location.href = `/chat/${newChat.id}`;
      
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
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `image-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Image downloaded successfully');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download image');
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
          {generations.length === 0 ? (
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
          ) : (
            <div className="space-y-6">
              {generations.map((generation) => (
                <div 
                  key={generation.id} 
                  className="group mb-4"
                >
                  <div className="space-y-4">
                    {/* User prompt */}
                    <div className="flex justify-end mr-3">
                      <div className="max-w-[80%]">
                        <div className="text-black dark:text-white bg-[#DEE7F4] dark:bg-[hsl(var(--user-message-bg))] rounded-2xl px-3.5 py-2.5 break-words whitespace-pre-wrap">
                          {generation.prompt}
                        </div>
                      </div>
                    </div>

                    {/* Generated image */}
                    <div className="flex justify-start ml-3">
                      <div className="max-w-[80%] space-y-2">
                        {generation.status === 'generating' ? (
                          <div className="w-64 h-64 bg-muted rounded-lg flex items-center justify-center">
                            <div className="text-center space-y-2">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                              <p className="text-sm text-muted-foreground">Generating image...</p>
                            </div>
                          </div>
                        ) : generation.image_url ? (
                          <div className="space-y-2">
                            <div className="relative group">
                              <img 
                                src={generation.image_url} 
                                alt={generation.prompt}
                                className="w-full max-w-md rounded-lg shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => setSelectedImage({url: generation.image_url!, prompt: generation.prompt})}
                              />
                              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="h-8 w-8 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    downloadImage(generation.image_url!, generation.prompt);
                                  }}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="w-64 h-64 bg-muted rounded-lg flex items-center justify-center">
                            <p className="text-sm text-muted-foreground">Failed to generate image</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
      
      {/* Image Popup Modal */}
      {selectedImage && (
        <ImagePopupModal
          isOpen={!!selectedImage}
          onClose={() => setSelectedImage(null)}
          imageUrl={selectedImage.url}
          prompt={selectedImage.prompt}
        />
      )}
    </div>
  );
}