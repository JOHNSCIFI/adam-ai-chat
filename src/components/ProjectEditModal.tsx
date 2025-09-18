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
      <DialogContent className="max-w-sm bg-background border shadow-xl">
        <DialogHeader className="text-center pb-6">
          <DialogTitle className="text-xl font-semibold">Edit Project</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Project Icon and Name */}
          <div className="text-center space-y-4">
            <div 
              className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
              style={{ backgroundColor: selectedColor }}
              onClick={() => setShowIconSelector(!showIconSelector)}
            >
              <SelectedIconComponent className="w-8 h-8 text-white" />
            </div>
            
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-center text-lg font-medium border-0 bg-transparent focus-visible:ring-0 px-0"
              placeholder="Project name"
            />
          </div>

          {/* Icon Selector */}
          {showIconSelector && (
            <div className="p-4 bg-muted/20 rounded-lg">
              <h3 className="text-sm font-medium mb-3 text-center">Choose Icon</h3>
              <div className="grid grid-cols-5 gap-2">
                {iconOptions.map((icon) => {
                  const IconComponent = icon.component;
                  return (
                    <Button
                      key={icon.key}
                      variant={selectedIcon === icon.key ? "default" : "ghost"}
                      size="sm"
                      className="h-10 w-10 p-0"
                      onClick={() => {
                        setSelectedIcon(icon.key);
                        setShowColorSelector(true);
                        setShowIconSelector(false);
                      }}
                    >
                      <IconComponent className="w-4 h-4" />
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Color Selector */}
          {showColorSelector && (
            <div className="p-4 bg-muted/20 rounded-lg">
              <h3 className="text-sm font-medium mb-3 text-center">Choose Color</h3>
              <div className="grid grid-cols-5 gap-2">
                {colorOptions.map((color) => (
                  <Button
                    key={color}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 rounded-full border-2"
                    style={{ 
                      backgroundColor: color,
                      borderColor: selectedColor === color ? 'hsl(var(--foreground))' : 'transparent'
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
          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!title.trim() || loading}
              className="flex-1"
            >
              {loading ? 'Updating...' : 'Update'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}