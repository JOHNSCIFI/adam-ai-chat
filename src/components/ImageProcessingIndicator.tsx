import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

interface ImageProcessingIndicatorProps {
  prompt: string;
  onComplete?: () => void;
}

export const ImageProcessingIndicator: React.FC<ImageProcessingIndicatorProps> = ({ prompt, onComplete }) => {
  const [stage, setStage] = useState(0);

  const stages = [
    "Understanding your request",
    "Preparing the canvas",
    "Adding details and colors", 
    "Refining the artwork",
    "Finalizing the image"
  ];

  useEffect(() => {
    // Reset stage when prompt changes
    setStage(0);
    
    const stageInterval = setInterval(() => {
      setStage(prev => (prev + 1) % stages.length);
    }, 2000);

    return () => {
      clearInterval(stageInterval);
    };
  }, [prompt]);

  return (
    <div className="flex flex-col gap-4 p-6 rounded-lg bg-muted/50 border">
      <div className="flex items-center gap-3">
        <div className="relative">
          {/* Circular spinning animation like ChatGPT */}
          <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <Sparkles className="h-3 w-3 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        </div>
        <span className="font-medium text-foreground">Generating Image</span>
      </div>
      
      <div className="text-sm text-muted-foreground">
        <div className="mb-3 p-3 bg-background/50 rounded-md border border-border/50">
          <span className="text-foreground font-medium">Prompt:</span> "{prompt}"
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            {/* Small circular indicator for stage */}
            <div className="w-4 h-4 border border-primary/30 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            </div>
          </div>
          <span className="text-foreground font-medium">{stages[stage]}</span>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-primary/50 to-primary transition-all duration-2000 ease-in-out"
          style={{ width: `${((stage + 1) / stages.length) * 100}%` }}
        />
      </div>
    </div>
  );
};