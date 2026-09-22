import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, test } from "vitest";

import {
  BACKLOG_REVIEW_CACHE_MAX_ENTRIES_PER_CHECKOUT,
  BacklogReportRecordV1Schema,
  backlogRecordDigest,
  buildBacklogSnapshot,
  lookupBacklogReviewCache,
  writeBacklogReviewCache,
  type BacklogReportRecordV1,
  type BacklogSnapshotV1,
} from "../src/operations/work/backlog";
import { createExecutionContext } from "../src/operations/context";
import { getOperation, invokeOperation } from "../src/operations/registry";
import { adaptRunCliArgv } from "../src/run/cli";
import {
  CURRENT_STORE_SCHEMA_VERSION,
  bootstrapGlobalStore,
  readUserVersion,
  withStoreDatabase,
} from "../src/store";
import {
  getExistingInstallationCheckoutId,
  withInstallationDatabase,
} from "../src/store/installation-state";

const roots: string[] = [];

function temporaryRoot(prefix: string): string {
  const value = mkdtempSync(path.join(os.tmpdir(), prefix));
  roots.push(value);
  return value;
}

function write(targetRoot: string, relativePath: string, body: string): void {
  const absolute = path.join(targetRoot, ...relativePath.split("/"));
  mkdirSync(path.dirname(absolute), { recursive: true });
  writeFileSync(absolute, body, "utf8");
}

function recordIndex(coordinate: string, title: string): string {
  return `---
title: "${title}"
kind: "work"
status: "active"
coordinate: "${coordinate}"
---

# ${title}

## Phase Map

| Phase | File |
| --- | --- |
| P1 | [Build](01-build.md) |
`;
}

function phase(coordinate: string, task: string): string {
  return `---
title: "Phase 1: Build"
kind: "work"
status: "active"
coordinate: "${coordinate} P1"
---

# Build

## Stage 1 - Build

### Tasks

- [ ] t1: ${task}
`;
}

function projectFixture(recordCount = 3): { projectRoot: string; storeRoot: string } {
  const projectRoot = temporaryRoot("make-docs-backlog-cache-project-");
  const storeRoot = path.join(temporaryRoot("make-docs-backlog-cache-store-"), "store");
  write(projectRoot, ".make-docs/config.yaml", "projectId: backlog-cache-fixture\n");
  for (let index = 1; index <= recordCount; index += 1) {
    const recordPath = `docs/work/2042-06-0${index}-w${index}-r0-wave-${index}`;
    write(projectRoot, `${recordPath}/00-index.md`, recordIndex(`W${index} R0`, `Wave ${index}`));
    write(projectRoot, `${recordPath}/01-build.md`, phase(`W${index} R0`, `Task ${index}`));
  }
  bootstrapGlobalStore({
    storeRoot,
    packageMeta: { name: "make-docs-test", version: "0.0.0-test" },
  });
  return { projectRoot, storeRoot };
}

function reviewFragments(snapshot: BacklogSnapshotV1): BacklogReportRecordV1[] {
  return snapshot.records.map((record) => BacklogReportRecordV1Schema.parse({
    recordPath: record.recordPath,
    scope: record.scope,
    createdAt: record.createdAt,
    lastUpdatedAt: record.lastUpdatedAt,
    waveStatus: record.scope === "live" ? "current" : null,
    statusReason: "Current work",
    statusEvidence: [{
      path: `${record.recordPath}/00-index.md`,
      line: 1,
      field: "status",
      commit: null,
    }],
    facts: [{
      class: "fact",
      text: "The work record is active.",
      evidence: [{
        path: `${record.recordPath}/00-index.md`,
        line: 1,
        field: "status",
        commit: null,
      }],
    }],
    inferences: [],
    recommendations: [],
  }));
}

function projectFiles(root: string): Array<[string, string]> {
  const result: Array<[string, string]> = [];
  const visit = (directory: string): void => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(absolute);
      else result.push([path.relative(root, absolute), readFileSync(absolute, "utf8")]);
    }
  };
  visit(root);
  return result.sort(([left], [right]) => left.localeCompare(right));
}

afterEach(() => {
  while (roots.length > 0) rmSync(roots.pop()!, { recursive: true, force: true });
});

