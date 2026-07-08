import { and, eq } from 'drizzle-orm';
import type { EncryptedSecret } from '../../credentials/crypto.js';
import type { Database } from '../client.js';
import { credentials } from '../schema.js';

export class CredentialsRepo {
  constructor(private readonly db: Database) {}

  async upsertSecret(accountId: string, kind: string, secret: EncryptedSecret) {
    const existing = await this.findSecret(accountId, kind);
    const values = {
      accountId,
      kind,
      ciphertext: secret.ciphertext,
      iv: secret.iv,
      authTag: secret.authTag,
      keyVersion: secret.keyVersion,
      updatedAt: new Date(),
    };

    if (existing) {
      const [updated] = await this.db
        .update(credentials)
        .set(values)
        .where(eq(credentials.id, existing.id))
        .returning();
      return updated;
    }

    const [created] = await this.db.insert(credentials).values(values).returning();
    return created;
  }

  async findSecret(accountId: string, kind: string) {
    const [secret] = await this.db
      .select()
      .from(credentials)
      .where(and(eq(credentials.accountId, accountId), eq(credentials.kind, kind)))
      .limit(1);
    return secret ?? null;
  }
}
