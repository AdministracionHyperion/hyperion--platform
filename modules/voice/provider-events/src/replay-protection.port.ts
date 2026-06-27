export interface ReplayProtectionPort {
  remember(key: string, ttlMs: number): void;
  hasSeen(key: string): boolean;
  clear(): void;
}
