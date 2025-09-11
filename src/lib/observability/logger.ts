/**
 * Minimal structured logger with redaction.
 * - Outputs single-line JSON for easy ingestion.
 * - Redacts secrets in keys and common bearer tokens in values.
 * - In test env, collects logs in an in-memory sink for assertions.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

const REDACT_KEY_RE = /(access_?token|refresh_?token|authorization|secret|password|session|cookie)/i;
const BEARER_RE = /\bBearer\s+[A-Za-z0-9\-._~+\/]+=*/i;

export type LogRecord = {
  ts: string;
  level: LogLevel;
  event: string;
  meta?: unknown;
};

function redactValue(key: string, value: unknown): unknown {
  if (value == null) return value;
  if (REDACT_KEY_RE.test(key)) return "[REDACTED]";
  if (typeof value === "string") {
    if (REDACT_KEY_RE.test(key)) return "[REDACTED]";
    // Redact inline bearer tokens in strings
    if (BEARER_RE.test(value)) return value.replace(BEARER_RE, "Bearer [REDACTED]");
  }
  return value;
}

function safeSerialize(obj: unknown): unknown {
  try {
    if (!obj || typeof obj !== "object") return obj;
    return JSON.parse(
      JSON.stringify(obj, (k, v) => redactValue(k, v))
    );
  } catch {
    return { note: "serialization_failed" };
  }
}

export const logSink: LogRecord[] = [];

export function log(level: LogLevel, event: string, meta?: unknown): void {
  const rec: LogRecord = {
    ts: new Date().toISOString(),
    level,
    event,
    meta: safeSerialize(meta),
  };

  // In tests, keep an in-memory sink for assertions
  if (process.env.NODE_ENV === "test") {
    logSink.push(rec);
  }

  const line = JSON.stringify(rec);

  // Emit to console with appropriate method
  switch (level) {
    case "debug":
    case "info":
      // eslint-disable-next-line no-console
      console.log(line);
      break;
    case "warn":
      // eslint-disable-next-line no-console
      console.warn(line);
      break;
    case "error":
      // eslint-disable-next-line no-console
      console.error(line);
      break;
  }
}

// Convenience helpers
export const logger = {
  debug: (event: string, meta?: unknown) => log("debug", event, meta),
  info: (event: string, meta?: unknown) => log("info", event, meta),
  warn: (event: string, meta?: unknown) => log("warn", event, meta),
  error: (event: string, meta?: unknown) => log("error", event, meta),
};