import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import {
  advancePlaybookRun,
  computePlaybookRunNext,
  createPlaybookRunState,
  exportPlaybookRun,
  importPlaybookRun,
  PLAYBOOK_RUN_EXPORT_FORMAT,
  readPlaybookRunState,
} from "../src/operations";
import { createExecutionContext, OperationWriteDeniedError } from "../src/operations/context";
import { invokeOperation, operationCliCommand } from "../src/operations/registry";
import { loadSqliteDriver } from "../src/store";
import { cleanupTempDir, collectFiles, createTempDir, writeMinimalManifest } from "./helpers";

const sqliteAvailable = loadSqliteDriver().available;

/**
 * W18 R7 P4 Stage 2, run portability (PRD 35 R-PORT-1): explicit, opt-in
 * export and import of a run record plus its evidence as one portable
 * artifact, with no path that places run state into the repository by
 * default.
 */

function writeFile(root: string, relativePath: string, content: string): string {
  const absolutePath = path.join(root, relativePath);
  mkdirSync(path.dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, content, "utf8");
  return absolutePath;
}

const FLOW_PLAYBOOK = [
  "---",
  'title: "Flow"',
  'kind: "playbook"',
  'persona: "user"',
  'status: "accepted"',
  'stack: "run"',
  'summary: "Flow summary."',
  'schemaVersion: "make-docs.playbook.v1"',
  'workflowSchemaVersion: "make-docs.workflow.v1"',
  "---",
  "",
  "# Flow",
  "",
  "## Purpose",
  "",
  "Exercise run portability.",
  "",
  "## When To Use",
  "",
  "Use in portability tests.",
  "",
  "## Inputs And Authority",
  "",
  "- User direction first, then repo-local Make Docs contracts.",
  "",
  "## Dependencies",
  "",
  "| ID | Kind | Requirement | Source | Used By | Fallback |",
  "| --- | --- | --- | --- | --- | --- |",
  "| make-docs-cli | cli | required | package install | ship | stop with install guidance |",
  "",
  "## Workflow Contract",
  "",
  "```playbook",
  "workflow:",
  "  id: flow",
  "  state_model: make-docs.workflow-state.v1",
  "  routing: linear",
  "steps:",
  "  - id: ship",
  "    title: Ship the change",
  "    executor: agent",
  "    role: activity",
  "    activation: sequential",
  "    instructions: Ship the change and report.",
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
  "Run the steps in order.",
  "",
  "## Gates And Decisions",
  "",
  "- Stop at gates until a decision is recorded.",
  "",
  "## Outputs And Handoff",
  "",
  "- Record the handoff artifact.",
  "",
  "## Validation",
  "",
  "- Every step reports an outcome.",
  "",
  "## Packaging Notes",
  "",
  "No packaging hints.",
  "",
].join("\n");

