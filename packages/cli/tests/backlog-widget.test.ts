import { webcrypto } from "node:crypto";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { runInNewContext } from "node:vm";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { beforeAll, describe, expect, it } from "vitest";
import { createBacklogLivePayload } from "../src/operations/work/backlog/presentation";
import { createBacklogRefreshResult } from "../src/operations/work/backlog/live-contracts";
import { createBacklogReviewRefreshPayload } from "../src/operations/work/backlog/review-contracts";
import { defaultAppResources } from "../src/mcp/default-app-resources";
import { presentationCases, PRESENTATION_SESSION_ID, smallPresentationReport } from "./fixtures/backlog-presentation";
import type * as State from "../src/mcp/widget/state";
import { captureLocalState, restoreLocalState } from "../src/mcp/widget/local-state";
import { readBacklogContainerBounds, backlogContainerHeight, constrainBacklogHeight } from "../src/mcp/widget/container-size";

const url = (value: string) => new URL(value, import.meta.url);
let stateCode: string, entryCode: string;
beforeAll(async () => {
  const common = { bundle: true, write: false, platform: "browser" as const, target: "es2022",
    alias: { "node:crypto": fileURLToPath(url("../src/mcp/widget/browser-crypto.ts")) } };
  stateCode = (await build({ ...common, entryPoints: [fileURLToPath(url("../src/mcp/widget/state.ts"))], format: "cjs" })).outputFiles![0].text;
  // Keep the protocol controller and validators real. The independent browser suite
  // exercises the accepted DOM renderer; this seam records mount/dispose decisions.
  entryCode = (await build({ ...common, entryPoints: [fileURLToPath(url("../src/mcp/widget/entry.ts"))], format: "iife", plugins: [{
    name: "record-widget-mounts", setup(api) {
      api.onLoad({ filter: /\/widget\/static-renderer\.js$/ }, () => ({ loader: "js", contents:
        "export const reportMarkup='<main>fixed markup</main>'; export function mountStaticReport(report,display,root){ root.report=report; root.display=display; root.mounts++; return ()=>{root.disposals++}; }" }));
      api.onLoad({ filter: /\/widget\/local-state\.ts$/ }, () => ({ loader: "js", contents:
        "export function captureLocalState(){return {}};export function restoreLocalState(){}" }));
      api.onLoad({ filter: /\/widget\/live-view\.ts$/ }, () => ({ loader: "js", contents:
        "export function createBacklogLiveView(){return {hooks:{},installToolbar(){},update(){},dispose(){}}}" }));
    },
  }] })).outputFiles![0].text;
});
function state(crypto: unknown = webcrypto): typeof State {
  const module = { exports: {} };
  runInNewContext(stateCode, { module, exports: module.exports, crypto, TextEncoder }, { contextCodeGeneration: { strings: false, wasm: false } });
  return module.exports as typeof State;
}
function refresh(envelope = createBacklogLivePayload(smallPresentationReport, PRESENTATION_SESSION_ID)._meta.backlog.envelope,
  snapshot: typeof envelope.report.snapshot | null = envelope.report.snapshot) {
  return createBacklogReviewRefreshPayload(envelope, snapshot, createBacklogRefreshResult(envelope, snapshot
    ? { state: "available", snapshot } : { state: "unavailable", reason: "source-denied" }), snapshot
    ? { state: "unavailable", operation: "work.backlog-cache.lookup", reason: "store-not-configured",
      nextAction: "Current source facts are available. Continue the review. Restore cache access before a later cache lookup." }
    : { state: "not-attempted", reason: "source-unavailable" });
}
function harness(crypto: unknown = webcrypto, topLevel = false) {
  const footer = { child: null as unknown, replaceChildren(child: unknown) { this.child = child; } };
  const elements = new Map(["widgetStatus", "widgetReport", "widgetEmpty"].map(id => [id,
    { textContent: "", dataset: {} as Record<string, string>, hidden: id === "widgetReport", mounts: 0, disposals: 0,
      report: null as unknown, display: null as unknown, replaceChildren() {}, querySelector: (selector: string) => selector === "footer" ? footer : null }]));
  const outgoing: Record<string, unknown>[] = [];
  const listeners = new Map<string, (event: unknown) => void>();
  const timers = new Map<number, () => void>();
  const bounds = { bottom: 900 };
  const viewport = { scrollHeight: 900, clientWidth: 1200 };
  let onResize: () => void = () => {};
  const parent = { postMessage: (message: Record<string, unknown>) => outgoing.push(message) };
  const window = { parent: parent as unknown, scrollY: 0, innerHeight: 900, addEventListener: (name: string, fn: (event: unknown) => void) => listeners.set(name, fn),
    dispatchEvent: (event: Event) => { listeners.get(event.type)?.(event); return true; },
    removeEventListener: (name: string) => listeners.delete(name) };
  if (topLevel) window.parent = window;
  runInNewContext(entryCode, { window, crypto, TextEncoder, structuredClone, Event,
    document: { getElementById: (id: string) => elements.get(id), documentElement: viewport, body: { getBoundingClientRect: () => bounds },
      createElement: () => ({ innerHTML: "", content: { cloneNode: () => ({}) } }) },
    ResizeObserver: class { constructor(callback: () => void) { onResize = callback; } observe() {} disconnect() { onResize = () => {}; } },
    setTimeout: (callback: () => void) => { const id = timers.size + 1; timers.set(id, callback); return id; },
    clearTimeout: (id: number) => timers.delete(id),
  }, { contextCodeGeneration: { strings: false, wasm: false } });
  const send = (data: Record<string, unknown>, source: unknown = window.parent) => listeners.get("message")?.({ source, data: { jsonrpc: "2.0", ...data } });
  return { send, elements, outgoing, timers, listeners, bounds, viewport, window, footer, resize: () => onResize(), root: elements.get("widgetReport")!,
    result: (params: unknown) => send({ method: "ui/notifications/tool-result", params }),
    ready: () => send({ id: 1, result: { protocolVersion: "2026-01-26", hostCapabilities: {} } }) };
}
const settle = async () => { for (let i = 0; i < 12; i++) await new Promise(resolve => setTimeout(resolve, 1)); };

