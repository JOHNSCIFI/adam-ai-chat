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
  const [isVoiceModeActive, setIsVoiceModeActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const currentSegmentChunksRef = useRef<Blob[]>([]);
  
  // Refs for immediate state access in callbacks
  const isListeningRef = useRef<boolean>(false);
  const isProcessingRef = useRef<boolean>(false);
  const isPlayingRef = useRef<boolean>(false);
  const isVoiceModeActiveRef = useRef<boolean>(false);
  
  const { user } = useAuth();
  
  // Process current audio segment
  const processCurrentSegment = useCallback(async () => {
    if (!mediaRecorderRef.current || currentSegmentChunksRef.current.length === 0) {
      console.log('⚠️ No audio to process - chunks:', currentSegmentChunksRef.current.length);
      setIsListening(false);
      isListeningRef.current = false;
      return;
    }

    console.log('🔄 Processing current audio segment...', {
      chunks: currentSegmentChunksRef.current.length,
      totalSize: currentSegmentChunksRef.current.reduce((sum, chunk) => sum + chunk.size, 0),
      recorderState: mediaRecorderRef.current.state
    });
    
    setIsListening(false);
    isListeningRef.current = false;
    setIsProcessing(true);
    isProcessingRef.current = true;
    
    try {
      // Create blob from current chunks
      const mimeType = mediaRecorderRef.current.mimeType || 'audio/webm';
      const audioBlob = new Blob(currentSegmentChunksRef.current, { type: mimeType });
      console.log('📦 Created segment blob:', {
        size: audioBlob.size,
        type: audioBlob.type,
        chunks: currentSegmentChunksRef.current.length
      });
      
      // Clear current chunks for next segment
      currentSegmentChunksRef.current = [];
      
      // Clear silence timer
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      
      // Process the audio segment
      if (audioBlob.size > 100) { // Minimum 100 bytes to avoid empty submissions
        console.log('📤 Sending audio to OpenAI...');
        await processVoiceInput(audioBlob);
      } else {
        console.warn('⚠️ Audio blob too small, resuming listening...', audioBlob.size, 'bytes');
        setIsProcessing(false);
        isProcessingRef.current = false;
      }
    } catch (error) {
      console.error('❌ Error in processCurrentSegment:', error);
      setIsProcessing(false);
      isProcessingRef.current = false;
    }
  }, [chatId, user?.id, onMessageSent]);

  // Enhanced Voice Activity Detection with proper frequency analysis
  const checkAudioLevel = useCallback(() => {
    // Use refs for immediate state access to avoid stale closures
    console.log('🔍 checkAudioLevel called - analyser:', !!analyserRef.current, 'voiceMode:', isVoiceModeActiveRef.current, 'listening:', isListeningRef.current, 'processing:', isProcessingRef.current);
    
    if (!analyserRef.current) {
      console.log('🛑 Stopping audio analysis - no analyser');
      return;
    }
    
    // Continue even if voiceMode appears false - there might be a state race condition
    if (!isVoiceModeActiveRef.current) {
      console.log('⚠️ Voice mode appears inactive but continuing check...');
    }
    
    try {
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserRef.current.getByteFrequencyData(dataArray);
      
      // Calculate overall RMS volume
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i] * dataArray[i];
      }
      const rms = Math.sqrt(sum / bufferLength);
      const volume = rms / 255;
      
      // Human speech frequency analysis (85Hz - 4000Hz for better detection)
      // With 24kHz sample rate and 2048 FFT: each bin = 24000/2048 = 11.72Hz
      const binSize = 24000 / 2048; // ~11.72 Hz per bin
      const speechStartBin = Math.floor(85 / binSize); // ~7
      const speechEndBin = Math.floor(4000 / binSize); // ~341
      
      let speechSum = 0;
      let speechBins = 0;
      for (let i = speechStartBin; i < Math.min(speechEndBin, bufferLength); i++) {
        speechSum += dataArray[i] * dataArray[i];
        speechBins++;
      }
      
      const speechRms = speechBins > 0 ? Math.sqrt(speechSum / speechBins) : 0;
      const speechVolume = speechRms / 255;
      
      // More sensitive thresholds for better detection
      const generalThreshold = 0.005; // Very low for any sound
      const speechThreshold = 0.008; // Even lower for speech detection
      
      // Consider it speech if we have both general audio and speech frequencies
      const isSpeechDetected = volume > generalThreshold && speechVolume > speechThreshold;
      
      console.log('🎵 Audio Analysis:', {
        volume: volume.toFixed(4),
        speechVolume: speechVolume.toFixed(4),
        detected: isSpeechDetected,
        listening: isListeningRef.current,
        processing: isProcessingRef.current,
        playing: isPlayingRef.current,
        voiceModeActive: isVoiceModeActiveRef.current,
        bufferLength,
        chunks: currentSegmentChunksRef.current?.length || 0
      });
      
      // Use refs for immediate state access
      if (isSpeechDetected && !isProcessingRef.current && !isPlayingRef.current) {
        // Speech detected - clear silence timer and mark as listening
        if (!isListeningRef.current) {
          console.log('🗣️ SPEECH DETECTED! Starting to listen...');
          setIsListening(true);
          isListeningRef.current = true;
          console.log('✅ Listening state activated via ref');
        }
        if (silenceTimerRef.current) {
          console.log('🔇 Clearing silence timer - speech continues');
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
      } else if (isListeningRef.current && !isProcessingRef.current && !isPlayingRef.current) {
        // Silence detected while we were listening - start timer
        if (!silenceTimerRef.current) {
          console.log('🔇 Starting 1-second silence timer...', {
            wasListening: isListeningRef.current,
            isProcessing: isProcessingRef.current,
            isPlaying: isPlayingRef.current,
            volume: volume.toFixed(4),
            speechVolume: speechVolume.toFixed(4),
            chunks: currentSegmentChunksRef.current?.length || 0
          });
          silenceTimerRef.current = setTimeout(() => {
            console.log('⏰ 1 second of silence - processing segment NOW');
            processCurrentSegment();
          }, 1000);
        }
      }
      
      // Continue checking if we still have necessary components
      if (analyserRef.current && streamRef.current && isVoiceModeActiveRef.current) {
        setTimeout(() => checkAudioLevel(), 50);
      } else {
        console.log('🛑 Stopping audio analysis - missing components or voice mode inactive');
      }
    } catch (error) {
      console.error('❌ Error in checkAudioLevel:', error);
      // Retry after error if we still have the necessary components
      if (analyserRef.current && streamRef.current && isVoiceModeActiveRef.current) {
        setTimeout(() => checkAudioLevel(), 100);
      }
    }
  }, [processCurrentSegment]);

  const startContinuousRecording = async () => {
    try {
      console.log('🎤 Starting continuous voice recording...');
      
      // Request microphone permission with specific constraints
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      console.log('✅ Microphone access granted');
      
      streamRef.current = stream;
      
      // Use the pre-created AudioContext and resume it if needed
      if (!audioContextRef.current) {
        console.error('❌ AudioContext not created during click!');
        return;
      }
      
      // Resume audio context if suspended (browser requirement)
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
        console.log('🔊 Audio context resumed');
      }
      
      console.log('🔊 AudioContext state:', audioContextRef.current.state);
      
      analyserRef.current = audioContextRef.current.createAnalyser();
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      
      // Configure analyser for better speech detection
      analyserRef.current.fftSize = 2048;
      analyserRef.current.smoothingTimeConstant = 0.3;
      analyserRef.current.minDecibels = -90;
      analyserRef.current.maxDecibels = -10;
      
      sourceRef.current.connect(analyserRef.current);
      console.log('🔊 Audio analysis setup complete');
      
      // Try different audio formats for better compatibility
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/wav')) {
          mimeType = 'audio/wav';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else {
          console.warn('⚠️ No supported audio format found, using default');
          mimeType = '';
        }
      }
      
      console.log('🎵 Using audio format:', mimeType);

      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      mediaRecorderRef.current = mediaRecorder;
      currentSegmentChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        console.log('📊 Audio chunk received:', {
          size: event.data.size,
          type: event.data.type,
          chunks: currentSegmentChunksRef.current.length
        });
        if (event.data.size > 0) {
          currentSegmentChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('❌ MediaRecorder error:', event);
      };

      mediaRecorder.onstart = () => {
        console.log('🔴 MediaRecorder started');
      };

      mediaRecorder.onstop = () => {
        console.log('⏹️ MediaRecorder stopped');
      };

      // Start continuous recording with small time slices
      mediaRecorder.start(200); // 200ms chunks for better responsiveness
      setIsRecording(true);
      setIsListening(false); // Will be set to true when voice is detected
      isListeningRef.current = false;
      console.log('🔴 Continuous recording started');
      
      // Start voice activity detection
      console.log('🎵 Starting voice activity detection...');
      
      // Add a small delay to ensure everything is set up, then start checking
      setTimeout(() => {
        console.log('🎵 Starting audio level checking loop...');
        checkAudioLevel();
      }, 100);
      
    } catch (error) {
      console.error('❌ Error starting continuous recording:', error);
      if (error.name === 'NotAllowedError') {
        alert('Microphone access denied. Please allow microphone access and try again.');
      } else if (error.name === 'NotFoundError') {
        alert('No microphone found. Please connect a microphone and try again.');
      } else {
        alert(`Microphone error: ${error.message}`);
      }
    }
  };


  const stopContinuousRecording = () => {
    console.log('🛑 Stopping continuous recording...');
    
    // Clear silence timer
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    
    // Stop media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    // Stop stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    setIsRecording(false);
    setIsListening(false);
    isListeningRef.current = false;
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
    // Prevent duplicate processing
    if (isProcessingRef.current) {
      console.log('⚠️ Already processing, skipping duplicate call');
      return;
    }

    console.log('🎤 Processing voice input - blob size:', audioBlob.size, 'type:', audioBlob.type);
    
    // Set processing state
    setIsProcessing(true);
    isProcessingRef.current = true;
    
    // Add timeout to prevent stuck processing
    const processingTimeout = setTimeout(() => {
      console.error('⏰ Processing timeout - resetting state');
      setIsProcessing(false);
      isProcessingRef.current = false;
      if (isVoiceModeActiveRef.current) {
        setIsListening(true);
        isListeningRef.current = true;
      }
    }, 30000); // 30 second timeout
    
    try {
      // Convert speech to text - use webm format explicitly
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.webm');
      
      console.log('📤 SENDING AUDIO TO OPENAI - Size:', audioBlob.size, 'bytes, Type:', audioBlob.type);
      console.log('🔊 Sending to speech-to-text function...');

      const { data: transcriptionData, error: transcriptionError } = await supabase.functions.invoke('speech-to-text', {
        body: formData,
      });

      console.log('📝 Transcription response received:', { transcriptionData, transcriptionError });

      if (transcriptionError) {
        console.error('❌ Transcription error:', transcriptionError);
        throw new Error(transcriptionError.message);
      }

      const userText = transcriptionData?.text;
      console.log('✅ User said:', userText);
      
      if (!userText || userText.trim() === '') {
        console.warn('⚠️ Empty transcription received, resuming listening');
        // Clear processing state for empty transcription
        clearTimeout(processingTimeout);
        setIsProcessing(false);
        isProcessingRef.current = false;
        if (isVoiceModeActiveRef.current) {
          setIsListening(true);
          isListeningRef.current = true;
        }
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

      // Save AI message - only save once to prevent duplicates
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
      console.log('🔊 Converting AI response to speech...');
      const { data: speechData, error: speechError } = await supabase.functions.invoke('text-to-speech-voice-mode', {
        body: {
          text: aiText,
          voice: 'alloy'
        }
      });

      console.log('🗣️ Speech response:', { speechData, speechError });

      if (speechError) {
        console.error('❌ Speech error details:', speechError);
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
    } finally {
      // Clear timeout and processing state
      clearTimeout(processingTimeout);
      setIsProcessing(false);
      isProcessingRef.current = false;
      console.log('🔄 Processing finished, ready for next input');
      
      // Resume listening if voice mode is still active and not playing
      if (isVoiceModeActiveRef.current && !isPlayingRef.current) {
        setTimeout(() => {
          setIsListening(true);
          isListeningRef.current = true;
          console.log('🔄 Resumed listening after processing');
        }, 1000);
      }
    }
  };

  const playAudio = async (base64Audio: string) => {
    try {
      setIsPlaying(true);
      isPlayingRef.current = true;
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
      
      // Handle browser autoplay restrictions
      audio.preload = 'auto';
      
      audio.onended = () => {
        console.log('🔇 Audio playback ended');
        setIsPlaying(false);
        isPlayingRef.current = false;
        URL.revokeObjectURL(audioUrl);
        
        // Resume listening after AI response
        console.log('🔄 Resuming listening after AI response...');
        setTimeout(() => {
          setIsListening(true);
          isListeningRef.current = true;
        }, 300);
      };

      audio.onerror = (error) => {
        console.error('❌ Audio playback error:', error);
        setIsPlaying(false);
        isPlayingRef.current = false;
        URL.revokeObjectURL(audioUrl);
      };

      audio.oncanplaythrough = async () => {
        try {
          console.log('▶️ Audio ready to play, attempting playback...');
          await audio.play();
          console.log('✅ Audio playback started successfully');
        } catch (playError) {
          console.error('❌ Audio play failed:', playError);
          
          // Fallback: Create a user-activated play button
          const playButton = document.createElement('button');
          playButton.textContent = '🔊 Click to play AI response';
          playButton.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 9999;
            padding: 12px 24px;
            background: #007bff;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          `;
          
          playButton.onclick = async () => {
            try {
              await audio.play();
              document.body.removeChild(playButton);
            } catch (buttonPlayError) {
              console.error('❌ Button play failed:', buttonPlayError);
              document.body.removeChild(playButton);
              setIsPlaying(false);
              isPlayingRef.current = false;
              
              // If voice mode is active, continue to next cycle even if play failed
              if (isVoiceModeActive) {
                setTimeout(() => {
                  setIsListening(true);
                  isListeningRef.current = true;
                }, 500);
              }
            }
          };
          
          document.body.appendChild(playButton);
          
          // Auto-remove after 10 seconds if not clicked
          setTimeout(() => {
            if (document.body.contains(playButton)) {
              document.body.removeChild(playButton);
              setIsPlaying(false);
              isPlayingRef.current = false;
              
              // If voice mode is active, continue to next cycle
              if (isVoiceModeActive) {
                setTimeout(() => {
                  setIsListening(true);
                  isListeningRef.current = true;
                }, 500);
              }
            }
          }, 10000);
        }
      };
      
      // Load the audio
      audio.load();
      
    } catch (error) {
      console.error('💥 Error playing audio:', error);
      setIsPlaying(false);
      isPlayingRef.current = false;
    }
  };

  const getButtonIcon = () => {
    if (isPlaying) return <Volume2 className="h-6 w-6" />;
    if (isProcessing) return <div className="animate-spin h-6 w-6 border-2 border-current rounded-full border-t-transparent" />;
    if (isListening && isVoiceModeActive) return <Radio className="h-6 w-6 animate-pulse" />;
    if (isVoiceModeActive) return <Square className="h-6 w-6" />;
    return <Radio className="h-6 w-6" />;
  };

  const getButtonVariant = () => {
    if (isVoiceModeActive && isListening) return 'destructive';
    if (isVoiceModeActive && (isProcessing || isPlaying)) return 'secondary';
    if (isVoiceModeActive) return 'default';
    return 'default';
  };

  const startVoiceMode = async () => {
    console.log('🎤 Starting continuous voice mode...');
    
    // Create AudioContext immediately on user click (browser security requirement)
    try {
      audioContextRef.current = new AudioContext({ 
        sampleRate: 24000,
        latencyHint: 'interactive'
      });
      console.log('🔊 AudioContext created immediately on click');
    } catch (error) {
      console.error('❌ Failed to create AudioContext:', error);
    }
    
    // Set voice mode active BEFORE starting recording
    setIsVoiceModeActive(true);
    isVoiceModeActiveRef.current = true;
    console.log('🎤 Voice mode set to ACTIVE');
    
    await startContinuousRecording();
  };

  const stopVoiceMode = () => {
    console.log('🛑 Stopping continuous voice mode...');
    setIsVoiceModeActive(false);
    isVoiceModeActiveRef.current = false;
    stopContinuousRecording();
    setIsProcessing(false);
    isProcessingRef.current = false;
    setIsPlaying(false);
    isPlayingRef.current = false;
  };

  const handleClick = () => {
    if (!isVoiceModeActive) {
      // Start voice mode
      startVoiceMode();
    } else {
      // Stop voice mode
      stopVoiceMode();
    }
  };

  return (
    <Button
      type="button"
      onClick={handleClick}
      disabled={false}
      variant={getButtonVariant()}
      size="icon"
      className={`h-12 w-12 rounded-full flex-shrink-0 transition-all duration-300 ${
        isVoiceModeActive ? 'ring-2 ring-primary ring-offset-2' : ''
      } ${
        isListening && isVoiceModeActive ? 'scale-110 shadow-lg animate-pulse bg-secondary/80 ring-secondary border-secondary' : 'hover:scale-105'
      } ${isProcessing ? 'animate-spin bg-primary/80' : ''} ${isPlaying ? 'animate-pulse bg-accent/80' : ''}`}
      title={isVoiceModeActive ? 'Stop Continuous Voice Mode' : 'Start Continuous Voice Mode'}
    >
      {getButtonIcon()}
    </Button>
  );
};

export default VoiceModeButton;