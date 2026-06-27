import type { RateLimitWindow } from "./rate-limit-window";

export interface RateLimitStorePort {
  increment(key: string, windowMs: number): Promise<RateLimitWindow>;
  reset(key: string): Promise<void>;
  snapshot(): readonly (RateLimitWindow & { readonly key: string })[];
  clear(): void;
}
