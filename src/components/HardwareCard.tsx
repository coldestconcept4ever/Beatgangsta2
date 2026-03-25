import React, { useState } from 'react';
import { Hardware } from '../types';
import { X, Star, Drum, Settings } from 'lucide-react';

interface HardwareCardProps {
  item: Hardware;
  onRemove: (item: Hardware) => void;
  onToggleFavorite: (itemName: string) => void;
  onEdit?: (item: Hardware) => void;
  isFavorite: boolean;
  theme: string;
}

export const HardwareCard: React.FC<HardwareCardProps> = ({ item, onRemove, onToggleFavorite, onEdit, isFavorite, theme }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRemoving(true);
    setTimeout(() => {
      onRemove(item);
    }, 300);
  };

  return (
    <div className={`relative group flex flex-col items-center justify-center p-6 rounded-[2rem] border transition-all shadow-sm ${theme === 'coldest' ? 'bg-sky-50 border-sky-200' : 'bg-white/5 border-white/20'} ${isRemoving ? 'scale-90 opacity-0 duration-300' : ''}`}>
      <div className="absolute top-2.5 left-2.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-10">
        <button 
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(item.name); }}
          className={`p-1.5 rounded-full backdrop-blur-md shadow-sm transition-all ${isFavorite ? 'bg-yellow-400/90 text-yellow-900' : 'bg-black/20 text-white hover:bg-black/40'}`}
          title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
        >
          <Star size={12} className={isFavorite ? "fill-current" : ""} />
        </button>
      </div>
      <div className="absolute top-2.5 right-2.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-10">
        <button 
          onClick={(e) => { e.stopPropagation(); setShowConfirm(true); }}
          className="p-1.5 rounded-full bg-red-500/80 text-white hover:bg-red-600 backdrop-blur-md shadow-sm transition-all"
          title={`Remove ${item.type}`}
        >
          <X size={12} />
        </button>
      </div>

      {showConfirm && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 backdrop-blur-md rounded-[2rem] p-4 animate-in fade-in zoom-in duration-200">
          <div className="text-center">
            <p className="text-white text-xs font-bold mb-3">Remove {item.name}?</p>
            <div className="flex justify-center gap-2">
              <button 
                onClick={(e) => { e.stopPropagation(); setShowConfirm(false); }}
                className="px-3 py-1.5 rounded-full bg-white/20 text-white text-[10px] font-bold hover:bg-white/30 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleRemove}
                className="px-3 py-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold hover:bg-red-600 transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`w-12 h-12 mb-4 rounded-full flex items-center justify-center shadow-inner ${theme === 'coldest' ? 'bg-sky-200 text-sky-700' : 'bg-white/10 text-white'}`}>
        {item.type === 'drumkit' ? (
          <Drum size={24} />
        ) : item.type === 'instrument' ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
        )}
      </div>
      <h4 className="text-xs font-black text-center w-full px-2">{item.name}</h4>
      <span className="text-[9px] font-bold opacity-50 mt-1 uppercase tracking-widest">{item.vendor}</span>

      {item.type === 'drumkit' && onEdit && (
        <button 
          onClick={(e) => { e.stopPropagation(); onEdit(item); }}
          className={`mt-4 flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${theme === 'coldest' ? 'bg-sky-200 text-sky-800 hover:bg-sky-300' : 'bg-white/10 text-white hover:bg-white/20'}`}
        >
          <Settings size={12} />
          Edit Kit
        </button>
      )}
    </div>
  );
};
