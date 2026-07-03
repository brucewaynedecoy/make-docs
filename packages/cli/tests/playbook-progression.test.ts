import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import {
  advancePlaybookRun,
  closePlaybookRun,
  computePlaybookRunNext,
  createPlaybookRunState,
  readPlaybookRunState,
  recordPlaybookRunGate,
  resumePlaybookRun,
} from "../src/operations";
import { createExecutionContext, OperationWriteDeniedError } from "../src/operations/context";
import { invokeOperation } from "../src/operations/registry";
import { loadSqliteDriver } from "../src/store";
import { cleanupTempDir, collectFiles, createTempDir, writeMinimalManifest } from "./helpers";

const sqliteAvailable = loadSqliteDriver().available;

function writeFile(root: string, relativePath: string, content: string): string {
  const absolutePath = path.join(root, relativePath);
  mkdirSync(path.dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, content, "utf8");
  return absolutePath;
}

/** A conformant W18 R6 suffix-form playbook wrapping the given workflow steps. */
function workflowPlaybook(input: {
  slug: string;
  title: string;
  routing: "linear" | "graph";
  steps: string[];
}): string {
  return [
    "---",
    `title: "${input.title}"`,
    'kind: "playbook"',
    'persona: "user"',
    'status: "accepted"',
    'stack: "run"',
    `summary: "${input.title} summary."`,
    'schemaVersion: "make-docs.playbook.v1"',
    'workflowSchemaVersion: "make-docs.workflow.v1"',
    "---",
    "",
    `# ${input.title}`,
    "",
    "## Purpose",
    "",
    "Exercise the progression engine.",
    "",
    "## When To Use",
    "",
    "Use in progression tests.",
    "",
    "## Inputs And Authority",
    "",
    "- User direction first, then repo-local Make Docs contracts.",
    "",
    "## Dependencies",
    "",
    "| ID | Kind | Requirement | Source | Used By | Fallback |",
    "| --- | --- | --- | --- | --- | --- |",
    "| make-docs-cli | cli | required | package install | check | stop with install guidance |",
    "",
    "## Workflow Contract",
    "",
    "```playbook",
    "workflow:",
    `  id: ${input.slug}`,
    "  state_model: make-docs.workflow-state.v1",
    `  routing: ${input.routing}`,
    "steps:",
    ...input.steps,
    "```",
    "",
    "## Step Guidance",
    "",
    "Run the steps in order and report the results.",
    "",
    "## Gates And Decisions",
    "",
    "- Stop at gates until a decision is recorded.",
    "",
    "## Outputs And Handoff",
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
  ].join("\n");
}

/**
 * Linear workflow: `check` (deterministic cli step requiring make-docs-cli),
 * `review` (human gate), `hook` (event-bound, never cursor-eligible), and
 * `record` (delegated agent step).
 */
const LINEAR_STEPS = [
  "  - id: check",
  "    title: Check the playbook catalog",
  "    executor: cli",
  "    role: check",
  "    activation: sequential",
  "    mode: deterministic",
  "    requires: [make-docs-cli]",
  "    operation: playbook.catalog",
  "  - id: review",
  "    title: Review the catalog output",
  "    executor: human",
  "    role: gate",
  "    activation: sequential",
  "    mode: delegated",
  "    instructions: Review the catalog output and approve or reject.",
  "    gate:",
  "      resolved_by: user",
  "      evidence: review note",
  "      unattended: false",
  "  - id: hook",
  "    title: React to commits",
  "    executor: agent",
  "    role: activity",
  "    activation: event-bound",
  "    event: on-pre-commit",
  "    instructions: React to the commit event.",
  "  - id: record",
  "    title: Record the handoff",
  "    executor: agent",
  "    role: activity",
  "    activation: sequential",
  "    instructions: Record the handoff artifact.",
];

/** Graph workflow: `build` routes to `verify` on success and `remediate` on failure. */
const GRAPH_STEPS = [
  "  - id: build",
  "    title: Build the artifact",
  "    executor: cli",
  "    role: activity",
  "    activation: sequential",
  "    mode: deterministic",
  "    operation: playbook.catalog",
  "    routing:",
  "      on_success: verify",
  "      on_failure: remediate",
  "  - id: remediate",
  "    title: Fix the build",
  "    executor: agent",
  "    role: activity",
  "    activation: sequential",
  "    instructions: Fix the build and rerun it.",
  "    routing:",
  "      on_success: verify",
  "  - id: verify",
  "    title: Verify the artifact",
  "    executor: cli",
  "    role: check",
  "    activation: sequential",
  "    mode: deterministic",
  "    operation: playbook.validate",
  "    routing:",
  "      stop: true",
];

