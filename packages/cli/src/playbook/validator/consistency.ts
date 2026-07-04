/**
 * Consistency validation layer (R-DEP-4, R-MODEL-4).
 *
 * A `requires` reference is a hard precondition and may not target a
 * dependency declared `optional` (PB-DEP-022); event names are drawn from the
 * known event set (PB-WF-023); and a declared dependency that is never
 * referenced is a warning, not an error, since a Playbook may declare an
 * environmental prerequisite that no single step consumes (PB-DEP-004).
 */

import { createPlaybookDiagnostic, type PlaybookDiagnostic } from "../diagnostics";
import { PLAYBOOK_KNOWN_EVENTS, type PlaybookModel } from "../model";

const DEPENDENCIES_SECTION = "## Dependencies";
const WORKFLOW_SECTION = "## Workflow";

/** Consistency layer entry point. */
export function validateConsistencyLayer(
  model: PlaybookModel,
  diagnostics: PlaybookDiagnostic[],
): void {
  for (const [stepIndex, step] of (model.workflow?.steps ?? []).entries()) {
    const stepLabel = step.id?.value ?? `steps[${stepIndex}]`;

    for (const reference of step.requires) {
      if (reference.registryEntry?.requirement.value === "optional") {
        diagnostics.push(
          createPlaybookDiagnostic("PB-DEP-022", {
            message: `Step \`${stepLabel}\` declares \`requires: ${reference.id}\`, but \`${reference.id}\` is declared \`optional\`; a hard precondition contradicts an optional dependency.`,
            section: WORKFLOW_SECTION,
            field: `steps[${stepIndex}].requires`,
            span: reference.span,
          }),
        );
      }
    }

    if (
      step.event &&
      !(PLAYBOOK_KNOWN_EVENTS as readonly string[]).includes(step.event.value)
    ) {
      diagnostics.push(
        createPlaybookDiagnostic("PB-WF-023", {
          message: `Step \`${stepLabel}\` declares event \`${step.event.value}\`, which is not in the known event set (${PLAYBOOK_KNOWN_EVENTS.join(", ")}).`,
          section: WORKFLOW_SECTION,
          field: `steps[${stepIndex}].event`,
          span: step.event.span,
        }),
      );
    }
  }

  // Unreferenced declared dependencies: evaluated over the first declaration
  // of each identifier; duplicate rows are a PB-DEP-015 from the registry
  // layer and are not double-reported as unreferenced.
  for (const entry of model.dependencies.byId.values()) {
    if (entry.referencedBy.length === 0) {
      diagnostics.push(
        createPlaybookDiagnostic("PB-DEP-004", {
          message: `Dependency \`${entry.id.value}\` is declared but never referenced by a step's \`uses\` or \`requires\`.`,
          section: DEPENDENCIES_SECTION,
          field: `${entry.id.value}.id`,
          span: entry.id.span ?? entry.span,
        }),
      );
    }
  }
}
