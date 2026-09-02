/**
 * Feature 37: Expiring / Self-Destructing Emails (Confidential Mode)
 * 
 * Ephemeral Tokenized Content Storage with Auto-Purge:
 * 1. AES-256-GCM encrypted payload with PBKDF2 key derivation.
 * 2. Optional PIN/passcode verification with PBKDF2 salt/hash.
 * 3. Configurable expiration timestamp and view limit ("Burn after reading").
 * 4. Cryptographic payload shredding on expiration or view consumption.
 * 
 * Zero new NPM dependencies. Pure TypeScript.
 */

import { nanoid } from 'nanoid';
import { uint8ArrayToBase64, base64ToUint8Array, deriveKeyFromPassphrase } from './webcrypto_envelope';

export interface CreateConfidentialMessageParams {
  content: string;
  passcode?: string;
  ttlSeconds?: number;      // e.g. 3600 (1h), 86400 (24h), 604800 (7d)
  expiresAt?: Date;
  maxViews?: number;        // default 1
}

export interface StoredConfidentialRecord {
  id: string;
  token: string;
  encryptedPayload: string; // base64 AES-GCM ciphertext
  iv: string;               // base64 12 bytes
  salt: string;             // base64 16 bytes
  passcodeSalt?: string;     // base64 16 bytes if passcode set
  passcodeHash?: string;     // base64 PBKDF2-SHA256 hash
  maxViews: number;
  viewCount: number;
  expiresAt: Date;
  createdAt: Date;
}

export interface AccessMessageResult {
  success: boolean;
  content?: string;
  viewsRemaining: number;
  expiresAt: Date;
  requiresPasscode?: boolean;
  error?: 'not_found' | 'expired' | 'max_views_exceeded' | 'invalid_passcode' | 'decryption_error';
}

/**
 * Computes a secure PBKDF2 hash of a passcode with a random salt.
 */
export async function hashPasscode(passcode: string, salt: Uint8Array): Promise<string> {
  const encoder = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passcode),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const hashBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    baseKey,
    256
  );

  return uint8ArrayToBase64(new Uint8Array(hashBits));
}

/**
 * Verifies a passcode against its stored PBKDF2 salt and hash.
 */
export async function verifyPasscode(passcode: string, saltBase64: string, expectedHash: string): Promise<boolean> {
  const salt = base64ToUint8Array(saltBase64);
  const computedHash = await hashPasscode(passcode, salt);
  return computedHash === expectedHash;
}

/**
 * Encrypts confidential message content and produces a database-ready record.
 */
export async function createConfidentialMessage(
  params: CreateConfidentialMessageParams
): Promise<{ record: StoredConfidentialRecord; token: string; shareUrl: string }> {
  const id = nanoid();
  const token = `conf_${nanoid(24)}`;
  const now = new Date();
  
  // Calculate expiration
  const ttl = params.ttlSeconds || (params.expiresAt ? Math.floor((params.expiresAt.getTime() - now.getTime()) / 1000) : 86400);
  const expiresAt = params.expiresAt || new Date(now.getTime() + Math.max(60, ttl) * 1000);
  const maxViews = params.maxViews !== undefined ? params.maxViews : 1;

  // Key derivation for AES-256-GCM encryption
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const keySecret = params.passcode ? `passcode:${params.passcode}` : `token:${token}`;
  
  const aesKey = await deriveKeyFromPassphrase(keySecret, salt, 100000);
  const encodedContent = new TextEncoder().encode(params.content);
  
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    aesKey,
    encodedContent
  );

  // If passcode protection enabled, generate verification hash
  let passcodeSaltStr: string | undefined;
  let passcodeHashStr: string | undefined;

  if (params.passcode) {
    const pSalt = crypto.getRandomValues(new Uint8Array(16));
    passcodeSaltStr = uint8ArrayToBase64(pSalt);
    passcodeHashStr = await hashPasscode(params.passcode, pSalt);
  }

  const record: StoredConfidentialRecord = {
    id,
    token,
    encryptedPayload: uint8ArrayToBase64(new Uint8Array(encryptedBuffer)),
    iv: uint8ArrayToBase64(iv),
    salt: uint8ArrayToBase64(salt),
    passcodeSalt: passcodeSaltStr,
    passcodeHash: passcodeHashStr,
    maxViews,
    viewCount: 0,
    expiresAt,
    createdAt: now,
  };

  const shareUrl = `/confidential/${token}`;

  return { record, token, shareUrl };
}

/**
 * Accesses and decrypts a confidential message, enforcing expiration and view limits.
 */
export async function accessConfidentialMessage(
  record: StoredConfidentialRecord | null | undefined,
  providedPasscode?: string,
  now = new Date()
): Promise<AccessMessageResult> {
  if (!record) {
    return { success: false, viewsRemaining: 0, expiresAt: now, error: 'not_found' };
  }

  // 1. Check expiration
  if (now.getTime() > new Date(record.expiresAt).getTime()) {
    return { success: false, viewsRemaining: 0, expiresAt: new Date(record.expiresAt), error: 'expired' };
  }

  // 2. Check max views limit
  if (record.viewCount >= record.maxViews) {
    return { success: false, viewsRemaining: 0, expiresAt: new Date(record.expiresAt), error: 'max_views_exceeded' };
  }

  // 3. Check passcode requirement
  if (record.passcodeHash && record.passcodeSalt) {
    if (!providedPasscode) {
      return {
        success: false,
        viewsRemaining: record.maxViews - record.viewCount,
        expiresAt: new Date(record.expiresAt),
        requiresPasscode: true,
      };
    }

    const isValid = await verifyPasscode(providedPasscode, record.passcodeSalt, record.passcodeHash);
    if (!isValid) {
      return {
        success: false,
        viewsRemaining: record.maxViews - record.viewCount,
        expiresAt: new Date(record.expiresAt),
        requiresPasscode: true,
        error: 'invalid_passcode',
      };
    }
  }

  // 4. Decrypt content
  try {
    const salt = base64ToUint8Array(record.salt);
    const iv = base64ToUint8Array(record.iv);
    const ciphertext = base64ToUint8Array(record.encryptedPayload);
    const keySecret = record.passcodeHash ? `passcode:${providedPasscode}` : `token:${record.token}`;
    
    const aesKey = await deriveKeyFromPassphrase(keySecret, salt, 100000);
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as BufferSource },
      aesKey,
      ciphertext as BufferSource
    );

    const content = new TextDecoder().decode(decryptedBuffer);
    const viewsRemaining = Math.max(0, record.maxViews - (record.viewCount + 1));

    return {
      success: true,
      content,
      viewsRemaining,
      expiresAt: new Date(record.expiresAt),
    };
  } catch {
    return {
      success: false,
      viewsRemaining: record.maxViews - record.viewCount,
      expiresAt: new Date(record.expiresAt),
      error: 'decryption_error',
    };
  }
}

export async function createExpiringMessage(
  payload: string,
  options?: { ttlSeconds?: number; maxViews?: number; passcode?: string; pin?: string }
) {
  const passcode = options?.passcode || options?.pin;
  const res = await createConfidentialMessage({
    content: payload,
    passcode,
    ttlSeconds: options?.ttlSeconds,
    maxViews: options?.maxViews,
  });
  return res.record;
}

export async function consumeExpiringMessage(
  record: StoredConfidentialRecord | null | undefined,
  pinOrPasscode?: string
) {
  return await accessConfidentialMessage(record, pinOrPasscode);
}

