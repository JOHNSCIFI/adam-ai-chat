import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  MessageSquare, 
  Plus, 
  Settings,
  HelpCircle,
  LogOut,
  ChevronUp,
  Edit3,
  Trash2,
  Check,
  X,
  Menu,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import SettingsModal from '@/components/SettingsModal';
import { useResponsive } from '@/hooks/use-responsive';

interface Chat {
  id: string;
  title: string;
  created_at: string;
}

interface ResponsiveSidebarProps {
  className?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function ResponsiveSidebar({ className, isCollapsed = false, onToggleCollapse }: ResponsiveSidebarProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [hoveredChatId, setHoveredChatId] = useState<string | null>(null);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  const { user } = useAuth();
  const { isMobile, isTablet } = useResponsive();
  const navigate = useNavigate();
  const location = useLocation();

  const isMobileOrTablet = isMobile || isTablet;


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
          const newChat = payload.new as Chat;
          setChats(current => {
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
      .limit(50);

    if (error) {
      console.error('Error fetching chats:', error);
    } else {
      setChats(data || []);
    }
  };

  const handleNewChat = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('chats')
      .insert([{ user_id: user.id, title: 'New Chat' }])
      .select()
      .single();

    if (error) {
      console.error('Error creating chat:', error);
    } else {
      setChats(current => {
        if (current.find(chat => chat.id === data.id)) {
          return current;
        }
        return [data, ...current];
      });
      
      navigate(`/chat/${data.id}`);
      if (isMobileOrTablet) {
        setIsDrawerOpen(false);
      }
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const handleRenameChat = async (chatId: string, newTitle: string) => {
    if (!newTitle.trim()) return;

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
    const { error } = await supabase
      .from('chats')
      .delete()
      .eq('id', chatId)
      .eq('user_id', user?.id);

    if (error) {
      console.error('Error deleting chat:', error);
    } else {
      setChats(chats.filter(chat => chat.id !== chatId));
      
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

  const getUserInitials = () => {
    const email = user?.email || '';
    return email.slice(0, 2).toUpperCase();
  };

  const getUserDisplayName = () => {
    const email = user?.email || '';
    return email.split('@')[0];
  };

  const formatChatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const renderChatList = (chatList: Chat[]) => (
    <div className="space-y-1">
      {chatList.length === 0 ? (
        <div className="px-3 py-4 text-center">
          <p className="text-xs text-muted-foreground">No chats yet</p>
        </div>
      ) : (
        chatList.map((chat) => (
          <div 
            key={chat.id}
            className="group relative mx-2"
            onMouseEnter={() => setHoveredChatId(chat.id)}
            onMouseLeave={() => setHoveredChatId(null)}
          >
            {editingChatId === chat.id ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/50">
                {!isCollapsed && <MessageSquare className="h-3 w-3 text-foreground/60 flex-shrink-0" />}
                {!isCollapsed && (
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
                    className="h-6 text-xs bg-background border-border flex-1 min-h-[32px]"
                    autoFocus
                  />
                )}
                <div className="flex gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-primary hover:text-primary-foreground rounded-md min-h-[32px] min-w-[32px]"
                    onClick={() => handleRenameChat(chat.id, editTitle)}
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-muted rounded-md min-h-[32px] min-w-[32px]"
                    onClick={cancelEditing}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center group">
                <NavLink 
                  to={`/chat/${chat.id}`} 
                  onClick={() => isMobileOrTablet && setIsDrawerOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-4 px-4 py-4 rounded-xl transition-all duration-300 flex-1 min-h-[52px] group hover:scale-105 ${
                      isActive 
                        ? "bg-gradient-to-r from-primary/15 via-primary/10 to-primary/5 text-primary font-semibold border border-primary/20 shadow-lg ring-2 ring-primary/10" 
                        : "hover:bg-gradient-to-r hover:from-sidebar-accent/50 hover:to-sidebar-accent/30 text-foreground hover:shadow-md hover:ring-1 hover:ring-primary/10"
                    }`
                  }
                  title={isCollapsed ? chat.title : undefined}
                >
                  <MessageSquare className={`h-5 w-5 flex-shrink-0 transition-all duration-300 ${isCollapsed ? '' : 'group-hover:scale-110'}`} />
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate font-medium group-hover:text-primary transition-colors">{chat.title}</p>
                      <p className="text-xs text-muted-foreground font-medium">{formatChatDate(chat.created_at)}</p>
                    </div>
                  )}
                </NavLink>
                
                {!isMobileOrTablet && !isCollapsed && hoveredChatId === chat.id && (
                  <div className="absolute right-2 flex gap-1 bg-background/80 backdrop-blur-sm rounded-md p-1 shadow-sm">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-accent rounded-sm"
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
                      className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground rounded-sm"
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
        ))
      )}
    </div>
  );

  const sidebarContent = (
    <div className="flex flex-col h-screen bg-gradient-to-b from-sidebar-background to-sidebar-background/95 border-r border-sidebar-border/50">
      {/* Header */}
      <div className={`${isCollapsed ? 'p-3' : 'p-6'} border-b border-sidebar-border/50 bg-gradient-to-r from-primary/5 to-primary/10`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center mb-3' : 'gap-4 mb-6'}`}>
          <div className="w-10 h-10 bg-gradient-to-br from-primary via-primary/90 to-primary/80 rounded-xl flex items-center justify-center shadow-lg ring-2 ring-primary/20">
            <MessageSquare className="w-5 h-5 text-primary-foreground drop-shadow-sm" />
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="text-xl font-bold text-sidebar-foreground bg-gradient-to-r from-sidebar-foreground to-sidebar-foreground/80 bg-clip-text">adamGPT</h1>
              <p className="text-sm text-sidebar-muted-foreground font-medium">AI Assistant</p>
            </div>
          )}
        </div>
        
        {/* Collapse/Expand Button */}
        {!isMobileOrTablet && onToggleCollapse && (
          <div className={`${isCollapsed ? 'mb-2' : 'mb-4'} flex justify-${isCollapsed ? 'center' : 'end'}`}>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
              className="h-8 w-8 p-0 hover:bg-accent"
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}
        
        {/* New Chat Button */}
        <Button 
          onClick={handleNewChat}
          className={`${isCollapsed ? 'w-10 h-10 p-0' : 'w-full justify-start py-3'} bg-gradient-to-r from-primary via-primary to-primary/90 hover:from-primary/95 hover:via-primary/90 hover:to-primary/85 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 ring-2 ring-primary/20 hover:ring-primary/30 min-h-[48px] font-medium`}
          size="default"
          title={isCollapsed ? "New Chat" : undefined}
        >
          <Plus className={`${isCollapsed ? 'h-5 w-5' : 'h-4 w-4 mr-3'} drop-shadow-sm`} />
          {!isCollapsed && <span className="text-sm">New Chat</span>}
        </Button>
      </div>

      {/* Chat Lists */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        {renderChatList(chats)}
      </div>

      {/* Footer */}
      <div className={`${isCollapsed ? 'p-3' : 'p-4'} border-t border-sidebar-border/50 bg-gradient-to-r from-sidebar-background to-sidebar-background/95`}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className={`${isCollapsed ? 'w-10 h-10 p-0' : 'w-full justify-start p-4 h-auto'} hover:bg-sidebar-accent/50 rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-105 ring-1 ring-transparent hover:ring-primary/20 min-h-[56px] group`}
              title={isCollapsed ? getUserDisplayName() : undefined}
            >
              {isCollapsed ? (
                <Avatar className="h-8 w-8 border-2 border-primary/30 shadow-md">
                  <AvatarImage src="" />
                  <AvatarFallback className="text-sm bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground font-bold shadow-inner">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className="flex items-center gap-4 w-full">
                  <Avatar className="h-10 w-10 border-2 border-primary/30 shadow-lg">
                    <AvatarImage src="" />
                    <AvatarFallback className="text-sm bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground font-bold shadow-inner">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold text-sidebar-foreground group-hover:text-primary transition-colors">{getUserDisplayName()}</p>
                    <p className="text-xs text-sidebar-muted-foreground font-medium">Free Plan</p>
                  </div>
                  <ChevronUp className="h-4 w-4 text-sidebar-muted-foreground transition-all duration-300 group-hover:text-primary group-hover:scale-110" />
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            side="top" 
            align="start" 
            className="w-64 mb-2 bg-popover border shadow-lg z-50"
          >
            <DropdownMenuItem onClick={() => setSettingsOpen(true)} className="cursor-pointer min-h-[40px]">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <NavLink to="/help" className="cursor-pointer min-h-[40px]">
                <HelpCircle className="mr-2 h-4 w-4" />
                Help & Support
              </NavLink>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive min-h-[40px]">
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  if (isMobileOrTablet) {
    return (
      <>
        <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
          <DrawerTrigger asChild>
            <Button variant="ghost" size="sm" className="fixed top-4 left-4 z-40 lg:hidden bg-background/80 backdrop-blur-sm border border-border shadow-lg min-h-[40px] min-w-[40px]">
              <Menu className="h-4 w-4" />
            </Button>
          </DrawerTrigger>
          <DrawerContent className="h-[80vh] bg-sidebar-background">
            <DrawerHeader className="sr-only">
              <DrawerTitle>Navigation Menu</DrawerTitle>
            </DrawerHeader>
            {sidebarContent}
          </DrawerContent>
        </Drawer>
        <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
      </>
    );
  }

  return (
    <>
      <div 
        className={`${isCollapsed ? 'w-16' : 'w-80'} h-screen border-r border-sidebar-border bg-sidebar-background transition-all duration-300 ${className}`}
        style={{ '--sidebar-width': isCollapsed ? '64px' : '320px' } as React.CSSProperties}
      >
        {sidebarContent}
      </div>
      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
}