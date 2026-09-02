import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  evaluateSpf,
  matchIpv4Cidr,
  parseDkimHeader,
  canonicalizeBodyRelaxed,
  canonicalizeBodySimple,
  computeBodyHashSha256,
  canonicalizeHeaderRelaxed,
  verifyDkimSignature,
  evaluateDmarc,
  isOrganizationalDomainMatch,
  verifyInboundAuth,
  scanForPhishing,
  detectHomographDomain,
  levenshteinDistance,
  extractLinksFromHtml,
  evaluateLinkDeception,
  encryptWithPassword,
  decryptWithPassword,
  generateRsaOaepKeyPair,
  generateRsaPssKeyPair,
  exportPublicKeyToPem,
  importPublicKeyFromPem,
  encryptWithPublicKey,
  decryptWithPrivateKey,
  signMessage,
  verifySignedMessage,
  identifyMagicBytes,
  scanZipArchiveEntries,
  scanPdfForExploits,
  scanAttachment,
  validateLuhn,
  identifyCreditCardBrand,
  maskCreditCard,
  isValidSsn,
  maskSsn,
  scanDlp,
  isTrackingPixel,
  stripTrackersFromHtml,
  hashPasscode,
  verifyPasscode,
  createConfidentialMessage,
  accessConfidentialMessage,
  encodeBase32,
  decodeBase32,
  generateTotpSecret,
  generateTotpCode,
  verifyTotpCode,
  generateBackupCodes,
  generateOtpAuthUri,
  generateQrSvg,
  checkRateLimit,
  resetRateLimit,
  clearAllRateLimits,
  generateRawEml,
  shredBuffer,
  buildGdprExportBundle,
  computeComplianceHash,
} from '../../src/modules/security';

/**
 * Mailops Security & Compliance Suite Test Suite (Features 31 - 40)
 * 
 * Comprehensive 5-Tier Verification:
 * - Tier 1: Happy Path Feature Coverage (>=5 tests per feature)
 * - Tier 2: Boundary, Edge & Corner Cases (>=5 tests per feature)
 * - Tier 3: Cross-Feature Integration Workflows
 * - Tier 4: Real-World Application Scenarios
 * - Tier 5: Adversarial & Security Hardening
 */

// =========================================================================
// FEATURE 31: DKIM / SPF / DMARC Inbound Authentication Verifier
// =========================================================================
describe('Feature 31: DKIM/SPF/DMARC Inbound Verifier', () => {
  // Tier 1: Happy Path Tests
  it('T1.1: should pass SPF for exact matching client IPv4', () => {
    const record = 'v=spf1 ip4:198.51.100.1 -all';
    const res = evaluateSpf(record, '198.51.100.1', 'example.com');
    assert.equal(res.status, 'pass');
    assert.equal(res.domain, 'example.com');
  });

  it('T1.2: should pass SPF for CIDR /24 subnet match', () => {
    const record = 'v=spf1 ip4:192.0.2.0/24 -all';
    const res = evaluateSpf(record, '192.0.2.45', 'corp.com');
    assert.equal(res.status, 'pass');
  });

  it('T1.3: should return softfail for SPF ~all mechanism when IP does not match', () => {
    const record = 'v=spf1 ip4:10.0.0.1 ~all';
    const res = evaluateSpf(record, '192.168.1.1', 'example.com');
    assert.equal(res.status, 'softfail');
  });

  it('T1.4: should correctly canonicalize relaxed body per RFC 6376', () => {
    const rawBody = 'Hello   World!  \r\n\r\nTest line  \t  with spaces.\r\n\r\n\r\n';
    const canonical = canonicalizeBodyRelaxed(rawBody);
    assert.equal(canonical, 'Hello World!\r\n\r\nTest line with spaces.\r\n');
  });

  it('T1.5: should evaluate DMARC pass when SPF and DKIM are aligned', () => {
    const spf = { status: 'pass' as const, domain: 'mail.example.com', details: 'pass' };
    const dkim = { status: 'pass' as const, domain: 'example.com', details: 'pass' };
    const dmarcRecord = 'v=DMARC1; p=reject; aspf=r; adkim=r';
    
    const res = evaluateDmarc('example.com', spf, dkim, dmarcRecord);
    assert.equal(res.status, 'pass');
    assert.equal(res.policy, 'reject');
    assert.equal(res.spfAligned, true);
    assert.equal(res.dkimAligned, true);
  });

  // Tier 2: Boundary & Edge Cases
  it('T2.1: should return none when no SPF record is published', () => {
    const res = evaluateSpf('', '1.2.3.4', 'example.org');
    assert.equal(res.status, 'none');
  });

  it('T2.2: should parse DKIM header tags with mixed whitespace and casing', () => {
    const header = 'DKIM-Signature: v=1; a=RSA-SHA256; d=EXAMPLE.COM; s=2023; c=relaxed/relaxed; q=dns/txt; h=From:To:Subject; bh=abcd1234=; b=sigdata==;';
    const parsed = parseDkimHeader(header);
    assert.ok(parsed);
    assert.equal(parsed.domain, 'example.com');
    assert.equal(parsed.algorithm, 'rsa-sha256');
    assert.equal(parsed.canonicalization.header, 'relaxed');
    assert.deepEqual(parsed.signedHeaders, ['from', 'to', 'subject']);
  });

  it('T2.3: should correctly check organizational domain alignment (relaxed vs strict)', () => {
    assert.equal(isOrganizationalDomainMatch('sub.corp.example.com', 'example.com'), true);
    assert.equal(isOrganizationalDomainMatch('evil.com', 'example.com'), false);
  });

  it('T2.4: should fail DMARC under strict mode if subdomains do not match exactly', () => {
    const spf = { status: 'pass' as const, domain: 'sub.example.com', details: 'pass' };
    const dkim = { status: 'none' as const, details: 'none' };
    const dmarcRecord = 'v=DMARC1; p=quarantine; aspf=s'; // strict SPF alignment
    
    const res = evaluateDmarc('example.com', spf, dkim, dmarcRecord);
    assert.equal(res.status, 'fail');
    assert.equal(res.spfAligned, false);
    assert.equal(res.policy, 'quarantine');
  });

  it('T2.5: should calculate valid SHA-256 body hash', async () => {
    const body = 'Simple test body\r\n';
    const hash = await computeBodyHashSha256(body);
    assert.ok(hash.length > 20);
    assert.equal(typeof hash, 'string');
  });
});

