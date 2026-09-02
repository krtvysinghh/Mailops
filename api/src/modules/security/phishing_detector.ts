/**
 * Feature 32: Phishing & Suspicious Link Detector
 * 
 * Multi-vector Phishing Detection Scanner:
 * 1. Homograph / Punycode Lookalike Detector
 * 2. Deceptive Anchors (Visible Text vs. Actual Destination Mismatch)
 * 3. Credential Harvesting & Social Engineering Lure Scoring
 * 
 * Zero new NPM dependencies. Pure TypeScript.
 */

export interface FlaggedLink {
  href: string;
  anchorText: string;
  reason: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface PhishingScanResult {
  isSuspicious: boolean;
  riskLevel: 'safe' | 'low' | 'suspicious' | 'malicious';
  score: number; // 0.0 to 1.0
  flags: string[];
  flaggedLinks: FlaggedLink[];
  details: {
    homographCount: number;
    anchorMismatchCount: number;
    ipHostCount: number;
    credentialLureScore: number;
  };
}

// High-value brand domains monitored for typo-squatting / homograph impersonation
const HIGH_VALUE_BRANDS = [
  'paypal.com',
  'google.com',
  'apple.com',
  'microsoft.com',
  'amazon.com',
  'netflix.com',
  'chase.com',
  'bankofamerica.com',
  'wellsfargo.com',
  'coinbase.com',
  'github.com',
  'dropbox.com',
  'facebook.com',
  'instagram.com',
  'twitter.com',
  'linkedin.com',
  'adobe.com',
  'docusign.com',
];

// Cyrillic and Greek confusables frequently used in IDN homograph attacks
const CONFUSABLES: Record<string, string> = {
  '\u0430': 'a', // Cyrillic Small Letter A
  '\u0441': 'c', // Cyrillic Small Letter Es
  '\u0435': 'e', // Cyrillic Small Letter Ie
  '\u0456': 'i', // Cyrillic Small Letter Byelorussian-Ukrainian I
  '\u0458': 'j', // Cyrillic Small Letter Je
  '\u043E': 'o', // Cyrillic Small Letter O
  '\u0440': 'p', // Cyrillic Small Letter Er
  '\u0455': 's', // Cyrillic Small Letter Dze
  '\u0443': 'y', // Cyrillic Small Letter U
  '\u0445': 'x', // Cyrillic Small Letter Ha
  '\u03B1': 'a', // Greek Small Letter Alpha
  '\u03BF': 'o', // Greek Small Letter Omicron
  '\u03BD': 'v', // Greek Small Letter Nu
};

// Social engineering & credential harvesting keyword weights
const LURE_PATTERNS: Array<{ regex: RegExp; weight: number; flag: string }> = [
  { regex: /\b(account\s+(?:is|has\s+been|was|will\s+be)?\s*(suspended|locked|restricted|disabled|terminated))\b/i, weight: 0.25, flag: 'Urgent account suspension lure' },
  { regex: /\b(verify\s+your\s+(identity|account|password|email|credentials|billing))\b/i, weight: 0.25, flag: 'Credential verification demand' },
  { regex: /\b(unauthorized\s+(activity|access|login|transaction)|security\s+alert)\b/i, weight: 0.20, flag: 'Security panic trigger' },
  { regex: /\b(password\s+(reset|expires|expiration)|change\s+your\s+password\s+immediately)\b/i, weight: 0.20, flag: 'Urgent password reset prompt' },
  { regex: /\b(wire\s+transfer|send\s+bitcoin|cryptocurrency\s+payment|gift\s+cards?)\b/i, weight: 0.25, flag: 'Financial / cryptocurrency demand' },
  { regex: /\b(immediate(ly)?\s+action\s+required|within\s+24\s+hours|act\s+now|click\s+here\s+to\s+restore)\b/i, weight: 0.20, flag: 'Urgent time-pressure inducement' },
  { regex: /\b(invoice\s+(attached|overdue|payment\s+required)|wire\s+instructions)\b/i, weight: 0.15, flag: 'Fake invoice / payment lure' },
  { regex: /\b(tax\s+refund|irs\s+notice|lottery\s+winner|claim\s+your\s+prize)\b/i, weight: 0.25, flag: 'Prize or refund scam pattern' },
];

/**
 * Computes standard Levenshtein distance between two strings.
 */
export function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

/**
 * Detects mixed-script confusables and homograph substitution inside a domain string.
 */
export function detectHomographDomain(domain: string): { isHomograph: boolean; normalized: string; reason?: string } {
  let hasConfusable = false;
  let normalized = '';
  
  // Check for Punycode prefix
  if (domain.toLowerCase().startsWith('xn--') || domain.includes('.xn--')) {
    return { isHomograph: true, normalized: domain, reason: 'Punycode encoded internationalized domain name (IDN)' };
  }

  // Check for zero-width characters
  if (/[\u200B-\u200D\uFEFF]/.test(domain)) {
    return { isHomograph: true, normalized: domain.replace(/[\u200B-\u200D\uFEFF]/g, ''), reason: 'Contains hidden zero-width spaces' };
  }

  // Check for mixed Cyrillic/Greek confusables
  for (const char of domain) {
    if (CONFUSABLES[char]) {
      hasConfusable = true;
      normalized += CONFUSABLES[char];
    } else {
      normalized += char;
    }
  }

  if (hasConfusable) {
    return {
      isHomograph: true,
      normalized,
      reason: `Homograph attack: contains confusable Unicode characters substituting for Latin letters (normalized to: ${normalized})`,
    };
  }

  // Common leetspeak substitutions: 0->o, 1->l/i, 5->s, etc.
  const leetNormalized = domain
    .replace(/0/g, 'o')
    .replace(/1/g, 'l')
    .replace(/3/g, 'e')
    .replace(/5/g, 's')
    .replace(/vv/g, 'w')
    .replace(/rn/g, 'm');

  for (const brand of HIGH_VALUE_BRANDS) {
    if (domain !== brand && (leetNormalized === brand || levenshteinDistance(domain, brand) === 1)) {
      return {
        isHomograph: true,
        normalized: brand,
        reason: `Typo-squatting / Brand lookalike impersonating ${brand}`,
      };
    }
  }

  return { isHomograph: false, normalized: domain };
}

/**
 * Parses HTML to extract all hyperlinks with their visible anchor text.
 */
export function extractLinksFromHtml(html: string): Array<{ href: string; anchorText: string }> {
  const links: Array<{ href: string; anchorText: string }> = [];
  const anchorRegex = /<a\s+(?:[^>]*?\s+)?href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = anchorRegex.exec(html)) !== null) {
    const href = match[1].trim();
    // Strip inner HTML tags from anchor text
    const text = match[2].replace(/<[^>]*>/g, '').trim();
    links.push({ href, anchorText: text });
  }

  // Also extract plain URLs in text that might not be wrapped in <a>
  const rawUrlRegex = /(https?:\/\/[^\s<>"']+)/gi;
  while ((match = rawUrlRegex.exec(html)) !== null) {
    const url = match[1].trim();
    if (!links.some(l => l.href === url)) {
      links.push({ href: url, anchorText: url });
    }
  }

  return links;
}

/**
 * Extracts hostname safely from a URL or domain string.
 */
export function extractHostname(urlOrDomain: string): string {
  try {
    let toParse = urlOrDomain.trim();
    if (!/^https?:\/\//i.test(toParse)) {
      toParse = 'http://' + toParse;
    }
    const parsed = new URL(toParse);
    return parsed.hostname.toLowerCase();
  } catch {
    return urlOrDomain.toLowerCase().replace(/^[a-z]+:\/\//i, '').split('/')[0].split('?')[0];
  }
}

/**
 * Evaluates potential deception in an anchor element.
 */
export function evaluateLinkDeception(href: string, anchorText: string): FlaggedLink | null {
  const hrefHost = extractHostname(href);
  
  // 1. IP address in destination host
  const isIpv4 = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hrefHost);
  const isHexOrOctalIp = /^0x[0-9a-f]+$/i.test(hrefHost) || /^0[0-7]+$/.test(hrefHost);
  if (isIpv4 || isHexOrOctalIp) {
    return {
      href,
      anchorText,
      severity: 'high',
      reason: `Direct IP address destination in URL (${hrefHost}) often used in phishing bypasses`,
    };
  }

  // 2. Embedded user credentials (e.g. http://paypal.com@evil.com)
  if (href.includes('@')) {
    return {
      href,
      anchorText,
      severity: 'critical',
      reason: 'URL contains embedded authentication delimiter (@) disguising true destination',
    };
  }

  // 3. Lookalike / Homograph in destination host
  const homograph = detectHomographDomain(hrefHost);
  if (homograph.isHomograph) {
    return {
      href,
      anchorText,
      severity: 'critical',
      reason: homograph.reason || 'Homograph domain detected',
    };
  }

  // 4. Mismatch between visible anchor text and actual destination
  // If the anchor text resembles a URL or domain
  if (/^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(anchorText) || /^https?:\/\//i.test(anchorText)) {
    const textHost = extractHostname(anchorText);
    if (textHost && hrefHost && textHost !== hrefHost) {
      // Check if it's not just subdomain difference of same company
      const p1 = textHost.split('.').slice(-2).join('.');
      const p2 = hrefHost.split('.').slice(-2).join('.');
      if (p1 !== p2) {
        return {
          href,
          anchorText,
          severity: 'critical',
          reason: `Deceptive link: visible anchor displays '${textHost}', but links to completely different host '${hrefHost}'`,
        };
      }
    }
  }

  // 5. Data URI / Javascript URI
  if (/^(data|javascript|vbscript):/i.test(href)) {
    return {
      href,
      anchorText,
      severity: 'critical',
      reason: `Dangerous URI scheme (${href.split(':')[0]}) detected in hyperlink`,
    };
  }

  return null;
}

/**
 * Scans email content (HTML, plain text, subject, sender) for multi-vector phishing indicators.
 */
export function scanForPhishing(
  paramOrText: { html?: string; text?: string; subject?: string; from?: string } | string,
  html?: string,
  from?: string
): PhishingScanResult {
  const params = typeof paramOrText === 'string'
    ? { text: paramOrText, html, from }
    : paramOrText;
  const flags: string[] = [];
  const flaggedLinks: FlaggedLink[] = [];
  let score = 0;
  
  let homographCount = 0;
  let anchorMismatchCount = 0;
  let ipHostCount = 0;
  let credentialLureScore = 0;

  const combinedContent = `${params.subject || ''}\n${params.text || ''}\n${params.html || ''}`;

  // 1. Check sender domain
  if (params.from) {
    const senderHost = extractHostname(params.from.split('@')[1] || params.from);
    const senderHomo = detectHomographDomain(senderHost);
    if (senderHomo.isHomograph) {
      homographCount++;
      score += 0.40;
      flags.push(`Sender domain '${senderHost}' is a homograph or brand impersonation`);
    }
  }

  // 2. Scan hyperlinks
  const links = extractLinksFromHtml(params.html || params.text || '');
  for (const link of links) {
    const deception = evaluateLinkDeception(link.href, link.anchorText);
    if (deception) {
      flaggedLinks.push(deception);
      if (deception.severity === 'critical') {
        score += 0.40;
        anchorMismatchCount++;
      } else if (deception.severity === 'high') {
        score += 0.30;
        ipHostCount++;
      } else {
        score += 0.15;
      }
      flags.push(deception.reason);
    }
  }

  // 3. Scan social engineering & credential harvesting lure phrases
  for (const lure of LURE_PATTERNS) {
    if (lure.regex.test(combinedContent)) {
      credentialLureScore += lure.weight;
      score += lure.weight;
      flags.push(lure.flag);
    }
  }

  // Cap score between 0.0 and 1.0
  const finalScore = Math.min(1.0, Math.round(score * 100) / 100);
  
  let riskLevel: 'safe' | 'low' | 'suspicious' | 'malicious' = 'safe';
  if (finalScore >= 0.70 || flaggedLinks.some(l => l.severity === 'critical')) {
    riskLevel = 'malicious';
  } else if (finalScore >= 0.35) {
    riskLevel = 'suspicious';
  } else if (finalScore >= 0.15) {
    riskLevel = 'low';
  }

  return {
    isSuspicious: riskLevel === 'suspicious' || riskLevel === 'malicious',
    riskLevel,
    score: finalScore,
    flags: Array.from(new Set(flags)),
    flaggedLinks,
    details: {
      homographCount,
      anchorMismatchCount,
      ipHostCount,
      credentialLureScore: Math.min(1.0, Math.round(credentialLureScore * 100) / 100),
    },
  };
}
