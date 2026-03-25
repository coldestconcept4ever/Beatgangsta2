import React from 'react';
import { AnimatePresence, motion } from 'motion/react';

interface RestoreBackupModalProps {
  show: boolean;
  backupDate: string;
  onRestore: () => void;
  onClose: () => void;
}

export const RestoreBackupModal: React.FC<RestoreBackupModalProps> = ({ show, backupDate, onRestore, onClose }) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          id="modal-cloud-sync" 
          className="fixed inset-0 z-[399999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
        >
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 max-w-sm w-full text-center">
            <h2 className="text-2xl font-black text-white mb-4">Restore Backup?</h2>
            <p className="text-slate-300 mb-8">
              We found a backup from {new Date(backupDate).toLocaleDateString()}. Would you like to restore your studio state from this backup?
            </p>
            <div className="flex gap-4">
              <button 
                onClick={onClose}
                className="flex-1 py-3 rounded-full bg-slate-800 text-white font-bold hover:bg-slate-700"
              >
                No, thanks
              </button>
              <button 
                onClick={onRestore}
                className="flex-1 py-3 rounded-full bg-sky-500 text-white font-bold hover:bg-sky-600"
              >
                Restore
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
