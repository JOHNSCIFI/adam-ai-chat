import React, { useState, useRef } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
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
  const [voiceMode, setVoiceMode] = useState<'inactive' | 'active' | 'processing'>('inactive');
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const toggleVoiceMode = async () => {
    if (voiceMode === 'inactive') {
      setVoiceMode('active');
    } else {
      setVoiceMode('inactive');
      if (isRecording) {
        stopRecording();
      }
    }
  };

  const startRecording = async () => {
    if (isProcessing || isPlaying) {
      console.log('🚫 Cannot record - AI is processing or speaking');
      return;
    }

    try {
      console.log('🎤 Starting voice recording...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      recorder.onstop = async () => {
        console.log('🎤 Recording stopped, processing audio...');
        const blob = new Blob(chunks, { type: 'audio/webm' });
        await processVoiceToAI(blob);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      console.log('🔴 Recording started');
    } catch (error) {
      console.error('❌ Recording failed:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      console.log('🛑 Stopping recording...');
      mediaRecorder.stop();
      setMediaRecorder(null);
      setIsRecording(false);
    }
  };

  const processVoiceToAI = async (audioBlob: Blob) => {
    if (isProcessing) {
      console.log('🚫 Already processing, skipping...');
      return;
    }

    setIsProcessing(true);
    
    try {
      console.log('📡 Converting speech to text...', {
        size: audioBlob.size,
        type: audioBlob.type
      });

      // Step 1: Convert speech to text
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const speechResponse = await supabase.functions.invoke('speech-to-text', {
        body: formData,
      });

      if (speechResponse.error) {
        throw new Error(speechResponse.error.message);
      }

      if (!speechResponse.data?.text?.trim()) {
        console.log('🚫 No text transcribed from audio');
        return;
      }

      const transcribedText = speechResponse.data.text.trim();
      console.log('📝 Transcribed text:', transcribedText);

      // Step 2: Save user message to database
      const userMessageId = uuidv4();
      console.log('💾 Saving user message to database...');
      
      const { error: saveError } = await supabase
        .from('messages')
        .insert({
          id: userMessageId,
          chat_id: chatId,
          content: transcribedText,
          role: 'user'
        });

      if (saveError) {
        throw new Error('Failed to save user message: ' + saveError.message);
      }

      console.log('✅ User message saved');
      onMessageSent(userMessageId, transcribedText, 'user');

      // Step 3: Get AI response 
      console.log('🤖 Getting AI response...');
      const aiResponse = await supabase.functions.invoke('chat-with-ai-optimized', {
        body: {
          message: transcribedText,
          chatId: chatId,
          userId: chatId // Use chatId as userId for now
        }
      });

      if (aiResponse.error) {
        throw new Error('AI response error: ' + aiResponse.error.message);
      }

      const aiContent = aiResponse.data?.aiResponse?.content;
      if (!aiContent) {
        throw new Error('No AI response content received');
      }

      console.log('✅ AI response received:', aiContent);

      // Step 4: Save AI message to database
      const aiMessageId = uuidv4();
      console.log('💾 Saving AI message to database...');
      
      const { error: aiSaveError } = await supabase
        .from('messages')
        .insert({
          id: aiMessageId,
          chat_id: chatId,
          content: aiContent,
          role: 'assistant'
        });

      if (aiSaveError) {
        throw new Error('Failed to save AI message: ' + aiSaveError.message);
      }

      console.log('✅ AI message saved');
      onMessageSent(aiMessageId, aiContent, 'assistant');

      // Step 5: Convert AI response to speech and play it
      if (voiceMode === 'active') {
        console.log('🔊 Converting AI response to speech...');
        await convertAndPlayAIResponse(aiContent);
      }

    } catch (error: any) {
      console.error('❌ Error in processVoiceToAI:', error);
    } finally {
      setIsProcessing(false);
      
      // Auto-restart recording if voice mode is still active
      if (voiceMode === 'active' && !isRecording) {
        setTimeout(() => {
          startRecording();
        }, 500);
      }
    }
  };

  const convertAndPlayAIResponse = async (text: string) => {
    try {
      setIsPlaying(true);
      console.log('🎵 Converting text to speech...');
      
      const ttsResponse = await supabase.functions.invoke('text-to-speech-voice-mode', {
        body: {
          text: text,
          voice: 'alloy'
        }
      });

      if (ttsResponse.error) {
        throw new Error('TTS error: ' + ttsResponse.error.message);
      }

      if (ttsResponse.data?.audioContent) {
        console.log('🎵 Playing AI speech response...');
        await playAudioFromBase64(ttsResponse.data.audioContent);
      }
    } catch (error: any) {
      console.error('❌ Error in TTS:', error);
    } finally {
      setIsPlaying(false);
    }
  };

  const playAudioFromBase64 = async (base64Audio: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        const binaryString = atob(base64Audio);
        const bytes = new Uint8Array(binaryString.length);
        
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        const audioBlob = new Blob([bytes], { type: 'audio/mp3' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          console.log('🎵 Audio playback finished');
          resolve();
        };
        
        audio.onerror = (error) => {
          URL.revokeObjectURL(audioUrl);
          console.error('❌ Audio playback error:', error);
          reject(error);
        };
        
        audio.play().catch(reject);
      } catch (error) {
        console.error('❌ Error creating audio from base64:', error);
        reject(error);
      }
    });
  };

  // Auto-start recording when voice mode becomes active
  React.useEffect(() => {
    if (voiceMode === 'active' && !isRecording && !isProcessing && !isPlaying) {
      startRecording();
    }
  }, [voiceMode, isRecording, isProcessing, isPlaying]);

  const getButtonColor = () => {
    if (voiceMode === 'active') {
      if (isProcessing) return 'text-yellow-500';
      if (isPlaying) return 'text-blue-500';
      if (isRecording) return 'text-red-500';
      return 'text-green-500';
    }
    return 'text-muted-foreground';
  };

  const getButtonIcon = () => {
    if (isPlaying) return <Volume2 className="h-4 w-4" />;
    if (isRecording) return <MicOff className="h-4 w-4" />;
    return <Mic className="h-4 w-4" />;
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={`h-8 w-8 p-0 hover:bg-muted/20 rounded-full flex-shrink-0 ${getButtonColor()}`}
      onClick={voiceMode === 'active' && isRecording ? stopRecording : 
               voiceMode === 'active' ? startRecording : toggleVoiceMode}
      disabled={isProcessing}
      data-voice-mode-active={voiceMode === 'active'}
    >
      {getButtonIcon()}
    </Button>
  );
};

export default VoiceModeButton;