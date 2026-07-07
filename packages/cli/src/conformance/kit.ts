/**
 * The per-target conformance execution kit (PRD 43 R-KIT-1..3, R-INST-1..2,
 * R-PROMPT-1, R-DISC-1, R-HOME-1..2; PRD 44 R-EXEC-1..3, R-NAME-1..2;
 * W18 R13 P2 t2-t9).
 *
 * A kit is the executable projection of one harness-agnostic scenario
 * definition for one execution target, generated on demand into a disposable
 * lab-session root OUTSIDE the repository with the fixed R-KIT-2 layout:
 * `<session-root>/kit/` (prompts, instruments, manifest, rendered step
 * script), `<session-root>/workspace/` (the materialized fixture project the
 * target operates in), and `<session-root>/evidence/` (instrument outputs
 * and transcripts). Nothing a session produces is ever written under the
 * repository; discarding the session root discards every session artifact.
 *
 * Executable-by-construction (R-KIT-3, closing register item D-023): every
 * command the kit emits is projected against the REAL command surface before
 * any session starts — `make-docs run` commands through the registry-derived
 * resolver, the authored CLI adapters, and each operation's input schema
 * (`adaptRunCliArgv`), other `make-docs` commands through the real CLI parser
 * (`validateMakeDocsCliArgv`) — and every `run package ship` step is then
 * driven END TO END through the operation core under the dry-run context
 * (plan -> preview -> write-with-no-writes via the shipped compiler and
 * descriptors) against the freshly materialized workspace. A definition that
 * cannot project to an accepted, stop-free command sequence fails generation
 * closed, naming the definition, target, and unprojectable element. The
 * three D-023 defect classes are structurally impossible in generated
 * output: missing support-evidence refs and missing `--yes` confirmations
 * fail the static projection, and unestablished precondition attestations
 * fail the dry-run pipeline because the kit's own workspace materialization
 * is what supplies them.
 *
 * Kit generation home (R-HOME-1): this module is maintainer lab tooling
 * invoked through an npm script (`conformance:kit` ->
 * `packages/cli/scripts/conformance-kit.ts`). It is deliberately NOT
 * registered in the operation registry and NOT exposed on the shipped CLI
 * command tree or MCP surface (both derive from the registry, so the
 * registry assertion in {@link listConformanceLabShippedSurfaceViolations}
 * covers all three surfaces): shipping it would advertise a maintainer-lab
 * capability whose required assets R-TEST-3 structurally excludes from every
 * install — the D-022 category error repeated at the command level. The
 * W18 R11 parity rule is preserved vacuously; the revisit seam is recorded
 * on register item Q-022.
 *
 * Harness knowledge single home (R-HOME-2): everything harness-specific a
 * kit renders — version and launch commands, listing-capture forms, placement
 * roots, workspace conventions — comes from the harness capability
 * descriptor (including its lab-facing interrogation block). This module
 * carries NO table of harness facts; a target whose descriptor lacks the
 * interrogation knowledge a kit needs fails generation closed naming the
 * descriptor gap, never inventing the fact.
 *
 * Implementer decisions recorded here (W18 R13 P2):
 * - Setup-step absorption: the definition's leading no-bar-stage command
 *   steps (before the first bar-staged step) are the workspace-establishment
 *   steps; kit generation EXECUTES them to materialize `workspace/` — the
 *   committed step text is the single source, never re-transcribed into
 *   generator logic (the D-023 root cause was hand-transcription drift).
 *   `WORKSPACE=$(mktemp -d)` is replaced by the kit-owned workspace path;
 *   `make-docs` setup invocations run in-process through {@link runCli} with
 *   `--target` bound to the workspace; everything else runs through `bash`.
 * - Command steps carrying a `discover` or `invoke` bar stage have no
 *   instrument projection and fail generation closed; the current
 *   definitions drive those stages through harness actions, measured by the
 *   discover listing captures and the invoke probe scan.
 * - Instruments are self-contained Node scripts (`node:` builtins only, no
 *   third-party imports, no network modules, no clock, no randomness) that
 *   resolve the session root relative to their own location, so generated
 *   kits contain no absolute paths and equal inputs yield byte-identical
 *   kits (the determinism tests pin this).
 * - The invoke markers are derived from the definition's invoke assertions
 *   and its fixture Playbooks (the `MAKE-DOCS-CONFORMANCE-*` /
 *   `make-docs-conformance-*` spellings) — fixture facts, not harness facts,
 *   so R-HOME-2 is untouched; a definition whose invoke stage names no
 *   deterministic marker fails generation.
 * - No timestamps are minted here: the session id and date are caller
 *   inputs ({@link mintConformanceLabSessionId}), keeping generation
 *   deterministic for equal inputs.
 * - This module imports the CLI composition root (`src/cli.ts`) — the one
 *   declared exemption to the R-CORE-2 dependency-direction guard (see
 *   `tests/operation-dependency-direction.test.ts`): executable-by-
 *   construction requires the REAL parser and the real `setup` path, and a
 *   parallel reimplementation would be exactly the D-023 drift; the lab
 *   driver consumes the composition root the way the repository tests do,
 *   and never the other way around.
 */

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { runCli, validateMakeDocsCliArgv } from "../cli";
import { createExecutionContext } from "../operations/context";
import {
  FIRST_PARTY_HARNESS_CAPABILITY_DESCRIPTORS,
  computeHarnessContractDigest,
  type HarnessCapabilityDescriptor,
  type HarnessDescriptorVerificationStatus,
  type HarnessLabInterrogation,
} from "../operations/playbook-packaging";
import { getOperation, invokeOperation, listOperations } from "../operations/registry";
import { OperationError } from "../operations/types";
import { adaptRunCliArgv, listRunCliAdapters } from "../run/cli";
import {
  CONFORMANCE_LAB_SESSIONS_PATH_FRAGMENT,
  CONFORMANCE_TRANSCRIPT_DISCARDED_WITH_SESSION,
  mintConformanceLabSessionId,
  validateConformanceLabSessionId,
} from "./lab-session";
import type { ConformanceEvidenceBarStage } from "./registry";
import {
  REQUIRED_FIRST_PASS_SCENARIOS,
  REQUIRED_FIRST_PASS_TARGET,
  getScenarioTargetBinding,
  loadPackagingConformanceScenarioSpecs,
  splitConformanceScenarioId,
  type PackagingConformanceScenarioSpec,
  type PackagingConformanceScenarioStep,
  type PackagingScenarioTargetBinding,
} from "./scenario";

/* --------------------------------------------------------------------------
 * Prompt cores (R-PROMPT-1; PRD 44 R-EXEC-1..3). Exported so tests pin the
 * honesty rules VERBATIM against the rendered prompts.
 * ------------------------------------------------------------------------ */

/** The honesty rules, verbatim, rendered into every session prompt. */
export const CONFORMANCE_PROMPT_HONESTY_RULES = [
  "blocked is a valid result",
  "failures are evidence",
  "assertions never relax",
] as const;

/** The named R-EXEC-1 rule, rendered into every session prompt verbatim. */
export const CONFORMANCE_PROMPT_MEASUREMENT_RULE =
  "The agent drives, the instruments measure: self-assessment is never self-attestation. " +
  'Your claims ("the skill appeared", "the plugin installed") are narrative context, never evidence — ' +
  "conformance evidence comes exclusively from deterministic instrument outputs, and a bar stage " +
  "with no instrument output is unasserted, full stop.";

/** The execution rules recorded in every session manifest (PRD 44 R-EXEC-1..3). */
export const CONFORMANCE_SESSION_EXECUTION_RULES = [
  `R-EXEC-1: ${CONFORMANCE_PROMPT_MEASUREMENT_RULE}`,
  "R-EXEC-2: uninstrumentable stages are recorded caveats on the result record, never trust fallbacks; a caveat must be surfaced for the record to advance a tuple.",
  "R-EXEC-3: unmet preconditions resolve to an honest blocked result record (supportClaimUse none, all-false evidence bar); blocked-honesty semantics are unchanged.",
] as const;

/** Manifest schema identifier for generated lab sessions (R-KIT-1). */
export const CONFORMANCE_SESSION_MANIFEST_SCHEMA_VERSION =
  "conformance.lab-session-manifest.v1";

/** Instrument-output schema identifier embedded in every instrument capture. */
export const CONFORMANCE_INSTRUMENT_OUTPUT_SCHEMA_VERSION =
  "conformance.instrument-output.v1";

/* --------------------------------------------------------------------------
 * Types
 * ------------------------------------------------------------------------ */

/** One rendered session step, with who performs it (R-NAME-1 vocabulary). */
export interface RenderedConformanceSessionStep {
  sequence: number;
  kind: PackagingConformanceScenarioStep["kind"];
  barStage: ConformanceEvidenceBarStage | null;
  /** Who performs the step: generation (workspace setup), an instrument, or the driver. */
  performedBy: "kit-generation" | "instrument" | "driver";
  /** The instrument invocation covering the step, kit-root-relative. */
  instrument: string | null;
  command: string | null;
  action: string | null;
  notes: string | null;
}

