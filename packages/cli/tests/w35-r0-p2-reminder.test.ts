import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { runCli } from "../src/cli";
import { applyGenericMcpSetup, prepareGenericMcpSetup } from "../src/generic-mcp-setup";
import { verifyMakeDocsExecutable } from "../src/harness-access";
import { HARNESS_CALLER_IDENTITY_ENV } from "../src/harness-access/contract";
import { MCP_CONNECTION_ID_ENV, MCP_CONNECTION_KEY_ENV } from "../src/mcp-connection";
import { createMakeDocsMcpServer } from "../src/mcp/server";
import { callMakeDocsMcpTool } from "../src/mcp/tools";
import { createExecutionContext } from "../src/operations/context";
import {
  getOperation,
  invokeOperation,
  listOperations,
  listReminderOperationIds,
  operationFullCliPath,
  type OperationDefinition,
} from "../src/operations/registry";
import { createBacklogLiveEnvelope } from "../src/operations/work/backlog/live-contracts";
import { BacklogReviewRefreshPayloadV1Schema } from "../src/operations/work/backlog/review-contracts";
import { WORK_PROJECT_SYNC_NOTE, readWorkProjectResource } from "../src/operations/work/work-queue/project-resource";
import {
  WORK_OUT_OF_DATE_MARK,
  workNext,
  workStatus,
  workAuthority,
  workSync,
  type WorkQueueEnv,
} from "../src/operations/work/work-queue/queue";
import {
  WORK_REMINDER_EXCLUDED_OPERATION_IDS,
  WORK_REMINDER_LINE,
  WORK_REMINDER_MCP_LINE,
  WORK_REMINDER_OWN_CHECK_ONLY_OPERATION_IDS,
  isRefusedOperationValue,
  isReminderOperation,
  setWorkReminderCheckForTests,
  takeCliReminder,
  workReminderFor,
  workReminderOf,
  workReminderOwnCheckCount,
} from "../src/operations/work/work-queue/reminder";
import { WORK_STORE_RULES, workRuleTwinProblems } from "../src/operations/work/work-store/catalog";
import type { WorkUnitRecord } from "../src/operations/work/work-store/schemas";
import { previewWorkSync, type WorkSyncPreview } from "../src/operations/work/work-store/sync";
import { platform } from "../src/platform";
import { runCliEntry } from "../src/run/entry";
import { getInstallationCheckoutId } from "../src/store/installation-state";
import { listSyncLedger, listWorkClaims, listWorkUnits, putWorkUnit, readWorkStore, writeWorkStore } from "../src/store/work-store";
import { smallPresentationReport, PRESENTATION_SESSION_ID } from "./fixtures/backlog-presentation";
import { WORK_READ_WAIT_SCENARIOS, WORK_STORE_CONTRACT_FIXTURES, type ReadWaitScenarioFixture, type WorkReadWaitScenario } from "./fixtures/work-store-contract";
import { cleanupTempDir, createTempDir } from "./helpers";

/**
 * W35 R0 P2: the reminder and the read commands (PRD 52 R-WORK-REMIND,
 * R-WORK-SYNC-8, R-WORK-QUEUE-5, R-WORK-URI-3; PRD 39 R-RENDER-4; PRD 25
 * R-MCP-REMIND). No test reaches the real Store: `MAKE_DOCS_HOME` points at a
 * temporary folder at a fixed, checked path. No test writes this repository's
 * files.
 */

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "..", "..", "..");
const CLI = path.resolve(HERE, "../dist/index.js");
const NOW = new Date("2042-06-15T12:00:00.000Z");
const PROJECT_ID = "aurora-w35-reminder";
const RECORD = "docs/work/2042-06-01-w1-r0-aurora";
const INDEX = `${RECORD}/00-index.md`;
const P1 = `${RECORD}/01-first.md`;
const P2 = `${RECORD}/02-second.md`;
const P3 = `${RECORD}/03-third.md`;
const CHECKPOINT = "make-docs project checkpoint";

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

const P3_TEXT = `---
title: "Phase 3: Third"
status: "active"
coordinate: "W1 R0 P3"
---

# Phase 3: Third

## Stage 1 - Tell

### Tasks

- [ ] T1: Tell people.
`;

const P1_CHANGED = P1_TEXT.replace("Build the parser.", "Build the new parser.");

/** The one operation of the set that runs no check of its own: it shows the reminder only with the work store option. */
const OWN_CHECK_ONLY = ["work.backlog.snapshot"];

/** The six operations of the set that sync first (`syncFirst` in work-queue/queue.ts). */
const SYNC_FIRST = ["work.queue.claim", "work.queue.release", "work.queue.report", "work.queue.close", "work.queue.export", "work.queue.add"];

const roots: string[] = [];
let temp: string;
let store: string;

beforeEach(() => {
  temp = platform.describePath(createTempDir("make-docs-w35-p2-")).canonicalPath;
  roots.push(temp);
  store = path.join(temp, "store");
  vi.stubEnv("MAKE_DOCS_HOME", store);
  // No caller identity: the CLI route is the direct route of a person's terminal.
  vi.stubEnv(HARNESS_CALLER_IDENTITY_ENV, "");
  // An empty value means the real Store, so the run stops when the value is empty.
  expect(process.env.MAKE_DOCS_HOME).toBe(store);
  expect(store.startsWith(temp)).toBe(true);
  process.exitCode = 0;
  takeCliReminder();
});

afterEach(() => {
  setWorkReminderCheckForTests(null);
  takeCliReminder();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  while (roots.length) cleanupTempDir(roots.pop()!);
  process.exitCode = 0;
});

function env(now = NOW): WorkQueueEnv {
  return { storeRoot: store, now };
}

function write(root: string, relative: string, text: string): void {
  const target = path.join(root, ...relative.split("/"));
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, text);
}

