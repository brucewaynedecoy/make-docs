import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import {
  createExecutionContext,
  OperationWriteDeniedError,
} from "../src/operations/context";
import { getOperation, invokeOperation, listOperations } from "../src/operations/registry";
import { OperationError } from "../src/operations/types";
import { cleanupTempDir, createTempDir } from "./helpers";

function writeFile(root: string, relativePath: string, content: string): string {
  const absolutePath = path.join(root, relativePath);
  mkdirSync(path.dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, content, "utf8");
  return absolutePath;
}

function playbookBody(title: string): string {
  return [
    `# ${title}`,
    "",
    "## Purpose",
    "",
    "Use this playbook when the matching workflow goal is active.",
    "",
    "## Inputs and Authority",
    "",
    "- User request.",
    "- Repo-local Make Docs contracts.",
    "",
    "## Procedure",
    "",
    "1. Resolve the playbook.",
    "2. Follow the documented steps in order.",
    "",
    "## Gates and Decisions",
    "",
    "- Stop when user review is required.",
    "",
    "## Assists",
    "",
    "- CLI, MCP, plugin, subagent, or skill assists are optional unless the playbook says otherwise.",
    "",
    "## Outputs and Handoff",
    "",
    "- Record the expected output or handoff artifact.",
    "",
    "## Validation",
    "",
    "- Confirm the workflow completed or report why it stopped.",
    "",
  ].join("\n");
}

function writePlaybook(root: string, persona: string, slug: string, title: string): string {
  return writeFile(
    root,
    `docs/assets/playbooks/${persona}/${slug}.md`,
    [
      "---",
      `title: ${title}`,
      "kind: playbook",
      "status: accepted",
      `persona: ${persona}`,
      "stack: run",
      `summary: ${title} summary.`,
      "---",
      "",
      playbookBody(title),
    ].join("\n"),
  );
}

const PLAYBOOK_OPERATION_IDS = [
  "playbook.validate",
  "playbook.catalog",
  "playbook.resolve",
  "playbook.capabilities",
  "playbook.start",
  "playbook.invoke",
  "playbook.status",
  "playbook.next",
  "playbook.advance",
  "playbook.gate",
  "playbook.resume",
  "playbook.close",
  // W18 R7 P4 run portability (R-PORT-1): opt-in export and import.
  "playbook.run.export",
  "playbook.run.import",
] as const;

const WRITE_IDS = [
  "playbook.start",
  "playbook.invoke",
  "playbook.advance",
  "playbook.gate",
  "playbook.resume",
  "playbook.close",
  // Export can write the artifact file to a caller-named path; import writes
  // the rehydrated record into the global store.
  "playbook.run.export",
  "playbook.run.import",
] as const;

describe("playbook operation registry entries", () => {
  const tempRoots: string[] = [];

  afterEach(() => {
    for (const root of tempRoots.splice(0)) {
      cleanupTempDir(root);
    }
  });

  test("registers the fourteen playbook identifiers with mutation and status classifications", () => {
    const playbookIds = listOperations()
      .filter((operation) => operation.domain === "playbook")
      .map((operation) => operation.id)
      .sort();
    expect(playbookIds).toEqual([...PLAYBOOK_OPERATION_IDS].sort());

    // The W18 R7 P2 progression operations are active with the exact
    // read-versus-mutate classification of PRD 35 R-OP-1/R-OP-3; no playbook
    // identifier remains pending.
    for (const id of PLAYBOOK_OPERATION_IDS) {
      const definition = getOperation(id);
      const expectedMutates = (WRITE_IDS as readonly string[]).includes(id) ? "write" : "read";
      expect(definition.mutates, id).toBe(expectedMutates);
      expect(definition.status, id).toBe("active");
      expect(definition.pendingLineage, id).toBeUndefined();
    }
  });

  test("playbook.catalog is invocable through the core seam with test provenance (R-TEST-2)", async () => {
    const root = createTempDir("make-docs-registry-playbook-");
    tempRoots.push(root);
    writePlaybook(root, "user", "use-system", "Use System");

    const result = await invokeOperation(
      "playbook.catalog",
      { repoRoot: root },
      createExecutionContext({ surface: "test" }),
    );

    expect(result.operation).toBe("playbook.catalog");
    expect(result.provenance).toEqual({
      operation: "playbook.catalog",
      domain: "playbook",
      source: "test",
    });
    const catalog = result.value as {
      playbooksDir: string;
      entries: Array<{ ref: string; persona: string | null; slug: string }>;
    };
    expect(catalog.playbooksDir).toBe("docs/assets/playbooks");
    expect(catalog.entries.map((entry) => entry.ref)).toEqual(["user/use-system"]);
  });

  test("playbook.catalog resolves a relative repoRoot against the context cwd", async () => {
    const root = createTempDir("make-docs-registry-playbook-");
    tempRoots.push(root);
    writePlaybook(root, "user", "use-system", "Use System");

    const result = await invokeOperation(
      "playbook.catalog",
      {},
      createExecutionContext({ surface: "test", cwd: root }),
    );

    const catalog = result.value as { entries: Array<{ ref: string }> };
    expect(catalog.entries.map((entry) => entry.ref)).toEqual(["user/use-system"]);
  });

  test("playbook.start is refused uniformly without write permission", async () => {
    const context = createExecutionContext({ surface: "test", writesAllowed: false });
    await expect(
      invokeOperation("playbook.start", { ref: "user/use-system", harness: "claude-code" }, context),
    ).rejects.toBeInstanceOf(OperationWriteDeniedError);
  });

  test("every mutating progression operation honors the uniform write gating (R-OP-1)", async () => {
    // t9: advance/gate/resume/close ride the same operation-core safety
    // gating as every other write; the refusal happens before any handler runs.
    const context = createExecutionContext({ surface: "test", writesAllowed: false });
    for (const id of ["playbook.advance", "playbook.gate", "playbook.resume", "playbook.close"]) {
      await expect(
        invokeOperation(id, { runId: "run-1", outcome: "completed" }, context),
        id,
      ).rejects.toBeInstanceOf(OperationWriteDeniedError);
    }
  });

  test("progression read operations validate typed input through the core seam", async () => {
    const context = createExecutionContext({ surface: "test" });
    await expect(invokeOperation("playbook.next", {}, context)).rejects.toThrow(
      /Invalid input for operation `playbook\.next`/,
    );
    const writeContext = createExecutionContext({ surface: "test", writesAllowed: true });
    await expect(
      invokeOperation("playbook.advance", { runId: "run-1", outcome: "waived" }, writeContext),
    ).rejects.toThrow(/Invalid input for operation `playbook\.advance`/);
    await expect(
      invokeOperation("playbook.close", { runId: "run-1", terminalStatus: "running" }, writeContext),
    ).rejects.toThrow(/Invalid input for operation `playbook\.close`/);
  });

  test("typed input validation rejects malformed input before the handler runs", async () => {
    const context = createExecutionContext({ surface: "test" });
    const attempt = invokeOperation("playbook.status", { repoRoot: 42 }, context);
    await expect(attempt).rejects.toBeInstanceOf(OperationError);
    await expect(
      invokeOperation("playbook.status", { repoRoot: 42 }, context),
    ).rejects.toThrow(/Invalid input for operation `playbook\.status`/);
  });
});
