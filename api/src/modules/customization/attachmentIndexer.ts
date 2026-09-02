/**
 * Feature 49: Attachment Content Indexer & Viewer
 * Pure TypeScript attachment decoders (Text, CSV, TSV, JSON, Code),
 * inverted full-text indexer, and snippet highlighter with zero dependencies.
 */

export interface ParsedCsvData {
  headers: string[];
  rows: string[][];
  totalRows: number;
  totalColumns: number;
}

export interface AttachmentIndexEntry {
  attachmentId: string;
  emailId: string;
  filename: string;
  contentType: string;
  extractedText: string;
  tokens: Set<string>;
}

export interface SearchHit {
  attachmentId: string;
  emailId: string;
  filename: string;
  score: number;
  snippet: string;
  matchedTerms: string[];
}

/**
 * Robust RFC 4180 compliant CSV / TSV string parser supporting quotes, commas, and newlines.
 */
export function parseCsvString(csvText: string, delimiter: string = ','): ParsedCsvData {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;
  let i = 0;
  const len = csvText.length;

  while (i < len) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote
          currentCell += '"';
          i += 2;
          continue;
        } else {
          // Closing quote
          inQuotes = false;
          i++;
          continue;
        }
      } else {
        currentCell += char;
        i++;
        continue;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
        continue;
      }

      if (char === delimiter) {
        currentRow.push(currentCell.trim());
        currentCell = '';
        i++;
        continue;
      }

      if (char === '\r' && nextChar === '\n') {
        currentRow.push(currentCell.trim());
        rows.push(currentRow);
        currentRow = [];
        currentCell = '';
        i += 2;
        continue;
      }

      if (char === '\n' || char === '\r') {
        currentRow.push(currentCell.trim());
        rows.push(currentRow);
        currentRow = [];
        currentCell = '';
        i++;
        continue;
      }

      currentCell += char;
      i++;
    }
  }

  // Flush remaining cell
  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    rows.push(currentRow);
  }

  const validRows = rows.filter(r => r.some(c => c.length > 0));
  if (validRows.length === 0) {
    return { headers: [], rows: [], totalRows: 0, totalColumns: 0 };
  }

  const headers = validRows[0];
  const dataRows = validRows.slice(1);

  return {
    headers,
    rows: dataRows,
    totalRows: dataRows.length,
    totalColumns: headers.length,
  };
}

/**
 * Extracts searchable plain text from various file formats.
 */
export function extractTextFromAttachment(
  filename: string,
  contentType: string,
  rawContent: string
): string {
  const lowerName = filename.toLowerCase();

  // CSV / TSV
  if (lowerName.endsWith('.csv') || contentType.includes('csv')) {
    const parsed = parseCsvString(rawContent, ',');
    return [parsed.headers.join(' '), ...parsed.rows.map(r => r.join(' '))].join('\n');
  }
  if (lowerName.endsWith('.tsv') || contentType.includes('tab-separated')) {
    const parsed = parseCsvString(rawContent, '\t');
    return [parsed.headers.join(' '), ...parsed.rows.map(r => r.join(' '))].join('\n');
  }

  // JSON
  if (lowerName.endsWith('.json') || contentType.includes('json')) {
    try {
      const obj = JSON.parse(rawContent);
      return flattenJsonToText(obj);
    } catch {
      return rawContent;
    }
  }

  // Plain text, code, logs, markdown
  return rawContent;
}

function flattenJsonToText(obj: any): string {
  if (obj === null || obj === undefined) return '';
  if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') {
    return String(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(flattenJsonToText).join(' ');
  }
  if (typeof obj === 'object') {
    return Object.entries(obj)
      .map(([k, v]) => `${k}: ${flattenJsonToText(v)}`)
      .join('\n');
  }
  return '';
}

/**
 * Tokenizes text into normalized search terms.
 */
export function tokenizeText(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s@.-]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length >= 2);
}

