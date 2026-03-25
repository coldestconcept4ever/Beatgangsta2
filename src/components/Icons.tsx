import React from 'react';
import { DuragStyle } from '../types';

export const RagIcon = ({ style, isActive }: { style: DuragStyle, isActive: boolean }) => {
  let mainColor = "black";
  if (style === 'royal-green') mainColor = isActive ? '#065f46' : 'black';
  if (style === 'purplesilk') mainColor = isActive ? '#4c1d95' : 'black';
  if (style === 'sound-ninja') mainColor = isActive ? '#1e3a8a' : 'black';

  if (style === 'chef-hat') {
    return (
      <div className="relative flex items-center justify-center text-sm">
        👨‍🍳
      </div>
    );
  }

  if (style === 'rasta') {
    return (
      <div className="relative flex items-center justify-center text-sm">
        🇯🇲
      </div>
    );
  }

  return (
    <div className="relative flex items-center justify-center">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 4C4 4 6 12 12 12C18 12 20 4 20 4V20C20 20 18 16 12 16C6 16 4 20 4 20V4Z" fill={mainColor} />
        <path d="M12 12L12 16" stroke="white" strokeWidth="0.5" opacity="0.3" />
      </svg>
      {style === 'purplesilk' && isActive && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2.5 h-2.5 bg-orange-400 rounded-full border-[0.5px] border-orange-600 scale-75" />
        </div>
      )}
      {style === 'sound-ninja' && isActive && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-1 bg-slate-300 rounded-[1px] border-[0.5px] border-slate-500" />
        </div>
      )}
    </div>
  );
};

export const CigarIcon = ({ size = 16, className = "" }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="2" y="10" width="16" height="5" rx="1" fill="#4B2C20" stroke="#271103" strokeWidth="0.5" />
    <rect x="18" y="10" width="4" height="5" rx="1" fill="#FF4500" />
    <path d="M6 10V15" stroke="rgba(0,0,0,0.3)" strokeWidth="0.5" />
    <path d="M10 10V15" stroke="rgba(0,0,0,0.3)" strokeWidth="0.5" />
    <path d="M14 10V15" stroke="rgba(0,0,0,0.3)" strokeWidth="0.5" />
  </svg>
);