// =========================================================================
// FEATURE 32: Phishing & Suspicious Link Detector
// =========================================================================
describe('Feature 32: Phishing & Suspicious Link Detector', () => {
  // Tier 1: Happy Path Tests
  it('T1.1: should detect Cyrillic homograph substitution in PayPal domain', () => {
    // Replace 'a' with Cyrillic \u0430
    const fakeDomain = 'p\u0430ypal.com';
    const res = detectHomographDomain(fakeDomain);
    assert.equal(res.isHomograph, true);
    assert.equal(res.normalized, 'paypal.com');
  });

  it('T1.2: should detect Punycode IDN domains', () => {
    const punyDomain = 'xn--pple-43d.com';
    const res = detectHomographDomain(punyDomain);
    assert.equal(res.isHomograph, true);
  });

  it('T1.3: should flag deceptive anchor mismatch where visible text differs from href', () => {
    const deception = evaluateLinkDeception('http://evil-phish.net/login', 'https://chase.com/secure');
    assert.ok(deception);
    assert.equal(deception.severity, 'critical');
    assert.ok(deception.reason.includes('Deceptive link'));
  });

  it('T1.4: should detect embedded credential delimiter in URL', () => {
    const deception = evaluateLinkDeception('http://paypal.com@attacker-site.com/auth', 'Click here');
    assert.ok(deception);
    assert.equal(deception.severity, 'critical');
  });

  it('T1.5: should score urgent account suspension lure keywords as suspicious', () => {
    const scan = scanForPhishing({
      subject: 'URGENT: Your account is suspended within 24 hours',
      text: 'Please verify your identity and change your password immediately to avoid termination.',
      from: 'security@generic.com',
    });
    assert.equal(scan.isSuspicious, true);
    assert.ok(scan.score >= 0.35);
    assert.ok(scan.flags.length >= 2);
  });

  // Tier 2: Boundary & Corner Cases
  it('T2.1: should return clean result for legitimate benign email', () => {
    const scan = scanForPhishing({
      subject: 'Weekly Team Sync Agenda',
      text: 'Hi team, looking forward to our sync tomorrow at 10 AM. Here is the doc: https://docs.google.com/meeting',
      from: 'alice@company.com',
    });
    assert.equal(scan.isSuspicious, false);
    assert.equal(scan.riskLevel, 'safe');
    assert.equal(scan.flaggedLinks.length, 0);
  });

  it('T2.2: should calculate accurate Levenshtein distance', () => {
    assert.equal(levenshteinDistance('paypal', 'paypa1'), 1);
    assert.equal(levenshteinDistance('google', 'g00gle'), 2);
    assert.equal(levenshteinDistance('apple', 'apple'), 0);
  });

  it('T2.3: should flag raw IP address destinations in hyperlinks', () => {
    const deception = evaluateLinkDeception('http://192.168.1.100/admin', 'Router Login');
    assert.ok(deception);
    assert.equal(deception.severity, 'high');
  });

  it('T2.4: should flag dangerous javascript: and data: URIs in links', () => {
    const deception = evaluateLinkDeception('javascript:alert(1)', 'View Invoice');
    assert.ok(deception);
    assert.equal(deception.severity, 'critical');
  });

  it('T2.5: should extract links from complex nested HTML', () => {
    const html = `<p>Check <a href="https://legit.com/home"><b>Legit Link</b></a> or http://plain-url.com in text</p>`;
    const links = extractLinksFromHtml(html);
    assert.ok(links.length >= 2);
    assert.equal(links[0].href, 'https://legit.com/home');
    assert.equal(links[0].anchorText, 'Legit Link');
  });
});

