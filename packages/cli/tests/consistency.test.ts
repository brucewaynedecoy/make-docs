import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { getDesiredAssets } from "../src/catalog";
import { parseManagedBlock } from "../src/managed-block";
import { parseAndValidatePlaybook } from "../src/playbook";
import { defaultSelections, resolveInstallProfile } from "../src/profile";
import { readPackageFile, TEMPLATE_ROOT } from "../src/utils";

const REPO_ROOT = path.resolve(TEMPLATE_ROOT, "..", "..", "..");
const CLOSEOUT_COMMIT_PACKAGE_ROOT = path.join(
  REPO_ROOT,
  "packages",
  "skills",
  "closeout-commit",
);
const CLOSEOUT_PACKAGE_ROOT = path.join(REPO_ROOT, "packages", "skills", "closeout-phase");

const RISK_REGISTER_TEMPLATE_PATHS = [
  ".make-docs/templates/system/prd-risk-register.md",
  "packages/docs/template/.make-docs/templates/system/prd-risk-register.md",
  "packages/skills/decompose-codebase/assets/templates/prd-risk-register.md",
];

const DOGFOOD_TEMPLATE_PARITY_PATHS = [
  ".make-docs/templates/system/prd-risk-register.md",
  ".make-docs/contracts/system/output-contract.md",
  ".make-docs/references/system/prd-change-management.md",
];

const GUIDE_TEMPLATE_PARITY_PATHS = [
  ".make-docs/contracts/system/guide-contract.md",
  ".make-docs/templates/system/guide-developer.md",
  ".make-docs/templates/system/guide-user.md",
  ".make-docs/references/system/prompts/work-to-guides.prompt.md",
  "docs/assets/library/AGENTS.md",
  "docs/assets/library/CLAUDE.md",
  "docs/assets/playbooks/AGENTS.md",
  "docs/assets/playbooks/CLAUDE.md",
];

const READER_ASSET_ROUTER_PATHS = [
  "docs/assets/archive/AGENTS.md",
  "docs/assets/archive/CLAUDE.md",
  "docs/assets/artifacts/AGENTS.md",
  "docs/assets/artifacts/CLAUDE.md",
  "docs/assets/library/AGENTS.md",
  "docs/assets/library/CLAUDE.md",
  "docs/assets/playbooks/AGENTS.md",
  "docs/assets/playbooks/CLAUDE.md",
];

const PLAYBOOK_DEFAULT_PARITY_PATHS = [
  "docs/assets/playbooks/agent/make-docs-lifecycle.playbook.md",
];

const PATH_HYGIENE_PARITY_PATHS = [
  ".make-docs/scripts/check_path_hygiene.py",
  "docs/AGENTS.md",
  "docs/CLAUDE.md",
  "docs/assets/archive/AGENTS.md",
  "docs/assets/archive/CLAUDE.md",
  ".make-docs/references/system/prompts/docs-path-hygiene-cleanup.prompt.md",
  ".make-docs/references/system/AGENTS.md",
  ".make-docs/references/system/CLAUDE.md",
  ".make-docs/contracts/system/design-contract.md",
  ".make-docs/contracts/system/guide-contract.md",
  ".make-docs/contracts/system/history-record-contract.md",
  ".make-docs/contracts/system/output-contract.md",
  ".make-docs/references/system/path-and-link-hygiene.md",
];

const WORK_PHASE_TEMPLATE_PATHS = [
  ".make-docs/templates/system/work-phase.md",
  "packages/docs/template/.make-docs/templates/system/work-phase.md",
  "packages/skills/decompose-codebase/assets/templates/rebuild-backlog-phase.md",
];

const COMMIT_MESSAGE_CONVENTION_PATHS = [
  ".make-docs/contracts/system/commit-message-convention.md",
  "packages/docs/template/.make-docs/contracts/system/commit-message-convention.md",
  "packages/cli/template/.make-docs/contracts/system/commit-message-convention.md",
];

const GENERATED_DOCUMENT_TEMPLATE_METADATA = new Map<
  string,
  { kind: string; status: string; coordinate?: boolean; followOn?: boolean; persona?: string }
