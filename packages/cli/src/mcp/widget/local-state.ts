export function captureLocalState(root: HTMLElement) {
  return { search: root.querySelector<HTMLInputElement>("#search")?.value ?? "",
    sort: root.querySelector<HTMLSelectElement>("#sortBy")?.value ?? "updated",
    direction: root.querySelector<HTMLElement>("#sortDirection")?.dataset.direction ?? "desc",
    filter: root.querySelector<HTMLElement>("#filters [aria-pressed=true]")?.dataset.filter ?? "in-scope",
    data: root.querySelector<HTMLDialogElement>("#dataDialog")?.open === true || root.querySelector<HTMLElement>("#dataDialog")?.dataset.beforePrint === "true",
    dataScroll: root.querySelector<HTMLElement>("#dataPanel")?.scrollTop ?? 0,
    jsonScroll: { top: root.querySelector<HTMLElement>("#reportDataView")?.scrollTop ?? 0, left: root.querySelector<HTMLElement>("#reportDataView")?.scrollLeft ?? 0 },
    open: Array.from(root.querySelectorAll<HTMLElement>(".wave")).filter(wave => wave.querySelector("[aria-expanded=true]"))
      .map(wave => wave.dataset.recordPath),
    focusId: root.contains(root.ownerDocument.activeElement) ? root.ownerDocument.activeElement?.id : null,
    focusRecord: root.contains(root.ownerDocument.activeElement) ? root.ownerDocument.activeElement?.closest<HTMLElement>(".wave")?.dataset.recordPath : null,
  };
}

export function restoreLocalState(root: HTMLElement, state: ReturnType<typeof captureLocalState>) {
  const win = root.ownerDocument.defaultView!;
  const search = root.querySelector<HTMLInputElement>("#search")!;
  search.value = state.search;
  root.querySelector<HTMLSelectElement>("#sortBy")!.value = state.sort;
  root.querySelector("#sortBy")!.dispatchEvent(new win.Event("change"));
  const direction = root.querySelector<HTMLElement>("#sortDirection")!;
  if (direction.dataset.direction !== state.direction) direction.click();
  const filter = Array.from(root.querySelectorAll<HTMLElement>("#filters [data-filter]")).find(button => button.dataset.filter === state.filter && !button.hidden);
  filter?.click();
  search.dispatchEvent(new win.Event("input"));
  for (const wave of root.querySelectorAll<HTMLElement>(".wave")) {
    if (!state.open.includes(wave.dataset.recordPath)) continue;
    const surface = wave.querySelector<HTMLElement>("[data-disclosure-surface]")!;
    surface.dispatchEvent(new win.KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
  }
  if (state.data) {
    root.querySelector<HTMLElement>("#openReportData")!.click();
    root.querySelector<HTMLElement>("#dataPanel")!.scrollTop = state.dataScroll;
    const json = root.querySelector<HTMLElement>("#reportDataView")!;
    json.scrollTop = state.jsonScroll.top; json.scrollLeft = state.jsonScroll.left;
  }
  if (state.focusId) root.querySelector<HTMLElement>(`#${state.focusId}`)?.focus({ preventScroll: true });
  else if (state.focusRecord) Array.from(root.querySelectorAll<HTMLElement>(".wave"))
    .find(wave => wave.dataset.recordPath === state.focusRecord)?.querySelector<HTMLElement>("[data-disclosure-surface]")?.focus({ preventScroll: true });
}
