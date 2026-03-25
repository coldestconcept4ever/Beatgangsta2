
import React, { useMemo } from 'react';

const RavenIcon = ({ className, flapDuration = "0.8s" }: { className?: string, flapDuration?: string }) => (
  <svg viewBox="-15 -10 140 120" className={className}>
    <g>
      {/* Back Wing (Right Wing) */}
      <path fill="url(#ravenGrad)" opacity="0.85">
        <animate 
          attributeName="d" 
          dur={flapDuration} 
          repeatCount="indefinite"
          keyTimes="0; 0.2; 0.45; 0.75; 1"
          begin="-0.08s"
          values="
            M 44 42 C 55 10, 75 -5, 95 -10 L 90 -2 L 100 0 L 92 8 L 100 15 C 80 25, 65 35, 44 42 Z;
            M 44 42 C 46 55, 56 70, 71 80 L 66 75 L 74 73 L 68 67 L 74 55 C 61 50, 51 45, 44 42 Z;
            M 44 42 C 51 60, 71 70, 91 70 L 86 65 L 94 60 L 84 55 L 88 47 C 71 45, 56 43, 44 42 Z;
            M 44 42 C 46 55, 56 70, 71 80 L 66 75 L 74 73 L 68 67 L 74 55 C 61 50, 51 45, 44 42 Z;
            M 44 42 C 55 10, 75 -5, 95 -10 L 90 -2 L 100 0 L 92 8 L 100 15 C 80 25, 65 35, 44 42 Z
          "
        />
      </path>

      {/* Right Leg (Back) */}
      <path fill="#0a0204" d="
        M 70 59
        C 75 61, 80 62, 85 63
        L 90 64
        L 92 63 L 93 64.5 L 90 65
        L 94 66 L 91 67
        L 93 69 L 89 67
        L 84 65
        C 79 64, 74 63, 68 60 Z
      " />

      {/* Body - Smooth Throat, Realistic Head, Wedge Tail */}
      <path fill="url(#ravenGrad)" d="
        M 0 46 
        C 4 44.5, 8 43, 12 42
        C 16 37, 22 36, 28 37
        C 40 39, 50 39, 60 40 
        C 75 42, 85 44, 95 46 
        L 115 50 
        L 110 52 L 122 53 L 112 55 L 125 56 L 114 58 L 120 60 L 105 60 L 95 58 
        L 85 58 
        C 80 59, 70 60, 60 59 
        C 45 58, 35 55, 25 52 
        C 15 50, 8 48, 0 46 
        Z" 
      />

      {/* Left Leg (Front) */}
      <path fill="#1a0508" d="
        M 65 59.5
        C 70 61.5, 75 63, 80 64
        L 85 65
        L 87 64 L 88 65.5 L 85 66
        L 89 67 L 86 68
        L 88 70 L 84 68
        L 79 66
        C 74 65, 69 63.5, 63 60 Z
      " />

      {/* Colored Beak */}
      <path fill="url(#beakGrad)" d="M 0 46 C 4 44.5, 8 43, 12 42 L 12 48 C 8 47.5, 4 47, 0 46 Z" />

      {/* Maroon Highlights / Emboss Lines */}
      <g stroke="#7a152c" strokeWidth="0.8" fill="none" opacity="0.8">
        {/* Beak split */}
        <path d="M 0 46 C 4 46, 8 45.5, 12 45" />
        {/* Tail feather separations */}
        <path d="M 95 50 L 115 52" />
        <path d="M 95 53 L 120 55" />
        <path d="M 95 56 L 115 58" />
      </g>

      {/* Eye */}
      <circle cx="16" cy="41" r="1.2" fill="#ff1e56" />
    </g>

    <g>
      {/* Front Wing (Left Wing) */}
      <path fill="url(#ravenGrad)">
        <animate 
          attributeName="d" 
          dur={flapDuration} 
          repeatCount="indefinite"
          keyTimes="0; 0.2; 0.45; 0.75; 1"
          values="
            M 38 48 C 40 25, 55 10, 75 5 L 72 12 L 80 15 L 75 22 L 82 28 C 70 38, 55 44, 38 48 Z;
            M 38 48 C 40 65, 50 80, 65 90 L 60 85 L 68 83 L 62 77 L 68 60 C 55 55, 45 50, 38 48 Z;
            M 38 48 C 45 70, 65 80, 85 80 L 80 75 L 88 70 L 78 65 L 82 52 C 65 50, 50 48, 38 48 Z;
            M 38 48 C 40 65, 50 80, 65 90 L 60 85 L 68 83 L 62 77 L 68 60 C 55 55, 45 50, 38 48 Z;
            M 38 48 C 40 25, 55 10, 75 5 L 72 12 L 80 15 L 75 22 L 82 28 C 70 38, 55 44, 38 48 Z
          "
        />
      </path>
    </g>
  </svg>
);

