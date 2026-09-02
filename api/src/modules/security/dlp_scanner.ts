/**
 * Feature 35: DLP & PII Scanner (Data Loss Prevention)
 * 
 * Pre-Send PII & Secret Scanner:
 * 1. Credit Cards: Card pattern matching + Luhn Mod-10 Checksum Validation
 * 2. US Social Security Numbers (SSN): Format & Area/Group validation per SSA rules
 * 3. Cloud & Service API Keys: AWS, OpenAI, GitHub, Google, Slack, Stripe
 * 4. Cryptographic Private Keys: PEM header detectors (RSA, EC, OpenSSH, PGP)
 * 5. JSON Web Tokens (JWT)
 * 6. Redaction generator
 * 
 * Zero new NPM dependencies. Pure TypeScript.
 */

export interface DlpViolation {
  category: 'credit_card' | 'ssn' | 'api_key' | 'private_key' | 'jwt';
  severity: 'low' | 'medium' | 'high' | 'critical';
  matchedText: string;
  maskedText: string;
  startIndex: number;
  endIndex: number;
  description: string;
  metadata?: Record<string, any>;
}

export interface DlpScanResult {
  hasViolations: boolean;
  blocked: boolean;
  violationCount: number;
  violations: DlpViolation[];
  redactedText: string;
  summary: string;
}

/**
 * Validates a number string using the Luhn mod-10 algorithm.
 */
export function validateLuhn(digitsOnly: string): boolean {
  if (!/^\d{13,19}$/.test(digitsOnly)) return false;

  let sum = 0;
  let shouldDouble = false;

  // Loop from rightmost digit to leftmost
  for (let i = digitsOnly.length - 1; i >= 0; i--) {
    let digit = parseInt(digitsOnly.charAt(i), 10);

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

/**
 * Identifies credit card brand from prefix.
 */
export function identifyCreditCardBrand(digits: string): string {
  if (/^4/.test(digits)) return 'Visa';
  if (/^(5[1-5]|222[1-9]|22[3-9]\d|2[3-6]\d{2}|27[01]\d|2720)/.test(digits)) return 'Mastercard';
  if (/^3[47]/.test(digits)) return 'American Express';
  if (/^(6011|65|64[4-9]|622)/.test(digits)) return 'Discover';
  if (/^35(2[89]|[3-8]\d)/.test(digits)) return 'JCB';
  if (/^(30[0-5]|36|38)/.test(digits)) return 'Diners Club';
  return 'Unknown Card';
}

/**
 * Masks a credit card number, preserving the first 4 and last 4 digits.
 */
export function maskCreditCard(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 8) return '****-****-****';
  const first4 = digits.substring(0, 4);
  const last4 = digits.substring(digits.length - 4);
  return `${first4}-XXXX-XXXX-${last4}`;
}

/**
 * Validates US Social Security Number format and invalid prefix rules.
 */
export function isValidSsn(ssnRaw: string): boolean {
  const digits = ssnRaw.replace(/\D/g, '');
  if (digits.length !== 9) return false;

  const area = parseInt(digits.substring(0, 3), 10);
  const group = parseInt(digits.substring(3, 5), 10);
  const serial = parseInt(digits.substring(5, 9), 10);

  // SSA rules: Area cannot be 000, 666, or 900-999
  if (area === 0 || area === 666 || area >= 900) return false;
  // Group cannot be 00
  if (group === 0) return false;
  // Serial cannot be 0000
  if (serial === 0) return false;

  return true;
}

export function maskSsn(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length !== 9) return 'XXX-XX-XXXX';
  return `XXX-XX-${digits.substring(5)}`;
}

// API Key & Secret Signatures
const SECRET_PATTERNS: Array<{
  name: string;
  regex: RegExp;
  category: DlpViolation['category'];
  severity: DlpViolation['severity'];
  masker: (m: string) => string;
}> = [
  // AWS Access Key ID
  {
    name: 'AWS Access Key ID',
    regex: /\b(AKIA[0-9A-Z]{16})\b/g,
    category: 'api_key',
    severity: 'critical',
    masker: (m) => m.substring(0, 4) + '*'.repeat(m.length - 8) + m.substring(m.length - 4),
  },
  // OpenAI API Key
  {
    name: 'OpenAI API Key',
    regex: /\b(sk-[a-zA-Z0-9]{20,48}|sk-proj-[a-zA-Z0-9-_]{48,})\b/g,
    category: 'api_key',
    severity: 'critical',
    masker: (m) => m.substring(0, 7) + '*'.repeat(20) + m.substring(m.length - 4),
  },
  // GitHub Personal Access Token
  {
    name: 'GitHub Access Token',
    regex: /\b(gh[pousr]_[A-Za-z0-9_]{36,}|github_pat_[A-Za-z0-9_]{82})\b/g,
    category: 'api_key',
    severity: 'critical',
    masker: (m) => m.substring(0, 6) + '*'.repeat(16) + m.substring(m.length - 4),
  },
  // Google API Key
  {
    name: 'Google Cloud / Maps API Key',
    regex: /\b(AIza[0-9A-Za-z-_]{35})\b/g,
    category: 'api_key',
    severity: 'critical',
    masker: (m) => m.substring(0, 6) + '*'.repeat(20) + m.substring(m.length - 4),
  },
  // Slack Bot Token or Webhook
  {
    name: 'Slack API Token / Webhook',
    regex: /\b(xox[baprs]-[0-9a-zA-Z]{10,48}|https:\/\/hooks\.slack\.com\/services\/T[0-9A-Z]{8,}\/B[0-9A-Z]{8,}\/[0-9A-Za-z]{24})\b/g,
    category: 'api_key',
    severity: 'critical',
    masker: (m) => m.substring(0, 6) + '****************' + m.substring(m.length - 4),
  },
  // Stripe Secret Key
  {
    name: 'Stripe Secret Key',
    regex: /\b([sr]k_live_[0-9a-zA-Z]{24,})\b/g,
    category: 'api_key',
    severity: 'critical',
    masker: (m) => m.substring(0, 8) + '*'.repeat(16) + m.substring(m.length - 4),
  },
  // Cryptographic Private Key Headers
  {
    name: 'Cryptographic Private Key (PEM)',
    regex: /(-----BEGIN (?:RSA|EC|DSA|OPENSSH|PGP)?\s*PRIVATE KEY(?: BLOCK)?-----[\s\S]*?-----END (?:RSA|EC|DSA|OPENSSH|PGP)?\s*PRIVATE KEY(?: BLOCK)?-----)/g,
    category: 'private_key',
    severity: 'critical',
    masker: () => '-----BEGIN PRIVATE KEY-----\n[REDACTED SENSITIVE PRIVATE KEY]\n-----END PRIVATE KEY-----',
  },
  // JSON Web Token (JWT)
  {
    name: 'JSON Web Token (JWT)',
    regex: /\b(eyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,})\b/g,
    category: 'jwt',
    severity: 'high',
    masker: (m) => m.substring(0, 10) + '...[REDACTED_JWT]...' + m.substring(m.length - 6),
  },
];

