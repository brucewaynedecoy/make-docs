import { spawnSync } from "node:child_process";
import { chmodSync, cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, statSync, symlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { validateHarnessCommandRules } from "../src/harness-access/contract";
import { createExecutionContext } from "../src/operations/context";
import { FACTORY_PROOF_OLD_AFTER_DAYS, FACTORY_READINESS_CODES } from "../src/operations/factory/records";
import { FACTORY_OPERATION_SCOPES } from "../src/operations/factory/project-scope";
import { factoryBackupFileRemover, factoryBackupPathState } from "../src/operations/factory/backups";
import { leafHelpEntry } from "../src/operations/leaf-help-table";
import { CLI_STORE_MAINTENANCE_VERSIONS } from "../src/operations/setup/store-ops";
import { NAME_CATALOG } from "../src/operations/name-catalog";
import { ADMITTED_OPERATION_IDS, getOperation, invokeOperation, listHarnessCommandRules, validateRegistryHarnessCommandRules } from "../src/operations/registry";
import { platform } from "../src/platform";
import { adaptRunCliArgv } from "../src/run/cli";
import { withStoreDatabase } from "../src/store/database";
import { splitFactoryBackupPath } from "../src/store/factory-backup-path";
import { FACTORY_STORE_TABLE_NAMES } from "../src/store/factory-store-schema";
import { STORE_DECISION_ITEMS, STORE_FIXED_RULES } from "../src/store/table-catalog";
import { FACTORY_GRANT_USE_READ_MAX, findFactoryPlanRevisionByDigest, readFactoryWorkflowBinding, saveFactoryProofResult, useFactoryGrant } from "../src/store/factory-store";
import { getInstallationCheckoutId, previewInstallationCheckoutMove, registerSeparateInstallationCheckout } from "../src/store/installation-state";
import { pruneProjectFromStore } from "../src/store/lifecycle";
import { createLifecycleRun, readLifecycleRun } from "../src/store/lifecycle-runs";
import { checkStore, defaultStoreMaintenanceEnvironment } from "../src/store/maintenance";
import { claimWorkUnit, createQuickItem, deletePrunedProjectWorkRows, workProjectDigest, writeWorkStore } from "../src/store/work-store";
import { cleanupTempDir, createTempDir } from "./helpers";

/**
 * W30 R0 Store lifecycle fixes (owner's audit and decisions of 2026-11-24,
 * PRD 53 R-FACTORY-12, -24, -57, and -73 to -75): the reviewed workflow
 * removal, backup records with their files, readiness after a failed test
 * task, retention, tool fact freshness, and the Store README. Tool names are
 * generic, such as `tool-a`. Every run uses a temporary MAKE_DOCS_HOME, so no
 * test reaches the real Store.
 */

const NOW = new Date("2042-06-15T12:00:00.000Z");
const PROJECT_ID = "factory-lifecycle-project";
const CLI_PATH = path.resolve(import.meta.dirname, "../dist/index.js");

const WORKFLOW_YAML = `factory:
  workflows:
    ship:
      type: build-then-review
      typeVersion: 1
      roundLimit: 3
      roles:
        foreman:
          job: Claim the unit, brief, judge, and accept.
          capabilities: [read-write-files, run-commands, launch-agent, wait-for-agent, read-agent-result]
          returns: Accepted units and escalations.
        builder:
          job: Build the unit.
          capabilities: [read-write-files, run-commands]
          returns: The result and its evidence.
        reviewer:
          job: Review the result.
          capabilities: [read-write-files]
          returns: A pass or a defect list.
      humanChannel: wait-in-session
`;

const proof = (capabilityId: string, method: string, toolVersion: string, notCovered: string[] = []) => ({ capabilityId, method, toolVersion, provedAt: NOW.toISOString(), result: "proved", notCovered });

const TOOLS = (expected: { a: number | null; b: number | null } = { a: null, b: null }) => [
  {
    toolId: "tool-a",
    kind: "agent-harness",
    label: "Tool A",
    state: "available",
    reportedVersion: "1.0",
    capabilities: ["read-write-files", "run-commands", "launch-agent", "wait-for-agent", "read-agent-result"],
    proofs: [
      proof("read-write-files", "Wrote and read a scratch file.", "1.0"),
      proof("run-commands", "Ran a harmless command.", "1.0", ["long output"]),
      proof("launch-agent", "Started a fresh agent with a one-line brief.", "1.0"),
      proof("wait-for-agent", "Waited for that agent to finish.", "1.0"),
      proof("read-agent-result", "Read the agent's returned line.", "1.0"),
    ],
    expectedVersion: expected.a,
  },
  {
    toolId: "tool-b",
    kind: "agent-harness",
    label: "Tool B",
    state: "blocked",
    reportedVersion: "2.0",
    capabilities: ["read-write-files"],
    proofs: [proof("read-write-files", "Wrote and read a scratch file.", "2.0")],
    expectedVersion: expected.b,
  },
];

const BINDING = { roles: { foreman: "tool-a", builder: "tool-a", reviewer: "tool-a" }, worktreeMethod: "none", channelRef: null, wakeMethod: "person", wakeRef: null, knownLosses: [] };

const roots: string[] = [];
let temp: string;
let store: string;

beforeEach(() => {
  temp = platform.describePath(createTempDir("make-docs-w30-lifecycle-")).canonicalPath;
  roots.push(temp);
  store = path.join(temp, "store");
  vi.stubEnv("MAKE_DOCS_HOME", store);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  while (roots.length) {
    const root = roots.pop()!;
    const unlock = (folder: string) => {
      if (!existsSync(folder)) return;
      for (const name of readdirSync(folder)) {
        const entry = path.join(folder, name);
        try {
          chmodSync(entry, 0o755);
        } catch {
          // Best effort.
        }
        // A test can leave a broken symbolic link, which has no target to read.
        if (statSync(entry, { throwIfNoEntry: false })?.isDirectory()) unlock(entry);
      }
    };
    unlock(root);
    cleanupTempDir(root);
  }
});

type Value = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

function project(name = "aurora"): string {
  const root = path.join(temp, name);
  mkdirSync(path.join(root, ".make-docs"), { recursive: true });
  writeFileSync(path.join(root, ".make-docs/config.yaml"), `projectId: ${PROJECT_ID}\nprojectName: ${name}\n${WORKFLOW_YAML}`);
  const canonical = platform.describePath(root).canonicalPath;
  getInstallationCheckoutId(canonical, store);
  return canonical;
}

function secondCheckout(name: string): string {
  const root = path.join(temp, name);
  mkdirSync(path.join(root, ".make-docs"), { recursive: true });
  writeFileSync(path.join(root, ".make-docs/config.yaml"), `projectId: ${PROJECT_ID}\nprojectName: aurora\n${WORKFLOW_YAML}`);
  const canonical = platform.describePath(root).canonicalPath;
  const preview = previewInstallationCheckoutMove(canonical, undefined, store);
  registerSeparateInstallationCheckout(canonical, preview.separateReviewDigest!, store);
  return canonical;
}

async function call(id: string, input: Record<string, unknown>, cwd = temp, now = NOW): Promise<Value> {
  const invocation = await invokeOperation(id, input, createExecutionContext({ surface: "test", writesAllowed: true, storeRoot: store, cwd, now: () => now.toISOString() }));
  return invocation.value as Value;
}

function dump(): string {
  const db = new DatabaseSync(path.join(store, "store.db"), { readOnly: true });
  try {
    const tables = (db.prepare("SELECT name FROM sqlite_schema WHERE type = 'table' AND name LIKE 'factory_%' ORDER BY name").all() as Array<{ name: string }>).map((row) => row.name);
    return JSON.stringify(tables.map((table) => [table, db.prepare(`SELECT * FROM ${table}`).all()]));
  } finally {
    db.close();
  }
}

function claimedUnit(root: string, title = "Write the notes"): { unit: string; claimId: string } {
  withStoreDatabase(store, (db) => {
    for (const runId of ["run-1", "run-2"]) {
      if (!readLifecycleRun(db, PROJECT_ID, runId)) createLifecycleRun(db, { projectId: PROJECT_ID, runId, lifecycleStage: "implementation", committedAt: NOW.toISOString() });
    }
  });
  return writeWorkStore(root, (db, workProject) => {
    const unit = createQuickItem(db, workProject.projectId, { title, body: null, links: [] });
    const claimed = claimWorkUnit(db, { unitStoreId: unit.storeId, claimant: "foreman", taskHandle: "run-1", ttlSeconds: 3600, expectedVersion: unit.revision, takeover: null }, { now: NOW });
    if (claimed.result !== "claimed") throw new Error(`claim refused: ${claimed.refusal}`);
    return { unit: unit.coordinate, claimId: claimed.claim.claimId };
  }, { storeRoot: store, now: NOW });
}

async function readyWorkflow(root: string, saveTools = true): Promise<void> {
  if (saveTools) expect((await call("factory.tools.save", { tools: TOOLS().map((tool) => ({ ...tool, state: "available" })) })).result).toBe("saved");
  const saved = await call("factory.workflow.save", { targetRoot: root, workflow: "ship", binding: BINDING });
  expect(saved.result, JSON.stringify(saved)).toBe("saved");
  const passed = await call("factory.proof.save", { targetRoot: root, workflow: "ship", outcome: "passed", testTask: "Write one line and review it.", planDigest: saved.revision.planDigest, path: ["builder: tool-a"], manualSteps: [] });
  expect(passed.readiness, JSON.stringify(passed)).toBe("ready");
}

/** A ready workflow, a claimed unit, and one open builder assignment. */
async function openJob(root: string): Promise<{ unit: string; claimId: string; assignmentId: string; version: number }> {
  await readyWorkflow(root);
  const { unit, claimId } = claimedUnit(root);
  const started = await call("factory.assignment.start", { targetRoot: root, workflow: "ship", unit, role: "builder", runId: "run-1", claimId });
  expect(started.result, JSON.stringify(started)).toBe("started");
  return { unit, claimId, assignmentId: started.assignment.assignmentId, version: started.assignment.version };
}

/** Move the builder's assignment along the move table to `accepted`, so that every assignment of the unit is final. */
async function acceptJob(root: string, job: { claimId: string; assignmentId: string; version: number }): Promise<Value> {
  let version = job.version;
  let last: Value = {};
  for (const [status, reason] of [["running", "tool-started"], ["returned", "result-returned"], ["in-review", "sent-to-review"], ["accepted", "review-passed"]]) {
    last = await call("factory.assignment.save", { targetRoot: root, assignmentId: job.assignmentId, expectedVersion: version, claimId: job.claimId, status, reason });
    expect(last.result, JSON.stringify(last)).toBe("updated");
    version = last.assignment.version;
  }
  return last;
}

function runCliIn(cwd: string, args: string[]) {
  return spawnSync(process.execPath, [CLI_PATH, ...args], { cwd, encoding: "utf8", env: { ...process.env, MAKE_DOCS_HOME: store } });
}

const DAY_MS = 24 * 60 * 60 * 1000;
const later = (days: number) => new Date(NOW.getTime() + days * DAY_MS);
const REPO = path.resolve(import.meta.dirname, "../../..");

function count(table: string, where = ""): number {
  const db = new DatabaseSync(path.join(store, "store.db"), { readOnly: true });
  try {
    return Number((db.prepare(`SELECT count(*) AS n FROM ${table} ${where}`).get() as { n: number }).n);
  } finally {
    db.close();
  }
}

function factoryCounts(): Record<string, number> {
  return Object.fromEntries(FACTORY_STORE_TABLE_NAMES.map((table) => [table, count(table)]));
}

function setRoundLimit(root: string, limit: number): void {
  const file = path.join(root, ".make-docs/config.yaml");
  writeFileSync(file, readFileSync(file, "utf8").replace(/roundLimit: \d+/, `roundLimit: ${limit}`));
}

async function cancel(root: string, job: { claimId: string; assignmentId: string; version: number }): Promise<void> {
  const cancelled = await call("factory.assignment.save", { targetRoot: root, assignmentId: job.assignmentId, expectedVersion: job.version, claimId: job.claimId, status: "cancelled", reason: "stopped-by-person" });
  expect(cancelled.result, JSON.stringify(cancelled)).toBe("updated");
}

async function backupNotes(root: string, job: { claimId: string; assignmentId: string }): Promise<string> {
  mkdirSync(path.join(root, "notes"), { recursive: true });
  writeFileSync(path.join(root, "notes/plan.md"), "The first plan.\n");
  const saved = await call("factory.file-backup.save", { targetRoot: root, assignmentId: job.assignmentId, claimId: job.claimId, files: ["notes/plan.md"] });
  expect(saved.result, JSON.stringify(saved)).toBe("saved");
  return path.join(root, saved.files[0].backup);
}

/* ------------------------------------------------------------------------ */
/* Finding 1: the reviewed workflow removal (R-FACTORY-73)                  */
/* ------------------------------------------------------------------------ */

describe("W30 R0 Store lifecycle fixes: factory workflow clean (finding 1)", () => {
  it("admits the command with its CLI path, MCP name, leaf help, project write scope, and a native command rule with no refused word", () => {
    const id = "factory.workflow.clean";
    expect((ADMITTED_OPERATION_IDS as readonly string[]).includes(id)).toBe(true);
    const entry = NAME_CATALOG.find((item) => item.id === id)!;
    expect(entry).toMatchObject({ status: "current", newCli: "factory workflow clean", newMcp: "factory_workflow_clean" });
    expect(entry.newMcp.length).toBeLessThanOrEqual(26);
    const operation = getOperation(id);
    expect(operation.mcp?.profiles).toEqual(["factory"]);
    expect(operation.mutates).toBe("write");
    expect(operation.access).toEqual({ store: "write", project: "write", hostConfig: "none" });
    expect(FACTORY_OPERATION_SCOPES[id]).toEqual({ scope: "project", kind: "write", needsCheckout: true });
    expect(leafHelpEntry(id).summary).toBe(operation.summary);
    const rules = listHarnessCommandRules();
    expect(rules.find((rule) => rule.id === "make-docs.factory.workflow.clean")).toMatchObject({ commandPrefix: ["factory", "workflow", "clean"], operationIds: [id] });
    expect(() => validateHarnessCommandRules(rules, { list: listHarnessCommandRules, validate: validateRegistryHarnessCommandRules })).not.toThrow();
    for (const word of ["update", "backup", "remove", "setup", "uninstall"]) expect(rules.some((rule) => rule.commandPrefix.includes(word)), word).toBe(false);
    const digest = "a".repeat(64);
    expect(adaptRunCliArgv(["factory", "workflow", "clean", "ship", "--review", digest, "--project", "aurora"]).invocation.input).toEqual({ workflow: "ship", review: digest, project: "aurora" });
    expect(adaptRunCliArgv(["factory", "workflow", "clean", "ship", "--target-root", temp]).invocation.input).toEqual({ workflow: "ship", targetRoot: temp });
  });

  it("refuses a call that names no project, also for the review, and changes nothing", async () => {
    const root = project();
    await readyWorkflow(root);
    const before = dump();
    expect(await call("factory.workflow.clean", { workflow: "ship" }, root)).toMatchObject({ result: "refused", refusal: "project-missing", actedOn: { kind: "none" } });
    expect(await call("factory.workflow.clean", { project: "nobody", workflow: "ship" }, root)).toMatchObject({ result: "refused", refusal: "project-not-found" });
    expect(await call("factory.workflow.clean", { targetRoot: root, workflow: "other" })).toMatchObject({ result: "refused", refusal: "record-not-found", actedOn: { kind: "project", projectName: "aurora" } });
    expect(dump()).toBe(before);
  });

  it("reviews without a change, refuses an open assignment and a wrong digest, then removes every record of the workflow in order and names the project", async () => {
    const root = project();
    const job = await openJob(root);
    const backup = await backupNotes(root, job);
    await call("factory.workflow.save", { targetRoot: root, workflow: "ship", grants: { add: [{ action: "merge", scope: "standing", grantedBy: "the owner" }, { action: "deploy", scope: "once", grantedBy: "the owner" }] } });
    const used = await call("factory.assignment.save", { targetRoot: root, assignmentId: job.assignmentId, expectedVersion: job.version, claimId: job.claimId, grantUse: "deploy" });
    expect(used).toMatchObject({ result: "updated", grant: { state: "spent" } });
    const before = dump();

    // The review changes nothing, and it says that an open assignment stops the removal.
    const blocked = await call("factory.workflow.clean", { targetRoot: root, workflow: "ship" });
    expect(blocked).toMatchObject({ result: "reviewed", removable: false, openAssignments: 1, actedOn: { kind: "project", projectName: "aurora", projectId: PROJECT_ID } });
    expect(blocked.lines.join("\n")).toContain("1 assignment of this workflow is open");
    expect(blocked.lines.at(-1)).toBe("This review changed nothing.");
    expect(dump()).toBe(before);
    // The removal itself refuses while the assignment is open, with the digest of that review.
    expect(await call("factory.workflow.clean", { targetRoot: root, workflow: "ship", review: blocked.reviewDigest })).toMatchObject({ result: "refused", refusal: "assignment-open" });
    expect(dump()).toBe(before);

    await cancel(root, { ...job, version: used.assignment.version });
    expect(existsSync(backup)).toBe(true);
    const review = await call("factory.workflow.clean", { targetRoot: root, workflow: "ship" });
    expect(review).toMatchObject({
      result: "reviewed",
      removable: true,
      inConfig: true,
      counts: { factory_backups: 1, factory_assignments: 1, factory_grant_uses: 1, factory_grants: 2, factory_proof_results: 1, factory_workflow_plans: 1, factory_workflow_bindings: 1 },
    });
    expect(review.reviewDigest).toMatch(/^[0-9a-f]{64}$/);
    expect(review.reviewDigest).not.toBe(blocked.reviewDigest);
    expect(review.lines.join("\n")).toContain(`make-docs factory workflow clean ship --review ${review.reviewDigest}`);
    // The digest of the earlier review no longer matches, and a digest of nothing matches nothing.
    const state = dump();
    expect(await call("factory.workflow.clean", { targetRoot: root, workflow: "ship", review: blocked.reviewDigest })).toMatchObject({ result: "refused", refusal: "review-mismatch" });
    expect(await call("factory.workflow.clean", { targetRoot: root, workflow: "ship", review: "0".repeat(64) })).toMatchObject({ result: "refused", refusal: "review-mismatch" });
    expect(dump()).toBe(state);
    expect(existsSync(backup)).toBe(true);

    const removed = await call("factory.workflow.clean", { targetRoot: root, workflow: "ship", review: review.reviewDigest });
    expect(removed).toMatchObject({
      operation: "factory.workflow.clean",
      result: "removed",
      actedOn: { kind: "project", projectName: "aurora", projectId: PROJECT_ID },
      counts: { factory_backups: 1, factory_assignments: 1, factory_grant_uses: 1, factory_grants: 2, factory_proof_results: 1, factory_workflow_plans: 1, factory_workflow_bindings: 1 },
      backupFilesRemoved: 1,
    });
    expect(removed.lines[0]).toBe(`Removed saved workflow ship from project aurora (${PROJECT_ID}). Deleted, in this order:`);
    expect(removed.lines.slice(1, 8)).toEqual([
      "- 1 backup record, each with its backup file.",
      "- 1 final assignment.",
      "- 1 grant use.",
      "- 2 grants.",
      "- 1 test task result.",
      "- 1 plan revision.",
      "- 1 saved binding.",
    ]);
    expect(removed.otherCheckouts).toBe(0);
    expect(removed.lines.join("\n")).not.toContain("Only the copies of this checkout");
    // The backup file went with its record, and every project row of the workflow is gone. The machine's tools stay.
    expect(existsSync(backup)).toBe(false);
    expect(factoryCounts()).toEqual({
      factory_machine_tools: 2, factory_capability_proofs: 6, factory_workflow_plans: 0, factory_workflow_bindings: 0, factory_grants: 0,
      factory_grant_uses: 0, factory_assignments: 0, factory_proof_results: 0, factory_backups: 0,
    });
    // The copies are written again without the workflow, and the workflow is only a config entry now.
    expect(existsSync(path.join(root, ".make-docs/factory/tools.md"))).toBe(true);
    expect(readdirSync(path.join(root, ".make-docs/factory")).filter((name) => name.includes("ship"))).toEqual([]);
    expect((await call("factory.workflow.show", { targetRoot: root, workflow: "ship" }))).toMatchObject({ result: "refused", refusal: "record-not-found" });
    const listed = await call("factory.workflow.list", { targetRoot: root });
    expect(listed.workflows).toEqual([expect.objectContaining({ workflowName: "ship", readiness: "draft" })]);
    // The claim ID is in no result.
    expect(JSON.stringify([blocked, review, removed])).not.toContain(job.claimId);
    // A second removal has nothing to remove.
    expect(await call("factory.workflow.clean", { targetRoot: root, workflow: "ship", review: review.reviewDigest })).toMatchObject({ result: "refused", refusal: "record-not-found" });
  });

  it("removes only the named workflow, and a workflow whose config entry is gone", async () => {
    const root = project();
    const file = path.join(root, ".make-docs/config.yaml");
    writeFileSync(file, readFileSync(file, "utf8").replace("      humanChannel: wait-in-session\n", "      humanChannel: wait-in-session\n" + WORKFLOW_YAML.split("\n").slice(2).join("\n").replace("    ship:", "    docs:")));
    await readyWorkflow(root);
    const second = await call("factory.workflow.save", { targetRoot: root, workflow: "docs", binding: BINDING });
    expect(second.result, JSON.stringify(second)).toBe("saved");
    writeFileSync(file, `projectId: ${PROJECT_ID}\nprojectName: aurora\n${WORKFLOW_YAML}`);
    expect((await call("factory.workflow.show", { targetRoot: root, workflow: "docs" })).live).toMatchObject({ readiness: "drifted" });
    const review = await call("factory.workflow.clean", { targetRoot: root, workflow: "docs" });
    expect(review).toMatchObject({ removable: true, inConfig: false });
    expect(await call("factory.workflow.clean", { targetRoot: root, workflow: "docs", review: review.reviewDigest })).toMatchObject({ result: "removed", counts: { factory_workflow_plans: 1, factory_workflow_bindings: 1 } });
    expect((await call("factory.workflow.list", { targetRoot: root })).workflows).toEqual([expect.objectContaining({ workflowName: "ship", readiness: "ready" })]);
    expect(count("factory_workflow_bindings")).toBe(1);
  });

  /** A ready workflow in `first`, and a cancelled job with one backup in a second bound checkout. */
  async function backupInSecondCheckout(first: string, name = "aurora-two") {
    await readyWorkflow(first);
    const second = secondCheckout(name);
    const { unit, claimId } = claimedUnit(second);
    const started = await call("factory.assignment.start", { targetRoot: second, workflow: "ship", unit, role: "builder", runId: "run-1", claimId });
    expect(started.result, JSON.stringify(started)).toBe("started");
    const job = { claimId, assignmentId: started.assignment.assignmentId as string, version: started.assignment.version as number };
    const backup = await backupNotes(second, job);
    await cancel(second, job);
    return { second, job, backup, rel: `.make-docs/backup/factory/${job.assignmentId}/notes/plan.md` };
  }

  it("reaches a backup file in another bound checkout, and the review names that checkout (register D-079, option A)", async () => {
    const first = project();
    const { second, backup } = await backupInSecondCheckout(first);
    const review = await call("factory.workflow.clean", { targetRoot: first, workflow: "ship" });
    expect(review).toMatchObject({ removable: true, backupsDropped: [], backupsOutOfReach: [], counts: { factory_backups: 1 } });
    // The review names each checkout that holds a backup file, with the count.
    expect(review.backupsByCheckout).toEqual([{ checkoutId: expect.any(String), root: second, files: 1 }]);
    expect(review.lines).toContain("Backup files that the removal deletes, by checkout:");
    expect(review.lines).toContain(`- 1 backup file in checkout ${second}.`);
    const removedBoth = await call("factory.workflow.clean", { targetRoot: first, workflow: "ship", review: review.reviewDigest });
    expect(removedBoth).toMatchObject({ result: "removed", backupFilesRemoved: 1, backupsDropped: [], otherCheckouts: 1 });
    expect(removedBoth.lines).toContain(`- 1 backup file in checkout ${second}.`);
    // Only the named checkout's copies are written again, and the result says how to write the others.
    expect(removedBoth.lines).toContain("Only the copies of this checkout were written again. This project has 1 other bound checkout: run make-docs factory restore --target-root <that checkout> in each one to write its copies again.");
    expect(existsSync(backup)).toBe(false);
    expect(count("factory_backups")).toBe(0);
    expect(count("factory_workflow_bindings")).toBe(0);
  });

  it("drops a backup record whose checkout folder is gone for good: the review lists it by name, the digest binds it, and routine cleanup still keeps it (register D-078, option B)", async () => {
    const first = project();
    const { second, backup, rel } = await backupInSecondCheckout(first);
    const withFolder = await call("factory.workflow.clean", { targetRoot: first, workflow: "ship" });
    // The folder is gone, and nothing is at the backup path.
    rmSync(second, { recursive: true, force: true });
    expect(existsSync(backup)).toBe(false);
    // Routine cleanup keeps the record and reports it, as before.
    const routine = await call("factory.restore", { targetRoot: first }, temp, later(31));
    expect(routine.backupCleanup).toMatchObject({ removed: 0, kept: [{ backup: rel, where: "checkout-missing" }] });
    expect(count("factory_backups")).toBe(1);
    // The review lists the record by name, marked as dropped with no file. It does not stop the removal.
    const review = await call("factory.workflow.clean", { targetRoot: first, workflow: "ship" });
    expect(review).toMatchObject({ result: "reviewed", removable: true, backupsByCheckout: [], backupsOutOfReach: [], backupsBlocked: [], counts: { factory_backups: 1 } });
    expect(review.backupsDropped).toEqual([{ backup: rel, assignmentId: expect.any(String), checkoutId: expect.any(String) }]);
    expect(review.lines).toContain("- 1 backup record: 0 with their backup file, and 1 dropped with no file.");
    // The words say what the software found, not "gone for good": it cannot know that (round 4, F1).
    expect(review.lines).toContain("1 backup record goes with no file. The files are not found on this computer now (removed, renamed, or on a drive that is not connected). If a file still exists, it stays where it is, and no later Make Docs cleanup finds it:");
    expect(JSON.stringify(review)).not.toContain("gone for good");
    expect(review.lines).toContain(`- ${rel}: record dropped, files not reachable.`);
    expect(JSON.stringify(review.backupsDropped)).not.toContain(temp);
    // The dropped record is part of the digest: the review from before the folder went no longer matches.
    expect(review.reviewDigest).not.toBe(withFolder.reviewDigest);
    const before = dump();
    expect(await call("factory.workflow.clean", { targetRoot: first, workflow: "ship", review: withFolder.reviewDigest })).toMatchObject({ result: "refused", refusal: "review-mismatch" });
    expect(dump()).toBe(before);
    const removed = await call("factory.workflow.clean", { targetRoot: first, workflow: "ship", review: review.reviewDigest });
    expect(removed).toMatchObject({ result: "removed", backupFilesRemoved: 0, backupsDropped: [rel], counts: { factory_backups: 1, factory_assignments: 1, factory_workflow_bindings: 1 } });
    expect(removed.lines).toContain("Backup records dropped with no file. The files are not found on this computer now (removed, renamed, or on a drive that is not connected). If a file still exists, it stays where it is, and no later Make Docs cleanup finds it:");
    expect(JSON.stringify(removed)).not.toContain("gone for good");
    expect(removed.lines).toContain(`- ${rel}: record dropped, files not reachable.`);
    expect(factoryCounts()).toMatchObject({ factory_backups: 0, factory_assignments: 0, factory_workflow_bindings: 0 });
  });

  it("says in the contract, the PRD, and the register that the files are not found now, and that a file that still exists stays (round 4, F1)", () => {
    const phrase = "not found on this computer now (removed, renamed, or on a drive that is not connected)";
    const template = readFileSync(path.join(REPO, "packages/docs/template/.make-docs/system/contracts/factory-contract.md"), "utf8");
    expect(readFileSync(path.join(REPO, ".make-docs/system/contracts/factory-contract.md"), "utf8")).toBe(template);
    const prd = readFileSync(path.join(REPO, "docs/prd/53-factory-setup-and-orchestration.md"), "utf8");
    const register = readFileSync(path.join(REPO, "docs/prd/03-open-questions-and-risk-register.md"), "utf8");
    const requirements = prd.slice(prd.indexOf("- R-FACTORY-73 (MUST)"), prd.indexOf("- R-FACTORY-75 (MUST)"));
    const resolution = register.slice(register.indexOf("### D-078"), register.indexOf("### D-079"));
    for (const [name, text] of [["contract", template], ["PRD 53", requirements], ["register D-078", resolution.slice(resolution.indexOf("**Resolution**"))]] as const) {
      expect(text, name).toContain(phrase);
      expect(text, name).toContain("record dropped, files not reachable");
      expect(text, name).toMatch(/no later (Make Docs )?cleanup finds/);
    }
    // The owner accepted this on 2026-11-24, and the register says so.
    expect(resolution).toContain("The owner accepted this on 2026-11-24");
    // A link at the checkout root is allowed, and a link below it is refused: the contract and the register say so.
    expect(template).toContain("A checkout folder can itself be a symbolic link.");
    expect(register).toContain("### D-080 A Checkout Folder That Is a Symbolic Link");
    // The contract and the two requirements no longer claim "for good", and the contract no longer says that no file is ever left.
    expect(template).not.toContain("gone for good");
    expect(requirements).not.toContain("gone for good");
    expect(template).not.toContain("and no file is left without its record");
  });

  /** A ready workflow in `first`, and a record whose folder is deleted, with its backup tree moved into a third bound checkout. */
  async function movedBackup(first: string) {
    const made = await backupInSecondCheckout(first);
    const third = secondCheckout("aurora-three");
    const from = path.join(made.second, ".make-docs/backup/factory", made.job.assignmentId);
    const to = path.join(third, ".make-docs/backup/factory", made.job.assignmentId);
    mkdirSync(path.dirname(to), { recursive: true });
    cpSync(from, to, { recursive: true });
    rmSync(made.second, { recursive: true, force: true });
    return { ...made, third, movedFile: path.join(to, "notes/plan.md") };
  }

  it("moved folder: deletes the record's file at the same project path in a reachable checkout, with its record (round 4)", async () => {
    const first = project();
    const { third, movedFile, rel } = await movedBackup(first);
    const review = await call("factory.workflow.clean", { targetRoot: first, workflow: "ship" });
    expect(review).toMatchObject({ removable: true, backupFiles: 1, backupsDropped: [], backupsChanged: [], backupsOutOfReach: [], counts: { factory_backups: 1 } });
    expect(review.backupsByCheckout).toEqual([{ checkoutId: expect.any(String), root: third, files: 1 }]);
    const removed = await call("factory.workflow.clean", { targetRoot: first, workflow: "ship", review: review.reviewDigest });
    expect(removed).toMatchObject({ result: "removed", backupFilesRemoved: 1, backupsDropped: [], counts: { factory_backups: 1 } });
    expect(removed.lines).toContain(`- 1 backup file in checkout ${third}.`);
    expect(existsSync(movedFile)).toBe(false);
    expect(count("factory_backups")).toBe(0);
    expect(JSON.stringify(removed.lines)).not.toContain(`${rel}: record dropped`);
  });

  it("moved folder with a copy in two checkouts: lists, counts, and binds each copy, and deletes each one (round 4, F2)", async () => {
    const first = project();
    const { third, movedFile, rel, job } = await movedBackup(first);
    const single = await call("factory.workflow.clean", { targetRoot: first, workflow: "ship" });
    // The same project path with the same bytes is also in the first checkout.
    const copy = path.join(first, rel);
    mkdirSync(path.dirname(copy), { recursive: true });
    cpSync(movedFile, copy);
    const review = await call("factory.workflow.clean", { targetRoot: first, workflow: "ship" });
    expect(review).toMatchObject({ removable: true, backupFiles: 2, counts: { factory_backups: 1 } });
    expect(review.backupsByCheckout).toEqual([
      { checkoutId: expect.any(String), root: first, files: 1 },
      { checkoutId: expect.any(String), root: third, files: 1 },
    ]);
    expect(review.lines).toContain(`- 1 backup file in checkout ${first} (the checkout of this call).`);
    expect(review.lines).toContain(`- 1 backup file in checkout ${third}.`);
    expect(review.lines).toContain(`- ${rel}: 2 copies of this one backup go, in checkout ${first} and checkout ${third}.`);
    // Each copy is in the digest: the review from before the second copy no longer matches.
    expect(review.reviewDigest).not.toBe(single.reviewDigest);
    expect(await call("factory.workflow.clean", { targetRoot: first, workflow: "ship", review: single.reviewDigest })).toMatchObject({ result: "refused", refusal: "review-mismatch" });
    const removed = await call("factory.workflow.clean", { targetRoot: first, workflow: "ship", review: review.reviewDigest });
    expect(removed).toMatchObject({ result: "removed", backupFilesRemoved: 2, counts: { factory_backups: 1 } });
    // No copy stays behind.
    expect(existsSync(copy)).toBe(false);
    expect(existsSync(movedFile)).toBe(false);
    expect(count("factory_backups")).toBe(0);
    expect(job.assignmentId).toMatch(/^fa-/);
  });

  it("moved file with other bytes: stops the removal with backup-file-changed, keeps the record, and deletes nothing (round 4, F3)", async () => {
    const first = project();
    const { movedFile, rel } = await movedBackup(first);
    writeFileSync(movedFile, "Bytes that are not the recorded backup.\n");
    const review = await call("factory.workflow.clean", { targetRoot: first, workflow: "ship" });
    expect(review).toMatchObject({ removable: false, backupFiles: 0, backupsDropped: [], backupsChanged: [{ backup: rel, where: "changed-file" }] });
    expect(review.lines.join("\n")).toContain("is not proved to be the recorded one");
    expect(review.lines.join("\n")).not.toContain(`${rel}: record dropped`);
    const before = dump();
    const refused = await call("factory.workflow.clean", { targetRoot: first, workflow: "ship", review: review.reviewDigest });
    expect(refused).toMatchObject({ result: "refused", refusal: "backup-file-changed" });
    expect(refused.reason).toContain(rel);
    expect(refused.reason).toContain("Make Docs does not delete it, and does not drop the record.");
    expect(refused.reason).toContain("put the recorded backup back, or move the file away yourself, then review again");
    expect(refused.reason).not.toContain(temp);
    expect(dump()).toBe(before);
    expect(readFileSync(movedFile, "utf8")).toBe("Bytes that are not the recorded backup.\n");
    expect(count("factory_backups")).toBe(1);
    // The person moves the file away: the record is then dropped by a new review.
    rmSync(movedFile);
    const again = await call("factory.workflow.clean", { targetRoot: first, workflow: "ship" });
    expect(again).toMatchObject({ removable: true, backupsChanged: [], backupsDropped: [{ backup: rel }] });
  });

  it("two dropped records with one assignment and one project path: the review says removable, and the removal drops both (round 4, F4)", async () => {
    const first = project();
    const { second, job, rel } = await backupInSecondCheckout(first);
    rmSync(second, { recursive: true, force: true });
    // A second record of the same assignment with the same path inside the project, in another folder that is not found.
    const other = path.join(temp, "not-here");
    withStoreDatabase(store, (db) => db.prepare("INSERT INTO factory_backups (project_id, assignment_id, original_path, backup_path, content_digest, backed_up_at) VALUES (?, ?, ?, ?, ?, ?)")
      .run(PROJECT_ID, job.assignmentId, path.join(other, "notes/plan.md"), path.join(other, rel), "c".repeat(64), NOW.toISOString()));
    const review = await call("factory.workflow.clean", { targetRoot: first, workflow: "ship" });
    expect(review).toMatchObject({ removable: true, counts: { factory_backups: 2 } });
    expect(review.backupsDropped.map((entry: Value) => entry.backup)).toEqual([rel, rel]);
    expect(review.lines.filter((line: string) => line === `- ${rel}: record dropped, files not reachable.`)).toHaveLength(2);
    // The record's own key, an absolute path, is in no result.
    expect(JSON.stringify(review.backupsDropped)).not.toContain(temp);
    const removed = await call("factory.workflow.clean", { targetRoot: first, workflow: "ship", review: review.reviewDigest });
    expect(removed, JSON.stringify(removed)).toMatchObject({ result: "removed", backupFilesRemoved: 0, backupsDropped: [rel, rel], counts: { factory_backups: 2 } });
    expect(factoryCounts()).toMatchObject({ factory_backups: 0, factory_assignments: 0, factory_workflow_bindings: 0 });
  });

  it("splits a backup path at the last marker that the assignment ID follows, in cleanup, in the removal, and in setup store check (round 4, F5)", async () => {
    // The shared helper, for both path separators.
    expect(splitFactoryBackupPath("/a/.make-docs/backup/factory/x/.make-docs/backup/factory/fa-1/notes/.make-docs/backup/factory/in.md", "fa-1")).toEqual({
      root: "/a/.make-docs/backup/factory/x",
      projectPath: ".make-docs/backup/factory/fa-1/notes/.make-docs/backup/factory/in.md",
    });
    expect(splitFactoryBackupPath("C:\\work\\app\\.make-docs\\backup\\factory\\fa-1\\notes\\a.md", "fa-1")).toEqual({ root: "C:\\work\\app", projectPath: ".make-docs/backup/factory/fa-1/notes/a.md" });
    expect(splitFactoryBackupPath("/a/.make-docs/backup/factory/fa-2/notes/a.md", "fa-1")).toBeNull();
    expect(splitFactoryBackupPath("/a/notes/a.md", "fa-1")).toBeNull();

    // A backed-up file whose own path holds the backup folder marker.
    const first = project();
    await readyWorkflow(first);
    const second = secondCheckout("aurora-two");
    const { unit, claimId } = claimedUnit(second);
    const started = await call("factory.assignment.start", { targetRoot: second, workflow: "ship", unit, role: "builder", runId: "run-1", claimId });
    const assignmentId = started.assignment.assignmentId as string;
    const inner = "notes/.make-docs/backup/factory/inner.md";
    mkdirSync(path.join(second, path.dirname(inner)), { recursive: true });
    writeFileSync(path.join(second, inner), "An inner file.\n");
    const saved = await call("factory.file-backup.save", { targetRoot: second, assignmentId, claimId, files: [inner] });
    expect(saved.result, JSON.stringify(saved)).toBe("saved");
    const rel = `.make-docs/backup/factory/${assignmentId}/${inner}`;
    expect(saved.files[0].backup).toBe(rel);
    await cancel(second, { claimId, assignmentId, version: started.assignment.version });
    rmSync(second, { recursive: true, force: true });
    // Cleanup, the removal review, and the decision item all name the same path inside the project.
    const kept = await call("factory.restore", { targetRoot: first }, temp, later(31));
    expect(kept.backupCleanup.kept).toEqual([expect.objectContaining({ backup: rel, where: "checkout-missing" })]);
    const review = await call("factory.workflow.clean", { targetRoot: first, workflow: "ship" });
    expect(review.backupsDropped).toEqual([expect.objectContaining({ backup: rel })]);
    const items = checkStore(store, defaultStoreMaintenanceEnvironment(CLI_STORE_MAINTENANCE_VERSIONS, later(31))).decisions.filter((decision) => decision.id === "STORE-DECISION-005");
    expect(items.map((item) => item.key)).toEqual([`${PROJECT_ID}|${rel}`]);
    expect(JSON.stringify(items)).not.toContain(temp);
  });

  /**
   * The round 5 case: a young record whose file is in this checkout, and an older record of the same assignment and
   * the same path inside the project that names a folder that is not found.
   */
  async function youngAndOldRecord(root: string, oldDigest?: string) {
    const job = await openJob(root);
    const backup = await backupNotes(root, job);
    const rel = `.make-docs/backup/factory/${job.assignmentId}/notes/plan.md`;
    const other = path.join(temp, "old-folder");
    withStoreDatabase(store, (db) => {
      const young = db.prepare("SELECT content_digest AS digest FROM factory_backups WHERE backup_path = ?").get(backup) as { digest: string };
      db.prepare("INSERT INTO factory_backups (project_id, assignment_id, original_path, backup_path, content_digest, backed_up_at) VALUES (?, ?, ?, ?, ?, ?)")
        .run(PROJECT_ID, job.assignmentId, path.join(other, "notes/plan.md"), path.join(other, rel), oldDigest ?? young.digest, later(-40).toISOString());
    });
    return { job, backup, rel };
  }

  it("routine cleanup: an old record of a folder that is not found never takes the file of a young live record with the same assignment, path, and hash (round 5, item 2)", async () => {
    const root = project();
    const { backup, rel } = await youngAndOldRecord(root);
    // The old record is due. The young one is not.
    const cleaned = await call("factory.restore", { targetRoot: root }, temp, later(1));
    expect(cleaned.backupCleanup).toEqual({ removed: 0, kept: [expect.objectContaining({ backup: rel, where: "checkout-missing", due: "older-than-30-days" })] });
    // The live record keeps its file, and both records stay.
    expect(readFileSync(backup, "utf8")).toBe("The first plan.\n");
    expect(count("factory_backups")).toBe(2);
    expect(count("factory_backups", `WHERE backup_path = '${backup.replaceAll("'", "''")}'`)).toBe(1);
  });

  it("reviewed removal: the file of a live record is counted once, and an old record with the same path is dropped as not found, with the same hash and with another hash (round 5, item 3)", async () => {
    for (const [name, oldDigest] of [["same", undefined], ["other", "d".repeat(64)]] as const) {
      const root = project(`aurora-${name}`);
      const { job, backup, rel } = await youngAndOldRecord(root, oldDigest);
      await cancel(root, job);
      const review = await call("factory.workflow.clean", { targetRoot: root, workflow: "ship" });
      // One file is on the disk, so the review counts one file. The old record goes with no file. Nothing stops the removal.
      expect(review, name).toMatchObject({ removable: true, backupFiles: 1, backupsChanged: [], backupsOutOfReach: [], counts: { factory_backups: 2 } });
      expect(review.backupsByCheckout, name).toEqual([{ checkoutId: expect.any(String), root, files: 1 }]);
      expect(review.backupsDropped, name).toEqual([expect.objectContaining({ backup: rel })]);
      expect(review.lines, name).toContain("- 2 backup records: 1 with its backup file, and 1 dropped with no file.");
      expect(review.lines.join("\n"), name).not.toContain("is not proved to be the recorded one");
      const removed = await call("factory.workflow.clean", { targetRoot: root, workflow: "ship", review: review.reviewDigest });
      expect(removed, name).toMatchObject({ result: "removed", backupFilesRemoved: 1, backupsDropped: [rel], counts: { factory_backups: 2 } });
      expect(existsSync(backup), name).toBe(false);
      expect(count("factory_backups"), name).toBe(0);
      // The next project of this loop uses a fresh Store.
      rmSync(store, { recursive: true, force: true });
    }
  });

  it("splits a backup path by the record's original path when the backed-up file's own path holds the marker and the same assignment ID (round 5, item 4)", async () => {
    const twice = "/r/.make-docs/backup/factory/fa-1/notes/.make-docs/backup/factory/fa-1/in.md";
    expect(splitFactoryBackupPath(twice, "fa-1", "/r/notes/.make-docs/backup/factory/fa-1/in.md")).toEqual({ root: "/r", projectPath: ".make-docs/backup/factory/fa-1/notes/.make-docs/backup/factory/fa-1/in.md" });
    // Without the original path, and with one that fits no marker, the present rule holds: the last marker.
    for (const original of [undefined, null, "/elsewhere/in.md"]) {
      expect(splitFactoryBackupPath(twice, "fa-1", original)).toEqual({ root: "/r/.make-docs/backup/factory/fa-1/notes", projectPath: ".make-docs/backup/factory/fa-1/in.md" });
    }
    // A real record: the file's own path holds the marker and this assignment's ID.
    const first = project();
    await readyWorkflow(first);
    const second = secondCheckout("aurora-two");
    const { unit, claimId } = claimedUnit(second);
    const started = await call("factory.assignment.start", { targetRoot: second, workflow: "ship", unit, role: "builder", runId: "run-1", claimId });
    const assignmentId = started.assignment.assignmentId as string;
    const inner = `notes/.make-docs/backup/factory/${assignmentId}/in.md`;
    mkdirSync(path.join(second, path.dirname(inner)), { recursive: true });
    writeFileSync(path.join(second, inner), "An inner file.\n");
    const saved = await call("factory.file-backup.save", { targetRoot: second, assignmentId, claimId, files: [inner] });
    expect(saved.result, JSON.stringify(saved)).toBe("saved");
    const rel = `.make-docs/backup/factory/${assignmentId}/${inner}`;
    await cancel(second, { claimId, assignmentId, version: started.assignment.version });
    const decisions = () => checkStore(store, defaultStoreMaintenanceEnvironment(CLI_STORE_MAINTENANCE_VERSIONS, later(31))).decisions.filter((decision) => decision.id === "STORE-DECISION-005");
    // The checkout folder is there, so the right split keeps the record out of the list.
    expect(decisions()).toEqual([]);
    rmSync(second, { recursive: true, force: true });
    // setup store check, cleanup, and the removal review all give the whole path inside the project.
    expect(decisions().map((item) => item.key)).toEqual([`${PROJECT_ID}|${rel}`]);
    expect((await call("factory.restore", { targetRoot: first }, temp, later(31))).backupCleanup.kept).toEqual([expect.objectContaining({ backup: rel })]);
    expect((await call("factory.workflow.clean", { targetRoot: first, workflow: "ship" })).backupsDropped).toEqual([expect.objectContaining({ backup: rel })]);
  });

  it("allows a derive step only on a decision item, never on a fixed rule (round 5, item 5)", () => {
    for (const rule of STORE_FIXED_RULES) for (const query of rule.candidates) expect(query.derive, rule.id).toBeUndefined();
    expect(STORE_DECISION_ITEMS.find((item) => item.id === "STORE-DECISION-005")!.candidates[0]!.derive).toBeTypeOf("function");
  });

  it("does not drop a record while its file is still on this computer in a folder that is not a bound checkout; with a link in another path, the refusal text matches its code (re-check finding 2)", async () => {
    const first = project();
    // Job A: a backup in the first checkout, whose assignment folder becomes a link.
    const jobA = await openJob(first);
    const backupA = await backupNotes(first, jobA);
    await cancel(first, jobA);
    // Job B: a backup in a second checkout, which then stops being a bound checkout while its folder stays.
    const second = secondCheckout("aurora-two");
    const unitB = claimedUnit(second, "Write more notes");
    const startedB = await call("factory.assignment.start", { targetRoot: second, workflow: "ship", unit: unitB.unit, role: "builder", runId: "run-1", claimId: unitB.claimId });
    expect(startedB.result, JSON.stringify(startedB)).toBe("started");
    const jobB = { claimId: unitB.claimId, assignmentId: startedB.assignment.assignmentId as string, version: startedB.assignment.version as number };
    const backupB = await backupNotes(second, jobB);
    await cancel(second, jobB);
    withStoreDatabase(store, (db) => db.prepare("DELETE FROM installation_checkouts WHERE checkout_id = ?").run(startedB.checkout.checkoutId));
    const folderA = path.dirname(path.dirname(backupA));
    const outside = path.join(temp, "outside-a");
    renameSync(folderA, outside);
    symlinkSync(outside, folderA);

    const review = await call("factory.workflow.clean", { targetRoot: first, workflow: "ship" });
    expect(review).toMatchObject({ removable: false, backupsDropped: [], backupsOutOfReach: [{ where: "checkout-missing" }], backupsBlocked: [{ where: "unsafe-path" }] });
    const before = dump();
    const refused = await call("factory.workflow.clean", { targetRoot: first, workflow: "ship", review: review.reviewDigest });
    expect(refused).toMatchObject({ result: "refused", refusal: "backup-file-out-of-reach" });
    // The reason is the one of this code: the file that is still on the computer, not the link.
    expect(refused.reason).toContain("still on this computer, in a folder that is not a bound checkout of this project");
    expect(refused.reason).toContain(`.make-docs/backup/factory/${jobB.assignmentId}/notes/plan.md`);
    expect(refused.reason).not.toContain("link");
    expect(refused.reason).not.toContain(jobA.assignmentId);
    expect(refused.reason).not.toContain(temp);
    expect(dump()).toBe(before);
    expect(existsSync(backupB)).toBe(true);
    // The unbound folder is removed: its record is now gone for good and no longer stops the removal. The link still does.
    rmSync(second, { recursive: true, force: true });
    const second2 = await call("factory.workflow.clean", { targetRoot: first, workflow: "ship" });
    expect(second2).toMatchObject({ removable: false, backupsOutOfReach: [], backupsDropped: [{ assignmentId: jobB.assignmentId }], backupsBlocked: [{ where: "unsafe-path" }] });
    const refused2 = await call("factory.workflow.clean", { targetRoot: first, workflow: "ship", review: second2.reviewDigest });
    expect(refused2).toMatchObject({ result: "refused", refusal: "backup-path-unsafe" });
    expect(refused2.reason).toContain("Make Docs deletes nothing through a link.");
    expect(refused2.reason).toContain(jobA.assignmentId);
    expect(refused2.reason).not.toContain(jobB.assignmentId);
    expect(count("factory_backups")).toBe(2);
  });

  it("removes a pruned project's factory rows through the scoped cleanup, in order, and keeps the machine's tools", async () => {
    const root = project();
    const job = await openJob(root);
    await call("factory.workflow.save", { targetRoot: root, workflow: "ship", grants: { add: [{ action: "deploy", scope: "once", grantedBy: "the owner" }] } });
    const used = await call("factory.assignment.save", { targetRoot: root, assignmentId: job.assignmentId, expectedVersion: job.version, claimId: job.claimId, grantUse: "deploy" });
    await cancel(root, { ...job, version: used.assignment.version });
    // No factory command can name a pruned project, so the workflow removal cannot reach these rows.
    const result = withStoreDatabase(store, (db) => {
      db.prepare("DELETE FROM work_claims WHERE project_id = ?").run(PROJECT_ID);
      db.prepare("DELETE FROM installation_checkouts WHERE project_id = ?").run(PROJECT_ID);
      db.prepare("DELETE FROM project_register WHERE project_id = ?").run(PROJECT_ID);
      return deletePrunedProjectWorkRows(db, PROJECT_ID, { exportDigest: workProjectDigest(db, PROJECT_ID), now: later(1) });
    });
    expect(result.factoryRemoved).toEqual({ factory_assignments: 1, factory_grant_uses: 1, factory_grants: 1, factory_proof_results: 1, factory_workflow_plans: 1, factory_workflow_bindings: 1 });
    expect(result.factoryKept).toEqual({ workflows: [], factory_backups: 0 });
    expect(factoryCounts()).toMatchObject({ factory_machine_tools: 2, factory_workflow_plans: 0, factory_workflow_bindings: 0, factory_grants: 0, factory_grant_uses: 0, factory_assignments: 0, factory_proof_results: 0 });
    expect(await call("factory.workflow.clean", { project: PROJECT_ID, workflow: "ship" })).toMatchObject({ result: "refused", refusal: "project-not-found" });
  });
});

/* ------------------------------------------------------------------------ */
/* Review of 2026-11-24: links, locked files, and the review digest         */
/* ------------------------------------------------------------------------ */

describe("W30 R0 Store lifecycle fixes: the removal deletes nothing through a link, and stops safely (review of 2026-11-24)", () => {
  /** A cancelled job with one backup, ready for a reviewed removal. */
  async function cancelledJobWithBackup(root: string) {
    const job = await openJob(root);
    const backup = await backupNotes(root, job);
    await cancel(root, job);
    return { job, backup, folder: path.join(root, ".make-docs/backup/factory", job.assignmentId) };
  }

  /** Review, then try the removal: it must be refused with `refusal` and change nothing. */
  async function expectRefusedRemoval(root: string, refusal: string): Promise<Value> {
    const review = await call("factory.workflow.clean", { targetRoot: root, workflow: "ship" });
    expect(review, JSON.stringify(review)).toMatchObject({ result: "reviewed", removable: false });
    const before = dump();
    const refused = await call("factory.workflow.clean", { targetRoot: root, workflow: "ship", review: review.reviewDigest });
    expect(refused, JSON.stringify(refused)).toMatchObject({ result: "refused", refusal });
    expect(dump()).toBe(before);
    // Plain words: no raw system error and no absolute path.
    // The review lines name the checkout once, in the config line; every line about a backup file names no folder.
    const text = JSON.stringify([review.lines.filter((line: string) => line.includes("cannot be deleted")), review.backupsBlocked, refused.reason, refused.nextAction, refused.details, refused.lines]);
    for (const raw of ["ENOTDIR", "EACCES", "EPERM", temp]) expect(text, raw).not.toContain(raw);
    return { review, refused };
  }

  it("linked assignment folder: refuses with backup-path-unsafe and deletes nothing outside the backup folder", async () => {
    const root = project();
    const { job, backup, folder } = await cancelledJobWithBackup(root);
    // The assignment folder is replaced by a link to a folder outside the backup folder.
    const outside = path.join(temp, "outside", job.assignmentId);
    mkdirSync(path.dirname(outside), { recursive: true });
    renameSync(folder, outside);
    symlinkSync(outside, folder);
    const outsideFile = path.join(outside, "notes/plan.md");
    expect(readFileSync(backup, "utf8")).toBe("The first plan.\n");
    expect(factoryBackupPathState(root, backup)).toBe("unsafe-path");
    const { review } = await expectRefusedRemoval(root, "backup-path-unsafe");
    expect(review.backupsBlocked).toEqual([expect.objectContaining({ backup: `.make-docs/backup/factory/${job.assignmentId}/notes/plan.md`, where: "unsafe-path" })]);
    expect(review.lines.join("\n")).toContain("Make Docs deletes nothing through a link.");
    // The file outside the backup folder, the link, and the record all stay.
    expect(readFileSync(outsideFile, "utf8")).toBe("The first plan.\n");
    expect(lstatSync(folder).isSymbolicLink()).toBe(true);
    expect(count("factory_backups")).toBe(1);
    // Routine cleanup also deletes nothing through the link: it keeps the record and says why.
    const cleaned = await call("factory.restore", { targetRoot: root }, temp, later(31));
    expect(cleaned.backupCleanup).toEqual({ removed: 0, kept: [expect.objectContaining({ where: "unsafe-path", due: "older-than-30-days" })] });
    expect(cleaned.lines.join("\n")).toContain("Kept 1 backup record(s) and deleted no file for them");
    expect(readFileSync(outsideFile, "utf8")).toBe("The first plan.\n");
    expect(count("factory_backups")).toBe(1);
    // The link is replaced by the real folder: the removal then works.
    rmSync(folder);
    renameSync(outside, folder);
    const review2 = await call("factory.workflow.clean", { targetRoot: root, workflow: "ship" });
    expect(await call("factory.workflow.clean", { targetRoot: root, workflow: "ship", review: review2.reviewDigest })).toMatchObject({ result: "removed", backupFilesRemoved: 1 });
    expect(existsSync(backup)).toBe(false);
  });

  it("linked file: refuses when the backup file itself is a link, and the file that it points to stays", async () => {
    const root = project();
    const { backup } = await cancelledJobWithBackup(root);
    const target = path.join(temp, "precious.md");
    writeFileSync(target, "Do not delete.\n");
    rmSync(backup);
    symlinkSync(target, backup);
    await expectRefusedRemoval(root, "backup-path-unsafe");
    expect(readFileSync(target, "utf8")).toBe("Do not delete.\n");
    expect(lstatSync(backup).isSymbolicLink()).toBe(true);
    const cleaned = await call("factory.restore", { targetRoot: root }, temp, later(31));
    expect(cleaned.backupCleanup).toMatchObject({ removed: 0, kept: [{ where: "unsafe-path" }] });
    expect(readFileSync(target, "utf8")).toBe("Do not delete.\n");
    expect(lstatSync(backup).isSymbolicLink()).toBe(true);
  });

  it("link to another checkout: deletes nothing in the other checkout's backup folder", async () => {
    const first = project();
    const { job, folder } = await cancelledJobWithBackup(first);
    const second = secondCheckout("aurora-two");
    // The other checkout holds a file at the same path inside its own backup folder.
    const otherFolder = path.join(second, ".make-docs/backup/factory", job.assignmentId);
    mkdirSync(path.join(otherFolder, "notes"), { recursive: true });
    const otherFile = path.join(otherFolder, "notes/plan.md");
    writeFileSync(otherFile, "The other checkout's file.\n");
    rmSync(folder, { recursive: true });
    symlinkSync(otherFolder, folder);
    await expectRefusedRemoval(first, "backup-path-unsafe");
    expect(readFileSync(otherFile, "utf8")).toBe("The other checkout's file.\n");
    // Routine cleanup in the first checkout also deletes nothing through the link.
    expect((await call("factory.restore", { targetRoot: first }, temp, later(31))).backupCleanup).toMatchObject({ removed: 0, kept: [{ where: "unsafe-path" }] });
    expect(readFileSync(otherFile, "utf8")).toBe("The other checkout's file.\n");
    expect(count("factory_backups")).toBe(1);
  });

  it("linked checkout root: cleanup and the removal work through a link at the checkout root, and a link below the root is still refused (owner decision 2026-11-24)", async () => {
    // The person reaches the checkout through a symbolic link to its folder.
    const real = project("real-aurora");
    const link = path.join(temp, "link-aurora");
    symlinkSync(real, link);
    expect(lstatSync(link).isSymbolicLink()).toBe(true);
    await readyWorkflow(link);
    // Cleanup through the linked root: accepted work removes its backup file with its record.
    const one = claimedUnit(link, "First notes");
    const startedOne = await call("factory.assignment.start", { targetRoot: link, workflow: "ship", unit: one.unit, role: "builder", runId: "run-1", claimId: one.claimId });
    expect(startedOne.result, JSON.stringify(startedOne)).toBe("started");
    const jobOne = { claimId: one.claimId, assignmentId: startedOne.assignment.assignmentId as string, version: startedOne.assignment.version as number };
    const backupOne = await backupNotes(link, jobOne);
    expect(existsSync(backupOne)).toBe(true);
    expect((await acceptJob(link, jobOne)).backupCleanup).toEqual({ removed: 1, kept: [] });
    expect(existsSync(backupOne)).toBe(false);
    // A second job with a backup, for the removal.
    const two = claimedUnit(link, "Second notes");
    const startedTwo = await call("factory.assignment.start", { targetRoot: link, workflow: "ship", unit: two.unit, role: "builder", runId: "run-1", claimId: two.claimId });
    const jobTwo = { claimId: two.claimId, assignmentId: startedTwo.assignment.assignmentId as string, version: startedTwo.assignment.version as number };
    const backupTwo = await backupNotes(link, jobTwo);
    await cancel(link, jobTwo);
    const realBackup = path.join(real, ".make-docs/backup/factory", jobTwo.assignmentId, "notes/plan.md");
    expect(existsSync(realBackup)).toBe(true);
    // A link below the root is still refused, also when the call comes through the linked root.
    const notes = path.dirname(realBackup);
    const outside = path.join(temp, "outside-notes");
    renameSync(notes, outside);
    symlinkSync(outside, notes);
    const blocked = await call("factory.workflow.clean", { targetRoot: link, workflow: "ship" });
    expect(blocked).toMatchObject({ removable: false, backupsBlocked: [{ where: "unsafe-path" }] });
    expect(await call("factory.workflow.clean", { targetRoot: link, workflow: "ship", review: blocked.reviewDigest })).toMatchObject({ result: "refused", refusal: "backup-path-unsafe" });
    expect((await call("factory.restore", { targetRoot: link }, temp, later(31))).backupCleanup).toMatchObject({ removed: 0, kept: [{ where: "unsafe-path" }] });
    expect(readFileSync(path.join(outside, "plan.md"), "utf8")).toBe("The first plan.\n");
    // The link below the root is replaced by the real folder: the removal works through the linked root.
    rmSync(notes);
    renameSync(outside, notes);
    const review = await call("factory.workflow.clean", { targetRoot: link, workflow: "ship" });
    expect(review).toMatchObject({ removable: true, backupFiles: 1, backupsBlocked: [] });
    expect(await call("factory.workflow.clean", { targetRoot: link, workflow: "ship", review: review.reviewDigest })).toMatchObject({ result: "removed", backupFilesRemoved: 1 });
    expect(existsSync(realBackup)).toBe(false);
    expect(existsSync(backupTwo)).toBe(false);
    expect(factoryCounts()).toMatchObject({ factory_backups: 0, factory_workflow_bindings: 0 });
  });

  it("locked folder: the check before the first delete refuses with backup-file-locked, and nothing changes", async () => {
    const root = project();
    const { backup } = await cancelledJobWithBackup(root);
    chmodSync(path.dirname(backup), 0o555);
    try {
      const { review } = await expectRefusedRemoval(root, "backup-file-locked");
      expect(review.backupsBlocked).toEqual([expect.objectContaining({ where: "locked" })]);
      expect(review.lines.join("\n")).toContain("This account cannot delete in that folder. Make the folder writable for this account.");
      expect(existsSync(backup)).toBe(true);
      // Routine cleanup keeps the record with its file.
      const cleaned = await call("factory.restore", { targetRoot: root }, temp, later(31));
      expect(cleaned.backupCleanup).toMatchObject({ removed: 0, kept: [{ where: "locked" }] });
      expect(existsSync(backup)).toBe(true);
      expect(count("factory_backups")).toBe(1);
    } finally {
      chmodSync(path.dirname(backup), 0o755);
    }
  });

  it("a delete that fails after the checks: the result is stopped, names what went and what stayed, and the Store matches the disk", async () => {
    const root = project();
    const job = await openJob(root);
    mkdirSync(path.join(root, "notes"), { recursive: true });
    for (const name of ["a.md", "b.md", "c.md"]) writeFileSync(path.join(root, "notes", name), `File ${name}.\n`);
    const saved = await call("factory.file-backup.save", { targetRoot: root, assignmentId: job.assignmentId, claimId: job.claimId, files: ["notes/a.md", "notes/b.md", "notes/c.md"] });
    expect(saved.result, JSON.stringify(saved)).toBe("saved");
    await cancel(root, job);
    const rel = (name: string) => `.make-docs/backup/factory/${job.assignmentId}/notes/${name}`;
    const review = await call("factory.workflow.clean", { targetRoot: root, workflow: "ship" });
    expect(review).toMatchObject({ removable: true, counts: { factory_backups: 3 } });
    // The second delete fails with a raw system error that names an absolute path.
    const real = factoryBackupFileRemover.remove;
    let calls = 0;
    const spy = vi.spyOn(factoryBackupFileRemover, "remove").mockImplementation((file: string) => {
      calls++;
      if (calls === 2) throw Object.assign(new Error(`EACCES: permission denied, unlink '${file}'`), { code: "EACCES" });
      real(file);
    });
    const stopped = await call("factory.workflow.clean", { targetRoot: root, workflow: "ship", review: review.reviewDigest });
    spy.mockRestore();
    expect(stopped).toMatchObject({
      operation: "factory.workflow.clean",
      result: "stopped",
      accepted: false,
      refusal: "backup-file-locked",
      actedOn: { kind: "project", projectName: "aurora" },
      backupsRemoved: [rel("a.md")],
      backupsKept: [rel("b.md"), rel("c.md")],
      stoppedAt: { backup: rel("b.md"), why: "delete-failed" },
    });
    // The checks passed, so the cause is not known: the words stay general and do not blame the folder (re-check finding 3).
    expect(stopped.reason).toBe(`Make Docs could not delete the backup file ${rel("b.md")}. The delete did not work. The file or its folder can be locked or protected.`);
    expect(stopped.reason).not.toContain("cannot delete in that folder");
    expect(stopped.nextAction).toContain("Check that this account can delete the file: its folder must be writable, and the file must not be locked or protected.");
    expect(stopped.lines[0]).toContain(`Stopped: the removal of saved workflow ship from project aurora (${PROJECT_ID}) is not complete.`);
    expect(stopped.lines.join("\n")).toContain(`Removed 1 backup file with its record: ${rel("a.md")}.`);
    expect(stopped.lines.join("\n")).toContain(`Kept 2 backup files with their records: ${rel("b.md")}, ${rel("c.md")}.`);
    expect(stopped.lines.join("\n")).toContain("Then review again with make-docs factory workflow clean ship");
    for (const raw of ["EACCES", "permission denied", temp]) expect(JSON.stringify({ ...stopped, checkout: null }), raw).not.toContain(raw);
    // The Store matches the disk: one record went with its file, two stay with theirs, and every other row stays.
    expect(existsSync(path.join(root, rel("a.md")))).toBe(false);
    expect(existsSync(path.join(root, rel("b.md")))).toBe(true);
    expect(existsSync(path.join(root, rel("c.md")))).toBe(true);
    expect(factoryCounts()).toMatchObject({ factory_backups: 2, factory_assignments: 1, factory_proof_results: 1, factory_workflow_plans: 1, factory_workflow_bindings: 1 });
    // The old digest no longer matches. A new review and a second run finish the removal.
    expect(await call("factory.workflow.clean", { targetRoot: root, workflow: "ship", review: review.reviewDigest })).toMatchObject({ result: "refused", refusal: "review-mismatch" });
    const again = await call("factory.workflow.clean", { targetRoot: root, workflow: "ship" });
    expect(again).toMatchObject({ removable: true, counts: { factory_backups: 2 } });
    expect(await call("factory.workflow.clean", { targetRoot: root, workflow: "ship", review: again.reviewDigest })).toMatchObject({ result: "removed", backupFilesRemoved: 2 });
    expect(factoryCounts()).toMatchObject({ factory_backups: 0, factory_workflow_bindings: 0 });
  });

  it("binds the review digest to the bytes of each backup file: a file changed after the review gives review-mismatch, and the changed file stays (re-check finding 1)", async () => {
    const root = project();
    const { backup } = await cancelledJobWithBackup(root);
    const review = await call("factory.workflow.clean", { targetRoot: root, workflow: "ship" });
    expect(review).toMatchObject({ removable: true, counts: { factory_backups: 1 } });
    // New bytes at the same path. The Store record, with its recorded hash, does not change.
    const records = dump();
    writeFileSync(backup, "Other bytes that the person did not review.\n");
    expect(dump()).toBe(records);
    const refused = await call("factory.workflow.clean", { targetRoot: root, workflow: "ship", review: review.reviewDigest });
    expect(refused).toMatchObject({ result: "refused", refusal: "review-mismatch" });
    expect(readFileSync(backup, "utf8")).toBe("Other bytes that the person did not review.\n");
    expect(dump()).toBe(records);
    // A new review sees the changed file and gives another digest, which then removes it.
    const again = await call("factory.workflow.clean", { targetRoot: root, workflow: "ship" });
    expect(again.reviewDigest).not.toBe(review.reviewDigest);
    expect(await call("factory.workflow.clean", { targetRoot: root, workflow: "ship", review: again.reviewDigest })).toMatchObject({ result: "removed", backupFilesRemoved: 1 });
    expect(existsSync(backup)).toBe(false);
  });

  it("binds the review digest to record identities: a grant swapped for another after the review gives review-mismatch", async () => {
    const root = project();
    await readyWorkflow(root);
    const added = await call("factory.workflow.save", { targetRoot: root, workflow: "ship", grants: { add: [{ action: "merge", scope: "standing", grantedBy: "the owner" }] } });
    const review = await call("factory.workflow.clean", { targetRoot: root, workflow: "ship" });
    expect(review).toMatchObject({ removable: true, counts: { factory_grants: 1 } });
    // One grant is revoked and another one is added: every count is the same as at the review.
    const grant = added.grants.added[0];
    await call("factory.workflow.save", { targetRoot: root, workflow: "ship", grants: { add: [{ action: "merge", scope: "standing", grantedBy: "the owner" }], revoke: [{ grantId: grant.grantId, expectedVersion: grant.version }] } });
    const after = await call("factory.workflow.clean", { targetRoot: root, workflow: "ship" });
    expect(after.counts).toEqual(review.counts);
    expect(after.reviewDigest).not.toBe(review.reviewDigest);
    const before = dump();
    expect(await call("factory.workflow.clean", { targetRoot: root, workflow: "ship", review: review.reviewDigest })).toMatchObject({ result: "refused", refusal: "review-mismatch" });
    expect(dump()).toBe(before);
    // A new test task result with the same count also changes the digest.
    const digest = (await call("factory.workflow.show", { targetRoot: root, workflow: "ship" })).live.currentPlanDigest;
    await call("factory.proof.save", { targetRoot: root, workflow: "ship", outcome: "passed", testTask: "Another test.", planDigest: digest, path: ["builder: tool-a"], manualSteps: [], expectedVersion: 1 }, temp, later(1));
    const third = await call("factory.workflow.clean", { targetRoot: root, workflow: "ship" });
    expect(third.counts).toEqual(review.counts);
    expect(third.reviewDigest).not.toBe(after.reviewDigest);
    expect(await call("factory.workflow.clean", { targetRoot: root, workflow: "ship", review: after.reviewDigest })).toMatchObject({ result: "refused", refusal: "review-mismatch" });
    expect(await call("factory.workflow.clean", { targetRoot: root, workflow: "ship", review: third.reviewDigest })).toMatchObject({ result: "removed" });
  });

  it("returns factoryRemoved and factoryKept in the prune result (service-level: no command reaches the prune yet)", async () => {
    const root = project();
    const job = await openJob(root);
    const backup = await backupNotes(root, job);
    await cancel(root, job);
    const digest = withStoreDatabase(store, (db) => {
      db.prepare("DELETE FROM work_claims WHERE project_id = ?").run(PROJECT_ID);
      db.prepare("DELETE FROM installation_checkouts WHERE project_id = ?").run(PROJECT_ID);
      return workProjectDigest(db, PROJECT_ID);
    });
    const pruned = pruneProjectFromStore({ repoRoot: root, projectId: PROJECT_ID, storeRoot: store, workExportDigest: digest });
    expect(pruned).toMatchObject({
      status: "pruned",
      registerRowKept: false,
      workRows: {
        status: "removed",
        factoryRemoved: { factory_assignments: 0, factory_grant_uses: 0, factory_grants: 0, factory_proof_results: 0, factory_workflow_plans: 0, factory_workflow_bindings: 0 },
        factoryKept: { workflows: ["ship"], factory_backups: 1 },
      },
    });
    // The workflow with a backup record stays whole, with the file.
    expect(existsSync(backup)).toBe(true);
    expect(factoryCounts()).toMatchObject({ factory_backups: 1, factory_assignments: 1, factory_workflow_bindings: 1 });
  });
});

/* ------------------------------------------------------------------------ */
/* Finding 2: a backup record goes only with its file (R-FACTORY-74)        */
/* ------------------------------------------------------------------------ */

describe("W30 R0 Store lifecycle fixes: backup records and files stay together (finding 2)", () => {
  it("same checkout: removes the file and its record together after 30 days", async () => {
    const root = project();
    const job = await openJob(root);
    const backup = await backupNotes(root, job);
    const early = await call("factory.restore", { targetRoot: root }, temp, later(10));
    expect(early.backupCleanup).toEqual({ removed: 0, kept: [] });
    expect(existsSync(backup)).toBe(true);
    const cleaned = await call("factory.restore", { targetRoot: root }, temp, later(31));
    expect(cleaned.backupCleanup).toEqual({ removed: 1, kept: [] });
    expect(existsSync(backup)).toBe(false);
    expect(count("factory_backups")).toBe(0);
  });

  it("other checkout: keeps the record and the file, reports it with a project path only, and the other checkout's cleanup removes both", async () => {
    const first = project();
    await readyWorkflow(first);
    const second = secondCheckout("aurora-two");
    const { unit, claimId } = claimedUnit(second);
    const started = await call("factory.assignment.start", { targetRoot: second, workflow: "ship", unit, role: "builder", runId: "run-1", claimId });
    const job = { claimId, assignmentId: started.assignment.assignmentId as string, version: started.assignment.version as number };
    const backup = await backupNotes(second, job);
    // Cleanup in the first checkout, after 30 days: the record is due, but its file is in the other checkout.
    const kept = await call("factory.restore", { targetRoot: first }, temp, later(31));
    expect(kept.backupCleanup).toEqual({
      removed: 0,
      kept: [{ backup: `.make-docs/backup/factory/${job.assignmentId}/notes/plan.md`, assignmentId: job.assignmentId, where: "other-checkout", checkoutId: started.checkout.checkoutId, due: "older-than-30-days" }],
    });
    expect(kept.lines.join("\n")).toContain("Kept 1 backup record(s) whose file is in another checkout of this project");
    expect(kept.lines.join("\n")).toContain("make-docs factory restore --target-root <that checkout>");
    expect(JSON.stringify(kept.backupCleanup)).not.toContain(temp);
    expect(kept.lines.filter((line: string) => line.startsWith("Kept ")).join("\n")).not.toContain(temp);
    expect(existsSync(backup)).toBe(true);
    expect(count("factory_backups")).toBe(1);
    // Cleanup in the checkout that holds the file removes the file and the record together.
    const cleaned = await call("factory.restore", { targetRoot: second }, temp, later(31));
    expect(cleaned.backupCleanup).toEqual({ removed: 1, kept: [] });
    expect(existsSync(backup)).toBe(false);
    expect(count("factory_backups")).toBe(0);
  });

  it("missing checkout: keeps the record, reports that the folder moved or is gone, and never drops it silently", async () => {
    const first = project();
    await readyWorkflow(first);
    const second = secondCheckout("aurora-two");
    const { unit, claimId } = claimedUnit(second);
    const started = await call("factory.assignment.start", { targetRoot: second, workflow: "ship", unit, role: "builder", runId: "run-1", claimId });
    const job = { claimId, assignmentId: started.assignment.assignmentId as string, version: started.assignment.version as number };
    await backupNotes(second, job);
    rmSync(second, { recursive: true, force: true });
    for (const days of [31, 400]) {
      const kept = await call("factory.restore", { targetRoot: first }, temp, later(days));
      expect(kept.backupCleanup).toEqual({
        removed: 0,
        kept: [{ backup: `.make-docs/backup/factory/${job.assignmentId}/notes/plan.md`, assignmentId: job.assignmentId, where: "checkout-missing", checkoutId: started.checkout.checkoutId, due: "older-than-30-days" }],
      });
      expect(kept.lines.join("\n")).toContain("Kept 1 backup record(s) whose checkout folder moved or is gone");
      expect(count("factory_backups")).toBe(1);
    }
    // setup store check shows the kept record as a decision item, with the path inside the project only.
    const check = checkStore(store, defaultStoreMaintenanceEnvironment(CLI_STORE_MAINTENANCE_VERSIONS, later(31)));
    const items = check.decisions.filter((decision) => decision.id === "STORE-DECISION-005");
    expect(items).toHaveLength(1);
    expect(items[0]!.reason).toBe(`The factory backup record for .make-docs/backup/factory/${job.assignmentId}/notes/plan.md in project ${PROJECT_ID} names a file in a checkout folder that is missing, or that cannot be checked from this computer. Make Docs removes a backup record only together with its file, so the record stays.`);
    expect(JSON.stringify(items)).not.toContain(temp);
    expect(count("factory_backups")).toBe(1);
  });

  it("setup store check splits a backup path at the last backup folder marker, also when the checkout folder's own path holds the marker (re-check finding 4)", async () => {
    const first = project();
    await readyWorkflow(first);
    // The checkout folder's own path holds `.make-docs` and the whole backup folder marker.
    const second = secondCheckout(".make-docs-area/.make-docs/backup/factory/deep");
    const { unit, claimId } = claimedUnit(second);
    const started = await call("factory.assignment.start", { targetRoot: second, workflow: "ship", unit, role: "builder", runId: "run-1", claimId });
    expect(started.result, JSON.stringify(started)).toBe("started");
    const job = { claimId, assignmentId: started.assignment.assignmentId as string, version: started.assignment.version as number };
    await backupNotes(second, job);
    const rel = `.make-docs/backup/factory/${job.assignmentId}/notes/plan.md`;
    const decisions = () => checkStore(store, defaultStoreMaintenanceEnvironment(CLI_STORE_MAINTENANCE_VERSIONS, later(1))).decisions.filter((decision) => decision.id === "STORE-DECISION-005");
    // The checkout folder is there: the split gives that folder, so the folder proof keeps the record out of the list.
    expect(decisions()).toEqual([]);
    rmSync(second, { recursive: true, force: true });
    const items = decisions();
    expect(items).toHaveLength(1);
    expect(items[0]!.key).toBe(`${PROJECT_ID}|${rel}`);
    expect(items[0]!.reason).toContain(`The factory backup record for ${rel} in project ${PROJECT_ID} names a file`);
    expect(JSON.stringify(items)).not.toContain("deep");
  });

  it("accepted work: the assignment save removes the backup file and its record in the same checkout", async () => {
    const root = project();
    const job = await openJob(root);
    const backup = await backupNotes(root, job);
    const accepted = await acceptJob(root, job);
    expect(accepted.backupCleanup).toEqual({ removed: 1, kept: [] });
    expect(existsSync(backup)).toBe(false);
    expect(count("factory_backups")).toBe(0);
  });
});

/* ------------------------------------------------------------------------ */
/* Finding 3: the latest test result for a plan decides (R-FACTORY-12)      */
/* ------------------------------------------------------------------------ */

describe("W30 R0 Store lifecycle fixes: readiness after a failed test task (finding 3)", () => {
  const proofInput = (root: string, outcome: string, planDigest: string, expectedVersion: number | null = null) =>
    ({ targetRoot: root, workflow: "ship", outcome, testTask: "Write one line and review it.", planDigest, path: ["builder: tool-a"], manualSteps: [], expectedVersion });

  it("makes a ready workflow wired with test-failed after a failed test task, takes no new work, and returns to ready after a pass", async () => {
    const root = project();
    await readyWorkflow(root);
    const { unit, claimId } = claimedUnit(root);
    const digest = (await call("factory.workflow.show", { targetRoot: root, workflow: "ship" })).live.currentPlanDigest as string;
    expect(FACTORY_READINESS_CODES).toEqual(["test-failed"]);

    const failed = await call("factory.proof.save", proofInput(root, "failed", digest), temp, later(1));
    expect(failed).toMatchObject({ result: "saved", outcome: "failed", readiness: "wired", readinessCode: "test-failed", readyEnded: true, readyRevision: null });
    expect(failed.lines.join("\n")).toContain("The workflow was ready, and this failed test task ends that");
    expect(failed.lines.join("\n")).toContain(`make-docs factory proof save --plan-digest ${digest}`);

    // workflow show and status say why, with the code, and name the fix.
    const shown = await call("factory.workflow.show", { targetRoot: root, workflow: "ship" });
    expect(shown.live).toMatchObject({ readiness: "wired", readinessCode: "test-failed", readyRevision: null, matchedRevision: 1 });
expect(shown.live.reason).toBe(`It failed at ${later(1).toISOString()}, so the workflow takes no new work. Reason code: test-failed.`);
    expect(shown.live.nextStep).toContain("run the test task again under plan revision 1 and record a pass with make-docs factory proof save");
    expect(shown.binding.savedReadiness).toBe("wired");
    const status = await call("factory.status", { targetRoot: root });
    expect(status.checkouts[0].workflows[0]).toMatchObject({ readiness: "wired", readinessCode: "test-failed" });
    const statusText = status.lines.join("\n");
    expect(statusText).toContain("Workflow ship: wired");
    expect(statusText).toContain("Reason code: test-failed.");
    expect(statusText).toContain("Next: Fix what the test task found.");
    // It takes no new work, and a save that asks for ready is refused.
    const refusedStart = await call("factory.assignment.start", { targetRoot: root, workflow: "ship", unit, role: "builder", runId: "run-1", claimId });
    expect(refusedStart).toMatchObject({ result: "refused", refusal: "not-ready" });
    // The refusal names the code and the next step: pass a new test task.
    const startText = refusedStart.lines.join("\n");
    expect(startText).toContain("Reason code: test-failed.");
    expect(startText).toContain("record a pass with make-docs factory proof save");
    // An older pass exists, so the words never say that no test task has passed.
    expect(startText).toContain(`- The workflow is wired: saved and proved, but the latest test task under this plan failed. It failed at ${later(1).toISOString()}, so the workflow takes no new work. Reason code: test-failed. Next: Fix what the test task found.`);
    // Each output says once that the latest test task failed (re-check finding 5).
    for (const text of [startText, statusText, shown.lines.join("\n")]) expect(text.split("latest test task under this plan failed").length - 1).toBe(1);
    expect(statusText).toContain("Workflow ship: wired: saved and proved, but the latest test task under this plan failed.");
    expect(`${startText}\n${statusText}\n${shown.lines.join("\n")}`).not.toContain("no test task has passed under this plan");
    expect(await call("factory.workflow.save", { targetRoot: root, workflow: "ship", binding: BINDING, expectedVersion: shown.binding.version, readiness: "ready" })).toMatchObject({ result: "refused", refusal: "proof-missing" });
    // A save that changes nothing does not bring ready back.
    const resaved = await call("factory.workflow.save", { targetRoot: root, workflow: "ship", binding: BINDING, expectedVersion: shown.binding.version });
    expect(resaved).toMatchObject({ result: "saved", readiness: "wired", readyRevision: null });

    // A pass returns it to ready, and it takes work again.
    const passed = await call("factory.proof.save", proofInput(root, "passed", digest, 1), temp, later(2));
    expect(passed).toMatchObject({ result: "saved", readiness: "ready", readinessCode: null, readyRevision: 1 });
    expect((await call("factory.workflow.show", { targetRoot: root, workflow: "ship" })).live).toMatchObject({ readiness: "ready", readinessCode: null, reason: null });
    expect(await call("factory.assignment.start", { targetRoot: root, workflow: "ship", unit, role: "builder", runId: "run-1", claimId })).toMatchObject({ result: "started" });
    // The Store still keeps exactly the two results that the rule needs.
    expect(count("factory_proof_results")).toBe(2);
  });

  it("leaves the ready revision alone after a failed test of another plan, and refuses a digest that is not the current plan's", async () => {
    const root = project();
    await readyWorkflow(root);
    const first = (await call("factory.workflow.show", { targetRoot: root, workflow: "ship" })).live.currentPlanDigest as string;
    // A new plan: revision 2, wired. Its test fails. Revision 1 stays the ready revision.
    setRoundLimit(root, 5);
    const saved = await call("factory.workflow.save", { targetRoot: root, workflow: "ship", binding: BINDING, expectedVersion: 2 });
    expect(saved).toMatchObject({ result: "saved", readiness: "wired", readyRevision: 1, revision: { number: 2 } });
    const failed = await call("factory.proof.save", proofInput(root, "failed", saved.revision.planDigest), temp, later(1));
    expect(failed).toMatchObject({ result: "saved", readyEnded: false, readyRevision: 1, readinessCode: "test-failed" });
    expect((await call("factory.workflow.show", { targetRoot: root, workflow: "ship" })).live).toMatchObject({ readiness: "wired", readinessCode: "test-failed", readyRevision: 1 });
    // A failed test under the old digest is refused while it is not the current plan, and changes nothing.
    const before = dump();
    expect(await call("factory.proof.save", proofInput(root, "failed", first, 1), temp, later(2))).toMatchObject({ result: "refused", refusal: "plan-digest-mismatch" });
    expect(dump()).toBe(before);
    // The exact plan of the ready revision comes back: ready again with no new test, because its latest result is a pass.
    setRoundLimit(root, 3);
    expect((await call("factory.workflow.show", { targetRoot: root, workflow: "ship" })).live).toMatchObject({ readiness: "ready", readinessCode: null, readyRevision: 1 });
  });

  it("Store service: a failed result for a kept revision that is not the ready one changes no binding, and one for the ready revision ends it", async () => {
    const root = project();
    await readyWorkflow(root);
    setRoundLimit(root, 5);
    const saved = await call("factory.workflow.save", { targetRoot: root, workflow: "ship", binding: BINDING, expectedVersion: 2 });
    setRoundLimit(root, 3);
    withStoreDatabase(store, (db) => {
      const before = readFactoryWorkflowBinding(db, PROJECT_ID, "ship")!;
      expect(findFactoryPlanRevisionByDigest(db, PROJECT_ID, "ship", saved.revision.planDigest)?.revision).toBe(2);
      saveFactoryProofResult(db, { projectId: PROJECT_ID, workflowName: "ship", outcome: "failed", testTask: "A test.", planDigest: saved.revision.planDigest, path: ["a step"], manualSteps: [] }, { expectedVersion: null, now: later(1) });
      expect(readFactoryWorkflowBinding(db, PROJECT_ID, "ship")).toEqual(before);
      const ready = db.prepare("SELECT plan_digest FROM factory_workflow_plans WHERE project_id = ? AND workflow_name = 'ship' AND revision = 1").get(PROJECT_ID) as { plan_digest: string };
      saveFactoryProofResult(db, { projectId: PROJECT_ID, workflowName: "ship", outcome: "failed", testTask: "A test.", planDigest: ready.plan_digest, path: ["a step"], manualSteps: [] }, { expectedVersion: 1, now: later(2) });
      expect(readFactoryWorkflowBinding(db, PROJECT_ID, "ship")).toMatchObject({ readiness: "wired", readyRevision: null, version: before.version + 1 });
    });
  });
});

/* ------------------------------------------------------------------------ */
/* Finding 4: retention (R-FACTORY-24, R-FACTORY-57)                        */
/* ------------------------------------------------------------------------ */

describe("W30 R0 Store lifecycle fixes: retention (finding 4)", () => {
  it("keeps the plan revision of a final assignment through more than 10 newer revisions", async () => {
    const root = project();
    const job = await openJob(root);
    await cancel(root, job);
    // Revision 2 becomes the ready revision, so revision 1 is kept only because the final assignment names it.
    setRoundLimit(root, 4);
    let saved = await call("factory.workflow.save", { targetRoot: root, workflow: "ship", binding: BINDING, expectedVersion: 2 });
    const passed = await call("factory.proof.save", { targetRoot: root, workflow: "ship", outcome: "passed", testTask: "Write one line and review it.", planDigest: saved.revision.planDigest, path: ["builder: tool-a"], manualSteps: [], expectedVersion: 1 });
    expect(passed).toMatchObject({ readiness: "ready", readyRevision: 2 });
    let version = saved.version + 1;
    for (let limit = 5; limit <= 17; limit++) {
      setRoundLimit(root, limit);
      saved = await call("factory.workflow.save", { targetRoot: root, workflow: "ship", binding: BINDING, expectedVersion: version });
      expect(saved.result, JSON.stringify(saved)).toBe("saved");
      version = saved.version;
    }
    // 15 revisions were saved. Kept: 1 (the final assignment), 2 (ready), and the 10 newest others.
    expect(saved.revision.number).toBe(15);
    const shown = await call("factory.workflow.show", { targetRoot: root, workflow: "ship", revision: 1 });
    expect(shown.keptRevisions).toEqual([1, 2, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
    expect(shown.revision).toMatchObject({ number: 1, isReady: false });
    // The final assignment still shows the round limit of the plan that it ran under.
    const listed = await call("factory.assignment.list", { targetRoot: root, all: true });
    expect(listed.assignments).toEqual([expect.objectContaining({ assignmentId: job.assignmentId, status: "cancelled", planRevision: 1, roundLimit: 3 })]);
  });

  it("keeps a spent and an expired grant until the workflow is removed, reads grants through the index, and bounds the use rows that a read returns", async () => {
    const root = project();
    const job = await openJob(root);
    await call("factory.workflow.save", { targetRoot: root, workflow: "ship", grants: { add: [
      { action: "deploy", scope: "once", grantedBy: "the owner" },
      { action: "publish", scope: "standing", expiresAt: later(1).toISOString(), grantedBy: "the owner" },
      { action: "merge", scope: "standing", grantedBy: "the owner" },
    ] } });
    const used = await call("factory.assignment.save", { targetRoot: root, assignmentId: job.assignmentId, expectedVersion: job.version, claimId: job.claimId, grantUse: "deploy" });
    expect(used.grant).toMatchObject({ state: "spent" });
    // A year later the spent grant and the expired grant are still there, and each still refuses with its own code.
    const shown = await call("factory.workflow.show", { targetRoot: root, workflow: "ship" }, temp, later(365));
    expect(shown.grants.map((grant: Value) => [grant.action, grant.state]).sort()).toEqual([["deploy", "spent"], ["merge", "usable"], ["publish", "expired"]]);
    expect(shown.grantTotals).toEqual({ all: 3, usable: 1, spentOrExpired: 2, shown: 3 });
    withStoreDatabase(store, (db) => {
      const unitStoreId = (db.prepare("SELECT unit_store_id AS id FROM factory_assignments").get() as { id: string }).id;
      const attempt = (action: string) => {
        try {
          useFactoryGrant(db, { projectId: PROJECT_ID, workflowName: "ship", action, runId: "run-1", unitStoreId }, { now: later(2) });
          return "used";
        } catch (error) {
          return (error as { refusal: string }).refusal;
        }
      };
      expect(attempt("deploy")).toBe("grant-spent");
      expect(attempt("publish")).toBe("grant-expired");
      expect(attempt("spend")).toBe("grant-missing");
      // Every grant read of a use goes through the (project, workflow, action) index.
      const plan = db.prepare("EXPLAIN QUERY PLAN SELECT * FROM factory_grants WHERE project_id = ? AND workflow_name = ? AND action = ? AND scope IN (?) ORDER BY granted_at DESC, grant_id DESC LIMIT 1").all("p", "w", "a", "once") as Array<{ detail: string }>;
      expect(plan.map((row) => row.detail).join(" ")).toContain("idx_factory_grants_workflow");
      const usePlan = db.prepare("EXPLAIN QUERY PLAN SELECT * FROM factory_grant_uses WHERE project_id = ? AND workflow_name = ? ORDER BY used_at DESC, rowid DESC LIMIT ?").all("p", "w", 50) as Array<{ detail: string }>;
      expect(usePlan.map((row) => row.detail).join(" ")).toContain("idx_factory_grant_uses_workflow");
      // 59 more uses of the standing grant: 60 use rows in all, with the one use of the once grant.
      for (let index = 0; index < 59; index++) useFactoryGrant(db, { projectId: PROJECT_ID, workflowName: "ship", action: "merge", runId: "run-1", unitStoreId }, { now: new Date(NOW.getTime() + (index + 1) * 60_000) });
    });
    const many = await call("factory.workflow.show", { targetRoot: root, workflow: "ship" });
    expect(FACTORY_GRANT_USE_READ_MAX).toBe(50);
    expect(many.grantUseTotal).toBe(60);
    expect(many.grantUses).toHaveLength(50);
    // The newest 50, oldest first: the use of the once grant and the 9 oldest standing uses are not shown.
    expect(many.grantUses.every((use: Value) => use.action === "merge")).toBe(true);
    expect(many.grantUses.at(-1).usedAt).toBe(new Date(NOW.getTime() + 59 * 60_000).toISOString());
    expect(many.lines.join("\n")).toContain(`Shown: the newest 50 of 60 grant uses. They stay until the workflow is removed. 10 older uses are not shown. Read the next page with --uses-before ${many.grantUses[0].useId} (MCP usesBefore).`);
    expect(many).toMatchObject({ usesBefore: null, olderGrantUses: 10, olderUsesBefore: many.grantUses[0].useId });
    // The next page holds the 10 older uses, so every use can be read. No use is on two pages.
    const older = await call("factory.workflow.show", { targetRoot: root, workflow: "ship", usesBefore: many.olderUsesBefore });
    expect(older.grantUses).toHaveLength(10);
    expect(older).toMatchObject({ usesBefore: many.olderUsesBefore, olderGrantUses: 0, olderUsesBefore: null, grantUseTotal: 60 });
    expect(older.grantUses[0]).toMatchObject({ action: "deploy", scope: "once" });
    expect(new Set([...many.grantUses, ...older.grantUses].map((use: Value) => use.useId)).size).toBe(60);
    expect(older.lines.join("\n")).toContain(`Shown: 10 of 60 grant uses, the ones just older than ${many.olderUsesBefore}.`);
    // A use ID that the workflow does not hold is refused.
    expect(await call("factory.workflow.show", { targetRoot: root, workflow: "ship", usesBefore: "fu-00000000000000000000000000000000" })).toMatchObject({ result: "refused", refusal: "record-not-found" });
    expect(adaptRunCliArgv(["factory", "workflow", "show", "ship", "--uses-before", "fu-abc12345", "--project", "aurora"]).invocation.input).toEqual({ workflow: "ship", usesBefore: "fu-abc12345", project: "aurora" });
    expect(leafHelpEntry("factory.workflow.show").usage).toContain("[--uses-before <use-id>]");
    expect(count("factory_grant_uses")).toBe(60);
    expect(count("factory_grants")).toBe(3);
  });
});

/* ------------------------------------------------------------------------ */
/* Finding 5: tool fact freshness (R-FACTORY-75)                            */
/* ------------------------------------------------------------------------ */

describe("W30 R0 Store lifecycle fixes: tool fact freshness (finding 5)", () => {
  it("shows the age of each bound tool's proofs in factory status, and calls a proof older than 30 days old", async () => {
    const root = project();
    await readyWorkflow(root);
    expect(FACTORY_PROOF_OLD_AFTER_DAYS).toBe(30);
    const fresh = await call("factory.status", { targetRoot: root }, temp, later(30));
    expect(fresh.proofOldAfterDays).toBe(30);
    // Only the bound tool is listed: tool-b fills no role.
    expect(fresh.boundTools.map((tool: Value) => tool.toolId)).toEqual(["tool-a"]);
    expect(fresh.boundTools[0]).toMatchObject({ label: "Tool A", state: "available", reportedVersion: "1.0", reportedAgeDays: 30, oldestProofAgeDays: 30, hasOldProof: false });
    expect(fresh.boundTools[0].roles).toEqual([{ workflow: "ship", role: "builder" }, { workflow: "ship", role: "foreman" }, { workflow: "ship", role: "reviewer" }]);
    expect(fresh.boundTools[0].proofs).toHaveLength(5);
    expect(fresh.lines).toContain("Bound tools of this machine, with the age of each proof. A proof older than 30 days is old:");
    expect(fresh.lines).toContain("- tool-a (Tool A): available, version 1.0, last reported 30 days ago.");
    expect(fresh.lines).toContain("  - launch-agent: proved 30 days ago.");
    expect(fresh.lines.join("\n")).not.toContain("Old: older than");

    const old = await call("factory.status", { targetRoot: root }, temp, later(31));
    expect(old.boundTools[0]).toMatchObject({ oldestProofAgeDays: 31, hasOldProof: true });
    expect(old.boundTools[0].proofs.every((proof: Value) => proof.old && proof.ageDays === 31)).toBe(true);
    expect(old.lines).toContain("  - launch-agent: proved 31 days ago. Old: older than 30 days. Check the tool again and save it with make-docs factory tools save.");
    // An old proof changes no readiness.
    expect(old.checkouts[0].workflows[0]).toMatchObject({ readiness: "ready" });
    // A fresh report of the tool with new proofs makes them young again, and the plan is the same.
    const again = TOOLS({ a: 1, b: 1 }).map((tool) => ({ ...tool, state: "available", proofs: tool.proofs.map((entry) => ({ ...entry, provedAt: later(31).toISOString() })) }));
    expect((await call("factory.tools.save", { tools: again }, temp, later(31))).result).toBe("saved");
    const renewed = await call("factory.status", { targetRoot: root }, temp, later(31));
    expect(renewed.boundTools[0]).toMatchObject({ reportedAgeDays: 0, oldestProofAgeDays: 0, hasOldProof: false });
    expect(renewed.lines).toContain("- tool-a (Tool A): available, version 1.0, last reported today.");
    expect(renewed.checkouts[0].workflows[0]).toMatchObject({ readiness: "ready" });
    // One lifecycle run only: the tool list is left out.
    expect((await call("factory.status", { targetRoot: root, run: "run-1" })).boundTools).toEqual([]);
  });

  it("tells the run Skill to check its bound tools again before new work, in the Skill, its installed copy, and the contract", () => {
    for (const file of ["SKILL.md", "references/run-loop.md"]) {
      expect(readFileSync(path.join(REPO, "packages/skills/factory", file), "utf8"), file).toBe(readFileSync(path.join(REPO, ".agents/skills/factory", file), "utf8"));
    }
    const skill = readFileSync(path.join(REPO, "packages/skills/factory/SKILL.md"), "utf8");
    const loop = readFileSync(path.join(REPO, "packages/skills/factory/references/run-loop.md"), "utf8");
    expect(skill).toContain("Check each bound tool again before you take new work (rule `tools-rechecked`)");
    const section = loop.slice(loop.indexOf("### Check the Bound Tools Again"), loop.indexOf("## 2. Check Open Assignments"));
    for (const text of ["`make-docs factory tools list`", "`make-docs factory tools save`", "its version", "`available`, `missing`, or `blocked`", "`expectedVersion`", "older than 30 days", "take no new work"]) {
      expect(section, text).toContain(text);
    }
    expect(loop).toContain("Before the first step, [check the bound tools again](#check-the-bound-tools-again).");
    const template = readFileSync(path.join(REPO, "packages/docs/template/.make-docs/system/contracts/factory-contract.md"), "utf8");
    expect(readFileSync(path.join(REPO, ".make-docs/system/contracts/factory-contract.md"), "utf8")).toBe(template);
    for (const text of ["### Tool Facts Stay Fresh", "| `tools-rechecked` |", "### Removing a Workflow", "| `workflow-removal-reviewed` |", "| `backup-record-with-file` |", "| `latest-test-decides` |", "| `history-kept-until-removal` |", "Readiness codes: `test-failed`.", "| `make-docs factory workflow clean` | `factory_workflow_clean` |", "| `make-docs factory workflow clean` | Project | Write | Named project only, also for the review. |"]) {
      expect(template, text).toContain(text);
    }
  });
});

/* ------------------------------------------------------------------------ */
/* Finding 6: the Store README                                              */
/* ------------------------------------------------------------------------ */

describe("W30 R0 Store lifecycle fixes: the Store README (finding 6)", () => {
  it("names the command that writes each factory table, and no longer says that no command writes them", () => {
    const readme = readFileSync(path.join(REPO, "packages/cli/src/store/README.md"), "utf8");
    expect(readme).not.toContain("No command writes these tables yet");
    const start = readme.indexOf("### Factory (schema 9");
    const table = readme.slice(start, readme.indexOf("- `factory_machine_tools` and", start));
    const rows = table.split("\n").filter((line) => line.startsWith("| `factory "));
    const commands = NAME_CATALOG.filter((item) => item.id.startsWith("factory.") && getOperation(item.id).mutates === "write").map((item) => item.newCli).sort();
    expect(rows.map((row) => row.split("`")[1]).sort()).toEqual(commands);
    for (const name of FACTORY_STORE_TABLE_NAMES) expect(rows.some((row) => row.split("|")[2]!.includes(`\`${name}\``)), name).toBe(true);
    const row = (command: string) => rows.find((line) => line.startsWith(`| \`${command}\` `))!;
    expect(row("factory assignment start")).toContain("`factory_grant_uses`");
    expect(row("factory assignment save")).toContain("`factory_grant_uses`");
    expect(row("factory grant-use record")).toContain("`factory_grant_uses`");
    expect(row("factory workflow clean")).toContain("`factory_grant_uses`");
    for (const read of NAME_CATALOG.filter((item) => item.id.startsWith("factory.") && getOperation(item.id).mutates === "read")) expect(table, read.newCli).toContain(`\`${read.newCli}\``);
  });
});

/* ------------------------------------------------------------------------ */
/* CLI                                                                      */
/* ------------------------------------------------------------------------ */

describe("W30 R0 Store lifecycle fixes: the CLI", () => {
  it("prints the leaf help of factory workflow clean, and refuses a run that names no project with exit code 1", () => {
    const root = project();
    const help = runCliIn(root, ["factory", "workflow", "clean", "--help"]);
    expect(help.status, help.stderr).toBe(0);
    expect(help.stdout).toContain("--review <digest>");
    expect(help.stdout).toContain("Without a review digest it only reviews.");
    const refused = runCliIn(root, ["factory", "workflow", "clean", "ship", "--json"]);
    expect(refused.status, refused.stdout + refused.stderr).toBe(1);
    expect(JSON.parse(refused.stdout)).toMatchObject({ operation: "factory.workflow.clean", result: "refused", refusal: "project-missing" });
  });
});