describe.skipIf(!sqliteAvailable)("run portability: export and import (W18 R7 P4, R-PORT-1)", () => {
  const tempRoots: string[] = [];

  afterEach(() => {
    for (const root of tempRoots.splice(0)) {
      cleanupTempDir(root);
    }
  });

  function createMachine(projectId?: string): {
    root: string;
    storeRoot: string;
    projectId: string;
  } {
    const root = createTempDir("make-docs-portability-");
    const storeRoot = createTempDir("make-docs-portability-store-");
    tempRoots.push(root, storeRoot);
    const mintedProjectId = writeMinimalManifest(root, projectId);
    writeFile(root, "docs/assets/playbooks/user/flow.playbook.md", FLOW_PLAYBOOK);
    return { root, storeRoot, projectId: mintedProjectId };
  }

  async function startRunWithEvidence(machine: { root: string; storeRoot: string }): Promise<void> {
    createPlaybookRunState({
      repoRoot: machine.root,
      storeRoot: machine.storeRoot,
      ref: "user/flow",
      requestedStack: "run",
      harness: "codex",
      runId: "run-1",
    });
    await advancePlaybookRun({
      repoRoot: machine.root,
      storeRoot: machine.storeRoot,
      runId: "run-1",
      outcome: "completed",
      evidenceRefs: ["ship-log.txt"],
      note: "Shipped the change.",
    });
  }

  test("export serializes the run record and its evidence and never writes a file by default (t6, t7)", async () => {
    const machine = createMachine();
    await startRunWithEvidence(machine);
    const repoFilesBefore = collectFiles(machine.root);

    const result = exportPlaybookRun({
      repoRoot: machine.root,
      storeRoot: machine.storeRoot,
      runId: "run-1",
    });

    expect(result.wroteFile).toBe(false);
    expect(result.outputPath).toBeNull();
    expect(result.artifact.format).toBe(PLAYBOOK_RUN_EXPORT_FORMAT);
    expect(result.artifact.formatVersion).toBe(1);
    expect(result.artifact.runId).toBe("run-1");
    // The full record rides in the artifact, evidence log included.
    const stored = readPlaybookRunState({
      repoRoot: machine.root,
      storeRoot: machine.storeRoot,
      runId: "run-1",
    });
    expect(result.artifact.run).toEqual(stored);
    expect(result.artifact.run.evidenceLog).toEqual([
      expect.objectContaining({ scope: "step", subjectId: "ship", refs: ["ship-log.txt"] }),
    ]);
    // No default output path exists, so no file — and in particular no
    // repository file — was written (R-PORT-1).
    expect(collectFiles(machine.root)).toEqual(repoFilesBefore);
  });

  test("export writes only to the explicit caller-named output path (t6, t7)", async () => {
    const machine = createMachine();
    await startRunWithEvidence(machine);
    const handoffDir = createTempDir("make-docs-portability-handoff-");
    tempRoots.push(handoffDir);
    const repoFilesBefore = collectFiles(machine.root);

    const outputPath = path.join(handoffDir, "run-1.export.json");
    const result = exportPlaybookRun({
      repoRoot: machine.root,
      storeRoot: machine.storeRoot,
      runId: "run-1",
      outputPath,
    });

    expect(result.wroteFile).toBe(true);
    expect(result.outputPath).toBe(outputPath);
    const parsed = JSON.parse(readFileSync(outputPath, "utf8")) as Record<string, unknown>;
    expect(parsed.format).toBe(PLAYBOOK_RUN_EXPORT_FORMAT);
    expect(collectFiles(machine.root)).toEqual(repoFilesBefore);
  });

  test("import rehydrates the run on another machine sharing the project identity and the run resumes there (t6, t7)", async () => {
    const source = createMachine();
    await startRunWithEvidence(source);
    const { artifact } = exportPlaybookRun({
      repoRoot: source.root,
      storeRoot: source.storeRoot,
      runId: "run-1",
    });

    // Machine B: a clone of the same repository — the manifest travels with
    // the repo, so the same project identity resolves (R-STORE-2).
    const target = createMachine(source.projectId);
    const targetFilesBefore = collectFiles(target.root);

    const imported = importPlaybookRun({
      repoRoot: target.root,
      storeRoot: target.storeRoot,
      artifact,
    });

    expect(imported.projectId).toBe(source.projectId);
    expect(imported.adopted).toBe(false);
    expect(imported.overwrote).toBe(false);
    const state = readPlaybookRunState({
      repoRoot: target.root,
      storeRoot: target.storeRoot,
      runId: "run-1",
    });
    // The rehydrated run carries the source evidence plus its own import
    // provenance record.
    expect(state.evidenceLog).toEqual([
      expect.objectContaining({ scope: "step", subjectId: "ship" }),
      expect.objectContaining({
        scope: "import",
        subjectId: "run-1",
        note: expect.stringContaining("R-PORT-1"),
      }),
    ]);
    // The run is live on the target machine: the engine computes its next
    // position from the imported state.
    const next = computePlaybookRunNext({
      repoRoot: target.root,
      storeRoot: target.storeRoot,
      runId: "run-1",
    });
    expect(next.cursor).toEqual({ kind: "step", id: "record" });
    // Import wrote only to the global store, never into the repository.
    expect(collectFiles(target.root)).toEqual(targetFilesBefore);
  });

  test("import refuses an existing run id without the explicit overwrite opt-in (t6)", async () => {
    const machine = createMachine();
    await startRunWithEvidence(machine);
    const { artifact } = exportPlaybookRun({
      repoRoot: machine.root,
      storeRoot: machine.storeRoot,
      runId: "run-1",
    });

    expect(() =>
      importPlaybookRun({
        repoRoot: machine.root,
        storeRoot: machine.storeRoot,
        artifact,
      }),
    ).toThrow(/refuses to replace it without the explicit `overwrite` opt-in/);

    const replaced = importPlaybookRun({
      repoRoot: machine.root,
      storeRoot: machine.storeRoot,
      artifact,
      overwrite: true,
    });
    expect(replaced.overwrote).toBe(true);
  });

  test("import refuses a cross-project artifact unless the re-key is explicitly adopted (t6)", async () => {
    const source = createMachine();
    await startRunWithEvidence(source);
    const { artifact } = exportPlaybookRun({
      repoRoot: source.root,
      storeRoot: source.storeRoot,
      runId: "run-1",
    });
    // A different project identity, not a clone.
    const target = createMachine();

    expect(() =>
      importPlaybookRun({
        repoRoot: target.root,
        storeRoot: target.storeRoot,
        artifact,
      }),
    ).toThrow(/exported from project[\s\S]*adoptProject/);

    const adopted = importPlaybookRun({
      repoRoot: target.root,
      storeRoot: target.storeRoot,
      artifact,
      adoptProject: true,
    });
    expect(adopted.adopted).toBe(true);
    expect(adopted.state.projectId).toBe(target.projectId);
    expect(adopted.sourceProjectId).toBe(source.projectId);
    expect(adopted.state.evidenceLog.at(-1)?.note).toContain("re-keyed to project");
  });

  test("import validates the artifact fail-closed (t6)", () => {
    const machine = createMachine();
    expect(() =>
      importPlaybookRun({
        repoRoot: machine.root,
        storeRoot: machine.storeRoot,
        artifact: { format: "something-else" },
      }),
    ).toThrow(/artifact format must be/);
    expect(() =>
      importPlaybookRun({
        repoRoot: machine.root,
        storeRoot: machine.storeRoot,
        artifact: { format: PLAYBOOK_RUN_EXPORT_FORMAT, formatVersion: 99 },
      }),
    ).toThrow(/format version `99` is not supported/);
  });

  test("both portability operations are registered, opt-in, and write-gated by the operation core (t6)", async () => {
    // The documented CLI command forms derive from the registry identifiers.
    expect(operationCliCommand("playbook.run.export")).toBe("make-docs run playbook run export");
    expect(operationCliCommand("playbook.run.import")).toBe("make-docs run playbook run import");

    const readOnly = createExecutionContext({ surface: "test", writesAllowed: false });
    await expect(
      invokeOperation("playbook.run.export", { runId: "run-1" }, readOnly),
    ).rejects.toBeInstanceOf(OperationWriteDeniedError);
    await expect(
      invokeOperation("playbook.run.import", { artifact: {} }, readOnly),
    ).rejects.toBeInstanceOf(OperationWriteDeniedError);

    const machine = createMachine();
    await startRunWithEvidence(machine);
    const writer = createExecutionContext({ surface: "test", writesAllowed: true });
    const exported = await invokeOperation(
      "playbook.run.export",
      { repoRoot: machine.root, storeRoot: machine.storeRoot, runId: "run-1" },
      writer,
    );
    expect(exported.value).toEqual(
      expect.objectContaining({
        wroteFile: false,
        artifact: expect.objectContaining({ format: PLAYBOOK_RUN_EXPORT_FORMAT }),
      }),
    );
  });

  test("no store artifact of any tier lands in the repository during a full export/import round trip (t7)", async () => {
    const machine = createMachine();
    const repoFilesBefore = collectFiles(machine.root);
    await startRunWithEvidence(machine);
    const { artifact } = exportPlaybookRun({
      repoRoot: machine.root,
      storeRoot: machine.storeRoot,
      runId: "run-1",
    });
    importPlaybookRun({
      repoRoot: machine.root,
      storeRoot: machine.storeRoot,
      artifact,
      overwrite: true,
    });
    expect(collectFiles(machine.root)).toEqual(repoFilesBefore);
    expect(existsSync(path.join(machine.root, ".make-docs", "runs"))).toBe(false);
  });
});
