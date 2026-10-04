import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, it, vi } from "vitest";
import { createAppResourceCatalog, MCP_APP_MIME_TYPE } from "../src/mcp/app-resources";
import { listNativeMcpResources } from "../src/mcp/resources";
import * as nativeResources from "../src/mcp/resources";
import { createMakeDocsMcpServer } from "../src/mcp/server";
import { listMakeDocsMcpTools } from "../src/mcp/tools";
import { MCP_PROFILES } from "../src/operations/mcp-metadata";
import { BACKLOG_REVIEW_UI_RESOURCE } from "../src/mcp/resource-profiles";
import { selectBacklogDelivery } from "../src/operations/work/backlog/live-contracts";
import {
  createProofServer, HOSTILE_PROJECT_TEXT, PROOF_MESSAGE, PROOF_TOOL, PROOF_URI,
  ProofDataSchema, proofToolResult, readProofHtml,
} from "./fixtures/mcp-app-proof";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const resource = { uri: PROOF_URI, name: "Host proof", description: "Synthetic test", text: readProofHtml() };

async function connect(server = createProofServer()) {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "p2-protocol-test", version: "1.0.0" }, {
    capabilities: { extensions: { "io.modelcontextprotocol/ui": { mimeTypes: [MCP_APP_MIME_TYPE] } } },
  });
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  return { client, close: async () => { await client.close(); await server.close(); } };
}

interface Element {
  textContent: string;
  disabled: boolean;
  dataset: Record<string, string>;
  click?: () => Promise<void>;
  addEventListener: (type: string, listener: () => Promise<void>) => void;
}
interface RpcMessage {
  jsonrpc: string;
  id?: number;
  method?: string;
  params?: Record<string, unknown>;
  result?: unknown;
  error?: unknown;
}

/** Runs the exact static widget script. This is protocol evidence, not host UI evidence. */
function widget(embedded = true) {
  const elements = new Map<string, Element>();
  for (const id of ["status", "project", "summary", "facts", "read", "message", "message-status"]) {
    const element: Element = {
      textContent: "", disabled: true, dataset: {},
      addEventListener(type, listener) { if (type === "click") element.click = listener; },
    };
    Object.defineProperty(element, "innerHTML", { set() { throw new Error("HTML injection"); } });
    elements.set(id, element);
  }
  const sent: RpcMessage[] = [];
  const timers = new Map<number, () => void>();
  let timerId = 0;
  let listener: ((event: { source: unknown; data: unknown }) => void) | undefined;
  const parent = { postMessage: (data: RpcMessage, target: string) => {
    expect(target).toBe("*");
    sent.push(structuredClone(data));
  } };
  const window = {
    parent: embedded ? parent as unknown : undefined as unknown,
    addEventListener(_type: string, next: typeof listener) { listener = next; },
    removeEventListener() { listener = undefined; },
    postMessage: parent.postMessage,
  };
  if (!embedded) window.parent = window;
  const script = readProofHtml().match(/<script>([\s\S]*?)<\/script>/)?.[1];
  if (!script) throw new Error("Missing proof script");
  runInNewContext(script, {
    window, document: { getElementById: (id: string) => elements.get(id) },
    setTimeout: (callback: () => void) => { timers.set(++timerId, callback); return timerId; },
    clearTimeout: (id: number) => timers.delete(id),
  });
  const receive = (data: unknown, source: unknown = parent) => listener?.({ data, source });
  const flush = async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); };
  return {
    elements, sent, receive, flush,
    reply: (id: number, result: unknown) => receive({ jsonrpc: "2.0", id, result }),
    reject: (id: number) => receive({ jsonrpc: "2.0", id, error: { code: -32000, message: "Denied" } }),
    expire: () => { for (const [id, callback] of timers) { timers.delete(id); callback(); } },
    state: () => elements.get("status")!.dataset,
  };
}

const supported = {
  protocolVersion: "2026-01-26",
  hostInfo: { name: "any-host-name", version: "1" },
  hostCapabilities: { serverTools: {}, message: { text: {} } },
  hostContext: {},
};
async function readyWidget() {
  const ui = widget();
  ui.reply(1, supported);
  await ui.flush();
  return ui;
}

