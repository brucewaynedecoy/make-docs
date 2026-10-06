import { reportMarkup, mountStaticReport } from "./static-renderer.js";
import { validateWidgetResult, validateRefreshInput, isRefreshForCurrent, renderWidgetStatus, type WidgetResult } from "./state.js";
import { captureLocalState, restoreLocalState } from "./local-state.js";

const status = document.getElementById("widgetStatus")!;
const root = document.getElementById("widgetReport")!;
const empty = document.getElementById("widgetEmpty")!;
let bridge: "connecting" | "ready" | "unavailable" = window.parent === window ? "unavailable" : "connecting";
let current: WidgetResult | null = null;
let latest = 0;
let dispose: (() => void) | null = null;
let closed = false;
let invalid = false;
let feedbackState: "idle" | "refreshing" = "idle";
const object = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value);

function renderStatus() {
  const state = current?.refresh;
  status.dataset.state = !current ? "no-report" : bridge === "unavailable" ? "limited"
    : feedbackState === "refreshing" ? "checking" : invalid ? "limited" : state?.reviewState ?? "current";
  renderWidgetStatus(status, { hasReport: current !== null, invalid, bridge,
    checking: feedbackState === "refreshing", refresh: state?.state ?? null });
}

async function receiveResult(input: unknown) {
  const sequence = ++latest;
  try {
    const result = await validateWidgetResult(input);
    if (closed || sequence !== latest) return;
    if (!isRefreshForCurrent(result, current)) throw new Error("Stale refresh");
    const sameReport = current && result.client.envelope.sessionId === current.client.envelope.sessionId
      && result.client.envelope.modelId === current.client.envelope.modelId
      && JSON.stringify(result.client.envelope.report) === JSON.stringify(current.client.envelope.report);
    if (!sameReport) {
      const state = current ? captureLocalState(root) : null;
      dispose?.();
      const template = document.createElement("template");
      template.innerHTML = reportMarkup; // Fixed build-time markup. Project text enters only through the shared text renderer.
      root.replaceChildren(template.content.cloneNode(true));
      dispose = mountStaticReport(result.client.envelope.report, result.client.display, root);
      // The accepted static report keeps its project footer. Only this live view
      // replaces that link with the one permanent status paragraph.
      root.querySelector("footer")!.replaceChildren(status);
      if (state) restoreLocalState(root, state);
    }
    current = result;
    invalid = false;
    root.hidden = false; empty.hidden = true;
  } catch {
    if (closed || sequence !== latest) return;
    invalid = true;
  }
  feedbackState = "idle";
  renderStatus();
}

function send(method: string, params: unknown, id?: number) {
  window.parent.postMessage({ jsonrpc: "2.0", ...(id === undefined ? {} : { id }), method, params }, "*");
}
const timer = bridge === "connecting" ? setTimeout(() => { bridge = "unavailable"; renderStatus(); }, 5000) : null;
let lastSize = "";
const resize = () => {
  if (bridge !== "ready" || closed) return;
  // A host may set the frame to the previous height. The root scroll height then
  // includes that viewport floor and cannot shrink. Measure our content instead.
  const height = Math.max(1, Math.ceil(document.body.getBoundingClientRect().bottom + window.scrollY));
  const width = Math.ceil(document.documentElement.clientWidth);
  const size = `${width}:${height}`;
  if (size !== lastSize) { lastSize = size; send("ui/notifications/size-changed", { height, width }); }
};
const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(resize);
observer?.observe(document.body);
function receive(event: MessageEvent) {
  if (closed || event.source !== window.parent || !object(event.data) || event.data.jsonrpc !== "2.0") return;
  const message = event.data;
  if (message.method === "ui/notifications/tool-result") { void receiveResult(message.params); return; }
  if (message.method === "ui/notifications/tool-input" && object(message.params)) {
    const sequence = ++latest;
    void validateRefreshInput(message.params.arguments).then(({ envelope }) => {
      if (closed || sequence !== latest || !current) return;
      if (["sessionId", "modelId", "projectKey", "snapshotId"].every(key => envelope[key as keyof typeof envelope] === current!.client.envelope[key as keyof typeof envelope])) {
        feedbackState = "refreshing"; renderStatus();
      }
    }).catch(() => {});
    return;
  }
  if (message.id === 1 && !("method" in message)) {
    if (timer !== null) clearTimeout(timer);
    if (!message.error && object(message.result) && message.result.protocolVersion === "2026-01-26") {
      bridge = "ready"; send("ui/notifications/initialized", {}); resize();
    } else bridge = "unavailable";
    renderStatus();
  } else if (message.method === "ui/notifications/tool-cancelled") {
    latest += 1; invalid = true; feedbackState = "idle"; renderStatus();
  } else if (message.method === "ui/resource-teardown" && (typeof message.id === "number" || typeof message.id === "string")) {
    window.parent.postMessage({ jsonrpc: "2.0", id: message.id, result: {} }, "*");
    closed = true; latest += 1; dispose?.();
    observer?.disconnect();
    if (timer !== null) clearTimeout(timer);
    window.removeEventListener("message", receive);
  } else if ("id" in message && typeof message.method === "string") {
    window.parent.postMessage({ jsonrpc: "2.0", id: message.id, error: { code: -32601, message: "Unsupported widget method." } }, "*");
  }
}
window.addEventListener("message", receive);
renderStatus();
if (bridge === "connecting") send("ui/initialize", { protocolVersion: "2026-01-26",
  appInfo: { name: "Make Docs Backlog Review", version: "1.0.0" }, appCapabilities: {} }, 1);
