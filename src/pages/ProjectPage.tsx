import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useSidebar } from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare, Plus, Edit2, Save, X } from 'lucide-react';
import { SendHorizontalIcon } from '@/components/ui/send-horizontal-icon';
import { useToast } from '@/hooks/use-toast';
import { ProjectModal } from '@/components/ProjectModal';

interface Chat {
  id: string;
  title: string;
  updated_at: string;
  project_id?: string;
}

interface Project {
  id: string;
  title: string;
  icon: string;
  color: string;
  description?: string;
}

export default function ProjectPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { state: sidebarState } = useSidebar();
  const collapsed = sidebarState === 'collapsed';
  
  const [project, setProject] = useState<Project | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [newPrompt, setNewPrompt] = useState('');
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [editedProject, setEditedProject] = useState<{ title: string; description: string }>({ title: '', description: '' });

  // Calculate proper centering based on sidebar state - center content in available space
  const getContainerStyle = () => {
    const sidebarWidth = collapsed ? 56 : 280;
    const availableWidth = `calc(100vw - ${sidebarWidth}px)`;
    
    return {
      width: availableWidth,
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'flex-start',
      paddingLeft: '2rem',
      paddingRight: '2rem'
    };
  };

  useEffect(() => {
    if (projectId && user) {
      fetchProject();
    }
  }, [projectId, user]);

  useEffect(() => {
    if (project && user) {
      fetchProjectChats();
    }
  }, [project, user]);

  const fetchProject = async () => {
    if (!projectId || !user) return;

    try {
      const { data: projectData, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .eq('id', projectId) // Use project ID instead of name
        .single();

      if (error) {
        console.error('Error fetching project:', error);
        return;
      }

      setProject(projectData);
    } catch (error) {
      console.error('Error in fetchProject:', error);
    }
  };

  const fetchProjectChats = async () => {
    if (!project || !user) return;

    try {
      const { data: chatsData, error } = await supabase
        .from('chats')
        .select('*')
        .eq('user_id', user.id)
        .eq('project_id', project.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching project chats:', error);
        return;
      }

      setChats(chatsData || []);
    } catch (error) {
      console.error('Error in fetchProjectChats:', error);
    }
  };

  const createNewChat = async () => {
    if (!user || !project) return;

    try {
      const { data: newChat, error } = await supabase
        .from('chats')
        .insert({
          user_id: user.id,
          title: 'New Chat',
          project_id: project.id
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating chat:', error);
        toast({
          title: "Error creating chat",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      navigate(`/chat/${newChat.id}`);
    } catch (error) {
      console.error('Error in createNewChat:', error);
      toast({
        title: "Error creating chat",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const startChatFromPrompt = async () => {
    if (!newPrompt.trim() || !user || !project) return;

    try {
      const { data: newChat, error } = await supabase
        .from('chats')
        .insert({
          user_id: user.id,
          title: newPrompt.length > 50 ? newPrompt.substring(0, 50) + '...' : newPrompt,
          project_id: project.id
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating chat:', error);
        toast({
          title: "Error creating chat",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      // Add initial message
      await supabase
        .from('messages')
        .insert({
          chat_id: newChat.id,
          content: newPrompt,
          role: 'user'
        });

      setNewPrompt('');
      navigate(`/chat/${newChat.id}`);
    } catch (error) {
      console.error('Error in startChatFromPrompt:', error);
      toast({
        title: "Error creating chat",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateProject = async () => {
    if (!project || !user) return;

    try {
      const { error } = await supabase
        .from('projects')
        .update({ 
          title: editedProject.title,
          description: editedProject.description
        })
        .eq('id', project.id);

      if (error) {
        console.error('Error updating project:', error);
        toast({
          title: "Error updating project",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setProject(prev => prev ? { ...prev, title: editedProject.title, description: editedProject.description } : null);
      setIsEditingProject(false);
      toast({
        title: "Project updated",
        description: "Project has been updated successfully.",
      });

      // Refresh sidebar to show updated project title
      window.dispatchEvent(new CustomEvent('force-chat-refresh'));
    } catch (error) {
      console.error('Error in handleUpdateProject:', error);
      toast({
        title: "Error updating project",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const startEditingProject = () => {
    if (project) {
      setEditedProject({ title: project.title, description: project.description || '' });
      setIsEditingProject(true);
    }
  };

  if (!project) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-hidden">
          <div style={getContainerStyle()} className="h-full max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center py-8">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div 
                  className="p-2 rounded-lg text-white flex items-center justify-center"
                  style={{ backgroundColor: project.color }}
                >
                  <span className="text-base">{project.icon}</span>
                </div>
                <h1 className="text-2xl font-semibold text-foreground">{project.title}</h1>
              </div>
            </div>

              <div className="text-center">
                <Button 
                  onClick={startEditingProject}
                  size="sm"
                  variant="outline"
                  className="inline-flex items-center gap-2 px-4 py-2"
                >
                  <Edit2 className="h-4 w-4" />
                  Edit this project
                </Button>
              </div>

              {chats.length > 0 && (
                <div className="space-y-4 mt-8">
                  <div className="space-y-3">
                    {chats.map((chat) => (
                      <div
                        key={chat.id}
                        onClick={() => navigate(`/chat/${chat.id}`)}
                        className="text-left p-3 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-foreground truncate text-sm">{chat.title}</h4>
                            <p className="text-xs text-muted-foreground">
                              {new Date(chat.updated_at).toLocaleDateString()} • {new Date(chat.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Input area */}
            <div className="p-6">
              <div className="relative">
                <div className="flex-1 flex items-center border rounded-3xl px-4 py-3 bg-white dark:bg-[hsl(var(--input))] border-gray-200 dark:border-border">
                  <div className="flex items-center gap-2 mr-3">
                    <Plus className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <Textarea
                    placeholder={`New chat in ${project.title}`}
                    value={newPrompt}
                    onChange={(e) => setNewPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        startChatFromPrompt();
                      }
                    }}
                    className="flex-1 min-h-[24px] max-h-[200px] border-0 resize-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0 py-0 text-foreground placeholder:text-muted-foreground break-words text-left"
                    style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
                    rows={1}
                  />
                  
                  <div className="flex items-center gap-1 ml-2 pb-1">
                    <Button
                      type="button"
                      onClick={startChatFromPrompt}
                      disabled={!newPrompt.trim()}
                      size="sm"
                      className="h-8 w-8 p-0 rounded-full flex-shrink-0"
                      style={{ 
                        backgroundColor: newPrompt.trim()
                          ? 'hsl(var(--primary))'
                          : 'hsl(var(--muted))',
                        color: newPrompt.trim()
                          ? 'hsl(var(--primary-foreground))'
                          : 'hsl(var(--muted-foreground))'
                      }}
                    >
                      <SendHorizontalIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Project Modal */}
      <ProjectModal
        project={project}
        isEditing={true}
        onProjectUpdated={() => {
          fetchProject();
          setIsEditingProject(false);
          window.dispatchEvent(new CustomEvent('force-chat-refresh'));
        }}
      >
        <Dialog open={isEditingProject} onOpenChange={setIsEditingProject}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Project</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Project Name</label>
                <Input
                  value={editedProject.title}
                  onChange={(e) => setEditedProject(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter project name"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={editedProject.description}
                  onChange={(e) => setEditedProject(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter project description"
                  className="mt-1"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditingProject(false)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpdateProject}
                  disabled={!editedProject.title.trim()}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </ProjectModal>
    </div>
  );
}