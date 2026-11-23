import path from "node:path";
import { mkdirSync } from "node:fs";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterAll, afterEach, beforeAll, describe, expect, test, vi } from "vitest";
import { cleanupTempDir, createTempDir } from "./helpers";

/**
 * W33 R0 P3 (PRD 39 R-MIG-1, R-MIG-3): every old CLI path and MCP tool name
 * from the name catalog, in all three states of the migration window.
 *
 * `invokeOperation` is replaced by a recorder, so each command reaches the
 * operation boundary without a Store or project fixture. The recorder shows
 * which operation ran and with which input.
 */
const recorder = vi.hoisted(() => ({
  calls: [] as Array<{ id: string; input: unknown; dryRun: unknown; writesAllowed: unknown }>,
}));

vi.mock("../src/operations/registry", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/operations/registry")>();
  return {
    ...actual,
    invokeOperation: vi.fn(async (id: string, input: unknown, context: { dryRun?: unknown; writesAllowed?: unknown }) => {
      recorder.calls.push({ id, input, dryRun: context?.dryRun, writesAllowed: context?.writesAllowed });
      // `ioErrors` and `valid` let the path command set its exit code.
      return { value: { status: "passed", recordedOperation: id, ioErrors: [], valid: true }, provenance: {} };
    }),
  };
});

const { runCli } = await import("../src/cli");
const { runCliEntry } = await import("../src/run/entry");
const {
  ALIAS_MINOR_RELEASES,
  RENAME_RELEASE,
  RENAMED_MINOR_RELEASES,
  __setMigrationAliasVersionForTests,
  aliasRemovalRelease,
  aliasWindowEndRelease,
  listCliMigrationAliases,
  listMcpMigrationAliases,
  matchCliMigrationAlias,
  migrationAliasState,
} = await import("../src/operations/migration-aliases");
const { NAME_CATALOG } = await import("../src/operations/name-catalog");
const { listOperations, operationFullCliPath } = await import("../src/operations/registry");
const { MAKE_DOCS_MCP_TOOLS, callMakeDocsMcpTool, listMakeDocsMcpTools } = await import("../src/mcp/tools");
const { McpAliasHidingError, createMakeDocsMcpServer, hideToolsFromList } = await import("../src/mcp/server");
const { McpServer } = await import("@modelcontextprotocol/sdk/server/mcp.js");
const { MCP_SERVER_PROFILES } = await import("../src/operations/mcp-metadata");
type McpServerProfile = import("../src/operations/mcp-metadata").McpServerProfile;
const { PROJECT_COMMANDS } = await import("../src/run/root-operations");
const { OPERATION_GROUPS } = await import("../src/run/cli");

/** A version in each state. The rename release starts the window. */
const IN_WINDOW = "2.2.4";
const AFTER_WINDOW = "2.3.0";
const REMOVED = "2.4.0";

let fixtureRoot: string;
let storeContainer: string;
let storeRoot: string;
let previousStoreRoot: string | undefined;

beforeAll(() => {
  fixtureRoot = createTempDir("make-docs-w33-p3-");
  // The Store must be outside the project.
  storeContainer = createTempDir("make-docs-w33-p3-store-");
  storeRoot = path.join(storeContainer, "store");
  mkdirSync(storeRoot, { recursive: true });
  previousStoreRoot = process.env.MAKE_DOCS_HOME;
  process.env.MAKE_DOCS_HOME = storeRoot;
});

afterAll(() => {
  if (previousStoreRoot === undefined) delete process.env.MAKE_DOCS_HOME;
  else process.env.MAKE_DOCS_HOME = previousStoreRoot;
  cleanupTempDir(fixtureRoot);
  cleanupTempDir(storeContainer);
});

afterEach(() => {
  __setMigrationAliasVersionForTests(null);
  recorder.calls.length = 0;
  process.exitCode = undefined;
});

