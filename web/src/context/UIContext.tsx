import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { playSound as playWebAudioSound, type SoundEffectType } from '../utils/webAudio';

export type ThemeMode = 'light' | 'dark' | 'solarized' | 'high-contrast' | 'system';
export type DensityMode = 'compact' | 'normal' | 'comfortable';
export type LayoutMode = 'split-3pane' | 'split-2pane-horizontal' | 'compact-list' | 'zen-mode';

export interface QuietHoursSettings {
  start: string;     // e.g. "22:00"
  end: string;       // e.g. "08:00"
  timezone: string;  // e.g. "UTC"
}

export interface AppNotification {
  id: string;
  userId?: string;
  title: string;
  message: string;
  type: 'mention' | 'reply' | 'system' | 'assignment' | 'urgent';
  linkUrl?: string | null;
  isRead: boolean;
  createdAt: Date | string | number;
}

export interface AppSignature {
  id: string;
  domainId: string;
  name: string;
  htmlContent: string;
  isDefault: boolean;
  createdAt: Date | string | number;
}

export interface AppAlias {
  id: string;
  domainId: string;
  aliasName: string;
  targetFolderId?: string | null;
  autoTagId?: string | null;
  isActive: boolean;
}

export interface UIContextType {
  // Theme & Appearance (Feature #41)
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  accentColor: string;
  setAccentColor: (hex: string) => void;
  density: DensityMode;
  setDensity: (density: DensityMode) => void;

