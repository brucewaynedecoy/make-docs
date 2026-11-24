import { spawnSync } from "node:child_process";
import { chmodSync, cpSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DatabaseSync } from "node:sqlite";
import { NAME_CATALOG } from "../src/operations/name-catalog";
import { readTaskLine } from "../src/operations/work/task-line";
import { WORK_SYNC_TABLE } from "../src/operations/work/work-store/catalog";
import { formatWorkConflictReport, settleChoices } from "../src/operations/work/work-store/conflict-report";
import { readDependencyBullet } from "../src/operations/work/work-store/dependency-bullets";
import type { WorkSyncFileState, WorkSyncStoreState, WorkUnitRecord } from "../src/operations/work/work-store/schemas";
import {
  WorkProjectionConfigError,
  decideWorkSync,
  readWorkProjection,
  syncWorkFiles,
  workSyncFileState,
  workSyncStoreState,
  type WorkSyncReport,
} from "../src/operations/work/work-store/sync";
import {
  classifyWorkFilePath,
  joinWorkFileLines,
  parseWorkFile,
  renderWorkFile,
  workFileUnitStates,
} from "../src/operations/work/work-store/work-file";
import { platform } from "../src/platform";
import { inspectStoreVersionRollback } from "../src/store/database";
import { STORE_TABLE_CATALOG } from "../src/store/table-catalog";
import { getInstallationCheckoutId, previewInstallationCheckoutMove, registerSeparateInstallationCheckout } from "../src/store/installation-state";
import {
  claimWorkUnit,
  releaseWorkClaim,
  deleteSyncLedgerEntry,
  deleteWorkUnit,
  listSyncConflicts,
  listSyncLedger,
  listWorkUnits,
  putWorkUnit,
  readWorkStore,
  readWorkSyncCheckout,
  writeWorkStore,
} from "../src/store/work-store";
import { WORK_STORE_CONTRACT_FIXTURES } from "./fixtures/work-store-contract";
import { cleanupTempDir, createTempDir } from "./helpers";

/**
 * W29 R0 P3: the parser and writer round trip (A10), unreadable files (A11),
 * first import with a clean git status (A12), one fixture for each sync table
 * row (A13), conflict scope (A14), and kept changed copies with copies off
 * (A15). No test reaches the real Store: `MAKE_DOCS_HOME` points at a
 * temporary folder. No test writes this repository's files.
 */

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const W22_R2 = "docs/work/2026-11-13-w22-r2-portable-checkout-adoption";
const PROJECT_ID = "aurora-p3-project";
const NOW = new Date("2042-06-15T12:00:00.000Z");
const RECORD = "docs/work/2042-06-01-w1-r0-aurora";
const INDEX = `${RECORD}/00-index.md`;
const P1 = `${RECORD}/01-first.md`;
const P2 = `${RECORD}/02-second.md`;

const INDEX_TEXT = `---
title: "W1 R0 Aurora"
kind: "work"
status: "active"
coordinate: "W1 R0"
source:
  type: "prd"
  path: "docs/prd/01-aurora.md"
---

# W1 R0 Aurora

## Phase Map

- [01-first.md](01-first.md)
- [02-second.md](02-second.md)
- [Evidence](evidence.md)
`;

const P1_TEXT = `---
title: "Phase 1: First"
kind: "work"
status: "active"
coordinate: "W1 R0 P1"
---

# Phase 1: First

## Stage 1 - Build

### Tasks

- [ ] T1: Build the parser.
- [x] t2: Write the old task.

### Dependencies

- None.

## Stage 2 - Check

### Tasks

- [ ] T3: Check it.

### Dependencies

- Stage 1.
- The owner approves this package.
`;

const P2_TEXT = `---
title: "Phase 2: Second"
status: "active"
coordinate: "W1 R0 P2"
---

# Phase 2: Second

### Dependencies

- P1 is complete.
- P9 is complete.

## Stage 1 - Ship

### Tasks

- [ ] T1: Ship it.
`;

const roots: string[] = [];
let temp: string;
let store: string;

beforeEach(() => {
  temp = platform.describePath(createTempDir("make-docs-w29-p3-")).canonicalPath;
  roots.push(temp);
  store = path.join(temp, "store");
  vi.stubEnv("MAKE_DOCS_HOME", store);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  while (roots.length) cleanupTempDir(roots.pop()!);
});

/* ------------------------------------------------------------------------ */
/* Helpers                                                                  */
/* ------------------------------------------------------------------------ */

function write(root: string, relative: string, text: string): void {
  const target = path.join(root, ...relative.split("/"));
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, text);
}

function read(root: string, relative: string): string {
  return readFileSync(path.join(root, ...relative.split("/")), "utf8");
}

function project(name = "aurora", config: string = `projectId: ${PROJECT_ID}\nprojectName: ${name}\n`): string {
  const root = path.join(temp, name);
  mkdirSync(path.join(root, ".make-docs"), { recursive: true });
  writeFileSync(path.join(root, ".make-docs/config.yaml"), config);
  return platform.describePath(root).canonicalPath;
}

function backlog(root: string): void {
  write(root, INDEX, INDEX_TEXT);
  write(root, P1, P1_TEXT);
  write(root, P2, P2_TEXT);
  write(root, `${RECORD}/evidence.md`, "# Evidence\n");
}

/** A bound checkout with the fixture backlog, after its first import. */
function imported(): { root: string; first: WorkSyncReport } {
  const root = project();
  backlog(root);
  getInstallationCheckoutId(root, store);
  const first = sync(root);
  return { root, first };
}

function sync(root: string, options: { projection?: "on" | "off"; now?: Date } = {}): WorkSyncReport {
  return syncWorkFiles(root, { storeRoot: store, now: options.now ?? NOW, projection: options.projection });
}

function units(root: string): WorkUnitRecord[] {
  return readWorkStore(root, (db) => listWorkUnits(db, PROJECT_ID), { storeRoot: store });
}

function unitAt(root: string, coordinate: string): WorkUnitRecord {
  const found = units(root).find((unit) => unit.coordinate === coordinate);
  if (!found) throw new Error(`No unit ${coordinate}`);
  return found;
}

function edit(root: string, fn: (db: Parameters<Parameters<typeof writeWorkStore>[1]>[0]) => void): void {
  writeWorkStore(root, (db) => fn(db), { storeRoot: store });
}

function storeChange(root: string, coordinate: string, change: Partial<WorkUnitRecord>): void {
  edit(root, (db) => {
    const current = listWorkUnits(db, PROJECT_ID).find((unit) => unit.coordinate === coordinate)!;
    const { revision, ...input } = current;
    putWorkUnit(db, { ...input, ...change }, { expectedVersion: revision, now: NOW });
  });
}

/** The store loses every unit of one file (only P2 has no dependent). */
function dropStoreUnits(root: string, relative: string): void {
  edit(root, (db) => {
    const order = ["task", "stage", "phase", "revision"];
    const doomed = listWorkUnits(db, PROJECT_ID)
      .filter((unit) => unit.sourcePath === relative && unit.kind !== "wave")
      .sort((left, right) => order.indexOf(left.kind) - order.indexOf(right.kind));
    for (const unit of doomed) deleteWorkUnit(db, unit.storeId, { expectedVersion: unit.revision });
  });
}

/** What the P4 accept-deletion settle does: close the file's units as superseded, and mark the copy removed. */
function acceptDeletion(root: string, relative: string): void {
  edit(root, (db) => {
    for (const unit of listWorkUnits(db, PROJECT_ID).filter((candidate) => candidate.sourcePath === relative && candidate.kind !== "wave")) {
      const { revision, ...input } = unit;
      putWorkUnit(db, { ...input, status: "closed", closeOutcome: "superseded", copyState: "removed" }, { expectedVersion: revision, now: NOW });
    }
  });
}

function dropLedger(root: string, relative: string): void {
  const checkoutId = getInstallationCheckoutId(root, store);
  edit(root, (db) => {
    const row = listSyncLedger(db, checkoutId).find((entry) => entry.entry.targetPath === relative)!;
    deleteSyncLedgerEntry(db, checkoutId, relative, { expectedVersion: row.entryVersion });
  });
}

function fileResult(report: WorkSyncReport, relative: string) {
  const found = report.files.find((file) => file.path === relative);
  if (!found) throw new Error(`No result for ${relative}: ${JSON.stringify(report.files)}`);
  return found;
}

function workFilesUnder(root: string): string[] {
  const found: string[] = [];
  for (const workRoot of ["docs/work", ".make-docs/archive/work"]) {
    const absolute = path.join(root, workRoot);
    if (!existsSync(absolute)) continue;
    for (const folder of readdirSync(absolute)) {
      const folderPath = path.join(absolute, folder);
      if (!statSync(folderPath).isDirectory()) continue;
      for (const file of readdirSync(folderPath)) {
        const relative = `${workRoot}/${folder}/${file}`;
        if (classifyWorkFilePath(relative)) found.push(relative);
      }
    }
  }
  return found.sort();
}

/* ------------------------------------------------------------------------ */
/* Stage 1: parser and writer                                               */
/* ------------------------------------------------------------------------ */

