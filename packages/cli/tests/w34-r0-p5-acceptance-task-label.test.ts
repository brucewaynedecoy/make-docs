/**
 * W34 R0 P5 T8: the acceptance task ID check of `check decomposition` uses the
 * shared task line reader (`readTaskLabel` in `src/operations/work/task-line.ts`).
 *
 * The task ID rule has one home (`TASK_ID_SOURCE`). `TASK_LINE_PATTERN` keeps
 * the exact pattern that W29 R0 P3 shipped, and the work phase reader's
 * `TASK_RE` keeps its exact pattern too, so no caller sees a change.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { validateDecompositionOutput } from "../src/operations/decomposition/output";
import { TASK_RE } from "../src/operations/work";
import { TASK_ID_SOURCE, TASK_LABEL_PATTERN, TASK_LINE_PATTERN, readTaskLabel, readTaskLine } from "../src/operations/work/task-line";

/** The pattern that W29 R0 P3 shipped as a regular expression literal. */
const W29_TASK_LINE_PATTERN = /^- \[([ xX])\]\s+(?:([tT][1-9]\d*):\s*)?(.+?)\s*$/;
/** The work phase reader's task line pattern before W34 R0 P5, as a regular expression literal. */
const PRE_P5_WORK_PHASE_TASK_RE = /^- \[([ xX])\] ([tT][1-9]\d*):\s*(.+)$/;
/** The pattern that W34 R0 P1 kept in `decomposition/output.ts`, from the Skill script. */
const W34_P1_ACCEPTANCE_LABEL_PATTERN = /^- [tT][1-9]\d*:/;

describe("W34 R0 P5 T8 shared task label reader", () => {
  it("keeps TASK_LINE_PATTERN exactly as W29 R0 P3 shipped it", () => {
    expect(TASK_LINE_PATTERN.source).toBe(W29_TASK_LINE_PATTERN.source);
    expect(TASK_LINE_PATTERN.flags).toBe(W29_TASK_LINE_PATTERN.flags);
  });

  it("keeps the work phase reader's TASK_RE exactly as it was before W34 R0 P5", () => {
    expect(TASK_RE.source).toBe(PRE_P5_WORK_PHASE_TASK_RE.source);
    expect(TASK_RE.flags).toBe(PRE_P5_WORK_PHASE_TASK_RE.flags);
  });

  it("builds every task ID pattern from the one TASK_ID_SOURCE", () => {
    for (const pattern of [TASK_LINE_PATTERN, TASK_LABEL_PATTERN, TASK_RE]) {
      expect(pattern.source, pattern.source).toContain(`(${TASK_ID_SOURCE})`);
    }
  });

  it("reads a task ID label at the start of a plain bullet", () => {
    expect(readTaskLabel("- T1: Bad.")).toEqual({ id: "T1", idAsWritten: "T1" });
    expect(readTaskLabel("- t12: Lower case.")).toEqual({ id: "T12", idAsWritten: "t12" });
    expect(readTaskLabel("- T3:no space")).toEqual({ id: "T3", idAsWritten: "T3" });
  });

  it("does not read a checkbox task line, a nested bullet, or a near miss", () => {
    for (const line of ["- [ ] T1: Task.", "- [x] t1: Task.", "  - T1: Nested.", "- T0: Zero.", "- T01: Leading zero.", "- T1 no colon", "- Task 1: Words.", "- A1: Case ID.", "* T1: Star.", "-T1: No space.", "T1: No bullet."]) {
      expect(readTaskLabel(line), line).toBeNull();
    }
  });

  it("matches the W34 R0 P1 acceptance pattern on every sample line", () => {
    const samples = [
      "- T1: Bad.",
      "- t1: Bad.",
      "- T10: Ten.",
      "- T1:",
      "- T0: Zero.",
      "- T01: Leading zero.",
      "- [ ] T1: Checkbox.",
      "  - T1: Nested.",
      "- Plain criterion.",
      "- A21: Case ID.",
      "- T1 no colon",
      "Plain line.",
      "- T999999: Big.",
      "- tt1: Double.",
    ];
    for (const line of samples) {
      expect(readTaskLabel(line) !== null, line).toBe(W34_P1_ACCEPTANCE_LABEL_PATTERN.test(line));
      expect(TASK_LABEL_PATTERN.test(line), line).toBe(W34_P1_ACCEPTANCE_LABEL_PATTERN.test(line));
    }
  });

  it("gives the same canonical ID as readTaskLine for the same ID", () => {
    expect(readTaskLabel("- t7: Label.")?.id).toBe(readTaskLine("- [ ] t7: Task.")?.id);
  });
});

