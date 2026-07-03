/**
 * Two-granularities distributable model (W18 R8 P1, R-CAP-3/R-CAP-4/R-CAP-5).
 *
 * Authoring granularity and distribution granularity are separate: one
 * Playbook projects to exactly one skill (the authoring unit); a distributable
 * is the distribution unit containing one or more skills plus the agentics
 * the Playbook's steps imply; a bundle is multiple Playbooks compiled into
 * one distributable with multiple skills. `outputKind` `plugin` maps onto the
 * native profile (the harness's richest native container per its descriptor —
 * a plugin, an extension, or another container) and `skills-bundle` maps onto
 * the portable agents-standard profile.
 *
 * Container selection and degradation are adapter-side, descriptor-driven
 * behavior: the richest container the harness supports for the chosen profile
 * is selected, the Playbook's implied agentics are mapped onto the harness's
 * supported primitives, and the unsupported case is handled explicitly —
 * degrade to a documented manual step or skill instruction, or fail closed
 * with an unsupported-surface stop — with the choice declared in the plan and
 * provenance, never silent.
 *
 * Implementer decisions recorded here:
 * - Implied agentics derive from the W18 R6 Playbook model's step dimensions
 *   and typed dependency registry: event-bound steps imply a `hook`; `mcp`
 *   executors and `mcp` dependencies imply an `mcp-server`; `plugin` and
 *   `skill` dependencies imply their primitive; `playbook` dependencies and
 *   `child-playbook` executors imply an additional `skill` (bundled or
 *   referenced per R-DEPMAT-1). Derivation is fail-soft: a Playbook without a
 *   parseable workflow contract implies no step agentics.
 * - Degradation form is deterministic: unsupported `hook` agentics degrade to
 *   a documented skill instruction (the behavior lives in the skill text);
 *   all other unsupported primitives degrade to a documented manual step.
 * - The default unsupported-primitive policy is `fail-closed`; `degrade` must
 *   be chosen explicitly so the declared choice is always a real decision.
 */

import type { PlaybookDependencyKind, PlaybookKnownEvent, PlaybookModel } from "../../playbook";
import { OperationError } from "../types";
import type {
  DistributableProfile,
  HarnessAgenticPrimitive,
  HarnessCapabilityDescriptor,
  HarnessContainerDeclaration,
  HarnessContainerKind,
} from "./capability-descriptor";
import { profileForOutputKind } from "./capability-descriptor";
import type {
  PackagePlanStop,
  PlaybookPackageOutputKind,
  SourcePlaybookRef,
} from "./types";

export const UNSUPPORTED_PRIMITIVE_POLICIES = ["degrade", "fail-closed"] as const;
export type UnsupportedPrimitivePolicy = (typeof UNSUPPORTED_PRIMITIVE_POLICIES)[number];
export const DEFAULT_UNSUPPORTED_PRIMITIVE_POLICY: UnsupportedPrimitivePolicy = "fail-closed";

export const AGENTIC_LOWERING_DISPOSITIONS = [
  "native",
  "degraded-manual-step",
  "degraded-skill-instruction",
  "fail-closed",
] as const;
export type AgenticLoweringDisposition = (typeof AGENTIC_LOWERING_DISPOSITIONS)[number];

export const CONTAINER_SELECTION_STATUSES = ["ready", "degraded", "unsupported"] as const;
export type ContainerSelectionStatus = (typeof CONTAINER_SELECTION_STATUSES)[number];

/** One Playbook projected to one skill — the authoring unit (R-CAP-3). */
export interface PlaybookSkillProjection {
  skillId: string;
  sourceRef: string;
  sourceDigest: string;
  title: string;
  summary: string | null;
}

/** An agentic primitive a Playbook's steps or dependencies imply (R-CAP-3). */
export interface ImpliedAgentic {
  primitive: HarnessAgenticPrimitive;
  sourceRef: string;
  stepId: string | null;
  /** Logical lifecycle event for `hook` agentics; null otherwise. */
  event: string | null;
  reason: string;
}

