import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { workAuthority, workClaim, workClose, workNext, workReport, workStatus, workSync, type WorkQueueEnv } from "../src/operations/work/work-queue/queue";
import { WORK_FILES_STEP, createExecutionContext } from "../src/operations/context";
import { getOperation, invokeOperation } from "../src/operations/registry";
import { StoreAccessStateError } from "../src/operations/store-access";
import { WORK_FILES_NEXT_STEP } from "../src/operations/work/work-queue/files-fallback";
import { WORK_QUEUE_OPERATION_IDS } from "../src/operations/work/work-queue/operations";
import { checkProjectDoctor, fixProjectDoctor } from "../src/operations/project/doctor";
import { indexRecordedStatus, scanPhaseOpenUnderCompletedIndex } from "../src/operations/project/doctor/phase-open-under-completed-index";
import { platform } from "../src/platform";
import { getInstallationCheckoutId } from "../src/store/installation-state";
import { listWorkUnits, readWorkStore } from "../src/store/work-store";
import type { WorkUnitRecord } from "../src/operations/work/work-store/schemas";
import { cleanupTempDir, createTempDir } from "./helpers";

/**
 * W29 R0 P6: the defects that the installed-package proofs found, and the
 * PERF-004 profile binding. No test reaches the real Store: `MAKE_DOCS_HOME`
 * points at a temporary folder. No test writes this repository's files.
 */

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const NOW = new Date("2042-06-15T12:00:00.000Z");
const PROJECT_ID = "aurora-p6-project";
const RECORD = "docs/work/2042-06-01-w1-r0-aurora";
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

### Blockers

- The owner has not chosen a schema format.
- Is the format final?

## Stage 1 - Ship

### Tasks

