/**
 * Feature 43: Rich Text / Markdown Hybrid Composer
 * Pure TypeScript Markdown Parser, Safe HTML Sanitizer,
 * and Live Shortcut Trigger Engine with zero external dependencies.
 */

export interface SanitizerOptions {
  allowedTags?: Set<string>;
  allowedAttributes?: Record<string, Set<string>>;
  allowedProtocols?: Set<string>;
  stripDangerousTags?: boolean;
}

const DEFAULT_ALLOWED_TAGS = new Set([
  'p', 'br', 'b', 'strong', 'i', 'em', 'u', 's', 'strike', 'del',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'blockquote', 'code', 'pre',
  'ul', 'ol', 'li',
  'a', 'span', 'div',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'img', 'hr'
]);

const DEFAULT_ALLOWED_ATTRIBUTES: Record<string, Set<string>> = {
  a: new Set(['href', 'title', 'target', 'rel']),
  img: new Set(['src', 'alt', 'title', 'width', 'height']),
  span: new Set(['style', 'class']),
  div: new Set(['style', 'class']),
  p: new Set(['style', 'class']),
  th: new Set(['align', 'colspan', 'rowspan']),
  td: new Set(['align', 'colspan', 'rowspan']),
  code: new Set(['class']),
  pre: new Set(['class']),
};

const DEFAULT_ALLOWED_PROTOCOLS = new Set([
  'http:', 'https:', 'mailto:', 'tel:', 'data:'
]);

/**
 * Strips dangerous HTML tags, inline event handlers, and javascript: links.
 */
