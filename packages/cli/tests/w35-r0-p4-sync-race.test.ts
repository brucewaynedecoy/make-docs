import { spawn, spawnSync, type ChildProcessWithoutNullStreams } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HARNESS_CALLER_IDENTITY_ENV } from "../src/harness-access/contract";
import type { WorkCheckpointResult } from "../src/operations/work/work-queue/checkpoint";
import type { WorkUnitRecord } from "../src/operations/work/work-store/schemas";
import { previewWorkSync, syncWorkFiles } from "../src/operations/work/work-store/sync";
import { platform } from "../src/platform";
import { getInstallationCheckoutId } from "../src/store/installation-state";
import { getStoreDatabasePath } from "../src/store/paths";
import { listWorkUnits, readWorkStore, readWorkUnitNote } from "../src/store/work-store";
import { cleanupTempDir, createTempDir } from "./helpers";

/**
 * W35 R0 P4 Stage 5 (T19 to T21, A47a to A47d): two syncs of one checkout at
 * the same time (risk register R-041).
 *
 * The fault: sync read the work files before it took the Store. The second of
 * two runs then imported the file text from before the first run wrote it.
 *
 * How each test forces the two runs to overlap, with no seam in the product
 * code: a helper process takes the Store write lock and holds it. The test
 * then starts two runs of the built CLI. Each run does all that it does before
 * its Store write session, and then waits for the lock. The helper lets go
 * only after both runs had time to reach that point. So both runs are at the
 * Store at the same time, and the test proves it: each run started before the
 * lock opened and ended after it. With the scan before the write session, both
 * runs hold the older file text at that moment, and the second run imports it.
 */

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.resolve(HERE, "../dist/index.js");
const PROJECT_ID = "aurora-w35-race";
const RECORD = "docs/work/2042-06-01-w1-r0-aurora";
const INDEX = `${RECORD}/00-index.md`;
const P1 = `${RECORD}/01-first.md`;
const TASK = "W1 R0 P1 T1";
const STAGE = "W1 R0 P1 S1";
const GATE = "The owner approved the parser form.";
const NOTE = "Half of the parser cases pass.";
/** How long the helper holds the Store before the two runs may write. A run waits at most 5 seconds for the Store. */
const HOLD_MS = 2_500;

const INDEX_TEXT = `---
title: "W1 R0 Aurora"
kind: "work"
status: "active"
coordinate: "W1 R0"
---

# W1 R0 Aurora
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
- [ ] T2: Write the writer.

### Dependencies

- ${GATE}
`;

/** The helper: take the Store write lock, say so, and let go when the test closes its input. */
const HOLDER = `
const { DatabaseSync } = require("node:sqlite");
const db = new DatabaseSync(process.argv[1]);
db.exec("PRAGMA busy_timeout = 5000");
db.exec("BEGIN IMMEDIATE");
process.stdout.write("held\\n");
process.stdin.on("end", () => { db.exec("COMMIT"); db.close(); process.stdout.write("open\\n"); });
process.stdin.resume();
`;

const roots: string[] = [];
let temp: string;
let store: string;

beforeEach(() => {
  temp = platform.describePath(createTempDir("make-docs-w35-p4-race-")).canonicalPath;
  roots.push(temp);
  store = path.join(temp, "store");
  vi.stubEnv("MAKE_DOCS_HOME", store);
  vi.stubEnv(HARNESS_CALLER_IDENTITY_ENV, "");
  // An empty value means the real Store, so the run stops when the value is empty.
  expect(process.env.MAKE_DOCS_HOME).toBe(store);
  expect(store.startsWith(temp)).toBe(true);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  while (roots.length) cleanupTempDir(roots.pop()!);
});

function write(root: string, relative: string, text: string): void {
  const target = path.join(root, ...relative.split("/"));
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, text);
}

/** A bound checkout with the fixture backlog on disk, before its first sync. */
function bound(): string {
  const root = path.join(temp, "aurora");
  mkdirSync(path.join(root, ".make-docs"), { recursive: true });
  writeFileSync(path.join(root, ".make-docs/config.yaml"), `projectId: ${PROJECT_ID}\nprojectName: aurora\n`);
  const canonical = platform.describePath(root).canonicalPath;
  write(canonical, INDEX, INDEX_TEXT);
  write(canonical, P1, P1_TEXT);
  getInstallationCheckoutId(canonical, store);
  return canonical;
}

function units(root: string): WorkUnitRecord[] {
  return readWorkStore(root, (db) => listWorkUnits(db, PROJECT_ID), { storeRoot: store });
}

function unit(root: string, coordinate: string): WorkUnitRecord {
  return units(root).find((candidate) => candidate.coordinate === coordinate)!;
}

function noteOf(root: string, coordinate: string): string | null {
  return readWorkStore(root, (db) => readWorkUnitNote(db, unit(root, coordinate).storeId)?.note ?? null, { storeRoot: store });
}

