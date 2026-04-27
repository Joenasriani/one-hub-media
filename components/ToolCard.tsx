import React from 'react';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import { CapabilitiesMap, Tool } from '../types';

interface ToolCardProps {
  tool: Tool;
  capabilities: CapabilitiesMap | null;
  onClick: () => void;
}

const getToolState = (tool: Tool, capabilities: CapabilitiesMap | null) => {
  if (!capabilities) return { disabled: true, label: 'not configured', detail: 'Capability data unavailable.' };

  const required = tool.requiredCapabilities || ['text'];
  for (const capability of required) {
    const info = capabilities[capability];
    if (!info || info.status !== 'available') {
      return {
        disabled: true,
        label: info?.status?.replaceAll('_', ' ') || 'not configured',
        detail: info?.message || `${capability} is unavailable.`
      };
    }
  }

  return { disabled: false, label: 'available', detail: 'Launch tool' };
};

export const ToolCard: React.FC<ToolCardProps> = ({ tool, capabilities, onClick }) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const IconComponent = (Icons as any)[tool.icon] || Icons.HelpCircle;
  const state = getToolState(tool, capabilities);

  return (
    <motion.div
      whileHover={state.disabled ? undefined : { scale: 1.02, translateY: -5 }}
      whileTap={state.disabled ? undefined : { scale: 0.98 }}
      onClick={state.disabled ? undefined : onClick}
      className={`relative group ${state.disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative h-full bg-white/5 backdrop-blur-md border border-white/10 hover:border-cyan-500/30 rounded-2xl p-6 flex flex-col justify-between transition-colors duration-300">
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-slate-900/50 rounded-xl border border-white/5 text-cyan-400 group-hover:text-cyan-300 transition-all">
            <IconComponent size={24} />
          </div>

          <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-cyan-300 bg-cyan-900/30 border border-cyan-500/30 rounded-full">
            {state.label}
          </span>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-cyan-100 transition-colors">{tool.name}</h3>
          <p className="text-sm text-slate-400 leading-relaxed">{tool.description}</p>
        </div>

        <div className="mt-4 flex items-center text-xs text-slate-500 font-medium group-hover:text-cyan-400 transition-colors">
          <span>{state.detail}</span>
          {!state.disabled && <Icons.ArrowUpRight size={14} className="ml-1" />}
        </div>
      </div>
    </motion.div>
  );
};
