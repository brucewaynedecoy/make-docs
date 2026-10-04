import { mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { runCli } from "../src/cli";
import { BACKLOG_REVIEW_UI_RESOURCE, isMcpResourceInProfile } from "../src/mcp/resource-profiles";
import { listNativeMcpResources, readNativeMcpResource } from "../src/mcp/resources";
import { createMakeDocsMcpServer } from "../src/mcp/server";
import { callMakeDocsMcpTool } from "../src/mcp/tools";
import * as context from "../src/operations/context";
import {
  MCP_PROFILES,
  MCP_SERVER_PROFILES,
  type McpProfile,
  type McpProfileOptions,
  type McpServerProfile,
} from "../src/operations/mcp-metadata";
import * as registry from "../src/operations/registry";
import {
  __setResourceOperationRuntimeForTests,
  loadSystemResourceProvider,
  type SystemResourceProjectContext,
  type SystemResourceProviderInventory,
} from "../src/operations/resource";
import * as providerLoader from "../src/operations/resource/provider";
import { TEMPLATE_ROOT } from "../src/utils";
import { cleanupTempDir, createTempDir } from "./helpers";

const FIXTURES: Array<{ type: "contract" | "reference" | "template" | "prompt"; name: string; profiles: McpProfile[] }> = [
  { type: "contract", name: "common", profiles: [...MCP_PROFILES] },
  { type: "reference", name: "install", profiles: ["setup"] },
  { type: "template", name: "work", profiles: ["workflow", "backlog"] },
  { type: "prompt", name: "verify", profiles: ["quality"] },
  { type: "reference", name: "backlog", profiles: ["backlog"] },
  { type: "contract", name: "overlap", profiles: ["setup", "quality"] },
];
const URI = Object.fromEntries(FIXTURES.map(({ type, name }) => [name, `make-docs://system/${type}/${name}.md`]));
const EXPECTED: Record<McpServerProfile, string[]> = {
  core: [URI.common],
  setup: [URI.common, URI.install, URI.overlap],
  workflow: [URI.common, URI.work],
  quality: [URI.common, URI.verify, URI.overlap],
  backlog: [URI.common, URI.work, URI.backlog],
  all: Object.values(URI),
};
const SHIPPED_COUNTS: Record<McpServerProfile, number> = {
  core: 7, setup: 7, workflow: 48, quality: 33, backlog: 8, all: 62,
};
const wireUris = (profile: McpServerProfile, native: string[]) => [...native,
  ...(profile === "all" || profile === "backlog" ? [BACKLOG_REVIEW_UI_RESOURCE.uri] : [])].sort();

async function withClient<T>(options: McpProfileOptions, run: (client: Client) => Promise<T>): Promise<T> {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const server = createMakeDocsMcpServer(options);
  const client = new Client({ name: "w24-p3-test", version: "1.0.0" });
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  try {
    return await run(client);
  } finally {
    await client.close();
    await server.close();
  }
}

describe("W24 R0 P3 native MCP resource profiles", () => {
  let root: string;
  let providerRoot: string;
  let provider: SystemResourceProviderInventory;
  let project: SystemResourceProjectContext;

  beforeEach(() => {
    root = createTempDir("w24-p3-project-");
    providerRoot = createTempDir("w24-p3-provider-");
    provider = createProvider(providerRoot);
    project = { projectRoot: root, evidence: [] };
    vi.spyOn(providerLoader, "loadInstalledSystemResourceProvider").mockImplementation(() => ({ ok: true, value: provider }));
    __setResourceOperationRuntimeForTests(() => ({ provider, project }));
  });

  afterEach(() => {
    __setResourceOperationRuntimeForTests(null);
    vi.restoreAllMocks();
    cleanupTempDir(root);
    cleanupTempDir(providerRoot);
  });

  test.each(MCP_SERVER_PROFILES)("lists the exact ready %s resources through helpers and SDK", async (profile) => {
    const expected = [...EXPECTED[profile]].sort();
    expect((await listNativeMcpResources(root, { profile })).resources.map(({ uri }) => uri).sort()).toEqual(expected);
    const all = await listNativeMcpResources(root, { profile: "all" });
    await withClient({ profile }, async (client) => {
      const resources = (await client.listResources()).resources;
      expect(resources.map(({ uri }) => uri).sort()).toEqual(wireUris(profile, expected));
      expect(new Set(resources.map(({ uri }) => uri)).size).toBe(resources.length);
      for (const resource of resources.filter(({ uri }) => uri !== BACKLOG_REVIEW_UI_RESOURCE.uri)) expect(resource).toEqual(all.resources.find(({ uri }) => uri === resource.uri));
    });
  });

  test("all is the exact union of the five intent resource lists", async () => {
    const union = new Set<string>();
    for (const profile of MCP_PROFILES) {
      await withClient({ profile }, async (client) => {
        for (const resource of (await client.listResources()).resources) union.add(resource.uri);
      });
    }
    const all = await withClient({ profile: "all" }, async (client) => (await client.listResources()).resources);
    expect(all.map(({ uri }) => uri).sort()).toEqual([...union].sort());
    expect(all).toHaveLength(FIXTURES.length + 1);
  });

  test("default helpers and server preserve explicit all list, bytes, and provenance", async () => {
    expect(await listNativeMcpResources(root)).toEqual(await listNativeMcpResources(root, { profile: "all" }));
    for (const uri of Object.values(URI)) {
      expect(await readNativeMcpResource(uri, root)).toEqual(await readNativeMcpResource(uri, root, { profile: "all" }));
    }
    const readServer = (options: McpProfileOptions) => withClient(options, async (client) => ({
      list: await client.listResources(),
      read: await client.readResource({ uri: URI.common }),
    }));
    expect(await readServer({})).toEqual(await readServer({ profile: "all" }));
  });

  test.each(MCP_PROFILES)("keeps each allowed %s read equal to all and the canonical operation", async (profile) => {
    await withClient({ profile }, async (client) => {
      for (const uri of EXPECTED[profile]) {
        const all = await readNativeMcpResource(uri, root, { profile: "all" });
        const native = await readNativeMcpResource(uri, root, { profile });
        expect(native).toEqual(all);
        expect(await client.readResource({ uri })).toEqual(all);
        const canonical = await registry.invokeOperation("resource.read", { uri, targetRoot: root }, context.createExecutionContext({ surface: "cli", cwd: root }));
        const resource = (canonical.value as { resource: { content: { data: string }; provenance: unknown } }).resource;
        expect(native.contents[0].blob).toBe(resource.content.data);
        expect(native.contents[0]._meta.makeDocs.provenance).toEqual(resource.provenance);
      }
    });
  });

  test.each(MCP_PROFILES)("rejects every hidden %s URI before context, operation, or content reads", async (profile) => {
    const hidden = Object.values(URI).filter((uri) => !EXPECTED[profile].includes(uri));
    const invoke = vi.spyOn(registry, "invokeOperation");
    const createContext = vi.spyOn(context, "createExecutionContext");
    const reads = provider.resources.map((entry) => vi.fn(entry.readContent));
    provider = { ...provider, resources: provider.resources.map((entry, index) => ({ ...entry, readContent: reads[index] })) };
    await withClient({ profile }, async (client) => {
      for (const uri of hidden) {
        await expect(readNativeMcpResource(uri, root, { profile })).rejects.toMatchObject({
          code: ErrorCode.InvalidParams,
          data: { makeDocs: { code: "resource-not-found", uri } },
        });
        await expect(client.readResource({ uri })).rejects.toMatchObject({
          code: ErrorCode.InvalidParams,
          data: { makeDocs: { code: "resource-not-found", uri } },
        });
      }
    });
    expect(invoke).not.toHaveBeenCalled();
    expect(createContext).not.toHaveBeenCalled();
    for (const read of reads) expect(read).not.toHaveBeenCalled();
  });

  test.each(MCP_SERVER_PROFILES)("rejects unknown URIs before the shared handler in %s", async (profile) => {
    const invoke = vi.spyOn(registry, "invokeOperation");
    const uri = "make-docs://system/reference/not-in-provider.md";
    await expect(readNativeMcpResource(uri, root, { profile })).rejects.toMatchObject({ data: { makeDocs: { code: "resource-not-found" } } });
    expect(invoke).not.toHaveBeenCalled();
  });

  test("invalid runtime profiles fail before loading provider or making a context", async () => {
    const load = vi.mocked(providerLoader.loadInstalledSystemResourceProvider);
    load.mockClear();
    const invoke = vi.spyOn(registry, "invokeOperation");
    const createContext = vi.spyOn(context, "createExecutionContext");
    const options = { profile: "unknown" as McpServerProfile };
    await expect(listNativeMcpResources(root, options)).rejects.toThrow("core, setup, workflow, quality, backlog, all");
    await expect(readNativeMcpResource(URI.common, root, options)).rejects.toThrow("core, setup, workflow, quality, backlog, all");
    expect(() => createMakeDocsMcpServer(options)).toThrow("core, setup, workflow, quality, backlog, all");
    expect(load).not.toHaveBeenCalled();
    expect(invoke).not.toHaveBeenCalled();
    expect(createContext).not.toHaveBeenCalled();
  });

  test.each(["all", "core"] as const)("fails closed for missing assignment metadata in %s", async (profile) => {
    const { mcpResources: _assignments, ...missing } = provider;
    provider = missing;
    const invoke = vi.spyOn(registry, "invokeOperation");
    await expect(listNativeMcpResources(root, { profile })).rejects.toMatchObject({ data: { makeDocs: { code: "provider-catalog-invalid" } } });
    await expect(readNativeMcpResource(URI.common, root, { profile })).rejects.toMatchObject({ data: { makeDocs: { code: "provider-catalog-invalid" } } });
    expect(invoke).not.toHaveBeenCalled();
  });

  test.each(["unknown profile", "missing URI"])("fails closed for %s in both all and narrow native reads", async (invalid) => {
    provider = { ...provider, mcpResources: invalid === "missing URI"
      ? provider.mcpResources!.slice(1)
      : provider.mcpResources!.map((entry, index) => index === 0 ? { ...entry, profiles: ["unknown" as McpProfile] } : entry),
    };
    const invoke = vi.spyOn(registry, "invokeOperation");
    for (const profile of ["all", "core"] as const) {
      await expect(listNativeMcpResources(root, { profile })).rejects.toMatchObject({ data: { makeDocs: { code: "provider-catalog-invalid" } } });
      await expect(readNativeMcpResource(URI.common, root, { profile })).rejects.toMatchObject({ data: { makeDocs: { code: "provider-catalog-invalid" } } });
    }
    expect(invoke).not.toHaveBeenCalled();
  });

  test("canonical CLI inventory and core resource tools still include resources hidden from native core", async () => {
    const canonical = await registry.invokeOperation("resource.list", { targetRoot: root }, context.createExecutionContext({ surface: "cli", cwd: root }));
    const tool = await callMakeDocsMcpTool("make_docs_resource_list", { targetRoot: root }, { profile: "core" });
    expect(tool.result).toEqual(canonical.value);
    await withClient({ profile: "core" }, async (client) => {
      expect((await client.callTool({ name: "make_docs_resource_list", arguments: { targetRoot: root } })).structuredContent).toEqual(tool);
    });
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    await runCli(["resource", "list", "--target", root, "--format", "json"]);
    expect(JSON.parse(stdout.mock.calls.map(([chunk]) => String(chunk)).join(""))).toEqual(canonical.value);
    expect((canonical.value as { resources: unknown[] }).resources).toHaveLength(FIXTURES.length);
    expect((await listNativeMcpResources(root, { profile: "core" })).resources).toHaveLength(1);
    const read = await registry.invokeOperation("resource.read", { uri: URI.backlog, targetRoot: root }, context.createExecutionContext({ surface: "cli", cwd: root }));
    expect((await callMakeDocsMcpTool("make_docs_resource_read", { uri: URI.backlog, targetRoot: root }, { profile: "core" })).result).toEqual(read.value);
    stdout.mockClear();
    await runCli(["resource", "read", URI.backlog, "--target", root, "--format", "json"]);
    expect(JSON.parse(stdout.mock.calls.map(([chunk]) => String(chunk)).join(""))).toEqual(read.value);
    expect(JSON.stringify(canonical.value)).not.toContain("mcpResources");
    expect(JSON.stringify(read.value)).not.toContain("profiles");
  });

  test("allowed reads retain the canonical conflict code, recovery, URI, and path", async () => {
    const entry = provider.resources.find(({ identity }) => identity.uri === URI.common)!;
    const localPath = path.join(root, ".make-docs/system/contracts/common.md");
    mkdirSync(path.dirname(localPath), { recursive: true });
    writeFileSync(localPath, "changed local bytes\n");
    project = { projectRoot: root, evidence: [{
      uri: entry.identity.uri,
      localPath: ".make-docs/system/contracts/common.md",
      selected: true,
      ownership: "managed-projection",
      expectedDigest: entry.digest,
      providerImmutableRef: provider.provider.identity.immutableRef,
    }] };
    let allError: McpError | undefined;
    try {
      await readNativeMcpResource(URI.common, root, { profile: "all" });
    } catch (error) {
      allError = error as McpError;
    }
    expect(allError).toBeInstanceOf(McpError);
    expect(allError?.data).toMatchObject({ makeDocs: { code: "resource-conflict", uri: URI.common, path: realpathSync(localPath), recovery: expect.any(String) } });
    await expect(registry.invokeOperation("resource.read", { uri: URI.common, targetRoot: root }, context.createExecutionContext({ surface: "cli", cwd: root }))).rejects.toMatchObject({
      code: "resource-conflict", uri: URI.common, path: realpathSync(localPath),
      recovery: (allError!.data as { makeDocs: { recovery: string } }).makeDocs.recovery,
    });
    for (const profile of MCP_PROFILES) {
      await expect(readNativeMcpResource(URI.common, root, { profile })).rejects.toMatchObject({
        code: allError!.code, message: allError!.message, data: allError!.data,
      });
    }
  });

  test("serves the Backlog Review shell only for backlog and all", async () => {
    expect(BACKLOG_REVIEW_UI_RESOURCE.ready).toBe(true);
    const invoke = vi.spyOn(registry, "invokeOperation");
    for (const profile of MCP_SERVER_PROFILES) {
      expect(isMcpResourceInProfile(BACKLOG_REVIEW_UI_RESOURCE.profiles, profile)).toBe(profile === "backlog" || profile === "all");
      await withClient({ profile }, async (client) => {
        const allowed = profile === "backlog" || profile === "all";
        expect((await client.listResources()).resources.some(({ uri }) => uri === BACKLOG_REVIEW_UI_RESOURCE.uri)).toBe(allowed);
        invoke.mockClear();
        if (allowed) expect((await client.readResource({ uri: BACKLOG_REVIEW_UI_RESOURCE.uri })).contents[0]).toMatchObject({ mimeType: "text/html;profile=mcp-app" });
        else await expect(client.readResource({ uri: BACKLOG_REVIEW_UI_RESOURCE.uri })).rejects.toMatchObject({ data: { makeDocs: { code: "resource-not-found" } } });
        expect(invoke).not.toHaveBeenCalled();
        expect((await client.listTools()).tools.some(({ name }) => name === "make_docs_backlog_review_open")).toBe(allowed);
      });
    }
  });

  test("the shipped SDK list follows every exact source-owned URI assignment", async () => {
    const installed = providerLoader.loadSystemResourceProvider({ root: TEMPLATE_ROOT, packageName: "@tyler/make-docs", version: "test", immutableRef: "source-test", source: "test" });
    expect(installed.ok).toBe(true);
    if (!installed.ok) return;
    provider = installed.value;
    const catalog = JSON.parse(readFileSync(path.join(TEMPLATE_ROOT, ".make-docs/system-resources.catalog.json"), "utf8")) as { mcpResources: Array<{ uri: string; profiles: McpProfile[] }> };
    expect(catalog.mcpResources.length).toBe(provider.resources.length);
    for (const profile of MCP_SERVER_PROFILES) {
      const expected = catalog.mcpResources.filter(({ profiles }) => profile === "all" || profiles.includes(profile)).map(({ uri }) => uri).sort();
      expect(expected).toHaveLength(SHIPPED_COUNTS[profile]);
      await withClient({ profile }, async (client) => {
        expect((await client.listResources()).resources.map(({ uri }) => uri).sort()).toEqual(wireUris(profile, expected));
      });
    }
  });
});

function createProvider(root: string): SystemResourceProviderInventory {
  const directories = { contract: "contracts", reference: "references", template: "templates", prompt: "prompts" } as const;
  for (const { type, name } of FIXTURES) {
    const directory = path.join(root, ".make-docs/system", directories[type]);
    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, `${name}.md`), `${name} fixture bytes\n`);
  }
  writeFileSync(path.join(root, ".make-docs/system-resources.catalog.json"), JSON.stringify({
    schemaVersion: 1,
    pathBase: "template-root",
    identityTemplate: "make-docs://system/{type}/{path}",
    defaultMediaType: "text/markdown; charset=utf-8",
    resourceTypes: Object.entries(directories).map(([type, directory]) => ({ type, sourceRoot: `.make-docs/system/${directory}`, include: ["*.md"], exclude: [] })),
    mcpResources: FIXTURES.map(({ name, profiles }) => ({ uri: URI[name], profiles })),
  }));
  const loaded = loadSystemResourceProvider({ root, packageName: "w24-p3-fixture", version: "1.0.0", immutableRef: "w24-p3-fixture@1.0.0", source: "test" });
  if (!loaded.ok) throw new Error(loaded.error.message);
  return loaded.value;
}
