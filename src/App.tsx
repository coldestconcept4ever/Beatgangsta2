
// Sync Trigger: 2026-03-24 00:19:30
import React, { useState, useMemo, useEffect, useRef, useCallback, Suspense } from 'react';
import { VSTPlugin, BeatRecipe, AppTheme, User, SavedRecipe, HistoryItem, Folder, KnifeStyle, PendantStyle, ChainStyle, SharedSession, DuragStyle, Hardware, FullSaveFile, GrillStyle, MixCritique, SavedCritique, TutorialProgress } from './types';
import { VIBE_EXAMPLES, SONG_EXAMPLES } from './constants';
import { getBeatRecommendations, getCustomBeatRecommendations, getSongBeatRecommendations, getAudioBeatRecommendations, enrichPluginLibrary, validateApiKey, detectAPITier, replicateRecipeWithUserGear, getMixCritique, ThinkingLevel } from './services/geminiService';
import { processAudioForAnalysis } from './utils/audioUtils';
import { enrichHardware } from './services/enrichmentService';

import { AvianField } from './components/RavenField';
import { Logo } from './components/Logo';
import { DownloadableLogoText } from './components/DownloadableLogoText';
import { CigarIcon } from './components/Icons';

const PluginCard = React.lazy(() => import('./components/PluginCard').then(m => ({ default: m.PluginCard })));
const HardwareCard = React.lazy(() => import('./components/HardwareCard').then(m => ({ default: m.HardwareCard })));

// Lazy load modals
const CookieConsent = React.lazy(() => import('./components/modals/CookieConsent').then(m => ({ default: m.CookieConsent })));
const CookiePolicy = React.lazy(() => import('./components/modals/CookiePolicy').then(m => ({ default: m.CookiePolicy })));
const ContactForm = React.lazy(() => import('./components/modals/ContactForm').then(m => ({ default: m.ContactForm })));
const ApiKeyIntroModal = React.lazy(() => import('./components/modals/ApiKeyModals').then(m => ({ default: m.ApiKeyIntroModal })));
const ApiKeyInputModal = React.lazy(() => import('./components/modals/ApiKeyModals').then(m => ({ default: m.ApiKeyInputModal })));
const ApiKeyInstructionsModal = React.lazy(() => import('./components/modals/ApiKeyModals').then(m => ({ default: m.ApiKeyInstructionsModal })));
const ImportDecisionModal = React.lazy(() => import('./components/modals/ImportModals').then(m => ({ default: m.ImportDecisionModal })));
const BackupRestored = React.lazy(() => import('./components/modals/ImportModals').then(m => ({ default: m.BackupRestored })));
const RecipeCard = React.lazy(() => import('./components/RecipeCard').then(m => ({ default: m.RecipeCard })));
const CritiqueCard = React.lazy(() => import('./components/CritiqueCard').then(m => ({ default: m.CritiqueCard })));
const Mascot = React.lazy(() => import('./components/Mascot').then(m => ({ default: m.Mascot })));

const DAWGuide = React.lazy(() => import('./components/DAWGuide').then(m => ({ default: m.DAWGuide })));
const Vault = React.lazy(() => import('./components/Vault').then(m => ({ default: m.Vault })));
const LeprechaunField = React.lazy(() => import('./components/LeprechaunField').then(m => ({ default: m.LeprechaunField })));

const CustomColorWheel = React.lazy(() => import('./components/CustomColorWheel').then(m => ({ default: m.CustomColorWheel })));
const SnowFlurry = React.lazy(() => import('./components/SnowFlurry').then(m => ({ default: m.SnowFlurry })));

import type { TutorialStep } from './components/TutorialOverlay';

const CollaborationModal = React.lazy(() => import('./components/CollaborationModal').then(m => ({ default: m.CollaborationModal })));
const FriendsInfoModal = React.lazy(() => import('./components/FriendsInfoModal').then(m => ({ default: m.FriendsInfoModal })));
const AnalogEquipmentModal = React.lazy(() => import('./components/AnalogEquipmentModal').then(m => ({ default: m.AnalogEquipmentModal })));
const DawSelectionModal = React.lazy(() => import('./components/DawSelectionModal').then(m => ({ default: m.DawSelectionModal })));
const TrashModal = React.lazy(() => import('./components/TrashModal').then(m => ({ default: m.TrashModal })));
const RigManagerModal = React.lazy(() => import('./components/RigManagerModal').then(m => ({ default: m.RigManagerModal })));
const DrumKitModal = React.lazy(() => import('./components/DrumKitModal').then(m => ({ default: m.DrumKitModal })));
const CloudSyncModal = React.lazy(() => import('./components/CloudSyncModal').then(m => ({ default: m.CloudSyncModal })));
const RestoreBackupModal = React.lazy(() => import('./components/RestoreBackupModal').then(m => ({ default: m.RestoreBackupModal })));
const LegalConsentBanner = React.lazy(() => import('./components/LegalConsentBanner').then(m => ({ default: m.LegalConsentBanner })));
const RecipeViewerModal = React.lazy(() => import('./components/RecipeViewerModal').then(m => ({ default: m.RecipeViewerModal })));
const TutorialOverlay = React.lazy(() => import('./components/TutorialOverlay').then(m => ({ default: m.TutorialOverlay })));
import { AnimatePresence, motion } from 'motion/react';
import { Star, X, Cpu, Folder as FolderIcon, ShieldCheck, Check, Zap, Rocket, Eye, EyeOff, AlertTriangle, Info, Lock, Shield, Loader2, Gem, Sword, User as UserIcon, Link, Link2, Palette, Sparkles, Drum, Image as ImageIcon, Crown, CheckCircle2, ExternalLink, Facebook, Instagram, Linkedin, Twitter } from 'lucide-react';
import tinycolor from 'tinycolor2';
import Turnstile from 'react-turnstile';