  // Layout & Panes (Feature #42)
  layoutMode: LayoutMode;
  setLayoutMode: (mode: LayoutMode) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean | ((prev: boolean) => boolean)) => void;
  zenModeActive: boolean;
  setZenModeActive: (active: boolean | ((prev: boolean) => boolean)) => void;
  paneWidths: { sidebar: number; list: number; listHeight: number };
  setPaneWidths: React.Dispatch<React.SetStateAction<{ sidebar: number; list: number; listHeight: number }>>;

  // Audio Synth (Feature #46)
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  soundVolume: number;
  setSoundVolume: (volume: number) => void;
  playSound: (type: SoundEffectType) => void;

  // Notification Center & Quiet Hours (Feature #50)
  quietHours: QuietHoursSettings;
  setQuietHours: (settings: QuietHoursSettings) => void;
  isDndActive: boolean;
  notifications: AppNotification[];
  unreadNotifCount: number;
  addNotification: (notif: Omit<AppNotification, 'id' | 'isRead' | 'createdAt'>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  requestNotificationPermission: () => Promise<boolean>;

  // Signatures & Aliases (Features #44, #45)
  signatures: AppSignature[];
  setSignatures: React.Dispatch<React.SetStateAction<AppSignature[]>>;
  defaultSignature: AppSignature | null;
  aliases: AppAlias[];
  setAliases: React.Dispatch<React.SetStateAction<AppAlias[]>>;

  // Folders (Feature #48)
  activeFolderId: string;
  setActiveFolderId: (id: string) => void;

  // Save/Sync preferences to backend
  savePreferencesToBackend: () => Promise<void>;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Theme state
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    return (localStorage.getItem('mailops_theme') as ThemeMode) || 'light';
  });
  const [accentColor, setAccentColorState] = useState<string>(() => {
    return localStorage.getItem('mailops_accent') || '#2563eb';
  });
  const [density, setDensityState] = useState<DensityMode>(() => {
    return (localStorage.getItem('mailops_density') as DensityMode) || 'normal';
  });

  // 2. Layout state
  const [layoutMode, setLayoutModeState] = useState<LayoutMode>(() => {
    return (localStorage.getItem('mailops_layout_mode') as LayoutMode) || 'split-3pane';
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [zenModeActive, setZenModeActive] = useState<boolean>(false);
  const [paneWidths, setPaneWidths] = useState<{ sidebar: number; list: number; listHeight: number }>({
    sidebar: 240,
    list: 360,
    listHeight: 300,
  });

  // 3. Audio state
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => {
    const stored = localStorage.getItem('mailops_sound_enabled');
    return stored === null ? true : stored === 'true';
  });
  const [soundVolume, setSoundVolumeState] = useState<number>(() => {
    const stored = localStorage.getItem('mailops_sound_volume');
    return stored ? parseFloat(stored) : 0.5;
  });

  // 4. Quiet Hours & DND state
  const [quietHours, setQuietHoursState] = useState<QuietHoursSettings>(() => {
    const stored = localStorage.getItem('mailops_quiet_hours');
    return stored ? JSON.parse(stored) : { start: '22:00', end: '08:00', timezone: 'UTC' };
  });

  // 5. Notifications state
  const [notifications, setNotifications] = useState<AppNotification[]>([
    {
      id: 'notif-1',
      title: 'Welcome to Mailops!',
      message: 'Explore your customized 50-feature email suite.',
      type: 'system',
      isRead: false,
      createdAt: new Date(),
    }
  ]);

  // 6. Signatures & Aliases
  const [signatures, setSignatures] = useState<AppSignature[]>([
    {
      id: 'sig-default',
      domainId: 'default',
      name: 'Default Corporate',
      htmlContent: `<div style="font-family: sans-serif; font-size: 13px; color: #1e293b;"><strong>Mailops User</strong><br/><span style="color: #64748b;">Engineering Team</span></div>`,
      isDefault: true,
      createdAt: new Date(),
    }
  ]);
  const [aliases, setAliases] = useState<AppAlias[]>([
    {
      id: 'alias-1',
      domainId: 'default',
      aliasName: 'support',
      targetFolderId: 'inbox',
      autoTagId: null,
      isActive: true,
    }
  ]);

  // 7. Folder navigation
  const [activeFolderId, setActiveFolderId] = useState<string>('inbox');

  // Compute DND active state
  const evaluateIsDndActive = useCallback((): boolean => {
    if (!quietHours.start || !quietHours.end) return false;
    const now = new Date();
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: quietHours.timezone || 'UTC',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      const parts = formatter.formatToParts(now);
      const hours = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
      const mins = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
      const currentMin = hours * 60 + mins;

      const [sH, sM] = quietHours.start.split(':').map(Number);
      const [eH, eM] = quietHours.end.split(':').map(Number);
      const startMin = sH * 60 + sM;
      const endMin = eH * 60 + eM;

      if (startMin === endMin) return false;
      if (startMin < endMin) return currentMin >= startMin && currentMin < endMin;
      return currentMin >= startMin || currentMin < endMin;
    } catch {
      return false;
    }
  }, [quietHours]);

  const [isDndActive, setIsDndActive] = useState<boolean>(evaluateIsDndActive());

  useEffect(() => {
    setIsDndActive(evaluateIsDndActive());
    const interval = setInterval(() => {
      setIsDndActive(evaluateIsDndActive());
    }, 60000);
    return () => clearInterval(interval);
  }, [evaluateIsDndActive]);

  // CSS variables injector
  useEffect(() => {
    const root = document.documentElement;
    const isDark =
      theme === 'dark' ||
      theme === 'solarized' ||
      theme === 'high-contrast' ||
      (theme === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);

    root.setAttribute('data-theme', theme);
    root.classList.toggle('dark', isDark);

    // Apply color variables
    root.style.setProperty('--mailops-accent', accentColor);
    if (theme === 'solarized') {
      root.style.setProperty('--mailops-bg', '#002b36');
      root.style.setProperty('--mailops-card', '#073642');
      root.style.setProperty('--mailops-text', '#839496');
      root.style.setProperty('--mailops-border', '#073642');
    } else if (theme === 'high-contrast') {
      root.style.setProperty('--mailops-bg', '#000000');
      root.style.setProperty('--mailops-card', '#000000');
      root.style.setProperty('--mailops-text', '#ffffff');
      root.style.setProperty('--mailops-border', '#ffffff');
    } else if (isDark) {
      root.style.setProperty('--mailops-bg', '#0f172a');
      root.style.setProperty('--mailops-card', '#1e293b');
      root.style.setProperty('--mailops-text', '#f8fafc');
      root.style.setProperty('--mailops-border', '#334155');
    } else {
      root.style.setProperty('--mailops-bg', '#ffffff');
      root.style.setProperty('--mailops-card', '#ffffff');
      root.style.setProperty('--mailops-text', '#0f172a');
      root.style.setProperty('--mailops-border', '#e2e8f0');
    }

    // Density variables
    if (density === 'compact') {
      root.style.setProperty('--density-row-py', '4px');
      root.style.setProperty('--density-font', '13px');
    } else if (density === 'comfortable') {
      root.style.setProperty('--density-row-py', '12px');
      root.style.setProperty('--density-font', '15px');
    } else {
      root.style.setProperty('--density-row-py', '8px');
      root.style.setProperty('--density-font', '14px');
    }
  }, [theme, accentColor, density]);

  // Setters with localStorage persistence
  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem('mailops_theme', newTheme);
  };

  const setAccentColor = (hex: string) => {
    setAccentColorState(hex);
    localStorage.setItem('mailops_accent', hex);
  };

  const setDensity = (newDensity: DensityMode) => {
    setDensityState(newDensity);
    localStorage.setItem('mailops_density', newDensity);
  };

  const setLayoutMode = (newMode: LayoutMode) => {
    setLayoutModeState(newMode);
    localStorage.setItem('mailops_layout_mode', newMode);
  };

  const setSoundEnabled = (enabled: boolean) => {
    setSoundEnabledState(enabled);
    localStorage.setItem('mailops_sound_enabled', String(enabled));
  };

  const setSoundVolume = (vol: number) => {
    setSoundVolumeState(vol);
    localStorage.setItem('mailops_sound_volume', String(vol));
  };

  const setQuietHours = (settings: QuietHoursSettings) => {
    setQuietHoursState(settings);
    localStorage.setItem('mailops_quiet_hours', JSON.stringify(settings));
  };

  // Sound player with DND suppression
  const playSound = useCallback((type: SoundEffectType) => {
    if (!soundEnabled || isDndActive) return;
    playWebAudioSound(type, soundVolume);
  }, [soundEnabled, soundVolume, isDndActive]);

  // Notification methods
  const addNotification = (notif: Omit<AppNotification, 'id' | 'isRead' | 'createdAt'>) => {
    const newNotif: AppNotification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      isRead: false,
      createdAt: new Date(),
    };
    setNotifications(prev => [newNotif, ...prev]);

    // Play chime / alert sound if outside DND or urgent
    if (!isDndActive || notif.type === 'urgent') {
      playSound(notif.type === 'urgent' ? 'alert' : 'chime');
    }

    // Native Web Notification
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      if (!isDndActive || notif.type === 'urgent') {
        new Notification(notif.title, {
          body: notif.message,
          icon: '/favicon.ico',
        });
      }
    }
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const requestNotificationPermission = async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    const res = await Notification.requestPermission();
    return res === 'granted';
  };

  // Sync preferences with backend API
  const savePreferencesToBackend = async () => {
    try {
      await fetch('/api/customization/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'default-user',
          theme,
          accentColor,
          layoutMode,
          density,
          soundEnabled,
          soundVolume,
          quietHoursStart: quietHours.start,
          quietHoursEnd: quietHours.end,
          quietHoursTimezone: quietHours.timezone,
        }),
      });
    } catch {
      // Graceful offline fallback
    }
  };

  const defaultSignature = signatures.find(s => s.isDefault) || signatures[0] || null;
  const unreadNotifCount = notifications.filter(n => !n.isRead).length;

  return (
    <UIContext.Provider
      value={{
        theme,
        setTheme,
        accentColor,
        setAccentColor,
        density,
        setDensity,
        layoutMode,
        setLayoutMode,
        sidebarCollapsed,
        setSidebarCollapsed,
        zenModeActive,
        setZenModeActive,
        paneWidths,
        setPaneWidths,
        soundEnabled,
        setSoundEnabled,
        soundVolume,
        setSoundVolume,
        playSound,
        quietHours,
        setQuietHours,
        isDndActive,
        notifications,
        unreadNotifCount,
        addNotification,
        markNotificationRead,
        markAllNotificationsRead,
        requestNotificationPermission,
        signatures,
        setSignatures,
        defaultSignature,
        aliases,
        setAliases,
        activeFolderId,
        setActiveFolderId,
        savePreferencesToBackend,
      }}
    >
      {children}
    </UIContext.Provider>
  );
};

export const useUI = (): UIContextType => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};
