import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { X, Settings } from 'lucide-react';

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

const iconOptions = ['📁', '💡', '🎯', '📊', '🚀', '💼', '📝', '🔬', '🎨', '⚡', '🏆', '🌟', '🔥', '💎', '🎪'];
const colorOptions = [
  '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', 
  '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1',
  '#14b8a6', '#22c55e', '#a855f7', '#eab308', '#dc2626'
];

export default function ProjectEditModal({ project, isOpen, onClose, onProjectUpdated }: ProjectEditModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [title, setTitle] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('📁');
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-background border-border">
        <DialogHeader className="flex flex-row items-center justify-between pb-4">
          <DialogTitle className="text-lg font-medium">Edit project</DialogTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Project Icon and Name Row */}
          <div 
            className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => setShowIconSelector(!showIconSelector)}
          >
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-lg"
              style={{ backgroundColor: selectedColor }}
            >
              {selectedIcon}
            </div>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 border-0 bg-transparent text-base font-medium focus-visible:ring-0 px-0"
              placeholder="Project name"
            />
          </div>

          {/* Icon Selector */}
          {showIconSelector && (
            <div className="space-y-3">
              <div className="grid grid-cols-5 gap-2">
                {iconOptions.map((icon) => (
                  <Button
                    key={icon}
                    variant={selectedIcon === icon ? "default" : "ghost"}
                    size="sm"
                    className="h-10 w-10 p-0 text-lg"
                    onClick={() => {
                      setSelectedIcon(icon);
                      setShowColorSelector(true);
                      setShowIconSelector(false);
                    }}
                  >
                    {icon}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Color Selector */}
          {showColorSelector && (
            <div className="space-y-3">
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

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <Button 
              onClick={handleSave}
              disabled={!title.trim() || loading}
              className="px-8 py-2 rounded-full bg-white text-black hover:bg-gray-100"
            >
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}