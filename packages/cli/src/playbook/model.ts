/**
 * The Playbook model: the single, fully resolved in-memory form of a Playbook
 * document (R-MODEL-2).
 *
 * One parser produces one Playbook model and every consumer — reader tooling,
 * the runner, and the packaging compiler — reads that model instead of
 * re-parsing Playbook Markdown. The concrete data structures here are a D6
 * implementer freedom; the content families (identity, typed dependency
 * registry, workflow header and fully linked steps, narrative-section
 * presence map, and source spans on every parsed element) are fixed by the
 * Playbook contract at `.make-docs/contracts/system/playbook-contract.md`.
 */

import type { SourceSpan, Spanned, SpannedEnum } from "./source-span";

// ---------------------------------------------------------------------------
// Shared vocabularies (encoded once — R-WF-6 and the D6 fixed enumerations)
// ---------------------------------------------------------------------------

/**
 * Step status vocabulary, defined once and shared with the run state so the
 * runtime cannot invent a parallel set (R-WF-6).
 */
export const PLAYBOOK_STEP_STATUSES = [
  "pending",
  "running",
  "blocked",
  "waiting-for-user",
  "completed",
  "failed",
  "skipped",
  "cancelled",
] as const;
export type PlaybookStepStatus = (typeof PLAYBOOK_STEP_STATUSES)[number];

export const PLAYBOOK_STEP_EXECUTORS = [
  "cli",
  "script",
  "agent",
  "human",
  "mcp",
  "child-playbook",
] as const;
export type PlaybookStepExecutor = (typeof PLAYBOOK_STEP_EXECUTORS)[number];

export const PLAYBOOK_STEP_ROLES = [
  "activity",
  "decision",
  "gate",
  "check",
  "handoff",
] as const;
export type PlaybookStepRole = (typeof PLAYBOOK_STEP_ROLES)[number];

export const PLAYBOOK_STEP_ACTIVATIONS = ["sequential", "event-bound"] as const;
export type PlaybookStepActivation = (typeof PLAYBOOK_STEP_ACTIVATIONS)[number];

export const PLAYBOOK_STEP_MODES = ["deterministic", "delegated", "manual"] as const;
export type PlaybookStepMode = (typeof PLAYBOOK_STEP_MODES)[number];
/** When `mode` is unspecified it defaults to `delegated` (R-WF-4). */
export const PLAYBOOK_DEFAULT_STEP_MODE: PlaybookStepMode = "delegated";

export const PLAYBOOK_WORKFLOW_ROUTING_MODES = ["linear", "graph"] as const;
export type PlaybookWorkflowRoutingMode = (typeof PLAYBOOK_WORKFLOW_ROUTING_MODES)[number];
export const PLAYBOOK_DEFAULT_WORKFLOW_ROUTING_MODE: PlaybookWorkflowRoutingMode = "linear";

/**
 * The known event set for `event-bound` steps (consistency layer, R-MODEL-4).
 * Events are logical lifecycle names; how they bind to harness-native hook
 * points is owned by the packaging and harness-capability lineage.
 */
export const PLAYBOOK_KNOWN_EVENTS = [
  "on-session-start",
  "on-session-end",
  "on-user-prompt-submit",
  "on-pre-tool-use",
  "on-post-tool-use",
  "on-pre-commit",
  "on-post-commit",
  "on-pre-push",
] as const;
export type PlaybookKnownEvent = (typeof PLAYBOOK_KNOWN_EVENTS)[number];

export const PLAYBOOK_DEPENDENCY_KINDS = [
  "cli",
  "script",
  "mcp",
  "skill",
  "plugin",
  "playbook",
  "reference",
  "package-manager",
  "external-service",
  "asset",
] as const;
export type PlaybookDependencyKind = (typeof PLAYBOOK_DEPENDENCY_KINDS)[number];

export const PLAYBOOK_DEPENDENCY_REQUIREMENTS = [
  "required",
  "optional",
  "preferred",
  "conditional",
] as const;
export type PlaybookDependencyRequirement = (typeof PLAYBOOK_DEPENDENCY_REQUIREMENTS)[number];

