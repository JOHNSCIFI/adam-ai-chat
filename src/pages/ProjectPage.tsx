import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useSidebar } from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Paperclip, Mic, MicOff, Edit2, Trash2, FolderOpen, Lightbulb, Target, Briefcase, Rocket, Palette, FileText, Code, Zap, Trophy, Heart, Star, Flame, Gem, Sparkles, MoreHorizontal, FileImage, FileVideo, FileAudio, File as FileIcon, X, Image as ImageIcon2 } from 'lucide-react';
import { SendHorizontalIcon } from '@/components/ui/send-horizontal-icon';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import ProjectEditModal from '@/components/ProjectEditModal';
import VoiceModeButton from '@/components/VoiceModeButton';
import { toast } from 'sonner';

interface Chat {
  id: string;
  title: string;
  updated_at: string;
  project_id?: string;
}

interface Project {
  id: string;
  title: string;
  icon: string;
  color: string;
  description?: string;
}

const iconMap = {
  folder: FolderOpen,
  lightbulb: Lightbulb,
  target: Target,
  briefcase: Briefcase,
  rocket: Rocket,
  palette: Palette,
  filetext: FileText,
  code: Code,
  zap: Zap,
  trophy: Trophy,
  heart: Heart,
  star: Star,
  flame: Flame,
  gem: Gem,
  sparkles: Sparkles,
};

