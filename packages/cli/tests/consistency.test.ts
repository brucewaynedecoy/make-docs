import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import { getDesiredAssets } from "../src/catalog";
import { listShippedConformanceAssetErrors } from "../src/conformance";
import { parseManagedBlock } from "../src/managed-block";
import { defaultSelections, resolveInstallProfile } from "../src/profile";
import { getDesiredSkillAssets } from "../src/skill-catalog";
import { loadSkillRegistry } from "../src/skill-registry";
import { PACKAGE_ROOT, readPackageFile, TEMPLATE_ROOT } from "../src/utils";

const REPO_ROOT = path.resolve(TEMPLATE_ROOT, "..", "..", "..");

const RISK_REGISTER_TEMPLATE_PATHS = [
  ".make-docs/system/templates/prd-risk-register.md",
  "packages/docs/template/.make-docs/system/templates/prd-risk-register.md",
  "packages/skills/decompose-codebase/assets/templates/prd-risk-register.md",
];

const DOGFOOD_TEMPLATE_PARITY_PATHS = [
  ".make-docs/system/templates/prd-risk-register.md",
  ".make-docs/system/contracts/output-contract.md",
  ".make-docs/system/references/prd-change-management.md",
];

const GUIDE_TEMPLATE_PARITY_PATHS = [
  ".make-docs/system/contracts/guide-contract.md",
  ".make-docs/system/templates/guide-developer.md",
  ".make-docs/system/templates/guide-user.md",
  ".make-docs/system/prompts/work-to-guides.prompt.md",
];

const READER_ASSET_ROUTER_PATHS = [
  "docs/assets/AGENTS.md",
  "docs/assets/CLAUDE.md",
];

const PLAYBOOK_DEFAULT_PARITY_PATHS = [
  "docs/assets/playbooks/agent/make-docs-lifecycle.playbook.md",
  "docs/assets/playbooks/agent/naive-uat-facilitator.playbook.md",
  "docs/assets/playbooks/user/naive-uat-tester.playbook.md",
];

const PATH_HYGIENE_PARITY_PATHS = [
  ".make-docs/scripts/check_path_hygiene.py",
  ".make-docs/system/prompts/docs-path-hygiene-cleanup.prompt.md",
  ".make-docs/system/references/AGENTS.md",
  ".make-docs/system/references/CLAUDE.md",
  ".make-docs/system/contracts/design-contract.md",
  ".make-docs/system/contracts/guide-contract.md",
  ".make-docs/system/contracts/history-record-contract.md",
  ".make-docs/system/contracts/output-contract.md",
  ".make-docs/system/references/path-and-link-hygiene.md",
];

const WORK_PHASE_TEMPLATE_PATHS = [
  ".make-docs/system/templates/work-phase.md",
  "packages/docs/template/.make-docs/system/templates/work-phase.md",
  "packages/skills/decompose-codebase/assets/templates/rebuild-backlog-phase.md",
];

const RETIRED_PRD_CHANGE_TEMPLATE_PATHS = [
  "packages/docs/template/.make-docs/system/templates/prd-change-addition.md",
  "packages/docs/template/.make-docs/system/templates/prd-change-revision.md",
  "packages/cli/template/.make-docs/system/templates/prd-change-addition.md",
  "packages/cli/template/.make-docs/system/templates/prd-change-revision.md",
];

const COMMIT_MESSAGE_CONVENTION_PATHS = [
  ".make-docs/system/contracts/commit-message-convention.md",
  "packages/docs/template/.make-docs/system/contracts/commit-message-convention.md",
  "packages/cli/template/.make-docs/system/contracts/commit-message-convention.md",
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
  ["prd-architecture.md", { kind: "prd", status: "active" }],
  ["prd-glossary.md", { kind: "prd", status: "active" }],
  ["prd-index.md", { kind: "prd", status: "active", followOn: true }],
  ["prd-overview.md", { kind: "prd", status: "active" }],
  ["prd-reference.md", { kind: "prd", status: "active" }],
  ["prd-risk-register.md", { kind: "prd", status: "active" }],
  ["prd-subsystem.md", { kind: "prd", status: "active" }],
  ["work-index.md", { kind: "work", status: "active", coordinate: true, followOn: true }],
  ["work-phase.md", { kind: "work", status: "active", coordinate: true }],
]);

