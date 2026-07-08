import { describe, expect, test } from 'vitest';
import { decryptSecret, encryptSecret } from '../../src/credentials/crypto.js';

const key = Buffer.alloc(32, 7);
const otherKey = Buffer.alloc(32, 8);

describe('credential crypto', () => {
  test('encrypts and decrypts a secret', () => {
    const encrypted = encryptSecret('beijing-password', key);
    expect(encrypted.ciphertext).not.toContain('beijing-password');
    expect(decryptSecret(encrypted, key)).toBe('beijing-password');
  });

  test('uses a different iv for each encryption', () => {
    const one = encryptSecret('same', key);
    const two = encryptSecret('same', key);
    expect(one.iv).not.toBe(two.iv);
    expect(one.ciphertext).not.toBe(two.ciphertext);
  });

  test('rejects decryption with the wrong key', () => {
    const encrypted = encryptSecret('secret', key);
    expect(() => decryptSecret(encrypted, otherKey)).toThrow();
  });
});