describe("W29 R0 P3 parser and writer (T1, T2, A10)", () => {
  it("parse then write gives identical bytes for every live and archived backlog in this repository", () => {
    const files = workFilesUnder(REPO_ROOT);
    expect(files.length).toBeGreaterThan(400);
    expect(files.some((file) => file.startsWith(".make-docs/archive/work/"))).toBe(true);
    expect(files.some((file) => file.startsWith(`${W22_R2}/`))).toBe(true);
    const failures: string[] = [];
    let unitCount = 0;
    for (const relative of files) {
      const bytes = readFileSync(path.join(REPO_ROOT, relative));
      const parsed = parseWorkFile(relative, bytes);
      if (!parsed.ok) {
        failures.push(`${relative}:${parsed.failure.line} ${parsed.failure.message}`);
        continue;
      }
      unitCount += parsed.document.units.length;
      // The plain write, and the write through every unit's state, both give the same bytes.
      expect(Buffer.from(joinWorkFileLines(parsed.document.lines))).toEqual(bytes);
      const rendered = renderWorkFile(parsed.document, workFileUnitStates(parsed.document));
      expect(rendered.ok, relative).toBe(true);
      expect(Buffer.from((rendered as { text: string }).text), relative).toEqual(bytes);
      expect((rendered as { changedUnits: string[] }).changedUnits).toEqual([]);
    }
    expect(failures).toEqual([]);
    expect(unitCount).toBeGreaterThan(3000);
  });

  it("keeps the lower-case task IDs of the read-only W22 R2 backlog, and writes T only in a task line that the store changes", () => {
    const relative = readdirSync(path.join(REPO_ROOT, W22_R2)).map((file) => `${W22_R2}/${file}`).find((file) => {
      if (!classifyWorkFilePath(file)) return false;
      return read(REPO_ROOT, file).split("\n").some((line) => /^- \[[ xX]\] t[1-9]/.test(line));
    })!;
    expect(relative).toBeDefined();
    const bytes = readFileSync(path.join(REPO_ROOT, relative));
    const parsed = parseWorkFile(relative, bytes);
    if (!parsed.ok) throw new Error(parsed.failure.message);
    const lower = parsed.document.units.find((unit) => unit.kind === "task" && /^- \[[ xX]\] t/.test(parsed.document.lines[unit.line - 1]!.text))!;
    expect(lower.coordinate).toMatch(/ T[1-9]\d*$/);
    const states = workFileUnitStates(parsed.document);
    const unchanged = renderWorkFile(parsed.document, states);
    expect(unchanged.ok && Buffer.from(unchanged.text).equals(bytes)).toBe(true);
    // In memory only: flip that task's state. Its line gets `T`; every other line keeps its bytes.
    const flipped = states.map((state) => (state.coordinate === lower.coordinate ? { ...state, status: state.status === "closed" ? "open" as const : "closed" as const, closeOutcome: state.status === "closed" ? null : "done" as const } : state));
    const changed = renderWorkFile(parsed.document, flipped);
    if (!changed.ok) throw new Error(changed.reason);
    const before = parsed.document.lines;
    const after = changed.text.split("\n");
    for (let index = 0; index < before.length; index += 1) {
      if (index === lower.line - 1) expect(after[index]).toMatch(/^- \[[ xX]\] T[1-9]/);
      else expect(after[index]).toBe(before[index]!.text);
    }
    expect(readFileSync(path.join(REPO_ROOT, relative))).toEqual(bytes);
  });

  it("reads index and phase units, stages, tasks, dependencies, blockers, links, and diagnostics", () => {
    const text = `${P1_TEXT}\n## Notes\n\n- [ ] Unnumbered task.\n- [ ] T1: Duplicate.\n\n### Blockers\n\n- Waiting on the release.\n\n\`\`\`\n- [ ] T9: In a fence.\n\`\`\`\n`;
    const parsed = parseWorkFile(P1, text);
    if (!parsed.ok) throw new Error(parsed.failure.message);
    expect(parsed.document.units.map((unit) => [unit.kind, unit.coordinate, unit.parentCoordinate])).toEqual([
      ["phase", "W1 R0 P1", "W1 R0"],
      ["stage", "W1 R0 P1 S1", "W1 R0 P1"],
      ["task", "W1 R0 P1 T1", "W1 R0 P1 S1"],
      ["task", "W1 R0 P1 T2", "W1 R0 P1 S1"],
      ["stage", "W1 R0 P1 S2", "W1 R0 P1"],
      ["task", "W1 R0 P1 T3", "W1 R0 P1 S2"],
    ]);
    const s2 = parsed.document.units.find((unit) => unit.coordinate === "W1 R0 P1 S2")!;
    expect(s2.dependencyBullets.map((bullet) => bullet.text)).toEqual(["Stage 1.", "The owner approves this package."]);
    expect(parsed.document.units[0]!.blockerBullets.map((bullet) => bullet.text)).toEqual(["Waiting on the release."]);
    expect(parsed.document.diagnostics.map((diagnostic) => diagnostic.code)).toEqual(["task-without-id", "duplicate-task-id"]);
    const index = parseWorkFile(INDEX, INDEX_TEXT);
    if (!index.ok) throw new Error(index.failure.message);
    expect(index.document.units[0]).toMatchObject({ kind: "revision", coordinate: "W1 R0", parentCoordinate: "W1", title: "W1 R0 Aurora", recordedStatus: "active" });
    expect(index.document.units[0]!.links).toEqual([
      { direction: "outbound", kind: "prd-section", path: "docs/prd/01-aurora.md", anchor: null },
      { direction: "outbound", kind: "work-file", path: P1, anchor: null },
      { direction: "outbound", kind: "work-file", path: P2, anchor: null },
      { direction: "outbound", kind: "evidence", path: `${RECORD}/evidence.md`, anchor: null },
    ]);
    expect(classifyWorkFilePath(`${RECORD}/evidence.md`)).toBeNull();
  });

  it("changes only the part of a line that the store changed, and keeps CRLF line endings", () => {
    const crlf = P1_TEXT.replaceAll("\n", "\r\n");
    const parsed = parseWorkFile(P1, crlf);
    if (!parsed.ok) throw new Error(parsed.failure.message);
    const states = workFileUnitStates(parsed.document).map((state) => {
      if (state.coordinate === "W1 R0 P1 T1") return { ...state, status: "closed" as const, closeOutcome: "done" as const, text: "Build the strict parser." };
      if (state.coordinate === "W1 R0 P1") return { ...state, status: "closed" as const, closeOutcome: "done" as const };
      return state;
    });
    const rendered = renderWorkFile(parsed.document, states);
    if (!rendered.ok) throw new Error(rendered.reason);
    expect(rendered.changedUnits).toEqual(["W1 R0 P1", "W1 R0 P1 T1"]);
    expect(rendered.text).toBe(crlf.replace('status: "active"', 'status: "complete"').replace("- [ ] T1: Build the parser.", "- [x] T1: Build the strict parser."));
    // A status the file cannot show stays in the store: an in-progress task keeps `[ ]`.
    const inProgress = workFileUnitStates(parsed.document).map((state) => (state.coordinate === "W1 R0 P1 T3" ? { ...state, status: "in-progress" as const } : state));
    expect(renderWorkFile(parsed.document, inProgress)).toMatchObject({ ok: true, text: crlf, changedUnits: [] });
  });

  it("refuses, and changes nothing, when the store change has no file form", () => {
    const parsed = parseWorkFile(P1, P1_TEXT);
    if (!parsed.ok) throw new Error(parsed.failure.message);
    const states = workFileUnitStates(parsed.document);
    expect(renderWorkFile(parsed.document, [...states, { ...states[2]!, coordinate: "W1 R0 P1 T9" }])).toMatchObject({ ok: false, coordinate: "W1 R0 P1 T9" });
    expect(renderWorkFile(parsed.document, states.slice(0, -1))).toMatchObject({ ok: false, coordinate: "W1 R0 P1 T3" });
    expect(renderWorkFile(parsed.document, states.map((state) => (state.kind === "stage" ? { ...state, title: "Renamed" } : state)))).toMatchObject({ ok: false });
    expect(renderWorkFile(parsed.document, states.map((state) => (state.coordinate === "W1 R0 P1 S2" ? { ...state, gates: ["A new gate."] } : state)))).toMatchObject({ ok: false });
    // A bullet that the title rule reads as a dependency is not a gate in the store, so a missing gate is allowed.
    expect(renderWorkFile(parsed.document, states.map((state) => (state.coordinate === "W1 R0 P1 S2" ? { ...state, gates: [] } : state)))).toMatchObject({ ok: true, text: P1_TEXT });
    expect(renderWorkFile(parsed.document, states.map((state) => (state.kind === "phase" ? { ...state, blockers: ["New"] } : state)))).toMatchObject({ ok: false });
  });

  it("uses the shared task line reader, which reads t and T as the same task", () => {
    expect(readTaskLine("- [x] t12: Old task.")).toMatchObject({ id: "T12", idAsWritten: "t12", checked: true, text: "Old task." });
    expect(readTaskLine("- [ ] T3:  Spaced.")).toMatchObject({ id: "T3", text: "Spaced.", spans: { id: { start: 6, end: 8 }, text: { start: 11, end: 18 } } });
    expect(readTaskLine("- [X] No ID")).toMatchObject({ id: null, mark: "X", text: "No ID" });
    expect(readTaskLine("  - [ ] T1: Nested")).toBeNull();
  });
});

