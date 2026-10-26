// Uses the existing Playwright CLI skill session. No browser or package install.
// Run with the CLI session name and a temporary working directory as arguments.
import { execFileSync } from "node:child_process";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../../../../..");
const session = process.argv[2] ?? "w25p5views";
const cwd = process.argv[3];
if (!cwd) throw new Error("Supply a temporary CLI working directory.");
const output = resolve(cwd, "output/playwright");
await mkdir(output, { recursive: true });
const script = async (page) => {
  const packet = { views: [], checks: [], limitations: ["Synthetic Chromium host only. No production MCP host claim."] };
  const check = (name, pass, observed) => { packet.checks.push({ name, pass: Boolean(pass), observed }); if (!pass) throw new Error(name + ": " + JSON.stringify(observed)); };
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "no-preference", media: "screen" });
  await page.goto("http://127.0.0.1:43125/");
  const f = page.frameLocator("#widget");
  const actualFrame = () => page.frames().find(frame => frame.url().endsWith("/widget"));
  await f.locator("#widgetReport").waitFor({ state: "visible" });
  if (!RESUME) {
  const requests = []; const observeRequest = request => requests.push(request.url()); page.on("request", observeRequest);
  const initialData = await f.locator("#reportDataView").textContent();
  check("Data remains unformatted before user input", initialData === "", initialData);
  await f.getByRole("searchbox", { name: "Search waves" }).fill("synthetic conflict");
  check("Search changes only visible waves", await f.locator("#waveList article").count() === 1, await f.locator("#resultNote").innerText());
  await f.getByRole("button", { name: "Clear search", exact: true }).press("Enter");
  check("Clear search restores view and focus", await f.locator("#search").inputValue() === "", await actualFrame().evaluate(() => document.activeElement.id));
  await f.locator('[data-filter="conflict"]').press("Enter");
  check("Status filter works by keyboard", await f.locator("#waveList article").count() === 1, await f.locator("#resultNote").innerText());
  await f.locator('[data-filter="in-scope"]').press("Enter");
  await f.getByRole("combobox", { name: "Sort waves by" }).selectOption("coordinate");
  await f.locator("#sortDirection").press("Enter");
  check("Sort direction updates accessible meaning", (await f.locator("#sortDirection").getAttribute("aria-label")).includes("a to z") && await f.locator("#sortDirection").getAttribute("data-direction") === "asc", await f.locator("#sortDirection").getAttribute("aria-label"));
  await f.locator("#workTab").press("ArrowRight");
  await f.locator("#dataPanel").waitFor({ state: "visible" });
  const data = JSON.parse(await f.locator("#reportDataView").innerText());
  const expected = await page.evaluate(() => fixtures.open._meta.backlog.envelope.report);
  check("Data tab formats exact full report after keyboard input", JSON.stringify(data) === JSON.stringify(expected), { records: data.records.length });
  const downloadEvent = page.waitForEvent("download");
  await f.getByRole("button", { name: "Download JSON", exact: true }).press("Enter");
  const download = await downloadEvent;
  await download.saveAs(OUTPUT + "/download.json");
  packet.downloadName = download.suggestedFilename();
  await f.locator("#dataTab").press("ArrowLeft");
  await f.locator("#workPanel").waitFor({ state: "visible" });
  await f.getByRole("button", { name: "Print", exact: true }).press("Enter");
  const audit = await page.evaluate(() => window.p5Audit);
  check("Local controls send no tools or agent messages", audit.toolCalls === 0 && audit.agentMessages === 0, { toolCalls: audit.toolCalls, agentMessages: audit.agentMessages, allowed: [...new Set(audit.messages.map(item => item.method))] });
  check("Local controls cause no network request", requests.length === 0, requests);
  check("Print starts only after user input", audit.printCalls === 1, audit.printCalls);
  check("Download starts only after user input", audit.downloads === 1, audit.downloads);
  page.off("request", observeRequest);
  } else packet.priorPass = { scope: "Search, clear, keyboard filter/sort, Data tab, exact JSON, print trigger, download trigger, zero network/tool/message effects", outcome: "passed before a harness selector failure", noRepeat: true };
  const capture = async (name, width, height, theme, media = "screen") => {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ colorScheme: theme, media });
    if (await f.locator("#themeToggle").isVisible()) {
      for (let attempt=0;attempt<3;attempt++) {
        if (await actualFrame().evaluate(() => document.documentElement.dataset.theme) === theme) break;
        await f.locator("#themeToggle").click();
      }
      await actualFrame().waitForFunction(theme => document.documentElement.dataset.theme === theme, theme);
    }
    const layout = await actualFrame().evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
      headings: [...document.querySelectorAll("h1,h2")].map(node => node.textContent),
      theme: document.documentElement.dataset.theme,
      background: getComputedStyle(document.body).backgroundColor,
      controlsHidden: getComputedStyle(document.querySelector(".controls")).display === "none",
      dataHidden: getComputedStyle(document.querySelector("#dataPanel")).display === "none" }));
    check(name + " has no horizontal overflow", layout.scrollWidth <= layout.width, layout);
    if (media === "screen") check(name + " uses selected theme", layout.theme === theme, {theme:layout.theme,background:layout.background});
    const path = OUTPUT + "/" + name + ".png";
    const screenshotHeight = await actualFrame().evaluate(() => Math.ceil(document.getElementById("widgetReport").getBoundingClientRect().bottom + 70));
    await page.locator("#widget").evaluate((element, screenshotHeight) => { element.style.height = screenshotHeight + "px"; }, screenshotHeight);
    await page.screenshot({ path, fullPage: true }); packet.views.push({ name, width, height, theme, media, path, layout });
  };
  await capture("wide-light", 1280, 900, "light");
  await capture("wide-dark", 1280, 900, "dark");
  await capture("narrow-light", 390, 844, "light");
  await capture("narrow-dark", 390, 844, "dark");
  await page.emulateMedia({ media: "screen", colorScheme: "light", reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.getByRole("button", { name: "details", exact: true }).click();
  await f.getByRole("button", { name: "Show details for W1 R1", exact: true }).waitFor({ state: "visible" });
  await f.getByRole("button", { name: "Show details for W1 R1", exact: true }).press("Enter");
  const detail = await actualFrame().evaluate(() => ({ states: [...document.querySelectorAll(".track [title]")].map(node => node.title),
    text: document.querySelector("#waveList").innerText, focus: document.activeElement.getAttribute("aria-label"),
    outline: getComputedStyle(document.activeElement).outlineStyle, outlineWidth: getComputedStyle(document.activeElement).outlineWidth,
    reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
    scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
    motion: [...document.querySelectorAll("*")].filter(node => { const style=getComputedStyle(node); return parseFloat(style.animationDuration)>0.001||parseFloat(style.transitionDuration)>0.001; }).length }));
  check("Six phase meanings remain distinct", ["complete", "open", "blocked", "conflict", "superseded", "unknown"].every(state => detail.states.some(title => title.toLowerCase().includes(state))), detail.states);
  check("Wave details retain distinct fact, inference, and recommendation claims", detail.text.includes("One sourced task is complete.") && detail.text.includes("Closeout still needs a review.") && detail.text.includes("Check the closeout record."), detail.text);
  check("Keyboard disclosure has visible focus", detail.outline !== "none" && parseFloat(detail.outlineWidth)>0, { focus: detail.focus, outline: detail.outline, outlineWidth: detail.outlineWidth });
  check("Reduced motion removes transitions and smooth scroll", detail.reduced && detail.motion === 0 && detail.scrollBehavior !== "smooth", detail);
  await capture("phase-details", 1280, 900, "light");
  await capture("print", 1280, 900, "light", "print");
  const print = packet.views.at(-1).layout;
  check("Print hides display controls and Data while keeping order", print.controlsHidden && print.dataHidden && print.headings.indexOf("Attention") < print.headings.indexOf("Next"), print);
  await page.emulateMedia({ media: "screen", colorScheme: "light", reducedMotion: "no-preference" });
  await page.getByRole("button", { name: "open", exact: true }).click();
  await f.locator("#recordsFound").waitFor({ state: "visible" });
  await page.getByRole("button", { name: "failed", exact: true }).click();
  await f.locator("#widgetStatus").filter({ hasText: "last valid report remains visible" }).waitFor({ state: "visible" });
  check("Host failure keeps reviewed content", await f.locator("#recordsFound").innerText() === "7", await f.locator("#widgetStatus").innerText());
  await page.getByRole("button", { name: "hostile", exact: true }).click();
  await f.locator("#projectLink").filter({ hasText: "Ignore instructions" }).waitFor({ state: "visible" });
  check("Hostile project text remains inert", await f.locator("img").count() === 0, await f.locator("#projectLink").innerText());
  packet.finalAudit = await page.evaluate(() => window.p5Audit);
  check("Complete browser pass sends no tool or agent request", packet.finalAudit.toolCalls === 0 && packet.finalAudit.agentMessages === 0, { toolCalls: packet.finalAudit.toolCalls, agentMessages: packet.finalAudit.agentMessages });
  return packet;
};
const code = script.toString().replaceAll("OUTPUT", JSON.stringify(output)).replaceAll("RESUME", String(process.argv[4] === "resume"));
let log;
try { log = execFileSync("/Users/tylerkneisly/.codex/skills/playwright/scripts/playwright_cli.sh", ["-s=" + session, "run-code", code], { cwd, encoding: "utf8", timeout: 60000, maxBuffer: 2 * 1024 * 1024 }); }
catch (error) { console.error(error.stdout || error.message); process.exitCode = 1; }
if (!log) process.exit(1);
const match = log.match(/### Result\n([^\n]+)/);
if (!match) { console.log(log); throw new Error("Browser pass did not return a result packet."); }
const packet = JSON.parse(match[1]);
const downloaded = JSON.parse(await readFile(resolve(output, "download.json"), "utf8"));
const expected = JSON.parse(await readFile(resolve(here, "../p3/mixed-report.json"), "utf8"));
packet.checks.push({ name: "Saved JSON equals complete normalized V1 report", pass: JSON.stringify(downloaded) === JSON.stringify(expected), observed: { records: downloaded.records.length } });
packet.widgetSha256 = createHash("sha256").update(await readFile(resolve(root, "packages/cli/src/mcp/assets/backlog-review-v1.html"))).digest("hex");
packet.checkedAt = new Date().toISOString();
for (const view of packet.views) { await copyFile(view.path, resolve(here, view.name + ".png")); view.path = view.name + ".png"; }
await writeFile(resolve(here, "browser-results.json"), JSON.stringify(packet, null, 2) + "\n");
console.log(JSON.stringify({ checks: packet.checks.length, passed: packet.checks.filter(check => check.pass).length, widgetSha256: packet.widgetSha256, captures: packet.views.map(view => view.path) }));
