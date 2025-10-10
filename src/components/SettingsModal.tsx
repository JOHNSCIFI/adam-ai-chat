import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  Settings, 
  User, 
  CreditCard,
  Monitor,
  Sun,
  Moon,
  Trash2,
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
  { id: 'data', label: 'Data Control', icon: CreditCard },
];

const themeOptions = [
  { value: 'light' as const, label: 'Light', icon: Sun },
  { value: 'dark' as const, label: 'Dark', icon: Moon },
  { value: 'system' as const, label: 'System', icon: Monitor },
];

const accentColors = [
  { value: 'blue' as const, label: 'Blue', color: '#3B82F6' },
  { value: 'indigo' as const, label: 'Indigo', color: '#6366F1' },
  { value: 'purple' as const, label: 'Purple', color: '#8B5CF6' },
  { value: 'green' as const, label: 'Green', color: '#10B981' },
  { value: 'orange' as const, label: 'Orange', color: '#F97316' },
  { value: 'red' as const, label: 'Red', color: '#EF4444' },
  { value: 'gray' as const, label: 'Gray', color: '#6B7280' },
];

export default function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const [activeTab, setActiveTab] = React.useState('general');
  const [isExporting, setIsExporting] = React.useState(false);
  const { theme, accentColor, setTheme, setAccentColor } = useTheme();
  const { toast } = useToast();
  const { user, signOut, userProfile } = useAuth();
  const isMobile = useIsMobile();

  const handleSetTheme = (newTheme: typeof theme) => {
    setTheme(newTheme);
  };

  const handleSetAccentColor = (color: typeof accentColor) => {
    setAccentColor(color);
  };

  const handleLogoutThisDevice = async () => {
    try {
      await signOut();
      onOpenChange(false);
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
      // First revoke the refresh token which invalidates all sessions globally
      const { error: revokeError } = await supabase.auth.admin.signOut(user?.id || '');
      if (revokeError) {
        console.log('Admin signout not available, using regular global signout');
      }

      // Use global signout scope to sign out from all devices
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) throw error;
      
      await signOut();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to log out from all devices. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExportData = async () => {
    if (!user) return;
    
    setIsExporting(true);
    toast({
      title: "Export started",
      description: "Your data export has started. Please wait…",
    });

    try {
      // Fetch all chats and messages
      const { data: chats, error: chatsError } = await supabase
        .from('chats')
        .select(`
          *,
          messages (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (chatsError) throw chatsError;

      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      // Create ZIP file
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      // 1. conversations.json
      const conversationsJson = {
        exportDate: new Date().toISOString(),
        totalChats: chats?.length || 0,
        conversations: chats?.map(chat => ({
          id: chat.id,
          title: chat.title,
          createdAt: chat.created_at,
          updatedAt: chat.updated_at,
          messages: chat.messages.map((msg: any) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            createdAt: msg.created_at,
            fileAttachments: msg.file_attachments
          }))
        })) || []
      };
      zip.file('conversations.json', JSON.stringify(conversationsJson, null, 2));

      // 2. conversations.html
      const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chat Export - ${profile?.display_name || 'User'}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }
        .chat { margin-bottom: 40px; border: 1px solid #eee; border-radius: 8px; padding: 20px; }
        .chat-title { font-size: 1.2em; font-weight: bold; color: #333; margin-bottom: 10px; }
        .chat-meta { color: #666; font-size: 0.9em; margin-bottom: 20px; }
        .message { margin: 15px 0; padding: 12px; border-radius: 8px; }
        .user-message { background: #007bff; color: white; margin-left: 20px; }
        .assistant-message { background: #f8f9fa; border: 1px solid #dee2e6; margin-right: 20px; }
        .message-role { font-weight: bold; margin-bottom: 5px; text-transform: capitalize; }
        .message-content { white-space: pre-wrap; }
        .timestamp { font-size: 0.8em; opacity: 0.7; margin-top: 8px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Chat Export</h1>
            <p><strong>User:</strong> ${profile?.display_name || 'Unknown'} (${profile?.email || 'No email'})</p>
            <p><strong>Export Date:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Total Conversations:</strong> ${chats?.length || 0}</p>
        </div>
        
        ${chats?.map(chat => `
            <div class="chat">
                <div class="chat-title">${chat.title}</div>
                <div class="chat-meta">
                    Created: ${new Date(chat.created_at).toLocaleString()} | 
                    Messages: ${chat.messages.length}
                </div>
                ${chat.messages.map((msg: any) => `
                    <div class="message ${msg.role}-message">
                        <div class="message-role">${msg.role}</div>
                        <div class="message-content">${msg.content}</div>
                        <div class="timestamp">${new Date(msg.created_at).toLocaleString()}</div>
                    </div>
                `).join('')}
            </div>
        `).join('') || '<p>No conversations found.</p>'}
    </div>
</body>
</html>`;
      zip.file('conversations.html', htmlContent);

      // 3. metadata.json
      const metadata = {
        exportDate: new Date().toISOString(),
        user: {
          id: user.id,
          email: user.email,
          displayName: profile?.display_name,
          signupMethod: profile?.signup_method,
          accountCreated: profile?.created_at,
          theme: theme,
          accentColor: accentColor
        },
        statistics: {
          totalChats: chats?.length || 0,
          totalMessages: chats?.reduce((acc, chat) => acc + chat.messages.length, 0) || 0,
          firstChatDate: chats?.[0]?.created_at,
          lastChatDate: chats?.[chats.length - 1]?.created_at
        }
      };
      zip.file('metadata.json', JSON.stringify(metadata, null, 2));

      // Generate and download ZIP
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `chatlearn-export-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export completed",
        description: "Your data has been successfully exported and downloaded.",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export failed",
        description: "There was an error exporting your data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAllChats = async () => {
    if (!user) return;
    
    try {
      // First delete all user images from storage
      try {
        await supabase.functions.invoke('delete-all-user-images', {
          body: { userId: user.id }
        });
      } catch (imageError) {
        console.error('Error deleting user images:', imageError);
        // Continue with data deletion even if image deletion fails
      }

      // Delete all user data except profile (cascading will handle messages)
      const deleteOperations = [
        supabase.from('projects').delete().eq('user_id', user.id),
        supabase.from('chats').delete().eq('user_id', user.id),
      ];

      const results = await Promise.all(deleteOperations);
      
      // Check for any errors
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        throw new Error('Failed to delete some data');
      }

      toast({
        title: "All data deleted",
        description: "All your chats, projects, and images have been permanently deleted.",
      });

      // Close settings modal and redirect to home page
      onOpenChange(false);
      window.location.href = 'http://preview--adam-ai-chat.lovable.app/';
    } catch (error: any) {
      console.error('Delete all chats error:', error);
      toast({
        title: "Error deleting data",
        description: "Unable to delete all data. Please try again.",
        variant: "destructive",
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
          <div className="space-y-6 md:space-y-8">
            <div className="space-y-1.5 md:space-y-2">
              <h2 className="text-xl md:text-2xl font-bold text-foreground">General</h2>
              <p className="text-sm md:text-base text-muted-foreground">Customize your experience and preferences</p>
            </div>
            
            <div className="space-y-4 md:space-y-6">
              {/* Theme Setting */}
              <Card className="border border-border/40 bg-gradient-to-r from-card/80 to-card/40 backdrop-blur-sm shadow-sm">
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    <div className="space-y-0.5 md:space-y-1">
                      <p className="font-semibold text-foreground text-sm md:text-base">Theme</p>
                      <p className="text-xs md:text-sm text-muted-foreground">Choose your preferred appearance</p>
                    </div>
                    <Select value={theme} onValueChange={handleSetTheme}>
                      <SelectTrigger className="w-full sm:w-36 bg-background/80 border border-border/50 shadow-sm backdrop-blur-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-background/95 border border-border/50 shadow-xl z-50 backdrop-blur-md">
                        {themeOptions.map((option) => {
                          const Icon = option.icon;
                          return (
                            <SelectItem 
                              key={option.value} 
                              value={option.value}
                              className="hover:bg-accent/60 focus:bg-accent/60 cursor-pointer"
                            >
                              <div className="flex items-center gap-3">
                                <div className="p-1.5 rounded-md bg-primary/10">
                                  <Icon className="h-3.5 w-3.5 text-primary" />
                                </div>
                                <span className="font-medium">{option.label}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Accent Color Setting */}
              <Card className="border border-border/40 bg-gradient-to-r from-card/80 to-card/40 backdrop-blur-sm shadow-sm">
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    <div className="space-y-0.5 md:space-y-1">
                      <p className="font-semibold text-foreground text-sm md:text-base">Accent color</p>
                      <p className="text-xs md:text-sm text-muted-foreground">Personalize your interface colors</p>
                    </div>
                    <Select value={accentColor} onValueChange={handleSetAccentColor}>
                      <SelectTrigger className="w-full sm:w-36 bg-background/80 border border-border/50 shadow-sm backdrop-blur-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-background/95 border border-border/50 shadow-xl z-50 backdrop-blur-md">
                        {accentColors.map((color) => (
                          <SelectItem 
                            key={color.value} 
                            value={color.value}
                            className="hover:bg-accent/60 focus:bg-accent/60 cursor-pointer"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-1 rounded-full border border-border/30">
                                <div 
                                  className="w-4 h-4 rounded-full shadow-sm" 
                                  style={{ backgroundColor: color.color }}
                                />
                              </div>
                              <span className="font-medium">{color.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

            </div>
          </div>
        );

      case 'profile':
        if (!user) {
          return (
            <div className="space-y-6 md:space-y-8">
              <div className="space-y-1.5 md:space-y-2">
                <h2 className="text-xl md:text-2xl font-bold text-foreground">Profile</h2>
                <p className="text-sm md:text-base text-muted-foreground">Sign in to manage your account information</p>
              </div>
              <Card className="border border-border/40 bg-gradient-to-r from-card/80 to-card/40 backdrop-blur-sm shadow-sm">
                <CardContent className="p-6 md:p-8 text-center">
                  <div className="space-y-4">
                    <div className="w-14 h-14 md:w-16 md:h-16 mx-auto bg-muted/50 rounded-full flex items-center justify-center">
                      <User className="h-7 w-7 md:h-8 md:w-8 text-muted-foreground" />
                    </div>
                    <div className="space-y-1.5 md:space-y-2">
                      <p className="font-medium text-foreground text-sm md:text-base">Sign in to access profile settings</p>
                      <p className="text-xs md:text-sm text-muted-foreground">Manage your account information and preferences</p>
                    </div>
                    <Button 
                      onClick={() => window.location.href = '/'}
                      className="mt-2 md:mt-4 w-full sm:w-auto"
                    >
                      Sign In
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        }
        return (
          <div className="space-y-6 md:space-y-8">
            <div className="space-y-1.5 md:space-y-2">
              <h2 className="text-xl md:text-2xl font-bold text-foreground">Profile</h2>
              <p className="text-sm md:text-base text-muted-foreground">Manage your account information</p>
            </div>
            
            <div className="space-y-4 md:space-y-6">
              {/* Email Section */}
              <Card className="border border-border/40 bg-gradient-to-r from-card/80 to-card/40 backdrop-blur-sm shadow-sm">
                <CardContent className="p-4 md:p-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5 md:gap-3">
                      <div className="p-1.5 md:p-2 bg-primary/10 rounded-lg flex-shrink-0">
                        <Mail className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground text-sm md:text-base">Email Address</p>
                        <p className="text-xs md:text-sm text-muted-foreground">Your account email</p>
                      </div>
                    </div>
                    <div className="ml-0 md:ml-11 mt-2">
                      <p className="font-medium text-foreground bg-muted/40 px-3 py-2 rounded-lg border border-border/30 break-all text-sm md:text-base">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Login Methods Section */}
              <Card className="border border-border/40 bg-gradient-to-r from-card/80 to-card/40 backdrop-blur-sm shadow-sm">
                <CardContent className="p-4 md:p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2.5 md:gap-3">
                      <div className="p-1.5 md:p-2 bg-primary/10 rounded-lg flex-shrink-0">
                        <Shield className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground text-sm md:text-base">Login Methods</p>
                        <p className="text-xs md:text-sm text-muted-foreground">Connected authentication providers</p>
                      </div>
                    </div>
                    
                    <div className="ml-0 md:ml-11 space-y-3">
                      {/* Google Provider */}
                      {user?.app_metadata?.providers?.includes('google') && (
                        <div className="flex items-center justify-between gap-3 p-3 md:p-4 bg-background/60 rounded-xl border border-border/30 backdrop-blur-sm">
                          <div className="flex items-center gap-2.5 md:gap-3 min-w-0">
                            <div className="p-1.5 md:p-2 bg-white rounded-lg shadow-sm flex-shrink-0">
                              <svg className="h-4 w-4 md:h-5 md:w-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                              </svg>
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-foreground text-sm md:text-base">Google</p>
                              <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">Sign in with your Google account</p>
                            </div>
                          </div>
                          <div className="p-1 md:p-1.5 bg-green-100 rounded-full flex-shrink-0">
                            <Check className="h-3.5 w-3.5 md:h-4 md:w-4 text-green-600" />
                          </div>
                        </div>
                      )}

                      {/* Apple Provider */}
                      {user?.app_metadata?.providers?.includes('apple') && (
                        <div className="flex items-center justify-between gap-3 p-3 md:p-4 bg-background/60 rounded-xl border border-border/30 backdrop-blur-sm">
                          <div className="flex items-center gap-2.5 md:gap-3 min-w-0">
                            <div className="p-1.5 md:p-2 bg-black dark:bg-white rounded-lg shadow-sm flex-shrink-0">
                              <svg className="h-4 w-4 md:h-5 md:w-5 text-white dark:text-black" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                              </svg>
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-foreground text-sm md:text-base">Apple</p>
                              <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">Sign in with your Apple account</p>
                            </div>
                          </div>
                          <div className="p-1 md:p-1.5 bg-green-100 rounded-full flex-shrink-0">
                            <Check className="h-3.5 w-3.5 md:h-4 md:w-4 text-green-600" />
                          </div>
                        </div>
                      )}
                      
                      {/* Email Provider */}
                      {(user?.app_metadata?.providers?.includes('email') || 
                        !user?.app_metadata?.providers || 
                        user.app_metadata.providers.length === 0) && (
                        <div className="flex items-center justify-between gap-3 p-3 md:p-4 bg-background/60 rounded-xl border border-border/30 backdrop-blur-sm">
                          <div className="flex items-center gap-2.5 md:gap-3 min-w-0">
                            <div className="p-1.5 md:p-2 bg-primary/10 rounded-lg flex-shrink-0">
                              <Mail className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-foreground text-sm md:text-base">Email & Password</p>
                              <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">Sign in with your email address</p>
                            </div>
                          </div>
                          <div className="p-1 md:p-1.5 bg-green-100 rounded-full flex-shrink-0">
                            <Check className="h-3.5 w-3.5 md:h-4 md:w-4 text-green-600" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'security':
        if (!user) {
          return (
            <div className="space-y-4 md:space-y-6">
              <div className="space-y-1.5 md:space-y-2">
                <h2 className="text-xl md:text-2xl font-semibold text-foreground">Security</h2>
                <p className="text-sm md:text-base text-muted-foreground">Sign in to manage your account security</p>
              </div>
              <div className="text-center py-6 md:py-8">
                <p className="text-sm md:text-base text-muted-foreground mb-4">You need to be signed in to access security settings.</p>
                <Button onClick={() => window.location.href = '/'} className="w-full sm:w-auto">Sign In</Button>
              </div>
            </div>
          );
        }
        return (
          <div className="space-y-4 md:space-y-6">
            <div className="space-y-1.5 md:space-y-2">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground">Security</h2>
              <p className="text-sm md:text-base text-muted-foreground">Manage your account security and sessions</p>
            </div>
            
            <div className="space-y-4 md:space-y-6">
              {/* Multi-Factor Authentication */}
              <div>
                <p className="font-medium mb-2 md:mb-3 text-sm md:text-base">Multi-Factor Authentication</p>
                <div className="p-3 md:p-4 bg-muted/30 rounded-lg border shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-sm md:text-base">Two-Factor Authentication</p>
                      <p className="text-xs md:text-sm text-muted-foreground">Not available yet</p>
                    </div>
                    <Button variant="outline" disabled size="sm" className="w-full sm:w-auto">
                      Enable
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Session Management */}
              <div>
                <p className="font-medium mb-2 md:mb-3 text-sm md:text-base">Session Management</p>
                <div className="space-y-3">
                  <div className="p-3 md:p-4 bg-muted/30 rounded-lg border shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-sm md:text-base">Current Device</p>
                        <p className="text-xs md:text-sm text-muted-foreground">You are currently signed in on this device</p>
                      </div>
                      <Button variant="outline" onClick={handleLogoutThisDevice} size="sm" className="w-full sm:w-auto">
                        Sign Out
                      </Button>
                    </div>
                  </div>
                  
                  <div className="p-3 md:p-4 bg-muted/30 rounded-lg border shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-sm md:text-base">All Devices</p>
                        <p className="text-xs md:text-sm text-muted-foreground">Sign out of all devices and sessions</p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full sm:w-auto">
                            Sign Out Everywhere
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-base md:text-lg">Sign out of all devices?</AlertDialogTitle>
                            <AlertDialogDescription className="text-sm">
                              This will sign you out of all devices and sessions. You'll need to sign in again on each device.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                            <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleLogoutAllDevices} className="w-full sm:w-auto">
                              Sign Out Everywhere
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'data':
        if (!user) {
          return (
            <div className="space-y-4 md:space-y-6">
              <div className="space-y-1.5 md:space-y-2">
                <h2 className="text-xl md:text-2xl font-semibold text-foreground">Data Control</h2>
                <p className="text-sm md:text-base text-muted-foreground">Sign in to manage your data and privacy</p>
              </div>
              <div className="text-center py-6 md:py-8">
                <p className="text-sm md:text-base text-muted-foreground mb-4">You need to be signed in to access data control settings.</p>
                <Button onClick={() => window.location.href = '/'} className="w-full sm:w-auto">Sign In</Button>
              </div>
            </div>
          );
        }
        return (
          <div className="space-y-4 md:space-y-6">
            <div className="space-y-1.5 md:space-y-2">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground">Data Control</h2>
              <p className="text-sm md:text-base text-muted-foreground">Manage your data and account</p>
            </div>
            
            <div className="space-y-4 md:space-y-6">
              {/* Data Export */}
              <Card className="shadow-sm">
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    <div className="min-w-0">
                      <h3 className="font-semibold mb-1 text-sm md:text-base">Export Data</h3>
                      <p className="text-xs md:text-sm text-muted-foreground">Download all your conversations and account data</p>
                    </div>
                    <Button 
                      onClick={handleExportData}
                      disabled={isExporting}
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto"
                    >
                      {isExporting ? 'Exporting...' : 'Export'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Delete All Chats */}
              <Card className="border-destructive/50 shadow-sm">
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    <div className="min-w-0">
                      <h3 className="font-semibold mb-1 text-sm md:text-base">Delete All Data</h3>
                      <p className="text-xs md:text-sm text-muted-foreground">Permanently delete all conversations, projects, and images</p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="w-full sm:w-auto">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete All
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-base md:text-lg">Delete all data?</AlertDialogTitle>
                          <AlertDialogDescription className="text-sm">
                            This action cannot be undone. All your conversations, projects, and images will be permanently deleted.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                          <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteAllChats} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto">
                            Delete All Data
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>

              {/* Delete Account */}
              <Card className="border-destructive/50 shadow-sm">
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    <div className="min-w-0">
                      <h3 className="font-semibold mb-1 text-sm md:text-base">Delete Account</h3>
                      <p className="text-xs md:text-sm text-muted-foreground">Permanently delete your account and all associated data</p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="w-full sm:w-auto">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Account
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-base md:text-lg">Delete your account?</AlertDialogTitle>
                          <AlertDialogDescription className="text-sm">
                            This action cannot be undone. Your account and all associated data will be permanently deleted.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                          <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto">
                            Delete Account
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[92vh] md:h-[88vh] p-0 flex flex-col bg-background">
          <SheetHeader className="px-4 md:px-6 py-3 md:py-4 border-b border-border/40 flex-shrink-0 bg-gradient-to-r from-background to-background/95">
            <SheetTitle className="text-lg md:text-xl font-semibold text-left text-foreground">Settings</SheetTitle>
          </SheetHeader>
          
          {/* Mobile Tab Navigation */}
          <div className="flex-shrink-0 border-b border-border/40 bg-gradient-to-r from-muted/30 to-muted/10 backdrop-blur-sm">
            <nav className="flex p-2 md:p-3 gap-1.5 md:gap-2 overflow-x-auto">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isDisabled = !user && (item.id === 'profile' || item.id === 'data');
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    disabled={isDisabled}
                    className={`flex-1 min-w-[70px] flex flex-col items-center justify-center gap-1 md:gap-1.5 px-2 md:px-3 py-2.5 md:py-3 rounded-xl text-sm transition-all duration-200 ${
                      activeTab === item.id
                        ? 'bg-primary/10 text-primary font-semibold shadow-sm border border-primary/20'
                        : isDisabled
                        ? 'text-muted-foreground/40 cursor-not-allowed'
                        : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground hover:scale-105'
                    }`}
                  >
                    <div className={`p-1.5 md:p-2 rounded-lg transition-colors ${
                      activeTab === item.id 
                        ? 'bg-primary/15' 
                        : 'bg-muted/40'
                    }`}>
                      <Icon className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    </div>
                    <span className="text-[10px] md:text-xs font-medium leading-tight">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Mobile Content */}
          <div className="flex-1 overflow-y-auto bg-gradient-to-b from-background to-background/98">
            <div className="p-4 pb-8">
              {renderContent()}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] md:max-w-3xl lg:max-w-4xl h-[85vh] md:h-[80vh] p-0 bg-background border border-border/50 shadow-xl">
        <div className="flex h-full">
          {/* Desktop Sidebar */}
          <div className="w-48 md:w-56 lg:w-64 bg-gradient-to-b from-muted/30 to-muted/10 border-r border-border/40 backdrop-blur-sm">
            <div className="px-3 md:px-4 lg:px-6 py-3 md:py-4 border-b border-border/40 bg-gradient-to-r from-background/50 to-background/30">
              <DialogHeader className="text-left">
                <DialogTitle className="text-lg md:text-xl font-semibold text-foreground">Settings</DialogTitle>
                <DialogDescription className="sr-only">Manage your application settings and preferences</DialogDescription>
              </DialogHeader>
            </div>
            <nav className="p-2 md:p-3 space-y-1">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isDisabled = !user && (item.id === 'profile' || item.id === 'data');
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    disabled={isDisabled}
                    className={`w-full flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2.5 md:py-3 rounded-xl text-sm text-left transition-all duration-200 group ${
                      activeTab === item.id
                        ? 'bg-primary/10 text-primary font-semibold shadow-sm border border-primary/20'
                        : isDisabled
                        ? 'text-muted-foreground/40 cursor-not-allowed'
                        : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground hover:translate-x-1'
                    }`}
                  >
                    <div className={`p-1.5 md:p-2 rounded-lg transition-colors ${
                      activeTab === item.id 
                        ? 'bg-primary/15' 
                        : 'bg-muted/40 group-hover:bg-accent/80'
                    }`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="font-medium text-xs md:text-sm">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Desktop Content */}
          <div className="flex-1 overflow-y-auto bg-gradient-to-b from-background to-background/98">
            <div className="p-4 md:p-5 lg:p-6">
              {renderContent()}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}