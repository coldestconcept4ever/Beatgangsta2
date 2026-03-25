import React, { useState, useEffect } from 'react';

export const DownloadableLogoText = ({ currentAppName, theme }: { currentAppName: string, theme: string }) => {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateLogoDataURL = async (): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const scale = 4;
      canvas.width = 300 * scale;
      canvas.height = 80 * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve('');

      ctx.scale(scale, scale);
      
      let color1 = '#ffffff';
      let color2 = '#ef4444';
      
      if (theme === 'coldest') {
        color1 = '#0c4a6e';
        color2 = '#0369a1';
      } else if (theme === 'chef-mode') {
        color1 = '#431407';
        color2 = '#ea580c';
      } else if (theme === 'hustle-time') {
        color1 = '#facc15';
        color2 = '#064e3b';
      } else if (theme === 'ethereal-forest') {
        color1 = '#0c4a6e';
        color2 = '#0ea5e9';
      }

      ctx.textBaseline = 'top';
      
      // Line 1
      ctx.font = '900 20px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = color1;
      (ctx as any).letterSpacing = '-1px';
      ctx.fillText(currentAppName, 10, 10);
      
      // Line 2
      ctx.font = '900 9px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = color2;
      (ctx as any).letterSpacing = '2.7px';
      ctx.fillText('COLDESTCONCEPT', 10, 30);
      
      // Crop canvas to fit text
      const metrics1 = ctx.measureText(currentAppName);
      const metrics2 = ctx.measureText('COLDESTCONCEPT');
      const textWidth = Math.max(metrics1.width, metrics2.width);
      
      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = (textWidth + 20) * scale;
      finalCanvas.height = 50 * scale;
      const fctx = finalCanvas.getContext('2d');
      if (!fctx) return resolve(canvas.toDataURL('image/png'));
      
      fctx.scale(scale, scale);
      fctx.textBaseline = 'top';
      
      fctx.font = '900 20px system-ui, -apple-system, sans-serif';
      fctx.fillStyle = color1;
      (fctx as any).letterSpacing = '-1px';
      fctx.fillText(currentAppName, 10, 10);
      
      fctx.font = '900 9px system-ui, -apple-system, sans-serif';
      fctx.fillStyle = color2;
      (fctx as any).letterSpacing = '2.7px';
      fctx.fillText('COLDESTCONCEPT', 10, 30);
      
      resolve(finalCanvas.toDataURL('image/png'));
    });
  };

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      await document.fonts.ready;
      const url = await generateLogoDataURL();
      if (isMounted) setImgSrc(url);
    };
    init();
    return () => { isMounted = false; };
  }, [currentAppName, theme]);

  const handleDownload = async () => {
    if (isGenerating) return;
    try {
      setIsGenerating(true);
      let finalImgSrc = imgSrc;
      if (!finalImgSrc) {
        finalImgSrc = await generateLogoDataURL();
        setImgSrc(finalImgSrc);
      }
      if (finalImgSrc) {
        const link = document.createElement('a');
        link.download = `${currentAppName}-Logo.png`;
        link.href = finalImgSrc;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err: any) {
      console.error("Failed to generate logo PNG", err);
      alert(`Failed to generate logo: ${err.message || 'Unknown error'}. Please try again.`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div 
      className={`relative flex flex-col cursor-pointer transition-transform ${isGenerating ? 'opacity-50' : 'active:scale-95'}`} 
      title="Click or Right-click to save Logo as PNG" 
      onClick={handleDownload}
    >
      <div className="flex flex-col p-2 -m-2">
        <h1 className={`text-xl font-black tracking-tighter leading-none select-none ${theme === 'coldest' ? 'text-[#0c4a6e]' : theme === 'chef-mode' ? 'text-[#431407]' : theme === 'hustle-time' ? 'text-yellow-400' : 'text-white'}`}>{currentAppName}</h1>
        <span className={`text-[9px] font-black uppercase tracking-[0.3em] select-none ${theme === 'coldest' ? 'text-[#0369a1]' : theme === 'hustle-time' ? 'text-[#eab308]' : theme === 'chef-mode' ? 'text-[#ea580c]' : theme === 'ethereal-forest' ? 'text-[#0ea5e9]' : 'text-[#ef4444]'}`}>
          ColdestConcept
        </span>
      </div>
      {imgSrc && (
        <img 
          src={imgSrc} 
          alt="App Logo" 
          className="absolute inset-0 w-full h-full object-cover z-10 opacity-0" 
          style={{ pointerEvents: 'auto' }}
          onContextMenu={(e) => e.stopPropagation()}
        />
      )}
    </div>
  );
};
