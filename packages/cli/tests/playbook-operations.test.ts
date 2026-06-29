import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import {
  buildPlaybookCatalog,
  createPlaybookRunState,
  evaluateHarnessCapabilities,
  readPlaybookRunState,
  resolvePlaybook,
} from "../src/operations";
import { cleanupTempDir, createTempDir } from "./helpers";

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
      "---",
      "",
      playbookBody(title),
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

  test("creates Make Docs-owned run state with resolver and capability snapshots", () => {
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

    const result = createPlaybookRunState({
      repoRoot: root,
      ref: "user/use-system",
      requestedStack: "run",
      harness: "codex",
      runId: "root-run",
      outputSurfaceClaims: ["docs/assets/archive/history"],
      currentStep: "start",
      currentGate: "review",
      status: "paused",
      resumeHints: ["Resume after review."],
    });

    expect(result.statePath).toBe(path.join(root, ".make-docs/runs/playbooks/root-run/state.json"));
    expect(result.state).toEqual(
      expect.objectContaining({
        runId: "root-run",
        rootRunId: "root-run",
        parentRunId: null,
        playbookRef: "user/use-system",
        stack: "run",
        harness: "codex",
        currentStep: "start",
        currentGate: "review",
        childPolicy: "serial",
        outputSurfaceClaims: ["docs/assets/archive/history"],
        status: "paused",
        resumeHints: ["Resume after review."],
        stateSource: "make-docs",
        harnessAssistsAreSourceOfTruth: false,
      }),
    );
    expect(readPlaybookRunState({ repoRoot: root, runId: "root-run" }).runId).toBe("root-run");
  });

  test("requires parent permission before creating child playbook runs", () => {
    const root = createTempDir("make-docs-playbooks-");
    tempRoots.push(root);
    writePlaybook(root, "user", "parent", "run", "Parent");
    writePlaybook(root, "user", "child", "run", "Child");
    createPlaybookRunState({
      repoRoot: root,
      ref: "user/parent",
      requestedStack: "run",
      harness: "codex",
      runId: "parent-run",
    });

    expect(() => createPlaybookRunState({
      repoRoot: root,
      ref: "user/child",
      requestedStack: "run",
      harness: "codex",
      runId: "child-run",
      parentRunId: "parent-run",
    })).toThrow("does not permit child playbooks");
  });

  test("stops parallel child runs with overlapping output-surface claims", () => {
    const root = createTempDir("make-docs-playbooks-");
    tempRoots.push(root);
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
      ref: "user/parent",
      requestedStack: "run",
      harness: "codex",
      runId: "parent-run",
    });
    createPlaybookRunState({
      repoRoot: root,
      ref: "user/child-a",
      requestedStack: "run",
      harness: "codex",
      runId: "child-a",
      parentRunId: "parent-run",
      executionMode: "parallel",
      outputSurfaceClaims: ["docs/prd"],
    });

    expect(() => createPlaybookRunState({
      repoRoot: root,
      ref: "user/child-b",
      requestedStack: "run",
      harness: "codex",
      runId: "child-b",
      parentRunId: "parent-run",
      executionMode: "parallel",
      outputSurfaceClaims: ["docs/prd/29-revise-playbook-contract-run-playbook.md"],
    })).toThrow("output-surface claims overlap");
  });
});
