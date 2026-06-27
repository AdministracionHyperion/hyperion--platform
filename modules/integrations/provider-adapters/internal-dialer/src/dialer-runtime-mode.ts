export const dialerRuntimeModes = ["dry_run", "blocked", "future_live"] as const;

export type DialerRuntimeMode = (typeof dialerRuntimeModes)[number];
