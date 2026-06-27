import type { JobType } from "../../core";

export const voiceJobTypes = [
  "voice.call.prepare",
  "voice.call.event.process",
  "voice.post_call.process",
] as const satisfies readonly JobType[];

export type VoiceJobType = (typeof voiceJobTypes)[number];
