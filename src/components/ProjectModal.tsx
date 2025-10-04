import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { 
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
  { icon: Briefcase, name: 'briefcase', color: '#10b981', label: 'Investing' },
  { icon: BookOpen, name: 'book', color: '#3b82f6', label: 'Homework' },
  { icon: Code, name: 'code', color: '#8b5cf6', label: 'Writing' },
  { icon: Heart, name: 'heart', color: '#ef4444', label: 'Health' },
  { icon: Target, name: 'target', color: '#f59e0b', label: 'Travel' },
];

interface ProjectModalProps {
  children: React.ReactNode;
  project?: {
    id: string;
    title: string;
    description?: string;
    icon: string;
    color: string;
  };
  isEditing?: boolean;
  onProjectCreated?: () => void;
  onProjectUpdated?: () => void;
}

export function ProjectModal({ 
  children, 
  project, 
  isEditing = false, 
  onProjectCreated, 
  onProjectUpdated 
}: ProjectModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState(project?.title || '');
  const [selectedIcon, setSelectedIcon] = useState(
    iconOptions.find(opt => opt.name === project?.icon) || iconOptions[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (project) {
      setTitle(project.title);
      setSelectedIcon(iconOptions.find(opt => opt.name === project.icon) || iconOptions[0]);
    }
  }, [project]);

  const handleSubmit = async () => {
    if (!title.trim() || !user) return;

    setIsSubmitting(true);
    try {
      if (isEditing && project) {
        // Update existing project
        const { error } = await supabase
          .from('projects')
          .update({
            title: title.trim(),
            icon: selectedIcon.name,
            color: selectedIcon.color,
          })
          .eq('id', project.id);

        if (error) throw error;

        onProjectUpdated?.();
      } else {
        // Create new project
        const { data, error } = await supabase
          .from('projects')
          .insert({
            user_id: user.id,
            title: title.trim(),
            icon: selectedIcon.name,
            color: selectedIcon.color,
          })
          .select()
          .single();

        if (error) throw error;

        onProjectCreated?.();
        
        // Navigate to the new project page
        navigate(`/project/${data.id}`);
      }

      // Reset form
      setTitle('');
      setSelectedIcon(iconOptions[0]);
      setIsOpen(false);
      
    } catch (error) {
      console.error('Error with project:', error);
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? 'update' : 'create'} project. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (open && !user && !isEditing) {
      // If trying to open for new project creation and user is not signed in
      navigate('/pricing-plans');
      return;
    }
    setIsOpen(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-w-[95vw] bg-background border shadow-lg mx-2">
        <DialogHeader className="text-center pb-4 sm:pb-6">
          <DialogTitle className="text-xl sm:text-2xl font-semibold text-foreground">
            {isEditing ? 'Edit Project' : 'Create New Project'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 sm:space-y-8 px-1 sm:px-2">
          {/* Project Name Input */}
          <div className="flex justify-center">
            <div className="w-full">
              <Input
                placeholder="Enter project name"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-center text-base sm:text-lg font-medium border border-border rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 bg-background hover:border-primary/50 focus:border-primary transition-colors w-full"
              />
            </div>
          </div>

          {/* Icon Selection */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-center text-sm font-medium text-muted-foreground">Choose an icon</h3>
            <div className="w-full overflow-hidden">
              <div className="flex gap-2 sm:gap-3 overflow-x-auto scrollbar-hide pb-2 px-1 justify-center">
                {iconOptions.map((option) => {
                  const IconComponent = option.icon;
                  const isSelected = selectedIcon.name === option.name;
                  return (
                    <button
                      key={option.name}
                      onClick={() => setSelectedIcon(option)}
                      className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 min-w-fit ${
                        isSelected 
                          ? 'bg-primary text-primary-foreground shadow-md scale-105' 
                          : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border hover:border-primary/30'
                      }`}
                    >
                      <IconComponent className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="hidden xs:inline">{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Create Button */}
          <div className="flex justify-center pt-4 sm:pt-6 pb-1 sm:pb-2">
            <Button 
              onClick={handleSubmit}
              disabled={!title.trim() || isSubmitting}
              size="lg"
              className="w-full sm:w-auto px-8 sm:px-12 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold shadow-md hover:shadow-lg transition-all text-sm sm:text-base"
            >
              {isSubmitting 
                ? (isEditing ? 'Updating...' : 'Creating...') 
                : (isEditing ? 'Update Project' : 'Create Project')
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}