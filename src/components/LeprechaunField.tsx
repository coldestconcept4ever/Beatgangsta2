
import React from 'react';

const CashBill = ({ className, variant = 'classic' }: { className?: string, variant?: 'classic' | 'modern' }) => {
  const isModern = variant === 'modern';
  const strokeColor = isModern ? '#1e293b' : '#2e4c23';

  return (
  <svg viewBox="0 0 240 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      {/* Classic Gradients */}
      <linearGradient id="billBaseClassic" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#85bb65" />
        <stop offset="50%" stopColor="#a3cc8a" />
        <stop offset="100%" stopColor="#5c8a47" />
      </linearGradient>
      <linearGradient id="billBorderClassic" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#2e4c23" />
        <stop offset="100%" stopColor="#1a2e12" />
      </linearGradient>

      {/* Modern Gradients */}
      <linearGradient id="billBaseModern" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#e2e8f0" />
        <stop offset="50%" stopColor="#cbd5e1" />
        <stop offset="100%" stopColor="#94a3b8" />
      </linearGradient>
      <linearGradient id="billBorderModern" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#1e293b" />
        <stop offset="100%" stopColor="#0f172a" />
      </linearGradient>
      <linearGradient id="blueRibbon" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#1d4ed8" />
        <stop offset="50%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#1e3a8a" />
      </linearGradient>
      <linearGradient id="copperInkwell" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#b45309" />
        <stop offset="50%" stopColor="#d97706" />
        <stop offset="100%" stopColor="#78350f" />
      </linearGradient>

      <clipPath id="portraitClip">
        <ellipse cx="120" cy="50" rx="35" ry="40" />
      </clipPath>
    </defs>
    
    <g>
      {/* Base Paper */}
      <rect x="5" y="5" width="230" height="90" rx="4" fill={isModern ? "url(#billBaseModern)" : "url(#billBaseClassic)"} stroke={isModern ? "url(#billBorderModern)" : "url(#billBorderClassic)"} strokeWidth="2" />
      
      {/* Inner Border */}
      <rect x="12" y="12" width="216" height="76" rx="2" fill="none" stroke={strokeColor} strokeWidth="1" opacity="0.6" />
      <rect x="15" y="15" width="210" height="70" rx="1" fill="none" stroke={strokeColor} strokeWidth="0.5" opacity="0.4" />
      
      {/* Center Oval (Portrait Area) */}
      <ellipse cx="120" cy="50" rx="35" ry="40" fill={isModern ? "#cbd5e1" : "#a3cc8a"} stroke={strokeColor} strokeWidth="1.5" />
      <ellipse cx="120" cy="50" rx="30" ry="35" fill="none" stroke={strokeColor} strokeWidth="0.5" strokeDasharray="2 2" />
      
      {/* Mascot Tracing (Clipped to Oval) */}
      <g clipPath="url(#portraitClip)">
        <g transform="translate(120, 60) scale(0.06) translate(-500, -580)" stroke={strokeColor} strokeWidth="15" fill="none" opacity="0.8">
          {/* Head */}
          <circle cx="500" cy="580" r="360" />
          
          {/* Eyes */}
          <ellipse cx="385" cy="580" rx="45" ry="75" />
          <ellipse cx="615" cy="580" rx="45" ry="75" />
          
          {/* Grill */}
          <g transform="translate(305, 710)">
            {[10, 75, 140, 205, 270, 335].map((x, i) => {
              const tilt = (i - 2.5) * 4;
              const yOff = Math.abs(i - 2.5) * 5;
              return (
                <g key={i} transform={`translate(${x}, ${15 + yOff}) rotate(${tilt})`}>
                  <rect width="50" height="60" rx="4" />
                </g>
              );
            })}
          </g>
          
          {/* Durag */}
          <path d="M150 460 C140 190 400 60 500 60 C600 60 860 190 850 460 L150 460 Z" />
          <path d="M500 100 Q520 270 500 450" />
          <path d="M155 400 Q500 360 845 400" />
          <path d="M840 420 Q950 490 900 690 L850 660 Q880 520 800 420 Z" />
        </g>
      </g>
      
      {/* Modern Bill Specific Elements */}
      {isModern && (
        <>
          {/* Blue 3D Security Ribbon */}
          <rect x="145" y="5" width="14" height="90" fill="url(#blueRibbon)" opacity="0.9" />
          <path d="M145 15 L159 20 M145 35 L159 40 M145 55 L159 60 M145 75 L159 80" stroke="#60a5fa" strokeWidth="2" opacity="0.6" />
          <text x="152" y="30" textAnchor="middle" fill="#93c5fd" fontSize="6" fontWeight="bold" transform="rotate(90 152 30)">100</text>
          <text x="152" y="70" textAnchor="middle" fill="#93c5fd" fontSize="6" fontWeight="bold" transform="rotate(90 152 70)">100</text>
          
          {/* Copper Inkwell & Bell */}
          <path d="M175 65 C175 55 185 45 190 45 C195 45 205 55 205 65 L210 75 L170 75 Z" fill="url(#copperInkwell)" opacity="0.8" />
          <path d="M182 68 C182 60 186 55 190 55 C194 55 198 60 198 68 L200 72 L180 72 Z" fill="#16a34a" opacity="0.7" />
        </>
      )}

      {/* Seals */}
      {!isModern && (
        <>
          <circle cx="50" cy="50" r="18" fill="none" stroke={strokeColor} strokeWidth="1" opacity="0.5" />
          <circle cx="50" cy="50" r="14" fill="none" stroke={strokeColor} strokeWidth="0.5" strokeDasharray="1 2" opacity="0.5" />
          <circle cx="190" cy="50" r="18" fill="none" stroke={strokeColor} strokeWidth="1" opacity="0.5" />
          <circle cx="190" cy="50" r="14" fill="none" stroke={strokeColor} strokeWidth="0.5" strokeDasharray="1 2" opacity="0.5" />
        </>
      )}
      {isModern && (
        <>
          <circle cx="60" cy="50" r="16" fill="none" stroke={strokeColor} strokeWidth="1" opacity="0.4" />
          <circle cx="60" cy="50" r="12" fill="none" stroke={strokeColor} strokeWidth="0.5" strokeDasharray="1 2" opacity="0.4" />
        </>
      )}
      
      {/* Corner Numbers */}
      <text x="25" y="30" textAnchor="middle" fill={strokeColor} fontSize="16" fontFamily="serif" fontWeight="bold">100</text>
      <text x="215" y="30" textAnchor="middle" fill={strokeColor} fontSize="16" fontFamily="serif" fontWeight="bold">100</text>
      <text x="25" y="82" textAnchor="middle" fill={strokeColor} fontSize="16" fontFamily="serif" fontWeight="bold">100</text>
      
      {/* Bottom Right 100 (Copper/Gold for modern) */}
      <text x="215" y="82" textAnchor="middle" fill={isModern ? "url(#copperInkwell)" : strokeColor} fontSize={isModern ? "20" : "16"} fontFamily="serif" fontWeight="bold">100</text>
      
      {/* Text Elements */}
      <text x="120" y="25" textAnchor="middle" fill={strokeColor} fontSize="8" fontFamily="serif" letterSpacing="2">THE UNITED STATES OF AMERICA</text>
      <text x="120" y="82" textAnchor="middle" fill={strokeColor} fontSize="10" fontFamily="serif" fontWeight="bold" letterSpacing="1">ONE HUNDRED DOLLARS</text>

      {/* Modern faint background text/texture */}
      {isModern && (
        <text x="190" y="40" textAnchor="middle" fill={strokeColor} fontSize="24" fontFamily="serif" fontWeight="bold" opacity="0.1">100</text>
      )}
    </g>
  </svg>
  );
};

