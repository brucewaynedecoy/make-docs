import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  utimesSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, test, vi } from "vitest";

import { callMakeDocsMcpTool } from "../src/mcp/tools";
import { createExecutionContext } from "../src/operations/context";
import { getOperation, invokeOperation, listOperations } from "../src/operations/registry";
import {
  BacklogSnapshotError,
  buildBacklogSnapshot,
  type BacklogSnapshotV1,
} from "../src/operations/work/backlog";
import { adaptRunCliArgv, runRunCommand } from "../src/run/cli";
import { renderRunOperationText } from "../src/run/render";

const FIXED_NOW = new Date("2042-07-01T12:00:00.000Z");
const NO_GIT = () => ({
  status: 128,
  stdout: "",
  stderr: "fatal: not a git repository",
  errorCode: null,
});

const roots: string[] = [];

function root(): string {
  const value = mkdtempSync(path.join(tmpdir(), "make-docs-backlog-snapshot-"));
  roots.push(value);
  return value;
}

function write(targetRoot: string, relative: string, contents: string): string {
  const absolute = path.join(targetRoot, ...relative.split("/"));
  mkdirSync(path.dirname(absolute), { recursive: true });
  writeFileSync(absolute, contents, "utf8");
  return absolute;
}

function currentIndex(options: {
  coordinate?: string;
  status?: string;
  title?: string;
  phase?: string;
  source?: string;
} = {}): string {
  const phase = options.phase ?? "01-build-it.md";
  return `---
title: "${options.title ?? "Build It"}"
kind: "work"
status: "${options.status ?? "active"}"
coordinate: "${options.coordinate ?? "W1 R0"}"
${options.source ? `source:\n  type: "prd"\n  path: "${options.source}"\n` : ""}---

# Work

## Phase Map

| Phase | File |
| --- | --- |
| P1 | [Build it](${phase}) |
`;
}

function currentPhase(options: {
  coordinate?: string;
  status?: string;
  tasks?: string;
  source?: string;
} = {}): string {
  return `---
title: "Phase 1: Build It"
kind: "work"
status: "${options.status ?? "active"}"
coordinate: "${options.coordinate ?? "W1 R0 P1"}"
${options.source ? `source:\n  type: "prd"\n  path: "${options.source}"\n` : ""}---

# Phase

## Stage 1 - Build

### Tasks

${options.tasks ?? "- [x] t1: One completed task\n- [ ] t2: One open task"}

### Dependencies

- W2 R0 must settle first.

### Blockers

- Owner decision is pending.
`;
}

function fixture(targetRoot: string): void {
  write(targetRoot, ".make-docs/config.yaml", "projectId: fixture-project\n");
  write(targetRoot, "docs/prd/51-example.md", "# Source\n");
  const record = "docs/work/2042-06-01-w1-r0-build-it";
  write(targetRoot, `${record}/00-index.md`, currentIndex({ source: "../../prd/51-example.md" }));
  write(targetRoot, `${record}/01-build-it.md`, currentPhase({ source: "../../prd/51-example.md" }));
  write(
    targetRoot,
    ".make-docs/archive/work/2041-12-01-w2-r0-old/00-index.md",
    "# Old body without frontmatter\n\nstatus: complete\n\n- [x] t1: Legacy body text must not be parsed.\n",
  );
}

function tree(targetRoot: string): string[] {
  const found: string[] = [];
  const visit = (directory: string) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      const relative = path.relative(targetRoot, absolute);
      found.push(`${entry.isDirectory() ? "d" : "f"}:${relative}`);
      if (entry.isDirectory()) visit(absolute);
    }
  };
  visit(targetRoot);
  return found.sort();
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  while (roots.length > 0) rmSync(roots.pop()!, { recursive: true, force: true });
});

