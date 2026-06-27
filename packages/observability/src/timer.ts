export interface Timer {
  readonly startedAt: number;
  elapsedMs(): number;
}

export function startTimer(now: () => number = () => performance.now()): Timer {
  const startedAt = now();
  return {
    startedAt,
    elapsedMs: () => Math.max(0, now() - startedAt),
  };
}
