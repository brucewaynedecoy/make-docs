/**
 * Playbook diagnostic types and the shared diagnostic catalog.
 *
 * Every diagnostic carries a stable code, a severity, a precise location
 * naming the section, field, and source span, a message, and an
 * expected-shape or fix hint (R-MODEL-5).
 *
 * This module declares the full shared catalog: the codes that parsing
 * itself emits (PB-DOC-001, PB-FM-002, PB-DEP-003, PB-WF-006, PB-FILE-007,
 * and the parser-structural codes PB-FM-008..PB-WF-011) plus the codes the
 * layered semantic validator (W18 R6 Phase 3) emits — the contract-reserved
 * PB-DEP-004 (warning, unreferenced dependency) and PB-WF-005 (error,
 * deterministic step without operation or command), and the validator codes
 * from PB-FM-012 onward. The W18 R12 clean v2 break (PRD 34 R-MIG-1..3)
 * adds the pointed old-form error diagnostics PB-DEP-025..PB-DEP-030; the
 * accept-old-warn deprecation codes proposed in earlier drafts (PB-DEP-008,
 * PB-FM-009, PB-DOC-010) were dropped and have never existed in this
 * catalog. `PlaybookDiagnosticCode` widens automatically via `keyof`, so the
 * `playbook.validate` operation and a future language server consume one
 * identical catalog (R-MODEL-6).
 */

import type { SourceSpan } from "./source-span";

export type PlaybookDiagnosticSeverity = "error" | "warning";

export interface PlaybookDiagnosticDescriptor {
  severity: PlaybookDiagnosticSeverity;
  /** Contract-level meaning of the code, independent of any one occurrence. */
  meaning: string;
  /** Default expected-shape or fix hint used when the emitter adds none. */
  hint: string;
}

