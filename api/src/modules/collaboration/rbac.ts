/**
 * Feature 21: Shared Team Inboxes & RBAC
 * 
 * Provides pure TypeScript role-based access control (RBAC), permission evaluation,
 * member hierarchy management, and shared inbox access enforcement without external dependencies.
 */

export type InboxRole = 'owner' | 'admin' | 'member' | 'viewer';

export type InboxPermission =
  | 'inbox:manage'        // Update inbox name, settings, delete inbox
  | 'members:invite'      // Add new members to inbox
  | 'members:remove'      // Remove existing members
  | 'members:role_change' // Promote / demote roles
  | 'email:read'          // Read emails in shared inbox
  | 'email:send'          // Send new email from shared inbox
  | 'email:reply'         // Reply to inbound emails
  | 'email:assign'        // Assign emails to team members
  | 'email:tag'           // Add or remove tags from emails
  | 'email:delete'        // Delete/trash emails
  | 'draft:create'        // Create collaborative drafts
  | 'draft:edit'          // Edit shared drafts
  | 'notes:create'        // Add internal private notes
  | 'notes:read';         // Read internal notes

// RBAC Permission Matrix definition
export const ROLE_PERMISSIONS: Record<InboxRole, readonly InboxPermission[]> = {
  owner: [
    'inbox:manage',
    'members:invite',
    'members:remove',
    'members:role_change',
    'email:read',
    'email:send',
    'email:reply',
    'email:assign',
    'email:tag',
    'email:delete',
    'draft:create',
    'draft:edit',
    'notes:create',
    'notes:read',
  ],
  admin: [
    'inbox:manage',
    'members:invite',
    'members:remove',
    'members:role_change',
    'email:read',
    'email:send',
    'email:reply',
    'email:assign',
    'email:tag',
    'email:delete',
    'draft:create',
    'draft:edit',
    'notes:create',
    'notes:read',
  ],
  member: [
    'email:read',
    'email:send',
    'email:reply',
    'email:assign',
    'email:tag',
    'draft:create',
    'draft:edit',
    'notes:create',
    'notes:read',
  ],
  viewer: [
    'email:read',
    'notes:read',
  ],
} as const;

// Role hierarchy rank for comparative privilege checking (higher number = higher privilege)
export const ROLE_HIERARCHY: Record<InboxRole, number> = {
  owner: 4,
  admin: 3,
  member: 2,
  viewer: 1,
};

/**
 * Checks if a specific role possesses a required permission.
 */
export function hasPermission(role: InboxRole | string | undefined | null, permission: InboxPermission): boolean {
  if (!role) return false;
  const validRole = role.toLowerCase() as InboxRole;
  const permissions = ROLE_PERMISSIONS[validRole];
  if (!permissions) return false;
  return permissions.includes(permission);
}

/**
 * Returns all permissions granted to a given role.
 */
export function getRolePermissions(role: InboxRole): InboxPermission[] {
  return [...(ROLE_PERMISSIONS[role] || [])];
}

/**
 * Evaluates whether an actor with a given role can change the target user's role.
 * Rules:
 * 1. Owner can assign any role and change any user's role.
 * 2. Admin can only manage members and viewers; cannot promote anyone to owner or admin, cannot demote owner.
 * 3. Member and Viewer cannot change any roles.
 */
export function canModifyRole(
  actorRole: InboxRole,
  targetCurrentRole: InboxRole,
  targetNewRole: InboxRole
): boolean {
  if (actorRole === 'owner') {
    return true; // Owners have supreme power
  }
  if (actorRole === 'admin') {
    // Admin cannot change owner's role
    if (targetCurrentRole === 'owner') return false;
    // Admin cannot promote anyone to owner or admin
    if (targetNewRole === 'owner' || targetNewRole === 'admin') return false;
    // Admin cannot modify another admin
    if (targetCurrentRole === 'admin') return false;
    return true;
  }
  return false;
}

/**
 * Evaluates whether an actor can remove a member from the inbox.
 */
export function canRemoveMember(actorRole: InboxRole, targetRole: InboxRole): boolean {
  if (actorRole === 'owner') return true;
  if (actorRole === 'admin') {
    // Admins cannot remove owners or other admins
    return targetRole !== 'owner' && targetRole !== 'admin';
  }
  return false;
}

/**
 * Filters a list of user inbox memberships to only those that grant the specified permission.
 */
export function filterAccessibleInboxes<T extends { inboxId: string; role: InboxRole }>(
  userMemberships: T[],
  requiredPermission: InboxPermission
): T[] {
  return userMemberships.filter(m => hasPermission(m.role, requiredPermission));
}

export interface SharedInboxData {
  id: string;
  domainId: string;
  name: string;
  description?: string | null;
  createdAt: Date;
}

