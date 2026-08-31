import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildCheckpoint, buildPhaseGateReport, buildWaveStatus } from "../src/operations";
import {
  bootstrapGlobalStore,
  createPlaybookRunRecord,
  getStoreDatabasePath,
  listPlaybookRunRecords,
  listWorkEvidence,
  loadSqliteDriver,
  pruneProjectFromStore,
  readPlaybookRunRecord,
  readProjectRegistryEntry,
  readWorkItemEvidence,
  removeGlobalStore,
  resolveProjectIdentity,
  upsertProjectRegistryEntry,
  withStoreDatabase,
} from "../src/store";
import { cleanupTempDir, collectFiles, createTempDir, writeMinimalManifest } from "./helpers";

/**
 * The D11 verification suite (PRD 38, Verification and Testability): the four
 * R-TEST assertions of the W18 R10 global store, stated explicitly and in one
 * place. Each `describe` block below IS one R-TEST requirement.
 *
 * Deeper leg-by-leg coverage lives with the phases that landed each leg —
 * `store.test.ts` (bootstrap, database, recovery), `project-identity.test.ts`
 * (minting, move/clone identity), `project-state.test.ts` (the unified
 * model), `store-lifecycle.test.ts` (prune/remove and the full CLI uninstall
 * flow), and `operations.test.ts` (checkpoint evidence and the legacy
 * migration). This suite does not replace those; it proves the end-to-end
 * contract of each R-TEST requirement compactly through the real seams.
 */

const WAVE_SLUG = "2026-07-01-w18-r10-d11-verification";
const sqliteAvailable = loadSqliteDriver().available;

/** A minimal git repository with a manifest-minted identity and one wave phase. */
function createRepoFixture(parentDir: string, name: string): {
  root: string;
  projectId: string;
  waveDir: string;
  phasePath: string;
  phaseRelative: string;
} {
  const root = path.join(parentDir, name);
  mkdirSync(root, { recursive: true });
  execFileSync("git", ["init"], { cwd: root, stdio: "ignore" });
  const projectId = writeMinimalManifest(root);
  const phaseRelative = `docs/work/${WAVE_SLUG}/01-alpha.md`;
  const phasePath = path.join(root, phaseRelative);
  mkdirSync(path.dirname(phasePath), { recursive: true });
  writeFileSync(
    phasePath,
    ["# Phase 01: Alpha", "", "## Tasks", "", "- [ ] t1: Do the work.", ""].join("\n"),
    "utf8",
  );
  return { root, projectId, waveDir: path.dirname(phasePath), phasePath, phaseRelative };
}

