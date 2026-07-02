/**
 * Parser stage 5: locate and parse the single `playbook` workflow contract
 * block (R-WF-1, R-WF-3..R-WF-5, R-WF-8).
 *
 * Exactly one fenced block with the info string `playbook` (a `yaml` info
 * string does not count) must sit inside `## Workflow Contract`; zero or more
 * than one is a PB-WF-010 error. The block content is YAML-shaped: a
 * `workflow` header mapping and a `steps` sequence. Dimension and policy
 * tokens outside the fixed sets are preserved raw for the Phase 3
 * workflow-layer validator; this stage diagnoses only what stops it from
 * producing typed content (PB-WF-011).
 */

import { parseDocument } from "yaml";
import type { Node } from "yaml";
import { createPlaybookDiagnostic, type PlaybookDiagnostic } from "../diagnostics";
import {
  PLAYBOOK_CHILD_PLAYBOOK_POLICIES,
  PLAYBOOK_CONCURRENCY_POLICIES,
  PLAYBOOK_DEFAULT_STEP_MODE,
  PLAYBOOK_DEFAULT_WORKFLOW_ROUTING_MODE,
  PLAYBOOK_ORCHESTRATION_POLICY_FIELDS,
  PLAYBOOK_STEP_ACTIVATIONS,
  PLAYBOOK_STEP_EXECUTORS,
  PLAYBOOK_STEP_MODES,
  PLAYBOOK_STEP_ROLES,
  PLAYBOOK_WORKFLOW_BLOCK_INFO,
  PLAYBOOK_WORKFLOW_ROUTING_MODES,
  type PlaybookDependencyReference,
  type PlaybookDependencyReferenceType,
  type PlaybookGateSemantics,
  type PlaybookOrchestrationPolicy,
  type PlaybookRoutingBranch,
  type PlaybookRoutingTarget,
  type PlaybookStep,
  type PlaybookStepInput,
  type PlaybookStepInvocation,
  type PlaybookStepOutput,
  type PlaybookStepRouting,
  type PlaybookStepSafety,
  type PlaybookStepValidation,
  type PlaybookWorkflow,
  type PlaybookWorkflowHeader,
} from "../model";
import {
  LineIndex,
  spannedEnum,
  type SourceSpan,
  type Spanned,
} from "../source-span";
import type { BodySection } from "./headings";
import type { FencedBlock } from "./markdown-scan";
import {
  mapEntries,
  nodeSpan,
  nodeToPlain,
  scalarBoolean,
  scalarString,
  seqItems,
  stringList,
  type YamlEntry,
} from "./yaml-nodes";

const WORKFLOW_SECTION = "## Workflow Contract";

function entryMap(entries: YamlEntry[]): Map<string, YamlEntry> {
  return new Map(entries.map((entry) => [entry.key, entry]));
}

function rawRecord(entries: YamlEntry[]): Record<string, unknown> {
  const raw: Record<string, unknown> = {};
  for (const entry of entries) {
    raw[entry.key] = entry.value;
  }
  return raw;
}

function stringField(entry: YamlEntry | undefined, base: number, index: LineIndex): Spanned<string> | null {
  if (!entry) {
    return null;
  }
  return scalarString(entry.node, base, index);
}

function dependencyReferences(
  entry: YamlEntry | undefined,
  refType: PlaybookDependencyReferenceType,
  base: number,
  index: LineIndex,
): PlaybookDependencyReference[] {
  if (!entry) {
    return [];
  }
  return stringList(entry.node, base, index).map((item) => ({
    id: item.value,
    refType,
    registryEntry: null,
    span: item.span,
  }));
}

function routingTarget(value: Spanned<string>): PlaybookRoutingTarget {
  const isStop = value.value === "stop";
  return {
    raw: value.value,
    kind: isStop ? "stop" : "step",
    stepId: null,
    resolved: isStop,
    span: value.span,
  };
}

