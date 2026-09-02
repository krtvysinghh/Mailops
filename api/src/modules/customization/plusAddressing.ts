/**
 * Feature 45: Plus-Addressing & Custom Aliases
 * Pure TypeScript RFC 5233 sub-addressing parser,
 * identity selector, and alias routing resolver.
 */

export interface ParsedAddress {
  raw: string;
  localPart: string;
  baseUser: string;
  tag: string | null;
  domain: string;
  normalized: string;
  isSubAddressed: boolean;
}

export interface AliasRoutingRule {
  aliasName: string;
  targetFolderId?: string | null;
  autoTagId?: string | null;
  isActive: boolean;
}

export interface IdentityProfile {
  id: string;
  domainId: string;
  displayName?: string;
  email: string;
  isAlias: boolean;
  tag?: string;
  replyTo?: string;
}

/**
 * Parses an email address according to RFC 5233 sub-addressing specifications.
 * Supports delimiters like '+' (standard), '-', etc.
 */
export function parsePlusAddress(
  address: string,
  delimiters: string[] = ['+']
): ParsedAddress {
  const trimmed = (address || '').trim();
  const atIndex = trimmed.lastIndexOf('@');

  if (atIndex === -1) {
    return {
      raw: trimmed,
      localPart: trimmed,
      baseUser: trimmed,
      tag: null,
      domain: '',
      normalized: trimmed.toLowerCase(),
      isSubAddressed: false,
    };
  }

  const localPart = trimmed.slice(0, atIndex);
  const domain = trimmed.slice(atIndex + 1).toLowerCase();

  // Find first matching delimiter
  let foundDelim: string | null = null;
  let delimIndex = -1;

  for (const d of delimiters) {
    const idx = localPart.indexOf(d);
    if (idx !== -1 && (delimIndex === -1 || idx < delimIndex)) {
      delimIndex = idx;
      foundDelim = d;
    }
  }

  if (delimIndex !== -1 && foundDelim) {
    const baseUser = localPart.slice(0, delimIndex);
    const tag = localPart.slice(delimIndex + foundDelim.length);
    return {
      raw: trimmed,
      localPart,
      baseUser,
      tag: tag || null,
      domain,
      normalized: `${baseUser}@${domain}`.toLowerCase(),
      isSubAddressed: true,
    };
  }

  return {
    raw: trimmed,
    localPart,
    baseUser: localPart,
    tag: null,
    domain,
    normalized: `${localPart}@${domain}`.toLowerCase(),
    isSubAddressed: false,
  };
}

/**
 * Generates an RFC 5233 sub-address given base email and tag.
 */
export function generateSubAddress(
  baseEmail: string,
  tag: string,
  delimiter: string = '+'
): string {
  const parsed = parsePlusAddress(baseEmail);
  const cleanTag = tag.trim().replace(/[^a-zA-Z0-9._-]/g, '');
  if (!cleanTag) return baseEmail;
  return `${parsed.baseUser}${delimiter}${cleanTag}@${parsed.domain}`;
}

/**
 * Formats an RFC 5322 From/Reply-To header string with display name.
 */
export function formatAddressHeader(displayName: string | undefined, email: string): string {
  const cleanEmail = email.trim();
  if (!displayName || !displayName.trim()) {
    return cleanEmail;
  }
  const cleanName = displayName.trim().replace(/"/g, '\\"');
  return `"${cleanName}" <${cleanEmail}>`;
}

/**
 * Resolves inbound routing for a received email address against registered aliases.
 */
export function resolveAliasRouting(
  recipientAddress: string,
  registeredAliases: AliasRoutingRule[],
  defaultFolder: string = 'inbox'
): {
  targetFolderId: string;
  appliedTagIds: string[];
  matchedAlias: string | null;
  tag: string | null;
} {
  const parsed = parsePlusAddress(recipientAddress);
  const matched = registeredAliases.find(
    (a) => a.isActive && (
      a.aliasName.toLowerCase() === parsed.localPart.toLowerCase() ||
      (parsed.tag && a.aliasName.toLowerCase() === parsed.tag.toLowerCase())
    )
  );

  const appliedTagIds: string[] = [];
  if (matched?.autoTagId) {
    appliedTagIds.push(matched.autoTagId);
  }

  return {
    targetFolderId: matched?.targetFolderId || defaultFolder,
    appliedTagIds,
    matchedAlias: matched ? matched.aliasName : null,
    tag: parsed.tag,
  };
}
