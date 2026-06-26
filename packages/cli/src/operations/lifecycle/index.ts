import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  ensureArray,
  ensureRecord,
  loadJsonFile,
  localizeStatePaths,
  normalizePath,
  repoRelativePath,
  runGit,
  utcNow,
  valueAsRecord,
} from "../shared";
import { OperationError, type JsonValue } from "../types";
import type {
  OperationDomainDescriptor,
  OperationResult,
} from "../types";
import {
  parseWorkPhase,
  resolveWaveTarget,
  statePathFor,
} from "../work";

const LOCKFILE_MANIFESTS: Record<string, string[]> = {
  "Cargo.lock": ["Cargo.toml"],
  "package-lock.json": ["package.json"],
  "pnpm-lock.yaml": ["package.json", "pnpm-workspace.yaml"],
  "yarn.lock": ["package.json"],
  "bun.lockb": ["package.json"],
};

export const lifecycleDomain: OperationDomainDescriptor = {
  name: "lifecycle",
  summary: "Phase checkpoint, scope-guard, and phase-gate lifecycle operations.",
  commands: [
    {
      name: "checkpoint",
      summary: "Persist phase progress, validation, review, closeout, and commit evidence.",
      mutates: true,
      renderModes: ["json"],
    },
    {
      name: "scope-guard",
      summary: "Compare changed files against declared phase scope and allowed derived files.",
      mutates: false,
      renderModes: ["json"],
    },
    {
      name: "phase-gate",
      summary: "Check whether a phase has task, validation, review, closeout, and commit evidence.",
      mutates: false,
      renderModes: ["json"],
    },
  ],
};

export function buildCheckpoint(options: {
  target: string;
  phase?: string;
  mode?: "wave" | "phase";
  commitPolicy?: string;
  status?: string;
  validationStatus?: string;
  validationCommands?: string[];
  reviewStatus?: string;
  reviewRequired?: boolean;
  closeoutStatus?: string;
  commitStatus?: string;
  commitSha?: string;
  pushStatus?: string;
  note?: string;
}): Record<string, JsonValue> {
  const resolution = resolveWaveTarget(options.target);
  const statePath = statePathFor(resolution);
  const repoRoot = resolution.repoRoot;
  const existing = loadJsonFile(statePath);
  const state = localizeStatePaths(
    (existing as Record<string, JsonValue> | null) ?? {
      schemaVersion: 1,
      phases: {},
      createdAt: utcNow(),
    },
    repoRoot,
  ) as Record<string, JsonValue>;

  state.updatedAt = utcNow();
  state.waveSlug = resolution.waveSlug;
  state.waveDir = repoRelativePath(resolution.waveDir, repoRoot);
  state.target = repoRelativePath(resolution.target, repoRoot);
  state.coordinate = resolution.coordinate as unknown as JsonValue;
  state.mode = options.mode ?? resolution.mode;
  state.commitPolicy = options.commitPolicy ?? String(state.commitPolicy ?? "commit-required");
  state.nextPhasePath = repoRelativePath(resolution.phasePath, repoRoot);
  const activePhasePath = options.phase ?? resolution.phasePath;
  state.activePhasePath = repoRelativePath(activePhasePath, repoRoot);

  const phases = ensureRecord(state, "phases");
  const key = phaseKey(activePhasePath);
  const phaseState = ensureRecord(phases, key);
  phaseState.phasePath = repoRelativePath(activePhasePath, repoRoot);
  if (options.status) {
    phaseState.status = options.status;
  }
  if (options.note) {
    const notes = ensureArray(phaseState, "notes");
    notes.push({ at: utcNow(), text: options.note });
  }
  if (options.validationStatus || (options.validationCommands && options.validationCommands.length > 0)) {
    const validation = ensureRecord(phaseState, "validation");
    if (options.validationStatus) {
      validation.status = options.validationStatus;
    }
    if (options.validationCommands && options.validationCommands.length > 0) {
      validation.commands = options.validationCommands;
    }
  }
  if (options.reviewStatus || options.reviewRequired !== undefined) {
    const review = ensureRecord(phaseState, "review");
    if (options.reviewStatus) {
      review.status = options.reviewStatus;
    }
    if (options.reviewRequired !== undefined) {
      review.required = options.reviewRequired;
    }
  }
  if (options.closeoutStatus) {
    ensureRecord(phaseState, "closeout").status = options.closeoutStatus;
  }
  if (options.commitStatus || options.commitSha) {
    const commit = ensureRecord(phaseState, "commit");
    if (options.commitStatus) {
      commit.status = options.commitStatus;
    }
    if (options.commitSha) {
      commit.sha = options.commitSha;
    }
  }
  if (options.pushStatus) {
    ensureRecord(phaseState, "push").status = options.pushStatus;
  }

  const localized = localizeStatePaths(state, repoRoot);
  mkdirSync(path.dirname(statePath), { recursive: true });
  writeFileSync(statePath, `${JSON.stringify(localized, null, 2)}\n`, "utf8");
  return { statePath, state: localized };
}