export interface ConformanceSessionExpectedEvidence {
  /** Session-root-relative instrument invocation. */
  instrument: string;
  /** Session-root-relative output files ingestion validates. */
  outputs: string[];
  /** What ingestion validates the outputs against (interpretation happens ONLY there; R-INST-1). */
  rule: string;
}

/** The session manifest (PRD 43 R-KIT-1, t5). */
export interface ConformanceSessionManifest {
  schemaVersion: typeof CONFORMANCE_SESSION_MANIFEST_SCHEMA_VERSION;
  sessionId: string;
  scenarioId: string;
  scenarioVersion: string;
  title: string;
  harness: string;
  registryTupleIds: string[];
  generationInputs: {
    cliVersion: string;
    descriptorContractDigest: string;
    descriptorVerificationStatus: HarnessDescriptorVerificationStatus;
    targetParameters: Record<string, string>;
  };
  layout: { kit: "kit"; workspace: "workspace"; evidence: "evidence" };
  transcriptPolicy: "json-or-non-tty";
  evidenceHomes: {
    default: typeof CONFORMANCE_TRANSCRIPT_DISCARDED_WITH_SESSION;
    retained: string;
  };
  executionRules: string[];
  preconditions: {
    probes: { id: string; description: string; command: string; args: string[] }[];
    attestations: { id: string; description: string }[];
  };
  sessionSteps: RenderedConformanceSessionStep[];
  expectedEvidence: Record<ConformanceEvidenceBarStage, ConformanceSessionExpectedEvidence>;
  discoveryKit: {
    prompt: string;
    instrument: string;
    findingsFile: string;
    resolvesProbe: { registerItem: string; ref: string; summary: string };
  } | null;
}

export interface GenerateConformanceKitInput {
  spec: PackagingConformanceScenarioSpec;
  harness: string;
  /** Caller-named disposable session root; must lie OUTSIDE the repository. */
  sessionRoot: string;
  /** Maintainer repo root the fixtures and setup steps resolve against. */
  repoRoot?: string;
  /** Explicit session id; wins over `sessionDate` minting. */
  sessionId?: string;
  /** ISO date used to mint the session id when `sessionId` is absent. */
  sessionDate?: string;
  /** Capability-descriptor override for tests and additive future harnesses. */
  descriptors?: HarnessCapabilityDescriptor[];
  /** Recorded in the manifest's generation inputs; derived from the repo when absent. */
  cliVersion?: string;
}

export interface GeneratedConformanceKit {
  sessionId: string;
  sessionRoot: string;
  kitDir: string;
  workspaceDir: string;
  evidenceDir: string;
  manifestPath: string;
  manifest: ConformanceSessionManifest;
  /** Session-root-relative kit files written by generation. */
  kitFiles: string[];
}

/* --------------------------------------------------------------------------
 * Shell-command projection (R-KIT-3)
 * ------------------------------------------------------------------------ */

const COMMAND_TERMINATOR_TOKENS = new Set(["&&", "||", ";", "|", "<", ">", ">>", "2>", "2>&1"]);

/** Minimal shell tokenizer: whitespace-separated, honoring single/double quotes. */
function tokenizeShellCommand(command: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let hasContent = false;
  let quote: '"' | "'" | null = null;
  for (const char of command) {
    if (quote) {
      if (char === quote) {
        quote = null;
      } else {
        current += char;
      }
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      hasContent = true;
      continue;
    }
    if (/\s/.test(char)) {
      if (hasContent || current.length > 0) {
        tokens.push(current);
        current = "";
        hasContent = false;
      }
      continue;
    }
    current += char;
    hasContent = true;
  }
  if (quote) {
    throw new OperationError(`Command has an unbalanced quote: \`${command}\``);
  }
  if (hasContent || current.length > 0) {
    tokens.push(current);
  }
  return tokens;
}

/** Every `make-docs` argv embedded in one (possibly compound) shell command. */
export function listMakeDocsInvocations(command: string): string[][] {
  const tokens = tokenizeShellCommand(command);
  const invocations: string[][] = [];
  let index = 0;
  while (index < tokens.length) {
    if (tokens[index] !== "make-docs") {
      index += 1;
      continue;
    }
    const argv: string[] = [];
    index += 1;
    while (index < tokens.length && !COMMAND_TERMINATOR_TOKENS.has(tokens[index]!)) {
      argv.push(tokens[index]!);
      index += 1;
    }
    invocations.push(argv);
  }
  return invocations;
}

interface ProjectedCommandStep {
  step: Extract<PackagingConformanceScenarioStep, { kind: "command" }>;
  /** `make-docs run <path>` registry ids the step dispatches, in order. */
  shipInvocationArgv: string[][];
}

/** The classified projection of one (definition, target) pair. */
export interface ConformanceKitProjection {
  spec: PackagingConformanceScenarioSpec;
  harness: string;
  binding: PackagingScenarioTargetBinding;
  descriptor: HarnessCapabilityDescriptor;
  interrogation: HarnessLabInterrogation;
  /** Leading no-bar-stage command steps executed by generation. */
  setupSteps: Extract<PackagingConformanceScenarioStep, { kind: "command" }>[];
  /** Every step from the first bar-staged step on, in definition order. */
  sessionSteps: PackagingConformanceScenarioStep[];
  installCommandSteps: ProjectedCommandStep[];
  uninstallCommandSteps: ProjectedCommandStep[];
  /** Workspace-relative placement roots the instruments inventory. */
  placementRoots: string[];
  /** Deterministic invocation markers the invoke instrument scans for. */
  invokeMarkers: string[];
}

function projectionError(spec: PackagingConformanceScenarioSpec, harness: string, detail: string): OperationError {
  return new OperationError(
    `Conformance kit generation failed closed for definition \`${spec.scenarioId}\` on target \`${harness}\`: ${detail} (R-KIT-3, register item D-023)`,
  );
}

/**
 * Workspace-relative placement roots derived from the descriptor: the
 * project-scope container placement prefixes (up to the `{packageId}`
 * marker) plus registration-file directories. The descriptor — never a
 * kit-local table — carries every one of these paths (R-HOME-2).
 */
export function listHarnessPlacementRoots(descriptor: HarnessCapabilityDescriptor): string[] {
  const roots = new Set<string>();
  for (const container of descriptor.containers) {
    for (const placement of container.layout.placements) {
      if (placement.scope !== "project") {
        continue;
      }
      const marker = placement.pathTemplate.indexOf("{packageId}");
      const prefix = marker === -1 ? placement.pathTemplate : placement.pathTemplate.slice(0, marker);
      const root = prefix.replace(/\/+$/, "");
      if (root.length > 0) {
        roots.add(root);
      }
    }
    for (const registrationFile of container.layout.registrationFiles) {
      const dir = path.posix.dirname(registrationFile);
      if (dir !== "." && dir.length > 0) {
        roots.add(dir);
      }
    }
  }
  return [...roots].sort();
}

const INVOKE_MARKER_PATTERNS = [/MAKE-DOCS-CONFORMANCE-[A-Z0-9-]+/g, /make-docs-conformance-[a-z0-9-]+/g];

function extractInvokeMarkers(texts: string[]): string[] {
  const markers = new Set<string>();
  for (const text of texts) {
    for (const pattern of INVOKE_MARKER_PATTERNS) {
      for (const match of text.matchAll(pattern)) {
        markers.add(match[0]);
      }
    }
  }
  return [...markers].sort();
}

function isNonTtyEvidenceCommand(step: Extract<PackagingConformanceScenarioStep, { kind: "command" }>): boolean {
  return step.transcript === "evidence-non-tty" || step.run.includes("< /dev/null");
}

/**
 * Statically validates one make-docs invocation against the real command
 * surface (R-KIT-3): `run` argv through the registry-derived resolver, the
 * authored adapters, and the operation's input schema; every other command
 * through the real CLI parser. Throws with the offending element named.
 */
function validateMakeDocsArgv(input: {
  argv: string[];
  spec: PackagingConformanceScenarioSpec;
  harness: string;
  step: Extract<PackagingConformanceScenarioStep, { kind: "command" }>;
  repoRoot: string;
}): { runOperationId: string | null } {
  const { argv, spec, harness, step } = input;
  if (argv.length === 0) {
    throw projectionError(spec, harness, `step \`${step.run}\` invokes make-docs with no arguments`);
  }
  if (argv[0] === "run") {
    let adapted;
    try {
      // `--repo-root` is pinned so the adapter's project-root discovery never
      // wanders into the maintainer repo during validation; the schema parse
      // below is what proves the argv projects to an accepted typed input.
      adapted = adaptRunCliArgv([...argv.slice(1), "--repo-root", input.repoRoot]);
    } catch (error) {
      throw projectionError(
        spec,
        harness,
        `command step \`${step.run}\` does not project onto the registered operation surface: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    const parsed = getOperation(adapted.operationId).inputSchema.safeParse(adapted.invocation.input);
    if (!parsed.success) {
      const issues = parsed.error.issues
        .map((issue) => `${issue.path.join(".") || "(input)"}: ${issue.message}`)
        .join("; ");
      throw projectionError(
        spec,
        harness,
        `command step \`${step.run}\` projects to operation \`${adapted.operationId}\` but its input is rejected: ${issues}`,
      );
    }
    // D-023 defect class 1: an install-stage packaging command without the
    // support-evidence ref would hard-stop the planner mid-session.
    if (
      step.barStage === "install" &&
      (adapted.operationId === "package.ship" || adapted.operationId === "package.plan") &&
      (adapted.options.arrays["support-evidence-ref"] ?? []).length === 0
    ) {
      throw projectionError(
        spec,
        harness,
        `install-stage command \`${step.run}\` carries no --support-evidence-ref; the planner hard-stops without one`,
      );
    }
    return { runOperationId: adapted.operationId };
  }
  try {
    validateMakeDocsCliArgv(argv);
  } catch (error) {
    throw projectionError(
      spec,
      harness,
      `command step \`${step.run}\` is not accepted by the make-docs CLI: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  // D-023 defect class 2: a non-TTY lifecycle confirmation without --yes
  // cannot pass the TTY confirmation gate.
  if (
    argv[0] === "setup" &&
    (argv[1] === "remove" || argv[1] === "backup") &&
    isNonTtyEvidenceCommand(input.step) &&
    !argv.includes("--yes")
  ) {
    throw projectionError(
      spec,
      harness,
      `non-TTY command \`${step.run}\` omits --yes; the TTY confirmation gate refuses it mid-session`,
    );
  }
  return { runOperationId: null };
}

