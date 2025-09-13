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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getFileIcon()}
              <div>
                <DialogTitle className="text-lg font-semibold">{file.name}</DialogTitle>
                <p className="text-sm text-muted-foreground">{formatFileSize(file.size)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto p-6">
          {isImage && (
            <div className="flex justify-center">
              <img 
                src={file.url} 
                alt={file.name} 
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
              />
            </div>
          )}
          
          {isVideo && (
            <div className="flex justify-center">
              <video 
                src={file.url} 
                controls 
                className="max-w-full max-h-[70vh] rounded-lg shadow-lg"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          )}
          
          {isAudio && (
            <div className="flex flex-col items-center gap-6">
              <div className="w-32 h-32 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center">
                <Music className="h-16 w-16 text-primary/70" />
              </div>
              <audio 
                src={file.url} 
                controls 
                className="w-full max-w-md"
              >
                Your browser does not support the audio tag.
              </audio>
            </div>
          )}
          
          {isPDF && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-32 h-32 bg-gradient-to-br from-red-500/20 to-red-500/5 rounded-xl flex items-center justify-center">
                <FileText className="h-16 w-16 text-red-500/70" />
              </div>
              <p className="text-muted-foreground text-center">
                PDF files cannot be previewed here. Click download to view the file.
              </p>
            </div>
          )}
          
          {!isImage && !isVideo && !isAudio && !isPDF && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-32 h-32 bg-gradient-to-br from-muted to-muted/50 rounded-xl flex items-center justify-center">
                <FileText className="h-16 w-16 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-center">
                This file type cannot be previewed. Click download to view the file.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}