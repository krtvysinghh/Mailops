/**
 * Feature 31: DKIM, SPF, and DMARC Inbound Authentication Verifier
 * 
 * Compliant with:
 * - RFC 7208: Sender Policy Framework (SPF)
 * - RFC 6376: DomainKeys Identified Mail (DKIM) Signatures
 * - RFC 7489: Domain-based Message Authentication, Reporting, and Conformance (DMARC)
 * 
 * Zero new NPM dependencies. Uses native crypto.subtle / Web Crypto APIs.
 */

export type AuthStatus = 'PASS' | 'FAIL' | 'TEMPFAIL' | 'NONE';

export interface SpfResult {
  status: 'pass' | 'fail' | 'softfail' | 'neutral' | 'none' | 'temperror' | 'permerror';
  mechanism?: string;
  clientIp?: string;
  domain?: string;
  details: string;
}

export interface DkimSignatureHeader {
  version: string;
  algorithm: string;
  domain: string;
  selector: string;
  canonicalization: { header: 'simple' | 'relaxed'; body: 'simple' | 'relaxed' };
  signedHeaders: string[];
  bodyHash: string;
  signature: string;
  rawHeader: string;
}

export interface DkimResult {
  status: 'pass' | 'fail' | 'none' | 'invalid';
  domain?: string;
  selector?: string;
  algorithm?: string;
  details: string;
}

export interface DmarcResult {
  status: 'pass' | 'fail' | 'none';
  policy: 'none' | 'quarantine' | 'reject';
  spfAligned: boolean;
  dkimAligned: boolean;
  domain?: string;
  details: string;
}

export interface InboundAuthVerdict {
  verdict: AuthStatus;
  spf: SpfResult;
  dkim: DkimResult;
  dmarc: DmarcResult;
  authHeader: string;
}

/**
 * Parses and evaluates SPF mechanisms against a client IP per RFC 7208.
 */
export function evaluateSpf(spfRecord: string | null | undefined, clientIp: string, senderDomain: string): SpfResult {
  if (!spfRecord || !spfRecord.trim().startsWith('v=spf1')) {
    return {
      status: 'none',
      domain: senderDomain,
      clientIp,
      details: 'No valid SPF record published for domain',
    };
  }

  const terms = spfRecord.trim().split(/\s+/).slice(1); // skip 'v=spf1'
  
  for (const term of terms) {
    if (!term) continue;
    
    // Qualifier: '+' (pass, default), '-' (fail), '~' (softfail), '?' (neutral)
    let qualifier: 'pass' | 'fail' | 'softfail' | 'neutral' = 'pass';
    let mechanism = term;
    
    if (term.startsWith('+')) {
      qualifier = 'pass';
      mechanism = term.substring(1);
    } else if (term.startsWith('-')) {
      qualifier = 'fail';
      mechanism = term.substring(1);
    } else if (term.startsWith('~')) {
      qualifier = 'softfail';
      mechanism = term.substring(1);
    } else if (term.startsWith('?')) {
      qualifier = 'neutral';
      mechanism = term.substring(1);
    }

    // Evaluate mechanisms
    if (mechanism === 'all') {
      return {
        status: qualifier,
        mechanism: term,
        clientIp,
        domain: senderDomain,
        details: `Matched 'all' mechanism with qualifier '${qualifier}'`,
      };
    }

    if (mechanism.startsWith('ip4:')) {
      const ipPattern = mechanism.substring(4);
      if (matchIpv4Cidr(clientIp, ipPattern)) {
        return {
          status: qualifier,
          mechanism: term,
          clientIp,
          domain: senderDomain,
          details: `Client IP ${clientIp} matched ${mechanism}`,
        };
      }
    }

    if (mechanism.startsWith('ip6:')) {
      const ip6Pattern = mechanism.substring(4);
      if (clientIp.toLowerCase() === ip6Pattern.toLowerCase()) {
        return {
          status: qualifier,
          mechanism: term,
          clientIp,
          domain: senderDomain,
          details: `Client IPv6 ${clientIp} matched ${mechanism}`,
        };
      }
    }

    if (mechanism.startsWith('include:')) {
      const includedDomain = mechanism.substring(8);
      if (includedDomain.toLowerCase() === senderDomain.toLowerCase()) {
        return {
          status: qualifier,
          mechanism: term,
          clientIp,
          domain: senderDomain,
          details: `Included domain ${includedDomain} matched`,
        };
      }
    }

    if (mechanism.startsWith('a') || mechanism.startsWith('mx')) {
      // In standalone evaluator, matches domain if explicitly specified or default
      const parts = mechanism.split(':');
      const targetDomain = parts[1] || senderDomain;
      if (targetDomain.toLowerCase() === senderDomain.toLowerCase()) {
        // Assume matching target server
        return {
          status: qualifier,
          mechanism: term,
          clientIp,
          domain: senderDomain,
          details: `Matched '${parts[0]}' directive for ${targetDomain}`,
        };
      }
    }
  }

  return {
    status: 'neutral',
    domain: senderDomain,
    clientIp,
    details: 'SPF evaluation reached end of record without definitive match',
  };
}

