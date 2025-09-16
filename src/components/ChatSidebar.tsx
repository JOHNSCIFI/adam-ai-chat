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
  X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import SettingsModal from './SettingsModal';

interface Chat {
  id: string;
  title: string;
  created_at: string;
}

export function ChatSidebar() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  
  const { user, signOut, userProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { chatId } = useParams();
  const { state: sidebarState } = useSidebar();
  const collapsed = sidebarState === 'collapsed';

  useEffect(() => {
    if (user) {
      fetchChats();
      
      // Set up real-time subscription
      const subscription = supabase
        .channel('chats-changes')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'chats',
            filter: `user_id=eq.${user.id}`
          }, 
          (payload) => {
            console.log('ChatSidebar: Received real-time update:', payload);
            fetchChats();
          }
        )
        .subscribe();

      // Listen for forced refresh events from main page
      const handleForceRefresh = () => {
        console.log('ChatSidebar: Forcing refresh due to new chat creation');
        fetchChats();
      };
      
      window.addEventListener('force-chat-refresh', handleForceRefresh);

      return () => {
        subscription.unsubscribe();
        window.removeEventListener('force-chat-refresh', handleForceRefresh);
      };
    }
  }, [user]);

  const fetchChats = async () => {
    if (!user) return;

    console.log('ChatSidebar: Fetching chats for user:', user.id);
    const { data, error } = await supabase
      .from('chats')
      .select('id, title, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && data) {
      console.log('ChatSidebar: Fetched chats:', data);
      setChats(data);
    } else if (error) {
      console.error('ChatSidebar: Error fetching chats:', error);
    }
  };

  const handleNewChat = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('chats')
      .insert([{
        user_id: user.id,
        title: 'New Chat'
      }])
      .select()
      .single();

    if (!error && data) {
      // Immediately update the chats list to show the new chat
      fetchChats();
      navigate(`/chat/${data.id}`);
    }
  };

  const handleRenameChat = async (chatId: string, newTitle: string) => {
    if (!newTitle.trim()) return;

    const { error } = await supabase
      .from('chats')
      .update({ title: newTitle.trim() })
      .eq('id', chatId);

    if (!error) {
      setChats(prev => prev.map(chat => 
        chat.id === chatId ? { ...chat, title: newTitle.trim() } : chat
      ));
    }

    setEditingChatId(null);
    setEditingTitle('');
  };

  const handleDeleteChat = async (chatId: string) => {
    const { error } = await supabase
      .from('chats')
      .delete()
      .eq('id', chatId);

    if (!error) {
      setChats(prev => {
        const updatedChats = prev.filter(chat => chat.id !== chatId);
        
        // If this was the last chat and we're in settings, redirect to home
        if (updatedChats.length === 0 && window.location.pathname === '/settings') {
          navigate('/');
        }
        
        return updatedChats;
      });
      
      // Navigate to home if we're currently viewing the deleted chat
      if (window.location.pathname.includes(chatId)) {
        navigate('/');
      }
    }
  };

  const handleChatSwitch = async (newChatId: string) => {
    // Check if current chat is empty and delete it
    if (chatId && chatId !== newChatId) {
      const { data: messages } = await supabase
        .from('messages')
        .select('id')
        .eq('chat_id', chatId)
        .limit(1);

      // If no messages, delete the empty chat
      if (messages && messages.length === 0) {
        await supabase
          .from('chats')
          .delete()
          .eq('id', chatId);
        
        // Update the chats list to remove the deleted chat
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
            // Collapsed state: center new chat button
            <div className="flex justify-center">
              <Button 
                onClick={handleNewChat}
                className="h-12 w-12 p-0 rounded-full bg-transparent hover:bg-sidebar-accent text-sidebar-foreground transition-all duration-200"
                size="sm"
                variant="ghost"
              >
                <Plus className="h-5 w-5 flex-shrink-0" />
              </Button>
            </div>
          ) : (
            // Expanded state: new chat button with text
            <div className="mt-1">
              <Button 
                onClick={handleNewChat}
                className="ml-1 h-12 w-full justify-start gap-2 px-3 rounded-full bg-transparent hover:bg-sidebar-accent text-sidebar-foreground transition-all duration-200"
                size="sm"
                variant="ghost"
              >
                <Plus className="h-5 w-5 flex-shrink-0" />
                <span className="font-medium">New Chat</span>
              </Button>
            </div>
          )}
        </SidebarHeader>

        <SidebarContent className="px-2">

          {/* Recent Chats */}
          {!collapsed && (
            <SidebarGroup>
              <SidebarGroupLabel className="px-3 text-xs text-sidebar-foreground/60 font-medium">
                Chats
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {chats.map((chat) => (
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