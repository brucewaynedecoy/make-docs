import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { applyGenericMcpSetup, prepareGenericMcpSetup } from "../src/generic-mcp-setup";
import { verifyMakeDocsExecutable } from "../src/harness-access";
import { HARNESS_CALLER_IDENTITY_ENV } from "../src/harness-access/contract";
import { MCP_CONNECTION_ID_ENV, MCP_CONNECTION_KEY_ENV } from "../src/mcp-connection";
import { callMakeDocsMcpTool, listMakeDocsMcpTools } from "../src/mcp/tools";
import { STORE_WRITE_PROJECT_WRITE_ACCESS } from "../src/operations/access";
import { OperationWriteDeniedError, createExecutionContext } from "../src/operations/context";
import { StoreAccessStateError } from "../src/operations/store-access";
import { OperationError } from "../src/operations/types";
import { firstReasonLine } from "../src/operations/project/checkpoint-ops";
import { LIFECYCLE_CHECKPOINT_DIFFERENCE, PROJECT_CHECKPOINT_DIFFERENCE } from "../src/operations/leaf-help-table";
import { MCP_PROFILES } from "../src/operations/mcp-metadata";
import { assertOperationStoreAdmission, getOperation, invokeOperation, listOperationAccessFacts, listOperations } from "../src/operations/registry";
import { CHECKPOINT_EVENTS, checkpointEventRefusal, type WorkCheckpointResult } from "../src/operations/work/work-queue/checkpoint";
import { workClaim, type WorkQueueEnv } from "../src/operations/work/work-queue/queue";
import { WORK_STORE_CHECKPOINT, WORK_STORE_RULES, workRuleTwinProblems } from "../src/operations/work/work-store/catalog";
import type { WorkUnitRecord } from "../src/operations/work/work-store/schemas";
import { platform } from "../src/platform";
import { renderOperationGroupHelp } from "../src/run/cli";
import { resolveLeafHelp } from "../src/run/leaf-help";
import { renderProjectHelp, runProjectCommand } from "../src/run/root-operations";
import { getInstallationCheckoutId } from "../src/store/installation-state";
import { listSyncLedger, listWorkClaims, listWorkUnits, putWorkUnit, readWorkStore, writeWorkStore } from "../src/store/work-store";
import { WORK_CHECKPOINT_SCENARIOS, WORK_STORE_CONTRACT_FIXTURES, type CheckpointScenarioFixture, type WorkCheckpointScenario } from "./fixtures/work-store-contract";
import { cleanupTempDir, createTempDir } from "./helpers";

/**
 * W35 R0 P1: the project checkpoint on its surfaces (PRD 39 R-CHECKPOINT-CMD,
 * PRD 52 R-WORK-CHECKPOINT, PRD 25 R-ACCESS-17 and R-MCP-PROFILE-12): the
 * registry operation, the CLI command, the MCP tool, the two help texts, the
 * `step` Store admission, and the twin rule IDs. No test reaches the real
 * Store: `MAKE_DOCS_HOME` points at a temporary folder at a fixed, checked
 * path. No test writes this repository's files.
 */

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "..", "..", "..");
const CLI = path.resolve(HERE, "../dist/index.js");
const NOW = new Date("2042-06-15T12:00:00.000Z");
const PROJECT_ID = "aurora-w35-surfaces";
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
  temp = platform.describePath(createTempDir("make-docs-w35-p1-surfaces-")).canonicalPath;
  roots.push(temp);
  store = path.join(temp, "store");
  vi.stubEnv("MAKE_DOCS_HOME", store);
  // No caller identity: the CLI route is the direct route of a person's terminal.
  vi.stubEnv(HARNESS_CALLER_IDENTITY_ENV, "");
  // An empty value means the real Store, so the run stops when the value is empty.
  expect(process.env.MAKE_DOCS_HOME).toBe(store);
  expect(store.startsWith(temp)).toBe(true);
  process.exitCode = 0;
});

