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
import { loadSqliteDriver, withStoreDatabase } from "../src/store";
import { cleanupTempDir, collectFiles, createTempDir, writeMinimalManifest } from "./helpers";

const sqliteAvailable = loadSqliteDriver().available;

/*
 * R-TEST-1 coverage matrix (W18 R7 P5 t1) — every progression operation has
 * success AND failure transition coverage. Tests live in this file unless a
 * file is named.
 *
 * playbook.start
 * - success: "start seeds the initial cursor…", "start skips event-bound
 *   steps…"; store keying + R-STATE-1 record content (playbook-operations);
 *   MCP end-to-end (mcp-derivation).
 * - failure: duplicate run id, unminted project identity, retired status
 *   vocabulary (playbook-operations); guardrail stops — closed parent,
 *   parallel capability, overlap at creation, unattended fail-closed,
 *   unknown required capability (playbook-run-guardrails); write-permission
 *   refusal (registry-playbook-ops).
 *
 * playbook.status
 * - success: readPlaybookRunState throughout this file; MCP status read
 *   (mcp-derivation).
 * - failure: missing manifest (playbook-operations); missing run id ("every
 *   progression operation fails closed on a missing run id").
 *
 * playbook.next
 * - success: "next computes the current executable step…", gate/blocked/
 *   closeable/closed position reports.
 * - failure: missing run id; pseudo-cursor legacy run without a parsed
 *   workflow ("progression requires the parsed workflow model…").
 *
 * playbook.advance
 * - success: reported-outcome, deterministic operation/command, presented
 *   command, delegated hold + report, manual acknowledgment tests.
 * - failure: failing deterministic command blocks; cursor mismatch, gate
 *   cursor, mutually exclusive flags; closed run; stale run; manual step
 *   without acknowledgment; missing run id; output-surface overlap stop and
 *   capability block (playbook-run-guardrails); write gating
 *   (registry-playbook-ops).
 *
 * playbook.gate
 * - success: "gate approve records the decision…", "gate reject records the
 *   decision…", unattended auto-approve (playbook-run-guardrails).
 * - failure: not positioned at a gate, wrong gate id; closed run; stale run;
 *   missing run id; write gating (registry-playbook-ops).
 *
 * playbook.resume
 * - success: digest match ("a failed step without a failure route…"),
 *   explicit migration opt-in.
 * - failure: digest mismatch blocks with the change named (two tests);
 *   closed run; capability block (playbook-run-guardrails); missing run id;
 *   write gating (registry-playbook-ops).
 *
 * playbook.close
 * - success: "close finalizes with a terminal status…"; tier-three closeout
 *   (playbook-three-tiers).
 * - failure: already-closed run refuses a second close; missing run id;
 *   write gating (registry-playbook-ops).
 */

/** The raw stored run-record row, unparsed, for byte-identical comparisons (t2). */
function readRawRunRecord(
  storeRoot: string,
  projectId: string,
  runId: string,
): { record: string; updatedAt: string } | undefined {
  return withStoreDatabase(storeRoot, (db) =>
    db
      .prepare("SELECT record, updated_at AS updatedAt FROM playbook_runs WHERE project_id = ? AND run_id = ?")
      .get(projectId, runId),
  ) as { record: string; updatedAt: string } | undefined;
}

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
    'schema: "make-docs.playbook.v2"',
    'workflowSchema: "make-docs.workflow.v1"',
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
    "    used_by: [check]",
    "    fallback: stop with install guidance",
    "```",
    "",
    "## Workflow",
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
  ].join("\n");
}

