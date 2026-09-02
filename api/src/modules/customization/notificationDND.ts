/**
 * Feature 50: Notification Center & Quiet Hours / DND
 * Pure TypeScript Do Not Disturb (DND) evaluator,
 * timezone time-window parser, and notification filtering rules.
 */

export interface QuietHoursConfig {
  quietHoursStart?: string | null;     // e.g. "22:00"
  quietHoursEnd?: string | null;       // e.g. "08:00"
  quietHoursTimezone?: string | null;  // e.g. "America/New_York", "UTC"
  soundEnabled?: boolean | null;
  soundVolume?: number | null;
}

export interface InboundNotificationPayload {
  id: string;
  title: string;
  message: string;
  type: 'mention' | 'reply' | 'system' | 'assignment' | 'urgent';
  isUrgent?: boolean;
  senderEmail?: string;
  vipSenders?: string[];
  createdAt: Date | string | number;
}

export interface DndEvaluationResult {
  isQuietHoursActive: boolean;
  shouldSuppressNotification: boolean;
  shouldSuppressSound: boolean;
  reason: string;
  currentTimeInTz: string;
}

/**
 * Parses time string "HH:MM" into minutes from midnight (0 - 1439).
 */
export function parseTimeToMinutes(timeStr: string): number | null {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
}

/**
 * Gets current minutes from midnight in the specified timezone.
 */
export function getCurrentMinutesInTimezone(
  date: Date = new Date(),
  timezone: string = 'UTC'
): { minutes: number; timeString: string } {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(date);
    const hourPart = parts.find(p => p.type === 'hour')?.value || '00';
    const minPart = parts.find(p => p.type === 'minute')?.value || '00';
    const hours = parseInt(hourPart, 10);
    const minutes = parseInt(minPart, 10);
    return {
      minutes: hours * 60 + minutes,
      timeString: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
    };
  } catch {
    // Fallback to UTC
    const hours = date.getUTCHours();
    const mins = date.getUTCMinutes();
    return {
      minutes: hours * 60 + mins,
      timeString: `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`,
    };
  }
}

/**
 * Evaluates whether a given minute falls within [startMinute, endMinute] interval,
 * correctly handling overnight wraps (e.g. 22:00 -> 08:00).
 */
export function isMinuteInWindow(currentMin: number, startMin: number, endMin: number): boolean {
  if (startMin === endMin) {
    return false; // Zero duration
  }
  if (startMin < endMin) {
    // Standard daytime window, e.g. 09:00 -> 17:00
    return currentMin >= startMin && currentMin < endMin;
  }
  // Overnight window, e.g. 22:00 (1320) -> 08:00 (480)
  return currentMin >= startMin || currentMin < endMin;
}

/**
 * Evaluates Quiet Hours / DND status and notification suppression rules.
 */
export function evaluateDndStatus(
  config: QuietHoursConfig,
  notification?: Partial<InboundNotificationPayload>,
  evalDate: Date = new Date()
): DndEvaluationResult {
  const startMin = parseTimeToMinutes(config.quietHoursStart || '');
  const endMin = parseTimeToMinutes(config.quietHoursEnd || '');
  const tz = config.quietHoursTimezone || 'UTC';

  const { minutes: currentMin, timeString: currentTimeInTz } = getCurrentMinutesInTimezone(evalDate, tz);

  if (startMin === null || endMin === null) {
    return {
      isQuietHoursActive: false,
      shouldSuppressNotification: false,
      shouldSuppressSound: config.soundEnabled === false,
      reason: 'Quiet hours not configured',
      currentTimeInTz,
    };
  }

  const inQuietHours = isMinuteInWindow(currentMin, startMin, endMin);

  if (!inQuietHours) {
    return {
      isQuietHoursActive: false,
      shouldSuppressNotification: false,
      shouldSuppressSound: config.soundEnabled === false,
      reason: 'Outside quiet hours schedule',
      currentTimeInTz,
    };
  }

  // Quiet hours are active! Check VIP / Urgent exceptions
  if (notification) {
    if (notification.isUrgent || notification.type === 'urgent') {
      return {
        isQuietHoursActive: true,
        shouldSuppressNotification: false,
        shouldSuppressSound: false,
        reason: 'Urgent priority bypasses quiet hours',
        currentTimeInTz,
      };
    }

    if (
      notification.senderEmail &&
      notification.vipSenders &&
      notification.vipSenders.some(vip => vip.toLowerCase() === notification.senderEmail!.toLowerCase())
    ) {
      return {
        isQuietHoursActive: true,
        shouldSuppressNotification: false,
        shouldSuppressSound: false,
        reason: 'VIP sender bypasses quiet hours',
        currentTimeInTz,
      };
    }
  }

  return {
    isQuietHoursActive: true,
    shouldSuppressNotification: true,
    shouldSuppressSound: true,
    reason: `Quiet hours active (${config.quietHoursStart} - ${config.quietHoursEnd} ${tz})`,
    currentTimeInTz,
  };
}
