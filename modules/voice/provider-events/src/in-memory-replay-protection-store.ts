import type { ReplayProtectionPort } from "./replay-protection.port";

export class InMemoryReplayProtectionStore implements ReplayProtectionPort {
  private readonly entries = new Map<string, number>();

  remember(key: string, ttlMs: number): void {
    this.entries.set(key, Date.now() + ttlMs);
  }

  hasSeen(key: string): boolean {
    const expiresAt = this.entries.get(key);
    if (!expiresAt) {
      return false;
    }
    if (Date.now() > expiresAt) {
      this.entries.delete(key);
      return false;
    }
    return true;
  }

  clear(): void {
    this.entries.clear();
  }
}
