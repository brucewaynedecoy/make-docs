import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import {
  cpSync,
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, test } from "vitest";
import { parse } from "yaml";
import { callMakeDocsMcpTool } from "../src/mcp/tools";
import { MCP_CONNECTION_ID_ENV, MCP_CONNECTION_KEY_ENV } from "../src/mcp-connection";
import { buildBacklogSnapshot } from "../src/operations/work/backlog/snapshot";

const CLI = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../dist/index.js");
const roots: string[] = [];
const originalHome = process.env.MAKE_DOCS_HOME;
const originalId = process.env[MCP_CONNECTION_ID_ENV];
const originalKey = process.env[MCP_CONNECTION_KEY_ENV];

function temporary(): string {
  const root = mkdtempSync(path.join(os.tmpdir(), "make-docs-w26-p3-"));
  roots.push(root);
  return root;
}

function runCli(args: string[], storeRoot: string) {
  const result = spawnSync(process.execPath, [CLI, ...args], {
    encoding: "utf8",
    env: { ...process.env, MAKE_DOCS_HOME: storeRoot },
  });
  if (result.status !== 0) throw new Error(`CLI failed: ${result.stderr || result.stdout}`);
  return JSON.parse(result.stdout) as Record<string, any>;
}

function contents(root: string, durableStore = false): string {
  const hashes: string[] = [];
  function visit(dir: string): void {
    for (const name of readdirSync(dir).sort()) {
      const absolute = path.join(dir, name);
      if (statSync(absolute).isDirectory()) visit(absolute);
      else if (!durableStore || !/\.db-(?:wal|shm)$/.test(name)) {
        hashes.push(`${path.relative(root, absolute)}:${createHash("sha256").update(readFileSync(absolute)).digest("hex")}`);
      }
    }
  }
  if (existsSync(root)) visit(root);
  return hashes.join("\n");
}