export const PLAYBOOK_DIAGNOSTIC_CATALOG = {
  "PB-DOC-001": {
    severity: "error",
    meaning: "A required section is missing or out of order.",
    hint: "The body must carry the eleven-heading spine in order: `# <Title>`, `## Purpose`, `## When To Use`, `## Inputs`, `## Dependencies`, `## Workflow`, `## Step Guidance`, `## Gates`, `## Outputs`, `## Validation`, `## Packaging Notes`. Unknown `##` sections are only allowed after the required spine.",
  },
  "PB-FM-002": {
    severity: "error",
    meaning: "A frontmatter field is missing or has an invalid enum value.",
    hint: "Required frontmatter: `kind: playbook`, non-empty `title`, non-empty single-line `summary`, `persona`, `stack` of `build`|`run`, `status` of `proposed`|`accepted`|`deprecated`, `schema`, and `workflowSchema`.",
  },
  "PB-DEP-003": {
    severity: "error",
    meaning: "A step references an unknown dependency identifier.",
    hint: "Every `uses` and `requires` entry must name an `id` declared in the `## Dependencies` registry block; steps never redefine a dependency inline.",
  },
  "PB-DEP-004": {
    severity: "warning",
    meaning: "A declared dependency is never referenced.",
    hint: "Reference the dependency from a step via `uses` or `requires`, or remove it from the `## Dependencies` registry. A Playbook may keep an environmental prerequisite no single step consumes; this stays a warning, not an error.",
  },
  "PB-WF-005": {
    severity: "error",
    meaning: "A deterministic step declares neither an operation nor a command.",
    hint: "A step whose `mode` is `deterministic` must declare either `operation: <registry identifier>` or `command: { run: ... }`.",
  },
  "PB-WF-006": {
    severity: "error",
    meaning: "A routing target is not a defined step identifier.",
    hint: "Routing targets must be `stop` or the `id` of a step defined in the same workflow contract block.",
  },
  "PB-FILE-007": {
    severity: "warning",
    meaning: "A legacy filename should be renamed to the `*.playbook.md` form.",
    hint: "Rename the file from `<slug>.md` to `<slug>.playbook.md`; the plain form with `kind: playbook` is deprecated.",
  },
  "PB-FM-008": {
    severity: "error",
    meaning: "The YAML frontmatter block is missing or cannot be parsed.",
    hint: "Start the file with a `---` fenced YAML frontmatter block containing the required Playbook fields.",
  },
  "PB-DEP-009": {
    severity: "error",
    meaning: "The dependencies block is missing, not exactly one per section, or malformed.",
    hint: "Declare dependencies in `## Dependencies` as exactly one fenced block with the info string `playbook` carrying a top-level `dependencies:` list of entries with fields `id`, `kind`, `requirement`, optional `probe`, `source`, `used_by`, `fallback`.",
  },
  "PB-WF-010": {
    severity: "error",
    meaning: "The workflow contract is not exactly one `playbook` fenced block inside `## Workflow`.",
    hint: "Declare exactly one fenced block with the info string `playbook` (not `yaml`) carrying the `workflow` header and `steps` inside the `## Workflow` section.",
  },
  "PB-WF-011": {
    severity: "error",
    meaning: "The workflow contract block content is not parseable workflow YAML.",
    hint: "The `playbook` block carries YAML-shaped content with a `workflow` header mapping and a `steps` sequence of step mappings.",
  },
  "PB-FM-012": {
    severity: "error",
    meaning: "The frontmatter `persona` does not match the containing persona folder.",
    hint: "A Playbook is persona-scoped: the `persona` frontmatter value must match the `docs/assets/playbooks/<persona-slug>/` folder that contains the file.",
  },
  "PB-DOC-013": {
    severity: "error",
    meaning: "A required narrative section is empty.",
    hint: "Every required narrative section (`## Purpose`, `## When To Use`, `## Inputs`, `## Step Guidance`, `## Gates`, `## Outputs`, `## Validation`, `## Packaging Notes`) must be present and non-empty.",
  },
  "PB-DEP-014": {
    severity: "error",
    meaning: "A dependency declares a kind or requirement outside the fixed enumeration.",
    hint: "`kind` is one of `cli`, `script`, `mcp`, `skill`, `plugin`, `playbook`, `reference`, `package-manager`, `external-service`, or the optional `asset`; `requirement` is one of `required`, `optional`, `preferred`, `conditional`.",
  },
  "PB-DEP-015": {
    severity: "error",
    meaning: "A dependency id is empty or duplicates another registry entry.",
    hint: "Every dependency entry declares a non-empty `id` that is unique within the Playbook.",
  },
  "PB-WF-016": {
    severity: "error",
    meaning: "The workflow header is missing a required field or has an invalid routing value.",
    hint: "The workflow header declares `id`, `state_model` (for example `make-docs.workflow-state.v1`), and optionally `routing` of `linear` or `graph` (defaulting to `linear`).",
  },
  "PB-WF-017": {
    severity: "error",
    meaning: "A step dimension is missing or outside its fixed value set.",
    hint: "Each step declares `executor` (`cli`, `script`, `agent`, `human`, `mcp`, `child-playbook`), `role` (`activity`, `decision`, `gate`, `check`, `handoff`), and `activation` (`sequential`, `event-bound`); `mode` is `deterministic`, `delegated`, or `manual` and defaults to `delegated`.",
  },
  "PB-WF-018": {
    severity: "error",
    meaning: "A step is missing a required field.",
    hint: "Every step declares a stable `id` and a short human-readable `title`; a step whose `activation` is `event-bound` must also declare an `event`.",
  },
  "PB-WF-019": {
    severity: "error",
    meaning: "A gate step is missing its gate semantics.",
    hint: "A step whose `role` is `gate` must declare a `gate` block with `resolved_by` (who may resolve the gate), `evidence` (what evidence is required), and `unattended` (whether unattended continuation is allowed).",
  },
  "PB-WF-020": {
    severity: "error",
    meaning: "A step declares an invalid invocation, such as more than one form or a malformed command.",
    hint: "A step declares at most one invocation form among `operation` (a stable operation registry identifier), `command: { run: ... }` (external tools only), or `instructions` (agent/human executors).",
  },
  "PB-WF-021": {
    severity: "error",
    meaning: "A step id duplicates another step in the same workflow.",
    hint: "Step `id` values are stable and unique within the workflow contract block.",
  },
  "PB-DEP-022": {
    severity: "error",
    meaning: "A `requires` reference targets an `optional` dependency.",
    hint: "`requires` is a hard precondition and contradicts a dependency declared with `Requirement` `optional`; use `uses`, or raise the dependency's requirement.",
  },
  "PB-WF-023": {
    severity: "error",
    meaning: "An event name is not in the known event set.",
    hint: "`event` names a logical lifecycle event from the known set: `on-session-start`, `on-session-end`, `on-user-prompt-submit`, `on-pre-tool-use`, `on-post-tool-use`, `on-pre-commit`, `on-post-commit`, `on-pre-push`.",
  },
  "PB-WF-024": {
    severity: "error",
    meaning: "An orchestration policy field has an invalid shape.",
    hint: "`requires_capabilities` and `prefers_capabilities` are lists of harness-capability identifier strings; `child_playbooks` is one of `none`, `serial`, `parallel`; `concurrency` is one of `serial`, `parallel-allowed`, `parallel-required`. Shape only — runtime semantics are owned by the Run Playbook orchestration lineage.",
  },
  // -------------------------------------------------------------------------
  // W18 R12 clean v2 break: pointed old-form errors (PRD 34 R-MIG-2..3) and
  // the dependencies-block field rules (R-DEP-1..2). No old form parses to a
  // model; each diagnostic names the exact v2 replacement shape.
  // -------------------------------------------------------------------------
  "PB-DEP-025": {
    severity: "error",
    meaning: "The removed v1 dependency Markdown table is declared under `## Dependencies`.",
    hint: "The v1 dependency table was replaced by the `dependencies` YAML block in schema v2; declare dependencies as one fenced `playbook` block with a top-level `dependencies:` list of entries with fields `id`, `kind`, `requirement`, optional `probe` (defaulting to `id`), `source`, `used_by`, `fallback`.",
  },
  "PB-FM-026": {
    severity: "error",
    meaning: "A removed v1 frontmatter version key is declared.",
    hint: "The v1 keys were renamed in schema v2: declare `schema` instead of `schemaVersion` and `workflowSchema` instead of `workflowSchemaVersion`, values unchanged.",
  },
  "PB-DOC-027": {
    severity: "error",
    meaning: "A removed v1 required-heading spelling is used.",
    hint: "The v1 heading spellings were simplified in schema v2: `## Inputs And Authority` became `## Inputs`, `## Workflow Contract` became `## Workflow`, `## Gates And Decisions` became `## Gates`, and `## Outputs And Handoff` became `## Outputs`.",
  },
  "PB-FM-028": {
    severity: "error",
    meaning: "The document schema identifier is not the v2 identifier.",
    hint: "The parser reads only documents declaring `schema: make-docs.playbook.v2`; the v1 identifier `make-docs.playbook.v1` is not accepted.",
  },
  "PB-DOC-029": {
    severity: "error",
    meaning: "A `playbook` fence's top-level key does not match its governed section.",
    hint: "The block inside `## Dependencies` declares the top-level key `dependencies`; the block inside `## Workflow` declares the `workflow` header and `steps`.",
  },
  "PB-DEP-030": {
    severity: "error",
    meaning: "A declared dependency `probe` does not match the executable-token pattern.",
    hint: "`probe` is the executable or reference target generated dependency checks verify (defaulting to `id`); when declared it must be a single executable token such as `git` or `@scope/tool`, never prose.",
  },
} as const satisfies Record<string, PlaybookDiagnosticDescriptor>;

