/**
 * W30 R0 P2 factory record rules (PRD 53, factory contract).
 *
 * The fixed lists of the factory contract and the pure checks that every
 * factory write runs: the assignment status move table (version 1), the
 * final states, the correction round count, the bounded status history, the
 * reason codes, and the never-log check. This module holds no Store or file
 * access. The Store service (`store/factory-store.ts`), the config block
 * schema (`config-block.ts`), and the copy writer use these checks, so the
 * code and the contract give the same answer (R-FACTORY-52).
 *
 * Each list here is a copy of a list in
 * `make-docs://system/contract/factory-contract.md`. A code or an ID is only
 * ever added; it is never removed, renamed, or given a new meaning
 * (R-FACTORY-53, R-FACTORY-54).
 */

/** A lower-case kebab-case name: a workflow, a role, a type, a part label, a tool ID, an action, or a reason code. */
export const FACTORY_NAME_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
export const FACTORY_NAME_MAX = 64;
/** A part label is a short kebab-case name (R-FACTORY-27). */
export const FACTORY_PART_LABEL_MAX = 40;
/** The part label of a unit with one part. */
export const FACTORY_MAIN_PART_LABEL = "main";

export function isFactoryName(value: unknown, max = FACTORY_NAME_MAX): value is string {
  return typeof value === "string" && value.length <= max && FACTORY_NAME_PATTERN.test(value);
}

/** The capability catalog IDs (factory contract, Capability Catalog). */
export const FACTORY_CAPABILITY_IDS = [
  "read-write-files",
  "run-commands",
  "launch-agent",
  "wait-for-agent",
  "read-agent-result",
  "wake-on-schedule",
  "wake-on-event",
  "message-person",
  "receive-answer",
  "isolate-working-copy",
  "edit-code",
] as const;
export type FactoryCapabilityId = (typeof FACTORY_CAPABILITY_IDS)[number];

/** The capability IDs in a list that the catalog does not hold (`unknown-capability`, R-FACTORY-53). */
export function unknownFactoryCapabilities(ids: readonly string[]): string[] {
  const known = new Set<string>(FACTORY_CAPABILITY_IDS);
  return [...new Set(ids.filter((id) => !known.has(id)))];
}

/** The fixed set of context kinds a role can get (R-FACTORY-60). */
export const FACTORY_CONTEXT_KINDS = [
  "unit-record",
  "requirements",
  "project-files",
  "candidate-result",
  "defect-list",
  "evidence-links",
  "builder-summary",
] as const;
export type FactoryContextKind = (typeof FACTORY_CONTEXT_KINDS)[number];

/** The four standard roles of the contract. Any other role name is a custom role that the project adds. */
export const FACTORY_STANDARD_ROLES = ["front-desk", "foreman", "builder", "reviewer"] as const;

/**
 * The default context kinds of the two standard roles that the contract
 * gives defaults (Portable Definition). A reviewer never gets
 * `builder-summary` by default. The foreman and the front desk need no
 * context list: nobody hands them context (owner decision 2026-11-23).
 */
export const FACTORY_DEFAULT_CONTEXT: Readonly<Record<string, readonly FactoryContextKind[]>> = Object.freeze({
  builder: ["unit-record", "requirements", "project-files", "defect-list"],
  reviewer: ["unit-record", "requirements", "project-files", "candidate-result", "evidence-links"],
});

export const FACTORY_TOOL_STATES = ["available", "missing", "blocked"] as const;
export type FactoryToolState = (typeof FACTORY_TOOL_STATES)[number];

/** The kinds of tool that setup looks for (factory contract, Setup step 1). */
export const FACTORY_TOOL_KINDS = [
  "agent-harness",
  "model-provider",
  "terminal-multiplexer",
  "mcp-server",
  "scheduler",
  "messaging-tool",
  "other",
] as const;
export type FactoryToolKind = (typeof FACTORY_TOOL_KINDS)[number];