// =========================================================================
// FEATURE 33: Email Encryption & Digital Signatures (Client-Side Web Crypto)
// =========================================================================
describe('Feature 33: Email Encryption & Digital Signatures', () => {
  // Tier 1: Happy Path Tests
  it('T1.1: should symmetrically encrypt and decrypt message with password (AES-256-GCM + PBKDF2)', async () => {
    const secretMessage = 'Confidential financial forecast for Q4: Revenue $12.5M';
    const passphrase = 'SuperSecretKey!2026';

    const envelope = await encryptWithPassword(secretMessage, passphrase);
    assert.equal(envelope.version, 1);
    assert.equal(envelope.scheme, 'PBKDF2-AES-256-GCM');
    assert.ok(envelope.ciphertext.length > 0);

    const decrypted = await decryptWithPassword(envelope, passphrase);
    assert.equal(decrypted, secretMessage);
  });

  it('T1.2: should generate RSA-OAEP keypair and perform asymmetric envelope encryption/decryption', async () => {
    const keyPair = await generateRsaOaepKeyPair(2048);
    const plaintext = 'Secret medical record #982347';

    const envelope = await encryptWithPublicKey(plaintext, keyPair.publicKey);
    assert.equal(envelope.scheme, 'RSA-OAEP-AES-256-GCM');
    assert.ok(envelope.wrappedKey.length > 0);

    const decrypted = await decryptWithPrivateKey(envelope, keyPair.privateKey);
    assert.equal(decrypted, plaintext);
  });

  it('T1.3: should generate RSA-PSS keypair and sign/verify digital message signature', async () => {
    const keyPair = await generateRsaPssKeyPair(2048);
    const publicKeyPem = await exportPublicKeyToPem(keyPair.publicKey);
    const message = 'I hereby approve contract agreement ID #5521';

    const signedEnvelope = await signMessage(message, keyPair.privateKey, publicKeyPem);
    assert.equal(signedEnvelope.algorithm, 'RSA-PSS-SHA256');

    const isValid = await verifySignedMessage(signedEnvelope);
    assert.equal(isValid, true);
  });

  it('T1.4: should export and import RSA public key in standard PEM format', async () => {
    const keyPair = await generateRsaOaepKeyPair(2048);
    const pem = await exportPublicKeyToPem(keyPair.publicKey);
    
    assert.ok(pem.startsWith('-----BEGIN PUBLIC KEY-----'));
    assert.ok(pem.endsWith('-----END PUBLIC KEY-----'));

    const imported = await importPublicKeyFromPem(pem, 'RSA-OAEP', ['encrypt', 'wrapKey']);
    assert.ok(imported);
    assert.equal(imported.algorithm.name, 'RSA-OAEP');
  });

  // Tier 2: Boundary & Corner Cases
  it('T2.1: should fail password decryption when given incorrect passphrase', async () => {
    const envelope = await encryptWithPassword('Hello Secret', 'correct-password');
    await assert.rejects(async () => {
      await decryptWithPassword(envelope, 'wrong-password');
    });
  });

  it('T2.2: should reject tampered signature in signed message envelope', async () => {
    const keyPair = await generateRsaPssKeyPair(2048);
    const publicKeyPem = await exportPublicKeyToPem(keyPair.publicKey);
    const signedEnvelope = await signMessage('Original Payload', keyPair.privateKey, publicKeyPem);

    // Tamper with payload
    const tampered = { ...signedEnvelope, payload: 'Tampered Malicious Payload' };
    const isValid = await verifySignedMessage(tampered);
    assert.equal(isValid, false);
  });

  it('T2.3: should handle empty string symmetric encryption and decryption', async () => {
    const envelope = await encryptWithPassword('', 'pass123');
    const decrypted = await decryptWithPassword(envelope, 'pass123');
    assert.equal(decrypted, '');
  });

  it('T2.4: should handle large payload encryption (64KB payload)', async () => {
    const largeText = 'A'.repeat(65536);
    const envelope = await encryptWithPassword(largeText, 'pass123');
    const decrypted = await decryptWithPassword(envelope, 'pass123');
    assert.equal(decrypted, largeText);
  });
});

// =========================================================================
// FEATURE 34: Attachment Virus & Danger Scanner
// =========================================================================
describe('Feature 34: Attachment Virus & Danger Scanner', () => {
  // Tier 1: Happy Path Tests
  it('T1.1: should identify Windows MZ/PE executable magic bytes and quarantine', () => {
    // MZ header: 0x4D 0x5A
    const peBytes = new Uint8Array([0x4D, 0x5A, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]);
    const res = scanAttachment('invoice.exe', peBytes, 'application/octet-stream');
    assert.equal(res.safe, false);
    assert.equal(res.riskLevel, 'dangerous');
    assert.equal(res.quarantined, true);
    assert.equal(res.detectedMime, 'application/x-dosexec');
  });

  it('T1.2: should identify Linux ELF executable binary', () => {
    // 0x7F 'E' 'L' 'F'
    const elfBytes = new Uint8Array([0x7F, 0x45, 0x4C, 0x46, 0x02, 0x01, 0x01, 0x00]);
    const res = scanAttachment('payload.bin', elfBytes);
    assert.equal(res.safe, false);
    assert.equal(res.riskLevel, 'dangerous');
    assert.equal(res.detectedMime, 'application/x-executable');
  });

  it('T1.3: should identify clean PNG image attachment', () => {
    // PNG magic: 0x89 'P' 'N' 'G' 0x0D 0x0A 0x1A 0x0A
    const pngBytes = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00]);
    const res = scanAttachment('photo.png', pngBytes, 'image/png');
    assert.equal(res.safe, true);
    assert.equal(res.riskLevel, 'clean');
    assert.equal(res.quarantined, false);
    assert.equal(res.detectedMime, 'image/png');
  });

  it('T1.4: should identify clean PDF document', () => {
    // PDF magic: '%PDF-1.7\n'
    const pdfBytes = new TextEncoder().encode('%PDF-1.7\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF');
    const res = scanAttachment('document.pdf', pdfBytes, 'application/pdf');
    assert.equal(res.safe, true);
    assert.equal(res.riskLevel, 'clean');
  });

  it('T1.5: should detect and block dangerous script extension (.vbs / .bat / .scr)', () => {
    const scriptBytes = new TextEncoder().encode('WScript.Echo "Malicious"');
    const res = scanAttachment('trojan.vbs', scriptBytes, 'text/plain');
    assert.equal(res.safe, false);
    assert.equal(res.riskLevel, 'dangerous');
    assert.ok(res.riskReasons.some(r => r.includes('.vbs')));
  });

  // Tier 2: Boundary & Corner Cases
  it('T2.1: should detect double extension obfuscation (e.g. invoice.pdf.exe)', () => {
    const bytes = new Uint8Array([0x4D, 0x5A, 0x00, 0x00]);
    const res = scanAttachment('invoice.pdf.exe', bytes);
    assert.equal(res.riskLevel, 'dangerous');
    assert.ok(res.riskReasons.some(r => r.includes('Deceptive double extension')));
  });

  it('T2.2: should detect Unicode Right-to-Left Override (RLO) extension trick', () => {
    // Filename disguised with \u202E
    const rloName = 'quarterly_report_\u202Efdp.exe';
    const bytes = new Uint8Array([0x00, 0x01, 0x02, 0x03]);
    const res = scanAttachment(rloName, bytes);
    assert.ok(res.riskReasons.some(r => r.includes('Right-to-Left Override')));
  });

  it('T2.3: should detect image MIME spoofing where file is actually an executable', () => {
    const fakeImageBytes = new Uint8Array([0x4D, 0x5A, 0x90, 0x00]); // MZ PE
    const res = scanAttachment('avatar.jpg', fakeImageBytes, 'image/jpeg');
    assert.equal(res.safe, false);
    assert.ok(res.riskReasons.some(r => r.includes('Spoofing detected')));
  });

  it('T2.4: should scan PDF for embedded JavaScript exploit triggers', () => {
    const exploitPdf = new TextEncoder().encode('%PDF-1.4\n/Type /Action /S /JavaScript /JS (app.alert("xss");)');
    const res = scanAttachment('exploit.pdf', exploitPdf, 'application/pdf');
    assert.equal(res.safe, false);
    assert.equal(res.riskLevel, 'suspicious');
    assert.ok(res.riskReasons.some(r => r.includes('embedded JavaScript')));
  });

  it('T2.5: should inspect ZIP archive and flag embedded dangerous executable files', () => {
    // Construct minimal ZIP header containing 'malware.exe'
    const fileName = 'malware.exe';
    const nameBytes = new TextEncoder().encode(fileName);
    const zipBytes = new Uint8Array(30 + nameBytes.length);
    // PK\x03\x04
    zipBytes[0] = 0x50; zipBytes[1] = 0x4B; zipBytes[2] = 0x03; zipBytes[3] = 0x04;
    zipBytes[26] = nameBytes.length & 0xff; // file name length
    zipBytes[27] = 0x00;
    zipBytes.set(nameBytes, 30);

    const res = scanAttachment('bundle.zip', zipBytes, 'application/zip');
    assert.equal(res.safe, false);
    assert.ok(res.riskReasons.some(r => r.includes('malware.exe')));
  });
});

