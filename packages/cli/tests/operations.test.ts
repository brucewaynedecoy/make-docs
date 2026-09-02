import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, test, vi } from "vitest";
import {
  buildCheckpoint,
  buildCloseoutProbe,
  buildPhaseGateReport,
  buildPhasePlan,
  buildScopeReport,
  buildWaveStatus,
  parseWorkPhase,
  resolveWaveTarget,
} from "../src/operations";
import { listWorkEvidence, loadSqliteDriver, withStoreDatabase } from "../src/store";
import { cleanupTempDir, createTempDir, writeMinimalManifest } from "./helpers";

const WAVE_SLUG = "2026-06-23-w16-r3-operation-test";
const sqliteAvailable = loadSqliteDriver().available;

function writeFile(root: string, relativePath: string, content: string): string {
  const absolutePath = path.join(root, relativePath);
  mkdirSync(path.dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, content, "utf8");
  return absolutePath;
}

function createWaveFixture(): {
  root: string;
  phaseOne: string;
  phaseTwo: string;
  waveDir: string;
  projectId: string;
} {
  const root = createTempDir("make-docs-operations-");
  execFileSync("git", ["init"], { cwd: root, stdio: "ignore" });
  const projectId = writeMinimalManifest(root);
  const waveDir = path.join(root, "docs/work", WAVE_SLUG);
  const phaseOne = writeFile(
    root,
    `docs/work/${WAVE_SLUG}/01-alpha.md`,
    [
      "# Phase 01: Alpha",
      "",
      "## Tasks",
      "",
      "- [x] t1: Finish the first task.",
      "- [ ] t2: Finish the second task.",
      "",
      "## Acceptance Criteria",
      "",
      "- First task evidence exists.",
      "",
      "## Validation",
      "",
      "- `npm test -w packages/cli -- operations`",
      "",
      "## Scope",
      "",
      "- Touch `packages/cli/src/operations.ts`.",
      "",
    ].join("\n"),
  );
  const phaseTwo = writeFile(
    root,
    `docs/work/${WAVE_SLUG}/02-beta.md`,
    [
      "# Phase 02: Beta",
      "",
      "## Tasks",
      "",
      "- [x] t1: Complete beta.",
      "",
      "## Acceptance Criteria",
      "",
      "- Beta evidence exists.",
      "",
    ].join("\n"),
  );
  return { root, phaseOne, phaseTwo, waveDir, projectId };
}

/** Legacy pre-W18-R10 checkpoint file shape, for migration coverage. */
function writeLegacyCheckpointState(root: string, phaseRelative: string): string {
  const statePath = path.join(root, ".make-docs/runs", WAVE_SLUG, "state.json");
  mkdirSync(path.dirname(statePath), { recursive: true });
  writeFileSync(
    statePath,
    `${JSON.stringify({
      schemaVersion: 1,
      createdAt: "2026-06-23T00:00:00+00:00",
      updatedAt: "2026-06-23T00:00:00+00:00",
      waveSlug: WAVE_SLUG,
      waveDir: `docs/work/${WAVE_SLUG}`,
      target: `docs/work/${WAVE_SLUG}`,
      coordinate: { w: 16, r: 3, p: null },
      mode: "wave",
      commitPolicy: "commit-and-push",
      nextPhasePath: phaseRelative,
      activePhasePath: phaseRelative,
      phases: {
        [path.basename(phaseRelative)]: {
          phasePath: phaseRelative,
          status: "in-progress",
          notes: [{ at: "2026-06-23T00:00:00+00:00", text: "legacy note" }],
          validation: { status: "passed", commands: ["npm test"] },
          review: { status: "waived", required: true },
          closeout: { status: "passed" },
          commit: { status: "passed", sha: "legacy123" },
          push: { status: "passed" },
        },
      },
    }, null, 2)}\n`,
    "utf8",
  );
  return statePath;
}

