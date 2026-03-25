
import React, { useState } from 'react';
import { SharedSession, VSTPlugin, AppTheme } from '../types';
import { categorizeAndCompareLibraries, ThinkingLevel } from '../services/geminiService';

interface CollaborationModalProps {
  session: SharedSession;
  myPlugins: VSTPlugin[];
  onClose: () => void;
  thinkingLevel: ThinkingLevel;
}

export const CollaborationModal: React.FC<CollaborationModalProps> = ({ session, myPlugins, onClose, thinkingLevel }) => {
  const { recipe, senderPlugins, senderName } = session;
  const [categorizedData, setCategorizedData] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const hasPlugin = (name: string) => {
    return myPlugins.some(p => p.name.toLowerCase().includes(name.toLowerCase()));
  };

  const handleNeuralSort = async () => {
    setIsAnalyzing(true);
    try {
      const data = await categorizeAndCompareLibraries(senderPlugins, myPlugins, thinkingLevel);
      setCategorizedData(data);
    } catch (err: any) {
      console.error("Neural sort failed:", err);
      if (err?.message?.includes("API_KEY_MISSING") || err?.message?.includes("401") || err?.message?.includes("403")) {
        alert("Your API key is missing or invalid. Please update it in the main menu.");
      } else {
        alert("Failed to analyze racks. Gemini might be busy.");
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-2 sm:p-8 bg-black/80 backdrop-blur-3xl animate-in fade-in duration-500 overflow-hidden">
      <div className="w-full max-w-7xl h-[95vh] flex flex-col bg-[#050505] rounded-[3rem] sm:rounded-[5rem] border border-white/10 shadow-[0_0_100px_rgba(0,0,0,1)] relative overflow-hidden">
        
        {/* Top Header */}
        <header className="flex items-center justify-between px-8 sm:px-12 py-6 sm:py-8 border-b border-white/5 bg-black/40">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <h2 className="text-xl sm:text-3xl font-black text-white tracking-tighter uppercase italic">
                Sync Session: {recipe.title}
              </h2>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-orange-500">
                Shared by {senderName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={handleNeuralSort}
              disabled={isAnalyzing}
              className={`px-6 py-3 rounded-full font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all ${isAnalyzing ? 'bg-orange-500/20 text-orange-500' : 'bg-orange-500 text-white hover:scale-105 active:scale-95'}`}
            >
              {isAnalyzing ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Neural Sorting...
                </>
              ) : (
                <>
                  <span className="text-sm">🧠</span> Gemini Neural Sort
                </>
              )}
            </button>
            <button onClick={onClose} className="p-3 rounded-2xl bg-white/5 text-white hover:bg-red-500 transition-all">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </header>

        {/* Side-by-Side Deck */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* Left Deck: Sender's Rig */}
          <div className="flex-1 flex flex-col border-b lg:border-b-0 lg:border-r border-white/5 overflow-hidden">
            <div className="px-8 py-4 bg-white/5 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">{senderName}'s Rig</span>
              <span className="text-[10px] font-black text-white/60 uppercase">{senderPlugins.length} Plugins Found</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
              {categorizedData ? (
                /* Categorized View */
                categorizedData.categories.map((cat: any, i: number) => (
                  <div key={i} className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-orange-500 border-b border-orange-500/20 pb-2 flex items-center gap-2">
                       <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_10px_#f97316]" />
                       {cat.categoryName}
                    </h3>
                    <div className="grid grid-cols-1 gap-2">
                      {cat.senderPlugins.map((p: string, j: number) => (
                        <div key={j} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                           <span className="text-[10px] font-bold text-white/80">{p}</span>
                           {cat.missingFromReceiver.includes(p) ? (
                              <span className="text-[7px] font-black uppercase text-red-400 bg-red-400/10 px-2 py-0.5 rounded">You Missing</span>
                           ) : (
                              <span className="text-[7px] font-black uppercase text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">You Have</span>
                           )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                /* Flat List View */
                <>
                  <h3 className="text-xs font-black text-orange-500 uppercase tracking-widest mb-4">Recipe Chain</h3>
                  {recipe.ingredients.map((ing, i) => (
                    <div key={i} className="p-6 bg-white/5 rounded-3xl border border-white/10">
                       <p className="text-xs font-black text-white mb-4">{ing.instrument}</p>
                       <div className="space-y-3">
                         {ing.processing.map((proc, j) => (
                           <div key={j} className="flex items-center justify-between">
                             <span className="text-xs text-white/80 font-bold">{proc.pluginName}</span>
                             {hasPlugin(proc.pluginName) ? (
                               <span className="text-[8px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-black uppercase">Owned</span>
                             ) : (
                               <span className="text-[8px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-black uppercase">Missing</span>
                             )}
                           </div>
                         ))}
                       </div>
                    </div>
                  ))}
                  
                  <div className="pt-8 border-t border-white/5">
                     <h3 className="text-xs font-black text-white/40 uppercase tracking-widest mb-4">Full Gear Library</h3>
                     <div className="grid grid-cols-2 gap-2">
                       {senderPlugins.map((p, i) => (
                         <div key={i} className="p-3 bg-white/5 rounded-xl border border-white/5 text-[9px] font-bold text-white/60 truncate">
                            {p.name}
                         </div>
                       ))}
                     </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right Deck: My Rig */}
          <div className="flex-1 flex flex-col overflow-hidden bg-black/20">
            <div className="px-8 py-4 bg-white/5 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Your Local Rig</span>
              <span className="text-[10px] font-black text-white/60 uppercase">{myPlugins.length} Active Modules</span>
            </div>
            <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {myPlugins.map((p, i) => (
                  <div key={i} className="p-4 bg-white/5 rounded-[1.5rem] border border-white/10 hover:border-white/20 transition-all group">
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-[8px] font-black text-white/40 uppercase truncate max-w-[80px]">{p.vendor}</span>
                       <span className="text-[7px] text-white/20 font-black uppercase">{p.type}</span>
                    </div>
                    <p className="text-xs font-bold text-white group-hover:text-sky-400 transition-colors">{p.name}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <footer className="px-12 py-8 border-t border-white/5 bg-black/60 flex items-center justify-center">
          <p className="text-[9px] font-black text-white/20 uppercase tracking-[1em]">BeatGangsta Collab Link Active</p>
        </footer>
      </div>
    </div>
  );
};