export const PLAYBOOK_DOCUMENT_STACKS = ["build", "run"] as const;
export type PlaybookDocumentStack = (typeof PLAYBOOK_DOCUMENT_STACKS)[number];

export const PLAYBOOK_DOCUMENT_STATUSES = ["proposed", "accepted", "deprecated"] as const;
export type PlaybookDocumentStatus = (typeof PLAYBOOK_DOCUMENT_STATUSES)[number];

export const PLAYBOOK_CHILD_PLAYBOOK_POLICIES = ["none", "serial", "parallel"] as const;
export type PlaybookChildPlaybookPolicy = (typeof PLAYBOOK_CHILD_PLAYBOOK_POLICIES)[number];

export const PLAYBOOK_CONCURRENCY_POLICIES = [
  "serial",
  "parallel-allowed",
  "parallel-required",
] as const;
export type PlaybookConcurrencyPolicy = (typeof PLAYBOOK_CONCURRENCY_POLICIES)[number];

// ---------------------------------------------------------------------------
// Document schema constants
// ---------------------------------------------------------------------------

export const PLAYBOOK_FILE_SUFFIX = ".playbook.md";
/**
 * Fenced-block info string shared by the two authoritative YAML blocks — the
 * dependencies block and the workflow contract block — distinguished by their
 * top-level keys; `yaml` does not count (R-WF-1, PRD 34 R-DEP-1).
 */
export const PLAYBOOK_WORKFLOW_BLOCK_INFO = "playbook";
/** Top-level key of the fenced dependencies block in `## Dependencies` (PRD 34 R-DEP-1). */
export const PLAYBOOK_DEPENDENCIES_BLOCK_KEY = "dependencies";

/**
 * The v2 document schema identifier (PRD 34 R-MIG-3). The parser accepts only
 * this identifier; the v1 identifier fails with the pointed PB-FM-028
 * diagnostic naming this replacement.
 */
export const PLAYBOOK_DOCUMENT_SCHEMA_ID = "make-docs.playbook.v2";
/**
 * The workflow contract schema identifier. PRD 34 advances only the document
 * schema; the workflow block shape is unchanged from W18 R6, so the workflow
 * schema identifier stays at v1 (implementer decision recorded here).
 */
export const PLAYBOOK_WORKFLOW_SCHEMA_ID = "make-docs.workflow.v1";

/**
 * The executable-token pattern a declared dependency `probe` must match
 * (PRD 34 R-DEP-2). Shared with the packaging compiler's dependency
 * materialization, whose generated checks may target only this field
 * (R-DEP-3).
 */
export const PLAYBOOK_PROBE_TOKEN_RE = /^[A-Za-z0-9@][\w@./-]*$/;

/** The ten required `##` headings, in required order (R-DOC-5, PRD 34 R-HEAD-1). */
export const PLAYBOOK_REQUIRED_H2_HEADINGS = [
  "Purpose",
  "When To Use",
  "Inputs",
  "Dependencies",
  "Workflow",
  "Step Guidance",
  "Gates",
  "Outputs",
  "Validation",
  "Packaging Notes",
] as const;
export type PlaybookRequiredH2Heading = (typeof PLAYBOOK_REQUIRED_H2_HEADINGS)[number];

/**
 * Removed v1 heading spellings mapped to the v2 heading for the same slot
 * (PRD 34 R-HEAD-1..2, R-MIG-2). Only the v2 spellings parse; an old
 * spelling fails with the pointed PB-DOC-027 diagnostic naming its
 * replacement.
 */
export const PLAYBOOK_V1_HEADING_RENAMES: Readonly<Record<string, PlaybookRequiredH2Heading>> = {
  "Inputs And Authority": "Inputs",
  "Workflow Contract": "Workflow",
  "Gates And Decisions": "Gates",
  "Outputs And Handoff": "Outputs",
};

