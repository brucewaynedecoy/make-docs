import { createHash } from "node:crypto";
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";

import { parseDocument } from "yaml";

import { platform } from "../../../platform.js";
import type { StoreDatabase } from "../../../store/database.js";
import { canonicalInstallationPath, getExistingInstallationCheckoutId } from "../../../store/installation-state.js";
import { resolveStoreRoot } from "../../../store/paths.js";
import {
  WorkStoreRefusalError,
  deleteSyncConflict,
  deleteSyncLedgerEntry,
  deleteWorkUnit,
  listSyncConflicts,
  listSyncLedger,
  listWorkUnits,
  markWorkSyncCheckout,
  newWorkUnitStoreId,
  putSyncConflict,
  putSyncLedgerEntry,
  putWorkUnit,
  readWorkStore,
  readWorkSyncCheckout,
  readWorkUnit,
  writeWorkStore,
  type WorkSyncConflictRow,
  type WorkSyncLedgerRow,
  type WorkUnitInput,
} from "../../../store/work-store.js";
import { OperationError } from "../../types.js";
import { WORK_SYNC_TABLE, type WorkSyncTableRow } from "./catalog.js";
import {
  buildWorkConflictReport,
  formatWorkConflictReport,
  type WorkConflictReport,
  type WorkConflictUnitDifference,
} from "./conflict-report.js";
import { readDependencyBullet } from "./dependency-bullets.js";
import {
  WorkConfigBlockSchema,
  type WorkConflictKind,
  type WorkDependency,
  type WorkGate,
  type WorkSyncDecision,
  type WorkSyncFileState,
  type WorkSyncStoreState,
  type WorkUnitRecord,
  type WorkUnresolvedDependency,
} from "./schemas.js";
import {
  WORK_FILE_ROOTS,
  classifyWorkFilePath,
  parseWorkFile,
  recordedStatusOf,
  renderWorkFile,
  type ParsedWorkUnit,
  type WorkFileDiagnostic,
  type WorkFileDocument,
  type WorkFileParseFailure,
  type WorkFilePathInfo,
  type WorkFileUnitState,
} from "./work-file.js";

/**
 * W29 R0 P3 first import and two-way sync (PRD 52 R-WORK-SYNC-1 to
 * R-WORK-SYNC-13, R-WORK-STORE-7 to R-WORK-STORE-11).
 *
 * Sync compares, for each work file, the file bytes, this checkout's last
 * applied digest, and the store revision of the file's units, and then
 * applies the one decision that the P1 sync table gives. It runs in one Store
 * write session. A conflict or an unreadable file stops only its own file;
 * every other file continues.
 *
 * File writes and removals happen inside that session, one file at a time,
 * and each one comes before its own Store change: the frame update and the
 * ledger entry. A write or removal that the file system refuses (such as a
 * read-only folder) is caught and reported in `fileErrors`; that file's
 * Store records and ledger entry stay as they were, and every other file
 * continues. If the session itself fails after some files were written, its
 * Store changes roll back, and the next sync finds each written file equal to
 * what the store renders, so it records the file with no conflict
 * (R-WORK-SYNC-14).
 *
 * How the store holds a file: the file unit (the revision of an index file, or
 * the phase of a phase file) keeps the file's text as its body, the frame. The
 * stages and tasks keep their own fields. The writer renders the frame with
 * the store's fields, so a file that the store did not change keeps its exact
 * bytes (R-WORK-SYNC-7), and every write leaves the frame equal to the bytes
 * it wrote.
 *
 * The store revision of a file is the sum of the record revisions of its
 * units. Each write raises one revision by one, so the sum changes with every
 * store change, and a change to the set of units shows in the ledger's unit
 * list.
 *
 * This module adds no public operation. The `work` operations of P4 call it.
 */

export const WORK_SYNC_CHECKOUT_NOT_BOUND_NEXT_ACTION = "Run make-docs setup in this checkout, then run the work command again.";

/* ------------------------------------------------------------------------ */
/* Config                                                                   */
/* ------------------------------------------------------------------------ */

export type WorkProjection = "on" | "off";

export class WorkProjectionConfigError extends OperationError {
  readonly code = "work-config-invalid";
  constructor(readonly reason: string) {
    super(`${reason} Make Docs did not sync, and no file or Store record changed. Correct the work block in .make-docs/config.yaml.`);
    this.name = "WorkProjectionConfigError";
  }
}

/**
 * Read `work.projection` from `.make-docs/config.yaml` (PRD 24 R-CONFIG-WORK-1,
 * PRD 52 R-WORK-STORE-7). No config, no `work` block, or no `projection` means
 * `on`. A malformed block stops sync, so a typo never turns copies off.
 */
export function readWorkProjection(projectRoot: string): WorkProjection {
  const file = path.join(projectRoot, ".make-docs", "config.yaml");
  if (!existsSync(file)) return "on";
  const document = parseDocument(readFileSync(file, "utf8"), { uniqueKeys: true });
  if (document.errors.length > 0) throw new WorkProjectionConfigError("The project config is not valid YAML.");
  const config = document.toJS() as Record<string, unknown> | null;
  const work = config && typeof config === "object" ? config.work : undefined;
  if (work === undefined || work === null) return "on";
  const parsed = WorkConfigBlockSchema.safeParse(work);
  if (!parsed.success) throw new WorkProjectionConfigError(`The work block does not match its contract: ${parsed.error.issues.map((issue) => `${issue.path.join(".") || "work"}: ${issue.message}`).join("; ")}.`);
  return parsed.data.projection;
}

/* ------------------------------------------------------------------------ */
/* States and decisions                                                     */
/* ------------------------------------------------------------------------ */

export function sha256Hex(bytes: Uint8Array | string): string {
  return createHash("sha256").update(bytes).digest("hex");
}

/**
 * The file state of one work file (P1 sync table). `new` and `absent` have no
 * ledger entry, and `unchanged`, `changed`, and `missing` have one.
 */
export function workSyncFileState(input: { exists: boolean; readable: boolean; digest: string | null; ledgerDigest: string | null }): WorkSyncFileState {
  if (!input.exists) return input.ledgerDigest === null ? "absent" : "missing";
  if (!input.readable) return "unreadable";
  if (input.ledgerDigest === null) return "new";
  return input.digest === input.ledgerDigest ? "unchanged" : "changed";
}

/**
 * The store state of one work file. `new` has no ledger entry, `unchanged`
 * and `changed` compare the units and their revision sum with the entry, and
 * `removed` means a person accepted the file's deletion in any checkout.
 */
export function workSyncStoreState(input: {
  units: ReadonlyArray<Pick<WorkUnitRecord, "storeId" | "revision" | "copyState">>;
  ledger: { unitStoreIds: readonly string[]; storeRevision: number } | null;
}): WorkSyncStoreState {
  if (input.units.length === 0) return "none";
  if (input.units.every((unit) => unit.copyState === "removed")) return "removed";
  if (!input.ledger) return "new";
  const ids = new Set(input.units.map((unit) => unit.storeId));
  const sameSet = ids.size === input.ledger.unitStoreIds.length && input.ledger.unitStoreIds.every((id) => ids.has(id));
  return sameSet && fileStoreRevision(input.units) === input.ledger.storeRevision ? "unchanged" : "changed";
}

/** The store revision of a file: the sum of its units' record revisions. */
export function fileStoreRevision(units: ReadonlyArray<Pick<WorkUnitRecord, "revision">>): number {
  return units.reduce((sum, unit) => sum + unit.revision, 0);
}

