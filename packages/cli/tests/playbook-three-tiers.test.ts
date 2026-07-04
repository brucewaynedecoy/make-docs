import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import {
  advancePlaybookRun,
  closePlaybookRun,
  createPlaybookRunState,
  readPlaybookRunState,
} from "../src/operations";
import { operationCliCommand } from "../src/operations/registry";
import { parsePlaybook } from "../src/playbook";
import { loadSqliteDriver } from "../src/store";
import { cleanupTempDir, collectFiles, createTempDir, writeMinimalManifest } from "./helpers";

const sqliteAvailable = loadSqliteDriver().available;

/**
 * W18 R7 P4 Stage 2, three-tier degradation (PRD 35 R-TIER-1): the SAME
 * Playbook source behaves as structured hand-followable documentation with
 * no engine (tier one), as agent-readable structure plus the registry's
 * documented command forms with no tracking (tier two), and as a fully
 * engine-tracked run recording state in the global store (tier three).
 */

const TIER_PLAYBOOK = [
  "---",
  'title: "Tiered"',
  'kind: "playbook"',
  'persona: "user"',
  'status: "accepted"',
  'stack: "run"',
  'summary: "Tier verification playbook."',
  'schema: "make-docs.playbook.v2"',
  'workflowSchema: "make-docs.workflow.v1"',
  "---",
  "",
  "# Tiered",
  "",
  "## Purpose",
  "",
  "Prove the three-tier degradation guarantee against one source.",
  "",
  "## When To Use",
  "",
  "Use in tier verification tests.",
  "",
  "## Inputs",
  "",
  "- User direction first, then repo-local Make Docs contracts.",
  "",
  "## Dependencies",
  "",
  "```playbook",
  "dependencies:",
  "  - id: make-docs-cli",
  "    kind: cli",
  "    requirement: optional",
  "    source: package install",
  "    used_by: [ship]",
  "    fallback: run the documented command by hand",
  "```",
  "",
  "## Workflow",
  "",
  "```playbook",
  "workflow:",
  "  id: tiered",
  "  state_model: make-docs.workflow-state.v1",
  "  routing: linear",
  "steps:",
  "  - id: ship",
  "    title: Ship the change",
  "    executor: agent",
  "    role: activity",
  "    activation: sequential",
  "    instructions: Ship the change and report the outcome.",
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
  "Run the steps in order and report each outcome.",
  "",
  "## Gates",
  "",
  "- Stop at gates until a decision is recorded.",
  "",
  "## Outputs",
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

const PLAYBOOK_RELATIVE_PATH = "docs/assets/playbooks/user/tiered.playbook.md";

describe("three-tier degradation guarantee (W18 R7 P4, R-TIER-1)", () => {
  const tempRoots: string[] = [];

  afterEach(() => {
    for (const root of tempRoots.splice(0)) {
      cleanupTempDir(root);
    }
  });

  function writePlaybookFixture(root: string): string {
    const absolutePath = path.join(root, PLAYBOOK_RELATIVE_PATH);
    mkdirSync(path.dirname(absolutePath), { recursive: true });
    writeFileSync(absolutePath, TIER_PLAYBOOK, "utf8");
    return absolutePath;
  }

  test("tier one: with neither Make Docs nor the CLI the Playbook is hand-followable structured documentation and no engine runs (t8)", () => {
    // A bare directory: no manifest, no store, no Make Docs resources. The
    // reader has only the file. Every step is followable from the raw text
    // alone — ordered ids, titles, and prose instructions — and nothing in
    // this tier creates state anywhere.
    const root = createTempDir("make-docs-tier1-");
    tempRoots.push(root);
    writePlaybookFixture(root);
    const before = collectFiles(root);

    const source = TIER_PLAYBOOK;
    expect(source).toContain("## Step Guidance");
    expect(source).toContain("## Workflow");
    const shipIndex = source.indexOf("id: ship");
    const recordIndex = source.indexOf("id: record");
    expect(shipIndex).toBeGreaterThan(-1);
    expect(recordIndex).toBeGreaterThan(shipIndex);
    expect(source).toContain("instructions: Ship the change and report the outcome.");
    expect(source).toContain("instructions: Record the handoff artifact.");
    expect(source).toContain("run the documented command by hand");

    // No engine required, no engine ran: the repository is byte-identical
    // and no state landed anywhere in it.
    expect(collectFiles(root)).toEqual(before);
    expect(existsSync(path.join(root, ".make-docs"))).toBe(false);
  });

  test("tier two: with Make Docs resources but no CLI an agent reads the same structure and the registry's documented command forms without tracking (t9)", () => {
    // Make Docs resources present: the parsed model and the operation
    // registry's documented human command forms. No CLI execution, no run
    // state, no store writes — the agent executes without tracking.
    const root = createTempDir("make-docs-tier2-");
    tempRoots.push(root);
    const absolutePath = writePlaybookFixture(root);
    const before = collectFiles(root);

    const { model } = parsePlaybook({ source: TIER_PLAYBOOK, sourcePath: absolutePath });
    expect(model.runnable).toBe(true);
    expect(model.workflow).not.toBeNull();
    const steps = model.workflow?.steps ?? [];
    expect(steps.map((step) => step.id?.value)).toEqual(["ship", "record"]);
    for (const step of steps) {
      expect(step.title?.value).toBeTruthy();
      expect(typeof step.raw.instructions).toBe("string");
      // The delegated default keeps tier two human/agent-followable.
      expect(step.mode.value ?? "delegated").toBe("delegated");
    }

    // The registry documents the command forms the agent would run by hand;
    // the derivation is the identifier mapping, never a hardcoded string.
    for (const id of [
      "playbook.start",
      "playbook.next",
      "playbook.advance",
      "playbook.gate",
      "playbook.resume",
      "playbook.close",
    ]) {
      expect(operationCliCommand(id)).toBe(`make-docs run ${id.split(".").join(" ")}`);
    }

    // Reading and deriving tracked nothing: no repo writes, no store.
    expect(collectFiles(root)).toEqual(before);
    expect(existsSync(path.join(root, ".make-docs"))).toBe(false);
  });

  test.skipIf(!sqliteAvailable)(
    "tier three: with the CLI present the full engine runs the same source and records state in the global store (t10)",
    async () => {
      const root = createTempDir("make-docs-tier3-");
      const storeRoot = createTempDir("make-docs-tier3-store-");
      tempRoots.push(root, storeRoot);
      writeMinimalManifest(root);
      writePlaybookFixture(root);
      const before = collectFiles(root);

      createPlaybookRunState({
        repoRoot: root,
        storeRoot,
        ref: "user/tiered",
        requestedStack: "run",
        harness: "codex",
        runId: "tier3-run",
      });
      await advancePlaybookRun({
        repoRoot: root,
        storeRoot,
        runId: "tier3-run",
        outcome: "completed",
        evidenceRefs: ["ship-log.txt"],
      });
      await advancePlaybookRun({
        repoRoot: root,
        storeRoot,
        runId: "tier3-run",
        outcome: "completed",
        evidenceRefs: ["handoff.md"],
      });
      closePlaybookRun({
        repoRoot: root,
        storeRoot,
        runId: "tier3-run",
        terminalStatus: "completed",
      });

      const state = readPlaybookRunState({ repoRoot: root, storeRoot, runId: "tier3-run" });
      expect(state.terminalStatus).toBe("completed");
      expect(state.stepStatuses).toEqual([
        { stepId: "ship", status: "completed" },
        { stepId: "record", status: "completed" },
      ]);
      expect(state.evidenceLog.length).toBeGreaterThanOrEqual(3);

      // Full tracking lives in the global store; the repository stays
      // byte-identical with no run state written into it.
      expect(collectFiles(root)).toEqual(before);
      expect(existsSync(path.join(root, ".make-docs", "runs"))).toBe(false);
      expect(existsSync(path.join(storeRoot, "store.db"))).toBe(true);
    },
  );
});
