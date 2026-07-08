import { eq } from 'drizzle-orm';
import type { EncryptedSecret } from '../../credentials/crypto.js';
import type { Database } from '../client.js';
import { notificationChannels } from '../schema.js';

export class NotificationsRepo {
  constructor(private readonly db: Database) {}

  async add(accountId: string, type: string, encryptedUrl: EncryptedSecret) {
    const [channel] = await this.db
      .insert(notificationChannels)
      .values({ accountId, type, encryptedUrl })
      .returning();
    return channel;
  }

  async listByAccount(accountId: string) {
    return this.db
      .select()
      .from(notificationChannels)
      .where(eq(notificationChannels.accountId, accountId));
  }

  async remove(id: string) {
    await this.db.delete(notificationChannels).where(eq(notificationChannels.id, id));
  }
}
