import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  Settings, 
  User, 
  CreditCard,
  Monitor,
  Sun,
  Moon,
  Trash2,
  ChevronDown,
  Mail,
  Shield,
  Check
} from 'lucide-react';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const sidebarItems = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'security', label: 'Security', icon: Shield },
];

const themeOptions = [
  { value: 'light' as const, label: 'Light', icon: Sun },
  { value: 'dark' as const, label: 'Dark', icon: Moon },
  { value: 'system' as const, label: 'System', icon: Monitor },
];

const accentColors = [
  { value: 'blue' as const, label: 'Blue', color: 'hsl(213, 94%, 68%)' },
  { value: 'purple' as const, label: 'Purple', color: 'hsl(262, 83%, 58%)' },
  { value: 'green' as const, label: 'Green', color: 'hsl(142, 76%, 36%)' },
  { value: 'orange' as const, label: 'Orange', color: 'hsl(25, 95%, 53%)' },
  { value: 'red' as const, label: 'Red', color: 'hsl(0, 84%, 60%)' },
];

export default function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const [activeTab, setActiveTab] = React.useState('general');
  const { theme, accentColor, setTheme, setAccentColor } = useTheme();
  const { toast } = useToast();
  const { user, signOut } = useAuth();

  const handleSetTheme = (newTheme: typeof theme) => {
    setTheme(newTheme);
    toast({
      title: "Theme updated",
      description: `Switched to ${newTheme} theme`,
    });
  };

  const handleSetAccentColor = (color: typeof accentColor) => {
    setAccentColor(color);
    toast({
      title: "Accent color updated", 
      description: `Switched to ${color} accent color`,
    });
  };

  const handleLogoutThisDevice = async () => {
    try {
      await signOut();
      onOpenChange(false);
      toast({
        title: "Logged out",
        description: "You have been logged out of this device.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLogoutAllDevices = async () => {
    try {
      // This will invalidate all sessions
      const { error } = await supabase.auth.admin.signOut(user?.id || '');
      if (error) throw error;
      
      await signOut();
      onOpenChange(false);
      toast({
        title: "Logged out everywhere",
        description: "You have been logged out of all devices.",
      });
    } catch (error: any) {
      // Fallback to regular logout if admin logout fails
      await signOut();
      onOpenChange(false);
      toast({
        title: "Logged out",
        description: "You have been logged out of this device.",
      });
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    try {
      // Get the current session token for authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session found');
      }

      // Call the edge function to delete the account
      const { data, error } = await supabase.functions.invoke('delete-account', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to delete account');
      }
      
      toast({
        title: "Account deleted",
        description: "Your account has been permanently deleted.",
      });
      
      // Sign out and close modal
      await supabase.auth.signOut();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Delete account error:', error);
      toast({
        title: "Error deleting account",
        description: error.message || "Unable to delete account. Please try again.",
        variant: "destructive",
      });
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-1">General</h2>
              <p className="text-muted-foreground">Customize your interface preferences</p>
            </div>
            
            <div className="space-y-6">
              {/* Theme Setting */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Theme</p>
                  <p className="text-sm text-muted-foreground">Choose your interface theme</p>
                </div>
                <Select value={theme} onValueChange={handleSetTheme}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-md z-50">
                    {themeOptions.map((option) => {
                      const Icon = option.icon;
                      return (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {option.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Accent Color Setting */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Accent Color</p>
                  <p className="text-sm text-muted-foreground">Choose your preferred accent color</p>
                </div>
                <Select value={accentColor} onValueChange={handleSetAccentColor}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-md z-50">
                    {accentColors.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: color.color }}
                          />
                          {color.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 'profile':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-1">Profile</h2>
              <p className="text-muted-foreground">Manage your account information</p>
            </div>
            
            <div className="space-y-6">
              <div>
                <p className="font-medium mb-1">Email</p>
                <p className="text-muted-foreground">{user?.email}</p>
              </div>

              <Separator />

              <div>
                <p className="font-medium mb-3">Login Methods</p>
                <div className="space-y-3">
                  {/* Email Login */}
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <Mail className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Email & Password</p>
                        <p className="text-sm text-muted-foreground">Sign in with your email address</p>
                      </div>
                    </div>
                    <Check className="h-5 w-5 text-green-500" />
                  </div>

                  {/* Google Login */}
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <svg className="h-4 w-4" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium">Google</p>
                        <p className="text-sm text-muted-foreground">Sign in with your Google account</p>
                      </div>
                    </div>
                    <Check className="h-5 w-5 text-green-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-1">Security</h2>
              <p className="text-muted-foreground">Manage your account security and sessions</p>
            </div>
            
            <div className="space-y-6">
              {/* Multi-Factor Authentication */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Multi-Factor Authentication</p>
                  <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                </div>
                <Button variant="outline" disabled>
                  Coming Soon
                </Button>
              </div>

              <Separator />

              {/* Log out this device */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Log out of this device</p>
                  <p className="text-sm text-muted-foreground">End your current session on this device only</p>
                </div>
                <Button variant="outline" onClick={handleLogoutThisDevice}>
                  Log Out
                </Button>
              </div>

              <Separator />

              {/* Log out all devices */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Log out of all devices</p>
                  <p className="text-sm text-muted-foreground">End all active sessions across all devices</p>
                </div>
                <Button variant="outline" onClick={handleLogoutAllDevices}>
                  Log Out Everywhere
                </Button>
              </div>

              <Separator />

              {/* Delete Account */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-destructive">Delete Account</p>
                  <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your account and remove all your chats and data from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDeleteAccount}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete Account
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
      <DialogContent className="max-w-4xl max-h-[80vh] p-0 gap-0" aria-describedby="settings-description">
        <div className="flex h-full">
          {/* Left Sidebar */}
          <div className="w-64 bg-muted/20 border-r">
            <div className="p-6">
              <DialogHeader className="pb-6">
                <DialogTitle className="text-xl font-semibold">Settings</DialogTitle>
                <p id="settings-description" className="sr-only">Customize your adamGPT experience</p>
              </DialogHeader>
              
              <nav className="space-y-1">
                {sidebarItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        activeTab === item.id
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {renderContent()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}