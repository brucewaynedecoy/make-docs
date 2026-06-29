import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseDocument } from "yaml";
import {
  HARNESS_CAPABILITY_IDS,
  PERSONA_SLUG_PATTERN,
  loadMakeDocsConfigOrThrow,
  type HarnessCapabilityId,
  type HarnessCapabilityRecord,
} from "../../config";
import {
  createRunId,
  normalizeRelativePath,
  readTextFile,
} from "../../utils";
import {
  loadJsonFile,
  findRepoRoot,
  normalizePath,
  repoRelativePath,
  utcNow,
} from "../shared";
import { OperationError, type JsonValue } from "../types";
import type {
  OperationDomainDescriptor,
  OperationResult,
} from "../types";

export const PLAYBOOKS_RELATIVE_DIR = "docs/assets/playbooks";
export const PLAYBOOK_STACKS = ["build", "run"] as const;
export const PLAYBOOK_STATUSES = ["proposed", "accepted", "deprecated"] as const;

export type PlaybookStack = (typeof PLAYBOOK_STACKS)[number];
export type PlaybookStatus = (typeof PLAYBOOK_STATUSES)[number];
export type PlaybookSelectionMode = "explicit-path" | "qualified-ref" | "bare-ref";
export type PlaybookChildPolicy = "none" | "serial" | "parallel";
export type PlaybookConcurrencyPolicy = "serial" | "parallel-allowed" | "parallel-required";
export type PlaybookRunExecutionMode = "serial" | "parallel";
export type PlaybookRunStatus = "planned" | "running" | "paused" | "blocked" | "completed";

