import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

// Types corresponding to productivity features
export interface ScheduledItem {
  id: string;
  domainId: string;
  fromAddr: string;
  toAddr: string;
  subject: string;
  textBody?: string;
  htmlBody?: string;
  sendAt: number;
  status: 'pending' | 'sent' | 'cancelled' | 'failed';
  createdAt: number;
}

export interface UndoSendTicketState {
  token: string;
  email: {
    toAddr: string;
    fromAddr: string;
    subject: string;
    textBody?: string;
    htmlBody?: string;
  };
  bufferedAt: number;
  gracePeriodSeconds: number;
  expiresAt: number;
  status: 'buffered' | 'cancelled' | 'dispatched';
}

export interface SnoozeItemState {
  emailId: string;
  snoozedAt: number;
  snoozedUntil: number;
  presetUsed: string;
  reason?: string;
  originalFolderId: string;
}

export interface CannedTemplateState {
  id: string;
  title: string;
  shortcutKey?: string;
  subject?: string;
  body: string;
  category?: string;
}

export interface FilterRuleState {
  id: string;
  name: string;
  trigger: string;
  condition: any;
  actions: any[];
  isActive: boolean;
  orderPriority: number;
}

export interface VacationState {
  id?: string;
  domainId: string;
  userEmail: string;
  subject: string;
  body: string;
  startDate: number;
  endDate: number;
  isActive: boolean;
  cooldownHours?: number;
}

export interface OfflineMutationState {
  id: string;
  type: string;
  payload: Record<string, any>;
  timestamp: number;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  retryCount: number;
}

export interface ProductivityContextValue {
  // Feature 11: Scheduled Send
  scheduledItems: ScheduledItem[];
  isScheduleModalOpen: boolean;
  openScheduleModal: () => void;
  closeScheduleModal: () => void;
  scheduleEmail: (email: Omit<ScheduledItem, 'id' | 'status' | 'createdAt'>, sendAt: number | Date | string) => Promise<boolean>;
  cancelScheduledEmail: (id: string) => Promise<boolean>;

  // Feature 12: Undo Send Grace Buffer
  undoTicket: UndoSendTicketState | null;
  gracePeriodSeconds: number;
  setGracePeriodSeconds: (sec: number) => void;
  remainingGraceMs: number;
  enqueueSendWithUndo: (email: any, graceSeconds?: number, onDispatch?: () => Promise<void>) => string;
  cancelUndoSend: (token?: string) => boolean;

  // Feature 13: Snooze & Reminders
  snoozedItems: SnoozeItemState[];
  snoozeEmail: (emailId: string, preset: string, customTs?: number | Date | string, reason?: string) => void;
  unsnoozeEmail: (emailId: string) => void;
  activeWakeupAlerts: { emailId: string; message: string; timestamp: number }[];
  dismissWakeupAlert: (emailId: string) => void;

  // Feature 14: Filter Rules
  rules: FilterRuleState[];
  addRule: (rule: Omit<FilterRuleState, 'id'>) => void;
  toggleRule: (id: string) => void;
  deleteRule: (id: string) => void;

  // Feature 15: Templates & Canned Responses
  templates: CannedTemplateState[];
  addTemplate: (template: Omit<CannedTemplateState, 'id'>) => void;
  deleteTemplate: (id: string) => void;
  getTemplateByShortcut: (shortcut: string) => CannedTemplateState | undefined;

  // Feature 16: Shortcuts & Command Palette
  isCommandPaletteOpen: boolean;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  keySequence: string[];

  // Feature 17: Thread View
  activeThreadId: string | null;
  setActiveThreadId: (id: string | null) => void;

  // Feature 18: Batch Actions
  selectedEmailIds: string[];
  toggleSelectEmail: (id: string) => void;
  selectAllEmails: (ids: string[]) => void;
  clearSelection: () => void;
  executeBatchAction: (operation: string, value?: any) => Promise<boolean>;
  lastBatchUndoToken: string | null;
  undoLastBatch: () => Promise<boolean>;

  // Feature 19: Vacation Responder
  vacationSettings: VacationState | null;
  updateVacationSettings: (settings: VacationState) => void;

