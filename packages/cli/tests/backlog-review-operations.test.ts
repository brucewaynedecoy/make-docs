import { mkdtempSync, rmSync, symlinkSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createExecutionContext, type OperationStoreSession } from "../src/operations/context";
import { assertOperationMcpMetadata, assertOperationStoreAdmission, getOperation, invokeOperation, listOperationAccessFacts, type OperationDefinition } from "../src/operations/registry";
import * as policy from "../src/operations/harness-policy";
import { StoreAccessStateError } from "../src/operations/store-access";
import { backlogRecordDigest, BACKLOG_REVIEW_SKILL_VERSION } from "../src/operations/work/backlog/cache-service";
import { BACKLOG_RULE_CATALOG_VERSION } from "../src/operations/work/backlog/catalog";
import { createBacklogLiveEnvelope } from "../src/operations/work/backlog/live-contracts";
import { BacklogReviewRefreshPayloadV1Schema, backlogReviewRefreshInputSchema } from "../src/operations/work/backlog/review-contracts";
import { BacklogLivePayloadV1Schema } from "../src/operations/work/backlog/presentation";
import { BacklogSnapshotError, buildBacklogSnapshot } from "../src/operations/work/backlog/snapshot";
import { BacklogReportV1Schema, type BacklogSnapshotV1 } from "../src/operations/work/backlog/schemas";
import { createMakeDocsMcpServer } from "../src/mcp/server";
import { defaultAppResources } from "../src/mcp/default-app-resources";
import { BACKLOG_REVIEW_UI_RESOURCE } from "../src/mcp/resource-profiles";
import { callMakeDocsMcpTool, listMakeDocsMcpTools } from "../src/mcp/tools";
import { MCP_SERVER_PROFILES } from "../src/operations/mcp-metadata";
import { adaptRunCliArgv } from "../src/run/cli";
import { renderRunOperationText } from "../src/run/render";
import { smallPresentationReport, PRESENTATION_SESSION_ID } from "./fixtures/backlog-presentation";

const open = "backlog.review.open";
const refresh = "backlog.review.refresh";
const lookup = "work.backlog-cache.lookup";
const snapshotOperation = "work.backlog.snapshot";
const roots: string[] = [];
afterEach(() => { vi.restoreAllMocks(); roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })); });
const report = () => structuredClone(smallPresentationReport);
const envelope = () => createBacklogLiveEnvelope(report(), PRESENTATION_SESSION_ID);
const context = (storeSession?: unknown) => createExecutionContext({ surface: "test", storeSession: storeSession as OperationStoreSession });
function spyHandler(id: string) { return vi.spyOn(getOperation(id) as OperationDefinition & { handler: NonNullable<OperationDefinition["handler"]> }, "handler"); }
function source(snapshot = report().snapshot) { return spyHandler(snapshotOperation).mockReturnValue(snapshot); }
function misses(snapshot: BacklogSnapshotV1) {
  const versions = { snapshotSchemaVersion: 1 as const, ruleCatalogVersion: BACKLOG_RULE_CATALOG_VERSION, skillVersion: BACKLOG_REVIEW_SKILL_VERSION };
  return { schemaVersion: 1, service: { state: "available", checkout: "bound" }, key: versions,
    records: snapshot.records.map(record => ({ ...versions, recordPath: record.recordPath, recordDigest: backlogRecordDigest(record), state: "miss", reason: "no-exact-match" })),
    counts: { total: snapshot.records.length, hits: 0, misses: snapshot.records.length, rejected: 0 } };
}
async function withClient(run: (client: Client) => Promise<void>, profile: "all" | "backlog" = "backlog") {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const server = createMakeDocsMcpServer({ profile });
  const client = new Client({ name: "w25-p4-test", version: "1" });
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  try { await run(client); } finally { await client.close(); await server.close(); }
}