/** The declared lowering of one implied agentic onto the harness (R-CAP-4). */
export interface AgenticLowering {
  agentic: ImpliedAgentic;
  disposition: AgenticLoweringDisposition;
  /** Concrete harness hook point for natively lowered `hook` agentics (R-CAP-5). */
  hookPoint: string | null;
  /** Human-readable declaration of the choice — never silent (R-CAP-4). */
  declaration: string;
}

export interface PackageContainerSelection {
  status: ContainerSelectionStatus;
  harnessId: string;
  profile: DistributableProfile;
  outputKind: PlaybookPackageOutputKind;
  containerId: string | null;
  containerKind: HarnessContainerKind | null;
  policy: UnsupportedPrimitivePolicy;
  lowerings: AgenticLowering[];
  /** Declarations for every degraded lowering, surfaced in the reviewed plan. */
  declaredDegradations: string[];
  stops: PackagePlanStop[];
}

/** The distribution unit: one or more skills plus implied agentics (R-CAP-3). */
export interface PackageDistributable {
  profile: DistributableProfile;
  /** True when multiple Playbooks compile into one distributable. */
  bundle: boolean;
  skills: PlaybookSkillProjection[];
  impliedAgentics: ImpliedAgentic[];
  containerSelection: PackageContainerSelection;
}

/** Projects one source Playbook to exactly one skill (R-CAP-3). */
export function projectPlaybookToSkill(
  source: SourcePlaybookRef,
  model?: PlaybookModel | null,
): PlaybookSkillProjection {
  const summary = model?.frontmatter.summary?.value;
  return {
    skillId: source.slug,
    sourceRef: source.ref,
    sourceDigest: source.sourceDigest,
    title: source.title ?? model?.frontmatter.title?.value ?? source.slug,
    summary: summary && summary.length > 0 ? summary : null,
  };
}

const DEPENDENCY_PRIMITIVES: Partial<Record<PlaybookDependencyKind, HarnessAgenticPrimitive>> = {
  mcp: "mcp-server",
  plugin: "plugin",
  skill: "skill",
  playbook: "skill",
};

/**
 * Derives the agentics a Playbook's steps imply from the parsed W18 R6 model
 * (R-CAP-3). The model is consumed as-is — never re-parsed (R-SCOPE-1).
 */
export function deriveImpliedAgentics(input: {
  model: PlaybookModel;
  sourceRef: string;
}): ImpliedAgentic[] {
  const agentics: ImpliedAgentic[] = [];
  const seen = new Set<string>();
  const push = (agentic: ImpliedAgentic): void => {
    const key = [agentic.primitive, agentic.event ?? "", agentic.stepId ?? "", agentic.reason].join("|");
    if (!seen.has(key)) {
      seen.add(key);
      agentics.push(agentic);
    }
  };

  for (const step of input.model.workflow?.steps ?? []) {
    const stepId = step.id?.value ?? null;
    if (step.activation.value === "event-bound") {
      push({
        primitive: "hook",
        sourceRef: input.sourceRef,
        stepId,
        event: step.event?.value ?? null,
        reason: `Step ${stepId ?? "(unnamed)"} is event-bound${step.event?.value ? ` to ${step.event.value}` : " without a declared event"}.`,
      });
    }
    if (step.executor.value === "mcp") {
      push({
        primitive: "mcp-server",
        sourceRef: input.sourceRef,
        stepId,
        event: null,
        reason: `Step ${stepId ?? "(unnamed)"} executes through an MCP server.`,
      });
    }
    if (step.executor.value === "child-playbook") {
      push({
        primitive: "skill",
        sourceRef: input.sourceRef,
        stepId,
        event: null,
        reason: `Step ${stepId ?? "(unnamed)"} invokes a child Playbook as a skill.`,
      });
    }
  }

  for (const dependency of input.model.dependencies.byId.values()) {
    const kind = dependency.kind.value;
    const primitive = kind ? DEPENDENCY_PRIMITIVES[kind] : undefined;
    if (primitive) {
      push({
        primitive,
        sourceRef: input.sourceRef,
        stepId: null,
        event: null,
        reason: `Dependency \`${dependency.id.value}\` (kind ${kind}) implies a ${primitive}.`,
      });
    }
  }

  return agentics;
}

