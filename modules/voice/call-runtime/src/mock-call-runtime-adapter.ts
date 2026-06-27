import { fail, ok, sanitizeMetadata, type Result } from "../../../../packages/shared/src/core";
import type { CallRuntimeCommand } from "./call-runtime-command";
import type { CallRuntimeError } from "./call-runtime-error";
import type { CallRuntimeEvent } from "./call-runtime-event";
import type { CallRuntimePort } from "./call-runtime-port";
import type { CallRuntimeFinalizeResult, CallRuntimeStartResult } from "./call-runtime-result";
import type { CallRuntimeSession } from "./call-runtime-session";
import { createMockCallEvents } from "./mock-call-event-factory";
import { createDefaultMockCallScript, type MockCallScript } from "./mock-call-script";
import { sanitizeCallRuntimePayload } from "./sanitize-call-runtime-payload";

export class MockCallRuntimeAdapter implements CallRuntimePort {
  private readonly sessions = new Map<string, CallRuntimeSession>();
  private readonly scripts = new Map<string, MockCallScript>();
  private readonly events = new Map<string, CallRuntimeEvent[]>();

  registerScript(script: MockCallScript): void {
    this.scripts.set(script.scriptId, script);
  }

  async startSession(
    command: CallRuntimeCommand,
  ): Promise<Result<CallRuntimeStartResult, CallRuntimeError>> {
    if (command.runtimeMode !== "mock") {
      return fail(runtimeError("runtime_mode_blocked", "Only mock runtime is enabled."));
    }

    const metadata = sanitizeCallRuntimePayload(command.metadata);
    if (!metadata.ok) {
      return fail(runtimeError(metadata.error.code, metadata.error.message));
    }

    const sessionId = `mock-session-${command.correlationId}`;
    const script =
      this.scripts.get(command.scriptId) ?? createDefaultMockCallScript(command.scriptId);
    const session: CallRuntimeSession = {
      sessionId,
      tenantId: command.tenantId,
      correlationId: command.correlationId,
      runtimeMode: "mock",
      status: "running",
      providerCallRef: `mock_call_${command.correlationId}`,
      startedAt: new Date(),
      blockedReasons: [],
      metadata: sanitizeMetadata({
        callIntentId: command.callIntentId,
        productCode: command.productCode,
        scriptId: command.scriptId,
        safeContactRef: command.safeContactRef,
        patientContextRef: command.patientContextRef,
        consentRef: command.consentRef,
        ...metadata.value,
      }),
    };
    const events = createMockCallEvents(session, script);

    this.sessions.set(sessionId, session);
    this.events.set(sessionId, [...events]);

    return ok({ session, events });
  }

  async processEvent(
    event: CallRuntimeEvent,
  ): Promise<Result<CallRuntimeSession, CallRuntimeError>> {
    const existing = this.sessions.get(event.sessionId);
    if (!existing) {
      return fail(runtimeError("mock_session_not_found", "Mock call session not found."));
    }

    const payload = sanitizeCallRuntimePayload(event.payload);
    if (!payload.ok) {
      return fail(runtimeError(payload.error.code, payload.error.message));
    }

    const status = event.type === "call.mock.completed" ? "completed" : "running";
    const updated: CallRuntimeSession = {
      ...existing,
      status,
      completedAt: status === "completed" ? event.occurredAt : existing.completedAt,
      metadata: sanitizeMetadata({ ...existing.metadata, lastEventType: event.type }),
    };
    this.sessions.set(event.sessionId, updated);
    return ok(updated);
  }

  async finalizeSession(
    sessionId: string,
  ): Promise<Result<CallRuntimeFinalizeResult, CallRuntimeError>> {
    const existing = this.sessions.get(sessionId);
    if (!existing) {
      return fail(runtimeError("mock_session_not_found", "Mock call session not found."));
    }

    const completed: CallRuntimeSession = {
      ...existing,
      status: "completed",
      completedAt: existing.completedAt ?? new Date(),
      metadata: sanitizeMetadata({ ...existing.metadata, finalized: true }),
    };
    this.sessions.set(sessionId, completed);

    return ok({
      session: completed,
      postCallResult: {
        outcome: "completed",
        detectedIntent: "consultar_sede",
        disposition: "resolved_mock",
        safeSummary: "Flujo mock CEDCO D02 completado sin llamada real.",
        nextRecommendedAction: "review_mock_metrics",
        handoffRecommended: false,
        auditNotes: ["mock_runtime_only", "no_provider_egress", "no_real_call"],
        metrics: sanitizeMetadata({
          syntheticEvents: this.events.get(sessionId)?.length ?? 0,
          runtimeMode: "mock",
        }),
      },
    });
  }

  getSession(sessionId: string): CallRuntimeSession | undefined {
    return this.sessions.get(sessionId);
  }

  getEvents(sessionId: string): readonly CallRuntimeEvent[] {
    return [...(this.events.get(sessionId) ?? [])];
  }
}

function runtimeError(code: string, message: string): CallRuntimeError {
  return {
    code,
    message,
    metadata: {},
  };
}
