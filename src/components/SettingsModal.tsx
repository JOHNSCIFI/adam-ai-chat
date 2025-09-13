import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Settings, 
  Bell, 
  User, 
  Puzzle, 
  Shield, 
  Database,
  Lock,
  X,
  ChevronDown,
  Play
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

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
  { id: 'blue', label: 'Blue', color: 'bg-blue-500' },
  { id: 'green', label: 'Green', color: 'bg-green-500' },
  { id: 'purple', label: 'Purple', color: 'bg-purple-500' },
  { id: 'red', label: 'Red', color: 'bg-red-500' },
  { id: 'orange', label: 'Orange', color: 'bg-orange-500' },
];

export default function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const [activeCategory, setActiveCategory] = useState('general');
  const { theme, setTheme, accentColor, setAccentColor } = useTheme();

  const renderGeneralSettings = () => (
    <div className="space-y-8">
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">Theme</label>
        <Select value={theme} onValueChange={setTheme}>
          <SelectTrigger className="w-full bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="system">System</SelectItem>
            <SelectItem value="light">Light</SelectItem>
            <SelectItem value="dark">Dark</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-3">Accent color</label>
        <div className="flex items-center gap-3">
          <div className={`w-4 h-4 rounded-full ${accentColors.find(c => c.id === accentColor)?.color || 'bg-blue-500'}`} />
          <Select value={accentColor} onValueChange={setAccentColor}>
            <SelectTrigger className="flex-1 bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {accentColors.map((color) => (
                <SelectItem key={color.id} value={color.id}>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${color.color}`} />
                    {color.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-3">Language</label>
        <Select defaultValue="auto-detect">
          <SelectTrigger className="w-full bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="auto-detect">Auto-detect</SelectItem>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="es">Spanish</SelectItem>
            <SelectItem value="fr">French</SelectItem>
            <SelectItem value="de">German</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-3">Spoken language</label>
        <Select defaultValue="english">
          <SelectTrigger className="w-full bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="english">English</SelectItem>
            <SelectItem value="spanish">Spanish</SelectItem>
            <SelectItem value="french">French</SelectItem>
            <SelectItem value="german">German</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground mt-2">
          For best results, select the language you mainly speak. If it's not listed, it may still be supported via auto-detection.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-3">Voice</label>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Play className="h-3 w-3" />
            Play
          </Button>
          <Select defaultValue="ember">
            <SelectTrigger className="flex-1 bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ember">Ember</SelectItem>
              <SelectItem value="breeze">Breeze</SelectItem>
              <SelectItem value="cove">Cove</SelectItem>
              <SelectItem value="juniper">Juniper</SelectItem>
            </SelectContent>
          </Select>
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
          <div className="py-12 text-center text-muted-foreground">
            <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Data controls settings coming soon</p>
          </div>
        );
      case 'security':
        return (
          <div className="py-12 text-center text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Security settings coming soon</p>
          </div>
        );
      case 'account':
        return (
          <div className="py-12 text-center text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Account settings coming soon</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full h-[600px] p-0 bg-background border border-border rounded-xl overflow-hidden">
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-72 bg-muted/20 border-r border-border">
            <DialogHeader className="px-6 py-4 border-b border-border">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-lg font-semibold">General</DialogTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  className="h-8 w-8 p-0 rounded-md"
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
                      variant={activeCategory === category.id ? "secondary" : "ghost"}
                      className={`w-full justify-start h-10 text-sm font-normal px-3 ${
                        activeCategory === category.id 
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground' 
                          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
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
            <div className="px-8 py-6 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground">
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