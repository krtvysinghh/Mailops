/**
 * Feature 29: Team Tagging & Shared Label Hierarchy
 * 
 * Provides nested recursive label taxonomy, color inheritance, cycle prevention,
 * full-path breadcrumb resolution, and hierarchical query matching.
 */

export interface TagRecord {
  id: string;
  name: string;
  color: string;
  parentId?: string | null;
  createdAt: Date;
}

export interface TagTreeNode extends TagRecord {
  fullPath: string;
  effectiveColor: string;
  depth: number;
  children: TagTreeNode[];
}

export interface EmailTagMapping {
  emailId: string;
  tagId: string;
}

export const DEFAULT_TAG_COLOR = '#3b82f6'; // Tailwind blue-500

/**
 * Checks for circular references before assigning a parent to a tag.
 */
export function wouldCreateCycle(
  allTags: TagRecord[],
  tagId: string,
  proposedParentId: string | null
): boolean {
  if (!proposedParentId) return false;
  if (tagId === proposedParentId) return true;

  const tagMap = new Map<string, TagRecord>();
  for (const t of allTags) {
    tagMap.set(t.id, t);
  }

  let currentParentId: string | null | undefined = proposedParentId;
  const visited = new Set<string>();

  while (currentParentId) {
    if (currentParentId === tagId) return true;
    if (visited.has(currentParentId)) return true; // Existing cycle detected
    visited.add(currentParentId);

    const parent = tagMap.get(currentParentId);
    currentParentId = parent?.parentId;
  }

  return false;
}

/**
 * Resolves the full path string (e.g. "Support/Tier1/Billing") and effective inherited color for a tag.
 */
export function resolveTagPath(
  tagId: string,
  allTags: TagRecord[]
): { path: string; parts: string[]; effectiveColor: string } {
  const tagMap = new Map<string, TagRecord>();
  for (const t of allTags) {
    tagMap.set(t.id, t);
  }

  const parts: string[] = [];
  let current: TagRecord | undefined = tagMap.get(tagId);
  let effectiveColor: string = DEFAULT_TAG_COLOR;
  let colorFound = false;

  const visited = new Set<string>();

  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    parts.unshift(current.name);

    // Color inheritance: pick first non-default color walking up the hierarchy
    if (!colorFound && current.color && current.color !== DEFAULT_TAG_COLOR) {
      effectiveColor = current.color;
      colorFound = true;
    }

    current = current.parentId ? tagMap.get(current.parentId) : undefined;
  }

  // If leaf tag had default color and no parent had specific color, use leaf color
  if (!colorFound) {
    const leaf = tagMap.get(tagId);
    effectiveColor = leaf?.color || DEFAULT_TAG_COLOR;
  }

  return {
    path: parts.join('/'),
    parts,
    effectiveColor,
  };
}

/**
 * Builds a clean nested hierarchical tree from a flat list of tags with color inheritance.
 */
export function buildTagTree(allTags: TagRecord[]): TagTreeNode[] {
  const tagMap = new Map<string, TagTreeNode>();
  const rootNodes: TagTreeNode[] = [];

  // Pass 1: Initialize tree nodes with computed paths and colors
  for (const tag of allTags) {
    const { path, effectiveColor, parts } = resolveTagPath(tag.id, allTags);
    const node: TagTreeNode = {
      ...tag,
      fullPath: path,
      effectiveColor,
      depth: parts.length - 1,
      children: [],
    };
    tagMap.set(tag.id, node);
  }

  // Pass 2: Connect parents and children
  for (const tag of allTags) {
    const node = tagMap.get(tag.id)!;
    if (tag.parentId && tagMap.has(tag.parentId)) {
      const parent = tagMap.get(tag.parentId)!;
      parent.children.push(node);
    } else {
      rootNodes.push(node);
    }
  }

  // Sort alphabetically by name
  const sortTree = (nodes: TagTreeNode[]) => {
    nodes.sort((a, b) => a.name.localeCompare(b.name));
    for (const n of nodes) {
      if (n.children.length > 0) {
        sortTree(n.children);
      }
    }
  };

  sortTree(rootNodes);
  return rootNodes;
}

/**
 * Returns all descendant tag IDs for a given root tag (inclusive of the root tag itself).
 * Essential for hierarchical query matching: searching "Support" matches "Support/Tier1" and "Support/Tier2".
 */
