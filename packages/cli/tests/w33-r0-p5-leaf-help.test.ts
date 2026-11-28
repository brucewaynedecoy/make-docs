import path from "node:path";
import { mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { afterAll, afterEach, beforeAll, describe, expect, test, vi } from "vitest";
import { cleanupTempDir, createTempDir } from "./helpers";

/**
 * W33 R0 P5: `--help` or `-h` on any registry command (a leaf) prints that
 * command's help and exits 0. Before this fix the leaf's own option parser
 * read `--help`, and most leaves failed with "`--help` requires a value."
 *
 * `invokeOperation` is replaced by a recorder. Help must never reach an
 * operation, so every help call must record nothing.
 */
const recorder = vi.hoisted(() => ({ calls: [] as string[], inputs: [] as unknown[] }));

vi.mock("../src/operations/registry", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/operations/registry")>();
  return {
    ...actual,
    invokeOperation: vi.fn(async (id: string, input: unknown) => {
      recorder.calls.push(id);
      recorder.inputs.push(input);
      return { value: { status: "passed", ioErrors: [], valid: true }, provenance: {} };
    }),
  };
});

const { runCli } = await import("../src/cli");
const { runCliEntry } = await import("../src/run/entry");
const { listOperations, operationFullCliPath, operationCliCommand } = await import("../src/operations/registry");
const { OPERATION_LEAF_HELP, leafValueFlags, renderOperationLeafHelp, resolveLeafHelp } = await import("../src/run/leaf-help");
const { OPERATION_GROUPS, isOperationGroup, runCliAdapterForTests } = await import("../src/run/cli");
const { __setMigrationAliasVersionForTests, listCliMigrationAliases } = await import("../src/operations/migration-aliases");

const IN_WINDOW = "2.2.4";
const AFTER_WINDOW = "2.3.0";

let storeContainer: string;
let storeRoot: string;
let previousStoreRoot: string | undefined;

beforeAll(() => {
  storeContainer = createTempDir("make-docs-w33-p5-store-");
  storeRoot = path.join(storeContainer, "store");
  mkdirSync(storeRoot, { recursive: true });
  previousStoreRoot = process.env.MAKE_DOCS_HOME;
  process.env.MAKE_DOCS_HOME = storeRoot;
});

afterAll(() => {
  if (previousStoreRoot === undefined) delete process.env.MAKE_DOCS_HOME;
  else process.env.MAKE_DOCS_HOME = previousStoreRoot;
  cleanupTempDir(storeContainer);
});

afterEach(() => {
  __setMigrationAliasVersionForTests(null);
  recorder.calls.length = 0;
  recorder.inputs.length = 0;
  process.exitCode = undefined;
});

async function runEntryCaptured(argv: string[]): Promise<{ exitCode: number; stdout: string; stderr: string; calls: string[] }> {
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
    return { exitCode, stdout: stdout.join(""), stderr: stderr.join(""), calls: [...recorder.calls] };
  } finally {
    out.mockRestore();
    err.mockRestore();
  }
}

const OPERATIONS = listOperations();

/** Every `--flag` that a usage line or an option name spells. */
function flags(text: string): string[] {
  return [...new Set(text.match(/--[a-z][a-z0-9-]*/g) ?? [])].sort();
}

/** Every `<argument>` that starts a usage line, before the first flag. */
function leadingArguments(usage: string): string[] {
  return usage.split(" ").filter((word, index, words) => word.startsWith("<") && words.slice(0, index).every((before) => !before.startsWith("-") && !before.startsWith("[")));
}

describe("W33 R0 P5 leaf help table", () => {
  test("every registry operation has leaf help, and nothing else does", () => {
    expect(Object.keys(OPERATION_LEAF_HELP).sort()).toEqual(OPERATIONS.map((operation) => operation.id).sort());
  });

  test.each(OPERATIONS.map((operation) => operation.id))("%s: the usage line and the option list name the same flags", (id) => {
    const entry = OPERATION_LEAF_HELP[id as keyof typeof OPERATION_LEAF_HELP];
    expect(flags(entry.usage), id).toEqual(flags(entry.options.map((option) => option.name).join(" ")));
    expect(leadingArguments(entry.usage), id).toEqual((entry.arguments ?? []).map((argument) => argument.name));
    expect(entry.summary, id).toMatch(/^[A-Z].*\.$/);
    expect(entry.summary, id).not.toMatch(/\brun\b (work|backlog|lifecycle|prd|uat|performance)/);
  });

  test.each(OPERATIONS.map((operation) => operation.id))("%s: the registry usage line is the help usage line", (id) => {
    const usage = OPERATION_LEAF_HELP[id as keyof typeof OPERATION_LEAF_HELP].usage;
    const path = `make-docs ${operationFullCliPath(id)}`;
    expect(operationCliCommand(id)).toBe(usage ? `${path} ${usage}` : path);
    // Both directions: the same flags and the same leading arguments.
    expect(flags(operationCliCommand(id))).toEqual(flags(usage));
    expect(leadingArguments(operationCliCommand(id).slice(path.length + 1))).toEqual(leadingArguments(usage));
  });
});

