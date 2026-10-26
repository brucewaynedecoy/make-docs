// Affected-only proof after the Data-to-Work auto-height repair.
import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../../../../..");
const session = process.argv[2] ?? "w25p5views";
const cwd = process.argv[3];
if (!cwd) throw new Error("Supply the temporary CLI working directory.");
const check = async page => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.emulateMedia({ media: "screen", colorScheme: "light", reducedMotion: "reduce" });
  await page.goto("http://127.0.0.1:43125/?sizing=exact");
  const f = page.frameLocator("#widget");
  await f.locator("#widgetReport").waitFor({ state: "visible" });
  await page.getByRole("button", { name: "details", exact: true }).click();
  await f.getByRole("button", { name: "Show details for W1 R1", exact: true }).waitFor({ state: "visible" });
  const measure = () => page.evaluate(() => {
    const frame = document.getElementById("widget");
    const doc = frame.contentDocument;
    return { iframeHeight: frame.clientHeight, bodyContentEdge: Math.ceil(doc.body.getBoundingClientRect().bottom + frame.contentWindow.scrollY),
      reportBottom: Math.ceil(doc.querySelector("#widgetReport").getBoundingClientRect().bottom + frame.contentWindow.scrollY),
      lastSize: window.p5Audit.messages.filter(item => item.method === "ui/notifications/size-changed").at(-1).params.height };
  });
  const before = await measure();
  await f.locator("#workTab").press("ArrowRight");
  await f.locator("#dataPanel").waitFor({ state: "visible" });
  await page.waitForFunction(() => { const f=document.querySelector("#widget");return Math.abs(f.clientHeight-Math.ceil(f.contentDocument.body.getBoundingClientRect().bottom+f.contentWindow.scrollY))<=1; });
  const data = await measure();
  await f.locator("#dataTab").press("ArrowLeft");
  await f.locator("#workPanel").waitFor({ state: "visible" });
  await page.waitForFunction(() => { const f=document.querySelector("#widget");return Math.abs(f.clientHeight-Math.ceil(f.contentDocument.body.getBoundingClientRect().bottom+f.contentWindow.scrollY))<=1; });
  const after = await measure();
  const audit = await page.evaluate(() => window.p5Audit);
  await page.screenshot({path: OUTPUT + "/after-size-repair.png",fullPage:true});
  return { before, data, after, pass: after.iframeHeight < data.iframeHeight && after.iframeHeight === after.lastSize && after.reportBottom <= after.iframeHeight + 1,
    toolCalls: audit.toolCalls, agentMessages: audit.agentMessages, limit: "Synthetic host honors size notification exactly. No production host test." };
};
let log;
try { log = execFileSync("<LOCAL_HOME>/.codex/skills/playwright/scripts/playwright_cli.sh", ["-s=" + session, "run-code", check.toString().replaceAll("OUTPUT",JSON.stringify(here))], { cwd, encoding: "utf8", timeout: 40000, maxBuffer: 65536 }); }
catch (error) { console.error(error.stdout || error.message); process.exit(1); }
const match = log.match(/### Result\n([^\n]+)/);
if (!match) throw new Error("No size check result returned.");
const result = JSON.parse(match[1]);
result.widgetSha256 = createHash("sha256").update(await readFile(resolve(root, "packages/cli/src/mcp/assets/backlog-review-v1.html"))).digest("hex");
result.checkedAt = new Date().toISOString();
result.previousFinding = "A prior enlarged iframe can impose a viewport minimum on documentElement.scrollHeight. The first long captures included synthetic host framing. This retest uses exact size delivery and the taller Data state of a one-record phase fixture.";
result.capture = "after-size-repair.png";
result.reusedEvidence = { packet: "browser-results.json", scope: "Unchanged report DOM, CSS, controls, meaning, themes, print and safe-text checks. Only auto-height logic changed." };
await writeFile(resolve(here, "size-results.json"), JSON.stringify(result, null, 2) + "\n");
console.log(JSON.stringify(result));
if (!result.pass || result.toolCalls !== 0 || result.agentMessages !== 0) process.exitCode = 1;
