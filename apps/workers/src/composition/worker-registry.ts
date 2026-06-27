import { JobRegistry } from "../core";
import {
  createEvaluateComplianceJobHandler,
  createEvaluateReadinessJobHandler,
  createRecordMetricJobHandler,
  createRunMockD02FlowJobHandler,
} from "../jobs/cedco-d02";
import { createProcessOutboxEventJobHandler } from "../jobs/outbox";
import {
  createFinalizeMockCallSessionJobHandler,
  createPrepareCallSessionJobHandler,
  createProcessCallEventJobHandler,
  createProcessPostCallResultJobHandler,
  createRunMockCallSessionJobHandler,
} from "../jobs/voice";

export function createWorkerRegistry(): JobRegistry {
  const registry = new JobRegistry();
  registry.register(createProcessOutboxEventJobHandler());
  registry.register(createPrepareCallSessionJobHandler());
  registry.register(createProcessCallEventJobHandler());
  registry.register(createProcessPostCallResultJobHandler());
  registry.register(createRunMockCallSessionJobHandler());
  registry.register(createFinalizeMockCallSessionJobHandler());
  registry.register(createEvaluateReadinessJobHandler());
  registry.register(createEvaluateComplianceJobHandler());
  registry.register(createRecordMetricJobHandler());
  registry.register(createRunMockD02FlowJobHandler());
  return registry;
}