describe("make-docs shared operations", () => {
  const tempRoots: string[] = [];

  afterEach(() => {
    vi.restoreAllMocks();
    for (const root of tempRoots.splice(0)) {
      cleanupTempDir(root);
    }
  });

  test("parses phase task state and resolves the next incomplete wave phase", () => {
    const fixture = createWaveFixture();
    tempRoots.push(fixture.root);

    const phase = parseWorkPhase(fixture.phaseOne);
    expect(phase.coordinate).toEqual({ w: 16, r: 3, p: 1 });
    expect(phase.tasks.map((task) => [task.id, task.checked])).toEqual([
      ["t1", true],
      ["t2", false],
    ]);
    expect(phase.declaredPaths).toContain("packages/cli/src/operations.ts");

    const resolution = resolveWaveTarget(fixture.waveDir);
    expect(resolution.phasePath).toBe(fixture.phaseOne);
    expect(resolution.phases).toEqual([
      expect.objectContaining({ phase: 1, isComplete: false, uncheckedTaskCount: 1 }),
      expect.objectContaining({ phase: 2, isComplete: true, uncheckedTaskCount: 0 }),
    ]);

    const status = buildWaveStatus(fixture.waveDir);
    expect(status.nextPhasePath).toBe(fixture.phaseOne);
    expect(status.phases).toEqual([
      expect.objectContaining({ taskCount: 2 }),
      expect.objectContaining({ taskCount: 1 }),
    ]);
    // Recorded evidence comes from the global store, never a repo state file.
    expect(status.evidenceSource).toBe("global-store");
    expect(status.projectIdentity).toEqual(
      expect.objectContaining({ status: "resolved", projectId: fixture.projectId }),
    );
    expect(status.legacyCheckpoint).toEqual(
      expect.objectContaining({ present: false, state: null }),
    );
  });

  test("renders phase plans with validation, scope hints, and serial-work guidance", () => {
    const fixture = createWaveFixture();
    tempRoots.push(fixture.root);

    const plan = buildPhasePlan(fixture.waveDir);

    expect(plan.phasePath).toBe(fixture.phaseOne);
    expect(plan.validationCommands).toEqual([
      expect.objectContaining({ command: "npm test -w packages/cli -- operations" }),
    ]);
    expect(plan.declaredPaths).toEqual(["packages/cli/src/operations.ts"]);
    expect(plan.parallelization).toEqual([
      "Implement serially unless the phase dependency notes identify disjoint work.",
    ]);
  });

  test.skipIf(!sqliteAvailable)(
    "checkpoints evidence into the global store and gates completion on validation, closeout, review, and commit evidence",
    () => {
      const fixture = createWaveFixture();
      tempRoots.push(fixture.root);
      const storeRoot = path.join(createTempDir("make-docs-operations-store-"), "store");
      tempRoots.push(path.dirname(storeRoot));

      let gate = buildPhaseGateReport(fixture.waveDir, undefined, { storeRoot });
      expect(gate.status).toBe("blocked");
      expect(gate.blockers).toContain("1 unchecked task(s) remain in the phase doc");

      writeFile(
        fixture.root,
        `docs/work/${WAVE_SLUG}/01-alpha.md`,
        [
          "# Phase 01: Alpha",
          "",
          "## Tasks",
          "",
          "- [x] t1: Finish the first task.",
          "- [x] t2: Finish the second task.",
          "",
        ].join("\n"),
      );

      const checkpoint = buildCheckpoint({
        target: fixture.phaseOne,
        status: "complete",
        validationStatus: "passed",
        reviewStatus: "waived",
        closeoutStatus: "passed",
        commitStatus: "passed",
        commitSha: "abc1234",
        storeRoot,
      });

      // Evidence is keyed by the manifest-minted project identifier plus the
      // canonical work-item identity, and recorded in the global store.
      expect(checkpoint.projectId).toBe(fixture.projectId);
      expect(checkpoint.waveSlug).toBe(WAVE_SLUG);
      expect(checkpoint.phasePath).toBe(`docs/work/${WAVE_SLUG}/01-alpha.md`);
      expect(checkpoint.evidenceSource).toBe("global-store");
      expect(checkpoint.evidence).toEqual(
        expect.objectContaining({
          validation: { status: "passed" },
          review: { status: "waived" },
          closeout: { status: "passed" },
          commit: { status: "passed", sha: "abc1234" },
        }),
      );
      // Re-derivable fields are dropped, not recorded (R-PS-2).
      expect(checkpoint.droppedFields).toEqual([
        "status (re-derivable from the phase document's task checkboxes; not recorded as evidence)",
      ]);

      // No work-lifecycle state is written under any repository path (R-BND-2).
      expect(existsSync(path.join(fixture.root, ".make-docs", "runs"))).toBe(false);

      withStoreDatabase(storeRoot, (db) => {
        const rows = listWorkEvidence(db, { projectId: fixture.projectId });
        expect(rows.map((row) => row.evidenceKind).sort()).toEqual([
          "closeout",
          "commit",
          "review",
          "validation",
        ]);
        expect(rows[0]?.waveSlug).toBe(WAVE_SLUG);
      });

      gate = buildPhaseGateReport(fixture.phaseOne, undefined, { storeRoot });
      expect(gate.status).toBe("passed");
      expect(gate.blockers).toEqual([]);
    },
  );

  test.skipIf(!sqliteAvailable)(
    "migrates a legacy checkpoint file into evidence rows, drops re-derivable fields, and removes the file",
    () => {
      const fixture = createWaveFixture();
      tempRoots.push(fixture.root);
      const storeRoot = path.join(createTempDir("make-docs-operations-store-"), "store");
      tempRoots.push(path.dirname(storeRoot));
      const phaseRelative = `docs/work/${WAVE_SLUG}/01-alpha.md`;
      const legacyPath = writeLegacyCheckpointState(fixture.root, phaseRelative);

      // Read-only operations consult the legacy file without migrating it.
      const gateBefore = buildPhaseGateReport(fixture.phaseOne, undefined, { storeRoot });
      expect(gateBefore.evidence).toEqual(
        expect.objectContaining({
          validation: { status: "passed", commands: ["npm test"] },
          review: { status: "waived", required: true },
        }),
      );
      expect(gateBefore.commitPolicy).toBe("commit-and-push");
      expect(existsSync(legacyPath)).toBe(true);
      withStoreDatabase(storeRoot, (db) => {
        expect(listWorkEvidence(db, { projectId: fixture.projectId })).toHaveLength(0);
      });

      // The mutating checkpoint migrates genuine fields and removes the file.
      const checkpoint = buildCheckpoint({
        target: fixture.phaseOne,
        note: "post-migration note",
        storeRoot,
      });
      expect(checkpoint.legacyMigration).toEqual(
        expect.objectContaining({
          migrated: true,
          removed: true,
          migratedPhases: [phaseRelative],
        }),
      );
      expect(existsSync(legacyPath)).toBe(false);
      expect(existsSync(path.join(fixture.root, ".make-docs", "runs"))).toBe(false);

      withStoreDatabase(storeRoot, (db) => {
        const rows = listWorkEvidence(db, { projectId: fixture.projectId });
        const byKind = new Map(rows.map((row) => [row.evidenceKind, row.payload]));
        // Every genuine sign-off from the legacy file is queryable as evidence.
        expect(byKind.get("validation")).toEqual({ status: "passed", commands: ["npm test"] });
        expect(byKind.get("review")).toEqual({ status: "waived", required: true });
        expect(byKind.get("closeout")).toEqual({ status: "passed" });
        expect(byKind.get("commit")).toEqual({ status: "passed", sha: "legacy123" });
        expect(byKind.get("push")).toEqual({ status: "passed" });
        expect(byKind.get("commit-policy")).toEqual({ policy: "commit-and-push" });
        expect(byKind.get("notes")).toEqual([
          { at: "2026-06-23T00:00:00+00:00", text: "legacy note" },
          expect.objectContaining({ text: "post-migration note" }),
        ]);
        // No re-derivable field was carried over: the evidence kinds above
        // are the complete set (no status/coordinate/waveDir/target rows).
        expect(rows.map((row) => row.evidenceKind).sort()).toEqual([
          "closeout",
          "commit",
          "commit-policy",
          "notes",
          "push",
          "review",
          "validation",
        ]);
        for (const row of rows) {
          expect(JSON.stringify(row.payload)).not.toContain("in-progress");
        }
      });

      // The gate keeps passing evidence visible after the migration.
      const gateAfter = buildPhaseGateReport(fixture.phaseOne, undefined, { storeRoot });
      expect(gateAfter.commitPolicy).toBe("commit-and-push");
      expect(gateAfter.blockers).toContain("1 unchecked task(s) remain in the phase doc");
      expect(gateAfter.blockers).not.toContain("validation has not been recorded as passed");
    },
  );

  test("checkpoint refuses to record without a manifest-minted project identity", () => {
    const root = createTempDir("make-docs-operations-noid-");
    tempRoots.push(root);
    execFileSync("git", ["init"], { cwd: root, stdio: "ignore" });
    const phasePath = writeFile(
      root,
      `docs/work/${WAVE_SLUG}/01-alpha.md`,
      ["# Phase 01: Alpha", "", "## Tasks", "", "- [ ] t1: Task.", ""].join("\n"),
    );

    expect(() => buildCheckpoint({ target: phasePath, validationStatus: "passed" })).toThrow(
      /no \.make-docs\/manifest\.json/,
    );
    // And it never falls back to writing under the repository.
    expect(existsSync(path.join(root, ".make-docs", "runs"))).toBe(false);
  });

  test("scope guard allows declared paths, history, managed state, and lockfile derivatives", () => {
    const fixture = createWaveFixture();
    tempRoots.push(fixture.root);

    const report = buildScopeReport(fixture.waveDir, [
      "packages/cli/src/operations.ts",
      "docs/assets/archive/history/2026-06-26-example.md",
      `.make-docs/runs/${WAVE_SLUG}/state.json`,
      "package.json",
      "package-lock.json",
      "unrelated.txt",
    ]);

    expect(report.status).toBe("warning");
    expect(report.allowedDerived).toEqual([
      {
        path: `.make-docs/runs/${WAVE_SLUG}/state.json`,
        reason: "legacy work-on-wave checkpoint state (migrated to the global store)",
      },
      {
        path: "package-lock.json",
        reason: "package-lock.json is derived from changed dependency manifest package.json",
      },
    ]);
    expect(report.outOfScope).toEqual(["package.json", "unrelated.txt"]);
  });

  test("closeout probe reports current contracts, changed files, and validation hints", () => {
    const root = createTempDir("make-docs-closeout-probe-");
    tempRoots.push(root);
    execFileSync("git", ["init"], { cwd: root, stdio: "ignore" });
    writeFile(root, "package.json", JSON.stringify({ name: "make-docs" }));
    writeFile(root, "docs/work/.gitkeep", "");
    writeFile(
      root,
      "docs/prd/03-open-questions-and-risk-register.md",
      ["### D-005 Drift", "", "### Q-012 Question", "", "### R-014 Risk", ""].join("\n"),
    );
    writeFile(root, "docs/assets/archive/history/2026-06-26-w16-r3-example.md", "W16 R3\n");
    writeFile(root, ".make-docs/system/contracts/commit-message-convention.md", "# Convention\n");
    writeFile(root, "packages/cli/src/operations.ts", "export {}\n");
    writeFile(
      root,
      "docs/assets/library/user/example-guide.md",
      [
        "---",
        'title: "Example Guide"',
        "persona: developer",
        "status: draft",
        "---",
        "",
        "# Example Guide",
        "",
      ].join("\n"),
    );
    execFileSync("git", ["add", "."], { cwd: root, stdio: "ignore" });
    execFileSync(
      "git",
      ["-c", "user.email=test@example.com", "-c", "user.name=Test", "commit", "-m", "baseline"],
      { cwd: root, stdio: "ignore" },
    );
    writeFile(root, "package.json", JSON.stringify({ name: "make-docs", changed: true }));
    writeFile(root, "docs/work/.gitkeep", "changed\n");
    writeFile(
      root,
      "docs/prd/03-open-questions-and-risk-register.md",
      ["### D-005 Drift", "", "### Q-012 Question", "", "### R-014 Risk", "", "changed", ""].join("\n"),
    );
    writeFile(root, "docs/assets/archive/history/2026-06-26-w16-r3-example.md", "W16 R3 changed\n");
    writeFile(root, ".make-docs/system/contracts/commit-message-convention.md", "# Convention\n\nChanged\n");
    writeFile(root, "packages/cli/src/operations.ts", "export const changed = true;\n");
    writeFile(
      root,
      "docs/assets/library/user/example-guide.md",
      [
        "---",
        'title: "Example Guide"',
        "persona: developer",
        "status: draft",
        "---",
        "",
        "# Example Guide",
        "",
        "Changed.",
      ].join("\n"),
    );

    const probe = buildCloseoutProbe({ repoRoot: root, scope: "full" });

    expect(probe.files).toEqual([
      expect.objectContaining({
        path: ".make-docs/system/contracts/commit-message-convention.md",
        category: "other",
      }),
      expect.objectContaining({ path: "docs/assets/archive/history/2026-06-26-w16-r3-example.md", category: "docs" }),
      expect.objectContaining({ path: "docs/assets/library/user/example-guide.md", category: "docs" }),
      expect.objectContaining({ path: "docs/prd/03-open-questions-and-risk-register.md", category: "docs" }),
      expect.objectContaining({ path: "docs/work/.gitkeep", category: "docs" }),
      expect.objectContaining({ path: "package.json", category: "config" }),
      expect.objectContaining({ path: "packages/cli/src/operations.ts", category: "code" }),
    ]);
    expect(probe.contracts).toEqual(
      expect.objectContaining({
        commitConvention: { exists: true, paths: [".make-docs/system/contracts/commit-message-convention.md"] },
      }),
    );
    expect(probe.riskRegister).toEqual(
      expect.objectContaining({
        next: { D: "D-006", Q: "Q-013", R: "R-015" },
      }),
    );
    expect(probe.metadataValidation).toEqual([
      {
        path: "docs/assets/library/user/example-guide.md",
        findings: [
          {
            code: "persona-path-mismatch",
            field: "persona",
            message:
              "Persona frontmatter 'developer' does not match library path persona 'user' in docs/assets/library/user/example-guide.md.",
          },
        ],
      },
    ]);
    expect(probe.validationHints).toEqual(
      expect.arrayContaining(["npm test -w packages/cli -- consistency install skill-catalog skill-registry", "npm run build -w packages/cli", "git diff --check"]),
    );
  });

  test("buildWaveStatus reports structured wave state directly", () => {
    const fixture = createWaveFixture();
    tempRoots.push(fixture.root);

    const status = buildWaveStatus(fixture.waveDir);

    expect(status).toEqual(
      expect.objectContaining({
        nextPhasePath: fixture.phaseOne,
      }),
    );
  });
});