/**
 * Projects one (definition, target) pair into its kit shape without touching
 * the filesystem: classifies steps, validates every command against the real
 * command surface, and derives the instrument configuration from the
 * descriptor. Fails closed on an uncovered target, a missing descriptor or
 * interrogation block, or any unprojectable element (R-KIT-3, R-SCHEMA-2).
 */
export function projectConformanceKit(input: {
  spec: PackagingConformanceScenarioSpec;
  harness: string;
  repoRoot?: string;
  descriptors?: HarnessCapabilityDescriptor[];
}): ConformanceKitProjection {
  const { spec, harness } = input;
  const repoRoot = path.resolve(input.repoRoot ?? ".");
  const binding = getScenarioTargetBinding(spec, harness);
  const descriptor = (input.descriptors ?? FIRST_PARTY_HARNESS_CAPABILITY_DESCRIPTORS).find(
    (candidate) => candidate.harnessId === harness,
  );
  if (!descriptor) {
    throw projectionError(spec, harness, "no harness capability descriptor exists for the target");
  }
  if (!descriptor.labInterrogation) {
    throw projectionError(
      spec,
      harness,
      "the target's capability descriptor carries no lab-facing interrogation block; author the harness knowledge INTO the descriptor (R-HOME-2) — a kit-local harness-fact table is prohibited",
    );
  }
  if (descriptor.labInterrogation.listingCaptures.length === 0) {
    throw projectionError(
      spec,
      harness,
      "the descriptor's interrogation block declares no listing captures, so the discover stage has no instrument surface (R-INST-1, R-HOME-2)",
    );
  }

  const firstBarStagedIndex = spec.steps.findIndex((step) => step.barStage !== undefined);
  if (firstBarStagedIndex === -1) {
    throw projectionError(spec, harness, "no step carries a bar stage; nothing is instrumentable");
  }
  const setupSteps: ConformanceKitProjection["setupSteps"] = [];
  for (const step of spec.steps.slice(0, firstBarStagedIndex)) {
    if (step.kind !== "command") {
      throw projectionError(
        spec,
        harness,
        "a non-command step precedes the first bar-staged step; workspace establishment must be command steps kit generation can execute",
      );
    }
    setupSteps.push(step);
  }
  const sessionSteps = spec.steps.slice(firstBarStagedIndex);

  const installCommandSteps: ProjectedCommandStep[] = [];
  const uninstallCommandSteps: ProjectedCommandStep[] = [];
  for (const step of [...setupSteps, ...sessionSteps]) {
    if (step.kind !== "command") {
      continue;
    }
    const invocations = listMakeDocsInvocations(step.run);
    const shipInvocationArgv: string[][] = [];
    for (const argv of invocations) {
      const { runOperationId } = validateMakeDocsArgv({ argv, spec, harness, step, repoRoot });
      if (runOperationId === "package.ship") {
        shipInvocationArgv.push(argv);
      }
    }
    if (step.barStage === "install") {
      installCommandSteps.push({ step, shipInvocationArgv });
    } else if (step.barStage === "uninstall") {
      uninstallCommandSteps.push({ step, shipInvocationArgv });
    } else if (step.barStage === "discover" || step.barStage === "invoke") {
      throw projectionError(
        spec,
        harness,
        `command step \`${step.run}\` carries bar stage \`${step.barStage}\`, which has no instrument projection; discover and invoke are driven by the target and measured by the listing captures and probe scan`,
      );
    }
  }
  if (installCommandSteps.length === 0) {
    throw projectionError(spec, harness, "no install-stage command step exists to instrument");
  }
  if (uninstallCommandSteps.length === 0) {
    throw projectionError(spec, harness, "no uninstall-stage command step exists to instrument");
  }
  // Discovery-kit ground-truth command steps are validated too (they render
  // into the discovery instrument); harness commands (e.g. `codex --version`)
  // are the target's own and are not projected against the make-docs CLI.
  for (const step of binding.discoveryKit?.groundTruthSteps ?? []) {
    if (step.kind !== "command") {
      continue;
    }
    for (const argv of listMakeDocsInvocations(step.run)) {
      validateMakeDocsArgv({ argv, spec, harness, step, repoRoot });
    }
  }

  const invokeMarkers = extractInvokeMarkers([
    ...spec.packagingExtension.evidenceBar.invoke,
    ...spec.steps
      .filter((step) => step.barStage === "invoke")
      .map((step) => (step.kind === "assertion" ? step.assert : step.kind === "command" ? step.run : step.action)),
    ...spec.packagingExtension.fixturePlaybooks.map((fixture) => {
      const fixturePath = path.join(repoRoot, fixture);
      if (!existsSync(fixturePath)) {
        throw projectionError(spec, harness, `fixture Playbook \`${fixture}\` does not exist`);
      }
      return readFileSync(fixturePath, "utf8");
    }),
  ]);
  if (invokeMarkers.length === 0) {
    throw projectionError(
      spec,
      harness,
      "no deterministic invocation marker is derivable from the definition's invoke assertions or fixture Playbooks; the invoke stage cannot be instrumented (R-INST-1)",
    );
  }

  return {
    spec,
    harness,
    binding,
    descriptor,
    interrogation: descriptor.labInterrogation,
    setupSteps,
    sessionSteps,
    installCommandSteps,
    uninstallCommandSteps,
    placementRoots: listHarnessPlacementRoots(descriptor),
    invokeMarkers,
  };
}

/* --------------------------------------------------------------------------
 * Instrument rendering (R-INST-1..2)
 * ------------------------------------------------------------------------ */

const INSTRUMENT_HEADER = `/**
 * Generated conformance instrument (PRD 43 R-INST-1..2; PRD 44 R-EXEC-1).
 * Deterministic and offline: node builtins only — no network, no model
 * routing, no clock, no randomness, no interpretation. Instruments capture;
 * interpretation happens ONLY at ingestion against the session manifest's
 * expected-evidence table. The driving agent's claims are not evidence;
 * only these outputs count, and a bar stage with no instrument output is
 * unasserted (R-EXEC-1).
 */`;

const INSTRUMENT_PRELUDE = `import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, readlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const INSTRUMENT_DIR = path.dirname(fileURLToPath(import.meta.url));
const SESSION_ROOT = path.resolve(INSTRUMENT_DIR, "..", "..");
const WORKSPACE_DIR = path.join(SESSION_ROOT, "workspace");
const EVIDENCE_DIR = path.join(SESSION_ROOT, "evidence");
const OUTPUT_SCHEMA = ${JSON.stringify(CONFORMANCE_INSTRUMENT_OUTPUT_SCHEMA_VERSION)};

function sha256(buffer) {
  return "sha256:" + createHash("sha256").update(buffer).digest("hex");
}

function writeJsonFile(filePath, value) {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, JSON.stringify(value, null, 2) + "\\n");
}

/** Sorted byte-level inventory of files and symlinks under a root. */
function listInventory(absoluteRoot, labelPrefix, excludeNames = []) {
  const entries = [];
  if (!existsSync(absoluteRoot)) {
    return entries;
  }
  const pending = [""];
  while (pending.length > 0) {
    const current = pending.pop();
    const currentDir = current === "" ? absoluteRoot : path.join(absoluteRoot, current);
    for (const dirent of readdirSync(currentDir, { withFileTypes: true })) {
      if (excludeNames.includes(dirent.name)) {
        continue;
      }
      const relative = current === "" ? dirent.name : current + "/" + dirent.name;
      const absolute = path.join(absoluteRoot, relative);
      const stats = lstatSync(absolute);
      if (stats.isSymbolicLink()) {
        entries.push({
          path: labelPrefix ? labelPrefix + "/" + relative : relative,
          kind: "symlink",
          target: readlinkSync(absolute),
          sha256: sha256(Buffer.from(readlinkSync(absolute))),
        });
      } else if (stats.isDirectory()) {
        pending.push(relative);
      } else {
        const content = readFileSync(absolute);
        entries.push({
          path: labelPrefix ? labelPrefix + "/" + relative : relative,
          kind: "file",
          bytes: content.length,
          sha256: sha256(content),
        });
      }
    }
  }
  entries.sort((left, right) => (left.path < right.path ? -1 : left.path > right.path ? 1 : 0));
  return entries;
}

/** Runs one session command through bash, capturing exit code and streams. */
function captureCommand(command, filePrefix, relativePrefix) {
  const result = spawnSync("bash", ["-c", command], {
    cwd: WORKSPACE_DIR,
    env: { ...process.env, WORKSPACE: WORKSPACE_DIR },
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  mkdirSync(path.dirname(filePrefix), { recursive: true });
  writeFileSync(filePrefix + ".stdout.txt", result.stdout ?? "");
  writeFileSync(filePrefix + ".stderr.txt", result.stderr ?? "");
  return {
    command,
    exitCode: result.status,
    stdout: relativePrefix + ".stdout.txt",
    stderr: relativePrefix + ".stderr.txt",
  };
}
`;

