import React, { useEffect, useState } from 'react';
import { AppTheme } from '../types';
import { X, ChevronRight, Check } from 'lucide-react';

export interface TutorialStep {
  targetId: string;
  title: string;
  content: string;
  placement: 'top' | 'bottom' | 'left' | 'right' | 'center';
  requireAction?: boolean;
  allowInteraction?: boolean;
  isHighlighted?: boolean;
  onEnter?: () => void;
  onNext?: () => void;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    targetId: 'tutorial-welcome',
    title: 'Welcome to BeatGangsta 🎹',
    content: 'This is your AI production assistant. Let me show you around the studio so you can start dropping some sub-zero vibes.',
    placement: 'center'
  },
  {
    targetId: 'legal-consent-banner',
    title: 'Terms & Privacy',
    content: 'By using BeatGangsta, you agree to our terms and privacy policy. You can opt out if you prefer.',
    placement: 'top'
  },
  {
    targetId: 'btn-google-signin',
    title: 'Sign In',
    content: 'Sign in with Google to sync your gear and recipes to the cloud.',
    placement: 'bottom'
  },
  {
    targetId: 'btn-gear-rack',
    title: '1. Stock Your Studio',
    content: 'First things first: open the Gear Rack to tell the AI what VST plugins and analog hardware you own. The AI will only recommend gear you actually have!',
    placement: 'bottom'
  },
  {
    targetId: 'toggle-gangstavox',
    title: '2. Choose Your Mode',
    content: 'BeatGangsta is for making instrumentals. Switch to GangstaVox when you need vocal chains and mixing recipes.',
    placement: 'bottom'
  },
  {
    targetId: 'input-vibe-search',
    title: '3. Vibe Search',
    content: 'Type an artist, genre, or vibe (like "Cyberpunk Phonk" or "Travis Scott") to get a custom recipe instantly.',
    placement: 'top'
  },
  {
    targetId: 'input-song-search',
    title: '4. Song Search',
    content: 'Want to recreate a specific sound? Type a song name and artist to get the exact recipe they used.',
    placement: 'top'
  },
  {
    targetId: 'dropzone-audio',
    title: '5. Audio Analysis & Critique',
    content: 'Drop an MP3 here! "Extract Recipe" will find the plugins used in the beat. "Mix Critique" will give you professional feedback on your mix.',
    placement: 'top'
  },
  {
    targetId: 'btn-vault',
    title: '6. The Vault',
    content: 'Whenever you generate a recipe or critique you like, save it! It will be stored safely in your Vault.',
    placement: 'bottom'
  },
  {
    targetId: 'tutorial-welcome',
    title: 'You\'re Ready! 🚀',
    content: 'Time to make some hits. If you ever need to see this again, you can reset the tutorial in the Settings menu.',
    placement: 'center'
  }
];

