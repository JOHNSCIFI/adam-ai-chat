import React, { useState } from 'react';
import * as JSZip from 'jszip';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Moon, Sun, Monitor, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export default function Settings() {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSave = () => {
    toast({
      title: "Settings saved",
      description: "Your preferences have been updated successfully.",
    });
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
          theme: profile?.theme,
          accentColor: profile?.accent_color
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
      link.download = `adamgpt-export-${new Date().toISOString().split('T')[0]}.zip`;
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

  return (
    <div className="flex-1 p-6 max-w-2xl mx-auto">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="text-muted-foreground">Manage your adamGPT preferences</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Theme</Label>
                <p className="text-sm text-muted-foreground">
                  Choose your preferred theme
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Sun className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Moon className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Monitor className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="notifications">Push Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications about new messages
                </p>
              </div>
              <Switch
                id="notifications"
                checked={notifications}
                onCheckedChange={setNotifications}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="emailUpdates">Email Updates</Label>
                <p className="text-sm text-muted-foreground">
                  Receive email updates about new features
                </p>
              </div>
              <Switch
                id="emailUpdates"
                checked={emailUpdates}
                onCheckedChange={setEmailUpdates}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Chat Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Model Selection</Label>
              <Button variant="outline" className="w-full justify-start" disabled>
                GPT-4 (Coming Soon)
              </Button>
              <p className="text-sm text-muted-foreground">
                Choose which AI model to use for conversations
              </p>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Export Data</Label>
              <Button 
                variant="outline" 
                onClick={handleExportData} 
                disabled={isExporting}
                className="w-full justify-start"
              >
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? "Exporting..." : "Download Chat History"}
              </Button>
              <p className="text-sm text-muted-foreground">
                Export all your conversations as a ZIP file containing JSON and HTML formats
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Danger Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Delete Account</Label>
              <Button variant="destructive" disabled>
                Delete My Account (Coming Soon)
              </Button>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all data
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </div>
    </div>
  );
}