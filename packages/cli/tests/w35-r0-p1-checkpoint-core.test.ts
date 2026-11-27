import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  CHECKPOINT_COMMAND,
  CHECKPOINT_EVENTS,
  CHECKPOINT_NEXT_LIMIT,
  checkpointEventRefusal,
  isCheckpointEvent,
  workCheckpoint,
  type CheckpointEvent,
  type WorkCheckpointResult,
} from "../src/operations/work/work-queue/checkpoint";
import { WORK_AUTHORITY_FILES_NEXT, workAuthority, workClaim, workSync, type WorkQueueEnv } from "../src/operations/work/work-queue/queue";
import type { WorkUnitRecord } from "../src/operations/work/work-store/schemas";
import { WORK_SYNC_HOLD_REASON } from "../src/operations/work/work-store/sync";
import { platform } from "../src/platform";
import { getInstallationCheckoutId, previewInstallationCheckoutMove, registerSeparateInstallationCheckout } from "../src/store/installation-state";
import { getStoreDatabasePath } from "../src/store/paths";
import { STORE_MIGRATIONS, applyStoreMigrations, openStoreSqliteConnection } from "../src/store/database";
import { listSyncLedger, listWorkClaims, listWorkUnits, newWorkUnitStoreId, putWorkUnit, readWorkStore, writeWorkStore } from "../src/store/work-store";
import { cleanupTempDir, createTempDir } from "./helpers";

/**
 * W35 R0 P1: the core of the project checkpoint. These tests run the core
 * function only. `w35-r0-p1-checkpoint-surfaces.test.ts` covers the registry
 * operation, the CLI command, and the MCP tool. No test reaches the real Store: `MAKE_DOCS_HOME` points
 * at a temporary folder at a fixed, checked path. No test writes this
 * repository's files.
 */

const NOW = new Date("2042-06-15T12:00:00.000Z");
const PROJECT_ID = "aurora-w35-project";
const RECORD = "docs/work/2042-06-01-w1-r0-aurora";
const INDEX = `${RECORD}/00-index.md`;
const P1 = `${RECORD}/01-first.md`;
const P2 = `${RECORD}/02-second.md`;

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
`;

const P2_TEXT = `---
title: "Phase 2: Second"
status: "active"
coordinate: "W1 R0 P2"
---

# Phase 2: Second

## Stage 1 - Ship

### Tasks