describe("work.backlog.snapshot core", () => {
  test("returns supported current facts and inventory-only unsupported records", () => {
    const targetRoot = root();
    fixture(targetRoot);
    const snapshot = buildBacklogSnapshot(targetRoot, { now: () => FIXED_NOW, runGit: NO_GIT });

    expect(snapshot.schemaVersion).toBe(1);
    expect(snapshot.generatedAt).toBe(FIXED_NOW.toISOString());
    expect(snapshot.project).toEqual({
      id: "fixture-project",
      name: path.basename(targetRoot),
      manifestPath: ".make-docs/config.yaml",
    });
    expect(snapshot.recordCounts).toEqual({ found: 2, live: 1, archived: 1 });
    expect(snapshot.capabilities).toMatchObject({
      repositoryFiles: { state: "available" },
      git: { state: "not-a-repository", diagnosticCodes: ["BACKLOG-VAL-010"] },
      store: { state: "not-used", diagnosticCodes: [] },
      sourceLinks: { state: "available" },
    });

    const current = snapshot.records.find((record) => record.scope === "live")!;
    expect(current.sourceShape.state).toBe("supported");
    expect(current.coordinate.value).toBe("W1 R0");
    expect(current.phases).toHaveLength(1);
    expect(current.taskCounts).toMatchObject({
      total: { value: 2 },
      complete: { value: 1 },
      incomplete: { value: 1 },
      unknown: { value: 0 },
    });
    expect(current.dependencies[0]?.target.value).toBe("W2 R0");
    expect(current.blockers[0]?.text.value).toContain("Owner decision");
    expect(current.sourceLinks.every((link) => link.state === "valid")).toBe(true);
    expect(current.lastUpdatedAt.source).toBe("filesystem-mtime");

    const archived = snapshot.records.find((record) => record.scope === "archived")!;
    expect(archived.sourceShape.state).toBe("unsupported");
    expect(archived.coordinate.value).toBe("W2 R0");
    expect(archived.title.value).toBeNull();
    expect(archived.phases).toEqual([]);
    expect(archived.closeout).toBeNull();
    expect(archived.gitEvidence).toEqual([]);
    expect(snapshot.diagnostics.map((entry) => entry.code)).toContain("BACKLOG-VAL-004");
  });

  test("keeps malformed current data partial and excludes unlinked current phases", () => {
    const targetRoot = root();
    const record = "docs/work/2042-06-02-w3-r1-partial";
    write(
      targetRoot,
      `${record}/00-index.md`,
      `---\ntitle: "Partial"\nkind: "work"\nstatus: [broken\ncoordinate: "W3 R1"\n---\n\n# Work\n\n## Phase Map\n`,
    );
    write(targetRoot, `${record}/02-unlinked.md`, currentPhase({ coordinate: "W3 R1 P2" }));
    const snapshot = buildBacklogSnapshot(targetRoot, { now: () => FIXED_NOW, runGit: NO_GIT });
    const value = snapshot.records[0]!;

    expect(value.sourceShape).toEqual({
      state: "partial",
      standard: "current-frontmatter",
      diagnosticCodes: ["BACKLOG-VAL-003"],
    });
    expect(value.phases).toEqual([]);
    expect(snapshot.diagnostics.map((entry) => entry.code)).toEqual(
      expect.arrayContaining(["BACKLOG-VAL-003", "BACKLOG-VAL-007", "BACKLOG-VAL-010"]),
    );
  });

  test("reports duplicate coordinates without merging record paths", () => {
    const targetRoot = root();
    for (const suffix of ["a", "b"]) {
      const record = `docs/work/2042-06-03-w4-r0-${suffix}`;
      write(targetRoot, `${record}/00-index.md`, currentIndex({ coordinate: "W4 R0" }));
      write(targetRoot, `${record}/01-build-it.md`, currentPhase({ coordinate: "W4 R0 P1" }));
    }
    const snapshot = buildBacklogSnapshot(targetRoot, { now: () => FIXED_NOW, runGit: NO_GIT });
    expect(snapshot.records).toHaveLength(2);
    expect(snapshot.records.map((record) => record.recordPath)).toEqual([
      "docs/work/2042-06-03-w4-r0-a",
      "docs/work/2042-06-03-w4-r0-b",
    ]);
    expect(new Set(snapshot.records.map((record) => record.recordPath)).size).toBe(2);
    expect(snapshot.diagnostics.filter((entry) => entry.code === "BACKLOG-VAL-005")).toHaveLength(2);
  });

  test("keeps broken links, source limits, and recorded status conflicts separate", () => {
    const targetRoot = root();
    const record = "docs/work/2042-06-04-w6-r0-conflict";
    const index = currentIndex({
      coordinate: "W6 R0",
      status: "complete",
      source: "../../../../outside.md",
    }).replace(
      "| P1 | [Build it](01-build-it.md) |",
      "| P1 | [Build it](01-build-it.md) |\n| P2 | [Missing](02-missing.md) |",
    );
    write(targetRoot, `${record}/00-index.md`, index);
    write(
      targetRoot,
      `${record}/01-build-it.md`,
      currentPhase({ coordinate: "W6 R0 P1", tasks: "- [ ] t1: Still open" }),
    );
    const snapshot = buildBacklogSnapshot(targetRoot, { now: () => FIXED_NOW, runGit: NO_GIT });
    const codes = snapshot.diagnostics.map((entry) => entry.code);

    expect(codes).toEqual(
      expect.arrayContaining(["BACKLOG-VAL-006", "BACKLOG-VAL-008", "BACKLOG-VAL-009"]),
    );
    expect(snapshot.records[0]!.recordedStatus.value).toBe("complete");
    expect(snapshot.records[0]!.taskCounts.incomplete.value).toBe(1);
    expect(snapshot.records[0]!.sourceLinks[0]).toMatchObject({ state: "unsafe", targetPath: null });
  });

  test("does not follow a linked phase through a symbolic-link directory", () => {
    const targetRoot = root();
    const outsideRoot = root();
    const record = "docs/work/2042-06-06-w6-r1-symlink-phase";
    write(
      targetRoot,
      `${record}/00-index.md`,
      currentIndex({ coordinate: "W6 R1", phase: "linked/01-build-it.md" }),
    );
    write(outsideRoot, "01-build-it.md", currentPhase({ coordinate: "W6 R1 P1" }));
    symlinkSync(outsideRoot, path.join(targetRoot, record, "linked"), "dir");

    const snapshot = buildBacklogSnapshot(targetRoot, { now: () => FIXED_NOW, runGit: NO_GIT });

    expect(snapshot.records[0]!.phases).toEqual([]);
    expect(snapshot.diagnostics.map((entry) => entry.code)).toContain("BACKLOG-VAL-006");
  });

  test("keeps a missing index as inventory and uses the created-date fallback when no file exists", () => {
    const targetRoot = root();
    mkdirSync(path.join(targetRoot, "docs/work/2042-06-07-w7-r0-empty"), { recursive: true });
    const snapshot = buildBacklogSnapshot(targetRoot, { now: () => FIXED_NOW, runGit: NO_GIT });
    const value = snapshot.records[0]!;

    expect(value.sourceShape.state).toBe("unsupported");
    expect(value.discoveredFiles).toEqual([]);
    expect(value.lastUpdatedAt).toMatchObject({
      value: "2042-06-07",
      precision: "date",
      source: "created-at-fallback",
      diagnosticCodes: ["BACKLOG-VAL-010", "BACKLOG-VAL-011"],
    });
    expect(snapshot.diagnostics.map((entry) => entry.code)).toEqual(
      expect.arrayContaining([
        "BACKLOG-VAL-002",
        "BACKLOG-VAL-004",
        "BACKLOG-VAL-010",
        "BACKLOG-VAL-011",
      ]),
    );
  });

  test.each([
    ["unavailable", { status: null, stdout: "", stderr: "spawn git ENOENT", errorCode: "ENOENT" }],
    ["denied", { status: 128, stdout: "", stderr: "permission denied", errorCode: null }],
  ] as const)("keeps repository facts when Git is %s", (state, gitResult) => {
    const targetRoot = root();
    fixture(targetRoot);
    const snapshot = buildBacklogSnapshot(targetRoot, {
      now: () => FIXED_NOW,
      runGit: () => gitResult,
    });
    expect(snapshot.capabilities.git.state).toBe(state);
    expect(snapshot.recordCounts.found).toBe(2);
    expect(snapshot.records[0]!.lastUpdatedAt.value).not.toBeNull();
  });

  test("uses working-tree time, Git commit time, file time, and created-date fallback in order", () => {
    const targetRoot = root();
    const record = "docs/work/2042-06-05-w5-r0-dates";
    const index = write(
      targetRoot,
      `${record}/00-index.md`,
      currentIndex({ coordinate: "W5 R0", source: "../../prd/51-example.md" }),
    );
    const phase = write(targetRoot, `${record}/01-build-it.md`, currentPhase({ coordinate: "W5 R0 P1" }));
    const linkedSource = write(targetRoot, "docs/prd/51-example.md", "# Newer product source\n");
    utimesSync(index, new Date("2042-06-10T10:00:00Z"), new Date("2042-06-10T10:00:00Z"));
    utimesSync(phase, new Date("2042-06-12T10:00:00Z"), new Date("2042-06-12T10:00:00Z"));
    utimesSync(linkedSource, new Date("2050-01-01T00:00:00Z"), new Date("2050-01-01T00:00:00Z"));

    const changed = buildBacklogSnapshot(targetRoot, {
      now: () => FIXED_NOW,
      runGit: (_cwd, args) => {
        if (args[0] === "rev-parse" && args[1] === "--show-toplevel") return { status: 0, stdout: `${targetRoot}\n`, stderr: "", errorCode: null };
        if (args[0] === "rev-parse") return { status: 0, stdout: `${"a".repeat(40)}\n`, stderr: "", errorCode: null };
        if (args[0] === "status") return { status: 0, stdout: `R  ${record}/01-build-it.md\0${record}/01-old-name.md\0`, stderr: "", errorCode: null };
        return { status: 0, stdout: "", stderr: "", errorCode: null };
      },
    });
    expect(changed.records[0]!.lastUpdatedAt.source).toBe("working-tree-mtime");
    expect(changed.records[0]!.lastUpdatedAt.evidence[0]!.path).toBe(`${record}/01-build-it.md`);

    const committed = buildBacklogSnapshot(targetRoot, {
      now: () => FIXED_NOW,
      runGit: (_cwd, args) => {
        if (args[0] === "rev-parse" && args[1] === "--show-toplevel") return { status: 0, stdout: `${targetRoot}\n`, stderr: "", errorCode: null };
        if (args[0] === "rev-parse") return { status: 0, stdout: `${"b".repeat(40)}\n`, stderr: "", errorCode: null };
        if (args[0] === "status") return { status: 0, stdout: "", stderr: "", errorCode: null };
        return { status: 0, stdout: `${"c".repeat(40)}\0${"2042-06-11T09:00:00Z"}\0\n${record}/01-build-it.md\0`, stderr: "", errorCode: null };
      },
    });
    expect(committed.records[0]!.lastUpdatedAt).toMatchObject({
      source: "git-commit",
      value: "2042-06-11T09:00:00.000Z",
      diagnosticCodes: [],
    });
    expect(committed.records[0]!.lastUpdatedAt.evidence[0]!.path).toBe(`${record}/01-build-it.md`);

    const fallback = buildBacklogSnapshot(targetRoot, { now: () => FIXED_NOW, runGit: NO_GIT });
    expect(fallback.records[0]!.lastUpdatedAt.source).toBe("filesystem-mtime");
    expect(fallback.records[0]!.lastUpdatedAt.value).not.toBe("2050-01-01T00:00:00.000Z");
    expect(fallback.records[0]!.lastUpdatedAt.diagnosticCodes).toEqual(["BACKLOG-VAL-010"]);
  });

  test("fails missing and symbolic-link target roots with one stable typed error", () => {
    const targetRoot = root();
    expect(() => buildBacklogSnapshot(path.join(targetRoot, "missing"))).toThrowError(
      BacklogSnapshotError,
    );
    const link = path.join(path.dirname(targetRoot), `${path.basename(targetRoot)}-link`);
    roots.push(link);
    symlinkSync(targetRoot, link, "dir");
    expect(() => buildBacklogSnapshot(link)).toThrowError(BacklogSnapshotError);
    try {
      buildBacklogSnapshot(link);
    } catch (error) {
      expect(error).toMatchObject({ code: "BACKLOG-VAL-001", ruleId: "BACKLOG-RULE-001" });
    }
  });

  test("does not change project files", () => {
    const targetRoot = root();
    fixture(targetRoot);
    const before = tree(targetRoot);
    buildBacklogSnapshot(targetRoot, { now: () => FIXED_NOW, runGit: NO_GIT });
    expect(tree(targetRoot)).toEqual(before);
    expect(readFileSync(path.join(targetRoot, ".make-docs/config.yaml"), "utf8")).toBe(
      "projectId: fixture-project\n",
    );
  });
});

