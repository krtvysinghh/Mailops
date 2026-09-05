export interface Draft {
  id: string;
  content: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  approvers: string[];
}
const drafts: Map<string, Draft> = new Map();
export function submitForApproval(draftId: string, approverIds: string[]): boolean {
  const draft = drafts.get(draftId);
  if (!draft || draft.status !== 'draft') return false;
  draft.status = 'pending';
  draft.approvers = approverIds;
  return true;
}
export function approveDraft(draftId: string, approverId: string): boolean {
  const draft = drafts.get(draftId);
  if (!draft || draft.status !== 'pending') return false;
  if (!draft.approvers.includes(approverId)) return false;
  draft.status = 'approved';
  return true;
}
export function rejectDraft(draftId: string, reason: string): boolean {
  const draft = drafts.get(draftId);
  if (!draft || draft.status !== 'pending') return false;
  draft.status = 'rejected';
  return true;
}
export function getApprovalQueue(userId: string): Draft[] {
  return Array.from(drafts.values()).filter(d => d.status === 'pending' && d.approvers.includes(userId));
}