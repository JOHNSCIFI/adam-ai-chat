import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
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
  ChevronUp
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const { state } = useSidebar();

  const collapsed = state === 'collapsed';

  useEffect(() => {
    if (user) {
      fetchChats();
    }
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

    const { data, error } = await supabase
      .from('chats')
      .insert([{ user_id: user.id, title: 'New Chat' }])
      .select()
      .single();

    if (error) {
      console.error('Error creating chat:', error);
    } else {
      navigate(`/chat/${data.id}`);
      fetchChats();
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
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
                    {!collapsed && "New chat"}
                  </Button>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild
                    size={collapsed ? "sm" : "default"}
                  >
                    <button className="text-sidebar-foreground hover:bg-sidebar-accent">
                      <Search className="h-4 w-4" />
                      {!collapsed && <span>Search chats</span>}
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild
                    size={collapsed ? "sm" : "default"}
                  >
                    <button className="text-sidebar-foreground hover:bg-sidebar-accent">
                      <Library className="h-4 w-4" />
                      {!collapsed && <span>Library</span>}
                    </button>
                  </SidebarMenuButton>
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
                      <SidebarMenuButton asChild>
                        <NavLink 
                          to={`/chat/${chat.id}`} 
                          className={getNavCls}
                        >
                          <MessageSquare className="h-4 w-4" />
                          <span className="truncate">{chat.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
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