type CoinType = 'gold' | 'quarter' | 'nickel' | 'dime' | 'penny';

const Coin = ({ className, type = 'gold' }: { className?: string, type?: CoinType }) => {
  let edgeStops, faceStops, strokeColor, mascotStroke, starColor;

  if (type === 'gold') {
    edgeStops = ['#fef08a', '#eab308', '#a16207', '#713f12'];
    faceStops = ['#fde047', '#ca8a04', '#854d0e'];
    strokeColor = '#a16207';
    mascotStroke = '#854d0e';
    starColor = '#fef08a';
  } else if (type === 'penny') {
    edgeStops = ['#fdba74', '#d97706', '#9a3412', '#451a03'];
    faceStops = ['#fb923c', '#b45309', '#78350f'];
    strokeColor = '#9a3412';
    mascotStroke = '#451a03';
    starColor = '#fdba74';
  } else { // silver (quarter, nickel, dime)
    edgeStops = ['#f8fafc', '#cbd5e1', '#64748b', '#1e293b'];
    faceStops = ['#e2e8f0', '#94a3b8', '#475569'];
    strokeColor = '#64748b';
    mascotStroke = '#334155';
    starColor = '#f8fafc';
  }

  const gradientIdSuffix = type === 'gold' ? 'Gold' : type === 'penny' ? 'Copper' : 'Silver';

  return (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id={`coinEdge${gradientIdSuffix}`} cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
        <stop offset="0%" stopColor={edgeStops[0]} />
        <stop offset="70%" stopColor={edgeStops[1]} />
        <stop offset="90%" stopColor={edgeStops[2]} />
        <stop offset="100%" stopColor={edgeStops[3]} />
      </radialGradient>
      <radialGradient id={`coinFace${gradientIdSuffix}`} cx="50%" cy="50%" r="50%" fx="40%" fy="40%">
        <stop offset="0%" stopColor={faceStops[0]} />
        <stop offset="80%" stopColor={faceStops[1]} />
        <stop offset="100%" stopColor={faceStops[2]} />
      </radialGradient>
      <linearGradient id="coinShine" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
        <stop offset="30%" stopColor="#ffffff" stopOpacity="0" />
        <stop offset="70%" stopColor="#ffffff" stopOpacity="0" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0.3" />
      </linearGradient>
      <clipPath id="coinPortraitClip">
        <circle cx="50" cy="50" r="38" />
      </clipPath>
    </defs>
    
    <g>
      {/* Outer Edge (Thickness) */}
      <circle cx="50" cy="52" r="44" fill={faceStops[2]} />
      
      {/* Main Coin Body */}
      <circle cx="50" cy="50" r="45" fill={`url(#coinEdge${gradientIdSuffix})`} />
      
      {/* Inner Face */}
      <circle cx="50" cy="50" r="38" fill={`url(#coinFace${gradientIdSuffix})`} stroke={strokeColor} strokeWidth="1" />
      
      {/* Ridges */}
      <circle cx="50" cy="50" r="41" fill="none" stroke={faceStops[1]} strokeWidth="2" strokeDasharray="2 4" />
      
      {/* Mascot Tracing (Clipped to Inner Face) */}
      <g clipPath="url(#coinPortraitClip)">
        <g transform="translate(50, 55) scale(0.06) translate(-500, -580)" stroke={mascotStroke} strokeWidth="20" fill="none" opacity="0.7">
          {/* Head */}
          <circle cx="500" cy="580" r="360" />
          {/* Eyes */}
          <ellipse cx="385" cy="580" rx="45" ry="75" />
          <ellipse cx="615" cy="580" rx="45" ry="75" />
          {/* Grill */}
          <g transform="translate(305, 710)">
            {[10, 75, 140, 205, 270, 335].map((x, i) => {
              const tilt = (i - 2.5) * 4;
              const yOff = Math.abs(i - 2.5) * 5;
              return (
                <g key={i} transform={`translate(${x}, ${15 + yOff}) rotate(${tilt})`}>
                  <rect width="50" height="60" rx="4" />
                </g>
              );
            })}
          </g>
          {/* Durag */}
          <path d="M150 460 C140 190 400 60 500 60 C600 60 860 190 850 460 L150 460 Z" />
          <path d="M500 100 Q520 270 500 450" />
          <path d="M155 400 Q500 360 845 400" />
          <path d="M840 420 Q950 490 900 690 L850 660 Q880 520 800 420 Z" />
        </g>
      </g>
      
      {/* Shine Overlay */}
      <circle cx="50" cy="50" r="45" fill="url(#coinShine)" />
      
      {/* Stars */}
      <path d="M12 50 L15 52 L14 55 L17 53 L20 55 L19 52 L22 50 L19 48 L20 45 L17 47 L14 45 L15 48 Z" fill={starColor} opacity="0.8" />
      <path d="M88 50 L91 52 L90 55 L93 53 L96 55 L95 52 L98 50 L95 48 L96 45 L93 47 L90 45 L91 48 Z" fill={starColor} opacity="0.8" />
    </g>
  </svg>
  );
};

