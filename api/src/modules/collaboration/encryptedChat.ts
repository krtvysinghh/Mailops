/**
 * E2E Encrypted Team Messaging
 * 
 * Provides secure, encrypted channels for team collaboration.
 * Uses AES-256-GCM for symmetric encryption of messages.
 */

import { randomBytes, createCipheriv, createDecipheriv, scryptSync } from 'crypto';

export interface ChatChannel {
  id: string;
  name: string;
  memberIds: string[];
  created: Date;
}

export interface EncryptedMessage {
  id: string;
  channelId: string;
  senderId: string;
  ciphertext: string; // Base64
  iv: string;         // Base64
  authTag: string;    // Base64
  timestamp: Date;
}

// In-memory store for demonstration
const channelsStore = new Map<string, ChatChannel>();
const messagesStore = new Map<string, EncryptedMessage[]>();

// Algorithm configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

/**
 * Creates a new encrypted chat channel
 */
export function createChannel(name: string, memberIds: string[]): ChatChannel {
  const channel: ChatChannel = {
    id: generateId(),
    name,
    memberIds,
    created: new Date()
  };
  
  channelsStore.set(channel.id, channel);
  messagesStore.set(channel.id, []);
  
  return channel;
}

/**
 * Gets messages for a channel
 */
export function getMessages(channelId: string): EncryptedMessage[] {
  return messagesStore.get(channelId) || [];
}

/**
 * Derives a 32-byte symmetric key from a shared secret (e.g., from DH key exchange)
 * using scrypt. In a real E2E system, key derivation happens on the client.
 * This is provided for server-side testing/mocking.
 */
export function deriveKey(sharedSecret: string, salt: string): Buffer {
  return scryptSync(sharedSecret, salt, KEY_LENGTH);
}

/**
 * Encrypts and sends a message to a channel
 * 
 * Note: In true E2E, this encryption happens on the client before sending.
 * This function simulates the client encryption + server receive process.
 */
export function sendMessage(
  channelId: string, 
  senderId: string, 
  text: string, 
  encryptionKey: Buffer
): EncryptedMessage {
  
  if (!channelsStore.has(channelId)) {
    throw new Error('Channel not found');
  }

  // 1. Generate random IV (Initialization Vector)
  const iv = randomBytes(IV_LENGTH);
  
  // 2. Create cipher instance
  const cipher = createCipheriv(ALGORITHM, encryptionKey, iv);
  
  // 3. Encrypt the text
  let encrypted = cipher.update(text, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  
  // 4. Get authentication tag (ensures data hasn't been tampered with)
  const authTag = cipher.getAuthTag();
  
  // 5. Construct the message record
  const message: EncryptedMessage = {
    id: generateId(),
    channelId,
    senderId,
    ciphertext: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    timestamp: new Date()
  };
  
  // 6. Store on server
  const channelMessages = messagesStore.get(channelId) || [];
  channelMessages.push(message);
  messagesStore.set(channelId, channelMessages);
  
  return message;
}

/**
 * Decrypts a message
 * 
 * Note: In true E2E, this happens exclusively on the client.
 */
export function decryptMessage(
  message: EncryptedMessage, 
  decryptionKey: Buffer
): string {
  try {
    // 1. Decode base64 components
    const iv = Buffer.from(message.iv, 'base64');
    const authTag = Buffer.from(message.authTag, 'base64');
    const encryptedText = Buffer.from(message.ciphertext, 'base64');
    
    // 2. Create decipher instance
    const decipher = createDecipheriv(ALGORITHM, decryptionKey, iv);
    
    // 3. Set the auth tag for verification
    decipher.setAuthTag(authTag);
    
    // 4. Decrypt
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString('utf8');
  } catch (error) {
    throw new Error('Decryption failed. Invalid key or tampered message.');
  }
}

/**
 * Helper to generate unique IDs
 */
function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

// ---------------------------------------------------------
// E2E Architecture Notes:
// ---------------------------------------------------------
// 1. Clients generate X25519 keypairs. Public keys are stored on server.
// 2. When Client A wants to message Client B, A fetches B's public key.
// 3. A performs ECDH (Elliptic Curve Diffie-Hellman) with A's private key and B's public key to get a Shared Secret.
// 4. A derives an AES symmetric key from the Shared Secret (e.g., HKDF or scrypt).
// 5. A encrypts message with AES key, sends ciphertext to Server.
// 6. B fetches ciphertext.
// 7. B performs ECDH with B's private key and A's public key -> same Shared Secret -> same AES key.
// 8. B decrypts the ciphertext.
// Server NEVER sees the plaintext or the keys.
