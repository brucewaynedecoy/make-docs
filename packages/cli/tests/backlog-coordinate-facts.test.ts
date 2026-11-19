import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, test } from "vitest";

import { BACKLOG_RULES } from "../src/operations/work/backlog/catalog";
import { buildBacklogSnapshot, type BacklogSnapshotV1 } from "../src/operations/work/backlog";

const FIXED_NOW = () => new Date("2042-07-01T12:00:00.000Z");
const NO_GIT = () => ({ status: 128, stdout: "", stderr: "fatal: not a git repository", errorCode: null });

const roots: string[] = [];

function root(): string {
  const value = mkdtempSync(path.join(tmpdir(), "make-docs-coordinate-facts-"));
  roots.push(value);
  return value;
}

function write(targetRoot: string, relative: string, contents: string): void {
  const absolute = path.join(targetRoot, ...relative.split("/"));
  mkdirSync(path.dirname(absolute), { recursive: true });
  writeFileSync(absolute, contents, "utf8");
}

function git(targetRoot: string, ...args: string[]): void {
  const result = spawnSync("git", ["-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "-c", "commit.gpgsign=false", ...args], {
    cwd: targetRoot,
    encoding: "utf8",
  });
  if (result.status !== 0) throw new Error(`git ${args.join(" ")} failed: ${result.stderr}`);
}

function index(coordinate: string, phases: string[], extra = ""): string {
  const rows = phases.map((file, position) => `| P${position + 1} | [Phase ${position + 1}](${file}) |`).join("\n");
  return `---
title: "Fixture Work"
kind: "work"
status: "active"
coordinate: "${coordinate}"
---

# Fixture Work

## Phase Map

| Phase | File |
| --- | --- |
${rows}
${extra}`;
}

function phase(coordinate: string, closeout: string | null = null): string {
  return `---
title: "Fixture Phase"
kind: "work"
status: "active"
coordinate: "${coordinate}"
---

# Fixture Phase

## Stage 1 - Work

### Tasks

- [x] t1: Done

### Acceptance criteria

- A1: Done.
${closeout === null ? "" : `\n### Closeout Notes\n\n${closeout}\n`}`;
}

const RECORD = "docs/work/2042-06-01-w1-r0-fixture";

function record(snapshot: BacklogSnapshotV1, recordPath = RECORD) {
  const found = snapshot.records.find((entry) => entry.recordPath === recordPath);
  if (!found) throw new Error(`Missing record ${recordPath}`);
  return found;
}

function changeHistoryDiagnostics(snapshot: BacklogSnapshotV1) {
  return snapshot.diagnostics.filter((entry) => entry.code === "BACKLOG-VAL-017");
}

const VALID_ENTRY = `### 2042-06-10 — W1 R0 P1

- Kind: \`edit\`
- Affected scope: P1 t1
- Previous scope: One task.
- Replacement scope: One clearer task.
- Rationale: The task wording was unclear.
- PRD decision: \`none\` — Wording only.
- Owner approval: Not required
- Source: [Plan](../../plans/fixture.md)
`;

function withChangeHistory(entries: string): string {
  return index("W1 R0", ["01-phase.md"], `\n## Change History\n\n<!-- Optional template guidance. -->\n\n${entries}`);
}

afterEach(() => {
  while (roots.length > 0) rmSync(roots.pop()!, { recursive: true, force: true });
});

describe("committed facts", () => {
  test("report tracked clean files as committed and changed or untracked files as not committed", () => {
    const targetRoot = root();
    write(targetRoot, `${RECORD}/00-index.md`, index("W1 R0", ["01-one.md", "02-two.md", "03-three.md"]));
    write(targetRoot, `${RECORD}/01-one.md`, phase("W1 R0 P1"));
    write(targetRoot, `${RECORD}/02-two.md`, phase("W1 R0 P2"));
    git(targetRoot, "init", "-q", "-b", "main");
    git(targetRoot, "add", ".");
    git(targetRoot, "commit", "-q", "-m", "fixture");
    write(targetRoot, `${RECORD}/02-two.md`, `${phase("W1 R0 P2")}\nLocal change.\n`);
    write(targetRoot, `${RECORD}/03-three.md`, phase("W1 R0 P3"));

    const facts = record(buildBacklogSnapshot(targetRoot, { now: FIXED_NOW }));
    const byFile = Object.fromEntries(facts.phases.map((entry) => [path.posix.basename(entry.phasePath), entry.committed.value]));
    expect(byFile).toEqual({ "01-one.md": true, "02-two.md": false, "03-three.md": false });
    expect(facts.closeout?.committed.value).toBe(false);
    expect(facts.phases[0]!.committed.evidence[0]).toMatchObject({ path: `${RECORD}/01-one.md`, field: "git status" });
  });

  test("report the record as committed only when the index and every linked phase are clean", () => {
    const targetRoot = root();
    write(targetRoot, `${RECORD}/00-index.md`, index("W1 R0", ["01-one.md"]));
    write(targetRoot, `${RECORD}/01-one.md`, phase("W1 R0 P1"));
    git(targetRoot, "init", "-q", "-b", "main");
    git(targetRoot, "add", ".");
    git(targetRoot, "commit", "-q", "-m", "fixture");

    const facts = record(buildBacklogSnapshot(targetRoot, { now: FIXED_NOW }));
    expect(facts.phases[0]!.committed.value).toBe(true);
    expect(facts.closeout?.committed.value).toBe(true);
  });

  test("keep committed facts unknown when Git evidence is unavailable", () => {
    const targetRoot = root();
    write(targetRoot, `${RECORD}/00-index.md`, index("W1 R0", ["01-one.md"]));
    write(targetRoot, `${RECORD}/01-one.md`, phase("W1 R0 P1"));

    const snapshot = buildBacklogSnapshot(targetRoot, { now: FIXED_NOW, runGit: NO_GIT });
    const facts = record(snapshot);
    expect(snapshot.capabilities.git.state).toBe("not-a-repository");
    expect(facts.phases[0]!.committed).toEqual({ value: null, evidence: [] });
    expect(facts.closeout?.committed).toEqual({ value: null, evidence: [] });
  });
});

