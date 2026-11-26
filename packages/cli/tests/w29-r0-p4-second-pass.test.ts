import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { applyGenericMcpSetup, prepareGenericMcpSetup } from "../src/generic-mcp-setup";
import { verifyMakeDocsExecutable } from "../src/harness-access";
import { MCP_CONNECTION_ID_ENV, MCP_CONNECTION_KEY_ENV } from "../src/mcp-connection";
import { readNativeMcpResource } from "../src/mcp/resources";
import { callMakeDocsMcpTool } from "../src/mcp/tools";
import { createExecutionContext } from "../src/operations/context";
import { getOperation, invokeOperation } from "../src/operations/registry";
import { ResourceOperationError } from "../src/operations/resource";
import { StoreAccessStateError } from "../src/operations/store-access";
import { buildBacklogSnapshot } from "../src/operations/work/backlog/snapshot";
import { WORK_FILES_NEXT_STEP } from "../src/operations/work/work-queue/files-fallback";
import { renderWorkTasksList, workAdd, workClaim, workExport, workSync, type WorkQueueEnv } from "../src/operations/work/work-queue/queue";
import type { WorkUnitRecord } from "../src/operations/work/work-store/schemas";
import { platform } from "../src/platform";
import { withStoreDatabase } from "../src/store/database";
import { getInstallationCheckoutId } from "../src/store/installation-state";
import { pruneProjectFromStore } from "../src/store/lifecycle";
import {
  WorkStoreRefusalError,
  claimWorkUnit,
  createQuickItem,
  deletePrunedProjectWorkRows,
  listWorkUnits,
  putWorkUnit,
  readWorkStore,
  readWorkStoreAt,
  workProjectDigest,
  writeWorkStore,
} from "../src/store/work-store";
import { adaptRunCliArgv } from "../src/run/cli";
import { mixedPortfolioFixture } from "./fixtures/backlog-contract";
import { cleanupTempDir, createTempDir } from "./helpers";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

/**
 * W29 R0 P4 second pass: T7 and T8 (the backlog snapshot source), T10 and T11
 * (project URI reads), T12 (the scoped work-row cleanup of a pruned project),
 * and `work next` without a usable Store. Every Store is a temporary
 * `MAKE_DOCS_HOME`. No test writes this repository's files.
 */

const NOW = new Date("2042-06-15T12:00:00.000Z");
const PROJECT_ID = "aurora-p4b-project";
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

## Phase Map

| File | Purpose |
| --- | --- |
| [01-first.md](01-first.md) | First. |
| [02-second.md](02-second.md) | Second. |
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

- None.

## Stage 2 - Check

### Tasks

- [ ] T3: Check it.

### Dependencies

- Stage 1.
`;

const P2_TEXT = `---
title: "Phase 2: Second"
kind: "work"
status: "active"
coordinate: "W1 R0 P2"
---

# Phase 2: Second

### Dependencies

- P1.

## Stage 1 - Ship

### Tasks

