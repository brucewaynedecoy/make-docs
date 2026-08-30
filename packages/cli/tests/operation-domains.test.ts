import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import {
  gatePhase,
  guardPhaseScope,
  listOperationDomains,
  readPlaybookCatalog,
  readHarnessCapabilityEvaluation,
  readPlaybookResolution,
  writePlaybookInvocation,
  writePlaybookRunState,
  probeCloseout,
  readWorkPhaseState,
} from "../src/operations/index";
import { loadSqliteDriver } from "../src/store";
import { cleanupTempDir, createTempDir, writeMinimalManifest } from "./helpers";

const sqliteAvailable = loadSqliteDriver().available;

function writeFile(root: string, relativePath: string, content: string): string {
  const absolutePath = path.join(root, relativePath);
  mkdirSync(path.dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, content, "utf8");
  return absolutePath;
}

function playbookBody(title: string): string {
  return [
    `# ${title}`,
    "",
    "## Purpose",
    "",
    "Use this playbook when the matching workflow goal is active.",
    "",
    "## Inputs and Authority",
    "",
    "- User request.",
    "- Repo-local Make Docs contracts.",
    "",
    "## Procedure",
    "",
    "1. Resolve the playbook.",
    "2. Follow the documented steps in order.",
    "",
    "## Gates and Decisions",
    "",
    "- Stop when user review is required.",
    "",
    "## Assists",
    "",
    "- CLI, MCP, plugin, subagent, or skill assists are optional unless the playbook says otherwise.",
    "",
    "## Outputs and Handoff",
    "",
    "- Record the expected output or handoff artifact.",
    "",
    "## Validation",
    "",
    "- Confirm the workflow completed or report why it stopped.",
    "",
  ].join("\n");
}

describe("operation domain modules", () => {
  const tempRoots: string[] = [];

  afterEach(() => {
    for (const root of tempRoots.splice(0)) {
      cleanupTempDir(root);
    }
  });

  test("derives the operation-domain map from the operation registry (R-REG-2, R-RUN-2)", () => {
    const domains = listOperationDomains();

    expect(domains.map((domain) => domain.name)).toEqual([
      "playbook",
      "package",
      "prd",
      "project",
      "work",
      "resource",
      "lifecycle",
      "uat",
    ]);

    const identifiers = domains.flatMap((domain) => domain.commands.map((command) => command.id));
    expect(identifiers).toEqual([
      "playbook.validate",
      "playbook.catalog",
      "playbook.resolve",
      "playbook.capabilities",
      "playbook.start",
      "playbook.invoke",
      "playbook.status",
      "playbook.next",
      "playbook.advance",
      "playbook.gate",
      "playbook.resume",
      "playbook.close",
      "playbook.run.export",
      "playbook.run.import",
      "package.plan",
      "package.surface-resolve",
      "package.write",
      // Appended by W18 R12 P3 (PRD 41 R-GRAM-3).
      "package.ship",
      "prd.authority.validate",
      "project.surface.ensure",
      "project.path-hygiene.validate",
      "work.item.resolve",
      "work.evidence.record",
      "work.evidence.read",
      "resource.list",
      "resource.read",
      "resource.ensure",
      "lifecycle.start",
      "lifecycle.show",
      "lifecycle.list",
      "lifecycle.checkpoint",
      "lifecycle.pause",
      "lifecycle.resume",
      "lifecycle.attach-evidence",
      "lifecycle.complete",
      "lifecycle.fail",
      "lifecycle.abandon",
      "uat.scenario.validate",
      "uat.persona.resolve",
      "uat.target.validate",
      "uat.evidence-reference.validate",
      "uat.finding.validate",
      "uat.result.validate",
    ]);
    expect(identifiers).toHaveLength(43);

    for (const domain of domains) {
      for (const command of domain.commands) {
        expect(command).toEqual(
          expect.objectContaining({
            id: expect.stringMatching(/^[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*){1,2}$/),
            summary: expect.any(String),
            mutates: expect.any(Boolean),
            status: expect.stringMatching(/^(active|pending)$/),
          }),
        );
      }
    }
    expect(
      domains
        .flatMap((domain) => domain.commands)
        .filter((command) => command.mutates)
        .map((command) => command.id),
    ).toEqual([
      "playbook.start",
      "playbook.invoke",
      "playbook.advance",
      "playbook.gate",
      "playbook.resume",
      "playbook.close",
      "playbook.run.export",
      "playbook.run.import",
      "package.write",
      "package.ship",
      "project.surface.ensure",
      "work.evidence.record",
      "resource.ensure",
      "lifecycle.start",
      "lifecycle.checkpoint",
      "lifecycle.pause",
      "lifecycle.resume",
      "lifecycle.attach-evidence",
      "lifecycle.complete",
      "lifecycle.fail",
      "lifecycle.abandon",
    ]);

    const prunedNames = [
      "wave-resolve",
      "wave-status",
      "work-phase-state",
      "phase-plan",
      "phase-gate",
      "scope-guard",
      "closeout-probe",
      "closeout-validate",
      "closeout-history",
    ];
    const serialized = JSON.stringify(identifiers);
    for (const pruned of prunedNames) {
      expect(serialized).not.toContain(pruned);
    }
    expect(domains.map((domain) => domain.name)).not.toContain("closeout");
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
        playbookBody("Use System"),
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

    expect(catalog.provenance.operation).toBe("playbook.catalog");
    expect(resolution.provenance.operation).toBe("playbook-resolve");
    expect(capabilities.provenance.operation).toBe("playbook-capabilities");
    expect(capabilities.value).toEqual(
      expect.objectContaining({
        status: "serial-gated-fallback",
        satisfiedRequired: ["goal_managed_execution"],
        fallbackPreferred: ["parallel_playbook_runs"],
      }),
    );
    if (sqliteAvailable) {
      const projectId = writeMinimalManifest(root);
      const storeRoot = createTempDir("make-docs-playbook-domain-store-");
      tempRoots.push(storeRoot);
      const run = writePlaybookRunState({
        repoRoot: root,
        storeRoot,
        ref: "user/use-system",
        requestedStack: "run",
        harness: "codex",
        runId: "root-run",
        outputSurfaceClaims: ["docs/assets/archive/history"],
      });
      expect(run.provenance.operation).toBe("playbook-run-start");
      expect(run.value).toEqual(
        expect.objectContaining({
          projectId,
          state: expect.objectContaining({
            runId: "root-run",
            projectId,
            stateSource: "make-docs",
            harnessAssistsAreSourceOfTruth: false,
          }),
        }),
      );
      const invocation = writePlaybookInvocation({
        repoRoot: root,
        storeRoot,
        ref: "user/use-system",
        requestedStack: "run",
        harness: "codex",
        runId: "invoke-run",
        // Disjoint from the still-open root-run claim: two open runs claiming
        // the same output surface now stop at creation (R-GUARD-3, W18 R7 P4).
        outputSurfaceClaims: ["docs/assets/artifacts"],
      });
      expect(invocation.provenance.operation).toBe("playbook-run-invoke");
      expect(invocation.value).toEqual(
        expect.objectContaining({
          status: "paused",
          state: expect.objectContaining({
            runId: "invoke-run",
            cursor: { kind: "gate", id: "gate-1" },
          }),
        }),
      );
    }
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