describe("W33 R0 P5 leaf --help on every registry command", () => {
  const cases = OPERATIONS.flatMap((operation) => [
    { id: operation.id, flag: "--help" },
    { id: operation.id, flag: "-h" },
  ]);

  test.each(cases)("$id $flag exits 0 and prints its help", async ({ id, flag }) => {
    const leaf = operationFullCliPath(id);
    const run = await runEntryCaptured([...leaf.split(" "), flag]);
    expect(run.exitCode, run.stderr).toBe(0);
    expect(run.stderr).toBe("");
    expect(run.calls).toEqual([]);
    expect(run.stdout).toBe(renderOperationLeafHelp(id));
    expect(run.stdout.startsWith(`make-docs ${leaf}\n\n`)).toBe(true);
    expect(run.stdout).toContain(`Usage:\n  make-docs ${leaf}`);
    expect(run.stdout).toContain("Options:\n");
    expect(run.stdout).toContain(OPERATION_LEAF_HELP[id as keyof typeof OPERATION_LEAF_HELP].summary);
    expect(run.stdout).not.toMatch(/make-docs run\b/);
  });

  test("help after other arguments and flags still prints the leaf help", async () => {
    for (const argv of [
      ["work", "item", "resolve", "W33 R0 P5", "--help"],
      ["check", "prd", "--target-root", ".", "--help"],
      ["lifecycle", "show", "--last", "-h"],
      ["project", "state", "recover", "op-1", "--rollback", "--help"],
      ["project", "paths", "repair", "--apply", "-h"],
    ]) {
      const run = await runEntryCaptured(argv);
      expect(run.exitCode, argv.join(" ")).toBe(0);
      expect(run.calls).toEqual([]);
      expect(run.stdout, argv.join(" ")).toContain("Usage:");
    }
  });

  test("help reads no Store and writes nothing", async () => {
    for (const operation of OPERATIONS) {
      await runEntryCaptured([...operationFullCliPath(operation.id).split(" "), "--help"]);
    }
    expect(readdirSync(storeRoot)).toEqual([]);
  });

  test("a branch of a dispatcher group lists its commands", async () => {
    const run = await runEntryCaptured(["check", "uat", "--help"]);
    expect(run.exitCode).toBe(0);
    for (const operation of OPERATIONS.filter((candidate) => operationFullCliPath(candidate.id).startsWith("check uat "))) {
      expect(run.stdout).toContain(`  make-docs ${operationFullCliPath(operation.id)}\n`);
    }
    for (const argv of [["work", "item", "-h"], ["work", "evidence", "--help"], ["backlog", "cache", "--help"], ["backlog", "review", "--help"]]) {
      const branch = await runEntryCaptured(argv);
      expect(branch.exitCode, argv.join(" ")).toBe(0);
      expect(branch.stdout, argv.join(" ")).toContain("Commands:");
    }
  });

  test("every group lists one plain-words line per command, and no flags (owner decision 2026-11-23)", async () => {
    for (const group of ["setup", "project", "resource", "work", "backlog", "lifecycle", "check"]) {
      const run = await runEntryCaptured([group, "--help"]);
      expect(run.exitCode, group).toBe(0);
      const lines = run.stdout.split("\n");
      const start = lines.indexOf("Commands:");
      expect(start, group).toBeGreaterThan(0);
      const end = lines.indexOf("", start);
      const commands = lines.slice(start + 1, end);
      for (const operation of OPERATIONS.filter((candidate) => candidate.cli.root === group)) {
        const marker = operation.mutates === "write" ? " [write]" : "";
        const at = commands.indexOf(`  make-docs ${operationFullCliPath(operation.id)}${marker}`);
        expect(at, `${group}: ${operation.id}`).toBeGreaterThanOrEqual(0);
        expect(commands[at + 1], operation.id).toBe(`      ${OPERATION_LEAF_HELP[operation.id as keyof typeof OPERATION_LEAF_HELP].summary}`);
      }
      // Each command is one path line and one summary line. Flags are in leaf help only.
      expect(commands.length % 2, group).toBe(0);
      for (const line of commands) expect(line, group).not.toMatch(/ --?[a-z]/);
      expect(run.stdout, group).toContain("Use --help or -h with a command to see its options.");
    }
  });

  test("read-only commands say only \"Changes nothing.\"; write commands say they can change things", () => {
    for (const operation of OPERATIONS) {
      const help = renderOperationLeafHelp(operation.id);
      const summary = OPERATION_LEAF_HELP[operation.id as keyof typeof OPERATION_LEAF_HELP].summary;
      expect(help, operation.id).not.toContain("This command reads only.");
      if (operation.mutates === "write") {
        expect(summary, operation.id).not.toMatch(/changes nothing/i);
        expect(help, operation.id).toContain("This command can change files or Store records.");
      } else {
        expect(summary, operation.id).toMatch(/ Changes nothing\.$/);
        expect(help, operation.id).not.toContain("This command can change files or Store records.");
      }
    }
  });

  test("setup help names setup store for people and its MCP tools for agents", async () => {
    const run = await runEntryCaptured(["setup", "--help"]);
    expect(run.stdout).toContain("setup store checks and cleans the Make Docs Store. People run it in a terminal.");
    expect(run.stdout).toContain("Agents use the MCP tools setup_store_check and setup_store_clean.");
    expect(run.stdout.split("\n")[2]).toBe("Install Make Docs in this project, or sync it with your saved choices.");
    // Only the options of `make-docs setup` itself, after the list, name `--target`.
    expect(run.stdout.split("Options for make-docs setup itself:")[0]).not.toContain("target");
  });

  test("project help is short and plain", async () => {
    const run = await runEntryCaptured(["project", "--help"]);
    for (const word of ["plan dispositions", "receipt", "installation evidence"]) expect(run.stdout).not.toContain(word);
    expect(run.stdout).toContain("Install state is kept in the Make Docs Store.");
    expect(run.calls).toEqual([]);
  });

  test("group help and words that are not commands keep their own paths", () => {
    expect(resolveLeafHelp(["work", "--help"])).toBeNull();
    expect(resolveLeafHelp(["project", "--help"])).toBeNull();
    expect(resolveLeafHelp(["setup", "store", "--help"])).toBeNull();
    expect(resolveLeafHelp(["work", "item", "resolve", "W1 R0 P1"])).toBeNull();
    expect(resolveLeafHelp(["check", "nothing", "--help"])).toBeNull();
  });
});

