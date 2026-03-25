
import React, { useState } from 'react';
import { VSTPlugin } from '../types';
import { X, Star } from 'lucide-react';
import { getPluginInfo } from '../data/pluginDetails';
import { motion, AnimatePresence } from 'motion/react';

interface PluginCardProps {
  id?: string;
  plugin: VSTPlugin;
  onRemove: (plugin: VSTPlugin) => void;
  onToggleFavorite: (plugin: VSTPlugin) => void;
  isFavorite: boolean;
}

export const PluginCard: React.FC<PluginCardProps> = ({ id, plugin, onRemove, onToggleFavorite, isFavorite }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const isInstrument = plugin.name.toLowerCase().includes('synth') || 
                       plugin.name.toLowerCase().includes('piano') ||
                       ['kontakt', 'vital', 'xpand', 'maitai', 'presence', 'mojito', 'opal', 'polymax', 'ravel'].some(keyword => plugin.name.toLowerCase().includes(keyword));

  const pluginInfo = getPluginInfo(plugin.name, plugin.type);

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRemoving(true);
    setTimeout(() => {
      onRemove(plugin);
    }, 300); // Wait for animation to finish
  };

  return (
    <div id={id} className={`relative backdrop-blur-3xl border rounded-[28px] p-5 pt-12 shadow-2xl hover:scale-[1.02] transition-all group flex flex-col h-full ${
      isRemoving ? 'scale-90 opacity-0 duration-300' : ''
    } ${
      'bg-white/10 border-white/20 text-current hover:bg-white/20'
    }`}>
      
      {/* Action Buttons - Positioned for better mobile fit */}
      <div className="absolute top-3 left-3 z-10">
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(plugin); }}
          className={`p-2 rounded-full backdrop-blur-md shadow-lg transition-all ${isFavorite ? 'bg-yellow-400 text-yellow-950' : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'}`}
          title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
        >
          <motion.div
            initial={false}
            animate={{ scale: isFavorite ? [1, 1.5, 1] : 1 }}
            transition={{ duration: 0.3 }}
          >
            <Star size={14} className={isFavorite ? "fill-current" : ""} />
          </motion.div>
        </motion.button>
      </div>

      <div className="absolute top-3 right-3 z-10">
        <button 
          onClick={(e) => { e.stopPropagation(); setShowConfirm(true); }}
          className="p-2 rounded-full bg-red-500/80 text-white hover:bg-red-600 backdrop-blur-md shadow-lg transition-all border border-red-400/30"
          title="Remove Plugin"
        >
          <X size={14} />
        </button>
      </div>

      {/* Confirmation Popup */}
      {showConfirm && (
        <div className="absolute top-0 right-0 z-20 bg-black/95 backdrop-blur-xl rounded-[24px] p-4 shadow-2xl animate-in fade-in zoom-in duration-200 border border-white/10">
          <p className="text-white text-[11px] font-black uppercase tracking-widest mb-3">Remove {plugin.name}?</p>
          <div className="flex gap-2">
            <button 
              onClick={(e) => { e.stopPropagation(); setShowConfirm(false); }}
              className="px-4 py-2 rounded-full bg-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-colors border border-white/10"
            >
              Cancel
            </button>
            <button 
              onClick={handleRemove}
              className="px-4 py-2 rounded-full bg-red-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
            >
              Remove
            </button>
          </div>
        </div>
      )}

      {/* Header Info - Adjusted for absolute buttons */}
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 truncate max-w-[60%]">
          {plugin.vendor}
        </span>
        <span className={`text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest shrink-0 ${isInstrument ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
          {plugin.type}
        </span>
      </div>
      
      <h3 className="text-lg font-black tracking-tight leading-tight mb-2 font-outfit text-current">
        {plugin.name}
      </h3>
      
      <p className="text-[11px] font-medium opacity-70 leading-relaxed flex-grow mb-4">
        {plugin.description || pluginInfo.description}
      </p>

      {plugin.features && plugin.features.length > 0 && (
        <div className="mb-5">
          <ul className="text-[10px] font-medium opacity-50 list-disc pl-4 space-y-1.5">
            {plugin.features.map((feature, idx) => (
              <li key={idx}>{feature}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-auto pt-4 border-t border-white/10 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.15em] opacity-40">
        <span>v{plugin.version.slice(0, 5)}</span>
        <span>Est. {pluginInfo.year}</span>
      </div>
    </div>
  );
};
