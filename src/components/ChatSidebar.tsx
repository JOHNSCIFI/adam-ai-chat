import React, { useState, useEffect, useRef } from 'react';
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
  X,
  ChevronLeft,
  ChevronRight,
  Crown
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
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { state, toggleSidebar } = useSidebar();

  const collapsed = state === 'collapsed';
  const minWidth = 240;
  const maxWidth = 400;

  useEffect(() => {
    if (user) {
      fetchChats();
    }
  }, [user]);

  // Handle resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = e.clientX;
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, minWidth, maxWidth]);

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

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

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
      <div className="relative">
        <Sidebar 
          ref={sidebarRef}
          className="border-r-0 bg-sidebar-background"
          style={{ 
            width: collapsed ? '64px' : `${sidebarWidth}px`,
            transition: collapsed ? 'width 0.2s ease-in-out' : 'none'
          }}
        >
          {/* ChatGPT Header */}
          <SidebarHeader className="p-4 border-b border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-primary-foreground" />
                </div>
                {!collapsed && (
                  <h1 className="text-lg font-semibold text-foreground">ChatGPT</h1>
                )}
              </div>
              {!collapsed && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleSidebar}
                  className="h-8 w-8 p-0 hover:bg-white/10 text-muted-foreground hover:text-foreground"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="px-3 py-4">
            {/* Main Controls */}
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-2">
                  {/* New Chat */}
                  <SidebarMenuItem>
                    <Button 
                      onClick={handleNewChat}
                      className="w-full justify-start bg-transparent border border-white/10 hover:bg-white/5 text-foreground hover:text-foreground h-10"
                      size="default"
                    >
                      <Plus className={collapsed ? "h-4 w-4" : "h-4 w-4 mr-3"} />
                      {!collapsed && "New chat"}
                    </Button>
                  </SidebarMenuItem>
                  
                  {/* Search */}
                  {!collapsed && (
                    <SidebarMenuItem>
                      <Button 
                        variant="ghost"
                        className="w-full justify-start h-10 text-muted-foreground hover:text-foreground hover:bg-white/5"
                      >
                        <Search className="h-4 w-4 mr-3" />
                        Search
                      </Button>
                    </SidebarMenuItem>
                  )}
                  
                  {/* Library */}
                  {!collapsed && (
                    <SidebarMenuItem>
                      <Button 
                        variant="ghost"
                        className="w-full justify-start h-10 text-muted-foreground hover:text-foreground hover:bg-white/5"
                      >
                        <Library className="h-4 w-4 mr-3" />
                        Library
                      </Button>
                    </SidebarMenuItem>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Divider */}
            <div className="my-4 border-t border-white/5" />

            {/* Recent Chats */}
            {!collapsed && (
              <SidebarGroup>
                <div className="flex items-center justify-between px-3 py-1 mb-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Recent
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setChatsPanelCollapsed(!chatsPanelCollapsed)}
                    className="h-6 w-6 p-0 hover:bg-white/10 text-muted-foreground hover:text-foreground"
                  >
                    <ChevronUp className={`h-3 w-3 transition-transform duration-200 ${chatsPanelCollapsed ? 'rotate-180' : ''}`} />
                  </Button>
                </div>
                
                <div className={`transition-all duration-300 ease-out ${chatsPanelCollapsed ? 'max-h-0 opacity-0 overflow-hidden' : 'max-h-[60vh] opacity-100 overflow-y-auto'}`}>
                  <SidebarGroupContent>
                    <SidebarMenu className="space-y-1">
                      {chats.map((chat) => (
                        <SidebarMenuItem key={chat.id}>
                          <div 
                            className="group relative"
                            onMouseEnter={() => setHoveredChatId(chat.id)}
                            onMouseLeave={() => setHoveredChatId(null)}
                          >
                            {editingChatId === chat.id ? (
                              <div className="flex items-center gap-2 px-3 py-2 text-sm">
                                <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
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
                                  className="h-7 text-sm bg-white/5 border-white/10 text-foreground"
                                  autoFocus
                                />
                                <div className="flex gap-1 flex-shrink-0">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 hover:bg-white/10"
                                    onClick={() => handleRenameChat(chat.id, editTitle)}
                                  >
                                    <Check className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 hover:bg-white/10"
                                    onClick={cancelEditing}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <SidebarMenuButton asChild className="flex-1 pr-0 h-10 rounded-lg">
                                  <NavLink 
                                    to={`/chat/${chat.id}`} 
                                    className={({ isActive }) =>
                                      isActive 
                                        ? "bg-white/10 text-foreground font-medium rounded-lg" 
                                        : "hover:bg-white/5 text-muted-foreground hover:text-foreground rounded-lg"
                                    }
                                  >
                                    <MessageSquare className="h-4 w-4" />
                                    <span className="truncate text-sm">{chat.title}</span>
                                  </NavLink>
                                </SidebarMenuButton>
                                
                                {hoveredChatId === chat.id && (
                                  <div className="flex gap-1 pr-2 flex-shrink-0">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0 hover:bg-white/10 opacity-70 hover:opacity-100"
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
                                      className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground opacity-70 hover:opacity-100"
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
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </div>
              </SidebarGroup>
            )}
          </SidebarContent>

          {/* Bottom Section */}
          <SidebarFooter className="p-3 border-t border-white/5 mt-auto">
            {/* Secondary Controls */}
            {!collapsed && (
              <div className="space-y-1 mb-3">
                <Button 
                  variant="ghost"
                  className="w-full justify-start h-10 text-muted-foreground hover:text-foreground hover:bg-white/5"
                  onClick={() => setSettingsOpen(true)}
                >
                  <Settings className="h-4 w-4 mr-3" />
                  Settings
                </Button>
                <Button 
                  variant="ghost"
                  className="w-full justify-start h-10 text-muted-foreground hover:text-foreground hover:bg-white/5"
                  asChild
                >
                  <NavLink to="/help">
                    <HelpCircle className="h-4 w-4 mr-3" />
                    Help & FAQ
                  </NavLink>
                </Button>
              </div>
            )}

            {/* Profile Section */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start p-3 h-auto hover:bg-white/5 rounded-lg"
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                      {getUserInitials()}
                    </div>
                    {!collapsed && (
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-foreground">{getUserDisplayName()}</p>
                        <p className="text-xs text-muted-foreground">Free plan</p>
                      </div>
                    )}
                    {!collapsed && <ChevronUp className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                side="top" 
                align="start" 
                className="w-64 mb-2 bg-popover border-white/10"
              >
                {/* Upgrade Button */}
                <div className="p-2 mb-2">
                  <Button className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-medium rounded-lg h-10 shadow-lg">
                    <Crown className="mr-2 h-4 w-4" />
                    Upgrade to Pro
                  </Button>
                </div>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem asChild>
                  <NavLink to="/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    My account
                  </NavLink>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        {/* Resize Handle */}
        {!collapsed && (
          <div
            className="absolute top-0 right-0 w-1 h-full cursor-col-resize bg-transparent hover:bg-primary/20 transition-colors z-10"
            onMouseDown={handleMouseDown}
          />
        )}

        {/* Collapsed Toggle */}
        {collapsed && (
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="absolute top-4 right-2 h-8 w-8 p-0 hover:bg-white/10 text-muted-foreground hover:text-foreground z-10"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
}