import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useSidebar } from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Plus, MessageSquare, ImageIcon } from 'lucide-react';
import { SendHorizontalIcon } from '@/components/ui/send-horizontal-icon';
import { useToast } from '@/hooks/use-toast';

interface Chat {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  project_id?: string;
}

interface Message {
  id: string;
  content: string;
  role: string;
  created_at: string;
  chat_id: string;
}

interface Project {
  id: string;
  title: string;
  icon: string;
  color: string;
  description?: string;
  created_at: string;
}

export default function ProjectPage() {
  const { projectName } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { state: sidebarState } = useSidebar();
  const collapsed = sidebarState === 'collapsed';

  const [project, setProject] = useState<Project | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [newPrompt, setNewPrompt] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    if (projectName && user) {
      fetchProject();
      fetchProjectChats();
    }
  }, [projectName, user]);

  const fetchProject = async () => {
    if (!projectName || !user) return;

    const normalizedProjectName = projectName.toLowerCase().replace(/\s+/g, '-');
    
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .ilike('title', `%${projectName.replace(/-/g, ' ')}%`)
      .maybeSingle();

    if (data) {
      setProject(data);
    } else if (error) {
      console.error('Error fetching project:', error);
      toast({
        title: "Project not found",
        description: "The requested project could not be found.",
        variant: "destructive",
      });
    }
  };

  const fetchProjectChats = async () => {
    if (!projectName || !user) return;

    // First get the project
    const { data: projectData } = await supabase
      .from('projects')
      .select('id')
      .eq('user_id', user.id)
      .ilike('title', `%${projectName.replace(/-/g, ' ')}%`)
      .maybeSingle();

    if (!projectData) return;

    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('project_id', projectData.id)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (data) {
      setChats(data);
    }
  };

  const createNewChat = async () => {
    if (!user || !project) return;

    try {
      const { data, error } = await supabase
        .from('chats')
        .insert({
          user_id: user.id,
          title: 'New Chat',
          project_id: project.id
        })
        .select()
        .single();

      if (error) throw error;
      navigate(`/chat/${data.id}`);
    } catch (error) {
      console.error('Error creating chat:', error);
      toast({
        title: "Error",
        description: "Failed to create new chat",
        variant: "destructive",
      });
    }
  };

  const startChatFromPrompt = async () => {
    if (!newPrompt.trim() || !user || !project) return;

    try {
      const { data, error } = await supabase
        .from('chats')
        .insert({
          user_id: user.id,
          title: newPrompt.length > 50 ? newPrompt.substring(0, 50) + '...' : newPrompt,
          project_id: project.id
        })
        .select()
        .single();

      if (error) throw error;

      // Add the initial message
      await supabase
        .from('messages')
        .insert({
          chat_id: data.id,
          role: 'user',
          content: newPrompt
        });

      navigate(`/chat/${data.id}`);
    } catch (error) {
      console.error('Error creating chat:', error);
      toast({
        title: "Error",
        description: "Failed to start chat",
        variant: "destructive",
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      startChatFromPrompt();
    }
  };

  const getLastMessage = async (chatId: string): Promise<string> => {
    const { data } = await supabase
      .from('messages')
      .select('content')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    return data?.content?.substring(0, 60) + '...' || '';
  };

  if (!project) {
    return (
      <div className="flex h-screen bg-background">
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-hidden">
            <div style={getContainerStyle()} className="h-full flex items-center justify-center">
              <div className="text-center space-y-4">
                <h2 className="text-xl font-semibold text-foreground">Project not found</h2>
                <p className="text-muted-foreground">The requested project could not be found.</p>
                <Button onClick={() => navigate('/')}>Go Home</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-hidden">
          <div style={getContainerStyle()} className="h-full flex flex-col">
            {/* Header */}
            <div className="border-b border-border/40 p-4">
              <div className="flex items-center gap-3">
                <div 
                  className="p-3 rounded-lg text-white flex items-center justify-center"
                  style={{ backgroundColor: project.color }}
                >
                  <span className="text-lg">{project.icon}</span>
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-foreground">{project.title}</h1>
                  {project.description && (
                    <p className="text-sm text-muted-foreground">{project.description}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Input area - moved to top */}
            <div className="border-b border-border/40 p-4">
              <div className="relative">
                <Textarea
                  ref={textareaRef}
                  placeholder={`Message ${project.title}...`}
                  value={newPrompt}
                  onChange={(e) => setNewPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="min-h-[60px] max-h-[200px] resize-none pr-12"
                />
                <Button 
                  onClick={startChatFromPrompt}
                  disabled={!newPrompt.trim()}
                  size="sm"
                  className="absolute bottom-2 right-2 h-8 w-8 p-0"
                >
                  <SendHorizontalIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {chats.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center space-y-6 max-w-md">
                    <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                      <MessageSquare className="h-8 w-8 text-white" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-xl font-semibold text-foreground">Start your first chat</h2>
                      <p className="text-muted-foreground">
                        Create a new conversation in your {project.title} project by typing a message above.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-foreground">Recent conversations</h3>
                    <Button onClick={createNewChat} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      New chat
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {chats.map((chat) => {
                      const [lastMessage, setLastMessage] = useState('');
                      
                      useEffect(() => {
                        getLastMessage(chat.id).then(setLastMessage);
                      }, [chat.id]);

                      return (
                        <div
                          key={chat.id}
                          onClick={() => navigate(`/chat/${chat.id}`)}
                          className="p-4 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <MessageSquare className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-foreground truncate mb-1">{chat.title}</h4>
                              {lastMessage && (
                                <p className="text-sm text-muted-foreground truncate mb-1">{lastMessage}</p>
                              )}
                              <p className="text-xs text-muted-foreground">
                                {new Date(chat.updated_at).toLocaleDateString()} • Last activity
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}