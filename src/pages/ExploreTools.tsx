import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calculator, 
  ImageIcon, 
  Camera, 
  Combine, 
  Edit3, 
  Brain, 
  Search, 
  FileText, 
  Zap,
  Star,
  Image as ImagePlus,
  Palette,
  Bot,
  Sparkles,
  Target,
  Code,
  Eye
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useFavoriteTools } from '@/hooks/useFavoriteTools';
import { useNavigate } from 'react-router-dom';

interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ComponentType<any>;
  provider: string;
  isNew?: boolean;
  isPopular?: boolean;
  onClick: () => void;
}

export default function ExploreTools() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addFavorite, removeFavorite, isFavorite } = useFavoriteTools();
  const [activeTab, setActiveTab] = useState('popular');

  const handleToolClick = (toolId: string) => {
    // Allow tool access without requiring authentication
    console.log(`Clicked tool: ${toolId}`);
  };

  const tools: Tool[] = [
    // Popular tools
    {
      id: 'calculate-calories',
      name: 'Calculate Calories',
      description: 'Calculate daily calorie needs and track nutrition intake',
      category: 'popular',
      icon: Calculator,
      provider: 'Built-in',
      isPopular: true,
      onClick: () => handleToolClick('calculate-calories')
    },
    {
      id: 'ai-search-engine', 
      name: 'AI Search Engine',
      description: 'Advanced web search powered by artificial intelligence',
      category: 'popular',
      icon: Search,
      provider: 'OpenAI',
      isPopular: true,
      onClick: () => handleToolClick('ai-search-engine')
    },
    {
      id: 'claude',
      name: 'Claude',
      description: "Anthropic's latest AI model excellent for complex tasks like coding",
      category: 'popular',
      icon: Bot,
      provider: 'Anthropic',
      isNew: true,
      onClick: () => handleToolClick('claude')
    },

    // AI Models
    {
      id: 'gpt-4.1',
      name: 'OpenAI GPT-4.1',
      description: 'Most advanced GPT model for complex reasoning and analysis',
      category: 'ai-models',
      icon: Brain,
      provider: 'OpenAI',
      onClick: () => handleToolClick('gpt-4.1')
    },
    {
      id: 'gpt-4o',
      name: 'OpenAI GPT-4o',
      description: 'Multimodal AI model with vision and text capabilities',
      category: 'ai-models',
      icon: Eye,
      provider: 'OpenAI',
      onClick: () => handleToolClick('gpt-4o')
    },
    {
      id: 'deepseek',
      name: 'DeepSeek',
      description: 'Great for most questions with advanced reasoning capabilities',
      category: 'ai-models',
      icon: Target,
      provider: 'DeepSeek',
      isNew: true,
      onClick: () => handleToolClick('deepseek')
    },
    {
      id: 'deepseek-r1',
      name: 'DeepSeek R1',
      description: 'Latest innovation in AI technology with precise data analysis',
      category: 'ai-models',
      icon: Zap,
      provider: 'DeepSeek',
      isNew: true,
      onClick: () => handleToolClick('deepseek-r1')
    },
    {
      id: 'google-gemini',
      name: 'Google Gemini',
      description: "Google's most capable AI designed for a wide range of tasks",
      category: 'ai-models',
      icon: Sparkles,
      provider: 'Google',
      onClick: () => handleToolClick('google-gemini')
    },
    {
      id: 'grok-3-mini',
      name: 'Grok-3 Mini',
      description: 'Fast and lightweight model built for speed and responsiveness',
      category: 'ai-models',
      icon: Zap,
      provider: 'xAI',
      onClick: () => handleToolClick('grok-3-mini')
    },
    {
      id: 'grok-4',
      name: 'Grok-4',
      description: 'Next-generation AI model for advanced coding and context-rich tasks',
      category: 'ai-models',
      icon: Code,
      provider: 'xAI',
      onClick: () => handleToolClick('grok-4')
    },

    // Image Generation & Editing
    {
      id: 'generate-image-nanobanan',
      name: 'Generate Image with Nanobanan',
      description: 'Create stunning images using advanced AI algorithms',
      category: 'image-tools',
      icon: ImageIcon,
      provider: 'Nanobanan',
      onClick: () => handleToolClick('generate-image-nanobanan')
    },
    {
      id: 'generate-image-openai',
      name: 'Generate Image with OpenAI',
      description: 'Create high-quality images using OpenAI DALL-E technology',
      category: 'image-tools',
      icon: ImagePlus,
      provider: 'OpenAI',
      onClick: () => handleToolClick('generate-image-openai')
    },
    {
      id: 'combine-images-nanobanan',
      name: 'Combine Images with Nanobanan',
      description: 'Merge multiple images seamlessly with AI assistance',
      category: 'image-tools',
      icon: Combine,
      provider: 'Nanobanan',
      onClick: () => handleToolClick('combine-images-nanobanan')
    },
    {
      id: 'edit-image-nanobanan',
      name: 'Edit Image with Nanobanan',
      description: 'Advanced image editing powered by artificial intelligence',
      category: 'image-tools',
      icon: Edit3,
      provider: 'Nanobanan',
      onClick: () => handleToolClick('edit-image-nanobanan')
    },
    {
      id: 'edit-image-openai',
      name: 'Edit Images with OpenAI',
      description: 'Professional image editing using OpenAI technology',
      category: 'image-tools',
      icon: Palette,
      provider: 'OpenAI',
      onClick: () => handleToolClick('edit-image-openai')
    },
    {
      id: 'combine-images-openai',
      name: 'Combine Images with OpenAI',
      description: 'Intelligently merge and blend multiple images together',
      category: 'image-tools',
      icon: Combine,
      provider: 'OpenAI',
      onClick: () => handleToolClick('combine-images-openai')
    },
    {
      id: 'analyze-image-openai',
      name: 'Analyze Image with OpenAI',
      description: 'Deep image analysis and understanding using AI vision',
      category: 'image-tools',
      icon: Camera,
      provider: 'OpenAI',
      onClick: () => handleToolClick('analyze-image-openai')
    },

    // File Analysis
    {
      id: 'analyze-files-openai',
      name: 'Analyze Files with OpenAI',
      description: 'Comprehensive file analysis including documents and data',
      category: 'file-tools',
      icon: FileText,
      provider: 'OpenAI',
      onClick: () => handleToolClick('analyze-files-openai')
    }
  ];

  const categories = [
    { id: 'popular', name: 'Popular', description: 'Explore the most popular bots for your everyday tasks.' },
    { id: 'ai-models', name: 'AI Models', description: 'Access powerful AI models for various tasks.' },
    { id: 'image-tools', name: 'Image Tools', description: 'Create, edit, and analyze images with AI.' },
    { id: 'file-tools', name: 'File Analysis', description: 'Analyze and process various file types.' }
  ];

  const getFilteredTools = (category: string) => {
    return tools.filter(tool => tool.category === category);
  };

  const handleFavoriteToggle = async (toolName: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!user) {
      navigate('/auth');
      return;
    }
    
    if (isFavorite(toolName)) {
      await removeFavorite(toolName);
    } else {
      await addFavorite(toolName);
    }
  };

  const ToolCard = ({ tool }: { tool: Tool }) => (
    <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group" onClick={tool.onClick}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <tool.icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold group-hover:text-primary transition-colors">
                {tool.name}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {tool.provider}
              </p>
            </div>
          </div>
          <div className="flex gap-1 items-center">
            {user && (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={(e) => handleFavoriteToggle(tool.name, e)}
              >
                <Star className={`h-4 w-4 ${isFavorite(tool.name) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
              </Button>
            )}
            {tool.isNew && <Badge variant="secondary" className="text-xs">New</Badge>}
            {tool.isPopular && <Badge variant="default" className="text-xs">Popular</Badge>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {tool.description}
        </p>
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Explore Tools</h1>
        <p className="text-muted-foreground">
          Discover powerful AI tools and models for your everyday tasks
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          {categories.map((category) => (
            <TabsTrigger key={category.id} value={category.id} className="text-sm">
              {category.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((category) => (
          <TabsContent key={category.id} value={category.id} className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-semibold">{category.name}</h2>
              <p className="text-muted-foreground">
                {category.description}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getFilteredTools(category.id).map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}