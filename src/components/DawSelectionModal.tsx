import React from 'react';
import { AppTheme } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2 } from 'lucide-react';

interface DawSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (daw: string | null) => void;
  initialDaw: string | null;
  theme: AppTheme;
}

export const DawSelectionModal: React.FC<DawSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  initialDaw,
  theme
}) => {
  const [selected, setSelected] = React.useState<string | null>(initialDaw);

  React.useEffect(() => {
    if (isOpen) {
      setSelected(initialDaw);
    }
  }, [isOpen, initialDaw]);

  if (!isOpen) return null;

  const handleContinue = () => {
    onSelect(selected);
  };

  const daws = [
    { id: 'Ableton Live', name: 'Ableton Live', desc: 'Standard MIDI & Plugin support' },
    { id: 'Logic Pro', name: 'Logic Pro', desc: 'Standard MIDI & AU support' },
    { id: 'Studio One', name: 'Studio One', desc: 'Supports .audioloop drag & drop' },
    { id: 'FL Studio', name: 'FL Studio', desc: 'Standard MIDI support' },
    { id: 'Reaper', name: 'Reaper', desc: 'Supports .ini plugin list upload' },
    { id: 'Pro Tools', name: 'Pro Tools', desc: 'Standard MIDI support' },
    { id: 'Cubase', name: 'Cubase', desc: 'Standard MIDI support' },
    { id: 'Bitwig Studio', name: 'Bitwig Studio', desc: 'Standard MIDI support' },
    { id: 'Other', name: 'Other / Skip', desc: 'Standard MIDI support' }
  ];

  const containerClasses = theme === 'coldest' 
    ? "bg-white/95 border-white text-[#0c4a6e]" 
    : theme === 'hustle-time'
    ? "bg-black/95 border-yellow-500/30 text-yellow-50"
    : "bg-black/95 border-red-900/50 text-red-50";

  const buttonClasses = (id: string | null) => {
    const active = selected === id;
    if (theme === 'coldest') {
      return active 
        ? "bg-sky-500 text-white shadow-lg scale-105" 
        : "bg-black/5 text-sky-900 hover:bg-black/10";
    } else if (theme === 'hustle-time') {
      return active 
        ? "bg-yellow-500 text-black shadow-lg shadow-yellow-900/40 scale-105" 
        : "bg-white/5 text-yellow-400 hover:bg-white/10";
    } else {
      return active 
        ? "bg-red-600 text-white shadow-lg shadow-red-900/40 scale-105" 
        : "bg-white/5 text-red-400 hover:bg-white/10";
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
          onClick={onClose}
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`relative w-full max-w-2xl rounded-[3rem] p-8 sm:p-10 border shadow-2xl overflow-hidden ${containerClasses}`}
        >
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full hover:bg-black/5 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="mb-8">
            <h2 className="text-3xl font-black tracking-tighter mb-2">Let's Locate Your Plugin List</h2>
            <p className="text-sm font-bold opacity-60">
              Import your plugin library to create your gear rack
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            {daws.filter(d => d.id !== 'Other').map((daw) => (
              <button
                key={daw.id}
                onClick={() => setSelected(daw.id)}
                className={`flex flex-col items-center justify-center py-4 px-2 rounded-xl transition-all text-center h-full ${buttonClasses(daw.id)}`}
              >
                <h3 className="font-black text-[10px] uppercase tracking-widest leading-tight">{daw.name}</h3>
              </button>
            ))}
          </div>

          <button
            onClick={() => setSelected(null)}
            className={`w-full py-4 rounded-xl transition-all text-center mb-8 ${buttonClasses(null)}`}
          >
            <h3 className="font-black text-[10px] uppercase tracking-widest">Other / Skip</h3>
          </button>

          <button
            onClick={handleContinue}
            className={`w-full py-4 rounded-full font-black text-xs uppercase tracking-[0.3em] transition-all shadow-xl active:scale-95 ${
              theme === 'coldest' ? 'bg-sky-500 text-white hover:bg-sky-600' : 
              theme === 'hustle-time' ? 'bg-yellow-500 text-black hover:bg-yellow-400' : 
              'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            Continue to Equipment
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