export function getTagWithDescendantIds(tagId: string, allTags: TagRecord[]): string[] {
  const result: string[] = [tagId];
  const childrenMap = new Map<string, string[]>();

  for (const tag of allTags) {
    if (tag.parentId) {
      const existing = childrenMap.get(tag.parentId) || [];
      existing.push(tag.id);
      childrenMap.set(tag.parentId, existing);
    }
  }

  const queue = [tagId];
  while (queue.length > 0) {
    const curr = queue.shift()!;
    const kids = childrenMap.get(curr) || [];
    for (const kid of kids) {
      if (!result.includes(kid)) {
        result.push(kid);
        queue.push(kid);
      }
    }
  }

  return result;
}

/**
 * In-memory manager for hierarchical tagging.
 */
export class TagHierarchyManager {
  private tags: Map<string, TagRecord> = new Map();
  private emailTags: EmailTagMapping[] = [];

  createTag(params: {
    id: string;
    name: string;
    color?: string;
    parentId?: string | null;
  }): TagRecord {
    if (!params.name || params.name.trim().length === 0) {
      throw new Error('Tag name cannot be empty');
    }

    const all = Array.from(this.tags.values());
    if (params.parentId && wouldCreateCycle(all, params.id, params.parentId)) {
      throw new Error('Cannot assign parent: would create a circular reference');
    }

    const tag: TagRecord = {
      id: params.id,
      name: params.name.trim(),
      color: params.color || DEFAULT_TAG_COLOR,
      parentId: params.parentId || null,
      createdAt: new Date(),
    };

    this.tags.set(tag.id, tag);
    return tag;
  }

  updateTag(
    id: string,
    updates: { name?: string; color?: string; parentId?: string | null }
  ): TagRecord {
    const existing = this.tags.get(id);
    if (!existing) throw new Error(`Tag ${id} not found`);

    const all = Array.from(this.tags.values());
    if (updates.parentId !== undefined && updates.parentId !== existing.parentId) {
      if (wouldCreateCycle(all, id, updates.parentId)) {
        throw new Error('Cannot assign parent: would create a circular reference');
      }
    }

    const updated: TagRecord = {
      ...existing,
      name: updates.name !== undefined ? updates.name.trim() : existing.name,
      color: updates.color !== undefined ? updates.color : existing.color,
      parentId: updates.parentId !== undefined ? updates.parentId : existing.parentId,
    };

    this.tags.set(id, updated);
    return updated;
  }

  deleteTag(id: string): void {
    // Delete tag and update children to have null parent
    this.tags.delete(id);
    for (const tag of this.tags.values()) {
      if (tag.parentId === id) {
        tag.parentId = null;
      }
    }
    this.emailTags = this.emailTags.filter(et => et.tagId !== id);
  }

  getTagTree(): TagTreeNode[] {
    return buildTagTree(Array.from(this.tags.values()));
  }

  tagEmail(emailId: string, tagId: string): void {
    if (!this.tags.has(tagId)) throw new Error(`Tag ${tagId} not found`);
    if (!this.emailTags.some(et => et.emailId === emailId && et.tagId === tagId)) {
      this.emailTags.push({ emailId, tagId });
    }
  }

  untagEmail(emailId: string, tagId: string): void {
    this.emailTags = this.emailTags.filter(et => !(et.emailId === emailId && et.tagId === tagId));
  }

  getTagsForEmail(emailId: string): TagTreeNode[] {
    const tagIds = this.emailTags.filter(et => et.emailId === emailId).map(et => et.tagId);
    const all = Array.from(this.tags.values());
    const result: TagTreeNode[] = [];
    for (const id of tagIds) {
      const tag = this.tags.get(id);
      if (tag) {
        const { path, effectiveColor, parts } = resolveTagPath(id, all);
        result.push({
          ...tag,
          fullPath: path,
          effectiveColor,
          depth: parts.length - 1,
          children: [] as TagTreeNode[],
        });
      }
    }
    return result;
  }

  filterEmailsByTag(tagId: string, matchDescendants: boolean = true): string[] {
    const all = Array.from(this.tags.values());
    const validTagIds = matchDescendants ? getTagWithDescendantIds(tagId, all) : [tagId];
    return Array.from(
      new Set(
        this.emailTags
          .filter(et => validTagIds.includes(et.tagId))
          .map(et => et.emailId)
      )
    );
  }
}