/** The sync table row for one file state, store state, and copy setting. Exactly one row matches. */
export function decideWorkSync(file: WorkSyncFileState, store: WorkSyncStoreState, projection: WorkProjection): WorkSyncTableRow {
  const rows = WORK_SYNC_TABLE.filter(
    (row) =>
      row.file === file &&
      (row.store === "any" || row.store === store) &&
      (row.projection === "any" || row.projection === projection),
  );
  if (rows.length !== 1) throw new Error(`The sync table has ${rows.length} rows for ${file}, ${store}, ${projection}.`);
  return rows[0]!;
}

/* ------------------------------------------------------------------------ */
/* Report                                                                   */
/* ------------------------------------------------------------------------ */

export type WorkSyncAction =
  | "none"
  | "imported"
  | "written"
  | "removed"
  | "conflict"
  | "still-in-conflict"
  | "unreadable"
  | "adopted"
  | "not-written"
  | "moved"
  | "ledger-cleared"
  | "deferred"
  | "held";

export interface WorkSyncFileResult {
  path: string;
  fileState: WorkSyncFileState;
  storeState: WorkSyncStoreState;
  projection: WorkProjection;
  decision: WorkSyncDecision;
  action: WorkSyncAction;
  detail: string | null;
}

export type WorkSyncUnreadableCode = WorkFileParseFailure["code"] | "coordinate-taken" | "parent-missing" | "unsafe-path";

export interface WorkSyncUnreadable {
  path: string;
  code: WorkSyncUnreadableCode;
  line: number;
  message: string;
}

export interface WorkImportRecord {
  path: string;
  units: Array<{ coordinate: string; kind: string }>;
  created: number;
  updated: number;
  /** Coordinates of units that left the file, and were deleted from the store. */
  deleted: string[];
}

export interface WorkImportReport {
  records: WorkImportRecord[];
  resolvedDependencies: Array<{ unit: string; dependsOn: string; sourceText: string; path: string; line: number }>;
  unresolvedDependencies: Array<{ unit: string; coordinate: string; sourceText: string; path: string; line: number }>;
  gates: Array<{ unit: string; text: string; path: string; line: number }>;
  diagnostics: Array<WorkFileDiagnostic & { path: string }>;
  /** Dependencies that pointed at a deleted unit and are now unresolved text, or unresolved text that now names a unit. */
  rewired: Array<{ unit: string; coordinate: string; now: "resolved" | "unresolved" }>;
}

export interface WorkSyncReport {
  projectId: string;
  checkoutId: string;
  projection: WorkProjection;
  /** True for the first sync of this checkout: `work_sync_checkouts` had no row for it. That sync only imports, and it writes the row at its end (R-WORK-SYNC-9). */
  firstImport: boolean;
  files: WorkSyncFileResult[];
  import: WorkImportReport;
  unreadable: WorkSyncUnreadable[];
  conflicts: WorkConflictReport[];
  written: string[];
  removed: string[];
  /** Changed copies that copies-off sync imported and kept, never removed (A15). */
  keptChangedCopies: string[];
  notWritten: Array<{ path: string; coordinate: string; reason: string }>;
  /**
   * Files that the file system refused to write or remove, such as a read-only
   * folder. The file, its units, and its ledger entry stay as they were, so the
   * next sync tries again (R-WORK-SYNC-8).
   */
  fileErrors: Array<{ path: string; operation: "write" | "remove"; code: string; message: string }>;
  moved: Array<{ from: string; to: string }>;
  /** Units that left their files and were deleted from the store, each named (R-WORK-SYNC-12). */
  deleted: Array<{ coordinate: string; path: string }>;
  /** What the first sync of a checkout would write or remove. It writes and removes nothing. */
  deferred: { write: string[]; remove: string[] };
  /** Files under a write hold: sync reads them and never writes or removes them. */
  held: Array<{ path: string; reason: string }>;
  /** Human words first. */
  summary: string;
}

/* ------------------------------------------------------------------------ */
/* Files on disk                                                            */
/* ------------------------------------------------------------------------ */

interface DiskFile {
  bytes: Buffer | null;
  unsafe: string | null;
}

function hasSymlink(root: string, relative: string): boolean {
  let current = root;
  for (const part of relative.split("/")) {
    current = path.join(current, part);
    try {
      if (lstatSync(current).isSymbolicLink()) return true;
    } catch {
      return false;
    }
  }
  return false;
}

/** Every work file under `docs/work/` and `.make-docs/archive/work/`, with its bytes. */
export function scanWorkFiles(root: string): Map<string, DiskFile> {
  const files = new Map<string, DiskFile>();
  for (const workRoot of WORK_FILE_ROOTS) {
    const absoluteRoot = path.join(root, ...workRoot.split("/"));
    if (!existsSync(absoluteRoot)) continue;
    if (hasSymlink(root, workRoot) || !lstatSync(absoluteRoot).isDirectory()) continue;
    for (const folder of readdirSync(absoluteRoot, { withFileTypes: true })) {
      if (!folder.isDirectory() && !folder.isSymbolicLink()) continue;
      for (const name of folder.isDirectory() ? readdirSync(path.join(absoluteRoot, folder.name)) : []) {
        const relative = `${workRoot}/${folder.name}/${name}`;
        if (!classifyWorkFilePath(relative)) continue;
        const absolute = path.join(absoluteRoot, folder.name, name);
        const stat = lstatSync(absolute);
        if (stat.isSymbolicLink()) files.set(relative, { bytes: null, unsafe: "The work file is a symbolic link, so Make Docs does not read or write it." });
        else if (stat.isFile()) files.set(relative, { bytes: readFileSync(absolute), unsafe: null });
      }
    }
  }
  return files;
}

/** Run one file system change, and return its error code and message instead of throwing. */
function fileFailure(change: () => void): { code: string; message: string } | null {
  try {
    change();
    return null;
  } catch (error) {
    const code = typeof (error as NodeJS.ErrnoException).code === "string" ? (error as NodeJS.ErrnoException).code! : "file-error";
    return { code, message: error instanceof Error ? error.message : String(error) };
  }
}

function writeWorkFileAtomically(root: string, relative: string, text: string): void {
  const target = path.join(root, ...relative.split("/"));
  const directory = path.dirname(target);
  if (hasSymlink(root, path.posix.dirname(relative))) throw new Error(`The folder of ${relative} has a symbolic link.`);
  mkdirSync(directory, { recursive: true });
  if (existsSync(target) && lstatSync(target).isSymbolicLink()) throw new Error(`${relative} is a symbolic link.`);
  const temporary = path.join(directory, `.${path.basename(target)}.make-docs-${process.pid}-${Date.now()}.tmp`);
  writeFileSync(temporary, text, { encoding: "utf8", flag: "wx" });
  try {
    platform.atomicReplace(temporary, target);
  } catch (error) {
    try {
      unlinkSync(temporary);
    } catch {
      // The temporary file may already be gone.
    }
    throw error;
  }
}

/* ------------------------------------------------------------------------ */
/* Sync                                                                     */
/* ------------------------------------------------------------------------ */

export interface WorkSyncOptions {
  storeRoot?: string;
  now?: Date;
  /** The copy setting. Defaults to `work.projection` in the project config. */
  projection?: WorkProjection;
  /**
   * Folders that sync reads but never writes or removes, each with its reason,
   * such as a backlog that waits for its own project doctor run (register
   * D-063). P4 decides where the list comes from (P4 T19).
   */
  holdWrites?: ReadonlyArray<{ folder: string; reason: string }>;
}

interface FileView {
  path: string;
  info: WorkFilePathInfo;
  bytes: Buffer | null;
  text: string | null;
  digest: string | null;
  parsed: { ok: true; document: WorkFileDocument } | { ok: false; failure: WorkSyncUnreadable } | null;
  ledger: WorkSyncLedgerRow | null;
  conflict: WorkSyncConflictRow | null;
  units: WorkUnitRecord[];
  fileState: WorkSyncFileState;
  storeState: WorkSyncStoreState;
}

