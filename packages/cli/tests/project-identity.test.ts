import { cpSync, existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
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
import { parse, stringify } from "yaml";
import { importLegacyInstallationState, previewLegacyInstallationState } from "../src/store/legacy-installation";
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

function readConfig(targetDir: string): Record<string, unknown> {
  return parse(readFileSync(path.join(targetDir, ".make-docs/config.yaml"), "utf8"));
}

/** Build a distinct unregistered legacy checkout; never corrupt a current ledger. */
async function createPreIdentifierLegacy(targetDir: string): Promise<void> {
  const source = createTempDir("make-docs-legacy-identity-source-");
  try {
    const raw = { ...await installTarget(source) } as Record<string, unknown>;
    cpSync(source, targetDir, { recursive: true, filter: file => !file.includes(`${path.sep}.make-docs${path.sep}backup`) });
    rmSync(path.join(targetDir, ".make-docs/config.yaml"), { force: true });
    delete raw.projectId;
    raw.schemaVersion = 3;
    writeFileSync(getManifestPath(targetDir), `${JSON.stringify(raw, null, 2)}\n`);
  } finally { cleanupTempDir(source); }
}

describe("stable project identity minting (W18 R10 P2, R-ID-1)", () => {
  let targetDir: string;

  beforeEach(() => {
    targetDir = createTempDir("make-docs-identity-");
  });

  afterEach(() => {
    cleanupTempDir(targetDir);
  });

  it("mints a project identifier on fresh setup and persists its declaration in config and applied records in the Store", async () => {
    const manifest = await installTarget(targetDir);

    expect(manifest.projectId).toMatch(UUID_V4_RE);
    expect(readConfig(targetDir).projectId).toBe(manifest.projectId);
    expect(existsSync(getManifestPath(targetDir))).toBe(false);
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

  it("mintProjectId produces v4 UUIDs", () => {
    const minted = mintProjectId();
    expect(minted).toMatch(UUID_V4_RE);
    expect(mintProjectId()).not.toBe(minted);
  });

  it("imports pre-identifier legacy records explicitly and preserves the minted declaration", async () => {
    await createPreIdentifierLegacy(targetDir);
    expect(loadManifest(targetDir)).toBeNull();
    expect(previewLegacyInstallationState(targetDir).manifest?.projectId).toBeUndefined();
    expect(existsSync(getManifestPath(targetDir))).toBe(true);
    importLegacyInstallationState(targetDir);
    const migrated = loadManifest(targetDir)!;
    expect(migrated.projectId).toMatch(UUID_V4_RE);
    expect(readConfig(targetDir).projectId).toBe(migrated.projectId);
    expect(existsSync(getManifestPath(targetDir))).toBe(false);
    const resynced = await installTarget(targetDir);
    expect(resynced.projectId).toBe(migrated.projectId);
  });

  it("rejects a malformed identifier with an explicit diagnostic instead of silently rewriting it", async () => {
    await installTarget(targetDir);
    const config = readConfig(targetDir);
    config.projectId = 42;
    writeFileSync(path.join(targetDir, ".make-docs/config.yaml"), stringify(config));
    expect(() => loadManifest(targetDir)).toThrow(/invalid projectId/);
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

  it("audit does not infer legacy ownership; backup follows verified legacy transfer", async () => {
    await createPreIdentifierLegacy(targetDir);
    expect(loadManifest(targetDir)).toBeNull();
    importLegacyInstallationState(targetDir);
    await auditWorks();

    const { runBackupCommand } = await import("../src/backup");
    await runBackupCommand({ targetDir, permissions: "allow-all" });

    expect(existsSync(path.join(targetDir, ".make-docs", "backup"))).toBe(true);
    expect(loadManifest(targetDir)?.projectId).toBe(readConfig(targetDir).projectId);
    expect(existsSync(getManifestPath(targetDir))).toBe(false);
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

  it("project removal follows verified legacy transfer and keeps unmanaged files", async () => {
    await createPreIdentifierLegacy(targetDir);
    importLegacyInstallationState(targetDir);
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

  it("resolves the declared project identifier for an installed project", async () => {
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

  it("does not derive current identity from an unimported legacy manifest", async () => {
    const projectDir = path.join(baseDir, "pre-identifier");
    mkdirSync(projectDir, { recursive: true });
    await createPreIdentifierLegacy(projectDir);
    expect(resolveProjectIdentity(projectDir).status).toBe("no-manifest");
    expect(previewLegacyInstallationState(projectDir).manifest).not.toBeNull();
  });

  it("reports unreadable with a reason for malformed declarative config", async () => {
    const projectDir = path.join(baseDir, "broken");
    mkdirSync(projectDir, { recursive: true });
    await installTarget(projectDir);
    writeFileSync(path.join(projectDir, ".make-docs/config.yaml"), "projectId: [\n");

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

      // Simulated directory move: the path changes, the declarative config travels.
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

    it("a simulated clone carries the same identity because the declarative config travels with the tree", async () => {
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
      // A portable declaration does not carry installation ownership to a clone.
      expect(loadManifest(cloneDir)).toBeNull();
    });
  },
);
