import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createBacklogRequestController, type BacklogControllerRequest } from "../src/mcp/widget/request-controller";
import { createBacklogLivePayload } from "../src/operations/work/backlog/presentation";
import { createBacklogRefreshResult } from "../src/operations/work/backlog/live-contracts";
import { createBacklogReviewRefreshPayload } from "../src/operations/work/backlog/review-contracts";
import { createBacklogActionMessage, parseBacklogActionMessage, resolveBacklogAgentMessage,
  prepareBacklogAgentOpen, confirmBacklogAgentOpen, validateBacklogRebuiltModel,
  attemptBacklogAgentCacheWrite } from "../src/operations/work/backlog/agent-contracts";
import { createExecutionContext } from "../src/operations/context";
import { invokeOperation } from "../src/operations/registry";
import { smallPresentationReport, PRESENTATION_SESSION_ID } from "./fixtures/backlog-presentation";
import { backlogCapabilitiesFromInitialize } from "../src/mcp/widget/host-capabilities";

const report = () => structuredClone(smallPresentationReport);
const opened = () => createBacklogLivePayload(report(), PRESENTATION_SESSION_ID);
const snapshot = () => report().snapshot;
const cache = { state: "unavailable" as const, operation: "work.backlog-cache.lookup" as const, reason: "store-not-configured" as const,
  nextAction: "Current source facts are available. Continue the review. Restore cache access before a later cache lookup." as const };
function refreshed(current = snapshot(), code: string = "store-not-configured") {
  const envelope = opened()._meta.backlog.envelope;
  const limitedCache = { ...cache, reason: code as typeof cache.reason };
  return createBacklogReviewRefreshPayload(envelope, current, createBacklogRefreshResult(envelope, { state: "available", snapshot: current }), limitedCache);
}
function unavailable() {
  const envelope = opened()._meta.backlog.envelope;
  return createBacklogReviewRefreshPayload(envelope, null, createBacklogRefreshResult(envelope, { state: "unavailable", reason: "source-denied" }),
    { state: "not-attempted", reason: "source-unavailable" });
}
const tick = async () => { for (let i = 0; i < 5; i++) await Promise.resolve(); };
function rig(capabilities = { appResource: true, toolCalls: true, agentMessages: true }) {
  const requests: BacklogControllerRequest[] = [], timers = new Map<number, () => void>(); let serial = 0;
  const controller = createBacklogRequestController({ capabilities, send: request => requests.push(request),
    timers: { set: callback => { timers.set(++serial, callback); return serial; }, clear: token => timers.delete(token as number) } });
  const reply = (request: BacklogControllerRequest, result: unknown) => controller.receive({ jsonrpc: "2.0", id: request.id, result });
  return { controller, requests, timers, reply };
}
const action = (kind: "review-wave" | "request-task" = "review-wave") => ({ ...opened()._meta.backlog.actions[0], action: kind });

