
import React from 'react';

export const FairyController: React.FC = () => {
  return <div className="hidden">Fairy Controller</div>;
};

export const EtherealForestField: React.FC = () => {
  const items = React.useMemo(() => Array.from({ length: 30 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    delay: `${Math.random() * 10}s`,
    duration: `${5 + Math.random() * 5}s`,
    size: 2 + Math.random() * 4
  })), []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-emerald-950">
      <style>
        {`
          @keyframes glow {
            0%, 100% { opacity: 0.3; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.5); }
          }
          .glow-dot { animation: glow ease-in-out infinite; }
        `}
      </style>
      {items.map((item) => (
        <div
          key={item.id}
          className="absolute glow-dot rounded-full bg-emerald-400 blur-[2px]"
          style={{
            left: item.left,
            top: item.top,
            width: `${item.size}px`,
            height: `${item.size}px`,
            animationDuration: item.duration,
            animationDelay: item.delay
          }}
        />
      ))}
    </div>
  );
};
