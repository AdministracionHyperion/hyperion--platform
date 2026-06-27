export const dialerDispatchModes = ["single", "campaign"] as const;

export type DialerDispatchMode = (typeof dialerDispatchModes)[number];
