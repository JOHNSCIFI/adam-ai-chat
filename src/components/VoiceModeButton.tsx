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
          
          // Restart listening for next input
          if (isVoiceModeActive) {
            setTimeout(() => {
              if (isVoiceModeActive && !isProcessing && !isPlaying) {
                recognition.start();
              }
            }, 1000);
          }
        }
      };
      
      recognition.onerror = (event: any) => {
        console.error('❌ Speech recognition error:', event.error);
        setIsListening(false);
        
        // Restart on certain errors
        if (event.error === 'no-speech' || event.error === 'aborted') {
          setTimeout(() => {
            if (isVoiceModeActive && !isProcessing && !isPlaying) {
              recognition.start();
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

  const speakText = (text: string) => {
    console.log('🔊 Speaking text:', text);
    setIsPlaying(true);
    
    if (window.speechSynthesis) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      synthesisRef.current = utterance;
      
      // Configure voice settings
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      // Wait for voices to load if not already loaded
      const setVoiceAndSpeak = () => {
        const voices = window.speechSynthesis.getVoices();
        console.log('Available voices:', voices.map(v => v.name));
        
        // Try to find a natural-sounding voice
        const preferredVoice = voices.find(voice => 
          voice.name.includes('Samantha') || 
          voice.name.includes('Alex') || 
          voice.name.includes('Karen') ||
          voice.name.includes('Google') ||
          (voice.lang.startsWith('en') && voice.localService)
        );
        
        if (preferredVoice) {
          utterance.voice = preferredVoice;
          console.log('Using voice:', preferredVoice.name);
        }
        
        window.speechSynthesis.speak(utterance);
      };
      
      utterance.onend = () => {
        console.log('✅ Speech synthesis finished');
        setIsPlaying(false);
        
        // Resume listening for next input
        if (isVoiceModeActive && recognitionRef.current) {
          setTimeout(() => {
            if (isVoiceModeActive && !isProcessing) {
              console.log('🎤 Restarting recognition for next input...');
              recognitionRef.current.start();
            }
          }, 500);
        }
      };
      
      utterance.onerror = (error) => {
        console.error('❌ Speech synthesis error:', error);
        setIsPlaying(false);
        
        // Resume listening even if TTS failed
        if (isVoiceModeActive && recognitionRef.current) {
          setTimeout(() => {
            if (isVoiceModeActive && !isProcessing) {
              recognitionRef.current.start();
            }
          }, 500);
        }
      };
      
      // Handle voice loading
      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.addEventListener('voiceschanged', setVoiceAndSpeak, { once: true });
      } else {
        setVoiceAndSpeak();
      }
    } else {
      console.error('❌ Speech synthesis not supported');
      setIsPlaying(false);
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

      // Get AI response with correct parameters
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

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (isVoiceModeActive) {
        stopVoiceMode();
      }
    };
  }, [isVoiceModeActive]);

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
      size="sm"
      onClick={handleClick}
      disabled={isProcessing}
      className={`
        relative transition-all duration-200 min-w-[40px] h-[40px]
        ${isListening || isVoiceModeActive 
          ? 'bg-primary text-primary-foreground hover:bg-primary/90 border-primary shadow-lg scale-105' 
          : 'hover:scale-105'
        }
        ${isProcessing 
          ? 'opacity-70 cursor-not-allowed' 
          : 'hover:shadow-md'
        }
        ${isPlaying 
          ? 'animate-pulse bg-secondary text-secondary-foreground' 
          : ''
        }
      `}
      title={
        isPlaying 
          ? 'AI is speaking...' 
          : isProcessing 
            ? 'Processing speech...' 
            : isListening || isVoiceModeActive 
              ? 'Voice mode active - Click to stop' 
              : 'Click to start voice mode'
      }
    >
      {getButtonIcon()}
      {(isListening || isVoiceModeActive) && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
      )}
    </Button>
  );
};

export default VoiceModeButton;