/**
 * Required narrative sections (everything in the spine except the two
 * authoritative sections `Dependencies` and `Workflow`), keyed by a
 * stable slug for the presence map.
 */
export const PLAYBOOK_NARRATIVE_SECTIONS = {
  purpose: "Purpose",
  "when-to-use": "When To Use",
  inputs: "Inputs",
  "step-guidance": "Step Guidance",
  gates: "Gates",
  outputs: "Outputs",
  validation: "Validation",
  "packaging-notes": "Packaging Notes",
} as const;
export type PlaybookNarrativeSectionKey = keyof typeof PLAYBOOK_NARRATIVE_SECTIONS;

// ---------------------------------------------------------------------------
// Identity and frontmatter
// ---------------------------------------------------------------------------

export type PlaybookFileForm = "playbook-suffix" | "deprecated-plain" | "not-playbook";

export interface PlaybookIdentity {
  /** Explicit frontmatter `id` when present, else derived `persona/slug` (R-DOC-4). */
  canonicalRef: string;
  /** The source path exactly as provided to the parser. */
  sourcePath: string;
  /** SHA-256 hex digest of the full source text. */
  sourceDigest: string;
  /** Slug derived from the file name with the playbook or markdown suffix removed. */
  slug: string;
  /** Which naming form the file uses (R-DOC-2). */
  fileForm: PlaybookFileForm;
  /**
   * Document schema version string from the `schema` frontmatter key
   * (`make-docs.playbook.v2`). The model field keeps its descriptive
   * `schemaVersion` name so downstream consumers stay source-compatible
   * across the PRD 34 key rename (implementer decision).
   */
  schemaVersion: string | null;
  /** Workflow contract schema version string from `workflowSchema`, for example `make-docs.workflow.v1`. */
  workflowSchemaVersion: string | null;
  persona: string | null;
  /** Persona implied by the containing folder, for Phase 3 folder-match checks. */
  directoryPersona: string | null;
  stack: PlaybookDocumentStack | null;
  status: PlaybookDocumentStatus | null;
}

/** Frontmatter fields with source spans; scalar views live on {@link PlaybookIdentity}. */
export interface PlaybookFrontmatter {
  kind: Spanned<string> | null;
  title: Spanned<string> | null;
  summary: Spanned<string> | null;
  persona: Spanned<string> | null;
  stack: SpannedEnum<PlaybookDocumentStack>;
  status: SpannedEnum<PlaybookDocumentStatus>;
  /** Parsed from the v2 `schema` frontmatter key (PRD 34 R-FM-1). */
  schemaVersion: Spanned<string> | null;
  /** Parsed from the v2 `workflowSchema` frontmatter key (PRD 34 R-FM-1). */
  workflowSchemaVersion: Spanned<string> | null;
  id: Spanned<string> | null;
  /** Non-authoritative packaging hints; they inform, never bind (R-DOC-4). */
  packagingHints: Spanned<Record<string, unknown>> | null;
  /** All frontmatter data as plain values, including unknown fields. */
  raw: Record<string, unknown>;
  span: SourceSpan | null;
}

// ---------------------------------------------------------------------------
// Dependency registry
// ---------------------------------------------------------------------------

export interface PlaybookDependency {
  id: Spanned<string>;
  kind: SpannedEnum<PlaybookDependencyKind>;
  requirement: SpannedEnum<PlaybookDependencyRequirement>;
  /**
   * The resolved probe target dependency checks verify (PRD 34 R-DEP-2..3):
   * the declared `probe` value when present, else the dependency `id`. This
   * is the ONLY field dependency-check generation may target; `source` is
   * never parsed for machine meaning.
   */
  probe: Spanned<string>;
  /** True when the entry declared `probe` explicitly rather than defaulting to `id`. */
  probeDeclared: boolean;
  /** Human provenance prose; never parsed for machine meaning by anything (R-DEP-2). */
  source: Spanned<string>;
  usedBy: Spanned<string>[];
  fallback: Spanned<string>;
  /** Step ids that reference this dependency via `uses` or `requires`, filled at resolve time. */
  referencedBy: string[];
  /** Span of the full dependency entry. */
  span: SourceSpan;
}

