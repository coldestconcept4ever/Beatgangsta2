import React from 'react';
import { MixCritique, AppTheme } from '../types';

interface CritiqueHTMLTemplateProps {
  critique: MixCritique;
  theme?: AppTheme;
}

export const CritiqueHTMLTemplate: React.FC<CritiqueHTMLTemplateProps> = ({ critique, theme = 'coldest' }) => {
  const colors = {
    primary: '#0ea5e9', // sky-500
    primaryText: '#0ea5e9',
    primaryBorder: '#0ea5e9',
    lightBg: '#f0f9ff', // sky-50
    lightBorder: '#bae6fd', // sky-200
    darkBg: '#0f172a', // slate-900
    darkText: '#ffffff',
  };

  return (
    <div className="p-8 md:p-16 space-y-16 bg-white text-slate-900 font-sans">
      {/* Header */}
      <header className="text-center space-y-6 border-b border-slate-200 pb-16 print:border-slate-300">
        <div className="w-24 h-24 mx-auto bg-sky-500 rounded-3xl flex items-center justify-center text-4xl font-black text-white shadow-lg shadow-sky-500/20 mb-8">
          🎧
        </div>
        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-slate-900">{critique.title}</h1>
        <div className="flex items-center justify-center gap-4 text-lg md:text-xl font-bold uppercase tracking-widest text-sky-500">
          <span>{critique.isGangstaVox ? 'Vocal Critique' : 'Beat Critique'}</span>
          <span>•</span>
          <span>Engineering Report</span>
        </div>
      </header>

      {/* Executive Summary */}
      <section className="space-y-8">
        <h2 className="text-2xl font-black uppercase tracking-widest text-sky-500 border-b border-slate-100 pb-4 print:border-slate-300">01 • Executive Summary</h2>
        <div className="p-8 bg-sky-50 rounded-3xl border border-sky-100 print:bg-slate-50 print:border-slate-200">
          <h3 className="text-sm font-black uppercase tracking-widest text-sky-400 mb-4">Overall Feedback</h3>
          <p className="text-2xl font-black leading-relaxed text-slate-900">{critique.overallFeedback}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-8 bg-emerald-50 rounded-3xl border border-emerald-100 print:bg-white print:border-emerald-200">
            <h3 className="text-sm font-black uppercase tracking-widest text-emerald-500 mb-4">Strengths</h3>
            <ul className="space-y-3">
              {critique.strengths.map((s, i) => (
                <li key={i} className="text-lg font-bold text-slate-700 flex items-start gap-3">
                  <span className="text-emerald-500 mt-1">•</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="p-8 bg-rose-50 rounded-3xl border border-rose-100 print:bg-white print:border-rose-200">
            <h3 className="text-sm font-black uppercase tracking-widest text-rose-500 mb-4">Areas for Improvement</h3>
            <ul className="space-y-3">
              {critique.weaknesses.map((w, i) => (
                <li key={i} className="text-lg font-bold text-slate-700 flex items-start gap-3">
                  <span className="text-rose-500 mt-1">•</span>
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Action Plan */}
      <section className="space-y-8 print-break">
        <h2 className="text-2xl font-black uppercase tracking-widest text-sky-500 border-b border-slate-100 pb-4 print:border-slate-300">02 • Action Plan Protocols</h2>
        <div className="space-y-8">
          {critique.actionPlan.map((action, idx) => (
            <div key={idx} className="p-8 bg-slate-50 rounded-3xl border border-slate-200 print:bg-white print:border-slate-300">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 bg-sky-500 text-white rounded-full flex items-center justify-center font-black text-lg">
                  {idx + 1}
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900">{action.issue}</h3>
              </div>
              <p className="text-lg font-bold text-slate-600 mb-8 pl-14">{action.solution}</p>
              
              <div className="pl-14 space-y-6">
                <h4 className="text-xs font-black uppercase tracking-widest text-sky-500">Recommended Chain</h4>
                <div className="grid grid-cols-1 gap-4">
                  {action.recommendedChain.map((plugin, pIdx) => (
                    <div key={pIdx} className="p-6 bg-white border border-slate-200 rounded-2xl flex flex-col md:flex-row md:justify-between md:items-center gap-4 print:border-slate-200">
                      <div>
                        <h5 className="text-lg font-black text-slate-900">{plugin.pluginName}</h5>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{plugin.purpose}</p>
                      </div>
                      <div className="md:text-right">
                        <p className="font-mono text-sm font-black text-sky-600 bg-sky-50 px-3 py-1 rounded-lg inline-block">{plugin.settings}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Specific Help */}
      {critique.specificHelp && critique.specificHelp.length > 0 && (
        <section className="space-y-8 print-break">
          <h2 className="text-2xl font-black uppercase tracking-widest text-sky-500 border-b border-slate-100 pb-4 print:border-slate-300">03 • Specific Engineering Queries</h2>
          <div className="space-y-8">
            {critique.specificHelp.map((help, idx) => (
              <div key={idx} className="p-8 bg-sky-50/50 rounded-3xl border border-sky-100 print:bg-white print:border-slate-300">
                <div className="mb-6">
                  <span className="text-xs font-black uppercase tracking-widest text-sky-400 block mb-2">Query</span>
                  <h3 className="text-xl font-black text-slate-900 italic">"{help.query}"</h3>
                </div>
                <div className="mb-8">
                  <span className="text-xs font-black uppercase tracking-widest text-sky-400 block mb-2">Advice</span>
                  <p className="text-lg font-bold text-slate-800 leading-relaxed">{help.advice}</p>
                </div>
                
                {help.recommendedChain && help.recommendedChain.length > 0 && (
                  <div className="space-y-4">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">Recommended Plugins</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {help.recommendedChain.map((plugin, pIdx) => (
                        <div key={pIdx} className="p-5 bg-white border border-sky-100 rounded-2xl print:border-slate-200">
                          <h4 className="font-black text-slate-900">{plugin.pluginName}</h4>
                          <p className="text-xs font-bold text-slate-400 mb-3">{plugin.purpose}</p>
                          <p className="font-mono text-xs text-sky-500 bg-sky-50 px-2 py-1 rounded inline-block">{plugin.settings}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Verdict */}
      <section className="text-center space-y-8 py-16 border-t border-slate-200 print-break print:border-slate-300">
        <h2 className="text-sm font-black uppercase tracking-widest text-sky-500">Engineering Verdict</h2>
        <p className="text-3xl md:text-4xl font-black leading-tight max-w-4xl mx-auto text-slate-900 tracking-tight italic">
          "Your mix has potential. Follow the protocols for a professional finish."
        </p>
        <div className="pt-16">
          <div className="w-16 h-1 mx-auto rounded-full bg-sky-500 mb-8" />
          <p className="text-xs font-black uppercase tracking-widest opacity-40 text-slate-500">End of Report</p>
        </div>
      </section>
    </div>
  );
};
