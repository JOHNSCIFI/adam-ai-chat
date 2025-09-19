import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface VoiceModeButtonProps {
  onVoiceMessage: (message: string) => void;
  onAIResponse: (response: string) => void;
  disabled?: boolean;
  actualTheme: string;
  project?: { id: string; title: string };
  user?: { id: string };
}

export const VoiceModeButton: React.FC<VoiceModeButtonProps> = ({
  onVoiceMessage,
  onAIResponse,
  disabled,
  actualTheme,
  project,
  user
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      audioChunksRef.current = [];
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
    }
  }, [isRecording]);

  const processAudio = async (audioBlob: Blob) => {
    try {
      // Convert blob to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(
        String.fromCharCode(...new Uint8Array(arrayBuffer))
      );

      // Send to speech-to-text service
      const { data, error } = await supabase.functions.invoke('speech-to-text-voice-mode', {
        body: { audio: base64Audio }
      });

      if (error) {
        console.error('Speech-to-text error:', error);
        return;
      }

      const transcribedText = data.text;
      console.log('Transcribed text:', transcribedText);
      
      if (transcribedText.trim()) {
        // Ensure we have a chat to work with
        await ensureCurrentChat();
        
        // Send the user message
        if (currentChatId) {
          await saveUserMessage(transcribedText);
        }
        
        // Get AI response
        await getAIResponse(transcribedText);
      }
    } catch (error) {
      console.error('Error processing audio:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const ensureCurrentChat = async () => {
    if (currentChatId || !user || !project) return;

    try {
      // Create a new chat for this voice session
      const { data: newChat, error } = await supabase
        .from('chats')
        .insert({
          user_id: user.id,
          title: 'Voice Chat',
          project_id: project.id
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating voice chat:', error);
        return;
      }

      setCurrentChatId(newChat.id);
    } catch (error) {
      console.error('Error ensuring current chat:', error);
    }
  };

  const saveUserMessage = async (message: string) => {
    if (!currentChatId) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          chat_id: currentChatId,
          content: message,
          role: 'user',
          file_attachments: []
        });

      if (error) {
        console.error('Error saving user message:', error);
      }
    } catch (error) {
      console.error('Error in saveUserMessage:', error);
    }
  };

  const getAIResponse = async (userMessage: string) => {
    try {
      // Modify the message to prevent image generation in voice mode
      const modifiedMessage = userMessage.toLowerCase().includes('generate image') || 
                              userMessage.toLowerCase().includes('create image') ||
                              userMessage.toLowerCase().includes('make image')
        ? `Please respond in text only without generating images: ${userMessage}`
        : userMessage;

      const { data, error } = await supabase.functions.invoke('chat-with-ai-optimized', {
        body: { 
          message: modifiedMessage,
          conversationHistory: []
        }
      });

      if (error) {
        console.error('AI response error:', error);
        return;
      }

      const aiResponse = data.response;
      console.log('AI response:', aiResponse);
      
      // Save AI response to database
      if (currentChatId) {
        await saveAIMessage(aiResponse);
      }
      
      // Convert AI response to speech
      await convertToSpeech(aiResponse);
    } catch (error) {
      console.error('Error getting AI response:', error);
    }
  };

  const saveAIMessage = async (message: string) => {
    if (!currentChatId) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          chat_id: currentChatId,
          content: message,
          role: 'assistant',
          file_attachments: []
        });

      if (error) {
        console.error('Error saving AI message:', error);
      }
    } catch (error) {
      console.error('Error in saveAIMessage:', error);
    }
  };

  const convertToSpeech = async (text: string) => {
    try {
      setIsSpeaking(true);
      
      const { data, error } = await supabase.functions.invoke('text-to-speech-voice-mode', {
        body: { 
          text: text,
          voice: 'alloy'
        }
      });

      if (error) {
        console.error('Text-to-speech error:', error);
        return;
      }

      // Convert base64 to audio and play
      const audioBase64 = data.audioContent;
      const audioBlob = new Blob([
        Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0))
      ], { type: 'audio/mpeg' });
      
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;
      
      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        currentAudioRef.current = null;
      };
      
      audio.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        currentAudioRef.current = null;
      };
      
      await audio.play();
    } catch (error) {
      console.error('Error converting to speech:', error);
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      setIsSpeaking(false);
    }
  }, []);

  const handleClick = useCallback(() => {
    if (isSpeaking) {
      stopSpeaking();
    } else if (isRecording) {
      stopRecording();
    } else if (!isProcessing) {
      startRecording();
    }
  }, [isRecording, isProcessing, isSpeaking, startRecording, stopRecording, stopSpeaking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
      }
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [isRecording]);

  const getButtonIcon = () => {
    if (isSpeaking) return <VolumeX className="h-4 w-4" />;
    if (isRecording) return <MicOff className="h-4 w-4" />;
    if (isProcessing) return <Volume2 className="h-4 w-4 animate-pulse" />;
    return <Mic className="h-4 w-4" />;
  };

  const getButtonColor = () => {
    if (isSpeaking) return 'hsl(var(--primary))';
    if (isRecording) return '#ef4444'; // red-500
    if (isProcessing) return 'hsl(var(--primary))';
    return actualTheme === 'light' ? 'hsl(var(--primary))' : 'hsl(var(--primary))';
  };

  return (
    <Button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      size="sm"
      className="h-8 w-8 p-0 rounded-full flex-shrink-0 transition-colors"
      style={{ 
        backgroundColor: getButtonColor(),
        color: 'white'
      }}
      title={
        isSpeaking ? 'Stop speaking' :
        isRecording ? 'Stop recording' :
        isProcessing ? 'Processing...' :
        'Start voice mode'
      }
    >
      {getButtonIcon()}
    </Button>
  );
};