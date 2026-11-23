import { chmodSync, existsSync, mkdirSync, readFileSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { loadMakeDocsConfig } from "../src/config";
import { createExecutionContext } from "../src/operations/context";
import { getOperation, invokeOperation } from "../src/operations/registry";
import { computeWorkReadiness, compareWorkCoordinates } from "../src/operations/work/work-queue/readiness";
import {
  normalizeWorkUnitReference,
  renderWorkTasksList,
  workAdd,
  workAuthority,
  workClaim,
  workClose,
  workExport,
  workNext,
  workRelease,
  workReport,
  workStatus,
  workSync,
  type WorkQueueEnv,
} from "../src/operations/work/work-queue/queue";
import { WORK_QUEUE_OPERATION_IDS } from "../src/operations/work/work-queue/operations";
import { WORK_SYNC_TABLE } from "../src/operations/work/work-store/catalog";
import { WorkConfigBlockSchema, type WorkClaimRecord, type WorkUnitRecord } from "../src/operations/work/work-store/schemas";
import { WorkSettleRefusalError, readWorkSyncConfig, syncWorkFiles } from "../src/operations/work/work-store/sync";
import { adaptRunCliArgv } from "../src/run/cli";
import { platform } from "../src/platform";
import { getInstallationCheckoutId } from "../src/store/installation-state";
import { checkStore, defaultStoreMaintenanceEnvironment } from "../src/store/maintenance";
import { CLI_STORE_MAINTENANCE_VERSIONS } from "../src/operations/setup/store-ops";
import { listSyncLedger, listWorkUnits, putWorkUnit, readWorkStore, readWorkUnitNote, writeWorkStore } from "../src/store/work-store";
import {
  PROJECT_ID as FIXTURE_PROJECT_ID,
  WORK_STORE_CONTRACT_FIXTURES,
  claimIdFor,
  storeIdFor,
  type ClaimFixture,
  type ReadinessFixture,
  type UpdateFixture,
} from "./fixtures/work-store-contract";
import { cleanupTempDir, createTempDir } from "./helpers";

/**
 * W29 R0 P4: the work queue operations. No test reaches the real Store:
 * `MAKE_DOCS_HOME` points at a temporary folder. No test writes this
 * repository's files.
 */

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const NOW = new Date("2042-06-15T12:00:00.000Z");
const PROJECT_ID = "aurora-p4-project";
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

### Blockers

- The owner has not chosen a schema format.

## Stage 1 - Ship

### Tasks

- [ ] T1: Ship it.
`;

const roots: string[] = [];
let temp: string;
let store: string;

beforeEach(() => {
  temp = platform.describePath(createTempDir("make-docs-w29-p4-")).canonicalPath;
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

/** A bound checkout with the fixture backlog, after its first sync. */
function imported(extra = ""): string {
  const root = project("aurora", extra);
  write(root, INDEX, INDEX_TEXT);
  write(root, P1, P1_TEXT);
  write(root, P2, P2_TEXT);
  getInstallationCheckoutId(root, store);
  workSync(root, env(), null);
  return root;
}

function units(root: string, projectId = PROJECT_ID): WorkUnitRecord[] {
  return readWorkStore(root, (db) => listWorkUnits(db, projectId), { storeRoot: store });
}

function unitAt(root: string, coordinate: string, projectId = PROJECT_ID): WorkUnitRecord {
  const found = units(root, projectId).find((unit) => unit.coordinate === coordinate);
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

/** Seed fixture units and claims into a fresh project with the fixture project ID. */
function seeded(fixtureUnits: readonly WorkUnitRecord[], claims: readonly WorkClaimRecord[]): string {
  const root = project("fixture", "", FIXTURE_PROJECT_ID);
  getInstallationCheckoutId(root, store);
  writeWorkStore(root, (db) => {
    const order = ["wave", "revision", "phase", "stage", "task", "quick-item"];
    for (const record of [...fixtureUnits].sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind))) {
      const { revision: _revision, ...input } = record;
      putWorkUnit(db, input, { expectedVersion: null });
    }
    const insert = db.prepare("INSERT INTO work_claims VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    for (const claim of claims) {
      insert.run(claim.claimId, claim.projectId, claim.unitStoreId, claim.claimant, claim.taskHandle, claim.claimedAt, claim.renewedAt, claim.expiresAt, claim.takeoverObservation);
    }
  }, { storeRoot: store });
  return root;
}

const coordinateOfStoreId = (fixtureUnits: readonly WorkUnitRecord[], storeId: string) => fixtureUnits.find((unit) => unit.storeId === storeId)!.coordinate;

/* ------------------------------------------------------------------------ */
/* P1 parity fixtures                                                       */
/* ------------------------------------------------------------------------ */

describe("W29 R0 P4 readiness gives the P1 fixture answers (WORK-RULE-020, -021, -032, -033)", () => {
  const readiness = WORK_STORE_CONTRACT_FIXTURES.filter((fixture): fixture is ReadinessFixture => fixture.kind === "readiness");

  it.each(readiness.map((fixture) => [fixture.id, fixture] as const))("%s", (_id, fixture) => {
    const result = computeWorkReadiness(fixture.input);
    expect(result.ready.map((item) => item.coordinate)).toEqual(fixture.expected.ready);
    expect(result.waiting.map((item) => ({ coordinate: item.coordinate, reasons: item.reasons.map((reason) => reason.reason) }))).toEqual(fixture.expected.waiting);
    for (const item of result.waiting) for (const reason of item.reasons) expect(reason.nextAction.length).toBeGreaterThan(0);
  });

  it("finding 7: WSF-057 names each phase that counts as done by the fallback", () => {
    const fixture = readiness.find((candidate) => candidate.id === "WSF-057")!;
    const result = computeWorkReadiness(fixture.input);
    expect(result.doneByFallback.map((entry) => [entry.coordinate, entry.doneBy])).toEqual([["W1 R0 P1", "all-tasks-checked"]]);
  });

  it("compares coordinates part by part, with numbers as numbers, and quick items last", () => {
    const sorted = ["7", "W1 R0 P10", "W1 R0 P2", "W2 R0", "W1 R0 P2 T1", "W1 R0 P2 S1", "1"].sort(compareWorkCoordinates);
    expect(sorted).toEqual(["W1 R0 P2", "W1 R0 P2 S1", "W1 R0 P2 T1", "W1 R0 P10", "W2 R0", "1", "7"]);
  });

  it("reads unit references in any letter case, and quick items as numbers", () => {
    expect(normalizeWorkUnitReference("w29 r0 p4 t3")).toEqual({ kind: "coordinate", value: "W29 R0 P4 T3" });
    expect(normalizeWorkUnitReference("task 7")).toEqual({ kind: "quick", value: "7" });
    expect(normalizeWorkUnitReference("7")).toEqual({ kind: "quick", value: "7" });
    expect(normalizeWorkUnitReference("wu-abcdef12")).toEqual({ kind: "store-id", value: "wu-abcdef12" });
  });
});

describe("W29 R0 P4 T17 waves and archived backlogs (owner decision 2026-11-23)", () => {
  const unit = (kind: WorkUnitRecord["kind"], coordinate: string, status: WorkUnitRecord["status"] = "open", sourcePath: string | null = "docs/work/2042-a/00-index.md"): WorkUnitRecord => ({
    projectId: "p",
    storeId: storeIdFor(coordinate),
    kind,
    coordinate,
    parentStoreId: kind === "wave" ? null : storeIdFor(coordinate.split(" ").slice(0, -1).join(" ")),
    title: coordinate,
    body: null,
    recordedStatus: kind === "wave" ? null : status === "closed" ? "complete" : "active",
    status,
    closeOutcome: status === "closed" ? "done" : null,
    dependencies: [],
    unresolvedDependencies: [],
    gates: [],
    blockers: [],
    links: [],
    sourcePath,
    copyState: "kept",
    revision: 1,
  });

  it("a wave is ready when all its revisions are closed, and its revisions never wait for it", () => {
    const open = [unit("wave", "W1"), unit("revision", "W1 R0"), unit("revision", "W1 R1", "closed"), unit("phase", "W1 R0 P1")];
    const waves = computeWorkReadiness({ now: NOW, claimant: null, query: { level: "wave", includeQuickItems: false }, units: open, claims: [], conflicts: [] });
    expect(waves.ready).toEqual([]);
    expect(waves.waiting.map((item) => [item.coordinate, item.reasons.map((reason) => `${reason.reason} ${reason.coordinate}`)])).toEqual([["W1", ["dependency-open W1 R0"]]]);
    const phases = computeWorkReadiness({ now: NOW, claimant: null, query: { level: "phase", includeQuickItems: false }, units: open, claims: [], conflicts: [] });
    expect(phases.ready.map((item) => item.coordinate)).toEqual(["W1 R0 P1"]);
    const closed = [unit("wave", "W1"), unit("revision", "W1 R0", "closed"), unit("revision", "W1 R1", "closed")];
    expect(computeWorkReadiness({ now: NOW, claimant: null, query: { level: "wave", includeQuickItems: false }, units: closed, claims: [], conflicts: [] }).ready.map((item) => item.coordinate)).toEqual(["W1"]);
  });

  it("archived backlogs never show in work next, and still count as dependencies", () => {
    const archive = ".make-docs/archive/work/2042-a/01-first.md";
    const records = [
      unit("wave", "W1"),
      unit("revision", "W1 R0", "open", ".make-docs/archive/work/2042-a/00-index.md"),
      unit("phase", "W1 R0 P1", "open", archive),
      unit("wave", "W2"),
      unit("revision", "W2 R0"),
      { ...unit("phase", "W2 R0 P1"), dependencies: [{ dependsOnStoreId: storeIdFor("W1 R0 P1"), sourceText: "W1 R0 P1", source: null }] },
    ];
    const phases = computeWorkReadiness({ now: NOW, claimant: null, query: { level: "phase", includeQuickItems: false }, units: records, claims: [], conflicts: [] });
    expect(phases.ready).toEqual([]);
    expect(phases.waiting.map((item) => item.coordinate)).toEqual(["W2 R0 P1"]);
    expect(phases.waiting[0]!.reasons.map((reason) => reason.reason)).toEqual(["dependency-open"]);
    const waves = computeWorkReadiness({ now: NOW, claimant: null, query: { level: "wave", includeQuickItems: false }, units: records, claims: [], conflicts: [] });
    expect(waves.waiting.map((item) => item.coordinate)).toEqual(["W2"]);
  });
});

describe("W29 R0 P4 claims, reports, closes, and releases give the P1 fixture answers", () => {
  const claims = WORK_STORE_CONTRACT_FIXTURES.filter((fixture): fixture is ClaimFixture => fixture.kind === "claim");
  const updates = WORK_STORE_CONTRACT_FIXTURES.filter((fixture): fixture is UpdateFixture => fixture.kind === "update");

  it.each(claims.map((fixture) => [fixture.id, fixture] as const))("%s", (_id, fixture) => {
    const root = seeded(fixture.input.units, fixture.input.claims);
    const request = fixture.input.request;
    const previous = request.takeover ? fixture.input.claims.find((claim) => claim.claimId === request.takeover!.previousClaimId)! : null;
    const result = workClaim(root, env(new Date(fixture.input.now)), {
      unit: coordinateOfStoreId(fixture.input.units, request.unitStoreId),
      claimant: request.claimant,
      taskHandle: request.taskHandle,
      ttlSeconds: request.ttlSeconds,
      expectedVersion: request.expectedVersion,
      claimId: request.claimId ?? null,
      takeover: request.takeover && previous ? { previousClaimant: previous.claimant, handleObservation: request.takeover.handleObservation } : null,
    });
    expect({ result: result.result, refusal: result.refusal }).toEqual(fixture.expected);
    // T13: only the result of a new claim shows a claim ID.
    expect(result.claimId === null).toBe(result.result !== "claimed");
    for (const claim of fixture.input.claims) expect(JSON.stringify(result)).not.toContain(claim.claimId);
  });

  it.each(updates.map((fixture) => [fixture.id, fixture] as const))("%s", (_id, fixture) => {
    const root = seeded(fixture.input.units, fixture.input.claims);
    const at = env(new Date(fixture.input.now));
    const request = fixture.input.request;
    const run = () => {
      if ("report" in request) {
        const report = request.report;
        return workReport(root, at, {
          unit: coordinateOfStoreId(fixture.input.units, report.unitStoreId),
          claimId: report.claimId,
          status: report.status,
          evidencePath: report.evidencePath,
          clearBlockers: report.clearBlockers,
          metGates: report.metGates,
          note: report.note,
          expectedVersion: report.expectedVersion,
        });
      }
      if ("close" in request) {
        const close = request.close;
        return workClose(root, at, { unit: coordinateOfStoreId(fixture.input.units, close.unitStoreId), claimId: close.claimId, outcome: close.outcome, expectedVersion: close.expectedVersion });
      }
      const release = request.release;
      return workRelease(root, at, { unit: coordinateOfStoreId(fixture.input.units, release.unitStoreId), claimId: release.claimId, expectedVersion: release.expectedVersion });
    };
    const result = run();
    expect({ accepted: result.accepted, refusal: result.refusal }).toEqual({ accepted: fixture.expected.accepted, refusal: fixture.expected.refusal });
    expect(result.readyAfter ? [result.unit] : []).toEqual(fixture.expected.readyAfter);
    const parent = fixture.input.units.find((unit) => unit.storeId === fixture.input.units.find((candidate) => candidate.coordinate === result.unit)!.parentStoreId);
    if (parent) expect(unitAt(root, parent.coordinate, FIXTURE_PROJECT_ID).status === "closed").toBe(fixture.expected.parentClosed || parent.status === "closed");
  });
});

/* ------------------------------------------------------------------------ */
/* The queue on a real backlog                                              */
/* ------------------------------------------------------------------------ */

describe("W29 R0 P4 work next, claim, report, close, and release", () => {
  it("next lists ready units in order and why the others wait (A31 order, R-WORK-QUEUE-5)", () => {
    const root = imported();
    const phases = workNext(root, env(), { level: "phase", includeQuickItems: true, claimant: null, limit: null });
    expect(phases.ready.map((item) => item.coordinate)).toEqual(["W1 R0 P1"]);
    expect(phases.waiting.map((item) => [item.coordinate, item.reasons.map((reason) => reason.reason)])).toEqual([["W1 R0 P2", ["blocked"]]]);
    expect(phases.summary.endsWith("Changes nothing.")).toBe(true);
    expect(phases.sync.ran).toBe("check");
    const tasks = workNext(root, env(), { level: "task", includeQuickItems: false, claimant: null, limit: null });
    expect(tasks.ready.map((item) => item.coordinate)).toEqual(["W1 R0 P1 T1", "W1 R0 P1 T2"]);
    expect(tasks.waiting.map((item) => [item.coordinate, item.reasons.map((reason) => reason.reason)])).toEqual([
      ["W1 R0 P1 T3", ["ancestor-waiting"]],
      ["W1 R0 P2 T1", ["ancestor-waiting"]],
    ]);
  });

  it("T13: a claim ID shows only in the result of a new claim; naming the claimant never reveals or renews it", () => {
    const root = imported();
    const t1 = unitAt(root, "W1 R0 P1 T1");
    const claimed = workClaim(root, env(), { unit: "w1 r0 p1 t1", claimant: "builder-a", taskHandle: "task-a", ttlSeconds: null, expectedVersion: t1.revision, takeover: null });
    expect(claimed).toMatchObject({ result: "claimed", refusal: null, claim: { claimant: "builder-a", namedByCaller: true } });
    const id = claimed.claimId!;
    expect(id).toMatch(/^wc-/);
    // The text form shows the claim ID and the revision that report, close, and release need.
    expect(claimed.summary).toContain(`Claim ID: ${id}. Unit revision: ${claimed.revision}.`);
    // Another caller that names the holder's claimant gets no ID and no renewal.
    const impostor = workClaim(root, env(), { unit: "W1 R0 P1 T1", claimant: "builder-a", taskHandle: null, ttlSeconds: null, expectedVersion: claimed.revision!, takeover: null });
    expect(impostor).toMatchObject({ result: "refused", refusal: "already-claimed", claimId: null });
    expect(JSON.stringify(impostor)).not.toContain(id);
    const other = workClaim(root, env(), { unit: "W1 R0 P1 T1", claimant: "builder-b", taskHandle: null, ttlSeconds: null, expectedVersion: claimed.revision!, takeover: null });
    expect(other).toMatchObject({ result: "refused", refusal: "already-claimed", claimId: null, claim: { claimant: "builder-a" } });
    expect(JSON.stringify(other)).not.toContain(id);
    // work next never shows it, whoever asks.
    for (const claimant of [null, "builder-a", "builder-b"]) {
      expect(JSON.stringify(workNext(root, env(), { level: "task", includeQuickItems: false, claimant, limit: null }))).not.toContain(id);
    }
    expect(JSON.stringify(workStatus(root, env(), workAuthority(root, store, null)))).not.toContain(id);
    // The holder renews with the ID, and the renewal does not repeat it.
    const renewed = workClaim(root, env(), { unit: "W1 R0 P1 T1", claimant: "builder-a", claimId: id, taskHandle: null, ttlSeconds: null, expectedVersion: claimed.revision!, takeover: null });
    expect(renewed).toMatchObject({ result: "renewed", claimId: null });
    expect(JSON.stringify(renewed)).not.toContain(id);
  });

  it("finding 7: a phase file with no status line and every task checked counts as done, visibly", () => {
    const root = project("aurora");
    write(root, INDEX, INDEX_TEXT);
    write(root, P1, "# Phase 1: First\n\n## Stage 1 - Build\n\n### Tasks\n\n- [x] T1: Build the parser.\n- [x] T2: Write the writer.\n");
    write(root, P2, P2_TEXT.replace("### Blockers\n\n- The owner has not chosen a schema format.\n\n", "### Dependencies\n\n- P1 is complete.\n\n"));
    getInstallationCheckoutId(root, store);
    workSync(root, env(), null);
    expect(unitAt(root, "W1 R0 P1")).toMatchObject({ recordedStatus: null, status: "open" });
    const next = workNext(root, env(), { level: "phase", includeQuickItems: false, claimant: null, limit: null });
    expect(next.ready.map((item) => item.coordinate)).toEqual(["W1 R0 P2"]);
    expect(next.doneByFallback).toEqual([{ storeId: unitAt(root, "W1 R0 P1").storeId, coordinate: "W1 R0 P1", sourcePath: P1, doneBy: "all-tasks-checked" }]);
    expect(next.summary).toContain("1 phase with no status line counts as done, because every task is checked (doneBy: all-tasks-checked): W1 R0 P1.");
    const claim = workClaim(root, env(), { unit: "W1 R0 P1", claimant: "a", taskHandle: null, ttlSeconds: null, expectedVersion: unitAt(root, "W1 R0 P1").revision, takeover: null });
    expect(claim).toMatchObject({ result: "refused", refusal: "unit-closed" });
    expect(claim.summary).toContain("doneBy: all-tasks-checked");
    // The store record keeps its status: the rule is for readiness only.
    expect(unitAt(root, "W1 R0 P1").status).toBe("open");
    // A status line decides when present.
    write(root, P1, `---\nstatus: "active"\n---\n\n${read(root, P1)}`);
    workSync(root, env(), null);
    const after = workNext(root, env(), { level: "phase", includeQuickItems: false, claimant: null, limit: null });
    expect(after.doneByFallback).toEqual([]);
    expect(after.ready.map((item) => item.coordinate)).toEqual(["W1 R0 P1"]);
  });

  it("a claim on a unit that is not ready is refused with each reason", () => {
    const root = imported();
    const t3 = unitAt(root, "W1 R0 P1 T3");
    const refused = workClaim(root, env(), { unit: "W1 R0 P1 T3", claimant: "builder-a", taskHandle: null, ttlSeconds: null, expectedVersion: t3.revision, takeover: null });
    expect(refused).toMatchObject({ result: "refused", refusal: "not-ready" });
    expect(refused.reasons.map((reason) => reason.reason)).toEqual(["ancestor-waiting"]);
  });

  it("a takeover after expiry fails unless the caller confirms the handle check (A17)", () => {
    const root = imported();
    const t1 = unitAt(root, "W1 R0 P1 T1");
    workClaim(root, env(), { unit: "W1 R0 P1 T1", claimant: "builder-a", taskHandle: "task-a", ttlSeconds: 1200, expectedVersion: t1.revision, takeover: null });
    const later = env(new Date(NOW.getTime() + 2 * 60 * 60 * 1000));
    const plain = workClaim(root, later, { unit: "W1 R0 P1 T1", claimant: "builder-b", taskHandle: null, ttlSeconds: null, expectedVersion: t1.revision, takeover: null });
    expect(plain).toMatchObject({ result: "refused", refusal: "takeover-needs-handle-check", claimId: null, claim: { claimant: "builder-a", live: false } });
    const running = workClaim(root, later, { unit: "W1 R0 P1 T1", claimant: "builder-b", taskHandle: null, ttlSeconds: null, expectedVersion: t1.revision, takeover: { previousClaimant: "builder-a", handleObservation: "running" } });
    expect(running).toMatchObject({ result: "refused", refusal: "previous-holder-still-working" });
    const wrong = workClaim(root, later, { unit: "W1 R0 P1 T1", claimant: "builder-b", taskHandle: null, ttlSeconds: null, expectedVersion: t1.revision, takeover: { previousClaimant: "someone-else", handleObservation: "stopped" } });
    expect(wrong).toMatchObject({ result: "refused", refusal: "version-conflict" });
    const taken = workClaim(root, later, { unit: "W1 R0 P1 T1", claimant: "builder-b", taskHandle: "task-b", ttlSeconds: null, expectedVersion: t1.revision, takeover: { previousClaimant: "builder-a", handleObservation: "stopped" } });
    expect(taken).toMatchObject({ result: "claimed", claim: { claimant: "builder-b", namedByCaller: true } });
    expect(taken.claimId).toMatch(/^wc-/);
  });

  it("report and close refuse a caller that no longer holds the claim (A18), and close writes the file at the next sync", () => {
    const root = imported();
    const t1 = unitAt(root, "W1 R0 P1 T1");
    const first = workClaim(root, env(), { unit: "W1 R0 P1 T1", claimant: "builder-a", taskHandle: "task-a", ttlSeconds: 1200, expectedVersion: t1.revision, takeover: null });
    const later = env(new Date(NOW.getTime() + 2 * 60 * 60 * 1000));
    workClaim(root, later, { unit: "W1 R0 P1 T1", claimant: "builder-b", taskHandle: "task-b", ttlSeconds: null, expectedVersion: t1.revision, takeover: { previousClaimant: "builder-a", handleObservation: "finished" } });
    const report = workReport(root, later, { unit: "W1 R0 P1 T1", claimId: first.claimId, status: "in-progress", evidencePath: null, clearBlockers: false, metGates: [], expectedVersion: t1.revision });
    expect(report).toMatchObject({ accepted: false, refusal: "not-claim-holder" });
    const close = workClose(root, later, { unit: "W1 R0 P1 T1", claimId: first.claimId, outcome: "done", expectedVersion: t1.revision });
    expect(close).toMatchObject({ accepted: false, refusal: "not-claim-holder" });
    const anonymous = workClose(root, later, { unit: "W1 R0 P1 T1", claimId: null, outcome: "done", expectedVersion: t1.revision });
    expect(anonymous).toMatchObject({ accepted: false, refusal: "not-claim-holder" });
    expect(read(root, P1)).toBe(P1_TEXT);
  });

  it("the holder reports and closes; the next sync writes the task mark", () => {
    const root = imported();
    const t1 = unitAt(root, "W1 R0 P1 T1");
    const claim = workClaim(root, env(), { unit: "W1 R0 P1 T1", claimant: "builder-a", taskHandle: "task-a", ttlSeconds: null, expectedVersion: t1.revision, takeover: null });
    write(root, "docs/evidence.md", "# Evidence\n");
    const report = workReport(root, env(), { unit: "W1 R0 P1 T1", claimId: claim.claimId, status: "in-progress", evidencePath: "docs/evidence.md", clearBlockers: false, metGates: [], expectedVersion: t1.revision });
    expect(report).toMatchObject({ accepted: true, refusal: null });
    expect(report.storeOnlyEdits.map((edit) => [edit.coordinate, edit.kind])).toEqual([["W1 R0 P1 T1", "status"]]);
    const current = unitAt(root, "W1 R0 P1 T1");
    expect(current.status).toBe("in-progress");
    expect(current.links).toContainEqual({ direction: "outbound", kind: "evidence", path: "docs/evidence.md", anchor: null });
    const closed = workClose(root, env(), { unit: "W1 R0 P1 T1", claimId: claim.claimId, outcome: "done", expectedVersion: current.revision });
    expect(closed).toMatchObject({ accepted: true });
    expect(unitAt(root, "W1 R0 P1").status).toBe("open");
    const sync = workSync(root, env(), null);
    expect(sync.sync.written).toEqual([P1]);
    expect(read(root, P1)).toBe(P1_TEXT.replace("- [ ] T1: Build the parser.", "- [x] T1: Build the parser."));
  });

  it("release: the holder releases with the claim ID; anyone releases an expired claim after the handle check (finding 9)", () => {
    const root = imported();
    const t1 = unitAt(root, "W1 R0 P1 T1");
    const claim = workClaim(root, env(), { unit: "W1 R0 P1 T1", claimant: "builder-a", taskHandle: "task-a", ttlSeconds: 1200, expectedVersion: t1.revision, takeover: null });
    expect(workRelease(root, env(), { unit: "W1 R0 P1 T1", claimId: null, expectedVersion: t1.revision })).toMatchObject({ accepted: false, refusal: "not-claim-holder" });
    expect(workRelease(root, env(), { unit: "W1 R0 P1 T1", claimId: claim.claimId, expectedVersion: t1.revision })).toMatchObject({ accepted: true, readyAfter: true });
    workClaim(root, env(), { unit: "W1 R0 P1 T1", claimant: "builder-a", taskHandle: "task-a", ttlSeconds: 1200, expectedVersion: t1.revision, takeover: null });
    const later = env(new Date(NOW.getTime() + 2 * 60 * 60 * 1000));
    const unchecked = workRelease(root, later, { unit: "W1 R0 P1 T1", claimId: null, expectedVersion: t1.revision });
    expect(unchecked).toMatchObject({ accepted: false, refusal: "handle-check-needed" });
    expect(unchecked.summary).toContain("Check the old task handle first");
    expect(workRelease(root, later, { unit: "W1 R0 P1 T1", claimId: null, expectedVersion: t1.revision, handleObservation: "running" })).toMatchObject({ accepted: false, refusal: "previous-holder-still-working" });
    expect(workRelease(root, later, { unit: "W1 R0 P1 T1", claimId: null, expectedVersion: t1.revision, handleObservation: "no-handle" })).toMatchObject({ accepted: false, refusal: "handle-check-needed" });
    const released = workRelease(root, later, { unit: "W1 R0 P1 T1", claimId: null, expectedVersion: t1.revision, handleObservation: "stopped" });
    expect(released).toMatchObject({ accepted: true, readyAfter: true });
    expect(released.summary).toContain("Released the expired claim of builder-a");
  });

  it("finding 9: release-then-claim and an expired close cannot skip the takeover's handle check", () => {
    const root = imported();
    const t1 = unitAt(root, "W1 R0 P1 T1");
    workClaim(root, env(), { unit: "W1 R0 P1 T1", claimant: "builder-a", taskHandle: "task-a", ttlSeconds: 1200, expectedVersion: t1.revision, takeover: null });
    const later = env(new Date(NOW.getTime() + 2 * 60 * 60 * 1000));
    // Release, then a plain claim: the release needs the handle check, so the claim still meets the expired claim.
    expect(workRelease(root, later, { unit: "W1 R0 P1 T1", claimId: null, expectedVersion: t1.revision })).toMatchObject({ refusal: "handle-check-needed" });
    expect(workClaim(root, later, { unit: "W1 R0 P1 T1", claimant: "builder-b", taskHandle: null, ttlSeconds: null, expectedVersion: t1.revision, takeover: null })).toMatchObject({ refusal: "takeover-needs-handle-check" });
    // An expired close by a caller without the claim needs the same check.
    expect(workClose(root, later, { unit: "W1 R0 P1 T1", claimId: null, outcome: "done", expectedVersion: t1.revision })).toMatchObject({ accepted: false, refusal: "handle-check-needed" });
    expect(workClose(root, later, { unit: "W1 R0 P1 T1", claimId: null, outcome: "done", expectedVersion: t1.revision, handleObservation: "running" })).toMatchObject({ accepted: false, refusal: "previous-holder-still-working" });
    expect(unitAt(root, "W1 R0 P1 T1").status).toBe("open");
    // A file edit that closes it stops as a conflict: sync never runs the handle check.
    write(root, P1, P1_TEXT.replace("- [ ] T1: Build the parser.", "- [x] T1: Build the parser."));
    const stopped = workSync(root, later, null);
    expect(stopped.sync.conflicts.map((entry) => entry.path)).toEqual([P1]);
    expect(stopped.sync.conflicts[0]!.reasons.join(" ")).toContain("the claim of builder-a ended at");
    write(root, P1, P1_TEXT);
    workSync(root, later, null);
    const closed = workClose(root, later, { unit: "W1 R0 P1 T1", claimId: null, outcome: "done", expectedVersion: unitAt(root, "W1 R0 P1 T1").revision, handleObservation: "finished" });
    expect(closed).toMatchObject({ accepted: true });
  });

  it("finding 9: a claim with no task handle is released by a person who names no-handle", () => {
    const root = imported();
    const t1 = unitAt(root, "W1 R0 P1 T1");
    workClaim(root, env(), { unit: "W1 R0 P1 T1", claimant: "builder-a", taskHandle: null, ttlSeconds: 1200, expectedVersion: t1.revision, takeover: null });
    const later = env(new Date(NOW.getTime() + 2 * 60 * 60 * 1000));
    expect(workRelease(root, later, { unit: "W1 R0 P1 T1", claimId: null, expectedVersion: t1.revision, handleObservation: "stopped" })).toMatchObject({ refusal: "handle-check-needed" });
    expect(workRelease(root, later, { unit: "W1 R0 P1 T1", claimId: null, expectedVersion: t1.revision, handleObservation: "no-handle" })).toMatchObject({ accepted: true });
  });

  it("T16: a cleared blocker and a met gate stay in the store, show in work report, and survive a later import", () => {
    const root = imported();
    const p2 = unitAt(root, "W1 R0 P2");
    const cleared = workReport(root, env(), { unit: "W1 R0 P2", claimId: null, status: null, evidencePath: null, clearBlockers: true, metGates: [], expectedVersion: p2.revision });
    expect(cleared.accepted).toBe(true);
    expect(cleared.storeOnlyEdits.map((edit) => edit.kind)).toEqual(["blockers"]);
    expect(cleared.lines.join("\n")).toContain("The store cleared the blockers of W1 R0 P2. The file still lists 1 blocker.");
    expect(cleared.readyAfter).toBe(true);
    const s2 = unitAt(root, "W1 R0 P1 S2");
    const gate = workReport(root, env(), { unit: "W1 R0 P1 S2", claimId: null, status: null, evidencePath: null, clearBlockers: false, metGates: ["The owner approves this package."], expectedVersion: s2.revision });
    expect(gate.storeOnlyEdits.map((edit) => [edit.coordinate, edit.kind])).toContainEqual(["W1 R0 P1 S2", "gate-met"]);
    // The writer writes no file text for them, so the file keeps its bytes.
    const after = workSync(root, env(), null);
    expect(after.sync.notWritten).toEqual([]);
    expect(read(root, P2)).toBe(P2_TEXT);
    expect(read(root, P1)).toBe(P1_TEXT);
    // An edit elsewhere in the file imports, and the cleared blocker stays cleared.
    write(root, P2, P2_TEXT.replace("- [ ] T1: Ship it.", "- [ ] T1: Ship it today."));
    workSync(root, env(), null);
    expect(unitAt(root, "W1 R0 P2").blockers).toEqual([]);
    expect(unitAt(root, "W1 R0 P2 T1").body).toBe("Ship it today.");
    // A new blocker in the file wins.
    write(root, P2, P2_TEXT.replace("- The owner has not chosen a schema format.", "- A new blocker."));
    workSync(root, env(), null);
    expect(unitAt(root, "W1 R0 P2").blockers.map((blocker) => blocker.text)).toEqual(["A new blocker."]);
  });

  it("D-066: report records the latest note and its time; a bad note is refused before the sync", async () => {
    const root = imported();
    const p2 = unitAt(root, "W1 R0 P2");
    const first = workReport(root, env(), { unit: "W1 R0 P2", claimId: null, status: null, evidencePath: null, clearBlockers: false, metGates: [], note: "Halfway there.", expectedVersion: p2.revision });
    expect(first).toMatchObject({ accepted: true, note: { note: "Halfway there.", noteAt: NOW.toISOString() } });
    expect(first.revision).toBe(p2.revision + 1);
    const later = new Date(NOW.getTime() + 60_000);
    const second = workReport(root, env(later), { unit: "W1 R0 P2", claimId: null, status: "in-progress", evidencePath: null, clearBlockers: false, metGates: [], note: "Nearly done.", expectedVersion: first.revision! });
    expect(second).toMatchObject({ accepted: true, note: { note: "Nearly done.", noteAt: later.toISOString() } });
    // A later import of the file keeps the note.
    write(root, P2, P2_TEXT.replace("Ship it.", "Ship it today."));
    workSync(root, env(), null);
    const after = workReport(root, env(), { unit: "W1 R0 P2", claimId: null, status: null, evidencePath: null, clearBlockers: false, metGates: [], note: "Shipped.", expectedVersion: unitAt(root, "W1 R0 P2").revision });
    expect(after.note?.note).toBe("Shipped.");
    for (const bad of ["two\nlines", "x".repeat(257), " padded"]) {
      expect(() => workReport(root, env(), { unit: "W1 R0 P2", claimId: null, status: null, evidencePath: null, clearBlockers: false, metGates: [], note: bad, expectedVersion: 1 })).toThrow("Nothing changed.");
    }
    const context = createExecutionContext({ surface: "test", writesAllowed: true, storeRoot: store, now: () => NOW.toISOString() });
    const viaRegistry = await invokeOperation("work.queue.report", { targetRoot: root, unit: "W1 R0 P2", expectedVersion: unitAt(root, "W1 R0 P2").revision, note: "Via the registry." }, context);
    expect(viaRegistry.value).toMatchObject({ accepted: true, note: { note: "Via the registry." } });
  });

  it("finding 4: a refused input is checked before the sync, so nothing changes", () => {
    const root = imported();
    const edited = P2_TEXT.replace("Ship it.", "Ship it soon.");
    write(root, P2, edited);
    const t1 = unitAt(root, "W1 R0 P1 T1");
    expect(() => workClaim(root, env(), { unit: "W1 R0 P1 T1", claimant: "a", taskHandle: null, ttlSeconds: 60, expectedVersion: t1.revision, takeover: null })).toThrow("Nothing changed.");
    expect(() => workReport(root, env(), { unit: "W1 R0 P1 S2", claimId: null, status: null, evidencePath: null, clearBlockers: false, metGates: ["Not a gate."], expectedVersion: 1 })).toThrow("Nothing changed.");
    expect(() => workReport(root, env(), { unit: "W1 R0 P2", claimId: null, status: null, evidencePath: "docs/missing.md", clearBlockers: false, metGates: [], expectedVersion: 1 })).toThrow("Nothing changed.");
    expect(() => workReport(root, env(), { unit: "W1 R0 P2", claimId: null, status: null, evidencePath: null, clearBlockers: false, metGates: [], expectedVersion: 1 })).toThrow("Nothing changed.");
    expect(() => workAdd(root, env(), { title: "x", body: null, requestPath: "docs/missing.md" })).toThrow("Nothing changed.");
    expect(() => workExport(root, env(), { to: root, quick: null, paths: [] })).toThrow("Nothing changed.");
    // The file edit was never imported: no sync ran.
    expect(unitAt(root, "W1 R0 P2 T1").body).toBe("Ship it.");
    expect(read(root, P2)).toBe(edited);
  });

  it("finding 10: release words name the claim state, never a live claim that is not there", () => {
    const root = imported();
    const t1 = unitAt(root, "W1 R0 P1 T1");
    const none = workRelease(root, env(), { unit: "W1 R0 P1 T1", claimId: null, expectedVersion: t1.revision });
    expect(none).toMatchObject({ accepted: false, refusal: "not-claim-holder" });
    expect(none.summary).toContain("The unit has no claim to release.");
    expect(none.summary).not.toContain("A live claim holds the unit");
    const wrong = workRelease(root, env(), { unit: "W1 R0 P1 T1", claimId: "wc-notaclaim1", expectedVersion: t1.revision });
    expect(wrong.summary).toContain("The unit has no claim to release.");
  });
});

describe("W29 R0 P4 work add and export (A31, A32)", () => {
  it("gives each quick item the next number; a closed item keeps its number", () => {
    const root = imported();
    const one = workAdd(root, env(), { title: "Compare two printers", body: null, requestPath: null });
    expect(one).toMatchObject({ number: "1", label: "task 1" });
    // Finding 5: no project URI until the T10 read lands.
    expect(JSON.stringify(one)).not.toContain("make-docs://project/");
    workClose(root, env(), { unit: "task 1", claimId: null, outcome: "done", expectedVersion: one.revision });
    const two = workAdd(root, env(), { title: "Book the venue", body: "For June.", requestPath: null });
    expect(two.number).toBe("2");
    const next = workNext(root, env(), { level: "task", includeQuickItems: true, claimant: null, limit: null });
    expect(next.ready.map((item) => item.label)).toEqual(["W1 R0 P1 T1", "W1 R0 P1 T2", "task 2"]);
  });

  it("export --quick writes the tasks list text, and export --to writes backlog files outside docs/work", () => {
    const root = imported();
    workAdd(root, env(), { title: "Compare two printers", body: null, requestPath: null });
    const quickFile = path.join(temp, "out", "tasks.md");
    const result = workExport(root, env(), { to: path.join(temp, "copies"), quick: quickFile, paths: [] });
    expect(readFileSync(quickFile, "utf8")).toBe(renderWorkTasksList("aurora", units(root)));
    expect(readFileSync(quickFile, "utf8")).toBe("# Quick items of aurora\n\n- task 1: Compare two printers [open]\n");
    expect(result.written).toHaveLength(3);
    expect(readFileSync(path.join(temp, "copies", ...P1.split("/")), "utf8")).toBe(P1_TEXT);
    expect(() => workExport(root, env(), { to: null, quick: null, paths: [] })).toThrow("Name where to write");
  });

  it("findings 1 and 2: export never writes under docs/work/, .make-docs/, or a held path, through any symbolic link, and never replaces a file", () => {
    const root = imported(`work:\n  syncHold:\n    - ${RECORD}/\n`);
    const before = { p1: read(root, P1), config: read(root, ".make-docs/config.yaml") };
    const refuse = (input: { to?: string; quick?: string }, message: string) =>
      expect(() => workExport(root, env(), { to: input.to ?? null, quick: input.quick ?? null, paths: [] }), JSON.stringify(input)).toThrow(message);
    // --to . would land every file in docs/work/ (the reviewer rewrote a held W22 R2 file this way).
    refuse({ to: "." }, "docs/work/ holds the work files that sync owns");
    refuse({ to: root }, "docs/work/ holds the work files that sync owns");
    refuse({ to: "docs/work/new-copy" }, "docs/work/ holds the work files that sync owns");
    refuse({ to: ".make-docs/copies" }, ".make-docs/ holds the project config");
    refuse({ to: RECORD }, "docs/work/ holds the work files that sync owns");
    // A symbolic link that leads into docs/work/ or the project root.
    symlinkSync(path.join(root, "docs", "work"), path.join(temp, "work-link"));
    refuse({ to: path.join(temp, "work-link", "x") }, "docs/work/ holds the work files that sync owns");
    symlinkSync(root, path.join(temp, "root-link"));
    refuse({ to: path.join(temp, "root-link") }, "docs/work/ holds the work files that sync owns");
    refuse({ quick: path.join(temp, "root-link", ".make-docs", "tasks.md") }, ".make-docs/ holds the project config");
    // The same folder by another spelling, such as /var and /private/var on macOS.
    if (root.startsWith("/private/")) refuse({ to: path.join(root.slice("/private".length), "docs", "work", "x") }, "docs/work/ holds the work files that sync owns");
    // --quick never replaces a file, and never writes under .make-docs/.
    refuse({ quick: ".make-docs/config.yaml" }, ".make-docs/ holds the project config");
    refuse({ quick: ".make-docs/new-tasks.md" }, ".make-docs/ holds the project config");
    writeFileSync(path.join(temp, "existing.md"), "keep me\n");
    refuse({ quick: path.join(temp, "existing.md") }, "exists");
    expect(readFileSync(path.join(temp, "existing.md"), "utf8")).toBe("keep me\n");
    // --to needs a new or empty folder.
    mkdirSync(path.join(temp, "full"));
    writeFileSync(path.join(temp, "full", "x.md"), "x\n");
    refuse({ to: path.join(temp, "full") }, "new or empty folder");
    expect(read(root, P1)).toBe(before.p1);
    expect(read(root, ".make-docs/config.yaml")).toBe(before.config);
    // A new folder outside works, with every file under it.
    const result = workExport(root, env(), { to: path.join(temp, "fresh"), quick: path.join(temp, "fresh-tasks.md"), paths: [] });
    expect(result.written.every((file) => file.startsWith(path.join(temp, "fresh")))).toBe(true);
    expect(read(root, P1)).toBe(before.p1);
  });
});

/* ------------------------------------------------------------------------ */
/* Sync: settle, holds, copies off                                          */
/* ------------------------------------------------------------------------ */

describe("W29 R0 P4 re-check findings", () => {
  it.skipIf(process.platform !== "darwin" && process.platform !== "win32")("finding 1: export refuses a protected folder in any letter case", () => {
    const root = imported(`work:\n  syncHold:\n    - ${RECORD}/\n`);
    const refuse = (input: { to?: string; quick?: string }) =>
      expect(() => workExport(root, env(), { to: input.to ?? null, quick: input.quick ?? null, paths: [] }), JSON.stringify(input)).toThrow("Nothing changed.");
    refuse({ to: "Docs/Work/new" });
    refuse({ to: "DOCS/work/x" });
    refuse({ to: ".MAKE-DOCS/out" });
    refuse({ quick: ".Make-Docs/q.md" });
    // A held path in another case.
    refuse({ quick: RECORD.toUpperCase().replace("DOCS/WORK", "docs/Work") + "/q.md" });
    expect(existsSync(path.join(root, "docs", "work", "new"))).toBe(false);
    expect(existsSync(path.join(root, ".make-docs", "out"))).toBe(false);
    expect(existsSync(path.join(root, ".make-docs", "q.md"))).toBe(false);
    expect(existsSync(path.join(root, ...RECORD.split("/"), "q.md"))).toBe(false);
  });

  it("finding 3: an unchecked checkbox in a Tasks section keeps a phase with no status line open, at any indent", () => {
    const root = project("aurora");
    write(root, INDEX, INDEX_TEXT);
    const phase = (n: number, status: string | null, tasks: string) => write(root, `${RECORD}/0${n}-p.md`, `---\ntitle: "Phase ${n}: P"\nkind: "work"\n${status ? `status: "${status}"\n` : ""}coordinate: "W1 R0 P${n}"\n---\n\n# Phase ${n}: P\n\n## Stage 1 - B\n\n### Tasks\n\n${tasks}\n`);
    phase(1, null, "- [x] T1: a.\n- [x] T2: b.");
    phase(2, null, "");
    phase(3, "active", "- [x] T1: a.\n- [x] T2: b.");
    phase(4, null, "- [x] T1: a.\n  - [ ] nested unchecked.\n- [x] T2: b.");
    phase(5, null, "- [x] T1: a.\n    - [ ] T2: indented unchecked.");
    getInstallationCheckoutId(root, store);
    workSync(root, env(), null);
    const next = workNext(root, env(), { level: "phase", includeQuickItems: false, claimant: null, limit: null });
    expect(next.doneByFallback.map((entry) => entry.coordinate)).toEqual(["W1 R0 P1"]);
    expect(next.ready.map((item) => item.coordinate)).toEqual(["W1 R0 P2", "W1 R0 P3", "W1 R0 P4", "W1 R0 P5"]);
    // Finding 6: a claim on a phase done by the fallback says it counts as done.
    const claim = workClaim(root, env(), { unit: "W1 R0 P1", claimant: "a", taskHandle: null, ttlSeconds: null, expectedVersion: unitAt(root, "W1 R0 P1").revision, takeover: null });
    expect(claim.lines[0]).toBe("Not claimed: W1 R0 P1. The unit counts as done.");
    expect(claim.summary).not.toContain("The unit is closed.");
  });

  it("finding 5: the holder of an expired claim is told to take it over or release it with --handle", () => {
    const root = imported();
    const t1 = unitAt(root, "W1 R0 P1 T1");
    const claim = workClaim(root, env(), { unit: "W1 R0 P1 T1", claimant: "builder-a", taskHandle: "task-a", ttlSeconds: 1200, expectedVersion: t1.revision, takeover: null });
    const later = env(new Date(NOW.getTime() + 2 * 60 * 60 * 1000));
    const close = workClose(root, later, { unit: "W1 R0 P1 T1", claimId: claim.claimId, outcome: "done", expectedVersion: claim.revision! });
    expect(close).toMatchObject({ accepted: false, refusal: "claim-expired" });
    expect(close.summary).toContain("--takeover-from");
    expect(close.summary).toContain("make-docs work release --handle");
    expect(close.summary).not.toContain("Claim the unit again");
  });

  it("finding 7: the MCP claimant text matches T13", async () => {
    const { MAKE_DOCS_MCP_TOOLS } = await import("../src/mcp/tools");
    const next = MAKE_DOCS_MCP_TOOLS.find((tool) => tool.name === "work_next")!;
    const text = (next.inputSchema as Record<string, { description?: string }>).claimant!.description!;
    expect(text).not.toContain("your claims show their claim ID");
    expect(text).toContain("only the result of a new claim does");
  });
});

