
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppTheme } from '../types';
import { Avatar } from './Avatar';

interface FriendsInfoModalProps {
  theme: AppTheme;
  onClose: () => void;
}

export const FriendsInfoModal: React.FC<FriendsInfoModalProps> = ({ theme, onClose }) => {
  const themeStyles = {
    'coldest': {
      bg: 'bg-[#38bdf8]',
      text: 'text-sky-950',
      accent: 'text-sky-900',
      border: 'border-white/30',
      title: 'THE COLLECTIVE',
      titleClass: 'font-black tracking-tighter text-sky-950',
      cardBg: 'bg-white/20 backdrop-blur-2xl',
      btnBg: 'bg-sky-950 text-white',
      socialBg: 'bg-white/10 hover:bg-white/20 border-white/10'
    },
    'crazy-bird': {
      bg: 'bg-[#600a0a]',
      text: 'text-red-50',
      accent: 'text-red-400',
      border: 'border-white/10',
      title: 'THE COLLECTIVE',
      titleClass: 'font-black tracking-tighter text-white uppercase',
      cardBg: 'bg-black/40 backdrop-blur-2xl',
      btnBg: 'bg-white text-red-950',
      socialBg: 'bg-white/5 hover:bg-white/10 border-white/5'
    },
    'hustle-time': {
      bg: 'bg-yellow-500',
      text: 'text-black',
      accent: 'text-yellow-900',
      border: 'border-black/10',
      title: 'THE COLLECTIVE',
      titleClass: 'font-black tracking-tighter text-black uppercase',
      cardBg: 'bg-white/20 backdrop-blur-2xl',
      btnBg: 'bg-black text-yellow-500',
      socialBg: 'bg-black/5 hover:bg-black/10 border-black/5'
    }
  };

  const s = themeStyles[theme] || themeStyles.coldest;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[500] flex items-center justify-center p-4 sm:p-8 bg-black/60 backdrop-blur-2xl"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className={`w-full max-w-5xl max-h-[90vh] lg:max-h-[95vh] overflow-y-auto rounded-[3rem] sm:rounded-[5rem] lg:rounded-[3rem] border ${s.border} ${s.bg} ${s.text} shadow-2xl relative p-8 sm:p-16 lg:p-8 lg:py-6`}
      >
        <button 
          onClick={onClose}
          className="absolute top-8 right-8 sm:top-12 sm:right-12 lg:top-6 lg:right-6 p-3 rounded-full hover:bg-black/5 transition-all z-20"
        >
          <svg className="w-8 h-8 lg:w-6 lg:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center mb-16 lg:mb-6">
          <h1 className={`text-5xl sm:text-8xl lg:text-5xl ${s.titleClass} mb-4 lg:mb-1`}>{s.title}</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12 lg:gap-4">
          {/* coldestconcept */}
          <div className={`p-8 sm:p-12 lg:p-5 lg:px-6 rounded-[4rem] lg:rounded-[2.5rem] ${s.cardBg} border ${s.border} flex flex-col items-center text-center group hover:scale-[1.02] transition-all duration-700`}>
            <Avatar 
              username="coldestconcept" 
              alt="coldestconcept" 
              className="w-48 h-48 lg:w-28 lg:h-28 mb-10 lg:mb-4 mx-auto"
              imageClassName="scale-[1.55] group-hover:scale-[1.65] origin-center object-[center_40%]"
              fallbackType="coldest"
              src="https://i.imgur.com/guBdsj7.png"
            />
            <h2 className="text-2xl lg:text-lg font-black tracking-tighter mb-2">coldestconcept</h2>
            <p className={`text-[10px] font-black uppercase tracking-widest ${s.accent} mb-6 lg:mb-3 italic`}>The Engineer</p>
            <p className="text-sm lg:text-[11px] font-medium opacity-70 mb-8 lg:mb-4 leading-relaxed">Architect of the sonic landscape and lead technical engineer behind the BeatGangsta protocols.</p>
            <div className="flex flex-col gap-3 lg:gap-2 w-full mt-auto">
              <SocialLink href="https://www.instagram.com/coldestconcept?igsh=a2xyYmkyazV4NnZp" label="Instagram" themeStyles={s} />
              <SocialLink href="https://open.spotify.com/artist/5qA0167FtFIRY4APzrodNT" label="Spotify" themeStyles={s} />
              <SocialLink href="https://music.apple.com/artist/1537867517" label="Apple Music" themeStyles={s} />
              <SocialLink href="https://www.youtube.com/@coldestconcept" label="YouTube" themeStyles={s} />
            </div>
          </div>

          {/* Mark Ruhedra */}
          <div className={`p-8 sm:p-12 lg:p-5 lg:px-6 rounded-[4rem] lg:rounded-[2.5rem] ${s.cardBg} border ${s.border} flex flex-col items-center text-center group hover:scale-[1.02] transition-all duration-700`}>
            <Avatar 
              username="markruhedra" 
              alt="Mark Ruhedra" 
              className="w-48 h-48 lg:w-28 lg:h-28 mb-10 lg:mb-4 mx-auto"
              imageClassName="scale-[1.55] group-hover:scale-[1.65] origin-center object-center"
              fallbackType="crazy-bird"
              src="https://i.imgur.com/BTIFNda.png"
            />
            <h2 className="text-2xl lg:text-lg font-black tracking-tighter mb-2">Mark Ruhedra</h2>
            <p className={`text-[10px] font-black uppercase tracking-widest ${s.accent} mb-6 lg:mb-3 italic`}>Legendary Producer</p>
            <p className="text-sm lg:text-[11px] font-medium opacity-70 mb-8 lg:mb-4 leading-relaxed">Master of modern analog instrument recording. A pioneer in blending organic textures with digital precision.</p>
            <div className="flex flex-col gap-3 lg:gap-2 w-full mt-auto">
              <SocialLink href="https://www.instagram.com/markruhedra?igsh=MXhvZmVwZmc1bTR3bQ==" label="Instagram" themeStyles={s} />
              <SocialLink href="https://www.youtube.com/channel/UC8gMzSxHRWzMzfIjdcqKvQw" label="YouTube" themeStyles={s} />
              <SocialLink href="https://www.beatstars.com/ruhedra" label="BeatStars" themeStyles={s} />
            </div>
          </div>

          {/* Malcolm Mandela */}
          <div className={`p-8 sm:p-12 lg:p-5 lg:px-6 rounded-[4rem] lg:rounded-[2.5rem] ${s.cardBg} border ${s.border} flex flex-col items-center text-center group hover:scale-[1.02] transition-all duration-700`}>
            <Avatar 
              username="malcolm__mandela" 
              alt="Malcolm Mandela" 
              className="w-48 h-48 lg:w-28 lg:h-28 mb-10 lg:mb-4 mx-auto"
              imageClassName="scale-[1.55] group-hover:scale-[1.65] origin-center object-[center_35%] translate-x-[2.2%]"
              fallbackType="hustle-time"
              src="https://i.imgur.com/RCdiUrj.png"
            />
            <h2 className="text-2xl lg:text-lg font-black tracking-tighter mb-2">Malcolm Mandela</h2>
            <p className={`text-[10px] font-black uppercase tracking-widest ${s.accent} mb-6 lg:mb-3 italic`}>Rising Star</p>
            <p className="text-sm lg:text-[11px] font-medium opacity-70 mb-8 lg:mb-4 leading-relaxed">Anime-style rapper and business associate. Regular collaborator providing elite verses and hooks.</p>
            <div className="flex flex-col gap-3 lg:gap-2 w-full mt-auto">
              <SocialLink href="https://www.instagram.com/malcolm__mandela/" label="Instagram" themeStyles={s} />
              <SocialLink href="https://open.spotify.com/artist/5mE1GvcKwDvrav40RKf5Zm" label="Spotify" themeStyles={s} />
              <SocialLink href="https://music.apple.com/artist/1481738134" label="Apple Music" themeStyles={s} />
              <SocialLink href="https://www.youtube.com/@malcolmmandela1762" label="YouTube" themeStyles={s} />
            </div>
          </div>
        </div>

        <div className="mt-20 lg:mt-8 text-center">
          <button 
            onClick={onClose}
            className={`px-16 py-5 lg:py-4 rounded-full ${s.btnBg} font-black uppercase tracking-[0.4em] text-xs hover:scale-105 active:scale-95 transition-all shadow-2xl`}
          >
            Back to Studio
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const SocialLink: React.FC<{ href: string; label: string; themeStyles: any }> = ({ href, label, themeStyles }) => (
  <a 
    href={href} 
    target="_blank" 
    rel="noopener noreferrer"
    className={`w-full py-3 lg:py-2 px-6 lg:px-4 rounded-2xl ${themeStyles.socialBg} transition-all text-[10px] font-black uppercase tracking-widest flex items-center justify-between group`}
  >
    <span>{label}</span>
    <svg className="w-3 h-3 opacity-30 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  </a>
);
