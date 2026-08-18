import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, test, vi } from "vitest";
import { runCli } from "../src/cli";
import {
  listDerivedMcpOperationTools,
  MAKE_DOCS_MCP_TOOLS,
  verifyDerivedMcpToolParity,
} from "../src/mcp/tools";
import { createExecutionContext } from "../src/operations/context";
import { hasOperation, invokeOperation, listOperations } from "../src/operations/registry";
import { OperationError } from "../src/operations/types";
import { listRunCliAdapters, runRunCommand } from "../src/run/cli";
import { runToolUninstallCommand, runToolUpdateCommand } from "../src/self";
import { bootstrapGlobalStore, getStoreDatabasePath } from "../src/store";
import { createCompatibilityFixture } from "./compatibility-fixtures";
import { cleanupTempDir, createTempDir, setTTY, writeMinimalManifest } from "./helpers";

/**
 * W18 R11 P6 — consolidated D10 verification suite (PRD 39 R-TEST-1 through
 * R-TEST-4, plus the R-SEQ-1 same-wave closure recorded against R-024).
 *
 * This file is the contract pin for the four R-TEST families. Each family is
 * asserted explicitly here even where deeper behavior is covered elsewhere;
 * cross-references:
 *
 * - R-TEST-1 derivation details: tests/mcp-derivation.test.ts (derived MCP
 *   spellings, rename cutover) and tests/run-cli.test.ts (derived run tree).
 * - R-TEST-2 import-graph property: tests/operation-dependency-direction.test.ts
 *   pins the full one-way dependency graph (core never imports a surface).
 * - R-TEST-3 registry composition: tests/registry-contract.test.ts pins the
 *   exact append-only identifier set and the lifecycle-domain exclusion.
 * - R-TEST-4 self-management matrix: tests/self-management.test.ts covers the
 *   install-manager detection matrix and interactive choice flows;
 *   tests/cli.test.ts covers the setup-side pre-v2 flow variants and the full
 *   removed-spelling guidance matrix.
 */

const SRC_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "src");

const LIFECYCLE_COMMANDS = ["setup", "mcp", "update", "uninstall"] as const;

/** Pruned per the W18 R11 migrated-operations inventory disposition. */
const PRUNED_OPERATIONS = [
  "wave-resolve",
  "wave-status",
  "work-phase-state",
  "phase-plan",
  "phase-gate",
  "scope-guard",
  "closeout-probe",
  "closeout-validate",
  "closeout-history",
] as const;

/**
 * R-SEQ-1 closure record: the removed top-level spellings and their
 * replacement guidance. cli.test.ts covers the full flag/argument matrix;
 * this list is the closure pin that no removed spelling parses anywhere.
 */
const REMOVED_TOP_LEVEL_SPELLINGS: ReadonlyArray<[string, string]> = [
  ["init", "make-docs setup"],
  ["reconfigure", "make-docs setup reconfigure"],
  ["skills", "make-docs setup skills"],
  ["backup", "make-docs setup backup"],
  ["operations", "make-docs run <domain> <verb>"],
];

const WAVE_SLUG = "2026-07-02-w18-r11-verification";

const NPM_GLOBAL_ARGV1 = "/usr/local/lib/node_modules/@brucewaynedecoy/make-docs/dist/cli.js";
const NPX_ARGV1 =
  "/Users/tester/.npm/_npx/1a2b3c4d/node_modules/@brucewaynedecoy/make-docs/dist/cli.js";
const FAKE_EXEC_PATH = "/usr/local/bin/node";
const identityRealpath = (candidate: string) => candidate;

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
      "",
      "## Procedure",
      "",
      "1. Resolve the playbook.",
      "",
      "## Gates and Decisions",
      "",
      "- Stop when user review is required.",
      "",
      "## Assists",
      "",
      "- Assists are optional unless the playbook says otherwise.",
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

