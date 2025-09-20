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
  
  // Add request throttling to prevent overlapping edge function calls
  const lastRequestTimeRef = useRef<number>(0);
  const isRequestInProgressRef = useRef<boolean>(false);
  const MIN_REQUEST_INTERVAL = 2000; // Minimum 2 seconds between requests
  const selectedAudioFormatRef = useRef<string>(''); // Store selected format for reinitialization
  const audioAnalysisActiveRef = useRef<boolean>(false); // Prevent overlapping checkAudioLevel calls
  
  const { user } = useAuth();
  
  const processCurrentSegment = useCallback(async () => {
    // Check if we already have a request in progress
    if (isRequestInProgressRef.current) {
      console.log('🚫 Skipping segment - request already in progress');
      return;
    }
    
    // Check minimum time interval between requests
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTimeRef.current;
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      console.log(`🚫 Skipping segment - too soon (${timeSinceLastRequest}ms < ${MIN_REQUEST_INTERVAL}ms)`);
      return;
    }
    
    if (!mediaRecorderRef.current || currentSegmentChunksRef.current.length === 0) {
      setIsListening(false);
      isListeningRef.current = false;
      return;
    }

    console.log('🔄 Processing speech segment...');
    
    // STOP listening and audio analysis immediately
    setIsListening(false);
    isListeningRef.current = false;
    setIsProcessing(true);
    isProcessingRef.current = true;
    isRequestInProgressRef.current = true;
    lastRequestTimeRef.current = now;
    
    try {
      const mimeType = mediaRecorderRef.current.mimeType || 'audio/webm';
      const audioBlob = new Blob(currentSegmentChunksRef.current, { type: mimeType });
      
      // Clear current chunks and timer
      currentSegmentChunksRef.current = [];
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      
      // Validate audio data before processing
      if (audioBlob.size > 1000) { // Increased minimum size to 1KB
        await processVoiceInput(audioBlob);
      } else {
        console.log(`🚫 Audio too small (${audioBlob.size} bytes), skipping`);
      }
    } catch (error) {
      console.error('❌ Error in processCurrentSegment:', error);
    } finally {
      setIsProcessing(false);
      isProcessingRef.current = false;
      isRequestInProgressRef.current = false;
    }
  }, []);

  // Enhanced Voice Activity Detection with proper frequency analysis
  const checkAudioLevel = useCallback(() => {
    if (!analyserRef.current || !isVoiceModeActiveRef.current) {
      audioAnalysisActiveRef.current = false;
      return;
    }
    
    // Prevent overlapping calls
    if (audioAnalysisActiveRef.current) {
      return;
    }
    
    audioAnalysisActiveRef.current = true;
    
    // Skip if we have a request in progress or are processing/playing
    if (isRequestInProgressRef.current || isProcessingRef.current || isPlayingRef.current) {
      audioAnalysisActiveRef.current = false;
      setTimeout(() => checkAudioLevel(), 100);
      return;
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
      
      // Enhanced thresholds for noisy environments
      const generalThreshold = 0.015; // Higher threshold to filter background noise
      const speechThreshold = 0.025; // Higher speech threshold for better accuracy
      const noiseFloor = 0.003; // Minimum noise level to ignore
      
      // Calculate noise reduction - ignore very low volume as background noise
      const adjustedVolume = Math.max(0, volume - noiseFloor);
      const adjustedSpeechVolume = Math.max(0, speechVolume - noiseFloor);
      
      // Enhanced detection: require significant speech content with noise filtering
      const volumeRatio = speechVolume > 0 ? (speechVolume / Math.max(volume, 0.001)) : 0;
      const isStrongSpeech = volumeRatio > 0.4 && adjustedSpeechVolume > speechThreshold;
      const isSpeechDetected = adjustedVolume > generalThreshold && isStrongSpeech;
      
      // Use refs for immediate state access
      if (isSpeechDetected && !isProcessingRef.current && !isPlayingRef.current && !isRequestInProgressRef.current) {
        // Speech detected - clear silence timer and mark as listening
        if (!isListeningRef.current) {
          setIsListening(true);
          isListeningRef.current = true;
        }
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
      } else if (isListeningRef.current && !isProcessingRef.current && !isPlayingRef.current && !isRequestInProgressRef.current) {
        // Silence detected while we were listening - start timer
        if (!silenceTimerRef.current) {
          // Reduced silence timer for more responsive detection in noisy environments
          silenceTimerRef.current = setTimeout(() => {
            processCurrentSegment();
          }, 1000); // Reduced to 1 second for better responsiveness
        }
      }
      
      // Continue checking only if conditions are right
      if (analyserRef.current && streamRef.current && isVoiceModeActiveRef.current && !isProcessingRef.current && !isPlayingRef.current && !isRequestInProgressRef.current) {
        audioAnalysisActiveRef.current = false; // Reset flag before next call
        setTimeout(() => checkAudioLevel(), 100); // Increased interval for better performance
      } else {
        audioAnalysisActiveRef.current = false;
      }
    } catch (error) {
      console.error('❌ Error in checkAudioLevel:', error);
      audioAnalysisActiveRef.current = false;
      // Retry after error only if conditions are right
      if (analyserRef.current && streamRef.current && isVoiceModeActiveRef.current && !isProcessingRef.current && !isPlayingRef.current && !isRequestInProgressRef.current) {
        setTimeout(() => checkAudioLevel(), 200);
      }
    }
  }, [processCurrentSegment]);

  const startContinuousRecording = async () => {
    try {
      console.log('🎤 Starting continuous voice recording...');
      
      // Request microphone permission with enhanced noise reduction constraints
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
      
      // Try different audio formats for better compatibility - prioritize WAV
      let mimeType = '';
      const preferredFormats = [
        'audio/wav',
        'audio/webm;codecs=pcm',
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus'
      ];
      
      for (const format of preferredFormats) {
        if (MediaRecorder.isTypeSupported(format)) {
          mimeType = format;
          selectedAudioFormatRef.current = format; // Store for reinitialization
          console.log('✅ Selected audio format:', format);
          console.log('📊 Format stored for consistency:', selectedAudioFormatRef.current);
          break;
        }
      }
      
      if (!mimeType) {
        console.warn('⚠️ No supported audio format found, using default');
      }
      
      console.log('🎵 Using audio format:', mimeType);

      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      mediaRecorderRef.current = mediaRecorder;
      currentSegmentChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && isVoiceModeActiveRef.current) {
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
    
    // Reset audio analysis flag
    audioAnalysisActiveRef.current = false;
    
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
    console.log('🎤 Processing voice input - blob size:', audioBlob.size);
    console.log('🎤 Voice processing states:', {
      isProcessing: isProcessingRef.current,
      isPlaying: isPlayingRef.current,
      isVoiceModeActive: isVoiceModeActiveRef.current,
      isRequestInProgress: isRequestInProgressRef.current
    });
    
    if (!user) {
      console.error('❌ No user authenticated');
      return;
    }

    // Validate audio blob before processing
    if (audioBlob.size < 500) {
      console.warn('⚠️ Audio blob too small, skipping processing');
      return;
    }
    
    try {
      setIsProcessing(true);
      isProcessingRef.current = true;

      console.log('🎤 Sending WebM audio directly to speech-to-text:', {
        size: audioBlob.size,
        type: audioBlob.type,
        format: 'original_webm_no_conversion'
      });

      // Create FormData and send WebM directly (edge function supports it)
      const formData = new FormData();
      const filename = audioBlob.type.includes('webm') ? 'audio.webm' : 'audio.wav';
      formData.append('audio', audioBlob, filename);

      console.log('📡 Calling speech-to-text edge function...');
      
      const { data: transcriptionData, error: transcriptionError } = await supabase.functions.invoke('speech-to-text', {
        body: formData
      });
      
      console.log('📡 Speech-to-text response:', { data: transcriptionData, error: transcriptionError });

      if (transcriptionError) {
        console.error('❌ Speech-to-text error:', transcriptionError);
        throw new Error(`Speech-to-text failed: ${transcriptionError.message}`);
      }

      const userText = transcriptionData?.text;
      console.log('📝 Transcribed text:', { text: userText, length: userText?.length });
      
      if (!userText || userText.trim() === '') {
        console.warn('⚠️ Empty transcription result, resuming listening');
        setIsProcessing(false);
        isProcessingRef.current = false;
        // Resume listening immediately for empty results
        setTimeout(() => {
          if (isVoiceModeActiveRef.current && !isPlayingRef.current && !isRequestInProgressRef.current) {
            console.log('🔄 Resuming audio analysis after empty transcription');
            checkAudioLevel();
          }
        }, 500);
        return;
      }
      
      // Save user message
      console.log('💾 Saving user message to database...');
      const userMessageId = uuidv4();
      const { error: userMessageError } = await supabase
        .from('messages')
        .insert({
          id: userMessageId,
          chat_id: chatId,
          content: userText,
          role: 'user'
        });

      if (userMessageError) {
        console.error('❌ Failed to save user message:', userMessageError);
        throw new Error(`Failed to save user message: ${userMessageError.message}`);
      }
      
      console.log('✅ User message saved successfully');
      onMessageSent(userMessageId, userText, 'user');

      // Get AI response
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
      
      console.log('🤖 AI response:', { data: aiResponse, error: aiError });

      if (aiError || !aiResponse?.content) {
        console.error('❌ AI response failed:', aiError);
        throw new Error(`AI response failed: ${aiError?.message || 'No content'}`);
      }

      // Save AI message
      console.log('💾 Saving AI message to database...');
      const aiMessageId = uuidv4();
      const { error: aiMessageError } = await supabase
        .from('messages')
        .insert({
          id: aiMessageId,
          chat_id: chatId,
          content: aiResponse.content,
          role: 'assistant'
        });

      if (aiMessageError) {
        console.error('❌ Failed to save AI message:', aiMessageError);
        throw new Error(`Failed to save AI message: ${aiMessageError.message}`);
      }
      
      console.log('✅ AI message saved successfully');
      onMessageSent(aiMessageId, aiResponse.content, 'assistant');

      // Convert AI response to speech
      console.log('🎵 Converting AI response to speech...');
      const { data: speechData, error: speechError } = await supabase.functions.invoke('text-to-speech-voice-mode', {
        body: {
          text: aiResponse.content,
          voice: 'alloy'
        }
      });
      
      console.log('🎵 Speech generation result:', { data: speechData ? 'has_data' : 'no_data', error: speechError });

      if (speechError || !speechData?.audioContent) {
        console.error('❌ Speech generation failed:', speechError);
        throw new Error(`Speech generation failed: ${speechError?.message || 'No audio'}`);
      }

      // Play AI response
      console.log('🔊 Playing AI response audio...');
      await playAudio(speechData.audioContent);

    } catch (error) {
      console.error('💥 Error processing voice input:', error);
      console.error('💥 Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack?.slice(0, 200)
      });
      alert(`Voice processing error: ${error.message}`);
    } finally {
      // Always reset processing state
      setIsProcessing(false);
      isProcessingRef.current = false;
      
      console.log('🔄 Voice processing completed, preparing to resume listening...');
      
      // Resume listening after a short delay (only if not playing)
      setTimeout(() => {
        if (isVoiceModeActiveRef.current && !isPlayingRef.current && !isRequestInProgressRef.current) {
          console.log('🔄 Resuming audio analysis after processing');
          checkAudioLevel(); // Resume the audio analysis loop
        } else {
          console.log('🚫 Not resuming audio analysis:', {
            voiceModeActive: isVoiceModeActiveRef.current,
            isPlaying: isPlayingRef.current,
            isRequestInProgress: isRequestInProgressRef.current
          });
        }
      }, 1000); // Shorter delay for better responsiveness
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
        console.log('✅ AI finished speaking');
        setIsPlaying(false);
        isPlayingRef.current = false;
        URL.revokeObjectURL(audioUrl);
        
        // Resume listening for next input with proper MediaRecorder reinitialization
        if (isVoiceModeActiveRef.current && !isRequestInProgressRef.current) {
          console.log('🎤 Resuming listening after AI speech');
          
          // Reinitialize MediaRecorder to prevent audio corruption
          setTimeout(async () => {
            if (isVoiceModeActiveRef.current && !isProcessingRef.current && !isRequestInProgressRef.current) {
              console.log('🔄 Reinitializing MediaRecorder after AI speech...');
              
              try {
                // Stop current MediaRecorder if still active
                if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                  mediaRecorderRef.current.stop();
                }
                
                // Clear existing chunks
                currentSegmentChunksRef.current = [];
                
                // Restart recording with fresh MediaRecorder
                if (streamRef.current && streamRef.current.active) {
                  // Use the EXACT same format that was originally successful
                  let mimeType = selectedAudioFormatRef.current;
                  
                  // If no format was stored or it's no longer supported, use the same selection logic
                  if (!mimeType || !MediaRecorder.isTypeSupported(mimeType)) {
                    console.warn('⚠️ Need to reselect audio format for reinitialization');
                    // Use the EXACT same selection logic as initial setup
                    const preferredFormats = [
                      'audio/wav',
                      'audio/webm;codecs=pcm',
                      'audio/webm;codecs=opus',
                      'audio/webm',
                      'audio/mp4',
                      'audio/ogg;codecs=opus'
                    ];
                    
                    for (const format of preferredFormats) {
                      if (MediaRecorder.isTypeSupported(format)) {
                        mimeType = format;
                        selectedAudioFormatRef.current = format; // Store for future use
                        console.log('✅ Reselected audio format:', format);
                        break;
                      }
                    }
                  }
                  
                  if (!mimeType) {
                    console.error('❌ No supported audio format found during reinitialization');
                    return;
                  }
                  
                  console.log('🎵 Creating new MediaRecorder with format:', mimeType);
                  console.log('📊 Format consistency check:', {
                    storedFormat: selectedAudioFormatRef.current,
                    usingFormat: mimeType,
                    isConsistent: selectedAudioFormatRef.current === mimeType
                  });
                  console.log('📊 Format consistency check:', {
                    storedFormat: selectedAudioFormatRef.current,
                    usingFormat: mimeType,
                    isConsistent: selectedAudioFormatRef.current === mimeType
                  });
                  
                  // Create new MediaRecorder
                  const newMediaRecorder = new MediaRecorder(streamRef.current, mimeType ? { mimeType } : {});
                  mediaRecorderRef.current = newMediaRecorder;
                  
                  // Set up event handlers
                  newMediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0 && isVoiceModeActiveRef.current) {
                      currentSegmentChunksRef.current.push(event.data);
                    }
                  };
                  
                  newMediaRecorder.onerror = (event) => {
                    console.error('❌ MediaRecorder error during restart:', event);
                  };
                  
                  newMediaRecorder.onstart = () => {
                    console.log('🔴 New MediaRecorder started after AI speech');
                  };
                  
                  newMediaRecorder.onstop = () => {
                    console.log('⏹️ New MediaRecorder stopped');
                  };
                  
                  // Start the new recorder
                  newMediaRecorder.start(200);
                  console.log('✅ MediaRecorder reinitialized successfully');
                  
                  // Resume audio analysis immediately after reinitialization
                  setTimeout(() => {
                    if (isVoiceModeActiveRef.current && !isProcessingRef.current && !isRequestInProgressRef.current) {
                      console.log('🔄 Starting audio analysis loop after AI speech');
                      checkAudioLevel();
                    }
                  }, 200); // Quick restart for better responsiveness
                } else {
                  console.warn('⚠️ Stream inactive, need to restart recording completely');
                  // If stream is inactive, restart the entire recording process
                  await startContinuousRecording();
                }
                
              } catch (error) {
                console.error('❌ Failed to reinitialize MediaRecorder:', error);
                // Fallback: restart the entire recording process
                try {
                  await startContinuousRecording();
                } catch (restartError) {
                  console.error('❌ Failed to restart recording completely:', restartError);
                }
              }
            }
          }, 800); // Increased delay to ensure AI audio is fully finished
        }
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