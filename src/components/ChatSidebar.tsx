import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useParams, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { MessageSquare, Plus, Edit2, Trash2, Settings, LogOut, User, HelpCircle, Bot, Menu, FolderPlus, ChevronDown, ChevronRight, Briefcase, BookOpen, Code, Palette, Lightbulb, Target, Heart, Star, Rocket, MoreHorizontal, FolderOpen, FileText, Zap, Trophy, Flame, Gem, Sparkles, Search, DollarSign, CreditCard } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { supabase } from '@/integrations/supabase/client';
import { ProjectModal } from '@/components/ProjectModal';
import { AddToProjectModal } from '@/components/AddToProjectModal';
import SettingsModal from './SettingsModal';
import AuthModal from './AuthModal';
interface Chat {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  project_id?: string;
  tool_id?: string;
  tool_name?: string;
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
  sparkles: Sparkles
};
interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}
export default function ChatSidebar({
  isOpen,
  onClose
}: ChatSidebarProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [addToProjectModalOpen, setAddToProjectModalOpen] = useState<string | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingProjectTitle, setEditingProjectTitle] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const {
    user,
    signOut,
    userProfile
  } = useAuth();
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {}
  });
  const navigate = useNavigate();
  const {
    chatId
  } = useParams();
  const location = useLocation();
  const {
    state: sidebarState
  } = useSidebar();
  const collapsed = sidebarState === 'collapsed';

  // Fetch functions
  const fetchChats = async () => {
    if (!user) return;
    try {
      const {
        data: chatsData,
        error
      } = await supabase.from('chats').select('*').eq('user_id', user.id).order('updated_at', {
        ascending: false
      });
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
      const {
        data: projectsData,
        error
      } = await supabase.from('projects').select(`
          *,
          chats:chats!chats_project_id_fkey(id, title, created_at, updated_at)
        `).eq('user_id', user.id).order('created_at', {
        ascending: false
      });
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
    if (!user) {
      navigate('/');
      return;
    }
    try {
      const {
        data: newChat,
        error
      } = await supabase.from('chats').insert({
        user_id: user.id,
        title: 'New Chat'
      }).select().single();
      if (error) {
        console.error('Error creating chat:', error);
        return;
      }

      // Refresh the sidebar immediately
      fetchChats();
      navigate(`/chat/${newChat.id}`);
    } catch (error) {
      console.error('Error in handleNewChat:', error);
    }
  };
  const handleExploreTools = () => {
    navigate('/explore-tools');
  };
  const handlePricingPlans = () => {
    navigate('/pricing-plans');
  };
  const handleDeleteChat = async (chatId: string) => {
    try {
      // First delete associated images from storage
      if (user) {
        try {
          await supabase.functions.invoke('delete-chat-images', {
            body: {
              chatId,
              userId: user.id
            }
          });
        } catch (imageError) {
          console.error('Error deleting chat images:', imageError);
          // Continue with chat deletion even if image deletion fails
        }
      }

      // Then delete the chat from database
      const {
        error
      } = await supabase.from('chats').delete().eq('id', chatId);
      if (error) {
        console.error('Error deleting chat:', error);
      } else {
        fetchChats();
        fetchProjects();
        if (window.location.pathname === `/chat/${chatId}` || window.location.pathname.includes(`/${chatId}`) || window.location.pathname.endsWith(`/${chatId}`)) {
          navigate('/');
        }
      }
    } catch (error) {
      console.error('Error in handleDeleteChat:', error);
    }
  };
  const handleRenameChat = async (chatId: string, newTitle: string) => {
    try {
      const {
        error
      } = await supabase.from('chats').update({
        title: newTitle
      }).eq('id', chatId);
      if (error) {
        console.error('Error renaming chat:', error);
      } else {
        fetchChats();
        fetchProjects();
        setEditingChatId(null);
      }
    } catch (error) {
      console.error('Error in handleRenameChat:', error);
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
  const handleProjectCreated = () => {
    fetchProjects();
  };
  const handleDeleteProject = async (projectId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Project',
      description: 'Are you sure you want to delete this project? All chats in this project will also be permanently deleted.',
      onConfirm: () => executeDeleteProject(projectId)
    });
  };
  const executeDeleteProject = async (projectId: string) => {
    try {
      console.log(`[PROJECT-DELETE] Starting deletion process for project: ${projectId}`);

      // First, delete all chats associated with this project
      const {
        error: chatsError
      } = await supabase.from('chats').delete().eq('project_id', projectId);
      if (chatsError) {
        console.error('Error deleting project chats:', chatsError);
        throw chatsError;
      }
      console.log(`[PROJECT-DELETE] Successfully deleted chats for project: ${projectId}`);

      // Then delete the project itself
      const {
        error
      } = await supabase.from('projects').delete().eq('id', projectId);
      if (error) {
        console.error('Error deleting project:', error);
        throw error;
      }
      console.log(`[PROJECT-DELETE] Successfully deleted project and associated chats: ${projectId}`);
      fetchProjects();
      fetchChats();
    } catch (error: any) {
      console.error('Error deleting project:', error);
    }
  };
  const handleRenameProject = async (projectId: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    try {
      const {
        error
      } = await supabase.from('projects').update({
        title: newTitle.trim()
      }).eq('id', projectId);
      if (error) throw error;
      fetchProjects();
      setEditingProjectId(null);
      setEditingProjectTitle('');
    } catch (error: any) {
      console.error('Error renaming project:', error);
    }
  };
  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Get chats that are not in any project
  const unorganizedChats = chats.filter(chat => !chat.project_id);
  return <>
      <Sidebar className="border-r border-sidebar-border bg-sidebar" collapsible="icon">
        <SidebarHeader className="pt-5 px-2 pb-4 relative">
          <div className={`${collapsed ? 'flex justify-center' : 'flex justify-end'} mb-3`}>
            <SidebarTrigger className="h-8 w-8 p-0 bg-transparent hover:bg-sidebar-accent text-sidebar-foreground rounded-lg group flex items-center justify-center">
              <Bot className="h-5 w-5 group-hover:hidden" />
              <Menu className="h-4 w-4 hidden group-hover:block" />
            </SidebarTrigger>
          </div>

          {collapsed ? <div className="flex flex-col gap-2 items-center">
              <Button onClick={handleNewChat} className="h-12 w-12 p-0 rounded-full bg-transparent hover:bg-sidebar-accent text-sidebar-foreground transition-all duration-200" size="sm" variant="ghost" title="New Chat">
                <Plus className="h-5 w-5 flex-shrink-0" />
              </Button>
              
              {user ? <ProjectModal onProjectCreated={handleProjectCreated}>
                  <Button className="h-12 w-12 p-0 rounded-full bg-transparent hover:bg-sidebar-accent text-sidebar-foreground transition-all duration-200" size="sm" variant="ghost" title="New Project">
                    <FolderPlus className="h-5 w-5 flex-shrink-0" />
                  </Button>
                </ProjectModal> : <Button onClick={() => setShowAuthModal(true)} className="h-12 w-12 p-0 rounded-full bg-transparent hover:bg-sidebar-accent text-sidebar-foreground transition-all duration-200" size="sm" variant="ghost" title="New Project">
                  <FolderPlus className="h-5 w-5 flex-shrink-0" />
                </Button>}
            </div> : <div className="mt-1 space-y-2">
              <Button onClick={handleNewChat} className="w-full justify-start gap-2 px-3 rounded-lg bg-transparent hover:bg-sidebar-accent text-sidebar-foreground transition-all duration-200" size="sm" variant="ghost">
                <Plus className="h-4 w-4 flex-shrink-0" />
                <span className="font-medium">New Chat</span>
              </Button>


              
              {user ? <ProjectModal onProjectCreated={handleProjectCreated}>
                  <Button className="w-full justify-start gap-2 px-3 rounded-lg bg-transparent hover:bg-sidebar-accent text-sidebar-foreground transition-all duration-200" size="sm" variant="ghost">
                    <FolderPlus className="h-4 w-4 flex-shrink-0" />
                    <span className="font-medium">New Project</span>
                  </Button>
                </ProjectModal> : <Button onClick={() => setShowAuthModal(true)} className="w-full justify-start gap-2 px-3 rounded-lg bg-transparent hover:bg-sidebar-accent text-sidebar-foreground transition-all duration-200" size="sm" variant="ghost">
                  <FolderPlus className="h-4 w-4 flex-shrink-0" />
                  <span className="font-medium">New Project</span>
                </Button>}
            </div>}
        </SidebarHeader>

        <SidebarContent>
          {/* Projects */}
          {!collapsed && projects.length > 0 && <SidebarGroup>
              <SidebarGroupLabel className="px-3 text-xs text-sidebar-foreground/60 font-medium">
                Projects
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {projects.map(project => {
                const IconComponent = iconMap[project.icon as keyof typeof iconMap] || FolderOpen;
                return <SidebarMenuItem key={project.id} className="group/project relative">
                         {editingProjectId === project.id ? <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sidebar-accent">
                             <IconComponent className="w-4 h-4 flex-shrink-0" style={{
                      color: project.color
                    }} />
                             <input type="text" value={editingProjectTitle} onChange={e => setEditingProjectTitle(e.target.value)} onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleRenameProject(project.id, editingProjectTitle);
                      } else if (e.key === 'Escape') {
                        setEditingProjectId(null);
                        setEditingProjectTitle('');
                      }
                    }} onBlur={() => handleRenameProject(project.id, editingProjectTitle)} className="flex-1 bg-transparent border-none outline-none text-sm font-medium" autoFocus onFocus={e => {
                      // Position cursor at the end and make it blink
                      const length = e.target.value.length;
                      e.target.setSelectionRange(length, length);
                    }} />
                           </div> : <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground cursor-pointer transition-colors" onClick={() => navigate(`/project/${project.id}`)}>
                             <IconComponent className="w-4 h-4 flex-shrink-0" style={{
                      color: project.color
                    }} />
                             <span className="text-sm font-medium flex-1 truncate">{project.title}</span>
                           </div>}
                         
                         {/* Project Actions */}
                         <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/project:opacity-100 transition-opacity">
                           <DropdownMenu>
                             <DropdownMenuTrigger asChild>
                               <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                 <MoreHorizontal className="h-3 w-3" />
                               </Button>
                             </DropdownMenuTrigger>
                             <DropdownMenuContent>
                               <DropdownMenuItem onClick={() => {
                          setEditingProjectId(project.id);
                          setEditingProjectTitle(project.title);
                        }}>
                                 <Edit2 className="mr-2 h-3 w-3" />
                                 Rename
                               </DropdownMenuItem>
                               <DropdownMenuItem onClick={() => handleDeleteProject(project.id)} className="text-destructive">
                                 <Trash2 className="mr-2 h-3 w-3" />
                                 Delete
                               </DropdownMenuItem>
                             </DropdownMenuContent>
                           </DropdownMenu>
                         </div>
                       </SidebarMenuItem>;
              })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>}

          {/* Unorganized Chats */}
          {!collapsed && unorganizedChats.length > 0 && <SidebarGroup>
              <SidebarGroupLabel className="px-3 text-xs text-sidebar-foreground/60 font-medium">
                Recent Chats
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {unorganizedChats.slice(0, 20).map(chat => <SidebarMenuItem key={chat.id} className="group/chat relative">
                      {editingChatId === chat.id ? <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sidebar-accent">
                          <input type="text" value={editingTitle} onChange={e => setEditingTitle(e.target.value)} onKeyDown={e => handleEditKeyDown(e, chat.id)} onBlur={() => handleRenameChat(chat.id, editingTitle)} className="flex-1 bg-transparent border-none outline-none text-sm" autoFocus onFocus={e => {
                    // Position cursor at the end and make it blink
                    const length = e.target.value.length;
                    e.target.setSelectionRange(length, length);
                  }} />
                        </div> : <NavLink to={chat.tool_id ? `/${chat.tool_id}/${chat.id}` : `/chat/${chat.id}`} className={({
                  isActive
                }) => `flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${isActive ? 'bg-sidebar-accent text-sidebar-foreground' : 'text-sidebar-foreground hover:bg-sidebar-accent'}`}>
                            <span className="flex-1 truncate text-sm">{chat.title || 'New Chat'}</span>
                          </NavLink>}
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/chat:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <MoreHorizontal className="h-3 w-3" />
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
                            <DropdownMenuItem onClick={() => handleDeleteChat(chat.id)} className="text-destructive">
                              <Trash2 className="mr-2 h-3 w-3" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </SidebarMenuItem>)}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>}

        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            {/* Explore Tools */}
            {!collapsed && <SidebarMenuItem>
                <Button onClick={handleExploreTools} className="w-full justify-start gap-2 px-3 rounded-lg bg-transparent hover:bg-sidebar-accent text-sidebar-foreground transition-all duration-200" size="sm" variant="ghost">
                  <Search className="h-4 w-4" />
                  <span className="font-medium">Explore Tools</span>
                </Button>
              </SidebarMenuItem>}

            {/* Pricing Plans */}
            {!collapsed}

            {/* Auth Section */}
            <SidebarMenuItem>
              {user ? <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className={`flex items-center gap-3 px-3 py-2 hover:bg-sidebar-accent rounded-lg transition-colors cursor-pointer w-full ${collapsed ? 'justify-center' : ''}`}>
                      <Avatar className="h-6 w-6">
                        {userProfile?.avatar_url ? <img src={userProfile.avatar_url} alt="Profile" className="h-6 w-6 rounded-full object-cover" /> : <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                            {userProfile?.display_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                          </AvatarFallback>}
                      </Avatar>
                      {!collapsed && <div className="flex-1 min-w-0">
                          <p className="text-sm text-sidebar-foreground font-medium truncate">
                            {userProfile?.display_name || user?.email?.split('@')[0] || 'User'}
                          </p>
                          <p className="text-xs text-sidebar-foreground/60 truncate">Free</p>
                        </div>}
                    </div>
                  </DropdownMenuTrigger>
                   <DropdownMenuContent align="end" className="w-56">
                     <DropdownMenuItem onClick={() => setShowSettings(true)}>
                       <Settings className="mr-2 h-4 w-4" />
                       Settings
                     </DropdownMenuItem>
                     <DropdownMenuItem onClick={() => navigate('/help-center')}>
                       <HelpCircle className="mr-2 h-4 w-4" />
                       Help
                     </DropdownMenuItem>
                     <DropdownMenuSeparator />
                     <DropdownMenuItem onClick={handleSignOut}>
                       <LogOut className="mr-2 h-4 w-4" />
                       Sign Out
                     </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu> : <>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <div className={`flex items-center gap-3 px-3 py-2 hover:bg-sidebar-accent rounded-lg transition-colors cursor-pointer w-full ${collapsed ? 'justify-center' : ''}`}>
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        {!collapsed && <div className="flex-1 min-w-0">
                            <p className="text-sm text-sidebar-foreground font-medium truncate">Guest</p>
                            <p className="text-xs text-sidebar-foreground/60 truncate">Guest user</p>
                          </div>}
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem onClick={() => setShowSettings(true)}>
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/home')}>
                        <HelpCircle className="mr-2 h-4 w-4" />
                        Help
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                </>}
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      {/* Add to Project Modal */}
      {addToProjectModalOpen && <AddToProjectModal isOpen={!!addToProjectModalOpen} onClose={() => setAddToProjectModalOpen(null)} chatId={addToProjectModalOpen} onChatAddedToProject={() => {
      fetchChats();
      fetchProjects();
      setAddToProjectModalOpen(null);
    }} />}

      {/* Settings Modal */}
      <SettingsModal open={showSettings} onOpenChange={setShowSettings} />

      {/* Auth Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onSuccess={() => {
      setShowAuthModal(false);
    }} />

      {/* Confirmation Dialog */}
      <ConfirmationDialog isOpen={confirmDialog.isOpen} title={confirmDialog.title} description={confirmDialog.description} onConfirm={() => {
      confirmDialog.onConfirm();
      setConfirmDialog({
        isOpen: false,
        title: '',
        description: '',
        onConfirm: () => {}
      });
    }} onClose={() => setConfirmDialog({
      isOpen: false,
      title: '',
      description: '',
      onConfirm: () => {}
    })} variant="destructive" confirmText="Delete" />
    </>;
}