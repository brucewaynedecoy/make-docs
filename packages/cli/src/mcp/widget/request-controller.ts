import { BacklogHostCapabilitiesSchema, BacklogLiveActionSchema, resolveBacklogLiveAction,
  type BacklogHostCapabilities, type BacklogLiveAction } from "../../operations/work/backlog/live-contracts.js";
import { createBacklogActionMessage, type BacklogActionMessageSchema } from "../../operations/work/backlog/agent-contracts.js";
import { BacklogReviewRefreshPayloadV1Schema, backlogReviewRefreshInputSchema, type BacklogReviewRefreshPayloadV1 } from "../../operations/work/backlog/review-contracts.js";
import { validateWidgetResult, type WidgetResult } from "./state.js";
import { createBacklogLivePayload } from "../../operations/work/backlog/presentation.js";
import { withBrowserHashes } from "./browser-crypto.js";
import type { z } from "zod";

type ClientModel = WidgetResult["client"];
type RefreshData = BacklogReviewRefreshPayloadV1["_meta"]["backlog"];
export type BacklogControllerRequest = { jsonrpc: "2.0"; id: string } & (
  { method: "tools/call"; params: { name: "make_docs_backlog_review_refresh"; arguments: { envelope: ClientModel["envelope"] } } }
  | { method: "ui/message"; params: z.infer<typeof BacklogActionMessageSchema> });
export type RequestOutcome = { state: "received"; action: BacklogLiveAction; taskCreation: "unconfirmed" }
  | { state: "duplicate" } | { state: "rejected"; reason: string };
export interface ControllerState {
  model: ClientModel | null;
  refresh: RefreshData | null;
  checking: boolean;
  sourceCheckFailed: boolean;
  request: RequestOutcome | null;
  limit: string | null;
  closed: boolean;
}
export interface BacklogControllerOptions {
  send(request: BacklogControllerRequest): void;
  capabilities?: BacklogHostCapabilities;
  timeoutMs?: number;
  timers?: { set(callback: () => void, ms: number): unknown; clear(token: unknown): void };
  onChange?(state: ControllerState): void;
}