const RealisticCloud = ({ className, style }: { className?: string, style?: React.CSSProperties }) => (
  <svg viewBox="0 0 400 200" className={className} style={style} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="cloudBlur" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="12" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
      <linearGradient id="cloudGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
        <stop offset="60%" stopColor="#f1f5f9" stopOpacity="0.85" />
        <stop offset="100%" stopColor="#cbd5e1" stopOpacity="0.6" />
      </linearGradient>
    </defs>
    <g filter="url(#cloudBlur)">
      <circle cx="120" cy="130" r="45" fill="url(#cloudGrad)" />
      <circle cx="180" cy="90" r="65" fill="url(#cloudGrad)" />
      <circle cx="260" cy="100" r="55" fill="url(#cloudGrad)" />
      <circle cx="320" cy="140" r="35" fill="url(#cloudGrad)" />
      <rect x="120" y="110" width="200" height="65" rx="32.5" fill="url(#cloudGrad)" />
    </g>
  </svg>
);

export const LeprechaunField: React.FC = () => {
  const coins = React.useMemo(() => Array.from({ length: 12 }).map((_, i) => {
    const dirX = Math.random() > 0.5 ? 1 : -1;
    const dirY = Math.random() > 0.5 ? 1 : -1;
    
    const rand = Math.random();
    let type: CoinType = 'gold';
    let sizeMultiplier = 1;
    
    if (rand > 0.8) { type = 'quarter'; sizeMultiplier = 0.8; }
    else if (rand > 0.65) { type = 'nickel'; sizeMultiplier = 0.7; }
    else if (rand > 0.5) { type = 'penny'; sizeMultiplier = 0.6; }
    else if (rand > 0.35) { type = 'dime'; sizeMultiplier = 0.5; }

    return {
      type,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 25}s`,
      fallDuration: `${6 + Math.random() * 4}s`,
      swayDuration: `${2 + Math.random() * 2}s`,
      tumbleDuration: `${2 + Math.random() * 3}s`,
      size: (25 + Math.random() * 30) * sizeMultiplier,
      swayDist: `${(40 + Math.random() * 80) * dirX}px`,
      flipX: dirX * (1 + Math.floor(Math.random() * 2)),
      flipY: dirY * (1 + Math.floor(Math.random() * 2))
    };
  }), []);

  const bills = React.useMemo(() => Array.from({ length: 8 }).map((_, i) => {
    const dirX = Math.random() > 0.5 ? 1 : -1;
    const dirY = Math.random() > 0.5 ? 1 : -1;
    return {
      left: `${Math.random() * 100}%`,
      size: 90 + Math.random() * 70,
      delay: `${Math.random() * 30}s`,
      fallDuration: `${20 + Math.random() * 15}s`,
      swayDuration: `${5 + Math.random() * 5}s`,
      tumbleDuration: `${8 + Math.random() * 12}s`,
      flexDuration: `${3 + Math.random() * 4}s`,
      swayDist: `${(150 + Math.random() * 250) * dirX}px`,
      rotZ: (Math.random() - 0.5) * 180,
      startRotX: Math.random() * 360,
      startRotY: Math.random() * 360,
      flipX: dirX * 1,
      flipY: dirY * 1,
      variant: Math.random() > 0.3 ? 'modern' : 'classic'
    };
  }), []);

  const clouds = React.useMemo(() => Array.from({ length: 8 }).map((_, i) => ({
    top: `${-10 + Math.random() * 70}%`,
    duration: `${80 + Math.random() * 120}s`,
    delay: `-${Math.random() * 200}s`,
    scale: 0.4 + Math.random() * 1.5,
    opacity: 0.3 + Math.random() * 0.6
  })), []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" style={{ background: 'linear-gradient(to bottom, #064e3b 0%, #065f46 40%, #059669 100%)' }}>
      <style>
        {`
          @keyframes cloudDrift {
            0% { transform: translateX(-50vw) scale(var(--cloud-scale)); }
            100% { transform: translateX(150vw) scale(var(--cloud-scale)); }
          }
          .cloud-drift {
            animation: cloudDrift linear infinite;
            will-change: transform;
          }
          @keyframes itemFall {
            0% { transform: translateY(-50vh); }
            100% { transform: translateY(150vh); }
          }
          @keyframes billSway {
            0% { transform: translateX(calc(var(--sway-dist) * -1)) translateY(-20px) rotateZ(-10deg); }
            50% { transform: translateX(0px) translateY(10px) rotateZ(0deg); }
            100% { transform: translateX(var(--sway-dist)) translateY(-20px) rotateZ(10deg); }
          }
          @keyframes billTumble {
            0% { transform: perspective(1000px) rotateX(var(--start-rot-x)) rotateY(var(--start-rot-y)) rotateZ(var(--rot-z)); }
            100% { transform: perspective(1000px) rotateX(calc(var(--start-rot-x) + 360deg * var(--flip-x))) rotateY(calc(var(--start-rot-y) + 360deg * var(--flip-y))) rotateZ(var(--rot-z)); }
          }
          @keyframes billFlex {
            0%, 100% { transform: scaleX(1) scaleY(1) skewX(0deg); }
            50% { transform: scaleX(0.9) scaleY(1.05) skewX(8deg); }
          }
          @keyframes coinSway {
            0% { transform: translateX(calc(var(--sway-dist) * -1)) rotateZ(-15deg); }
            50% { transform: translateX(0px) rotateZ(0deg); }
            100% { transform: translateX(var(--sway-dist)) rotateZ(15deg); }
          }
          @keyframes coinTumble {
            0% { transform: perspective(600px) rotateX(0deg) rotateY(0deg); }
            100% { transform: perspective(600px) rotateX(calc(360deg * var(--flip-x))) rotateY(calc(360deg * var(--flip-y))); }
          }
          @keyframes rotateRays {
            0% { transform: translate(-50%, -50%) rotate(0deg); }
            100% { transform: translate(-50%, -50%) rotate(360deg); }
          }
          @keyframes pulseGlow {
            0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
            50% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.7; }
          }
          .sun-rays {
            background: repeating-conic-gradient(from 0deg, rgba(254,240,138,0) 0deg, rgba(254,240,138,0.15) 15deg, rgba(254,240,138,0) 30deg);
            mask-image: radial-gradient(circle at center, black 10%, transparent 60%);
            -webkit-mask-image: radial-gradient(circle at center, black 10%, transparent 60%);
            animation: rotateRays 120s linear infinite;
            will-change: transform;
          }
        `}
      </style>

      {/* Sun and Base Rays (Behind Clouds) */}
      <div className="absolute top-[15%] left-[20%] w-0 h-0 z-[1]">
        <div className="absolute w-[500px] h-[500px] bg-yellow-200 rounded-full blur-[80px]" style={{ animation: 'pulseGlow 6s ease-in-out infinite' }} />
        <div className="absolute w-[120px] h-[120px] bg-white rounded-full blur-[15px] -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute w-[200vw] h-[200vw] sun-rays" />
      </div>

      {/* Realistic Clouds */}
      <div className="absolute inset-0 z-[2]">
      {clouds.map((c, i) => (
        <div
          key={`cloud-${i}`}
          className="absolute cloud-drift"
          style={{
            top: c.top,
            left: '0',
            animationDuration: c.duration,
            animationDelay: c.delay,
            opacity: c.opacity,
            width: '400px',
            '--cloud-scale': c.scale
          } as React.CSSProperties}
        >
          <RealisticCloud className="w-full h-auto" />
        </div>
      ))}
      </div>

      {/* Raining Money */}
      <div className="absolute inset-0 z-[3]">
        {/* Raining Coins */}
        {coins.map((c, i) => (
        <div
          key={`coin-${i}`}
          className="absolute"
          style={{
            left: c.left,
            width: `${c.size}px`,
            animation: `itemFall ${c.fallDuration} linear infinite both`,
            animationDelay: c.delay,
            willChange: 'transform'
          }}
        >
          <div style={{ animation: `coinSway ${c.swayDuration} ease-in-out infinite alternate`, animationDelay: c.delay, '--sway-dist': c.swayDist, willChange: 'transform' } as React.CSSProperties}>
            <div style={{ animation: `coinTumble ${c.tumbleDuration} linear infinite`, animationDelay: c.delay, '--flip-x': c.flipX, '--flip-y': c.flipY, willChange: 'transform' } as React.CSSProperties}>
              <Coin type={c.type} className="w-full h-full" />
            </div>
          </div>
        </div>
      ))}

      {/* Floating Cash Bills */}
      {bills.map((b, i) => (
        <div
          key={`bill-${i}`}
          className="absolute"
          style={{
            left: b.left,
            width: `${b.size}px`,
            animation: `itemFall ${b.fallDuration} linear infinite both`,
            animationDelay: b.delay,
            willChange: 'transform'
          }}
        >
          <div style={{ animation: `billSway ${b.swayDuration} ease-in-out infinite alternate`, animationDelay: b.delay, '--sway-dist': b.swayDist, willChange: 'transform' } as React.CSSProperties}>
            <div style={{ animation: `billTumble ${b.tumbleDuration} linear infinite`, animationDelay: b.delay, '--rot-z': `${b.rotZ}deg`, '--start-rot-x': `${b.startRotX}deg`, '--start-rot-y': `${b.startRotY}deg`, '--flip-x': b.flipX, '--flip-y': b.flipY, willChange: 'transform' } as React.CSSProperties}>
              <div style={{ animation: `billFlex ${b.flexDuration} ease-in-out infinite alternate`, animationDelay: b.delay, willChange: 'transform' }}>
                <CashBill className="w-full h-full" variant={b.variant as 'classic' | 'modern'} />
              </div>
            </div>
          </div>
        </div>
      ))}
      </div>

      {/* Overlay Rays (In Front of Money, Brightens them) */}
      <div className="absolute top-[15%] left-[20%] w-0 h-0 z-[4] mix-blend-color-dodge opacity-80 pointer-events-none">
        <div className="absolute w-[200vw] h-[200vw] sun-rays" />
      </div>
    </div>
  );
};
