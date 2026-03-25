import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { VSTPlugin, AppTheme } from '../types';
import { X, Music, Speaker, Box } from 'lucide-react';

interface TrashModalProps {
  isOpen: boolean;
  onClose: () => void;
  deletedPlugins: VSTPlugin[];
  deletedInstruments: string[];
  deletedHardware: string[];
  onRestorePlugin: (plugin: VSTPlugin) => void;
  onRestoreInstrument: (instrument: string) => void;
  onRestoreHardware: (hardware: string) => void;
  onEmptyTrash: () => void;
  theme: AppTheme;
}

export const TrashModal: React.FC<TrashModalProps> = ({ 
  isOpen, 
  onClose, 
  deletedPlugins, 
  deletedInstruments,
  deletedHardware,
  onRestorePlugin, 
  onRestoreInstrument,
  onRestoreHardware,
  onEmptyTrash, 
  theme 
}) => {
  const [activeTab, setActiveTab] = useState<'plugins' | 'instruments' | 'hardware'>('plugins');

  const getCount = (type: 'plugins' | 'instruments' | 'hardware') => {
    switch (type) {
      case 'plugins': return deletedPlugins.length;
      case 'instruments': return deletedInstruments.length;
      case 'hardware': return deletedHardware.length;
    }
  };

  const isEmpty = deletedPlugins.length === 0 && deletedInstruments.length === 0 && deletedHardware.length === 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            onClick={onClose} 
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className={`relative w-full max-w-4xl max-h-[80vh] flex flex-col rounded-[2rem] sm:rounded-[3rem] border shadow-2xl overflow-hidden ${theme === 'coldest' ? 'bg-white/90 border-white/60 text-slate-800' : 'bg-[#111]/90 border-white/10 text-white'}`}
          >
        <div className="p-6 sm:p-8 border-b border-black/10 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-black">Trash</h2>
            {!isEmpty && (
              <div className="flex gap-2 bg-black/5 p-1 rounded-full">
                {(['plugins', 'instruments', 'hardware'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === tab ? (theme === 'coldest' ? 'bg-sky-500 text-white' : 'bg-white text-black') : 'opacity-50 hover:opacity-100'}`}
                  >
                    {tab} ({getCount(tab)})
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-4 items-center">
            {!isEmpty && (
              <button onClick={onEmptyTrash} className="text-xs font-bold text-red-500 hover:text-red-400 uppercase tracking-widest transition-colors">Empty Trash</button>
            )}
            <button onClick={onClose} className="p-2 rounded-full hover:bg-black/10 transition-colors"><X size={20} /></button>
          </div>
        </div>
        
        <div className="flex-grow overflow-y-auto p-6 sm:p-8">
          {isEmpty ? (
            <div className="text-center opacity-50 py-12 flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-black/5 flex items-center justify-center">
                <X size={32} className="opacity-50" />
              </div>
              <p className="text-sm font-bold">Trash is empty.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {activeTab === 'plugins' && deletedPlugins.map((plugin, idx) => (
                <div key={idx} className={`p-4 rounded-2xl border flex justify-between items-center ${theme === 'coldest' ? 'bg-white/50 border-white/40' : 'bg-black/20 border-white/5'}`}>
                  <div className="flex items-center gap-3 pr-4 overflow-hidden">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${theme === 'coldest' ? 'bg-sky-100 text-sky-600' : 'bg-white/10 text-white'}`}>
                      <Box size={14} />
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-50 truncate">{plugin.vendor}</span>
                      <span className="text-sm font-bold truncate">{plugin.name}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => onRestorePlugin(plugin)}
                    className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all hover:scale-105 active:scale-95 ${theme === 'coldest' ? 'bg-sky-500 text-white' : 'bg-white text-black'}`}
                  >
                    Restore
                  </button>
                </div>
              ))}

              {activeTab === 'instruments' && deletedInstruments.map((inst, idx) => (
                <div key={idx} className={`p-4 rounded-2xl border flex justify-between items-center ${theme === 'coldest' ? 'bg-white/50 border-white/40' : 'bg-black/20 border-white/5'}`}>
                  <div className="flex items-center gap-3 pr-4 overflow-hidden">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${theme === 'coldest' ? 'bg-sky-100 text-sky-600' : 'bg-white/10 text-white'}`}>
                      <Music size={14} />
                    </div>
                    <span className="text-sm font-bold truncate">{inst}</span>
                  </div>
                  <button 
                    onClick={() => onRestoreInstrument(inst)}
                    className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all hover:scale-105 active:scale-95 ${theme === 'coldest' ? 'bg-sky-500 text-white' : 'bg-white text-black'}`}
                  >
                    Restore
                  </button>
                </div>
              ))}

              {activeTab === 'hardware' && deletedHardware.map((hw, idx) => (
                <div key={idx} className={`p-4 rounded-2xl border flex justify-between items-center ${theme === 'coldest' ? 'bg-white/50 border-white/40' : 'bg-black/20 border-white/5'}`}>
                  <div className="flex items-center gap-3 pr-4 overflow-hidden">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${theme === 'coldest' ? 'bg-sky-100 text-sky-600' : 'bg-white/10 text-white'}`}>
                      <Speaker size={14} />
                    </div>
                    <span className="text-sm font-bold truncate">{hw}</span>
                  </div>
                  <button 
                    onClick={() => onRestoreHardware(hw)}
                    className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all hover:scale-105 active:scale-95 ${theme === 'coldest' ? 'bg-sky-500 text-white' : 'bg-white text-black'}`}
                  >
                    Restore
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
  );
};
