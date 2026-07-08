export class LockService {
  private readonly lockedAccounts = new Set<string>();

  acquire(accountId: string): boolean {
    if (this.lockedAccounts.has(accountId)) return false;
    this.lockedAccounts.add(accountId);
    return true;
  }

  release(accountId: string): void {
    this.lockedAccounts.delete(accountId);
  }
}
