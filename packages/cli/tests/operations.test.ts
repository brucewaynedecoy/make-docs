import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
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
  runOperationsCommand,
} from "../src/operations";
import { cleanupTempDir, createTempDir } from "./helpers";

const WAVE_SLUG = "2026-06-23-w16-r3-operation-test";

function writeFile(root: string, relativePath: string, content: string): string {
  const absolutePath = path.join(root, relativePath);
  mkdirSync(path.dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, content, "utf8");
  return absolutePath;
}

function createWaveFixture(): { root: string; phaseOne: string; phaseTwo: string; waveDir: string } {
  const root = createTempDir("make-docs-operations-");
  execFileSync("git", ["init"], { cwd: root, stdio: "ignore" });
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
  return { root, phaseOne, phaseTwo, waveDir };
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

  test("checkpoints phase state and gates completion on validation, closeout, review, and commit evidence", () => {
    const fixture = createWaveFixture();
    tempRoots.push(fixture.root);

    let gate = buildPhaseGateReport(fixture.waveDir);
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
    });
    expect(checkpoint.statePath).toBe(path.join(fixture.root, ".make-docs/runs", WAVE_SLUG, "state.json"));
    expect(checkpoint.state).toEqual(
      expect.objectContaining({
        waveDir: `docs/work/${WAVE_SLUG}`,
        activePhasePath: `docs/work/${WAVE_SLUG}/01-alpha.md`,
      }),
    );

    gate = buildPhaseGateReport(fixture.phaseOne);
    expect(gate.status).toBe("passed");
    expect(gate.blockers).toEqual([]);
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
        reason: "managed work-on-wave checkpoint state",
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
    writeFile(root, ".make-docs/contracts/system/commit-message-convention.md", "# Convention\n");
    writeFile(root, "packages/cli/src/operations.ts", "export {}\n");
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
    writeFile(root, ".make-docs/contracts/system/commit-message-convention.md", "# Convention\n\nChanged\n");
    writeFile(root, "packages/cli/src/operations.ts", "export const changed = true;\n");

    const probe = buildCloseoutProbe({ repoRoot: root, scope: "full" });

    expect(probe.files).toEqual([
      expect.objectContaining({
        path: ".make-docs/contracts/system/commit-message-convention.md",
        category: "other",
      }),
      expect.objectContaining({ path: "docs/assets/archive/history/2026-06-26-w16-r3-example.md", category: "docs" }),
      expect.objectContaining({ path: "docs/prd/03-open-questions-and-risk-register.md", category: "docs" }),
      expect.objectContaining({ path: "docs/work/.gitkeep", category: "docs" }),
      expect.objectContaining({ path: "package.json", category: "config" }),
      expect.objectContaining({ path: "packages/cli/src/operations.ts", category: "code" }),
    ]);
    expect(probe.contracts).toEqual(
      expect.objectContaining({
        commitConvention: { exists: true, paths: [".make-docs/contracts/system/commit-message-convention.md"] },
      }),
    );
    expect(probe.riskRegister).toEqual(
      expect.objectContaining({
        next: { D: "D-006", Q: "Q-013", R: "R-015" },
      }),
    );
    expect(probe.validationHints).toEqual(
      expect.arrayContaining(["npm test -w packages/cli -- consistency install skill-catalog skill-registry", "npm run build -w packages/cli", "git diff --check"]),
    );
  });

  test("CLI operations command emits structured JSON", async () => {
    const fixture = createWaveFixture();
    tempRoots.push(fixture.root);
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    await runOperationsCommand(["wave-status", fixture.waveDir, "--json"]);

    const output = writeSpy.mock.calls.map(([chunk]) => String(chunk)).join("");
    expect(JSON.parse(output)).toEqual(
      expect.objectContaining({
        nextPhasePath: fixture.phaseOne,
      }),
    );
  });
});