describe("W33 R0 P5 leaf --help through an old path", () => {
  const aliases = listCliMigrationAliases();

  test.each(aliases.map((alias) => alias.formerCli))("in the window, `%s --help` prints the new command's help, then the notice", async (formerCli) => {
    __setMigrationAliasVersionForTests(IN_WINDOW);
    const alias = aliases.find((candidate) => candidate.formerCli === formerCli)!;
    const run = await runEntryCaptured([...formerCli.split(" "), "--help"]);
    expect(run.exitCode, run.stderr).toBe(0);
    expect(run.calls).toEqual([]);
    expect(operationFullCliPath(alias.id)).toBe(alias.newCli);
    expect(run.stdout).toBe(renderOperationLeafHelp(alias.id));
    expect(run.stderr).toBe(`make-docs: \`make-docs ${formerCli}\` is now \`make-docs ${alias.newCli}\`. The old name stops working in 2.3.0.\n`);
  });

  test("after the window, an old path with --help returns command-renamed", async () => {
    __setMigrationAliasVersionForTests(AFTER_WINDOW);
    const run = await runEntryCaptured(["run", "work", "item", "resolve", "--help"]);
    expect(run.exitCode).toBe(1);
    expect(run.stdout).toBe("");
    expect(JSON.parse(run.stderr)).toMatchObject({ code: "command-renamed", renamedTo: "make-docs work item resolve" });
  });
});

