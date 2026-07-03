import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, test, vi } from "vitest";
import { listOperations } from "../src/operations/registry";
import { OperationError } from "../src/operations/types";
import {
  listRunCliAdapters,
  resolveRunOperationPath,
  runRunCommand,
} from "../src/run/cli";
import { loadSqliteDriver } from "../src/store";
import { cleanupTempDir, createTempDir, writeMinimalManifest } from "./helpers";

const WAVE_SLUG = "2026-07-02-w18-r11-run-cli";
const sqliteAvailable = loadSqliteDriver().available;

function writeFile(root: string, relativePath: string, content: string): string {
  const absolutePath = path.join(root, relativePath);
  mkdirSync(path.dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, content, "utf8");
  return absolutePath;
}

function createWaveFixture(): { root: string; waveDir: string; projectId: string } {
  const root = createTempDir("make-docs-run-cli-");
  const projectId = writeMinimalManifest(root);
  const waveDir = path.join(root, "docs/work", WAVE_SLUG);
  writeFile(
    root,
    `docs/work/${WAVE_SLUG}/01-alpha.md`,
    [
      "# Phase 01: Alpha",
      "",
      "## Tasks",
      "",
      "- [ ] t1: Finish the first task.",
      "",
    ].join("\n"),
  );
  return { root, waveDir, projectId };
}

/** A conformant W18 R6 playbook with a step, a gate, and a follow-on step. */
function progressionPlaybook(): string {
  return [
    "---",
    'title: "Ship"',
    'kind: "playbook"',
    'persona: "user"',
    'status: "accepted"',
    'stack: "run"',
    'summary: "Ship summary."',
    'schemaVersion: "make-docs.playbook.v1"',
    'workflowSchemaVersion: "make-docs.workflow.v1"',
    "---",
    "",
    "# Ship",
    "",
    "## Purpose",
    "",
    "Ship the documented workflow.",
    "",
    "## When To Use",
    "",
    "Use when the workflow goal is active.",
    "",
    "## Inputs And Authority",
    "",
    "- User direction first, then repo-local Make Docs contracts.",
    "",
    "## Dependencies",
    "",
    "| ID | Kind | Requirement | Source | Used By | Fallback |",
    "| --- | --- | --- | --- | --- | --- |",
    "| make-docs-cli | cli | required | package install | check | stop with install guidance |",
    "",
    "## Workflow Contract",
    "",
    "```playbook",
    "workflow:",
    "  id: ship",
    "  state_model: make-docs.workflow-state.v1",
    "  routing: linear",
    "steps:",
    "  - id: check",
    "    title: Check the playbook catalog",
    "    executor: cli",
    "    role: check",
    "    activation: sequential",
    "    mode: deterministic",
    "    requires: [make-docs-cli]",
    "    operation: playbook.catalog",
    "  - id: review",
    "    title: Review the catalog output",
    "    executor: human",
    "    role: gate",
    "    activation: sequential",
    "    mode: delegated",
    "    instructions: Review the catalog output and approve or reject.",
    "    gate:",
    "      resolved_by: user",
    "      evidence: review note",
    "      unattended: false",
    "  - id: record",
    "    title: Record the handoff",
    "    executor: agent",
    "    role: activity",
    "    activation: sequential",
    "    instructions: Record the handoff artifact.",
    "```",
    "",
    "## Step Guidance",
    "",
    "Run the steps in order and report the results.",
    "",
    "## Gates And Decisions",
    "",
    "- Stop at the review gate until the user decides.",
    "",
    "## Outputs And Handoff",
    "",
    "- Record the handoff artifact.",
    "",
    "## Validation",
    "",
    "- The catalog check exits zero.",
    "",
    "## Packaging Notes",
    "",
    "No packaging hints.",
    "",
  ].join("\n");
}

function captureStdout() {
  const spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
  return {
    spy,
    output: () => spy.mock.calls.map(([chunk]) => String(chunk)).join(""),
  };
}