describe("W34 R0 P5 T8 check decomposition acceptance task IDs", () => {
  let tmpdir: string;

  function write(file: string, text: string): void {
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, text);
  }

  beforeEach(() => {
    tmpdir = mkdtempSync(path.join(os.tmpdir(), "w34-p5-label-"));
    const prd = path.join(tmpdir, "docs", "prd");
    write(path.join(prd, "00-index.md"), "## Purpose\nIdx.\n## Reading Order\nOrd.\n## Document Map\nMap.\n## Source Anchors\n`src/`\n## Audience Paths\nPaths.\n");
    write(path.join(prd, "01-product-overview.md"), "## Purpose\nPO.\n## Users\n`u.py`\n## Key Capabilities\n`k.py`\n## System Boundaries\n`s.py`\n## Current Limitations\n`l.py`\n## Source Anchors\n`src/`\n");
    write(path.join(prd, "02-architecture-overview.md"), "## Purpose\nAO.\n## Topology\n`t.py`\n## Module Map\n`m.py`\n## Runtime Boundaries\n`r.py`\n## Data Flow\n`d.py`\n## Configuration Surfaces\n`c.py`\n## Source Anchors\n`src/`\n");
    write(path.join(prd, "03-open-questions-and-risk-register.md"), "## Purpose\nOQ.\n## Confirmed Drift\n`cd.py`\n## Open Questions\n`oq.py`\n## Rebuild Risks\n`rr.py`\n## Source Anchors\n`src/`\n");
    write(path.join(prd, "04-glossary.md"), "## Purpose\nGl.\n## Terms\nTerms.\n## Source Anchors\n`src/`\n");
  });
  afterEach(() => rmSync(tmpdir, { recursive: true, force: true }));

  function check(acceptance: string) {
    const backlog = path.join(tmpdir, "docs", "work", "2024-01-01-w5-r4-sample-backlog");
    write(path.join(backlog, "00-index.md"), "## Purpose\nIdx.\n## Phase Map\nMap.\n## Usage Notes\nNotes.\n");
    write(
      path.join(backlog, "01-foundation.md"),
      `## Purpose\nP.\n## Overview\nO.\n## Source PRD Docs\n- [PRD Index](../../prd/00-index.md)\n## Stage 1 - Foundation\n### Tasks\n- [ ] T1: T.\n### Acceptance criteria\n${acceptance}\n### Dependencies\n- None.\n`,
    );
    return validateDecompositionOutput(tmpdir).findings.map((finding) => finding.ruleId);
  }

  it("reports a task ID label in upper or lower case", () => {
    expect(check("- T1: A.")).toEqual(["decomposition.acceptance.task-id"]);
    expect(check("- t1: A.")).toEqual(["decomposition.acceptance.task-id"]);
  });

  it("reports a checkbox, not a task ID, for a checkbox task line", () => {
    expect(check("- [ ] T1: A.")).toEqual(["decomposition.acceptance.checkbox"]);
  });

  it("passes a plain criterion, an acceptance case ID, and a near miss", () => {
    expect(check("- A1: Case.\n- T0: Zero is not a task ID.\n- T1 without a colon.")).toEqual([]);
  });
});
