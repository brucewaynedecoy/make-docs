import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import {
  createPlaybookPackagePlan,
  resolvePackageSurface,
  writePlaybookPackageOutputs,
} from "../src/operations";
import { createExecutionContext, OperationWriteDeniedError } from "../src/operations/context";
import { getOperation, invokeOperation } from "../src/operations/registry";
import { OperationError } from "../src/operations/types";
import { cleanupTempDir, createTempDir, writeMinimalManifest } from "./helpers";

const SUPPORT_EVIDENCE_REF = "docs/prd/33-enhance-playbook-packaging-and-harness-adapter-registry.md";

function writeFile(root: string, relativePath: string, content: string): string {
  const absolutePath = path.join(root, relativePath);
  mkdirSync(path.dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, content, "utf8");
  return absolutePath;
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
    ].join("\n"),
  );
}

function writeMakeDocsManifest(root: string): void {
  writeMinimalManifest(root);
}

const CODEX_PLUGIN_TARGET = {
  harness: "codex",
  outputKind: "plugin",
  surface: "native",
  scope: "project",
} as const;

const CODEX_PLUGIN_PRECONDITIONS = {
  "harness-supported": "satisfied",
  "project-trusted": "satisfied",
  "symlink-or-copy-mirror": "satisfied",
} as const;

describe("package operation registry entries", () => {
  const tempRoots: string[] = [];

  afterEach(() => {
    while (tempRoots.length > 0) {
      cleanupTempDir(tempRoots.pop()!);
    }
  });

  test("registers the three package operations with their mutation classifications", () => {
    expect(getOperation("package.plan").mutates).toBe("read");
    expect(getOperation("package.surface-resolve").mutates).toBe("read");
    expect(getOperation("package.write").mutates).toBe("write");
    for (const id of ["package.plan", "package.surface-resolve", "package.write"]) {
      expect(getOperation(id).status).toBe("active");
    }
  });

  test("invokes package.plan through the registry without write permission", async () => {
    const root = createTempDir("make-docs-registry-package-plan-");
    tempRoots.push(root);
    writePlaybook(root, "user", "run-stack", "Run Stack");

    const invocation = await invokeOperation(
      "package.plan",
      {
        repoRoot: root,
        refs: ["user/run-stack"],
        requestedStack: "run",
        target: CODEX_PLUGIN_TARGET,
        supportEvidenceRefs: [SUPPORT_EVIDENCE_REF],
      },
      createExecutionContext({ surface: "test" }),
    );

    const result = invocation.value as unknown as ReturnType<typeof createPlaybookPackagePlan>;
    expect(invocation.provenance).toEqual({
      operation: "package.plan",
      domain: "package",
      source: "test",
    });
    expect(result.status).toBe("ready");
    expect(result.writesPlanned).toBe(false);
    expect(result.plan.sources[0]).toMatchObject({ ref: "user/run-stack" });
  });

  test("rejects package.plan input that violates the structured schema", async () => {
    await expect(
      invokeOperation(
        "package.plan",
        {
          refs: ["user/run-stack"],
          target: { ...CODEX_PLUGIN_TARGET, outputKind: "not-an-output-kind" },
        },
        createExecutionContext({ surface: "test" }),
      ),
    ).rejects.toThrow(OperationError);
  });

  test("invokes package.surface-resolve as a read operation", async () => {
    const invocation = await invokeOperation(
      "package.surface-resolve",
      {
        target: CODEX_PLUGIN_TARGET,
        packageId: "run-stack",
        preconditions: CODEX_PLUGIN_PRECONDITIONS,
      },
      createExecutionContext({ surface: "test" }),
    );

    const result = invocation.value as unknown as ReturnType<typeof resolvePackageSurface>;
    expect(result.status).toBe("ready");
    expect(result.harnessId).toBe("codex");
    expect(result.path).toContain("run-stack");
  });

  test("refuses package.write when the context does not allow writes", async () => {
    await expect(
      invokeOperation("package.write", {}, createExecutionContext({ surface: "test" })),
    ).rejects.toThrow(OperationWriteDeniedError);
  });

  test("plans without writing when package.write runs with writes allowed but dry-run set", async () => {
    const root = createTempDir("make-docs-registry-package-dry-run-");
    tempRoots.push(root);
    writePlaybook(root, "user", "run-stack", "Run Stack");
    writeMakeDocsManifest(root);
    const plan = createPlaybookPackagePlan({
      repoRoot: root,
      refs: ["user/run-stack"],
      target: CODEX_PLUGIN_TARGET,
      supportEvidenceRefs: [SUPPORT_EVIDENCE_REF],
    }).plan;

    const invocation = await invokeOperation(
      "package.write",
      {
        repoRoot: root,
        plan,
        preconditions: CODEX_PLUGIN_PRECONDITIONS,
      },
      createExecutionContext({ surface: "test", writesAllowed: true, dryRun: true }),
    );

    const result = invocation.value as unknown as ReturnType<typeof writePlaybookPackageOutputs>;
    expect(result.status).toBe("ready");
    expect(result.lines).toContain("Writes executed: no");
    expect(existsSync(path.join(root, ".make-docs/agentics/plugins/run-stack/.codex-plugin/plugin.json"))).toBe(
      false,
    );
  });

  test("writes package outputs when the context grants writes without dry-run", async () => {
    const root = createTempDir("make-docs-registry-package-write-");
    tempRoots.push(root);
    writeMakeDocsManifest(root);
    writePlaybook(root, "user", "run-stack", "Run Stack");
    const plan = createPlaybookPackagePlan({
      repoRoot: root,
      refs: ["user/run-stack"],
      target: CODEX_PLUGIN_TARGET,
      supportEvidenceRefs: [SUPPORT_EVIDENCE_REF],
    }).plan;

    const invocation = await invokeOperation(
      "package.write",
      {
        repoRoot: root,
        plan,
        preconditions: CODEX_PLUGIN_PRECONDITIONS,
      },
      createExecutionContext({ surface: "test", writesAllowed: true }),
    );

    const result = invocation.value as unknown as ReturnType<typeof writePlaybookPackageOutputs>;
    expect(result.status).toBe("written");
    expect(existsSync(path.join(root, ".make-docs/agentics/plugins/run-stack/.codex-plugin/plugin.json"))).toBe(
      true,
    );
  });

  test("rejects a package.write plan payload that fails plan validation", async () => {
    await expect(
      invokeOperation(
        "package.write",
        { plan: { schemaVersion: 1 } },
        createExecutionContext({ surface: "test", writesAllowed: true, dryRun: true }),
      ),
    ).rejects.toThrow(OperationError);
  });
});
