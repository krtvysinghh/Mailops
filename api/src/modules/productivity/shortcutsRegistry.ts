/**
 * Feature 16: Keyboard Shortcuts & Command Palette
 * Pure TypeScript Superhuman-style keyboard navigation, multi-key sequence matcher,
 * and fuzzy-scored Command Palette registry with ZERO external dependencies.
 */

export interface ShortcutBinding {
  keys: string[]; // e.g. ['j'], ['g', 'i'], ['Meta+k'], ['Ctrl+k'], ['Shift+u']
  description: string;
}

export interface CommandDefinition {
  id: string;
  title: string;
  category: 'Navigation' | 'Actions' | 'Drafts' | 'System' | 'Filter';
  shortcuts: string[][]; // Array of key combinations/sequences
  keywords?: string[];
  icon?: string;
  disabled?: boolean;
}

export interface RankedCommand {
  command: CommandDefinition;
  score: number;
  matchedPositions: number[];
}

export const DEFAULT_COMMANDS: CommandDefinition[] = [
  {
    id: 'nav.next',
    title: 'Next Email / Thread',
    category: 'Navigation',
    shortcuts: [['j'], ['ArrowDown']],
    keywords: ['down', 'forward', 'next'],
  },
  {
    id: 'nav.prev',
    title: 'Previous Email / Thread',
    category: 'Navigation',
    shortcuts: [['k'], ['ArrowUp']],
    keywords: ['up', 'backward', 'prev'],
  },
  {
    id: 'nav.inbox',
    title: 'Go to Inbox',
    category: 'Navigation',
    shortcuts: [['g', 'i']],
    keywords: ['inbox', 'home', 'messages'],
  },
  {
    id: 'nav.sent',
    title: 'Go to Sent',
    category: 'Navigation',
    shortcuts: [['g', 's']],
    keywords: ['sent', 'outbox'],
  },
  {
    id: 'nav.drafts',
    title: 'Go to Drafts',
    category: 'Navigation',
    shortcuts: [['g', 'd']],
    keywords: ['drafts', 'wip'],
  },
  {
    id: 'nav.starred',
    title: 'Go to Starred',
    category: 'Navigation',
    shortcuts: [['g', '*'], ['g', 't']],
    keywords: ['starred', 'favorites', 'flags'],
  },
  {
    id: 'nav.snoozed',
    title: 'Go to Snoozed',
    category: 'Navigation',
    shortcuts: [['g', 'b']],
    keywords: ['snoozed', 'reminders', 'later'],
  },
  {
    id: 'action.archive',
    title: 'Archive Thread',
    category: 'Actions',
    shortcuts: [['e'], ['y']],
    keywords: ['archive', 'done', 'clear'],
  },
  {
    id: 'action.trash',
    title: 'Move to Trash',
    category: 'Actions',
    shortcuts: [['#'], ['Backspace'], ['Delete']],
    keywords: ['delete', 'trash', 'remove'],
  },
  {
    id: 'action.spam',
    title: 'Report Spam',
    category: 'Actions',
    shortcuts: [['!']],
    keywords: ['spam', 'junk', 'block'],
  },
  {
    id: 'action.reply',
    title: 'Reply',
    category: 'Actions',
    shortcuts: [['r']],
    keywords: ['reply', 'respond', 'answer'],
  },
  {
    id: 'action.reply_all',
    title: 'Reply All',
    category: 'Actions',
    shortcuts: [['a']],
    keywords: ['reply all', 'respond everyone'],
  },
  {
    id: 'action.forward',
    title: 'Forward',
    category: 'Actions',
    shortcuts: [['f']],
    keywords: ['forward', 'send on'],
  },
  {
    id: 'action.star',
    title: 'Toggle Star / Flag',
    category: 'Actions',
    shortcuts: [['s']],
    keywords: ['star', 'flag', 'favorite', 'pin'],
  },
  {
    id: 'action.snooze',
    title: 'Snooze Thread',
    category: 'Actions',
    shortcuts: [['b'], ['h']],
    keywords: ['snooze', 'remind', 'later', 'sleep'],
  },
  {
    id: 'action.compose',
    title: 'Compose New Email',
    category: 'Drafts',
    shortcuts: [['c']],
    keywords: ['compose', 'new', 'write', 'create'],
  },
  {
    id: 'action.search',
    title: 'Focus Search Bar',
    category: 'Navigation',
    shortcuts: [['/']],
    keywords: ['search', 'find', 'query'],
  },
  {
    id: 'action.mark_read',
    title: 'Mark as Read',
    category: 'Actions',
    shortcuts: [['Shift+I'], ['I']],
    keywords: ['read', 'seen'],
  },
  {
    id: 'action.mark_unread',
    title: 'Mark as Unread',
    category: 'Actions',
    shortcuts: [['Shift+U'], ['U']],
    keywords: ['unread', 'unseen', 'new'],
  },
  {
    id: 'action.command_palette',
    title: 'Open Command Palette',
    category: 'System',
    shortcuts: [['Meta+k'], ['Ctrl+k']],
    keywords: ['palette', 'commands', 'menu', 'search actions'],
  },
];

/**
 * Fuzzy scoring algorithm for Command Palette search.
 */