/**
 * Inverted Index for fast in-memory full-text search across attachments.
 */
export class AttachmentInvertedIndex {
  private documents: Map<string, AttachmentIndexEntry> = new Map();
  private invertedIndex: Map<string, Set<string>> = new Map();

  /**
   * Adds or updates an attachment in the search index.
   */
  public addDocument(
    attachmentId: string,
    emailId: string,
    filename: string,
    contentType: string,
    rawContent: string
  ): void {
    const extractedText = extractTextFromAttachment(filename, contentType, rawContent);
    const tokens = new Set(tokenizeText(extractedText + ' ' + filename));

    // Remove old terms if doc exists
    if (this.documents.has(attachmentId)) {
      this.removeDocument(attachmentId);
    }

    this.documents.set(attachmentId, {
      attachmentId,
      emailId,
      filename,
      contentType,
      extractedText,
      tokens,
    });

    for (const token of tokens) {
      let docSet = this.invertedIndex.get(token);
      if (!docSet) {
        docSet = new Set();
        this.invertedIndex.set(token, docSet);
      }
      docSet.add(attachmentId);
    }
  }

  public removeDocument(attachmentId: string): void {
    const doc = this.documents.get(attachmentId);
    if (!doc) return;

    for (const token of doc.tokens) {
      const docSet = this.invertedIndex.get(token);
      if (docSet) {
        docSet.delete(attachmentId);
        if (docSet.size === 0) {
          this.invertedIndex.delete(token);
        }
      }
    }
    this.documents.delete(attachmentId);
  }

  /**
   * Searches attachment contents for query terms.
   */
  public search(query: string, limit: number = 20): SearchHit[] {
    const queryTokens = tokenizeText(query);
    if (queryTokens.length === 0) return [];

    const docScores = new Map<string, { score: number; matchedTerms: Set<string> }>();

    for (const qTerm of queryTokens) {
      // Find exact and prefix matches in index
      for (const [term, docSet] of this.invertedIndex.entries()) {
        if (term === qTerm || term.startsWith(qTerm)) {
          const weight = term === qTerm ? 2.0 : 1.0;
          for (const docId of docSet) {
            const entry = docScores.get(docId) || { score: 0, matchedTerms: new Set() };
            entry.score += weight;
            entry.matchedTerms.add(qTerm);
            docScores.set(docId, entry);
          }
        }
      }
    }

    const hits: SearchHit[] = [];

    for (const [docId, entry] of docScores.entries()) {
      const doc = this.documents.get(docId);
      if (!doc) continue;

      const snippet = this.generateSnippet(doc.extractedText, Array.from(entry.matchedTerms));
      hits.push({
        attachmentId: doc.attachmentId,
        emailId: doc.emailId,
        filename: doc.filename,
        score: Math.round(entry.score * 100) / 100,
        snippet,
        matchedTerms: Array.from(entry.matchedTerms),
      });
    }

    return hits.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  private generateSnippet(text: string, matchedTerms: string[], maxLen: number = 180): string {
    if (!text) return '';
    const lower = text.toLowerCase();
    let firstMatchIdx = -1;

    for (const term of matchedTerms) {
      const idx = lower.indexOf(term.toLowerCase());
      if (idx !== -1 && (firstMatchIdx === -1 || idx < firstMatchIdx)) {
        firstMatchIdx = idx;
      }
    }

    if (firstMatchIdx === -1) {
      return text.slice(0, maxLen) + (text.length > maxLen ? '...' : '');
    }

    const start = Math.max(0, firstMatchIdx - 40);
    const end = Math.min(text.length, start + maxLen);
    let snippet = (start > 0 ? '...' : '') + text.slice(start, end) + (end < text.length ? '...' : '');

    // Highlight terms
    for (const term of matchedTerms) {
      const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      snippet = snippet.replace(regex, '<mark>$1</mark>');
    }

    return snippet;
  }
}
