import React, { createContext, useContext, useState } from 'react';

// Types
export type InboxRole = 'owner' | 'admin' | 'member' | 'viewer';
export type AssignmentStatus = 'unassigned' | 'in_progress' | 'waiting' | 'resolved';
export type PresenceAction = 'viewing' | 'drafting' | 'idle';
export type DraftReviewStatus = 'draft' | 'in_review' | 'approved';
export type CRMStage = 'lead' | 'opportunity' | 'active_customer' | 'vip' | 'churned';

export interface SharedInbox {
  id: string;
  name: string;
  domainId: string;
  description?: string | null;
  role: InboxRole;
}

export interface Assignment {
  emailId: string;
  assignedToUserId: string | null;
  assignedByUserId: string;
  status: AssignmentStatus;
  note?: string;
  updatedAt: string;
}

export interface InternalNote {
  id: string;
  emailId: string;
  threadId?: string | null;
  userId: string;
  authorName: string;
  content: string;
  isResolved: boolean;
  parentNoteId?: string | null;
  highlight?: { quotedSnippet: string } | null;
  createdAt: string;
}

export interface ActiveUserPresence {
  userId: string;
  userName: string;
  avatarUrl?: string | null;
  action: PresenceAction;
  lastHeartbeat: string;
}

export interface CollisionState {
  hasCollision: boolean;
  activeDraftingUsers: ActiveUserPresence[];
  activeViewingUsers: ActiveUserPresence[];
  warningMessage?: string | null;
}

export interface EmailDraft {
  id: string;
  threadId?: string | null;
  authorUserId: string;
  lockedByUserId?: string | null;
  lockedUntil?: string | null;
  toAddr?: string | null;
  subject?: string | null;
  body?: string | null;
  reviewStatus: DraftReviewStatus;
  version: number;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  linkUrl?: string | null;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface TagNode {
  id: string;
  name: string;
  color: string;
  parentId?: string | null;
  fullPath: string;
  effectiveColor: string;
  depth: number;
  children: TagNode[];
}

export interface CRMContactProfile {
  id: string;
  email: string;
  name?: string | null;
  company?: string | null;
  stage: CRMStage;
  phone?: string | null;
  notes?: string | null;
  domain: string;
  interactionCount: number;
  inboundCount: number;
  outboundCount: number;
  healthScore: number;
  deals: Array<{
    id: string;
    title: string;
    value: number;
    currency: string;
    stage: string;
  }>;
}

export interface TimelineEntry {
  id: string;
  timestamp: string;
  actor: string;
  description: string;
  icon: string;
  action: string;
}

interface CollaborationContextType {
  // Current user
  currentUserId: string;
  currentUserName: string;
  setCurrentUser: (id: string, name: string) => void;

  // Feature 21: Shared Inboxes & RBAC
  inboxes: SharedInbox[];
  activeInboxId: string | null;
  setActiveInboxId: (id: string | null) => void;
  createInbox: (name: string, description?: string) => Promise<void>;

  // Feature 22: Assignments
  assignments: Record<string, Assignment>; // emailId -> Assignment
  assignEmail: (emailId: string, assignedToUserId: string | null, status?: AssignmentStatus, note?: string) => Promise<void>;

  // Feature 23: Internal Notes
  notes: Record<string, InternalNote[]>; // emailId -> Notes
  addNote: (emailId: string, content: string, parentNoteId?: string, highlightSnippet?: string) => Promise<void>;
  resolveNote: (noteId: string, emailId: string) => Promise<void>;

  // Feature 24: Presence & Collision
  presenceMap: Record<string, ActiveUserPresence[]>; // emailId -> active users
  collisionState: CollisionState | null;
  sendPresenceHeartbeat: (emailId: string, action: PresenceAction) => Promise<void>;

  // Feature 25: Collaborative Drafts
  activeDraft: EmailDraft | null;
  loadDraft: (draftId: string) => Promise<void>;
  saveDraft: (draftId: string, updates: { toAddr?: string; subject?: string; body?: string }) => Promise<void>;
  lockDraft: (draftId: string) => Promise<boolean>;
  unlockDraft: (draftId: string) => Promise<void>;
  setDraftReview: (draftId: string, status: DraftReviewStatus) => Promise<void>;

