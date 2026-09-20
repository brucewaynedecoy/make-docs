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

  test("every run projection resolves through its canonical token path", () => {
    for (const operation of listOperations().filter((entry) => entry.cli.root === "run")) {
      const tokens = operation.cli.path.split(" ");
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
    expect(resolveRunOperationPath(["lifecycle", "show", "--run-id", "run-1"])).toEqual({
      id: "lifecycle.show",
      rest: ["--run-id", "run-1"],
    });
    expect(resolveRunOperationPath(["uat", "persona", "resolve", "--persona", "user"])).toEqual({
      id: "uat.persona.resolve",
      rest: ["--persona", "user"],
    });
  });

  test("adapter map and registry identifiers agree exactly in both directions", () => {
    const registryIds = listOperations()
      .filter((operation) => operation.cli.root === "run")
      .map((operation) => operation.id);
    const adapterIds = listRunCliAdapters();
    expect([...adapterIds].sort()).toEqual([...registryIds].sort());
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
    for (const operation of listOperations().filter((entry) => entry.cli.root === "run")) {
      const line = output
        .split("\n")
        .find((candidate) => candidate.trim().startsWith(operation.cli.path));
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