/** Arguments that reach the operation boundary for each catalog entry. */
function sampleArgs(id: string): string[] {
  const root = fixtureRoot;
  const lifecycle = ["--repo-root", root, "--store-root", storeRoot, "--run-id", "run-1"];
  const versioned = [...lifecycle, "--expected-version", "1"];
  const table: Record<string, string[]> = {
    "prd.authority.validate": ["--target-root", root],
    "performance.evidence.validate": ["--target-root", root],
    "lifecycle.start": ["--repo-root", root, "--store-root", storeRoot, "--stage", "design"],
    "lifecycle.show": lifecycle,
    "lifecycle.list": ["--repo-root", root, "--store-root", storeRoot],
    "lifecycle.checkpoint": [...versioned, "--checkpoint", "c1"],
    "lifecycle.pause": versioned,
    "lifecycle.resume": versioned,
    "lifecycle.attach-evidence": [...versioned, "--evidence-id", "e1", "--kind", "note"],
    "lifecycle.complete": versioned,
    "lifecycle.fail": versioned,
    "lifecycle.abandon": versioned,
    "work.item.resolve": ["W1 R0 P1", "--repo-root", root],
    "work.evidence.record": ["W1 R0 P1", "--kind", "note", "--payload-json", "{}", "--repo-root", root, "--store-root", storeRoot],
    "work.evidence.read": ["W1 R0 P1", "--repo-root", root, "--store-root", storeRoot],
    "work.backlog.snapshot": ["--target-root", root],
    "work.backlog-cache.lookup": ["--target-root", root, "--snapshot-json", "{}"],
    "work.backlog-cache.write": ["--target-root", root, "--snapshot-json", "{}", "--records-json", "[]"],
    "backlog.review.open": ["--report-json", "{}"],
    "backlog.review.refresh": ["--envelope-json", "{}"],
    "project.checkout-move.preview": ["--target-root", root, "--json"],
    "project.checkout-move.apply": ["--source-checkout", "c1", "--source-root", root, "--review", "d1", "--target-root", root, "--json"],
    "project.checkout-register.preview": ["--target-root", root, "--json"],
    "project.checkout-register.apply": ["--review", "d1", "--target-root", root, "--json"],
    "project.path-hygiene.validate": ["--target", root],
    "project.path-hygiene.repair": ["--target", root, "--dry-run"],
  };
  if (id.startsWith("uat.")) return ["--target-root", root];
  const args = table[id];
  if (!args) throw new Error(`No sample arguments for ${id}.`);
  return args;
}

interface CliRun {
  stdout: string;
  stderr: string;
  error: unknown;
  calls: typeof recorder.calls;
}

async function runCaptured(argv: string[]): Promise<CliRun> {
  recorder.calls.length = 0;
  const stdout: string[] = [];
  const stderr: string[] = [];
  const out = vi.spyOn(process.stdout, "write").mockImplementation((chunk) => {
    stdout.push(String(chunk));
    return true;
  });
  const err = vi.spyOn(process.stderr, "write").mockImplementation((chunk) => {
    stderr.push(String(chunk));
    return true;
  });
  let error: unknown = null;
  try {
    await runCli(argv);
  } catch (caught) {
    error = caught;
  } finally {
    out.mockRestore();
    err.mockRestore();
  }
  return { stdout: stdout.join(""), stderr: stderr.join(""), error, calls: [...recorder.calls] };
}

/** Run through the real entry point, as `node dist/index.js` does, with machine output. */
async function runEntryCaptured(argv: string[]): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  recorder.calls.length = 0;
  const stdout: string[] = [];
  const stderr: string[] = [];
  const out = vi.spyOn(process.stdout, "write").mockImplementation((chunk) => {
    stdout.push(String(chunk));
    return true;
  });
  const err = vi.spyOn(process.stderr, "write").mockImplementation((chunk) => {
    stderr.push(String(chunk));
    return true;
  });
  try {
    const exitCode = await runCliEntry(runCli, argv, { machineReadable: true });
    return { exitCode, stdout: stdout.join(""), stderr: stderr.join("") };
  } finally {
    out.mockRestore();
    err.mockRestore();
  }
}

const CLI_ALIASES = listCliMigrationAliases();
const MCP_ALIASES = listMcpMigrationAliases();