export function sanitizeHtml(html: string, options: SanitizerOptions = {}): string {
  if (!html || typeof html !== 'string') return '';

  const allowedTags = options.allowedTags || DEFAULT_ALLOWED_TAGS;
  const allowedAttrs = options.allowedAttributes || DEFAULT_ALLOWED_ATTRIBUTES;
  const allowedProtocols = options.allowedProtocols || DEFAULT_ALLOWED_PROTOCOLS;

  // 1. Remove script, iframe, object, embed, style tags completely with contents
  let clean = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  clean = clean.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  clean = clean.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '');
  clean = clean.replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '');
  clean = clean.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // 2. Tokenize and sanitize tags
  clean = clean.replace(/<\/?([a-zA-Z0-9\-]+)([^>]*)>/gi, (match, tagRaw, attrsRaw) => {
    const tag = tagRaw.toLowerCase();
    const isClosing = match.startsWith('</');

    if (!allowedTags.has(tag)) {
      return ''; // Strip disallowed tags
    }

    if (isClosing) {
      return `</${tag}>`;
    }

    // Parse attributes
    const allowedForTag = allowedAttrs[tag] || new Set();
    const globalAllowed = new Set(['title', 'class', 'id', 'aria-label']);
    
    const attrRegex = /([a-zA-Z0-9\-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
    let attrMatch: RegExpExecArray | null;
    const sanitizedAttrs: string[] = [];

    while ((attrMatch = attrRegex.exec(attrsRaw)) !== null) {
      const attrName = attrMatch[1].toLowerCase();
      const attrValue = attrMatch[2] ?? attrMatch[3] ?? attrMatch[4] ?? '';

      // Block all event handlers (onclick, onload, onerror, etc.)
      if (attrName.startsWith('on')) continue;

      // Check allowed list
      if (!allowedForTag.has(attrName) && !globalAllowed.has(attrName)) {
        continue;
      }

      // Check URLs for dangerous protocols (href, src)
      if (attrName === 'href' || attrName === 'src') {
        const trimmedVal = attrValue.trim();
        const protocolMatch = trimmedVal.match(/^([a-zA-Z0-9+.-]+):/);
        if (protocolMatch) {
          const protocol = protocolMatch[1].toLowerCase() + ':';
          if (!allowedProtocols.has(protocol)) {
            continue; // Skip dangerous protocol like javascript:
          }
        }
      }

      // Sanitize attribute value
      const escapedVal = attrValue
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      sanitizedAttrs.push(`${attrName}="${escapedVal}"`);
    }

    const attrString = sanitizedAttrs.length > 0 ? ' ' + sanitizedAttrs.join(' ') : '';
    const isSelfClosing = match.endsWith('/>') || tag === 'br' || tag === 'img' || tag === 'hr';
    return `<${tag}${attrString}${isSelfClosing ? ' /' : ''}>`;
  });

  return clean;
}

/**
 * Converts Markdown text into sanitized HTML.
 */
export function markdownToHtml(markdown: string): string {
  if (!markdown || typeof markdown !== 'string') return '';

  let text = markdown;

  // Normalize line endings
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Code blocks (fenced ```lang\ncode\n```)
  text = text.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (_m, lang, code) => {
    const escaped = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const cls = lang ? ` class="language-${lang}"` : '';
    return `<pre><code${cls}>${escaped}</code></pre>`;
  });

  // Inline code (`code`)
  text = text.replace(/`([^`\n]+)`/g, (_m, code) => {
    const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<code>${escaped}</code>`;
  });

  // Images ![alt](url)
  text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');

  // Links [text](url)
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  // Headings (#, ##, ###, ####, #####, ######)
  text = text.replace(/^###### (.*$)/gim, '<h6>$1</h6>');
  text = text.replace(/^##### (.*$)/gim, '<h5>$1</h5>');
  text = text.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
  text = text.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  text = text.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  text = text.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Horizontal rules (--- or ***)
  text = text.replace(/^(?:---|\*\*\*|___)\s*$/gim, '<hr />');

  // Blockquotes (> text)
  text = text.replace(/^\> (.*$)/gim, '<blockquote><p>$1</p></blockquote>');
  // Merge adjacent blockquotes
  text = text.replace(/<\/blockquote>\n<blockquote>/g, '\n');

  // Bold & Italic
  text = text.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
  text = text.replace(/___(.*?)___/g, '<strong><em>$1</em></strong>');
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/__(.*?)__/g, '<strong>$1</strong>');
  text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
  text = text.replace(/_(.*?)_/g, '<em>$1</em>');
  text = text.replace(/~~(.*?)~~/g, '<del>$1</del>');

  // Unordered Lists (- item or * item)
  text = text.replace(/^[\*\-] (.*$)/gim, '<li>$1</li>');
  // Ordered Lists (1. item)
  text = text.replace(/^\d+\. (.*$)/gim, '<oli>$1</oli>');

  // Wrap list items in <ul> and <ol>
  text = text.replace(/(<li>[\s\S]*?<\/li>)/g, (match) => {
    return `<ul>${match}</ul>`;
  });
  text = text.replace(/<\/ul>\s*<ul>/g, ''); // Join contiguous ul

  text = text.replace(/(<oli>[\s\S]*?<\/oli>)/g, (match) => {
    const cleanOli = match.replace(/<oli>/g, '<li>').replace(/<\/oli>/g, '</li>');
    return `<ol>${cleanOli}</ol>`;
  });
  text = text.replace(/<\/ol>\s*<ol>/g, ''); // Join contiguous ol

  // Paragraphs (split by double newlines, skip existing block elements)
  const blockTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'pre', 'blockquote', 'ul', 'ol', 'hr', 'table'];
  const lines = text.split(/\n\n+/);
  const formatted = lines.map(block => {
    const trimmed = block.trim();
    if (!trimmed) return '';
    const isBlock = blockTags.some(tag => trimmed.startsWith(`<${tag}`) || trimmed.startsWith(`</${tag}`));
    if (isBlock) return trimmed;
    // Replace single newlines within paragraph with <br />
    const withBr = trimmed.replace(/\n/g, '<br />');
    return `<p>${withBr}</p>`;
  }).filter(Boolean).join('\n');

  return sanitizeHtml(formatted);
}

/**
 * Converts standard HTML into clean Markdown representation.
 */
