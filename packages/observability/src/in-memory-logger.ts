import { sanitizeLogMetadata } from "./redaction";
import type { LoggerPort } from "./logger.port";
import type { LogLevel } from "./log-level";
import type { NormalizedStructuredLogEntry, StructuredLogEntry } from "./structured-log-entry";

export class InMemoryLogger implements LoggerPort {
  private readonly entries: NormalizedStructuredLogEntry[] = [];

  debug(entry: Omit<StructuredLogEntry, "level">): void {
    this.push("debug", entry);
  }

  info(entry: Omit<StructuredLogEntry, "level">): void {
    this.push("info", entry);
  }

  warn(entry: Omit<StructuredLogEntry, "level">): void {
    this.push("warn", entry);
  }

  error(entry: Omit<StructuredLogEntry, "level">): void {
    this.push("error", entry);
  }

  getEntries(): readonly NormalizedStructuredLogEntry[] {
    return [...this.entries];
  }

  clear(): void {
    this.entries.length = 0;
  }

  private push(level: LogLevel, entry: Omit<StructuredLogEntry, "level">): void {
    this.entries.push(normalizeLogEntry({ ...entry, level }));
  }
}

export function normalizeLogEntry(entry: StructuredLogEntry): NormalizedStructuredLogEntry {
  return {
    ...entry,
    timestamp: entry.timestamp ?? new Date().toISOString(),
    metadata: sanitizeLogMetadata(entry.metadata),
  };
}