function createWaveFixture(): { root: string; projectId: string } {
  const root = createTempDir("make-docs-reorg-wave-");
  const projectId = writeMinimalManifest(root);
  writeFile(
    root,
    `docs/work/${WAVE_SLUG}/01-alpha.md`,
    ["# Phase 01: Alpha", "", "## Tasks", "", "- [ ] t1: Finish the first task.", ""].join("\n"),
  );
  return { root, projectId };
}

function captureStdout() {
  const spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
  return {
    spy,
    output: () => spy.mock.calls.map(([chunk]) => String(chunk)).join(""),
  };
}

function createOutputCollector(): { lines: string[]; output: { write(text: string): void } } {
  const lines: string[] = [];
  return { lines, output: { write: (text) => lines.push(text) } };
}

/** Set-difference helper the parity assertions run through (R-TEST-1). */
function diffIdentifierSets(
  left: readonly string[],
  right: readonly string[],
): { onlyInLeft: string[]; onlyInRight: string[] } {
  const leftSet = new Set(left);
  const rightSet = new Set(right);
  return {
    onlyInLeft: [...leftSet].filter((id) => !rightSet.has(id)).sort(),
    onlyInRight: [...rightSet].filter((id) => !leftSet.has(id)).sort(),
  };
}

describe("R-TEST-1: CLI run tree and MCP tool list are registry-derived with full parity", () => {
  test("registry, run adapters, and derived MCP tools describe the same identifier set in all directions", () => {
    const registryOperations = listOperations();
    const registryIds = registryOperations.map((operation) => operation.id);
    const runRegistryIds = registryOperations
      .filter((operation) => operation.cli.command.startsWith("make-docs run "))
      .map((operation) => operation.id);
    const nonRunRegistryIds = registryOperations
      .filter((operation) => !operation.cli.command.startsWith("make-docs run "))
      .map((operation) => operation.id)
      .sort();
    const runIds = listRunCliAdapters();
    const mcpIds = listDerivedMcpOperationTools().map((tool) => tool.operation);

    expect(registryIds.length).toBeGreaterThan(0);
    expect(nonRunRegistryIds).toEqual([
      "project.surface.ensure",
      "resource.ensure",
      "resource.list",
      "resource.read",
    ]);
    // The run adapter covers only registry entries whose canonical CLI root
    // is `run`. Resource and project entries use their own canonical roots.
    expect(diffIdentifierSets(runRegistryIds, runIds)).toEqual({
      onlyInLeft: [],
      onlyInRight: [],
    });
    // MCP still covers the full registry in both directions.
    expect(diffIdentifierSets(registryIds, mcpIds)).toEqual({ onlyInLeft: [], onlyInRight: [] });
    expect(diffIdentifierSets(runIds, mcpIds)).toEqual({
      onlyInLeft: [],
      onlyInRight: nonRunRegistryIds,
    });

    // The MCP conformance helper agrees against the live registry.
    expect(verifyDerivedMcpToolParity()).toEqual({
      missingOperations: [],
      unknownOperations: [],
      misderivedNames: [],
      duplicateNames: [],
    });
  });

  test("an injected one-surface-only mismatch is reported in both directions (failing mode)", () => {
    const runRegistryIds = listOperations()
      .filter((operation) => operation.cli.command.startsWith("make-docs run "))
      .map((operation) => operation.id);

    // CLI side: the same comparison the parity assertion performs must
    // report an identifier filtered out of a copy of the adapter list...
    const runIdsMissingOne = listRunCliAdapters().filter((id) => id !== "playbook.catalog");
    expect(diffIdentifierSets(runRegistryIds, runIdsMissingOne).onlyInLeft).toContain(
      "playbook.catalog",
    );
    // ...and an identifier present on the surface but absent from the registry.
    const runIdsWithExtra = [...listRunCliAdapters(), "bogus.operation"];
    expect(diffIdentifierSets(runRegistryIds, runIdsWithExtra).onlyInRight).toContain(
      "bogus.operation",
    );

    // MCP side: the shipped conformance helper reports the same failure
    // modes (deeper derivation coverage lives in tests/mcp-derivation.test.ts).
    const derived = listDerivedMcpOperationTools();
    const filtered = derived.filter((tool) => tool.operation !== "playbook.catalog");
    expect(verifyDerivedMcpToolParity(filtered).missingOperations).toContain("playbook.catalog");
    const withUnknown = [
      ...derived,
      { name: "make_docs_bogus_operation", operation: "bogus.operation" },
    ];
    expect(verifyDerivedMcpToolParity(withUnknown).unknownOperations).toContain("bogus.operation");
  });
});

