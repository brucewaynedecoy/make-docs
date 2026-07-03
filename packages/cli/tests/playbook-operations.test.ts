import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import {
  buildPlaybookCatalog,
  catalogPlaybooks,
  createPlaybookRunState,
  evaluateHarnessCapabilities,
  invokePlaybook,
  PLAYBOOK_RUN_TERMINAL_STATUSES,
  readPlaybookRunState,
  resolvePlaybook,
  transitionPlaybookRunState,
  validatePlaybooks,
} from "../src/operations";
import { PLAYBOOK_STEP_STATUSES } from "../src/playbook";
import { loadSqliteDriver, readPlaybookRunRecord, withStoreDatabase } from "../src/store";
import { cleanupTempDir, collectFiles, createTempDir, writeMinimalManifest } from "./helpers";

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

function writePlaybook(
  root: string,
  persona: string,
  slug: string,
  stack: "build" | "run",
  title = slug,
  options: { body?: string; runMetadata?: string[] } = {},
): string {
  return writeFile(
    root,
    `docs/assets/playbooks/${persona}/${slug}.md`,
    [
      "---",
      `title: ${title}`,
      "kind: playbook",
      "status: accepted",
      `persona: ${persona}`,
      `stack: ${stack}`,
      `summary: ${title} summary.`,
      ...(options.runMetadata ?? []),
      "---",
      "",
      options.body ?? playbookBody(title),
    ].join("\n"),
  );
}