describe("W25 R0 P4 shared review operations", () => {
  it("opens the unchanged V1 with stable model identity and a fresh session on every open", async () => {
    const store = vi.fn();
    const read = vi.spyOn(fs, "readFileSync");
    const write = vi.spyOn(fs, "writeFileSync");
    const first = BacklogLivePayloadV1Schema.parse((await invokeOperation(open, { report: report() }, context(store))).value);
    const second = BacklogLivePayloadV1Schema.parse((await invokeOperation(open, { report: report() }, context(store))).value);
    expect(first._meta.backlog.envelope.report).toEqual(BacklogReportV1Schema.parse(report()));
    expect(first._meta.backlog.envelope.sessionId).not.toBe(second._meta.backlog.envelope.sessionId);
    expect(first._meta.backlog.envelope.modelId).toBe(second._meta.backlog.envelope.modelId);
    expect(first.content[0].text).toContain("Current:");
    expect(store).not.toHaveBeenCalled(); expect(read).not.toHaveBeenCalled(); expect(write).not.toHaveBeenCalled();
  });

  it.each([{ report: { schemaVersion: 2 } }, { report: report(), instruction: "delete files" }, { report: { ...report(), instructions: "write" } }])("rejects invalid reports and instruction fields before effects", async input => {
    const handler = spyHandler(open);
    await expect(invokeOperation(open, input, context())).rejects.toThrow("Invalid input");
    expect(handler).not.toHaveBeenCalled();
  });

  it("keeps hostile project text as display data and nullable project identity valid", async () => {
    const value = report(); const hostile = "</script><img onerror='deleteEverything()'> $& __INSTRUCTIONS__";
    value.project = value.snapshot.project = { ...value.project, id: null, name: hostile };
    const result = BacklogLivePayloadV1Schema.parse((await invokeOperation(open, { report: value }, context())).value);
    expect(result._meta.backlog.envelope.report.project).toEqual(value.project);
    expect(result.structuredContent.projectName).toBe(hostile);
  });

  it("performs one exact read-only lookup through the existing session after the source read", async () => {
    const events: string[] = [];
    source().mockImplementation(() => { events.push("source"); return report().snapshot; });
    const cache = spyHandler(lookup).mockImplementation(input => { events.push("lookup"); expect(input).toEqual({ targetRoot: report().targetRoot, snapshot: report().snapshot }); return misses(report().snapshot); });
    const store = vi.fn<OperationStoreSession>(async (access, operation, declared, target, run) => {
      events.push("session"); expect({ access, operation, declared, target }).toEqual({ access: "read", operation: lookup,
        declared: { store: "read", project: "read", hostConfig: "none" }, target: report().targetRoot }); return run();
    });
    const write = spyHandler("work.backlog-cache.write");
    const value = BacklogReviewRefreshPayloadV1Schema.parse((await invokeOperation(refresh, { envelope: envelope() }, context(store))).value);
    expect(events).toEqual(["source", "session", "lookup"]);
    expect(store).toHaveBeenCalledTimes(1); expect(cache).toHaveBeenCalledTimes(1); expect(write).not.toHaveBeenCalled();
    expect(value._meta.backlog.refresh.state).toBe("unchanged");
    expect(value._meta.backlog.envelope).toEqual(envelope());
  });

  it.each(["store-not-configured", "store-unavailable", "store-unsafe", "store-denied"] as const)("preserves successful source facts when optional cache is %s", async code => {
    source(); const cache = spyHandler(lookup);
    const store = vi.fn<OperationStoreSession>(async () => { throw new StoreAccessStateError(code, lookup, "Test limit", "Retry this lookup"); });
    const value = BacklogReviewRefreshPayloadV1Schema.parse((await invokeOperation(refresh, { envelope: envelope() }, context(store))).value);
    expect(value._meta.backlog.currentSnapshot).toEqual(report().snapshot);
    expect(value._meta.backlog.refresh.state).toBe("unchanged");
    expect(value._meta.backlog.cache).toMatchObject({ state: "unavailable", reason: code, operation: lookup });
    expect(value.content[0].text).toContain("Continue the review");
    expect(cache).not.toHaveBeenCalled(); expect(store).toHaveBeenCalledTimes(1);
  });

  it("rechecks the current caller at nested admission and stops only the denied cache lookup", async () => {
    source(); const cache = spyHandler(lookup); const store = vi.fn();
    const actor = "current-actor-receipt";
    const gate = vi.spyOn(policy, "assertHarnessOperationAllowed").mockImplementation(input => {
      expect(input.operation).toBe(lookup); expect(input.callerIdentityRaw).toBe(actor); expect(input.route).toBe("mcp");
      expect(input.required).toEqual({ store: "read", project: "read", hostConfig: "none" });
      throw new StoreAccessStateError("store-denied", lookup, "Current actor has no read grant", "Review the current actor grant");
    });
    const ctx = createExecutionContext({ surface: "mcp", route: "mcp", callerIdentityRaw: actor, storeSession: store });
    const result = BacklogReviewRefreshPayloadV1Schema.parse((await invokeOperation(refresh, { envelope: envelope() }, ctx)).value);
    expect(result._meta.backlog.refresh.state).toBe("unchanged");
    expect(result._meta.backlog.cache).toMatchObject({ state: "unavailable", reason: "store-denied" });
    expect(gate).toHaveBeenCalledTimes(1); expect(store).not.toHaveBeenCalled(); expect(cache).not.toHaveBeenCalled();
    await expect(invokeOperation(lookup, { targetRoot: report().targetRoot, snapshot: report().snapshot }, ctx)).rejects.toMatchObject({ code: "store-denied" });
  });

  it("keeps accepted harness and actor context on the one nested Store session", async () => {
    source(); const ctx = createExecutionContext({ surface: "mcp", route: "mcp", callerIdentityRaw: "current-receipt",
      storeSession: async (_access, _operation, _declared, _target, run) => run() });
    const gate = vi.spyOn(policy, "assertHarnessOperationAllowed").mockReturnValue({ configured: true, verified: true,
      access: { store: "read", project: "read", hostConfig: "none" }, harnesses: [], methods: [], reason: "Test admission" });
    const cache = spyHandler(lookup).mockImplementation((_input, received) => { expect(received).toBe(ctx); return misses(report().snapshot); });
    await invokeOperation(refresh, { envelope: envelope() }, ctx);
    expect(gate).toHaveBeenCalledOnce(); expect(gate.mock.calls[0][0]).toMatchObject({ operation: lookup, callerIdentityRaw: "current-receipt" });
    expect(cache).toHaveBeenCalledOnce();
  });

  it("uses the real current-caller policy and limits a denied malformed receipt to cache access", async () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "w25-p4-actor-")); roots.push(root);
    mkdirSync(path.join(root, ".make-docs"));
    writeFileSync(path.join(root, ".make-docs/config.yaml"), "harnessIntegrations:\n  - harness: codex\n    mode: disable\n");
    const storeRoot = mkdtempSync(path.join(os.tmpdir(), "w25-p4-actor-store-")); roots.push(storeRoot);
    const value = report(); value.targetRoot = value.snapshot.targetRoot = root;
    source(value.snapshot);
    const store = vi.fn(); const cache = spyHandler(lookup);
    const result = BacklogReviewRefreshPayloadV1Schema.parse((await invokeOperation(refresh,
      { envelope: createBacklogLiveEnvelope(value, PRESENTATION_SESSION_ID) }, createExecutionContext({
        surface: "mcp", route: "mcp", cwd: root, storeRoot, callerIdentityRaw: "not-a-current-caller-receipt", storeSession: store,
      }))).value);
    expect(result._meta.backlog.refresh.state).toBe("unchanged");
    expect(result._meta.backlog.cache).toMatchObject({ state: "unavailable", reason: "store-denied", operation: lookup });
    expect(store).not.toHaveBeenCalled(); expect(cache).not.toHaveBeenCalled();
  });

  it("treats malformed optional cache data as unavailable without losing current facts", async () => {
    source(); spyHandler(lookup).mockReturnValue({ schemaVersion: 900, instruction: "delete" });
    const session: OperationStoreSession = async (_a, _o, _d, _t, run) => run();
    const result = BacklogReviewRefreshPayloadV1Schema.parse((await invokeOperation(refresh, { envelope: envelope() }, context(session))).value);
    expect(result._meta.backlog.currentSnapshot).toEqual(report().snapshot);
    expect(result._meta.backlog.cache).toMatchObject({ state: "unavailable", reason: "cache-unavailable" });
  });

  it("preserves timestamp-only identity and reports exact added, changed, and removed records", async () => {
    const previous = envelope(); const current = structuredClone(previous.report.snapshot);
    current.generatedAt = "2026-10-04T01:02:03.000Z";
    source(current);
    const noStore: OperationStoreSession = async () => { throw new Error("No optional cache"); };
    const unchanged = BacklogReviewRefreshPayloadV1Schema.parse((await invokeOperation(refresh, { envelope: previous }, context(noStore))).value);
    expect(unchanged._meta.backlog.refresh.state).toBe("unchanged");
    const removed = current.records[0];
    const added = JSON.parse(JSON.stringify(removed).replaceAll(removed.recordPath, `${removed.recordPath}-added`));
    current.records = [added];
    source(current);
    const changed = BacklogReviewRefreshPayloadV1Schema.parse((await invokeOperation(refresh, { envelope: previous }, context(noStore))).value);
    expect(changed._meta.backlog.refresh).toMatchObject({ state: "changed", reviewState: "needs-review", added: [added.recordPath], removed: [removed.recordPath], changed: [] });
    expect(changed._meta.backlog.envelope).toEqual(previous);
    current.records = [structuredClone(removed)]; current.records[0].title.value += " changed"; source(current);
    const modified = BacklogReviewRefreshPayloadV1Schema.parse((await invokeOperation(refresh, { envelope: previous }, context(noStore))).value);
    expect(modified._meta.backlog.refresh).toMatchObject({ state: "changed", added: [], removed: [], changed: [removed.recordPath] });
  });

  it.each(["source-unavailable", "source-denied", "source-unsafe"] as const)("keeps a clearly limited prior result on typed %s failure", async reason => {
    source().mockImplementation(() => { throw new BacklogSnapshotError("Source failed", reason); });
    const cache = spyHandler(lookup); const store = vi.fn();
    const result = BacklogReviewRefreshPayloadV1Schema.parse((await invokeOperation(refresh, { envelope: envelope() }, context(store))).value);
    expect(result._meta.backlog.envelope).toEqual(envelope());
    expect(result._meta.backlog.refresh).toMatchObject({ state: "unavailable", reason, reviewState: "last-known", snapshotId: null });
    expect(result._meta.backlog.currentSnapshot).toBeNull(); expect(result.content[0].text).toContain("last known");
    expect(store).not.toHaveBeenCalled(); expect(cache).not.toHaveBeenCalled();
  });

  it("marks a real symlink root unsafe before Store access", async () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "w25-p4-symlink-")); roots.push(root);
    const linked = path.join(root, "linked"); symlinkSync(root, linked);
    const value = report(); value.targetRoot = value.snapshot.targetRoot = linked;
    const result = BacklogReviewRefreshPayloadV1Schema.parse((await invokeOperation(refresh, { envelope: createBacklogLiveEnvelope(value, PRESENTATION_SESSION_ID) }, context())).value);
    expect(result._meta.backlog.refresh).toMatchObject({ state: "unavailable", reason: "source-unsafe" });
  });

  it("reads a real current snapshot without project ID or configured Store", async () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "w25-p4-no-store-")); roots.push(root);
    const snapshot = buildBacklogSnapshot(root);
    const value = report(); value.targetRoot = value.snapshot.targetRoot = root; value.project = value.snapshot.project = snapshot.project;
    const result = BacklogReviewRefreshPayloadV1Schema.parse((await invokeOperation(refresh, { envelope: createBacklogLiveEnvelope(value, PRESENTATION_SESSION_ID) }, createExecutionContext({ surface: "mcp", route: "mcp", cwd: root }))).value);
    expect(result._meta.backlog.currentSnapshot?.project.id).toBeNull();
    expect(result._meta.backlog.refresh).toMatchObject({ state: "changed", removed: [value.records[0].recordPath] });
    expect(result._meta.backlog.cache).toMatchObject({ state: "unavailable", reason: "store-not-configured" });
  });

  it("rejects stale envelopes and a changed project identity", async () => {
    const value = envelope(); value.modelId = "0".repeat(64);
    expect(backlogReviewRefreshInputSchema.safeParse({ envelope: value }).success).toBe(false);
    const current = report().snapshot; current.project.id = "other-project"; source(current);
    const store = vi.fn();
    await expect(invokeOperation(refresh, { envelope: envelope() }, context(store))).rejects.toThrow("same project");
    expect(store).not.toHaveBeenCalled();
  });

  it("restricts optional admission and leaves required read and write gates intact", async () => {
    const definition = getOperation(refresh);
    expect(listOperationAccessFacts().find(fact => fact.operation === refresh)).toMatchObject({ storeAdmission: "optional", access: { store: "read" } });
    for (const invalid of [{ ...definition, mutates: "write" as const }, { ...definition, access: { ...definition.access, store: "none" as const } },
      { ...definition, access: { ...definition.access, store: "write" as const } }, { ...definition, storeAdmission: "skip" as never }]) {
      expect(() => assertOperationStoreAdmission(invalid)).toThrow();
    }
    const store = vi.fn<OperationStoreSession>(async () => { throw new StoreAccessStateError("store-denied", lookup, "Denied", "Retry"); });
    await expect(invokeOperation(lookup, { targetRoot: report().targetRoot, snapshot: report().snapshot }, context(store))).rejects.toMatchObject({ code: "store-denied" });
    const write = spyHandler("work.backlog-cache.write");
    await expect(invokeOperation("work.backlog-cache.write", { targetRoot: report().targetRoot, snapshot: report().snapshot, records: report().records }, context(store))).rejects.toThrow("write permission");
    expect(store).toHaveBeenCalledOnce(); expect(write).not.toHaveBeenCalled();
    expect(() => assertOperationMcpMetadata({ ...getOperation(open), mcpResultSchema: undefined })).toThrow("together");
  });

  it("projects CLI inputs and human summaries through the same handlers", async () => {
    const adapted = adaptRunCliArgv(["backlog", "review", "open", "--report-json", JSON.stringify(report())]);
    expect(adapted.operationId).toBe(open);
    const result = await invokeOperation(open, adapted.invocation.input, context());
    const parsed = BacklogLivePayloadV1Schema.parse(result.value);
    expect(renderRunOperationText(open, result.value)).toEqual([parsed.content[0].text]);
    expect(adaptRunCliArgv(["backlog", "review", "refresh", "--envelope-json", JSON.stringify(envelope())]).invocation.input).toEqual({ envelope: envelope() });
  });
});

