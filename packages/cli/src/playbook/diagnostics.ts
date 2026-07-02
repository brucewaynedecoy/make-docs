/**
 * Playbook diagnostic types and the shared diagnostic catalog.
 *
 * Every diagnostic carries a stable code, a severity, a precise location
 * naming the section, field, and source span, a message, and an
 * expected-shape or fix hint (R-MODEL-5).
 *
 * This module declares the codes that parsing itself emits. The layered
 * semantic validator (W18 R6 Phase 3) extends the SAME catalog by adding its
 * entries to `PLAYBOOK_DIAGNOSTIC_CATALOG` below; `PlaybookDiagnosticCode`
 * widens automatically via `keyof`, and `createPlaybookDiagnostic` picks up
 * new codes with no other change. The contract-reserved validator codes
 * PB-DEP-004 (warning, unreferenced dependency) and PB-WF-005 (error,
 * deterministic step without operation or command) belong to Phase 3 and are
 * intentionally not declared here; parser-structural codes continue the
 * numbering from PB-FM-008 so Phase 3 can continue from PB-*-012 onward
 * without collision.
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
    hint: "The body must carry the eleven-heading spine in order: `# <Title>`, `## Purpose`, `## When To Use`, `## Inputs And Authority`, `## Dependencies`, `## Workflow Contract`, `## Step Guidance`, `## Gates And Decisions`, `## Outputs And Handoff`, `## Validation`, `## Packaging Notes`. Unknown `##` sections are only allowed after the required spine.",
  },
  "PB-FM-002": {
    severity: "error",
    meaning: "A frontmatter field is missing or has an invalid enum value.",
    hint: "Required frontmatter: `kind: playbook`, non-empty `title`, non-empty single-line `summary`, `persona`, `stack` of `build`|`run`, `status` of `proposed`|`accepted`|`deprecated`, `schemaVersion`, and `workflowSchemaVersion`.",
  },
  "PB-DEP-003": {
    severity: "error",
    meaning: "A step references an unknown dependency identifier.",
    hint: "Every `uses` and `requires` entry must name an `ID` declared in the `## Dependencies` registry table; steps never redefine a dependency inline.",
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
    meaning: "The dependency registry table is missing or does not match the six-column schema.",
    hint: "Declare dependencies in `## Dependencies` as a Markdown table with exactly the columns `ID`, `Kind`, `Requirement`, `Source`, `Used By`, `Fallback`.",
  },
  "PB-WF-010": {
    severity: "error",
    meaning: "The workflow contract is not exactly one `playbook` fenced block inside `## Workflow Contract`.",
    hint: "Declare exactly one fenced block with the info string `playbook` (not `yaml`) inside the `## Workflow Contract` section.",
  },
  "PB-WF-011": {
    severity: "error",
    meaning: "The workflow contract block content is not parseable workflow YAML.",
    hint: "The `playbook` block carries YAML-shaped content with a `workflow` header mapping and a `steps` sequence of step mappings.",
  },
} as const satisfies Record<string, PlaybookDiagnosticDescriptor>;

export type PlaybookDiagnosticCode = keyof typeof PLAYBOOK_DIAGNOSTIC_CATALOG;

export interface PlaybookDiagnosticLocation {
  /** Section label such as `frontmatter`, `## Dependencies`, or `## Workflow Contract`. */
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
