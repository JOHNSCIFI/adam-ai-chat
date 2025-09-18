import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarSeparator,
  SidebarTrigger,
  useSidebar 
} from '@/components/ui/sidebar';
import { 
  MessageSquare, 
  Plus, 
  Edit2, 
  Trash2, 
  Settings, 
  LogOut,
  Search,
  Library,
  Bot,
  Folder,
  MessageCircle,
  Edit3,
  Menu,
  X,
  ImageIcon,
  FolderPlus,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { 
  Briefcase, 
  BookOpen, 
  Code, 
  Palette, 
  Lightbulb, 
  Target, 
  Heart,
  Star,
  Rocket
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import SettingsModal from './SettingsModal';
import { ProjectModal } from './ProjectModal';

interface Chat {
  id: string;
  title: string;
  created_at: string;
  project_id?: string;
}

interface ImageSession {
  id: string;
  title: string;
  created_at: string;
  project_id?: string;
}

interface Project {
  id: string;
  title: string;
  icon: string;
  color: string;
  chats?: Chat[];
  imageSessions?: ImageSession[];
}

const iconMap = {
  folder: Folder,
  briefcase: Briefcase,
  book: BookOpen,
  code: Code,
  palette: Palette,
  lightbulb: Lightbulb,
  target: Target,
  heart: Heart,
  star: Star,
  rocket: Rocket,
};

export function ChatSidebar() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [imageSessions, setImageSessions] = useState<ImageSession[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  
  const { user, signOut, userProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { chatId } = useParams();
  const { state: sidebarState } = useSidebar();
  const collapsed = sidebarState === 'collapsed';

  // Fetch functions
  const fetchChats = async () => {
    if (!user) return;
    
    try {
      const { data: chatsData, error } = await supabase
        .from('chats')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching chats:', error);
        return;
      }

      setChats(chatsData || []);
    } catch (error) {
      console.error('Error in fetchChats:', error);
    }
  };

  const fetchImageSessions = async () => {
    if (!user) return;
    
    try {
      const { data: sessionsData, error } = await supabase
        .from('image_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching image sessions:', error);
        return;
      }

      setImageSessions(sessionsData || []);
    } catch (error) {
      console.error('Error in fetchImageSessions:', error);
    }
  };

  const fetchProjects = async () => {
    if (!user) return;
    
    try {
      // First get projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (projectsError) {
        console.error('Error fetching projects:', projectsError);
        return;
      }

      // Then get chats and image sessions for each project
      const processedProjects = await Promise.all((projectsData || []).map(async (project) => {
        const [{ data: chats }, { data: imageSessions }] = await Promise.all([
          supabase
            .from('chats')
            .select('*')
            .eq('project_id', project.id)
            .order('created_at', { ascending: false }),
          supabase
            .from('image_sessions')
            .select('*')
            .eq('project_id', project.id)
            .order('created_at', { ascending: false })
        ]);

        return {
          ...project,
          chats: chats || [],
          imageSessions: imageSessions || []
        };
      }));

      setProjects(processedProjects);
    } catch (error) {
      console.error('Error in fetchProjects:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchChats();
      fetchImageSessions();
      fetchProjects();
      
      // Set up real-time subscription for chats
      const chatSubscription = supabase
        .channel('chats-changes')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'chats',
            filter: `user_id=eq.${user.id}`
          }, 
          (payload) => {
            console.log('ChatSidebar: Received chat real-time update:', payload);
            fetchChats();
            fetchProjects(); // Refresh to update project chat counts
          }
        )
        .subscribe();

      // Set up real-time subscription for image sessions
      const imageSubscription = supabase
        .channel('image-sessions-changes')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'image_sessions',
            filter: `user_id=eq.${user.id}`
          }, 
          (payload) => {
            console.log('ChatSidebar: Received image session real-time update:', payload);
            fetchImageSessions();
            fetchProjects(); // Refresh to update project image counts
          }
        )
        .subscribe();

      // Set up real-time subscription for projects
      const projectSubscription = supabase
        .channel('projects-changes')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'projects',
            filter: `user_id=eq.${user.id}`
          }, 
          (payload) => {
            console.log('ChatSidebar: Received project real-time update:', payload);
            fetchProjects();
          }
        )
        .subscribe();

      // Listen for forced refresh events from main page
      const handleForceRefresh = () => {
        console.log('ChatSidebar: Forcing refresh due to new chat creation');
        fetchChats();
        fetchImageSessions();
        fetchProjects();
      };
      
      window.addEventListener('force-chat-refresh', handleForceRefresh);

      return () => {
        chatSubscription.unsubscribe();
        imageSubscription.unsubscribe();
        projectSubscription.unsubscribe();
        window.removeEventListener('force-chat-refresh', handleForceRefresh);
      };
    }
  }, [user]);

  const handleNewChat = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create a new chat.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: newChat, error } = await supabase
        .from('chats')
        .insert({
          user_id: user.id,
          title: 'New Chat'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating chat:', error);
        toast({
          title: "Error creating chat",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      navigate(`/chat/${newChat.id}`);
    } catch (error) {
      console.error('Error in handleNewChat:', error);
      toast({
        title: "Error creating chat",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleNewImageSession = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create an image session.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: newSession, error } = await supabase
        .from('image_sessions')
        .insert({
          user_id: user.id,
          title: 'New Image Session'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating image session:', error);
        toast({
          title: "Error creating image session",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      navigate(`/image/${newSession.id}`);
    } catch (error) {
      console.error('Error in handleNewImageSession:', error);
      toast({
        title: "Error creating image session",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRenameChat = async (chatId: string, newTitle: string) => {
    if (!newTitle.trim()) {
      setEditingChatId(null);
      return;
    }

    try {
      const { error } = await supabase
        .from('chats')
        .update({ title: newTitle.trim() })
        .eq('id', chatId);

      if (error) {
        console.error('Error renaming chat:', error);
        toast({
          title: "Error renaming chat",
          description: error.message,
          variant: "destructive",
        });
      } else {
        // Update local state immediately
        setChats(prev => prev.map(chat => 
          chat.id === chatId ? { ...chat, title: newTitle.trim() } : chat
        ));
        toast({
          title: "Chat renamed",
          description: "Chat has been renamed successfully.",
        });
      }
    } catch (error) {
      console.error('Error in handleRenameChat:', error);
      toast({
        title: "Error renaming chat",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setEditingChatId(null);
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      const { error } = await supabase
        .from('chats')
        .delete()
        .eq('id', chatId);

      if (error) {
        console.error('Error deleting chat:', error);
        toast({
          title: "Error deleting chat",
          description: error.message,
          variant: "destructive",
        });
      } else {
        // Update local state immediately
        setChats(prev => prev.filter(chat => chat.id !== chatId));
        toast({
          title: "Chat deleted",
          description: "Chat has been deleted successfully.",
        });
        
        // Navigate away if we're currently viewing this chat
        if (chatId === chatId) {
          navigate('/');
        }
      }
    } catch (error) {
      console.error('Error in handleDeleteChat:', error);
      toast({
        title: "Error deleting chat",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleChatSwitch = async (newChatId: string) => {
    if (chatId && chatId !== newChatId) {
      // Check if current chat has messages before switching
      const { data: messages } = await supabase
        .from('messages')
        .select('id')
        .eq('chat_id', chatId)
        .limit(1);
      
      // If current chat has no messages, delete it
      if (messages && messages.length === 0) {
        await supabase
          .from('chats')
          .delete()
          .eq('id', chatId);
        
        // Update local state
        setChats(prev => prev.filter(chat => chat.id !== chatId));
      }
    }
  };

  // Function to clean up empty chats
  const cleanupEmptyChats = async () => {
    if (!user) return;

    // Get all chats for the user
    const { data: userChats } = await supabase
      .from('chats')
      .select('id')
      .eq('user_id', user.id);

    if (userChats) {
      for (const chat of userChats) {
        // Check if chat has any messages
        const { data: messages } = await supabase
          .from('messages')
          .select('id')
          .eq('chat_id', chat.id)
          .limit(1);

        // If no messages, delete the chat
        if (messages && messages.length === 0) {
          await supabase
            .from('chats')
            .delete()
            .eq('id', chat.id);
        }
      }
      
      // Refresh the chats list
      fetchChats();
    }
  };

  const toggleProject = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  const handleProjectCreated = () => {
    fetchProjects();
  };

  // Clean up empty chats on component mount
  useEffect(() => {
    if (user) {
      cleanupEmptyChats();
    }
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      toast({
        title: "Error signing out",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  // Get chats and image sessions that are not in any project
  const unorganizedChats = chats.filter(chat => !chat.project_id);
  const unorganizedImageSessions = imageSessions.filter(session => !session.project_id);

  return (
    <>
      <Sidebar className="border-r border-sidebar-border bg-sidebar" collapsible="icon">
        <SidebarHeader className="pt-5 px-2 pb-4 relative">
          {/* Sidebar Toggle Button - always at the same position */}
          <div className={`${collapsed ? 'flex justify-center' : 'flex justify-end'} mb-3`}>
            <SidebarTrigger className="h-8 w-8 p-0 bg-transparent hover:bg-sidebar-accent text-sidebar-foreground rounded-lg group flex items-center justify-center">
              <Bot className="h-5 w-5 group-hover:hidden" />
              <Menu className="h-4 w-4 hidden group-hover:block" />
            </SidebarTrigger>
          </div>

          {collapsed ? (
            // Collapsed state: center buttons vertically
            <div className="flex flex-col gap-2 items-center">
              <Button 
                onClick={handleNewChat}
                className="h-12 w-12 p-0 rounded-full bg-transparent hover:bg-sidebar-accent text-sidebar-foreground transition-all duration-200"
                size="sm"
                variant="ghost"
                title="New Chat"
              >
                <Plus className="h-5 w-5 flex-shrink-0" />
              </Button>
              <Button 
                onClick={handleNewImageSession}
                className="h-12 w-12 p-0 rounded-full bg-transparent hover:bg-sidebar-accent text-sidebar-foreground transition-all duration-200"
                size="sm"
                variant="ghost"
                title="Image Generation"
              >
                <ImageIcon className="h-5 w-5 flex-shrink-0" />
              </Button>
              <ProjectModal onProjectCreated={handleProjectCreated}>
                <Button 
                  className="h-12 w-12 p-0 rounded-full bg-transparent hover:bg-sidebar-accent text-sidebar-foreground transition-all duration-200"
                  size="sm"
                  variant="ghost"
                  title="New Project"
                >
                  <FolderPlus className="h-5 w-5 flex-shrink-0" />
                </Button>
              </ProjectModal>
            </div>
          ) : (
            // Expanded state: buttons with text
            <div className="mt-1 space-y-2">
              <Button 
                onClick={handleNewChat}
                className="ml-1 h-12 w-full justify-start gap-2 px-3 rounded-full bg-transparent hover:bg-sidebar-accent text-sidebar-foreground transition-all duration-200"
                size="sm"
                variant="ghost"
              >
                <Plus className="h-5 w-5 flex-shrink-0" />
                <span className="font-medium">New Chat</span>
              </Button>
              <Button 
                onClick={handleNewImageSession}
                className="ml-1 h-12 w-full justify-start gap-2 px-3 rounded-full bg-transparent hover:bg-sidebar-accent text-sidebar-foreground transition-all duration-200"
                size="sm"
                variant="ghost"
              >
                <ImageIcon className="h-5 w-5 flex-shrink-0" />
                <span className="font-medium">Image Generation</span>
              </Button>
              <ProjectModal onProjectCreated={handleProjectCreated}>
                <Button 
                  className="ml-1 h-12 w-full justify-start gap-2 px-3 rounded-full bg-transparent hover:bg-sidebar-accent text-sidebar-foreground transition-all duration-200"
                  size="sm"
                  variant="ghost"
                >
                  <FolderPlus className="h-5 w-5 flex-shrink-0" />
                  <span className="font-medium">New Project</span>
                </Button>
              </ProjectModal>
            </div>
          )}
        </SidebarHeader>

        <SidebarContent className="px-2">
          {/* Projects */}
          {!collapsed && projects.length > 0 && (
            <SidebarGroup>
              <SidebarGroupLabel className="px-3 text-xs text-sidebar-foreground/60 font-medium">
                Projects
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {projects.map((project) => {
                    const IconComponent = iconMap[project.icon as keyof typeof iconMap] || Folder;
                    const isExpanded = expandedProjects.has(project.id);
                    const totalItems = (project.chats?.length || 0) + (project.imageSessions?.length || 0);
                    
                    return (
                      <SidebarMenuItem key={project.id}>
                        <div className="space-y-1">
                          {/* Project Header */}
                          <Button
                            variant="ghost"
                            className="w-full justify-start gap-2 px-3 py-1.5 h-auto text-sm hover:bg-sidebar-accent"
                            onClick={() => toggleProject(project.id)}
                          >
                            <div className="flex items-center gap-2 flex-1">
                              <div className="p-1 rounded" style={{ backgroundColor: `${project.color}20` }}>
                                <IconComponent 
                                  className="h-4 w-4" 
                                  style={{ color: project.color }}
                                />
                              </div>
                              <span className="font-medium truncate">{project.title}</span>
                              {totalItems > 0 && (
                                <span className="text-xs text-muted-foreground">({totalItems})</span>
                              )}
                            </div>
                            {totalItems > 0 && (
                              isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                          
                          {/* Project Items */}
                          {isExpanded && totalItems > 0 && (
                            <div className="ml-6 space-y-1">
                              {/* Project Chats */}
                              {project.chats?.map((chat) => (
                                <div key={chat.id} className="group/chat relative">
                                  <NavLink
                                    to={`/chat/${chat.id}`}
                                    onClick={() => handleChatSwitch(chat.id)}
                                    className={({ isActive }) =>
                                      `flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm ${
                                        isActive
                                          ? 'bg-sidebar-accent text-sidebar-foreground'
                                          : 'text-sidebar-foreground hover:bg-sidebar-accent'
                                      }`
                                    }
                                  >
                                    <MessageSquare className="h-3 w-3 flex-shrink-0" />
                                    <span className="flex-1 truncate text-xs" title={chat.title}>
                                      {chat.title}
                                    </span>
                                  </NavLink>
                                </div>
                              ))}
                              
                              {/* Project Image Sessions */}
                              {project.imageSessions?.map((session) => (
                                <div key={session.id} className="group/session relative">
                                  <NavLink
                                    to={`/image/${session.id}`}
                                    className={({ isActive }) =>
                                      `flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm ${
                                        isActive
                                          ? 'bg-sidebar-accent text-sidebar-foreground'
                                          : 'text-sidebar-foreground hover:bg-sidebar-accent'
                                      }`
                                    }
                                  >
                                    <ImageIcon className="h-3 w-3 flex-shrink-0" />
                                    <span className="flex-1 truncate text-xs" title={session.title}>
                                      {session.title}
                                    </span>
                                  </NavLink>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {/* Unorganized Chats */}
          {!collapsed && unorganizedChats.length > 0 && (
            <SidebarGroup>
              <SidebarGroupLabel className="px-3 text-xs text-sidebar-foreground/60 font-medium">
                Chats
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {unorganizedChats.map((chat) => (
                    <SidebarMenuItem key={chat.id}>
                      <div className="group/chat relative">
                        <NavLink
                          to={`/chat/${chat.id}`}
                          onClick={() => handleChatSwitch(chat.id)}
                          className={({ isActive }) =>
                            `flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm ${
                              isActive
                                ? 'bg-sidebar-accent text-sidebar-foreground'
                                : 'text-sidebar-foreground hover:bg-sidebar-accent'
                            }`
                          }
                        >
                          {editingChatId === chat.id ? (
                            <input
                              type="text"
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              onBlur={() => handleRenameChat(chat.id, editingTitle)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  handleRenameChat(chat.id, editingTitle);
                                }
                              }}
                              className="flex-1 bg-transparent border-none outline-none text-sidebar-foreground px-3 py-1.5"
                              autoFocus
                            />
                          ) : (
                            <span className="flex-1 truncate px-3 py-1.5 max-w-[180px]" title={chat.title}>{chat.title}</span>
                          )}
                        </NavLink>
                        
                        {/* Edit/Delete buttons - only show on hover for this specific chat */}
                        {editingChatId !== chat.id && (
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/chat:opacity-100 transition-opacity flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 bg-sidebar-accent hover:bg-sidebar-accent"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setEditingChatId(chat.id);
                                setEditingTitle(chat.title);
                              }}
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 bg-sidebar-accent hover:bg-sidebar-accent text-destructive"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDeleteChat(chat.id);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {/* Unorganized Image Sessions */}
          {!collapsed && unorganizedImageSessions.length > 0 && (
            <SidebarGroup>
              <SidebarGroupLabel className="px-3 text-xs text-sidebar-foreground/60 font-medium">
                Image Sessions
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {unorganizedImageSessions.map((session) => (
                    <SidebarMenuItem key={session.id}>
                      <NavLink
                        to={`/image/${session.id}`}
                        className={({ isActive }) =>
                          `flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm ${
                            isActive
                              ? 'bg-sidebar-accent text-sidebar-foreground'
                              : 'text-sidebar-foreground hover:bg-sidebar-accent'
                          }`
                        }
                      >
                        <ImageIcon className="h-4 w-4 flex-shrink-0" />
                        <span className="flex-1 truncate max-w-[180px]" title={session.title}>
                          {session.title}
                        </span>
                      </NavLink>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </SidebarContent>

        <SidebarFooter className="p-2 border-t border-sidebar-border">
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className={`flex items-center gap-3 px-3 py-2 hover:bg-sidebar-accent rounded-lg transition-colors cursor-pointer w-full ${
                    collapsed ? 'justify-center' : ''
                  }`}>
                    <Avatar className="h-6 w-6">
                      {/* Show Google profile image if available */}
                      {userProfile?.avatar_url ? (
                        <img 
                          src={userProfile.avatar_url} 
                          alt="Profile" 
                          className="h-6 w-6 rounded-full object-cover"
                        />
                      ) : (
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {userProfile?.display_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    {!collapsed && (
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-sidebar-foreground font-medium truncate">
                          {userProfile?.display_name || user?.email?.split('@')[0] || 'User'}
                        </p>
                        <p className="text-xs text-sidebar-foreground/60 truncate">Free</p>
                      </div>
                    )}
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="start" className="w-56 bg-popover border-border">
                  <DropdownMenuItem onClick={() => setShowSettings(true)} className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SettingsModal 
        open={showSettings} 
        onOpenChange={setShowSettings}
      />
    </>
  );
}