/**
 * W31 R0 P2: every shipped file and every CLI result that names a task ID
 * writes `T` (PRD 14 R-COORD-22, PRD 06 R-TASK-RESOURCE-1).
 *
 * Readers still accept `t` (W31 R0 P1). Every fixture lives in a temporary
 * root, never in a real Store.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, test } from "vitest";

import { planWorkPhase, readWorkPhaseState } from "../src/operations/index";
import { WORK_READY_ORDER } from "../src/operations/work/work-store/catalog";

const REPO_ROOT = path.resolve(__dirname, "..", "..", "..");
const TEMPLATE_ROOT = path.join(REPO_ROOT, "packages", "docs", "template");
const RECORD = "docs/work/2042-06-01-w1-r0-task-writers";
const LOWER_CASE_TASK_ID = /\bt(?:\d+\b|\{T\})/;

// W31 R0 P3 adds the project doctor reference. It will show lower-case IDs as
// the problem the doctor finds, so this search skips it and P3 checks it.
const DOCTOR_REFERENCE = ".make-docs/system/references/project-doctor.md";

// Template-owned files that W31 R0 P2 changed and that this repository also
// installs. `docs/AGENTS.codex-only.md` and `docs/CLAUDE.claude-only.md` are
// install variants with no dogfood copy.
const RESEEDED = [
  ".make-docs/system/templates/work-phase.md",
  ".make-docs/system/contracts/output-contract.md",
  ".make-docs/system/references/execution-workflow.md",
  ".make-docs/system/references/wave-model.md",
  ".make-docs/system/references/human-experience.md",
  "docs/AGENTS.md",
  "docs/CLAUDE.md",
  "docs/work/AGENTS.md",
  "docs/work/CLAUDE.md",
];

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

function phaseFixture(taskLines: string): string {
  const root = mkdtempSync(path.join(tmpdir(), "make-docs-w31-task-writers-"));
  roots.push(root);
  execFileSync("git", ["init"], { cwd: root, stdio: "ignore" });
  write(root, ".make-docs/config.yaml", "projectId: fixture-project\n");
  write(
    root,
    `${RECORD}/00-index.md`,
    `---\ntitle: "Task Writers"\nkind: "work"\nstatus: "active"\ncoordinate: "W1 R0"\n---\n\n# Task Writers\n`,
  );
  return write(
    root,
    `${RECORD}/01-task-writers.md`,
    `---
title: "Phase 1: Task Writers"
kind: "work"
status: "active"
coordinate: "W1 R0 P1"
---

# Phase 1: Task Writers

## Stage 1 - Only

### Tasks

${taskLines}

### Acceptance criteria

- The parts exist.
`,
  );
}

function markdownFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const absolute = path.join(dir, name);
    if (statSync(absolute).isDirectory()) return markdownFiles(absolute);
    return name.endsWith(".md") ? [absolute] : [];
  });
}

describe("W31 R0 P2 writers and shipped resources", () => {
  test("T3: run results give T for a phase file that uses t", () => {
    const phase = phaseFixture("- [x] t1: Write the first part.\n- [ ] t2: Write the second part.");
    expect(readWorkPhaseState(phase).value.tasks.map((task) => task.id)).toEqual(["T1", "T2"]);
    const plan = planWorkPhase(phase).value as { stages: Array<{ tasks: Array<{ id: string }> }> };
    expect(plan.stages.flatMap((stage) => stage.tasks.map((task) => task.id))).toEqual(["T1", "T2"]);
  });

  test("T3: the phase task check warning names T, whatever case the file uses", () => {
    const gap = phaseFixture("- [ ] t1: First.\n- [ ] t3: Third.");
    expect(readWorkPhaseState(gap).value.warnings).toEqual(["expected task id T2, found T3"]);
    const duplicate = phaseFixture("- [ ] t1: First.\n- [ ] T1: Again.");
    expect(readWorkPhaseState(duplicate).value.warnings).toEqual([
      "duplicate task id T1",
      "expected task id T2, found T1",
    ]);
  });

  test("T3: the work store ready order names the task part T", () => {
    expect(WORK_READY_ORDER.partOrder).toEqual(["W", "R", "P", "S", "T"]);
  });

  test("A4: no shipped template file names a lower-case task ID", () => {
    const hits = markdownFiles(TEMPLATE_ROOT)
      .filter((file) => path.relative(TEMPLATE_ROOT, file).split(path.sep).join("/") !== DOCTOR_REFERENCE)
      .flatMap((file) =>
        readFileSync(file, "utf8")
          .split("\n")
          .map((line, index) => ({ file: path.relative(TEMPLATE_ROOT, file), line: index + 1, text: line }))
          .filter((entry) => LOWER_CASE_TASK_ID.test(entry.text)),
      );
    expect(hits).toEqual([]);
  });

  test("A5: each changed template-owned file matches its dogfood copy byte for byte", () => {
    for (const relative of RESEEDED) {
      const upstream = readFileSync(path.join(TEMPLATE_ROOT, relative));
      const dogfood = readFileSync(path.join(REPO_ROOT, relative));
      expect(dogfood.equals(upstream), relative).toBe(true);
    }
  });
});
