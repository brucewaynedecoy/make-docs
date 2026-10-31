import { existsSync } from "node:fs";
import path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterEach, describe, expect, test, vi } from "vitest";
import { HARNESS_CALLER_IDENTITY_ENV } from "../src/harness-access/contract";
import { createMakeDocsMcpServer, runMcpServer } from "../src/mcp/server";
import {
  callMakeDocsMcpTool,
  listMakeDocsMcpTools,
  MAKE_DOCS_MCP_TOOLS,
} from "../src/mcp/tools";
import * as context from "../src/operations/context";
import {
  MCP_PROFILES,
  MCP_SERVER_PROFILES,
  parseMcpServerProfile,
  type McpProfileOptions,
  type McpServerProfile,
} from "../src/operations/mcp-metadata";
import { getOperation } from "../src/operations/registry";
import { cleanupTempDir, createTempDir } from "./helpers";

const EXPECTED_COUNTS: Record<McpServerProfile, number> = {
  core: 8, setup: 19, workflow: 14, quality: 9, backlog: 5, all: 49,
};

async function withClient<T>(
  options: McpProfileOptions,
  run: (client: Client) => Promise<T>,
): Promise<T> {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const server = createMakeDocsMcpServer(options);
  const client = new Client({ name: "w24-p2-test", version: "1.0.0" });
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  try {
    return await run(client);
  } finally {
    await client.close();
    await server.close();
  }
}

