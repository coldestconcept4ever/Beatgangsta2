import React, { useState, useEffect, useRef } from 'react';
import { analogInstruments, analogHardware } from '../data/analogEquipment';
import { equipmentDetails } from '../data/equipmentDetails';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';

interface AnalogEquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: string;
  onSave: (instruments: string[], hardware: string[]) => Promise<boolean>;
}

type MenuLevel = 'type' | 'category' | 'brand' | 'model';

export const AnalogEquipmentModal: React.FC<AnalogEquipmentModalProps> = ({ isOpen, onClose, theme, onSave }) => {
  const [level, setLevel] = useState<MenuLevel>('type');
  const [selectedType, setSelectedType] = useState<'instruments' | 'hardware' | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>([]);
  const [selectedHardware, setSelectedHardware] = useState<string[]>([]);

  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const success = await onSave(selectedInstruments, selectedHardware);
      if (success) {
        onClose();
      }
    } catch (error) {
      console.error("Save failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleItem = (item: string, type: 'instruments' | 'hardware') => {
    if (type === 'instruments') {
      setSelectedInstruments(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
    } else {
      setSelectedHardware(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
    }
  };

  const getItems = () => {
    switch (level) {
      case 'type':
        return ['Add Instruments', 'Add Hardware'];
      case 'category':
        return selectedType === 'instruments' 
          ? Object.keys(analogInstruments)
          : Object.keys(analogHardware);
      case 'brand':
        if (!selectedType || !selectedCategory) return [];
        return selectedType === 'instruments'
          ? Object.keys((analogInstruments as any)[selectedCategory])
          : Object.keys((analogHardware as any)[selectedCategory]);
      case 'model':
        if (!selectedType || !selectedCategory || !selectedBrand) return [];
        return selectedType === 'instruments'
          ? (analogInstruments as any)[selectedCategory][selectedBrand] as string[]
          : (analogHardware as any)[selectedCategory][selectedBrand] as string[];
      default:
        return [];
    }
  };

  const items = getItems();

  const handleSelect = (index: number) => {
    const item = items[index];
    if (level === 'type') {
      setSelectedType(index === 0 ? 'instruments' : 'hardware');
      setLevel('category');
      setActiveIndex(0);
    } else if (level === 'category') {
      setSelectedCategory(item);
      setLevel('brand');
      setActiveIndex(0);
    } else if (level === 'brand') {
      setSelectedBrand(item);
      setLevel('model');
      setActiveIndex(0);
    }
  };



  const handleBack = () => {
    if (level === 'model') setLevel('brand');
    else if (level === 'brand') setLevel('category');
    else if (level === 'category') setLevel('type');
    setActiveIndex(0);
  };

  const themeClasses = theme === 'coldest' 
    ? "bg-sky-900/95 border-sky-400/30 text-sky-50"
    : theme === 'crazy-bird'
    ? "bg-red-950/95 border-red-500/30 text-red-50"
    : theme === 'hustle-time'
    ? "bg-black/95 border-yellow-500/30 text-yellow-50"
    : "bg-emerald-950/95 border-emerald-500/30 text-emerald-50";

  const highlightClass = theme === 'coldest' ? 'bg-sky-500 text-white' : theme === 'crazy-bird' ? 'bg-red-500 text-white' : theme === 'hustle-time' ? 'bg-yellow-500 text-black' : 'bg-emerald-500 text-white';

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-3xl animate-in fade-in zoom-in duration-500">
      <div className={`w-full max-w-2xl h-[70vh] flex flex-col rounded-[3rem] border shadow-2xl overflow-hidden ${themeClasses}`}>
        
        {/* Header */}
        <div className="p-6 sm:p-8 border-b border-white/10 flex items-center justify-between bg-black/20">
          <div className="flex items-center gap-2 sm:gap-4">
            {level !== 'type' && (
              <button onClick={handleBack} className="p-1 sm:p-2 rounded-full hover:bg-white/10 transition-colors">
                <ChevronLeft size={20} />
              </button>
            )}
            <h2 className="text-sm sm:text-xl font-black uppercase tracking-tight sm:tracking-widest">
              {level === 'type' ? 'Equipment' : 
               level === 'category' ? `${selectedType} Categories` :
               level === 'brand' ? `${selectedCategory} Brands` :
               `${selectedBrand} Models`}
            </h2>
          </div>
          <div className="flex gap-3">
            {level === 'type' && (
              <button onClick={onClose} className="px-6 py-2 rounded-full font-bold bg-white/10 hover:bg-white/20 transition-all text-sm">
                Cancel
              </button>
            )}
            <button 
              onClick={handleSave} 
              disabled={isLoading}
              className={`px-6 py-2 rounded-full font-black text-sm transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 ${theme === 'coldest' ? 'bg-white text-black' : 'bg-white text-black'}`}
            >
              {isLoading ? 'Saving...' : 'Save & Continue'}
            </button>
          </div>
        </div>

        {/* XMB / iPod Style List */}
        <div className="flex-1 overflow-y-auto relative" ref={listRef}>
          <div className="py-4">
            {items.map((item, idx) => {
              const isSelectedModel = level === 'model' && selectedType && (
                selectedType === 'instruments' 
                  ? selectedInstruments.includes(`${selectedBrand} ${item}`)
                  : selectedHardware.includes(`${selectedBrand} ${item}`)
              );

              return (
                <div 
                  key={item}
                  onClick={() => {
                    setActiveIndex(idx);
                    if (level === 'model') {
                      setExpandedItem(expandedItem === item ? null : item);
                    } else {
                      handleSelect(idx);
                    }
                  }}
                  className={`px-8 py-4 flex flex-col cursor-pointer transition-all duration-200 ${activeIndex === idx ? `${highlightClass} scale-[1.02] shadow-lg z-10 relative` : 'hover:bg-white/5 opacity-70 hover:opacity-100'}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-lg font-bold ${activeIndex === idx ? 'text-white' : ''}`}>{item}</span>
                    {level !== 'model' && (
                      <ChevronRight size={20} className={activeIndex === idx ? 'text-white' : 'opacity-50'} />
                    )}
                    {level === 'model' && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (selectedType) {
                            toggleItem(`${selectedBrand} ${item}`, selectedType);
                            setActiveIndex(idx);
                            setExpandedItem(item);
                          }
                        }}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isSelectedModel ? 'bg-white/90 text-black' : 'bg-white/20 hover:bg-white/40'}`}>
                        {isSelectedModel && <Check size={16} />}
                      </button>
                    )}
                  </div>
                  {level === 'model' && expandedItem === item && equipmentDetails[item] && (
                    <div className="mt-4 text-sm opacity-80 whitespace-pre-wrap">
                      {equipmentDetails[item]}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>



        {/* Footer Navigation Hint */}
        {level === 'model' && (
          <div className="p-4 border-t border-white/10 bg-black/20 text-center">
            <p className="text-xs font-bold opacity-60 uppercase tracking-widest">Select all models that you own</p>
          </div>
        )}
        
        {/* Quick Switch Button */}
        {level !== 'type' && (
          <div className="p-4 border-t border-white/10 bg-black/40 flex justify-center">
             <button 
              onClick={() => {
                setSelectedType(selectedType === 'instruments' ? 'hardware' : 'instruments');
                setLevel('category');
                setActiveIndex(0);
              }}
              className="text-sm font-bold opacity-70 hover:opacity-100 transition-opacity underline"
            >
              Switch to Add {selectedType === 'instruments' ? 'Hardware' : 'Instruments'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