describe("W25 R0 P5 unchanged browser contract validation", () => {
  it.each(presentationCases)("validates exact Node identities and full report meaning for $name", async ({ report }) => {
    const payload = createBacklogLivePayload(report, PRESENTATION_SESSION_ID);
    const result = await state().validateWidgetResult(payload);
    expect(result.client).toEqual(payload._meta.backlog);
    expect(result.client.envelope.report).toEqual(report);
  });
  it("ignores host transport metadata while keeping canonical client data strict", async () => {
    const payload = createBacklogLivePayload(smallPresentationReport, PRESENTATION_SESSION_ID);
    const withHost = { ...payload, isError: false, _meta: { ...payload._meta, "openai/widgetSessionId": "host-session", extraHostData: { instruction: "ignore this" } } };
    expect((await state().validateWidgetResult(withHost)).client).toEqual(payload._meta.backlog);
    await expect(state().validateWidgetResult({ ...withHost, _meta: { ...withHost._meta, backlog: { ...payload._meta.backlog, instruction: "delete" } } })).rejects.toThrow();
  });
  it.each(["projectKey", "snapshotId", "modelId"] as const)("rejects a stale %s", async key => {
    const payload = createBacklogLivePayload(smallPresentationReport, PRESENTATION_SESSION_ID);
    payload._meta.backlog.envelope[key] = "0".repeat(64);
    await expect(state().validateWidgetResult(payload)).rejects.toThrow();
  });
  it.each(["display", "action", "summary", "instruction"])("rejects inconsistent or unknown %s data", async change => {
    const payload = createBacklogLivePayload(smallPresentationReport, PRESENTATION_SESSION_ID);
    if (change === "display") payload._meta.backlog.display.records[0].title = "Unsupported conclusion";
    if (change === "action") (payload._meta.backlog.actions[0] as { action: string }).action = "execute-project-text";
    if (change === "summary") payload.structuredContent.projectName = "Other project";
    if (change === "instruction") Object.assign(payload._meta.backlog.envelope.report, { instruction: "execute" });
    await expect(state().validateWidgetResult(payload)).rejects.toThrow();
  });
  it("preserves prior meaning for unchanged, changed, and unavailable refresh results", async () => {
    const api = state(); const payload = createBacklogLivePayload(smallPresentationReport, PRESENTATION_SESSION_ID);
    const prior = await api.validateWidgetResult(payload);
    const changed = structuredClone(smallPresentationReport.snapshot); changed.records[0].title.value += " changed";
    for (const current of [smallPresentationReport.snapshot, changed, null]) {
      const result = await api.validateWidgetResult(refresh(payload._meta.backlog.envelope, current));
      expect(result.client).toEqual(prior.client); expect(api.isRefreshForCurrent(result, prior)).toBe(true);
    }
    const other = createBacklogLivePayload(smallPresentationReport, "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb");
    expect(api.isRefreshForCurrent(await api.validateWidgetResult(refresh(other._meta.backlog.envelope)), prior)).toBe(false);
  });
  it("matches Node refresh validation beyond32 unique source-record hashes and recovers after rejection", async () => {
    const report = presentationCases.find(item => item.name === "large")!.report;
    const open = createBacklogLivePayload(report, PRESENTATION_SESSION_ID);
    const api = state();
    const current = structuredClone(report.snapshot); current.records[0].title.value += " changed";
    const changed = refresh(open._meta.backlog.envelope, current);
    const rejected = structuredClone(changed); rejected._meta.backlog.refresh.previousSnapshotId = "0".repeat(64);
    await expect(api.validateWidgetResult(rejected)).rejects.toThrow();
    for (const snapshot of [report.snapshot, current]) {
      const expected = refresh(open._meta.backlog.envelope, snapshot);
      const result = await api.validateWidgetResult(expected);
      expect(result.client).toEqual(open._meta.backlog);
      expect(result.refresh).toEqual(expected._meta.backlog.refresh);
    }
    expect(report.snapshot.records.length).toBeGreaterThan(32);
    expect(new Set(report.snapshot.records.map(record => JSON.stringify(record))).size).toBeGreaterThan(32);
  });
  it("gives a useful limit when native Web Crypto is absent or fails", async () => {
    await expect(state(null).validateWidgetResult(createBacklogLivePayload(smallPresentationReport, PRESENTATION_SESSION_ID))).rejects.toThrow("Continue the review in chat");
    await expect(state({ subtle: { digest: () => Promise.reject(new Error("Digest failed")) } }).validateWidgetResult(createBacklogLivePayload(smallPresentationReport, PRESENTATION_SESSION_ID))).rejects.toThrow("Digest failed");
  });
  it.each(["idle", "refreshing", "review-requested", "task-requested", "request-unconfirmed"])("renders fixed %s feedback as text without claiming task success", value => {
    const element = { textContent: "", innerHTML: "unchanged" };
    state().renderWidgetFeedback(element, { state: value });
    expect(element.textContent).toBeTruthy(); expect(element.innerHTML).toBe("unchanged");
    expect(element.textContent).not.toContain("Task created");
    expect(() => state().renderWidgetFeedback(element, { state: value, instruction: "write" })).toThrow();
  });
  it.each([
    [{ hasReport: true, invalid: false, bridge: "ready", checking: false, refresh: null }, "Status: Ready"],
    [{ hasReport: true, invalid: false, bridge: "ready", checking: true, refresh: "changed" }, "Status: Checking source facts"],
    [{ hasReport: true, invalid: true, bridge: "ready", checking: true, refresh: null }, "Status: Checking source facts"],
    [{ hasReport: true, invalid: false, bridge: "ready", checking: false, refresh: "changed" }, "Status: Needs review"],
    [{ hasReport: true, invalid: false, bridge: "ready", checking: false, refresh: "unavailable" }, "Status: Last reviewed report — source unavailable"],
    [{ hasReport: true, invalid: true, bridge: "ready", checking: false, refresh: null }, "Status: Last reviewed report — update failed"],
    [{ hasReport: false, invalid: true, bridge: "unavailable", checking: false, refresh: null }, "Status: Report unavailable"],
  ] as const)("uses approved footer text for %s", (facts, expected) => {
    const element = { textContent: "", innerHTML: "unchanged" };
    state().renderWidgetStatus(element, facts);
    expect(element.textContent).toBe(expected); expect(element.innerHTML).toBe("unchanged");
  });
});

