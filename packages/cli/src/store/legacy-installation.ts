import { createHash } from "node:crypto";
import { existsSync, lstatSync, readFileSync, readdirSync, realpathSync, rmdirSync, unlinkSync } from "node:fs";
import path from "node:path";
import { MANIFEST_RELATIVE_PATH, validateAndMigrateManifest } from "../manifest";
import type { InstallManifest } from "../types";
import { assertManagedPathHasNoSymlinks } from "../utils";
import { acquireInstallationLock, releaseInstallationLock, assertInstallationLockActive, type InstallationLock, importInstallationState, readMigrationState, listMigrationState } from "./installation-state";

export interface LegacyInstallationSource { relativePath: string; digest: string }
export interface LegacyInstallationRecord {
  kind: "receipt" | "quiescence" | "backup";
  id: string;
  value: unknown;
}
export interface LegacyInstallationPreview {
  manifest: InstallManifest | null;
  sources: LegacyInstallationSource[];
  records: LegacyInstallationRecord[];
  preservedFiles: string[];
  blockers: string[];
  recoveryRequired: boolean;
  minimumWriter: string;
}

const STATE = ".make-docs/state";
const digest = (value: string | Buffer) => createHash("sha256").update(value).digest("hex");
function stable(value: unknown): string {
  const sort = (v: unknown): unknown => Array.isArray(v) ? v.map(sort) : v && typeof v === "object"
    ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([k, x]) => [k, sort(x)])) : v;
  return JSON.stringify(sort(value));
}
function object(value: unknown): Record<string, any> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Expected an object");
  return value as Record<string, any>;
}
function exactKeys(value: Record<string, any>, allowed: readonly string[]): void {
  if (Object.keys(value).some(key => !allowed.includes(key))) throw new Error("Unsupported fields in legacy metadata");
}
function safeRelative(value: unknown): string {
  if (typeof value !== "string" || !value || value.includes("\\") || value.includes("\0") ||
      path.posix.isAbsolute(value) || /^[a-z]:/i.test(value) || path.posix.normalize(value) !== value ||
      value.split("/").some(x => x === "." || x === ".." || !x)) throw new Error("Unsafe source path");
  return value;
}
function safeFile(root: string, relativePath: string): Buffer {
  safeRelative(relativePath);
  assertManagedPathHasNoSymlinks(root, relativePath);
  const absolute = path.join(root, relativePath);
  if (!lstatSync(absolute).isFile()) throw new Error(`Not a regular file: ${relativePath}`);
  return readFileSync(absolute);
}