describe("W29 R0 P3 unreadable files (T3, A11)", () => {
  const cases: Array<{ name: string; content: string | Uint8Array; code: string; line: number }> = [
    { name: "invalid UTF-8", content: Buffer.concat([Buffer.from("---\ntitle: x\n---\n\n# X\n"), Buffer.from([0xff, 0xfe, 0x0a])]), code: "invalid-utf8", line: 6 },
    { name: "front matter that never closes", content: "---\ntitle: x\n\n# X\n", code: "front-matter-unclosed", line: 1 },
    { name: "invalid YAML", content: "---\ntitle: x\nstatus: [active\n---\n", code: "front-matter-invalid", line: 3 },
    { name: "a coordinate that the path does not give", content: "---\ncoordinate: \"W1 R0 P7\"\n---\n", code: "coordinate-mismatch", line: 2 },
    { name: "a status that is not one line of text", content: "---\nstatus:\n  - active\n---\n", code: "front-matter-field", line: 2 },
    { name: "a code fence that never closes", content: "# X\n\n```\n- [ ] T1: Hidden.\n", code: "code-fence-unclosed", line: 3 },
    { name: "an HTML comment that never closes", content: "# X\n\n<!-- hidden\n- [ ] T1: Hidden.\n", code: "comment-unclosed", line: 3 },
    { name: "a stage number used twice", content: "# X\n\n## Stage 1 - A\n\n## Stage 1 - B\n", code: "duplicate-stage", line: 5 },
  ];
  for (const testCase of cases) {
    it(`reports ${testCase.name} with its path and first failing line`, () => {
      const parsed = parseWorkFile(P1, testCase.content);
      expect(parsed.ok).toBe(false);
      expect(!parsed.ok && parsed.failure).toMatchObject({ path: P1, code: testCase.code, line: testCase.line });
    });
  }

  it("leaves an unreadable file untouched in sync, reports its path and line, and keeps the other files going", () => {
    const { root } = imported();
    const broken = "---\ntitle: broken\n\n- [ ] T1: x\n";
    write(root, P2, broken);
    write(root, P1, P1_TEXT.replace("- [ ] T1: Build the parser.", "- [x] T1: Build the parser."));
    const mtime = statSync(path.join(root, P2)).mtimeMs;
    const report = sync(root);
    expect(report.unreadable).toEqual([{ path: P2, code: "front-matter-unclosed", line: 1, message: expect.any(String) }]);
    expect(fileResult(report, P2)).toMatchObject({ fileState: "unreadable", decision: "report-unreadable", action: "unreadable" });
    expect(read(root, P2)).toBe(broken);
    expect(statSync(path.join(root, P2)).mtimeMs).toBe(mtime);
    expect(fileResult(report, P1).action).toBe("imported");
    expect(unitAt(root, "W1 R0 P1 T1").status).toBe("closed");
    expect(report.summary).toContain(`Cannot read ${P2}, line 1`);
  });
});

/* ------------------------------------------------------------------------ */
/* Dependency bullets                                                       */
/* ------------------------------------------------------------------------ */

describe("W29 R0 P3 dependency bullets (R-WORK-SYNC-13)", () => {
  const fixtures = WORK_STORE_CONTRACT_FIXTURES.filter((fixture) => fixture.kind === "dependency");
  it("has the P1 dependency fixtures", () => expect(fixtures.length).toBeGreaterThanOrEqual(12));
  for (const fixture of fixtures) {
    if (fixture.kind !== "dependency") continue;
    it(`${fixture.id}: ${fixture.title}`, () => {
      const existing = new Set(fixture.input.existing);
      const titles = fixture.input.titles;
      const result = readDependencyBullet(
        fixture.input.bullet,
        fixture.input.unitCoordinate,
        (coordinate) => existing.has(coordinate),
        titles ? (coordinate) => titles[coordinate] ?? null : undefined,
      );
      expect(result).toEqual(fixture.expected);
    });
  }
  it("reads lists, mixed forms, links, and full coordinates", () => {
    const all = () => true;
    expect(readDependencyBullet("P1 and P2.", "W29 R0 P3", all).dependencies).toEqual(["W29 R0 P1", "W29 R0 P2"]);
    expect(readDependencyBullet("[W31 R0](../w31/00-index.md) is complete.", "W29 R0 P3", all).dependencies).toEqual(["W31 R0"]);
    expect(readDependencyBullet("W22 R0 P8 Stage 2 accepted.", "W29 R0 P3", all).dependencies).toEqual(["W22 R0 P8 S2"]);
    expect(readDependencyBullet("Accepted design, plan, and PRD 52.", "W29 R0 P1", all)).toMatchObject({ gate: true, dependencies: [] });
    expect(readDependencyBullet("Stage 2 and T4.", "W29 R0 P3 S3", all).dependencies).toEqual(["W29 R0 P3 S2", "W29 R0 P3 T4"]);
    // Older files write phase numbers with a leading zero.
    expect(readDependencyBullet("Phase 01.", "W10 R1 P2", all).dependencies).toEqual(["W10 R1 P1"]);
    expect(readDependencyBullet("Phases 01 and 02.", "W10 R1 P3", all).dependencies).toEqual(["W10 R1 P1", "W10 R1 P2"]);
    // A phase named with its title has words beyond status words, so it is a gate (R-WORK-SYNC-13).
    expect(readDependencyBullet("Phase 1 trace and scope.", "W10 R1 P2", all).gate).toBe(true);
  });
});

/* ------------------------------------------------------------------------ */
/* Stage 2: import and sync                                                 */
/* ------------------------------------------------------------------------ */

describe("W29 R0 P3 first import (T4, A12)", () => {
  it("imports the fixture backlog, resolves dependencies, reports unresolved bullets and gates, and writes no file", () => {
    const root = project();
    backlog(root);
    getInstallationCheckoutId(root, store);
    const before = new Map(workFilesUnder(root).map((file) => [file, read(root, file)]));
    const report = sync(root);
    expect(report.firstImport).toBe(true);
    expect(report.written).toEqual([]);
    for (const [file, text] of before) expect(read(root, file)).toBe(text);
    expect(report.import.records.map((record) => record.path)).toEqual([INDEX, P1, P2]);
    expect(units(root).map((unit) => [unit.kind, unit.coordinate, unit.status])).toEqual([
      ["wave", "W1", "open"],
      ["revision", "W1 R0", "open"],
      ["phase", "W1 R0 P1", "open"],
      ["stage", "W1 R0 P1 S1", "open"],
      ["stage", "W1 R0 P1 S2", "open"],
      ["task", "W1 R0 P1 T1", "open"],
      ["task", "W1 R0 P1 T2", "closed"],
      ["task", "W1 R0 P1 T3", "open"],
      ["phase", "W1 R0 P2", "open"],
      ["stage", "W1 R0 P2 S1", "open"],
      ["task", "W1 R0 P2 T1", "open"],
    ]);
    expect(unitAt(root, "W1 R0 P1 T2")).toMatchObject({ closeOutcome: "done", recordedStatus: "[x]", body: "Write the old task." });
    expect(report.import.resolvedDependencies.map((entry) => [entry.unit, entry.dependsOn])).toEqual([
      ["W1 R0 P1 S2", "W1 R0 P1 S1"],
      ["W1 R0 P2", "W1 R0 P1"],
    ]);
    expect(report.import.unresolvedDependencies).toEqual([{ unit: "W1 R0 P2", coordinate: "W1 R0 P9", sourceText: "P9 is complete.", path: P2, line: 12 }]);
    expect(report.import.gates).toEqual([{ unit: "W1 R0 P1 S2", text: "The owner approves this package.", path: P1, line: 30 }]);
    expect(unitAt(root, "W1 R0 P2").unresolvedDependencies).toEqual([{ sourceText: "W1 R0 P9", source: { path: P2, line: 12 } }]);
    expect(unitAt(root, "W1 R0 P1 S2").gates).toEqual([{ sourceText: "The owner approves this package.", source: { path: P1, line: 30 }, met: false }]);
    expect(report.summary).toContain("First sync of this checkout: 3 work files and 10 units entered the store. Make Docs wrote and removed no project file.");
    // The second sync has nothing to do.
    const again = sync(root);
    expect(again.firstImport).toBe(false);
    expect(again.files.map((file) => file.action)).toEqual(["none", "none", "none"]);
  });

  it("first import of this repository's backlogs in a temporary git copy leaves git status clean", () => {
    const root = project("repo-copy");
    cpSync(path.join(REPO_ROOT, "docs/work"), path.join(root, "docs/work"), { recursive: true });
    cpSync(path.join(REPO_ROOT, ".make-docs/archive/work"), path.join(root, ".make-docs/archive/work"), { recursive: true });
    const git = (...args: string[]) => {
      const run = spawnSync("git", ["-c", "user.name=Make Docs Test", "-c", "user.email=test@example.invalid", "-c", "commit.gpgsign=false", ...args], { cwd: root, encoding: "utf8" });
      if (run.status !== 0) throw new Error(run.stderr);
      return run.stdout;
    };
    git("init", "-q");
    git("add", "-A");
    git("commit", "-q", "-m", "fixture");
    getInstallationCheckoutId(root, store);
    const report = sync(root);
    expect(git("status", "--porcelain")).toBe("");
    expect(report.firstImport).toBe(true);
    expect(report.unreadable).toEqual([]);
    expect(report.conflicts).toEqual([]);
    expect(report.written).toEqual([]);
    const files = workFilesUnder(root);
    expect(report.import.records.length).toBe(files.length);
    const stored = units(root);
    expect(stored.length).toBeGreaterThan(3000);
    expect(new Set(stored.map((unit) => unit.coordinate)).size).toBe(stored.length);
    // A second sync changes nothing, and git stays clean.
    const again = sync(root);
    expect(again.files.every((file) => file.action === "none")).toBe(true);
    expect(git("status", "--porcelain")).toBe("");
    writeFileSync(path.join(process.env.TMPDIR ?? temp, "w29-p3-a12-report.json"), JSON.stringify({
      files: files.length,
      units: stored.length,
      byKind: Object.fromEntries(["wave", "revision", "phase", "stage", "task"].map((kind) => [kind, stored.filter((unit) => unit.kind === kind).length])),
      resolved: report.import.resolvedDependencies.length,
      unresolved: report.import.unresolvedDependencies.length,
      gates: report.import.gates.length,
      diagnostics: report.import.diagnostics.reduce<Record<string, number>>((counts, entry) => ({ ...counts, [entry.code]: (counts[entry.code] ?? 0) + 1 }), {}),
      unresolvedSample: report.import.unresolvedDependencies.slice(0, 5),
      summary: report.summary,
    }, null, 2));
  }, 300_000);
});