function childEnv(): NodeJS.ProcessEnv {
  return { ...process.env, MAKE_DOCS_HOME: store, [HARNESS_CALLER_IDENTITY_ENV]: "" };
}

function run(args: string[]): { status: number | null; stdout: string; stderr: string } {
  expect(process.env.MAKE_DOCS_HOME).toBe(store);
  return spawnSync(process.execPath, [CLI, ...args], { encoding: "utf8", cwd: temp, env: childEnv() });
}

function checkpoint(root: string): WorkCheckpointResult {
  const result = run(["project", "checkpoint", "--target-root", root, "--json"]);
  expect(result.status, result.stderr).toBe(0);
  return JSON.parse(result.stdout) as WorkCheckpointResult;
}

interface Timed {
  status: number | null;
  stdout: string;
  stderr: string;
  startedAt: number;
  endedAt: number;
}

/** Start the built CLI and do not wait, so that two runs can work at the same time. */
function start(args: string[]): Promise<Timed> {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const child = spawn(process.execPath, [CLI, ...args], { cwd: temp, env: childEnv() });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += String(chunk); });
    child.stderr.on("data", (chunk) => { stderr += String(chunk); });
    child.on("error", reject);
    child.on("close", (status) => resolve({ status, stdout, stderr, startedAt, endedAt: Date.now() }));
  });
}

/** Wait for one line of the helper's output. */
function line(child: ChildProcessWithoutNullStreams, text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    let seen = "";
    let errors = "";
    child.stdout.on("data", (chunk) => {
      seen += String(chunk);
      if (seen.includes(`${text}\n`)) resolve();
    });
    child.stderr.on("data", (chunk) => { errors += String(chunk); });
    child.on("error", reject);
    child.on("close", (status) => reject(new Error(`The lock helper ended with status ${status} before it said "${text}". ${errors}`)));
  });
}

/**
 * Two checkpoint runs of the built CLI that are at the Store at the same time.
 * The result holds each run's answer and the proof that the runs overlapped.
 */
async function twoRunsAtTheSameTime(root: string): Promise<{ answers: WorkCheckpointResult[]; runs: Timed[]; openedAt: number }> {
  expect(process.env.MAKE_DOCS_HOME).toBe(store);
  const holder = spawn(process.execPath, ["-e", HOLDER, getStoreDatabasePath(store)], { cwd: temp, env: childEnv() });
  const held = line(holder, "held");
  const opened = line(holder, "open");
  opened.catch(() => undefined);
  await held;
  const pending = [
    start(["project", "checkpoint", "--target-root", root, "--json"]),
    start(["project", "checkpoint", "--target-root", root, "--json"]),
  ];
  await new Promise((resolve) => setTimeout(resolve, HOLD_MS));
  holder.stdin.end();
  await opened;
  const openedAt = Date.now();
  const runs = await Promise.all(pending);
  for (const result of runs) expect(result.status, result.stderr).toBe(0);
  // The proof of the overlap: each run started while the helper held the Store, and each one ended after the
  // helper let go. A checkpoint needs the Store write lock, so both runs waited for it at the same time.
  for (const result of runs) {
    expect(result.startedAt).toBeLessThan(openedAt - HOLD_MS + 500);
    expect(result.endedAt).toBeGreaterThanOrEqual(openedAt);
  }
  return { answers: runs.map((result) => JSON.parse(result.stdout) as WorkCheckpointResult), runs, openedAt };
}

/** The first sync, then a close of T1 in the store with an outcome that a task line cannot show. */
function closeInStore(root: string, outcome: "cancelled" | "superseded"): void {
  const first = checkpoint(root);
  expect(first.firstSync).toBe(true);
  const closed = run(["work", "close", TASK, "--expected-version", String(unit(root, TASK).revision), "--outcome", outcome, "--target-root", root, "--json"]);
  expect(closed.status, closed.stderr).toBe(0);
  expect([unit(root, TASK).status, unit(root, TASK).closeOutcome]).toEqual(["closed", outcome]);
  // The close is in the store only. The file still shows the task as open, so the next sync writes the file.
  expect(readFileSync(path.join(root, P1), "utf8")).toContain("- [ ] T1: Build the parser.");
}

