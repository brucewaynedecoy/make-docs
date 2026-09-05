import type { JsonValue, OperationRenderMode } from "../operations/types";

/** CLI-only text rendering. Unknown result shapes retain full JSON output. */
type JsonRecord = { [key: string]: JsonValue };

export function resolveRunRenderMode(input: {
  jsonFlag: boolean;
  isTty: boolean;
}): OperationRenderMode {
  if (input.jsonFlag || !input.isTty) {
    return "json";
  }
  return "text";
}

/**
 * Renders the human text for one operation result, keyed by the CLI spelling
 * identifier. Returns
 * null when no bespoke or generic rendering applies; the dispatcher then
 * falls back to the full JSON.
 */
export function renderRunOperationText(id: string, value: JsonValue): string[] | null {
  const renderer = TEXT_RENDERERS[id] ?? genericRenderer;
  try {
    return renderer(value);
  } catch {
    return null;
  }
}

function asRecord(value: JsonValue | undefined): JsonRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;
}

function asArray(value: JsonValue | undefined): JsonValue[] {
  return Array.isArray(value) ? value : [];
}

function recordEntries(value: JsonValue | undefined): JsonRecord[] {
  return asArray(value).flatMap((entry) => {
    const record = asRecord(entry);
    return record ? [record] : [];
  });
}

function text(record: JsonRecord | null, key: string): string | null {
  const value = record?.[key];
  return typeof value === "string" ? value : null;
}

function stringList(record: JsonRecord | null, key: string): string[] {
  return asArray(record?.[key]).filter((item): item is string => typeof item === "string");
}

function renderPrdAuthorityValidation(value: JsonValue): string[] | null {
  const report = asRecord(value);
  if (!report) {
    return null;
  }
  const diagnostics = recordEntries(report.diagnostics);
  const lines = [
    `PRD authority validation: ${text(report, "status") ?? "unknown"} (${String(report.prdFilesScanned ?? "?")} PRD files, ${diagnostics.length} errors).`,
  ];
  for (const diagnostic of diagnostics) {
    lines.push(
      `${text(diagnostic, "code") ?? "PRD-AUTH-?"} ${text(diagnostic, "path") ?? "?"}:${String(diagnostic.line ?? "?")} ${text(diagnostic, "message") ?? "Validation error."}`,
      `  Fix: ${text(diagnostic, "remediation") ?? "Repair the active PRD authority."}`,
    );
  }
  return lines;
}

const TEXT_RENDERERS: Record<string, (value: JsonValue) => string[] | null> = {
  "prd.authority.validate": renderPrdAuthorityValidation,
};

/**
 * Generic fallback for operations without a bespoke renderer: results that
 * carry human-oriented `lines` render those; anything else returns null and
 * the dispatcher prints the full JSON (safe default — never lose data).
 */
function genericRenderer(value: JsonValue): string[] | null {
  const record = asRecord(value);
  const lines = stringList(record, "lines");
  return record && lines.length > 0 ? lines : null;
}
