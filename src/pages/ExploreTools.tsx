import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useFavoriteTools } from '@/hooks/useFavoriteTools';
import { useNavigate } from 'react-router-dom';
import { 
  Bot, 
  ImageIcon, 
  Search, 
  Calculator, 
  Palette, 
  Zap, 
  Combine, 
  Edit3,
  Heart,
  FileImage,
  FileText,
  Sparkles,
  Brain,
  Globe,
  Code
} from 'lucide-react';
import { toast } from 'sonner';

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
    id: 'deepseek',
    name: 'DeepSeek',
    description: 'Advanced AI model great for most questions and tasks',
    category: 'AI Models',
    icon: <Brain className="h-5 w-5" />,
    isNew: true,
    route: '/deepseek'
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
    id: 'google-gemini',
    name: 'Google Gemini',
    description: 'Google\'s most capable AI for a wide range of tasks',
    category: 'AI Models',
    icon: <Sparkles className="h-5 w-5" />,
    route: '/google-gemini'
  },
  {
    id: 'grok-3-mini',
    name: 'Grok-3 Mini',
    description: 'Fast and lightweight AI model built for speed',
    category: 'AI Models',
    icon: <Zap className="h-5 w-5" />,
    route: '/grok-3-mini'
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('Popular');
  const { favoriteTools, addFavorite, removeFavorite, isLoading } = useFavoriteTools();

  const filteredTools = tools.filter(tool => tool.category === selectedCategory);

  const handleToolClick = (tool: Tool) => {
    // Generate unique ID for this tool session
    const toolId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    navigate(`${tool.route}/${toolId}`);
  };

  const toggleFavorite = async (toolId: string) => {
    if (!user) {
      toast.info('Please sign in to save favorite tools');
      return;
    }

    try {
      if (favoriteTools.includes(toolId)) {
        await removeFavorite(toolId);
        toast.success('Removed from favorites');
      } else {
        await addFavorite(toolId);
        toast.success('Added to favorites');
      }
    } catch (error) {
      toast.error('Failed to update favorites');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90">
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">Discover Amazing AI Tools</span>
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            Explore Tools
          </h1>
          <p className="text-muted-foreground text-xl max-w-2xl mx-auto leading-relaxed">
            Discover and use the most powerful AI tools for your everyday tasks. From image generation to complex analysis.
          </p>
        </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
        <TabsList className="grid w-full grid-cols-7 mb-8">
          {categories.map((category) => (
            <TabsTrigger key={category} value={category} className="text-xs sm:text-sm">
              {category}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((category) => (
          <TabsContent key={category} value={category}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredTools.map((tool) => (
                <Card 
                  key={tool.id} 
                  className="group relative overflow-hidden border-0 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 cursor-pointer hover:-translate-y-1"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <CardHeader className="pb-4 relative z-10">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary group-hover:scale-110 transition-transform duration-300">
                          {tool.icon}
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-xl font-bold flex items-center gap-2 group-hover:text-primary transition-colors duration-300">
                            {tool.name}
                            {tool.isNew && (
                              <Badge className="text-xs bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 animate-pulse">
                                New
                              </Badge>
                            )}
                          </CardTitle>
                        </div>
                      </div>
                      {user && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(tool.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-8 w-8"
                          disabled={isLoading}
                        >
                          <Heart 
                            className={`h-4 w-4 ${
                              favoriteTools.includes(tool.id) 
                                ? 'fill-red-500 text-red-500' 
                                : 'text-muted-foreground'
                            }`} 
                          />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 relative z-10">
                    <CardDescription className="text-base text-muted-foreground mb-6 leading-relaxed">
                      {tool.description}
                    </CardDescription>
                    <Button 
                      onClick={() => handleToolClick(tool)}
                      className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-semibold py-3 rounded-xl group-hover:shadow-lg group-hover:shadow-primary/25 transition-all duration-300"
                    >
                      <span className="flex items-center gap-2">
                        Use Tool
                        <Sparkles className="h-4 w-4 group-hover:animate-pulse" />
                      </span>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
      </div>
    </div>
  );
}