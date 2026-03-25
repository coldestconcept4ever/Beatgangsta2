import React, { useState, useRef, useEffect } from 'react';
import { BeatRecipe, AppTheme, VSTPlugin, Hardware } from '../types';
import { DrumPatternDisplay } from './DrumPatternDisplay';

// Dynamic import for react-dom/server
const getRenderToStaticMarkup = () => import('react-dom/server').then(m => m.renderToStaticMarkup);
import { RecipeHTMLTemplate } from './RecipeHTMLTemplate';
import { motion } from 'motion/react';
import { Loader2, Download, Music, Save, Cloud, Search, FileCode } from 'lucide-react';
import { getSpecificMixHelp } from '../services/geminiService';
import { MidiDraggableButton } from './MidiDraggableButton';
import { isMidiCapable } from '../utils/midiGenerator';
import { generateAllMidiZip } from '../utils/exportAllMidi';

interface RecipeCardProps {
  recipe: BeatRecipe;
  isSaved: boolean;
  onSave: (recipe: BeatRecipe) => void;
  theme?: AppTheme;
  dawType?: string | null;
  plugins?: VSTPlugin[];
  analogHardware?: Hardware[];
  drumKits?: Hardware[];
  onCloudBackupRecipe?: (recipe: BeatRecipe) => Promise<void>;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, isSaved, onSave, theme = 'coldest', dawType, plugins = [], analogHardware = [], drumKits = [], onCloudBackupRecipe }) => {
  const [expanded, setExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [showGangstaVox, setShowGangstaVox] = useState(false);

  useEffect(() => {
    if (recipe.isGangstaVox && recipe.gangstaVox) {
      setShowGangstaVox(true);
    }
  }, [recipe.isGangstaVox, recipe.gangstaVox]);

  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const toggleGangstaVox = () => {
    setShowGangstaVox(!showGangstaVox);
  };

  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [specificHelpQuery, setSpecificHelpQuery] = useState('');
  const [isLoadingSpecificHelp, setIsLoadingSpecificHelp] = useState(false);
  const [specificHelpResults, setSpecificHelpResults] = useState<any[]>(recipe.specificHelp || []);

  const handleSpecificHelpSearch = async () => {
    if (!specificHelpQuery.trim()) return;
    setIsLoadingSpecificHelp(true);
    try {
      // Create a context string from the recipe
      const context = `
        Title: ${recipe.title}
        Style: ${recipe.style}
        BPM: ${recipe.bpm}
        Description: ${recipe.description}
        Instruments: ${recipe.instruments.map(i => i.name).join(', ')}
      `;

      const result = await getSpecificMixHelp(
        plugins, 
        recipe.audioBase64, 
        recipe.mimeType, 
        specificHelpQuery, 
        recipe.isGangstaVox,
        context
      );
      setSpecificHelpResults(prev => [result, ...prev]);
      setSpecificHelpQuery('');
    } catch (err) {
      console.error("Specific help search failed:", err);
    } finally {
      setIsLoadingSpecificHelp(false);
    }
  };

  const handleExportHTML = async () => {
    try {
      console.log("Starting HTML Export...");
      const renderToStaticMarkup = await getRenderToStaticMarkup();
      const htmlContent = renderToStaticMarkup(<RecipeHTMLTemplate recipe={recipe} drumKits={drumKits} />);
      
      const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${recipe.title} - Production Manual</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', sans-serif; background-color: #0f172a; color: #f8fafc; }
    @media print {
      body { background-color: white !important; color: black !important; }
      .print-break { page-break-before: always; }
      .no-print { display: none !important; }
      * { border-color: #e2e8f0 !important; }
    }
  </style>
</head>
<body class="antialiased min-h-screen p-4 md:p-8 lg:p-12">
  <div class="max-w-5xl mx-auto bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-800">
    ${htmlContent}
  </div>
</body>
</html>`;

      const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${recipe.title.replace(/\s+/g, '_')}_Manual.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      console.log(`HTML Export complete`);
    } catch (error) {
      console.error("HTML Export failed:", error);
      alert("Failed to export HTML. Please try again.");
    }
  };

  const handleSave = async () => {
    onSave(recipe);
    if (onCloudBackupRecipe) {
      setIsCloudSyncing(true);
      try {
        await onCloudBackupRecipe(recipe);
      } finally {
        setIsCloudSyncing(false);
      }
    }
  };

  const handleDownloadAllMidi = async () => {
    const isStudioOne = dawType === 'Studio One';
    const zipName = isStudioOne ? 'Audioloops' : 'MIDI';

    try {
      setIsDownloadingAll(true);
      const zipBlob = await generateAllMidiZip(recipe, dawType);
      const downloadUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${recipe.title.replace(/\s+/g, '_')}_All_${zipName}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 100);
    } catch (error) {
      console.error("Failed to generate MIDI ZIP:", error);
      alert("Failed to generate ZIP file.");
    } finally {
      setIsDownloadingAll(false);
    }
  };

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  return (
    <motion.div 
      className={`rounded-[32px] sm:rounded-[48px] p-6 sm:p-12 border transition-all ${
        theme === 'coldest' 
          ? 'bg-white/90 backdrop-blur-3xl border-sky-200 text-sky-950 shadow-[0_20px_50px_rgba(14,165,233,0.15)]' 
          : theme === 'crazy-bird' 
          ? 'bg-black/80 backdrop-blur-3xl border-red-900/50 text-red-50 shadow-[0_0_50px_rgba(153,27,27,0.3)]' 
          : theme === 'hustle-time'
          ? 'bg-zinc-950 backdrop-blur-3xl border-yellow-500/30 text-yellow-50 shadow-[0_20px_60px_rgba(234,179,8,0.1)]'
          : 'bg-white/90 border-white/20 text-slate-900 shadow-2xl'
      }`}
    >
      <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
        <div>
          <h3 className={`text-3xl sm:text-4xl font-black tracking-tighter mb-2 font-outfit ${theme === 'coldest' ? 'text-sky-900' : 'text-current'}`}>{recipe.title}</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
              theme === 'coldest' ? 'bg-sky-100 text-sky-800 border border-sky-200' : 
              theme === 'crazy-bird' ? 'bg-red-950/50 text-red-400 border border-red-900/50' :
              theme === 'hustle-time' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/30' :
              'bg-black/5'
            }`}>{recipe.style}</span>
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
              theme === 'coldest' ? 'bg-sky-100 text-sky-800 border border-sky-200' : 
              theme === 'crazy-bird' ? 'bg-red-950/50 text-red-400 border border-red-900/50' :
              theme === 'hustle-time' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/30' :
              'bg-black/5'
            }`}>{recipe.bpm} BPM</span>
            {recipe.recommendedScale && (
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                theme === 'coldest' ? 'bg-orange-100 text-orange-800 border border-orange-200' : 
                theme === 'crazy-bird' ? 'bg-orange-950/50 text-orange-400 border border-orange-900/50' :
                theme === 'hustle-time' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/30' :
                'bg-orange-500/20 text-orange-600'
              }`}>Scale: {recipe.recommendedScale}</span>
            )}
            {recipe.chordProgression && (
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                theme === 'coldest' ? 'bg-sky-100 text-sky-800 border border-sky-200' : 
                theme === 'crazy-bird' ? 'bg-red-950/50 text-red-400 border border-red-900/50' :
                theme === 'hustle-time' ? 'bg-sky-500/10 text-sky-500 border border-sky-500/30' :
                'bg-sky-500/20 text-sky-600'
              }`}>Chords: {recipe.chordProgression}</span>
            )}
          </div>
          <p className="text-sm font-bold opacity-70 max-w-2xl leading-relaxed">{recipe.description}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <button 
              id="btn-export-html"
              onClick={handleExportHTML}
              className={`w-full sm:w-auto px-8 py-4 rounded-full font-black text-xs uppercase tracking-widest transition-all shadow-xl hover:scale-105 active:scale-95 flex items-center gap-2 justify-center ${
                theme === 'coldest' ? 'bg-slate-800 text-white hover:bg-slate-900' :
                theme === 'crazy-bird' ? 'bg-red-600 text-white hover:bg-red-700' :
                theme === 'hustle-time' ? 'bg-zinc-800 text-white hover:bg-zinc-900' :
                'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <FileCode className="w-4 h-4" />
              Save HTML
            </button>
          </div>
          <button 
            onClick={handleDownloadAllMidi}
            disabled={isDownloadingAll || isLoading}
            className={`w-full sm:w-auto px-8 py-4 rounded-full font-black text-xs uppercase tracking-widest transition-all shadow-xl hover:scale-105 active:scale-95 flex items-center gap-2 justify-center ${
              theme === 'coldest' ? 'bg-sky-600 text-white hover:bg-sky-700' :
              theme === 'crazy-bird' ? 'bg-red-800 text-white hover:bg-red-900' :
              theme === 'hustle-time' ? 'bg-yellow-600 text-black hover:bg-yellow-700' :
              'bg-sky-500/20 text-sky-400 hover:bg-sky-500/30'
            }`}
          >
            {isDownloadingAll || isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Music className="w-4 h-4" />}
            {isDownloadingAll || isLoading ? 'Preparing...' : dawType === 'Studio One' ? 'Download All .audioloop' : 'Download All MIDI'}
          </button>
          <button 
            id="btn-save-recipe"
            onClick={handleSave}
            disabled={isSaved || isLoading || isCloudSyncing}
            className={`w-full sm:w-auto px-8 py-4 rounded-full font-black text-xs uppercase tracking-widest transition-all shadow-xl hover:scale-105 active:scale-95 flex items-center gap-2 justify-center ${
              isSaved 
                ? 'bg-black/10 text-current opacity-50 shadow-none' 
                : theme === 'coldest' ? 'bg-gradient-to-b from-sky-400 to-sky-500 text-white shadow-[0_4px_15px_rgba(14,165,233,0.4)] border border-sky-400' :
                  theme === 'crazy-bird' ? 'bg-gradient-to-b from-red-500 to-red-600 text-white shadow-[0_4px_15px_rgba(220,38,38,0.4)] border border-red-500' :
                  theme === 'hustle-time' ? 'bg-gradient-to-b from-yellow-400 to-yellow-500 text-black shadow-[0_4px_15px_rgba(234,179,8,0.4)] border border-yellow-400' :
                'bg-white text-black'
            }`}
          >
            {isLoading || isCloudSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : isSaved ? <Cloud className="w-4 h-4" /> : null}
            {isLoading || isCloudSyncing ? 'Saving...' : isSaved ? 'Saved to Vault' : 'Save to Vault'}
          </button>
        </div>
      </div>

      <div className="space-y-6 mb-8">
        <h4 className="text-sm font-black uppercase tracking-widest opacity-40">
          {recipe.isGangstaVox ? 'Vocal Tracks' : 'Instruments'}
        </h4>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {(recipe.isGangstaVox ? recipe.gangstaVox?.vocalTracks : recipe.instruments)?.map((track, idx) => (
            <div key={idx} className={`p-6 rounded-[28px] border transition-colors ${
              theme === 'coldest' 
                ? 'bg-sky-50/50 border-sky-100 shadow-sm' 
                : theme === 'crazy-bird' 
                ? 'bg-red-950/40 border-red-900/30 text-red-100' 
                : theme === 'hustle-time' 
                ? 'bg-zinc-900/50 border-yellow-500/20 text-yellow-100' 
                : 'bg-white/80 border-slate-200'
            }`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col">
                  <span className="font-black text-xl tracking-tight">{track.name}</span>
                  {(track as any).plugin && (
                    <span className="text-xs font-black uppercase tracking-widest text-sky-600">{(track as any).plugin}</span>
                  )}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest opacity-40 bg-black/5 px-3 py-1.5 rounded-full border border-black/5">{track.sourceSoundGoal}</span>
              </div>
              {track.loopGuide && <p className="text-sm font-medium opacity-70 mb-5 leading-relaxed">{track.loopGuide}</p>}
              
              {(track as any).midiNotes && (
                <div className={`mb-5 p-4 rounded-[20px] border ${theme === 'coldest' ? 'bg-sky-50 border-sky-100' : 'bg-black/5 border-black/5'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <Music className="w-4 h-4 opacity-40" />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">Analyzed MIDI Sequence</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(track as any).midiNotes.map((note: any, nIdx: number) => (
                      <span key={nIdx} className="bg-black/5 px-2 py-0.5 rounded-lg text-[10px] font-bold">{note.pitch}</span>
                    ))}
                  </div>
                </div>
              )}
              
              {isMidiCapable(track.name, track.loopGuide) && (
                <div className="mb-4">
                  <h5 className="text-[8px] font-black uppercase tracking-widest opacity-40 mb-2">Drag MIDI to DAW</h5>
                  <div className="flex flex-wrap gap-2">
                    <MidiDraggableButton instrument={track.name} loopGuide={track.loopGuide} bpm={recipe.bpm} bars={4} variation="A" recipeTitle={recipe.title} theme={theme} dawType={dawType} midiNotes={track.midiNotes} />
                    <MidiDraggableButton instrument={track.name} loopGuide={track.loopGuide} bpm={recipe.bpm} bars={4} variation="B" recipeTitle={recipe.title} theme={theme} dawType={dawType} midiNotes={track.midiNotes} />
                    <MidiDraggableButton instrument={track.name} loopGuide={track.loopGuide} bpm={recipe.bpm} bars={8} variation="A" recipeTitle={recipe.title} theme={theme} dawType={dawType} midiNotes={track.midiNotes} />
                    <MidiDraggableButton instrument={track.name} loopGuide={track.loopGuide} bpm={recipe.bpm} bars={8} variation="B" recipeTitle={recipe.title} theme={theme} dawType={dawType} midiNotes={track.midiNotes} />
                  </div>
                </div>
              )}

              {track.deepDive && track.deepDive.length > 0 && (
                <div className={`mt-4 p-4 rounded-2xl border ${
                  theme === 'coldest' ? 'bg-sky-50/50 border-sky-100' : 'bg-black/5 border-black/5'
                }`}>
                  <h5 className="text-[8px] font-black uppercase tracking-widest opacity-40 mb-2">Source Settings</h5>
                  <div className="grid grid-cols-2 gap-2">
                    {track.deepDive.map((s, sIdx) => (
                      <div key={sIdx} className="flex justify-between text-[9px] font-bold">
                        <span className="opacity-40">{s.parameter}</span>
                        <span className="text-current">{s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {track.busSend && (
                <div className="mt-3">
                  <span className="text-[10px] font-bold opacity-50">Sends to: </span>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${
                    theme === 'coldest' ? 'bg-orange-100 text-orange-800' : 'bg-orange-500/20 text-orange-400'
                  }`}>{track.busSend}</span>
                </div>
              )}

              {track.fxPlugins && track.fxPlugins.length > 0 && (
                <div className="mt-6 space-y-4">
                  <h5 className="text-[8px] font-black uppercase tracking-widest opacity-40">FX Deep Dive</h5>
                  {track.fxPlugins.map((dive, dIdx) => (
                    <div key={dIdx} className={`p-4 rounded-2xl border ${
                      theme === 'coldest' ? 'bg-purple-50 border-purple-100' : 'bg-purple-900/5 border-purple-500/10'
                    }`}>
                      <div className="flex justify-between items-start mb-2">
                        <h6 className="font-black text-xs text-purple-700">{dive.name}</h6>
                        <span className="text-[8px] font-black uppercase tracking-widest opacity-50">{dive.purpose}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        {dive.deepDive?.map((s, sIdx) => (
                          <div key={sIdx} className="flex justify-between text-[9px] font-bold">
                            <span className="opacity-40">{s.parameter}</span>
                            <span className="text-purple-600">{s.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {recipe.vocalElements && (
        <div className="space-y-6 mb-8">
          <h4 className="text-sm font-black uppercase tracking-widest opacity-40">Vocal Elements</h4>
          <div className="space-y-6">
            {recipe.vocalElements.vocalTracks?.map((layer, idx) => (
              <div key={idx} className={`p-6 rounded-3xl border ${
                theme === 'coldest' ? 'bg-purple-50 border-purple-200' : 'bg-purple-900/5 border-purple-500/10'
              }`}>
                <div className="flex justify-between items-start mb-4">
                  <h5 className="font-black text-lg text-purple-700">{layer.name}</h5>
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-50 bg-black/5 px-2 py-1 rounded-md">{layer.sourceSoundGoal}</span>
                </div>
                {layer.loopGuide && <p className="text-xs font-bold opacity-70 mb-4">{layer.loopGuide}</p>}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {layer.fxPlugins?.map((dive, dIdx) => (
                    <div key={dIdx} className={`p-4 rounded-2xl border ${
                      theme === 'coldest' ? 'bg-white/80 border-purple-100' : 'bg-white/5 border-white/10'
                    }`}>
                      <h6 className="font-black text-sm mb-1">{dive.name}</h6>
                      <p className="text-[10px] font-bold opacity-70 mb-3">{dive.purpose}</p>
                      <div className="space-y-1">
                        {dive.deepDive?.map((s, sIdx) => (
                          <div key={sIdx} className="flex justify-between text-[9px] font-bold">
                            <span className="opacity-50">{s.parameter}</span>
                            <span className="text-purple-600">{s.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                {layer.busSend && (
                  <div className="mt-4">
                    <span className="text-[10px] font-bold opacity-50">Sends to: </span>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${
                      theme === 'coldest' ? 'bg-orange-100 text-orange-800' : 'bg-orange-500/20 text-orange-400'
                    }`}>{layer.busSend}</span>
                  </div>
                )}
              </div>
            ))}
            {recipe.vocalElements.layeringStrategy && (
              <div className={`p-6 rounded-3xl border ${
                theme === 'coldest' ? 'bg-purple-50/30 border-purple-100' : 'bg-purple-900/5 border-purple-500/10'
              }`}>
                <h5 className="text-[10px] font-black uppercase tracking-widest opacity-30 mb-2">Layering Strategy</h5>
                <p className="text-sm font-bold opacity-90">{recipe.vocalElements.layeringStrategy}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {recipe.busses && recipe.busses.length > 0 && (
        <div className="space-y-6 mb-8">
          <h4 className="text-sm font-black uppercase tracking-widest opacity-40">Busses</h4>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {recipe.busses.map((bus, idx) => (
              <div key={idx} className={`p-5 rounded-3xl border ${
                theme === 'coldest' ? 'bg-sky-50 border-sky-200' : 'bg-orange-900/5 border-orange-500/10'
              }`}>
                <h5 className={`font-black text-lg mb-2 ${theme === 'coldest' ? 'text-sky-700' : 'text-orange-700'}`}>{bus.name}</h5>
                <div className="mb-4">
                  <span className="text-[10px] font-bold opacity-50">Receives from: </span>
                  <span className="text-[10px] font-bold">{bus.tracksUsingBus?.join(', ')}</span>
                </div>
                
                <div className="space-y-4">
                  {bus.fxPlugins?.map((dive, dIdx) => (
                    <div key={dIdx} className={`p-4 rounded-2xl border ${
                      theme === 'coldest' ? 'bg-white/60 border-sky-100' : 'bg-black/10 border-white/5'
                    }`}>
                      <div className="flex justify-between items-start mb-2">
                        <h6 className="font-black text-xs">{dive.name}</h6>
                        <span className="text-[8px] font-black uppercase tracking-widest opacity-50">{dive.purpose}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {dive.deepDive?.map((s, sIdx) => (
                          <div key={sIdx} className="flex justify-between text-[9px] font-bold">
                            <span className="opacity-40">{s.parameter}</span>
                            <span className={theme === 'coldest' ? 'text-sky-600' : 'text-orange-600'}>{s.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {recipe.masterPlugins && recipe.masterPlugins.length > 0 && (
        <div className="space-y-6 mb-8">
          <h4 className="text-sm font-black uppercase tracking-widest opacity-40">Master Chain</h4>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {recipe.masterPlugins.map((dive, idx) => (
              <div key={idx} className={`p-5 rounded-3xl border ${
                theme === 'coldest' ? 'bg-sky-50 border-sky-200' : 'bg-zinc-900/5 border-zinc-500/10'
              }`}>
                <div className="flex justify-between items-start mb-2">
                  <h6 className={`font-black text-lg ${theme === 'coldest' ? 'text-sky-700' : 'text-zinc-700'}`}>{dive.name}</h6>
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-50">{dive.purpose}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {dive.deepDive?.map((s, sIdx) => (
                    <div key={sIdx} className="flex justify-between text-[10px] font-bold">
                      <span className="opacity-40">{s.parameter}</span>
                      <span className={theme === 'coldest' ? 'text-sky-600' : 'text-zinc-600'}>{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-6 mb-8">
        <h4 className="text-sm font-black uppercase tracking-widest opacity-40">Drum Patterns</h4>
        <div className={`p-2 sm:p-6 rounded-[2.5rem] border ${
          theme === 'coldest' ? 'bg-white/60 border-sky-100 shadow-inner' : 'bg-black/5 border-white/5'
        }`}>
          <DrumPatternDisplay patterns={recipe.drumPatterns} theme={theme} dawType={dawType} recipeTitle={recipe.title} bpm={recipe.bpm} />
        </div>
      </div>

      {recipe.drumKitAdvice && drumKits.length > 0 && (
        <div className="space-y-6 mb-8">
          <h4 className="text-sm font-black uppercase tracking-widest opacity-40">Drum Kit Tuning & Setup Advice</h4>
          <div className={`p-6 rounded-[2.5rem] border grid grid-cols-1 md:grid-cols-3 gap-6 ${
            theme === 'coldest' ? 'bg-sky-50 border-sky-200' : 'bg-orange-900/5 border-orange-500/10'
          }`}>
            <div>
              <h5 className={`font-black text-lg mb-2 ${theme === 'coldest' ? 'text-sky-700' : 'text-orange-700'}`}>Kick</h5>
              <p className="text-xs font-bold opacity-70 leading-relaxed">{recipe.drumKitAdvice.kick}</p>
            </div>
            <div>
              <h5 className={`font-black text-lg mb-2 ${theme === 'coldest' ? 'text-sky-700' : 'text-orange-700'}`}>Snare</h5>
              <p className="text-xs font-bold opacity-70 leading-relaxed">{recipe.drumKitAdvice.snare}</p>
            </div>
            <div>
              <h5 className={`font-black text-lg mb-2 ${theme === 'coldest' ? 'text-sky-700' : 'text-orange-700'}`}>Toms</h5>
              <p className="text-xs font-bold opacity-70 leading-relaxed">{recipe.drumKitAdvice.toms}</p>
            </div>
          </div>
        </div>
      )}

      <button 
        onClick={toggleExpanded}
        className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
          theme === 'coldest' ? 'bg-white/40 hover:bg-white/60 border border-white/50' : 'bg-white/5 hover:bg-white/10'
        }`}
      >
        {expanded ? 'Hide Arrangement & Mixing Advice' : 'Show Arrangement & Mixing Advice'}
      </button>

      <button 
        onClick={toggleGangstaVox}
        className={`w-full mt-4 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
          theme === 'coldest' ? 'bg-purple-100 hover:bg-purple-200 border border-purple-300 text-purple-900' : 'bg-purple-900/30 hover:bg-purple-900/50 border border-purple-500/30 text-purple-100'
        }`}
      >
        {showGangstaVox ? 'Hide GangstaVox Guide' : '🎤 Show GangstaVox Guide'}
      </button>

      {expanded && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-8 pt-8 border-t border-current/10 grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          <div>
            <h4 className="text-sm font-black uppercase tracking-widest opacity-40 mb-6">Arrangement</h4>
            <div className="space-y-4">
              {Object.entries(recipe.arrangement || {}).map(([section, guide]) => (
                <div key={section} className={`p-4 rounded-2xl border ${
                  theme === 'coldest' ? 'bg-white/60 border-sky-100' : 'bg-black/5 border-white/5'
                }`}>
                  <h5 className="font-black capitalize mb-1">{section}</h5>
                  <p className="text-xs font-bold opacity-70">{guide as string}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-black uppercase tracking-widest opacity-40 mb-6">Mixing Advice</h4>
            <div className={`p-6 rounded-3xl border mb-6 ${
              theme === 'coldest' ? 'bg-sky-100 border-sky-200 text-sky-900' : 'bg-sky-900/10 border-sky-500/20 text-sky-100'
            }`}>
              <p className="text-sm font-bold leading-relaxed">{recipe.mixingAdvice}</p>
            </div>
          </div>
        </motion.div>
      )}

      {showGangstaVox && recipe.gangstaVox && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-8 pt-8 border-t border-purple-500/30"
        >
          <h3 className="text-xl font-black mb-6 uppercase tracking-widest text-purple-500">GangstaVox Guide</h3>
          
          {recipe.gangstaVox.trackingChain && (
            <div className="mb-8">
              <h4 className="text-sm font-black uppercase tracking-widest opacity-40 mb-4">Apollo Tracking Chain</h4>
              <div className={`p-6 rounded-3xl border ${theme === 'coldest' ? 'bg-white/60 border-sky-100' : 'bg-black/5 border-white/5'}`}>
                {recipe.gangstaVox.trackingChain.dspUsageNote && (
                  <p className="text-xs font-bold opacity-70 mb-4 text-orange-600">{recipe.gangstaVox.trackingChain.dspUsageNote}</p>
                )}
                {recipe.gangstaVox.trackingChain.unisonPlugin && (
                  <div className={`mb-4 p-4 rounded-2xl border ${
                    theme === 'coldest' ? 'bg-sky-100 border-sky-200' : 'bg-orange-500/5 border-orange-500/20'
                  }`}>
                    <span className={`text-[10px] font-black uppercase tracking-widest block mb-1 ${
                      theme === 'coldest' ? 'text-sky-600' : 'text-orange-600'
                    }`}>Unison Preamp</span>
                    <span className="font-bold">{recipe.gangstaVox.trackingChain.unisonPlugin.name}</span>
                    <p className="text-xs font-bold opacity-70 mt-1">{recipe.gangstaVox.trackingChain.unisonPlugin.purpose}</p>
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      {recipe.gangstaVox.trackingChain.unisonPlugin.deepDive?.map((s, sIdx) => (
                        <div key={sIdx} className="flex justify-between text-[9px] font-bold">
                          <span className="opacity-40">{s.parameter}</span>
                          <span className={theme === 'coldest' ? 'text-sky-600' : 'text-orange-600'}>{s.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="space-y-3">
                  {recipe.gangstaVox.trackingChain.inserts?.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-4">
                      <div className="w-6 h-6 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-[10px] font-black text-orange-600">{idx + 1}</span>
                      </div>
                      <div className="flex-1">
                        <h5 className="font-black text-sm">{step.name}</h5>
                        <p className="text-xs font-bold opacity-70 mt-1">{step.purpose}</p>
                        <div className="grid grid-cols-2 gap-2 mt-3">
                          {step.deepDive?.map((s, sIdx) => (
                            <div key={sIdx} className="flex justify-between text-[9px] font-bold">
                              <span className="opacity-40">{s.parameter}</span>
                              <span className="text-orange-600">{s.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-8">
            {recipe.gangstaVox.vocalTracks?.map((layer, idx) => (
              <div key={idx}>
                <h4 className="text-sm font-black uppercase tracking-widest opacity-40 mb-4">{layer.name}</h4>
                <div className={`p-6 rounded-3xl border ${theme === 'coldest' ? 'bg-white/60 border-sky-100' : 'bg-black/5 border-white/5'}`}>
                  <div className="mb-6">
                    <h5 className="text-[10px] font-black uppercase tracking-widest opacity-30 mb-2">Source Sound Goal</h5>
                    <p className="text-sm font-bold opacity-90">{layer.sourceSoundGoal}</p>
                  </div>
                  {layer.loopGuide && (
                    <div className="mb-6">
                      <h5 className="text-[10px] font-black uppercase tracking-widest opacity-30 mb-2">Recording/Arrangement Guide</h5>
                      <p className="text-sm font-bold opacity-90">{layer.loopGuide}</p>
                    </div>
                  )}
                  
                  {layer.fxPlugins && layer.fxPlugins.length > 0 && (
                    <div className="mb-6">
                      <h5 className="text-[10px] font-black uppercase tracking-widest opacity-30 mb-4">Processing Chain</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {layer.fxPlugins.map((dive, dIdx) => (
                          <div key={dIdx} className={`p-4 rounded-2xl border ${theme === 'coldest' ? 'bg-white/80 border-sky-50' : 'bg-white/5 border-white/10'}`}>
                            <h6 className="font-black text-sm mb-1">{dive.name}</h6>
                            <p className="text-[10px] font-bold opacity-70 mb-3">{dive.purpose}</p>
                            <div className="space-y-1">
                              {dive.deepDive?.map((s, sIdx) => (
                                <div key={sIdx} className="flex justify-between text-[9px] font-bold">
                                  <span className="opacity-50">{s.parameter}</span>
                                  <span>{s.value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {layer.busSend && (
                    <div className="mt-4">
                      <h5 className="text-[10px] font-black uppercase tracking-widest opacity-30 mb-2">Bus Routing</h5>
                      <span className={`text-[10px] font-bold px-3 py-1.5 rounded-xl ${
                        theme === 'coldest' ? 'bg-orange-100 text-orange-800' : 'bg-orange-500/20 text-orange-400'
                      }`}>Sends to: {layer.busSend}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <h4 className="text-sm font-black uppercase tracking-widest opacity-40 mb-4">Layering Strategy</h4>
            <div className={`p-6 rounded-3xl border ${theme === 'coldest' ? 'bg-white/50 border-white/40' : 'bg-black/20 border-white/5'}`}>
              <p className="text-sm font-bold opacity-90">{recipe.gangstaVox.layeringStrategy}</p>
            </div>
          </div>
        </motion.div>
      )}

      <div className={`mt-8 p-6 rounded-3xl border ${theme === 'coldest' ? 'bg-sky-100 border-sky-200' : 'bg-sky-900/10 border-sky-500/20'}`}>
        <h4 className="text-sm font-black uppercase tracking-widest text-sky-700 mb-2">Need Specific Help?</h4>
        <p className="text-xs font-bold opacity-70 mb-4">Ask about a specific part of your mix (e.g., "ad libs", "bass", "kick punch").</p>
        
        <div className="flex gap-2 mb-6">
          <input
            id="specific-help-query"
            type="text"
            value={specificHelpQuery}
            onChange={(e) => setSpecificHelpQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSpecificHelpSearch()}
            placeholder="E.g., How do I fix the muddy bass?"
            className={`flex-1 px-4 py-3 rounded-xl font-bold text-sm outline-none transition-all ${
              theme === 'coldest' ? 'bg-white border-2 border-sky-200 focus:border-sky-500' : 'bg-black/10 border-2 border-sky-500/30 focus:border-sky-500'
            }`}
          />
          <button
            onClick={handleSpecificHelpSearch}
            disabled={isLoadingSpecificHelp || !specificHelpQuery.trim()}
            className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center disabled:opacity-50 ${
              theme === 'coldest' ? 'bg-sky-600 text-white hover:bg-sky-700' : 'bg-sky-500 text-white hover:bg-sky-600'
            }`}
          >
            {isLoadingSpecificHelp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </button>
        </div>

        {specificHelpResults.length > 0 && (
          <div className="space-y-6 mt-6 pt-6 border-t border-sky-500/20">
            {specificHelpResults.map((result, idx) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={idx} 
                className={`p-5 rounded-2xl border ${theme === 'coldest' ? 'bg-white border-sky-100' : 'bg-black/40 border-sky-500/20'}`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-sky-500 flex items-center justify-center text-[10px] font-black text-white">?</div>
                  <span className="text-xs font-black uppercase tracking-widest text-sky-500">{result.query}</span>
                </div>
                <p className="text-sm font-bold opacity-90 leading-relaxed mb-4">{result.advice}</p>
                
                {result.recommendedChain && result.recommendedChain.length > 0 && (
                  <div className="space-y-3">
                    <h5 className="text-[10px] font-black uppercase tracking-widest opacity-40">Recommended Fix Chain</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {result.recommendedChain.map((p: any, pIdx: number) => (
                        <div key={pIdx} className={`p-3 rounded-xl border ${theme === 'coldest' ? 'bg-sky-50 border-sky-100' : 'bg-sky-500/10 border-sky-500/20'}`}>
                          <h6 className="text-xs font-black mb-1">{p.pluginName}</h6>
                          <p className="text-[10px] font-bold opacity-70 mb-2">{p.purpose}</p>
                          <div className="text-[10px] font-mono bg-black/20 p-2 rounded-lg opacity-80">{p.settings}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>


    </motion.div>
  );
};
