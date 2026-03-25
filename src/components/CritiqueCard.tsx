import React, { useState, useRef } from 'react';
import { MixCritique, AppTheme, VSTPlugin } from '../types';
import { getSpecificMixHelp } from '../services/geminiService';
import { motion } from 'motion/react';
import { Loader2, Search, CheckCircle2, AlertCircle, Download } from 'lucide-react';
import { CritiqueHTMLTemplate } from './CritiqueHTMLTemplate';

// Dynamically import heavy libraries
const getRenderToStaticMarkup = () => import('react-dom/server').then(m => m.renderToStaticMarkup);

interface CritiqueCardProps {
  critique: MixCritique;
  theme: AppTheme;
  plugins: VSTPlugin[];
  audioBase64?: string;
  mimeType?: string;
  isSaved: boolean;
  onSave: (critique: MixCritique) => void;
}

export const CritiqueCard: React.FC<CritiqueCardProps> = ({ critique, theme, plugins, audioBase64, mimeType, isSaved, onSave }) => {
  const [specificHelpQuery, setSpecificHelpQuery] = useState('');
  const [isLoadingSpecificHelp, setIsLoadingSpecificHelp] = useState(false);
  const [specificHelpResults, setSpecificHelpResults] = useState<any[]>([]);
  
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const handleExportHTML = async () => {
    setIsExporting(true);
    setExportProgress(10);

    try {
      const renderToStaticMarkup = await getRenderToStaticMarkup();
      setExportProgress(40);
      
      const htmlContent = renderToStaticMarkup(
        <CritiqueHTMLTemplate critique={critique} theme={theme} />
      );
      setExportProgress(70);

      const fullHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${critique.title} - BeatGangsta Critique</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
            body { font-family: 'Inter', sans-serif; }
            @media print {
              .print-break { page-break-before: always; }
              body { background: white !important; color: black !important; }
            }
          </style>
        </head>
        <body class="bg-slate-50">
          <div class="max-w-4xl mx-auto bg-white shadow-2xl my-8 rounded-[3rem] overflow-hidden">
            ${htmlContent}
          </div>
        </body>
        </html>
      `;

      const blob = new Blob([fullHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${critique.title.replace(/\s+/g, '_')}_Critique_Report.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setExportProgress(100);
    } catch (error) {
      console.error("HTML Export failed:", error);
      alert("Failed to export HTML. Please try again.");
    } finally {
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
      }, 500);
    }
  };

  const handleSpecificHelpSearch = async () => {
    if (!specificHelpQuery.trim() || !audioBase64 || !mimeType) return;
    
    setIsLoadingSpecificHelp(true);
    try {
      const result = await getSpecificMixHelp(plugins, audioBase64, mimeType, specificHelpQuery.trim(), critique.isGangstaVox);
      setSpecificHelpResults(prev => [...prev, result]);
      setSpecificHelpQuery('');
    } catch (error) {
      console.error("Failed to get specific help:", error);
      alert("Failed to get specific help. Please try again.");
    } finally {
      setIsLoadingSpecificHelp(false);
    }
  };

  return (
    <motion.div 
      className={`rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 border shadow-2xl transition-all ${
        theme === 'coldest' 
          ? 'bg-white/80 backdrop-blur-2xl border-sky-200 shadow-[0_8px_30px_rgba(2,132,199,0.12)] text-[#082f49]' 
          : 'bg-black/40 border-sky-500/30 text-white'
      }`}
    >
      <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
        <div>
          <h3 className="text-3xl sm:text-4xl font-black tracking-tighter mb-2 text-sky-600 dark:text-sky-400">
            {critique.title}
          </h3>
          <div className="flex flex-wrap gap-2 mb-4">
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
              theme === 'coldest' ? 'bg-sky-100 text-sky-800' : 'bg-sky-500/20 text-sky-300'
            }`}>
              {critique.isGangstaVox ? 'Vocal Critique' : 'Beat Critique'}
            </span>
          </div>
          <p className="text-sm font-bold opacity-80 max-w-2xl leading-relaxed">
            {critique.overallFeedback}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <button 
              onClick={handleExportHTML}
              disabled={isExporting}
              className={`shrink-0 px-8 py-4 rounded-full font-black text-xs uppercase tracking-widest transition-all shadow-xl hover:scale-105 active:scale-95 flex items-center gap-2 min-w-[160px] justify-center ${
                theme === 'coldest'
                  ? 'bg-slate-800 text-white hover:bg-slate-900'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {isExporting ? `Exporting ${exportProgress}%` : 'Download HTML'}
            </button>
            {isExporting && (
              <div className="absolute -bottom-2 left-0 right-0 h-1 bg-black/10 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${exportProgress}%` }}
                  className="h-full bg-sky-500"
                />
              </div>
            )}
          </div>
          <button 
            onClick={() => onSave(critique)}
            disabled={isSaved}
            className={`shrink-0 px-8 py-4 rounded-full font-black text-xs uppercase tracking-widest transition-all shadow-xl hover:scale-105 active:scale-95 ${
              isSaved 
                ? 'bg-black/10 text-current opacity-50 shadow-none' 
                : theme === 'coldest'
                ? 'bg-gradient-to-b from-sky-400 to-sky-500 text-white shadow-[0_4px_15px_rgba(2,132,199,0.4)] border border-sky-400'
                : 'bg-white text-black'
            }`}
          >
            {isSaved ? 'Saved to Vault' : 'Save Critique'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className={`p-6 rounded-3xl border ${theme === 'coldest' ? 'bg-sky-50 border-sky-100' : 'bg-sky-900/10 border-sky-500/20'}`}>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-sky-500" />
            <h4 className="text-sm font-black uppercase tracking-widest text-sky-600 dark:text-sky-400">Strengths</h4>
          </div>
          <ul className="space-y-3">
            {critique.strengths.map((strength, idx) => (
              <li key={idx} className="text-sm font-bold opacity-80 flex items-start gap-2">
                <span className="text-sky-500 mt-0.5">•</span>
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className={`p-6 rounded-3xl border ${theme === 'coldest' ? 'bg-red-50 border-red-100' : 'bg-red-900/10 border-red-500/20'}`}>
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <h4 className="text-sm font-black uppercase tracking-widest text-red-600 dark:text-red-400">Areas for Improvement</h4>
          </div>
          <ul className="space-y-3">
            {critique.weaknesses.map((weakness, idx) => (
              <li key={idx} className="text-sm font-bold opacity-80 flex items-start gap-2">
                <span className="text-red-500 mt-0.5">•</span>
                <span>{weakness}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="space-y-6 mb-12">
        <h4 className="text-sm font-black uppercase tracking-widest opacity-40">Action Plan</h4>
        <div className="space-y-4">
          {critique.actionPlan.map((action, idx) => (
            <div key={idx} className={`p-6 rounded-3xl border ${
              theme === 'coldest' ? 'bg-white/50 border-sky-100 shadow-inner' : 'bg-sky-900/10 border-sky-500/20'
            }`}>
              <h5 className="font-black text-lg mb-2">{action.issue}</h5>
              <p className="text-sm font-bold opacity-80 mb-6">{action.solution}</p>
              
              <div className="space-y-3">
                <h6 className="text-[10px] font-black uppercase tracking-widest opacity-50">Recommended Chain</h6>
                {action.recommendedChain.map((plugin, pIdx) => (
                  <div key={pIdx} className={`p-4 rounded-2xl border ${
                    theme === 'coldest' ? 'bg-white border-sky-100' : 'bg-black/40 border-sky-500/30'
                  }`}>
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-black text-sky-600 dark:text-sky-400">{plugin.pluginName}</span>
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-50">{plugin.purpose}</span>
                    </div>
                    <p className="text-xs font-bold opacity-70">{plugin.settings}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={`p-6 rounded-3xl border ${theme === 'coldest' ? 'bg-sky-50 border-sky-200' : 'bg-sky-900/20 border-sky-500/30'}`}>
        <h4 className="text-sm font-black uppercase tracking-widest text-sky-600 dark:text-sky-400 mb-2">Need Specific Help?</h4>
        <p className="text-xs font-bold opacity-70 mb-4">Ask about a specific part of your mix (e.g., "ad libs", "bass", "kick punch").</p>
        
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={specificHelpQuery}
            onChange={(e) => setSpecificHelpQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSpecificHelpSearch()}
            placeholder="E.g., How do I fix the muddy bass?"
            className={`flex-1 px-4 py-3 rounded-xl font-bold text-sm outline-none transition-all ${
              theme === 'coldest' ? 'bg-white border-2 border-sky-100 focus:border-sky-400' : 'bg-black/40 border-2 border-sky-500/30 focus:border-sky-500'
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
                className={`p-5 rounded-2xl border ${theme === 'coldest' ? 'bg-white border-sky-200' : 'bg-black/60 border-sky-500/40'}`}
              >
                <h5 className="font-black text-sm mb-2 opacity-50">Q: {result.query}</h5>
                <p className="text-sm font-bold leading-relaxed mb-4">{result.advice}</p>
                
                {result.recommendedChain && result.recommendedChain.length > 0 && (
                  <div className="space-y-2">
                    <h6 className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-2">Recommended Plugins</h6>
                    {result.recommendedChain.map((plugin: any, pIdx: number) => (
                      <div key={pIdx} className={`p-3 rounded-xl border ${theme === 'coldest' ? 'bg-sky-50 border-sky-100' : 'bg-sky-900/20 border-sky-500/20'}`}>
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-black text-xs text-sky-600 dark:text-sky-400">{plugin.pluginName}</span>
                        </div>
                        <p className="text-[10px] font-bold opacity-70 mb-1">{plugin.purpose}</p>
                        <p className="text-[10px] font-mono opacity-50">{plugin.settings}</p>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
      
      {/* Hidden Export View Removed */}
    </motion.div>
  );
};
