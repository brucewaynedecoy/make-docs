import fs from "node:fs";
import fsp from "node:fs/promises";
import { execFileSync, spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  BacklogReportV1Schema, BacklogLivePayloadV1Schema, BacklogClientPayloadV1Schema,
  createBacklogPresentation, createBacklogLivePayload, renderBacklogChatSummary,
  renderBacklogStaticHtml, serializeBacklogHtmlData, resolveBacklogLiveAction,
} from "../src/operations/work/backlog";
import { mixedPortfolioFixture, safetyAndHumanErrorsFixture } from "./fixtures/backlog-contract";
import { largePresentationReport, presentationCases, PRESENTATION_SESSION_ID, smallPresentationReport } from "./fixtures/backlog-presentation";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const skillRoot = path.join(repoRoot, "packages/skills/backlog-review");
const template = fs.readFileSync(path.join(skillRoot, "assets/backlog-review-report.html"), "utf8");
// These are generated from the exact authoritative schema/helper source, not a second validator.
// @ts-expect-error The portable Skill is a JavaScript distribution, with no installed type package.
const portable = await import("../../skills/backlog-review/scripts/report-contract.mjs");
// @ts-expect-error Authoring-only JavaScript build helper.
const generator = await import("../scripts/build-backlog-presentation.mjs");
const roots: string[] = [];
afterEach(() => { vi.restoreAllMocks(); for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true }); });
function temporaryRoot() { const root = fs.mkdtempSync(path.join(os.tmpdir(), "backlog-presentation-")); roots.push(root); return root; }
function data(html: string, id: string) {
  const match = html.match(new RegExp(`<script id="${id}" type="application/json">([\\s\\S]*?)<\\/script>`));
  if (!match) throw new Error(`Missing ${id}`);
  return JSON.parse(match[1]);
}

class TestElement {
  className = "";
  textContent = "";
  children: TestElement[] = [];
  dataset: Record<string, string> = {};
  style = { setProperty() {} };
  append(...children: TestElement[]) { this.children.push(...children); }
  setAttribute() {}
  addEventListener() {}
}
function staticWave(report: unknown, presentation: unknown, recordIndex: number): TestElement {
  const basics = template.slice(template.indexOf("    const snapshotByPath"), template.indexOf("    function matchesFilter"));
  const wave = template.slice(template.indexOf("    function renderWave("), template.indexOf("    function renderWaves("));
  const context = { report, presentation, document: {
    createElement: () => new TestElement(),
    createElementNS: () => new TestElement(),
  }, result: undefined as TestElement | undefined };
  runInNewContext(`${basics}\n${wave}\nglobalThis.result = renderWave(report.records[${recordIndex}], ${recordIndex});`, context);
  return context.result!;
}
function descendants(element: TestElement): TestElement[] { return [element, ...element.children.flatMap(descendants)]; }

