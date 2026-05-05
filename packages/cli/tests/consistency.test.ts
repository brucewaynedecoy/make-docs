import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { getDesiredAssets } from "../src/catalog";
import { defaultSelections, resolveInstallProfile } from "../src/profile";
import { renderBuildableAsset } from "../src/renderers";
import { readPackageFile, TEMPLATE_ROOT } from "../src/utils";
import { collectFiles } from "./helpers";

const BUILDABLE_PATHS = [
  "AGENTS.md",
  "CLAUDE.md",
  "docs/AGENTS.md",
  "docs/CLAUDE.md",
  "docs/assets/templates/AGENTS.md",
  "docs/assets/templates/CLAUDE.md",
  "docs/assets/prompts/AGENTS.md",
  "docs/assets/prompts/CLAUDE.md",
  "docs/assets/AGENTS.md",
  "docs/assets/CLAUDE.md",
  "docs/assets/archive/AGENTS.md",
  "docs/assets/archive/CLAUDE.md",
  "docs/assets/history/AGENTS.md",
  "docs/assets/history/CLAUDE.md",
  "docs/assets/references/AGENTS.md",
  "docs/assets/references/CLAUDE.md",
  "docs/guides/AGENTS.md",
  "docs/guides/CLAUDE.md",
  "docs/assets/references/design-workflow.md",
  "docs/assets/references/design-contract.md",
  "docs/assets/templates/design.md",
];

const REPO_ROOT = path.resolve(TEMPLATE_ROOT, "..", "..", "..");
const DECOMPOSE_PACKAGE_ROOT = path.join(REPO_ROOT, "packages", "skills", "decompose-codebase");
const DECOMPOSE_MIRROR_ROOT = path.join(REPO_ROOT, ".agents", "skills", "decompose-codebase");
const DECOMPOSE_CLAUDE_MIRROR_ROOT = path.join(
  REPO_ROOT,
  ".claude",
  "skills",
  "decompose-codebase",
);
const CLOSEOUT_COMMIT_PACKAGE_ROOT = path.join(
  REPO_ROOT,
  "packages",
  "skills",
  "closeout-commit",
);
const CLOSEOUT_COMMIT_MIRROR_ROOT = path.join(
  REPO_ROOT,
  ".agents",
  "skills",
  "closeout-commit",
);
const CLOSEOUT_COMMIT_CLAUDE_MIRROR_ROOT = path.join(
  REPO_ROOT,
  ".claude",
  "skills",
  "closeout-commit",
);
const CLOSEOUT_PACKAGE_ROOT = path.join(REPO_ROOT, "packages", "skills", "closeout-phase");
const CLOSEOUT_MIRROR_ROOT = path.join(REPO_ROOT, ".agents", "skills", "closeout-phase");
const CLOSEOUT_CLAUDE_MIRROR_ROOT = path.join(
  REPO_ROOT,
  ".claude",
  "skills",
  "closeout-phase",
);

const RISK_REGISTER_TEMPLATE_PATHS = [
  "docs/assets/templates/prd-risk-register.md",
  "packages/docs/template/docs/assets/templates/prd-risk-register.md",
  "packages/skills/decompose-codebase/assets/templates/prd-risk-register.md",
];

const DOGFOOD_TEMPLATE_PARITY_PATHS = [
  "docs/assets/templates/prd-risk-register.md",
  "docs/assets/references/output-contract.md",
  "docs/assets/references/prd-change-management.md",
];

const GUIDE_TEMPLATE_PARITY_PATHS = [
  "docs/assets/references/guide-contract.md",
  "docs/assets/templates/guide-developer.md",
  "docs/assets/templates/guide-user.md",
  "docs/assets/prompts/work-to-guides.prompt.md",
  "docs/guides/AGENTS.md",
  "docs/guides/CLAUDE.md",
];

function isMirroredDecomposeSkillFile(relativePath: string): boolean {
  return (
    relativePath === "SKILL.md" ||
    relativePath === "agents/openai.yaml" ||
    relativePath === "scripts/probe_environment.py" ||
    relativePath === "scripts/validate_output.py" ||
    relativePath.startsWith("references/") ||
    relativePath.startsWith("assets/templates/")
  );
}

