import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useMessageLimit } from '@/hooks/useMessageLimit';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';

interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

export default function Index() {
  const { user, loading: authLoading } = useAuth();
  const { canSendMessage, isAtLimit } = useMessageLimit();
  const [message, setMessage] = useState('');

  if (authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user && !canSendMessage) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold mb-2">Welcome to AI Chat</CardTitle>
          <p className="text-muted-foreground">
            Start a conversation with AI or explore our tools
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask me anything..."
            className="min-h-24 resize-none"
          />
          <div className="flex gap-2">
            <Button className="flex-1" disabled={!canSendMessage}>
              Start New Chat
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/explore-tools'}>
              Explore Tools
            </Button>
          </div>
          {isAtLimit && (
            <p className="text-center text-sm text-muted-foreground">
              Message limit reached.{' '}
              <Button variant="link" className="p-0 h-auto" onClick={() => window.location.href = '/pricing-plans'}>
                Upgrade to continue
              </Button>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

  // Image styles for create image functionality
  const imageStyles = [
    {
      name: 'Cyberpunk',
      prompt: 'Create an image in a cyberpunk aesthetic: vivid neon accents, futuristic textures, glowing details, and high-contrast lighting.',
    },
    {
      name: 'Anime',
      prompt: 'Create an image in a detailed anime aesthetic: expressive eyes, smooth cel-shaded coloring, and clean linework. Emphasize emotion and character presence, with a sense of motion or atmosphere typical of anime scenes.',
    },
    {
      name: 'Dramatic Headshot',
      prompt: 'Create an ultra-realistic high-contrast black-and-white headshot, close up, black shadow background, 35mm lens, 4K quality, aspect ratio 4:3.',
    },
    {
      name: 'Coloring Book',
      prompt: 'Create an image in a children\'s coloring book style: bold, even black outlines on white, no shading or tone. Simplify textures into playful, easily recognizable shapes.',
    },
    {
      name: 'Photo Shoot',
      prompt: 'Create an ultra-realistic professional photo shoot with soft lighting.',
    },
    {
      name: 'Retro Cartoon',
      prompt: 'Create a retro 1950s cartoon style image, minimal vector art, Art Deco inspired, clean flat colors, geometric shapes, mid-century modern design, elegant silhouettes, UPA style animation, smooth lines, limited color palette (black, red, beige, brown, white), grainy paper texture background, vintage jazz club atmosphere, subtle lighting, slightly exaggerated character proportions, classy and stylish mood.',
    },
    {
      name: '80s Glam',
      prompt: 'Create a selfie styled like a cheesy 1980s mall glamour shot, foggy soft lighting, teal and magenta lasers in the background, feathered hair, shoulder pads, portrait studio vibes, ironic \'glam 4 life\' caption.',
    },
    {
      name: 'Art Nouveau',
      prompt: 'Create an image in an Art Nouveau style: flowing lines, organic shapes, floral motifs, and soft, decorative elegance.',
    },
    {
      name: 'Synthwave',
      prompt: 'Create an image in a synthwave aesthetic: retro-futuristic 1980s vibe with neon grids, glowing sunset, vibrant magenta-and-cyan gradients, chrome highlights, and a nostalgic outrun atmosphere.',
    },
  ];

  if (authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // File size limits based on ChatGPT recommendations
  const getMaxFileSize = (type: string) => {
    if (type.startsWith('image/')) return 10 * 1024 * 1024; // 10MB for images
    if (type.startsWith('video/')) return 100 * 1024 * 1024; // 100MB for videos
    if (type.startsWith('audio/')) return 50 * 1024 * 1024; // 50MB for audio
    if (type.includes('pdf') || type.includes('document') || type.includes('text')) return 25 * 1024 * 1024; // 25MB for documents
    return 20 * 1024 * 1024; // 20MB for other files
  };

  const getFileTypeCategory = (type: string) => {
    if (type.startsWith('image/')) return 'image';
    if (type.startsWith('video/')) return 'video';
    if (type.startsWith('audio/')) return 'audio';
    if (type.includes('pdf') || type.includes('document') || type.includes('text')) return 'document';
    return 'file';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
    if (type.includes('pdf')) return <FileText className="h-4 w-4 text-red-500" />;
    if (type.includes('document') || type.includes('word')) return <FileText className="h-4 w-4 text-blue-500" />;
    if (type.startsWith('audio/')) return <FileText className="h-4 w-4 text-green-500" />;
    if (type.startsWith('video/')) return <FileText className="h-4 w-4 text-purple-500" />;
    return <FileText className="h-4 w-4" />;
  };

  const isImageFile = (type: string) => type.startsWith('image/');

  const handleFileUpload = () => {
    fileInputRef.current?.click();
    setIsPopoverOpen(false);
  };

  const handleCreateImageClick = () => {
    setIsImageMode(true);
    setIsPopoverOpen(false);
    setMessage('');
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  const handleExitImageMode = () => {
    setIsImageMode(false);
    setSelectedStyle(null);
    setMessage('');
  };

  const handleStyleSelect = (style: typeof imageStyles[0]) => {
    setMessage(style.prompt);
    setSelectedStyle(style.name);
    setIsStylesOpen(false);
    
    // Focus the textarea after setting the style
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  const getStyleBackground = (styleName: string) => {
    switch (styleName) {
      case 'Cyberpunk':
        return 'bg-gradient-to-br from-cyan-500/30 to-purple-600/40 border border-cyan-400/20';
      case 'Anime':
        return 'bg-gradient-to-br from-pink-400/30 to-orange-400/30 border border-pink-300/20';
      case 'Dramatic Headshot':
        return 'bg-gradient-to-br from-gray-600/40 to-black/60 border border-gray-500/20';
      case 'Coloring Book':
        return 'bg-white border border-black/40';
      case 'Photo Shoot':
        return 'bg-gradient-to-br from-blue-400/20 to-purple-400/30 border border-blue-300/20';
      case 'Retro Cartoon':
        return 'bg-gradient-to-br from-red-400/30 to-yellow-400/30 border border-red-300/20';
      case '80s Glam':
        return 'bg-gradient-to-br from-magenta-500/30 to-cyan-400/30 border border-magenta-400/20';
      case 'Art Nouveau':
        return 'bg-gradient-to-br from-green-400/30 to-teal-400/30 border border-green-300/20';
      case 'Synthwave':
        return 'bg-gradient-to-br from-purple-600/40 to-pink-500/40 border border-purple-400/20';
      default:
        return 'bg-muted border border-border/40';
    }
  };

  const startRecording = async () => {
    try {
      console.log('🎤 Starting speech recognition...');
      
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        toast({
          title: "Speech recognition not supported",
          description: "Your browser doesn't support speech recognition.",
          variant: "destructive",
        });
        return;
      }

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        console.log('🎤 Speech recognition started successfully');
        setIsRecording(true);
      };

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0])
          .map((result) => result.transcript)
          .join('');

        if (event.results[0].isFinal) {
          console.log('📝 Final transcript:', transcript);
          setMessage(prev => prev + (prev ? ' ' : '') + transcript);
          setIsRecording(false);
        }
      };

      recognition.onerror = (event) => {
        console.error('❌ Speech recognition error:', event.error);
        setIsRecording(false);
        toast({
          title: "Speech recognition failed",
          description: "Please try again.",
          variant: "destructive",
        });
      };

      recognition.onend = () => {
        setIsRecording(false);
        setMediaRecorder(null);
      };

      setMediaRecorder(recognition as any);
      recognition.start();
      
    } catch (error) {
      console.error('❌ Failed to start speech recognition:', error);
      setIsRecording(false);
      toast({
        title: "Failed to start speech recognition",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      console.log('🔴 Calling stop on recognition instance');
      (mediaRecorder as any).stop();
      setMediaRecorder(null);
      setIsRecording(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const totalSize = Array.from(files).reduce((sum, file) => sum + file.size, 0);
      const maxTotalSize = 100 * 1024 * 1024; // 100MB total per message
      
      if (totalSize > maxTotalSize) {
        toast({
          title: "Total file size too large",
          description: `Total file size cannot exceed ${formatFileSize(maxTotalSize)} per message.`,
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFiles(prev => [...prev, ...Array.from(files)]);
      // Reset the input
      event.target.value = '';
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleNewChat = async (initialMessage: string, files: File[] = []) => {
    if (loading) return;
    setLoading(true);
    
    try {
      console.log('Creating new chat with message:', initialMessage);
      // Create the chat first with default title
      const { data: chatData, error: chatError } = await supabase
        .from('chats')
        .insert([{
          user_id: user.id,
          title: 'New Chat'
        }])
        .select()
        .single();

      if (chatError || !chatData) throw chatError;
      console.log('Chat created:', chatData);

      // Upload files to Supabase storage if any
      const uploadedFiles: FileAttachment[] = [];
      
      for (const file of files) {
        // Check file size limits
        const maxSize = getMaxFileSize(file.type);
        if (file.size > maxSize) {
          toast({
            title: "File too large",
            description: `${file.name} exceeds the ${formatFileSize(maxSize)} limit for ${getFileTypeCategory(file.type)} files.`,
            variant: "destructive",
          });
          continue;
        }

        const fileExtension = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('chat-files')
          .upload(fileName, file);

        if (uploadError) {
          console.error('File upload error:', uploadError);
          toast({
            title: "Upload failed",
            description: `Failed to upload ${file.name}`,
            variant: "destructive",
          });
          continue;
        }

        // Get public URL for the uploaded file
        const { data: urlData } = supabase.storage
          .from('chat-files')
          .getPublicUrl(fileName);

        console.log('File uploaded successfully:', {
          fileName,
          originalName: file.name,
          publicUrl: urlData.publicUrl
        });

        uploadedFiles.push({
          id: uploadData.id || Date.now().toString(),
          name: file.name,
          size: file.size,
          type: file.type,
          url: urlData.publicUrl
        });
      }

      // Add initial message to the chat if provided
      if (initialMessage.trim() || uploadedFiles.length > 0) {
        console.log('Adding initial message to chat');
        console.log('Upload files before saving to DB:', uploadedFiles);
        const { error: messageError } = await supabase
          .from('messages')
          .insert({
            chat_id: chatData.id,
            content: initialMessage,
            role: 'user',
            file_attachments: uploadedFiles as any
          });

        if (messageError) throw messageError;
        console.log('Initial message added');

        // Handle files vs text-only messages differently
        if (files.length > 0) {
          // Send files directly to webhook in base64 format
          try {
            const webhookUrl = 'https://adsgbt.app.n8n.cloud/webhook/adamGPT';
            
            // Convert first file to base64 for webhook
            const file = files[0]; // Handle first file for now
            const base64Data = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = () => {
                const result = reader.result as string;
                // Remove data URL prefix to get pure base64
                const base64 = result.split(',')[1];
                resolve(base64);
              };
              reader.readAsDataURL(file);
            });

            const response = await fetch(webhookUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                message: initialMessage,
                chatId: chatData.id,
                userId: user.id,
                type: file.type.split('/')[1] || 'file',
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
                fileData: base64Data
              })
            });

            if (response.ok) {
              const webhookData = await response.json();
              console.log('Webhook response:', webhookData);
              
              // Parse webhook response using same logic as Chat component
              let responseContent = '';
              if (Array.isArray(webhookData) && webhookData.length > 0) {
                const analysisTexts = webhookData.map(item => item.text || item.content || '').filter(text => text);
                if (analysisTexts.length > 0) {
                  responseContent = analysisTexts.join('\n\n');
                } else {
                  responseContent = 'File analyzed successfully';
                }
              } else if (webhookData.text) {
                responseContent = webhookData.text;
              } else if (webhookData.analysis || webhookData.content) {
                responseContent = webhookData.analysis || webhookData.content;
              } else if (webhookData.response || webhookData.message) {
                responseContent = webhookData.response || webhookData.message;
              } else {
                responseContent = 'File processed successfully';
              }
              
              // Save actual webhook response as AI message
              await supabase
                .from('messages')
                .insert({
                  chat_id: chatData.id,
                  content: responseContent,
                  role: 'assistant'
                });
            }
          } catch (webhookError) {
            console.error('Webhook error:', webhookError);
            // Add fallback message
            await supabase
              .from('messages')
              .insert({
                chat_id: chatData.id,
                content: 'I received your file but encountered an error processing it. Please try again.',
                role: 'assistant'
              });
          }
        } else {
          // Send text-only message to OpenAI via existing chat function
          try {
            const { data, error } = await supabase.functions.invoke('chat-with-ai-optimized', {
              body: {
                message: initialMessage,
                chatId: chatData.id,
                userId: user.id
              }
            });

            if (!error && data?.response) {
              // Save OpenAI response
              await supabase
                .from('messages')
                .insert({
                  chat_id: chatData.id,
                  content: data.response,
                  role: 'assistant'
                });
            }
          } catch (aiError) {
            console.error('AI response error:', aiError);
            // Add fallback message
            await supabase
              .from('messages')
              .insert({
                chat_id: chatData.id,
                content: 'I apologize, but I encountered an error processing your message. Please try again.',
                role: 'assistant'
              });
          }
        }
      }

      // Navigate to the new chat immediately for smooth experience
      // The chat page will handle getting the AI response automatically
      navigate(`/chat/${chatData.id}`);
      
      // Force sidebar update after a short delay to ensure the new chat appears
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('force-chat-refresh'));
      }, 100);

    } catch (error: any) {
      console.error('Create chat error:', error);
      toast({
        title: "Error creating chat",
        description: "Unable to create new chat. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() || selectedFiles.length > 0) {
      handleNewChat(message.trim(), selectedFiles);
      setMessage('');
      setSelectedFiles([]);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Header - clean like ChatGPT */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background">
        <div className="text-xl font-semibold text-foreground">AdamGPT</div>
        <div className="flex items-center space-x-4">
          
        </div>
      </div>

      {/* Main Content - centered from all sides */}
      <div className="flex-1 flex flex-col items-center justify-center px-6" style={{ paddingTop: '30vh' }}>
        <div className="w-full max-w-3xl text-center">
          {/* Welcome Message */}
          <h1 className="text-3xl font-normal text-foreground mb-12">
            How can I help, {userProfile?.display_name || user?.email?.split('@')[0] || 'there'}?
          </h1>
          
          {/* File attachments preview */}
          {selectedFiles.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 text-sm">
                  {getFileIcon(file.type)}
                  <span className="truncate max-w-32">{file.name}</span>
                  <button 
                    onClick={() => removeFile(index)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Image mode indicator */}
          {isImageMode && (
            <div className="mb-4 flex items-center gap-2 flex-wrap animate-fade-in">
              <div className="group flex items-center gap-1 bg-muted px-2 py-1 rounded-md text-xs">
                <ImageIcon2 className="h-3 w-3" />
                <span>Image</span>
                <button 
                  onClick={handleExitImageMode}
                  className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              
              {/* Styles dropdown */}
              <Popover open={isStylesOpen} onOpenChange={setIsStylesOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs gap-1 bg-muted hover:bg-muted/80"
                  >
                    <Palette className="h-3 w-3" />
                    Styles
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4 bg-background border shadow-lg" align="start">
                  <div className="grid grid-cols-3 gap-3">
                    {imageStyles.map((style) => (
                      <button
                        key={style.name}
                        onClick={() => handleStyleSelect(style)}
                        className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors text-center"
                      >
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getStyleBackground(style.name)}`}>
                          <span className={`text-xs font-medium ${style.name === 'Coloring Book' ? 'text-black' : 'text-foreground'}`}>
                            {style.name.split(' ').map(word => word[0]).join('').slice(0, 2)}
                          </span>
                        </div>
                        <span className="text-xs font-medium leading-tight">{style.name}</span>
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          )}
          
          <div className="relative">
            <div className={`flex-1 flex items-center border rounded-3xl px-4 py-3 ${actualTheme === 'light' ? 'bg-white border-gray-200' : 'bg-[hsl(var(--input))] border-border'}`}>
              {/* Attachment button - left side inside input */}
              <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-muted/20 rounded-full flex-shrink-0 mr-2"
                  >
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-2 bg-background border shadow-lg" align="start">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2"
                    onClick={handleFileUpload}
                  >
                    <Paperclip className="h-4 w-4" />
                    Add photos & files
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2"
                    onClick={handleCreateImageClick}
                  >
                    <ImageIcon2 className="h-4 w-4" />
                    Create image
                  </Button>
                </PopoverContent>
              </Popover>
              
              <Textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  // Auto-resize textarea
                  if (textareaRef.current) {
                    textareaRef.current.style.height = 'auto';
                    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder={isImageMode ? "Describe an image" : "Ask anything..."}
                className="flex-1 min-h-[24px] max-h-[200px] border-0 resize-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0 py-0 text-foreground placeholder:text-muted-foreground break-words text-left"
                style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
                disabled={loading}
                rows={1}
              />
              
              <div className="flex items-center gap-1 ml-2 pb-1">
                {/* Dictation button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={`h-8 w-8 p-0 hover:bg-muted/20 rounded-full flex-shrink-0 ${isRecording ? 'text-red-500' : 'text-muted-foreground'}`}
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={loading}
                >
                  {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
                
                {/* Send button - always visible */}
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={(!message.trim() && selectedFiles.length === 0) || loading}
                  size="sm"
                  className="h-8 w-8 p-0 rounded-full flex-shrink-0"
                  style={{ 
                    backgroundColor: (message.trim() || selectedFiles.length > 0) && !loading
                      ? (actualTheme === 'light' ? 'hsl(var(--user-message-bg))' : 'hsl(var(--primary))')
                      : 'hsl(var(--muted))',
                    color: (message.trim() || selectedFiles.length > 0) && !loading
                      ? (actualTheme === 'light' ? 'hsl(var(--foreground))' : 'hsl(var(--primary-foreground))')
                      : 'hsl(var(--muted-foreground))'
                  }}
                >
                  {loading ? <StopIcon className="h-4 w-4" /> : <SendHorizontalIcon className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground text-center mt-2">
            AdamGPT can make mistakes. Check important info.
          </p>
        </div>
      </div>

      {/* Input Area moved to center - keep this div for proper structure */}
      <div className="hidden">
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.csv,.json,.xml,.py,.js,.html,.css,.md"
      />
    </div>
  );
}