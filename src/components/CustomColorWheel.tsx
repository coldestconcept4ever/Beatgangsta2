import React, { useEffect, useRef } from 'react';
import tinycolor from 'tinycolor2';

export const CustomColorWheel = ({ color, onChange, size = 240 }: { color: string, onChange: (hex: string) => void, size?: number }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDragging = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const radius = size / 2;
    const centerX = radius;
    const centerY = radius;

    ctx.clearRect(0, 0, size, size);

    // Draw the hue wheel with saturation gradient
    for (let angle = 0; angle < 360; angle++) {
      const startAngle = (angle - 0.5) * Math.PI / 180;
      const endAngle = (angle + 1.5) * Math.PI / 180;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      gradient.addColorStop(0, 'white');
      gradient.addColorStop(1, `hsl(${angle}, 100%, 50%)`);
      ctx.fillStyle = gradient;
      ctx.fill();
    }
  }, [size]);

  const handleInteraction = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const centerX = size / 2;
    const centerY = size / 2;
    
    const dx = x - centerX;
    const dy = y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Calculate angle
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    const hue = (angle + 360) % 360;
    
    // Clamp saturation to 100% (edge of circle)
    const saturation = Math.min(1, distance / (size / 2)) * 100;
    
    onChange(tinycolor({ h: hue, s: saturation, v: 100 }).toHexString());
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (isDragging.current) {
        handleInteraction(e.clientX, e.clientY);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (isDragging.current) {
        e.preventDefault();
        handleInteraction(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const onEnd = () => {
      isDragging.current = false;
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, [size]);

  return (
    <div className="relative select-none" style={{ width: size, height: size }}>
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="cursor-crosshair rounded-full touch-none"
        onMouseDown={(e) => {
          isDragging.current = true;
          handleInteraction(e.clientX, e.clientY);
        }}
        onTouchStart={(e) => {
          isDragging.current = true;
          handleInteraction(e.touches[0].clientX, e.touches[0].clientY);
        }}
      />
    </div>
  );
};
