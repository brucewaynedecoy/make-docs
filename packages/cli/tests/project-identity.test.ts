import { cpSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createAuditReport } from "../src/audit";
import { getManifestPath, loadManifest, mintProjectId } from "../src/manifest";
import {
  listWorkEvidence,
  loadSqliteDriver,
  readPlaybookRunRecord,
  readProjectRegistryEntry,
  resolveProjectIdentity,
  upsertPlaybookRunRecord,
  upsertProjectRegistryEntry,
  upsertWorkEvidence,
  withStoreDatabase,
} from "../src/store";
import type { InstallManifest } from "../src/types";
import {
  cleanupTempDir,
  createTempDir,
  installMakeDocsTarget,
  type TestInstallSelections,
} from "./helpers";

const sqliteAvailable = loadSqliteDriver().available;

const UUID_V4_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function withoutSkills(selections: TestInstallSelections): void {
  selections.skills = false;
  selections.selectedSkills = [];
}

async function installTarget(targetDir: string): Promise<InstallManifest> {
  await installMakeDocsTarget(targetDir, withoutSkills);
  const manifest = loadManifest(targetDir);
  if (!manifest) {
    throw new Error("install did not produce a manifest");
  }
  return manifest;
}

function readRawManifest(targetDir: string): Record<string, unknown> {
  return JSON.parse(readFileSync(getManifestPath(targetDir), "utf8")) as Record<
    string,
    unknown
  >;
}

function writeRawManifest(targetDir: string, manifest: Record<string, unknown>): void {
  writeFileSync(getManifestPath(targetDir), `${JSON.stringify(manifest, null, 2)}\n`);
}

/** Rewrites the on-disk manifest to the pre-identifier shape (no projectId). */
function stripProjectId(targetDir: string): void {
  const raw = readRawManifest(targetDir);
  delete raw.projectId;
  writeRawManifest(targetDir, raw);
}

describe("stable project identity minting (W18 R10 P2, R-ID-1)", () => {
  let targetDir: string;

  beforeEach(() => {
    targetDir = createTempDir("make-docs-identity-");
  });

  afterEach(() => {
    cleanupTempDir(targetDir);
  });

  it("mints a project identifier on fresh setup and persists it in .make-docs/manifest.json", async () => {
    const manifest = await installTarget(targetDir);

    expect(manifest.projectId).toMatch(UUID_V4_RE);
    // The identifier is manifest-recorded, not held in memory only.
    expect(readRawManifest(targetDir).projectId).toBe(manifest.projectId);
  });

  it("never re-mints or changes an existing identifier on re-setup, sync, or reconfigure", async () => {
    const first = await installTarget(targetDir);

    // Bare sync (same selections, existing manifest).
    const second = await installTarget(targetDir);
    expect(second.projectId).toBe(first.projectId);

    // Reconfigure-shaped apply (changed selections, existing manifest).
    await installMakeDocsTarget(targetDir, (selections) => {
      withoutSkills(selections);
      selections.capabilities.work = false;
    });
    const third = loadManifest(targetDir);
    expect(third?.projectId).toBe(first.projectId);
  });

  it("mints distinct identifiers for distinct projects", async () => {
    const otherDir = createTempDir("make-docs-identity-other-");
    try {
      const first = await installTarget(targetDir);
      const second = await installTarget(otherDir);
      expect(first.projectId).not.toBe(second.projectId);
    } finally {
      cleanupTempDir(otherDir);
    }
  });

  it("mintProjectId produces manifest-shaped v4 UUIDs", () => {
    const minted = mintProjectId();
    expect(minted).toMatch(UUID_V4_RE);
    expect(mintProjectId()).not.toBe(minted);
  });

  it("loads pre-identifier manifests without rejecting them and migrates them on the next apply", async () => {
    await installTarget(targetDir);
    stripProjectId(targetDir);

    // Explicit compatibility handling: the pre-identifier manifest stays
    // fully loadable — never rejected — and simply has no identifier yet.
    const preIdentifier = loadManifest(targetDir);
    expect(preIdentifier).not.toBeNull();
    expect(preIdentifier?.projectId).toBeUndefined();

    // The next apply (bare sync) mints the identifier...
    const migrated = await installTarget(targetDir);
    expect(migrated.projectId).toMatch(UUID_V4_RE);

    // ...and later applies preserve it verbatim.
    const resynced = await installTarget(targetDir);
    expect(resynced.projectId).toBe(migrated.projectId);
  });

  it("rejects a malformed identifier with an explicit diagnostic instead of silently rewriting it", async () => {
    await installTarget(targetDir);
    const raw = readRawManifest(targetDir);
    raw.projectId = 42;
    writeRawManifest(targetDir, raw);

    expect(() => loadManifest(targetDir)).toThrow(/manifest\.projectId/);
  });
});

