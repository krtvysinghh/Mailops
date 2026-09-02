/**
 * Feature 2: AI Email Summarizer & TL;DR
 * Pure TypeScript extractive TextRank graph algorithm for 1-sentence TL;DR
 * and key bullet points. Zero external dependencies.
 */

export interface EmailSummary {
  tldr: string;
  keyPoints: string[];
  wordCount: number;
  readingTimeSeconds: number;
}

const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can\'t', 'cannot', 'could', 'couldn\'t', 'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t',
  'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t', 'have',
  'haven\'t', 'having', 'he', 'he\'d', 'he\'ll', 'he\'s', 'her', 'here', 'here\'s', 'hers', 'herself',
  'him', 'himself', 'his', 'how', 'how\'s', 'i', 'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if', 'in', 'into',
  'is', 'isn\'t', 'it', 'it\'s', 'its', 'itself', 'let\'s', 'me', 'more', 'most', 'mustn\'t', 'my',
  'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our',
  'ours', 'ourselves', 'out', 'over', 'own', 'same', 'shan\'t', 'she', 'she\'d', 'she\'ll', 'she\'s',
  'should', 'shouldn\'t', 'so', 'some', 'such', 'than', 'that', 'that\'s', 'the', 'their', 'theirs',
  'them', 'themselves', 'then', 'there', 'there\'s', 'these', 'they', 'they\'d', 'they\'ll', 'they\'re',
  'they\'ve', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'wasn\'t',
  'we', 'we\'d', 'we\'ll', 'we\'re', 'we\'ve', 'were', 'weren\'t', 'what', 'what\'s', 'when', 'when\'s',
  'where', 'where\'s', 'which', 'while', 'who', 'who\'s', 'whom', 'why', 'why\'s', 'with', 'won\'t',
  'would', 'wouldn\'t', 'you', 'you\'d', 'you\'ll', 'you\'re', 'you\'ve', 'your', 'yours', 'yourself',
  'yourselves'
]);

export function summarizeEmail(text: string): EmailSummary {
  if (!text || !text.trim()) {
    return { tldr: '', keyPoints: [], wordCount: 0, readingTimeSeconds: 0 };
  }

  const clean = text
    .replace(/^>.*$/gm, '')
    .replace(/On .* wrote:[\s\S]*/gi, '')
    .trim();

  if (!clean) {
    return { tldr: '', keyPoints: [], wordCount: 0, readingTimeSeconds: 0 };
  }

  const words = clean.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const readingTimeSeconds = Math.max(1, Math.round((wordCount / 200) * 60));

  // Sentence segmentation
  const sentences = clean
    .split(/(?<=[.?!])\s+(?=[A-Z0-9])/g)
    .map(s => s.trim())
    .filter(s => s.length > 5);

  if (sentences.length <= 1) {
    const single = sentences[0] || clean;
    return {
      tldr: single,
      keyPoints: [single],
      wordCount,
      readingTimeSeconds,
    };
  }

  // Tokenize sentences into lower-case non-stopword tokens
  const tokenized = sentences.map(s =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => !STOP_WORDS.has(w) && w.length > 1)
  );

  // Compute graph similarity centrality
  const scores = sentences.map((_, i) => {
    let score = 0;
    for (let j = 0; j < sentences.length; j++) {
      if (i === j) continue;
      const setA = new Set(tokenized[i]);
      const setB = new Set(tokenized[j]);
      let intersect = 0;
      for (const token of setA) {
        if (setB.has(token)) intersect++;
      }
      const denom = Math.log(Math.max(2, tokenized[i].length)) + Math.log(Math.max(2, tokenized[j].length));
      if (denom > 0) {
        score += intersect / denom;
      }
    }
    return { index: i, sentence: sentences[i], score };
  });

  // Rank sentences by centrality score
  scores.sort((a, b) => b.score - a.score);

  // Highest scored sentence is TL;DR
  const tldr = scores[0].sentence;

  // Top up to 3 sentences in chronological order
  const topCount = Math.min(3, sentences.length);
  const topSentences = scores
    .slice(0, topCount)
    .sort((a, b) => a.index - b.index)
    .map(s => s.sentence);

  return {
    tldr,
    keyPoints: topSentences,
    wordCount,
    readingTimeSeconds,
  };
}