describe("W24 R0 P2 filtered MCP discovery", () => {
  const roots: string[] = [];
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    for (const root of roots.splice(0)) cleanupTempDir(root);
  });

  test.each(MCP_SERVER_PROFILES)("lists only the ready %s tools through the SDK", async (profile) => {
    const expected = MAKE_DOCS_MCP_TOOLS.filter((tool) =>
      tool.mcpReady !== false && (profile === "all" || tool.mcp!.profiles.includes(profile)),
    ).map((tool) => tool.name).sort();
    expect(expected).toHaveLength(EXPECTED_COUNTS[profile]);
    expect(listMakeDocsMcpTools(undefined, { profile }).map((tool) => tool.name).sort()).toEqual(expected);
    await withClient({ profile }, async (client) => {
      const names = (await client.listTools()).tools.map((tool) => tool.name).sort();
      expect(names).toEqual(expected);
      expect(new Set(names).size).toBe(names.length);
    });
  });

  test("all is the union of the five intent profiles, without duplicate tools", async () => {
    const names = new Set<string>();
    for (const profile of MCP_PROFILES) {
      await withClient({ profile }, async (client) => {
        for (const tool of (await client.listTools()).tools) names.add(tool.name);
      });
    }
    await withClient({ profile: "all" }, async (client) => {
      expect((await client.listTools()).tools.map((tool) => tool.name).sort()).toEqual([...names].sort());
    });
  });

  test("default and explicit all preserve the same wire catalog and tool result", async () => {
    const defaultResult = await withClient({}, async (client) => ({
      tools: (await client.listTools()).tools,
      result: await client.callTool({ name: "domains", arguments: {} }),
    }));
    const allResult = await withClient({ profile: "all" }, async (client) => ({
      tools: (await client.listTools()).tools,
      result: await client.callTool({ name: "domains", arguments: {} }),
    }));
    expect(defaultResult).toEqual(allResult);
    expect(listMakeDocsMcpTools()).toEqual(listMakeDocsMcpTools(undefined, { profile: "all" }));
  });

  test("shared tools keep the same wire input contract in every assigned profile", async () => {
    const all = await withClient({ profile: "all" }, async (client) => (await client.listTools()).tools);
    for (const profile of MCP_PROFILES) {
      await withClient({ profile }, async (client) => {
        for (const tool of (await client.listTools()).tools) {
          expect(tool, `${profile}: ${tool.name}`).toEqual(all.find((candidate) => candidate.name === tool.name));
        }
      });
    }
  });

  test.each(MCP_PROFILES)("reports hidden tools as unknown in the %s server", async (profile) => {
    const visible = new Set(listMakeDocsMcpTools(undefined, { profile }).map((tool) => tool.name));
    const hidden = listMakeDocsMcpTools().filter((tool) => !visible.has(tool.name));
    const createContext = vi.spyOn(context, "createExecutionContext");
    await withClient({ profile }, async (client) => {
      for (const tool of hidden) {
        const result = await client.callTool({
          name: tool.name,
          arguments: { targetRoot: process.cwd(), targetDir: process.cwd(), allowWrite: true },
        });
        expect(result.isError, tool.name).toBe(true);
        expect(JSON.stringify(result), tool.name).toContain("not found");
      }
    });
    expect(createContext).not.toHaveBeenCalled();
  });

  test("direct helpers refuse a hidden valid call before argument, access, or handler effects", async () => {
    const root = createTempDir("w24-p2-hidden-"); roots.push(root);
    const createContext = vi.spyOn(context, "createExecutionContext");
    const handler = vi.spyOn(getOperation("resource.ensure"), "handler");
    const args = {
      targetRoot: root,
      uri: "make-docs://system/contract/human-experience-contract.md",
      allowWrite: true,
    };
    const { allowWrite, ...input } = args;
    expect(getOperation("resource.ensure").inputSchema.safeParse(input).success).toBe(true);
    await expect(callMakeDocsMcpTool("resource_ensure", args, { profile: "core" }))
      .rejects.toThrow("Unknown make-docs MCP tool");
    const targetDir = vi.fn(() => root);
    const handDefinedArgs = Object.defineProperty({}, "targetDir", { get: targetDir });
    await expect(callMakeDocsMcpTool("config", handDefinedArgs, { profile: "backlog" }))
      .rejects.toThrow("Unknown make-docs MCP tool");
    expect(targetDir).not.toHaveBeenCalled();
    expect(createContext).not.toHaveBeenCalled();
    expect(handler).not.toHaveBeenCalled();
    expect(existsSync(path.join(root, ".make-docs"))).toBe(false);
  });

  test.each(["unknown", "Core", "", "core,setup", null, 0, true, ["core"], {}])(
    "rejects invalid runtime profile %j before startup or direct dispatch", async (profile) => {
      const options = { profile: profile as McpServerProfile };
      const message = "Allowed profiles: core, setup, workflow, quality, backlog, all";
      const createContext = vi.spyOn(context, "createExecutionContext");
      expect(() => parseMcpServerProfile(profile)).toThrow(message);
      expect(() => createMakeDocsMcpServer(options)).toThrow(message);
      await expect(runMcpServer(options)).rejects.toThrow(message);
      expect(() => listMakeDocsMcpTools(undefined, options)).toThrow(message);
      await expect(callMakeDocsMcpTool("domains", {}, options)).rejects.toThrow(message);
      expect(createContext).not.toHaveBeenCalled();
    },
  );

  test("defaults an absent profile to all and accepts only the six declared choices", () => {
    expect(parseMcpServerProfile()).toBe("all");
    expect(parseMcpServerProfile(undefined)).toBe("all");
    for (const profile of MCP_SERVER_PROFILES) expect(parseMcpServerProfile(profile)).toBe(profile);
  });

  test("allowed calls preserve target argument checks before core dispatch", async () => {
    const targetRoot = vi.fn(() => { throw new Error("Malformed target root."); });
    const args = Object.defineProperty(
      { uri: "make-docs://system/contract/human-experience-contract.md" },
      "targetRoot",
      { get: targetRoot, enumerable: true },
    );
    const createContext = vi.spyOn(context, "createExecutionContext");
    for (const profile of ["all", "core"] as const) {
      await expect(callMakeDocsMcpTool("resource_read", args, { profile }))
        .rejects.toThrow("Malformed target root.");
    }
    expect(targetRoot).toHaveBeenCalledTimes(2);
    expect(createContext).not.toHaveBeenCalled();
  });

  test("selected workflow tools retain the operation core write gate", async () => {
    await expect(callMakeDocsMcpTool("evidence_record", {}, { profile: "workflow" }))
      .rejects.toBeInstanceOf(context.OperationWriteDeniedError);
    await withClient({ profile: "workflow" }, async (client) => {
      const result = await client.callTool({
        name: "lifecycle_start",
        arguments: { repoRoot: process.cwd(), lifecycleStage: "implementation" },
      });
      expect(result.isError).toBe(true);
      expect(result.structuredContent).toMatchObject({
        code: "operation-error",
        message: expect.stringContaining("requires write permission"),
      });
    });
  });

  test("profile discovery and visible calls retain Store admission", async () => {
    const root = createTempDir("w24-p2-access-"); roots.push(root);
    const store = path.join(root, "unconfigured-store");
    vi.stubEnv("MAKE_DOCS_HOME", store);
    vi.stubEnv(HARNESS_CALLER_IDENTITY_ENV, "");
    await withClient({ profile: "backlog" }, async (client) => {
      expect((await client.listTools()).tools.map((tool) => tool.name)).toContain("backlog_cache_read");
    });
    const captureError = async (profile: McpServerProfile) => {
      try {
        await callMakeDocsMcpTool("project_status", { targetRoot: root }, { profile });
        throw new Error("Expected Store admission to refuse an unconfigured caller.");
      } catch (error) {
        return context.serializeOperationError(error);
      }
    };
    const coreError = await captureError("core");
    expect(coreError).toEqual(await captureError("all"));
    expect(coreError).toMatchObject({ code: "store-not-configured", operation: "project.state.status" });
    expect(existsSync(store)).toBe(false);
  });
});