/* ------------------------------------------------------------------------ */
/* A13: one fixture for each sync table row                                 */
/* ------------------------------------------------------------------------ */

type RowKey = `${WorkSyncFileState}/${WorkSyncStoreState | "any"}/${"on" | "off" | "any"}`;
const rowKey = (row: (typeof WORK_SYNC_TABLE)[number]): RowKey => `${row.file}/${row.store}/${row.projection}`;

interface RowFixture {
  /** The file, store, and setting that the fixture produces. */
  state: [WorkSyncFileState, WorkSyncStoreState, "on" | "off"];
  arrange: (root: string) => void;
  path?: string;
  check: (root: string, report: WorkSyncReport) => void;
}

const closeT1 = (root: string) => storeChange(root, "W1 R0 P2 T1", { status: "closed", closeOutcome: "done" });
const editP2 = (root: string) => write(root, P2, P2_TEXT.replace("Ship it.", "Ship it today."));

const END_TO_END: Partial<Record<RowKey, RowFixture>> = {
  "unreadable/any/any": {
    state: ["unreadable", "unchanged", "on"],
    arrange: (root) => write(root, P2, "---\n"),
    check: (root, report) => {
      expect(read(root, P2)).toBe("---\n");
      expect(report.unreadable[0]).toMatchObject({ path: P2, line: 1 });
    },
  },
  "unchanged/unchanged/on": { state: ["unchanged", "unchanged", "on"], arrange: () => {}, check: (root) => expect(read(root, P2)).toBe(P2_TEXT) },
  "unchanged/unchanged/off": {
    state: ["unchanged", "unchanged", "off"],
    arrange: () => {},
    check: (root, report) => {
      expect(existsSync(path.join(root, P2))).toBe(false);
      expect(report.removed).toContain(P2);
    },
  },
  "unchanged/changed/on": {
    state: ["unchanged", "changed", "on"],
    arrange: closeT1,
    check: (root, report) => {
      expect(read(root, P2)).toBe(P2_TEXT.replace("- [ ] T1: Ship it.", "- [x] T1: Ship it."));
      expect(report.written).toEqual([P2]);
      // The frame now equals the written bytes, so the next sync has nothing to do.
      expect(fileResult(sync(root), P2).action).toBe("none");
    },
  },
  "unchanged/changed/off": {
    state: ["unchanged", "changed", "off"],
    arrange: closeT1,
    check: (root) => expect(existsSync(path.join(root, P2))).toBe(false),
  },
  "unchanged/none/any": {
    state: ["unchanged", "none", "on"],
    arrange: (root) => dropStoreUnits(root, P2),
    check: (root, report) => {
      expect(report.conflicts[0]).toMatchObject({ path: P2, kind: "store-missing", affectedUnits: [] });
      expect(read(root, P2)).toBe(P2_TEXT);
    },
  },
  "unchanged/removed/any": {
    state: ["unchanged", "removed", "on"],
    arrange: (root) => acceptDeletion(root, P2),
    check: (root, report) => {
      expect(existsSync(path.join(root, P2))).toBe(false);
      expect(report.removed).toEqual([P2]);
    },
  },
  "changed/unchanged/any": {
    state: ["changed", "unchanged", "on"],
    arrange: editP2,
    check: (root) => expect(unitAt(root, "W1 R0 P2 T1").body).toBe("Ship it today."),
  },
  "changed/changed/any": {
    state: ["changed", "changed", "on"],
    arrange: (root) => {
      editP2(root);
      closeT1(root);
    },
    check: (root, report) => {
      expect(report.conflicts[0]).toMatchObject({ path: P2, kind: "both-changed" });
      expect(read(root, P2)).toBe(P2_TEXT.replace("Ship it.", "Ship it today."));
    },
  },
  "changed/none/any": {
    state: ["changed", "none", "on"],
    arrange: (root) => {
      dropStoreUnits(root, P2);
      editP2(root);
    },
    check: (_root, report) => expect(report.conflicts[0]).toMatchObject({ kind: "store-missing" }),
  },
  "changed/removed/any": {
    state: ["changed", "removed", "on"],
    arrange: (root) => {
      acceptDeletion(root, P2);
      editP2(root);
    },
    check: (root, report) => {
      expect(report.conflicts[0]).toMatchObject({ kind: "file-deleted" });
      expect(existsSync(path.join(root, P2))).toBe(true);
    },
  },
  "new/none/any": {
    state: ["new", "none", "on"],
    path: `${RECORD}/03-third.md`,
    arrange: (root) => write(root, `${RECORD}/03-third.md`, "# Phase 3\n\n- [ ] T1: New work.\n"),
    check: (root) => expect(unitAt(root, "W1 R0 P3 T1").sourcePath).toBe(`${RECORD}/03-third.md`),
  },
  "new/new/any": {
    state: ["new", "new", "on"],
    arrange: (root) => {
      dropLedger(root, P2);
      editP2(root);
    },
    check: (_root, report) => expect(report.conflicts[0]).toMatchObject({ kind: "unclear", path: P2 }),
  },
  "new/removed/any": {
    state: ["new", "removed", "on"],
    arrange: (root) => {
      acceptDeletion(root, P2);
      sync(root); // removes the unchanged copy and its ledger entry
      write(root, P2, P2_TEXT);
    },
    check: (_root, report) => expect(report.conflicts[0]).toMatchObject({ kind: "file-deleted" }),
  },
  "missing/unchanged/on": {
    state: ["missing", "unchanged", "on"],
    arrange: (root) => unlinkSync(path.join(root, P2)),
    check: (root, report) => {
      expect(report.conflicts[0]).toMatchObject({ kind: "file-deleted", path: P2 });
      expect(existsSync(path.join(root, P2))).toBe(false);
    },
  },
  "missing/changed/on": {
    state: ["missing", "changed", "on"],
    arrange: (root) => {
      unlinkSync(path.join(root, P2));
      closeT1(root);
    },
    check: (_root, report) => expect(report.conflicts[0]).toMatchObject({ kind: "file-deleted" }),
  },
  "missing/unchanged/off": {
    state: ["missing", "unchanged", "off"],
    arrange: (root) => unlinkSync(path.join(root, P2)),
    check: (root, report) => {
      expect(report.conflicts).toEqual([]);
      expect(existsSync(path.join(root, P2))).toBe(false);
    },
  },
  "missing/changed/off": {
    state: ["missing", "changed", "off"],
    arrange: (root) => {
      unlinkSync(path.join(root, P2));
      closeT1(root);
    },
    check: (root) => expect(existsSync(path.join(root, P2))).toBe(false),
  },
  "missing/none/any": {
    state: ["missing", "none", "on"],
    arrange: (root) => {
      dropStoreUnits(root, P2);
      unlinkSync(path.join(root, P2));
    },
    check: (_root, report) => expect(fileResult(report, P2).action).toBe("ledger-cleared"),
  },
  "missing/removed/any": {
    state: ["missing", "removed", "on"],
    arrange: (root) => {
      acceptDeletion(root, P2);
      unlinkSync(path.join(root, P2));
    },
    check: (_root, report) => expect(fileResult(report, P2).action).toBe("ledger-cleared"),
  },
  "absent/new/on": {
    state: ["absent", "new", "on"],
    arrange: (root) => {
      dropLedger(root, P2);
      unlinkSync(path.join(root, P2));
    },
    check: (root, report) => {
      expect(read(root, P2)).toBe(P2_TEXT);
      expect(report.written).toEqual([P2]);
    },
  },
  "absent/new/off": {
    state: ["absent", "new", "off"],
    arrange: (root) => {
      dropLedger(root, P2);
      unlinkSync(path.join(root, P2));
    },
    check: (root) => expect(existsSync(path.join(root, P2))).toBe(false),
  },
  "absent/removed/any": {
    state: ["absent", "removed", "on"],
    arrange: (root) => {
      acceptDeletion(root, P2);
      sync(root); // removes the unchanged copy and its ledger entry
    },
    check: (root) => expect(existsSync(path.join(root, P2))).toBe(false),
  },
};

/**
 * Rows that sync can never meet: both states read the same ledger entry, so
 * a file state that has an entry (`unchanged`, `changed`, `missing`) never
 * meets a store state without one (`new`), and the reverse. `absent/none` is
 * a path that nobody knows, which sync never visits.
 */
const DECISION_ONLY: RowKey[] = [
  "unchanged/new/any",
  "changed/new/any",
  "new/unchanged/any",
  "new/changed/any",
  "missing/new/any",
  "absent/none/any",
  "absent/unchanged/any",
  "absent/changed/any",
];

