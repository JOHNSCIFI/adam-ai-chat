import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Settings,
  User,
  LogOut,
  Edit3,
  Trash2,
  Check,
  X,
  Clock,
  Archive,
  Menu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface Chat {
  id: string;
  title: string;
  created_at: string;
}

interface MobileSidebarProps {
  onOpenProfile: () => void;
  onOpenSettings: () => void;
}

export function MobileSidebar({ onOpenProfile, onOpenSettings }: MobileSidebarProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredChatId, setHoveredChatId] = useState<string | null>(null);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Filter chats based on search query
  const filteredChats = chats.filter(chat =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Separate recent and older chats
  const recentChats = filteredChats.filter(chat => {
    const chatDate = new Date(chat.created_at);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return chatDate >= sevenDaysAgo;
  });

  const olderChats = filteredChats.filter(chat => {
    const chatDate = new Date(chat.created_at);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return chatDate < sevenDaysAgo;
  });

  useEffect(() => {
    if (user) {
      fetchChats();
      setupRealtimeSubscription();
    }
  }, [user]);

  const fetchChats = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('chats')
      .select('id, title, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      setChats(data);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!user) return;

    const channel = supabase
      .channel(`mobile-user-chats-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chats',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        const newChat = payload.new as Chat;
        setChats(current => {
          if (current.find(chat => chat.id === newChat.id)) {
            return current;
          }
          return [newChat, ...current];
        });
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'chats',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        setChats(current => 
          current.map(chat => 
            chat.id === payload.new.id ? payload.new as Chat : chat
          )
        );
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'chats',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        setChats(current => 
          current.filter(chat => chat.id !== payload.old.id)
        );
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleNewChat = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('chats')
      .insert([{ user_id: user.id, title: 'New Chat' }])
      .select()
      .single();

    if (!error && data) {
      navigate(`/chat/${data.id}`);
      setIsOpen(false);
    }
  };

  const handleRenameChat = async (chatId: string, newTitle: string) => {
    if (!newTitle.trim() || !user) return;

    const { error } = await supabase
      .from('chats')
      .update({ title: newTitle.trim() })
      .eq('id', chatId)
      .eq('user_id', user.id);

    if (!error) {
      setEditingChatId(null);
      setEditTitle('');
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('chats')
      .delete()
      .eq('id', chatId)
      .eq('user_id', user.id);

    if (!error && location.pathname === `/chat/${chatId}`) {
      navigate('/');
      setIsOpen(false);
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

  const formatChatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getUserInitials = () => {
    return user?.email?.slice(0, 2).toUpperCase() || 'U';
  };

  const getUserDisplayName = () => {
    return user?.email?.split('@')[0] || 'User';
  };

  const renderChatList = (chatList: Chat[], title: string, icon: React.ReactNode) => {
    if (chatList.length === 0) return null;

    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {icon}
          <span>{title}</span>
          <span className="bg-accent px-1.5 py-0.5 rounded text-xs">
            {chatList.length}
          </span>
        </div>
        <div className="space-y-1">
          {chatList.map((chat) => (
            <div 
              key={chat.id}
              className="group relative"
              onTouchStart={() => setHoveredChatId(chat.id)}
              onTouchEnd={() => setHoveredChatId(null)}
            >
              {editingChatId === chat.id ? (
                <div className="flex items-center gap-2 px-3 py-2 mx-2 rounded-lg bg-accent">
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
                    className="h-8 text-sm bg-background border-border flex-1"
                    autoFocus
                  />
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-primary hover:text-primary-foreground"
                      onClick={() => handleRenameChat(chat.id, editTitle)}
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={cancelEditing}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center mx-2">
                  <NavLink 
                    to={`/chat/${chat.id}`} 
                    onClick={() => setIsOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-4 rounded-lg transition-all duration-200 flex-1 ${
                        isActive 
                          ? "bg-primary text-primary-foreground shadow-custom-sm" 
                          : "hover:bg-accent text-foreground"
                      }`
                    }
                  >
                    <MessageSquare className="h-4 w-4 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{chat.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatChatDate(chat.created_at)}
                      </p>
                    </div>
                  </NavLink>
                  
                  {hoveredChatId === chat.id && (
                    <div className="flex gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 opacity-60 hover:opacity-100"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          startEditing(chat.id, chat.title);
                        }}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 opacity-60 hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDeleteChat(chat.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="fixed top-4 left-4 z-50 lg:hidden bg-background/95 backdrop-blur-sm border shadow-custom-md hover:shadow-custom-lg"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0 bg-background">
        <div className="flex flex-col h-full">
          {/* Header */}
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-primary rounded-xl flex items-center justify-center shadow-custom-sm">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <div className="text-left">
                <h1 className="text-lg font-bold">adamGPT</h1>
                <p className="text-xs text-muted-foreground">AI Assistant</p>
              </div>
            </SheetTitle>
          </SheetHeader>

          {/* New Chat Button */}
          <div className="p-4 border-b">
            <Button 
              onClick={handleNewChat}
              className="w-full justify-start bg-gradient-primary hover:opacity-90 text-white shadow-custom-sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Chat
            </Button>
          </div>

          {/* Search */}
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
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
                {renderChatList(olderChats, 'Previous', <Archive className="h-3 w-3" />)}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t space-y-2">
            {/* Profile Button */}
            <Button
              variant="ghost"
              onClick={() => {
                onOpenProfile();
                setIsOpen(false);
              }}
              className="w-full justify-start p-3 h-auto"
            >
              <Avatar className="h-8 w-8 border-2 border-primary/20">
                <AvatarImage src="" />
                <AvatarFallback className="text-xs bg-gradient-primary text-white font-semibold">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left ml-3">
                <p className="text-sm font-semibold">{getUserDisplayName()}</p>
                <p className="text-xs text-muted-foreground">Free Plan</p>
              </div>
            </Button>

            {/* Settings Button */}
            <Button
              variant="ghost"
              onClick={() => {
                onOpenSettings();
                setIsOpen(false);
              }}
              className="w-full justify-start"
            >
              <Settings className="h-4 w-4 mr-3" />
              Settings
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}