export default function ProjectPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { actualTheme } = useTheme();
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', description: '', onConfirm: () => {} });
  const { state: sidebarState } = useSidebar();
  const collapsed = sidebarState === 'collapsed';
  
  const [project, setProject] = useState<Project | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingChatTitle, setEditingChatTitle] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [isImageMode, setIsImageMode] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate proper centering based on sidebar state
  const getContainerStyle = () => {
    const sidebarWidth = collapsed ? 56 : 280;
    const availableWidth = `calc(100vw - ${sidebarWidth}px)`;
    const centerOffset = `calc(${sidebarWidth}px + (100vw - ${sidebarWidth}px) / 2)`;
    
    return { 
      paddingLeft: `${sidebarWidth}px`
    };
  };

  const getCenterStyle = () => {
    const sidebarWidth = collapsed ? 56 : 280;
    const centerOffset = `calc(${sidebarWidth}px + (100vw - ${sidebarWidth}px) / 2)`;
    
    return {
      position: 'fixed' as const,
      left: centerOffset,
      transform: 'translateX(-50%)',
      top: '100px',
      zIndex: 10
    };
  };

  const getChatListStyle = () => {
    const sidebarWidth = collapsed ? 56 : 280;
    const centerOffset = `calc(${sidebarWidth}px + (100vw - ${sidebarWidth}px) / 2)`;
    
    return {
      position: 'absolute' as const,
      left: centerOffset,
      transform: 'translateX(-50%)',
      top: '200px',
      width: '100%',
      maxWidth: '32rem'
    };
  };

  useEffect(() => {
    if (projectId && user) {
      fetchProject();
    }
  }, [projectId, user]);

  useEffect(() => {
    if (project && user) {
      fetchProjectChats();
    }
  }, [project, user]);

  const fetchProject = async () => {
    if (!projectId || !user) return;

    try {
      const { data: projectData, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .eq('id', projectId) // Use project ID instead of name
        .single();

      if (error) {
        console.error('Error fetching project:', error);
        return;
      }

      setProject(projectData);
    } catch (error) {
      console.error('Error in fetchProject:', error);
    }
  };

  const fetchProjectChats = async () => {
    if (!project || !user) return;

    try {
      const { data: chatsData, error } = await supabase
        .from('chats')
        .select('*')
        .eq('user_id', user.id)
        .eq('project_id', project.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching project chats:', error);
        return;
      }

      setChats(chatsData || []);
    } catch (error) {
      console.error('Error in fetchProjectChats:', error);
    }
  };

  const createNewChat = async () => {
    if (!user || !project) return;

    try {
      const { data: newChat, error } = await supabase
        .from('chats')
        .insert({
          user_id: user.id,
          title: 'New Chat',
          project_id: project.id
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating chat:', error);
        console.error('Error creating chat:', error);
        return;
      }

      navigate(`/chat/${newChat.id}`);
    } catch (error) {
      console.error('Error in createNewChat:', error);
      console.error('Error in createNewChat:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const sendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!input.trim() && selectedFiles.length === 0) || !user || !project || loading) return;

    setLoading(true);
    const userMessage = input.trim();
    const files = [...selectedFiles];
    setInput('');
    setSelectedFiles([]);
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      // Create new chat
      const { data: newChat, error } = await supabase
        .from('chats')
        .insert({
          user_id: user.id,
          title: userMessage.length > 50 ? userMessage.substring(0, 50) + '...' : userMessage || 'New Chat',
          project_id: project.id
        })
        .select()
        .single();

      if (error) throw error;

      // Upload files for display in chat only
      const uploadedFiles = [];
      for (const file of files) {
        const fileExtension = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('chat-files')
          .upload(fileName, file);

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('chat-files')
            .getPublicUrl(fileName);

          uploadedFiles.push({
            id: uploadData.id || Date.now().toString(),
            name: file.name,
            size: file.size,
            type: file.type,
            url: urlData.publicUrl
          });
        }
      }

      // Add initial message with files for display
      await supabase
        .from('messages')
        .insert({
          chat_id: newChat.id,
          content: userMessage,
          role: 'user',
          file_attachments: uploadedFiles
        });

      // Handle files vs text-only messages differently
      if (files.length > 0) {
        // Send files directly to webhook in base64 format
        try {
          const webhookUrl = 'https://adsgbt.app.n8n.cloud/webhook/adamGPT';
          
          // Convert first file to base64 for webhook
          const file = files[0]; // Handle first file for now
          const base64Data = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              // Remove data URL prefix to get pure base64
              const base64 = result.split(',')[1];
              resolve(base64);
            };
            reader.readAsDataURL(file);
          });

          const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: userMessage,
              chatId: newChat.id,
              userId: user.id,
              projectId: project.id,
              type: file.type.split('/')[1] || 'file',
              fileName: file.name,
              fileSize: file.size,
              fileType: file.type,
              fileData: base64Data
            })
          });

          if (response.ok) {
            const webhookData = await response.json();
            console.log('Webhook response:', webhookData);
            
            // Parse webhook response using same logic as Chat component
            let responseContent = '';
            if (Array.isArray(webhookData) && webhookData.length > 0) {
              const analysisTexts = webhookData.map(item => item.text || item.content || '').filter(text => text);
              if (analysisTexts.length > 0) {
                responseContent = analysisTexts.join('\n\n');
              } else {
                responseContent = 'File analyzed successfully';
              }
            } else if (webhookData.text) {
              responseContent = webhookData.text;
            } else if (webhookData.analysis || webhookData.content) {
              responseContent = webhookData.analysis || webhookData.content;
            } else if (webhookData.response || webhookData.message) {
              responseContent = webhookData.response || webhookData.message;
            } else {
              responseContent = 'File processed successfully';
            }
            
            // Save actual webhook response as AI message
            await supabase
              .from('messages')
              .insert({
                chat_id: newChat.id,
                content: responseContent,
                role: 'assistant'
              });
          }
        } catch (webhookError) {
          console.error('Webhook error:', webhookError);
          // Add fallback message
          await supabase
            .from('messages')
            .insert({
              chat_id: newChat.id,
              content: 'I received your file but encountered an error processing it. Please try again.',
              role: 'assistant'
            });
        }
      } else {
        // Send text-only message to OpenAI via existing chat function
        try {
          const { data, error } = await supabase.functions.invoke('chat-with-ai-optimized', {
            body: {
              message: userMessage,
              chatId: newChat.id,
              userId: user.id
            }
          });

          if (!error && data?.response) {
            // Save OpenAI response
            await supabase
              .from('messages')
              .insert({
                chat_id: newChat.id,
                content: data.response,
                role: 'assistant'
              });
          }
        } catch (aiError) {
          console.error('AI response error:', aiError);
          // Add fallback message
          await supabase
            .from('messages')
            .insert({
              chat_id: newChat.id,
              content: 'I apologize, but I encountered an error processing your message. Please try again.',
              role: 'assistant'
            });
        }
      }

      // Refresh chats and navigate
      fetchProjectChats();
      navigate(`/chat/${newChat.id}`);
      
      // Force sidebar update
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('force-chat-refresh'));
      }, 100);
      
    } catch (error: any) {
      console.error('Send message error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
    setIsPopoverOpen(false);
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

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <FileImage className="h-4 w-4 text-blue-500" />;
    if (fileType.startsWith('video/')) return <FileVideo className="h-4 w-4 text-purple-500" />;
    if (fileType.startsWith('audio/')) return <FileAudio className="h-4 w-4 text-green-500" />;
    if (fileType.includes('pdf') || fileType.includes('document') || fileType.includes('text')) 
      return <FileText className="h-4 w-4 text-red-500" />;
    return <FileIcon className="h-4 w-4 text-gray-500" />;
  };

  const startRenameChat = (chat: Chat) => {
    setEditingChatId(chat.id);
    setEditingChatTitle(chat.title);
  };

  const saveRename = async (chatId: string) => {
    if (!editingChatTitle.trim()) return;

    try {
      const { error } = await supabase
        .from('chats')
        .update({ title: editingChatTitle.trim() })
        .eq('id', chatId);

      if (error) throw error;

      setChats(prev => prev.map(chat => 
        chat.id === chatId ? { ...chat, title: editingChatTitle.trim() } : chat
      ));
      setEditingChatId(null);
      setEditingChatTitle('');
    } catch (error: any) {
      console.error('Error renaming chat:', error);
    }
  };

  const deleteChat = async (chatId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Chat',
      description: 'Are you sure you want to delete this chat?',
      onConfirm: () => executeDeleteChat(chatId)
    });
  };

  const executeDeleteChat = async (chatId: string) => {
    try {
      // First delete associated images from storage
      if (user) {
        try {
          await supabase.functions.invoke('delete-chat-images', {
            body: { chatId, userId: user.id }
          });
        } catch (imageError) {
          console.error('Error deleting chat images:', imageError);
          // Continue with chat deletion even if image deletion fails
        }
      }

      // Then delete the chat from database
      const { error } = await supabase
        .from('chats')
        .delete()
        .eq('id', chatId);

      if (error) throw error;

      setChats(prev => prev.filter(chat => chat.id !== chatId));
      
      // Refresh sidebar
      window.dispatchEvent(new CustomEvent('force-chat-refresh'));
    } catch (error: any) {
      console.error('Error deleting chat:', error);
    }
  };

  const handleCreateImageClick = () => {
    setIsImageMode(true);
    setIsPopoverOpen(false);
    setInput('');
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  const handleExitImageMode = () => {
    setIsImageMode(false);
    setInput('');
  };

  const startRecording = async () => {
    try {
      console.log('🎤 Starting speech recognition...');
      
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        toast.error('Speech recognition not supported in this browser');
        return;
      }

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        console.log('🎤 Speech recognition started successfully');
        setIsRecording(true);
      };

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0])
          .map((result) => result.transcript)
          .join('');

        if (event.results[0].isFinal) {
          console.log('📝 Final transcript:', transcript);
          setInput(prev => prev + (prev ? ' ' : '') + transcript);
          setIsRecording(false);
        }
      };

      recognition.onerror = (event) => {
        console.error('❌ Speech recognition error:', event.error);
        setIsRecording(false);
        toast.error('Speech recognition failed');
      };

      recognition.onend = () => {
        setIsRecording(false);
        setMediaRecorder(null);
      };

      setMediaRecorder(recognition as any);
      recognition.start();
      
    } catch (error) {
      console.error('❌ Failed to start speech recognition:', error);
      setIsRecording(false);
      toast.error('Failed to start speech recognition');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      console.log('🔴 Calling stop on recognition instance');
      (mediaRecorder as any).stop();
      setMediaRecorder(null);
      setIsRecording(false);
    }
  };

  if (!project) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden w-full">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="min-h-screen flex flex-col justify-center px-4 py-4" style={getContainerStyle()}>
            <div className="flex justify-center w-full">
              <div className="w-full max-w-2xl">
                {/* Header */}
                <div className="flex flex-col items-center justify-center mb-8 text-center" style={getCenterStyle()}>
                  <div 
                    className="flex items-center justify-center gap-3 mb-6 cursor-pointer hover:opacity-80 transition-opacity whitespace-nowrap"
                    onClick={() => setIsEditingProject(true)}
                  >
                    {(() => {
                      const IconComponent = iconMap[project.icon as keyof typeof iconMap] || FolderOpen;
                      return (
                        <div 
                          className="w-12 h-12 rounded-2xl flex items-center justify-center"
                          style={{ backgroundColor: project.color }}
                        >
                          <IconComponent className="w-6 h-6 text-white" />
                        </div>
                      );
                    })()}
                    <h1 className="text-2xl font-semibold text-foreground">{project.title}</h1>
                  </div>
                </div>

                {/* Chat List */}
                {chats.length > 0 && (
                  <div className="space-y-3 mb-8" style={getChatListStyle()}>
                    {chats.map((chat) => (
                      <div
                        key={chat.id}
                        className="flex items-center justify-between p-4 border-t border-b border-border hover:bg-muted/20 transition-colors group"
                      >
                      <div 
                        className="flex-1 cursor-pointer"
                        onClick={() => navigate(`/chat/${chat.id}`)}
                      >
                        <div className="flex flex-col gap-1">
                          {editingChatId === chat.id ? (
                            <input
                              value={editingChatTitle}
                              onChange={(e) => setEditingChatTitle(e.target.value)}
                              onBlur={() => saveRename(chat.id)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveRename(chat.id);
                                if (e.key === 'Escape') {
                                  setEditingChatId(null);
                                  setEditingChatTitle('');
                                }
                              }}
                              className="font-medium text-foreground bg-transparent border border-border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                              autoFocus
                              onFocus={(e) => {
                                // Position cursor at the end
                                const length = e.target.value.length;
                                e.target.setSelectionRange(length, length);
                              }}
                            />
                          ) : (
                            <h4 className="font-medium text-foreground text-sm pr-4">{chat.title}</h4>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {new Date(chat.updated_at).toLocaleDateString()} • {new Date(chat.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      
                      {/* Chat Actions */}
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            startRenameChat(chat);
                          }}
                        >
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteChat(chat.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              </div>
            </div>
          </div>
        </div>

        {/* Input area - fixed at bottom like ChatGPT */}
        <div className="fixed bottom-0 left-0 right-0 bg-background overflow-hidden">
          <div className="flex justify-center px-4 py-4 w-full" style={getContainerStyle()}>
            <div className="w-full max-w-2xl">
              {/* File attachments preview */}
              {selectedFiles.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 text-sm">
                      {getFileIcon(file.type)}
                      <span className="truncate max-w-32">{file.name}</span>
                      <button 
                        onClick={() => removeFile(index)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Image mode indicator */}
              {isImageMode && (
                <div className="flex items-center gap-2 mb-3 flex-wrap animate-fade-in">
                  <div className="group flex items-center gap-1 bg-muted px-2 py-1 rounded-md text-xs">
                    <ImageIcon2 className="h-3 w-3" />
                    <span>Image Generation Mode</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleExitImageMode}
                      className="h-4 w-4 p-0 ml-1 hover:bg-muted-foreground/20"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="relative">
                <div className={`flex-1 flex items-center border rounded-3xl px-4 py-3 ${actualTheme === 'light' ? 'bg-white border-gray-200' : 'bg-[hsl(var(--input))] border-border'}`}>
                  {/* Attachment button */}
                  <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-muted/20 rounded-full flex-shrink-0 mr-2"
                      >
                        <Paperclip className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </PopoverTrigger>
                     <PopoverContent className="w-48 p-2 bg-background border shadow-lg" align="start">
                       <Button
                         variant="ghost"
                         size="sm"
                         className="w-full justify-start gap-2"
                         onClick={handleFileUpload}
                       >
                         <Paperclip className="h-4 w-4" />
                         Add photos & files
                       </Button>
                       <Button
                         variant="ghost"
                         size="sm"
                         className="w-full justify-start gap-2"
                         onClick={handleCreateImageClick}
                       >
                         <ImageIcon2 className="h-4 w-4" />
                         Create image
                       </Button>
                     </PopoverContent>
                  </Popover>
                  
                 <Textarea
                   ref={textareaRef}
                   value={input}
                   onChange={handleInputChange}
                   onKeyDown={handleKeyDown}
                   placeholder={isImageMode ? "Describe an image" : `New chat in ${project.title}`}
                   className="flex-1 min-h-[24px] max-h-[200px] border-0 resize-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0 py-0 text-foreground placeholder:text-muted-foreground break-words text-left"
                   style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
                   disabled={loading}
                   rows={1}
                 />
                  
                 <div className="flex items-center gap-1 ml-2 pb-1">
                   {/* Dictation button */}
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
                   
                   {/* Voice Mode button */}
                   <VoiceModeButton
                     onMessageSent={(messageId, content, role) => {
                       // Mark voice messages as processed and refresh chats
                       if (role === 'user') {
                         console.log('✅ Voice user message sent:', messageId);
                         fetchProjectChats();
                       }
                     }}
                     chatId={projectId}
                     actualTheme={actualTheme}
                   />
                   
                   {/* Send button */}
                    <Button
                      type="button"
                      onClick={sendMessage}
                      disabled={(!input.trim() && selectedFiles.length === 0) || loading}
                      size="sm"
                      className="h-8 w-8 p-0 rounded-full flex-shrink-0"
                      style={{ 
                        backgroundColor: (input.trim() || selectedFiles.length > 0) && !loading
                          ? (actualTheme === 'light' ? 'hsl(var(--user-message-bg))' : 'hsl(var(--primary))')
                          : 'hsl(var(--muted))',
                        color: (input.trim() || selectedFiles.length > 0) && !loading
                          ? (actualTheme === 'light' ? 'hsl(var(--foreground))' : 'hsl(var(--primary-foreground))')
                          : 'hsl(var(--muted-foreground))'
                      }}
                    >
                      <SendHorizontalIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground text-center mt-3">
                AdamGPT can make mistakes. Check important info.
              </p>
            </div>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.csv,.json,.xml,.py,.js,.html,.css,.md"
        />
      </div>

      {/* Edit Project Modal */}
      <ProjectEditModal
        project={project}
        isOpen={isEditingProject}
        onClose={() => setIsEditingProject(false)}
        onProjectUpdated={() => {
          fetchProject();
          window.dispatchEvent(new CustomEvent('force-chat-refresh'));
        }}
      />

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        description={confirmDialog.description}
        variant="destructive"
        confirmText="Delete"
      />
    </div>
  );
}