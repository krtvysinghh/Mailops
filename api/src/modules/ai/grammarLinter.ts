/**
 * Module: Grammar & Tone Clarity Linter
 * 
 * Performs client-side & edge heuristic linting on drafts to highlight
 * passive voice, wordy phrases, readability grade level, and spelling typos.
 */

export interface LintIssue {
  type: 'passive_voice' | 'wordiness' | 'clarity' | 'spelling' | 'tone';
  message: string;
  startIndex: number;
  endIndex: number;
  suggestion?: string;
}

export interface ReadabilityReport {
  fleschKincaidGrade: number;
  wordCount: number;
  sentenceCount: number;
  syllableCount: number;
  readingTimeMinutes: number;
  issues: LintIssue[];
}

const WORDY_PHRASES: Record<string, string> = {
  'in order to': 'to',
  'at this point in time': 'now',
  'due to the fact that': 'because',
  'for the purpose of': 'to',
  'with reference to': 'regarding',
  'in the event that': 'if',
  'until such time as': 'until',
  'a majority of': 'most',
  'make a decision': 'decide',
  'give consideration to': 'consider',
};

const PASSIVE_INDICATORS = [
  'is being', 'was being', 'has been', 'have been', 'had been',
  'will be', 'is made', 'was made', 'were written', 'was handled'
];

function countSyllables(word: string): number {
  const clean = word.toLowerCase().replace(/[^a-z]/g, '');
  if (clean.length <= 3) return 1;
  const matches = clean.match(/[aeiouy]{1,2}/g);
  let count = matches ? matches.length : 1;
  if (clean.endsWith('e') && !clean.endsWith('le')) count--;
  return Math.max(1, count);
}

export function lintDraft(text: string): ReadabilityReport {
  const issues: LintIssue[] = [];
  const words = text.split(/\s+/).filter(Boolean);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  const wordCount = words.length;
  const sentenceCount = Math.max(1, sentences.length);
  let syllableCount = 0;

  for (const word of words) {
    syllableCount += countSyllables(word);
  }

  // Flesch-Kincaid Grade Level formula: 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59
  const grade = wordCount > 0 
    ? Math.max(1, Math.round((0.39 * (wordCount / sentenceCount) + 11.8 * (syllableCount / wordCount) - 15.59) * 10) / 10)
    : 1;

  // Check wordy phrases
  const lower = text.toLowerCase();
  for (const [phrase, replacement] of Object.entries(WORDY_PHRASES)) {
    let pos = lower.indexOf(phrase);
    while (pos !== -1) {
      issues.push({
        type: 'wordiness',
        message: `Consider replacing "${phrase}" with "${replacement}" for conciseness.`,
        startIndex: pos,
        endIndex: pos + phrase.length,
        suggestion: replacement
      });
      pos = lower.indexOf(phrase, pos + 1);
    }
  }

  // Check passive voice
  for (const indicator of PASSIVE_INDICATORS) {
    let pos = lower.indexOf(indicator);
    while (pos !== -1) {
      issues.push({
        type: 'passive_voice',
        message: `Passive construction detected: "${indicator}". Consider active voice.`,
        startIndex: pos,
        endIndex: pos + indicator.length
      });
      pos = lower.indexOf(indicator, pos + 1);
    }
  }

  return {
    fleschKincaidGrade: grade,
    wordCount,
    sentenceCount,
    syllableCount,
    readingTimeMinutes: Math.round((wordCount / 200) * 10) / 10,
    issues
  };
}
