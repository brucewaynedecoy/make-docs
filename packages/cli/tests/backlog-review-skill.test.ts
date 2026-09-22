import { execFileSync, spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { runInNewContext } from "node:vm";

import { describe, expect, test } from "vitest";
import { parse } from "yaml";

import { buildEmbeddedSkillBundle } from "../scripts/embedded-skills";
import {
  AgentResponseSemanticExpectationSchema,
  BACKLOG_RULES,
  BacklogReportV1Schema,
} from "../src/operations/work/backlog";
import { loadSkillRegistry } from "../src/skill-registry";
import { PACKAGE_ROOT } from "../src/utils";
import { mixedPortfolioFixture } from "./fixtures/backlog-contract";

const SKILL_ROOT = path.join(PACKAGE_ROOT, "../skills/backlog-review");

const read = (relativePath: string): string =>
  readFileSync(path.join(SKILL_ROOT, relativePath), "utf8");

describe("backlog-review first-party Skill", () => {
  test("declares one complete portable payload", () => {
    const entry = loadSkillRegistry(PACKAGE_ROOT).skills.find(
      (candidate) => candidate.name === "backlog-review",
    );

    expect(entry).toMatchObject({
      displayName: "Backlog Review",
      source: "embedded:backlog-review",
      entryPoint: "SKILL.md",
      purposes: ["backlog-review"],
      supportedHarnesses: ["claude-code", "codex"],
    });
    expect(entry?.assets.map((asset) => asset.source)).toEqual([
      "agents/openai.yaml",
      "references/review-method.md",
      "references/report-model.md",
      "references/fallback.md",
      "references/cache.md",
      "references/rule-map.md",
      "examples/chat-reports.md",
      "examples/human-errors.json",
      "references/html-report.md",
      "scripts/render-report.mjs",
      "scripts/collect-project-lead-context.mjs",
      "assets/backlog-review-report.html",
    ]);
    for (const source of [entry!.entryPoint, ...entry!.assets.map((asset) => asset.source)]) {
      expect(existsSync(path.join(SKILL_ROOT, source))).toBe(true);
    }

    const bundle = buildEmbeddedSkillBundle(PACKAGE_ROOT);
    expect(Object.keys(bundle.payloads["backlog-review"].files).sort()).toEqual(
      [entry!.entryPoint, ...entry!.assets.map((asset) => asset.source)].sort(),
    );
  });

  test("keeps every Skill link inside the extracted package", () => {
    const body = read("SKILL.md");
    for (const match of body.matchAll(/\]\(([^)]+)\)/g)) {
      const link = match[1];
      expect(link.includes("://")).toBe(false);
      const target = path.resolve(SKILL_ROOT, link);
      expect(target.startsWith(`${SKILL_ROOT}${path.sep}`)).toBe(true);
      expect(existsSync(target)).toBe(true);
    }

    const metadata = parse(read("agents/openai.yaml"));
    expect(metadata.interface.default_prompt).toContain("$backlog-review");
    expect(metadata.policy.allow_implicit_invocation).toBe(true);
  });

  test("maps every stable rule and marks judgment-only work", () => {
    const ruleMap = read("references/rule-map.md");
    const mapped = new Set(
      [...ruleMap.matchAll(/\| (BACKLOG-RULE-\d{3}) \|/g)].map((match) => match[1]),
    );
    expect(mapped).toEqual(new Set(BACKLOG_RULES.map((rule) => rule.id)));

    for (const rule of BACKLOG_RULES) {
      expect(ruleMap).toContain(`| ${rule.id} |`);
      if (rule.deterministicSupport === "agent-only") {
        expect(ruleMap.match(new RegExp(`\\| ${rule.id} \\|[^\\n]*Judgment-only`, "i"))).not.toBeNull();
      }
    }
  });

  test("uses the shared report contract and all six fixed live statuses", () => {
    expect(BacklogReportV1Schema.safeParse(mixedPortfolioFixture.report).success).toBe(true);
    expect(
      mixedPortfolioFixture.report.records
        .filter((record) => record.scope === "live")
        .map((record) => record.waveStatus),
    ).toEqual([
      "attention",
      "current",
      "conflict",
      "deferred",
      "complete",
      "history",
    ]);

    const model = read("references/report-model.md");
    for (const label of [
      "work records found",
      "records in scope",
      "historical records",
      "archived records",
    ]) {
      expect(model).toContain(label);
    }
    expect(model).toContain("one to three decisive references");
    expect(model).toContain("Never copy a whole record's evidence catalog");
    expect(model).toContain("The project lead is a short project description");
    expect(model).toContain("Do not include backlog counts, report metrics");
    expect(model).toContain(
      "Every `recommendationOrder` item is wave-specific. Its `recordPath` must match exactly one report record.",
    );
    expect(model).toContain("uses null for a backlog-wide finding");
    expect(model).toContain("fixed label `Backlog finding`");
    expect(model).toContain("Use the claim as the item's main heading in both Next and Attention.");
    expect(model).toContain("Do not repeat an item's own wave coordinate in its claim only to identify the item.");
  });

  test("keeps response meaning structured without freezing report prose", () => {
    const expectations = JSON.parse(read("examples/human-errors.json"));
    const parsed = AgentResponseSemanticExpectationSchema.array().parse(expectations);
    expect(parsed.map((item) => item.humanAction.state)).toEqual([
      "required",
      "optional",
    ]);

    const examples = read("examples/chat-reports.md");
    for (const heading of [
      "## Small portfolio",
      "## Medium portfolio",
      "## Large portfolio",
      "## Conflict-heavy portfolio",
    ]) {
      expect(examples).toContain(heading);
    }
    expect(examples).toContain("Source method:");
    expect(examples).toContain("### Next");
    expect(examples).toContain("### Attention");
    expect(examples).toContain("**Backlog finding**");
    expect(examples).not.toContain("### Needs attention");
  });

  test("runs the current snapshot before exact cache reuse and refreshes fresh fragments", () => {
    const skill = read("SKILL.md");
    const cache = read("references/cache.md");

    expect(skill.indexOf("Start every review with one fact source")).toBeLessThan(
      skill.indexOf("try the optional cache lookup"),
    );
    expect(cache).toContain("make_docs_work_backlog_cache_lookup");
    expect(cache).toContain("make-docs run work backlog-cache lookup");
    expect(cache).toContain("make_docs_work_backlog_cache_write");
    expect(cache).toContain("make-docs run work backlog-cache write");
    expect(cache).toContain("Never reuse a portfolio conclusion from cache.");
    expect(skill).toContain("attempt a cache write for every freshly reviewed `miss` or `rejected` record");
    expect(cache).toContain("attempt to cache each freshly reviewed fragment");
    expect(cache).toContain("Do not write exact-hit fragments again.");
    expect(cache).toContain("repository bodies, prompts, secrets, raw logs, absolute paths");
    expect(cache).toContain("does not change the current snapshot, report records, or report result");
    expect(read("references/fallback.md")).toContain("does not read, imitate, or create cache state");
  });

  test("renders one offline HTML file with inert project text", () => {
    const temporaryRoot = mkdtempSync(path.join(os.tmpdir(), "make-docs-backlog-report-"));
    try {
      const inputPath = path.join(temporaryRoot, "report.json");
      const outputPath = path.join(temporaryRoot, "report.html");
      const report = structuredClone(mixedPortfolioFixture.report);
      const hostileProject = '<img src=x onerror="globalThis.injected=true">';
      const hostileReason = "</script><script>globalThis.injected=true</script>";
      const hostileLead = '<svg onload="globalThis.injected=true"> describes the project.';
      report.project.name = hostileProject;
      report.snapshot.project.name = hostileProject;
      report.records[0].statusReason = hostileReason;
      if (!report.projectLead) throw new Error("Synthetic report needs a project lead.");
      report.projectLead.sentences[0].text = hostileLead;
      writeFileSync(inputPath, JSON.stringify(report), "utf8");

      execFileSync(process.execPath, [
        path.join(SKILL_ROOT, "scripts/render-report.mjs"),
        "--input",
        inputPath,
        "--output",
        outputPath,
      ]);

      const html = readFileSync(outputPath, "utf8");
      expect(html).toContain("default-src 'none'");
      expect(html).toContain("connect-src 'none'");
      expect(html).toContain("In Scope");
      expect(html).toContain("Showing ${visible.length} of ${report.records.length} records.");
      expect(html).toContain("stroke: currentColor");
      expect(html).toContain("--paper: #f5f7fb;");
      expect(html).toContain("--accent: #3159d8;");
      expect(html).toContain("--accent-line: #7187b6;");
      expect(html).toContain("--paper: #111111;");
      expect(html).toContain("--line-strong: #484850;");
      expect(html).toContain("--accent: #75adff;");
      expect(html).toContain("--accent-line: #3e5f8a;");
      expect(html).toContain(
        ':root[data-theme="dark"] .masthead { border-top-color: var(--line-strong); }',
      );
      expect(html).toContain("#projectLink, #projectFooterLink { color: var(--accent); }");
      expect(html).toContain("Work Backlog|Work");
      expect(html).toContain('kind === "error" ? "Error"');
      expect(html).not.toContain("function appendEvidence");
      expect(html).not.toContain("<strong>Evidence boundary.</strong>");
      expect(html).not.toContain("__MAKE_DOCS_BACKLOG_REPORT_DATA__");
      expect(html).not.toContain(hostileProject);
      expect(html).not.toContain(hostileReason);
      expect(html).not.toContain(hostileLead);
      expect(html).toContain("\\u003cimg src=x onerror");
      expect(html).toContain("\\u003c/script\\u003e\\u003cscript\\u003e");
      expect(html).toContain("\\u003csvg onload");
      expect(html).not.toContain("Review of ${report.tallies.workRecordsFound}");
      expect(html).toContain("report.projectLead.sentences.map");
      expect(html).toContain('<h2 id="ledgerHeading">Backlog</h2>');
      expect(html).toContain('class="backlog-tabs" role="tablist" aria-label="Backlog views"');
      expect(html).toContain('id="workTab" type="button" role="tab" aria-selected="true" aria-controls="workPanel"');
      expect(html).toContain('id="dataTab" type="button" role="tab" aria-selected="false" aria-controls="dataPanel"');
      expect(html).toContain('<h2>Attention</h2>');
      expect(html).not.toContain('<h2>Needs attention</h2>');
      expect(html).toContain('id="attentionBlock"');
      expect(html).toContain('id="orderBlock"');
      expect(html.indexOf('id="attentionBlock"')).toBeLessThan(
        html.indexOf('id="orderBlock"'),
      );
      expect(html).toContain(
        '.attention > section:not([hidden]) + section:not([hidden]) { margin-top: 42px; }',
      );
      expect(html).not.toContain('.attention-block { margin-top: 42px; }');
      expect(html).toContain('id="clearSearch"');
      expect(html).toContain('aria-label="Clear search"');
      expect(html).toContain('node("span", "action-coordinate"');
      expect(html).toContain('node("button", "report-action")');
      expect(html).toContain('record ? recordName(record) : "Backlog finding"');
      expect(html).toContain('copy.append(node("span", "action-coordinate", record ? recordName(record) : "Backlog finding"));');
      expect(html).toContain('copy.append(node("strong", "", claimText(finding.claim)));');
      expect(html).not.toContain('node("strong", "", record ? recordName(record) : "Backlog finding")');
      expect(html).not.toContain("Portfolio finding");
      expect(html).toContain("function focusBacklogRecord(record)");
      expect(html).toContain('setActiveFilter("all");');
      expect(html).toContain('searchInput.value = recordName(record);');
      expect(html).toContain('activateBacklogTab(document.querySelector("#workTab"));');
      expect(html).toContain('window.matchMedia("(prefers-reduced-motion: reduce)")');
      expect(html).toContain('id="workPanel" role="tabpanel" aria-labelledby="workTab"');
      expect(html).toContain('id="dataPanel" role="tabpanel" aria-labelledby="dataTab" hidden');
      expect(html).toContain("Complete normalized report data");
      expect(html).toContain('id="reportDataView" role="region" aria-label="Complete normalized report data" tabindex="0"');
      expect(html).not.toContain('id="toggleReportData"');
      expect(html).toContain("let normalizedReportJson = null;");
      expect(html).toContain("function getNormalizedReportJson()");
      expect(html).toContain('tab.dataset.backlogTab === "data" && !reportDataLoaded');
      expect(html).toContain("reportDataView.textContent = getNormalizedReportJson();");
      expect(html).toContain('["ArrowLeft", "ArrowRight", "Home", "End"]');
      expect(html).toContain('window.addEventListener("beforeprint"');
      expect(html).toContain('activateBacklogTab(document.querySelector("#workTab"));');
      expect(html).toContain('window.addEventListener("afterprint"');
      expect(html).toContain("#workPanel { display: block !important; }");
      expect(html).toContain(".backlog-tabs, #dataPanel { display: none !important; }");
      expect(html).toContain('.workspace { display: block; }');
      const tabControllerStart = html.indexOf("function activateBacklogTab");
      const tabControllerEnd = html.indexOf("const searchInput", tabControllerStart);
      expect(tabControllerStart).toBeGreaterThan(-1);
      expect(tabControllerEnd).toBeGreaterThan(tabControllerStart);
      expect(html.slice(tabControllerStart, tabControllerEnd)).not.toContain("renderWaves");
      expect(html).toContain("new Blob([getNormalizedReportJson()]");
      expect(html).not.toContain("reportDataView.textContent = normalizedReportJson;");
      expect(html).toContain('download.download = `${projectSlug}-backlog-review.json`;');
      expect(html).not.toContain("JSON.stringify(visible");
      const executableScripts = [...html.matchAll(/<script(?![^>]*type="application\/json")[^>]*>([\s\S]*?)<\/script>/g)]
        .map((match) => match[1]);
      expect(executableScripts).toHaveLength(1);
      expect(() => new Function(executableScripts[0]!)).not.toThrow();
      expect(html).not.toMatch(/(?:src|href)=["']https?:/i);
      const overwriteAttempt = spawnSync(process.execPath, [
        path.join(SKILL_ROOT, "scripts/render-report.mjs"),
        "--input",
        inputPath,
        "--output",
        outputPath,
      ]);
      expect(overwriteAttempt.status).not.toBe(0);
    } finally {
      rmSync(temporaryRoot, { recursive: true, force: true });
    }
  });

  test("refuses dangling wave references before rendering", () => {
    const temporaryRoot = mkdtempSync(path.join(os.tmpdir(), "make-docs-backlog-reference-"));
    try {
      const inputPath = path.join(temporaryRoot, "report.json");
      const attentionOutputPath = path.join(temporaryRoot, "attention.html");
      const nextOutputPath = path.join(temporaryRoot, "next.html");
      const rendererPath = path.join(SKILL_ROOT, "scripts/render-report.mjs");

      const danglingAttention = structuredClone(mixedPortfolioFixture.report);
      danglingAttention.attentionFindings[0].recordPath = "docs/work/missing-attention";
      writeFileSync(inputPath, JSON.stringify(danglingAttention), "utf8");
      const attentionResult = spawnSync(
        process.execPath,
        [rendererPath, "--input", inputPath, "--output", attentionOutputPath],
        { encoding: "utf8" },
      );
      expect(attentionResult.status).not.toBe(0);
      expect(attentionResult.stderr).toContain(
        "Attention item 1 must refer to exactly one included report record.",
      );
      expect(existsSync(attentionOutputPath)).toBe(false);

      const danglingNext = structuredClone(mixedPortfolioFixture.report);
      danglingNext.recommendationOrder[0].recordPath = "docs/work/missing-next";
      writeFileSync(inputPath, JSON.stringify(danglingNext), "utf8");
      const nextResult = spawnSync(
        process.execPath,
        [rendererPath, "--input", inputPath, "--output", nextOutputPath],
        { encoding: "utf8" },
      );
      expect(nextResult.status).not.toBe(0);
      expect(nextResult.stderr).toContain(
        "Next item 1 must refer to exactly one included report record.",
      );
      expect(existsSync(nextOutputPath)).toBe(false);
    } finally {
      rmSync(temporaryRoot, { recursive: true, force: true });
    }
  });

  test("collects bounded project-purpose and current-objective context", () => {
    const temporaryRoot = mkdtempSync(path.join(os.tmpdir(), "make-docs-project-lead-"));
    const currentRecord = "docs/work/2042-06-01-w1-r1-current-review";
    try {
      mkdirSync(path.join(temporaryRoot, "docs/prd"), { recursive: true });
      mkdirSync(path.join(temporaryRoot, currentRecord), { recursive: true });
      writeFileSync(
        path.join(temporaryRoot, "docs/prd/01-product-overview.md"),
        "# Product overview\n\n## Purpose\n\nAurora Notes helps teams preserve shared project knowledge.\n",
        "utf8",
      );
      writeFileSync(
        path.join(temporaryRoot, currentRecord, "00-index.md"),
        "---\nstatus: active\n---\n\n# Current review\n\n## Purpose\n\nComplete the active review and prepare the next accepted package.\n",
        "utf8",
      );
      writeFileSync(
        path.join(temporaryRoot, "README.md"),
        "# Wrong fallback\n\nThis fallback must not replace the product overview.\n",
        "utf8",
      );

      const output = execFileSync(
        process.execPath,
        [
          path.join(SKILL_ROOT, "scripts/collect-project-lead-context.mjs"),
          "--target-root",
          temporaryRoot,
          "--current-record",
          currentRecord,
        ],
        { encoding: "utf8" },
      );
      const packet = JSON.parse(output);
      expect(packet.sources.map((source: { role: string }) => source.role)).toEqual([
        "purpose",
        "currentObjective",
      ]);
      expect(packet.sources[0]).toMatchObject({
        id: "purpose-product-overview",
        path: "docs/prd/01-product-overview.md",
        heading: "Purpose",
      });
      expect(packet.sources[0].excerpt).not.toContain("Wrong fallback");
      expect(packet.sources[1]).toMatchObject({
        id: "current-objective-1",
        path: `${currentRecord}/00-index.md`,
        heading: "Purpose",
      });
      expect(packet.sources[0].contentHash).toMatch(/^[a-f0-9]{64}$/);
    } finally {
      rmSync(temporaryRoot, { recursive: true, force: true });
    }
  });

  test("derives the wave display name without agent-written document labels", () => {
    const template = read("assets/backlog-review-report.html");
    const titleLogic = template.match(
      /const snapshotByPath = [\s\S]*?(?=    const fileHref =)/,
    )?.[0];
    expect(titleLogic).toBeDefined();

    const report = structuredClone(mixedPortfolioFixture.report);
    const record = report.records[0];
    const snapshotRecord = report.snapshot.records.find(
      (candidate) => candidate.recordPath === record.recordPath,
    );
    if (!snapshotRecord || !snapshotRecord.coordinate.value) {
      throw new Error("Synthetic report record is missing its coordinate.");
    }
    snapshotRecord.title.value = `${snapshotRecord.coordinate.value} Backlog Review and Reporting Work Backlog`;
    const context = { report } as { report: typeof report; recordTitle?: (value: typeof record) => string };
    runInNewContext(`${titleLogic}; globalThis.recordTitle = recordTitle;`, context);
    expect(context.recordTitle?.(record)).toBe("Backlog Review and Reporting");
  });
});
