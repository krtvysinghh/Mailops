/**
 * Feature 23: Internal Notes & Inline Comments
 * 
 * Provides private team notes and inline email comments that are strictly internal,
 * threaded in discussions, and rigorously stripped before any outbound email transmission.
 */

export interface InlineCommentHighlight {
  quotedSnippet: string;
  startOffset?: number;
  endOffset?: number;
}

export interface InternalNoteRecord {
  id: string;
  emailId: string;
  threadId: string | null;
  userId: string;
  authorName: string;
  content: string;
  parentNoteId: string | null;
  highlight?: InlineCommentHighlight | null;
  isResolved: boolean;
  resolvedByUserId?: string | null;
  resolvedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NestedNoteNode extends InternalNoteRecord {
  replies: NestedNoteNode[];
}

/**
 * Creates a new internal note or inline comment record.
 */
export function createInternalNote(params: {
  id: string;
  emailId: string;
  threadId?: string | null;
  userId: string;
  authorName: string;
  content: string;
  parentNoteId?: string | null;
  highlight?: InlineCommentHighlight | null;
}): InternalNoteRecord {
  if (!params.content || params.content.trim().length === 0) {
    throw new Error('Internal note content cannot be empty');
  }

  const now = new Date();
  return {
    id: params.id,
    emailId: params.emailId,
    threadId: params.threadId || null,
    userId: params.userId,
    authorName: params.authorName,
    content: params.content.trim(),
    parentNoteId: params.parentNoteId || null,
    highlight: params.highlight || null,
    isResolved: false,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Marks an internal note or inline comment as resolved.
 */
export function resolveInternalNote(
  note: InternalNoteRecord,
  resolvedByUserId: string
): InternalNoteRecord {
  return {
    ...note,
    isResolved: true,
    resolvedByUserId,
    resolvedAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Strips any internal note markers, HTML custom tags, or private block delimiters
 * from outbound email content to guarantee confidentiality.
 */
export function stripInternalNotesFromOutboundEmail(content: string): string {
  if (!content) return '';

  let sanitized = content;

  // 1. Remove custom XML/HTML internal note tags: <internal-note>...</internal-note> or <mailops-note>...</mailops-note>
  sanitized = sanitized.replace(/<(?:internal-note|mailops-note|private-comment)[^>]*>[\s\S]*?<\/(?:internal-note|mailops-note|private-comment)>/gi, '');

  // 2. Remove HTML comments containing internal note markers
  sanitized = sanitized.replace(/<!--\s*INTERNAL NOTE:[\s\S]*?-->/gi, '');

  // 3. Remove text-based internal note delimiter blocks: [[INTERNAL NOTE: ... ]]
  sanitized = sanitized.replace(/\[\[INTERNAL(?: NOTE)?:[\s\S]*?\]\]/gi, '');

  // 4. Clean up any lingering double empty lines from stripping
  sanitized = sanitized.replace(/\n{3,}/g, '\n\n').trim();

  return sanitized;
}

/**
 * Reconstructs a flat list of internal notes into a hierarchical nested discussion tree.
 */
export function buildNoteHierarchy(notes: InternalNoteRecord[]): NestedNoteNode[] {
  const nodeMap = new Map<string, NestedNoteNode>();
  const rootNodes: NestedNoteNode[] = [];

  // Initialize nodes
  for (const note of notes) {
    nodeMap.set(note.id, { ...note, replies: [] });
  }

  // Build tree
  for (const note of notes) {
    const currentNode = nodeMap.get(note.id)!;
    if (note.parentNoteId && nodeMap.has(note.parentNoteId)) {
      const parentNode = nodeMap.get(note.parentNoteId)!;
      parentNode.replies.push(currentNode);
    } else {
      rootNodes.push(currentNode);
    }
  }

  // Sort roots and replies chronologically
  const sortChronologically = (list: NestedNoteNode[]) => {
    list.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    for (const item of list) {
      if (item.replies.length > 0) {
        sortChronologically(item.replies);
      }
    }
  };

  sortChronologically(rootNodes);
  return rootNodes;
}

/**
 * In-memory manager for internal notes.
 */
export class InternalNotesManager {
  private notes: Map<string, InternalNoteRecord> = new Map();

  addNote(params: {
    id: string;
    emailId: string;
    threadId?: string | null;
    userId: string;
    authorName: string;
    content: string;
    parentNoteId?: string | null;
    highlight?: InlineCommentHighlight | null;
  }): InternalNoteRecord {
    const note = createInternalNote(params);
    this.notes.set(note.id, note);
    return note;
  }

  getNote(id: string): InternalNoteRecord | undefined {
    return this.notes.get(id);
  }

  resolve(id: string, userId: string): InternalNoteRecord {
    const note = this.notes.get(id);
    if (!note) throw new Error(`Note ${id} not found`);
    const resolved = resolveInternalNote(note, userId);
    this.notes.set(id, resolved);
    return resolved;
  }

  listForEmail(emailId: string): InternalNoteRecord[] {
    return Array.from(this.notes.values())
      .filter(n => n.emailId === emailId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  getTreeForEmail(emailId: string): NestedNoteNode[] {
    return buildNoteHierarchy(this.listForEmail(emailId));
  }
}