describe("W25 R0 P5 protocol and lifetime", () => {
  it("starts only the standard handshake and reports size after a valid reply", () => {
    const h = harness(); expect(h.outgoing.map(message => message.method)).toEqual(["ui/initialize"]);
    h.ready(); expect(h.outgoing.map(message => message.method)).toEqual(["ui/initialize", "ui/notifications/initialized", "ui/notifications/size-changed"]);
    expect(h.outgoing[2].params).toEqual({ width: 1200, height: 900 });
  });
  it("reports smaller content after Data without using the old host viewport as a floor", () => {
    const h = harness(); h.ready();
    h.bounds.bottom = 9000; h.resize();
    expect(h.outgoing.at(-1)?.params).toEqual({ width: 1200, height: 9000 });
    h.viewport.scrollHeight = 9000; h.bounds.bottom = 1200; h.resize();
    expect(h.outgoing.at(-1)?.params).toEqual({ width: 1200, height: 1200 });
    const count = h.outgoing.length;
    h.window.scrollY = 1000; h.bounds.bottom = 200; h.resize();
    expect(h.outgoing).toHaveLength(count);
  });
  it("has a useful empty fallback without a bridge or report", () => {
    const h = harness(webcrypto, true);
    expect(h.outgoing).toEqual([]); expect(h.elements.get("widgetStatus")?.textContent).toBe("Status: Report unavailable");
  });
  it.each(["malformed", "missing-crypto"])("does not claim a prior report for initial %s failure", async failure => {
    const h = harness(failure === "missing-crypto" ? null : webcrypto);
    h.result(failure === "malformed" ? { content: [] } : createBacklogLivePayload(smallPresentationReport, PRESENTATION_SESSION_ID));
    await settle();
    expect(h.root.mounts).toBe(0); expect(h.root.hidden).toBe(true);
    expect(h.elements.get("widgetStatus")?.textContent).toBe("Status: Report unavailable");
    expect(h.elements.get("widgetStatus")?.textContent).not.toContain("Last reviewed report");
  });
  it.each(["before", "after"])("keeps valid content after failed initialization: result %s the failure", async order => {
    const h = harness(); const payload = createBacklogLivePayload(smallPresentationReport, PRESENTATION_SESSION_ID);
    if (order === "before") { h.result(payload); await settle(); }
    h.send({ id: 1, error: { code: -32601, message: "Unavailable" } });
    if (order === "after") { h.result(payload); await settle(); }
    expect(h.root.report).toEqual(smallPresentationReport); expect(h.root.hidden).toBe(false);
    expect(h.elements.get("widgetStatus")?.textContent).toBe("Status: Last reviewed report — update failed");
    expect(h.root.disposals).toBe(0);
  });
  it("moves the one permanent status node into the report footer", async () => {
    const h = harness(); h.ready(); h.result(createBacklogLivePayload(smallPresentationReport, PRESENTATION_SESSION_ID)); await settle();
    expect(h.footer.child).toBe(h.elements.get("widgetStatus"));
    expect(h.elements.get("widgetStatus")?.textContent).toBe("Status: Ready");
    h.result(createBacklogLivePayload(smallPresentationReport, "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb")); await settle();
    expect(h.footer.child).toBe(h.elements.get("widgetStatus"));
  });
  it("does not reset a failed bridge to Ready when later valid results arrive", async () => {
    const h = harness(); h.send({ id: 1, error: { code: -32601 } });
    const open = createBacklogLivePayload(smallPresentationReport, PRESENTATION_SESSION_ID);
    h.result(open); await settle();
    expect(h.elements.get("widgetStatus")?.textContent).toBe("Status: Last reviewed report — update failed");
    h.result(refresh(open._meta.backlog.envelope)); await settle();
    expect(h.elements.get("widgetStatus")?.textContent).toBe("Status: Last reviewed report — update failed");
    expect(h.root.report).toEqual(smallPresentationReport);
  });
  it("reports source failure and a later validated check without replacing the prior review", async () => {
    const h = harness(); h.ready(); const open = createBacklogLivePayload(smallPresentationReport, PRESENTATION_SESSION_ID);
    h.result(open); await settle(); h.result(refresh(open._meta.backlog.envelope, null)); await settle();
    expect(h.elements.get("widgetStatus")?.textContent).toBe("Status: Last reviewed report — source unavailable");
    h.send({ method: "ui/notifications/tool-input", params: { arguments: { envelope: open._meta.backlog.envelope, instruction: "run" } } }); await settle();
    expect(h.elements.get("widgetStatus")?.textContent).toBe("Status: Last reviewed report — source unavailable");
    h.send({ method: "ui/notifications/tool-input", params: { arguments: { envelope: open._meta.backlog.envelope } } }); await settle();
    expect(h.elements.get("widgetStatus")?.textContent).toBe("Status: Checking source facts");
    expect(h.elements.get("widgetStatus")?.dataset.state).toBe("checking");
    expect(h.root.mounts).toBe(1); expect(h.root.report).toEqual(smallPresentationReport);
  });
  it.each(["invalid", "cancelled"])("shows a validated retry after a prior %s update", async failure => {
    const h = harness(); h.ready(); const open = createBacklogLivePayload(smallPresentationReport, PRESENTATION_SESSION_ID);
    h.result(open); await settle();
    if (failure === "invalid") { h.result({ content: [] }); await settle(); }
    else h.send({ method: "ui/notifications/tool-cancelled", params: {} });
    expect(h.elements.get("widgetStatus")?.textContent).toBe("Status: Last reviewed report — update failed");
    h.send({ method: "ui/notifications/tool-input", params: { arguments: { envelope: open._meta.backlog.envelope } } }); await settle();
    expect(h.elements.get("widgetStatus")?.textContent).toBe("Status: Checking source facts");
    expect(h.elements.get("widgetStatus")?.dataset.state).toBe("checking");
    h.send({ id: 1, error: { code: -32601 } });
    expect(h.elements.get("widgetStatus")?.textContent).toBe("Status: Last reviewed report — update failed");
    expect(h.elements.get("widgetStatus")?.dataset.state).toBe("limited");
    expect(h.root.mounts).toBe(1);
  });
  it("keeps valid content after timeout, bad data, and cancellation", async () => {
    const h = harness(); h.result(createBacklogLivePayload(smallPresentationReport, PRESENTATION_SESSION_ID)); await settle();
    h.timers.forEach(timer => timer());
    h.result({ content: [{ type: "text", text: "<img onerror=execute()>" }] }); await settle();
    expect(h.root.mounts).toBe(1); expect(h.root.hidden).toBe(false);
    expect(h.elements.get("widgetStatus")?.textContent).toBe("Status: Last reviewed report — update failed");
    h.send({ method: "ui/notifications/tool-cancelled", params: {} });
    expect(h.root.report).toEqual(smallPresentationReport); expect(h.root.disposals).toBe(0);
    expect(h.elements.get("widgetStatus")?.textContent).toBe("Status: Last reviewed report — update failed");
  });
  it("keeps the prior report when the host marks an otherwise valid result as failed", async () => {
    const h = harness(); const prior = createBacklogLivePayload(smallPresentationReport, PRESENTATION_SESSION_ID);
    h.result(prior); await settle();
    const changed = structuredClone(smallPresentationReport); changed.project.name = changed.snapshot.project.name = "Failed new report";
    h.result({ ...createBacklogLivePayload(changed, PRESENTATION_SESSION_ID), isError: true }); await settle();
    expect(h.root.mounts).toBe(1); expect(h.root.report).toEqual(smallPresentationReport);
    expect(h.elements.get("widgetStatus")?.textContent).toBe("Status: Last reviewed report — update failed");
  });
  it("keeps the previous model during refresh and rejects another session", async () => {
    const h = harness(); const open = createBacklogLivePayload(smallPresentationReport, PRESENTATION_SESSION_ID);
    h.result(open); await settle();
    h.send({ method: "ui/notifications/tool-input", params: { arguments: { envelope: open._meta.backlog.envelope } } }); await settle();
    expect(h.elements.get("widgetStatus")?.textContent).toBe("Status: Checking source facts");
    const current = structuredClone(smallPresentationReport.snapshot); current.records[0].title.value += "changed";
    h.result(refresh(open._meta.backlog.envelope, current)); await settle();
    expect(h.root.mounts).toBe(1); expect(h.elements.get("widgetStatus")?.textContent).toBe("Status: Needs review");
    const other = createBacklogLivePayload(smallPresentationReport, "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb");
    h.result(refresh(other._meta.backlog.envelope)); await settle();
    expect(h.root.mounts).toBe(1); expect(h.elements.get("widgetStatus")?.textContent).toBe("Status: Needs review");
  });
  it("does not let slower earlier validation replace the newest received report", async () => {
    let release: () => void = () => {}; let first = true;
    const delayed = { subtle: { digest: async (...args: Parameters<typeof webcrypto.subtle.digest>) => {
      if (first) { first = false; await new Promise<void>(resolve => { release = resolve; }); }
      return webcrypto.subtle.digest(...args);
    } } };
    const h = harness(delayed); const firstReport = structuredClone(smallPresentationReport);
    h.result(createBacklogLivePayload(firstReport, PRESENTATION_SESSION_ID)); await settle();
    const newer = structuredClone(firstReport); newer.project.name = newer.snapshot.project.name = "Newer report";
    h.result(createBacklogLivePayload(newer, PRESENTATION_SESSION_ID)); release(); await settle();
    expect(h.root.report).toEqual(newer); expect(h.root.mounts).toBe(1);
  });
  it("disposes previous rendering and stops listening after teardown", async () => {
    const h = harness(); h.result(createBacklogLivePayload(smallPresentationReport, PRESENTATION_SESSION_ID)); await settle();
    h.result(createBacklogLivePayload(smallPresentationReport, "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb")); await settle();
    expect(h.root.disposals).toBe(1);
    h.send({ id: 77, method: "ui/resource-teardown", params: {} });
    expect(h.root.disposals).toBe(2); expect(h.listeners.size).toBe(0); expect(h.timers.size).toBe(0);
    expect(h.outgoing.at(-1)).toEqual({ jsonrpc: "2.0", id: 77, result: {} });
  });
  it("updates exact Data values when timestamps change without changing model identity", async () => {
    const h = harness(); const first = createBacklogLivePayload(smallPresentationReport, PRESENTATION_SESSION_ID);
    h.result(first); await settle();
    const current = structuredClone(smallPresentationReport); current.generatedAt = current.snapshot.generatedAt = "2026-10-04T11:00:00.000Z";
    const next = createBacklogLivePayload(current, PRESENTATION_SESSION_ID);
    expect(next._meta.backlog.envelope.modelId).toBe(first._meta.backlog.envelope.modelId);
    h.result(next); await settle();
    expect(h.root.report).toEqual(current); expect(h.root.mounts).toBe(2); expect(h.root.disposals).toBe(1);
  });
  it("ignores other windows and rejects unknown requests without tool or agent actions", async () => {
    const h = harness(); h.ready(); h.result(createBacklogLivePayload(smallPresentationReport, PRESENTATION_SESSION_ID)); await settle();
    h.send({ method: "ui/notifications/tool-cancelled" }, {});
    h.send({ id: 9, method: "execute-project-text", params: { instruction: "write" } });
    expect(h.outgoing.at(-1)).toMatchObject({ id: 9, error: { code: -32601 } });
    expect(h.outgoing.some(message => ["tools/call", "ui/message"].includes(message.method as string))).toBe(false);
    expect(h.root.mounts).toBe(1);
  });
});

