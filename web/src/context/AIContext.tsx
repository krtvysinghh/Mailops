import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type SmartReplyTone = 'enthusiastic' | 'neutral' | 'deferral' | 'inquisitive';

export interface SmartReplyOption {
  text: string;
  tone: SmartReplyTone;
}

export interface EmailSummary {
  tldr: string;
  keyPoints: string[];
  wordCount: number;
  readingTimeSeconds: number;
}

export type EmailCategory = 'Primary' | 'Updates' | 'Social' | 'Promotions' | 'Forums';

export interface EmailMetadata {
  from: string;
  to: string;
  subject: string;
  headers?: Record<string, string>;
  isVip?: boolean;
}

export interface CategorizationResult {
  category: EmailCategory;
  priorityScore: number;
  isUrgent: boolean;
}

export type SentimentType = 'positive' | 'neutral' | 'negative' | 'urgent';

export interface SentimentAnalysisResult {
  sentiment: SentimentType;
  score: number;
  isUrgent: boolean;
  detectedDeadlines: string[];
}

export interface ExtractedTask {
  id: string;
  text: string;
  assignee?: string;
  dueDate?: string;
  completed: boolean;
  confidence: number;
}

export interface SearchableDocument {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  hasAttachment?: boolean;
  isUnread?: boolean;
  isStarred?: boolean;
  [key: string]: any;
}

export interface ThreadMessage {
  id: string;
  author: string;
  body: string;
  timestamp: string;
}

export interface ExtractedDecision {
  text: string;
  decider: string;
  emailId: string;
  timestamp: string;
}

export interface ThreadRecord {
  threadId: string;
  lastSentByMe: boolean;
  lastMessageTimestamp: number;
  subject: string;
  hasQuestionOrCommitment: boolean;
  replied: boolean;
}

export type NudgeType = 'need_followup' | 'need_reply';

export interface NudgeAlert {
  threadId: string;
  subject: string;
  daysWaiting: number;
  type: NudgeType;
}

export type ToneMode = 'professional' | 'casual' | 'concise' | 'expanded';

export interface TonePolishResult {
  polishedText: string;
  changesCount: number;
}

export interface UnsubscribeResult {
  canOneClick: boolean;
  unsubscribeUrl?: string;
  mailtoTarget?: string;
  method?: 'one-click-post' | 'https' | 'mailto';
}

export interface FullAnalysisPayload {
  id?: string;
  from: string;
  to: string;
  subject: string;
  textBody?: string;
  htmlBody?: string;
  headers?: Record<string, string>;
  isVip?: boolean;
  threadMessages?: ThreadMessage[];
}

interface AIContextValue {
  activeSummary: EmailSummary | null;
  activeCategorization: CategorizationResult | null;
  activeSentiment: SentimentAnalysisResult | null;
  activeTasks: ExtractedTask[];
  activeDecisions: ExtractedDecision[];
  activeSmartReplies: SmartReplyOption[];
  activeUnsubscribe: UnsubscribeResult | null;
  nudges: NudgeAlert[];
  isAnalyzing: boolean;
  analysisError: string | null;

  // Actions
  generateReplies: (text: string, senderName?: string) => Promise<SmartReplyOption[]>;
  summarize: (text: string) => Promise<EmailSummary>;
  categorize: (meta: EmailMetadata, body?: string) => Promise<CategorizationResult>;
  analyzeSentiment: (text: string) => Promise<SentimentAnalysisResult>;
  extractTasks: (body: string, emailId?: string) => Promise<ExtractedTask[]>;
  searchBM25: (query: string, documents: SearchableDocument[]) => Promise<SearchableDocument[]>;
  trackDecisions: (messages: ThreadMessage[]) => Promise<ExtractedDecision[]>;
  fetchNudges: (threads: ThreadRecord[], daysThreshold?: number) => Promise<NudgeAlert[]>;
  polishDraft: (text: string, tone: ToneMode) => Promise<TonePolishResult>;
  parseUnsubscribe: (headers?: Record<string, string>, htmlBody?: string) => Promise<UnsubscribeResult>;
  analyzeEmail: (email: FullAnalysisPayload) => Promise<void>;
  toggleTaskStatus: (taskId: string) => void;
  clearActiveAnalysis: () => void;
}

const AIContext = createContext<AIContextValue | null>(null);

const API_BASE = 'http://localhost:8787/api/ai';