describe("backlog review cache", () => {
  test("uses the accepted registry, CLI, MCP-derived, and Store-gated contracts", async () => {
    const { projectRoot, storeRoot } = projectFixture(1);
    const snapshot = buildBacklogSnapshot(projectRoot);
    const records = reviewFragments(snapshot);
    const snapshotPath = path.join(temporaryRoot("make-docs-backlog-cache-input-"), "snapshot.json");
    const recordsPath = path.join(path.dirname(snapshotPath), "records.json");
    writeFileSync(snapshotPath, JSON.stringify(snapshot), "utf8");
    writeFileSync(recordsPath, JSON.stringify(records), "utf8");

    expect(getOperation("work.backlog-cache.lookup")).toMatchObject({
      mutates: "read",
      access: { store: "read", project: "read", hostConfig: "none" },
      status: "active",
    });
    expect(getOperation("work.backlog-cache.write")).toMatchObject({
      mutates: "write",
      access: { store: "write", project: "read", hostConfig: "none" },
      status: "active",
    });
    expect(adaptRunCliArgv([
      "work", "backlog-cache", "lookup",
      "--target-root", projectRoot,
      "--snapshot-json", snapshotPath,
    ]).invocation.input).toEqual({ targetRoot: projectRoot, snapshot });
    expect(adaptRunCliArgv([
      "work", "backlog-cache", "write",
      "--target-root", projectRoot,
      "--snapshot-json", snapshotPath,
      "--records-json", recordsPath,
    ]).invocation.input).toEqual({ targetRoot: projectRoot, snapshot, records });

    const cold = await invokeOperation(
      "work.backlog-cache.lookup",
      { targetRoot: projectRoot, snapshot },
      createExecutionContext({
        surface: "test",
        cwd: projectRoot,
        storeRoot,
        writesAllowed: false,
      }),
    );
    expect(cold.value).toMatchObject({
      service: { state: "available", checkout: "unbound" },
      counts: { total: 1, hits: 0, misses: 1, rejected: 0 },
    });

    const saved = await invokeOperation(
      "work.backlog-cache.write",
      { targetRoot: projectRoot, snapshot, records },
      createExecutionContext({
        surface: "test",
        cwd: projectRoot,
        storeRoot,
        writesAllowed: true,
      }),
    );
    expect(saved.value).toMatchObject({
      service: { state: "available", checkout: "bound" },
      counts: { total: 1, stored: 1, rejected: 0 },
    });

    const warm = await invokeOperation(
      "work.backlog-cache.lookup",
      { targetRoot: projectRoot, snapshot },
      createExecutionContext({
        surface: "test",
        cwd: projectRoot,
        storeRoot,
        writesAllowed: false,
      }),
    );
    expect(warm.value).toMatchObject({
      service: { state: "available", checkout: "bound" },
      counts: { total: 1, hits: 1, misses: 0, rejected: 0 },
    });
  });

  test("adds the rebuildable cache table through the current Store migration", () => {
    const { storeRoot } = projectFixture(1);
    withStoreDatabase(storeRoot, (db) => {
      expect(readUserVersion(db)).toBe(CURRENT_STORE_SCHEMA_VERSION);
      expect(db.prepare(
        "SELECT name FROM sqlite_schema WHERE type='table' AND name='backlog_review_cache'",
      ).get()).toEqual({ name: "backlog_review_cache" });
    });
  });

  test("does not create or migrate cache schema during lookup", () => {
    const { projectRoot, storeRoot } = projectFixture(1);
    const snapshot = buildBacklogSnapshot(projectRoot);
    withStoreDatabase(storeRoot, (db) => {
      db.exec("DROP TABLE backlog_review_cache");
      db.exec("DELETE FROM store_schema_journal WHERE schema_version=6");
      db.exec("PRAGMA user_version=5");
    });

    expect(() => lookupBacklogReviewCache(projectRoot, snapshot, storeRoot)).toThrow(
      /requires version 6/,
    );
    withInstallationDatabase(projectRoot, (db) => {
      expect(readUserVersion(db)).toBe(5);
      expect(db.prepare(
        "SELECT name FROM sqlite_schema WHERE type='table' AND name='backlog_review_cache'",
      ).get()).toBeUndefined();
    }, { storeRoot, readOnly: true });
  });

  test("does not migrate a legacy Store during cache write", () => {
    const { projectRoot, storeRoot } = projectFixture(1);
    const snapshot = buildBacklogSnapshot(projectRoot);
    const fragments = reviewFragments(snapshot);
    withStoreDatabase(storeRoot, (db) => {
      db.exec("DROP TABLE backlog_review_cache");
      db.exec("DELETE FROM store_schema_journal WHERE schema_version=6");
      db.exec("PRAGMA user_version=5");
    });

    expect(() => writeBacklogReviewCache(projectRoot, snapshot, fragments, storeRoot)).toThrow(
      /requires version 6/,
    );
    withInstallationDatabase(projectRoot, (db) => {
      expect(readUserVersion(db)).toBe(5);
      expect(db.prepare(
        "SELECT name FROM sqlite_schema WHERE type='table' AND name='backlog_review_cache'",
      ).get()).toBeUndefined();
    }, { storeRoot, readOnly: true });
  });

  test("returns exact hits, misses one changed record, and never changes project files", () => {
    const { projectRoot, storeRoot } = projectFixture();
    const snapshot = buildBacklogSnapshot(projectRoot);
    const fragments = reviewFragments(snapshot);
    const before = projectFiles(projectRoot);

    const cold = lookupBacklogReviewCache(projectRoot, snapshot, storeRoot);
    expect(cold.service).toEqual({ state: "available", checkout: "unbound" });
    expect(cold.counts).toEqual({ total: 3, hits: 0, misses: 3, rejected: 0 });

    const saved = writeBacklogReviewCache(projectRoot, snapshot, fragments, storeRoot, {
      now: "2042-07-01T12:00:00.000Z",
    });
    expect(saved.counts).toEqual({ total: 3, stored: 3, rejected: 0, invalidated: 0, pruned: 0 });
    expect(projectFiles(projectRoot)).toEqual(before);

    const warm = lookupBacklogReviewCache(projectRoot, snapshot, storeRoot);
    expect(warm.counts).toEqual({ total: 3, hits: 3, misses: 0, rejected: 0 });
    expect(warm.records.filter((record) => record.state === "hit").map((record) => record.fragment))
      .toEqual(fragments);

    const changedPath = snapshot.records[0]!.recordPath;
    write(projectRoot, `${changedPath}/01-build.md`, phase("W1 R0", "Changed task"));
    const changedSnapshot = buildBacklogSnapshot(projectRoot);
    const afterChange = lookupBacklogReviewCache(projectRoot, changedSnapshot, storeRoot);
    expect(afterChange.counts).toEqual({ total: 3, hits: 2, misses: 1, rejected: 0 });
    expect(afterChange.records.find((record) => record.recordPath === changedPath)).toMatchObject({
      state: "miss",
      reason: "no-exact-match",
    });
    expect(backlogRecordDigest(changedSnapshot.records[0]!)).not.toBe(
      backlogRecordDigest(snapshot.records[0]!),
    );
  });

  test("rejects corrupt and private fragments instead of reusing them", () => {
    const { projectRoot, storeRoot } = projectFixture(1);
    const snapshot = buildBacklogSnapshot(projectRoot);
    const fragment = reviewFragments(snapshot)[0]!;
    writeBacklogReviewCache(projectRoot, snapshot, [fragment], storeRoot);
    const checkoutId = getExistingInstallationCheckoutId(projectRoot, storeRoot)!;

    withInstallationDatabase(projectRoot, (db) => {
      db.prepare(
        "UPDATE backlog_review_cache SET fragment_json='not-json' WHERE checkout_id=?",
      ).run(checkoutId);
    }, { storeRoot });
    const corrupt = lookupBacklogReviewCache(projectRoot, snapshot, storeRoot);
    expect(corrupt.counts).toEqual({ total: 1, hits: 0, misses: 0, rejected: 1 });
    expect(corrupt.records[0]).toMatchObject({
      state: "rejected",
      reason: "cached fragment is not valid JSON",
    });

    const privateFragment = structuredClone(fragment);
    privateFragment.facts[0]!.text = "A private file exists at /Users/example/private.txt.";
    const privateWrite = writeBacklogReviewCache(
      projectRoot,
      snapshot,
      [privateFragment],
      storeRoot,
    );
    expect(privateWrite.counts).toEqual({
      total: 1,
      stored: 0,
      rejected: 1,
      invalidated: 0,
      pruned: 0,
    });
    expect(privateWrite.records[0]).toMatchObject({
      state: "rejected",
      reason: "fragment contains an absolute local path",
    });
  });

  test("invalidates an older digest and prunes to the configured bound", () => {
    const { projectRoot, storeRoot } = projectFixture();
    const snapshot = buildBacklogSnapshot(projectRoot);
    const fragments = reviewFragments(snapshot);
    const first = writeBacklogReviewCache(projectRoot, snapshot, fragments, storeRoot, {
      maxEntries: 2,
      now: "2042-07-01T12:00:00.000Z",
    });
    expect(first.counts.pruned).toBe(1);
    expect(BACKLOG_REVIEW_CACHE_MAX_ENTRIES_PER_CHECKOUT).toBeGreaterThan(2);

    const changedPath = snapshot.records[0]!.recordPath;
    write(projectRoot, `${changedPath}/01-build.md`, phase("W1 R0", "Changed again"));
    const changedSnapshot = buildBacklogSnapshot(projectRoot);
    const changedFragments = reviewFragments(changedSnapshot).filter(
      (record) => record.recordPath === changedPath,
    );
    const second = writeBacklogReviewCache(
      projectRoot,
      changedSnapshot,
      changedFragments,
      storeRoot,
      { maxEntries: 2, now: "2042-07-01T12:01:00.000Z" },
    );
    expect(second.counts.invalidated).toBe(1);

    const checkoutId = getExistingInstallationCheckoutId(projectRoot, storeRoot)!;
    withInstallationDatabase(projectRoot, (db) => {
      const row = db.prepare(
        "SELECT COUNT(*) AS count FROM backlog_review_cache WHERE checkout_id=?",
      ).get(checkoutId) as { count: number };
      expect(Number(row.count)).toBeLessThanOrEqual(2);
    }, { storeRoot, readOnly: true });
  });
});
