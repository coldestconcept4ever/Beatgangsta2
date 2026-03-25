import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, Filter } from 'lucide-react';
import { VSTPlugin, Hardware, AppTheme } from '../types';

interface PluginCompareModalProps {
  theme: AppTheme;
  userPlugins: VSTPlugin[];
  userGear: Hardware[];
  friendPlugins: VSTPlugin[];
  friendGear: Hardware[];
  onClose: () => void;
}

export const PluginCompareModal: React.FC<PluginCompareModalProps> = ({
  theme,
  userPlugins,
  userGear,
  friendPlugins,
  friendGear,
  onClose
}) => {
  const [userSearch, setUserSearch] = useState('');
  const [friendSearch, setFriendSearch] = useState('');
  const [expandedPluginId, setExpandedPluginId] = useState<string | null>(null);

  const containerClasses = theme === 'coldest' 
    ? "bg-white/90 backdrop-blur-2xl border-white/60 text-[#082f49]" 
    : "bg-[#0a0000]/95 border-red-900/50 text-red-50";

  const renderGearList = (plugins: VSTPlugin[], gear: Hardware[], search: string) => {
    const filteredPlugins = plugins.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    const filteredGear = gear.filter(g => g.name.toLowerCase().includes(search.toLowerCase()));
    
    return (
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <h4 className="font-black uppercase text-xs opacity-50 mb-2">Plugins</h4>
        {filteredPlugins.map((p, i) => {
          const id = `${p.name}-${p.vendor}-${i}`;
          const isExpanded = expandedPluginId === id;
          return (
            <div key={id} className="border-b border-black/5">
              <div 
                className="p-2 text-xs cursor-pointer hover:bg-black/5 flex items-center justify-between"
                onClick={() => setExpandedPluginId(isExpanded ? null : id)}
              >
                <span>{p.name}</span>
                {p.description && <span className="opacity-50 text-[10px]">{isExpanded ? '▲' : '▼'}</span>}
              </div>
              <AnimatePresence>
                {isExpanded && p.description && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-4 py-2 text-[10px] bg-black/5 overflow-hidden italic"
                  >
                    {p.description}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
        <h4 className="font-black uppercase text-xs opacity-50 mt-4 mb-2">Hardware</h4>
        {filteredGear.map((g, i) => (
          <div key={`${g.name}-${g.vendor}-${i}`} className="p-2 border-b border-black/5 text-xs">
            {g.name}
            {g.description && <div className="text-[10px] opacity-70 mt-1 italic">{g.description}</div>}
          </div>
        ))}
      </div>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[400000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <div className={`w-full max-w-6xl h-[90vh] rounded-[2rem] border shadow-2xl overflow-hidden flex flex-col ${containerClasses}`}>
        <div className="p-6 border-b border-black/5 flex items-center justify-between">
          <h2 className="text-2xl font-black tracking-tighter">Plugin Comparison</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-black/5 transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 border-r border-black/5 flex flex-col">
            <div className="p-4 border-b border-black/5">
              <input 
                type="text" 
                placeholder="Search your gear..." 
                value={userSearch} 
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full p-2 rounded-lg bg-black/5 text-xs"
              />
            </div>
            {renderGearList(userPlugins, userGear, userSearch)}
          </div>
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-black/5">
              <input 
                type="text" 
                placeholder="Search friend's gear..." 
                value={friendSearch} 
                onChange={(e) => setFriendSearch(e.target.value)}
                className="w-full p-2 rounded-lg bg-black/5 text-xs"
              />
            </div>
            {renderGearList(friendPlugins, friendGear, friendSearch)}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
