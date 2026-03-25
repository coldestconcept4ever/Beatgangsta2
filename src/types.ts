
export interface VSTPlugin {
  vendor: string;
  name: string;
  type: string;
  version: string;
  lastModified: string;
  description?: string;
  features?: string[];
}

export interface FullSaveFile {
  version: string;
  timestamp: number;
  userProfile: {
    name: string;
    photo: string;
  };
  gear: {
    plugins: VSTPlugin[];
    analogInstruments: Hardware[];
    analogHardware: Hardware[];
    drumKits?: Hardware[];
    starredPlugins: string[];
    starredHardware: string[];
    deletedPlugins: VSTPlugin[];
    deletedInstruments: Hardware[];
    deletedHardware: Hardware[];
  };
  vault: {
    recipes: SavedRecipe[];
    critiques?: SavedCritique[];
    folders: Folder[];
  };
  ui: {
    theme: AppTheme;
    grillStyle: GrillStyle;
    knifeStyle: KnifeStyle;
    duragStyle: DuragStyle;
    pendantStyle: PendantStyle;
    chainStyle: ChainStyle;
    saberColor: string;
    mascotColor: string;
    showChain: boolean;
    highEyes: boolean;
    isCigarEquipped: boolean;
    isTossingCigar: boolean;
    showSparkles: boolean;
  };
}

export interface Hardware {
  vendor: string;
  name: string;
  type: 'instrument' | 'hardware' | 'drumkit';
  description?: string;
  drumKitData?: DrumKit;
}

export interface DrumPart {
  brand: string;
  model: string;
  size?: string;
  tuning?: string;
  muffling?: string;
  notes?: string;
  label?: string;
}

export interface DrumKit {
  kick: DrumPart;
  snare: DrumPart;
  toms: DrumPart;
  hiHats: DrumPart;
  cymbals: DrumPart;
  additionalParts?: DrumPart[];
}

export interface SignalChainStep {
  pluginName: string;
  purpose: string;
}

export interface ParameterSetting {
  parameter: string;
  value: string;
  explanation: string;
}

export interface DeepDivePlugin {
  name: string;
  purpose: string;
  deepDive: ParameterSetting[];
}

export interface MidiNote {
  pitch: string;
  duration: string;
  wait: string;
  velocity: number;
}

export interface InstrumentTrack {
  name: string;
  plugin?: string;
  type: 'vst' | 'analog' | 'other';
  sourceSoundGoal: string;
  deepDive: ParameterSetting[];
  fxPlugins: DeepDivePlugin[];
  busSend?: string;
  loopGuide?: string;
  midiNotes?: MidiNote[];
}

export interface BusTrack {
  name: string;
  tracksUsingBus: string[];
  fxPlugins: DeepDivePlugin[];
}

export interface GangstaVoxRecipe {
  trackingChain?: {
    unisonPlugin?: DeepDivePlugin;
    inserts: DeepDivePlugin[];
    dspUsageNote?: string;
  };
  vocalTracks: {
    name: string;
    sourceSoundGoal: string;
    fxPlugins: DeepDivePlugin[];
    busSend?: string;
    loopGuide?: string;
  }[];
  layeringStrategy: string;
}

export interface DrumPattern {
  kick: {
    isDoubleTime?: boolean;
    steps: number[];
  };
  snare: {
    isClap: boolean;
    isDoubleTime?: boolean;
    steps: number[];
  };
  hiHat: {
    isDoubleTime: boolean;
    steps: number[];
  };
  velocityHumanized: boolean;
  swing: {
    kick: number;
    snare: number;
    hiHat: number;
  };
}

export interface BeatRecipe {
  title: string;
  style: string;
  bpm: number;
  description: string;
  artistTypes: string[];
  
  instruments: InstrumentTrack[];
  busses: BusTrack[];
  
  drumPatterns: {
    intro: DrumPattern;
    verse: DrumPattern;
    hook: DrumPattern;
    bridge: DrumPattern;
    outro: DrumPattern;
  };
  
  arrangement: Record<string, string>;
  
  masterPlugins: DeepDivePlugin[];
  
  isGangstaVox?: boolean;
  gangstaVox?: GangstaVoxRecipe;
  
  recommendedScale?: string;
  chordProgression?: string;
  mixingAdvice?: string;
  vocalElements?: GangstaVoxRecipe;
  drumKitAdvice?: {
    kick: string;
    snare: string;
    toms: string;
  };
  audioBase64?: string;
  mimeType?: string;
  specificHelp?: {
    query: string;
    advice: string;
    recommendedChain: {
      pluginName: string;
      purpose: string;
      settings: string;
    }[];
  }[];
}

export interface Folder {
  id: string;
  name: string;
  color?: string;
}

export interface SharedSession {
  recipe: SavedRecipe; // Primary recipe
  recipes?: SavedRecipe[]; // All recipes in vault
  critiques?: SavedCritique[]; // All critiques in vault
  senderPlugins: VSTPlugin[];
  senderAnalogInstruments?: Hardware[];
  senderAnalogHardware?: Hardware[];
  senderDrumKits?: Hardware[];
  senderName: string;
}

export interface SavedRecipe extends BeatRecipe {
  id: string;
  savedAt: string;
  bubbleColor: string;
  folderId?: string;
  linkedPresetId?: string;
}

export interface HistoryItem extends BeatRecipe {
  generatedAt: string;
}

export interface TutorialProgress {
  completedPhases: string[];
  currentPhase: string;
  currentStep: number;
  lastUpdated: string;
  isFullyCompleted: boolean;
}

export interface User {
  uid: string;
  name: string;
  email: string;
  photo: string;
  termsAccepted?: boolean;
  termsAcceptedAt?: string;
  firebaseToken?: string;
}

export interface MixCritique {
  id: string;
  title: string;
  overallFeedback: string;
  strengths: string[];
  weaknesses: string[];
  actionPlan: {
    issue: string;
    solution: string;
    recommendedChain: {
      pluginName: string;
      purpose: string;
      settings: string;
    }[];
  }[];
  specificHelp?: {
    query: string;
    advice: string;
    recommendedChain: {
      pluginName: string;
      purpose: string;
      settings: string;
    }[];
  }[];
  isGangstaVox?: boolean;
  audioBase64?: string;
  mimeType?: string;
}

export interface RecommendationResponse {
  recipes: BeatRecipe[];
}

export type AppTheme = 'coldest' | 'crazy-bird' | 'hustle-time';

export type GrillStyle = 'diamond' | 'aquabberry-diamond' | 'gold' | 'opal' | 'rose-gold' | 'blue-diamond';

export type KnifeStyle = 'standard' | 'gold' | 'bloody' | 'adamant' | 'mythril' | 'samuels-saber' | 'dark-saber' | 'steak-knife';

export type PendantStyle = 'silver' | 'gold' | 'rose-gold' | 'diamond' | 'blue-diamond';

export type ChainStyle = 'silver' | 'gold' | 'rose-gold' | 'diamond' | 'blue-diamond';

export type DuragStyle = 'standard' | 'royal-green' | 'purplesilk' | 'sound-ninja' | 'rasta' | 'chef-hat';

export interface SavedCritique extends MixCritique {
  savedAt: string;
  folderId?: string;
}
