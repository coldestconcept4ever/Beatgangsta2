import React from 'react';
import { BeatRecipe } from '../types';

export const RecipeHTMLTemplate: React.FC<{ recipe: BeatRecipe, drumKits?: any[] }> = ({ recipe, drumKits = [] }) => {
  const renderDrumGrid = (steps: number[] = [], isDoubleTime?: boolean) => {
    const totalSteps = isDoubleTime ? 32 : 16;
    const effectiveSteps = isDoubleTime && !steps.some(s => s > 16) && steps.length > 0
      ? [...steps, ...steps.map(s => s + 16)]
      : steps;

    return (
      <div className="flex gap-1 mt-2">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-6 md:h-8 rounded-sm ${effectiveSteps.includes(i + 1) ? 'bg-sky-500 print:bg-sky-500' : 'bg-slate-100 print:bg-slate-200'}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="p-8 md:p-16 space-y-16 bg-white text-slate-900">
      {/* Header */}
      <header className="text-center space-y-6 border-b border-slate-200 pb-16 print:border-slate-300">
        <div className="w-24 h-24 mx-auto bg-sky-600 rounded-3xl flex items-center justify-center text-4xl font-black text-white shadow-lg shadow-sky-600/20 mb-8">
          {recipe.title.charAt(0)}
        </div>
        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-slate-900 print:text-black">{recipe.title}</h1>
        <div className="flex items-center justify-center gap-4 text-lg md:text-xl font-bold uppercase tracking-widest text-sky-600">
          <span>{recipe.style}</span>
          <span>•</span>
          <span>{recipe.bpm} BPM</span>
        </div>
        <p className="text-xl italic opacity-80 max-w-3xl mx-auto text-slate-600 print:text-slate-700">"{recipe.description}"</p>
      </header>

      {/* Layering & Master Path */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {recipe.layeringStrategy && (
          <div className="p-8 bg-sky-50 rounded-3xl border border-sky-100 print:bg-slate-50 print:border-slate-200">
            <h3 className="text-sm font-black uppercase tracking-widest text-sky-600 mb-4">Layering Strategy</h3>
            <p className="text-lg font-bold leading-relaxed text-slate-800 print:text-slate-800">{recipe.layeringStrategy}</p>
          </div>
        )}
        {recipe.masterPlugins && recipe.masterPlugins.length > 0 && (
          <div className="p-8 bg-sky-50 rounded-3xl border border-sky-100 print:bg-slate-50 print:border-slate-200">
            <h3 className="text-sm font-black uppercase tracking-widest text-sky-600 mb-4">Mastering Path</h3>
            <div className="flex flex-wrap gap-2">
              {recipe.masterPlugins.map((m, i) => (
                <span key={i} className="px-4 py-2 bg-white rounded-full text-xs font-bold uppercase tracking-widest text-slate-700 border border-sky-200 print:bg-white print:text-slate-800 print:border-slate-300">
                  {m.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Instruments */}
      {recipe.instruments && recipe.instruments.length > 0 && (
        <section className="space-y-8 print-break">
          <h2 className="text-2xl font-black uppercase tracking-widest text-sky-600 border-b border-slate-200 pb-4 print:border-slate-300">Signal Flow Matrix</h2>
          <div className="grid grid-cols-1 gap-8">
            {recipe.instruments.map((inst, idx) => (
              <div key={idx} className="p-8 bg-white rounded-3xl border border-slate-200 shadow-sm print:bg-white print:border-slate-300">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-4 h-4 rounded-full bg-sky-600" />
                  <div className="flex flex-col">
                    <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900 print:text-black">{inst.name}</h3>
                    {inst.plugin && (
                      <span className="text-sm font-bold text-sky-600 print:text-sky-600">{inst.plugin}</span>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Source Goal</h4>
                    <p className="text-lg font-bold italic text-slate-700 print:text-slate-700">"{inst.sourceSoundGoal}"</p>
                  </div>
                  {inst.loopGuide && (
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-sky-600 mb-2">Loop Guide</h4>
                      <p className="text-lg font-bold text-slate-800 print:text-slate-800">{inst.loopGuide}</p>
                    </div>
                  )}
                </div>

                {inst.midiNotes && (
                  <div className="mb-8 p-4 bg-sky-50 rounded-2xl border border-sky-100 print:bg-slate-50 print:border-slate-200">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">MIDI Sequence</h4>
                    <p className="font-mono text-sm text-sky-700 print:text-sky-700">{inst.midiNotes}</p>
                  </div>
                )}

                {inst.deepDive && inst.deepDive.length > 0 && (
                  <div className="mb-8 p-4 bg-slate-50 rounded-2xl border border-slate-100 print:bg-slate-50 print:border-slate-200">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Source Settings</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {inst.deepDive.map((d, dIdx) => (
                        <div key={dIdx} className="flex justify-between text-sm">
                          <span className="text-slate-400 font-bold">{d.parameter}</span>
                          <span className="text-slate-700 font-mono print:text-slate-700">{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {inst.fxPlugins && inst.fxPlugins.length > 0 && (
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-sky-600 mb-4">FX Chain</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {inst.fxPlugins.map((fx, fxIdx) => (
                        <div key={fxIdx} className="p-4 bg-purple-50 rounded-2xl border border-purple-100 print:bg-slate-50 print:border-slate-200">
                          <h5 className="font-black text-slate-900 print:text-black mb-1">{fx.name}</h5>
                          <p className="text-xs font-bold uppercase tracking-widest text-purple-600 mb-3">{fx.purpose}</p>
                          {fx.deepDive && fx.deepDive.length > 0 && (
                            <div className="space-y-1">
                              {fx.deepDive.map((d, dIdx) => (
                                <div key={dIdx} className="flex justify-between text-xs">
                                  <span className="text-purple-400 font-bold">{d.parameter}</span>
                                  <span className="text-purple-700 font-mono print:text-slate-700">{d.value}</span>
                                </div>
                              ))}
                            </div>
                          )}
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

      {/* Drum Patterns */}
      {recipe.drumPatterns && Object.keys(recipe.drumPatterns).length > 0 && (
        <section className="space-y-8 print-break">
          <h2 className="text-2xl font-black uppercase tracking-widest text-sky-600 border-b border-slate-200 pb-4 print:border-slate-300">Drum Guide Protocols</h2>
          <div className="grid grid-cols-1 gap-8">
            {Object.entries(recipe.drumPatterns).map(([section, pattern]: [string, any]) => (
              <div key={section} className="p-8 bg-white rounded-3xl border border-slate-200 shadow-sm print:bg-white print:border-slate-300">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900 print:text-black">{section}</h3>
                  <span className="text-xs font-black uppercase tracking-widest text-sky-600 px-3 py-1 bg-sky-100 rounded-full">
                    {pattern.hiHat.isDoubleTime || pattern.snare.isDoubleTime || pattern.kick.isDoubleTime ? '32 Step Grid' : '16 Step Grid'}
                  </span>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Hi-Hats {pattern.hiHat.isDoubleTime && '(Double Time)'}</h4>
                    {renderDrumGrid(pattern.hiHat.steps, pattern.hiHat.isDoubleTime)}
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">{pattern.snare.isClap ? 'Clap' : 'Snare'} {pattern.snare.isDoubleTime && '(Double Time)'}</h4>
                    {renderDrumGrid(pattern.snare.steps, pattern.snare.isDoubleTime)}
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Kick {pattern.kick.isDoubleTime && '(Double Time)'}</h4>
                    {renderDrumGrid(pattern.kick.steps, pattern.kick.isDoubleTime)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Music Theory */}
      {recipe.chordProgression && (
        <section className="space-y-8 print-break">
          <h2 className="text-2xl font-black uppercase tracking-widest text-sky-600 border-b border-slate-200 pb-4 print:border-slate-300">Music Theory Matrix</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 bg-sky-50 rounded-3xl border border-sky-100 print:bg-sky-50 print:border-sky-200">
              <h3 className="text-sm font-black uppercase tracking-widest text-sky-600 mb-4">Recommended Scale</h3>
              <p className="text-4xl font-black text-slate-900 print:text-black">{recipe.recommendedScale}</p>
            </div>
            <div className="p-8 bg-white rounded-3xl border border-slate-200 shadow-sm print:bg-white print:border-slate-300">
              <h3 className="text-sm font-black uppercase tracking-widest text-sky-600 mb-4">Main Progression</h3>
              <p className="text-2xl font-black text-slate-900 print:text-black">{recipe.chordProgression}</p>
            </div>
          </div>
        </section>
      )}

      {/* Busses */}
      {recipe.busses && recipe.busses.length > 0 && (
        <section className="space-y-8 print-break">
          <h2 className="text-2xl font-black uppercase tracking-widest text-sky-600 border-b border-slate-200 pb-4 print:border-slate-300">Bus Processing Matrix</h2>
          <div className="grid grid-cols-1 gap-8">
            {recipe.busses.map((bus, idx) => (
              <div key={idx} className="p-8 bg-white rounded-3xl border border-slate-200 border-l-4 border-l-sky-600 shadow-sm print:bg-white print:border-slate-300 print:border-l-sky-500">
                <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900 print:text-black mb-6">{bus.name}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {bus.fxPlugins?.map((fx, fxIdx) => (
                    <div key={fxIdx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 print:bg-slate-50 print:border-slate-200">
                      <h5 className="font-black text-slate-900 print:text-black mb-1">{fx.name}</h5>
                      <p className="text-xs font-bold uppercase tracking-widest text-sky-600 mb-3">{fx.purpose}</p>
                      {fx.deepDive && fx.deepDive.length > 0 && (
                        <div className="space-y-1">
                          {fx.deepDive.map((d, dIdx) => (
                            <div key={dIdx} className="flex justify-between text-xs">
                              <span className="text-slate-400 font-bold">{d.parameter}</span>
                              <span className="text-slate-700 font-mono print:text-slate-700">{d.value}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Vocal Elements */}
      {recipe.vocalElements && (
        <section className="space-y-8 print-break">
          <h2 className="text-2xl font-black uppercase tracking-widest text-sky-600 border-b border-slate-200 pb-4 print:border-slate-300">Vocal Elements Brief</h2>
          
          <div className="p-8 bg-white rounded-3xl border border-slate-200 shadow-sm print:bg-white print:border-slate-300 mb-8">
            <h3 className="text-sm font-black uppercase tracking-widest text-sky-600 mb-4">Vocal Layering Strategy</h3>
            <p className="text-xl font-bold italic text-slate-700 print:text-slate-800">"{recipe.vocalElements.layeringStrategy}"</p>
          </div>

          {recipe.vocalElements.trackingChain && (
            <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 print:bg-slate-50 print:border-slate-200 mb-8">
              <h3 className="text-sm font-black uppercase tracking-widest text-sky-600 mb-2">Apollo Tracking Chain</h3>
              <p className="text-xs font-bold text-slate-400 mb-6">{recipe.vocalElements.trackingChain.dspUsageNote}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recipe.vocalElements.trackingChain.unisonPlugin && (
                  <div className="p-4 bg-sky-100 rounded-2xl border border-sky-200 print:bg-sky-50 print:border-sky-200">
                    <h4 className="text-xs font-black uppercase tracking-widest text-sky-600 mb-1">Unison Preamp</h4>
                    <h5 className="font-black text-slate-900 print:text-black mb-3">{recipe.vocalElements.trackingChain.unisonPlugin.name}</h5>
                    {recipe.vocalElements.trackingChain.unisonPlugin.deepDive && (
                      <div className="space-y-1">
                        {recipe.vocalElements.trackingChain.unisonPlugin.deepDive.map((d, dIdx) => (
                          <div key={dIdx} className="flex justify-between text-xs">
                            <span className="text-sky-700/70 font-bold">{d.parameter}</span>
                            <span className="text-sky-900 font-mono print:text-slate-700">{d.value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {recipe.vocalElements.trackingChain.inserts?.map((fx, fxIdx) => (
                  <div key={fxIdx} className="p-4 bg-white rounded-2xl border border-slate-200 print:bg-white print:border-slate-300">
                    <h5 className="font-black text-slate-900 print:text-black mb-1">{fx.name}</h5>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">{fx.purpose}</p>
                    {fx.deepDive && fx.deepDive.length > 0 && (
                      <div className="space-y-1">
                        {fx.deepDive.map((d, dIdx) => (
                          <div key={dIdx} className="flex justify-between text-xs">
                            <span className="text-slate-400 font-bold">{d.parameter}</span>
                            <span className="text-slate-700 font-mono print:text-slate-700">{d.value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {recipe.vocalElements.vocalTracks && recipe.vocalElements.vocalTracks.length > 0 && (
            <div className="grid grid-cols-1 gap-8">
              {recipe.vocalElements.vocalTracks.map((track, idx) => (
                <div key={idx} className="p-8 bg-white rounded-3xl border border-slate-200 shadow-sm print:bg-white print:border-slate-300">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-4 h-4 rounded-full bg-sky-600" />
                    <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900 print:text-black">{track.name}</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Source Goal</h4>
                      <p className="text-lg font-bold italic text-slate-700 print:text-slate-700">"{track.sourceSoundGoal}"</p>
                    </div>
                    {track.loopGuide && (
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-sky-600 mb-2">Arrangement Guide</h4>
                        <p className="text-lg font-bold text-slate-800 print:text-slate-800">{track.loopGuide}</p>
                      </div>
                    )}
                  </div>

                  {track.fxPlugins && track.fxPlugins.length > 0 && (
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-sky-600 mb-4">Processing Chain</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {track.fxPlugins.map((fx, fxIdx) => (
                          <div key={fxIdx} className="p-4 bg-purple-50 rounded-2xl border border-purple-100 print:bg-slate-50 print:border-slate-200">
                            <h5 className="font-black text-slate-900 print:text-black mb-1">{fx.name}</h5>
                            <p className="text-xs font-bold uppercase tracking-widest text-purple-600 mb-3">{fx.purpose}</p>
                            {fx.deepDive && fx.deepDive.length > 0 && (
                              <div className="space-y-1">
                                {fx.deepDive.map((d, dIdx) => (
                                  <div key={dIdx} className="flex justify-between text-xs">
                                    <span className="text-purple-400 font-bold">{d.parameter}</span>
                                    <span className="text-purple-700 font-mono print:text-slate-700">{d.value}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Mastering Chain */}
      {recipe.masterPlugins && recipe.masterPlugins.length > 0 && (
        <section className="space-y-8 print-break">
          <h2 className="text-2xl font-black uppercase tracking-widest text-sky-600 border-b border-slate-200 pb-4 print:border-slate-300">Mastering Chain Protocols</h2>
          <div className="grid grid-cols-1 gap-8">
            {recipe.masterPlugins.map((plugin, idx) => (
              <div key={idx} className="p-8 bg-white rounded-3xl border border-slate-200 shadow-sm print:bg-white print:border-slate-300">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900 print:text-black">{plugin.name}</h3>
                  <span className="text-xs font-black uppercase tracking-widest text-slate-400 px-3 py-1 bg-slate-50 rounded-full print:bg-slate-100">
                    Master {idx + 1}
                  </span>
                </div>
                {plugin.deepDive && plugin.deepDive.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {plugin.deepDive.map((d, dIdx) => (
                      <div key={dIdx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center print:bg-slate-50 print:border-slate-200">
                        <span className="text-xs font-black uppercase tracking-widest text-slate-400">{d.parameter}</span>
                        <span className="text-lg font-black text-sky-600 print:text-sky-600">{d.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Drum Kit Advice */}
      {recipe.drumKitAdvice && drumKits.length > 0 && (
        <section className="space-y-8 print-break">
          <h2 className="text-2xl font-black uppercase tracking-widest text-sky-600 border-b border-slate-200 pb-4 print:border-slate-300">Drum Kit Tuning & Setup</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 bg-white rounded-3xl border border-slate-200 shadow-sm print:bg-white print:border-slate-300">
              <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 print:text-black mb-4">Kick</h3>
              <p className="text-slate-600 font-bold leading-relaxed print:text-slate-700">{recipe.drumKitAdvice.kick}</p>
            </div>
            <div className="p-8 bg-white rounded-3xl border border-slate-200 shadow-sm print:bg-white print:border-slate-300">
              <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 print:text-black mb-4">Snare</h3>
              <p className="text-slate-600 font-bold leading-relaxed print:text-slate-700">{recipe.drumKitAdvice.snare}</p>
            </div>
            <div className="p-8 bg-white rounded-3xl border border-slate-200 shadow-sm print:bg-white print:border-slate-300">
              <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 print:text-black mb-4">Toms</h3>
              <p className="text-slate-600 font-bold leading-relaxed print:text-slate-700">{recipe.drumKitAdvice.toms}</p>
            </div>
          </div>
        </section>
      )}

      {/* Verdict */}
      {recipe.mixingAdvice && (
        <section className="text-center space-y-8 py-16 border-t border-slate-200 print-break print:border-slate-300">
          <h2 className="text-sm font-black uppercase tracking-widest text-sky-600">Engineering Verdict</h2>
          <p className="text-3xl md:text-4xl font-black leading-tight max-w-4xl mx-auto text-slate-900 print:text-black tracking-tight">
            {recipe.mixingAdvice}
          </p>
          <div className="pt-16">
            <div className="w-16 h-1 mx-auto rounded-full bg-sky-600 mb-8" />
            <p className="text-xs font-black uppercase tracking-widest opacity-40 text-slate-400">End of Manual</p>
          </div>
        </section>
      )}
    </div>
  );
};
