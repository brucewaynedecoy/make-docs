/** Standalone real-renderer check. Requires an existing Playwright runtime; installs nothing. */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "esbuild";
import { createBacklogLivePayload } from "../../../../../../packages/cli/src/operations/work/backlog/presentation";

const option = (name: string) => { const index = process.argv.indexOf(name); return index < 0 ? undefined : process.argv[index + 1]; };
const modulePath = option("--playwright-module"), reportPath = option("--report");
assert(modulePath && reportPath, "Supply --playwright-module and --report. Use an existing runtime and frozen report.");
const report = JSON.parse(await readFile(reportPath, "utf8"));
const payload = createBacklogLivePayload(report, "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
let html = await readFile(new URL("../../../../../../packages/cli/src/mcp/assets/backlog-review-v1.html", import.meta.url), "utf8");
const generated = process.argv.includes("--generated");
if (!generated) {
  const bundle = await build({ entryPoints: [fileURLToPath(new URL("../../../../../../packages/cli/src/mcp/widget/entry.ts", import.meta.url))],
    bundle: true, write: false, platform: "browser", format: "iife", target: "es2022",
    alias: { "node:crypto": fileURLToPath(new URL("../../../../../../packages/cli/src/mcp/widget/browser-crypto.ts", import.meta.url)) } });
  const code = bundle.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");
  html = html.replace(/<script>[\s\S]*?<\/script>/, () => `<script>${code}</script>`);
}
const host = `<!doctype html><iframe src="/widget" style="width:1200px;height:900px"></iframe><script>
window.requests=[];
window.addEventListener("message",async event=>{
  if(event.source!==document.querySelector("iframe").contentWindow)return;
  const message=event.data; window.requests.push(message.method);
  if(message.method==="ui/initialize")event.source.postMessage({jsonrpc:"2.0",id:message.id,result:{protocolVersion:"2026-01-26",hostCapabilities:{serverTools:{},message:{text:{}}}}},"*");
  if(message.method==="ui/notifications/initialized")event.source.postMessage({jsonrpc:"2.0",method:"ui/notifications/tool-result",params:await(await fetch("/payload")).json()},"*");
});</script>`;
const server = createServer((request, response) => {
  response.setHeader("Content-Type", request.url === "/payload" ? "application/json" : "text/html");
  response.end(request.url === "/widget" ? html : request.url === "/payload" ? JSON.stringify(payload) : host);
});
await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
let browser;
try {
  const { chromium } = await import(pathToFileURL(modulePath).href);
  const executablePath = option("--browser-executable");
  browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  const page = await browser.newPage();
  let pageErrorCount = 0;
  page.on("pageerror", () => { pageErrorCount++; });
  const address = server.address(); assert(address && typeof address !== "string");
  await page.goto(`http://127.0.0.1:${address.port}`);
  const frame = page.frames().find((candidate: { url(): string }) => candidate.url().endsWith("/widget")); assert(frame);
  try { await frame.locator("#widgetReport").waitFor({ state: "visible", timeout: 20000 }); }
  catch {
    const trace = await frame.locator("html").getAttribute("data-backlog-trace");
    throw new Error(`Full report did not render. Page errors: ${pageErrorCount}. Trace: ${trace}`);
  }
  assert.equal(pageErrorCount, 0, "Actual widget must not produce browser errors.");
  assert.equal(await frame.locator("#widgetEmpty").isVisible(), false);
  assert.equal(await frame.locator("#widgetStatus").textContent(), "Status: Ready");
  assert.equal(await frame.locator("#recordsFound").textContent(), String(report.tallies.workRecordsFound));
  if (process.argv.includes("--check-no-print")) {
    assert.equal(await frame.locator("#printReport, #printUnavailable").count(), 0);
    assert.equal(await frame.locator("#liveRefresh").isVisible(), true);
  }
  const screenshotPath = option("--screenshot");
  if (screenshotPath) await frame.locator("header.masthead").screenshot({ path: screenshotPath });
  await frame.locator("#filters [data-filter=all]").click();
  assert.equal(await frame.locator("#waveList article.wave").count(), report.records.length);
  if (process.argv.includes("--check-layout")) {
    const wave = frame.locator('#waveList article.wave[data-record-path="docs/work/2026-09-24-w25-r0-live-backlog-review-mcp-app"]');
    for (const width of [1200, 1024, 900, 820, 761, 760, 600]) {
      await page.locator("iframe").evaluate((element: HTMLIFrameElement, value: number) => { element.style.width = `${value}px`; }, width);
      const bounds = await wave.locator(".wave-overview").evaluate((overview: HTMLElement) => {
        const row = overview.getBoundingClientRect();
        const track = overview.querySelector(".track")?.getBoundingClientRect();
        return { rowRight: row.right, trackRight: track?.right ?? Infinity, rowScrollWidth: overview.scrollWidth, rowClientWidth: overview.clientWidth };
      });
      assert.ok(bounds.trackRight <= bounds.rowRight + 1, `W25 phase track overflows at ${width}px: ${JSON.stringify(bounds)}`);
      assert.ok(bounds.rowScrollWidth <= bounds.rowClientWidth + 1, `W25 row overflows at ${width}px: ${JSON.stringify(bounds)}`);
      if (width === 820 && option("--layout-screenshot")) await wave.screenshot({ path: option("--layout-screenshot") });
    }
    await page.locator("iframe").evaluate((element: HTMLIFrameElement) => { element.style.width = "1200px"; });
  }
  if (process.argv.includes("--check-live-controls")) {
    const wave = frame.locator('#waveList article.wave[data-record-path="docs/work/2026-09-24-w25-r0-live-backlog-review-mcp-app"]');
    if (await wave.locator(".wave-overview").getAttribute("aria-expanded") === "false") await wave.locator(".wave-overview").click();
    assert.equal(await frame.locator("#waveList .copy-actions").count(), 0, "Live report must not show saved-report copy controls.");
    assert.equal(await wave.locator(".live-action-buttons button").count(), 2, "Live wave must have one Explain and one Work action.");
    const actionScreenshot = option("--action-screenshot");
    if (actionScreenshot) await wave.locator(".detail").screenshot({ path: actionScreenshot });
  }
  const openOnly = process.argv.includes("--open-only");
  if (!openOnly) {
  // Invoke the real local listener without waiting for a synthetic pointer reply.
  // This also supports an explicitly supplied browser build with a newer driver.
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([frame.locator("#openReportData").evaluate((button: HTMLButtonElement) => button.click()),
      new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error("Real Data action exceeded the 20-second check limit.")), 20000); })]);
  } finally { clearTimeout(timeout); }
  assert.equal(await frame.locator("#dataDialog").isVisible(), true);
  const actual = await frame.locator("#reportDataView").textContent();
  assert.deepEqual(JSON.parse(actual), report, "Data must preserve the full real report.");
  await frame.locator("#closeReportData").click();
  }
  const trace = JSON.parse(await frame.locator("html").getAttribute("data-backlog-trace"));
  assert(trace.some((entry: { event: string }) => entry.event === "render-passed"));
  assert(!trace.some((entry: { event: string }) => entry.event === "render-failed"));
  assert(trace.length <= 32);
  assert(!JSON.stringify(trace).includes(report.project.name));
  const requests = await page.evaluate(() => (window as unknown as { requests: string[] }).requests);
  assert(!requests.includes("ui/message") && !requests.includes("tools/call"), "Local controls must not request agent or tool work.");
  console.log(JSON.stringify({ state: "passed", renderer: "real", widget: generated ? "generated" : "source-bundled",
    records: report.records.length, sourceRecords: report.snapshot.records.length, exactData: !openOnly,
    localControlsOnly: true, browserVersion: browser.version(), explicitBrowser: !!executablePath, pageErrorCount, trace }, null, 2));
} finally {
  await browser?.close();
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
}
