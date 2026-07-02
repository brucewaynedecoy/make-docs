import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import {
  createExecutionContext,
  OperationWriteDeniedError,
} from "../src/operations/context";
import { invokeOperation } from "../src/operations/registry";
import { OperationError } from "../src/operations/types";
import { resolveWaveTarget, resolveWorkItemIdentity } from "../src/operations/work";
import { loadSqliteDriver } from "../src/store";
import { cleanupTempDir, createTempDir, writeMinimalManifest } from "./helpers";

const WAVE_SLUG = "2026-07-02-w18-r11-registry-work-ops";
const sqliteAvailable = loadSqliteDriver().available;

function writeFile(root: string, relativePath: string, content: string): string {
  const absolutePath = path.join(root, relativePath);
  mkdirSync(path.dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, content, "utf8");
  return absolutePath;
}

/** Phase 01 stays incomplete so a wave-only resolve has a phase it COULD select. */
function createWaveFixture(): {
  root: string;
  phaseOne: string;
  phaseTwo: string;
  waveDir: string;
  projectId: string;
} {
  const root = createTempDir("make-docs-registry-work-ops-");
  const projectId = writeMinimalManifest(root);
  const waveDir = path.join(root, "docs/work", WAVE_SLUG);
  const phaseOne = writeFile(
    root,
    `docs/work/${WAVE_SLUG}/01-alpha.md`,
    [
      "# Phase 01: Alpha",
      "",
      "## Tasks",
      "",
      "- [x] t1: Finish the first task.",
      "- [ ] t2: Finish the second task.",
      "",
    ].join("\n"),
  );
  const phaseTwo = writeFile(
    root,
    `docs/work/${WAVE_SLUG}/02-beta.md`,
    [
      "# Phase 02: Beta",
      "",
      "## Tasks",
      "",
      "- [x] t1: Complete beta.",
      "",
    ].join("\n"),
  );
  return { root, phaseOne, phaseTwo, waveDir, projectId };
}

/** Rewrites the on-disk manifest to the pre-identifier shape (no projectId). */
function stripProjectId(root: string): void {
  const manifestPath = path.join(root, ".make-docs", "manifest.json");
  const raw = JSON.parse(readFileSync(manifestPath, "utf8")) as Record<string, unknown>;
  delete raw.projectId;
  writeFileSync(manifestPath, `${JSON.stringify(raw, null, 2)}\n`, "utf8");
}