afterEach(() => {
  if (originalHome === undefined) delete process.env.MAKE_DOCS_HOME;
  else process.env.MAKE_DOCS_HOME = originalHome;
  if (originalId === undefined) delete process.env[MCP_CONNECTION_ID_ENV];
  else process.env[MCP_CONNECTION_ID_ENV] = originalId;
  if (originalKey === undefined) delete process.env[MCP_CONNECTION_KEY_ENV];
  else process.env[MCP_CONNECTION_KEY_ENV] = originalKey;
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("W26 P3 cross-interface proof", () => {
  test("grant changes and refusals preserve Store and project bytes", async () => {
    const root = temporary();
    const project = path.join(root, "project");
    const store = path.join(root, "store");
    mkdirSync(project);
    const setup = runCli([
      "setup", "--target", project, "--yes", "--no-codex", "--no-claude-code",
      "--no-skills", "--generic-mcp-client", "p3-grants", "--json",
    ], store);
    expect(setup.status).toBe("complete");
    const connection = setup.machine.genericMcp.configuration.mcpServers["make-docs"].env;
    process.env.MAKE_DOCS_HOME = store;
    process.env[MCP_CONNECTION_ID_ENV] = connection.MAKE_DOCS_MCP_CONNECTION_ID;
    process.env[MCP_CONNECTION_KEY_ENV] = connection.MAKE_DOCS_MCP_CONNECTION_KEY;
    const projectConfigPath = path.join(project, ".make-docs/config.yaml");
    const initialProjectConfig = readFileSync(projectConfigPath, "utf8");
    const storeConfigPath = path.join(store, "config.json");
    const initialStoreConfig = JSON.parse(readFileSync(storeConfigPath, "utf8"));
    const projectId = setup.project?.projectId ?? parse(initialProjectConfig).projectId;
    const intent = (harness: string, storeAccess: "read" | "write") => JSON.stringify({
      projectId,
      harnessIntegrations: [{
        harness, mode: "narrow", method: "mcp",
        accessCeiling: { store: storeAccess, project: "read", hostConfig: "none" },
      }],
    });

    const cliStatus = runCli([
      "project", "state", "status", "--target-root", project, "--json",
    ], store);
    const mcpStatus = await callMakeDocsMcpTool("project_status", { targetRoot: project });
    expect(mcpStatus).toMatchObject({ operation: "project.state.status" });
    expect(mcpStatus.result).toEqual(cliStatus);
    writeFileSync(projectConfigPath, intent("generic-mcp-p3-grants", "read"));
    await expect(callMakeDocsMcpTool("project_status", { targetRoot: project }))
      .resolves.toMatchObject({ operation: "project.state.status" });

    async function refusedWrite(code: string): Promise<void> {
      const before = [contents(project), contents(store, true)];
      await expect(callMakeDocsMcpTool("surface_ensure", {
        targetRoot: project, surface: "assets", allowWrite: true,
      })).rejects.toMatchObject({ code });
      expect([contents(project), contents(store, true)]).toEqual(before);
    }

    await refusedWrite("store-denied");
    expect((await callMakeDocsMcpTool("backlog_snapshot", { targetRoot: project })).result)
      .toMatchObject({ capabilities: { store: { state: "not-used" } } });

    writeFileSync(projectConfigPath, JSON.stringify({ projectId, harnessIntegrations: [] }));
    await refusedWrite("store-not-configured");
    writeFileSync(projectConfigPath, intent("generic-mcp-other", "write"));
    await refusedWrite("store-not-configured");
    writeFileSync(projectConfigPath, initialProjectConfig);

    const revoked = structuredClone(initialStoreConfig);
    revoked.settings.harnesses["generic-mcp-p3-grants"].mcpConnection.active = false;
    writeFileSync(storeConfigPath, `${JSON.stringify(revoked, null, 2)}\n`);
    await refusedWrite("store-denied");
    writeFileSync(storeConfigPath, `${JSON.stringify(initialStoreConfig, null, 2)}\n`);

    const goodKey = process.env[MCP_CONNECTION_KEY_ENV]!;
    process.env[MCP_CONNECTION_KEY_ENV] = "wrong-key";
    await refusedWrite("store-denied");
    process.env[MCP_CONNECTION_KEY_ENV] = goodKey;

    const other = path.join(root, "other-project");
    mkdirSync(other);
    const before = [contents(other), contents(store, true)];
    await expect(callMakeDocsMcpTool("project_status", { targetRoot: other }))
      .rejects.toMatchObject({ code: "store-not-configured" });
    expect([contents(other), contents(store, true)]).toEqual(before);

    process.env.MAKE_DOCS_HOME = path.join(root, "missing-store");
    await expect(callMakeDocsMcpTool("project_status", { targetRoot: project }))
      .rejects.toMatchObject({ code: "store-denied" });
    expect(existsSync(process.env.MAKE_DOCS_HOME)).toBe(false);

    const unavailable = path.join(root, "unavailable-store");
    mkdirSync(unavailable);
    writeFileSync(path.join(unavailable, "config.json"), readFileSync(storeConfigPath));
    process.env.MAKE_DOCS_HOME = unavailable;
    await expect(callMakeDocsMcpTool("project_status", { targetRoot: project }))
      .rejects.toMatchObject({ code: "store-unavailable" });
    expect(existsSync(path.join(unavailable, "store.db"))).toBe(false);

    const unsafe = path.join(root, "unsafe-store");
    cpSync(store, unsafe, { recursive: true });
    const db = new DatabaseSync(path.join(unsafe, "store.db"));
    db.exec("PRAGMA user_version=999");
    db.close();
    process.env.MAKE_DOCS_HOME = unsafe;
    const unsafeBefore = [contents(project), contents(unsafe, true)];
    await expect(callMakeDocsMcpTool("surface_ensure", {
      targetRoot: project, surface: "assets", allowWrite: true,
    })).rejects.toMatchObject({ code: "store-unsafe" });
    expect([contents(project), contents(unsafe, true)]).toEqual(unsafeBefore);
    process.env.MAKE_DOCS_HOME = store;
    await expect(callMakeDocsMcpTool("project_status", { targetRoot: project }))
      .resolves.toMatchObject({ operation: "project.state.status" });
  });

  test("CLI and MCP source facts track dirty files and a moved checkout", async () => {
    const root = temporary();
    let project = path.join(root, "checkout");
    const store = path.join(root, "absent-store");
    mkdirSync(path.join(project, "docs/work/2026-10-23-w26-r0-probe"), { recursive: true });
    mkdirSync(path.join(project, ".make-docs"));
    writeFileSync(path.join(project, ".make-docs/config.yaml"), "projectId: p3-probe\n");
    const record = path.join(project, "docs/work/2026-10-23-w26-r0-probe/00-index.md");
    writeFileSync(record, "---\ntitle: Probe\nkind: work\ncoordinate: W26 R0\nstatus: active\n---\n\n# Probe\n\n## Phase Map\n\n- Phase 1: Test\n");
    function git(args: string[]) {
      const result = spawnSync("git", args, { cwd: project, encoding: "utf8" });
      if (result.status !== 0) throw new Error(result.stderr);
      return result.stdout.trim();
    }
    git(["init", "-q"]);
    git(["add", "."]);
    git(["-c", "user.name=W26 P3", "-c", "user.email=w26-p3@example.invalid", "commit", "-qm", "P3 fixture"]);

    async function compare(): Promise<ReturnType<typeof buildBacklogSnapshot>> {
      const cli = runCli(["run", "work", "backlog", "snapshot", "--target-root", project, "--json"], store);
      const mcp = (await callMakeDocsMcpTool("backlog_snapshot", { targetRoot: project })).result;
      expect(mcp).toMatchObject({
        targetRoot: cli.targetRoot,
        gitRevision: cli.gitRevision,
        recordCounts: cli.recordCounts,
        records: cli.records,
        diagnostics: cli.diagnostics,
      });
      return cli as ReturnType<typeof buildBacklogSnapshot>;
    }

    const clean = await compare();
    writeFileSync(record, readFileSync(record, "utf8").replace("Phase 1: Test", "Phase 1: Changed"));
    const dirty = await compare();
    expect(dirty.gitRevision).toBe(clean.gitRevision);
    expect(dirty.records).not.toEqual(clean.records);
    expect(dirty.records[0]?.gitEvidence.some((item: { kind: string }) => item.kind === "working-tree-change")).toBe(true);
    const moved = path.join(root, "moved-checkout");
    renameSync(project, moved);
    project = moved;
    const afterMove = await compare();
    expect(afterMove.gitRevision).toBe(dirty.gitRevision);
    expect(afterMove.records).toEqual(dirty.records);
    expect(afterMove.targetRoot).toBe(moved);
    expect(existsSync(store)).toBe(false);
  });
});