const FeatherIcon = ({ className, bend = 'straight' }: { className?: string, bend?: 'straight' | 'left' | 'right' }) => (
  <svg viewBox="0 0 60 180" className={className}>
    <g>
      {bend === 'straight' && (
        <g>
          {/* Downy/fluffy base (afterfeather) - blurred slightly for softness */}
          <g fill="url(#featherGrad)" opacity="0.85">
            <path d="M 30 150 C 22 140, 18 120, 26 115 C 22 130, 26 145, 30 155 Z" />
            <path d="M 30 150 C 38 140, 42 120, 34 115 C 38 130, 34 145, 30 155 Z" />
            <path d="M 30 140 C 20 130, 16 110, 24 105 C 18 120, 24 135, 30 145 Z" />
            <path d="M 30 140 C 40 130, 44 110, 36 105 C 42 120, 36 135, 30 145 Z" />
          </g>

          {/* Main Feather Vane with realistic notches (skinnier and taller) */}
          <path fill="url(#featherGrad)" d="
            M 30 10 
            C 36 15, 42 40, 44 70 
            C 45 90, 42 100, 38 120 
            L 36 118 L 37 125 
            C 36 135, 34 142, 30 150 
            C 26 142, 24 135, 23 125 
            L 24 118 L 22 120 
            C 18 100, 15 90, 16 70 
            C 18 40, 24 15, 30 10 
            Z" 
          />
          
          {/* Fine barb details (soft lines) */}
          <g stroke="#5a1224" strokeWidth="0.6" opacity="0.5" fill="none">
            <path d="M 30 20 Q 36 25 42 45" />
            <path d="M 30 40 Q 38 45 44 65" />
            <path d="M 30 60 Q 40 65 44 85" />
            <path d="M 30 80 Q 40 85 43 105" />
            <path d="M 30 100 Q 38 105 41 120" />
            <path d="M 30 120 Q 35 125 38 135" />

            <path d="M 30 20 Q 24 25 18 45" />
            <path d="M 30 40 Q 22 45 16 65" />
            <path d="M 30 60 Q 20 65 16 85" />
            <path d="M 30 80 Q 20 85 17 105" />
            <path d="M 30 100 Q 22 105 19 120" />
            <path d="M 30 120 Q 25 125 22 135" />
          </g>

          {/* Central Quill (Rachis) - extends further down */}
          <path fill="none" stroke="url(#quillGrad)" strokeWidth="1.8" strokeLinecap="round" d="M 30 10 L 30 175" />
          
          {/* Quill highlight for 3D effect */}
          <path fill="none" stroke="#ffffff" strokeWidth="0.5" opacity="0.6" d="M 29.5 12 L 29.5 170" />
        </g>
      )}

      {bend === 'left' && (
        <g>
          <g fill="url(#featherGrad)" opacity="0.85">
            <path d="M 14 147 C 8 137, 4 117, 12 112 C 8 127, 12 142, 14 152 Z" />
            <path d="M 14 147 C 22 137, 26 117, 18 112 C 22 127, 18 142, 14 152 Z" />
            <path d="M 16 137 C 6 127, 2 107, 10 102 C 4 117, 10 132, 16 142 Z" />
            <path d="M 16 137 C 26 127, 30 107, 22 102 C 28 117, 22 132, 16 142 Z" />
          </g>
          <path fill="url(#featherGrad)" d="
            M 30 10 
            C 36 15, 39.6 39, 38.4 70 
            C 37 90, 30.4 103, 26 120 
            L 24 118 L 25 125 
            C 23 135, 19.6 138, 14 147 
            C 11.6 138, 9 135, 10.5 125 
            L 11.5 118 L 9.5 120 
            C 10.4 103, 10.4 90, 10.4 70 
            C 10.4 39, 20 15, 30 10 
            Z" 
          />
          <g stroke="#5a1224" strokeWidth="0.6" opacity="0.5" fill="none">
            <path d="M 29 20 Q 35 25 40 45" />
            <path d="M 27.6 39 Q 35 45 39 65" />
            <path d="M 26 60 Q 34 65 37 85" />
            <path d="M 23 80 Q 30 85 32 105" />
            <path d="M 21 100 Q 27 105 28 120" />
            <path d="M 18 120 Q 22 125 23 135" />

            <path d="M 29 20 Q 23 25 17 45" />
            <path d="M 27.6 39 Q 20 45 14 65" />
            <path d="M 26 60 Q 18 65 13 85" />
            <path d="M 23 80 Q 16 85 12 105" />
            <path d="M 21 100 Q 15 105 11 120" />
            <path d="M 18 120 Q 14 125 12 135" />
          </g>
          <path fill="none" stroke="url(#quillGrad)" strokeWidth="1.8" strokeLinecap="round" d="M 30 10 Q 25 80 10 175" />
          <path fill="none" stroke="#ffffff" strokeWidth="0.5" opacity="0.6" d="M 29.5 12 Q 24.5 80 9.5 170" />
        </g>
      )}

      {bend === 'right' && (
        <g>
          <g fill="url(#featherGrad)" opacity="0.85">
            <path d="M 46 147 C 38 137, 34 117, 42 112 C 38 127, 42 142, 46 152 Z" />
            <path d="M 46 147 C 54 137, 58 117, 50 112 C 54 127, 50 142, 46 152 Z" />
            <path d="M 44 137 C 34 127, 30 107, 38 102 C 34 117, 38 132, 44 142 Z" />
            <path d="M 44 137 C 54 127, 58 107, 50 102 C 56 117, 50 132, 44 142 Z" />
          </g>
          <path fill="url(#featherGrad)" d="
            M 30 10 
            C 36 15, 44.4 39, 49.6 70 
            C 50 90, 49.6 103, 49.5 120 
            L 50.5 118 L 48.5 125 
            C 49 135, 48.4 138, 46 147 
            C 40.4 138, 37 135, 35 125 
            L 36 118 L 34 120 
            C 33.5 103, 21.6 90, 21.6 70 
            C 21.6 39, 24 15, 30 10 
            Z" 
          />
          <g stroke="#5a1224" strokeWidth="0.6" opacity="0.5" fill="none">
            <path d="M 31 20 Q 37 25 43 45" />
            <path d="M 32.4 39 Q 40 45 46 65" />
            <path d="M 34 60 Q 42 65 47 85" />
            <path d="M 37 80 Q 44 85 48 105" />
            <path d="M 39 100 Q 45 105 49 120" />
            <path d="M 42 120 Q 46 125 48 135" />

            <path d="M 31 20 Q 25 25 20 45" />
            <path d="M 32.4 39 Q 25 45 21 65" />
            <path d="M 34 60 Q 26 65 23 85" />
            <path d="M 37 80 Q 30 85 28 105" />
            <path d="M 39 100 Q 33 105 32 120" />
            <path d="M 42 120 Q 38 125 37 135" />
          </g>
          <path fill="none" stroke="url(#quillGrad)" strokeWidth="1.8" strokeLinecap="round" d="M 30 10 Q 35 80 50 175" />
          <path fill="none" stroke="#ffffff" strokeWidth="0.5" opacity="0.6" d="M 29.5 12 Q 34.5 80 49.5 170" />
        </g>
      )}
    </g>
  </svg>
);

