import { operationCliPath } from "../operations/registry";
import type { JsonValue, OperationRenderMode } from "../operations/types";

/**
 * The `run` dispatcher's render layer (W18 R12 P3; PRD 39 R-RENDER-1..3),
 * built at the seam where `printJson(invocation.value)` sat and keyed by the
 * previously unused {@link OperationRenderMode}.
 *
 * Mode selection (R-RENDER-1, R-INV-1):
 *
 * - `--json` always emits the full operation result, byte-identical to the
 *   pre-remediation output.
 * - A non-TTY stdout defaults to the same full JSON, so pipes, scripts,
 *   agents, and transcripts observe no change without passing any flag.
 * - A TTY defaults to `text`: per-operation-family human summaries — what
 *   just happened (the execution report), where the run stands (a compact
 *   cursor/status line, never the full state echo), and what to do next (the
 *   current hints and the exact next command).
 *
 * The renderer is CLI-only; MCP output derives from the operation result
 * exactly as before (R-RENDER-3). Rendering reads the result value
 * defensively (plain JSON access, no schema), so a renderer can never make
 * an operation fail: any shape surprise falls back to the JSON dump.
 *
 * Capability-snapshot and evidence-log dedup (R-RENDER-2, UAT X7): the
 * capability snapshot renders once in the `playbook.start` text and later
 * renderings reference rather than restate it; the evidence log is never
 * echoed in text mode — both stay reachable via `--json` and
 * `status --json`.
 */

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
 * identifier (so `package.preview` renders as preview, not write). Returns
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