function parseRouting(
  entry: YamlEntry | undefined,
  base: number,
  index: LineIndex,
): PlaybookStepRouting | null {
  if (!entry) {
    return null;
  }
  const entries = mapEntries(entry.node, base, index);
  const byKey = entryMap(entries);
  const onSuccess = stringField(byKey.get("on_success"), base, index);
  const onFailure = stringField(byKey.get("on_failure"), base, index);
  const stop = byKey.has("stop") ? scalarBoolean(byKey.get("stop")!.node, base, index) : null;

  const branch: PlaybookRoutingBranch[] = [];
  const branchEntry = byKey.get("branch");
  if (branchEntry) {
    for (const item of seqItems(branchEntry.node, base, index)) {
      const itemEntries = entryMap(mapEntries(item.node, base, index));
      const condition =
        stringField(itemEntries.get("when"), base, index) ??
        stringField(itemEntries.get("condition"), base, index);
      const target =
        stringField(itemEntries.get("to"), base, index) ??
        stringField(itemEntries.get("target"), base, index);
      if (target) {
        branch.push({
          condition: condition?.value ?? null,
          target: routingTarget(target),
          span: item.span,
        });
      }
    }
    const scalarTarget = scalarString(branchEntry.node, base, index);
    if (scalarTarget) {
      branch.push({ condition: null, target: routingTarget(scalarTarget), span: scalarTarget.span });
    }
  }

  return {
    onSuccess: onSuccess ? routingTarget(onSuccess) : null,
    onFailure: onFailure ? routingTarget(onFailure) : null,
    branch,
    stop,
    span: entry.span,
  };
}

function parseGate(
  entry: YamlEntry | undefined,
  base: number,
  index: LineIndex,
): PlaybookGateSemantics | null {
  if (!entry) {
    return null;
  }
  const entries = mapEntries(entry.node, base, index);
  const byKey = entryMap(entries);
  return {
    resolvedBy: stringField(byKey.get("resolved_by"), base, index),
    evidence: stringField(byKey.get("evidence"), base, index),
    unattended: byKey.has("unattended")
      ? scalarBoolean(byKey.get("unattended")!.node, base, index)
      : null,
    raw: rawRecord(entries),
    span: entry.span,
  };
}

function parseValidation(
  entry: YamlEntry | undefined,
  base: number,
  index: LineIndex,
): PlaybookStepValidation | null {
  if (!entry) {
    return null;
  }
  const entries = mapEntries(entry.node, base, index);
  const byKey = entryMap(entries);
  const listOf = (...keys: string[]): Spanned<string>[] =>
    keys.flatMap((key) => {
      const found = byKey.get(key);
      return found ? stringList(found.node, base, index) : [];
    });
  return {
    expect: stringField(byKey.get("expect"), base, index),
    deterministicChecks: listOf("checks", "deterministic_checks"),
    humanReviewChecks: listOf("human_review", "human_review_checks"),
    completionEvidence: listOf("evidence", "completion_evidence"),
    raw: rawRecord(entries),
    span: entry.span,
  };
}

function parseSafety(
  entry: YamlEntry | undefined,
  base: number,
  index: LineIndex,
): PlaybookStepSafety | null {
  if (!entry) {
    return null;
  }
  const entries = mapEntries(entry.node, base, index);
  const byKey = entryMap(entries);
  const surfaces = byKey.get("mutation_surfaces") ?? byKey.get("mutates");
  return {
    mutationSurfaces: surfaces ? stringList(surfaces.node, base, index) : [],
    dryRun: stringField(byKey.get("dry_run"), base, index),
    approval: stringField(byKey.get("approval"), base, index),
    rollback: stringField(byKey.get("rollback"), base, index) ?? stringField(byKey.get("backup"), base, index),
    raw: rawRecord(entries),
    span: entry.span,
  };
}

