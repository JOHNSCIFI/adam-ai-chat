import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Radio, Square, Volume2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { v4 as uuidv4 } from 'uuid';

// Type declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

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
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVoiceModeActive, setIsVoiceModeActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  
  const { user } = useAuth();

  const startVoiceMode = async () => {
    console.log('🎤 Starting voice mode...');
    
    try {
      // Check if browser supports Web Speech API
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        console.error('❌ Speech recognition not supported in this browser');
        return;
      }

      // Check for HTTPS requirement
      const isSecureContext = window.isSecureContext || location.protocol === 'https:' || location.hostname === 'localhost';
      if (!isSecureContext) {
        console.error('❌ Speech recognition requires HTTPS');
        return;
      }

      console.log('✅ Speech recognition supported, creating instance...');
      const recognition = new SpeechRecognition();
      
      // Configure recognition
      recognition.continuous = false; // Process one phrase at a time
      recognition.interimResults = false; // Only final results
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;
      
      recognitionRef.current = recognition;
      
      // Set up event handlers
      recognition.onstart = () => {
        console.log('🎤 Speech recognition started');
        setIsListening(true);
      };
      
      recognition.onresult = async (event: any) => {
        const result = event.results[0];
        if (result.isFinal) {
          const transcript = result[0].transcript.trim();
          console.log('📝 Speech recognized:', transcript);
          
          if (transcript) {
            setIsListening(false);
            setIsProcessing(true);
            await processUserSpeech(transcript);
          }
          
          // Don't automatically restart here - let TTS completion handle it
        }
      };
      
      recognition.onerror = (event: any) => {
        console.error('❌ Speech recognition error:', event.error);
        setIsListening(false);
        
        // Restart on certain errors
        if (event.error === 'no-speech') {
          setTimeout(() => {
            if (isVoiceModeActive && !isProcessing && !isPlaying) {
              try {
                recognition.start();
              } catch (restartError) {
                console.error('❌ Error restarting recognition:', restartError);
              }
            }
          }, 1000);
        }
      };
      
      recognition.onend = () => {
        console.log('🛑 Speech recognition ended');
        setIsListening(false);
      };
      
      setIsVoiceModeActive(true);
      recognition.start();
      
    } catch (error) {
      console.error('❌ Error starting voice mode:', error);
      setIsVoiceModeActive(false);
    }
  };

  const stopVoiceMode = () => {
    console.log('🛑 Stopping voice mode...');
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    
    // Stop any ongoing speech synthesis
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    
    setIsVoiceModeActive(false);
    setIsListening(false);
    setIsProcessing(false);
    setIsPlaying(false);
  };

  const speakText = async (text: string) => {
    console.log('🔊 Speaking text with OpenAI TTS:', text.substring(0, 50) + '...');
    setIsPlaying(true);
    
    try {
      console.log('🤖 Calling OpenAI TTS...');
      const { data: ttsResponse, error: ttsError } = await supabase.functions.invoke('text-to-speech', {
        body: {
          text: text,
          voice: 'alloy'
        }
      });

      console.log('🎵 TTS Response:', { 
        hasData: !!ttsResponse, 
        hasAudio: !!ttsResponse?.audioContent,
        error: ttsError,
        audioLength: ttsResponse?.audioContent?.length 
      });

      if (ttsError || !ttsResponse?.audioContent) {
        console.error('❌ TTS error, falling back to browser TTS:', ttsError);
        fallbackToBrowserTTS(text);
        return;
      }

      // Create audio with proper format
      const audioFormat = ttsResponse.format || 'wav';
      const audioData = `data:audio/${audioFormat};base64,${ttsResponse.audioContent}`;
      const audio = new Audio(audioData);
      
      console.log('🎵 Audio created with format:', audioFormat, 'Size:', ttsResponse.size);
      
      // Set up audio event handlers
      audio.onloadstart = () => console.log('🎵 Audio loading started');
      audio.oncanplay = () => console.log('🎵 Audio can play');
      audio.onloadeddata = () => console.log('🎵 Audio data loaded');
      
      audio.onended = () => {
        console.log('✅ OpenAI TTS playbook finished');
        console.log('🔄 TTS ended - checking voice mode state:', { 
          isVoiceModeActive, 
          isProcessing, 
          isPlaying: true 
        });
        setIsPlaying(false);
        
        // Automatically resume listening after TTS finishes
        console.log('⏰ Setting timeout to resume listening in 500ms...');
        setTimeout(() => {
          console.log('🔄 Timeout fired - rechecking voice mode state:', { 
            isVoiceModeActive, 
            isProcessing, 
            isPlaying: false 
          });
          if (isVoiceModeActive) {
            console.log('🎤 Conditions met - calling resumeListening()');
            resumeListening();
          } else {
            console.log('❌ Voice mode not active - not resuming listening');
          }
        }, 500);
      };
      
      audio.onerror = (error) => {
        console.error('❌ Audio playback error:', error);
        setIsPlaying(false);
        fallbackToBrowserTTS(text);
      };
      
      // Play the audio
      try {
        console.log('🎵 Starting audio playback...');
        await audio.play();
      } catch (playError) {
        console.error('❌ Audio play failed:', playError);
        setIsPlaying(false);
        fallbackToBrowserTTS(text);
      }
      
    } catch (error) {
      console.error('❌ TTS function call error:', error);
      setIsPlaying(false);
      fallbackToBrowserTTS(text);
    }
  };

  const fallbackToBrowserTTS = (text: string) => {
    console.log('🔊 Using browser TTS as fallback');
    
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      synthesisRef.current = utterance;
      
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.name.includes('Samantha') || 
        voice.name.includes('Alex') || 
        voice.name.includes('Karen') ||
        voice.lang.startsWith('en')
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      utterance.onend = () => {
        console.log('✅ Browser TTS finished');
        console.log('🔄 Browser TTS ended - checking voice mode state:', { 
          isVoiceModeActive, 
          isProcessing, 
          isPlaying: true 
        });
        setIsPlaying(false);
        
        // Automatically resume listening after browser TTS finishes
        console.log('⏰ Setting timeout to resume listening after browser TTS...');
        setTimeout(() => {
          console.log('🔄 Browser TTS timeout fired - rechecking state:', { 
            isVoiceModeActive, 
            isProcessing, 
            isPlaying: false 
          });
          if (isVoiceModeActive) {
            console.log('🎤 Browser TTS done - calling resumeListening()');
            resumeListening();
          } else {
            console.log('❌ Voice mode not active after browser TTS');
          }
        }, 500);
      };
      
      utterance.onerror = (error) => {
        console.error('❌ Browser TTS error:', error);
        setIsPlaying(false);
        // Still try to resume listening even on error
        setTimeout(() => {
          if (isVoiceModeActive) {
            resumeListening();
          }
        }, 1000);
      };
      
      window.speechSynthesis.speak(utterance);
    } else {
      console.error('❌ No TTS available');
      setIsPlaying(false);
      // Resume listening even if no TTS is available
      setTimeout(() => {
        if (isVoiceModeActive) {
          resumeListening();
        }
      }, 1000);
    }
  };

  const resumeListening = () => {
    console.log('🎤 resumeListening() called with state:', { 
      isVoiceModeActive, 
      isProcessing, 
      isPlaying 
    });
    
    if (!isVoiceModeActive || isProcessing || isPlaying) {
      console.log('🎤 Not resuming - conditions not met:', { 
        isVoiceModeActive, 
        isProcessing, 
        isPlaying 
      });
      return;
    }

    console.log('🎤 ✅ All conditions met - resuming listening after AI response...');
    
    // Create new recognition instance for continuous conversation
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        console.error('❌ Speech recognition not supported');
        return;
      }

      // Clean up existing recognition first
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors when stopping
        }
      }

      console.log('🎤 Creating fresh recognition instance for continuous chat...');
      const recognition = new SpeechRecognition();
      
      // Configure recognition
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;
      
      recognitionRef.current = recognition;
      
      // Set up event handlers
      recognition.onstart = () => {
        console.log('🎤 Listening resumed - ready for next input');
        setIsListening(true);
      };
      
      recognition.onresult = async (event: any) => {
        const result = event.results[0];
        if (result.isFinal) {
          const transcript = result[0].transcript.trim();
          console.log('📝 New speech recognized:', transcript);
          
          if (transcript) {
            setIsListening(false);
            setIsProcessing(true);
            await processUserSpeech(transcript);
          }
        }
      };
      
      recognition.onerror = (event: any) => {
        console.error('❌ Speech recognition error during resume:', event.error);
        setIsListening(false);
        
        // Try to restart on recoverable errors
        if (event.error === 'no-speech' && isVoiceModeActive) {
          setTimeout(() => {
            if (isVoiceModeActive && !isProcessing && !isPlaying) {
              resumeListening();
            }
          }, 1500);
        }
      };
      
      recognition.onend = () => {
        console.log('🛑 Recognition ended during resume');
        setIsListening(false);
      };
      
      // Start listening immediately
      setTimeout(() => {
        if (isVoiceModeActive && !isProcessing && !isPlaying) {
          console.log('🎤 Starting listening for next user input...');
          recognition.start();
        }
      }, 300);
      
    } catch (error) {
      console.error('❌ Error creating recognition for resume:', error);
    }
  };

  const processUserSpeech = async (transcript: string) => {
    console.log('🎤 Processing user speech:', transcript);
    
    try {
      // Save user message
      console.log('💾 Saving user message to database...');
      const userMessageId = uuidv4();
      const { error: userMessageError } = await supabase
        .from('messages')
        .insert({
          id: userMessageId,
          chat_id: chatId,
          content: transcript,
          role: 'user'
        });

      if (userMessageError) {
        console.error('❌ Failed to save user message:', userMessageError);
        throw new Error(`Failed to save user message: ${userMessageError.message}`);
      }

      console.log('✅ User message saved successfully');
      onMessageSent(userMessageId, transcript, 'user');

      // Get AI response
      console.log('🤖 Getting AI response...');
      const { data: aiResponse, error: aiError } = await supabase.functions.invoke('chat-with-ai-optimized', {
        body: {
          message: transcript,
          chat_id: chatId,
          user_id: user?.id
        }
      });
      
      console.log('🤖 AI response:', { data: aiResponse ? 'has_data' : 'no_data', error: aiError });

      if (aiError || !aiResponse?.content) {
        console.error('❌ AI response error:', aiError);
        throw new Error(`AI response failed: ${aiError?.message || 'No response content'}`);
      }

      // Save AI response
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

      // Speak AI response using client-side TTS
      speakText(aiResponse.content);

    } catch (error) {
      console.error('❌ Error in processUserSpeech:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Main toggle function
  const handleClick = () => {
    if (isVoiceModeActive) {
      stopVoiceMode();
    } else {
      startVoiceMode();
    }
  };

  // Cleanup on unmount only (remove dependency to prevent interference)
  React.useEffect(() => {
    return () => {
      // Only cleanup when component actually unmounts, not on state changes
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []); // Empty dependency array - only run on mount/unmount

  // Helper functions for button styling
  const getButtonIcon = () => {
    if (isPlaying) {
      return <Volume2 className="h-4 w-4" />;
    } else if (isProcessing) {
      return <Square className="h-4 w-4 animate-pulse" />;
    } else if (isListening || isVoiceModeActive) {
      return <Radio className="h-4 w-4 animate-pulse" />;
    }
    return <Radio className="h-4 w-4" />;
  };

  const getButtonVariant = () => {
    if (isPlaying) {
      return actualTheme === 'dark' ? 'secondary' : 'outline';
    } else if (isProcessing) {
      return 'secondary';
    } else if (isListening || isVoiceModeActive) {
      return 'default';
    }
    return 'outline';
  };

  return (
    <Button
      variant={getButtonVariant()}
      size="icon"
      onClick={handleClick}
      disabled={isProcessing}
      className={`
        relative w-12 h-12 rounded-full overflow-hidden transition-all duration-300 ease-in-out transform-gpu
        ${isListening 
          ? 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30 scale-110 ring-4 ring-red-500/20 animate-pulse' 
          : isVoiceModeActive
            ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/30 scale-105 ring-2 ring-primary/30'
            : 'hover:scale-105 bg-background border-2 border-border hover:bg-accent hover:text-accent-foreground'
        }
        ${isProcessing 
          ? 'bg-gradient-to-br from-yellow-500 to-yellow-600 text-white animate-spin' 
          : ''
        }
        ${isPlaying 
          ? 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg shadow-green-500/30 scale-105' 
          : ''
        }
        focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
        before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-br before:from-white/20 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300
      `}
      title={
        isPlaying 
          ? 'AI is speaking... Click to stop' 
          : isProcessing 
            ? 'Processing your speech...' 
            : isListening 
              ? 'Listening... Speak now!'
              : isVoiceModeActive 
                ? 'Voice mode active - Click to stop' 
                : 'Start voice conversation'
      }
    >
      <div className="relative z-10 flex items-center justify-center">
        {getButtonIcon()}
        
        {/* Listening animation */}
        {isListening && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white/30 rounded-full animate-ping"></div>
            <div className="absolute w-6 h-6 border-2 border-white/50 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
          </div>
        )}
        
        {/* Speaking animation */}
        {isPlaying && (
          <div className="absolute -inset-1 flex items-center justify-center">
            <div className="w-10 h-10 border border-green-300/50 rounded-full animate-pulse"></div>
            <div className="absolute w-12 h-12 border border-green-300/30 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></div>
          </div>
        )}
        
        {/* Processing animation */}
        {isProcessing && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 bg-white rounded-full animate-bounce"></div>
          </div>
        )}
      </div>
      
      {/* Glowing effect when active */}
      {isVoiceModeActive && !isListening && !isPlaying && !isProcessing && (
        <div className="absolute inset-0 bg-primary/10 animate-pulse rounded-full"></div>
      )}
    </Button>
  );
};

export default VoiceModeButton;