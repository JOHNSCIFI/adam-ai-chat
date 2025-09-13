import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  Settings, 
  Bell, 
  User, 
  Puzzle, 
  Shield, 
  Database,
  Lock,
  X,
  Download,
  Trash2,
  LogOut
} from 'lucide-react';
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
  { id: 'connected-apps', label: 'Connected apps', icon: Puzzle },
  { id: 'data-controls', label: 'Data controls', icon: Database },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'account', label: 'Account', icon: User },
];

const accentColors = [
  { id: 'green', label: 'Green', colorClass: 'bg-green-500' },
  { id: 'blue', label: 'Blue', colorClass: 'bg-blue-500' },
  { id: 'purple', label: 'Purple', colorClass: 'bg-purple-500' },
  { id: 'orange', label: 'Orange', colorClass: 'bg-orange-500' },
  { id: 'red', label: 'Red', colorClass: 'bg-red-500' },
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
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-white mb-3">Theme</label>
        <Select value={theme} onValueChange={setTheme}>
          <SelectTrigger className="w-full bg-[#2f2f2f] border-[#4a4a4a] text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#2f2f2f] border-[#4a4a4a]">
            <SelectItem value="system" className="text-white hover:bg-[#404040]">System</SelectItem>
            <SelectItem value="light" className="text-white hover:bg-[#404040]">Light</SelectItem>
            <SelectItem value="dark" className="text-white hover:bg-[#404040]">Dark</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="block text-sm font-medium text-white mb-3">Accent color</label>
        <div className="grid grid-cols-5 gap-2">
          {accentColors.map((color) => (
            <button
              key={color.id}
              onClick={() => setAccentColor(color.id as any)}
              className={`w-12 h-12 rounded-full ${color.colorClass} border-2 transition-all ${
                accentColor === color.id ? 'border-white scale-110' : 'border-transparent hover:border-gray-400'
              }`}
              title={color.label}
            />
          ))}
        </div>
      </div>
    </div>
  );

  const renderCategoryContent = () => {
    switch (activeCategory) {
      case 'general':
        return renderGeneralSettings();
      case 'notifications':
        return (
          <div className="py-12 text-center text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Notification settings coming soon</p>
          </div>
        );
      case 'personalization':
        return (
          <div className="py-12 text-center text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Personalization settings coming soon</p>
          </div>
        );
      case 'connected-apps':
        return (
          <div className="py-12 text-center text-muted-foreground">
            <Puzzle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Connected apps settings coming soon</p>
          </div>
        );
      case 'data-controls':
        return (
          <div className="space-y-4">
            <div className="border border-[#4a4a4a] rounded-lg p-4 bg-[#2f2f2f]">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">Export data</h3>
                  <p className="text-gray-400 text-sm">Download your chat history and data</p>
                </div>
                <Button onClick={handleExportData} variant="outline" className="border-[#4a4a4a] text-white hover:bg-[#404040]">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </div>
        );
      case 'security':
        return (
          <div className="space-y-4">
            <div className="border border-[#4a4a4a] rounded-lg p-4 bg-[#2f2f2f]">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">Login methods</h3>
                  <p className="text-gray-400 text-sm">Manage your login options</p>
                </div>
                <div className="text-gray-400 text-sm">
                  {user?.app_metadata?.provider === 'google' ? 'Google' : 'Email'}
                </div>
              </div>
            </div>
            <div className="border border-[#4a4a4a] rounded-lg p-4 bg-[#2f2f2f]">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">Log out all devices</h3>
                  <p className="text-gray-400 text-sm">Sign out from all devices and sessions</p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="border-[#4a4a4a] text-white hover:bg-[#404040]">
                      <LogOut className="h-4 w-4 mr-2" />
                      Log out all
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-[#2f2f2f] border-[#4a4a4a]">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-white">Log out all devices?</AlertDialogTitle>
                      <AlertDialogDescription className="text-gray-400">
                        This will sign you out from all devices and sessions. You'll need to sign in again.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-transparent border-[#4a4a4a] text-white hover:bg-[#404040]">Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleLogoutAllDevices} className="bg-red-600 hover:bg-red-700">
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
          <div className="space-y-4">
            <div className="border border-red-500/20 rounded-lg p-4 bg-red-500/5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">Delete account</h3>
                  <p className="text-gray-400 text-sm">Permanently delete your account and all data</p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="border-red-500 text-red-500 hover:bg-red-500/10">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-[#2f2f2f] border-[#4a4a4a]">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-white">Delete your account?</AlertDialogTitle>
                      <AlertDialogDescription className="text-gray-400">
                        This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-transparent border-[#4a4a4a] text-white hover:bg-[#404040]">Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDeleteAccount} 
                        disabled={isDeleting}
                        className="bg-red-600 hover:bg-red-700"
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
      <DialogContent className="max-w-4xl w-full h-[600px] p-0 bg-[#212121] border border-[#4a4a4a] rounded-xl overflow-hidden">
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-72 bg-[#171717] border-r border-[#4a4a4a]">
            <DialogHeader className="px-6 py-4 border-b border-[#4a4a4a]">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-lg font-semibold text-white">Settings</DialogTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  className="h-8 w-8 p-0 rounded-md text-gray-400 hover:text-white hover:bg-[#404040]"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </DialogHeader>
            <div className="p-4">
              <nav className="space-y-1">
                {settingsCategories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <Button
                      key={category.id}
                      variant="ghost"
                      className={`w-full justify-start h-10 text-sm font-normal px-3 ${
                        activeCategory === category.id 
                          ? 'bg-[#10a37f] text-white hover:bg-[#10a37f]' 
                          : 'text-gray-300 hover:bg-[#404040] hover:text-white'
                      }`}
                      onClick={() => setActiveCategory(category.id)}
                    >
                      <Icon className="h-4 w-4 mr-3 flex-shrink-0" />
                      {category.label}
                    </Button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            <div className="px-8 py-6 border-b border-[#4a4a4a]">
              <h2 className="text-xl font-semibold text-white">
                {settingsCategories.find(c => c.id === activeCategory)?.label}
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto px-8 py-6">
              {renderCategoryContent()}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}