/**
 * Scans input text for sensitive PII and confidential secrets.
 */
export function scanDlp(text: string): DlpScanResult {
  if (!text) {
    return {
      hasViolations: false,
      blocked: false,
      violationCount: 0,
      violations: [],
      redactedText: '',
      summary: 'No content to scan',
    };
  }

  const violations: DlpViolation[] = [];
  
  // 1. Scan for Credit Card numbers
  // Look for 13-19 digit candidate numbers formatted with spaces, dashes, dots, or plain digits
  const ccCandidateRegex = /\b(?:\d[ \-\.]*?){13,19}\b/g;
  let ccMatch: RegExpExecArray | null;
  
  while ((ccMatch = ccCandidateRegex.exec(text)) !== null) {
    const rawMatch = ccMatch[0];
    const digitsOnly = rawMatch.replace(/\D/g, '');
    
    if (digitsOnly.length >= 13 && digitsOnly.length <= 19) {
      if (validateLuhn(digitsOnly)) {
        const brand = identifyCreditCardBrand(digitsOnly);
        violations.push({
          category: 'credit_card',
          severity: 'critical',
          matchedText: rawMatch,
          maskedText: maskCreditCard(rawMatch),
          startIndex: ccMatch.index,
          endIndex: ccMatch.index + rawMatch.length,
          description: `Valid ${brand} Credit Card Number (passed Luhn checksum)`,
          metadata: { brand, length: digitsOnly.length },
        });
      }
    }
  }

  // 2. Scan for US SSNs
  const ssnRegex = /\b(?!000|666|9\d{2})\d{3}[- ]?(?!00)\d{2}[- ]?(?!0000)\d{4}\b/g;
  let ssnMatch: RegExpExecArray | null;

  while ((ssnMatch = ssnRegex.exec(text)) !== null) {
    const rawMatch = ssnMatch[0];
    if (isValidSsn(rawMatch)) {
      // Ensure this isn't already covered by a CC match
      const alreadyMatched = violations.some(
        v => v.startIndex <= ssnMatch!.index && v.endIndex >= ssnMatch!.index + rawMatch.length
      );
      if (!alreadyMatched) {
        violations.push({
          category: 'ssn',
          severity: 'critical',
          matchedText: rawMatch,
          maskedText: maskSsn(rawMatch),
          startIndex: ssnMatch.index,
          endIndex: ssnMatch.index + rawMatch.length,
          description: 'US Social Security Number (SSN)',
        });
      }
    }
  }

  // 3. Scan for API Keys, Private Keys, and JWTs
  for (const pattern of SECRET_PATTERNS) {
    pattern.regex.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = pattern.regex.exec(text)) !== null) {
      const matchedText = match[0];
      const startIndex = match.index;
      const endIndex = startIndex + matchedText.length;

      // Avoid duplicate overlapping spans
      const overlapping = violations.some(
        v => (startIndex >= v.startIndex && startIndex < v.endIndex) ||
             (endIndex > v.startIndex && endIndex <= v.endIndex)
      );

      if (!overlapping) {
        violations.push({
          category: pattern.category,
          severity: pattern.severity,
          matchedText,
          maskedText: pattern.masker(matchedText),
          startIndex,
          endIndex,
          description: pattern.name,
        });
      }
    }
  }

  // Sort violations by start index
  violations.sort((a, b) => a.startIndex - b.startIndex);

  // 4. Generate Redacted Text
  let redactedText = '';
  let lastIndex = 0;
  for (const v of violations) {
    if (v.startIndex >= lastIndex) {
      redactedText += text.substring(lastIndex, v.startIndex);
      redactedText += v.maskedText;
      lastIndex = v.endIndex;
    }
  }
  if (lastIndex < text.length) {
    redactedText += text.substring(lastIndex);
  }

  const blocked = violations.some(v => v.severity === 'critical');
  const summary = violations.length === 0
    ? 'No DLP violations detected'
    : `Detected ${violations.length} sensitive data violation(s): ${violations.map(v => v.description).join(', ')}`;

  return {
    hasViolations: violations.length > 0,
    blocked,
    violationCount: violations.length,
    violations,
    redactedText: violations.length > 0 ? redactedText : text,
    summary,
  };
}

export const scanForDlp = scanDlp;

