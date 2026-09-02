/**
 * Feature 20: Offline Support & Sync Queue
 * Pure TypeScript client/server offline mutation queue, optimistic local state applier,
 * and multi-strategy conflict resolution engine with ZERO external dependencies.
 */

export type SyncMutationType =
  | 'CREATE_DRAFT'
  | 'UPDATE_DRAFT'
  | 'SEND_EMAIL'
  | 'MARK_READ'
  | 'MARK_UNREAD'
  | 'ARCHIVE'
  | 'STAR'
  | 'UNSTAR'
  | 'ADD_LABEL'
  | 'REMOVE_LABEL'
  | 'MOVE_FOLDER'
  | 'DELETE_EMAIL';

export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'conflict' | 'failed';

export type ConflictResolutionStrategy = 'lww' | 'server_wins' | 'client_wins' | 'merge';

export interface SyncMutation {
  id: string; // Idempotency key / mutation UUID
  type: SyncMutationType;
  payload: Record<string, unknown>;
  timestamp: number; // Unix timestamp when mutation occurred offline
  status: SyncStatus;
  retryCount: number;
  clientVersion: number;
  error?: string;
  syncedAt?: number;
}

export interface SyncReport {
  totalProcessed: number;
  syncedCount: number;
  failedCount: number;
  conflictsResolved: number;
  remainingPending: number;
  mutations: SyncMutation[];
}

export interface ConflictResolutionResult {
  strategyUsed: ConflictResolutionStrategy;
  resolvedPayload: Record<string, unknown>;
  appliedToClient: boolean;
  appliedToServer: boolean;
}

/**
 * Applies a mutation optimistically to an email state object.
 */
export function applyOptimisticMutation<T extends Record<string, unknown>>(
  state: T,
  mutation: SyncMutation
): T {
  const next = { ...state } as Record<string, unknown>;

  switch (mutation.type) {
    case 'MARK_READ':
      next.read = true;
      break;

    case 'MARK_UNREAD':
      next.read = false;
      break;

    case 'ARCHIVE':
      next.archived = true;
      next.folderId = 'archive';
      break;

    case 'STAR':
      next.starred = true;
      break;

    case 'UNSTAR':
      next.starred = false;
      break;

    case 'MOVE_FOLDER':
      if (mutation.payload.folderId) {
        next.folderId = mutation.payload.folderId;
      }
      break;

    case 'ADD_LABEL':
      if (mutation.payload.label) {
        const lbl = String(mutation.payload.label);
        const cur = (next.labels as string[]) || [];
        if (!cur.includes(lbl)) {
          next.labels = [...cur, lbl];
        }
      }
      break;

    case 'REMOVE_LABEL':
      if (mutation.payload.label && Array.isArray(next.labels)) {
        const lbl = String(mutation.payload.label);
        next.labels = (next.labels as string[]).filter((l) => l !== lbl);
      }
      break;

    case 'UPDATE_DRAFT':
    case 'CREATE_DRAFT':
      Object.assign(next, mutation.payload);
      break;

    case 'DELETE_EMAIL':
      next.trashed = true;
      next.folderId = 'trash';
      break;

    default:
      Object.assign(next, mutation.payload);
      break;
  }

  return next as T;
}

/**
 * Resolves a conflict between client mutation payload and current server state.
 */