describe("PRD 05 lifecycle safety with and without the identifier (R-ID-1)", () => {
  let targetDir: string;
  let writeSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    targetDir = createTempDir("make-docs-identity-lifecycle-");
    writeSpy = vi
      .spyOn(process.stdout, "write")
      .mockImplementation(() => true) as ReturnType<typeof vi.spyOn>;
  });

  afterEach(() => {
    writeSpy.mockRestore();
    cleanupTempDir(targetDir);
  });

  async function auditWorks(): Promise<void> {
    const manifest = loadManifest(targetDir);
    const report = await createAuditReport({ targetDir, manifest });
    expect(report.removableFiles.length).toBeGreaterThan(0);
  }

  it("audit and backup work for manifests WITH an identifier and preserve it", async () => {
    const installed = await installTarget(targetDir);
    await auditWorks();

    const { runBackupCommand } = await import("../src/backup");
    await runBackupCommand({ targetDir, permissions: "allow-all" });

    expect(existsSync(path.join(targetDir, ".make-docs", "backup"))).toBe(true);
    // Backup is read-only for the manifest: the identifier is untouched.
    expect(loadManifest(targetDir)?.projectId).toBe(installed.projectId);
  });

  it("audit and backup work for pre-identifier manifests without minting or rejecting", async () => {
    await installTarget(targetDir);
    stripProjectId(targetDir);
    await auditWorks();

    const { runBackupCommand } = await import("../src/backup");
    await runBackupCommand({ targetDir, permissions: "allow-all" });

    expect(existsSync(path.join(targetDir, ".make-docs", "backup"))).toBe(true);
    // Lifecycle reads never mint: only an install apply may add the identifier.
    expect(loadManifest(targetDir)?.projectId).toBeUndefined();
  });

  it("uninstall works for manifests WITH an identifier and keeps unmanaged files", async () => {
    await installTarget(targetDir);
    const keepPath = path.join(targetDir, "keep.txt");
    writeFileSync(keepPath, "user content\n");

    const { runUninstallCommand } = await import("../src/uninstall");
    await runUninstallCommand({ targetDir, backup: false, permissions: "allow-all" });

    expect(existsSync(getManifestPath(targetDir))).toBe(false);
    expect(readFileSync(keepPath, "utf8")).toBe("user content\n");
  });

  it("uninstall works for pre-identifier manifests and keeps unmanaged files", async () => {
    await installTarget(targetDir);
    stripProjectId(targetDir);
    const keepPath = path.join(targetDir, "keep.txt");
    writeFileSync(keepPath, "user content\n");

    const { runUninstallCommand } = await import("../src/uninstall");
    await runUninstallCommand({ targetDir, backup: false, permissions: "allow-all" });

    expect(existsSync(getManifestPath(targetDir))).toBe(false);
    expect(readFileSync(keepPath, "utf8")).toBe("user content\n");
  });
});

describe("identity resolution seam (R-ID-2)", () => {
  let baseDir: string;

  beforeEach(() => {
    baseDir = createTempDir("make-docs-identity-resolve-");
  });

  afterEach(() => {
    cleanupTempDir(baseDir);
  });

  it("resolves the manifest-minted identifier for an installed project", async () => {
    const projectDir = path.join(baseDir, "project");
    mkdirSync(projectDir, { recursive: true });
    const manifest = await installTarget(projectDir);

    const resolution = resolveProjectIdentity(projectDir);
    expect(resolution.status).toBe("resolved");
    if (resolution.status === "resolved") {
      expect(resolution.projectId).toBe(manifest.projectId);
      // Path is secondary metadata, reported but never identity.
      expect(resolution.rootPath).toBe(path.resolve(projectDir));
    }
  });

  it("reports no-manifest for a directory without a Make Docs install", () => {
    const emptyDir = path.join(baseDir, "empty");
    mkdirSync(emptyDir, { recursive: true });
    expect(resolveProjectIdentity(emptyDir).status).toBe("no-manifest");
  });

  it("reports unminted for a valid pre-identifier manifest instead of erroring or deriving from path", async () => {
    const projectDir = path.join(baseDir, "pre-identifier");
    mkdirSync(projectDir, { recursive: true });
    await installTarget(projectDir);
    stripProjectId(projectDir);

    expect(resolveProjectIdentity(projectDir).status).toBe("unminted");
  });

  it("reports unreadable with a reason for a malformed manifest", async () => {
    const projectDir = path.join(baseDir, "broken");
    mkdirSync(projectDir, { recursive: true });
    await installTarget(projectDir);
    writeFileSync(getManifestPath(projectDir), "{ not json\n");

    const resolution = resolveProjectIdentity(projectDir);
    expect(resolution.status).toBe("unreadable");
    if (resolution.status === "unreadable") {
      expect(resolution.reason.length).toBeGreaterThan(0);
    }
  });
});

