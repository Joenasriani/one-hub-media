import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Zap, Hash, TrendingUp, Search } from 'lucide-react';
import { TOOLS, inferSubject } from '../constants';
import { fetchGeminiBrief } from '../services/mockService'; // Now supports AI
import { ContextBrief } from '../types';
import { ToolCard } from './ToolCard';
import { ActiveToolOverlay } from './ActiveToolOverlay';
import { useApp } from '../context/AppContext';

export const Dashboard: React.FC = () => {
  const { globalTopic, setGlobalContext, themeAccent, activeTool, setActiveTool } = useApp();
  const [filter, setFilter] = useState('All');
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(globalTopic);
  
  const [brief, setBrief] = useState<ContextBrief | null>(null);
  const [inferredSubject, setInferredSubject] = useState(inferSubject(globalTopic).subject);

  const categories = ['All', 'Creation', 'Strategy', 'Wildcard', 'Misc'];
  const filteredTools = filter === 'All' ? TOOLS : TOOLS.filter(t => t.category === filter);

  // Dynamic Accent Classes
  const accentColors = {
    cyan: 'text-cyan-400 border-cyan-500/30 hover:border-cyan-500/50',
    amber: 'text-amber-400 border-amber-500/30 hover:border-amber-500/50',
    emerald: 'text-emerald-400 border-emerald-500/30 hover:border-emerald-500/50',
    violet: 'text-violet-400 border-violet-500/30 hover:border-violet-500/50',
    rose: 'text-rose-400 border-rose-500/30 hover:border-rose-500/50',
  };
  const accentClass = accentColors[themeAccent];
  const iconColor = accentClass.split(' ')[0];

  // Fetch Brief Async (AI or Mock)
  useEffect(() => {
    let mounted = true;
    setBrief(null); // Reset to show loading state or just skeleton if desired
    
    const loadBrief = async () => {
      const data = await fetchGeminiBrief(globalTopic);
      if (mounted) {
        setBrief(data);
        setInferredSubject(inferSubject(globalTopic).subject);
      }
    };
    
    loadBrief();
    return () => { mounted = false; };
  }, [globalTopic]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setGlobalContext(inputValue);
      setIsEditing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-12 relative overflow-x-hidden">
      {/* Aurora Background */}
      <div className={`fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-20 blur-[120px] rounded-full pointer-events-none transition-colors duration-1000
        ${themeAccent === 'amber' ? 'bg-amber-900' : themeAccent === 'emerald' ? 'bg-emerald-900' : 'bg-cyan-900'}
      `} />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Header & Search Morph */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <h1 className="text-2xl font-bold text-white tracking-tight hidden md:block">One AI Hub</h1>
          
          {/* MORPHING SEARCH BAR */}
          <motion.form 
            layoutId="search-bar"
            onSubmit={handleSearchSubmit}
            className="flex-1 max-w-md w-full relative z-50"
          >
            <div className="relative flex items-center bg-slate-900/50 backdrop-blur-xl rounded-xl border border-white/10 hover:border-white/20 transition-all shadow-lg overflow-hidden group">
              <Search size={18} className="ml-4 text-slate-500 group-hover:text-white transition-colors" />
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onFocus={() => setIsEditing(true)}
                onBlur={() => setTimeout(() => setIsEditing(false), 200)}
                className="flex-1 bg-transparent text-white px-4 py-3 text-sm focus:outline-none placeholder-slate-600"
              />
            </div>
          </motion.form>

          <div className="flex flex-wrap gap-2 p-1 bg-slate-900/80 backdrop-blur rounded-xl border border-white/5">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                  filter === cat 
                    ? 'bg-white/10 text-white shadow-lg' 
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </header>

        {/* Intelligence Grid (Real Data Display) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12"
        >
          {/* Analysis Card */}
          <div className={`bg-white/5 backdrop-blur-md border rounded-2xl p-6 relative overflow-hidden group transition-colors hover:bg-white/10 ${accentClass}`}>
            <Globe size={64} className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity duration-500 ${iconColor}`} />
            <div className={`flex items-center gap-3 mb-4 ${iconColor}`}>
              <Zap size={18} />
              <h3 className="text-xs font-bold uppercase tracking-wider">Inferred Subject</h3>
            </div>
            <h2 className="text-xl font-bold text-white mb-3 capitalize truncate">{inferredSubject}</h2>
            <p className="text-slate-400 text-sm leading-relaxed border-l-2 border-white/10 pl-4">
              {brief ? brief.summary : <span className="animate-pulse">Analyzing global data...</span>}
            </p>
          </div>

          {/* Global Signal (Headlines) */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-white/20 transition-colors hover:bg-white/10">
             <TrendingUp size={64} className="absolute top-0 right-0 p-4 opacity-10 text-white transition-transform group-hover:scale-110" />
             <div className="flex items-center gap-3 mb-4 text-white/70">
              <TrendingUp size={18} />
              <h3 className="text-xs font-bold uppercase tracking-wider">Global Signal</h3>
            </div>
            <div className="space-y-4">
              {brief ? brief.headlines.map((news, i) => (
                <div key={i} className="flex flex-col group/item">
                  <div className="flex items-start gap-3">
                    <div className={`mt-1.5 w-1.5 h-1.5 rounded-full transition-colors ${iconColor.replace('text', 'bg')}`} />
                    <p className="text-sm text-slate-200 font-medium line-clamp-1 group-hover/item:text-white transition-colors">{news.title}</p>
                  </div>
                  <div className="flex justify-between pl-4.5 mt-1">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wide">{news.source}</span>
                    <span className="text-[10px] text-slate-600">{news.time}</span>
                  </div>
                </div>
              )) : (
                <div className="space-y-4 animate-pulse">
                   {[1,2,3].map(i => <div key={i} className="h-4 bg-white/5 rounded w-3/4"/>)}
                </div>
              )}
            </div>
          </div>

          {/* Velocity (Hashtags) */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-white/20 transition-colors hover:bg-white/10">
             <Hash size={64} className="absolute top-0 right-0 p-4 opacity-10 text-white transition-transform group-hover:rotate-12" />
             <div className="flex items-center gap-3 mb-4 text-white/70">
              <Hash size={18} />
              <h3 className="text-xs font-bold uppercase tracking-wider">Social Velocity</h3>
            </div>
            <div className="flex flex-wrap gap-2">
               {brief ? brief.hashtags.map((tag, i) => (
                 <span key={i} className="px-3 py-1.5 bg-black/30 hover:bg-white/10 rounded-full border border-white/5 text-xs font-mono text-slate-400 hover:text-white hover:border-white/20 transition-all cursor-default">
                    {tag}
                 </span>
               )) : (
                 <div className="flex gap-2 animate-pulse">
                    <div className="h-6 w-16 bg-white/5 rounded-full" />
                    <div className="h-6 w-20 bg-white/5 rounded-full" />
                 </div>
               )}
            </div>
          </div>
        </motion.div>

        {/* Tool Grid */}
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence>
            {filteredTools.map((tool) => (
              <ToolCard 
                key={tool.id} 
                tool={tool} 
                onClick={() => setActiveTool(tool)} 
              />
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Overlay */}
        <AnimatePresence>
          {activeTool && (
            <ActiveToolOverlay 
              tool={activeTool} 
              onClose={() => setActiveTool(null)} 
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};