import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Radio, Square, Volume2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { v4 as uuidv4 } from 'uuid';

interface VoiceModeButtonProps {
  onMessageSent: (messageId: string, content: string, role: 'user' | 'assistant') => void;
  chatId: string;
  actualTheme: string;
}

const VoiceModeButton: React.FC<VoiceModeButtonProps> = ({ 
  onMessageSent, 
  chatId, 
  actualTheme 
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const { user } = useAuth();

  // Voice Activity Detection
  const checkAudioLevel = useCallback(() => {
    if (!analyserRef.current) return;
    
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    // Calculate RMS (Root Mean Square) for volume level
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i] * dataArray[i];
    }
    const rms = Math.sqrt(sum / bufferLength);
    const volume = rms / 255; // Normalize to 0-1
    
    const threshold = 0.01; // Silence threshold
    
    if (volume > threshold) {
      // Voice detected - clear silence timer
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    } else {
      // Silence detected - start/continue timer
      if (!silenceTimerRef.current && isRecording) {
        silenceTimerRef.current = setTimeout(() => {
          console.log('🔇 2 seconds of silence detected - auto-stopping recording');
          stopRecording();
        }, 2000); // 2 seconds of silence
      }
    }
    
    // Continue checking if still recording
    if (isRecording) {
      requestAnimationFrame(checkAudioLevel);
    }
  }, [isRecording]);

  const startRecording = async () => {
    try {
      console.log('🎤 Starting voice recording...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      console.log('✅ Microphone access granted');
      
      // Set up audio context for voice activity detection
      audioContextRef.current = new AudioContext({ sampleRate: 44100 });
      analyserRef.current = audioContextRef.current.createAnalyser();
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      
      analyserRef.current.fftSize = 2048;
      analyserRef.current.smoothingTimeConstant = 0.3;
      sourceRef.current.connect(analyserRef.current);
      
      // Try different formats for better compatibility
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/wav')) {
        mimeType = 'audio/wav';
      } else if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      }
      
      console.log('🎵 Using audio format:', mimeType);

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        console.log('📊 Audio data chunk received:', event.data.size, 'bytes');
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('⏹️ Recording stopped, processing audio...');
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        console.log('📦 Created audio blob:', audioBlob.size, 'bytes', 'type:', audioBlob.type);
        
        if (audioBlob.size > 0) {
          await processVoiceInput(audioBlob);
        } else {
          console.warn('⚠️ Audio blob is empty, skipping processing');
        }
        
        // Clean up
        stream.getTracks().forEach(track => track.stop());
        if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
      };

      mediaRecorder.start(1000); // Record in 1-second chunks
      setIsRecording(true);
      console.log('🔴 Recording started with format:', mimeType);
      
      // Start voice activity detection
      checkAudioLevel();
      
    } catch (error) {
      console.error('❌ Error starting recording:', error);
      alert(`Microphone access error: ${error.message}`);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      console.log('🛑 Stopping recording...');
      
      // Clear silence timer
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const processVoiceInput = async (audioBlob: Blob) => {
    setIsProcessing(true);
    console.log('🎤 Processing voice input - blob size:', audioBlob.size, 'type:', audioBlob.type);
    
    try {
      // Convert speech to text
      const formData = new FormData();
      formData.append('audio', audioBlob, `audio.${audioBlob.type.split('/')[1].split(';')[0]}`);
      console.log('🔊 Sending audio to speech-to-text function...');

      const { data: transcriptionData, error: transcriptionError } = await supabase.functions.invoke('speech-to-text', {
        body: formData,
      });

      console.log('📝 Transcription response:', { transcriptionData, transcriptionError });

      if (transcriptionError) {
        console.error('❌ Transcription error:', transcriptionError);
        throw new Error(transcriptionError.message);
      }

      const userText = transcriptionData?.text;
      console.log('✅ User said:', userText);
      
      if (!userText || userText.trim() === '') {
        console.warn('⚠️ Empty transcription received');
        return;
      }
      
      // Save user message
      const userMessageId = uuidv4();
      console.log('💾 Saving user message to database...');
      const { error: userMessageError } = await supabase
        .from('messages')
        .insert({
          id: userMessageId,
          chat_id: chatId,
          content: userText,
          role: 'user'
        });

      if (userMessageError) {
        console.error('❌ Database error saving user message:', userMessageError);
        throw new Error(`Failed to save user message: ${userMessageError.message}`);
      }

      console.log('✅ User message saved successfully');
      onMessageSent(userMessageId, userText, 'user');

      // Get AI response with comprehensive error handling
      console.log('🤖 Getting AI response...');
      const { data: aiResponse, error: aiError } = await supabase.functions.invoke('chat-with-ai-optimized', {
        body: {
          message: userText,
          chat_id: chatId,
          user_id: user?.id,
          has_file_analysis: false,
          image_count: 0
        }
      });

      console.log('🤖 Raw AI response data:', aiResponse);
      console.log('🤖 AI error object:', aiError);
      
      // Check for function invocation errors first
      if (aiError) {
        console.error('❌ Supabase function invocation error:', aiError);
        throw new Error(`Function invocation failed: ${aiError.message || JSON.stringify(aiError)}`);
      }

      // Check if we got a response at all
      if (!aiResponse) {
        console.error('❌ No response data from function');
        throw new Error('No response data received from AI function');
      }

      // Log the structure of the response to debug
      console.log('🔍 Response structure:', {
        type: typeof aiResponse,
        keys: Object.keys(aiResponse || {}),
        content: aiResponse?.content,
        hasContent: !!aiResponse?.content
      });

      const aiText = aiResponse?.content;
      console.log('✅ Extracted AI text:', aiText);

      if (!aiText || aiText.trim() === '') {
        console.error('❌ Empty or missing AI response content:', { 
          aiResponse, 
          contentExists: 'content' in (aiResponse || {}),
          contentValue: aiResponse?.content 
        });
        throw new Error(`No valid AI response content received. Response: ${JSON.stringify(aiResponse)}`);
      }

      // Save AI message
      const aiMessageId = uuidv4();
      console.log('💾 Saving AI message to database...');
      const { error: aiMessageError } = await supabase
        .from('messages')
        .insert({
          id: aiMessageId,
          chat_id: chatId,
          content: aiText,
          role: 'assistant'
        });

      if (aiMessageError) {
        console.error('❌ Database error saving AI message:', aiMessageError);
        throw new Error(`Failed to save AI message: ${aiMessageError.message}`);
      }

      console.log('✅ AI message saved successfully');
      onMessageSent(aiMessageId, aiText, 'assistant');

      // Convert AI response to speech with better error handling
      console.log('🗣️ Converting AI response to speech...');
      const { data: speechData, error: speechError } = await supabase.functions.invoke('text-to-speech-voice-mode', {
        body: {
          text: aiText,
          voice: 'alloy'
        }
      });

      console.log('🗣️ Speech response:', { speechData, speechError });

      if (speechError) {
        console.error('❌ Speech error details:', speechError);
        console.error('❌ Speech error message:', speechError.message);
        throw new Error(`Text-to-speech failed: ${speechError.message}`);
      }

      if (!speechData || !speechData.audioContent) {
        console.error('❌ No audio content received from TTS');
        throw new Error('No audio content received from text-to-speech service');
      }

      // Play the audio
      console.log('🔊 Playing audio response...');
      await playAudio(speechData.audioContent);
      console.log('✅ Audio playback completed');

    } catch (error) {
      console.error('💥 Error processing voice input:', error);
      alert(`Voice processing error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const playAudio = async (base64Audio: string) => {
    try {
      setIsPlaying(true);
      console.log('🔊 Converting base64 to audio blob...');
      
      // Convert base64 to blob
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const audioBlob = new Blob([bytes], { type: 'audio/mp3' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      console.log('🎵 Creating audio element and playing...');
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        console.log('🔇 Audio playback ended');
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = (error) => {
        console.error('❌ Audio playback error:', error);
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      await audio.play();
      console.log('▶️ Audio playback started');
      
    } catch (error) {
      console.error('💥 Error playing audio:', error);
      setIsPlaying(false);
    }
  };

  const getButtonIcon = () => {
    if (isPlaying) return <Volume2 className="h-6 w-6" />;
    if (isProcessing) return <div className="animate-spin h-6 w-6 border-2 border-current rounded-full border-t-transparent" />;
    if (isRecording) return <Square className="h-6 w-6 animate-pulse" />;
    return <Radio className="h-6 w-6" />;
  };

  const getButtonVariant = () => {
    if (isRecording) return 'destructive';
    if (isProcessing || isPlaying) return 'secondary';
    return 'default';
  };

  const handleClick = () => {
    if (isProcessing || isPlaying) return;
    
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <Button
      type="button"
      onClick={handleClick}
      disabled={isProcessing || isPlaying}
      variant={getButtonVariant()}
      size="icon"
      className={`h-12 w-12 rounded-full flex-shrink-0 transition-all duration-300 ${
        isRecording ? 'scale-110 shadow-lg shadow-destructive/25 animate-pulse' : 'hover:scale-105'
      } ${isProcessing || isPlaying ? 'animate-pulse' : ''}`}
    >
      {getButtonIcon()}
    </Button>
  );
};

export default VoiceModeButton;