  // Feature 26: Mentions & Alerts
  notifications: NotificationItem[];
  unreadNotificationCount: number;
  markNotificationRead: (id: string) => Promise<void>;

  // Feature 27: Audit Log
  timeline: TimelineEntry[];
  loadTimeline: (targetId?: string) => Promise<void>;

  // Feature 28: Share Links
  createShareLink: (threadId: string, options?: { expiresInMs?: number; password?: string; maxViews?: number }) => Promise<string>;

  // Feature 29: Tag Hierarchy
  tagTree: TagNode[];
  emailTags: Record<string, TagNode[]>; // emailId -> tags
  tagEmail: (emailId: string, tagId: string) => Promise<void>;
  untagEmail: (emailId: string, tagId: string) => Promise<void>;
  createTag: (name: string, color?: string, parentId?: string) => Promise<void>;

  // Feature 30: CRM Context
  crmProfile: CRMContactProfile | null;
  loadCRMProfile: (email: string) => Promise<void>;
  updateCRMContact: (email: string, updates: Partial<CRMContactProfile>) => Promise<void>;
  addCRMDeal: (email: string, deal: { title: string; value: number; currency: string; stage: string }) => Promise<void>;
}

const CollaborationContext = createContext<CollaborationContextType | undefined>(undefined);

export const CollaborationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUserId, setCurrentUserIdState] = useState<string>('user-1');
  const [currentUserName, setCurrentUserNameState] = useState<string>('Alex Chen');

  const setCurrentUser = (id: string, name: string) => {
    setCurrentUserIdState(id);
    setCurrentUserNameState(name);
  };

  // State
  const [inboxes, setInboxes] = useState<SharedInbox[]>([
    { id: 'inbox-support', name: 'Customer Support', domainId: 'mailops.dev', description: 'Tier 1 & 2 support queue', role: 'owner' },
    { id: 'inbox-sales', name: 'Enterprise Sales', domainId: 'mailops.dev', description: 'Inbound sales inquiries', role: 'admin' },
  ]);
  const [activeInboxId, setActiveInboxId] = useState<string | null>('inbox-support');

  const [assignments, setAssignments] = useState<Record<string, Assignment>>({
    'msg-1': {
      emailId: 'msg-1',
      assignedToUserId: 'user-1',
      assignedByUserId: 'user-2',
      status: 'in_progress',
      note: 'Investigating billing discrepancy',
      updatedAt: new Date().toISOString(),
    },
  });

  const [notes, setNotes] = useState<Record<string, InternalNote[]>>({
    'msg-1': [
      {
        id: 'note-1',
        emailId: 'msg-1',
        userId: 'user-2',
        authorName: 'Sarah Connor',
        content: 'Customer confirmed they were charged twice on invoice #9021. @alex can you verify Stripe refund?',
        isResolved: false,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
    ],
  });

  const [presenceMap, setPresenceMap] = useState<Record<string, ActiveUserPresence[]>>({
    'msg-1': [
      { userId: 'user-2', userName: 'Sarah Connor', action: 'viewing', lastHeartbeat: new Date().toISOString() },
    ],
  });
  const [collisionState, setCollisionState] = useState<CollisionState | null>(null);

  const [activeDraft, setActiveDraft] = useState<EmailDraft | null>({
    id: 'draft-1',
    threadId: 'thread-101',
    authorUserId: 'user-1',
    toAddr: 'customer@enterprise.com',
    subject: 'Re: Enterprise Agreement terms & SLA clarification',
    body: 'Hi Sarah,\n\nWe have updated the SLA to guaranteed 99.99% uptime with 1-hour P1 response.\n\nBest,\nMailops Team',
    reviewStatus: 'draft',
    version: 1,
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      userId: 'user-1',
      title: 'Sarah Connor mentioned you in a note',
      message: '"@alex can you verify Stripe refund?"',
      linkUrl: '/inbox/thread/msg-1',
      type: 'mention',
      isRead: false,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
  ]);

  const [timeline, setTimeline] = useState<TimelineEntry[]>([
    {
      id: 'time-1',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      actor: 'Sarah Connor',
      description: 'Sarah Connor assigned this thread to Alex Chen',
      icon: '👤',
      action: 'assignment_created',
    },
    {
      id: 'time-2',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      actor: 'Sarah Connor',
      description: 'Sarah Connor added an internal note with mention @alex',
      icon: '💬',
      action: 'note_added',
    },
  ]);

  const [tagTree, setTagTree] = useState<TagNode[]>([
    {
      id: 'tag-support',
      name: 'Support',
      color: '#ef4444',
      fullPath: 'Support',
      effectiveColor: '#ef4444',
      depth: 0,
      children: [
        {
          id: 'tag-tier1',
          name: 'Tier1',
          color: '#ef4444',
          parentId: 'tag-support',
          fullPath: 'Support/Tier1',
          effectiveColor: '#ef4444',
          depth: 1,
          children: [],
        },
        {
          id: 'tag-billing',
          name: 'Billing',
          color: '#ef4444',
          parentId: 'tag-support',
          fullPath: 'Support/Billing',
          effectiveColor: '#ef4444',
          depth: 1,
          children: [],
        },
      ],
    },
    {
      id: 'tag-sales',
      name: 'Sales',
      color: '#10b981',
      fullPath: 'Sales',
      effectiveColor: '#10b981',
      depth: 0,
      children: [
        {
          id: 'tag-enterprise',
          name: 'Enterprise',
          color: '#10b981',
          parentId: 'tag-sales',
          fullPath: 'Sales/Enterprise',
          effectiveColor: '#10b981',
          depth: 1,
          children: [],
        },
      ],
    },
  ]);

  const [emailTags, setEmailTags] = useState<Record<string, TagNode[]>>({
    'msg-1': [
      {
        id: 'tag-billing',
        name: 'Billing',
        color: '#ef4444',
        parentId: 'tag-support',
        fullPath: 'Support/Billing',
        effectiveColor: '#ef4444',
        depth: 1,
        children: [],
      },
    ],
  });

  const [crmProfile, setCRMProfile] = useState<CRMContactProfile | null>({
    id: 'crm-customer_enterprise_com',
    email: 'customer@enterprise.com',
    name: 'Sarah Connor',
    company: 'Enterprise Inc',
    domain: 'enterprise.com',
    stage: 'active_customer',
    phone: '+1 (555) 234-5678',
    notes: 'Key stakeholder for annual contract renewal. Highly responsive.',
    interactionCount: 14,
    inboundCount: 8,
    outboundCount: 6,
    healthScore: 92,
    deals: [
      { id: 'deal-1', title: 'Annual Enterprise Expansion', value: 48000, currency: 'USD', stage: 'negotiation' },
    ],
  });

  // Action implementations
  const createInbox = async (name: string, description?: string) => {
    const newInbox: SharedInbox = {
      id: `inbox-${Date.now()}`,
      name,
      domainId: 'mailops.dev',
      description,
      role: 'owner',
    };
    setInboxes(prev => [...prev, newInbox]);
  };

  const assignEmail = async (
    emailId: string,
    assignedToUserId: string | null,
    status: AssignmentStatus = 'in_progress',
    note?: string
  ) => {
    const record: Assignment = {
      emailId,
      assignedToUserId,
      assignedByUserId: currentUserId,
      status: assignedToUserId ? status : 'unassigned',
      note,
      updatedAt: new Date().toISOString(),
    };
    setAssignments(prev => ({ ...prev, [emailId]: record }));

    const event: TimelineEntry = {
      id: `time-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: currentUserName,
      description: assignedToUserId
        ? `${currentUserName} assigned thread to ${assignedToUserId === 'user-1' ? 'Alex Chen' : assignedToUserId}`
        : `${currentUserName} unassigned this thread`,
      icon: '👤',
      action: 'assignment_updated',
    };
    setTimeline(prev => [event, ...prev]);
  };

  const addNote = async (
    emailId: string,
    content: string,
    parentNoteId?: string,
    highlightSnippet?: string
  ) => {
    const newNote: InternalNote = {
      id: `note-${Date.now()}`,
      emailId,
      userId: currentUserId,
      authorName: currentUserName,
      content,
      isResolved: false,
      parentNoteId: parentNoteId || null,
      highlight: highlightSnippet ? { quotedSnippet: highlightSnippet } : null,
      createdAt: new Date().toISOString(),
    };

    setNotes(prev => ({
      ...prev,
      [emailId]: [...(prev[emailId] || []), newNote],
    }));

    // Auto-detect mention
    if (content.includes('@')) {
      const match = content.match(/@([a-zA-Z0-9_\.\-]+)/);
      if (match) {
        const mentioned = match[1].toLowerCase();
        if (mentioned !== currentUserName.toLowerCase().split(' ')[0]) {
          const notif: NotificationItem = {
            id: `notif-${Date.now()}`,
            userId: 'user-2',
            title: `${currentUserName} mentioned you in a note`,
            message: `"${content.slice(0, 60)}"`,
            linkUrl: `/inbox/thread/${emailId}`,
            type: 'mention',
            isRead: false,
            createdAt: new Date().toISOString(),
          };
          setNotifications(prev => [notif, ...prev]);
        }
      }
    }

    const event: TimelineEntry = {
      id: `time-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: currentUserName,
      description: `${currentUserName} added an internal note`,
      icon: '💬',
      action: 'note_added',
    };
    setTimeline(prev => [event, ...prev]);
  };

  const resolveNote = async (noteId: string, emailId: string) => {
    setNotes(prev => {
      const list = prev[emailId] || [];
      return {
        ...prev,
        [emailId]: list.map(n => (n.id === noteId ? { ...n, isResolved: true } : n)),
      };
    });
  };

  const sendPresenceHeartbeat = async (emailId: string, action: PresenceAction) => {
    setPresenceMap(prev => {
      const existing = prev[emailId] || [];
      const updated = existing.filter(u => u.userId !== currentUserId);
      return {
        ...prev,
        [emailId]: [
          ...updated,
          {
            userId: currentUserId,
            userName: currentUserName,
            action,
            lastHeartbeat: new Date().toISOString(),
          },
        ],
      };
    });

    const activeList = presenceMap[emailId] || [];
    const drafters = activeList.filter(u => u.userId !== currentUserId && u.action === 'drafting');
    const viewers = activeList.filter(u => u.userId !== currentUserId && u.action === 'viewing');

    setCollisionState({
      hasCollision: drafters.length > 0,
      activeDraftingUsers: drafters,
      activeViewingUsers: viewers,
      warningMessage: drafters.length > 0
        ? `Collision Alert: ${drafters.map(d => d.userName).join(', ')} is currently drafting a reply!`
        : null,
    });
  };

  const loadDraft = async (_draftId: string) => {
    // Already in state
  };

  const saveDraft = async (draftId: string, updates: { toAddr?: string; subject?: string; body?: string }) => {
    if (activeDraft && activeDraft.id === draftId) {
      setActiveDraft(prev => prev ? {
        ...prev,
        ...updates,
        version: prev.version + 1,
      } : null);
    }
  };

  const lockDraft = async (draftId: string): Promise<boolean> => {
    if (activeDraft && activeDraft.id === draftId) {
      if (activeDraft.lockedByUserId && activeDraft.lockedByUserId !== currentUserId) {
        return false;
      }
      setActiveDraft(prev => prev ? {
        ...prev,
        lockedByUserId: currentUserId,
        lockedUntil: new Date(Date.now() + 60000).toISOString(),
      } : null);
      return true;
    }
    return false;
  };

  const unlockDraft = async (draftId: string) => {
    if (activeDraft && activeDraft.id === draftId) {
      setActiveDraft(prev => prev ? {
        ...prev,
        lockedByUserId: null,
        lockedUntil: null,
      } : null);
    }
  };

  const setDraftReview = async (draftId: string, status: DraftReviewStatus) => {
    if (activeDraft && activeDraft.id === draftId) {
      setActiveDraft(prev => prev ? { ...prev, reviewStatus: status } : null);
      const event: TimelineEntry = {
        id: `time-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actor: currentUserName,
        description: `${currentUserName} set draft review to "${status}"`,
        icon: '📝',
        action: 'draft_review_status',
      };
      setTimeline(prev => [event, ...prev]);
    }
  };

  const markNotificationRead = async (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const loadTimeline = async (_targetId?: string) => {
    // timeline loaded
  };

  const createShareLink = async (
    _threadId: string,
    _options?: { expiresInMs?: number; password?: string; maxViews?: number }
  ): Promise<string> => {
    const token = `share_${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`;
    const event: TimelineEntry = {
      id: `time-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: currentUserName,
      description: `${currentUserName} created a public share snapshot link`,
      icon: '🔗',
      action: 'share_link_created',
    };
    setTimeline(prev => [event, ...prev]);
    return `${window.location.origin}/share/${token}`;
  };

  const tagEmail = async (emailId: string, tagId: string) => {
    // Find node in tree
    const findNode = (nodes: TagNode[]): TagNode | null => {
      for (const n of nodes) {
        if (n.id === tagId) return n;
        const found = findNode(n.children);
        if (found) return found;
      }
      return null;
    };
    const node = findNode(tagTree);
    if (!node) return;

    setEmailTags(prev => {
      const existing = prev[emailId] || [];
      if (existing.some(t => t.id === tagId)) return prev;
      return { ...prev, [emailId]: [...existing, node] };
    });

    const event: TimelineEntry = {
      id: `time-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: currentUserName,
      description: `${currentUserName} applied tag "${node.fullPath}"`,
      icon: '🏷️',
      action: 'tag_added',
    };
    setTimeline(prev => [event, ...prev]);
  };

  const untagEmail = async (emailId: string, tagId: string) => {
    setEmailTags(prev => {
      const existing = prev[emailId] || [];
      return { ...prev, [emailId]: existing.filter(t => t.id !== tagId) };
    });
  };

  const createTag = async (name: string, color?: string, parentId?: string) => {
    const id = `tag-${Date.now()}`;
    const newTag: TagNode = {
      id,
      name,
      color: color || '#3b82f6',
      parentId: parentId || null,
      fullPath: parentId ? `Support/${name}` : name,
      effectiveColor: color || '#3b82f6',
      depth: parentId ? 1 : 0,
      children: [],
    };
    setTagTree(prev => [...prev, newTag]);
  };

  const loadCRMProfile = async (_email: string) => {
    // CRM contact lookup
  };

  const updateCRMContact = async (email: string, updates: Partial<CRMContactProfile>) => {
    setCRMProfile(prev => (prev && prev.email === email ? { ...prev, ...updates } : prev));
  };

  const addCRMDeal = async (
    _email: string,
    deal: { title: string; value: number; currency: string; stage: string }
  ) => {
    setCRMProfile(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        deals: [...prev.deals, { ...deal, id: `deal-${Date.now()}` }],
      };
    });
  };

  const unreadNotificationCount = notifications.filter(n => !n.isRead).length;

  return (
    <CollaborationContext.Provider
      value={{
        currentUserId,
        currentUserName,
        setCurrentUser,
        inboxes,
        activeInboxId,
        setActiveInboxId,
        createInbox,
        assignments,
        assignEmail,
        notes,
        addNote,
        resolveNote,
        presenceMap,
        collisionState,
        sendPresenceHeartbeat,
        activeDraft,
        loadDraft,
        saveDraft,
        lockDraft,
        unlockDraft,
        setDraftReview,
        notifications,
        unreadNotificationCount,
        markNotificationRead,
        timeline,
        loadTimeline,
        createShareLink,
        tagTree,
        emailTags,
        tagEmail,
        untagEmail,
        createTag,
        crmProfile,
        loadCRMProfile,
        updateCRMContact,
        addCRMDeal,
      }}
    >
      {children}
    </CollaborationContext.Provider>
  );
};

export const useCollaboration = (): CollaborationContextType => {
  const context = useContext(CollaborationContext);
  if (!context) {
    throw new Error('useCollaboration must be used within a CollaborationProvider');
  }
  return context;
};