function renderInstallInstrument(projection: ConformanceKitProjection): string {
  const commands = projection.installCommandSteps.map((entry) => entry.step.run);
  return [
    "#!/usr/bin/env node",
    INSTRUMENT_HEADER,
    INSTRUMENT_PRELUDE,
    `const COMMANDS = ${JSON.stringify(commands, null, 2)};`,
    `const PLACEMENT_ROOTS = ${JSON.stringify(projection.placementRoots, null, 2)};`,
    "",
    'const stageDir = path.join(EVIDENCE_DIR, "install");',
    "mkdirSync(stageDir, { recursive: true });",
    "const commands = COMMANDS.map((command, index) =>",
    '  captureCommand(command, path.join(stageDir, "command-" + (index + 1)), "evidence/install/command-" + (index + 1)),',
    ");",
    'writeJsonFile(path.join(stageDir, "commands.json"), {',
    "  schemaVersion: OUTPUT_SCHEMA,",
    '  stage: "install",',
    "  commands,",
    "});",
    'writeJsonFile(path.join(stageDir, "placement-inventory.json"), {',
    "  schemaVersion: OUTPUT_SCHEMA,",
    '  stage: "install",',
    "  roots: PLACEMENT_ROOTS,",
    "  entries: PLACEMENT_ROOTS.flatMap((root) => listInventory(path.join(WORKSPACE_DIR, root), root)),",
    "});",
    "",
  ].join("\n");
}

function renderDiscoverInstrument(projection: ConformanceKitProjection): string {
  const captures = projection.interrogation.listingCaptures.map((capture) => ({
    id: capture.id,
    description: capture.description,
    status: capture.status,
    form: capture.form,
  }));
  return [
    "#!/usr/bin/env node",
    INSTRUMENT_HEADER,
    INSTRUMENT_PRELUDE,
    "// Listing captures are rendered from the harness capability descriptor's",
    "// lab-facing interrogation block — the single home of harness knowledge",
    "// (PRD 43 R-HOME-2); each capture carries its own verification marking.",
    `const CAPTURES = ${JSON.stringify(captures, null, 2)};`,
    "",
    'const stageDir = path.join(EVIDENCE_DIR, "discover");',
    "mkdirSync(stageDir, { recursive: true });",
    "const records = CAPTURES.map((capture) => {",
    "  if (capture.form.kind === \"command-output\") {",
    "    const result = spawnSync(capture.form.command, capture.form.args, {",
    "      cwd: WORKSPACE_DIR,",
    '      encoding: "utf8",',
    "      maxBuffer: 64 * 1024 * 1024,",
    "    });",
    '    writeFileSync(path.join(stageDir, capture.id + ".stdout.txt"), result.stdout ?? "");',
    '    writeFileSync(path.join(stageDir, capture.id + ".stderr.txt"), result.stderr ?? "");',
    "    return {",
    "      id: capture.id,",
    "      kind: capture.form.kind,",
    "      status: capture.status,",
    "      exitCode: result.status,",
    '      stdout: "evidence/discover/" + capture.id + ".stdout.txt",',
    "    };",
    "  }",
    "  if (capture.form.kind === \"directory-listing\") {",
    "    const entries = listInventory(path.join(WORKSPACE_DIR, capture.form.path), capture.form.path);",
    '    writeJsonFile(path.join(stageDir, capture.id + ".json"), { schemaVersion: OUTPUT_SCHEMA, stage: "discover", id: capture.id, root: capture.form.path, entries });',
    "    return { id: capture.id, kind: capture.form.kind, status: capture.status, entryCount: entries.length, listing: \"evidence/discover/\" + capture.id + \".json\" };",
    "  }",
    "  const manifestPath = path.join(WORKSPACE_DIR, capture.form.path);",
    "  const exists = existsSync(manifestPath);",
    "  const content = exists ? readFileSync(manifestPath) : null;",
    "  if (content) {",
    '    writeFileSync(path.join(stageDir, capture.id + ".content"), content);',
    "  }",
    "  return {",
    "    id: capture.id,",
    "    kind: capture.form.kind,",
    "    status: capture.status,",
    "    path: capture.form.path,",
    "    exists,",
    "    sha256: content ? sha256(content) : null,",
    '    content: content ? "evidence/discover/" + capture.id + ".content" : null,',
    "  };",
    "});",
    'writeJsonFile(path.join(stageDir, "captures.json"), { schemaVersion: OUTPUT_SCHEMA, stage: "discover", captures: records });',
    "",
  ].join("\n");
}

function renderInvokeInstrument(projection: ConformanceKitProjection): string {
  return [
    "#!/usr/bin/env node",
    INSTRUMENT_HEADER,
    INSTRUMENT_PRELUDE,
    "// The driver saves the invoke-stage harness transcript VERBATIM to the",
    "// transcript file before this instrument runs; the instrument scans it",
    "// for the definition-derived deterministic markers. A missing transcript",
    "// is captured as-is and fails closed at ingestion (R-ING-1).",
    `const MARKERS = ${JSON.stringify(projection.invokeMarkers, null, 2)};`,
    'const TRANSCRIPT_RELATIVE = "evidence/invoke/probe-transcript.txt";',
    "",
    'const stageDir = path.join(EVIDENCE_DIR, "invoke");',
    "mkdirSync(stageDir, { recursive: true });",
    "const transcriptPath = path.join(SESSION_ROOT, TRANSCRIPT_RELATIVE);",
    "const exists = existsSync(transcriptPath);",
    "const content = exists ? readFileSync(transcriptPath) : null;",
    'writeJsonFile(path.join(stageDir, "probe-assertion.json"), {',
    "  schemaVersion: OUTPUT_SCHEMA,",
    '  stage: "invoke",',
    "  transcriptFile: TRANSCRIPT_RELATIVE,",
    "  exists,",
    "  sha256: content ? sha256(content) : null,",
    "  markers: MARKERS.map((marker) => ({",
    "    marker,",
    '    found: content ? content.toString("utf8").includes(marker) : false,',
    "  })),",
    "});",
    "",
  ].join("\n");
}