export const FACTORY_PROOF_RESULTS = ["proved", "unproved", "contradicted"] as const;
export type FactoryProofResult = (typeof FACTORY_PROOF_RESULTS)[number];

export const FACTORY_READINESS_STATES = ["draft", "wired", "ready", "drifted"] as const;
export type FactoryReadiness = (typeof FACTORY_READINESS_STATES)[number];

export const FACTORY_WAKE_METHODS = ["schedule", "event", "person"] as const;
export type FactoryWakeMethod = (typeof FACTORY_WAKE_METHODS)[number];

export const FACTORY_GRANT_SCOPES = ["once", "run", "standing"] as const;
export type FactoryGrantScope = (typeof FACTORY_GRANT_SCOPES)[number];

/** The action of a `once` grant that resets a job's correction round count (R-FACTORY-41). */
export const FACTORY_RESET_ROUNDS_ACTION = "reset-correction-rounds";

export const FACTORY_TEST_OUTCOMES = ["passed", "failed"] as const;
export type FactoryTestOutcome = (typeof FACTORY_TEST_OUTCOMES)[number];

/** Claim size limit values (factory contract, Limits). */
export const FACTORY_CLAIM_SIZES = ["wave", "phase", "stage", "task"] as const;

/* ------------------------------------------------------------------------ */
/* Assignment status moves                                                  */
/* ------------------------------------------------------------------------ */

export const FACTORY_ASSIGNMENT_STATUSES = [
  "offered",
  "running",
  "returned",
  "in-review",
  "needs-correction",
  "accepted",
  "failed",
  "cancelled",
  "unknown",
] as const;
export type FactoryAssignmentStatus = (typeof FACTORY_ASSIGNMENT_STATUSES)[number];

/** `accepted`, `failed`, and `cancelled` are final. A final status never changes. */
export const FACTORY_FINAL_STATUSES: readonly FactoryAssignmentStatus[] = Object.freeze(["accepted", "failed", "cancelled"]);

/** The version of the status move table below. The resolved plan records it. */
export const FACTORY_MOVE_TABLE_VERSION = 1;

/** Status move table version 1 (factory contract, Status Moves). */
export const FACTORY_STATUS_MOVES: Readonly<Record<FactoryAssignmentStatus, readonly FactoryAssignmentStatus[]>> = Object.freeze({
  offered: ["running", "unknown", "failed", "cancelled"],
  running: ["returned", "unknown", "failed", "cancelled"],
  returned: ["in-review", "needs-correction", "unknown", "failed", "cancelled"],
  "in-review": ["accepted", "needs-correction", "unknown", "failed", "cancelled"],
  "needs-correction": ["offered", "running", "unknown", "failed", "cancelled"],
  unknown: ["offered", "running", "returned", "in-review", "needs-correction", "failed", "cancelled"],
  accepted: [],
  failed: [],
  cancelled: [],
});

export function isFinalAssignmentStatus(status: FactoryAssignmentStatus): boolean {
  return FACTORY_FINAL_STATUSES.includes(status);
}

/**
 * Check one status change. A change to the same status is not a move (only
 * the last check time changes). Returns null when the change is allowed.
 */
export function factoryStatusMoveRefusal(from: FactoryAssignmentStatus, to: FactoryAssignmentStatus): "final-status" | "illegal-move" | null {
  if (isFinalAssignmentStatus(from)) return "final-status";
  if (from === to) return null;
  return FACTORY_STATUS_MOVES[from].includes(to) ? null : "illegal-move";
}

/**
 * The round count goes up by one on each move from `returned`, `in-review`,
 * or `unknown` to `needs-correction` (R-FACTORY-41). The move from `unknown`
 * counts, so a loop through `unknown` never skips a round, except when the
 * status before `unknown` was already `needs-correction`: that round was
 * counted when the job first went to `needs-correction` (owner decisions
 * 2026-11-23). `beforeUnknown` is the status before `unknown`, read from the
 * status history.
 */