/** Read-only inventory. Unrecognized inputs block transfer and remain untouched. */
export function previewLegacyInstallationState(projectRoot: string): LegacyInstallationPreview {
  const result: LegacyInstallationPreview = {
    manifest: null, sources: [], records: [], preservedFiles: [], blockers: [], recoveryRequired: false,
    minimumWriter: "Store installation contract 1 (W19 R3) or newer; obsolete CLI writers are unsupported after transfer.",
  };
  if (!existsSync(projectRoot)) return result;
  const root = realpathSync(projectRoot);
  const read = (relativePath: string): Record<string, any> => {
    const bytes = safeFile(root, relativePath);
    const value = object(JSON.parse(bytes.toString("utf8")));
    result.sources.push({ relativePath, digest: digest(bytes) });
    return value;
  };
  if (existsSync(path.join(root, MANIFEST_RELATIVE_PATH))) {
    try { result.manifest = validateAndMigrateManifest(read(MANIFEST_RELATIVE_PATH), path.join(root, MANIFEST_RELATIVE_PATH)); }
    catch (error) { result.blockers.push(`Legacy manifest: ${String(error)}`); }
  }
  const receipts: Record<string, any>[] = [];
  const preserveFinderMetadata = (relativePath: string): void => {
    assertManagedPathHasNoSymlinks(root, relativePath);
    if (!lstatSync(path.join(root, relativePath)).isFile()) throw new Error(`Not a regular Finder metadata file: ${relativePath}`);
    result.preservedFiles.push(relativePath);
  };
  let barrier: Record<string, any> | undefined;
  if (existsSync(path.join(root, STATE))) {
    try {
      assertManagedPathHasNoSymlinks(root, STATE);
      for (const name of readdirSync(path.join(root, STATE)).sort()) {
        const relative = `${STATE}/${name}`;
        if (name === ".DS_Store") {
          preserveFinderMetadata(relative);
        } else if (name === "migration.lock.json" || name === "legacy-writers") {
          // A lease file has no reliable liveness proof. Never remove it on age alone.
          if (name !== "legacy-writers" || !lstatSync(path.join(root, relative)).isDirectory() || readdirSync(path.join(root, relative)).length) {
            result.blockers.push(`An obsolete writer needs review: ${relative}`);
          }
        } else if (name === "legacy-quiescence.json") {
          barrier = read(relative);
          exactKeys(barrier,["schemaVersion","status","lockTokenDigest","snapshotId","activatedAt","legacyOperations"]);
          if (barrier.schemaVersion !== 1 || barrier.status !== "active" ||
              typeof barrier.snapshotId !== "string" || !/^sha256:[a-f0-9]{64}$/.test(barrier.snapshotId) ||
              !/^[a-f0-9]{64}$/.test(barrier.lockTokenDigest) || !Array.isArray(barrier.legacyOperations) ||
              !barrier.legacyOperations.every((x: unknown) => typeof x === "string")) throw new Error("Invalid legacy quiescence record");
        } else if (name === "migration-receipts") {
          assertManagedPathHasNoSymlinks(root, relative);
          for (const file of readdirSync(path.join(root, relative)).sort()) {
            if (file === ".DS_Store") { preserveFinderMetadata(`${relative}/${file}`); continue; }
            if (!/^[a-f0-9]{64}\.json$/.test(file)) throw new Error(`Unknown receipt file: ${file}`);
            const receipt = read(`${relative}/${file}`);
            exactKeys(receipt,["schemaVersion","receiptId","status","checkpoint","snapshotId","lockTokenDigest","createdAt","code","message","rollback","claims"]);
            exactKeys(object(receipt.rollback),["attempted","completed","restoredPaths","unrestoredPaths"]);
            exactKeys(object(receipt.claims),["validated","accepted","downstreamAuthorized","released"]);
            const { schemaVersion, receiptId, claims, ...subject } = receipt;
            if (schemaVersion !== 1 || receiptId !== `sha256:${file.slice(0, -5)}` ||
                receiptId !== `sha256:${digest(stable(subject))}` ||
                !/^sha256:[a-f0-9]{64}$/.test(receipt.snapshotId) ||
                !/^[a-f0-9]{64}$/.test(receipt.lockTokenDigest) ||
                !Number.isInteger(receipt.checkpoint) || receipt.checkpoint < 0 || receipt.checkpoint > 13 ||
                !["completed", "paused", "blocked", "failed", "rollback-required"].includes(receipt.status) ||
                !claims || Object.keys(claims).length !== 4 || Object.values(claims).some(x => x !== false)) throw new Error(`Invalid receipt: ${file}`);
            receipts.push(receipt);
          }
        } else result.blockers.push(`Unknown legacy state remains: ${relative}`);
      }
    } catch (error) { result.blockers.push(String(error)); }
  }
  const snapshots = new Set(receipts.map(x => x.snapshotId));
  const backed = new Set<string>();
  const backupRoot = path.join(root, ".make-docs/backup");
  if (snapshots.size && existsSync(backupRoot)) {
    try {
      assertManagedPathHasNoSymlinks(root, ".make-docs/backup");
      for (const name of readdirSync(backupRoot).sort()) {
        const relative = `.make-docs/backup/${name}/backup-manifest.json`;
        if (!existsSync(path.join(root, relative))) continue;
        const bytes = safeFile(root, relative);
        const backup = object(JSON.parse(bytes.toString("utf8")));
        if (!snapshots.has(backup.snapshotId)) continue;
        exactKeys(backup,["schemaVersion","backupId","snapshotId","projectRoot","repository","classification","createdAt","entries"]);
        exactKeys(object(backup.repository),["projectRootDigest","projectId","manifestSchemaVersion","manifestDigest"]);
        if (backup.schemaVersion !== 1 || backup.backupId !== name || backup.projectRoot !== root ||
            !Array.isArray(backup.entries) || !backup.repository || backup.repository.projectRootDigest !== digest(root) ||
            (result.manifest?.projectId && backup.repository.projectId && backup.repository.projectId !== result.manifest.projectId)) throw new Error(`Invalid linked backup: ${relative}`);
        const seen = new Set<string>();
        for (const raw of backup.entries) {
          const entry = object(raw);
          exactKeys(entry,["relativePath","backupPath","original","copied","verified","restoreOrder"]);
          exactKeys(object(entry.original),["relativePath","ownership","disposition","reason","entryType","digest","mode","size","linkTarget"]);
          const rel = safeRelative(entry.relativePath);
          if (seen.has(rel) || entry.original?.relativePath !== rel || typeof entry.verified !== "boolean" || !entry.verified) throw new Error(`Invalid backup entry: ${rel}`);
          seen.add(rel);
          if (entry.copied) {
            if (entry.backupPath !== `files/${rel}` || !/^[a-f0-9]{64}$/.test(entry.original.digest)) throw new Error(`Invalid backup digest: ${rel}`);
            if (digest(safeFile(root, `.make-docs/backup/${name}/${entry.backupPath}`)) !== entry.original.digest) throw new Error(`Backup content changed: ${rel}`);
          } else if (entry.backupPath !== null) throw new Error(`Invalid backup reference: ${rel}`);
        }
        result.sources.push({ relativePath: relative, digest: digest(bytes) });
        result.records.push({ kind: "backup", id: name, value: backup });
        backed.add(backup.snapshotId);
      }
    } catch (error) { result.blockers.push(String(error)); }
  }
  for (const receipt of receipts) {
    if (!backed.has(receipt.snapshotId)) result.blockers.push(`Receipt has no verified backup link: ${receipt.receiptId}`);
    result.records.push({ kind: "receipt", id: receipt.receiptId, value: receipt });
  }
  if (barrier) {
    if (!receipts.some(r => r.snapshotId === barrier!.snapshotId && r.lockTokenDigest === barrier!.lockTokenDigest)) result.blockers.push("Quiescence has no matching receipt");
    result.records.push({ kind: "quiescence", id: "legacy", value: barrier });
  }
  // Preserve incomplete runs for explicit recovery; no operation replay during import.
  for (const snapshot of snapshots) {
    const group = receipts.filter(r => r.snapshotId === snapshot);
    if (!group.some(r => r.checkpoint === 11 && r.status === "completed") ||
        group.some(r => r.status !== "completed")) result.recoveryRequired = true;
  }
  return result;
}

