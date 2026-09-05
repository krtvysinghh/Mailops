const allowedIPs: Map<string, Set<string>> = new Map();
const blockedIPs: Map<string, Set<string>> = new Map();

export function addAllowedIP(userId: string, ip: string): void {
  const ips = allowedIPs.get(userId) || new Set();
  ips.add(ip);
  allowedIPs.set(userId, ips);
}

export function addBlockedIP(userId: string, ip: string): void {
  const ips = blockedIPs.get(userId) || new Set();
  ips.add(ip);
  blockedIPs.set(userId, ips);
}

export function isIPAllowed(userId: string, ip: string): boolean {
  const blocked = blockedIPs.get(userId);
  if (blocked && blocked.has(ip)) return false;
  
  const allowed = allowedIPs.get(userId);
  if (allowed && allowed.size > 0 && !allowed.has(ip)) return false;
  
  return true;
}

export function listACLRules(userId: string): { allowed: string[], blocked: string[] } {
  return {
    allowed: Array.from(allowedIPs.get(userId) || []),
    blocked: Array.from(blockedIPs.get(userId) || [])
  };
}