/**
 * The packaging compiler: lowers Playbook models plus a reviewed package plan
 * into the multi-file, harness-native distributable inventory (W18 R8 P2,
 * R-COMP-1, R-COMP-3).
 *
 * The inventory is a pure function of the Playbook model and the target: the
 * capability descriptor supplies the container layout (paths, manifest
 * filename, skill file template, registration files, lifecycle event map —
 * R-CAP-2), the W18 R6 model supplies the rich step, dependency, and
 * narrative content (consumed as the parsed model, never re-parsed from
 * Markdown — R-SCOPE-1), and the reviewed plan supplies the semantic fields
 * whose agent-assisted proposals gained authority on plan acceptance
 * (R-GEN-1). The compiler emits, as applicable: a `SKILL.md` per source
 * Playbook, copied or linked references, deterministic helper and
 * dependency-check scripts, the harness-native manifest, hooks from
 * event-bound steps, tool and dependency declarations, registration files
 * (generated, never auto-registered — R-MKT-1; the install seam is Phase 4),
 * and lifecycle, conformance, and provenance records.
 *
 * File-organization decisions within the harness layout constraints
 * (implementer freedom, D9), recorded here:
 * - Containers with a harness manifest place skills at the descriptor's
 *   `skillFileTemplate` (`skills/{skillId}/SKILL.md` for the first-party
 *   descriptors). `skills-directory` containers are themselves the skill
 *   directory: a single-skill distributable puts `SKILL.md` at the container
 *   root so direct `.agents/skills/{id}/SKILL.md` discovery holds
 *   (R-ADAPT-2); a multi-skill bundle emits a root index `SKILL.md` plus one
 *   `{skillId}/SKILL.md` per member skill per the template.
 * - Shared supporting files live at the container root: `references/` for
 *   copied authority sources, `checks/` for dependency-check scripts,
 *   `scripts/` for helper scripts, `hooks/hooks.json` for event bindings,
 *   and `registration/` for generated registration/marketplace files.
 * - Make Docs metadata rides in `.make-docs/` inside the container:
 *   `dependencies.json` (tool and dependency declarations plus runtime
 *   checks), `registration.json` (the generate-but-do-not-auto-register
 *   seam record for Phase 4), `provenance.json`, `lifecycle.json`, and
 *   `conformance.json`. None of these is the installable artifact and no
 *   emitted file carries a Make Docs `kind` as its manifest type (R-COMP-1).
 * - The harness manifest's `version` is a constant `0.1.0` until a
 *   versioning policy lands with the lifecycle lineage; every other manifest
 *   field derives deterministically from the plan and descriptor (R-GEN-1).
 * - Unit tests over this inventory assert shape only; real-harness
 *   recognition evidence is owned by the W18 R9 conformance lineage
 *   (R-TEST-5).
 */

import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  parseAndValidatePlaybook,
  type PlaybookModel,
  type PlaybookNarrativeSectionKey,
  type PlaybookStep,
} from "../../playbook";
// Compile-time registry consultation for `operation:` step invocations; the
// stable identifier is the reference, the CLI form is derived (R-SCOPE-1).
import { hasOperation, operationCliPath } from "../registry";
import type { JsonValue } from "../types";
import type {
  DistributableProfile,
  HarnessCapabilityDescriptor,
  HarnessContainerDeclaration,
  HarnessContainerKind,
} from "./capability-descriptor";
import type {
  AgenticLowering,
  PackageContainerSelection,
  PackageDistributable,
} from "./distributable";
import {
  buildPackageDistributable,
  deriveImpliedAgentics,
  projectPlaybookToSkill,
  type PlaybookSkillProjection,
} from "./distributable";
import {
  materializeDependency,
  type MaterializedDependency,
} from "./materialization";
import {
  MARKETPLACE_AUTO_REGISTRATION_CONFIG_HOME,
  MARKETPLACE_AUTO_REGISTRATION_CONFIG_KEY,
} from "./registration-seam";
import {
  bindPackageSupportTuple,
  listUnboundSupportTupleDimensions,
} from "./support-binding";
import type {
  PackagePlanStop,
  PlaybookPackagePlan,
  SourcePlaybookRef,
} from "./types";

export const PACKAGE_INVENTORY_CATEGORIES = [
  "skill",
  "reference",
  "helper-script",
  "dependency-check",
  "harness-manifest",
  "hooks",
  "registration",
  "dependency-declarations",
  "registration-record",
  "provenance-record",
  "lifecycle-record",
  "conformance-record",
] as const;
export type PackageInventoryCategory = (typeof PACKAGE_INVENTORY_CATEGORIES)[number];

/** R-GEN-1 generation tiers a compiled file's semantic content can carry. */
export type PackageGenerationTier = "deterministic" | "agent-proposed";

export interface PackageInventoryFile {
  /** Path relative to the container root. */
  path: string;
  content: string;
  executable: boolean;
  category: PackageInventoryCategory;
  /**
   * The generation tier of the file's semantic content (R-GEN-1): files whose
   * prose came from an approved agent-assisted proposal are `agent-proposed`;
   * everything else is a deterministic function of model, plan, and target.
   */
  tier: PackageGenerationTier;
  sourceRefs: string[];
}

export interface CompiledSourcePlaybook {
  source: SourcePlaybookRef;
  model: PlaybookModel;
  sourceText: string;
}