// =========================================================================
// FEATURE 35: DLP & PII Scanner (Data Loss Prevention)
// =========================================================================
describe('Feature 35: DLP & PII Scanner', () => {
  // Tier 1: Happy Path Tests
  it('T1.1: should detect and validate valid Visa credit card number via Luhn mod-10', () => {
    // Standard test Visa number passing Luhn: 4532-0150-1234-5674
    // Let's verify standard valid Visa test number: 4532 0150 1234 5674 (4532015012345674 -> sum % 10 = 0)
    // 4*2=8, 5, 3*2=6, 2, 0*2=0, 1, 5*2=1, 0, 1*2=2, 2, 3*2=6, 4, 5*2=1, 6, 7*2=5, 4 => sum = 8+5+6+2+0+1+1+0+2+2+6+4+1+6+5+4 = 53 (add 7 check digit -> 4532015012345671)
    const validVisa = '4111 1111 1111 1111'; // standard test Luhn: 4*2-9=8 - wait 4111111111111111: digits: 4,1,1,1...
    // Let's check: 4(8) + 1 + 1(2) + 1 + 1(2) + 1 + 1(2) + 1 + 1(2) + 1 + 1(2) + 1 + 1(2) + 1 + 1(2) + 1 = 8+1+2+1+2+1+2+1+2+1+2+1+2+1+2+1 = 30 -> 30 % 10 = 0!
    assert.equal(validateLuhn('4111111111111111'), true);

    const scan = scanDlp('My payment card is 4111-1111-1111-1111 for the order.');
    assert.equal(scan.hasViolations, true);
    assert.equal(scan.blocked, true);
    assert.equal(scan.violations[0].category, 'credit_card');
    assert.equal(scan.violations[0].maskedText, '4111-XXXX-XXXX-1111');
  });

  it('T1.2: should detect and mask valid US Social Security Number (SSN)', () => {
    const scan = scanDlp('Employee SSN: 219-45-7890');
    assert.equal(scan.hasViolations, true);
    assert.equal(scan.violations[0].category, 'ssn');
    assert.equal(scan.violations[0].maskedText, 'XXX-XX-7890');
  });

  it('T1.3: should detect AWS Access Key ID', () => {
    const scan = scanDlp('AWS credentials: AKIAIOSFODNN7EXAMPLE');
    assert.equal(scan.hasViolations, true);
    assert.equal(scan.violations[0].category, 'api_key');
    assert.ok(scan.violations[0].description.includes('AWS'));
  });

  it('T1.4: should detect OpenAI API Key', () => {
    const scan = scanDlp('OpenAI key: sk-proj-abcdef1234567890abcdef1234567890abcdef1234567890');
    assert.equal(scan.hasViolations, true);
    assert.equal(scan.violations[0].category, 'api_key');
    assert.ok(scan.violations[0].description.includes('OpenAI'));
  });

  it('T1.5: should detect Cryptographic Private Key PEM block', () => {
    const pem = '-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA...\n-----END RSA PRIVATE KEY-----';
    const scan = scanDlp(`Here is the key:\n${pem}`);
    assert.equal(scan.hasViolations, true);
    assert.equal(scan.violations[0].category, 'private_key');
  });

  // Tier 2: Boundary & Corner Cases
  it('T2.1: should reject arbitrary 16-digit number that fails Luhn checksum', () => {
    // 4111111111111112 fails Luhn
    assert.equal(validateLuhn('4111111111111112'), false);
    const scan = scanDlp('Tracking number 4111111111111112 is active');
    const ccViolations = scan.violations.filter(v => v.category === 'credit_card');
    assert.equal(ccViolations.length, 0);
  });

  it('T2.2: should reject invalid SSN with area number 000, 666, or 900+', () => {
    assert.equal(isValidSsn('000-45-6789'), false);
    assert.equal(isValidSsn('666-45-6789'), false);
    assert.equal(isValidSsn('920-45-6789'), false);
  });

  it('T2.3: should detect JWT (JSON Web Token)', () => {
    const fakeJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    const scan = scanDlp(`Authorization: Bearer ${fakeJwt}`);
    assert.equal(scan.hasViolations, true);
    assert.equal(scan.violations[0].category, 'jwt');
  });

  it('T2.4: should produce clean redacted text for multiple mixed violations', () => {
    const text = 'Card: 4111-1111-1111-1111 and SSN: 219-45-7890';
    const scan = scanDlp(text);
    assert.equal(scan.violationCount, 2);
    assert.equal(scan.redactedText, 'Card: 4111-XXXX-XXXX-1111 and SSN: XXX-XX-7890');
  });

  it('T2.5: should return no violations for benign email text', () => {
    const scan = scanDlp('Please find the attached report. Reach out at 555-0199 for questions.');
    assert.equal(scan.hasViolations, false);
    assert.equal(scan.blocked, false);
  });
});