function renderUninstallInstrument(projection: ConformanceKitProjection): string {
  const commands = projection.uninstallCommandSteps.map((entry) => entry.step.run);
  return [
    "#!/usr/bin/env node",
    INSTRUMENT_HEADER,
    INSTRUMENT_PRELUDE,
    "// Two phases: `before` snapshots the workspace byte-level inventory;",
    "// `remove` executes the uninstall-stage commands (capturing exit codes",
    "// and non-TTY transcripts), re-snapshots, and records the byte diff plus",
    "// any empty directories orphaned under the managed placement roots.",
    `const UNINSTALL_COMMANDS = ${JSON.stringify(commands, null, 2)};`,
    `const MANAGED_ROOTS = ${JSON.stringify(projection.placementRoots, null, 2)};`,
    'const EXCLUDED_TOP_LEVEL = [".git"];',
    "",
    "function listEmptyManagedDirs() {",
    "  const empty = [];",
    "  for (const root of MANAGED_ROOTS) {",
    "    const absoluteRoot = path.join(WORKSPACE_DIR, root);",
    "    if (!existsSync(absoluteRoot)) {",
    "      continue;",
    "    }",
    "    const pending = [\"\"];",
    "    while (pending.length > 0) {",
    "      const current = pending.pop();",
    "      const currentDir = current === \"\" ? absoluteRoot : path.join(absoluteRoot, current);",
    "      const children = readdirSync(currentDir, { withFileTypes: true });",
    "      if (children.length === 0) {",
    "        empty.push(current === \"\" ? root : root + \"/\" + current);",
    "        continue;",
    "      }",
    "      for (const dirent of children) {",
    "        if (dirent.isDirectory()) {",
    "          pending.push(current === \"\" ? dirent.name : current + \"/\" + dirent.name);",
    "        }",
    "      }",
    "    }",
    "  }",
    "  return empty.sort();",
    "}",
    "",
    "const phase = process.argv[2];",
    'const stageDir = path.join(EVIDENCE_DIR, "uninstall");',
    'if (phase === "before") {',
    "  mkdirSync(stageDir, { recursive: true });",
    "  // Capture the make-docs-managed file set from the workspace manifest",
    "  // BEFORE removal (register item D-026): `setup remove` deletes the",
    "  // manifest itself, and it lists every setup-managed file (AGENTS.md /",
    "  // CLAUDE.md scaffolding, shipped playbooks, .make-docs internals) — so",
    "  // ingestion can tell a managed removal from a user-authored deletion",
    "  // instead of flagging managed scaffolding as a user-file violation.",
    '  const manifestPath = path.join(WORKSPACE_DIR, ".make-docs", "manifest.json");',
    "  const managedFiles = [];",
    "  if (existsSync(manifestPath)) {",
    "    try {",
    '      const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));',
    "      for (const managed of Object.keys(manifest.files || {})) {",
    "        managedFiles.push(managed);",
    "      }",
    "      for (const skillFile of manifest.skillFiles || []) {",
    '        const skillPath = typeof skillFile === "string" ? skillFile : skillFile && skillFile.path;',
    "        if (skillPath) {",
    "          managedFiles.push(skillPath);",
    "        }",
    "      }",
    "    } catch {",
    "      // A malformed manifest leaves managedFiles empty; ingestion then",
    "      // falls back to the placement roots and flags conservatively.",
    "    }",
    "  }",
    "  managedFiles.sort();",
    '  writeJsonFile(path.join(stageDir, "before-inventory.json"), {',
    "    schemaVersion: OUTPUT_SCHEMA,",
    '    stage: "uninstall",',
    '    phase: "before",',
    "    managedFiles,",
    '    entries: listInventory(WORKSPACE_DIR, "", EXCLUDED_TOP_LEVEL),',
    "  });",
    '} else if (phase === "remove") {',
    '  const beforePath = path.join(stageDir, "before-inventory.json");',
    "  if (!existsSync(beforePath)) {",
    '    console.error("uninstall instrument: run `node uninstall.mjs before` first; no before-inventory exists");',
    "    process.exit(1);",
    "  }",
    '  const before = JSON.parse(readFileSync(beforePath, "utf8"));',
    "  const commands = UNINSTALL_COMMANDS.map((command, index) =>",
    '    captureCommand(command, path.join(stageDir, "command-" + (index + 1)), "evidence/uninstall/command-" + (index + 1)),',
    "  );",
    '  writeJsonFile(path.join(stageDir, "removal-commands.json"), { schemaVersion: OUTPUT_SCHEMA, stage: "uninstall", commands });',
    '  const afterEntries = listInventory(WORKSPACE_DIR, "", EXCLUDED_TOP_LEVEL);',
    "  const beforeByPath = new Map(before.entries.map((entry) => [entry.path, entry]));",
    "  const afterByPath = new Map(afterEntries.map((entry) => [entry.path, entry]));",
    "  const removed = before.entries.filter((entry) => !afterByPath.has(entry.path)).map((entry) => entry.path);",
    "  const added = afterEntries.filter((entry) => !beforeByPath.has(entry.path)).map((entry) => entry.path);",
    "  const modified = afterEntries",
    "    .filter((entry) => beforeByPath.has(entry.path) && beforeByPath.get(entry.path).sha256 !== entry.sha256)",
    "    .map((entry) => ({ path: entry.path, before: beforeByPath.get(entry.path).sha256, after: entry.sha256 }));",
    '  writeJsonFile(path.join(stageDir, "diff.json"), {',
    "    schemaVersion: OUTPUT_SCHEMA,",
    '    stage: "uninstall",',
    '    phase: "remove",',
    "    removed,",
    "    added,",
    "    modified,",
    "    unchangedCount: afterEntries.length - added.length - modified.length,",
    "    emptyManagedDirs: listEmptyManagedDirs(),",
    "  });",
    "} else {",
    '  console.error("usage: node uninstall.mjs <before|remove>");',
    "  process.exit(2);",
    "}",
    "",
  ].join("\n");
}

function renderDiscoveryInstrument(projection: ConformanceKitProjection): string {
  const discoveryKit = projection.binding.discoveryKit!;
  const commands = discoveryKit.groundTruthSteps
    .filter((step): step is Extract<PackagingConformanceScenarioStep, { kind: "command" }> => step.kind === "command")
    .map((step) => step.run);
  return [
    "#!/usr/bin/env node",
    INSTRUMENT_HEADER,
    INSTRUMENT_PRELUDE,
    "// Discovery-kit ground-truth capture (PRD 43 R-DISC-1): the command",
    "// steps of the characterization plan (e.g. pinning the exact harness",
    "// version) captured deterministically; the hand-authoring and harness",
    "// flows are driver work whose findings land in the findings file named",
    "// by the discovery prompt.",
    `const GROUND_TRUTH_COMMANDS = ${JSON.stringify(commands, null, 2)};`,
    "",
    'const stageDir = path.join(EVIDENCE_DIR, "discovery");',
    "mkdirSync(stageDir, { recursive: true });",
    "const commands = GROUND_TRUTH_COMMANDS.map((command, index) =>",
    '  captureCommand(command, path.join(stageDir, "ground-truth-" + (index + 1)), "evidence/discovery/ground-truth-" + (index + 1)),',
    ");",
    'writeJsonFile(path.join(stageDir, "ground-truth-commands.json"), { schemaVersion: OUTPUT_SCHEMA, stage: "discovery", commands });',
    "",
  ].join("\n");
}

/**
 * Preflight instrument (register item D-027): verifies the `make-docs` on the
 * operator's PATH is the CLI this kit was generated and validated against. The
 * kit's commands were projected against the repository CLI at generation time,
 * so running a different `make-docs` — a stale global install being the common
 * case — produces meaningless results and misattributes the failure to Make
 * Docs. Version match is the floor, not a full behavioral fingerprint (two
 * builds can share an rc version string); a registry-digest fingerprint is the
 * recorded stronger follow-up on D-027.
 */
function renderPreflightInstrument(cliVersion: string): string {
  return [
    "#!/usr/bin/env node",
    INSTRUMENT_HEADER,
    INSTRUMENT_PRELUDE,
    "// Run FIRST, before any setup or bar-stage instrument: refuse loudly when",
    "// the make-docs on PATH is not the build this kit was generated from.",
    `const EXPECTED_VERSION = ${JSON.stringify(cliVersion)};`,
    "",
    'const stageDir = path.join(EVIDENCE_DIR, "preflight");',
    "mkdirSync(stageDir, { recursive: true });",
    'const result = spawnSync("make-docs", ["--version"], { encoding: "utf8" });',
    'const actual = (result.stdout || "").trim();',
    "const ok = !result.error && result.status === 0 && actual === EXPECTED_VERSION;",
    'writeJsonFile(path.join(stageDir, "preflight.json"), {',
    "  schemaVersion: OUTPUT_SCHEMA,",
    '  stage: "preflight",',
    "  expectedVersion: EXPECTED_VERSION,",
    "  actualVersion: actual || null,",
    "  exitCode: result.status,",
    "  ok,",
    "});",
    "if (!ok) {",
    "  console.error(",
    '    "PREFLIGHT FAILED: the `make-docs` on your PATH is not the build this kit was generated from.\\n" +',
    '      "  expected (kit generation CLI): " + EXPECTED_VERSION + "\\n" +',
    '      "  actual `make-docs --version`:  " + (actual || "(no output / --version unsupported — an older build)") + "\\n" +',
    '      "The kit commands were validated against the repository CLI at generation time; running a\\n" +',
    '      "different make-docs produces meaningless results. Rebuild and reinstall the CLI first,\\n" +',
    '      "e.g. run `just install-cli-pack` from the repo root, then re-check `make-docs --version` (register item D-027).",',
    "  );",
    "  process.exit(1);",
    "}",
    'console.log("preflight ok: make-docs " + actual + " matches the kit generation CLI.");',
    "",
  ].join("\n");
}

/* --------------------------------------------------------------------------
 * Step rendering, prompts, and the session step script (R-PROMPT-1, R-DISC-1)
 * ------------------------------------------------------------------------ */

const STAGE_INSTRUMENT_INVOCATIONS: Record<ConformanceEvidenceBarStage, string> = {
  install: "node kit/instruments/install.mjs",
  discover: "node kit/instruments/discover.mjs",
  invoke: "node kit/instruments/invoke.mjs",
  uninstall: "node kit/instruments/uninstall.mjs before && node kit/instruments/uninstall.mjs remove",
};

function renderSessionSteps(projection: ConformanceKitProjection): RenderedConformanceSessionStep[] {
  const rendered: RenderedConformanceSessionStep[] = [];
  let sequence = 0;
  const renderStep = (
    step: PackagingConformanceScenarioStep,
    performedBy: RenderedConformanceSessionStep["performedBy"],
    instrument: string | null,
  ): void => {
    sequence += 1;
    rendered.push({
      sequence,
      kind: step.kind,
      barStage: step.barStage ?? null,
      performedBy,
      instrument,
      command: step.kind === "command" ? step.run : null,
      action: step.kind === "harness-action" || step.kind === "human-action" ? step.action : null,
      notes:
        (step.kind === "assertion" ? step.assert : step.notes) ?? null,
    });
  };
  for (const step of projection.setupSteps) {
    renderStep(step, "kit-generation", null);
  }
  for (const step of projection.sessionSteps) {
    if (step.kind === "command" && (step.barStage === "install" || step.barStage === "uninstall")) {
      renderStep(step, "instrument", STAGE_INSTRUMENT_INVOCATIONS[step.barStage]);
    } else if (step.kind === "command") {
      renderStep(step, "driver", null);
    } else {
      renderStep(step, "driver", null);
    }
  }
  return rendered;
}

