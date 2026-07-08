import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

export type EncryptedSecret = {
  ciphertext: string;
  iv: string;
  authTag: string;
  keyVersion: number;
};

export function encryptSecret(plaintext: string, key: Buffer, keyVersion = 1): EncryptedSecret {
  assertKey(key);
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    ciphertext: ciphertext.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    keyVersion,
  };
}

export function decryptSecret(secret: EncryptedSecret, key: Buffer): string {
  assertKey(key);
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(secret.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(secret.authTag, 'base64'));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(secret.ciphertext, 'base64')),
    decipher.final(),
  ]);
  return plaintext.toString('utf8');
}

function assertKey(key: Buffer): void {
  if (key.byteLength !== 32) {
    throw new Error('AES-256-GCM key must be 32 bytes');
  }
}
