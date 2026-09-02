import { Hono } from 'hono';
import {
  generateSmartReplies,
  summarizeEmail,
  categorizeEmail,
  analyzeSentiment,
  extractTasks,
  BM25SearchEngine,
  extractDecisions,
  detectFollowUpNudges,
  rephraseDraft,
  parseUnsubscribe,
  type SmartReplyContext,
  type EmailMetadata,
  type SearchableDocument,
  type ThreadMessage,
  type ThreadRecord,
  type ToneMode,
} from '../modules/ai';

export const aiRouter = new Hono();

// Feature 1: Smart Reply
aiRouter.post('/smart-reply', async (c) => {
  try {
    const body = await c.req.json<{ text: string; senderName?: string; threadHistory?: string[] }>();
    const context: SmartReplyContext = {
      senderName: body.senderName,
      threadHistory: body.threadHistory,
    };
    const replies = generateSmartReplies(body.text || '', context);
    return c.json({ replies });
  } catch (err: any) {
    return c.json({ error: err?.message || 'Failed to generate smart replies' }, 400);
  }
});

// Feature 2: Summarizer & TL;DR
aiRouter.post('/summarize', async (c) => {
  try {
    const body = await c.req.json<{ text: string }>();
    const summary = summarizeEmail(body.text || '');
    return c.json(summary);
  } catch (err: any) {
    return c.json({ error: err?.message || 'Failed to summarize email' }, 400);
  }
});

// Feature 3: Smart Categorization & Priority
aiRouter.post('/categorize', async (c) => {
  try {
    const body = await c.req.json<{
      from: string;
      to: string;
      subject: string;
      body?: string;
      headers?: Record<string, string>;
      isVip?: boolean;
    }>();
    const meta: EmailMetadata = {
      from: body.from || '',
      to: body.to || '',
      subject: body.subject || '',
      headers: body.headers || {},
      isVip: body.isVip,
    };
    const result = categorizeEmail(meta, body.body || '');
    return c.json(result);
  } catch (err: any) {
    return c.json({ error: err?.message || 'Failed to categorize email' }, 400);
  }
});

// Feature 4: Sentiment & Urgency Analyzer
aiRouter.post('/sentiment', async (c) => {
  try {
    const body = await c.req.json<{ text: string }>();
    const analysis = analyzeSentiment(body.text || '');
    return c.json(analysis);
  } catch (err: any) {
    return c.json({ error: err?.message || 'Failed to analyze sentiment' }, 400);
  }
});

// Feature 5: Action Item & Task Extractor
aiRouter.post('/extract-tasks', async (c) => {
  try {
    const body = await c.req.json<{ body: string; emailId?: string }>();
    const tasks = extractTasks(body.body || '', body.emailId);
    return c.json({ tasks });
  } catch (err: any) {
    return c.json({ error: err?.message || 'Failed to extract tasks' }, 400);
  }
});

// Feature 6: Smart Search & BM25 Matcher
aiRouter.post('/search', async (c) => {
  try {
    const body = await c.req.json<{ query: string; documents: SearchableDocument[] }>();
    const engine = new BM25SearchEngine(body.documents || []);
    const results = engine.search(body.query || '');
    return c.json({ results });
  } catch (err: any) {
    return c.json({ error: err?.message || 'Failed to execute search' }, 400);
  }
});

// Feature 7: Key Takeaways & Decision Tracker
aiRouter.post('/decisions', async (c) => {
  try {
    const body = await c.req.json<{ messages: ThreadMessage[] }>();
    const decisions = extractDecisions(body.messages || []);
    return c.json({ decisions });
  } catch (err: any) {
    return c.json({ error: err?.message || 'Failed to extract decisions' }, 400);
  }
});

// Feature 8: Smart Follow-Up Nudge Engine
aiRouter.post('/nudges', async (c) => {
  try {
    const body = await c.req.json<{
      threads: ThreadRecord[];
      nowMs?: number;
      daysThreshold?: number;
    }>();
    const nudges = detectFollowUpNudges(
      body.threads || [],
      body.nowMs ?? Date.now(),
      body.daysThreshold ?? 3
    );
    return c.json({ nudges });
  } catch (err: any) {
    return c.json({ error: err?.message || 'Failed to detect follow-up nudges' }, 400);
  }
});

// Feature 9: Draft Tone & Polish Re-phraser
aiRouter.post('/polish-draft', async (c) => {
  try {
    const body = await c.req.json<{ text: string; tone: ToneMode }>();
    const result = rephraseDraft(body.text || '', body.tone || 'professional');
    return c.json(result);
  } catch (err: any) {
    return c.json({ error: err?.message || 'Failed to polish draft' }, 400);
  }
});

// Feature 10: Smart Unsubscribe & Newsletter Parser
aiRouter.post('/parse-unsubscribe', async (c) => {
  try {
    const body = await c.req.json<{ headers?: Record<string, string>; htmlBody?: string }>();
    const result = parseUnsubscribe(body.headers || {}, body.htmlBody);
    return c.json(result);
  } catch (err: any) {
    return c.json({ error: err?.message || 'Failed to parse unsubscribe data' }, 400);
  }
});

// Unified Full Email Analysis
aiRouter.post('/analyze', async (c) => {
  try {
    const body = await c.req.json<{
      id?: string;
      from: string;
      to: string;
      subject: string;
      textBody?: string;
      htmlBody?: string;
      headers?: Record<string, string>;
      isVip?: boolean;
      threadMessages?: ThreadMessage[];
    }>();

    const text = body.textBody || '';
    const summary = summarizeEmail(text);
    const meta: EmailMetadata = {
      from: body.from || '',
      to: body.to || '',
      subject: body.subject || '',
      headers: body.headers || {},
      isVip: body.isVip,
    };
    const categorization = categorizeEmail(meta, text);
    const sentiment = analyzeSentiment(text);
    const tasks = extractTasks(text, body.id);
    const decisions = extractDecisions(body.threadMessages || (body.id ? [{
      id: body.id,
      author: body.from,
      body: text,
      timestamp: new Date().toISOString(),
    }] : []));
    const unsubscribe = parseUnsubscribe(body.headers || {}, body.htmlBody);
    const smartReplies = generateSmartReplies(text, { senderName: body.from.split('@')[0] });

    return c.json({
      summary,
      categorization,
      sentiment,
      tasks,
      decisions,
      unsubscribe,
      smartReplies,
    });
  } catch (err: any) {
    return c.json({ error: err?.message || 'Failed to analyze email' }, 400);
  }
});
