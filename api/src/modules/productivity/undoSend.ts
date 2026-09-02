/**
 * Feature 12: Undo Send Grace Buffer
 * Pure TypeScript implementation of a configurable 5-30s grace period buffer
 * with instant cancellation tokens and zero external dependencies.
 */

export type UndoSendStatus = 'buffered' | 'cancelled' | 'dispatched';

export interface BufferedEmailPayload {
  toAddr: string;
  fromAddr: string;
  subject: string;
  textBody?: string;
  htmlBody?: string;
  ccAddr?: string;
  bccAddr?: string;
  domainId?: string;
  metadata?: Record<string, unknown>;
}

export interface UndoSendTicket {
  token: string;
  email: BufferedEmailPayload;
  bufferedAt: number;
  gracePeriodSeconds: number;
  expiresAt: number; // Unix timestamp in ms when send is committed
  status: UndoSendStatus;
  cancelledAt?: number;
  dispatchedAt?: number;
}

export interface UndoSendConfig {
  defaultGraceSeconds: number; // 5 - 30 seconds
  minGraceSeconds: number;     // 5
  maxGraceSeconds: number;     // 30
}

export const DEFAULT_UNDO_CONFIG: UndoSendConfig = {
  defaultGraceSeconds: 10,
  minGraceSeconds: 5,
  maxGraceSeconds: 30,
};

/**
 * Validates and clamps a grace period within allowed bounds (5 - 30s).
 */
export function validateGracePeriod(
  seconds: number,
  config: UndoSendConfig = DEFAULT_UNDO_CONFIG
): { valid: boolean; clampedSeconds: number; error?: string } {
  if (typeof seconds !== 'number' || isNaN(seconds)) {
    return {
      valid: false,
      clampedSeconds: config.defaultGraceSeconds,
      error: 'Grace period must be a valid number',
    };
  }

  if (seconds < config.minGraceSeconds) {
    return {
      valid: false,
      clampedSeconds: config.minGraceSeconds,
      error: `Grace period cannot be less than ${config.minGraceSeconds} seconds`,
    };
  }

  if (seconds > config.maxGraceSeconds) {
    return {
      valid: false,
      clampedSeconds: config.maxGraceSeconds,
      error: `Grace period cannot exceed ${config.maxGraceSeconds} seconds`,
    };
  }

  return { valid: true, clampedSeconds: Math.round(seconds) };
}

/**
 * Undo Send Buffer Manager
 */
export class UndoSendManager {
  private buffer: Map<string, UndoSendTicket> = new Map();
  private config: UndoSendConfig;

  constructor(config: Partial<UndoSendConfig> = {}) {
    this.config = { ...DEFAULT_UNDO_CONFIG, ...config };
  }

  /**
   * Updates default grace period.
   */
  public setGracePeriod(seconds: number): { success: boolean; seconds: number; error?: string } {
    const res = validateGracePeriod(seconds, this.config);
    if (res.valid) {
      this.config.defaultGraceSeconds = res.clampedSeconds;
      return { success: true, seconds: res.clampedSeconds };
    }
    return { success: false, seconds: this.config.defaultGraceSeconds, error: res.error };
  }

  public getGracePeriod(): number {
    return this.config.defaultGraceSeconds;
  }

  /**
   * Enqueues an email payload into the undo grace buffer.
   */
  public enqueue(
    email: BufferedEmailPayload,
    customGraceSeconds?: number
  ): { success: boolean; ticket: UndoSendTicket } {
    const grace =
      customGraceSeconds !== undefined
        ? validateGracePeriod(customGraceSeconds, this.config).clampedSeconds
        : this.config.defaultGraceSeconds;

    const now = Date.now();
    const token = `undo_${now}_${Math.random().toString(36).substring(2, 10)}`;
    const expiresAt = now + grace * 1000;

    const ticket: UndoSendTicket = {
      token,
      email: { ...email },
      bufferedAt: now,
      gracePeriodSeconds: grace,
      expiresAt,
      status: 'buffered',
    };

    this.buffer.set(token, ticket);
    return { success: true, ticket };
  }

  /**
   * Cancels a buffered send using the cancellation token.
   */
  public cancel(token: string, now: number = Date.now()): {
    success: boolean;
    ticket?: UndoSendTicket;
    message: string;
  } {
    const ticket = this.buffer.get(token);
    if (!ticket) {
      return { success: false, message: `Ticket ${token} not found` };
    }

    if (ticket.status === 'cancelled') {
      return { success: false, ticket, message: 'Send already cancelled' };
    }

    if (ticket.status === 'dispatched') {
      return { success: false, ticket, message: 'Email has already been dispatched' };
    }

    if (now > ticket.expiresAt) {
      ticket.status = 'dispatched';
      ticket.dispatchedAt = ticket.expiresAt;
      return { success: false, ticket, message: 'Grace period has expired; email dispatched' };
    }

    ticket.status = 'cancelled';
    ticket.cancelledAt = now;
    this.buffer.set(token, ticket);

    return {
      success: true,
      ticket,
      message: 'Email send successfully cancelled',
    };
  }

  /**
   * Gets remaining grace time in milliseconds for a ticket.
   */
  public getRemainingTime(token: string, now: number = Date.now()): {
    status: UndoSendStatus;
    remainingMs: number;
    ticket?: UndoSendTicket;
  } {
    const ticket = this.buffer.get(token);
    if (!ticket) {
      return { status: 'dispatched', remainingMs: 0 };
    }

    if (ticket.status !== 'buffered') {
      return { status: ticket.status, remainingMs: 0, ticket };
    }

    const remaining = ticket.expiresAt - now;
    if (remaining <= 0) {
      ticket.status = 'dispatched';
      ticket.dispatchedAt = ticket.expiresAt;
      return { status: 'dispatched', remainingMs: 0, ticket };
    }

    return { status: 'buffered', remainingMs: remaining, ticket };
  }

  /**
   * Flushes expired tickets ready for dispatch.
   */
  public flushExpired(now: number = Date.now()): UndoSendTicket[] {
    const readyToDispatch: UndoSendTicket[] = [];

    for (const ticket of this.buffer.values()) {
      if (ticket.status === 'buffered' && now >= ticket.expiresAt) {
        ticket.status = 'dispatched';
        ticket.dispatchedAt = now;
        readyToDispatch.push({ ...ticket });
      }
    }

    return readyToDispatch;
  }

  public getTicket(token: string): UndoSendTicket | undefined {
    const ticket = this.buffer.get(token);
    return ticket ? { ...ticket } : undefined;
  }

  public listActive(now: number = Date.now()): UndoSendTicket[] {
    const active: UndoSendTicket[] = [];
    for (const ticket of this.buffer.values()) {
      if (ticket.status === 'buffered' && now < ticket.expiresAt) {
        active.push({ ...ticket });
      }
    }
    return active;
  }

  public clear(): void {
    this.buffer.clear();
  }
}