const GENERATED_DOCUMENT_PROMPT_PATHS = [
  ".make-docs/system/prompts/coverage-pass-developer-guide.prompt.md",
  ".make-docs/system/prompts/coverage-pass-prd-reconciliation.prompt.md",
  ".make-docs/system/prompts/coverage-pass-user-guide.prompt.md",
  ".make-docs/system/prompts/designs-to-plan-change.prompt.md",
  ".make-docs/system/prompts/designs-to-plan.prompt.md",
  ".make-docs/system/prompts/plan-to-prd-change.prompt.md",
  ".make-docs/system/prompts/plan-to-prd-green-field.prompt.md",
  ".make-docs/system/prompts/prd-change-to-work.prompt.md",
  ".make-docs/system/prompts/prd-to-work-full-prd.prompt.md",
  ".make-docs/system/prompts/prd-to-work-prd-feature.prompt.md",
  ".make-docs/system/prompts/request-to-design.prompt.md",
  ".make-docs/system/prompts/session-to-history-record.prompt.md",
  ".make-docs/system/prompts/work-to-guides.prompt.md",
];

const LOCAL_PROMPT_PROJECTION_ROOT = ".make-docs/system/prompts/";
const INSTALLED_PROMPT_SOURCE_ROOT = ".make-docs/system/prompts/";

function sourcePathForLocalAsset(relativePath: string): string {
  if (relativePath.startsWith(LOCAL_PROMPT_PROJECTION_ROOT)) {
    return `${INSTALLED_PROMPT_SOURCE_ROOT}${relativePath.slice(LOCAL_PROMPT_PROJECTION_ROOT.length)}`;
  }

  return relativePath;
}

function localPathForPackageSource(relativePath: string): string {
  if (relativePath.startsWith(INSTALLED_PROMPT_SOURCE_ROOT)) {
    return `${LOCAL_PROMPT_PROJECTION_ROOT}${relativePath.slice(INSTALLED_PROMPT_SOURCE_ROOT.length)}`;
  }

  return relativePath;
}

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
      const sourcePath = sourcePathForLocalAsset(asset.relativePath);
      expect(asset.assetClass).toBe("scoped-static");
      expect(asset.sourceId).toBe(`file:${sourcePath}`);
      expect(asset.content).toBe(readPackageFile(sourcePath));
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

  test("default scaffold excludes retired Playbook defaults", () => {
    const profile = resolveInstallProfile(defaultSelections());
    const managedPaths = new Set(getDesiredAssets(profile).map((asset) => asset.relativePath));

    for (const relativePath of PLAYBOOK_DEFAULT_PARITY_PATHS) {
      expect(managedPaths.has(relativePath), relativePath).toBe(false);
      expect(existsSync(path.join(REPO_ROOT, "packages/docs/template", relativePath))).toBe(false);
      expect(existsSync(path.join(REPO_ROOT, "packages/cli/template", relativePath))).toBe(false);
      expect(existsSync(path.join(REPO_ROOT, relativePath))).toBe(true);
    }
  });
});