afterEach(() => {
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

function project(name = "aurora"): string {
  const root = path.join(temp, name);
  mkdirSync(path.join(root, ".make-docs"), { recursive: true });
  writeFileSync(path.join(root, ".make-docs/config.yaml"), `projectId: ${PROJECT_ID}\nprojectName: ${name}\n`);
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

/** Every file under a folder, with a digest of its bytes. */
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

/** The store records that sync changes: units, claims, and the sync ledger of the checkout. */
function storeState(root: string, projectId = PROJECT_ID): string {
  const checkoutId = getInstallationCheckoutId(root, store);
  return JSON.stringify(readWorkStore(root, (db) => ({
    units: listWorkUnits(db, projectId),
    claims: listWorkClaims(db, projectId),
    ledger: listSyncLedger(db, checkoutId),
  }), { storeRoot: store }));
}

async function captureStdout(run: () => Promise<void>): Promise<string> {
  const chunks: string[] = [];
  const spy = vi.spyOn(process.stdout, "write").mockImplementation((chunk: unknown) => {
    chunks.push(String(chunk));
    return true;
  });
  try {
    await run();
  } finally {
    spy.mockRestore();
  }
  return chunks.join("");
}

/** `make-docs project checkpoint` in this process, on the direct route of a person's terminal. */
async function cli(root: string, args: string[] = []): Promise<string> {
  return await captureStdout(() => runProjectCommand(["checkpoint", "--target-root", root, ...args]));
}

async function cliJson(root: string, args: string[] = []): Promise<WorkCheckpointResult> {
  return JSON.parse(await cli(root, [...args, "--json"])) as WorkCheckpointResult;
}

/** The registry operation with a test context: no harness check, and the real Store session. */
async function operation(root: string, input: Record<string, unknown> = {}, context: { writesAllowed?: boolean; dryRun?: boolean } = {}): Promise<WorkCheckpointResult> {
  const result = await invokeOperation("project.checkpoint.run", { targetRoot: root, ...input }, createExecutionContext({
    surface: "test", writesAllowed: context.writesAllowed ?? true, dryRun: context.dryRun ?? false, storeRoot: store,
  }));
  return result.value as unknown as WorkCheckpointResult;
}

describe("W35 R0 P1 step Store admission (PRD 25 R-ACCESS-17)", () => {
  const step = { id: "fixture.step.run", mutates: "write", access: STORE_WRITE_PROJECT_WRITE_ACCESS, storeAdmission: "step" } as const;

  it("is declared by the project checkpoint only", () => {
    expect(listOperations().filter((entry) => entry.storeAdmission === "step").map((entry) => entry.id)).toEqual(["project.checkpoint.run"]);
    expect(listOperationAccessFacts().find((fact) => fact.operation === "project.checkpoint.run")).toMatchObject({
      storeAdmission: "step", access: { store: "write", project: "write", hostConfig: "none" }, mcpReady: true,
    });
    expect(getOperation("project.checkpoint.run").mutates).toBe("write");
  });

  it("admits only a write operation that declares its full write access", () => {
    expect(() => assertOperationStoreAdmission(step)).not.toThrow();
    for (const broken of [
      { ...step, mutates: "read" as const, access: { store: "read" as const, project: "read" as const, hostConfig: "none" as const } },
      { ...step, access: { store: "read" as const, project: "write" as const, hostConfig: "none" as const } },
      { ...step, access: { store: "write" as const, project: "none" as const, hostConfig: "none" as const } },
      { ...step, access: { store: "write" as const, project: "write" as const, hostConfig: "write" as const } },
    ]) {
      expect(() => assertOperationStoreAdmission(broken)).toThrow("Step Store admission requires a write operation");
    }
    // The other admission kinds keep their rules.
    expect(() => assertOperationStoreAdmission({ ...step, storeAdmission: "optional" })).toThrow("Optional Store admission requires a read-only operation");
    expect(() => assertOperationStoreAdmission({ ...step, storeAdmission: "skip" as never })).toThrow("unknown Store admission");
  });

  it("the registry still refuses every other write operation without the write permission", async () => {
    const root = bound();
    const context = createExecutionContext({ surface: "test", writesAllowed: false, storeRoot: store, cwd: root });
    const refused: string[] = [];
    for (const entry of listOperations()) {
      if (entry.mutates !== "write" || entry.status !== "active" || entry.storeAdmission === "step") continue;
      await expect(invokeOperation(entry.id, { targetRoot: root }, context), entry.id).rejects.toBeInstanceOf(OperationWriteDeniedError);
      refused.push(entry.id);
    }
    expect(refused).toContain("work.queue.sync");
    expect(refused.length).toBeGreaterThan(20);
  });

  it("no other Store write operation answers a caller with no proved identity, and the checkpoint answers", async () => {
    const root = bound();
    await operation(root);
    const before = storeState(root);
    write(root, P1, P1_TEXT.replace("Build the parser.", "Build the new parser."));
    // An agent route with no harness identity has no Store access at all.
    const context = (approvals: string[] = []) => createExecutionContext({ surface: "cli", route: "native-rule", writesAllowed: true, storeRoot: store, cwd: root, approvals });
    await expect(invokeOperation("work.queue.sync", { targetRoot: root }, context())).rejects.toMatchObject({ code: "store-not-configured" });
    // Every other active Store write operation of the registry, with one plain input. No call returns a
    // result. The caller check refuses each operation that accepts this input, with its typed Store result.
    // The input schema check refuses each other operation earlier, so this loop does not reach the caller
    // check for those. The test "skips exactly three checks" proves from the source that only a `step`
    // operation skips the caller check.
    const byCallerCheck: string[] = [];
    const byInput: string[] = [];
    for (const entry of listOperations()) {
      if (entry.mutates !== "write" || entry.status !== "active" || entry.access.store === "none" || entry.storeAdmission === "step") continue;
      const approvals = [...(getOperation(entry.id).requiredApprovals ?? [])];
      const error: unknown = await invokeOperation(entry.id, { targetRoot: root }, context(approvals)).then(
        (value) => { throw new Error(`${entry.id} returned a result: ${JSON.stringify(value).slice(0, 200)}`); },
        (caught: unknown) => caught,
      );
      if (error instanceof StoreAccessStateError) byCallerCheck.push(entry.id);
      else {
        expect(error, entry.id).toBeInstanceOf(OperationError);
        expect((error as Error).message, entry.id).toContain("Invalid input for operation");
        byInput.push(entry.id);
      }
    }
    expect(byCallerCheck).toContain("work.queue.sync");
    expect(byCallerCheck.length).toBeGreaterThan(0);
    expect(byInput.length).toBeGreaterThan(0);
    expect(byCallerCheck.length + byInput.length).toBe(listOperations().filter((entry) => entry.mutates === "write" && entry.status === "active" && entry.access.store !== "none").length - 1);
    expect(storeState(root)).toBe(before);
    const result = (await invokeOperation("project.checkpoint.run", { targetRoot: root }, context())).value as unknown as WorkCheckpointResult;
    expect(result.authority).toBe("files");
    expect(result.storeState).toBe("denied");
    expect([result.syncRan, result.syncSkipped]).toEqual([false, "files-authority"]);
    // The first line gives the meaning, and the second line is the next step of a direct run.
    expect(result.lines).toHaveLength(2);
    expect(result.lines[0]).toContain("The docs/work/ files are the authority, because this caller may not use the Store");
    expect(result.lines[1]).toBe(result.nextAction);
    expect(storeState(root)).toBe(before);
  });

  it.each([["cli"], ["mcp"]] as const)("the registry keeps the route guard for the checkpoint on the %s surface", async (surface) => {
    const root = bound();
    await operation(root);
    write(root, P1, P1_TEXT.replace("Build the parser.", "Build the new parser."));
    const files = fileHashes(root);
    const before = storeState(root);
    // A production surface with no explicit route. The default route is `test`.
    const context = () => createExecutionContext({ surface, writesAllowed: true, storeRoot: store, cwd: root });
    expect(context().route).toBe("test");
    const refusal = "A production Store operation needs an explicit route.";
    await expect(invokeOperation("work.queue.sync", { targetRoot: root }, context())).rejects.toThrow(refusal);
    await expect(invokeOperation("project.checkpoint.run", { targetRoot: root }, context())).rejects.toThrow(refusal);
    await expect(invokeOperation("project.checkpoint.run", { targetRoot: root, event: "commit" }, context())).rejects.toThrow(refusal);
    // The guard also holds without the write permission, and in a folder that is not a Make Docs project.
    await expect(invokeOperation("project.checkpoint.run", { targetRoot: root }, createExecutionContext({ surface, writesAllowed: false, storeRoot: store, cwd: root }))).rejects.toThrow(refusal);
    await expect(invokeOperation("project.checkpoint.run", { targetRoot: temp }, context())).rejects.toThrow(refusal);
    expect(storeState(root)).toBe(before);
    expect(fileHashes(root)).toEqual(files);
  });

  it("the registry skips exactly three checks for a step operation, and runs each other check before the handler", async () => {
    // The source of invokeOperation: each skip is one call of checksWriteAtStep. This test fails on a fourth
    // call of the helper, on a new line in invokeOperation that reads `storeAdmission` or names "step", and on a
    // change of the helper. It does not catch a skip that is written with none of these words, such as a check
    // of the operation ID.
    const source = readFileSync(path.join(HERE, "../src/operations/registry.ts"), "utf8");
    const body = source.slice(source.indexOf("export async function invokeOperation("), source.indexOf("/** Map a Store failure to its typed"));
    // The helper is the one place that names the `step` kind for invokeOperation, and it has four uses: its declaration and the three skips.
    expect(source).toContain('function checksWriteAtStep(definition: Pick<OperationDefinition, "storeAdmission">): boolean {\n  return definition.storeAdmission === "step";\n}');
    expect(source.split("checksWriteAtStep(")).toHaveLength(5);
    // invokeOperation reads the admission kind directly in two lines only: the route guard and the Store session.
    expect(body.split("\n").filter((line) => !line.trim().startsWith("//") && /storeAdmission|["'`]step["'`]/.test(line)).map((line) => line.trim())).toEqual([
      'definition.access.store !== "none" && definition.storeAdmission !== "optional"',
      'value = definition.access.store === "none" || definition.storeAdmission === "optional" || definition.storeAdmission === "handler" || checksWriteAtStep(definition)',
    ]);
    const skips = body.split("\n").filter((line) => line.includes("checksWriteAtStep(definition)")).map((line) => line.trim());
    expect(skips).toEqual([
      // 1. The refusal when the surface did not allow writes.
      'if (definition.mutates === "write" && !context.writesAllowed && !checksWriteAtStep(definition)) {',
      // 2. The caller check against the declared access.
      "if (!checksWriteAtStep(definition)) {",
      // 3. The outer Store session.
      'value = definition.access.store === "none" || definition.storeAdmission === "optional" || definition.storeAdmission === "handler" || checksWriteAtStep(definition)',
    ]);
    // The second skip sits after the route guard, and covers only the caller check.
    const guard = body.indexOf('throw new OperationError("A production Store operation needs an explicit route.")');
    const callerSkip = body.indexOf("if (!checksWriteAtStep(definition)) {");
    expect(guard).toBeGreaterThan(0);
    expect(callerSkip).toBeGreaterThan(guard);
    expect(body.slice(callerSkip, body.indexOf("const run = async"))).toContain("assertHarnessOperationAllowed({");
    // The checks that stay, in their order before the handler.
    const order = ["assertOperationStoreAdmission(definition)", "OperationPendingError(", "OperationApprovalRequiredError(", "definition.inputSchema.safeParse(", "definition.resolveTarget(", "needs an explicit route", "handler(parsed.data, context)"].map((mark) => body.indexOf(mark));
    expect(order.every((position) => position > 0)).toBe(true);
    expect([...order].sort((left, right) => left - right)).toEqual(order);
    // The checkpoint still gets the input schema check, and a Store failure still gets its typed result.
    const root = bound();
    await expect(operation(root, { event: "push" })).rejects.toThrow(checkpointEventRefusal("push"));
    await expect(operation(root, { settle: "x" })).rejects.toThrow("Invalid input for operation");
    expect(getOperation("project.checkpoint.run").requiredApprovals ?? []).toEqual([]);
    expect(getOperation("project.checkpoint.run").resolveTarget).toBeUndefined();
  });

  it("without the write permission the checkpoint does the read steps and changes nothing", async () => {
    const root = bound();
    await operation(root);
    write(root, P1, P1_TEXT.replace("Build the parser.", "Build the new parser."));
    const files = fileHashes(root);
    const before = storeState(root);
    const result = await operation(root, {}, { writesAllowed: false });
    expect([result.syncRan, result.syncSkipped, result.nothingDue]).toEqual([false, "read-access-only", false]);
    expect(result.waiting).toEqual([{ path: P1, waitsFor: "import" }]);
    expect(result.lines[0]).toBe("Checkpoint: 1 file waits.");
    expect(result.summary).toContain("The sync waits: 1 file waits. This caller has read access only, so a caller with write access must run make-docs project checkpoint.");
    expect(result.readyCount).toBe(2);
    expect(storeState(root)).toBe(before);
    expect(fileHashes(root)).toEqual(files);
    // A dry run is also a read, and it says so.
    const dry = await operation(root, {}, { dryRun: true });
    expect([dry.syncRan, dry.syncSkipped]).toEqual([false, "dry-run"]);
    expect(dry.summary).toContain("Dry run: the sync did not run, and nothing changed. 1 file waits.");
    expect(storeState(root)).toBe(before);
    // With the write permission the same call syncs.
    expect((await operation(root)).imported).toEqual([P1]);
  });
});

describe("W35 R0 P1 make-docs project checkpoint (T6 to T10, A3 to A9)", () => {
  it("a direct run starts with the summary line, names the checkout, and says when it was the first sync", async () => {
    const root = bound();
    const plain = await cli(root);
    const lines = plain.split("\n");
    expect(lines[0]).toBe("Checkpoint: 3 files imported.");
    expect(lines[1]).toBe(`Checkout: ${root}. This run was the first sync of this checkout. A first sync only imports: it imported 3 files and wrote and removed no file.`);
    expect(plain).toContain("Ready work (2). Next:");
    expect(plain).toMatch(/Claim the first one: make-docs work claim W1 R0 P1 --claimant <name> --expected-version \d+\n$/);
    expect(process.exitCode ?? 0).toBe(0);
  });

  it("a second run right after the first changes no store record and no file, and says that nothing is due", async () => {
    const root = bound();
    await cli(root);
    const files = fileHashes(root);
    const state = storeState(root);
    const second = await cliJson(root);
    expect(second.lines[0]).toBe("Checkpoint: nothing is due. The work files and the work store match.");
    expect([second.run, second.event, second.nothingDue, second.syncRan, second.firstSync, second.quiet]).toEqual(["direct", null, true, true, false, false]);
    expect(second.checkout).toEqual({ root, checkoutId: getInstallationCheckoutId(root, store) });
    expect(await cli(root)).toBe(`${second.summary}\n`);
    expect(fileHashes(root)).toEqual(files);
    expect(storeState(root)).toBe(state);
  });

  it("gives the same result on the CLI and through the registry, for a direct run and each event name", async () => {
    const root = bound();
    await cli(root);
    for (const event of [null, ...CHECKPOINT_EVENTS]) {
      const args = event === null ? [] : ["--event", event];
      const fromCli = await cliJson(root, args);
      const fromRegistry = await operation(root, event === null ? {} : { event });
      expect(fromCli, String(event)).toEqual(fromRegistry);
      expect(fromCli.run).toBe(event === null ? "direct" : "trigger");
      expect(fromCli.event).toBe(event);
      // Plain output is the summary. A trigger run with nothing due prints nothing.
      expect(await cli(root, args), String(event)).toBe(event === null ? `${fromCli.summary}\n` : "");
      expect(fromCli.quiet).toBe(event !== null);
    }
  });

  it("a trigger run leaves every project file byte-identical, also when the store holds a record that a direct run would write", async () => {
    const root = bound();
    await cli(root);
    write(root, P1, P1_TEXT.replace("Build the parser.", "Build the new parser."));
    storeChange(root, "W1 R0 P2 T1", { status: "closed", closeOutcome: "done" });
    const files = fileHashes(root);
    const result = await cliJson(root, ["--event", "commit"]);
    expect(result.imported).toEqual([P1]);
    expect([result.written, result.removed]).toEqual([[], []]);
    expect(result.waiting).toEqual([{ path: P2, waitsFor: "write" }]);
    expect(result.lines[0]).toBe("Checkpoint: 1 file imported, 1 file waits.");
    expect(result.summary).toContain("A hook started this run, so it wrote and removed no project file. Run make-docs project checkpoint to apply what waits.");
    expect(result.quiet).toBe(false);
    expect(fileHashes(root)).toEqual(files);
    // It prints when something is due.
    const again = await cli(root, ["--event", "turn-end"]);
    expect(again.split("\n")[0]).toBe("Checkpoint: 1 file waits.");
    expect(fileHashes(root)).toEqual(files);
    // The direct run then writes the file.
    expect((await cliJson(root)).written).toEqual([P2]);
    expect(readFileSync(path.join(root, P2), "utf8")).toContain("- [x] T1: Ship it.");
  });

  it("--event branch-change leaves the store unchanged and says how many files wait", async () => {
    const root = bound();
    await cli(root);
    write(root, P1, P1_TEXT.replace("Build the parser.", "Build the new parser."));
    const files = fileHashes(root);
    const before = storeState(root);
    const result = await cliJson(root, ["--event", "branch-change"]);
    expect([result.syncRan, result.syncSkipped]).toEqual([false, "branch-change"]);
    expect(result.waiting).toEqual([{ path: P1, waitsFor: "import" }]);
    expect(result.summary).toContain("The branch changed, so this run imported nothing: 1 file waits. Run make-docs project checkpoint to sync.");
    expect(storeState(root)).toBe(before);
    expect(fileHashes(root)).toEqual(files);
  });

  it("reports a conflict with one settle command for each choice, and never settles it", async () => {
    const root = bound();
    await cli(root);
    write(root, P2, P2_TEXT.replace("Ship it.", "Ship it today."));
    storeChange(root, "W1 R0 P2 T1", { status: "closed", closeOutcome: "done" });
    const plain = await cli(root);
    expect(plain.split("\n")[0]).toBe("Checkpoint: 1 conflict waits for a person.");
    expect(plain).toContain(`Conflict in ${P2} (both-changed):`);
    expect(plain).toContain(`Run: make-docs work sync --settle ${P2} --keep-file`);
    expect(plain).toContain(`Run: make-docs work sync --settle ${P2} --keep-store`);
    const again = await cliJson(root);
    expect(again.conflicts.map((entry) => entry.path)).toEqual([P2]);
    expect(readFileSync(path.join(root, P2), "utf8")).toContain("Ship it today.");
    expect(units(root).find((unit) => unit.coordinate === "W1 R0 P2 T1")!.status).toBe("closed");
  });

  it("lists a claim that ended and shows no claim ID", async () => {
    const root = bound();
    await cli(root);
    // The claim started 40 minutes ago and lasted 20 minutes, so it ended.
    const then = new Date(Date.now() - 40 * 60 * 1000);
    const unit = units(root).find((entry) => entry.coordinate === "W1 R0 P1 T1")!;
    const claim = workClaim(root, env(then), { unit: "W1 R0 P1 T1", claimant: "builder-a", taskHandle: "task-a", ttlSeconds: 1200, expectedVersion: unit.revision, claimId: null, takeover: null });
    expect(claim.claimId).toMatch(/^wc-/);
    const result = await cliJson(root);
    expect(result.claims.map((entry) => [entry.unit, entry.claimant, entry.state])).toEqual([["W1 R0 P1 T1", "builder-a", "ended"]]);
    const plain = await cli(root);
    expect(plain).toContain("Claim ended: W1 R0 P1 T1, claimed by builder-a");
    expect(plain).toContain("make-docs work release W1 R0 P1 T1 --handle <stopped|finished|not-found> --expected-version");
    expect(plain).not.toContain(claim.claimId!);
    expect(JSON.stringify(result)).not.toContain(claim.claimId!);
    expect(JSON.stringify(result)).not.toMatch(/wc-[a-z0-9]{8,}/);
    // A claim that ended is not "due".
    expect(result.nothingDue).toBe(true);
    expect(await cli(root, ["--event", "session-start"])).toBe("");
  });

  it("with no usable Store it says that the docs/work/ files are the authority, exits 0, and creates no Store", async () => {
    const root = project();
    write(root, P1, P1_TEXT);
    const files = fileHashes(root);
    const plain = await cli(root);
    const result = await cliJson(root);
    // The first line gives the meaning. The second line of a direct run names the next command (A14).
    expect(plain).toBe(`The docs/work/ files are the authority, because this computer has no Make Docs Store. The checkpoint synced nothing.\n${result.nextAction}\n`);
    expect(plain.split("\n")[1]).toContain("Run make-docs setup to create the Store.");
    expect([result.authority, result.storeState, result.syncRan, result.syncSkipped]).toEqual(["files", "not-configured", false, "files-authority"]);
    expect(result.nextAction).toContain("make-docs setup");
    expect(result).toEqual(await operation(root));
    // A trigger run is quiet.
    expect(await cli(root, ["--event", "commit"])).toBe("");
    expect(process.exitCode ?? 0).toBe(0);
    expect(existsSync(store)).toBe(false);
    expect(fileHashes(root)).toEqual(files);
  });

  it("with a broken project config a direct run gives the first line of the problem and the next step, exits 0, and a trigger run prints nothing", async () => {
    const root = bound();
    await cli(root);
    writeFileSync(path.join(root, ".make-docs/config.yaml"), `projectId: ${PROJECT_ID}\nprojectName: 5\nharnessIntegrations: nope\n`);
    const before = storeState(root);
    const plain = await cli(root);
    const lines = plain.trimEnd().split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toMatch(/^The docs\/work\/ files are the authority, because this caller may not use the Store: Invalid make-docs config: .+config\.yaml \(\d+ more lines? not shown\)\. The checkpoint synced nothing\.$/);
    expect(lines[1]).toContain("make-docs setup --target");
    expect(process.exitCode ?? 0).toBe(0);
    expect(await cli(root, ["--event", "commit"])).toBe("");
    expect(process.exitCode ?? 0).toBe(0);
    expect(storeState(root)).toBe(before);
    // A reason of one line stays as it is.
    expect(firstReasonLine("One line.")).toBe("One line.");
    expect(firstReasonLine("Head:\n- a\n- b")).toBe("Head (2 more lines not shown).");
    expect(firstReasonLine("Head.\n- a")).toBe("Head (1 more line not shown).");
  });

  it("in a folder that is not a Make Docs project it says so, exits 0, and creates no Store, on the CLI and the MCP tool", async () => {
    const root = path.join(temp, "plain");
    mkdirSync(root, { recursive: true });
    const plain = await cli(root);
    expect(plain).toBe(`${root} is not a Make Docs project, so the checkpoint did nothing.\n`);
    const fromCli = await cliJson(root);
    expect([fromCli.authority, fromCli.syncRan, fromCli.syncSkipped]).toEqual(["not-a-project", false, "not-a-project"]);
    for (const profile of ["backlog", "workflow", "all"] as const) {
      const fromMcp = await callMakeDocsMcpTool("project_checkpoint", { targetRoot: root }, { profile });
      expect(fromMcp.operation).toBe("project.checkpoint.run");
      expect(fromMcp.result, profile).toEqual(fromCli);
    }
    expect(await cli(root, ["--event", "commit"])).toBe("");
    expect((await callMakeDocsMcpTool("project_checkpoint", { targetRoot: root, event: "commit" }, { profile: "all" })).result).toMatchObject({ quiet: true, run: "trigger", event: "commit" });
    expect(process.exitCode ?? 0).toBe(0);
    expect(existsSync(store)).toBe(false);
    expect(readdirSync(root)).toEqual([]);
  });

  it("refuses any other event name with the list, in the same words on the CLI and the MCP tool", async () => {
    const root = bound();
    const refusal = checkpointEventRefusal("push");
    expect(refusal).toContain("session-start, files-changed, turn-end, commit, branch-change, phase-closed");
    await expect(runProjectCommand(["checkpoint", "--target-root", root, "--event", "push"])).rejects.toThrow(refusal);
    await expect(callMakeDocsMcpTool("project_checkpoint", { targetRoot: root, event: "push" }, { profile: "all" })).rejects.toThrow(refusal);
    await expect(runProjectCommand(["checkpoint", "--event"])).rejects.toThrow("--event requires an event name.");
    await expect(runProjectCommand(["checkpoint", "--settle", "x"])).rejects.toThrow("Unexpected project checkpoint option: --settle.");
    await expect(runProjectCommand(["checkpoint", "--json", "--json"])).rejects.toThrow("Option --json can be given only once.");
    // A refused input changed nothing: the checkout has not synced yet.
    expect(units(root)).toEqual([]);
  });
});

describe("W35 R0 P1 the MCP tool and the help texts (T11, A10)", () => {
  it("project_checkpoint has 18 characters and is in the backlog, workflow, and all profiles only", () => {
    expect(WORK_STORE_CHECKPOINT).toEqual({ id: "project.checkpoint.run", cli: "make-docs project checkpoint", mcp: "project_checkpoint", writes: true });
    expect("project_checkpoint").toHaveLength(18);
    const holds = (profile: (typeof MCP_PROFILES)[number] | "all") => listMakeDocsMcpTools(temp, { profile }).some((tool) => tool.name === "project_checkpoint");
    expect(MCP_PROFILES.filter((profile) => holds(profile))).toEqual(["workflow", "backlog"]);
    expect(holds("all")).toBe(true);
    // PRD 25 R-MCP-PROFILE-12 names the same profiles as the code.
    const prd25 = readFileSync(path.join(REPO, "docs/prd/25-typescript-runtime-cli-mcp-operation-boundaries.md"), "utf8");
    const line = prd25.split("\n").find((entry) => entry.startsWith("- R-MCP-PROFILE-12 (MUST)"))!;
    expect(line).toContain("`project_checkpoint` belongs to `backlog`, `workflow`, and `all`");
    expect([...getOperation("project.checkpoint.run").mcp!.profiles].sort()).toEqual(["backlog", "workflow"]);
  });

  it("the tool takes event, targetRoot, and allowWrite, and its description says what a call without write access gets", () => {
    const tool = listMakeDocsMcpTools(temp, { profile: "all" }).find((entry) => entry.name === "project_checkpoint")!;
    expect(Object.keys(tool.inputSchema).sort()).toEqual(["allowWrite", "approvals", "dryRun", "event", "targetRoot"]);
    expect(tool.description).toContain("Access: Store write; project write; host configuration none.");
    expect(tool.description).toContain("Without them the tool still answers: it does its read steps, changes nothing, and says that the write step did not run.");
    expect(tool.description).not.toContain("requires allowWrite=true, enforced by the operation core");
    expect(tool.description).toContain("This is not lifecycle_checkpoint");
    // Every other write tool keeps the refusal sentence.
    const sync = listMakeDocsMcpTools(temp, { profile: "all" }).find((entry) => entry.name === "work_sync")!;
    expect(sync.description).toContain("Mutating operation: requires allowWrite=true, enforced by the operation core.");
  });

  it("the help of each checkpoint command names the other command and says in one sentence how the two differ", () => {
    const project = resolveLeafHelp(["project", "checkpoint", "--help"])!;
    expect(project).toContain("make-docs project checkpoint [--event <name>] [--target-root <path>] [--json]");
    expect(project).toContain(PROJECT_CHECKPOINT_DIFFERENCE);
    expect(PROJECT_CHECKPOINT_DIFFERENCE).toContain("make-docs lifecycle checkpoint");
    expect(PROJECT_CHECKPOINT_DIFFERENCE.match(/\./g)).toHaveLength(1);
    for (const event of CHECKPOINT_EVENTS) expect(project).toContain(event);
    expect(project).toContain("--event <name>");
    const lifecycle = resolveLeafHelp(["lifecycle", "checkpoint", "--help"])!;
    expect(lifecycle).toContain(LIFECYCLE_CHECKPOINT_DIFFERENCE);
    expect(LIFECYCLE_CHECKPOINT_DIFFERENCE).toContain("make-docs project checkpoint");
    expect(LIFECYCLE_CHECKPOINT_DIFFERENCE.match(/\./g)).toHaveLength(1);
    expect(resolveLeafHelp(["project", "checkpoint", "-h"])).toBe(project);
  });

  it("the project group help lists the checkpoint first, as a write command", () => {
    const help = renderProjectHelp();
    expect(help).toContain("  make-docs project checkpoint [write]\n");
    expect(help.indexOf("make-docs project checkpoint")).toBeLessThan(help.indexOf("make-docs project list"));
    expect(renderOperationGroupHelp("lifecycle")).toContain("  make-docs lifecycle checkpoint [write]\n");
  });
});

describe("W35 R0 P1 checkpoint rule IDs in both forms (T13, A11, A12)", () => {
  const TEMPLATE = readFileSync(path.join(REPO, "packages/docs/template/.make-docs/system/references/work-store.md"), "utf8");
  const CHECKPOINT_RULES = WORK_STORE_RULES.filter((rule) => rule.area === "checkpoint");

  it("the checkpoint rules are WORK-RULE-055 to WORK-RULE-065, and each names the checkpoint operation", () => {
    expect(CHECKPOINT_RULES.map((rule) => rule.id)).toEqual(Array.from({ length: 11 }, (_, index) => `WORK-RULE-${String(55 + index).padStart(3, "0")}`));
    for (const rule of CHECKPOINT_RULES) {
      expect(rule.cliForm, rule.id).toEqual(["project.checkpoint.run"]);
      expect(rule.agentForm, rule.id).toBe("make-docs://system/reference/work-store.md#checkpoint");
      expect(rule.prdRequirements.some((requirement) => requirement.startsWith("R-WORK-CHECKPOINT-")), rule.id).toBe(true);
    }
  });

  it("the catalog and the agent form name the same rule IDs", () => {
    expect(workRuleTwinProblems(WORK_STORE_RULES, TEMPLATE)).toEqual([]);
    const section = TEMPLATE.split(/^## Checkpoint$/m)[1]!.split(/^## /m)[0]!;
    for (const rule of CHECKPOINT_RULES) expect(section, rule.id).toContain(`(${rule.id})`);
    expect(section).toContain("there is nothing to sync");
    expect(section).toContain("`make-docs lifecycle checkpoint`");
    expect(TEMPLATE).toContain("| `make-docs project checkpoint` | `project_checkpoint` |");
  });

  it("fails when a checkpoint rule ID is in the catalog only", () => {
    const extra = { id: "WORK-RULE-999" as const, agentForm: "make-docs://system/reference/work-store.md#checkpoint" as const };
    expect(workRuleTwinProblems([...WORK_STORE_RULES, extra], TEMPLATE)).toEqual(["WORK-RULE-999 is in the catalog and not in the agent form."]);
    // The same failure for a rule that the text lost.
    expect(workRuleTwinProblems(WORK_STORE_RULES, TEMPLATE.replace(" (WORK-RULE-060)", ""))).toEqual(["WORK-RULE-060 is in the catalog and not in the agent form."]);
  });

  it("fails when a checkpoint rule ID is in the reference only", () => {
    const added = TEMPLATE.replace("(WORK-RULE-065)", "(WORK-RULE-065)\n- A rule that the catalog does not have. (WORK-RULE-999)");
    expect(added).not.toBe(TEMPLATE);
    expect(workRuleTwinProblems(WORK_STORE_RULES, added)).toEqual(["WORK-RULE-999 is in the agent form and not in the catalog."]);
    expect(workRuleTwinProblems(WORK_STORE_RULES.filter((rule) => rule.id !== "WORK-RULE-058"), TEMPLATE)).toEqual(["WORK-RULE-058 is in the agent form and not in the catalog."]);
  });

  it("fails when a checkpoint rule sits outside the Checkpoint section", () => {
    const moved = TEMPLATE.replace(" (WORK-RULE-060)", "").replace("(WORK-RULE-001)", "(WORK-RULE-001) (WORK-RULE-060)");
    expect(workRuleTwinProblems(WORK_STORE_RULES, moved)).toEqual(['WORK-RULE-060 is not in the agent form section "checkpoint".']);
  });

  it("the template reference and the installed reference are byte-identical", () => {
    const installed = readFileSync(path.join(REPO, ".make-docs/system/references/work-store.md"));
    expect(installed.equals(Buffer.from(TEMPLATE))).toBe(true);
  });
});

describe("W35 R0 P1 checkpoint parity fixtures run through the real checkpoint (WORK-RULE-055 to WORK-RULE-065)", () => {
  const fixtures = WORK_STORE_CONTRACT_FIXTURES.filter((fixture): fixture is CheckpointScenarioFixture => fixture.kind === "checkpoint-scenario");

  /** Set up one scenario and run the checkpoint once. */
  async function runScenario(scenario: WorkCheckpointScenario): Promise<{ root: string; result: WorkCheckpointResult; before: Record<string, string> }> {
    if (scenario === "not-a-project") {
      const root = path.join(temp, "plain");
      mkdirSync(root, { recursive: true });
      return { root, before: fileHashes(root), result: await operation(root) };
    }
    if (scenario === "no-store") {
      const root = project();
      write(root, P1, P1_TEXT);
      return { root, before: fileHashes(root), result: await operation(root) };
    }
    const root = bound();
    if (scenario === "first-direct-run") return { root, before: fileHashes(root), result: await operation(root) };
    await operation(root);
    const changeFile = () => write(root, P1, P1_TEXT.replace("Build the parser.", "Build the new parser."));
    const changeStore = () => storeChange(root, "W1 R0 P2 T1", { status: "closed", closeOutcome: "done" });
    let input: Record<string, unknown> = {};
    let context: { writesAllowed?: boolean } = {};
    switch (scenario) {
      case "repeat-direct-run": break;
      case "direct-run-both-ways": changeFile(); changeStore(); break;
      case "trigger-run-imports-only": changeFile(); changeStore(); input = { event: "commit" }; break;
      case "trigger-run-nothing-due": input = { event: "turn-end" }; break;
      case "branch-change": changeFile(); input = { event: "branch-change" }; break;
      case "conflict": write(root, P2, P2_TEXT.replace("Ship it.", "Ship it today.")); changeStore(); break;
      case "claim-ended": {
        const unit = units(root).find((entry) => entry.coordinate === "W1 R0 P1 T1")!;
        workClaim(root, env(new Date(Date.now() - 40 * 60 * 1000)), { unit: "W1 R0 P1 T1", claimant: "builder-a", taskHandle: "task-a", ttlSeconds: 1200, expectedVersion: unit.revision, claimId: null, takeover: null });
        break;
      }
      case "read-access-only": changeFile(); context = { writesAllowed: false }; break;
    }
    const before = fileHashes(root);
    return { root, before, result: await operation(root, input, context) };
  }

  it("has one fixture for each scenario, and each checkpoint rule has a fixture", () => {
    expect(fixtures.map((fixture) => fixture.input.scenario).sort()).toEqual([...WORK_CHECKPOINT_SCENARIOS].sort());
    const covered = new Set(fixtures.flatMap((fixture) => fixture.rules));
    for (const rule of WORK_STORE_RULES.filter((entry) => entry.area === "checkpoint")) expect(covered.has(rule.id), rule.id).toBe(true);
  });

  it.each(fixtures.map((fixture) => [fixture.id, fixture.title, fixture] as const))("%s: %s", async (_id, _title, fixture) => {
    const { root, result, before } = await runScenario(fixture.input.scenario);
    expect({
      authority: result.authority,
      syncRan: result.syncRan,
      syncSkipped: result.syncSkipped,
      nothingDue: result.nothingDue,
      quiet: result.quiet,
      firstSync: result.firstSync,
      imported: result.imported.length,
      written: result.written.length,
      waiting: result.waiting.length,
      conflicts: result.conflicts.length,
      claims: result.claims.map((claim) => claim.state),
      next: result.next.map((item) => item.coordinate),
      changedFiles: JSON.stringify(fileHashes(root)) !== JSON.stringify(before),
    }).toEqual(fixture.expected);
    // The summary line is the first line, and no result shows a claim ID.
    expect(result.lines[0]).toBe(result.summary.split("\n")[0]);
    expect(JSON.stringify(result)).not.toMatch(/wc-[a-z0-9]{8,}/);
  });
});

describe.skipIf(!existsSync(CLI))("W35 R0 P1 CLI and MCP parity with a real setup and real access limits (A3, A7)", () => {
  const run = (args: string[], cwd: string) => spawnSync(process.execPath, [CLI, ...args], { encoding: "utf8", cwd, env: { ...process.env, MAKE_DOCS_HOME: store, [HARNESS_CALLER_IDENTITY_ENV]: "" } });
  /** Start the built CLI and do not wait, so that two runs can work at the same time. */
  const start = (args: string[], cwd: string) => new Promise<{ status: number | null; stdout: string; stderr: string }>((resolve, reject) => {
    const child = spawn(process.execPath, [CLI, ...args], { cwd, env: { ...process.env, MAKE_DOCS_HOME: store, [HARNESS_CALLER_IDENTITY_ENV]: "" } });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += String(chunk); });
    child.stderr.on("data", (chunk) => { stderr += String(chunk); });
    child.on("error", reject);
    child.on("close", (status) => resolve({ status, stdout, stderr }));
  });

  // Two limits of this test. First, it closes the task with the outcome `done`, which a task line can show. So it
  // cannot show what the known fault of sync loses for good: an outcome that a task line cannot show, such as
  // `cancelled` or `superseded` (risk register R-041). Second, it passes also when the two runs do not overlap,
  // so a pass does not prove that the race happened in that run. No test fails on the known fault.
  it("two runs of the built CLI started at the same time both end with exit code 0 and no conflict, and a later run ends with nothing due (a done close only; this does not prove that the runs overlapped)", async () => {
    expect(process.env.MAKE_DOCS_HOME).toBe(store);
    const root = bound();
    const first = run(["project", "checkpoint", "--target-root", root], temp);
    expect(first.status, first.stderr).toBe(0);
    write(root, P1, P1_TEXT.replace("Build the parser.", "Build the new parser."));
    storeChange(root, "W1 R0 P2 T1", { status: "closed", closeOutcome: "done" });
    const results = await Promise.all([
      start(["project", "checkpoint", "--target-root", root, "--json"], temp),
      start(["project", "checkpoint", "--target-root", root, "--json"], temp),
    ]);
    // Each run ends with a result and exit code 0. No run reports a conflict or a file that waits.
    for (const result of results) expect(result.status, result.stderr).toBe(0);
    const answers = results.map((result) => JSON.parse(result.stdout) as WorkCheckpointResult);
    for (const answer of answers) expect([answer.syncRan, answer.conflicts.length, answer.waiting.length]).toEqual([true, 0, 0]);
    // The file edit was imported one time, and the store change was written to its file one time.
    expect(answers.filter((answer) => answer.imported.includes(P1))).toHaveLength(1);
    expect(answers.flatMap((answer) => answer.written)).toEqual([P2]);
    expect(units(root).filter((unit) => unit.coordinate === "W1 R0 P1 T1").map((unit) => unit.title)).toEqual(["Build the new parser."]);
    expect(readFileSync(path.join(root, P2), "utf8")).toContain("- [x] T1: Ship it.");
    // Known fault of sync, older than the checkpoint (risk register R-041): sync reads the work files before
    // it takes the Store. So the second run can import the text of a file from before the first run wrote it,
    // and the store then shows the task as open. This test does not assert the store status at this point.
    // One more run closes the task again from the file, with the outcome `done`. For this `done` close the
    // files and the store then agree. An outcome that the file cannot show would be lost at that step.
    const next = JSON.parse(run(["project", "checkpoint", "--target-root", root, "--json"], temp).stdout) as WorkCheckpointResult;
    expect([next.conflicts.length, next.waiting.length, next.written.length]).toEqual([0, 0, 0]);
    expect(units(root).find((unit) => unit.coordinate === "W1 R0 P2 T1")!.status).toBe("closed");
    expect(readFileSync(path.join(root, P2), "utf8")).toContain("- [x] T1: Ship it.");
    const after = JSON.parse(run(["project", "checkpoint", "--target-root", root, "--json"], temp).stdout) as WorkCheckpointResult;
    expect([after.nothingDue, after.conflicts.length, after.waiting.length]).toEqual([true, 0, 0]);
  }, 120_000);

  it("gives the same result on the built CLI and the MCP tool, and a caller with read access only gets the read steps", async () => {
    expect(process.env.MAKE_DOCS_HOME).toBe(store);
    const root = path.join(temp, "project");
    mkdirSync(root);
    const plan = prepareGenericMcpSetup({ clientLabel: "w35-p1", storeRoot: store, executable: verifyMakeDocsExecutable({ executablePath: CLI }) });
    const connection = (plan.configuration as { mcpServers: { "make-docs": { env: Record<string, string> } } }).mcpServers["make-docs"].env;
    applyGenericMcpSetup(plan);
    const setup = run(["setup", "--target", root, "--yes", "--no-codex", "--no-claude-code", "--no-skills", "--generic-mcp-client", "w35-p1", "--json"], temp);
    expect(setup.status, setup.stderr || setup.stdout.slice(0, 2000)).toBe(0);
    vi.stubEnv(MCP_CONNECTION_ID_ENV, connection.MAKE_DOCS_MCP_CONNECTION_ID!);
    vi.stubEnv(MCP_CONNECTION_KEY_ENV, connection.MAKE_DOCS_MCP_CONNECTION_KEY!);
    const configPath = path.join(root, ".make-docs/config.yaml");
    const { parse } = await import("yaml");
    const projectId = (parse(readFileSync(configPath, "utf8")) as { projectId: string }).projectId;
    const limit = (storeAccess: "none" | "read" | "write", projectAccess: "none" | "read" | "write") => writeFileSync(configPath, JSON.stringify({
      projectId,
      harnessIntegrations: [{ harness: "generic-mcp-w35-p1", mode: "narrow", method: "mcp", accessCeiling: { store: storeAccess, project: projectAccess, hostConfig: "none" } }],
    }));
    const mcp = async (args: Record<string, unknown> = {}) => (await callMakeDocsMcpTool("project_checkpoint", { targetRoot: root, ...args }, { profile: "backlog" })).result as unknown as WorkCheckpointResult;
    const cliRun = (args: string[] = []) => {
      const result = run(["project", "checkpoint", "--target-root", root, ...args], temp);
      expect(result.status, result.stderr).toBe(0);
      return result.stdout;
    };
    const state = () => storeState(root, projectId);
    limit("write", "write");
    write(root, INDEX, INDEX_TEXT);
    write(root, P1, P1_TEXT);
    write(root, P2, P2_TEXT);

    // The first direct run on the built CLI syncs. Then the CLI and the MCP tool agree, for a direct run and each event.
    expect(cliRun().split("\n")[0]).toMatch(/^Checkpoint: \d+ files imported\.$/);
    for (const event of [null, ...CHECKPOINT_EVENTS]) {
      const args = event === null ? [] : ["--event", event];
      const fromCli = JSON.parse(cliRun([...args, "--json"])) as WorkCheckpointResult;
      const fromMcp = await mcp({ ...(event === null ? {} : { event }), allowWrite: true });
      expect(fromMcp, String(event)).toEqual(fromCli);
      expect(fromCli.nothingDue, String(event)).toBe(true);
      expect(cliRun(args), String(event)).toBe(event === null ? `${fromMcp.summary}\n` : "");
    }

    // One file changed. A caller with read access only gets the read steps, and nothing changes.
    write(root, P1, P1_TEXT.replace("Build the parser.", "Build the new parser."));
    // This test changes the access limit in the project config, so it compares the work files only.
    const workFiles = () => fileHashes(path.join(root, "docs"));
    const files = workFiles();
    const before = state();
    limit("read", "read");
    const readOnly = await mcp({ allowWrite: true });
    expect([readOnly.authority, readOnly.syncRan, readOnly.syncSkipped, readOnly.nothingDue]).toEqual(["store", false, "read-access-only", false]);
    expect(readOnly.waiting).toEqual([{ path: P1, waitsFor: "import" }]);
    expect(readOnly.lines[0]).toBe("Checkpoint: 1 file waits.");
    expect(readOnly.summary).toContain("The sync waits: 1 file waits. This caller has read access only, so a caller with write access must run make-docs project checkpoint.");
    expect(readOnly.readyCount).toBeGreaterThan(0);
    expect(state()).toBe(before);
    // Store write with project read is not enough for the sync step.
    limit("write", "read");
    expect(await mcp({ allowWrite: true })).toEqual(readOnly);
    // With write access, a call without the write permission gets that same result.
    limit("write", "write");
    expect(await mcp()).toEqual(readOnly);
    expect(await mcp({ allowWrite: false })).toEqual(readOnly);
    expect((await mcp({ allowWrite: true, dryRun: true })).syncSkipped).toBe("dry-run");
    expect(state()).toBe(before);
    // A caller with no Store access gets the files line.
    limit("none", "read");
    const none = await mcp({ allowWrite: true });
    expect([none.authority, none.storeState, none.syncSkipped]).toEqual(["files", "denied", "files-authority"]);
    expect(none.lines).toHaveLength(2);
    expect(none.lines[1]).toBe(none.nextAction);
    expect(none.lines[0]).toContain("The docs/work/ files are the authority, because this caller may not use the Store");
    expect((await mcp({ allowWrite: true, event: "commit" })).quiet).toBe(true);
    expect(state()).toBe(before);
    expect(workFiles()).toEqual(files);
    // Every other write tool still refuses a call without the write permission.
    limit("write", "write");
    await expect(callMakeDocsMcpTool("work_sync", { targetRoot: root }, { profile: "backlog" })).rejects.toBeInstanceOf(OperationWriteDeniedError);
    expect(state()).toBe(before);
    // With write access and the write permission, the MCP tool syncs, and the CLI then agrees.
    const synced = await mcp({ allowWrite: true });
    expect([synced.syncRan, synced.syncSkipped, synced.imported]).toEqual([true, null, [P1]]);
    expect(JSON.parse(cliRun(["--json"]))).toEqual(await mcp({ allowWrite: true }));
  }, 180_000);
});
