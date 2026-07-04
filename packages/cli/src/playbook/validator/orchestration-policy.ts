/**
 * Orchestration policy shape validation (R-WF-8).
 *
 * The optional workflow-header orchestration policy is validated for presence
 * and shape only: `requires_capabilities` and `prefers_capabilities` are
 * lists of harness-capability identifier strings, `child_playbooks` is one of
 * `none`/`serial`/`parallel`, and `concurrency` is one of
 * `serial`/`parallel-allowed`/`parallel-required` (PB-WF-024). Runtime
 * semantics and the canonical harness-capability identifier set are owned by
 * the Run Playbook orchestration lineage and are never evaluated here.
 */

import { createPlaybookDiagnostic, type PlaybookDiagnostic } from "../diagnostics";
import {
  PLAYBOOK_CHILD_PLAYBOOK_POLICIES,
  PLAYBOOK_CONCURRENCY_POLICIES,
  type PlaybookModel,
  type PlaybookOrchestrationPolicy,
} from "../model";
import type { SpannedEnum } from "../source-span";

const WORKFLOW_SECTION = "## Workflow";

function isCapabilityList(value: unknown): boolean {
  if (typeof value === "string") {
    return value.trim().length > 0;
  }
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((item) => typeof item === "string" && item.trim().length > 0)
  );
}

function validateCapabilityList(
  policy: PlaybookOrchestrationPolicy,
  field: "requires_capabilities" | "prefers_capabilities",
  diagnostics: PlaybookDiagnostic[],
): void {
  if (!(field in policy.raw)) {
    return;
  }
  if (!isCapabilityList(policy.raw[field])) {
    diagnostics.push(
      createPlaybookDiagnostic("PB-WF-024", {
        message: `Orchestration policy \`${field}\` must be a non-empty list of harness-capability identifier strings.`,
        section: WORKFLOW_SECTION,
        field: `workflow.${field}`,
        span: policy.fieldSpans[field] ?? null,
      }),
    );
  }
}

function validatePolicyEnum<T extends string>(
  declared: SpannedEnum<T> | null,
  field: "child_playbooks" | "concurrency",
  allowed: readonly T[],
  policy: PlaybookOrchestrationPolicy,
  diagnostics: PlaybookDiagnostic[],
): void {
  if (declared === null || declared.value !== null) {
    return;
  }
  diagnostics.push(
    createPlaybookDiagnostic("PB-WF-024", {
      message: `Orchestration policy \`${field}\` is \`${declared.raw ?? String(policy.raw[field] ?? "")}\`, which is not one of ${allowed.join(", ")}.`,
      section: WORKFLOW_SECTION,
      field: `workflow.${field}`,
      span: declared.span ?? policy.fieldSpans[field] ?? null,
    }),
  );
}

/** Orchestration policy layer entry point; shape only, never semantics. */
export function validateOrchestrationPolicyLayer(
  model: PlaybookModel,
  diagnostics: PlaybookDiagnostic[],
): void {
  const policy = model.workflow?.header.policy ?? null;
  if (!policy) {
    return;
  }
  validateCapabilityList(policy, "requires_capabilities", diagnostics);
  validateCapabilityList(policy, "prefers_capabilities", diagnostics);
  validatePolicyEnum(
    policy.childPlaybooks,
    "child_playbooks",
    PLAYBOOK_CHILD_PLAYBOOK_POLICIES,
    policy,
    diagnostics,
  );
  validatePolicyEnum(
    policy.concurrency,
    "concurrency",
    PLAYBOOK_CONCURRENCY_POLICIES,
    policy,
    diagnostics,
  );
}
