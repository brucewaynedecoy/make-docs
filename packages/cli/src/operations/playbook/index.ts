import { existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { parseDocument } from "yaml";
import {
  HARNESS_CAPABILITY_IDS,
  PERSONA_SLUG_PATTERN,
  getConfigRenderingLabels,
  loadMakeDocsConfigOrThrow,
  type HarnessCapabilityId,
  type HarnessCapabilityRecord,
} from "../../config";
import {
  parseAndValidatePlaybook,
  PLAYBOOK_FILE_SUFFIX,
  playbookSlugFromPath,
} from "../../playbook";
import { normalizeRelativePath, readTextFile } from "../../utils";
import { resolveRuntimeCapabilityRecordKey } from "../harness-registry";
import { findRepoRoot, repoRelativePath } from "../shared";
import { OperationError, type JsonValue } from "../types";
import type { OperationResult } from "../types";
import {
  createPlaybookRunState,
  normalizeOutputSurfaceClaims,
  type PlaybookRunState,
} from "./run-state";

export const PLAYBOOKS_RELATIVE_DIR = "docs/assets/playbooks";
export const PLAYBOOK_STACKS = ["build", "run"] as const;
export const PLAYBOOK_STATUSES = ["proposed", "accepted", "deprecated"] as const;

export type PlaybookStack = (typeof PLAYBOOK_STACKS)[number];
export type PlaybookStatus = (typeof PLAYBOOK_STATUSES)[number];
export type PlaybookSelectionMode = "explicit-path" | "qualified-ref" | "bare-ref";
export type PlaybookChildPolicy = "none" | "serial" | "parallel";
export type PlaybookConcurrencyPolicy = "serial" | "parallel-allowed" | "parallel-required";
export type PlaybookInvocationStatus = "ready" | "paused" | "blocked";
export type PlaybookSupportSurface = "cli" | "mcp" | "plugin" | "skill" | "template-sync" | "unattended";

export interface PlaybookRunMetadata {
  requiresCapabilities: HarnessCapabilityId[];
  prefersCapabilities: HarnessCapabilityId[];
  childPlaybooks: PlaybookChildPolicy;
  concurrency: PlaybookConcurrencyPolicy;
  outputSurfaces: string[];
  unattended: boolean;
}

export interface PlaybookCatalogEntry {
  path: string;
  persona: string;
  slug: string;
  ref: string;
  stack: PlaybookStack;
  title: string;
  summary: string;
  status: PlaybookStatus;
  run: PlaybookRunMetadata;
}

export interface PlaybookCatalog {
  repoRoot: string;
  playbooksDir: string;
  entries: PlaybookCatalogEntry[];
  diagnostics: Array<{ path: string; message: string }>;
}

export interface PlaybookResolution {
  repoRoot: string;
  ref: string;
  requestedStack: PlaybookStack | null;
  mode: PlaybookSelectionMode;
  entry: PlaybookCatalogEntry;
  candidates: PlaybookCatalogEntry[];
}

export interface HarnessCapabilityEvaluation {
  repoRoot: string;
  harness: string;
  record: HarnessCapabilityRecord | null;
  requiredCapabilities: HarnessCapabilityId[];
  preferredCapabilities: HarnessCapabilityId[];
  satisfiedRequired: HarnessCapabilityId[];
  unknownRequired: HarnessCapabilityId[];
  unsupportedRequired: HarnessCapabilityId[];
  availablePreferred: HarnessCapabilityId[];
  fallbackPreferred: HarnessCapabilityId[];
  status: "ready" | "serial-gated-fallback" | "manual-review-required";
  guidance: string[];
}

export interface PlaybookInvocationStep {
  id: string;
  index: number;
  text: string;
  sourceSection: "procedure" | "gate" | "assist" | "output";
}

export interface PlaybookAuthorityPathRef {
  path: string;
  exists: boolean;
  loaded: boolean;
}

export interface PlaybookAuthoritySource {
  index: number;
  text: string;
  pathRefs: PlaybookAuthorityPathRef[];
}

export interface PlaybookInvocationPlan {
  repoRoot: string;
  resolution: PlaybookResolution;
  /** Store row key of the created run state (R-STORE-2); no repository state path exists. */
  projectId: string;
  state: PlaybookRunState;
  authority: PlaybookAuthoritySource[];
  configPresentation: ReturnType<typeof getConfigRenderingLabels>;
  procedure: PlaybookInvocationStep[];
  gates: PlaybookInvocationStep[];
  assists: {
    required: HarnessCapabilityId[];
    preferred: HarnessCapabilityId[];
    status: HarnessCapabilityEvaluation["status"];
    guidance: string[];
  };
  outputRouting: {
    playbookDeclaredSurfaces: string[];
    callerSurfaceClaims: string[];
    effectiveSurfaceClaims: string[];
  };
  supportClaims: Record<PlaybookSupportSurface, "provisional">;
  status: PlaybookInvocationStatus;
  stopReason: string | null;
  nextStep: PlaybookInvocationStep | null;
}

export function buildPlaybookCatalog(input: {
  repoRoot?: string;
} = {}): PlaybookCatalog {
  const repoRoot = findRepoRoot(input.repoRoot);
  const playbooksDir = path.join(repoRoot, PLAYBOOKS_RELATIVE_DIR);
  const knownPersonas = getKnownPersonaSlugs(repoRoot);
  const entries: PlaybookCatalogEntry[] = [];
  const diagnostics: PlaybookCatalog["diagnostics"] = [];

  if (!existsSync(playbooksDir)) {
    return {
      repoRoot,
      playbooksDir: PLAYBOOKS_RELATIVE_DIR,
      entries,
      diagnostics,
    };
  }

  for (const persona of sortedDirectoryNames(playbooksDir)) {
    const personaDir = path.join(playbooksDir, persona);
    for (const fileName of sortedMarkdownFiles(personaDir)) {
      const filePath = path.join(personaDir, fileName);
      const parsed = parsePlaybookFile(filePath, repoRoot, knownPersonas);
      if (parsed.entry) {
        entries.push(parsed.entry);
      }
      diagnostics.push(...parsed.diagnostics);
    }
  }

  return {
    repoRoot,
    playbooksDir: PLAYBOOKS_RELATIVE_DIR,
    entries: entries.sort((left, right) => left.ref.localeCompare(right.ref)),
    diagnostics,
  };
}

export function resolvePlaybook(input: {
  repoRoot?: string;
  ref: string;
  requestedStack?: string | null;
}): PlaybookResolution {
  const repoRoot = findRepoRoot(input.repoRoot);
  const ref = normalizeReference(input.ref);
  const requestedStack = parseRequestedStack(input.requestedStack);

  if (isExplicitPath(ref)) {
    const entry = parseExplicitPlaybookPath(repoRoot, ref);
    assertRequestedStack(entry, requestedStack);
    return {
      repoRoot,
      ref,
      requestedStack,
      mode: "explicit-path",
      entry,
      candidates: [entry],
    };
  }

  const catalog = buildPlaybookCatalog({ repoRoot });
  const qualified = parseQualifiedRef(ref);
  if (qualified) {
    const match = catalog.entries.find(
      (entry) => entry.persona === qualified.persona && entry.slug === qualified.slug,
    );
    if (!match) {
      throw new OperationError(`No playbook found for qualified ref \`${ref}\`.`);
    }
    assertRequestedStack(match, requestedStack);
    return {
      repoRoot,
      ref,
      requestedStack,
      mode: "qualified-ref",
      entry: match,
      candidates: [match],
    };
  }

  const normalized = normalizeBareToken(ref);
  const candidates = catalog.entries.filter(
    (entry) => entry.slug === ref || normalizeBareToken(entry.title) === normalized,
  );
  if (candidates.length === 0) {
    throw new OperationError(`No playbook found for bare ref \`${ref}\`.`);
  }

  const stackMatches = requestedStack
    ? candidates.filter((candidate) => candidate.stack === requestedStack)
    : candidates;
  if (stackMatches.length === 0) {
    throw new OperationError(
      `Playbook ref \`${ref}\` does not match requested stack \`${requestedStack}\`. Candidates: ${formatCandidates(candidates)}.`,
    );
  }
  if (stackMatches.length > 1) {
    throw new OperationError(
      `Ambiguous playbook ref \`${ref}\`; provide persona/slug and, if needed, a stack. Candidates: ${formatCandidates(stackMatches)}.`,
    );
  }

  return {
    repoRoot,
    ref,
    requestedStack,
    mode: "bare-ref",
    entry: stackMatches[0]!,
    candidates,
  };
}

/**
 * The surfaced `playbook.catalog` operation is the library-backed contract
 * catalog in `./contract` (W18 R6 P4). `buildPlaybookCatalog` above remains
 * the W18 R4-era run-resolution catalog consumed internally by
 * `resolvePlaybook`, the run-state operations, and packaging until the
 * runner lineage adopts the Playbook model.
 */
export {
  catalogPlaybooks,
  PLAYBOOK_CATALOG_OPERATION_ID,
  PLAYBOOK_VALIDATE_OPERATION_ID,
  readPlaybookContractCatalog,
  readPlaybookContractCatalog as readPlaybookCatalog,
  readPlaybookValidation,
  validatePlaybooks,
} from "./contract";
export type {
  PlaybookContractCatalog,
  PlaybookContractCatalogEntry,
  PlaybookValidationDiagnostic,
  PlaybookValidationReport,
  PlaybookValidationResult,
} from "./contract";

export function readPlaybookResolution(input: {
  repoRoot?: string;
  ref: string;
  requestedStack?: string | null;
}): OperationResult<JsonValue> {
  return {
    value: resolvePlaybook(input) as unknown as JsonValue,
    provenance: {
      domain: "playbook",
      operation: "playbook-resolve",
      source: "shared",
      target: input.ref,
    },
  };
}

export function evaluateHarnessCapabilities(input: {
  repoRoot?: string;
  harness: string;
  requiredCapabilities?: string[];
  preferredCapabilities?: string[];
}): HarnessCapabilityEvaluation {
  const repoRoot = findRepoRoot(input.repoRoot);
  const harness = input.harness.trim();
  if (!harness) {
    throw new OperationError("Harness is required for playbook capability evaluation.");
  }

  const requiredCapabilities = parseCapabilityList(input.requiredCapabilities ?? []);
  const preferredCapabilities = parseCapabilityList(input.preferredCapabilities ?? []);
  const loaded = loadMakeDocsConfigOrThrow(repoRoot);
  // Harness identity resolves through the shared harness registry (W18 R8 P1,
  // R-CAP-1): the registry links each canonical harness id to its run-time
  // capability record key. The record itself and the evaluation semantics
  // below stay owned by this W18 R7 lineage — the registry supplies identity
  // and enumeration only, and unregistered harness ids pass through unchanged.
  const recordKey = resolveRuntimeCapabilityRecordKey({ harness });
  const record = loaded.config.harnessCapabilities.find(
    (candidate) => candidate.harness === recordKey,
  ) ?? null;
  const reviewedCapabilities = record?.reviewStatus === "reviewed" ? record.capabilities : {};

  const satisfiedRequired = filterCapabilityState(requiredCapabilities, reviewedCapabilities, true);
  const unsupportedRequired = filterCapabilityState(requiredCapabilities, reviewedCapabilities, false);
  const unknownRequired = requiredCapabilities.filter(
    (capability) => reviewedCapabilities[capability] === undefined,
  );
  const availablePreferred = filterCapabilityState(preferredCapabilities, reviewedCapabilities, true);
  const fallbackPreferred = preferredCapabilities.filter(
    (capability) => reviewedCapabilities[capability] !== true,
  );
  const manualReviewRequired =
    record?.reviewStatus === "unreviewed" ||
    unknownRequired.length > 0 ||
    unsupportedRequired.length > 0;
  const status = manualReviewRequired
    ? "manual-review-required"
    : fallbackPreferred.length > 0
      ? "serial-gated-fallback"
      : "ready";

  return {
    repoRoot,
    harness,
    record,
    requiredCapabilities,
    preferredCapabilities,
    satisfiedRequired,
    unknownRequired,
    unsupportedRequired,
    availablePreferred,
    fallbackPreferred,
    status,
    guidance: buildCapabilityGuidance({
      fallbackPreferred,
      record,
      unknownRequired,
      unsupportedRequired,
    }),
  };
}

export function readHarnessCapabilityEvaluation(input: {
  repoRoot?: string;
  harness: string;
  requiredCapabilities?: string[];
  preferredCapabilities?: string[];
}): OperationResult<JsonValue> {
  return {
    value: evaluateHarnessCapabilities(input) as unknown as JsonValue,
    provenance: {
      domain: "playbook",
      operation: "playbook-capabilities",
      source: "shared",
      target: input.harness,
    },
  };
}

/**
 * Run state lives in the global store keyed by (project id, run id), never
 * under a repository path (W18 R7 P1; PRD 35 R-STORE-1/R-STORE-2). The
 * storage seam and the run-state record shape live in `./run-state`.
 */
export {
  createPlaybookRunState,
  findOutputSurfaceOverlap,
  initialPlaybookRunCursor,
  inspectPlaybookRunState,
  listPlaybookRunStates,
  loadPlaybookRunModel,
  normalizeOutputSurfaceClaims,
  PLAYBOOK_RUN_TERMINAL_STATUSES,
  playbookRunCursorForStep,
  playbookRunFamilyIds,
  playbookRunStepId,
  readPlaybookRunState,
  requireRunProjectId,
  resolvePlaybookRunIdSelector,
  resolveRunStoreRoot,
  transitionPlaybookRunState,
  writePlaybookRunState,
} from "./run-state";
export type {
  CreatePlaybookRunStateInput,
  CreatePlaybookRunStateResult,
  PlaybookChildRunRecord,
  PlaybookRunCursor,
  PlaybookRunDependencyAvailability,
  PlaybookRunEvidenceRecord,
  PlaybookRunEvidenceScope,
  PlaybookRunExecutionEvidence,
  PlaybookRunExecutionMode,
  PlaybookRunGateDecision,
  PlaybookRunStaleness,
  PlaybookRunState,
  PlaybookRunStepStatusEntry,
  PlaybookRunTerminalStatus,
} from "./run-state";
export { PLAYBOOK_RUN_OUTPUT_EVIDENCE_LIMIT } from "./run-state";

/**
 * The W18 R7 P2/P3 progression engine (PRD 35 R-OP-1..3, R-MODE-1..2,
 * R-RESUME-1..2): `playbook.next`, the mode-aware `playbook.advance`,
 * `playbook.gate`, the digest-checked `playbook.resume`, and
 * `playbook.close` semantics over the run-state storage seam.
 */
export {
  advancePlaybookRun,
  closePlaybookRun,
  computePlaybookRunNext,
  PLAYBOOK_ADVANCE_OUTCOMES,
  PLAYBOOK_GATE_DECISION_VALUES,
  recordPlaybookRunGate,
  resumePlaybookRun,
} from "./progression";
export type {
  AdvancePlaybookRunInput,
  AdvancePlaybookRunResult,
  ClosePlaybookRunInput,
  PlaybookAdvanceAction,
  PlaybookAdvanceExecutionReport,
  PlaybookAdvanceOutcome,
  PlaybookGateDecisionValue,
  PlaybookRunNextDependencyReport,
  PlaybookRunNextPosition,
  PlaybookRunNextReport,
  PlaybookRunNextStepReport,
  RecordPlaybookRunGateInput,
  ResumePlaybookRunInput,
} from "./progression";
export { PLAYBOOK_STEP_COMMAND_TIMEOUT_MS } from "./execution";

/**
 * Run portability (W18 R7 P4; PRD 35 R-PORT-1): explicit, opt-in export and
 * import of a run record plus its evidence as one portable JSON artifact.
 * Neither operation places run state into the repository by default; the
 * artifact shape and the identity-on-import decision are documented in
 * `./portability`.
 */
export {
  exportPlaybookRun,
  importPlaybookRun,
  PLAYBOOK_RUN_EXPORT_FORMAT,
  PLAYBOOK_RUN_EXPORT_FORMAT_VERSION,
} from "./portability";
export type {
  ExportPlaybookRunInput,
  ExportPlaybookRunResult,
  ImportPlaybookRunInput,
  ImportPlaybookRunResult,
  PlaybookRunExportArtifact,
} from "./portability";

export function invokePlaybook(input: {
  repoRoot?: string;
  /** Explicit store root override (tests/sandboxes); defaults to the resolved global store. */
  storeRoot?: string;
  ref: string;
  requestedStack?: string | null;
  harness: string;
  runId?: string;
  outputSurfaceClaims?: string[];
  allowUnattended?: boolean;
  requiredCapabilities?: string[];
  preferredCapabilities?: string[];
}): PlaybookInvocationPlan {
  const repoRoot = findRepoRoot(input.repoRoot);
  const resolution = resolvePlaybook({
    repoRoot,
    ref: input.ref,
    requestedStack: input.requestedStack,
  });
  const document = loadPlaybookDocumentForEntry(repoRoot, resolution.entry);
  const authority = extractAuthoritySources(repoRoot, document.body);
  const missingAuthority = authority
    .flatMap((source) => source.pathRefs)
    .filter((ref) => !ref.exists)
    .map((ref) => ref.path);
  const procedure = extractSectionSteps(document.body, ["procedure"], "procedure");
  const gates = extractSectionSteps(document.body, ["gate", "decision"], "gate");
  const assists = evaluateHarnessCapabilities({
    repoRoot,
    harness: input.harness,
    requiredCapabilities: [
      ...resolution.entry.run.requiresCapabilities,
      ...(input.requiredCapabilities ?? []),
    ],
    preferredCapabilities: [
      ...resolution.entry.run.prefersCapabilities,
      ...(input.preferredCapabilities ?? []),
    ],
  });
  const explicitClaims = normalizeOutputSurfaceClaims(input.outputSurfaceClaims ?? []);
  const playbookDeclaredSurfaces = resolution.entry.run.outputSurfaces;
  const effectiveSurfaceClaims = explicitClaims.length > 0 ? explicitClaims : playbookDeclaredSurfaces;
  const configPresentation = getConfigRenderingLabels(loadMakeDocsConfigOrThrow(repoRoot).config);
  const unattendedAllowed = input.allowUnattended === true && resolution.entry.run.unattended === true;
  const gateStop = gates.length > 0 && !unattendedAllowed ? gates[0]! : null;
  const firstStep = procedure[0] ?? null;
  let status: PlaybookInvocationStatus = "ready";
  let stopReason: string | null = null;
  if (missingAuthority.length > 0) {
    status = "blocked";
    stopReason = `Missing referenced authority sources: ${missingAuthority.join(", ")}.`;
  } else if (assists.status === "manual-review-required") {
    status = "blocked";
    stopReason = "Required Playbook assists require manual review before execution.";
  } else if (gateStop) {
    status = "paused";
    stopReason = "Playbook gate or user-decision point requires review before unattended continuation.";
  }

  const runState = createPlaybookRunState({
    repoRoot,
    storeRoot: input.storeRoot,
    ref: resolution.entry.ref,
    requestedStack: resolution.entry.stack,
    harness: input.harness,
    runId: input.runId,
    // Unattended only with BOTH the caller's opt-in and the Playbook's
    // declared permission (R-GUARD-4); the invoke surface degrades to an
    // attended gate pause instead of failing when permission is missing.
    unattended: unattendedAllowed,
    outputSurfaceClaims: effectiveSurfaceClaims,
    currentStep: firstStep?.id ?? null,
    currentGate: gateStop?.id ?? null,
    // Run status uses only the shared W18 R6 vocabulary (R-STATE-2): a ready
    // plan is a running run, a gate pause waits for the user.
    status: status === "ready" ? "running" : status === "paused" ? "waiting-for-user" : "blocked",
    resumeHints: stopReason ? [stopReason] : [],
    requiredCapabilities: input.requiredCapabilities,
    preferredCapabilities: input.preferredCapabilities,
  });

  return {
    repoRoot,
    resolution,
    projectId: runState.projectId,
    state: runState.state,
    authority,
    configPresentation,
    procedure,
    gates,
    assists: {
      required: assists.requiredCapabilities,
      preferred: assists.preferredCapabilities,
      status: assists.status,
      guidance: assists.guidance,
    },
    outputRouting: {
      playbookDeclaredSurfaces,
      callerSurfaceClaims: explicitClaims,
      effectiveSurfaceClaims,
    },
    supportClaims: buildProvisionalSupportClaims(),
    status,
    stopReason,
    nextStep: status === "blocked" ? null : firstStep,
  };
}

export function writePlaybookInvocation(input: Parameters<typeof invokePlaybook>[0]): OperationResult<JsonValue> {
  return {
    value: invokePlaybook(input) as unknown as JsonValue,
    provenance: {
      domain: "playbook",
      operation: "playbook-run-invoke",
      source: "shared",
      target: input.ref,
    },
  };
}

function parsePlaybookFile(
  filePath: string,
  repoRoot: string,
  knownPersonas = getKnownPersonaSlugs(repoRoot),
): { entry: PlaybookCatalogEntry | null; diagnostics: Array<{ path: string; message: string }> } {
  const relativePath = repoRelativePath(filePath, repoRoot) ?? normalizeRelativePath(filePath);
  const diagnostics: Array<{ path: string; message: string }> = [];
  const source = readTextFile(filePath);
  const document = parsePlaybookDocument(source);
  if (!document) {
    return {
      entry: null,
      diagnostics: [{ path: relativePath, message: "Playbook file is missing YAML frontmatter." }],
    };
  }

  const { body, metadata } = document;
  const pathParts = normalizeRelativePath(relativePath).split("/");
  const persona = pathParts.at(-2) ?? "";
  const slug = playbookSlugFromPath(relativePath);
  const metadataPersona = stringField(metadata, "persona");
  const kind = stringField(metadata, "kind");
  const stack = stringField(metadata, "stack");
  const title = stringField(metadata, "title");
  const summary = stringField(metadata, "summary");
  const status = stringField(metadata, "status");
  const run = parseRunMetadata(metadata.run, relativePath, diagnostics);

  if (kind !== "playbook") {
    diagnostics.push({ path: relativePath, message: "Playbook frontmatter must declare kind: playbook." });
  }
  if (!status || !PLAYBOOK_STATUSES.includes(status as PlaybookStatus)) {
    diagnostics.push({
      path: relativePath,
      message: "Playbook frontmatter must declare status: proposed, status: accepted, or status: deprecated.",
    });
  }
  if (!title) {
    diagnostics.push({ path: relativePath, message: "Playbook frontmatter must include title." });
  }
  if (!summary) {
    diagnostics.push({ path: relativePath, message: "Playbook frontmatter must include summary." });
  }
  if (!PLAYBOOK_STACKS.includes(stack as PlaybookStack)) {
    diagnostics.push({ path: relativePath, message: "Playbook frontmatter must declare stack: build or stack: run." });
  }
  if (!metadataPersona) {
    diagnostics.push({ path: relativePath, message: "Playbook frontmatter must include persona." });
  } else if (!PERSONA_SLUG_PATTERN.test(metadataPersona) || !knownPersonas.has(metadataPersona)) {
    diagnostics.push({ path: relativePath, message: `Playbook persona '${metadataPersona}' is not a configured persona slug.` });
  }
  if (metadataPersona !== persona) {
    diagnostics.push({ path: relativePath, message: "Playbook persona frontmatter must match its directory." });
  }
  if (path.dirname(relativePath) !== `${PLAYBOOKS_RELATIVE_DIR}/${persona}`) {
    diagnostics.push({
      path: relativePath,
      message: `Playbook must live directly under ${PLAYBOOKS_RELATIVE_DIR}/<persona>/<slug>.md.`,
    });
  }
  if (relativePath.endsWith(PLAYBOOK_FILE_SUFFIX)) {
    // Suffix-form Playbooks are governed by the Playbook contract, so the
    // run-resolution catalog defers to the library validator instead of the
    // legacy plain-form body term checks (W18 R6 P4).
    const { diagnostics: libraryDiagnostics } = parseAndValidatePlaybook({
      sourcePath: relativePath,
      source,
    });
    diagnostics.push(
      ...libraryDiagnostics
        .filter((diagnostic) => diagnostic.severity === "error")
        .map((diagnostic) => ({
          path: relativePath,
          message: `${diagnostic.code}: ${diagnostic.message}`,
        })),
    );
  } else {
    diagnostics.push(...validatePlaybookBody(body, relativePath));
  }

  if (diagnostics.length > 0 || !run) {
    return { entry: null, diagnostics };
  }

  return {
    entry: {
      path: relativePath,
      persona,
      slug,
      ref: `${persona}/${slug}`,
      stack: stack as PlaybookStack,
      title: title!,
      summary: summary!,
      status: status as PlaybookStatus,
      run,
    },
    diagnostics: [],
  };
}

function parseRunMetadata(
  value: unknown,
  relativePath: string,
  diagnostics: Array<{ path: string; message: string }>,
): PlaybookRunMetadata | null {
  const defaults: PlaybookRunMetadata = {
    requiresCapabilities: [],
    prefersCapabilities: [],
    childPlaybooks: "none",
    concurrency: "serial",
    outputSurfaces: [],
    unattended: false,
  };
  if (value === undefined) {
    return defaults;
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    diagnostics.push({ path: relativePath, message: "Playbook run metadata must be an object." });
    return null;
  }

  const record = value as Record<string, unknown>;
  const requiresCapabilities = parseRunCapabilityList(record.requires_capabilities, relativePath, diagnostics, "run.requires_capabilities");
  const prefersCapabilities = parseRunCapabilityList(record.prefers_capabilities, relativePath, diagnostics, "run.prefers_capabilities");
  const childPlaybooks = parseChildPolicy(record.child_playbooks, relativePath, diagnostics);
  const concurrency = parseConcurrencyPolicy(record.concurrency, relativePath, diagnostics);
  const outputSurfaces = parseOutputSurfaces(record.output_surfaces, relativePath, diagnostics);
  const unattended = parseUnattended(record.unattended, relativePath, diagnostics);
  if (!requiresCapabilities || !prefersCapabilities || !childPlaybooks || !concurrency || !outputSurfaces || unattended === null) {
    return null;
  }

  return {
    requiresCapabilities,
    prefersCapabilities,
    childPlaybooks,
    concurrency,
    outputSurfaces,
    unattended,
  };
}

function parseExplicitPlaybookPath(repoRoot: string, value: string): PlaybookCatalogEntry {
  const filePath = path.isAbsolute(value) ? value : path.resolve(repoRoot, value);
  if (!existsSync(filePath)) {
    throw new OperationError(`Playbook path does not exist: ${value}`);
  }
  if (!statSync(filePath).isFile()) {
    throw new OperationError(`Playbook path is not a file: ${value}`);
  }
  const parsed = parsePlaybookFile(filePath, repoRoot);
  if (!parsed.entry) {
    throw new OperationError(
      `Invalid playbook metadata for ${value}: ${parsed.diagnostics.map((diagnostic) => diagnostic.message).join(" ")}`,
    );
  }
  return parsed.entry;
}

function parsePlaybookDocument(markdown: string): { metadata: Record<string, unknown>; body: string } | null {
  if (!markdown.startsWith("---\n")) {
    return null;
  }
  const frontmatterEnd = markdown.indexOf("\n---\n", "---\n".length);
  if (frontmatterEnd === -1) {
    return null;
  }
  const frontmatterText = markdown.slice("---\n".length, frontmatterEnd);
  const body = markdown.slice(frontmatterEnd + "\n---\n".length);
  const document = parseDocument(frontmatterText);
  if (document.errors.length > 0) {
    return null;
  }
  const value = document.toJSON();
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return { body, metadata: value as Record<string, unknown> };
}

function validatePlaybookBody(
  body: string,
  relativePath: string,
): Array<{ path: string; message: string }> {
  const normalized = body.toLowerCase();
  const requirements: Array<{ label: string; terms: string[] }> = [
    { label: "purpose and when to use it", terms: ["purpose"] },
    { label: "required inputs and authority order", terms: ["input", "authority"] },
    { label: "step-by-step procedure", terms: ["procedure"] },
    { label: "gates, stop conditions, or user-decision points", terms: ["gate", "decision"] },
    { label: "allowed assists", terms: ["assist"] },
    { label: "expected outputs or handoff artifacts", terms: ["output", "handoff"] },
    { label: "validation or completion expectations", terms: ["validation"] },
  ];

  return requirements
    .filter((requirement) => !requirement.terms.some((term) => normalized.includes(term)))
    .map((requirement) => ({
      path: relativePath,
      message: `Playbook body must define ${requirement.label}.`,
    }));
}

function getKnownPersonaSlugs(repoRoot: string): Set<string> {
  return new Set(loadMakeDocsConfigOrThrow(repoRoot).config.personas.map((persona) => persona.slug));
}

function sortedDirectoryNames(directory: string): string[] {
  return readdirSync(directory)
    .filter((entry) => statSync(path.join(directory, entry)).isDirectory())
    .sort((left, right) => left.localeCompare(right));
}

function sortedMarkdownFiles(directory: string): string[] {
  return readdirSync(directory)
    .filter((entry) => entry.endsWith(".md") && statSync(path.join(directory, entry)).isFile())
    .sort((left, right) => left.localeCompare(right));
}

function stringField(value: Record<string, unknown>, key: string): string | null {
  const field = value[key];
  return typeof field === "string" && field.trim() ? field.trim() : null;
}

function normalizeReference(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new OperationError("Playbook ref is required.");
  }
  return normalizeRelativePath(trimmed);
}