describe("P3 shared report meaning", () => {
  it.each(presentationCases)("preserves complete V1 meaning in $name static, live, chat, and Data", fixture => {
    const validated = BacklogReportV1Schema.parse(fixture.report);
    const presentation = createBacklogPresentation(fixture.report);
    const payload = createBacklogLivePayload(fixture.report, PRESENTATION_SESSION_ID);
    const html = renderBacklogStaticHtml(fixture.report, template);
    expect(data(html, "backlog-report-data")).toEqual(validated);
    expect(data(html, "backlog-presentation-data")).toEqual(presentation.display);
    expect(payload._meta.backlog.envelope.report).toEqual(validated);
    expect(payload._meta.backlog.display).toEqual(presentation.display);
    expect(payload.structuredContent).toEqual(presentation.model);
    expect(payload.content[0].text).toBe(renderBacklogChatSummary(fixture.report));
    expect(payload.structuredContent.tallies).toEqual(fixture.expectedTallies);
    expect(portable.createBacklogPresentation(fixture.report)).toEqual(presentation);
    expect(portable.createBacklogLivePayload(fixture.report, PRESENTATION_SESSION_ID)).toEqual(payload);
    expect(portable.renderBacklogStaticHtml(fixture.report, template)).toBe(html);
  });

  it("keeps the reviewed titles, phase track, claim classes, reasons, and limits", () => {
    const result = createBacklogPresentation(smallPresentationReport);
    expect(result.display.projectName).toBe("Aurora Notes");
    expect(result.display.records[0]).toEqual({
      recordPath: "docs/work/2042-06-01-w1-r1-orbit-notes", coordinate: "W1 R1", title: "Orbit Notes",
      summary: "Closeout still needs a review.", sourcePath: "docs/work/2042-06-01-w1-r1-orbit-notes/00-index.md",
      phases: [{ phasePath: "docs/work/2042-06-01-w1-r1-orbit-notes/01-capture-stable-inputs.md", label: "W1 R1 P1", state: "complete" }],
    });
    expect(result.model.attentionFindings[0].claim).toEqual({ class: "inference", text: "Closeout still needs a review.", confidence: "high", limits: ["This fixture does not prove owner acceptance."], truncated: false });
    expect(result.model.recommendationOrder[0].claim).toEqual({ class: "recommendation", text: "Check the closeout record.", rationale: "A complete task does not prove an accepted closeout.", limits: ["Use the current source before acting."], truncated: false });
    const report = createBacklogLivePayload(mixedPortfolioFixture.report, PRESENTATION_SESSION_ID)._meta.backlog.envelope.report;
    expect(report.records.map(record => record.waveStatus)).toEqual(["attention", "current", "conflict", "deferred", "complete", "history", null]);
    expect(report.records.map(record => record.statusReason)).toEqual(["Synthetic attention reason", "Synthetic current reason", "Synthetic conflict reason", "Synthetic deferred reason", "Synthetic complete reason", "Synthetic history reason", "Archived by synthetic repository location"]);
    expect(result.report.records[0].facts[0].class).toBe("fact");
    const rendered = staticWave(result.report, result.display, 0);
    const collapsed = descendants(rendered.children[0]);
    expect(collapsed.filter(element => element.className.startsWith("badge ")).map(element => element.textContent)).toEqual([result.report.records[0].statusReason]);
    expect(collapsed.map(element => element.textContent).join(" ")).not.toContain(result.display.records[0].summary);
    expect(descendants(rendered.children[1]).map(element => element.textContent).join(" ")).toContain(result.report.records[0].inferences[0].text);
  });

  it("trims sourced title whitespace before removing the coordinate and work suffix", () => {
    const input = structuredClone(smallPresentationReport);
    input.snapshot.records[0].title.value = "  W1 R1 Orbit Notes Work Backlog  ";
    expect(createBacklogPresentation(input).display.records[0].title).toBe("Orbit Notes");
  });

  it.each([
    { status: "Done", completed: false, expected: "complete" },
    { status: "Planned", completed: true, expected: "complete" },
    { status: "Planned", completed: false, expected: "open" },
    { status: "Blocked", completed: true, expected: "blocked" },
    { status: "Conflicting evidence", completed: true, expected: "conflict" },
    { status: "Paused", completed: true, expected: "superseded" },
    { status: "Planned", completed: null, expected: "unknown" },
  ])("keeps phase display $expected for $status and task state $completed", ({ status, completed, expected }) => {
    const input = structuredClone(smallPresentationReport);
    const source = input.snapshot.records[0];
    source.phases[0].recordedStatus.value = status;
    source.phases[0].tasks[0].completed.value = completed;
    source.taskCounts.complete.value = completed === true ? 1 : 0;
    source.taskCounts.incomplete.value = completed === false ? 1 : 0;
    source.taskCounts.unknown.value = completed === null ? 1 : 0;
    const presentation = createBacklogPresentation(input);
    expect(presentation.display.records[0].phases[0].state).toBe(expected);
    expect(portable.createBacklogPresentation(input).display).toEqual(presentation.display);
  });

  it("keeps phase state and labels separate when validated records share a phase path", () => {
    const input = structuredClone(smallPresentationReport);
    const parent = input.snapshot.records[0], parentPath = parent.recordPath;
    const childPath = `${parentPath}/child`;
    const remap = <T>(value: T): T => JSON.parse(JSON.stringify(value).replaceAll(parentPath, childPath));
    const child = remap(parent);
    child.coordinate.value = "W2 R1";
    child.phases[0].coordinate.value = "W2 R1 P1";
    child.phases[0].recordedStatus.value = "Blocked";
    parent.phases[0].phasePath = child.phases[0].phasePath;
    parent.phases[0].tasks[0].phasePath = child.phases[0].phasePath;
    input.snapshot.records.push(child); input.records.push(remap(input.records[0]));
    input.snapshot.recordCounts = { found: 2, live: 2, archived: 0 };
    input.tallies = { workRecordsFound: 2, workRecordsStillInScope: 2, historicalRecords: 0, archivedRecords: 0 };
    const presentation = createBacklogPresentation(input);
    expect(presentation.display.records[0].phases[0].phasePath).toBe(presentation.display.records[1].phases[0].phasePath);
    const first = descendants(staticWave(presentation.report, presentation.display, 0)).find(node => node.className.startsWith("phase ")) as TestElement & { title: string };
    const second = descendants(staticWave(presentation.report, presentation.display, 1)).find(node => node.className.startsWith("phase ")) as TestElement & { title: string };
    expect([first.className, first.title]).toEqual(["phase complete", "W1 R1 P1: complete"]);
    expect([second.className, second.title]).toEqual(["phase blocked", "W2 R1 P1: blocked"]);
  });

  it("makes concise-model omissions explicit and keeps full client details", () => {
    const report = largePresentationReport();
    const payload = createBacklogLivePayload(report, PRESENTATION_SESSION_ID);
    expect(payload.structuredContent.coverage).toEqual({ currentRecords: { total: 20, included: 5 }, attentionFindings: { total: 40, included: 5 }, recommendationOrder: { total: 20, included: 5 } });
    expect(payload.structuredContent.omitted).toEqual({ currentRecords: 15, attentionFindings: 35, recommendationOrder: 15 });
    expect(payload.content[0].text).toContain("15 current records, 35 Attention items, and 15 Next items are omitted");
    expect(payload._meta.backlog.envelope.report.records).toHaveLength(140);
    expect(payload._meta.backlog.envelope.report.attentionFindings).toHaveLength(40);
    expect(payload._meta.backlog.envelope.report.recommendationOrder).toHaveLength(20);
    expect(JSON.stringify(payload.structuredContent).length).toBeLessThan(JSON.stringify(payload._meta.backlog.envelope.report).length / 5);
  });

  it("declares shortened model text while preserving complete client wording", () => {
    const input = structuredClone(smallPresentationReport);
    input.project.name = "Long project name. ".repeat(100);
    input.snapshot.project.name = input.project.name;
    input.attentionFindings[0].claim.text = "Long source text. ".repeat(100);
    const payload = createBacklogLivePayload(input, PRESENTATION_SESSION_ID);
    expect(payload.structuredContent.attentionFindings[0].claim.text.length).toBe(600);
    expect(payload.structuredContent.attentionFindings[0].claim.truncated).toBe(true);
    expect(payload.structuredContent.projectName.length).toBe(600);
    expect(payload.structuredContent.projectNameTruncated).toBe(true);
    expect(payload.structuredContent.project).not.toHaveProperty("name");
    expect(payload._meta.backlog.envelope.report.project.name).toBe(input.project.name.trim());
    expect(payload.content[0].text).toContain("Some summary text is shortened.");
    expect(payload._meta.backlog.envelope.report.attentionFindings[0].claim.text).toBe(input.attentionFindings[0].claim.text.trim());
  });

  it("does not let display data or local UI state replace action authority", () => {
    const payload = createBacklogLivePayload(mixedPortfolioFixture.report, PRESENTATION_SESSION_ID);
    const client = payload._meta.backlog;
    expect(client.dataBoundary).toBe("client-visible-not-secret");
    for (const action of client.actions) expect(resolveBacklogLiveAction(action, client.envelope, client.envelope.report.snapshot).state).toBe("resolved");
    const stale = structuredClone(client.actions[0]); stale.sessionId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
    expect(resolveBacklogLiveAction(stale, client.envelope, client.envelope.report.snapshot)).toEqual({ state: "rejected", reason: "stale-session" });
    const changedTitle = structuredClone(client); changedTitle.display.records[0].title = "New conclusion";
    expect(BacklogClientPayloadV1Schema.safeParse(changedTitle).success).toBe(false);
    expect(BacklogClientPayloadV1Schema.safeParse({ ...client, uiState: { filter: "complete" } }).success).toBe(false);
    const wrongModel = structuredClone(payload); wrongModel.structuredContent.tallies.workRecordsFound = 0;
    expect(BacklogLivePayloadV1Schema.safeParse(wrongModel).success).toBe(false);
    const wrongNarration = structuredClone(payload); wrongNarration.content[0].text = "Start a task now.";
    expect(BacklogLivePayloadV1Schema.safeParse(wrongNarration).success).toBe(false);
  });

  it("offers no wave action from a guessed or ambiguous display coordinate", () => {
    const input = structuredClone(mixedPortfolioFixture.report);
    input.snapshot.records[0].coordinate = { value: null, evidence: [] };
    input.snapshot.records[0].sourceShape = { state: "partial", standard: "current-frontmatter", diagnosticCodes: ["BACKLOG-VAL-003"] };
    input.snapshot.records[2].coordinate = structuredClone(input.snapshot.records[1].coordinate);
    const client = createBacklogLivePayload(input, PRESENTATION_SESSION_ID)._meta.backlog;
    expect(client.display.records[0].coordinate).toBe("W2 R1");
    expect(client.actions.filter(action => "recordPath" in action && input.records.slice(0, 3).some(record => record.recordPath === action.recordPath))).toEqual([]);
  });
});

