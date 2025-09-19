import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Volume2 } from 'lucide-react';
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
  const { user } = useAuth();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await processVoiceInput(audioBlob);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
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
    
    try {
      // Convert speech to text
      const formData = new FormData();
      formData.append('audio', audioBlob);

      const { data: transcriptionData, error: transcriptionError } = await supabase.functions.invoke('speech-to-text', {
        body: formData,
      });

      if (transcriptionError) {
        throw new Error(transcriptionError.message);
      }

      const userText = transcriptionData.text;
      
      // Save user message
      const userMessageId = uuidv4();
      const { error: userMessageError } = await supabase
        .from('messages')
        .insert({
          id: userMessageId,
          chat_id: chatId,
          content: userText,
          role: 'user',
          user_id: user?.id
        });

      if (userMessageError) {
        console.error('Database error saving user message:', userMessageError);
        throw new Error(`Failed to save user message: ${userMessageError.message}`);
      }

      onMessageSent(userMessageId, userText, 'user');

      // Get AI response with special instruction to not generate images
      const aiPrompt = userText.toLowerCase().includes('generate') && userText.toLowerCase().includes('image') 
        ? `Please respond with text only. The user said: "${userText}". Do not generate any images, just provide a helpful text response.`
        : userText;

      const { data: aiResponse, error: aiError } = await supabase.functions.invoke('chat-with-ai-optimized', {
        body: {
          message: aiPrompt,
          chat_id: chatId,
          user_id: user?.id,
          has_file_analysis: false,
          image_count: 0
        }
      });

      if (aiError) {
        throw new Error(aiError.message);
      }

      const aiText = aiResponse.response;

      // Save AI message
      const aiMessageId = uuidv4();
      const { error: aiMessageError } = await supabase
        .from('messages')
        .insert({
          id: aiMessageId,
          chat_id: chatId,
          content: aiText,
          role: 'assistant',
          user_id: user?.id
        });

      if (aiMessageError) {
        console.error('Database error saving AI message:', aiMessageError);
        throw new Error(`Failed to save AI message: ${aiMessageError.message}`);
      }

      onMessageSent(aiMessageId, aiText, 'assistant');

      // Convert AI response to speech
      const { data: speechData, error: speechError } = await supabase.functions.invoke('text-to-speech-voice-mode', {
        body: {
          text: aiText,
          voice: 'alloy'
        }
      });

      if (speechError) {
        throw new Error(speechError.message);
      }

      // Play the audio
      await playAudio(speechData.audioContent);

    } catch (error) {
      console.error('Error processing voice input:', error);
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
    if (isPlaying) return <Volume2 className="h-5 w-5" />;
    if (isProcessing) return <div className="animate-spin h-5 w-5 border-2 border-current rounded-full border-t-transparent" />;
    if (isRecording) return <MicOff className="h-5 w-5 animate-pulse" />;
    return <Mic className="h-5 w-5" />;
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
      className={`h-10 w-10 rounded-full flex-shrink-0 transition-all duration-200 ${
        isRecording ? 'scale-110 shadow-lg shadow-destructive/25' : 'hover:scale-105'
      } ${isProcessing || isPlaying ? 'animate-pulse' : ''}`}
    >
      {getButtonIcon()}
    </Button>
  );
};

export default VoiceModeButton;