describe("P6 isolated refresh/request controller", () => {
  it.each([
    [undefined, false, false], [{}, false, false], [{ serverTools: {} }, true, false],
    [{ message: { text: {} } }, false, true], [{ serverTools: {}, message: { text: {} } }, true, true],
    [{ serverTools: "yes", message: { text: true } }, false, false],
  ])("uses only supported standard host capability facts %s", (hostCapabilities, toolCalls, agentMessages) => {
    expect(backlogCapabilitiesFromInitialize({ protocolVersion: "2026-01-26", hostCapabilities })).toMatchObject({ toolCalls, agentMessages, separateTasks: null });
    expect(backlogCapabilitiesFromInitialize({ protocolVersion: "unknown", hostCapabilities })).toEqual({});
  });
  it("does nothing on import, construction, model load, or local state reads", async () => {
    const r = rig(); expect(r.requests).toEqual([]); await r.controller.acceptModel(opened());
    r.controller.getState(); expect(r.requests).toEqual([]); expect(r.timers.size).toBe(0);
  });
  it("keeps serialized delivery bound to its own session and rejects a stale action", async () => {
    const r = rig();
    const wrapped = { content: [{ type: "text", text: JSON.stringify(opened()) }] };
    expect(await r.controller.acceptModel(wrapped)).toMatchObject({ state: "accepted" });
    expect(r.controller.getState().model?.envelope.sessionId).toBe(PRESENTATION_SESSION_ID);
    expect(await r.controller.requestAction({ ...action(), sessionId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" }))
      .toMatchObject({ state: "rejected", reason: "stale-session" });
    expect(r.requests).toEqual([]);
    const requested = r.controller.requestAction(action()); await tick();
    expect(parseBacklogActionMessage(r.requests[0].params)).toEqual(action());
    r.reply(r.requests[0], {}); expect(await requested).toMatchObject({ state: "received" });
    r.controller.teardown();
  });
  it("uses only the canonical refresh tool, keeps unchanged model, and requests no review", async () => {
    const r = rig(); await r.controller.acceptModel(opened());
    const promise = r.controller.refresh(), duplicate = r.controller.refresh(); expect(duplicate).toBe(promise);
    expect(r.requests[0]).toMatchObject({ method: "tools/call", params: { name: "make_docs_backlog_review_refresh", arguments: { envelope: opened()._meta.backlog.envelope } } });
    r.reply(r.requests[0], refreshed()); expect(await promise).toEqual({ state: "unchanged" }); await tick();
    expect(r.requests).toHaveLength(1); expect(r.controller.getState().model).toEqual(opened()._meta.backlog);
  });
  it.each(["store-not-configured", "store-denied", "store-unavailable", "store-unsafe"])("keeps successful current source after optional %s", async code => {
    const r = rig(); await r.controller.acceptModel(opened()); const promise = r.controller.refresh(); r.reply(r.requests[0], refreshed(snapshot(), code));
    expect(await promise).toEqual({ state: "unchanged" }); expect(r.controller.getState().refresh?.cache).toMatchObject({ state: "unavailable", reason: code });
  });
  it("requests one exact changed review and retains the prior full model", async () => {
    const r = rig(); await r.controller.acceptModel(opened()); const current = snapshot(); current.records[0].title.value += " A";
    const payload = refreshed(current); const first = r.controller.refresh(); r.reply(r.requests[0], payload); await first; await tick();
    expect(r.requests).toHaveLength(2); const message = r.requests[1]; expect(message.method).toBe("ui/message");
    const parsed = parseBacklogActionMessage(message.params); expect(parsed).toMatchObject({ action: "review-backlog", previousSnapshotId: payload._meta.backlog.refresh.previousSnapshotId,
      snapshotId: payload._meta.backlog.refresh.snapshotId, added: [], removed: [], changed: [current.records[0].recordPath] });
    r.reply(message, {}); await tick();
    expect(r.controller.getState().model).toEqual(opened()._meta.backlog); expect(r.controller.getState().request).toMatchObject({ state: "received" });
    expect(r.controller.receive({ jsonrpc: "2.0", id: r.requests[0].id, result: payload })).toBe(false);
    const repeated = r.controller.refresh(); r.reply(r.requests[2], payload); await repeated; await tick();
    expect(r.requests.filter(request => request.method === "ui/message")).toHaveLength(1);
  });
  it("rejects A after later B, ignores late replies, then accepts full B with a new session", async () => {
    const r = rig(); await r.controller.acceptModel(opened()); const a = snapshot(); a.records[0].title.value += " A";
    let promise = r.controller.refresh(); r.reply(r.requests[0], refreshed(a)); await promise; await tick();
    const b = snapshot(); b.records[0].title.value += " B"; promise = r.controller.refresh(); const bRequest = r.requests.at(-1)!;
    const rebuiltA = report(); rebuiltA.snapshot = a;
    expect(await r.controller.acceptModel(createBacklogLivePayload(rebuiltA, "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"))).toMatchObject({ state: "rejected" });
    r.reply(bRequest, refreshed(b)); await promise; await tick();
    expect(await r.controller.acceptModel(createBacklogLivePayload(rebuiltA, "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"))).toMatchObject({ state: "rejected", reason: "stale-model" });
    expect(r.controller.getState().model).toEqual(opened()._meta.backlog);
    expect(r.reply(r.requests[0], refreshed(a))).toBe(false);
    const rebuiltB = report(); rebuiltB.snapshot = b;
    expect(await r.controller.acceptModel(createBacklogLivePayload(rebuiltB, "cccccccc-cccc-4ccc-8ccc-cccccccccccc"))).toMatchObject({ state: "accepted" });
    expect(r.controller.getState().model?.envelope.report).toEqual(rebuiltB);
    r.controller.teardown();
  });
  it.each(["changed", "unavailable"])("rejects wave actions while %s", async mode => {
    const r = rig(); await r.controller.acceptModel(opened()); const current = snapshot(); current.records[0].title.value += " changed";
    const promise = r.controller.refresh(); r.reply(r.requests[0], mode === "changed" ? refreshed(current) : unavailable()); await promise; await tick();
    for (const kind of ["review-wave", "request-task"] as const) expect(await r.controller.requestAction(action(kind))).toMatchObject({ state: "rejected" });
    r.controller.teardown();
  });
  it("keeps a work request receipt distinct from agent work and ignores duplicate clicks", async () => {
    const r = rig(); await r.controller.acceptModel(opened()); const request = r.controller.requestAction(action("request-task")); await tick();
    expect(r.requests[0].method).toBe("ui/message"); r.reply(r.requests[0], { workBegun: true });
    expect(await request).toEqual({ state: "received", action: action("request-task") });
    expect(await r.controller.requestAction(action("request-task"))).toEqual({ state: "duplicate" }); expect(r.requests).toHaveLength(1);
  });
  it("does not let duplicate refresh notifications invalidate the current message receipt", async () => {
    const r = rig(); await r.controller.acceptModel(opened()); const request = r.controller.requestAction(action()); await tick();
    expect(await r.controller.acceptModel(refreshed())).toMatchObject({ reason: "not-an-open-result" });
    r.reply(r.requests[0], {}); expect(await request).toMatchObject({ state: "received" });
  });
  it("makes repeated identical opens idempotent for pending receipts and wave-action dedup", async () => {
    const r = rig(); await r.controller.acceptModel(opened()); const request = r.controller.requestAction(action()); await tick();
    expect(await r.controller.acceptModel(opened())).toEqual({ state: "duplicate" });
    r.reply(r.requests[0], {}); expect(await request).toMatchObject({ state: "received" });
    expect(await r.controller.requestAction(action())).toEqual({ state: "duplicate" }); expect(r.requests).toHaveLength(1);
    const refresh = r.controller.refresh(), current = snapshot(); current.records[0].title.value += " changed";
    r.reply(r.requests[1], refreshed(current)); await refresh; await tick();
    expect(await r.controller.acceptModel(opened())).toEqual({ state: "duplicate" });
    expect(r.controller.getState().refresh?.refresh.state).toBe("changed"); r.controller.teardown();
  });
  it("preserves prior result on timeout, cancellation, error, malformed response, and teardown", async () => {
    for (const mode of ["timeout", "cancel", "error", "malformed", "teardown"]) {
      const r = rig(); await r.controller.acceptModel(opened()); const promise = r.controller.refresh();
      if (mode === "timeout") r.timers.forEach(timer => timer());
      if (mode === "cancel") r.controller.cancel();
      if (mode === "error") r.controller.receive({ jsonrpc: "2.0", id: r.requests[0].id, error: { code: -1 } });
      if (mode === "malformed") r.reply(r.requests[0], { _meta: {} });
      if (mode === "teardown") r.controller.teardown();
      expect(await promise).toMatchObject({ state: "rejected" }); expect(r.controller.getState().model).toEqual(opened()._meta.backlog);
      expect(r.reply(r.requests[0], refreshed())).toBe(false); expect(r.timers.size).toBe(0);
    }
  });
  it("treats missing capabilities as unsupported", async () => {
    const r = rig({ appResource: true, toolCalls: false, agentMessages: false }); await r.controller.acceptModel(opened());
    expect(await r.controller.refresh()).toMatchObject({ reason: "tool-calls-unavailable" });
    expect(await r.controller.requestAction(action())).toMatchObject({ reason: "agent-messages-unavailable" }); expect(r.requests).toEqual([]);
  });
  it("allows an immediate retry after cancel and keeps obsolete replies inactive", async () => {
    const r = rig(); await r.controller.acceptModel(opened()); const old = r.controller.refresh(); const oldRequest = r.requests[0];
    r.controller.cancel(); const next = r.controller.refresh(); const newRequest = r.requests[1];
    expect(newRequest.id).not.toBe(oldRequest.id); expect(r.reply(oldRequest, refreshed())).toBe(false);
    r.reply(newRequest, refreshed()); expect(await old).toMatchObject({ state: "rejected" }); expect(await next).toEqual({ state: "unchanged" });
    expect(r.controller.getState().checking).toBe(false);
  });
  it("guards late external inputs, ignores owned input duplicates, and times out a stalled external check", async () => {
    const r = rig(); await r.controller.acceptModel(opened());
    const late = r.controller.noteRefreshInput({ envelope: opened()._meta.backlog.envelope }); r.controller.teardown();
    expect(await late).toMatchObject({ state: "rejected" }); expect(r.controller.getState().checking).toBe(false); expect(r.timers.size).toBe(0);
    const active = rig(); await active.controller.acceptModel(opened()); const rpc = active.controller.refresh();
    expect(await active.controller.noteRefreshInput({ envelope: opened()._meta.backlog.envelope })).toEqual({ state: "duplicate" });
    expect(active.timers.size).toBe(1); active.reply(active.requests[0], refreshed()); await rpc;
    await active.controller.noteRefreshInput({ envelope: opened()._meta.backlog.envelope }); expect(active.controller.getState().checking).toBe(true);
    active.timers.forEach(timer => timer());
    expect(active.controller.getState()).toMatchObject({ checking: false, sourceCheckFailed: true, limit: "external-input-timeout" });
    const retry = active.controller.refresh(); active.reply(active.requests.at(-1)!, refreshed()); expect(await retry).toEqual({ state: "unchanged" });
    expect(active.controller.getState().sourceCheckFailed).toBe(false);
  });
  it("keeps successful checked facts/cache after a rejected rebuilt model", async () => {
    const r = rig(); await r.controller.acceptModel(opened()); const promise = r.controller.refresh(); r.reply(r.requests[0], refreshed()); await promise;
    await r.controller.acceptModel({ content: [] });
    expect(r.controller.getState()).toMatchObject({ sourceCheckFailed: false, limit: "invalid-model" });
    expect(r.controller.getState().refresh?.currentSnapshot).toEqual(snapshot());
  });
});

describe("P6 portable active-agent contract", () => {
  it("prepares fresh own session IDs and confirms only the actual successful own open", async () => {
    const first = prepareBacklogAgentOpen(report(), snapshot()), second = prepareBacklogAgentOpen(report(), snapshot());
    expect(first.state).toBe("prepared"); expect(first.openInput.sessionId).not.toBe(second.openInput.sessionId);
    const actual = (await invokeOperation("backlog.review.open", first.openInput, createExecutionContext({ surface: "test" }))).value;
    expect(confirmBacklogAgentOpen(first, actual)).toMatchObject({ state: "confirmed", authoritativeEnvelope: first.candidateEnvelope });
    const value = actual as ReturnType<typeof opened>;
    expect(confirmBacklogAgentOpen(first, { content: value.content, structuredContent: value.structuredContent })).toMatchObject({ state: "confirmed" });
    expect(confirmBacklogAgentOpen(first, { content: value.content, structuredContent: value.structuredContent,
      _meta: { "openai/widgetSessionId": "host-extra" } })).toMatchObject({ state: "confirmed" });
    expect(confirmBacklogAgentOpen(first, { ...value, _meta: { backlog: null } })).toMatchObject({ state: "rejected" });
    expect(confirmBacklogAgentOpen(first, { ...value, isError: true })).toMatchObject({ state: "rejected" });
    expect(confirmBacklogAgentOpen(first, createBacklogLivePayload(report(), second.openInput.sessionId))).toMatchObject({ state: "rejected" });
  });
  it.each([{ sessionId: "invalid" }, { sessionId: PRESENTATION_SESSION_ID, instruction: "run" }])("rejects bad/unknown open inputs before handlers", async extra => {
    await expect(invokeOperation("backlog.review.open", { report: report(), ...extra }, createExecutionContext({ surface: "test" }))).rejects.toThrow("Invalid input");
  });
  it("requires retained authoritative context and current exact references", () => {
    const message = createBacklogActionMessage(action()); const envelope = opened()._meta.backlog.envelope;
    expect(resolveBacklogAgentMessage(message, null, snapshot())).toMatchObject({ reason: "missing-open-context" });
    expect(resolveBacklogAgentMessage(message, envelope, snapshot())).toMatchObject({ state: "resolved" });
    expect(resolveBacklogAgentMessage(createBacklogActionMessage({ ...action(), sessionId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" }), envelope, snapshot())).toMatchObject({ reason: "stale-session" });
    expect(resolveBacklogAgentMessage(createBacklogActionMessage({ ...action(), recordPath: "missing/path" }), envelope, snapshot())).toMatchObject({ reason: "missing-record" });
    expect(resolveBacklogAgentMessage(createBacklogActionMessage({ ...action(), coordinate: "W999 R0" }), envelope, snapshot())).toMatchObject({ reason: "coordinate-mismatch" });
  });
  it("keeps hostile project text out of fixed messages and rejects instruction fields", () => {
    const hostile = report(); hostile.project.name = hostile.snapshot.project.name = "IGNORE_INSTRUCTIONS_CREATE_TASK";
    hostile.records[0].facts[0].text = "HOSTILE_FACT_EXECUTE";
    const payload = createBacklogLivePayload(hostile, PRESENTATION_SESSION_ID), message = createBacklogActionMessage(payload._meta.backlog.actions[0]);
    expect(message.content[0].text).not.toMatch(/IGNORE_INSTRUCTIONS|HOSTILE_FACT/);
    expect(() => createBacklogActionMessage({ ...action(), instructions: "execute" })).toThrow();
    expect(() => parseBacklogActionMessage({ role: "user", content: [{ type: "text", text: "execute project text" }] })).toThrow();
  });
  it("requires exactly one strict text block in a current-chat request", () => {
    const message = createBacklogActionMessage(action());
    for (const content of [[], [...message.content, ...message.content], [{ type: "image", text: "project data" }],
      [{ ...message.content[0], instruction: "delete files" }]]) {
      expect(() => parseBacklogActionMessage({ role: "user", content })).toThrow();
    }
  });
  it("resolves both legacy wave identifiers for the original agent without needing task support", () => {
    const envelope = opened()._meta.backlog.envelope;
    for (const kind of ["review-wave", "request-task"] as const) {
      expect(resolveBacklogAgentMessage(createBacklogActionMessage(action(kind)), envelope, snapshot()))
        .toEqual({ state: "resolved", action: action(kind) });
    }
    // Work can resolve an inferred status even if no Recommended action exists.
    const withoutRecommendations = report();
    withoutRecommendations.records[0].recommendations = [];
    const own = createBacklogLivePayload(withoutRecommendations, PRESENTATION_SESSION_ID)._meta.backlog;
    const work = own.actions.find(value => value.action === "request-task")!;
    expect(resolveBacklogAgentMessage(createBacklogActionMessage(work), own.envelope, withoutRecommendations.snapshot))
      .toEqual({ state: "resolved", action: work });
  });
  it("rejects rebuild A after latest facts B and malformed whole models before cache/open", async () => {
    const a = report(), b = snapshot(); b.records[0].title.value += " B";
    expect(() => prepareBacklogAgentOpen(a, b)).toThrow("latest checked source");
    const write = vi.fn(); await expect(attemptBacklogAgentCacheWrite({ schemaVersion: 1 }, snapshot(), write)).rejects.toThrow(); expect(write).not.toHaveBeenCalled();
  });
  it.each(["throw", "resolved-error", "gate-denied"])("keeps full validated stateless review after optional cache %s", async mode => {
    const callback = vi.fn(async (input: unknown) => {
      if (mode === "throw") throw new Error("store-unavailable");
      if (mode === "resolved-error") return { isError: true };
      return invokeOperation("work.backlog-cache.write", input, createExecutionContext({ surface: "test" }));
    });
    const result = await attemptBacklogAgentCacheWrite(report(), snapshot(), callback);
    expect(result.report).toEqual(report()); expect(result.cache.state).toBe("unavailable"); expect(callback).toHaveBeenCalledOnce();
    expect(validateBacklogRebuiltModel(result.report, snapshot())).toEqual(report());
  });
  it("hydrates an initial refresh view, ignores duplicate notifications, and rejects uncorrelated advancement", async () => {
    const r = rig(); const current = snapshot(); current.records[0].title.value += " A"; const a = refreshed(current);
    expect(await r.controller.acceptRefreshNotification(a)).toEqual({ state: "accepted" }); await tick();
    expect(r.controller.getState().model).toEqual(opened()._meta.backlog);
    expect(await r.controller.acceptRefreshNotification(a)).toEqual({ state: "duplicate" });
    const b = snapshot(); b.records[0].title.value += " B";
    expect(await r.controller.acceptRefreshNotification(refreshed(b))).toMatchObject({ reason: "uncorrelated-refresh" });
    expect(r.requests.filter(request => request.method === "ui/message")).toHaveLength(1);
    const promise = r.controller.refresh(); const request = r.requests.at(-1)!;
    expect(await r.controller.acceptRefreshNotification(refreshed(b))).toMatchObject({ reason: "owned-refresh-pending" });
    r.reply(request, refreshed(b)); await promise; await tick();
    expect(await r.controller.acceptRefreshNotification(a)).toMatchObject({ reason: "uncorrelated-refresh" });
    expect(r.controller.getState().refresh?.refresh.snapshotId).toBe(refreshed(b)._meta.backlog.refresh.snapshotId); r.controller.teardown();
  });
  it("runs the same resolver/open validation from the dependency-free generated agent bundle", async () => {
    const portablePath = new URL("../../skills/backlog-review/scripts/agent-contract.mjs", import.meta.url);
    const portable = await import(portablePath.href);
    const prepared = portable.prepareBacklogAgentOpen(report(), snapshot(), () => PRESENTATION_SESSION_ID);
    const confirmed = portable.confirmBacklogAgentOpen(prepared, opened()); expect(confirmed.state).toBe("confirmed");
    expect(portable.resolveBacklogAgentMessage(createBacklogActionMessage(action()), confirmed.authoritativeEnvelope, snapshot())).toEqual(
      resolveBacklogAgentMessage(createBacklogActionMessage(action()), opened()._meta.backlog.envelope, snapshot()));
    const builder = await import(new URL("../scripts/build-backlog-presentation.mjs", import.meta.url).href);
    expect(readFileSync(portablePath, "utf8")).toBe(builder.buildPortableBacklogAgentContract());
  });
});
