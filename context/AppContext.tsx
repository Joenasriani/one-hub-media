import React, { createContext, useContext, useEffect, useState, PropsWithChildren } from 'react';
import { ThemeAccent, AppContextType, Tool, CapabilitiesMap, ProviderDefaults } from '../types';
import { getTheme } from '../constants';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: PropsWithChildren) => {
  const [globalTopic, setGlobalTopic] = useState('');
  const [themeAccent, setThemeAccent] = useState<ThemeAccent>('cyan');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTool, setActiveTool] = useState<Tool | null>(null);
  const [capabilities, setCapabilities] = useState<CapabilitiesMap | null>(null);
  const [capabilityFetchError, setCapabilityFetchError] = useState<string | null>(null);
  const [providerDefaults, setProviderDefaults] = useState<ProviderDefaults | null>(null);

  const setGlobalContext = (topic: string) => {
    const clean = topic.replace(/[*#_]/g, '').trim();
    setGlobalTopic(clean);
    setThemeAccent(getTheme(clean));
  };

  const refreshCapabilities = async () => {
    try {
      setCapabilityFetchError(null);
      const response = await fetch('/api/ai/health');
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.capabilities) {
        throw new Error(payload?.error?.message || 'Failed to load provider capabilities.');
      }

      setCapabilities(payload.capabilities as CapabilitiesMap);
      setProviderDefaults((payload.providerDefaults || null) as ProviderDefaults | null);
    } catch (error: any) {
      setCapabilityFetchError(error?.message || 'Failed to load provider capabilities.');
      setCapabilities(null);
      setProviderDefaults(null);
    }
  };

  useEffect(() => {
    refreshCapabilities();
  }, []);

  return (
    <AppContext.Provider value={{
      globalTopic,
      setGlobalContext,
      themeAccent,
      isGenerating,
      setIsGenerating,
      activeTool,
      setActiveTool,
      capabilities,
      capabilityFetchError,
      providerDefaults,
      refreshCapabilities
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