export interface InboxMemberData {
  id: string;
  inboxId: string;
  userId: string;
  role: InboxRole;
  createdAt: Date;
}

/**
 * In-memory / State helper to manage shared inboxes and member rosters with full RBAC validation.
 */
export class SharedInboxManager {
  private inboxes: Map<string, SharedInboxData> = new Map();
  private members: Map<string, InboxMemberData[]> = new Map(); // inboxId -> members

  createInbox(id: string, domainId: string, name: string, ownerUserId: string, description?: string): SharedInboxData {
    if (!name || name.trim().length === 0) {
      throw new Error('Inbox name cannot be empty');
    }
    const inbox: SharedInboxData = {
      id,
      domainId,
      name: name.trim(),
      description: description?.trim() || null,
      createdAt: new Date(),
    };
    this.inboxes.set(id, inbox);
    this.members.set(id, [{
      id: `mem-${id}-${ownerUserId}`,
      inboxId: id,
      userId: ownerUserId,
      role: 'owner',
      createdAt: new Date(),
    }]);
    return inbox;
  }

  getInbox(inboxId: string): SharedInboxData | undefined {
    return this.inboxes.get(inboxId);
  }

  listInboxesForUser(userId: string): Array<{ inbox: SharedInboxData; role: InboxRole }> {
    const result: Array<{ inbox: SharedInboxData; role: InboxRole }> = [];
    for (const [inboxId, memberList] of this.members.entries()) {
      const userMember = memberList.find(m => m.userId === userId);
      if (userMember) {
        const inbox = this.inboxes.get(inboxId);
        if (inbox) {
          result.push({ inbox, role: userMember.role });
        }
      }
    }
    return result;
  }

  addMember(actorUserId: string, inboxId: string, newUserId: string, role: InboxRole): InboxMemberData {
    const memberList = this.members.get(inboxId);
    if (!memberList) throw new Error(`Shared inbox ${inboxId} not found`);
    const actor = memberList.find(m => m.userId === actorUserId);
    if (!actor || !hasPermission(actor.role, 'members:invite')) {
      throw new Error('Permission denied: Actor cannot invite members');
    }
    if (memberList.some(m => m.userId === newUserId)) {
      throw new Error('User is already a member of this inbox');
    }
    if (!canModifyRole(actor.role, 'viewer', role)) {
      throw new Error(`Permission denied: Actor cannot assign role '${role}'`);
    }

    const newMember: InboxMemberData = {
      id: `mem-${inboxId}-${newUserId}`,
      inboxId,
      userId: newUserId,
      role,
      createdAt: new Date(),
    };
    memberList.push(newMember);
    return newMember;
  }

  updateMemberRole(actorUserId: string, inboxId: string, targetUserId: string, newRole: InboxRole): InboxMemberData {
    const memberList = this.members.get(inboxId);
    if (!memberList) throw new Error(`Shared inbox ${inboxId} not found`);
    const actor = memberList.find(m => m.userId === actorUserId);
    if (!actor || !hasPermission(actor.role, 'members:role_change')) {
      throw new Error('Permission denied: Actor cannot change member roles');
    }
    const target = memberList.find(m => m.userId === targetUserId);
    if (!target) throw new Error('Target user is not a member of this inbox');

    if (!canModifyRole(actor.role, target.role, newRole)) {
      throw new Error(`Permission denied: Cannot change role from ${target.role} to ${newRole}`);
    }

    target.role = newRole;
    return target;
  }

  removeMember(actorUserId: string, inboxId: string, targetUserId: string): boolean {
    const memberList = this.members.get(inboxId);
    if (!memberList) throw new Error(`Shared inbox ${inboxId} not found`);
    const actor = memberList.find(m => m.userId === actorUserId);
    if (!actor) throw new Error('Actor is not a member of this inbox');
    const target = memberList.find(m => m.userId === targetUserId);
    if (!target) throw new Error('Target is not a member of this inbox');

    // Self-leaving is always permitted unless they are the sole owner
    if (actorUserId === targetUserId) {
      if (target.role === 'owner') {
        const ownerCount = memberList.filter(m => m.role === 'owner').length;
        if (ownerCount <= 1) {
          throw new Error('Cannot leave inbox: Must transfer ownership before sole owner departs');
        }
      }
    } else {
      if (!canRemoveMember(actor.role, target.role)) {
        throw new Error('Permission denied: Actor cannot remove this member');
      }
    }

    this.members.set(inboxId, memberList.filter(m => m.userId !== targetUserId));
    return true;
  }

  getMembers(inboxId: string): InboxMemberData[] {
    return this.members.get(inboxId) || [];
  }
}
