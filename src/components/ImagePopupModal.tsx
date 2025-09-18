import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';
import { toast } from 'sonner';

interface ImagePopupModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  prompt?: string;
}

export function ImagePopupModal({ isOpen, onClose, imageUrl, prompt = '' }: ImagePopupModalProps) {
  const downloadImage = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `image-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Image downloaded successfully');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download image');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <div className="relative bg-background">
          {/* Header with controls */}
          <div className="flex items-center justify-end p-4 border-b border-border gap-2">
            <Button variant="outline" size="sm" onClick={downloadImage}>
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Image container */}
          <div className="overflow-auto max-h-[70vh] p-4 bg-muted/20">
            <div className="flex items-center justify-center min-h-[400px]">
              <img
                src={imageUrl}
                alt={prompt || 'Generated image'}
                className="max-w-full h-auto rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}