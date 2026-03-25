
import React, { useState, useRef } from 'react';
import { SavedRecipe, AppTheme, Folder, VSTPlugin, SharedSession, FullSaveFile, SavedCritique, MixCritique } from '../types';
import { equipmentDetails } from '../data/equipmentDetails';

interface VaultProps {
  theme: AppTheme;
  recipes: SavedRecipe[];
  critiques: SavedCritique[];
  folders: Folder[];
  onRemove: (id: string) => void;
  onRemoveCritique: (id: string) => void;
  onUpdateColor: (id: string, color: string) => void;
  onUpdateFolder: (id: string, folderId: string) => void;
  onAddFolder: (name: string) => void;
  onRemoveFolder: (id: string) => void;
  onUpdateFolderColor: (id: string, color: string) => void;
  onOpen: (recipe: SavedRecipe) => void;
  onOpenCritique: (critique: SavedCritique) => void;
  onExportRig: (recipe?: SavedRecipe) => void;
  onImportRig: (session: SharedSession) => void;
  onShare: (session: SharedSession) => void;
  onClose: () => void;
  allPlugins: VSTPlugin[];
  userName: string;
  friendMode?: boolean;
  importedSaveFile?: FullSaveFile | null;
  onReplicateRecipe?: (recipe: SavedRecipe) => void;
  isReplicating?: boolean;
}