describe("make-docs run command (W18 R11, R-REG-2, R-TOP-3)", () => {
  const tempRoots: string[] = [];

  afterEach(() => {
    vi.restoreAllMocks();
    for (const root of tempRoots.splice(0)) {
      cleanupTempDir(root);
    }
  });

  test("every registry identifier resolves through its derived token path", () => {
    for (const operation of listOperations()) {
      const tokens = operation.id.split(".");
      const resolved = resolveRunOperationPath([...tokens, "--repo-root", "."]);
      expect(resolved.id, operation.id).toBe(operation.id);
      expect(resolved.rest, operation.id).toEqual(["--repo-root", "."]);
    }
  });

  test("longest-match resolution leaves trailing positionals for the adapter", () => {
    expect(resolveRunOperationPath(["work", "item", "resolve", "W18 R11 P1"])).toEqual({
      id: "work.item.resolve",
      rest: ["W18 R11 P1"],
    });
    expect(resolveRunOperationPath(["playbook", "resolve", "user/run-stack"])).toEqual({
      id: "playbook.resolve",
      rest: ["user/run-stack"],
    });
    expect(resolveRunOperationPath(["package", "surface-resolve", "--harness", "codex"])).toEqual({
      id: "package.surface-resolve",
      rest: ["--harness", "codex"],
    });
  });

  test("adapter map and registry identifiers agree exactly in both directions", () => {
    const registryIds = listOperations().map((operation) => operation.id);
    const adapterIds = listRunCliAdapters();
    expect([...adapterIds].sort()).toEqual([...registryIds].sort());
  });

  test("invokes a cheap read operation end-to-end (playbook.catalog)", async () => {
    const root = createTempDir("make-docs-run-cli-catalog-");
    tempRoots.push(root);
    const stdout = captureStdout();

    await runRunCommand(["playbook", "catalog", "--repo-root", root]);

    const parsed = JSON.parse(stdout.output()) as { repoRoot: string; entries: unknown[] };
    expect(parsed.repoRoot).toBe(root);
    expect(Array.isArray(parsed.entries)).toBe(true);
  });

  test("invokes work.item.resolve end-to-end against a wave fixture", async () => {
    const fixture = createWaveFixture();
    tempRoots.push(fixture.root);
    const stdout = captureStdout();

    await runRunCommand(["work", "item", "resolve", "W18 R11 P1", "--repo-root", fixture.root]);

    expect(JSON.parse(stdout.output())).toEqual(
      expect.objectContaining({
        mode: "phase",
        waveSlug: WAVE_SLUG,
        phasePath: `docs/work/${WAVE_SLUG}/01-alpha.md`,
        coordinate: { w: 18, r: 11, p: 1 },
      }),
    );
  });

  test("derived help lists every identifier, marks writes, and names pending lineages", async () => {
    const stdout = captureStdout();

    await runRunCommand([]);

    const output = stdout.output();
    for (const operation of listOperations()) {
      const line = output
        .split("\n")
        .find((candidate) => candidate.trim().startsWith(operation.id.split(".").join(" ")));
      expect(line, operation.id).toBeDefined();
      if (operation.mutates === "write") {
        expect(line, operation.id).toContain("[write]");
      }
      if (operation.status === "pending") {
        expect(line, operation.id).toContain("[pending:");
        expect(line, operation.id).toContain(operation.pendingLineage!);
      } else {
        expect(line, operation.id).not.toContain("[pending:");
      }
    }
  });

  test("unknown operation paths error cleanly and list valid operations", async () => {
    await expect(runRunCommand(["playbook", "fly"])).rejects.toBeInstanceOf(OperationError);
    await expect(runRunCommand(["playbook", "fly"])).rejects.toThrow(
      /Unknown make-docs run operation: `playbook fly`/,
    );
    // The valid-operations listing is derived from the registry.
    await expect(runRunCommand(["playbook", "fly"])).rejects.toThrow(/work evidence record/);
  });

  test("progression adapters name their required flags (playbook.advance, playbook.close)", async () => {
    await expect(runRunCommand(["playbook", "advance"])).rejects.toThrow(
      /`playbook advance` requires --run-id/,
    );
    // --outcome is optional as of W18 R7 P3: without it the step's execution
    // mode decides what advance does (R-MODE-1), so the adapter passes the
    // call through to the engine, which then fails on the missing run
    // identity rather than on a missing flag.
    const bareRoot = createTempDir("make-docs-run-cli-advance-");
    tempRoots.push(bareRoot);
    await expect(
      runRunCommand(["playbook", "advance", "--run-id", "run-1", "--repo-root", bareRoot]),
    ).rejects.toThrow(/Cannot use the global store/);
    await expect(
      runRunCommand(["playbook", "close", "--run-id", "run-1"]),
    ).rejects.toThrow(/`playbook close` requires --terminal-status/);
  });

  test.skipIf(!sqliteAvailable)(
    "the progression operations round-trip under `run playbook` (t10)",
    async () => {
      const root = createTempDir("make-docs-run-cli-playbook-");
      tempRoots.push(root);
      writeMinimalManifest(root);
      const storeRoot = path.join(createTempDir("make-docs-run-cli-playbook-store-"), "store");
      tempRoots.push(path.dirname(storeRoot));
      writeFile(root, "docs/assets/playbooks/user/ship.playbook.md", progressionPlaybook());

      const invoke = async (argv: string[]): Promise<Record<string, unknown>> => {
        const stdout = captureStdout();
        await runRunCommand([
          ...argv,
          "--repo-root",
          root,
          "--store-root",
          storeRoot,
          "--run-id",
          "cli-run",
        ]);
        const output = stdout.output();
        stdout.spy.mockRestore();
        return JSON.parse(output) as Record<string, unknown>;
      };

      const started = await invoke(["playbook", "start", "user/ship", "--harness", "codex"]);
      expect((started.state as Record<string, unknown>).cursor).toEqual({
        kind: "step",
        id: "check",
      });

      const next = await invoke(["playbook", "next"]);
      expect(next.position).toBe("step");
      expect((next.next as Record<string, unknown>).stepId).toBe("check");

      const advanced = await invoke([
        "playbook",
        "advance",
        "--outcome",
        "completed",
        "--evidence-ref",
        "docs/prd/35-revise-run-playbook-state-machine.md",
      ]);
      expect((advanced.execution as Record<string, unknown>).action).toBe("recorded");
      expect((advanced.state as Record<string, unknown>).cursor).toEqual({
        kind: "gate",
        id: "review",
      });

      const gated = await invoke(["playbook", "gate", "--decision", "approve"]);
      expect(gated.cursor).toEqual({ kind: "step", id: "record" });

      const resumed = await invoke(["playbook", "resume", "--resume-hint", "picked back up"]);
      expect(resumed.status).toBe("running");

      const closed = await invoke(["playbook", "close", "--terminal-status", "cancelled"]);
      expect(closed.terminalStatus).toBe("cancelled");
      expect((await invoke(["playbook", "status"])).terminalStatus).toBe("cancelled");
    },
  );

  test.skipIf(!sqliteAvailable)(
    "work evidence record/read round-trips through the run command",
    async () => {
      const fixture = createWaveFixture();
      tempRoots.push(fixture.root);
      const storeRoot = path.join(createTempDir("make-docs-run-cli-store-"), "store");
      tempRoots.push(path.dirname(storeRoot));
      const phaseRelative = `docs/work/${WAVE_SLUG}/01-alpha.md`;
      const payloadPath = writeFile(
        fixture.root,
        "payload.json",
        JSON.stringify({ status: "waived", by: "coordinator" }),
      );

      const recordStdout = captureStdout();
      await runRunCommand([
        "work",
        "evidence",
        "record",
        "W18 R11 P1",
        "--repo-root",
        fixture.root,
        "--store-root",
        storeRoot,
        "--kind",
        "review",
        "--payload-json",
        payloadPath,
      ]);
      const ack = JSON.parse(recordStdout.output()) as Record<string, unknown>;
      expect(ack.projectId).toBe(fixture.projectId);
      expect(ack.evidenceKind).toBe("review");
      recordStdout.spy.mockRestore();

      // Inline JSON payloads are accepted as well as payload files.
      const inlineStdout = captureStdout();
      await runRunCommand([
        "work",
        "evidence",
        "record",
        "W18 R11 P1",
        "--repo-root",
        fixture.root,
        "--store-root",
        storeRoot,
        "--kind",
        "validation",
        "--payload-json",
        '{"status":"passed"}',
      ]);
      expect((JSON.parse(inlineStdout.output()) as Record<string, unknown>).evidenceKind).toBe(
        "validation",
      );
      inlineStdout.spy.mockRestore();

      const readStdout = captureStdout();
      await runRunCommand([
        "work",
        "evidence",
        "read",
        "W18 R11 P1",
        "--repo-root",
        fixture.root,
        "--store-root",
        storeRoot,
      ]);
      const read = JSON.parse(readStdout.output()) as Record<string, unknown>;
      expect(read.projectId).toBe(fixture.projectId);
      expect(read.identity).toEqual({
        repoRoot: fixture.root,
        waveSlug: WAVE_SLUG,
        phasePath: phaseRelative,
      });
      expect(read.evidence).toHaveLength(2);
      expect(read.evidence).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            evidenceKind: "review",
            payload: { status: "waived", by: "coordinator" },
          }),
          expect.objectContaining({
            evidenceKind: "validation",
            payload: { status: "passed" },
          }),
        ]),
      );
    },
  );

  test("rejects an unparseable evidence payload with the flag contract named", async () => {
    const fixture = createWaveFixture();
    tempRoots.push(fixture.root);

    await expect(
      runRunCommand([
        "work",
        "evidence",
        "record",
        "W18 R11 P1",
        "--repo-root",
        fixture.root,
        "--kind",
        "review",
        "--payload-json",
        "not json",
      ]),
    ).rejects.toThrow(/`--payload-json` must be a path to a JSON file or inline JSON/);
  });
});