function command(id: string, ...flags: string[]): string {
  return ["make-docs run", operationCliPath(id), ...flags].join(" ");
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

/** Compact cursor/status line — never the full state echo (R-RENDER-1). */
function runStatusLine(state: JsonRecord): string {
  const cursor = asRecord(state.cursor);
  const parts = [
    `Run ${text(state, "runId") ?? "?"}`,
    text(state, "playbookRef") ?? "?",
    `status: ${text(state, "status") ?? "?"}`,
  ];
  const terminal = text(state, "terminalStatus");
  if (terminal) {
    parts.push(`terminal: ${terminal}`);
  } else if (cursor) {
    parts.push(`cursor: ${text(cursor, "kind") ?? "?"} ${text(cursor, "id") ?? "?"}`);
  }
  return parts.join(" | ");
}

/** Current-guidance hints (post R-FIX-2 these are current, not historical). */
function hintLines(state: JsonRecord): string[] {
  return stringList(state, "resumeHints").map((hint) => `Hint: ${hint}`);
}

/** The exact next command, derived from the run's cursor and status. */
function nextCommandLine(state: JsonRecord): string[] {
  const runId = text(state, "runId") ?? "<run-id>";
  if (text(state, "terminalStatus")) {
    return [`Run is closed; inspect it with: ${command("playbook.status", "--run-id", runId, "--json")}`];
  }
  if (text(state, "status") === "blocked") {
    return [`Next: ${command("playbook.resume", "--run-id", runId)}`];
  }
  const cursor = asRecord(state.cursor);
  if (cursor && text(cursor, "kind") === "gate") {
    return [`Next: ${command("playbook.gate", "--run-id", runId, "--decision", "<approve|reject>")}`];
  }
  if (cursor) {
    return [`Next: ${command("playbook.advance", "--run-id", runId)}`];
  }
  return [`Next: ${command("playbook.close", "--run-id", runId, "--terminal-status", "completed")}`];
}

/** One reference line instead of restating snapshot/evidence (R-RENDER-2). */
function fullRecordReference(state: JsonRecord): string {
  const runId = text(state, "runId") ?? "<run-id>";
  const evidenceCount = asArray(state.evidenceLog).length;
  return `Full record (${evidenceCount} evidence entr${evidenceCount === 1 ? "y" : "ies"}, capability snapshot): ${command("playbook.status", "--run-id", runId, "--json")}`;
}

/** State-carrying transition rendering shared by gate/resume/close/status. */
function renderRunState(header: string[], state: JsonRecord): string[] {
  return [...header, runStatusLine(state), ...hintLines(state), fullRecordReference(state), ...nextCommandLine(state)];
}

function renderStart(value: JsonValue): string[] | null {
  const result = asRecord(value);
  const state = asRecord(result?.state);
  if (!result || !state) {
    return null;
  }
  const snapshot = asRecord(state.capabilitySnapshot);
  const lines = [
    `Started run ${text(state, "runId") ?? "?"}: ${text(state, "playbookRef") ?? "?"} (stack ${text(state, "stack") ?? "?"}) on ${text(state, "harness") ?? "?"}.`,
  ];
  // The capability snapshot renders ONCE, here at start (R-RENDER-2).
  if (snapshot) {
    lines.push(`Capabilities: ${text(snapshot, "status") ?? "unknown"}`);
    lines.push(...stringList(snapshot, "guidance").map((entry) => `  - ${entry}`));
  }
  lines.push(runStatusLine(state), ...hintLines(state), ...nextCommandLine(state));
  return lines;
}

function renderAdvance(value: JsonValue): string[] | null {
  const result = asRecord(value);
  const state = asRecord(result?.state);
  const execution = asRecord(result?.execution);
  if (!result || !state || !execution) {
    return null;
  }
  const outcome = text(execution, "outcome");
  const lines = [
    `Advanced step ${text(execution, "stepId") ?? "?"} (${text(execution, "mode") ?? "?"}): ${text(execution, "action") ?? "?"}${outcome ? ` -> ${outcome}` : ""}`,
  ];
  const presented = text(execution, "presentedCommand");
  if (presented) {
    lines.push(`Run by hand: ${presented}`);
  }
  const instructions = text(execution, "instructions");
  if (instructions) {
    lines.push(`Instructions: ${instructions}`);
  }
  lines.push(runStatusLine(state), ...hintLines(state), fullRecordReference(state), ...nextCommandLine(state));
  return lines;
}

function renderStateValue(header: (state: JsonRecord) => string[]) {
  return (value: JsonValue): string[] | null => {
    const state = asRecord(value);
    if (!state || typeof state.runId !== "string") {
      return null;
    }
    return renderRunState(header(state), state);
  };
}

function renderNext(value: JsonValue): string[] | null {
  const report = asRecord(value);
  if (!report || typeof report.position !== "string") {
    return null;
  }
  const lines = [`Position: ${text(report, "position")} (run ${text(report, "runId") ?? "?"}, ${text(report, "playbookRef") ?? "?"})`];
  const next = asRecord(report.next);
  if (next) {
    const invocation = asRecord(next.invocation);
    lines.push(
      `Next up: ${text(next, "stepId") ?? "?"}${text(next, "title") ? ` - ${text(next, "title")}` : ""} (mode ${text(next, "mode") ?? "?"})`,
    );
    if (invocation) {
      const detail = text(invocation, "operation") ?? text(invocation, "commandRun") ?? text(invocation, "instructions");
      if (detail) {
        lines.push(`  ${text(invocation, "form") ?? "invocation"}: ${detail}`);
      }
    }
  }
  lines.push(...stringList(report, "blockedBy").map((entry) => `Blocked by: ${entry}`));
  lines.push(...stringList(report, "guidance").map((entry) => `Guidance: ${entry}`));
  const runId = text(report, "runId") ?? "<run-id>";
  if (text(report, "position") === "gate") {
    lines.push(`Next: ${command("playbook.gate", "--run-id", runId, "--decision", "<approve|reject>")}`);
  } else if (text(report, "position") === "step") {
    lines.push(`Next: ${command("playbook.advance", "--run-id", runId)}`);
  } else if (text(report, "position") === "closeable") {
    lines.push(`Next: ${command("playbook.close", "--run-id", runId, "--terminal-status", "completed")}`);
  }
  return lines;
}

function renderCatalog(value: JsonValue): string[] | null {
  const catalog = asRecord(value);
  if (!catalog) {
    return null;
  }
  const entries = recordEntries(catalog.entries);
  return [
    `Playbook catalog: ${entries.length} entr${entries.length === 1 ? "y" : "ies"}`,
    ...entries.map(
      (entry) =>
        `- ${text(entry, "ref") ?? "?"} (${text(entry, "stack") ?? "?"})${text(entry, "title") ? `: ${text(entry, "title")}` : ""}`,
    ),
  ];
}

/**
 * Package pipeline results already carry human-oriented `lines`; text mode
 * prints them with a status header plus the next-command handoff, instead of
 * the full JSON echo.
 */
function renderPackagePipeline(header: string, next?: (record: JsonRecord) => string | null) {
  return (value: JsonValue): string[] | null => {
    const record = asRecord(value);
    if (!record) {
      return null;
    }
    const lines = [
      `${header}: ${text(record, "status") ?? "?"}`,
      ...stringList(record, "lines"),
    ];
    const handoff = next?.(record);
    if (handoff) {
      lines.push(handoff);
    }
    return lines;
  };
}

const TEXT_RENDERERS: Record<string, (value: JsonValue) => string[] | null> = {
  "prd.authority.validate": renderPrdAuthorityValidation,
  "playbook.start": renderStart,
  "playbook.advance": renderAdvance,
  "playbook.gate": renderStateValue((state) => {
    const decisions = recordEntries(state.gateDecisions);
    const latest = decisions[decisions.length - 1];
    return latest
      ? [`Recorded gate ${text(latest, "gateId") ?? "?"}: ${text(latest, "decision") ?? "?"}`]
      : ["Recorded gate decision."];
  }),
  "playbook.resume": renderStateValue(() => ["Resumed run."]),
  "playbook.close": renderStateValue((state) => [
    `Closed run ${text(state, "runId") ?? "?"} (terminal: ${text(state, "terminalStatus") ?? "?"}).`,
  ]),
  "playbook.status": renderStateValue(() => ["Run status."]),
  "playbook.next": renderNext,
  "playbook.catalog": renderCatalog,
  "package.plan": renderPackagePipeline("Package plan", (record) =>
    text(record, "status") === "ready"
      ? `Next: ${command("package.ship", "...")} (or review with ${command("package.plan", "--output", "<path>")} and continue granularly)`
      : `Next: resolve the stops above, then re-run ${command("package.plan")}`,
  ),
  // `package.preview` is the dry-run CLI spelling of `package.write`; both
  // render the pipeline lines with the spelling-appropriate header.
  "package.preview": renderPackagePipeline("Package preview (no writes)", (record) =>
    text(record, "status") === "ready"
      ? `Next: ${command("package.write")} (writes; every stop still enforced)`
      : null,
  ),
  "package.write": renderPackagePipeline("Package write"),
  "package.ship": renderPackagePipeline("Package ship"),
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