describe("W29 R0 P4 T15 settle flags", () => {
  function bothChanged(): string {
    const root = imported();
    write(root, P2, P2_TEXT.replace("Ship it.", "Ship it today."));
    storeChange(root, "W1 R0 P2 T1", { status: "closed", closeOutcome: "done" });
    const conflict = workSync(root, env(), null);
    expect(conflict.sync.conflicts.map((entry) => [entry.path, entry.kind])).toEqual([[P2, "both-changed"]]);
    expect(conflict.sync.conflicts[0]!.choices.map((choice) => choice.command)).toEqual([
      `make-docs work sync --settle ${P2} --keep-file`,
      `make-docs work sync --settle ${P2} --keep-store`,
    ]);
    return root;
  }

  it("--keep-file imports the file and replaces the store's version", () => {
    const root = bothChanged();
    const settled = workSync(root, env(), { targetPath: P2, choice: "keep-file", expectedStoreRevision: null });
    expect(settled.sync.settled).toMatchObject({ path: P2, choice: "keep-file", kind: "both-changed" });
    expect(settled.sync.conflicts).toEqual([]);
    expect(unitAt(root, "W1 R0 P2 T1")).toMatchObject({ status: "open", body: "Ship it today." });
    expect(read(root, P2)).toBe(P2_TEXT.replace("Ship it.", "Ship it today."));
  });

  it("--keep-store rewrites the file from the store", () => {
    const root = bothChanged();
    const settled = workSync(root, env(), { targetPath: P2, choice: "keep-store", expectedStoreRevision: null });
    expect(settled.sync.written).toEqual([P2]);
    expect(read(root, P2)).toBe(P2_TEXT.replace("- [ ] T1: Ship it.", "- [x] T1: Ship it."));
    expect(workSync(root, env(), null).sync.conflicts).toEqual([]);
  });

  it("refuses a choice the conflict does not offer, a stale revision, and a path with no conflict, and changes nothing", () => {
    const root = bothChanged();
    expect(() => workSync(root, env(), { targetPath: P2, choice: "restore", expectedStoreRevision: null })).toThrow(WorkSettleRefusalError);
    expect(() => workSync(root, env(), { targetPath: P2, choice: "keep-file", expectedStoreRevision: 999 })).toThrow("store revision");
    expect(() => workSync(root, env(), { targetPath: P1, choice: "keep-file", expectedStoreRevision: null })).toThrow("has no sync conflict");
    expect(workSync(root, env(), null).sync.conflicts.map((entry) => entry.kind)).toEqual(["both-changed"]);
  });

  it("file-deleted: --restore writes the file back; --accept-deletion closes the units as superseded", () => {
    const root = imported();
    unlinkSync(path.join(root, P2));
    expect(workSync(root, env(), null).sync.conflicts.map((entry) => entry.kind)).toEqual(["file-deleted"]);
    workSync(root, env(), { targetPath: P2, choice: "restore", expectedStoreRevision: null });
    expect(read(root, P2)).toBe(P2_TEXT);
    unlinkSync(path.join(root, P2));
    workSync(root, env(), null);
    const accepted = workSync(root, env(), { targetPath: P2, choice: "accept-deletion", expectedStoreRevision: null });
    expect(accepted.sync.settled).toMatchObject({ choice: "accept-deletion" });
    expect(unitAt(root, "W1 R0 P2 T1")).toMatchObject({ status: "closed", closeOutcome: "superseded", copyState: "removed" });
    expect(workSync(root, env(), null).sync.conflicts).toEqual([]);
  });

  it("T18: --accept-deletion never acts for a live claim holder", () => {
    const root = imported();
    const t1 = unitAt(root, "W1 R0 P1 T1");
    workClaim(root, env(), { unit: "W1 R0 P1 T1", claimant: "builder-a", taskHandle: "task-a", ttlSeconds: null, expectedVersion: t1.revision, takeover: null });
    unlinkSync(path.join(root, P1));
    workSync(root, env(), null);
    expect(() => workSync(root, env(), { targetPath: P1, choice: "accept-deletion", expectedStoreRevision: null })).toThrow("builder-a holds W1 R0 P1 T1 on a live claim");
    expect(unitAt(root, "W1 R0 P1 T1").status).toBe("open");
  });

  it("T18 and re-check finding 4: a file edit that closes a claimed unit is a `claimed` conflict whose choices are the release and --keep-store, with no loop", () => {
    const root = imported();
    const t1 = unitAt(root, "W1 R0 P1 T1");
    const claim = workClaim(root, env(), { unit: "W1 R0 P1 T1", claimant: "builder-a", taskHandle: "task-a", ttlSeconds: 1200, expectedVersion: t1.revision, takeover: null });
    const closedText = P1_TEXT.replace("- [ ] T1: Build the parser.", "- [x] T1: Build the parser.");
    write(root, P1, closedText);
    const stopped = workSync(root, env(), null);
    expect(stopped.sync.conflicts.map((entry) => [entry.path, entry.kind])).toEqual([[P1, "claimed"]]);
    const conflict = stopped.sync.conflicts[0]!;
    expect(conflict.reasons.join(" ")).toContain("builder-a holds it on a live claim");
    expect(conflict.choices.map((choice) => choice.choice)).toEqual(["release", "keep-store"]);
    expect(conflict.choices[0]!.command).toBe(`make-docs work release W1 R0 P1 T1 --claim-id <claim ID> --expected-version ${claim.revision}`);
    expect(conflict.choices.some((choice) => choice.choice === "keep-file")).toBe(false);
    expect(conflict.meaning).toContain("STORE-DECISION-004");
    expect(JSON.stringify(stopped)).not.toContain(claim.claimId!);
    // --keep-file is not offered, so it is refused with nothing changed: no "Settled", no loop.
    expect(() => workSync(root, env(), { targetPath: P1, choice: "keep-file", expectedStoreRevision: null })).toThrow("A claimed conflict offers --keep-store, or make-docs work release for each claimed unit, not --keep-file.");
    // work status names the claim, not "so Make Docs imports it".
    const status = workStatus(root, env(), workAuthority(root, store, null));
    expect(status.summary).toContain(`Conflict in ${P1} (claimed)`);
    expect(status.summary).not.toContain("so Make Docs imports it");
    expect(status.sync!.conflicts[0]!.choices.map((choice) => choice.choice)).toEqual(["release", "keep-store"]);
    expect(unitAt(root, "W1 R0 P1 T1").status).toBe("open");
    // After the claim ends, the choice is the release with a handle check; then the next sync imports the file.
    const later = env(new Date(NOW.getTime() + 2 * 60 * 60 * 1000));
    const expired = workSync(root, later, null);
    expect(expired.sync.conflicts[0]!.choices[0]!.command).toBe(`make-docs work release W1 R0 P1 T1 --handle <stopped|finished|not-found> --expected-version ${claim.revision}`);
    // work status reads the claim at the same time as the rest of its result.
    expect(workStatus(root, later, workAuthority(root, store, null)).sync!.conflicts[0]!.choices[0]!.command).toContain("--handle");
    expect(workRelease(root, later, { unit: "W1 R0 P1 T1", claimId: null, expectedVersion: claim.revision!, handleObservation: "stopped" })).toMatchObject({ accepted: true });
    const imported2 = workSync(root, later, null);
    expect(imported2.sync.conflicts).toEqual([]);
    expect(unitAt(root, "W1 R0 P1 T1").status).toBe("closed");
    expect(workSync(root, later, null).sync.conflicts).toEqual([]);
  });

  it("re-check finding 4: --keep-store settles a claimed conflict once, and the unit stays open for its holder", () => {
    const root = imported();
    const t1 = unitAt(root, "W1 R0 P1 T1");
    workClaim(root, env(), { unit: "W1 R0 P1 T1", claimant: "builder-a", taskHandle: "task-a", ttlSeconds: null, expectedVersion: t1.revision, takeover: null });
    write(root, P1, P1_TEXT.replace("- [ ] T1: Build the parser.", "- [x] T1: Build the parser."));
    workSync(root, env(), null);
    const settled = workSync(root, env(), { targetPath: P1, choice: "keep-store", expectedStoreRevision: null });
    expect(settled.sync.settled).toMatchObject({ kind: "claimed", choice: "keep-store" });
    expect(read(root, P1)).toBe(P1_TEXT);
    expect(workSync(root, env(), null).sync.conflicts).toEqual([]);
    expect(unitAt(root, "W1 R0 P1 T1").status).toBe("open");
  });

  it("re-check finding 2: a unit with a progress note that leaves its file stops the file, and keeps its note", () => {
    const root = imported();
    const t3 = unitAt(root, "W1 R0 P1 T3");
    workReport(root, env(), { unit: "W1 R0 P1 T3", claimId: null, status: null, evidencePath: null, clearBlockers: false, metGates: [], note: "Started the checks.", expectedVersion: t3.revision });
    // The note is a store change, so a sync records it first: the file keeps its bytes.
    expect(workSync(root, env(), null).sync.written).toEqual([]);
    write(root, P1, P1_TEXT.replace("- [ ] T3: Check it.\n", ""));
    const stopped = workSync(root, env(), null);
    expect(stopped.sync.conflicts.map((entry) => [entry.path, entry.kind])).toEqual([[P1, "unclear"]]);
    expect(stopped.sync.conflicts[0]!.reasons.join(" ")).toContain("W1 R0 P1 T3 left the file, and the store holds what the file cannot show: a progress note");
    expect(unitAt(root, "W1 R0 P1 T3")).toBeDefined();
    expect(readWorkStore(root, (db) => readWorkUnitNote(db, t3.storeId), { storeRoot: store })?.note).toBe("Started the checks.");
  });

  it("store-missing: --reimport imports the file; --remove-file removes an unchanged file", () => {
    const root = imported();
    writeWorkStore(root, (db) => {
      const order = ["task", "stage", "phase"];
      for (const unit of listWorkUnits(db, PROJECT_ID).filter((candidate) => candidate.sourcePath === P2).sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind))) {
        db.prepare("DELETE FROM work_units WHERE store_id = ?").run(unit.storeId);
      }
    }, { storeRoot: store });
    expect(workSync(root, env(), null).sync.conflicts.map((entry) => entry.kind)).toEqual(["store-missing"]);
    workSync(root, env(), { targetPath: P2, choice: "reimport", expectedStoreRevision: null });
    expect(unitAt(root, "W1 R0 P2 T1").body).toBe("Ship it.");
  });
});

