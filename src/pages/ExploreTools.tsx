import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import AuthModal from '@/components/AuthModal';

import { 
  Bot, 
  ImageIcon, 
  Search, 
  Calculator, 
  Palette, 
  Zap, 
  Combine, 
  Edit3,
  FileImage,
  FileText,
  Sparkles,
  Brain,
  Globe,
  Code
} from 'lucide-react';
import { toast } from 'sonner';
import chatgptLogo from '@/assets/chatgpt-logo.png';
import chatgptLogoLight from '@/assets/chatgpt-logo-light.png';
import geminiLogo from '@/assets/gemini-logo.png';
import claudeLogo from '@/assets/claude-logo.png';
import deepseekLogo from '@/assets/deepseek-logo.png';
import grokLogo from '@/assets/grok-logo.png';

interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  isNew?: boolean;
  route: string;
}

const tools: Tool[] = [
  {
    id: 'calculate-calories',
    name: 'Calculate Calories',
    description: 'Upload food images to get nutritional information and calorie counts',
    category: 'Popular',
    icon: <Calculator className="h-5 w-5" />,
    route: '/calculate-calories'
  },
  {
    id: 'openai-gpt-4o',
    name: 'OpenAI GPT-4o',
    description: 'Access to OpenAI\'s powerful GPT-4o model for complex tasks',
    category: 'AI Models',
    icon: <Bot className="h-5 w-5" />,
    route: '/openai-gpt-4o'
  },
  {
    id: 'openai-gpt-4-1',
    name: 'OpenAI GPT-4.1',
    description: 'The flagship GPT-4 model for reliable and accurate responses',
    category: 'AI Models',
    icon: <Bot className="h-5 w-5" />,
    route: '/openai-gpt-4-1'
  },
  {
    id: 'deepseek-v31-terminus',
    name: 'DeepSeek-V3.1 Terminus',
    description: 'Advanced AI model great for most questions and tasks',
    category: 'AI Models',
    icon: <Brain className="h-5 w-5" />,
    isNew: true,
    route: '/deepseek-v31-terminus'
  },
  {
    id: 'deepseek-r1',
    name: 'DeepSeek R1',
    description: 'Latest DeepSeek model with enhanced reasoning capabilities',
    category: 'AI Models',
    icon: <Brain className="h-5 w-5" />,
    isNew: true,
    route: '/deepseek-r1'
  },
  {
    id: 'openai-gpt-4o-mini',
    name: 'OpenAI GPT-4o-mini',
    description: 'Fast and efficient OpenAI model for everyday tasks',
    category: 'AI Models',
    icon: <Bot className="h-5 w-5" />,
    route: '/openai-gpt-4o-mini'
  },
  {
    id: 'openai-gpt-5',
    name: 'OpenAI GPT-5',
    description: 'OpenAI\'s most advanced and powerful AI model',
    category: 'AI Models',
    icon: <Bot className="h-5 w-5" />,
    isNew: true,
    route: '/openai-gpt-5'
  },
  {
    id: 'claude-opus-4',
    name: 'Claude Opus 4',
    description: 'Anthropic\'s most capable and intelligent AI model',
    category: 'AI Models',
    icon: <Brain className="h-5 w-5" />,
    isNew: true,
    route: '/claude-opus-4'
  },
  {
    id: 'claude-sonnet-4',
    name: 'Claude Sonnet 4',
    description: 'High-performance Claude model with exceptional reasoning',
    category: 'AI Models',
    icon: <Brain className="h-5 w-5" />,
    isNew: true,
    route: '/claude-sonnet-4'
  },
  {
    id: 'gemini-2-5-flash',
    name: 'Gemini 2.5 Flash',
    description: 'Google\'s latest and most capable AI for a wide range of tasks',
    category: 'AI Models',
    icon: <Sparkles className="h-5 w-5" />,
    isNew: true,
    route: '/gemini-2-5-flash'
  },
  {
    id: 'grok-4',
    name: 'Grok-4',
    description: 'Advanced AI model for tackling intricate challenges',
    category: 'AI Models',
    icon: <Zap className="h-5 w-5" />,
    route: '/grok-4'
  },
  {
    id: 'generate-image-openai',
    name: 'Generate Image with OpenAI',
    description: 'Create stunning images from text using OpenAI\'s image generation',
    category: 'Popular',
    icon: <ImageIcon className="h-5 w-5" />,
    route: '/generate-image-openai'
  },
  {
    id: 'generate-image-nanobanana',
    name: 'Generate Image with NanoBanana',
    description: 'Create images using advanced NanoBanana AI technology',
    category: 'Image Generation',
    icon: <Palette className="h-5 w-5" />,
    isNew: true,
    route: '/generate-image-nanobanana'
  },
  {
    id: 'combine-images-openai',
    name: 'Combine Images with OpenAI',
    description: 'Merge and blend multiple images together using AI',
    category: 'Image Generation',
    icon: <Combine className="h-5 w-5" />,
    route: '/combine-images-openai'
  },
  {
    id: 'combine-images-nanobanana',
    name: 'Combine Images with NanoBanana',
    description: 'Advanced image combination with NanoBanana technology',
    category: 'Image Generation',
    icon: <Combine className="h-5 w-5" />,
    isNew: true,
    route: '/combine-images-nanobanana'
  },
  {
    id: 'edit-image-openai',
    name: 'Edit Image with OpenAI',
    description: 'Professional image editing powered by OpenAI',
    category: 'Image Generation',
    icon: <Edit3 className="h-5 w-5" />,
    route: '/edit-image-openai'
  },
  {
    id: 'edit-image-nanobanana',
    name: 'Edit Image with NanoBanana',
    description: 'Professional image editing powered by AI',
    category: 'Image Generation',
    icon: <Edit3 className="h-5 w-5" />,
    isNew: true,
    route: '/edit-image-nanobanana'
  },
  {
    id: 'analyse-image-openai',
    name: 'Analyse Image with OpenAI',
    description: 'Get detailed analysis and insights from your images',
    category: 'Popular',
    icon: <FileImage className="h-5 w-5" />,
    route: '/analyse-image-openai'
  },
  {
    id: 'analyse-files-openai',
    name: 'Analyse Files with OpenAI',
    description: 'Extract insights and information from various file types',
    category: 'Popular',
    icon: <FileText className="h-5 w-5" />,
    route: '/analyse-files-openai'
  },
  {
    id: 'ai-search-engine',
    name: 'AI Search Engine',
    description: 'Advanced web search powered by artificial intelligence',
    category: 'Popular',
    icon: <Search className="h-5 w-5" />,
    route: '/ai-search-engine'
  }
];

