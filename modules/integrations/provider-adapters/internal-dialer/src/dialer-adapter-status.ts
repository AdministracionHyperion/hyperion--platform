export const dialerAdapterStatuses = ["blocked", "dry_run_ready", "future_live_blocked"] as const;

export type DialerAdapterStatus = (typeof dialerAdapterStatuses)[number];
