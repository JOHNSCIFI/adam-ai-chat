import React from 'react';
import { X, User, Mail, Download, Moon, Sun, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from 'next-themes';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface ProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileModal({ open, onOpenChange }: ProfileModalProps) {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const getUserInitials = () => {
    return user?.email?.slice(0, 2).toUpperCase() || 'U';
  };

  const getUserDisplayName = () => {
    return user?.email?.split('@')[0] || 'User';
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
    onOpenChange(false);
  };

  const handleExportData = async () => {
    // TODO: Implement data export functionality
    console.log('Export data functionality to be implemented');
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-4 w-4" />;
      case 'dark':
        return <Moon className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const getThemeLabel = () => {
    switch (theme) {
      case 'light':
        return 'Light Mode';
      case 'dark':
        return 'Dark Mode';
      default:
        return 'System';
    }
  };

  const cycleTheme = () => {
    const themes = ['system', 'light', 'dark'];
    const currentIndex = themes.indexOf(theme || 'system');
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* User Info */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-card border">
            <Avatar className="h-16 w-16 border-4 border-primary/20">
              <AvatarImage src="" />
              <AvatarFallback className="text-lg bg-gradient-primary text-white font-bold">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">{getUserDisplayName()}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                {user?.email}
              </div>
              <div className="mt-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                  Free Plan
                </span>
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Preferences</h4>
            
            {/* Theme Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
              <div className="flex items-center gap-3">
                {getThemeIcon()}
                <div>
                  <Label className="text-sm font-medium">Appearance</Label>
                  <p className="text-xs text-muted-foreground">{getThemeLabel()}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={cycleTheme}
                className="h-8"
              >
                Switch
              </Button>
            </div>

            {/* Data Export */}
            <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
              <div className="flex items-center gap-3">
                <Download className="h-4 w-4" />
                <div>
                  <Label className="text-sm font-medium">Export Data</Label>
                  <p className="text-xs text-muted-foreground">Download your chat history</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportData}
                className="h-8"
              >
                Export
              </Button>
            </div>
          </div>

          {/* Account Actions */}
          <div className="space-y-3 pt-4 border-t">
            <Button
              variant="outline"
              className="w-full justify-center"
              onClick={() => navigate('/settings')}
            >
              Account Settings
            </Button>
            <Button
              variant="destructive"
              className="w-full justify-center"
              onClick={handleSignOut}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}