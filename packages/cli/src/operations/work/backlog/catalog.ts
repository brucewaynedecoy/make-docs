import { createHash } from "node:crypto";

import type { DiagnosticSeverity } from "./schemas.js";

export type BacklogRuleClass = "fact" | "decision";
export type BacklogRuleSourceClass =
  | "repository"
  | "frontmatter"
  | "phase-map"
  | "task-state"
  | "source-link"
  | "filesystem"
  | "git"
  | "report"
  | "agent-response";
export type BacklogRuleDeterministicSupport = "full" | "partial" | "agent-only";
export type BacklogRuleEvidenceClass =
  | "repository-authority"
  | "recorded-frontmatter"
  | "phase-map"
  | "recorded-task-state"
  | "recorded-source-link"
  | "filesystem-metadata"
  | "git-metadata"
  | "derived-report"
  | "agent-judgment";

export interface BacklogRule {
  id: `BACKLOG-RULE-${string}`;
  title: string;
  ruleClass: BacklogRuleClass;
  sourceClass: BacklogRuleSourceClass;
  evidenceClass: BacklogRuleEvidenceClass;
  deterministicSupport: BacklogRuleDeterministicSupport;
  agentInstructionLocation: string;
  judgmentRequired: boolean;
  diagnosticCode: `BACKLOG-${"VAL" | "AGENT"}-${string}`;
  defaultSeverity: DiagnosticSeverity;
  trigger: string;
  humanMeaning: string;
  safeNextAction: string;
  focusedTests: readonly string[];
  parityMapping: string;
  oneSidedReason: string | null;
}

export const BACKLOG_RULE_CATALOG_ID = "make-docs.backlog-review-rules.v1";
export const BACKLOG_RULE_CATALOG_VERSION = 1;

const AGENT_METHOD_ANCHOR =
  "make-docs://system/skill/backlog-review/SKILL.md#review-method";
const SNAPSHOT_CONTRACT_ANCHOR =
  "docs/prd/51-backlog-review-and-reporting.md#backlog-snapshot-operation";

/**
 * Stable map between the future deterministic snapshot and the guided review.
 * These entries define evidence and diagnostics only. They never assign report
 * status, filter membership, color, priority, or a recommendation.
 */