describe("W33 R0 P3 migration window", () => {
  test("one constant records the rename release, and the state comes from the version", () => {
    expect(RENAME_RELEASE).toBe("2.1.0");
    expect(ALIAS_MINOR_RELEASES).toBe(2);
    expect(RENAMED_MINOR_RELEASES).toBe(1);
    expect(aliasWindowEndRelease()).toBe("2.3.0");
    expect(aliasRemovalRelease()).toBe("2.4.0");
    const cases: Array<[string, string]> = [
      ["2.0.9", "alias"],
      ["2.1.0", "alias"],
      ["2.1.7", "alias"],
      ["2.2.0", "alias"],
      ["2.2.99", "alias"],
      ["2.3.0-rc.1", "renamed"],
      ["2.3.0", "renamed"],
      ["2.3.12", "renamed"],
      ["2.4.0", "removed"],
      ["2.9.0", "removed"],
      ["3.0.0", "removed"],
      ["1.9.0", "alias"],
      ["not-a-version", "alias"],
    ];
    for (const [version, state] of cases) expect(migrationAliasState(version), version).toBe(state);
    expect(migrationAliasState("3.1.0", "3.0.0")).toBe("alias");
    expect(migrationAliasState("3.2.0", "3.0.0")).toBe("renamed");
    expect(migrationAliasState("3.3.0", "3.0.0")).toBe("removed");
  });

  test("the test seam injects a version, and the real version keeps the aliases", () => {
    expect(migrationAliasState()).toBe("alias");
    __setMigrationAliasVersionForTests(AFTER_WINDOW);
    expect(migrationAliasState()).toBe("renamed");
    __setMigrationAliasVersionForTests(REMOVED);
    expect(migrationAliasState()).toBe("removed");
  });
});

describe("W33 R0 P3 alias list comes only from the name catalog", () => {
  test("every shipped renamed CLI path and MCP name has one alias, and nothing else does (T4)", () => {
    const current = NAME_CATALOG.filter((entry) => entry.status === "current");
    expect(CLI_ALIASES.map((alias) => alias.formerCli).sort()).toEqual(
      current
        .filter((entry) => entry.cliCommand && entry.formerCli && entry.formerCli !== entry.newCli)
        .map((entry) => entry.formerCli)
        .sort(),
    );
    expect(MCP_ALIASES.map((alias) => alias.formerMcp).sort()).toEqual(
      current
        .filter((entry) => entry.formerMcp && entry.formerMcp !== entry.newMcp)
        .map((entry) => entry.formerMcp)
        .sort(),
    );
    expect(CLI_ALIASES).toHaveLength(32);
    expect(MCP_ALIASES).toHaveLength(31);

    const planned = NAME_CATALOG.filter((entry) => entry.status === "planned");
    const aliasIds = new Set([...CLI_ALIASES, ...MCP_ALIASES].map((alias) => alias.id));
    for (const entry of planned) {
      expect(aliasIds.has(entry.id), entry.id).toBe(false);
      if (entry.formerPlannedMcp) {
        expect(MCP_ALIASES.some((alias) => alias.formerMcp === entry.formerPlannedMcp)).toBe(false);
      }
    }
    // `project_register_list` was only an earlier plan's name. It never shipped.
    expect(MCP_ALIASES.some((alias) => alias.formerMcp === "project_register_list")).toBe(false);
  });

  test("every alias names a live command or tool, and no alias is a live name", () => {
    const liveCli = new Set(listOperations().map((operation) => operationFullCliPath(operation.id)));
    for (const alias of CLI_ALIASES) {
      expect(liveCli.has(alias.newCli), alias.newCli).toBe(true);
      expect(liveCli.has(alias.formerCli), alias.formerCli).toBe(false);
      expect(operationFullCliPath(alias.id)).toBe(alias.newCli);
    }
    const liveMcp = new Set(MAKE_DOCS_MCP_TOOLS.map((tool) => tool.name));
    for (const alias of MCP_ALIASES) {
      expect(liveMcp.has(alias.newMcp), alias.newMcp).toBe(true);
      expect(liveMcp.has(alias.formerMcp), alias.formerMcp).toBe(false);
    }
  });

  test("the longest old path wins, and a partial old path is not an alias", () => {
    expect(matchCliMigrationAlias(["run", "work", "backlog-cache", "lookup", "--x"])).toMatchObject({
      alias: { newCli: "backlog cache lookup" },
      rest: ["--x"],
    });
    expect(matchCliMigrationAlias(["run", "work"])).toBeNull();
    expect(matchCliMigrationAlias(["check", "prd"])).toBeNull();
    expect(matchCliMigrationAlias(["run", "work", "status"])).toBeNull();
  });
});