describe("W29 R0 P4 T19 sync hold list in project config", () => {
  it("sync never writes or removes a held path and reports it as held", () => {
    const root = imported(`work:\n  syncHold:\n    - ${RECORD}/\n`);
    expect(readWorkSyncConfig(root).syncHold).toEqual([RECORD]);
    storeChange(root, "W1 R0 P1 T1", { status: "closed", closeOutcome: "done" });
    const result = workSync(root, env(), null);
    expect(result.sync.written).toEqual([]);
    expect(result.sync.held.map((entry) => entry.path)).toEqual([P1]);
    expect(result.summary).toContain(`Held, not written: ${P1}.`);
    expect(read(root, P1)).toBe(P1_TEXT);
    // A settle that writes a held file is refused.
    write(root, P1, P1_TEXT.replace("Check it.", "Check it twice."));
    workSync(root, env(), null);
    expect(() => workSync(root, env(), { targetPath: P1, choice: "keep-store", expectedStoreRevision: null })).toThrow("is held");
  });

  it("finding 8: --accept-deletion is refused on a held path", () => {
    const root = imported(`work:\n  syncHold:\n    - ${RECORD}/\n`);
    unlinkSync(path.join(root, P2));
    expect(workSync(root, env(), null).sync.conflicts.map((entry) => entry.kind)).toEqual(["file-deleted"]);
    expect(() => workSync(root, env(), { targetPath: P2, choice: "accept-deletion", expectedStoreRevision: null })).toThrow("is held");
    expect(unitAt(root, "W1 R0 P2 T1")).toMatchObject({ status: "open", copyState: "kept" });
  });

  it.each([
    ["a held path", `work:\n  syncHold:\n    - ${RECORD}/\n`, false],
    ["copies off", "work:\n  projection: \"off\"\n", false],
    ["copies on", "", true],
  ] as const)("finding 6: work close names the file only when sync can write it (%s)", (_name, extra, shown) => {
    const root = imported(extra);
    const t1 = unitAt(root, "W1 R0 P1 T1");
    const closed = workClose(root, env(), { unit: "W1 R0 P1 T1", claimId: null, outcome: "done", expectedVersion: t1.revision });
    expect(closed.accepted).toBe(true);
    expect(closed.summary.includes(`The next sync shows it in ${P1}.`)).toBe(shown);
  });

  it("config validation accepts the work block and refuses a hold path outside the work folders", () => {
    expect(WorkConfigBlockSchema.safeParse({ syncHold: ["docs/work/2026-11-13-w22-r2-portable-checkout-adoption/"] }).success).toBe(true);
    expect(WorkConfigBlockSchema.safeParse({ syncHold: ["docs/prd/"] }).success).toBe(false);
    expect(WorkConfigBlockSchema.safeParse({ syncHold: ["../x"] }).success).toBe(false);
    const good = project("good", "work:\n  syncHold:\n    - docs/work/a/\n");
    expect(loadMakeDocsConfig(good).valid).toBe(true);
    const bad = project("bad", "work:\n  syncHold:\n    - docs/prd/\n");
    const loaded = loadMakeDocsConfig(bad);
    expect(loaded.valid).toBe(false);
    expect(loaded.diagnostics.map((entry) => entry.code)).toContain("invalid-work-block");
  });

  it("this repository holds the W22 R2 backlog (register D-063)", () => {
    expect(readWorkSyncConfig(REPO_ROOT).syncHold).toContain("docs/work/2026-11-13-w22-r2-portable-checkout-adoption");
    expect(loadMakeDocsConfig(REPO_ROOT).valid).toBe(true);
  });
});