/**
 * Linear workflow: `check` (deterministic cli step requiring make-docs-cli),
 * `review` (human gate), `hook` (event-bound, never cursor-eligible), and
 * `record` (agent step with NO declared mode: the R-MODE-2 delegated default).
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

/** LINEAR_STEPS with the trailing `record` step swapped for a new `extra` step (digest-mismatch fixture). */
const CHANGED_LINEAR_STEPS = [
  ...LINEAR_STEPS.slice(0, LINEAR_STEPS.indexOf("  - id: record")),
  "  - id: extra",
  "    title: Extra follow-up",
  "    executor: agent",
  "    role: activity",
  "    activation: sequential",
  "    instructions: Perform the extra follow-up.",
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

/** Deterministic external-command steps (R-MODE-1 `command` form). */
function commandSteps(run: string): string[] {
  return [
    "  - id: shell",
    "    title: Run the shell check",
    "    executor: script",
    "    role: check",
    "    activation: sequential",
    "    mode: deterministic",
    "    command:",
    `      run: ${run}`,
    "  - id: wrap",
    "    title: Wrap up",
    "    executor: agent",
    "    role: activity",
    "    activation: sequential",
    "    instructions: Wrap up the run.",
  ];
}

/** A manual (documentation-only) step ahead of a delegated wrap-up step. */
const MANUAL_STEPS = [
  "  - id: read-notes",
  "    title: Read the release notes",
  "    executor: human",
  "    role: activity",
  "    activation: sequential",
  "    mode: manual",
  "    instructions: Read the release notes before continuing.",
  "  - id: wrap",
  "    title: Wrap up",
  "    executor: agent",
  "    role: activity",
  "    activation: sequential",
  "    instructions: Wrap up the run.",
];

describe.skipIf(!sqliteAvailable)("run playbook progression engine (W18 R7 P2/P3)", () => {
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
    expect(state.staleness).toBeNull();
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
    const rawBefore = readRawRunRecord(fixture.storeRoot, fixture.projectId, "run-1");
    expect(rawBefore).toBeDefined();

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
    // The STORED record is byte-identical, not merely deep-equal after
    // parsing: the raw JSON text and its updated-at stamp are untouched
    // (R-OP-3, R-TEST-1).
    const rawAfter = readRawRunRecord(fixture.storeRoot, fixture.projectId, "run-1");
    expect(rawAfter?.record).toBe(rawBefore?.record);
    expect(rawAfter?.updatedAt).toBe(rawBefore?.updatedAt);
    expect(collectFiles(fixture.root)).toEqual(repoFilesBefore);
  });

  test("every progression operation fails closed on a missing run id (t1, R-TEST-1)", async () => {
    const fixture = createFixture({ routing: "linear", steps: LINEAR_STEPS });
    const input = { repoRoot: fixture.root, storeRoot: fixture.storeRoot, runId: "missing-run" };
    const missing = /No Playbook run state found for run id `missing-run`\./;

    // status
    expect(() => readPlaybookRunState(input)).toThrow(missing);
    // next
    expect(() => computePlaybookRunNext(input)).toThrow(missing);
    // advance
    await expect(advancePlaybookRun({ ...input, outcome: "completed" })).rejects.toThrow(missing);
    // gate
    expect(() => recordPlaybookRunGate({ ...input, decision: "approve" })).toThrow(missing);
    // resume
    expect(() => resumePlaybookRun(input)).toThrow(missing);
    // close
    expect(() => closePlaybookRun({ ...input, terminalStatus: "cancelled" })).toThrow(missing);
  });

  test("a step whose mode is unspecified reports the delegated default (R-MODE-2)", async () => {
    const fixture = createFixture({ routing: "linear", steps: LINEAR_STEPS });
    startRun(fixture);
    await advancePlaybookRun({
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

  test("advance records a reported outcome with evidence and computes the next cursor (t5, P3 t1/t2 loop-closer)", async () => {
    const fixture = createFixture({ routing: "linear", steps: LINEAR_STEPS });
    startRun(fixture);
    const repoFilesBefore = collectFiles(fixture.root);

    const { state, execution } = await advancePlaybookRun({
      repoRoot: fixture.root,
      storeRoot: fixture.storeRoot,
      runId: "run-1",
      stepId: "check",
      outcome: "completed",
      evidenceRefs: ["docs/prd/35-revise-run-playbook-state-machine.md", "run-log.txt"],
      outputRefs: ["docs/assets/artifacts/flow-report.md"],
      note: "Catalog check passed.",
    });

    // A reported outcome on a deterministic step is the by-hand report: the
    // engine records it instead of executing (R-MODE-1, R-TIER-1).
    expect(execution).toEqual({
      stepId: "check",
      mode: "deterministic",
      action: "recorded",
      outcome: "completed",
      presentedCommand: null,
      instructions: null,
      executionEvidence: null,
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

  test("deterministic advance executes the step operation through the operation core (P3 t1)", async () => {
    const fixture = createFixture({ routing: "linear", steps: LINEAR_STEPS });
    startRun(fixture);

    const { state, execution } = await advancePlaybookRun({
      repoRoot: fixture.root,
      storeRoot: fixture.storeRoot,
      runId: "run-1",
    });

    expect(execution.action).toBe("executed-operation");
    expect(execution.mode).toBe("deterministic");
    expect(execution.outcome).toBe("completed");
    expect(execution.executionEvidence).toEqual(
      expect.objectContaining({
        form: "operation",
        operation: "playbook.catalog",
        command: null,
        exitCode: null,
        errorMessage: null,
      }),
    );
    // The structured result of the operation ran against this run's repo.
    expect(execution.executionEvidence?.resultSummary).toContain("user/flow");

    // The structured result is captured as run evidence and the run
    // transitions automatically (R-MODE-1).
    expect(state.stepStatuses).toEqual(
      expect.arrayContaining([{ stepId: "check", status: "completed" }]),
    );
    expect(state.evidenceLog.at(-1)).toEqual(
      expect.objectContaining({
        scope: "step",
        subjectId: "check",
        outcome: "completed",
        execution: expect.objectContaining({ form: "operation", operation: "playbook.catalog" }),
      }),
    );
    expect(state.cursor).toEqual({ kind: "gate", id: "review" });
    expect(state.status).toBe("waiting-for-user");
  });

  test("deterministic advance executes an external command through the shell (P3 t1)", async () => {
    const fixture = createFixture({
      routing: "linear",
      steps: commandSteps("node -e \"console.log('shell-ok')\""),
    });
    startRun(fixture);

    const { state, execution } = await advancePlaybookRun({
      repoRoot: fixture.root,
      storeRoot: fixture.storeRoot,
      runId: "run-1",
    });

    expect(execution.action).toBe("executed-command");
    expect(execution.outcome).toBe("completed");
    expect(execution.executionEvidence).toEqual(
      expect.objectContaining({
        form: "command",
        operation: null,
        command: "node -e \"console.log('shell-ok')\"",
        exitCode: 0,
        errorMessage: null,
        truncated: false,
      }),
    );
    expect(execution.executionEvidence?.stdoutTail).toContain("shell-ok");
    expect(state.stepStatuses).toEqual(
      expect.arrayContaining([{ stepId: "shell", status: "completed" }]),
    );
    expect(state.cursor).toEqual({ kind: "step", id: "wrap" });
    expect(state.status).toBe("running");
  });

  test("a failing deterministic command records failed evidence and blocks without a failure route (P3 t1)", async () => {
    const fixture = createFixture({
      routing: "linear",
      steps: commandSteps("node -e \"console.error('shell-broke'); process.exit(3)\""),
    });
    startRun(fixture);

    const { state, execution } = await advancePlaybookRun({
      repoRoot: fixture.root,
      storeRoot: fixture.storeRoot,
      runId: "run-1",
    });

    expect(execution.action).toBe("executed-command");
    expect(execution.outcome).toBe("failed");
    expect(execution.executionEvidence).toEqual(
      expect.objectContaining({ form: "command", exitCode: 3 }),
    );
    expect(execution.executionEvidence?.stderrTail).toContain("shell-broke");
    // The failure transitions exactly like a reported failure: no failure
    // route in a linear workflow means the run blocks at the step.
    expect(state.stepStatuses).toEqual(
      expect.arrayContaining([{ stepId: "shell", status: "failed" }]),
    );
    expect(state.cursor).toEqual({ kind: "step", id: "shell" });
    expect(state.status).toBe("blocked");
    expect(state.evidenceLog.at(-1)).toEqual(
      expect.objectContaining({
        outcome: "failed",
        execution: expect.objectContaining({ exitCode: 3 }),
      }),
    );
  });

  test("the CLI-absent deterministic path presents the derived human command form (P3 t2, R-TIER-1)", async () => {
    const fixture = createFixture({ routing: "linear", steps: LINEAR_STEPS });
    startRun(fixture);

    const presented = await advancePlaybookRun({
      repoRoot: fixture.root,
      storeRoot: fixture.storeRoot,
      runId: "run-1",
      present: true,
    });

    // The command form derives from the operation registry identifier —
    // never a hand-maintained string.
    expect(presented.execution.action).toBe("presented-command");
    expect(presented.execution.presentedCommand).toBe("make-docs run playbook catalog");
    expect(presented.execution.outcome).toBeNull();
    // The step holds for the by-hand execution; the cursor does not move.
    expect(presented.state.cursor).toEqual({ kind: "step", id: "check" });
    expect(presented.state.status).toBe("waiting-for-user");
    expect(presented.state.stepStatuses).toEqual(
      expect.arrayContaining([{ stepId: "check", status: "waiting-for-user" }]),
    );
    expect(presented.state.evidenceLog.at(-1)).toEqual(
      expect.objectContaining({
        scope: "step",
        subjectId: "check",
        outcome: "waiting-for-user",
        note: expect.stringContaining("make-docs run playbook catalog"),
      }),
    );
    expect(presented.state.resumeHints.join(" ")).toContain("make-docs run playbook catalog");

    // A repeated presentation holds again without duplicating the evidence.
    const repeated = await advancePlaybookRun({
      repoRoot: fixture.root,
      storeRoot: fixture.storeRoot,
      runId: "run-1",
      present: true,
    });
    expect(repeated.state.evidenceLog).toHaveLength(presented.state.evidenceLog.length);

    // The reader ran the command by hand; a later advance reports the outcome.
    const reported = await advancePlaybookRun({
      repoRoot: fixture.root,
      storeRoot: fixture.storeRoot,
      runId: "run-1",
      outcome: "completed",
      evidenceRefs: ["by-hand-transcript.txt"],
    });
    expect(reported.execution.action).toBe("recorded");
    expect(reported.state.cursor).toEqual({ kind: "gate", id: "review" });
  });

  test("delegated advance presents instructions and holds until a reported outcome (P3 t3, t5)", async () => {
    const fixture = createFixture({ routing: "linear", steps: LINEAR_STEPS });
    startRun(fixture);
    await advancePlaybookRun({
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

    // `record` declares no mode: the R-MODE-2 default is delegated.
    const held = await advancePlaybookRun({
      repoRoot: fixture.root,
      storeRoot: fixture.storeRoot,
      runId: "run-1",
    });
    expect(held.execution).toEqual(
      expect.objectContaining({
        stepId: "record",
        mode: "delegated",
        action: "presented-instructions",
        outcome: null,
        presentedCommand: null,
        // The same instructions are usable directly without the CLI.
        instructions: "Record the handoff artifact.",
      }),
    );
    expect(held.state.cursor).toEqual({ kind: "step", id: "record" });
    expect(held.state.status).toBe("waiting-for-user");
    expect(held.state.stepStatuses).toEqual(
      expect.arrayContaining([{ stepId: "record", status: "waiting-for-user" }]),
    );

    // The run advances only on a subsequent advance carrying the reported
    // outcome and evidence (R-MODE-1).
    const reported = await advancePlaybookRun({
      repoRoot: fixture.root,
      storeRoot: fixture.storeRoot,
      runId: "run-1",
      outcome: "completed",
      evidenceRefs: ["handoff-artifact.md"],
      note: "Handoff recorded.",
    });
    expect(reported.execution.action).toBe("recorded");
    expect(reported.state.stepStatuses).toEqual(
      expect.arrayContaining([{ stepId: "record", status: "completed" }]),
    );
    expect(reported.state.cursor).toBeNull();
    expect(reported.state.evidenceLog.at(-1)).toEqual(
      expect.objectContaining({
        subjectId: "record",
        outcome: "completed",
        refs: ["handoff-artifact.md"],
      }),
    );
  });

  test("manual advance records acknowledgment only and executes nothing (P3 t4)", async () => {
    const fixture = createFixture({ routing: "linear", steps: MANUAL_STEPS });
    startRun(fixture);
    const input = { repoRoot: fixture.root, storeRoot: fixture.storeRoot, runId: "run-1" };

    // Without the acknowledgment flag a manual step refuses to move —
    // including via a reported outcome, because nothing executes (R-MODE-1).
    await expect(advancePlaybookRun(input)).rejects.toThrow(/documentation only/);
    await expect(advancePlaybookRun({ ...input, outcome: "completed" })).rejects.toThrow(
      /documentation only/,
    );

    const acknowledged = await advancePlaybookRun({ ...input, acknowledge: true });
    expect(acknowledged.execution).toEqual({
      stepId: "read-notes",
      mode: "manual",
      action: "acknowledged",
      outcome: "completed",
      presentedCommand: null,
      instructions: null,
      executionEvidence: null,
    });
    expect(acknowledged.state.stepStatuses).toEqual(
      expect.arrayContaining([{ stepId: "read-notes", status: "completed" }]),
    );
    expect(acknowledged.state.cursor).toEqual({ kind: "step", id: "wrap" });
    // Acknowledgment on a non-manual step is refused.
    await expect(advancePlaybookRun({ ...input, acknowledge: true })).rejects.toThrow(
      /acknowledgment is recorded only for `manual` steps/,
    );
  });

  test("next reports a gate position with the gate semantics surfaced", async () => {
    const fixture = createFixture({ routing: "linear", steps: LINEAR_STEPS });
    startRun(fixture);
    await advancePlaybookRun({
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

  test("gate approve records the decision with evidence and unblocks past the gate (t6)", async () => {
    const fixture = createFixture({ routing: "linear", steps: LINEAR_STEPS });
    startRun(fixture);
    await advancePlaybookRun({
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

  test("gate reject records the decision and stops the run (t6)", async () => {
    const fixture = createFixture({ routing: "linear", steps: LINEAR_STEPS });
    startRun(fixture);
    await advancePlaybookRun({
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

  test("a failed step without a failure route blocks and can be retried after resume", async () => {
    const fixture = createFixture({ routing: "linear", steps: LINEAR_STEPS });
    startRun(fixture);

    const failed = await advancePlaybookRun({
      repoRoot: fixture.root,
      storeRoot: fixture.storeRoot,
      runId: "run-1",
      outcome: "failed",
      evidenceRefs: ["failure-log.txt"],
    });
    expect(failed.state.status).toBe("blocked");
    expect(failed.state.cursor).toEqual({ kind: "step", id: "check" });
    expect(failed.state.stepStatuses).toEqual(
      expect.arrayContaining([{ stepId: "check", status: "failed" }]),
    );
    expect(failed.state.resumeHints.join(" ")).toContain("failed");

    // The source is unchanged, so the digest-checked resume re-enters at the
    // stored cursor (R-RESUME-1 match case).
    const resumed = resumePlaybookRun({
      repoRoot: fixture.root,
      storeRoot: fixture.storeRoot,
      runId: "run-1",
      resumeHints: ["Retrying after fixing the catalog."],
    });
    expect(resumed.status).toBe("running");
    expect(resumed.cursor).toEqual({ kind: "step", id: "check" });
    expect(resumed.staleness).toBeNull();
    expect(resumed.resumeHints).toContain("Retrying after fixing the catalog.");
    expect(resumed.evidenceLog.at(-1)).toEqual(
      expect.objectContaining({ scope: "resume", subjectId: "run-1", outcome: "running" }),
    );

    const retried = await advancePlaybookRun({
      repoRoot: fixture.root,
      storeRoot: fixture.storeRoot,
      runId: "run-1",
      outcome: "completed",
    });
    expect(retried.state.cursor).toEqual({ kind: "gate", id: "review" });
    expect(retried.state.stepStatuses).toEqual(
      expect.arrayContaining([{ stepId: "check", status: "completed" }]),
    );
  });

  test("resume with a mismatched digest marks the run stale, blocks, and names the change (P3 t6, t7)", async () => {
    const fixture = createFixture({ routing: "linear", steps: LINEAR_STEPS });
    const { state: started } = startRun(fixture);
    const input = { repoRoot: fixture.root, storeRoot: fixture.storeRoot, runId: "run-1" };

    // Change the Playbook source after the run captured its digest: the
    // `record` step is removed and an `extra` step is added.
    writeFile(
      fixture.root,
      "docs/assets/playbooks/user/flow.playbook.md",
      workflowPlaybook({ slug: "flow", title: "Flow", routing: "linear", steps: CHANGED_LINEAR_STEPS }),
    );

    // The diagnostic names the change: both digests plus the step-level diff.
    expect(() => resumePlaybookRun(input)).toThrow(/is stale/);
    let diagnostic = "";
    try {
      resumePlaybookRun(input);
    } catch (error) {
      diagnostic = (error as Error).message;
    }
    expect(diagnostic).toContain(started.sourceDigest);
    expect(diagnostic).toContain("added: `extra`");
    expect(diagnostic).toContain("removed: `record`");
    expect(diagnostic).toContain("never silently re-enters a changed workflow");
    expect(diagnostic).toContain("playbook.start");
    expect(diagnostic).toContain("migrate");

    // The run is durably marked stale and blocked; the mismatch is evidence.
    const stale = readPlaybookRunState(input);
    expect(stale.status).toBe("blocked");
    expect(stale.staleness).toEqual({
      detectedAt: expect.any(String),
      storedDigest: started.sourceDigest,
      currentDigest: expect.stringMatching(/^[0-9a-f]{64}$/),
      addedStepIds: ["extra"],
      removedStepIds: ["record"],
    });
    expect(stale.staleness?.currentDigest).not.toBe(started.sourceDigest);
    expect(stale.evidenceLog.at(-1)).toEqual(
      expect.objectContaining({ scope: "resume", outcome: "blocked" }),
    );

    // A stale run refuses step and gate transitions until re-planned or migrated.
    await expect(advancePlaybookRun({ ...input, outcome: "completed" })).rejects.toThrow(
      /is stale against its Playbook source/,
    );
    expect(() => recordPlaybookRunGate({ ...input, decision: "approve" })).toThrow(
      /is stale against its Playbook source/,
    );

    // Reverting the source restores the digest match: resume clears the marker.
    writeFile(
      fixture.root,
      "docs/assets/playbooks/user/flow.playbook.md",
      workflowPlaybook({ slug: "flow", title: "Flow", routing: "linear", steps: LINEAR_STEPS }),
    );
    const recovered = resumePlaybookRun(input);
    expect(recovered.staleness).toBeNull();
    expect(recovered.status).toBe("running");
    expect(recovered.cursor).toEqual({ kind: "step", id: "check" });
  });

  test("a prose-only source change still blocks resume and says the step ids are unchanged (P3 t7)", () => {
    const fixture = createFixture({ routing: "linear", steps: LINEAR_STEPS });
    startRun(fixture);
    const input = { repoRoot: fixture.root, storeRoot: fixture.storeRoot, runId: "run-1" };
    writeFile(
      fixture.root,
      "docs/assets/playbooks/user/flow.playbook.md",
      `${workflowPlaybook({ slug: "flow", title: "Flow", routing: "linear", steps: LINEAR_STEPS })}\n<!-- amended -->\n`,
    );

    expect(() => resumePlaybookRun(input)).toThrow(
      /no workflow step identifiers were added or removed/,
    );
    const stale = readPlaybookRunState(input);
    expect(stale.status).toBe("blocked");
    expect(stale.staleness).toEqual(
      expect.objectContaining({ addedStepIds: [], removedStepIds: [] }),
    );
  });

  test("resume migration is an explicit opt-in that re-maps still-present steps (P3 t8, R-RESUME-2)", async () => {
    const fixture = createFixture({ routing: "linear", steps: LINEAR_STEPS });
    const { state: started } = startRun(fixture);
    const input = { repoRoot: fixture.root, storeRoot: fixture.storeRoot, runId: "run-1" };
    writeFile(
      fixture.root,
      "docs/assets/playbooks/user/flow.playbook.md",
      workflowPlaybook({ slug: "flow", title: "Flow", routing: "linear", steps: CHANGED_LINEAR_STEPS }),
    );

    const migrated = resumePlaybookRun({ ...input, migrate: true });

    // Still-present step identifiers keep their statuses; added steps seed
    // pending; removed steps drop; the surviving cursor stays put.
    expect(migrated.stepStatuses).toEqual([
      { stepId: "check", status: "pending" },
      { stepId: "review", status: "pending" },
      { stepId: "hook", status: "pending" },
      { stepId: "extra", status: "pending" },
    ]);
    expect(migrated.cursor).toEqual({ kind: "step", id: "check" });
    expect(migrated.status).toBe("running");
    expect(migrated.staleness).toBeNull();
    expect(migrated.sourceDigest).not.toBe(started.sourceDigest);
    expect(migrated.sourceDigest).toMatch(/^[0-9a-f]{64}$/);
    expect(migrated.evidenceLog.at(-1)).toEqual(
      expect.objectContaining({
        scope: "resume",
        note: expect.stringContaining("migrated"),
      }),
    );
    expect(migrated.evidenceLog.at(-1)?.note).toContain("added: `extra`");
    expect(migrated.evidenceLog.at(-1)?.note).toContain("removed: `record`");

    // The migrated run progresses against the current workflow.
    const advanced = await advancePlaybookRun({ ...input, outcome: "completed" });
    expect(advanced.state.cursor).toEqual({ kind: "gate", id: "review" });
  });

  test("graph routing follows on_failure, on_success, and stop declarations (t2, t5)", async () => {
    const fixture = createFixture({ routing: "graph", steps: GRAPH_STEPS });
    const { state } = startRun(fixture);
    expect(state.routingModel).toBe("graph");
    expect(state.cursor).toEqual({ kind: "step", id: "build" });

    const rerouted = await advancePlaybookRun({
      repoRoot: fixture.root,
      storeRoot: fixture.storeRoot,
      runId: "run-1",
      outcome: "failed",
      evidenceRefs: ["build-log.txt"],
    });
    expect(rerouted.state.cursor).toEqual({ kind: "step", id: "remediate" });
    expect(rerouted.state.status).toBe("running");
    expect(rerouted.state.stepStatuses).toEqual(
      expect.arrayContaining([{ stepId: "build", status: "failed" }]),
    );

    const remediated = await advancePlaybookRun({
      repoRoot: fixture.root,
      storeRoot: fixture.storeRoot,
      runId: "run-1",
      outcome: "completed",
    });
    expect(remediated.state.cursor).toEqual({ kind: "step", id: "verify" });

    const verified = await advancePlaybookRun({
      repoRoot: fixture.root,
      storeRoot: fixture.storeRoot,
      runId: "run-1",
      outcome: "completed",
    });
    // `stop: true` drops the cursor; only playbook.close finalizes.
    expect(verified.state.cursor).toBeNull();
    expect(verified.state.status).toBe("waiting-for-user");
    expect(verified.state.terminalStatus).toBeNull();
    expect(verified.state.resumeHints.join(" ")).toContain("playbook.close");

    const report = computePlaybookRunNext({
      repoRoot: fixture.root,
      storeRoot: fixture.storeRoot,
      runId: "run-1",
    });
    expect(report.position).toBe("closeable");
    expect(report.next).toBeNull();
  });

  test("close finalizes with a terminal status and closeout evidence, exactly once (t7)", async () => {
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
    await expect(advancePlaybookRun({ ...input, outcome: "completed" })).rejects.toThrow(
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

  test("advance refuses gate cursors, cursor mismatches, and cursorless runs (t8 hygiene)", async () => {
    const fixture = createFixture({ routing: "linear", steps: LINEAR_STEPS });
    startRun(fixture);
    const input = { repoRoot: fixture.root, storeRoot: fixture.storeRoot, runId: "run-1" };

    await expect(
      advancePlaybookRun({ ...input, stepId: "record", outcome: "completed" }),
    ).rejects.toThrow(/not the current cursor step `check`/);
    expect(() => recordPlaybookRunGate({ ...input, decision: "approve" })).toThrow(
      /not positioned at a gate/,
    );
    // Presenting and reporting in the same call is refused.
    await expect(
      advancePlaybookRun({ ...input, outcome: "completed", present: true }),
    ).rejects.toThrow(/mutually exclusive/);

    await advancePlaybookRun({ ...input, outcome: "completed" });
    await expect(advancePlaybookRun({ ...input, outcome: "completed" })).rejects.toThrow(
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
    const advancedResult = advanced.value as {
      state: { cursor: unknown };
      execution: { action: string };
    };
    expect(advancedResult.execution.action).toBe("recorded");
    expect(advancedResult.state.cursor).toEqual({ kind: "gate", id: "review" });
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

  // -------------------------------------------------------------------------
  // Resume-hint retirement (W18 R12 P2; PRD 41 R-FIX-2, R-TEST-3, register
  // item D-016): hints are subject-scoped current guidance retired on every
  // mutating transition once their subject resolves; close retires them all;
  // the evidence log is never touched by any hint operation.
  // -------------------------------------------------------------------------

  test("hints retire as their subjects resolve and close retires them all (R-TEST-3, D-016)", async () => {
    const fixture = createFixture({ routing: "linear", steps: LINEAR_STEPS });
    startRun(fixture);
    const input = { repoRoot: fixture.root, storeRoot: fixture.storeRoot, runId: "run-1" };

    await advancePlaybookRun({ ...input, outcome: "completed" });
    recordPlaybookRunGate({ ...input, decision: "approve" });

    // The delegated `record` step holds and appends its subject-scoped hint.
    const held = await advancePlaybookRun(input);
    const waitingHint = held.state.resumeHints.find((hint) => hint.includes("`record`"));
    expect(waitingHint).toBeDefined();
    expect(held.state.hintSubjects).toEqual({ [waitingHint!]: "record" });

    // Advancing past the delegated step retires its waiting hint (the
    // R-TEST-3 bar) while the evidence log only grows.
    const evidenceBefore = JSON.stringify(held.state.evidenceLog);
    const advanced = await advancePlaybookRun({ ...input, outcome: "completed" });
    expect(advanced.state.resumeHints.some((hint) => hint.includes("`record`"))).toBe(false);
    // What replaced it is the run-scoped close guidance only.
    expect(advanced.state.resumeHints).toEqual([
      "All reachable workflow steps are resolved; finalize the run with `playbook.close`.",
    ]);
    expect(advanced.state.hintSubjects).toEqual({});
    // The pre-retirement evidence log rides unchanged as a byte-identical
    // prefix, and the step's waiting-for-user record survives as history.
    expect(
      JSON.stringify(advanced.state.evidenceLog.slice(0, held.state.evidenceLog.length)),
    ).toBe(evidenceBefore);
    expect(
      advanced.state.evidenceLog.some(
        (record) => record.subjectId === "record" && record.outcome === "waiting-for-user",
      ),
    ).toBe(true);

    // Close retires ALL guidance hints: the closed record carries none, and
    // the evidence log is untouched except for the appended close record.
    const closed = closePlaybookRun({ ...input, terminalStatus: "completed" });
    expect(closed.resumeHints).toEqual([]);
    expect(closed.hintSubjects).toEqual({});
    expect(
      JSON.stringify(closed.evidenceLog.slice(0, advanced.state.evidenceLog.length)),
    ).toBe(JSON.stringify(advanced.state.evidenceLog));
    expect(closed.evidenceLog.at(-1)).toEqual(expect.objectContaining({ scope: "close" }));
  });

  test("a failed delegated step swaps its waiting hint for current failure guidance (R-FIX-2)", async () => {
    const fixture = createFixture({ routing: "linear", steps: LINEAR_STEPS });
    startRun(fixture);
    const input = { repoRoot: fixture.root, storeRoot: fixture.storeRoot, runId: "run-1" };
    await advancePlaybookRun({ ...input, outcome: "completed" });
    recordPlaybookRunGate({ ...input, decision: "approve" });
    const held = await advancePlaybookRun(input);
    expect(held.state.resumeHints.some((hint) => hint.includes("waiting for its executor"))).toBe(true);

    // The failure resolves the waiting subject: the stale waiting hint
    // retires and only the fresh failure guidance survives, subject-scoped.
    const failed = await advancePlaybookRun({ ...input, outcome: "failed" });
    expect(failed.state.resumeHints.some((hint) => hint.includes("waiting for its executor"))).toBe(false);
    expect(failed.state.resumeHints).toEqual([
      "Step `record` failed; resume with `playbook.resume` to retry via `playbook.advance`, or finalize with `playbook.close`.",
    ]);
    expect(failed.state.hintSubjects).toEqual({ [failed.state.resumeHints[0]!]: "record" });
  });

  test("a rejected gate's hint retires when the gate is later approved (R-FIX-2)", async () => {
    const fixture = createFixture({ routing: "linear", steps: LINEAR_STEPS });
    startRun(fixture);
    const input = { repoRoot: fixture.root, storeRoot: fixture.storeRoot, runId: "run-1" };
    await advancePlaybookRun({ ...input, outcome: "completed" });

    const rejected = recordPlaybookRunGate({ ...input, decision: "reject" });
    const rejectHint = rejected.resumeHints.find((hint) => hint.includes("rejected"));
    expect(rejectHint).toBeDefined();
    expect(rejected.hintSubjects).toEqual({ [rejectHint!]: "review" });

    // Approving the gate resolves the subject; the stale reject hint retires
    // on the same transition, while the gate decisions and evidence remain.
    const approved = recordPlaybookRunGate({ ...input, decision: "approve" });
    expect(approved.resumeHints.some((hint) => hint.includes("rejected"))).toBe(false);
    expect(approved.gateDecisions.map((decision) => decision.decision)).toEqual([
      "reject",
      "approve",
    ]);
    expect(
      approved.evidenceLog.filter((record) => record.scope === "gate").map((record) => record.outcome),
    ).toEqual(["reject", "approve"]);
  });

  test("pre-change run records without hint subjects load, resume, and close cleanly (PRD 38 additive migration)", () => {
    const fixture = createFixture({ routing: "linear", steps: LINEAR_STEPS });
    const { projectId } = startRun(fixture);

    // Simulate a pre-W18 R12 persisted record: legacy hints, no
    // `hintSubjects` field (the additive-serialization migration path).
    withStoreDatabase(fixture.storeRoot, (db) => {
      const row = db
        .prepare("SELECT record FROM playbook_runs WHERE project_id = ? AND run_id = ?")
        .get(projectId, "run-1") as { record: string };
      const record = JSON.parse(row.record) as Record<string, unknown>;
      delete record.hintSubjects;
      record.resumeHints = ["Delegated step `check` is waiting for its executor."];
      db.prepare("UPDATE playbook_runs SET record = ? WHERE project_id = ? AND run_id = ?").run(
        JSON.stringify(record),
        projectId,
        "run-1",
      );
    });

    // The legacy record loads and resumes: its hints carry no subject, so
    // they read as run-scoped guidance and survive until close.
    const resumed = resumePlaybookRun({
      repoRoot: fixture.root,
      storeRoot: fixture.storeRoot,
      runId: "run-1",
    });
    expect(resumed.resumeHints).toContain("Delegated step `check` is waiting for its executor.");

    const closed = closePlaybookRun({
      repoRoot: fixture.root,
      storeRoot: fixture.storeRoot,
      runId: "run-1",
      terminalStatus: "cancelled",
    });
    expect(closed.resumeHints).toEqual([]);
    expect(closed.hintSubjects).toEqual({});
  });
});