const categories = ['Popular', 'AI Models', 'Writing', 'Education', 'Lifestyle', 'Programming', 'Image Generation'];

export default function ExploreTools() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { actualTheme } = useTheme();
  const { isMobile } = useSidebar();
  const [selectedCategory, setSelectedCategory] = useState('Popular');
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  // Choose the appropriate ChatGPT logo based on theme
  const chatgptLogoSrc = actualTheme === 'dark' ? chatgptLogo : chatgptLogoLight;
  
  // Helper function to get model icon
  const getModelIcon = (toolId: string) => {
    if (toolId.includes('openai') || toolId.includes('gpt')) {
      return <img src={chatgptLogoSrc} alt="OpenAI" className="w-4 h-4 sm:w-5 sm:h-5 object-contain" />;
    } else if (toolId.includes('gemini') || toolId.includes('nanobanana')) {
      return <img src={geminiLogo} alt="Google Gemini" className="w-4 h-4 sm:w-5 sm:h-5 object-contain" />;
    } else if (toolId.includes('deepseek')) {
      return <img src={deepseekLogo} alt="DeepSeek" className="w-4 h-4 sm:w-5 sm:h-5 object-contain" />;
    } else if (toolId.includes('claude')) {
      return <img src={claudeLogo} alt="Anthropic Claude" className="w-4 h-4 sm:w-5 sm:h-5 object-contain" />;
    } else if (toolId.includes('grok')) {
      return <img src={grokLogo} alt="Grok" className="w-4 h-4 sm:w-5 sm:h-5 object-contain" />;
    }
    return <Bot className="h-4 w-4 sm:h-5 sm:w-5" />;
  };

  const filteredTools = tools.filter(tool => tool.category === selectedCategory);

  const handleToolClick = (tool: Tool) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    
    // List of tools that should navigate to /chat/id
    const chatTools = [
      'calculate-calories',
      'openai-gpt-4o', 
      'openai-gpt-4-1',
      'deepseek-v31-terminus',
      'deepseek-r1',
      'openai-gpt-4o-mini',
      'openai-gpt-5',
      'claude-opus-4',
      'claude-sonnet-4',
      'gemini-2-5-flash',
      'grok-4'
    ];
    
    if (chatTools.includes(tool.id)) {
      // Generate unique chat ID and navigate to chat page
      const chatId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      // Map tool id to model id for pre-selection
      const toolToModelMap: { [key: string]: string } = {
        'openai-gpt-4o': 'gpt-4o',
        'openai-gpt-4-1': 'gpt-4o',
        'openai-gpt-5': 'gpt-5',
        'openai-gpt-4o-mini': 'gpt-4o-mini',
        'claude-opus-4': 'claude-opus-4',
        'claude-sonnet-4': 'claude-sonnet-4',
        'deepseek-v31-terminus': 'deepseek-v31-terminus',
        'deepseek-r1': 'deepseek-r1',
        'gemini-2-5-flash': 'gemini-2-5-flash',
        'grok-4': 'grok-4'
      };
      const selectedModel = toolToModelMap[tool.id] || 'gpt-4o-mini';
      navigate(`/chat/${chatId}`, { state: { selectedModel } });
    } else {
      // Generate unique ID for this tool session
      const toolId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      navigate(`${tool.route}/${toolId}`);
    }
  };


  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-background via-background/95 to-background/90">
      <div className="flex items-center justify-between p-4 border-b border-border/40 bg-background/80 backdrop-blur-sm">
        {isMobile && <SidebarTrigger className="mr-2" />}
        {isMobile && (
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <h1 className="text-xl font-bold">Explore Tools</h1>
          </div>
        )}
        <div className="flex-1" />
      </div>
      
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto p-3 sm:p-6 max-w-7xl">
        <div className="mb-8 sm:mb-12 text-center hidden sm:block">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-primary/10 text-primary mb-4 sm:mb-6">
            <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="text-xs sm:text-sm font-medium">Discover Amazing AI Tools</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            Explore Tools
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg lg:text-xl max-w-2xl mx-auto leading-relaxed px-4 sm:px-0">
            Discover and use the most powerful AI tools for your everyday tasks. From image generation to complex analysis.
          </p>
        </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
        <div className="mb-6 sm:mb-8 overflow-x-auto scrollbar-hide">
          <TabsList className="inline-flex w-max sm:grid sm:w-full sm:grid-cols-7 gap-1 h-auto p-1">
            {categories.map((category) => (
              <TabsTrigger key={category} value={category} className="text-xs sm:text-sm whitespace-nowrap px-3 sm:px-4">
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {categories.map((category) => (
          <TabsContent key={category} value={category}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {filteredTools.map((tool) => (
                <Card 
                  key={tool.id} 
                  className="group relative overflow-hidden border-0 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 cursor-pointer hover:-translate-y-1"
                  onClick={() => handleToolClick(tool)}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <CardHeader className="pb-3 sm:pb-4 relative z-10">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary group-hover:scale-110 transition-transform duration-300 flex items-center justify-center">
                            {tool.id.includes('openai') || tool.id.includes('gpt') || tool.id.includes('nanobanana') ? getModelIcon(tool.id) : 
                             tool.category === 'AI Models' ? getModelIcon(tool.id) : tool.icon}
                          </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg sm:text-xl font-bold flex items-center gap-2 group-hover:text-primary transition-colors duration-300">
                            {tool.name}
                            {tool.isNew && (
                              <Badge className="text-xs bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 animate-pulse">
                                New
                              </Badge>
                            )}
                          </CardTitle>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 relative z-10">
                    <CardDescription className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      {tool.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
        </Tabs>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
        }}
      />
    </div>
  );
}