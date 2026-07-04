/**
 * Parser stage 6: resolve cross-references (R-DEP-4, R-MODEL-3).
 *
 * Links every step `uses`/`requires` reference to the dependency registry
 * record it names — never leaving it a bare string — and resolves routing
 * targets to defined step ids. An unknown dependency identifier is a
 * PB-DEP-003 error; an unresolved routing target is a PB-WF-006 error.
 * Consistency-layer rules (requires-versus-optional contradictions,
 * unreferenced-dependency warnings, duplicate step ids) belong to the Phase 3
 * validator; the resolved model carries everything it needs, including the
 * `referencedBy` back-links on registry records.
 */

import { createPlaybookDiagnostic, type PlaybookDiagnostic } from "../diagnostics";
import type {
  PlaybookDependencyReference,
  PlaybookDependencyRegistry,
  PlaybookRoutingTarget,
  PlaybookStep,
  PlaybookWorkflow,
} from "../model";

const WORKFLOW_SECTION = "## Workflow";

function resolveDependencyReferences(
  references: PlaybookDependencyReference[],
  step: PlaybookStep,
  stepIndex: number,
  registry: PlaybookDependencyRegistry,
  diagnostics: PlaybookDiagnostic[],
): void {
  for (const reference of references) {
    const entry = registry.byId.get(reference.id);
    if (entry) {
      reference.registryEntry = entry;
      const stepId = step.id?.value ?? `steps[${stepIndex}]`;
      if (!entry.referencedBy.includes(stepId)) {
        entry.referencedBy.push(stepId);
      }
      continue;
    }
    diagnostics.push(
      createPlaybookDiagnostic("PB-DEP-003", {
        message: `Step \`${step.id?.value ?? stepIndex + 1}\` references unknown dependency identifier \`${reference.id}\`.`,
        section: WORKFLOW_SECTION,
        field: `steps[${stepIndex}].${reference.refType}`,
        span: reference.span,
      }),
    );
  }
}

function resolveRoutingTarget(
  target: PlaybookRoutingTarget | null,
  step: PlaybookStep,
  stepIndex: number,
  field: string,
  stepIds: Set<string>,
  diagnostics: PlaybookDiagnostic[],
): void {
  if (!target || target.kind === "stop") {
    return;
  }
  if (stepIds.has(target.raw)) {
    target.stepId = target.raw;
    target.resolved = true;
    return;
  }
  diagnostics.push(
    createPlaybookDiagnostic("PB-WF-006", {
      message: `Step \`${step.id?.value ?? stepIndex + 1}\` routes to \`${target.raw}\`, which is not a defined step identifier.`,
      section: WORKFLOW_SECTION,
      field: `steps[${stepIndex}].routing.${field}`,
      span: target.span,
    }),
  );
}

/** Stage 6 entry point; mutates the workflow and registry records in place. */
export function resolveCrossReferencesStage(
  registry: PlaybookDependencyRegistry,
  workflow: PlaybookWorkflow | null,
  diagnostics: PlaybookDiagnostic[],
): void {
  if (!workflow) {
    return;
  }

  const stepIds = new Set<string>();
  for (const step of workflow.steps) {
    if (step.id?.value) {
      stepIds.add(step.id.value);
    }
  }

  for (const [stepIndex, step] of workflow.steps.entries()) {
    resolveDependencyReferences(step.uses, step, stepIndex, registry, diagnostics);
    resolveDependencyReferences(step.requires, step, stepIndex, registry, diagnostics);

    if (step.routing) {
      resolveRoutingTarget(step.routing.onSuccess, step, stepIndex, "on_success", stepIds, diagnostics);
      resolveRoutingTarget(step.routing.onFailure, step, stepIndex, "on_failure", stepIds, diagnostics);
      for (const [branchIndex, branch] of step.routing.branch.entries()) {
        resolveRoutingTarget(
          branch.target,
          step,
          stepIndex,
          `branch[${branchIndex}]`,
          stepIds,
          diagnostics,
        );
      }
    }
  }
}