export function buildScopeReport(target: string, explicitChanged?: string[]): Record<string, JsonValue> {
  const resolution = resolveWaveTarget(target);
  if (!resolution.phasePath) {
    throw new OperationError("No phase path resolved for scope guard.");
  }
  const repoRoot = resolution.repoRoot;
  const phase = parseWorkPhase(resolution.phasePath);
  const phaseRelative = normalizePath(path.relative(repoRoot, resolution.phasePath));
  const allowed = phase.declaredPaths;
  const files = explicitChanged && explicitChanged.length > 0 ? explicitChanged : changedFilesForWork(repoRoot);
  const outOfScope: string[] = [];
  const allowedDerived: Array<{ path: string; reason: string }> = [];

  for (const file of files) {
    if (isAllowedScopePath(file, allowed, resolution.waveSlug, phaseRelative)) {
      continue;
    }
    const reason = managedStateReason(file, resolution.waveSlug) ?? derivedReason(file, files);
    if (reason) {
      allowedDerived.push({ path: file, reason });
      continue;
    }
    outOfScope.push(file);
  }

  return {
    phasePath: resolution.phasePath,
    declaredPaths: allowed,
    changedFiles: files,
    allowedDerived: allowedDerived as unknown as JsonValue,
    outOfScope,
    status: outOfScope.length === 0 ? "passed" : "warning",
  };
}

export function buildPhaseGateReport(
  target: string,
  commitPolicy?: string,
): Record<string, JsonValue> {
  const resolution = resolveWaveTarget(target);
  if (!resolution.phasePath) {
    throw new OperationError("No phase path resolved for phase gate.");
  }
  const phase = parseWorkPhase(resolution.phasePath);
  const state = (loadJsonFile(statePathFor(resolution)) as Record<string, JsonValue> | null) ?? {};
  const phases = valueAsRecord(state.phases);
  const phaseState = valueAsRecord(phases[phaseKey(resolution.phasePath)]);
  const policy = commitPolicy ?? String(state.commitPolicy ?? "commit-required");
  const blockers: string[] = [];

  if (phase.uncheckedTasks.length > 0) {
    blockers.push(`${phase.uncheckedTasks.length} unchecked task(s) remain in the phase doc`);
  }
  const validation = valueAsRecord(phaseState.validation);
  if (validation.status !== "passed") {
    blockers.push("validation has not been recorded as passed");
  }
  const files = changedFilesForWork(resolution.repoRoot);
  const review = valueAsRecord(phaseState.review);
  const reviewRequired = Boolean(review.required) || hasCodeChanges(files);
  if (reviewRequired && review.status !== "passed" && review.status !== "waived") {
    blockers.push("code review is required and has not passed or been waived");
  }
  const closeout = valueAsRecord(phaseState.closeout);
  if (closeout.status !== "passed") {
    blockers.push("closeout-phase has not been recorded as passed");
  }
  const commit = valueAsRecord(phaseState.commit);
  if (policy === "commit-required" && !(commit.status === "passed" && typeof commit.sha === "string" && commit.sha.length > 0)) {
    blockers.push("phase commit is required but no committed SHA is recorded");
  }
  if (policy === "commit-and-push") {
    if (!(commit.status === "passed" && typeof commit.sha === "string" && commit.sha.length > 0)) {
      blockers.push("phase commit is required but no committed SHA is recorded");
    }
    const push = valueAsRecord(phaseState.push);
    if (push.status !== "passed") {
      blockers.push("phase push is required but is not recorded as passed");
    }
  }

  return {
    phasePath: resolution.phasePath,
    commitPolicy: policy,
    status: blockers.length === 0 ? "passed" : "blocked",
    blockers,
    state: phaseState,
  };
}

