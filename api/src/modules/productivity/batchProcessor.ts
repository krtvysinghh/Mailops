/**
 * Feature 18: Batch Actions & Bulk Processing
 * Pure TypeScript implementation for multi-select bulk operations (mark read, archive, label,
 * snooze, delete) with reversible state patches and undo support, ZERO external dependencies.
 */

export type BatchOperationType =
  | 'mark_read'
  | 'mark_unread'
  | 'archive'
  | 'unarchive'
  | 'star'
  | 'unstar'
  | 'trash'
  | 'restore'
  | 'add_label'
  | 'remove_label'
  | 'snooze'
  | 'unsnooze'
  | 'move_folder'
  | 'delete_forever';

export interface BatchItemState {
  id: string;
  read?: boolean;
  archived?: boolean;
  starred?: boolean;
  trashed?: boolean;
  folderId?: string;
  labels?: string[];
  snoozedUntil?: number | null;
  [key: string]: unknown;
}

export interface BatchActionRequest {
  operation: BatchOperationType;
  targetIds: string[];
  value?: string | number | boolean;
  metadata?: Record<string, unknown>;
}

export interface BatchActionResult {
  operation: BatchOperationType;
  totalRequested: number;
  totalAffected: number;
  successIds: string[];
  failedIds: { id: string; error: string }[];
  undoToken?: string;
  timestamp: number;
}

export interface BatchUndoTicket {
  token: string;
  operation: BatchOperationType;
  timestamp: number;
  previousStates: Map<string, Partial<BatchItemState>>;
}

/**
 * Pure function to apply a batch operation mutation to a single item state.
 * Returns a tuple of [updatedItem, previousPatch].
 */
export function applyOperationToItem(
  item: BatchItemState,
  operation: BatchOperationType,
  value?: string | number | boolean
): { updated: BatchItemState; patch: Partial<BatchItemState> } {
  const previousPatch: Partial<BatchItemState> = {};
  const updated: BatchItemState = { ...item };

  switch (operation) {
    case 'mark_read':
      previousPatch.read = item.read;
      updated.read = true;
      break;

    case 'mark_unread':
      previousPatch.read = item.read;
      updated.read = false;
      break;

    case 'archive':
      previousPatch.archived = item.archived;
      previousPatch.folderId = item.folderId;
      updated.archived = true;
      updated.folderId = 'archive';
      break;

    case 'unarchive':
      previousPatch.archived = item.archived;
      previousPatch.folderId = item.folderId;
      updated.archived = false;
      updated.folderId = 'inbox';
      break;

    case 'star':
      previousPatch.starred = item.starred;
      updated.starred = true;
      break;

    case 'unstar':
      previousPatch.starred = item.starred;
      updated.starred = false;
      break;

    case 'trash':
      previousPatch.trashed = item.trashed;
      previousPatch.folderId = item.folderId;
      updated.trashed = true;
      updated.folderId = 'trash';
      break;

    case 'restore':
      previousPatch.trashed = item.trashed;
      previousPatch.folderId = item.folderId;
      updated.trashed = false;
      updated.folderId = 'inbox';
      break;

    case 'move_folder':
      previousPatch.folderId = item.folderId;
      updated.folderId = String(value || 'inbox');
      break;

    case 'add_label':
      if (value) {
        const lbl = String(value);
        previousPatch.labels = item.labels ? [...item.labels] : [];
        const currentLabels = item.labels ? [...item.labels] : [];
        if (!currentLabels.includes(lbl)) {
          updated.labels = [...currentLabels, lbl];
        }
      }
      break;

    case 'remove_label':
      if (value && item.labels) {
        const lbl = String(value);
        previousPatch.labels = [...item.labels];
        updated.labels = item.labels.filter((l) => l !== lbl);
      }
      break;

    case 'snooze':
      previousPatch.snoozedUntil = item.snoozedUntil;
      previousPatch.folderId = item.folderId;
      updated.snoozedUntil = typeof value === 'number' ? value : Date.now() + 24 * 60 * 60 * 1000;
      updated.folderId = 'snoozed';
      break;

    case 'unsnooze':
      previousPatch.snoozedUntil = item.snoozedUntil;
      previousPatch.folderId = item.folderId;
      updated.snoozedUntil = null;
      updated.folderId = 'inbox';
      break;

    case 'delete_forever':
      // Captured for permanent deletion
      previousPatch.trashed = item.trashed;
      previousPatch.folderId = item.folderId;
      break;
  }

  return { updated, patch: previousPatch };
}

/**
 * Batch Processing Engine with Undo Support
 */
export class BatchProcessor {
  private undoTickets: Map<string, BatchUndoTicket> = new Map();

  /**
   * Processes a batch action over items stored in a Map or array.
   */
  public executeBatch<T extends BatchItemState>(
    itemsMap: Map<string, T>,
    request: BatchActionRequest,
    enableUndo: boolean = true
  ): BatchActionResult {
    const successIds: string[] = [];
    const failedIds: { id: string; error: string }[] = [];
    const previousStates = new Map<string, Partial<BatchItemState>>();

    for (const id of request.targetIds) {
      const item = itemsMap.get(id);
      if (!item) {
        failedIds.push({ id, error: `Item with id ${id} not found` });
        continue;
      }

      try {
        if (request.operation === 'delete_forever') {
          previousStates.set(id, { ...item });
          itemsMap.delete(id);
          successIds.push(id);
        } else {
          const { updated, patch } = applyOperationToItem(item, request.operation, request.value);
          previousStates.set(id, patch);
          itemsMap.set(id, updated as T);
          successIds.push(id);
        }
      } catch (err: unknown) {
        failedIds.push({
          id,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    let undoToken: string | undefined;
    if (enableUndo && successIds.length > 0) {
      undoToken = `batch_undo_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      this.undoTickets.set(undoToken, {
        token: undoToken,
        operation: request.operation,
        timestamp: Date.now(),
        previousStates,
      });
    }

    return {
      operation: request.operation,
      totalRequested: request.targetIds.length,
      totalAffected: successIds.length,
      successIds,
      failedIds,
      undoToken,
      timestamp: Date.now(),
    };
  }

  /**
   * Undoes a previously executed batch action using its undo token.
   */
  public undoBatch<T extends BatchItemState>(
    itemsMap: Map<string, T>,
    undoToken: string
  ): { success: boolean; restoredCount: number; error?: string } {
    const ticket = this.undoTickets.get(undoToken);
    if (!ticket) {
      return { success: false, restoredCount: 0, error: 'Undo token expired or invalid' };
    }

    let restoredCount = 0;

    for (const [id, patch] of ticket.previousStates.entries()) {
      if (ticket.operation === 'delete_forever') {
        // Restore deleted item
        itemsMap.set(id, patch as T);
        restoredCount++;
      } else {
        const item = itemsMap.get(id);
        if (item) {
          const restored = { ...item, ...patch };
          itemsMap.set(id, restored as T);
          restoredCount++;
        }
      }
    }

    this.undoTickets.delete(undoToken);
    return { success: true, restoredCount };
  }

  /**
   * Helper to partition large arrays of IDs into chunks.
   */
  public static chunkIds(ids: string[], chunkSize: number = 100): string[][] {
    const chunks: string[][] = [];
    for (let i = 0; i < ids.length; i += chunkSize) {
      chunks.push(ids.slice(i, i + chunkSize));
    }
    return chunks;
  }
}
