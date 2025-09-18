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

        toast({
          title: "Project updated",
          description: `"${title}" has been updated successfully.`,
        });

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

        toast({
          title: "Project created",
          description: `"${title}" has been created successfully.`,
        });

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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-background">
        <DialogHeader className="text-center pb-2">
          <DialogTitle className="text-xl font-normal">
            {isEditing ? 'Edit Project' : 'Project name'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Project Name Input */}
          <div className="space-y-2">
            <Input
              placeholder="Enter project name"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-center text-lg font-medium border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
            />
          </div>

          {/* Icon Selection */}
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="flex gap-2 overflow-x-auto scrollbar-hide max-w-full px-2">
                {iconOptions.map((option) => {
                  const IconComponent = option.icon;
                  const isSelected = selectedIcon.name === option.name;
                  return (
                    <button
                      key={option.name}
                      onClick={() => setSelectedIcon(option)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all whitespace-nowrap flex-shrink-0 ${
                        isSelected 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      <IconComponent className="h-4 w-4" />
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Create Button */}
          <div className="flex justify-center pt-4">
            <Button 
              onClick={handleSubmit}
              disabled={!title.trim() || isSubmitting}
              className="px-8 py-2 rounded-lg bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
            >
              {isSubmitting 
                ? (isEditing ? 'Updating...' : 'Creating...') 
                : (isEditing ? 'Update project' : 'Create project')
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}