describe.skipIf(!existsSync(CLI))("W35 R0 P4 two syncs at the same time (R-041, T19 to T21)", () => {
  for (const outcome of ["cancelled", "superseded"] as const) {
    it(`keeps the close outcome ${outcome} when two checkpoint runs are at the Store at the same time`, async () => {
      const root = bound();
      closeInStore(root, outcome);

      const { answers } = await twoRunsAtTheSameTime(root);

      // The store keeps the outcome, and no run shows the unit as open.
      expect([unit(root, TASK).status, unit(root, TASK).closeOutcome]).toEqual(["closed", outcome]);
      for (const answer of answers) {
        expect([answer.syncRan, answer.conflicts.length, answer.waiting.length]).toEqual([true, 0, 0]);
        expect(answer.next.map((item) => item.coordinate)).not.toContain(TASK);
      }
      // One run wrote the close to the file. The other run read the file after that write, so it imported nothing.
      expect(answers.flatMap((answer) => answer.written)).toEqual([P1]);
      expect(answers.flatMap((answer) => answer.imported)).toEqual([]);
      expect(answers.filter((answer) => answer.nothingDue)).toHaveLength(1);
      expect(readFileSync(path.join(root, P1), "utf8")).toContain("- [x] T1: Build the parser.");

      // A later run finds nothing due, and the outcome is still there.
      const later = checkpoint(root);
      expect([later.nothingDue, later.imported.length, later.written.length, later.conflicts.length]).toEqual([true, 0, 0, 0]);
      expect([unit(root, TASK).status, unit(root, TASK).closeOutcome]).toEqual(["closed", outcome]);
    }, 120_000);
  }

  /** Close T1 in the store with the outcome `cancelled`, so that the next sync writes the file and the race can happen. */
  function closeTask(root: string): void {
    const closed = run(["work", "close", TASK, "--expected-version", String(unit(root, TASK).revision), "--outcome", "cancelled", "--target-root", root, "--json"]);
    expect(closed.status, closed.stderr + closed.stdout).toBe(0);
  }

  it("keeps a progress note when two checkpoint runs are at the Store at the same time", async () => {
    const root = bound();
    expect(checkpoint(root).firstSync).toBe(true);
    // A note on the task. It stays in the store only: the file cannot show it.
    const note = run(["work", "report", TASK, "--expected-version", String(unit(root, TASK).revision), "--note", NOTE, "--target-root", root, "--json"]);
    expect(note.status, note.stderr + note.stdout).toBe(0);
    closeTask(root);
    expect(noteOf(root, TASK)).toBe(NOTE);

    const { answers } = await twoRunsAtTheSameTime(root);

    for (const answer of answers) expect([answer.syncRan, answer.conflicts.length]).toEqual([true, 0]);
    expect(noteOf(root, TASK)).toBe(NOTE);
    expect([unit(root, TASK).status, unit(root, TASK).closeOutcome]).toEqual(["closed", "cancelled"]);
    expect(checkpoint(root).nothingDue).toBe(true);
    expect(noteOf(root, TASK)).toBe(NOTE);
  }, 120_000);

  it("keeps a met gate when two checkpoint runs are at the Store at the same time", async () => {
    const root = bound();
    expect(checkpoint(root).firstSync).toBe(true);
    // A met gate on the stage. It stays in the store only: the file cannot show it.
    const gate = run(["work", "report", STAGE, "--expected-version", String(unit(root, STAGE).revision), "--met-gate", GATE, "--target-root", root, "--json"]);
    expect(gate.status, gate.stderr + gate.stdout).toBe(0);
    closeTask(root);
    const gates = () => unit(root, STAGE).gates.map((entry) => [entry.sourceText, entry.met]);
    expect(gates()).toEqual([[GATE, true]]);

    const { answers } = await twoRunsAtTheSameTime(root);

    for (const answer of answers) expect([answer.syncRan, answer.conflicts.length]).toEqual([true, 0]);
    expect(gates()).toEqual([[GATE, true]]);
    expect([unit(root, TASK).status, unit(root, TASK).closeOutcome]).toEqual(["closed", "cancelled"]);
    expect(checkpoint(root).nothingDue).toBe(true);
    expect(gates()).toEqual([[GATE, true]]);
  }, 120_000);
});

describe("W35 R0 P4 the read-only sync check stays read-only (T18, A47a)", () => {
  it("the read-only sync check changes no Store record and takes no write session", () => {
    const root = bound();
    syncWorkFiles(root, { storeRoot: store });
    write(root, P1, P1_TEXT.replace("Build the parser.", "Build the new parser."));
    const database = getStoreDatabasePath(store);
    const before = JSON.stringify(units(root));
    // Another connection holds the Store write lock. A check that took a write session would wait and then fail.
    const holder = spawn(process.execPath, ["-e", HOLDER, database], { cwd: temp, env: childEnv() });
    return line(holder, "held").then(() => {
      try {
        const started = Date.now();
        const preview = previewWorkSync(root, { storeRoot: store });
        expect(preview.pending.map((file) => [file.path, file.decision])).toEqual([[P1, "import"]]);
        expect(Date.now() - started).toBeLessThan(4_000);
      } finally {
        holder.stdin.end();
      }
      return new Promise<void>((resolve) => holder.on("close", () => resolve())).then(() => {
        expect(JSON.stringify(units(root))).toBe(before);
      });
    });
  }, 60_000);
});
