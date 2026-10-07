import type { BacklogHostCapabilities } from "../../operations/work/backlog/live-contracts.js";
import type { ControllerState, createBacklogRequestController } from "./request-controller.js";
import type { LiveReportHooks } from "./static-renderer.js";

const paths = {
  moon: '<path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  refresh: '<path d="M20 11a8 8 0 1 0-2.3 6M20 4v7h-7"/>',
  review: '<path d="M21 11.5a8.4 8.4 0 0 1-1 4 8.5 8.5 0 0 1-7.5 4.5 8.4 8.4 0 0 1-4-1L3 21l2-5.5a8.4 8.4 0 0 1-1-4A8.5 8.5 0 0 1 12.5 3H13a8.5 8.5 0 0 1 8 8v.5Z"/>',
  task: '<path d="M20 13v5a2 2 0 0 1-2 2H6l-4 3V5a2 2 0 0 1 2-2h9M18 2v8m-4-4h8"/>',
};
const icon = (name: keyof typeof paths) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;
const named = (button: HTMLButtonElement, label: string) => { button.setAttribute("aria-label", label); button.title = label; };

/** These are display/control hooks only. Report JSON and static presentation stay unchanged. */
export function createBacklogLiveView(root: HTMLElement, getState: () => ControllerState,
  getCapabilities: () => BacklogHostCapabilities, controller: ReturnType<typeof createBacklogRequestController>,
  geometry?: { viewportHeight(): number; changed(): void }) {
  const doc = root.ownerDocument;
  const node = (tag: string, text = "", className = "") => { const value = doc.createElement(tag); value.textContent = text; value.className = className; return value; };
  let refreshButton: HTMLButtonElement | null = null;
  let disposed = false;
  const pendingPaths = new Set<string>();
  function blocked() {
    const state = getState();
    return !state.model || getCapabilities().agentMessages !== true || state.checking || state.limit !== null
      || state.refresh?.refresh.reviewState === "needs-review" || state.refresh?.refresh.reviewState === "last-known";
  }
  function waveActions() {
    if (disposed) return;
    const state = getState();
    for (const article of root.querySelectorAll<HTMLElement>("#waveList article.wave")) {
      const detail = article.querySelector<HTMLElement>(".detail");
      const recordPath = article.dataset.recordPath!;
      const reference = state.model?.actions.find(action => action.action === "review-wave" && action.recordPath === recordPath);
      if (!detail || !reference) continue;
      if (!detail.querySelector(".live-wave-actions")) {
        const row = node("div", "", "live-wave-actions"), controls = node("div", "", "live-action-buttons");
        for (const [kind, label, shape] of [["review-wave", "Review this wave", "review"], ["request-task", "Start a new Codex task", "task"]] as const) {
          const button = doc.createElement("button"); button.type = "button"; button.className = "meta-button live-icon-button"; named(button, label);
          button.innerHTML = icon(shape); // Fixed approved vectors only. No project text enters markup.
          button.addEventListener("click", async () => {
            if (blocked() || pendingPaths.has(recordPath)) return;
            const action = getState().model?.actions.find(value => value.action === "review-wave" && value.recordPath === recordPath);
            if (!action) return;
            pendingPaths.add(recordPath); waveActions();
            try { await controller.requestAction({ ...action, action: kind }); }
            finally { pendingPaths.delete(recordPath); waveActions(); }
          });
          controls.append(button);
        }
        row.append(controls); detail.append(row);
      }
      detail.querySelectorAll<HTMLButtonElement>(".live-wave-actions button").forEach(button => button.disabled = blocked() || pendingPaths.has(recordPath));
    }
  }
  function dataDetails() {
    if (disposed) return;
    const panel = root.querySelector<HTMLElement>("#dataPanel");
    if (!panel || !root.querySelector<HTMLDialogElement>("#dataDialog")?.open) return;
    const state = getState();
    const unknownFailure = !state.checking && state.sourceCheckFailed;
    const outcome = state.checking ? "checking" : unknownFailure ? "unavailable" : state.refresh?.refresh.state ?? "current";
    let section = root.querySelector<HTMLElement>("#liveSourceCheck");
    if (!section) { section = node("section", "", "live-source-check"); section.id = "liveSourceCheck"; panel.prepend(section); }
    section.replaceChildren(node("h3", "Current source check"));
    section.append(node("p", outcome === "current" ? "No refresh check yet." : outcome === "unchanged"
      ? "Source facts unchanged. No review request was needed." : outcome === "unavailable"
        ? "Source facts are unavailable. The last reviewed report remains visible." : outcome === "checking"
          ? "Checking source facts. The last reviewed report remains visible." : "Source facts changed. The last reviewed report remains visible."));
    if (outcome === "changed" && state.refresh?.refresh.state === "changed") {
      for (const [label, field] of [["Added", "added"], ["Changed", "changed"], ["Removed", "removed"]] as const) {
        const values = state.refresh.refresh[field]; section.append(node("h4", `${label} (${values.length})`));
        const list = node("ul"); values.forEach(path => list.append(node("li", path))); section.append(list);
      }
    }
    section.append(node("h4", "Cache lookup"));
    const cache = state.refresh?.cache;
    if (outcome === "current" || outcome === "checking" || unknownFailure) section.append(node("p", "Cache results appear after the source check."));
    else if (cache?.state === "not-attempted") section.append(node("p", "Cache lookup was not attempted because source facts are unavailable."));
    else if (cache?.state === "unavailable") {
      const reasons = { "store-not-configured": "Store not configured", "store-denied": "Store access denied", "store-unsafe": "Store unsafe",
        "store-unavailable": "Store unavailable", "cache-unavailable": "Cache unavailable" };
      section.append(node("p", "Stored reviews are unavailable. Current facts can still be reviewed without them."),
        node("p", `Reason: ${reasons[cache.reason]}. Counts unavailable.`));
    } else if (cache?.state === "available") {
      const counts = cache.result.counts;
      section.append(node("p", `Hits: ${counts.hits} · Misses: ${counts.misses} · Rejected: ${counts.rejected}`),
        node("p", "Exact matches can be reused after validation. Cache access does not change the reviewed report."));
    }
    let heading = root.querySelector<HTMLElement>("#liveReviewedDataLabel");
    if (!heading) { heading = node("h3", "Last reviewed report data"); heading.id = "liveReviewedDataLabel"; root.querySelector("#reportDataView")!.before(heading); }
    heading.hidden = outcome !== "changed";
  }
  function update() {
    if (disposed) return;
    if (refreshButton) { refreshButton.disabled = getState().checking || getCapabilities().toolCalls !== true;
      if (getState().checking) refreshButton.setAttribute("aria-busy", "true"); else refreshButton.removeAttribute("aria-busy"); }
    waveActions(); dataDetails();
  }
  function installToolbar() {
    const mode = root.querySelector<HTMLButtonElement>("#themeToggle")!; mode.classList.add("live-icon-button");
    const print = root.querySelector<HTMLButtonElement>("#printReport")!; print.classList.add("live-icon-button"); named(print, "Print report");
    print.querySelector("span")?.remove();
    refreshButton = doc.createElement("button"); refreshButton.id = "liveRefresh"; refreshButton.type = "button";
    refreshButton.className = "meta-button live-icon-button"; named(refreshButton, "Refresh source facts"); refreshButton.innerHTML = icon("refresh");
    refreshButton.addEventListener("click", () => { void controller.refresh(); }); print.after(refreshButton); update();
  }
  const hooks: LiveReportHooks = { wavesRendered: waveActions, themeChanged: (button, dark) => {
    button.classList.add("live-icon-button"); named(button, dark ? "Light mode" : "Dark mode"); button.innerHTML = icon(dark ? "sun" : "moon");
  }, dataChanged: () => { dataDetails(); geometry?.changed(); }, dataViewportHeight: () => geometry?.viewportHeight() ?? doc.defaultView!.innerHeight };
  return { hooks, installToolbar, update, dispose() { disposed = true; pendingPaths.clear(); } };
}