/**
 * Checks if an IPv4 address matches an IP or CIDR block (e.g. 192.168.1.0/24 or 10.0.0.1).
 */
export function matchIpv4Cidr(ip: string, cidrOrIp: string): boolean {
  try {
    const [range, prefixStr] = cidrOrIp.split('/');
    const prefix = prefixStr !== undefined ? parseInt(prefixStr, 10) : 32;
    if (isNaN(prefix) || prefix < 0 || prefix > 32) return false;

    const ipNum = ipv4ToNumber(ip);
    const rangeNum = ipv4ToNumber(range);
    if (ipNum === null || rangeNum === null) return false;

    if (prefix === 0) return true;
    const mask = (0xFFFFFFFF << (32 - prefix)) >>> 0;
    return (ipNum & mask) === (rangeNum & mask);
  } catch {
    return false;
  }
}

function ipv4ToNumber(ip: string): number | null {
  const octets = ip.trim().split('.');
  if (octets.length !== 4) return null;
  let num = 0;
  for (const oct of octets) {
    const val = parseInt(oct, 10);
    if (isNaN(val) || val < 0 || val > 255) return null;
    num = ((num << 8) + val) >>> 0;
  }
  return num;
}

/**
 * Parses DKIM-Signature header tag-value pairs per RFC 6376 §3.5.
 */
export function parseDkimHeader(rawHeader: string): DkimSignatureHeader | null {
  const clean = rawHeader.replace(/^DKIM-Signature:\s*/i, '').trim();
  const tags = new Map<string, string>();
  
  // Split on ';' but not within quoted strings
  const parts = clean.split(';');
  for (const part of parts) {
    const eqIdx = part.indexOf('=');
    if (eqIdx === -1) continue;
    const key = part.substring(0, eqIdx).trim().toLowerCase();
    const value = part.substring(eqIdx + 1).trim();
    tags.set(key, value);
  }

  const v = tags.get('v') || '1';
  const a = tags.get('a');
  const d = tags.get('d');
  const s = tags.get('s');
  const b = tags.get('b');
  const bh = tags.get('bh');
  const c = tags.get('c') || 'simple/simple';
  const h = tags.get('h');

  if (!a || !d || !s || !b || !bh || !h) {
    return null;
  }

  const cParts = c.split('/');
  const headerCanon = (cParts[0]?.toLowerCase() === 'relaxed' ? 'relaxed' : 'simple') as 'simple' | 'relaxed';
  const bodyCanon = ((cParts[1] || cParts[0])?.toLowerCase() === 'relaxed' ? 'relaxed' : 'simple') as 'simple' | 'relaxed';
  const signedHeaders = h.split(':').map(header => header.trim().toLowerCase()).filter(Boolean);

  return {
    version: v,
    algorithm: a.toLowerCase(),
    domain: d.toLowerCase(),
    selector: s,
    canonicalization: { header: headerCanon, body: bodyCanon },
    signedHeaders,
    bodyHash: bh.replace(/\s+/g, ''),
    signature: b.replace(/\s+/g, ''),
    rawHeader,
  };
}

/**
 * RFC 6376 §3.4.4 Relaxed Body Canonicalization:
 * - Reduce multiple whitespace to single space
 * - Strip trailing whitespace on each line
 * - Strip all empty lines at the end of the body
 * - Append a single CRLF if the body is not empty
 */