describe.skipIf(!sqliteAvailable)("run playbook progression engine (W18 R7 P2)", () => {
  const tempRoots: string[] = [];

  afterEach(() => {
    for (const root of tempRoots.splice(0)) {
      cleanupTempDir(root);
    }
  });

  function createFixture(input: { routing: "linear" | "graph"; steps: string[] }): {
    root: string;
    storeRoot: string;
    projectId: string;
    playbookPath: string;
  } {
    const root = createTempDir("make-docs-progression-");
    const storeRoot = createTempDir("make-docs-progression-store-");
    tempRoots.push(root, storeRoot);
    const projectId = writeMinimalManifest(root);
    const playbookPath = writeFile(
      root,
      "docs/assets/playbooks/user/flow.playbook.md",
      workflowPlaybook({ slug: "flow", title: "Flow", routing: input.routing, steps: input.steps }),
    );
    return { root, storeRoot, projectId, playbookPath };
  }

  function startRun(
    fixture: { root: string; storeRoot: string },
    runId = "run-1",
  ): ReturnType<typeof createPlaybookRunState> {
    return createPlaybookRunState({
      repoRoot: fixture.root,
      storeRoot: fixture.storeRoot,
      ref: "user/flow",
      requestedStack: "run",
      harness: "codex",
      runId,
    });
  }

  test("start seeds the initial cursor at the first sequential workflow step (t4)", () => {
    const fixture = createFixture({ routing: "linear", steps: LINEAR_STEPS });
    const { state } = startRun(fixture);
    expect(state.cursor).toEqual({ kind: "step", id: "check" });
    expect(state.sourceDigest).toMatch(/^[0-9a-f]{64}$/);
    expect(state.capabilitySnapshot.harness).toBe("codex");
    expect(state.dependencyAvailability).toEqual([
      expect.objectContaining({ id: "make-docs-cli", availability: "unknown" }),
    ]);
    expect(state.evidenceLog).toEqual([]);
  });

  test("start skips event-bound steps when seeding the initial cursor", () => {
    const fixture = createFixture({
      routing: "linear",
      steps: [
        "  - id: hook-first",
        "    title: React to session start",
        "    executor: agent",
        "    role: activity",
        "    activation: event-bound",
        "    event: on-session-start",
        "    instructions: React to the session event.",
        ...LINEAR_STEPS,
      ],
    });
    const { state } = startRun(fixture);
    expect(state.cursor).toEqual({ kind: "step", id: "check" });
  });

  test("next computes the current executable step with zero side effects (t1, t2, R-OP-3)", () => {
    const fixture = createFixture({ routing: "linear", steps: LINEAR_STEPS });
    startRun(fixture);
    const repoFilesBefore = collectFiles(fixture.root);
    const stateBefore = readPlaybookRunState({
      repoRoot: fixture.root,
      storeRoot: fixture.storeRoot,
      runId: "run-1",
    });

    const report = computePlaybookRunNext({
      repoRoot: fixture.root,
      storeRoot: fixture.storeRoot,
      runId: "run-1",
    });

    expect(report.position).toBe("step");
    expect(report.eligible).toBe(true);
    expect(report.cursor).toEqual({ kind: "step", id: "check" });
    expect(report.next).toEqual(
      expect.objectContaining({
        stepId: "check",
        executor: "cli",
        role: "check",
        mode: "deterministic",
        stepStatus: "pending",
        // The invocation references the stable registry identifier (R-SCOPE-1).
        invocation: expect.objectContaining({ form: "operation", operation: "playbook.catalog" }),
        requires: [
          { id: "make-docs-cli", requirement: "required", availability: "unknown" },
        ],
      }),
    );
    expect(report.guidance.join(" ")).toContain("unknown availability");

    // playbook.next never writes run state and never touches the repository.
    const repeat = computePlaybookRunNext({
      repoRoot: fixture.root,
      storeRoot: fixture.storeRoot,
      runId: "run-1",
    });
    expect(repeat).toEqual(report);
    expect(
      readPlaybookRunState({ repoRoot: fixture.root, storeRoot: fixture.storeRoot, runId: "run-1" }),
    ).toEqual(stateBefore);
    expect(collectFiles(fixture.root)).toEqual(repoFilesBefore);
  });

  test("a step whose mode is unspecified reports the delegated default (R-MODE-2)", () => {
    const fixture = createFixture({ routing: "linear", steps: LINEAR_STEPS });
    startRun(fixture);
    advancePlaybookRun({
      repoRoot: fixture.root,
      storeRoot: fixture.storeRoot,
      runId: "run-1",
      outcome: "completed",
    });
    recordPlaybookRunGate({
      repoRoot: fixture.root,
      storeRoot: fixture.storeRoot,
      runId: "run-1",
      decision: "approve",
    });

    const report = computePlaybookRunNext({
      repoRoot: fixture.root,
      storeRoot: fixture.storeRoot,
      runId: "run-1",
    });
    expect(report.next?.stepId).toBe("record");
    expect(report.next?.mode).toBe("delegated");
  });

  test("advance records evidence, transitions the step, and computes the next cursor (t5)", () => {
    const fixture = createFixture({ routing: "linear", steps: LINEAR_STEPS });
    startRun(fixture);
    const repoFilesBefore = collectFiles(fixture.root);

    const state = advancePlaybookRun({
      repoRoot: fixture.root,
      storeRoot: fixture.storeRoot,
      runId: "run-1",
      stepId: "check",
      outcome: "completed",
      evidenceRefs: ["docs/prd/35-revise-run-playbook-state-machine.md", "run-log.txt"],
      outputRefs: ["docs/assets/artifacts/flow-report.md"],
      note: "Catalog check passed.",
    });

    expect(state.stepStatuses).toEqual([
      { stepId: "check", status: "completed" },
      { stepId: "review", status: "pending" },
      { stepId: "hook", status: "pending" },
      { stepId: "record", status: "pending" },
    ]);
    expect(state.evidenceLog).toEqual([
      {
        scope: "step",
        subjectId: "check",
        outcome: "completed",
        recordedAt: expect.any(String),
        refs: ["docs/prd/35-revise-run-playbook-state-machine.md", "run-log.txt"],
        note: "Catalog check passed.",
      },
    ]);
    expect(state.evidenceRefs).toEqual([
      "docs/prd/35-revise-run-playbook-state-machine.md",
      "run-log.txt",
    ]);
    expect(state.outputRefs).toEqual(["docs/assets/artifacts/flow-report.md"]);
    // The successor is the gate, so the run waits for the decision.
    expect(state.cursor).toEqual({ kind: "gate", id: "review" });
    expect(state.status).toBe("waiting-for-user");
    expect(state.terminalStatus).toBeNull();
    // No repository path gained run state (R-STORE-1).
    expect(collectFiles(fixture.root)).toEqual(repoFilesBefore);
  });

  test("next reports a gate position with the gate semantics surfaced", () => {
    const fixture = createFixture({ routing: "linear", steps: LINEAR_STEPS });
    startRun(fixture);
    advancePlaybookRun({
      repoRoot: fixture.root,
      storeRoot: fixture.storeRoot,
      runId: "run-1",
      outcome: "completed",
    });

    const report = computePlaybookRunNext({
      repoRoot: fixture.root,
      storeRoot: fixture.storeRoot,
      runId: "run-1",
    });
    expect(report.position).toBe("gate");
    expect(report.cursor).toEqual({ kind: "gate", id: "review" });
    expect(report.next?.gate).toEqual({
      resolvedBy: "user",
      evidence: "review note",
      unattended: false,
    });
    expect(report.guidance.join(" ")).toContain("playbook.gate");
  });

  test("gate approve records the decision with evidence and unblocks past the gate (t6)", () => {
    const fixture = createFixture({ routing: "linear", steps: LINEAR_STEPS });
    startRun(fixture);
    advancePlaybookRun({
      repoRoot: fixture.root,
      storeRoot: fixture.storeRoot,
      runId: "run-1",
      outcome: "completed",
    });

    const state = recordPlaybookRunGate({
      repoRoot: fixture.root,
      storeRoot: fixture.storeRoot,
      runId: "run-1",
      gateId: "review",
      decision: "approve",
      evidenceRefs: ["review-note.md"],
      note: "Reviewed and approved.",
    });

    expect(state.gateDecisions).toEqual([
      {
        gateId: "review",
        decision: "approve",
        decidedAt: expect.any(String),
        evidenceRefs: ["review-note.md"],
      },
    ]);
    expect(state.evidenceLog.at(-1)).toEqual(
      expect.objectContaining({ scope: "gate", subjectId: "review", outcome: "approve" }),
    );
    expect(state.stepStatuses).toEqual(
      expect.arrayContaining([{ stepId: "review", status: "completed" }]),
    );
    // The event-bound `hook` step is skipped: sequential progression lands on `record`.
    expect(state.cursor).toEqual({ kind: "step", id: "record" });
    expect(state.status).toBe("running");
  });

  test("gate reject records the decision and stops the run (t6)", () => {
    const fixture = createFixture({ routing: "linear", steps: LINEAR_STEPS });
    startRun(fixture);
    advancePlaybookRun({
      repoRoot: fixture.root,
      storeRoot: fixture.storeRoot,
      runId: "run-1",
      outcome: "completed",
    });

    const state = recordPlaybookRunGate({
      repoRoot: fixture.root,
      storeRoot: fixture.storeRoot,
      runId: "run-1",
      decision: "reject",
      evidenceRefs: ["review-note.md"],
    });

    expect(state.status).toBe("blocked");
    expect(state.cursor).toEqual({ kind: "gate", id: "review" });
    expect(state.gateDecisions.at(-1)).toEqual(
      expect.objectContaining({ gateId: "review", decision: "reject" }),
    );
    expect(state.stepStatuses).toEqual(
      expect.arrayContaining([{ stepId: "review", status: "blocked" }]),
    );
    expect(state.resumeHints.join(" ")).toContain("rejected");

    const report = computePlaybookRunNext({
      repoRoot: fixture.root,
      storeRoot: fixture.storeRoot,
      runId: "run-1",
    });
    expect(report.position).toBe("blocked");
    expect(report.eligible).toBe(false);
  });

  test("a failed step without a failure route blocks and can be retried after resume", () => {
    const fixture = createFixture({ routing: "linear", steps: LINEAR_STEPS });
    startRun(fixture);

    const failed = advancePlaybookRun({
      repoRoot: fixture.root,
      storeRoot: fixture.storeRoot,
      runId: "run-1",
      outcome: "failed",
      evidenceRefs: ["failure-log.txt"],
    });
    expect(failed.status).toBe("blocked");
    expect(failed.cursor).toEqual({ kind: "step", id: "check" });
    expect(failed.stepStatuses).toEqual(
      expect.arrayContaining([{ stepId: "check", status: "failed" }]),
    );
    expect(failed.resumeHints.join(" ")).toContain("failed");

    const resumed = resumePlaybookRun({
      repoRoot: fixture.root,
      storeRoot: fixture.storeRoot,
      runId: "run-1",
      resumeHints: ["Retrying after fixing the catalog."],
    });
    expect(resumed.status).toBe("running");
    expect(resumed.cursor).toEqual({ kind: "step", id: "check" });
    expect(resumed.resumeHints).toContain("Retrying after fixing the catalog.");
    expect(resumed.evidenceLog.at(-1)).toEqual(
      expect.objectContaining({ scope: "resume", subjectId: "run-1", outcome: "running" }),
    );

    const retried = advancePlaybookRun({
      repoRoot: fixture.root,
      storeRoot: fixture.storeRoot,
      runId: "run-1",
      outcome: "completed",
    });
    expect(retried.cursor).toEqual({ kind: "gate", id: "review" });
    expect(retried.stepStatuses).toEqual(
      expect.arrayContaining([{ stepId: "check", status: "completed" }]),
    );
  });

  test("resume is a Phase 2 shell: it does not block on a changed source digest yet", () => {
    const fixture = createFixture({ routing: "linear", steps: LINEAR_STEPS });
    startRun(fixture);
    advancePlaybookRun({
      repoRoot: fixture.root,
      storeRoot: fixture.storeRoot,
      runId: "run-1",
      outcome: "failed",
    });
    // Change the Playbook source after the run captured its digest. The
    // digest-checked block is the W18 R7 Phase 3 seam in resumePlaybookRun;
    // Phase 2 deliberately reopens without comparing digests.
    writeFile(
      fixture.root,
      "docs/assets/playbooks/user/flow.playbook.md",
      `${workflowPlaybook({ slug: "flow", title: "Flow", routing: "linear", steps: LINEAR_STEPS })}\n<!-- amended -->\n`,
    );

    const resumed = resumePlaybookRun({
      repoRoot: fixture.root,
      storeRoot: fixture.storeRoot,
      runId: "run-1",
    });
    expect(resumed.status).toBe("running");
  });

  test("graph routing follows on_failure, on_success, and stop declarations (t2, t5)", () => {
    const fixture = createFixture({ routing: "graph", steps: GRAPH_STEPS });
    const { state } = startRun(fixture);
    expect(state.routingModel).toBe("graph");
    expect(state.cursor).toEqual({ kind: "step", id: "build" });

    const rerouted = advancePlaybookRun({
      repoRoot: fixture.root,
      storeRoot: fixture.storeRoot,
      runId: "run-1",
      outcome: "failed",
      evidenceRefs: ["build-log.txt"],
    });
    expect(rerouted.cursor).toEqual({ kind: "step", id: "remediate" });
    expect(rerouted.status).toBe("running");
    expect(rerouted.stepStatuses).toEqual(
      expect.arrayContaining([{ stepId: "build", status: "failed" }]),
    );

    const remediated = advancePlaybookRun({
      repoRoot: fixture.root,
      storeRoot: fixture.storeRoot,
      runId: "run-1",
      outcome: "completed",
    });
    expect(remediated.cursor).toEqual({ kind: "step", id: "verify" });

    const verified = advancePlaybookRun({
      repoRoot: fixture.root,
      storeRoot: fixture.storeRoot,
      runId: "run-1",
      outcome: "completed",
    });
    // `stop: true` drops the cursor; only playbook.close finalizes.
    expect(verified.cursor).toBeNull();
    expect(verified.status).toBe("waiting-for-user");
    expect(verified.terminalStatus).toBeNull();
    expect(verified.resumeHints.join(" ")).toContain("playbook.close");

    const report = computePlaybookRunNext({
      repoRoot: fixture.root,
      storeRoot: fixture.storeRoot,
      runId: "run-1",
    });
    expect(report.position).toBe("closeable");
    expect(report.next).toBeNull();
  });

  test("close finalizes with a terminal status and closeout evidence, exactly once (t7)", () => {
    const fixture = createFixture({ routing: "linear", steps: LINEAR_STEPS });
    startRun(fixture);

    const closed = closePlaybookRun({
      repoRoot: fixture.root,
      storeRoot: fixture.storeRoot,
      runId: "run-1",
      terminalStatus: "cancelled",
      evidenceRefs: ["closeout-note.md"],
      note: "Cancelled before execution.",
    });
    expect(closed.status).toBe("cancelled");
    expect(closed.terminalStatus).toBe("cancelled");
    expect(closed.cursor).toBeNull();
    expect(closed.evidenceLog.at(-1)).toEqual(
      expect.objectContaining({
        scope: "close",
        subjectId: "run-1",
        outcome: "cancelled",
        refs: ["closeout-note.md"],
      }),
    );
    expect(closed.evidenceRefs).toContain("closeout-note.md");

    // A closed run refuses every further transition (t8).
    const input = { repoRoot: fixture.root, storeRoot: fixture.storeRoot, runId: "run-1" };
    expect(() => closePlaybookRun({ ...input, terminalStatus: "completed" })).toThrow(
      /closed with terminal status `cancelled`/,
    );
    expect(() => advancePlaybookRun({ ...input, outcome: "completed" })).toThrow(
      /cannot be advanced/,
    );
    expect(() => recordPlaybookRunGate({ ...input, decision: "approve" })).toThrow(
      /cannot be gated/,
    );
    expect(() => resumePlaybookRun(input)).toThrow(/cannot be resumed/);

    const report = computePlaybookRunNext(input);
    expect(report.position).toBe("closed");
    expect(report.eligible).toBe(false);
    expect(report.next).toBeNull();
  });

  test("advance refuses gate cursors, cursor mismatches, and cursorless runs (t8 hygiene)", () => {
    const fixture = createFixture({ routing: "linear", steps: LINEAR_STEPS });
    startRun(fixture);
    const input = { repoRoot: fixture.root, storeRoot: fixture.storeRoot, runId: "run-1" };

    expect(() => advancePlaybookRun({ ...input, stepId: "record", outcome: "completed" })).toThrow(
      /not the current cursor step `check`/,
    );
    expect(() => recordPlaybookRunGate({ ...input, decision: "approve" })).toThrow(
      /not positioned at a gate/,
    );

    advancePlaybookRun({ ...input, outcome: "completed" });
    expect(() => advancePlaybookRun({ ...input, outcome: "completed" })).toThrow(
      /record the decision with `playbook\.gate`/,
    );
    expect(() =>
      recordPlaybookRunGate({ ...input, gateId: "check", decision: "approve" }),
    ).toThrow(/not the current cursor gate `review`/);
  });

  test("progression requires the parsed workflow model for pseudo-cursor legacy runs (t3)", () => {
    const root = createTempDir("make-docs-progression-plain-");
    const storeRoot = createTempDir("make-docs-progression-plain-store-");
    tempRoots.push(root, storeRoot);
    writeMinimalManifest(root);
    writeFile(
      root,
      "docs/assets/playbooks/user/plain.md",
      [
        "---",
        "title: Plain",
        "kind: playbook",
        "status: accepted",
        "persona: user",
        "stack: run",
        "summary: Plain summary.",
        "---",
        "",
        "# Plain",
        "",
        "## Purpose",
        "",
        "Use this playbook when the matching workflow goal is active.",
        "",
        "## Inputs and Authority",
        "",
        "- User request.",
        "",
        "## Procedure",
        "",
        "1. Resolve the playbook.",
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
        "- Record the expected output or handoff artifact.",
        "",
        "## Validation",
        "",
        "- Confirm the workflow completed or report why it stopped.",
        "",
      ].join("\n"),
    );
    createPlaybookRunState({
      repoRoot: root,
      storeRoot,
      ref: "user/plain",
      requestedStack: "run",
      harness: "codex",
      runId: "plain-run",
      currentStep: "procedure-1",
    });

    expect(() =>
      computePlaybookRunNext({ repoRoot: root, storeRoot, runId: "plain-run" }),
    ).toThrow(/no parsed workflow contract steps/);
    // Without a pseudo cursor a plain run simply reports closeable.
    createPlaybookRunState({
      repoRoot: root,
      storeRoot,
      ref: "user/plain",
      requestedStack: "run",
      harness: "codex",
      runId: "plain-run-2",
    });
    expect(
      computePlaybookRunNext({ repoRoot: root, storeRoot, runId: "plain-run-2" }).position,
    ).toBe("closeable");
  });

  test("the progression operations dispatch through the registry with uniform gating (t9, t10)", async () => {
    const fixture = createFixture({ routing: "linear", steps: LINEAR_STEPS });
    startRun(fixture);
    const input = {
      repoRoot: fixture.root,
      storeRoot: fixture.storeRoot,
      runId: "run-1",
    };

    // Reads execute without write permission; writes refuse without it.
    const readContext = createExecutionContext({ surface: "test", cwd: fixture.root });
    const next = await invokeOperation("playbook.next", input, readContext);
    expect((next.value as { position: string }).position).toBe("step");
    await expect(
      invokeOperation("playbook.advance", { ...input, outcome: "completed" }, readContext),
    ).rejects.toBeInstanceOf(OperationWriteDeniedError);

    const writeContext = createExecutionContext({
      surface: "test",
      cwd: fixture.root,
      writesAllowed: true,
    });
    const advanced = await invokeOperation(
      "playbook.advance",
      { ...input, outcome: "completed", evidenceRefs: ["registry-evidence.md"] },
      writeContext,
    );
    expect((advanced.value as { cursor: unknown }).cursor).toEqual({
      kind: "gate",
      id: "review",
    });
    const gated = await invokeOperation(
      "playbook.gate",
      { ...input, decision: "approve" },
      writeContext,
    );
    expect((gated.value as { status: string }).status).toBe("running");
    const closed = await invokeOperation(
      "playbook.close",
      { ...input, terminalStatus: "completed" },
      writeContext,
    );
    expect((closed.value as { terminalStatus: string }).terminalStatus).toBe("completed");
  });
});