/** Commit source evidence first, read it back, then remove only unchanged source files. */
export function importLegacyInstallationState(projectRoot: string, storeRoot?: string): LegacyInstallationPreview {
  // A prior commit can outlive cleanup. Reuse its exact source allowlist.
  const previous = listMigrationState<{sources: LegacyInstallationSource[]; recoveryRequired: boolean}>(projectRoot, "legacy-import", storeRoot);
  const unfinished = previous.filter(p => p.sources.some(source => existsSync(path.join(projectRoot, source.relativePath))));
  if (unfinished.length) {
    const lease = acquireInstallationLock(projectRoot, storeRoot);
    try {
      for (const receipt of unfinished) cleanupSources(projectRoot, receipt.sources, lease);
    } finally { releaseInstallationLock(lease); }
  }
  const preview = previewLegacyInstallationState(projectRoot);
  if (preview.blockers.length) throw new Error(`Legacy installation transfer blocked: ${preview.blockers.join("; ")}`);
  if (!preview.sources.length) return preview;
  const importId = `sha256:${digest(stable(preview.sources))}`;
  const lease = acquireInstallationLock(projectRoot, storeRoot);
  try {
  importInstallationState(projectRoot, {
    manifest: preview.manifest,
    records: preview.records,
    importId,
    sources: preview.sources,
    recoveryRequired: preview.recoveryRequired,
  }, storeRoot);
  const receipt = readMigrationState(projectRoot, "legacy-import", importId, storeRoot) as { sources?: LegacyInstallationSource[] } | null;
  if (!receipt || stable(receipt.sources) !== stable(preview.sources)) throw new Error("Legacy import read-back failed; all local inputs remain");
  for (const record of preview.records) {
    const imported = readMigrationState(projectRoot, record.kind, record.id, storeRoot);
    if (!imported || stable(imported) !== stable(record.value)) throw new Error(`Legacy record read-back differs: ${record.kind}/${record.id}; local inputs remain`);
  }
  cleanupSources(projectRoot, preview.sources, lease);
  } finally { releaseInstallationLock(lease); }
  return preview;
}

