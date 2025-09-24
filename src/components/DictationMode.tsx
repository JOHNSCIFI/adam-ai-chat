import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DictationModeProps {
  onTextReady: (text: string) => void;
  onCancel: () => void;
}

interface AudioAnalyzer {
  analyser: AnalyserNode;
  dataArray: Uint8Array;
}

const DictationMode: React.FC<DictationModeProps> = ({ onTextReady, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [accumulatedText, setAccumulatedText] = useState('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AudioAnalyzer | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    startDictation();
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const startDictation = async () => {
    try {
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Set up audio context for visualization
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyser);
      
      analyzerRef.current = { analyser, dataArray };

      // Set up MediaRecorder for audio capture
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
        await processAudioChunk(audioBlob);
      };

      // Set up speech recognition for real-time transcription
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: any) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              transcript += event.results[i][0].transcript + ' ';
            }
          }
          if (transcript.trim()) {
            setAccumulatedText(prev => prev + transcript);
          }
        };

        recognitionRef.current.start();
      }

      // Start recording and timer
      mediaRecorderRef.current.start(1000); // Collect data every second
      setIsRecording(true);
      startTimer();
      startVisualization();

    } catch (error) {
      console.error('Error starting dictation:', error);
      onCancel();
    }
  };

  const processAudioChunk = async (audioBlob: Blob) => {
    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        
        // Send to speech-to-text edge function
        const { data, error } = await supabase.functions.invoke('speech-to-text', {
          body: { audio: base64Audio }
        });

        if (error) {
          console.error('Speech-to-text error:', error);
          return;
        }

        if (data?.text) {
          setAccumulatedText(prev => prev + ' ' + data.text);
        }
      };
      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error('Error processing audio chunk:', error);
    }
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const startVisualization = () => {
    const updateVisualization = () => {
      if (analyzerRef.current) {
        const { analyser, dataArray } = analyzerRef.current;
        analyser.getByteFrequencyData(dataArray);
        
        // Calculate average audio level
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        setAudioLevel(average);
      }
      
      if (isRecording) {
        animationRef.current = requestAnimationFrame(updateVisualization);
      }
    };
    updateVisualization();
  };

  const handleDone = () => {
    cleanup();
    onTextReady(accumulatedText.trim());
  };

  const handleCancel = () => {
    cleanup();
    onCancel();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Generate waveform bars based on audio level
  const generateWaveform = () => {
    const bars = [];
    const numBars = 20;
    const baseHeight = 2;
    const maxHeight = 24;
    
    for (let i = 0; i < numBars; i++) {
      // Create variation in bar heights based on audio level and position
      const variation = Math.sin((i / numBars) * Math.PI * 2 + Date.now() * 0.01) * 0.5 + 0.5;
      const height = baseHeight + (audioLevel / 255) * maxHeight * variation;
      
      bars.push(
        <div
          key={i}
          className="bg-primary rounded-full transition-all duration-75"
          style={{
            width: '2px',
            height: `${Math.max(baseHeight, height)}px`,
            opacity: 0.7 + (audioLevel / 255) * 0.3
          }}
        />
      );
    }
    return bars;
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm">
      <div className="fixed bottom-0 left-0 right-0 p-6">
        <div className="max-w-md mx-auto">
          {/* Close button */}
          <div className="flex justify-between items-center mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="h-8 w-8 rounded-full p-0"
            >
              <X className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">Dictation Mode</span>
            <div className="w-8" /> {/* Spacer */}
          </div>

          {/* Waveform visualization */}
          <div className="flex items-center justify-center gap-1 mb-6 h-8">
            {generateWaveform()}
          </div>

          {/* Timer */}
          <div className="text-center mb-6">
            <span className="text-2xl font-mono font-medium">
              {formatTime(recordingTime)}
            </span>
          </div>

          {/* Done button */}
          <div className="flex justify-center">
            <Button
              onClick={handleDone}
              className="h-12 w-12 rounded-full bg-primary hover:bg-primary/90"
              disabled={!accumulatedText.trim()}
            >
              <Check className="h-6 w-6" />
            </Button>
          </div>

          {/* Preview text (optional, can be hidden) */}
          {accumulatedText && (
            <div className="mt-4 p-3 bg-muted rounded-lg max-h-32 overflow-y-auto">
              <p className="text-sm text-muted-foreground">
                {accumulatedText || 'Start speaking...'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DictationMode;