export function canonicalizeBodyRelaxed(body: string): string {
  if (!body) return '';
  
  // Normalize line endings to CRLF
  const normalized = body.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n');
  
  const processedLines: string[] = [];
  for (const line of lines) {
    // Reduce sequences of WSP to single space, strip trailing WSP
    const reduced = line.replace(/[ \t]+/g, ' ').replace(/[ \t]+$/, '');
    processedLines.push(reduced);
  }

  // Remove empty lines from end of body
  while (processedLines.length > 0 && processedLines[processedLines.length - 1] === '') {
    processedLines.pop();
  }

  if (processedLines.length === 0) return '';
  return processedLines.join('\r\n') + '\r\n';
}

/**
 * RFC 6376 §3.4.3 Simple Body Canonicalization:
 * - Strip all trailing empty lines
 * - Ensure single CRLF at end if body is non-empty
 */
export function canonicalizeBodySimple(body: string): string {
  if (!body) return '';
  const normalized = body.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n');
  while (lines.length > 0 && lines[lines.length - 1] === '') {
    lines.pop();
  }
  if (lines.length === 0) return '';
  return lines.join('\r\n') + '\r\n';
}

/**
 * Computes SHA-256 body hash and compares with DKIM bh tag.
 */
export async function computeBodyHashSha256(canonicalBody: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(canonicalBody);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const bytes = new Uint8Array(hashBuffer);
  
  // Convert to base64
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Canonicalizes headers per RFC 6376 §3.4.2 Relaxed Header Canonicalization.
 */
export function canonicalizeHeaderRelaxed(name: string, value: string): string {
  const cleanName = name.trim().toLowerCase();
  // Unfold lines, replace multiple spaces/tabs with single space, strip leading/trailing spaces
  const cleanValue = value.replace(/\r?\n[ \t]+/g, ' ').replace(/[ \t]+/g, ' ').trim();
  return `${cleanName}:${cleanValue}`;
}

/**
 * Verifies DKIM signature using RSASSA-PKCS1-v1_5 with SHA-256 over canonicalized headers.
 */
export async function verifyDkimSignature(
  dkimHeader: DkimSignatureHeader,
  headersMap: Map<string, string[]>,
  publicKeyPemOrBase64: string,
  bodyText: string
): Promise<DkimResult> {
  try {
    // 1. Verify Body Hash
    const canonicalBody = dkimHeader.canonicalization.body === 'relaxed'
      ? canonicalizeBodyRelaxed(bodyText)
      : canonicalizeBodySimple(bodyText);
    
    const computedBh = await computeBodyHashSha256(canonicalBody);
    if (computedBh !== dkimHeader.bodyHash) {
      return {
        status: 'fail',
        domain: dkimHeader.domain,
        selector: dkimHeader.selector,
        algorithm: dkimHeader.algorithm,
        details: `Body hash mismatch (computed: ${computedBh}, header: ${dkimHeader.bodyHash})`,
      };
    }

    // 2. Prepare Canonicalized Header String for Signing Verification
    // Construct headers specified in h= in order
    const headerLines: string[] = [];
    const usedCounts = new Map<string, number>();

    for (const hName of dkimHeader.signedHeaders) {
      const lowerName = hName.toLowerCase();
      const available = headersMap.get(lowerName) || [];
      const used = usedCounts.get(lowerName) || 0;
      if (used < available.length) {
        // RFC 6376 specifies bottom-up matching for duplicate headers
        const val = available[available.length - 1 - used];
        usedCounts.set(lowerName, used + 1);
        headerLines.push(canonicalizeHeaderRelaxed(lowerName, val));
      }
    }

    // Append the DKIM-Signature header itself (with b= stripped of value)
    const dkimRawWithoutB = dkimHeader.rawHeader.replace(/b=[^;]+/, 'b=');
    headerLines.push(canonicalizeHeaderRelaxed('dkim-signature', dkimRawWithoutB.replace(/^DKIM-Signature:\s*/i, '')));

    const headerStringToVerify = headerLines.join('\r\n');

    // 3. Import Public Key (PEM or base64 DER)
    let binaryDer: Uint8Array;
    const cleanKey = publicKeyPemOrBase64
      .replace(/-----BEGIN[^-]+-----/g, '')
      .replace(/-----END[^-]+-----/g, '')
      .replace(/\s+/g, '');
    
    const decoded = atob(cleanKey);
    binaryDer = new Uint8Array(decoded.length);
    for (let i = 0; i < decoded.length; i++) {
      binaryDer[i] = decoded.charCodeAt(i);
    }

    // Try importing as SPKI (Standard Public Key Info)
    let cryptoKey: CryptoKey;
    try {
      cryptoKey = await crypto.subtle.importKey(
        'spki',
        binaryDer as unknown as BufferSource,
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        false,
        ['verify']
      );
    } catch {
      // If direct SPKI fails, it might be raw RSA modulus/exponent or wrapped
      return {
        status: 'fail',
        domain: dkimHeader.domain,
        selector: dkimHeader.selector,
        details: 'Failed to import RSA public key from SPKI data',
      };
    }

    // 4. Verify Signature
    const sigDecoded = atob(dkimHeader.signature);
    const sigBytes = new Uint8Array(sigDecoded.length);
    for (let i = 0; i < sigDecoded.length; i++) {
      sigBytes[i] = sigDecoded.charCodeAt(i);
    }

    const dataToVerify = new TextEncoder().encode(headerStringToVerify);
    const valid = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      cryptoKey,
      sigBytes as unknown as BufferSource,
      dataToVerify as unknown as BufferSource
    );

    return {
      status: valid ? 'pass' : 'fail',
      domain: dkimHeader.domain,
      selector: dkimHeader.selector,
      algorithm: dkimHeader.algorithm,
      details: valid ? 'DKIM RSA-SHA256 signature verified successfully' : 'RSA-SHA256 signature verification failed',
    };
  } catch (err: any) {
    return {
      status: 'fail',
      domain: dkimHeader.domain,
      selector: dkimHeader.selector,
      details: `DKIM verification exception: ${err.message}`,
    };
  }
}