const getContrastColor = (hexcolor: string) => {
  if (!hexcolor || hexcolor.length < 7) return 'white';
  const r = parseInt(hexcolor.substring(1, 3), 16);
  const g = parseInt(hexcolor.substring(3, 5), 16);
  const b = parseInt(hexcolor.substring(5, 7), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? 'black' : 'white';
};

export const Vault: React.FC<VaultProps> = ({ 
  theme, 
  recipes, 
  critiques,
  folders,
  onRemove, 
  onRemoveCritique,
  onUpdateColor, 
  onUpdateFolder,
  onAddFolder,
  onRemoveFolder,
  onUpdateFolderColor,
  onOpen, 
  onOpenCritique,
  onExportRig,
  onImportRig,
  onShare,
  onClose,
  allPlugins,
  userName,
  friendMode,
  importedSaveFile,
  onReplicateRecipe,
  isReplicating
}) => {
  const [activeTab, setActiveTab] = useState<'recipes' | 'critiques'>('recipes');
  const [activeFolderId, setActiveFolderId] = useState<string | 'all'>('all');

  const activeRecipes = friendMode && importedSaveFile ? importedSaveFile.vault.recipes : recipes;
  const activeFolders = friendMode && importedSaveFile ? importedSaveFile.vault.folders : folders;

  const recipeCardStyles = {
    'coldest': 'bg-white/40 border-white/60 hover:bg-white/60 text-[#082f49]',
    'crazy-bird': 'bg-red-950/20 border-red-900/40 hover:bg-red-950/40 text-red-50',
    'hustle-time': 'bg-zinc-950/20 border-yellow-900/40 hover:bg-zinc-950/40 text-yellow-50'
  };

  const rStyle = recipeCardStyles[theme] || recipeCardStyles.coldest;

  const containerClasses = theme === 'coldest' 
    ? "bg-white/80 backdrop-blur-2xl border-white/60 text-[#082f49] shadow-[0_8px_30px_rgba(0,0,0,0.12)]" 
    : theme === 'crazy-bird'
    ? "bg-[#0a0000]/95 border-red-900/50 text-red-50"
    : "bg-black/95 border-yellow-900/50 text-yellow-50";

  const filteredRecipes = activeFolderId === 'all' 
    ? activeRecipes 
    : activeRecipes.filter(r => r.folderId === activeFolderId);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-6 bg-black/60 backdrop-blur-xl animate-in fade-in duration-300">
      <div className={`w-full max-w-6xl h-[95vh] lg:max-h-[90vh] overflow-hidden flex flex-col rounded-[2rem] sm:rounded-[4rem] border shadow-2xl relative ${containerClasses} transition-colors duration-700`}>
        <button id="btn-close-vault" onClick={onClose} className="absolute top-4 right-4 sm:top-8 sm:right-8 p-2 rounded-full hover:bg-black/5 transition-all z-20">
           <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
          {/* Sidebar */}
          <aside className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-black/5 p-4 sm:p-6 lg:p-8 flex flex-col gap-4 lg:gap-6 flex-shrink-0">
            <header className="pr-10 lg:pr-0">
              <h2 className="text-xl sm:text-2xl font-black tracking-tighter mb-1">Vault</h2>
              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest opacity-60">Session Records</p>
            </header>

            <div className="flex flex-col gap-2 mt-4">
              <button
                onClick={() => setActiveTab('recipes')}
                className={`w-full px-6 py-4 rounded-2xl text-left font-black text-xs uppercase tracking-widest transition-all flex items-center justify-between ${
                  activeTab === 'recipes' 
                    ? (theme === 'coldest' ? 'bg-sky-500 text-white shadow-lg' : 'bg-white text-black shadow-lg')
                    : (theme === 'coldest' ? 'hover:bg-black/5' : 'hover:bg-white/5')
                }`}
              >
                <span>Recipes</span>
                <span className="opacity-40">{activeRecipes.length}</span>
              </button>
              <button
                onClick={() => setActiveTab('critiques')}
                className={`w-full px-6 py-4 rounded-2xl text-left font-black text-xs uppercase tracking-widest transition-all flex items-center justify-between ${
                  activeTab === 'critiques' 
                    ? (theme === 'coldest' ? 'bg-sky-500 text-white shadow-lg' : theme === 'crazy-bird' ? 'bg-white text-black shadow-lg' : 'bg-yellow-500 text-black shadow-lg')
                    : (theme === 'coldest' ? 'hover:bg-black/5' : 'hover:bg-white/5')
                }`}
              >
                <span>Critiques</span>
                <span className="opacity-40">{critiques.length}</span>
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-8 lg:p-12">
              <>
                <header className="mb-6 sm:mb-12">
                  <h2 className="text-2xl sm:text-4xl font-black tracking-tighter mb-1 sm:mb-2">
                    {friendMode ? `${importedSaveFile?.userProfile.name}'s Vault` : 'Studio Vault'}
                  </h2>
                  <p className="text-[10px] sm:text-sm font-black uppercase tracking-[0.3em] opacity-60">
                    {friendMode ? 'Shared Intelligence' : 'Architecture Repository'}
                  </p>
                </header>

                <div className="grid grid-cols-1 gap-4 sm:gap-6">
                  {activeTab === 'recipes' ? (
                    filteredRecipes.length === 0 ? (
                      <div className="py-20 text-center opacity-40">
                        <p className="text-xl font-black italic">No recipes in this sector.</p>
                      </div>
                    ) : (
                      filteredRecipes.map((recipe) => (
                        <div key={recipe.id} className={`group relative flex items-center gap-4 sm:gap-6 p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2.5rem] border transition-all duration-300 ${rStyle}`}>
                          <div 
                            onClick={() => onOpen(recipe)}
                            className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex-shrink-0 cursor-pointer transition-transform hover:scale-110 shadow-xl border-4 border-white/40 flex items-center justify-center"
                            style={{ backgroundColor: recipe.bubbleColor }}
                          >
                            <span className="text-sm sm:text-xl font-black" style={{ color: getContrastColor(recipe.bubbleColor) }}>
                              {recipe.title.charAt(0)}
                            </span>
                          </div>

                          <div className="flex-1 overflow-hidden">
                            <div className="flex items-center gap-2">
                              <h3 onClick={() => onOpen(recipe)} className="text-sm sm:text-lg font-black tracking-tight truncate cursor-pointer hover:underline">
                                {recipe.title}
                              </h3>
                            </div>
                            <div className="marquee-container overflow-hidden whitespace-nowrap">
                              <p className="marquee text-xs opacity-70 animate-marquee">{equipmentDetails[recipe.title] || recipe.description}</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 mt-1 text-[8px] sm:text-[10px] font-black uppercase tracking-widest opacity-80">
                              <span>{recipe.style}</span>
                              {recipe.artistTypes && recipe.artistTypes.length > 0 && (
                                <>
                                  <span className="w-1 h-1 rounded-full bg-current opacity-20" />
                                  <span className="italic text-orange-500">{recipe.artistTypes.join(', ')}</span>
                                </>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-3 mt-3">
                              <div className="relative w-5 h-5 rounded-full overflow-hidden border border-black/10">
                                <input type="color" value={recipe.bubbleColor} onChange={(e) => onUpdateColor(recipe.id, e.target.value)} className="absolute inset-[-10px] w-[200%] h-[200%] cursor-pointer bg-transparent border-none p-0" />
                              </div>
                              <span className="text-[7px] sm:text-[9px] font-black uppercase tracking-widest opacity-50">RGB Shift</span>
                            </div>
                          </div>

                          <div className="flex gap-2">
                             {friendMode && onReplicateRecipe ? (
                               <button 
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   onReplicateRecipe(recipe);
                                 }} 
                                 disabled={isReplicating}
                                 className={`px-4 py-2.5 rounded-2xl bg-indigo-500 text-white shadow-lg active:scale-95 transition-all text-xs font-black uppercase tracking-wider hover:bg-indigo-600 ${isReplicating ? 'opacity-50 cursor-not-allowed' : ''}`}
                                 title="Replicate with My Gear"
                               >
                                 {isReplicating ? 'Replicating...' : 'Replicate'}
                               </button>
                             ) : (
                               <>
                                 <button onClick={(e) => { e.stopPropagation(); onRemove(recipe.id); }} className="p-2.5 rounded-2xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all active:scale-90">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                 </button>
                               </>
                             )}
                          </div>
                        </div>
                      ))
                    )
                  ) : (
                    critiques.length === 0 ? (
                      <div className="py-20 text-center opacity-40">
                        <p className="text-xl font-black italic">No critiques in this sector.</p>
                      </div>
                    ) : (
                      critiques.map((critique) => (
                        <div key={critique.id} className={`group relative flex items-center gap-4 sm:gap-6 p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2.5rem] border transition-all duration-300 ${rStyle}`}>
                          <div 
                            onClick={() => onOpenCritique(critique)}
                            className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex-shrink-0 cursor-pointer transition-transform hover:scale-110 shadow-xl border-4 border-white/40 flex items-center justify-center ${theme === 'coldest' ? 'bg-sky-500' : theme === 'crazy-bird' ? 'bg-red-500' : 'bg-yellow-500'}`}
                          >
                            <span className="text-sm sm:text-xl font-black text-white">
                              🎧
                            </span>
                          </div>

                          <div className="flex-1 overflow-hidden">
                            <div className="flex items-center gap-2">
                              <h3 onClick={() => onOpenCritique(critique)} className="text-sm sm:text-lg font-black tracking-tight truncate cursor-pointer hover:underline">
                                {critique.title}
                              </h3>
                            </div>
                            <p className="text-xs opacity-70 truncate">{critique.overallFeedback}</p>
                            <div className="flex flex-wrap items-center gap-3 mt-1 text-[8px] sm:text-[10px] font-black uppercase tracking-widest opacity-80">
                              <span className={`${theme === 'coldest' ? 'text-sky-500' : theme === 'crazy-bird' ? 'text-red-500' : 'text-yellow-500'}`}>{critique.isGangstaVox ? 'Vocal Critique' : 'Beat Critique'}</span>
                              <span className="w-1 h-1 rounded-full bg-current opacity-20" />
                              <span>{new Date(critique.savedAt).toLocaleDateString()}</span>
                            </div>
                          </div>

                          <div className="flex gap-2">
                             <button onClick={(e) => { e.stopPropagation(); onRemoveCritique(critique.id); }} className="p-2.5 rounded-2xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all active:scale-90">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                             </button>
                          </div>
                        </div>
                      ))
                    )
                  )}
                </div>
              </>
          </main>
        </div>
      </div>
    </div>
  );
};