- [ ] T1: Ship it.
`;

const roots: string[] = [];
let temp: string;
let store: string;

beforeEach(() => {
  temp = platform.describePath(createTempDir("make-docs-w29-p4b-")).canonicalPath;
  roots.push(temp);
  store = path.join(temp, "store");
  vi.stubEnv("MAKE_DOCS_HOME", store);
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

function read(root: string, relative: string): string {
  return readFileSync(path.join(root, ...relative.split("/")), "utf8");
}

function project(name = "aurora", extra = "", projectId = PROJECT_ID): string {
  const root = path.join(temp, name);
  mkdirSync(path.join(root, ".make-docs"), { recursive: true });
  writeFileSync(path.join(root, ".make-docs/config.yaml"), `projectId: ${projectId}\nprojectName: ${name}\n${extra}`);
  return platform.describePath(root).canonicalPath;
}

function withBacklog(root: string): string {
  write(root, INDEX, INDEX_TEXT);
  write(root, P1, P1_TEXT);
  write(root, P2, P2_TEXT);
  return root;
}

/** A bound checkout with the fixture backlog, after its first sync. */
function imported(extra = ""): string {
  const root = withBacklog(project("aurora", extra));
  getInstallationCheckoutId(root, store);
  workSync(root, env(), null);
  return root;
}

function units(root: string, projectId = PROJECT_ID): WorkUnitRecord[] {
  return readWorkStore(root, (db) => listWorkUnits(db, projectId), { storeRoot: store });
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

function context(storeRoot = store, extra: Parameters<typeof createExecutionContext>[0] = {}) {
  return createExecutionContext({ surface: "test", writesAllowed: false, storeRoot, now: () => NOW.toISOString(), ...extra });
}

/** The snapshot operation. Store-mode facts are opt-in (owner decision 2026-11-23, option A), so `workStore` defaults to true here. */
async function snapshot(root: string, storeRoot = store, extra: Parameters<typeof createExecutionContext>[0] = {}, workStore = true) {
  return (await invokeOperation("work.backlog.snapshot", { targetRoot: root, ...(workStore ? { workStore: true } : {}) }, context(storeRoot, extra))).value as unknown as ReturnType<typeof buildBacklogSnapshot>;
}

async function readUri(uri: string, targetRoot: string, storeRoot = store) {
  return (await invokeOperation("resource.read", { uri, targetRoot }, context(storeRoot, { cwd: targetRoot }))).value as unknown as {
    kind: string;
    uri: string;
    text: string;
    content: { data: string };
    project: { name: string | null; projectId: string };
    data: Record<string, unknown>;
  };
}

const withoutTime = <T extends { generatedAt: string }>(value: T) => ({ ...value, generatedAt: "<time>" });

/* ------------------------------------------------------------------------ */
/* T7 and T8: the backlog snapshot source (A20, A21)                       */
/* ------------------------------------------------------------------------ */

describe("W29 R0 P4 T8: without a usable Store the snapshot reads the files exactly as before (A20)", () => {
  it("gives the file snapshot, with no store-mode key, for an absent Store, and makes no Store", async () => {
    const root = withBacklog(project());
    const absent = path.join(temp, "absent-store");
    const value = await snapshot(root, absent);
    expect(withoutTime(value)).toEqual(withoutTime(buildBacklogSnapshot(root)));
    expect(value.capabilities.store).toEqual({ state: "not-used", diagnosticCodes: [] });
    expect(JSON.stringify(value)).not.toMatch(/"readiness"|"workStore"/);
    expect(existsSync(absent)).toBe(false);
  });

  it("gives the file snapshot for a usable Store that this checkout is not bound to", async () => {
    imported();
    const other = withBacklog(project("other", "", "other-project"));
    const value = await snapshot(other);
    expect(withoutTime(value)).toEqual(withoutTime(buildBacklogSnapshot(other)));
    expect(value.capabilities.store.state).toBe("not-used");
  });

  it("declares project-read and Store-optional-read access (PRD 51 R-BACKLOG-SNAPSHOT-24)", () => {
    expect(getOperation("work.backlog.snapshot")).toMatchObject({ access: { store: "read", project: "read", hostConfig: "none" }, storeAdmission: "optional" });
  });
});

describe("W29 R0 P4 owner decision (2026-11-23, option A): store-mode facts are opt-in", () => {
  it("the default snapshot of a Store-mode checkout is the file snapshot, with no store-mode key", async () => {
    const root = imported();
    storeChange(root, "W1 R0 P1 T1", { status: "closed", closeOutcome: "done" });
    const value = await snapshot(root, store, {}, false);
    expect(withoutTime(value)).toEqual(withoutTime(buildBacklogSnapshot(root)));
    expect(value.capabilities.store.state).toBe("not-used");
    expect(JSON.stringify(value)).not.toMatch(/"readiness"|"workStore"/);
    // The file still shows T1 open; only the opt-in read takes the store's text.
    expect(value.records[0]!.phases[0]!.tasks[0]!.completed.value).toBe(false);
  });

  it("this repository's old installed backlog-review Skill accepts the default snapshot, and refuses the opt-in one", async () => {
    const root = imported();
    const oldSkill = await import(pathToFileURL(path.resolve(REPO_ROOT, ".agents/skills/backlog-review/scripts/agent-contract.mjs")).href);
    const defaultSnapshot = await snapshot(root, store, {}, false);
    const optIn = await snapshot(root);
    // validateBacklogRebuiltModel parses the snapshot with the old strict schema first, then
    // checks that the report belongs to it. A fixture report belongs to another snapshot, so a
    // snapshot that the old schema accepts fails only that later identity check.
    const identityOnly = "Rebuilt model must match the latest checked source facts.";
    expect(() => oldSkill.validateBacklogRebuiltModel(mixedPortfolioFixture.report, defaultSnapshot)).toThrow(identityOnly);
    let optInError: unknown = null;
    try {
      oldSkill.validateBacklogRebuiltModel(mixedPortfolioFixture.report, optIn);
    } catch (error) {
      optInError = error;
    }
    expect(optInError).toBeInstanceOf(Error);
    expect((optInError as Error).message).not.toContain(identityOnly);
    expect((optInError as Error).message).toMatch(/readiness|workStore|Unrecognized/i);
  });

  it("the CLI reads --work-store, and the leaf help names it", () => {
    expect(adaptRunCliArgv(["backlog", "snapshot", "--target-root", temp, "--work-store", "--json"]).invocation.input).toEqual({ targetRoot: temp, workStore: true });
    expect(adaptRunCliArgv(["backlog", "snapshot", "--target-root", temp]).invocation.input).toEqual({ targetRoot: temp });
    const help = runCliIn(temp, ["backlog", "snapshot", "--help"]);
    expect(help.status).toBe(0);
    expect(help.stdout).toContain("--work-store");
  });
});

describe("W29 R0 P4 T7: in store mode the snapshot reads the store and adds readiness (A21)", () => {
  it("matches the files when they and the store agree, and adds readiness facts to each record and phase", async () => {
    const root = imported();
    const value = await snapshot(root);
    const files = buildBacklogSnapshot(root);
    const strip = (snap: typeof value) => ({
      ...withoutTime(snap),
      capabilities: { ...snap.capabilities, store: null },
      workStore: null,
      records: snap.records.map(({ readiness: _r, ...record }) => ({ ...record, phases: record.phases.map(({ readiness: _p, ...phase }) => phase) })),
    });
    expect(strip(value)).toEqual(strip(files));
    expect(value.capabilities.store).toEqual({ state: "available", diagnosticCodes: [] });
    expect(value.workStore).toMatchObject({ authority: "store", state: "read", refusal: null, syncCheck: { pending: [], conflicts: [] } });
    const record = value.records[0]!;
    expect(record.readiness).toMatchObject({ source: "work-store", state: "ready", storeId: unitAt(root, "W1 R0").storeId });
    const [p1, p2] = record.phases;
    expect(p1!.readiness).toMatchObject({ state: "ready", waitReasons: [], liveClaim: null, syncConflict: false, revision: unitAt(root, "W1 R0 P1").revision });
    expect(p2!.readiness).toMatchObject({ state: "waiting", waitReasons: [{ reason: "dependency-open", coordinate: "W1 R0 P1" }] });
    // Facts only: no next action, priority, or order (R-BACKLOG-SNAPSHOT-32).
    expect(JSON.stringify(p2!.readiness)).not.toContain("nextAction");
  });

  it("reads each work file's text from the store, so a store change shows before sync writes the file", async () => {
    const root = imported();
    storeChange(root, "W1 R0 P1 T1", { status: "closed", closeOutcome: "done" });
    const before = read(root, P1);
    const value = await snapshot(root);
    const t1 = value.records[0]!.phases[0]!.tasks.find((task) => task.id.value === "T1")!;
    expect(t1.completed.value).toBe(true);
    expect(read(root, P1)).toBe(before);
    expect(value.workStore!.syncCheck!.pending).toEqual([{ path: P1, decision: "write", conflictKind: null, held: false }]);
  });

  it("names a live claim without its claim ID, and keeps records whose copies are off and gone", async () => {
    const root = imported("work:\n  projection: off\n");
    // The second sync removes the unchanged copies, because copies are off.
    workSync(root, env(), null);
    expect(existsSync(path.join(root, ...P1.split("/")))).toBe(false);
    const claim = workClaim(root, env(), { unit: "W1 R0 P1", claimant: "builder-a", taskHandle: "task-a", ttlSeconds: null, expectedVersion: unitAt(root, "W1 R0 P1").revision, takeover: null });
    const value = await snapshot(root);
    expect(value.records.map((record) => record.recordPath)).toEqual([RECORD]);
    expect(value.records[0]!.phases.map((phase) => phase.phasePath)).toEqual([P1, P2]);
    expect(value.records[0]!.phases[0]!.readiness!.liveClaim).toMatchObject({ claimant: "builder-a", taskHandle: "task-a" });
    expect(JSON.stringify(value)).not.toContain(claim.claimId!);
  });

  it("a Store refusal in store mode stops only the store read: the files are read and the typed result is named", async () => {
    const root = imported();
    const value = await snapshot(root, store, { surface: "mcp", route: "mcp" });
    expect(value.workStore).toMatchObject({ authority: "store", state: "refused", syncCheck: null, refusal: { code: "store-not-configured" } });
    expect(value.workStore!.refusal!.nextAction).toContain(WORK_FILES_NEXT_STEP);
    expect(value.capabilities.store.state).toBe("unavailable");
    expect(value.records[0]!.phases[0]!.readiness).toBeUndefined();
    expect(value.records[0]!.phases).toHaveLength(2);
  });
});

/* ------------------------------------------------------------------------ */
/* work next without a usable Store                                         */
/* ------------------------------------------------------------------------ */

describe("W29 R0 P4 second pass: work next without a usable Store points to the docs/work/ files", () => {
  it("returns the typed Store outcome with a next step that names the files, and makes no Store", async () => {
    const root = withBacklog(project());
    const absent = path.join(temp, "absent-store");
    const error = await invokeOperation("work.queue.next", { targetRoot: root }, createExecutionContext({ surface: "cli", route: "direct-cli", storeRoot: absent, now: () => NOW.toISOString() })).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(StoreAccessStateError);
    const typed = error as StoreAccessStateError;
    expect(typed.code).toBe("store-unavailable");
    expect(typed.nextAction).toContain(WORK_FILES_NEXT_STEP);
    expect(typed.details).toMatchObject({ authority: "files", workFiles: ["docs/work/", ".make-docs/archive/work/"] });
    expect(typed.message).toContain("Only operation 'work.queue.next' stopped.");
    expect(existsSync(absent)).toBe(false);
  });

  it("gives the same typed outcome for a usable Store that this checkout is not bound to, as work status does", async () => {
    imported();
    const other = withBacklog(project("other", "", "other-project"));
    const error = (await invokeOperation("work.queue.next", { targetRoot: other }, context()).catch((caught: unknown) => caught)) as StoreAccessStateError;
    expect(error).toBeInstanceOf(StoreAccessStateError);
    expect(error.code).toBe("store-unavailable");
    expect(error.reason).toBe("The docs/work/ files are the authority, because this checkout is not bound to the Store.");
    expect(error.nextAction).toBe(`Run make-docs setup in this checkout. ${WORK_FILES_NEXT_STEP}`);
  });

  it("still lists ready units when the Store is usable", async () => {
    const root = imported();
    const value = (await invokeOperation("work.queue.next", { targetRoot: root, level: "phase" }, context())).value as { ready: Array<{ coordinate: string }> };
    expect(value.ready.map((item) => item.coordinate)).toEqual(["W1 R0 P1"]);
  });
});

/* ------------------------------------------------------------------------ */
/* T10 and T11: project URI reads (A32, A34)                                */
/* ------------------------------------------------------------------------ */

describe("W29 R0 P4 T10: tasks URIs (A32)", () => {
  it("prints the same text as export --quick, from any folder, without opening a repository file", async () => {
    const root = imported();
    workAdd(root, env(), { title: "Compare two printers", body: "Ink costs too.", requestPath: null });
    workAdd(root, env(), { title: "Book the venue", body: null, requestPath: null });
    const quickFile = path.join(temp, "out", "tasks.md");
    workExport(root, env(), { to: null, quick: quickFile, paths: [] });
    // Move the checkout away: a project URI read needs no repository file.
    const moved = path.join(temp, "moved-away");
    renameSync(root, moved);
    const elsewhere = path.join(temp, "elsewhere");
    mkdirSync(elsewhere);
    const fromElsewhere = await readUri("make-docs://project/aurora/tasks/", elsewhere);
    const fromTemp = await readUri("make-docs://project/AURORA/tasks", temp);
    expect(fromElsewhere.text).toBe(readFileSync(quickFile, "utf8"));
    expect(fromElsewhere.text).toBe(renderWorkTasksList("aurora", units(moved)));
    // Only the URI as written differs.
    expect({ ...fromElsewhere, requestedUri: null }).toEqual({ ...fromTemp, requestedUri: null });
    expect(fromTemp.uri).toBe("make-docs://project/aurora/tasks/");
    expect(Buffer.from(fromElsewhere.content.data, "base64").toString("utf8")).toBe(fromElsewhere.text);
  });

  it("shows one quick item with its title, body, status, claim, and links, and the URI that work add names", async () => {
    const root = imported();
    write(root, "docs/requests/printers.md", "# Printers\n");
    const added = workAdd(root, env(), { title: "Compare two printers", body: "Ink costs too.", requestPath: "docs/requests/printers.md" });
    expect(added.uri).toBe("make-docs://project/aurora/tasks/1");
    workClaim(root, env(), { unit: "task 1", claimant: "builder-a", taskHandle: null, ttlSeconds: null, expectedVersion: added.revision, takeover: null });
    const value = await readUri(added.uri!, temp);
    expect(value.text).toContain("# task 1: Compare two printers");
    expect(value.text).toContain("- Status: open");
    expect(value.text).toContain("- Claim: held by builder-a until 2042-06-15T12:30:00.000Z");
    expect(value.text).toContain("  - outbound request: docs/requests/printers.md");
    expect(value.text).toContain("Ink costs too.");
    expect(value.text).not.toMatch(/wc-[a-z0-9]{8}/);
    expect(value.data).toMatchObject({ family: "tasks", kind: "item", item: { number: "1", body: "Ink costs too.", claim: { claimant: "builder-a", live: true } } });
  });

  it("keeps resource.read Store-free in its declared access (PRD 25 R-ACCESS-2); only a project URI opens a Store session", () => {
    expect(getOperation("resource.read")).toMatchObject({ access: { store: "none", project: "read", hostConfig: "none" } });
  });

  it("a system-resource read opens no Store session; a project read without a usable Store gives the typed outcome and names the files", async () => {
    const absent = path.join(temp, "absent-store");
    const system = await invokeOperation("resource.read", { uri: "make-docs://system/reference/lifecycle.md", targetRoot: temp }, context(absent, { cwd: temp }));
    expect((system.value as { resource: { identity: { uri: string } } }).resource.identity.uri).toBe("make-docs://system/reference/lifecycle.md");
    expect(existsSync(absent)).toBe(false);
    const error = await readUri("make-docs://project/aurora/tasks/", temp, absent).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(StoreAccessStateError);
    expect((error as StoreAccessStateError).code).toBe("store-unavailable");
    expect((error as StoreAccessStateError).nextAction).toContain("read the docs/work/ files of project aurora directly");
    expect(existsSync(absent)).toBe(false);
  });
});

describe("W29 R0 P4 T11: backlog URIs (A34)", () => {
  it("lists waves, revisions, and phases, and shows a phase with its stages and tasks", async () => {
    const root = imported();
    const rootList = await readUri("make-docs://project/aurora/backlog", temp);
    expect(rootList.uri).toBe("make-docs://project/aurora/backlog/");
    // A wave is ready only when all its revisions are closed (T17).
    expect(rootList.text).toContain("- W1: W1 [open; waiting] make-docs://project/aurora/backlog/W1/");
    const wave = await readUri("make-docs://project/aurora/backlog/w1", temp);
    expect(wave.uri).toBe("make-docs://project/aurora/backlog/W1/");
    expect(wave.text).toContain("Revisions (1):");
    const revision = await readUri("make-docs://project/aurora/backlog/W1/r0/", temp);
    expect(revision.text).toContain("Phases (2):");
    expect(revision.text).toContain("- W1 R0 P2: Phase 2: Second [open; waiting] make-docs://project/aurora/backlog/W1/R0/P2/");
    const phase = await readUri("make-docs://project/Aurora/backlog/W1/R0/P1", temp);
    expect(phase.uri).toBe("make-docs://project/aurora/backlog/W1/R0/P1/");
    expect(phase.text).toContain("- Readiness: ready");
    expect(phase.text).toContain(`- File: ${P1}`);
    expect(phase.text).toContain("Stages and tasks (5):");
    expect(phase.text).toContain("- W1 R0 P1 S2: Check [open; waiting] make-docs://project/aurora/backlog/W1/R0/P1/S2");
    expect(phase.text).toContain("  - W1 R0 P1 T3: Check it. [open; waiting] make-docs://project/aurora/backlog/W1/R0/P1/T3");
    expect(phase.text).toContain("Sync conflicts belong to one checkout");
    expect(phase.text.endsWith("Changes nothing.\n")).toBe(true);
    const task = await readUri("make-docs://project/aurora/backlog/w1/r0/p1/t3", temp);
    expect(task.uri).toBe("make-docs://project/aurora/backlog/W1/R0/P1/T3");
    expect(task.data).toMatchObject({ family: "backlog", kind: "unit", unit: { coordinate: "W1 R0 P1 T3", readiness: { state: "waiting" } }, children: [] });
    const stage = await readUri("make-docs://project/aurora/backlog/W1/R0/P1/S1", temp);
    expect(stage.text).toContain("Tasks (2):");
    // The same project ID URI gives the same read.
    const byId = await readUri(`make-docs://project/${PROJECT_ID}/backlog/W1/R0/P1/`, temp);
    type Read = { unit: { coordinate: string; readiness: unknown }; children: Array<{ coordinate: string }> };
    const facts = (data: unknown) => ({ unit: [(data as Read).unit.coordinate, (data as Read).unit.readiness], children: (data as Read).children.map((child) => child.coordinate) });
    expect(byId.uri).toBe(`make-docs://project/${PROJECT_ID}/backlog/W1/R0/P1/`);
    expect(facts(byId.data)).toEqual(facts(phase.data));
    expect(byId.project).toEqual({ name: "aurora", projectId: PROJECT_ID });
    void root;
  });

  it("gives the same result from any folder", async () => {
    imported();
    const a = path.join(temp, "a");
    const b = path.join(temp, "b", "deeper");
    mkdirSync(a);
    mkdirSync(b, { recursive: true });
    expect(await readUri("make-docs://project/aurora/backlog/W1/R0/P2/", a)).toEqual(await readUri("make-docs://project/aurora/backlog/W1/R0/P2/", b));
  });

  it("refuses an unknown project, a part after a task, a leading zero, quick item 0, and an unknown coordinate", async () => {
    imported();
    const refused = async (uri: string) => (await readUri(uri, temp).catch((error: unknown) => error)) as ResourceOperationError;
    const unknown = await refused("make-docs://project/nobody/tasks/");
    expect(unknown).toBeInstanceOf(ResourceOperationError);
    expect(unknown.code).toBe("resource-not-found");
    expect(unknown.message).toContain("The part that did not match: nobody.");
    expect((await refused("make-docs://project/aurora/backlog/W1/R0/P1/T3/x")).code).toBe("invalid-resource-uri");
    expect((await refused("make-docs://project/aurora/backlog/W1/R0/P01/")).code).toBe("invalid-resource-uri");
    expect((await refused("make-docs://project/aurora/tasks/0")).code).toBe("invalid-resource-uri");
    expect((await refused("make-docs://project/aurora/tasks/9")).message).toContain("has no quick item 9");
    const missing = await refused("make-docs://project/aurora/backlog/W1/R0/P9/");
    expect(missing.code).toBe("resource-not-found");
    expect(missing.message).toContain("Project aurora has no W1 R0 P9.");
    expect((await refused("make-docs://project/aurora/backlog/W1/R0/P1/?x")).code).toBe("invalid-resource-uri");
  });

  it("reads with one read-only Store session: a Store reader with no project folder", () => {
    imported();
    const names = readWorkStoreAt(store, (db) => db.prepare("SELECT project_name FROM project_register").all());
    expect(names).toEqual([{ project_name: "aurora" }]);
    expect(() => readWorkStoreAt(path.join(temp, "absent-store"), () => null)).toThrow("The Store is absent");
  });
});