const KIND_ORDER = ["wave", "revision", "phase", "stage", "task", "quick-item"] as const;

function kindRank(kind: string): number {
  return KIND_ORDER.indexOf(kind as (typeof KIND_ORDER)[number]);
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value !== null && typeof value === "object") {
    return `{${Object.keys(value as Record<string, unknown>).sort().map((key) => `${JSON.stringify(key)}:${stableStringify((value as Record<string, unknown>)[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function sameUnit(input: WorkUnitInput, current: WorkUnitRecord): boolean {
  const { revision: _revision, ...rest } = current;
  return stableStringify(input) === stableStringify(rest);
}

function unitInputOf(record: WorkUnitRecord): WorkUnitInput {
  const { revision: _revision, ...rest } = record;
  return rest;
}

/** The store's states for the units of one file, in the fields the file can show. */
function storeStatesOf(units: readonly WorkUnitRecord[]): WorkFileUnitState[] {
  return units.map((unit) => ({
    coordinate: unit.coordinate,
    kind: unit.kind as WorkFileUnitState["kind"],
    status: unit.status,
    closeOutcome: unit.closeOutcome,
    title: unit.title,
    text: unit.kind === "task" ? unit.body : null,
    blockers: unit.blockers.map((blocker) => blocker.text),
    gates: unit.gates.map((gate) => gate.sourceText),
  }));
}

/** The file unit of a path: the revision of an index file or the phase of a phase file. */
function fileUnitOf(view: Pick<FileView, "info" | "units">): WorkUnitRecord | null {
  return view.units.find((unit) => unit.coordinate === view.info.coordinate && unit.kind === (view.info.kind === "index" ? "revision" : "phase")) ?? null;
}

/** The frame: the last applied text that the store holds for a file, parsed. */
function frameOf(view: Pick<FileView, "info" | "units" | "path">): WorkFileDocument | null {
  const fileUnit = fileUnitOf(view);
  if (!fileUnit || fileUnit.body === null) return null;
  const parsed = parseWorkFile(view.path, fileUnit.body);
  return parsed.ok ? parsed.document : null;
}

/** Render what the store holds for a file, or say why it cannot. */
function renderStore(view: FileView): { ok: true; text: string; changedUnits: string[]; frame: WorkFileDocument } | { ok: false; coordinate: string; reason: string } {
  const frame = frameOf(view);
  if (!frame) return { ok: false, coordinate: view.info.coordinate, reason: "The store has no readable text for this file." };
  const rendered = renderWorkFile(frame, storeStatesOf(view.units));
  return rendered.ok ? { ...rendered, frame } : rendered;
}

/** Both sides hold the same work: the file bytes equal what the store renders. */
function sidesAgree(view: FileView): boolean {
  if (view.text === null || view.parsed?.ok !== true || view.units.length === 0) return false;
  if (view.units.some((unit) => unit.copyState === "removed")) return false;
  const rendered = renderStore(view);
  return rendered.ok && rendered.text === view.text;
}

function differencesOf(view: FileView): WorkConflictUnitDifference[] {
  const fileUnits = view.parsed?.ok ? view.parsed.document.units : [];
  const fileStates = new Map(fileUnits.map((unit) => [unit.coordinate, unit]));
  const storeUnits = new Map(view.units.map((unit) => [unit.coordinate, unit]));
  const describeFile = (unit: ParsedWorkUnit) => `${unit.recordedStatus ?? "no status"}, "${unit.text ?? unit.title}"`;
  const describeStore = (unit: WorkUnitRecord) => `${unit.status}${unit.closeOutcome ? ` (${unit.closeOutcome})` : ""}, "${unit.kind === "task" ? unit.body : unit.title}"`;
  const differences: WorkConflictUnitDifference[] = [];
  const coordinates = [...new Set([...fileStates.keys(), ...storeUnits.keys()])];
  for (const coordinate of coordinates) {
    const file = fileStates.get(coordinate);
    const store = storeUnits.get(coordinate);
    if (file && store) {
      const filePair = recordedStatusOf(file.recordedStatus);
      const sameStatus = file.kind === "task" ? (filePair.status === "closed") === (store.status === "closed") : filePair.status === store.status && filePair.closeOutcome === store.closeOutcome;
      const sameText = file.kind === "task" ? file.text === store.body : file.title === store.title;
      if (sameStatus && sameText) continue;
    }
    differences.push({ coordinate, file: file ? describeFile(file) : null, store: store ? describeStore(store) : null });
  }
  return differences;
}

/**
 * Run first import or two-way sync for the project at `projectRoot` in this
 * checkout. The checkout must be bound to a usable Store. The first sync of a
 * checkout imports every backlog and writes no file (R-WORK-SYNC-9).
 */
export function syncWorkFiles(projectRoot: string, options: WorkSyncOptions = {}): WorkSyncReport {
  const root = canonicalInstallationPath(projectRoot);
  const storeRoot = options.storeRoot ?? resolveStoreRoot();
  const now = options.now ?? new Date();
  const projection = options.projection ?? readWorkProjection(root);
  // Refuse an unusable Store with its typed result before anything else.
  readWorkStore(root, () => null, { storeRoot });
  const checkoutId = getExistingInstallationCheckoutId(root, storeRoot);
  if (!checkoutId) {
    throw new WorkStoreRefusalError(
      "checkout-not-bound",
      "This checkout is not bound to the Store, so it has no sync ledger.",
      WORK_SYNC_CHECKOUT_NOT_BOUND_NEXT_ACTION,
    );
  }
  const disk = scanWorkFiles(root);
  const holdWrites = (options.holdWrites ?? []).map((hold) => ({ folder: hold.folder.replace(/\/+$/, ""), reason: hold.reason }));
  return writeWorkStore(root, (db, project) => runSync({ db, root, projectId: project.projectId, checkoutId, projection, now, disk, holdWrites }), { storeRoot, now });
}

interface SyncContext {
  db: StoreDatabase;
  root: string;
  projectId: string;
  checkoutId: string;
  projection: WorkProjection;
  now: Date;
  disk: Map<string, DiskFile>;
  holdWrites: ReadonlyArray<{ folder: string; reason: string }>;
}

function runSync(context: SyncContext): WorkSyncReport {
  const { db, projectId, checkoutId, projection, now } = context;
  const nowText = now.toISOString();
  const report: WorkSyncReport = {
    projectId,
    checkoutId,
    projection,
    firstImport: false,
    files: [],
    import: { records: [], resolvedDependencies: [], unresolvedDependencies: [], gates: [], diagnostics: [], rewired: [] },
    unreadable: [],
    conflicts: [],
    written: [],
    removed: [],
    keptChangedCopies: [],
    notWritten: [],
    fileErrors: [],
    moved: [],
    deleted: [],
    deferred: { write: [], remove: [] },
    held: [],
    summary: "",
  };

  const loadUnits = () => listWorkUnits(db, projectId);
  let allUnits = loadUnits();
  const unitsOfPath = (units: readonly WorkUnitRecord[], target: string) =>
    units.filter((unit) => unit.sourcePath === target && unit.kind !== "wave" && unit.kind !== "quick-item");
  const ledger = new Map(listSyncLedger(db, checkoutId).map((row) => [row.entry.targetPath, row]));
  const conflicts = new Map(listSyncConflicts(db, checkoutId).map((row) => [row.conflict.targetPath, row]));
  // The first sync of this checkout only imports (R-WORK-SYNC-9). Its end is recorded in work_sync_checkouts.
  report.firstImport = readWorkSyncCheckout(db, checkoutId) === null;

  const paths = new Set<string>([...context.disk.keys(), ...ledger.keys(), ...conflicts.keys()]);
  for (const unit of allUnits) if (unit.sourcePath && unit.kind !== "wave" && unit.kind !== "quick-item") paths.add(unit.sourcePath);

  const views: FileView[] = [];
  for (const target of [...paths].sort()) {
    const info = classifyWorkFilePath(target);
    if (!info) continue;
    const disk = context.disk.get(target) ?? null;
    const entry = ledger.get(target) ?? null;
    const units = unitsOfPath(allUnits, target);
    let parsed: FileView["parsed"] = null;
    let text: string | null = null;
    if (disk?.unsafe) parsed = { ok: false, failure: { path: target, code: "unsafe-path", line: 1, message: disk.unsafe } };
    else if (disk?.bytes) {
      const result = parseWorkFile(target, disk.bytes);
      parsed = result.ok ? result : { ok: false, failure: result.failure };
      if (result.ok) text = result.document.text;
    }
    const digest = disk?.bytes ? sha256Hex(disk.bytes) : null;
    const fileState = workSyncFileState({
      exists: disk !== null,
      readable: parsed?.ok === true,
      digest,
      ledgerDigest: entry?.entry.lastAppliedDigest ?? null,
    });
    const storeState = workSyncStoreState({ units, ledger: entry ? entry.entry : null });
    views.push({ path: target, info, bytes: disk?.bytes ?? null, text, digest, parsed, ledger: entry, conflict: conflicts.get(target) ?? null, units, fileState, storeState });
  }

  const result = (view: FileView, decision: WorkSyncDecision, action: WorkSyncAction, detail: string | null = null) =>
    report.files.push({ path: view.path, fileState: view.fileState, storeState: view.storeState, projection, decision, action, detail });

  const putLedger = (view: FileView, digest: string, units: readonly WorkUnitRecord[]) => {
    const current = ledger.get(view.path) ?? null;
    const row = putSyncLedgerEntry(
      db,
      {
        checkoutId,
        targetPath: view.path,
        unitStoreIds: units.map((unit) => unit.storeId).sort(),
        digestAlgorithm: "sha256",
        lastAppliedDigest: digest,
        storeRevision: fileStoreRevision(units),
        syncedAt: nowText,
      },
      { expectedVersion: current?.entryVersion ?? null },
    );
    ledger.set(view.path, row);
  };
  const clearLedger = (target: string) => {
    const current = ledger.get(target);
    if (!current) return;
    deleteSyncLedgerEntry(db, checkoutId, target, { expectedVersion: current.entryVersion });
    ledger.delete(target);
  };
  const conflictReport = (view: FileView, kind: WorkConflictKind, reasons: string[] = []) =>
    buildWorkConflictReport({
      reasons,
      path: view.path,
      kind,
      fileState: view.fileState,
      storeState: view.storeState,
      projection,
      file: { present: view.bytes !== null, digest: view.digest, revision: null, units: view.parsed?.ok ? view.parsed.document.units.map((unit) => unit.coordinate) : [] },
      store: { present: view.units.length > 0, digest: null, revision: view.units.length > 0 ? fileStoreRevision(view.units) : null, units: view.units.map((unit) => unit.coordinate) },
      lastAppliedDigest: view.ledger?.entry.lastAppliedDigest ?? null,
      affectedUnits: kind === "store-missing" ? [] : view.units.map((unit) => unit.coordinate),
      differences: differencesOf(view),
    });
  /**
   * Stop one file for a person when its import would lose store data or act
   * for a claim holder. Nothing in the file or the store changes, and only the
   * file's units wait (R-WORK-SYNC-5).
   */
  const stopForPerson = (view: FileView, reasons: string[], affected: readonly WorkUnitRecord[]) => {
    if (!view.conflict) {
      putSyncConflict(
        db,
        {
          checkoutId,
          targetPath: view.path,
          kind: "unclear",
          fileDigest: view.digest,
          ledgerDigest: view.ledger?.entry.lastAppliedDigest ?? null,
          storeRevision: Math.max(1, fileStoreRevision(affected)),
          affectedUnitStoreIds: affected.map((unit) => unit.storeId),
          detectedAt: nowText,
        },
        { expectedVersion: null },
      );
    }
    report.conflicts.push({ ...conflictReport({ ...view, units: [...affected] }, "unclear", reasons), affectedUnits: affected.map((unit) => unit.coordinate) });
    result(view, "import", view.conflict ? "still-in-conflict" : "conflict", reasons.join(" "));
  };
  const adopt = (view: FileView) => {
    if (view.conflict) deleteSyncConflict(db, checkoutId, view.path, { expectedVersion: view.conflict.entryVersion });
    putLedger(view, view.digest!, view.units);
  };

  /* Moves: a file that left one backlog folder and arrived in another, such as an archive move. */
  const moveFrom = new Map<string, FileView>();
  const handled = new Set<string>();
  for (const target of views.filter((view) => view.fileState === "new" && view.storeState === "none" && view.parsed?.ok && !view.conflict)) {
    const sources = views.filter(
      (view) => view.fileState === "missing" && view.storeState === "unchanged" && !view.conflict && view.info.coordinate === target.info.coordinate && view.info.kind === target.info.kind,
    );
    if (sources.length !== 1 || handled.has(sources[0]!.path)) continue;
    moveFrom.set(target.path, sources[0]!);
    handled.add(sources[0]!.path);
  }

  const imports: FileView[] = [];
  const writes: FileView[] = [];
  const removes: FileView[] = [];
  for (const view of views) {
    if (handled.has(view.path)) continue; // A move source is settled with its target.
    if (view.conflict) {
      if (sidesAgree(view)) {
        adopt(view);
        result(view, "none", "adopted", "The file and the store hold the same work again, so the conflict is settled.");
      } else if (view.parsed?.ok && decideWorkSync(view.fileState, view.storeState, projection).decision === "import") {
        // The table imports this state, so the conflict came from an import guard. Try the import again.
        imports.push(view);
      } else {
        result(view, "conflict", "still-in-conflict", "The conflict waits for a person to choose.");
        report.conflicts.push(conflictReport(view, view.conflict.conflict.kind));
      }
      continue;
    }
    const row = decideWorkSync(view.fileState, view.storeState, projection);
    switch (row.decision) {
      case "none":
        if (view.fileState === "missing" && (view.storeState === "none" || view.storeState === "removed")) {
          clearLedger(view.path);
          result(view, "none", "ledger-cleared", "The copy is gone, so this checkout's ledger entry is removed.");
        } else {
          result(view, "none", "none");
        }
        break;
      case "import":
        imports.push(view);
        break;
      case "write":
        writes.push(view);
        break;
      case "remove-copy":
        removes.push(view);
        break;
      case "report-unreadable": {
        const failure = view.parsed && !view.parsed.ok ? view.parsed.failure : { path: view.path, code: "unsafe-path" as const, line: 1, message: "The file cannot be read." };
        report.unreadable.push(failure);
        result(view, "report-unreadable", "unreadable", `Line ${failure.line}: ${failure.message}`);
        break;
      }
      case "conflict": {
        // Both sides hold the same bytes, so nothing is lost: record the ledger and continue.
        if (sidesAgree(view)) {
          adopt(view);
          result(view, "conflict", "adopted", "The file matches what the store holds, so no person needs to decide.");
          break;
        }
        const kind = row.conflictKind!;
        putSyncConflict(
          db,
          {
            checkoutId,
            targetPath: view.path,
            kind,
            // The conflict table records no file digest for a file-deleted conflict, also when the copy came back.
            fileDigest: kind === "file-deleted" ? null : view.digest,
            ledgerDigest: view.ledger?.entry.lastAppliedDigest ?? null,
            storeRevision: kind === "store-missing" ? null : fileStoreRevision(view.units),
            affectedUnitStoreIds: kind === "store-missing" ? [] : view.units.map((unit) => unit.storeId),
            detectedAt: nowText,
          },
          { expectedVersion: null },
        );
        report.conflicts.push(conflictReport(view, kind));
        result(view, "conflict", "conflict", `${kind}: ${row.humanMeaning}`);
        break;
      }
    }
  }

  /* Import (R-WORK-SYNC-2, R-WORK-SYNC-9, R-WORK-SYNC-10, R-WORK-SYNC-12). */
  if (imports.length > 0) runImports(context, report, imports, moveFrom, allUnits, result, putLedger, clearLedger, stopForPerson);
  allUnits = loadUnits();

  /* Write (R-WORK-SYNC-3, R-WORK-SYNC-12). */
  const holdOf = (target: string) => context.holdWrites.find((hold) => target.startsWith(`${hold.folder}/`)) ?? null;
  for (const view of writes) {
    const current: FileView = { ...view, units: unitsOfPath(allUnits, view.path) };
    if (projection !== "on") {
      result(view, "write", "none", "Copies are off, so Make Docs writes no file.");
      continue;
    }
    const hold = holdOf(view.path);
    if (hold) {
      report.held.push({ path: view.path, reason: hold.reason });
      result(view, "write", "held", hold.reason);
      continue;
    }
    if (report.firstImport) {
      // The first sync of a checkout only imports. The next sync writes.
      report.deferred.write.push(view.path);
      result(view, "write", "deferred", "This is the first sync of this checkout, so Make Docs writes no file. The next sync writes it.");
      continue;
    }
    const rendered = renderStore(current);
    if (!rendered.ok) {
      report.notWritten.push({ path: view.path, coordinate: rendered.coordinate, reason: rendered.reason });
      result(view, "write", "not-written", rendered.reason);
      continue;
    }
    if (current.text !== rendered.text) {
      const failure = fileFailure(() => writeWorkFileAtomically(context.root, view.path, rendered.text));
      if (failure) {
        report.fileErrors.push({ path: view.path, operation: "write", ...failure });
        result(view, "write", "not-written", `${failure.code}: ${failure.message}`);
        continue;
      }
    }
    const units = refreshFrame(db, current, rendered.text, rendered.changedUnits);
    putLedger(current, sha256Hex(rendered.text), units);
    report.written.push(view.path);
    result(view, "write", "written", rendered.changedUnits.length > 0 ? `Changed: ${rendered.changedUnits.join(", ")}.` : null);
  }

  /* Remove an unchanged copy (R-WORK-STORE-9, R-WORK-SYNC-11). */
  for (const view of removes) {
    const hold = holdOf(view.path);
    if (hold) {
      report.held.push({ path: view.path, reason: hold.reason });
      result(view, "remove-copy", "held", hold.reason);
      continue;
    }
    if (report.firstImport) {
      report.deferred.remove.push(view.path);
      result(view, "remove-copy", "deferred", "This is the first sync of this checkout, so Make Docs removes no file. The next sync removes it.");
      continue;
    }
    const absolute = path.join(context.root, ...view.path.split("/"));
    const bytes = existsSync(absolute) ? readFileSync(absolute) : null;
    if (!bytes || sha256Hex(bytes) !== view.ledger?.entry.lastAppliedDigest || hasSymlink(context.root, view.path)) {
      report.keptChangedCopies.push(view.path);
      result(view, "remove-copy", "none", "The copy changed since the last sync, so Make Docs keeps it.");
      continue;
    }
    const failure = fileFailure(() => unlinkSync(absolute));
    if (failure) {
      report.fileErrors.push({ path: view.path, operation: "remove", ...failure });
      result(view, "remove-copy", "not-written", `${failure.code}: ${failure.message}`);
      continue;
    }
    clearLedger(view.path);
    report.removed.push(view.path);
    result(view, "remove-copy", "removed", null);
  }

  /*
   * A file that stayed the same while another file's import changed its units
   * (a dependency that now resolves, or one whose unit left its file) keeps
   * its bytes. Its ledger takes the new store revision.
   */
  allUnits = loadUnits();
  for (const view of views) {
    const entry = ledger.get(view.path);
    if (!entry || report.files.find((file) => file.path === view.path)?.action !== "none" || view.fileState !== "unchanged") continue;
    const units = unitsOfPath(allUnits, view.path);
    if (workSyncStoreState({ units, ledger: entry.entry }) !== "changed") continue;
    const rendered = renderStore({ ...view, units });
    if (rendered.ok && rendered.text === view.text) putLedger(view, view.digest!, units);
  }

  if (report.firstImport) markWorkSyncCheckout(db, checkoutId, { now });
  report.summary = summarize(report);
  return report;
}

/** Make the frame equal the written text, and the recorded status of each changed unit match it. */
function refreshFrame(db: StoreDatabase, view: FileView, text: string, changedUnits: readonly string[]): WorkUnitRecord[] {
  const parsed = parseWorkFile(view.path, text);
  if (!parsed.ok) throw new Error(`The writer produced text that the parser cannot read: ${parsed.failure.message}`);
  const recorded = new Map(parsed.document.units.map((unit) => [unit.coordinate, unit]));
  const changed = new Set(changedUnits);
  for (const unit of view.units) {
    const parsedUnit = recorded.get(unit.coordinate);
    const isFileUnit = unit.coordinate === view.info.coordinate;
    const body = isFileUnit ? text : unit.kind === "task" ? parsedUnit?.text ?? unit.body : unit.body;
    const recordedStatus = changed.has(unit.coordinate) ? parsedUnit?.recordedStatus ?? unit.recordedStatus : unit.recordedStatus;
    if (body === unit.body && recordedStatus === unit.recordedStatus) continue;
    const current = readWorkUnit(db, unit.storeId)!;
    putWorkUnit(db, { ...unitInputOf(current), body, recordedStatus }, { expectedVersion: current.revision });
  }
  return listWorkUnits(db, view.units[0]!.projectId).filter((unit) => unit.sourcePath === view.path && unit.kind !== "wave");
}

/* ------------------------------------------------------------------------ */
/* Import                                                                   */
/* ------------------------------------------------------------------------ */

interface PlannedFile {
  view: FileView;
  document: WorkFileDocument;
  /** Units the store had for this file (and for the file it moved from), by coordinate. */
  existing: Map<string, WorkUnitRecord>;
  /** The previous frame, the base of a three-way merge of each field. */
  base: Map<string, ParsedWorkUnit>;
  movedFrom: FileView | null;
}

function runImports(
  context: SyncContext,
  report: WorkSyncReport,
  imports: FileView[],
  moveFrom: Map<string, FileView>,
  storeUnits: WorkUnitRecord[],
  result: (view: FileView, decision: WorkSyncDecision, action: WorkSyncAction, detail?: string | null) => void,
  putLedger: (view: FileView, digest: string, units: readonly WorkUnitRecord[]) => void,
  clearLedger: (target: string) => void,
  stopForPerson: (view: FileView, reasons: string[], affected: readonly WorkUnitRecord[]) => void,
): void {
  const { db, projectId, now, checkoutId } = context;
  const claims = liveClaimsOf(db, projectId, now);
  const blockedPaths = new Set(
    report.files.filter((file) => file.action === "conflict" || file.action === "still-in-conflict" || file.action === "unreadable").map((file) => file.path),
  );
  const byCoordinate = new Map(storeUnits.map((unit) => [unit.coordinate, unit]));
  const claimed = new Map<string, string>(); // coordinate -> path, within this import

  // Plan each file, and leave out a file whose coordinate belongs to another file.
  const planned: PlannedFile[] = [];
  for (const view of imports) {
    const document = (view.parsed as { ok: true; document: WorkFileDocument }).document;
    const movedFrom = moveFrom.get(view.path) ?? null;
    const owners = new Set([view.path, ...(movedFrom ? [movedFrom.path] : [])]);
    let refusal: WorkSyncUnreadable | null = null;
    for (const unit of document.units) {
      const holder = byCoordinate.get(unit.coordinate);
      const holderPath = holder?.sourcePath ?? null;
      if (holder && holderPath && !owners.has(holderPath)) {
        refusal = { path: view.path, code: "coordinate-taken", line: unit.line, message: `${unit.coordinate} already belongs to ${holderPath}. This file stays out of the store until one of the two changes.` };
        break;
      }
      const other = claimed.get(unit.coordinate);
      if (other && other !== view.path) {
        refusal = { path: view.path, code: "coordinate-taken", line: unit.line, message: `${unit.coordinate} is also in ${other}. This file stays out of the store until one of the two changes.` };
        break;
      }
    }
    if (refusal) {
      report.unreadable.push(refusal);
      result(view, "import", "unreadable", `Line ${refusal.line}: ${refusal.message}`);
      blockedPaths.add(view.path);
      continue;
    }
    for (const unit of document.units) claimed.set(unit.coordinate, view.path);
    const existing = new Map<string, WorkUnitRecord>();
    for (const unit of [...view.units, ...(movedFrom?.units ?? [])]) existing.set(unit.coordinate, unit);
    const baseFrame = frameOf(movedFrom ?? view);
    const base = new Map((baseFrame?.units ?? []).map((unit) => [unit.coordinate, unit]));
    planned.push({ view, document, existing, base, movedFrom });
  }

  // A phase needs its revision in the store or in this import.
  const planCoordinates = new Set(planned.flatMap((plan) => plan.document.units.map((unit) => unit.coordinate)));
  for (let index = planned.length - 1; index >= 0; index -= 1) {
    const plan = planned[index]!;
    const fileUnit = plan.document.units[0]!;
    if (fileUnit.kind === "phase" && !byCoordinate.has(fileUnit.parentCoordinate) && !planCoordinates.has(fileUnit.parentCoordinate)) {
      const refusal: WorkSyncUnreadable = {
        path: plan.view.path,
        code: "parent-missing",
        line: 1,
        message: `The phase needs its revision ${fileUnit.parentCoordinate}, and no ${fileUnit.parentCoordinate} index file is in the store. Add or fix the 00-index.md of this backlog.`,
      };
      report.unreadable.push(refusal);
      result(plan.view, "import", "unreadable", refusal.message);
      blockedPaths.add(plan.view.path);
      for (const unit of plan.document.units) planCoordinates.delete(unit.coordinate);
      planned.splice(index, 1);
    }
  }

  /*
   * Import guards. An import never acts for a claim holder, and never deletes
   * a unit that holds what the file cannot show. Such a file stops for a person
   * as a conflict, and only its own units wait.
   *
   * One stopped file can make another file stop: a unit that leaves its file
   * cannot be deleted while a stopped file depends on it. So the check runs
   * again until no new file stops, and the file order never matters.
   */
  for (let stopped = true; stopped;) {
    stopped = false;
    for (let index = planned.length - 1; index >= 0; index -= 1) {
      const plan = planned[index]!;
      const reasons = importGuardReasons(plan, storeUnits, claims, blockedPaths);
      if (reasons.length === 0) continue;
      stopForPerson(plan.view, reasons, [...plan.existing.values()]);
      blockedPaths.add(plan.view.path);
      planned.splice(index, 1);
      stopped = true;
    }
  }
  // A file that passed its guards no longer has a conflict.
  for (const plan of planned) {
    if (plan.view.conflict) deleteSyncConflict(db, checkoutId, plan.view.path, { expectedVersion: plan.view.conflict.entryVersion });
  }

  // Store IDs: keep each existing unit's ID, and give each new unit a new one.
  const idOf = new Map<string, string>(storeUnits.map((unit) => [unit.coordinate, unit.storeId]));
  const deletedIds = new Set<string>();
  for (const plan of planned) {
    const parsedCoordinates = new Set(plan.document.units.map((unit) => unit.coordinate));
    for (const unit of plan.document.units) idOf.set(unit.coordinate, plan.existing.get(unit.coordinate)?.storeId ?? newWorkUnitStoreId());
    for (const [coordinate, unit] of plan.existing) {
      if (!parsedCoordinates.has(coordinate)) {
        deletedIds.add(unit.storeId);
        idOf.delete(coordinate);
      }
    }
  }
  // Waves: one per wave that an imported revision names.
  const waves: WorkUnitInput[] = [];
  for (const plan of planned) {
    const fileUnit = plan.document.units[0]!;
    if (fileUnit.kind !== "revision" || idOf.has(fileUnit.parentCoordinate)) continue;
    const storeId = newWorkUnitStoreId();
    idOf.set(fileUnit.parentCoordinate, storeId);
    waves.push({
      projectId,
      storeId,
      kind: "wave",
      coordinate: fileUnit.parentCoordinate,
      parentStoreId: null,
      title: fileUnit.parentCoordinate,
      body: null,
      recordedStatus: null,
      status: "open",
      closeOutcome: null,
      dependencies: [],
      unresolvedDependencies: [],
      gates: [],
      blockers: [],
      links: [],
      sourcePath: plan.view.path,
      copyState: "kept",
    });
  }
  const exists = (coordinate: string) => idOf.has(coordinate);
  const titles = new Map(storeUnits.map((unit) => [unit.coordinate, unit.title]));
  for (const plan of planned) for (const unit of plan.document.units) titles.set(unit.coordinate, unit.title);
  const titleOf = (coordinate: string) => titles.get(coordinate) ?? null;

  // Build the unit records.
  const inputs: Array<{ input: WorkUnitInput; current: WorkUnitRecord | null; plan: PlannedFile }> = [];
  for (const plan of planned) {
    const target = plan.view.path;
    for (const unit of plan.document.units) {
      const current = plan.existing.get(unit.coordinate) ?? null;
      const base = plan.base.get(unit.coordinate) ?? null;
      const dependencies: WorkDependency[] = [];
      const unresolved: WorkUnresolvedDependency[] = [];
      const gates: WorkGate[] = [];
      const seenDependencies = new Set<string>();
      const seenUnresolved = new Set<string>();
      for (const bullet of unit.dependencyBullets) {
        const read = readDependencyBullet(bullet.text, unit.coordinate, exists, titleOf);
        const source = { path: target, line: bullet.line };
        if (read.gate) {
          const met = current?.gates.find((gate) => gate.sourceText === bullet.text)?.met ?? false;
          gates.push({ sourceText: bullet.text, source, met });
          report.import.gates.push({ unit: unit.coordinate, text: bullet.text, path: target, line: bullet.line });
          continue;
        }
        for (const coordinate of read.dependencies) {
          if (seenDependencies.has(coordinate)) continue;
          seenDependencies.add(coordinate);
          dependencies.push({ dependsOnStoreId: idOf.get(coordinate)!, sourceText: bullet.text.slice(0, 2048), source });
          report.import.resolvedDependencies.push({ unit: unit.coordinate, dependsOn: coordinate, sourceText: bullet.text, path: target, line: bullet.line });
        }
        for (const coordinate of read.unresolved) {
          if (seenUnresolved.has(coordinate)) continue;
          seenUnresolved.add(coordinate);
          unresolved.push({ sourceText: coordinate, source });
          report.import.unresolvedDependencies.push({ unit: unit.coordinate, coordinate, sourceText: bullet.text, path: target, line: bullet.line });
        }
      }
      // Three-way merge of the status: a file that still shows what the last
      // applied text showed keeps the store's status, which may be one the file
      // cannot show (a stage's status, or a task in progress).
      const status = mergedStatus(unit, current, base);
      const inbound = current?.links.filter((link) => link.direction === "inbound") ?? [];
      const input: WorkUnitInput = {
        projectId,
        storeId: idOf.get(unit.coordinate)!,
        kind: unit.kind,
        coordinate: unit.coordinate,
        parentStoreId: idOf.get(unit.parentCoordinate) ?? null,
        title: unit.title,
        body: unit.kind === plan.document.units[0]!.kind && unit.coordinate === plan.view.info.coordinate ? plan.document.text : unit.kind === "task" ? unit.text : null,
        recordedStatus: unit.recordedStatus,
        status: status.status,
        closeOutcome: status.closeOutcome,
        dependencies,
        unresolvedDependencies: unresolved,
        gates,
        blockers: unit.blockerBullets.map((bullet) => ({ text: bullet.text, source: { path: target, line: bullet.line } })),
        links: [...unit.links, ...inbound],
        sourcePath: target,
        copyState: "kept",
      };
      inputs.push({ input, current, plan });
    }
  }

  for (const wave of waves) putWorkUnit(db, wave, { expectedVersion: null });
  // Parents first. A unit that a person closed through the store keeps its claim rule.
  inputs.sort((left, right) => kindRank(left.input.kind) - kindRank(right.input.kind));
  const counts = new Map<string, { created: number; updated: number }>();
  for (const { input, current, plan } of inputs) {
    const count = counts.get(plan.view.path) ?? { created: 0, updated: 0 };
    counts.set(plan.view.path, count);
    if (!current) {
      putWorkUnit(db, input, { expectedVersion: null, now });
      count.created += 1;
      continue;
    }
    const fresh = readWorkUnit(db, current.storeId)!;
    if (sameUnit(input, fresh)) continue;
    // The import guards stopped every file that closes a unit with a live claim, so no claim ID is needed.
    putWorkUnit(db, input, { expectedVersion: fresh.revision, now });
    count.updated += 1;
  }

  // Units that left their file: point their dependents at unresolved text first, then delete them.
  if (deletedIds.size > 0) {
    const importedIds = new Set(inputs.map((entry) => entry.input.storeId));
    for (const dependent of listWorkUnits(db, projectId)) {
      if (importedIds.has(dependent.storeId) || deletedIds.has(dependent.storeId)) continue;
      // The guards stopped any file whose deleted unit has a dependent in a waiting file, so this skip changes nothing there.
      if (dependent.sourcePath && blockedPaths.has(dependent.sourcePath)) continue;
      const lost = dependent.dependencies.filter((dependency) => deletedIds.has(dependency.dependsOnStoreId));
      if (lost.length === 0) continue;
      const coordinateOf = (storeId: string) => storeUnits.find((unit) => unit.storeId === storeId)?.coordinate ?? storeId;
      putWorkUnit(db, {
        ...unitInputOf(dependent),
        dependencies: dependent.dependencies.filter((dependency) => !deletedIds.has(dependency.dependsOnStoreId)),
        unresolvedDependencies: [
          ...dependent.unresolvedDependencies,
          ...lost.map((dependency) => ({ sourceText: coordinateOf(dependency.dependsOnStoreId), source: dependency.source ?? { path: dependent.sourcePath ?? "docs/work", line: null } })),
        ],
      }, { expectedVersion: dependent.revision });
      for (const dependency of lost) report.import.rewired.push({ unit: dependent.coordinate, coordinate: coordinateOf(dependency.dependsOnStoreId), now: "unresolved" });
    }
    const doomed = storeUnits.filter((unit) => deletedIds.has(unit.storeId)).sort((left, right) => kindRank(right.kind) - kindRank(left.kind));
    // Units that leave together may depend on each other, such as Stage 2 on Stage 1. Drop those links first.
    for (const unit of doomed) {
      const fresh = readWorkUnit(db, unit.storeId)!;
      if (fresh.dependencies.length === 0) continue;
      putWorkUnit(db, { ...unitInputOf(fresh), dependencies: [] }, { expectedVersion: fresh.revision });
    }
    for (const unit of doomed) {
      report.deleted.push({ coordinate: unit.coordinate, path: unit.sourcePath ?? "" });
      const fresh = readWorkUnit(db, unit.storeId)!;
      deleteWorkUnit(db, unit.storeId, { expectedVersion: fresh.revision });
    }
  }

  // Unresolved text in other files that now names a unit becomes a dependency (R-WORK-SYNC-10).
  const importedIds = new Set(inputs.map((entry) => entry.input.storeId));
  const latest = listWorkUnits(db, projectId);
  const latestIds = new Map(latest.map((unit) => [unit.coordinate, unit.storeId]));
  for (const unit of latest) {
    if (importedIds.has(unit.storeId) || unit.unresolvedDependencies.length === 0 || (unit.sourcePath && blockedPaths.has(unit.sourcePath))) continue;
    const resolvable = unit.unresolvedDependencies.filter((entry) => latestIds.has(entry.sourceText) && latestIds.get(entry.sourceText) !== unit.storeId);
    if (resolvable.length === 0) continue;
    putWorkUnit(db, {
      ...unitInputOf(unit),
      dependencies: [
        ...unit.dependencies,
        ...resolvable
          .filter((entry) => !unit.dependencies.some((dependency) => dependency.dependsOnStoreId === latestIds.get(entry.sourceText)))
          .map((entry) => ({ dependsOnStoreId: latestIds.get(entry.sourceText)!, sourceText: entry.sourceText, source: entry.source })),
      ],
      unresolvedDependencies: unit.unresolvedDependencies.filter((entry) => !resolvable.includes(entry)),
    }, { expectedVersion: unit.revision });
    for (const entry of resolvable) report.import.rewired.push({ unit: unit.coordinate, coordinate: entry.sourceText, now: "resolved" });
  }

  // Ledger entries and the report.
  const finalUnits = listWorkUnits(db, projectId);
  for (const plan of planned) {
    const units = finalUnits.filter((unit) => unit.sourcePath === plan.view.path && unit.kind !== "wave");
    if (plan.movedFrom) {
      clearLedger(plan.movedFrom.path);
      report.moved.push({ from: plan.movedFrom.path, to: plan.view.path });
    }
    putLedger(plan.view, plan.view.digest!, units);
    const count = counts.get(plan.view.path) ?? { created: 0, updated: 0 };
    const parsedCoordinates = new Set(plan.document.units.map((unit) => unit.coordinate));
    report.import.records.push({
      path: plan.view.path,
      units: plan.document.units.map((unit) => ({ coordinate: unit.coordinate, kind: unit.kind })),
      created: count.created,
      updated: count.updated,
      deleted: [...plan.existing.keys()].filter((coordinate) => !parsedCoordinates.has(coordinate)),
    });
    for (const diagnostic of plan.document.diagnostics) report.import.diagnostics.push({ ...diagnostic, path: plan.view.path });
    if (context.projection === "off" && plan.view.fileState === "changed") report.keptChangedCopies.push(plan.view.path);
    result(plan.view, "import", plan.movedFrom ? "moved" : "imported", plan.movedFrom ? `Moved from ${plan.movedFrom.path}.` : null);
  }
  for (const plan of planned) {
    if (plan.movedFrom) {
      report.files.push({
        path: plan.movedFrom.path,
        fileState: plan.movedFrom.fileState,
        storeState: plan.movedFrom.storeState,
        projection: context.projection,
        decision: "import",
        action: "moved",
        detail: `Moved to ${plan.view.path}.`,
      });
    }
  }
}

interface LiveClaim {
  claimant: string;
  expiresAt: string;
}

/** Live claims by unit store ID. Holder state only: the claim ID stays private (P4 T13). */
function liveClaimsOf(db: StoreDatabase, projectId: string, now: Date): Map<string, LiveClaim> {
  const rows = db.prepare("SELECT unit_store_id, claimant, expires_at FROM work_claims WHERE project_id = ? AND expires_at > ?").all(projectId, now.toISOString()) as Array<{
    unit_store_id: string;
    claimant: string;
    expires_at: string;
  }>;
  return new Map(rows.map((row) => [row.unit_store_id, { claimant: row.claimant, expiresAt: row.expires_at }]));
}

/**
 * The status an import gives a unit: a file that still shows what the last
 * applied text showed keeps the store's status, which may be one that the file
 * cannot show (a stage's status, or a task in progress).
 */
function mergedStatus(unit: ParsedWorkUnit, current: WorkUnitRecord | null, base: ParsedWorkUnit | null): { status: WorkUnitRecord["status"]; closeOutcome: WorkUnitRecord["closeOutcome"] } {
  if (current !== null && base !== null && base.recordedStatus === unit.recordedStatus) return { status: current.status, closeOutcome: current.closeOutcome };
  return recordedStatusOf(unit.recordedStatus);
}

/** What a unit holds that its file cannot show. An empty list means the file shows all of it. */
export function storeOnlyData(unit: WorkUnitRecord): string[] {
  const found: string[] = [];
  const shown = recordedStatusOf(unit.recordedStatus);
  if (shown.status !== unit.status || shown.closeOutcome !== unit.closeOutcome) {
    found.push(`the status ${unit.status}${unit.closeOutcome ? ` (${unit.closeOutcome})` : ""}`);
  }
  if (unit.gates.some((gate) => gate.met)) found.push("a met gate");
  if (unit.links.some((link) => link.direction === "inbound")) found.push("links from other documents");
  return found;
}

/**
 * Why a file's import must stop for a person, or nothing:
 *
 * - The file closes a unit that someone holds on a live claim. Only the holder
 *   closes a claimed unit (R-WORK-QUEUE-8, R-WORK-QUEUE-9), and an import holds
 *   no claim (P4 T18 settles a file-side close).
 * - A unit leaves the file while it has a live claim, or while the store holds
 *   something the file cannot show. Deleting it would lose that silently.
 * - A unit leaves the file while a unit in a waiting file depends on it.
 */
function importGuardReasons(plan: PlannedFile, storeUnits: readonly WorkUnitRecord[], claims: Map<string, LiveClaim>, blockedPaths: Set<string>): string[] {
  const reasons: string[] = [];
  const parsed = new Map(plan.document.units.map((unit) => [unit.coordinate, unit]));
  const held = (claim: LiveClaim) => `${claim.claimant} holds it on a live claim until ${claim.expiresAt}`;
  for (const unit of plan.document.units) {
    const current = plan.existing.get(unit.coordinate) ?? null;
    if (!current || current.status === "closed") continue;
    const claim = claims.get(current.storeId);
    if (!claim) continue;
    if (mergedStatus(unit, current, plan.base.get(unit.coordinate) ?? null).status === "closed") {
      reasons.push(`The file closes ${unit.coordinate}, and ${held(claim)}. Only the claim holder closes a claimed unit.`);
    }
  }
  for (const [coordinate, unit] of plan.existing) {
    if (parsed.has(coordinate)) continue;
    const claim = claims.get(unit.storeId);
    if (claim) reasons.push(`${coordinate} left the file, and ${held(claim)}.`);
    const storeOnly = storeOnlyData(unit);
    if (storeOnly.length > 0) reasons.push(`${coordinate} left the file, and the store holds what the file cannot show: ${storeOnly.join(", ")}.`);
    for (const dependent of storeUnits) {
      if (!dependent.sourcePath || !blockedPaths.has(dependent.sourcePath)) continue;
      if (dependent.dependencies.some((dependency) => dependency.dependsOnStoreId === unit.storeId)) {
        reasons.push(`${coordinate} left the file, and ${dependent.coordinate} in ${dependent.sourcePath} depends on it while that file waits for a person.`);
      }
    }
  }
  return reasons;
}

/* ------------------------------------------------------------------------ */
/* Summary                                                                  */
/* ------------------------------------------------------------------------ */

function plural(count: number, word: string): string {
  if (count === 1) return `1 ${word}`;
  return word.endsWith("y") ? `${count} ${word.slice(0, -1)}ies` : `${count} ${word}s`;
}

function summarize(report: WorkSyncReport): string {
  const imported = report.files.filter((file) => file.action === "imported").length;
  const units = report.import.records.reduce((sum, record) => sum + record.units.length, 0);
  const lines: string[] = [];
  if (report.firstImport) {
    lines.push(`First sync of this checkout: ${plural(imported, "work file")} and ${plural(units, "unit")} entered the store. Make Docs wrote and removed no project file.`);
    if (report.deferred.write.length > 0) {
      lines.push(`The store holds work that this checkout's files do not show. The next sync writes ${plural(report.deferred.write.length, "file")}: ${report.deferred.write.join(", ")}.`);
    }
    if (report.deferred.remove.length > 0) {
      lines.push(`Copies are off. The next sync removes ${plural(report.deferred.remove.length, "unchanged copy")}: ${report.deferred.remove.join(", ")}.`);
    }
  } else {
    lines.push(`Sync: ${plural(imported, "file")} imported, ${plural(report.written.length, "file")} written, ${plural(report.removed.length, "copy")} removed.`);
    if (report.written.length > 0) lines.push(`Wrote: ${report.written.join(", ")}.`);
    if (report.removed.length > 0) lines.push(`Removed: ${report.removed.join(", ")}.`);
  }
  const adopted = report.files.filter((file) => file.action === "adopted").length;
  if (adopted > 0) lines.push(`${plural(adopted, "file")} already matched the store, so Make Docs recorded ${adopted === 1 ? "it" : "them"} as synced.`);
  if (report.moved.length > 0) lines.push(`${plural(report.moved.length, "file")} moved: ${report.moved.map((move) => `${move.from} to ${move.to}`).join("; ")}.`);
  if (report.deleted.length > 0) {
    lines.push(`Deleted ${plural(report.deleted.length, "unit")} that left ${report.deleted.length === 1 ? "its file" : "their files"}: ${report.deleted.map((entry) => `${entry.coordinate} (${entry.path})`).join(", ")}.`);
  }
  if (report.import.unresolvedDependencies.length > 0) {
    lines.push(`${plural(report.import.unresolvedDependencies.length, "dependency")} name no unit. Those units wait until the coordinate is fixed.`);
  }
  if (report.keptChangedCopies.length > 0) {
    lines.push(
      report.projection === "off"
        ? `Kept ${plural(report.keptChangedCopies.length, "changed copy")} in this sync: ${report.keptChangedCopies.join(", ")}. Copies are off, so Make Docs imported each edit, and a later sync removes the copy, because it then matches the store.`
        : `Kept ${plural(report.keptChangedCopies.length, "changed copy")}, because Make Docs never removes a copy that changed: ${report.keptChangedCopies.join(", ")}.`,
    );
  }
  for (const hold of report.held) lines.push(`Held, not written: ${hold.path}. ${hold.reason}`);
  for (const failure of report.fileErrors) {
    lines.push(`Could not ${failure.operation} ${failure.path} (${failure.code}). The file and its store records stay as they were, and the next sync tries again.`);
  }
  if (report.notWritten.length > 0) lines.push(`${plural(report.notWritten.length, "file")} not written: ${report.notWritten.map((entry) => `${entry.path} (${entry.reason})`).join("; ")}`);
  for (const unreadable of report.unreadable) lines.push(`Cannot read ${unreadable.path}, line ${unreadable.line}: ${unreadable.message} The file is untouched.`);
  for (const conflict of report.conflicts) lines.push(formatWorkConflictReport(conflict));
  return lines.join("\n");
}