/** A fixture value for one flag or argument placeholder. */
function fixtureValue(placeholder: string, root: string, checkJson: string): string {
  const table: Record<string, string> = {
    "<digest>": "d1", "<id>": "c1", "<path>": root, "<dir>": root, "<project>": root, "<file>": checkJson,
    "<source>=<destination>": "a=b", "<text>": "x", "<slug>": "user", "<n>": "1", "<operation-id>": "op1",
    "<uri>": "make-docs://system/reference/lifecycle.md",
  };
  return table[placeholder] ?? placeholder.replace(/^</, "").replace(/>$/, "").split("|")[0]!;
}

/** argv for one option name, one argv per alternative: `--a|--b` gives two. */
function optionArgvs(name: string, root: string, checkJson: string): string[][] {
  return name.split("|").filter((piece) => piece.startsWith("--")).map((piece) => {
    const [flag, value] = piece.split(" ");
    return value === undefined ? [flag!] : [flag!, fixtureValue(value, root, checkJson)];
  });
}

describe("W33 R0 P5 help table matches each command's real options", () => {
  let root: string;
  let checkJson: string;
  beforeAll(() => {
    root = createTempDir("make-docs-w33-p5-options-");
    checkJson = path.join(root, "check.json");
    writeFileSync(checkJson, JSON.stringify({ files: [] }));
  });
  afterAll(() => cleanupTempDir(root));

  const dispatcher = OPERATIONS.filter((operation) => isOperationGroup(operation.cli.root));
  const routed = OPERATIONS.filter((operation) => !isOperationGroup(operation.cli.root));

  test("the dispatcher and router sets cover every operation", () => {
    // 48 in W33 R0, 4 W34 R0 P1 Skill checks, 9 W29 R0 P4 work queue commands, 10 W30 R0 P3 factory commands, 3 W30 R0 follow-up factory commands, 1 W30 R0 Store lifecycle command, and 1 W35 R0 P1 project checkpoint command.
    expect(dispatcher.length + routed.length).toBe(76);
    expect([...new Set(dispatcher.map((operation) => operation.cli.root))].sort()).toEqual([...OPERATION_GROUPS].sort());
  });

  /**
   * Runs one dispatcher adapter on options whose values, booleans, and arrays
   * are proxies. Each key the adapter reads is recorded. A key in `absent`
   * reads as missing; every other key reads as a fixture value. Adapter
   * errors after a read are expected and ignored.
   */
  function readKeys(id: string, absent: Set<string>): { keys: Set<string>; positionals: boolean } {
    const keys = new Set<string>();
    let positionals = false;
    const value = (key: string) => key === "expected-version" ? "1" : key.endsWith("-json") ? "{}" : ["repo-root", "store-root", "target-root"].includes(key) ? root : "x";
    const values = new Proxy({} as Record<string, string>, {
      get: (_target, key) => {
        if (typeof key !== "string") return undefined;
        keys.add(key);
        return absent.has(key) ? undefined : value(key);
      },
    });
    const arrays = new Proxy({} as Record<string, string[]>, {
      get: (_target, key) => {
        if (typeof key !== "string") return undefined;
        keys.add(key);
        return absent.has(key) ? undefined : [value(key)];
      },
    });
    const booleans = { has: (key: string) => { keys.add(key); return !absent.has(key); } } as unknown as Set<string>;
    const options = {
      get positionals() { positionals = true; return ["W1 R0 P1"]; },
      values, arrays, booleans,
    };
    try {
      runCliAdapterForTests(id)!(options as never);
    } catch {
      // A missing or conflicting option stops the adapter after its reads.
    }
    return { keys, positionals };
  }

  test.each(dispatcher.map((operation) => operation.id))("%s: the options its adapter reads are the options its help names", (id) => {
    expect(runCliAdapterForTests(id), id).toBeDefined();
    // Explore: start with every key present, then make each read key absent
    // in turn, until no new key is read. This reaches `a ?? b` branches.
    const seen = new Set<string>();
    let positionals = false;
    const queue: Set<string>[] = [new Set()];
    const tried = new Set<string>();
    while (queue.length > 0) {
      const absent = queue.shift()!;
      const run = readKeys(id, absent);
      positionals ||= run.positionals;
      for (const key of run.keys) {
        if (seen.has(key)) continue;
        seen.add(key);
        const next = new Set([...absent, key]);
        const signature = [...next].sort().join(",");
        if (!tried.has(signature) && next.size <= 2) {
          tried.add(signature);
          queue.push(next);
        }
      }
    }
    // `--json` is read by the dispatcher for every command, not by the adapter.
    seen.add("json");
    const entry = OPERATION_LEAF_HELP[id as keyof typeof OPERATION_LEAF_HELP];
    expect([...seen].map((key) => `--${key}`).sort(), id).toEqual(flags(entry.usage));
    expect(positionals, id).toBe((entry.arguments ?? []).length > 0);
  });

  test.each(routed.map((operation) => operation.id))("%s: its router accepts every option its help names", async (id) => {
    const entry = OPERATION_LEAF_HELP[id as keyof typeof OPERATION_LEAF_HELP];
    const leaf = operationFullCliPath(id).split(" ");
    const args = (entry.arguments ?? []).map((argument) => fixtureValue(argument.name, root, checkJson));
    const required = entry.options.filter((option) => !entry.usage.includes(`[${option.name}`));
    const base = required.flatMap((option) => optionArgvs(option.name, root, checkJson)[0]!);
    const runs: string[][] = [[...leaf, ...args, ...base]];
    for (const option of entry.options.filter((candidate) => !required.includes(candidate))) {
      for (const extra of optionArgvs(option.name, root, checkJson)) runs.push([...leaf, ...args, ...base, ...extra]);
    }
    for (const option of required) {
      // The other alternatives of a required `--a|--b` option.
      for (const extra of optionArgvs(option.name, root, checkJson).slice(1)) {
        runs.push([...leaf, ...args, ...base.filter((word) => !optionArgvs(option.name, root, checkJson)[0]!.includes(word)), ...extra]);
      }
    }
    for (const argv of runs) {
      await runEntryCaptured(argv);
      expect(recorder.calls, argv.join(" ")).toEqual([id]);
    }
  });
});