describe("W33 R0 P3 CLI aliases (T1, A7, A8)", () => {
  test.each(CLI_ALIASES.map((alias) => [alias.formerCli, alias] as const))(
    "in the window, `make-docs %s` runs the same operation and names the new command",
    async (_former, alias) => {
      __setMigrationAliasVersionForTests(IN_WINDOW);
      const args = sampleArgs(alias.id);
      const viaNew = await runCaptured([...alias.newCli.split(" "), ...args]);
      expect(viaNew.error).toBeNull();
      const viaOld = await runCaptured([...alias.formerCli.split(" "), ...args]);
      expect(viaOld.error).toBeNull();

      expect(viaOld.calls).toHaveLength(1);
      expect(viaOld.calls).toEqual(viaNew.calls);
      expect(viaOld.calls[0]!.id).toBe(alias.id);

      // One stderr line names the new command. The new path prints none.
      expect(viaNew.stderr).toBe("");
      expect(viaOld.stderr).toBe(
        `make-docs: \`make-docs ${alias.formerCli}\` is now \`make-docs ${alias.newCli}\`. The old name stops working in 2.3.0.\n`,
      );

      // Stdout stays clean JSON. Only the alias adds `renamedTo`.
      const newJson = JSON.parse(viaNew.stdout) as Record<string, unknown>;
      const oldJson = JSON.parse(viaOld.stdout) as Record<string, unknown>;
      expect(newJson).not.toHaveProperty("renamedTo");
      expect(oldJson).toEqual({ ...newJson, renamedTo: `make-docs ${alias.newCli}` });
    },
  );

  test.each(CLI_ALIASES.map((alias) => [alias.formerCli, alias] as const))(
    "after the window, `make-docs %s` returns command-renamed and runs nothing",
    async (_former, alias) => {
      __setMigrationAliasVersionForTests(AFTER_WINDOW);
      const run = await runCaptured([...alias.formerCli.split(" "), ...sampleArgs(alias.id)]);
      expect(run.calls).toEqual([]);
      expect(run.stdout).toBe("");
      expect(run.error).toMatchObject({
        code: "command-renamed",
        renamedTo: `make-docs ${alias.newCli}`,
        nextAction: `Run \`make-docs ${alias.newCli}\`.`,
        details: {
          formerName: `make-docs ${alias.formerCli}`,
          renamedTo: `make-docs ${alias.newCli}`,
          renamedIn: "2.1.0",
          removedIn: "2.4.0",
        },
      });
      // The new path still runs.
      const viaNew = await runCaptured([...alias.newCli.split(" "), ...sampleArgs(alias.id)]);
      expect(viaNew.error).toBeNull();
      expect(viaNew.calls.map((call) => call.id)).toEqual([alias.id]);
    },
  );

  test.each(CLI_ALIASES.map((alias) => [alias.formerCli, alias] as const))(
    "after one more release, `make-docs %s` is gone and fails with guidance",
    async (_former, alias) => {
      __setMigrationAliasVersionForTests(REMOVED);
      const run = await runCaptured([...alias.formerCli.split(" "), ...sampleArgs(alias.id)]);
      expect(run.calls).toEqual([]);
      expect(run.stderr).toBe("");
      expect(run.error).toBeInstanceOf(Error);
      expect((run.error as { code?: string }).code).not.toBe("command-renamed");
      const message = (run.error as Error).message;
      if (alias.formerCli.startsWith("run ")) {
        expect(message).toContain("`make-docs run` is no longer a command group.");
        // The hint names the new group's help (R-MIG-1).
        expect(message).toContain(`\`make-docs ${alias.newCli.split(" ")[0]} --help\``);
      } else {
        expect(message).toContain("Unknown make-docs project command");
        expect(message).toContain(`make-docs project ${alias.newCli.replace(/^project /, "")}`);
      }
    },
  );

  test("a renamed command exits non-zero with a typed machine result", async () => {
    __setMigrationAliasVersionForTests(AFTER_WINDOW);
    const written: string[] = [];
    const exitCode = await runCliEntry(runCli, ["run", "prd", "authority", "validate", "--json"], {
      machineReadable: true,
      writeError: (value) => written.push(value),
    });
    expect(exitCode).toBe(1);
    expect(JSON.parse(written.join(""))).toMatchObject({
      ok: false,
      code: "command-renamed",
      renamedTo: "make-docs check prd",
      nextAction: "Run `make-docs check prd`.",
    });
  });

  test("an alias error in the window carries renamedTo", async () => {
    __setMigrationAliasVersionForTests(IN_WINDOW);
    const written: string[] = [];
    const exitCode = await runCliEntry(runCli, ["run", "lifecycle", "show", "--repo-root", fixtureRoot], {
      machineReadable: true,
      writeError: (value) => written.push(value),
    });
    expect(exitCode).toBe(1);
    expect(JSON.parse(written.join(""))).toMatchObject({ ok: false, renamedTo: "make-docs lifecycle show" });
  });

  test("bare `make-docs run` and any `run` spelling with no former group name every group", async () => {
    for (const argv of [["run"], ["run", "--help"], ["run", "nothing"], ["run", "playbook", "status"]]) {
      const run = await runCaptured(argv);
      expect(run.calls).toEqual([]);
      expect((run.error as Error).message, argv.join(" ")).toBe(
        "`make-docs run` is no longer a command group. Its commands moved to the `work`, `backlog`, `lifecycle`, and `check` groups. Run `make-docs --help` to see every group.",
      );
    }
  });

  test("a former `run` group word names the new group's help", async () => {
    const cases: Array<[string[], string]> = [
      [["run", "work", "status"], "The `run work` commands moved to the `work` and `backlog` groups. Run `make-docs work --help` or `make-docs backlog --help` to see them."],
      [["run", "backlog", "nothing"], "The `run backlog` commands moved to the `backlog` group. Run `make-docs backlog --help` to see them."],
      [["run", "lifecycle"], "The `run lifecycle` commands moved to the `lifecycle` group. Run `make-docs lifecycle --help` to see them."],
      [["run", "prd", "authority"], "The `run prd` commands moved to the `check` group. Run `make-docs check --help` to see them."],
      [["run", "performance", "evidence"], "The `run performance` commands moved to the `check` group. Run `make-docs check --help` to see them."],
      [["run", "uat", "nothing", "validate"], "The `run uat` commands moved to the `check` group. Run `make-docs check --help` to see them."],
    ];
    for (const [argv, hint] of cases) {
      const run = await runCaptured(argv);
      expect(run.calls).toEqual([]);
      expect((run.error as Error).message, argv.join(" ")).toBe(`\`make-docs run\` is no longer a command group. ${hint}`);
    }
  });

  test("`make-docs run playbook status` exits 1 with one JSON operation-error line and no renamedTo", async () => {
    const run = await runEntryCaptured(["run", "playbook", "status"]);
    expect(run.exitCode).toBe(1);
    expect(run.stdout).toBe("");
    expect(run.stderr.endsWith("\n")).toBe(true);
    expect(run.stderr.trimEnd().split("\n")).toHaveLength(1);
    const error = JSON.parse(run.stderr) as Record<string, unknown>;
    expect(error).toMatchObject({ ok: false, code: "operation-error" });
    expect(error).not.toHaveProperty("renamedTo");
  });

  test("a failing alias call writes only one JSON error to stderr, with renamedTo", async () => {
    __setMigrationAliasVersionForTests(IN_WINDOW);
    const run = await runEntryCaptured(["run", "work", "item", "resolve", "--help"]);
    expect(run.exitCode).toBe(1);
    expect(run.stdout).toBe("");
    expect(run.stderr).not.toContain("is now `make-docs");
    const error = JSON.parse(run.stderr) as Record<string, unknown>;
    expect(error).toMatchObject({
      ok: false,
      code: "operation-error",
      message: "`--help` requires a value.",
      renamedTo: "make-docs work item resolve",
    });
    // A succeeding alias call still prints the notice, after its output.
    const ok = await runCaptured(["run", "prd", "authority", "validate", "--target-root", fixtureRoot]);
    expect(ok.error).toBeNull();
    expect(ok.stderr).toBe(
      "make-docs: `make-docs run prd authority validate` is now `make-docs check prd`. The old name stops working in 2.3.0.\n",
    );
  });

  test("an unknown project command lists the real project commands", async () => {
    const run = await runCaptured(["project", "nothing", "here"]);
    const message = (run.error as Error).message;
    expect(message).toMatch(/^Unknown make-docs project command: `nothing here`\. Valid project commands:\n/);
    for (const command of PROJECT_COMMANDS) expect(message).toContain(`  make-docs project ${command}\n`.trimEnd());
    expect(message).not.toContain("checkout-move");
    // `surface` keeps its own guidance.
    const surface = await runCaptured(["project", "surface", "ensure", "nowhere"]);
    expect((surface.error as Error).message).toBe("Use `make-docs project surface ensure <archive|artifacts|assets>`.");
  });

  test("the project command list covers every registry project operation", () => {
    const listed = new Set<string>(PROJECT_COMMANDS);
    for (const operation of listOperations().filter((entry) => entry.cli.root === "project")) {
      expect(listed.has(operation.cli.path), operation.cli.path).toBe(true);
    }
  });

  test("help never shows an old CLI path (hidden aliases)", async () => {
    const groups = ["--help", ...OPERATION_GROUPS.map((group) => `${group} --help`), "project --help", "resource --help"];
    for (const argv of groups) {
      const run = await runCaptured(argv.split(" "));
      expect(run.error, argv).toBeNull();
      expect(run.stdout).not.toMatch(/make-docs run\b/);
      for (const alias of CLI_ALIASES) {
        expect(run.stdout, `${argv}: ${alias.formerCli}`).not.toContain(`make-docs ${alias.formerCli}`);
      }
      expect(run.stdout).not.toMatch(/checkout-move|checkout-register|path-hygiene|backlog-cache/);
    }
  });
});