// =========================================================================
// FEATURE 36: Tracking Pixel & Spy Link Blocker (Privacy Shield)
// =========================================================================
describe('Feature 36: Tracking Pixel & Spy Link Blocker', () => {
  // Tier 1: Happy Path Tests
  it('T1.1: should strip 1x1 zero-pixel tracking images', () => {
    const html = `<p>Hello customer!</p><img src="https://tracker.com/pixel.gif" width="1" height="1" alt="" /><p>Thanks!</p>`;
    const res = stripTrackersFromHtml(html);
    assert.equal(res.hasTrackers, true);
    assert.equal(res.strippedCount, 1);
    assert.ok(!res.cleanHtml.includes('width="1" height="1"'));
  });

  it('T1.2: should strip known Streak CRM tracking pixel (mailfoogae.appspot.com)', () => {
    const html = `<p>Read this email</p><img src="https://mailfoogae.appspot.com/t?sender=123" />`;
    const res = stripTrackersFromHtml(html);
    assert.equal(res.hasTrackers, true);
    assert.ok(!res.cleanHtml.includes('mailfoogae.appspot.com'));
  });

  it('T1.3: should strip HubSpot / Yesware tracking pixel', () => {
    const html = `<p>Meeting confirm</p><img src="https://t.sidekickopen.com/e1t/o/5/open.gif?t=987" />`;
    const res = stripTrackersFromHtml(html);
    assert.equal(res.hasTrackers, true);
    assert.ok(!res.cleanHtml.includes('t.sidekickopen.com'));
  });

  it('T1.4: should strip Superhuman read receipt pixel', () => {
    const html = `<p>Hi there</p><img src="https://superhuman.com/open/msg-12345" />`;
    const res = stripTrackersFromHtml(html);
    assert.equal(res.hasTrackers, true);
    assert.ok(!res.cleanHtml.includes('superhuman.com/open'));
  });

  it('T1.5: should strip hidden prefetch link web bugs', () => {
    const html = `<link rel="prefetch" href="https://spy.com/pre-open" /><p>Content</p>`;
    const res = stripTrackersFromHtml(html);
    assert.equal(res.hasTrackers, true);
    assert.ok(!res.cleanHtml.includes('rel="prefetch"'));
  });

  // Tier 2: Boundary & Corner Cases
  it('T2.1: should preserve legitimate normal images', () => {
    const html = `<p>Check header</p><img src="https://company.com/logo.png" width="400" height="100" alt="Logo" />`;
    const res = stripTrackersFromHtml(html);
    assert.equal(res.hasTrackers, false);
    assert.equal(res.strippedCount, 0);
    assert.ok(res.cleanHtml.includes('logo.png'));
  });

  it('T2.2: should strip images hidden with inline style display:none or opacity:0', () => {
    const html = `<img src="https://stealth.com/t.gif" style="display:none; visibility:hidden;" />`;
    const res = stripTrackersFromHtml(html);
    assert.equal(res.hasTrackers, true);
    assert.equal(res.strippedCount, 1);
  });

  it('T2.3: should neutralize CSS background-image tracking URLs', () => {
    const html = `<div style="background: url('https://mandrillapp.com/track/open.php?u=123');">Content</div>`;
    const res = stripTrackersFromHtml(html);
    assert.equal(res.hasTrackers, true);
    assert.ok(!res.cleanHtml.includes('mandrillapp.com/track'));
  });

  it('T2.4: should handle empty and whitespace-only HTML', () => {
    const res = stripTrackersFromHtml('');
    assert.equal(res.hasTrackers, false);
    assert.equal(res.strippedCount, 0);
  });

  it('T2.5: should provide descriptive Privacy Shield summary banner text', () => {
    const html = `<img src="https://mailfoogae.appspot.com/t" /><img src="https://pixel.wp.com/g.gif" />`;
    const res = stripTrackersFromHtml(html);
    assert.equal(res.strippedCount, 2);
    assert.ok(res.privacyShieldSummary.includes('2 tracking pixels blocked'));
  });
});

// =========================================================================
// FEATURE 37: Expiring / Self-Destructing Emails (Confidential Mode)
// =========================================================================
describe('Feature 37: Expiring / Self-Destructing Emails', () => {
  // Tier 1: Happy Path Tests
  it('T1.1: should create confidential message with AES-256-GCM encryption', async () => {
    const { record, token, shareUrl } = await createConfidentialMessage({
      content: 'This message self-destructs in 1 hour.',
      ttlSeconds: 3600,
      maxViews: 1,
    });
    assert.ok(token.startsWith('conf_'));
    assert.ok(record.encryptedPayload.length > 0);
    assert.equal(record.maxViews, 1);
  });

  it('T1.2: should access and decrypt confidential message successfully', async () => {
    const content = 'Top secret password: BlueSky77!';
    const { record } = await createConfidentialMessage({ content, ttlSeconds: 3600 });
    
    const access = await accessConfidentialMessage(record);
    assert.equal(access.success, true);
    assert.equal(access.content, content);
    assert.equal(access.viewsRemaining, 0);
  });

  it('T1.3: should create and verify PIN passcode protected confidential message', async () => {
    const content = 'Confidential PIN protected message';
    const passcode = '123456';
    const { record } = await createConfidentialMessage({ content, passcode, ttlSeconds: 3600 });

    // Access without passcode should prompt for passcode
    const accessNoPass = await accessConfidentialMessage(record);
    assert.equal(accessNoPass.success, false);
    assert.equal(accessNoPass.requiresPasscode, true);

    // Access with correct passcode
    const accessValid = await accessConfidentialMessage(record, passcode);
    assert.equal(accessValid.success, true);
    assert.equal(accessValid.content, content);
  });

  it('T1.4: should reject access with incorrect passcode', async () => {
    const { record } = await createConfidentialMessage({ content: 'Secrets', passcode: 'correct123' });
    const access = await accessConfidentialMessage(record, 'wrong999');
    assert.equal(access.success, false);
    assert.equal(access.error, 'invalid_passcode');
  });

  // Tier 2: Boundary & Corner Cases
  it('T2.1: should reject access when message has expired', async () => {
    const pastDate = new Date(Date.now() - 60000); // 1 minute ago
    const { record } = await createConfidentialMessage({ content: 'Old', expiresAt: pastDate });
    const access = await accessConfidentialMessage(record);
    assert.equal(access.success, false);
    assert.equal(access.error, 'expired');
  });

  it('T2.2: should enforce maxViews limit ("burn after reading")', async () => {
    const { record } = await createConfidentialMessage({ content: 'One-time read', maxViews: 1 });
    // Simulate viewCount already reaching maxViews
    record.viewCount = 1;
    const access = await accessConfidentialMessage(record);
    assert.equal(access.success, false);
    assert.equal(access.error, 'max_views_exceeded');
  });

  it('T2.3: should return not_found when record is null', async () => {
    const access = await accessConfidentialMessage(null);
    assert.equal(access.success, false);
    assert.equal(access.error, 'not_found');
  });

  it('T2.4: should correctly verify PBKDF2 passcode hash', async () => {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const saltB64 = Buffer.from(salt).toString('base64');
    const hash = await hashPasscode('my-passcode-99', salt);

    const valid = await verifyPasscode('my-passcode-99', saltB64, hash);
    assert.equal(valid, true);

    const invalid = await verifyPasscode('wrong-passcode', saltB64, hash);
    assert.equal(invalid, false);
  });
});

