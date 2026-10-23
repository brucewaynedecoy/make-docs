import { reportMarkup, mountStaticReport } from "./static-renderer.js";
import { decodeWidgetToolResult, renderWidgetStatus } from "./state.js";
import { captureLocalState, restoreLocalState } from "./local-state.js";
import { createBacklogRequestController, type ControllerState } from "./request-controller.js";
import { createBacklogLiveView } from "./live-view.js";
import { backlogCapabilitiesFromInitialize } from "./host-capabilities.js";
import type { BacklogHostCapabilities } from "../../operations/work/backlog/live-contracts.js";
import { readBacklogContainerBounds, backlogContainerHeight, constrainBacklogHeight, type BacklogContainerBounds } from "./container-size.js";
import { createWidgetDiagnostics, widgetErrorFacts, widgetResultFacts, widgetProtocolVersion, type WidgetDiagnosticEvent } from "./diagnostics.js";

const diagnostics = createWidgetDiagnostics();
function trace(event: WidgetDiagnosticEvent) {
  diagnostics.record(event);
  document.documentElement.dataset.backlogTrace = JSON.stringify(diagnostics.snapshot());
}
trace({ event: "script-start", facts: { framed: window.parent !== window, webCrypto: !!globalThis.crypto?.subtle,
  decompression: typeof DecompressionStream === "function" } });
const status = document.getElementById("widgetStatus")!;
const root = document.getElementById("widgetReport")!;
const empty = document.getElementById("widgetEmpty")!;
let bridge: "connecting" | "ready" | "unavailable" = window.parent === window ? "unavailable" : "connecting";
let capabilities: BacklogHostCapabilities = {};
let containerBounds: BacklogContainerBounds | null = null;
let viewState: ControllerState = { model: null, refresh: null, checking: false, sourceCheckFailed: false, request: null, limit: null, closed: false };
let renderedKey = "";
let dispose: (() => void) | null = null;
let view: ReturnType<typeof createBacklogLiveView> | null = null;
let closed = false;
let invalid = false;
let resultArrival = 0;
const object = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value);
function send(method: string, params: unknown, id?: number) {
  window.parent.postMessage({ jsonrpc: "2.0", ...(id === undefined ? {} : { id }), method, params }, "*");
}
const controller = createBacklogRequestController({ send: request => window.parent.postMessage(request, "*"), onChange: render,
  onDiagnostic: trace });