describe("playbook operation domain", () => {
  const tempRoots: string[] = [];

  afterEach(() => {
    for (const root of tempRoots.splice(0)) {
      cleanupTempDir(root);
    }
  });

  test("catalogs valid playbooks with persona, slug, stack, title, and summary", () => {
    const root = createTempDir("make-docs-playbooks-");
    tempRoots.push(root);
    writePlaybook(root, "user", "use-system", "run", "Use System");

    const catalog = buildPlaybookCatalog({ repoRoot: root });

    expect(catalog.entries).toEqual([
      expect.objectContaining({
        path: "docs/assets/playbooks/user/use-system.md",
        persona: "user",
        slug: "use-system",
        ref: "user/use-system",
        stack: "run",
        title: "Use System",
        summary: "Use System summary.",
      }),
    ]);
    expect(catalog.diagnostics).toEqual([]);
  });

  test("fails closed when YAML frontmatter is missing", () => {
    const root = createTempDir("make-docs-playbooks-");
    tempRoots.push(root);
    writeFile(root, "docs/assets/playbooks/user/no-frontmatter.md", playbookBody("No Frontmatter"));

    const catalog = buildPlaybookCatalog({ repoRoot: root });

    expect(catalog.entries).toEqual([]);
    expect(catalog.diagnostics).toEqual([
      {
        path: "docs/assets/playbooks/user/no-frontmatter.md",
        message: "Playbook file is missing YAML frontmatter.",
      },
    ]);
  });

  test("fails closed for invalid kind, persona, and stack metadata", () => {
    const root = createTempDir("make-docs-playbooks-");
    tempRoots.push(root);
    writeFile(
      root,
      "docs/assets/playbooks/user/broken.md",
      [
        "---",
        "title: Broken",
        "kind: guide",
        "status: accepted",
        "persona: imaginary-team",
        "stack: operate",
        "summary: Broken summary.",
        "---",
        "",
        playbookBody("Broken"),
      ].join("\n"),
    );

    const catalog = buildPlaybookCatalog({ repoRoot: root });

    expect(catalog.entries).toEqual([]);
    expect(catalog.diagnostics.map((diagnostic) => diagnostic.message)).toEqual([
      "Playbook frontmatter must declare kind: playbook.",
      "Playbook frontmatter must declare stack: build or stack: run.",
      "Playbook persona 'imaginary-team' is not a configured persona slug.",
      "Playbook persona frontmatter must match its directory.",
    ]);
  });

  test("fails closed for path persona drift", () => {
    const root = createTempDir("make-docs-playbooks-");
    tempRoots.push(root);
    writeFile(
      root,
      "docs/assets/playbooks/user/drift.md",
      [
        "---",
        "title: Drift",
        "kind: playbook",
        "status: accepted",
        "persona: developer",
        "stack: run",
        "summary: Drift summary.",
        "---",
        "",
        playbookBody("Drift"),
      ].join("\n"),
    );

    const catalog = buildPlaybookCatalog({ repoRoot: root });

    expect(catalog.entries).toEqual([]);
    expect(catalog.diagnostics.map((diagnostic) => diagnostic.message)).toEqual([
      "Playbook persona frontmatter must match its directory.",
    ]);
  });

  test("fails closed for historical transitional playbook paths", () => {
    const root = createTempDir("make-docs-playbooks-");
    tempRoots.push(root);
    writeFile(
      root,
      "docs/library/playbooks/user/legacy.md",
      [
        "---",
        "title: Legacy",
        "kind: playbook",
        "status: accepted",
        "persona: user",
        "stack: run",
        "summary: Legacy summary.",
        "---",
        "",
        playbookBody("Legacy"),
      ].join("\n"),
    );

    expect(() => resolvePlaybook({
      repoRoot: root,
      ref: "docs/library/playbooks/user/legacy.md",
    })).toThrow("Playbook must live directly under docs/assets/playbooks/<persona>/<slug>.md.");
  });

  test("reports missing body structure before selection", () => {
    const root = createTempDir("make-docs-playbooks-");
    tempRoots.push(root);
    writeFile(
      root,
      "docs/assets/playbooks/user/incomplete.md",
      [
        "---",
        "title: Incomplete",
        "kind: playbook",
        "status: accepted",
        "persona: user",
        "stack: run",
        "summary: Incomplete summary.",
        "---",
        "",
        "# Incomplete",
        "",
        "## Purpose",
        "",
        "Use this playbook for a fixture.",
        "",
      ].join("\n"),
    );

    const catalog = buildPlaybookCatalog({ repoRoot: root });

    expect(catalog.entries).toEqual([]);
    expect(catalog.diagnostics.map((diagnostic) => diagnostic.message)).toEqual([
      "Playbook body must define required inputs and authority order.",
      "Playbook body must define step-by-step procedure.",
      "Playbook body must define gates, stop conditions, or user-decision points.",
      "Playbook body must define allowed assists.",
      "Playbook body must define expected outputs or handoff artifacts.",
      "Playbook body must define validation or completion expectations.",
    ]);
  });

  test("resolves explicit paths before catalog references", () => {
    const root = createTempDir("make-docs-playbooks-");
    tempRoots.push(root);
    const playbookPath = writePlaybook(root, "developer", "build-stack", "build", "Build Stack");

    const resolution = resolvePlaybook({
      repoRoot: root,
      ref: playbookPath,
      requestedStack: "build",
    });

    expect(resolution.mode).toBe("explicit-path");
    expect(resolution.entry).toEqual(
      expect.objectContaining({
        ref: "developer/build-stack",
        stack: "build",
      }),
    );
  });

  test("resolves persona slug as the canonical catalog identity", () => {
    const root = createTempDir("make-docs-playbooks-");
    tempRoots.push(root);
    writePlaybook(root, "user", "use-system", "run", "Use System");

    const resolution = resolvePlaybook({
      repoRoot: root,
      ref: "user/use-system",
      requestedStack: "run",
    });

    expect(resolution.mode).toBe("qualified-ref");
    expect(resolution.entry.ref).toBe("user/use-system");
  });

  test("allows bare slug or title only when it maps to exactly one candidate", () => {
    const root = createTempDir("make-docs-playbooks-");
    tempRoots.push(root);
    writePlaybook(root, "user", "use-system", "run", "Use System");
    writePlaybook(root, "developer", "build-stack", "build", "Build Stack");

    expect(resolvePlaybook({ repoRoot: root, ref: "use-system" }).entry.ref).toBe("user/use-system");
    expect(resolvePlaybook({ repoRoot: root, ref: "Build Stack" }).entry.ref).toBe("developer/build-stack");
  });

  test("fails closed for ambiguous bare refs with persona and stack guidance", () => {
    const root = createTempDir("make-docs-playbooks-");
    tempRoots.push(root);
    writePlaybook(root, "user", "review", "run", "Review");
    writePlaybook(root, "developer", "review", "build", "Review");

    expect(() => resolvePlaybook({ repoRoot: root, ref: "review" })).toThrow(
      "provide persona/slug and, if needed, a stack",
    );
  });

  test("fails before execution when the requested stack does not match", () => {
    const root = createTempDir("make-docs-playbooks-");
    tempRoots.push(root);
    writePlaybook(root, "user", "use-system", "run", "Use System");

    expect(() => resolvePlaybook({
      repoRoot: root,
      ref: "user/use-system",
      requestedStack: "build",
    })).toThrow("has stack `run`, but `build` was requested");
  });

  test("uses reviewed harness capability records for required and preferred assists", () => {
    const root = createTempDir("make-docs-playbooks-");
    tempRoots.push(root);
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

    expect(evaluateHarnessCapabilities({
      repoRoot: root,
      harness: "codex",
      requiredCapabilities: ["goal_managed_execution"],
      preferredCapabilities: ["parallel_playbook_runs"],
    })).toEqual(
      expect.objectContaining({
        status: "serial-gated-fallback",
        satisfiedRequired: ["goal_managed_execution"],
        fallbackPreferred: ["parallel_playbook_runs"],
      }),
    );
  });

  test("stops when a required capability is unknown or unsupported", () => {
    const root = createTempDir("make-docs-playbooks-");
    tempRoots.push(root);
    writeFile(
      root,
      ".make-docs/config.yaml",
      [
        "harnessCapabilities:",
        "  - harness: codex",
        "    reviewStatus: reviewed",
        "    capabilities:",
        "      goal_managed_execution: false",
        "",
      ].join("\n"),
    );

    expect(evaluateHarnessCapabilities({
      repoRoot: root,
      harness: "codex",
      requiredCapabilities: ["goal_managed_execution", "resume_after_interrupt"],
    })).toEqual(
      expect.objectContaining({
        status: "manual-review-required",
        unsupportedRequired: ["goal_managed_execution"],
        unknownRequired: ["resume_after_interrupt"],
      }),
    );
  });

  test("does not trust unreviewed persisted capability facts", () => {
    const root = createTempDir("make-docs-playbooks-");
    tempRoots.push(root);
    writeFile(
      root,
      ".make-docs/config.yaml",
      [
        "harnessCapabilities:",
        "  - harness: codex",
        "    reviewStatus: unreviewed",
        "    capabilities:",
        "      goal_managed_execution: true",
        "",
      ].join("\n"),
    );

    expect(evaluateHarnessCapabilities({
      repoRoot: root,
      harness: "codex",
      requiredCapabilities: ["goal_managed_execution"],
    })).toEqual(
      expect.objectContaining({
        status: "manual-review-required",
        satisfiedRequired: [],
        unknownRequired: ["goal_managed_execution"],
      }),
    );
  });

});