function profilesWith(toolName: string): McpServerProfile[] {
  return MCP_SERVER_PROFILES.filter((profile) =>
    listMakeDocsMcpTools(fixtureRoot, { profile }).some((tool) => tool.name === toolName),
  );
}

function withoutRenamedTo(value: Record<string, unknown>): Record<string, unknown> {
  const { renamedTo: _renamedTo, ...rest } = value;
  return rest;
}

describe("W33 R0 P3 MCP aliases (T2, A7, A8, A9)", () => {
  test.each(MCP_ALIASES.map((alias) => [alias.formerMcp, alias] as const))(
    "in the window, `%s` runs the same operation in its profiles only and adds renamedTo",
    async (_former, alias) => {
      __setMigrationAliasVersionForTests(IN_WINDOW);
      const args = { targetDir: fixtureRoot, targetRoot: fixtureRoot };
      const inProfiles = profilesWith(alias.newMcp);
      expect(inProfiles.length).toBeGreaterThan(0);
      for (const profile of MCP_SERVER_PROFILES) {
        if (!inProfiles.includes(profile)) {
          await expect(callMakeDocsMcpTool(alias.formerMcp, args, { profile }), profile)
            .rejects.toThrow(`Unknown make-docs MCP tool: ${alias.formerMcp}`);
          continue;
        }
        recorder.calls.length = 0;
        const viaNew = await callMakeDocsMcpTool(alias.newMcp, args, { profile });
        const newCalls = [...recorder.calls];
        recorder.calls.length = 0;
        const viaOld = await callMakeDocsMcpTool(alias.formerMcp, args, { profile });
        expect(recorder.calls).toEqual(newCalls);
        expect(viaNew).not.toHaveProperty("renamedTo");
        expect(viaOld.renamedTo).toBe(alias.newMcp);
        expect(withoutRenamedTo(viaOld)).toEqual(viaNew);
      }
    },
  );

  test.each(MCP_ALIASES.map((alias) => [alias.formerMcp, alias] as const))(
    "after the window, `%s` returns command-renamed, and then it is removed",
    async (_former, alias) => {
      const [profile] = profilesWith(alias.newMcp);
      __setMigrationAliasVersionForTests(AFTER_WINDOW);
      await expect(callMakeDocsMcpTool(alias.formerMcp, {}, { profile })).rejects.toMatchObject({
        code: "command-renamed",
        renamedTo: alias.newMcp,
        nextAction: `Call \`${alias.newMcp}\`.`,
      });
      expect(recorder.calls).toEqual([]);
      __setMigrationAliasVersionForTests(REMOVED);
      await expect(callMakeDocsMcpTool(alias.formerMcp, {}, { profile }))
        .rejects.toThrow(`Unknown make-docs MCP tool: ${alias.formerMcp}`);
    },
  );
});

