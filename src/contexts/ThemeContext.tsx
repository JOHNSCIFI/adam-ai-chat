import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type Theme = 'light' | 'dark' | 'system';
type AccentColor = 'blue' | 'purple' | 'green' | 'orange' | 'red';

interface ThemeContextType {
  theme: Theme;
  accentColor: AccentColor;
  setTheme: (theme: Theme) => void;
  setAccentColor: (color: AccentColor) => void;
  actualTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark'); // Default to dark for ChatGPT style
  const [accentColor, setAccentColor] = useState<AccentColor>('blue'); // Default to blue for ChatGPT brand
  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('dark');
  const { user } = useAuth();

  useEffect(() => {
    // Load saved preferences from Supabase if user is authenticated
    const loadUserPreferences = async () => {
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('theme, accent_color')
          .eq('user_id', user.id)
          .single();
        
        if (data?.theme) setTheme(data.theme as Theme);
        if (data?.accent_color) setAccentColor(data.accent_color as AccentColor);
      } else {
        // Fallback to localStorage for non-authenticated users
        const savedTheme = localStorage.getItem('adamgpt-theme') as Theme;
        const savedAccent = localStorage.getItem('adamgpt-accent') as AccentColor;
        
        if (savedTheme) setTheme(savedTheme);
        if (savedAccent) setAccentColor(savedAccent);
      }
    };

    loadUserPreferences();
  }, [user]);

  useEffect(() => {
    // Determine actual theme
    let newActualTheme: 'light' | 'dark';
    
    if (theme === 'system') {
      newActualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      newActualTheme = theme;
    }

    setActualTheme(newActualTheme);

    // Apply theme classes
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(newActualTheme);
    
    // Apply accent color
    root.classList.remove('accent-blue', 'accent-purple', 'accent-green', 'accent-orange', 'accent-red');
    root.classList.add(`accent-${accentColor}`);

    // Save preferences
    const savePreferences = async () => {
      if (user) {
        // Save to Supabase for authenticated users
        await supabase
          .from('profiles')
          .update({ theme, accent_color: accentColor })
          .eq('user_id', user.id);
      } else {
        // Fallback to localStorage for non-authenticated users
        localStorage.setItem('adamgpt-theme', theme);
        localStorage.setItem('adamgpt-accent', accentColor);
      }
    };

    savePreferences();
  }, [theme, accentColor, user]);

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme);
  };

  const handleSetAccentColor = (color: AccentColor) => {
    setAccentColor(color);
  };

  return (
    <ThemeContext.Provider 
      value={{ 
        theme, 
        accentColor, 
        setTheme: handleSetTheme, 
        setAccentColor: handleSetAccentColor, 
        actualTheme 
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}