import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useFavoriteTools = () => {
  const { user } = useAuth();
  const [favoriteTools, setFavoriteTools] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch favorite tools for authenticated users
  const fetchFavoriteTools = async () => {
    if (!user) {
      setFavoriteTools([]);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('favorite_tools')
        .select('tool_name')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching favorite tools:', error);
        return;
      }

      setFavoriteTools(data?.map(item => item.tool_name) || []);
    } catch (error) {
      console.error('Error in fetchFavoriteTools:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFavoriteTools();
  }, [user]);

  const addFavorite = async (toolName: string) => {
    if (!user) return;

    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('favorite_tools')
        .insert({
          user_id: user.id,
          tool_name: toolName
        });

      if (error) {
        console.error('Error adding favorite tool:', error);
        throw error;
      }

      setFavoriteTools(prev => [...prev, toolName]);
    } catch (error) {
      console.error('Error in addFavorite:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const removeFavorite = async (toolName: string) => {
    if (!user) return;

    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('favorite_tools')
        .delete()
        .eq('user_id', user.id)
        .eq('tool_name', toolName);

      if (error) {
        console.error('Error removing favorite tool:', error);
        throw error;
      }

      setFavoriteTools(prev => prev.filter(tool => tool !== toolName));
    } catch (error) {
      console.error('Error in removeFavorite:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    favoriteTools,
    addFavorite,
    removeFavorite,
    isLoading
  };
};