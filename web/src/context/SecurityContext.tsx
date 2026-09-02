import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface SecurityContextType {
  // 2FA state
  is2FaEnabled: boolean;
  setup2FaData: { secret: string; otpAuthUri: string; qrSvg: string; backupCodes: string[] } | null;
  initiate2FaSetup: (userId: string, email: string) => Promise<boolean>;
  verify2FaCode: (userId: string, code: string) => Promise<{ success: boolean; usedBackupCode?: boolean; error?: string }>;
  disable2Fa: (userId: string, code: string) => Promise<boolean>;
  
  // DLP Scanner
  scanDlpText: (text: string) => Promise<{
    hasViolations: boolean;
    blocked: boolean;
    violationCount: number;
    violations: Array<{ category: string; matchedText: string; maskedText: string; description: string }>;
    redactedText: string;
    summary: string;
  }>;

  // Phishing Detector
  scanPhishing: (params: { html?: string; text?: string; subject?: string; from?: string }) => Promise<{
    isSuspicious: boolean;
    riskLevel: 'safe' | 'low' | 'suspicious' | 'malicious';
    score: number;
    flags: string[];
    flaggedLinks: Array<{ href: string; anchorText: string; reason: string; severity: string }>;
  }>;

  // Tracker Blocker
  stripTrackers: (html: string) => Promise<{
    cleanHtml: string;
    strippedCount: number;
    hasTrackers: boolean;
    privacyShieldSummary: string;
  }>;

  // Confidential Emails
  createConfidential: (params: { content: string; passcode?: string; ttlSeconds?: number; maxViews?: number }) => Promise<{
    token: string;
    shareUrl: string;
    expiresAt: string;
    hasPasscode: boolean;
  }>;

  // Rate Limiting
  rateLimitState: { active: boolean; secondsRemaining: number; limit: number };
  handleRateLimitTriggered: (retryAfterSeconds: number, limit?: number) => void;
  dismissRateLimitToast: () => void;

  // GDPR
  exportUserData: (userId: string) => Promise<any>;
  purgeUserAccount: (userId: string) => Promise<{ purged: boolean; complianceAttestation: string }>;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

const API_BASE = 'http://localhost:8787/api/security';

export function SecurityProvider({ children }: { children: ReactNode }) {
  const [is2FaEnabled, setIs2FaEnabled] = useState(false);
  const [setup2FaData, setSetup2FaData] = useState<SecurityContextType['setup2FaData']>(null);
  const [rateLimitState, setRateLimitState] = useState<{ active: boolean; secondsRemaining: number; limit: number }>({
    active: false,
    secondsRemaining: 0,
    limit: 60,
  });

  // Countdown timer for rate limiting
  useEffect(() => {
    if (!rateLimitState.active || rateLimitState.secondsRemaining <= 0) return;

    const interval = setInterval(() => {
      setRateLimitState(prev => {
        if (prev.secondsRemaining <= 1) {
          return { ...prev, active: false, secondsRemaining: 0 };
        }
        return { ...prev, secondsRemaining: prev.secondsRemaining - 1 };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [rateLimitState.active, rateLimitState.secondsRemaining]);

  const handleRateLimitTriggered = (retryAfterSeconds: number, limit = 60) => {
    setRateLimitState({
      active: true,
      secondsRemaining: Math.max(1, retryAfterSeconds),
      limit,
    });
  };

  const dismissRateLimitToast = () => {
    setRateLimitState(prev => ({ ...prev, active: false }));
  };

  const initiate2FaSetup = async (userId: string, email: string) => {
    try {
      const res = await fetch(`${API_BASE}/2fa/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, email }),
      });
      if (res.status === 429) {
        handleRateLimitTriggered(10);
        return false;
      }
      const data = await res.json();
      if (data.success) {
        setSetup2FaData({
          secret: data.secret,
          otpAuthUri: data.otpAuthUri,
          qrSvg: data.qrSvg,
          backupCodes: data.backupCodes,
        });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const verify2FaCode = async (userId: string, code: string) => {
    try {
      const res = await fetch(`${API_BASE}/2fa/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, code }),
      });
      if (res.status === 429) {
        handleRateLimitTriggered(10);
        return { success: false, error: 'Rate limit exceeded' };
      }
      const data = await res.json();
      if (data.verified) {
        setIs2FaEnabled(true);
        return { success: true, usedBackupCode: data.usedBackupCode };
      }
      return { success: false, error: data.error || 'Invalid 2FA code' };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const disable2Fa = async (userId: string, code: string) => {
    try {
      const res = await fetch(`${API_BASE}/2fa/disable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, code }),
      });
      const data = await res.json();
      if (data.success) {
        setIs2FaEnabled(false);
        setSetup2FaData(null);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const scanDlpText = async (text: string) => {
    try {
      const res = await fetch(`${API_BASE}/scan-dlp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      return await res.json();
    } catch {
      return {
        hasViolations: false,
        blocked: false,
        violationCount: 0,
        violations: [],
        redactedText: text,
        summary: 'DLP scan unavailable',
      };
    }
  };

  const scanPhishing = async (params: { html?: string; text?: string; subject?: string; from?: string }) => {
    try {
      const res = await fetch(`${API_BASE}/scan-phishing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      return await res.json();
    } catch {
      return {
        isSuspicious: false,
        riskLevel: 'safe' as const,
        score: 0,
        flags: [],
        flaggedLinks: [],
      };
    }
  };

  const stripTrackers = async (html: string) => {
    try {
      const res = await fetch(`${API_BASE}/strip-trackers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html }),
      });
      return await res.json();
    } catch {
      return {
        cleanHtml: html,
        strippedCount: 0,
        hasTrackers: false,
        privacyShieldSummary: 'Privacy Shield unavailable',
      };
    }
  };

  const createConfidential = async (params: { content: string; passcode?: string; ttlSeconds?: number; maxViews?: number }) => {
    const res = await fetch(`${API_BASE}/confidential/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('Failed to create confidential email');
    return await res.json();
  };

  const exportUserData = async (userId: string) => {
    const res = await fetch(`${API_BASE}/user/export-data?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) throw new Error('Failed to export data');
    return await res.json();
  };

  const purgeUserAccount = async (userId: string) => {
    const res = await fetch(`${API_BASE}/user/purge-account`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, confirmation: 'DELETE_FOREVER' }),
    });
    if (!res.ok) throw new Error('Failed to purge account');
    return await res.json();
  };

  return (
    <SecurityContext.Provider
      value={{
        is2FaEnabled,
        setup2FaData,
        initiate2FaSetup,
        verify2FaCode,
        disable2Fa,
        scanDlpText,
        scanPhishing,
        stripTrackers,
        createConfidential,
        rateLimitState,
        handleRateLimitTriggered,
        dismissRateLimitToast,
        exportUserData,
        purgeUserAccount,
      }}
    >
      {children}
    </SecurityContext.Provider>
  );
}

export function useSecurity() {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
}
