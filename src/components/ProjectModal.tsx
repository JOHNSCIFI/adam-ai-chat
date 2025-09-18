import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Folder, 
  Briefcase, 
  BookOpen, 
  Code, 
  Palette, 
  Lightbulb, 
  Target, 
  Heart,
  Star,
  Rocket
} from 'lucide-react';

const iconOptions = [
  { icon: Folder, name: 'folder', color: '#10b981' },
  { icon: Briefcase, name: 'briefcase', color: '#3b82f6' },
  { icon: BookOpen, name: 'book', color: '#8b5cf6' },
  { icon: Code, name: 'code', color: '#ef4444' },
  { icon: Palette, name: 'palette', color: '#f59e0b' },
  { icon: Lightbulb, name: 'lightbulb', color: '#eab308' },
  { icon: Target, name: 'target', color: '#06b6d4' },
  { icon: Heart, name: 'heart', color: '#ec4899' },
  { icon: Star, name: 'star', color: '#f97316' },
  { icon: Rocket, name: 'rocket', color: '#6366f1' },
];

interface ProjectModalProps {
  children: React.ReactNode;
  onProjectCreated?: () => void;
}

export function ProjectModal({ children, onProjectCreated }: ProjectModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(iconOptions[0]);
  const [isCreating, setIsCreating] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();

  const handleCreateProject = async () => {
    if (!title.trim() || !user) return;

    setIsCreating(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          title: title.trim(),
          description: description.trim() || null,
          icon: selectedIcon.name,
          color: selectedIcon.color,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Project created",
        description: `"${title}" has been created successfully.`,
      });

      // Reset form
      setTitle('');
      setDescription('');
      setSelectedIcon(iconOptions[0]);
      setIsOpen(false);
      
      // Notify parent
      onProjectCreated?.();
      
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: "Error",
        description: "Failed to create project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleCreateProject();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Project Name</Label>
            <Input
              id="title"
              placeholder="Enter project name..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Describe your project..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label>Icon & Color</Label>
            <div className="grid grid-cols-5 gap-2">
              {iconOptions.map((option) => {
                const IconComponent = option.icon;
                const isSelected = selectedIcon.name === option.name;
                return (
                  <button
                    key={option.name}
                    onClick={() => setSelectedIcon(option)}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      isSelected 
                        ? 'border-primary bg-primary/10' 
                        : 'border-border hover:border-border/80 hover:bg-accent/50'
                    }`}
                  >
                    <IconComponent 
                      className="h-5 w-5 mx-auto" 
                      style={{ color: option.color }}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateProject}
              disabled={!title.trim() || isCreating}
            >
              {isCreating ? 'Creating...' : 'Create Project'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}