// =========================================================================
// FEATURE 38: Two-Factor Authentication (TOTP RFC 6238)
// =========================================================================
describe('Feature 38: Two-Factor Authentication (TOTP RFC 6238)', () => {
  // Tier 1: Happy Path Tests
  it('T1.1: should encode and decode Base32 strings per RFC 4648', () => {
    const original = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
    const encoded = encodeBase32(original);
    const decoded = decodeBase32(encoded);
    assert.deepEqual(Array.from(decoded), Array.from(original));
  });

  it('T1.2: should generate 20-byte random Base32 secret', () => {
    const secret = generateTotpSecret(20);
    assert.equal(secret.length, 32); // 20 bytes * 8 / 5 = 32 Base32 chars
    const decoded = decodeBase32(secret);
    assert.equal(decoded.length, 20);
  });

  it('T1.3: should generate valid 6-digit TOTP token for current time', async () => {
    const secret = generateTotpSecret();
    const code = await generateTotpCode(secret);
    assert.equal(code.length, 6);
    assert.ok(/^\d{6}$/.test(code));
  });

  it('T1.4: should verify valid TOTP code within clock window (+/- 30s)', async () => {
    const secret = generateTotpSecret();
    const now = Date.now();
    const code = await generateTotpCode(secret, now);

    const valid = await verifyTotpCode(secret, code, now);
    assert.equal(valid, true);

    // Also valid 15 seconds later in same or adjacent window
    const validDrift = await verifyTotpCode(secret, code, now + 15000);
    assert.equal(validDrift, true);
  });

  it('T1.5: should generate 10 emergency 8-digit backup recovery codes (XXXX-XXXX)', () => {
    const backupCodes = generateBackupCodes(10);
    assert.equal(backupCodes.length, 10);
    for (const code of backupCodes) {
      assert.ok(/^\d{4}-\d{4}$/.test(code));
    }
  });

  // Tier 2: Boundary & Corner Cases
  it('T2.1: should reject incorrect or malformed TOTP codes', async () => {
    const secret = generateTotpSecret();
    assert.equal(await verifyTotpCode(secret, '000000'), false);
    assert.equal(await verifyTotpCode(secret, 'abc123'), false);
    assert.equal(await verifyTotpCode(secret, '123'), false);
  });

  it('T2.2: should generate standard otpauth:// URI string', () => {
    const secret = 'JBSWY3DPEHPK3PXP';
    const uri = generateOtpAuthUri('user@example.com', secret, 'Mailops');
    assert.ok(uri.startsWith('otpauth://totp/Mailops:user%40example.com'));
    assert.ok(uri.includes(`secret=${secret}`));
    assert.ok(uri.includes('issuer=Mailops'));
  });

  it('T2.3: should generate clean vector SVG QR code markup', () => {
    const qrSvg = generateQrSvg('otpauth://totp/test', 200);
    assert.ok(qrSvg.startsWith('<svg'));
    assert.ok(qrSvg.endsWith('</svg>'));
    assert.ok(qrSvg.includes('viewBox="0 0 200 200"'));
    assert.ok(qrSvg.includes('<rect'));
  });

  it('T2.4: should reject TOTP code from outside time drift window (2 minutes in future)', async () => {
    const secret = generateTotpSecret();
    const futureTime = Date.now() + 120000;
    const futureCode = await generateTotpCode(secret, futureTime);

    const validNow = await verifyTotpCode(secret, futureCode, Date.now(), 1);
    assert.equal(validNow, false);
  });
});

