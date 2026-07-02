import { existsSync, readdirSync, rmdirSync, rmSync } from "node:fs";
import path from "node:path";
import {
  StoreSchemaNewerError,
  StoreUnavailableError,
  readWorkItemEvidence,
  recordWorkEvidence,
  resolveProjectIdentity,
  resolveStoreRoot,
  withStoreDatabase,
  type StoreDatabase,
  type WorkItemIdentity,
} from "../../store";
import {
  loadJsonFile,
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
  type WaveResolution,
} from "../work";

const LOCKFILE_MANIFESTS: Record<string, string[]> = {
  "Cargo.lock": ["Cargo.toml"],
  "package-lock.json": ["package.json"],
  "pnpm-lock.yaml": ["package.json", "pnpm-workspace.yaml"],
  "yarn.lock": ["package.json"],
  "bun.lockb": ["package.json"],
};

/**
 * Work-execution evidence kinds recorded by the checkpoint operation
 * (W18 R10 P3, Stage 2). These are the genuine-state fields of the retired
 * per-repo checkpoint JSON per the keep/remove disposition in
 * `docs/assets/artifacts/migrated-operations-inventory.md`: recorded
 * decisions and sign-offs that cannot be re-derived from the repository or
 * git. Everything else the old checkpoint file carried (wave/phase
 * resolution scaffolding, phase completion status, timestamps) is
 * re-derivable and is deliberately NOT an evidence kind. The full field
 * mapping is recorded in `packages/cli/src/store/README.md`.
 */
export const WORK_EVIDENCE_KINDS = [
  "validation",
  "review",
  "closeout",
  "commit",
  "push",
  "notes",
  "commit-policy",
] as const;

export type WorkEvidenceKind = (typeof WORK_EVIDENCE_KINDS)[number];

/** The legacy checkpoint sub-records ported one-to-one as evidence kinds. */
const LEGACY_RECORD_KINDS = [
  "validation",
  "review",
  "closeout",
  "commit",
  "push",
] as const;