describe.skipIf(!sqliteAvailable)("D11 verification suite (PRD 38 R-TEST-1..4)", () => {
  let workDir: string;
  let storeRoot: string;

  beforeEach(() => {
    workDir = createTempDir("make-docs-d11-");
    storeRoot = path.join(workDir, "store-root");
  });

  afterEach(() => {
    cleanupTempDir(workDir);
  });

  describe("R-TEST-1: run-state and work-execution evidence go to the global store, never a repository path", () => {
    it("writes both facets through the real seams and leaves the repository byte-for-byte untouched", () => {
      const fixture = createRepoFixture(workDir, "repo");
      bootstrapGlobalStore({ storeRoot });

      // Full repository snapshot BEFORE any state write.
      const filesBefore = collectFiles(fixture.root);

      // Work-execution evidence, via the real checkpoint operation.
      const checkpoint = buildCheckpoint({
        target: fixture.phasePath,
        validationStatus: "passed",
        reviewStatus: "waived",
        closeoutStatus: "passed",
        note: "d11 evidence",
        storeRoot,
      });
      expect(checkpoint.evidenceSource).toBe("global-store");

      // Playbook run-state, via the store seam the W18 R7 runner consumes.
      withStoreDatabase(storeRoot, (db) => {
        createPlaybookRunRecord(db, {
          projectId: fixture.projectId,
          runId: "d11-run",
          record: { status: "created" },
        });
      });

      // Both facets landed in the store...
      withStoreDatabase(storeRoot, (db) => {
        expect(readPlaybookRunRecord(db, fixture.projectId, "d11-run")).not.toBeNull();
        const evidence = listWorkEvidence(db, { projectId: fixture.projectId });
        expect(evidence.map((row) => row.evidenceKind).sort()).toEqual([
          "closeout",
          "notes",
          "review",
          "validation",
        ]);
      });

      // ...and NOT ONE new file exists anywhere under the repository: not
      // under `.make-docs/runs/**`, not anywhere else (R-BND-2, R-MIR-2).
      expect(collectFiles(fixture.root)).toEqual(filesBefore);
      expect(existsSync(path.join(fixture.root, ".make-docs", "runs"))).toBe(false);
      expect(existsSync(path.join(fixture.root, ".make-docs", "store.db"))).toBe(false);
    });
  });

  describe("R-TEST-2: project-scoped state survives a directory move or clone (identity, not path)", () => {
    it("state written before a move is fully readable after it via the manifest-minted identifier", () => {
      const fixture = createRepoFixture(workDir, "original");
      bootstrapGlobalStore({ storeRoot });

      buildCheckpoint({ target: fixture.phasePath, validationStatus: "passed", storeRoot });
      withStoreDatabase(storeRoot, (db) => {
        createPlaybookRunRecord(db, {
          projectId: fixture.projectId,
          runId: "run-before-move",
          record: { cursor: "s2" },
        });
      });

      // Simulated directory move: the path changes, the manifest travels.
      const movedRoot = path.join(workDir, "moved");
      renameSync(fixture.root, movedRoot);

      // Identity re-resolves to the SAME id from the new location.
      const identity = resolveProjectIdentity(movedRoot);
      expect(identity).toEqual(
        expect.objectContaining({ status: "resolved", projectId: fixture.projectId }),
      );

      // All pre-move state is fully readable, keyed by that identifier.
      withStoreDatabase(storeRoot, (db) => {
        expect(
          readPlaybookRunRecord(db, fixture.projectId, "run-before-move")?.record,
        ).toEqual({ cursor: "s2" });
        const rows = readWorkItemEvidence(db, {
          projectId: fixture.projectId,
          identity: { waveSlug: WAVE_SLUG, phasePath: fixture.phaseRelative },
        });
        expect(rows.length).toBeGreaterThan(0);
        // The stored repoRoot still names the OLD path — proving path is
        // secondary metadata and never the key (R-ID-2).
        expect(rows[0]?.repoRoot).toBe(fixture.root);
      });

      // And the real read operation surfaces the evidence at the new path.
      const gate = buildPhaseGateReport(path.join(movedRoot, fixture.phaseRelative), undefined, {
        storeRoot,
      });
      expect(gate.evidence).toEqual(
        expect.objectContaining({ validation: { status: "passed" } }),
      );
    });

    it("a clone carries the same identity and reads the same state", () => {
      const fixture = createRepoFixture(workDir, "origin-repo");
      bootstrapGlobalStore({ storeRoot });
      buildCheckpoint({ target: fixture.phasePath, closeoutStatus: "passed", storeRoot });

      const cloneRoot = path.join(workDir, "clone-repo");
      cpSync(fixture.root, cloneRoot, { recursive: true });

      expect(resolveProjectIdentity(cloneRoot)).toEqual(
        expect.objectContaining({ status: "resolved", projectId: fixture.projectId }),
      );
      const gate = buildPhaseGateReport(path.join(cloneRoot, fixture.phaseRelative), undefined, {
        storeRoot,
      });
      expect(gate.evidence).toEqual(
        expect.objectContaining({ closeout: { status: "passed" } }),
      );
    });
  });

  describe("R-TEST-3: a missing or unreadable store degrades gracefully", () => {
    it("keeps the repository readable and lets state be re-established after the database disappears", () => {
      const fixture = createRepoFixture(workDir, "repo");
      bootstrapGlobalStore({ storeRoot });
      buildCheckpoint({ target: fixture.phasePath, validationStatus: "passed", storeRoot });

      // The store database vanishes entirely.
      const databasePath = getStoreDatabasePath(storeRoot);
      rmSync(databasePath, { force: true });
      rmSync(`${databasePath}-wal`, { force: true });
      rmSync(`${databasePath}-shm`, { force: true });

      // Repository reads still work: the wave, phases, and identity all come
      // from the repository, not the store (R-DB-4, R-BND-1).
      const status = buildWaveStatus(fixture.waveDir, { storeRoot });
      expect(status.nextPhasePath).toBe(fixture.phasePath);
      expect(status.projectIdentity).toEqual(
        expect.objectContaining({ status: "resolved", projectId: fixture.projectId }),
      );

      // State can be re-established through the normal seams.
      bootstrapGlobalStore({ storeRoot });
      buildCheckpoint({ target: fixture.phasePath, validationStatus: "passed", storeRoot });
      const gate = buildPhaseGateReport(fixture.phasePath, undefined, { storeRoot });
      expect(gate.evidence).toEqual(
        expect.objectContaining({ validation: { status: "passed" } }),
      );
    });

    it("treats an unreadable database as recoverable operational-state loss, never blocking repository reads", () => {
      const fixture = createRepoFixture(workDir, "repo");
      bootstrapGlobalStore({ storeRoot });

      // Corrupt the database in place.
      const databasePath = getStoreDatabasePath(storeRoot);
      const corrupt = () => {
        rmSync(`${databasePath}-wal`, { force: true });
        rmSync(`${databasePath}-shm`, { force: true });
        writeFileSync(databasePath, "this is not a sqlite database", "utf8");
      };
      corrupt();

      // Bootstrap recovers explicitly — quarantine, recreate, report — and it
      // is never treated as loss of project knowledge (R-DB-4).
      const report = bootstrapGlobalStore({ storeRoot });
      expect(report.databaseStatus).toBe("recovered");
      expect(report.warnings.join("\n")).toContain("recoverable operational-state loss");
      expect(report.warnings.join("\n")).toContain("no project knowledge");

      // Corrupted again with no bootstrap in between, the read operation
      // neither throws nor loses the repository view.
      corrupt();
      const status = buildWaveStatus(fixture.waveDir, { storeRoot });
      expect(status.nextPhasePath).toBe(fixture.phasePath);

      // The recovered store is immediately usable for new state.
      buildCheckpoint({ target: fixture.phasePath, reviewStatus: "waived", storeRoot });
      withStoreDatabase(storeRoot, (db) => {
        expect(listWorkEvidence(db, { projectId: fixture.projectId })).toHaveLength(1);
      });
    });
  });

  describe("R-TEST-4: project removal prunes only the target project; store removal deletes no repository content", () => {
    function seedProject(projectId: string, rootPath: string, phaseRelative: string): void {
      withStoreDatabase(storeRoot, (db) => {
        upsertProjectRegistryEntry(db, { projectId, rootPath });
        createPlaybookRunRecord(db, {
          projectId,
          runId: `${projectId}-run`,
          record: { status: "created" },
        });
      });
      buildCheckpoint({
        target: path.join(rootPath, phaseRelative),
        validationStatus: "passed",
        storeRoot,
      });
    }

    it("prunes all rows for one project and leaves both repositories untouched", () => {
      const repoA = createRepoFixture(workDir, "repo-a");
      const repoB = createRepoFixture(workDir, "repo-b");
      bootstrapGlobalStore({ storeRoot });
      seedProject(repoA.projectId, repoA.root, repoA.phaseRelative);
      seedProject(repoB.projectId, repoB.root, repoB.phaseRelative);

      const filesABefore = collectFiles(repoA.root);
      const filesBBefore = collectFiles(repoB.root);

      // The `setup remove` seam: prune keyed by the manifest-minted id.
      const pruned = pruneProjectFromStore({ repoRoot: repoA.root, storeRoot });
      expect(pruned).toEqual({
        status: "pruned",
        storeRoot,
        projectId: repoA.projectId,
        remainingProjects: 1,
      });

      withStoreDatabase(storeRoot, (db) => {
        // Every row for project A is gone.
        expect(readProjectRegistryEntry(db, repoA.projectId)).toBeNull();
        expect(listPlaybookRunRecords(db, repoA.projectId)).toEqual([]);
        expect(listWorkEvidence(db, { projectId: repoA.projectId })).toEqual([]);
        // Every row of project B is intact.
        expect(readProjectRegistryEntry(db, repoB.projectId)).not.toBeNull();
        expect(listPlaybookRunRecords(db, repoB.projectId)).toHaveLength(1);
        expect(listWorkEvidence(db, { projectId: repoB.projectId })).toHaveLength(1);
      });

      // Pruning touched no repository content in either project.
      expect(collectFiles(repoA.root)).toEqual(filesABefore);
      expect(collectFiles(repoB.root)).toEqual(filesBBefore);

      // The tool-`uninstall` seam: removing the whole store deletes only
      // store-owned files and, again, no repository content (R-LIFE-1). The
      // full CLI uninstall flow around this seam is covered in
      // `store-lifecycle.test.ts` and `uninstall.test.ts`.
      const removed = removeGlobalStore({ storeRoot });
      expect(removed.status).toBe("removed");
      expect(existsSync(storeRoot)).toBe(false);
      expect(collectFiles(repoA.root)).toEqual(filesABefore);
      expect(collectFiles(repoB.root)).toEqual(filesBBefore);
    });
  });
});
