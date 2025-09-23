import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useMessageLimit } from '@/hooks/useMessageLimit';
import { supabase } from '@/integrations/supabase/client';
import { Paperclip, Send, ArrowLeft, ImageIcon, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface ToolInfo {
  id: string;
  name: string;
  description: string;
  instructions: string;
  icon: React.ReactNode;
  allowImages?: boolean;
  allowFiles?: boolean;
}

const toolConfigs: Record<string, ToolInfo> = {
  'calculate-calories': {
    id: 'calculate-calories',
    name: 'Calculate Calories',
    description: 'Upload food images to get nutritional information and calorie counts',
    instructions: 'Upload an image of your meal and I\'ll analyze its nutritional content and estimate the calories for you.',
    icon: <span className="text-2xl">🥗</span>,
    allowImages: true,
    allowFiles: false
  },
  'openai-gpt-4o': {
    id: 'openai-gpt-4o',
    name: 'OpenAI GPT-4o',
    description: 'Access to OpenAI\'s powerful GPT-4o model for complex tasks',
    instructions: 'I\'m GPT-4o, OpenAI\'s advanced AI model. Ask me anything - I can help with complex reasoning, analysis, creative writing, coding, and more.',
    icon: <span className="text-2xl">🤖</span>,
    allowImages: true,
    allowFiles: true
  },
  'deepseek': {
    id: 'deepseek',
    name: 'DeepSeek',
    description: 'Advanced AI model great for most questions and tasks',
    instructions: 'I\'m DeepSeek, an advanced AI model. I excel at reasoning, analysis, and providing detailed responses to your questions.',
    icon: <span className="text-2xl">🧠</span>,
    allowImages: true,
    allowFiles: true
  },
  'google-gemini': {
    id: 'google-gemini',
    name: 'Google Gemini',
    description: 'Google\'s most capable AI for a wide range of tasks',
    instructions: 'I\'m Google Gemini, designed to handle a wide range of tasks including text generation, analysis, and multimodal understanding.',
    icon: <span className="text-2xl">✨</span>,
    allowImages: true,
    allowFiles: true
  },
  'generate-image-openai': {
    id: 'generate-image-openai',
    name: 'Generate Image with OpenAI',
    description: 'Create stunning images from text using OpenAI\'s image generation',
    instructions: 'Describe the image you want to create in detail, and I\'ll generate it for you using OpenAI\'s advanced image generation technology.',
    icon: <span className="text-2xl">🎨</span>,
    allowImages: false,
    allowFiles: false
  },
  'analyse-image-openai': {
    id: 'analyse-image-openai',
    name: 'Analyse Image with OpenAI',
    description: 'Get detailed analysis and insights from your images',
    instructions: 'Upload an image and I\'ll provide detailed analysis, describe what I see, extract text, or answer questions about it.',
    icon: <span className="text-2xl">🔍</span>,
    allowImages: true,
    allowFiles: false
  }
};

export default function ToolPage() {
  const { toolName, toolId } = useParams<{ toolName: string; toolId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { canSendMessage, isAtLimit, incrementMessageCount, sessionId } = useMessageLimit();
  
  const [message, setMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const toolConfig = toolName ? toolConfigs[toolName] : null;

  if (!toolConfig) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Tool Not Found</h1>
          <p className="text-muted-foreground mb-4">The requested tool could not be found.</p>
          <Button onClick={() => navigate('/explore-tools')}>
            Back to Explore Tools
          </Button>
        </div>
      </div>
    );
  }

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      // For images only tools, filter to images
      if (!toolConfig.allowFiles && toolConfig.allowImages) {
        const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
        setSelectedFiles(prev => [...prev, ...imageFiles]);
      } else {
        setSelectedFiles(prev => [...prev, ...Array.from(files)]);
      }
      event.target.value = '';
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if ((!message.trim() && selectedFiles.length === 0) || loading) return;

    if (!canSendMessage) {
      navigate('/pricing-plans');
      return;
    }

    setLoading(true);
    
    const userMessage = { 
      role: 'user' as const, 
      content: message, 
      timestamp: new Date() 
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      // Save message to database
      if (user) {
        // For authenticated users, save to tool_sessions and messages
        // First create/update tool session
        const { data: sessionData, error: sessionError } = await supabase
          .from('tool_sessions')
          .upsert({
            user_id: user.id,
            tool_name: toolConfig.name,
            tool_id: toolId!,
            title: message.slice(0, 50) || toolConfig.name
          })
          .select()
          .single();

        if (sessionError) {
          console.error('Error saving tool session:', sessionError);
        }
      } else if (sessionId) {
        // For anonymous users, save to anonymous_messages
        await supabase
          .from('anonymous_messages')
          .insert({
            session_id: sessionId,
            content: message,
            role: 'user'
          });
      }

      incrementMessageCount();

      // Simulate webhook call
      const webhookUrl = 'https://adsgbt.app.n8n.cloud/webhook/adamGPT';
      
      let webhookBody: any = {
        message: `${toolConfig.instructions}\n\nUser: ${message}`,
        chatId: toolId,
        userId: user?.id || sessionId,
        toolName: toolConfig.name,
        toolId: toolConfig.id
      };

      // Handle file upload for tools that support it
      if (selectedFiles.length > 0 && (toolConfig.allowImages || toolConfig.allowFiles)) {
        const file = selectedFiles[0];
        const base64Data = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(',')[1];
            resolve(base64);
          };
          reader.readAsDataURL(file);
        });

        webhookBody = {
          ...webhookBody,
          type: file.type.split('/')[1] || 'file',
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          fileData: base64Data
        };
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookBody)
      });

      let responseContent = `I'm ${toolConfig.name}. I received your message and I'm ready to help!`;
      
      if (response.ok) {
        const webhookData = await response.json();
        if (Array.isArray(webhookData) && webhookData.length > 0) {
          const analysisTexts = webhookData.map(item => item.text || item.content || '').filter(text => text);
          if (analysisTexts.length > 0) {
            responseContent = analysisTexts.join('\n\n');
          }
        } else if (webhookData.text || webhookData.content || webhookData.response) {
          responseContent = webhookData.text || webhookData.content || webhookData.response;
        }
      }

      const assistantMessage = { 
        role: 'assistant' as const, 
        content: responseContent, 
        timestamp: new Date() 
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Save assistant response
      if (user) {
        // Save to messages table (you might need to create this relationship)
      } else if (sessionId) {
        await supabase
          .from('anonymous_messages')
          .insert({
            session_id: sessionId,
            content: responseContent,
            role: 'assistant'
          });
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setMessage('');
      setSelectedFiles([]);
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/explore-tools')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              {toolConfig.icon}
            </div>
            <div>
              <h1 className="text-lg font-semibold">{toolConfig.name}</h1>
              <p className="text-sm text-muted-foreground">{toolConfig.description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-4 rounded-lg bg-primary/10 w-fit">
                {toolConfig.icon}
              </div>
              <CardTitle>{toolConfig.name}</CardTitle>
              <CardDescription>{toolConfig.instructions}</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] p-4 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <div className="whitespace-pre-wrap break-words">
                    {msg.content}
                  </div>
                  <div className="text-xs opacity-70 mt-2">
                    {msg.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t bg-background p-4">
        <div className="max-w-4xl mx-auto">
          {/* File Attachments */}
          {selectedFiles.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-2 bg-muted p-2 rounded-lg text-sm">
                  {file.type.startsWith('image/') ? (
                    <ImageIcon className="h-4 w-4" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                  <span className="truncate max-w-32">{file.name}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeFile(index)}
                    className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            {(toolConfig.allowImages || toolConfig.allowFiles) && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleFileUpload}
                  className="px-3"
                  disabled={loading}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  multiple
                  accept={toolConfig.allowImages && !toolConfig.allowFiles ? "image/*" : "*"}
                />
              </>
            )}
            
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Ask ${toolConfig.name} anything...`}
              className="min-h-12 resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
            
            <Button
              onClick={handleSubmit}
              disabled={(!message.trim() && selectedFiles.length === 0) || loading || !canSendMessage}
              className="px-4"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          {isAtLimit && (
            <div className="mt-2 text-center">
              <p className="text-sm text-muted-foreground">
                You've reached your free message limit.{' '}
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-primary"
                  onClick={() => navigate('/pricing-plans')}
                >
                  Upgrade to continue
                </Button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}