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
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { user } = useAuth();

  const detectSilence = useCallback(() => {
    if (!analyserRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculate average volume
    const average = dataArray.reduce((a, b) => a + b) / bufferLength;
    const silenceThreshold = 10; // Adjust this value as needed

    if (average < silenceThreshold) {
      // If silence detected, start/reset the timeout
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
      
      silenceTimeoutRef.current = setTimeout(() => {
        if (isRecording) {
          stopRecording();
        }
      }, 2000); // 2 seconds of silence
    } else {
      // If sound detected, clear the timeout
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
    }

    // Continue monitoring if still recording
    if (isRecording) {
      requestAnimationFrame(detectSilence);
    }
  }, [isRecording]);

  const startRecording = async () => {
    try {
      console.log('🎤 Starting voice recording...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      console.log('✅ Microphone access granted');
      
      // Set up audio analysis for silence detection
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
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
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        console.log('📦 Created audio blob:', audioBlob.size, 'bytes');
        
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
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }
      };

      mediaRecorder.start(1000); // Record in 1-second chunks
      setIsRecording(true);
      console.log('🔴 Recording started');
      
      // Start silence detection
      detectSilence();
    } catch (error) {
      console.error('❌ Error starting recording:', error);
      alert(`Microphone access error: ${error.message}`);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processVoiceInput = async (audioBlob: Blob) => {
    setIsProcessing(true);
    console.log('🎤 Processing voice input - blob size:', audioBlob.size);
    
    try {
      // Convert speech to text
      const formData = new FormData();
      formData.append('audio', audioBlob);
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
      
      // Save user message (removed user_id field)
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

      // Get AI response with special instruction to not generate images
      const aiPrompt = userText.toLowerCase().includes('generate') && userText.toLowerCase().includes('image') 
        ? `Please respond with text only. The user said: "${userText}". Do not generate any images, just provide a helpful text response.`
        : userText;

      console.log('🤖 Getting AI response...');
      const { data: aiResponse, error: aiError } = await supabase.functions.invoke('chat-with-ai-optimized', {
        body: {
          message: aiPrompt,
          chat_id: chatId,
          user_id: user?.id,
          has_file_analysis: false,
          image_count: 0
        }
      });

      console.log('🤖 AI response:', { aiResponse, aiError });

      if (aiError) {
        console.error('❌ AI error:', aiError);
        throw new Error(aiError.message);
      }

      const aiText = aiResponse?.response;
      console.log('✅ AI said:', aiText);

      if (!aiText) {
        console.error('❌ No AI response received');
        throw new Error('No AI response received');
      }

      // Save AI message (removed user_id field)
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

      // Convert AI response to speech
      console.log('🗣️ Converting AI response to speech...');
      const { data: speechData, error: speechError } = await supabase.functions.invoke('text-to-speech-voice-mode', {
        body: {
          text: aiText,
          voice: 'alloy'
        }
      });

      console.log('🗣️ Speech response:', { speechData, speechError });

      if (speechError) {
        console.error('❌ Speech error:', speechError);
        throw new Error(speechError.message);
      }

      // Play the audio
      console.log('🔊 Playing audio response...');
      await playAudio(speechData.audioContent);
      console.log('✅ Audio playback completed');

    } catch (error) {
      console.error('💥 Error processing voice input:', error);
      // Show user-friendly error message
      alert(`Voice processing error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const playAudio = async (base64Audio: string) => {
    try {
      setIsPlaying(true);
      
      // Convert base64 to blob
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const audioBlob = new Blob([bytes], { type: 'audio/mp3' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      await audio.play();
      
    } catch (error) {
      console.error('Error playing audio:', error);
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