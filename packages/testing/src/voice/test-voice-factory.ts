import { sanitizeMetadata } from "../../../shared/src/core";
import { createTestActorContext, createTestOperationContext } from "../core/test-context-factory";
import type { CallParticipant } from "../../../../modules/voice/voice-core/src/call-participant";

export function createVoiceTestContext() {
  const context = createTestOperationContext({
    tenantId: "tenant-alpha",
    actorId: "actor-operator",
    correlationId: "corr-voice-001",
  });
  const operator = createTestActorContext({
    tenantId: "tenant-alpha",
    actorId: "actor-operator",
    roles: ["voice-operator"],
  });
  const manager = createTestActorContext({
    tenantId: "tenant-alpha",
    actorId: "actor-manager",
    roles: ["voice-manager"],
  });
  const viewer = createTestActorContext({
    tenantId: "tenant-alpha",
    actorId: "actor-viewer",
    roles: ["tenant-viewer"],
  });

  return { context, operator, manager, viewer };
}

export function createVoiceParticipants(): readonly CallParticipant[] {
  return [
    {
      participantId: "participant-caller",
      role: "caller",
      displayAlias: "caller-alias",
      metadata: sanitizeMetadata(),
    },
    {
      participantId: "participant-agent",
      role: "agent",
      displayAlias: "agent-alias",
      metadata: sanitizeMetadata(),
    },
  ];
}