function isPackageOnlyDecomposeSkillFile(relativePath: string): boolean {
  return (
    relativePath === "assets/README.md" ||
    relativePath === "scripts/test_validate_output.py" ||
    relativePath.startsWith("scripts/__pycache__/")
  );
}

function sectionBetween(contents: string, startHeading: string, endHeading: string): string {
  const start = contents.indexOf(startHeading);
  const end = contents.indexOf(endHeading);

  expect(start).toBeGreaterThanOrEqual(0);
  expect(end).toBeGreaterThan(start);

  return contents.slice(start, end);
}

function itemHeadings(section: string): string[] {
  return [...section.matchAll(/^### (.+)$/gm)].map((match) => match[1]);
}

describe("default profile consistency", () => {
  test("BUILDABLE_PATHS matches the default profile buildable asset set", () => {
    const profile = resolveInstallProfile(defaultSelections());
    const buildablePaths = getDesiredAssets(profile)
      .filter((asset) => asset.assetClass === "buildable")
      .map((asset) => asset.relativePath)
      .sort();

    expect(buildablePaths).toEqual([...BUILDABLE_PATHS].sort());
  });

  test.each(BUILDABLE_PATHS)(
    "matches the checked-in full-profile source for %s",
    (relativePath) => {
      const profile = resolveInstallProfile(defaultSelections());

      expect(renderBuildableAsset(relativePath, profile)).toBe(readPackageFile(relativePath));
    },
  );
});

describe("template completeness", () => {
  test("every file in the template is covered by the asset pipeline", () => {
    const profile = resolveInstallProfile(defaultSelections());
    const managedPaths = new Set(
      getDesiredAssets(profile).map((asset) => asset.relativePath),
    );

    const templateFiles: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir)) {
        const full = path.join(dir, entry);
        if (statSync(full).isDirectory()) {
          walk(full);
        } else {
          templateFiles.push(path.relative(TEMPLATE_ROOT, full));
        }
      }
    };
    walk(TEMPLATE_ROOT);

    const unmanaged = templateFiles.filter((file) => !managedPaths.has(file));

    expect(unmanaged).toEqual([]);
  });
});

