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
          setChats(current => [payload.new as Chat, ...current]);
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
      // Navigate immediately to the new chat
      navigate(`/chat/${data.id}`);
      // The real-time subscription will handle updating the sidebar
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
      <Sidebar className="border-r border-sidebar-border">
        <SidebarHeader className="p-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-sidebar-primary rounded-sm flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-sidebar-primary-foreground" />
            </div>
            {!collapsed && (
              <h1 className="text-lg font-semibold text-sidebar-foreground">adamGPT</h1>
            )}
          </div>
        </SidebarHeader>

        <SidebarContent className="px-2">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <Button 
                    onClick={handleNewChat}
                    className="w-full justify-start bg-sidebar-primary hover:bg-sidebar-primary/90 text-sidebar-primary-foreground"
                    size={collapsed ? "sm" : "default"}
                  >
                    <Plus className={collapsed ? "h-4 w-4" : "h-4 w-4 mr-2"} />
                    {!collapsed && "Create New Chat"}
                  </Button>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator />

          {!collapsed && chats.length > 0 && (
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {chats.map((chat) => (
                    <SidebarMenuItem key={chat.id}>
                      <div 
                        className="group relative"
                        onMouseEnter={() => setHoveredChatId(chat.id)}
                        onMouseLeave={() => setHoveredChatId(null)}
                      >
                        {editingChatId === chat.id ? (
                          <div className="flex items-center gap-1 px-2 py-1.5 text-sm">
                            <MessageSquare className="h-4 w-4 text-sidebar-foreground/60 flex-shrink-0" />
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
                              className="h-6 text-xs bg-sidebar-accent border-sidebar-border"
                              autoFocus
                            />
                            <div className="flex gap-1 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-sidebar-accent"
                                onClick={() => handleRenameChat(chat.id, editTitle)}
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-sidebar-accent"
                                onClick={cancelEditing}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <SidebarMenuButton asChild className="flex-1 pr-0">
                              <NavLink 
                                to={`/chat/${chat.id}`} 
                                className={({ isActive }) =>
                                  isActive 
                                    ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium shadow-sm" 
                                    : "hover:bg-sidebar-accent/50"
                                }
                              >
                                <MessageSquare className="h-4 w-4" />
                                <span className="truncate">{chat.title}</span>
                              </NavLink>
                            </SidebarMenuButton>
                            
                            {hoveredChatId === chat.id && (
                              <div className="flex gap-1 pr-2 flex-shrink-0">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 hover:bg-sidebar-accent opacity-70 hover:opacity-100"
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
            </SidebarGroup>
          )}
        </SidebarContent>

        <SidebarFooter className="p-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full justify-start p-2 h-auto hover:bg-sidebar-accent"
              >
                <div className="flex items-center gap-3 w-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" />
                    <AvatarFallback className="text-xs bg-sidebar-primary text-sidebar-primary-foreground">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  {!collapsed && (
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-sidebar-foreground">{getUserDisplayName()}</p>
                      <p className="text-xs text-sidebar-foreground/60">Free</p>
                    </div>
                  )}
                  {!collapsed && <ChevronUp className="h-4 w-4 text-sidebar-foreground/60" />}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              side="top" 
              align="start" 
              className="w-64 mb-2"
            >
              <DropdownMenuItem asChild>
                <NavLink to="/profile" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </NavLink>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <NavLink to="/help" className="cursor-pointer">
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Help
                </NavLink>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
}