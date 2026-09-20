import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

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
      "references/rule-map.md",
      "examples/chat-reports.md",
      "examples/human-errors.json",
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
  });
});