describe("work.backlog.snapshot surfaces", () => {
  test("registers one read-only Store-free operation and a required target-root CLI input", async () => {
    const targetRoot = root();
    fixture(targetRoot);
    const adapted = adaptRunCliArgv(["work", "backlog", "snapshot", "--target-root", targetRoot, "--json"]);
    expect(adapted.operationId).toBe("work.backlog.snapshot");
    expect(adapted.invocation.input).toEqual({ targetRoot });
    expect(() => adaptRunCliArgv(["work", "backlog", "snapshot"])).toThrow("requires --target-root");
    expect(getOperation("work.backlog.snapshot")).toMatchObject({
      mutates: "read",
      access: { store: "none", project: "read", hostConfig: "none" },
      status: "active",
    });
    expect(listOperations().filter((operation) => operation.id.startsWith("work.backlog."))).toHaveLength(1);

    const invocation = await invokeOperation(
      "work.backlog.snapshot",
      { targetRoot },
      createExecutionContext({ surface: "test", writesAllowed: false }),
    );
    expect(invocation.value).toMatchObject({
      schemaVersion: 1,
      capabilities: { store: { state: "not-used", diagnosticCodes: [] } },
    });
  });

  test("keeps CLI JSON and derived MCP results equal", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
    const targetRoot = root();
    fixture(targetRoot);
    const partial = "docs/work/2042-06-08-w8-r0-partial";
    write(
      targetRoot,
      `${partial}/00-index.md`,
      `---\ntitle: "Partial"\nkind: "work"\ncoordinate: "W8 R0"\n---\n\n# Partial\n\n## Phase Map\n`,
    );
    const conflict = "docs/work/2042-06-09-w9-r0-conflict";
    write(
      targetRoot,
      `${conflict}/00-index.md`,
      currentIndex({ coordinate: "W9 R0", status: "complete" }),
    );
    write(
      targetRoot,
      `${conflict}/01-build-it.md`,
      currentPhase({ coordinate: "W9 R0 P1", tasks: "- [ ] t1: Remains open" }),
    );
    const output: string[] = [];
    const spy = vi.spyOn(process.stdout, "write").mockImplementation((chunk) => {
      output.push(String(chunk));
      return true;
    });
    await runRunCommand(["work", "backlog", "snapshot", "--target-root", targetRoot, "--json"], { isTty: false });
    spy.mockRestore();
    const cli = JSON.parse(output.join("")) as BacklogSnapshotV1;
    const mcp = await callMakeDocsMcpTool("make_docs_work_backlog_snapshot", { targetRoot });
    expect(mcp.result).toEqual(cli);
    expect(cli.records.map((record) => record.sourceShape.state)).toEqual(
      expect.arrayContaining(["supported", "partial", "unsupported"]),
    );
    expect(cli.diagnostics.map((entry) => entry.code)).toEqual(
      expect.arrayContaining(["BACKLOG-VAL-003", "BACKLOG-VAL-004", "BACKLOG-VAL-008"]),
    );
  });

  test("keeps CLI and MCP root failures typed the same way", async () => {
    const missing = path.join(root(), "missing");
    await expect(
      runRunCommand(["work", "backlog", "snapshot", "--target-root", missing, "--json"]),
    ).rejects.toMatchObject({ code: "BACKLOG-VAL-001", ruleId: "BACKLOG-RULE-001" });
    await expect(
      callMakeDocsMcpTool("make_docs_work_backlog_snapshot", { targetRoot: missing }),
    ).rejects.toMatchObject({ code: "BACKLOG-VAL-001", ruleId: "BACKLOG-RULE-001" });
  });

  test("human output leads with status and limits", () => {
    const targetRoot = root();
    fixture(targetRoot);
    const snapshot = buildBacklogSnapshot(targetRoot, { now: () => FIXED_NOW, runGit: NO_GIT });
    const lines = renderRunOperationText("work.backlog.snapshot", snapshot)!;
    expect(lines[0]).toBe("Backlog snapshot: 2 records found (1 live, 1 archived).");
    expect(lines.join("\n")).toContain("inventory only");
    expect(lines.join("\n")).toContain("Limit: Git evidence is not-a-repository");
    expect(lines.join("\n")).toContain("Use --json for exact evidence");
  });

  test("keeps the snapshot core inside the operation package boundary", () => {
    const snapshotSource = readFileSync(
      new URL("../src/operations/work/backlog/snapshot.ts", import.meta.url),
      "utf8",
    );
    const operationSource = readFileSync(
      new URL("../src/operations/work/backlog/operation.ts", import.meta.url),
      "utf8",
    );
    const indexSource = readFileSync(
      new URL("../src/operations/work/backlog/index.ts", import.meta.url),
      "utf8",
    );
    const forbiddenTransportImport = /from\s+["'][^"']*\/(?:run|mcp|store|setup)(?:\/|\.|["'])/;

    expect(snapshotSource).not.toMatch(forbiddenTransportImport);
    expect(operationSource).not.toMatch(forbiddenTransportImport);
    expect(indexSource).toContain('export * from "./operation.js";');
    expect(indexSource).toContain('export * from "./snapshot.js";');
  });
});