export function nextFactoryRoundCount(
  from: FactoryAssignmentStatus,
  to: FactoryAssignmentStatus,
  count: number,
  beforeUnknown: FactoryAssignmentStatus | null = null,
): number {
  if (to !== "needs-correction") return count;
  if (from === "returned" || from === "in-review") return count + 1;
  if (from === "unknown") return beforeUnknown === "needs-correction" ? count : count + 1;
  return count;
}

/** The status just before the newest history entry, or null when the history has only one entry. */
export function factoryStatusBeforeLatest(history: readonly FactoryStatusHistoryEntry[]): FactoryAssignmentStatus | null {
  return history.length >= 2 ? history[history.length - 2]!.status : null;
}

/* ------------------------------------------------------------------------ */
/* Reason codes                                                             */
/* ------------------------------------------------------------------------ */

export const FACTORY_DRIFT_CODES = [
  "config-changed",
  "binding-changed",
  "type-changed",
  "type-name-clash",
  "tool-missing",
  "tool-version-changed",
  "proof-contradicted",
  "permission-lost",
] as const;

export const FACTORY_REFUSAL_CODES = [
  "not-ready",
  "claim-not-held",
  "illegal-move",
  "final-status",
  "round-limit-reached",
  "assignment-open",
  "plan-digest-mismatch",
  "proof-missing",
  "unknown-capability",
  "type-version-mismatch",
  "grant-missing",
  "grant-out-of-scope",
  "grant-spent",
  "grant-expired",
  "never-log-field",
  // W30 R0 P3 T27: project scope (R-FACTORY-63).
  "project-missing",
  "project-not-found",
  "project-mismatch",
  "project-checkout-unclear",
] as const;
export type FactoryRefusalCode = (typeof FACTORY_REFUSAL_CODES)[number];

export const FACTORY_STATUS_HISTORY_CODES = [
  "assigned",
  "tool-started",
  "result-returned",
  "sent-to-review",
  "review-passed",
  "defects-found",
  "correction-sent",
  "handle-not-found",
  "handle-checked",
  "taken-over",
  "stopped-by-person",
  "stopped-by-foreman",
  "tool-failed",
  "round-limit-reached",
  "scope-changed",
] as const;
export type FactoryStatusHistoryCode = (typeof FACTORY_STATUS_HISTORY_CODES)[number];

/* ------------------------------------------------------------------------ */
/* Status history                                                           */
/* ------------------------------------------------------------------------ */

/** Each assignment keeps its 20 newest status changes (R-FACTORY-27). */
export const FACTORY_STATUS_HISTORY_MAX = 20;

export interface FactoryStatusHistoryEntry {
  status: FactoryAssignmentStatus;
  at: string;
  reason: FactoryStatusHistoryCode;
}

/** Add one entry and keep only the 20 newest, oldest first. */
export function appendFactoryStatusHistory(history: readonly FactoryStatusHistoryEntry[], entry: FactoryStatusHistoryEntry): FactoryStatusHistoryEntry[] {
  return [...history, entry].slice(-FACTORY_STATUS_HISTORY_MAX);
}

/* ------------------------------------------------------------------------ */
/* Never-log check                                                          */
/* ------------------------------------------------------------------------ */

/** A free-text field is one line of at most 120 characters (R-FACTORY-26). */
export const FACTORY_FREE_TEXT_MAX = 120;
/** A task handle is an ID of at most 1024 characters. */
export const FACTORY_HANDLE_MAX = 1024;

/**
 * Patterns of a value that looks like a credential. They name no product:
 * a long unbroken run of letters and digits, a private key block, a bearer
 * header, a key or password assignment, a URL with a user and password, or a
 * three-part signed token.
 */
