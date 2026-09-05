export interface WritingProfile {
  avgSentenceLength: number;
  vocabularyRichness: number;
  punctuationFrequency: Record<string, number>;
  commonPhrases: string[];
}

export class WritingFingerprintAnalyzer {
  analyzeText(text: string): WritingProfile {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    
    const avgSentenceLength = sentences.length > 0 ? words.length / sentences.length : 0;
    
    const uniqueWords = new Set(words);
    const vocabularyRichness = words.length > 0 ? uniqueWords.size / words.length : 0;
    
    const punctuation = text.match(/[.,!?;:]/g) || [];
    const punctuationFrequency: Record<string, number> = {};
    punctuation.forEach(p => {
      punctuationFrequency[p] = (punctuationFrequency[p] || 0) + 1;
    });
    
    // Normalizing frequency
    const totalPunctuation = punctuation.length;
    if (totalPunctuation > 0) {
      for (const p in punctuationFrequency) {
        punctuationFrequency[p] /= totalPunctuation;
      }
    }

    return {
      avgSentenceLength,
      vocabularyRichness,
      punctuationFrequency,
      commonPhrases: [] // Simplified for now
    };
  }

  matchesOwnerStyle(text: string, profile: WritingProfile): number {
    const textProfile = this.analyzeText(text);
    
    let confidence = 100;
    
    // Penalty for sentence length variance
    const diffLength = Math.abs(textProfile.avgSentenceLength - profile.avgSentenceLength);
    confidence -= Math.min(30, diffLength * 2);
    
    // Penalty for vocab richness variance
    const diffVocab = Math.abs(textProfile.vocabularyRichness - profile.vocabularyRichness);
    confidence -= Math.min(30, diffVocab * 100);
    
    return Math.max(0, confidence);
  }
}
