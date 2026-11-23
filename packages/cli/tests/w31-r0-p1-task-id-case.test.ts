/**
 * W31 R0 P1: every reader accepts `t` and `T` as the same task ID
 * (PRD 14 R-COORD-22, PRD 51 R-BACKLOG-SNAPSHOT-33).
 *
 * The same phase body is written three times: with lower-case IDs, with
 * upper-case IDs, and with a mix. Each reader must report the same facts for
 * all three. Every fixture lives in a temporary root, never in a real Store.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, test } from "vitest";

import { buildPhasePlan, parseWorkPhase, resolveWaveTarget } from "../src/operations";
import { buildBacklogSnapshot } from "../src/operations/work/backlog";
import { parseWorkProjectUri } from "../src/operations/work/work-store";

const FIXED_NOW = new Date("2042-07-01T12:00:00.000Z");
const NO_GIT = () => ({ status: 128, stdout: "", stderr: "fatal: not a git repository", errorCode: null });
const RECORD = "docs/work/2042-06-01-w1-r0-task-case";

type Letters = readonly [string, string, string, string];
const CASES: Record<"lower" | "upper" | "mixed", Letters> = {
  lower: ["t", "t", "t", "t"],
  upper: ["T", "T", "T", "T"],
  mixed: ["T", "t", "T", "t"],
};

const roots: string[] = [];

afterEach(() => {
  while (roots.length > 0) rmSync(roots.pop()!, { recursive: true, force: true });
});

function write(targetRoot: string, relative: string, contents: string): string {
  const absolute = path.join(targetRoot, ...relative.split("/"));
  mkdirSync(path.dirname(absolute), { recursive: true });
  writeFileSync(absolute, contents, "utf8");
  return absolute;
}

function phaseBody(letters: Letters): string {
  const [a, b, c, d] = letters;
  return `---
title: "Phase 1: Task Case"
kind: "work"
status: "active"
coordinate: "W1 R0 P1"
---

# Phase 1: Task Case

## Stage 1 - First

### Tasks

- [x] ${a}1: Write the first part.
- [ ] ${b}2: Write the second part.

### Acceptance criteria

- The parts exist.

### Dependencies

- None.

## Stage 2 - Second

### Tasks

- [ ] ${c}3: Check the parts.
- [X] ${d}4: Record the check.

### Acceptance criteria

- The check is recorded.

### Dependencies

- Stage 1.
`;
}

const INDEX = `---
title: "Task Case"
kind: "work"
status: "active"
coordinate: "W1 R0"
---

# Task Case

## Phase Map

| Phase | File |
| --- | --- |
| P1 | [Task case](01-task-case.md) |
`;

function fixture(letters: Letters): { root: string; phase: string } {
  const root = mkdtempSync(path.join(tmpdir(), "make-docs-w31-task-case-"));
  roots.push(root);
  execFileSync("git", ["init"], { cwd: root, stdio: "ignore" });
  write(root, ".make-docs/config.yaml", "projectId: fixture-project\n");
  write(root, `${RECORD}/00-index.md`, INDEX);
  const phase = write(root, `${RECORD}/01-task-case.md`, phaseBody(letters));
  return { root, phase };
}

function workPhaseFacts(phase: string) {
  const state = parseWorkPhase(phase);
  return {
    tasks: state.tasks.map((task) => ({
      id: task.id.toUpperCase(),
      checked: task.checked,
      text: task.text,
      line: task.line,
      stage: task.stage,
    })),
    stages: state.stages.map((stage) => [stage.name, stage.tasks.length]),
    isComplete: state.isComplete,
    uncheckedTaskCount: state.uncheckedTasks.length,
    warnings: state.warnings,
  };
}

function snapshotFacts(root: string) {
  const snapshot = buildBacklogSnapshot(root, { now: () => FIXED_NOW, runGit: NO_GIT });
  const record = snapshot.records.find((entry) => entry.scope === "live")!;
  return {
    tasks: record.phases.flatMap((phase) =>
      phase.tasks.map((task) => ({
        id: task.id.value,
        text: task.text.value,
        completed: task.completed.value,
        recordedStatus: task.recordedStatus.value,
      })),
    ),
    taskCounts: {
      total: record.taskCounts.total.value,
      complete: record.taskCounts.complete.value,
      incomplete: record.taskCounts.incomplete.value,
      unknown: record.taskCounts.unknown.value,
    },
    diagnostics: snapshot.diagnostics.map((entry) => entry.code).sort(),
  };
}

describe("W31 R0 P1 readers accept both task ID cases", () => {
  test("A1: the work phase parser reports the same tasks for lower, upper, and mixed IDs", () => {
    const facts = Object.fromEntries(
      Object.entries(CASES).map(([name, letters]) => [name, workPhaseFacts(fixture(letters).phase)]),
    );
    expect(facts.lower.tasks.map((task) => task.id)).toEqual(["T1", "T2", "T3", "T4"]);
    expect(facts.lower.tasks.map((task) => task.checked)).toEqual([true, false, false, true]);
    expect(facts.upper).toEqual(facts.lower);
    expect(facts.mixed).toEqual(facts.lower);
  });

  test("A1: the work phase parser keeps each ID as written in the file", () => {
    expect(parseWorkPhase(fixture(CASES.lower).phase).tasks.map((task) => task.id)).toEqual(["t1", "t2", "t3", "t4"]);
    expect(parseWorkPhase(fixture(CASES.upper).phase).tasks.map((task) => task.id)).toEqual(["T1", "T2", "T3", "T4"]);
    expect(parseWorkPhase(fixture(CASES.mixed).phase).tasks.map((task) => task.id)).toEqual(["T1", "t2", "T3", "t4"]);
  });

  test("A1: the backlog snapshot reports the same tasks and upper-case IDs for lower, upper, and mixed IDs", () => {
    const facts = Object.fromEntries(
      Object.entries(CASES).map(([name, letters]) => [name, snapshotFacts(fixture(letters).root)]),
    );
    expect(facts.lower.tasks.map((task) => task.id)).toEqual(["T1", "T2", "T3", "T4"]);
    expect(facts.lower.taskCounts).toEqual({ total: 4, complete: 2, incomplete: 2, unknown: 0 });
    expect(facts.lower.tasks.map((task) => task.text)).toEqual([
      "Write the first part.",
      "Write the second part.",
      "Check the parts.",
      "Record the check.",
    ]);
    expect(facts.upper).toEqual(facts.lower);
    expect(facts.mixed).toEqual(facts.lower);
  });

  test("A1: both parsers agree on the task IDs for each fixture", () => {
    for (const letters of Object.values(CASES)) {
      const { root, phase } = fixture(letters);
      const parsed = workPhaseFacts(phase).tasks.map((task) => task.id);
      const snapshot = snapshotFacts(root).tasks.map((task) => task.id);
      expect(snapshot).toEqual(parsed);
    }
  });

  test("A1: an upper-case task line is a snapshot task with an ID, not a task with no ID", () => {
    const { root } = fixture(CASES.upper);
    const snapshot = buildBacklogSnapshot(root, { now: () => FIXED_NOW, runGit: NO_GIT });
    const task = snapshot.records.find((entry) => entry.scope === "live")!.phases[0]!.tasks[0]!;
    expect(task.id.value).toBe("T1");
    expect(task.text.value).toBe("Write the first part.");
  });

  test("A2: a phase file that uses only T passes the phase task check with no warning", () => {
    const { phase } = fixture(CASES.upper);
    expect(parseWorkPhase(phase).warnings).toEqual([]);
    expect(parseWorkPhase(fixture(CASES.mixed).phase).warnings).toEqual([]);
    expect(buildPhasePlan(phase).warnings).toEqual([]);
  });

  test("the phase task check still finds gaps and duplicates in either case", () => {
    const gap = fixture(["T", "T", "T", "T"]);
    write(gap.root, `${RECORD}/01-task-case.md`, phaseBody(CASES.upper).replace("T3: Check", "T5: Check"));
    expect(parseWorkPhase(gap.phase).warnings).toEqual(["expected task id t3, found T5"]);

    const duplicate = fixture(CASES.lower);
    write(duplicate.root, `${RECORD}/01-task-case.md`, phaseBody(CASES.lower).replace("t2: Write", "T1: Write"));
    expect(parseWorkPhase(duplicate.phase).warnings).toEqual([
      "duplicate task id T1",
      "expected task id t2, found T1",
    ]);
  });

  test("task coordinate input accepts t and T and names the same work item", () => {
    const { root, phase } = fixture(CASES.lower);
    const lower = resolveWaveTarget("w1 r0 p1 t3", root);
    const upper = resolveWaveTarget("W1 R0 P1 T3", root);
    // `target` echoes the typed input; every resolved fact is the same.
    expect({ ...upper, target: null }).toEqual({ ...lower, target: null });
    expect(upper.mode).toBe("phase");
    expect(upper.phasePath).toBe(phase);

    const lowerUri = parseWorkProjectUri("make-docs://project/make-docs/backlog/w1/r0/p1/t3");
    const upperUri = parseWorkProjectUri("make-docs://project/make-docs/backlog/W1/R0/P1/T3");
    expect(lowerUri).toEqual(upperUri);
    expect(upperUri).toMatchObject({
      ok: true,
      canonical: "make-docs://project/make-docs/backlog/W1/R0/P1/T3",
      target: { family: "backlog", coordinate: "W1 R0 P1 T3", isList: false },
    });
  });
});
