import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useParams, useLocation } from 'react-router-dom';
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
  User,
  HelpCircle,
  Bot,
  Menu,
  ImageIcon,
  FolderPlus,
  ChevronDown,
  ChevronRight,
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
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ProjectModal } from '@/components/ProjectModal';
import { AddToProjectModal } from '@/components/AddToProjectModal';
import { ImageGenerationModal } from '@/components/ImageGenerationModal';
import SettingsModal from './SettingsModal';

interface Chat {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  project_id?: string;
}


interface Project {
  id: string;
  title: string;
  icon: string;
  color: string;
  description?: string;
  created_at: string;
  chats?: Chat[];
}

const iconMap = {
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

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatSidebar({ isOpen, onClose }: ChatSidebarProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showImageGeneration, setShowImageGeneration] = useState(false);
  const [addToProjectModalOpen, setAddToProjectModalOpen] = useState<string | null>(null);
  
  const { user, signOut, userProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { chatId } = useParams();
  const location = useLocation();
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
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching chats:', error);
        return;
      }

      setChats(chatsData || []);
    } catch (error) {
      console.error('Error in fetchChats:', error);
    }
  };


  const fetchProjects = async () => {
    if (!user) return;
    
    try {
      const { data: projectsData, error } = await supabase
        .from('projects')
        .select(`
          *,
          chats:chats!chats_project_id_fkey(id, title, created_at, updated_at)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching projects:', error);
        return;
      }

      setProjects(projectsData || []);
    } catch (error) {
      console.error('Error in fetchProjects:', error);
    }
  };

  // Load data on mount and user change
  useEffect(() => {
    if (user) {
      fetchChats();
      fetchProjects();
    }
  }, [user]);

  // Listen for chat refresh events
  useEffect(() => {
    const handleChatRefresh = () => {
      fetchChats();
      fetchProjects();
    };

    window.addEventListener('force-chat-refresh', handleChatRefresh);
    return () => {
      window.removeEventListener('force-chat-refresh', handleChatRefresh);
    };
  }, []);

  const handleNewChat = async () => {
    if (!user) return;

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

      // Refresh the sidebar immediately
      fetchChats();
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

  const handleImageGeneration = () => {
    setShowImageGeneration(true);
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
        fetchChats();
        fetchProjects();
        toast({
          title: "Chat deleted",
          description: "Chat has been deleted successfully.",
        });
        
        if (window.location.pathname === `/chat/${chatId}`) {
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

  const handleRenameChat = async (chatId: string, newTitle: string) => {
    try {
      const { error } = await supabase
        .from('chats')
        .update({ title: newTitle })
        .eq('id', chatId);

      if (error) {
        console.error('Error renaming chat:', error);
        toast({
          title: "Error renaming chat",
          description: error.message,
          variant: "destructive",
        });
      } else {
        fetchChats();
        fetchProjects();
        setEditingChatId(null);
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
    }
  };

  const startEditing = (chatId: string, currentTitle: string) => {
    setEditingChatId(chatId);
    setEditingTitle(currentTitle);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent, chatId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleRenameChat(chatId, editingTitle);
    } else if (e.key === 'Escape') {
      setEditingChatId(null);
    }
  };


  const toggleProjectExpanded = (projectId: string) => {
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

  // Get chats that are not in any project
  const unorganizedChats = chats.filter(chat => !chat.project_id);

  return (
    <>
      <Sidebar className="border-r border-sidebar-border bg-sidebar" collapsible="icon">
        <SidebarHeader className="pt-5 px-2 pb-4 relative">
          <div className={`${collapsed ? 'flex justify-center' : 'flex justify-end'} mb-3`}>
            <SidebarTrigger className="h-8 w-8 p-0 bg-transparent hover:bg-sidebar-accent text-sidebar-foreground rounded-lg group flex items-center justify-center">
              <Bot className="h-5 w-5 group-hover:hidden" />
              <Menu className="h-4 w-4 hidden group-hover:block" />
            </SidebarTrigger>
          </div>

          {collapsed ? (
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
                onClick={handleImageGeneration}
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
                onClick={handleImageGeneration}
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

        <SidebarContent>
          {/* Projects */}
          {!collapsed && projects.length > 0 && (
            <SidebarGroup>
              <SidebarGroupLabel className="px-3 text-xs text-sidebar-foreground/60 font-medium">
                Projects
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {projects.map((project) => {
                    const IconComponent = iconMap[project.icon as keyof typeof iconMap] || Briefcase;
                    const isExpanded = expandedProjects.has(project.id);
                    
                    return (
                      <div key={project.id} className="space-y-1">
                        <SidebarMenuItem>
                          <div 
                            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground cursor-pointer transition-colors"
                            onClick={(e) => {
                              if (e.detail === 1) {
                                // Single click - expand/collapse
                                toggleProjectExpanded(project.id);
                              } else if (e.detail === 2) {
                                // Double click - navigate to project
                                navigate(`/${project.title.toLowerCase().replace(/\s+/g, '-')}`);
                              }
                            }}
                          >
                            <div className={`w-2 h-2 rounded-full`} style={{ backgroundColor: project.color }} />
                            <IconComponent className="h-4 w-4 text-sidebar-foreground" />
                            <span className="text-sm font-medium flex-1 truncate">{project.title}</span>
                            {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                          </div>
                        </SidebarMenuItem>
                        
                        {isExpanded && (
                          <div className="ml-6 space-y-1">
                            {/* Project Chats */}
                            {project.chats?.map((chat) => (
                              <div key={chat.id} className="group/chat relative">
                                {editingChatId === chat.id ? (
                                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-sidebar-accent">
                                    <MessageSquare className="h-3 w-3 flex-shrink-0" />
                                    <input
                                      type="text"
                                      value={editingTitle}
                                      onChange={(e) => setEditingTitle(e.target.value)}
                                      onKeyDown={(e) => handleEditKeyDown(e, chat.id)}
                                      onBlur={() => handleRenameChat(chat.id, editingTitle)}
                                      className="flex-1 bg-transparent border-none outline-none text-sm"
                                      autoFocus
                                    />
                                  </div>
                                ) : (
                                  <NavLink
                                    to={`/chat/${chat.id}`}
                                    className={({ isActive }) =>
                                      `flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm ${
                                        isActive
                                          ? 'bg-sidebar-accent text-sidebar-foreground'
                                          : 'text-sidebar-foreground hover:bg-sidebar-accent'
                                      }`
                                    }
                                  >
                                    <MessageSquare className="h-3 w-3 flex-shrink-0" />
                                    <span className="flex-1 truncate">{chat.title}</span>
                                  </NavLink>
                                )}
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/chat:opacity-100 transition-opacity">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                        <Edit2 className="h-3 w-3" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                      <DropdownMenuItem
                                        onClick={() => startEditing(chat.id, chat.title)}
                                      >
                                        <Edit2 className="mr-2 h-3 w-3" />
                                        Rename
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => handleDeleteChat(chat.id)}
                                        className="text-destructive"
                                      >
                                        <Trash2 className="mr-2 h-3 w-3" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                            ))}
                            
                          </div>
                        )}
                      </div>
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
                Recent Chats
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {unorganizedChats.slice(0, 20).map((chat) => (
                    <SidebarMenuItem key={chat.id} className="group/chat relative">
                      {editingChatId === chat.id ? (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sidebar-accent">
                          <MessageSquare className="h-4 w-4 flex-shrink-0" />
                          <input
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onKeyDown={(e) => handleEditKeyDown(e, chat.id)}
                            onBlur={() => handleRenameChat(chat.id, editingTitle)}
                            className="flex-1 bg-transparent border-none outline-none text-sm"
                            autoFocus
                          />
                        </div>
                      ) : (
                        <NavLink
                          to={`/chat/${chat.id}`}
                          className={({ isActive }) =>
                            `flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                              isActive
                                ? 'bg-sidebar-accent text-sidebar-foreground'
                                : 'text-sidebar-foreground hover:bg-sidebar-accent'
                            }`
                          }
                        >
                          <MessageSquare className="h-4 w-4 flex-shrink-0" />
                          <span className="flex-1 truncate text-sm">{chat.title}</span>
                        </NavLink>
                      )}
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/chat:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <Edit2 className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => startEditing(chat.id, chat.title)}>
                              <Edit2 className="mr-2 h-3 w-3" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setAddToProjectModalOpen(chat.id)}>
                              <FolderPlus className="mr-2 h-3 w-3" />
                              Add to Project
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteChat(chat.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-3 w-3" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className={`flex items-center gap-3 px-3 py-2 hover:bg-sidebar-accent rounded-lg transition-colors cursor-pointer w-full ${
                    collapsed ? 'justify-center' : ''
                  }`}>
                    <Avatar className="h-6 w-6">
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
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowSettings(true)}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/help')}>
                    <HelpCircle className="mr-2 h-4 w-4" />
                    Help
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      {/* Add to Project Modal */}
      {addToProjectModalOpen && (
        <AddToProjectModal 
          isOpen={!!addToProjectModalOpen}
          onClose={() => setAddToProjectModalOpen(null)}
          chatId={addToProjectModalOpen}
          onChatAddedToProject={() => {
            fetchChats();
            fetchProjects();
            setAddToProjectModalOpen(null);
          }}
        />
      )}

      {/* Settings Modal */}
      <SettingsModal 
        open={showSettings} 
        onOpenChange={setShowSettings} 
      />

      {/* Image Generation Modal */}
      <ImageGenerationModal 
        isOpen={showImageGeneration}
        onClose={() => setShowImageGeneration(false)}
      />
    </>
  );
}