function parseInputs(
  entry: YamlEntry | undefined,
  base: number,
  index: LineIndex,
): PlaybookStepInput[] {
  if (!entry) {
    return [];
  }
  const inputs: PlaybookStepInput[] = [];
  for (const item of seqItems(entry.node, base, index)) {
    const scalar = scalarString(item.node, base, index);
    if (scalar) {
      inputs.push({ name: scalar, defaultValue: null, whenMissing: null, span: scalar.span });
      continue;
    }
    const itemEntries = entryMap(mapEntries(item.node, base, index));
    const name = stringField(itemEntries.get("name"), base, index);
    if (!name) {
      continue;
    }
    const defaultEntry = itemEntries.get("default");
    inputs.push({
      name,
      defaultValue: defaultEntry
        ? { value: nodeToPlain(defaultEntry.node), span: defaultEntry.span }
        : null,
      whenMissing:
        stringField(itemEntries.get("when_missing"), base, index) ??
        stringField(itemEntries.get("on_missing"), base, index),
      span: item.span,
    });
  }
  // Mapping form: `inputs: { name: { default: ..., when_missing: ... } }`.
  for (const item of mapEntries(entry.node, base, index)) {
    const fields = entryMap(mapEntries(item.node, base, index));
    const defaultEntry = fields.get("default");
    const scalarDefault = scalarString(item.node, base, index);
    inputs.push({
      name: { value: item.key, span: item.keySpan },
      defaultValue: defaultEntry
        ? { value: nodeToPlain(defaultEntry.node), span: defaultEntry.span }
        : scalarDefault
          ? { value: scalarDefault.value, span: scalarDefault.span }
          : null,
      whenMissing:
        stringField(fields.get("when_missing"), base, index) ??
        stringField(fields.get("on_missing"), base, index),
      span: item.span,
    });
  }
  return inputs;
}

function parseOutputs(
  entry: YamlEntry | undefined,
  base: number,
  index: LineIndex,
): PlaybookStepOutput[] {
  if (!entry) {
    return [];
  }
  return stringList(entry.node, base, index).map((item) => ({ name: item, span: item.span }));
}

function parseInvocations(
  byKey: Map<string, YamlEntry>,
  base: number,
  index: LineIndex,
): PlaybookStepInvocation[] {
  const invocations: PlaybookStepInvocation[] = [];
  const operationEntry = byKey.get("operation");
  if (operationEntry) {
    invocations.push({
      form: "operation",
      operation: stringField(operationEntry, base, index),
      commandRun: null,
      instructions: null,
      span: operationEntry.span,
    });
  }
  const commandEntry = byKey.get("command");
  if (commandEntry) {
    const commandFields = entryMap(mapEntries(commandEntry.node, base, index));
    invocations.push({
      form: "command",
      operation: null,
      commandRun: stringField(commandFields.get("run"), base, index),
      instructions: null,
      span: commandEntry.span,
    });
  }
  const instructionsEntry = byKey.get("instructions");
  if (instructionsEntry) {
    invocations.push({
      form: "instructions",
      operation: null,
      commandRun: null,
      instructions: stringField(instructionsEntry, base, index),
      span: instructionsEntry.span,
    });
  }
  return invocations;
}

function enumField<T extends string>(
  entry: YamlEntry | undefined,
  allowed: readonly T[],
  base: number,
  index: LineIndex,
  defaultValue: T | null = null,
) {
  const scalar = entry ? scalarString(entry.node, base, index) : null;
  return spannedEnum(scalar?.value ?? null, allowed, scalar?.span ?? null, defaultValue);
}

