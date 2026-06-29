import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, test, vi } from "vitest";
import { runCli } from "../src/cli";
import {
  buildCloseoutProbe,
  parseWorkPhase,
} from "../src/operations";
import { createMakeDocsMcpServer } from "../src/mcp/server";
import {
  MAKE_DOCS_MCP_TOOLS,
  callMakeDocsMcpTool,
} from "../src/mcp/tools";
import { cleanupTempDir, createTempDir } from "./helpers";

function writeFile(root: string, relativePath: string, content: string): string {
  const absolutePath = path.join(root, relativePath);
  mkdirSync(path.dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, content, "utf8");
  return absolutePath;
}

describe("make-docs MCP runtime", () => {
  const tempRoots: string[] = [];

  afterEach(() => {
    vi.restoreAllMocks();
    for (const root of tempRoots.splice(0)) {
      cleanupTempDir(root);
    }
  });

  test("declares a shipped read-first MCP tool surface", () => {
    expect(createMakeDocsMcpServer()).toBeDefined();
    expect(MAKE_DOCS_MCP_TOOLS.map((tool) => tool.name)).toEqual([
      "make_docs_operation_domains",
      "make_docs_installed_state",
      "make_docs_manifest_read",
      "make_docs_config_read",
      "make_docs_compatibility_classify",
      "make_docs_install_plan",
      "make_docs_closeout_probe",
      "make_docs_closeout_validate",
      "make_docs_work_phase_state",
      "make_docs_wave_resolve",
      "make_docs_wave_status",
      "make_docs_phase_plan",
      "make_docs_scope_guard",
      "make_docs_phase_gate",
      "make_docs_playbook_catalog",
      "make_docs_playbook_resolve",
      "make_docs_playbook_capabilities",
      "make_docs_playbook_run_start",
      "make_docs_playbook_run_invoke",
      "make_docs_playbook_run_read",
    ]);
  });

  test("exposes make-docs mcp help from the package CLI", async () => {
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    await runCli(["mcp", "--help"]);

    const output = writeSpy.mock.calls.map(([chunk]) => String(chunk)).join("");
    expect(output).toContain("make-docs mcp");
    expect(output).toContain("TypeScript-owned make-docs MCP server");
    expect(output).toContain("same TypeScript operation domains");
  });

  test("plans install changes without writing files", async () => {
    const root = createTempDir("make-docs-mcp-plan-");
    tempRoots.push(root);

    const payload = await callMakeDocsMcpTool("make_docs_install_plan", {
      targetDir: root,
    });
    const result = payload.result as {
      actions: Array<{ relativePath: string }>;
      actionCounts: { create: number; generate: number };
      writesFiles: boolean;
    };

    expect(result.writesFiles).toBe(false);
    expect(result.actionCounts.create + result.actionCounts.generate).toBeGreaterThan(0);
    expect(result.actions.map((action) => action.relativePath)).toContain("AGENTS.md");
  });

  test("delegates work and closeout MCP tools to operation-domain functions", async () => {
    const root = createTempDir("make-docs-mcp-domains-");
    tempRoots.push(root);
    execFileSync("git", ["init"], { cwd: root, stdio: "ignore" });
    const phasePath = writeFile(
      root,
      "docs/work/2026-06-26-w10-r8-example/01-domain.md",
      [
        "# Phase 01: Domain",
        "",
        "## Tasks",
        "",
        "- [x] t1: Define folders.",
        "- [ ] t2: Add direct tests.",
        "",
      ].join("\n"),
    );
    writeFile(root, "package.json", JSON.stringify({ name: "make-docs" }));

    const workPayload = await callMakeDocsMcpTool("make_docs_work_phase_state", {
      phasePath,
    });
    const closeoutPayload = await callMakeDocsMcpTool("make_docs_closeout_probe", {
      repoRoot: root,
      scope: "full",
    });

    expect(workPayload.result).toEqual(parseWorkPhase(phasePath));
    expect(closeoutPayload.result).toEqual(
      buildCloseoutProbe({ repoRoot: root, scope: "full" }),
    );
  });

  test("delegates playbook MCP tools to operation-domain functions", async () => {
    const root = createTempDir("make-docs-mcp-playbooks-");
    tempRoots.push(root);
    writeFile(
      root,
      ".make-docs/config.yaml",
      [
        "harnessCapabilities:",
        "  - harness: codex",
        "    reviewStatus: reviewed",
        "    capabilities:",
        "      goal_managed_execution: true",
        "",
      ].join("\n"),
    );
    writeFile(
      root,
      "docs/assets/playbooks/user/use-system.md",
      [
        "---",
        "title: Use System",
        "kind: playbook",
        "status: accepted",
        "persona: user",
        "stack: run",
        "summary: Use the installed system.",
        "---",
        "",
        "# Use System",
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

    const catalog = await callMakeDocsMcpTool("make_docs_playbook_catalog", {
      repoRoot: root,
    });
    const resolution = await callMakeDocsMcpTool("make_docs_playbook_resolve", {
      repoRoot: root,
      ref: "user/use-system",
      stack: "run",
    });
    const capabilities = await callMakeDocsMcpTool("make_docs_playbook_capabilities", {
      repoRoot: root,
      harness: "codex",
      requiredCapabilities: ["goal_managed_execution"],
    });

    expect(catalog.result).toEqual(
      expect.objectContaining({
        entries: [
          expect.objectContaining({ ref: "user/use-system", stack: "run" }),
        ],
      }),
    );
    expect(resolution.result).toEqual(
      expect.objectContaining({
        mode: "qualified-ref",
        entry: expect.objectContaining({ ref: "user/use-system" }),
      }),
    );
    expect(capabilities.result).toEqual(
      expect.objectContaining({
        status: "ready",
        satisfiedRequired: ["goal_managed_execution"],
      }),
    );
  });

  test("requires explicit approval before writing playbook run state through MCP", async () => {
    await expect(
      callMakeDocsMcpTool("make_docs_playbook_run_start", {
        repoRoot: ".",
        ref: "user/use-system",
        harness: "codex",
      }),
    ).rejects.toThrow("allowWrite=true");
  });

  test("requires explicit approval before invoking playbook runs through MCP", async () => {
    await expect(
      callMakeDocsMcpTool("make_docs_playbook_run_invoke", {
        repoRoot: ".",
        ref: "user/use-system",
        harness: "codex",
      }),
    ).rejects.toThrow("allowWrite=true");
  });

  test("requires explicit approval before running closeout validation commands", async () => {
    await expect(
      callMakeDocsMcpTool("make_docs_closeout_validate", {
        repoRoot: ".",
        probeJson: JSON.stringify({ validationHints: ["git diff --check"] }),
        run: true,
      }),
    ).rejects.toThrow("allowRun=true");
  });
});