/**
 * Adapter-side container selection (R-CAP-4, R-CAP-5): pick the richest
 * container the harness supports for the chosen profile and map every implied
 * agentic onto the harness's supported primitives, degrading or failing
 * closed — always declared — where the harness lacks a primitive or hook
 * point.
 */
export function selectPackageContainer(input: {
  descriptor: HarnessCapabilityDescriptor;
  outputKind: PlaybookPackageOutputKind;
  impliedAgentics: ImpliedAgentic[];
  policy?: UnsupportedPrimitivePolicy;
}): PackageContainerSelection {
  const policy = input.policy ?? DEFAULT_UNSUPPORTED_PRIMITIVE_POLICY;
  const profile = profileForOutputKind(input.outputKind);
  const candidates = input.descriptor.containers.filter(
    (container) => container.profile === profile,
  );
  if (candidates.length === 0) {
    return {
      status: "unsupported",
      harnessId: input.descriptor.harnessId,
      profile,
      outputKind: input.outputKind,
      containerId: null,
      containerKind: null,
      policy,
      lowerings: [],
      declaredDegradations: [],
      stops: [
        {
          reason: "unsupported-output-kind",
          message: `Harness \`${input.descriptor.harnessId}\` declares no ${profile}-profile container for ${input.outputKind} outputs.`,
        },
      ],
    };
  }
  const container = pickRichestContainer(candidates);

  const lowerings: AgenticLowering[] = [];
  const declaredDegradations: string[] = [];
  const stops: PackagePlanStop[] = [];
  for (const agentic of input.impliedAgentics) {
    const lowering = lowerAgentic({
      agentic,
      container,
      descriptor: input.descriptor,
      policy,
    });
    lowerings.push(lowering);
    if (
      lowering.disposition === "degraded-manual-step" ||
      lowering.disposition === "degraded-skill-instruction"
    ) {
      declaredDegradations.push(lowering.declaration);
    }
    if (lowering.disposition === "fail-closed") {
      stops.push({ reason: "unsupported-surface", message: lowering.declaration });
    }
  }

  return {
    status: stops.length > 0 ? "unsupported" : declaredDegradations.length > 0 ? "degraded" : "ready",
    harnessId: input.descriptor.harnessId,
    profile,
    outputKind: input.outputKind,
    containerId: container.containerId,
    containerKind: container.kind,
    policy,
    lowerings,
    declaredDegradations,
    stops,
  };
}

/**
 * Builds the distributable for a package: skills at authoring granularity,
 * implied agentics, and the declared container selection (R-CAP-3, R-CAP-4).
 * A null descriptor (unknown harness) fails closed with a declared stop
 * rather than a silent pass-through (R-ADAPT-5).
 */
export function buildPackageDistributable(input: {
  harnessId: string;
  descriptor: HarnessCapabilityDescriptor | null;
  outputKind: PlaybookPackageOutputKind;
  skills: PlaybookSkillProjection[];
  impliedAgentics: ImpliedAgentic[];
  policy?: UnsupportedPrimitivePolicy;
}): PackageDistributable {
  if (input.skills.length === 0) {
    throw new OperationError("A distributable must contain at least one skill (R-CAP-3).");
  }
  const skills = disambiguateSkillIds(input.skills);
  const policy = input.policy ?? DEFAULT_UNSUPPORTED_PRIMITIVE_POLICY;
  const profile = profileForOutputKind(input.outputKind);
  const containerSelection = input.descriptor
    ? selectPackageContainer({
        descriptor: input.descriptor,
        outputKind: input.outputKind,
        impliedAgentics: input.impliedAgentics,
        policy,
      })
    : {
        status: "unsupported" as const,
        harnessId: input.harnessId,
        profile,
        outputKind: input.outputKind,
        containerId: null,
        containerKind: null,
        policy,
        lowerings: [],
        declaredDegradations: [],
        stops: [
          {
            reason: "unsupported-surface" as const,
            message: `No harness capability descriptor is registered for \`${input.harnessId}\`; packaging fails closed before writes.`,
          },
        ],
      };
  return {
    profile,
    bundle: skills.length > 1,
    skills,
    impliedAgentics: input.impliedAgentics,
    containerSelection,
  };
}

