export interface Email {
  id: string;
  subject: string;
  body: string;
}

export function getTfIdfVector(text: string): Record<string, number> {
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  const freq: Record<string, number> = {};
  for (const w of words) {
    freq[w] = (freq[w] || 0) + 1;
  }
  return freq;
}

export function cosineSimilarity(v1: Record<string, number>, v2: Record<string, number>): number {
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (const [word, count] of Object.entries(v1)) {
    norm1 += count * count;
    if (v2[word]) {
      dotProduct += count * v2[word];
    }
  }

  for (const count of Object.values(v2)) {
    norm2 += count * count;
  }

  if (norm1 === 0 || norm2 === 0) return 0;
  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}

export function clusterEmails(emails: Email[], threshold: number = 0.5): Email[][] {
  const vectors = emails.map(e => getTfIdfVector(e.subject + ' ' + e.body));
  const clusters: Email[][] = [];
  const assigned = new Set<string>();

  for (let i = 0; i < emails.length; i++) {
    if (assigned.has(emails[i].id)) continue;

    const cluster = [emails[i]];
    assigned.add(emails[i].id);

    for (let j = i + 1; j < emails.length; j++) {
      if (assigned.has(emails[j].id)) continue;

      const sim = cosineSimilarity(vectors[i], vectors[j]);
      if (sim >= threshold) {
        cluster.push(emails[j]);
        assigned.add(emails[j].id);
      }
    }
    
    clusters.push(cluster);
  }

  return clusters;
}