export interface PackageInventory {
  containerId: string | null;
  containerKind: HarnessContainerKind | null;
  profile: DistributableProfile;
  /** Container-relative path of the harness-native manifest; null when the container has none. */
  manifestPath: string | null;
  /** Container-relative skill file path per skill id. */
  skillPaths: Record<string, string>;
  files: PackageInventoryFile[];
  dependencies: MaterializedDependency[];
  stops: PackagePlanStop[];
}

export interface CompilePackageInventoryInput {
  repoRoot: string;
  plan: PlaybookPackagePlan;
  descriptor: HarnessCapabilityDescriptor | null;
  sources: CompiledSourcePlaybook[];
}

const MANIFEST_VERSION = "0.1.0";

// ---------------------------------------------------------------------------
// Source loading
// ---------------------------------------------------------------------------

export function digestPlaybookSource(content: Buffer | string): string {
  return `sha256:${createHash("sha256").update(content).digest("hex")}`;
}

/** Reads and parses one plan source through the single Playbook parser (R-SCOPE-1). */
export function loadCompiledSource(input: {
  repoRoot: string;
  source: SourcePlaybookRef;
}): CompiledSourcePlaybook {
  const sourceText = readFileSync(path.join(input.repoRoot, input.source.path), "utf8");
  const { model } = parseAndValidatePlaybook({
    sourcePath: input.source.path,
    source: sourceText,
  });
  return { source: input.source, model, sourceText };
}

/**
 * Loads the plan's sources for a write, failing closed — before any write —
 * when a source is missing or its digest no longer matches the reviewed plan
 * (R-GEN-2: the reviewed plan must describe the sources actually compiled).
 */
export function loadPackageSourcesForWrite(input: {
  repoRoot: string;
  plan: PlaybookPackagePlan;
}): { sources: CompiledSourcePlaybook[]; stops: PackagePlanStop[] } {
  const sources: CompiledSourcePlaybook[] = [];
  const stops: PackagePlanStop[] = [];
  for (const source of input.plan.sources) {
    const absolutePath = path.join(input.repoRoot, source.path);
    if (!existsSync(absolutePath)) {
      stops.push({
        reason: "source-invalid",
        message: `Source Playbook ${source.ref} at ${source.path} no longer exists.`,
        ref: source.ref,
        path: source.path,
      });
      continue;
    }
    const raw = readFileSync(absolutePath);
    const digest = digestPlaybookSource(raw);
    if (digest !== source.sourceDigest) {
      stops.push({
        reason: "manual-review-required",
        message: `Source Playbook ${source.ref} changed since the plan was created (digest mismatch); re-plan before writing.`,
        ref: source.ref,
        path: source.path,
      });
      continue;
    }
    const sourceText = raw.toString("utf8");
    const { model } = parseAndValidatePlaybook({ sourcePath: source.path, source: sourceText });
    sources.push({ source, model, sourceText });
  }
  return { sources, stops };
}

// ---------------------------------------------------------------------------
// Inventory compilation
// ---------------------------------------------------------------------------