function describeClaim(claim: { command: string; args: string[]; status: string } | null, absentNote: string): string {
  if (!claim) {
    return absentNote;
  }
  return `\`${[claim.command, ...claim.args].join(" ")}\` (${claim.status})`;
}

function renderSessionPrompt(input: {
  projection: ConformanceKitProjection;
  sessionId: string;
  steps: RenderedConformanceSessionStep[];
}): string {
  const { projection, sessionId, steps } = input;
  const { spec, harness, interrogation } = projection;
  const outcome =
    (REQUIRED_FIRST_PASS_SCENARIOS as Record<string, string>)[spec.scenarioId] ?? spec.title;
  const lines: string[] = [
    `# Conformance lab session \`${sessionId}\``,
    "",
    `Definition: \`${spec.scenarioId}\` v${spec.scenarioVersion} — ${spec.title}`,
    `Execution target: \`${harness}\` (real harness; no simulation is declared for this binding).`,
    "",
    "## What this session assesses",
    "",
    outcome,
    "",
    "## Honesty rules (verbatim)",
    "",
    ...CONFORMANCE_PROMPT_HONESTY_RULES.map((rule) => `- ${rule}`),
    "",
    "## The agent drives, the instruments measure",
    "",
    CONFORMANCE_PROMPT_MEASUREMENT_RULE,
    "",
    "Perform your own discovery and assessment: attempt each step, observe what the",
    "harness actually does, and narrate what you see — including failures, which are",
    "evidence, and blocks, which are valid results. You are never asked to sign off",
    "on an outcome; the deterministic instruments measure, and ingestion judges",
    "against the session manifest. Where a stage genuinely cannot be measured for",
    "this target, say so plainly: it becomes a recorded caveat on the result record,",
    "never a trust fallback (R-EXEC-2). If a precondition is unmet, stop: the session",
    "resolves to an honest `blocked` record (R-EXEC-3).",
    "",
    "## Target specifics (from the harness capability descriptor)",
    "",
    `- Version pin: ${describeClaim(interrogation.versionCommand, "no version command is known for this harness (descriptor gap)")}`,
    `- Launch: ${describeClaim(interrogation.launchCommand, "no launch command is known for this harness (descriptor gap)")}`,
    `- Placement roots the instruments inventory: ${projection.placementRoots.map((root) => `\`${root}\``).join(", ")}`,
    ...interrogation.workspaceNotes.map((note) => `- ${note}`),
    ...(interrogation.knownGaps.length > 0
      ? ["", "Known descriptor gaps (honest absences, not assumptions):", ...interrogation.knownGaps.map((gap) => `- ${gap}`)]
      : []),
    "",
    "## Preconditions",
    "",
    "Probeable preconditions (probe before starting; an unmet probe means `blocked`):",
    ...spec.packagingExtension.preconditions
      .filter((precondition) => precondition.probe === "command-succeeds")
      .map((precondition) => {
        const probe = projection.binding.preconditionProbes[precondition.id];
        return `- \`${precondition.id}\`: ${precondition.description}${probe ? ` Probe: \`${[probe.command, ...probe.args].join(" ")}\`` : ""}`;
      }),
    "",
    "Operator attestations (recorded as attestations at ingestion, never as measurements):",
    ...spec.packagingExtension.preconditions
      .filter((precondition) => precondition.probe === "operator-attestation")
      .map((precondition) => `- \`${precondition.id}\`: ${precondition.description}`),
    "",
    "## When to run each instrument",
    "",
    "- preflight (FIRST, before anything else): run `node kit/instruments/preflight.mjs` — it fails loudly if the `make-docs` on your PATH is not the build this kit was generated from. Running a different `make-docs` (a stale global install is the common trap) produces meaningless results; fix your PATH before proceeding (register item D-027).",
    `- install: run \`${STAGE_INSTRUMENT_INVOCATIONS.install}\` from the session root — it executes the install commands itself, capturing exit codes, transcripts, and a placement-root inventory. Do not run the install commands by hand; hand-run output is narrative, not evidence.`,
    `- discover: after performing the discovery harness actions, run \`${STAGE_INSTRUMENT_INVOCATIONS.discover}\` to capture the descriptor-declared listing surfaces.`,
    "- invoke: perform the invocation in the harness, save the harness transcript VERBATIM to `evidence/invoke/probe-transcript.txt`, then run `node kit/instruments/invoke.mjs`.",
    "- uninstall: run `node kit/instruments/uninstall.mjs before` immediately before removal, then `node kit/instruments/uninstall.mjs remove` — it executes the removal commands and records the byte-level diff.",
    "",
    "## Session steps",
    "",
    ...steps.flatMap((step) => {
      const stage = step.barStage ? ` [${step.barStage}]` : "";
      const who =
        step.performedBy === "kit-generation"
          ? "already performed by kit generation"
          : step.performedBy === "instrument"
            ? `instrument: \`${step.instrument}\``
            : "driver";
      const body =
        step.command !== null
          ? `\`${step.command}\``
          : step.action !== null
            ? step.action
            : (step.notes ?? "");
      return [
        `${step.sequence}. (${step.kind}${stage}; ${who}) ${body}`,
        ...(step.command !== null && step.notes ? [`   ${step.notes}`] : []),
      ];
    }),
    "",
    "## Narrative",
    "",
    "Write your session narrative to `evidence/session-narrative.md`: what you",
    "attempted, what you observed, what blocked or failed, and anything a reviewer",
    "should know. The narrative is context for ingestion — it is never a verdict",
    "input, and it cannot substitute for a missing instrument output.",
    "",
  ];
  return lines.join("\n");
}

function renderDiscoveryPrompt(input: {
  projection: ConformanceKitProjection;
  sessionId: string;
}): string {
  const discoveryKit = input.projection.binding.discoveryKit!;
  const lines: string[] = [
    `# Discovery kit — lab session \`${input.sessionId}\``,
    "",
    "This is a FIRST-RUN DISCOVERY session (PRD 43 R-DISC-1): it precedes any bar",
    "assertion and records ground truth for what the real harness version accepts.",
    "Bar assertions run only after this ground truth exists, so a later failure",
    'distinguishes "our shapes are wrong" from "the harness cannot do this".',
    "",
    "## Purpose",
    "",
    discoveryKit.purpose,
    "",
    `## Resolves probe (register item ${discoveryKit.resolvesProbe.registerItem})`,
    "",
    `- Register: ${discoveryKit.resolvesProbe.ref}`,
    `- ${discoveryKit.resolvesProbe.summary}`,
    "",
    "## Honesty rules (verbatim)",
    "",
    ...CONFORMANCE_PROMPT_HONESTY_RULES.map((rule) => `- ${rule}`),
    "",
    CONFORMANCE_PROMPT_MEASUREMENT_RULE,
    "",
    "## Ground-truth steps",
    "",
    "Run `node kit/instruments/discovery.mjs` first: it captures the command-step",
    "ground truth (e.g. the exact harness version pin) deterministically. Then:",
    "",
    ...discoveryKit.groundTruthSteps.map((step, index) => {
      const body = step.kind === "command" ? `\`${step.run}\`` : step.kind === "assertion" ? step.assert : step.action;
      return `${index + 1}. (${step.kind}) ${body}`;
    }),
    "",
    "## Diff targets",
    "",
    "Diff the GENERATED shapes against the recorded ground truth for each of:",
    ...discoveryKit.diffTargets.map((target) => `- ${target}`),
    "",
    "## Findings",
    "",
    "Record every accepted and rejected shape, and every divergence of a generated",
    "shape from ground truth, in `evidence/discovery/findings.md` (one section per",
    "diff target). Findings feed DESCRIPTOR CORRECTIONS — each divergence is a",
    "compiler or descriptor defect to file, re-triggering the contract-digest",
    "re-verification — never a relaxation of the evidence bar.",
    "",
    `Where the findings are recorded: ${discoveryKit.recordedIn}`,
    "",
  ];
  return lines.join("\n");
}

