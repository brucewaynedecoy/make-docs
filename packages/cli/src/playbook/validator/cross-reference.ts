/**
 * Cross-reference integrity layer (R-DEP-4, R-MODEL-4).
 *
 * Cross-reference integrity is bidirectional. The resolve parser stage
 * already enforces that every `uses`/`requires` reference resolves to a
 * registry `ID` (PB-DEP-003) and that every routing target resolves to a
 * defined step `id` (PB-WF-006), linking the model as it goes; this layer
 * adds the remaining integrity rule the resolved model carries the evidence
 * for: no step `id` may be duplicated within the workflow (PB-WF-021).
 */

import { createPlaybookDiagnostic, type PlaybookDiagnostic } from "../diagnostics";
import type { PlaybookModel } from "../model";

const WORKFLOW_SECTION = "## Workflow Contract";

/** Cross-reference layer entry point. */
export function validateCrossReferenceLayer(
  model: PlaybookModel,
  diagnostics: PlaybookDiagnostic[],
): void {
  const workflow = model.workflow;
  if (!workflow) {
    return;
  }

  const seen = new Set<string>();
  for (const [stepIndex, step] of workflow.steps.entries()) {
    const id = step.id?.value;
    if (!id) {
      // A missing step id is a PB-WF-018 from the workflow layer.
      continue;
    }
    if (seen.has(id)) {
      diagnostics.push(
        createPlaybookDiagnostic("PB-WF-021", {
          message: `Step id \`${id}\` is declared more than once; step ids are unique within the workflow.`,
          section: WORKFLOW_SECTION,
          field: `steps[${stepIndex}].id`,
          span: step.id?.span ?? step.span,
        }),
      );
    } else {
      seen.add(id);
    }
  }
}
