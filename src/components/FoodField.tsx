
import React from 'react';

export const FoodField: React.FC = () => {
  const items = React.useMemo(() => Array.from({ length: 20 }).map((_, i) => ({
    id: i,
    emoji: ['🍕', '🍔', '🍩', '🌮'][Math.floor(Math.random() * 4)],
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 20}s`,
    duration: `${10 + Math.random() * 10}s`,
    size: 30 + Math.random() * 20
  })), []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-orange-50">
      <style>
        {`
          @keyframes foodFall {
            0% { transform: translateY(-10vh) rotate(0deg); opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { transform: translateY(110vh) rotate(360deg); opacity: 0; }
          }
          .food-item { animation: foodFall linear infinite; }
        `}
      </style>
      {items.map((item) => (
        <div
          key={item.id}
          className="absolute food-item"
          style={{
            left: item.left,
            top: '-10vh',
            animationDuration: item.duration,
            animationDelay: item.delay,
            fontSize: `${item.size}px`
          }}
        >
          {item.emoji}
        </div>
      ))}
    </div>
  );
};