describe("W29 R0 P4 T20 copies off and a copy deleted by hand", () => {
  it("clears that file's ledger entry, and copies on again writes it back with no conflict", () => {
    const root = imported();
    unlinkSync(path.join(root, P2));
    const off = syncWorkFiles(root, { storeRoot: store, now: NOW, projection: "off" });
    expect(off.files.find((file) => file.path === P2)).toMatchObject({ fileState: "missing", action: "ledger-cleared" });
    const checkoutId = getInstallationCheckoutId(root, store);
    expect(readWorkStore(root, (db) => listSyncLedger(db, checkoutId).map((row) => row.entry.targetPath), { storeRoot: store })).not.toContain(P2);
    const on = syncWorkFiles(root, { storeRoot: store, now: NOW, projection: "on" });
    expect(on.conflicts).toEqual([]);
    expect(on.written).toContain(P2);
    expect(read(root, P2)).toBe(P2_TEXT);
  });

  it("the P1 sync table rows for this case say the ledger entry goes", () => {
    for (const store of ["unchanged", "changed"] as const) {
      const row = WORK_SYNC_TABLE.find((candidate) => candidate.file === "missing" && candidate.store === store && candidate.projection === "off")!;
      expect(row.decision).toBe("none");
      expect(row.humanMeaning).toContain("removes this checkout's ledger entry");
    }
  });

  it("a removal that the file system refuses with copies off is a typed file error, and the next sync tries again", () => {
    if (process.platform === "win32" || process.getuid?.() === 0) return;
    const root = imported();
    const folder = path.join(root, RECORD);
    chmodSync(folder, 0o555);
    try {
      const off = syncWorkFiles(root, { storeRoot: store, now: NOW, projection: "off" });
      expect(off.fileErrors.map((entry) => [entry.path, entry.operation])).toContainEqual([P2, "remove"]);
      expect(existsSync(path.join(root, P2))).toBe(true);
    } finally {
      chmodSync(folder, 0o755);
    }
    const again = syncWorkFiles(root, { storeRoot: store, now: NOW, projection: "off" });
    expect(again.removed).toContain(P2);
  });
});

