import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  Settings, 
  Bell, 
  User, 
  Palette,
  Database,
  Shield,
  CreditCard,
  Monitor,
  Sun,
  Moon,
  Check
} from 'lucide-react';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const sidebarItems = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'personalization', label: 'Personalization', icon: Palette },
  { id: 'data', label: 'Data controls', icon: Database },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'account', label: 'Account', icon: CreditCard },
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[600px] p-0 gap-0">
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-80 bg-muted/30 border-r border-border p-4">
            <DialogHeader className="pb-4">
              <DialogTitle>Settings</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-1">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.id}
                    variant={activeTab === item.id ? "secondary" : "ghost"}
                    className="w-full justify-start h-10"
                    onClick={() => setActiveTab(item.id)}
                  >
                    <Icon className="mr-3 h-4 w-4" />
                    {item.label}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold mb-4">General</h2>
                </div>

                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-6">
                      {/* Theme Selection */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-sm font-medium">Theme</h3>
                            <p className="text-xs text-muted-foreground mt-1">
                              Choose your interface theme
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {themeOptions.map((option) => {
                              const Icon = option.icon;
                              return (
                                <Button
                                  key={option.value}
                                  variant={theme === option.value ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => setTheme(option.value)}
                                  className="h-9 px-3"
                                >
                                  <Icon className="h-4 w-4 mr-2" />
                                  {option.label}
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                        
                        <Separator />
                        
                        {/* Accent Color Selection */}
                        <div className="mt-6">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="text-sm font-medium">Accent color</h3>
                              <p className="text-xs text-muted-foreground mt-1">
                                Choose your preferred accent color
                              </p>
                            </div>
                            <div className="flex gap-2">
                              {accentColors.map((color) => (
                                <Button
                                  key={color.value}
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setAccentColor(color.value)}
                                  className="h-9 px-3 relative"
                                  style={{
                                    backgroundColor: accentColor === color.value ? color.color : 'transparent',
                                    borderColor: color.color,
                                    color: accentColor === color.value ? 'white' : 'inherit'
                                  }}
                                >
                                  <div 
                                    className="w-3 h-3 rounded-full mr-2" 
                                    style={{ backgroundColor: color.color }}
                                  />
                                  {color.label}
                                  {accentColor === color.value && (
                                    <Check className="h-3 w-3 ml-2" />
                                  )}
                                </Button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab !== 'general' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold mb-4 capitalize">{activeTab}</h2>
                </div>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} settings coming soon...
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}