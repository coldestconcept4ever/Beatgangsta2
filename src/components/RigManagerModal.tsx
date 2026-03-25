
import React, { useRef, useState, useMemo, useEffect } from 'react';
import { AppTheme, SavedRecipe, SharedSession, VSTPlugin, User, Hardware } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Upload, Users, Zap, Search, Filter, ChevronRight, Package, ShieldCheck, Cpu, RefreshCw, Save, Cloud, CloudDownload, CloudUpload, Settings, X, Copy, Check, Link as LinkIcon } from 'lucide-react';
import { PluginCompareModal } from './PluginCompareModal';
import { COMMON_PLUGIN_MAPPING } from '../constants/pluginMapping';

const getCorrectedType = (item: any) => {
  if (!item.name) return item.type || 'Other';
  
  // Handle Hardware types first
  if (item.source === 'analog') {
    if (item.type === 'instrument') return 'Instruments';
    if (item.type === 'drumkit') return 'Drum Kits';
    if (item.type === 'hardware') return 'Analog Hardware';
    return item.type || 'Analog Gear';
  }

  const lowerName = item.name.toLowerCase();
  const lowerVendor = (item.vendor || '').toLowerCase();
  const lowerType = (item.type || '').toLowerCase();

  // 1. Check mapping first (highest priority)
  for (const [key, mapping] of Object.entries(COMMON_PLUGIN_MAPPING)) {
    if (lowerName.includes(key) || lowerVendor.includes(key)) {
      return mapping.type;
    }
  }

  // 2. Check for specific keywords in name/vendor if no direct mapping
  if (lowerName.includes('synth') || lowerName.includes('instrument') || lowerName.includes('piano') || lowerName.includes('keys') || lowerName.includes('kontakt')) return 'Instruments';
  if (lowerName.includes('eq') || lowerName.includes('equalizer') || lowerName.includes('filter')) return 'Equalizers';
  if (lowerName.includes('comp') || lowerName.includes('limit') || lowerName.includes('gate') || lowerName.includes('dynamics')) return 'Dynamics';
  if (lowerName.includes('verb') || lowerName.includes('delay') || lowerName.includes('echo')) return 'Reverb & Delay';
  if (lowerName.includes('dist') || lowerName.includes('sat') || lowerName.includes('drive') || lowerName.includes('crush')) return 'Distortion & Saturation';
  if (lowerName.includes('chorus') || lowerName.includes('flang') || lowerName.includes('phas') || lowerName.includes('trem') || lowerName.includes('mod')) return 'Modulation';
  if (lowerName.includes('meter') || lowerName.includes('analyz') || lowerName.includes('scope') || lowerName.includes('span') || lowerName.includes('insight') || lowerName.includes('utility')) return 'Utility & Metering';
  if (lowerName.includes('vocal') || lowerName.includes('voice') || lowerName.includes('tune') || lowerName.includes('pitch')) return 'Creative FX';

  // 3. If it's already something specific (not Creative FX or Unknown), keep it
  if (item.type && 
      item.type !== 'Creative FX' && 
      item.type !== 'Unknown' && 
      item.type !== 'Other' && 
      item.type !== 'VST3' && 
      item.type !== 'VST2') {
    return item.type;
  }
  
  // 4. Try to infer from the original type string if it contains keywords
  if (lowerType.includes('instrument') || lowerType.includes('synth')) return 'Instruments';
  if (lowerType.includes('eq') || lowerType.includes('equalizer')) return 'Equalizers';
  if (lowerType.includes('compressor') || lowerType.includes('dynamics')) return 'Dynamics';
  if (lowerType.includes('reverb') || lowerType.includes('delay')) return 'Reverb & Delay';
  
  return item.type || 'Creative FX';
};

const PREFERRED_CATEGORY_ORDER = [
  'Instruments',
  'Drum Kits',
  'Dynamics',
  'Equalizers',
  'Reverb & Delay',
  'Modulation',
  'Distortion & Saturation',
  'Utility & Metering',
  'Creative FX',
  'Analog Hardware',
  'Other'
];