describe("R-TEST-2: operations execute through the core with no CLI parser or MCP transport", () => {
  // These tests invoke operations exclusively through `invokeOperation` +
  // `createExecutionContext({ surface: "test" })` — nothing from src/run or
  // src/mcp participates in the operation path. The import-graph guarantee
  // (core never imports a surface) is pinned structurally by
  // tests/operation-dependency-direction.test.ts and re-checked below.
  const tempRoots: string[] = [];

  afterEach(() => {
    vi.restoreAllMocks();
    for (const root of tempRoots.splice(0)) {
      cleanupTempDir(root);
    }
  });

  test("playbook.catalog executes via the core seam and returns structured output with test provenance", async () => {
    const root = createTempDir("make-docs-reorg-catalog-");
    tempRoots.push(root);
    mkdirSync(path.join(root, "docs/work"), { recursive: true });
    writePlaybook(root, "user", "run-stack", "Run Stack");

    const invocation = await invokeOperation(
      "playbook.catalog",
      { repoRoot: root },
      createExecutionContext({ surface: "test" }),
    );

    const value = invocation.value as { repoRoot: string; entries: Array<{ ref: string }> };
    expect(value.repoRoot).toBe(root);
    expect(value.entries.map((entry) => entry.ref)).toContain("user/run-stack");
    expect(invocation.provenance).toEqual({
      operation: "playbook.catalog",
      domain: "playbook",
      source: "test",
    });
  });

  test("work.item.resolve executes via the core seam against a wave fixture", async () => {
    const fixture = createWaveFixture();
    tempRoots.push(fixture.root);

    const invocation = await invokeOperation(
      "work.item.resolve",
      { target: "W18 R11 P1", repoRoot: fixture.root },
      createExecutionContext({ surface: "test" }),
    );

    expect(invocation.value).toEqual(
      expect.objectContaining({
        mode: "phase",
        waveSlug: WAVE_SLUG,
        phasePath: `docs/work/${WAVE_SLUG}/01-alpha.md`,
        coordinate: { w: 18, r: 11, p: 1 },
      }),
    );
    expect(invocation.provenance.source).toBe("test");
  });

  test("the operation core's transitive import graph reaches no surface module", () => {
    // Structural double-check of the dependency direction for exactly the
    // modules this suite exercised: everything reachable from the registry
    // dispatch stays outside src/run/**, src/mcp/**, and the composition
    // root. tests/operation-dependency-direction.test.ts pins the full graph.
    const importRe = /(?:^|\n)\s*(?:import|export)\s[^;]*?from\s+["']([^"']+)["']/g;
    const resolveImport = (fromFile: string, specifier: string): string | null => {
      if (!specifier.startsWith(".")) {
        return null;
      }
      const base = path.resolve(path.dirname(fromFile), specifier);
      for (const candidate of [base, `${base}.ts`, path.join(base, "index.ts")]) {
        if (existsSync(candidate) && statSync(candidate).isFile()) {
          return candidate;
        }
      }
      return null;
    };

    const entryPoints = [
      path.join(SRC_ROOT, "operations", "registry.ts"),
      path.join(SRC_ROOT, "operations", "context.ts"),
    ];
    const visited = new Set<string>();
    const queue = [...entryPoints];
    while (queue.length > 0) {
      const file = queue.pop()!;
      if (visited.has(file)) {
        continue;
      }
      visited.add(file);
      const text = readFileSync(file, "utf8");
      for (const match of text.matchAll(importRe)) {
        const resolved = resolveImport(file, match[1]!);
        if (resolved && !visited.has(resolved)) {
          queue.push(resolved);
        }
      }
    }

    const forbiddenPrefixes = [
      path.join(SRC_ROOT, "run") + path.sep,
      path.join(SRC_ROOT, "mcp") + path.sep,
    ];
    const forbiddenFiles = new Set([
      path.join(SRC_ROOT, "cli.ts"),
      path.join(SRC_ROOT, "index.ts"),
    ]);
    const violations = [...visited].filter(
      (file) =>
        forbiddenFiles.has(file) || forbiddenPrefixes.some((prefix) => file.startsWith(prefix)),
    );
    expect(violations).toEqual([]);
  });
});

