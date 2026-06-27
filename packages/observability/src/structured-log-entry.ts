import type { LogLevel } from "./log-level";
import type { SanitizedLogMetadata } from "./redaction";

export interface StructuredLogEntry {
  readonly level: LogLevel;
  readonly message: string;
  readonly timestamp?: string;
  readonly correlationId?: string;
  readonly tenantId?: string;
  readonly actorId?: string;
  readonly route?: string;
  readonly method?: string;
  readonly statusCode?: number;
  readonly durationMs?: number;
  readonly eventName?: string;
  readonly metadata?: SanitizedLogMetadata;
}

export interface NormalizedStructuredLogEntry extends StructuredLogEntry {
  readonly timestamp: string;
  readonly metadata: SanitizedLogMetadata;
}