export interface PlaybookRunMetadata {
  requiresCapabilities: HarnessCapabilityId[];
  prefersCapabilities: HarnessCapabilityId[];
  childPlaybooks: PlaybookChildPolicy;
  concurrency: PlaybookConcurrencyPolicy;
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

export interface PlaybookChildRunRecord {
  runId: string;
  playbookRef: string;
  stack: PlaybookStack;
  executionMode: PlaybookRunExecutionMode;
  outputSurfaceClaims: string[];
  status: PlaybookRunStatus;
}

export interface PlaybookRunState {
  schemaVersion: 1;
  runId: string;
  rootRunId: string;
  parentRunId: string | null;
  playbookRef: string;
  playbookPath: string;
  stack: PlaybookStack;
  harness: string;
  capabilitySnapshot: HarnessCapabilityEvaluation;
  currentStep: string | null;
  currentGate: string | null;
  childPolicy: PlaybookChildPolicy;
  concurrencyPolicy: PlaybookConcurrencyPolicy;
  childRuns: PlaybookChildRunRecord[];
  outputSurfaceClaims: string[];
  status: PlaybookRunStatus;
  resumeHints: string[];
  stateSource: "make-docs";
  harnessAssistsAreSourceOfTruth: false;
  createdAt: string;
  updatedAt: string;
}

export const playbookDomain: OperationDomainDescriptor = {
  name: "playbook",
  summary: "Run Playbook resolver, catalog, capability, and state operations.",
  commands: [
    {
      name: "playbook-catalog",
      summary: "List valid playbooks with persona, slug, stack, title, and summary metadata.",
      mutates: false,
      renderModes: ["json"],
    },
    {
      name: "playbook-resolve",
      summary: "Resolve an explicit path, persona/slug, or unique bare playbook reference.",
      mutates: false,
      renderModes: ["json"],
    },
    {
      name: "playbook-capabilities",
      summary: "Evaluate reviewed harness capabilities for a playbook execution request.",
      mutates: false,
      renderModes: ["json"],
    },
    {
      name: "playbook-run-start",
      summary: "Create Make Docs-owned Playbook run state before execution begins.",
      mutates: true,
      renderModes: ["json"],
    },
    {
      name: "playbook-run-read",
      summary: "Read Make Docs-owned Playbook run state for resume or audit.",
      mutates: false,
      renderModes: ["json"],
    },
  ],
};

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

export function readPlaybookCatalog(input: { repoRoot?: string } = {}): OperationResult<JsonValue> {
  return {
    value: buildPlaybookCatalog(input) as unknown as JsonValue,
    provenance: {
      domain: "playbook",
      operation: "playbook-catalog",
      source: "shared",
      target: input.repoRoot,
    },
  };
}

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
  const record = loaded.config.harnessCapabilities.find(
    (candidate) => candidate.harness === harness,
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

export function createPlaybookRunState(input: {
  repoRoot?: string;
  ref: string;
  requestedStack?: string | null;
  harness: string;
  requiredCapabilities?: string[];
  preferredCapabilities?: string[];
  runId?: string;
  parentRunId?: string | null;
  executionMode?: PlaybookRunExecutionMode;
  outputSurfaceClaims?: string[];
  currentStep?: string | null;
  currentGate?: string | null;
  status?: PlaybookRunStatus;
  resumeHints?: string[];
}): { statePath: string; state: PlaybookRunState; parentStatePath: string | null } {
  const repoRoot = findRepoRoot(input.repoRoot);
  const resolution = resolvePlaybook({
    repoRoot,
    ref: input.ref,
    requestedStack: input.requestedStack,
  });
  const entry = resolution.entry;
  const runId = input.runId ?? createRunId();
  const parentRunId = input.parentRunId ?? null;
  const executionMode = input.executionMode ?? "serial";
  const outputSurfaceClaims = normalizeOutputSurfaceClaims(input.outputSurfaceClaims ?? []);
  const parent = parentRunId ? readPlaybookRunState({ repoRoot, runId: parentRunId }) : null;
  validateChildRunRequest({
    entry,
    executionMode,
    outputSurfaceClaims,
    parent,
  });
  const capabilitySnapshot = evaluateHarnessCapabilities({
    repoRoot,
    harness: input.harness,
    requiredCapabilities: [
      ...entry.run.requiresCapabilities,
      ...(input.requiredCapabilities ?? []),
    ],
    preferredCapabilities: [
      ...entry.run.prefersCapabilities,
      ...(input.preferredCapabilities ?? []),
    ],
  });
  const now = utcNow();
  const state: PlaybookRunState = {
    schemaVersion: 1,
    runId,
    rootRunId: parent?.rootRunId ?? runId,
    parentRunId,
    playbookRef: entry.ref,
    playbookPath: entry.path,
    stack: entry.stack,
    harness: input.harness,
    capabilitySnapshot,
    currentStep: input.currentStep ?? null,
    currentGate: input.currentGate ?? null,
    childPolicy: entry.run.childPlaybooks,
    concurrencyPolicy: entry.run.concurrency,
    childRuns: [],
    outputSurfaceClaims,
    status: parseRunStatus(input.status ?? "planned"),
    resumeHints: input.resumeHints ?? [],
    stateSource: "make-docs",
    harnessAssistsAreSourceOfTruth: false,
    createdAt: now,
    updatedAt: now,
  };
  const statePath = playbookRunStatePath(repoRoot, runId);
  mkdirSync(path.dirname(statePath), { recursive: true });
  writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");

  let parentStatePath: string | null = null;
  if (parent) {
    const updatedParent = {
      ...parent,
      childRuns: [
        ...parent.childRuns.filter((child) => child.runId !== runId),
        {
          runId,
          playbookRef: state.playbookRef,
          stack: state.stack,
          executionMode,
          outputSurfaceClaims,
          status: state.status,
        },
      ],
      updatedAt: now,
    };
    parentStatePath = playbookRunStatePath(repoRoot, parent.runId);
    writeFileSync(parentStatePath, `${JSON.stringify(updatedParent, null, 2)}\n`, "utf8");
  }

  return { statePath, state, parentStatePath };
}

export function readPlaybookRunState(input: {
  repoRoot?: string;
  runId: string;
}): PlaybookRunState {
  const repoRoot = findRepoRoot(input.repoRoot);
  const statePath = playbookRunStatePath(repoRoot, input.runId);
  const value = loadJsonFile(statePath);
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new OperationError(`No Playbook run state found for run id \`${input.runId}\`.`);
  }
  return value as unknown as PlaybookRunState;
}

export function writePlaybookRunState(input: Parameters<typeof createPlaybookRunState>[0]): OperationResult<JsonValue> {
  return {
    value: createPlaybookRunState(input) as unknown as JsonValue,
    provenance: {
      domain: "playbook",
      operation: "playbook-run-start",
      source: "shared",
      target: input.ref,
    },
  };
}

export function inspectPlaybookRunState(input: {
  repoRoot?: string;
  runId: string;
}): OperationResult<JsonValue> {
  return {
    value: readPlaybookRunState(input) as unknown as JsonValue,
    provenance: {
      domain: "playbook",
      operation: "playbook-run-read",
      source: "shared",
      target: input.runId,
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
  const document = parsePlaybookDocument(readTextFile(filePath));
  if (!document) {
    return {
      entry: null,
      diagnostics: [{ path: relativePath, message: "Playbook file is missing YAML frontmatter." }],
    };
  }

  const { body, metadata } = document;
  const pathParts = normalizeRelativePath(relativePath).split("/");
  const persona = pathParts.at(-2) ?? "";
  const slug = path.basename(filePath, ".md");
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
  diagnostics.push(...validatePlaybookBody(body, relativePath));

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
  if (!requiresCapabilities || !prefersCapabilities || !childPlaybooks || !concurrency) {
    return null;
  }

  return {
    requiresCapabilities,
    prefersCapabilities,
    childPlaybooks,
    concurrency,
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

function parseRunStatus(value: string): PlaybookRunStatus {
  if (value === "planned" || value === "running" || value === "paused" || value === "blocked" || value === "completed") {
    return value;
  }
  throw new OperationError("Playbook run status must be planned, running, paused, blocked, or completed.");
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

function playbookRunStatePath(repoRoot: string, runId: string): string {
  return path.join(repoRoot, ".make-docs", "runs", "playbooks", runId, "state.json");
}

function normalizeOutputSurfaceClaims(claims: string[]): string[] {
  return [...new Set(claims.map((claim) => normalizePath(claim.trim()).replace(/\/+$/, "")).filter(Boolean))];
}

function validateChildRunRequest(input: {
  entry: PlaybookCatalogEntry;
  executionMode: PlaybookRunExecutionMode;
  outputSurfaceClaims: string[];
  parent: PlaybookRunState | null;
}): void {
  const { executionMode, outputSurfaceClaims, parent } = input;
  if (!parent) {
    return;
  }
  if (parent.childPolicy === "none") {
    throw new OperationError(`Parent run \`${parent.runId}\` does not permit child playbooks.`);
  }
  if (executionMode === "parallel" && parent.childPolicy !== "parallel") {
    throw new OperationError(`Parent run \`${parent.runId}\` does not permit parallel child playbooks.`);
  }
  if (executionMode === "parallel") {
    const overlap = findOutputSurfaceOverlap(outputSurfaceClaims, [
      parent.outputSurfaceClaims,
      ...parent.childRuns.map((child) => child.outputSurfaceClaims),
    ].flat());
    if (overlap) {
      throw new OperationError(
        `Parallel child playbook output-surface claims overlap with an existing run: ${overlap[0]} and ${overlap[1]}.`,
      );
    }
  }
}

function findOutputSurfaceOverlap(
  proposedClaims: string[],
  existingClaims: string[],
): [string, string] | null {
  for (const proposed of proposedClaims) {
    for (const existing of existingClaims) {
      if (claimsOverlap(proposed, existing)) {
        return [proposed, existing];
      }
    }
  }
  return null;
}

function claimsOverlap(left: string, right: string): boolean {
  return left === right || left.startsWith(`${right}/`) || right.startsWith(`${left}/`);
}
