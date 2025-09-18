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
  const { projectName } = useParams();
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

  // Calculate proper centering based on sidebar state
  const getContainerStyle = () => {
    if (collapsed) {
      return { 
        marginLeft: 'calc(56px + (100vw - 56px - 768px) / 2)', 
        marginRight: 'auto',
        maxWidth: '768px'
      };
    } else {
      return { 
        marginLeft: 'calc(280px + (100vw - 280px - 768px) / 2)', 
        marginRight: 'auto',
        maxWidth: '768px'
      };
    }
  };

  useEffect(() => {
    if (projectName && user) {
      fetchProject();
    }
  }, [projectName, user]);

  useEffect(() => {
    if (project && user) {
      fetchProjectChats();
    }
  }, [project, user]);

  const fetchProject = async () => {
    if (!projectName || !user) return;

    try {
      const projectTitle = projectName.replace(/-/g, ' ');
      
      const { data: projectData, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .ilike('title', projectTitle)
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
          <div style={getContainerStyle()} className="h-full flex flex-col">
            {/* Header */}
            <div className="border-b border-border/40 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="p-3 rounded-lg text-white flex items-center justify-center"
                    style={{ backgroundColor: project.color }}
                  >
                    <span className="text-lg">{project.icon}</span>
                  </div>
                  <div>
                    <h1 className="text-2xl font-semibold text-foreground">{project.title}</h1>
                    {project.description && (
                      <p className="text-sm text-muted-foreground">{project.description}</p>
                    )}
                  </div>
                </div>
                <Button 
                  onClick={startEditingProject}
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Edit2 className="h-4 w-4" />
                  Edit Project
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {chats.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center space-y-6 max-w-md">
                    <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                      <MessageSquare className="h-8 w-8 text-white" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-xl font-semibold text-foreground">Start your first chat</h2>
                      <p className="text-muted-foreground">
                        Create a new conversation in your {project.title} project.
                      </p>
                    </div>
                    <Button onClick={createNewChat} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      New chat in {project.title}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-foreground">Recent conversations</h3>
                    <Button onClick={createNewChat} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      New chat
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {chats.map((chat) => (
                      <div
                        key={chat.id}
                        onClick={() => navigate(`/chat/${chat.id}`)}
                        className="p-4 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <MessageSquare className="h-5 w-5 text-muted-foreground mt-1" />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-foreground truncate">{chat.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {new Date(chat.updated_at).toLocaleDateString()} • Last activity
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Input area */}
            <div className="border-t border-border/40 p-4">
              <div className="relative">
                <Textarea
                  placeholder={`Message ${project.title}...`}
                  value={newPrompt}
                  onChange={(e) => setNewPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      startChatFromPrompt();
                    }
                  }}
                  className="min-h-[60px] max-h-[200px] resize-none pr-12"
                />
                <Button 
                  onClick={startChatFromPrompt}
                  disabled={!newPrompt.trim()}
                  size="sm"
                  className="absolute bottom-2 right-2 h-8 w-8 p-0"
                >
                  <SendHorizontalIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Project Modal */}
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
    </div>
  );
}