function parseRequestedStack(value: string | null | undefined): PlaybookStack | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  if (!PLAYBOOK_STACKS.includes(value as PlaybookStack)) {
    throw new OperationError("Requested playbook stack must be `build` or `run`.");
  }
  return value as PlaybookStack;
}

function isExplicitPath(value: string): boolean {
  return path.isAbsolute(value) ||
    value.startsWith(".") ||
    value.endsWith(".md") ||
    value.startsWith(`${PLAYBOOKS_RELATIVE_DIR}/`);
}

function parseQualifiedRef(value: string): { persona: string; slug: string } | null {
  const parts = value.split("/");
  return parts.length === 2 && !value.endsWith(".md")
    ? { persona: parts[0]!, slug: parts[1]! }
    : null;
}

function normalizeBareToken(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function assertRequestedStack(entry: PlaybookCatalogEntry, requestedStack: PlaybookStack | null): void {
  if (requestedStack && entry.stack !== requestedStack) {
    throw new OperationError(
      `Playbook \`${entry.ref}\` has stack \`${entry.stack}\`, but \`${requestedStack}\` was requested.`,
    );
  }
}

function formatCandidates(candidates: PlaybookCatalogEntry[]): string {
  return candidates
    .map((candidate) => `${candidate.ref} (${candidate.stack})`)
    .join(", ");
}

function parseCapabilityList(values: string[]): HarnessCapabilityId[] {
  const capabilities: HarnessCapabilityId[] = [];
  for (const value of values) {
    for (const candidate of value.split(",")) {
      const capability = candidate.trim();
      if (!capability) {
        continue;
      }
      if (!HARNESS_CAPABILITY_IDS.includes(capability as HarnessCapabilityId)) {
        throw new OperationError(`Unknown harness capability id: ${capability}`);
      }
      capabilities.push(capability as HarnessCapabilityId);
    }
  }
  return [...new Set(capabilities)];
}

function parseRunCapabilityList(
  value: unknown,
  relativePath: string,
  diagnostics: Array<{ path: string; message: string }>,
  key: string,
): HarnessCapabilityId[] | null {
  if (value === undefined) {
    return [];
  }
  if (!Array.isArray(value)) {
    diagnostics.push({ path: relativePath, message: `${key} must be an array of capability ids.` });
    return null;
  }
  try {
    return parseCapabilityList(value.map(String));
  } catch (error) {
    diagnostics.push({
      path: relativePath,
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

function parseOutputSurfaces(
  value: unknown,
  relativePath: string,
  diagnostics: Array<{ path: string; message: string }>,
): string[] | null {
  if (value === undefined) {
    return [];
  }
  if (!Array.isArray(value)) {
    diagnostics.push({ path: relativePath, message: "run.output_surfaces must be an array of path claims." });
    return null;
  }
  return normalizeOutputSurfaceClaims(value.map(String));
}

function parseUnattended(
  value: unknown,
  relativePath: string,
  diagnostics: Array<{ path: string; message: string }>,
): boolean | null {
  if (value === undefined) {
    return false;
  }
  if (typeof value === "boolean") {
    return value;
  }
  diagnostics.push({ path: relativePath, message: "run.unattended must be a boolean." });
  return null;
}

function parseChildPolicy(
  value: unknown,
  relativePath: string,
  diagnostics: Array<{ path: string; message: string }>,
): PlaybookChildPolicy | null {
  if (value === undefined) {
    return "none";
  }
  if (value === "none" || value === "serial" || value === "parallel") {
    return value;
  }
  diagnostics.push({ path: relativePath, message: "run.child_playbooks must be none, serial, or parallel." });
  return null;
}

function parseConcurrencyPolicy(
  value: unknown,
  relativePath: string,
  diagnostics: Array<{ path: string; message: string }>,
): PlaybookConcurrencyPolicy | null {
  if (value === undefined) {
    return "serial";
  }
  if (value === "serial" || value === "parallel-allowed" || value === "parallel-required") {
    return value;
  }
  diagnostics.push({ path: relativePath, message: "run.concurrency must be serial, parallel-allowed, or parallel-required." });
  return null;
}

function filterCapabilityState(
  capabilities: HarnessCapabilityId[],
  reviewedCapabilities: Partial<Record<HarnessCapabilityId, boolean>>,
  expected: boolean,
): HarnessCapabilityId[] {
  return capabilities.filter((capability) => reviewedCapabilities[capability] === expected);
}

function buildCapabilityGuidance(input: {
  record: HarnessCapabilityRecord | null;
  unknownRequired: HarnessCapabilityId[];
  unsupportedRequired: HarnessCapabilityId[];
  fallbackPreferred: HarnessCapabilityId[];
}): string[] {
  const guidance: string[] = [];
  if (!input.record) {
    guidance.push("No reviewed harness capability record exists; inspect the harness or continue with serial gated execution only when no required capability is missing.");
  } else if (input.record.reviewStatus !== "reviewed") {
    guidance.push("Harness capability record is unreviewed; request review before using it as execution authority.");
  }
  if (input.unknownRequired.length > 0) {
    guidance.push(`Required capabilities are unknown: ${input.unknownRequired.join(", ")}.`);
  }
  if (input.unsupportedRequired.length > 0) {
    guidance.push(`Required capabilities are explicitly unsupported: ${input.unsupportedRequired.join(", ")}.`);
  }
  if (input.fallbackPreferred.length > 0 && input.unknownRequired.length === 0 && input.unsupportedRequired.length === 0) {
    guidance.push(`Optional capabilities are unavailable or unknown; fall back to serial gated execution: ${input.fallbackPreferred.join(", ")}.`);
  }
  if (guidance.length === 0) {
    guidance.push("Reviewed harness capability record satisfies this request.");
  }
  return guidance;
}

function loadPlaybookDocumentForEntry(
  repoRoot: string,
  entry: PlaybookCatalogEntry,
): { metadata: Record<string, unknown>; body: string } {
  const document = parsePlaybookDocument(readTextFile(path.join(repoRoot, entry.path)));
  if (!document) {
    throw new OperationError(`Invalid playbook document for \`${entry.ref}\`.`);
  }
  return document;
}

function extractAuthoritySources(repoRoot: string, body: string): PlaybookAuthoritySource[] {
  const lines = extractSectionLines(body, ["authority"]);
  const items = extractListItems(lines);
  return items.map((text, index) => ({
    index: index + 1,
    text,
    pathRefs: extractInlinePathRefs(text).map((pathRef) => {
      const absolutePath = path.resolve(repoRoot, pathRef);
      return {
        path: normalizeRelativePath(pathRef),
        exists: existsSync(absolutePath),
        loaded: existsSync(absolutePath) && statSync(absolutePath).isFile(),
      };
    }),
  }));
}

function extractSectionSteps(
  body: string,
  headingTerms: string[],
  sourceSection: PlaybookInvocationStep["sourceSection"],
): PlaybookInvocationStep[] {
  return extractListItems(extractSectionLines(body, headingTerms)).map((text, index) => ({
    id: `${sourceSection}-${index + 1}`,
    index: index + 1,
    text,
    sourceSection,
  }));
}

function extractSectionLines(body: string, headingTerms: string[]): string[] {
  const lines = body.split(/\r?\n/);
  const collected: string[] = [];
  let inSection = false;
  for (const line of lines) {
    const heading = line.match(/^(#{2,6})\s+(.+?)\s*$/);
    if (heading) {
      const title = heading[2]!.toLowerCase();
      if (inSection) {
        break;
      }
      inSection = headingTerms.some((term) => title.includes(term));
      continue;
    }
    if (inSection) {
      collected.push(line);
    }
  }
  return collected;
}

function extractListItems(lines: string[]): string[] {
  const items = lines
    .map((line) => line.match(/^\s*(?:[-*]|\d+[.)])\s+(.+?)\s*$/)?.[1]?.trim() ?? "")
    .filter(Boolean);
  if (items.length > 0) {
    return items;
  }
  return lines
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));
}

function extractInlinePathRefs(text: string): string[] {
  const refs: string[] = [];
  const inlineCodePattern = /`([^`]+)`/g;
  let match: RegExpExecArray | null;
  while ((match = inlineCodePattern.exec(text)) !== null) {
    const value = match[1]!.trim();
    if (
      value.startsWith(".make-docs/") ||
      value.startsWith("docs/") ||
      value.startsWith("./") ||
      value.startsWith("../")
    ) {
      refs.push(value);
    }
  }
  return [...new Set(refs)];
}

function buildProvisionalSupportClaims(): Record<PlaybookSupportSurface, "provisional"> {
  return {
    cli: "provisional",
    mcp: "provisional",
    plugin: "provisional",
    skill: "provisional",
    "template-sync": "provisional",
    unattended: "provisional",
  };
}
