import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Volume2, Loader2 } from 'lucide-react';
import { VoiceService, VoiceServiceConfig } from '@/services/voiceService';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { v4 as uuidv4 } from 'uuid';

interface VoiceWidgetProps {
  chatId: string;
  onMessageSent: (messageId: string, content: string, role: 'user' | 'assistant') => void;
}

const VoiceWidget: React.FC<VoiceWidgetProps> = ({ chatId, onMessageSent }) => {
  const [state, setState] = useState<'idle' | 'listening' | 'processing' | 'playing'>('idle');
  const [transcription, setTranscription] = useState<string>('');
  const [isVisible, setIsVisible] = useState(false);
  const voiceServiceRef = useRef<VoiceService | null>(null);
  const { user } = useAuth();

  // Waveform animation data
  const [waveformData, setWaveformData] = useState([1, 2, 1, 3, 2, 1, 4, 2, 3, 1]);
  const waveformIntervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (state === 'listening') {
      // Animate waveform while listening
      waveformIntervalRef.current = setInterval(() => {
        setWaveformData(prev => prev.map(() => Math.random() * 4 + 1));
      }, 200);
    } else {
      if (waveformIntervalRef.current) {
        clearInterval(waveformIntervalRef.current);
        setWaveformData([1, 2, 1, 3, 2, 1, 4, 2, 3, 1]); // Reset to default
      }
    }

    return () => {
      if (waveformIntervalRef.current) {
        clearInterval(waveformIntervalRef.current);
      }
    };
  }, [state]);

  useEffect(() => {
    const config: VoiceServiceConfig = {
      onTranscriptionUpdate: (text: string) => {
        setTranscription(text);
        setIsVisible(true);
      },
      onResponse: async (text: string) => {
        // Save messages to database
        try {
          // Save user message
          const userMessageId = uuidv4();
          const { error: userError } = await supabase
            .from('messages')
            .insert({
              id: userMessageId,
              chat_id: chatId,
              content: transcription,
              role: 'user'
            });

          if (!userError) {
            onMessageSent(userMessageId, transcription, 'user');
          }

          // Save AI message
          const aiMessageId = uuidv4();
          const { error: aiError } = await supabase
            .from('messages')
            .insert({
              id: aiMessageId,
              chat_id: chatId,
              content: text,
              role: 'assistant'
            });

          if (!aiError) {
            onMessageSent(aiMessageId, text, 'assistant');
          }

        } catch (error) {
          console.error('Error saving voice chat messages:', error);
        }
        
        // Clear transcription after a delay
        setTimeout(() => {
          setTranscription('');
          setIsVisible(false);
        }, 3000);
      },
      onStateChange: (newState) => {
        setState(newState);
      },
      onError: (error: string) => {
        console.error('Voice service error:', error);
        setState('idle');
        setTranscription('');
        setIsVisible(false);
      },
      chatId: chatId
    };

    voiceServiceRef.current = new VoiceService(config);

    return () => {
      voiceServiceRef.current?.cleanup();
    };
  }, [chatId, onMessageSent, transcription]);

  const handleMouseDown = () => {
    if (state === 'idle') {
      voiceServiceRef.current?.startRecording();
    }
  };

  const handleMouseUp = () => {
    if (state === 'listening') {
      voiceServiceRef.current?.stopRecording();
    }
  };

  const getButtonIcon = () => {
    switch (state) {
      case 'listening':
        return <MicOff className="h-6 w-6" />;
      case 'processing':
        return <Loader2 className="h-6 w-6 animate-spin" />;
      case 'playing':
        return <Volume2 className="h-6 w-6" />;
      default:
        return <Mic className="h-6 w-6" />;
    }
  };

  const getButtonVariant = () => {
    switch (state) {
      case 'listening':
        return 'destructive';
      case 'processing':
      case 'playing':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getStatusText = () => {
    switch (state) {
      case 'listening':
        return 'Listening...';
      case 'processing':
        return 'Processing...';
      case 'playing':
        return 'Playing...';
      default:
        return 'Hold to speak';
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-center space-y-3">
      {/* Transcript Display */}
      {isVisible && transcription && (
        <div className="max-w-sm p-3 bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg animate-in slide-in-from-bottom-5 duration-300">
          <p className="text-sm text-foreground">{transcription}</p>
        </div>
      )}

      {/* Status Display */}
      {state !== 'idle' && (
        <div className="flex items-center space-x-2 px-3 py-2 bg-background/95 backdrop-blur-sm border rounded-full shadow-lg animate-in slide-in-from-bottom-5 duration-300">
          {state === 'listening' && (
            <div className="flex items-center space-x-1">
              {waveformData.map((height, index) => (
                <div
                  key={index}
                  className="w-1 bg-primary rounded-full transition-all duration-200"
                  style={{ height: `${height * 4}px` }}
                />
              ))}
            </div>
          )}
          <span className="text-xs font-medium text-foreground">{getStatusText()}</span>
        </div>
      )}

      {/* Main Voice Button */}
      <Button
        variant={getButtonVariant()}
        size="icon"
        className={`h-16 w-16 rounded-full shadow-lg transition-all duration-200 ${
          state === 'listening' 
            ? 'scale-110 shadow-xl shadow-destructive/25 animate-pulse' 
            : 'hover:scale-105 active:scale-95'
        } ${state === 'processing' || state === 'playing' ? 'animate-pulse' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUp}
        disabled={state === 'processing' || state === 'playing'}
        aria-label={state === 'idle' ? 'Hold to start voice chat' : getStatusText()}
        role="button"
        tabIndex={0}
      >
        {getButtonIcon()}
      </Button>

      {/* Instructions */}
      {state === 'idle' && (
        <p className="text-xs text-muted-foreground text-center max-w-32">
          Hold to speak, release to send
        </p>
      )}
    </div>
  );
};

export default VoiceWidget;