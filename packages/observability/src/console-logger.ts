import type { LoggerPort } from "./logger.port";
import type { LogLevel } from "./log-level";
import { normalizeLogEntry } from "./in-memory-logger";
import type { StructuredLogEntry } from "./structured-log-entry";

export class ConsoleLogger implements LoggerPort {
  debug(entry: Omit<StructuredLogEntry, "level">): void {
    this.write("debug", entry);
  }

  info(entry: Omit<StructuredLogEntry, "level">): void {
    this.write("info", entry);
  }

  warn(entry: Omit<StructuredLogEntry, "level">): void {
    this.write("warn", entry);
  }

  error(entry: Omit<StructuredLogEntry, "level">): void {
    this.write("error", entry);
  }

  private write(level: LogLevel, entry: Omit<StructuredLogEntry, "level">): void {
    const normalized = normalizeLogEntry({ ...entry, level });
    console.log(JSON.stringify(normalized));
  }
}