  // Feature 20: Offline Support & Sync Queue
  isOnline: boolean;
  offlineMutations: OfflineMutationState[];
  syncPendingMutations: () => Promise<void>;
  enqueueOfflineMutation: (type: string, payload: Record<string, any>) => void;
}

const ProductivityContext = createContext<ProductivityContextValue | undefined>(undefined);

export const ProductivityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Feature 11 state
  const [scheduledItems, setScheduledItems] = useState<ScheduledItem[]>([]);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  // Feature 12 state
  const [undoTicket, setUndoTicket] = useState<UndoSendTicketState | null>(null);
  const [gracePeriodSeconds, setGracePeriodSeconds] = useState(10);
  const [remainingGraceMs, setRemainingGraceMs] = useState(0);

  // Feature 13 state
  const [snoozedItems, setSnoozedItems] = useState<SnoozeItemState[]>([]);
  const [activeWakeupAlerts, setActiveWakeupAlerts] = useState<{ emailId: string; message: string; timestamp: number }[]>([]);

  // Feature 14 state
  const [rules, setRules] = useState<FilterRuleState[]>([
    {
      id: 'rule_default_1',
      name: 'Star Important Client Inquiries',
      trigger: 'on_inbound',
      condition: { type: 'predicate', field: 'subject', operator: 'contains', value: 'Urgent' },
      actions: [{ type: 'star' }, { type: 'apply_label', value: 'High Priority' }],
      isActive: true,
      orderPriority: 1,
    },
  ]);

  // Feature 15 state
  const [templates, setTemplates] = useState<CannedTemplateState[]>([
    {
      id: 'tpl_1',
      title: 'Meeting Confirmation',
      shortcutKey: '!meeting',
      subject: 'Confirmed: Meeting with {{sender.name | capitalize}} on {{date}}',
      body: 'Hi {{sender.name | capitalize | default: "there"}},\n\nLooking forward to speaking with you on {{date}} at {{time}}.\n\nBest regards,\n{{user.name | default: "The Team"}}',
      category: 'scheduling',
    },
    {
      id: 'tpl_2',
      title: 'Quick Follow-Up',
      shortcutKey: '!followup',
      subject: 'Following up on our conversation',
      body: 'Hi {{name | default: "there"}},\n\nJust checking in to see if you had any updates regarding our last discussion.\n\nThanks!',
      category: 'general',
    },
  ]);

  // Feature 16 state
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [keySequence, setKeySequence] = useState<string[]>([]);

  // Feature 17 state
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);

  // Feature 18 state
  const [selectedEmailIds, setSelectedEmailIds] = useState<string[]>([]);
  const [lastBatchUndoToken, setLastBatchUndoToken] = useState<string | null>(null);

  // Feature 19 state
  const [vacationSettings, setVacationSettings] = useState<VacationState | null>({
    domainId: 'default',
    userEmail: 'user@mailops.dev',
    subject: 'Out of Office: Automated Response',
    body: 'Thank you for reaching out. I am currently out of the office with limited access to email and will respond as soon as I return.',
    startDate: Date.now(),
    endDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
    isActive: false,
    cooldownHours: 24,
  });

  // Feature 20 state
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [offlineMutations, setOfflineMutations] = useState<OfflineMutationState[]>([]);

  // Online/Offline network listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Grace timer ticker for Undo Send
  useEffect(() => {
    if (!undoTicket || undoTicket.status !== 'buffered') {
      setRemainingGraceMs(0);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = undoTicket.expiresAt - now;

      if (remaining <= 0) {
        setRemainingGraceMs(0);
        setUndoTicket((prev) => (prev ? { ...prev, status: 'dispatched' } : null));
        clearInterval(interval);
      } else {
        setRemainingGraceMs(remaining);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [undoTicket]);

  // Keyboard shortcut listener for Cmd+K and global keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K to toggle Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        return;
      }

      // Ignore standard keys if typing in inputs/textareas
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      const isInput = tag === 'input' || tag === 'textarea' || (e.target as HTMLElement)?.isContentEditable;

      if (isInput) return;

      // Escape to close palette
      if (e.key === 'Escape') {
        setIsCommandPaletteOpen(false);
        setKeySequence([]);
        return;
      }

      // Record key sequence
      setKeySequence((prev) => {
        const next = [...prev, e.key];
        if (next.length > 3) return [e.key];
        return next;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // -------------------------------------------------------------
  // Feature 11 handlers
  // -------------------------------------------------------------
  const openScheduleModal = useCallback(() => setIsScheduleModalOpen(true), []);
  const closeScheduleModal = useCallback(() => setIsScheduleModalOpen(false), []);

  const scheduleEmail = useCallback(
    async (email: Omit<ScheduledItem, 'id' | 'status' | 'createdAt'>, sendAt: number | Date | string) => {
      const targetTs = typeof sendAt === 'number' ? sendAt : new Date(sendAt).getTime();
      const newItem: ScheduledItem = {
        ...email,
        id: `sched_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        sendAt: targetTs,
        status: 'pending',
        createdAt: Date.now(),
      };

      setScheduledItems((prev) => [newItem, ...prev]);
      closeScheduleModal();
      return true;
    },
    [closeScheduleModal]
  );

  const cancelScheduledEmail = useCallback(async (id: string) => {
    setScheduledItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'cancelled' } : item))
    );
    return true;
  }, []);

  // -------------------------------------------------------------
  // Feature 12 handlers
  // -------------------------------------------------------------
  const enqueueSendWithUndo = useCallback(
    (email: any, customGraceSeconds?: number, onDispatch?: () => Promise<void>) => {
      const grace = customGraceSeconds ?? gracePeriodSeconds;
      const now = Date.now();
      const token = `undo_${now}_${Math.random().toString(36).substring(2, 8)}`;
      const expiresAt = now + grace * 1000;

      const ticket: UndoSendTicketState = {
        token,
        email,
        bufferedAt: now,
        gracePeriodSeconds: grace,
        expiresAt,
        status: 'buffered',
      };

      setUndoTicket(ticket);
      setRemainingGraceMs(grace * 1000);

      // Schedule final dispatch
      setTimeout(() => {
        setUndoTicket((current) => {
          if (current?.token === token && current.status === 'buffered') {
            onDispatch?.();
            return { ...current, status: 'dispatched' };
          }
          return current;
        });
      }, grace * 1000);

      return token;
    },
    [gracePeriodSeconds]
  );

  const cancelUndoSend = useCallback(
    (token?: string) => {
      if (!undoTicket) return false;
      if (token && undoTicket.token !== token) return false;
      if (undoTicket.status !== 'buffered') return false;

      setUndoTicket((prev) => (prev ? { ...prev, status: 'cancelled' } : null));
      setRemainingGraceMs(0);
      return true;
    },
    [undoTicket]
  );

  // -------------------------------------------------------------
  // Feature 13 handlers
  // -------------------------------------------------------------
  const snoozeEmail = useCallback((emailId: string, preset: string, customTs?: number | Date | string, reason?: string) => {
    let targetTs = Date.now() + 4 * 60 * 60 * 1000;
    if (customTs) {
      targetTs = typeof customTs === 'number' ? customTs : new Date(customTs).getTime();
    } else if (preset === 'tomorrow_morning') {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(9, 0, 0, 0);
      targetTs = d.getTime();
    }

    const item: SnoozeItemState = {
      emailId,
      snoozedAt: Date.now(),
      snoozedUntil: targetTs,
      presetUsed: preset,
      reason,
      originalFolderId: 'inbox',
    };

    setSnoozedItems((prev) => [...prev.filter((i) => i.emailId !== emailId), item]);
  }, []);

  const unsnoozeEmail = useCallback((emailId: string) => {
    setSnoozedItems((prev) => prev.filter((i) => i.emailId !== emailId));
  }, []);

  const dismissWakeupAlert = useCallback((emailId: string) => {
    setActiveWakeupAlerts((prev) => prev.filter((a) => a.emailId !== emailId));
  }, []);

  // -------------------------------------------------------------
  // Feature 14 handlers
  // -------------------------------------------------------------
  const addRule = useCallback((rule: Omit<FilterRuleState, 'id'>) => {
    const newRule: FilterRuleState = {
      ...rule,
      id: `rule_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    setRules((prev) => [...prev, newRule]);
  }, []);

  const toggleRule = useCallback((id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r))
    );
  }, []);

  const deleteRule = useCallback((id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  }, []);

  // -------------------------------------------------------------
  // Feature 15 handlers
  // -------------------------------------------------------------
  const addTemplate = useCallback((tpl: Omit<CannedTemplateState, 'id'>) => {
    const item: CannedTemplateState = {
      ...tpl,
      id: `tpl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    setTemplates((prev) => [...prev, item]);
  }, []);

  const deleteTemplate = useCallback((id: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const getTemplateByShortcut = useCallback(
    (shortcut: string) => {
      const clean = shortcut.trim().toLowerCase();
      return templates.find((t) => t.shortcutKey && t.shortcutKey.toLowerCase() === clean);
    },
    [templates]
  );

  // -------------------------------------------------------------
  // Feature 16 handlers
  // -------------------------------------------------------------
  const openCommandPalette = useCallback(() => setIsCommandPaletteOpen(true), []);
  const closeCommandPalette = useCallback(() => setIsCommandPaletteOpen(false), []);

  // -------------------------------------------------------------
  // Feature 18 handlers
  // -------------------------------------------------------------
  const toggleSelectEmail = useCallback((id: string) => {
    setSelectedEmailIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  const selectAllEmails = useCallback((ids: string[]) => {
    setSelectedEmailIds(ids);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedEmailIds([]);
  }, []);

  const executeBatchAction = useCallback(async (_operation: string, _value?: any) => {
    if (selectedEmailIds.length === 0) return false;

    const undoToken = `batch_undo_${Date.now()}`;
    setLastBatchUndoToken(undoToken);
    clearSelection();
    return true;
  }, [selectedEmailIds, clearSelection]);

  const undoLastBatch = useCallback(async () => {
    if (!lastBatchUndoToken) return false;
    setLastBatchUndoToken(null);
    return true;
  }, [lastBatchUndoToken]);

  // -------------------------------------------------------------
  // Feature 19 handlers
  // -------------------------------------------------------------
  const updateVacationSettings = useCallback((settings: VacationState) => {
    setVacationSettings(settings);
  }, []);

  // -------------------------------------------------------------
  // Feature 20 handlers
  // -------------------------------------------------------------
  const enqueueOfflineMutation = useCallback((type: string, payload: Record<string, any>) => {
    const mutation: OfflineMutationState = {
      id: `mut_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type,
      payload,
      timestamp: Date.now(),
      status: 'pending',
      retryCount: 0,
    };
    setOfflineMutations((prev) => [...prev, mutation]);
  }, []);

  const syncPendingMutations = useCallback(async () => {
    if (!isOnline) return;

    setOfflineMutations((prev) =>
      prev.map((m) => (m.status === 'pending' ? { ...m, status: 'syncing' } : m))
    );

    // Simulate online sync completion
    setTimeout(() => {
      setOfflineMutations((prev) =>
        prev.map((m) => (m.status === 'syncing' ? { ...m, status: 'synced' } : m))
      );
    }, 600);
  }, [isOnline]);

  return (
    <ProductivityContext.Provider
      value={{
        scheduledItems,
        isScheduleModalOpen,
        openScheduleModal,
        closeScheduleModal,
        scheduleEmail,
        cancelScheduledEmail,
        undoTicket,
        gracePeriodSeconds,
        setGracePeriodSeconds,
        remainingGraceMs,
        enqueueSendWithUndo,
        cancelUndoSend,
        snoozedItems,
        snoozeEmail,
        unsnoozeEmail,
        activeWakeupAlerts,
        dismissWakeupAlert,
        rules,
        addRule,
        toggleRule,
        deleteRule,
        templates,
        addTemplate,
        deleteTemplate,
        getTemplateByShortcut,
        isCommandPaletteOpen,
        openCommandPalette,
        closeCommandPalette,
        keySequence,
        activeThreadId,
        setActiveThreadId,
        selectedEmailIds,
        toggleSelectEmail,
        selectAllEmails,
        clearSelection,
        executeBatchAction,
        lastBatchUndoToken,
        undoLastBatch,
        vacationSettings,
        updateVacationSettings,
        isOnline,
        offlineMutations,
        syncPendingMutations,
        enqueueOfflineMutation,
      }}
    >
      {children}
    </ProductivityContext.Provider>
  );
};

export const useProductivity = () => {
  const context = useContext(ProductivityContext);
  if (!context) {
    throw new Error('useProductivity must be used within a ProductivityProvider');
  }
  return context;
};