describe("W33 R0 P5 help flag as a value", () => {
  test("`--checkpoint -h` gives -h as the checkpoint name, and help is not shown", async () => {
    const argv = ["lifecycle", "checkpoint", "--run-id", "run-1", "--expected-version", "1", "--checkpoint", "-h", "--repo-root", storeContainer, "--store-root", storeRoot];
    expect(resolveLeafHelp(argv)).toBeNull();
    const run = await runEntryCaptured(argv);
    expect(run.stdout).not.toContain("Usage:");
    expect(run.calls).toEqual(["lifecycle.checkpoint"]);
    expect(recorder.inputs[0]).toMatchObject({ checkpoint: "-h" });
    // A help flag after the value still asks for help.
    expect(resolveLeafHelp([...argv, "--help"])).toBe(renderOperationLeafHelp("lifecycle.checkpoint"));
    // `--last` takes no value, so `-h` after it is help.
    expect(resolveLeafHelp(["lifecycle", "show", "--last", "-h"])).toBe(renderOperationLeafHelp("lifecycle.show"));
  });

  test("value flags come from the option list", () => {
    expect([...leafValueFlags(OPERATION_LEAF_HELP["lifecycle.show"])].sort()).toEqual(["--repo-root", "--run-id", "--store-root"]);
    expect(leafValueFlags(OPERATION_LEAF_HELP["project.state.recover"]).has("--resume")).toBe(false);
    expect(leafValueFlags(OPERATION_LEAF_HELP["resource.list"]).has("--type")).toBe(true);
    expect(leafValueFlags(OPERATION_LEAF_HELP["resource.ensure"]).has("--approve")).toBe(true);
  });
});

describe("W33 R0 P5 notes moved into command help", () => {
  test("setup store clean names the three newest backups and how to restore one", () => {
    const help = renderOperationLeafHelp("setup.store.clean");
    expect(help).toContain("It keeps the three newest backups.");
    expect(help).toContain("To restore a backup");
    expect(help).toContain("MAKE_DOCS_HOME/backup/");
  });

  test("setup store check, project list, and project state keep their notes", () => {
    expect(renderOperationLeafHelp("setup.store.check")).toContain("Check also reads a Store that was changed outside Make Docs.");
    expect(renderOperationLeafHelp("project.register.list")).toContain("--target-root does not limit the list.");
    for (const id of ["project.state.status", "project.state.recover"]) {
      const help = renderOperationLeafHelp(id);
      expect(help).toContain("project state status");
      expect(help).toContain("project state recover");
      expect(help).toContain("without reading the Store or changing files");
    }
  });
});
