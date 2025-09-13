import React, { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Paperclip, X, FileText, ImageIcon } from 'lucide-react';
import { SendHorizontalIcon } from '@/components/ui/send-horizontal-icon';
import { StopIcon } from '@/components/ui/stop-icon';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

export default function Index() {
  const { user, loading: authLoading, userProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // File size limits based on ChatGPT recommendations
  const getMaxFileSize = (type: string) => {
    if (type.startsWith('image/')) return 10 * 1024 * 1024; // 10MB for images
    if (type.startsWith('video/')) return 100 * 1024 * 1024; // 100MB for videos
    if (type.startsWith('audio/')) return 50 * 1024 * 1024; // 50MB for audio
    if (type.includes('pdf') || type.includes('document') || type.includes('text')) return 25 * 1024 * 1024; // 25MB for documents
    return 20 * 1024 * 1024; // 20MB for other files
  };

  const getFileTypeCategory = (type: string) => {
    if (type.startsWith('image/')) return 'image';
    if (type.startsWith('video/')) return 'video';
    if (type.startsWith('audio/')) return 'audio';
    if (type.includes('pdf') || type.includes('document') || type.includes('text')) return 'document';
    return 'file';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
    setIsPopoverOpen(false);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const totalSize = Array.from(files).reduce((sum, file) => sum + file.size, 0);
      const maxTotalSize = 100 * 1024 * 1024; // 100MB total per message
      
      if (totalSize > maxTotalSize) {
        toast({
          title: "Total file size too large",
          description: `Total file size cannot exceed ${formatFileSize(maxTotalSize)} per message.`,
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFiles(prev => [...prev, ...Array.from(files)]);
      // Reset the input
      event.target.value = '';
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleNewChat = async (initialMessage: string, files: File[] = []) => {
    if (loading) return;
    setLoading(true);
    
    try {
      // Create the chat first
      const { data: chatData, error: chatError } = await supabase
        .from('chats')
        .insert([{
          user_id: user.id,
          title: initialMessage || 'New Chat'
        }])
        .select()
        .single();

      if (chatError || !chatData) throw chatError;

      // Upload files to Supabase storage if any
      const uploadedFiles: FileAttachment[] = [];
      
      for (const file of files) {
        // Check file size limits
        const maxSize = getMaxFileSize(file.type);
        if (file.size > maxSize) {
          toast({
            title: "File too large",
            description: `${file.name} exceeds the ${formatFileSize(maxSize)} limit for ${getFileTypeCategory(file.type)} files.`,
            variant: "destructive",
          });
          continue;
        }

        const fileExtension = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('chat-files')
          .upload(fileName, file);

        if (uploadError) {
          console.error('File upload error:', uploadError);
          toast({
            title: "Upload failed",
            description: `Failed to upload ${file.name}`,
            variant: "destructive",
          });
          continue;
        }

        // Get public URL for the uploaded file
        const { data: urlData } = supabase.storage
          .from('chat-files')
          .getPublicUrl(fileName);

        uploadedFiles.push({
          id: uploadData.id || Date.now().toString(),
          name: file.name,
          size: file.size,
          type: file.type,
          url: urlData.publicUrl
        });
      }

      // Add initial message to the chat if provided
      if (initialMessage.trim() || uploadedFiles.length > 0) {
        const { error: messageError } = await supabase
          .from('messages')
          .insert({
            chat_id: chatData.id,
            content: initialMessage,
            role: 'user',
            file_attachments: uploadedFiles as any
          });

        if (messageError) throw messageError;
      }

      // Navigate to the new chat immediately for smooth experience
      // The chat page will handle getting the AI response automatically
      navigate(`/chat/${chatData.id}`);

    } catch (error: any) {
      console.error('Create chat error:', error);
      toast({
        title: "Error creating chat",
        description: "Unable to create new chat. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() || selectedFiles.length > 0) {
      handleNewChat(message.trim(), selectedFiles);
      setMessage('');
      setSelectedFiles([]);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Header - clean like ChatGPT */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background">
        <div className="text-xl font-semibold text-foreground">AdamGPT</div>
        <div className="flex items-center space-x-4">
          
        </div>
      </div>

      {/* Main Content - centered from all sides */}
      <div className="flex-1 flex flex-col items-center justify-center px-6" style={{ paddingTop: '30vh' }}>
        <div className="w-full max-w-3xl text-center">
          {/* Welcome Message */}
          <h1 className="text-3xl font-normal text-foreground mb-12">
            How can I help, {userProfile?.display_name || user?.email?.split('@')[0] || 'there'}?
          </h1>
          
          {/* File attachments preview */}
          {selectedFiles.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2 justify-center">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 text-sm">
                  {getFileIcon(file.type)}
                  <span className="truncate max-w-32">{file.name}</span>
                  <button 
                    onClick={() => removeFile(index)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="relative">
            <div className="flex items-center gap-2 bg-background border border-border rounded-3xl shadow-sm">
              <div className="flex-1 flex items-center">
                <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-10 w-10 p-0 m-2 hover:bg-muted rounded-full"
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-2 bg-background border shadow-lg" align="start">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start gap-2"
                      onClick={handleFileUpload}
                    >
                      <Paperclip className="h-4 w-4" />
                      Attach files
                    </Button>
                  </PopoverContent>
                </Popover>
                
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask anything..."
                  className="flex-1 bg-transparent border-none outline-none py-3 pr-4 text-foreground placeholder-muted-foreground resize-none"
                />
              </div>
              
              <Button
                type="submit"
                disabled={(!message.trim() && selectedFiles.length === 0) || loading}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 m-2 rounded-full text-foreground hover:bg-muted"
              >
                {loading ? <StopIcon className="h-4 w-4" /> : <SendHorizontalIcon className="h-4 w-4" />}
              </Button>
            </div>
          </form>
          
          <p className="text-xs text-muted-foreground text-center mt-2">
            AdamGPT can make mistakes. Check important info.
          </p>
        </div>
      </div>

      {/* Input Area moved to center - keep this div for proper structure */}
      <div className="hidden">
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.csv,.json,.xml,.py,.js,.html,.css,.md"
      />
    </div>
  );
}