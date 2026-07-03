import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { PLAYBOOK_STEP_STATUSES, type PlaybookStepStatus } from "../../playbook";
import {
  readPlaybookRunRecord,
  upsertPlaybookRunRecord,
  withStoreDatabase,
} from "../../store";
import { findRepoRoot, utcNow } from "../shared";
import { OperationError, type JsonValue } from "../types";
import {
  readPlaybookRunState,
  requireRunProjectId,
  resolveRunStoreRoot,
  type PlaybookRunEvidenceRecord,
  type PlaybookRunState,
} from "./run-state";

/**
 * Run portability: explicit export and import of a Playbook run (W18 R7 P4;
 * PRD 35 R-PORT-1).
 *
 * Run state is machine-local in the global store, so cross-machine handoff is
 * served by two opt-in operations — `playbook.run.export` serializes the full
 * run record, including its evidence log, into one portable JSON artifact,
 * and `playbook.run.import` rehydrates that artifact into the target
 * machine's global store. Neither operation ever places run state into the
 * repository by default: export writes only to a caller-named output path (or
 * returns the artifact inline for the surface to present), and import writes
 * only to the global store.
 *
 * Artifact shape (D9-style implementer decision, recorded here): a single
 * JSON document with a `format` marker, a `formatVersion`, the export
 * timestamp, the source (project id, run id) key, and the untouched
 * {@link PlaybookRunState} record. The evidence log and evidence references
 * ride inside the record, so no side files exist.
 *
 * Identity on import (recorded implementer decision): the imported run is
 * keyed by the IMPORTING repository's own manifest-minted project identifier
 * (R-STORE-2). A clone of the same repository carries the same
 * `.make-docs/manifest.json`, so the normal cross-machine handoff resolves
 * the same project id and the artifact imports cleanly. When the artifact's
 * source project id differs, the run belongs to a different project identity
 * and import refuses by default; the explicit `adoptProject` opt-in re-keys
 * the record to the local identity and the appended `import` evidence record
 * names the source project so provenance survives the re-key.
 */

export const PLAYBOOK_RUN_EXPORT_FORMAT = "make-docs.playbook-run-export";
export const PLAYBOOK_RUN_EXPORT_FORMAT_VERSION = 1;

export interface PlaybookRunExportArtifact {
  format: typeof PLAYBOOK_RUN_EXPORT_FORMAT;
  formatVersion: typeof PLAYBOOK_RUN_EXPORT_FORMAT_VERSION;
  exportedAt: string;
  /** The exporting project's manifest-minted identifier (the source row key). */
  projectId: string;
  runId: string;
  /** The full run record, evidence log included, exactly as stored. */
  run: PlaybookRunState;
}

export interface ExportPlaybookRunInput {
  repoRoot?: string;
  storeRoot?: string;
  runId: string;
  /**
   * Caller-named destination for the artifact file. Optional and never
   * defaulted: without it the artifact is only returned inline, so no file —
   * and in particular no repository file — is ever written by default
   * (R-PORT-1).
   */
  outputPath?: string | null;
}

export interface ExportPlaybookRunResult {
  artifact: PlaybookRunExportArtifact;
  /** Absolute path written, or null when the artifact was only returned inline. */
  outputPath: string | null;
  wroteFile: boolean;
}

/**
 * `playbook.run.export` (write, R-PORT-1): serializes the run record and its
 * evidence into a portable artifact. Opt-in file output only — the artifact
 * is written solely to the explicit caller-named path; absent a path it is
 * returned as the operation value for the surface to present (stdout on the
 * CLI). Export never touches the repository and never mutates run state.
 */