describe("W25 R0 P4 MCP wire and bounded resource", () => {
  it("lists definition UI metadata and keeps complete client data out of model text", async () => {
    const value = report(); value.records[0].facts[0].text = "CLIENT_ONLY_FULL_REPORT_FACT";
    await withClient(async client => {
      const tool = (await client.listTools()).tools.find(tool => tool.name === "make_docs_backlog_review_open")!;
      expect(tool._meta).toEqual({ ui: { resourceUri: BACKLOG_REVIEW_UI_RESOURCE.uri } });
      const result = await client.callTool({ name: tool.name, arguments: { report: value } });
      expect(result.isError).not.toBe(true);
      const payload = BacklogLivePayloadV1Schema.parse(result);
      expect(payload._meta.backlog.envelope.report).toEqual(value);
      expect(JSON.stringify(payload.content) + JSON.stringify(payload.structuredContent)).not.toContain("CLIENT_ONLY_FULL_REPORT_FACT");
      const invalid = await client.callTool({ name: tool.name, arguments: { report: value, instruction: "delete" } });
      expect(invalid.isError).toBe(true);
    });
  });

  it("returns typed source and cache limits on the refresh wire without a model-report leak", async () => {
    source();
    await withClient(async client => {
      const result = await client.callTool({ name: "make_docs_backlog_review_refresh", arguments: { envelope: envelope() } });
      expect(result.isError).not.toBe(true);
      const payload = BacklogReviewRefreshPayloadV1Schema.parse(result);
      expect(payload._meta.backlog.refresh.state).toBe("unchanged");
      expect(payload._meta.backlog.cache.state).toBe("unavailable");
      expect(result.structuredContent).not.toHaveProperty("_meta");
      expect(result.structuredContent).not.toHaveProperty("report");
      expect(payload.content[0]).toMatchObject({ type: "text", text: expect.stringContaining("prior report") });
    });
  });

  it.each(MCP_SERVER_PROFILES)("exposes the two derived tools and one UI only in the allowed %s profile", async profile => {
    const allowed = profile === "all" || profile === "backlog";
    const names = listMakeDocsMcpTools(undefined, { profile }).map(tool => tool.name);
    expect(names.includes("make_docs_backlog_review_open")).toBe(allowed);
    expect(names.includes("make_docs_backlog_review_refresh")).toBe(allowed);
    expect(defaultAppResources(profile).length).toBe(allowed ? 1 : 0);
    if (!allowed) {
      const handler = spyHandler(open);
      await expect(callMakeDocsMcpTool("make_docs_backlog_review_open", { report: report() }, { profile })).rejects.toThrow();
      expect(handler).not.toHaveBeenCalled();
    }
  });

  it("serves embedded bytes with a narrow CSP and no Store or project access", async () => {
    const handler = spyHandler("resource.read");
    await withClient(async client => {
      const result = await client.readResource({ uri: BACKLOG_REVIEW_UI_RESOURCE.uri });
      expect(result.contents[0]).toMatchObject({ mimeType: "text/html;profile=mcp-app", text: readFileSync(new URL("../src/mcp/assets/backlog-review-v1.html", import.meta.url), "utf8"),
        _meta: { ui: { csp: { connectDomains: [], resourceDomains: [], frameDomains: [], baseUriDomains: [] } } } });
      expect(client.getServerCapabilities()?.extensions).toEqual({ "io.modelcontextprotocol/ui": { mimeTypes: ["text/html;profile=mcp-app"] } });
      expect(handler).not.toHaveBeenCalled();
    });
  });

  it("isolates returned UI metadata from the canonical descriptors", () => {
    const first = listMakeDocsMcpTools(undefined, { profile: "backlog" }).find(tool => tool.name === "make_docs_backlog_review_open")!;
    first._meta!.ui.resourceUri = "ui://other/app/v9.html";
    expect(listMakeDocsMcpTools(undefined, { profile: "all" }).find(tool => tool.name === first.name)?._meta?.ui.resourceUri).toBe(BACKLOG_REVIEW_UI_RESOURCE.uri);
  });

  it("ships the P5 local widget without a tool or agent request transport", () => {
    const html = defaultAppResources("backlog")[0].text;
    expect(html).toContain("widgetReport");
    expect(html).toContain("ui/notifications/tool-result");
    expect(html).not.toMatch(/tools\/call|ui\/message|fetch\(/);
    // Full validation, hostile text, fallback, and local controls are P5 checks.
  });
});
