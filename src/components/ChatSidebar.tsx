import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  MessageSquare, 
  Search, 
  Library, 
  Star, 
  Users, 
  FolderOpen,
  Settings,
  HelpCircle,
  LogOut,
  User,
  ChevronUp,
  Edit3,
  Trash2,
  Check,
  X
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import SettingsModal from '@/components/SettingsModal';

interface Chat {
  id: string;
  title: string;
  created_at: string;
}

export function ChatSidebar() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [hoveredChatId, setHoveredChatId] = useState<string | null>(null);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [chatsPanelCollapsed, setChatsPanelCollapsed] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useSidebar();

  const collapsed = state === 'collapsed';

  useEffect(() => {
    if (user) {
      fetchChats();
    }
  }, [user]);

  // Set up real-time subscription for chats
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('user-chats')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chats',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Trigger: New Chat Created');
          const newChat = payload.new as Chat;
          setChats(current => {
            // Check if chat already exists to prevent duplicates
            if (current.find(chat => chat.id === newChat.id)) {
              return current;
            }
            return [newChat, ...current];
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chats',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Trigger: Chat Renamed');
          setChats(current => 
            current.map(chat => 
              chat.id === payload.new.id ? payload.new as Chat : chat
            )
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'chats',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Trigger: Chat Deleted');
          setChats(current => 
            current.filter(chat => chat.id !== payload.old.id)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchChats = async () => {
    const { data, error } = await supabase
      .from('chats')
      .select('id, title, created_at')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching chats:', error);
    } else {
      setChats(data || []);
    }
  };

  const handleNewChat = async () => {
    if (!user) return;

    console.log('Trigger: Create New Chat');
    const { data, error } = await supabase
      .from('chats')
      .insert([{ user_id: user.id, title: 'New Chat' }])
      .select()
      .single();

    if (error) {
      console.error('Error creating chat:', error);
    } else {
      // Immediately add to local state for instant UI update
      setChats(current => {
        // Check if already exists to prevent duplicates
        if (current.find(chat => chat.id === data.id)) {
          return current;
        }
        return [data, ...current];
      });
      
      // Navigate to the new chat
      navigate(`/chat/${data.id}`);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const handleRenameChat = async (chatId: string, newTitle: string) => {
    if (!newTitle.trim()) return;

    console.log('Trigger: Rename Chat Name');
    const { error } = await supabase
      .from('chats')
      .update({ title: newTitle.trim() })
      .eq('id', chatId)
      .eq('user_id', user?.id);

    if (error) {
      console.error('Error renaming chat:', error);
    } else {
      setChats(chats.map(chat => 
        chat.id === chatId ? { ...chat, title: newTitle.trim() } : chat
      ));
      setEditingChatId(null);
      setEditTitle('');
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    console.log('Trigger: Delete Chat');
    const { error } = await supabase
      .from('chats')
      .delete()
      .eq('id', chatId)
      .eq('user_id', user?.id);

    if (error) {
      console.error('Error deleting chat:', error);
    } else {
      setChats(chats.filter(chat => chat.id !== chatId));
      
      // If we're currently viewing the deleted chat, navigate to home
      if (location.pathname === `/chat/${chatId}`) {
        navigate('/');
      }
    }
  };

  const startEditing = (chatId: string, currentTitle: string) => {
    setEditingChatId(chatId);
    setEditTitle(currentTitle);
  };

  const cancelEditing = () => {
    setEditingChatId(null);
    setEditTitle('');
  };

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
      : "hover:bg-sidebar-accent/50";

  const getUserInitials = () => {
    const email = user?.email || '';
    return email.slice(0, 2).toUpperCase();
  };

  const getUserDisplayName = () => {
    const email = user?.email || '';
    return email.split('@')[0];
  };

  return (
    <>
      <Sidebar className="border-r border-sidebar-border" collapsible="icon">
        <SidebarHeader className="p-4 border-b border-sidebar-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-sm">
                <MessageSquare className="w-4 h-4 text-primary-foreground" />
              </div>
              {!collapsed && (
                <div>
                  <h1 className="text-lg font-bold text-sidebar-foreground">adamGPT</h1>
                  <p className="text-xs text-sidebar-muted-foreground">AI Assistant</p>
                </div>
              )}
            </div>
            <SidebarTrigger className="hover:bg-sidebar-accent rounded-lg p-1.5 transition-colors" />
          </div>
        </SidebarHeader>

        <SidebarContent className="px-3 py-2">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <Button 
                    onClick={handleNewChat}
                    className="w-full justify-start bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground shadow-sm transition-all duration-200 hover:shadow-md"
                    size="default"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {!collapsed && <span>New Chat</span>}
                  </Button>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator />

          <SidebarGroup className="mt-4">
            <div className="flex items-center justify-between px-2 py-2">
              <span className="text-xs font-semibold text-sidebar-foreground uppercase tracking-wider">
                Recent Chats
              </span>
              {!collapsed && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setChatsPanelCollapsed(!chatsPanelCollapsed)}
                  className="h-6 w-6 p-0 hover:bg-sidebar-accent text-sidebar-muted-foreground hover:text-sidebar-foreground rounded-md transition-colors"
                >
                  <ChevronUp className={`h-3 w-3 transition-transform duration-200 ${chatsPanelCollapsed ? 'rotate-180' : ''}`} />
                </Button>
              )}
            </div>
              
            <div className={`transition-all duration-300 ease-out ${chatsPanelCollapsed ? 'max-h-0 opacity-0 overflow-hidden' : 'max-h-[500px] opacity-100'}`}>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {chats.length === 0 ? (
                    <div className="px-2 py-4 text-center">
                      <p className="text-xs text-sidebar-muted-foreground">No chats yet</p>
                      <p className="text-xs text-sidebar-muted-foreground mt-1">Start a new conversation</p>
                    </div>
                  ) : (
                    chats.map((chat) => (
                      <SidebarMenuItem key={chat.id}>
                        <div 
                          className="group relative"
                          onMouseEnter={() => setHoveredChatId(chat.id)}
                          onMouseLeave={() => setHoveredChatId(null)}
                        >
                          {editingChatId === chat.id ? (
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sidebar-accent/50">
                              <MessageSquare className="h-3 w-3 text-sidebar-foreground/60 flex-shrink-0" />
                              <Input
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleRenameChat(chat.id, editTitle);
                                  } else if (e.key === 'Escape') {
                                    cancelEditing();
                                  }
                                }}
                                onBlur={() => handleRenameChat(chat.id, editTitle)}
                                className="h-6 text-xs bg-background border-border flex-1"
                                autoFocus
                              />
                              <div className="flex gap-1 flex-shrink-0">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 w-5 p-0 hover:bg-primary hover:text-primary-foreground rounded-md"
                                  onClick={() => handleRenameChat(chat.id, editTitle)}
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 w-5 p-0 hover:bg-muted rounded-md"
                                  onClick={cancelEditing}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center group">
                              <SidebarMenuButton asChild className="flex-1 pr-8">
                                <NavLink 
                                  to={`/chat/${chat.id}`} 
                                  className={({ isActive }) =>
                                    `flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                                      isActive 
                                        ? "bg-primary/10 text-primary font-medium border border-primary/20" 
                                        : "hover:bg-sidebar-accent/50 text-sidebar-foreground"
                                    }`
                                  }
                                >
                                  <MessageSquare className="h-3 w-3 flex-shrink-0" />
                                  {!collapsed && <span className="truncate text-sm">{chat.title}</span>}
                                </NavLink>
                              </SidebarMenuButton>
                              
                              {!collapsed && hoveredChatId === chat.id && (
                                <div className="absolute right-2 flex gap-1 bg-sidebar-background/80 backdrop-blur-sm rounded-md p-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-5 w-5 p-0 hover:bg-sidebar-accent rounded-sm"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      startEditing(chat.id, chat.title);
                                    }}
                                  >
                                    <Edit3 className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-5 w-5 p-0 hover:bg-destructive hover:text-destructive-foreground rounded-sm"
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
                           )}
                         </div>
                       </SidebarMenuItem>
                     ))
                   )}
                </SidebarMenu>
              </SidebarGroupContent>
            </div>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-3 border-t border-sidebar-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full justify-start p-3 h-auto hover:bg-sidebar-accent rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3 w-full">
                  <Avatar className="h-8 w-8 border-2 border-primary/20">
                    <AvatarImage src="" />
                    <AvatarFallback className="text-xs bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-semibold">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  {!collapsed && (
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold text-sidebar-foreground">{getUserDisplayName()}</p>
                      <p className="text-xs text-sidebar-muted-foreground">Free Plan</p>
                    </div>
                  )}
                  {!collapsed && <ChevronUp className="h-4 w-4 text-sidebar-muted-foreground transition-transform group-hover:text-sidebar-foreground" />}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              side="top" 
              align="start" 
              className="w-64 mb-2 bg-popover border shadow-lg"
            >
              <DropdownMenuItem onClick={() => setSettingsOpen(true)} className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <NavLink to="/help" className="cursor-pointer">
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Help & Support
                </NavLink>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
}