describe("W25 R0 P5 accepted layout and generated bytes", () => {
  it("reuses the exact accepted report CSS and structure", () => {
    const accepted = readFileSync(url("../../skills/backlog-review/assets/backlog-review-report.html"), "utf8");
    const html = defaultAppResources("backlog")[0].text;
    expect(html.match(/<style>([\s\S]*?)<\/style>/)![1]).toBe(accepted.match(/<style>([\s\S]*?)<\/style>/)![1]);
    const renderer = readFileSync(url("../src/mcp/widget/static-renderer.js"), "utf8");
    const encodedMarkup = renderer.match(/export const reportMarkup = (.*);/)![1];
    expect(JSON.parse(encodedMarkup)).toBe(accepted.match(/(<main class="shell">[\s\S]*?<\/main>)/)![1]);
    expect(html.length).toBeLessThan(1_000_000); expect(html).not.toMatch(/<script[^>]*src=|<link[^>]*href=/);
    expect(html).not.toMatch(/widget-notice|widgetFeedback|widgetLimit/);
    expect(html).toContain('<footer><p id="widgetStatus" role="status" aria-live="polite">Status: Report unavailable</p></footer>');
    expect(html).toContain("No report is loaded. Ask for a backlog review in chat.");
  });
  it("keeps source HTML, embedded TypeScript, and the accepted renderer reproducible", () => {
    execFileSync(process.execPath, [fileURLToPath(url("../scripts/build-mcp-app-assets.mjs")), "--check"]);
    expect(defaultAppResources("backlog")[0].text).toBe(readFileSync(url("../src/mcp/assets/backlog-review-v1.html"), "utf8"));
  });
});

