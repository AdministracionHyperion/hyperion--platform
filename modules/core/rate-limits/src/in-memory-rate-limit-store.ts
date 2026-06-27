import type { RateLimitStorePort } from "./rate-limit-store.port";
import type { RateLimitWindow } from "./rate-limit-window";

interface MutableWindow {
  count: number;
  resetAt: Date;
}

export class InMemoryRateLimitStore implements RateLimitStorePort {
  private readonly windows = new Map<string, MutableWindow>();

  async increment(key: string, windowMs: number): Promise<RateLimitWindow> {
    const now = Date.now();
    const current = this.windows.get(key);
    if (!current || current.resetAt.getTime() <= now) {
      const next = { count: 1, resetAt: new Date(now + windowMs) };
      this.windows.set(key, next);
      return next;
    }

    current.count += 1;
    return { count: current.count, resetAt: current.resetAt };
  }

  async reset(key: string): Promise<void> {
    this.windows.delete(key);
  }

  snapshot(): readonly (RateLimitWindow & { readonly key: string })[] {
    return [...this.windows.entries()].map(([key, window]) => ({
      key,
      count: window.count,
      resetAt: window.resetAt,
    }));
  }

  clear(): void {
    this.windows.clear();
  }
}
