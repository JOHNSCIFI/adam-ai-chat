import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { X, Settings, FolderOpen, Lightbulb, Target, Briefcase, Rocket, Palette, FileText, Code, Zap, Trophy, Heart, Star, Flame, Gem, Sparkles } from 'lucide-react';

interface Project {
  id: string;
  title: string;
  icon: string;
  color: string;
  description?: string;
}

interface ProjectEditModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onProjectUpdated: () => void;
}

const iconOptions = [
  { key: 'folder', component: FolderOpen },
  { key: 'lightbulb', component: Lightbulb },
  { key: 'target', component: Target },
  { key: 'briefcase', component: Briefcase },
  { key: 'rocket', component: Rocket },
  { key: 'palette', component: Palette },
  { key: 'filetext', component: FileText },
  { key: 'code', component: Code },
  { key: 'zap', component: Zap },
  { key: 'trophy', component: Trophy },
  { key: 'heart', component: Heart },
  { key: 'star', component: Star },
  { key: 'flame', component: Flame },
  { key: 'gem', component: Gem },
  { key: 'sparkles', component: Sparkles },
];

const colorOptions = [
  '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', 
  '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1',
  '#14b8a6', '#22c55e', '#a855f7', '#eab308', '#dc2626'
];

export default function ProjectEditModal({ project, isOpen, onClose, onProjectUpdated }: ProjectEditModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [title, setTitle] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('folder');
  const [selectedColor, setSelectedColor] = useState('#10b981');
  const [showIconSelector, setShowIconSelector] = useState(false);
  const [showColorSelector, setShowColorSelector] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (project) {
      setTitle(project.title);
      setSelectedIcon(project.icon);
      setSelectedColor(project.color);
    }
  }, [project]);

  const handleSave = async () => {
    if (!project || !user || !title.trim()) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({ 
          title: title.trim(),
          icon: selectedIcon,
          color: selectedColor
        })
        .eq('id', project.id);

      if (error) throw error;

      toast({
        title: "Project updated",
        description: "Project has been updated successfully.",
      });

      onProjectUpdated();
      onClose();
    } catch (error: any) {
      console.error('Error updating project:', error);
      toast({
        title: "Error updating project",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const SelectedIconComponent = iconOptions.find(icon => icon.key === selectedIcon)?.component || FolderOpen;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-card border-border shadow-2xl">
        <DialogHeader className="text-center pb-4">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Edit Project
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-8">
          {/* Project Icon and Name */}
          <div className="text-center space-y-6">
            <div 
              className="w-20 h-20 mx-auto flex items-center justify-center cursor-pointer hover:scale-110 transition-all duration-300 rounded-2xl bg-muted/50 backdrop-blur-sm border border-border/50"
              onClick={() => setShowIconSelector(!showIconSelector)}
            >
              <SelectedIconComponent 
                className="w-10 h-10" 
                style={{ color: selectedColor }}
              />
            </div>
            
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-center text-xl font-semibold border-0 bg-transparent focus-visible:ring-2 focus-visible:ring-primary/20 rounded-lg px-4 py-2"
              placeholder="Project name"
            />
          </div>

          {/* Icon Selector */}
          {showIconSelector && (
            <div className="p-6 bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl border border-border/50 backdrop-blur-sm">
              <h3 className="text-sm font-semibold mb-4 text-center text-muted-foreground">Choose Icon</h3>
              <div className="grid grid-cols-5 gap-3">
                {iconOptions.map((icon) => {
                  const IconComponent = icon.component;
                  return (
                    <Button
                      key={icon.key}
                      variant={selectedIcon === icon.key ? "default" : "ghost"}
                      size="sm"
                      className="h-12 w-12 p-0 rounded-xl hover:scale-110 transition-all duration-200"
                      onClick={() => {
                        setSelectedIcon(icon.key);
                        setShowColorSelector(true);
                        setShowIconSelector(false);
                      }}
                    >
                      <IconComponent className="w-5 h-5" />
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Color Selector */}
          {showColorSelector && (
            <div className="p-6 bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl border border-border/50 backdrop-blur-sm">
              <h3 className="text-sm font-semibold mb-4 text-center text-muted-foreground">Choose Color</h3>
              <div className="grid grid-cols-5 gap-3">
                {colorOptions.map((color) => (
                  <Button
                    key={color}
                    variant="ghost"
                    size="sm"
                    className="h-10 w-10 p-0 rounded-full border-2 hover:scale-110 transition-all duration-200"
                    style={{ 
                      backgroundColor: color,
                      borderColor: selectedColor === color ? 'hsl(var(--primary))' : 'transparent'
                    }}
                    onClick={() => {
                      setSelectedColor(color);
                      setShowColorSelector(false);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1 h-11 font-medium"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!title.trim() || loading}
              className="flex-1 h-11 font-medium shadow-lg shadow-primary/20"
            >
              {loading ? 'Updating...' : 'Update'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}