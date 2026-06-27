import { sanitizeMetadata } from "../../../../packages/shared/src/core";
import type { CallRuntimeEvent } from "./call-runtime-event";
import type { CallRuntimeSession } from "./call-runtime-session";
import type { MockCallScript } from "./mock-call-script";

export function createMockCallEvents(
  session: CallRuntimeSession,
  script: MockCallScript,
): readonly CallRuntimeEvent[] {
  const base = {
    sessionId: session.sessionId,
    tenantId: session.tenantId,
    correlationId: session.correlationId,
    occurredAt: new Date(),
  };

  return [
    {
      ...base,
      eventId: `${session.sessionId}-event-started`,
      type: "call.mock.started",
      providerEventRef: `mock_event_${session.sessionId}_started`,
      payload: sanitizeMetadata({ scriptId: script.scriptId }),
    },
    {
      ...base,
      eventId: `${session.sessionId}-event-agent`,
      type: "call.mock.agent_prompted",
      providerEventRef: `mock_event_${session.sessionId}_agent`,
      payload: sanitizeMetadata({ safePrompt: script.safePrompt }),
    },
    {
      ...base,
      eventId: `${session.sessionId}-event-intent`,
      type: "call.mock.user_intent_detected",
      providerEventRef: `mock_event_${session.sessionId}_intent`,
      payload: sanitizeMetadata({ detectedIntent: script.syntheticUserIntent }),
    },
    {
      ...base,
      eventId: `${session.sessionId}-event-completed`,
      type: "call.mock.completed",
      providerEventRef: `mock_event_${session.sessionId}_completed`,
      payload: sanitizeMetadata({ safeSummary: script.safeSummary }),
    },
  ];
}