describe("P2 static MCP Apps resource boundary", () => {
  it.each([undefined, "all"] as const)(
    "preserves opted-in app wire reads with profile %s",
    async profile => {
      const protocol = await connect(createMakeDocsMcpServer({ profile, appResources: [resource] }));
      try {
        const native = await listNativeMcpResources(process.cwd(), { profile: "all" });
        const listed = (await protocol.client.listResources()).resources;
        expect(listed.filter(item => item.uri !== PROOF_URI && item.uri !== BACKLOG_REVIEW_UI_RESOURCE.uri)).toEqual(native.resources);
        expect(listed.find(item => item.uri === PROOF_URI)).toMatchObject({ uri: PROOF_URI, mimeType: MCP_APP_MIME_TYPE });
        expect((await protocol.client.readResource({ uri: PROOF_URI })).contents[0]).toMatchObject({ text: readProofHtml() });
        expect(await protocol.client.readResource({ uri: native.resources[0].uri })).toEqual(
          await nativeResources.readNativeMcpResource(native.resources[0].uri, process.cwd(), { profile: "all" }),
        );
        expect((await protocol.client.listTools()).tools.map(tool => tool.name)).toEqual(
          listMakeDocsMcpTools(process.cwd(), { profile: "all" }).map(tool => tool.name),
        );
        expect((await protocol.client.callTool({ name: "make_docs_operation_domains", arguments: {} })).isError).not.toBe(true);
        expect(protocol.client.getServerCapabilities()?.extensions).toEqual({
          "io.modelcontextprotocol/ui": { mimeTypes: [MCP_APP_MIME_TYPE] },
        });
      } finally { await protocol.close(); }
    },
  );

  it.each(MCP_PROFILES)("refuses proof app resources in the %s profile before startup", profile => {
    const readText = vi.fn(() => {
      throw new Error("Proof bytes must not be read");
    });
    const input = { ...resource, get text(): string { return readText(); } };
    expect(() => createMakeDocsMcpServer({ profile, appResources: [input] }))
      .toThrow("MCP app proof resources require the all profile.");
    expect(readText).not.toHaveBeenCalled();
  });

  it("checks an invalid combined profile before it reads proof bytes", () => {
    const readText = vi.fn(() => { throw new Error("Proof bytes must not be read"); });
    const input = { ...resource, get text(): string { return readText(); } };
    expect(() => createMakeDocsMcpServer({ profile: "unknown" as never, appResources: [input] }))
      .toThrow("Unknown make-docs MCP profile: unknown.");
    expect(readText).not.toHaveBeenCalled();
  });

  it.each(MCP_PROFILES)("keeps the ordinary %s profile filtered with no proof resources", async profile => {
    const protocol = await connect(createMakeDocsMcpServer({ profile, appResources: [] }));
    try {
      expect((await protocol.client.listTools()).tools.map(tool => tool.name)).toEqual(
        listMakeDocsMcpTools(process.cwd(), { profile }).map(tool => tool.name),
      );
      const native = await listNativeMcpResources(process.cwd(), { profile });
      expect((await protocol.client.listResources()).resources.filter(item => item.uri !== BACKLOG_REVIEW_UI_RESOURCE.uri)).toEqual(native.resources);
      expect(await protocol.client.readResource({ uri: native.resources[0].uri })).toEqual(
        await nativeResources.readNativeMcpResource(native.resources[0].uri, process.cwd(), { profile }),
      );
      const hiddenResource = (await listNativeMcpResources()).resources.find(
        item => !native.resources.some(visible => visible.uri === item.uri),
      )!;
      await expect(protocol.client.readResource({ uri: hiddenResource.uri })).rejects.toThrow();
      const visibleTools = listMakeDocsMcpTools(process.cwd(), { profile });
      const hiddenTool = listMakeDocsMcpTools().find(tool => !visibleTools.some(visible => visible.name === tool.name))!;
      expect((await protocol.client.callTool({ name: hiddenTool.name, arguments: {} })).isError).toBe(true);
      await expect(protocol.client.readResource({ uri: PROOF_URI })).rejects.toThrow();
      expect(protocol.client.getServerCapabilities()?.extensions).toEqual(profile === "backlog"
        ? { "io.modelcontextprotocol/ui": { mimeTypes: [MCP_APP_MIME_TYPE] } } : undefined);
    } finally { await protocol.close(); }
  });

  it("keeps native resource discovery unchanged and adds one versioned app resource", async () => {
    const native = await listNativeMcpResources();
    const protocol = await connect();
    try {
      const listed = (await protocol.client.listResources()).resources;
      expect(listed.filter(item => item.uri !== PROOF_URI && item.uri !== BACKLOG_REVIEW_UI_RESOURCE.uri)).toEqual(native.resources);
      expect(listed.find(item => item.uri === PROOF_URI)).toMatchObject({ uri: PROOF_URI, mimeType: MCP_APP_MIME_TYPE });
      expect(protocol.client.getServerCapabilities()?.extensions).toEqual({
        "io.modelcontextprotocol/ui": { mimeTypes: [MCP_APP_MIME_TYPE] },
      });
      const read = await protocol.client.readResource({ uri: PROOF_URI });
      expect(read.contents).toEqual([{
        uri: PROOF_URI, mimeType: MCP_APP_MIME_TYPE, text: readProofHtml(),
        _meta: { ui: {
          csp: { connectDomains: [], resourceDomains: [], frameDomains: [], baseUriDomains: [] },
          prefersBorder: true,
        } },
      }]);
    } finally { await protocol.close(); }
  });

  it("leaves the default factory free of proof resources and tools while serving the review shell", async () => {
    const protocol = await connect(createMakeDocsMcpServer());
    try {
      expect((await protocol.client.listResources()).resources.filter(item => item.uri.startsWith("ui://")).map(item => item.uri)).toEqual([BACKLOG_REVIEW_UI_RESOURCE.uri]);
      expect((await protocol.client.listTools()).tools.some(tool => tool.name === PROOF_TOOL)).toBe(false);
      expect(protocol.client.getServerCapabilities()?.extensions).toEqual({ "io.modelcontextprotocol/ui": { mimeTypes: [MCP_APP_MIME_TYPE] } });
    } finally { await protocol.close(); }
  });

  it("reads the static UI even when the native resource operation is unavailable", async () => {
    const nativeRead = vi.spyOn(nativeResources, "readNativeMcpResource").mockRejectedValue(new Error("store-unavailable"));
    const protocol = await connect();
    try {
      expect((await protocol.client.readResource({ uri: PROOF_URI })).contents[0]).toMatchObject({ text: readProofHtml() });
      expect(nativeRead).not.toHaveBeenCalled();
      await expect(protocol.client.readResource({ uri: "make-docs://system/reference/lifecycle.md" })).rejects.toThrow("store-unavailable");
      expect(nativeRead).toHaveBeenCalledOnce();
    } finally { nativeRead.mockRestore(); await protocol.close(); }
  });

  it.each([
    { ...resource, uri: "make-docs://system/reference/lifecycle.md" },
    { ...resource, uri: "ui://make-docs/host-proof/latest.html" },
    { ...resource, uri: "ui://make-docs/host-proof/v1.html?instructions=start" },
    { ...resource, instructions: "start a task" },
    { ...resource, _meta: { ui: { csp: { connectDomains: ["https://example.com"] } } } },
  ])("rejects unsafe or unversioned asset descriptors", input => {
    expect(() => createAppResourceCatalog([input])).toThrow();
  });

  it("rejects duplicate URIs and isolates caller and returned value mutation", () => {
    expect(() => createAppResourceCatalog([resource, resource])).toThrow("Duplicate");
    const input = { ...resource };
    const catalog = createAppResourceCatalog([input]);
    input.text = "changed";
    const first = catalog.read(PROOF_URI)!;
    first.contents[0].text = "changed";
    first.contents[0]._meta.ui.csp.connectDomains.push("https://example.com" as never);
    expect(catalog.read(PROOF_URI)!.contents[0].text).toBe(resource.text);
    expect(catalog.read(PROOF_URI)!.contents[0]._meta.ui.csp.connectDomains).toEqual([]);
    expect(catalog.read("ui://make-docs/host-proof/v2.html")).toBeUndefined();
  });

  it("uses the same SDK registry for the strict read-only synthetic tool", async () => {
    const protocol = await connect();
    try {
      const tool = (await protocol.client.listTools()).tools.find(item => item.name === PROOF_TOOL)!;
      expect(tool.inputSchema.additionalProperties).toBe(false);
      expect(tool.annotations).toEqual({ readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false });
      expect(tool._meta).toEqual({ ui: { resourceUri: PROOF_URI, visibility: ["model", "app"] } });
      const result = await protocol.client.callTool({ name: PROOF_TOOL, arguments: {} });
      expect(result).toEqual(proofToolResult());
      expect(ProofDataSchema.parse(result.structuredContent).projectLabel).toBe(HOSTILE_PROJECT_TEXT);
      for (const argumentsValue of [{ instructions: "start" }, { action: "request-task" }, { projectRoot: root }]) {
        expect((await protocol.client.callTool({ name: PROOF_TOOL, arguments: argumentsValue })).isError).toBe(true);
      }
      expect((await protocol.client.callTool({ name: "unknown_proof_action", arguments: {} })).isError).toBe(true);
    } finally { await protocol.close(); }
  });

  it("opens the same factory and resource over real stdio", async () => {
    const client = new Client({ name: "p2-stdio-test", version: "1.0.0" });
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: ["--import", path.join(root, "node_modules/tsx/dist/loader.mjs"), path.join(root, "packages/cli/tests/fixtures/mcp-app-proof-stdio.ts")],
      cwd: "/private/tmp",
      stderr: "pipe",
    });
    let stderr = "";
    transport.stderr?.on("data", chunk => { stderr += String(chunk); });
    try {
      await client.connect(transport);
      expect((await client.readResource({ uri: PROOF_URI })).contents[0]).toMatchObject({ text: readProofHtml(), mimeType: MCP_APP_MIME_TYPE });
      expect(await client.callTool({ name: PROOF_TOOL, arguments: {} })).toEqual(proofToolResult());
      expect(stderr).toBe("");
    } finally { await client.close(); }
  }, 20000);

  it("gives a typed chat fallback for an unproved transport", () => {
    const result = spawnSync(process.execPath, ["--import", "tsx", "tests/fixtures/mcp-app-proof-stdio.ts", "--transport", "streamable-http"], {
      cwd: path.join(root, "packages/cli"), encoding: "utf8",
    });
    expect(result.status).toBe(1);
    expect(result.stdout).toBe("");
    expect(JSON.parse(result.stderr)).toEqual({
      route: "chat-fallback", code: "unsupported-transport",
      message: "This proof supports stdio. Continue in chat or connect a host that supports stdio. No task was created.",
    });
  });
});

