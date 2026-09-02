/**
 * Feature 22: Email Assignment & Delegation
 * 
 * Provides pure TypeScript state machines and workload balance tracking for delegating
 * email threads among team members, tracking assignment lifecycles, and managing status workflows.
 */

export type AssignmentStatus = 'unassigned' | 'in_progress' | 'waiting' | 'resolved';

export interface EmailAssignmentRecord {
  id: string;
  emailId: string;
  assignedToUserId: string | null;
  assignedByUserId: string;
  status: AssignmentStatus;
  note?: string;
  history: AssignmentHistoryItem[];
  updatedAt: Date;
  createdAt: Date;
}

export interface AssignmentHistoryItem {
  timestamp: Date;
  actorUserId: string;
  previousAssignee: string | null;
  newAssignee: string | null;
  previousStatus: AssignmentStatus;
  newStatus: AssignmentStatus;
  note?: string;
}

export interface WorkloadMetrics {
  userId: string;
  totalAssigned: number;
  inProgress: number;
  waiting: number;
  resolved: number;
  activeLoad: number; // inProgress + waiting
}

// Allowed state transitions in assignment lifecycle state machine
const ALLOWED_TRANSITIONS: Record<AssignmentStatus, AssignmentStatus[]> = {
  unassigned: ['in_progress', 'waiting', 'resolved'],
  in_progress: ['waiting', 'resolved', 'unassigned'],
  waiting: ['in_progress', 'resolved', 'unassigned'],
  resolved: ['in_progress', 'unassigned', 'waiting'],
};

/**
 * Validates whether a proposed status transition conforms to the lifecycle state machine.
 */
export function isValidStatusTransition(current: AssignmentStatus, next: AssignmentStatus): boolean {
  if (current === next) return true;
  const allowed = ALLOWED_TRANSITIONS[current];
  return allowed ? allowed.includes(next) : false;
}

/**
 * Executes an assignment update or reassignment, enforcing lifecycle rules and recording immutable history.
 */
export function assignEmailThread(
  current: EmailAssignmentRecord | null,
  params: {
    id: string;
    emailId: string;
    assignedToUserId?: string | null;
    assignedByUserId: string;
    status?: AssignmentStatus;
    note?: string;
  }
): { assignment: EmailAssignmentRecord; historyItem: AssignmentHistoryItem } {
  const now = new Date();
  const prevAssignee = current ? current.assignedToUserId : null;
  const prevStatus: AssignmentStatus = current ? current.status : 'unassigned';

  let nextAssignee: string | null = params.assignedToUserId !== undefined ? params.assignedToUserId : prevAssignee;
  let nextStatus: AssignmentStatus = params.status || (nextAssignee ? (prevStatus === 'unassigned' ? 'in_progress' : prevStatus) : 'unassigned');

  // If unassigning, default status to 'unassigned' unless explicitly requested otherwise
  if (!nextAssignee) {
    nextAssignee = null;
    if (!params.status) {
      nextStatus = 'unassigned';
    }
  }

  if (!isValidStatusTransition(prevStatus, nextStatus)) {
    throw new Error(`Invalid status transition from '${prevStatus}' to '${nextStatus}'`);
  }

  const historyItem: AssignmentHistoryItem = {
    timestamp: now,
    actorUserId: params.assignedByUserId,
    previousAssignee: prevAssignee,
    newAssignee: nextAssignee,
    previousStatus: prevStatus,
    newStatus: nextStatus,
    note: params.note,
  };

  const assignment: EmailAssignmentRecord = {
    id: current ? current.id : params.id,
    emailId: params.emailId,
    assignedToUserId: nextAssignee,
    assignedByUserId: params.assignedByUserId,
    status: nextStatus,
    note: params.note || current?.note,
    history: current ? [...current.history, historyItem] : [historyItem],
    updatedAt: now,
    createdAt: current ? current.createdAt : now,
  };

  return { assignment, historyItem };
}

/**
 * Filters assignment records based on specified query filters.
 */
export function filterAssignments(
  assignments: EmailAssignmentRecord[],
  filters: {
    userId?: string;
    status?: AssignmentStatus;
    unassignedOnly?: boolean;
    assignedOnly?: boolean;
  }
): EmailAssignmentRecord[] {
  return assignments.filter(item => {
    if (filters.unassignedOnly && item.assignedToUserId !== null) {
      return false;
    }
    if (filters.assignedOnly && item.assignedToUserId === null) {
      return false;
    }
    if (filters.userId && item.assignedToUserId !== filters.userId) {
      return false;
    }
    if (filters.status && item.status !== filters.status) {
      return false;
    }
    return true;
  });
}

/**
 * Computes workload balance metrics across all team members.
 */
export function calculateTeamWorkload(assignments: EmailAssignmentRecord[]): Record<string, WorkloadMetrics> {
  const metrics: Record<string, WorkloadMetrics> = {};

  for (const item of assignments) {
    if (!item.assignedToUserId) continue;
    const uid = item.assignedToUserId;

    if (!metrics[uid]) {
      metrics[uid] = {
        userId: uid,
        totalAssigned: 0,
        inProgress: 0,
        waiting: 0,
        resolved: 0,
        activeLoad: 0,
      };
    }

    metrics[uid].totalAssigned += 1;
    if (item.status === 'in_progress') {
      metrics[uid].inProgress += 1;
      metrics[uid].activeLoad += 1;
    } else if (item.status === 'waiting') {
      metrics[uid].waiting += 1;
      metrics[uid].activeLoad += 1;
    } else if (item.status === 'resolved') {
      metrics[uid].resolved += 1;
    }
  }

  return metrics;
}

/**
 * State manager for thread assignments.
 */
export class AssignmentManager {
  private assignments: Map<string, EmailAssignmentRecord> = new Map(); // emailId -> record

  assign(params: {
    id: string;
    emailId: string;
    assignedToUserId?: string | null;
    assignedByUserId: string;
    status?: AssignmentStatus;
    note?: string;
  }): EmailAssignmentRecord {
    const existing = this.assignments.get(params.emailId) || null;
    const { assignment } = assignEmailThread(existing, params);
    this.assignments.set(params.emailId, assignment);
    return assignment;
  }

  get(emailId: string): EmailAssignmentRecord | undefined {
    return this.assignments.get(emailId);
  }

  list(filters: {
    userId?: string;
    status?: AssignmentStatus;
    unassignedOnly?: boolean;
    assignedOnly?: boolean;
  } = {}): EmailAssignmentRecord[] {
    return filterAssignments(Array.from(this.assignments.values()), filters);
  }

  getWorkload(): Record<string, WorkloadMetrics> {
    return calculateTeamWorkload(Array.from(this.assignments.values()));
  }
}