function cleanupSources(projectRoot: string, sources: LegacyInstallationSource[], lease: InstallationLock): void {
  assertInstallationLockActive(lease);
  const allowed = new Set(sources.map(s => s.relativePath));
  const state = path.join(projectRoot, STATE);
  if (existsSync(state)) {
    assertManagedPathHasNoSymlinks(projectRoot, STATE);
    for (const name of readdirSync(state)) {
      const rel = `${STATE}/${name}`;
      if (name === ".DS_Store") {
        assertManagedPathHasNoSymlinks(projectRoot, rel);
        if (!lstatSync(path.join(projectRoot,rel)).isFile()) throw new Error(`Not a regular Finder metadata file: ${rel}`);
      } else if (name === "migration-receipts" || name === "legacy-writers") {
        assertManagedPathHasNoSymlinks(projectRoot, rel);
        for (const child of readdirSync(path.join(projectRoot,rel))) {
          const childRelative = `${rel}/${child}`;
          if (name === "migration-receipts" && child === ".DS_Store") {
            assertManagedPathHasNoSymlinks(projectRoot, childRelative);
            if (!lstatSync(path.join(projectRoot,childRelative)).isFile()) throw new Error(`Not a regular Finder metadata file: ${childRelative}`);
          } else if (!allowed.has(childRelative)) throw new Error(`Unknown or active legacy state remains: ${childRelative}`);
        }
      } else if (!allowed.has(rel)) throw new Error(`Unknown or active legacy state remains: ${rel}`);
    }
  }
  const remaining = sources.filter(source => existsSync(path.join(projectRoot, source.relativePath)));
  // Precheck the entire set before the first delete; check again at each unlink.
  for (const source of remaining) if (digest(safeFile(projectRoot, source.relativePath)) !== source.digest) throw new Error(`Legacy source changed: ${source.relativePath}`);
  for (const source of remaining) {
    if (digest(safeFile(projectRoot, source.relativePath)) !== source.digest) throw new Error(`Legacy source changed: ${source.relativePath}`);
    assertInstallationLockActive(lease);
    unlinkSync(path.join(projectRoot, source.relativePath));
  }
  for (const rel of [`${STATE}/migration-receipts`, `${STATE}/legacy-writers`, STATE]) {
    const absolute = path.join(projectRoot, rel);
    if (existsSync(absolute)) {
      assertInstallationLockActive(lease);
      assertManagedPathHasNoSymlinks(projectRoot, rel);
      if (lstatSync(absolute).isDirectory() && readdirSync(absolute).length === 0) rmdirSync(absolute);
    }
  }
}
