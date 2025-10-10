import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
  Rocket,
  Plus
} from 'lucide-react';

const iconMap = {
  folder: Folder,
  briefcase: Briefcase,
  book: BookOpen,
  code: Code,
  palette: Palette,
  lightbulb: Lightbulb,
  target: Target,
  heart: Heart,
  star: Star,
  rocket: Rocket,
};

interface Project {
  id: string;
  title: string;
  icon: string;
  color: string;
}

interface AddToProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatId: string;
  onChatAddedToProject?: () => void;
  onNewProjectClick?: () => void;
}

export function AddToProjectModal({ 
  isOpen, 
  onClose, 
  chatId, 
  onChatAddedToProject,
  onNewProjectClick 
}: AddToProjectModalProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [addingToProject, setAddingToProject] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && user) {
      fetchProjects();
    }
  }, [isOpen, user]);

  const fetchProjects = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, title, icon, color')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToProject = async (projectId: string) => {
    if (!user) return;

    setAddingToProject(projectId);
    try {
      const { error } = await supabase
        .from('chats')
        .update({ project_id: projectId })
        .eq('id', chatId)
        .eq('user_id', user.id);

      if (error) throw error;

      const project = projects.find(p => p.id === projectId);
      toast({
        title: "Added to project",
        description: `Chat added to "${project?.title}" successfully.`,
      });

      onClose();
      onChatAddedToProject?.();
      
    } catch (error) {
      console.error('Error adding chat to project:', error);
      toast({
        title: "Error",
        description: "Failed to add chat to project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAddingToProject(null);
    }
  };

  const handleNewProject = () => {
    onClose();
    onNewProjectClick?.();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Add to Project</DialogTitle>
          <DialogDescription className="sr-only">Add this chat to an existing project or create a new one</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {/* New Project Option */}
          <Button
            variant="ghost"
            className="w-full justify-start h-auto p-3 hover:bg-accent"
            onClick={handleNewProject}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Plus className="h-4 w-4 text-primary" />
              </div>
              <span className="font-medium">New project</span>
            </div>
          </Button>

          {/* Existing Projects */}
          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : projects.length > 0 ? (
            projects.map((project) => {
              const IconComponent = iconMap[project.icon as keyof typeof iconMap] || Folder;
              const isAdding = addingToProject === project.id;
              
              return (
                <Button
                  key={project.id}
                  variant="ghost"
                  className="w-full justify-start h-auto p-3 hover:bg-accent"
                  disabled={isAdding}
                  onClick={() => handleAddToProject(project.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: `${project.color}20` }}>
                      <IconComponent 
                        className="h-4 w-4" 
                        style={{ color: project.color }}
                      />
                    </div>
                    <span className="font-medium">{project.title}</span>
                    {isAdding && (
                      <div className="ml-auto">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      </div>
                    )}
                  </div>
                </Button>
              );
            })
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <p>No projects yet. Create your first project!</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
