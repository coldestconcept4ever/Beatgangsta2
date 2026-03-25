
import React, { useState } from 'react';
import { AppTheme } from '../types';

interface DAWGuideProps {
  theme: AppTheme;
  onClose: () => void;
}

export const DAWGuide: React.FC<DAWGuideProps> = ({ theme, onClose }) => {
  const [activeTab, setActiveTab] = useState<'reaper' | 'studio-one' | 'pro-tools' | 'cubase' | 'fl-studio' | 'ableton' | 'logic' | 'bitwig'>('ableton');

  const containerClasses = theme === 'coldest' 
    ? "bg-white/95 border-white text-[#0c4a6e]" 
    : theme === 'hustle-time'
    ? "bg-black/95 border-yellow-500/30 text-yellow-50"
    : "bg-black/95 border-red-900/50 text-red-50";

  const tabClasses = (id: string) => {
    const active = activeTab === id;
    if (theme === 'coldest') {
      return active 
        ? "bg-sky-500 text-white shadow-lg" 
        : "bg-white/50 text-sky-900 hover:bg-white/80";
    } else if (theme === 'hustle-time') {
      return active 
        ? "bg-yellow-500 text-black shadow-lg shadow-yellow-900/40" 
        : "bg-black/40 text-yellow-400 hover:bg-black/60";
    } else {
      return active 
        ? "bg-red-600 text-white shadow-lg shadow-red-900/40" 
        : "bg-black/40 text-red-400 hover:bg-black/60";
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className={`w-full max-w-2xl rounded-[3rem] border p-8 shadow-2xl overflow-hidden relative ${containerClasses}`}>
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-black/5 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-3xl font-black tracking-tighter mb-2">Let's Locate Your Plugin List</h2>
        <p className="text-sm opacity-70 mb-8 font-medium">Import your plugin library to create your gear rack</p>

        <div className="grid grid-cols-4 gap-2 mb-8 p-1 bg-black/5 rounded-2xl">
          <button 
            onClick={() => setActiveTab('ableton')}
            className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tabClasses('ableton')}`}
          >
            Ableton
          </button>
          <button 
            onClick={() => setActiveTab('logic')}
            className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tabClasses('logic')}`}
          >
            Logic
          </button>
          <button 
            onClick={() => setActiveTab('fl-studio')}
            className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tabClasses('fl-studio')}`}
          >
            FL Studio
          </button>
          <button 
            onClick={() => setActiveTab('reaper')}
            className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tabClasses('reaper')}`}
          >
            REAPER
          </button>
          <button 
            onClick={() => setActiveTab('studio-one')}
            className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tabClasses('studio-one')}`}
          >
            Studio One
          </button>
          <button 
            onClick={() => setActiveTab('pro-tools')}
            className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tabClasses('pro-tools')}`}
          >
            Pro Tools
          </button>
          <button 
            onClick={() => setActiveTab('cubase')}
            className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tabClasses('cubase')}`}
          >
            Cubase
          </button>
          <button 
            onClick={() => setActiveTab('bitwig')}
            className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tabClasses('bitwig')}`}
          >
            Bitwig
          </button>
        </div>

        <div className="space-y-6 min-h-[300px] animate-in slide-in-from-bottom-4 duration-500">
          {activeTab === 'ableton' && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-sky-500/20 flex items-center justify-center font-black flex-shrink-0">1</div>
                <p className="text-sm leading-relaxed">In Ableton, go to your <strong className="font-black">User Library</strong> or <strong className="font-black">Plug-ins</strong> folder.</p>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-sky-500/20 flex items-center justify-center font-black flex-shrink-0">2</div>
                <p className="text-sm leading-relaxed">Select your favorite plugins, right-click and <strong className="font-black">Rename</strong>, then copy the text.</p>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-sky-500/20 flex items-center justify-center font-black flex-shrink-0">3</div>
                <p className="text-sm leading-relaxed">Alternatively, use the <strong className="font-black">Paste List</strong> button here and paste your plugin names.</p>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-sky-500/20 flex items-center justify-center font-black flex-shrink-0">4</div>
                <p className="text-sm leading-relaxed">BeatGangsta will identify your VSTs and build your custom rack.</p>
              </div>
            </div>
          )}
          {activeTab === 'logic' && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center font-black flex-shrink-0">1</div>
                <p className="text-sm leading-relaxed">Go to <strong className="font-black">Logic Pro</strong> &gt; <strong className="font-black">Settings</strong> &gt; <strong className="font-black">Plug-in Manager</strong>.</p>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center font-black flex-shrink-0">2</div>
                <p className="text-sm leading-relaxed">Select the plugins you want to export and <strong className="font-black">Command+C</strong> to copy.</p>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center font-black flex-shrink-0">3</div>
                <p className="text-sm leading-relaxed">Click <strong className="font-black">Paste List</strong> here and paste the names.</p>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center font-black flex-shrink-0">4</div>
                <p className="text-sm leading-relaxed">We'll optimize your signal chains for the Logic Pro environment.</p>
              </div>
            </div>
          )}
          {activeTab === 'bitwig' && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center font-black flex-shrink-0">1</div>
                <p className="text-sm leading-relaxed">In Bitwig, go to <strong className="font-black">Settings</strong> &gt; <strong className="font-black">Plug-ins</strong>.</p>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center font-black flex-shrink-0">2</div>
                <p className="text-sm leading-relaxed">You can see your full list of scanned plugins here.</p>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center font-black flex-shrink-0">3</div>
                <p className="text-sm leading-relaxed">Copy the names of your go-to plugins and use the <strong className="font-black">Paste List</strong> feature.</p>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center font-black flex-shrink-0">4</div>
                <p className="text-sm leading-relaxed">BeatGangsta will build your sound design profile for Bitwig.</p>
              </div>
            </div>
          )}
          {activeTab === 'reaper' && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-sky-500/20 flex items-center justify-center font-black flex-shrink-0">1</div>
                <p className="text-sm leading-relaxed">Go to <strong className="font-black">Options</strong> &gt; <strong className="font-black">Show resource path...</strong> in REAPER.</p>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-sky-500/20 flex items-center justify-center font-black flex-shrink-0">2</div>
                <p className="text-sm leading-relaxed">Find <code className="bg-black/5 px-2 py-1 rounded font-mono font-bold">reaper-vstplugins64.ini</code>.</p>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-sky-500/20 flex items-center justify-center font-black flex-shrink-0">3</div>
                <p className="text-sm leading-relaxed">Either <strong className="font-black">copy/paste</strong> the text or <strong className="font-black">upload</strong> the file directly.</p>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-sky-500/20 flex items-center justify-center font-black flex-shrink-0">4</div>
                <p className="text-sm leading-relaxed">BeatGangsta will parse your .ini and load your gear automatically.</p>
              </div>
            </div>
          )}
          {activeTab === 'studio-one' && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center font-black flex-shrink-0">1</div>
                <p className="text-sm leading-relaxed">Open Studio One and go to <strong className="font-black">View</strong> &gt; <strong className="font-black">Plug-in Manager</strong>.</p>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center font-black flex-shrink-0">2</div>
                <p className="text-sm leading-relaxed">Click <strong className="font-black">Export...</strong> at the bottom and save as a <strong className="font-black">CSV</strong>.</p>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center font-black flex-shrink-0">3</div>
                <p className="text-sm leading-relaxed"><strong className="font-black">Upload the CSV file</strong> here or paste the text content.</p>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center font-black flex-shrink-0">4</div>
                <p className="text-sm leading-relaxed">We will read your vendor and plugin names to generate signal chains.</p>
              </div>
            </div>
          )}
          {activeTab === 'fl-studio' && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center font-black flex-shrink-0">1</div>
                <p className="text-sm leading-relaxed">In FL Studio, open the <strong className="font-black">Plugin Manager</strong> (Options &gt; Manage plugins).</p>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center font-black flex-shrink-0">2</div>
                <p className="text-sm leading-relaxed">Run a scan if needed, then look for the <strong className="font-black">Plugin list</strong> in your FL Studio data folder.</p>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center font-black flex-shrink-0">3</div>
                <p className="text-sm leading-relaxed">Alternatively, use the <strong className="font-black">Paste List</strong> button here and paste the names of your favorite plugins.</p>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center font-black flex-shrink-0">4</div>
                <p className="text-sm leading-relaxed">BeatGangsta will optimize your workflow for the FL Studio environment.</p>
              </div>
            </div>
          )}
          {activeTab === 'pro-tools' && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center font-black flex-shrink-0">1</div>
                <p className="text-sm leading-relaxed">Go to your Pro Tools Plug-ins folder (Common Files\Avid\Audio\Plug-Ins).</p>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center font-black flex-shrink-0">2</div>
                <p className="text-sm leading-relaxed">Select all files in the folder and <strong className="font-black">Copy as Path</strong> or list them.</p>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center font-black flex-shrink-0">3</div>
                <p className="text-sm leading-relaxed">Click the <strong className="font-black">Paste List</strong> button and paste your list there.</p>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center font-black flex-shrink-0">4</div>
                <p className="text-sm leading-relaxed">BeatGangsta will identify your AAX plugins and build your profile.</p>
              </div>
            </div>
          )}
          {activeTab === 'cubase' && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center font-black flex-shrink-0">1</div>
                <p className="text-sm leading-relaxed">In Cubase, go to <strong className="font-black">Studio</strong> &gt; <strong className="font-black">Plug-in Manager</strong>.</p>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center font-black flex-shrink-0">2</div>
                <p className="text-sm leading-relaxed">Click the <strong className="font-black">Export</strong> icon (top right) to save a list.</p>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center font-black flex-shrink-0">3</div>
                <p className="text-sm leading-relaxed">Click the <strong className="font-black">Paste List</strong> button and paste the content there.</p>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center font-black flex-shrink-0">4</div>
                <p className="text-sm leading-relaxed">Your VST library will be analyzed for the ultimate signal chains.</p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-10">
          <button 
            onClick={onClose}
            className={`w-full py-4 rounded-full font-black text-xs uppercase tracking-[0.3em] shadow-xl active:scale-95 transition-all ${theme === 'coldest' ? 'bg-sky-500 text-white hover:bg-sky-600' : theme === 'hustle-time' ? 'bg-yellow-500 text-black hover:bg-yellow-400' : 'bg-red-600 text-white hover:bg-red-700'}`}
          >
            I'm Ready
          </button>
        </div>
      </div>
    </div>
  );
};