export function checkpointPhase(input: Parameters<typeof buildCheckpoint>[0]): OperationResult<Record<string, JsonValue>> {
  return {
    value: buildCheckpoint(input),
    provenance: {
      domain: "lifecycle",
      operation: "checkpoint",
      source: "shared",
      target: input.target,
    },
  };
}

export function guardPhaseScope(input: {
  target: string;
  changed?: string[];
}): OperationResult<Record<string, JsonValue>> {
  return {
    value: buildScopeReport(input.target, input.changed),
    provenance: {
      domain: "lifecycle",
      operation: "scope-guard",
      source: "shared",
      target: input.target,
    },
  };
}

export function gatePhase(input: {
  target: string;
  commitPolicy?: string;
}): OperationResult<Record<string, JsonValue>> {
  return {
    value: buildPhaseGateReport(input.target, input.commitPolicy),
    provenance: {
      domain: "lifecycle",
      operation: "phase-gate",
      source: "shared",
      target: input.target,
    },
  };
}

function phaseKey(value: string | null | undefined): string {
  if (!value) {
    return "wave";
  }
  return path.basename(value);
}

function isAllowedScopePath(
  filePath: string,
  allowed: string[],
  waveSlug: string,
  phasePath: string,
): boolean {
  const normalized = filePath.replace(/^\/+|\/+$/g, "");
  if (normalized === phasePath || normalized.startsWith(`docs/work/${waveSlug}/`)) {
    return true;
  }
  if (normalized.startsWith("docs/assets/archive/history/") || normalized.startsWith("docs/assets/library/")) {
    return true;
  }
  for (const item of allowed) {
    let clean = item.replace(/^\/+|\/+$/g, "");
    if (clean.startsWith("./")) {
      clean = clean.slice(2);
    }
    if (!clean) {
      continue;
    }
    if (normalized === clean || normalized.startsWith(`${clean.replace(/\/+$/g, "")}/`)) {
      return true;
    }
  }
  return false;
}

function changedFilesForWork(repoRoot: string): string[] {
  const output = runGit(repoRoot, ["status", "--porcelain"]);
  return [...new Set(output.split(/\r?\n/).filter(Boolean).map((line) => {
    const raw = line.slice(3);
    return raw.includes(" -> ") ? raw.split(" -> ", 2)[1]! : raw;
  }))].sort();
}

function derivedReason(filePath: string, files: string[]): string | null {
  const manifests = LOCKFILE_MANIFESTS[path.basename(filePath)];
  if (!manifests) {
    return null;
  }
  const normalizedFiles = new Set(files.map((file) => file.replace(/^\/+|\/+$/g, "")));
  const parent = normalizePath(path.dirname(filePath));
  for (const manifest of manifests) {
    const candidate = parent === "." ? manifest : `${parent}/${manifest}`;
    if (normalizedFiles.has(candidate)) {
      return `${path.basename(filePath)} is derived from changed dependency manifest ${candidate}`;
    }
  }
  return null;
}

function managedStateReason(filePath: string, waveSlug: string): string | null {
  const normalized = filePath.replace(/^\/+|\/+$/g, "");
  const expectedPrefix = `.make-docs/runs/${waveSlug}/`;
  if (normalized.startsWith(expectedPrefix) && normalized.endsWith("/state.json")) {
    return "managed work-on-wave checkpoint state";
  }
  return null;
}

function hasCodeChanges(files: string[]): boolean {
  const codeSuffixes = new Set([
    ".ts",
    ".tsx",
    ".js",
    ".mjs",
    ".cjs",
    ".py",
    ".rs",
    ".go",
    ".java",
    ".rb",
    ".sh",
    ".swift",
    ".kt",
    ".cs",
    ".php",
  ]);
  return files.some((file) => codeSuffixes.has(path.extname(file)));
}
