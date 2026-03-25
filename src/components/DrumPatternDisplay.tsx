import React, { useState, useEffect } from 'react';
import { DrumPattern } from '../types';
import { motion } from 'motion/react';
import { Download, Music, Play, Square } from 'lucide-react';
import { generateAudioLoop, generateDrumMidiBaseData } from '../utils/midiGenerator';
import { playMidiPreview, stopMidiPreview } from '../utils/midiPlayer';

// Dynamic imports for heavy libraries
const getJSZip = () => import('jszip').then(m => m.default);
const getSaveAs = () => import('file-saver').then(m => m.saveAs);

interface DrumPatternDisplayProps {
  patterns: {
    intro: DrumPattern;
    verse: DrumPattern;
    hook: DrumPattern;
    bridge: DrumPattern;
    outro: DrumPattern;
  };
  theme?: 'coldest' | 'hustle-time' | 'crazy-bird';
  dawType?: string | null;
  recipeTitle?: string;
  bpm?: number;
}

const StepGrid = ({ steps = [], totalSteps, label, color, textColor, showVelocity, swing = 0, showSwingView }: { steps?: number[], totalSteps: number, label: string, color: string, textColor: string, showVelocity?: boolean, swing?: number, showSwingView?: boolean }) => {
  // Fallback: If 32 steps are expected but only 16 or fewer are provided (or the second half is empty),
  // we can intelligently handle it. However, the user specifically wants to see ticks for all 32 bars.
  // If the AI provided steps only up to 16, we'll repeat them for 17-32 if 17-32 is empty.
  let effectiveSteps = [...steps];
  if (totalSteps === 32) {
    const hasSecondHalf = steps.some(s => s > 16);
    if (!hasSecondHalf && steps.length > 0) {
      const secondHalf = steps.map(s => s + 16);
      effectiveSteps = [...steps, ...secondHalf];
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between items-end">
        <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">{label}</span>
      </div>
      
      <div className="overflow-x-auto pb-4 -mx-6 px-6 sm:mx-0 sm:px-0 custom-scrollbar overflow-y-hidden">
        <div className={`flex gap-1 sm:gap-1.5 ${totalSteps === 32 ? 'min-w-[700px] sm:min-w-[850px]' : 'min-w-[380px] sm:min-w-[450px]'} sm:min-w-full py-2 pr-4 sm:pr-10`}>
          {Array.from({ length: totalSteps }).map((_, i) => {
            const stepNum = i + 1;
            const isActive = effectiveSteps.includes(stepNum);
            const isBeat = stepNum % 4 === 1;
            const velocity = isActive ? Math.floor(60 + (Math.sin(stepNum * 12.5) * 20 + 20)) : 0;
            
            // Calculate swing offset for even steps
            const isEven = stepNum % 2 === 0;
            const swingOffset = showSwingView && isEven ? (swing / 100) * 40 : 0;
            
            return (
              <div 
                key={i} 
                className="flex flex-col flex-1 gap-1 group transition-transform duration-300 ease-out"
                style={{ transform: `translateX(${swingOffset}%)` }}
              >
                {/* Velocity Bar */}
                <div className={`flex flex-col justify-end items-center transition-all duration-500 ${showVelocity ? 'h-12 sm:h-16 opacity-100' : 'h-0 opacity-0 overflow-hidden'}`}>
                  {isActive && (
                    <>
                      <span className={`text-[8px] sm:text-[9px] font-mono font-bold transition-opacity mb-1 ${textColor}`}>
                        {velocity}%
                      </span>
                      <div 
                        className={`w-full rounded-t-sm transition-all duration-500 ${color} opacity-50 group-hover:opacity-80`}
                        style={{ height: `${velocity}%` }}
                      />
                    </>
                  )}
                </div>

                {/* Step Box */}
                <div 
                  className={`
                    relative h-8 sm:h-10 rounded-md transition-all duration-300 flex items-center justify-center
                    ${isActive ? color : 'bg-black/5 dark:bg-white/5'}
                    ${isBeat && !isActive ? 'border-l-2 border-black/10 dark:border-white/10' : ''}
                    ${isActive ? 'shadow-sm scale-[1.02]' : ''}
                  `}
                >
                  <span className={`text-[9px] sm:text-[10px] font-mono font-bold transition-opacity ${isActive ? 'text-white opacity-90' : 'text-black/30 dark:text-white/30 opacity-0 group-hover:opacity-100'}`}>
                    {stepNum}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const SwingMeter = ({ label, percentage, colorClass }: { label: string, percentage: number, colorClass: string }) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - ((percentage || 0) / 100) * circumference;
  return (
    <div className="text-center flex flex-col items-center gap-2">
      <div className={`relative inline-flex items-center justify-center w-16 h-16 sm:w-24 sm:h-24`}>
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <circle
            className="text-black/10 dark:text-white/10"
            strokeWidth="8"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="50"
            cy="50"
          />
          <circle
            className={colorClass}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="50"
            cy="50"
            style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 0.5s ease-in-out' }}
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className={`text-xl sm:text-2xl font-black font-mono ${colorClass}`}>{percentage || 0}</span>
          <span className="text-[8px] font-bold opacity-70">%</span>
        </div>
      </div>
      <div className="text-[10px] font-bold uppercase tracking-widest mt-1 opacity-70">{label}</div>
    </div>
  );
};

export const DrumPatternDisplay: React.FC<DrumPatternDisplayProps> = ({ patterns, theme, dawType, recipeTitle = 'Beat', bpm = 120 }) => {
  const [activeSection, setActiveSection] = useState<keyof typeof patterns>('hook');
  const [localToggles, setLocalToggles] = useState<Record<string, { velocity: boolean, swingView: boolean }>>({});
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // Stop playback when switching sections
    if (isPlaying) {
      stopMidiPreview();
      setIsPlaying(false);
    }
  }, [activeSection]);

  if (!patterns) return null;

  const sections: (keyof typeof patterns)[] = ['intro', 'verse', 'hook', 'bridge', 'outro'];
  const currentPattern = patterns[activeSection];

  const activeColor = theme === 'hustle-time' ? 'bg-yellow-500' : 
                      theme === 'crazy-bird' ? 'bg-red-500' : 'bg-sky-500';
  
  const activeText = theme === 'hustle-time' ? 'text-yellow-500' : 
                     theme === 'crazy-bird' ? 'text-red-500' : 'text-sky-500';

  const currentToggles = localToggles[activeSection] || {
    velocity: currentPattern?.velocityHumanized || false,
    swingView: false
  };

  const handleToggleVelocity = () => {
    setLocalToggles(prev => ({
      ...prev,
      [activeSection]: { ...currentToggles, velocity: !currentToggles.velocity }
    }));
  };

  const handleToggleSwingView = () => {
    setLocalToggles(prev => ({
      ...prev,
      [activeSection]: { ...currentToggles, swingView: !currentToggles.swingView }
    }));
  };

  const getDrumMidiBaseData = () => {
    return generateDrumMidiBaseData(currentPattern, recipeTitle, activeSection, bpm, currentToggles.velocity);
  };

  const handlePlay = () => {
    if (isPlaying) {
      stopMidiPreview();
      setIsPlaying(false);
      return;
    }

    const midiBytes = getDrumMidiBaseData();
    setIsPlaying(true);
    playMidiPreview(midiBytes, 'Drums', () => {
      setIsPlaying(false);
    });
  };

  const handleDownloadAllDrumPatterns = async () => {
    const JSZip = await getJSZip();
    const saveAs = await getSaveAs();
    const zip = new JSZip();
    const isStudioOne = dawType === 'Studio One';
    const extension = isStudioOne ? 'audioloop' : 'mid';

    for (const section of sections) {
      const pattern = patterns[section];
      if (!pattern) continue;

      const midiBytes = generateDrumMidiBaseData(pattern, recipeTitle, section as string, bpm, pattern.velocityHumanized || false);
      const fileName = `${recipeTitle.replace(/\s+/g, '_')}_${String(section)}_Drums_${bpm}BPM.${extension}`;
      
      if (isStudioOne) {
        const blob = await generateAudioLoop(midiBytes, bpm);
        zip.file(fileName, blob);
      } else {
        zip.file(fileName, midiBytes);
      }
    }

    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `${recipeTitle.replace(/\s+/g, '_')}_All_Drum_Patterns.${extension === 'audioloop' ? 'zip' : 'zip'}`);
  };

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${activeColor} animate-pulse`} />
          <div className="flex flex-col">
            <h4 className="text-xs font-black uppercase tracking-widest opacity-70">Drum Protocols</h4>
          </div>
          <button
            onClick={handleDownloadAllDrumPatterns}
            className={`ml-2 flex items-center gap-1.5 px-2 py-1 rounded-md transition-all hover:scale-105 text-[10px] font-bold uppercase tracking-widest ${
              theme === 'coldest' ? 'bg-sky-100 text-sky-700 hover:bg-sky-200 border border-sky-200' : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white border border-white/10'
            }`}
            title="Download all drum patterns"
          >
            <Download className="w-3 h-3" />
            <span>Download All</span>
          </button>
        </div>
        
        <div className="flex overflow-x-auto w-full sm:w-auto no-scrollbar justify-start sm:justify-center gap-1 bg-black/5 dark:bg-white/5 p-1.5 rounded-xl">
          {sections.map(section => (
            <button
              key={section}
              onClick={() => setActiveSection(section)}
              className={`
                px-4 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all whitespace-nowrap
                ${activeSection === section 
                  ? `${activeColor} text-white shadow-md scale-105` 
                  : 'opacity-70 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10'}
              `}
            >
              {section}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-center mb-8">
        <button
          onClick={handlePlay}
          className={`
            flex items-center gap-3 px-8 py-4 text-sm font-black uppercase tracking-widest rounded-2xl transition-all
            ${isPlaying 
              ? 'bg-red-500 text-white shadow-lg scale-105' 
              : `${activeColor} text-white shadow-lg hover:scale-105 hover:shadow-xl active:scale-95`}
          `}
        >
          {isPlaying ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          <span>{isPlaying ? 'Stop Pattern' : 'Play Pattern'}</span>
        </button>
      </div>

      {!currentPattern ? (
        <div className="p-12 text-center text-xs opacity-50 font-bold uppercase tracking-widest border-2 border-dashed border-black/10 dark:border-white/10 rounded-2xl">
          Drum pattern not available for {activeSection}.
        </div>
      ) : (
        <>
          <div className="flex flex-col xl:flex-row gap-4 xl:gap-12">
            <div className="flex flex-col gap-4 p-3 sm:p-4 rounded-2xl bg-black/5 dark:bg-white/5 w-full xl:w-64">
              <div className="flex flex-row xl:flex-col gap-2 sm:gap-4 items-center justify-between xl:justify-center overflow-x-auto no-scrollbar pb-2 xl:pb-0">
                <SwingMeter label="Hi-Hat" percentage={currentPattern.swing?.hiHat || 0} colorClass={activeText} />
                <SwingMeter label={currentPattern.snare?.isClap ? 'Clap' : 'Snare'} percentage={currentPattern.swing?.snare || 0} colorClass={activeText} />
                <SwingMeter label="Kick" percentage={currentPattern.swing?.kick || 0} colorClass={activeText} />
              </div>
              
              <div className="pt-2 sm:pt-4 border-t border-black/5 dark:border-white/5 w-full flex flex-col items-center gap-2">
                <button 
                  onClick={handleToggleSwingView}
                  className={`flex flex-row xl:flex-col items-center justify-center gap-3 xl:gap-1.5 p-2 rounded-xl transition-all w-full ${currentToggles.swingView ? 'bg-black/10 dark:bg-white/10' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
                >
                  <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Swing View</span>
                  <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${currentToggles.swingView ? activeColor : 'bg-black/20 dark:bg-white/20'}`}>
                    <div className={`w-3 h-3 rounded-full bg-white transition-transform ${currentToggles.swingView ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                </button>
              </div>
            </div>
            <div className="flex-1 space-y-10 overflow-hidden">
              <StepGrid 
                steps={currentPattern.hiHat?.steps || []} 
                totalSteps={currentPattern.hiHat?.isDoubleTime ? 32 : 16} 
                label="Hi-Hats"
                color={activeColor}
                textColor={activeText}
                showVelocity={currentToggles.velocity}
                swing={currentPattern.swing?.hiHat || 0}
                showSwingView={currentToggles.swingView}
              />
              
              <StepGrid 
                steps={currentPattern.snare?.steps || []} 
                totalSteps={currentPattern.snare?.isDoubleTime ? 32 : 16} 
                label={currentPattern.snare?.isClap ? 'Clap' : 'Snare'}
                color={activeColor}
                textColor={activeText}
                showVelocity={currentToggles.velocity}
                swing={currentPattern.swing?.snare || 0}
                showSwingView={currentToggles.swingView}
              />
 
              <StepGrid 
                steps={currentPattern.kick?.steps || []} 
                totalSteps={currentPattern.kick?.isDoubleTime ? 32 : 16} 
                label="Kick"
                color={activeColor}
                textColor={activeText}
                showVelocity={currentToggles.velocity}
                swing={currentPattern.swing?.kick || 0}
                showSwingView={currentToggles.swingView}
              />
            </div>
          </div>
          
          <div className="mt-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-t border-black/5 dark:border-white/5 pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
              <div className="flex items-center justify-between sm:justify-start gap-4 w-full sm:w-auto cursor-pointer group p-3 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors" onClick={handleToggleVelocity}>
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">Velocity Humanize</span>
                <div className={`w-10 h-5 rounded-full p-1 transition-colors ${currentToggles.velocity ? activeColor : 'bg-black/20 dark:bg-white/20'}`}>
                  <div className={`w-3 h-3 rounded-full bg-white transition-transform ${currentToggles.velocity ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
              </div>
            </div>
            <div className="flex flex-col items-start lg:items-end text-[10px] opacity-50 font-mono w-full lg:w-auto bg-black/5 dark:bg-white/5 p-3 rounded-xl">
              <span>* 1 Bar Loop (16 Steps)</span>
              <span>{currentPattern.hiHat?.isDoubleTime ? '32 Steps (Double Time)' : '16 Steps (Normal)'}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