/* ------------------------------------------------------------------------ */
/* T12: scoped cleanup of a pruned project's work rows                      */
/* ------------------------------------------------------------------------ */

describe("W29 R0 P4 T12: the scoped cleanup of a pruned project's work rows", () => {
  /** A project with a register row and work rows, and no bound checkout. */
  function unboundProject(name: string, projectId: string): string {
    const root = project(name, "", projectId);
    writeWorkStore(root, (db) => {
      createQuickItem(db, projectId, { title: `First of ${name}`, body: null, links: [] });
      createQuickItem(db, projectId, { title: `Second of ${name}`, body: null, links: [] });
    }, { storeRoot: store });
    return root;
  }

  const digestOf = (root: string, projectId: string) => readWorkStore(root, (db) => workProjectDigest(db, projectId), { storeRoot: store });

  it("work export gives the work digest only when it wrote all of the project's work", () => {
    const root = imported();
    workAdd(root, env(), { title: "Compare two printers", body: null, requestPath: null });
    const partial = workExport(root, env(), { to: path.join(temp, "copies-a"), quick: null, paths: [] });
    expect(partial).toMatchObject({ complete: false, workDigest: null });
    expect(partial.summary).toContain("does not hold all of the project's work");
    const filtered = workExport(root, env(), { to: path.join(temp, "copies-b"), quick: path.join(temp, "q-b.md"), paths: [P1] });
    expect(filtered).toMatchObject({ complete: false, workDigest: null });
    const full = workExport(root, env(), { to: path.join(temp, "copies-c"), quick: path.join(temp, "q-c.md"), paths: [] });
    expect(full.complete).toBe(true);
    expect(full.workDigest).toBe(digestOf(root, PROJECT_ID));
    expect(full.summary).toContain(`Work digest: ${full.workDigest}.`);
  });

  it("refuses while the project is still registered, and a prune with the digest removes only that project's work rows", () => {
    const kept = imported();
    const beta = unboundProject("beta", "beta-project");
    const digest = digestOf(beta, "beta-project");
    expect(() => readWorkStore(beta, () => null, { storeRoot: store })).not.toThrow();
    const refusal = (() => {
      try {
        withStoreDatabase(store, (db) => deletePrunedProjectWorkRows(db, PROJECT_ID, { exportDigest: digestOf(kept, PROJECT_ID) }));
        return null;
      } catch (error) {
        return error as WorkStoreRefusalError;
      }
    })();
    expect(refusal).toBeInstanceOf(WorkStoreRefusalError);
    expect(refusal!.refusal).toBe("project-still-registered");
    const auroraBefore = units(kept).length;

    const pruned = pruneProjectFromStore({ repoRoot: beta, projectId: "beta-project", storeRoot: store, workExportDigest: digest });
    expect(pruned).toMatchObject({ status: "pruned", registerRowKept: false, workRows: { status: "removed", removed: { work_units: 2, work_claims: 0 } } });
    expect(units(kept, "beta-project")).toEqual([]);
    expect(units(kept)).toHaveLength(auroraBefore);
  });

  it("keeps the work rows without a digest, with a stale digest, and with a live claim", () => {
    imported();
    const gamma = unboundProject("gamma", "gamma-project");
    expect(pruneProjectFromStore({ repoRoot: gamma, projectId: "gamma-project", storeRoot: store })).toMatchObject({
      status: "pruned",
      workRows: { status: "kept", reason: "No work export digest was given, so the project's work rows stay." },
    });
    expect(units(gamma, "gamma-project")).toHaveLength(2);

    const delta = unboundProject("delta", "delta-project");
    const stale = digestOf(delta, "delta-project");
    writeWorkStore(delta, (db) => createQuickItem(db, "delta-project", { title: "Added after the export", body: null, links: [] }), { storeRoot: store });
    const staleResult = pruneProjectFromStore({ repoRoot: delta, projectId: "delta-project", storeRoot: store, workExportDigest: stale });
    expect(staleResult).toMatchObject({ status: "pruned", workRows: { status: "kept" } });
    expect((staleResult as { workRows: { reason: string } }).workRows.reason).toContain("do not match the export digest");
    expect(units(delta, "delta-project")).toHaveLength(3);

    const epsilon = unboundProject("epsilon", "epsilon-project");
    writeWorkStore(epsilon, (db) => {
      const item = listWorkUnits(db, "epsilon-project")[0]!;
      claimWorkUnit(db, { unitStoreId: item.storeId, claimant: "builder-z", taskHandle: null, ttlSeconds: 1800, expectedVersion: item.revision, takeover: null }, { now: new Date() });
    }, { storeRoot: store });
    const claimed = pruneProjectFromStore({ repoRoot: epsilon, projectId: "epsilon-project", storeRoot: store, workExportDigest: digestOf(epsilon, "epsilon-project") });
    expect((claimed as { workRows: { status: string; reason: string } }).workRows).toMatchObject({ status: "kept" });
    expect((claimed as { workRows: { reason: string } }).workRows.reason).toContain("has a live claim by builder-z");
    expect(units(epsilon, "epsilon-project")).toHaveLength(2);
  });
});