export function compilePackageInventory(input: CompilePackageInventoryInput): PackageInventory {
  const { plan, descriptor } = input;
  const distributable = plan.distributable ?? buildDistributableFromSources(input);
  const selection = distributable.containerSelection;
  const container = descriptor?.containers.find(
    (candidate) => candidate.containerId === selection.containerId,
  ) ?? null;
  const stops: PackagePlanStop[] = [...selection.stops];
  // Verification-status gate (W18 R8 P3, R-ADAPT-1): a plan carrying a
  // `validated` support claim against a harness whose contract verification
  // is not `verified` fails closed before any write — an unverified adapter
  // may produce only export-only or provisional output and must not carry a
  // support claim.
  if (
    plan.support.status === "validated" &&
    descriptor &&
    descriptor.verification.status !== "verified"
  ) {
    stops.push({
      reason: "missing-support-evidence",
      message: `Harness \`${descriptor.harnessId}\` has a ${descriptor.verification.status} (unverified) adapter contract and must not carry a support claim; output stays export-only or provisional until the contract is verified and W18 R9 conformance evidence exists (R-ADAPT-1, R-PROV-3).`,
    });
  }
  // Tuple-binding gate (W18 R8 P4, R-PROV-3): every support claim is bound to
  // the exact tuple of scenario, harness, surface, scope, output kind, model
  // or provider, and runtime. A `validated` claim whose tuple has unbound
  // dimensions fails closed before any write — the dimensions bind only
  // through W18 R9 conformance evidence, never through evidence refs alone.
  const supportTuple = plan.support.tuple ?? bindPackageSupportTuple({ target: plan.target });
  const unboundTupleDimensions = listUnboundSupportTupleDimensions(supportTuple);
  if (plan.support.status === "validated" && unboundTupleDimensions.length > 0) {
    stops.push({
      reason: "missing-support-evidence",
      message: `Support claim is not bound for tuple dimension(s) ${unboundTupleDimensions.join(", ")}; support claims stay provisional until W18 R9 conformance evidence binds the exact tuple (R-PROV-3).`,
    });
  }
  if (!descriptor || !container || selection.status === "unsupported") {
    if (stops.length === 0) {
      stops.push({
        reason: "unsupported-surface",
        message: `No harness capability descriptor or container resolved for \`${plan.target.harness}\`; packaging fails closed before writes (R-ADAPT-5).`,
      });
    }
    return {
      containerId: selection.containerId,
      containerKind: selection.containerKind,
      profile: distributable.profile,
      manifestPath: null,
      skillPaths: {},
      files: [],
      dependencies: [],
      stops,
    };
  }

  const skillIdByRef = new Map(
    distributable.skills.map((skill) => [skill.sourceRef, skill.skillId]),
  );
  const bundledRefs = new Set<string>();
  for (const source of plan.sources) {
    bundledRefs.add(source.ref);
    bundledRefs.add(source.slug);
  }

  // Dependency materialization per declared kind (R-DEPMAT-1).
  const dependencies: MaterializedDependency[] = [];
  for (const compiled of input.sources) {
    for (const dependency of compiled.model.dependencies.byId.values()) {
      dependencies.push(materializeDependency(dependency, {
        repoRoot: input.repoRoot,
        source: compiled.source,
        container,
        bundledRefs,
        skillIdByRef,
      }));
    }
  }
  stops.push(...dependencies.flatMap((dependency) => dependency.stops));

  const skillPaths = planSkillPaths(distributable.skills, container);
  const files: PackageInventoryFile[] = [];

  // Skill files: one SKILL.md per source Playbook, preserving intent,
  // triggers, step instructions, references, and safety boundaries (R-COMP-3).
  const compiledByRef = new Map(input.sources.map((compiled) => [compiled.source.ref, compiled]));
  for (const skill of distributable.skills) {
    const compiled = compiledByRef.get(skill.sourceRef);
    const skillPath = skillPaths[skill.skillId]!;
    const description = resolveSkillDescription({ skill, plan, stops });
    files.push({
      path: skillPath,
      content: renderSkillMarkdown({
        skill,
        description: description.value,
        compiled: compiled ?? null,
        dependencies: dependencies.filter((dependency) => dependency.sourceRef === skill.sourceRef),
        selection,
        relativePrefix: relativePrefixFor(skillPath),
      }),
      executable: false,
      category: "skill",
      tier: description.tier,
      sourceRefs: [skill.sourceRef],
    });
  }
  if (container.kind === "skills-directory" && distributable.skills.length > 1) {
    files.push({
      path: "SKILL.md",
      content: renderBundleIndexSkill({ plan, distributable, skillPaths }),
      executable: false,
      category: "skill",
      tier: plan.fieldProvenance.summary === "agent-proposed" ? "agent-proposed" : "deterministic",
      sourceRefs: plan.sources.map((source) => source.ref),
    });
  }

  // References and dependency-check scripts, deduplicated by path (a
  // dependency declared identically by two bundled Playbooks materializes once).
  const seenPaths = new Set(files.map((file) => file.path));
  for (const dependency of dependencies) {
    for (const file of dependency.files) {
      if (seenPaths.has(file.path)) {
        continue;
      }
      seenPaths.add(file.path);
      files.push({
        path: file.path,
        content: file.content,
        executable: file.executable,
        category: dependency.disposition === "copied-reference" ? "reference" : "dependency-check",
        tier: "deterministic",
        sourceRefs: [dependency.sourceRef],
      });
    }
  }

  // Deterministic helper scripts, only when a step needs one (R-COMP-3):
  // `script`-executor steps that declare an external `command` invocation.
  for (const compiled of input.sources) {
    for (const step of compiled.model.workflow?.steps ?? []) {
      const commandRun = step.invocations.find((invocation) => invocation.form === "command")
        ?.commandRun?.value;
      if (step.executor.value !== "script" || !commandRun) {
        continue;
      }
      const stepId = step.id?.value ?? "step";
      const helperPath = `scripts/${stepId}.sh`;
      if (seenPaths.has(helperPath)) {
        continue;
      }
      seenPaths.add(helperPath);
      files.push({
        path: helperPath,
        content: [
          "#!/bin/sh",
          "# Generated by Make Docs playbook packaging. Do not edit.",
          `# helper for step: ${stepId} (${compiled.source.ref})`,
          "set -eu",
          commandRun,
          "",
        ].join("\n"),
        executable: true,
        category: "helper-script",
        tier: "deterministic",
        sourceRefs: [compiled.source.ref],
      });
    }
  }

  // Hooks compiled from event-bound steps per the descriptor's lifecycle
  // event map (R-CAP-5); degraded events are documented in the skill text.
  const nativeHooks = selection.lowerings.filter(
    (lowering) => lowering.disposition === "native" && lowering.hookPoint !== null,
  );
  if (nativeHooks.length > 0) {
    files.push({
      path: "hooks/hooks.json",
      content: renderHooksFile({ nativeHooks, compiledByRef }),
      executable: false,
      category: "hooks",
      tier: "deterministic",
      sourceRefs: [...new Set(nativeHooks.map((lowering) => lowering.agentic.sourceRef))],
    });
  }

  // The harness-native manifest the target requires (R-COMP-3): its path and
  // structure come from the descriptor; it is never a Make Docs descriptor
  // (R-COMP-1). Shape stays provisional until Phase 3/W18 R9 verification.
  const manifestPath = container.layout.manifestFilename;
  if (manifestPath !== null) {
    files.push({
      path: manifestPath,
      content: renderHarnessManifest({
        plan,
        skillPaths,
        distributable,
        dependencies,
        container,
        hasHooksFile: nativeHooks.length > 0,
      }),
      executable: false,
      category: "harness-manifest",
      tier: plan.fieldProvenance.summary === "agent-proposed" ? "agent-proposed" : "deterministic",
      sourceRefs: plan.sources.map((source) => source.ref),
    });
  }

  // Registration and marketplace files: generated into the distributable,
  // never installed into a user's marketplace (R-MKT-1). Phase 4 owns the
  // config-gated registration seam; this emits the files it will consume.
  const registrationTargets = container.layout.registrationFiles;
  for (const target of registrationTargets) {
    files.push({
      path: `registration/${path.posix.basename(target)}`,
      content: renderRegistrationFile({ plan, descriptor, container, target }),
      executable: false,
      category: "registration",
      tier: "deterministic",
      sourceRefs: plan.sources.map((source) => source.ref),
    });
  }

  // Make Docs metadata records. These annotate the distributable; the
  // installable artifact is the harness-native tree above (R-COMP-1).
  if (dependencies.length > 0) {
    files.push(recordFile("dependency-declarations", ".make-docs/dependencies.json", {
      record: "make-docs.playbook-package.dependencies",
      schemaVersion: 1,
      dependencies: dependencies.map(dependencyDeclaration),
    }, plan));
  }
  if (registrationTargets.length > 0) {
    files.push(recordFile("registration-record", ".make-docs/registration.json", {
      record: "make-docs.playbook-package.registration",
      schemaVersion: 1,
      autoRegister: false,
      note: "Registration files are generated but never auto-installed (R-MKT-1); the config-gated opt-in seam is owned by the global store (R-MKT-2).",
      // The R-MKT-2 opt-in seam this record feeds: additive, off by default,
      // configuration home in the global store owned by the Runtime and
      // Global Store lineage. Only the key is named here; the store schema is
      // never defined by packaging (R-SCOPE-1).
      optInSeam: {
        configKey: MARKETPLACE_AUTO_REGISTRATION_CONFIG_KEY,
        configHome: MARKETPLACE_AUTO_REGISTRATION_CONFIG_HOME,
        default: "off",
      },
      files: registrationTargets.map((target) => ({
        generatedAt: `registration/${path.posix.basename(target)}`,
        installAt: target,
      })),
    }, plan));
  }

  const recordPaths = [
    ".make-docs/provenance.json",
    ".make-docs/lifecycle.json",
    ".make-docs/conformance.json",
  ];
  const generatedFiles = [...files.map((file) => file.path), ...recordPaths];
  // Per-artifact provenance (R-PROV-1): every generated file — the records
  // included — is traceable to its source refs, category, and generation
  // tier, not just the package as a whole.
  const recordCategories: Record<string, PackageInventoryCategory> = {
    ".make-docs/provenance.json": "provenance-record",
    ".make-docs/lifecycle.json": "lifecycle-record",
    ".make-docs/conformance.json": "conformance-record",
  };
  const fileProvenance = [
    ...files.map((file) => ({
      path: file.path,
      category: file.category,
      tier: file.tier,
      sourceRefs: file.sourceRefs,
    })),
    ...recordPaths.map((recordPath) => ({
      path: recordPath,
      category: recordCategories[recordPath]!,
      tier: "deterministic" as const,
      sourceRefs: plan.sources.map((source) => source.ref),
    })),
  ];
  files.push(recordFile("provenance-record", ".make-docs/provenance.json", {
    record: "make-docs.playbook-package.provenance",
    schemaVersion: 1,
    packageId: plan.packageId,
    profile: distributable.profile,
    outputKind: plan.target.outputKind,
    surface: plan.target.surface,
    scope: plan.target.scope,
    adapterId: plan.target.harness,
    containerId: container.containerId,
    sources: plan.sources.map((source) => ({ ref: source.ref, digest: source.sourceDigest })),
    generatedFiles,
    // R-PROV-1 per-artifact traceability: category, tier, and source refs
    // for every generated file in the distributable.
    files: fileProvenance,
    // R-GEN-1: the deterministic/agent-assisted boundary, recorded per field.
    generationTiers: groupGenerationTiers(plan),
    ownershipStatus: "make-docs-managed",
    supportStatus: plan.support.status,
    reviewStatus: plan.review.status,
    declaredDegradations: selection.declaredDegradations,
  }, plan));
  files.push(recordFile("lifecycle-record", ".make-docs/lifecycle.json", {
    record: "make-docs.playbook-package.lifecycle",
    schemaVersion: 1,
    backupBeforeOverwrite: plan.lifecycle.backupBeforeOverwrite,
    uninstallDisposition: plan.lifecycle.uninstallDisposition,
    preservesUserModifiedFiles: plan.lifecycle.preservesUserModifiedFiles,
    ownedPaths: generatedFiles,
  }, plan));
  files.push(recordFile("conformance-record", ".make-docs/conformance.json", {
    record: "make-docs.playbook-package.conformance",
    schemaVersion: 1,
    supportStatus: plan.support.status,
    evidenceRefs: plan.support.evidenceRefs,
    // The exact R-PROV-3 tuple this package's support claim binds to.
    // Evidence-owned dimensions (scenario, model/provider, runtime) stay null
    // until the W18 R9 conformance lineage binds them.
    tuple: {
      scenario: supportTuple.scenario,
      harness: supportTuple.harness,
      surface: supportTuple.surface,
      scope: supportTuple.scope,
      outputKind: supportTuple.outputKind,
      modelOrProvider: supportTuple.modelOrProvider,
      runtime: supportTuple.runtime,
    },
    tupleBinding: {
      unboundDimensions: [...unboundTupleDimensions],
      note: "Unbound dimensions bind only through W18 R9 conformance evidence (PRD 20); the support claim stays provisional until every dimension of the exact tuple is bound (PRD 36 R-PROV-3).",
    },
    // The adapter-contract verification the R-ADAPT-1 gate applied: where the
    // harness contract was confirmed and how far that confirmation goes.
    adapterVerification: {
      status: descriptor.verification.status,
      reference: descriptor.verification.reference,
      ...(descriptor.verification.contractDigest
        ? { contractDigest: descriptor.verification.contractDigest }
        : {}),
    },
    // Backup/uninstall cleanliness (R-PROV-2) is PROVEN by a conformance
    // scenario owned by the W18 R9 conformance design, not by this package's
    // unit or integration coverage; the dependency is referenced here, never
    // reimplemented (R-SCOPE-1).
    cleanlinessScenario: {
      owner: "W18 R9 conformance lineage (docs/prd/43-conformance-scenario-model-and-execution-kits.md#requirements)",
      requirement: "R-PROV-2 via the current conformance-scenario authority's R-BAR-1/R-SCEN-1 lineage: uninstall and backup remove managed generated outputs without orphaning empty managed directories or deleting user-authored files.",
    },
    note: "Support claims remain provisional until conformance evidence exists for the exact tuple (R-PROV-3); unit and integration tests are not harness-recognition evidence (R-TEST-5).",
  }, plan));

  return {
    containerId: container.containerId,
    containerKind: container.kind,
    profile: distributable.profile,
    manifestPath,
    skillPaths,
    files,
    dependencies,
    stops,
  };
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

/**
 * Skill placement within the container (D9 implementer decision, recorded in
 * the module doc comment): manifest-bearing containers use the descriptor's
 * `skillFileTemplate`; a single-skill `skills-directory` container is itself
 * the skill directory so direct `SKILL.md` discovery holds (R-ADAPT-2).
 */
function planSkillPaths(
  skills: PlaybookSkillProjection[],
  container: HarnessContainerDeclaration,
): Record<string, string> {
  const template = container.layout.skillFileTemplate ?? "{skillId}/SKILL.md";
  if (container.kind === "skills-directory" && skills.length === 1) {
    return { [skills[0]!.skillId]: "SKILL.md" };
  }
  return Object.fromEntries(
    skills.map((skill) => [skill.skillId, template.replaceAll("{skillId}", skill.skillId)]),
  );
}

function relativePrefixFor(skillPath: string): string {
  const depth = skillPath.split("/").length - 1;
  return "../".repeat(depth);
}

function buildDistributableFromSources(input: CompilePackageInventoryInput): PackageDistributable {
  return buildPackageDistributable({
    harnessId: input.plan.target.harness,
    descriptor: input.descriptor,
    outputKind: input.plan.target.outputKind,
    skills: input.sources.map((compiled) => projectPlaybookToSkill(compiled.source, compiled.model)),
    impliedAgentics: input.sources.flatMap((compiled) =>
      deriveImpliedAgentics({ model: compiled.model, sourceRef: compiled.source.ref }),
    ),
  });
}

// ---------------------------------------------------------------------------
// Semantic field resolution (R-GEN-1)
// ---------------------------------------------------------------------------

/**
 * Skill descriptions are semantic fields: when the source Playbook authored a
 * summary the description is a deterministic extraction of user content;
 * when it did not, the description must come from an agent-assisted proposal
 * that gained authority on plan acceptance, and compilation fails closed
 * before writes while that review is unresolved (R-GEN-1, R-GEN-2).
 */
function resolveSkillDescription(input: {
  skill: PlaybookSkillProjection;
  plan: PlaybookPackagePlan;
  stops: PackagePlanStop[];
}): { value: string; tier: PackageGenerationTier } {
  if (input.skill.summary) {
    return { value: input.skill.summary, tier: "deterministic" };
  }
  const field = `skills.${input.skill.skillId}.description`;
  const proposal = input.plan.agentAssistedProposals.find(
    (candidate) => candidate.field === field,
  );
  if (proposal && input.plan.review.status === "approved" && typeof proposal.value === "string") {
    return { value: proposal.value, tier: "agent-proposed" };
  }
  input.stops.push({
    reason: "semantic-review-required",
    message: `Skill \`${input.skill.skillId}\` has no source summary and its proposed description is not review-approved; the compiler fails closed before writes (R-GEN-1, R-GEN-2).`,
    ref: input.skill.sourceRef,
  });
  return { value: `${input.skill.title} (description pending review)`, tier: "agent-proposed" };
}

export function skillDescriptionProposalField(skillId: string): string {
  return `skills.${skillId}.description`;
}

export function draftSkillDescription(skill: PlaybookSkillProjection): string {
  return `Use the ${skill.title} workflow from the ${skill.sourceRef} Playbook.`;
}

// ---------------------------------------------------------------------------
// Skill rendering (R-COMP-3: preserved, not summarized away)
// ---------------------------------------------------------------------------

function renderSkillMarkdown(input: {
  skill: PlaybookSkillProjection;
  description: string;
  compiled: CompiledSourcePlaybook | null;
  dependencies: MaterializedDependency[];
  selection: PackageContainerSelection;
  relativePrefix: string;
}): string {
  const { skill, compiled } = input;
  const model = compiled?.model ?? null;
  const purpose = narrativeText(compiled, "purpose") ?? input.description;
  const whenToUse = narrativeText(compiled, "when-to-use") ?? input.description;
  const lines: string[] = [
    "---",
    `name: ${skill.skillId}`,
    `description: ${quoteYaml(input.description)}`,
    "---",
    "",
    `# ${skill.title}`,
    "",
    purpose,
    "",
    "## When To Use",
    "",
    whenToUse,
    "",
    "## Workflow",
    "",
  ];
  const steps = model?.workflow?.steps ?? [];
  if (steps.length > 0) {
    steps.forEach((step, index) => {
      lines.push(...renderStep({
        step,
        index,
        selection: input.selection,
        sourceRef: skill.sourceRef,
        relativePrefix: input.relativePrefix,
      }));
    });
  } else {
    const guidance = narrativeText(compiled, "step-guidance");
    lines.push(guidance ?? "Follow the source Playbook's documented steps in order.", "");
  }

  const references = input.dependencies.filter(
    (dependency) =>
      dependency.disposition === "copied-reference" ||
      dependency.disposition === "linked-reference",
  );
  if (references.length > 0) {
    lines.push("## References", "");
    for (const reference of references) {
      if (reference.disposition === "copied-reference" && reference.files[0]) {
        lines.push(`- [${reference.dependencyId}](${input.relativePrefix}${reference.files[0].path})`);
      } else {
        lines.push(`- ${reference.dependencyId}: ${reference.source}`);
      }
    }
    lines.push("");
  }

  if (input.dependencies.length > 0) {
    lines.push("## Dependencies", "");
    for (const dependency of input.dependencies) {
      lines.push(`- **${dependency.dependencyId}** (${dependency.kind ?? "unknown"}, ${dependency.requirement ?? "unspecified"}): ${dependency.instructions}`);
      const checkScript = dependency.files.find((file) => file.path.startsWith("checks/"));
      if (checkScript) {
        lines.push(`  - Check: \`${input.relativePrefix}${checkScript.path}\``);
      }
    }
    lines.push("");
  }

  lines.push("## Safety Boundaries", "");
  const safetyLines = renderSafetyBoundaries({
    compiled,
    dependencies: input.dependencies,
    selection: input.selection,
    sourceRef: skill.sourceRef,
  });
  lines.push(...(safetyLines.length > 0 ? safetyLines : ["- Follow the source Playbook's gates; stop when review is required."]));
  lines.push("");

  const validation = narrativeText(compiled, "validation");
  if (validation) {
    lines.push("## Validation", "", validation, "");
  }
  return lines.join("\n");
}

function renderStep(input: {
  step: PlaybookStep;
  index: number;
  selection: PackageContainerSelection;
  sourceRef: string;
  relativePrefix: string;
}): string[] {
  const { step } = input;
  const stepId = step.id?.value ?? `step-${input.index + 1}`;
  const title = step.title?.value ?? stepId;
  const lines: string[] = [`### ${input.index + 1}. ${title}`, ""];
  const dimensions = [
    `executor \`${step.executor.raw ?? step.executor.value ?? "unspecified"}\``,
    `role \`${step.role.raw ?? step.role.value ?? "unspecified"}\``,
    `activation \`${step.activation.raw ?? step.activation.value ?? "sequential"}\``,
    `mode \`${step.mode.raw ?? step.mode.value ?? "delegated"}\``,
  ];
  lines.push(`- Step \`${stepId}\`: ${dimensions.join(", ")}.`);
  if (step.activation.value === "event-bound") {
    const lowering = input.selection.lowerings.find(
      (candidate) =>
        candidate.agentic.primitive === "hook" &&
        candidate.agentic.sourceRef === input.sourceRef &&
        candidate.agentic.stepId === stepId,
    );
    lines.push(`- Event: \`${step.event?.value ?? "(undeclared)"}\`${lowering ? ` — ${lowering.declaration}` : ""}`);
  }
  // Step instructions are preserved verbatim from the model (R-COMP-3).
  const instructions = step.invocations.find((invocation) => invocation.form === "instructions")
    ?.instructions?.value;
  if (instructions) {
    lines.push("", instructions);
  }
  const operation = step.invocations.find((invocation) => invocation.form === "operation")
    ?.operation?.value;
  if (operation) {
    // The stable operation identifier is the reference; the CLI form is
    // derived from the registry at compile time (R-SCOPE-1, R-DEPMAT-1).
    const derived = hasOperation(operation)
      ? ` (currently \`make-docs run ${operationCliPath(operation)}\`)`
      : "";
    lines.push("", `- Run the Make Docs operation \`${operation}\`${derived}.`);
  }
  const commandRun = step.invocations.find((invocation) => invocation.form === "command")
    ?.commandRun?.value;
  if (commandRun) {
    const helper = step.executor.value === "script"
      ? ` — helper: \`${input.relativePrefix}scripts/${stepId}.sh\``
      : "";
    lines.push("", `- Run: \`${commandRun}\`${helper}`);
  }
  const uses = [...step.uses, ...step.requires].map((reference) => reference.id);
  if (uses.length > 0) {
    lines.push(`- Uses dependencies: ${uses.map((id) => `\`${id}\``).join(", ")}.`);
  }
  if (step.gate) {
    const gateParts = [
      step.gate.resolvedBy?.value ? `resolved by ${step.gate.resolvedBy.value}` : null,
      step.gate.evidence?.value ? `evidence: ${step.gate.evidence.value}` : null,
      step.gate.unattended ? `unattended: ${step.gate.unattended.value ? "allowed" : "not allowed"}` : null,
    ].filter((part): part is string => part !== null);
    lines.push(`- Gate: ${gateParts.length > 0 ? gateParts.join("; ") : "stop for review before continuing"}.`);
  }
  if (step.validation) {
    const validationParts = [
      step.validation.expect?.value ? `expect ${step.validation.expect.value}` : null,
      ...step.validation.deterministicChecks.map((check) => `check: ${check.value}`),
      ...step.validation.humanReviewChecks.map((check) => `human review: ${check.value}`),
    ].filter((part): part is string => part !== null);
    if (validationParts.length > 0) {
      lines.push(`- Validate: ${validationParts.join("; ")}.`);
    }
  }
  if (step.safety) {
    lines.push(...stepSafetyLines(step, "- Safety: "));
  }
  lines.push("");
  return lines;
}

function stepSafetyLines(step: PlaybookStep, prefix: string): string[] {
  if (!step.safety) {
    return [];
  }
  const parts = [
    step.safety.mutationSurfaces.length > 0
      ? `mutates ${step.safety.mutationSurfaces.map((surface) => surface.value).join(", ")}`
      : null,
    step.safety.dryRun?.value ? `dry-run: ${step.safety.dryRun.value}` : null,
    step.safety.approval?.value ? `approval: ${step.safety.approval.value}` : null,
    step.safety.rollback?.value ? `rollback: ${step.safety.rollback.value}` : null,
  ].filter((part): part is string => part !== null);
  return parts.length > 0 ? [`${prefix}${parts.join("; ")}.`] : [];
}

function renderSafetyBoundaries(input: {
  compiled: CompiledSourcePlaybook | null;
  dependencies: MaterializedDependency[];
  selection: PackageContainerSelection;
  sourceRef: string;
}): string[] {
  const lines: string[] = [];
  const gates = narrativeText(input.compiled, "gates");
  if (gates) {
    lines.push(gates, "");
  }
  for (const step of input.compiled?.model.workflow?.steps ?? []) {
    const stepId = step.id?.value ?? "(unnamed)";
    lines.push(...stepSafetyLines(step, `- Step \`${stepId}\`: `));
  }
  // Declared degradations are part of the skill's safety story: the reader
  // must know which behaviors the harness does not execute natively (R-CAP-4).
  for (const lowering of input.selection.lowerings) {
    if (
      lowering.agentic.sourceRef === input.sourceRef &&
      (lowering.disposition === "degraded-manual-step" ||
        lowering.disposition === "degraded-skill-instruction")
    ) {
      lines.push(`- Declared degradation: ${lowering.declaration}`);
    }
  }
  for (const dependency of input.dependencies) {
    if (dependency.declaration) {
      lines.push(`- Declared degradation: ${dependency.declaration}`);
    }
  }
  return lines;
}