describe.skipIf(!sqliteAvailable)("playbook run state in the global store", () => {
  const tempRoots: string[] = [];

  afterEach(() => {
    for (const root of tempRoots.splice(0)) {
      cleanupTempDir(root);
    }
  });

  /** A repo fixture with a manifest-minted identity plus a sandboxed store root. */
  function createRunFixture(): { root: string; storeRoot: string; projectId: string } {
    const root = createTempDir("make-docs-playbook-runs-");
    const storeRoot = createTempDir("make-docs-playbook-store-");
    tempRoots.push(root, storeRoot);
    const projectId = writeMinimalManifest(root);
    return { root, storeRoot, projectId };
  }

  test("creates run state in the global store keyed by project id plus run id, never under the repository", () => {
    const { root, storeRoot, projectId } = createRunFixture();
    writeFile(
      root,
      ".make-docs/config.yaml",
      [
        "harnessCapabilities:",
        "  - harness: codex",
        "    reviewStatus: reviewed",
        "    capabilities:",
        "      goal_managed_execution: true",
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
        "summary: Use system summary.",
        "run:",
        "  requires_capabilities:",
        "    - goal_managed_execution",
        "  child_playbooks: serial",
        "  concurrency: serial",
        "---",
        "",
        playbookBody("Use System"),
      ].join("\n"),
    );
    const repoFilesBefore = collectFiles(root);

    const result = createPlaybookRunState({
      repoRoot: root,
      storeRoot,
      ref: "user/use-system",
      requestedStack: "run",
      harness: "codex",
      runId: "root-run",
      outputSurfaceClaims: ["docs/assets/archive/history"],
      currentStep: "start",
      currentGate: "review",
      status: "waiting-for-user",
      resumeHints: ["Resume after review."],
    });

    expect(result.projectId).toBe(projectId);
    expect(result.state).toEqual(
      expect.objectContaining({
        runId: "root-run",
        rootRunId: "root-run",
        parentRunId: null,
        projectId,
        playbookRef: "user/use-system",
        stack: "run",
        harness: "codex",
        cursor: { kind: "gate", id: "review" },
        childPolicy: "serial",
        outputSurfaceClaims: ["docs/assets/archive/history"],
        status: "waiting-for-user",
        terminalStatus: null,
        resumeHints: ["Resume after review."],
        stateSource: "make-docs",
        harnessAssistsAreSourceOfTruth: false,
      }),
    );

    // The record landed in the store keyed by (projectId, runId)...
    const row = withStoreDatabase(storeRoot, (db) =>
      readPlaybookRunRecord(db, projectId, "root-run"),
    );
    expect(row).not.toBeNull();
    expect(row?.record).toEqual(expect.objectContaining({ runId: "root-run", projectId }));
    expect(readPlaybookRunState({ repoRoot: root, storeRoot, runId: "root-run" }).runId).toBe("root-run");

    // ...and the repository is byte-for-byte untouched (R-STORE-1, R-TEST-5).
    expect(collectFiles(root)).toEqual(repoFilesBefore);
    expect(existsSync(path.join(root, ".make-docs", "runs"))).toBe(false);
  });

  test("carries the full R-STATE-1 record content from the parsed Playbook model", () => {
    const { root, storeRoot, projectId } = createRunFixture();
    writeFile(
      root,
      "docs/assets/playbooks/user/ship-docs.playbook.md",
      conformantPlaybook("user", "ship-docs", "Ship Docs"),
    );

    const { state } = createPlaybookRunState({
      repoRoot: root,
      storeRoot,
      ref: "user/ship-docs",
      requestedStack: "run",
      harness: "codex",
      runId: "record-run",
    });

    expect(Object.keys(state).sort()).toEqual(
      [
        "schemaVersion",
        "runId",
        "rootRunId",
        "parentRunId",
        "projectId",
        "playbookRef",
        "playbookPath",
        "sourceDigest",
        "documentSchemaVersion",
        "workflowSchemaVersion",
        "stack",
        "harness",
        "capabilitySnapshot",
        "routingModel",
        "stepStatuses",
        "gateDecisions",
        "dependencyAvailability",
        "outputSurfaceClaims",
        "outputRefs",
        "evidenceRefs",
        "evidenceLog",
        "cursor",
        "staleness",
        // W18 R7 P4 guardrail fields (R-GUARD-1..2, R-GUARD-4).
        "executionMode",
        "unattended",
        "childPolicy",
        "concurrencyPolicy",
        "childRuns",
        "resumeHints",
        "status",
        "terminalStatus",
        "stateSource",
        "harnessAssistsAreSourceOfTruth",
        "createdAt",
        "updatedAt",
      ].sort(),
    );
    expect(state.projectId).toBe(projectId);
    expect(state.sourceDigest).toMatch(/^[0-9a-f]{64}$/);
    expect(state.documentSchemaVersion).toBe("make-docs.playbook.v1");
    expect(state.workflowSchemaVersion).toBe("make-docs.workflow.v1");
    expect(state.routingModel).toBe("linear");
    expect(state.stepStatuses).toEqual([{ stepId: "check-catalog", status: "pending" }]);
    expect(state.dependencyAvailability).toEqual([
      { id: "make-docs-cli", kind: "cli", requirement: "required", availability: "unknown" },
    ]);
    expect(state.gateDecisions).toEqual([]);
    expect(state.outputRefs).toEqual([]);
    expect(state.evidenceRefs).toEqual([]);
    expect(state.evidenceLog).toEqual([]);
    // The initial cursor defaults to the first sequential workflow step (R-OP-2).
    expect(state.cursor).toEqual({ kind: "step", id: "check-catalog" });
    expect(state.childRuns).toEqual([]);
    expect(state.terminalStatus).toBeNull();
    expect(state.createdAt).toBe(state.updatedAt);
  });

  test("binds step and run status to exactly the eight shared W18 R6 values", () => {
    expect(PLAYBOOK_STEP_STATUSES).toEqual([
      "pending",
      "running",
      "blocked",
      "waiting-for-user",
      "completed",
      "failed",
      "skipped",
      "cancelled",
    ]);
    for (const status of PLAYBOOK_RUN_TERMINAL_STATUSES) {
      expect(PLAYBOOK_STEP_STATUSES).toContain(status);
    }

    const { root, storeRoot } = createRunFixture();
    writePlaybook(root, "user", "use-system", "run", "Use System");
    expect(() => createPlaybookRunState({
      repoRoot: root,
      storeRoot,
      ref: "user/use-system",
      harness: "codex",
      runId: "vocab-run",
      // The retired W18 R4 vocabulary must be rejected (R-STATE-2).
      status: "planned" as never,
    })).toThrow("shared step statuses");
  });

  test("refuses run-state storage without a manifest-minted project identity", () => {
    const root = createTempDir("make-docs-playbook-runs-");
    const storeRoot = createTempDir("make-docs-playbook-store-");
    tempRoots.push(root, storeRoot);
    writePlaybook(root, "user", "use-system", "run", "Use System");

    expect(() => createPlaybookRunState({
      repoRoot: root,
      storeRoot,
      ref: "user/use-system",
      harness: "codex",
      runId: "orphan-run",
    })).toThrow("never by a repository path");
    expect(() => readPlaybookRunState({ repoRoot: root, storeRoot, runId: "orphan-run" })).toThrow(
      "no .make-docs/manifest.json",
    );
  });

  test("create fails on a duplicate run id and transition fails on a missing run", () => {
    const { root, storeRoot } = createRunFixture();
    writePlaybook(root, "user", "use-system", "run", "Use System");
    createPlaybookRunState({
      repoRoot: root,
      storeRoot,
      ref: "user/use-system",
      harness: "codex",
      runId: "run-1",
    });

    expect(() => createPlaybookRunState({
      repoRoot: root,
      storeRoot,
      ref: "user/use-system",
      harness: "codex",
      runId: "run-1",
    })).toThrow("already exists");
    expect(() => transitionPlaybookRunState({
      repoRoot: root,
      storeRoot,
      runId: "missing-run",
      apply: (state) => state,
    })).toThrow("No Playbook run state found for run id `missing-run`.");
  });

  test("transitions an existing run record in place through the storage seam", () => {
    const { root, storeRoot, projectId } = createRunFixture();
    writePlaybook(root, "user", "use-system", "run", "Use System");
    createPlaybookRunState({
      repoRoot: root,
      storeRoot,
      ref: "user/use-system",
      harness: "codex",
      runId: "run-1",
      status: "running",
    });

    const next = transitionPlaybookRunState({
      repoRoot: root,
      storeRoot,
      runId: "run-1",
      apply: (state) => ({
        ...state,
        status: "completed",
        terminalStatus: "completed",
        cursor: null,
      }),
    });

    expect(next.status).toBe("completed");
    expect(next.terminalStatus).toBe("completed");
    const stored = withStoreDatabase(storeRoot, (db) =>
      readPlaybookRunRecord(db, projectId, "run-1"),
    );
    expect(stored?.record).toEqual(
      expect.objectContaining({ status: "completed", terminalStatus: "completed" }),
    );
  });

  test("requires parent permission before creating child playbook runs", () => {
    const { root, storeRoot } = createRunFixture();
    writePlaybook(root, "user", "parent", "run", "Parent");
    writePlaybook(root, "user", "child", "run", "Child");
    createPlaybookRunState({
      repoRoot: root,
      storeRoot,
      ref: "user/parent",
      requestedStack: "run",
      harness: "codex",
      runId: "parent-run",
    });

    expect(() => createPlaybookRunState({
      repoRoot: root,
      storeRoot,
      ref: "user/child",
      requestedStack: "run",
      harness: "codex",
      runId: "child-run",
      parentRunId: "parent-run",
    })).toThrow("does not permit child playbooks");
  });

  test("links child runs into the parent record and stops overlapping parallel claims", () => {
    const { root, storeRoot, projectId } = createRunFixture();
    // Parallel children additionally require parallel-execution support from
    // a reviewed harnessCapabilities record (R-GUARD-2, W18 R7 P4).
    writeFile(
      root,
      ".make-docs/config.yaml",
      [
        "harnessCapabilities:",
        "  - harness: codex",
        "    reviewStatus: reviewed",
        "    capabilities:",
        "      parallel_playbook_runs: true",
        "",
      ].join("\n"),
    );
    writeFile(
      root,
      "docs/assets/playbooks/user/parent.md",
      [
        "---",
        "title: Parent",
        "kind: playbook",
        "status: accepted",
        "persona: user",
        "stack: run",
        "summary: Parent summary.",
        "run:",
        "  child_playbooks: parallel",
        "  concurrency: parallel-allowed",
        "---",
        "",
        playbookBody("Parent"),
      ].join("\n"),
    );
    writePlaybook(root, "user", "child-a", "run", "Child A");
    writePlaybook(root, "user", "child-b", "run", "Child B");
    createPlaybookRunState({
      repoRoot: root,
      storeRoot,
      ref: "user/parent",
      requestedStack: "run",
      harness: "codex",
      runId: "parent-run",
    });
    const childResult = createPlaybookRunState({
      repoRoot: root,
      storeRoot,
      ref: "user/child-a",
      requestedStack: "run",
      harness: "codex",
      runId: "child-a",
      parentRunId: "parent-run",
      executionMode: "parallel",
      outputSurfaceClaims: ["docs/prd"],
    });

    expect(childResult.state.rootRunId).toBe("parent-run");
    expect(childResult.parentState?.childRuns).toEqual([
      expect.objectContaining({ runId: "child-a", outputSurfaceClaims: ["docs/prd"] }),
    ]);
    const parentRow = withStoreDatabase(storeRoot, (db) =>
      readPlaybookRunRecord(db, projectId, "parent-run"),
    );
    expect(parentRow?.record).toEqual(
      expect.objectContaining({
        childRuns: [expect.objectContaining({ runId: "child-a" })],
      }),
    );

    expect(() => createPlaybookRunState({
      repoRoot: root,
      storeRoot,
      ref: "user/child-b",
      requestedStack: "run",
      harness: "codex",
      runId: "child-b",
      parentRunId: "parent-run",
      executionMode: "parallel",
      outputSurfaceClaims: ["docs/prd/29-revise-playbook-contract-run-playbook.md"],
    })).toThrow("output-surface claims overlap");
  });

  test("invokes the generic run model without requiring plugin packaging", () => {
    const { root, storeRoot } = createRunFixture();
    writeFile(root, ".make-docs/contracts/system/example.md", "# Example Authority\n");
    writePlaybook(root, "user", "use-system", "run", "Use System", {
      runMetadata: [
        "run:",
        "  output_surfaces:",
        "    - docs/assets/archive/history",
      ],
      body: [
        "# Use System",
        "",
        "## Purpose",
        "",
        "Use this playbook when the matching workflow goal is active.",
        "",
        "## Inputs and Authority",
        "",
        "- Load `.make-docs/contracts/system/example.md` first.",
        "",
        "## Procedure",
        "",
        "1. Resolve the playbook.",
        "2. Follow the documented steps in order.",
        "",
        "## Gates and Decisions",
        "",
        "- Stop for user review before writing outputs.",
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
      ].join("\n"),
    });

    const invocation = invokePlaybook({
      repoRoot: root,
      storeRoot,
      ref: "user/use-system",
      requestedStack: "run",
      harness: "codex",
      runId: "invoke-run",
    });

    expect(invocation.status).toBe("paused");
    expect(invocation.stopReason).toContain("gate");
    expect(invocation.procedure.map((step) => step.text)).toEqual([
      "Resolve the playbook.",
      "Follow the documented steps in order.",
    ]);
    expect(invocation.authority).toEqual([
      expect.objectContaining({
        text: "Load `.make-docs/contracts/system/example.md` first.",
        pathRefs: [
          {
            path: ".make-docs/contracts/system/example.md",
            exists: true,
            loaded: true,
          },
        ],
      }),
    ]);
    expect(invocation.outputRouting).toEqual({
      playbookDeclaredSurfaces: ["docs/assets/archive/history"],
      callerSurfaceClaims: [],
      effectiveSurfaceClaims: ["docs/assets/archive/history"],
    });
    expect(invocation.supportClaims).toEqual(
      expect.objectContaining({
        cli: "provisional",
        mcp: "provisional",
        plugin: "provisional",
        skill: "provisional",
        "template-sync": "provisional",
        unattended: "provisional",
      }),
    );
    expect(invocation.state).toEqual(
      expect.objectContaining({
        runId: "invoke-run",
        // A gate pause is `waiting-for-user` in the shared vocabulary (R-STATE-2).
        status: "waiting-for-user",
        cursor: { kind: "gate", id: "gate-1" },
      }),
    );
    expect(readPlaybookRunState({ repoRoot: root, storeRoot, runId: "invoke-run" }).status).toBe(
      "waiting-for-user",
    );
  });

  test("blocks invocation when referenced authority is missing", () => {
    const { root, storeRoot } = createRunFixture();
    writePlaybook(root, "user", "missing-authority", "run", "Missing Authority", {
      body: playbookBody("Missing Authority").replace(
        "- Repo-local Make Docs contracts.",
        "- `.make-docs/contracts/system/missing.md`.",
      ),
    });

    const invocation = invokePlaybook({
      repoRoot: root,
      storeRoot,
      ref: "user/missing-authority",
      requestedStack: "run",
      harness: "codex",
      runId: "missing-authority-run",
    });

    expect(invocation.status).toBe("blocked");
    expect(invocation.stopReason).toBe("Missing referenced authority sources: .make-docs/contracts/system/missing.md.");
    expect(invocation.nextStep).toBeNull();
    expect(invocation.state.status).toBe("blocked");
  });

  test("blocks invocation when required assists need review", () => {
    const { root, storeRoot } = createRunFixture();
    writePlaybook(root, "user", "needs-assist", "run", "Needs Assist", {
      runMetadata: [
        "run:",
        "  requires_capabilities:",
        "    - goal_managed_execution",
      ],
    });

    const invocation = invokePlaybook({
      repoRoot: root,
      storeRoot,
      ref: "user/needs-assist",
      requestedStack: "run",
      harness: "codex",
      runId: "needs-assist-run",
    });

    expect(invocation.status).toBe("blocked");
    expect(invocation.assists.status).toBe("manual-review-required");
    expect(invocation.stopReason).toBe("Required Playbook assists require manual review before execution.");
  });

  test("requires explicit playbook permission before unattended gate continuation", () => {
    const { root, storeRoot } = createRunFixture();
    writePlaybook(root, "user", "unattended", "run", "Unattended", {
      runMetadata: [
        "run:",
        "  unattended: true",
      ],
    });

    const invocation = invokePlaybook({
      repoRoot: root,
      storeRoot,
      ref: "user/unattended",
      requestedStack: "run",
      harness: "codex",
      runId: "unattended-run",
      allowUnattended: true,
      outputSurfaceClaims: ["docs/assets/archive/history"],
    });

    expect(invocation.status).toBe("ready");
    expect(invocation.state.status).toBe("running");
    expect(invocation.state.cursor).toEqual({ kind: "step", id: "procedure-1" });
    expect(invocation.outputRouting.effectiveSurfaceClaims).toEqual(["docs/assets/archive/history"]);
  });
});