export type PlaybookDiagnosticCode = keyof typeof PLAYBOOK_DIAGNOSTIC_CATALOG;

export interface PlaybookDiagnosticLocation {
  /** Section label such as `frontmatter`, `## Dependencies`, or `## Workflow`. */
  section: string | null;
  /** Field path within the section, such as `stack` or `steps[2].requires`. */
  field: string | null;
  span: SourceSpan | null;
}

export interface PlaybookDiagnostic {
  code: PlaybookDiagnosticCode;
  severity: PlaybookDiagnosticSeverity;
  message: string;
  hint: string;
  location: PlaybookDiagnosticLocation;
}

export function createPlaybookDiagnostic(
  code: PlaybookDiagnosticCode,
  options: {
    message: string;
    hint?: string;
    section?: string | null;
    field?: string | null;
    span?: SourceSpan | null;
  },
): PlaybookDiagnostic {
  const descriptor = PLAYBOOK_DIAGNOSTIC_CATALOG[code];
  return {
    code,
    severity: descriptor.severity,
    message: options.message,
    hint: options.hint ?? descriptor.hint,
    location: {
      section: options.section ?? null,
      field: options.field ?? null,
      span: options.span ?? null,
    },
  };
}

export function hasPlaybookErrors(diagnostics: readonly PlaybookDiagnostic[]): boolean {
  return diagnostics.some((diagnostic) => diagnostic.severity === "error");
}

/**
 * Runnable is derived from diagnostics: a Playbook model is runnable only
 * when there are zero errors (R-MODEL-3, fail-closed for execution). Phase 3
 * re-derives the flag with the same helper after layered validation appends
 * its diagnostics.
 */
export function derivePlaybookRunnable(diagnostics: readonly PlaybookDiagnostic[]): boolean {
  return !hasPlaybookErrors(diagnostics);
}
