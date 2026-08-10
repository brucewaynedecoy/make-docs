import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import {
  advancePlaybookRun,
  closePlaybookRun,
  createPlaybookRunState,
  readPlaybookRunState,
  resumePlaybookRun,
} from "../src/operations";
import { loadSqliteDriver } from "../src/store";
import { cleanupTempDir, createTempDir, writeMinimalManifest } from "./helpers";

const sqliteAvailable = loadSqliteDriver().available;

/**
 * W18 R7 P4 Stage 1: the run-time guardrails (PRD 35 R-GUARD-1..4) and the
 * unchanged consumption of the reviewed `harnessCapabilities` records with
 * their unknown-capability handling (R-SCOPE-2, R-KEEP-1).
 */

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
    "- User request, then repo-local Make Docs contracts.",
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
    "- Assists are optional unless the playbook says otherwise.",
    "",
    "## Outputs and Handoff",
    "",
    "- Record the expected handoff artifact.",
    "",
    "## Validation",
    "",
    "- Confirm the workflow completed or report why it stopped.",
    "",
  ].join("\n");
}

/** A plain-form playbook with optional `run:` orchestration metadata. */
function writePlainPlaybook(
  root: string,
  slug: string,
  title: string,
  runMetadata: string[] = [],
): void {
  writeFile(
    root,
    `docs/assets/playbooks/user/${slug}.md`,
    [
      "---",
      `title: ${title}`,
      "kind: playbook",
      "status: accepted",
      "persona: user",
      "stack: run",
      `summary: ${title} summary.`,
      ...runMetadata,
      "---",
      "",
      playbookBody(title),
    ].join("\n"),
  );
}

/** A conformant suffix-form playbook wrapping the given workflow steps. */
function writeWorkflowPlaybook(
  root: string,
  slug: string,
  title: string,
  steps: string[],
  runMetadata: string[] = [],
): void {
  writeFile(
    root,
    `docs/assets/playbooks/user/${slug}.playbook.md`,
    [
      "---",
      `title: "${title}"`,
      'kind: "playbook"',
      'persona: "user"',
      'status: "accepted"',
      'stack: "run"',
      `summary: "${title} summary."`,
      'schema: "make-docs.playbook.v2"',
      'workflowSchema: "make-docs.workflow.v1"',
      ...runMetadata,
      "---",
      "",
      `# ${title}`,
      "",
      "## Purpose",
      "",
      "Exercise the run-time guardrails.",
      "",
      "## When To Use",
      "",
      "Use in guardrail tests.",
      "",
      "## Inputs",
      "",
      "- User direction first, then repo-local Make Docs contracts.",
      "",
      "## Dependencies",
      "",
      "```playbook",
      "dependencies:",
      "  - id: make-docs-cli",
      "    kind: cli",
      "    requirement: required",
      "    source: package install",
      "    used_by: [work]",
      "    fallback: stop with install guidance",
      "```",
      "",
      "## Workflow",
      "",
      "```playbook",
      "workflow:",
      `  id: ${slug}`,
      "  state_model: make-docs.workflow-state.v1",
      "  routing: linear",
      "steps:",
      ...steps,
      "```",
      "",
      "## Step Guidance",
      "",
      "Run the steps in order and report the results.",
      "",
      "## Gates",
      "",
      "- Stop at gates until a decision is recorded.",
      "",
      "## Outputs",
      "",
      "- Record the handoff artifact.",
      "",
      "## Validation",
      "",
      "- Every step reports an outcome.",
      "",
      "## Packaging Notes",
      "",
      "No packaging hints.",
      "",
    ].join("\n"),
  );
}

function writeReviewedParallelCapability(root: string, supported: boolean): void {
  writeFile(
    root,
    ".make-docs/config.yaml",
    [
      "harnessCapabilities:",
      "  - harness: codex",
      "    reviewStatus: reviewed",
      "    capabilities:",
      `      parallel_playbook_runs: ${supported}`,
      "",
    ].join("\n"),
  );
}

