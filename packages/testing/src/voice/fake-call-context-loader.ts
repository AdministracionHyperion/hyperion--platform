import { sanitizeMetadata } from "../../../shared/src/core";
import type { OperationContext } from "../../../shared/src/core";
import type { CallContext } from "../../../../modules/voice/call-orchestration/src/call-context";
import type { CallContextLoaderPort } from "../../../../modules/voice/call-orchestration/src/call-context-loader.port";
import type { CallId } from "../../../../modules/voice/voice-core/src/call-id";

export class FakeCallContextLoader implements CallContextLoaderPort {
  async loadContext(callId: CallId, operationContext: OperationContext): Promise<CallContext> {
    return {
      callId,
      tenantId: operationContext.tenantId,
      agentRuntimeRef: {
        agentVersionId: "agent-version-test",
        promptVersionId: "prompt-version-test",
        flowVersionId: "flow-version-test",
        knowledgeBaseVersionId: "knowledge-version-test",
      },
      knowledgeRuntimeRef: "knowledge-version-test",
      objective: "faq",
      safeFacts: { topic: "synthetic" },
      metadata: sanitizeMetadata({ source: "fake" }),
    };
  }
}