interface RigManagerModalProps {
  theme: AppTheme;
  vault: SavedRecipe[];
  plugins: VSTPlugin[];
  analogInstruments: Hardware[];
  analogHardware: Hardware[];
  drumKits: Hardware[];
  user: User | null;
  activeSession: SharedSession | null;
  onImportRig: (session: SharedSession) => void;
  onImportGear: (session: SharedSession) => void;
  onReplicateRecipe: (recipe: SavedRecipe) => Promise<void>;
  onExportFullSave: () => void;
  onImportFullSave: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCloudBackup: () => Promise<void>;
  onCloudRestore: () => Promise<void>;
  onCompareRigs: (link: string) => void;
  onResetLibrary: () => void;
  isCloudSyncing: boolean;
  cloudDriveUrl: string | null;
  onClose: () => void;
}

type Tab = 'options' | 'compare' | 'reimagine' | 'drumkits';


const ExpandablePluginItem = ({ item, themeStyles, cStyle, key }: { item: any, themeStyles: any, cStyle: string, key?: any }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className={`p-4 rounded-[1.5rem] border ${cStyle} cursor-pointer transition-all`} onClick={() => setExpanded(!expanded)}>
      <div className="flex items-center justify-between">
        <span className="font-bold text-xs">{item.name}</span>
        <ChevronRight className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </div>
      {expanded && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="mt-3 pt-3 border-t border-black/5 text-[10px] opacity-70"
        >
          <p>{item.description || 'No description available.'}</p>
          {item.vendor && <p className="mt-1 font-bold">Vendor: {item.vendor}</p>}
          <p className="mt-1 font-bold">Type: {getCorrectedType(item)}</p>
        </motion.div>
      )}
    </div>
  );
};

