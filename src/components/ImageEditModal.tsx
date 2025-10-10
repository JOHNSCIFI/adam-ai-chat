import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { ImageEditor, createImageEditor, ImageEditingOptions } from '@/utils/imageEditor';
import { Download, RotateCw, FlipHorizontal, FlipVertical, Type, Crop } from 'lucide-react';
import { toast } from 'sonner';

interface ImageEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageFile: File;
  onSaveImage: (editedImageBlob: Blob) => void;
}

export const ImageEditModal: React.FC<ImageEditModalProps> = ({
  isOpen,
  onClose,
  imageFile,
  onSaveImage
}) => {
  const [imageEditor, setImageEditor] = useState<ImageEditor | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [editOptions, setEditOptions] = useState<ImageEditingOptions>({
    brightness: 50,
    contrast: 50,
    saturation: 50,
    rotate: 0
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && imageFile) {
      initializeEditor();
    }
    
    return () => {
      if (imageEditor) {
        imageEditor.dispose();
      }
    };
  }, [isOpen, imageFile]);

  const initializeEditor = async () => {
    try {
      setIsProcessing(true);
      const editor = await createImageEditor(imageFile);
      setImageEditor(editor);
      setPreviewUrl(editor.getDataURL());
      toast.success('Image loaded for editing!');
    } catch (error) {
      console.error('Failed to initialize image editor:', error);
      toast.error('Failed to load image for editing');
    } finally {
      setIsProcessing(false);
    }
  };

  const applyChanges = () => {
    if (!imageEditor) return;
    
    setIsProcessing(true);
    try {
      imageEditor.applyFilters(editOptions);
      setPreviewUrl(imageEditor.getDataURL());
      toast.success('Changes applied!');
    } catch (error) {
      console.error('Failed to apply changes:', error);
      toast.error('Failed to apply changes');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetChanges = () => {
    setEditOptions({
      brightness: 50,
      contrast: 50,
      saturation: 50,
      rotate: 0
    });
    if (imageEditor) {
      imageEditor.applyFilters({});
      setPreviewUrl(imageEditor.getDataURL());
    }
    toast.info('Changes reset');
  };

  const handleSave = async () => {
    if (!imageEditor) return;
    
    try {
      setIsProcessing(true);
      const blob = await imageEditor.getBlob(0.9);
      onSaveImage(blob);
      toast.success('Image saved!');
      onClose();
    } catch (error) {
      console.error('Failed to save image:', error);
      toast.error('Failed to save image');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (!imageEditor) return;
    
    try {
      const blob = await imageEditor.getBlob(0.9);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `edited_${imageFile.name}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Image downloaded!');
    } catch (error) {
      console.error('Failed to download image:', error);
      toast.error('Failed to download image');
    }
  };

  const quickActions = [
    {
      icon: RotateCw,
      label: 'Rotate 90°',
      action: () => {
        setEditOptions(prev => ({ ...prev, rotate: (prev.rotate || 0) + 90 }));
      }
    },
    {
      icon: FlipHorizontal,
      label: 'Flip H',
      action: () => {
        setEditOptions(prev => ({ ...prev, flip: 'horizontal' }));
      }
    },
    {
      icon: FlipVertical,
      label: 'Flip V',
      action: () => {
        setEditOptions(prev => ({ ...prev, flip: 'vertical' }));
      }
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            📝 Edit Image: {imageFile.name}
          </DialogTitle>
          <DialogDescription className="sr-only">Edit and enhance your image with various tools and filters</DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Preview Area */}
          <div className="lg:col-span-2">
            <div className="bg-muted/20 rounded-lg p-4 min-h-[400px] flex items-center justify-center">
              {previewUrl ? (
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="max-w-full max-h-[500px] object-contain rounded shadow-lg"
                />
              ) : (
                <div className="text-muted-foreground">Loading image...</div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Quick Actions</Label>
              <div className="grid grid-cols-3 gap-2">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={action.action}
                    className="flex flex-col items-center gap-1 h-auto py-2"
                  >
                    <action.icon className="h-4 w-4" />
                    <span className="text-xs">{action.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Brightness */}
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Brightness: {editOptions.brightness}
              </Label>
              <Slider
                value={[editOptions.brightness || 50]}
                onValueChange={([value]) => 
                  setEditOptions(prev => ({ ...prev, brightness: value }))
                }
                min={0}
                max={100}
                step={1}
                className="w-full"
              />
            </div>

            {/* Contrast */}
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Contrast: {editOptions.contrast}
              </Label>
              <Slider
                value={[editOptions.contrast || 50]}
                onValueChange={([value]) => 
                  setEditOptions(prev => ({ ...prev, contrast: value }))
                }
                min={0}
                max={100}
                step={1}
                className="w-full"
              />
            </div>

            {/* Saturation */}
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Saturation: {editOptions.saturation}
              </Label>
              <Slider
                value={[editOptions.saturation || 50]}
                onValueChange={([value]) => 
                  setEditOptions(prev => ({ ...prev, saturation: value }))
                }
                min={0}
                max={100}
                step={1}
                className="w-full"
              />
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button 
                onClick={applyChanges} 
                className="w-full"
                disabled={isProcessing}
              >
                {isProcessing ? 'Applying...' : 'Apply Changes'}
              </Button>
              
              <Button 
                onClick={resetChanges} 
                variant="outline" 
                className="w-full"
              >
                Reset
              </Button>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleDownload} 
                  variant="secondary" 
                  className="flex-1"
                  disabled={isProcessing}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                
                <Button 
                  onClick={handleSave} 
                  className="flex-1"
                  disabled={isProcessing}
                >
                  Save to Chat
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};