const CREDENTIAL_PATTERNS: readonly RegExp[] = Object.freeze([
  /[A-Za-z0-9]{32,}/,
  /-----BEGIN [A-Z ]*(PRIVATE KEY|CERTIFICATE)-----/,
  /\bbearer\s+\S{8,}/i,
  /\b(pass(word|wd|phrase)?|secret|token|api[-_]?key|private[-_]?key|credential|auth)\s*[:=]\s*\S+/i,
  /[a-z][a-z0-9+.-]*:\/\/[^\s/:@]+:[^\s/@]+@/i,
  /\b[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/,
]);

/** Patterns of a value that looks like an environment setting: `NAME=value`, `$NAME`, `${NAME}`, or `%NAME%`. */
const ENVIRONMENT_PATTERNS: readonly RegExp[] = Object.freeze([
  /(^|[\s;])(export\s+)?[A-Z][A-Z0-9_]*=\S/,
  /\$\{?[A-Z][A-Z0-9_]+\}?/,
  /%[A-Z][A-Z0-9_]+%/,
]);

export function looksLikeCredential(value: string): boolean {
  return CREDENTIAL_PATTERNS.some((pattern) => pattern.test(value));
}

export function looksLikeEnvironmentSetting(value: string): boolean {
  return ENVIRONMENT_PATTERNS.some((pattern) => pattern.test(value));
}

export type FactoryFieldProblemKind = "not-text" | "empty" | "multi-line" | "spaces" | "too-long" | "credential" | "environment";

/**
 * Check one free-text field: one line, at most `max` characters, and no
 * value that looks like a credential or an environment setting. Returns null
 * when the value is allowed. The result never holds the value.
 */
export function factoryFreeTextProblem(value: unknown, max = FACTORY_FREE_TEXT_MAX): FactoryFieldProblemKind | null {
  if (typeof value !== "string") return "not-text";
  if (value.trim().length === 0) return "empty";
  if (/[\r\n\u2028\u2029]/.test(value)) return "multi-line";
  if (value.length > max) return "too-long";
  if (looksLikeCredential(value)) return "credential";
  if (looksLikeEnvironmentSetting(value)) return "environment";
  return null;
}

/**
 * Check a task handle or a reference, which is an ID, not prose: one line,
 * no spaces, at most `max` characters, and nothing that looks like a
 * credential or an environment setting. A handle may be a long run of
 * letters and digits, such as a run ID, so that one credential pattern does
 * not apply here.
 */
export function factoryHandleProblem(value: unknown, max = FACTORY_HANDLE_MAX): FactoryFieldProblemKind | null {
  if (typeof value !== "string") return "not-text";
  if (value.length === 0) return "empty";
  if (/[\r\n\u2028\u2029]/.test(value)) return "multi-line";
  if (/\s/.test(value)) return "spaces";
  if (value.length > max) return "too-long";
  if (CREDENTIAL_PATTERNS.slice(1).some((pattern) => pattern.test(value))) return "credential";
  if (looksLikeEnvironmentSetting(value)) return "environment";
  return null;
}

const PROBLEM_WORDS: Readonly<Record<FactoryFieldProblemKind, string>> = Object.freeze({
  "not-text": "is not text",
  empty: "is empty",
  "multi-line": "has more than one line",
  spaces: "holds a space",
  "too-long": "is longer than its limit",
  credential: "looks like a credential",
  environment: "looks like an environment setting",
});

/** One plain sentence for a field problem. It names the field, never the value. */
export function describeFactoryFieldProblem(field: string, problem: FactoryFieldProblemKind): string {
  return `The field ${field} ${PROBLEM_WORDS[problem]}. Factory records hold IDs, short labels, times, digests, and reason codes only.`;
}

/** A field problem that the never-log rule owns gives `never-log-field`; a shape problem is an invalid record. */
export function factoryFieldProblemCode(problem: FactoryFieldProblemKind): "never-log-field" | "invalid-record" {
  return problem === "credential" || problem === "environment" || problem === "multi-line" || problem === "too-long" ? "never-log-field" : "invalid-record";
}