const object = (input: unknown): input is Record<string, unknown> => input !== null && typeof input === "object" && !Array.isArray(input);
/** Dormant transport/controller seam. No listener, DOM mutation, file, or request exists until a caller invokes it. */
export function createBacklogRequestController(options: BacklogControllerOptions) {
  const state: ControllerState = { model: null, refresh: null, checking: false, sourceCheckFailed: false, request: null, limit: null, closed: false };
  let capabilities = BacklogHostCapabilitiesSchema.parse(options.capabilities ?? {});
  const timers = options.timers ?? { set: (callback: () => void, ms: number) => globalThis.setTimeout(callback, ms),
    clear: (token: unknown) => globalThis.clearTimeout(token as ReturnType<typeof globalThis.setTimeout>) };
  const pending = new Map<string, { resolve(value: unknown): void; reject(reason: Error): void; timer: unknown }>();
  const sent = new Set<string>();
  let serial = 0, sourceEpoch = 0, modelEpoch = 0, modelArrival = 0;
  let refreshFlight: Promise<{ state: "unchanged" | "changed" | "unavailable" } | { state: "rejected"; reason: string }> | null = null;
  let latestSnapshotId: string | null = null;
  let externalInputTimer: unknown = null, inputEpoch = 0;
  const getState = () => structuredClone(state);
  const changed = () => options.onChange?.(getState());
  const reject = (reason: string) => ({ state: "rejected" as const, reason });
  function clearExternalInput() { inputEpoch += 1; if (externalInputTimer !== null) timers.clear(externalInputTimer); externalInputTimer = null; }
  async function parseRefresh(raw: unknown) {
    if (!object(raw) || raw.isError === true || !object(raw._meta)) throw new Error("invalid-refresh");
    return withBrowserHashes(() => BacklogReviewRefreshPayloadV1Schema.parse({ content: raw.content,
      structuredContent: raw.structuredContent, _meta: { backlog: (raw._meta as Record<string, unknown>).backlog } }));
  }
  function requestChangedReview(data: RefreshData) {
    if (data.refresh.state !== "changed") return;
    const envelope = data.envelope;
    const action = BacklogLiveActionSchema.parse({ schemaVersion: 1, action: "review-backlog", sessionId: envelope.sessionId,
      modelId: envelope.modelId, projectKey: envelope.projectKey, previousSnapshotId: data.refresh.previousSnapshotId,
      snapshotId: data.refresh.snapshotId, added: data.refresh.added, changed: data.refresh.changed, removed: data.refresh.removed });
    void requestAction(action);
  }
  function rpc(payload: Omit<BacklogControllerRequest, "jsonrpc" | "id">): Promise<unknown> {
    return new Promise((resolve, fail) => {
      const id = `make-docs/backlog/${++serial}`;
      const timer = timers.set(() => { pending.delete(id); timers.clear(timer); fail(new Error("request-timeout")); }, options.timeoutMs ?? 30000);
      pending.set(id, { resolve, reject: fail, timer });
      try { options.send({ jsonrpc: "2.0", id, ...payload } as BacklogControllerRequest); }
      catch { pending.delete(id); timers.clear(timer); fail(new Error("transport-failed")); }
    });
  }
  function receive(input: unknown): boolean {
    if (state.closed || !object(input) || input.jsonrpc !== "2.0" || typeof input.id !== "string") return false;
    const request = pending.get(input.id);
    if (!request) return false;
    pending.delete(input.id); timers.clear(request.timer);
    if ("error" in input) request.reject(new Error("host-request-failed"));
    else if ("result" in input) request.resolve(input.result);
    else request.reject(new Error("invalid-reply"));
    return true;
  }
  async function acceptModel(input: unknown) {
    if (state.closed) return reject("closed");
    const arrival = ++modelArrival;
    try {
      const model = await validateWidgetResult(input);
      if (state.closed || arrival !== modelArrival) return reject("superseded-model");
      if (model.kind !== "open") return reject("not-an-open-result");
      if (state.model && JSON.stringify(model.client.envelope) === JSON.stringify(state.model.envelope)) {
        return { state: "duplicate" as const };
      }
      if (state.model && (state.checking || latestSnapshotId === null || model.client.envelope.projectKey !== state.model.envelope.projectKey
        || model.client.envelope.snapshotId !== latestSnapshotId)) return reject("stale-model");
      state.model = model.client; state.refresh = null; state.limit = null; state.request = null; state.sourceCheckFailed = false;
      clearExternalInput();
      latestSnapshotId = model.client.envelope.snapshotId;
      sourceEpoch += 1; modelEpoch += 1; sent.clear(); changed();
      return { state: "accepted" as const, model: structuredClone(model.client) };
    } catch {
      if (!state.closed && arrival === modelArrival) { state.limit = "invalid-model"; changed(); }
      return reject(state.closed ? "closed" : arrival !== modelArrival ? "superseded-model" : "invalid-model");
    }
  }
  async function requestAction(input: unknown): Promise<RequestOutcome> {
    if (state.closed || !state.model) return reject(state.closed ? "closed" : "no-model");
    if (capabilities.agentMessages !== true) return reject("agent-messages-unavailable");
    const envelope = structuredClone(state.model.envelope);
    const snapshot = structuredClone(state.refresh?.currentSnapshot ?? state.model.envelope.report.snapshot);
    const epoch = modelEpoch, factsEpoch = sourceEpoch;
    let resolution;
    try { resolution = await withBrowserHashes(() => resolveBacklogLiveAction(input, envelope, snapshot)); }
    catch { return reject("invalid-action-context"); }
    if (state.closed || epoch !== modelEpoch || factsEpoch !== sourceEpoch) return reject("stale-action");
    if (resolution.state !== "resolved") return reject(resolution.reason);
    const action = resolution.action;
    if (action.action !== "review-backlog" && (state.checking || state.refresh?.refresh.reviewState === "needs-review"
      || state.refresh?.refresh.reviewState === "last-known" || state.limit !== null)) return reject("current-source-check-required");
    const key = JSON.stringify(action);
    if (sent.has(key)) return { state: "duplicate" };
    sent.add(key);
    try {
      await rpc({ method: "ui/message", params: createBacklogActionMessage(action) });
      if (state.closed || epoch !== modelEpoch || factsEpoch !== sourceEpoch) return reject("stale-reply");
      const outcome: RequestOutcome = { state: "received", action, taskCreation: "unconfirmed" };
      state.request = outcome; changed(); return outcome;
    } catch (error) {
      const outcome = reject(error instanceof Error ? error.message : "request-unconfirmed");
      if (!state.closed && epoch === modelEpoch && factsEpoch === sourceEpoch) { state.request = outcome; changed(); }
      return outcome;
    }
  }
  /** Uncorrelated host notifications cannot advance or overwrite a previously checked snapshot. */
  async function acceptRefreshNotification(input: unknown) {
    if (state.closed) return reject("closed");
    const epoch = sourceEpoch;
    try {
      const data = (await parseRefresh(input))._meta.backlog;
      if (state.closed || refreshFlight || epoch !== sourceEpoch) return reject("owned-refresh-pending");
      if (state.model && ["sessionId", "modelId", "projectKey", "snapshotId"].some(key =>
        data.envelope[key as keyof typeof data.envelope] !== state.model!.envelope[key as keyof typeof data.envelope])) return reject("stale-refresh");
      clearExternalInput();
      if (state.refresh) {
        state.checking = false; changed();
        return JSON.stringify(data) === JSON.stringify(state.refresh) ? { state: "duplicate" as const } : reject("uncorrelated-refresh");
      }
      if (!state.model) {
        const model = await withBrowserHashes(() => createBacklogLivePayload(data.envelope.report, data.envelope.sessionId)._meta.backlog);
        if (state.closed || epoch !== sourceEpoch) return reject("stale-refresh");
        state.model = model; modelEpoch += 1;
      }
      state.refresh = data; state.checking = false; state.sourceCheckFailed = false; latestSnapshotId = data.refresh.state === "unavailable" ? null : data.refresh.snapshotId;
      state.limit = data.refresh.state === "unavailable" ? data.refresh.reason : null; sourceEpoch += 1; changed();
      requestChangedReview(data); return { state: "accepted" as const };
    } catch { return reject("invalid-refresh"); }
  }
  async function noteRefreshInput(input: unknown) {
    if (state.closed || !state.model) return reject("no-model");
    if (refreshFlight) return { state: "duplicate" as const };
    const factsEpoch = sourceEpoch, contextEpoch = modelEpoch, arrival = ++inputEpoch;
    try {
      const parsed = await withBrowserHashes(() => backlogReviewRefreshInputSchema.parse(input));
      if (state.closed || !state.model || factsEpoch !== sourceEpoch || contextEpoch !== modelEpoch || arrival !== inputEpoch || refreshFlight) return reject("stale-refresh-input");
      if (["sessionId", "modelId", "projectKey", "snapshotId"].some(key =>
        parsed.envelope[key as keyof typeof parsed.envelope] !== state.model!.envelope[key as keyof typeof parsed.envelope])) return reject("stale-refresh");
      if (externalInputTimer !== null) timers.clear(externalInputTimer);
      externalInputTimer = timers.set(() => {
        clearExternalInput(); state.checking = false; state.sourceCheckFailed = true; state.limit = "external-input-timeout"; latestSnapshotId = null; changed();
      }, options.timeoutMs ?? 30000);
      state.checking = true; changed(); return { state: "accepted" as const };
    } catch { return reject("invalid-refresh-input"); }
  }
  function refresh() {
    if (refreshFlight) return refreshFlight;
    if (state.closed || !state.model || capabilities.toolCalls !== true) return Promise.resolve(reject(state.closed ? "closed"
      : !state.model ? "no-model" : "tool-calls-unavailable"));
    const envelope = structuredClone(state.model.envelope), epoch = ++sourceEpoch;
    clearExternalInput();
    state.checking = true; state.limit = null; state.sourceCheckFailed = false; changed();
    const run = async () => {
      try {
        const raw = await rpc({ method: "tools/call", params: { name: "make_docs_backlog_review_refresh", arguments: { envelope } } });
        const parsed = await parseRefresh(raw);
        if (state.closed || epoch !== sourceEpoch || !state.model) return reject("stale-refresh");
        const data = parsed._meta.backlog;
        if (["sessionId", "modelId", "projectKey", "snapshotId"].some(key => data.envelope[key as keyof typeof envelope] !== envelope[key as keyof typeof envelope])) throw new Error("stale-refresh");
        state.refresh = data; state.checking = false; state.sourceCheckFailed = false;
        latestSnapshotId = data.refresh.state === "unavailable" ? null : data.refresh.snapshotId;
        state.limit = data.refresh.state === "unavailable" ? data.refresh.reason : null;
        changed();
        requestChangedReview(data);
        return { state: data.refresh.state };
      } catch (error) {
        const result = reject(error instanceof Error ? error.message : "refresh-failed");
        if (!state.closed && epoch === sourceEpoch) { state.checking = false; state.sourceCheckFailed = true; state.limit = result.reason; latestSnapshotId = null; changed(); }
        return result;
      }
    };
    const flight = run(); refreshFlight = flight;
    void flight.then(() => { if (refreshFlight === flight) refreshFlight = null; });
    return flight;
  }
  function cancel(reason = "cancelled") {
    if (state.checking) state.sourceCheckFailed = true;
    clearExternalInput();
    sourceEpoch += 1; modelEpoch += 1; modelArrival += 1;
    for (const request of pending.values()) { timers.clear(request.timer); request.reject(new Error(reason)); }
    pending.clear(); refreshFlight = null; state.checking = false; state.limit = reason; latestSnapshotId = null; changed();
  }
  function teardown() { if (state.closed) return; state.closed = true; cancel("closed"); }
  return { getState, acceptModel, acceptRefreshNotification, noteRefreshInput, refresh, requestAction, receive, cancel, teardown,
    setCapabilities(input: unknown) { capabilities = BacklogHostCapabilitiesSchema.parse(input); } };
}