describe("R-TEST-3: run exposes no tool lifecycle operation and Playbook steps cannot reach it", () => {
  test.each([...LIFECYCLE_COMMANDS])(
    "`%s` is not an operation on any registry surface",
    async (lifecycle) => {
      // Not a registry identifier and not a registry domain.
      expect(hasOperation(lifecycle)).toBe(false);
      const domains = new Set(listOperations().map((operation) => operation.domain));
      expect(domains.has(lifecycle)).toBe(false);

      // Not reachable through the derived `run` tree.
      await expect(runRunCommand([lifecycle])).rejects.toBeInstanceOf(OperationError);
      await expect(runRunCommand([lifecycle])).rejects.toThrow(
        /Unknown make-docs run operation/,
      );
      await expect(runRunCommand([lifecycle, "anything"])).rejects.toThrow(
        /Unknown make-docs run operation/,
      );

      // Not reachable through the core dispatch under any verb spelling.
      await expect(
        invokeOperation(
          `${lifecycle}.anything`,
          {},
          createExecutionContext({ surface: "test", writesAllowed: true }),
        ),
      ).rejects.toThrow(/Unknown operation identifier/);
    },
  );

  test("a Playbook `operation:` step cannot invoke tool lifecycle", async () => {
    // A Playbook `operation:` step resolves through the same registry
    // dispatch as every other surface (surface "playbook-step"), so an
    // identifier that does not resolve there is unreachable from a Playbook.
    // The playbook validator has no registry-resolution seam today (it
    // enforces only that a deterministic step declares an `operation` or
    // `command` form — see src/playbook/validator/workflow.ts), which means
    // this dispatch rejection IS the enforcement point.
    const context = createExecutionContext({ surface: "playbook-step", writesAllowed: true });
    for (const lifecycle of LIFECYCLE_COMMANDS) {
      await expect(invokeOperation(lifecycle, {}, context)).rejects.toThrow(
        /Unknown operation identifier/,
      );
      await expect(invokeOperation(`${lifecycle}.apply`, {}, context)).rejects.toThrow(
        /Unknown operation identifier/,
      );
    }
  });
});