describe("P2 exact widget bridge script", () => {
  it("negotiates the UI protocol and uses capability facts without host-name rules", async () => {
    const ui = widget();
    expect(ui.sent[0]).toEqual({ jsonrpc: "2.0", id: 1, method: "ui/initialize", params: {
      appInfo: { name: "make-docs-host-proof", version: "1.0.0" },
      appCapabilities: { availableDisplayModes: ["inline"] }, protocolVersion: "2026-01-26",
    } });
    ui.reply(1, { ...supported, hostInfo: { name: "unrecognized-product", version: "x" } });
    await ui.flush();
    expect(ui.state().state).toBe("live");
    expect(ui.sent[1]).toEqual({ jsonrpc: "2.0", method: "ui/notifications/initialized", params: {} });
    expect(JSON.parse(ui.elements.get("facts")!.textContent)).toEqual({
      protocolVersion: "2026-01-26", appResource: true, toolCalls: true, agentMessages: true, separateTasks: "unknown",
    });
  });

  it.each([{}, { serverTools: {} }, { message: { text: {} } }, { serverTools: {}, message: {} },
    { serverTools: null, message: { text: {} } }, { serverTools: true, message: { text: true } }])(
    "falls back when a required capability is missing or unknown", async hostCapabilities => {
      const ui = widget();
      ui.reply(1, { ...supported, hostCapabilities });
      await ui.flush();
      expect(ui.state()).toMatchObject({ state: "chat-fallback", code: "missing-capability" });
      const facts = JSON.parse(ui.elements.get("facts")!.textContent);
      expect(ui.state().state).toBe(selectBacklogDelivery({
        staticRequested: false,
        capabilities: { appResource: facts.appResource, toolCalls: facts.toolCalls, agentMessages: facts.agentMessages },
      }).mode);
      expect(ui.elements.get("read")!.disabled).toBe(true);
      expect(ui.elements.get("message")!.disabled).toBe(true);
      expect(ui.elements.get("status")!.textContent).toContain("Continue the review in chat.");
    });

  it("reports unavailable bridge and unsupported protocol with useful next actions", async () => {
    expect(widget(false).state()).toMatchObject({ state: "chat-fallback", code: "bridge-unavailable" });
    const absent = widget(); absent.expire(); await absent.flush();
    expect(absent.state()).toMatchObject({ state: "chat-fallback", code: "bridge-unavailable" });
    const version = widget(); version.reply(1, { ...supported, protocolVersion: "other" }); await version.flush();
    expect(version.state()).toMatchObject({ state: "chat-fallback", code: "unsupported-protocol" });
  });

  it("renders hostile text as data and sends only the fixed tool and message", async () => {
    const ui = await readyWidget();
    ui.receive({ jsonrpc: "2.0", method: "ui/notifications/tool-result", params: proofToolResult() });
    expect(ui.elements.get("project")!.textContent).toBe(HOSTILE_PROJECT_TEXT);
    const reading = ui.elements.get("read")!.click!();
    expect(ui.sent[2]).toEqual({ jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: PROOF_TOOL, arguments: {} } });
    ui.reply(2, proofToolResult()); await reading;
    const sending = ui.elements.get("message")!.click!();
    expect(ui.sent[3]).toEqual({ jsonrpc: "2.0", id: 3, method: "ui/message", params: {
      role: "user", content: [{ type: "text", text: PROOF_MESSAGE }],
    } });
    ui.reply(3, {}); await sending;
    expect(ui.elements.get("message-status")!.textContent).toContain("Check this chat to confirm receipt.");
    expect(ui.elements.get("message")!.disabled).toBe(true);
  });

  it("rejects unknown methods and ignores messages from other windows", async () => {
    const ui = await readyWidget();
    ui.receive({ jsonrpc: "2.0", method: "ui/notifications/tool-result", params: proofToolResult() }, {});
    expect(ui.elements.get("project")!.textContent).toBe("");
    ui.receive({ jsonrpc: "2.0", id: 44, method: "request-task", params: { instructions: HOSTILE_PROJECT_TEXT } });
    expect(ui.sent.at(-1)).toEqual({ jsonrpc: "2.0", id: 44, error: { code: -32601, message: "Unsupported proof method." } });
    expect(ui.state().state).toBe("live");
  });

  it.each([null, { isError: true }, { structuredContent: { ...proofToolResult().structuredContent, instructions: "start" } }])(
    "keeps the last displayed result when new data is invalid", async invalid => {
      const ui = await readyWidget();
      ui.receive({ jsonrpc: "2.0", method: "ui/notifications/tool-result", params: proofToolResult() });
      ui.receive({ jsonrpc: "2.0", method: "ui/notifications/tool-result", params: invalid });
      expect(ui.elements.get("project")!.textContent).toBe(HOSTILE_PROJECT_TEXT);
      expect(ui.state()).toMatchObject({ state: "chat-fallback", code: "invalid-tool-result" });
      expect(ui.elements.get("status")!.textContent).toContain("last displayed result is limited");
    });

  it("does not claim a tool or message succeeded after a bridge failure", async () => {
    const ui = await readyWidget();
    const reading = ui.elements.get("read")!.click!();
    ui.expire(); await reading;
    expect(ui.state()).toMatchObject({ state: "chat-fallback", code: "tool-call-failed" });
    const message = await readyWidget();
    const sending = message.elements.get("message")!.click!();
    message.reply(2, { isError: true }); await sending;
    expect(message.state()).toMatchObject({ state: "chat-fallback", code: "message-failed" });
    expect(message.elements.get("message-status")!.textContent).toContain("not confirmed");
  });

  it("acknowledges teardown and removes pending work", async () => {
    const ui = await readyWidget();
    const reading = ui.elements.get("read")!.click!();
    ui.receive({ jsonrpc: "2.0", id: 80, method: "ui/resource-teardown", params: {} });
    await reading;
    expect(ui.sent.at(-1)).toEqual({ jsonrpc: "2.0", id: 80, result: {} });
    expect(ui.elements.get("read")!.disabled).toBe(true);
    expect(ui.elements.get("message")!.disabled).toBe(true);
  });
});