describe("risk register routing contract", () => {
  test("PRD routers identify the living risk register", () => {
    for (const relativePath of [
      "docs/prd/AGENTS.md",
      "docs/prd/CLAUDE.md",
      "packages/docs/template/docs/prd/AGENTS.md",
      "packages/docs/template/docs/prd/CLAUDE.md",
    ]) {
      const contents = readFileSync(path.join(REPO_ROOT, relativePath), "utf8");

      expect(contents).toContain("03-open-questions-and-risk-register.md");
      expect(contents).toContain("living register");
      expect(contents).toContain("do not create separate questions, decisions, risks, gaps");
    }
  });

  test("risk-register templates expose item state fields", () => {
    for (const relativePath of RISK_REGISTER_TEMPLATE_PATHS) {
      const contents = readFileSync(path.join(REPO_ROOT, relativePath), "utf8");

      expect(contents).toContain("D-001");
      expect(contents).toContain("Q-001");
      expect(contents).toContain("R-001");
      expect(contents).toContain("never renumber existing items");
      expect(contents).toContain("Do not use `### Change Notes` inside this register");
      expect(contents).toContain("| Status | Decision | Follow-Up |");
      expect(contents).toContain("`Open`, `Confirming`, `Deferred`, or `Closed`");
      expect(contents).toContain("**Why it matters**");
      expect(contents).toContain("**Recommendation**");
      expect(contents).toContain("**To close**");
    }
  });

  test("risk-register references disallow change notes inside the register", () => {
    for (const relativePath of [
      "docs/assets/references/prd-change-management.md",
      "packages/docs/template/docs/assets/references/prd-change-management.md",
    ]) {
      const contents = readFileSync(path.join(REPO_ROOT, relativePath), "utf8");

      expect(contents).toContain("Do not use `### Change Notes` inside `03-open-questions-and-risk-register.md`");
      expect(contents).toContain("D-001");
      expect(contents).toContain("Q-001");
      expect(contents).toContain("R-001");
    }
  });

  test("active risk register uses section-prefixed item IDs", () => {
    const contents = readFileSync(
      path.join(REPO_ROOT, "docs/prd/03-open-questions-and-risk-register.md"),
      "utf8",
    );
    const drift = sectionBetween(contents, "## Confirmed Drift", "## Open Questions");
    const questions = sectionBetween(contents, "## Open Questions", "## Rebuild Risks");
    const risks = sectionBetween(contents, "## Rebuild Risks", "## Source Anchors");

    expect(contents).not.toContain("### Change Notes");
    expect(itemHeadings(drift)).toEqual([
      "D-001 README Wording Understates the Live Idempotent Sync Model",
      "D-002 Public Command Guidance Lags the Shipped Command Taxonomy",
      "D-003 Template and Reference Mode Labels Promise More Than the Selector Enforces",
      "D-004 ResolvedAsset Asset Class Is Stale Relative to the Catalog",
      "D-005 Skills Delivery Diverges From Earlier Bundled-Payload Expectations",
      "D-006 Packaged README and Maintainer README Do Not Match the Current Tarball Allowlist",
      "D-007 Dogfood Re-Seeding Remains Manual Without a Freshness Proof",
      "D-008 Historical Hidden-Dot Paths Remain Easy to Mistake for Current Routing",
      "D-009 Future packages/content Boundary Is Undefined",
      "D-010 Skills Authoring and Release Guidance Is Thin Relative to Runtime Dependence",
    ]);
    expect(itemHeadings(questions)).toEqual([
      "Q-001 What Is the Long-Term Skills Delivery Contract?",
      "Q-002 Should Template and Reference Modes Remain Public Options?",
      "Q-003 Should ResolvedAsset Keep a Third Asset Class?",
      "Q-004 How Should packages/content Participate in the Product?",
      "Q-005 How Should Maintainers Prove Dogfood Freshness?",
      "Q-006 What Defines Public Release Readiness?",
      "Q-007 How Should Remote Skill Sources Be Constrained?",
    ]);
    expect(itemHeadings(risks)).toEqual([
      "R-001 Home-Scoped Skills Are Easy to Drop From a Clean-Room Rebuild",
      "R-002 Audit Removability Depends on Regenerated Canonical Skill Content",
      "R-003 Dev-Template and Packed-Template Resolution Can Diverge",
      "R-004 Path Knowledge Is Duplicated Across Modules and Docs",
      "R-005 The No-Command CLI Workflow Is Easy to Simplify Incorrectly",
      "R-006 Backup and Uninstall Depend on a Single Reviewed Audit Snapshot",
      "R-007 Manual Dogfood Re-Seeding Can Hide Product Drift",
    ]);
  });

  test("dogfood risk-register contracts match the shipped template copies", () => {
    for (const relativePath of DOGFOOD_TEMPLATE_PARITY_PATHS) {
      const dogfoodContents = readFileSync(path.join(REPO_ROOT, relativePath), "utf8");
      const templateContents = readFileSync(
        path.join(REPO_ROOT, "packages", "docs", "template", relativePath),
        "utf8",
      );

      expect(dogfoodContents).toBe(templateContents);
    }
  });
});