- [ ] T1: Ship it.
`;

const roots: string[] = [];
let temp: string;
let store: string;

beforeEach(() => {
  temp = platform.describePath(createTempDir("make-docs-w29-p6-")).canonicalPath;
  roots.push(temp);
  store = path.join(temp, "store");
  vi.stubEnv("MAKE_DOCS_HOME", store);
});

afterEach(() => {
  vi.unstubAllEnvs();
  while (roots.length) cleanupTempDir(roots.pop()!);
});

const env = (): WorkQueueEnv => ({ storeRoot: store, now: NOW });

function write(root: string, relative: string, text: string): void {
  const target = path.join(root, ...relative.split("/"));
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, text);
}

function imported(extra = ""): string {
  const root = path.join(temp, "aurora");
  mkdirSync(path.join(root, ".make-docs"), { recursive: true });
  writeFileSync(path.join(root, ".make-docs/config.yaml"), `projectId: ${PROJECT_ID}\nprojectName: aurora\n${extra}`);
  write(root, `${RECORD}/00-index.md`, INDEX_TEXT);
  write(root, P1, P1_TEXT);
  write(root, P2, P2_TEXT);
  const canonical = platform.describePath(root).canonicalPath;
  getInstallationCheckoutId(canonical, store);
  workSync(canonical, env(), null);
  return canonical;
}

function unitAt(root: string, coordinate: string): WorkUnitRecord {
  const found = readWorkStore(root, (db) => listWorkUnits(db, PROJECT_ID), { storeRoot: store }).find((unit) => unit.coordinate === coordinate);
  if (!found) throw new Error(`No unit ${coordinate}`);
  return found;
}

describe("W29 R0 P6 defect fixes from the installed proofs", () => {
  it("a blocker's own final period is not doubled in the wait reason", () => {
    const root = imported();
    const next = workNext(root, env(), { level: "phase", includeQuickItems: true, claimant: null, limit: null });
    const p2 = next.waiting.find((item) => item.coordinate === "W1 R0 P2")!;
    const blocked = p2.reasons.find((reason) => reason.reason === "blocked")!;
    expect(blocked.text).toBe("Blocked: The owner has not chosen a schema format; Is the format final?");
    expect(next.summary).not.toContain("format..");
    expect(next.summary).not.toContain("?.");
  });

  it("work close with copies on lists no store-only edit, because the next sync writes the close", () => {
    const root = imported();
    const t1 = unitAt(root, "W1 R0 P1 T1");
    const closed = workClose(root, env(), { unit: "W1 R0 P1 T1", claimId: null, outcome: "done", expectedVersion: t1.revision });
    expect(closed.accepted).toBe(true);
    expect(closed.storeOnlyEdits).toEqual([]);
    expect(closed.summary).not.toContain("Store-only edits");
    expect(closed.summary).toContain(`The next sync shows it in ${P1}.`);
    const synced = workSync(root, env(), null);
    expect(synced.sync.written).toEqual([P1]);
    expect(readFileSync(path.join(root, ...P1.split("/")), "utf8")).toContain("- [x] T1: Build the parser.");
  });

  it.each([
    ["a held path", `work:\n  syncHold:\n    - ${RECORD}/\n`],
    ["copies off", "work:\n  projection: \"off\"\n"],
  ] as const)("work close names the close as store-only when sync cannot write the file (%s)", (_name, extra) => {
    const root = imported(extra);
    const t1 = unitAt(root, "W1 R0 P1 T1");
    const closed = workClose(root, env(), { unit: "W1 R0 P1 T1", claimId: null, outcome: "done", expectedVersion: t1.revision });
    expect(closed.storeOnlyEdits.map((edit) => [edit.coordinate, edit.kind])).toEqual([["W1 R0 P1 T1", "status"]]);
    expect(closed.summary).not.toContain("The next sync shows it in");
  });

  it("work close names a released claim only when one existed, and the phase rule only for a task", () => {
    const root = imported();
    const phase = workClose(root, env(), { unit: "W1 R0 P2", claimId: null, outcome: "done", expectedVersion: unitAt(root, "W1 R0 P2").revision });
    expect(phase.lines[0]).toBe(`Closed W1 R0 P2 as done. The next sync shows it in ${P2}.`);
    const task = workClose(root, env(), { unit: "W1 R0 P1 T1", claimId: null, outcome: "done", expectedVersion: unitAt(root, "W1 R0 P1 T1").revision });
    expect(task.lines[0]).toBe(`Closed W1 R0 P1 T1 as done. Closing every task does not close its phase. The next sync shows it in ${P1}.`);
    const t2 = unitAt(root, "W1 R0 P1 T2");
    const claim = workClaim(root, env(), { unit: "W1 R0 P1 T2", claimant: "builder-a", claimId: null, taskHandle: null, ttlSeconds: 1800, expectedVersion: t2.revision, takeover: null });
    const claimed = workClose(root, env(), { unit: "W1 R0 P1 T2", claimId: claim.claimId, outcome: "done", expectedVersion: claim.revision! });
    expect(claimed.lines[0]).toBe(`Closed W1 R0 P1 T2 as done, and released its claim. Closing every task does not close its phase. The next sync shows it in ${P1}.`);
  });

  it("the read-only sync check does not count a held file as a file to write", () => {
    const root = imported(`work:\n  syncHold:\n    - ${RECORD}/\n`);
    workClose(root, env(), { unit: "W1 R0 P1 T1", claimId: null, outcome: "done", expectedVersion: unitAt(root, "W1 R0 P1 T1").revision });
    const status = workStatus(root, env(), workAuthority(root, store, null));
    expect(status.sync!.pending.map((file) => [file.path, file.decision, file.held])).toEqual([[P1, "write", true]]);
    expect(status.summary).toContain("Sync check: 1 held file differs from the store, and sync never writes it.");
    expect(status.summary).not.toContain("to write");
    write(root, P2, P2_TEXT.replace("Ship it.", "Ship it now."));
    const next = workNext(root, env(), { level: "phase", includeQuickItems: true, claimant: null, limit: null });
    expect(next.sync.summary).toBe("Sync check: 1 file to import. The next work write command, or make-docs work sync, applies the changes. 1 held file differs from the store, and sync never writes it.");
  });

  it("the read-only sync check tells a person to fix an unreadable file, not that sync applies it", () => {
    const root = imported();
    write(root, P2, "---\ntitle: \"Phase 2\n");
    const only = workNext(root, env(), { level: "phase", includeQuickItems: true, claimant: null, limit: null });
    expect(only.sync.summary).toBe("Sync check: 1 unreadable file. Fix each unreadable file. Sync leaves it untouched.");
    write(root, P1, P1_TEXT.replace("Build the parser.", "Build the parser first."));
    const mixed = workNext(root, env(), { level: "phase", includeQuickItems: true, claimant: null, limit: null });
    expect(mixed.sync.summary).toBe("Sync check: 1 file to import, 1 unreadable file. The next work write command, or make-docs work sync, applies the changes. Fix each unreadable file. Sync leaves it untouched.");
  });

  it("a status that the file cannot show stays a store-only edit with copies on", () => {
    const root = imported();
    const t2 = unitAt(root, "W1 R0 P1 T2");
    const report = workReport(root, env(), { unit: "W1 R0 P1 T2", claimId: null, status: "in-progress", evidencePath: null, clearBlockers: false, metGates: [], expectedVersion: t2.revision });
    expect(report.storeOnlyEdits.map((edit) => [edit.coordinate, edit.kind])).toEqual([["W1 R0 P1 T2", "status"]]);
    const cleared = workReport(root, env(), { unit: "W1 R0 P2", claimId: null, status: null, evidencePath: null, clearBlockers: true, metGates: [], expectedVersion: unitAt(root, "W1 R0 P2").revision });
    expect(cleared.storeOnlyEdits.map((edit) => edit.kind)).toEqual(["blockers"]);
  });
});

describe("W29 R0 P6 PERF-004 profile binding", () => {
  const phase = readFileSync(path.join(REPO_ROOT, "docs/work/2026-11-21-w29-r0-work-store/06-package-parity-and-acceptance.md"), "utf8");

  it("the profile digest is the SHA-256 of the profile text from its heading to its lineage table, with the digest as {{DIGEST}}", () => {
    const start = phase.indexOf("### PERF-004 ");
    const end = phase.indexOf("#### Evidence Fingerprint", start);
    expect(start).toBeGreaterThan(0);
    expect(end).toBeGreaterThan(start);
    const text = phase.slice(start, end);
    const digest = /\| Source Digest \| `sha256:([0-9a-f]{64})` \|/.exec(text)?.[1];
    expect(digest).toBeDefined();
    const canonical = text.replace(`sha256:${digest}`, "{{DIGEST}}").replace(/\n+$/, "\n");
    expect(createHash("sha256").update(canonical).digest("hex")).toBe(digest);
  });
});

describe("W29 R0 P6 register D-069, option B: a write command with no Store creates none", () => {
  const writes: Array<[string, Record<string, unknown>]> = [
    ["work.queue.sync", {}],
    ["work.queue.claim", { unit: "W1 R0 P1 T1", claimant: "builder-a", expectedVersion: 1 }],
    ["work.queue.release", { unit: "W1 R0 P1 T1", expectedVersion: 1, handle: "not-found" }],
    ["work.queue.report", { unit: "W1 R0 P1 T1", expectedVersion: 1, note: "Started." }],
    ["work.queue.close", { unit: "W1 R0 P1 T1", expectedVersion: 1 }],
    ["work.queue.export", { to: "EXPORT" }],
    ["work.queue.add", { title: "Compare two printers" }],
    ["work.evidence.record", { target: "W1 R0 P1", evidenceKind: "note", payload: { summary: "x" } }],
    ["lifecycle.start", { lifecycleStage: "design" }],
  ];

  function unboundProject(): string {
    const root = path.join(temp, "aurora");
    mkdirSync(path.join(root, ".make-docs"), { recursive: true });
    writeFileSync(path.join(root, ".make-docs/config.yaml"), `projectId: ${PROJECT_ID}\nprojectName: aurora\n`);
    write(root, `${RECORD}/00-index.md`, INDEX_TEXT);
    write(root, P1, P1_TEXT);
    return platform.describePath(root).canonicalPath;
  }

  it.each(writes)("%s refuses with store-unavailable, changes no file, and leaves no Store folder, database, WAL, SHM, or lease", async (id, extra) => {
    const root = unboundProject();
    const absent = path.join(temp, "absent-store");
    const before = readFileSync(path.join(root, ...P1.split("/")), "utf8");
    const input: Record<string, unknown> = { [id.startsWith("work.queue.") ? "targetRoot" : "repoRoot"]: root, ...extra };
    if (input.to === "EXPORT") input.to = path.join(temp, "export");
    const definition = getOperation(id)!;
    expect(definition, id).toBeDefined();
    const error = (await invokeOperation(id, input, createExecutionContext({ surface: "cli", route: "direct-cli", writesAllowed: true, storeRoot: absent, now: () => NOW.toISOString() }))
      .then(() => null, (caught: unknown) => caught)) as StoreAccessStateError | null;
    expect(error, id).toBeInstanceOf(StoreAccessStateError);
    expect(error!.code).toBe("store-unavailable");
    expect(error!.reason).toBe("This computer has no Make Docs Store. Nothing changed, and Make Docs created no Store.");
    expect(error!.nextAction).toContain("Run make-docs setup to create the Store");
    if (id.startsWith("work.queue.")) expect(error!.nextAction).toContain(WORK_FILES_NEXT_STEP);
    expect(existsSync(absent)).toBe(false);
    expect(existsSync(path.join(temp, "export"))).toBe(false);
    expect(readFileSync(path.join(root, ...P1.split("/")), "utf8")).toBe(before);
  });

  it("covers every work queue write operation", () => {
    const queueWrites = WORK_QUEUE_OPERATION_IDS.filter((id) => getOperation(id)!.mutates === "write");
    expect(new Set(queueWrites)).toEqual(new Set(writes.map(([id]) => id).filter((id) => id.startsWith("work.queue."))));
  });

  it("the session's files step is the work read's files step", () => {
    expect(WORK_FILES_STEP).toBe(WORK_FILES_NEXT_STEP);
  });

  it("a read with no Store keeps its earlier words and creates no Store", async () => {
    const root = unboundProject();
    const absent = path.join(temp, "absent-store");
    const error = (await invokeOperation("work.evidence.read", { repoRoot: root, target: "W1 R0 P1" }, createExecutionContext({ surface: "cli", route: "direct-cli", storeRoot: absent }))
      .then(() => null, (caught: unknown) => caught)) as StoreAccessStateError | null;
    expect(error).toBeInstanceOf(StoreAccessStateError);
    expect(error!.code).toBe("store-unavailable");
    expect(error!.reason).toContain("The Store is absent.");
    expect(existsSync(absent)).toBe(false);
  });
});

describe("W29 R0 P6 FOLLOW-UP-P6-CLOSED-PARENT, option B: the ancestor-closed next action", () => {
  it("tells a phase whose tasks are all checked to record that it is done, and an unfinished phase to close as superseded or reopen", () => {
    const root = imported();
    write(root, `${RECORD}/00-index.md`, INDEX_TEXT.replace('status: "active"', 'status: "completed"'));
    write(root, P1, P1_TEXT.replace("- [ ] T1:", "- [x] T1:").replace("- [ ] T2:", "- [x] T2:"));
    workSync(root, env(), null);
    const next = workNext(root, env(), { level: "phase", includeQuickItems: true, claimant: null, limit: null });
    const reasonOf = (coordinate: string) => next.waiting.find((item) => item.coordinate === coordinate)!.reasons.find((reason) => reason.reason === "ancestor-closed")!;
    // The index status does not cascade: both phases still wait.
    expect(next.ready.map((item) => item.coordinate)).toEqual([]);
    expect(reasonOf("W1 R0 P1").nextAction).toBe(`All its tasks are done. Set its status line to completed in ${P1}, or close it with \`make-docs work close W1 R0 P1 --outcome done\`.`);
    expect(reasonOf("W1 R0 P2").nextAction).toBe(`Close this unit as superseded with \`make-docs work close\`, or reopen W1 R0 by changing its status in ${RECORD}/00-index.md.`);
  });

  it("an open task under a closed revision is never told it is done", () => {
    const root = imported();
    write(root, `${RECORD}/00-index.md`, INDEX_TEXT.replace('status: "active"', 'status: "completed"'));
    workSync(root, env(), null);
    const next = workNext(root, env(), { level: "task", includeQuickItems: true, claimant: null, limit: null });
    const t1 = next.waiting.find((item) => item.coordinate === "W1 R0 P1 T1")!;
    expect(t1.reasons.find((reason) => reason.reason === "ancestor-closed")!.nextAction).toContain("Close this unit as superseded");
  });

  it("the agent twin's ancestor-closed row names both branches", () => {
    const twin = readFileSync(path.join(REPO_ROOT, "packages/docs/template/.make-docs/system/references/work-store.md"), "utf8");
    const row = twin.split("\n").find((line) => line.startsWith("| `ancestor-closed` |"))!;
    expect(row).toContain("set its status line to `completed`");
    expect(row).toContain("--outcome done");
    expect(row).toContain("close this unit as superseded");
    expect(readFileSync(path.join(REPO_ROOT, ".make-docs/system/references/work-store.md")).equals(Buffer.from(twin))).toBe(true);
  });
});

