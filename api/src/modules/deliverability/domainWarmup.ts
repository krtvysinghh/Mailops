/**
 * Module: Automated Domain Warmup Engine
 * 
 * Automatically manages gradual sending volume ramps to build positive
 * sender reputation and prevent spam folder placement on new domains.
 */

export interface WarmupSchedule {
  domainId: string;
  day: number;
  dailyTargetLimit: number;
  sentToday: number;
  status: 'active' | 'paused' | 'completed';
  reputationScore: number;
  startDate: number;
}

export const DEFAULT_WARMUP_RAMP = [
  { day: 1, limit: 20 },
  { day: 2, limit: 35 },
  { day: 3, limit: 50 },
  { day: 4, limit: 75 },
  { day: 5, limit: 100 },
  { day: 6, limit: 150 },
  { day: 7, limit: 200 },
  { day: 8, limit: 300 },
  { day: 9, limit: 450 },
  { day: 10, limit: 600 },
  { day: 14, limit: 1000 },
  { day: 21, limit: 2500 },
  { day: 30, limit: 5000 },
];

export class DomainWarmupManager {
  private schedules: Map<string, WarmupSchedule> = new Map();

  public initWarmup(domainId: string): WarmupSchedule {
    const schedule: WarmupSchedule = {
      domainId,
      day: 1,
      dailyTargetLimit: DEFAULT_WARMUP_RAMP[0].limit,
      sentToday: 0,
      status: 'active',
      reputationScore: 100,
      startDate: Date.now()
    };
    this.schedules.set(domainId, schedule);
    return schedule;
  }

  public canSend(domainId: string): { allowed: boolean; remainingToday: number; dailyLimit: number } {
    const schedule = this.schedules.get(domainId);
    if (!schedule || schedule.status !== 'active') {
      return { allowed: true, remainingToday: Infinity, dailyLimit: Infinity };
    }

    const remaining = schedule.dailyTargetLimit - schedule.sentToday;
    return {
      allowed: remaining > 0,
      remainingToday: Math.max(0, remaining),
      dailyLimit: schedule.dailyTargetLimit
    };
  }

  public recordSent(domainId: string, count = 1): void {
    const schedule = this.schedules.get(domainId);
    if (schedule) {
      schedule.sentToday += count;
    }
  }

  public advanceDay(domainId: string): WarmupSchedule | null {
    const schedule = this.schedules.get(domainId);
    if (!schedule) return null;

    schedule.day++;
    schedule.sentToday = 0;

    const rampTier = DEFAULT_WARMUP_RAMP.find(r => r.day >= schedule.day) || DEFAULT_WARMUP_RAMP[DEFAULT_WARMUP_RAMP.length - 1];
    schedule.dailyTargetLimit = rampTier.limit;

    if (schedule.day > 30) {
      schedule.status = 'completed';
    }

    return schedule;
  }
}