export function htmlToMarkdown(html: string): string {
  if (!html || typeof html !== 'string') return '';

  let md = html;

  // Headings
  md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
  md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
  md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');
  md = md.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n');
  md = md.replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n');
  md = md.replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n');

  // Code blocks
  md = md.replace(/<pre><code(?:\s+class="language-([a-zA-Z0-9_-]+)")?>([\s\S]*?)<\/code><\/pre>/gi, (_m, lang, code) => {
    const unescaped = code.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
    return `\`\`\`${lang || ''}\n${unescaped}\n\`\`\`\n\n`;
  });

  // Inline code
  md = md.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');

  // Bold / Strong
  md = md.replace(/<(?:strong|b)[^>]*>(.*?)<\/(?:strong|b)>/gi, '**$1**');

  // Italic / Em
  md = md.replace(/<(?:em|i)[^>]*>(.*?)<\/(?:em|i)>/gi, '*$1*');

  // Strike / Del
  md = md.replace(/<(?:del|s|strike)[^>]*>(.*?)<\/(?:del|s|strike)>/gi, '~~$1~~');

  // Blockquotes
  md = md.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_m, content) => {
    const cleanContent = content.replace(/<p[^>]*>/gi, '').replace(/<\/p>/gi, '').trim();
    return `> ${cleanContent}\n\n`;
  });

  // Links
  md = md.replace(/<a\s+[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');

  // Images
  md = md.replace(/<img\s+[^>]*src="([^"]*)"(?:\s+alt="([^"]*)")?[^>]*\/?>/gi, '![$2]($1)');

  // Lists
  md = md.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_m, content) => {
    const items = content.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');
    return `${items}\n`;
  });

  md = md.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_m, content) => {
    let index = 1;
    const items = content.replace(/<li[^>]*>(.*?)<\/li>/gi, (_match: string, itemText: string) => {
      return `${index++}. ${itemText}\n`;
    });
    return `${items}\n`;
  });

  // Paragraphs & Line breaks
  md = md.replace(/<br\s*\/?>/gi, '\n');
  md = md.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');
  md = md.replace(/<hr\s*\/?>/gi, '---\n\n');

  // Strip remaining HTML tags
  md = md.replace(/<[^>]+>/g, '');

  // Decode common HTML entities
  md = md
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');

  // Clean extra consecutive newlines
  md = md.replace(/\n{3,}/g, '\n\n');

  return md.trim();
}

export type LiveShortcutTrigger = 
  | { type: 'heading'; level: number; text: string }
  | { type: 'blockquote'; text: string }
  | { type: 'bullet-list'; text: string }
  | { type: 'ordered-list'; text: string }
  | { type: 'code-block'; language?: string }
  | { type: 'hr' }
  | null;

/**
 * Checks if a typed line matches a live markdown shortcut trigger prefix.
 */
export function checkMarkdownShortcutTrigger(line: string): LiveShortcutTrigger {
  if (line === '---' || line === '***') {
    return { type: 'hr' };
  }
  if (line === '```') {
    return { type: 'code-block' };
  }
  const codeBlockMatch = line.match(/^```([a-zA-Z0-9_-]+)$/);
  if (codeBlockMatch) {
    return { type: 'code-block', language: codeBlockMatch[1] };
  }
  const hMatch = line.match(/^(#{1,6})\s+(.*)$/);
  if (hMatch) {
    return { type: 'heading', level: hMatch[1].length, text: hMatch[2] };
  }
  const quoteMatch = line.match(/^>\s+(.*)$/);
  if (quoteMatch) {
    return { type: 'blockquote', text: quoteMatch[1] };
  }
  const ulMatch = line.match(/^[-*]\s+(.*)$/);
  if (ulMatch) {
    return { type: 'bullet-list', text: ulMatch[1] };
  }
  const olMatch = line.match(/^\d+\.\s+(.*)$/);
  if (olMatch) {
    return { type: 'ordered-list', text: olMatch[1] };
  }
  return null;
}
