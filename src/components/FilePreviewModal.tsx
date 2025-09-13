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
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden p-0 bg-background/95 backdrop-blur-sm border-2 border-border/20 shadow-2xl">
        <DialogHeader className="px-6 py-4 border-b border-border/50 bg-gradient-to-r from-background to-background/95">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
                {getFileIcon()}
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-foreground">{file.name}</DialogTitle>
                <p className="text-sm text-muted-foreground font-medium">{formatFileSize(file.size)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDownload}
                className="hover:bg-primary hover:text-primary-foreground transition-all duration-200 hover:scale-105 shadow-sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onOpenChange(false)}
                className="hover:bg-destructive hover:text-destructive-foreground rounded-full transition-all duration-200 hover:scale-105"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto p-8 bg-gradient-to-br from-background via-background to-background/95">
          {isImage && (
            <div className="flex justify-center items-center min-h-[60vh]">
              <img 
                src={file.url} 
                alt={file.name} 
                className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl border border-border/20"
              />
            </div>
          )}
          
          {isVideo && (
            <div className="flex justify-center items-center min-h-[60vh]">
              <video 
                src={file.url} 
                controls 
                className="max-w-full max-h-[75vh] rounded-2xl shadow-2xl border border-border/20"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          )}
          
          {isAudio && (
            <div className="flex flex-col items-center gap-8 min-h-[60vh] justify-center">
              <div className="w-40 h-40 bg-gradient-to-br from-primary/30 via-primary/20 to-primary/10 rounded-full flex items-center justify-center shadow-2xl border border-primary/20">
                <Music className="h-20 w-20 text-primary/80" />
              </div>
              <audio 
                src={file.url} 
                controls 
                className="w-full max-w-lg shadow-lg rounded-xl"
              >
                Your browser does not support the audio tag.
              </audio>
            </div>
          )}
          
          {isPDF && (
            <div className="flex flex-col items-center gap-6 min-h-[60vh] justify-center">
              <div className="w-40 h-40 bg-gradient-to-br from-red-500/30 via-red-500/20 to-red-500/10 rounded-2xl flex items-center justify-center shadow-2xl border border-red-500/20">
                <FileText className="h-20 w-20 text-red-500/80" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">PDF Preview</h3>
                <p className="text-muted-foreground max-w-md">
                  PDF files cannot be previewed here. Click the download button above to view the file.
                </p>
              </div>
            </div>
          )}
          
          {!isImage && !isVideo && !isAudio && !isPDF && (
            <div className="flex flex-col items-center gap-6 min-h-[60vh] justify-center">
              <div className="w-40 h-40 bg-gradient-to-br from-muted via-muted/70 to-muted/50 rounded-2xl flex items-center justify-center shadow-2xl border border-border/20">
                <FileText className="h-20 w-20 text-muted-foreground/80" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">File Preview</h3>
                <p className="text-muted-foreground max-w-md">
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