>([
  ["design.md", { kind: "design", status: "draft", followOn: true }],
  ["guide-developer.md", { kind: "guide", status: "draft", persona: "developer" }],
  ["guide-user.md", { kind: "guide", status: "draft", persona: "user" }],
  ["history-record.md", { kind: "history", status: "completed", coordinate: true }],
  ["plan-overview.md", { kind: "plan", status: "draft", coordinate: true, followOn: true }],
  ["plan-prd-change.md", { kind: "plan", status: "draft", coordinate: true }],
  ["plan-prd-decompose.md", { kind: "plan", status: "draft", coordinate: true }],
  ["plan-prd.md", { kind: "plan", status: "draft", coordinate: true }],
  ["prd-architecture.md", { kind: "prd", status: "active", coordinate: true }],
  ["prd-change-addition.md", { kind: "prd", status: "active", coordinate: true }],
  ["prd-change-revision.md", { kind: "prd", status: "active", coordinate: true }],
  ["prd-glossary.md", { kind: "prd", status: "active", coordinate: true }],
  ["prd-index.md", { kind: "prd", status: "active", coordinate: true, followOn: true }],
  ["prd-overview.md", { kind: "prd", status: "active", coordinate: true }],
  ["prd-reference.md", { kind: "prd", status: "active", coordinate: true }],
  ["prd-risk-register.md", { kind: "prd", status: "active", coordinate: true }],
  ["prd-subsystem.md", { kind: "prd", status: "active", coordinate: true }],
  ["work-index.md", { kind: "work", status: "active", coordinate: true, followOn: true }],
  ["work-phase.md", { kind: "work", status: "active", coordinate: true }],
]);

const GENERATED_DOCUMENT_PROMPT_PATHS = [
  ".make-docs/references/system/prompts/coverage-pass-developer-guide.prompt.md",
  ".make-docs/references/system/prompts/coverage-pass-prd-reconciliation.prompt.md",
  ".make-docs/references/system/prompts/coverage-pass-user-guide.prompt.md",
  ".make-docs/references/system/prompts/designs-to-plan-change.prompt.md",
  ".make-docs/references/system/prompts/designs-to-plan.prompt.md",
  ".make-docs/references/system/prompts/plan-to-prd-change.prompt.md",
  ".make-docs/references/system/prompts/plan-to-prd-green-field.prompt.md",
  ".make-docs/references/system/prompts/prd-change-to-work.prompt.md",
  ".make-docs/references/system/prompts/prd-to-work-full-prd.prompt.md",
  ".make-docs/references/system/prompts/prd-to-work-prd-feature.prompt.md",
  ".make-docs/references/system/prompts/request-to-design.prompt.md",
  ".make-docs/references/system/prompts/session-to-history-record.prompt.md",
  ".make-docs/references/system/prompts/work-to-guides.prompt.md",
];

function sectionBetween(contents: string, startHeading: string, endHeading: string): string {
  const start = contents.indexOf(startHeading);
  const end = contents.indexOf(endHeading);

  expect(start).toBeGreaterThanOrEqual(0);
  expect(end).toBeGreaterThan(start);

  return contents.slice(start, end);
}

function frontmatterBlock(contents: string, relativePath: string): string {
  expect(contents.startsWith("---\n"), relativePath).toBe(true);

  const end = contents.indexOf("\n---\n", 4);
  expect(end, relativePath).toBeGreaterThan(0);

  return contents.slice(4, end);
}

function expectFrontmatterField(block: string, field: string, value?: string): void {
  if (value === undefined) {
    expect(block).toMatch(new RegExp(`^${field}:\\s+`, "m"));
    return;
  }

  expect(block).toMatch(new RegExp(`^${field}:\\s+"?${value}"?\\s*$`, "m"));
}