describe("W29 R0 P3 sync table rows (T5, A13)", () => {
  it("has one fixture for every sync table row", () => {
    const keys = WORK_SYNC_TABLE.map(rowKey);
    expect(new Set(keys).size).toBe(keys.length);
    for (const key of keys) expect(Boolean(END_TO_END[key]) !== DECISION_ONLY.includes(key), key).toBe(true);
    expect(Object.keys(END_TO_END).length + DECISION_ONLY.length).toBe(keys.length);
  });

  for (const row of WORK_SYNC_TABLE) {
    const key = rowKey(row);
    const fixture = END_TO_END[key];
    if (!fixture) continue;
    it(`${key} gives ${row.decision}${row.conflictKind ? ` (${row.conflictKind})` : ""} through real sync`, () => {
      const { root } = imported();
      fixture.arrange(root);
      const report = sync(root, { projection: fixture.state[2] });
      const result = fileResult(report, fixture.path ?? P2);
      expect([result.fileState, result.storeState, result.projection]).toEqual(fixture.state);
      expect(result.decision).toBe(row.decision);
      expect(decideWorkSync(...fixture.state)).toBe(row);
      fixture.check(root, report);
    });
  }

  it("decides every row that sync cannot meet, and the state readers never produce those pairs", () => {
    for (const key of DECISION_ONLY) {
      const row = WORK_SYNC_TABLE.find((candidate) => rowKey(candidate) === key)!;
      const [file, store] = key.split("/") as [WorkSyncFileState, WorkSyncStoreState];
      for (const projection of ["on", "off"] as const) expect(decideWorkSync(file, store, projection)).toBe(row);
    }
    const pairs = new Set<string>();
    const unitSets = [[], [{ storeId: "wu-aaaaaaaa", revision: 2, copyState: "kept" as const }], [{ storeId: "wu-aaaaaaaa", revision: 3, copyState: "kept" as const }], [{ storeId: "wu-aaaaaaaa", revision: 2, copyState: "removed" as const }]];
    for (const ledgerDigest of [null, "a".repeat(64)]) {
      const ledger = ledgerDigest ? { unitStoreIds: ["wu-aaaaaaaa"], storeRevision: 2 } : null;
      for (const exists of [true, false]) for (const readable of [true, false]) for (const digest of ["a".repeat(64), "b".repeat(64)]) {
        for (const unitSet of unitSets) {
          pairs.add(`${workSyncFileState({ exists, readable, digest, ledgerDigest })}/${workSyncStoreState({ units: unitSet, ledger })}`);
        }
      }
    }
    for (const key of DECISION_ONLY.filter((entry) => entry !== "absent/none/any")) {
      expect(pairs.has(key.split("/").slice(0, 2).join("/")), key).toBe(false);
    }
  });
});

/* ------------------------------------------------------------------------ */
/* Sync behavior                                                            */
/* ------------------------------------------------------------------------ */

describe("W29 R0 P3 conflicts (T6, A14)", () => {
  it("a conflict in one phase file blocks only that file's units, and other files continue", () => {
    const { root } = imported();
    editP2(root);
    closeT1(root);
    write(root, P1, P1_TEXT.replace("- [ ] T3: Check it.", "- [x] T3: Check it."));
    const report = sync(root);
    expect(fileResult(report, P1).action).toBe("imported");
    expect(unitAt(root, "W1 R0 P1 T3").status).toBe("closed");
    expect(report.conflicts).toHaveLength(1);
    const conflict = report.conflicts[0]!;
    const p2Units = units(root).filter((unit) => unit.sourcePath === P2).map((unit) => unit.coordinate).sort();
    expect([...conflict.affectedUnits].sort()).toEqual(p2Units);
    const rows = readWorkStore(root, (db) => listSyncConflicts(db, getInstallationCheckoutId(root, store)), { storeRoot: store });
    const stored = new Set(rows[0]!.conflict.affectedUnitStoreIds);
    expect(units(root).filter((unit) => stored.has(unit.storeId)).every((unit) => unit.sourcePath === P2)).toBe(true);
    // Both sides and the differing unit.
    expect(conflict.file).toMatchObject({ present: true });
    expect(conflict.store).toMatchObject({ present: true });
    expect(conflict.differences).toEqual([{ coordinate: "W1 R0 P2 T1", file: "[ ], \"Ship it today.\"", store: "closed (done), \"Ship it.\"" }]);
    // The conflict stays until a person settles it; a later sync keeps it and touches nothing.
    const later = sync(root);
    expect(fileResult(later, P2).action).toBe("still-in-conflict");
    expect(read(root, P2)).toBe(P2_TEXT.replace("Ship it.", "Ship it today."));
  });

  it("names one settle command for each choice, in the work sync form", () => {
    // W29 R0 P4 built `work sync --settle`, so the entry is current now.
    const planned = NAME_CATALOG.find((entry) => entry.id === "work.queue.sync")!;
    expect(planned).toMatchObject({ status: "current", newCli: "work sync" });
    for (const kind of ["both-changed", "file-deleted", "store-missing", "unclear"] as const) {
      const choices = settleChoices(kind, "docs/work/a b/01.md");
      expect(choices).toHaveLength(2);
      for (const choice of choices) expect(choice.command).toBe(`make-docs ${planned.newCli} --settle 'docs/work/a b/01.md' --${choice.choice}`);
    }
    const { root } = imported();
    editP2(root);
    closeT1(root);
    const text = formatWorkConflictReport(sync(root).conflicts[0]!);
    expect(text).toContain(`Sync stopped for ${P2}.`);
    expect(text).toContain(`make-docs work sync --settle ${P2} --keep-file`);
    expect(text).toContain(`make-docs work sync --settle ${P2} --keep-store`);
    expect(text).toContain("Other files continue.");
  });

  it("settles a conflict by itself when both sides come to hold the same work", () => {
    const { root } = imported();
    editP2(root);
    closeT1(root);
    expect(sync(root).conflicts).toHaveLength(1);
    write(root, P2, P2_TEXT.replace("- [ ] T1: Ship it.", "- [x] T1: Ship it."));
    const report = sync(root);
    expect(fileResult(report, P2).action).toBe("adopted");
    expect(report.conflicts).toEqual([]);
  });
});

describe("W29 R0 P3 copies off (T7, A15)", () => {
  it("keeps and reports a changed copy when copies are off, and removes only unchanged copies", () => {
    const { root } = imported();
    editP2(root);
    const report = sync(root, { projection: "off" });
    expect(report.keptChangedCopies).toEqual([P2]);
    expect(read(root, P2)).toBe(P2_TEXT.replace("Ship it.", "Ship it today."));
    expect(unitAt(root, "W1 R0 P2 T1").body).toBe("Ship it today.");
    expect(report.removed.sort()).toEqual([INDEX, P1]);
    expect(report.written).toEqual([]);
    expect(report.summary).toContain("Kept 1 changed copy");
  });

  it("writes no file with copies off", () => {
    const { root } = imported();
    closeT1(root);
    unlinkSync(path.join(root, INDEX));
    const report = sync(root, { projection: "off" });
    expect(report.written).toEqual([]);
    expect(existsSync(path.join(root, INDEX))).toBe(false);
  });

  it("reads work.projection from config, defaults to on, and stops on a malformed block", () => {
    const root = project("config-check");
    expect(readWorkProjection(root)).toBe("on");
    writeFileSync(path.join(root, ".make-docs/config.yaml"), `projectId: ${PROJECT_ID}\nwork:\n  projection: off\n`);
    expect(readWorkProjection(root)).toBe("off");
    writeFileSync(path.join(root, ".make-docs/config.yaml"), `projectId: ${PROJECT_ID}\nwork:\n  projection: maybe\n`);
    expect(() => readWorkProjection(root)).toThrow(WorkProjectionConfigError);
  });
});

