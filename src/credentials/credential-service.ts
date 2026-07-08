import { decryptSecret, encryptSecret, type EncryptedSecret } from './crypto.js';

export class CredentialService {
  constructor(private readonly key: Buffer) {}

  encrypt(value: string): EncryptedSecret {
    return encryptSecret(value, this.key);
  }

  decrypt(secret: EncryptedSecret): string {
    return decryptSecret(secret, this.key);
  }
}