interface TutorialOverlayProps {
  theme: AppTheme;
  stepIndex: number;
  steps: TutorialStep[];
  onNext: () => void;
  onSkip: () => void;
  isVerified: boolean;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ theme, stepIndex, steps, onNext, onSkip, isVerified }) => {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [bubbleRect, setBubbleRect] = useState<DOMRect | null>(null);
  const bubbleRef = React.useRef<HTMLDivElement>(null);
  const step = steps[stepIndex];

  useEffect(() => {
    if (!step || !bubbleRef.current) return;
    setBubbleRect(bubbleRef.current.getBoundingClientRect());
    if (step.onEnter) {
      step.onEnter();
    }
  }, [stepIndex, step]);

  useEffect(() => {
    if (!step) return;
    
    const scrollToTarget = () => {
      const el = document.getElementById(step.targetId);
      if (el && step.placement !== 'center') {
        // Force scroll to target regardless of current visibility
        if (el.offsetWidth > 0 && el.offsetHeight > 0) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        }
      }
    };

    // Try immediately
    scrollToTarget();
    
    // Try again after a short delay to account for animations/modals opening
    const timeoutId = setTimeout(scrollToTarget, 300);
    const timeoutId2 = setTimeout(scrollToTarget, 800);

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(timeoutId2);
    };
  }, [step]);

  useEffect(() => {
    if (!step) return;
    
    const updateRect = () => {
      if (bubbleRef.current) {
        const newRect = bubbleRef.current.getBoundingClientRect();
        setBubbleRect(prev => {
          if (!prev || Math.abs(prev.width - newRect.width) > 1 || Math.abs(prev.height - newRect.height) > 1) {
            return newRect;
          }
          return prev;
        });
      }
      if (step.placement === 'center') {
        setTargetRect(null);
        return;
      }
      const currentEl = document.getElementById(step.targetId);
      if (currentEl) {
        const rect = currentEl.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setTargetRect(prev => {
            if (!prev || 
                Math.abs(prev.top - rect.top) > 1 || 
                Math.abs(prev.left - rect.left) > 1 || 
                Math.abs(prev.width - rect.width) > 1 || 
                Math.abs(prev.height - rect.height) > 1) {
              return rect;
            }
            return prev;
          });
        } else {
          setTargetRect(null);
        }
      } else {
        setTargetRect(null);
      }
    };

    updateRect();
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);
    
    const timeout = setTimeout(updateRect, 300); // Wait for animations

    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
      clearTimeout(timeout);
    };
  }, [step]);

  if (!step) return null;

  const getThemeStyles = () => {
    switch (theme) {
      case 'coldest':
        return {
          bg: 'bg-white/95 backdrop-blur-xl border-sky-200 text-slate-900',
          btn: 'bg-sky-500 text-white hover:bg-sky-600',
          skipBtn: 'text-slate-500 hover:text-slate-700',
          highlight: 'ring-4 ring-sky-400 ring-offset-4 ring-offset-black/50'
        };
      case 'crazy-bird':
        return {
          bg: 'bg-[#0a0000]/95 backdrop-blur-xl border-red-900/50 text-red-50',
          btn: 'bg-red-600 text-white hover:bg-red-500',
          skipBtn: 'text-red-400/60 hover:text-red-400',
          highlight: 'ring-4 ring-red-500 ring-offset-4 ring-offset-black/50'
        };
      case 'hustle-time':
        return {
          bg: 'bg-black/95 backdrop-blur-xl border-yellow-900/50 text-yellow-50',
          btn: 'bg-yellow-500 text-black hover:bg-yellow-400',
          skipBtn: 'text-yellow-600/60 hover:text-yellow-500',
          highlight: 'ring-4 ring-yellow-400 ring-offset-4 ring-offset-black/50'
        };
      default:
        return {
          bg: 'bg-[#fef3c7]/95 backdrop-blur-xl border-orange-200 text-orange-950',
          btn: 'bg-orange-600 text-white hover:bg-orange-500',
          skipBtn: 'text-orange-900/50 hover:text-orange-900',
          highlight: 'ring-4 ring-orange-500 ring-offset-4 ring-offset-black/50'
        };
    }
  };

  const styles = getThemeStyles();

  // Calculate position
  let top = '50%';
  let left = '50%';
  let transform = 'translate(-50%, -50%)';

  if (targetRect && step.placement !== 'center') {
    const spacing = 32; // Increased spacing for better clearance
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 768;
    const bubbleWidth = bubbleRect ? bubbleRect.width : Math.min(viewportWidth - 32, 384);
    const bubbleHeight = bubbleRect ? bubbleRect.height : 250;
    
    let effectivePlacement = step.placement;

    // Forbidden zone: Central modal area (approx 768px wide, centered)
    // We want to avoid covering the center if possible, especially on mobile
    const isModalActive = step.targetId?.includes('api-key') || step.targetId?.includes('modal');
    const modalWidth = Math.min(viewportWidth * 0.9, 768);
    const modalLeft = (viewportWidth - modalWidth) / 2;
    const modalRight = modalLeft + modalWidth;
    const modalTop = viewportHeight * 0.05;
    const modalBottom = viewportHeight * 0.95;

    // Smart placement: Flip if not enough space, or if it would overlap the target
    const fitsTop = targetRect.top - bubbleHeight - spacing > 16;
    const fitsBottom = targetRect.bottom + bubbleHeight + spacing < viewportHeight - 16;
    const fitsLeft = targetRect.left - bubbleWidth - spacing > 16;
    const fitsRight = targetRect.right + bubbleWidth + spacing < viewportWidth - 16;

    if (step.placement === 'top' && !fitsTop) {
      if (fitsBottom) effectivePlacement = 'bottom';
      else if (fitsLeft) effectivePlacement = 'left';
      else if (fitsRight) effectivePlacement = 'right';
    } else if (step.placement === 'bottom' && !fitsBottom) {
      if (fitsTop) effectivePlacement = 'top';
      else if (fitsLeft) effectivePlacement = 'left';
      else if (fitsRight) effectivePlacement = 'right';
    } else if (step.placement === 'left' && !fitsLeft) {
      if (fitsRight) effectivePlacement = 'right';
      else if (fitsBottom) effectivePlacement = 'bottom';
      else if (fitsTop) effectivePlacement = 'top';
    } else if (step.placement === 'right' && !fitsRight) {
      if (fitsLeft) effectivePlacement = 'left';
      else if (fitsBottom) effectivePlacement = 'bottom';
      else if (fitsTop) effectivePlacement = 'top';
    }
    
    if (effectivePlacement === 'bottom' || effectivePlacement === 'top') {
      let calculatedLeft = targetRect.left + targetRect.width / 2;
      
      // Keep within horizontal bounds
      if (calculatedLeft + bubbleWidth / 2 > viewportWidth - 16) {
        calculatedLeft = viewportWidth - 16 - bubbleWidth / 2;
      }
      if (calculatedLeft - bubbleWidth / 2 < 16) {
        calculatedLeft = 16 + bubbleWidth / 2;
      }
      
      left = `${calculatedLeft}px`;
      
      if (effectivePlacement === 'bottom') {
        let calculatedTop = targetRect.bottom + spacing;
        // If it still overlaps (e.g. very large target), push it to the bottom
        if (calculatedTop + bubbleHeight > viewportHeight - 16) {
          calculatedTop = viewportHeight - 16 - bubbleHeight;
        }
        top = `${calculatedTop}px`;
        transform = 'translate(-50%, 0)';
      } else {
        let calculatedTop = targetRect.top - spacing;
        if (calculatedTop - bubbleHeight < 16) {
          calculatedTop = 16 + bubbleHeight;
        }
        top = `${calculatedTop}px`;
        transform = 'translate(-50%, -100%)';
      }
    } else if (effectivePlacement === 'right' || effectivePlacement === 'left') {
      let calculatedTop = targetRect.top + targetRect.height / 2;
      
      // Keep within vertical bounds
      if (calculatedTop + bubbleHeight / 2 > viewportHeight - 16) {
        calculatedTop = viewportHeight - 16 - bubbleHeight / 2;
      }
      if (calculatedTop - bubbleHeight / 2 < 16) {
        calculatedTop = 16 + bubbleHeight / 2;
      }
      
      top = `${calculatedTop}px`;
      
      if (effectivePlacement === 'right') {
        let calculatedLeft = targetRect.right + spacing;
        
        // If it overlaps the modal area, try to push it further right or flip
        if (isModalActive && calculatedLeft < modalRight && calculatedLeft + bubbleWidth > modalLeft) {
          if (fitsLeft && targetRect.left - bubbleWidth - spacing > 16) {
            effectivePlacement = 'left';
          }
        }

        if (calculatedLeft + bubbleWidth > viewportWidth - 16) {
          calculatedLeft = viewportWidth - 16 - bubbleWidth;
        }
        left = `${calculatedLeft}px`;
        transform = 'translate(0, -50%)';
      } else {
        let calculatedLeft = targetRect.left - spacing;
        
        // If it overlaps the modal area, try to push it further left or flip
        if (isModalActive && calculatedLeft - bubbleWidth < modalRight && calculatedLeft > modalLeft) {
          if (fitsRight && targetRect.right + bubbleWidth + spacing < viewportWidth - 16) {
            effectivePlacement = 'right';
          }
        }

        if (calculatedLeft - bubbleWidth < 16) {
          calculatedLeft = 16 + bubbleWidth;
        }
        left = `${calculatedLeft}px`;
        transform = 'translate(-100%, -50%)';
      }
    }
  }

  const isHighlighted = step.isHighlighted !== false; // Default to true

  return (
    <div className="fixed inset-0 z-[2000000] pointer-events-none overflow-hidden">
      {/* Highlight target with hole punch */}
      {isHighlighted && targetRect && step.placement !== 'center' && !(step.targetId === 'tutorial-turnstile' && isVerified) ? (
        <>
          {/* Highlight border */}
          <div 
            className={`absolute rounded-2xl transition-all duration-500 pointer-events-none ${styles.highlight}`}
            style={{
              top: targetRect.top - 2,
              left: targetRect.left - 2,
              width: targetRect.width + 4,
              height: targetRect.height + 4,
              zIndex: 2000000
            }}
          />
          
          {/* 4 backdrop divs to allow clicking the hole */}
          <div className="fixed top-0 left-0 right-0 bg-black/75 z-[1999998] pointer-events-auto" style={{ height: Math.max(0, targetRect.top - 2) }} />
          <div className="fixed bottom-0 left-0 right-0 bg-black/75 z-[1999998] pointer-events-auto" style={{ top: targetRect.bottom + 2 }} />
          <div className="fixed left-0 bg-black/75 z-[1999998] pointer-events-auto" style={{ top: Math.max(0, targetRect.top - 2), bottom: Math.max(0, window.innerHeight - (targetRect.bottom + 2)), width: Math.max(0, targetRect.left - 2) }} />
          <div className="fixed right-0 bg-black/75 z-[1999998] pointer-events-auto" style={{ top: Math.max(0, targetRect.top - 2), bottom: Math.max(0, window.innerHeight - (targetRect.bottom + 2)), left: targetRect.right + 2 }} />
          
          {/* If interaction is NOT allowed, add a transparent div over the hole to block clicks */}
          {!step.allowInteraction && (
            <div 
              className="absolute pointer-events-auto z-[1999998]"
              style={{
                top: targetRect.top - 2,
                left: targetRect.left - 2,
                width: targetRect.width + 4,
                height: targetRect.height + 4,
              }}
            />
          )}
        </>
      ) : (
        !(step.targetId === 'tutorial-turnstile' && isVerified) && (
          <div className="absolute inset-0 bg-black/75 pointer-events-auto transition-opacity duration-500 z-[1999998]" />
        )
      )}

      {/* Tutorial Bubble */}
      <div 
        ref={bubbleRef}
        className={`absolute w-[calc(100%-32px)] sm:w-[90%] max-w-[320px] sm:max-w-sm p-5 sm:p-6 rounded-3xl border shadow-2xl pointer-events-auto transition-all duration-500 z-[2000000] ${styles.bg}`}
        style={{ top, left, transform }}
      >
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-black uppercase tracking-wider">{step.title}</h3>
          <button 
            onClick={onSkip}
            className="p-1 rounded-full hover:bg-current/10 transition-colors"
            aria-label="Close tutorial"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <p className="text-sm font-medium opacity-80 leading-relaxed mb-6">
          {step.content}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <div 
                key={i} 
                className={`w-2 h-2 rounded-full transition-all duration-300 ${i === stepIndex ? 'bg-current scale-125' : 'bg-current/20'}`}
              />
            ))}
          </div>
          
          {!step.requireAction && (
            <button 
              onClick={() => {
                if (step.onNext) step.onNext();
                onNext();
              }}
              className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-transform active:scale-95 ${styles.btn}`}
            >
              {stepIndex === steps.length - 1 ? (
                <>Let's Go <Check className="w-3.5 h-3.5 sm:w-4 h-4" /></>
              ) : (
                <>Next <ChevronRight className="w-3.5 h-3.5 sm:w-4 h-4" /></>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Subtle Cancel Button - Hidden on mobile as it's moved to top bar */}
      <button 
        onClick={onSkip}
        className="hidden sm:block fixed bottom-6 right-6 z-[10000] pointer-events-auto px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest opacity-30 hover:opacity-100 transition-opacity bg-black/20 text-white backdrop-blur-sm border border-white/10"
      >
        Cancel Tutorial
      </button>
    </div>
  );
};
