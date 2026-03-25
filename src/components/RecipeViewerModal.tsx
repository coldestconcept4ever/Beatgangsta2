
import React from 'react';
import { SavedRecipe, AppTheme, VSTPlugin, Hardware, BeatRecipe } from '../types';
import { RecipeCard } from './RecipeCard';

interface RecipeViewerModalProps {
  recipe: SavedRecipe;
  theme: AppTheme;
  onClose: () => void;
  plugins?: VSTPlugin[];
  analogHardware?: Hardware[];
  drumKits?: Hardware[];
  dawType?: string | null;
  onCloudBackupRecipe?: (recipe: BeatRecipe) => Promise<void>;
}

export const RecipeViewerModal: React.FC<RecipeViewerModalProps> = ({ recipe, theme, onClose, plugins = [], analogHardware = [], drumKits = [], dawType, onCloudBackupRecipe }) => {
  return (
    <div className="fixed inset-0 z-[300] flex items-start justify-center p-4 sm:p-12 lg:p-20 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300 overflow-y-auto">
      <div className="w-full max-w-7xl my-auto relative flex flex-col gap-4">
        <div className="flex justify-end">
          <button 
            onClick={onClose} 
            className={`p-3 rounded-full transition-all hover:bg-red-500 hover:text-white active:scale-90 shadow-lg border ${
              theme === 'coldest' ? 'bg-white text-slate-900 border-slate-200' : 'bg-black/50 text-white border-white/10'
            }`}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <RecipeCard 
          recipe={recipe} 
          isSaved={true} 
          onSave={() => {}} 
          theme={theme} 
          plugins={plugins}
          analogHardware={analogHardware}
          drumKits={drumKits}
          dawType={dawType}
          onCloudBackupRecipe={onCloudBackupRecipe}
        />
      </div>
    </div>
  );
};