describe("W29 R0 P6 project doctor phase-open-under-completed-index (PRD 39 R-DOCTOR-9)", () => {
  const DONE = "docs/work/2026-02-01-w3-r0-done";
  const COMPLETE = "docs/work/2026-02-02-w4-r0-complete-word";
  const ACTIVE = "docs/work/2026-02-03-w5-r0-active";
  const HELD = "docs/work/2026-02-04-w6-r0-held";
  const index = (status: string) => `---\ntitle: "Index"\nkind: "work"\nstatus: ${status}\n---\n\n# Index\n`;
  const phase = (status: string, tasks: string, eol = "\n") =>
    [`---`, `title: "Phase"`, `kind: "work"`, `status: ${status}`, `---`, ``, `# Phase`, ``, `### Tasks`, ``, tasks, ``].join(eol);
  const CHECKED = "- [x] T1: One.\n- [x] T2: Two.";

  function doctorProject(): string {
    const root = path.join(temp, "doctor");
    mkdirSync(path.join(root, ".make-docs"), { recursive: true });
    writeFileSync(path.join(root, ".make-docs/config.yaml"), `projectId: ${PROJECT_ID}\nwork:\n  syncHold:\n    - ${HELD}/\n`);
    write(root, `${DONE}/00-index.md`, index('"completed"'));
    write(root, `${DONE}/01-checked.md`, phase('"active"', CHECKED));
    write(root, `${DONE}/02-unfinished.md`, phase("'open'", "- [x] T1: One.\n- [ ] T2: Two."));
    write(root, `${DONE}/03-plain.md`, phase("active", CHECKED));
    write(root, `${DONE}/04-crlf.md`, phase('"active"', "- [x] T1: One.", "\r\n"));
    write(root, `${DONE}/05-completed.md`, phase('"completed"', CHECKED));
    write(root, `${DONE}/06-draft.md`, phase('"draft"', CHECKED));
    write(root, `${COMPLETE}/00-index.md`, index('"complete"'));
    write(root, `${COMPLETE}/01-checked.md`, phase('"active"', CHECKED));
    write(root, `${ACTIVE}/00-index.md`, index('"active"'));
    write(root, `${ACTIVE}/01-checked.md`, phase('"active"', CHECKED));
    write(root, `${HELD}/00-index.md`, index('"completed"'));
    write(root, `${HELD}/01-checked.md`, phase('"active"', CHECKED));
    return platform.describePath(root).canonicalPath;
  }
  const read = (root: string, relative: string) => readFileSync(path.join(root, ...relative.split("/")), "utf8");

  it("finds open phases under a completed index, marks unfinished ones report only, and skips held paths", () => {
    const root = doctorProject();
    const result = checkProjectDoctor(root);
    const found = result.findings.filter((finding) => finding.check === "phase-open-under-completed-index");
    expect(found.map((finding) => [finding.file, finding.kind, finding.line, finding.current, finding.replacement])).toEqual([
      [`${DONE}/01-checked.md`, "open-under-completed-index", 4, 'status: "active"', 'status: "completed"'],
      [`${DONE}/02-unfinished.md`, "open-under-completed-index-report-only", 4, "status: 'open'", "status: 'open'"],
      [`${DONE}/03-plain.md`, "open-under-completed-index", 4, "status: active", "status: completed"],
      [`${DONE}/04-crlf.md`, "open-under-completed-index", 4, 'status: "active"', 'status: "completed"'],
      [`${COMPLETE}/01-checked.md`, "open-under-completed-index", 4, 'status: "active"', 'status: "completed"'],
    ]);
    expect(result.skipped).toContainEqual({ path: `${HELD}/01-checked.md`, reason: "sync-hold", check: "phase-open-under-completed-index" });
    expect(result.totals.byCheck["phase-open-under-completed-index"]).toEqual({ phaseFiles: 4, reportOnly: 1 });
    expect(result.summary).toBe("Found 5 phase files marked active or open under a completed index (4 with every task checked, which the fix sets to completed; 1 report only). Nothing changed.");
    expect(checkProjectDoctor(root, [DONE, COMPLETE]).findings).toEqual([]);
  });

  it("the fix sets only the reviewed status lines, keeps quotes and line endings, and never writes a report-only or held file", () => {
    const root = doctorProject();
    getInstallationCheckoutId(root, store);
    const unfinished = read(root, `${DONE}/02-unfinished.md`);
    const held = read(root, `${HELD}/01-checked.md`);
    const check = checkProjectDoctor(root);
    expect(fixProjectDoctor({ projectRoot: root, review: check.reviewDigest, storeRoot: store, dryRun: true }).summary).toBe("Dry run. Would set 4 status lines to completed in 4 files. Nothing changed.");
    const fixed = fixProjectDoctor({ projectRoot: root, review: check.reviewDigest, storeRoot: store });
    expect(fixed.summary).toBe("Set 4 status lines to completed in 4 files. No other text changed.");
    expect(read(root, `${DONE}/01-checked.md`)).toBe(phase('"completed"', CHECKED));
    expect(read(root, `${DONE}/03-plain.md`)).toBe(phase("completed", CHECKED));
    expect(read(root, `${DONE}/04-crlf.md`)).toBe(phase('"completed"', "- [x] T1: One.", "\r\n"));
    expect(read(root, `${DONE}/02-unfinished.md`)).toBe(unfinished);
    expect(read(root, `${HELD}/01-checked.md`)).toBe(held);
    const after = checkProjectDoctor(root);
    expect(after.findings.map((finding) => finding.kind)).toEqual(["open-under-completed-index-report-only"]);
    expect(after.nextAction).toBe("Review each finding. Every finding is report only, so the fix would change nothing. Decide each phase by hand.");
    expect(fixProjectDoctor({ projectRoot: root, review: after.reviewDigest, storeRoot: store }).summary).toBe("Nothing to fix: 1 finding is report only. Nothing changed.");
  });

  it("gives the same answer as the shared example in the agent twin", () => {
    const body = readFileSync(path.join(REPO_ROOT, "packages/docs/template/.make-docs/system/references/project-doctor.md"), "utf8");
    const section = body.slice(body.indexOf("## The `phase-open-under-completed-index` Check"), body.indexOf("## Shared Examples"));
    const [indexText, before, after] = [...section.matchAll(/```markdown\n([\s\S]*?)```/g)].map((match) => match[1]!);
    expect(section.startsWith("## The `phase-open-under-completed-index` Check")).toBe(true);
    expect([indexText, before, after].every((block) => typeof block === "string" && block.length > 0)).toBe(true);
    const match = scanPhaseOpenUnderCompletedIndex("docs/work/2026-01-01-w1-r0-sample/01-phase.md", before!, indexRecordedStatus("docs/work/2026-01-01-w1-r0-sample/00-index.md", indexText!));
    expect(match).not.toBeNull();
    expect(match!.after).toBe(after);
    expect(readFileSync(path.join(REPO_ROOT, ".make-docs/system/references/project-doctor.md")).equals(Buffer.from(body))).toBe(true);
  });
});
