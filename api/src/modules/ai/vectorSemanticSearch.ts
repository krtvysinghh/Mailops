/**
 * Module: Vectorize Semantic Search Engine
 * 
 * Generates vector embeddings for email threads and performs
 * cosine similarity nearest-neighbor search across the mailbox.
 */

export interface VectorEmbedding {
  id: string;
  threadId: string;
  vector: number[];
  metadata: {
    subject: string;
    snippet: string;
    from: string;
    timestamp: number;
  };
}

export function generateSimpleEmbedding(text: string, dimensions = 64): number[] {
  // Pure TypeScript deterministic hash-based embedding vector
  const vector = new Array(dimensions).fill(0);
  const words = text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(Boolean);
  
  if (words.length === 0) return vector;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    let hash = 0;
    for (let j = 0; j < word.length; j++) {
      hash = (hash << 5) - hash + word.charCodeAt(j);
      hash |= 0;
    }
    const idx = Math.abs(hash) % dimensions;
    vector[idx] += 1;
  }

  // L2 normalize
  const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  return norm === 0 ? vector : vector.map(v => v / norm);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dotProduct / denom;
}

export class SemanticIndex {
  private embeddings: Map<string, VectorEmbedding> = new Map();

  public indexThread(id: string, threadId: string, text: string, metadata: VectorEmbedding['metadata']): void {
    const vector = generateSimpleEmbedding(text);
    this.embeddings.set(id, { id, threadId, vector, metadata });
  }

  public search(query: string, limit = 10, minSimilarity = 0.2): { threadId: string; score: number; metadata: VectorEmbedding['metadata'] }[] {
    const queryVector = generateSimpleEmbedding(query);
    const results: { threadId: string; score: number; metadata: VectorEmbedding['metadata'] }[] = [];

    for (const item of this.embeddings.values()) {
      const score = cosineSimilarity(queryVector, item.vector);
      if (score >= minSimilarity) {
        results.push({ threadId: item.threadId, score, metadata: item.metadata });
      }
    }

    return results.sort((a, b) => b.score - a.score).slice(0, limit);
  }
}
