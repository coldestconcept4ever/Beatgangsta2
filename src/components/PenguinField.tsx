
import React from 'react';

const ClubPenguinGhost: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    viewBox="0 0 100 100" 
    className={className} 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <style>
      {`
        @keyframes shiftBody {
          0%, 100% { fill: #ef4444; }
          25% { fill: #dc2626; }
          50% { fill: #f87171; }
          75% { fill: #b91c1c; }
        }
        @keyframes shiftBelly {
          0%, 100% { fill: #fee2e2; }
          25% { fill: #fecaca; }
          50% { fill: #fef2f2; }
          75% { fill: #fff1f2; }
        }
        @keyframes shiftAccent {
          0%, 100% { fill: #991b1b; stroke: #991b1b; }
          25% { fill: #7f1d1d; stroke: #7f1d1d; }
          50% { fill: #b91c1c; stroke: #b91c1c; }
          75% { fill: #dc2626; stroke: #dc2626; }
        }
        @keyframes shiftBeak {
          0%, 100% { fill: #facc15; }
          25% { fill: #eab308; }
          50% { fill: #fde047; }
          75% { fill: #ca8a04; }
        }
        .p-body { animation: shiftBody 12s infinite ease-in-out; }
        .p-belly { animation: shiftBelly 12s infinite ease-in-out; }
        .p-accent { animation: shiftAccent 12s infinite ease-in-out; }
        .p-accent-stroke { animation: shiftAccent 12s infinite ease-in-out; fill: none; }
        .p-beak { animation: shiftBeak 12s infinite ease-in-out; }
      `}
    </style>

    {/* Body - The classic egg shape */}
    <path className="p-body" d="M50 15 C30 15 15 40 15 70 C15 85 30 95 50 95 C70 95 85 85 85 70 C85 40 70 15 50 15" />
    
    {/* Belly - Light patch */}
    <path className="p-belly" d="M50 40 C35 40 25 55 25 75 C25 85 35 90 50 90 C65 90 75 85 75 75 C75 55 65 40 50 40" />
    
    {/* Rambo Bandana - Wrap around head */}
    <g className="p-accent">
      {/* Bandana Tails (Knot at the back) */}
      <path d="M18 32 L5 25 L8 35 Z" />
      <path d="M18 35 L2 45 L10 42 Z" opacity="0.8" />
      
      {/* Main Bandana Wrap */}
      <path 
        d="M18 30 Q30 25 50 25 Q70 25 82 30 L83 40 Q70 35 50 35 Q30 35 17 40 Z" 
      />
    </g>

    {/* Beak - Stylized yellow */}
    <path className="p-beak" d="M42 52 L58 52 L50 62 Z" />
    
    {/* Eyes - Positioned slightly lower due to bandana */}
    <circle className="p-accent" cx="42" cy="45" r="5" />
    <circle className="p-accent" cx="58" cy="45" r="5" />
    {/* Pupils */}
    <circle className="p-belly" cx="44" cy="45" r="1.5" />
    <circle className="p-belly" cx="60" cy="45" r="1.5" />
    
    {/* Flippers */}
    <path className="p-body" d="M15 65 C5 65 5 80 15 80" />
    <path className="p-body" d="M85 65 C95 65 95 80 85 80" />
    
    {/* Feet */}
    <path className="p-accent-stroke" d="M35 92 Q35 98 25 96" strokeWidth="4" strokeLinecap="round" />
    <path className="p-accent-stroke" d="M65 92 Q65 98 75 96" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

export const PenguinField: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <style>
        {`
          /* Pac-Man style grid movement for a single solitary penguin */
          @keyframes ghostPathSingle {
            0% { top: 15%; left: -10%; }
            20% { top: 15%; left: 45%; }
            40% { top: 75%; left: 45%; }
            60% { top: 75%; left: 85%; }
            80% { top: 40%; left: 85%; }
            100% { top: 15%; left: -10%; }
          }

          .ghost-penguin-solo {
            position: absolute;
            width: 120px;
            height: 120px;
            filter: drop-shadow(0 15px 35px rgba(12, 74, 110, 0.5));
            opacity: 0.5;
            animation: ghostPathSingle 40s linear infinite;
            transition: opacity 0.3s ease;
          }
          
          .ghost-penguin-solo:hover {
            opacity: 0.9;
          }
        `}
      </style>

      {/* The Single Rambo Penguin with color shifting logic internal to SVG */}
      <div className="ghost-penguin-solo">
        <ClubPenguinGhost className="w-full h-full" />
      </div>
    </div>
  );
};