describe("template completeness", () => {
  test("retired editorial PRD templates are absent from source and packaged assets", () => {
    for (const relativePath of RETIRED_PRD_CHANGE_TEMPLATE_PATHS) {
      expect(existsSync(path.join(REPO_ROOT, relativePath)), relativePath).toBe(false);
    }
  });

  test("every file in the template is covered by the asset pipeline", async () => {
    const profile = resolveInstallProfile(defaultSelections());
    const managedPaths = new Set(
      getDesiredAssets(profile).map((asset) => asset.relativePath),
    );
    // Bundled Skills are selected payloads, not default system assets. Resolve
    // their registry entries through the real Skill pipeline to prove ownership.
    const registry = loadSkillRegistry(PACKAGE_ROOT);
    const bundledSkillSources = new Set<string>();
    expect(await getDesiredSkillAssets(defaultSelections(), registry)).toEqual([]);
    for (const entry of registry.skills.filter((skill) => skill.source.startsWith("file:"))) {
      const sourceRoot = fileURLToPath(entry.source);
      const sourceRelative = path.relative(TEMPLATE_ROOT, sourceRoot);
      if (sourceRelative.startsWith("..") || path.isAbsolute(sourceRelative)) continue;
      const selections = defaultSelections();
      selections.skills = true;
      selections.selectedSkills = [entry.name];
      const assets = await getDesiredSkillAssets(selections, registry);
      const payloads = [
        { source: entry.entryPoint, installPath: entry.entryPoint },
        ...entry.assets,
      ];
      for (const payload of payloads) {
        const sourcePath = path.join(sourceRoot, payload.source);
        const sourceLocalPath = localPathForPackageSource(path.relative(TEMPLATE_ROOT, sourcePath));
        const installPath = path.join(".make-docs/agentics/skills", entry.installName, payload.installPath);
        const asset = assets.find((candidate) => candidate.relativePath === installPath);
        expect(asset, sourceLocalPath).toBeDefined();
        expect(asset!.sourceId, sourceLocalPath).toMatch(/^skill:shared:/);
        if (!asset || !("content" in asset)) {
          throw new Error(`Expected a content-bearing Skill payload: ${sourceLocalPath}`);
        }
        expect(Buffer.from(asset.content), sourceLocalPath).toEqual(readFileSync(sourcePath));
        expect(managedPaths.has(installPath), sourceLocalPath).toBe(false);
        bundledSkillSources.add(sourceLocalPath);
      }
    }

    const templateFiles: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir)) {
        const full = path.join(dir, entry);
        if (statSync(full).isDirectory()) {
          walk(full);
        } else {
          templateFiles.push(localPathForPackageSource(path.relative(TEMPLATE_ROOT, full)));
        }
      }
    };
    walk(TEMPLATE_ROOT);

    const preservedLegacyPaths = new Set<string>();
    const unmanaged = templateFiles.filter((file) =>
      !managedPaths.has(file) && !preservedLegacyPaths.has(file) && !bundledSkillSources.has(file),
    );

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
      ".make-docs/system/templates",
      "packages/cli/template/.make-docs/system/templates",
      "packages/docs/template/.make-docs/system/templates",
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
        path.join(REPO_ROOT, "packages/docs/template/.make-docs/system/templates", fileName),
        "utf8",
      );

      for (const templateRoot of [
        ".make-docs/system/templates",
        "packages/cli/template/.make-docs/system/templates",
      ]) {
        const relativePath = path.join(templateRoot, fileName);
        expect(readFileSync(path.join(REPO_ROOT, relativePath), "utf8"), relativePath).toBe(
          sourceContents,
        );
      }
    }
  });

  test("link hygiene defines raw-template and generated-document checks", () => {
    const contents = readFileSync(
      path.join(
        REPO_ROOT,
        "packages/docs/template/.make-docs/system/references/path-and-link-hygiene.md",
      ),
      "utf8",
    );

    expect(contents).toContain("recognized whole-link token");
    expect(contents).toContain("reject broken concrete links");
    expect(contents).toContain("reject every unresolved link token");
    expect(contents).toContain("final target is missing");
  });

  test("shipped Markdown guidance uses canonical local paths and stable identities", () => {
    const templateRoot = path.join(REPO_ROOT, "packages/docs/template");
    const markdownFiles: string[] = [];
    const walk = (directory: string) => {
      for (const entry of readdirSync(directory)) {
        const fullPath = path.join(directory, entry);
        if (statSync(fullPath).isDirectory()) {
          walk(fullPath);
        } else if (entry.endsWith(".md")) {
          markdownFiles.push(fullPath);
        }
      }
    };
    walk(templateRoot);

    const upstreamAuthorityPath = path.join(
      templateRoot,
      ".make-docs/system/contracts/system-resource-contract.md",
    );
    for (const filePath of markdownFiles) {
      const contents = readFileSync(filePath, "utf8");
      if (filePath === upstreamAuthorityPath) {
        continue;
      }
      expect(contents, filePath).not.toContain(".make-docs/prompts/system/");
    }

    const upstreamAuthority = readFileSync(upstreamAuthorityPath, "utf8");
    for (const sourceRoot of [
      "packages/docs/template/.make-docs/system/contracts/",
      "packages/docs/template/.make-docs/system/prompts/",
      "packages/docs/template/.make-docs/system/references/",
      "packages/docs/template/.make-docs/system/templates/",
    ]) {
      expect(upstreamAuthority).toContain(sourceRoot);
    }
    expect(upstreamAuthority).toContain("## Stable Identity");
    expect(upstreamAuthority).toContain("make-docs://system/<type>/<posix-relative-path>");
    const runtimeContract = upstreamAuthority.slice(upstreamAuthority.indexOf("## Stable Identity"));
    expect(runtimeContract).not.toContain("packages/docs/template/.make-docs/");
    expect(runtimeContract).toContain("A project does not need a local copy of a resource.");
    expect(runtimeContract).toContain("Local projection is optional.");

    const designTemplate = readFileSync(
      path.join(templateRoot, ".make-docs/system/templates/design.md"),
      "utf8",
    );
    expect(designTemplate).toContain("make-docs://system/prompt/{{PROMPT_FILE}}");
    expect(designTemplate).toContain("make-docs resource read");
  });

  test("live guidance and code use canonical resource paths outside approved legacy inputs", () => {
    const roots = [
      "README.md",
      "packages/cli/README.md",
      "packages/docs/README.md",
      "packages/skills/decompose-codebase/assets/templates",
      "docs/prd",
      "docs/assets/library",
      "packages/docs/template/.make-docs/system",
      "packages/cli/src",
    ];
    const files: string[] = [];
    const visit = (relativePath: string) => {
      const absolutePath = path.join(REPO_ROOT, relativePath);
      if (statSync(absolutePath).isDirectory()) {
        for (const entry of readdirSync(absolutePath)) {
          visit(path.join(relativePath, entry));
        }
      } else if (/\.(?:md|ts)$/.test(relativePath)) {
        files.push(relativePath);
      }
    };
    roots.forEach(visit);

    for (const relativePath of files) {
      if (relativePath === "packages/cli/src/tool-directory.ts") {
        continue;
      }
      const contents = readFileSync(path.join(REPO_ROOT, relativePath), "utf8")
        .replaceAll(".make-docs/contracts/system/playbook-contract.md", "")
        .replaceAll("packages/docs/template/.make-docs/contracts/system/playbook-contract.md", "");
      expect(contents, relativePath).not.toMatch(
        /\.make-docs\/(?:contracts|prompts|references|templates)\/system(?:\/|\b)/,
      );
    }
  });

  test("each child output router pairs named local resources with exact CLI URI fallbacks", () => {
    const cases = {
      designs: [
        [".make-docs/system/references/design-workflow.md", "make-docs://system/reference/design-workflow.md"],
        [".make-docs/system/contracts/design-contract.md", "make-docs://system/contract/design-contract.md"],
        [".make-docs/system/templates/design.md", "make-docs://system/template/design.md"],
      ],
      plans: [
        [".make-docs/system/references/wave-model.md", "make-docs://system/reference/wave-model.md"],
        [".make-docs/system/references/planning-workflow.md", "make-docs://system/reference/planning-workflow.md"],
        [".make-docs/system/templates/plan-overview.md", "make-docs://system/template/plan-overview.md"],
        [".make-docs/system/templates/plan-prd.md", "make-docs://system/template/plan-prd.md"],
        [".make-docs/system/templates/plan-prd-decompose.md", "make-docs://system/template/plan-prd-decompose.md"],
        [".make-docs/system/templates/plan-prd-change.md", "make-docs://system/template/plan-prd-change.md"],
      ],
      prd: [
        [".make-docs/system/references/execution-workflow.md", "make-docs://system/reference/execution-workflow.md"],
        [".make-docs/system/contracts/output-contract.md", "make-docs://system/contract/output-contract.md"],
        [".make-docs/system/references/prd-change-management.md", "make-docs://system/reference/prd-change-management.md"],
        [".make-docs/system/templates/prd-index.md", "make-docs://system/template/prd-index.md"],
        [".make-docs/system/templates/prd-overview.md", "make-docs://system/template/prd-overview.md"],
        [".make-docs/system/templates/prd-architecture.md", "make-docs://system/template/prd-architecture.md"],
        [".make-docs/system/templates/prd-subsystem.md", "make-docs://system/template/prd-subsystem.md"],
        [".make-docs/system/templates/prd-reference.md", "make-docs://system/template/prd-reference.md"],
        [".make-docs/system/templates/prd-glossary.md", "make-docs://system/template/prd-glossary.md"],
        [".make-docs/system/templates/prd-risk-register.md", "make-docs://system/template/prd-risk-register.md"],
      ],
      work: [
        [".make-docs/system/references/wave-model.md", "make-docs://system/reference/wave-model.md"],
        [".make-docs/system/references/execution-workflow.md", "make-docs://system/reference/execution-workflow.md"],
        [".make-docs/system/templates/work-index.md", "make-docs://system/template/work-index.md"],
        [".make-docs/system/templates/work-phase.md", "make-docs://system/template/work-phase.md"],
      ],
    } as const;
    for (const [directory, pairs] of Object.entries(cases)) {
      for (const fileName of ["AGENTS.md", "CLAUDE.md"]) {
        const relativePath = `docs/${directory}/${fileName}`;
        const contents = readFileSync(path.join(TEMPLATE_ROOT, relativePath), "utf8");
        expect(contents, relativePath).toContain("make-docs resource read");
        for (const [localPath, uri] of pairs) {
          expect(contents, `${relativePath}: ${localPath}`).toContain(localPath);
          expect(contents, `${relativePath}: ${uri}`).toContain(uri);
        }
      }
    }
  });

  test("generated document prompts require PRD 23 metadata frontmatter", () => {
    for (const relativePath of GENERATED_DOCUMENT_PROMPT_PATHS) {
      for (const [rootPrefix, promptPath] of [
        ["", relativePath],
        ["packages/cli/template/", sourcePathForLocalAsset(relativePath)],
        ["packages/docs/template/", sourcePathForLocalAsset(relativePath)],
      ] as const) {
        const contents = readFileSync(path.join(REPO_ROOT, rootPrefix, promptPath), "utf8");

        expect(contents).toContain("PRD 23 YAML frontmatter");
        expect(contents).toContain("common `title`, `kind`, and `status`");
        expect(contents).toContain("omit unknown coordinate levels");
      }
    }
  });

  test("generated document prompt copies match the package source", () => {
    for (const relativePath of GENERATED_DOCUMENT_PROMPT_PATHS) {
      const sourceContents = readFileSync(
        path.join(REPO_ROOT, "packages/docs/template", sourcePathForLocalAsset(relativePath)),
        "utf8",
      );

      for (const [rootPrefix, localPath] of [
        ["", relativePath],
        ["packages/cli/template/", sourcePathForLocalAsset(relativePath)],
      ] as const) {
        const promptPath = path.join(rootPrefix, localPath);
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
      path.join(REPO_ROOT, ".make-docs/system/contracts/commit-message-convention.md"),
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
      ".make-docs/system/contracts/output-contract.md",
      ".make-docs/system/references/execution-workflow.md",
      "packages/docs/template/.make-docs/system/contracts/output-contract.md",
      "packages/docs/template/.make-docs/system/references/execution-workflow.md",
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
      expect(contents).toContain(
        "Do not use `## Requirement History` as a substitute for unresolved register state",
      );
      expect(contents).not.toContain("### Change Notes");
      expect(contents).toContain("| Status | Decision | Follow-Up |");
      expect(contents).toContain("`Open`, `Confirming`, `Deferred`, or `Closed`");
      expect(contents).toContain("**Why it matters**");
      expect(contents).toContain("**Recommendation**");
      expect(contents).toContain("**To close**");
    }
  });

  test("risk-register references keep unresolved state out of requirement history", () => {
    for (const relativePath of [
      ".make-docs/system/references/prd-change-management.md",
      "packages/docs/template/.make-docs/system/references/prd-change-management.md",
    ]) {
      const contents = readFileSync(path.join(REPO_ROOT, relativePath), "utf8");

      expect(contents).toContain(
        "Do not use `## Requirement History` as a substitute for unresolved risk or decision tracking",
      );
      expect(contents).not.toContain("### Change Notes");
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
      "D-004 ResolvedAsset Asset Classes Are Both Live",
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
      "D-020 Shipped Lifecycle Skills Instruct the Removed `make-docs operations` Command Surface",
      "D-021 Pre-W18 Subsystems Landed as Unwired or Partially Wired Libraries (Plugin Substrate, Metadata Drift, Guide Persona Validation)",
      "D-022 PRD 37 Mandated a Conformance Asset Home the Assets Router Never Admitted",
      "D-023 The First-Pass Conformance Scenario Specs Were Never Executable as Written",
      "D-024 The Mandated `.make-docs/conformance/` Transcript Home Contradicts the No-Repo-Run-Residue Principle",
      "D-025 Harness-Named Scenario Identity Bifurcates the Tuple-Dimension Model",
      "D-026 The Uninstall Check Flags Make Docs-Managed Scaffolding as User-Authored Removals",
      "D-027 The Conformance Kit Runs Whatever `make-docs` Is on PATH, Not the CLI It Was Generated From",
      "D-028 Same-Day Kit Regeneration Collides on the Deterministic Session Root With No Ergonomic Reset",
      "D-029 W19 R1 Resource Topology and Router Authority Drifted",
      "D-030 W19 R1 Documentation Surface Router Topology Was Omitted",
    ]);
    expect(itemHeadings(questions)).toEqual([
      "Q-001 What Is the Long-Term Skills Delivery Contract?",
      "Q-002 Should Template and Reference Modes Remain Public Options?",
      "Q-003 Should the Legacy ResolvedAsset Asset-Class Taxonomy Be Simplified?",
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
      "Q-017 Should the Broader Managed-Asset Layout Centralize at the Machine Level?",
      "Q-018 How Should Configuration Be Laid Out, Owned, and Discovered?",
      "Q-019 How Should the Persona Model Evolve and Gain Interactive Setup?",
      "Q-020 Should Other Playbook Sections Gain Imposed Structure Beyond Dependencies?",
      "Q-021 Maintainer-Facing Terminology Needs a Plain-Language Rule and Glossary Backing",
      "Q-022 The Make Docs Agentics Production Pipeline",
      "Q-023 How must P3 handle the existing legacy Playbook and Protocol surfaces?",
      "Q-024 What is the finite P3 operation inventory and phase ownership?",
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
      "R-017 System Workflow Authority Could Blur Into Skill or Optional Agentic Outputs",
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
      "R-028 The W18 R13 Conformance Execution Redesign Must Reconcile Every Consumer of the Superseded Spec Forms",
      "R-029 Unsupported Performance Targets Could Become De Facto Product Authority",
      "R-030 Performance Evidence Could Become an Unbounded Rerun Loop",
      "R-031 Plan or Work Profiles Could Become a Second Performance Authority",
      "R-032 Expired or Non-Comparable Performance Evidence Could Be Reused as Current Proof",
      "R-033 Human Experience Structure Could Become Checklist Compliance",
      "R-034 Testing Proportionality, Gate, and Human-Burden Drift",
    ]);
  });

  test("dogfood risk-register contracts match the shipped template copies", () => {
    for (const relativePath of DOGFOOD_TEMPLATE_PARITY_PATHS) {
      const dogfoodContents = readFileSync(path.join(REPO_ROOT, relativePath), "utf8");
      const templateContents = readFileSync(
        path.join(REPO_ROOT, "packages", "docs", "template", sourcePathForLocalAsset(relativePath)),
        "utf8",
      );

      expect(dogfoodContents).toBe(templateContents);
    }
  });
});