/* ------------------------------------------------------------------------ */
/* Status and Store states (A19)                                            */
/* ------------------------------------------------------------------------ */

describe("W29 R0 P4 work status names the mode and its reason (A19)", () => {
  it("store present and bound: the work store is the authority", () => {
    const root = imported();
    const status = workStatus(root, env(), workAuthority(root, store, null));
    expect(status).toMatchObject({ mode: "store", storeState: "usable", projection: "on" });
    expect(status.lines[0]).toBe("The work store is the authority, because this checkout is bound to a usable Store. The docs/work/ files are its repo copy.");
    expect(status.summary.endsWith("Changes nothing.")).toBe(true);
    expect(status.counts).toMatchObject({ open: expect.any(Number), ready: expect.any(Number) });
  });

  it("store absent, denied, unsafe, older, and checkout not bound: the files are the authority", () => {
    const root = project("lonely");
    expect(workAuthority(root, path.join(temp, "absent"), null)).toMatchObject({ mode: "files", storeState: "not-configured" });
    expect(existsSync(path.join(temp, "absent"))).toBe(false);
    expect(workAuthority(root, store, { reason: "No grant.", nextAction: "Ask for one." })).toMatchObject({ mode: "files", storeState: "denied", nextAction: "Ask for one." });
    const bound = imported();
    const other = project("unbound");
    expect(workAuthority(other, store, null)).toMatchObject({ mode: "files", storeState: "unavailable", reason: expect.stringContaining("not bound") });
    const raw = new DatabaseSync(path.join(store, "store.db"));
    raw.exec("PRAGMA user_version=999");
    raw.close();
    expect(workAuthority(bound, store, null)).toMatchObject({ mode: "files", storeState: "unsafe" });
  });

  it("status through the registry reports an absent Store and creates none", async () => {
    const root = project("lonely");
    const absent = path.join(temp, "absent-store");
    const result = await invokeOperation("work.queue.status", { targetRoot: root }, createExecutionContext({
      surface: "cli", route: "direct-cli", writesAllowed: false, storeRoot: absent, now: () => NOW.toISOString(),
    }));
    expect(result.value).toMatchObject({ mode: "files", storeState: "not-configured" });
    expect(existsSync(absent)).toBe(false);
  });
});