function parseStep(
  node: Node | null,
  span: SourceSpan | null,
  fallbackSpan: SourceSpan,
  base: number,
  index: LineIndex,
): PlaybookStep {
  const entries = mapEntries(node, base, index);
  const byKey = entryMap(entries);
  return {
    id: stringField(byKey.get("id"), base, index),
    title: stringField(byKey.get("title"), base, index),
    executor: enumField(byKey.get("executor"), PLAYBOOK_STEP_EXECUTORS, base, index),
    role: enumField(byKey.get("role"), PLAYBOOK_STEP_ROLES, base, index),
    activation: enumField(byKey.get("activation"), PLAYBOOK_STEP_ACTIVATIONS, base, index),
    mode: enumField(byKey.get("mode"), PLAYBOOK_STEP_MODES, base, index, PLAYBOOK_DEFAULT_STEP_MODE),
    event: stringField(byKey.get("event"), base, index),
    uses: dependencyReferences(byKey.get("uses"), "uses", base, index),
    requires: dependencyReferences(byKey.get("requires"), "requires", base, index),
    inputs: parseInputs(byKey.get("inputs"), base, index),
    outputs: parseOutputs(byKey.get("outputs"), base, index),
    invocations: parseInvocations(byKey, base, index),
    routing: parseRouting(byKey.get("routing"), base, index),
    gate: parseGate(byKey.get("gate"), base, index),
    validation: parseValidation(byKey.get("validation"), base, index),
    safety: parseSafety(byKey.get("safety"), base, index),
    raw: rawRecord(entries),
    span: span ?? fallbackSpan,
  };
}

function parseHeader(
  entry: YamlEntry | undefined,
  base: number,
  index: LineIndex,
  diagnostics: PlaybookDiagnostic[],
  blockSpan: SourceSpan,
): PlaybookWorkflowHeader {
  const entries = entry ? mapEntries(entry.node, base, index) : [];
  if (!entry || entries.length === 0) {
    diagnostics.push(
      createPlaybookDiagnostic("PB-WF-011", {
        message: "The workflow contract block must declare a `workflow` header mapping.",
        section: WORKFLOW_SECTION,
        field: "workflow",
        span: entry?.span ?? blockSpan,
      }),
    );
  }
  const byKey = entryMap(entries);
  const hasPolicy = PLAYBOOK_ORCHESTRATION_POLICY_FIELDS.some((key) => byKey.has(key));
  let policy: PlaybookOrchestrationPolicy | null = null;
  if (hasPolicy) {
    const raw: PlaybookOrchestrationPolicy["raw"] = {};
    const fieldSpans: PlaybookOrchestrationPolicy["fieldSpans"] = {};
    for (const key of PLAYBOOK_ORCHESTRATION_POLICY_FIELDS) {
      const found = byKey.get(key);
      if (found) {
        raw[key] = found.value;
        fieldSpans[key] = found.span;
      }
    }
    policy = {
      requiresCapabilities: byKey.has("requires_capabilities")
        ? stringList(byKey.get("requires_capabilities")!.node, base, index)
        : [],
      prefersCapabilities: byKey.has("prefers_capabilities")
        ? stringList(byKey.get("prefers_capabilities")!.node, base, index)
        : [],
      childPlaybooks: byKey.has("child_playbooks")
        ? enumField(byKey.get("child_playbooks"), PLAYBOOK_CHILD_PLAYBOOK_POLICIES, base, index)
        : null,
      concurrency: byKey.has("concurrency")
        ? enumField(byKey.get("concurrency"), PLAYBOOK_CONCURRENCY_POLICIES, base, index)
        : null,
      raw,
      fieldSpans,
    };
  }
  return {
    id: stringField(byKey.get("id"), base, index),
    stateModel: stringField(byKey.get("state_model"), base, index),
    routing: enumField(
      byKey.get("routing"),
      PLAYBOOK_WORKFLOW_ROUTING_MODES,
      base,
      index,
      PLAYBOOK_DEFAULT_WORKFLOW_ROUTING_MODE,
    ),
    policy,
    span: entry?.span ?? null,
  };
}