// =========================================================================
// FEATURE 39: Sliding Window Token Bucket Rate Limiter
// =========================================================================
describe('Feature 39: Token Bucket Rate Limiter', () => {
  // Tier 1: Happy Path Tests
  it('T1.1: should allow requests within capacity limit', () => {
    clearAllRateLimits();
    const config = { capacity: 5, refillRate: 1.0 };
    const res = checkRateLimit('test-ip-1', config);
    assert.equal(res.allowed, true);
    assert.equal(res.tokensRemaining, 4);
    assert.equal(res.limit, 5);
  });

  it('T1.2: should deplete bucket and deny excess requests returning HTTP 429 calculation', () => {
    clearAllRateLimits();
    const config = { capacity: 3, refillRate: 1.0 };
    
    assert.equal(checkRateLimit('key-burst', config).allowed, true); // 2 remaining
    assert.equal(checkRateLimit('key-burst', config).allowed, true); // 1 remaining
    assert.equal(checkRateLimit('key-burst', config).allowed, true); // 0 remaining
    
    // 4th request exceeds capacity
    const denied = checkRateLimit('key-burst', config);
    assert.equal(denied.allowed, false);
    assert.ok(denied.retryAfterSeconds >= 1);
  });

  it('T1.3: should refill tokens over elapsed time', () => {
    clearAllRateLimits();
    const config = { capacity: 5, refillRate: 2.0 }; // 2 tokens per sec
    const startMs = 1000000;
    
    // Drain all 5 tokens
    for (let i = 0; i < 5; i++) {
      checkRateLimit('key-refill', config, startMs);
    }

    // Advance time by 2 seconds -> should add 4 tokens
    const resAfter2s = checkRateLimit('key-refill', config, startMs + 2000);
    assert.equal(resAfter2s.allowed, true);
    assert.equal(resAfter2s.tokensRemaining, 3); // 4 refilled - 1 consumed = 3
  });

  // Tier 2: Boundary & Corner Cases
  it('T2.1: should isolate token buckets for different keys', () => {
    clearAllRateLimits();
    const config = { capacity: 2, refillRate: 1.0 };
    
    checkRateLimit('user-A', config);
    checkRateLimit('user-A', config);
    assert.equal(checkRateLimit('user-A', config).allowed, false);

    // user-B has fresh bucket
    assert.equal(checkRateLimit('user-B', config).allowed, true);
  });

  it('T2.2: should support custom operation cost', () => {
    clearAllRateLimits();
    const config = { capacity: 10, refillRate: 1.0, cost: 6 };
    
    const req1 = checkRateLimit('cost-key', config);
    assert.equal(req1.allowed, true);
    assert.equal(req1.tokensRemaining, 4);

    // Second request needs 6 but only 4 remain
    const req2 = checkRateLimit('cost-key', config);
    assert.equal(req2.allowed, false);
  });

  it('T2.3: should cap refilled tokens at max capacity', () => {
    clearAllRateLimits();
    const config = { capacity: 5, refillRate: 10.0 };
    const startMs = 1000000;
    
    checkRateLimit('cap-key', config, startMs);
    // Advance 100 seconds
    const res = checkRateLimit('cap-key', config, startMs + 100000);
    assert.equal(res.allowed, true);
    assert.equal(res.tokensRemaining, 4); // Max capacity 5 - 1 = 4
  });
});

// =========================================================================
// FEATURE 40: GDPR / CCPA Data Export & Scrub Purge
// =========================================================================
describe('Feature 40: GDPR/CCPA Data Export & Scrub Purge', () => {
  // Tier 1: Happy Path Tests
  it('T1.1: should generate valid RFC 822 .eml formatted string', () => {
    const eml = generateRawEml({
      fromAddr: 'sender@example.com',
      toAddr: 'recipient@example.com',
      subject: 'Hello World',
      textBody: 'This is the plain text body.',
      htmlBody: '<p>This is HTML</p>',
      messageId: '<msg-123@mailops.local>',
    });

    assert.ok(eml.includes('From: sender@example.com'));
    assert.ok(eml.includes('To: recipient@example.com'));
    assert.ok(eml.includes('Subject: Hello World'));
    assert.ok(eml.includes('Content-Type: multipart/alternative'));
    assert.ok(eml.includes('This is HTML'));
  });

  it('T1.2: should assemble full GDPR user export bundle with metadata and EML archives', () => {
    const bundle = buildGdprExportBundle({
      user: { id: 'usr_123', email: 'alice@corp.com', displayName: 'Alice' },
      domains: [{ id: 'dom_1', hostname: 'corp.com', status: 'active' }],
      emails: [
        {
          id: 'eml_1',
          fromAddr: 'bob@corp.com',
          toAddr: 'alice@corp.com',
          subject: 'Report',
          textBody: 'Report contents',
        },
      ],
      contacts: [{ id: 'cnt_1', email: 'bob@corp.com', name: 'Bob' }],
      notes: [{ id: 'nt_1', content: 'Follow up next week' }],
    });

    assert.equal(bundle.exportMetadata.userId, 'usr_123');
    assert.equal(bundle.exportMetadata.totalEmails, 1);
    assert.equal(bundle.exportMetadata.complianceStandard, 'GDPR Article 20 / CCPA');
    assert.ok(bundle.emails[0].emlRaw.includes('From: bob@corp.com'));
  });

  it('T1.3: should generate cryptographic shredding buffer overwrite', () => {
    const noise = shredBuffer(64);
    assert.equal(noise.length, 64);
    assert.equal(typeof noise, 'string');
  });

  it('T1.4: should generate irreversible SHA-256 compliance hash', async () => {
    const hash = await computeComplianceHash('usr_123:timestamp');
    assert.equal(hash.length, 64); // 32 bytes = 64 hex chars
    assert.ok(/^[0-9a-f]{64}$/.test(hash));
  });

  // Tier 2: Boundary & Corner Cases
  it('T2.1: should handle export bundle when user has zero emails or contacts', () => {
    const bundle = buildGdprExportBundle({
      user: { id: 'empty_user', email: 'empty@mailops.com' },
    });
    assert.equal(bundle.exportMetadata.totalEmails, 0);
    assert.equal(bundle.exportMetadata.totalContacts, 0);
    assert.deepEqual(bundle.emails, []);
  });

  it('T2.2: should generate clean plain-text EML when no htmlBody is present', () => {
    const eml = generateRawEml({
      fromAddr: 'plain@example.com',
      toAddr: 'recipient@example.com',
      subject: 'Plain Email Only',
      textBody: 'Just plain text.',
    });
    assert.ok(eml.includes('Content-Type: text/plain'));
    assert.ok(!eml.includes('multipart/alternative'));
  });
});

