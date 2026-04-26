import React from 'react';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import { Tool } from '../types';

interface ToolCardProps {
  tool: Tool;
  onClick: () => void;
}

export const ToolCard: React.FC<ToolCardProps> = ({ tool, onClick }) => {
  // Dynamic Icon Loading
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const IconComponent = (Icons as any)[tool.icon] || Icons.HelpCircle;

  const isUnavailable = tool.availableInFree === false;

  return (
    <motion.div
      whileHover={isUnavailable ? undefined : { scale: 1.02, translateY: -5 }}
      whileTap={isUnavailable ? undefined : { scale: 0.98 }}
      onClick={isUnavailable ? undefined : onClick}
      className={`relative group ${isUnavailable ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative h-full bg-white/5 backdrop-blur-md border border-white/10 hover:border-cyan-500/30 rounded-2xl p-6 flex flex-col justify-between transition-colors duration-300">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-slate-900/50 rounded-xl border border-white/5 text-cyan-400 group-hover:text-cyan-300 group-hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all">
            <IconComponent size={24} />
          </div>
          
          {/* API Badge - Requirement */}
          <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-900/30 border border-cyan-500/30 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.1)]">
            {isUnavailable ? 'FREE ONLY' : 'API'}
          </span>
        </div>

        {/* Content */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-cyan-100 transition-colors">
            {tool.name}
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            {tool.description}
          </p>
        </div>

        {/* Footer Indicator */}
        <div className="mt-4 flex items-center text-xs text-slate-500 font-medium group-hover:text-cyan-400 transition-colors">
          <span>{isUnavailable ? 'Not available in free version' : 'Launch Tool'}</span>
          {!isUnavailable && <Icons.ArrowUpRight size={14} className="ml-1" />}
        </div>
      </div>
    </motion.div>
  );
};
