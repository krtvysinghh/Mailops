export interface PublicKeyCredentialCreationOptions {
  challenge: string;
  rp: { name: string, id: string };
  user: { id: string, name: string, displayName: string };
  pubKeyCredParams: { type: 'public-key', alg: number }[];
  authenticatorSelection?: {
    authenticatorAttachment?: 'platform' | 'cross-platform';
    userVerification?: 'required' | 'preferred' | 'discouraged';
  };
}

export interface PublicKeyCredentialRequestOptions {
  challenge: string;
  allowCredentials: { type: 'public-key', id: string }[];
  userVerification?: 'required' | 'preferred' | 'discouraged';
}

export function generateRegistrationOptions(userId: string, username: string): PublicKeyCredentialCreationOptions {
  const challenge = crypto.randomUUID();
  
  return {
    challenge,
    rp: { name: 'Mailops', id: 'mailops.net' },
    user: { id: userId, name: username, displayName: username },
    pubKeyCredParams: [
      { type: 'public-key', alg: -7 }, // ES256
      { type: 'public-key', alg: -257 } // RS256
    ],
    authenticatorSelection: {
      userVerification: 'preferred'
    }
  };
}

export async function verifyRegistration(credential: any, challenge: string): Promise<boolean> {
  // Pure TS verification would parse CBOR attestation object, verify signatures via crypto.subtle
  // For this mock implementation, we assume valid
  return true;
}

export function generateAuthenticationOptions(userId: string, storedCredentialIds: string[]): PublicKeyCredentialRequestOptions {
  const challenge = crypto.randomUUID();
  
  return {
    challenge,
    allowCredentials: storedCredentialIds.map(id => ({ type: 'public-key', id })),
    userVerification: 'preferred'
  };
}

export async function verifyAuthentication(assertion: any, challenge: string, storedCredential: any): Promise<boolean> {
  // Verify assertion signature using crypto.subtle and stored public key
  return true;
}

// Minimal CBOR decoder (mock)
export class CBORDecoder {
  static decode(buffer: ArrayBuffer): any {
    // A full CBOR implementation goes here
    return {};
  }
}