function renderBundleIndexSkill(input: {
  plan: PlaybookPackagePlan;
  distributable: PackageDistributable;
  skillPaths: Record<string, string>;
}): string {
  return [
    "---",
    `name: ${input.plan.packageId}`,
    `description: ${quoteYaml(input.plan.summary)}`,
    "---",
    "",
    `# ${input.plan.title}`,
    "",
    input.plan.summary,
    "",
    "## Bundled Skills",
    "",
    ...input.distributable.skills.map(
      (skill) => `- [${skill.title}](${input.skillPaths[skill.skillId]}): from \`${skill.sourceRef}\`.`,
    ),
    "",
  ].join("\n");
}

/**
 * Extracts a required narrative section's text by slicing the source with the
 * span the parsed model recorded — the model stays the single parse
 * (R-SCOPE-1); no ad-hoc Markdown re-parsing happens here.
 */
function narrativeText(
  compiled: CompiledSourcePlaybook | null,
  key: PlaybookNarrativeSectionKey,
): string | null {
  if (!compiled) {
    return null;
  }
  const section = compiled.model.narrativeSections[key];
  if (!section.present || !section.nonEmpty || !section.span) {
    return null;
  }
  const raw = compiled.sourceText.slice(section.span.start.offset, section.span.end.offset);
  const withoutHeading = raw.replace(/^##[^\n]*\n/, "");
  const trimmed = withoutHeading.trim();
  return trimmed.length > 0 ? trimmed : null;
}

// ---------------------------------------------------------------------------
// Manifest, hooks, and registration rendering
// ---------------------------------------------------------------------------

function renderHarnessManifest(input: {
  plan: PlaybookPackagePlan;
  skillPaths: Record<string, string>;
  distributable: PackageDistributable;
  dependencies: MaterializedDependency[];
  container: HarnessContainerDeclaration;
  hasHooksFile: boolean;
}): string {
  const skillRefs = input.dependencies
    .filter((dependency) => dependency.manifestReference?.section === "skills")
    .map((dependency) => dependency.manifestReference!.id);
  const pluginRefs = input.dependencies
    .filter((dependency) => dependency.manifestReference?.section === "plugins")
    .map((dependency) => dependency.manifestReference!.id);
  const mcpServers = input.container.hostedPrimitives.includes("mcp-server")
    ? input.dependencies
        .filter((dependency) => dependency.kind === "mcp")
        // The manifest's server reference is the resolved probe — the only
        // machine-reference field (PRD 34 R-DEP-3); the manifest key stays
        // `source` for shape stability with earlier W18 R8 outputs.
        .map((dependency) => ({ id: dependency.dependencyId, source: dependency.probe }))
    : [];
  const manifest: Record<string, JsonValue> = {
    name: input.plan.packageId,
    displayName: input.plan.title,
    version: MANIFEST_VERSION,
    description: input.plan.summary,
    skills: input.distributable.skills.map((skill) => ({
      id: skill.skillId,
      path: input.skillPaths[skill.skillId]!,
    })),
    ...(input.hasHooksFile ? { hooks: "hooks/hooks.json" } : {}),
    ...(mcpServers.length > 0 ? { mcpServers } : {}),
    ...(skillRefs.length > 0 || pluginRefs.length > 0
      ? {
          dependencies: {
            ...(skillRefs.length > 0 ? { skills: skillRefs } : {}),
            ...(pluginRefs.length > 0 ? { plugins: pluginRefs } : {}),
          },
        }
      : {}),
  };
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

function renderHooksFile(input: {
  nativeHooks: AgenticLowering[];
  compiledByRef: Map<string, CompiledSourcePlaybook>;
}): string {
  const hooks = input.nativeHooks.map((lowering) => {
    const compiled = input.compiledByRef.get(lowering.agentic.sourceRef);
    const step = compiled?.model.workflow?.steps.find(
      (candidate) => candidate.id?.value === lowering.agentic.stepId,
    );
    const instructions = step?.invocations.find((invocation) => invocation.form === "instructions")
      ?.instructions?.value ?? null;
    return {
      hookPoint: lowering.hookPoint!,
      event: lowering.agentic.event,
      sourceRef: lowering.agentic.sourceRef,
      stepId: lowering.agentic.stepId,
      ...(instructions ? { instructions } : {}),
    };
  });
  return `${JSON.stringify({ hooks }, null, 2)}\n`;
}

/**
 * Renders one registration/marketplace file into the distributable (R-MKT-1:
 * generated, never installed; the install seam is the P4 registration seam).
 * The entry names the concrete install location the marketplace registers —
 * the Make Docs `<user-home>` marker is lowered to `~` so the generated file
 * is harness-usable as written, never a Make Docs-typed artifact (R-COMP-1).
 * The entry field set follows the verified Codex registration model
 * (R-ADAPT-2); real-harness acceptance of the entry stays W18 R9 evidence
 * territory (R-TEST-5).
 */
function renderRegistrationFile(input: {
  plan: PlaybookPackagePlan;
  descriptor: HarnessCapabilityDescriptor;
  container: HarnessContainerDeclaration;
  target: string;
}): string {
  const placement =
    input.container.layout.placements.find(
      (candidate) => candidate.scope === input.plan.target.scope,
    ) ?? input.container.layout.placements[0]!;
  const installPath = placement.pathTemplate
    .replaceAll("{packageId}", input.plan.packageId)
    .replace(/^<user-home>\//, "~/");
  return `${JSON.stringify({
    plugins: [
      {
        id: input.plan.packageId,
        name: input.plan.title,
        description: input.plan.summary,
        version: MANIFEST_VERSION,
        source: { type: "path", path: installPath },
      },
    ],
  }, null, 2)}\n`;
}

// ---------------------------------------------------------------------------
// Make Docs metadata records
// ---------------------------------------------------------------------------

function recordFile(
  category: PackageInventoryCategory,
  relativePath: string,
  payload: Record<string, JsonValue>,
  plan: PlaybookPackagePlan,
): PackageInventoryFile {
  return {
    path: relativePath,
    content: `${JSON.stringify(payload, null, 2)}\n`,
    executable: false,
    category,
    tier: "deterministic",
    sourceRefs: plan.sources.map((source) => source.ref),
  };
}

function dependencyDeclaration(dependency: MaterializedDependency): Record<string, JsonValue> {
  return {
    id: dependency.dependencyId,
    kind: dependency.kind,
    requirement: dependency.requirement,
    source: dependency.source,
    // Additive (W18 R12 P2, PRD 34 R-DEP-3): the resolved probe target rides
    // the declaration record so consumers never re-derive it from prose.
    probe: dependency.probe,
    sourceRef: dependency.sourceRef,
    disposition: dependency.disposition,
    files: dependency.files.map((file) => file.path),
    ...(dependency.operationId ? { operation: dependency.operationId } : {}),
    ...(dependency.manifestReference
      ? { manifestReference: { ...dependency.manifestReference } }
      : {}),
    ...(Object.keys(dependency.metadata).length > 0 ? { metadata: dependency.metadata } : {}),
    ...(dependency.declaration ? { declaration: dependency.declaration } : {}),
    instructions: dependency.instructions,
  };
}

function groupGenerationTiers(plan: PlaybookPackagePlan): Record<string, JsonValue> {
  const tiers: Record<string, string[]> = {};
  for (const [field, tier] of Object.entries(plan.fieldProvenance)) {
    (tiers[tier] ??= []).push(field);
  }
  for (const fields of Object.values(tiers)) {
    fields.sort();
  }
  return tiers;
}

function quoteYaml(value: string): string {
  return JSON.stringify(value);
}