export const lifecycleDomain: OperationDomainDescriptor = {
  name: "lifecycle",
  summary: "Phase checkpoint, scope-guard, and phase-gate lifecycle operations.",
  commands: [
    {
      name: "checkpoint",
      summary:
        "Record phase validation, review, closeout, and commit evidence in the global store.",
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

/**
 * Records lifecycle evidence for a phase in the global store (R-BND-2,
 * R-PS-3). This operation consumes the canonical work-item identity produced
 * by the retained work-item identity resolver (`resolveWaveTarget`) — repo
 * root, wave slug, repo-relative phase path — and records evidence against
 * it; the store never re-derives the identity.
 *
 * Work-lifecycle state is no longer written under `.make-docs/runs/` or any
 * other repository path. When a legacy `.make-docs/runs/<wave-slug>/state.json`
 * exists, its genuine-state fields are migrated into evidence rows first and
 * the file is then removed (see {@link migrateLegacyCheckpointFile}).
 */
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
  /** Explicit store root override (tests/sandboxes); defaults to the resolved global store. */
  storeRoot?: string;
}): Record<string, JsonValue> {
  const resolution = resolveWaveTarget(options.target);
  const repoRoot = resolution.repoRoot;
  const activePhasePath = options.phase ?? resolution.phasePath;
  if (!activePhasePath) {
    throw new OperationError("No phase path resolved for checkpoint.");
  }
  const phaseRelative = repoRelativePath(activePhasePath, repoRoot);
  if (!phaseRelative) {
    throw new OperationError("Could not resolve a repo-relative phase path for checkpoint.");
  }
  const projectId = requireProjectIdentity(repoRoot);
  const identity: WorkItemIdentity = {
    repoRoot,
    waveSlug: resolution.waveSlug,
    phasePath: phaseRelative,
  };

  const droppedFields: string[] = [];
  if (options.status) {
    droppedFields.push(
      "status (re-derivable from the phase document's task checkboxes; not recorded as evidence)",
    );
  }
  if (options.mode) {
    droppedFields.push("mode (resolution metadata, re-derivable; not recorded as evidence)");
  }

  return withCheckpointStore(options.storeRoot, (db) => {
    const legacyMigration = migrateLegacyCheckpointFile(db, resolution, projectId);

    const existingByKind = evidenceByKind(db, projectId, identity);
    const mergePatch = (kind: WorkEvidenceKind, patch: Record<string, JsonValue>) => {
      const payload = { ...valueAsRecord(existingByKind[kind]), ...patch };
      recordWorkEvidence(db, { projectId, identity, evidenceKind: kind, payload });
    };

    if (
      options.validationStatus ||
      (options.validationCommands && options.validationCommands.length > 0)
    ) {
      const patch: Record<string, JsonValue> = {};
      if (options.validationStatus) {
        patch.status = options.validationStatus;
      }
      if (options.validationCommands && options.validationCommands.length > 0) {
        patch.commands = options.validationCommands;
      }
      mergePatch("validation", patch);
    }
    if (options.reviewStatus || options.reviewRequired !== undefined) {
      const patch: Record<string, JsonValue> = {};
      if (options.reviewStatus) {
        patch.status = options.reviewStatus;
      }
      if (options.reviewRequired !== undefined) {
        patch.required = options.reviewRequired;
      }
      mergePatch("review", patch);
    }
    if (options.closeoutStatus) {
      mergePatch("closeout", { status: options.closeoutStatus });
    }
    if (options.commitStatus || options.commitSha) {
      const patch: Record<string, JsonValue> = {};
      if (options.commitStatus) {
        patch.status = options.commitStatus;
      }
      if (options.commitSha) {
        patch.sha = options.commitSha;
      }
      mergePatch("commit", patch);
    }
    if (options.pushStatus) {
      mergePatch("push", { status: options.pushStatus });
    }
    if (options.commitPolicy) {
      mergePatch("commit-policy", { policy: options.commitPolicy });
    }
    if (options.note) {
      const notes = Array.isArray(existingByKind.notes)
        ? [...(existingByKind.notes as JsonValue[])]
        : [];
      notes.push({ at: utcNow(), text: options.note });
      recordWorkEvidence(db, { projectId, identity, evidenceKind: "notes", payload: notes });
    }

    return {
      projectId,
      waveSlug: resolution.waveSlug,
      phasePath: phaseRelative,
      evidenceSource: "global-store",
      evidence: evidenceByKind(db, projectId, identity) as unknown as JsonValue,
      droppedFields,
      legacyMigration: legacyMigration as unknown as JsonValue,
    };
  });
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

/**
 * Read-only gate over recorded evidence. Evidence is read from the global
 * store; a still-unmigrated legacy checkpoint file is consulted read-only for
 * evidence kinds the store does not hold yet, and is never written. Store or
 * identity trouble degrades to "no recorded evidence" plus a warning — a
 * missing store never blocks reading the repository (R-DB-4).
 */
export function buildPhaseGateReport(
  target: string,
  commitPolicy?: string,
  options: { storeRoot?: string } = {},
): Record<string, JsonValue> {
  const resolution = resolveWaveTarget(target);
  if (!resolution.phasePath) {
    throw new OperationError("No phase path resolved for phase gate.");
  }
  const phase = parseWorkPhase(resolution.phasePath);
  const view = readPhaseEvidenceView(resolution, resolution.phasePath, options.storeRoot);
  const policyEvidence = valueAsRecord(view.evidence["commit-policy"]);
  const policy =
    commitPolicy ??
    (typeof policyEvidence.policy === "string" ? policyEvidence.policy : "commit-required");
  const blockers: string[] = [];

  if (phase.uncheckedTasks.length > 0) {
    blockers.push(`${phase.uncheckedTasks.length} unchecked task(s) remain in the phase doc`);
  }
  const validation = valueAsRecord(view.evidence.validation);
  if (validation.status !== "passed") {
    blockers.push("validation has not been recorded as passed");
  }
  const files = changedFilesForWork(resolution.repoRoot);
  const review = valueAsRecord(view.evidence.review);
  const reviewRequired = Boolean(review.required) || hasCodeChanges(files);
  if (reviewRequired && review.status !== "passed" && review.status !== "waived") {
    blockers.push("code review is required and has not passed or been waived");
  }
  const closeout = valueAsRecord(view.evidence.closeout);
  if (closeout.status !== "passed") {
    blockers.push("closeout-phase has not been recorded as passed");
  }
  const commit = valueAsRecord(view.evidence.commit);
  if (policy === "commit-required" && !(commit.status === "passed" && typeof commit.sha === "string" && commit.sha.length > 0)) {
    blockers.push("phase commit is required but no committed SHA is recorded");
  }
  if (policy === "commit-and-push") {
    if (!(commit.status === "passed" && typeof commit.sha === "string" && commit.sha.length > 0)) {
      blockers.push("phase commit is required but no committed SHA is recorded");
    }
    const push = valueAsRecord(view.evidence.push);
    if (push.status !== "passed") {
      blockers.push("phase push is required but is not recorded as passed");
    }
  }

  return {
    phasePath: resolution.phasePath,
    commitPolicy: policy,
    status: blockers.length === 0 ? "passed" : "blocked",
    blockers,
    evidenceSource: "global-store",
    evidence: view.evidence as unknown as JsonValue,
    projectIdentity: view.projectIdentity as unknown as JsonValue,
    legacyCheckpoint: view.legacyCheckpoint as unknown as JsonValue,
    warnings: view.warnings,
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

export interface LegacyCheckpointMigration {
  /** Repo-relative path of the legacy checkpoint file. */
  legacyPath: string;
  /** True when a legacy file existed and was migrated. */
  migrated: boolean;
  /** Repo-relative phase paths whose evidence was ported. */
  migratedPhases: string[];
  /** True when the legacy file (and any emptied runs directories) was removed. */
  removed: boolean;
}

/**
 * One-way migration of a legacy `.make-docs/runs/<wave-slug>/state.json`
 * checkpoint file into work-execution evidence rows (R-PS-2).
 *
 * Field disposition (per `migrated-operations-inventory.md`; full mapping in
 * the store README):
 * - Ported (genuine state): the per-phase `validation`, `review`, `closeout`,
 *   `commit`, and `push` records, per-phase `notes`, and the wave-level
 *   `commitPolicy` (recorded per phase as `commit-policy`).
 * - Dropped (re-derivable): `schemaVersion`, `createdAt`/`updatedAt`,
 *   `waveSlug`, `waveDir`, `target`, `coordinate`, `mode`, `nextPhasePath`,
 *   `activePhasePath`, per-phase `phasePath` (it becomes the row key), and
 *   per-phase `status` (re-derivable from the phase document's checkboxes).
 *
 * Evidence already present in the store is never overwritten by legacy data —
 * once relocated, the store is canonical. After a successful migration the
 * legacy file is removed (and emptied `runs/` directories pruned), because
 * relocated-canonical state must have no in-repo copy (R-MIR-2). This
 * migration runs only inside the mutating checkpoint operation; read-only
 * operations consult a not-yet-migrated file read-only and never delete it.
 */
export function migrateLegacyCheckpointFile(
  db: StoreDatabase,
  resolution: WaveResolution,
  projectId: string,
): LegacyCheckpointMigration {
  const legacyAbsolute = statePathFor(resolution);
  const legacyPath = repoRelativePath(legacyAbsolute, resolution.repoRoot) ?? legacyAbsolute;
  if (!existsSync(legacyAbsolute)) {
    return { legacyPath, migrated: false, migratedPhases: [], removed: false };
  }

  let state: Record<string, JsonValue>;
  try {
    state = valueAsRecord(loadJsonFile(legacyAbsolute));
  } catch (error) {
    throw new OperationError(
      `Legacy checkpoint file ${legacyPath} is not valid JSON and cannot be migrated ` +
        `(${error instanceof Error ? error.message : String(error)}). Fix or remove it, then retry.`,
    );
  }

  const waveDirRelative =
    typeof state.waveDir === "string" && state.waveDir.length > 0
      ? state.waveDir
      : `docs/work/${resolution.waveSlug}`;
  const wavePolicy = typeof state.commitPolicy === "string" ? state.commitPolicy : null;
  const phases = valueAsRecord(state.phases);
  const migratedPhases: string[] = [];

  for (const [key, rawEntry] of Object.entries(phases)) {
    const entry = valueAsRecord(rawEntry);
    const phasePath =
      typeof entry.phasePath === "string" && entry.phasePath.length > 0
        ? entry.phasePath
        : key === "wave"
          ? waveDirRelative
          : `${waveDirRelative.replace(/\/+$/g, "")}/${key}`;
    const identity: WorkItemIdentity = {
      repoRoot: resolution.repoRoot,
      waveSlug: resolution.waveSlug,
      phasePath,
    };
    const existing = evidenceByKind(db, projectId, identity);
    let ported = false;

    for (const kind of LEGACY_RECORD_KINDS) {
      if (existing[kind] !== undefined) {
        continue;
      }
      const record = valueAsRecord(entry[kind]);
      if (Object.keys(record).length === 0) {
        continue;
      }
      recordWorkEvidence(db, { projectId, identity, evidenceKind: kind, payload: record });
      ported = true;
    }
    if (existing.notes === undefined && Array.isArray(entry.notes) && entry.notes.length > 0) {
      recordWorkEvidence(db, { projectId, identity, evidenceKind: "notes", payload: entry.notes });
      ported = true;
    }
    if (existing["commit-policy"] === undefined && wavePolicy) {
      recordWorkEvidence(db, {
        projectId,
        identity,
        evidenceKind: "commit-policy",
        payload: { policy: wavePolicy },
      });
      ported = true;
    }
    if (ported) {
      migratedPhases.push(phasePath);
    }
  }

  rmSync(legacyAbsolute, { force: true });
  pruneEmptyDirectory(path.dirname(legacyAbsolute));
  pruneEmptyDirectory(path.dirname(path.dirname(legacyAbsolute)));

  return { legacyPath, migrated: true, migratedPhases, removed: true };
}

interface PhaseEvidenceView {
  evidence: Record<string, JsonValue>;
  projectIdentity: { status: string; projectId: string | null };
  legacyCheckpoint: { path: string; present: boolean };
  warnings: string[];
}

/**
 * Read-only evidence view for a phase: global-store rows first, then a
 * not-yet-migrated legacy checkpoint file for kinds the store lacks. Never
 * writes the store, the legacy file, or any repository path.
 */
function readPhaseEvidenceView(
  resolution: WaveResolution,
  phasePath: string,
  storeRoot?: string,
): PhaseEvidenceView {
  const repoRoot = resolution.repoRoot;
  const phaseRelative = repoRelativePath(phasePath, repoRoot) ?? phasePath;
  const warnings: string[] = [];
  const evidence: Record<string, JsonValue> = {};
  const identityResolution = resolveProjectIdentity(repoRoot);
  const projectIdentity = {
    status: identityResolution.status,
    projectId: identityResolution.status === "resolved" ? identityResolution.projectId : null,
  };

  if (identityResolution.status === "resolved") {
    try {
      const rows = withStoreDatabase(
        resolveStoreRoot(storeRoot ? { storeRoot } : {}),
        (db) =>
          readWorkItemEvidence(db, {
            projectId: identityResolution.projectId,
            identity: { waveSlug: resolution.waveSlug, phasePath: phaseRelative },
          }),
      );
      for (const row of rows) {
        evidence[row.evidenceKind] = row.payload;
      }
    } catch (error) {
      warnings.push(
        `Recorded evidence could not be read from the global store (${error instanceof Error ? error.message : String(error)}); ` +
          "treating the phase as having no recorded evidence.",
      );
    }
  } else {
    warnings.push(
      `Recorded evidence unavailable: ${describeIdentityGap(identityResolution.status)}`,
    );
  }

  const legacyAbsolute = statePathFor(resolution);
  const legacyPresent = existsSync(legacyAbsolute);
  if (legacyPresent) {
    try {
      const state = valueAsRecord(loadJsonFile(legacyAbsolute));
      const entry = valueAsRecord(valueAsRecord(state.phases)[phaseKey(phasePath)]);
      for (const kind of LEGACY_RECORD_KINDS) {
        if (evidence[kind] !== undefined) {
          continue;
        }
        const record = valueAsRecord(entry[kind]);
        if (Object.keys(record).length > 0) {
          evidence[kind] = record;
        }
      }
      if (evidence.notes === undefined && Array.isArray(entry.notes) && entry.notes.length > 0) {
        evidence.notes = entry.notes;
      }
      if (evidence["commit-policy"] === undefined && typeof state.commitPolicy === "string") {
        evidence["commit-policy"] = { policy: state.commitPolicy };
      }
      warnings.push(
        "A legacy checkpoint file is present and was consulted read-only; the next checkpoint migrates it to the global store and removes it.",
      );
    } catch {
      warnings.push(
        "A legacy checkpoint file is present but unreadable; it was ignored.",
      );
    }
  }

  return {
    evidence,
    projectIdentity,
    legacyCheckpoint: {
      path: repoRelativePath(legacyAbsolute, repoRoot) ?? legacyAbsolute,
      present: legacyPresent,
    },
    warnings,
  };
}

function evidenceByKind(
  db: StoreDatabase,
  projectId: string,
  identity: WorkItemIdentity,
): Record<string, JsonValue> {
  const byKind: Record<string, JsonValue> = {};
  const rows = readWorkItemEvidence(db, {
    projectId,
    identity: { waveSlug: identity.waveSlug, phasePath: identity.phasePath },
  });
  for (const row of rows) {
    byKind[row.evidenceKind] = row.payload;
  }
  return byKind;
}

function requireProjectIdentity(repoRoot: string): string {
  const resolution = resolveProjectIdentity(repoRoot);
  if (resolution.status === "resolved") {
    return resolution.projectId;
  }
  throw new OperationError(
    `Cannot record lifecycle evidence: ${describeIdentityGap(resolution.status)} ` +
      "Evidence is keyed by the manifest-minted project identifier and stored in the global store, never under a repository path.",
  );
}

function describeIdentityGap(status: string): string {
  switch (status) {
    case "unminted":
      return "this project's manifest predates the stable project identifier; run `make-docs` once to mint it.";
    case "no-manifest":
      return "this repository has no .make-docs/manifest.json; run `make-docs` to set up Make Docs first.";
    default:
      return "this project's .make-docs/manifest.json is unreadable; repair it and rerun `make-docs`.";
  }
}

function withCheckpointStore<T>(
  storeRoot: string | undefined,
  fn: (db: StoreDatabase) => T,
): T {
  try {
    return withStoreDatabase(resolveStoreRoot(storeRoot ? { storeRoot } : {}), fn);
  } catch (error) {
    if (error instanceof OperationError) {
      throw error;
    }
    if (error instanceof StoreUnavailableError || error instanceof StoreSchemaNewerError) {
      throw new OperationError(error.message);
    }
    throw new OperationError(
      `Could not record lifecycle evidence in the global store: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

function pruneEmptyDirectory(directory: string): void {
  try {
    if (existsSync(directory) && readdirSync(directory).length === 0) {
      rmdirSync(directory);
    }
  } catch {
    // Pruning is best-effort tidiness; a surviving empty directory is harmless.
  }
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
    return "legacy work-on-wave checkpoint state (migrated to the global store)";
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