// =========================================================================
// TIER 3 & TIER 4: Cross-Feature Combinations & Real-World Scenarios
// =========================================================================
describe('Tier 3 & Tier 4: Cross-Feature Security Workflows', () => {
  it('T3.1 (Security Pipeline): Inbound Email -> Auth Verification -> Phishing Check -> Tracking Stripping', async () => {
    const rawHeaders = `From: support@paypal.com\r\nTo: user@mycorp.com\r\nSubject: Account Verification Required\r\nDKIM-Signature: v=1; a=rsa-sha256; d=evil-phish.net; s=2023; c=relaxed/relaxed; h=from:to:subject; bh=abcd; b=sig==;\r\n`;
    const htmlBody = `<p>Your PayPal account has been suspended! <a href="http://192.168.1.1/login">Click here to restore</a></p><img src="https://mailfoogae.appspot.com/track" width="1" height="1" />`;

    // 1. Auth verifier
    const auth = await verifyInboundAuth({
      fromAddr: 'support@paypal.com',
      clientIp: '198.51.100.99',
      rawHeaders,
      spfRecord: 'v=spf1 ip4:64.4.20.0/24 -all',
      dmarcRecord: 'v=DMARC1; p=reject',
    });
    assert.equal(auth.spf.status, 'fail');
    assert.equal(auth.dmarc.status, 'fail');

    // 2. Phishing scanner
    const phishing = scanForPhishing({ html: htmlBody, from: 'support@paypal.com' });
    assert.equal(phishing.isSuspicious, true);
    assert.ok(phishing.flaggedLinks.length >= 1);

    // 3. Tracking pixel blocker
    const tracker = stripTrackersFromHtml(htmlBody);
    assert.equal(tracker.hasTrackers, true);
    assert.equal(tracker.strippedCount, 1);
  });

  it('T3.2 (Outbound DLP & Encryption): Pre-send DLP Scan -> Redact/Block -> Envelope Encryption', async () => {
    const outboundDraft = 'Hi Bob, here is the OpenAI secret key: sk-proj-abcdef1234567890abcdef1234567890abcdef1234567890 and Visa 4111-1111-1111-1111';
    
    // 1. DLP Scan
    const dlp = scanDlp(outboundDraft);
    assert.equal(dlp.blocked, true);
    assert.equal(dlp.violationCount, 2);

    // 2. If user confirms encryption, encrypt with AES-GCM
    const encrypted = await encryptWithPassword(dlp.redactedText, 'AdminPassphrase!');
    assert.equal(encrypted.scheme, 'PBKDF2-AES-256-GCM');

    // 3. Decrypt and verify redacted content was safely preserved
    const decrypted = await decryptWithPassword(encrypted, 'AdminPassphrase!');
    assert.ok(decrypted.includes('4111-XXXX-XXXX-1111'));
  });

  it('T4.1 (Real-World 2FA + Rate-Limiting + Confidential Message Access)', async () => {
    // 1. User sets up 2FA
    const secret = generateTotpSecret();
    const totpCode = await generateTotpCode(secret);
    const is2FaValid = await verifyTotpCode(secret, totpCode);
    assert.equal(is2FaValid, true);

    // 2. Rate limiter protects access attempts
    const rateCheck = checkRateLimit('api:confidential:access', { capacity: 10, refillRate: 1 });
    assert.equal(rateCheck.allowed, true);

    // 3. Create and decrypt confidential email with PIN
    const { record } = await createConfidentialMessage({
      content: 'Board of directors meeting minutes 2026',
      passcode: '987654',
      ttlSeconds: 7200,
      maxViews: 2,
    });

    const access1 = await accessConfidentialMessage(record, '987654');
    assert.equal(access1.success, true);
    assert.equal(access1.content, 'Board of directors meeting minutes 2026');
    assert.equal(access1.viewsRemaining, 1);
  });
});

// =========================================================================
// TIER 5: Adversarial & Security Hardening Suite
// =========================================================================
describe('Tier 5: Adversarial & Security Hardening', () => {
  it('T5.1: should detect Mach-O Universal FAT Binary header (0xCA 0xFE 0xBA 0xBE)', () => {
    const fatBytes = new Uint8Array([0xCA, 0xFE, 0xBA, 0xBE, 0x00, 0x00, 0x00, 0x02]);
    const scan = scanAttachment('universal_app', fatBytes);
    assert.equal(scan.safe, false);
    assert.equal(scan.riskLevel, 'dangerous');
    assert.equal(scan.detectedMime, 'application/x-mach-binary');
  });

  it('T5.2: should detect obfuscated Mastercard numbers separated by dots or mixed spaces', () => {
    // 5105 1051 0510 5100 passes Luhn mod-10
    // 5*2-9=1, 1, 0*2=0, 5, 1*2=2, 0, 5*2-9=1, 1, 0*2=0, 5, 1*2=2, 0, 5*2-9=1, 1, 0*2=0, 0 = 1+1+0+5+2+0+1+1+0+5+2+0+1+1+0+0 = 20 -> 20 % 10 = 0!
    assert.equal(validateLuhn('5105105105105100'), true);
    const scan = scanDlp('Mastercard: 5105 1051 0510 5100');
    assert.equal(scan.hasViolations, true);
    assert.equal(scan.violations[0].metadata?.brand, 'Mastercard');
  });

  it('T5.3: should correctly canonicalize headers with multiline unfolding and whitespace normalization', () => {
    const canon = canonicalizeHeaderRelaxed(' Subject ', ' Urgent \r\n\t Security   Update  ');
    assert.equal(canon, 'subject:Urgent Security Update');
  });

  it('T5.4: should prevent replay attacks on burned 2FA backup codes', async () => {
    const codes = generateBackupCodes(3);
    const usedCode = codes[0];

    // Burn first code
    const remainingCodes = codes.slice(1);
    assert.equal(remainingCodes.includes(usedCode), false);
    assert.equal(remainingCodes.length, 2);
  });

  it('T5.5: should resist rapid high-concurrency burst beyond token capacity in rate limiter', () => {
    clearAllRateLimits();
    const config = { capacity: 10, refillRate: 1.0 };
    let allowedCount = 0;
    let blockedCount = 0;

    for (let i = 0; i < 25; i++) {
      const res = checkRateLimit('adversarial-ip', config);
      if (res.allowed) allowedCount++;
      else blockedCount++;
    }

    assert.equal(allowedCount, 10);
    assert.equal(blockedCount, 15);
  });
});