describe("W29 R0 P4 T14 setup store check lists work claims that expired more than 7 days ago", () => {
  it("names the claimant, unit, and end time, never the claim ID, and removes nothing", () => {
    const root = imported();
    const t1 = unitAt(root, "W1 R0 P1 T1");
    const claim = workClaim(root, env(), { unit: "W1 R0 P1 T1", claimant: "builder-a", taskHandle: "task-a", ttlSeconds: 1200, expectedVersion: t1.revision, takeover: null });
    const sixDays = checkStore(store, defaultStoreMaintenanceEnvironment(CLI_STORE_MAINTENANCE_VERSIONS, new Date(NOW.getTime() + 6 * 86_400_000)));
    expect(sixDays.decisions.filter((decision) => decision.id === "STORE-DECISION-004")).toEqual([]);
    const eightDays = checkStore(store, defaultStoreMaintenanceEnvironment(CLI_STORE_MAINTENANCE_VERSIONS, new Date(NOW.getTime() + 8 * 86_400_000)));
    const items = eightDays.decisions.filter((decision) => decision.id === "STORE-DECISION-004");
    expect(items).toHaveLength(1);
    expect(items[0]!.reason).toContain("The claim of builder-a on W1 R0 P1 T1");
    expect(JSON.stringify(eightDays)).not.toContain(claim.claimId!);
  });
});

