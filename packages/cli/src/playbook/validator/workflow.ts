/**
 * Workflow validation layer (R-WF-3, R-WF-4, R-WF-5, R-MODEL-4).
 *
 * The single `playbook` fenced block and its YAML shape are enforced at parse
 * time (PB-WF-010, PB-WF-011); this layer validates the parsed workflow:
 * header fields (PB-WF-016), the step dimension enums (PB-WF-017), per-mode
 * and per-activation required fields — `id`, `title`, and `event` for
 * event-bound steps (PB-WF-018) — gate semantics for gate steps (PB-WF-019),
 * the at-most-one invocation form rule (PB-WF-020), and the deterministic
 * `operation`-or-`command` requirement (PB-WF-005).
 */

import { createPlaybookDiagnostic, type PlaybookDiagnostic } from "../diagnostics";
import {
  PLAYBOOK_STEP_ACTIVATIONS,
  PLAYBOOK_STEP_EXECUTORS,
  PLAYBOOK_STEP_MODES,
  PLAYBOOK_STEP_ROLES,
  PLAYBOOK_WORKFLOW_ROUTING_MODES,
  type PlaybookModel,
  type PlaybookStep,
} from "../model";
import type { SourceSpan, SpannedEnum } from "../source-span";

const WORKFLOW_SECTION = "## Workflow";

function requireHeaderField(
  value: { value: string } | null,
  field: string,
  span: SourceSpan | null,
  diagnostics: PlaybookDiagnostic[],
): void {
  if (!value) {
    diagnostics.push(
      createPlaybookDiagnostic("PB-WF-016", {
        message: `The workflow header is missing its required \`${field}\` field.`,
        section: WORKFLOW_SECTION,
        field: `workflow.${field}`,
        span,
      }),
    );
  }
}

function validateDimension<T extends string>(
  dimension: SpannedEnum<T>,
  name: string,
  allowed: readonly T[],
  step: PlaybookStep,
  stepIndex: number,
  stepLabel: string,
  diagnostics: PlaybookDiagnostic[],
): void {
  if (dimension.value !== null) {
    return;
  }
  const message =
    dimension.raw === null
      ? `Step \`${stepLabel}\` is missing its \`${name}\` dimension; it must be one of ${allowed.join(", ")}.`
      : `Step \`${stepLabel}\` declares \`${name}\` \`${dimension.raw}\`, which is not one of ${allowed.join(", ")}.`;
  diagnostics.push(
    createPlaybookDiagnostic("PB-WF-017", {
      message,
      section: WORKFLOW_SECTION,
      field: `steps[${stepIndex}].${name}`,
      span: dimension.span ?? step.span,
    }),
  );
}

function validateGate(
  step: PlaybookStep,
  stepIndex: number,
  stepLabel: string,
  diagnostics: PlaybookDiagnostic[],
): void {
  if (!step.gate) {
    diagnostics.push(
      createPlaybookDiagnostic("PB-WF-019", {
        message: `Gate step \`${stepLabel}\` declares no \`gate\` block; a gate declares who may resolve it, what evidence is required, and whether unattended continuation is allowed.`,
        section: WORKFLOW_SECTION,
        field: `steps[${stepIndex}].gate`,
        span: step.span,
      }),
    );
    return;
  }
  const missing: string[] = [];
  if (!step.gate.resolvedBy) {
    missing.push("resolved_by");
  }
  if (!step.gate.evidence) {
    missing.push("evidence");
  }
  if (step.gate.unattended === null) {
    missing.push("unattended");
  }
  for (const field of missing) {
    diagnostics.push(
      createPlaybookDiagnostic("PB-WF-019", {
        message: `Gate step \`${stepLabel}\` is missing the \`gate.${field}\` declaration.`,
        section: WORKFLOW_SECTION,
        field: `steps[${stepIndex}].gate.${field}`,
        span: step.gate.span ?? step.span,
      }),
    );
  }
}

