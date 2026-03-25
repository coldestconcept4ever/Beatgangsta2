export const pluginDetails: Record<string, { description: string; year: number }> = {
  "Serum": { description: "Advanced wavetable synthesizer with high-quality sound and visual workflow.", year: 2014 },
  "Massive": { description: "Heavyweight synthesizer for fat basses and piercing leads.", year: 2006 },
  "Sylenth1": { description: "Virtual analog VSTi synthesizer known for its warmth and clarity.", year: 2006 },
  "Omnisphere": { description: "Flagship synthesizer with massive library and deep synthesis capabilities.", year: 2008 },
  "Kontakt": { description: "Industry-standard sampler with a vast library of instruments.", year: 2002 },
  "Pro-Q 3": { description: "High-quality EQ plugin with perfect analog matching and dynamic EQ.", year: 2018 },
  "Valhalla VintageVerb": { description: "Postmodern reverb plugin inspired by classic hardware digital reverbs.", year: 2012 },
  "Ozone 11": { description: "Comprehensive mastering suite with AI-powered assistance.", year: 2023 },
  "RC-20 Retro Color": { description: "Creative effect plugin that adds life and texture inspired by classic gear.", year: 2017 },
  "Diva": { description: "Virtual analog synthesizer that captures the spirit of various classic synths.", year: 2011 },
  "Spire": { description: "Polyphonic software synthesizer that combines powerful sound engine modulation.", year: 2013 },
  "Nexus": { description: "ROM synthesizer featuring high-quality sounds for electronic music.", year: 2006 },
  "Auto-Tune Pro": { description: "The industry standard for professional pitch correction.", year: 1997 },
  "Decapitator": { description: "Analog saturation modeler that brings hardware character to digital tracks.", year: 2010 },
  "Soothe2": { description: "Dynamic resonance suppressor that removes harshness automatically.", year: 2020 },
  "Phase Plant": { description: "Modular synthesizer with limitless sound design possibilities.", year: 2019 },
  "Pigments": { description: "Polychrome software synthesizer with multiple synthesis engines.", year: 2018 },
  "Keyscape": { description: "Collector keyboards virtual instrument with rare and restored pianos.", year: 2016 },
  "Trilian": { description: "Total bass module featuring acoustic, electric, and synth basses.", year: 2009 },
  "Saturn 2": { description: "Multiband distortion, saturation and amplifier modeling plugin.", year: 2020 },
  "Pro-C 2": { description: "High-quality compressor plugin with versatile routing and sidechaining.", year: 2015 },
  "Pro-L 2": { description: "Feature-packed true peak limiter plugin.", year: 2017 },
  "Gullfoss": { description: "Intelligent EQ that uses computational auditory perception.", year: 2018 },
  "Trackspacer": { description: "Creates space in a mix by carving frequencies based on a sidechain signal.", year: 2012 },
  "ShaperBox 3": { description: "Rhythmic effects plugin for modern mix manipulation.", year: 2022 },
  "Thermal": { description: "Interactive distortion plugin with multi-stage processing.", year: 2020 },
  "Portal": { description: "Granular synthesis effect plugin for transforming audio.", year: 2019 },
  "HalfTime": { description: "Instant half-speed effect for creating dark, down-tempo vibes.", year: 2017 },
  "Gross Beat": { description: "Time and volume manipulation effect.", year: 2008 },
  "Edison": { description: "Fully integrated audio editing and recording tool.", year: 2007 },
};

export const getPluginInfo = (name: string, type: string) => {
  for (const [key, info] of Object.entries(pluginDetails)) {
    if (name.toLowerCase().includes(key.toLowerCase())) {
      return info;
    }
  }
  
  // Generic fallbacks
  const t = type.toLowerCase();
  const n = name.toLowerCase();
  
  let desc = "Professional audio processing tool.";
  if (t.includes('eq') || n.includes('eq')) desc = "Equalizer for shaping frequency balance.";
  else if (t.includes('comp') || n.includes('comp')) desc = "Dynamic range compressor for controlling levels.";
  else if (t.includes('verb') || n.includes('verb')) desc = "Reverb effect for adding spatial depth.";
  else if (t.includes('delay') || n.includes('delay')) desc = "Delay effect for creating echoes and space.";
  else if (t.includes('synth') || n.includes('synth')) desc = "Synthesizer for generating electronic sounds.";
  else if (t.includes('dist') || n.includes('dist') || n.includes('sat')) desc = "Distortion/saturation for adding harmonics and grit.";
  else if (t.includes('chorus') || n.includes('chorus')) desc = "Chorus effect for widening and thickening sound.";
  else if (t.includes('mod') || n.includes('mod')) desc = "Modulation effect for adding movement.";
  else if (t.includes('inst') || n.includes('inst') || n.includes('piano') || n.includes('guitar') || n.includes('bass')) desc = "Virtual instrument for music production.";
  else if (t.includes('limit') || n.includes('limit')) desc = "Limiter for maximizing loudness and preventing clipping.";
  else if (t.includes('master') || n.includes('master')) desc = "Mastering processor for final mix polish.";
  else if (t.includes('vocal') || n.includes('vocal') || n.includes('pitch')) desc = "Vocal processing and pitch correction tool.";

  // Generate a plausible year based on the name string length and char codes to be deterministic
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const year = 2000 + (Math.abs(hash) % 24); // 2000 to 2023

  return { description: desc, year };
};