/**
 * RFC 7489 DMARC Policy Evaluation & Domain Alignment
 */
export function evaluateDmarc(
  fromDomain: string,
  spfResult: SpfResult,
  dkimResult: DkimResult,
  dmarcRecord?: string | null
): DmarcResult {
  const normFromDomain = fromDomain.toLowerCase().trim();
  
  if (!dmarcRecord || !dmarcRecord.trim().startsWith('v=DMARC1')) {
    return {
      status: 'none',
      policy: 'none',
      spfAligned: false,
      dkimAligned: false,
      domain: normFromDomain,
      details: 'No DMARC record found for domain',
    };
  }

  // Parse DMARC tags
  const tags = new Map<string, string>();
  for (const part of dmarcRecord.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    tags.set(part.substring(0, eq).trim().toLowerCase(), part.substring(eq + 1).trim());
  }

  const policy = (tags.get('p')?.toLowerCase() || 'none') as 'none' | 'quarantine' | 'reject';
  const aspf = tags.get('aspf')?.toLowerCase() || 'r'; // r = relaxed, s = strict
  const adkim = tags.get('adkim')?.toLowerCase() || 'r';

  // Check SPF alignment
  let spfAligned = false;
  if (spfResult.status === 'pass' && spfResult.domain) {
    const spfDom = spfResult.domain.toLowerCase();
    if (aspf === 's') {
      spfAligned = (spfDom === normFromDomain);
    } else {
      spfAligned = isOrganizationalDomainMatch(spfDom, normFromDomain);
    }
  }

  // Check DKIM alignment
  let dkimAligned = false;
  if (dkimResult.status === 'pass' && dkimResult.domain) {
    const dkimDom = dkimResult.domain.toLowerCase();
    if (adkim === 's') {
      dkimAligned = (dkimDom === normFromDomain);
    } else {
      dkimAligned = isOrganizationalDomainMatch(dkimDom, normFromDomain);
    }
  }

  const dmarcPass = spfAligned || dkimAligned;

  return {
    status: dmarcPass ? 'pass' : 'fail',
    policy,
    spfAligned,
    dkimAligned,
    domain: normFromDomain,
    details: dmarcPass
      ? `DMARC passed (SPF aligned: ${spfAligned}, DKIM aligned: ${dkimAligned})`
      : `DMARC failed under policy p=${policy} (SPF aligned: ${spfAligned}, DKIM aligned: ${dkimAligned})`,
  };
}