describe("guide generation routing contract", () => {
  test("the root asset routers route Persona assets and legacy inputs", () => {
    for (const relativePath of [
      "docs/assets/AGENTS.md",
      "docs/assets/CLAUDE.md",
      "packages/docs/template/docs/assets/AGENTS.md",
      "packages/docs/template/docs/assets/CLAUDE.md",
    ]) {
      const contents = readFileSync(path.join(REPO_ROOT, relativePath), "utf8");

      expect(contents).toContain("docs/assets/<persona-slug>/");
      expect(contents).toContain("docs/assets/<persona-slug>/testing/");
      expect(contents).toContain("legacy migration inputs");
      expect(contents).toContain(".make-docs/system/<type>/");
    }
  });

  test("guide contract defines audience intent and future coverage handling", () => {
    for (const relativePath of [
      ".make-docs/system/contracts/guide-contract.md",
      "packages/docs/template/.make-docs/system/contracts/guide-contract.md",
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

  test("dogfood guide contracts match the shipped template copies", () => {
    for (const relativePath of GUIDE_TEMPLATE_PARITY_PATHS) {
      const dogfoodContents = readFileSync(path.join(REPO_ROOT, relativePath), "utf8");
      const templateContents = readFileSync(
        path.join(REPO_ROOT, "packages", "docs", "template", sourcePathForLocalAsset(relativePath)),
        "utf8",
      );

      expect(dogfoodContents).toBe(templateContents);
    }
  });

  test("dogfood Playbooks remain project content after shipped defaults retire", () => {
    for (const relativePath of PLAYBOOK_DEFAULT_PARITY_PATHS) {
      expect(existsSync(path.join(REPO_ROOT, relativePath))).toBe(true);
      expect(existsSync(path.join(REPO_ROOT, "packages/docs/template", relativePath))).toBe(false);
      expect(existsSync(path.join(REPO_ROOT, "packages/cli/template", relativePath))).toBe(false);
    }
  });

  function collectPlaybookPaths(instanceRoot: string): string[] {
    const playbooksRoot = path.join(instanceRoot, "docs", "assets", "playbooks");
    const playbookPaths: string[] = [];
    if (!existsSync(playbooksRoot)) return playbookPaths;
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

  test("the shipped template has no default Playbooks", () => {
    expect(collectPlaybookPaths(path.join(REPO_ROOT, "packages", "docs", "template"))).toEqual([]);
  });
});

describe("path hygiene contract", () => {
  test("dogfood path-hygiene assets match the shipped template copies", () => {
    for (const relativePath of PATH_HYGIENE_PARITY_PATHS) {
      const dogfoodContents = readFileSync(path.join(REPO_ROOT, relativePath), "utf8");
      const templateContents = readFileSync(
        path.join(
          REPO_ROOT,
          "packages",
          "docs",
          "template",
          sourcePathForLocalAsset(relativePath),
        ),
        "utf8",
      );

      expect(dogfoodContents).toBe(templateContents);
    }
  });

  test("routers and contracts point path decisions to the hygiene reference", () => {
    for (const relativePath of [
      "docs/AGENTS.md",
      "docs/CLAUDE.md",
      ".make-docs/system/references/AGENTS.md",
      ".make-docs/system/references/CLAUDE.md",
      ".make-docs/system/contracts/design-contract.md",
      ".make-docs/system/contracts/guide-contract.md",
      ".make-docs/system/contracts/history-record-contract.md",
      ".make-docs/system/contracts/output-contract.md",
    ]) {
      const contents = readFileSync(path.join(REPO_ROOT, relativePath), "utf8");

      expect(contents).toContain("path-and-link-hygiene.md");
    }
  });

  test("path hygiene separates reader assets from tool resources and runtime state", () => {
    for (const relativePath of [
      ".make-docs/system/references/path-and-link-hygiene.md",
      "packages/docs/template/.make-docs/system/references/path-and-link-hygiene.md",
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
      ".make-docs/system/contracts/coverage-pass-contract.md",
      "packages/docs/template/.make-docs/system/contracts/coverage-pass-contract.md",
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
  test("withdrawn lifecycle skill sources are removed from the skills workspace", () => {
    // D-020 stopgap: the four lifecycle skills were pulled from the shipped
    // registry and their source directories deleted; regeneration is owned
    // by the Q-022 agentics production pipeline.
    for (const withdrawnSkill of [
      "closeout-commit",
      "closeout-phase",
      "work-on-phase",
      "work-on-wave",
    ]) {
      expect(
        existsSync(path.join(REPO_ROOT, "packages", "skills", withdrawnSkill)),
      ).toBe(false);
    }
  });
});

describe("conformance assets stay maintainer-only (W18 R9 P3, R-TEST-3, R-KEEP-1)", () => {
  test("the shipped template and the packaged copy carry no conformance assets", () => {
    // Packaging validation surface wiring: this exclusion check runs behind
    // `validate:defaults` (and again in the standard suite and the
    // smoke-pack tarball sweep). A green run proves the maintainer-only
    // boundary held; it is never a support claim for any harness (R-KEEP-1).
    expect(listShippedConformanceAssetErrors({ repoRoot: REPO_ROOT })).toEqual([]);
  });
});