const App: React.FC = () => {
  const [userApiKey, setUserApiKey] = useState(() => {
    const key = localStorage.getItem('bg_user_api_key');
    if (key === 'undefined' || key === 'null' || !key) return '';
    return key;
  });
  const [apiTier, setApiTier] = useState<'TIER_1' | 'FREE'>(() => {
    const tier = localStorage.getItem('bg_api_tier');
    return (tier as 'TIER_1' | 'FREE') || 'FREE';
  });

  useEffect(() => {
    const checkTier = async () => {
      const key = localStorage.getItem('bg_user_api_key');
      const tier = localStorage.getItem('bg_api_tier');
      if (key && key !== 'undefined' && key !== 'null' && !tier) {
        const detected = await detectAPITier(key);
        localStorage.setItem('bg_api_tier', detected);
        setApiTier(detected);
      }
    };
    checkTier();
  }, [userApiKey]);

  const [showRigUI, setShowRigUI] = useState(false);
  const [showBrandMenu, setShowBrandMenu] = useState(false);
  const [showFriendsInfo, setShowFriendsInfo] = useState(false);
  const [showModeInfo, setShowModeInfo] = useState(false);
  const [showCookieConsent, setShowCookieConsent] = useState(() => {
    // Check for Global Privacy Control (GPC) signal
    // @ts-ignore - navigator.globalPrivacyControl is a non-standard but widely used property
    if (typeof navigator !== 'undefined' && (navigator.globalPrivacyControl === '1' || navigator.globalPrivacyControl === true)) {
      return false; // Hide banner if GPC is active
    }
    return localStorage.getItem('bg_cookie_consent') !== 'true' && localStorage.getItem('bg_cookie_consent') !== 'false';
  });
  const [backupInfo, setBackupInfo] = useState<{ hasBackup: boolean; backupDate?: string } | null>(null);
  const [showCookiePolicy, setShowCookiePolicy] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);

  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/privacy' || path === '/privacy/') {
      window.location.replace('https://www.beatgangsta.com/privacy');
    } else if (path === '/terms' || path === '/terms/') {
      window.location.replace('https://www.beatgangsta.com/terms');
    } else if (path === '/cookies' || path === '/cookies/') {
      setShowCookiePolicy(true);
    }
  }, []);

  const [activeUI] = useState(() => {
    try {
      const saved = localStorage.getItem('bg_active_ui');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error("Failed to parse active UI settings", e);
      return null;
    }
  });

  const [tutorialProgress, setTutorialProgress] = useState<TutorialProgress | null>(() => {
    try {
      const saved = localStorage.getItem('bg_tutorial_progress');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [showWelcomeSplash, setShowWelcomeSplash] = useState<'back' | 'new' | null>(null);

  useEffect(() => {
    if (showWelcomeSplash) {
      const timer = setTimeout(() => {
        setShowWelcomeSplash(null);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [showWelcomeSplash]);

  const saveTutorialProgress = async (progress: TutorialProgress) => {
    setTutorialProgress(progress);
    localStorage.setItem('bg_tutorial_progress', JSON.stringify(progress));
    
    if (user) {
      try {
        await fetch('/api/cloud/tutorial-progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ progress })
        });
      } catch (err) {
        console.error("Failed to sync tutorial progress to cloud", err);
      }
    }
  };

  const loadTutorialProgressFromCloud = useCallback(async (showSplash = false) => {
    if (!userRef.current) return;
    
    try {
      const res = await fetch('/api/cloud/tutorial-progress');
      if (res.ok) {
        const { data } = await res.json();
        if (data) {
          setTutorialProgress(data);
          localStorage.setItem('bg_tutorial_progress', JSON.stringify(data));
          
          // Determine if we should show splash and where to start
          if (data.isFullyCompleted) {
            if (showSplash) setShowWelcomeSplash('back');
            setTutorialPhase('done');
            localStorage.setItem('bg_tutorial_completed', 'true');
          } else {
            if (showSplash) setShowWelcomeSplash('back');
            setTutorialPhase(data.currentPhase);
            setTutorialStep(data.currentStep);
            setShowTutorial(true);
          }
        } else {
          if (showSplash) setShowWelcomeSplash('new');
        }
      }
    } catch (err) {
      console.error("Failed to load tutorial progress from cloud", err);
    }
  }, []);

  const [isGangstaVox, setIsGangstaVox] = useState<boolean>(false);
  const [csvInput, setCsvInput] = useState<string>('');
  const [plugins, setPlugins] = useState<VSTPlugin[]>(() => {
    try {
      const saved = localStorage.getItem('bg_library');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [starredPlugins, setStarredPlugins] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('bg_starred_plugins');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [sortBy, setSortBy] = useState<'name' | 'vendor' | 'type'>('type');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [folderToRemove, setFolderToRemove] = useState<string | null>(null);
  const [deletedPlugins, setDeletedPlugins] = useState<VSTPlugin[]>(() => {
    const saved = localStorage.getItem('bg_deleted_plugins');
    return saved ? JSON.parse(saved) : [];
  });
  const [pendingPlaceholders, setPendingPlaceholders] = useState<any[]>([]);
  const deletionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [showTrashModal, setShowTrashModal] = useState(false);
  
  // Handle Global Privacy Control (GPC)
  useEffect(() => {
    // @ts-ignore
    if (typeof navigator !== 'undefined' && (navigator.globalPrivacyControl === '1' || navigator.globalPrivacyControl === true)) {
      if (localStorage.getItem('bg_cookie_consent') !== 'false') {
        localStorage.setItem('bg_cookie_consent', 'false');
        console.log('GPC Signal detected: Automatically opted out of non-essential tracking.');
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('bg_library', JSON.stringify(plugins));
  }, [plugins]);

  useEffect(() => {
    localStorage.setItem('bg_deleted_plugins', JSON.stringify(deletedPlugins));
  }, [deletedPlugins]);

  const resetDeletionTimer = () => {
    if (deletionTimerRef.current) clearTimeout(deletionTimerRef.current);
    deletionTimerRef.current = setTimeout(() => {
      setPendingPlaceholders([]);
    }, 12000);
  };

  const handleUndo = (placeholderId: string) => {
    const placeholder = pendingPlaceholders.find(p => p.id === placeholderId);
    if (!placeholder) return;

    // Remove from deletedPlugins
    setDeletedPlugins(prev => prev.filter(dp => !placeholder.plugins.some((p: any) => p.name === dp.name && p.vendor === dp.vendor)));
    
    // Add back to plugins
    setPlugins(prev => [...prev, ...placeholder.plugins]);
    
    // Remove placeholder
    setPendingPlaceholders(prev => prev.filter(p => p.id !== placeholderId));
  };
  const [recipes, setRecipes] = useState<BeatRecipe[]>([]);
  const [critiques, setCritiques] = useState<MixCritique[]>([]);
  const [audioMode, setAudioMode] = useState<'recipe' | 'critique'>('recipe');
  const [hasStems, setHasStems] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [thinkingLevel, setThinkingLevel] = useState<ThinkingLevel>(() => {
    const saved = localStorage.getItem('bg_thinking_level');
    return (saved as ThinkingLevel) || ThinkingLevel.HIGH;
  });

  useEffect(() => {
    localStorage.setItem('bg_thinking_level', thinkingLevel);
  }, [thinkingLevel]);

  const [tutorialPhase, setTutorialPhase] = useState<string>(() => {
    const completed = localStorage.getItem('bg_tutorial_completed');
    if (completed) return 'done';
    return 'init';
  });
  const tutorialPhaseRef = useRef(tutorialPhase);
  useEffect(() => { tutorialPhaseRef.current = tutorialPhase; }, [tutorialPhase]);
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const showTutorialRef = useRef(showTutorial);
  useEffect(() => { showTutorialRef.current = showTutorial; }, [showTutorial]);

  const [isCloudflareVerified, setIsCloudflareVerified] = useState(false);
  const [cloudflareVerificationCount, setCloudflareVerificationCount] = useState(0);
  const [showCloudflareModal, setShowCloudflareModal] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);

  useEffect(() => {
    if (showTutorial && tutorialPhase !== 'done') {
      saveTutorialProgress({
        completedPhases: [],
        currentPhase: tutorialPhase,
        currentStep: tutorialStep,
        lastUpdated: new Date().toISOString(),
        isFullyCompleted: false
      });
    } else if (tutorialPhase === 'done') {
      saveTutorialProgress({
        completedPhases: [],
        currentPhase: 'done',
        currentStep: 0,
        lastUpdated: new Date().toISOString(),
        isFullyCompleted: true
      });
    }
  }, [tutorialPhase, tutorialStep, showTutorial]);
  const [isVerified, setIsVerified] = useState(false);
  const [verificationSessionId, setVerificationSessionId] = useState(0);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const [showConsentModal, setShowConsentModal] = useState(false);
  const [isCheckingTerms, setIsCheckingTerms] = useState(false);
  const [isSavingConsent, setIsSavingConsent] = useState(false);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(() => {
    if (localStorage.getItem('bg_terms_accepted') === 'true') return true;
    try {
      const savedUser = localStorage.getItem('bg_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed.termsAccepted) return true;
      }
    } catch (e) {}
    return localStorage.getItem('bg_pending_consent') === 'true';
  });

  const handleAcceptTerms = async () => {
    if (user) {
      // User is already signed in, update consent in Turso
      try {
        setIsSavingConsent(true);
        const res = await fetch('/api/auth/accept-terms', { method: 'POST' });
        if (res.ok) {
          const updatedUser = { ...user, termsAccepted: true };
          setUser(updatedUser);
          localStorage.setItem('bg_user', JSON.stringify(updatedUser));
          localStorage.setItem('bg_terms_accepted', 'true');
          setShowConsentModal(false);
          setHasAcceptedTerms(true);
        } else {
          console.error("Failed to save consent: Server returned non-ok status");
          setError("Failed to save consent. Please try again.");
        }
      } catch (err) {
        console.error("Failed to save consent: Exception", err);
        setError("Failed to save consent. Please try again.");
      } finally {
        setIsSavingConsent(false);
      }
    } else {
      // User is not signed in yet, store consent in localStorage
      console.log("User consented before sign-in, storing in localStorage");
      localStorage.setItem('bg_pending_consent', 'true');
      setHasAcceptedTerms(true);
      setShowConsentModal(false);
    }
  };

  const startGoogleSignIn = async () => {
    try {
      const response = await fetch('/api/auth/google/url');
      if (!response.ok) {
        let errorMsg = `Failed to get auth URL (Status: ${response.status})`;
        const contentType = response.headers.get("content-type");
        
        if (contentType && contentType.includes("application/json")) {
          try {
            const errorData = await response.json();
            if (errorData.error) {
              errorMsg = errorData.error;
              if (errorData.details) {
                console.error("Auth URL error details:", errorData.details);
              }
            }
          } catch (e) {
            console.error("Error parsing JSON error response:", e);
          }
        } else {
          const text = await response.text();
          console.error("Non-JSON error response from /api/auth/google/url:", text);
          if (text.length < 100) errorMsg += `: ${text}`;
        }
        throw new Error(errorMsg);
      }
      const { url } = await response.json();
      console.log("[AUTH DEBUG] Received Auth URL from backend:", url.replace(/client_id=[^&]+/, "client_id=MASKED"));
      
      if (!url.includes('state=')) {
        console.error("[AUTH ERROR] State parameter MISSING from URL received from backend!");
      }
      
      const authWindow = window.open(
        url,
        'oauth_popup',
        'width=600,height=700'
      );
      
      if (!authWindow) {
        alert('Please allow popups for this site to connect your account.');
      }
    } catch (err: any) {
      setError(err.message || "Failed to start Google Sign In.");
    }
  };

  const requireAuth = () => {
    if (!user) {
      setError("Please sign in with Google to use AI features.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return false;
    }
    if (!hasAcceptedTerms) {
      setShowConsentModal(true);
      return false;
    }
    return true;
  };

  const handleGoogleSignIn = async () => {
    await startGoogleSignIn();
  };

  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('bg_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [isInitialUser] = useState(!!localStorage.getItem('bg_user'));
  const [justSignedIn, setJustSignedIn] = useState(false);
  const userRef = useRef<User | null>(user);
  const justSignedInRef = useRef(justSignedIn);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    justSignedInRef.current = justSignedIn;
  }, [justSignedIn]);

  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [cloudDriveUrl, setCloudDriveUrl] = useState<string | null>(() => {
    return localStorage.getItem('bg_cloud_drive_url');
  });
  const [cloudDriveError, setCloudDriveError] = useState<boolean>(false);
  const [showCloudSyncModal, setShowCloudSyncModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [cloudSyncMode, setCloudSyncMode] = useState<'setup' | 'backup' | 'restore'>('setup');
  const [wasCloudSyncModalShown, setWasCloudSyncModalShown] = useState(false);
  const [isEnrichingLibrary, setIsEnrichingLibrary] = useState(false);
  const [tutorialPlugin, setTutorialPlugin] = useState<VSTPlugin | null>(null);
  const [tutorialFolder, setTutorialFolder] = useState<string | null>(null);
  const [showApiKeyIntro, setShowApiKeyIntro] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const _d = (s: string) => atob(s);
  const [m_act, setM_act] = useState(() => localStorage.getItem('_mv') === 'true');
  const [e_act, setE_act] = useState(() => localStorage.getItem('_ev') === 'true');
  const [c_act, setC_act] = useState(() => localStorage.getItem('_cv') === 'true');
  const [showFairy, setShowFairy] = useState(false);
  const [showChefUnlockPopup, setShowChefUnlockPopup] = useState(false);
  const [currentVibeExample, setCurrentVibeExample] = useState(VIBE_EXAMPLES[0]);
  const [currentSongExamples, setCurrentSongExamples] = useState([SONG_EXAMPLES[0], SONG_EXAMPLES[1]]);

  const handleCloudflareVerify = async (token: string) => {
    try {
      const response = await fetch('/api/verify-turnstile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 'cf-turnstile-response': token }),
      });
      
      if (response.ok) {
        setIsVerified(true);
        setIsCloudflareVerified(true);
        setCloudflareVerificationCount(prev => prev + 1);
        setTimeout(() => {
          setShowCloudflareModal(false);
          setIsCloudflareVerified(false);
          if (tutorialPhase === 'cloudflare_1') {
            setTutorialPhase('init');
            // If we were on Verification, and it's now gone, index 1 is Sign In.
            setTutorialStep(1); 
            setShowTutorial(true);
          } else if (tutorialPhase === 'cloudflare_2') {
            setTutorialPhase('done');
            localStorage.setItem('bg_tutorial_completed', 'true');
            setShowTutorial(false);
          }
        }, 1500);
      } else {
        const data = await response.json().catch(() => ({}));
        setError(data.error || "Verification failed. Please try again.");
      }
    } catch (err) {
      console.error("Verification error:", err);
      setError("Verification error. Please try again.");
    }
  };

  useEffect(() => {
    if (showTutorial) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showTutorial]);

  useEffect(() => {
    if (showTutorial) {
      // No-op
    }
  }, [showTutorial]);

  const activeTutorialSteps = useMemo(() => {
    const addTurnstileStep = (steps: TutorialStep[]) => {
      if (isVerified) return;
      steps.push({
        targetId: 'tutorial-turnstile-widget',
        title: 'Security Verification',
        content: 'Before we continue, we need to verify you are a human. This helps us prevent bot abuse and keep the AI fast for everyone. Please complete the Cloudflare verification here.',
        placement: 'bottom' as const,
        requireAction: !isVerified,
        allowInteraction: true,
        onEnter: () => {
          if (!isVerified) {
            setShowCloudflareModal(true);
          }
        },
        onNext: () => {
          if (isVerified) {
            setShowCloudflareModal(false);
          }
        }
      });
    };

    if (tutorialPhase === 'init') {
      const steps: TutorialStep[] = [];

      steps.push({
        targetId: 'tutorial-welcome',
        title: 'Welcome to BeatGangsta 🎹',
        content: 'This is your AI production assistant. Let me show you around the studio so you can start dropping some sub-zero vibes.',
        placement: 'center' as const
      });

      addTurnstileStep(steps);

      if (!hasAcceptedTerms) {
        steps.push({
          targetId: 'legal-consent-banner',
          title: 'Terms of Service',
          content: 'Please accept our Terms of Service and Privacy Policy to continue.',
          placement: 'top' as const,
          requireAction: true,
          allowInteraction: true,
          isHighlighted: true,
          onEnter: () => {
            setShowConsentModal(true);
          }
        });
      }

      if (!user && localStorage.getItem('bg_skip_auth') !== 'true') {
        steps.push({
          targetId: 'btn-google-signin',
          title: 'Sign In',
          content: 'First, let\'s sign in to Google to save your gear and recipes to the cloud. You\'ll be asked to agree to our terms first. Click the button to continue. Note: Google Drive stores important application data (like your gear and tutorial progress) in your Google Drive.',
          placement: 'bottom' as const,
          requireAction: true,
          allowInteraction: true
        });
      }

      return steps;
    }
    if (tutorialPhase === 'cloud_sync') {
      const steps: TutorialStep[] = [];
      
      if (backupInfo?.hasBackup) {
        steps.push({
          targetId: 'modal-cloud-sync',
          title: 'Restore Backup?',
          content: `We found a backup from ${new Date(backupInfo.backupDate!).toLocaleDateString()}. Would you like to restore it?`,
          placement: 'top' as const,
          requireAction: true,
          allowInteraction: true,
          onEnter: () => setShowRestoreModal(true)
        });
      } else {
        steps.push({
          targetId: 'modal-cloud-sync',
          title: 'Cloud Sync',
          content: 'Choose what data you want to backup to Google Drive. You can select "None" to only save data locally in your browser.',
          placement: 'top' as const,
          requireAction: true,
          allowInteraction: true,
          onEnter: () => {
            setCloudSyncMode('setup');
            setShowCloudSyncModal(true);
          }
        });
      }
      
      return steps;
    }
    if (tutorialPhase === 'import') {
      const steps: TutorialStep[] = [];
      steps.push(
        {
          targetId: 'dropzone-audio',
          title: 'Upload Files',
          content: 'Now, upload your plugin files here.',
          placement: 'top' as const,
          requireAction: true,
          allowInteraction: true
        },
        {
          targetId: 'dropzone-plugin-import',
          title: 'Import Plugins',
          content: 'This is where you\'ll import your plugin list. Drag and drop your file here.',
          placement: 'bottom' as const,
          allowInteraction: true
        },
        {
          targetId: 'btn-help',
          title: 'Need Help?',
          content: 'Click here to read the guide on how to find and export your plugin list from your DAW.',
          placement: 'bottom' as const,
          allowInteraction: true
        }
      );
      return steps;
    }
    if (tutorialPhase === 'api_key') {
      const steps: TutorialStep[] = [];
      steps.push(
        {
          targetId: 'modal-api-key-intro',
          title: 'API Key Required',
          content: 'To analyze your plugins, you need a Gemini API key. It\'s free! Click Continue to get started.',
          placement: 'left' as const,
          requireAction: true,
          allowInteraction: true
        },
        {
          targetId: 'modal-api-key',
          title: 'Enter Your Key',
          content: 'Follow the instructions to get your key and paste it here.',
          placement: 'left' as const,
          requireAction: true,
          allowInteraction: true
        }
      );
      return steps;
    }
    if (tutorialPhase === 'library_populated') {
      const steps: TutorialStep[] = [];
      addTurnstileStep(steps);
      steps.push(
        {
          targetId: 'section-gear-rack',
          title: 'Your Gear Rack',
          content: 'Your Gear Rack is populated with your plugins! We automatically research each plugin to understand its unique sound character, features, and optimal use cases for your recipes.',
          placement: 'bottom' as const,
          onEnter: () => {
            if (!tutorialPlugin && plugins.length > 0) {
              const randomPlugin = plugins[Math.floor(Math.random() * plugins.length)];
              setTutorialPlugin(randomPlugin);
              const folder = sortBy === 'vendor' ? randomPlugin.vendor : randomPlugin.type;
              setTutorialFolder(folder);
              setSelectedFolder(folder);
            }
          }
        },
        {
          targetId: tutorialPlugin ? `plugin-card-${tutorialPlugin.name.replace(/\s+/g, '-').toLowerCase()}` : 'plugin-card-serum',
          title: 'Starred Plugins',
          content: 'Here is an example of a plugin card in your Gear Rack. You can star plugins to add them to your Priority Bar. Starred plugins are prioritized in all recipe search results, ensuring you get the sounds you love!',
          placement: 'bottom' as const,
          isHighlighted: true,
          onEnter: () => {
            if (tutorialPlugin && !starredPlugins.includes(tutorialPlugin.name)) {
              setStarredPlugins(prev => [...prev, tutorialPlugin.name]);
            }
          }
        },
        {
          targetId: 'priority-bar',
          title: 'Priority Bar',
          content: 'This is where your starred plugins appear. We prioritize these in all recipe search results to ensure you get the sounds you love.',
          placement: 'bottom' as const,
          onNext: () => {
            if (tutorialPlugin) {
              setStarredPlugins(prev => prev.filter(name => name !== tutorialPlugin.name));
            }
          }
        },
        {
          targetId: 'btn-rig',
          title: 'Rig Manager',
          content: 'Here you can import/export your entire setup, backup to the cloud, and manage your gear.',
          placement: 'bottom' as const
        },
        {
          targetId: 'btn-menu',
          title: 'Drop-down Menu',
          content: 'This is your drop-down menu. Click here to change themes, customize your avatar, and access your account settings.',
          placement: 'bottom' as const,
          allowInteraction: false,
          onEnter: () => setShowBrandMenu(true),
          onNext: () => setShowBrandMenu(false)
        },
        {
          targetId: 'btn-mode-beatgangsta',
          title: 'BeatGangsta Mode',
          content: 'Use this mode to generate beat recipes based on your favorite artists and vibes.',
          placement: 'bottom' as const
        },
        {
          targetId: 'btn-mode-gangstavox',
          title: 'GangstaVox Mode',
          content: 'Switch to this mode when you need vocal FX chains for your tracks.',
          placement: 'bottom' as const
        },
        {
          targetId: 'input-vibe-search',
          title: 'Vibe Search',
          content: 'Ready to freeze? Enter an artist, genre, or vibe here to get a custom plugin recipe.',
          placement: 'top' as const
        },
        {
          targetId: 'input-song-search',
          title: 'Song Search',
          content: 'Or enter a specific song to get the exact recipe they used.',
          placement: 'top' as const
        }
      );

      steps.push({
        targetId: 'btn-audio-recipe',
        title: _d('RXh0cmFjdCBSZWNpcGU='),
        content: _d('TWFzdGVyIE1vZGUgdW5sb2NrZWQhIERyb3AgYW4gTVAzIGhlcmUgdG8gaGF2ZSB0aGUgQUkgYW5hbHl6ZSB0aGUgYXVkaW8gYW5kIGV4dHJhY3QgdGhlIGV4YWN0IHBsdWdpbiByZWNpcGUgdXNlZCB0byBhY2hpZXZlIHRoYXQgc291bmQu'),
        placement: 'top' as const
      });
      steps.push({
        targetId: 'btn-audio-critique',
        title: _d('TWl4IENyaXRpcXVl'),
        content: _d('TWFzdGVyIE1vZGUgdW5sb2NrZWQhIERyb3AgeW91ciBtaXggaGVyZSBmb3IgYSBwcm9mZXNzaW9uYWwtZ3JhZGUgY3JpdGlxdWUsIGlkZW50aWZ5aW5nIGFyZWFzIGZvciBpbXByb3ZlbWVudCBpbiB5b3VyIGJhbGFuY2UsIEVRLCBhbmQgY29tcHJlc3Npb24u'),
        placement: 'top' as const
      });

      return steps;
    }
    if (tutorialPhase === 'first_recipe') {
      const steps: TutorialStep[] = [
        {
          targetId: 'recipe-card-0',
          title: 'Your First Recipe!',
          content: 'Here\'s your custom recipe. You can star it to save it to your Vault, or click it to view the full details.',
          placement: 'bottom' as const
        },
        {
          targetId: 'btn-export-pdf',
          title: 'Save to PDF',
          content: 'Click here to save this recipe as a PDF for easy reference.',
          placement: 'bottom' as const
        },
        {
          targetId: 'btn-save-recipe',
          title: 'Add to Vault',
          content: 'Click here to save this recipe to your Vault. Your Vault keeps all your favorite recipes in one place.',
          placement: 'bottom' as const
        },
        {
          targetId: 'btn-vault',
          title: 'The Vault',
          content: 'This is your Vault. Open it to see your saved recipes and mix critiques.',
          placement: 'bottom' as const,
          requireAction: true,
          allowInteraction: true
        },
        {
          targetId: 'btn-close-vault',
          title: 'Close Vault',
          content: 'You can explore this later. Click here to close the Vault and continue the tour.',
          placement: 'bottom' as const,
          requireAction: true,
          allowInteraction: true
        }
      ];

      addTurnstileStep(steps);

      steps.push({
        targetId: 'btn-audio-recipe',
        title: _d('RXh0cmFjdCBSZWNpcGU='),
        content: _d('RHJvcCBhbiBNUDMgaGVyZSB0byBleHRyYWN0IHRoZSBwbHVnaW4gcmVjaXBlIHVzZWQgaW4gdGhlIHRyYWNrLg=='),
        placement: 'top' as const
      });
      steps.push({
        targetId: 'btn-audio-critique',
        title: _d('TWl4IENyaXRpcXVl'),
        content: _d('RHJvcCBhbiBNUDMgaGVyZSB0byBnZXQgYSBwcm9mZXNzaW9uYWwgY3JpdGlxdWUgb2YgeW91ciBtaXgu'),
        placement: 'top' as const
      });

      steps.push({
        targetId: 'tutorial-welcome',
        title: 'Ready to Cook?',
        content: 'You\'re locked and loaded. Start searching, drop those vibes, and let\'s make some heat. Let\'s go!',
        placement: 'center' as const
      });

      return steps;
    }
    return [];
  }, [tutorialPhase, isVerified, user, showCloudSyncModal, showApiKeyIntro, pendingFile, isEnrichingLibrary, plugins.length, recipes.length, sortBy, m_act, showConsentModal, hasAcceptedTerms, tutorialPlugin]);
  
  useEffect(() => {
    if (showTutorial && activeTutorialSteps.length > 0 && tutorialStep >= activeTutorialSteps.length) {
      setTutorialStep(activeTutorialSteps.length - 1);
    }
    // Removed the aggressive exit logic
  }, [activeTutorialSteps.length, tutorialStep, showTutorial]);

  const handleNextTutorialStep = () => {
    if (tutorialPhase === 'library_populated' && tutorialStep === activeTutorialSteps.length - 1) {
      if (isVerified) {
        setTutorialPhase('done');
        localStorage.setItem('bg_tutorial_completed', 'true');
        setShowTutorial(false);
        return;
      }
      setTutorialPhase('cloudflare_2');
      setShowTutorial(false);
      setShowCloudflareModal(true);
      return;
    }

    if (tutorialStep < activeTutorialSteps.length - 1) {
      setTutorialStep(prev => prev + 1);
    } else {
      setShowTutorial(false);
      if (tutorialPhase === 'first_recipe') {
        setTutorialPhase('done');
        localStorage.setItem('bg_tutorial_completed', 'true');
      }
    }
  };

  const handleCompleteTutorial = () => {
    setShowTutorial(false);
    setTutorialPhase('done');
    localStorage.setItem('bg_tutorial_completed', 'true');
  };

  const handleResetLibrary = () => {
    setPlugins([]);
    localStorage.removeItem('bg_plugins');
    localStorage.removeItem('bg_deleted_plugins');
    localStorage.removeItem('bg_starred_plugins');
    setStarredPlugins([]);
    setDeletedPlugins([]);
    window.location.reload(); // Reload to clear all states and start fresh
  };

  const [enrichProgress, setEnrichProgress] = useState(0);
  const [enrichEta, setEnrichEta] = useState(0);
  const [enrichStatus, setEnrichStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [typeBeatSearch, setTypeBeatSearch] = useState<string>('');
  const [songSearch, setSongSearch] = useState<string>('');
  const [audioAnalysisLoading, setAudioAnalysisLoading] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationEta, setGenerationEta] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [grillStyle, setGrillStyle] = useState<GrillStyle>(activeUI?.grillStyle || 'diamond');
  const [knifeStyle, setKnifeStyle] = useState<KnifeStyle>(activeUI?.knifeStyle || 'standard');
  const [duragStyle, setDuragStyle] = useState<DuragStyle>(activeUI?.duragStyle || 'standard');
  const [pendantStyle, setPendantStyle] = useState<PendantStyle>(activeUI?.pendantStyle || 'silver');
  const [chainStyle, setChainStyle] = useState<ChainStyle>(activeUI?.chainStyle || 'silver');
  const [theme, setTheme] = useState<AppTheme>(activeUI?.theme || 'coldest');
  const [saberColor, setSaberColor] = useState<string>(activeUI?.saberColor || '#a855f7'); 
  const [mascotColor, setMascotColor] = useState<string>(activeUI?.mascotColor || '#3b82f6');
  const [showSaberPicker, setShowSaberPicker] = useState(false);
  const [showMascotColorPicker, setShowMascotColorPicker] = useState(false);
  const [showChain, setShowChain] = useState(activeUI?.showChain ?? false);
  const [highEyes, setHighEyes] = useState(activeUI?.highEyes ?? false);
  const [isCigarEquipped, setIsCigarEquipped] = useState(activeUI?.isCigarEquipped ?? false);
  const [isTossingCigar, setIsTossingCigar] = useState(activeUI?.isTossingCigar ?? false);
  const [showSparkles, setShowSparkles] = useState(activeUI?.showSparkles ?? false);
  const [hasUnlockedBluntToggle, setHasUnlockedBluntToggle] = useState(false);
  const [showDawModal, setShowDawModal] = useState(false);
  const [dawModalSource, setDawModalSource] = useState<'initial' | 'menu'>('initial');
  const [showAnalogModal, setShowAnalogModal] = useState(false);
  const [analogInstruments, setAnalogInstruments] = useState<Hardware[]>([]);
  const [analogHardware, setAnalogHardware] = useState<Hardware[]>([]);
  const [drumKits, setDrumKits] = useState<Hardware[]>([]);
  const [showDrumKitModal, setShowDrumKitModal] = useState(false);
  const [editingDrumKit, setEditingDrumKit] = useState<Hardware | undefined>(undefined);
  const [deletedInstruments, setDeletedInstruments] = useState<Hardware[]>([]);
  const [deletedHardware, setDeletedHardware] = useState<Hardware[]>([]);
  const [starredHardware, setStarredHardware] = useState<string[]>(() => {
    const saved = localStorage.getItem('bg_starred_hardware');
    return saved ? JSON.parse(saved) : [];
  });
  const [importedSaveFile, setImportedSaveFile] = useState<FullSaveFile | null>(null);
  const [showImportDecisionModal, setShowImportDecisionModal] = useState(false);
  const [friendMode, setFriendMode] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingAudio, setIsDraggingAudio] = useState(false);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const [showBackupRestored, setShowBackupRestored] = useState(false);
  const [hasRestoredBackup, setHasRestoredBackup] = useState(false);

  useEffect(() => {
    if ((!isEnrichingLibrary && plugins.length > 0) || hasRestoredBackup) {
      setCurrentVibeExample(VIBE_EXAMPLES[Math.floor(Math.random() * VIBE_EXAMPLES.length)]);
      const shuffled = [...SONG_EXAMPLES].sort(() => 0.5 - Math.random());
      setCurrentSongExamples(shuffled.slice(0, 2));
    }
  }, [isEnrichingLibrary, plugins.length, hasRestoredBackup]);

  useEffect(() => {
    const renderTurnstile = () => {
      if ((window as any).turnstile) {
        const elements = document.querySelectorAll('.cf-turnstile:not([data-rendered])');
        elements.forEach((el: any) => {
          const sitekey = import.meta.env.VITE_TURNSTILE_SITE_KEY || '0x4AAAAAACkH6-i-na5YIlP9';
          (window as any).turnstile.render(el, {
            sitekey: sitekey,
            callback: (token: string) => {
              if ((window as any).onUploadSuccess) {
                (window as any).onUploadSuccess(token);
              }
            },
            'expired-callback': () => {
              setIsVerified(false);
              setTurnstileToken(null);
            },
            'error-callback': () => {
              setIsVerified(false);
              setTurnstileToken(null);
            },
            theme: theme === 'coldest' ? 'light' : 'dark',
            size: 'normal',
          });
          el.setAttribute('data-rendered', 'true');
        });
      }
    };

    // Initial render
    renderTurnstile();

    // Re-render when theme changes or plugins list changes (which might mount/unmount widgets)
    const interval = setInterval(renderTurnstile, 1000);
    return () => clearInterval(interval);
  }, [theme, plugins.length]);

  useEffect(() => {
    (window as any).onUploadSuccess = async (token: string) => {
      setTurnstileToken(token);
      try {
        const response = await fetch('/api/verify-turnstile', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify({ 'cf-turnstile-response': token }),
        });
        if (response.ok) {
          setIsVerified(true);
          setError(null); // Clear any previous errors
          
          // Advance tutorial if on verification step
          if (tutorialPhase === 'init' && tutorialStep === 1) {
            // The list will shrink by 1 when isVerified becomes true,
            // so index 1 will now point to the next step (Sign In).
            setTutorialStep(1);
          }
        } else {
          const data = await response.json().catch(() => ({}));
          const errorMsg = data.error || "Security verification failed.";
          const details = data.details ? ` (${data.details})` : "";
          setError(errorMsg + details);
        }
      } catch (err) {
        console.error("Verification error:", err);
        setError("Verification error. Please try again.");
      }
    };
  }, [tutorialPhase, tutorialStep]);

  useEffect(() => {
    if (hasRestoredBackup) {
      const timer = setTimeout(() => {
        searchInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        searchInputRef.current?.focus();
        // Reset horizontal scroll to prevent "shifting to the side"
        window.scrollTo({ left: 0 });
        setHasRestoredBackup(false);
      }, 800); // Increased timeout to wait for theme transitions
      return () => clearTimeout(timer);
    }
  }, [hasRestoredBackup]);

  useEffect(() => {
    localStorage.setItem('bg_starred_hardware', JSON.stringify(starredHardware));
  }, [starredHardware]);

  useEffect(() => {
    const migrateAndEnrichHardware = async () => {
      if (!user || !hasAcceptedTerms) return;
      try {
        const oldInstruments = localStorage.getItem('bg_analog_instruments');
        const oldHardware = localStorage.getItem('bg_analog_hardware');

        if (oldInstruments || oldHardware) {
          const instrumentsToMigrate = oldInstruments ? JSON.parse(oldInstruments) : [];
          const hardwareToMigrate = oldHardware ? JSON.parse(oldHardware) : [];

          if (instrumentsToMigrate.length > 0 && typeof instrumentsToMigrate[0] === 'string') {
            const enrichedInstruments = await enrichHardware(instrumentsToMigrate);
            setAnalogInstruments(enrichedInstruments);
            localStorage.removeItem('bg_analog_instruments');
          }

          if (hardwareToMigrate.length > 0 && typeof hardwareToMigrate[0] === 'string') {
            const enrichedHardware = await enrichHardware(hardwareToMigrate);
            setAnalogHardware(enrichedHardware);
            localStorage.removeItem('bg_analog_hardware');
          }
        }
      } catch (err: any) {
        console.error("Hardware migration failed:", err);
        // Silently fail or handle if needed, since this is a background migration
      }
    };

    migrateAndEnrichHardware();
  }, [user, hasAcceptedTerms]);

  const [excludeAnalog, setExcludeAnalog] = useState(false);
  const [dawType, setDawType] = useState<string | null>(() => {
    return localStorage.getItem('bg_daw_type') || null;
  });

  useEffect(() => {
    if (dawType) {
      localStorage.setItem('bg_daw_type', dawType);
    } else {
      localStorage.removeItem('bg_daw_type');
    }
  }, [dawType]);

  const [showGuide, setShowGuide] = useState(false);
  const [showVault, setShowVault] = useState(false);
  const [viewingRecipe, setViewingRecipe] = useState<SavedRecipe | null>(null);
  const [currentHash, setCurrentHash] = useState(window.location.hash);

  useEffect(() => {
    if (window.location.hash === '#cookies') {
      setShowCookiePolicy(true);
    }
    
    const handleHashChange = () => {
      setCurrentHash(window.location.hash);
      if (window.location.hash === '#cookies') {
        setShowCookiePolicy(true);
      }
    };
    
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const [activeSession, setActiveSession] = useState<SharedSession | null>(null);
  const saveFileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [showApiKeyInstructions, setShowApiKeyInstructions] = useState(false);
  const [showApiKeyEntry, setShowApiKeyEntry] = useState(false);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);
  const [showMasterModeModal, setShowMasterModeModal] = useState(false);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);
  const touchStartPos = useRef<{ x: number, y: number } | null>(null);

  const handlePasscodeSubmit = async () => {
    try {
      const response = await fetch('/api/verify-passcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode })
      });
      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem('_mv', 'true');
        localStorage.setItem('_ev', 'true');
        setM_act(true);
        setE_act(true);
        setTheme('coldest');
        setDuragStyle('purplesilk');
        setShowPasscodeModal(false);
        setPasscode('');
        setShowSparkles(true);
        setShowMasterModeModal(true);
        setTimeout(() => setShowSparkles(false), 3000);
      } else {
        setPasscode('');
      }
    } catch (error) {
      console.error("Verification failed", error);
      setPasscode('');
    }
  };

  const handleContextMenu = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (h_act && highEyes) {
      let x = 0;
      let y = 0;
      if ('clientX' in e) {
        x = e.clientX;
        y = e.clientY;
      } else if (e.touches && e.touches.length > 0) {
        x = e.touches[0].clientX;
        y = e.touches[0].clientY;
      } else if (e.changedTouches && e.changedTouches.length > 0) {
        x = e.changedTouches[0].clientX;
        y = e.changedTouches[0].clientY;
      }
      setContextMenu({ x, y });
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (h_act && highEyes) {
      isLongPress.current = false;
      const touch = e.touches[0];
      const x = touch.clientX;
      const y = touch.clientY;
      touchStartPos.current = { x, y };
      
      longPressTimer.current = setTimeout(() => {
        isLongPress.current = true;
        setContextMenu({ x, y });
        if ('vibrate' in navigator) navigator.vibrate(50);
      }, 700); // 700ms for long press
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPos.current || !longPressTimer.current) return;
    
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - touchStartPos.current.x);
    const dy = Math.abs(touch.clientY - touchStartPos.current.y);
    
    // If moved more than 10px, cancel the long press
    if (dx > 10 || dy > 10) {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    touchStartPos.current = null;
    if (isLongPress.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  useEffect(() => {
    if (duragStyle === 'sound-ninja' && !m_act) {
      setDuragStyle('standard');
    }
  }, [m_act, duragStyle]);

  const handleApiKeySave = async () => {
    if (!requireAuth()) return;
    const cleanKey = userApiKey.trim();
    if (!cleanKey) {
      setApiKeyError("API key does not exist");
      return;
    }

    setLoading(true);
    setApiKeyError(null);

    try {
      const masterResponse = await fetch('/api/verify-master', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: cleanKey })
      });
      const masterData = await masterResponse.json();

      if (masterData.success) {
        localStorage.setItem('_mv', 'true');
        localStorage.setItem('_ev', 'true');
        setM_act(true);
        setE_act(true);
        setTheme('coldest');
        setDuragStyle('purplesilk');
        setShowApiKeyInput(false);
        if (pendingFile) {
          if (pendingFile.type.includes('mpeg') || pendingFile.type.includes('mp3') || pendingFile.name.toLowerCase().endsWith('.mp3')) {
            handleAudioSearch(pendingFile, true);
          } else {
            processFile(pendingFile, true);
          }
          setPendingFile(null);
        }
        setLoading(false);
        setShowSparkles(true);
        setShowMasterModeModal(true);
        setTimeout(() => setShowSparkles(false), 3000);
        return;
      }
    } catch (e) {
      console.error("Master key check failed", e);
    }

    const validation = await validateApiKey(cleanKey);

    if (validation.valid && validation.cleanKey) {
      const finalKey = validation.cleanKey;
      const detectedTier = await detectAPITier(finalKey);
      
      // If detection says TIER_1, we use it. 
      // If detection says FREE, but user manually selected TIER_1, we trust the user.
      const finalTier = (detectedTier === 'TIER_1' || apiTier === 'TIER_1') ? 'TIER_1' : 'FREE';
      
      localStorage.setItem('bg_api_tier', finalTier);
      setApiTier(finalTier);
      localStorage.setItem('bg_user_api_key', finalKey);
      setUserApiKey(finalKey);
      localStorage.removeItem('_mv');
      setM_act(false);
      setShowApiKeyInput(false);
      if (pendingFile) {
        if (pendingFile.type.includes('mpeg') || pendingFile.type.includes('mp3') || pendingFile.name.toLowerCase().endsWith('.mp3')) {
          handleAudioSearch(pendingFile, true);
        } else {
          processFile(pendingFile, true);
        }
        setPendingFile(null);
      }
    } else {
      setApiKeyError(validation.message || "API key does not exist");
    }
    setLoading(false);
  };

  const toggleStar = (itemName: string) => {
    if (starredPlugins.includes(itemName)) {
      setStarredPlugins(starredPlugins.filter(p => p !== itemName));
    } else if (starredHardware.includes(itemName)) {
      setStarredHardware(starredHardware.filter(h => h !== itemName));
    } else {
      if (plugins.some(p => p.name === itemName)) {
        if (starredPlugins.length < 10) {
          setStarredPlugins([...starredPlugins, itemName]);
        } else {
          setError("You can only star up to 10 plugins.");
          setTimeout(() => setError(null), 3000);
        }
      } else {
        if (starredHardware.length < 10) {
          setStarredHardware([...starredHardware, itemName]);
        } else {
          setError("You can only star up to 10 hardware items.");
          setTimeout(() => setError(null), 3000);
        }
      }
    }
  };




  const currentAppName = highEyes ? "BeatRetard" : "BeatGangsta";
  const [h_act, setH_act] = useState(() => localStorage.getItem('_hv') === 'true');
  const [showUnlockPopup, setShowUnlockPopup] = useState(false);
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [tempUsername, setTempUsername] = useState('');
  
  const [autoBackupPrefs, setAutoBackupPrefs] = useState<{ gear: boolean; settings: boolean; recipes: boolean; critiques: boolean }>(() => {
    try {
      const saved = localStorage.getItem('bg_auto_backup_prefs');
      return saved ? JSON.parse(saved) : { gear: true, settings: true, recipes: true, critiques: true };
    } catch (e) {
      return { gear: true, settings: true, recipes: true, critiques: true };
    }
  });

  useEffect(() => {
    if (user && tutorialPhase === 'cloud_sync' && backupInfo && !backupInfo.hasBackup) {
      setWasCloudSyncModalShown(true);
    }
  }, [user, tutorialPhase, backupInfo]);

  useEffect(() => {
    if (showCloudSyncModal) setWasCloudSyncModalShown(true);
  }, [showCloudSyncModal]);

  useEffect(() => {
    if (tutorialPhase === 'done') return;
    if (showCookieConsent) return; // Wait for cookie consent

    // If tutorial hasn't started yet and cookie consent is done
    if (!showTutorial && tutorialPhase === 'init' && !localStorage.getItem('bg_tutorial_completed')) {
      setShowTutorial(true);
    }

    if (tutorialPhase === 'init' && user && isVerified) {
      // If user is already logged in, decide whether to show cloud_sync or skip it
      if (isInitialUser) {
        // Returning user, skip cloud_sync
        if (plugins.length > 0) {
          setTutorialPhase('library_populated');
        } else {
          setTutorialPhase('import');
        }
      } else if (justSignedIn) {
        // Just signed in, show cloud_sync
        setTutorialPhase('cloud_sync');
      } else {
        // Logged in but not initial and not just signed in? 
        // This could happen on refresh if they haven't finished tutorial.
        // Default to skipping cloud_sync if they already have plugins.
        if (plugins.length > 0) {
          setTutorialPhase('library_populated');
        } else {
          setTutorialPhase('import');
        }
      }
      setTutorialStep(0);
      setShowTutorial(true);
    } else if (tutorialPhase === 'cloud_sync') {
      const hasPrefs = !!localStorage.getItem('bg_auto_backup_prefs');
      if (!showCloudSyncModal && !showRestoreModal && (hasPrefs || wasCloudSyncModalShown)) {
        if (plugins.length > 0) {
          setTutorialPhase('library_populated');
        } else {
          setTutorialPhase('import');
        }
        setTutorialStep(0);
        setShowTutorial(true);
      }
    } else if (tutorialPhase === 'api_key' && isEnrichingLibrary) {
      setTutorialPhase('analyzing');
      setTutorialStep(0);
      setShowTutorial(false); // Hide tutorial while researching
    } else if (tutorialPhase === 'analyzing' && !isEnrichingLibrary && plugins.length > 0) {
      setTutorialPhase('library_populated');
      setTutorialStep(0);
      setShowTutorial(true);
    } else if (tutorialPhase === 'library_populated' && !showTutorial && recipes.length > 0) {
      setTutorialPhase('first_recipe');
      setTutorialStep(0);
      setShowTutorial(true);
    }
  }, [user, showCloudSyncModal, showApiKeyIntro, pendingFile, isEnrichingLibrary, plugins.length, recipes.length, tutorialPhase, showTutorial, wasCloudSyncModalShown, showConsentModal, tutorialStep]);

  // Auto-advance tutorial steps when actions are completed
  useEffect(() => {
    if (tutorialPhase === 'api_key' && tutorialStep === 0 && !showApiKeyIntro && showApiKeyInput) {
      setTutorialStep(1);
    } else if (tutorialPhase === 'library_populated' && tutorialStep === 2 && showVault) {
      setTutorialStep(3);
    } else if (tutorialPhase === 'library_populated' && tutorialStep === 3 && !showVault) {
      // Wait for them to close the vault before moving to Rig Manager
      setTutorialStep(4);
    }
  }, [tutorialPhase, tutorialStep, showApiKeyIntro, showApiKeyInput, showVault]);

  useEffect(() => {
    if (user && !cloudDriveUrl && !cloudDriveError) {
      const fetchCloudUrl = async () => {
        try {
          const res = await fetch('/api/cloud/url');
          if (res.ok) {
            const data = await res.json();
            if (data.url) {
              setCloudDriveUrl(data.url);
              localStorage.setItem('bg_cloud_drive_url', data.url);
              setCloudDriveError(false);
            }
          } else {
            const errorData = await res.json();
            console.error("Cloud URL fetch failed:", errorData.details || errorData.error);
            setCloudDriveError(true);
          }
        } catch (e) {
          console.error("Failed to fetch cloud drive URL", e);
          setCloudDriveError(true);
        }
      };
      fetchCloudUrl();
    }
  }, [user, cloudDriveUrl, cloudDriveError]);

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/status');
      const text = await res.text();
      console.log("Auth status response:", text);
      
      if (!text) {
        console.error("Empty response from /api/auth/status");
        setError("Authentication service error: Empty response.");
        return;
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("Failed to parse auth status as JSON", text, e);
        setError("Authentication service error. Please try again.");
        return;
      }
      if (data.authenticated) {
        setUser(data.user);
        if (data.user.termsAccepted) {
          setHasAcceptedTerms(true);
          localStorage.setItem('bg_terms_accepted', 'true');
        }
        setError(null);
        try {
          localStorage.setItem('bg_user', JSON.stringify(data.user));
        } catch (e) {
          console.error("Failed to stringify user data", data.user, e);
        }

        // Check for pending consent
        const pendingConsent = localStorage.getItem('bg_pending_consent');
        if (pendingConsent === 'true' && !data.user.termsAccepted) {
          fetch('/api/auth/accept-terms', { method: 'POST' })
            .then(res => {
              if (res.ok) {
                localStorage.removeItem('bg_pending_consent');
                const updatedUser = { ...data.user, termsAccepted: true };
                setUser(updatedUser);
                localStorage.setItem('bg_user', JSON.stringify(updatedUser));
                localStorage.setItem('bg_terms_accepted', 'true');
                setHasAcceptedTerms(true);
              }
            })
            .catch(err => console.error("Failed to save pending consent", err));
        }

        if (!data.user.termsAccepted && tutorialPhaseRef.current === 'done') {
          setShowConsentModal(true);
        }

        // Load tutorial progress from cloud
        await loadTutorialProgressFromCloud();

        try {
          const urlRes = await fetch('/api/cloud/url');
          if (urlRes.ok) {
            const urlData = await urlRes.json();
            if (urlData.url) {
              setCloudDriveUrl(urlData.url);
              localStorage.setItem('bg_cloud_drive_url', urlData.url);
            }
          }
        } catch (e) {
          console.error("Failed to fetch cloud drive URL", e);
        }
        
        if (!localStorage.getItem('bg_auto_backup_prefs') && tutorialPhaseRef.current === 'done' && justSignedInRef.current) {
          setCloudSyncMode('setup');
          setShowCloudSyncModal(true);
        }
        setJustSignedIn(false);
      } else {
        // If the server says we're not authenticated, we should clear the local user
        setUser(null);
        localStorage.removeItem('bg_user');
      }
    } catch (err) {
      console.error("Auth check failed", err);
    }
  }, [loadTutorialProgressFromCloud]); // Stable

  const syncAuth = useCallback(async (syncToken: string) => {
    console.log("[AUTH DEBUG] Starting syncAuth with token:", syncToken);
    setJustSignedIn(true);
    try {
      const res = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ syncToken })
      });
      if (res.ok) {
        const data = await res.json();
        console.log("[AUTH DEBUG] syncAuth successful, user:", data.user?.name);
        if (data.user) {
          setUser(data.user);
          localStorage.setItem('bg_user', JSON.stringify(data.user));
        }
        
        if (localStorage.getItem('bg_pending_consent') === 'true') {
          fetch('/api/auth/accept-terms', { method: 'POST' })
            .then(() => {
              localStorage.removeItem('bg_pending_consent');
              localStorage.setItem('bg_terms_accepted', 'true');
              setUser(prev => {
                if (prev) {
                  const updated = { ...prev, termsAccepted: true };
                  localStorage.setItem('bg_user', JSON.stringify(updated));
                  return updated;
                }
                return null;
              });
              setHasAcceptedTerms(true);
            })
            .catch(console.error);
        }
        // Fetch backup info
        fetch('/api/auth/check-backup')
          .then(res => res.json())
          .then(data => {
            setBackupInfo(data);
            if (data.hasBackup && tutorialPhaseRef.current === 'done' && justSignedInRef.current) {
              setShowRestoreModal(true);
            }
          })
          .catch(console.error);

        // Load tutorial progress from cloud
        await loadTutorialProgressFromCloud(true);
      } else {
        const errorText = await res.text();
        console.error("[AUTH ERROR] syncAuth failed:", errorText);
        checkAuth();
      }
    } catch (err) {
      console.error("[AUTH ERROR] syncAuth exception:", err);
      checkAuth();
    }
  }, [checkAuth, loadTutorialProgressFromCloud]); // Stable

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // Validate origin
      const origin = event.origin;
      console.log("[AUTH DEBUG] Received postMessage from origin:", origin, "data:", event.data?.type);
      
      if (!origin.endsWith('.run.app') && !origin.includes('localhost') && !origin.includes('beatgangsta.com')) {
        console.warn("[AUTH DEBUG] postMessage origin rejected:", origin);
        return;
      }

      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        console.log("[AUTH DEBUG] OAUTH_AUTH_SUCCESS received via postMessage");
        if (event.data.syncToken) {
          await syncAuth(event.data.syncToken);
        } else {
          console.log("[AUTH DEBUG] No syncToken in message, calling checkAuth");
          checkAuth();
        }
      }
    };

    // 1. postMessage listener
    window.addEventListener('message', handleMessage);

    // 2. BroadcastChannel listener (Fallback)
    const bc = new BroadcastChannel('bg_auth_sync');
    bc.onmessage = (event) => {
      console.log("[AUTH DEBUG] Received BroadcastChannel message:", event.data);
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data.syncToken) {
        syncAuth(event.data.syncToken);
      }
    };

    // 3. localStorage listener (Fallback)
    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'bg_auth_sync_data' && event.newValue) {
        try {
          const data = JSON.parse(event.newValue);
          console.log("[AUTH DEBUG] Received localStorage sync data:", data);
          if (data.type === 'OAUTH_AUTH_SUCCESS' && data.syncToken) {
            syncAuth(data.syncToken);
            // Clean up
            localStorage.removeItem('bg_auth_sync_data');
          }
        } catch (e) {
          console.error("[AUTH ERROR] Failed to parse storage sync data", e);
        }
      }
    };
    window.addEventListener('storage', handleStorage);

    // 4. Polling fallback (Last resort if all communication fails)
    const authInterval = setInterval(() => {
      if (!userRef.current && !justSignedInRef.current) {
        console.log("[AUTH DEBUG] Polling checkAuth...");
        checkAuth();
      }
    }, 15000); // Increased interval to be safer

    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('storage', handleStorage);
      bc.close();
      clearInterval(authInterval);
    };
  }, [checkAuth, syncAuth]);

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      localStorage.removeItem('bg_user');
      setIsUserMenuOpen(false);
    } catch (err) {
      console.error("Sign out failed", err);
    }
  };

  const handleDeleteCloudData = async () => {
    try {
      setIsDeletingAccount(true);
      const res = await fetch('/api/cloud/data', { method: 'DELETE' });
      if (res.ok) {
        alert("All cloud data has been successfully removed from Google Drive.");
      } else {
        alert("Failed to remove cloud data.");
      }
    } catch (err) {
      console.error("Failed to delete cloud data", err);
      alert("An error occurred while deleting cloud data.");
    } finally {
      setIsDeletingAccount(false);
      setIsUserMenuOpen(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setIsDeletingAccount(true);
      const res = await fetch('/api/auth/account', { method: 'DELETE' });
      if (res.ok) {
        localStorage.clear();
        setUser(null);
        setShowDeleteConfirm(false);
        alert("Your account and all associated data have been completely deleted.");
        window.location.reload();
      } else {
        alert("Failed to delete account.");
      }
    } catch (err) {
      console.error("Failed to delete account", err);
      alert("An error occurred while deleting your account.");
    } finally {
      setIsDeletingAccount(false);
      setIsUserMenuOpen(false);
    }
  };

  const handleSaveCloudPrefs = (prefs: { gear: boolean; settings: boolean; recipes: boolean }) => {
    setAutoBackupPrefs(prefs);
    localStorage.setItem('bg_auto_backup_prefs', JSON.stringify(prefs));
    setShowCloudSyncModal(false);
    
    // Trigger initial backup based on preferences
    handleExecuteCloudSync('backup', prefs, true);
  };

  const handleExecuteCloudSync = async (action: 'backup' | 'restore', prefs: { gear: boolean; settings: boolean; recipes: boolean }, silent = false) => {
    if (!requireAuth()) return;
    if (!silent) setIsCloudSyncing(true);
    try {
      if (action === 'backup') {
        const saveFile: FullSaveFile = {
          version: "1.0",
          timestamp: Date.now(),
          userProfile: {
            name: user.name,
            photo: user.photo
          },
          gear: {
            plugins,
            analogInstruments,
            analogHardware,
            starredPlugins,
            starredHardware,
            deletedPlugins,
            deletedInstruments,
            deletedHardware
          },
          vault: {
            recipes: vault,
            critiques: savedCritiques,
            folders
          },
          ui: {
            theme,
            grillStyle,
            knifeStyle,
            duragStyle,
            pendantStyle,
            chainStyle,
            saberColor,
            mascotColor,
            showChain,
            highEyes,
            isCigarEquipped,
            isTossingCigar,
            showSparkles
          }
        };

        const res = await fetch('/api/cloud/backup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: saveFile, preferences: prefs })
        });

        if (res.ok) {
          const result = await res.json();
          if (result.folderUrl) {
            setCloudDriveUrl(result.folderUrl);
            localStorage.setItem('bg_cloud_drive_url', result.folderUrl);
          }
          if (!silent) alert("Backup successful! Your selected data is now in the cloud.");
        } else {
          const errorData = await res.json();
          throw new Error(errorData.details || errorData.error || "Backup failed");
        }
      } else {
        const res = await fetch('/api/cloud/restore');
        if (res.ok) {
          const { data } = await res.json();
          if (data) {
            if (prefs.gear && data.gear) {
              setPlugins(data.gear.plugins || (data.gear as any).library || []);
              setAnalogInstruments(data.gear.analogInstruments || []);
              setAnalogHardware(data.gear.analogHardware || []);
              setDrumKits(data.gear.drumKits || []);
              setStarredPlugins(data.gear.starredPlugins || []);
              setStarredHardware(data.gear.starredHardware || []);
              setDeletedPlugins(data.gear.deletedPlugins || []);
              setDeletedInstruments(data.gear.deletedInstruments || []);
              setDeletedHardware(data.gear.deletedHardware || []);
              setShowRigUI(true);
            }
            if (prefs.recipes && data.vault) {
              setVault(data.vault.recipes || data.vault || []);
              setSavedCritiques(data.vault.critiques || []);
              setFolders(data.vault.folders || []);
            }
            if (prefs.settings && data.uiSettings) {
              setTheme(data.uiSettings.theme || 'coldest');
              setGrillStyle(data.uiSettings.grillStyle || 'diamond');
              setKnifeStyle(data.uiSettings.knifeStyle || 'standard');
              setDuragStyle(data.uiSettings.duragStyle || 'standard');
              setPendantStyle(data.uiSettings.pendantStyle || 'silver');
              setChainStyle(data.uiSettings.chainStyle || 'silver');
              setSaberColor(data.uiSettings.saberColor || '#a855f7');
              setMascotColor(data.uiSettings.mascotColor || '#3b82f6');
              setShowChain(data.uiSettings.showChain || false);
              setHighEyes(data.uiSettings.highEyes || false);
              setIsCigarEquipped(data.uiSettings.isCigarEquipped || false);
              setIsTossingCigar(data.uiSettings.isTossingCigar || false);
              setShowSparkles(data.uiSettings.showSparkles || false);
            }
            if (!silent) alert("Restore successful! Your selected data has been loaded.");
          }
        } else if (res.status === 404) {
          if (!silent) setError("No cloud backup found for your account.");
        } else {
          const errorData = await res.json();
          throw new Error(errorData.details || errorData.error || "Restore failed");
        }
      }
    } catch (err: any) {
      if (!silent) setError(`Cloud ${action} failed: ${err.message || "Please try again."}`);
    } finally {
      setIsCloudSyncing(false);
      setShowCloudSyncModal(false);
    }
  };

  const handleCloudBackupRecipe = async (recipe: BeatRecipe) => {
    if (!user) return;
    try {
      const { generateIndividualMidiFiles } = await import('./utils/exportAllMidi');
      const files = await generateIndividualMidiFiles(recipe);
      const midiFiles = files.filter(f => f.type === 'midi');
      const loopFiles = files.filter(f => f.type === 'loop');

      const res = await fetch('/api/cloud/backup/recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipe, midiFiles, loopFiles })
      });

      if (res.ok) {
        alert(`Recipe "${recipe.title}" and its MIDI/Loops have been backed up to your Google Drive!`);
      } else {
        throw new Error("Recipe backup failed");
      }
    } catch (err) {
      console.error("Recipe backup error:", err);
      alert("Failed to backup recipe to cloud.");
    }
  };

  const handleCloudBackup = async () => {
    setShowRigUI(false);
    setCloudSyncMode('backup');
    setShowCloudSyncModal(true);
  };

  const handleCloudRestore = async () => {
    setShowRigUI(false);
    setCloudSyncMode('restore');
    setShowCloudSyncModal(true);
  };

  const handleCompareRigs = (link: string) => {
    console.log('Comparing rig:', link);
    // TODO: Implement rig comparison logic
  };

  // Auto-backup UI settings when they change (debounced)
  useEffect(() => {
    if (!user || !autoBackupPrefs.settings) return;

    const timer = setTimeout(() => {
      handleExecuteCloudSync('backup', { gear: false, settings: true, recipes: false }, true);
    }, 10000); // 10 second debounce to avoid excessive API calls

    return () => clearTimeout(timer);
  }, [theme, grillStyle, knifeStyle, duragStyle, pendantStyle, chainStyle, saberColor, mascotColor, showChain, highEyes, isCigarEquipped, isTossingCigar, showSparkles, user, autoBackupPrefs.settings]);

  useEffect(() => {
    const uiSettings = {
      theme,
      grillStyle,
      knifeStyle,
      duragStyle,
      pendantStyle,
      chainStyle,
      saberColor,
      mascotColor,
      showChain,
      highEyes,
      isCigarEquipped,
      isTossingCigar,
      showSparkles
    };
    localStorage.setItem('bg_active_ui', JSON.stringify(uiSettings));
  }, [theme, grillStyle, knifeStyle, duragStyle, pendantStyle, chainStyle, saberColor, mascotColor, showChain, highEyes, isCigarEquipped, isTossingCigar, showSparkles]);

  const [vault, setVault] = useState<SavedRecipe[]>(() => {
    const saved = localStorage.getItem('bg_vault');
    return saved ? JSON.parse(saved) : [];
  });

  const [savedCritiques, setSavedCritiques] = useState<SavedCritique[]>(() => {
    const saved = localStorage.getItem('bg_saved_critiques');
    return saved ? JSON.parse(saved) : [];
  });

  const [folders, setFolders] = useState<Folder[]>(() => {
    const saved = localStorage.getItem('bg_folders');
    return saved ? JSON.parse(saved) : [];
  });

  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const saved = localStorage.getItem('bg_history');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const checkUnlocks = async () => {
      if (h_act) return;
      
      try {
        const response = await fetch('/api/check-unlocks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ grillStyle, knifeStyle })
        });
        const data = await response.json();
        
        if (data.hustleUnlocked) {
          localStorage.setItem('_hv', 'true');
          localStorage.setItem('_cv', 'true');
          setH_act(true);
          setC_act(true);
          setTheme('hustle-time');
          setShowUnlockPopup(true);
          setShowSparkles(true);
          setTimeout(() => setShowSparkles(false), 4000);
        }
      } catch (error) {
        console.error("Verification failed", error);
      }
    };
    
    checkUnlocks();
  }, [grillStyle, knifeStyle, h_act]);

  const canSeeChefHatToggle = false; 

  useEffect(() => {
    document.title = currentAppName;
  }, [currentAppName]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('bg_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('bg_user');
    }
    localStorage.setItem('bg_vault', JSON.stringify(vault));
    localStorage.setItem('bg_saved_critiques', JSON.stringify(savedCritiques));
    localStorage.setItem('bg_folders', JSON.stringify(folders));
    localStorage.setItem('bg_history', JSON.stringify(history));
  }, [user, vault, savedCritiques, folders, history]);

  const handleSignUpClick = () => {
    if (user) return;
    setShowSignUpModal(true);
  };

  const handleSignIn = () => {
    if (!tempUsername.trim()) return;
    const newUser = {
      name: tempUsername.trim(),
      email: `${tempUsername.toLowerCase()}@coldestconcept.com`,
      photo: `https://api.dicebear.com/7.x/avataaars/svg?seed=${tempUsername}`
    };
    setUser(newUser);
    setShowSignUpModal(false);
  };


  const saveToVault = async (recipe: BeatRecipe) => {
    if (vault.some(r => r.title === recipe.title)) return;

    const newId = Math.random().toString(36).substr(2, 9);
    const newSaved: SavedRecipe = {
      ...recipe,
      id: newId,
      savedAt: new Date().toISOString(),
      bubbleColor: '#0ea5e9',
    };
    
    setVault(prev => [...prev, newSaved]);
    setShowSparkles(true);
    setTimeout(() => setShowSparkles(false), 2000);

    // Auto-backup if enabled
    if (user && autoBackupPrefs.recipes) {
      handleCloudBackupRecipe(newSaved);
    }
  };

  const handleCloudBackupCritique = async (critique: SavedCritique) => {
    if (!user) return;
    try {
      const res = await fetch('/api/cloud/backup/critique', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ critique })
      });

      if (res.ok) {
        alert(`Critique "${critique.title}" has been backed up to your Google Drive!`);
      } else {
        throw new Error("Critique backup failed");
      }
    } catch (err) {
      console.error("Critique backup error:", err);
      alert("Failed to backup critique to cloud.");
    }
  };

  const saveCritiqueToVault = async (critique: MixCritique) => {
    if (savedCritiques.some(c => c.id === critique.id)) return;

    const newSaved: SavedCritique = {
      ...critique,
      savedAt: new Date().toISOString(),
    };
    
    setSavedCritiques(prev => [...prev, newSaved]);
    setShowSparkles(true);
    setTimeout(() => setShowSparkles(false), 2000);

    // Auto-backup if enabled
    if (user && autoBackupPrefs.critiques) {
      handleCloudBackupCritique(newSaved);
    }
  };

  const handleDeleteAllData = () => {
    const confirmed = window.confirm("CRITICAL: This will permanently delete your profile, your entire vault, and all unlocked secret themes. You will start back at zero. Proceed?");
    
    if (confirmed) {
      // Clear all state to prevent any last-second syncs to localStorage
      setUser(null);
      setVault([]);
      setFolders([]);
      setHistory([]);
      setH_act(false);
      setC_act(false);
      setM_act(false);
      setE_act(false);
      
      // Clear storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Force a hard reload to the root origin
      window.location.href = window.location.origin + window.location.pathname;
    }
  };

  const handleShareSession = (session: SharedSession) => {
    const encoded = btoa(JSON.stringify(session));
    navigator.clipboard.writeText(encoded);
    alert("Sync Code copied! Share this with another producer.");
  };

  const handleExportRigFile = (targetRecipe?: SavedRecipe) => {
    const recipeToExport = targetRecipe || vault[0];
    if (!recipeToExport) {
        alert("You need at least one saved recipe in your vault to export a complete rig file.");
        return;
    }

    const session: SharedSession = {
      recipe: recipeToExport,
      recipes: vault,
      critiques: savedCritiques,
      senderPlugins: plugins,
      senderAnalogInstruments: analogInstruments,
      senderAnalogHardware: analogHardware,
      senderDrumKits: drumKits,
      senderName: user?.name || "BeatGangsta Producer"
    };

    const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${user?.name || 'Producer'}_BeatGangsta_Rig_${recipeToExport.title.replace(/\s+/g, '_')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportRig = (session: SharedSession) => {
    setActiveSession(session);
    setShowVault(false);
  };

  const handleImportGear = (session: SharedSession) => {
    // Merge plugins
    setPlugins(prev => {
      const existingNames = new Set(prev.map(p => `${p.name}-${p.vendor}`));
      const newPlugins = session.senderPlugins.filter(p => !existingNames.has(`${p.name}-${p.vendor}`));
      return [...prev, ...newPlugins];
    });

    // Merge analog instruments
    setAnalogInstruments(prev => {
      const existingNames = new Set(prev.map(h => h.name));
      const newInstruments = (session.senderAnalogInstruments || []).filter(h => !existingNames.has(h.name));
      return [...prev, ...newInstruments];
    });

    // Merge analog hardware
    setAnalogHardware(prev => {
      const existingNames = new Set(prev.map(h => h.name));
      const newHardware = (session.senderAnalogHardware || []).filter(h => !existingNames.has(h.name));
      return [...prev, ...newHardware];
    });

    setDrumKits(prev => {
      const existingNames = new Set(prev.map(h => h.name));
      const newKits = (session.senderDrumKits || []).filter(h => !existingNames.has(h.name));
      return [...prev, ...newKits];
    });

    setShowSparkles(true);
    setTimeout(() => setShowSparkles(false), 2000);
  };

  const handleExportFullSave = () => {
    const saveFile: FullSaveFile = {
      version: "1.0",
      timestamp: Date.now(),
      userProfile: {
        name: user?.name || "BeatGangsta Producer",
        photo: user?.photo || ""
      },
      gear: {
        plugins,
        analogInstruments,
        analogHardware,
        drumKits,
        starredPlugins,
        starredHardware,
        deletedPlugins,
        deletedInstruments,
        deletedHardware
      },
      vault: {
        recipes: vault,
        folders
      },
      ui: {
        theme,
        grillStyle,
        knifeStyle,
        duragStyle,
        pendantStyle,
        chainStyle,
        saberColor,
        mascotColor,
        showChain,
        highEyes,
        isCigarEquipped,
        isTossingCigar,
        showSparkles
      }
    };

    const blob = new Blob([JSON.stringify(saveFile, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `beatgangsta_save_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportFullSave = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        
        // Simple validation
        if (parsed.version && parsed.gear && parsed.vault && parsed.ui) {
          setImportedSaveFile(parsed as FullSaveFile);
          setShowImportDecisionModal(true);
          setShowRigUI(false);
        } else {
          setError("Invalid save file format.");
        }
      } catch (err) {
        setError("Could not read save file.");
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  const handleRestoreSettings = () => {
    if (!importedSaveFile) return;

    // Restore Gear
    setPlugins(importedSaveFile.gear.plugins || (importedSaveFile.gear as any).library || []);
    setSearchTerm('');
    setSelectedFolder(null);
    setIsEnrichingLibrary(false);
    setAnalogInstruments(importedSaveFile.gear.analogInstruments || []);
    setAnalogHardware(importedSaveFile.gear.analogHardware || []);
    setDrumKits(importedSaveFile.gear.drumKits || []);
    setStarredPlugins(importedSaveFile.gear.starredPlugins || []);
    setStarredHardware(importedSaveFile.gear.starredHardware || []);
    setDeletedPlugins(importedSaveFile.gear.deletedPlugins || []);
    setDeletedInstruments(importedSaveFile.gear.deletedInstruments || []);
    setDeletedHardware(importedSaveFile.gear.deletedHardware || []);

    // Restore Vault
    setVault(importedSaveFile.vault.recipes || []);
    setSavedCritiques(importedSaveFile.vault.critiques || []);
    setFolders(importedSaveFile.vault.folders || []);

    // Restore UI
    setTheme(importedSaveFile.ui.theme);
    setGrillStyle(importedSaveFile.ui.grillStyle);
    setKnifeStyle(importedSaveFile.ui.knifeStyle);
    setDuragStyle(importedSaveFile.ui.duragStyle);
    setPendantStyle(importedSaveFile.ui.pendantStyle);
    setChainStyle(importedSaveFile.ui.chainStyle);
    setSaberColor(importedSaveFile.ui.saberColor);
    setMascotColor(importedSaveFile.ui.mascotColor || '#3b82f6');
    setShowChain(importedSaveFile.ui.showChain);
    setHighEyes(importedSaveFile.ui.highEyes);
    setIsCigarEquipped(importedSaveFile.ui.isCigarEquipped);
    setIsTossingCigar(importedSaveFile.ui.isTossingCigar);
    setShowSparkles(importedSaveFile.ui.showSparkles);

    // Close modal and clear imported file
    setImportedSaveFile(null);
    setShowImportDecisionModal(false);
    setShowBrandMenu(false);
    setShowRigUI(false);
    
    // Show confirmation and focus search
    setShowBackupRestored(true);
    setHasRestoredBackup(true);

    // Hide confirmation after 3 seconds
    setTimeout(() => {
      setShowBackupRestored(false);
    }, 3000);
  };

  const handleCompareWithFriend = () => {
    setFriendMode(true);
    setShowImportDecisionModal(false);
    setShowVault(true); // Open vault to show friend's data
  };

  const handleReplicateRecipe = async (recipe: SavedRecipe) => {
    if (!requireAuth()) return;
    setLoading(true);
    const progressInterval = simulateGenerationProgress(thinkingLevel === ThinkingLevel.HIGH ? 70 : 15);
    try {
      const replicated = await replicateRecipeWithUserGear(recipe, plugins, thinkingLevel);
      clearInterval(progressInterval);
      setGenerationProgress(100);
      setVault(prev => [replicated, ...prev]);
      setLoading(false);
      // Maybe show a success message or open the new recipe
      setViewingRecipe(replicated);
      setShowFairy(true);
    } catch (err: any) {
      clearInterval(progressInterval);
      console.error("Replication failed", err);
      const msg = err.message || 'Unknown error';
      setError(`Reimagine Error: ${msg}`);
      setLoading(false);
    }
  };

  const removeFromVault = (id: string) => {
    setVault(vault.filter(r => r.id !== id));
  };

  const removeFromSavedCritique = (id: string) => {
    setSavedCritiques(savedCritiques.filter(c => c.id !== id));
  };

  const updateVaultColor = (id: string, color: string) => {
    setVault(vault.map(r => r.id === id ? { ...r, bubbleColor: color } : r));
  };

  const updateVaultFolder = (id: string, folderId: string) => {
    setVault(vault.map(r => r.id === id ? { ...r, folderId: folderId || undefined } : r));
  };

  const addFolder = (name: string) => {
    const newFolder: Folder = { 
      id: Math.random().toString(36).substr(2, 9), 
      name,
      color: '#0ea5e9'
    };
    setFolders([...folders, newFolder]);
  };

  const removeFolder = (id: string) => {
    setFolders(folders.filter(f => f.id !== id));
    setVault(vault.map(r => r.folderId === id ? { ...r, folderId: undefined } : r));
  };

  const updateFolderColor = (id: string, color: string) => {
    setFolders(folders.map(f => f.id === id ? { ...f, color } : f));
  };

  const cycleGrill = () => {
    const styles: GrillStyle[] = ['diamond', 'aquabberry-diamond', 'gold', 'opal', 'rose-gold', 'blue-diamond'];
    const currentIdx = styles.indexOf(grillStyle);
    const nextIdx = (currentIdx + 1) % styles.length;
    const nextGrill = styles[nextIdx];
    setGrillStyle(nextGrill);
    
    // Reset special rags when switching grills
    if (nextGrill !== 'aquabberry-diamond' && duragStyle === 'royal-green') {
      setDuragStyle('standard');
    }
    if (!m_act && nextGrill !== 'opal' && duragStyle === 'purplesilk') {
      setDuragStyle('standard');
    }
  };

  const cycleKnife = () => {
    const styles: KnifeStyle[] = ['standard', 'gold', 'bloody', 'adamant', 'mythril'];
    if (h_act) {
      styles.push('samuels-saber', 'steak-knife');
    }
    if (m_act) {
      styles.push('dark-saber');
    }
    const currentIdx = styles.indexOf(knifeStyle);
    const nextIdx = (currentIdx + 1) % styles.length;
    setKnifeStyle(styles[nextIdx]);
  };

  const cycleDurag = () => {
    const styles: DuragStyle[] = ['standard', 'royal-green'];
    if (highEyes) {
      styles.push('rasta');
    }
    const currentIdx = styles.indexOf(duragStyle);
    const nextIdx = (currentIdx + 1) % styles.length;
    setDuragStyle(styles[nextIdx]);
  };


  const filteredPlugins = useMemo(() => {
    let filtered = plugins.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (selectedFolder) {
      filtered = filtered.filter(p => 
        sortBy === 'vendor' ? p.vendor === selectedFolder : p.type === selectedFolder
      );
    }

    filtered.sort((a, b) => {
      const aFav = starredPlugins.includes(a.name);
      const bFav = starredPlugins.includes(b.name);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;

      if (sortBy === 'vendor') {
        return a.vendor.localeCompare(b.vendor) || a.name.localeCompare(b.name);
      } else if (sortBy === 'type') {
        return a.type.localeCompare(b.type) || a.name.localeCompare(b.name);
      }
      return a.name.localeCompare(b.name);
    });

    return filtered;
  }, [plugins, searchTerm, sortBy, starredPlugins, selectedFolder]);

  const groupedPlugins = useMemo(() => {
    if (sortBy === 'name') return null;
    
    let filtered = plugins.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const groups: Record<string, VSTPlugin[]> = {};
    filtered.forEach(p => {
      const key = sortBy === 'vendor' ? p.vendor : p.type;
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    });

    // Sort groups by key
    return Object.fromEntries(Object.entries(groups).sort(([a], [b]) => a.localeCompare(b)));
  }, [plugins, searchTerm, sortBy]);

  const parsePlugins = async (input: string) => {
    if (!requireAuth()) return;
    if (!input.trim()) return;
    const lines = input.trim().split('\n');
    const isReaperIni = lines.some(l => l.includes('=') && (l.includes('.dll') || l.includes('.vst3')));
    let parsed: VSTPlugin[] = [];

    if (isReaperIni) {
      parsed = lines.map(line => {
        if (!line.includes('=')) return null;
        const [filename, rest] = line.split('=');
        if (!rest) return null;
        const parts = rest.split(',');
        const displayName = parts[2] || filename;
        const vendorMatch = displayName.match(/\(([^)]+)\)/);
        const vendor = vendorMatch ? vendorMatch[1] : 'Unknown';
        const name = displayName.split('(')[0].trim();
        return {
          vendor,
          name,
          type: filename.toLowerCase().includes('vst3') ? 'VST3' : 'VST2',
          version: 'N/A',
          lastModified: 'Found in INI',
        };
      }).filter((p): p is VSTPlugin => p !== null && p.name !== '');
    } else {
      const startIndex = lines[0] && lines[0].toLowerCase().includes('vendor') ? 1 : 0;
      parsed = lines.slice(startIndex).map(line => {
        // Try CSV parsing first
        const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        if (parts.length >= 2) {
          const rawName = parts[1]?.replace(/"/g, '').trim() || 'Unknown';
          const rawVendor = parts[0]?.replace(/"/g, '').trim() || 'Unknown';
          return {
            vendor: rawVendor,
            name: rawName,
            type: parts[2]?.replace(/"/g, '').trim() || 'Unknown',
            version: parts[3]?.replace(/"/g, '').trim() || 'Unknown',
            lastModified: parts[4]?.replace(/"/g, '').trim() || 'Unknown',
          };
        }
        
        // Fallback: treat whole line as plugin name if it's not empty
        const name = line.trim();
        if (!name) return null;
        
        // Try to guess vendor if it's in format "Vendor - Name" or "Vendor: Name"
        let vendor = 'Unknown';
        let cleanName = name;
        if (name.includes(' - ')) {
          [vendor, cleanName] = name.split(' - ').map(s => s.trim());
        } else if (name.includes(': ')) {
          [vendor, cleanName] = name.split(': ').map(s => s.trim());
        }

        return {
          vendor,
          name: cleanName,
          type: 'Unknown',
          version: 'N/A',
          lastModified: 'Manual List',
        };
      }).filter((p): p is VSTPlugin => p !== null && p.name !== 'Unknown');
    }

    if (parsed.length === 0) {
      setError("I couldn't find any plugins. Make sure you copied the list or uploaded the right file!");
      return;
    }

    setError(null);
    setIsEnrichingLibrary(true);
    setEnrichProgress(0);
    setEnrichEta(0);
    setEnrichStatus('Initializing Research...');

    try {
      const enriched = await enrichPluginLibrary(parsed, (progress, eta) => {
        setEnrichProgress(progress);
        setEnrichEta(eta);
      }, (status) => {
        setEnrichStatus(status);
      }, thinkingLevel);
      setPlugins(enriched);
      setDawModalSource('initial');
      setShowDawModal(true); // Show DAW selection before analog equipment
      
      // Auto-backup gear if enabled
      if (user && autoBackupPrefs.gear) {
        handleExecuteCloudSync('backup', { gear: true, settings: false, recipes: false }, true);
      }
    } catch (err: any) {
      console.error("Failed to enrich library:", err);
      
      if (err?.message?.includes("API_KEY_MISSING") || err?.message?.includes("401") || err?.message?.includes("403")) {
        setShowApiKeyInput(true);
        setApiKeyError(`Your API key is missing or invalid. Please update it to continue. (Error: ${err.message})`);
        setIsEnrichingLibrary(false);
        return;
      }

      let detailedError = "Plugin Research Failed: ";
      const errorMsg = err.message || "";
      
      if (errorMsg.includes("QUOTA_EXCEEDED")) {
        detailedError = "AI Research Quota Exceeded. " + errorMsg.split(': ')[1] + " The AI is currently at its limit. Please try again in 15-30 minutes or upload a smaller list.";
      } else if (errorMsg.includes("RESEARCH_INCOMPLETE")) {
        detailedError = "Strict Research Mode: " + errorMsg.split(': ')[1];
      } else if (errorMsg.includes("RESEARCH_FAILED")) {
        detailedError = "Network/AI Error: " + errorMsg.split(': ')[1];
      } else {
        detailedError += errorMsg || "An unexpected error occurred during the research process.";
      }
      
      setError(detailedError);
      setPlugins([]); // Ensure we don't proceed with incomplete data
    } finally {
      setIsEnrichingLibrary(false);
    }
  };

  const processFile = async (file: File, keyProvided = false) => {
    const savedKey = localStorage.getItem('bg_user_api_key');
    if (!savedKey && !keyProvided && !m_act) {
      setPendingFile(file);
      setShowApiKeyIntro(true);
      return;
    }

    const fileName = file.name.toLowerCase();
    if (fileName.includes('reaper')) {
      setDawType('Reaper');
    } else if (fileName.includes('studio one') || fileName.includes('studioone')) {
      setDawType('Studio One');
    } else if (fileName.includes('fl studio') || fileName.includes('flstudio')) {
      setDawType('FL Studio');
    }

    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const content = event.target?.result as string;
          if (content) {
            setCsvInput(content);
            await parsePlugins(content);
          }
          resolve();
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => {
        setError("Failed to read the file. Please try again.");
        reject(new Error("Failed to read file"));
      };
      reader.readAsText(file);
    });
  };

  const handleAnalogSave = async (instrumentNames: string[], hardwareNames: string[]): Promise<boolean> => {
    if (!requireAuth()) return false;
    try {
      const newInstruments = await enrichHardware(instrumentNames);
      const newHardware = await enrichHardware(hardwareNames);

      const removedInstruments = analogInstruments.filter(i => !newInstruments.some(ni => ni.name === i.name));
      const removedHardware = analogHardware.filter(h => !newHardware.some(nh => nh.name === h.name));

      setDeletedInstruments(prev => [...prev, ...removedInstruments]);
      setDeletedHardware(prev => [...prev, ...removedHardware]);

      setAnalogInstruments(newInstruments);
      setAnalogHardware(newHardware);
      return true;
    } catch (err: any) {
      if (err?.message?.includes("API_KEY_MISSING") || err?.message?.includes("401") || err?.message?.includes("403")) {
        setShowApiKeyInput(true);
        setApiKeyError("Your API key is missing or invalid. Please update it to continue.");
      } else {
        setError("Failed to save equipment. Please try again.");
      }
      return false;
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file).catch(err => {
      console.error("Error processing file:", err);
      if (err?.message?.includes("API_KEY_MISSING") || err?.message?.includes("401") || err?.message?.includes("403") || err?.message?.includes("API key not valid")) {
        setShowApiKeyInput(true);
        setApiKeyError(`Your API key is missing or invalid. Please update it to continue. (Error: ${err.message})`);
      } else {
        setError("An error occurred while processing the file.");
      }
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const simulateGenerationProgress = (estimatedSeconds: number) => {
    setGenerationProgress(0);
    setGenerationEta(estimatedSeconds);
    
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      // Slow down as we get closer to 95%
      let progress;
      if (elapsed < estimatedSeconds) {
        progress = (elapsed / estimatedSeconds) * 85;
      } else {
        // After ETA, crawl slowly towards 98%
        const extraTime = elapsed - estimatedSeconds;
        progress = 85 + (13 * (1 - Math.exp(-extraTime / 30)));
      }
      
      setGenerationProgress(Math.min(98, progress));
      setGenerationEta(Math.max(0, Math.round(estimatedSeconds - elapsed)));
    }, 200);
    
    return interval;
  };

  const handleGenerate = async () => {
    if (!requireAuth()) return;
    if (plugins.length === 0) return;
    if (!isVerified) {
      setError("Please complete the security verification first.");
      return;
    }
    setLoading(true);
    setError(null);
    
    // Safety timeout to prevent getting stuck - increased to 5 mins
    const timeoutId = setTimeout(() => {
      setLoading(false);
      setError("The architect is taking too long. Please try again!");
    }, 300000);

    const progressInterval = simulateGenerationProgress(thinkingLevel === ThinkingLevel.HIGH ? 90 : 25);

    try {
      if (!requireAuth()) return;
      const response = await getBeatRecommendations(plugins, analogInstruments, analogHardware, drumKits, excludeAnalog, dawType, starredPlugins, isGangstaVox, thinkingLevel);
      clearInterval(progressInterval);
      setGenerationProgress(100);
      clearTimeout(timeoutId);
      setRecipes(response.recipes);
      const newHistory: HistoryItem[] = response.recipes.map(r => ({
        ...r,
        generatedAt: new Date().toISOString()
      }));
      setHistory(prev => [...newHistory, ...prev].slice(0, 50));
      setShowFairy(true);
    } catch (err: any) {
      clearInterval(progressInterval);
      clearTimeout(timeoutId);
      console.error("Generation error:", err);
      
      const errorMessage = err?.message || "";
      if (errorMessage.includes("API_KEY_MISSING") || errorMessage.includes("401") || errorMessage.includes("403")) {
        setShowApiKeyInput(true);
        setApiKeyError("Your API key is missing or invalid. Please update it to continue.");
      } else if (errorMessage.includes("SAFETY") || errorMessage.includes("blocked")) {
        setError("The AI blocked this request for safety reasons. Try adjusting your prompt.");
      } else if (errorMessage.includes("QUOTA") || errorMessage.includes("429")) {
        setError("API quota exceeded. Please try again in a few minutes.");
      } else {
        setError(errorMessage || "Couldn't think of any beats right now. Try again in a second!");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTypeBeatSearch = async () => {
    if (!requireAuth()) return;
    if (plugins.length === 0 || !typeBeatSearch.trim()) return;
    if (!isVerified) {
      setError("Please complete the security verification first.");
      return;
    }
    setLoading(true);
    setError(null);

    const timeoutId = setTimeout(() => {
      setLoading(false);
      setError("Search timed out. Try a different vibe!");
    }, 300000);

    const progressInterval = simulateGenerationProgress(thinkingLevel === ThinkingLevel.HIGH ? 110 : 30);

    try {
      if (!requireAuth()) return;
      const response = await getCustomBeatRecommendations(plugins, typeBeatSearch.trim(), analogInstruments, analogHardware, drumKits, excludeAnalog, dawType, starredPlugins, isGangstaVox, thinkingLevel);
      clearInterval(progressInterval);
      setGenerationProgress(100);
      clearTimeout(timeoutId);
      setRecipes(response.recipes);
      const newHistory: HistoryItem[] = response.recipes.map(r => ({
        ...r,
        generatedAt: new Date().toISOString()
      }));
      setHistory(prev => [...newHistory, ...prev].slice(0, 50));
      setTypeBeatSearch('');
      setShowFairy(true);
    } catch (err: any) {
      clearInterval(progressInterval);
      clearTimeout(timeoutId);
      if (err?.message?.includes("API_KEY_MISSING") || err?.message?.includes("401") || err?.message?.includes("403")) {
        setShowApiKeyInput(true);
        setApiKeyError("Your API key is missing or invalid. Please update it to continue.");
      } else {
        setError("Couldn't find any recipes for that vibe. Try a different search!");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSongSearch = async () => {
    if (!requireAuth()) return;
    if (plugins.length === 0 || !songSearch.trim()) return;
    if (!isVerified) {
      setError("Please complete the security verification first.");
      return;
    }
    setLoading(true);
    setError(null);

    const timeoutId = setTimeout(() => {
      setLoading(false);
      setError("Song search timed out. Try a different track!");
    }, 300000);

    const progressInterval = simulateGenerationProgress(thinkingLevel === ThinkingLevel.HIGH ? 120 : 35);

    try {
      if (!requireAuth()) return;
      const response = await getSongBeatRecommendations(plugins, songSearch.trim(), analogInstruments, analogHardware, drumKits, excludeAnalog, dawType, starredPlugins, isGangstaVox, thinkingLevel);
      clearInterval(progressInterval);
      setGenerationProgress(100);
      clearTimeout(timeoutId);
      setRecipes(response.recipes);
      const newHistory: HistoryItem[] = response.recipes.map(r => ({
        ...r,
        generatedAt: new Date().toISOString()
      }));
      setHistory(prev => [...newHistory, ...prev].slice(0, 50));
      setSongSearch('');
      setShowFairy(true);
    } catch (err: any) {
      clearInterval(progressInterval);
      clearTimeout(timeoutId);
      if (err?.message?.includes("API_KEY_MISSING") || err?.message?.includes("401") || err?.message?.includes("403")) {
        setShowApiKeyInput(true);
        setApiKeyError("Your API key is missing or invalid. Please update it to continue.");
      } else {
        setError("Couldn't find any recipes for that song. Try a different track!");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAudioDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingAudio(true);
  };

  const handleAudioDragLeave = () => {
    setIsDraggingAudio(false);
  };

  const handleAudioDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingAudio(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type === 'audio/mpeg' || file.type === 'audio/mp3' || file.name.toLowerCase().endsWith('.mp3'))) {
      handleAudioSearch(file);
    } else {
      setError("Please drop a valid MP3 file.");
    }
  };

  const handleAudioSearch = async (file: File, keyProvided = false) => {
    if (!requireAuth()) return;
    
    const savedKey = localStorage.getItem('bg_user_api_key');
    if (!savedKey && !keyProvided) {
      setPendingFile(file);
      setShowApiKeyIntro(true);
      return;
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit for safety
      setError("This file is too large (over 50MB). Please try a smaller MP3 or use a third-party service like Uploadcare to host it.");
      return;
    }
    if (plugins.length === 0) return;
    if (!isVerified) {
      setError("Please complete the security verification first.");
      return;
    }
    if (!file.type.includes('mpeg') && !file.type.includes('mp3') && !file.name.toLowerCase().endsWith('.mp3')) {
      setError("Only MP3 files are supported for analysis at this time.");
      return;
    }
    setLoading(true);
    setAudioAnalysisLoading(true);
    setError(null);

    // Run even if it takes a long time - increased to 15 mins
    const timeoutId = setTimeout(() => {
      setLoading(false);
      setAudioAnalysisLoading(false);
      setError("Audio analysis is taking longer than expected. The file might be very complex, but we're still trying...");
    }, 900000); 

    const progressInterval = simulateGenerationProgress(thinkingLevel === ThinkingLevel.HIGH ? 180 : 60);

    try {
      // Process audio: trim to 30s, downmix to mono, reduce sample rate
      // This ensures it works even if the original file is huge or in a weird format
      const { base64: audioBase64, mimeType } = await processAudioForAnalysis(file);

      if (audioMode === 'critique') {
        if (!requireAuth()) return;
        const critique = await getMixCritique(plugins, audioBase64, mimeType, isGangstaVox, hasStems, thinkingLevel);
        critique.id = Math.random().toString(36).substr(2, 9);
        critique.audioBase64 = audioBase64;
        critique.mimeType = mimeType;
        clearInterval(progressInterval);
        setGenerationProgress(100);
        clearTimeout(timeoutId);
        setCritiques([critique]);
        setRecipes([]);
        setShowFairy(true);
      } else {
        let response;
        try {
          if (!requireAuth()) return;
          response = await getAudioBeatRecommendations(
            plugins,
            audioBase64,
            mimeType,
            analogInstruments.map(i => i.name),
            analogHardware.map(h => h.name),
            excludeAnalog,
            dawType,
            starredPlugins,
            isGangstaVox,
            thinkingLevel
          );
        } catch (apiErr: any) {
          console.warn("Initial audio analysis failed, retrying with minimal plugin list...", apiErr);
          // Retry with a very small plugin list (top 30) to reduce context pressure
          try {
            if (!requireAuth()) return;
            response = await getAudioBeatRecommendations(
              plugins.slice(0, 30),
              audioBase64,
              mimeType,
              analogInstruments.map(i => i.name),
              analogHardware.map(h => h.name),
              excludeAnalog,
              dawType,
              starredPlugins,
              isGangstaVox
            );
          } catch (retryErr: any) {
            console.error("Retry audio analysis failed:", retryErr);
            throw retryErr;
          }
        }

        clearInterval(progressInterval);
        setGenerationProgress(100);
        clearTimeout(timeoutId);
        
        const recipesWithAudio = response.recipes.map(r => ({
          ...r,
          audioBase64,
          mimeType
        }));
        
        setRecipes(recipesWithAudio);
        setCritiques([]);
        const newHistory: HistoryItem[] = recipesWithAudio.map(r => ({
          ...r,
          generatedAt: new Date().toISOString()
        }));
        setHistory(prev => [...newHistory, ...prev].slice(0, 50));
        setShowFairy(true);
      }
    } catch (err: any) {
      clearInterval(progressInterval);
      clearTimeout(timeoutId);
      console.error("Audio analysis error:", err);
      
      if (err?.message?.includes("API_KEY_MISSING") || err?.message?.includes("401") || err?.message?.includes("403")) {
        setShowApiKeyInput(true);
        setApiKeyError(`Your API key is missing or invalid. Please update it to continue. (Error: ${err.message})`);
      } else if (err?.message?.includes("decode")) {
        setError("Could not read this audio file. Try a standard MP3 under 20MB.");
      } else {
        const errorMsg = err?.message || err?.toString() || "Unknown error";
        setError(`Failed to analyze audio: ${errorMsg}. The file might be too complex or the AI is at its limit. Try a shorter clip!`);
      }
    } finally {
      setLoading(false);
      setAudioAnalysisLoading(false);
    }
  };

  const toggleTheme = () => {
    setTheme(prev => {
      if (prev === 'coldest') return 'crazy-bird';
      if (prev === 'crazy-bird') {
        if (h_act) return 'hustle-time';
        return 'coldest';
      }
      if (prev === 'hustle-time') {
        return 'coldest';
      }
      return 'coldest';
    });
  };


  const toggleHighEyes = () => {
    const nextHigh = !highEyes;
    setHighEyes(nextHigh);
    if (nextHigh) {
      setIsCigarEquipped(true);
      setIsTossingCigar(false);
      setHasUnlockedBluntToggle(true);
      setDuragStyle('rasta');
    } else {
      if (duragStyle === 'rasta') {
        setDuragStyle('standard');
      }
    }
  };

  const handleCigarToggle = () => {
    if (isCigarEquipped) {
      setIsTossingCigar(true);
      setTimeout(() => {
        setIsCigarEquipped(false);
        setIsTossingCigar(false);
      }, 1000);
    } else {
      setIsCigarEquipped(true);
      setIsTossingCigar(false);
    }
  };

  const cyclePendant = () => {
    const materials: PendantStyle[] = ['silver', 'gold', 'rose-gold', 'diamond', 'blue-diamond'];
    const currentIdx = materials.indexOf(pendantStyle);
    const nextIdx = (currentIdx + 1) % materials.length;
    setPendantStyle(materials[nextIdx]);
  };

  const cycleChain = () => {
    const materials: ChainStyle[] = ['silver', 'gold', 'rose-gold', 'diamond', 'blue-diamond'];
    const currentIdx = materials.indexOf(chainStyle);
    const nextIdx = (currentIdx + 1) % materials.length;
    setChainStyle(materials[nextIdx]);
  };

  const grillLabel = grillStyle === 'diamond' ? 'Diamond' : grillStyle === 'aquabberry-diamond' ? 'Aquaberry' : grillStyle === 'gold' ? 'Gold' : grillStyle === 'rose-gold' ? 'Rose Gold' : grillStyle === 'blue-diamond' ? 'Blue Diamond' : 'Opal';
  const knifeLabel = { 
    standard: 'Standard', gold: 'Gold', bloody: 'Bloody', adamant: 'Adamant', mythril: 'Mythril', 'samuels-saber': "Saber", 'dark-saber': 'Dark Saber', 'steak-knife': 'Steak Knife'
  }[knifeStyle];

  const duragLabel = {
    standard: 'Durag',
    'royal-green': 'Royal Durag',
    'purplesilk': 'Purple Silk',
    'sound-ninja': 'Sound Ninja',
    rasta: 'Rasta Hat',
    'chef-hat': 'Chef Hat'
  }[duragStyle];

  const themeClasses = theme === 'coldest' 
    ? "bg-sky-400 text-sky-900"
    : theme === 'crazy-bird'
    ? "bg-red-500 text-red-50"
    : theme === 'hustle-time'
    ? "bg-emerald-900 text-yellow-400"
    : "bg-emerald-500 text-emerald-50";

  const mainBlurClass = 'backdrop-blur-2xl';
  const themedBtnClasses = theme === 'coldest' 
    ? 'bg-white/40 border-sky-100 text-sky-800' 
    : theme === 'hustle-time' 
    ? 'bg-black/40 border-white/10 text-white' 
    : 'bg-black/40 border-white/10 text-white';

  const getThemeActiveClasses = (theme: AppTheme) => {
    switch (theme) {
      case 'coldest': return 'bg-sky-500 text-white border-sky-400';
      case 'crazy-bird': return 'bg-[#600a0a] text-white border-[#4a0808]';
      case 'hustle-time': return 'bg-yellow-600 text-black border-yellow-500';
      default: return 'bg-white text-black border-white';
    }
  };

  const getDropdownTheme = (theme: AppTheme) => {
    switch (theme) {
      case 'coldest':
        return {
          container: 'bg-[#38bdf8] border-sky-600 text-sky-950 shadow-sky-900/40',
          text: 'text-sky-950',
          itemHover: 'hover:bg-sky-500/20 text-sky-950',
          iconBg: 'bg-sky-600/20 group-hover:bg-sky-600/30',
          divider: 'bg-sky-600/20'
        };
      case 'crazy-bird':
        return {
          container: 'bg-[#600a0a] border-[#4a0808] text-white shadow-red-950/40',
          text: 'text-white',
          itemHover: 'hover:bg-[#7a0d0d]/60 text-white',
          iconBg: 'bg-[#8a0f0f]/30 group-hover:bg-[#8a0f0f]/50',
          divider: 'bg-[#8a0f0f]/20'
        };
      case 'hustle-time':
        return {
          container: 'bg-yellow-500 border-yellow-700 text-black shadow-yellow-900/20',
          text: 'text-black',
          itemHover: 'hover:bg-yellow-400/40 text-black',
          iconBg: 'bg-yellow-600/20 group-hover:bg-yellow-600/40',
          divider: 'bg-yellow-700/20'
        };
      default:
        return {
          container: 'bg-[#111] border-white/10 text-white shadow-black/60',
          text: 'text-white',
          itemHover: 'hover:bg-white/10 text-slate-300',
          iconBg: 'bg-white/10 group-hover:bg-white/20',
          divider: 'bg-white/10'
        };
    }
  };

  const actionBtnClasses = `pointer-events-auto relative flex items-center justify-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full border shadow-xl transition-all hover:scale-105 active:scale-95 group ${mainBlurClass} text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap min-w-[120px] sm:min-w-[140px]`;
  const mobileToolbarBtnClasses = `flex flex-col items-center justify-center gap-1 p-2 flex-1 transition-all active:scale-90`;
  const mobileTrayBtnClasses = `pointer-events-auto relative flex items-center justify-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full border shadow-xl transition-all hover:scale-105 active:scale-95 group ${mainBlurClass} text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap min-w-[120px] sm:min-w-[140px]`;

  return (
    <div className={`min-h-[100dvh] w-full overflow-x-hidden transition-colors duration-700 flex flex-col ${themeClasses} font-sans selection:bg-sky-200 pb-20 sm:pb-0`}>
      <AnimatePresence>
        {showWelcomeSplash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[3000000] flex items-center justify-center bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              className="text-center p-8 rounded-3xl bg-white/10 border border-white/20 shadow-2xl"
            >
              <div className="mb-6 flex justify-center">
                <div className="p-4 rounded-full bg-sky-500/20 text-sky-400">
                  {showWelcomeSplash === 'back' ? <Rocket className="w-12 h-12" /> : <Sparkles className="w-12 h-12" />}
                </div>
              </div>
              <h2 className="text-3xl font-black uppercase tracking-widest text-white mb-2">
                {showWelcomeSplash === 'back' ? 'Welcome Back! 🎹' : 'Welcome to BeatGangsta! 🚀'}
              </h2>
              <p className="text-sky-200/70 font-medium">
                {showWelcomeSplash === 'back' 
                  ? 'Resuming your studio session...' 
                  : 'Setting up your production assistant...'}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {theme === 'coldest' && (
          <motion.div
            key="snow-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            className="fixed inset-0 z-0 pointer-events-none"
          >
            <SnowFlurry />
          </motion.div>
        )}
      </AnimatePresence>
      <div className={`h-8 flex items-center justify-between px-3 text-[11px] font-bold select-none backdrop-blur-md border-b transition-all duration-500 z-[100] ${theme === 'coldest' ? 'bg-white/30 text-[#0c4a6e] border-white/20' : 'bg-black/40 text-red-100 border-red-900/30'}`}>
        <div className="flex items-center gap-2 relative">
          <button 
            id="btn-menu"
            onClick={() => setShowBrandMenu(!showBrandMenu)}
            className="flex items-center gap-2 hover:opacity-70 transition-all group"
          >
            <span className="tracking-wide uppercase whitespace-nowrap">Menu</span>
            <svg className={`w-2.5 h-2.5 transition-transform duration-300 ${showBrandMenu ? 'rotate-180' : ''} opacity-30 group-hover:opacity-100`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showTutorial && (
            <button
              onClick={handleCompleteTutorial}
              className="sm:hidden ml-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-white/10 text-white backdrop-blur-sm border border-white/20"
            >
              Exit Tutorial
            </button>
          )}

          {showBrandMenu && (
            <>
              <div className={`fixed inset-0 z-40`} onClick={() => setShowBrandMenu(false)} />
              <div className={`absolute top-full left-0 mt-1 w-64 p-2 rounded-2xl border shadow-2xl z-50 animate-in fade-in slide-in-from-top-1 duration-200 ${getDropdownTheme(theme).container}`}>
                <button 
                  disabled={showTutorial}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowTrashModal(true);
                    setShowBrandMenu(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors group ${getDropdownTheme(theme).itemHover} ${showTutorial ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${getDropdownTheme(theme).iconBg}`}>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider">Show Deleted Items</div>
                    <div className="text-[9px] opacity-50 mt-0.5">Restore plugins and hardware</div>
                  </div>
                </button>
                <div className={`h-px w-full my-1 ${getDropdownTheme(theme).divider}`} />
                <button 
                  disabled={showTutorial}
                  onClick={(e) => {
                    e.stopPropagation();
                    setPlugins([]);
                    setCsvInput('');
                    setError(null);
                    setShowBrandMenu(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors group ${getDropdownTheme(theme).itemHover} ${showTutorial ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${getDropdownTheme(theme).iconBg}`}>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider">Update Plugin List</div>
                    <div className="text-[9px] opacity-50 mt-0.5">Upload a new plugin file</div>
                  </div>
                </button>
                <div className={`h-px w-full my-1 ${getDropdownTheme(theme).divider}`} />
                <button 
                  disabled={showTutorial}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPasteModal(true);
                    setShowBrandMenu(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors group ${getDropdownTheme(theme).itemHover} ${showTutorial ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${getDropdownTheme(theme).iconBg}`}>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider">Paste Plugin List</div>
                    <div className="text-[9px] opacity-50 mt-0.5">Manually enter your plugins</div>
                  </div>
                </button>
                <div className={`h-px w-full my-1 ${getDropdownTheme(theme).divider}`} />
                <button 
                  disabled={showTutorial}
                  onClick={(e) => {
                    e.stopPropagation();
                    setDawModalSource('menu');
                    setShowDawModal(true);
                    setShowBrandMenu(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors group ${getDropdownTheme(theme).itemHover} ${showTutorial ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${getDropdownTheme(theme).iconBg}`}>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider">Change DAW</div>
                    <div className="text-[9px] opacity-50 mt-0.5">Switch DAW features</div>
                  </div>
                </button>
                <div className={`h-px w-full my-1 ${getDropdownTheme(theme).divider}`} />
                <button 
                  disabled={showTutorial}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowApiKeyInput(true);
                    setShowBrandMenu(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors group ${getDropdownTheme(theme).itemHover} ${showTutorial ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${getDropdownTheme(theme).iconBg}`}>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider">Update API Key</div>
                    <div className="text-[9px] opacity-50 mt-0.5">Change your Gemini API key</div>
                  </div>
                </button>
                <div className={`h-px w-full my-1 ${getDropdownTheme(theme).divider}`} />
                <button 
                  disabled={showTutorial}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteAllData();
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors group ${getDropdownTheme(theme).itemHover} ${showTutorial ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${theme === 'coldest' ? 'bg-[#f38020] text-white' : 'bg-white text-black'}`}>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-wider">Delete Browser Data</span>
                    <span className="text-[8px] font-bold opacity-50">Removes plugins, instruments & recipes</span>
                  </div>
                </button>

                <div className={`h-px w-full my-1 ${getDropdownTheme(theme).divider}`} />

                <button 
                  disabled={showTutorial}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (showRigUI) {
                      localStorage.setItem('bg_skip_auth', 'true');
                      setHasAcceptedTerms(true);
                    } else {
                      localStorage.removeItem('bg_skip_auth');
                      setHasAcceptedTerms(false);
                    }
                    localStorage.removeItem('bg_tutorial_completed');
                    setVerificationSessionId(prev => prev + 1);
                    setTutorialPhase('init');
                    setTutorialStep(0);
                    setShowTutorial(true);
                    setShowBrandMenu(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors group ${getDropdownTheme(theme).itemHover} ${showTutorial ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${getDropdownTheme(theme).iconBg}`}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-wider">Restart Tutorial</span>
                    <span className="text-[8px] font-bold opacity-50">Show the welcome guide again</span>
                  </div>
                </button>
                
                <div className={`h-[1px] ${getDropdownTheme(theme).divider} my-1`} />
                
                <button 
                  disabled={showTutorial}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowFriendsInfo(true);
                    setShowBrandMenu(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left group ${getDropdownTheme(theme).itemHover} ${showTutorial ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${getDropdownTheme(theme).iconBg}`}>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-wider">ColdestConcept x Friends</span>
                    <span className="text-[8px] font-bold opacity-50">The Collective & Credits</span>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>
        <div className="flex items-center gap-4">
          {!user ? (
            <div className="flex items-center">
              <button 
                id="btn-google-signin"
                onClick={handleGoogleSignIn} 
                className={`group flex items-center justify-center gap-2 px-4 py-1.5 rounded-full shadow-lg transition-all active:scale-95 border ${mainBlurClass} ${themedBtnClasses}`}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="currentColor"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="currentColor"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="currentColor"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="currentColor"/>
                </svg>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] leading-none">Sign In</span>
              </button>
            </div>
          ) : (
            <div className="relative flex items-center gap-2">
              <button 
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className={`flex items-center gap-2 px-3 py-1 rounded-full border shadow-md transition-all hover:scale-105 active:scale-95 ${mainBlurClass} ${themedBtnClasses}`}
              >
                <div className="relative w-5 h-5 group">
                  <img src={user.photo} alt={user.name} className="w-full h-full rounded-full object-cover" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider truncate max-w-[70px] sm:max-w-[120px]">{user.name}</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              
              <AnimatePresence>
                {showAboutModal && (
                  <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setShowAboutModal(false)}
                      className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 20 }}
                      className={`relative w-full max-w-2xl overflow-hidden rounded-[2.5rem] border shadow-2xl ${theme === 'coldest' ? 'bg-white border-sky-100' : 'bg-[#0a0a0a] border-white/10'}`}
                    >
                      <div className={`p-8 sm:p-12 ${theme === 'coldest' ? 'text-slate-800' : 'text-white'}`}>
                        <div className="flex items-center justify-between mb-8">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${theme === 'coldest' ? 'bg-sky-500/10 text-sky-500' : 'bg-white/5 text-white/80'}`}>
                              <Info size={24} />
                            </div>
                            <div>
                              <h2 className="text-2xl font-black tracking-tighter">About BeatGangsta</h2>
                              <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Production Architect</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setShowAboutModal(false)}
                            className={`p-2 rounded-xl transition-colors ${theme === 'coldest' ? 'hover:bg-slate-100 text-slate-400' : 'hover:bg-white/5 text-white/40'}`}
                          >
                            <X size={20} />
                          </button>
                        </div>

                        <div className="space-y-8">
                          <section>
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-4 opacity-40">The Vision</h3>
                            <p className="text-sm font-medium leading-relaxed opacity-70">
                              BeatGangsta was built for producers who are tired of generic tutorials. Every studio is different, and every producer has a unique set of tools. We believe AI should work for you, not replace you.
                            </p>
                          </section>

                          <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className={`p-6 rounded-3xl border ${theme === 'coldest' ? 'bg-sky-50/50 border-sky-100' : 'bg-white/5 border-white/10'}`}>
                              <div className="flex items-center gap-3 mb-3">
                                <Cpu size={18} className="text-sky-500" />
                                <h4 className="text-xs font-black uppercase tracking-widest text-sky-600">Tailored Logic</h4>
                              </div>
                              <p className={`text-[11px] font-medium leading-relaxed opacity-60 ${theme === 'coldest' ? 'text-slate-600' : 'text-slate-300'}`}>
                                By analyzing your specific VST library and hardware, we generate recipes that use the gear you actually own.
                              </p>
                            </div>
                            <div className={`p-6 rounded-3xl border ${theme === 'coldest' ? 'bg-sky-50/50 border-sky-100' : 'bg-white/5 border-white/10'}`}>
                              <div className="flex items-center gap-3 mb-3">
                                <Sparkles size={18} className="text-sky-500" />
                                <h4 className="text-xs font-black uppercase tracking-widest text-sky-600">Instant Workflow</h4>
                              </div>
                              <p className={`text-[11px] font-medium leading-relaxed opacity-60 ${theme === 'coldest' ? 'text-slate-600' : 'text-slate-300'}`}>
                                Get deep-dive parameter settings, MIDI guides, and mixing strategies in seconds.
                              </p>
                            </div>
                          </section>

                          <div className={`p-6 rounded-3xl text-center ${theme === 'coldest' ? 'bg-slate-50' : 'bg-white/5'}`}>
                            <p className="text-[11px] font-bold italic opacity-50">
                              "Stop searching for the right sound. Architect it."
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              {isUserMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />
                  <div className={`absolute top-full right-0 mt-1 w-64 p-2 rounded-2xl border shadow-2xl z-50 animate-in fade-in slide-in-from-top-1 duration-200 ${getDropdownTheme(theme).container}`}>
                    <div className="p-3 border-b border-current/10 mb-1">
                      <p className="text-xs font-black uppercase tracking-wider truncate">{user.name}</p>
                      <p className="text-[9px] font-bold opacity-50 truncate">{user.email}</p>
                    </div>

                    <button 
                      onClick={() => {
                        setCloudSyncMode('setup');
                        setShowCloudSyncModal(true);
                        setIsUserMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors group ${getDropdownTheme(theme).itemHover}`}
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${getDropdownTheme(theme).iconBg}`}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
                      </div>
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider">Cloud Sync Settings</div>
                        <div className="text-[9px] opacity-50 mt-0.5">Manage your auto-backups</div>
                      </div>
                    </button>

                    {user && (
                      <a 
                        href={cloudDriveUrl || '#'}
                        target={cloudDriveUrl ? "_blank" : "_self"}
                        rel="noopener noreferrer"
                        onClick={(e) => { if (!cloudDriveUrl) e.preventDefault(); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors group ${!cloudDriveUrl ? 'opacity-50 cursor-not-allowed' : ''} ${getDropdownTheme(theme).itemHover}`}
                      >
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${getDropdownTheme(theme).iconBg}`}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                        </div>
                        <div>
                          <div className="text-xs font-bold uppercase tracking-wider">
                            {cloudDriveUrl ? "Manage Cloud Backup" : (cloudDriveError ? "Drive Link Error" : "Connecting to Drive...")}
                          </div>
                          <div className="text-[9px] opacity-50 mt-0.5">
                            {cloudDriveUrl ? "Open Google Drive folder" : (cloudDriveError ? "Try backing up first" : "Please wait...")}
                          </div>
                        </div>
                      </a>
                    )}

                    <div className={`h-px w-full my-1 ${getDropdownTheme(theme).divider}`} />

                    <button 
                      onClick={handleSignOut}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors group ${getDropdownTheme(theme).itemHover}`}
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${getDropdownTheme(theme).iconBg}`}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                      </div>
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider">Sign Out</div>
                        <div className="text-[9px] opacity-50 mt-0.5">Logout of your account</div>
                      </div>
                    </button>

                    <div className={`h-px w-full my-1 ${getDropdownTheme(theme).divider}`} />

                    <button 
                      onClick={handleDeleteCloudData}
                      disabled={isDeletingAccount}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors group ${getDropdownTheme(theme).itemHover} disabled:opacity-50`}
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${getDropdownTheme(theme).iconBg}`}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </div>
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider">{isDeletingAccount ? "Processing..." : "Clear Cloud Storage"}</div>
                        <div className="text-[9px] opacity-50 mt-0.5">Delete Drive backup folder</div>
                      </div>
                    </button>

                    <button 
                      onClick={() => { setIsUserMenuOpen(false); setShowDeleteConfirm(true); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors group ${getDropdownTheme(theme).itemHover}`}
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${theme === 'coldest' ? 'bg-red-500 text-white' : 'bg-red-500/10 group-hover:bg-red-500/20'}`}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                      </div>
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider">Delete Account & Data</div>
                        <div className="text-[9px] opacity-50 mt-0.5">Permanent wipe of everything</div>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Top Promotional Banner */}
      <div 
        className={`w-full h-8 flex items-center justify-center bg-black/10 backdrop-blur-md border-b border-white/5 z-[60] text-current text-[10px] font-black uppercase tracking-[0.4em] select-none overflow-hidden relative group`}
      >
        <div className="relative z-10 flex items-center gap-1">
          <span className="opacity-70">Best </span>
          <a 
            href="https://www.youtube.com/channel/UC8gMzSxHRWzMzfIjdcqKvQw" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-red-500 transition-colors underline decoration-red-500/30 underline-offset-4"
          >
            Beats
          </a>
          <span className="opacity-70"> in the Universe</span>
        </div>
        <div className="absolute inset-0 bg-white/5 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
      </div>

      <div className={theme === 'crazy-bird' ? 'contents' : 'hidden'}>
        <AvianField />
      </div>

      <AnimatePresence mode="wait">
        <React.Suspense fallback={null}>
          {theme === 'hustle-time' && (
            <motion.div
              key="hustle-bg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
              className="fixed inset-0 z-0"
            >
              <LeprechaunField />
            </motion.div>
          )}
          {showGuide && <DAWGuide theme={theme} onClose={() => setShowGuide(false)} />}
        </React.Suspense>
      </AnimatePresence>
      
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden ${theme === 'light' ? 'bg-white border-black/10 text-black' : 'bg-zinc-900 border-white/10 text-white'}`}>
            <div className="p-6 border-b border-current/10">
              <h2 className="text-xl font-black uppercase tracking-wider text-red-500 mb-2">Delete Account & Data</h2>
              <p className="text-sm opacity-80 leading-relaxed">
                You are about to permanently delete your Beatgangsta account. This action is irreversible and will perform the following:
              </p>
              <ul className="mt-4 space-y-2 text-xs opacity-90 list-disc list-inside">
                <li>Remove all saved beats, plugins, and gear from Google Drive.</li>
                <li>Wipe all local browser data and settings.</li>
                <li>Revoke Beatgangsta's access to your Google account.</li>
                <li>Sign you out completely.</li>
              </ul>
            </div>
            <div className="p-4 flex gap-3 justify-end bg-black/5">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeletingAccount}
                className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border border-current/20 hover:bg-current/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeletingAccount}
                className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isDeletingAccount ? "Deleting..." : "Yes, Delete Everything"}
              </button>
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showCloudSyncModal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-xl"
          >
            <React.Suspense fallback={null}>
              <CloudSyncModal
                theme={theme}
                mode={cloudSyncMode}
                user={user}
                onGoogleSignIn={handleGoogleSignIn}
                initialPreferences={autoBackupPrefs}
                onSavePreferences={handleSaveCloudPrefs}
                onManualAction={handleExecuteCloudSync}
                onClose={() => setShowCloudSyncModal(false)}
                isProcessing={isCloudSyncing}
              />
            </React.Suspense>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showVault && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/60 backdrop-blur-xl"
          >
            <React.Suspense fallback={null}>
              <Vault 
                theme={theme} 
                recipes={vault} 
                critiques={savedCritiques}
                folders={folders}
                onClose={() => {
                  setShowVault(false);
                  setFriendMode(false);
                  setImportedSaveFile(null);
                }} 
                onRemove={removeFromVault} 
                onRemoveCritique={removeFromSavedCritique}
                onUpdateColor={updateVaultColor}
                onUpdateFolder={updateVaultFolder}
                onAddFolder={addFolder}
                onRemoveFolder={removeFolder}
                onUpdateFolderColor={updateFolderColor}
                onShare={handleShareSession}
                onExportRig={handleExportRigFile}
                onImportRig={handleImportRig}
                onImportGear={handleImportGear}
                allPlugins={plugins}
                userName={user?.name || "BeatGangsta Producer"}
                friendMode={friendMode}
                importedSaveFile={importedSaveFile}
                onReplicateRecipe={handleReplicateRecipe}
                isReplicating={loading}
                onOpen={(r) => {
                  setViewingRecipe(r);
                }}
                onOpenCritique={(c) => {
                  setCritiques([c]);
                  setShowVault(false);
                }}
              />
            </React.Suspense>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingRecipe && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-xl"
          >
            <React.Suspense fallback={null}>
              <RecipeViewerModal 
                recipe={vault.find(r => r.id === viewingRecipe.id) || viewingRecipe} 
                theme={theme}
                onClose={() => setViewingRecipe(null)}
                plugins={plugins}
                analogHardware={analogHardware}
                drumKits={drumKits}
                dawType={dawType}
                onCloudBackupRecipe={handleCloudBackupRecipe}
              />
            </React.Suspense>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeSession && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-xl"
          >
            <React.Suspense fallback={null}>
              <CollaborationModal 
                session={activeSession} 
                myPlugins={plugins} 
                onClose={() => setActiveSession(null)} 
                thinkingLevel={thinkingLevel}
              />
            </React.Suspense>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Context Menu */}
      {contextMenu && (
        <div 
          className="fixed z-[1000] bg-red-950 border border-red-500/50 rounded-xl shadow-[0_0_30px_rgba(239,68,68,0.3)] py-2 min-w-[180px] animate-in fade-in zoom-in duration-200 backdrop-blur-md"
          style={{ 
            top: contextMenu.y > window.innerHeight - 100 ? contextMenu.y - 60 : contextMenu.y, 
            left: contextMenu.x > window.innerWidth - 170 ? contextMenu.x - 160 : contextMenu.x 
          }}
        >
          <button 
            onClick={() => {
              setShowPasscodeModal(true);
              setContextMenu(null);
            }}
            className="w-full px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-white hover:bg-red-600 transition-all flex items-center gap-3"
          >
            <span className="text-sm">🐦</span> Enter Bird Code
          </button>
          {m_act && (
            <button 
              onClick={() => {
                localStorage.removeItem('_mv');
                setM_act(false);
                setContextMenu(null);
              }}
              className="w-full px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-red-400 hover:bg-red-600 hover:text-white transition-all flex items-center gap-3 border-t border-red-500/20"
            >
              <span className="text-sm">🚫</span> {_d('RGlzYWJsZSBNYXN0ZXI=')}
            </button>
          )}
        </div>
      )}

      {showPasteModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className={`w-full max-w-2xl p-8 sm:p-10 rounded-[3rem] border shadow-2xl relative ${theme === 'coldest' ? 'bg-white border-sky-100' : 'bg-[#111] text-white border-white/10'}`}>
            <button 
              onClick={() => setShowPasteModal(false)}
              className={`absolute top-6 right-6 p-2 rounded-full transition-colors ${theme === 'coldest' ? 'hover:bg-slate-100' : 'hover:bg-white/10'}`}
            >
              <X className="w-5 h-5 opacity-50 hover:opacity-100" />
            </button>
            <div className="text-center mb-8">
              <h2 className={`text-3xl font-black tracking-tighter ${theme === 'coldest' ? 'text-slate-800' : 'text-white'}`}>Paste Plugin List</h2>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">One plugin per line</p>
            </div>
            <textarea 
              value={csvInput}
              onChange={(e) => setCsvInput(e.target.value)}
              placeholder={"Waves - CLA-76\nFabFilter - Pro-Q 3\nSoundtoys - Decapitator"}
              className={`w-full h-64 p-6 rounded-3xl text-sm font-medium focus:outline-none transition-all border-2 mb-6 ${theme === 'coldest' ? 'bg-slate-50 border-slate-100 focus:border-sky-400 text-slate-900' : 'bg-black/40 border-white/10 focus:border-white/30 text-white'}`}
            />
            <button 
              onClick={async () => {
                if (csvInput.trim()) {
                  setShowPasteModal(false);
                  await parsePlugins(csvInput);
                }
              }}
              disabled={!csvInput.trim() || !isVerified}
              className={`w-full py-5 rounded-full font-black text-xs uppercase tracking-[0.3em] shadow-xl active:scale-95 transition-all disabled:opacity-50 ${theme === 'coldest' ? 'bg-sky-500 text-white hover:bg-sky-600' : 'bg-white text-black hover:bg-gray-100'}`}
            >
              {isVerified ? 'Analyze List' : 'Verify Below First'}
            </button>
          </div>
        </div>
      )}

      {/* Passcode Modal */}
      {showPasscodeModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-red-950 border-4 border-red-600 rounded-[3rem] p-10 shadow-[0_0_80px_rgba(239,68,68,0.4)] space-y-8 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-red-600/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-red-600/20 rounded-full blur-3xl" />
            
            <div className="text-center space-y-3 relative z-10">
              <div className="text-5xl animate-bounce">🐦</div>
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">Crazy Bird Protocol</h2>
              <p className="text-[10px] font-black text-red-400 uppercase tracking-[0.2em]">Enter the secret bird sequence</p>
            </div>

            <div className="flex justify-center gap-3 relative z-10">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div 
                  key={i}
                  className={`w-12 h-16 rounded-2xl border-4 flex items-center justify-center text-2xl font-black transition-all ${passcode.length > i ? 'border-red-500 bg-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)]' : 'border-red-900/50 text-red-900/30'}`}
                >
                  {passcode.length > i ? '🐦' : ''}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-4 relative z-10">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, '✓'].map((val) => (
                <button
                  key={val.toString()}
                  onClick={() => {
                    if (val === 'C') setPasscode('');
                    else if (val === '✓') handlePasscodeSubmit();
                    else if (passcode.length < 6) setPasscode(prev => prev + val);
                  }}
                  className={`h-16 rounded-3xl font-black text-2xl transition-all active:scale-95 flex items-center justify-center ${
                    typeof val === 'number' 
                      ? 'bg-red-900/20 text-white border-2 border-red-800/50 hover:bg-red-600 hover:border-red-400' 
                      : val === 'C' 
                        ? 'bg-black text-red-500 border-2 border-red-900 hover:bg-red-950' 
                        : 'bg-white text-red-600 border-2 border-white hover:bg-red-50'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>

            <button 
              onClick={() => setShowPasscodeModal(false)}
              className="w-full py-4 text-[11px] font-black uppercase tracking-[0.4em] text-red-500/50 hover:text-white transition-all relative z-10"
            >
              Abort Flight
            </button>
          </div>
        </div>
      )}

      {m_act && (
        <div className="fixed bottom-4 left-4 z-[100] px-4 py-2 bg-sky-500 text-black text-[10px] font-black uppercase tracking-widest rounded-full shadow-[0_0_20px_rgba(14,165,233,0.5)] animate-pulse">
          {_d('TWFzdGVyIE1vZGUgQWN0aXZl')}
        </div>
      )}

      <AnimatePresence>
        {showUnlockPopup && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl"
          >
             <div className="text-center p-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-[5rem] shadow-[0_0_100px_rgba(234,179,8,0.5)] border-4 border-white/20">
                <div className="mb-8 flex justify-center scale-150">
                  <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center animate-bounce">
                    <Sparkles className="w-10 h-10 text-white" />
                  </div>
                </div>
                <h2 className="text-6xl font-black text-white tracking-tighter mb-4 uppercase italic">Secret Theme Unlocked!</h2>
                <p className="text-2xl font-bold text-yellow-100 mb-10 tracking-tight">Hustle Time has begun.</p>
                <button 
                  onClick={() => {
                    setShowUnlockPopup(false);
                    setShowChefUnlockPopup(true);
                  }}
                  className="bg-white text-yellow-600 font-black px-12 py-5 rounded-full shadow-2xl uppercase tracking-[0.4em] text-sm hover:scale-105 transition-all active:scale-95"
                >
                  Let's Get The Gold
                </button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showModeInfo && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className={`w-full max-w-md p-10 rounded-[3rem] border shadow-2xl relative ${theme === 'coldest' ? 'bg-white border-sky-100' : 'bg-[#111] text-white border-white/10'}`}
            >
              <button 
                onClick={() => setShowModeInfo(false)}
                className={`absolute top-6 right-6 p-2 rounded-full transition-colors ${theme === 'coldest' ? 'hover:bg-slate-100' : 'hover:bg-white/10'}`}
              >
                <X className="w-5 h-5 opacity-50 hover:opacity-100" />
              </button>
              <div className="text-center mb-8">
                <h2 className={`text-3xl font-black tracking-tighter ${theme === 'coldest' ? 'text-slate-800' : 'text-white'}`}>Mode Select</h2>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">Choose your workflow</p>
              </div>
              <div className="space-y-6">
                <div className={`p-6 rounded-3xl border ${theme === 'coldest' ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}>
                  <h3 className={`text-lg font-black mb-2 flex items-center gap-2 ${theme === 'coldest' ? 'text-slate-800' : 'text-white'}`}>
                    🎹 BeatGangsta
                  </h3>
                  <p className={`text-sm font-medium ${theme === 'coldest' ? 'text-slate-600' : 'text-white/70'}`}>
                    Generates full beat recipes (drums, bass, synths, etc.). 
                    <br/><br/>
                    <span className="font-bold text-orange-500">Pro Tip:</span> You can always add a GangstaVox vocal chain to any beat recipe later by clicking the "🎤 Show GangstaVox Guide" button on the recipe card!
                  </p>
                </div>
                <div className={`p-6 rounded-3xl border ${theme === 'coldest' ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}>
                  <h3 className={`text-lg font-black mb-2 flex items-center gap-2 ${theme === 'coldest' ? 'text-slate-800' : 'text-white'}`}>
                    🎤 GangstaVox
                  </h3>
                  <p className={`text-sm font-medium ${theme === 'coldest' ? 'text-slate-600' : 'text-white/70'}`}>
                    Generates <span className="font-bold text-sky-500">vocal chains only</span>. Perfect when you already have a beat and just need the craziest vocal mix recipe for your specific plugins and hardware.
                  </p>
                </div>
                <button 
                  onClick={() => setShowModeInfo(false)}
                  className={`w-full py-4 rounded-full font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all ${theme === 'coldest' ? 'bg-slate-800 text-white' : 'bg-white text-black'}`}
                >
                  Got it
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showFriendsInfo && (
          <React.Suspense fallback={null}>
            <FriendsInfoModal 
              theme={theme} 
              onClose={() => setShowFriendsInfo(false)} 
            />
          </React.Suspense>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSaberPicker && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[250] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl"
          >
             <div className="bg-[#111] border-2 border-yellow-500/30 p-10 rounded-[4rem] text-center shadow-[0_0_50px_rgba(234,179,8,0.2)] flex flex-col md:flex-row items-center gap-12 max-w-4xl w-full">
                <div className="flex flex-col items-center gap-6 flex-1">
                  <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">Forge Your Blade</h2>
                  <div className="custom-color-picker flex justify-center">
                    <CustomColorWheel 
                      color={saberColor} 
                      onChange={setSaberColor}
                      size={240}
                    />
                  </div>
                  <button 
                    onClick={() => setShowSaberPicker(false)}
                    className="bg-yellow-500 text-black font-black px-8 py-3 rounded-full uppercase text-xs tracking-widest hover:scale-105 active:scale-95 transition-all w-full"
                  >
                    Ignite Blade
                  </button>
                </div>
                <div className="bg-black/40 p-8 rounded-[3rem] border border-white/5 flex-1 flex items-center justify-center min-h-[300px]">
                  <Logo size={240} grillStyle={grillStyle} knifeStyle={knifeStyle} duragStyle={duragStyle} pendantStyle={pendantStyle} chainStyle={chainStyle} theme={theme} saberColor={saberColor} mascotColor={mascotColor} showChain={showChain} highEyes={highEyes} isCigarEquipped={isCigarEquipped} isTossingCigar={isTossingCigar} showSparkles={showSparkles} />
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showMascotColorPicker && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[250] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl"
          >
             <div className="bg-[#111] border-2 border-sky-500/30 p-10 rounded-[4rem] text-center shadow-[0_0_50px_rgba(14,165,233,0.2)] flex flex-col md:flex-row items-center gap-12 max-w-4xl w-full">
                <div className="flex flex-col items-center gap-6 flex-1">
                  <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">Mascot Hue</h2>
                  <div className="custom-color-picker flex justify-center">
                    <CustomColorWheel 
                      color={mascotColor} 
                      onChange={setMascotColor}
                      size={240}
                    />
                  </div>
                  <button 
                    onClick={() => setShowMascotColorPicker(false)}
                    className="bg-sky-500 text-white font-black px-8 py-3 rounded-full uppercase text-xs tracking-widest hover:scale-105 active:scale-95 transition-all w-full"
                  >
                    Apply Hue
                  </button>
                  <button 
                    onClick={() => setMascotColor('#3b82f6')}
                    className="bg-white/10 text-white font-black px-8 py-3 rounded-full uppercase text-xs tracking-widest hover:bg-white/20 hover:scale-105 active:scale-95 transition-all w-full"
                  >
                    Default Hue
                  </button>
                </div>
                <div className="bg-black/40 p-8 rounded-[3rem] border border-white/5 flex-1 flex items-center justify-center min-h-[300px]">
                  <Logo size={240} grillStyle={grillStyle} knifeStyle={knifeStyle} duragStyle={duragStyle} pendantStyle={pendantStyle} chainStyle={chainStyle} theme={theme} saberColor={saberColor} mascotColor={mascotColor} showChain={showChain} highEyes={highEyes} isCigarEquipped={isCigarEquipped} isTossingCigar={isTossingCigar} showSparkles={showSparkles} />
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSignUpModal && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-xl"
          >
            <div className={`w-full max-w-md p-10 rounded-[3rem] border shadow-2xl relative ${theme === 'coldest' ? 'bg-white' : 'bg-[#111] text-white border-red-900/40'}`}>
               <button 
                 onClick={() => setShowSignUpModal(false)}
                 className="absolute top-6 right-6 p-2 rounded-full hover:bg-black/5 transition-colors"
               >
                 <X className="w-5 h-5 opacity-50 hover:opacity-100" />
               </button>
               <div className="text-center mb-8">
                  <Logo size={80} grillStyle={grillStyle} knifeStyle={knifeStyle} duragStyle={duragStyle} pendantStyle={pendantStyle} chainStyle={chainStyle} theme={theme} saberColor={saberColor} mascotColor={mascotColor} showChain={showChain} highEyes={highEyes} isCigarEquipped={isCigarEquipped} isTossingCigar={isTossingCigar} onClick={cycleGrill} />
                  <h2 className="text-3xl font-black tracking-tighter mt-4">Join the Club</h2>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">Make a profile to save beats</p>
               </div>
               <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-2 block">Choose a name</label>
                    <input 
                      type="text" 
                      value={tempUsername} 
                      onChange={(e) => setTempUsername(e.target.value)}
                      className="w-full bg-black/5 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 outline-none transition-all"
                      placeholder="Producer name..."
                    />
                  </div>
                  <button 
                    onClick={handleSignIn}
                    className="w-full bg-orange-500 text-white font-black py-4 rounded-full shadow-lg shadow-orange-900/20 active:scale-95 transition-all uppercase text-xs tracking-widest"
                  >
                    Join Now
                  </button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className={`sticky top-16 z-50 px-6 py-4 border-b transition-all duration-500 ${mainBlurClass} shadow-lg ${theme === 'coldest' ? 'bg-white/20 border-white/30' : theme === 'crazy-bird' ? 'bg-black/30 border-red-900/40' : 'bg-black/30 border-yellow-900/40'}`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Logo size={42} grillStyle={grillStyle} knifeStyle={knifeStyle} duragStyle={duragStyle} pendantStyle={pendantStyle} chainStyle={chainStyle} theme={theme} saberColor={saberColor} mascotColor={mascotColor} showChain={showChain} highEyes={highEyes} isCigarEquipped={isCigarEquipped} isTossingCigar={isTossingCigar} showSparkles={showSparkles} onClick={cycleGrill} />
            <DownloadableLogoText currentAppName={currentAppName} theme={theme} />
          </div>
          
          <div className="hidden sm:flex flex-wrap items-center justify-end gap-2">
            <button onClick={cycleGrill} className={`${actionBtnClasses} ${themedBtnClasses}`}>
              <Gem size={16} /> {grillLabel}
            </button>
            
            <button onClick={cycleKnife} className={`${actionBtnClasses} ${themedBtnClasses}`}>
              <Sword size={16} /> {knifeLabel}
            </button>

            {h_act && (
              <>
                <button onClick={cycleDurag} className={`${actionBtnClasses} ${themedBtnClasses}`}>
                  <UserIcon size={16} /> {duragLabel}
                </button>

                <button onClick={() => setShowChain(!showChain)} className={`${actionBtnClasses} ${showChain ? getThemeActiveClasses(theme) : themedBtnClasses}`}>
                  <Link size={16} /> {showChain ? 'Chain On' : 'Chain Off'}
                </button>

                {showChain && (
                  <>
                    <button onClick={cycleChain} className={`${actionBtnClasses} ${themedBtnClasses}`}>
                      <Link2 size={16} /> {chainStyle === 'silver' ? 'Silver Chain' : chainStyle === 'gold' ? 'Gold Chain' : chainStyle === 'rose-gold' ? 'Rose Gold Chain' : chainStyle === 'diamond' ? 'Diamond Chain' : 'Blue Diamond Chain'}
                    </button>
                    <button onClick={cyclePendant} className={`${actionBtnClasses} ${themedBtnClasses}`}>
                      <Sparkles size={16} /> {pendantStyle === 'silver' ? 'Silver Pendant' : pendantStyle === 'gold' ? 'Gold Pendant' : pendantStyle === 'rose-gold' ? 'Rose Gold Pendant' : pendantStyle === 'diamond' ? 'Diamond Pendant' : 'Blue Diamond Pendant'}
                    </button>
                  </>
                )}

                <button 
                  onClick={toggleHighEyes} 
                  onContextMenu={handleContextMenu}
                  className={`${actionBtnClasses} ${highEyes ? getThemeActiveClasses(theme) : themedBtnClasses}`}
                >
                  <Eye size={16} /> {highEyes ? 'Sober Up' : 'Get High'}
                </button>

                <button onClick={handleCigarToggle} className={`${actionBtnClasses} ${isCigarEquipped ? getThemeActiveClasses(theme) : themedBtnClasses}`}>
                  <CigarIcon size={16} className={isCigarEquipped ? "animate-pulse" : ""} /> {isCigarEquipped ? 'Toss Blunt' : 'Got Blunt?'}
                </button>

                <button onClick={() => setShowMascotColorPicker(true)} className={`${actionBtnClasses} ${themedBtnClasses}`}>
                  <Palette size={16} /> Mascot Hue
                </button>

                <button onClick={() => setShowAboutModal(true)} className={`${actionBtnClasses} ${themedBtnClasses}`}>
                  <Info size={16} /> About
                </button>

                {knifeStyle === 'samuels-saber' && (
                  <button onClick={() => setShowSaberPicker(true)} className={`${actionBtnClasses} ${getThemeActiveClasses(theme)}`}>
                    <Sword size={16} /> Forge Blade
                  </button>
                )}
              </>
            )}

            <button onClick={toggleTheme} className={`${actionBtnClasses} ${theme === 'coldest' ? 'bg-white/60 border-sky-200 text-[#0c4a6e]' : theme === 'crazy-bird' ? 'bg-red-600 border-red-500 text-white hover:bg-red-500' : 'bg-yellow-600 border-yellow-500 text-white'}`}>
              {theme === 'coldest' ? 'Coldest' : theme === 'crazy-bird' ? 'Crazy Bird' : 'Hustle Mode'}
            </button>
          </div>
        </div>
      </header>

      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-[100] flex flex-col">
        {h_act && (
          <div className={`px-4 py-3 flex gap-4 overflow-x-auto no-scrollbar items-center border-t ${mainBlurClass} animate-in slide-in-from-bottom-full duration-500 ${theme === 'coldest' ? 'bg-white/60 border-slate-200' : 'bg-black/80 border-red-900/30'}`}>
            <button 
              onClick={cycleDurag} 
              className={`${mobileTrayBtnClasses} ${duragStyle !== 'standard' ? 'bg-emerald-600 text-white border-emerald-400 shadow-lg' : themedBtnClasses}`}
            >
              <UserIcon size={16} /> {duragLabel}
            </button>

            <button 
              onClick={() => setShowChain(!showChain)} 
              className={`${mobileTrayBtnClasses} ${showChain ? getThemeActiveClasses(theme) : themedBtnClasses}`}
            >
              <Link size={16} /> {showChain ? 'Chain On' : 'Chain Off'}
            </button>

            {showChain && (
              <>
                <button 
                  onClick={cycleChain} 
                  className={`${mobileTrayBtnClasses} ${themedBtnClasses}`}
                >
                  <Link2 size={16} /> {chainStyle === 'silver' ? 'Silver Chain' : chainStyle === 'gold' ? 'Gold Chain' : chainStyle === 'rose-gold' ? 'Rose Gold Chain' : chainStyle === 'diamond' ? 'Diamond Chain' : 'Blue Diamond Chain'}
                </button>
                <button 
                  onClick={cyclePendant} 
                  className={`${mobileTrayBtnClasses} ${themedBtnClasses}`}
                >
                  <Sparkles size={16} /> {pendantStyle === 'silver' ? 'Silver Pendant' : pendantStyle === 'gold' ? 'Gold Pendant' : pendantStyle === 'rose-gold' ? 'Rose Gold Pendant' : pendantStyle === 'diamond' ? 'Diamond Pendant' : 'Blue Diamond Pendant'}
                </button>
              </>
            )}

            {knifeStyle === 'samuels-saber' && (
              <button onClick={() => setShowSaberPicker(true)} className={`${mobileTrayBtnClasses} ${getThemeActiveClasses(theme)}`}><Sword size={16} /> Forge Blade</button>
            )}
            
            <button 
              onClick={toggleHighEyes} 
              onContextMenu={handleContextMenu}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onTouchMove={handleTouchMove}
              className={`${mobileTrayBtnClasses} select-none ${highEyes ? getThemeActiveClasses(theme) : themedBtnClasses}`}
            >
              <Eye size={16} /> {highEyes ? 'Sober Up' : 'Get High'}
            </button>
            <button onClick={handleCigarToggle} className={`${mobileTrayBtnClasses} select-none ${isCigarEquipped ? getThemeActiveClasses(theme) : themedBtnClasses}`}>
              <CigarIcon size={16} /> {isCigarEquipped ? 'Toss Blunt' : 'Got Blunt?'}
            </button>
            <button onClick={() => setShowMascotColorPicker(true)} className={`${mobileTrayBtnClasses} ${themedBtnClasses}`}>
              <Palette size={16} /> Mascot Hue
            </button>
          </div>
        )}
        <div className={`border-t transition-all duration-500 ${mainBlurClass} shadow-2xl ${theme === 'coldest' ? 'bg-white/80 border-slate-200 text-slate-800' : 'bg-black/90 border-red-900/50 text-red-50'}`}>
          <div className="flex items-stretch justify-around h-20 px-4">
            <button onClick={cycleGrill} className={mobileToolbarBtnClasses}><span className="text-xl">💎</span><span className="text-[9px] font-black uppercase truncate max-w-[80px]">{grillLabel}</span></button>
            <button onClick={cycleKnife} className={mobileToolbarBtnClasses}><span className="text-xl">🔪</span><span className="text-[9px] font-black uppercase truncate max-w-[80px]">{knifeLabel}</span></button>
            <button onClick={toggleTheme} className={mobileToolbarBtnClasses}><span className="text-xl">{theme === 'coldest' ? '❄️' : theme === 'crazy-bird' ? '🐦' : '💰'}</span><span className="text-[9px] font-black uppercase truncate max-w-[80px]">Theme</span></button>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-4 sm:py-12 relative z-10">
        <div className="absolute top-4 left-6 sm:top-6 sm:left-6 z-40 pointer-events-none w-full flex items-center gap-2">
            <button 
              id="btn-vault"
              onClick={() => setShowVault(true)}
              className={`pointer-events-auto relative flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full border shadow-xl transition-all hover:scale-105 active:scale-95 group ${mainBlurClass} ${theme === 'coldest' ? 'bg-white/40 border-sky-100 text-sky-800' : 'bg-black/40 border-white/10 text-white'}`}
            >
               <FolderIcon size={16} />
               <span className="text-[10px] font-black uppercase tracking-[0.2em]">Vault</span>
               {vault.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-sky-500 text-white rounded-full flex items-center justify-center text-[8px] font-black shadow-lg border-2 border-white">{vault.length}</span>}
            </button>

            <button 
              id="btn-rig"
              onClick={() => setShowRigUI(true)}
              className={`pointer-events-auto flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full border shadow-xl transition-all hover:scale-105 active:scale-95 group ${mainBlurClass} ${theme === 'coldest' ? 'bg-white/40 border-sky-100 text-sky-800' : 'bg-black/40 border-white/10 text-white'}`}
            >
               <Cpu size={16} />
               <span className="text-[10px] font-black uppercase tracking-[0.2em]">Rig</span>
            </button>
        </div>

        {error && <div className="mb-8 p-4 bg-red-900/20 border border-red-500/50 rounded-2xl text-red-400 text-sm font-bold text-center">{error}</div>}
        
        {isEnrichingLibrary ? (
          <div className="max-w-3xl mx-auto mt-16 sm:mt-12 animate-in fade-in zoom-in duration-1000">
            <div className={`p-8 sm:p-16 transition-all ${mainBlurClass} border rounded-[3rem] sm:rounded-[4rem] shadow-2xl flex flex-col items-center text-center ${theme === 'coldest' ? 'bg-white/30 border-white/40' : 'bg-black/40 border-white/10'}`}>
              <Logo size={160} grillStyle={grillStyle} knifeStyle={knifeStyle} duragStyle={duragStyle} pendantStyle={pendantStyle} chainStyle={chainStyle} theme={theme} saberColor={saberColor} mascotColor={mascotColor} showChain={showChain} highEyes={highEyes} isCigarEquipped={isCigarEquipped} isTossingCigar={isTossingCigar} showSparkles={showSparkles} onClick={cycleGrill} />
              
              <h2 className={`text-3xl sm:text-4xl font-black tracking-tighter mt-8 mb-4 ${theme === 'coldest' ? 'text-slate-800' : 'text-white'}`}>
                Building Your Library...
              </h2>
              
              <p className={`text-sm font-bold mb-8 max-w-md ${theme === 'coldest' ? 'text-slate-600' : 'text-slate-400'}`}>
                We're researching your unique plugins to find out what makes them special. This is a lot of work, but we'll automatically save your library so you won't have to do this again until you get new plugins!
              </p>

              <div className="w-full max-w-md bg-black/10 rounded-full h-4 mb-4 overflow-hidden relative">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ease-out ${theme === 'coldest' ? 'bg-sky-500' : 'bg-white'}`}
                  style={{ width: `${enrichProgress}%` }}
                />
              </div>
              
              <div className="flex justify-between w-full max-w-md text-xs font-black uppercase tracking-widest opacity-60">
                <span>{enrichProgress}% Complete</span>
                <span>~{enrichEta}s remaining</span>
              </div>

              {enrichStatus && (
                <div className={`mt-6 text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full border ${theme === 'coldest' ? 'bg-slate-100 border-slate-200 text-slate-500' : 'bg-white/5 border-white/10 text-white/40'}`}>
                  {enrichStatus}
                </div>
              )}
            </div>
          </div>
        ) : plugins.length === 0 && !isEnrichingLibrary && !hasRestoredBackup ? (
          <div className="max-w-3xl mx-auto mt-16 sm:mt-12 animate-in fade-in zoom-in duration-1000">
            <div className={`relative p-6 sm:p-12 transition-all ${mainBlurClass} border rounded-[3rem] sm:rounded-[4rem] shadow-2xl ${theme === 'coldest' ? 'bg-white/30 border-white/40' : 'bg-black/40 border-white/10'}`}>
              <div className="flex flex-col items-center mb-10 text-center relative z-10">
                <div className="relative z-30">
                  <Logo size={240} grillStyle={grillStyle} knifeStyle={knifeStyle} duragStyle={duragStyle} pendantStyle={pendantStyle} chainStyle={chainStyle} theme={theme} saberColor={saberColor} mascotColor={mascotColor} showChain={showChain} highEyes={highEyes} isCigarEquipped={isCigarEquipped} isTossingCigar={isTossingCigar} showSparkles={showSparkles} onClick={cycleGrill} />
                </div>
                <h2 className={`text-3xl sm:text-5xl font-black tracking-tighter select-none mt-8 ${theme === 'coldest' ? 'text-slate-800' : 'text-white'}`}>
                  {highEyes ? "Let's get high!" : theme === 'hustle-time' ? "Secure the bag!" : theme === 'crazy-bird' ? "Lesgo 2 da top!" : theme === 'coldest' ? (
                    <>Produce the <span className="coldest-text-glow">coldest</span> beats in the streets.</>
                  ) : "Let's go to the top!"}
                </h2>
                {theme === 'coldest' && !highEyes && (
                  <p className="text-sm sm:text-lg font-bold opacity-40 mt-1 text-slate-600 tracking-tight">
                    Only With BeatGangsta
                  </p>
                )}
              </div>
              <div 
                id="dropzone-plugin-import"
                onClick={() => {
                  fileInputRef.current?.click();
                }}
                onDragOver={(e) => {
                  if (window.innerWidth >= 640) handleDragOver(e);
                }}
                onDragLeave={(e) => {
                  if (window.innerWidth >= 640) handleDragLeave(e);
                }}
                onDrop={(e) => {
                  if (window.innerWidth >= 640) handleDrop(e);
                }}
                className={`w-full h-80 p-6 sm:p-8 flex flex-col items-center justify-center text-center transition-all duration-500 outline-none ${mainBlurClass} border shadow-inner rounded-[2rem] sm:rounded-[3rem] cursor-pointer ${isDragging ? 'scale-[1.02] border-sky-500 bg-sky-500/10' : ''} ${theme === 'coldest' ? 'bg-white/40 border-white text-slate-800 hover:bg-white/60' : 'bg-black/60 border-white/10 text-white hover:bg-black/80'}`}
              >
                <div className="text-4xl mb-4 opacity-50">{theme === 'coldest' ? '❄️' : theme === 'crazy-bird' ? '🐦' : '💰'}</div>
                <p className="hidden sm:block text-lg font-black tracking-tight mb-2">
                  {isVerified ? 'Drag & Drop your plugin file here' : 'Verify below to upload'}
                </p>
                <p className="hidden sm:block text-sm font-bold opacity-60 mb-6">
                  {isVerified ? 'or click to browse' : 'Security check required'}
                </p>
                <p className="sm:hidden text-lg font-black tracking-tight mb-6">
                  {isVerified ? 'Tap to upload your plugin file' : 'Verify below to upload'}
                </p>
                <p className="text-xs font-bold opacity-40 uppercase tracking-widest">Click the Help button below to find your file</p>
              </div>
              <div className="flex flex-wrap justify-center items-center gap-3 mt-6">
                <button 
                  id="btn-help"
                  onClick={() => setShowGuide(true)}
                  className={`font-black py-3 px-6 rounded-lg border text-[10px] uppercase tracking-widest transition-all select-none flex items-center justify-center ${theme === 'coldest' ? 'bg-white/80 border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm' : 'bg-white/10 border-white/10 text-white hover:bg-white/20'}`}
                  style={{ height: '52px' }}
                >
                  Help?
                </button>
                <button 
                  onClick={() => setShowPasteModal(true)}
                  className={`font-black py-3 px-6 rounded-lg border text-[10px] uppercase tracking-widest transition-all select-none flex items-center justify-center ${theme === 'coldest' ? 'bg-white/80 border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm' : 'bg-white/10 border-white/10 text-white hover:bg-white/20'}`}
                  style={{ height: '52px' }}
                >
                  Paste List
                </button>
              </div>
              {!isVerified && (
                <div className="flex justify-center mt-6">
                  <div id="tutorial-turnstile" className="flex items-center justify-center overflow-visible" style={{ width: '260px', height: '52px' }}>
                    <div key={verificationSessionId}>
                      <Turnstile
                        sitekey={typeof import.meta.env.VITE_TURNSTILE_SITE_KEY === 'string' ? import.meta.env.VITE_TURNSTILE_SITE_KEY : '0x4AAAAAACkH6-i-na5YIlP9'}
                        onVerify={(token) => {
                          if ((window as any).onUploadSuccess) {
                            (window as any).onUploadSuccess(token);
                          }
                        }}
                        theme={theme === 'coldest' ? 'light' : 'dark'}
                      />
                    </div>
                  </div>
                </div>
              )}
              <input type="file" ref={fileInputRef} className="hidden" accept=".csv,.txt,.ini" onChange={(e) => {
                handleFileUpload(e);
              }} />
            </div>

            {/* How it works section */}
            <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-12 text-center max-w-5xl mx-auto px-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
              <div className="space-y-4 group">
                <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mx-auto transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 ${theme === 'coldest' ? 'bg-sky-500/10 text-sky-500' : theme === 'hustle-time' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/5 text-white/80'}`}>
                  <Cpu size={32} strokeWidth={1.5} />
                </div>
                <h3 className={`text-sm font-black uppercase tracking-[0.2em] ${theme === 'coldest' ? 'text-slate-800' : theme === 'hustle-time' ? 'text-yellow-400' : 'text-white'}`}>Add Your Gear</h3>
                <p className={`text-xs font-medium leading-relaxed ${theme === 'coldest' ? 'text-slate-600 opacity-60' : theme === 'hustle-time' ? 'text-yellow-50 opacity-90' : 'text-slate-300 opacity-60'}`}>
                  Upload your VST plugin list and then select any physical instruments and hardware. BeatGangsta learns your unique studio setup to give you tailored advice.
                </p>
              </div>
              <div className="space-y-4 group">
                <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mx-auto transition-all duration-500 group-hover:scale-110 group-hover:-rotate-3 ${theme === 'coldest' ? 'bg-sky-500/10 text-sky-500' : theme === 'hustle-time' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/5 text-white/80'}`}>
                  <Sparkles size={32} strokeWidth={1.5} />
                </div>
                <h3 className={`text-sm font-black uppercase tracking-[0.2em] ${theme === 'coldest' ? 'text-slate-800' : theme === 'hustle-time' ? 'text-yellow-400' : 'text-white'}`}>AI Architect</h3>
                <p className={`text-xs font-medium leading-relaxed ${theme === 'coldest' ? 'text-slate-600 opacity-60' : theme === 'hustle-time' ? 'text-yellow-50 opacity-90' : 'text-slate-300 opacity-60'}`}>
                  Our AI analyzes your tools to architect perfect beat recipes, vocal chains, and mix critiques specifically for the gear you own.
                </p>
              </div>
              <div className="space-y-4 group">
                <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mx-auto transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 ${theme === 'coldest' ? 'bg-sky-500/10 text-sky-500' : theme === 'hustle-time' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/5 text-white/80'}`}>
                  <Rocket size={32} strokeWidth={1.5} />
                </div>
                <h3 className={`text-sm font-black uppercase tracking-[0.2em] ${theme === 'coldest' ? 'text-slate-800' : theme === 'hustle-time' ? 'text-yellow-400' : 'text-white'}`}>Drop the Fire</h3>
                <p className={`text-xs font-medium leading-relaxed ${theme === 'coldest' ? 'text-slate-600 opacity-60' : theme === 'hustle-time' ? 'text-yellow-50 opacity-90' : 'text-slate-300 opacity-60'}`}>
                  Get instant, actionable production guides. From drum patterns to master chains, we help you finish more music, faster.
                </p>
              </div>
            </div>

            <div className="mt-32 text-center max-w-2xl mx-auto px-6 animate-in fade-in duration-1000 delay-700">
              <div className={`inline-block px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.4em] mb-6 ${theme === 'coldest' ? 'bg-sky-500/10 text-sky-600' : theme === 'hustle-time' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/5 text-white/40'}`}>
                The Mission
              </div>
              <h2 className={`text-2xl sm:text-3xl font-black tracking-tighter mb-6 ${theme === 'coldest' ? 'text-slate-800' : theme === 'hustle-time' ? 'text-yellow-400' : 'text-white'}`}>
                Your studio is unique. Your workflow should be too.
              </h2>
              <p className={`text-sm font-medium leading-relaxed ${theme === 'coldest' ? 'text-slate-600 opacity-60' : theme === 'hustle-time' ? 'text-yellow-50 opacity-90' : 'text-slate-300 opacity-60'}`}>
                BeatGangsta is your AI-powered production architect. It doesn't just give you generic tips; it learns your specific studio—your plugins, your hardware, your DAW—and generates custom recipes to help you build professional-grade beats and vocal chains instantly.
              </p>
            </div>
          </div>
        ) : (!isEnrichingLibrary && plugins.length > 0) || hasRestoredBackup ? (
          <div className="space-y-12 mt-12 sm:mt-0">
            <section className={`relative flex flex-col gap-8 p-6 sm:p-10 transition-colors ${mainBlurClass} border rounded-[3rem] sm:rounded-[4rem] shadow-xl ${theme === 'coldest' ? 'bg-white/20 border-white/30' : 'bg-black/40 border-white/10'}`}>
              <div className="flex flex-col lg:flex-row gap-8 items-center justify-between relative z-10">
                <div className="flex flex-col sm:flex-row items-center gap-0 sm:gap-4 text-center sm:text-left">
                  <div className="relative z-30">
                    <Logo size={240} grillStyle={grillStyle} knifeStyle={knifeStyle} duragStyle={duragStyle} pendantStyle={pendantStyle} chainStyle={chainStyle} theme={theme} saberColor={saberColor} mascotColor={mascotColor} showChain={showChain} highEyes={highEyes} isCigarEquipped={isCigarEquipped} isTossingCigar={isTossingCigar} showSparkles={showSparkles} onClick={cycleGrill} />
                  </div>
                  <div className="flex flex-col justify-center -mt-4 sm:mt-0">
                    <h2 className={`text-4xl sm:text-6xl font-black tracking-tighter select-none ${theme === 'coldest' ? 'text-slate-800' : 'text-white'}`}>Studio Info</h2>
                    <p className="text-sm sm:text-lg font-bold opacity-70 select-none mt-2">Loaded {plugins.length} plugins.</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-4 relative z-30">
                  <div className={`flex items-center p-1 rounded-full backdrop-blur-md border ${
                    theme === 'coldest' ? 'bg-sky-500/10 border-sky-500/20' : 
                    theme === 'crazy-bird' ? 'bg-red-500/20 border-red-500/30' : 
                    theme === 'hustle-time' ? 'bg-emerald-500/20 border-yellow-500/30' : 
                    'bg-white/10 border-white/20'
                  }`}>
                    <button 
                      id="btn-mode-beatgangsta"
                      onClick={() => setIsGangstaVox(false)} 
                      className={`py-3 px-6 rounded-full font-black text-xs select-none transition-all ${
                        !isGangstaVox 
                          ? (theme === 'coldest' ? 'bg-sky-500 text-white shadow-sm' : 
                             theme === 'crazy-bird' ? 'bg-red-600 text-white shadow-sm' : 
                             theme === 'hustle-time' ? 'bg-yellow-500 text-emerald-950 shadow-sm' : 
                             'bg-white/20 text-white shadow-sm') 
                          : (theme === 'coldest' ? 'text-sky-900/60 hover:text-sky-900' : 
                             theme === 'crazy-bird' ? 'text-red-100/60 hover:text-white' : 
                             theme === 'hustle-time' ? 'text-yellow-100/60 hover:text-yellow-400' : 
                             'text-white/50 hover:text-white')
                      }`}
                    >
                      🎹 BeatGangsta
                    </button>
                    <button 
                      id="btn-mode-gangstavox"
                      onClick={() => setIsGangstaVox(true)} 
                      className={`py-3 px-6 rounded-full font-black text-xs select-none transition-all ${
                        isGangstaVox 
                          ? (theme === 'coldest' ? 'bg-sky-500 text-white shadow-sm' : 
                             theme === 'crazy-bird' ? 'bg-red-600 text-white shadow-sm' : 
                             theme === 'hustle-time' ? 'bg-yellow-500 text-emerald-950 shadow-sm' : 
                             'bg-white/20 text-white shadow-sm') 
                          : (theme === 'coldest' ? 'text-sky-900/60 hover:text-sky-900' : 
                             theme === 'crazy-bird' ? 'text-red-100/60 hover:text-white' : 
                             theme === 'hustle-time' ? 'text-yellow-100/60 hover:text-yellow-400' : 
                             'text-white/50 hover:text-white')
                      }`}
                    >
                      🎤 GangstaVox
                    </button>
                    <button 
                      onClick={() => setShowModeInfo(true)}
                      className={`w-8 h-8 mr-1 flex items-center justify-center rounded-full transition-all font-bold text-sm ${
                        theme === 'coldest' ? 'text-sky-900/60 hover:bg-sky-500/20 hover:text-sky-900' : 
                        theme === 'crazy-bird' ? 'text-red-100/60 hover:bg-red-500/20 hover:text-white' : 
                        theme === 'hustle-time' ? 'text-yellow-100/60 hover:bg-yellow-500/20 hover:text-yellow-400' : 
                        'text-white/50 hover:bg-white/20 hover:text-white'
                      }`}
                    >
                      ?
                    </button>
                  </div>
                  <button onClick={handleGenerate} disabled={loading} className={`py-4 px-12 rounded-full font-black text-xs select-none shadow-lg hover:scale-105 active:scale-95 transition-all ${theme === 'coldest' ? 'bg-sky-500 text-white' : 'bg-white text-black'}`}>{loading ? "Architecting..." : "Get Random Recipes"}</button>
                </div>
              </div>

              <div className="h-[1px] bg-current opacity-10" />

              <div className={`flex flex-col gap-4 ${showChain ? '-mt-12' : ''}`}>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1 group overflow-hidden rounded-full">
                    <input 
                      id="input-vibe-search"
                      type="text" 
                      value={typeBeatSearch}
                      onChange={(e) => setTypeBeatSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleTypeBeatSearch()}
                      className={`w-full py-5 pl-8 pr-32 sm:pr-40 rounded-full text-sm font-black focus:outline-none transition-all border-2 ${theme === 'coldest' ? 'bg-white/40 border-sky-100 focus:border-sky-400 text-slate-900' : 'bg-black/60 border-white/10 focus:border-white/30 text-white'}`}
                    />
                    {!typeBeatSearch && (
                      <div className="absolute inset-y-0 left-8 right-32 sm:right-40 flex items-center overflow-hidden pointer-events-none">
                        <div className={`whitespace-nowrap animate-marquee text-sm font-black ${theme === 'coldest' ? 'text-slate-600' : 'text-white/50'}`}>
                          {currentVibeExample}...     {currentVibeExample}...
                        </div>
                      </div>
                    )}
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                      <span className={`text-[10px] font-black uppercase tracking-widest opacity-60 ${theme === 'coldest' ? 'text-slate-900' : 'text-white'}`}>Vibe Search</span>
                    </div>
                  </div>
                  <button 
                    onClick={handleTypeBeatSearch} 
                    disabled={loading || !typeBeatSearch.trim()} 
                    className={`py-5 px-12 rounded-full font-black text-xs select-none shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 ${theme === 'coldest' ? 'bg-orange-500 text-white' : 'bg-white text-black'}`}
                  >
                    {loading ? "Searching..." : "Search Vibe"}
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1 group overflow-hidden rounded-full">
                    <input 
                      id="input-song-search"
                      type="text" 
                      value={songSearch}
                      onChange={(e) => setSongSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSongSearch()}
                      className={`w-full py-5 pl-8 pr-32 sm:pr-40 rounded-full text-sm font-black focus:outline-none transition-all border-2 ${theme === 'coldest' ? 'bg-white/40 border-sky-100 focus:border-sky-400 text-slate-900' : 'bg-black/60 border-white/10 focus:border-white/30 text-white'}`}
                    />
                    {!songSearch && (
                      <div className="absolute inset-y-0 left-8 right-32 sm:right-40 flex items-center overflow-hidden pointer-events-none">
                        <div className={`whitespace-nowrap animate-marquee text-sm font-black ${theme === 'coldest' ? 'text-slate-600' : 'text-white/50'}`}>
                          {currentSongExamples[0]}...     {currentSongExamples[1]}...
                        </div>
                      </div>
                    )}
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                      <span className={`text-[10px] font-black uppercase tracking-widest opacity-60 ${theme === 'coldest' ? 'text-slate-900' : 'text-white'}`}>Song Search</span>
                    </div>
                  </div>
                  <button 
                    onClick={handleSongSearch} 
                    disabled={loading || !songSearch.trim()} 
                    className={`py-5 px-12 rounded-full font-black text-xs select-none shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 ${theme === 'coldest' ? 'bg-sky-600 text-white' : 'bg-white/20 text-white'}`}
                  >
                    {loading ? "Searching..." : "Search Song"}
                  </button>
                </div>
              </div>

              {/* Audio Analysis Search - ALWAYS VISIBLE */}
              <div className="flex flex-col gap-4">
                <div className="flex justify-center mb-2">
                  <div className={`inline-flex rounded-full p-1 ${theme === 'coldest' ? 'bg-white/40' : 'bg-black/40'}`}>
                    <button
                      id="btn-audio-recipe"
                      onClick={() => setAudioMode('recipe')}
                      className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
                        audioMode === 'recipe' 
                          ? (theme === 'coldest' ? 'bg-sky-500 text-white shadow-md' : 'bg-white text-black shadow-md')
                          : (theme === 'coldest' ? 'text-slate-600 hover:text-slate-900' : 'text-white/60 hover:text-white')
                      }`}
                    >
                      {_d('RXh0cmFjdCBSZWNpcGU=')}
                    </button>
                    <button
                      id="btn-audio-critique"
                      onClick={() => setAudioMode('critique')}
                      className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                        audioMode === 'critique' 
                          ? (theme === 'coldest' ? 'bg-purple-500 text-white shadow-md' : 'bg-purple-500 text-white shadow-md')
                          : (theme === 'coldest' ? 'text-slate-600 hover:text-slate-900' : 'text-white/60 hover:text-white')
                      }`}
                    >
                      <span>{_d('TWl4IENyaXRpcXVl')}</span>
                    </button>
                  </div>
                </div>

                {audioMode === 'critique' && !isGangstaVox && (
                  <div className="flex justify-center mb-2">
                    <div className={`inline-flex items-center gap-3 rounded-full px-4 py-2 ${theme === 'coldest' ? 'bg-white/40' : 'bg-black/40'}`}>
                      <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${!hasStems ? (theme === 'coldest' ? 'text-slate-900' : 'text-white') : (theme === 'coldest' ? 'text-slate-500' : 'text-white/50')}`}>MP3 Only</span>
                      
                      <button 
                        onClick={() => setHasStems(!hasStems)}
                        className={`relative w-10 h-5 rounded-full transition-colors ${hasStems ? 'bg-purple-500' : 'bg-slate-400/50'}`}
                      >
                        <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${hasStems ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                      
                      <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${hasStems ? (theme === 'coldest' ? 'text-slate-900' : 'text-white') : (theme === 'coldest' ? 'text-slate-500' : 'text-white/50')}`}>I Have Stems</span>
                    </div>
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <div 
                    id="dropzone-audio"
                    onClick={() => audioInputRef.current?.click()}
                    onDragOver={handleAudioDragOver}
                    onDragLeave={handleAudioDragLeave}
                    onDrop={handleAudioDrop}
                    className={`relative flex-1 group overflow-hidden rounded-3xl cursor-pointer py-8 px-8 border-2 border-dashed transition-all flex flex-col items-center justify-center gap-4 ${
                      isDraggingAudio
                        ? 'bg-purple-500/20 border-purple-500 scale-[0.98]'
                        : audioMode === 'critique' 
                          ? (theme === 'coldest' ? 'bg-purple-50/80 border-purple-200 hover:border-purple-400 text-purple-900' : 'bg-purple-900/20 border-purple-500/30 hover:border-purple-500/60 text-purple-100')
                          : (theme === 'coldest' ? 'bg-white/40 border-sky-100 hover:border-sky-400 text-slate-900' : 'bg-black/60 border-white/10 hover:border-white/30 text-white')
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2 text-center">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 ${audioMode === 'critique' ? 'bg-purple-500/20' : 'bg-sky-500/20'}`}>
                        <span className="text-3xl">{audioMode === 'critique' ? '🎧' : '🎵'}</span>
                      </div>
                      <span className="text-lg font-black tracking-tight">
                        {audioMode === 'critique' ? 'Drop Full MP3 for Critique' : 'Drop MP3 to Analyze Vibe'}
                      </span>
                      <span className="text-xs font-medium opacity-60 max-w-[200px]">
                        {audioMode === 'critique' 
                          ? 'We process the full song for a deep mix analysis. (Max 15MB recommended)' 
                          : 'Analyze the sonic signature of your beat to find matching plugins.'}
                      </span>
                    </div>
                    
                    <div className="mt-4 flex items-center gap-2 px-4 py-2 rounded-full bg-black/10 text-[10px] font-black uppercase tracking-widest opacity-60">
                      <span>{audioMode === 'critique' ? 'Deep Analysis Mode' : 'Vibe Detection'}</span>
                    </div>

                    <input 
                      type="file" 
                      ref={audioInputRef} 
                      className="hidden" 
                      accept="audio/mpeg,audio/mp3" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleAudioSearch(file);
                        if (audioInputRef.current) audioInputRef.current.value = '';
                      }} 
                    />
                  </div>
                  
                  <div className="flex flex-col gap-3 sm:w-48">
                    <button 
                      onClick={() => audioInputRef.current?.click()}
                      disabled={loading} 
                      className={`flex-1 py-5 px-6 rounded-3xl font-black text-xs select-none shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex flex-col items-center justify-center gap-2 ${
                        audioMode === 'critique'
                          ? 'bg-purple-600 text-white'
                          : (theme === 'coldest' ? 'bg-emerald-600 text-white' : 'bg-white/10 text-white')
                      }`}
                    >
                      <span className="text-xl">📤</span>
                      {audioAnalysisLoading ? "Analyzing..." : "Select File"}
                    </button>
                  </div>
                </div>
              </div>

              {!isVerified && (
                <div className="flex justify-center mt-4">
                  <div className="flex items-center justify-center overflow-visible" style={{ width: '260px', height: '52px' }}>
                    <div className="cf-turnstile origin-center scale-[0.8]"></div>
                  </div>
                </div>
              )}

              {loading && (
                <div className="mt-4 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${theme === 'coldest' ? 'text-slate-600' : 'text-white/60'}`}>
                      {audioAnalysisLoading ? "Analyzing Audio Vibe..." : "Architecting Beat Recipes..."}
                    </span>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${theme === 'coldest' ? 'text-slate-600' : 'text-white/60'}`}>
                      {generationEta > 0 ? `~${generationEta}s remaining` : "Almost ready..."}
                    </span>
                  </div>
                  <div className="w-full bg-black/10 rounded-full h-2 overflow-hidden relative">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ease-linear ${theme === 'coldest' ? 'bg-sky-500' : theme === 'crazy-bird' ? 'bg-red-500' : 'bg-white'}`}
                      style={{ width: `${generationProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-4 sm:mt-2">
                {(analogInstruments.length > 0 || analogHardware.length > 0 || drumKits.length > 0) && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={excludeAnalog} 
                      onChange={(e) => setExcludeAnalog(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-sky-500 focus:ring-sky-500"
                    />
                    <span className={`text-sm font-bold ${theme === 'coldest' ? 'text-slate-700' : 'text-slate-300'}`}>
                      Exclude my real instruments & hardware from recipes
                    </span>
                  </label>
                )}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setEditingDrumKit(undefined);
                      setShowDrumKitModal(true);
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-xs font-bold ${
                      theme === 'coldest'
                        ? 'bg-slate-500/10 hover:bg-slate-500/20 text-slate-700 border-slate-500/20' 
                        : 'bg-slate-500/20 hover:bg-slate-500/30 text-slate-300 border-slate-500/30'
                    }`}
                  >
                    <Drum className="w-4 h-4" />
                    Add Drum Kit
                  </button>
                  <button 
                    onClick={() => setShowAnalogModal(true)}
                    className={`text-xs font-bold underline opacity-70 hover:opacity-100 transition-opacity ${theme === 'coldest' ? 'text-slate-700' : 'text-slate-300'}`}
                  >
                    (Edit Equipment)
                  </button>
                </div>
              </div>
            </section>

            {recipes.length > 0 && (
              <section className="grid grid-cols-1 gap-6 animate-in fade-in slide-in-from-bottom-12 duration-1000">
                {recipes.map((recipe, idx) => (
                  <div key={idx} id={`recipe-card-${idx}`}>
                    <RecipeCard recipe={recipe} isSaved={vault.some(r => r.title === recipe.title)} onSave={saveToVault} theme={theme} dawType={dawType} plugins={plugins} analogHardware={analogHardware} drumKits={drumKits} onCloudBackupRecipe={handleCloudBackupRecipe} />
                  </div>
                ))}
              </section>
            )}

            {critiques.length > 0 && (
              <section className="grid grid-cols-1 gap-6 animate-in fade-in slide-in-from-bottom-12 duration-1000">
                {critiques.map((critique, idx) => (
                  <CritiqueCard 
                    key={idx} 
                    critique={critique} 
                    theme={theme} 
                    plugins={plugins} 
                    audioBase64={critique.audioBase64} 
                    mimeType={critique.mimeType} 
                    isSaved={savedCritiques.some(c => c.id === critique.id)}
                    onSave={saveCritiqueToVault}
                  />
                ))}
              </section>
            )}

            <section id="section-gear-rack" className={`p-6 sm:p-10 transition-colors ${mainBlurClass} border rounded-[3rem] sm:rounded-[4rem] shadow-xl mb-16 ${theme === 'coldest' ? 'bg-white/20 border-white/30' : 'bg-black/40 border-white/10'}`}>
              <div className="flex flex-col gap-4 pb-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {selectedFolder && (
                      <button 
                        onClick={() => setSelectedFolder(null)}
                        className={`p-2 rounded-full transition-all hover:scale-105 active:scale-95 ${theme === 'coldest' ? 'bg-sky-100 text-sky-800 hover:bg-sky-200' : 'bg-white/10 text-white hover:bg-white/20'}`}
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                    )}
                    <h3 className={`text-2xl font-black select-none ${theme === 'coldest' ? 'text-slate-800' : 'text-white'}`}>
                      {selectedFolder ? selectedFolder : 'Gear Rack'}
                    </h3>
                  </div>
                  <div className="flex gap-4 items-center">
                    <select 
                      id="gear-rack-sort"
                      value={sortBy} 
                      onChange={(e) => { setSortBy(e.target.value as any); setSelectedFolder(null); }}
                      className={`py-2 px-4 rounded-full text-xs font-bold focus:outline-none transition-all ${theme === 'coldest' ? 'bg-white/40 text-slate-800' : 'bg-black/60 text-white'}`}
                    >
                      <option value="type">Group by Type</option>
                      <option value="vendor">Group by Brand</option>
                      <option value="name">Display All</option>
                    </select>
                    <input 
                      id="gear-rack-search"
                      ref={searchInputRef}
                      type="text" 
                      placeholder="Search the rack..." 
                      value={searchTerm} 
                      onChange={(e) => setSearchTerm(e.target.value)} 
                      className={`py-4 px-8 text-sm font-bold focus:outline-none transition-all w-64 sm:w-96 rounded-full ${theme === 'coldest' ? 'bg-white/40 border-white text-slate-800' : 'bg-black/60 border-white/10 text-white'}`} 
                    />
                  </div>
                </div>
                

                {/* Starred Items Bar */}
                {true && (
                  <div id="priority-bar" className="flex items-center gap-3 overflow-x-auto pt-4 pb-2 scrollbar-hide -mt-2">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-50 shrink-0">Starred ({starredPlugins.length + starredHardware.length}/20):</span>
                    {[...starredPlugins, ...starredHardware].map((name, index) => {
                      const themeStyles = {
                        coldest: {
                          border: 'border-sky-400/50',
                          shades: [
                            'bg-sky-100/50 text-sky-700', 'bg-sky-200/50 text-sky-800',
                            'bg-sky-300/50 text-sky-900', 'bg-sky-400/50 text-sky-950',
                            'bg-sky-500/50 text-sky-950'
                          ]
                        },
                        'crazy-bird': {
                          border: 'border-red-500/50',
                          shades: [
                            'bg-red-200/20 text-red-100', 'bg-red-300/20 text-red-100',
                            'bg-red-400/20 text-red-50', 'bg-red-500/20 text-red-50',
                            'bg-red-600/20 text-red-50'
                          ]
                        },
                        'hustle-time': {
                          border: 'border-emerald-500/50',
                          shades: [
                            'bg-emerald-200/20 text-emerald-100', 'bg-emerald-300/20 text-emerald-100',
                            'bg-emerald-400/20 text-emerald-50', 'bg-emerald-500/20 text-emerald-50',
                            'bg-emerald-600/20 text-emerald-50'
                          ]
                        }
                      };
                      const styles = (themeStyles[theme as keyof typeof themeStyles] || themeStyles['hustle-time']);
                      const colorClass = styles.shades[index % styles.shades.length];
                      const borderClass = styles.border;

                      return (
                        <div key={name} className="relative group shrink-0">
                          <button
                            onClick={() => {
                              setSearchTerm(name);
                              setTimeout(() => setSearchTerm(''), 3000);
                            }}
                            className={`flex items-center gap-1.5 text-sm font-bold px-5 py-1.5 rounded-full whitespace-nowrap transition-all hover:scale-105 active:scale-95 border ${borderClass} ${colorClass}`}>
                            <Star size={12} className="fill-current" />
                            {name}
                          </button>
                          <button
                            onClick={() => {
                            if (plugins.some(p => p.name === name)) {
                              toggleStar(name);
                            } else {
                              setStarredHardware(prev => prev.filter(n => n !== name));
                            }
                          }}
                            className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95 shadow-lg border-2 border-white/50"
                            title={`Remove ${name}`}>
                            <X size={10} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              
              {/* Drum Kits Section */}
              {drumKits.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-white/40 px-2">
                    <Drum className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-widest">Drum Kits</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {drumKits.map((kit) => (
                      <HardwareCard 
                        key={kit.name} 
                        item={kit} 
                        isStarred={starredHardware.includes(kit.name)}
                        onToggleStar={() => {
                          setStarredHardware(prev => 
                            prev.includes(kit.name) ? prev.filter(n => n !== kit.name) : [...prev, kit.name]
                          );
                        }}
                        onRemove={() => setDrumKits(prev => prev.filter(k => k.name !== kit.name))}
                        onEdit={(item) => {
                          setEditingDrumKit(item);
                          setShowDrumKitModal(true);
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Analog Equipment Section */}
              {!selectedFolder && !searchTerm && (analogInstruments.length > 0 || analogHardware.length > 0) && (
                <div className="mb-12">
                  <h4 className={`text-sm font-black uppercase tracking-widest mb-6 opacity-70 ${theme === 'coldest' ? 'text-slate-800' : 'text-white'}`}>Real Instruments & Hardware</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {[...analogInstruments, ...analogHardware].map((item, idx) => (
                      <HardwareCard 
                        key={`hw-${idx}`}
                        item={item}
                        theme={theme}
                        isFavorite={starredHardware.includes(item.name)}
                        onToggleFavorite={(itemName) => toggleStar(itemName)}
                        onRemove={(itemToRemove) => {
                          if (itemToRemove.type === 'instrument') {
                            setAnalogInstruments(prev => prev.filter(i => i.name !== itemToRemove.name));
                            setDeletedInstruments(prev => [...prev, itemToRemove]);
                          } else {
                            setAnalogHardware(prev => prev.filter(h => h.name !== itemToRemove.name));
                            setDeletedHardware(prev => [...prev, itemToRemove]);
                          }
                          setStarredHardware(prev => prev.filter(n => n !== itemToRemove.name));
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-12">
                <h4 className={`text-sm font-black uppercase tracking-widest mb-6 opacity-70 ${theme === 'coldest' ? 'text-slate-800' : 'text-white'}`}>Plugins</h4>
                {groupedPlugins && !selectedFolder ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {(() => {
                      const items: any[] = Object.entries(groupedPlugins).map(([groupName, groupPlugins]) => ({ type: 'folder', name: groupName, plugins: groupPlugins }));
                    const placeholders = pendingPlaceholders.filter(p => p.type === 'folder').sort((a, b) => a.index - b.index);
                    placeholders.forEach(p => {
                      items.splice(p.index, 0, { type: 'folder', name: p.name, plugins: p.plugins, isPlaceholder: true, placeholderId: p.id });
                    });
                    
                    return items.map((item, idx) => {
                      if (item.isPlaceholder) {
                        return (
                          <div key={`placeholder-${item.placeholderId}`} className={`flex flex-col items-center justify-center p-6 rounded-[2rem] border border-dashed transition-all ${theme === 'coldest' ? 'border-sky-300 bg-sky-50' : 'border-white/20 bg-white/5'} h-full min-h-[12rem]`}>
                            <p className={`text-xs font-bold opacity-50 mb-4 text-center ${theme === 'coldest' ? 'text-sky-800' : 'text-white'}`}>Removed {item.name}</p>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleUndo(item.placeholderId); }}
                              className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all ${theme === 'coldest' ? 'bg-sky-500 text-white' : 'bg-white text-black'}`}
                            >
                              Undo
                            </button>
                          </div>
                        );
                      }
                      
                      const groupName = item.name;
                      const groupPlugins = item.plugins;
                      return (
                        <div 
                          key={groupName}
                          onClick={() => setSelectedFolder(groupName)}
                          className={`cursor-pointer group relative flex flex-col items-center justify-center p-6 rounded-[2rem] border transition-all hover:scale-105 active:scale-95 shadow-sm hover:shadow-xl ${theme === 'coldest' ? 'bg-white/60 border-sky-100 hover:bg-white/80' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                        >
                          {/* Top Actions */}
                          <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <button 
                              onClick={(e) => { e.stopPropagation(); setFolderToRemove(groupName); }}
                              className="p-1.5 rounded-full bg-red-500/80 text-white hover:bg-red-600 backdrop-blur-md transition-all"
                              title={`Remove ${sortBy === 'vendor' ? 'Brand' : 'Type'}`}
                            >
                              <X size={14} />
                            </button>
                          </div>

                          {/* Confirmation Popup */}
                          {folderToRemove === groupName && (
                            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 backdrop-blur-md rounded-[2rem] p-4 animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
                              <div className="text-center">
                                <p className="text-white text-xs font-bold mb-3">Remove all {groupName}?</p>
                                <div className="flex justify-center gap-2">
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); setFolderToRemove(null); }}
                                    className="px-3 py-1.5 rounded-full bg-white/20 text-white text-[10px] font-bold hover:bg-white/30 transition-colors"
                                  >
                                    Cancel
                                  </button>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const pluginsInFolder = plugins.filter(p => (sortBy === 'vendor' ? p.vendor : p.type) === groupName);
                                      const folderIndex = Object.keys(groupedPlugins).indexOf(groupName);
                                      
                                      setPlugins(prev => prev.filter(p => (sortBy === 'vendor' ? p.vendor : p.type) !== groupName));
                                      setDeletedPlugins(prev => [...prev, ...pluginsInFolder]);
                                      setStarredPlugins(prev => {
                                        const names = pluginsInFolder.map(p => p.name);
                                        return prev.filter(name => !names.includes(name));
                                      });
                                      
                                      setPendingPlaceholders(prev => [
                                        ...prev, 
                                        { id: Date.now().toString() + Math.random(), type: 'folder', name: groupName, index: folderIndex, plugins: pluginsInFolder }
                                      ]);
                                      resetDeletionTimer();
                                      setFolderToRemove(null);
                                    }}
                                    className="px-3 py-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold hover:bg-red-600 transition-colors"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className={`w-16 h-16 mb-4 rounded-2xl flex items-center justify-center shadow-inner ${theme === 'coldest' ? 'bg-sky-100 text-sky-600' : 'bg-black/40 text-white'}`}>
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                            </svg>
                          </div>
                          <h4 className="text-sm font-black text-center truncate w-full px-2">{groupName}</h4>
                          <span className="text-[10px] font-bold opacity-50 mt-1 uppercase tracking-widest">{groupPlugins.length} items</span>
                        </div>
                      );
                    });
                  })()}
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {(() => {
                    const items: any[] = filteredPlugins.map(p => ({ type: 'plugin', plugin: p }));
                    const placeholders = pendingPlaceholders.filter(p => p.type === 'plugin').sort((a, b) => a.index - b.index);
                    placeholders.forEach(p => {
                      items.splice(p.index, 0, { type: 'plugin', plugin: p.plugins[0], isPlaceholder: true, placeholderId: p.id });
                    });

                    return items.map((item, idx) => {
                      if (item.isPlaceholder) {
                        return (
                          <div key={`placeholder-${item.placeholderId}`} className={`flex flex-col items-center justify-center p-6 rounded-[2rem] border border-dashed transition-all ${theme === 'coldest' ? 'border-sky-300 bg-sky-50' : 'border-white/20 bg-white/5'} h-full min-h-[12rem]`}>
                            <p className={`text-xs font-bold opacity-50 mb-4 text-center ${theme === 'coldest' ? 'text-sky-800' : 'text-white'}`}>Removed {item.plugin.name}</p>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleUndo(item.placeholderId); }}
                              className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all ${theme === 'coldest' ? 'bg-sky-500 text-white' : 'bg-white text-black'}`}
                            >
                              Undo
                            </button>
                          </div>
                        );
                      }

                      const plugin = item.plugin;
                      return (
                        <PluginCard 
                          id={`plugin-card-${plugin.name.replace(/\s+/g, '-').toLowerCase()}`}
                          key={`${plugin.vendor}-${plugin.name}-${idx}`} 
                          plugin={plugin} 
                          isFavorite={starredPlugins.includes(plugin.name)}
                          onToggleFavorite={(p) => toggleStar(p.name)}
                          onRemove={(p) => {
                            const pluginIndex = filteredPlugins.findIndex(pl => pl.name === p.name && pl.vendor === p.vendor);
                            setPlugins(prev => prev.filter(pl => pl.name !== p.name || pl.vendor !== p.vendor));
                            setDeletedPlugins(prev => [...prev, p]);
                            setStarredPlugins(prev => prev.filter(n => n !== p.name));
                            
                            setPendingPlaceholders(prev => [
                              ...prev, 
                              { id: Date.now().toString() + Math.random(), type: 'plugin', index: pluginIndex, plugins: [p] }
                            ]);
                            resetDeletionTimer();
                          }}
                        />
                      );
                    });
                  })()}
                </div>
              )}
              </div>
            </section>
          </div>
        ) : null}
      </main>
      <footer className="py-16 text-center opacity-40 select-none">
        <p className="text-[10px] font-black uppercase tracking-[0.8em] mb-4">{currentAppName} x ColdestConcept / 2026</p>
        
        <div className="flex justify-center gap-4 mb-6">
          <a href="https://www.tiktok.com/@coldestconcept?_r=1&_t=ZP-94t4yW77agh" target="_blank" rel="noopener noreferrer" className="hover:opacity-100 transition-opacity cursor-pointer" title="TikTok">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1 .05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z"/>
            </svg>
          </a>
          <a href="https://www.linkedin.com/in/coldestconcept" target="_blank" rel="noopener noreferrer" className="hover:opacity-100 transition-opacity cursor-pointer" title="LinkedIn">
            <Linkedin className="w-4 h-4" />
          </a>
          <a href="https://www.facebook.com/share/1CUwe4hCKh/" target="_blank" rel="noopener noreferrer" className="hover:opacity-100 transition-opacity cursor-pointer" title="Facebook">
            <Facebook className="w-4 h-4" />
          </a>
          <a href="https://www.instagram.com/coldestconcept?igsh=a2xyYmkyazV4NnZp" target="_blank" rel="noopener noreferrer" className="hover:opacity-100 transition-opacity cursor-pointer" title="Instagram">
            <Instagram className="w-4 h-4" />
          </a>
          <a href="https://x.com/ConceptColdest" target="_blank" rel="noopener noreferrer" className="hover:opacity-100 transition-opacity cursor-pointer" title="X (Twitter)">
            <Twitter className="w-4 h-4" />
          </a>
        </div>

        <div className="flex justify-center gap-6 text-[10px] font-bold tracking-tight">
          <button onClick={() => setShowCookiePolicy(true)} className="hover:opacity-100 transition-opacity cursor-pointer">Cookie Policy</button>
          <a href="https://www.beatgangsta.com/privacy" target="_blank" rel="noopener noreferrer" className="hover:opacity-100 transition-opacity cursor-pointer">Privacy Policy</a>
          <a href="https://www.beatgangsta.com/terms" target="_blank" rel="noopener noreferrer" className="hover:opacity-100 transition-opacity cursor-pointer">Terms of Service</a>
          <button onClick={() => setShowContactForm(true)} className="hover:opacity-100 transition-opacity cursor-pointer">Contact Us</button>
        </div>
      </footer>

      {/* Cookie Consent Banner */}
      <Suspense fallback={null}>
        <CookieConsent 
          show={showCookieConsent}
          onAccept={() => {
            localStorage.setItem('bg_cookie_consent', 'true');
            setShowCookieConsent(false);
          }}
          onDecline={() => {
            localStorage.setItem('bg_cookie_consent', 'false');
            setShowCookieConsent(false);
          }}
          onShowPolicy={() => setShowCookiePolicy(true)}
        />
      </Suspense>

      {/* Contact Form Modal */}
      <Suspense fallback={null}>
        <ContactForm 
          show={showContactForm}
          onClose={() => setShowContactForm(false)}
          theme={theme}
        />
      </Suspense>
      <Suspense fallback={null}>
        <CookiePolicy 
          show={showCookiePolicy}
          onClose={() => setShowCookiePolicy(false)}
          theme={theme}
        />
      </Suspense>
      
      <Suspense fallback={null}>
        <ImportDecisionModal 
          show={showImportDecisionModal && !!importedSaveFile}
          onImport={() => handleRestoreSettings()}
          onCancel={() => {
            setShowImportDecisionModal(false);
            setImportedSaveFile(null);
          }}
          theme={theme}
        />
      </Suspense>

      {/* API Key Intro Modal */}
      <Suspense fallback={null}>
        <ApiKeyIntroModal 
          show={showApiKeyIntro}
          onContinue={() => {
            setShowApiKeyIntro(false);
            setShowApiKeyInput(true);
          }}
        />
      </Suspense>

      {/* API Key Input Modal */}
      <Suspense fallback={null}>
        <ApiKeyInputModal 
          show={showApiKeyInput}
          onClose={() => setShowApiKeyInput(false)}
          theme={theme}
          loading={loading}
          userApiKey={userApiKey}
          setUserApiKey={setUserApiKey}
          showApiKeyEntry={showApiKeyEntry}
          setShowApiKeyEntry={setShowApiKeyEntry}
          apiKeyError={apiKeyError}
          apiTier={apiTier}
          setApiTier={setApiTier}
          onSave={handleApiKeySave}
          onShowInstructions={() => {
            setShowApiKeyInput(false);
            setShowApiKeyInstructions(true);
          }}
        />
      </Suspense>

      {/* Backup Restored Confirmation */}
      <Suspense fallback={null}>
        <BackupRestored 
          show={showBackupRestored}
          onClose={() => setShowBackupRestored(false)}
          theme={theme}
        />
      </Suspense>

      {/* API Key Instructions Modal */}
      <Suspense fallback={null}>
        <ApiKeyInstructionsModal 
          show={showApiKeyInstructions}
          onClose={() => setShowApiKeyInstructions(false)}
          onBack={() => {
            setShowApiKeyInstructions(false);
            setShowApiKeyInput(true);
          }}
          theme={theme}
        />
      </Suspense>

      <React.Suspense fallback={null}>
        <DawSelectionModal
          isOpen={showDawModal}
          onClose={() => {
            setShowDawModal(false);
            if (dawModalSource === 'initial') {
              setShowAnalogModal(true);
            }
          }}
          onSelect={(daw) => {
            setDawType(daw);
            setShowDawModal(false);
            if (dawModalSource === 'initial') {
              setShowAnalogModal(true);
            }
          }}
          initialDaw={dawType}
          theme={theme}
        />
      </React.Suspense>

      <React.Suspense fallback={null}>
        <AnalogEquipmentModal 
          isOpen={showAnalogModal} 
          onClose={() => setShowAnalogModal(false)} 
          theme={theme}
          onSave={handleAnalogSave}
        />
      </React.Suspense>

      <React.Suspense fallback={null}>
        <DrumKitModal
          theme={theme}
          isOpen={showDrumKitModal}
          onClose={() => {
            setShowDrumKitModal(false);
            setEditingDrumKit(undefined);
          }}
          onSave={(kit) => {
            if (editingDrumKit) {
              setDrumKits(prev => prev.map(k => k.name === editingDrumKit.name ? kit : k));
            } else {
              setDrumKits(prev => [...prev, kit]);
            }
            setShowDrumKitModal(false);
            setEditingDrumKit(undefined);
          }}
          initialKit={editingDrumKit?.drumKitData}
          kitName={editingDrumKit?.name}
        />
      </React.Suspense>
      <React.Suspense fallback={null}>
        <TrashModal
          isOpen={showTrashModal}
          onClose={() => setShowTrashModal(false)}
          deletedPlugins={deletedPlugins}
          deletedInstruments={deletedInstruments}
          deletedHardware={deletedHardware}
          onRestorePlugin={(plugin) => {
            setDeletedPlugins(prev => prev.filter(p => p.name !== plugin.name || p.vendor !== plugin.vendor));
            setPlugins(prev => [...prev, plugin]);
          }}
          onRestoreInstrument={(inst) => {
            setDeletedInstruments(prev => prev.filter(i => i !== inst));
            setAnalogInstruments(prev => [...prev, inst]);
          }}
          onRestoreHardware={(hw) => {
            setDeletedHardware(prev => prev.filter(h => h !== hw));
            setAnalogHardware(prev => [...prev, hw]);
          }}
          onEmptyTrash={() => {
            setDeletedPlugins([]);
            setDeletedInstruments([]);
            setDeletedHardware([]);
          }}
          theme={theme}
        />
      </React.Suspense>
      {showRigUI && (
        <React.Suspense fallback={null}>
          <RigManagerModal 
            theme={theme}
            vault={vault}
            plugins={plugins}
            analogInstruments={analogInstruments}
            analogHardware={analogHardware}
            drumKits={drumKits}
            user={user}
            activeSession={activeSession}
            onImportRig={handleImportRig}
            onImportGear={handleImportGear}
            onReplicateRecipe={handleReplicateRecipe}
            onExportFullSave={handleExportFullSave}
            onImportFullSave={handleImportFullSave}
            onCloudBackup={handleCloudBackup}
            onCloudRestore={handleCloudRestore}
            onCompareRigs={handleCompareRigs}
            onResetLibrary={handleResetLibrary}
            isCloudSyncing={isCloudSyncing}
            cloudDriveUrl={cloudDriveUrl}
            onClose={() => setShowRigUI(false)}
          />
        </React.Suspense>
      )}

      {/* Cloudflare Verification Modal */}
      <AnimatePresence>
        {showCloudflareModal && (
          <div className={`fixed inset-0 z-[399999] overflow-y-auto ${showTutorial ? 'pointer-events-none' : 'bg-black/95 backdrop-blur-2xl'}`}>
            <div className="min-h-[100dvh] flex items-center justify-center p-4">
              <motion.div 
                id="tutorial-turnstile-modal"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className={showTutorial ? "pointer-events-auto" : `w-full max-w-md p-8 rounded-[3rem] border shadow-2xl flex flex-col items-center text-center ${theme === 'coldest' ? 'bg-white border-sky-100 text-slate-900' : 'bg-[#0a0a0a] border-white/10 text-white'}`}
              >
              {!showTutorial && (
                <>
                  <div className="w-20 h-20 rounded-3xl bg-orange-500/10 flex items-center justify-center mb-6">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#F48120"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#F48120"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#F48120"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#F48120"/>
                    </svg>
                  </div>
                  
                  <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">Human Verification</h2>
                  <p className="text-sm opacity-60 leading-relaxed mb-8">
                    Cloudflare Turnstile is verifying your browser to ensure a secure, bot-free experience. This helps us prioritize AI resources for real producers.
                  </p>
                </>
              )}
              
              <div className={showTutorial ? "flex flex-col items-center justify-center" : "w-full p-6 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center gap-4"}>
                {isCloudflareVerified && !showTutorial ? (
                  <motion.div 
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                      <Check className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest text-emerald-500">Verified</span>
                  </motion.div>
                ) : null}
                
                {/* Always show Turnstile if not verified, or if verified but in tutorial mode */}
                {(!isCloudflareVerified || showTutorial) && (
                  <div id="tutorial-turnstile-widget" className={`flex flex-col items-center gap-4 ${isCloudflareVerified && !showTutorial ? 'hidden' : ''}`}>
                    <Turnstile
                      sitekey={typeof import.meta.env.VITE_TURNSTILE_SITE_KEY === 'string' ? import.meta.env.VITE_TURNSTILE_SITE_KEY : '0x4AAAAAACkH6-i-na5YIlP9'}
                      onVerify={(token) => handleCloudflareVerify(token)}
                      theme={theme === 'coldest' ? 'light' : 'dark'}
                    />
                    {!showTutorial && <p className="text-[10px] opacity-40 uppercase tracking-widest">Verifying connection...</p>}
                  </div>
                )}
              </div>
              
              {!showTutorial && (
                <div className="mt-8 flex items-center gap-2 opacity-30">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Protected by Cloudflare</span>
                </div>
              )}
            </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      <React.Suspense fallback={null}>
        <LegalConsentBanner
          show={showConsentModal}
          onAccept={handleAcceptTerms}
          onClose={() => setShowConsentModal(false)}
          isSaving={isSavingConsent}
          error={error}
        />
      </React.Suspense>

      {showTutorial && (
        <React.Suspense fallback={null}>
          <TutorialOverlay
            theme={theme}
            stepIndex={tutorialStep}
            steps={activeTutorialSteps}
            onNext={handleNextTutorialStep}
            onSkip={handleCompleteTutorial}
            isVerified={isVerified}
          />
        </React.Suspense>
      )}
      <React.Suspense fallback={null}>
        <RestoreBackupModal
          show={showRestoreModal}
          backupDate={backupInfo?.backupDate || ''}
          onRestore={() => {
            setShowRestoreModal(false);
            handleExecuteCloudSync('restore', { gear: true, settings: true, recipes: true });
          }}
          onClose={() => {
            setShowRestoreModal(false);
          }}
        />
      </React.Suspense>

      {/* Honey Pot for Bots - Hidden from humans */}
      <a 
        href="/api/trap" 
        style={{ position: 'absolute', left: '-9999px', top: '-9999px' }} 
        aria-hidden="true" 
        tabIndex={-1}
        rel="nofollow"
      >
        Support & Documentation
      </a>
    </div>
  );
};

export default App;