/* ------------------------------------------------------------------------ */
/* Review fixes (2026-11-23)                                                */
/* ------------------------------------------------------------------------ */

const CLI_PATH = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../dist/index.js");

function runCliIn(cwd: string, args: string[]) {
  return spawnSync(process.execPath, [CLI_PATH, ...args], { cwd, encoding: "utf8", env: { ...process.env, MAKE_DOCS_HOME: store } });
}

describe("W29 R0 P4 review item 2: a project URI read uses the grant of the folder where the agent works", () => {
  /** A project set up with a generic MCP client grant, as an agent's working folder. */
  function grantedHome(): string {
    const home = path.join(temp, "home");
    mkdirSync(home);
    const plan = prepareGenericMcpSetup({ clientLabel: "p4b-grants", storeRoot: store, executable: verifyMakeDocsExecutable({ executablePath: CLI_PATH }) });
    const connection = (plan.configuration as { mcpServers: { "make-docs": { env: Record<string, string> } } }).mcpServers["make-docs"].env;
    applyGenericMcpSetup(plan);
    const setup = runCliIn(home, ["setup", "--target", home, "--yes", "--no-codex", "--no-claude-code", "--no-skills", "--generic-mcp-client", "p4b-grants", "--json"]);
    expect(setup.status).toBe(0);
    vi.stubEnv(MCP_CONNECTION_ID_ENV, connection.MAKE_DOCS_MCP_CONNECTION_ID!);
    vi.stubEnv(MCP_CONNECTION_KEY_ENV, connection.MAKE_DOCS_MCP_CONNECTION_KEY!);
    return platform.describePath(home).canonicalPath;
  }

  it("MCP: a Store read grant in the working project allows another project's URI; tool and native reads agree", async () => {
    const home = grantedHome();
    const aurora = imported();
    workAdd(aurora, env(), { title: "Compare two printers", body: null, requestPath: null });
    const tool = (await callMakeDocsMcpTool("resource_read", { uri: "make-docs://project/aurora/tasks/", targetRoot: home })).result as { text: string; uri: string };
    expect(tool.text).toBe("# Quick items of aurora\n\n- task 1: Compare two printers [open]\n");
    const native = await readNativeMcpResource("make-docs://project/aurora/backlog/W1/R0/P1", home);
    expect(native.contents[0]).toMatchObject({ uri: "make-docs://project/aurora/backlog/W1/R0/P1/", mimeType: "text/markdown" });
    expect(native.contents[0]!.text).toContain("# W1 R0 P1: Phase 1: First");
  });

  it("MCP: a working folder that is not a project is refused clearly, without being told to set that folder up", async () => {
    grantedHome();
    imported();
    const plain = path.join(temp, "plain");
    mkdirSync(plain);
    const error = (await callMakeDocsMcpTool("resource_read", { uri: "make-docs://project/aurora/tasks/", targetRoot: plain }).catch((caught: unknown) => caught)) as StoreAccessStateError;
    expect(error.code).toBe("store-not-configured");
    expect(error.reason).toContain("is not a Make Docs project, so the agent has no Store read grant for project URIs");
    expect(error.nextAction).toContain("Start the agent in a Make Docs project whose harness access allows Store read");
    expect(error.message).not.toContain("make-docs setup");
  });

  it("MCP: a working project with no grant names the working folder's grant, not the URI's project", async () => {
    grantedHome();
    const aurora = imported();
    const error = (await callMakeDocsMcpTool("resource_read", { uri: "make-docs://project/aurora/tasks/", targetRoot: aurora }).catch((caught: unknown) => caught)) as StoreAccessStateError;
    expect(error.code).toBe("store-not-configured");
    expect(error.reason).toContain("A project URI read uses the harness grant of the folder where the agent works");
  });

  it("CLI: the direct CLI route reads a project URI from a folder that is not a project and from a granted project", () => {
    const home = grantedHome();
    const aurora = imported();
    workAdd(aurora, env(), { title: "Compare two printers", body: null, requestPath: null });
    const plain = path.join(temp, "plain");
    mkdirSync(plain);
    const fromPlain = runCliIn(plain, ["resource", "read", "make-docs://project/aurora/tasks/"]);
    const fromHome = runCliIn(home, ["resource", "read", "make-docs://project/aurora/tasks/"]);
    expect(fromPlain.status).toBe(0);
    expect(fromPlain.stdout).toBe("# Quick items of aurora\n\n- task 1: Compare two printers [open]\n");
    expect(fromHome.stdout).toBe(fromPlain.stdout);
  });
});

