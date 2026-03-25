
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Drum, Save, Mic, Settings2, Info, Sparkles, ChevronRight, ChevronDown } from 'lucide-react';
import { Hardware, DrumKit, DrumPart } from '../types';
import { DRUM_BRANDS, DRUM_TUNING_PRESETS } from '../constants';
import { DRUM_PART_TYPES, DRUM_PART_MODELS } from '../data/drumParts';

import { STOCK_DRUM_KITS, StockDrumKit } from '../data/stockDrumKits';

interface DrumKitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (kit: Hardware) => void;
  initialKit?: Hardware;
  theme: string;
}

const DEFAULT_PART: DrumPart = { brand: '', model: '', size: '', tuning: '', muffling: '', notes: '' };

const DEFAULT_DRUM_KIT: DrumKit = {
  kick: { ...DEFAULT_PART },
  snare: { ...DEFAULT_PART },
  toms: { ...DEFAULT_PART },
  hiHats: { ...DEFAULT_PART },
  cymbals: { ...DEFAULT_PART },
  additionalParts: []
};

export const DrumKitModal: React.FC<DrumKitModalProps> = ({ isOpen, onClose, onSave, initialKit, theme }) => {
  const [kitName, setKitName] = useState(initialKit?.name || 'My Custom Kit');
  const [kitVendor, setKitVendor] = useState(initialKit?.vendor || 'Custom');
  const [drumKitData, setDrumKitData] = useState<DrumKit>(initialKit?.drumKitData || DEFAULT_DRUM_KIT);
  const [expandedPart, setExpandedPart] = useState<string | null>('kick');
  const [kitType, setKitType] = useState<'custom' | 'stock'>('custom');
  const [showAddPartMenu, setShowAddPartMenu] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');

  const brands = Array.from(new Set(STOCK_DRUM_KITS.map(k => k.brand)));
  const models = STOCK_DRUM_KITS.filter(k => k.brand === selectedBrand).map(k => k.model);

  const handleStockKitChange = (brand: string, model: string) => {
    setSelectedBrand(brand);
    setSelectedModel(model);
    const stockKit = STOCK_DRUM_KITS.find(k => k.brand === brand && k.model === model);
    if (stockKit) {
      setDrumKitData(stockKit.kit);
      setKitVendor(brand);
      setKitName(`${brand} ${model}`);
    }
  };

  const handlePartChange = (part: keyof DrumKit, field: keyof DrumPart, value: string, index?: number) => {
    setDrumKitData(prev => {
      if (part === 'additionalParts' && index !== undefined) {
        const newParts = [...(prev.additionalParts || [])];
        newParts[index] = { ...newParts[index], [field]: value };
        return { ...prev, additionalParts: newParts };
      }
      return {
        ...prev,
        [part]: {
          ...(prev[part] as DrumPart),
          [field]: value
        }
      };
    });
  };

  const handleSave = () => {
    const hardware: Hardware = {
      name: kitName,
      vendor: kitVendor,
      type: 'drumkit',
      drumKitData: drumKitData
    };
    onSave(hardware);
    onClose();
  };

  const applyPreset = (preset: typeof DRUM_TUNING_PRESETS[0]) => {
    setDrumKitData(prev => ({
      ...prev,
      kick: { ...prev.kick, tuning: preset.kick, muffling: preset.muffling || prev.kick.muffling },
      snare: { ...prev.snare, tuning: preset.snare, muffling: preset.muffling || prev.snare.muffling },
      toms: { ...prev.toms, tuning: preset.toms, muffling: preset.muffling || prev.toms.muffling },
    }));
  };

  const renderPartEditor = (id: string, label: string, part: keyof DrumKit, index?: number) => {
    const data = index !== undefined ? (drumKitData.additionalParts?.[index] || DEFAULT_PART) : (drumKitData[part] as DrumPart);
    const isExpanded = expandedPart === id;

    return (
      <div className={`border rounded-2xl mb-3 transition-all ${styles.border} ${isExpanded ? styles.expandedBg : ''}`}>
        <button 
          onClick={() => setExpandedPart(isExpanded ? null : id)}
          className="w-full flex items-center justify-between p-4 text-left"
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${styles.iconBg} ${styles.iconText}`}>
              <Drum size={16} />
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-widest opacity-50">{data.label || label}</span>
              <div className="text-sm font-bold">
                {data.brand === 'Not included in kit' 
                  ? 'Not included in kit' 
                  : `${data.brand || 'Select Brand'} ${data.model}`}
              </div>
            </div>
          </div>
          {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 pt-0 grid grid-cols-2 gap-3">
                {index !== undefined && (
                  <div className="col-span-2 space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-50">Part Name (e.g. Kick 2, Cowbell)</label>
                    <input 
                      type="text"
                      value={data.label || ''}
                      onChange={(e) => handlePartChange(part, 'label', e.target.value, index)}
                      placeholder="e.g. Kick 2"
                      className={`w-full p-2 rounded-xl text-xs font-bold border outline-none ${styles.inputBg} ${styles.inputBorder}`}
                    />
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-50">Brand / Model</label>
                  <select 
                    value={`${data.brand}|${data.model}`}
                    onChange={(e) => {
                      const [brand, model] = e.target.value.split('|');
                      handlePartChange(part, 'brand', brand, index);
                      handlePartChange(part, 'model', model, index);
                      
                      const partLabel = data.label || label;
                      const modelEntry = DRUM_PART_MODELS[partLabel]?.find(m => m.brand === brand && m.model === model);
                      if (modelEntry && modelEntry.commonSizes && modelEntry.commonSizes.length > 0) {
                        handlePartChange(part, 'size', modelEntry.commonSizes[0], index);
                      }
                    }}
                    className={`w-full p-2 rounded-xl text-xs font-bold border outline-none ${styles.inputBg} ${styles.inputBorder}`}
                  >
                    <option value="|">Select Brand/Model</option>
                    {DRUM_PART_MODELS[data.label || label]?.map(m => (
                      <option key={`${m.brand}-${m.model}`} value={`${m.brand}|${m.model}`}>{m.brand} - {m.model}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-50">Size</label>
                  {(() => {
                    const partLabel = data.label || label;
                    const modelEntry = DRUM_PART_MODELS[partLabel]?.find(m => m.brand === data.brand && m.model === data.model);
                    if (modelEntry && modelEntry.commonSizes && modelEntry.commonSizes.length > 0) {
                      return (
                        <select 
                          value={data.size || ''}
                          onChange={(e) => handlePartChange(part, 'size', e.target.value, index)}
                          className={`w-full p-2 rounded-xl text-xs font-bold border outline-none ${styles.inputBg} ${styles.inputBorder}`}
                        >
                          <option value="">Select Size</option>
                          {modelEntry.commonSizes.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      );
                    }
                    return (
                      <input 
                        type="text"
                        value={data.size || ''}
                        onChange={(e) => handlePartChange(part, 'size', e.target.value, index)}
                        placeholder="e.g. 14x5.5"
                        className={`w-full p-2 rounded-xl text-xs font-bold border outline-none ${styles.inputBg} ${styles.inputBorder}`}
                      />
                    );
                  })()}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-50">Tuning</label>
                  <input 
                    type="text"
                    value={data.tuning || ''}
                    onChange={(e) => handlePartChange(part, 'tuning', e.target.value, index)}
                    placeholder="e.g. Medium-High"
                    className={`w-full p-2 rounded-xl text-xs font-bold border outline-none ${styles.inputBg} ${styles.inputBorder}`}
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-50">Muffling / Creative Shaping</label>
                  <input 
                    type="text"
                    value={data.muffling || ''}
                    onChange={(e) => handlePartChange(part, 'muffling', e.target.value, index)}
                    placeholder="e.g. Wallet on snare, Moon Gel"
                    className={`w-full p-2 rounded-xl text-xs font-bold border outline-none ${styles.inputBg} ${styles.inputBorder}`}
                  />
                </div>
                {index !== undefined && (
                  <div className="col-span-2">
                    <button
                      onClick={() => {
                        setDrumKitData(prev => ({
                          ...prev,
                          additionalParts: prev.additionalParts?.filter((_, i) => i !== index)
                        }));
                      }}
                      className="w-full p-2 rounded-xl text-xs font-bold text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                      Remove Part
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const themeStyles = {
    'coldest': {
      bg: 'bg-white',
      border: 'border-sky-200',
      text: 'text-sky-900',
      inputBg: 'bg-sky-50',
      inputBorder: 'border-sky-200',
      buttonBg: 'bg-sky-100',
      buttonHover: 'hover:bg-sky-200',
      iconBg: 'bg-sky-100',
      iconText: 'text-sky-600',
      expandedBg: 'bg-sky-50/50',
      buttonText: 'text-sky-500',
    },
    'crazy-bird': {
      bg: 'bg-[#0a0000]',
      border: 'border-red-900/50',
      text: 'text-red-50',
      inputBg: 'bg-red-950/20',
      inputBorder: 'border-red-900/40',
      buttonBg: 'bg-red-950/40',
      buttonHover: 'hover:bg-red-950/60',
      iconBg: 'bg-red-950/40',
      iconText: 'text-red-400',
      expandedBg: 'bg-red-950/20',
      buttonText: 'text-red-400',
    },
    'hustle-time': {
      bg: 'bg-black',
      border: 'border-yellow-900/50',
      text: 'text-yellow-50',
      inputBg: 'bg-zinc-900/20',
      inputBorder: 'border-yellow-900/40',
      buttonBg: 'bg-zinc-900/40',
      buttonHover: 'hover:bg-zinc-900/60',
      iconBg: 'bg-zinc-900/40',
      iconText: 'text-yellow-400',
      expandedBg: 'bg-zinc-900/20',
      buttonText: 'text-yellow-400',
    }
  };

  const styles = themeStyles[theme as keyof typeof themeStyles] || {
    bg: 'bg-[#0a0a0a]',
    border: 'border-white/10',
    text: 'text-white',
    inputBg: 'bg-white/5',
    inputBorder: 'border-white/10',
    buttonBg: 'bg-white/5',
    buttonHover: 'hover:bg-white/10',
    iconBg: 'bg-white/10',
    iconText: 'text-white',
    expandedBg: 'bg-white/5',
    buttonText: 'text-white/50',
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[400000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className={`w-full max-w-2xl rounded-[2.5rem] border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${styles.bg} ${styles.border} ${styles.text}`}
      >
        {/* Header */}
        <div className="p-6 border-b border-current/10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/20 flex items-center justify-center text-orange-500">
              <Drum size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tighter">Drum Kit Lab</h2>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">Configure your custom shell pack</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-50">Kit Type</label>
                  <select 
                    value={kitType}
                    onChange={(e) => setKitType(e.target.value as 'custom' | 'stock')}
                    className={`w-full p-3 rounded-2xl font-bold border outline-none ${styles.inputBg} ${styles.inputBorder}`}
                  >
                    <option value="custom">Custom Kit</option>
                    <option value="stock">Stock Kit</option>
                  </select>
                </div>
                {kitType === 'stock' ? (
                  <>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest opacity-50">Brand</label>
                      <select 
                        value={selectedBrand}
                        onChange={(e) => {
                          setSelectedBrand(e.target.value);
                          setSelectedModel('');
                        }}
                        className={`w-full p-3 rounded-2xl font-bold border outline-none ${styles.inputBg} ${styles.inputBorder}`}
                      >
                        <option value="">Select Brand</option>
                        {brands.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest opacity-50">Model</label>
                      <select 
                        value={selectedModel}
                        onChange={(e) => handleStockKitChange(selectedBrand, e.target.value)}
                        className={`w-full p-3 rounded-2xl font-bold border outline-none ${styles.inputBg} ${styles.inputBorder}`}
                      >
                        <option value="">Select Model</option>
                        {models.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest opacity-50">Kit Name</label>
                      <input 
                        type="text"
                        value={kitName}
                        onChange={(e) => setKitName(e.target.value)}
                        className={`w-full p-3 rounded-2xl font-bold border outline-none ${styles.inputBg} ${styles.inputBorder}`}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest opacity-50">Main Brand</label>
                      <select 
                        value={kitVendor}
                        onChange={(e) => setKitVendor(e.target.value)}
                        className={`w-full p-3 rounded-2xl font-bold border outline-none ${styles.inputBg} ${styles.inputBorder}`}
                      >
                        <option value="Custom">Custom / Mixed</option>
                        {DRUM_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                  </>
                )}
              </div>

              <div>
                <h3 className="text-xs font-black uppercase tracking-widest mb-4 opacity-70 flex items-center gap-2">
                  <Settings2 size={14} />
                  Shells & Hardware
                </h3>
                {renderPartEditor('kick', 'Kick Drum', 'kick')}
                {renderPartEditor('snare', 'Snare Drum', 'snare')}
                {renderPartEditor('toms', 'Rack & Floor Toms', 'toms')}
                {renderPartEditor('hihats', 'Hi-Hats', 'hiHats')}
                {renderPartEditor('cymbals', 'Cymbals', 'cymbals')}
                {drumKitData.additionalParts?.map((part, index) => (
                  <div key={index}>
                    {renderPartEditor(`additional-${index}`, part.label || 'Additional Part', 'additionalParts', index)}
                  </div>
                ))}
                <div className="relative">
                  <button
                    onClick={() => setShowAddPartMenu(!showAddPartMenu)}
                    className={`w-full p-4 rounded-2xl border-2 border-dashed flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-widest transition-all ${styles.border} ${styles.buttonText} hover:${styles.buttonBg}`}
                  >
                    <span className="text-lg">+</span> Add Drum / Percussion
                  </button>
                  {showAddPartMenu && (
                    <div className={`absolute bottom-full mb-2 w-full max-h-60 overflow-y-auto rounded-2xl border p-2 z-10 ${styles.bg} ${styles.border}`}>
                      {DRUM_PART_TYPES.map(type => (
                        <button
                          key={type}
                          onClick={() => {
                            setDrumKitData(prev => ({
                              ...prev,
                              additionalParts: [...(prev.additionalParts || []), { ...DEFAULT_PART, label: type }]
                            }));
                            setShowAddPartMenu(false);
                          }}
                          className="w-full p-2 text-left text-xs font-bold hover:bg-white/10 rounded-lg"
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

        {/* Footer */}
        <div className="p-6 border-t border-current/10 flex items-center justify-between bg-black/5">
          <div className="flex items-center gap-2 opacity-40">
            <Info size={14} />
            <span className="text-[9px] font-bold uppercase tracking-widest">AI will use this kit for research</span>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className={`px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all ${styles.buttonBg} ${styles.buttonHover}`}
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              className="px-8 py-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-orange-500/20 flex items-center gap-2 transition-all active:scale-95"
            >
              <Save size={14} />
              Save Kit to Gear
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
