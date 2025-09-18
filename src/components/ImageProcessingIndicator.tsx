import React, { useState, useEffect } from 'react';
import { ImageIcon, Sparkles } from 'lucide-react';

interface ImageProcessingIndicatorProps {
  prompt: string;
  onComplete?: () => void;
}

export const ImageProcessingIndicator: React.FC<ImageProcessingIndicatorProps> = ({ prompt, onComplete }) => {
  const [stage, setStage] = useState(0);
  const [dots, setDots] = useState('');

  const stages = [
    "Understanding your request",
    "Preparing the canvas",
    "Adding details and colors", 
    "Refining the artwork",
    "Finalizing the image"
  ];

  useEffect(() => {
    const stageInterval = setInterval(() => {
      setStage(prev => {
        const next = (prev + 1) % stages.length;
        if (next === 0 && onComplete) {
          // Completed a full cycle
          setTimeout(onComplete, 1000);
        }
        return next;
      });
    }, 2000);

    const dotsInterval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 500);

    return () => {
      clearInterval(stageInterval);
      clearInterval(dotsInterval);
    };
  }, [onComplete]);

  return (
    <div className="flex flex-col gap-3 p-4 rounded-lg bg-muted/50 border">
      <div className="flex items-center gap-2">
        <div className="relative">
          <ImageIcon className="h-5 w-5 text-primary" />
          <Sparkles className="h-3 w-3 text-primary absolute -top-1 -right-1 animate-pulse" />
        </div>
        <span className="font-medium text-foreground">Generating Image</span>
      </div>
      
      <div className="text-sm text-muted-foreground">
        <div className="mb-2">"{prompt}"</div>
        <div className="flex items-center gap-2">
          <div className="flex space-x-1">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 bg-primary rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
          <span>{stages[stage]}{dots}</span>
        </div>
      </div>
      
      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-primary/50 to-primary transition-all duration-2000 ease-in-out"
          style={{ width: `${((stage + 1) / stages.length) * 100}%` }}
        />
      </div>
    </div>
  );
};