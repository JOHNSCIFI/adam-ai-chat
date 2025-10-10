import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ImagePopupModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  prompt?: string;
}

export function ImagePopupModal({ isOpen, onClose, imageUrl, prompt = '' }: ImagePopupModalProps) {
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 4));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.25));
  };

  const handleReset = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
      e.preventDefault();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prev => Math.max(0.25, Math.min(4, prev + delta)));
  };

  const downloadImage = async () => {
    try {
      let response;
      
      // Check if it's a Supabase storage URL
      if (imageUrl.includes('supabase') || imageUrl.includes('storage')) {
        // Use Supabase client for authenticated requests
        const { data, error } = await supabase.storage
          .from('chat-files')
          .download(imageUrl.split('/').pop() || `image-${Date.now()}`);
          
        if (error) throw error;
        response = { blob: () => Promise.resolve(data) };
      } else {
        // For external URLs, try direct fetch
        response = await fetch(imageUrl, {
          method: 'GET',
          mode: 'cors',
          cache: 'no-cache',
        });
        
        if (!response.ok) throw new Error('Failed to fetch image');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `image-${Date.now()}.png`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
      
      toast.success('Image downloaded successfully');
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback: open image in new tab
      try {
        const newWindow = window.open(imageUrl, '_blank');
        if (newWindow) {
          toast.success('Image opened in new tab - right-click to save');
        } else {
          toast.error('Please allow popups to download images');
        }
      } catch (fallbackError) {
        toast.error('Failed to download image. Please try right-clicking the image to save.');
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 gap-0">
        <DialogTitle className="sr-only">
          {prompt || 'Image viewer'}
        </DialogTitle>
        <style>{`
          .dialog-close-hidden + button[data-dialog-close] {
            display: none !important;
          }
          .dialog-close-hidden ~ button {
            display: none !important;
          }
          [data-radix-dialog-content] > button:last-child {
            display: none !important;
          }
        `}</style>
        <div className="flex flex-col h-full bg-background dialog-close-hidden">
          {/* Header with controls */}
          <div className="flex items-center justify-between p-3 border-b border-border bg-background/95 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomOut}
                disabled={zoom <= 0.25}
                className="h-8 w-8 p-0"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[3rem] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomIn}
                disabled={zoom >= 4}
                className="h-8 w-8 p-0"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="h-8 px-2 text-xs"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Reset
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={downloadImage}
                className="h-8 w-8 p-0"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Image container */}
          <div 
            className="flex-1 overflow-hidden bg-black/5 dark:bg-black/20 flex items-center justify-center relative select-none cursor-default"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            style={{ touchAction: 'none' }}
          >
            <img
              src={imageUrl}
              alt={prompt || 'Image'}
              className={`max-w-none origin-center select-none ${
                zoom > 1 
                  ? isDragging 
                    ? 'cursor-grabbing' 
                    : 'cursor-grab'
                  : 'cursor-default'
              }`}
              style={{
                transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
                maxHeight: 'calc(95vh - 60px)',
                maxWidth: '95vw',
                transition: isDragging ? 'none' : 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                willChange: 'transform'
              }}
              onMouseDown={handleMouseDown}
              onDragStart={(e) => e.preventDefault()}
              draggable={false}
              onLoad={() => {
                setPosition({ x: 0, y: 0 });
                setZoom(1);
              }}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}