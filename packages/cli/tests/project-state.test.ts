import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getManifestPath } from "../src/manifest";
import {
  CURRENT_STORE_SCHEMA_VERSION,
  PROJECT_STATE_TABLE_ROLES,
  PlaybookRunExistsError,
  PlaybookRunNotFoundError,
  STORE_MIGRATIONS,
  bootstrapGlobalStore,
  createPlaybookRunRecord,
  listPlaybookRunRecords,
  listProjectRegistryEntries,
  listWaveEvidence,
  loadSqliteDriver,
  mirrorProjectManifest,
  readAuthoritativeInstallRecord,
  readPlaybookRunRecord,
  readProjectRegistryEntry,
  readUserVersion,
  readWorkItemEvidence,
  rebuildProjectRegistry,
  recordWorkEvidence,
  transitionPlaybookRunRecord,
  upsertProjectRegistryEntry,
  withStoreDatabase,
  type WorkItemIdentity,
} from "../src/store";
import { cleanupTempDir, createTempDir, writeMinimalManifest } from "./helpers";

const sqliteAvailable = loadSqliteDriver().available;

describe.skipIf(!sqliteAvailable)("unified project-state model (W18 R10 P3)", () => {
  let storeRoot: string;

  beforeEach(() => {
    storeRoot = path.join(createTempDir("make-docs-project-state-"), "store");
    bootstrapGlobalStore({
      storeRoot,
      packageMeta: { name: "make-docs-test", version: "0.0.0-test" },
    });
  });

  afterEach(() => {
    cleanupTempDir(path.dirname(storeRoot));
  });

  describe("stage 1: one model, two facets, one migration path (R-PS-1, R-PS-2)", () => {
    it("holds both facets in one database behind one schema version and one migration list", () => {
      // One append-only migration list covers every project-state table:
      // there is no second store or parallel migration path for either facet.
      const allStatements = STORE_MIGRATIONS.flatMap((migration) => migration.statements).join("\n");
      expect(allStatements).toContain("CREATE TABLE playbook_runs");
      expect(allStatements).toContain("CREATE TABLE work_evidence");
      expect(allStatements).toContain("CREATE TABLE projects");

      withStoreDatabase(storeRoot, (db) => {
        expect(readUserVersion(db)).toBe(CURRENT_STORE_SCHEMA_VERSION);
        const tables = (
          db
            .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
            .all() as Array<{ name: string }>
        ).map((row) => row.name);
        expect(tables).toEqual(expect.arrayContaining(["playbook_runs", "projects", "work_evidence"]));

        // Both facets are keyed by the same project identifier and share the model.
        createPlaybookRunRecord(db, {
          projectId: "proj-shared",
          runId: "run-1",
          record: { anything: "the runner wants" },
        });
        recordWorkEvidence(db, {
          projectId: "proj-shared",
          identity: {
            repoRoot: "/tmp/proj-shared",
            waveSlug: "w18-r10",
            phasePath: "docs/work/w18-r10/03-phase.md",
          },
          evidenceKind: "validation",
          payload: { status: "passed" },
        });
        expect(readPlaybookRunRecord(db, "proj-shared", "run-1")).not.toBeNull();
        expect(listWaveEvidence(db, { projectId: "proj-shared", waveSlug: "w18-r10" })).toHaveLength(1);
      });
    });

    it("encodes the mirror-versus-relocated distinction in the model (R-MIR-2)", () => {
      expect(PROJECT_STATE_TABLE_ROLES).toEqual({
        projects: "mirror",
        playbook_runs: "relocated-canonical",
        work_evidence: "relocated-canonical",
      });
    });
  });

  describe("stage 1: run-state facet seam (R-STORE-1/R-STORE-2 of PRD 35)", () => {
    const projectId = "proj-runs";

    it("creates, reads, and transitions records keyed by (project_id, run_id) with opaque records", () => {
      // The record content is entirely the W18 R7 runner's vocabulary; the
      // seam stores and returns it verbatim without interpreting any field.
      const opaque = {
        madeUpField: true,
        cursor: { step: "s3" },
        nested: [1, "two", { three: 3 }],
      };
      withStoreDatabase(storeRoot, (db) => {
        createPlaybookRunRecord(db, { projectId, runId: "run-1", record: opaque });
        const created = readPlaybookRunRecord(db, projectId, "run-1");
        expect(created?.record).toEqual(opaque);

        transitionPlaybookRunRecord(db, {
          projectId,
          runId: "run-1",
          record: { ...opaque, cursor: { step: "s4" } },
          now: "2026-07-01T12:00:00.000Z",
        });
        const transitioned = readPlaybookRunRecord(db, projectId, "run-1");
        expect(transitioned?.record).toEqual({ ...opaque, cursor: { step: "s4" } });
        expect(transitioned?.createdAt).toBe(created?.createdAt);
        expect(transitioned?.updatedAt).toBe("2026-07-01T12:00:00.000Z");

        createPlaybookRunRecord(db, { projectId, runId: "run-2", record: {} });
        expect(listPlaybookRunRecords(db, projectId).map((row) => row.runId)).toEqual([
          "run-1",
          "run-2",
        ]);
      });
    });

    it("fails explicitly on create-collision and transition-of-missing-run", () => {
      withStoreDatabase(storeRoot, (db) => {
        createPlaybookRunRecord(db, { projectId, runId: "run-1", record: {} });
        expect(() =>
          createPlaybookRunRecord(db, { projectId, runId: "run-1", record: {} }),
        ).toThrow(PlaybookRunExistsError);
        expect(() =>
          transitionPlaybookRunRecord(db, { projectId, runId: "missing", record: {} }),
        ).toThrow(PlaybookRunNotFoundError);
        // Same run id under another project is a different row (project-keyed).
        createPlaybookRunRecord(db, { projectId: "proj-other", runId: "run-1", record: { other: true } });
        expect(readPlaybookRunRecord(db, "proj-other", "run-1")?.record).toEqual({ other: true });
      });
    });
  });

  describe("stage 2: evidence keyed to canonical work-item identity (R-PS-3)", () => {
    it("stores the caller-supplied identity tuple verbatim and never re-derives it", () => {
      // A deliberately non-derivable identity: nothing on disk corresponds to
      // it, proving the store records against what the resolver supplied.
      const identity: WorkItemIdentity = {
        repoRoot: "/nowhere/that/exists",
        waveSlug: "2099-01-01-w99-r9-fictional",
        phasePath: "docs/work/2099-01-01-w99-r9-fictional/07-fictional.md",
      };
      withStoreDatabase(storeRoot, (db) => {
        recordWorkEvidence(db, {
          projectId: "proj-evidence",
          identity,
          evidenceKind: "review",
          payload: { status: "waived" },
        });
        const rows = readWorkItemEvidence(db, {
          projectId: "proj-evidence",
          identity,
        });
        expect(rows).toHaveLength(1);
        expect(rows[0]).toEqual(
          expect.objectContaining({
            projectId: "proj-evidence",
            waveSlug: identity.waveSlug,
            phasePath: identity.phasePath,
            evidenceKind: "review",
            payload: { status: "waived" },
            // Repo root is secondary metadata, never part of the key (R-ID-2).
            repoRoot: identity.repoRoot,
          }),
        );
      });
    });
  });

  describe("stage 3: install registry as subordinate mirror (R-MIR-1)", () => {
    let projectDir: string;
    let projectId: string;

    beforeEach(() => {
      projectDir = createTempDir("make-docs-mirror-project-");
      projectId = writeMinimalManifest(projectDir);
    });

    afterEach(() => {
      cleanupTempDir(projectDir);
    });

    it("mirrors a project's manifest into the registry and skips projects without resolvable identity", () => {
      const bareDir = createTempDir("make-docs-mirror-bare-");
      try {
        withStoreDatabase(storeRoot, (db) => {
          const mirrored = mirrorProjectManifest(db, { repoRoot: projectDir });
          expect(mirrored.status).toBe("mirrored");
          expect(mirrored.projectId).toBe(projectId);

          const entry = readProjectRegistryEntry(db, projectId);
          expect(entry).toEqual(
            expect.objectContaining({
              projectId,
              rootPath: path.resolve(projectDir),
              packageName: "make-docs-test",
              packageVersion: "0.0.0-test",
            }),
          );

          const skipped = mirrorProjectManifest(db, { repoRoot: bareDir });
          expect(skipped.status).toBe("skipped");
          expect(skipped.reason).toContain("no .make-docs/manifest.json");
          expect(listProjectRegistryEntries(db).map((row) => row.projectId)).toEqual([projectId]);
        });
      } finally {
        cleanupTempDir(bareDir);
      }
    });

    it("authoritative reads resolve to the project manifest even when the mirror is stale", () => {
      withStoreDatabase(storeRoot, (db) => {
        // A stale mirror row claiming the wrong package version.
        upsertProjectRegistryEntry(db, {
          projectId,
          rootPath: path.resolve(projectDir),
          packageName: "make-docs-test",
          packageVersion: "9.9.9-stale-mirror",
        });
      });

      const authoritative = readAuthoritativeInstallRecord(projectDir);
      expect(authoritative?.manifestPath).toBe(getManifestPath(projectDir));
      expect(authoritative?.manifest.projectId).toBe(projectId);
      // The manifest wins; the stale mirror value never surfaces here.
      expect(authoritative?.manifest.packageVersion).toBe("0.0.0-test");

      // A directory without a manifest has no install record, whatever any
      // registry row might claim.
      const bareDir = createTempDir("make-docs-mirror-none-");
      try {
        expect(readAuthoritativeInstallRecord(bareDir)).toBeNull();
      } finally {
        cleanupTempDir(bareDir);
      }
    });

    it("rebuilds a stale or emptied registry from manifests without data loss, leaving relocated state untouched", () => {
      const otherDir = createTempDir("make-docs-mirror-other-");
      const otherId = writeMinimalManifest(otherDir);
      try {
        withStoreDatabase(storeRoot, (db) => {
          // Relocated-canonical rows that a registry rebuild must never touch.
          createPlaybookRunRecord(db, { projectId, runId: "run-1", record: { keep: true } });
          recordWorkEvidence(db, {
            projectId,
            identity: {
              repoRoot: path.resolve(projectDir),
              waveSlug: "w18-r10",
              phasePath: "docs/work/w18-r10/03-phase.md",
            },
            evidenceKind: "closeout",
            payload: { status: "passed" },
          });

          // A stale registry: wrong path for one project, plus a row for a
          // project that no longer exists anywhere.
          upsertProjectRegistryEntry(db, {
            projectId,
            rootPath: "/stale/old/location",
            packageVersion: "9.9.9-stale",
          });
          upsertProjectRegistryEntry(db, {
            projectId: "ghost-project",
            rootPath: "/gone",
          });

          const rebuilt = rebuildProjectRegistry(db, [projectDir, otherDir]);
          expect(rebuilt.mirrored.map((row) => row.projectId).sort()).toEqual(
            [projectId, otherId].sort(),
          );
          expect(rebuilt.skipped).toEqual([]);

          const entries = listProjectRegistryEntries(db);
          expect(entries.map((row) => row.projectId).sort()).toEqual([projectId, otherId].sort());
          expect(readProjectRegistryEntry(db, projectId)?.rootPath).toBe(path.resolve(projectDir));
          expect(readProjectRegistryEntry(db, projectId)?.packageVersion).toBe("0.0.0-test");
          expect(readProjectRegistryEntry(db, "ghost-project")).toBeNull();

          // Relocated-canonical facets survived the mirror rebuild intact.
          expect(readPlaybookRunRecord(db, projectId, "run-1")?.record).toEqual({ keep: true });
          expect(listWaveEvidence(db, { projectId, waveSlug: "w18-r10" })).toHaveLength(1);
        });
      } finally {
        cleanupTempDir(otherDir);
      }
    });

    it("mirror rows follow the manifest when it changes, because the manifest is canonical", () => {
      withStoreDatabase(storeRoot, (db) => {
        mirrorProjectManifest(db, { repoRoot: projectDir });
      });

      // The canonical record changes on disk...
      const manifestPath = getManifestPath(projectDir);
      const raw = JSON.parse(readFileSync(manifestPath, "utf8")) as Record<string, unknown>;
      raw.packageVersion = "0.0.1-test";
      writeFileSync(manifestPath, `${JSON.stringify(raw, null, 2)}\n`);

      // ...and the next mirror upsert reflects it, same identifier.
      withStoreDatabase(storeRoot, (db) => {
        mirrorProjectManifest(db, { repoRoot: projectDir });
        expect(readProjectRegistryEntry(db, projectId)?.packageVersion).toBe("0.0.1-test");
      });
    });
  });
});
