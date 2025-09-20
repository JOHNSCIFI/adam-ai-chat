import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

interface VoiceModeButtonProps {
  onMessageSent: (messageId: string, content: string, role: 'user' | 'assistant') => void;
  chatId: string;
  actualTheme?: string;
}

const VoiceModeButton: React.FC<VoiceModeButtonProps> = ({ onMessageSent, chatId, actualTheme }) => {
  // State management
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVoiceModeActive, setIsVoiceModeActive] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Refs for audio processing
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Processing refs
  const isProcessingRef = useRef<boolean>(false);
  const isPlayingRef = useRef<boolean>(false);
  const isVoiceModeActiveRef = useRef<boolean>(false);
  const isRequestInProgressRef = useRef<boolean>(false);
  const audioAnalysisActiveRef = useRef<boolean>(false);
  const selectedAudioFormatRef = useRef<string>('');

  // Voice activity detection refs
  const silenceStartTimeRef = useRef<number>(0);
  const speechDetectedRef = useRef<boolean>(false);
  const speechCountRef = useRef<number>(0);

  const { user } = useAuth();

  // Cleanup function
  const cleanupAudioResources = useCallback(() => {
    console.log('🧹 Cleaning up audio resources...');
    
    audioAnalysisActiveRef.current = false;
    isVoiceModeActiveRef.current = false;
    isProcessingRef.current = false;
    isPlayingRef.current = false;
    isRequestInProgressRef.current = false;
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    if (sourceRef.current) {
      sourceRef.current.disconnect();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
  }, []);

  // Enhanced audio conversion with better error handling
  const convertToWAV = async (audioBlob: Blob): Promise<Blob> => {
    console.log('🔄 Converting audio to WAV...', {
      inputSize: audioBlob.size,
      inputType: audioBlob.type
    });
    
    // Skip if already WAV
    if (audioBlob.type.includes('wav')) {
      console.log('✅ Already WAV format');
      return audioBlob;
    }
    
    try {
      // Use a dedicated conversion AudioContext with optimal settings
      const conversionContext = new AudioContext({
        sampleRate: 24000 // OpenAI-compatible sample rate
      });
      
      const arrayBuffer = await audioBlob.arrayBuffer();
      console.log('📁 Audio buffer size:', arrayBuffer.byteLength);
      
      try {
        // Decode audio data
        const audioBuffer = await conversionContext.decodeAudioData(arrayBuffer);
        console.log('🎵 Audio decoded:', {
          duration: audioBuffer.duration.toFixed(2),
          sampleRate: audioBuffer.sampleRate,
          channels: audioBuffer.numberOfChannels
        });
        
        // Extract and resample to 24kHz mono
        const channelData = audioBuffer.getChannelData(0);
        const targetSampleRate = 24000;
        const resampledData = resampleAudio(channelData, audioBuffer.sampleRate, targetSampleRate);
        
        // Create WAV file
        const wavBuffer = createWAVFile(resampledData, targetSampleRate);
        const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' });
        
        await conversionContext.close();
        
        console.log('✅ Conversion successful:', {
          originalSize: audioBlob.size,
          convertedSize: wavBlob.size,
          sampleRate: targetSampleRate
        });
        
        return wavBlob;
        
      } catch (decodeError) {
        console.error('❌ Audio decode failed:', decodeError.message);
        await conversionContext.close();
        
        // Return original if decode fails
        console.warn('⚠️ Using original audio format');
        return audioBlob;
      }
      
    } catch (error) {
      console.error('❌ Conversion setup failed:', error.message);
      return audioBlob;
    }
  };

  // Audio resampling function
  const resampleAudio = (inputData: Float32Array, inputSampleRate: number, outputSampleRate: number): Float32Array => {
    if (inputSampleRate === outputSampleRate) {
      return inputData;
    }
    
    const ratio = inputSampleRate / outputSampleRate;
    const outputLength = Math.round(inputData.length / ratio);
    const outputData = new Float32Array(outputLength);
    
    for (let i = 0; i < outputLength; i++) {
      const inputIndex = i * ratio;
      const leftIndex = Math.floor(inputIndex);
      const rightIndex = Math.min(Math.ceil(inputIndex), inputData.length - 1);
      const fraction = inputIndex - leftIndex;
      
      outputData[i] = inputData[leftIndex] * (1 - fraction) + inputData[rightIndex] * fraction;
    }
    
    return outputData;
  };

  // Create WAV file from audio data
  const createWAVFile = (audioData: Float32Array, sampleRate: number): ArrayBuffer => {
    const length = audioData.length;
    const buffer = new ArrayBuffer(44 + length * 2);
    const view = new DataView(buffer);
    
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    // WAV header
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, 1, true); // Mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * 2, true);
    
    // Convert float to 16-bit PCM
    let offset = 44;
    for (let i = 0; i < length; i++) {
      const sample = Math.max(-1, Math.min(1, audioData[i]));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
    
    return buffer;
  };

  // Enhanced voice activity detection
  const checkAudioLevel = useCallback(() => {
    if (!analyserRef.current || !isVoiceModeActiveRef.current || audioAnalysisActiveRef.current) {
      return;
    }
    
    if (isProcessingRef.current || isPlayingRef.current || isRequestInProgressRef.current) {
      setTimeout(() => checkAudioLevel(), 100);
      return;
    }
    
    audioAnalysisActiveRef.current = true;
    
    try {
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserRef.current.getByteFrequencyData(dataArray);
      
      // Calculate RMS and detect speech-like frequencies
      let sum = 0;
      let speechFreqSum = 0;
      const speechFreqStart = Math.floor((300 / 24000) * bufferLength); // 300Hz
      const speechFreqEnd = Math.floor((3400 / 24000) * bufferLength);   // 3400Hz
      
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i] * dataArray[i];
        if (i >= speechFreqStart && i <= speechFreqEnd) {
          speechFreqSum += dataArray[i];
        }
      }
      
      const rms = Math.sqrt(sum / bufferLength);
      const speechLevel = speechFreqSum / (speechFreqEnd - speechFreqStart + 1);
      const currentTime = Date.now();
      
      // Enhanced speech detection
      const isSpeechDetected = rms > 15 && speechLevel > 20;
      
      if (isSpeechDetected) {
        if (!speechDetectedRef.current) {
          console.log('🎤 Speech detected, starting recording...');
          speechDetectedRef.current = true;
          setIsListening(true);
          
          // Start MediaRecorder if not already recording
          if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'recording') {
            audioChunksRef.current = [];
            mediaRecorderRef.current.start();
          }
        }
        silenceStartTimeRef.current = currentTime;
      } else if (speechDetectedRef.current) {
        // Check for end of speech
        if (currentTime - silenceStartTimeRef.current > 1500) { // 1.5s silence
          console.log('🔇 Speech ended, processing audio...');
          speechDetectedRef.current = false;
          setIsListening(false);
          
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
          }
        }
      }
      
      // Continue checking
      if (isVoiceModeActiveRef.current && !isProcessingRef.current && !isPlayingRef.current) {
        audioAnalysisActiveRef.current = false;
        setTimeout(() => checkAudioLevel(), 100);
      } else {
        audioAnalysisActiveRef.current = false;
      }
      
    } catch (error) {
      console.error('❌ Audio level check error:', error);
      audioAnalysisActiveRef.current = false;
      if (isVoiceModeActiveRef.current) {
        setTimeout(() => checkAudioLevel(), 200);
      }
    }
  }, []);

  // Process recorded audio
  const processAudio = useCallback(async (audioBlob: Blob) => {
    if (audioBlob.size < 1000) {
      console.warn('⚠️ Audio too small, skipping');
      return;
    }
    
    setIsProcessing(true);
    isProcessingRef.current = true;
    isRequestInProgressRef.current = true;
    
    try {
      console.log('🎤 Processing audio...', {
        size: audioBlob.size,
        type: audioBlob.type
      });
      
      // Convert to WAV
      const wavBlob = await convertToWAV(audioBlob);
      
      // Send to speech-to-text
      const formData = new FormData();
      formData.append('audio', wavBlob, 'audio.wav');
      
      console.log('📡 Sending to speech-to-text...');
      const { data: transcriptionData, error: transcriptionError } = await supabase.functions.invoke('speech-to-text', {
        body: formData,
      });
      
      if (transcriptionError) {
        throw new Error(`Transcription failed: ${transcriptionError.message}`);
      }
      
      const transcriptionText = transcriptionData?.text?.trim();
      console.log('📝 Transcription:', transcriptionText);
      
      if (!transcriptionText) {
        console.log('⚠️ Empty transcription, resuming...');
        setIsProcessing(false);
        isProcessingRef.current = false;
        isRequestInProgressRef.current = false;
        
        setTimeout(() => {
          if (isVoiceModeActiveRef.current) {
            checkAudioLevel();
          }
        }, 500);
        return;
      }
      
      // Save user message
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          content: transcriptionText,
          role: 'user',
          user_id: user?.id,
        })
        .select()
        .single();
      
      if (messageError) {
        throw new Error(`Failed to save message: ${messageError.message}`);
      }
      
      console.log('✅ User message saved');
      onMessageSent(messageData.id, transcriptionText, 'user');
      
      // Get AI response
      console.log('🤖 Getting AI response...');
      const { data: aiResponse, error: aiError } = await supabase.functions.invoke('chat-with-ai-optimized', {
        body: {
          message: transcriptionText,
          chat_id: chatId,
          user_id: user?.id,
        },
      });
      
      if (aiError) {
        throw new Error(`AI response failed: ${aiError.message}`);
      }
      
      const aiMessage = aiResponse.content;
      console.log('🤖 AI response received');
      
      // Save AI message
      const { data: aiMessageData, error: aiMessageError } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          content: aiMessage,
          role: 'assistant',
          user_id: user?.id,
        })
        .select()
        .single();
      
      if (aiMessageError) {
        throw new Error(`Failed to save AI message: ${aiMessageError.message}`);
      }
      
      console.log('✅ AI message saved');
      onMessageSent(aiMessageData.id, aiMessage, 'assistant');
      
      // Convert to speech
      console.log('🎵 Converting to speech...');
      const { data: speechData, error: speechError } = await supabase.functions.invoke('text-to-speech-voice-mode', {
        body: {
          text: aiMessage,
          voice: 'alloy',
        },
      });
      
      if (speechError) {
        throw new Error(`TTS failed: ${speechError.message}`);
      }
      
      // Play audio
      await playAudio(speechData.audioContent);
      
    } catch (error) {
      console.error('💥 Voice processing error:', error);
      alert(`Voice processing error: ${error.message}`);
    } finally {
      setIsProcessing(false);
      isProcessingRef.current = false;
      isRequestInProgressRef.current = false;
      
      // Resume listening after a short delay
      setTimeout(() => {
        if (isVoiceModeActiveRef.current && !isPlayingRef.current) {
          console.log('🔄 Resuming voice detection...');
          checkAudioLevel();
        }
      }, 1000);
    }
  }, [chatId, user?.id, onMessageSent, checkAudioLevel]);

  // Play audio response
  const playAudio = async (base64Audio: string) => {
    try {
      setIsPlaying(true);
      isPlayingRef.current = true;
      
      console.log('🔊 Playing AI response...');
      
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const audioBlob = new Blob([bytes], { type: 'audio/mp3' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        console.log('✅ Audio playback finished');
        setIsPlaying(false);
        isPlayingRef.current = false;
        URL.revokeObjectURL(audioUrl);
        
        // Resume voice detection
        if (isVoiceModeActiveRef.current) {
          console.log('🎤 Resuming voice detection after playback');
          setTimeout(() => checkAudioLevel(), 500);
        }
      };
      
      audio.onerror = (error) => {
        console.error('❌ Audio playback error:', error);
        setIsPlaying(false);
        isPlayingRef.current = false;
        URL.revokeObjectURL(audioUrl);
        
        if (isVoiceModeActiveRef.current) {
          setTimeout(() => checkAudioLevel(), 500);
        }
      };
      
      await audio.play();
      console.log('▶️ Audio playback started');
      
    } catch (error) {
      console.error('❌ Audio play error:', error);
      setIsPlaying(false);
      isPlayingRef.current = false;
      
      if (isVoiceModeActiveRef.current) {
        setTimeout(() => checkAudioLevel(), 500);
      }
    }
  };

  // Start voice mode
  const startVoiceMode = async () => {
    try {
      console.log('🎤 Starting voice mode...');
      
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
      
      streamRef.current = stream;
      
      // Create audio context
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      await audioContextRef.current.resume();
      
      // Set up audio analysis
      analyserRef.current = audioContextRef.current.createAnalyser();
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      
      analyserRef.current.fftSize = 2048;
      analyserRef.current.smoothingTimeConstant = 0.3;
      sourceRef.current.connect(analyserRef.current);
      
      // Determine best audio format
      const formats = ['audio/webm;codecs=pcm', 'audio/wav', 'audio/webm', 'audio/ogg'];
      let selectedFormat = '';
      
      for (const format of formats) {
        if (MediaRecorder.isTypeSupported(format)) {
          selectedFormat = format;
          selectedAudioFormatRef.current = format;
          break;
        }
      }
      
      console.log('✅ Selected format:', selectedFormat);
      
      // Set up MediaRecorder
      mediaRecorderRef.current = new MediaRecorder(stream, selectedFormat ? { mimeType: selectedFormat } : {});
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: selectedFormat });
        if (audioBlob.size > 0) {
          processAudio(audioBlob);
        }
      };
      
      // Update state
      setIsVoiceModeActive(true);
      setIsRecording(true);
      isVoiceModeActiveRef.current = true;
      
      console.log('✅ Voice mode started');
      
      // Start voice activity detection
      setTimeout(() => checkAudioLevel(), 100);
      
    } catch (error) {
      console.error('❌ Voice mode start error:', error);
      alert(`Failed to start voice mode: ${error.message}`);
      cleanupAudioResources();
    }
  };

  // Stop voice mode
  const stopVoiceMode = () => {
    console.log('🛑 Stopping voice mode...');
    
    setIsVoiceModeActive(false);
    setIsRecording(false);
    setIsListening(false);
    setIsProcessing(false);
    setIsPlaying(false);
    
    cleanupAudioResources();
    
    console.log('✅ Voice mode stopped');
  };

  // Toggle voice mode
  const handleClick = async () => {
    if (isVoiceModeActive) {
      stopVoiceMode();
    } else {
      // Create audio context on user gesture
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      }
      await startVoiceMode();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupAudioResources();
    };
  }, [cleanupAudioResources]);

  // Determine button variant and icon
  const getButtonVariant = () => {
    if (isProcessing) return 'secondary';
    if (isPlaying) return 'outline';
    if (isListening) return 'default';
    if (isVoiceModeActive) return 'secondary';
    return 'outline';
  };

  const getButtonIcon = () => {
    if (isProcessing) return <Loader2 className="h-4 w-4 animate-spin" />;
    if (isVoiceModeActive) return <MicOff className="h-4 w-4" />;
    return <Mic className="h-4 w-4" />;
  };

  return (
    <Button
      onClick={handleClick}
      variant={getButtonVariant()}
      size="sm"
      disabled={isProcessing}
      className="flex items-center gap-2"
      title={isVoiceModeActive ? 'Stop voice mode' : 'Start voice mode'}
    >
      {getButtonIcon()}
      {isProcessing && 'Processing...'}
      {isPlaying && 'AI Speaking...'}
      {isListening && !isProcessing && 'Listening...'}
      {isVoiceModeActive && !isListening && !isProcessing && !isPlaying && 'Voice Mode Active'}
      {!isVoiceModeActive && 'Voice Mode'}
    </Button>
  );
};

export default VoiceModeButton;