describe("registry work operations (W18 R11, R-RUN-1)", () => {
  const tempRoots: string[] = [];

  afterEach(() => {
    for (const root of tempRoots.splice(0)) {
      cleanupTempDir(root);
    }
  });

  test("work.item.resolve resolves an explicit phase coordinate to a phase-level canonical identity", async () => {
    const fixture = createWaveFixture();
    tempRoots.push(fixture.root);
    const context = createExecutionContext({ cwd: fixture.root });

    const invocation = await invokeOperation(
      "work.item.resolve",
      { target: "W18 R11 P2" },
      context,
    );

    expect(invocation.provenance).toEqual({
      operation: "work.item.resolve",
      domain: "work",
      source: "test",
    });
    expect(invocation.value).toEqual({
      mode: "phase",
      repoRoot: fixture.root,
      waveDir: fixture.waveDir,
      waveSlug: WAVE_SLUG,
      phasePath: `docs/work/${WAVE_SLUG}/02-beta.md`,
      coordinate: { w: 18, r: 11, p: 2 },
    });
  });

  test("work.item.resolve returns phasePath null for a wave-only target without selecting the next incomplete phase", async () => {
    const fixture = createWaveFixture();
    tempRoots.push(fixture.root);
    const context = createExecutionContext({ cwd: fixture.root });

    // The pruned resolver's judgment WOULD pick incomplete phase 01 here.
    expect(resolveWaveTarget(fixture.waveDir).phasePath).toBe(fixture.phaseOne);

    const byCoordinate = await invokeOperation(
      "work.item.resolve",
      { target: "W18 R11", repoRoot: fixture.root },
      context,
    );
    expect(byCoordinate.value).toEqual(
      expect.objectContaining({
        mode: "wave",
        waveSlug: WAVE_SLUG,
        phasePath: null,
        coordinate: { w: 18, r: 11, p: null },
      }),
    );

    // Same identity contract when the target is the wave directory path.
    const byPath = resolveWorkItemIdentity(fixture.waveDir, fixture.root);
    expect(byPath.mode).toBe("wave");
    expect(byPath.phasePath).toBeNull();
  });

  test("work.evidence.record is refused uniformly without write permission", async () => {
    const fixture = createWaveFixture();
    tempRoots.push(fixture.root);
    const context = createExecutionContext({ cwd: fixture.root, writesAllowed: false });

    await expect(
      invokeOperation(
        "work.evidence.record",
        { target: "W18 R11 P1", evidenceKind: "review", payload: { status: "waived" } },
        context,
      ),
    ).rejects.toBeInstanceOf(OperationWriteDeniedError);
  });

  test.skipIf(!sqliteAvailable)(
    "records and reads work-execution evidence round-trip against an isolated store",
    async () => {
      const fixture = createWaveFixture();
      tempRoots.push(fixture.root);
      const storeRoot = path.join(createTempDir("make-docs-registry-work-ops-store-"), "store");
      tempRoots.push(path.dirname(storeRoot));
      const writeContext = createExecutionContext({ cwd: fixture.root, writesAllowed: true });
      const readContext = createExecutionContext({ cwd: fixture.root, writesAllowed: false });
      const phaseRelative = `docs/work/${WAVE_SLUG}/01-alpha.md`;

      const record = await invokeOperation(
        "work.evidence.record",
        {
          target: "W18 R11 P1",
          storeRoot,
          evidenceKind: "review",
          payload: { status: "waived", by: "coordinator" },
        },
        writeContext,
      );
      const ack = record.value as Record<string, unknown>;
      expect(ack.projectId).toBe(fixture.projectId);
      expect(ack.identity).toEqual({
        repoRoot: fixture.root,
        waveSlug: WAVE_SLUG,
        phasePath: phaseRelative,
      });
      expect(ack.evidenceKind).toBe("review");
      expect(typeof ack.recordedAt).toBe("string");

      // Phase-level read returns the rows keyed to the canonical identity.
      const phaseRead = await invokeOperation(
        "work.evidence.read",
        { target: fixture.phaseOne, storeRoot },
        readContext,
      );
      const phaseValue = phaseRead.value as Record<string, unknown>;
      expect(phaseValue.projectId).toBe(fixture.projectId);
      expect(phaseValue.identity).toEqual({
        repoRoot: fixture.root,
        waveSlug: WAVE_SLUG,
        phasePath: phaseRelative,
      });
      expect(phaseValue.evidence).toEqual([
        expect.objectContaining({
          projectId: fixture.projectId,
          waveSlug: WAVE_SLUG,
          phasePath: phaseRelative,
          evidenceKind: "review",
          payload: { status: "waived", by: "coordinator" },
        }),
      ]);

      // A wave-only target returns every row recorded for the wave instead.
      const waveRead = await invokeOperation(
        "work.evidence.read",
        { target: "W18 R11", repoRoot: fixture.root, storeRoot },
        readContext,
      );
      const waveValue = waveRead.value as Record<string, unknown>;
      expect(waveValue.projectId).toBe(fixture.projectId);
      expect(waveValue.waveSlug).toBe(WAVE_SLUG);
      expect(waveValue.identity).toBeUndefined();
      expect(waveValue.evidence).toEqual([
        expect.objectContaining({ evidenceKind: "review", phasePath: phaseRelative }),
      ]);
    },
  );

  test("work.evidence.record refuses a wave-only identity rather than guessing a phase", async () => {
    const fixture = createWaveFixture();
    tempRoots.push(fixture.root);
    const context = createExecutionContext({ cwd: fixture.root, writesAllowed: true });

    await expect(
      invokeOperation(
        "work.evidence.record",
        { target: "W18 R11", evidenceKind: "review", payload: { status: "waived" } },
        context,
      ),
    ).rejects.toThrow(/phase-level identity/);
  });

  test("work.evidence.record errors cleanly when the project identity is unminted", async () => {
    const fixture = createWaveFixture();
    tempRoots.push(fixture.root);
    stripProjectId(fixture.root);
    const context = createExecutionContext({ cwd: fixture.root, writesAllowed: true });

    const attempt = invokeOperation(
      "work.evidence.record",
      { target: "W18 R11 P1", evidenceKind: "review", payload: { status: "waived" } },
      context,
    );
    await expect(attempt).rejects.toBeInstanceOf(OperationError);
    await expect(
      invokeOperation(
        "work.evidence.record",
        { target: "W18 R11 P1", evidenceKind: "review", payload: { status: "waived" } },
        context,
      ),
    ).rejects.toThrow(/run `make-docs` once to mint it/);
  });
});