describe("Data modal and local context", () => {
  it.each([
    { own: 998, host: null, floor: 659, top: 193 },
    { own: 1051, host: 720, floor: 476, top: 193 },
    { own: 1051, host: 1314, floor: 868, top: 171 },
    { own: 1764, host: 844, floor: 558, top: 193 },
  ])("loads exact Data locally and keeps focus with own=$own and host=$host", async ({ own, host, floor, top }) => {
    const accepted = readFileSync(url("../../skills/backlog-review/assets/backlog-review-report.html"), "utf8");
    const json = accepted.slice(accepted.indexOf("    let normalizedReportJson"), accepted.indexOf("    document.title"));
    const renderer = readFileSync(url("../src/mcp/widget/static-renderer.js"), "utf8");
    const modal = renderer.slice(renderer.indexOf("    const reportDataView"), renderer.indexOf("    const searchInput"));
    const download = accepted.slice(accepted.indexOf('    document.querySelector("#downloadReportData").addEventListener'), accepted.indexOf("    renderOrder();"));
    let focused = "", formats = 0, headerScrolls = 0;
    let downloadBlob: Blob | null = null, downloads = 0, anchorParent = "";
    const elements = new Map<string, Record<string, unknown>>();
    for (const id of ["reportDataView", "dataDialog", "openReportData", "closeReportData", "downloadReportData"]) {
      const listeners = new Map<string, (event?: unknown) => void>();
      elements.set(id, { id, open: false, isConnected: true, textContent: "", attributes: new Map(), listeners, style: {},
        addEventListener: (name: string, fn: (event?: unknown) => void) => listeners.set(name, fn),
        setAttribute(name: string, value: string) { (this.attributes as Map<string, string>).set(name, value); },
        focus: () => { focused = id; },
        getClientRects: () => [1],
      });
    }
    const dialog = elements.get("dataDialog")!;
    dialog.showModal = () => { dialog.open = true; focused = "closeReportData"; };
    dialog.close = () => { dialog.open = false; (dialog.listeners as Map<string, () => void>).get("close")!(); };
    dialog.querySelectorAll = () => [elements.get("closeReportData"), elements.get("downloadReportData"), elements.get("reportDataView")];
    dialog.contains = (element: unknown) => ["closeReportData", "downloadReportData", "reportDataView"].some(id => elements.get(id) === element);
    dialog.scrollIntoView = () => { headerScrolls++; };
    elements.get("openReportData")!.getBoundingClientRect = () => ({ top: 193 });
    dialog.append = () => { anchorParent = "dataDialog"; };
    runInNewContext(json + modal + download, { report: smallPresentationReport, projectName: "Aurora Notes", Blob,
      hooks: { dataViewportHeight: () => host ?? own }, listen: (element: any, type: string, fn: unknown) => element.addEventListener(type, fn),
      URL: { createObjectURL(blob: Blob) { downloadBlob = blob; return "blob:local-report"; }, revokeObjectURL() {} }, setTimeout: (callback: () => void) => callback(),
      JSON: { stringify(value: unknown, replacer: null, spaces: number) { formats++; return JSON.stringify(value, replacer, spaces); } },
      document: { querySelector: (selector: string) => elements.get(selector.slice(1)), get activeElement() { return elements.get(focused); },
        createElement: () => ({ click() { downloads++; }, remove() {} }) },
      window: { innerHeight: own, addEventListener() {}, parent: { postMessage() { throw new Error("A local Data action must not make a host request."); } } },
    });
    const click = (id: string) => (elements.get(id)!.listeners as Map<string, () => void>).get("click")!();
    expect(formats).toBe(0); expect(elements.get("reportDataView")!.textContent).toBe("");
    expect(downloads).toBe(0);
    click("openReportData");
    expect(dialog.open).toBe(true); expect(focused).toBe("closeReportData");
    expect(dialog.style).toEqual({ top: `${top}px`, height: `${floor}px`, minHeight: `${floor}px` });
    expect(JSON.parse(elements.get("reportDataView")!.textContent as string)).toEqual(smallPresentationReport);
    expect(formats).toBe(1);
    click("downloadReportData"); expect(downloads).toBe(1); expect(anchorParent).toBe("dataDialog");
    expect(JSON.parse(await downloadBlob!.text())).toEqual(smallPresentationReport);
    const keydown = (event: unknown) => (dialog.listeners as Map<string, (event: unknown) => void>).get("keydown")!(event);
    focused = "reportDataView"; let tabPrevented = false;
    keydown({ key: "Tab", shiftKey: false, preventDefault: () => { tabPrevented = true; } });
    expect(tabPrevented).toBe(true); expect(focused).toBe("closeReportData");
    keydown({ key: "Tab", shiftKey: true, preventDefault() {} }); expect(focused).toBe("reportDataView");
    click("closeReportData"); expect(dialog.open).toBe(false); expect(focused).toBe("openReportData");
    click("openReportData"); let prevented = false;
    (dialog.listeners as Map<string, (event: unknown) => void>).get("cancel")!({ preventDefault: () => { prevented = true; } });
    expect(prevented).toBe(true); expect(dialog.open).toBe(false); expect(focused).toBe("openReportData"); expect(formats).toBe(1); expect(headerScrolls).toBe(2);
  });

  it("uses only valid standard container bounds and keeps own-frame fallback explicit", () => {
    const bounds = readBacklogContainerBounds({ containerDimensions: { maxHeight: 720, width: 1280 } });
    expect(backlogContainerHeight(bounds, 3927)).toBe(720); expect(constrainBacklogHeight(3927, bounds)).toBe(720);
    expect(constrainBacklogHeight(1051, readBacklogContainerBounds({ containerDimensions: { maxHeight: 1314 } }))).toBe(1051);
    expect(constrainBacklogHeight(2000, readBacklogContainerBounds({ containerDimensions: { height: 844 } }))).toBe(844);
    for (const input of [null, {}, { containerDimensions: [] }, { containerDimensions: { height: "720" } }, { containerDimensions: { maxHeight: Infinity } }, { containerDimensions: { maxHeight: -1 } }]) {
      expect(readBacklogContainerBounds(input)).toBe(null);
    }
    expect(backlogContainerHeight(null, 1051)).toBe(1051);
  });

  it("applies trusted host bounds on init and updates without tool or message requests", async () => {
    const h = harness();
    h.send({ method: "ui/notifications/host-context-changed", params: { containerDimensions: { maxHeight: 720 } } });
    expect(h.outgoing.filter(message => message.method === "ui/notifications/size-changed")).toHaveLength(0);
    h.send({ id: 1, result: { protocolVersion: "2026-01-26", hostCapabilities: {}, hostContext: { containerDimensions: { maxHeight: 720, width: 1200 } } } });
    expect(h.outgoing.filter(message => message.method === "ui/notifications/size-changed").at(-1)).toMatchObject({ params: { height: 720 } });
    const modal = { open: true, getBoundingClientRect: () => ({ bottom: 1100 }) };
    h.root.querySelector = (selector: string) => selector === "#dataDialog" ? modal as never : selector === "footer" ? h.footer : null;
    h.send({ method: "ui/notifications/host-context-changed", params: { containerDimensions: { maxHeight: 1314, width: 1200 } } });
    expect(h.outgoing.filter(message => message.method === "ui/notifications/size-changed").at(-1)).toMatchObject({ params: { height: 1112 } });
    h.send({ method: "ui/notifications/host-context-changed", params: { containerDimensions: { height: 844 } } });
    expect(h.outgoing.filter(message => message.method === "ui/notifications/size-changed").at(-1)).toMatchObject({ params: { height: 844 } });
    const count = h.outgoing.length;
    h.send({ method: "ui/notifications/host-context-changed", params: { containerDimensions: { height: 2000 } } }, {});
    expect(h.outgoing).toHaveLength(count);
    expect(h.outgoing.filter(message => ["tools/call", "ui/message"].includes(message.method as string))).toHaveLength(0);
    h.send({ id: 88, method: "ui/resource-teardown" });
    h.send({ method: "ui/notifications/host-context-changed", params: { containerDimensions: { height: 2000 } } });
    await settle(); expect(h.listeners.size).toBe(0);
  });

  it.each([true, false])("keeps report controls and modal context across model replacement with open=%s", open => {
    function localRig() {
      const nodes = new Map<string, any>();
      const document: any = { activeElement: null, defaultView: { Event: class { constructor(public type: string) {} },
        KeyboardEvent: class { key: string; constructor(public type: string, options: { key: string }) { this.key = options.key; } } } };
      for (const id of ["search", "sortBy", "sortDirection", "dataDialog", "dataPanel", "reportDataView", "openReportData", "closeReportData"]) {
        nodes.set(id, { id, value: "", open: false, dataset: {}, scrollTop: 0, scrollLeft: 0,
          closest: () => null, dispatchEvent() {}, focus() { document.activeElement = this; } });
      }
      const filter = { dataset: { filter: "all" }, hidden: false, click() {} };
      const surface = { expanded: false, dispatchEvent() { this.expanded = true; }, focus() { document.activeElement = this; } };
      const wave = { dataset: { recordPath: "docs/work/known-record" }, querySelector: (selector: string) => selector === "[aria-expanded=true]" ? surface.expanded ? surface : null : surface };
      nodes.get("sortDirection").click = () => { nodes.get("sortDirection").dataset.direction = "asc"; };
      nodes.get("openReportData").click = () => { nodes.get("dataDialog").open = true; document.activeElement = nodes.get("closeReportData"); };
      const root = { ownerDocument: document, contains: (value: unknown) => [...nodes.values()].includes(value),
        querySelector: (selector: string) => selector === "#filters [aria-pressed=true]" ? filter : nodes.get(selector.slice(1)),
        querySelectorAll: (selector: string) => selector === ".wave" ? [wave] : [filter],
      } as unknown as HTMLElement;
      return { root, nodes, document, surface };
    }
    const before = localRig();
    before.nodes.get("search").value = "known"; before.nodes.get("sortBy").value = "coordinate";
    before.nodes.get("sortDirection").dataset.direction = "asc"; before.surface.expanded = true;
    before.nodes.get("dataDialog").open = open; before.nodes.get("dataPanel").scrollTop = 90;
    before.nodes.get("reportDataView").scrollTop = 120; before.nodes.get("reportDataView").scrollLeft = 15;
    before.document.activeElement = before.nodes.get(open ? "reportDataView" : "search");
    const saved = captureLocalState(before.root), after = localRig();
    restoreLocalState(after.root, saved);
    expect(after.nodes.get("search").value).toBe("known"); expect(after.nodes.get("sortBy").value).toBe("coordinate");
    expect(after.nodes.get("sortDirection").dataset.direction).toBe("asc"); expect(after.surface.expanded).toBe(true);
    expect(after.nodes.get("dataDialog").open).toBe(open);
    if (open) { expect(after.nodes.get("dataPanel").scrollTop).toBe(90); expect(after.nodes.get("reportDataView").scrollTop).toBe(120); expect(after.nodes.get("reportDataView").scrollLeft).toBe(15); }
    expect(after.document.activeElement.id).toBe(open ? "reportDataView" : "search");
  });
});