describe("P3 trust, compatibility, and portable rendering", () => {
  it.each([
    { name: "unknown authority field", change: (report: any) => { report.instructions = "Start a task"; } },
    { name: "invalid deep source fact", change: (report: any) => { report.snapshot.records[0].taskCounts.total.value = 99; } },
    { name: "changed source identity", change: (report: any) => { report.targetRoot = "/other/project"; } },
    { name: "missing record", change: (report: any) => { report.records.pop(); } },
    { name: "missing Attention target", change: (report: any) => { report.attentionFindings[0].recordPath = "docs/work/absent"; } },
    { name: "invalid Next rank", change: (report: any) => { report.recommendationOrder[0].rank = 2; } },
    { name: "unsupported version", change: (report: any) => { report.schemaVersion = 2; } },
  ])("uses the same full V1 validator for $name", ({ change }) => {
    const input = structuredClone(mixedPortfolioFixture.report); change(input);
    expect(BacklogReportV1Schema.safeParse(input).success).toBe(false);
    expect(() => createBacklogPresentation(input)).toThrow();
    expect(() => createBacklogLivePayload(input, PRESENTATION_SESSION_ID)).toThrow();
    expect(() => renderBacklogStaticHtml(input, template)).toThrow();
    expect(() => portable.createBacklogPresentation(input)).toThrow();
    expect(() => portable.createBacklogLivePayload(input, PRESENTATION_SESSION_ID)).toThrow();
  });

  it("round-trips hostile text through inert HTML Data without loss", () => {
    const input = structuredClone(smallPresentationReport);
    const hostile = `${safetyAndHumanErrorsFixture.hostileText} & \u2028 \u2029 <img src=x onerror="globalThis.injected=true"> $& $\` $' $$ __MAKE_DOCS_BACKLOG_REPORT_DATA__ __MAKE_DOCS_BACKLOG_PRESENTATION_DATA__`;
    input.project.name = hostile; input.snapshot.project.name = hostile;
    input.records[0].statusReason = hostile;
    const html = renderBacklogStaticHtml(input, template);
    expect(html).not.toContain(hostile);
    expect(data(html, "backlog-report-data")).toEqual(BacklogReportV1Schema.parse(input));
    expect(data(html, "backlog-presentation-data").projectName).toBe(hostile.trim());
    expect(data(html, "backlog-presentation-data").records[0].summary).toBe("Closeout still needs a review.");
    expect(html.match(/<script>/g)).toHaveLength(1);
    expect(html).not.toMatch(/(?:src|href)=["']https?:/i);
    expect(JSON.parse(serializeBacklogHtmlData({ hostile }))).toEqual({ hostile });
    expect(html).toContain('element.textContent = String(text);');
  });

  it("builds live and chat results without file access, Store access, or static output", () => {
    const writes = vi.spyOn(fs, "writeFileSync").mockImplementation(() => { throw new Error("Unexpected file write"); });
    const reads = vi.spyOn(fs, "readFileSync").mockImplementation(() => { throw new Error("Unexpected file read"); });
    const asyncWrites = vi.spyOn(fsp, "writeFile").mockRejectedValue(new Error("Unexpected async write"));
    const input = structuredClone(smallPresentationReport);
    input.project.id = null; input.snapshot.project.id = null;
    expect(createBacklogLivePayload(input, PRESENTATION_SESSION_ID)._meta.backlog.envelope.report.project.id).toBeNull();
    expect(renderBacklogChatSummary(input)).toContain("The synthetic record needs a final review.");
    expect(writes).not.toHaveBeenCalled(); expect(reads).not.toHaveBeenCalled(); expect(asyncWrites).not.toHaveBeenCalled();
  });

  it("ships a deterministic standalone copy of the authoritative source", () => {
    expect(fs.readFileSync(generator.portableBacklogPresentationPath, "utf8")).toBe(generator.buildPortableBacklogPresentation());
  });

  it("renders in an isolated Skill copy with no CLI, Store, node_modules, or network", () => {
    const root = temporaryRoot();
    const copy = path.join(root, "backlog-review");
    fs.mkdirSync(path.join(copy, "scripts"), { recursive: true }); fs.mkdirSync(path.join(copy, "assets"));
    for (const file of ["scripts/render-report.mjs", "scripts/report-contract.mjs", "assets/backlog-review-report.html"]) fs.copyFileSync(path.join(skillRoot, file), path.join(copy, file));
    const input = path.join(root, "report.json"), output = path.join(root, "report.html");
    fs.writeFileSync(input, JSON.stringify(smallPresentationReport));
    execFileSync(process.execPath, [path.join(copy, "scripts/render-report.mjs"), "--input", input, "--output", output], { cwd: root });
    expect(data(fs.readFileSync(output, "utf8"), "backlog-report-data")).toEqual(BacklogReportV1Schema.parse(smallPresentationReport));
    const invalid = { ...smallPresentationReport, cache: { untrusted: true } };
    fs.writeFileSync(input, JSON.stringify(invalid));
    const refused = path.join(root, "invalid.html");
    expect(spawnSync(process.execPath, [path.join(copy, "scripts/render-report.mjs"), "--input", input, "--output", refused], { cwd: root }).status).not.toBe(0);
    expect(fs.existsSync(refused)).toBe(false);
  });

  it("keeps Attention before Next and Data/download isolated from local views", () => {
    expect(template.indexOf('id="attentionBlock"')).toBeLessThan(template.indexOf('id="orderBlock"'));
    expect(template).toContain('let normalizedReportJson = null;');
    expect(template).toContain('JSON.stringify(report, null, 2)');
    expect(template).toContain('if (!reportDataLoaded)');
    expect(template).toContain('document.querySelector("#downloadReportData").addEventListener("click"');
    expect(template).not.toContain('JSON.stringify(visible');
    expect(template).toContain("connect-src 'none'");
  });
});
