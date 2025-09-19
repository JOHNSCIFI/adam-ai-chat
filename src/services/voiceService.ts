export interface VoiceServiceConfig {
  onTranscriptionUpdate: (text: string) => void;
  onResponse: (text: string) => void;
  onStateChange: (state: 'idle' | 'listening' | 'processing' | 'playing') => void;
  onError: (error: string) => void;
  chatId: string;
}

export class VoiceService {
  private config: VoiceServiceConfig;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private currentAudio: HTMLAudioElement | null = null;
  
  constructor(config: VoiceServiceConfig) {
    this.config = config;
  }

  async startRecording(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });
      
      // Use webm;codecs=opus for better compatibility
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus' 
        : 'audio/webm';
        
      this.mediaRecorder = new MediaRecorder(stream, { mimeType });
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(this.audioChunks, { type: mimeType });
        await this.processAudio(audioBlob);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      this.mediaRecorder.start(1000); // Collect data every 1000ms
      this.config.onStateChange('listening');
    } catch (error) {
      this.config.onError(`Microphone access denied: ${error}`);
    }
  }

  stopRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
      this.config.onStateChange('processing');
    }
  }

  private async processAudio(audioBlob: Blob): Promise<void> {
    try {
      // Create form data for speech-to-text
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      // Use Web Speech API as fallback if available
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        await this.processWithWebSpeechAPI(audioBlob);
      } else {
        await this.processWithServer(formData);
      }
    } catch (error) {
      this.config.onError(`Processing error: ${error}`);
      this.config.onStateChange('idle');
    }
  }

  private async processWithWebSpeechAPI(audioBlob: Blob): Promise<void> {
    // For Web Speech API, we still need to send to server for full processing
    // This is a fallback for transcription display while server processes
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    await this.processWithServer(formData);
  }

  private async processWithServer(formData: FormData): Promise<void> {
    try {
      // Import supabase client
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Speech to text
      const { data: transcriptionData, error: transcriptionError } = await supabase.functions.invoke('speech-to-text', {
        body: formData,
      });

      if (transcriptionError) throw new Error(transcriptionError.message);

      const transcription = transcriptionData.text;
      this.config.onTranscriptionUpdate(transcription);

      // Send to AI for response
      const { data: aiResponse, error: aiError } = await supabase.functions.invoke('chat-with-ai-optimized', {
        body: {
          message: transcription,
          chat_id: this.config.chatId,
          has_file_analysis: false,
          image_count: 0
        }
      });

      if (aiError) throw new Error(aiError.message);

      const responseText = aiResponse.response;
      this.config.onResponse(responseText);

      // Convert to speech
      const { data: speechData, error: speechError } = await supabase.functions.invoke('text-to-speech-voice-mode', {
        body: {
          text: responseText,
          voice: 'alloy'
        }
      });

      if (speechError) throw new Error(speechError.message);

      // Play audio
      await this.playAudio(speechData.audioContent);
      
    } catch (error) {
      this.config.onError(`Server processing error: ${error}`);
    }
  }

  private async playAudio(base64Audio: string): Promise<void> {
    try {
      this.config.onStateChange('playing');
      
      // Convert base64 to blob
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const audioBlob = new Blob([bytes], { type: 'audio/mp3' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      this.currentAudio = new Audio(audioUrl);
      
      this.currentAudio.onended = () => {
        this.config.onStateChange('idle');
        URL.revokeObjectURL(audioUrl);
      };
      
      this.currentAudio.onerror = () => {
        this.config.onError('Audio playback failed');
        this.config.onStateChange('idle');
        URL.revokeObjectURL(audioUrl);
      };
      
      await this.currentAudio.play();
      
    } catch (error) {
      this.config.onError(`Audio playback error: ${error}`);
      this.config.onStateChange('idle');
    }
  }

  stopPlayback(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.config.onStateChange('idle');
    }
  }

  cleanup(): void {
    this.stopRecording();
    this.stopPlayback();
  }
}