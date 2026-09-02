import { Hono } from 'hono';
import {
  generateCssVariables,
  getContrastRatio,
  clampPaneDimensions,
  markdownToHtml,
  sanitizeHtml,
  injectSignature,
  parsePlusAddress,
  SOUND_PRESETS,
  generateEml,
  buildFolderTree,
  AttachmentInvertedIndex,
  evaluateDndStatus,
} from '../modules/customization';

export const customizationRouter = new Hono();

// Feature 41: Themes
customizationRouter.post('/themes/css-vars', async (c) => {
  try {
    const body = await c.req.json<{ theme: any; systemPrefersDark?: boolean; customAccent?: string }>();
    const cssVars = generateCssVariables(body.theme || 'light', body.systemPrefersDark || false, body.customAccent);
    return c.json({ cssVars });
  } catch (err: any) {
    return c.json({ error: err?.message || 'Failed to generate theme CSS variables' }, 400);
  }
});

customizationRouter.post('/themes/contrast', async (c) => {
  try {
    const body = await c.req.json<{ foreground: string; background: string }>();
    const ratio = getContrastRatio(body.foreground, body.background);
    return c.json({ ratio, passesAA: ratio >= 4.5, passesAAA: ratio >= 7.0 });
  } catch (err: any) {
    return c.json({ error: err?.message || 'Failed to compute contrast ratio' }, 400);
  }
});

// Feature 42: Layouts
customizationRouter.post('/layouts/clamp', async (c) => {
  try {
    const body = await c.req.json<{ proposed: any; containerWidth: number; containerHeight: number }>();
    const result = clampPaneDimensions(body.proposed || {}, body.containerWidth || 1200, body.containerHeight || 800);
    return c.json(result);
  } catch (err: any) {
    return c.json({ error: err?.message || 'Failed to clamp layout dimensions' }, 400);
  }
});

// Feature 43: Markdown & Sanitizer
customizationRouter.post('/markdown/to-html', async (c) => {
  try {
    const body = await c.req.json<{ markdown: string; sanitize?: boolean }>();
    let html = markdownToHtml(body.markdown || '');
    if (body.sanitize !== false) {
      html = sanitizeHtml(html);
    }
    return c.json({ html });
  } catch (err: any) {
    return c.json({ error: err?.message || 'Failed to parse markdown' }, 400);
  }
});

// Feature 44: Signatures
customizationRouter.post('/signatures/inject', async (c) => {
  try {
    const body = await c.req.json<{ body: string; signature: string; format?: 'text' | 'html'; position?: 'bottom' | 'above-quote' }>();
    const result = injectSignature(body.body, body.signature, body.format, body.position);
    return c.json({ result });
  } catch (err: any) {
    return c.json({ error: err?.message || 'Failed to inject signature' }, 400);
  }
});

// Feature 45: Plus-Addressing
customizationRouter.post('/plus-addressing/parse', async (c) => {
  try {
    const body = await c.req.json<{ address: string; delimiters?: string[] }>();
    const parsed = parsePlusAddress(body.address || '', body.delimiters);
    return c.json(parsed);
  } catch (err: any) {
    return c.json({ error: err?.message || 'Failed to parse plus address' }, 400);
  }
});

// Feature 46: Audio Synthesizer
customizationRouter.get('/audio/presets', (c) => {
  try {
    return c.json({ presets: SOUND_PRESETS });
  } catch (err: any) {
    return c.json({ error: err?.message || 'Failed to get audio presets' }, 400);
  }
});

// Feature 47: EML Generation
customizationRouter.post('/eml/generate', async (c) => {
  try {
    const body = await c.req.json();
    const emlString = generateEml(body);
    return c.json({ eml: emlString });
  } catch (err: any) {
    return c.json({ error: err?.message || 'Failed to generate EML' }, 400);
  }
});

// Feature 48: DnD Folders
customizationRouter.post('/folders/tree', async (c) => {
  try {
    const body = await c.req.json<{ folders: any[]; emailCounts?: Record<string, number> }>();
    const tree = buildFolderTree(body.folders || [], body.emailCounts || {});
    return c.json({ tree });
  } catch (err: any) {
    return c.json({ error: err?.message || 'Failed to build folder tree' }, 400);
  }
});

// Feature 49: Attachment Content Indexer
customizationRouter.post('/attachments/index', async (c) => {
  try {
    const body = await c.req.json<{ attachmentId: string; emailId: string; filename: string; contentType: string; rawContent: string }>();
    const indexer = new AttachmentInvertedIndex();
    indexer.addDocument(body.attachmentId, body.emailId, body.filename, body.contentType, body.rawContent);
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: err?.message || 'Failed to index attachment' }, 400);
  }
});

// Feature 50: Notification & DND
customizationRouter.post('/dnd/check', async (c) => {
  try {
    const body = await c.req.json();
    const result = evaluateDndStatus(body.config, body.notification, body.evalDate ? new Date(body.evalDate) : new Date());
    return c.json(result);
  } catch (err: any) {
    return c.json({ error: err?.message || 'Failed to check DND status' }, 400);
  }
});