describe("R-TEST-4: pre-v2 migration safety, uninstall confirmation, and pruned operations", () => {
  const tempRoots: string[] = [];

  afterEach(() => {
    vi.restoreAllMocks();
    setTTY(true);
    for (const root of tempRoots.splice(0)) {
      cleanupTempDir(root);
    }
  });

  test("`update` triggers the pre-v2 warning-and-choice flow against a v1 fixture", async () => {
    const storeRoot = createTempDir("make-docs-reorg-store-");
    tempRoots.push(storeRoot);
    const fixture = await createCompatibilityFixture({
      id: "clean-v1",
      state: "clean-v1",
      disposition: "migrate",
    });
    tempRoots.push(fixture.targetDir);
    setTTY(false);
    const exec = vi.fn(async () => ({ exitCode: 0 }));
    const { lines, output } = createOutputCollector();

    const result = await runToolUpdateCommand({
      yes: false,
      targetDir: fixture.targetDir,
      storeRoot,
      argv1: NPM_GLOBAL_ARGV1,
      execPath: FAKE_EXEC_PATH,
      realpath: identityRealpath,
      exec,
      output,
    });

    expect(result.status).toBe("cancelled-pre-v2");
    expect(result.preV2.preV2).toBe(true);
    expect(result.preV2Choice).toBe("cancel");
    expect(exec).not.toHaveBeenCalled();
    const rendered = lines.join("\n");
    expect(rendered).toContain("A pre-v2 make-docs install was detected");
    expect(rendered).toContain("will not silently upgrade");
    // The pre-v2 install is left exactly as found.
    expect(JSON.parse(readFileSync(fixture.manifestPath, "utf8")).schemaVersion).toBe(1);
  });

  test("`setup` triggers the pre-v2 warning-and-choice flow against a v1 fixture", async () => {
    const fixture = await createCompatibilityFixture({
      id: "clean-v1",
      state: "clean-v1",
      disposition: "migrate",
    });
    tempRoots.push(fixture.targetDir);
    setTTY(false);
    const stdout = captureStdout();

    await runCli(["setup", "--yes", "--target", fixture.targetDir]);

    const output = stdout.output();
    stdout.spy.mockRestore();
    expect(output).toContain("A pre-v2 make-docs install was detected");
    expect(output).toContain("`make-docs setup` will not silently upgrade");
    expect(output).toContain("Setup cancelled. The existing pre-v2 install was left untouched.");
    expect(JSON.parse(readFileSync(fixture.manifestPath, "utf8")).schemaVersion).toBe(1);
  });

  test("`setup reconfigure` triggers the pre-v2 warning-and-choice flow against a v1 fixture", async () => {
    const fixture = await createCompatibilityFixture({
      id: "clean-v1",
      state: "clean-v1",
      disposition: "migrate",
    });
    tempRoots.push(fixture.targetDir);
    setTTY(false);
    const stdout = captureStdout();

    await runCli(["setup", "reconfigure", "--yes", "--target", fixture.targetDir]);

    const output = stdout.output();
    stdout.spy.mockRestore();
    expect(output).toContain("A pre-v2 make-docs install was detected");
    expect(output).toContain("`make-docs setup reconfigure` will not silently upgrade");
    expect(output).toContain("Setup cancelled. The existing pre-v2 install was left untouched.");
    expect(JSON.parse(readFileSync(fixture.manifestPath, "utf8")).schemaVersion).toBe(1);
  });

  test("`uninstall` requires confirmation: non-TTY without --yes removes nothing", async () => {
    const storeRoot = createTempDir("make-docs-reorg-uninstall-store-");
    tempRoots.push(storeRoot);
    bootstrapGlobalStore({ storeRoot });
    setTTY(false);
    const exec = vi.fn(async () => ({ exitCode: 0 }));
    const { lines, output } = createOutputCollector();

    const result = await runToolUninstallCommand({
      yes: false,
      storeRoot,
      argv1: NPM_GLOBAL_ARGV1,
      execPath: FAKE_EXEC_PATH,
      realpath: identityRealpath,
      exec,
      output,
    });

    expect(result.status).toBe("refused-non-interactive");
    expect(result.storeRemoval).toBeNull();
    expect(existsSync(getStoreDatabasePath(storeRoot))).toBe(true);
    expect(exec).not.toHaveBeenCalled();
    expect(lines.join("\n")).toContain("make-docs uninstall --yes");
  });

  test("`uninstall --yes` removes the store only; sibling repository content stays byte-untouched", async () => {
    const parentDir = createTempDir("make-docs-reorg-uninstall-safety-");
    tempRoots.push(parentDir);
    const storeRoot = path.join(parentDir, "store");
    bootstrapGlobalStore({ storeRoot });
    const repoDir = path.join(parentDir, "repo");
    const repoFiles: Record<string, string> = {
      "docs/AGENTS.md": "# repo content\n",
      "docs/work/2026-07-01-w1-r0-example/01-phase.md": "# Phase\n",
      "README.md": "# repo readme\n",
      ".make-docs/manifest.json": '{ "schemaVersion": 2 }\n',
    };
    for (const [relativePath, content] of Object.entries(repoFiles)) {
      writeFile(repoDir, relativePath, content);
    }
    const exec = vi.fn(async () => ({ exitCode: 0 }));

    const result = await runToolUninstallCommand({
      yes: true,
      storeRoot,
      argv1: NPX_ARGV1,
      execPath: FAKE_EXEC_PATH,
      realpath: identityRealpath,
      exec,
      output: createOutputCollector().output,
    });

    expect(result.status).toBe("completed");
    expect(result.storeRemoval?.status).toBe("removed");
    expect(existsSync(storeRoot)).toBe(false);
    // Every repository byte survives, including the project-level
    // `.make-docs/` directory — uninstall is machine-footprint only.
    for (const [relativePath, content] of Object.entries(repoFiles)) {
      expect(readFileSync(path.join(repoDir, relativePath), "utf8"), relativePath).toBe(content);
    }
    expect(exec).not.toHaveBeenCalled();
  });

  test("lifecycle.checkpoint remains a typed pending P6 operation", async () => {
    expect(
      listOperations().find((operation) => operation.id === "lifecycle.checkpoint"),
    ).toMatchObject({
      status: "pending",
      pendingLineage: "W19 R1 P6",
      cli: { command: "make-docs run lifecycle checkpoint" },
    });
    expect(hasOperation("lifecycle.checkpoint")).toBe(true);
    expect(
      MAKE_DOCS_MCP_TOOLS.some((tool) => tool.name === "make_docs_lifecycle_checkpoint"),
    ).toBe(true);
    await expect(runRunCommand(["lifecycle", "checkpoint"])).rejects.toMatchObject({
      code: "operation-pending",
      operation: "lifecycle.checkpoint",
      pendingLineage: "W19 R1 P6",
      handlerAvailable: false,
    });
  });

  test.each([...PRUNED_OPERATIONS])(
    "pruned operation `%s` is absent from the run surface, the registry, and the MCP tool list",
    async (pruned) => {
      // Registry: no identifier carries the pruned segment.
      for (const operation of listOperations()) {
        expect(operation.id.includes(pruned), operation.id).toBe(false);
      }

      // MCP: no tool name carries the pruned segment in derived spelling.
      const underscored = pruned.replace(/-/g, "_");
      for (const tool of MAKE_DOCS_MCP_TOOLS) {
        expect(tool.name.includes(underscored), tool.name).toBe(false);
      }

      // run surface: neither the hyphenated token nor its split-token
      // spelling resolves to an operation path.
      await expect(runRunCommand([pruned])).rejects.toThrow(/Unknown make-docs run operation/);
      const tokens = pruned.split("-");
      if (tokens.length > 1) {
        await expect(runRunCommand(tokens)).rejects.toThrow(/Unknown make-docs run operation/);
      }
    },
  );
});