async function withClient<T>(profile: string, run: (client: Client) => Promise<T>): Promise<T> {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const server = createMakeDocsMcpServer({ profile: profile as never });
  const client = new Client({ name: "w33-p3-test", version: "1.0.0" });
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  try {
    return await run(client);
  } finally {
    await client.close();
    await server.close();
  }
}

describe("W33 R0 P3 MCP server", () => {
  test.each([IN_WINDOW, AFTER_WINDOW, REMOVED])("tools/list shows only new names at version %s (A9)", async (version) => {
    __setMigrationAliasVersionForTests(version);
    for (const profile of MCP_SERVER_PROFILES) {
      const names = await withClient(profile, async (client) => (await client.listTools()).tools.map((tool) => tool.name));
      expect(names.sort(), profile).toEqual(listMakeDocsMcpTools(fixtureRoot, { profile }).map((tool) => tool.name).sort());
      for (const alias of MCP_ALIASES) expect(names, profile).not.toContain(alias.formerMcp);
    }
  });

  test("an old name answers over the protocol in its profile only, with renamedTo", async () => {
    __setMigrationAliasVersionForTests(IN_WINDOW);
    await withClient("quality", async (client) => {
      const result = await client.callTool({ name: "prd_validate", arguments: { targetRoot: fixtureRoot } });
      expect(result.isError).toBeFalsy();
      expect(result.structuredContent).toMatchObject({ tool: "check_prd", renamedTo: "check_prd" });
      const fresh = await client.callTool({ name: "check_prd", arguments: { targetRoot: fixtureRoot } });
      expect(fresh.structuredContent).not.toHaveProperty("renamedTo");
    });
    await withClient("core", async (client) => {
      const status = await client.callTool({ name: "install_status", arguments: { targetDir: fixtureRoot } });
      expect(status.structuredContent).toMatchObject({ tool: "setup_status", renamedTo: "setup_status" });
      const outside = await client.callTool({ name: "prd_validate", arguments: { targetRoot: fixtureRoot } });
      expect(outside.isError).toBe(true);
      expect(JSON.stringify(outside.content)).toContain("prd_validate not found");
    });
  });

  test("after the window an old name returns a typed command-renamed result over the protocol", async () => {
    __setMigrationAliasVersionForTests(AFTER_WINDOW);
    await withClient("quality", async (client) => {
      const result = await client.callTool({ name: "prd_validate", arguments: {} });
      expect(result.isError).toBe(true);
      expect(result.structuredContent).toMatchObject({
        code: "command-renamed",
        renamedTo: "check_prd",
        nextAction: "Call `check_prd`.",
      });
    });
    __setMigrationAliasVersionForTests(REMOVED);
    await withClient("quality", async (client) => {
      const result = await client.callTool({ name: "prd_validate", arguments: {} });
      expect(result.isError).toBe(true);
      expect(JSON.stringify(result.content)).toContain("prd_validate not found");
    });
  });

  test("server startup fails loudly when the tools/list handler was never wrapped", () => {
    // A server whose SDK never sets the list handler through the wrapper.
    const fake = { server: { setRequestHandler: () => undefined } } as unknown as Parameters<typeof hideToolsFromList>[0];
    const hiding = hideToolsFromList(fake, new Set(["prd_validate"]));
    expect(() => hiding.assertWrapped()).toThrow(McpAliasHidingError);
    try {
      hiding.assertWrapped();
    } catch (error) {
      expect(error).toMatchObject({ code: "mcp-alias-hiding-unavailable" });
    }

    // The real SDK sets the handler when the first tool is registered.
    const real = new McpServer({ name: "w33-p3", version: "0.0.0" });
    const realHiding = hideToolsFromList(real, new Set(["prd_validate"]));
    expect(() => realHiding.assertWrapped()).toThrow(McpAliasHidingError);
    real.registerTool("check_prd", { description: "x", inputSchema: {} }, async () => ({ content: [] }));
    expect(() => realHiding.assertWrapped()).not.toThrow();

    // Nothing to hide needs no wrapper.
    expect(() => hideToolsFromList(fake, new Set()).assertWrapped()).not.toThrow();

    // A real server in the window starts, so its wrapper ran.
    __setMigrationAliasVersionForTests(IN_WINDOW);
    for (const profile of MCP_SERVER_PROFILES) expect(() => createMakeDocsMcpServer({ profile })).not.toThrow();
  });
});