export interface PlaybookDependencyRegistry {
  /** Registry records keyed by identifier; first declaration wins on duplicates. */
  byId: Map<string, PlaybookDependency>;
  /** All parsed entries in declaration order, including duplicates for Phase 3 checks. */
  entries: PlaybookDependency[];
  /** Span of the parsed dependencies block content, when one was found. */
  span: SourceSpan | null;
}

// ---------------------------------------------------------------------------
// Workflow contract
// ---------------------------------------------------------------------------

export const PLAYBOOK_ORCHESTRATION_POLICY_FIELDS = [
  "requires_capabilities",
  "prefers_capabilities",
  "child_playbooks",
  "concurrency",
] as const;
export type PlaybookOrchestrationPolicyField =
  (typeof PLAYBOOK_ORCHESTRATION_POLICY_FIELDS)[number];

export interface PlaybookOrchestrationPolicy {
  requiresCapabilities: Spanned<string>[];
  prefersCapabilities: Spanned<string>[];
  childPlaybooks: SpannedEnum<PlaybookChildPlaybookPolicy> | null;
  concurrency: SpannedEnum<PlaybookConcurrencyPolicy> | null;
  /** Declared policy fields as plain values, for shape-only validation (R-WF-8). */
  raw: Partial<Record<PlaybookOrchestrationPolicyField, unknown>>;
  /** Spans of the declared policy field values, keyed like {@link raw}. */
  fieldSpans: Partial<Record<PlaybookOrchestrationPolicyField, SourceSpan | null>>;
}

export interface PlaybookWorkflowHeader {
  id: Spanned<string> | null;
  stateModel: Spanned<string> | null;
  routing: SpannedEnum<PlaybookWorkflowRoutingMode>;
  /** Optional orchestration policy; presence and shape only (R-WF-8). */
  policy: PlaybookOrchestrationPolicy | null;
  span: SourceSpan | null;
}

export type PlaybookDependencyReferenceType = "uses" | "requires";

/**
 * A step's reference to a dependency registry record. After the resolve
 * stage, `registryEntry` links to the registry record the identifier names —
 * never a bare string (R-MODEL-2); it stays null only when the identifier is
 * unknown (PB-DEP-003).
 */
export interface PlaybookDependencyReference {
  id: string;
  refType: PlaybookDependencyReferenceType;
  registryEntry: PlaybookDependency | null;
  span: SourceSpan | null;
}

export interface PlaybookRoutingTarget {
  raw: string;
  kind: "stop" | "step";
  /** The resolved step id; null for `stop` or when unresolved (PB-WF-006). */
  stepId: string | null;
  resolved: boolean;
  span: SourceSpan | null;
}

export interface PlaybookRoutingBranch {
  condition: string | null;
  target: PlaybookRoutingTarget;
  span: SourceSpan | null;
}

export interface PlaybookStepRouting {
  onSuccess: PlaybookRoutingTarget | null;
  onFailure: PlaybookRoutingTarget | null;
  branch: PlaybookRoutingBranch[];
  stop: Spanned<boolean> | null;
  span: SourceSpan | null;
}

export type PlaybookInvocationForm = "operation" | "command" | "instructions";

/**
 * The `operation`/`command`/`instructions` invocation split (R-WF-5).
 * `operation` references a Make Docs operation by stable registry identifier
 * only — never a CLI command string (R-SCOPE-2). `command.run` is reserved
 * for external tools Make Docs does not own. A conformant step declares
 * exactly one form; the parser records every declared form so the Phase 3
 * validator can diagnose surplus or missing forms.
 */