export function exportPlaybookRun(input: ExportPlaybookRunInput): ExportPlaybookRunResult {
  const repoRoot = findRepoRoot(input.repoRoot);
  const state = readPlaybookRunState({
    repoRoot,
    storeRoot: input.storeRoot,
    runId: input.runId,
  });
  const artifact: PlaybookRunExportArtifact = {
    format: PLAYBOOK_RUN_EXPORT_FORMAT,
    formatVersion: PLAYBOOK_RUN_EXPORT_FORMAT_VERSION,
    exportedAt: utcNow(),
    projectId: state.projectId,
    runId: state.runId,
    run: state,
  };
  let outputPath: string | null = null;
  if (input.outputPath) {
    outputPath = path.resolve(input.outputPath);
    mkdirSync(path.dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
  }
  return { artifact, outputPath, wroteFile: outputPath !== null };
}

export interface ImportPlaybookRunInput {
  repoRoot?: string;
  storeRoot?: string;
  /** The parsed export artifact (the JSON document `playbook.run.export` produced). */
  artifact: unknown;
  /** Explicit opt-in to replace an existing run record with the same run id. */
  overwrite?: boolean;
  /**
   * Explicit opt-in to re-key an artifact exported from a DIFFERENT project
   * identity onto this repository's project id. Without it a project-id
   * mismatch refuses, because the run would attribute state across project
   * identities.
   */
  adoptProject?: boolean;
}

export interface ImportPlaybookRunResult {
  projectId: string;
  runId: string;
  sourceProjectId: string;
  adopted: boolean;
  overwrote: boolean;
  state: PlaybookRunState;
}

/**
 * `playbook.run.import` (write, R-PORT-1): rehydrates an exported run
 * artifact into this machine's global store, keyed by the importing
 * repository's manifest-minted project identifier. Import writes ONLY to the
 * global store — never to the repository — appends an `import` evidence
 * record naming the source project and export time, and refuses an existing
 * run id unless `overwrite` is explicitly granted.
 */
export function importPlaybookRun(input: ImportPlaybookRunInput): ImportPlaybookRunResult {
  const repoRoot = findRepoRoot(input.repoRoot);
  const projectId = requireRunProjectId(repoRoot);
  const artifact = parsePlaybookRunExportArtifact(input.artifact);
  const sourceProjectId = artifact.run.projectId;
  const adopted = sourceProjectId !== projectId;
  if (adopted && input.adoptProject !== true) {
    throw new OperationError(
      `Playbook run artifact was exported from project \`${sourceProjectId}\`, but this repository ` +
        `resolves to project \`${projectId}\`. A clone of the same repository shares its identity through ` +
        "`.make-docs/manifest.json`; if this import intentionally crosses project identities, opt in " +
        "explicitly with `adoptProject` to re-key the run.",
    );
  }
  const now = utcNow();
  const importRecord: PlaybookRunEvidenceRecord = {
    scope: "import",
    subjectId: artifact.run.runId,
    outcome: artifact.run.status,
    recordedAt: now,
    refs: [],
    note:
      `Imported from the portable run artifact exported at ${artifact.exportedAt} by project ` +
      `\`${sourceProjectId}\`${adopted ? ` and re-keyed to project \`${projectId}\` by explicit opt-in` : ""} (R-PORT-1).`,
  };
  const state: PlaybookRunState = {
    ...artifact.run,
    projectId,
    evidenceLog: [...(artifact.run.evidenceLog ?? []), importRecord],
    updatedAt: now,
  };

  const overwrote = withStoreDatabase(resolveRunStoreRoot(input.storeRoot), (db) => {
    const existing = readPlaybookRunRecord(db, projectId, state.runId);
    if (existing && input.overwrite !== true) {
      throw new OperationError(
        `A Playbook run record already exists for run id \`${state.runId}\` in this project; ` +
          "import refuses to replace it without the explicit `overwrite` opt-in.",
      );
    }
    upsertPlaybookRunRecord(db, {
      projectId,
      runId: state.runId,
      record: state as unknown as JsonValue,
      now,
    });
    return existing !== null;
  });

  return {
    projectId,
    runId: state.runId,
    sourceProjectId,
    adopted,
    overwrote,
    state,
  };
}

/** Fail-closed artifact validation: format marker, version, and record key fields. */
function parsePlaybookRunExportArtifact(value: unknown): PlaybookRunExportArtifact {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new OperationError(
      "Playbook run import requires the JSON artifact produced by `playbook.run.export`.",
    );
  }
  const artifact = value as Record<string, unknown>;
  if (artifact.format !== PLAYBOOK_RUN_EXPORT_FORMAT) {
    throw new OperationError(
      `Playbook run artifact format must be \`${PLAYBOOK_RUN_EXPORT_FORMAT}\`.`,
    );
  }
  if (artifact.formatVersion !== PLAYBOOK_RUN_EXPORT_FORMAT_VERSION) {
    throw new OperationError(
      `Playbook run artifact format version \`${String(artifact.formatVersion)}\` is not supported; ` +
        `this runner reads version ${PLAYBOOK_RUN_EXPORT_FORMAT_VERSION}.`,
    );
  }
  const run = artifact.run;
  if (!run || typeof run !== "object" || Array.isArray(run)) {
    throw new OperationError("Playbook run artifact is missing its `run` record.");
  }
  const record = run as Record<string, unknown>;
  if (record.schemaVersion !== 2) {
    throw new OperationError(
      `Playbook run artifact carries record schema version \`${String(record.schemaVersion)}\`; this runner reads version 2.`,
    );
  }
  if (typeof record.runId !== "string" || !record.runId) {
    throw new OperationError("Playbook run artifact record is missing its run identifier.");
  }
  if (typeof record.projectId !== "string" || !record.projectId) {
    throw new OperationError("Playbook run artifact record is missing its project identifier.");
  }
  if (!PLAYBOOK_STEP_STATUSES.includes(record.status as PlaybookStepStatus)) {
    throw new OperationError(
      `Playbook run artifact record status must be one of the shared step statuses: ${PLAYBOOK_STEP_STATUSES.join(", ")}.`,
    );
  }
  if (typeof artifact.exportedAt !== "string" || !artifact.exportedAt) {
    throw new OperationError("Playbook run artifact is missing its export timestamp.");
  }
  return {
    format: PLAYBOOK_RUN_EXPORT_FORMAT,
    formatVersion: PLAYBOOK_RUN_EXPORT_FORMAT_VERSION,
    exportedAt: artifact.exportedAt,
    projectId: record.projectId,
    runId: record.runId,
    run: run as unknown as PlaybookRunState,
  };
}