export const AvianField: React.FC = React.memo(() => {
  // Define flock members relative to a flock container
  const flock = [
    // Set 1 (Front / Main)
    { top: '45%', left: '10%', size: 160, bobDuration: '1.5s', flapDuration: '0.8s' },
    { top: '25%', left: '25%', size: 120, bobDuration: '1.4s', flapDuration: '0.85s' },
    { top: '65%', left: '22%', size: 140, bobDuration: '1.6s', flapDuration: '0.75s' },
    { top: '15%', left: '40%', size: 90, bobDuration: '1.3s', flapDuration: '0.9s' },
    { top: '80%', left: '38%', size: 110, bobDuration: '1.7s', flapDuration: '0.8s' },
    
    // Set 2 (Top Right / Further back)
    { top: '30%', left: '35%', size: 130, bobDuration: '1.6s', flapDuration: '0.78s' },
    { top: '10%', left: '50%', size: 100, bobDuration: '1.5s', flapDuration: '0.83s' },
    { top: '45%', left: '48%', size: 115, bobDuration: '1.7s', flapDuration: '0.73s' },
    { top: '5%', left: '65%', size: 75, bobDuration: '1.4s', flapDuration: '0.88s' },
    { top: '35%', left: '70%', size: 110, bobDuration: '1.65s', flapDuration: '0.8s' },

    // Set 3 (Bottom Right / Mid distance)
    { top: '60%', left: '30%', size: 145, bobDuration: '1.45s', flapDuration: '0.82s' },
    { top: '75%', left: '42%', size: 125, bobDuration: '1.55s', flapDuration: '0.77s' },
    { top: '25%', left: '60%', size: 85, bobDuration: '1.25s', flapDuration: '0.92s' },
    { top: '90%', left: '58%', size: 105, bobDuration: '1.65s', flapDuration: '0.82s' },
    { top: '65%', left: '65%', size: 120, bobDuration: '1.5s', flapDuration: '0.84s' },

    // Set 4 (Top Left / High up)
    { top: '5%', left: '15%', size: 85, bobDuration: '1.3s', flapDuration: '0.85s' },
    { top: '20%', left: '5%', size: 105, bobDuration: '1.5s', flapDuration: '0.8s' },
    { top: '55%', left: '12%', size: 150, bobDuration: '1.7s', flapDuration: '0.75s' },
    { top: '35%', left: '55%', size: 125, bobDuration: '1.4s', flapDuration: '0.82s' },
    { top: '85%', left: '25%', size: 135, bobDuration: '1.6s', flapDuration: '0.78s' },

    // Set 5 (Far Right / Trailing)
    { top: '15%', left: '80%', size: 95, bobDuration: '1.45s', flapDuration: '0.88s' },
    { top: '45%', left: '85%', size: 110, bobDuration: '1.65s', flapDuration: '0.81s' },
    { top: '75%', left: '78%', size: 120, bobDuration: '1.5s', flapDuration: '0.79s' },
    { top: '25%', left: '90%', size: 80, bobDuration: '1.35s', flapDuration: '0.9s' },
    { top: '85%', left: '88%', size: 105, bobDuration: '1.55s', flapDuration: '0.83s' },
  ];

  const feathers: Array<{ left: string, delay: string, duration: string, size: number, bend: 'straight' | 'left' | 'right', anim: string }> = [
    { left: '15%', delay: '0s', duration: '14s', size: 35, bend: 'left', anim: 'featherSway1' },
    { left: '25%', delay: '4s', duration: '16s', size: 28, bend: 'straight', anim: 'featherSway2' },
    { left: '45%', delay: '2s', duration: '18s', size: 40, bend: 'right', anim: 'featherSway3' },
    { left: '65%', delay: '7s', duration: '15s', size: 25, bend: 'left', anim: 'featherSway4' },
    { left: '85%', delay: '1s', duration: '17s', size: 32, bend: 'straight', anim: 'featherSway1' },
    { left: '5%', delay: '9s', duration: '20s', size: 30, bend: 'right', anim: 'featherSway2' },
    { left: '55%', delay: '3s', duration: '13s', size: 26, bend: 'left', anim: 'featherSway3' },
    { left: '75%', delay: '6s', duration: '19s', size: 38, bend: 'straight', anim: 'featherSway4' },
    { left: '35%', delay: '8s', duration: '16s', size: 34, bend: 'right', anim: 'featherSway1' },
    { left: '95%', delay: '5s', duration: '15s', size: 29, bend: 'left', anim: 'featherSway2' },
    { left: '50%', delay: '11s', duration: '18s', size: 36, bend: 'straight', anim: 'featherSway3' },
    { left: '20%', delay: '10s', duration: '14s', size: 27, bend: 'right', anim: 'featherSway4' },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]">
      <svg className="absolute w-0 h-0">
        <defs>
          <linearGradient id="ravenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2a0810" />
            <stop offset="50%" stopColor="#0a0a0a" />
            <stop offset="100%" stopColor="#1a0508" />
          </linearGradient>
          <linearGradient id="beakGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8c4a5b" />
            <stop offset="100%" stopColor="#2a0810" />
          </linearGradient>
          <linearGradient id="featherGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#b53353" />
            <stop offset="40%" stopColor="#9e2a46" />
            <stop offset="100%" stopColor="#5a1224" />
          </linearGradient>
          <linearGradient id="quillGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffc2d1" stopOpacity="0.5" />
            <stop offset="80%" stopColor="#ffc2d1" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
          </linearGradient>
        </defs>
      </svg>
      <style>
        {`
          @keyframes flockFly {
            0% { transform: translateX(100vw); }
            75% { transform: translateX(calc(-100vw - 300px)); }
            100% { transform: translateX(calc(-100vw - 300px)); }
          }
          @keyframes bobbing {
            0% { transform: translateY(0px); }
            100% { transform: translateY(-30px); }
          }
          @keyframes featherSway1 {
            0% { transform: translateY(-30vh) translateX(0) rotate(10deg); opacity: 0; }
            10% { opacity: 0.8; }
            25% { transform: translateY(20vh) translateX(40px) rotate(-15deg); }
            50% { transform: translateY(50vh) translateX(-20px) rotate(20deg); }
            75% { transform: translateY(80vh) translateX(30px) rotate(-10deg); }
            90% { opacity: 0.8; }
            100% { transform: translateY(130vh) translateX(-10px) rotate(15deg); opacity: 0; }
          }
          @keyframes featherSway2 {
            0% { transform: translateY(-30vh) translateX(0) rotate(-20deg); opacity: 0; }
            10% { opacity: 0.8; }
            33% { transform: translateY(30vh) translateX(-50px) rotate(10deg); }
            66% { transform: translateY(70vh) translateX(40px) rotate(-25deg); }
            90% { opacity: 0.8; }
            100% { transform: translateY(130vh) translateX(-20px) rotate(5deg); opacity: 0; }
          }
          @keyframes featherSway3 {
            0% { transform: translateY(-30vh) translateX(0) rotate(0deg); opacity: 0; }
            10% { opacity: 0.8; }
            50% { transform: translateY(50vh) translateX(60px) rotate(45deg); }
            90% { opacity: 0.8; }
            100% { transform: translateY(130vh) translateX(-40px) rotate(-30deg); opacity: 0; }
          }
          @keyframes featherSway4 {
            0% { transform: translateY(-30vh) translateX(0) rotate(15deg); opacity: 0; }
            10% { opacity: 0.8; }
            50% { transform: translateY(50vh) translateX(-30px) rotate(180deg); }
            90% { opacity: 0.8; }
            100% { transform: translateY(130vh) translateX(20px) rotate(345deg); opacity: 0; }
          }
          @keyframes windSwoop {
            0%, 55% { transform: translateX(100vw); opacity: 0; }
            60% { opacity: 1; }
            90% { opacity: 1; }
            98% { transform: translateX(-300vw); opacity: 0; }
            100% { transform: translateX(-300vw); opacity: 0; }
          }
          @keyframes featherWindBlow {
            0%, 55% { transform: translateX(0) translateY(0) rotate(0deg); opacity: 1; }
            60% { transform: translateX(-20vw) translateY(-5vh) rotate(-45deg); opacity: 1; }
            75% { transform: translateX(-150vw) translateY(-10vh) rotate(-90deg); opacity: 0; }
            76%, 85% { transform: translateX(50vw) translateY(-20vh) rotate(45deg); opacity: 0; }
            100% { transform: translateX(0) translateY(0) rotate(0deg); opacity: 1; }
          }
          .flock-container {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100vh;
            animation: flockFly 18s linear infinite;
          }
          .wind-container {
            position: absolute;
            top: 0;
            left: 0;
            width: 300vw;
            height: 100vh;
            animation: windSwoop 18s cubic-bezier(0.4, 0, 0.2, 1) infinite;
            z-index: 5;
          }
          .feather-wrapper {
          }
        `}
      </style>

      {/* Feathers */}
      {feathers.map((f, i) => (
        <div
          key={`feather-${i}`}
          className="absolute z-0 feather-wrapper"
          style={{
            left: f.left,
            width: `${f.size}px`,
          }}
        >
          <div style={{ animation: `featherWindBlow 18s cubic-bezier(0.4, 0, 0.2, 1) infinite` }}>
            <div style={{ animation: `${f.anim} ${f.duration} linear ${f.delay} infinite both` }}>
              <FeatherIcon bend={f.bend} />
            </div>
          </div>
        </div>
      ))}

      {/* Wind Gust */}
      <div className="wind-container">
        {useMemo(() => Array.from({ length: 50 }).map((_, i) => (
          <div
            key={`wind-${i}`}
            className="absolute bg-gradient-to-l from-transparent via-white/20 to-transparent rounded-full"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 100 + 50}vw`,
              height: `${Math.random() * 4 + 1}px`,
              opacity: Math.random() * 0.3 + 0.1,
            }}
          />
        )), [])}
      </div>

      {/* Flock of Ravens */}
      <div className="flock-container z-10">
        {flock.map((r, i) => (
          <div
            key={`raven-${i}`}
            className="absolute text-black"
            style={{
              top: r.top,
              left: r.left,
              width: `${r.size}px`,
            }}
          >
            <div style={{ animation: `bobbing ${r.bobDuration} ease-in-out infinite alternate` }}>
              <RavenIcon className="drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)]" flapDuration={r.flapDuration} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
