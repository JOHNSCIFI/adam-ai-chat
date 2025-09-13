import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Settings,
  HelpCircle,
  LogOut,
  ChevronUp,
  Edit3,
  Trash2,
  Check,
  X,
  Menu,
  Archive,
  Clock,
  Filter
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
}

export function ResponsiveSidebar({ className }: ResponsiveSidebarProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [hoveredChatId, setHoveredChatId] = useState<string | null>(null);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  
  const { user } = useAuth();
  const { isMobile, isTablet } = useResponsive();
  const navigate = useNavigate();
  const location = useLocation();

  const isMobileOrTablet = isMobile || isTablet;

  // Filter chats based on search query
  const filteredChats = chats.filter(chat =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Separate recent and older chats
  const recentChats = filteredChats.filter(chat => {
    const chatDate = new Date(chat.created_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return chatDate >= weekAgo;
  });

  const olderChats = filteredChats.filter(chat => {
    const chatDate = new Date(chat.created_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return chatDate < weekAgo;
  });

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

  const renderChatList = (chatList: Chat[], title: string, icon: React.ReactNode) => (
    <div className="mb-6">
      <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {icon}
        <span>{title}</span>
        <span className="text-xs">({chatList.length})</span>
      </div>
      <div className="space-y-1">
        {chatList.length === 0 ? (
          <div className="px-3 py-4 text-center">
            <p className="text-xs text-muted-foreground">No {title.toLowerCase()} yet</p>
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
                  <MessageSquare className="h-3 w-3 text-foreground/60 flex-shrink-0" />
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
                      `flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 flex-1 min-h-[44px] ${
                        isActive 
                          ? "bg-primary/10 text-primary font-medium border border-primary/20" 
                          : "hover:bg-accent/50 text-foreground"
                      }`
                    }
                  >
                    <MessageSquare className="h-4 w-4 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{chat.title}</p>
                      <p className="text-xs text-muted-foreground">{formatChatDate(chat.created_at)}</p>
                    </div>
                  </NavLink>
                  
                  {!isMobileOrTablet && hoveredChatId === chat.id && (
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
    </div>
  );

  const sidebarContent = (
    <div className="flex flex-col h-full bg-sidebar-background">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-sm">
            <MessageSquare className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-sidebar-foreground">adamGPT</h1>
            <p className="text-xs text-sidebar-muted-foreground">AI Assistant</p>
          </div>
        </div>
        
        {/* New Chat Button */}
        <Button 
          onClick={handleNewChat}
          className="w-full justify-start bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground shadow-sm transition-all duration-200 hover:shadow-md min-h-[44px]"
          size="default"
        >
          <Plus className="h-4 w-4 mr-2" />
          <span>New Chat</span>
        </Button>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-sidebar-accent border-sidebar-border min-h-[40px]"
          />
        </div>
      </div>

      {/* Chat Lists */}
      <div className="flex-1 overflow-y-auto p-2">
        {searchQuery ? (
          renderChatList(filteredChats, 'Search Results', <Search className="h-3 w-3" />)
        ) : (
          <>
            {renderChatList(recentChats, 'Recent', <Clock className="h-3 w-3" />)}
            {olderChats.length > 0 && renderChatList(olderChats, 'Previous', <Archive className="h-3 w-3" />)}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="w-full justify-start p-3 h-auto hover:bg-sidebar-accent rounded-lg transition-colors min-h-[52px]"
            >
              <div className="flex items-center gap-3 w-full">
                <Avatar className="h-8 w-8 border-2 border-primary/20">
                  <AvatarImage src="" />
                  <AvatarFallback className="text-xs bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-semibold">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-sidebar-foreground">{getUserDisplayName()}</p>
                  <p className="text-xs text-sidebar-muted-foreground">Free Plan</p>
                </div>
                <ChevronUp className="h-4 w-4 text-sidebar-muted-foreground transition-transform group-hover:text-sidebar-foreground" />
              </div>
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
      <div className={`w-80 h-full border-r border-sidebar-border bg-sidebar-background ${className}`}>
        {sidebarContent}
      </div>
      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
}