function itemHeadings(section: string): string[] {
  return [...section.matchAll(/^### (.+)$/gm)].map((match) => match[1]);
}

function collectInstructionRouters(root: string): string[] {
  const routers: string[] = [];
  const walk = (directory: string) => {
    for (const entry of readdirSync(directory)) {
      const fullPath = path.join(directory, entry);
      if (statSync(fullPath).isDirectory()) {
        walk(fullPath);
        continue;
      }

      if (entry === "AGENTS.md" || entry === "CLAUDE.md") {
        routers.push(path.relative(root, fullPath));
      }
    }
  };

  walk(root);
  return routers.sort();
}

describe("default profile consistency", () => {
  test("default scaffold assets are copied from the packaged template", () => {
    const profile = resolveInstallProfile(defaultSelections());

    for (const asset of getDesiredAssets(profile)) {
      expect(asset.assetClass).toBe("scoped-static");
      expect(asset.sourceId).toBe(`file:${asset.relativePath}`);
      expect(asset.content).toBe(readPackageFile(asset.relativePath));
    }
  });

  test("default scaffold includes canonical reader-facing asset routers", () => {
    const profile = resolveInstallProfile(defaultSelections());
    const managedPaths = new Set(getDesiredAssets(profile).map((asset) => asset.relativePath));

    for (const relativePath of READER_ASSET_ROUTER_PATHS) {
      expect(managedPaths.has(relativePath), relativePath).toBe(true);
      expect(readPackageFile(relativePath), relativePath).toContain("make-docs:begin");
    }
  });

  test("default scaffold includes reviewed playbook defaults", () => {
    const profile = resolveInstallProfile(defaultSelections());
    const managedPaths = new Set(getDesiredAssets(profile).map((asset) => asset.relativePath));

    for (const relativePath of PLAYBOOK_DEFAULT_PARITY_PATHS) {
      expect(managedPaths.has(relativePath), relativePath).toBe(true);
      expect(readPackageFile(relativePath), relativePath).toContain("kind: \"playbook\"");
      expect(readPackageFile(relativePath), relativePath).toContain("stack: \"build\"");
    }
  });
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

  test("every template instruction router is managed-block wrapped", () => {
    const instructionRouters = collectInstructionRouters(TEMPLATE_ROOT);

    expect(instructionRouters.length).toBeGreaterThan(0);
    for (const relativePath of instructionRouters) {
      const contents = readFileSync(path.join(TEMPLATE_ROOT, relativePath), "utf8");
      const parsed = parseManagedBlock(contents);

      expect(parsed.state, relativePath).toBe("valid");
      expect(parsed.body, relativePath).not.toBeNull();
      expect(parsed.body, relativePath).not.toContain(".make-docs/AGENTS.md");
      expect(parsed.body, relativePath).not.toContain("@.make-docs/CLAUDE.md");
    }
  });

  test("generated document templates include PRD 23 metadata frontmatter", () => {
    for (const templateRoot of [
      ".make-docs/templates/system",
      "packages/cli/template/.make-docs/templates/system",
      "packages/docs/template/.make-docs/templates/system",
    ]) {
      for (const [fileName, expected] of GENERATED_DOCUMENT_TEMPLATE_METADATA) {
        const relativePath = path.join(templateRoot, fileName);
        const contents = readFileSync(path.join(REPO_ROOT, relativePath), "utf8");
        const frontmatter = frontmatterBlock(contents, relativePath);

        expectFrontmatterField(frontmatter, "title");
        expectFrontmatterField(frontmatter, "kind", expected.kind);
        expectFrontmatterField(frontmatter, "status", expected.status);

        if (expected.coordinate) {
          expectFrontmatterField(frontmatter, "coordinate");
        } else {
          expect(frontmatter, relativePath).not.toMatch(/^coordinate:\s+/m);
        }

        if (expected.persona) {
          expectFrontmatterField(frontmatter, "persona", expected.persona);
        } else {
          expect(frontmatter, relativePath).not.toMatch(/^persona:\s+/m);
        }

        if (expected.followOn) {
          expect(frontmatter, relativePath).toMatch(/^follow_on:\s*$/m);
          expect(frontmatter, relativePath).toMatch(/^\s+route:\s+/m);
          expect(frontmatter, relativePath).toMatch(/^\s+next_prompt:\s+/m);
          expect(frontmatter, relativePath).toMatch(/^\s+coordinate_handoff:\s+/m);
        } else {
          expect(frontmatter, relativePath).not.toMatch(/^follow_on:\s*$/m);
        }
      }
    }
  });

  test("metadata-bearing generated template copies match the package source", () => {
    for (const fileName of GENERATED_DOCUMENT_TEMPLATE_METADATA.keys()) {
      const sourceContents = readFileSync(
        path.join(REPO_ROOT, "packages/docs/template/.make-docs/templates/system", fileName),
        "utf8",
      );

      for (const templateRoot of [
        ".make-docs/templates/system",
        "packages/cli/template/.make-docs/templates/system",
      ]) {
        const relativePath = path.join(templateRoot, fileName);
        expect(readFileSync(path.join(REPO_ROOT, relativePath), "utf8"), relativePath).toBe(
          sourceContents,
        );
      }
    }
  });

  test("generated document prompts require PRD 23 metadata frontmatter", () => {
    for (const relativePath of GENERATED_DOCUMENT_PROMPT_PATHS) {
      for (const rootPrefix of ["", "packages/cli/template/", "packages/docs/template/"]) {
        const contents = readFileSync(path.join(REPO_ROOT, rootPrefix, relativePath), "utf8");

        expect(contents).toContain("PRD 23 YAML frontmatter");
        expect(contents).toContain("common `title`, `kind`, and `status`");
        expect(contents).toContain("omit unknown coordinate levels");
      }
    }
  });

  test("generated document prompt copies match the package source", () => {
    for (const relativePath of GENERATED_DOCUMENT_PROMPT_PATHS) {
      const sourceContents = readFileSync(
        path.join(REPO_ROOT, "packages/docs/template", relativePath),
        "utf8",
      );

      for (const rootPrefix of ["", "packages/cli/template/"]) {
        const promptPath = path.join(rootPrefix, relativePath);
        expect(readFileSync(path.join(REPO_ROOT, promptPath), "utf8"), promptPath).toBe(
          sourceContents,
        );
      }
    }
  });
});

describe("commit message convention contract", () => {
  test("dogfood and shipped template copies match", () => {
    const [dogfoodPath, ...templatePaths] = COMMIT_MESSAGE_CONVENTION_PATHS;
    const dogfoodContents = readFileSync(path.join(REPO_ROOT, dogfoodPath), "utf8");

    for (const relativePath of templatePaths) {
      expect(readFileSync(path.join(REPO_ROOT, relativePath), "utf8")).toBe(dogfoodContents);
    }
  });

  test("requires full fenced subject and body output", () => {
    const contents = readFileSync(
      path.join(REPO_ROOT, ".make-docs/contracts/system/commit-message-convention.md"),
      "utf8",
    );

    expect(contents).toContain("## Output Format");
    expect(contents).toContain("one required body paragraph");
    expect(contents).toContain("Always return one fenced `text` block");
    expect(contents).toContain("Return the subject line, one blank line, and one body paragraph");
    expect(contents).toContain("Never return only a subject line or title");
    expect(contents).toContain("draft a concise one-paragraph body from the actual staged or unstaged diff");
    expect(contents).toContain("Verify both subject and body with `git log -1 --format=%B`");
    expect(contents).not.toContain("omit the body instead of inventing one");
    expect(contents).not.toContain("optional body paragraph");
  });
});

describe("work backlog task contract", () => {
  test("work phase templates use task checkboxes and plain acceptance bullets", () => {
    for (const relativePath of WORK_PHASE_TEMPLATE_PATHS) {
      const contents = readFileSync(path.join(REPO_ROOT, relativePath), "utf8");

      expect(contents).toContain("- [ ] t1: {{TASK}}");
      expect(contents).toContain("- [ ] t2: {{TASK}}");
      expect(contents).toContain("- {{ACCEPTANCE}}");
      expect(contents).not.toContain("1. {{TASK}}");
      expect(contents).not.toContain("- [ ] {{ACCEPTANCE}}");
    }
  });

  test("work backlog references document task IDs and plain acceptance criteria", () => {
    for (const relativePath of [
      ".make-docs/contracts/system/output-contract.md",
      ".make-docs/references/system/execution-workflow.md",
      "packages/docs/template/.make-docs/contracts/system/output-contract.md",
      "packages/docs/template/.make-docs/references/system/execution-workflow.md",
      "packages/skills/decompose-codebase/references/output-contract.md",
      "packages/skills/decompose-codebase/references/execution-workflow.md",
    ]) {
      const contents = readFileSync(path.join(REPO_ROOT, relativePath), "utf8");

      expect(contents).toContain("phase-local task IDs");
      expect(contents).toContain("- [ ] t1:");
      expect(contents).toContain("plain unordered bullets");
      expect(contents).toContain("renumber existing task IDs");
    }
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
      ".make-docs/references/system/prd-change-management.md",
      "packages/docs/template/.make-docs/references/system/prd-change-management.md",
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
      "D-004 ResolvedAsset Asset Class May Still Be Wider Than the Catalog",
      "D-005 Skills Delivery Diverges From Earlier Bundled-Payload Expectations",
      "D-006 Packaged README and Maintainer README Do Not Match the Current Tarball Allowlist",
      "D-007 Dogfood Re-Seeding Remains Manual Without a Freshness Proof",
      "D-008 Historical Hidden-Dot Paths Remain Easy to Mistake for Current Routing",
      "D-009 Future packages/content Boundary Is Undefined",
      "D-010 Skills Authoring and Release Guidance Is Thin Relative to Runtime Dependence",
      "D-011 PRD 05 Still Carries the Pre-W14 R2 Conflict Model",
      "D-012 Authoritative Layer Encodes Structure but Not Lifecycle Ordering",
      "D-013 W16 Design Docs Trail the Re-Scoped Plan",
      "D-014 W16 R0 Product Assets Authored in the Dogfood Instead of the Template Source",
      "D-015 Generated Dependency Checks Probe the Source Prose Instead of the Dependency",
      "D-016 PlaybookRunState Resume Hints Accumulate Without Retirement",
      "D-017 Shipped Config Blocks Lack Upstream Schema Documentation",
      "D-018 The Global Store Lacks Project Registry Management Operations",
      "D-019 Pre-W18 Tool-Resource Mandates Were Not Implemented (Custom Tiers and No-Scripts Shims)",
    ]);
    expect(itemHeadings(questions)).toEqual([
      "Q-001 What Is the Long-Term Skills Delivery Contract?",
      "Q-002 Should Template and Reference Modes Remain Public Options?",
      "Q-003 Should ResolvedAsset Keep a Third Asset Class?",
      "Q-004 How Should packages/content Participate in the Product?",
      "Q-005 How Should Maintainers Prove Dogfood Freshness?",
      "Q-006 What Defines Public Release Readiness?",
      "Q-007 How Should Remote Skill Sources Be Constrained?",
      "Q-008 What Is the Package and Directory Rename Target?",
      "Q-009 What Is the Persona Model Schema?",
      "Q-010 Where Do Starter Prompts Live After the Restructure?",
      "Q-011 Should Coordinate and Prefix Conventions Be Configurable?",
      "Q-012 How Do Plugins and Skills Share an Install and Respect Config Mapping?",
      "Q-013 What Are the Plugin Flow and Exposure Boundaries?",
      "Q-014 How Did the Transitional `docs/library/` Move Resolve?",
      "Q-015 When and How Should the Interactive Playbook Run Mode Land?",
      "Q-016 Should Make Docs Grow a Full TUI Over the Store, Runs, and Packaging?",
      "Q-017 Should Managed System Assets Centralize at the Machine Level Instead of Replicating Per Instance?",
      "Q-018 What Is the Configuration Information Architecture?",
      "Q-019 How Should the Persona Model Revise and Gain Interactive Setup?",
      "Q-020 Should Other Playbook Sections Gain Imposed Structure Beyond Dependencies?",
    ]);
    expect(itemHeadings(risks)).toEqual([
      "R-001 Home-Scoped Skills Are Easy to Drop From a Clean-Room Rebuild",
      "R-002 Audit Removability Depends on Regenerated Canonical Skill Content",
      "R-003 Dev-Template and Packed-Template Resolution Can Diverge",
      "R-004 Path Knowledge Is Duplicated Across Modules and Docs",
      "R-005 The No-Command CLI Workflow Is Easy to Simplify Incorrectly",
      "R-006 Backup and Uninstall Depend on a Single Reviewed Audit Snapshot",
      "R-007 Manual Dogfood Re-Seeding Can Hide Product Drift",
      "R-008 Deferring the Skill Refactor Prolongs Reliance on Script-Gated Skills",
      "R-009 The Lifecycle Anchor Could Drift Toward a Hard Gate",
      "R-010 make-docs Vocabulary Could Re-Introduce a Software Bias",
      "R-011 The Persona-Target Axis References a Future Configuration",
      "R-012 Playbooks and Plugins Could Become Overlapping Deliverables",
      "R-013 The Restructure and Rename Will Relocate Newly Authored Assets",
      "R-014 The No-Scripts Migration Has a Transitional Break Window",
      "R-015 Backup State and Agentics Pruning Could Drift Across Lifecycle Consumers",
      "R-016 Run Playbook Orchestration Could Drift Across Runner Surfaces",
      "R-017 Playbook Packaging Could Blur Source and Generated Agentic Outputs",
      "R-018 The Playbook Contract, Validator, and Template Copies Could Drift Out of Parity",
      "R-019 Run-State Relocation Depends on an Unlanded Global Store",
      "R-020 W18 R3 Adversarial-Review Surface Exposure Predates the New Playbook, CLI, and State Architecture",
      "R-021 Adapter Contracts Can Regress to Assumed Paths and Outrun Conformance Evidence",
      "R-022 First-Pass Conformance Scenarios Depend on Real Harness Availability",
      "R-023 The Global Store Could Drift Into a Second Source of Truth or Lose Evidence in the Checkpoint Migration",
      "R-024 The Command-Surface Hard Cutover Can Strand Consumers or Leave a Half-Migrated Surface",
      "R-025 Cross-Artifact Coordinate Handoffs Can Drift From Their Assigned Waves and PRDs",
      "R-026 The W18 R12 UAT Remediation Round Must Land Before W18 R9 Conformance",
      "R-027 The Pending Playbook and CLI Polish Round Awaits Sequencing Against W18 R9",
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
      "docs/assets/library/AGENTS.md",
      "docs/assets/library/CLAUDE.md",
      "packages/docs/template/docs/assets/library/AGENTS.md",
      "packages/docs/template/docs/assets/library/CLAUDE.md",
    ]) {
      const contents = readFileSync(path.join(REPO_ROOT, relativePath), "utf8");

      expect(contents).toContain("developer`, `user`, `both`, `update-existing`, `link-only`, or `none");
      expect(contents).toContain("re-check overlapping guides");
      expect(contents).toContain("reciprocal links");
      expect(contents).toContain("## Future Coverage");
      expect(contents).toContain("Do not create design docs, architecture decisions, or PRD risk-register items solely to remember future guide work");
    }
  });

  test("guide contract defines audience intent and future coverage handling", () => {
    for (const relativePath of [
      ".make-docs/contracts/system/guide-contract.md",
      "packages/docs/template/.make-docs/contracts/system/guide-contract.md",
    ]) {
      const contents = readFileSync(path.join(REPO_ROOT, relativePath), "utf8");

      expect(contents).toContain("## Audience Contract");
      expect(contents).toContain("## Guide Coverage Decision");
      expect(contents).toContain("re-check overlapping developer and user guides");
      expect(contents).toContain("reciprocal links");
      expect(contents).toContain("## Partial and Future Coverage");
      expect(contents).toContain("Do not add frontmatter fields for deferred guide work");
    }
  });

  test("reader-facing asset routers define guide and playbook namespace boundaries", () => {
    for (const relativePath of [
      "docs/assets/library/AGENTS.md",
      "docs/assets/library/CLAUDE.md",
      "packages/docs/template/docs/assets/library/AGENTS.md",
      "packages/docs/template/docs/assets/library/CLAUDE.md",
    ]) {
      const contents = readFileSync(path.join(REPO_ROOT, relativePath), "utf8");

      expect(contents).toContain("docs/assets/library/<persona-slug>/");
      expect(contents).toContain("persona");
      expect(contents).toContain("docs/assets/library/**");
    }

    for (const relativePath of [
      "docs/assets/playbooks/AGENTS.md",
      "docs/assets/playbooks/CLAUDE.md",
      "packages/docs/template/docs/assets/playbooks/AGENTS.md",
      "packages/docs/template/docs/assets/playbooks/CLAUDE.md",
    ]) {
      const contents = readFileSync(path.join(REPO_ROOT, relativePath), "utf8");

      expect(contents).toContain("docs/assets/playbooks/<persona-slug>/");
      expect(contents).toContain("not plugins");
      expect(contents).toContain("docs/assets/archive/history/");
    }
  });

  test("closeout workflow requires guide reconciliation decisions", () => {
    for (const relativePath of [
      "packages/skills/closeout-phase/references/closeout-workflow.md",
    ]) {
      const contents = readFileSync(path.join(REPO_ROOT, relativePath), "utf8");

      expect(contents).toContain("re-check overlapping existing guides");
      expect(contents).toContain("No existing guide enrichment was needed");
      expect(contents).toContain("For each unchecked `### Tasks` item");
      expect(contents).toContain("Use `### Acceptance criteria` bullets as evidence");
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

  test("dogfood playbook defaults match the shipped template copies", () => {
    for (const relativePath of PLAYBOOK_DEFAULT_PARITY_PATHS) {
      const dogfoodContents = readFileSync(path.join(REPO_ROOT, relativePath), "utf8");
      const templateContents = readFileSync(
        path.join(REPO_ROOT, "packages", "docs", "template", relativePath),
        "utf8",
      );
      const generatedContents = readFileSync(
        path.join(REPO_ROOT, "packages", "cli", "template", relativePath),
        "utf8",
      );

      expect(templateContents).toBe(dogfoodContents);
      expect(generatedContents).toBe(templateContents);
      expect(templateContents).toContain("status: \"accepted\"");
      expect(templateContents).toContain("persona: \"agent\"");
    }
  });

  test("the migrated default playbook validates with zero errors upstream and in the dogfood instance", () => {
    for (const relativePath of PLAYBOOK_DEFAULT_PARITY_PATHS) {
      for (const root of [path.join(REPO_ROOT, "packages", "docs", "template"), REPO_ROOT]) {
        const sourcePath = path.join(root, relativePath);
        const { model, diagnostics } = parseAndValidatePlaybook({
          sourcePath: relativePath,
          source: readFileSync(sourcePath, "utf8"),
        });

        expect(diagnostics.filter((diagnostic) => diagnostic.severity === "error"), sourcePath).toEqual([]);
        expect(model.runnable, sourcePath).toBe(true);
        expect(model.identity.fileForm, sourcePath).toBe("playbook-suffix");
        expect(model.identity.canonicalRef, sourcePath).toBe("agent/make-docs-lifecycle");
      }
    }
  });

  function collectPlaybookPaths(instanceRoot: string): string[] {
    const playbooksRoot = path.join(instanceRoot, "docs", "assets", "playbooks");
    const playbookPaths: string[] = [];
    for (const persona of readdirSync(playbooksRoot)) {
      const personaDir = path.join(playbooksRoot, persona);
      if (!statSync(personaDir).isDirectory()) {
        continue;
      }
      for (const fileName of readdirSync(personaDir)) {
        if (fileName.endsWith(".md")) {
          playbookPaths.push(path.join(personaDir, fileName));
        }
      }
    }
    return playbookPaths;
  }

  function expectZeroPlaybookErrors(instanceRoot: string): void {
    const playbookPaths = collectPlaybookPaths(instanceRoot);
    expect(playbookPaths.length).toBeGreaterThan(0);
    for (const playbookPath of playbookPaths) {
      const relativePath = path.relative(instanceRoot, playbookPath);
      const { model, diagnostics } = parseAndValidatePlaybook({
        sourcePath: relativePath.split(path.sep).join("/"),
        source: readFileSync(playbookPath, "utf8"),
      });

      expect(diagnostics.filter((diagnostic) => diagnostic.severity === "error"), playbookPath).toEqual([]);
      expect(model.runnable, playbookPath).toBe(true);
    }
  }

  test("every shipped default playbook validates with zero errors", () => {
    expectZeroPlaybookErrors(path.join(REPO_ROOT, "packages", "docs", "template"));
  });

  test("every dogfood-instance playbook validates with zero errors", () => {
    expectZeroPlaybookErrors(REPO_ROOT);
  });
});

describe("path hygiene contract", () => {
  test("dogfood path-hygiene assets match the shipped template copies", () => {
    for (const relativePath of PATH_HYGIENE_PARITY_PATHS) {
      const dogfoodContents = readFileSync(path.join(REPO_ROOT, relativePath), "utf8");
      const templateContents = readFileSync(
        path.join(REPO_ROOT, "packages", "docs", "template", relativePath),
        "utf8",
      );

      expect(dogfoodContents).toBe(templateContents);
    }
  });

  test("routers and contracts point path decisions to the hygiene reference", () => {
    for (const relativePath of [
      "docs/AGENTS.md",
      "docs/CLAUDE.md",
      ".make-docs/references/system/AGENTS.md",
      ".make-docs/references/system/CLAUDE.md",
      ".make-docs/contracts/system/design-contract.md",
      ".make-docs/contracts/system/guide-contract.md",
      ".make-docs/contracts/system/history-record-contract.md",
      ".make-docs/contracts/system/output-contract.md",
    ]) {
      const contents = readFileSync(path.join(REPO_ROOT, relativePath), "utf8");

      expect(contents).toContain("path-and-link-hygiene.md");
    }
  });

  test("path hygiene separates reader assets from tool resources and runtime state", () => {
    for (const relativePath of [
      ".make-docs/references/system/path-and-link-hygiene.md",
      "packages/docs/template/.make-docs/references/system/path-and-link-hygiene.md",
    ]) {
      const contents = readFileSync(path.join(REPO_ROOT, relativePath), "utf8");

      expect(contents).toContain("## Namespace Hygiene");
      expect(contents).toContain("docs/assets/library/**");
      expect(contents).toContain("docs/assets/archive/history/**");
      expect(contents).toContain("docs/assets/playbooks/**");
      expect(contents).toContain(".make-docs/manifest.json");
      expect(contents).toContain("docs/assets/archive/**");
    }
  });

  test("coverage-pass contract keeps verdict and persona-target axes separate", () => {
    for (const relativePath of [
      ".make-docs/contracts/system/coverage-pass-contract.md",
      "packages/docs/template/.make-docs/contracts/system/coverage-pass-contract.md",
    ]) {
      const contents = readFileSync(path.join(REPO_ROOT, relativePath), "utf8");

      expect(contents).toContain("Verdicts and persona targets are separate axes");
      expect(contents).toContain("default configured target slugs");
      expect(contents).toContain("`developer` | `maintainer`");
      expect(contents).toContain("`slug`, `label`, `description`, and `primitive`");
    }
  });
});

describe("optional skill package consistency", () => {
  test("dogfood skill mirrors are not installed by default", () => {
    for (const relativePath of [".agents/skills", ".claude/skills"]) {
      expect(existsSync(path.join(REPO_ROOT, relativePath))).toBe(false);
    }
  });

  test("shared closeout helper scripts match across closeout skills", () => {
    for (const relativePath of [
      "scripts/closeout_history.py",
      "scripts/closeout_probe.py",
      "scripts/closeout_validate.py",
    ]) {
      const commitContents = readFileSync(
        path.join(CLOSEOUT_COMMIT_PACKAGE_ROOT, relativePath),
        "utf8",
      );
      const phaseContents = readFileSync(path.join(CLOSEOUT_PACKAGE_ROOT, relativePath), "utf8");

      expect(phaseContents).toBe(commitContents);
    }
  });
});
