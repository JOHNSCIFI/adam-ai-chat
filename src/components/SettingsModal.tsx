import React, { useState } from 'react';
import { X, Settings, Bell, User, Plug, Shield, UserCheck, Download, LogOut, Trash2, Check, ChevronDown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const settingsCategories = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'personalization', label: 'Personalization', icon: User },
  { id: 'apps', label: 'Connected apps', icon: Plug },
  { id: 'data', label: 'Data controls', icon: Shield },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'account', label: 'Account', icon: UserCheck },
];

const accentColors = [
  { id: 'green', label: 'Default', color: '#10B981' },
  { id: 'blue', label: 'Blue', color: '#3B82F6' },
  { id: 'purple', label: 'Purple', color: '#8B5CF6' },
  { id: 'yellow', label: 'Yellow', color: '#F59E0B' },
  { id: 'pink', label: 'Pink', color: '#EC4899' },
  { id: 'orange', label: 'Orange', color: '#F97316' },
];

export default function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const [activeCategory, setActiveCategory] = useState('general');
  const { theme, setTheme, accentColor, setAccentColor } = useTheme();
  const { user, signOut } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleExportData = async () => {
    try {
      if (!user) return;
      
      const { data: chats } = await supabase
        .from('chats')
        .select('*, messages(*)')
        .eq('user_id', user.id);
      
      const exportData = {
        chats,
        exportDate: new Date().toISOString(),
        userId: user.id
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chatgpt-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Data exported successfully');
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      
      const response = await fetch('https://lciaiunzacgvvbvcshdh.supabase.co/functions/v1/delete-account', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete account');
      }

      toast.success('Account deleted successfully');
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLogoutAllDevices = async () => {
    try {
      await supabase.auth.signOut({ scope: 'global' });
      toast.success('Logged out from all devices');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to logout from all devices');
    }
  };

  const renderGeneralSettings = () => (
    <div className="space-y-8">
      {/* Theme Setting */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-[hsl(var(--text))]">Theme</label>
        <Select value={theme} onValueChange={setTheme}>
          <SelectTrigger className="w-48 h-10 bg-[hsl(var(--surface))] border-[hsl(var(--border))] text-[hsl(var(--text))] rounded-md">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[hsl(var(--surface))] border-[hsl(var(--border))] rounded-md z-50">
            <SelectItem value="light" className="text-[hsl(var(--text))] hover:bg-[hsl(var(--sidebar-hover))] rounded-sm">Light</SelectItem>
            <SelectItem value="dark" className="text-[hsl(var(--text))] hover:bg-[hsl(var(--sidebar-hover))] rounded-sm">Dark</SelectItem>
            <SelectItem value="system" className="text-[hsl(var(--text))] hover:bg-[hsl(var(--sidebar-hover))] rounded-sm">System</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Accent Color Setting */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-[hsl(var(--text))]">Accent color</label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="w-48 h-10 justify-between bg-[hsl(var(--surface))] border-[hsl(var(--border))] text-[hsl(var(--text))] hover:bg-[hsl(var(--sidebar-hover))] rounded-md px-3"
            >
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: accentColors.find(c => c.id === accentColor)?.color }}
                />
                <span className="text-sm">{accentColors.find(c => c.id === accentColor)?.label}</span>
              </div>
              <ChevronDown className="w-4 h-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            className="w-48 bg-[hsl(var(--surface))] border-[hsl(var(--border))] rounded-md shadow-modal z-50 p-1"
            align="start"
          >
            {accentColors.map((color) => (
              <DropdownMenuItem
                key={color.id}
                onClick={() => setAccentColor(color.id as any)}
                className="flex items-center justify-between px-3 py-2.5 text-[hsl(var(--text))] hover:bg-[hsl(var(--sidebar-hover))] cursor-pointer rounded-sm"
              >
                <div className="flex items-center gap-2.5">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color.color }}
                  />
                  <span className="text-sm">{color.label}</span>
                </div>
                {accentColor === color.id && (
                  <Check className="w-4 h-4 text-[hsl(var(--accent))]" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  const renderCategoryContent = () => {
    switch (activeCategory) {
      case 'general':
        return renderGeneralSettings();
      case 'notifications':
        return <div className="text-[hsl(var(--muted))] text-sm">Notification settings coming soon...</div>;
      case 'personalization':
        return <div className="text-[hsl(var(--muted))] text-sm">Personalization settings coming soon...</div>;
      case 'apps':
        return <div className="text-[hsl(var(--muted))] text-sm">Connected apps settings coming soon...</div>;
      case 'data':
        return (
          <div className="space-y-6">
            <div className="border border-[hsl(var(--border))] rounded-lg p-4 bg-[hsl(var(--surface))]">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-[hsl(var(--text))]">Export data</h3>
                  <p className="text-sm text-[hsl(var(--muted))]">Download your chat history and data</p>
                </div>
                <Button
                  onClick={handleExportData}
                  variant="outline"
                  className="bg-[hsl(var(--surface))] border-[hsl(var(--border))] text-[hsl(var(--text))] hover:bg-[hsl(var(--sidebar-hover))] rounded-md px-4 py-2"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </div>
        );
      case 'security':
        return (
          <div className="space-y-6">
            <div className="border border-[hsl(var(--border))] rounded-lg p-4 bg-[hsl(var(--surface))]">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-[hsl(var(--text))]">Login methods</h3>
                  <p className="text-sm text-[hsl(var(--muted))]">Manage your authentication methods</p>
                </div>
                <div className="text-sm text-[hsl(var(--muted))]">
                  {user?.app_metadata?.provider === 'google' ? 'Google' : 'Email'}
                </div>
              </div>
            </div>
            
            <div className="border border-[hsl(var(--border))] rounded-lg p-4 bg-[hsl(var(--surface))]">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-[hsl(var(--text))]">Log out all devices</h3>
                  <p className="text-sm text-[hsl(var(--muted))]">Sign out from all devices and sessions</p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="bg-[hsl(var(--surface))] border-[hsl(var(--border))] text-[hsl(var(--text))] hover:bg-[hsl(var(--sidebar-hover))] rounded-md px-4 py-2"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Log out all
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-[hsl(var(--surface))] border-[hsl(var(--border))] rounded-lg">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-[hsl(var(--text))]">Log out all devices?</AlertDialogTitle>
                      <AlertDialogDescription className="text-[hsl(var(--muted))]">
                        This will sign you out from all devices and sessions. You'll need to sign in again.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-transparent border-[hsl(var(--border))] text-[hsl(var(--text))] hover:bg-[hsl(var(--sidebar-hover))]">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleLogoutAllDevices} 
                        className="bg-[hsl(var(--danger))] hover:bg-[hsl(var(--danger))]/90 text-white"
                      >
                        Log out all
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        );
      case 'account':
        return (
          <div className="space-y-6">
            <div className="border border-[hsl(var(--danger))]/20 rounded-lg p-4 bg-[hsl(var(--danger))]/5">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-[hsl(var(--text))]">Delete account</h3>
                  <p className="text-sm text-[hsl(var(--muted))]">Permanently delete your account and all data</p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="border-[hsl(var(--danger))] text-[hsl(var(--danger))] hover:bg-[hsl(var(--danger))]/10 rounded-md px-4 py-2"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-[hsl(var(--surface))] border-[hsl(var(--border))] rounded-lg">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-[hsl(var(--text))]">Delete your account?</AlertDialogTitle>
                      <AlertDialogDescription className="text-[hsl(var(--muted))]">
                        This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-transparent border-[hsl(var(--border))] text-[hsl(var(--text))] hover:bg-[hsl(var(--sidebar-hover))]">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDeleteAccount} 
                        disabled={isDeleting}
                        className="bg-[hsl(var(--danger))] hover:bg-[hsl(var(--danger))]/90 text-white"
                      >
                        {isDeleting ? 'Deleting...' : 'Delete account'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full h-[600px] bg-[hsl(var(--bg))] border-[hsl(var(--border))] p-0 animate-scale-in rounded-lg overflow-hidden">
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-64 bg-[hsl(var(--surface))] border-r border-[hsl(var(--border))]">
            <DialogHeader className="px-6 py-4 border-b border-[hsl(var(--border))]">
              <DialogTitle className="text-lg font-semibold text-[hsl(var(--text))] text-left">
                Settings
              </DialogTitle>
            </DialogHeader>
            <div className="p-4">
              <nav className="space-y-1">
                {settingsCategories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setActiveCategory(category.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-md transition-all text-left ${
                        activeCategory === category.id
                          ? 'bg-[hsl(var(--sidebar-selected))] text-[hsl(var(--text))]'
                          : 'text-[hsl(var(--muted))] hover:bg-[hsl(var(--sidebar-hover))] hover:text-[hsl(var(--text))]'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {category.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[hsl(var(--border))]">
              <h1 className="text-lg font-semibold text-[hsl(var(--text))] capitalize">
                {settingsCategories.find(c => c.id === activeCategory)?.label}
              </h1>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="text-[hsl(var(--muted))] hover:text-[hsl(var(--text))] hover:bg-[hsl(var(--sidebar-hover))] rounded-md"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-y-auto scrollbar-thin">
              {renderCategoryContent()}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}