function validateInvocations(
  step: PlaybookStep,
  stepIndex: number,
  stepLabel: string,
  diagnostics: PlaybookDiagnostic[],
): void {
  if (step.invocations.length > 1) {
    diagnostics.push(
      createPlaybookDiagnostic("PB-WF-020", {
        message: `Step \`${stepLabel}\` declares ${step.invocations.length} invocation forms (${step.invocations.map((invocation) => invocation.form).join(", ")}); at most one of \`operation\`, \`command\`, or \`instructions\` is allowed.`,
        section: WORKFLOW_SECTION,
        field: `steps[${stepIndex}]`,
        span: step.invocations[1]!.span ?? step.span,
      }),
    );
  }
  for (const invocation of step.invocations) {
    const payload =
      invocation.form === "operation"
        ? invocation.operation
        : invocation.form === "command"
          ? invocation.commandRun
          : invocation.instructions;
    if (!payload || !payload.value.trim()) {
      const detail =
        invocation.form === "command"
          ? "`command` must declare `run` with the external command line"
          : `\`${invocation.form}\` must carry a non-empty value`;
      diagnostics.push(
        createPlaybookDiagnostic("PB-WF-020", {
          message: `Step \`${stepLabel}\` declares a malformed \`${invocation.form}\` invocation: ${detail}.`,
          section: WORKFLOW_SECTION,
          field: `steps[${stepIndex}].${invocation.form}`,
          span: invocation.span ?? step.span,
        }),
      );
    }
  }
  if (
    step.mode.value === "deterministic" &&
    !step.invocations.some(
      (invocation) => invocation.form === "operation" || invocation.form === "command",
    )
  ) {
    diagnostics.push(
      createPlaybookDiagnostic("PB-WF-005", {
        message: `Deterministic step \`${stepLabel}\` declares neither an \`operation\` nor a \`command\`.`,
        section: WORKFLOW_SECTION,
        field: `steps[${stepIndex}]`,
        span: step.span,
      }),
    );
  }
}

/** Workflow layer entry point; each step reports independently. */
export function validateWorkflowLayer(
  model: PlaybookModel,
  diagnostics: PlaybookDiagnostic[],
): void {
  const workflow = model.workflow;
  if (!workflow) {
    // A missing or unparseable workflow block is already a PB-WF-010/011.
    return;
  }

  const headerSpan = workflow.header.span ?? workflow.span;
  requireHeaderField(workflow.header.id, "id", headerSpan, diagnostics);
  requireHeaderField(workflow.header.stateModel, "state_model", headerSpan, diagnostics);
  if (workflow.header.routing.value === null) {
    diagnostics.push(
      createPlaybookDiagnostic("PB-WF-016", {
        message: `The workflow header declares \`routing\` \`${workflow.header.routing.raw ?? ""}\`, which is not one of ${PLAYBOOK_WORKFLOW_ROUTING_MODES.join(", ")}.`,
        section: WORKFLOW_SECTION,
        field: "workflow.routing",
        span: workflow.header.routing.span ?? headerSpan,
      }),
    );
  }

  for (const [stepIndex, step] of workflow.steps.entries()) {
    const stepLabel = step.id?.value ?? `steps[${stepIndex}]`;

    for (const field of ["id", "title"] as const) {
      if (!step[field]) {
        diagnostics.push(
          createPlaybookDiagnostic("PB-WF-018", {
            message: `Step \`${stepLabel}\` is missing its required \`${field}\` field.`,
            section: WORKFLOW_SECTION,
            field: `steps[${stepIndex}].${field}`,
            span: step.span,
          }),
        );
      }
    }

    validateDimension(step.executor, "executor", PLAYBOOK_STEP_EXECUTORS, step, stepIndex, stepLabel, diagnostics);
    validateDimension(step.role, "role", PLAYBOOK_STEP_ROLES, step, stepIndex, stepLabel, diagnostics);
    validateDimension(step.activation, "activation", PLAYBOOK_STEP_ACTIVATIONS, step, stepIndex, stepLabel, diagnostics);
    validateDimension(step.mode, "mode", PLAYBOOK_STEP_MODES, step, stepIndex, stepLabel, diagnostics);

    if (step.activation.value === "event-bound" && !step.event) {
      diagnostics.push(
        createPlaybookDiagnostic("PB-WF-018", {
          message: `Event-bound step \`${stepLabel}\` is missing its required \`event\` field.`,
          section: WORKFLOW_SECTION,
          field: `steps[${stepIndex}].event`,
          span: step.activation.span ?? step.span,
        }),
      );
    }

    if (step.role.value === "gate") {
      validateGate(step, stepIndex, stepLabel, diagnostics);
    }

    validateInvocations(step, stepIndex, stepLabel, diagnostics);
  }
}