describe("R-SEQ-1 closure: zero non-registry operations, zero accepted legacy spellings (R-024)", () => {
  test("every surface entry is registry-backed; no hand-wired surface entry remains", () => {
    const registryIds = new Set(listOperations().map((operation) => operation.id));
    for (const id of listRunCliAdapters()) {
      expect(registryIds.has(id), `run adapter ${id}`).toBe(true);
    }
    for (const tool of listDerivedMcpOperationTools()) {
      expect(registryIds.has(tool.operation), `MCP tool ${tool.name}`).toBe(true);
    }
  });

  test.each(REMOVED_TOP_LEVEL_SPELLINGS)(
    "removed top-level spelling `%s` does not parse and names the replacement",
    async (spelling, replacement) => {
      await expect(runCli([spelling])).rejects.toThrow(/was removed/);
      await expect(runCli([spelling])).rejects.toThrow(replacement);
    },
  );

  test("bare `make-docs` rejects install and sync flags (cli.test.ts covers the detail matrix)", async () => {
    for (const flag of ["--yes", "--dry-run"]) {
      await expect(runCli([flag])).rejects.toThrow(
        /Bare `make-docs` shows status or starts a guided setup and accepts only `--target` and `--help`/,
      );
    }
    await expect(runCli(["--reconfigure"])).rejects.toThrow(
      "`--reconfigure` was removed. Use `make-docs setup reconfigure` instead.",
    );
  });
});