export const RigManagerModal: React.FC<RigManagerModalProps> = ({ 
  theme, 
  vault, 
  plugins, 
  analogInstruments,
  analogHardware,
  drumKits,
  user, 
  activeSession,
  onImportRig, 
  onImportGear,
  onReplicateRecipe,
  onExportFullSave,
  onImportFullSave,
  onCloudBackup,
  onCloudRestore,
  onCompareRigs,
  onResetLibrary,
  isCloudSyncing,
  cloudDriveUrl,
  onClose 
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('options');
  const [copied, setCopied] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [friendRigLink, setFriendRigLink] = useState('');
  const [friendPlugins, setFriendPlugins] = useState<VSTPlugin[]>([]);
  const [friendGear, setFriendGear] = useState<Hardware[]>([]);
  const [friendRecipes, setFriendRecipes] = useState<SavedRecipe[]>([]);
  const [isLoadingFriend, setIsLoadingFriend] = useState(false);
  const [compareFilter, setCompareFilter] = useState<'all' | 'type' | 'vendor'>('type');
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fullSaveInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (friendRigLink && friendRigLink.startsWith('https://drive.google.com/')) {
      const timer = setTimeout(() => {
        onCompareRigs(friendRigLink);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [friendRigLink, onCompareRigs]);

  const handleCopy = async () => {
    if (cloudDriveUrl) {
      try {
        await navigator.clipboard.writeText(cloudDriveUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy text: ', err);
      }
    }
  };

  const handleFetchFriendRig = async () => {
    if (!friendRigLink) return;
    
    setIsLoadingFriend(true);
    try {
      // Extract folder ID if it's a Drive link
      // Handles /folders/ID, /d/ID, and direct ID
      const folderIdMatch = friendRigLink.match(/folders\/([a-zA-Z0-9_-]+)/) || friendRigLink.match(/\/d\/([a-zA-Z0-9_-]+)/);
      const folderId = folderIdMatch ? folderIdMatch[1] : friendRigLink.trim();

      console.log('Fetching friend rig with folderId:', folderId);
      const res = await fetch(`/api/cloud/fetch-rig?folderId=${folderId}`);
      if (res.ok) {
        const { gear, recipes } = await res.json();
        if (gear) {
          setFriendPlugins(gear.plugins || []);
          setFriendGear([...(gear.analogInstruments || []), ...(gear.analogHardware || [])]);
          setFriendRecipes(recipes || []);
          alert("Friend's rig and recipes loaded!");
          setActiveTab('compare');
        }
      } else {
        const error = await res.json();
        throw new Error(error.error || "Failed to fetch friend's rig");
      }
    } catch (error: any) {
      console.error('Error fetching friend rig:', error);
      alert(error.message || "Could not load friend's rig. Make sure the link is correct and shared with you.");
    } finally {
      setIsLoadingFriend(false);
    }
  };

  const themeStyles = {
    'coldest': {
      bg: 'bg-white/80',
      border: 'border-white/60',
      text: 'text-[#082f49]',
      inputBg: 'bg-white/40',
      inputBorder: 'border-white/60',
      buttonBg: 'bg-sky-500',
      buttonHover: 'hover:bg-sky-600',
      buttonText: 'text-white',
      tabActiveBg: 'bg-white',
      tabActiveText: 'text-sky-600',
      iconBg: 'bg-sky-500',
      iconText: 'text-white',
      cardBg: 'bg-white/40',
      cardBorder: 'border-white/60',
      cardText: 'text-[#082f49]',
      dividerBg: 'bg-sky-500/50',
    },
    'crazy-bird': {
      bg: 'bg-[#0a0000]/95',
      border: 'border-red-900/50',
      text: 'text-red-50',
      inputBg: 'bg-red-950/20',
      inputBorder: 'border-red-900/40',
      buttonBg: 'bg-red-500',
      buttonHover: 'hover:bg-red-600',
      buttonText: 'text-white',
      tabActiveBg: 'bg-red-500',
      tabActiveText: 'text-white',
      iconBg: 'bg-red-500',
      iconText: 'text-white',
      cardBg: 'bg-red-950/20',
      cardBorder: 'border-red-900/40',
      cardText: 'text-red-50',
      dividerBg: 'bg-red-500/50',
    },
    'hustle-time': {
      bg: 'bg-black/95',
      border: 'border-yellow-900/50',
      text: 'text-yellow-50',
      inputBg: 'bg-zinc-900/20',
      inputBorder: 'border-yellow-900/40',
      buttonBg: 'bg-yellow-500',
      buttonHover: 'hover:bg-yellow-600',
      buttonText: 'text-black',
      tabActiveBg: 'bg-yellow-500',
      tabActiveText: 'text-black',
      iconBg: 'bg-yellow-500',
      iconText: 'text-black',
      cardBg: 'bg-zinc-900/20',
      cardBorder: 'border-yellow-900/40',
      cardText: 'text-yellow-50',
      dividerBg: 'bg-yellow-500/50',
    }
  };

  const styles = themeStyles[theme as keyof typeof themeStyles] || themeStyles.coldest;

  const containerClasses = `${styles.bg} backdrop-blur-2xl border ${styles.border} ${styles.text} shadow-[0_8px_30px_rgba(0,0,0,0.12)]`;
  const cStyle = `${styles.cardBg} ${styles.cardBorder} hover:bg-white/60 ${styles.cardText}`;

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const session: SharedSession = JSON.parse(content);
        if (session.recipe && session.senderPlugins) {
          onImportRig(session);
          setActiveTab('compare');
        } else {
          alert("Invalid rig file format.");
        }
      } catch (err) {
        alert("Could not read rig file. Make sure it's a valid .json exported from BeatGangsta.");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const categorizedGear = useMemo(() => {
    const senderGear = activeSession ? [
      ...activeSession.senderPlugins.map(p => ({ ...p, source: 'vst' as const })),
      ...(activeSession.senderAnalogInstruments || []).map(h => ({ ...h, source: 'analog' as const })),
      ...(activeSession.senderAnalogHardware || []).map(h => ({ ...h, source: 'analog' as const })),
      ...(activeSession.senderDrumKits || []).map(h => ({ ...h, source: 'analog' as const }))
    ] : [
      ...friendPlugins.map(p => ({ ...p, source: 'vst' as const })),
      ...friendGear.map(h => ({ ...h, source: 'analog' as const }))
    ];

    const localGear = [
      ...plugins.map(p => ({ ...p, source: 'vst' as const })),
      ...analogInstruments.map(h => ({ ...h, source: 'analog' as const })),
      ...analogHardware.map(h => ({ ...h, source: 'analog' as const })),
      ...drumKits.map(h => ({ ...h, source: 'analog' as const }))
    ];

    const group = (items: any[]) => {
      if (compareFilter === 'all') return { 'All Gear': items };
      
      return items.reduce((acc, item) => {
        const type = getCorrectedType(item);
        const key = compareFilter === 'type' ? type : (item.vendor || 'Unknown');
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
      }, {} as Record<string, any[]>);
    };

    return {
      sender: group(senderGear),
      local: group(localGear)
    };
  }, [activeSession, friendPlugins, friendGear, plugins, analogInstruments, analogHardware, drumKits, compareFilter]);

  const allCategories = useMemo(() => {
    const cats = new Set([...Object.keys(categorizedGear.sender), ...Object.keys(categorizedGear.local)]);
    return Array.from(cats).sort((a, b) => {
      const indexA = PREFERRED_CATEGORY_ORDER.indexOf(a);
      const indexB = PREFERRED_CATEGORY_ORDER.indexOf(b);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [categorizedGear]);

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-8 bg-black/60 backdrop-blur-xl animate-in fade-in duration-300">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`w-full max-w-6xl h-[95vh] lg:max-h-[90vh] flex flex-col rounded-[2rem] sm:rounded-[4rem] border shadow-2xl relative overflow-hidden ${containerClasses} transition-colors duration-700`}
      >
        {/* Header */}
        <div className="p-8 sm:p-10 border-b border-black/5 flex flex-col lg:flex-row items-center justify-between gap-6 relative">
          <div className="flex items-center gap-5">
            <div>
              <h2 className="text-2xl sm:text-4xl font-black tracking-tighter leading-none">Rig Manager</h2>
            </div>
          </div>

          <div className={`flex ${styles.inputBg} p-1.5 rounded-2xl`}>
            {(['options', 'compare', 'reimagine'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === tab 
                    ? `${styles.tabActiveBg} shadow-md ${styles.tabActiveText} scale-105` 
                    : `${styles.text} opacity-40 hover:opacity-100`
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <button onClick={onClose} className="absolute top-4 right-4 sm:top-8 sm:right-8 p-2 rounded-full hover:bg-black/5 transition-all z-20">
             <CloseIcon className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 sm:p-10 custom-scrollbar">
          <AnimatePresence mode="wait">
            {activeTab === 'options' && (
              <motion.div 
                key="options"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                <div className={`p-8 rounded-[2rem] sm:rounded-[3rem] border flex flex-col items-center text-center group transition-all ${cStyle}`}>
                  <div className={`w-16 h-16 rounded-3xl text-white flex items-center justify-center shadow-xl mb-6 group-hover:scale-110 transition-transform ${styles.iconBg} ${styles.iconText}`}>
                    <Upload className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-black tracking-tight mb-2">Sync Gear with Friends</h3>
                  <p className="text-xs opacity-60 mb-8 font-bold leading-relaxed">Import a friend's rig to compare gear, or reimagine their recipes.</p>
                  <div className="flex flex-col gap-3 w-full">
                    <div className="flex items-center gap-2">
                      <input 
                        type="text"
                        placeholder="Paste friend's cloud rig link here"
                        value={friendRigLink}
                        onChange={(e) => setFriendRigLink(e.target.value)}
                        className={`flex-1 p-3 rounded-full bg-black/5 text-xs font-bold border ${styles.cardBorder}`}
                      />
                      <motion.button 
                        whileTap={{ scale: 0.9 }} 
                        onClick={handleFetchFriendRig}
                        disabled={isLoadingFriend || !friendRigLink}
                        className={`p-3 rounded-full ${styles.buttonBg} ${styles.buttonText} disabled:opacity-50`}
                      >
                        {isLoadingFriend ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CloudDownload className="w-4 h-4" />}
                      </motion.button>
                    </div>

                    <div className="text-[10px] font-black uppercase opacity-40 text-center my-2">or</div>

                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className={`w-full py-4 rounded-full font-black uppercase text-[10px] tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-xl ${styles.buttonBg} ${styles.buttonText} shadow-black/10`}
                    >
                      Upload Rig File
                    </button>

                    <div className={`w-full h-px ${styles.dividerBg} my-8`} />

                    <div className="w-full flex flex-col items-center text-center">
                      <div className={`w-16 h-16 rounded-3xl text-white flex items-center justify-center shadow-xl mb-6 ${styles.iconBg} ${styles.iconText}`}>
                        <LinkIcon className="w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-black tracking-tight mb-2">Share your link</h3>
                      <p className="text-xs opacity-60 mb-8 font-bold leading-relaxed">Share your gear rack and favorite recipes with your friends.</p>
                      <div className="flex items-center gap-2 w-full">
                        <input 
                          type="text"
                          readOnly
                          value={cloudDriveUrl || "no cloud rig file created yet"}
                          className={`flex-1 p-3 rounded-full bg-black/5 text-xs font-bold border ${styles.cardBorder}`}
                        />
                        <motion.button whileTap={{ scale: 0.9 }} onClick={handleCopy} className={`p-3 rounded-full ${styles.buttonBg} ${styles.buttonText}`}>
                          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </motion.button>
                      </div>
                    </div>

                    {activeSession && (
                      <button 
                        onClick={() => onImportGear(activeSession)}
                        className={`w-full py-3 bg-white/10 border rounded-full font-black uppercase text-[9px] tracking-widest transition-all flex items-center justify-center gap-2 ${styles.text} border-current/20 hover:bg-white/10`}
                      >
                        <ShieldCheck className="w-3 h-3" />
                        Restore Gear from Rig
                      </button>
                    )}
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileImport} />
                </div>

                <div className={`p-8 rounded-[2rem] sm:rounded-[3rem] border flex flex-col items-center text-center group transition-all ${cStyle}`}>
                  <div className={`w-16 h-16 rounded-3xl text-white flex items-center justify-center shadow-xl mb-6 group-hover:scale-110 transition-transform ${styles.iconBg} ${styles.iconText}`}>
                    <RefreshCw className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-black tracking-tight mb-2">System Backup</h3>
                  <p className="text-xs opacity-60 mb-8 font-bold leading-relaxed">Create a full system backup or restore your entire studio state from a file.</p>
                  <div className="flex flex-col gap-3 w-full">
                    <button 
                      onClick={onExportFullSave}
                      className={`w-full py-4 rounded-full font-black uppercase text-[10px] tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2 ${styles.buttonBg} ${styles.buttonText} shadow-black/10`}
                    >
                      <Save className="w-3 h-3" />
                      Export Full Backup
                    </button>
                    <button 
                      onClick={() => fullSaveInputRef.current?.click()}
                      className={`w-full py-3 bg-white/10 border rounded-full font-black uppercase text-[9px] tracking-widest transition-all flex items-center justify-center gap-2 ${styles.text} border-current/20 hover:bg-white/10`}
                    >
                      <RefreshCw className="w-3 h-3" />
                      Restore Backup
                    </button>

                    <div className={`w-full h-px ${styles.dividerBg} my-8`} />

                    {user ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shadow-lg ${styles.iconBg} ${styles.iconText}`}>
                            <Cloud className="w-8 h-8" />
                          </div>
                        </div>
                        <h3 className="text-xl font-black tracking-tight mb-2">Cloud Storage</h3>
                        <p className="text-xs opacity-60 mb-8 font-bold leading-relaxed">Connect Google Drive to sync your rig.</p>
                        <button 
                          onClick={onCloudBackup}
                          disabled={isCloudSyncing}
                          className={`w-full py-4 rounded-full font-black uppercase text-[10px] tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 ${styles.buttonBg} ${styles.buttonText} shadow-black/10`}
                        >
                          {isCloudSyncing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CloudUpload className="w-3 h-3" />}
                          Backup to Cloud
                        </button>
                        <button 
                          onClick={onCloudRestore}
                          disabled={isCloudSyncing}
                          className={`w-full py-3 bg-white/10 border rounded-full font-black uppercase text-[9px] tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${styles.text} border-current/20 hover:bg-white/10`}
                        >
                          {isCloudSyncing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CloudDownload className="w-3 h-3" />}
                          Restore from Cloud
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shadow-lg ${styles.iconBg} ${styles.iconText}`}>
                            <Cloud className="w-8 h-8" />
                          </div>
                        </div>
                        <h3 className="text-xl font-black tracking-tight mb-2">Cloud Storage</h3>
                        <p className="text-xs opacity-60 mb-8 font-bold leading-relaxed">Connect Google Drive to sync your rig.</p>
                        <button 
                          onClick={onCloudBackup}
                          className={`w-full py-4 rounded-full font-black uppercase text-[10px] tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2 ${styles.buttonBg} ${styles.buttonText} shadow-black/10`}
                        >
                          <Cloud className="w-3 h-3" />
                          Setup Cloud Backup
                        </button>
                      </div>
                    )}

                  </div>
                  <input type="file" ref={fullSaveInputRef} className="hidden" accept=".json" onChange={onImportFullSave} />
                </div>
              </motion.div>
            )}

            {activeTab === 'compare' && (
              <motion.div 
                key="compare"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {friendPlugins.length === 0 && friendGear.length === 0 && !activeSession ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                    <Users className="w-20 h-20 mb-6" />
                    <h3 className="text-2xl font-black">No Rig Imported</h3>
                    <p className="text-sm font-bold">Import a friend's rig file to start comparing gear.</p>
                  </div>
                ) : (
                  <>
                    <div className={`flex items-center justify-between ${styles.inputBg} p-4 rounded-[1.5rem] sm:rounded-[2rem]`}>
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Filter By:</span>
                        {(['all', 'type', 'vendor'] as const).map(f => (
                          <button
                            key={f}
                            onClick={() => setCompareFilter(f)}
                            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                              compareFilter === f ? `${styles.tabActiveBg} shadow-sm ${styles.tabActiveText}` : `${styles.text} opacity-40 hover:opacity-100`
                            }`}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-12">
                      {allCategories.map(category => (
                        <div key={category} className="space-y-4">
                          <h4 className="text-xs font-black uppercase tracking-widest opacity-50">{category}</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <div className="text-[9px] font-black uppercase tracking-widest opacity-30 mb-2">Their Gear</div>
                              {categorizedGear.sender[category]?.map((item: any, i: number) => (
                                <ExpandablePluginItem key={i} item={item} themeStyles={styles} cStyle={cStyle} />
                              ))}
                            </div>
                            <div className="space-y-2">
                              <div className="text-[9px] font-black uppercase tracking-widest opacity-30 mb-2">Your Gear</div>
                              {categorizedGear.local[category]?.map((item: any, i: number) => (
                                <ExpandablePluginItem key={i} item={item} themeStyles={styles} cStyle={cStyle} />
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {activeTab === 'reimagine' && (
              <motion.div 
                key="reimagine"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {friendRecipes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                    <Package className="w-20 h-20 mb-6" />
                    <h3 className="text-2xl font-black">No Recipes Found</h3>
                    <p className="text-sm font-bold">Import a friend's rig to see their starred recipes.</p>
                  </div>
                ) : (
                  <>
                    <h3 className="text-xl font-black">Friend's Starred Recipes</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {friendRecipes.map((recipe) => (
                        <div key={recipe.id} className={`p-4 rounded-[1.5rem] border ${cStyle} cursor-pointer hover:scale-105 transition-all`}>
                          <h4 className="font-black">{recipe.title}</h4>
                          <p className="text-xs opacity-60">{recipe.description}</p>
                          <motion.button 
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              onReplicateRecipe(recipe);
                              onClose();
                            }}
                            className={`mt-4 w-full py-2 rounded-full text-[9px] font-black uppercase ${styles.buttonBg} ${styles.buttonText}`}
                          >
                            Reimagine
                          </motion.button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

const CloseIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
  </svg>
);
