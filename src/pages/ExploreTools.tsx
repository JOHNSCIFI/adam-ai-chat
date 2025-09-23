import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Calculator, 
  ImageIcon as Image, 
  FileImage, 
  Edit3 as Edit, 
  Combine, 
  Brain, 
  Heart
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useFavoriteTools } from '@/hooks/useFavoriteTools';

export default function ExploreTools() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavoriteTools();

  const handleToolClick = (toolName: string) => {
    console.log(`Using tool: ${toolName}`);
  };

  const handleFavoriteToggle = async (toolName: string) => {
    if (isFavorite(toolName)) {
      await removeFromFavorites(toolName);
    } else {
      await addToFavorites(toolName);
    }
  };

  const tools = [
    {
      name: 'Calculate Calories',
      description: 'Calculate daily calorie needs and track nutrition intake',
      icon: Calculator,
      category: 'Health & Fitness'
    },
    {
      name: 'Generate Image with Nanobanan',
      description: 'Create stunning images using advanced AI algorithms',
      icon: Image,
      category: 'Image Generation'
    },
    {
      name: 'Generate Image with OpenAI',
      description: 'Create high-quality images using OpenAI DALL-E technology',
      icon: Image,
      category: 'Image Generation'
    },
    {
      name: 'Edit Image with Nanobanan',
      description: 'Advanced image editing powered by artificial intelligence',
      icon: Edit,
      category: 'Image Editing'
    },
    {
      name: 'OpenAI GPT-4.1',
      description: 'Most advanced GPT model for complex reasoning and analysis',
      icon: Brain,
      category: 'AI Models'
    },
    {
      name: 'Analyse Image with OpenAI',
      description: 'Deep image analysis and understanding using AI vision',
      icon: FileImage,
      category: 'Analysis'
    }
  ];

  return (
    <div className="flex-1 p-6">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Explore Tools</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Discover powerful AI tools to enhance your workflow
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <tool.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{tool.name}</CardTitle>
                      <CardDescription className="text-sm">{tool.category}</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {tool.description}
                </p>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleToolClick(tool.name)}
                    className="flex-1"
                  >
                    Use Tool
                  </Button>
                  {user && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleFavoriteToggle(tool.name)}
                      className={isFavorite(tool.name) ? "text-red-500 hover:text-red-600" : ""}
                    >
                      {isFavorite(tool.name) ? (
                        <Heart className="h-4 w-4 fill-current" />
                      ) : (
                        <Heart className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}