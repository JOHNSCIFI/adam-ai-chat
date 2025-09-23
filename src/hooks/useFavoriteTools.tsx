import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface FavoriteTool {
  id: string;
  tool_name: string;
  created_at: string;
}

export function useFavoriteTools() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [favoriteTools, setFavoriteTools] = useState<FavoriteTool[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadFavoriteTools();
    } else {
      setFavoriteTools([]);
    }
  }, [user]);

  const loadFavoriteTools = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('favorite_tools')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading favorite tools:', error);
    } else {
      setFavoriteTools(data || []);
    }
    setLoading(false);
  };

  const addToFavorites = async (toolName: string) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to add tools to favorites",
        variant: "destructive",
      });
      return false;
    }

    const { error } = await supabase
      .from('favorite_tools')
      .insert({ user_id: user.id, tool_name: toolName });

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        toast({
          title: "Already in favorites",
          description: "This tool is already in your favorites",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to add tool to favorites",
          variant: "destructive",
        });
      }
      return false;
    }

    toast({
      title: "Added to favorites",
      description: `${toolName} has been added to your favorites`,
    });
    
    loadFavoriteTools();
    return true;
  };

  const removeFromFavorites = async (toolName: string) => {
    if (!user) return false;

    const { error } = await supabase
      .from('favorite_tools')
      .delete()
      .eq('user_id', user.id)
      .eq('tool_name', toolName);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to remove tool from favorites",
        variant: "destructive",
      });
      return false;
    }

    toast({
      title: "Removed from favorites",
      description: `${toolName} has been removed from your favorites`,
    });
    
    loadFavoriteTools();
    return true;
  };

  const isFavorite = (toolName: string) => {
    return favoriteTools.some(tool => tool.tool_name === toolName);
  };

  return {
    favoriteTools,
    loading,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
  };
}