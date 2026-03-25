import React, { useState, useRef, useEffect } from 'react';

interface AvatarProps {
  username: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  fallbackType?: 'coldest' | 'crazy-bird' | 'hustle-time';
  src?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ username, alt, className = "w-48 h-48", imageClassName = "scale-[1.35] group-hover:scale-[1.45] object-cover", fallbackType = 'coldest', src }) => {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const imgRef = useRef<HTMLImageElement>(null);
  
  // Use provided src or initials fallback
  const displayUrl = src || `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random&color=fff&size=512&bold=true`;

  useEffect(() => {
    if (imgRef.current?.complete) {
      setLoading(false);
    }
  }, [displayUrl]);

  const fallbackStyles = {
    'coldest': 'bg-sky-500/20 border-sky-400/30 text-sky-400',
    'crazy-bird': 'bg-red-500/20 border-red-400/30 text-red-400',
    'hustle-time': 'bg-yellow-500/20 border-yellow-400/30 text-yellow-400',
  };

  const currentFallback = fallbackStyles[fallbackType] || fallbackStyles.coldest;

  return (
    <div className={`relative ${className} group`}>
      {/* Premium Circular Glass Border with Animated Glow - Perfectly sized for "Exact" fit */}
      <div className="absolute -inset-2 rounded-full bg-gradient-to-tr from-white/10 via-white/30 to-white/10 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-1000 animate-pulse pointer-events-none" />
      <div className="absolute inset-0 rounded-full border-[3px] border-white/40 shadow-[0_0_30px_rgba(255,255,255,0.2)] z-10 pointer-events-none" />
      
      <div className="w-full h-full rounded-full overflow-hidden relative flex items-center justify-center bg-black/20">
        {!error ? (
          <img 
            ref={imgRef}
            src={displayUrl} 
            alt={alt} 
            className={`w-full h-full object-cover origin-center transition-all duration-1000 ${imageClassName} ${loading ? 'opacity-0' : 'opacity-100'}`}
            onLoad={() => setLoading(false)}
            onError={() => {
              setError(true);
              setLoading(false);
            }}
            referrerPolicy="no-referrer"
          />
        ) : (
          /* Smart Fallback System: Themed Placeholder */
          <div className={`w-full h-full flex items-center justify-center border-4 ${currentFallback} transition-all duration-500`}>
            <span className="text-4xl font-black tracking-tighter uppercase opacity-60 drop-shadow-2xl">
              {username.charAt(0)}
            </span>
          </div>
        )}
        
        {/* Loading State Overlay */}
        {loading && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-md animate-pulse">
            <div className="w-12 h-12 rounded-full border-4 border-white/10 border-t-white/80 animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
};