function renderSessionStepScript(input: {
  projection: ConformanceKitProjection;
  sessionId: string;
  steps: RenderedConformanceSessionStep[];
}): string {
  const emittedInstruments = new Set<string>();
  const lines: string[] = [
    "#!/usr/bin/env bash",
    `# Conformance lab session \`${input.sessionId}\` — rendered step script (PRD 43 R-KIT-1).`,
    "# The agent drives, the instruments measure (PRD 44 R-EXEC-1): harness and",
    "# human actions are echoed for the driver; deterministic command steps run",
    "# through the instruments so exit codes and transcripts land in evidence/.",
    "set -euo pipefail",
    'KIT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"',
    'SESSION_ROOT="$(cd "$KIT_DIR/.." && pwd)"',
    'WORKSPACE="$SESSION_ROOT/workspace"',
    "export WORKSPACE",
    'cd "$SESSION_ROOT"',
    "",
    "# Preflight (register item D-027): refuse to run against the wrong make-docs.",
    "# The kit was generated and validated against a specific repository CLI, so a",
    "# different make-docs on PATH produces meaningless conformance results.",
    "node kit/instruments/preflight.mjs",
    "",
  ];
  for (const step of input.steps) {
    const stage = step.barStage ? ` [${step.barStage}]` : "";
    lines.push(`# Step ${step.sequence} (${step.kind}${stage}; ${step.performedBy})`);
    if (step.performedBy === "kit-generation") {
      lines.push(`# Already performed by kit generation: ${step.command ?? ""}`);
    } else if (step.performedBy === "instrument") {
      if (emittedInstruments.has(step.instrument!)) {
        lines.push(`# Covered by \`${step.instrument}\` above: ${step.command ?? ""}`);
      } else {
        emittedInstruments.add(step.instrument!);
        lines.push(step.instrument!);
      }
    } else if (step.command !== null) {
      lines.push(`( ${step.command} )`);
    } else if (step.kind === "assertion") {
      lines.push(`echo "ASSERTION (judged at ingestion, from instrument outputs): ${shellEscapeForEcho(step.notes ?? "")}"`);
    } else {
      lines.push(`echo "DRIVER ACTION (${step.kind}): ${shellEscapeForEcho(step.action ?? "")}"`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

function shellEscapeForEcho(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\$/g, "\\$").replace(/`/g, "\\`");
}

/* --------------------------------------------------------------------------
 * Manifest assembly (t5)
 * ------------------------------------------------------------------------ */

function buildExpectedEvidence(
  projection: ConformanceKitProjection,
): Record<ConformanceEvidenceBarStage, ConformanceSessionExpectedEvidence> {
  return {
    install: {
      instrument: STAGE_INSTRUMENT_INVOCATIONS.install,
      outputs: ["evidence/install/commands.json", "evidence/install/placement-inventory.json"],
      rule: "every captured install command records exit code 0, and the placement inventory lists the generated files under the descriptor-declared placement roots",
    },
    discover: {
      instrument: STAGE_INSTRUMENT_INVOCATIONS.discover,
      outputs: ["evidence/discover/captures.json"],
      rule: "every descriptor-declared listing capture exists and the captures record the installed package on the harness's listing surfaces",
    },
    invoke: {
      instrument: STAGE_INSTRUMENT_INVOCATIONS.invoke,
      outputs: ["evidence/invoke/probe-assertion.json"],
      rule: `the driver-saved transcript exists and the marker scan records found=true for the expected markers (${projection.invokeMarkers.join(", ")})`,
    },
    uninstall: {
      instrument: STAGE_INSTRUMENT_INVOCATIONS.uninstall,
      outputs: [
        "evidence/uninstall/before-inventory.json",
        "evidence/uninstall/removal-commands.json",
        "evidence/uninstall/diff.json",
      ],
      rule: "every removal command records exit code 0, the diff shows managed outputs removed with no orphaned empty managed directories, and every non-managed file is byte-identical",
    },
  };
}

function buildSessionManifest(input: {
  projection: ConformanceKitProjection;
  sessionId: string;
  cliVersion: string;
  steps: RenderedConformanceSessionStep[];
}): ConformanceSessionManifest {
  const { projection, sessionId } = input;
  const { spec, binding, descriptor } = projection;
  return {
    schemaVersion: CONFORMANCE_SESSION_MANIFEST_SCHEMA_VERSION,
    sessionId,
    scenarioId: spec.scenarioId,
    scenarioVersion: spec.scenarioVersion,
    title: spec.title,
    harness: projection.harness,
    registryTupleIds: [...binding.registryTupleIds],
    generationInputs: {
      cliVersion: input.cliVersion,
      descriptorContractDigest: computeHarnessContractDigest(descriptor),
      descriptorVerificationStatus: descriptor.verification.status,
      targetParameters: { ...(binding.parameters ?? {}) },
    },
    layout: { kit: "kit", workspace: "workspace", evidence: "evidence" },
    transcriptPolicy: spec.packagingExtension.transcriptPolicy,
    evidenceHomes: {
      default: CONFORMANCE_TRANSCRIPT_DISCARDED_WITH_SESSION,
      retained: `<store-root>/${CONFORMANCE_LAB_SESSIONS_PATH_FRAGMENT}${sessionId}/`,
    },
    executionRules: [...CONFORMANCE_SESSION_EXECUTION_RULES],
    preconditions: {
      probes: spec.packagingExtension.preconditions
        .filter((precondition) => precondition.probe === "command-succeeds")
        .map((precondition) => {
          const probe = binding.preconditionProbes[precondition.id]!;
          return {
            id: precondition.id,
            description: precondition.description,
            command: probe.command,
            args: [...probe.args],
          };
        }),
      attestations: spec.packagingExtension.preconditions
        .filter((precondition) => precondition.probe === "operator-attestation")
        .map((precondition) => ({ id: precondition.id, description: precondition.description })),
    },
    sessionSteps: input.steps,
    expectedEvidence: buildExpectedEvidence(projection),
    discoveryKit: binding.discoveryKit
      ? {
          prompt: "kit/prompts/discovery-prompt.md",
          instrument: "node kit/instruments/discovery.mjs",
          findingsFile: "evidence/discovery/findings.md",
          resolvesProbe: { ...binding.discoveryKit.resolvesProbe },
        }
      : null,
  };
}

/* --------------------------------------------------------------------------
 * Workspace materialization and the dry-run pipeline proof
 * ------------------------------------------------------------------------ */

const MKTEMP_WORKSPACE_PREFIX = /^WORKSPACE=\$\(mktemp -d\)\s*&&\s*/;

async function materializeSessionWorkspace(input: {
  projection: ConformanceKitProjection;
  workspaceDir: string;
  repoRoot: string;
}): Promise<void> {
  const { projection, workspaceDir, repoRoot } = input;
  for (const step of projection.setupSteps) {
    // The kit owns the workspace: the definition's mktemp assignment is
    // replaced by the session's workspace directory; the committed step text
    // otherwise executes AS WRITTEN, so materialization can never drift from
    // the definition (the D-023 hand-transcription failure mode).
    const script = step.run.replace(MKTEMP_WORKSPACE_PREFIX, "");
    const invocations = listMakeDocsInvocations(script);
    if (invocations.length > 0) {
      for (const argv of invocations) {
        // Setup-family invocations run in-process through the real CLI with
        // `--target` bound to the workspace (the same directory `cd
        // "$WORKSPACE" &&` binds in the committed text).
        const targeted = argv[0] === "setup" && !argv.includes("--target")
          ? [...argv, "--target", workspaceDir]
          : argv;
        await runCli(targeted);
      }
      continue;
    }
    const result = spawnSync("bash", ["-c", script], {
      cwd: repoRoot,
      env: { ...process.env, WORKSPACE: workspaceDir },
      encoding: "utf8",
    });
    if (result.status !== 0) {
      throw projectionError(
        projection.spec,
        projection.harness,
        `workspace-establishment step \`${step.run}\` failed during materialization: ${result.stderr || result.stdout || `exit ${String(result.status)}`}`,
      );
    }
  }
}

/**
 * The generation-time pipeline proof (R-KIT-3): every `run package ship`
 * session command is driven end to end through the operation core under the
 * dry-run context — plan, preview, and a write leg that plans instead of
 * writing — against the freshly materialized workspace, via the same shipped
 * compiler and descriptors the product uses. Anything short of a clean
 * `planned` result fails generation with the stops named.
 */
async function proveShipCommandsExecutable(input: {
  projection: ConformanceKitProjection;
  workspaceDir: string;
}): Promise<void> {
  const { projection, workspaceDir } = input;
  const shipSteps = [...projection.installCommandSteps, ...projection.uninstallCommandSteps].filter(
    (entry) => entry.shipInvocationArgv.length > 0,
  );
  for (const entry of shipSteps) {
    for (const argv of entry.shipInvocationArgv) {
      const adapted = adaptRunCliArgv([...argv.slice(1), "--repo-root", workspaceDir]);
      const invocation = await invokeOperation(
        adapted.operationId,
        adapted.invocation.input,
        createExecutionContext({
          surface: "cli",
          writesAllowed: true,
          dryRun: true,
          approvals: adapted.invocation.context?.approvals ?? [],
        }),
      );
      const result = invocation.value as { status?: string; stage?: string; stops?: { reason: string; message: string }[] };
      if (result.status !== "planned") {
        const stops = (result.stops ?? [])
          .map((stop) => `${stop.reason}: ${stop.message}`)
          .join("; ");
        throw projectionError(
          projection.spec,
          projection.harness,
          `command step \`${entry.step.run}\` aborted the dry-run packaging pipeline at ${result.stage ?? "unknown"} — ${stops || "no stop detail"}`,
        );
      }
    }
  }
}

/* --------------------------------------------------------------------------
 * Generation (t2, t5)
 * ------------------------------------------------------------------------ */

function assertSessionRootOutsideRepo(sessionRoot: string, repoRoot: string): void {
  const relative = path.relative(repoRoot, sessionRoot);
  if (relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative))) {
    throw new OperationError(
      `Lab-session root \`${sessionRoot}\` lies inside the repository \`${repoRoot}\`; nothing a session produces is ever written under the repository (R-KIT-2, PRD 44 R-NAME-2).`,
    );
  }
}

function readCliVersion(repoRoot: string): string {
  for (const candidate of ["packages/cli/package.json", "package.json"]) {
    const packagePath = path.join(repoRoot, candidate);
    if (existsSync(packagePath)) {
      const parsed = JSON.parse(readFileSync(packagePath, "utf8")) as { version?: string };
      if (parsed.version) {
        return parsed.version;
      }
    }
  }
  return "unknown";
}

function writeKitFile(sessionRoot: string, relative: string, content: string, files: string[]): void {
  const absolute = path.join(sessionRoot, relative);
  mkdirSync(path.dirname(absolute), { recursive: true });
  writeFileSync(absolute, content);
  files.push(relative);
}

/**
 * Generates one conformance kit for a (definition, target) pair into a
 * disposable lab-session root (R-KIT-1..2). Fails closed — with any created
 * session artifacts removed — when the definition cannot project to a
 * command sequence the current CLI accepts (R-KIT-3).
 */
export async function generateConformanceKit(
  input: GenerateConformanceKitInput,
): Promise<GeneratedConformanceKit> {
  const repoRoot = path.resolve(input.repoRoot ?? ".");
  const sessionRoot = path.resolve(input.sessionRoot);
  assertSessionRootOutsideRepo(sessionRoot, repoRoot);
  const { outcome } = splitConformanceScenarioId(input.spec.scenarioId);
  const sessionId = input.sessionId
    ? validateConformanceLabSessionId(input.sessionId)
    : mintConformanceLabSessionId({
        date: input.sessionDate ?? new Date().toISOString().slice(0, 10),
        harness: input.harness,
        outcome,
      });

  // Fail closed BEFORE any session artifact exists (t3): the full static
  // projection — uncovered targets, descriptor gaps, unprojectable commands,
  // D-023 defect classes — runs with nothing on disk yet.
  const projection = projectConformanceKit({
    spec: input.spec,
    harness: input.harness,
    repoRoot,
    descriptors: input.descriptors,
  });

  if (existsSync(sessionRoot) && readdirSync(sessionRoot).length > 0) {
    throw new OperationError(
      `Lab-session root \`${sessionRoot}\` already exists and is not empty; a session root is disposable and always starts fresh (R-KIT-2).`,
    );
  }
  const createdSessionRoot = !existsSync(sessionRoot);
  const kitDir = path.join(sessionRoot, "kit");
  const workspaceDir = path.join(sessionRoot, "workspace");
  const evidenceDir = path.join(sessionRoot, "evidence");
  // Generation-scoped store isolation: the in-process `make-docs setup`
  // materialization would otherwise register the disposable workspace in the
  // operator's real machine-level store — residue a disposable session must
  // never leave (PRD 44 R-NAME-2 spirit). The store root is bound to a
  // session-local scratch for the duration of generation and restored after;
  // the scratch is discarded with the session root like everything else.
  const previousStoreRoot = process.env.MAKE_DOCS_HOME;
  process.env.MAKE_DOCS_HOME = path.join(sessionRoot, ".store-scratch");
  try {
    mkdirSync(kitDir, { recursive: true });
    mkdirSync(workspaceDir, { recursive: true });
    mkdirSync(evidenceDir, { recursive: true });

    await materializeSessionWorkspace({ projection, workspaceDir, repoRoot });
    await proveShipCommandsExecutable({ projection, workspaceDir });

    const steps = renderSessionSteps(projection);
    const cliVersion = input.cliVersion ?? readCliVersion(repoRoot);
    const manifest = buildSessionManifest({ projection, sessionId, cliVersion, steps });

    const kitFiles: string[] = [];
    writeKitFile(sessionRoot, "kit/manifest.json", `${JSON.stringify(manifest, null, 2)}\n`, kitFiles);
    writeKitFile(
      sessionRoot,
      "kit/prompts/session-prompt.md",
      renderSessionPrompt({ projection, sessionId, steps }),
      kitFiles,
    );
    writeKitFile(sessionRoot, "kit/session-steps.sh", renderSessionStepScript({ projection, sessionId, steps }), kitFiles);
    writeKitFile(sessionRoot, "kit/instruments/preflight.mjs", renderPreflightInstrument(cliVersion), kitFiles);
    writeKitFile(sessionRoot, "kit/instruments/install.mjs", renderInstallInstrument(projection), kitFiles);
    writeKitFile(sessionRoot, "kit/instruments/discover.mjs", renderDiscoverInstrument(projection), kitFiles);
    writeKitFile(sessionRoot, "kit/instruments/invoke.mjs", renderInvokeInstrument(projection), kitFiles);
    writeKitFile(sessionRoot, "kit/instruments/uninstall.mjs", renderUninstallInstrument(projection), kitFiles);
    if (projection.binding.discoveryKit) {
      writeKitFile(
        sessionRoot,
        "kit/prompts/discovery-prompt.md",
        renderDiscoveryPrompt({ projection, sessionId }),
        kitFiles,
      );
      writeKitFile(sessionRoot, "kit/instruments/discovery.mjs", renderDiscoveryInstrument(projection), kitFiles);
    }

    return {
      sessionId,
      sessionRoot,
      kitDir,
      workspaceDir,
      evidenceDir,
      manifestPath: path.join(sessionRoot, "kit", "manifest.json"),
      manifest,
      kitFiles: kitFiles.sort(),
    };
  } catch (error) {
    // A failed generation leaves no session artifacts behind (t3): remove
    // what this call created before rethrowing.
    if (createdSessionRoot) {
      rmSync(sessionRoot, { recursive: true, force: true });
    } else {
      for (const child of [kitDir, workspaceDir, evidenceDir, path.join(sessionRoot, ".store-scratch")]) {
        rmSync(child, { recursive: true, force: true });
      }
    }
    throw error;
  } finally {
    if (previousStoreRoot === undefined) {
      delete process.env.MAKE_DOCS_HOME;
    } else {
      process.env.MAKE_DOCS_HOME = previousStoreRoot;
    }
  }
}

/**
 * Generates one target's full first-pass suite (R-KIT-1): one session per
 * required first-pass definition, each in its own session root under
 * `sessionsRoot/<session-id>/`.
 */
export async function generateFirstPassConformanceKitSuite(input: {
  sessionsRoot: string;
  harness?: string;
  repoRoot?: string;
  sessionDate?: string;
  descriptors?: HarnessCapabilityDescriptor[];
  cliVersion?: string;
}): Promise<GeneratedConformanceKit[]> {
  const repoRoot = path.resolve(input.repoRoot ?? ".");
  const harness = input.harness ?? REQUIRED_FIRST_PASS_TARGET;
  const specs = loadPackagingConformanceScenarioSpecs({ repoRoot });
  const requiredIds = Object.keys(REQUIRED_FIRST_PASS_SCENARIOS);
  const kits: GeneratedConformanceKit[] = [];
  for (const scenarioId of requiredIds) {
    const spec = specs.find((candidate) => candidate.scenarioId === scenarioId);
    if (!spec) {
      throw new OperationError(
        `Required first-pass scenario \`${scenarioId}\` has no authored definition; the suite cannot generate (R-TEST-2, R-SCHEMA-3).`,
      );
    }
    const { outcome } = splitConformanceScenarioId(scenarioId);
    const sessionId = mintConformanceLabSessionId({
      date: input.sessionDate ?? new Date().toISOString().slice(0, 10),
      harness,
      outcome,
    });
    kits.push(
      await generateConformanceKit({
        spec,
        harness,
        sessionRoot: path.join(input.sessionsRoot, sessionId),
        repoRoot,
        sessionId,
        descriptors: input.descriptors,
        cliVersion: input.cliVersion,
      }),
    );
  }
  return kits;
}

/* --------------------------------------------------------------------------
 * Shipped-surface consistency (t4; PRD 43 R-HOME-1)
 * ------------------------------------------------------------------------ */

/**
 * Asserts that kit generation added NOTHING to the shipped surface: no
 * operation-registry identifier and no `run` CLI adapter belongs to the
 * conformance lab. The CLI `run` tree and the MCP tool list both derive from
 * the registry, so the registry leg covers all three shipped surfaces; the
 * adapter leg guards the one authored CLI map. Empty means the W18 R11
 * parity rule is preserved vacuously (R-HOME-1; revisit seam on register
 * item Q-022).
 */
export function listConformanceLabShippedSurfaceViolations(): string[] {
  const violations: string[] = [];
  const labPattern = /conformance|lab-session|(^|[.-])kit($|[.-])/;
  for (const operation of listOperations()) {
    if (labPattern.test(operation.id)) {
      violations.push(
        `operation registry identifier \`${operation.id}\` names a conformance-lab surface; kit generation is maintainer tooling and is never registered (R-HOME-1)`,
      );
    }
  }
  for (const adapterId of listRunCliAdapters()) {
    if (labPattern.test(adapterId)) {
      violations.push(
        `run CLI adapter \`${adapterId}\` names a conformance-lab surface; the lab never lands on the shipped CLI tree (R-HOME-1)`,
      );
    }
  }
  return violations;
}
