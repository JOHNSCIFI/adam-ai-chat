import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, X, FileText, ImageIcon, Video, Music } from 'lucide-react';

interface FilePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: {
    name: string;
    type: string;
    url: string;
    size: number;
  } | null;
}

export function FilePreviewModal({ open, onOpenChange, file }: FilePreviewModalProps) {
  if (!file) return null;

  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');
  const isAudio = file.type.startsWith('audio/');
  const isPDF = file.type.includes('pdf');

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    link.click();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = () => {
    if (isImage) return <ImageIcon className="h-8 w-8 text-primary" />;
    if (isVideo) return <Video className="h-8 w-8 text-primary" />;
    if (isAudio) return <Music className="h-8 w-8 text-primary" />;
    return <FileText className="h-8 w-8 text-primary" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden p-0 bg-[hsl(var(--surface))] border border-[hsl(var(--border))] shadow-modal rounded-lg">
        <DialogHeader className="px-6 py-4 border-b border-[hsl(var(--border))] bg-[hsl(var(--surface))]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDownload}
                className="bg-[hsl(var(--surface))] border-[hsl(var(--border))] text-[hsl(var(--text))] hover:bg-[hsl(var(--sidebar-hover))] transition-all duration-fast"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => onOpenChange(false)}
              className="text-[hsl(var(--muted))] hover:text-[hsl(var(--text))] hover:bg-[hsl(var(--sidebar-hover))] rounded-md"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto p-6 bg-[hsl(var(--surface))] min-h-[60vh]">
          {isImage && (
            <div className="flex justify-center items-center min-h-[60vh]">
              <img 
                src={file.url} 
                alt=""
                className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-card"
              />
            </div>
          )}
          
          {isVideo && (
            <div className="flex justify-center items-center min-h-[60vh]">
              <video 
                src={file.url} 
                controls 
                className="max-w-full max-h-[75vh] rounded-lg shadow-card"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          )}
          
          {isAudio && (
            <div className="flex flex-col items-center gap-8 min-h-[60vh] justify-center">
              <div className="w-32 h-32 bg-[hsl(var(--accent))]/20 rounded-full flex items-center justify-center shadow-card border border-[hsl(var(--border))]">
                <Music className="h-16 w-16 text-[hsl(var(--accent))]" />
              </div>
              <audio 
                src={file.url} 
                controls 
                className="w-full max-w-lg shadow-card rounded-md"
              >
                Your browser does not support the audio tag.
              </audio>
            </div>
          )}
          
          {isPDF && (
            <div className="flex flex-col items-center gap-6 min-h-[60vh] justify-center">
              <div className="w-32 h-32 bg-[hsl(var(--danger))]/20 rounded-lg flex items-center justify-center shadow-card border border-[hsl(var(--border))]">
                <FileText className="h-16 w-16 text-[hsl(var(--danger))]" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2 text-[hsl(var(--text))]">PDF Preview</h3>
                <p className="text-[hsl(var(--muted))] max-w-md">
                  PDF files cannot be previewed here. Click the download button above to view the file.
                </p>
              </div>
            </div>
          )}
          
          {!isImage && !isVideo && !isAudio && !isPDF && (
            <div className="flex flex-col items-center gap-6 min-h-[60vh] justify-center">
              <div className="w-32 h-32 bg-[hsl(var(--muted))]/20 rounded-lg flex items-center justify-center shadow-card border border-[hsl(var(--border))]">
                <FileText className="h-16 w-16 text-[hsl(var(--muted))]" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2 text-[hsl(var(--text))]">File Preview</h3>
                <p className="text-[hsl(var(--muted))] max-w-md">
                  This file type cannot be previewed. Click the download button above to view the file.
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}