function conformantPlaybook(persona: string, slug: string, title: string): string {
  return [
    "---",
    `title: "${title}"`,
    'kind: "playbook"',
    `persona: "${persona}"`,
    'status: "accepted"',
    'stack: "run"',
    `summary: "${title} summary."`,
    'schemaVersion: "make-docs.playbook.v1"',
    'workflowSchemaVersion: "make-docs.workflow.v1"',
    "---",
    "",
    `# ${title}`,
    "",
    "## Purpose",
    "",
    "Ship the documented workflow.",
    "",
    "## When To Use",
    "",
    "Use when the workflow goal is active.",
    "",
    "## Inputs And Authority",
    "",
    "- User direction first, then repo-local Make Docs contracts.",
    "",
    "## Dependencies",
    "",
    "| ID | Kind | Requirement | Source | Used By | Fallback |",
    "| --- | --- | --- | --- | --- | --- |",
    "| make-docs-cli | cli | required | package install | check-catalog | stop with install guidance |",
    "",
    "## Workflow Contract",
    "",
    "```playbook",
    "workflow:",
    `  id: ${slug}`,
    "  state_model: make-docs.workflow-state.v1",
    "  routing: linear",
    "steps:",
    "  - id: check-catalog",
    "    title: Check the playbook catalog",
    "    executor: cli",
    "    role: check",
    "    activation: sequential",
    "    mode: deterministic",
    "    requires: [make-docs-cli]",
    "    operation: playbook.catalog",
    "```",
    "",
    "## Step Guidance",
    "",
    "Run the catalog check and report the result.",
    "",
    "## Gates And Decisions",
    "",
    "- Stop when user review is required.",
    "",
    "## Outputs And Handoff",
    "",
    "- Record the catalog output.",
    "",
    "## Validation",
    "",
    "- The catalog check exits zero.",
    "",
    "## Packaging Notes",
    "",
    "No packaging hints.",
    "",
  ].join("\n");
}

