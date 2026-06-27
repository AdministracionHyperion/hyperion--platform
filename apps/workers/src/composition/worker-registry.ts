import { JobRegistry } from "../core";
import {
  createEvaluateComplianceJobHandler,
  createEvaluateReadinessJobHandler,
  createRecordMetricJobHandler,
} from "../jobs/cedco-d02";
import { createProcessOutboxEventJobHandler } from "../jobs/outbox";
import {
  createPrepareCallSessionJobHandler,
  createProcessCallEventJobHandler,
  createProcessPostCallResultJobHandler,
} from "../jobs/voice";

export function createWorkerRegistry(): JobRegistry {
  const registry = new JobRegistry();
  registry.register(createProcessOutboxEventJobHandler());
  registry.register(createPrepareCallSessionJobHandler());
  registry.register(createProcessCallEventJobHandler());
  registry.register(createProcessPostCallResultJobHandler());
  registry.register(createEvaluateReadinessJobHandler());
  registry.register(createEvaluateComplianceJobHandler());
  registry.register(createRecordMetricJobHandler());
  return registry;
}
