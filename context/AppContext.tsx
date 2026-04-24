import React, { createContext, useContext, useState, ReactNode, PropsWithChildren } from 'react';
import { ThemeAccent, AppContextType, Tool } from '../types';
import { getTheme } from '../constants';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: PropsWithChildren) => {
  const [globalTopic, setGlobalTopic] = useState('');
  const [themeAccent, setThemeAccent] = useState<ThemeAccent>('cyan');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTool, setActiveTool] = useState<Tool | null>(null);

  const setGlobalContext = (topic: string) => {
    // Sanitization: remove markdown chars
    const clean = topic.replace(/[*#_]/g, '').trim();
    setGlobalTopic(clean);
    setThemeAccent(getTheme(clean));
  };

  return (
    <AppContext.Provider value={{ 
      globalTopic, 
      setGlobalContext, 
      themeAccent, 
      isGenerating, 
      setIsGenerating,
      activeTool,
      setActiveTool
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};