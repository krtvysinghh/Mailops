/**
 * Feature 9: Draft Tone & Polish Re-phraser
 * Pure TypeScript syntactic transformer for Professional, Casual, Concise,
 * and Expanded draft modes. Zero external dependencies.
 */

export type ToneMode = 'professional' | 'casual' | 'concise' | 'expanded';

export interface TonePolishResult {
  polishedText: string;
  changesCount: number;
}

export function rephraseDraft(text: string, tone: ToneMode): TonePolishResult {
  if (!text || !text.trim()) {
    return { polishedText: '', changesCount: 0 };
  }

  let output = text;
  let changes = 0;

  if (tone === 'professional') {
    const replacements: [RegExp, string][] = [
      [/\bcan't\b/gi, 'cannot'],
      [/\bwon't\b/gi, 'will not'],
      [/\bdon't\b/gi, 'do not'],
      [/\bdidn't\b/gi, 'did not'],
      [/\bhaven't\b/gi, 'have not'],
      [/\bisn't\b/gi, 'is not'],
      [/\baren't\b/gi, 'are not'],
      [/\bhey\b/gi, 'Dear'],
      [/\bthanks\b/gi, 'Thank you'],
      [/\basap\b/gi, 'at your earliest convenience'],
      [/\bgot it\b/gi, 'Understood'],
      [/\bno problem\b/gi, 'You are welcome'],
      [/\bthru\b/gi, 'through'],
    ];

    for (const [pattern, repl] of replacements) {
      if (pattern.test(output)) {
        output = output.replace(pattern, repl);
        changes++;
      }
    }
  } else if (tone === 'casual') {
    const replacements: [RegExp, string][] = [
      [/\bDear Sir\/Madam\b/gi, 'Hey team'],
      [/\bDear\b/gi, 'Hey'],
      [/\bThank you\b/gi, 'Thanks'],
      [/\bcannot\b/gi, "can't"],
      [/\bwill not\b/gi, "won't"],
      [/\bdo not\b/gi, "don't"],
      [/\bdid not\b/gi, "didn't"],
      [/\bhave not\b/gi, "haven't"],
      [/\bis not\b/gi, "isn't"],
      [/\bare not\b/gi, "aren't"],
      [/\bat your earliest convenience\b/gi, 'ASAP'],
      [/\bUnderstood\b/gi, 'Got it'],
    ];

    for (const [pattern, repl] of replacements) {
      if (pattern.test(output)) {
        output = output.replace(pattern, repl);
        changes++;
      }
    }
  } else if (tone === 'concise') {
    const fillers: RegExp[] = [
      /\bjust wanted to\s+/gi,
      /\bin my humble opinion,?\s*/gi,
      /\bat the present time\b/gi,
      /\bdue to the fact that\b/gi,
      /\bfor the purpose of\b/gi,
      /\bneedless to say,?\s*/gi,
      /\bat this point in time\b/gi,
      /\bas a matter of fact,?\s*/gi,
      /\bin order to\b/gi,
    ];

    for (const filler of fillers) {
      if (filler.test(output)) {
        output = output.replace(filler, (match) => {
          if (match.toLowerCase().includes('in order to')) return 'to';
          return '';
        });
        changes++;
      }
    }

    // Preserve newlines but clean multiple spaces per line
    const lines = output.split('\n');
    output = lines.map(line => line.replace(/[ \t]{2,}/g, ' ').trim()).join('\n').trim();
  } else if (tone === 'expanded') {
    const expandedClosing = 'Please let me know if you have any questions or if further clarification would be helpful.';
    if (!output.includes('Please let me know if you have any questions')) {
      output = `${output.trim()} ${expandedClosing}`;
      changes++;
    }
  }

  return { polishedText: output, changesCount: changes };
}
