
import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { Intro } from './components/Intro';
import { Dashboard } from './components/Dashboard';
import { AppProvider, useApp } from './context/AppContext';

const MainApp = () => {
  const { globalTopic, activeTool } = useApp();

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-cyan-500/30">
      <AnimatePresence mode="wait">
        {!globalTopic ? (
          <Intro key="intro" />
        ) : (
          <Dashboard key="dashboard" />
        )}
      </AnimatePresence>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
