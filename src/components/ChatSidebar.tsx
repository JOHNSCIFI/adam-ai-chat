import { Plus, Settings, User, LogOut, Moon, Sun, MessageSquare, Users, Star, Crown, Search, CreditCard } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useFavoriteTools } from '@/hooks/useFavoriteTools';
import { useState, useEffect } from 'react';

interface ChatSidebarProps {
  isCollapsed: boolean;
}

export function ChatSidebar({ isCollapsed }: ChatSidebarProps) {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { favoriteTools } = useFavoriteTools();
  const [chats, setChats] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadChats();
      loadProjects();
    }
  }, [user]);

  const loadChats = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error loading chats:', error);
    } else {
      setChats(data || []);
    }
  };

  const loadProjects = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error loading projects:', error);
    } else {
      setProjects(data || []);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className={`h-full flex flex-col ${isCollapsed ? 'w-16' : 'w-64'} bg-background border-r transition-all duration-300`}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-primary-foreground" />
          </div>
          {!isCollapsed && (
            <div className="ml-2">
              <h1 className="font-semibold">AdamGPT</h1>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-2">
          {/* New Chat Button */}
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
          >
            <Plus className="w-4 h-4" />
            {!isCollapsed && <span className="font-medium">New Chat</span>}
          </button>

          {/* My Tools Section - Dynamic based on favorites */}
          {user && favoriteTools.length > 0 && (
            <div className="mt-4">
              {!isCollapsed && (
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">
                  My Tools
                </h3>
              )}
              <div className="space-y-1">
                {favoriteTools.slice(0, 5).map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => navigate('/explore-tools')}
                    className="w-full flex items-center gap-3 px-3 py-1 rounded-lg hover:bg-secondary/50 transition-colors text-sm text-muted-foreground hover:text-foreground"
                  >
                    <Star className="w-4 h-4" />
                    {!isCollapsed && <span>{tool.tool_name}</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* New Project Button - Only show if user is authenticated */}
          {user && (
            <button
              onClick={() => navigate('/projects')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
            >
              <Plus className="w-4 h-4" />
              {!isCollapsed && <span className="font-medium">New Project</span>}
            </button>
          )}

          {/* Explore Tools Button */}
          <button
            onClick={() => navigate('/explore-tools')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              location.pathname === '/explore-tools' 
                ? 'bg-primary/10 text-primary' 
                : 'hover:bg-secondary/50'
            }`}
          >
            <Search className="w-4 h-4" />
            {!isCollapsed && <span className="font-medium">Explore Tools</span>}
          </button>

          {/* Pricing Plans Button */}
          <button
            onClick={() => navigate('/pricing')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              location.pathname === '/pricing' 
                ? 'bg-primary/10 text-primary' 
                : 'hover:bg-secondary/50'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            {!isCollapsed && <span className="font-medium">Pricing Plans</span>}
          </button>

          {/* Recent Chats */}
          {user && chats.length > 0 && !isCollapsed && (
            <div className="mt-6">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">
                Recent Chats
              </h3>
              <div className="space-y-1">
                {chats.slice(0, 5).map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => navigate(`/chat/${chat.id}`)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors text-sm text-left"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span className="truncate">{chat.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom section with profile/auth */}
      <div className="p-4 border-t">
        {user ? (
          <div className="space-y-2">
            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {!isCollapsed && <span>Toggle Theme</span>}
            </button>

            {/* Settings */}
            <button
              onClick={() => navigate('/settings')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <Settings className="w-4 h-4" />
              {!isCollapsed && <span>Settings</span>}
            </button>

            {/* Profile */}
            <button
              onClick={() => navigate('/profile')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <User className="w-4 h-4" />
              {!isCollapsed && <span>Profile</span>}
            </button>

            {/* Sign Out */}
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
            >
              <LogOut className="w-4 h-4" />
              {!isCollapsed && <span>Sign Out</span>}
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {!isCollapsed && <span>Toggle Theme</span>}
            </button>

            {/* Only show sign in/up buttons when sidebar is not collapsed */}
            {!isCollapsed && (
              <>
                {/* Sign In */}
                <button
                  onClick={() => navigate('/auth')}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span>Sign In</span>
                </button>

                {/* Sign Up */}
                <button
                  onClick={() => navigate('/auth')}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg border hover:bg-secondary/50 transition-colors"
                >
                  <Users className="w-4 h-4" />
                  <span>Sign Up</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}