describe("W29 R0 P3 sync details", () => {
  it("keeps a status that the file cannot show, and a met gate, across a later file edit", () => {
    const { root } = imported();
    storeChange(root, "W1 R0 P1 S1", { status: "closed", closeOutcome: "done" });
    storeChange(root, "W1 R0 P1 T3", { status: "in-progress" });
    const gateUnit = unitAt(root, "W1 R0 P1 S2");
    storeChange(root, "W1 R0 P1 S2", { gates: gateUnit.gates.map((gate) => ({ ...gate, met: true })) });
    // W29 R0 P4 T16: these edits are store-only, so the file keeps its bytes and is not named as written.
    const storeOnly = sync(root);
    expect(storeOnly.written).toEqual([]);
    expect(fileResult(storeOnly, P1)).toMatchObject({ decision: "write", action: "none" });
    expect(read(root, P1)).toBe(P1_TEXT);
    write(root, P1, P1_TEXT.replace("Build the parser.", "Build the strict parser."));
    expect(fileResult(sync(root), P1).action).toBe("imported");
    expect(unitAt(root, "W1 R0 P1 S1").status).toBe("closed");
    expect(unitAt(root, "W1 R0 P1 T3").status).toBe("in-progress");
    expect(unitAt(root, "W1 R0 P1 S2").gates[0]!.met).toBe(true);
    expect(unitAt(root, "W1 R0 P1 T1").body).toBe("Build the strict parser.");
  });

  it("keeps store IDs, deletes a task that left its file, and turns its dependents into unresolved text", () => {
    const { root } = imported();
    const ids = new Map(units(root).map((unit) => [unit.coordinate, unit.storeId]));
    write(root, P2, P2_TEXT.replace("- P1 is complete.", "- P1 T3 is complete."));
    sync(root);
    expect(unitAt(root, "W1 R0 P2").dependencies.map((dependency) => dependency.dependsOnStoreId)).toEqual([ids.get("W1 R0 P1 T3")]);
    write(root, P1, P1_TEXT.replace("- [ ] T3: Check it.\n", ""));
    const report = sync(root);
    expect(report.import.records.find((record) => record.path === P1)!.deleted).toEqual(["W1 R0 P1 T3"]);
    expect(units(root).some((unit) => unit.coordinate === "W1 R0 P1 T3")).toBe(false);
    expect(unitAt(root, "W1 R0 P1 T1").storeId).toBe(ids.get("W1 R0 P1 T1"));
    expect(unitAt(root, "W1 R0 P2").unresolvedDependencies.map((entry) => entry.sourceText)).toEqual(["W1 R0 P9", "W1 R0 P1 T3"]);
    expect(report.import.rewired).toEqual([{ unit: "W1 R0 P2", coordinate: "W1 R0 P1 T3", now: "unresolved" }]);
    // P2 stayed the same, so its bytes stay, and its ledger takes the new revision.
    expect(read(root, P2)).toBe(P2_TEXT.replace("- P1 is complete.", "- P1 T3 is complete."));
    expect(fileResult(sync(root), P2).action).toBe("none");
  });

  it("resolves unresolved text when the named unit arrives", () => {
    const { root } = imported();
    write(root, `${RECORD}/09-ninth.md`, "# Phase 9\n");
    const report = sync(root);
    expect(report.import.rewired).toEqual([{ unit: "W1 R0 P2", coordinate: "W1 R0 P9", now: "resolved" }]);
    expect(unitAt(root, "W1 R0 P2").unresolvedDependencies).toEqual([]);
    expect(fileResult(sync(root), P2).action).toBe("none");
  });

  it("moves a backlog to the archive without a conflict and keeps its store IDs", () => {
    const { root } = imported();
    const ids = new Map(units(root).map((unit) => [unit.coordinate, unit.storeId]));
    const archived = RECORD.replace("docs/work", ".make-docs/archive/work");
    mkdirSync(path.join(root, ".make-docs/archive/work"), { recursive: true });
    renameSync(path.join(root, RECORD), path.join(root, archived));
    const report = sync(root);
    expect(report.conflicts).toEqual([]);
    expect(report.moved.map((move) => move.to).sort()).toEqual([`${archived}/00-index.md`, `${archived}/01-first.md`, `${archived}/02-second.md`]);
    for (const unit of units(root)) {
      expect(unit.storeId).toBe(ids.get(unit.coordinate));
      if (unit.kind !== "wave") expect(unit.sourcePath!.startsWith(archived)).toBe(true);
    }
    expect(sync(root).files.every((file) => file.action === "none")).toBe(true);
  });

  it("refuses a file whose coordinate another file holds, and leaves it untouched", () => {
    const { root } = imported();
    const other = "docs/work/2042-07-01-w1-r0-copy/00-index.md";
    write(root, other, INDEX_TEXT);
    const report = sync(root);
    expect(report.unreadable).toEqual([{ path: other, code: "coordinate-taken", line: 1, message: expect.stringContaining(INDEX) }]);
    expect(read(root, other)).toBe(INDEX_TEXT);
  });

  it("a second checkout of the same project adopts identical files without a conflict", () => {
    const { root } = imported();
    const second = project("aurora-second");
    backlog(second);
    const preview = previewInstallationCheckoutMove(second, undefined, store);
    registerSeparateInstallationCheckout(second, preview.separateReviewDigest!, store);
    const report = sync(second);
    expect(report.conflicts).toEqual([]);
    expect(report.files.map((file) => file.action)).toEqual(["adopted", "adopted", "adopted"]);
    // A store change made through the first checkout reaches the second checkout's file.
    write(root, P2, P2_TEXT.replace("- [ ] T1: Ship it.", "- [x] T1: Ship it."));
    sync(root);
    expect(sync(second).written).toEqual([P2]);
    expect(read(second, P2)).toBe(read(root, P2));
  });

  it("refuses a checkout that is not bound to the Store", () => {
    const root = project("unbound");
    backlog(root);
    const other = project("bound-other", `projectId: other-project\n`);
    getInstallationCheckoutId(other, store);
    expect(() => sync(root)).toThrow(/not bound/);
    rmSync(path.join(root, "docs"), { recursive: true });
  });
});

/* ------------------------------------------------------------------------ */
/* Independent review fixes (the reviewer's probes as tests)                */
/* ------------------------------------------------------------------------ */

function claim(root: string, coordinate: string, claimant = "agent-7"): string {
  let claimId = "";
  edit(root, (db) => {
    const unit = listWorkUnits(db, PROJECT_ID).find((candidate) => candidate.coordinate === coordinate)!;
    const outcome = claimWorkUnit(db, { unitStoreId: unit.storeId, claimant, taskHandle: "task-1", ttlSeconds: null, expectedVersion: unit.revision, takeover: null }, { now: NOW });
    if (outcome.result !== "claimed") throw new Error(outcome.refusal ?? "not claimed");
    claimId = outcome.claim.claimId;
  });
  return claimId;
}

describe("W29 R0 P3 review fix 1: units that leave together", () => {
  it("deletes two stages that leave the file when Stage 2 depends on Stage 1, and later syncs still run", () => {
    const { root } = imported();
    expect(unitAt(root, "W1 R0 P1 S2").dependencies).toHaveLength(1);
    write(root, P1, "---\ntitle: \"Phase 1: First\"\nstatus: \"active\"\ncoordinate: \"W1 R0 P1\"\n---\n\n# Phase 1: First\n\n- [ ] T1: Build the parser.\n- [x] t2: Write the old task.\n- [ ] T3: Check it.\n");
    const report = sync(root);
    expect(report.deleted.map((entry) => entry.coordinate).sort()).toEqual(["W1 R0 P1 S1", "W1 R0 P1 S2"]);
    expect(units(root).filter((unit) => unit.sourcePath === P1).map((unit) => unit.coordinate)).toEqual(["W1 R0 P1", "W1 R0 P1 T1", "W1 R0 P1 T2", "W1 R0 P1 T3"]);
    expect(unitAt(root, "W1 R0 P1 T1").parentStoreId).toBe(unitAt(root, "W1 R0 P1").storeId);
    expect(sync(root).files.every((file) => file.action === "none")).toBe(true);
  });
});

describe("W29 R0 P3 review fix 2: a file edit never closes a claimed unit", () => {
  it("stops the file as a conflict that names the unit and its holder, shows no claim ID, and imports once the claim ends", () => {
    const { root } = imported();
    const claimId = claim(root, "W1 R0 P2 T1");
    write(root, P2, P2_TEXT.replace("- [ ] T1: Ship it.", "- [x] T1: Ship it."));
    write(root, P1, P1_TEXT.replace("Check it.", "Check it twice."));
    const report = sync(root);
    expect(fileResult(report, P2).action).toBe("conflict");
    expect(fileResult(report, P1).action).toBe("imported");
    const conflict = report.conflicts.find((entry) => entry.path === P2)!;
    expect(conflict.reasons).toEqual([expect.stringContaining("The file closes W1 R0 P2 T1, and agent-7 holds it on a live claim until")]);
    expect(conflict.affectedUnits.sort()).toEqual(["W1 R0 P2", "W1 R0 P2 S1", "W1 R0 P2 T1"]);
    expect(JSON.stringify(report)).not.toContain(claimId);
    expect(unitAt(root, "W1 R0 P2 T1").status).toBe("open");
    expect(readWorkStore(root, (db) => db.prepare("SELECT count(*) AS n FROM work_claims").get(), { storeRoot: store })).toEqual({ n: 1 });
    // The conflict stays while the claim is live.
    expect(fileResult(sync(root), P2).action).toBe("still-in-conflict");
    // After the holder releases the claim, the next sync imports the edit and clears the conflict.
    edit(root, (db) => {
      const unit = listWorkUnits(db, PROJECT_ID).find((candidate) => candidate.coordinate === "W1 R0 P2 T1")!;
      expect(releaseWorkClaim(db, { unitStoreId: unit.storeId, claimId, expectedVersion: unit.revision })).toEqual({ accepted: true, refusal: null });
    });
    const after = sync(root);
    expect(fileResult(after, P2).action).toBe("imported");
    expect(after.conflicts).toEqual([]);
    expect(unitAt(root, "W1 R0 P2 T1").status).toBe("closed");
  });
});