/* ------------------------------------------------------------------------ */
/* Registry, CLI, and MCP (A16)                                             */
/* ------------------------------------------------------------------------ */

describe("W29 R0 P4 registry, CLI, and MCP forms (A16)", () => {
  it("admits the nine operations in the backlog and workflow profiles, with the right access", () => {
    for (const id of WORK_QUEUE_OPERATION_IDS) {
      const definition = getOperation(id);
      expect(definition.status, id).toBe("active");
      expect(definition.mcp?.profiles, id).toEqual(["backlog", "workflow"]);
      const reads = id === "work.queue.status" || id === "work.queue.next";
      expect(definition.mutates, id).toBe(reads ? "read" : "write");
      expect(definition.access, id).toEqual(reads ? { store: "read", project: "read", hostConfig: "none" } : { store: "write", project: "write", hostConfig: "none" });
    }
  });

  const cases: Array<{ id: string; argv: string[]; mcp: Record<string, unknown> }> = [
    { id: "work.queue.status", argv: ["work", "status", "--target-root", "/p"], mcp: { targetRoot: "/p" } },
    { id: "work.queue.sync", argv: ["work", "sync", "--settle", P2, "--keep-file", "--expected-revision", "4", "--target-root", "/p"], mcp: { targetRoot: "/p", settle: P2, choice: "keep-file", expectedRevision: 4 } },
    { id: "work.queue.next", argv: ["work", "next", "--level", "task", "--claimant", "a", "--no-quick-items", "--limit", "3", "--target-root", "/p"], mcp: { targetRoot: "/p", level: "task", claimant: "a", quickItems: false, limit: 3 } },
    { id: "work.queue.claim", argv: ["work", "claim", "W1", "R0", "P1", "--claimant", "a", "--expected-version", "2", "--ttl", "1200", "--takeover-from", "b", "--handle", "stopped", "--target-root", "/p"], mcp: { targetRoot: "/p", unit: "W1 R0 P1", claimant: "a", expectedVersion: 2, ttlSeconds: 1200, takeoverFrom: "b", handle: "stopped" } },
    { id: "work.queue.release", argv: ["work", "release", "7", "--expected-version", "1", "--handle", "stopped", "--target-root", "/p"], mcp: { targetRoot: "/p", unit: "7", expectedVersion: 1, handle: "stopped" } },
    { id: "work.queue.report", argv: ["work", "report", "W1", "R0", "P2", "--expected-version", "1", "--clear-blockers", "--met-gate", "g1", "--met-gate", "g2", "--status", "open", "--target-root", "/p"], mcp: { targetRoot: "/p", unit: "W1 R0 P2", expectedVersion: 1, clearBlockers: true, metGates: ["g1", "g2"], status: "open" } },
    { id: "work.queue.close", argv: ["work", "close", "task", "7", "--expected-version", "3", "--outcome", "cancelled", "--handle", "finished", "--target-root", "/p"], mcp: { targetRoot: "/p", unit: "task 7", expectedVersion: 3, outcome: "cancelled", handle: "finished" } },
    { id: "work.queue.export", argv: ["work", "export", "--to", "out", "--quick", "q.md", "--path", RECORD, "--target-root", "/p"], mcp: { targetRoot: "/p", to: "out", quick: "q.md", paths: [RECORD] } },
    { id: "work.queue.add", argv: ["work", "add", "Book", "the", "venue", "--body", "For June.", "--target-root", "/p"], mcp: { targetRoot: "/p", title: "Book the venue", body: "For June." } },
  ];

  it.each(cases)("$id: the CLI argv and the MCP arguments give the same typed input", ({ id, argv, mcp }) => {
    const adapted = adaptRunCliArgv(argv);
    expect(adapted.operationId).toBe(id);
    const schema = getOperation(id).inputSchema;
    const input = { ...adapted.invocation.input, ...("targetRoot" in adapted.invocation.input ? { targetRoot: "/p" } : {}) };
    expect(schema.parse(input)).toEqual(schema.parse(mcp));
  });

  it("the CLI and MCP derive the same tool and input schema from one registry definition", async () => {
    const { MAKE_DOCS_MCP_TOOLS } = await import("../src/mcp/tools");
    for (const id of WORK_QUEUE_OPERATION_IDS) {
      const tool = MAKE_DOCS_MCP_TOOLS.find((candidate) => "operation" in candidate && candidate.operation === id)!;
      expect(tool.name, id).toBe(`work_${id.split(".")[2]}`);
      const shape = Object.keys((getOperation(id).inputSchema as unknown as { shape: Record<string, unknown> }).shape);
      for (const key of shape) expect(Object.keys(tool.inputSchema), `${id} ${key}`).toContain(key);
    }
    const root = imported();
    const value = (await invokeOperation("work.queue.next", { targetRoot: root, level: "task" }, createExecutionContext({
      surface: "test", writesAllowed: false, storeRoot: store, now: () => NOW.toISOString(),
    }))).value;
    expect(value).toMatchObject({ operation: "work.queue.next", level: "task" });
  });

  it("a write needs the write permission", async () => {
    const root = imported();
    await expect(invokeOperation("work.queue.add", { targetRoot: root, title: "x" }, createExecutionContext({ surface: "test", writesAllowed: false, storeRoot: store })))
      .rejects.toThrow("requires write permission");
  });
});