function project(name = "aurora", projectId = PROJECT_ID): string {
  const root = path.join(temp, name);
  mkdirSync(path.join(root, ".make-docs"), { recursive: true });
  writeFileSync(path.join(root, ".make-docs/config.yaml"), `projectId: ${projectId}\nprojectName: ${name}\n`);
  return platform.describePath(root).canonicalPath;
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

/** A bound checkout whose files and store match. */
function synced(): string {
  const root = bound();
  workSync(root, env(), null);
  expect(preview(root).pending).toEqual([]);
  return root;
}

function preview(root: string): WorkSyncPreview {
  return previewWorkSync(root, { storeRoot: store, now: NOW });
}

function decisions(root: string): string[] {
  return preview(root).pending.map((file) => `${file.decision}${file.recorded ? ":recorded" : ""}`).sort();
}

function units(root: string): WorkUnitRecord[] {
  return readWorkStore(root, (db) => listWorkUnits(db, PROJECT_ID), { storeRoot: store });
}

function storeChange(root: string, coordinate: string, change: Partial<WorkUnitRecord>): void {
  writeWorkStore(root, (db) => {
    const current = listWorkUnits(db, PROJECT_ID).find((unit) => unit.coordinate === coordinate)!;
    const { revision, ...input } = current;
    putWorkUnit(db, { ...input, ...change }, { expectedVersion: revision, now: new Date() });
  }, { storeRoot: store });
}

function fileHashes(root: string): Record<string, string> {
  const out: Record<string, string> = {};
  const walk = (folder: string) => {
    for (const entry of readdirSync(folder, { withFileTypes: true })) {
      const target = path.join(folder, entry.name);
      if (entry.isDirectory()) walk(target);
      else out[path.relative(root, target).split(path.sep).join("/")] = createHash("sha256").update(readFileSync(target)).digest("hex");
    }
  };
  if (existsSync(root)) walk(root);
  return out;
}

function storeState(root: string): string {
  const checkoutId = getInstallationCheckoutId(root, store);
  return JSON.stringify(readWorkStore(root, (db) => ({
    units: listWorkUnits(db, PROJECT_ID),
    claims: listWorkClaims(db, PROJECT_ID),
    ledger: listSyncLedger(db, checkoutId),
  }), { storeRoot: store }));
}

/* The states of acceptance case A16. Each one returns the project root. */

/** One work file waits for import. */
function oneFileWaits(): string {
  const root = synced();
  write(root, P1, P1_CHANGED);
  expect(decisions(root)).toEqual(["import"]);
  return root;
}

/** Only a conflict waits: the file and the store both changed. */
function onlyConflictWaits(): string {
  const root = synced();
  storeChange(root, "W1 R0 P2 T1", { title: "Ship it soon." });
  write(root, P2, P2_TEXT.replace("Ship it.", "Ship it today."));
  expect(decisions(root)).toEqual(["conflict"]);
  return root;
}

/** Only a file waits for a write: the store changed, and the file did not. */
function onlyWriteWaits(): string {
  const root = synced();
  storeChange(root, "W1 R0 P2 T1", { title: "Ship it soon." });
  expect(decisions(root)).toEqual(["write"]);
  return root;
}

/** A usable Store exists, and this checkout is not bound to it, so the files are in charge. */
function filesInCharge(): string {
  synced();
  const root = project("other", "other-w35-reminder");
  write(root, INDEX, INDEX_TEXT);
  write(root, P1, P1_TEXT);
  expect(workAuthority(root, store, null).mode).toBe("files");
  return root;
}

/** No Store exists on this computer. */
function noStore(): string {
  const root = project();
  write(root, INDEX, INDEX_TEXT);
  write(root, P1, P1_TEXT);
  expect(existsSync(store)).toBe(false);
  return root;
}

/**
 * Run the real operation runner for one registry operation with a handler that
 * does nothing. The registry facts of the operation stay: its ID, its declared
 * access, its Store admission, and its place in the registry. So the test
 * proves what the runner does for each operation of the set, without the
 * inputs and the state that each real handler needs.
 */
async function runStubbed(id: string, root: string, surface: "cli" | "test" = "cli"): Promise<{ returned: boolean; reminder: string | null; held: string | null }> {
  const definition = getOperation(id) as OperationDefinition;
  const saved = { handler: definition.handler, inputSchema: definition.inputSchema, resolveTarget: definition.resolveTarget };
  definition.handler = async () => ({ stub: true });
  definition.inputSchema = z.object({ targetRoot: z.string() });
  delete definition.resolveTarget;
  takeCliReminder();
  try {
    const invocation = await invokeOperation(id, { targetRoot: root }, createExecutionContext({
      surface,
      route: surface === "cli" ? "direct-cli" : "test",
      writesAllowed: true,
      storeRoot: store,
      cwd: root,
      approvals: definition.requiredApprovals ?? [],
    }));
    expect(invocation.value, id).toEqual({ stub: true });
    return { returned: true, reminder: invocation.reminder ?? null, held: takeCliReminder() };
  } catch {
    // A command that fails shows no reminder: the check runs only after the handler returned.
    return { returned: false, reminder: null, held: takeCliReminder() };
  } finally {
    definition.handler = saved.handler;
    definition.inputSchema = saved.inputSchema;
    if (saved.resolveTarget) definition.resolveTarget = saved.resolveTarget;
  }
}

function cliContext(root: string, extra: { writesAllowed?: boolean; dryRun?: boolean } = {}) {
  return createExecutionContext({ surface: "cli", route: "direct-cli", writesAllowed: extra.writesAllowed ?? true, dryRun: extra.dryRun ?? false, storeRoot: store, cwd: root, now: () => NOW.toISOString() });
}

/** One CLI command in this process, through the CLI entry, with standard output and standard error kept apart. */
async function cli(argv: string[]): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const out: string[] = [];
  const err: string[] = [];
  const spy = vi.spyOn(process.stdout, "write").mockImplementation((chunk: unknown) => {
    out.push(String(chunk));
    return true;
  });
  let exitCode: number;
  try {
    exitCode = await runCliEntry(runCli, argv, { writeError: (value) => err.push(value) });
  } finally {
    spy.mockRestore();
  }
  return { stdout: out.join(""), stderr: err.join(""), exitCode };
}

