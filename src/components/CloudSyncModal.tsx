import React, { useState } from 'react';
import { Cloud, Check, X, Settings, Music, Box, Save, CloudUpload, CloudDownload } from 'lucide-react';
import { AppTheme } from '../types';

interface CloudSyncModalProps {
  theme: AppTheme;
  mode: 'setup' | 'backup' | 'restore';
  user: any;
  onGoogleSignIn: () => void;
  initialPreferences?: { gear: boolean; settings: boolean; recipes: boolean; critiques: boolean };
  onSavePreferences?: (prefs: { gear: boolean; settings: boolean; recipes: boolean; critiques: boolean }) => void;
  onManualAction?: (action: 'backup' | 'restore', prefs: { gear: boolean; settings: boolean; recipes: boolean; critiques: boolean }) => void;
  onClose: () => void;
  isProcessing?: boolean;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  theme,
  mode,
  user,
  onGoogleSignIn,
  initialPreferences = { gear: true, settings: true, recipes: true, critiques: true },
  onSavePreferences,
  onManualAction,
  onClose,
  isProcessing
}) => {
  const [prefs, setPrefs] = useState(initialPreferences);

  const getThemeStyles = () => {
    switch (theme) {
      case 'coldest':
        return {
          container: "bg-[#020617] border-blue-900/50 text-blue-50",
          button: "bg-blue-600 text-white",
          accent: "bg-blue-600 text-white border-blue-600",
          itemActive: "border-blue-500 bg-blue-500/10",
          itemInactive: "border-blue-900/30 opacity-60",
          check: "bg-blue-600 text-white border-blue-600",
          checkEmpty: "border-blue-900/40",
          muted: "text-blue-200/60",
          iconBg: "bg-blue-500/10"
        };
      case 'crazy-bird':
        return {
          container: "bg-[#0a0000] border-red-900/50 text-red-50",
          button: "bg-red-600 text-white",
          accent: "bg-red-600 text-white border-red-600",
          itemActive: "border-red-500 bg-red-500/10",
          itemInactive: "border-red-900/30 opacity-60",
          check: "bg-red-600 text-white border-red-600",
          checkEmpty: "border-red-900/40",
          muted: "text-red-200/60",
          iconBg: "bg-red-500/10"
        };
      case 'hustle-time':
        return {
          container: "bg-black border-yellow-900/50 text-yellow-50",
          button: "bg-yellow-500 text-black",
          accent: "bg-yellow-500 text-black border-yellow-500",
          itemActive: "border-yellow-500 bg-yellow-500/10",
          itemInactive: "border-yellow-900/30 opacity-60",
          check: "bg-yellow-500 text-black border-yellow-500",
          checkEmpty: "border-yellow-900/40",
          muted: "text-yellow-200/60",
          iconBg: "bg-yellow-500/10"
        };
      default:
        return {
          container: "bg-[#fef3c7] border-orange-200 text-orange-950",
          button: "bg-orange-600 text-white",
          accent: "bg-orange-600 text-white border-orange-600",
          itemActive: "border-orange-600 bg-orange-600/5",
          itemInactive: "border-orange-200 opacity-60",
          check: "bg-orange-600 text-white border-orange-600",
          checkEmpty: "border-orange-200",
          muted: "text-orange-800/60",
          iconBg: "bg-orange-100"
        };
    }
  };

  const styles = getThemeStyles();

  const togglePref = (key: keyof typeof prefs) => {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="fixed inset-0 z-[399999] overflow-y-auto bg-black/60 backdrop-blur-sm">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div id="modal-cloud-sync" className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden ${styles.container}`}>
          <div className="p-6 border-b border-current/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {mode === 'backup' ? <CloudUpload className="w-6 h-6" /> : mode === 'restore' ? <CloudDownload className="w-6 h-6" /> : <Cloud className="w-6 h-6" />}
              <h2 className="text-xl font-black uppercase tracking-wider">
                {!user ? 'Connect Google Drive' : mode === 'setup' ? 'Auto-Backup Setup' : mode === 'backup' ? 'Backup to Cloud' : 'Restore from Cloud'}
              </h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-current/10 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

        <div className="p-6 space-y-6">
          {!user ? (
            <div className="text-center space-y-6 py-4">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto ${styles.iconBg}`}>
                <Cloud className="w-10 h-10 opacity-40" />
              </div>
              <div className="space-y-2">
                <p className="text-lg font-bold uppercase tracking-wide">Sign in to start syncing</p>
                <p className={`text-sm leading-relaxed ${styles.muted}`}>
                  Connect your Google Drive to automatically back up your gear, settings, and recipes. Your data stays private in your own Drive.
                </p>
              </div>
              <button
                onClick={onGoogleSignIn}
                className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg hover:scale-[1.02] active:scale-95 transition-all ${styles.button}`}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign in with Google
              </button>
            </div>
          ) : (
            <>
              <p className={`text-sm leading-relaxed ${styles.muted}`}>
                {mode === 'setup' 
                  ? "Select which categories you want to automatically back up to your Google Drive. You can change this later."
                  : mode === 'backup'
                  ? "Select which categories you want to backup to your Google Drive right now."
                  : "Select which categories you want to restore from your Google Drive right now."}
              </p>

              <div id="cloud-sync-preferences" className="space-y-3">
                <button 
                  onClick={() => togglePref('gear')}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${prefs.gear ? styles.itemActive : styles.itemInactive}`}
                >
                  <div className="flex items-center gap-3">
                    <Box className="w-5 h-5" />
                    <div className="text-left">
                      <p className="text-sm font-bold uppercase tracking-wider">Gear Rack Library</p>
                      <p className={`text-[10px] ${styles.muted}`}>Plugins, hardware, and starred items</p>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${prefs.gear ? styles.check : styles.checkEmpty}`}>
                    {prefs.gear && <Check className="w-3 h-3" />}
                  </div>
                </button>

                <button 
                  onClick={() => togglePref('settings')}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${prefs.settings ? styles.itemActive : styles.itemInactive}`}
                >
                  <div className="flex items-center gap-3">
                    <Settings className="w-5 h-5" />
                    <div className="text-left">
                      <p className="text-sm font-bold uppercase tracking-wider">UI Settings</p>
                      <p className={`text-[10px] ${styles.muted}`}>Themes, styles, and preferences</p>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${prefs.settings ? styles.check : styles.checkEmpty}`}>
                    {prefs.settings && <Check className="w-3 h-3" />}
                  </div>
                </button>

                <button 
                  onClick={() => togglePref('recipes')}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${prefs.recipes ? styles.itemActive : styles.itemInactive}`}
                >
                  <div className="flex items-center gap-3">
                    <Music className="w-5 h-5" />
                    <div className="text-left">
                      <p className="text-sm font-bold uppercase tracking-wider">Saved Recipes</p>
                      <p className={`text-[10px] ${styles.muted}`}>Beats, MIDI files, and loops</p>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${prefs.recipes ? styles.check : styles.checkEmpty}`}>
                    {prefs.recipes && <Check className="w-3 h-3" />}
                  </div>
                </button>

                <button 
                  onClick={() => togglePref('critiques')}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${prefs.critiques ? styles.itemActive : styles.itemInactive}`}
                >
                  <div className="flex items-center gap-3">
                    <Save className="w-5 h-5" />
                    <div className="text-left">
                      <p className="text-sm font-bold uppercase tracking-wider">Saved Critiques</p>
                      <p className={`text-[10px] ${styles.muted}`}>Mix reviews and action plans</p>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${prefs.critiques ? styles.check : styles.checkEmpty}`}>
                    {prefs.critiques && <Check className="w-3 h-3" />}
                  </div>
                </button>
              </div>
            </>
          )}
        </div>

        {user && (
          <div className={`p-4 border-t border-current/10 flex gap-3 justify-end ${styles.iconBg}`}>
            {mode === 'setup' ? (
              <button
                onClick={() => onSavePreferences?.(prefs)}
                disabled={isProcessing}
                className={`px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2 ${styles.button}`}
              >
                <Save className="w-4 h-4" />
                {isProcessing ? "Saving..." : "Save Preferences"}
              </button>
            ) : mode === 'restore' ? (
              <button
                onClick={() => onManualAction?.('restore', prefs)}
                disabled={isProcessing || (!prefs.gear && !prefs.settings && !prefs.recipes && !prefs.critiques)}
                className={`px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2 ${styles.button}`}
              >
                <CloudDownload className="w-4 h-4" />
                {isProcessing ? "Processing..." : "Restore Selected"}
              </button>
            ) : (
              <button
                onClick={() => onManualAction?.('backup', prefs)}
                disabled={isProcessing || (!prefs.gear && !prefs.settings && !prefs.recipes && !prefs.critiques)}
                className={`px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2 ${styles.button}`}
              >
                <CloudUpload className="w-4 h-4" />
                {isProcessing ? "Processing..." : "Backup Selected"}
              </button>
            )}
          </div>
        )}
      </div>
      </div>
    </div>
  );
};