describe("playbook.validate and playbook.catalog operations", () => {
  const tempRoots: string[] = [];

  afterEach(() => {
    for (const root of tempRoots.splice(0)) {
      cleanupTempDir(root);
    }
  });

  test("catalogs suffix and deprecated plain forms by canonical persona/slug with frontmatter identity", () => {
    const root = createTempDir("make-docs-playbook-contract-");
    tempRoots.push(root);
    writeFile(
      root,
      "docs/assets/playbooks/user/ship-docs.playbook.md",
      conformantPlaybook("user", "ship-docs", "Ship Docs"),
    );
    writePlaybook(root, "user", "legacy-flow", "run", "Legacy Flow");
    writeFile(root, "docs/assets/playbooks/user/notes.md", "# Not a playbook\n");

    const catalog = catalogPlaybooks({ repoRoot: root });

    expect(catalog.playbooksDir).toBe("docs/assets/playbooks");
    expect(catalog.entries.map((entry) => entry.ref)).toEqual([
      "user/legacy-flow",
      "user/ship-docs",
    ]);
    const shipDocs = catalog.entries.find((entry) => entry.ref === "user/ship-docs")!;
    expect(shipDocs).toEqual(
      expect.objectContaining({
        persona: "user",
        slug: "ship-docs",
        path: "docs/assets/playbooks/user/ship-docs.playbook.md",
        fileForm: "playbook-suffix",
        title: "Ship Docs",
        summary: "Ship Docs summary.",
        stack: "run",
        status: "accepted",
        schemaVersion: "make-docs.playbook.v1",
        workflowSchemaVersion: "make-docs.workflow.v1",
        runnable: true,
        errorCount: 0,
        warningCount: 0,
      }),
    );
    const legacy = catalog.entries.find((entry) => entry.ref === "user/legacy-flow")!;
    expect(legacy.fileForm).toBe("deprecated-plain");
    expect(legacy.runnable).toBe(false);
    expect(
      catalog.diagnostics.some(
        (diagnostic) =>
          diagnostic.code === "PB-FILE-007" &&
          diagnostic.severity === "warning" &&
          diagnostic.path === "docs/assets/playbooks/user/legacy-flow.md",
      ),
    ).toBe(true);
  });

  test("validates playbooks through the library and reports the full diagnostic set", () => {
    const root = createTempDir("make-docs-playbook-validate-");
    tempRoots.push(root);
    writeFile(
      root,
      "docs/assets/playbooks/user/ship-docs.playbook.md",
      conformantPlaybook("user", "ship-docs", "Ship Docs"),
    );
    writeFile(
      root,
      "docs/assets/playbooks/user/broken.playbook.md",
      conformantPlaybook("user", "broken", "Broken")
        .replace('stack: "run"\n', "")
        .replace("    requires: [make-docs-cli]\n    operation: playbook.catalog\n", ""),
    );

    const report = validatePlaybooks({ repoRoot: root });

    expect(report.playbookCount).toBe(2);
    expect(report.valid).toBe(false);
    const clean = report.results.find((result) => result.ref === "user/ship-docs")!;
    expect(clean.runnable).toBe(true);
    expect(clean.diagnostics).toEqual([]);
    const broken = report.results.find((result) => result.ref === "user/broken")!;
    expect(broken.runnable).toBe(false);
    expect(broken.errorCount).toBeGreaterThan(0);
    const codes = broken.diagnostics.map((diagnostic) => diagnostic.code);
    expect(codes).toContain("PB-FM-002");
    expect(codes).toContain("PB-WF-005");
    for (const diagnostic of broken.diagnostics) {
      expect(diagnostic.severity === "error" || diagnostic.severity === "warning").toBe(true);
      expect(diagnostic.message.length).toBeGreaterThan(0);
      expect(diagnostic.hint.length).toBeGreaterThan(0);
    }
    const missingStack = broken.diagnostics.find(
      (diagnostic) => diagnostic.code === "PB-FM-002" && diagnostic.field === "stack",
    );
    expect(missingStack).toBeDefined();
  });

  test("validates one playbook selected by canonical persona/slug ref", () => {
    const root = createTempDir("make-docs-playbook-validate-ref-");
    tempRoots.push(root);
    writeFile(
      root,
      "docs/assets/playbooks/user/ship-docs.playbook.md",
      conformantPlaybook("user", "ship-docs", "Ship Docs"),
    );
    writePlaybook(root, "user", "legacy-flow", "run", "Legacy Flow");

    const report = validatePlaybooks({ repoRoot: root, refs: ["user/ship-docs"] });

    expect(report.playbookCount).toBe(1);
    expect(report.results[0]).toEqual(
      expect.objectContaining({
        ref: "user/ship-docs",
        path: "docs/assets/playbooks/user/ship-docs.playbook.md",
        runnable: true,
        errorCount: 0,
      }),
    );
    expect(report.valid).toBe(true);

    expect(() => validatePlaybooks({ repoRoot: root, refs: ["user/missing"] })).toThrow(
      "No playbook found",
    );
  });
});