describe("closeout notes facts", () => {
  test.each([
    ["absent section", null, false],
    ["filled notes", "- Phase / capability status: Phase complete.", true],
    ["unresolved placeholder", "- Phase / capability status: {{PHASE_AND_CAPABILITY_STATUS}}", false],
    ["comment only", "<!-- Fill at closeout. -->", false],
  ])("report %s", (_label, closeout, expected) => {
    const targetRoot = root();
    write(targetRoot, `${RECORD}/00-index.md`, index("W1 R0", ["01-one.md"]));
    write(targetRoot, `${RECORD}/01-one.md`, phase("W1 R0 P1", closeout));

    const facts = record(buildBacklogSnapshot(targetRoot, { now: FIXED_NOW, runGit: NO_GIT }));
    expect(facts.phases[0]!.closeoutNotesPresent.value).toBe(expected);
  });
});

describe("coordinate facts", () => {
  test("derive the highest wave, each wave's revisions, and each record's next phase", () => {
    const targetRoot = root();
    write(targetRoot, "docs/work/2042-06-01-w1-r0-base/00-index.md", index("W1 R0", ["01-one.md", "02-two.md"]));
    write(targetRoot, "docs/work/2042-06-01-w1-r0-base/01-one.md", phase("W1 R0 P1"));
    write(targetRoot, "docs/work/2042-06-01-w1-r0-base/02-two.md", phase("W1 R0 P2"));
    write(targetRoot, "docs/work/2042-06-02-w1-r1-change/00-index.md", index("W1 R1", ["01-one.md"]));
    write(targetRoot, "docs/work/2042-06-02-w1-r1-change/01-one.md", phase("W1 R1 P1"));
    write(targetRoot, "docs/work/2042-06-03-w1-r2-legacy/00-index.md", "# Legacy body without frontmatter\n");
    write(targetRoot, ".make-docs/archive/work/2042-05-01-w3-r0-old/00-index.md", index("W3 R0", []));

    const snapshot = buildBacklogSnapshot(targetRoot, { now: FIXED_NOW, runGit: NO_GIT });
    expect(snapshot.coordinates.highestWave).toBe(3);
    expect(snapshot.coordinates.waves.map(({ wave, revisions, nextRevision }) => ({ wave, revisions, nextRevision }))).toEqual([
      { wave: 1, revisions: [0, 1, 2], nextRevision: 3 },
      { wave: 3, revisions: [0], nextRevision: 1 },
    ]);
    expect(snapshot.coordinates.waves[1]!.recordPaths).toEqual([".make-docs/archive/work/2042-05-01-w3-r0-old"]);
    expect(record(snapshot, "docs/work/2042-06-01-w1-r0-base").nextPhase.value).toBe(3);
    expect(record(snapshot, "docs/work/2042-06-02-w1-r1-change").nextPhase.value).toBe(2);
    expect(record(snapshot, ".make-docs/archive/work/2042-05-01-w3-r0-old").nextPhase.value).toBe(1);
    expect(record(snapshot, "docs/work/2042-06-03-w1-r2-legacy").nextPhase).toEqual({ value: null, evidence: [] });
  });

  test("report no highest wave for a project without work records", () => {
    const snapshot = buildBacklogSnapshot(root(), { now: FIXED_NOW, runGit: NO_GIT });
    expect(snapshot.coordinates).toEqual({ highestWave: null, waves: [] });
  });

  test("never combine facts into completion or a coordinate choice", () => {
    const targetRoot = root();
    write(targetRoot, `${RECORD}/00-index.md`, index("W1 R0", ["01-one.md"]));
    write(targetRoot, `${RECORD}/01-one.md`, phase("W1 R0 P1", "- Done."));
    const facts = record(buildBacklogSnapshot(targetRoot, { now: FIXED_NOW, runGit: NO_GIT }));
    expect(Object.keys(facts.phases[0]!)).not.toContain("complete");
    expect(Object.keys(facts)).not.toContain("recommendedCoordinate");
    expect(facts.closeout?.closeoutAccepted.value).toBeNull();
  });
});

