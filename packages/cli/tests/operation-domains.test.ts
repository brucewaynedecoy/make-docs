import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import {
  gatePhase,
  getOperationDomain,
  guardPhaseScope,
  listOperationDomains,
  readPlaybookCatalog,
  readHarnessCapabilityEvaluation,
  readPlaybookResolution,
  writePlaybookRunState,
  probeCloseout,
  readWorkPhaseState,
} from "../src/operations/index";
import { cleanupTempDir, createTempDir } from "./helpers";

function writeFile(root: string, relativePath: string, content: string): string {
  const absolutePath = path.join(root, relativePath);
  mkdirSync(path.dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, content, "utf8");
  return absolutePath;
}

describe("operation domain modules", () => {
  const tempRoots: string[] = [];

  afterEach(() => {
    for (const root of tempRoots.splice(0)) {
      cleanupTempDir(root);
    }
  });

  test("declare the initial CLI/MCP operation-domain map", () => {
    expect(listOperationDomains()).toEqual([
      expect.objectContaining({
        name: "closeout",
        commands: [
          expect.objectContaining({ name: "closeout-probe", mutates: false }),
          expect.objectContaining({ name: "closeout-validate", mutates: false }),
          expect.objectContaining({ name: "closeout-history", mutates: true }),
        ],
      }),
      expect.objectContaining({
        name: "work",
        commands: [
          expect.objectContaining({ name: "work-phase-state", mutates: false }),
          expect.objectContaining({ name: "wave-resolve", mutates: false }),
          expect.objectContaining({ name: "wave-status", mutates: false }),
          expect.objectContaining({ name: "phase-plan", mutates: false }),
        ],
      }),
      expect.objectContaining({
        name: "lifecycle",
        commands: [
          expect.objectContaining({ name: "checkpoint", mutates: true }),
          expect.objectContaining({ name: "scope-guard", mutates: false }),
          expect.objectContaining({ name: "phase-gate", mutates: false }),
        ],
      }),
      expect.objectContaining({
        name: "playbook",
        commands: [
          expect.objectContaining({ name: "playbook-catalog", mutates: false }),
          expect.objectContaining({ name: "playbook-resolve", mutates: false }),
          expect.objectContaining({ name: "playbook-capabilities", mutates: false }),
          expect.objectContaining({ name: "playbook-run-start", mutates: true }),
          expect.objectContaining({ name: "playbook-run-read", mutates: false }),
        ],
      }),
      expect.objectContaining({
        name: "playbook-packaging",
        commands: [],
      }),
    ]);

    expect(getOperationDomain("work").summary).toContain("Wave");
    expect(getOperationDomain("playbook-packaging").summary).toContain("package-plan");
  });

  test("runs a work-domain operation without CLI parser or MCP transport setup", () => {
    const root = createTempDir("make-docs-operation-domain-");
    tempRoots.push(root);
    execFileSync("git", ["init"], { cwd: root, stdio: "ignore" });
    const phasePath = writeFile(
      root,
      "docs/work/2026-06-26-w10-r8-example/01-domain.md",
      [
        "# Phase 01: Domain",
        "",
        "## Tasks",
        "",
        "- [x] t1: Define folders.",
        "- [ ] t2: Add direct tests.",
        "",
        "## Acceptance Criteria",
        "",
        "- Domain tests can run without CLI parser setup.",
        "",
      ].join("\n"),
    );

    const result = readWorkPhaseState(phasePath);

    expect(result.provenance).toEqual({
      domain: "work",
      operation: "work-phase-state",
      source: "shared",
      target: phasePath,
    });
    expect(result.value.coordinate).toEqual({ w: 10, r: 8, p: 1 });
    expect(result.value.uncheckedTasks.map((task) => task.id)).toEqual(["t2"]);
  });

  test("runs lifecycle domain operations without CLI parser or MCP transport setup", () => {
    const root = createTempDir("make-docs-lifecycle-domain-");
    tempRoots.push(root);
    execFileSync("git", ["init"], { cwd: root, stdio: "ignore" });
    const phasePath = writeFile(
      root,
      "docs/work/2026-06-26-w10-r8-example/01-domain.md",
      [
        "# Phase 01: Domain",
        "",
        "## Tasks",
        "",
        "- [x] t1: Define folders.",
        "- [ ] t2: Add direct tests.",
        "",
        "## Scope",
        "",
        "- Touch `packages/cli/src/operations/`.",
        "",
      ].join("\n"),
    );

    const scope = guardPhaseScope({
      target: path.dirname(phasePath),
      changed: [
        "packages/cli/src/operations/work/index.ts",
        "package-lock.json",
        "unrelated.txt",
      ],
    });
    const gate = gatePhase({ target: path.dirname(phasePath) });

    expect(scope.provenance.operation).toBe("scope-guard");
    expect(scope.value.status).toBe("warning");
    expect(scope.value.outOfScope).toEqual(["package-lock.json", "unrelated.txt"]);
    expect(gate.provenance.operation).toBe("phase-gate");
    expect(gate.value.status).toBe("blocked");
    expect(gate.value.blockers).toContain("1 unchecked task(s) remain in the phase doc");
  });

  test("runs closeout domain probe without CLI parser or MCP transport setup", () => {
    const root = createTempDir("make-docs-closeout-domain-");
    tempRoots.push(root);
    execFileSync("git", ["init"], { cwd: root, stdio: "ignore" });
    writeFile(root, "package.json", JSON.stringify({ name: "make-docs" }));

    const result = probeCloseout({ repoRoot: root, scope: "full" });

    expect(result.provenance).toEqual({
      domain: "closeout",
      operation: "closeout-probe",
      source: "shared",
      target: root,
    });
    expect(result.value.files).toEqual([
      expect.objectContaining({ path: "package.json", category: "config" }),
    ]);
    expect(result.value.validationHints).toContain("git diff --check");
  });

  test("runs playbook domain operations without CLI parser or MCP transport setup", () => {
    const root = createTempDir("make-docs-playbook-domain-");
    tempRoots.push(root);
    execFileSync("git", ["init"], { cwd: root, stdio: "ignore" });
    writeFile(
      root,
      ".make-docs/config.yaml",
      [
        "harnessCapabilities:",
        "  - harness: codex",
        "    reviewStatus: reviewed",
        "    capabilities:",
        "      goal_managed_execution: true",
        "      parallel_playbook_runs: false",
        "",
      ].join("\n"),
    );
    writeFile(
      root,
      "docs/assets/playbooks/user/use-system.md",
      [
        "---",
        "title: Use System",
        "kind: playbook",
        "status: accepted",
        "persona: user",
        "stack: run",
        "summary: Use the installed system.",
        "---",
        "",
        "# Use System",
        "",
      ].join("\n"),
    );

    const catalog = readPlaybookCatalog({ repoRoot: root });
    const resolution = readPlaybookResolution({
      repoRoot: root,
      ref: "user/use-system",
      requestedStack: "run",
    });
    const capabilities = readHarnessCapabilityEvaluation({
      repoRoot: root,
      harness: "codex",
      requiredCapabilities: ["goal_managed_execution"],
      preferredCapabilities: ["parallel_playbook_runs"],
    });

    expect(catalog.provenance.operation).toBe("playbook-catalog");
    expect(resolution.provenance.operation).toBe("playbook-resolve");
    expect(capabilities.provenance.operation).toBe("playbook-capabilities");
    expect(capabilities.value).toEqual(
      expect.objectContaining({
        status: "serial-gated-fallback",
        satisfiedRequired: ["goal_managed_execution"],
        fallbackPreferred: ["parallel_playbook_runs"],
      }),
    );
    const run = writePlaybookRunState({
      repoRoot: root,
      ref: "user/use-system",
      requestedStack: "run",
      harness: "codex",
      runId: "root-run",
      outputSurfaceClaims: ["docs/assets/archive/history"],
    });
    expect(run.provenance.operation).toBe("playbook-run-start");
    expect(run.value).toEqual(
      expect.objectContaining({
        state: expect.objectContaining({
          runId: "root-run",
          stateSource: "make-docs",
          harnessAssistsAreSourceOfTruth: false,
        }),
      }),
    );
    expect(resolution.value).toEqual(
      expect.objectContaining({
        mode: "qualified-ref",
        entry: expect.objectContaining({
          ref: "user/use-system",
          stack: "run",
          title: "Use System",
        }),
      }),
    );
  });
});