export interface PlaybookStepInvocation {
  form: PlaybookInvocationForm;
  /** Stable operation registry identifier (form `operation`). */
  operation: Spanned<string> | null;
  /** External command line (form `command`, declared as `command: { run: ... }`). */
  commandRun: Spanned<string> | null;
  /** Instruction text for `agent` and `human` executors (form `instructions`). */
  instructions: Spanned<string> | null;
  span: SourceSpan | null;
}

export interface PlaybookStepInput {
  name: Spanned<string>;
  defaultValue: Spanned<unknown> | null;
  /** Declared missing-input behavior. */
  whenMissing: Spanned<string> | null;
  span: SourceSpan | null;
}

export interface PlaybookStepOutput {
  name: Spanned<string>;
  span: SourceSpan | null;
}

/** Gate semantics, required when `role` is `gate` (R-WF-5). */
export interface PlaybookGateSemantics {
  /** Who may resolve the gate. */
  resolvedBy: Spanned<string> | null;
  /** What evidence is required. */
  evidence: Spanned<string> | null;
  /** Whether unattended continuation is allowed. */
  unattended: Spanned<boolean> | null;
  raw: Record<string, unknown>;
  span: SourceSpan | null;
}

export interface PlaybookStepValidation {
  expect: Spanned<string> | null;
  deterministicChecks: Spanned<string>[];
  humanReviewChecks: Spanned<string>[];
  completionEvidence: Spanned<string>[];
  raw: Record<string, unknown>;
  span: SourceSpan | null;
}

export interface PlaybookStepSafety {
  mutationSurfaces: Spanned<string>[];
  dryRun: Spanned<string> | null;
  approval: Spanned<string> | null;
  rollback: Spanned<string> | null;
  raw: Record<string, unknown>;
  span: SourceSpan | null;
}

export interface PlaybookStep {
  id: Spanned<string> | null;
  title: Spanned<string> | null;
  /** The four step dimensions (R-WF-4); raw tokens survive invalid values. */
  executor: SpannedEnum<PlaybookStepExecutor>;
  role: SpannedEnum<PlaybookStepRole>;
  activation: SpannedEnum<PlaybookStepActivation>;
  /** Defaults to `delegated` when unspecified. */
  mode: SpannedEnum<PlaybookStepMode>;
  /** Logical lifecycle event, required when `activation` is `event-bound`. */
  event: Spanned<string> | null;
  uses: PlaybookDependencyReference[];
  requires: PlaybookDependencyReference[];
  inputs: PlaybookStepInput[];
  outputs: PlaybookStepOutput[];
  /** Declared invocation forms; a conformant step has exactly one. */
  invocations: PlaybookStepInvocation[];
  routing: PlaybookStepRouting | null;
  gate: PlaybookGateSemantics | null;
  validation: PlaybookStepValidation | null;
  safety: PlaybookStepSafety | null;
  /** All step fields as plain values, including unknown fields. */
  raw: Record<string, unknown>;
  span: SourceSpan;
}

export interface PlaybookWorkflow {
  header: PlaybookWorkflowHeader;
  steps: PlaybookStep[];
  /** Span of the fenced workflow contract block content. */
  span: SourceSpan;
}

// ---------------------------------------------------------------------------
// Narrative sections and the assembled model
// ---------------------------------------------------------------------------

export interface PlaybookNarrativeSectionPresence {
  heading: PlaybookRequiredH2Heading;
  present: boolean;
  nonEmpty: boolean;
  span: SourceSpan | null;
}

export type PlaybookNarrativeSectionMap = Record<
  PlaybookNarrativeSectionKey,
  PlaybookNarrativeSectionPresence
>;

export interface PlaybookModel {
  identity: PlaybookIdentity;
  frontmatter: PlaybookFrontmatter;
  dependencies: PlaybookDependencyRegistry;
  /** Null when no workflow contract block could be located or parsed. */
  workflow: PlaybookWorkflow | null;
  narrativeSections: PlaybookNarrativeSectionMap;
  /**
   * Derived from diagnostics: true only when parsing produced zero errors
   * (R-MODEL-3). Fail-soft for diagnostics, fail-closed for execution.
   */
  runnable: boolean;
}