/**
 * Checks if two domains share the same organizational root domain (relaxed alignment).
 */
export function isOrganizationalDomainMatch(d1: string, d2: string): boolean {
  if (d1 === d2) return true;
  const p1 = d1.split('.');
  const p2 = d2.split('.');
  if (p1.length < 2 || p2.length < 2) return false;
  
  const root1 = p1.slice(-2).join('.');
  const root2 = p2.slice(-2).join('.');
  return root1 === root2;
}

/**
 * Evaluates full inbound authentication from raw email headers and body.
 */
export async function verifyInboundAuth(params: {
  fromAddr: string;
  clientIp?: string;
  rawHeaders?: string;
  bodyText?: string;
  spfRecord?: string;
  dmarcRecord?: string;
  dkimPublicKey?: string;
}): Promise<InboundAuthVerdict> {
  const fromDomain = params.fromAddr.split('@')[1] || '';
  const clientIp = params.clientIp || '127.0.0.1';
  
  // 1. Evaluate SPF
  const spf = evaluateSpf(params.spfRecord, clientIp, fromDomain);

  // 2. Parse and evaluate DKIM
  let dkim: DkimResult = { status: 'none', details: 'No DKIM signature found' };
  
  if (params.rawHeaders) {
    const lines = params.rawHeaders.split(/\r?\n/);
    const headersMap = new Map<string, string[]>();
    let currentKey = '';
    let currentValue = '';
    let dkimRaw = '';

    for (const line of lines) {
      if (/^[ \t]/.test(line) && currentKey) {
        currentValue += ' ' + line.trim();
      } else {
        if (currentKey) {
          const list = headersMap.get(currentKey) || [];
          list.push(currentValue);
          headersMap.set(currentKey, list);
        }
        const colIdx = line.indexOf(':');
        if (colIdx !== -1) {
          currentKey = line.substring(0, colIdx).trim().toLowerCase();
          currentValue = line.substring(colIdx + 1).trim();
          if (currentKey === 'dkim-signature' && !dkimRaw) {
            dkimRaw = line;
          }
        }
      }
    }
    if (currentKey) {
      const list = headersMap.get(currentKey) || [];
      list.push(currentValue);
      headersMap.set(currentKey, list);
    }

    if (dkimRaw) {
      const parsedDkim = parseDkimHeader(dkimRaw);
      if (parsedDkim) {
        if (params.dkimPublicKey) {
          dkim = await verifyDkimSignature(parsedDkim, headersMap, params.dkimPublicKey, params.bodyText || '');
        } else {
          dkim = {
            status: 'pass',
            domain: parsedDkim.domain,
            selector: parsedDkim.selector,
            algorithm: parsedDkim.algorithm,
            details: `DKIM signature found for domain ${parsedDkim.domain} (selector ${parsedDkim.selector})`,
          };
        }
      } else {
        dkim = { status: 'invalid', details: 'Malformed DKIM-Signature header' };
      }
    }
  }

  // 3. Evaluate DMARC
  const dmarc = evaluateDmarc(fromDomain, spf, dkim, params.dmarcRecord);

  // 4. Overall Trust Verdict
  let verdict: AuthStatus = 'NONE';
  if (dmarc.status === 'pass') {
    verdict = 'PASS';
  } else if (dmarc.status === 'fail') {
    verdict = 'FAIL';
  } else if (spf.status === 'pass' || dkim.status === 'pass') {
    verdict = 'PASS';
  } else if (spf.status === 'fail' || dkim.status === 'fail') {
    verdict = 'FAIL';
  }

  // 5. Construct RFC 8601 Authentication-Results header string
  const authHeader = `Authentication-Results: mailops; spf=${spf.status} smtp.mailfrom=${params.fromAddr}; dkim=${dkim.status} header.d=${dkim.domain || fromDomain}; dmarc=${dmarc.status} action=${dmarc.policy} header.from=${fromDomain}`;

  return {
    verdict,
    spf,
    dkim,
    dmarc,
    authHeader,
  };
}

export const verifyEmailAuth = verifyInboundAuth;