- [ ] T1: Ship it.
`;

const roots: string[] = [];
let temp: string;
let store: string;

beforeEach(() => {
  temp = platform.describePath(createTempDir("make-docs-w35-p1-")).canonicalPath;
  roots.push(temp);
  store = path.join(temp, "store");
  vi.stubEnv("MAKE_DOCS_HOME", store);
  // An empty value means the real Store, so the run stops when the value is empty.
  expect(process.env.MAKE_DOCS_HOME).toBe(store);
  expect(store.startsWith(temp)).toBe(true);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  while (roots.length) cleanupTempDir(roots.pop()!);
});

function env(now = NOW): WorkQueueEnv {
  return { storeRoot: store, now };
}

function write(root: string, relative: string, text: string): void {
  const target = path.join(root, ...relative.split("/"));
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, text);
}

function project(name = "aurora"): string {
  const root = path.join(temp, name);
  mkdirSync(path.join(root, ".make-docs"), { recursive: true });
  writeFileSync(path.join(root, ".make-docs/config.yaml"), `projectId: ${PROJECT_ID}\nprojectName: ${name}\n`);
  return platform.describePath(root).canonicalPath;
}

/** Add lines to the project config, such as the sync hold list. */
function configure(root: string, text: string): void {
  appendFileSync(path.join(root, ".make-docs/config.yaml"), text);
}

const FILES_LINE = "The docs/work/ files are the authority";
const FILES_NEXT = WORK_AUTHORITY_FILES_NEXT;

/** A schema 7 Store, made by the real migration code from a fresh schema 6 Store. Schema 7 has no work store. */
function seedOldStore(): void {
  mkdirSync(store, { recursive: true });
  const seed = new DatabaseSync(getStoreDatabasePath(store));
  seed.exec("PRAGMA foreign_keys=ON");
  seed.function("make_docs_write_guard", () => null);
  for (const migration of STORE_MIGRATIONS.filter((candidate) => candidate.version <= 6)) {
    for (const statement of migration.statements) seed.exec(statement);
    seed.exec(`PRAGMA user_version=${migration.version}`);
  }
  seed.close();
  const migrating = openStoreSqliteConnection(getStoreDatabasePath(store), {}, "seed");
  // Apply only up to schema 7 by running the real list without the later entries.
  const saved = STORE_MIGRATIONS.splice(STORE_MIGRATIONS.filter((migration) => migration.version <= 7).length);
  try {
    expect(applyStoreMigrations(migrating, 6)).toBe(7);
  } finally {
    STORE_MIGRATIONS.push(...saved);
    migrating.close();
  }
  for (const file of readdirSync(store)) {
    if (file.endsWith(".backup")) rmSync(path.join(store, file), { force: true });
  }
}

/** A bound checkout with the fixture backlog on disk, before its first sync. */
function bound(): string {
  const root = project();
  write(root, INDEX, INDEX_TEXT);
  write(root, P1, P1_TEXT);
  write(root, P2, P2_TEXT);
  getInstallationCheckoutId(root, store);
  return root;
}

/** A bound checkout after its first sync. */
function imported(): string {
  const root = bound();
  workSync(root, env(), null);
  return root;
}

function units(root: string): WorkUnitRecord[] {
  return readWorkStore(root, (db) => listWorkUnits(db, PROJECT_ID), { storeRoot: store });
}

function unitAt(root: string, coordinate: string): WorkUnitRecord {
  const found = units(root).find((unit) => unit.coordinate === coordinate);
  if (!found) throw new Error(`No unit ${coordinate}`);
  return found;
}

function storeChange(root: string, coordinate: string, change: Partial<WorkUnitRecord>): void {
  writeWorkStore(root, (db) => {
    const current = listWorkUnits(db, PROJECT_ID).find((unit) => unit.coordinate === coordinate)!;
    const { revision, ...input } = current;
    putWorkUnit(db, { ...input, ...change }, { expectedVersion: revision, now: NOW });
  }, { storeRoot: store });
}

/** Every file of the project, with its bytes, so that a test can prove that no file changed. */
function projectFiles(root: string): Record<string, string> {
  const out: Record<string, string> = {};
  const walk = (folder: string) => {
    for (const entry of readdirSync(folder, { withFileTypes: true })) {
      const target = path.join(folder, entry.name);
      if (entry.isDirectory()) walk(target);
      else out[path.relative(root, target).split(path.sep).join("/")] = readFileSync(target).toString("base64");
    }
  };
  walk(root);
  return out;
}

/** The store records that sync changes: units, claims, and the sync ledger of the checkout. */
function storeState(root: string): string {
  const checkoutId = getInstallationCheckoutId(root, store);
  return JSON.stringify(readWorkStore(root, (db) => ({
    units: listWorkUnits(db, PROJECT_ID),
    claims: listWorkClaims(db, PROJECT_ID),
    ledger: listSyncLedger(db, checkoutId),
  }), { storeRoot: store }));
}

function run(root: string, options: { event?: CheckpointEvent; access?: "write" | "read"; now?: Date } = {}): WorkCheckpointResult {
  return workCheckpoint(root, env(options.now), {
    event: options.event ?? null,
    access: options.access ?? "write",
    authority: workAuthority(root, store, null),
  });
}

describe("W35 R0 P1 checkpoint event names (PRD 39 R-CHECKPOINT-CMD-2)", () => {
  it("has exactly the six event names", () => {
    expect([...CHECKPOINT_EVENTS]).toEqual(["session-start", "files-changed", "turn-end", "commit", "branch-change", "phase-closed"]);
    for (const name of CHECKPOINT_EVENTS) expect(isCheckpointEvent(name)).toBe(true);
  });

  it("refuses any other name with the list", () => {
    expect(isCheckpointEvent("push")).toBe(false);
    expect(checkpointEventRefusal("push")).toBe('"push" is not a checkpoint event. The events are: session-start, files-changed, turn-end, commit, branch-change, phase-closed.');
  });
});

describe("W35 R0 P1 checkpoint without a usable Store", () => {
  it("says in one line that the folder is not a Make Docs project, and creates no Store", () => {
    const root = path.join(temp, "plain");
    mkdirSync(root, { recursive: true });
    const result = run(root);
    expect(result.authority).toBe("not-a-project");
    expect(result.lines).toEqual([`${root} is not a Make Docs project, so the checkpoint did nothing.`]);
    expect([result.syncRan, result.syncSkipped, result.nothingDue, result.quiet]).toEqual([false, "not-a-project", true, false]);
    expect(run(root, { event: "commit" }).quiet).toBe(true);
    expect(existsSync(store)).toBe(false);
  });

  it("says in one line that the docs/work/ files are the authority, and creates no Store", () => {
    const root = project();
    write(root, P1, P1_TEXT);
    const before = projectFiles(root);
    const result = run(root);
    expect(result.authority).toBe("files");
    expect(result.storeState).toBe("not-configured");
    // A direct run names the next command in plain words (A14).
    expect(result.lines[0]).toBe("The docs/work/ files are the authority, because this computer has no Make Docs Store. The checkpoint synced nothing.");
    expect(result.lines).toHaveLength(2);
    expect(result.lines[1]).toBe(result.nextAction);
    expect(result.lines[1]).toContain("Run make-docs setup to create the Store.");
    expect(result.summary).toBe(result.lines.join("\n"));
    expect([result.syncRan, result.syncSkipped, result.quiet]).toEqual([false, "files-authority", false]);
    expect(run(root, { event: "session-start" }).quiet).toBe(true);
    expect(existsSync(store)).toBe(false);
    expect(projectFiles(root)).toEqual(before);
  });

  it("gives a caller with no Store access the same one line", () => {
    const root = imported();
    const before = storeState(root);
    const result = workCheckpoint(root, env(), {
      event: null,
      access: "read",
      authority: workAuthority(root, store, { reason: "Harness access does not allow it.", nextAction: "Ask a person." }),
    });
    expect(result.authority).toBe("files");
    expect(result.storeState).toBe("denied");
    expect(result.lines).toEqual([`${FILES_LINE}, because this caller may not use the Store: Harness access does not allow it. The checkpoint synced nothing.`, "Ask a person."]);
    expect(storeState(root)).toBe(before);
  });

  it("in a checkout that is not bound, a direct run names the setup command, and a trigger run is quiet", () => {
    // The Store exists, because another checkout is bound to it.
    imported();
    const root = project("second");
    write(root, P1, P1_TEXT);
    const files = projectFiles(root);
    const result = run(root);
    expect([result.authority, result.storeState, result.syncRan, result.syncSkipped, result.quiet]).toEqual(["files", "unavailable", false, "files-authority", false]);
    expect(result.lines[0]).toBe(`${FILES_LINE}, because this checkout is not bound to the Store. The checkpoint synced nothing.`);
    expect(result.lines).toHaveLength(2);
    expect(result.lines[1]).toBe(result.nextAction);
    expect(result.lines[1]).toContain("Run make-docs setup in this checkout.");
    expect(run(root, { event: "commit" }).quiet).toBe(true);
    expect(projectFiles(root)).toEqual(files);
  });

  it("with an old Store schema it says that the files are the authority and names the setup command", () => {
    seedOldStore();
    const root = project();
    write(root, P1, P1_TEXT);
    const files = projectFiles(root);
    const result = run(root);
    expect([result.authority, result.storeState, result.syncRan]).toEqual(["files", "unavailable", false]);
    expect(result.lines[0]).toBe(`${FILES_LINE}, because the Store uses schema 7, which has no work store. The checkpoint synced nothing.`);
    expect(result.lines[1]).toBe(`Run make-docs setup to update the Store. ${FILES_NEXT}`);
    expect(run(root, { event: "turn-end" }).quiet).toBe(true);
    expect(projectFiles(root)).toEqual(files);
  });

  it("with an unsafe Store it says that the files are the authority and names the status command", () => {
    const root = imported();
    const files = projectFiles(root);
    writeFileSync(getStoreDatabasePath(store), "this is not a database");
    const result = run(root);
    expect([result.authority, result.storeState, result.syncRan]).toEqual(["files", "unsafe", false]);
    expect(result.lines[0]).toContain(`${FILES_LINE}, because the Store is not safe to use`);
    expect(result.lines[1]).toBe(`Run make-docs project state status and review the Store. ${FILES_NEXT}`);
    expect(run(root, { event: "turn-end" }).quiet).toBe(true);
    expect(projectFiles(root)).toEqual(files);
  });
});

describe("W35 R0 P1 checkpoint direct run", () => {
  it("names the checkout and says when the run was its first sync", () => {
    const root = bound();
    const result = run(root);
    expect(result.run).toBe("direct");
    expect(result.firstSync).toBe(true);
    expect(result.checkout).toEqual({ root, checkoutId: getInstallationCheckoutId(root, store) });
    expect(result.imported.sort()).toEqual([INDEX, P1, P2]);
    expect(result.lines[0]).toBe("Checkpoint: 3 files imported.");
    expect(result.lines[1]).toBe(`Checkout: ${root}. This run was the first sync of this checkout. A first sync only imports: it imported 3 files and wrote and removed no file.`);
    expect(result.nothingDue).toBe(false);
  });

  it("a second run right after the first changes nothing and says that nothing is due", () => {
    const root = bound();
    run(root);
    const files = projectFiles(root);
    const state = storeState(root);
    const second = run(root);
    expect(second.lines[0]).toBe("Checkpoint: nothing is due. The work files and the work store match.");
    expect(second.lines[1]).toBe(`Checkout: ${root}.`);
    expect([second.nothingDue, second.firstSync, second.syncRan, second.quiet]).toEqual([true, false, true, false]);
    expect(projectFiles(root)).toEqual(files);
    expect(storeState(root)).toBe(state);
  });

  it("imports a changed file and writes a store change, as work sync does", () => {
    const root = imported();
    write(root, P1, P1_TEXT.replace("Build the parser.", "Build the new parser."));
    storeChange(root, "W1 R0 P2 T1", { status: "closed", closeOutcome: "done" });
    const result = run(root);
    expect(result.imported).toEqual([P1]);
    expect(result.written).toEqual([P2]);
    expect(result.lines[0]).toBe("Checkpoint: 1 file imported, 1 file written.");
    expect(result.summary).toContain(`  Imported: ${P1}`);
    expect(result.summary).toContain(`  Wrote: ${P2}`);
    expect(readFileSync(path.join(root, P2), "utf8")).toContain("- [x] T1: Ship it.");
    expect(run(root).nothingDue).toBe(true);
  });

  it("names the next ready unit and the claim command for it", () => {
    const root = imported();
    const result = run(root);
    const first = unitAt(root, "W1 R0 P1");
    expect(result.readyCount).toBe(2);
    expect(result.next.map((item) => item.coordinate)).toEqual(["W1 R0 P1", "W1 R0 P2"]);
    expect(result.next[0]!.claimCommand).toBe(`make-docs work claim W1 R0 P1 --claimant <name> --expected-version ${first.revision}`);
    expect(result.summary).toContain("Ready work (2). Next:");
    expect(result.summary).toContain(`  W1 R0 P1: Phase 1: First (${P1})`);
    expect(result.lines.at(-1)).toBe(`Claim the first one: ${result.next[0]!.claimCommand}`);
    expect(result.next.length).toBeLessThanOrEqual(CHECKPOINT_NEXT_LIMIT);
  });

  it("reports a conflict with one settle command for each choice, and never settles it", () => {
    const root = imported();
    write(root, P2, P2_TEXT.replace("Ship it.", "Ship it today."));
    storeChange(root, "W1 R0 P2 T1", { status: "closed", closeOutcome: "done" });
    const result = run(root);
    expect(result.lines[0]).toBe("Checkpoint: 1 conflict waits for a person.");
    expect(result.conflicts.map((entry) => [entry.path, entry.kind])).toEqual([[P2, "both-changed"]]);
    expect(result.summary).toContain(`Conflict in ${P2} (both-changed):`);
    expect(result.summary).toContain(`Run: make-docs work sync --settle ${P2} --keep-file`);
    expect(result.summary).toContain(`Run: make-docs work sync --settle ${P2} --keep-store`);
    const again = run(root);
    expect(again.conflicts.map((entry) => entry.path)).toEqual([P2]);
    expect(again.nothingDue).toBe(false);
    expect(readFileSync(path.join(root, P2), "utf8")).toContain("Ship it today.");
    expect(unitAt(root, "W1 R0 P2 T1").status).toBe("closed");
  });
});

describe("W35 R0 P1 checkpoint summary line stays true", () => {
  it("does not say that the files and the store match when a held file differs, and names the held file as work sync does", () => {
    const root = imported();
    configure(root, `work:\n  syncHold:\n    - ${RECORD}/\n`);
    storeChange(root, "W1 R0 P2 T1", { status: "closed", closeOutcome: "done" });
    const files = projectFiles(root);
    const held = [{ path: P2, reason: WORK_SYNC_HOLD_REASON }];
    const heldLine = `Held, not written: ${P2}. ${WORK_SYNC_HOLD_REASON}`;
    // work sync names the held file. The checkpoint must name it too.
    expect(workSync(root, env(), null).sync.summary).toContain(heldLine);
    for (const options of [{}, { access: "read" as const }, { event: "branch-change" as const }]) {
      const result = run(root, options);
      expect(result.lines[0], JSON.stringify(options)).toBe("Checkpoint: nothing is due. 1 held file differs from the work store, and sync never writes it.");
      expect(result.summary).not.toContain("match");
      expect(result.lines).toContain(heldLine);
      expect(result.held).toEqual(held);
      expect(result.waiting).toEqual([]);
      expect(result.nothingDue).toBe(true);
    }
    // PRD 52 R-WORK-CHECKPOINT-3: in a trigger run the path stays held and is not named as waiting.
    const trigger = run(root, { event: "commit" });
    expect([trigger.syncRan, trigger.nothingDue, trigger.quiet]).toEqual([true, true, true]);
    expect(trigger.held).toEqual(held);
    expect(trigger.waiting).toEqual([]);
    expect(trigger.lines).toContain(heldLine);
    expect(trigger.summary).not.toContain("match");
    expect(projectFiles(root)).toEqual(files);
  });

  it("a trigger run names a held file as held and another file as waiting", () => {
    const root = imported();
    configure(root, `work:\n  syncHold:\n    - ${P2}\n`);
    storeChange(root, "W1 R0 P2 T1", { status: "closed", closeOutcome: "done" });
    storeChange(root, "W1 R0 P1 T1", { status: "closed", closeOutcome: "done" });
    const files = projectFiles(root);
    const result = run(root, { event: "files-changed" });
    expect(result.held.map((hold) => hold.path)).toEqual([P2]);
    expect(result.waiting).toEqual([{ path: P1, waitsFor: "write" }]);
    expect(result.lines[0]).toBe("Checkpoint: 1 file waits, 1 held file differs from the work store.");
    expect(result.quiet).toBe(false);
    expect(projectFiles(root)).toEqual(files);
  });

  it("does not say that the files and the store match when a work file cannot be read", () => {
    const root = imported();
    write(root, P1, P1_TEXT.replace('title: "Phase 1: First"', 'title: "Phase 1: First'));
    const files = projectFiles(root);
    const state = storeState(root);
    const direct = run(root);
    expect(direct.lines[0]).toBe("Checkpoint: nothing is due. Make Docs cannot read 1 work file.");
    expect(direct.summary).not.toContain("match");
    expect(direct.unreadable.map((entry) => entry.path)).toEqual([P1]);
    expect(direct.unreadable[0]!.line).toBeGreaterThan(0);
    expect(direct.summary).toMatch(new RegExp(`Cannot read ${P1}, line \\d+: .+ The file is untouched\\.`));
    expect(direct.nothingDue).toBe(true);
    // A read-only check names the file too, without the line.
    const check = run(root, { access: "read" });
    expect(check.lines[0]).toBe("Checkpoint: nothing is due. Make Docs cannot read 1 work file.");
    expect(check.unreadable).toEqual([{ path: P1, line: null, message: null }]);
    expect(check.lines).toContain(`Cannot read ${P1}. The file is untouched. A direct run of make-docs project checkpoint by a caller with write access names the line.`);
    // A file that cannot be read is not "due", so a trigger run is quiet. Its result still names the file.
    const trigger = run(root, { event: "commit" });
    expect([trigger.nothingDue, trigger.quiet]).toEqual([true, true]);
    expect(trigger.unreadable.map((entry) => entry.path)).toEqual([P1]);
    expect(projectFiles(root)).toEqual(files);
    expect(storeState(root)).toBe(state);
  });

  it("does not say that the files and the store match when sync could not write a file, and names the file with the reason of work sync", () => {
    const root = imported();
    // The store gains a task that the file does not record. The file writer adds no unit, so sync cannot write the file.
    writeWorkStore(root, (db) => {
      const { revision: _revision, ...task } = listWorkUnits(db, PROJECT_ID).find((unit) => unit.coordinate === "W1 R0 P2 T1")!;
      putWorkUnit(db, { ...task, storeId: newWorkUnitStoreId(), coordinate: "W1 R0 P2 T2", title: "Ship it again.", body: "Ship it again." }, { expectedVersion: null, now: NOW });
    }, { storeRoot: store });
    const files = projectFiles(root);
    const reason = "The store has a unit that the file does not record, and the writer does not add units.";
    // work sync names the file. The checkpoint must name it too.
    expect(workSync(root, env(), null).sync.summary).toContain(`1 file not written: ${P2} (${reason})`);
    const direct = run(root);
    expect(direct.lines[0]).toBe("Checkpoint: nothing is due. 1 file differs from the work store, and sync cannot write it.");
    expect(direct.summary).not.toContain("match");
    expect(direct.notWritten).toEqual([{ path: P2, reason }]);
    expect(direct.lines).toContain(`Not written: ${P2} (${reason})`);
    expect([direct.nothingDue, direct.written, direct.waiting]).toEqual([true, [], []]);
    // With another file that the run imports, the summary line gives the count beside the other counts.
    write(root, P1, P1_TEXT.replace("Build the parser.", "Build the new parser."));
    const mixed = run(root);
    expect(mixed.lines[0]).toBe("Checkpoint: 1 file imported, 1 file not written.");
    expect(mixed.lines).toContain(`Not written: ${P2} (${reason})`);
    expect(projectFiles(root)[P2]).toBe(files[P2]);
    // A check that does not sync does not try the write, so it counts the file as one that waits for a write.
    const check = run(root, { access: "read" });
    expect(check.notWritten).toEqual([]);
    expect(check.waiting).toEqual([{ path: P2, waitsFor: "write" }]);
    // A trigger run holds every write before the writer runs, so it also names the file as waiting.
    const trigger = run(root, { event: "commit" });
    expect(trigger.notWritten).toEqual([]);
    expect(trigger.waiting).toEqual([{ path: P2, waitsFor: "write" }]);
  });

  it("a first sync that imports no file says so with the true count", () => {
    const first = imported();
    storeChange(first, "W1 R0 P1 T1", { status: "closed", closeOutcome: "done" });
    // A second checkout of the same project, with one file that differs from the store.
    const root = project("second");
    write(root, INDEX, INDEX_TEXT);
    write(root, P1, P1_TEXT.replace("Build the parser.", "Build another parser."));
    write(root, P2, P2_TEXT);
    registerSeparateInstallationCheckout(root, previewInstallationCheckoutMove(root, undefined, store).separateReviewDigest!, store);
    const files = projectFiles(root);
    const result = run(root);
    expect(result.firstSync).toBe(true);
    expect(result.lines[1]).toBe(`Checkout: ${root}. This run was the first sync of this checkout. A first sync only imports: it imported ${result.imported.length} ${result.imported.length === 1 ? "file" : "files"} and wrote and removed no file.`);
    expect(result.imported).not.toContain(P1);
    expect(result.conflicts.map((entry) => entry.path)).toEqual([P1]);
    expect(result.summary).not.toContain("every work file");
    expect(projectFiles(root)).toEqual(files);
  });
});

describe("W35 R0 P1 checkpoint files that wait for a removal, and a long ready list", () => {
  it("a trigger run names a copy that waits for a removal, and a direct run removes it", () => {
    const root = imported();
    configure(root, "work:\n  projection: off\n");
    const files = projectFiles(root);
    const trigger = run(root, { event: "commit" });
    expect(trigger.removed).toEqual([]);
    expect(trigger.waiting.map((file) => file.waitsFor)).toEqual(["removal", "removal", "removal"]);
    expect(trigger.lines[0]).toBe("Checkpoint: 3 files wait.");
    expect(trigger.summary).toContain(`  Waits for a removal: ${P1}`);
    expect(trigger.quiet).toBe(false);
    expect(projectFiles(root)).toEqual(files);
    // A read-only check counts the same files.
    expect(run(root, { access: "read" }).waiting.map((file) => file.waitsFor)).toEqual(["removal", "removal", "removal"]);
    const direct = run(root);
    expect(direct.removed.sort()).toEqual([INDEX, P1, P2]);
    expect(direct.lines[0]).toBe("Checkpoint: 3 copies removed.");
    expect(existsSync(path.join(root, P1))).toBe(false);
    expect(run(root).nothingDue).toBe(true);
  });

  it("with more than three ready units it shows three, the count, and where the full list is", () => {
    const root = bound();
    for (const number of [3, 4, 5]) {
      write(root, `${RECORD}/0${number}-more.md`, P2_TEXT.replaceAll("Phase 2: Second", `Phase ${number}: More`).replace("W1 R0 P2", `W1 R0 P${number}`));
    }
    const result = run(root);
    expect(result.readyCount).toBe(5);
    expect(result.next.map((item) => item.coordinate)).toEqual(["W1 R0 P1", "W1 R0 P2", "W1 R0 P3"]);
    expect(result.next).toHaveLength(CHECKPOINT_NEXT_LIMIT);
    expect(result.lines).toContain("Ready work (5). Next:");
    expect(result.lines).toContain("  ... and 2 more. Run make-docs work next for the full list.");
    expect(result.summary).not.toContain("W1 R0 P4:");
    expect(result.lines.at(-1)).toBe(`Claim the first one: ${result.next[0]!.claimCommand}`);
  });
});

describe("W35 R0 P1 checkpoint claims", () => {
  it("lists a claim that ended with its release command, and a claim that ends soon with its renew command, and no claim ID", () => {
    const root = imported();
    const t1 = unitAt(root, "W1 R0 P1 T1");
    const t2 = unitAt(root, "W1 R0 P1 T2");
    const first = workClaim(root, env(), { unit: "W1 R0 P1 T1", claimant: "builder-a", taskHandle: "task-a", ttlSeconds: 1200, expectedVersion: t1.revision, claimId: null, takeover: null });
    const second = workClaim(root, env(), { unit: "W1 R0 P1 T2", claimant: "builder-b", taskHandle: null, ttlSeconds: 1800, expectedVersion: t2.revision, claimId: null, takeover: null });
    expect(first.claimId).toMatch(/^wc-/);
    expect(run(root).claims).toEqual([]);

    // 25 minutes later: the first claim ended, and the second ends in 5 minutes.
    const later = new Date(NOW.getTime() + 25 * 60 * 1000);
    const result = run(root, { now: later });
    expect(result.claims.map((claim) => [claim.unit, claim.claimant, claim.state])).toEqual([
      ["W1 R0 P1 T1", "builder-a", "ended"],
      ["W1 R0 P1 T2", "builder-b", "ends-soon"],
    ]);
    const ended = result.claims[0]!;
    const soon = result.claims[1]!;
    expect(ended.command).toBe(`make-docs work release W1 R0 P1 T1 --handle <stopped|finished|not-found> --expected-version ${ended.revision}`);
    expect(soon.command).toBe(`make-docs work claim W1 R0 P1 T2 --claimant builder-b --claim-id <claim ID> --expected-version ${soon.revision}`);
    expect(result.summary).toContain("Claim ended: W1 R0 P1 T1, claimed by builder-a");
    expect(result.summary).toContain("Claim ends soon: W1 R0 P1 T2, claimed by builder-b");
    const text = JSON.stringify(result);
    expect(text).not.toContain(first.claimId!);
    expect(text).not.toContain(second.claimId!);
    expect(text).not.toMatch(/wc-[a-z0-9]{8,}/);
    // The checkpoint renews nothing and releases nothing.
    expect(readWorkStore(root, (db) => listWorkClaims(db, PROJECT_ID), { storeRoot: store })).toHaveLength(2);
    // A claim that ended is not "due".
    expect(result.nothingDue).toBe(true);
    expect(run(root, { now: later, event: "turn-end" }).quiet).toBe(true);
  });
});

describe("W35 R0 P1 checkpoint trigger run", () => {
  it.each(CHECKPOINT_EVENTS.map((event) => [event] as const))("--event %s prints nothing when nothing is due, also with ready work", (event) => {
    const root = imported();
    const files = projectFiles(root);
    const state = storeState(root);
    const result = run(root, { event });
    expect([result.run, result.event, result.nothingDue, result.quiet]).toEqual(["trigger", event, true, true]);
    expect(result.readyCount).toBe(2);
    expect(projectFiles(root)).toEqual(files);
    expect(storeState(root)).toBe(state);
  });

  it("imports only, and leaves every project file byte-identical when the store holds a record that a direct run would write", () => {
    const root = imported();
    write(root, P1, P1_TEXT.replace("Build the parser.", "Build the new parser."));
    storeChange(root, "W1 R0 P2 T1", { status: "closed", closeOutcome: "done" });
    const files = projectFiles(root);
    const result = run(root, { event: "commit" });
    expect(result.imported).toEqual([P1]);
    expect(result.written).toEqual([]);
    expect(result.removed).toEqual([]);
    expect(result.waiting).toEqual([{ path: P2, waitsFor: "write" }]);
    expect([result.syncRan, result.nothingDue, result.quiet]).toEqual([true, false, false]);
    expect(result.lines[0]).toBe("Checkpoint: 1 file imported, 1 file waits.");
    expect(result.summary).toContain(`A hook started this run, so it wrote and removed no project file. Run ${CHECKPOINT_COMMAND} to apply what waits.`);
    expect(result.summary).toContain(`  Waits for a write: ${P2}`);
    expect(projectFiles(root)).toEqual(files);
    expect(unitAt(root, "W1 R0 P1 T1").title).toBe("Build the new parser.");

    // A second trigger run imports nothing, and the file still waits.
    const again = run(root, { event: "commit" });
    expect(again.imported).toEqual([]);
    expect(again.waiting).toEqual([{ path: P2, waitsFor: "write" }]);
    expect(again.quiet).toBe(false);
    expect(projectFiles(root)).toEqual(files);

    // A direct run writes it, and then nothing is due.
    const direct = run(root);
    expect(direct.written).toEqual([P2]);
    expect(run(root).nothingDue).toBe(true);
    expect(run(root, { event: "commit" }).quiet).toBe(true);
  });

  it("can be the first sync of a checkout: it imports every work file and writes none", () => {
    const root = bound();
    const files = projectFiles(root);
    const result = run(root, { event: "session-start" });
    expect(result.firstSync).toBe(true);
    expect(result.imported.sort()).toEqual([INDEX, P1, P2]);
    expect(result.quiet).toBe(false);
    expect(projectFiles(root)).toEqual(files);
  });

  it("keeps a conflict and reports it, and never settles it", () => {
    const root = imported();
    write(root, P2, P2_TEXT.replace("Ship it.", "Ship it today."));
    storeChange(root, "W1 R0 P2 T1", { status: "closed", closeOutcome: "done" });
    const files = projectFiles(root);
    const result = run(root, { event: "commit" });
    expect(result.conflicts.map((entry) => entry.path)).toEqual([P2]);
    expect(result.quiet).toBe(false);
    expect(projectFiles(root)).toEqual(files);
  });

  it("--event branch-change imports nothing, leaves the store unchanged, and says how many files wait", () => {
    const root = imported();
    write(root, P1, P1_TEXT.replace("Build the parser.", "Build the new parser."));
    storeChange(root, "W1 R0 P2 T1", { status: "closed", closeOutcome: "done" });
    const files = projectFiles(root);
    const state = storeState(root);
    const result = run(root, { event: "branch-change" });
    expect([result.syncRan, result.syncSkipped, result.quiet]).toEqual([false, "branch-change", false]);
    expect(result.imported).toEqual([]);
    expect(result.waiting).toEqual([{ path: P1, waitsFor: "import" }, { path: P2, waitsFor: "write" }]);
    expect(result.lines[0]).toBe("Checkpoint: 2 files wait.");
    expect(result.summary).toContain(`The branch changed, so this run imported nothing: 2 files wait. Run ${CHECKPOINT_COMMAND} to sync.`);
    expect(storeState(root)).toBe(state);
    expect(projectFiles(root)).toEqual(files);
  });
});

describe("W35 R0 P1 checkpoint for a caller with read access only", () => {
  it("does the read steps, says that the sync waits with the count of files, and says that the sync did not run", () => {
    const root = imported();
    write(root, P1, P1_TEXT.replace("Build the parser.", "Build the new parser."));
    const files = projectFiles(root);
    const state = storeState(root);
    const result = run(root, { access: "read" });
    expect([result.syncRan, result.syncSkipped, result.authority]).toEqual([false, "read-access-only", "store"]);
    expect(result.waiting).toEqual([{ path: P1, waitsFor: "import" }]);
    expect(result.lines[0]).toBe("Checkpoint: 1 file waits.");
    expect(result.summary).toContain(`The sync waits: 1 file waits. This caller has read access only, so a caller with write access must run ${CHECKPOINT_COMMAND}.`);
    expect(result.readyCount).toBe(2);
    expect(result.next[0]!.coordinate).toBe("W1 R0 P1");
    expect(storeState(root)).toBe(state);
    expect(projectFiles(root)).toEqual(files);
  });

  it("says that the first sync of the checkout waits", () => {
    const root = bound();
    const result = run(root, { access: "read" });
    expect([result.firstSync, result.firstSyncWaits, result.syncRan]).toEqual([false, true, false]);
    expect(result.lines[1]).toBe(`Checkout: ${root}. This checkout has not synced yet, and this run did not sync it.`);
    expect(result.waiting.map((file) => file.waitsFor)).toEqual(["import", "import", "import"]);
  });
});