/** Stage 5 entry point. */
export function parseWorkflowBlockStage(
  source: string,
  bodyOffset: number,
  section: BodySection | null,
  fencedBlocks: FencedBlock[],
  index: LineIndex,
  diagnostics: PlaybookDiagnostic[],
): PlaybookWorkflow | null {
  const playbookBlocks = fencedBlocks.filter(
    (block) => block.info === PLAYBOOK_WORKFLOW_BLOCK_INFO,
  );
  const inSection = (block: FencedBlock): boolean =>
    section !== null &&
    bodyOffset + block.openStart >= section.contentStart &&
    bodyOffset + block.openStart < section.contentEnd;

  if (playbookBlocks.length === 0) {
    diagnostics.push(
      createPlaybookDiagnostic("PB-WF-010", {
        message:
          "No `playbook` fenced workflow contract block was found; exactly one is required inside `## Workflow Contract` (a `yaml` info string does not count).",
        section: WORKFLOW_SECTION,
        span: section
          ? index.spanBetween(section.contentStart, section.contentEnd)
          : null,
      }),
    );
    return null;
  }
  if (playbookBlocks.length > 1) {
    const extra = playbookBlocks[1]!;
    diagnostics.push(
      createPlaybookDiagnostic("PB-WF-010", {
        message: `Found ${playbookBlocks.length} \`playbook\` fenced blocks; exactly one is required.`,
        section: WORKFLOW_SECTION,
        span: index.spanBetween(bodyOffset + extra.openStart, bodyOffset + extra.openEnd),
      }),
    );
  }

  const block = playbookBlocks.find(inSection) ?? playbookBlocks[0]!;
  if (!inSection(block)) {
    diagnostics.push(
      createPlaybookDiagnostic("PB-WF-010", {
        message: "The `playbook` workflow contract block must sit inside the `## Workflow Contract` section.",
        section: WORKFLOW_SECTION,
        span: index.spanBetween(bodyOffset + block.openStart, bodyOffset + block.openEnd),
      }),
    );
  }

  const contentBase = bodyOffset + block.contentStart;
  const content = source.slice(contentBase, bodyOffset + block.contentEnd);
  const blockSpan = index.spanBetween(contentBase, bodyOffset + block.contentEnd);

  const document = parseDocument(content);
  if (document.errors.length > 0) {
    for (const error of document.errors) {
      const [errorStart, errorEnd] = error.pos;
      diagnostics.push(
        createPlaybookDiagnostic("PB-WF-011", {
          message: `The workflow contract block is not parseable YAML: ${error.message.split("\n")[0]}`,
          section: WORKFLOW_SECTION,
          span: index.spanBetween(contentBase + errorStart, contentBase + errorEnd),
        }),
      );
    }
    return null;
  }

  const rootEntries = mapEntries((document.contents ?? null) as Node | null, contentBase, index);
  if (rootEntries.length === 0) {
    diagnostics.push(
      createPlaybookDiagnostic("PB-WF-011", {
        message: "The workflow contract block must be a mapping with `workflow` and `steps`.",
        section: WORKFLOW_SECTION,
        span: blockSpan,
      }),
    );
    return null;
  }
  const byKey = entryMap(rootEntries);

  const header = parseHeader(byKey.get("workflow"), contentBase, index, diagnostics, blockSpan);

  const stepsEntry = byKey.get("steps");
  const stepItems = stepsEntry ? seqItems(stepsEntry.node, contentBase, index) : [];
  if (!stepsEntry || stepItems.length === 0) {
    diagnostics.push(
      createPlaybookDiagnostic("PB-WF-011", {
        message: "The workflow contract block must declare a non-empty `steps` sequence.",
        section: WORKFLOW_SECTION,
        field: "steps",
        span: stepsEntry?.span ?? blockSpan,
      }),
    );
  }

  const steps: PlaybookStep[] = [];
  for (const [position, item] of stepItems.entries()) {
    const entries = mapEntries(item.node, contentBase, index);
    if (entries.length === 0) {
      diagnostics.push(
        createPlaybookDiagnostic("PB-WF-011", {
          message: `Step ${position + 1} must be a mapping of step fields.`,
          section: WORKFLOW_SECTION,
          field: `steps[${position}]`,
          span: item.span ?? blockSpan,
        }),
      );
      continue;
    }
    steps.push(parseStep(item.node, item.span, blockSpan, contentBase, index));
  }

  return { header, steps, span: blockSpan };
}
