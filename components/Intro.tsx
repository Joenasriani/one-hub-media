
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Search } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Intro: React.FC = () => {
  const { setGlobalContext } = useApp();
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      setGlobalContext(input);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -50 }}
      transition={{ duration: 0.8, ease: [0.43, 0.13, 0.23, 0.96] }} // Apple-like ease
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden p-6"
    >
      {/* Ambient "Aurora" */}
      <div className="orb w-96 h-96 bg-cyan-500/20 top-10 left-10 blur-[120px]" />
      <div className="orb w-96 h-96 bg-purple-600/20 bottom-10 right-10 blur-[120px]" />

      <div className="max-w-3xl w-full z-10 text-center space-y-8">
        <motion.h1 
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 20 }}
          className="text-5xl md:text-7xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400"
        >
          One AI Hub
        </motion.h1>
        
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-xl text-slate-400 font-light"
        >
          Enter your vision. We'll handle the rest.
        </motion.p>

        <motion.form 
          layoutId="search-bar"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.6, type: "spring", stiffness: 400, damping: 30 }}
          onSubmit={handleSubmit}
          className="relative group max-w-xl mx-auto w-full"
        >
          {/* Outer Glow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
          
          {/* Input Container */}
          <div className="relative flex items-center bg-slate-900 rounded-2xl p-2 border border-slate-800 shadow-2xl">
            <Search className="ml-4 text-slate-500" />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. Future of Coffee..."
              className="flex-1 bg-transparent text-white px-4 py-3 text-lg focus:outline-none placeholder-slate-600"
              autoFocus
            />
            <button 
              type="submit"
              className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-white transition-colors"
            >
              <ArrowRight size={24} />
            </button>
          </div>
        </motion.form>
      </div>
    </motion.div>
  );
};
