import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  MessageSquare, 
  Plus, 
  Settings,
  HelpCircle,
  LogOut,
  ChevronDown,
  Edit3,
  Trash2,
  Check,
  X,
  Menu,
  ChevronLeft,
  ChevronRight,
  User,
  Search,
  BookOpen,
  Sparkles,
  FolderOpen,
  Crown,
  Palette
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
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  
  const { user, userProfile, signOut } = useAuth();
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
      channel.unsubscribe();
    };
  }, [user]);

  const fetchChats = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching chats:', error);
      return;
    }

    setChats(data || []);
  };

  const createNewChat = async () => {
    if (!user) return;

    const newChatId = crypto.randomUUID();
    const { error } = await supabase
      .from('chats')
      .insert({
        id: newChatId,
        user_id: user.id,
        title: 'New chat'
      });

    if (error) {
      console.error('Error creating chat:', error);
      return;
    }

    navigate(`/chat/${newChatId}`);
    if (isMobileOrTablet) {
      setIsDrawerOpen(false);
    }
  };

  const deleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const { error } = await supabase
      .from('chats')
      .delete()
      .eq('id', chatId);

    if (error) {
      console.error('Error deleting chat:', error);
      return;
    }

    if (location.pathname === `/chat/${chatId}`) {
      navigate('/');
    }
  };

  const updateChatTitle = async (chatId: string, newTitle: string) => {
    const { error } = await supabase
      .from('chats')
      .update({ title: newTitle })
      .eq('id', chatId);

    if (error) {
      console.error('Error updating chat title:', error);
      return;
    }

    setEditingChatId(null);
    setEditTitle('');
  };

  const handleEditStart = (chat: Chat, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingChatId(chat.id);
    setEditTitle(chat.title);
  };

  const handleEditSubmit = (chatId: string) => {
    if (editTitle.trim()) {
      updateChatTitle(chatId, editTitle.trim());
    } else {
      setEditingChatId(null);
      setEditTitle('');
    }
  };

  const handleEditCancel = () => {
    setEditingChatId(null);
    setEditTitle('');
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
    setProfileMenuOpen(false);
  };

  const getDisplayName = () => {
    if (userProfile?.display_name) return userProfile.display_name;
    if (user?.email) return user.email;
    return 'User';
  };

  const getInitials = () => {
    const name = getDisplayName();
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const navigationItems = [
    { icon: MessageSquare, label: 'New chat', action: createNewChat, variant: 'primary' as const },
    { icon: Search, label: 'Search chats', action: () => {}, disabled: true },
    { icon: BookOpen, label: 'Library', action: () => {}, disabled: true },
    { icon: Sparkles, label: 'Sora', action: () => {}, disabled: true },
    { icon: FolderOpen, label: 'GPTs', action: () => {}, disabled: true },
    { icon: FolderOpen, label: 'New project', action: () => {}, disabled: true },
    { icon: Plus, label: 'Investing', action: () => {}, disabled: true },
  ];

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-sidebar-background">
      {/* Header with ChatGPT logo */}
      <div className="flex items-center justify-between px-3 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center">
            <MessageSquare className="h-5 w-5 text-sidebar-foreground" />
          </div>
          {(!isCollapsed || isMobileOrTablet) && (
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-sidebar-foreground">ChatGPT</span>
              <ChevronDown className="h-4 w-4 text-sidebar-muted-foreground" />
            </div>
          )}
        </div>
        {!isMobileOrTablet && onToggleCollapse && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="h-6 w-6 p-0 text-sidebar-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent"
          >
            {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
          </Button>
        )}
      </div>

      {/* Navigation Items */}
      <div className="px-3 space-y-1">
        {navigationItems.map((item, index) => (
          <Button
            key={index}
            onClick={item.action}
            disabled={item.disabled}
            variant={item.variant === 'primary' ? 'default' : 'ghost'}
            className={`w-full justify-start h-9 text-sm ${
              item.variant === 'primary' 
                ? 'bg-primary hover:bg-primary/90 text-primary-foreground' 
                : 'text-sidebar-foreground hover:bg-sidebar-accent'
            } ${item.disabled ? 'opacity-50 cursor-default' : ''}`}
          >
            <item.icon className="h-4 w-4" />
            {(!isCollapsed || isMobileOrTablet) && <span className="ml-3">{item.label}</span>}
          </Button>
        ))}
      </div>

      {/* Chats Section */}
      <div className="flex-1 overflow-y-auto px-3 mt-6">
        {(!isCollapsed || isMobileOrTablet) && chats.length > 0 && (
          <div className="text-xs font-medium text-sidebar-muted-foreground mb-2 px-2">Chats</div>
        )}
        <div className="space-y-1">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={`group relative rounded-md transition-colors ${
                location.pathname === `/chat/${chat.id}` 
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground' 
                  : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              }`}
              onMouseEnter={() => setHoveredChatId(chat.id)}
              onMouseLeave={() => setHoveredChatId(null)}
            >
              {editingChatId === chat.id ? (
                <div className="flex items-center gap-2 p-2">
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleEditSubmit(chat.id);
                      if (e.key === 'Escape') handleEditCancel();
                    }}
                    className="h-7 bg-background border-border text-xs"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEditSubmit(chat.id)}
                    className="h-7 w-7 p-0 text-primary hover:bg-primary/10"
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleEditCancel}
                    className="h-7 w-7 p-0 text-muted-foreground hover:bg-accent"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <NavLink
                  to={`/chat/${chat.id}`}
                  className="flex items-center gap-3 px-3 py-2 text-sm rounded-md"
                  onClick={() => isMobileOrTablet && setIsDrawerOpen(false)}
                >
                  <MessageSquare className="h-4 w-4 flex-shrink-0 text-sidebar-muted-foreground" />
                  {(!isCollapsed || isMobileOrTablet) && (
                    <>
                      <span className="flex-1 truncate text-sidebar-foreground">{chat.title}</span>
                      {hoveredChatId === chat.id && (
                        <div className="flex items-center gap-1 opacity-100">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => handleEditStart(chat, e)}
                            className="h-6 w-6 p-0 text-sidebar-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent"
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => deleteChat(chat.id, e)}
                            className="h-6 w-6 p-0 text-sidebar-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </NavLink>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* User Profile Section */}
      <div className="border-t border-sidebar-border p-3">
        <DropdownMenu open={profileMenuOpen} onOpenChange={setProfileMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start p-2 h-auto hover:bg-sidebar-accent rounded-md"
            >
              <div className="flex items-center gap-3 min-w-0 w-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={userProfile?.avatar_url} />
                  <AvatarFallback className="bg-gradient-to-br from-orange-400 to-red-400 text-white text-xs font-medium">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                {(!isCollapsed || isMobileOrTablet) && (
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-sidebar-foreground truncate">
                          {getDisplayName()}
                        </p>
                        <p className="text-xs text-sidebar-muted-foreground">Free</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-sidebar-muted-foreground hover:text-sidebar-foreground h-6 px-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle upgrade click
                        }}
                      >
                        Upgrade
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            side="top"
            className="w-64 mb-2 bg-popover border-border shadow-lg rounded-lg"
          >
            <div className="px-3 py-3 border-b border-border">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={userProfile?.avatar_url} />
                  <AvatarFallback className="bg-gradient-to-br from-orange-400 to-red-400 text-white font-medium">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {getDisplayName()}
                  </p>
                  <p className="text-xs text-muted-foreground">Free plan</p>
                </div>
              </div>
            </div>
            <DropdownMenuItem className="cursor-pointer flex items-center gap-3">
              <Crown className="h-4 w-4" />
              <span>Upgrade plan</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer flex items-center gap-3">
              <Palette className="h-4 w-4" />
              <span>Customize ChatGPT</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setSettingsOpen(true)}
              className="cursor-pointer flex items-center gap-3"
            >
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => navigate('/help')}
              className="cursor-pointer flex items-center gap-3"
            >
              <HelpCircle className="h-4 w-4" />
              <span>Help</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleSignOut}
              className="cursor-pointer text-destructive focus:text-destructive flex items-center gap-3"
            >
              <LogOut className="h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );

  if (isMobileOrTablet) {
    return (
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="fixed top-4 left-4 z-50 bg-background/80 backdrop-blur-sm border border-border"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </DrawerTrigger>
        <DrawerContent className="h-[85vh] bg-sidebar-background">
          <DrawerHeader className="pb-0">
            <DrawerTitle className="sr-only">Navigation</DrawerTitle>
          </DrawerHeader>
          <SidebarContent />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <aside className={`h-screen ${isCollapsed ? 'w-16' : 'w-80'} transition-all duration-300`}>
      <SidebarContent />
    </aside>
  );
}