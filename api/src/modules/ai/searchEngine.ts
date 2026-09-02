/**
 * Feature 6: Smart Search & BM25 Matcher
 * Pure TypeScript Inverted Index BM25 ranking algorithm with boolean operators,
 * search filters (from:, to:, has:attachment, is:unread), exact phrase matching,
 * and Levenshtein distance typo tolerance. Zero external dependencies.
 */

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

export interface SearchResult {
  doc: SearchableDocument;
  score: number;
}

export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const matrix: number[][] = [];
  for (let i = 0; i <= m; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= n; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[m][n];
}

export class BM25SearchEngine {
  private docs: SearchableDocument[] = [];
  private k1 = 1.2;
  private b = 0.75;
  private docLengths: number[] = [];
  private avgDocLength = 0;
  private invertedIndex = new Map<string, Map<number, number>>();
  private vocabulary: string[] = [];

  constructor(docs: SearchableDocument[] = []) {
    this.docs = docs;
    this.buildIndex();
  }

  public setDocuments(docs: SearchableDocument[]) {
    this.docs = docs;
    this.buildIndex();
  }

  private tokenize(text: string): string[] {
    return (text || '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, ' ')
      .split(/\s+/)
      .filter(Boolean);
  }

  private buildIndex() {
    let totalLength = 0;
    this.docLengths = [];
    this.invertedIndex.clear();

    for (let i = 0; i < this.docs.length; i++) {
      const doc = this.docs[i];
      const tokens = this.tokenize(`${doc.subject} ${doc.body} ${doc.from} ${doc.to}`);
      this.docLengths.push(tokens.length);
      totalLength += tokens.length;

      for (const token of tokens) {
        if (!this.invertedIndex.has(token)) {
          this.invertedIndex.set(token, new Map());
        }
        const posting = this.invertedIndex.get(token)!;
        posting.set(i, (posting.get(i) || 0) + 1);
      }
    }

    this.avgDocLength = this.docs.length > 0 ? totalLength / this.docs.length : 0;
    this.vocabulary = Array.from(this.invertedIndex.keys());
  }

  private findFuzzyTerm(term: string): string | null {
    if (this.invertedIndex.has(term)) return term;
    if (term.length < 4) return null;

    let bestMatch: string | null = null;
    let minDistance = 3; // Max tolerance 2

    for (const vocab of this.vocabulary) {
      if (Math.abs(vocab.length - term.length) > 2) continue;
      const dist = levenshteinDistance(term, vocab);
      if (dist < minDistance) {
        minDistance = dist;
        bestMatch = vocab;
      }
    }

    return bestMatch;
  }

  public search(query: string): SearchableDocument[] {
    if (!query || !query.trim() || this.docs.length === 0) return [];

    let terms: string[] = [];
    let exactPhrase: string | undefined;
    let fromFilter: string | undefined;
    let toFilter: string | undefined;
    let hasAttachmentFilter: boolean | undefined;
    let isUnreadFilter: boolean | undefined;
    let isStarredFilter: boolean | undefined;

    // Parse operators and tokens
    const rawTokens = query.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
    for (const raw of rawTokens) {
      if (raw.startsWith('from:')) {
        fromFilter = raw.slice(5).toLowerCase();
      } else if (raw.startsWith('to:')) {
        toFilter = raw.slice(3).toLowerCase();
      } else if (raw === 'has:attachment' || raw === 'has:attachments') {
        hasAttachmentFilter = true;
      } else if (raw === 'is:unread') {
        isUnreadFilter = true;
      } else if (raw === 'is:starred') {
        isStarredFilter = true;
      } else if (raw.startsWith('"') && raw.endsWith('"')) {
        exactPhrase = raw.slice(1, -1).toLowerCase();
        terms.push(...this.tokenize(exactPhrase));
      } else if (raw.includes(':') && !raw.startsWith('http')) {
        // Unknown operator: ignore prefix and keep term
        const parts = raw.split(':');
        terms.push(...this.tokenize(parts[1] || parts[0]));
      } else {
        terms.push(...this.tokenize(raw));
      }
    }

    const scores = new Map<number, number>();
    const N = this.docs.length;

    for (const rawTerm of terms) {
      const term = this.findFuzzyTerm(rawTerm) || rawTerm;
      const posting = this.invertedIndex.get(term);
      if (!posting) continue;

      const df = posting.size;
      const idf = Math.log((N - df + 0.5) / (df + 0.5) + 1);

      for (const [docIdx, tf] of posting.entries()) {
        const docLen = this.docLengths[docIdx];
        const denom = tf + this.k1 * (1 - this.b + this.b * (docLen / (this.avgDocLength || 1)));
        const termScore = idf * ((tf * (this.k1 + 1)) / denom);
        scores.set(docIdx, (scores.get(docIdx) || 0) + termScore);
      }
    }

    // Filter and rank
    const results: SearchResult[] = [];
    const hasFiltersOnly = terms.length === 0;

    for (let i = 0; i < this.docs.length; i++) {
      const doc = this.docs[i];
      if (fromFilter && !doc.from.toLowerCase().includes(fromFilter)) continue;
      if (toFilter && !doc.to.toLowerCase().includes(toFilter)) continue;
      if (hasAttachmentFilter !== undefined && doc.hasAttachment !== hasAttachmentFilter) continue;
      if (isUnreadFilter !== undefined && doc.isUnread !== isUnreadFilter) continue;
      if (isStarredFilter !== undefined && doc.isStarred !== isStarredFilter) continue;
      if (exactPhrase) {
        const fullText = `${doc.subject} ${doc.body}`.toLowerCase();
        if (!fullText.includes(exactPhrase)) continue;
      }

      const score = scores.get(i) || (hasFiltersOnly ? 1 : 0);
      if (score > 0) {
        results.push({ doc, score });
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results.map(r => r.doc);
  }
}
