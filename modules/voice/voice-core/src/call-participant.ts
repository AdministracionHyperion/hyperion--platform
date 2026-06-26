import { type SafeMetadata } from "../../../../packages/shared/src/core";
import type { ParticipantRole } from "./participant-role";

export interface CallParticipant {
  readonly participantId: string;
  readonly role: ParticipantRole;
  readonly displayAlias: string;
  readonly metadata: SafeMetadata;
}
