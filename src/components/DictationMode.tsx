import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Check, X, MicOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DictationModeProps {
  isActive: boolean;
  onStart: () => void;
  onStop: (transcribedText: string) => void;
  onCancel: () => void;
}

export const DictationMode: React.FC<DictationModeProps> = ({
  isActive,
  onStart,
  onStop,
  onCancel
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [volumeLevel, setVolumeLevel] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const volumeAnimationRef = useRef<number | null>(null);

  // Start dictation
  const startDictation = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Set up audio analysis for volume visualization
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      analyserRef.current.fftSize = 256;
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      // Start volume monitoring
      const updateVolume = () => {
        if (analyserRef.current && isListening) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / bufferLength;
          setVolumeLevel(Math.min(100, (average / 255) * 100));
          volumeAnimationRef.current = requestAnimationFrame(updateVolume);
        }
      };
      updateVolume();

      // Set up MediaRecorder for speech-to-text
      mediaRecorderRef.current = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        await processAudioForTranscription(audioBlob);
        chunks.length = 0;
      };

      mediaRecorderRef.current.start();
      setIsListening(true);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error starting dictation:', error);
    }
  };

  // Stop dictation
  const stopDictation = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    if (volumeAnimationRef.current) {
      cancelAnimationFrame(volumeAnimationRef.current);
    }
    
    setIsListening(false);
    setVolumeLevel(0);
  };

  // Process audio for transcription
  const processAudioForTranscription = async (audioBlob: Blob) => {
    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        
        // Send to Supabase function for transcription
        const { data, error } = await supabase.functions.invoke('speech-to-text', {
          body: { audio: base64Audio }
        });

        if (error) {
          console.error('Speech-to-text error:', error);
          return;
        }

        if (data?.text) {
          setTranscribedText(prev => prev + (prev ? ' ' : '') + data.text);
        }
      };
      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error('Error processing audio:', error);
    }
  };

  // Handle dictation start/stop
  useEffect(() => {
    if (isActive && !isListening) {
      startDictation();
    } else if (!isActive && isListening) {
      stopDictation();
    }
  }, [isActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopDictation();
    };
  }, []);

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle done button
  const handleDone = () => {
    stopDictation();
    onStop(transcribedText);
    setTranscribedText('');
    setElapsedTime(0);
  };

  // Handle cancel button
  const handleCancel = () => {
    stopDictation();
    onCancel();
    setTranscribedText('');
    setElapsedTime(0);
  };

  if (!isActive) return null;

  return (
    <div className="space-y-3">
      {/* Waveform visualization */}
      <div className="h-12 bg-muted/30 rounded-lg flex items-center justify-center relative overflow-hidden">
        <div className="flex items-center space-x-1 h-full">
          {Array.from({ length: 20 }).map((_, i) => {
            const height = Math.max(4, (volumeLevel / 100) * 40 * (0.5 + 0.5 * Math.sin((i * Math.PI) / 10)));
            return (
              <div
                key={i}
                className="bg-primary rounded-full transition-all duration-75 ease-out"
                style={{
                  width: '3px',
                  height: `${height}px`,
                  opacity: isListening ? 0.3 + (volumeLevel / 100) * 0.7 : 0.3
                }}
              />
            );
          })}
        </div>
        
        {/* Recording indicator */}
        {isListening && (
          <div className="absolute top-2 left-2 flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-xs text-muted-foreground">Recording</span>
          </div>
        )}
        
        {/* Timer */}
        <div className="absolute top-2 right-2">
          <span className="text-xs font-mono text-muted-foreground">
            {formatTime(elapsedTime)}
          </span>
        </div>
      </div>

      {/* Control buttons */}
      <div className="flex items-center justify-center space-x-3">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCancel}
          className="h-8 px-3"
        >
          <X className="h-4 w-4 mr-1" />
          Cancel
        </Button>
        
        <Button
          variant="default"
          size="sm"
          onClick={handleDone}
          disabled={!transcribedText.trim()}
          className="h-8 px-3"
        >
          <Check className="h-4 w-4 mr-1" />
          Done
        </Button>
      </div>
      
      {/* Debug: Show accumulated text (hidden from user) */}
      {transcribedText && (
        <div className="text-xs text-muted-foreground opacity-0 pointer-events-none">
          Accumulated: {transcribedText}
        </div>
      )}
    </div>
  );
};