import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import AuthModal from '@/components/AuthModal';
import { Bot, ImageIcon, Search, Calculator, Palette, Zap, Combine, Edit3, FileImage, FileText, Sparkles, Brain, Globe, Code } from 'lucide-react';
import { toast } from 'sonner';
import chatgptLogo from '@/assets/chatgpt-logo.png';
import chatgptLogoLight from '@/assets/chatgpt-logo-light.png';
import geminiLogo from '@/assets/gemini-logo.png';
import claudeLogo from '@/assets/claude-logo.png';
import deepseekLogo from '@/assets/deepseek-logo.png';
interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  isNew?: boolean;
  route: string;
}
const tools: Tool[] = [{
  id: 'calculate-calories',
  name: 'Calculate Calories',
  description: 'Upload food images to get nutritional information and calorie counts',
  category: 'Popular',
  icon: <Calculator className="h-5 w-5" />,
  route: '/calculate-calories'
}, {
  id: 'openai-gpt-4o',
  name: 'OpenAI GPT-4o',
  description: 'Access to OpenAI\'s powerful GPT-4o model for complex tasks',
  category: 'AI Models',
  icon: <Bot className="h-5 w-5" />,
  route: '/openai-gpt-4o'
}, {
  id: 'openai-gpt-4-1',
  name: 'OpenAI GPT-4.1',
  description: 'The flagship GPT-4 model for reliable and accurate responses',
  category: 'AI Models',
  icon: <Bot className="h-5 w-5" />,
  route: '/openai-gpt-4-1'
}, {
  id: 'deepseek',
  name: 'DeepSeek',
  description: 'Advanced AI model great for most questions and tasks',
  category: 'AI Models',
  icon: <Brain className="h-5 w-5" />,
  isNew: true,
  route: '/deepseek'
}, {
  id: 'deepseek-r1',
  name: 'DeepSeek R1',
  description: 'Latest DeepSeek model with enhanced reasoning capabilities',
  category: 'AI Models',
  icon: <Brain className="h-5 w-5" />,
  isNew: true,
  route: '/deepseek-r1'
}, {
  id: 'google-gemini',
  name: 'Google Gemini',
  description: 'Google\'s most capable AI for a wide range of tasks',
  category: 'AI Models',
  icon: <Sparkles className="h-5 w-5" />,
  route: '/google-gemini'
}, {
  id: 'grok-3-mini',
  name: 'Grok-3 Mini',
  description: 'Fast and lightweight AI model built for speed',
  category: 'AI Models',
  icon: <Zap className="h-5 w-5" />,
  route: '/grok-3-mini'
}, {
  id: 'grok-4',
  name: 'Grok-4',
  description: 'Advanced AI model for tackling intricate challenges',
  category: 'AI Models',
  icon: <Zap className="h-5 w-5" />,
  route: '/grok-4'
}, {
  id: 'generate-image-openai',
  name: 'Generate Image with OpenAI',
  description: 'Create stunning images from text using OpenAI\'s image generation',
  category: 'Popular',
  icon: <ImageIcon className="h-5 w-5" />,
  route: '/generate-image-openai'
}, {
  id: 'generate-image-nanobanana',
  name: 'Generate Image with NanoBanana',
  description: 'Create images using advanced NanoBanana AI technology',
  category: 'Image Generation',
  icon: <Palette className="h-5 w-5" />,
  isNew: true,
  route: '/generate-image-nanobanana'
}, {
  id: 'combine-images-openai',
  name: 'Combine Images with OpenAI',
  description: 'Merge and blend multiple images together using AI',
  category: 'Image Generation',
  icon: <Combine className="h-5 w-5" />,
  route: '/combine-images-openai'
}, {
  id: 'combine-images-nanobanana',
  name: 'Combine Images with NanoBanana',
  description: 'Advanced image combination with NanoBanana technology',
  category: 'Image Generation',
  icon: <Combine className="h-5 w-5" />,
  isNew: true,
  route: '/combine-images-nanobanana'
}, {
  id: 'edit-image-nanobanana',
  name: 'Edit Image with NanoBanana',
  description: 'Professional image editing powered by AI',
  category: 'Image Generation',
  icon: <Edit3 className="h-5 w-5" />,
  isNew: true,
  route: '/edit-image-nanobanana'
}, {
  id: 'analyse-image-openai',
  name: 'Analyse Image with OpenAI',
  description: 'Get detailed analysis and insights from your images',
  category: 'Popular',
  icon: <FileImage className="h-5 w-5" />,
  route: '/analyse-image-openai'
}, {
  id: 'analyse-files-openai',
  name: 'Analyse Files with OpenAI',
  description: 'Extract insights and information from various file types',
  category: 'Popular',
  icon: <FileText className="h-5 w-5" />,
  route: '/analyse-files-openai'
}, {
  id: 'ai-search-engine',
  name: 'AI Search Engine',
  description: 'Advanced web search powered by artificial intelligence',
  category: 'Popular',
  icon: <Search className="h-5 w-5" />,
  route: '/ai-search-engine'
}];
const categories = ['Popular', 'AI Models', 'Writing', 'Education', 'Lifestyle', 'Programming', 'Image Generation'];
export default function ExploreTools() {
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const {
    actualTheme
  } = useTheme();
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
    }
    return <Bot className="h-4 w-4 sm:h-5 sm:w-5" />;
  };
  const filteredTools = tools.filter(tool => tool.category === selectedCategory);
  const handleToolClick = (tool: Tool) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    // Generate unique ID for this tool session
    const toolId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    navigate(`${tool.route}/${toolId}`);
  };
  return <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90">
      <div className="container mx-auto p-3 sm:p-6 max-w-7xl">
        <div className="mb-8 sm:mb-12 text-center">
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

      
      </div>

      {/* Auth Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onSuccess={() => {
      setShowAuthModal(false);
    }} />
    </div>;
}