export function resolveConflict(
  clientMutation: SyncMutation,
  serverState: Record<string, unknown>,
  strategy: ConflictResolutionStrategy = 'lww'
): ConflictResolutionResult {
  const serverTimestamp = Number(serverState.updatedAt || serverState.createdAt || 0);
  const clientTimestamp = clientMutation.timestamp;

  if (strategy === 'server_wins') {
    return {
      strategyUsed: 'server_wins',
      resolvedPayload: { ...serverState },
      appliedToClient: true,
      appliedToServer: false,
    };
  }

  if (strategy === 'client_wins') {
    return {
      strategyUsed: 'client_wins',
      resolvedPayload: { ...serverState, ...clientMutation.payload },
      appliedToClient: false,
      appliedToServer: true,
    };
  }

  if (strategy === 'merge') {
    // 3-way / field merge: labels union, text body concatenation or field-level LWW
    const merged: Record<string, unknown> = { ...serverState, ...clientMutation.payload };

    // Merge labels if both exist
    if (Array.isArray(serverState.labels) || Array.isArray(clientMutation.payload.labels)) {
      const serverLabels = (serverState.labels as string[]) || [];
      const clientLabels = (clientMutation.payload.labels as string[]) || [];
      merged.labels = Array.from(new Set([...serverLabels, ...clientLabels]));
    }

    // Merge draft text if conflict in draft
    if (
      typeof serverState.body === 'string' &&
      typeof clientMutation.payload.body === 'string' &&
      serverState.body !== clientMutation.payload.body
    ) {
      if (clientTimestamp >= serverTimestamp) {
        merged.body = clientMutation.payload.body;
      } else {
        merged.body = serverState.body;
      }
    }

    return {
      strategyUsed: 'merge',
      resolvedPayload: merged,
      appliedToClient: true,
      appliedToServer: true,
    };
  }

  // Default: LWW (Last-Write-Wins based on timestamp)
  if (clientTimestamp >= serverTimestamp) {
    return {
      strategyUsed: 'lww',
      resolvedPayload: { ...serverState, ...clientMutation.payload },
      appliedToClient: false,
      appliedToServer: true,
    };
  } else {
    return {
      strategyUsed: 'lww',
      resolvedPayload: { ...serverState },
      appliedToClient: true,
      appliedToServer: false,
    };
  }
}

/**
 * Offline Sync Queue Manager
 */
export class OfflineSyncManager {
  private queue: SyncMutation[] = [];
  private maxRetries: number;

  constructor(initialQueue: SyncMutation[] = [], maxRetries: number = 3) {
    this.queue = [...initialQueue];
    this.maxRetries = maxRetries;
  }

  public enqueue(
    type: SyncMutationType,
    payload: Record<string, unknown>,
    options?: { id?: string; timestamp?: number; clientVersion?: number }
  ): SyncMutation {
    const id = options?.id || `mut_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const mutation: SyncMutation = {
      id,
      type,
      payload: { ...payload },
      timestamp: options?.timestamp || Date.now(),
      status: 'pending',
      retryCount: 0,
      clientVersion: options?.clientVersion || 1,
    };

    this.queue.push(mutation);
    return mutation;
  }

  public getPending(): SyncMutation[] {
    return this.queue.filter((m) => m.status === 'pending' || m.status === 'failed');
  }

  public getAll(): SyncMutation[] {
    return [...this.queue];
  }

  /**
   * Replays and syncs pending mutations against a server sync handler.
   */
  public async syncWithServer(
    serverHandler: (mutation: SyncMutation) => Promise<{
      success: boolean;
      conflict?: boolean;
      serverState?: Record<string, unknown>;
      error?: string;
    }>,
    strategy: ConflictResolutionStrategy = 'lww'
  ): Promise<SyncReport> {
    let syncedCount = 0;
    let failedCount = 0;
    let conflictsResolved = 0;

    const pending = this.getPending().sort((a, b) => a.timestamp - b.timestamp);

    for (const mut of pending) {
      mut.status = 'syncing';

      try {
        const res = await serverHandler(mut);

        if (res.success) {
          mut.status = 'synced';
          mut.syncedAt = Date.now();
          syncedCount++;
        } else if (res.conflict && res.serverState) {
          // Resolve conflict
          const resolved = resolveConflict(mut, res.serverState, strategy);
          mut.status = 'synced';
          mut.payload = resolved.resolvedPayload;
          mut.syncedAt = Date.now();
          conflictsResolved++;
          syncedCount++;
        } else {
          mut.retryCount++;
          if (mut.retryCount >= this.maxRetries) {
            mut.status = 'failed';
            mut.error = res.error || 'Max retries exceeded';
            failedCount++;
          } else {
            mut.status = 'pending';
          }
        }
      } catch (err: unknown) {
        mut.retryCount++;
        if (mut.retryCount >= this.maxRetries) {
          mut.status = 'failed';
          mut.error = err instanceof Error ? err.message : String(err);
          failedCount++;
        } else {
          mut.status = 'pending';
        }
      }
    }

    const remainingPending = this.queue.filter((m) => m.status === 'pending').length;

    return {
      totalProcessed: pending.length,
      syncedCount,
      failedCount,
      conflictsResolved,
      remainingPending,
      mutations: [...this.queue],
    };
  }

  public clearSynced(): void {
    this.queue = this.queue.filter((m) => m.status !== 'synced');
  }

  public clear(): void {
    this.queue = [];
  }
}