describe.skipIf(!sqliteAvailable)(
  "project-scoped state survives moves and clones because rows key by identifier (feeds R-TEST-2)",
  () => {
    let baseDir: string;
    let storeRoot: string;

    beforeEach(() => {
      baseDir = createTempDir("make-docs-identity-move-");
      storeRoot = path.join(baseDir, "store-root");
    });

    afterEach(() => {
      cleanupTempDir(baseDir);
    });

    it("state written before a directory move is fully readable after it via the re-resolved identifier", async () => {
      const originalDir = path.join(baseDir, "project-original");
      mkdirSync(originalDir, { recursive: true });
      const manifest = await installTarget(originalDir);
      const projectId = manifest.projectId;
      expect(projectId).toBeDefined();
      if (!projectId) {
        return;
      }

      // Write all three project-scoped row kinds keyed by the identifier,
      // with the (soon stale) path recorded only as secondary metadata.
      withStoreDatabase(storeRoot, (db) => {
        upsertProjectRegistryEntry(db, {
          projectId,
          rootPath: path.resolve(originalDir),
          packageName: "make-docs-test",
          packageVersion: "0.0.0-test",
        });
        upsertPlaybookRunRecord(db, {
          projectId,
          runId: "run-1",
          record: { status: "in-progress", coordinate: "W18 R10 P2" },
        });
        upsertWorkEvidence(db, {
          projectId,
          waveSlug: "2026-07-01-w18-r10-global-store-and-project-state",
          phasePath: "docs/work/2026-07-01-w18-r10-global-store-and-project-state/02-stable-project-identity-and-manifest-minting.md",
          evidenceKind: "validation-passed",
          payload: { approvedBy: "test" },
          repoRoot: path.resolve(originalDir),
        });
      });

      // Simulated directory move: the path changes, the manifest travels.
      const movedDir = path.join(baseDir, "project-moved");
      renameSync(originalDir, movedDir);

      const resolution = resolveProjectIdentity(movedDir);
      expect(resolution.status).toBe("resolved");
      if (resolution.status !== "resolved") {
        return;
      }
      expect(resolution.projectId).toBe(projectId);
      expect(resolution.rootPath).not.toBe(path.resolve(originalDir));

      // Every row written before the move is readable after it, because the
      // key never contained the path.
      withStoreDatabase(storeRoot, (db) => {
        const registry = readProjectRegistryEntry(db, resolution.projectId);
        expect(registry?.projectId).toBe(projectId);

        const run = readPlaybookRunRecord(db, resolution.projectId, "run-1");
        expect(run?.record).toEqual({ status: "in-progress", coordinate: "W18 R10 P2" });

        const evidence = listWorkEvidence(db, { projectId: resolution.projectId });
        expect(evidence).toHaveLength(1);
        expect(evidence[0]?.evidenceKind).toBe("validation-passed");

        // Refreshing the mirror's secondary path metadata does not change
        // the key: same identifier, new root_path.
        upsertProjectRegistryEntry(db, {
          projectId: resolution.projectId,
          rootPath: resolution.rootPath,
        });
        const refreshed = readProjectRegistryEntry(db, resolution.projectId);
        expect(refreshed?.projectId).toBe(projectId);
        expect(refreshed?.rootPath).toBe(path.resolve(movedDir));
      });
    });

    it("a simulated clone carries the same identity because the manifest travels with the tree", async () => {
      const sourceDir = path.join(baseDir, "project-source");
      mkdirSync(sourceDir, { recursive: true });
      const manifest = await installTarget(sourceDir);

      const cloneDir = path.join(baseDir, "project-clone");
      cpSync(sourceDir, cloneDir, { recursive: true });

      const resolution = resolveProjectIdentity(cloneDir);
      expect(resolution.status).toBe("resolved");
      if (resolution.status === "resolved") {
        expect(resolution.projectId).toBe(manifest.projectId);
      }
    });
  },
);
