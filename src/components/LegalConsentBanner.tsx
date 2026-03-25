import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Loader2, ExternalLink } from 'lucide-react';

interface LegalConsentBannerProps {
  show: boolean;
  onAccept: () => void;
  onClose: () => void;
  isSaving?: boolean;
  error?: string | null;
}

export const LegalConsentBanner: React.FC<LegalConsentBannerProps> = ({ 
  show, 
  onAccept, 
  onClose,
  isSaving,
  error
}) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          id="legal-consent-banner"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-0 left-2 right-2 sm:left-0 sm:right-0 z-[1000000] bg-black border border-white/10 shadow-2xl rounded-t-2xl sm:rounded-none sm:border-t sm:border-l-0 sm:border-r-0"
        >
          <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-10 h-10 bg-orange-500/10 rounded-full flex items-center justify-center shrink-0 hidden sm:flex">
                <Shield className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-white text-sm font-medium">
                  We value your privacy and security.
                </p>
                <p className="text-white/60 text-xs mt-0.5 flex items-center gap-3">
                  By continuing, you agree to our 
                  <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:text-orange-300 transition-colors inline-flex items-center gap-1">
                    Terms <ExternalLink className="w-3 h-3" />
                  </a>
                  and
                  <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:text-orange-300 transition-colors inline-flex items-center gap-1">
                    Privacy Policy <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
                {error && (
                  <p className="text-red-400 text-xs mt-1 font-medium">{error}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={onClose}
                disabled={isSaving}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-white/60 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
              >
                Decline
              </button>
              <button
                onClick={onAccept}
                disabled={isSaving}
                className="flex-1 sm:flex-none px-6 py-2 rounded-xl bg-orange-500 text-white text-xs font-bold uppercase tracking-wider hover:bg-orange-400 transition-colors shadow-lg shadow-orange-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Accept & Continue'
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