describe("Change History shape rule", () => {
  function diagnosticsFor(entries: string) {
    const targetRoot = root();
    write(targetRoot, `${RECORD}/00-index.md`, withChangeHistory(entries));
    write(targetRoot, `${RECORD}/01-phase.md`, phase("W1 R0 P1"));
    return changeHistoryDiagnostics(buildBacklogSnapshot(targetRoot, { now: FIXED_NOW, runGit: NO_GIT }));
  }

  test("accepts valid entries and an absent section", () => {
    expect(diagnosticsFor(VALID_ENTRY + "\n" + VALID_ENTRY.replace("2042-06-10 — W1 R0 P1", "2042-06-11 — W1 R0"))).toEqual([]);
    const targetRoot = root();
    write(targetRoot, `${RECORD}/00-index.md`, index("W1 R0", ["01-phase.md"]));
    write(targetRoot, `${RECORD}/01-phase.md`, phase("W1 R0 P1"));
    expect(changeHistoryDiagnostics(buildBacklogSnapshot(targetRoot, { now: FIXED_NOW, runGit: NO_GIT }))).toEqual([]);
  });

  test.each([
    ["a malformed heading", VALID_ENTRY.replace("2042-06-10 — W1 R0 P1", "June 10 — W1 R0"), "heading form"],
    ["an unfilled template heading", VALID_ENTRY.replace("2042-06-10 — W1 R0 P1", "{{DATE}} — {{COORDINATE}}"), "heading form"],
    ["a foreign coordinate", VALID_ENTRY.replace("W1 R0 P1", "W2 R0 P1"), "names W2 R0"],
    ["a missing field", VALID_ENTRY.replace("- Rationale: The task wording was unclear.\n", ""), "missing Rationale"],
    ["an invalid Kind", VALID_ENTRY.replace("`edit`", "`tweak`"), "Kind \"tweak\""],
    ["an invalid PRD decision", VALID_ENTRY.replace("`none` — Wording only.", "`maybe`"), "PRD decision \"maybe\""],
  ])("reports %s once with a location, reason, and fix", (_label, entry, detail) => {
    const found = diagnosticsFor(entry);
    expect(found).toHaveLength(1);
    expect(found[0]).toMatchObject({
      ruleId: "BACKLOG-RULE-017",
      severity: "warning",
      recordPath: RECORD,
      path: `${RECORD}/00-index.md`,
    });
    expect(found[0]!.line).toBeGreaterThan(0);
    expect(found[0]!.message).toContain(detail);
    expect(found[0]!.reason).not.toBe("");
    expect(found[0]!.remediation).toContain("YYYY-MM-DD");
  });

  test("reports entries out of date order", () => {
    const found = diagnosticsFor(VALID_ENTRY.replace("2042-06-10", "2042-06-12") + "\n" + VALID_ENTRY);
    expect(found).toHaveLength(1);
    expect(found[0]!.message).toContain("dated before the entry above it");
  });

  test("points the diagnostic at the entry heading line in the file", () => {
    const found = diagnosticsFor(VALID_ENTRY.replace("`edit`", "`tweak`"));
    const targetRoot = roots.at(-1)!;
    const lines = readIndexLines(targetRoot);
    expect(lines[found[0]!.line! - 1]).toBe("### 2042-06-10 — W1 R0 P1");
  });
});

function readIndexLines(targetRoot: string): string[] {
  return readFileSync(path.join(targetRoot, ...`${RECORD}/00-index.md`.split("/")), "utf8").split("\n");
}

describe("catalog entries for coordinate work", () => {
  test("keep the Change History rule deterministic and coordinate selection agent-only", () => {
    const shape = BACKLOG_RULES.find((rule) => rule.id === "BACKLOG-RULE-017");
    const selection = BACKLOG_RULES.find((rule) => rule.id === "BACKLOG-RULE-018");
    expect(shape).toMatchObject({ diagnosticCode: "BACKLOG-VAL-017", deterministicSupport: "full", defaultSeverity: "warning" });
    expect(shape!.agentInstructionLocation).toBe("make-docs://system/reference/wave-model.md#change-history");
    expect(selection).toMatchObject({ diagnosticCode: "BACKLOG-AGENT-018", deterministicSupport: "agent-only", judgmentRequired: true });
    expect(selection!.oneSidedReason).not.toBeNull();
  });

  test("never emit the agent-only coordinate entry as a snapshot fact", () => {
    const targetRoot = root();
    write(targetRoot, `${RECORD}/00-index.md`, withChangeHistory(VALID_ENTRY.replace("`edit`", "`tweak`")));
    write(targetRoot, `${RECORD}/01-phase.md`, phase("W1 R0 P1"));
    const snapshot = buildBacklogSnapshot(targetRoot, { now: FIXED_NOW, runGit: NO_GIT });
    expect(snapshot.diagnostics.some((entry) => entry.code === "BACKLOG-AGENT-018")).toBe(false);
  });
});