describe("W29 R0 P3 review fix 3: a unit that leaves its file", () => {
  it("(a, c) deletes a unit with nothing the file cannot show, and names it in the summary", () => {
    const { root } = imported();
    write(root, P1, P1_TEXT.replace("- [ ] T3: Check it.\n", ""));
    const report = sync(root);
    expect(report.deleted).toEqual([{ coordinate: "W1 R0 P1 T3", path: P1 }]);
    expect(report.summary).toContain(`Deleted 1 unit that left its file: W1 R0 P1 T3 (${P1}).`);
  });

  it("(b) stops the file, and keeps the unit, when a typo drops a task that is in progress", () => {
    const { root } = imported();
    storeChange(root, "W1 R0 P1 T1", { status: "in-progress" });
    sync(root);
    write(root, P1, P1_TEXT.replace("T1: Build the parser.", "T1 Build the parser."));
    const report = sync(root);
    expect(fileResult(report, P1).action).toBe("conflict");
    expect(report.conflicts[0]!.reasons).toEqual(["W1 R0 P1 T1 left the file, and the store holds what the file cannot show: the status in-progress."]);
    expect(report.deleted).toEqual([]);
    expect(unitAt(root, "W1 R0 P1 T1").status).toBe("in-progress");
    expect(report.summary).toContain("Make Docs stopped this file instead of importing it");
  });

  it("(b) stops the file when a unit with a met gate, or a live claim, leaves it", () => {
    const { root } = imported();
    const gated = unitAt(root, "W1 R0 P1 S2");
    storeChange(root, "W1 R0 P1 S2", { gates: gated.gates.map((gate) => ({ ...gate, met: true })) });
    sync(root);
    claim(root, "W1 R0 P2 T1");
    write(root, P1, P1_TEXT.replace(/## Stage 2 - Check[\s\S]*$/, ""));
    write(root, P2, P2_TEXT.replace("- [ ] T1: Ship it.\n", ""));
    const report = sync(root);
    expect(report.conflicts.find((entry) => entry.path === P1)!.reasons).toEqual(["W1 R0 P1 S2 left the file, and the store holds what the file cannot show: a met gate."]);
    expect(report.conflicts.find((entry) => entry.path === P2)!.reasons).toEqual([expect.stringMatching(/^W1 R0 P2 T1 left the file, and agent-7 holds it on a live claim until /)]);
    expect(report.deleted).toEqual([]);
  });

  it("records that renumbered tasks move store IDs with their coordinates (R-COORD-20)", () => {
    const { root } = imported();
    const before = new Map(units(root).map((unit) => [unit.coordinate, unit.storeId]));
    write(root, P1, P1_TEXT.replace("T1: Build the parser.", "T1: Check it.").replace("T3: Check it.", "T3: Build the parser."));
    sync(root);
    // The store ID follows the coordinate, so "Build the parser." now sits on T3's store ID.
    expect(unitAt(root, "W1 R0 P1 T1").storeId).toBe(before.get("W1 R0 P1 T1"));
    expect(unitAt(root, "W1 R0 P1 T1").body).toBe("Check it.");
    expect(unitAt(root, "W1 R0 P1 T3").body).toBe("Build the parser.");
  });
});

describe("W29 R0 P3 review fix 4: the first sync of a checkout writes no file", () => {
  it("imports only, says what the next sync writes, and the next sync writes and names it", () => {
    imported();
    const second = project("aurora-branch");
    write(second, INDEX, INDEX_TEXT);
    const preview = previewInstallationCheckoutMove(second, undefined, store);
    registerSeparateInstallationCheckout(second, preview.separateReviewDigest!, store);
    const first = sync(second);
    expect(first.firstImport).toBe(true);
    expect(first.written).toEqual([]);
    expect(first.deferred.write.sort()).toEqual([P1, P2]);
    expect(existsSync(path.join(second, P1))).toBe(false);
    expect(first.summary).toContain("Make Docs wrote and removed no project file.");
    expect(first.summary).toContain(`The next sync writes 2 files: ${P1}, ${P2}.`);
    const next = sync(second);
    expect(next.written.sort()).toEqual([P1, P2]);
    expect(next.summary).toContain(`Wrote: ${P1}, ${P2}.`);
    expect(read(second, P1)).toBe(P1_TEXT);
  });
});

describe("W29 R0 P3 review fix 5: a phase named with its own title", () => {
  it("is a dependency only when the extra words are that unit's real title", () => {
    const all = () => true;
    const titles = new Map([["W10 R1 P1", "Phase 1: Trace and Scope"], ["W10 R1 P2 S1", "Build"]]);
    const titleOf = (coordinate: string) => titles.get(coordinate) ?? null;
    expect(readDependencyBullet("Phase 1 trace and scope.", "W10 R1 P2", all, titleOf)).toMatchObject({ gate: false, dependencies: ["W10 R1 P1"] });
    expect(readDependencyBullet("Phase 01 trace and scope.", "W10 R1 P2", all, titleOf)).toMatchObject({ gate: false, dependencies: ["W10 R1 P1"] });
    expect(readDependencyBullet("Stage 1 build.", "W10 R1 P2 S2", all, titleOf)).toMatchObject({ gate: false, dependencies: ["W10 R1 P2 S1"] });
    expect(readDependencyBullet("Phase 1 trace and scope approved by the owner.", "W10 R1 P2", all, titleOf).gate).toBe(true);
    expect(readDependencyBullet("Phase 1 something else.", "W10 R1 P2", all, titleOf).gate).toBe(true);
    expect(readDependencyBullet("Phase 1 trace and scope.", "W10 R1 P2", all).gate).toBe(true);
  });

  it("uses the titles of the store and of the files in the same import", () => {
    const root = project();
    backlog(root);
    write(root, P2, P2_TEXT.replace("- P1 is complete.", "- Phase 1: First."));
    getInstallationCheckoutId(root, store);
    const report = sync(root);
    expect(report.import.gates.find((gate) => gate.unit === "W1 R0 P2")).toBeUndefined();
    expect(report.import.resolvedDependencies.map((entry) => [entry.unit, entry.dependsOn, entry.sourceText])).toContainEqual(["W1 R0 P2", "W1 R0 P1", "Phase 1: First."]);
  });
});

describe("W29 R0 P3 review fix 6: a waiting file stays as it is", () => {
  it("never changes units in a file that waits for a person, and stops the deleting file instead", () => {
    const { root } = imported();
    write(root, P2, P2_TEXT.replace("- P1 is complete.", "- P1 T3 is complete."));
    sync(root);
    editP2(root);
    storeChange(root, "W1 R0 P2 T1", { status: "closed", closeOutcome: "done" });
    expect(sync(root).conflicts.map((entry) => entry.path)).toEqual([P2]);
    const p2Before = units(root).filter((unit) => unit.sourcePath === P2).map((unit) => [unit.coordinate, unit.revision]);
    write(root, P1, P1_TEXT.replace("- [ ] T3: Check it.\n", ""));
    const report = sync(root);
    expect(report.conflicts.find((entry) => entry.path === P1)!.reasons).toEqual([`W1 R0 P1 T3 left the file, and W1 R0 P2 in ${P2} depends on it while that file waits for a person.`]);
    expect(units(root).filter((unit) => unit.sourcePath === P2).map((unit) => [unit.coordinate, unit.revision])).toEqual(p2Before);
    expect(unitAt(root, "W1 R0 P1 T3")).toBeDefined();
  });
});

describe("W29 R0 P3 review fix 7: a byte order mark and no final newline", () => {
  it("changes a task on line 1 after a byte order mark, and keeps the mark", () => {
    const text = "\uFEFF- [ ] T1: First line task.\n- [ ] T2: Second.";
    const parsed = parseWorkFile(P1, text);
    if (!parsed.ok) throw new Error(parsed.failure.message);
    expect(joinWorkFileLines(parsed.document.lines)).toBe(text);
    const states = workFileUnitStates(parsed.document).map((state) => (state.kind === "task" ? { ...state, status: "closed" as const, closeOutcome: "done" as const } : state));
    const rendered = renderWorkFile(parsed.document, states);
    expect(rendered).toEqual({ ok: true, text: "\uFEFF- [x] T1: First line task.\n- [x] T2: Second.", changedUnits: ["W1 R0 P1 T1", "W1 R0 P1 T2"] });
  });

  it("round-trips a file with no final newline through sync", () => {
    const root = project();
    backlog(root);
    write(root, P2, P2_TEXT.trimEnd());
    getInstallationCheckoutId(root, store);
    sync(root);
    storeChange(root, "W1 R0 P2 T1", { status: "closed", closeOutcome: "done" });
    sync(root);
    expect(read(root, P2)).toBe(P2_TEXT.trimEnd().replace("- [ ] T1: Ship it.", "- [x] T1: Ship it."));
  });
});

describe("W29 R0 P3 review fix 8: a write hold", () => {
  it("never writes or removes a file under a held folder, and reports it", () => {
    const hold = { folder: "docs/work/2026-11-13-w22-r2-portable-checkout-adoption", reason: "It waits for its own project doctor run (register D-063)." };
    const held = "docs/work/2026-11-13-w22-r2-portable-checkout-adoption/01-first.md";
    const root = project();
    write(root, "docs/work/2026-11-13-w22-r2-portable-checkout-adoption/00-index.md", "# W22 R2\n");
    write(root, held, "# Phase 1\n\n- [ ] t1: Old task.\n");
    getInstallationCheckoutId(root, store);
    syncWorkFiles(root, { storeRoot: store, now: NOW, holdWrites: [hold] });
    storeChange(root, "W22 R2 P1 T1", { status: "closed", closeOutcome: "done" });
    const report = syncWorkFiles(root, { storeRoot: store, now: NOW, holdWrites: [hold] });
    expect(report.held).toEqual([{ path: held, reason: hold.reason }]);
    expect(fileResult(report, held).action).toBe("held");
    expect(read(root, held)).toBe("# Phase 1\n\n- [ ] t1: Old task.\n");
    expect(report.summary).toContain(`Held, not written: ${held}.`);
    const off = syncWorkFiles(root, { storeRoot: store, now: NOW, holdWrites: [hold], projection: "off" });
    expect(off.removed).toEqual([]);
    expect(existsSync(path.join(root, held))).toBe(true);
  });
});

describe("W29 R0 P3 review fix 10: copies off says what happens next", () => {
  it("says that a later sync removes the kept copy", () => {
    const { root } = imported();
    editP2(root);
    const report = sync(root, { projection: "off" });
    expect(report.summary).toContain("Copies are off, so Make Docs imported each edit, and a later sync removes the copy, because it then matches the store.");
    const later = sync(root, { projection: "off" });
    expect(later.removed).toEqual([P2]);
  });
});


/* ------------------------------------------------------------------------ */
/* Re-check review fixes (the re-check reviewer's probes as tests)          */
/* ------------------------------------------------------------------------ */

describe("W29 R0 P3 re-check fix 1: guard order never matters", () => {
  it("stops the deleting file when an earlier stopped file depends on the unit, on every sync, and never throws", () => {
    const root = project();
    const first = "---\ntitle: \"P1\"\nstatus: \"active\"\ncoordinate: \"W1 R0 P1\"\n---\n\n# P1\n\n## Stage 1 - A\n\n### Tasks\n\n- [ ] T1: One.\n\n## Stage 2 - B\n\n### Tasks\n\n- [ ] T2: Two.\n\n### Dependencies\n\n- W1 R0 P2 S1.\n";
    const second = "---\ntitle: \"P2\"\nstatus: \"active\"\ncoordinate: \"W1 R0 P2\"\n---\n\n# P2\n\n## Stage 1 - Ship\n\n### Tasks\n\n- [ ] T1: Ship.\n";
    write(root, INDEX, INDEX_TEXT);
    write(root, P1, first);
    write(root, P2, second);
    getInstallationCheckoutId(root, store);
    sync(root);
    expect(unitAt(root, "W1 R0 P1 S2").dependencies).toHaveLength(1);
    const claimId = claim(root, "W1 R0 P1 T1");
    // 01-first.md closes a claimed task, so it stops. 02-second.md removes S1, which the stopped file's S2 needs.
    write(root, P1, first.replace("- [ ] T1: One.", "- [x] T1: One."));
    write(root, P2, second.replace("## Stage 1 - Ship\n\n", ""));
    for (const round of [1, 2]) {
      const report = sync(root);
      expect(fileResult(report, P1).action, `round ${round}`).toBe(round === 1 ? "conflict" : "still-in-conflict");
      expect(fileResult(report, P2).action, `round ${round}`).toBe(round === 1 ? "conflict" : "still-in-conflict");
      expect(report.conflicts.find((entry) => entry.path === P2)!.reasons).toEqual([`W1 R0 P2 S1 left the file, and W1 R0 P1 S2 in ${P1} depends on it while that file waits for a person.`]);
      expect(JSON.stringify(report)).not.toContain(claimId);
    }
    expect(unitAt(root, "W1 R0 P2 S1")).toBeDefined();
    expect(unitAt(root, "W1 R0 P1 T1").status).toBe("open");
  });
});

describe("W29 R0 P3 re-check fix 3: a file the file system refuses", () => {
  it("reports a failed write as a typed file error, keeps that file's records, writes the other files, and retries", () => {
    if (process.getuid?.() === 0) return; // A root user ignores folder permissions.
    const other = "docs/work/2042-06-02-w2-r0-borealis";
    const root = project();
    backlog(root);
    write(root, `${other}/00-index.md`, "---\ntitle: \"W2 R0\"\nstatus: \"active\"\ncoordinate: \"W2 R0\"\n---\n\n# W2 R0\n");
    write(root, `${other}/01-first.md`, "# P1\n\n- [ ] T1: Other.\n");
    getInstallationCheckoutId(root, store);
    sync(root);
    storeChange(root, "W1 R0 P2 T1", { status: "closed", closeOutcome: "done" });
    storeChange(root, "W2 R0 P1 T1", { status: "closed", closeOutcome: "done" });
    const ledgerBefore = readWorkStore(root, (db) => listSyncLedger(db, getInstallationCheckoutId(root, store)).find((row) => row.entry.targetPath === `${other}/01-first.md`)!.entry, { storeRoot: store });
    const folder = path.join(root, ...other.split("/"));
    chmodSync(folder, 0o555);
    let report: WorkSyncReport;
    try {
      report = sync(root);
    } finally {
      chmodSync(folder, 0o755);
    }
    expect(report.written).toEqual([P2]);
    expect(report.fileErrors).toEqual([{ path: `${other}/01-first.md`, operation: "write", code: "EACCES", message: expect.any(String) }]);
    expect(fileResult(report, `${other}/01-first.md`).action).toBe("not-written");
    expect(report.summary).toContain(`Could not write ${other}/01-first.md (EACCES).`);
    expect(read(root, `${other}/01-first.md`)).toBe("# P1\n\n- [ ] T1: Other.\n");
    expect(readdirSync(folder).filter((name) => name.endsWith(".tmp"))).toEqual([]);
    const ledgerAfter = readWorkStore(root, (db) => listSyncLedger(db, getInstallationCheckoutId(root, store)).find((row) => row.entry.targetPath === `${other}/01-first.md`)!.entry, { storeRoot: store });
    expect(ledgerAfter).toEqual(ledgerBefore);
    expect(read(root, P2)).toBe(P2_TEXT.replace("- [ ] T1: Ship it.", "- [x] T1: Ship it."));
    const retry = sync(root);
    expect(retry.written).toEqual([`${other}/01-first.md`]);
    expect(read(root, `${other}/01-first.md`)).toBe("# P1\n\n- [x] T1: Other.\n");
  });
});

describe("W29 R0 P3 re-check fix 4: links from other documents", () => {
  it("stops the file when a unit with links from other documents leaves it", () => {
    const { root } = imported();
    const unit = unitAt(root, "W1 R0 P1 T3");
    storeChange(root, "W1 R0 P1 T3", { links: [...unit.links, { direction: "inbound", kind: "design", path: "docs/designs/2042-06-01-aurora.md", anchor: null }] });
    sync(root);
    write(root, P1, P1_TEXT.replace("- [ ] T3: Check it.\n", ""));
    const report = sync(root);
    expect(report.conflicts[0]!.reasons).toEqual(["W1 R0 P1 T3 left the file, and the store holds what the file cannot show: links from other documents."]);
    expect(report.deleted).toEqual([]);
    expect(unitAt(root, "W1 R0 P1 T3").links.some((link) => link.direction === "inbound")).toBe(true);
  });
});

describe("W29 R0 P3 re-check fix 2: the first sync of a checkout is recorded", () => {
  it("adds work_sync_checkouts to schema v8 with its guard triggers, catalog entry, and rollback check", () => {
    const root = project();
    getInstallationCheckoutId(root, store);
    const raw = new DatabaseSync(path.join(store, "store.db"));
    try {
      // W30 R0 P2 made schema v9 current; the v8 table is part of it.
      expect(raw.prepare("PRAGMA user_version").get()).toEqual({ user_version: 9 });
      expect((raw.prepare("PRAGMA table_info(work_sync_checkouts)").all() as Array<{ name: string }>).map((column) => column.name)).toEqual(["checkout_id", "first_synced_at"]);
      const triggers = raw.prepare("SELECT count(*) AS n FROM sqlite_schema WHERE type = 'trigger' AND tbl_name = 'work_sync_checkouts'").get() as { n: number };
      expect(Number(triggers.n)).toBe(3);
      expect(STORE_TABLE_CATALOG.find((entry) => entry.table === "work_sync_checkouts")).toMatchObject({ sinceSchema: 8, recordClass: "Store-cached and rebuildable", rowClasses: [{ maintenanceClass: "bounded" }] });
      // A Store that reports schema 7 but has this table was changed outside Make Docs.
      raw.exec("PRAGMA user_version=7");
      expect(inspectStoreVersionRollback(raw)).toContain("The Store reports schema 7 but has the work_sync_checkouts table from schema 8.");
    } finally {
      raw.close();
    }
  });

  it("marks the first sync once, and keeps the first time", () => {
    const root = project();
    backlog(root);
    const checkoutId = getInstallationCheckoutId(root, store);
    expect(readWorkStore(root, (db) => readWorkSyncCheckout(db, checkoutId), { storeRoot: store })).toBeNull();
    expect(sync(root).firstImport).toBe(true);
    expect(readWorkStore(root, (db) => readWorkSyncCheckout(db, checkoutId), { storeRoot: store })).toBe(NOW.toISOString());
    expect(sync(root, { now: new Date("2042-06-16T12:00:00.000Z") }).firstImport).toBe(false);
    expect(readWorkStore(root, (db) => readWorkSyncCheckout(db, checkoutId), { storeRoot: store })).toBe(NOW.toISOString());
  });

  it("writes a second checkout's files on its second sync, also when it has no work file at all", () => {
    imported();
    const empty = project("aurora-empty");
    const preview = previewInstallationCheckoutMove(empty, undefined, store);
    registerSeparateInstallationCheckout(empty, preview.separateReviewDigest!, store);
    const first = sync(empty);
    expect(first.firstImport).toBe(true);
    expect(first.written).toEqual([]);
    expect(first.deferred.write).toEqual([INDEX, P1, P2]);
    expect(first.summary).toContain(`The next sync writes 3 files: ${INDEX}, ${P1}, ${P2}.`);
    const second = sync(empty);
    expect(second.firstImport).toBe(false);
    expect(second.written).toEqual([INDEX, P1, P2]);
    expect(second.summary).toContain(`Wrote: ${INDEX}, ${P1}, ${P2}.`);
    expect(read(empty, P1)).toBe(P1_TEXT);
    expect(sync(empty).files.every((file) => file.action === "none")).toBe(true);
  });

  it("writes the files again when copies go on, then off, then on", () => {
    const root = project();
    write(root, INDEX, INDEX_TEXT);
    write(root, P1, P1_TEXT);
    getInstallationCheckoutId(root, store);
    expect(sync(root).firstImport).toBe(true);
    const off = sync(root, { projection: "off" });
    expect(off.firstImport).toBe(false);
    expect(off.removed).toEqual([INDEX, P1]);
    for (const again of [sync(root, { projection: "off" }), sync(root, { projection: "off" })]) {
      expect(again.firstImport).toBe(false);
      expect(again.summary).not.toContain("First sync");
      expect(again.written).toEqual([]);
    }
    const on = sync(root, { projection: "on" });
    expect(on.firstImport).toBe(false);
    expect(on.written).toEqual([INDEX, P1]);
    expect(read(root, P1)).toBe(P1_TEXT);
    expect(sync(root).files.every((file) => file.action === "none")).toBe(true);
  });
});
