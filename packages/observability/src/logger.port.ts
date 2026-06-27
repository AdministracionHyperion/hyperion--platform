import type { StructuredLogEntry } from "./structured-log-entry";

export interface LoggerPort {
  debug(entry: Omit<StructuredLogEntry, "level">): void;
  info(entry: Omit<StructuredLogEntry, "level">): void;
  warn(entry: Omit<StructuredLogEntry, "level">): void;
  error(entry: Omit<StructuredLogEntry, "level">): void;
}