export function fuzzyMatch(
  query: string,
  target: string
): { matched: boolean; score: number; indices: number[] } {
  const q = query.toLowerCase().trim();
  const t = target.toLowerCase();

  if (!q) {
    return { matched: true, score: 0, indices: [] };
  }

  // Exact match bonus
  if (t === q) {
    return { matched: true, score: 1000, indices: Array.from({ length: t.length }, (_, i) => i) };
  }

  // Prefix match bonus
  if (t.startsWith(q)) {
    return {
      matched: true,
      score: 500 + (q.length / t.length) * 100,
      indices: Array.from({ length: q.length }, (_, i) => i),
    };
  }

  // Substring match bonus
  const subIdx = t.indexOf(q);
  if (subIdx !== -1) {
    return {
      matched: true,
      score: 300 + (q.length / t.length) * 50 - subIdx,
      indices: Array.from({ length: q.length }, (_, i) => subIdx + i),
    };
  }

  // Subsequence match
  let qIdx = 0;
  let score = 0;
  const indices: number[] = [];
  let prevMatchIdx = -2;

  for (let i = 0; i < t.length && qIdx < q.length; i++) {
    if (t[i] === q[qIdx]) {
      indices.push(i);

      // Consecutive character bonus
      if (i === prevMatchIdx + 1) {
        score += 20;
      }

      // Word start bonus
      if (i === 0 || t[i - 1] === ' ' || t[i - 1] === '/' || t[i - 1] === '-') {
        score += 25;
      }

      score += 10;
      prevMatchIdx = i;
      qIdx++;
    }
  }

  if (qIdx === q.length) {
    return { matched: true, score, indices };
  }

  return { matched: false, score: -1, indices: [] };
}

/**
 * Key Sequence Matcher for multi-key sequences (e.g. 'g' then 'i').
 */
export class KeySequenceBuffer {
  private buffer: string[] = [];
  private lastKeyTime: number = 0;
  private readonly timeoutMs: number;

  constructor(timeoutMs: number = 1000) {
    this.timeoutMs = timeoutMs;
  }

  public push(key: string, now: number = Date.now()): string[] {
    if (now - this.lastKeyTime > this.timeoutMs) {
      this.buffer = [];
    }
    this.buffer.push(key);
    this.lastKeyTime = now;
    return [...this.buffer];
  }

  public getSequence(): string[] {
    return [...this.buffer];
  }

  public clear(): void {
    this.buffer = [];
    this.lastKeyTime = 0;
  }
}

/**
 * Command & Shortcuts Registry Manager
 */
export class ShortcutsRegistry {
  private commands: Map<string, CommandDefinition> = new Map();
  private keyBuffer = new KeySequenceBuffer(1000);

  constructor(initialCommands: CommandDefinition[] = DEFAULT_COMMANDS) {
    for (const cmd of initialCommands) {
      this.commands.set(cmd.id, { ...cmd });
    }
  }

  public register(cmd: CommandDefinition): void {
    this.commands.set(cmd.id, { ...cmd });
  }

  public unregister(id: string): boolean {
    return this.commands.delete(id);
  }

  public get(id: string): CommandDefinition | undefined {
    return this.commands.get(id);
  }

  public list(): CommandDefinition[] {
    return Array.from(this.commands.values());
  }

  /**
   * Evaluates a key press and checks if it matches any registered shortcut sequence.
   */
  public handleKeyPress(key: string, now: number = Date.now()): {
    matchedCommand?: CommandDefinition;
    isPartialSequence: boolean;
    currentSequence: string[];
  } {
    const seq = this.keyBuffer.push(key, now);
    let matchedCommand: CommandDefinition | undefined;
    let isPartialSequence = false;

    for (const cmd of this.commands.values()) {
      if (cmd.disabled) continue;

      for (const shortcut of cmd.shortcuts) {
        // Exact sequence match
        if (shortcut.length === seq.length && shortcut.every((k, i) => k.toLowerCase() === seq[i].toLowerCase())) {
          matchedCommand = cmd;
          this.keyBuffer.clear();
          return { matchedCommand, isPartialSequence: false, currentSequence: seq };
        }

        // Partial prefix match
        if (shortcut.length > seq.length && seq.every((k, i) => shortcut[i].toLowerCase() === k.toLowerCase())) {
          isPartialSequence = true;
        }
      }
    }

    if (!isPartialSequence && !matchedCommand) {
      // If sequence didn't match and isn't a prefix, check single key as fresh start
      if (seq.length > 1) {
        this.keyBuffer.clear();
        return this.handleKeyPress(key, now);
      }
    }

    return { matchedCommand, isPartialSequence, currentSequence: seq };
  }

  /**
   * Searches and ranks commands for the Command Palette.
   */
  public search(query: string, categoryFilter?: string): RankedCommand[] {
    const list = Array.from(this.commands.values()).filter((c) => !c.disabled);
    const ranked: RankedCommand[] = [];

    for (const cmd of list) {
      if (categoryFilter && cmd.category !== categoryFilter) {
        continue;
      }

      if (!query || query.trim() === '') {
        ranked.push({ command: cmd, score: 10, matchedPositions: [] });
        continue;
      }

      // Title match
      const titleMatch = fuzzyMatch(query, cmd.title);
      let bestScore = titleMatch.score;
      let bestPositions = titleMatch.indices;

      // Keyword matches
      if (cmd.keywords) {
        for (const kw of cmd.keywords) {
          const kwMatch = fuzzyMatch(query, kw);
          if (kwMatch.matched && kwMatch.score > bestScore) {
            bestScore = kwMatch.score;
          }
        }
      }

      // Shortcut match
      for (const sc of cmd.shortcuts) {
        const scStr = sc.join(' ');
        const scMatch = fuzzyMatch(query, scStr);
        if (scMatch.matched && scMatch.score > bestScore) {
          bestScore = scMatch.score;
        }
      }

      if (bestScore > 0 || titleMatch.matched) {
        ranked.push({
          command: cmd,
          score: bestScore,
          matchedPositions: bestPositions,
        });
      }
    }

    return ranked.sort((a, b) => b.score - a.score);
  }
}
