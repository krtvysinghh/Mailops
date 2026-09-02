/**
 * Feature 13: Email Snooze & Reminder System
 * Pure TypeScript implementation of temporary hiding with future wake-up timestamps,
 * dynamic presets, reminder alerts, and zero external dependencies.
 */

export type SnoozePreset =
  | 'later_today'
  | 'this_evening'
  | 'tomorrow_morning'
  | 'this_weekend'
  | 'next_week'
  | 'custom';

export interface SnoozeOptions {
  referenceTime?: Date | number;
  customTimestamp?: Date | string | number;
  userTimezoneOffsetMinutes?: number; // Minutes from UTC (e.g. -300 for UTC-5)
  reason?: string;
  originalFolderId?: string;
}

export interface SnoozedEmailState {
  emailId: string;
  snoozedAt: number;
  snoozedUntil: number;
  presetUsed: SnoozePreset;
  reason?: string;
  originalFolderId: string;
  isWokenUp: boolean;
  wokenUpAt?: number;
}

export interface WakeupAlert {
  emailId: string;
  snoozedAt: number;
  wokenUpAt: number;
  reason?: string;
  message: string;
}

/**
 * Calculates a future wake-up timestamp based on preset or custom timestamp.
 */
export function calculateSnoozeTimestamp(
  preset: SnoozePreset,
  options: SnoozeOptions = {}
): { timestamp: number; error?: string } {
  const refTime = options.referenceTime
    ? typeof options.referenceTime === 'number'
      ? options.referenceTime
      : options.referenceTime.getTime()
    : Date.now();

  const refDate = new Date(refTime);

  if (preset === 'custom') {
    if (!options.customTimestamp) {
      return { timestamp: 0, error: 'Custom snooze preset requires customTimestamp' };
    }
    let customTs: number;
    if (options.customTimestamp instanceof Date) {
      customTs = options.customTimestamp.getTime();
    } else if (typeof options.customTimestamp === 'number') {
      customTs = options.customTimestamp;
    } else {
      customTs = new Date(options.customTimestamp).getTime();
    }

    if (isNaN(customTs) || customTs <= refTime) {
      return { timestamp: 0, error: 'Custom snooze time must be in the future' };
    }
    return { timestamp: customTs };
  }

  if (preset === 'later_today') {
    // Default +4 hours
    return { timestamp: refTime + 4 * 60 * 60 * 1000 };
  }

  if (preset === 'this_evening') {
    const evening = new Date(refDate);
    evening.setHours(18, 0, 0, 0);
    // If it's already past 18:00, push to 21:00 or +3 hours
    if (evening.getTime() <= refTime) {
      return { timestamp: refTime + 3 * 60 * 60 * 1000 };
    }
    return { timestamp: evening.getTime() };
  }

  if (preset === 'tomorrow_morning') {
    const tomorrow = new Date(refDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    return { timestamp: tomorrow.getTime() };
  }

  if (preset === 'this_weekend') {
    const sat = new Date(refDate);
    const day = sat.getDay();
    // Days until Saturday (6)
    const daysUntilSat = day === 6 ? 7 : (6 - day + 7) % 7;
    sat.setDate(sat.getDate() + (daysUntilSat === 0 ? 7 : daysUntilSat));
    sat.setHours(9, 0, 0, 0);
    return { timestamp: sat.getTime() };
  }

  if (preset === 'next_week') {
    const mon = new Date(refDate);
    const day = mon.getDay();
    // Days until next Monday (1)
    const daysUntilMon = day === 1 ? 7 : (1 - day + 7) % 7;
    mon.setDate(mon.getDate() + (daysUntilMon === 0 ? 7 : daysUntilMon));
    mon.setHours(9, 0, 0, 0);
    return { timestamp: mon.getTime() };
  }

  return { timestamp: refTime + 24 * 60 * 60 * 1000 };
}

/**
 * Snooze & Reminder Manager
 */
export class SnoozeReminderManager {
  private snoozed: Map<string, SnoozedEmailState> = new Map();

  /**
   * Snoozes an email.
   */
  public snooze(
    emailId: string,
    preset: SnoozePreset,
    options: SnoozeOptions = {}
  ): { success: boolean; state?: SnoozedEmailState; error?: string } {
    if (!emailId) {
      return { success: false, error: 'Missing emailId' };
    }

    const calc = calculateSnoozeTimestamp(preset, options);
    if (calc.error || !calc.timestamp) {
      return { success: false, error: calc.error || 'Failed to calculate snooze timestamp' };
    }

    const now = options.referenceTime
      ? typeof options.referenceTime === 'number'
        ? options.referenceTime
        : options.referenceTime.getTime()
      : Date.now();

    const state: SnoozedEmailState = {
      emailId,
      snoozedAt: now,
      snoozedUntil: calc.timestamp,
      presetUsed: preset,
      reason: options.reason,
      originalFolderId: options.originalFolderId || 'inbox',
      isWokenUp: false,
    };

    this.snoozed.set(emailId, state);
    return { success: true, state };
  }

  /**
   * Unsnoozes an email manually.
   */
  public unsnooze(emailId: string): { success: boolean; state?: SnoozedEmailState; error?: string } {
    const state = this.snoozed.get(emailId);
    if (!state) {
      return { success: false, error: `Email ${emailId} is not snoozed` };
    }

    this.snoozed.delete(emailId);
    return {
      success: true,
      state: {
        ...state,
        isWokenUp: true,
        wokenUpAt: Date.now(),
      },
    };
  }

  /**
   * Evaluates due wakeups given a reference time.
   */
  public getDueWakeups(now: number | Date = Date.now()): SnoozedEmailState[] {
    const refTime = typeof now === 'number' ? now : now.getTime();
    const due: SnoozedEmailState[] = [];

    for (const state of this.snoozed.values()) {
      if (!state.isWokenUp && state.snoozedUntil <= refTime) {
        due.push({ ...state });
      }
    }

    return due.sort((a, b) => a.snoozedUntil - b.snoozedUntil);
  }

  /**
   * Processes all due wakeups, transitioning states and producing alerts.
   */
  public processDueWakeups(now: number | Date = Date.now()): {
    dueCount: number;
    wokenUp: SnoozedEmailState[];
    alerts: WakeupAlert[];
  } {
    const refTime = typeof now === 'number' ? now : now.getTime();
    const due = this.getDueWakeups(refTime);
    const wokenUp: SnoozedEmailState[] = [];
    const alerts: WakeupAlert[] = [];

    for (const item of due) {
      const state = this.snoozed.get(item.emailId);
      if (state) {
        state.isWokenUp = true;
        state.wokenUpAt = refTime;
        wokenUp.push({ ...state });

        alerts.push({
          emailId: item.emailId,
          snoozedAt: item.snoozedAt,
          wokenUpAt: refTime,
          reason: item.reason,
          message: item.reason
            ? `Reminder: Snoozed email returned to inbox (${item.reason})`
            : `Snoozed email returned to inbox`,
        });

        // Remove from active snooze map
        this.snoozed.delete(item.emailId);
      }
    }

    return {
      dueCount: due.length,
      wokenUp,
      alerts,
    };
  }

  public get(emailId: string): SnoozedEmailState | undefined {
    const state = this.snoozed.get(emailId);
    return state ? { ...state } : undefined;
  }

  public listActive(): SnoozedEmailState[] {
    return Array.from(this.snoozed.values()).filter((s) => !s.isWokenUp);
  }

  public clear(): void {
    this.snoozed.clear();
  }
}