/** The built CLI as its own process. */
function built(args: string[], cwd: string) {
  expect(process.env.MAKE_DOCS_HOME).toBe(store);
  const result = spawnSync(process.execPath, [CLI, ...args], { cwd, encoding: "utf8", env: { ...process.env, MAKE_DOCS_HOME: store, [HARNESS_CALLER_IDENTITY_ENV]: "" } });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

const reminderLines = (text: string) => text.split("\n").filter((line) => line === WORK_REMINDER_LINE).length;

/* ------------------------------------------------------------------------ */

function markdownSection(markdown: string, heading: string): string {
  const start = markdown.indexOf(`${heading}\n`);
  if (start < 0) return "";
  const level = heading.match(/^#+/)![0].length;
  const rest = markdown.slice(start + heading.length + 1);
  const end = rest.search(new RegExp(`^#{1,${level}} `, "m"));
  return end < 0 ? rest : rest.slice(0, end);
}

/** The rows of the PRD 39 reminder set table: operation ID, CLI path, and whether the command syncs first. */
function prdReminderRows(markdown: string): Array<{ id: string; cli: string; syncsFirst: boolean; shows: string }> {
  const rows: Array<{ id: string; cli: string; syncsFirst: boolean; shows: string }> = [];
  for (const line of markdownSection(markdown, "#### The Reminder Set").split("\n")) {
    const cells = line.split("|").map((cell) => cell.trim());
    const id = /^`([a-z0-9.-]+)`$/.exec(cells[1] ?? "");
    const command = /^`make-docs ([a-z -]+)`$/.exec(cells[2] ?? "");
    if (id && command) rows.push({ id: id[1]!, cli: command[1]!, syncsFirst: cells[3] === "Yes", shows: cells[4] ?? "" });
  }
  return rows;
}

/** Each way that the PRD 39 table and the registry differ. Empty when they match. */
function reminderSetProblems(markdown: string): string[] {
  const rows = prdReminderRows(markdown);
  const fromRegistry = listReminderOperationIds();
  const problems: string[] = [];
  for (const id of fromRegistry) if (!rows.some((row) => row.id === id)) problems.push(`PRD 39 misses ${id}, which the registry puts in the reminder set.`);
  for (const row of rows) {
    if (!fromRegistry.includes(row.id)) problems.push(`PRD 39 lists ${row.id}, which the registry does not put in the reminder set.`);
    else if (operationFullCliPath(row.id) !== row.cli) problems.push(`PRD 39 gives ${row.id} the path \`${row.cli}\`; the registry has \`${operationFullCliPath(row.id)}\`.`);
    if (row.syncsFirst !== SYNC_FIRST.includes(row.id)) problems.push(`PRD 39 says that ${row.id} ${row.syncsFirst ? "syncs" : "does not sync"} first.`);
    const shows = (WORK_REMINDER_OWN_CHECK_ONLY_OPERATION_IDS as readonly string[]).includes(row.id) ? "Only with `--work-store`" : "On each run";
    if (row.shows !== shows) problems.push(`PRD 39 says that ${row.id} shows the reminder "${row.shows}"; the code says "${shows}".`);
  }
  if (new Set(rows.map((row) => row.id)).size !== rows.length) problems.push("PRD 39 lists an operation two times.");
  return problems;
}

const PRD_39 = readFileSync(path.join(REPO, "docs/prd/39-cli-command-model-and-operation-registry.md"), "utf8");

describe("W35 R0 P2 the reminder set (T1, PRD 39 R-RENDER-4)", () => {
  it("comes from the registry: each active operation in a project with a Store read, without the four excluded ones", () => {
    const set = listReminderOperationIds();
    expect(set).toHaveLength(47);
    for (const operation of listOperations()) {
      const expected = operation.status === "active" && operation.access.store !== "none" && operation.access.project !== "none" &&
        !["work.queue.status", "work.queue.next", "work.queue.sync", "project.checkpoint.run"].includes(operation.id);
      expect(set.includes(operation.id), operation.id).toBe(expected);
      expect(isReminderOperation(operation), operation.id).toBe(expected);
    }
    expect([...WORK_REMINDER_EXCLUDED_OPERATION_IDS]).toEqual(["work.queue.status", "work.queue.next", "work.queue.sync", "project.checkpoint.run"]);
    // The operations with Store access and no project access name no project, so they are not in the set.
    for (const id of ["setup.store.check", "setup.store.clean", "factory.tools.save", "factory.tools.list"]) {
      expect(getOperation(id).access.store, id).not.toBe("none");
      expect(set, id).not.toContain(id);
    }
    for (const id of SYNC_FIRST) expect(set, id).toContain(id);
    expect(set.filter((id) => !SYNC_FIRST.includes(id))).toHaveLength(41);
    // One of the 41 runs no check of its own: the snapshot shows the reminder only with the work store option.
    expect([...WORK_REMINDER_OWN_CHECK_ONLY_OPERATION_IDS]).toEqual(OWN_CHECK_ONLY);
    for (const id of OWN_CHECK_ONLY) expect(set, id).toContain(id);
    expect(set.filter((id) => !SYNC_FIRST.includes(id) && !OWN_CHECK_ONLY.includes(id))).toHaveLength(40);
  });

  it("the six operations that sync first are the ones that call syncFirst", () => {
    const source = readFileSync(path.join(HERE, "../src/operations/work/work-queue/queue.ts"), "utf8");
    const callers = [...source.matchAll(/export function (work[A-Za-z]+)\([^]*?\n}\n/g)]
      .filter((match) => match[0].includes("syncFirst(root, env)"))
      .map((match) => match[1]!)
      .sort();
    expect(callers).toEqual(["workAdd", "workClaim", "workClose", "workExport", "workRelease", "workReport"]);
  });

  it("equals the PRD 39 list, and a list that differs fails", () => {
    expect(prdReminderRows(PRD_39)).toHaveLength(47);
    expect(reminderSetProblems(PRD_39)).toEqual([]);
    const row = "| `lifecycle.list` | `make-docs lifecycle list` | No | On each run |\n";
    expect(PRD_39).toContain(row);
    expect(reminderSetProblems(PRD_39.replace(row, ""))).toEqual(["PRD 39 misses lifecycle.list, which the registry puts in the reminder set."]);
    expect(reminderSetProblems(PRD_39.replace(row, `${row}| \`work.queue.next\` | \`make-docs work next\` | No | On each run |\n`))).toEqual([
      "PRD 39 lists work.queue.next, which the registry does not put in the reminder set.",
    ]);
    expect(reminderSetProblems(PRD_39.replace(row, "| `lifecycle.list` | `make-docs lifecycle show` | No | On each run |\n"))).toEqual([
      "PRD 39 gives lifecycle.list the path `lifecycle show`; the registry has `lifecycle list`.",
    ]);
    expect(reminderSetProblems(PRD_39.replace(row, "| `lifecycle.list` | `make-docs lifecycle list` | Yes | On each run |\n"))).toEqual([
      "PRD 39 says that lifecycle.list syncs first.",
    ]);
    // The snapshot is the one row that shows the reminder only with the work store option (PRD 51 R-BACKLOG-SNAPSHOT-24).
    const snapshotRow = "| `work.backlog.snapshot` | `make-docs backlog snapshot` | No | Only with `--work-store` |\n";
    expect(PRD_39).toContain(snapshotRow);
    expect(reminderSetProblems(PRD_39.replace(snapshotRow, "| `work.backlog.snapshot` | `make-docs backlog snapshot` | No | On each run |\n"))).toEqual([
      'PRD 39 says that work.backlog.snapshot shows the reminder "On each run"; the code says "Only with `--work-store`".',
    ]);
  });
});

describe("W35 R0 P2 the reminder check (T3, A16, A18, A21)", () => {
  it("A16: each of the 40 commands that do not sync first and run the check on each run shows the line when one work file waits for import", async () => {
    const root = oneFileWaits();
    const shown: string[] = [];
    for (const id of listReminderOperationIds().filter((entry) => !SYNC_FIRST.includes(entry) && !OWN_CHECK_ONLY.includes(entry))) {
      const result = await runStubbed(id, root);
      expect(result, id).toEqual({ returned: true, reminder: WORK_REMINDER_LINE, held: WORK_REMINDER_LINE });
      shown.push(id);
    }
    expect(shown).toHaveLength(40);
    // The 41st: the snapshot shows the line with the work store option, from its own sync check, and never by default.
    const before = workReminderOwnCheckCount();
    for (const id of OWN_CHECK_ONLY) {
      expect(await runStubbed(id, root), id).toEqual({ returned: true, reminder: null, held: null });
      expect((await invokeOperation(id, { targetRoot: root }, cliContext(root))).reminder, id).toBeUndefined();
      expect(takeCliReminder(), id).toBeNull();
      expect((await invokeOperation(id, { targetRoot: root, workStore: true }, cliContext(root))).reminder, id).toBe(WORK_REMINDER_LINE);
      expect(takeCliReminder(), id).toBe(WORK_REMINDER_LINE);
    }
    expect(workReminderOwnCheckCount()).toBe(before);
    expect(WORK_REMINDER_LINE).toBe(`Work files wait for sync. Run: ${CHECKPOINT}`);
    // The check changed nothing: the file still waits.
    expect(decisions(root)).toEqual(["import"]);
  }, 120_000);

  it.each([
    ["nothing waits", synced],
    ["only a conflict waits", onlyConflictWaits],
    ["only a file waits for a write", onlyWriteWaits],
    ["the work store is not in charge", filesInCharge],
    ["no usable Store exists", noStore],
  ] as const)("A16: none of the 47 shows the line when %s", async (_name, state) => {
    const root = state();
    const files = fileHashes(root);
    let returned = 0;
    for (const id of listReminderOperationIds()) {
      const result = await runStubbed(id, root);
      expect([result.reminder, result.held], id).toEqual([null, null]);
      if (result.returned) returned += 1;
    }
    // The handlers ran for the states with a usable Store, so the silence is the answer of the check.
    if (state !== noStore) expect(returned).toBeGreaterThanOrEqual(41);
    // The check wrote no project file, and it made no Store where none was.
    expect(fileHashes(root)).toEqual(files);
    if (state === noStore) expect(existsSync(store)).toBe(false);
  }, 120_000);

  it("A16: a file that waits for a removal, and a recorded conflict, do not count", () => {
    const base = preview(synced());
    const file = (decision: string, recorded = false) => ({ path: P1, fileState: "unchanged", storeState: "unchanged", decision, conflictKind: null, recorded, held: false });
    const of = (pending: unknown[]) => workReminderOf({ ...base, pending } as WorkSyncPreview);
    expect(of([])).toBeNull();
    expect(of([file("remove-copy")])).toBeNull();
    expect(of([file("write")])).toBeNull();
    expect(of([file("conflict")])).toBeNull();
    expect(of([file("conflict", true)])).toBeNull();
    expect(of([file("report-unreadable")])).toBeNull();
    expect(of([file("none")])).toBeNull();
    // An import that a recorded conflict holds waits for a person, not for the checkpoint.
    expect(of([file("import", true)])).toBeNull();
    expect(of([file("write"), file("import")])).toBe(WORK_REMINDER_LINE);
  });

  it("A18: an excluded operation, and each operation with no Store read in its declared access, shows no line", async () => {
    const root = oneFileWaits();
    const outside = listOperations().filter((operation) => operation.status === "active" && !listReminderOperationIds().includes(operation.id));
    expect(outside.map((operation) => operation.id)).toEqual(expect.arrayContaining(["work.queue.status", "work.queue.next", "work.queue.sync", "project.checkpoint.run", "setup.store.check", "resource.read", "prd.authority.validate"]));
    for (const operation of outside) {
      const result = await runStubbed(operation.id, root);
      expect([result.reminder, result.held], operation.id).toEqual([null, null]);
      // The check function gives the same answer by itself, so it reads no Store for these operations.
      expect(await workReminderFor(getOperation(operation.id), root, cliContext(root)), operation.id).toBeNull();
    }
    expect(decisions(root)).toEqual(["import"]);
  }, 120_000);

  it("A18: the real work status, work next, work sync, and checkpoint show no reminder line", async () => {
    const root = oneFileWaits();
    for (const argv of [["work", "status", "--target-root", root], ["work", "next", "--target-root", root]]) {
      const result = await cli(argv);
      expect(result.exitCode, argv.join(" ")).toBe(0);
      expect(result.stderr, argv.join(" ")).toBe("");
      expect(reminderLines(result.stdout)).toBe(0);
    }
    // Each one syncs, so nothing waits after it. The check does not run for them at all.
    const before = workReminderOwnCheckCount();
    expect((await cli(["project", "checkpoint", "--target-root", root])).stderr).toBe("");
    write(root, P1, P1_TEXT);
    expect((await cli(["work", "sync", "--target-root", root])).stderr).toBe("");
    expect(workReminderOwnCheckCount()).toBe(before);
  });

  it("A18: --help of a command of the set shows no line and reads nothing", async () => {
    const root = oneFileWaits();
    for (const argv of [["project", "state", "status", "--help"], ["lifecycle", "list", "--help"], ["backlog", "snapshot", "--help"]]) {
      const result = built(argv, root);
      expect(result.status, argv.join(" ")).toBe(0);
      expect(result.stderr, argv.join(" ")).toBe("");
      expect(result.stdout).not.toContain(WORK_REMINDER_LINE);
    }
  });

  it("the check runs the authority rule first, then the sync check, and only for a Make Docs project", async () => {
    const root = oneFileWaits();
    const operation = getOperation("project.state.status");
    expect(await workReminderFor(operation, root, cliContext(root))).toBe(WORK_REMINDER_LINE);
    // A folder that is not a Make Docs project: no Store read, and no line.
    const plain = path.join(temp, "plain");
    mkdirSync(plain);
    const calls: string[] = [];
    setWorkReminderCheckForTests((target) => {
      calls.push(target);
      return preview(root);
    });
    expect(await workReminderFor(operation, plain, cliContext(plain))).toBeNull();
    // The files are in charge: the authority rule stops the check before the sync check.
    const other = project("other", "other-w35-reminder");
    write(other, P1, P1_TEXT);
    expect(await workReminderFor(operation, other, cliContext(other))).toBeNull();
    expect(calls).toEqual([]);
    expect(await workReminderFor(operation, root, cliContext(root))).toBe(WORK_REMINDER_LINE);
    expect(calls).toEqual([root]);
  });

  it("an operation with optional or handler Store admission passes the access check for a Store read first", async () => {
    const root = oneFileWaits();
    const snapshot = getOperation("backlog.review.refresh");
    expect(snapshot.storeAdmission).toBe("optional");
    const calls: string[] = [];
    setWorkReminderCheckForTests((target) => {
      calls.push(target);
      return preview(root);
    });
    // An agent route with no proved identity has no Store access at all: no Store read, and no line.
    const agent = createExecutionContext({ surface: "cli", route: "native-rule", writesAllowed: true, storeRoot: store, cwd: root });
    expect(await workReminderFor(snapshot, root, agent)).toBeNull();
    expect(await workReminderFor({ ...snapshot, storeAdmission: "handler" }, root, agent)).toBeNull();
    expect(calls).toEqual([]);
    // A person's terminal has the access.
    expect(await workReminderFor(snapshot, root, cliContext(root))).toBe(WORK_REMINDER_LINE);
    expect(calls).toEqual([root]);
    // The runner refuses a `required` operation for that agent before its handler runs, so no check runs for it.
    const stubbed = getOperation("project.state.status") as OperationDefinition;
    const handler = vi.spyOn(stubbed as OperationDefinition & { handler: NonNullable<OperationDefinition["handler"]> }, "handler");
    await expect(invokeOperation("project.state.status", { targetRoot: root }, agent)).rejects.toMatchObject({ code: "store-not-configured" });
    expect(handler).not.toHaveBeenCalled();
    expect(calls).toEqual([root]);
    expect(takeCliReminder()).toBeNull();
  });

  it("A21: a forced error inside the check leaves the result and the exit code unchanged", async () => {
    const root = oneFileWaits();
    const good = await cli(["project", "state", "status", "--target-root", root, "--json"]);
    expect([good.exitCode, reminderLines(good.stderr)]).toEqual([0, 1]);
    setWorkReminderCheckForTests(() => {
      throw new Error("forced error inside the reminder check");
    });
    const failed = await cli(["project", "state", "status", "--target-root", root, "--json"]);
    expect(failed.exitCode).toBe(0);
    expect(process.exitCode ?? 0).toBe(0);
    expect(failed.stderr).toBe("");
    expect(failed.stdout).toBe(good.stdout);
    const invocation = await invokeOperation("project.state.status", { targetRoot: root }, cliContext(root));
    expect(invocation.reminder).toBeUndefined();
    expect(JSON.stringify(invocation.value)).toBe(JSON.stringify(JSON.parse(good.stdout)));
    // A Store that cannot be read at check time is dropped in the same way.
    setWorkReminderCheckForTests(null);
    expect(await workReminderFor(getOperation("project.state.status"), root, createExecutionContext({ surface: "test", storeRoot: path.join(temp, "missing"), cwd: root }))).toBeNull();
    expect(existsSync(path.join(temp, "missing"))).toBe(false);
  });

  it("the runner calls the check one time, after the handler returned, and never inside the Store session of the command", () => {
    const source = readFileSync(path.join(HERE, "../src/operations/registry.ts"), "utf8");
    const body = source.slice(source.indexOf("export async function invokeOperation("), source.indexOf("/** Map a Store failure to its typed"));
    expect(body.split("workReminderFor(")).toHaveLength(2);
    expect(body.indexOf("workReminderFor(")).toBeGreaterThan(body.indexOf("leaveReminderScope(context)"));
    expect(body.indexOf("leaveReminderScope(context)")).toBeGreaterThan(body.indexOf("await run()"));
    expect(body.indexOf("enterReminderScope(context)")).toBeLessThan(body.indexOf("await run()"));
  });
});

describe("W35 R0 P2 the commands that sync first (A17)", () => {
  /** Each of the six real commands, on a store where one work file waits for import before the run. */
  const cases: Array<[string, (root: string, memo: { claimId?: string }) => Record<string, unknown>]> = [
    ["work.queue.add", () => ({ title: "A quick item" })],
    ["work.queue.export", (root) => ({ to: path.join(path.dirname(root), "exported") })],
    ["work.queue.claim", (root) => ({ unit: "W1 R0 P2 T1", claimant: "builder-a", expectedVersion: revision(root, "W1 R0 P2 T1") })],
    ["work.queue.report", (root) => ({ unit: "W1 R0 P2 T1", note: "Half done.", expectedVersion: revision(root, "W1 R0 P2 T1") })],
    ["work.queue.release", (root, memo) => ({ unit: "W1 R0 P2 T1", claimId: memo.claimId, expectedVersion: revision(root, "W1 R0 P2 T1") })],
    ["work.queue.close", (root) => ({ unit: "W1 R0 P2 T1", expectedVersion: revision(root, "W1 R0 P2 T1") })],
  ];

  function revision(root: string, coordinate: string): number {
    return units(root).find((unit) => unit.coordinate === coordinate)!.revision;
  }

  it("each of the six shows no line after a good sync, and the store holds the file after the run", async () => {
    const root = synced();
    const memo: { claimId?: string } = {};
    const ran: string[] = [];
    let text = P1_TEXT;
    for (const [id, input] of cases) {
      // One work file waits for import before the run.
      text = text.replace("- [ ] T2:", `- [ ] T2: (${id})`).replace(/\(work\.queue\.[a-z]+\) \(/, "(");
      const title = `Build the parser for ${id}.`;
      text = text.replace(/- \[ \] T1: .*\n/, `- [ ] T1: ${title}\n`);
      write(root, P1, text);
      expect(decisions(root), id).toEqual(["import"]);
      // A check that runs before the operation sees the waiting file and gives the line. This test fails for such a check.
      expect(await workReminderFor(getOperation(id), root, cliContext(root)), id).toBe(WORK_REMINDER_LINE);
      const invocation = await invokeOperation(id, { targetRoot: root, ...input(root, memo) }, cliContext(root));
      const value = invocation.value as { sync: { ran: string; imported: string[] }; claimId?: string | null };
      if (id === "work.queue.claim") memo.claimId = value.claimId ?? undefined;
      expect([value.sync.ran, value.sync.imported], id).toEqual(["sync", [P1]]);
      expect(invocation.reminder, id).toBeUndefined();
      expect(takeCliReminder(), id).toBeNull();
      // The store holds the file after the run, and nothing waits for import.
      expect(units(root).find((unit) => unit.coordinate === "W1 R0 P1 T1")!.title, id).toBe(title);
      expect(decisions(root).filter((decision) => decision === "import"), id).toEqual([]);
      ran.push(id);
    }
    expect(ran.sort()).toEqual([...SYNC_FIRST].sort());
  }, 120_000);

  it("the built CLI: work add prints no line when a file waited, and project state status prints it", () => {
    const root = oneFileWaits();
    const add = built(["work", "add", "A quick item", "--target-root", root, "--json"], root);
    expect(add.status, add.stderr).toBe(0);
    expect(add.stderr).toBe("");
    expect((JSON.parse(add.stdout) as { sync: { imported: string[] } }).sync.imported).toEqual([P1]);
    write(root, P1, P1_TEXT);
    const status = built(["project", "state", "status", "--target-root", root, "--json"], root);
    expect(status.status, status.stderr).toBe(0);
    expect(status.stderr).toBe(`${WORK_REMINDER_LINE}\n`);
    expect(() => JSON.parse(status.stdout)).not.toThrow();
    expect(status.stdout).not.toContain("Work files wait for sync");
  }, 120_000);
});

describe("W35 R0 P2 the CLI line (T4, A19, A20)", () => {
  it("A19: with --json, standard output is byte-identical with and without the reminder, and the line is on standard error one time", async () => {
    const root = oneFileWaits();
    for (const argv of [
      ["project", "state", "status", "--target-root", root, "--json"],
      ["project", "list", "--target-root", root, "--json"],
      ["lifecycle", "list", "--repo-root", root, "--json"],
    ]) {
      const withReminder = await cli(argv);
      expect(withReminder.exitCode, argv.join(" ")).toBe(0);
      expect(withReminder.stderr, argv.join(" ")).toBe(`${WORK_REMINDER_LINE}\n`);
      expect(withReminder.stdout).not.toContain("Work files wait for sync");
      expect(() => JSON.parse(withReminder.stdout)).not.toThrow();
      // The same command in the same state, with a check that finds nothing.
      const empty = { ...preview(root), pending: [] };
      setWorkReminderCheckForTests(() => empty);
      const without = await cli(argv);
      setWorkReminderCheckForTests(null);
      expect(without.stderr, argv.join(" ")).toBe("");
      expect(without.stdout, argv.join(" ")).toBe(withReminder.stdout);
    }
  });

  it("A19: plain output keeps the line off standard output too", async () => {
    const root = oneFileWaits();
    const result = built(["project", "state", "status", "--target-root", root], root);
    expect(result.status, result.stderr).toBe(0);
    expect(reminderLines(result.stderr)).toBe(1);
    expect(result.stdout).not.toContain("Work files wait for sync");
  });

  it("prints at most one line for each command run, and none for setup, mcp, update, or uninstall", async () => {
    const root = oneFileWaits();
    const err: string[] = [];
    // A run that invokes two operations of the set prints one line.
    const twice = async () => {
      await invokeOperation("project.state.status", { targetRoot: root }, cliContext(root));
      await invokeOperation("project.register.list", { targetRoot: root }, cliContext(root));
    };
    expect(await runCliEntry(twice, ["project", "list"], { writeError: (value) => err.push(value) })).toBe(0);
    expect(err).toEqual([`${WORK_REMINDER_LINE}\n`]);
    for (const command of ["setup", "mcp", "update", "uninstall"]) {
      err.length = 0;
      expect(await runCliEntry(twice, [command], { writeError: (value) => err.push(value) })).toBe(0);
      expect(err, command).toEqual([]);
    }
    // A line that an earlier run left never shows on a run that invokes nothing.
    await invokeOperation("project.state.status", { targetRoot: root }, cliContext(root));
    expect(await runCliEntry(async () => {}, ["project", "list"], { writeError: (value) => err.push(value) })).toBe(0);
    expect(err).toEqual([]);
    // A command that fails prints its error and no reminder.
    expect(await runCliEntry(async () => {
      await invokeOperation("project.state.status", { targetRoot: root }, cliContext(root));
      throw new Error("the command failed after its operation");
    }, ["project", "list"], { machineReadable: false, writeError: (value) => err.push(value) })).toBe(1);
    expect(err).toEqual(["the command failed after its operation\n"]);
    // A command that returns and then ends with another exit code than 0 prints no reminder (review finding M1).
    err.length = 0;
    expect(await runCliEntry(async () => {
      await invokeOperation("project.state.status", { targetRoot: root }, cliContext(root));
      process.exitCode = 1;
    }, ["project", "list"], { writeError: (value) => err.push(value) })).toBe(0);
    expect(err).toEqual([]);
    process.exitCode = 0;
    expect(await runCliEntry(async () => {
      await invokeOperation("project.state.status", { targetRoot: root }, cliContext(root));
    }, ["project", "list"], { writeError: (value) => err.push(value) })).toBe(0);
    expect(err).toEqual([`${WORK_REMINDER_LINE}\n`]);
  });

  it("M1: a command whose operation returns a refusal ends with exit code 1 and prints no reminder", async () => {
    const root = oneFileWaits();
    // The operation returns a refusal, and the CLI sets the exit code after that. The check still found the waiting file.
    const invocation = await invokeOperation("factory.workflow.show", { targetRoot: root, workflow: "x" }, cliContext(root));
    expect(invocation.value).toMatchObject({ result: "refused" });
    expect(isRefusedOperationValue(invocation.value)).toBe(true);
    expect(invocation.reminder).toBe(WORK_REMINDER_LINE);
    takeCliReminder();
    const inProcess = await cli(["factory", "workflow", "show", "x", "--target-root", root, "--json"]);
    expect(process.exitCode).toBe(1);
    expect(inProcess.stderr).toBe("");
    expect(JSON.parse(inProcess.stdout)).toMatchObject({ result: "refused" });
    process.exitCode = 0;
    // The built CLI, as its own process.
    const refused = built(["factory", "workflow", "show", "x", "--target-root", root], root);
    expect(refused.status).toBe(1);
    expect(refused.stderr).toBe("");
    expect(refused.stdout).toContain("refused");
    // A command of the same group that ends with exit code 0 prints the line.
    const good = built(["factory", "status", "--target-root", root], root);
    expect(good.status, good.stderr).toBe(0);
    expect(good.stderr).toBe(`${WORK_REMINDER_LINE}\n`);
    expect(isRefusedOperationValue({ result: "refused" })).toBe(true);
    expect(isRefusedOperationValue({ accepted: false })).toBe(true);
    expect(isRefusedOperationValue({ result: "claimed", accepted: true })).toBe(false);
    expect(isRefusedOperationValue(null)).toBe(false);
    expect(isRefusedOperationValue(["refused"])).toBe(false);
  }, 120_000);

  it("M3: a changed work file under a sync hold still waits for import, so the reminder shows and the checkpoint imports it", async () => {
    const root = synced();
    writeFileSync(path.join(root, ".make-docs/config.yaml"), `projectId: ${PROJECT_ID}\nprojectName: aurora\nwork:\n  syncHold:\n    - ${RECORD}/\n`);
    write(root, P1, P1_CHANGED);
    // A hold stops only a write and a removal of the file.
    expect(preview(root).pending.map((file) => [file.path, file.decision, file.held])).toEqual([[P1, "import", true]]);
    const status = ["project", "state", "status", "--target-root", root, "--json"];
    expect((await cli(status)).stderr).toBe(`${WORK_REMINDER_LINE}\n`);
    const checkpoint = await invokeOperation("project.checkpoint.run", { targetRoot: root }, cliContext(root));
    expect((checkpoint.value as { sync: { imported: string[] } }).sync.imported).toEqual([P1]);
    expect(units(root).find((unit) => unit.coordinate === "W1 R0 P1 T1")!.title).toBe("Build the new parser.");
    expect((await cli(status)).stderr).toBe("");
    // A held file that waits for a write does not count.
    storeChange(root, "W1 R0 P2 T1", { title: "Ship it soon." });
    expect(workReminderOf(preview(root))).toBeNull();
    expect((await cli(status)).stderr).toBe("");
  }, 120_000);

  it("A20: after a checkpoint run with write access the next command shows no reminder, and a caller with read access only still sees it", async () => {
    const root = oneFileWaits();
    const status = ["project", "state", "status", "--target-root", root, "--json"];
    expect((await cli(status)).stderr).toBe(`${WORK_REMINDER_LINE}\n`);
    // A caller with read access only: the checkpoint gives the read steps, and the file still waits.
    const readOnly = await invokeOperation("project.checkpoint.run", { targetRoot: root }, cliContext(root, { writesAllowed: false }));
    expect(readOnly.value).toMatchObject({ syncRan: false, syncSkipped: "read-access-only" });
    expect(readOnly.reminder).toBeUndefined();
    expect((await cli(status)).stderr).toBe(`${WORK_REMINDER_LINE}\n`);
    // A trigger run with write access imports, so it clears the reminder too.
    expect((await cli(["project", "checkpoint", "--target-root", root, "--event", "commit"])).exitCode).toBe(0);
    expect((await cli(status)).stderr).toBe("");
    // A direct run with write access.
    write(root, P1, P1_TEXT);
    expect((await cli(status)).stderr).toBe(`${WORK_REMINDER_LINE}\n`);
    expect((await cli(["project", "checkpoint", "--target-root", root])).exitCode).toBe(0);
    expect((await cli(status)).stderr).toBe("");
    // A conflict does not hold the reminder on.
    storeChange(root, "W1 R0 P2 T1", { title: "Ship it soon." });
    write(root, P2, P2_TEXT.replace("Ship it.", "Ship it today."));
    expect((await cli(["project", "checkpoint", "--target-root", root])).exitCode).toBe(0);
    expect((await cli(status)).stderr).toBe("");
  }, 120_000);
});

describe("W35 R0 P2 the snapshot reuses its own sync check (T3)", () => {
  it("the reminder of backlog snapshot runs no second check, and another command runs one", async () => {
    const root = oneFileWaits();
    const before = workReminderOwnCheckCount();
    // Store mode (`--work-store`) runs the sync check itself.
    const snapshot = await invokeOperation("work.backlog.snapshot", { targetRoot: root, workStore: true }, cliContext(root));
    expect((snapshot.value as { workStore?: { syncCheck: { pending: unknown[] } } }).workStore?.syncCheck.pending).toHaveLength(1);
    expect(snapshot.reminder).toBe(WORK_REMINDER_LINE);
    expect(workReminderOwnCheckCount()).toBe(before);
    const status = await invokeOperation("project.state.status", { targetRoot: root }, cliContext(root));
    expect(status.reminder).toBe(WORK_REMINDER_LINE);
    expect(workReminderOwnCheckCount()).toBe(before + 1);
    // A second snapshot in a new run reuses its own new check, never an old one.
    write(root, P1, P1_TEXT);
    const clean = await invokeOperation("work.backlog.snapshot", { targetRoot: root, workStore: true }, cliContext(root));
    expect(clean.reminder).toBeUndefined();
    expect(workReminderOwnCheckCount()).toBe(before + 1);
    // The default snapshot reads no Store state (PRD 51 R-BACKLOG-SNAPSHOT-24): no reminder, and no reminder check (review finding M2).
    write(root, P1, P1_CHANGED);
    const calls: string[] = [];
    setWorkReminderCheckForTests((target) => {
      calls.push(target);
      return preview(root);
    });
    const files = await invokeOperation("work.backlog.snapshot", { targetRoot: root }, cliContext(root));
    expect(files.value).not.toHaveProperty("workStore");
    expect((files.value as { capabilities: { store: { state: string } } }).capabilities.store.state).toBe("not-used");
    expect(files.reminder).toBeUndefined();
    expect(takeCliReminder()).toBeNull();
    expect(await workReminderFor(getOperation("work.backlog.snapshot"), root, cliContext(root))).toBeNull();
    expect(calls).toEqual([]);
    setWorkReminderCheckForTests(null);
    expect(workReminderOwnCheckCount()).toBe(before + 1);
    // With the work store option the same file gives the line, from the snapshot's own check.
    expect((await invokeOperation("work.backlog.snapshot", { targetRoot: root, workStore: true }, cliContext(root))).reminder).toBe(WORK_REMINDER_LINE);
    expect(workReminderOwnCheckCount()).toBe(before + 1);
    // With the work store option and the files in charge, the snapshot runs no sync check, so it gives no line.
    const other = project("other", "other-w35-reminder");
    write(other, P1, P1_CHANGED);
    expect((await invokeOperation("work.backlog.snapshot", { targetRoot: other, workStore: true }, cliContext(other))).reminder).toBeUndefined();
    expect(workReminderOwnCheckCount()).toBe(before + 1);
  });

  it("M2 on the built CLI: the default backlog snapshot prints no reminder, and backlog snapshot --work-store prints it", () => {
    const root = oneFileWaits();
    const byDefault = built(["backlog", "snapshot", "--target-root", root], root);
    expect(byDefault.status, byDefault.stderr).toBe(0);
    expect(byDefault.stderr).toBe("");
    expect((JSON.parse(byDefault.stdout) as { capabilities: { store: { state: string } } }).capabilities.store.state).toBe("not-used");
    const withStore = built(["backlog", "snapshot", "--target-root", root, "--work-store"], root);
    expect(withStore.status, withStore.stderr).toBe(0);
    expect(withStore.stderr).toBe(`${WORK_REMINDER_LINE}\n`);
  }, 120_000);

  it("an operation that runs inside another one leaves the reminder to the outermost one", async () => {
    const root = oneFileWaits();
    const outer = getOperation("project.state.status") as OperationDefinition;
    const saved = outer.handler;
    const inner: Array<string | undefined> = [];
    outer.handler = async (_input, context) => {
      inner.push((await invokeOperation("project.register.list", { targetRoot: root }, context)).reminder);
      inner.push((await invokeOperation("work.backlog.snapshot", { targetRoot: root, workStore: true }, context)).reminder);
      return { stub: true };
    };
    const before = workReminderOwnCheckCount();
    try {
      const invocation = await invokeOperation("project.state.status", { targetRoot: root }, cliContext(root));
      expect(inner).toEqual([undefined, undefined]);
      expect(invocation.reminder).toBe(WORK_REMINDER_LINE);
      // The outermost operation is read-only, so it reuses the check that the snapshot ran inside it.
      expect(workReminderOwnCheckCount()).toBe(before);
      expect(takeCliReminder()).toBe(WORK_REMINDER_LINE);
    } finally {
      outer.handler = saved;
    }
  });
});

describe("W35 R0 P2 the MCP result field (T2, T5, A22)", () => {
  it("lists the tools with a fixed result schema: backlog_review_open and backlog_review_refresh, and only the second is in the set", () => {
    const fixed = listOperations().filter((operation) => getOperation(operation.id).mcpResultSchema !== undefined).map((operation) => operation.id).sort();
    expect(fixed).toEqual(["backlog.review.open", "backlog.review.refresh"]);
    expect(fixed.filter((id) => listReminderOperationIds().includes(id))).toEqual(["backlog.review.refresh"]);
  });

  it("A22: a tool result of the set carries the reminder in content and structuredContent, and backlog_review_refresh carries none and passes its schema", async () => {
    expect(process.env.MAKE_DOCS_HOME).toBe(store);
    const root = path.join(temp, "project");
    mkdirSync(root);
    const plan = prepareGenericMcpSetup({ clientLabel: "w35-p2", storeRoot: store, executable: verifyMakeDocsExecutable({ executablePath: CLI }) });
    const connection = (plan.configuration as { mcpServers: { "make-docs": { env: Record<string, string> } } }).mcpServers["make-docs"].env;
    applyGenericMcpSetup(plan);
    const setup = built(["setup", "--target", root, "--yes", "--no-codex", "--no-claude-code", "--no-skills", "--generic-mcp-client", "w35-p2", "--json"], temp);
    expect(setup.status, setup.stderr || setup.stdout.slice(0, 2000)).toBe(0);
    vi.stubEnv(MCP_CONNECTION_ID_ENV, connection.MAKE_DOCS_MCP_CONNECTION_ID!);
    vi.stubEnv(MCP_CONNECTION_KEY_ENV, connection.MAKE_DOCS_MCP_CONNECTION_KEY!);
    const canonical = platform.describePath(root).canonicalPath;
    write(canonical, INDEX, INDEX_TEXT);
    write(canonical, P1, P1_TEXT);
    workSync(canonical, env(), null);
    // Nothing waits: no tool result holds the field.
    const quiet = await callMakeDocsMcpTool("project_state_status", { targetRoot: canonical }, { profile: "all" });
    expect(quiet).not.toHaveProperty("reminder");
    write(canonical, P1, P1_CHANGED);

    // The tool function: the reminder is one field of the result object, beside `result`, and `result` does not change.
    const direct = await callMakeDocsMcpTool("project_state_status", { targetRoot: canonical }, { profile: "all" });
    // The field names the command and the tool, as the first line of work next does (review finding S3).
    expect(direct.reminder).toBe(WORK_REMINDER_MCP_LINE);
    expect(WORK_REMINDER_MCP_LINE).toBe("Work files wait for sync. Run: make-docs project checkpoint (MCP tool: project_checkpoint)");
    expect(Object.keys(direct)).toEqual(["tool", "source", "operation", "access", "mcpReady", "result", "reminder"]);
    expect(JSON.stringify(direct.result)).toBe(JSON.stringify(quiet.result));
    // The work read tools name the checkpoint tool in their own lines, and carry no reminder field.
    // A tool result that is a refusal carries no reminder field (review finding M1).
    const refused = await callMakeDocsMcpTool("factory_workflow_show", { targetRoot: canonical, workflow: "x" }, { profile: "all" });
    expect(refused.result).toMatchObject({ result: "refused" });
    expect(refused).not.toHaveProperty("reminder");
    expect((await callMakeDocsMcpTool("factory_status", { targetRoot: canonical }, { profile: "all" })).reminder).toBe(WORK_REMINDER_MCP_LINE);
    const next = await callMakeDocsMcpTool("work_next", { targetRoot: canonical }, { profile: "backlog" });
    expect(next).not.toHaveProperty("reminder");
    const nextResult = next.result as { lines: string[]; summary: string };
    expect(nextResult.lines[0]).toContain("project_checkpoint");
    expect(nextResult.summary.split("\n")[0]).toContain("make-docs project checkpoint (MCP tool: project_checkpoint)");
    const statusResult = (await callMakeDocsMcpTool("work_status", { targetRoot: canonical }, { profile: "backlog" })).result as { lines: string[]; summary: string };
    expect(statusResult.lines[0]).toContain("project_checkpoint");
    expect(statusResult.summary.startsWith(statusResult.lines[0]!)).toBe(true);

    // The wire: a host that reads only `content`, or only `structuredContent`, gets the reminder.
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const server = createMakeDocsMcpServer({ profile: "all" });
    const client = new Client({ name: "w35-p2-test", version: "1" });
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
    try {
      const wire = await client.callTool({ name: "project_state_status", arguments: { targetRoot: canonical } });
      expect(wire.isError).not.toBe(true);
      expect((wire.structuredContent as { reminder?: string }).reminder).toBe(WORK_REMINDER_MCP_LINE);
      const text = (wire.content as Array<{ type: string; text: string }>)[0]!.text;
      expect((JSON.parse(text) as { reminder?: string }).reminder).toBe(WORK_REMINDER_MCP_LINE);
      // A tool call that fails is an error result, with no reminder.
      const failed = await client.callTool({ name: "project_state_status", arguments: { targetRoot: path.join(temp, "missing-project") } });
      if (failed.isError === true) expect(JSON.stringify(failed)).not.toContain("Work files wait for sync");
      const refusedWire = await client.callTool({ name: "factory_workflow_show", arguments: { targetRoot: canonical, workflow: "x" } });
      expect(JSON.stringify(refusedWire)).not.toContain("Work files wait for sync");

      // backlog_review_refresh has a fixed result schema. Its operation finds the same waiting file, and its tool result holds no reminder.
      vi.spyOn(process, "cwd").mockReturnValue(canonical);
      const snapshot = getOperation("work.backlog.snapshot") as OperationDefinition & { handler: NonNullable<OperationDefinition["handler"]> };
      vi.spyOn(snapshot, "handler").mockReturnValue(structuredClone(smallPresentationReport).snapshot as never);
      const envelope = createBacklogLiveEnvelope(structuredClone(smallPresentationReport), PRESENTATION_SESSION_ID);
      const invocation = await invokeOperation("backlog.review.refresh", { envelope }, createExecutionContext({
        surface: "mcp", route: "mcp", storeRoot: store, cwd: canonical,
        mcpConnectionId: connection.MAKE_DOCS_MCP_CONNECTION_ID, mcpConnectionKey: connection.MAKE_DOCS_MCP_CONNECTION_KEY,
      }));
      expect(invocation.reminder).toBe(WORK_REMINDER_LINE);
      const fromTool = await callMakeDocsMcpTool("backlog_review_refresh", { envelope }, { profile: "all" });
      expect(fromTool).not.toHaveProperty("reminder");
      const refresh = await client.callTool({ name: "backlog_review_refresh", arguments: { envelope } });
      expect(refresh.isError).not.toBe(true);
      expect(() => BacklogReviewRefreshPayloadV1Schema.parse(refresh)).not.toThrow();
      expect(JSON.stringify(refresh)).not.toContain("Work files wait for sync");
    } finally {
      await client.close();
      await server.close();
    }
  }, 120_000);
});

describe("W35 R0 P2 work next and work status (T6, T7, A23 to A25)", () => {
  it("A23: with one changed work file, the first line of both names the checkpoint, and work next marks each unit of that file", () => {
    const root = oneFileWaits();
    const files = fileHashes(root);
    const before = storeState(root);
    const head = "1 work file waits for import";
    const step = "Run this first: make-docs project checkpoint (MCP tool: project_checkpoint)";

    const status = workStatus(root, env(), workAuthority(root, store, null));
    expect(status.lines[0]).toBe(`${head}, so the work store is out of date. ${step}`);
    expect(status.summary.split("\n")[0]).toBe(status.lines[0]);
    expect(status.filesWaitingForImport).toEqual([P1]);
    expect(status.lines.at(-1)).toBe("Changes nothing.");

    for (const level of ["phase", "task", "stage"] as const) {
      const next = workNext(root, env(), { level, includeQuickItems: true, claimant: null, limit: null });
      expect(next.lines[0], level).toBe(`${head}, so this list can be out of date. ${step}`);
      expect(next.summary.split("\n")[0]).toBe(next.lines[0]);
      expect(next.filesWaitingForImport).toEqual([P1]);
      // No new file waits, so the list is complete.
      expect(next.listComplete).toBe(true);
      expect(next.lines.some((line) => line.startsWith("This list is not complete"))).toBe(false);
      const all = [...next.ready, ...next.waiting];
      expect(all.length, level).toBeGreaterThan(0);
      // Each unit of the changed file has the mark, and units of other files have none.
      for (const item of all) expect(item.fileWaitsForImport, item.coordinate).toBe(item.sourcePath === P1);
      expect(all.some((item) => item.fileWaitsForImport)).toBe(true);
      expect(all.some((item) => !item.fileWaitsForImport)).toBe(true);
      for (const item of all) {
        const line = next.lines.find((entry) => entry.startsWith(`  ${item.label}: `))!;
        expect(line.endsWith(WORK_OUT_OF_DATE_MARK), item.coordinate).toBe(item.sourcePath === P1);
      }
      expect(next.lines.at(-1)).toBe("Changes nothing.");
    }
    // A25: neither command changed a store record or a file.
    expect(storeState(root)).toBe(before);
    expect(fileHashes(root)).toEqual(files);
  });

  it("A23: when nothing waits, neither command names the checkpoint, and no unit has the mark", () => {
    const root = synced();
    const status = workStatus(root, env(), workAuthority(root, store, null));
    expect(status.summary).not.toContain("checkpoint");
    expect(status.filesWaitingForImport).toEqual([]);
    const next = workNext(root, env(), { level: "task", includeQuickItems: true, claimant: null, limit: null });
    expect(next.summary).not.toContain("checkpoint");
    expect(next.summary).not.toContain("out of date");
    expect([next.listComplete, next.filesWaitingForImport]).toEqual([true, []]);
    expect([...next.ready, ...next.waiting].every((item) => item.fileWaitsForImport === false)).toBe(true);
    // A conflict or a file that waits for a write is not a file that waits for import.
    const conflict = onlyConflictWaitsIn(root);
    expect(conflict.filesWaitingForImport).toEqual([]);
    expect(conflict.lines[0]).not.toContain("checkpoint");
  });

  function onlyConflictWaitsIn(root: string) {
    storeChange(root, "W1 R0 P2 T1", { title: "Ship it soon." });
    write(root, P2, P2_TEXT.replace("Ship it.", "Ship it today."));
    return workNext(root, env(), { level: "task", includeQuickItems: true, claimant: null, limit: null });
  }

  it("A24: with a new work file that the store does not hold, work next says in one line that the list is not complete", () => {
    const root = synced();
    write(root, P3, P3_TEXT);
    const files = fileHashes(root);
    const before = storeState(root);
    const next = workNext(root, env(), { level: "phase", includeQuickItems: true, claimant: null, limit: null });
    expect(next.lines[0]).toBe("1 work file waits for import, so this list can be out of date. Run this first: make-docs project checkpoint (MCP tool: project_checkpoint)");
    expect(next.lines[1]).toBe("This list is not complete: 1 new work file waits for import, and the work store does not hold its units yet. Run: make-docs project checkpoint (MCP tool: project_checkpoint)");
    expect(next.lines.filter((line) => line.startsWith("This list is not complete"))).toHaveLength(1);
    expect(next.listComplete).toBe(false);
    expect(next.filesWaitingForImport).toEqual([P3]);
    // The store holds no unit of the new file, so no mark can show it.
    expect([...next.ready, ...next.waiting].some((item) => item.coordinate.startsWith("W1 R0 P3"))).toBe(false);
    expect([...next.ready, ...next.waiting].every((item) => !item.fileWaitsForImport)).toBe(true);
    // A25.
    expect(storeState(root)).toBe(before);
    expect(fileHashes(root)).toEqual(files);
  });

  it("A24: in a checkout whose first sync is not done, work next says in one line that the list is not complete", () => {
    const root = bound();
    const files = fileHashes(root);
    const before = storeState(root);
    const next = workNext(root, env(), { level: "phase", includeQuickItems: true, claimant: null, limit: null });
    expect(next.lines[0]).toBe("3 work files wait for import, so this list can be out of date. Run this first: make-docs project checkpoint (MCP tool: project_checkpoint)");
    expect(next.lines[1]).toBe("This list is not complete: this checkout has not synced yet, so the work store can lack its work files. Run: make-docs project checkpoint (MCP tool: project_checkpoint)");
    expect(next.lines.filter((line) => line.startsWith("This list is not complete"))).toHaveLength(1);
    expect(next.listComplete).toBe(false);
    const status = workStatus(root, env(), workAuthority(root, store, null));
    expect(status.lines[0]).toContain("3 work files wait for import, so the work store is out of date. Run this first: make-docs project checkpoint");
    // A25.
    expect(storeState(root)).toBe(before);
    expect(fileHashes(root)).toEqual(files);
  });

  it("A23 to A25 on the built CLI: plain output starts with the checkpoint command, and both commands change nothing", () => {
    const root = oneFileWaits();
    write(root, P3, P3_TEXT);
    const files = fileHashes(root);
    const before = storeState(root);
    for (const command of ["status", "next"]) {
      const plain = built(["work", command, "--target-root", root], root);
      expect(plain.status, plain.stderr).toBe(0);
      const json = JSON.parse(plain.stdout) as { lines: string[]; summary: string };
      expect(json.lines[0], command).toContain("Run this first: make-docs project checkpoint");
      // The sync line near the end names the same command, so a person reads one answer (review finding S1).
      const syncLine = json.lines.find((line) => line.includes("Sync check:"))!;
      expect(syncLine, command).toContain("Sync check: 2 files to import. make-docs project checkpoint (MCP tool: project_checkpoint) applies the changes.");
      expect(json.summary, command).not.toContain("make-docs work sync");
      expect(json.summary, command).not.toContain("The next work write command");
      expect(plain.stderr, command).toBe("");
    }
    expect(storeState(root)).toBe(before);
    expect(fileHashes(root)).toEqual(files);
    // The help of both commands keeps "Changes nothing".
    for (const command of ["status", "next"]) expect(built(["work", command, "--help"], root).stdout).toContain("Changes nothing.");
  }, 120_000);
});

describe("W35 R0 P2 the project URI read (T8, A26)", () => {
  it("each backlog read carries the fixed sentence, and the read stays read-only", () => {
    const root = oneFileWaits();
    const files = fileHashes(root);
    const before = storeState(root);
    expect(WORK_PROJECT_SYNC_NOTE).toBe("This read does not know whether work files wait for sync in a checkout. Run make-docs project checkpoint in a checkout to find out.");
    for (const uri of [
      "make-docs://project/aurora/backlog/",
      "make-docs://project/aurora/backlog/W1/",
      "make-docs://project/aurora/backlog/W1/R0/",
      "make-docs://project/aurora/backlog/W1/R0/P1/",
      "make-docs://project/aurora/backlog/W1/R0/P1/S1",
      "make-docs://project/aurora/backlog/W1/R0/P1/T1",
    ]) {
      const read = readWorkProjectResource(uri, { storeRoot: store, now: NOW });
      const lines = read.text.trimEnd().split("\n");
      expect(lines.filter((line) => line === WORK_PROJECT_SYNC_NOTE), uri).toHaveLength(1);
      // It stands after the sentence about sync conflicts and before "Changes nothing.".
      expect(lines.slice(-3), uri).toEqual([
        "Sync conflicts belong to one checkout, so this read does not show them. Run make-docs work next in a checkout to see them.",
        WORK_PROJECT_SYNC_NOTE,
        "Changes nothing.",
      ]);
      // The read does not know: it shows the store text, with no mark and no count of files.
      expect(read.text).not.toContain("out of date");
    }
    expect(storeState(root)).toBe(before);
    expect(fileHashes(root)).toEqual(files);
  });

  it("the read runs no sync and no sync check, and a tasks read keeps the text of the shared renderer", () => {
    const source = readFileSync(path.join(HERE, "../src/operations/work/work-queue/project-resource.ts"), "utf8");
    expect(source).not.toMatch(/previewWorkSync|syncWorkFiles|work-store\/sync/);
    // A project URI read opens the Store read only.
    expect(source).toContain("readWorkStoreAt(");
    expect(source).not.toMatch(/writeWorkStore/);
    const root = synced();
    const tasks = readWorkProjectResource("make-docs://project/aurora/tasks/", { storeRoot: store, now: NOW });
    // Quick items live only in the work store, so no work file can wait for sync for them (PRD 52 R-WORK-URI-7 keeps one renderer).
    expect(tasks.text).not.toContain(WORK_PROJECT_SYNC_NOTE);
    expect(decisions(root)).toEqual([]);
  });
});

describe("W35 R0 P2 the agent form (T12, A28)", () => {
  const TEMPLATE = path.join(REPO, "packages/docs/template/.make-docs/system/references/work-store.md");
  const INSTALLED = path.join(REPO, ".make-docs/system/references/work-store.md");

  it("the template reference and the installed reference are byte-identical", () => {
    expect(readFileSync(INSTALLED)).toEqual(readFileSync(TEMPLATE));
  });

  it("each new rule has an ID on both sides, and a rule ID on one side only fails", () => {
    const reference = readFileSync(TEMPLATE, "utf8");
    // The rules of this phase. A later phase adds its rules after them.
    const added = WORK_STORE_RULES.filter((rule) => Number(rule.id.slice(-3)) >= 66 && Number(rule.id.slice(-3)) <= 69);
    expect(added.map((rule) => [rule.id, rule.agentForm.split("#")[1]])).toEqual([
      ["WORK-RULE-066", "sync"], ["WORK-RULE-067", "readiness"], ["WORK-RULE-068", "readiness"], ["WORK-RULE-069", "project-uris"],
    ]);
    for (const rule of added) expect(reference, rule.id).toContain(`(${rule.id})`);
    expect(workRuleTwinProblems(WORK_STORE_RULES, reference)).toEqual([]);
    // A rule ID in the catalog only, a rule ID in the reference only, and a rule outside its section.
    expect(workRuleTwinProblems(WORK_STORE_RULES, reference.replaceAll(" (WORK-RULE-067)", ""))).toEqual(["WORK-RULE-067 is in the catalog and not in the agent form."]);
    expect(workRuleTwinProblems(WORK_STORE_RULES.filter((rule) => rule.id !== "WORK-RULE-068"), reference)).toEqual(["WORK-RULE-068 is in the agent form and not in the catalog."]);
    expect(workRuleTwinProblems(WORK_STORE_RULES, reference.replaceAll(" (WORK-RULE-069)", "").replace("(WORK-RULE-001)", "(WORK-RULE-001) (WORK-RULE-069)"))).toEqual(['WORK-RULE-069 is not in the agent form section "project-uris".']);
    // The reference says what each new line means, with the exact command.
    expect(reference).toContain(WORK_REMINDER_LINE);
    expect(reference).toContain(WORK_OUT_OF_DATE_MARK);
    expect(reference).toContain("This list is not complete");
  });
});

describe("W35 R0 P2 parity fixtures run through the real read commands (WORK-RULE-066 to WORK-RULE-069)", () => {
  const fixtures = WORK_STORE_CONTRACT_FIXTURES.filter((fixture): fixture is ReadWaitScenarioFixture => fixture.kind === "read-wait-scenario");
  const states: Record<WorkReadWaitScenario, () => string> = {
    "nothing-waits": synced,
    "one-file-changed": oneFileWaits,
    "new-file": () => {
      const root = synced();
      write(root, P3, P3_TEXT);
      return root;
    },
    "first-sync-not-done": bound,
    "backlog-uri-read": oneFileWaits,
  };

  it("has one fixture for each scenario, and each new rule has a fixture", () => {
    expect(fixtures.map((fixture) => fixture.input.scenario).sort()).toEqual([...WORK_READ_WAIT_SCENARIOS].sort());
    const covered = new Set<string>(fixtures.flatMap((fixture) => fixture.rules));
    for (const id of ["WORK-RULE-066", "WORK-RULE-067", "WORK-RULE-068", "WORK-RULE-069"]) expect(covered.has(id), id).toBe(true);
  });

  it.each(fixtures.map((fixture) => [fixture.id, fixture] as const))("%s gives the answer of the fixture", (_id, fixture) => {
    const root = states[fixture.input.scenario]();
    const files = fileHashes(root);
    const before = storeState(root);
    const next = workNext(root, env(), { level: "phase", includeQuickItems: true, claimant: null, limit: null });
    const status = workStatus(root, env(), workAuthority(root, store, null));
    expect(next.filesWaitingForImport.length, fixture.id).toBe(fixture.expected.filesWaiting);
    expect(status.filesWaitingForImport.length, fixture.id).toBe(fixture.expected.filesWaiting);
    if (fixture.expected.uriSentence) {
      // The read does not know: it gives the same text when a file waits, with the fixed sentence.
      const read = readWorkProjectResource("make-docs://project/aurora/backlog/W1/R0/", { storeRoot: store, now: NOW });
      expect(read.text).toContain(WORK_PROJECT_SYNC_NOTE);
      expect(read.text).not.toContain("wait for import");
    } else {
      const named = (line: string) => line.includes("Run this first: make-docs project checkpoint");
      expect([named(next.lines[0]!), named(status.lines[0]!)], fixture.id).toEqual([fixture.expected.checkpointFirst, fixture.expected.checkpointFirst]);
      expect([...next.ready, ...next.waiting].filter((item) => item.fileWaitsForImport).map((item) => item.coordinate), fixture.id).toEqual(fixture.expected.markedPhases);
      expect(next.listComplete, fixture.id).toBe(fixture.expected.listComplete);
      expect(next.lines.filter((line) => line.startsWith("This list is not complete")).length, fixture.id).toBe(fixture.expected.listComplete ? 0 : 1);
    }
    expect(storeState(root) !== before || JSON.stringify(fileHashes(root)) !== JSON.stringify(files), fixture.id).toBe(fixture.expected.changed);
  });
});