export const AIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeSummary, setActiveSummary] = useState<EmailSummary | null>(null);
  const [activeCategorization, setActiveCategorization] = useState<CategorizationResult | null>(null);
  const [activeSentiment, setActiveSentiment] = useState<SentimentAnalysisResult | null>(null);
  const [activeTasks, setActiveTasks] = useState<ExtractedTask[]>([]);
  const [activeDecisions, setActiveDecisions] = useState<ExtractedDecision[]>([]);
  const [activeSmartReplies, setActiveSmartReplies] = useState<SmartReplyOption[]>([]);
  const [activeUnsubscribe, setActiveUnsubscribe] = useState<UnsubscribeResult | null>(null);
  const [nudges, setNudges] = useState<NudgeAlert[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const generateReplies = useCallback(async (text: string, senderName?: string): Promise<SmartReplyOption[]> => {
    try {
      const res = await fetch(`${API_BASE}/smart-reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, senderName }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.replies;
      }
    } catch {
      // Fallback local smart replies
    }
    return [
      { text: 'Received, thank you.', tone: 'neutral' },
      { text: 'Thanks for the update.', tone: 'neutral' },
      { text: 'Got it, will review shortly.', tone: 'deferral' },
    ];
  }, []);

  const summarize = useCallback(async (text: string): Promise<EmailSummary> => {
    try {
      const res = await fetch(`${API_BASE}/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    return { tldr: text.slice(0, 120), keyPoints: [text.slice(0, 120)], wordCount: text.split(/\s+/).length, readingTimeSeconds: 1 };
  }, []);

  const categorize = useCallback(async (meta: EmailMetadata, body: string = ''): Promise<CategorizationResult> => {
    try {
      const res = await fetch(`${API_BASE}/categorize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...meta, body }),
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    return { category: 'Primary', priorityScore: 50, isUrgent: false };
  }, []);

  const analyzeSentimentLocal = useCallback(async (text: string): Promise<SentimentAnalysisResult> => {
    try {
      const res = await fetch(`${API_BASE}/sentiment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    return { sentiment: 'neutral', score: 0, isUrgent: false, detectedDeadlines: [] };
  }, []);

  const extractTasksLocal = useCallback(async (body: string, emailId?: string): Promise<ExtractedTask[]> => {
    try {
      const res = await fetch(`${API_BASE}/extract-tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body, emailId }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.tasks;
      }
    } catch {
      // Fallback
    }
    return [];
  }, []);

  const searchBM25 = useCallback(async (query: string, documents: SearchableDocument[]): Promise<SearchableDocument[]> => {
    try {
      const res = await fetch(`${API_BASE}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, documents }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.results;
      }
    } catch {
      // Local filter fallback
    }
    const q = query.toLowerCase();
    return documents.filter(d => d.subject.toLowerCase().includes(q) || d.body.toLowerCase().includes(q));
  }, []);

  const trackDecisions = useCallback(async (messages: ThreadMessage[]): Promise<ExtractedDecision[]> => {
    try {
      const res = await fetch(`${API_BASE}/decisions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.decisions;
      }
    } catch {
      // Fallback
    }
    return [];
  }, []);

  const fetchNudges = useCallback(async (threads: ThreadRecord[], daysThreshold: number = 3): Promise<NudgeAlert[]> => {
    try {
      const res = await fetch(`${API_BASE}/nudges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threads, nowMs: Date.now(), daysThreshold }),
      });
      if (res.ok) {
        const data = await res.json();
        setNudges(data.nudges);
        return data.nudges;
      }
    } catch {
      // Fallback
    }
    return [];
  }, []);

  const polishDraft = useCallback(async (text: string, tone: ToneMode): Promise<TonePolishResult> => {
    try {
      const res = await fetch(`${API_BASE}/polish-draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, tone }),
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    return { polishedText: text, changesCount: 0 };
  }, []);

  const parseUnsubscribeLocal = useCallback(async (headers?: Record<string, string>, htmlBody?: string): Promise<UnsubscribeResult> => {
    try {
      const res = await fetch(`${API_BASE}/parse-unsubscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headers, htmlBody }),
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    return { canOneClick: false };
  }, []);

  const analyzeEmail = useCallback(async (email: FullAnalysisPayload): Promise<void> => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      const res = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(email),
      });
      if (res.ok) {
        const data = await res.json();
        setActiveSummary(data.summary);
        setActiveCategorization(data.categorization);
        setActiveSentiment(data.sentiment);
        setActiveTasks(data.tasks || []);
        setActiveDecisions(data.decisions || []);
        setActiveSmartReplies(data.smartReplies || []);
        setActiveUnsubscribe(data.unsubscribe);
      } else {
        throw new Error('Analysis API responded with error');
      }
    } catch (err: any) {
      setAnalysisError(err?.message || 'Failed to analyze email');
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const toggleTaskStatus = useCallback((taskId: string) => {
    setActiveTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, completed: !t.completed } : t))
    );
  }, []);

  const clearActiveAnalysis = useCallback(() => {
    setActiveSummary(null);
    setActiveCategorization(null);
    setActiveSentiment(null);
    setActiveTasks([]);
    setActiveDecisions([]);
    setActiveSmartReplies([]);
    setActiveUnsubscribe(null);
    setAnalysisError(null);
  }, []);

  return (
    <AIContext.Provider
      value={{
        activeSummary,
        activeCategorization,
        activeSentiment,
        activeTasks,
        activeDecisions,
        activeSmartReplies,
        activeUnsubscribe,
        nudges,
        isAnalyzing,
        analysisError,
        generateReplies,
        summarize,
        categorize,
        analyzeSentiment: analyzeSentimentLocal,
        extractTasks: extractTasksLocal,
        searchBM25,
        trackDecisions,
        fetchNudges,
        polishDraft,
        parseUnsubscribe: parseUnsubscribeLocal,
        analyzeEmail,
        toggleTaskStatus,
        clearActiveAnalysis,
      }}
    >
      {children}
    </AIContext.Provider>
  );
};

export function useAI(): AIContextValue {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
}
