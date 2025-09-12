import React, { createContext, useContext, useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

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
  const [theme, setTheme] = useState<Theme>('system');
  const [accentColor, setAccentColor] = useState<AccentColor>('blue');
  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('dark');
  const { toast } = useToast();

  useEffect(() => {
    // Load saved preferences
    const savedTheme = localStorage.getItem('adamgpt-theme') as Theme;
    const savedAccent = localStorage.getItem('adamgpt-accent') as AccentColor;
    
    if (savedTheme) setTheme(savedTheme);
    if (savedAccent) setAccentColor(savedAccent);
  }, []);

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

    // Save to localStorage
    localStorage.setItem('adamgpt-theme', theme);
    localStorage.setItem('adamgpt-accent', accentColor);
  }, [theme, accentColor]);

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    toast({
      title: "Theme updated",
      description: `Switched to ${newTheme} theme`,
    });
  };

  const handleSetAccentColor = (color: AccentColor) => {
    setAccentColor(color);
    toast({
      title: "Accent color updated",
      description: `Switched to ${color} accent color`,
    });
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