export const BACKLOG_RULES: readonly BacklogRule[] = Object.freeze([
  {
    id: "BACKLOG-RULE-001",
    title: "Safe target root",
    ruleClass: "fact",
    sourceClass: "repository",
    evidenceClass: "repository-authority",
    deterministicSupport: "full",
    agentInstructionLocation: SNAPSHOT_CONTRACT_ANCHOR,
    judgmentRequired: false,
    diagnosticCode: "BACKLOG-VAL-001",
    defaultSeverity: "error",
    trigger: "The requested target root is missing, unreadable, unsafe, or escapes repository authority.",
    humanMeaning: "The requested project cannot be inspected safely, so no snapshot can be trusted.",
    safeNextAction: "Select a readable project root that stays inside the intended repository authority.",
    focusedTests: ["missing root", "unreadable root", "symlink or escaping path"],
    parityMapping: "Both methods stop when repository authority cannot be inspected safely.",
    oneSidedReason: null,
  },
  {
    id: "BACKLOG-RULE-002",
    title: "Missing work index",
    ruleClass: "fact",
    sourceClass: "repository",
    evidenceClass: "repository-authority",
    deterministicSupport: "full",
    agentInstructionLocation: SNAPSHOT_CONTRACT_ANCHOR,
    judgmentRequired: false,
    diagnosticCode: "BACKLOG-VAL-002",
    defaultSeverity: "warning",
    trigger: "A discovered dated work directory has no readable 00-index.md file.",
    humanMeaning: "The record remains counted, but its intended work-index facts are unavailable.",
    safeNextAction: "Review or restore the missing work index before relying on record details.",
    focusedTests: ["dated live directory without 00-index.md", "archived directory without index"],
    parityMapping: "Both methods retain the directory as an inventory record and report the missing index.",
    oneSidedReason: null,
  },
  {
    id: "BACKLOG-RULE-003",
    title: "Malformed or incomplete current frontmatter",
    ruleClass: "fact",
    sourceClass: "frontmatter",
    evidenceClass: "recorded-frontmatter",
    deterministicSupport: "full",
    agentInstructionLocation: SNAPSHOT_CONTRACT_ANCHOR,
    judgmentRequired: false,
    diagnosticCode: "BACKLOG-VAL-003",
    defaultSeverity: "warning",
    trigger: "Current-format frontmatter is unreadable or lacks a required kind, coordinate, title, or status.",
    humanMeaning: "Only safely parsed current-format facts can be used for this partial record.",
    safeNextAction: "Repair the named frontmatter field and regenerate the snapshot.",
    focusedTests: ["unreadable YAML", "missing kind", "missing coordinate", "missing title", "missing status"],
    parityMapping: "Both methods expose only safely parsed current-format facts and preserve each missing value.",
    oneSidedReason: null,
  },
  {
    id: "BACKLOG-RULE-004",
    title: "Unsupported record shape",
    ruleClass: "fact",
    sourceClass: "frontmatter",
    evidenceClass: "recorded-frontmatter",
    deterministicSupport: "full",
    agentInstructionLocation: SNAPSHOT_CONTRACT_ANCHOR,
    judgmentRequired: false,
    diagnosticCode: "BACKLOG-VAL-004",
    defaultSeverity: "warning",
    trigger: "A discovered record does not contain the required current frontmatter standard.",
    humanMeaning: "The record is counted as inventory, but its body is not interpreted as current work data.",
    safeNextAction: "Add valid current frontmatter if this record needs full report detail.",
    focusedTests: ["no frontmatter", "inventory-only output", "no legacy body interpretation"],
    parityMapping: "Both methods count the record and limit it to inventory evidence.",
    oneSidedReason: null,
  },
  {
    id: "BACKLOG-RULE-005",
    title: "Duplicate wave coordinate",
    ruleClass: "fact",
    sourceClass: "repository",
    evidenceClass: "repository-authority",
    deterministicSupport: "full",
    agentInstructionLocation: SNAPSHOT_CONTRACT_ANCHOR,
    judgmentRequired: false,
    diagnosticCode: "BACKLOG-VAL-005",
    defaultSeverity: "warning",
    trigger: "Two or more discovered record paths declare the same wave coordinate.",
    humanMeaning: "The coordinate is ambiguous, so each record remains separate under its record path.",
    safeNextAction: "Review the duplicate records and correct or accept their recorded coordinates.",
    focusedTests: ["duplicate live coordinate", "live and archived duplicate", "recordPath identity"],
    parityMapping: "Both methods keep each recordPath and report the coordinate conflict without merging records.",
    oneSidedReason: null,
  },
  {
    id: "BACKLOG-RULE-006",
    title: "Broken phase-map link",
    ruleClass: "fact",
    sourceClass: "phase-map",
    evidenceClass: "phase-map",
    deterministicSupport: "full",
    agentInstructionLocation: SNAPSHOT_CONTRACT_ANCHOR,
    judgmentRequired: false,
    diagnosticCode: "BACKLOG-VAL-006",
    defaultSeverity: "warning",
    trigger: "A work-index phase-map entry is missing, unsafe, or names a mismatched phase coordinate.",
    humanMeaning: "The linked phase cannot safely contribute interpreted phase or task facts.",
    safeNextAction: "Repair the named phase-map link or phase coordinate.",
    focusedTests: ["missing linked phase", "unsafe linked path", "phase coordinate mismatch"],
    parityMapping: "Both methods follow the index phase map and keep broken authority links visible.",
    oneSidedReason: null,
  },
  {
    id: "BACKLOG-RULE-007",
    title: "Unlinked current phase",
    ruleClass: "fact",
    sourceClass: "phase-map",
    evidenceClass: "phase-map",
    deterministicSupport: "full",
    agentInstructionLocation: SNAPSHOT_CONTRACT_ANCHOR,
    judgmentRequired: false,
    diagnosticCode: "BACKLOG-VAL-007",
    defaultSeverity: "warning",
    trigger: "A numbered current-frontmatter phase exists in the record directory but is absent from the phase map.",
    humanMeaning: "The phase is visible as unlinked evidence but does not enter the interpreted phase set.",
    safeNextAction: "Link the phase from the work index or remove it if it is not part of the record.",
    focusedTests: ["numbered current phase not in map", "unlinked phase excluded from facts"],
    parityMapping: "Both methods report an unlinked current phase but do not silently add it to the interpreted set.",
    oneSidedReason: null,
  },
  {
    id: "BACKLOG-RULE-008",
    title: "Recorded status and task-state conflict",
    ruleClass: "fact",
    sourceClass: "task-state",
    evidenceClass: "recorded-task-state",
    deterministicSupport: "full",
    agentInstructionLocation: SNAPSHOT_CONTRACT_ANCHOR,
    judgmentRequired: false,
    diagnosticCode: "BACKLOG-VAL-008",
    defaultSeverity: "warning",
    trigger: "Recorded lifecycle status conflicts with current task checkbox or closeout evidence.",
    humanMeaning: "The record contains contradictory facts and cannot be trusted at face value.",
    safeNextAction: "Review the recorded status, open tasks, and closeout evidence before deciding its state.",
    focusedTests: ["recorded complete with open tasks", "checked tasks without closeout", "unknown task state"],
    parityMapping: "Both methods preserve the recorded status and contradictory task evidence as separate facts.",
    oneSidedReason: null,
  },
  {
    id: "BACKLOG-RULE-009",
    title: "Missing or unsafe source authority",
    ruleClass: "fact",
    sourceClass: "source-link",
    evidenceClass: "recorded-source-link",
    deterministicSupport: "full",
    agentInstructionLocation: SNAPSHOT_CONTRACT_ANCHOR,
    judgmentRequired: false,
    diagnosticCode: "BACKLOG-VAL-009",
    defaultSeverity: "warning",
    trigger: "A recorded source link is missing, unsafe, escaping, or unsupported.",
    humanMeaning: "The linked authority cannot support the affected record claim.",
    safeNextAction: "Repair the source link or use another recorded authority before relying on the claim.",
    focusedTests: ["missing source target", "escaping source link", "unsupported source link"],
    parityMapping: "Both methods retain the recorded link and report why its authority could not be verified.",
    oneSidedReason: null,
  },
  {
    id: "BACKLOG-RULE-010",
    title: "Optional Git evidence fallback",
    ruleClass: "fact",
    sourceClass: "git",
    evidenceClass: "git-metadata",
    deterministicSupport: "full",
    agentInstructionLocation: SNAPSHOT_CONTRACT_ANCHOR,
    judgmentRequired: false,
    diagnosticCode: "BACKLOG-VAL-010",
    defaultSeverity: "info",
    trigger: "Git is unavailable, denied, not a repository, or has no usable scoped history.",
    humanMeaning: "Repository facts remain usable, but last-updated time uses less precise file metadata.",
    safeNextAction: "Use the fallback now or restore Git access when commit evidence is important.",
    focusedTests: ["Git unavailable", "Git denied", "not a repository", "no usable history", "filesystem fallback"],
    parityMapping: "Both methods preserve repository facts and name the file-time fallback when Git evidence is unavailable.",
    oneSidedReason: null,
  },
  {
    id: "BACKLOG-RULE-011",
    title: "Created-date last-updated fallback",
    ruleClass: "fact",
    sourceClass: "filesystem",
    evidenceClass: "filesystem-metadata",
    deterministicSupport: "full",
    agentInstructionLocation: SNAPSHOT_CONTRACT_ANCHOR,
    judgmentRequired: false,
    diagnosticCode: "BACKLOG-VAL-011",
    defaultSeverity: "info",
    trigger: "No usable Git or scoped file modification time exists for the record.",
    humanMeaning: "Last-updated time falls back to the less precise directory creation date.",
    safeNextAction: "Use the date-level evidence with its stated limit or restore stronger file history.",
    focusedTests: ["no usable file time", "directory date available", "date evidence unavailable"],
    parityMapping: "Both methods name the created-date fallback and keep its lower precision visible.",
    oneSidedReason: null,
  },
  {
    id: "BACKLOG-RULE-012",
    title: "Fixed portfolio tally integrity",
    ruleClass: "fact",
    sourceClass: "report",
    evidenceClass: "derived-report",
    deterministicSupport: "full",
    agentInstructionLocation: AGENT_METHOD_ANCHOR,
    judgmentRequired: false,
    diagnosticCode: "BACKLOG-VAL-012",
    defaultSeverity: "error",
    trigger: "Report records or tallies omit, duplicate, re-scope, or double-count a snapshot record.",
    humanMeaning: "The report totals do not represent the full discovered portfolio.",
    safeNextAction: "Regenerate the report from the unchanged snapshot and correct the tally model.",
    focusedTests: ["all records retained", "archive location", "history status", "four-tally sum"],
    parityMapping: "Both methods use the fixed tally meanings and reject a report that loses or double-counts a record.",
    oneSidedReason: null,
  },
  {
    id: "BACKLOG-RULE-013",
    title: "Wave status and status reason",
    ruleClass: "decision",
    sourceClass: "report",
    evidenceClass: "agent-judgment",
    deterministicSupport: "agent-only",
    agentInstructionLocation: AGENT_METHOD_ANCHOR,
    judgmentRequired: true,
    diagnosticCode: "BACKLOG-AGENT-013",
    defaultSeverity: "info",
    trigger: "The guided review classifies a live record or explains any live or archived record.",
    humanMeaning: "The fixed status controls filtering, while the separate reason explains the current evidence.",
    safeNextAction: "Review the cited evidence and revise the classification or reason when product context changes.",
    focusedTests: ["all six fixed statuses", "flexible status reason", "attention finding independence", "archived null status"],
    parityMapping: "The snapshot supplies facts only; the agent assigns one fixed status and explains it with source evidence.",
    oneSidedReason: "Wave classification depends on current product context and evidence-weighting judgment.",
  },
  {
    id: "BACKLOG-RULE-014",
    title: "Recommended work order",
    ruleClass: "decision",
    sourceClass: "report",
    evidenceClass: "agent-judgment",
    deterministicSupport: "agent-only",
    agentInstructionLocation: AGENT_METHOD_ANCHOR,
    judgmentRequired: true,
    diagnosticCode: "BACKLOG-AGENT-014",
    defaultSeverity: "info",
    trigger: "The guided review proposes which work should happen next.",
    humanMeaning: "The order is a contextual recommendation, not a deterministic fact or new authority.",
    safeNextAction: "Compare the rationale with current goals, dependencies, risk, and owner authority.",
    focusedTests: ["recommendation evidence", "recommendation limits", "age is not priority", "no snapshot recommendation"],
    parityMapping: "The deterministic method supplies evidence and stable sort facts; only the guided review recommends an order.",
    oneSidedReason: "Priority and useful next work depend on current goals, dependencies, risk, and owner authority.",
  },
  {
    id: "BACKLOG-RULE-015",
    title: "Human explanation of errors and limits",
    ruleClass: "decision",
    sourceClass: "agent-response",
    evidenceClass: "agent-judgment",
    deterministicSupport: "agent-only",
    agentInstructionLocation: AGENT_METHOD_ANCHOR,
    judgmentRequired: true,
    diagnosticCode: "BACKLOG-AGENT-015",
    defaultSeverity: "info",
    trigger: "An agent receives an operation error, warning, or material evidence limit.",
    humanMeaning: "The human needs the exact meaning, effect, limit, and next action without decoding raw tool output.",
    safeNextAction: "Explain the event in current-task context and state whether human action is required, optional, or not needed.",
    focusedTests: ["subject", "what happened and context", "effect", "known and unknown", "next action", "human action level"],
    parityMapping: "The tool keeps stable structured meaning; the agent explains that meaning in language suited to the current human and task.",
    oneSidedReason: "Useful wording and context depend on the human, the current request, and the surrounding conversation.",
  },
  {
    id: "BACKLOG-RULE-016",
    title: "Separate lifecycle evidence",
    ruleClass: "fact",
    sourceClass: "task-state",
    evidenceClass: "recorded-task-state",
    deterministicSupport: "full",
    agentInstructionLocation: SNAPSHOT_CONTRACT_ANCHOR,
    judgmentRequired: false,
    diagnosticCode: "BACKLOG-VAL-016",
    defaultSeverity: "warning",
    trigger: "A result attempts to promote task completion into closeout, commit, closed history, release, or archive evidence.",
    humanMeaning: "Each lifecycle signal has separate authority and one signal cannot prove another.",
    safeNextAction: "Keep the signals separate and obtain the missing recorded evidence before making the stronger claim.",
    focusedTests: ["completed tasks", "accepted closeout", "commit evidence", "closed history", "release and archive evidence"],
    parityMapping: "Both methods keep each lifecycle signal separate and do not promote one signal into another.",
    oneSidedReason: null,
  },
] satisfies readonly BacklogRule[]);

export function backlogRuleCatalogDigest(): string {
  return createHash("sha256").update(JSON.stringify(BACKLOG_RULES)).digest("hex");
}