describe("W29 R0 P4 review item 3: the snapshot runs the harness check before it reads Store state", () => {
  it("a refused MCP caller gets the file facts and the typed refusal; with no Store database, the old file snapshot", async () => {
    const root = imported();
    const refused = await snapshot(root, store, { surface: "mcp", route: "mcp" });
    expect(refused.workStore).toMatchObject({ state: "refused", refusal: { code: "store-not-configured" } });
    const noStore = withBacklog(project("lonely", "", "lonely-project"));
    const absent = path.join(temp, "absent-store");
    const value = await snapshot(noStore, absent, { surface: "mcp", route: "mcp" });
    expect(withoutTime(value)).toEqual(withoutTime(buildBacklogSnapshot(noStore)));
    expect(existsSync(absent)).toBe(false);
  });
});

describe("W29 R0 P4 review item 4: a complete export also writes files whose repo copy a person removed", () => {
  it("writes the removed copy's file, names it, and the digest covers its units", () => {
    const root = imported();
    const p2 = path.join(root, ...P2.split("/"));
    rmSync(p2);
    workSync(root, env(), null);
    workSync(root, env(), { targetPath: P2, choice: "accept-deletion", expectedStoreRevision: null });
    expect(unitAt(root, "W1 R0 P2")).toMatchObject({ copyState: "removed", status: "closed", closeOutcome: "superseded" });
    const out = path.join(temp, "copies");
    const result = workExport(root, env(), { to: out, quick: null, paths: [] });
    expect(result.removedCopies).toEqual([P2]);
    expect(result.complete).toBe(true);
    expect(existsSync(path.join(out, ...P2.split("/")))).toBe(true);
    expect(existsSync(p2)).toBe(false);
    expect(result.summary).toContain(`Also wrote 1 work file whose repo copy a person removed, because the store still keeps their closed units: ${P2}.`);
  });
});

describe("W29 R0 P4 review item 5: an absent Store gives one next step", () => {
  it("work next names the same step in its reason and next action", async () => {
    const root = withBacklog(project());
    const absent = path.join(temp, "absent-store");
    const error = (await invokeOperation("work.queue.next", { targetRoot: root }, createExecutionContext({ surface: "cli", route: "direct-cli", storeRoot: absent })).catch((caught: unknown) => caught)) as StoreAccessStateError;
    expect(error.reason).toBe("This computer has no Make Docs Store, so the work store cannot be read. Nothing changed.");
    expect(error.nextAction).toBe(`Run make-docs setup to create the Store, then run this command again. ${WORK_FILES_NEXT_STEP}`);
    expect(error.message).not.toContain("Restore access");
  });
});
