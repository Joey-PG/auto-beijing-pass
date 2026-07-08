import type { CredentialService } from '../credentials/credential-service.js';
import type { EncryptedSecret } from '../credentials/crypto.js';
import type { NotificationsRepo } from '../database/repositories/notifications.repo.js';
import { redactNotificationUrl } from '../output/redaction.js';
import { notify, testNotify } from './notifier.js';

export class NotificationService {
  constructor(
    private readonly notificationsRepo: NotificationsRepo,
    private readonly credentialService: CredentialService,
  ) {}

  async add(accountId: string, url: string) {
    const scheme = url.split('://')[0] || 'unknown';
    return this.notificationsRepo.add(accountId, scheme, this.credentialService.encrypt(url));
  }

  async list(accountId: string) {
    const channels = await this.notificationsRepo.listByAccount(accountId);
    return channels.map((channel) => ({
      id: channel.id,
      accountId: channel.accountId,
      type: channel.type,
      enabled: channel.enabled,
      url: redactNotificationUrl(this.credentialService.decrypt(channel.encryptedUrl as EncryptedSecret)),
    }));
  }

  async send(accountId: string, title: string, body: string) {
    const urls = await this.getEnabledUrls(accountId);
    return notify(urls, title, body);
  }

  async test(accountId: string) {
    const urls = await this.getEnabledUrls(accountId);
    return testNotify(urls);
  }

  private async getEnabledUrls(accountId: string): Promise<string[]> {
    const channels = await this.notificationsRepo.listByAccount(accountId);
    return channels
      .filter((channel) => channel.enabled)
      .map((channel) => this.credentialService.decrypt(channel.encryptedUrl as EncryptedSecret));
  }
}
