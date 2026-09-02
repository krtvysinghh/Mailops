import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  evaluateSpf,
  parseDkimHeader,
  scanForPhishing,
  detectHomographDomain,
  evaluateLinkDeception,
  encryptWithPassword,
  decryptWithPassword,
  scanAttachment,
  validateLuhn,
  isValidSsn,
  scanDlp,
  stripTrackersFromHtml,
  createConfidentialMessage,
  accessConfidentialMessage,
  encodeBase32,
  decodeBase32,
  generateTotpSecret,
  generateTotpCode,
  verifyTotpCode,
  generateBackupCodes,
  generateQrSvg,
  checkRateLimit,
  generateRawEml,
  buildGdprExportBundle,
} from '../../../api/src/modules/security';

describe('Web Security Components & Client Cryptography Suite', () => {
  it('should test client-side Web Crypto AES-256-GCM encryption for EncryptedMailViewer', async () => {
    const text = 'Patient medical diagnosis code: DX-9821';
    const pwd = 'ClinicSecretPassword123!';
    const envelope = await encryptWithPassword(text, pwd);
    assert.equal(envelope.scheme, 'PBKDF2-AES-256-GCM');

    const decrypted = await decryptWithPassword(envelope, pwd);
    assert.equal(decrypted, text);
  });

  it('should test client-side confidential message creation and access for ConfidentialComposeModal', async () => {
    const { record, token } = await createConfidentialMessage({
      content: 'Expiring invoice #901',
      passcode: '8821',
      ttlSeconds: 3600,
    });
    assert.ok(token.startsWith('conf_'));

    const res = await accessConfidentialMessage(record, '8821');
    assert.equal(res.success, true);
    assert.equal(res.content, 'Expiring invoice #901');
  });

  it('should test TOTP secret and SVG QR Code generator for TwoFactorSetupModal', async () => {
    const secret = generateTotpSecret();
    assert.equal(secret.length, 32);

    const qrSvg = generateQrSvg('otpauth://totp/Mailops:test@mailops.com?secret=' + secret, 180);
    assert.ok(qrSvg.includes('<svg'));
    assert.ok(qrSvg.includes('viewBox="0 0 180 180"'));

    const code = await generateTotpCode(secret);
    assert.equal(code.length, 6);
    assert.equal(await verifyTotpCode(secret, code), true);
  });

  it('should test pre-send DLP validation for DlpWarningModal', () => {
    const draft = 'Here is the company card: 4111-1111-1111-1111';
    const scan = scanDlp(draft);
    assert.equal(scan.blocked, true);
    assert.equal(scan.violations.length, 1);
    assert.equal(scan.violations[0].maskedText, '4111-XXXX-XXXX-1111');
  });

  it('should test Privacy Shield tracking stripper for TrackingShieldBadge', () => {
    const html = `<p>Newsletter</p><img src="https://mailfoogae.appspot.com/track" width="1" height="1" />`;
    const res = stripTrackersFromHtml(html);
    assert.equal(res.hasTrackers, true);
    assert.equal(res.strippedCount, 1);
    assert.ok(!res.cleanHtml.includes('mailfoogae.appspot.com'));
  });

  it('should test phishing link detector for PhishingWarningBanner', () => {
    const fake = 'http://192.168.1.1/login';
    const deception = evaluateLinkDeception(fake, 'Router Admin Login');
    assert.ok(deception);
    assert.equal(deception.severity, 'high');
  });

  it('should test attachment magic byte validator for AttachmentScannerChip', () => {
    const exe = new Uint8Array([0x4D, 0x5A, 0x90, 0x00]);
    const scan = scanAttachment('invoice.exe', exe);
    assert.equal(scan.quarantined, true);
    assert.equal(scan.safe, false);
  });

  it('should test rate limit calculation for RateLimitToast countdown', () => {
    const res = checkRateLimit('client-toast-test', { capacity: 1, refillRate: 1 });
    assert.equal(res.allowed, true);

    const secondReq = checkRateLimit('client-toast-test', { capacity: 1, refillRate: 1 });
    assert.equal(secondReq.allowed, false);
    assert.ok(secondReq.retryAfterSeconds >= 1);
  });

  it('should test GDPR data export bundle generator for GdprExportCard', () => {
    const bundle = buildGdprExportBundle({
      user: { id: 'usr_client', email: 'user@mailops.com' },
      emails: [{ id: '1', fromAddr: 'a@b.com', toAddr: 'user@mailops.com', subject: 'Hi' }],
    });
    assert.equal(bundle.exportMetadata.userId, 'usr_client');
    assert.equal(bundle.emails.length, 1);
  });
});