function render(state: ControllerState) {
  if (closed) return;
  if (state.checking || state.limit === null && state.refresh !== viewState.refresh) invalid = false;
  viewState = state;
  const model = state.model;
  if (model) {
    const envelope = model.envelope;
    const key = JSON.stringify([envelope.sessionId, envelope.modelId, envelope.snapshotId, envelope.report.generatedAt, envelope.report.snapshot.generatedAt]);
    if (key !== renderedKey) {
      trace({ event: "render-start", facts: { records: envelope.report.records.length } });
      const local = renderedKey ? captureLocalState(root) : null;
      view?.dispose(); dispose?.();
      const template = document.createElement("template"); template.innerHTML = reportMarkup; // Trusted fixed report markup only.
      root.replaceChildren(template.content.cloneNode(true));
      view = createBacklogLiveView(root, () => viewState, () => capabilities, controller,
        { viewportHeight: () => backlogContainerHeight(containerBounds, window.innerHeight), changed: resize });
      dispose = mountStaticReport(envelope.report, model.display, root, view.hooks);
      root.querySelector("footer")!.replaceChildren(status); view.installToolbar();
      renderedKey = key; root.hidden = false; empty.hidden = true;
      if (local) restoreLocalState(root, local);
      trace({ event: "render-passed", facts: { records: envelope.report.records.length } });
    }
    view?.update();
  }
  renderStatus();
}
function renderStatus() {
  const result = viewState.refresh?.refresh;
  const failed = invalid || viewState.limit !== null && result?.state !== "unavailable";
  status.dataset.state = !viewState.model ? "no-report" : bridge === "unavailable" ? "limited" : viewState.checking ? "checking"
    : failed ? "limited" : result?.reviewState ?? "current";
  renderWidgetStatus(status, { hasReport: viewState.model !== null, invalid: failed, bridge, checking: viewState.checking, refresh: result?.state ?? null });
}
async function receiveResult(input: unknown) {
  const arrival = ++resultArrival;
  trace({ event: "tool-result-received", facts: widgetResultFacts(input) });
  try {
    const decoded = await decodeWidgetToolResult(input, facts => trace({ event: "tool-result-decompressed", facts }));
    if (decoded !== input) trace({ event: "tool-result-decoded", facts: widgetResultFacts(decoded) });
    input = decoded;
  } catch (error) { trace({ event: "tool-result-decode-failed", facts: widgetErrorFacts(error) }); }
  if (closed || arrival !== resultArrival) {
    trace({ event: "tool-result-outcome", facts: { state: "rejected", reason: closed ? "closed" : "superseded-model" } });
    return;
  }
  let result;
  if (object(input) && object(input._meta) && object(input._meta.backlog) && "refresh" in input._meta.backlog) result = await controller.acceptRefreshNotification(input);
  else result = await controller.acceptModel(input);
  if (closed) return;
  trace({ event: "tool-result-outcome", facts: { state: result.state, ...(result.state === "rejected" ? { reason: result.reason } : {}) } });
  if (result.state === "accepted" || result.state === "duplicate") invalid = false;
  else if (result.state === "rejected" && !["owned-refresh-pending", "uncorrelated-refresh", "stale-refresh", "superseded-model"].includes(result.reason)) invalid = true;
  renderStatus();
}
const timer = bridge === "connecting" ? setTimeout(() => { trace({ event: "initialize-timeout" }); bridge = "unavailable"; capabilities = {}; controller.setCapabilities(capabilities); view?.update(); renderStatus(); }, 5000) : null;
let lastSize = "";
function resize() {
  if (bridge !== "ready" || closed) return;
  const modal = root.querySelector<HTMLDialogElement>("#dataDialog");
  const modalHeight = modal?.open ? Math.ceil(modal.getBoundingClientRect().bottom + 12) : 0;
  const height = constrainBacklogHeight(Math.max(1, Math.ceil(document.body.getBoundingClientRect().bottom + window.scrollY), modalHeight), containerBounds);
  const width = Math.ceil(document.documentElement.clientWidth), size = `${width}:${height}`;
  if (size !== lastSize) { lastSize = size; send("ui/notifications/size-changed", { height, width }); }
}
function applyHostContext(context: unknown) {
  if (!object(context) || !("containerDimensions" in context)) return;
  containerBounds = readBacklogContainerBounds(context);
  window.dispatchEvent(new Event("resize")); resize();
}
const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(resize); observer?.observe(document.body);
function receive(event: MessageEvent) {
  if (closed || event.source !== window.parent || !object(event.data) || event.data.jsonrpc !== "2.0") return;
  const message = event.data;
  if (controller.receive(message)) return;
  if (message.method === "ui/notifications/host-context-changed" && bridge === "ready") { applyHostContext(message.params); return; }
  if (message.method === "ui/notifications/tool-result") { void receiveResult(message.params); return; }
  if (message.method === "ui/notifications/tool-input" && object(message.params)) {
    void controller.noteRefreshInput(message.params.arguments).then(result => { if (result.state === "accepted") { invalid = false; renderStatus(); } }); return;
  }
  if (message.id === 1 && !("method" in message)) {
    trace({ event: "initialize-result", facts: { error: !!message.error,
      protocolVersion: widgetProtocolVersion(object(message.result) ? message.result.protocolVersion : undefined),
      supportedVersion: object(message.result) && message.result.protocolVersion === "2026-01-26" } });
    if (timer !== null) clearTimeout(timer);
    if (!message.error && object(message.result) && message.result.protocolVersion === "2026-01-26") {
      bridge = "ready";
      applyHostContext(message.result.hostContext);
      capabilities = backlogCapabilitiesFromInitialize(message.result);
      controller.setCapabilities(capabilities); send("ui/notifications/initialized", {}); resize();
    } else { bridge = "unavailable"; capabilities = {}; controller.setCapabilities(capabilities); }
    view?.update(); renderStatus();
  } else if (message.method === "ui/notifications/tool-cancelled") {
    controller.cancel(); invalid = true; renderStatus();
  } else if (message.method === "ui/resource-teardown" && (typeof message.id === "number" || typeof message.id === "string")) {
    window.parent.postMessage({ jsonrpc: "2.0", id: message.id, result: {} }, "*");
    closed = true; controller.teardown(); view?.dispose(); dispose?.(); observer?.disconnect();
    if (timer !== null) clearTimeout(timer); window.removeEventListener("message", receive); window.removeEventListener("resize", resize);
  } else if ("id" in message && typeof message.method === "string") {
    window.parent.postMessage({ jsonrpc: "2.0", id: message.id, error: { code: -32601, message: "Unsupported widget method." } }, "*");
  }
}
window.addEventListener("message", receive); window.addEventListener("resize", resize); renderStatus();
if (bridge === "connecting") {
  trace({ event: "initialize-sent" });
  send("ui/initialize", { protocolVersion: "2026-01-26", appInfo: { name: "Make Docs Backlog Review", version: "1.0.0" }, appCapabilities: {} }, 1);
}