describe.skipIf(!sqliteAvailable)("run playbook guardrails (W18 R7 P4, R-GUARD-1..4)", () => {
  const tempRoots: string[] = [];

  afterEach(() => {
    for (const root of tempRoots.splice(0)) {
      cleanupTempDir(root);
    }
  });

  function createFixture(): { root: string; storeRoot: string; projectId: string } {
    const root = createTempDir("make-docs-guardrails-");
    const storeRoot = createTempDir("make-docs-guardrails-store-");
    tempRoots.push(root, storeRoot);
    const projectId = writeMinimalManifest(root);
    return { root, storeRoot, projectId };
  }

  function startRun(
    fixture: { root: string; storeRoot: string },
    ref: string,
    runId: string,
    extra: Partial<Parameters<typeof createPlaybookRunState>[0]> = {},
  ): ReturnType<typeof createPlaybookRunState> {
    return createPlaybookRunState({
      repoRoot: fixture.root,
      storeRoot: fixture.storeRoot,
      ref,
      requestedStack: "run",
      harness: "codex",
      runId,
      ...extra,
    });
  }

  test("child runs default to serial, link to the parent, and share the root run id through nesting depth (t1, R-GUARD-1)", () => {
    const fixture = createFixture();
    writePlainPlaybook(fixture.root, "parent", "Parent", ["run:", "  child_playbooks: serial"]);
    writePlainPlaybook(fixture.root, "child", "Child", ["run:", "  child_playbooks: serial"]);
    writePlainPlaybook(fixture.root, "grandchild", "Grandchild");

    startRun(fixture, "user/parent", "root-run");
    const child = startRun(fixture, "user/child", "child-run", { parentRunId: "root-run" });
    const grandchild = startRun(fixture, "user/grandchild", "grandchild-run", {
      parentRunId: "child-run",
    });

    // Serial is the default execution mode (R-GUARD-1).
    expect(child.state.executionMode).toBe("serial");
    expect(grandchild.state.executionMode).toBe("serial");
    // Every run in the tree shares the root run identifier.
    expect(child.state.parentRunId).toBe("root-run");
    expect(child.state.rootRunId).toBe("root-run");
    expect(grandchild.state.parentRunId).toBe("child-run");
    expect(grandchild.state.rootRunId).toBe("root-run");
    // The parent carries its child-run references.
    expect(child.parentState?.childRuns).toEqual([
      expect.objectContaining({ runId: "child-run", executionMode: "serial" }),
    ]);
    expect(grandchild.parentState?.childRuns).toEqual([
      expect.objectContaining({ runId: "grandchild-run" }),
    ]);
  });

  test("a closed parent cannot orchestrate new child runs (t1, R-GUARD-1)", () => {
    const fixture = createFixture();
    writePlainPlaybook(fixture.root, "parent", "Parent", ["run:", "  child_playbooks: serial"]);
    writePlainPlaybook(fixture.root, "child", "Child");
    startRun(fixture, "user/parent", "root-run");
    closePlaybookRun({
      repoRoot: fixture.root,
      storeRoot: fixture.storeRoot,
      runId: "root-run",
      terminalStatus: "completed",
    });

    expect(() =>
      startRun(fixture, "user/child", "child-run", { parentRunId: "root-run" }),
    ).toThrow(/closed run cannot orchestrate new child playbook runs/);
  });

  test("parallel children require capability support or a reviewed approval, naming the serial fallback (t2, R-GUARD-2)", () => {
    const fixture = createFixture();
    writePlainPlaybook(fixture.root, "parent", "Parent", ["run:", "  child_playbooks: parallel"]);
    writePlainPlaybook(fixture.root, "child", "Child");
    startRun(fixture, "user/parent", "root-run");

    // No reviewed harnessCapabilities record and no explicit approval: stop
    // for review with the serial default named.
    expect(() =>
      startRun(fixture, "user/child", "child-run", {
        parentRunId: "root-run",
        executionMode: "parallel",
        outputSurfaceClaims: ["docs/prd"],
      }),
    ).toThrow(/parallel-execution support[\s\S]*Start the child serially/);

    // The explicit reviewed approval is the alternative leg.
    const approved = startRun(fixture, "user/child", "child-run", {
      parentRunId: "root-run",
      executionMode: "parallel",
      outputSurfaceClaims: ["docs/prd"],
      parallelChildrenReviewed: true,
    });
    expect(approved.state.executionMode).toBe("parallel");
  });

  test("a reviewed record that does not support parallel runs still stops parallel children (t2, t5)", () => {
    const fixture = createFixture();
    writeReviewedParallelCapability(fixture.root, false);
    writePlainPlaybook(fixture.root, "parent", "Parent", ["run:", "  child_playbooks: parallel"]);
    writePlainPlaybook(fixture.root, "child", "Child");
    startRun(fixture, "user/parent", "root-run");

    expect(() =>
      startRun(fixture, "user/child", "child-run", {
        parentRunId: "root-run",
        executionMode: "parallel",
      }),
    ).toThrow(/parallel-execution support/);
  });

  test("run creation stops when claims overlap an unrelated open run and proceeds once it closes (t3, R-GUARD-3)", () => {
    const fixture = createFixture();
    writePlainPlaybook(fixture.root, "writer-a", "Writer A");
    writePlainPlaybook(fixture.root, "writer-b", "Writer B");
    startRun(fixture, "user/writer-a", "run-a", { outputSurfaceClaims: ["docs/prd"] });

    // Overlap includes nested-path claims, not only exact matches.
    expect(() =>
      startRun(fixture, "user/writer-b", "run-b", {
        outputSurfaceClaims: ["docs/prd/35-run-playbook-state-machine-and-portability.md"],
      }),
    ).toThrow(/stops rather than interleaving writes \(R-GUARD-3\)/);

    // The stop is about OPEN runs: once the claim holder closes, the same
    // claim is free again.
    closePlaybookRun({
      repoRoot: fixture.root,
      storeRoot: fixture.storeRoot,
      runId: "run-a",
      terminalStatus: "completed",
    });
    const second = startRun(fixture, "user/writer-b", "run-b", {
      outputSurfaceClaims: ["docs/prd/35-run-playbook-state-machine-and-portability.md"],
    });
    expect(second.state.runId).toBe("run-b");
  });

  test("a serial child may claim inside its parent's surfaces (t3 family rule)", () => {
    const fixture = createFixture();
    writePlainPlaybook(fixture.root, "parent", "Parent", ["run:", "  child_playbooks: serial"]);
    writePlainPlaybook(fixture.root, "child", "Child");
    startRun(fixture, "user/parent", "root-run", { outputSurfaceClaims: ["docs/prd"] });

    // A serial child suspends its parent, so the delegated overlap is safe.
    const child = startRun(fixture, "user/child", "child-run", {
      parentRunId: "root-run",
      outputSurfaceClaims: ["docs/prd/35-run-playbook-state-machine-and-portability.md"],
    });
    expect(child.state.rootRunId).toBe("root-run");
  });

  test("a step advance stops when its declared output surfaces overlap another open run's claims (t3, R-GUARD-3)", async () => {
    const fixture = createFixture();
    writeWorkflowPlaybook(fixture.root, "flow", "Flow", [
      "  - id: write-prd",
      "    title: Write the PRD",
      "    executor: agent",
      "    role: activity",
      "    activation: sequential",
      "    outputs: [docs/prd]",
      "    instructions: Write the PRD updates.",
    ]);
    writePlainPlaybook(fixture.root, "holder", "Holder");
    startRun(fixture, "user/flow", "flow-run");
    startRun(fixture, "user/holder", "holder-run", {
      outputSurfaceClaims: ["docs/prd/35-run-playbook-state-machine-and-portability.md"],
    });

    await expect(
      advancePlaybookRun({
        repoRoot: fixture.root,
        storeRoot: fixture.storeRoot,
        runId: "flow-run",
        outcome: "completed",
      }),
    ).rejects.toThrow(/declares output surface `docs\/prd`[\s\S]*R-GUARD-3/);

    // The refused advance left the run exactly where it was.
    const state = readPlaybookRunState({
      repoRoot: fixture.root,
      storeRoot: fixture.storeRoot,
      runId: "flow-run",
    });
    expect(state.cursor).toEqual({ kind: "step", id: "write-prd" });
    expect(state.stepStatuses).toEqual([{ stepId: "write-prd", status: "pending" }]);
  });

  test("an unattended run auto-approves only gates that permit unattended continuation and holds at the rest (t4, R-GUARD-4)", async () => {
    const fixture = createFixture();
    writeWorkflowPlaybook(
      fixture.root,
      "night",
      "Night",
      [
        "  - id: prepare",
        "    title: Prepare the change",
        "    executor: agent",
        "    role: activity",
        "    activation: sequential",
        "    instructions: Prepare the change.",
        "  - id: auto-gate",
        "    title: Automated checks gate",
        "    executor: human",
        "    role: gate",
        "    activation: sequential",
        "    instructions: Automated checks must pass.",
        "    gate:",
        "      resolved_by: user",
        "      evidence: check output",
        "      unattended: true",
        "  - id: human-gate",
        "    title: Human review gate",
        "    executor: human",
        "    role: gate",
        "    activation: sequential",
        "    instructions: A human must review.",
        "    gate:",
        "      resolved_by: user",
        "      evidence: review note",
        "      unattended: false",
        "  - id: record",
        "    title: Record the handoff",
        "    executor: agent",
        "    role: activity",
        "    activation: sequential",
        "    instructions: Record the handoff artifact.",
      ],
      ["run:", "  unattended: true"],
    );
    startRun(fixture, "user/night", "night-run", { unattended: true });

    const { state } = await advancePlaybookRun({
      repoRoot: fixture.root,
      storeRoot: fixture.storeRoot,
      runId: "night-run",
      outcome: "completed",
    });

    // The permitting gate proceeded without a human, with the decision and
    // evidence recorded; the non-permitting gate holds the run.
    expect(state.gateDecisions).toEqual([
      expect.objectContaining({ gateId: "auto-gate", decision: "approve" }),
    ]);
    expect(state.evidenceLog).toEqual([
      expect.objectContaining({ scope: "step", subjectId: "prepare", outcome: "completed" }),
      expect.objectContaining({
        scope: "gate",
        subjectId: "auto-gate",
        outcome: "approve",
        note: expect.stringContaining("unattended"),
      }),
    ]);
    expect(state.stepStatuses).toEqual([
      { stepId: "prepare", status: "completed" },
      { stepId: "auto-gate", status: "completed" },
      { stepId: "human-gate", status: "waiting-for-user" },
      { stepId: "record", status: "pending" },
    ]);
    expect(state.cursor).toEqual({ kind: "gate", id: "human-gate" });
    expect(state.status).toBe("waiting-for-user");
    expect(state.resumeHints.join(" ")).toContain("does not permit unattended continuation");
  });

  test("the unattended opt-in fails closed when the playbook does not declare it (t4, R-GUARD-4)", () => {
    const fixture = createFixture();
    writePlainPlaybook(fixture.root, "attended", "Attended");

    expect(() =>
      startRun(fixture, "user/attended", "attended-run", { unattended: true }),
    ).toThrow(/does not declare unattended support/);
  });

  test("unknown required capabilities block the run at start and stop advance and resume with manual-review guidance (t5, R-SCOPE-2, R-KEEP-1)", async () => {
    const fixture = createFixture();
    // No harnessCapabilities record exists: the required capability is
    // UNKNOWN, never guessed (R-KEEP-1).
    writePlainPlaybook(fixture.root, "assisted", "Assisted", [
      "run:",
      "  requires_capabilities:",
      "    - goal_managed_execution",
    ]);

    const { state } = startRun(fixture, "user/assisted", "assisted-run");
    expect(state.capabilitySnapshot.status).toBe("manual-review-required");
    expect(state.status).toBe("blocked");
    expect(state.resumeHints.join(" ")).toContain("goal_managed_execution");

    await expect(
      advancePlaybookRun({
        repoRoot: fixture.root,
        storeRoot: fixture.storeRoot,
        runId: "assisted-run",
        outcome: "completed",
      }),
    ).rejects.toThrow(/manual capability review/);
    expect(() =>
      resumePlaybookRun({
        repoRoot: fixture.root,
        storeRoot: fixture.storeRoot,
        runId: "assisted-run",
      }),
    ).toThrow(/manual capability review/);

    // A stopped run can always be finalized.
    const closed = closePlaybookRun({
      repoRoot: fixture.root,
      storeRoot: fixture.storeRoot,
      runId: "assisted-run",
      terminalStatus: "cancelled",
    });
    expect(closed.terminalStatus).toBe("cancelled");
  });

  test("unavailable optional capabilities fall back to serial gated execution with recorded guidance (t5, R-KEEP-1)", () => {
    const fixture = createFixture();
    writeReviewedParallelCapability(fixture.root, false);
    writePlainPlaybook(fixture.root, "prefers", "Prefers", [
      "run:",
      "  prefers_capabilities:",
      "    - parallel_playbook_runs",
    ]);

    const { state } = startRun(fixture, "user/prefers", "prefers-run");
    expect(state.capabilitySnapshot.status).toBe("serial-gated-fallback");
    // The run is NOT blocked: optional capabilities degrade, never stop.
    expect(state.status).toBe("pending");
    expect(state.resumeHints.join(" ")).toContain("serial gated execution");
  });
});