function pickRichestContainer(
  candidates: HarnessContainerDeclaration[],
): HarnessContainerDeclaration {
  let richest = candidates[0]!;
  for (const candidate of candidates.slice(1)) {
    if (candidate.richness > richest.richness) {
      richest = candidate;
    }
  }
  return richest;
}

function lowerAgentic(input: {
  agentic: ImpliedAgentic;
  container: HarnessContainerDeclaration;
  descriptor: HarnessCapabilityDescriptor;
  policy: UnsupportedPrimitivePolicy;
}): AgenticLowering {
  const { agentic, container, descriptor, policy } = input;
  const primitiveSupported =
    descriptor.supportedPrimitives.includes(agentic.primitive) &&
    container.hostedPrimitives.includes(agentic.primitive);

  if (agentic.primitive === "hook") {
    const binding = agentic.event
      ? descriptor.lifecycleEventMap[agentic.event as PlaybookKnownEvent]
      : undefined;
    if (primitiveSupported && binding) {
      return {
        agentic,
        disposition: "native",
        hookPoint: binding.hookPoint,
        declaration: `Event-bound step ${agentic.stepId ?? "(unnamed)"} compiles to the ${descriptor.harnessId} \`${binding.hookPoint}\` hook point (R-CAP-5).`,
      };
    }
    const gap = primitiveSupported
      ? `does not map lifecycle event \`${agentic.event ?? "(missing event)"}\` to a hook point`
      : "does not support hooks";
    return degradeOrStop({
      agentic,
      policy,
      degradedDisposition: "degraded-skill-instruction",
      declaration:
        policy === "degrade"
          ? `Harness \`${descriptor.harnessId}\` ${gap}; event-bound step ${agentic.stepId ?? "(unnamed)"} degrades to a documented skill instruction (R-CAP-4).`
          : `Harness \`${descriptor.harnessId}\` ${gap}; event-bound step ${agentic.stepId ?? "(unnamed)"} fails closed with an unsupported-surface stop (R-CAP-4).`,
    });
  }

  if (primitiveSupported) {
    return {
      agentic,
      disposition: "native",
      hookPoint: null,
      declaration: `Container \`${container.containerId}\` hosts the ${agentic.primitive} primitive natively.`,
    };
  }
  return degradeOrStop({
    agentic,
    policy,
    degradedDisposition: "degraded-manual-step",
    declaration:
      policy === "degrade"
        ? `Harness \`${descriptor.harnessId}\` does not host the ${agentic.primitive} primitive; the behavior degrades to a documented manual step (R-CAP-4). ${agentic.reason}`
        : `Harness \`${descriptor.harnessId}\` does not host the ${agentic.primitive} primitive; packaging fails closed with an unsupported-surface stop (R-CAP-4). ${agentic.reason}`,
  });
}

function degradeOrStop(input: {
  agentic: ImpliedAgentic;
  policy: UnsupportedPrimitivePolicy;
  degradedDisposition: Extract<
    AgenticLoweringDisposition,
    "degraded-manual-step" | "degraded-skill-instruction"
  >;
  declaration: string;
}): AgenticLowering {
  return {
    agentic: input.agentic,
    disposition: input.policy === "degrade" ? input.degradedDisposition : "fail-closed",
    hookPoint: null,
    declaration: input.declaration,
  };
}

/**
 * Skill ids stay the Playbook slug; only colliding slugs across personas gain
 * a deterministic persona qualifier so one Playbook always names one skill.
 */
function disambiguateSkillIds(skills: PlaybookSkillProjection[]): PlaybookSkillProjection[] {
  const counts = new Map<string, number>();
  for (const skill of skills) {
    counts.set(skill.skillId, (counts.get(skill.skillId) ?? 0) + 1);
  }
  return skills.map((skill) => {
    if ((counts.get(skill.skillId) ?? 0) <= 1) {
      return skill;
    }
    const [persona] = skill.sourceRef.split("/", 1);
    return { ...skill, skillId: `${persona}-${skill.skillId}` };
  });
}
