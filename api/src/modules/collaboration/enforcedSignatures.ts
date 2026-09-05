export interface SignaturePolicy {
  inboxId: string;
  html: string;
}
const policies: Map<string, SignaturePolicy> = new Map();
export function setTeamSignature(inboxId: string, html: string): void {
  policies.set(inboxId, { inboxId, html });
}
export function getSignaturePolicy(inboxId: string): SignaturePolicy | undefined {
  return policies.get(inboxId);
}
export function enforceSignature(draftContent: string, inboxId: string): string {
  const policy = getSignaturePolicy(inboxId);
  if (!policy) return draftContent;
  return `${draftContent}\n<br>\n${policy.html}`;
}