import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

  const fetchFavoriteTools = async () => {
    if (!user) {
      setFavoriteTools([]);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('favorite_tools')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFavoriteTools(data || []);
    } catch (error) {
      console.error('Error fetching favorite tools:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavoriteTools();
  }, [user]);

  const addFavorite = async (toolName: string) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save favorite tools.",
        variant: "destructive"
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('favorite_tools')
        .insert({
          user_id: user.id,
          tool_name: toolName
        });

      if (error) throw error;

      await fetchFavoriteTools();
      toast({
        title: "Added to favorites",
        description: `${toolName} has been added to your favorite tools.`
      });
      return true;
    } catch (error) {
      console.error('Error adding favorite tool:', error);
      toast({
        title: "Error",
        description: "Failed to add tool to favorites.",
        variant: "destructive"
      });
      return false;
    }
  };

  const removeFavorite = async (toolName: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('favorite_tools')
        .delete()
        .eq('user_id', user.id)
        .eq('tool_name', toolName);

      if (error) throw error;

      await fetchFavoriteTools();
      toast({
        title: "Removed from favorites",
        description: `${toolName} has been removed from your favorites.`
      });
      return true;
    } catch (error) {
      console.error('Error removing favorite tool:', error);
      toast({
        title: "Error",
        description: "Failed to remove tool from favorites.",
        variant: "destructive"
      });
      return false;
    }
  };

  const isFavorite = (toolName: string): boolean => {
    return favoriteTools.some(tool => tool.tool_name === toolName);
  };

  return {
    favoriteTools,
    loading,
    addFavorite,
    removeFavorite,
    isFavorite,
    refetch: fetchFavoriteTools
  };
}