describe("guide generation routing contract", () => {
  test("guide routers require audience decisions and future coverage notes", () => {
    for (const relativePath of [
      "docs/guides/AGENTS.md",
      "docs/guides/CLAUDE.md",
      "packages/docs/template/docs/guides/AGENTS.md",
      "packages/docs/template/docs/guides/CLAUDE.md",
    ]) {
      const contents = readFileSync(path.join(REPO_ROOT, relativePath), "utf8");

      expect(contents).toContain("developer`, `user`, `both`, `update-existing`, `link-only`, or `none");
      expect(contents).toContain("## Future Coverage");
      expect(contents).toContain("Do not create design docs, architecture decisions, or PRD risk-register items solely to remember future guide work");
    }
  });

  test("guide contract defines audience intent and future coverage handling", () => {
    for (const relativePath of [
      "docs/assets/references/guide-contract.md",
      "packages/docs/template/docs/assets/references/guide-contract.md",
    ]) {
      const contents = readFileSync(path.join(REPO_ROOT, relativePath), "utf8");

      expect(contents).toContain("## Audience Contract");
      expect(contents).toContain("## Guide Coverage Decision");
      expect(contents).toContain("## Partial and Future Coverage");
      expect(contents).toContain("Do not add frontmatter fields for deferred guide work");
    }
  });

  test("dogfood guide contracts match the shipped template copies", () => {
    for (const relativePath of GUIDE_TEMPLATE_PARITY_PATHS) {
      const dogfoodContents = readFileSync(path.join(REPO_ROOT, relativePath), "utf8");
      const templateContents = readFileSync(
        path.join(REPO_ROOT, "packages", "docs", "template", relativePath),
        "utf8",
      );

      expect(dogfoodContents).toBe(templateContents);
    }
  });
});

describe("dogfood skill mirror parity", () => {
  test("closeout-commit mirror matches the packaged mapped file set", () => {
    const expectedMirrorFiles = [
      "SKILL.md",
      "agents/openai.yaml",
      "references/closeout-commit-workflow.md",
    ].sort();

    for (const mirrorRoot of [CLOSEOUT_COMMIT_MIRROR_ROOT, CLOSEOUT_COMMIT_CLAUDE_MIRROR_ROOT]) {
      const mirrorFiles = collectFiles(mirrorRoot).sort();

      expect(mirrorFiles).toEqual(expectedMirrorFiles);

      for (const relativePath of expectedMirrorFiles) {
        const packageContents = readFileSync(
          path.join(CLOSEOUT_COMMIT_PACKAGE_ROOT, relativePath),
          "utf8",
        );
        const mirrorContents = readFileSync(path.join(mirrorRoot, relativePath), "utf8");

        expect(mirrorContents).toBe(packageContents);
      }
    }
  });

  test("closeout-phase mirror matches the packaged mapped file set", () => {
    const expectedMirrorFiles = [
      "SKILL.md",
      "agents/openai.yaml",
      "references/closeout-workflow.md",
    ].sort();

    for (const mirrorRoot of [CLOSEOUT_MIRROR_ROOT, CLOSEOUT_CLAUDE_MIRROR_ROOT]) {
      const mirrorFiles = collectFiles(mirrorRoot).sort();

      expect(mirrorFiles).toEqual(expectedMirrorFiles);

      for (const relativePath of expectedMirrorFiles) {
        const packageContents = readFileSync(path.join(CLOSEOUT_PACKAGE_ROOT, relativePath), "utf8");
        const mirrorContents = readFileSync(path.join(mirrorRoot, relativePath), "utf8");

        expect(mirrorContents).toBe(packageContents);
      }
    }
  });

  test("decompose-codebase mirror matches the packaged mapped file set", () => {
    const expectedMirrorFiles = collectFiles(DECOMPOSE_PACKAGE_ROOT)
      .filter((relativePath) => !isPackageOnlyDecomposeSkillFile(relativePath))
      .filter(isMirroredDecomposeSkillFile)
      .sort();

    for (const mirrorRoot of [DECOMPOSE_MIRROR_ROOT, DECOMPOSE_CLAUDE_MIRROR_ROOT]) {
      const mirrorFiles = collectFiles(mirrorRoot).sort();

      expect(mirrorFiles).toEqual(expectedMirrorFiles);

      for (const relativePath of expectedMirrorFiles) {
        const packageContents = readFileSync(
          path.join(DECOMPOSE_PACKAGE_ROOT, relativePath),
          "utf8",
        );
        const mirrorContents = readFileSync(path.join(mirrorRoot, relativePath), "utf8");

        expect(mirrorContents).toBe(packageContents);
      }
    }
  });
});
