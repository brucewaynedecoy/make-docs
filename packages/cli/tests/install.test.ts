import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readlinkSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  applyInstallPlan,
  applySkillsOnlyInstallPlan,
  findReviewableManagedFileConflicts,
  planInstall,
  planSkillsOnlyInstall,
} from "../src/install";
import { parseManagedBlock, renderManagedBlock } from "../src/managed-block";
import { loadManifest } from "../src/manifest";
import { defaultSelections, resolveInstallProfile } from "../src/profile";
import {
  DEFAULT_SYSTEM_ASSET_MATERIALIZATION_MODE,
  SYSTEM_ASSET_MATERIALIZATION_MODES,
} from "../src/types";
import type { SystemAssetMaterializationMode } from "../src/types";
import { hashText, readPackageFile } from "../src/utils";
import {
  cleanupTempDir,
  collectFiles,
  collectMarkdownContents,
  createTempDir,
  mockSkillFetches,
} from "./helpers";

async function installWithSelections(
  targetDir: string,
  configure: (selections: ReturnType<typeof defaultSelections>) => void,
): Promise<{
  selections: ReturnType<typeof defaultSelections>;
  plan: Awaited<ReturnType<typeof planInstall>>;
  result: ReturnType<typeof applyInstallPlan>;
  manifest: NonNullable<ReturnType<typeof loadManifest>>;
}> {
  const selections = defaultSelections();
  configure(selections);

  const existingManifest = loadManifest(targetDir);
  let plan = await planInstall({
    targetDir,
    selections,
    existingManifest,
  });
  const reviewableConflicts = findReviewableManagedFileConflicts(plan);
  if (reviewableConflicts.length > 0) {
    const managedFileConflictResolutions: Record<string, "overwrite"> = {};
    for (const conflict of reviewableConflicts) {
      managedFileConflictResolutions[conflict.relativePath] = "overwrite";
    }
    plan = await planInstall({
      targetDir,
      selections,
      existingManifest,
      managedFileConflictResolutions,
    });
  }
  const result = applyInstallPlan({
    targetDir,
    plan,
    existingManifest,
  });

  return { selections, plan, result, manifest: loadManifest(targetDir)! };
}

async function syncSkillsOnly(
  targetDir: string,
  configure: (selections: ReturnType<typeof defaultSelections>) => void = () => {},
  remove = false,
): Promise<{
  selections: ReturnType<typeof defaultSelections>;
  plan: Awaited<ReturnType<typeof planSkillsOnlyInstall>>;
  result: ReturnType<typeof applySkillsOnlyInstallPlan>;
  manifest: NonNullable<ReturnType<typeof loadManifest>>;
}> {
  const existingManifest = loadManifest(targetDir);
  const selections = existingManifest
    ? structuredClone(existingManifest.selections)
    : defaultSelections();
  selections.skills = true;
  configure(selections);

  const plan = await planSkillsOnlyInstall({
    targetDir,
    selections,
    existingManifest,
    remove,
  });
  const result = applySkillsOnlyInstallPlan({
    targetDir,
    plan,
    existingManifest,
  });

  return { selections, plan, result, manifest: loadManifest(targetDir)! };
}

const FULL_PROFILE_INSTRUCTION_DIRS = [
  ".",
  "docs",
  "docs/assets",
  "docs/assets/archive",
  "docs/assets/artifacts",
  "docs/assets/library",
  "docs/assets/playbooks",
  "docs/designs",
  "docs/plans",
  "docs/prd",
  "docs/work",
  ".make-docs",
  ".make-docs/contracts/system",
  ".make-docs/references/system",
  ".make-docs/references/system/prompts",
  ".make-docs/templates/system",
] as const;

const LEGACY_W17_AGENTS_BODY = [
  "See `.make-docs/AGENTS.md` for the full make-docs routing.",
  "",
  "When asked to create documentation for this project that is not `README.md`, read the same-named instruction file in `docs/` before writing.",
  "",
].join("\n");
const LEGACY_W17_CLAUDE_BODY = "@.make-docs/CLAUDE.md\n";
const LEGACY_W17_DEDICATED_CONTENT =
  "# make-docs Instructions\n\nWhen asked to create documentation for this project that is not `README.md`, read the same-named instruction file in `docs/` before writing.\n";
const ALL_SKILL_NAMES = [
  "archive-docs",
  "cleanup-docs",
  "closeout-commit",
  "closeout-phase",
  "decompose-codebase",
  "work-on-phase",
  "work-on-wave",
];

function getInstructionPaths(instructionKind: "AGENTS.md" | "CLAUDE.md"): string[] {
  return FULL_PROFILE_INSTRUCTION_DIRS.map((relativeDir) =>
    relativeDir === "." ? instructionKind : path.join(relativeDir, instructionKind),
  );
}

function enableAllSkills(selections: ReturnType<typeof defaultSelections>): void {
  selections.skills = true;
  selections.selectedSkills = [...ALL_SKILL_NAMES];
}

function readSkillSourceFile(skillName: string, sourcePath: string): string {
  return readFileSync(
    new URL(`../../skills/${skillName}/${sourcePath}`, import.meta.url),
    "utf8",
  );
}

function writeManifestJson(
  targetDir: string,
  manifest: NonNullable<ReturnType<typeof loadManifest>>,
): void {
  writeFileSync(
    path.join(targetDir, ".make-docs/manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );
}

function mockHomeDirectory(homeDir: string): () => void {
  const previousHome = process.env.HOME;
  process.env.HOME = homeDir;
  vi.spyOn(os, "homedir").mockReturnValue(homeDir);

  return () => {
    if (previousHome === undefined) {
      delete process.env.HOME;
      return;
    }

    process.env.HOME = previousHome;
  };
}

function getPlannedAction(
  plan: Awaited<ReturnType<typeof planInstall>>,
  relativePath: string,
) {
  const action = plan.actions.find((candidate) => candidate.relativePath === relativePath);
  expect(action).toBeDefined();
  return action!;
}

function expectNativeSkillExposure(options: {
  targetDir: string;
  exposurePath: string;
  canonicalPath: string;
  expectedContent: string;
}): void {
  const { targetDir, exposurePath, canonicalPath, expectedContent } = options;
  const absoluteExposurePath = path.isAbsolute(exposurePath)
    ? exposurePath
    : path.join(targetDir, exposurePath);
  const absoluteCanonicalPath = path.isAbsolute(canonicalPath)
    ? canonicalPath
    : path.join(targetDir, canonicalPath);
  const stats = lstatSync(absoluteExposurePath);
  expect(stats.isSymbolicLink() || stats.isDirectory()).toBe(true);

  if (stats.isSymbolicLink()) {
    const target = path.resolve(
      path.dirname(absoluteExposurePath),
      readlinkSync(absoluteExposurePath),
    );
    expect(target).toBe(path.resolve(absoluteCanonicalPath));
  }

  expect(readFileSync(path.join(absoluteExposurePath, "SKILL.md"), "utf8")).toBe(
    expectedContent,
  );
}

describe("installer integration", () => {
  beforeEach(() => {
    mockSkillFetches();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  test("installs the correct instruction files for both harnesses", async () => {
    const targetDir = createTempDir();
    try {
      await installWithSelections(targetDir, (selections) => {
        selections.harnesses["claude-code"] = true;
        selections.harnesses.codex = true;
      });

      for (const relativePath of getInstructionPaths("CLAUDE.md")) {
        expect(existsSync(path.join(targetDir, relativePath))).toBe(true);
      }

      for (const relativePath of getInstructionPaths("AGENTS.md")) {
        expect(existsSync(path.join(targetDir, relativePath))).toBe(true);
      }
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("installs the full default profile", async () => {
    const targetDir = createTempDir();
    try {
      const { manifest, plan } = await installWithSelections(targetDir, () => {});

      expect(plan.systemAssetMaterialization.mode).toBe(
        DEFAULT_SYSTEM_ASSET_MATERIALIZATION_MODE,
      );
      expect(plan.systemAssetMaterialization.deferredSystemAssetPaths).toEqual([]);
      expect(plan.systemAssetMaterialization.localBootstrapPaths).toEqual(
        expect.arrayContaining([
          ".make-docs/manifest.json",
          ".make-docs/config.yaml",
          "AGENTS.md",
          "docs/AGENTS.md",
        ]),
      );
      expect(
        plan.systemAssetMaterialization.materializationClasses["docs/work/AGENTS.md"],
      ).toBe("materialized-system-asset");
      expect(manifest.schemaVersion).toBe(2);
      expect(manifest.systemAssetMaterialization.mode).toBe("full-snapshot");
      expect(manifest.systemAssetMaterialization.sourceProvider).toBe("package");
      expect(manifest.systemAssetMaterialization.hashAlgorithm).toBe("sha256");
      expect(manifest.systemAssetMaterialization.assets["docs/work/AGENTS.md"]).toMatchObject({
        hashAlgorithm: "sha256",
        logicalAssetId: "docs/work/AGENTS.md",
        localPath: "docs/work/AGENTS.md",
        materializationClass: "materialized-system-asset",
        sourceProvider: "package",
        selectionTrigger: "profile-selection",
      });
      expect(
        manifest.systemAssetMaterialization.assets["docs/work/AGENTS.md"].expectedHashes,
      ).toEqual([manifest.files["docs/work/AGENTS.md"].hash]);
      expect(manifest.files["docs/work/AGENTS.md"].systemAsset).toMatchObject({
        logicalAssetId: "docs/work/AGENTS.md",
        localPath: "docs/work/AGENTS.md",
      });
      expect(manifest.effectiveCapabilities).toEqual(["designs", "plans", "prd", "work"]);
      expect(manifest.selections.skills).toBe(false);
      expect(manifest.selections.selectedSkills).toEqual([]);
      expect(manifest.skillFiles).toEqual([]);
      expect(existsSync(path.join(targetDir, ".claude/skills"))).toBe(false);
      expect(existsSync(path.join(targetDir, ".agents/skills"))).toBe(false);
      expect(existsSync(path.join(targetDir, ".claude/skill-assets"))).toBe(false);
      expect(existsSync(path.join(targetDir, ".agents/skill-assets"))).toBe(false);
      expect(existsSync(path.join(targetDir, ".make-docs/config.yaml"))).toBe(false);
      expect(manifest.files[".make-docs/config.yaml"]).toBeUndefined();
      expect(manifest.systemAssetMaterialization.assets[".make-docs/config.yaml"]).toBeUndefined();
      expect(existsSync(path.join(targetDir, "docs/work/AGENTS.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/assets/artifacts/AGENTS.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/assets/artifacts/CLAUDE.md"))).toBe(true);
      expect(
        existsSync(path.join(targetDir, ".make-docs/scripts/check_path_hygiene.py")),
      ).toBe(true);
      expect(
        existsSync(
          path.join(targetDir, ".make-docs/references/system/prompts/docs-path-hygiene-cleanup.prompt.md"),
        ),
      ).toBe(true);
      expect(existsSync(path.join(targetDir, ".make-docs/references/system/prompts/designs-to-plan.prompt.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, ".make-docs/references/system/prompts/work-to-guides.prompt.md"))).toBe(true);
      expect(
        existsSync(path.join(targetDir, ".make-docs/references/system/harness-capability-matrix.md")),
      ).toBe(true);

      expect(existsSync(path.join(targetDir, ".make-docs/contracts/system/guide-contract.md"))).toBe(true);
      expect(
        existsSync(path.join(targetDir, ".make-docs/references/system/path-and-link-hygiene.md")),
      ).toBe(true);
      expect(existsSync(path.join(targetDir, ".make-docs/templates/system/guide-developer.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, ".make-docs/templates/system/guide-user.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/assets/library/AGENTS.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/assets/library/CLAUDE.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/assets/playbooks/AGENTS.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/assets/playbooks/CLAUDE.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/assets/archive/AGENTS.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/assets/archive/CLAUDE.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/assets/AGENTS.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/assets/CLAUDE.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/assets/archive/AGENTS.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/assets/archive/CLAUDE.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/assets/breadcrumbs"))).toBe(false);
      expect(existsSync(path.join(targetDir, "docs/assets/history"))).toBe(false);
      expect(existsSync(path.join(targetDir, "docs/assets/guides"))).toBe(false);
      expect(existsSync(path.join(targetDir, "docs/guides"))).toBe(false);
      expect(existsSync(path.join(targetDir, "docs/library"))).toBe(false);
      expect(existsSync(path.join(targetDir, ".make-docs/references/system/AGENTS.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, ".make-docs/references/system/CLAUDE.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/assets/library/agent"))).toBe(false);

      const libraryRouter = readFileSync(path.join(targetDir, "docs/assets/library/AGENTS.md"), "utf8");
      expect(libraryRouter).toContain("guide-contract.md");
      expect(libraryRouter).toContain("developer`, `user`, `both`, `update-existing`, `link-only`, or `none");
      expect(libraryRouter).toContain("re-check overlapping guides");
      expect(libraryRouter).toContain("## Future Coverage");
      expect(libraryRouter).not.toContain("docs/assets/library/agent");
      const assetsRouter = readFileSync(path.join(targetDir, "docs/assets/AGENTS.md"), "utf8");
      expect(assetsRouter).toContain("docs/assets/library/<persona-slug>/");
      expect(assetsRouter).toContain("docs/assets/playbooks/<persona-slug>/");
      expect(assetsRouter).toContain("docs/assets/archive/**");
      expect(assetsRouter).toContain("docs/assets/archive/history/**");
      expect(assetsRouter).not.toContain("docs/assets/breadcrumbs/**");
      expect(manifest.files[".make-docs/scripts/check_path_hygiene.py"]?.sourceId).toBe(
        "file:.make-docs/scripts/check_path_hygiene.py",
      );
      expect(
        manifest.files[".make-docs/references/system/prompts/docs-path-hygiene-cleanup.prompt.md"]?.sourceId,
      ).toBe("file:.make-docs/references/system/prompts/docs-path-hygiene-cleanup.prompt.md");
      expect(manifest.files[".make-docs/references/system/path-and-link-hygiene.md"]?.sourceId).toBe(
        "file:.make-docs/references/system/path-and-link-hygiene.md",
      );
      expect(manifest.files["docs/assets/library/AGENTS.md"]?.sourceId).toBe(
        "file:docs/assets/library/AGENTS.md",
      );
      expect(manifest.files["docs/assets/playbooks/AGENTS.md"]?.sourceId).toBe(
        "file:docs/assets/playbooks/AGENTS.md",
      );
      expect(manifest.files["docs/assets/archive/AGENTS.md"]?.sourceId).toBe(
        "file:docs/assets/archive/AGENTS.md",
      );
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("preserves project config across install and reconfigure without manifest ownership", async () => {
    const targetDir = createTempDir();
    const configPath = path.join(targetDir, ".make-docs/config.yaml");
    const configContents = [
      "labels:",
      "  documentKinds:",
      "    design: Idea",
      "personas:",
      "  - slug: support-lead",
      "    label: Support Lead",
      "    description: Support leaders reviewing generated documentation.",
      "    primitive: maintainer",
      "",
    ].join("\n");

    try {
      mkdirSync(path.dirname(configPath), { recursive: true });
      writeFileSync(configPath, configContents, "utf8");

      const { manifest } = await installWithSelections(targetDir, () => {});

      expect(readFileSync(configPath, "utf8")).toBe(configContents);
      expect(manifest.files[".make-docs/config.yaml"]).toBeUndefined();
      expect(manifest.systemAssetMaterialization.assets[".make-docs/config.yaml"]).toBeUndefined();

      const reconfigureSelections = structuredClone(manifest.selections);
      reconfigureSelections.capabilities.work = false;
      const reconfigurePlan = await planInstall({
        targetDir,
        selections: reconfigureSelections,
        existingManifest: manifest,
      });

      expect(reconfigurePlan.actions.some((action) => action.relativePath === ".make-docs/config.yaml")).toBe(false);

      const reconfigureResult = applyInstallPlan({
        targetDir,
        plan: reconfigurePlan,
        existingManifest: manifest,
      });

      expect(readFileSync(configPath, "utf8")).toBe(configContents);
      expect(reconfigureResult.manifest.files[".make-docs/config.yaml"]).toBeUndefined();
      expect(
        reconfigureResult.manifest.systemAssetMaterialization.assets[".make-docs/config.yaml"],
      ).toBeUndefined();
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test.each(
    SYSTEM_ASSET_MATERIALIZATION_MODES.filter(
      (mode) => mode !== DEFAULT_SYSTEM_ASSET_MATERIALIZATION_MODE,
    ),
  )(
    "keeps local bootstrap assets materialized for internal %s mode",
    async (mode: SystemAssetMaterializationMode) => {
      const targetDir = createTempDir();
      try {
        const selections = defaultSelections();
        selections.harnesses["claude-code"] = true;
        selections.harnesses.codex = true;

        const existingManifest = loadManifest(targetDir);
        const plan = await planInstall({
          targetDir,
          selections,
          existingManifest,
          systemAssetMaterializationMode: mode,
        });

        expect(plan.systemAssetMaterialization.mode).toBe(mode);
        expect(plan.systemAssetMaterialization.localBootstrapPaths).toEqual([
          ".make-docs/config.yaml",
          ".make-docs/contracts/custom",
          ".make-docs/manifest.json",
          ".make-docs/references/custom",
          ".make-docs/scripts/custom",
          ".make-docs/templates/custom",
          "AGENTS.md",
          "CLAUDE.md",
          "docs/AGENTS.md",
          "docs/CLAUDE.md",
        ]);
        expect(plan.systemAssetMaterialization.deferredSystemAssetPaths).toContain(
          "docs/work/AGENTS.md",
        );
        expect(plan.systemAssetMaterialization.deferredSystemAssetPaths).toContain(
          ".make-docs/references/system/path-and-link-hygiene.md",
        );
        expect(
          plan.systemAssetMaterialization.materializationClasses[
            ".make-docs/manifest.json"
          ],
        ).toBe("always-local-bootstrap");
        expect(plan.systemAssetMaterialization.materializationClasses["docs/AGENTS.md"]).toBe(
          "always-local-bootstrap",
        );
        expect(
          plan.systemAssetMaterialization.materializationClasses["docs/work/AGENTS.md"],
        ).toBe("deferred-system-asset");

        const result = applyInstallPlan({ targetDir, plan, existingManifest });
        const manifest = result.manifest;

        expect(manifest.schemaVersion).toBe(2);
        expect(manifest.systemAssetMaterialization.mode).toBe(mode);
        expect(manifest.systemAssetMaterialization.assets["docs/work/AGENTS.md"]).toMatchObject({
          logicalAssetId: "docs/work/AGENTS.md",
          materializationClass: "deferred-system-asset",
          offlineExpectation: "reviewed-full-snapshot-fallback",
          selectionTrigger: "internal-materialization-mode",
        });
        expect(
          manifest.systemAssetMaterialization.assets["docs/work/AGENTS.md"].expectedHashes,
        ).toHaveLength(1);
        expect(manifest.systemAssetMaterialization.assets["docs/work/AGENTS.md"].localPath).toBe(
          undefined,
        );
        expect(manifest.files["docs/AGENTS.md"].systemAsset).toMatchObject({
          logicalAssetId: "docs/AGENTS.md",
          localPath: "docs/AGENTS.md",
          materializationClass: "always-local-bootstrap",
        });
        expect(existsSync(path.join(targetDir, "AGENTS.md"))).toBe(true);
        expect(existsSync(path.join(targetDir, "CLAUDE.md"))).toBe(true);
        expect(existsSync(path.join(targetDir, "docs/AGENTS.md"))).toBe(true);
        expect(existsSync(path.join(targetDir, "docs/CLAUDE.md"))).toBe(true);
        expect(existsSync(path.join(targetDir, ".make-docs/manifest.json"))).toBe(true);
        expect(existsSync(path.join(targetDir, ".make-docs/config.yaml"))).toBe(false);
        expect(existsSync(path.join(targetDir, "docs/work/AGENTS.md"))).toBe(false);
        expect(
          existsSync(path.join(targetDir, ".make-docs/references/system/path-and-link-hygiene.md")),
        ).toBe(false);
        expect(manifest.files[".make-docs/config.yaml"]).toBeUndefined();
        expect(manifest.systemAssetMaterialization.assets[".make-docs/config.yaml"]).toBeUndefined();
        expect(manifest.skillFiles).toEqual([]);
        expect(existsSync(path.join(targetDir, ".claude/skills"))).toBe(false);
        expect(existsSync(path.join(targetDir, ".agents/skills"))).toBe(false);
      } finally {
        cleanupTempDir(targetDir);
      }
    },
  );

  test("routes provider-backed local bootstrap refresh conflicts through managed-file review", async () => {
    const targetDir = createTempDir();
    try {
      const selections = defaultSelections();
      const initialPlan = await planInstall({
        targetDir,
        selections,
        existingManifest: null,
        systemAssetMaterializationMode: "provider-backed",
      });
      const initialResult = applyInstallPlan({
        targetDir,
        plan: initialPlan,
        existingManifest: null,
      });
      const rootPath = path.join(targetDir, "AGENTS.md");
      const installedContent = readFileSync(rootPath, "utf8");
      writeFileSync(
        rootPath,
        installedContent.replace("same-named instruction file", "edited instruction file"),
        "utf8",
      );

      const plan = await planInstall({
        targetDir,
        selections,
        existingManifest: initialResult.manifest,
        systemAssetMaterializationMode: "provider-backed",
      });

      expect(getPlannedAction(plan, "AGENTS.md")).toMatchObject({
        type: "skip-conflict",
        reason:
          "Existing conflicting make-docs managed block was skipped because no reassert resolution was provided.",
      });
      expect(findReviewableManagedFileConflicts(plan)).toEqual([
        {
          relativePath: "AGENTS.md",
          group: "agent-instructions",
          sourceId: "file:AGENTS.md",
          reason:
            "Existing conflicting make-docs managed block was skipped because no reassert resolution was provided.",
          instructionKind: "AGENTS.md",
          scope: "managed-block",
        },
      ]);
      expect(() =>
        applyInstallPlan({ targetDir, plan, existingManifest: initialResult.manifest }),
      ).toThrow(
        "Cannot apply install plan with unresolved managed-file conflicts: AGENTS.md.",
      );
      expect(readFileSync(rootPath, "utf8")).toContain("edited instruction file");
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("rejects manifests with removed asset selection fields", () => {
    const targetDir = createTempDir();
    try {
      const manifestPath = path.join(targetDir, ".make-docs/manifest.json");
      mkdirSync(path.dirname(manifestPath), { recursive: true });

      writeFileSync(
        manifestPath,
        `${JSON.stringify(
          {
            schemaVersion: 1,
            packageName: "make-docs",
            packageVersion: "0.1.0",
            updatedAt: new Date().toISOString(),
            profileId: "legacy-profile",
            selections: {
              capabilities: {
                designs: true,
                plans: true,
                prd: true,
                work: true,
              },
              prompts: true,
              templatesMode: "all",
              referencesMode: "all",
              harnesses: {
                "claude-code": true,
                codex: false,
              },
              skills: true,
              skillScope: "project",
              selectedSkills: [
                "archive-docs",
                "closeout-commit",
                "closeout-phase",
                "decompose-codebase",
              ],
            },
            effectiveCapabilities: ["designs", "plans", "prd", "work"],
            files: {},
            skillFiles: [],
          },
          null,
          2,
        )}\n`,
        "utf8",
      );

      expect(() => loadManifest(targetDir)).toThrow(
        /Fix or remove the stale manifest and rerun bare `make-docs`/,
      );
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("rejects manifests with deprecated optionalSkills selections", () => {
    const targetDir = createTempDir();
    try {
      const manifestPath = path.join(targetDir, ".make-docs/manifest.json");
      mkdirSync(path.dirname(manifestPath), { recursive: true });

      writeFileSync(
        manifestPath,
        `${JSON.stringify(
          {
            schemaVersion: 1,
            packageName: "make-docs",
            packageVersion: "0.1.0",
            updatedAt: new Date().toISOString(),
            profileId: "legacy-optional-skills",
            selections: {
              capabilities: {
                designs: true,
                plans: true,
                prd: true,
                work: true,
              },
              harnesses: {
                "claude-code": true,
                codex: true,
              },
              skills: true,
              skillScope: "project",
              optionalSkills: ["decompose-codebase"],
            },
            effectiveCapabilities: ["designs", "plans", "prd", "work"],
            files: {},
            skillFiles: [],
          },
          null,
          2,
        )}\n`,
        "utf8",
      );

      expect(() => loadManifest(targetDir)).toThrow(
        /selections\.optionalSkills is no longer supported/,
      );
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("migrates schema 1 manifests without system asset provenance", () => {
    const targetDir = createTempDir();
    try {
      const manifestPath = path.join(targetDir, ".make-docs/manifest.json");
      mkdirSync(path.dirname(manifestPath), { recursive: true });

      writeFileSync(
        manifestPath,
        `${JSON.stringify(
          {
            schemaVersion: 1,
            packageName: "make-docs",
            packageVersion: "0.1.0",
            updatedAt: new Date().toISOString(),
            profileId: "legacy-no-provenance",
            selections: defaultSelections(),
            effectiveCapabilities: ["designs", "plans", "prd", "work"],
            files: {
              "AGENTS.md": {
                hash: hashText("legacy"),
                sourceId: "file:AGENTS.md",
              },
            },
            skillFiles: [],
          },
          null,
          2,
        )}\n`,
        "utf8",
      );

      const manifest = loadManifest(targetDir)!;

      expect(manifest.schemaVersion).toBe(2);
      expect(manifest.files["AGENTS.md"]).toEqual({
        hash: hashText("legacy"),
        sourceId: "file:AGENTS.md",
      });
      expect(manifest.systemAssetMaterialization).toMatchObject({
        mode: "full-snapshot",
        localBootstrapPaths: [],
        deferredSystemAssetPaths: [],
        materializationClasses: {},
        assets: {},
      });
      expect(manifest.systemAssetMaterialization.recoveryGuidance).toContain(
        "refresh local system asset provenance",
      );
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("rejects manifests missing required current fields", () => {
    const targetDir = createTempDir();
    try {
      const manifestPath = path.join(targetDir, ".make-docs/manifest.json");
      mkdirSync(path.dirname(manifestPath), { recursive: true });

      writeFileSync(
        manifestPath,
        `${JSON.stringify(
          {
            schemaVersion: 1,
            packageName: "make-docs",
            packageVersion: "0.1.0",
            updatedAt: new Date().toISOString(),
            profileId: "missing-skill-files",
            selections: defaultSelections(),
            effectiveCapabilities: ["designs", "plans", "prd", "work"],
            files: {},
          },
          null,
          2,
        )}\n`,
        "utf8",
      );

      expect(() => loadManifest(targetDir)).toThrow(/manifest\.skillFiles is required/);
      expect(() => loadManifest(targetDir)).toThrow(
        /Fix or remove the stale manifest and rerun bare `make-docs`/,
      );
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("migrates legacy instructionKinds manifests to harness selections", () => {
    const targetDir = createTempDir();
    try {
      const manifestPath = path.join(targetDir, ".make-docs/manifest.json");
      mkdirSync(path.dirname(manifestPath), { recursive: true });

      writeFileSync(
        manifestPath,
        `${JSON.stringify(
          {
            schemaVersion: 1,
            packageName: "make-docs",
            packageVersion: "0.1.0",
            updatedAt: new Date().toISOString(),
            profileId: "legacy-profile",
            selections: {
              capabilities: {
                designs: true,
                plans: true,
                prd: true,
                work: true,
              },
              instructionKinds: {
                "CLAUDE.md": true,
                "AGENTS.md": false,
              },
              skills: true,
              skillScope: "project",
              selectedSkills: [
                "archive-docs",
                "closeout-commit",
                "closeout-phase",
                "decompose-codebase",
              ],
            },
            effectiveCapabilities: ["designs", "plans", "prd", "work"],
            files: {},
            skillFiles: [],
          },
          null,
          2,
        )}\n`,
        "utf8",
      );

      const manifest = loadManifest(targetDir);
      const expectedSelections = defaultSelections();
      expectedSelections.harnesses["claude-code"] = true;
      expectedSelections.harnesses.codex = false;
      expectedSelections.skills = true;
      expectedSelections.selectedSkills = [
        "archive-docs",
        "closeout-commit",
        "closeout-phase",
        "decompose-codebase",
      ];

      expect(manifest?.selections).toEqual(expectedSelections);
      expect(resolveInstallProfile(manifest!.selections).profileId).toBe(
        resolveInstallProfile(expectedSelections).profileId,
      );
      expect("instructionKinds" in (manifest?.selections ?? {})).toBe(false);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("installs selected skill assets when selected", async () => {
    const targetDir = createTempDir();
    try {
      const { manifest } = await installWithSelections(targetDir, (selections) => {
        selections.skills = true;
        selections.selectedSkills = ["decompose-codebase"];
      });

      const sharedSkillRoot = path.join(
        targetDir,
        ".make-docs/agentics/skills/decompose-codebase",
      );
      expect(existsSync(path.join(sharedSkillRoot, "SKILL.md"))).toBe(true);
      expect(existsSync(path.join(sharedSkillRoot, "references/mcp-playbook.md"))).toBe(true);
      expect(existsSync(path.join(sharedSkillRoot, "scripts/validate_output.py"))).toBe(true);
      expect(
        existsSync(path.join(sharedSkillRoot, "assets/templates/decomposition-plan.md")),
      ).toBe(true);
      expect(
        existsSync(path.join(sharedSkillRoot, "assets/templates/rebuild-backlog-index.md")),
      ).toBe(true);
      expect(
        existsSync(path.join(sharedSkillRoot, "assets/templates/rebuild-backlog-phase.md")),
      ).toBe(true);
      expect(
        existsSync(path.join(sharedSkillRoot, "assets/templates/rebuild-backlog.md")),
      ).toBe(false);
      expect(existsSync(path.join(sharedSkillRoot, "assets/README.md"))).toBe(false);
      expect(existsSync(path.join(sharedSkillRoot, "scripts/test_validate_output.py"))).toBe(
        false,
      );
      const expectedSkillContent = readFileSync(
        path.join(sharedSkillRoot, "SKILL.md"),
        "utf8",
      );

      for (const harnessRoot of [".claude", ".agents"]) {
        expectNativeSkillExposure({
          targetDir,
          exposurePath: path.join(harnessRoot, "skills/decompose-codebase"),
          canonicalPath: ".make-docs/agentics/skills/decompose-codebase",
          expectedContent: expectedSkillContent,
        });
      }

      expect(
        manifest.skillFiles.some((file) =>
          file.endsWith("decompose-codebase/assets/templates/rebuild-backlog.md"),
        ),
      ).toBe(false);
      expect(
        manifest.skillFiles.some((file) => file.endsWith("decompose-codebase/assets/README.md")),
      ).toBe(false);
      expect(
        manifest.skillFiles.some((file) =>
          file.endsWith("decompose-codebase/scripts/test_validate_output.py"),
        ),
      ).toBe(false);
      expect(manifest.skillFiles).toContain(
        ".make-docs/agentics/skills/decompose-codebase/SKILL.md",
      );
      expect(manifest.skillFiles).toContain(".claude/skills/decompose-codebase");
      expect(manifest.skillFiles).toContain(".agents/skills/decompose-codebase");
      expect(manifest.files[".claude/skills/decompose-codebase"]?.skillExposure).toMatchObject({
        canonicalPayloadPath: ".make-docs/agentics/skills/decompose-codebase",
      });
      expect(["symlink", "copy-mirror"]).toContain(
        manifest.files[".claude/skills/decompose-codebase"]?.skillExposure?.mode,
      );
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("uses a managed copy mirror when native skill symlinks are disabled", async () => {
    const targetDir = createTempDir();
    try {
      vi.stubEnv("MAKE_DOCS_DISABLE_SKILL_SYMLINKS", "1");

      const { manifest } = await installWithSelections(targetDir, (selections) => {
        selections.skills = true;
        selections.selectedSkills = ["archive-docs"];
      });
      const expectedSkillContent = readSkillSourceFile("archive-docs", "SKILL.md");

      for (const exposurePath of [
        ".claude/skills/archive-docs",
        ".agents/skills/archive-docs",
      ]) {
        const absoluteExposurePath = path.join(targetDir, exposurePath);
        const stats = lstatSync(absoluteExposurePath);
        expect(stats.isDirectory()).toBe(true);
        expect(stats.isSymbolicLink()).toBe(false);
        expect(readFileSync(path.join(absoluteExposurePath, "SKILL.md"), "utf8")).toBe(
          expectedSkillContent,
        );
        expect(
          existsSync(path.join(absoluteExposurePath, "references/archive-workflow.md")),
        ).toBe(true);
        expect(manifest.files[exposurePath]?.skillExposure).toMatchObject({
          canonicalPayloadPath: ".make-docs/agentics/skills/archive-docs",
          fallbackReason: "Symlink creation disabled by MAKE_DOCS_DISABLE_SKILL_SYMLINKS=1.",
          mode: "copy-mirror",
        });
      }
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("skips skill installation when skills are disabled", async () => {
    const targetDir = createTempDir();
    try {
      const { manifest } = await installWithSelections(targetDir, (selections) => {
        selections.skills = false;
      });

      expect(existsSync(path.join(targetDir, ".claude/skills"))).toBe(false);
      expect(existsSync(path.join(targetDir, ".agents/skills"))).toBe(false);
      expect(existsSync(path.join(targetDir, "CLAUDE.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "AGENTS.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/CLAUDE.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/AGENTS.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/work/AGENTS.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/work/CLAUDE.md"))).toBe(true);
      expect(manifest.skillFiles).toEqual([]);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("installs only Claude Code harness instructions when Codex is disabled", async () => {
    const targetDir = createTempDir();
    try {
      await installWithSelections(targetDir, (selections) => {
        selections.harnesses.codex = false;
      });

      for (const relativePath of getInstructionPaths("CLAUDE.md")) {
        expect(existsSync(path.join(targetDir, relativePath))).toBe(true);
      }

      for (const relativePath of getInstructionPaths("AGENTS.md")) {
        expect(existsSync(path.join(targetDir, relativePath))).toBe(false);
      }

      expect(existsSync(path.join(targetDir, ".claude/skills"))).toBe(false);
      expect(existsSync(path.join(targetDir, ".agents"))).toBe(false);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("installs only Codex harness instructions when Claude Code is disabled", async () => {
    const targetDir = createTempDir();
    try {
      await installWithSelections(targetDir, (selections) => {
        selections.harnesses["claude-code"] = false;
      });

      for (const relativePath of getInstructionPaths("AGENTS.md")) {
        expect(existsSync(path.join(targetDir, relativePath))).toBe(true);
      }

      for (const relativePath of getInstructionPaths("CLAUDE.md")) {
        expect(existsSync(path.join(targetDir, relativePath))).toBe(false);
      }

      expect(existsSync(path.join(targetDir, ".agents/skills"))).toBe(false);
      expect(existsSync(path.join(targetDir, ".claude"))).toBe(false);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("keeps installed skill references valid inside the shared skill payloads", async () => {
    const targetDir = createTempDir();
    try {
      await installWithSelections(targetDir, enableAllSkills);
      const expectedArchiveSkill = readFileSync(
        path.join(targetDir, ".make-docs/agentics/skills/archive-docs/SKILL.md"),
        "utf8",
      );

      for (const harnessRoot of [".claude", ".agents"]) {
        expectNativeSkillExposure({
          targetDir,
          exposurePath: path.join(harnessRoot, "skills/archive-docs"),
          canonicalPath: ".make-docs/agentics/skills/archive-docs",
          expectedContent: expectedArchiveSkill,
        });
        expect(
          existsSync(
            path.join(targetDir, harnessRoot, "skills/archive-docs/references/archive-workflow.md"),
          ),
        ).toBe(true);
      }

      {
        const skillPath = path.join(
          targetDir,
          ".make-docs/agentics/skills/archive-docs/SKILL.md",
        );
        const contents = readFileSync(skillPath, "utf8");

        for (const relativeLink of [
          "./references/archive-workflow.md",
          "./scripts/trace_relationships.py",
          "./agents/openai.yaml",
        ]) {
          expect(contents).toContain(`(${relativeLink})`);
          expect(existsSync(path.join(path.dirname(skillPath), relativeLink))).toBe(true);
        }
      }

      {
        const closeoutSkillPath = path.join(
          targetDir,
          ".make-docs/agentics/skills/closeout-phase/SKILL.md",
        );
        const closeoutContents = readFileSync(closeoutSkillPath, "utf8");

        for (const relativeLink of [
          "./references/closeout-workflow.md",
          "./scripts/persona_schema.py",
          "./scripts/guide_coverage_probe.py",
        ]) {
          expect(closeoutContents).toContain(`(${relativeLink})`);
          expect(existsSync(path.join(path.dirname(closeoutSkillPath), relativeLink))).toBe(true);
        }
        expect(closeoutContents).toContain("make-docs operations work-phase-state");
        expect(closeoutContents).toContain("make-docs operations closeout-probe");
        expect(closeoutContents).toContain("make-docs operations closeout-validate");
        expect(closeoutContents).toContain("make-docs operations closeout-history");
        for (const removedPath of [
          "./scripts/work_phase_state.py",
          "./scripts/closeout_probe.py",
          "./scripts/closeout_validate.py",
          "./scripts/closeout_history.py",
        ]) {
          expect(existsSync(path.join(path.dirname(closeoutSkillPath), removedPath))).toBe(false);
        }
        expect(existsSync(path.join(path.dirname(closeoutSkillPath), "./agents/openai.yaml"))).toBe(
          true,
        );
      }

      {
        const closeoutCommitSkillPath = path.join(
          targetDir,
          ".make-docs/agentics/skills/closeout-commit/SKILL.md",
        );
        const closeoutCommitContents = readFileSync(closeoutCommitSkillPath, "utf8");

        for (const relativeLink of [
          "./references/closeout-commit-workflow.md",
        ]) {
          expect(closeoutCommitContents).toContain(`(${relativeLink})`);
          expect(existsSync(path.join(path.dirname(closeoutCommitSkillPath), relativeLink))).toBe(
            true,
          );
        }
        expect(closeoutCommitContents).toContain("make-docs operations closeout-probe");
        expect(closeoutCommitContents).toContain("make-docs operations closeout-validate");
        expect(closeoutCommitContents).toContain("make-docs operations closeout-history");
        for (const removedPath of [
          "./scripts/closeout_probe.py",
          "./scripts/closeout_validate.py",
          "./scripts/closeout_history.py",
        ]) {
          expect(existsSync(path.join(path.dirname(closeoutCommitSkillPath), removedPath))).toBe(
            false,
          );
        }
        expect(
          existsSync(path.join(path.dirname(closeoutCommitSkillPath), "./agents/openai.yaml")),
        ).toBe(true);
      }

      {
        const workOnWaveSkillPath = path.join(
          targetDir,
          ".make-docs/agentics/skills/work-on-wave/SKILL.md",
        );
        const workOnWaveContents = readFileSync(workOnWaveSkillPath, "utf8");

        for (const relativeLink of [
          "./references/wave-implementation-workflow.md",
        ]) {
          expect(workOnWaveContents).toContain(`(${relativeLink})`);
          expect(existsSync(path.join(path.dirname(workOnWaveSkillPath), relativeLink))).toBe(
            true,
          );
        }
        expect(workOnWaveContents).toContain("make-docs operations wave-resolve");
        expect(workOnWaveContents).toContain("make-docs operations wave-status");
        expect(workOnWaveContents).toContain("make-docs operations phase-plan");
        expect(workOnWaveContents).toContain("make-docs operations checkpoint");
        expect(workOnWaveContents).toContain("make-docs operations scope-guard");
        expect(workOnWaveContents).toContain("make-docs operations phase-gate");
        for (const removedPath of [
          "./scripts/work_on_wave_common.py",
          "./scripts/resolve_wave.py",
          "./scripts/wave_status.py",
          "./scripts/phase_plan.py",
          "./scripts/checkpoint.py",
          "./scripts/scope_guard.py",
          "./scripts/phase_gate.py",
        ]) {
          expect(existsSync(path.join(path.dirname(workOnWaveSkillPath), removedPath))).toBe(
            false,
          );
        }
        expect(
          existsSync(path.join(path.dirname(workOnWaveSkillPath), "./agents/openai.yaml")),
        ).toBe(true);
      }

      {
        const workOnPhaseSkillPath = path.join(
          targetDir,
          ".make-docs/agentics/skills/work-on-phase/SKILL.md",
        );
        const workOnPhaseContents = readFileSync(workOnPhaseSkillPath, "utf8");

        for (const relativeLink of [
          "./references/phase-implementation-workflow.md",
        ]) {
          expect(workOnPhaseContents).toContain(`(${relativeLink})`);
          expect(existsSync(path.join(path.dirname(workOnPhaseSkillPath), relativeLink))).toBe(
            true,
          );
        }
        expect(workOnPhaseContents).toContain("make-docs operations wave-resolve");
        expect(workOnPhaseContents).toContain("make-docs operations phase-plan");
        expect(workOnPhaseContents).toContain("make-docs operations checkpoint");
        expect(workOnPhaseContents).toContain("make-docs operations scope-guard");
        expect(workOnPhaseContents).toContain("make-docs operations phase-gate");
        for (const removedPath of [
          "./scripts/work_on_wave_common.py",
          "./scripts/resolve_wave.py",
          "./scripts/phase_plan.py",
          "./scripts/checkpoint.py",
          "./scripts/scope_guard.py",
          "./scripts/phase_gate.py",
        ]) {
          expect(existsSync(path.join(path.dirname(workOnPhaseSkillPath), removedPath))).toBe(
            false,
          );
        }
        expect(
          existsSync(path.join(path.dirname(workOnPhaseSkillPath), "./agents/openai.yaml")),
        ).toBe(true);
      }
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("installs project-scoped skills under the target directory", async () => {
    const targetDir = createTempDir();
    const fakeHome = createTempDir("make-docs-home-");
    const restoreHome = mockHomeDirectory(fakeHome);
    try {
      await installWithSelections(targetDir, (selections) => {
        enableAllSkills(selections);
        selections.skillScope = "project";
      });

      expect(existsSync(path.join(targetDir, ".claude/skills/archive-docs/SKILL.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, ".agents/skills/archive-docs/SKILL.md"))).toBe(true);
      expect(existsSync(path.join(fakeHome, ".claude/skills/archive-docs/SKILL.md"))).toBe(false);
      expect(existsSync(path.join(fakeHome, ".agents/skills/archive-docs/SKILL.md"))).toBe(false);
    } finally {
      restoreHome();
      cleanupTempDir(targetDir);
      cleanupTempDir(fakeHome);
    }
  });

  test("installs global-scoped skills under the mocked home directory", async () => {
    const targetDir = createTempDir();
    const fakeHome = createTempDir("make-docs-home-");
    const restoreHome = mockHomeDirectory(fakeHome);
    try {
      await installWithSelections(targetDir, (selections) => {
        enableAllSkills(selections);
        selections.skillScope = "global";
      });

      expect(existsSync(path.join(fakeHome, ".claude/skills/archive-docs/SKILL.md"))).toBe(true);
      expect(existsSync(path.join(fakeHome, ".agents/skills/archive-docs/SKILL.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, ".claude/skills/archive-docs/SKILL.md"))).toBe(false);
      expect(existsSync(path.join(targetDir, ".agents/skills/archive-docs/SKILL.md"))).toBe(false);
    } finally {
      restoreHome();
      cleanupTempDir(targetDir);
      cleanupTempDir(fakeHome);
    }
  });

  test("disabling plans automatically disables prd and work", async () => {
    const targetDir = createTempDir();
    try {
      await installWithSelections(targetDir, (selections) => {
        selections.capabilities.plans = false;
      });

      expect(existsSync(path.join(targetDir, "docs/designs/AGENTS.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/plans/AGENTS.md"))).toBe(false);
      expect(existsSync(path.join(targetDir, "docs/prd/AGENTS.md"))).toBe(false);
      expect(existsSync(path.join(targetDir, "docs/work/AGENTS.md"))).toBe(false);
      expect(
        existsSync(path.join(targetDir, ".make-docs/references/system/prompts/request-to-design.prompt.md")),
      ).toBe(true);
      expect(
        existsSync(path.join(targetDir, ".make-docs/references/system/prompts/designs-to-plan.prompt.md")),
      ).toBe(false);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("disabling prd automatically disables work", async () => {
    const targetDir = createTempDir();
    try {
      await installWithSelections(targetDir, (selections) => {
        selections.capabilities.prd = false;
      });

      expect(existsSync(path.join(targetDir, "docs/plans/AGENTS.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, ".make-docs/templates/system/plan-overview.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/prd/AGENTS.md"))).toBe(false);
      expect(existsSync(path.join(targetDir, "docs/work/AGENTS.md"))).toBe(false);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("includes guide files even when all capabilities are disabled", async () => {
    const targetDir = createTempDir();
    try {
      await installWithSelections(targetDir, (selections) => {
        selections.capabilities.designs = false;
        selections.capabilities.plans = false;
        selections.capabilities.prd = false;
        selections.capabilities.work = false;
      });

      expect(existsSync(path.join(targetDir, ".make-docs/contracts/system/guide-contract.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, ".make-docs/references/system/wave-model.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, ".make-docs/contracts/system/history-record-contract.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, ".make-docs/templates/system/guide-developer.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, ".make-docs/templates/system/guide-user.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, ".make-docs/templates/system/history-record.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/assets/library/AGENTS.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/assets/library/CLAUDE.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/assets/playbooks/AGENTS.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/assets/playbooks/CLAUDE.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/assets/archive/AGENTS.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/assets/archive/CLAUDE.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/assets/AGENTS.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/assets/CLAUDE.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/assets/breadcrumbs"))).toBe(false);
      expect(existsSync(path.join(targetDir, "docs/assets/history"))).toBe(false);
      expect(existsSync(path.join(targetDir, "docs/assets/guides"))).toBe(false);
      expect(existsSync(path.join(targetDir, "docs/guides"))).toBe(false);
      expect(existsSync(path.join(targetDir, "docs/library"))).toBe(false);
      expect(existsSync(path.join(targetDir, ".make-docs/references/system/AGENTS.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, ".make-docs/references/system/CLAUDE.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/assets/library/agent"))).toBe(false);
      expect(existsSync(path.join(targetDir, "docs/assets/archive/AGENTS.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/assets/archive/CLAUDE.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, ".make-docs/references/system/prompts/session-to-history-record.prompt.md"))).toBe(true);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("supports a designs-only install without planning routes", async () => {
    const targetDir = createTempDir();
    try {
      await installWithSelections(targetDir, (selections) => {
        selections.capabilities.plans = false;
        selections.capabilities.prd = false;
        selections.capabilities.work = false;
      });

      const workflow = readFileSync(
        path.join(targetDir, ".make-docs/references/system/design-workflow.md"),
        "utf8",
      );
      const docsRouter = readFileSync(path.join(targetDir, "docs/AGENTS.md"), "utf8");

      expect(workflow).toBe(readPackageFile(".make-docs/references/system/design-workflow.md"));
      expect(
        existsSync(path.join(targetDir, ".make-docs/references/system/prompts/designs-to-plan.prompt.md")),
      ).toBe(false);
      expect(docsRouter).toContain("docs/designs/");
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("supports a plans-only install with required prompts", async () => {
    const targetDir = createTempDir();
    try {
      await installWithSelections(targetDir, (selections) => {
        selections.capabilities.designs = false;
        selections.capabilities.prd = false;
        selections.capabilities.work = false;
      });

      expect(existsSync(path.join(targetDir, "docs/plans/AGENTS.md"))).toBe(true);
      expect(
        existsSync(path.join(targetDir, ".make-docs/references/system/prompts/session-to-history-record.prompt.md")),
      ).toBe(true);
      expect(
        existsSync(path.join(targetDir, ".make-docs/references/system/prompts/plan-to-prd-green-field.prompt.md")),
      ).toBe(false);
      expect(
        existsSync(path.join(targetDir, ".make-docs/references/system/prompts/prd-to-work-full-prd.prompt.md")),
      ).toBe(false);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("supports plans and prd without work", async () => {
    const targetDir = createTempDir();
    try {
      await installWithSelections(targetDir, (selections) => {
        selections.capabilities.designs = false;
        selections.capabilities.work = false;
      });

      expect(existsSync(path.join(targetDir, "docs/plans/AGENTS.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/prd/AGENTS.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/work/AGENTS.md"))).toBe(false);
      expect(
        existsSync(path.join(targetDir, ".make-docs/references/system/prompts/plan-to-prd-green-field.prompt.md")),
      ).toBe(true);
      expect(
        existsSync(path.join(targetDir, ".make-docs/references/system/prompts/prd-to-work-full-prd.prompt.md")),
      ).toBe(false);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("inserts router blocks but treats existing non-router diffs as reviewable before apply", async () => {
    const targetDir = createTempDir();
    try {
      mkdirSync(path.join(targetDir, "docs"), { recursive: true });
      writeFileSync(path.join(targetDir, "AGENTS.md"), "custom root agents\n", "utf8");
      writeFileSync(path.join(targetDir, "docs/AGENTS.md"), "custom docs agents\n", "utf8");
      mkdirSync(path.join(targetDir, ".make-docs/contracts/system"), { recursive: true });
      writeFileSync(
        path.join(targetDir, ".make-docs/contracts/system/guide-contract.md"),
        "custom guide contract\n",
        "utf8",
      );

      const existingManifest = loadManifest(targetDir);
      const plan = await planInstall({
        targetDir,
        selections: defaultSelections(),
        existingManifest,
      });
      const rootInstructionAction = getPlannedAction(plan, "AGENTS.md");
      const docsInstructionAction = getPlannedAction(plan, "docs/AGENTS.md");

      expect(rootInstructionAction).toMatchObject({
        type: "update",
        reason: "Insert the make-docs managed block into the existing instruction file.",
      });
      expect(docsInstructionAction).toMatchObject({
        type: "update",
        reason: "Insert the make-docs managed block into the existing instruction file.",
      });
      expect(getPlannedAction(plan, ".make-docs/contracts/system/guide-contract.md")).toMatchObject({
        type: "skip-conflict",
        reason:
          "Existing conflicting reference file was skipped because no overwrite resolution was provided.",
      });
      expect(
        findReviewableManagedFileConflicts(plan).map((conflict) => ({
          path: conflict.relativePath,
          scope: conflict.scope,
        })),
      ).toEqual([{ path: ".make-docs/contracts/system/guide-contract.md", scope: undefined }]);
      expect(() =>
        applyInstallPlan({
          targetDir,
          plan,
          existingManifest,
        }),
      ).toThrow(
        "Cannot apply install plan with unresolved managed-file conflicts: .make-docs/contracts/system/guide-contract.md.",
      );
      expect(readFileSync(path.join(targetDir, "AGENTS.md"), "utf8")).toContain(
        "custom root agents\n",
      );
      expect(readFileSync(path.join(targetDir, "docs/AGENTS.md"), "utf8")).toBe(
        "custom docs agents\n",
      );
      expect(
        readFileSync(path.join(targetDir, ".make-docs/contracts/system/guide-contract.md"), "utf8"),
      ).toBe("custom guide contract\n");

      const files = collectFiles(targetDir);
      const conflictFiles = files.filter((relativePath) =>
        relativePath.startsWith(".make-docs/conflicts/"),
      );

      expect(conflictFiles).toEqual([]);
      expect(existsSync(path.join(targetDir, ".make-docs/manifest.json"))).toBe(false);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("ignores user edits outside instruction managed blocks", async () => {
    const targetDir = createTempDir();
    try {
      const { manifest } = await installWithSelections(targetDir, () => {});
      const rootPath = path.join(targetDir, "AGENTS.md");
      const docsPath = path.join(targetDir, "docs/AGENTS.md");
      const installedContent = readFileSync(rootPath, "utf8");
      const withUserContent = `Project-specific routing.\n\n${installedContent}`;
      writeFileSync(rootPath, withUserContent, "utf8");
      const docsInstalledContent = readFileSync(docsPath, "utf8");
      const docsWithUserContent = `${docsInstalledContent}\nDocs footer.\n`;
      writeFileSync(docsPath, docsWithUserContent, "utf8");

      const plan = await planInstall({
        targetDir,
        selections: defaultSelections(),
        existingManifest: manifest,
      });

      expect(getPlannedAction(plan, "AGENTS.md")).toMatchObject({
        type: "noop",
        contentHash: manifest.files["AGENTS.md"].hash,
      });
      expect(getPlannedAction(plan, "docs/AGENTS.md")).toMatchObject({
        type: "noop",
        contentHash: manifest.files["docs/AGENTS.md"].hash,
      });
      expect(findReviewableManagedFileConflicts(plan)).toEqual([]);

      const result = applyInstallPlan({ targetDir, plan, existingManifest: manifest });
      expect(readFileSync(rootPath, "utf8")).toBe(withUserContent);
      expect(readFileSync(docsPath, "utf8")).toBe(docsWithUserContent);
      expect(result.manifest.files["AGENTS.md"].hash).toBe(manifest.files["AGENTS.md"].hash);
      expect(result.manifest.files["docs/AGENTS.md"].hash).toBe(
        manifest.files["docs/AGENTS.md"].hash,
      );
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("migrates legacy whole-file instruction ownership to the block model", async () => {
    const targetDir = createTempDir();
    try {
      const legacyContent = "# Agent Instructions\n\nLegacy generated routing.\n";
      writeFileSync(path.join(targetDir, "AGENTS.md"), legacyContent, "utf8");
      mkdirSync(path.join(targetDir, "docs"), { recursive: true });
      writeFileSync(path.join(targetDir, "docs/AGENTS.md"), legacyContent, "utf8");
      const selections = defaultSelections();
      const profile = resolveInstallProfile(selections);
      const existingManifest = {
        schemaVersion: 1,
        packageName: "make-docs",
        packageVersion: "0.1.0",
        updatedAt: "2026-06-18T00:00:00.000Z",
        profileId: profile.profileId,
        selections,
        effectiveCapabilities: profile.effectiveCapabilities,
        files: {
          "AGENTS.md": {
            hash: hashText(legacyContent),
            sourceId: "file:AGENTS.md",
          },
          "docs/AGENTS.md": {
            hash: hashText(legacyContent),
            sourceId: "file:docs/AGENTS.md",
          },
        },
        skillFiles: [],
      };

      const plan = await planInstall({
        targetDir,
        selections,
        existingManifest,
      });

      expect(getPlannedAction(plan, "AGENTS.md")).toMatchObject({
        type: "update",
        content: readPackageFile("AGENTS.md"),
        reason: "Migrate legacy instruction file to the managed-block model.",
      });
      expect(getPlannedAction(plan, "docs/AGENTS.md")).toMatchObject({
        type: "update",
        content: readPackageFile("docs/AGENTS.md"),
        reason: "Migrate legacy instruction file to the managed-block model.",
      });

      applyInstallPlan({ targetDir, plan, existingManifest });
      expect(readFileSync(path.join(targetDir, "AGENTS.md"), "utf8")).toBe(
        readPackageFile("AGENTS.md"),
      );
      expect(readFileSync(path.join(targetDir, "docs/AGENTS.md"), "utf8")).toBe(
        readPackageFile("docs/AGENTS.md"),
      );
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("refreshes clean W17 root blocks and removes stale dedicated instruction files", async () => {
    const targetDir = createTempDir();
    try {
      const selections = defaultSelections();
      const profile = resolveInstallProfile(selections);
      writeFileSync(
        path.join(targetDir, "AGENTS.md"),
        `${renderManagedBlock(LEGACY_W17_AGENTS_BODY)}\n`,
        "utf8",
      );
      writeFileSync(
        path.join(targetDir, "CLAUDE.md"),
        `${renderManagedBlock(LEGACY_W17_CLAUDE_BODY)}\n`,
        "utf8",
      );
      mkdirSync(path.join(targetDir, ".make-docs"), { recursive: true });
      writeFileSync(
        path.join(targetDir, ".make-docs/AGENTS.md"),
        LEGACY_W17_DEDICATED_CONTENT,
        "utf8",
      );
      writeFileSync(
        path.join(targetDir, ".make-docs/CLAUDE.md"),
        LEGACY_W17_DEDICATED_CONTENT,
        "utf8",
      );

      const existingManifest = {
        schemaVersion: 1,
        packageName: "make-docs",
        packageVersion: "0.1.0",
        updatedAt: "2026-06-18T00:00:00.000Z",
        profileId: profile.profileId,
        selections,
        effectiveCapabilities: profile.effectiveCapabilities,
        files: {
          "AGENTS.md": {
            hash: hashText(LEGACY_W17_AGENTS_BODY),
            sourceId: "file:AGENTS.md",
          },
          "CLAUDE.md": {
            hash: hashText(LEGACY_W17_CLAUDE_BODY),
            sourceId: "file:CLAUDE.md",
          },
          ".make-docs/AGENTS.md": {
            hash: hashText(LEGACY_W17_DEDICATED_CONTENT),
            sourceId: "file:.make-docs/AGENTS.md",
          },
          ".make-docs/CLAUDE.md": {
            hash: hashText(LEGACY_W17_DEDICATED_CONTENT),
            sourceId: "file:.make-docs/CLAUDE.md",
          },
        },
        skillFiles: [],
      };

      const plan = await planInstall({
        targetDir,
        selections,
        existingManifest,
      });

      expect(getPlannedAction(plan, "AGENTS.md")).toMatchObject({
        type: "update",
        content: readPackageFile("AGENTS.md"),
        reason: "Refresh the manifest-owned instruction block to the current routing.",
      });
      expect(getPlannedAction(plan, "CLAUDE.md")).toMatchObject({
        type: "update",
        content: readPackageFile("CLAUDE.md"),
        reason: "Refresh the manifest-owned instruction block to the current routing.",
      });
      expect(getPlannedAction(plan, ".make-docs/AGENTS.md")).toMatchObject({
        type: "update",
        content: readPackageFile(".make-docs/AGENTS.md"),
        reason: "Migrate legacy instruction file to the managed-block model.",
      });
      expect(getPlannedAction(plan, ".make-docs/CLAUDE.md")).toMatchObject({
        type: "update",
        content: readPackageFile(".make-docs/CLAUDE.md"),
        reason: "Migrate legacy instruction file to the managed-block model.",
      });

      const result = applyInstallPlan({ targetDir, plan, existingManifest });
      expect(readFileSync(path.join(targetDir, "AGENTS.md"), "utf8")).toBe(
        readPackageFile("AGENTS.md"),
      );
      expect(readFileSync(path.join(targetDir, "CLAUDE.md"), "utf8")).toBe(
        readPackageFile("CLAUDE.md"),
      );
      expect(readFileSync(path.join(targetDir, ".make-docs/AGENTS.md"), "utf8")).toBe(
        readPackageFile(".make-docs/AGENTS.md"),
      );
      expect(readFileSync(path.join(targetDir, ".make-docs/CLAUDE.md"), "utf8")).toBe(
        readPackageFile(".make-docs/CLAUDE.md"),
      );
      expect(result.manifest.files[".make-docs/AGENTS.md"]?.sourceId).toBe(
        "file:.make-docs/AGENTS.md",
      );
      expect(result.manifest.files[".make-docs/CLAUDE.md"]?.sourceId).toBe(
        "file:.make-docs/CLAUDE.md",
      );
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("surfaces instruction block edits as block-scoped review", async () => {
    const targetDir = createTempDir();
    try {
      const { manifest } = await installWithSelections(targetDir, () => {});
      const rootPath = path.join(targetDir, "AGENTS.md");
      const installedContent = readFileSync(rootPath, "utf8");
      writeFileSync(
        rootPath,
        installedContent.replace("same-named instruction file", "edited instruction file"),
        "utf8",
      );
      const docsPath = path.join(targetDir, "docs/AGENTS.md");
      const docsInstalledContent = readFileSync(docsPath, "utf8");
      writeFileSync(
        docsPath,
        docsInstalledContent.replace("Use `docs/` only as a router", "Use edited docs routing"),
        "utf8",
      );

      const plan = await planInstall({
        targetDir,
        selections: defaultSelections(),
        existingManifest: manifest,
      });
      const conflicts = findReviewableManagedFileConflicts(plan);

      expect(getPlannedAction(plan, "AGENTS.md")).toMatchObject({
        type: "skip-conflict",
        reason:
          "Existing conflicting make-docs managed block was skipped because no reassert resolution was provided.",
      });
      expect(getPlannedAction(plan, "docs/AGENTS.md")).toMatchObject({
        type: "skip-conflict",
        reason:
          "Existing conflicting make-docs managed block was skipped because no reassert resolution was provided.",
      });
      expect(conflicts).toEqual([
        expect.objectContaining({
          relativePath: "AGENTS.md",
          group: "agent-instructions",
          scope: "managed-block",
          instructionKind: "AGENTS.md",
        }),
        expect.objectContaining({
          relativePath: "docs/AGENTS.md",
          group: "agent-instructions",
          scope: "managed-block",
          instructionKind: "AGENTS.md",
        }),
      ]);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("reasserts the root instruction block while preserving outside content", async () => {
    const targetDir = createTempDir();
    try {
      const { manifest } = await installWithSelections(targetDir, () => {});
      const rootPath = path.join(targetDir, "AGENTS.md");
      const installedContent = readFileSync(rootPath, "utf8");
      const withUserContent = `Project-specific routing.\n\n${installedContent}\nLocal footer.\n`;
      writeFileSync(
        rootPath,
        withUserContent.replace("same-named instruction file", "edited instruction file"),
        "utf8",
      );

      const plan = await planInstall({
        targetDir,
        selections: defaultSelections(),
        existingManifest: manifest,
        managedFileConflictResolutions: {
          "AGENTS.md": "overwrite",
        },
      });

      expect(getPlannedAction(plan, "AGENTS.md")).toMatchObject({
        type: "update",
        reason: "Reassert the make-docs managed block inside the existing agent instruction file.",
      });

      applyInstallPlan({ targetDir, plan, existingManifest: manifest });
      const finalContent = readFileSync(rootPath, "utf8");
      const parsed = parseManagedBlock(finalContent);

      expect(finalContent.startsWith("Project-specific routing.\n\n")).toBe(true);
      expect(finalContent.endsWith("\nLocal footer.\n")).toBe(true);
      expect(parsed.body).toBe(parseManagedBlock(readPackageFile("AGENTS.md")).body);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("creates update actions when overwriting reviewable managed-file conflicts", async () => {
    const targetDir = createTempDir();
    try {
      writeFileSync(path.join(targetDir, "AGENTS.md"), "custom root agents\n", "utf8");
      mkdirSync(path.join(targetDir, ".make-docs/contracts/system"), { recursive: true });
      writeFileSync(
        path.join(targetDir, ".make-docs/contracts/system/guide-contract.md"),
        "custom guide contract\n",
        "utf8",
      );
      mkdirSync(path.join(targetDir, ".make-docs/templates/system"), { recursive: true });
      writeFileSync(
        path.join(targetDir, ".make-docs/templates/system/guide-user.md"),
        "custom guide template\n",
        "utf8",
      );

      const selections = defaultSelections();
      const existingManifest = loadManifest(targetDir);
      const initialPlan = await planInstall({
        targetDir,
        selections,
        existingManifest,
      });

      expect(
        findReviewableManagedFileConflicts(initialPlan).map((conflict) => conflict.relativePath),
      ).toEqual([
        ".make-docs/contracts/system/guide-contract.md",
        ".make-docs/templates/system/guide-user.md",
      ]);

      const plan = await planInstall({
        targetDir,
        selections,
        existingManifest,
        managedFileConflictResolutions: {
          "AGENTS.md": "overwrite",
          ".make-docs/contracts/system/guide-contract.md": "overwrite",
          ".make-docs/templates/system/guide-user.md": "overwrite",
        },
      });

      expect(getPlannedAction(plan, "AGENTS.md")).toMatchObject({
        type: "update",
        reason: "Insert the make-docs managed block into the existing instruction file.",
      });
      expect(getPlannedAction(plan, "AGENTS.md").content).toContain("custom root agents\n");
      expect(getPlannedAction(plan, ".make-docs/contracts/system/guide-contract.md")).toMatchObject({
        type: "update",
        content: readPackageFile(".make-docs/contracts/system/guide-contract.md"),
        reason: "Overwrite existing conflicting reference file.",
      });
      expect(getPlannedAction(plan, ".make-docs/templates/system/guide-user.md")).toMatchObject({
        type: "update",
        content: readPackageFile(".make-docs/templates/system/guide-user.md"),
        reason: "Overwrite existing conflicting template file.",
      });

      const result = applyInstallPlan({ targetDir, plan, existingManifest });

      expect(readFileSync(path.join(targetDir, "AGENTS.md"), "utf8")).toContain(
        "custom root agents\n",
      );
      expect(
        readFileSync(path.join(targetDir, ".make-docs/contracts/system/guide-contract.md"), "utf8"),
      ).toBe(readPackageFile(".make-docs/contracts/system/guide-contract.md"));
      expect(
        readFileSync(path.join(targetDir, ".make-docs/templates/system/guide-user.md"), "utf8"),
      ).toBe(readPackageFile(".make-docs/templates/system/guide-user.md"));
      expect(result.manifest.files["AGENTS.md"]).toBeDefined();
      expect(result.manifest.files[".make-docs/contracts/system/guide-contract.md"]).toBeDefined();
      expect(result.manifest.files[".make-docs/templates/system/guide-user.md"]).toBeDefined();
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("keeps explicitly skipped managed-file conflicts as final skip actions", async () => {
    const targetDir = createTempDir();
    try {
      writeFileSync(path.join(targetDir, "AGENTS.md"), "custom root agents\n", "utf8");
      mkdirSync(path.join(targetDir, ".make-docs/contracts/system"), { recursive: true });
      writeFileSync(
        path.join(targetDir, ".make-docs/contracts/system/guide-contract.md"),
        "custom guide contract\n",
        "utf8",
      );
      mkdirSync(path.join(targetDir, ".make-docs/templates/system"), { recursive: true });
      writeFileSync(
        path.join(targetDir, ".make-docs/templates/system/guide-user.md"),
        "custom guide template\n",
        "utf8",
      );

      const selections = defaultSelections();
      const existingManifest = loadManifest(targetDir);
      const plan = await planInstall({
        targetDir,
        selections,
        existingManifest,
        managedFileConflictResolutions: {
          "AGENTS.md": "skip",
          ".make-docs/contracts/system/guide-contract.md": "skip",
          ".make-docs/templates/system/guide-user.md": "skip",
        },
      });

      expect(getPlannedAction(plan, "AGENTS.md")).toMatchObject({
        type: "update",
        reason: "Insert the make-docs managed block into the existing instruction file.",
      });
      expect(getPlannedAction(plan, ".make-docs/contracts/system/guide-contract.md")).toMatchObject({
        type: "skip",
        reason: "Existing conflicting reference file was explicitly skipped.",
      });
      expect(getPlannedAction(plan, ".make-docs/templates/system/guide-user.md")).toMatchObject({
        type: "skip",
        reason: "Existing conflicting template file was explicitly skipped.",
      });

      const result = applyInstallPlan({ targetDir, plan, existingManifest });

      expect(readFileSync(path.join(targetDir, "AGENTS.md"), "utf8")).toContain(
        "custom root agents\n",
      );
      expect(
        readFileSync(path.join(targetDir, ".make-docs/contracts/system/guide-contract.md"), "utf8"),
      ).toBe(
        "custom guide contract\n",
      );
      expect(
        readFileSync(path.join(targetDir, ".make-docs/templates/system/guide-user.md"), "utf8"),
      ).toBe("custom guide template\n");
      expect(result.manifest.files["AGENTS.md"]).toBeDefined();
      expect(result.manifest.files[".make-docs/contracts/system/guide-contract.md"]).toBeUndefined();
      expect(result.manifest.files[".make-docs/templates/system/guide-user.md"]).toBeUndefined();
      expect(result.conflictFiles).toEqual([]);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("orders reviewable managed-file conflicts by group and path", async () => {
    const targetDir = createTempDir();
    try {
      const conflictingPaths = [
        ".make-docs/templates/system/guide-user.md",
        ".make-docs/references/system/wave-model.md",
        "AGENTS.md",
        ".make-docs/templates/system/guide-developer.md",
        "docs/AGENTS.md",
        ".make-docs/contracts/system/guide-contract.md",
      ];
      for (const relativePath of conflictingPaths) {
        const absolutePath = path.join(targetDir, relativePath);
        mkdirSync(path.dirname(absolutePath), { recursive: true });
        writeFileSync(absolutePath, `custom ${relativePath}\n`, "utf8");
      }

      const plan = await planInstall({
        targetDir,
        selections: defaultSelections(),
        existingManifest: loadManifest(targetDir),
      });

      const conflicts = findReviewableManagedFileConflicts(plan);

      expect(conflicts.map((conflict) => conflict.relativePath)).toEqual([
        ".make-docs/contracts/system/guide-contract.md",
        ".make-docs/references/system/wave-model.md",
        ".make-docs/templates/system/guide-developer.md",
        ".make-docs/templates/system/guide-user.md",
      ]);
      expect(conflicts.map((conflict) => conflict.group)).toEqual([
        "references",
        "references",
        "templates",
        "templates",
      ]);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("overwrites conflicting instruction files when overwrite is selected", async () => {
    const targetDir = createTempDir();
    try {
      writeFileSync(path.join(targetDir, "AGENTS.md"), "custom root agents\n", "utf8");

      const selections = defaultSelections();
      const existingManifest = loadManifest(targetDir);
      const plan = await planInstall({
        targetDir,
        selections,
        existingManifest,
        managedFileConflictResolutions: {
          "AGENTS.md": "overwrite",
        },
      });

      expect(plan.actions.find((action) => action.relativePath === "AGENTS.md")).toMatchObject({
        type: "update",
        reason: "Insert the make-docs managed block into the existing instruction file.",
      });

      const result = applyInstallPlan({
        targetDir,
        plan,
        existingManifest,
      });

      expect(readFileSync(path.join(targetDir, "AGENTS.md"), "utf8")).toContain(
        "custom root agents\n",
      );
      expect(result.manifest.files["AGENTS.md"]).toBeDefined();
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("plans a noop update for unchanged managed files", async () => {
    const targetDir = createTempDir();
    try {
      await installWithSelections(targetDir, () => {});

      const existingManifest = loadManifest(targetDir);
      const plan = await planInstall({
        targetDir,
        selections: defaultSelections(),
        existingManifest,
      });

      expect(plan.actions.every((action) => action.type === "noop")).toBe(true);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("preserves planner actions for create update and noop", async () => {
    const targetDir = createTempDir();
    try {
      const selections = defaultSelections();
      const createPlan = await planInstall({
        targetDir,
        selections,
        existingManifest: loadManifest(targetDir),
      });

      expect(
        getPlannedAction(createPlan, ".make-docs/contracts/system/guide-contract.md"),
      ).toMatchObject({
        type: "create",
        content: readPackageFile(".make-docs/contracts/system/guide-contract.md"),
      });
      expect(getPlannedAction(createPlan, "AGENTS.md")).toMatchObject({
        type: "create",
        content: readPackageFile("AGENTS.md"),
      });

      const initialResult = applyInstallPlan({
        targetDir,
        plan: createPlan,
        existingManifest: loadManifest(targetDir),
      });
      expect(initialResult.manifest.skillFiles).toEqual([]);

      const noopPlan = await planInstall({
        targetDir,
        selections,
        existingManifest: loadManifest(targetDir),
      });
      expect(getPlannedAction(noopPlan, ".make-docs/contracts/system/guide-contract.md")).toMatchObject(
        {
          type: "noop",
        },
      );
      expect(getPlannedAction(noopPlan, "AGENTS.md")).toMatchObject({
        type: "noop",
      });

      const managedReferencePath = ".make-docs/contracts/system/guide-contract.md";
      writeFileSync(
        path.join(targetDir, managedReferencePath),
        "previous managed reference\n",
        "utf8",
      );
      const manifest = loadManifest(targetDir)!;
      manifest.files[managedReferencePath] = {
        hash: hashText("previous managed reference\n"),
        sourceId: "package:.make-docs/contracts/system/guide-contract.md",
      };
      writeFileSync(
        path.join(targetDir, ".make-docs/manifest.json"),
        `${JSON.stringify(manifest, null, 2)}\n`,
        "utf8",
      );

      const updatePlan = await planInstall({
        targetDir,
        selections,
        existingManifest: loadManifest(targetDir),
        managedFileConflictResolutions: {
          [managedReferencePath]: "overwrite",
        },
      });
      expect(getPlannedAction(updatePlan, managedReferencePath)).toMatchObject({
        type: "update",
        content: readPackageFile(managedReferencePath),
      });
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("blocks apply for unresolved managed-block router diffs", async () => {
    const targetDir = createTempDir();
    try {
      await installWithSelections(targetDir, () => {});
      writeFileSync(path.join(targetDir, "docs/AGENTS.md"), "locally edited docs router\n", "utf8");

      const existingManifest = loadManifest(targetDir);
      const plan = await planInstall({
        targetDir,
        selections: defaultSelections(),
        existingManifest,
      });

      const action = plan.actions.find((candidate) => candidate.relativePath === "docs/AGENTS.md");
      expect(action?.type).toBe("skip-conflict");
      expect(
        findReviewableManagedFileConflicts(plan).map((conflict) => ({
          path: conflict.relativePath,
          scope: conflict.scope,
        })),
      ).toEqual([{ path: "docs/AGENTS.md", scope: "managed-block" }]);

      expect(() =>
        applyInstallPlan({
          targetDir,
          plan,
          existingManifest,
        }),
      ).toThrow(
        "Cannot apply install plan with unresolved managed-file conflicts: docs/AGENTS.md.",
      );

      expect(readFileSync(path.join(targetDir, "docs/AGENTS.md"), "utf8")).toBe(
        "locally edited docs router\n",
      );

      const files = collectFiles(targetDir);
      expect(
        files.some(
          (relativePath) =>
            relativePath.startsWith(".make-docs/conflicts/") &&
            relativePath.endsWith("/docs/AGENTS.md"),
        ),
      ).toBe(false);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("supports update reconfiguration from full to partial and back", async () => {
    const targetDir = createTempDir();
    try {
      await installWithSelections(targetDir, () => {});

      await installWithSelections(targetDir, (selections) => {
        selections.capabilities.work = false;
      });

      expect(existsSync(path.join(targetDir, "docs/work/AGENTS.md"))).toBe(false);
      expect(existsSync(path.join(targetDir, ".make-docs/references/system/prompts/designs-to-plan.prompt.md"))).toBe(
        true,
      );
      expect(existsSync(path.join(targetDir, ".make-docs/references/system/prompts/prd-to-work-full-prd.prompt.md"))).toBe(
        false,
      );

      await installWithSelections(targetDir, () => {});

      expect(existsSync(path.join(targetDir, "docs/work/AGENTS.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, ".make-docs/references/system/prompts/designs-to-plan.prompt.md"))).toBe(
        true,
      );
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("removes deselected harness skill files on reconfigure", async () => {
    const targetDir = createTempDir();
    try {
      await installWithSelections(targetDir, enableAllSkills);

      const { manifest } = await installWithSelections(targetDir, (selections) => {
        enableAllSkills(selections);
        selections.harnesses.codex = false;
      });

      expect(existsSync(path.join(targetDir, ".claude/skills/archive-docs"))).toBe(true);
      expect(existsSync(path.join(targetDir, ".agents/skills/archive-docs"))).toBe(false);
      expect(
        existsSync(
          path.join(targetDir, ".agents/skills/archive-docs/references/archive-workflow.md"),
        ),
      ).toBe(false);
      expect(manifest.skillFiles.every((file) => !file.startsWith(".agents/"))).toBe(true);
      expect(manifest.skillFiles.some((file) => file.startsWith(".claude/"))).toBe(true);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("migrates managed flat archive-docs files into the directory layout", async () => {
    const targetDir = createTempDir();
    try {
      const oldClaudeSkill = path.join(targetDir, ".claude/skills/archive-docs-archive.md");
      const oldCodexSkill = path.join(targetDir, ".agents/skills/archive-docs-archive.md");
      const oldAsset = path.join(
        targetDir,
        ".claude/skill-assets/archive-docs/references/archive-workflow.md",
      );

      mkdirSync(path.dirname(oldClaudeSkill), { recursive: true });
      mkdirSync(path.dirname(oldCodexSkill), { recursive: true });
      mkdirSync(path.dirname(oldAsset), { recursive: true });

      writeFileSync(oldClaudeSkill, "legacy archive skill\n", "utf8");
      writeFileSync(oldCodexSkill, "legacy archive skill\n", "utf8");
      writeFileSync(oldAsset, "legacy workflow\n", "utf8");

      const manifestPath = path.join(targetDir, ".make-docs/manifest.json");
      mkdirSync(path.dirname(manifestPath), { recursive: true });
      writeFileSync(
        manifestPath,
        `${JSON.stringify(
          {
            schemaVersion: 1,
            packageName: "make-docs",
            packageVersion: "0.1.0",
            updatedAt: new Date().toISOString(),
            profileId: "legacy-profile",
            selections: {
              ...defaultSelections(),
              skills: true,
              selectedSkills: [
                "archive-docs",
                "closeout-commit",
                "closeout-phase",
                "decompose-codebase",
              ],
            },
            effectiveCapabilities: ["designs", "plans", "prd", "work"],
            files: {
              ".claude/skill-assets/archive-docs/references/archive-workflow.md": {
                hash: hashText("legacy workflow\n"),
                sourceId: "skill-asset:claude-code:archive-docs:references/archive-workflow.md",
              },
            },
            skillFiles: [
              ".claude/skills/archive-docs-archive.md",
              ".agents/skills/archive-docs-archive.md",
            ],
          },
          null,
          2,
        )}\n`,
        "utf8",
      );

      await installWithSelections(targetDir, enableAllSkills);

      expect(existsSync(oldClaudeSkill)).toBe(false);
      expect(existsSync(oldCodexSkill)).toBe(false);
      expect(existsSync(oldAsset)).toBe(false);
      expect(existsSync(path.join(targetDir, ".claude/skills/archive-docs"))).toBe(true);
      expect(existsSync(path.join(targetDir, ".agents/skills/archive-docs"))).toBe(true);
      expect(existsSync(path.join(targetDir, ".claude/skill-assets"))).toBe(false);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("migrates clean manifest-owned duplicated skill payloads into shared payloads and native exposure", async () => {
    const targetDir = createTempDir();
    try {
      const oldSkill = ".claude/skills/archive-docs/SKILL.md";
      const oldSupportFile = ".claude/skills/archive-docs/references/archive-workflow.md";
      const oldSkillContent = readSkillSourceFile("archive-docs", "SKILL.md");
      const oldSupportContent = readSkillSourceFile(
        "archive-docs",
        "references/archive-workflow.md",
      );

      mkdirSync(path.dirname(path.join(targetDir, oldSupportFile)), { recursive: true });
      writeFileSync(path.join(targetDir, oldSkill), oldSkillContent, "utf8");
      writeFileSync(path.join(targetDir, oldSupportFile), oldSupportContent, "utf8");

      const selections = defaultSelections();
      selections.skills = true;
      selections.selectedSkills = ["archive-docs"];
      selections.harnesses["claude-code"] = true;
      selections.harnesses.codex = false;

      const manifestPath = path.join(targetDir, ".make-docs/manifest.json");
      mkdirSync(path.dirname(manifestPath), { recursive: true });
      writeFileSync(
        manifestPath,
        `${JSON.stringify(
          {
            schemaVersion: 2,
            packageName: "@brucewaynedecoy/make-docs",
            packageVersion: "1.0.0-rc.1",
            updatedAt: new Date().toISOString(),
            profileId: "legacy-skills",
            selections,
            effectiveCapabilities: ["designs", "plans", "prd", "work"],
            systemAssetMaterialization: {
              mode: "full-snapshot",
              localBootstrapPaths: [],
              deferredSystemAssetPaths: [],
              materializationClasses: {},
              recoveryGuidance: "legacy fixture",
              assets: {},
            },
            files: {
              [oldSkill]: {
                hash: hashText(oldSkillContent),
                sourceId: "skill:claude-code:archive-docs",
              },
              [oldSupportFile]: {
                hash: hashText(oldSupportContent),
                sourceId:
                  "skill-asset:claude-code:archive-docs:references/archive-workflow.md",
              },
            },
            skillFiles: [oldSkill, oldSupportFile],
          },
          null,
          2,
        )}\n`,
        "utf8",
      );

      const existingManifest = loadManifest(targetDir);
      const plan = await planInstall({
        targetDir,
        selections,
        existingManifest,
      });
      const result = applyInstallPlan({
        targetDir,
        plan,
        existingManifest,
      });

      expect(getPlannedAction(plan, ".claude/skills/archive-docs")).toMatchObject({
        type: "update",
        agenticRole: "native-exposure",
      });
      expect(getPlannedAction(plan, oldSkill)).toMatchObject({
        type: "remove-managed",
        agenticRole: "legacy-duplicated-payload",
      });
      expect(getPlannedAction(plan, oldSupportFile)).toMatchObject({
        type: "remove-managed",
        agenticRole: "legacy-duplicated-payload",
      });
      expect(
        getPlannedAction(plan, ".make-docs/agentics/skills/archive-docs/SKILL.md"),
      ).toMatchObject({
        type: "create",
        agenticRole: "shared-payload",
      });
      expect(existsSync(path.join(targetDir, oldSkill))).toBe(true);
      expect(readFileSync(path.join(targetDir, oldSkill), "utf8")).toBe(oldSkillContent);
      expect(readFileSync(path.join(targetDir, oldSupportFile), "utf8")).toBe(
        oldSupportContent,
      );
      expect(
        existsSync(path.join(targetDir, ".make-docs/agentics/skills/archive-docs/SKILL.md")),
      ).toBe(true);
      expect(result.manifest.skillFiles).toContain(".claude/skills/archive-docs");
      expect(result.manifest.skillFiles).not.toContain(oldSkill);
      expect(result.manifest.skillFiles).not.toContain(oldSupportFile);
      expect(result.manifest.skillFiles).toContain(
        ".make-docs/agentics/skills/archive-docs/SKILL.md",
      );
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("migrates clean manifest-owned generated skill stubs into native exposure", async () => {
    const targetDir = createTempDir();
    try {
      const legacyStub = ".claude/skills/archive-docs/SKILL.md";
      const legacyStubContent = [
        "---",
        "name: archive-docs",
        "description: Generated Claude Code entrypoint for the shared Archive docs make-docs skill payload.",
        "---",
        "",
        "# Archive docs",
        "",
        "This file is a generated make-docs harness stub.",
        "",
        "Canonical payload: `.make-docs/agentics/skills/archive-docs/SKILL.md`",
        "",
      ].join("\n");
      const expectedSkillContent = readSkillSourceFile("archive-docs", "SKILL.md");

      mkdirSync(path.dirname(path.join(targetDir, legacyStub)), { recursive: true });
      writeFileSync(path.join(targetDir, legacyStub), legacyStubContent, "utf8");

      const selections = defaultSelections();
      selections.skills = true;
      selections.selectedSkills = ["archive-docs"];
      selections.harnesses["claude-code"] = true;
      selections.harnesses.codex = false;

      const manifestPath = path.join(targetDir, ".make-docs/manifest.json");
      mkdirSync(path.dirname(manifestPath), { recursive: true });
      writeFileSync(
        manifestPath,
        `${JSON.stringify(
          {
            schemaVersion: 2,
            packageName: "@brucewaynedecoy/make-docs",
            packageVersion: "1.0.0-rc.1",
            updatedAt: new Date().toISOString(),
            profileId: "legacy-stubs",
            selections,
            effectiveCapabilities: ["designs", "plans", "prd", "work"],
            systemAssetMaterialization: {
              mode: "full-snapshot",
              localBootstrapPaths: [],
              deferredSystemAssetPaths: [],
              materializationClasses: {},
              recoveryGuidance: "legacy fixture",
              assets: {},
            },
            files: {
              [legacyStub]: {
                hash: hashText(legacyStubContent),
                sourceId: "skill-stub:claude-code:archive-docs",
              },
            },
            skillFiles: [legacyStub],
          },
          null,
          2,
        )}\n`,
        "utf8",
      );

      const existingManifest = loadManifest(targetDir);
      const plan = await planInstall({
        targetDir,
        selections,
        existingManifest,
      });
      const result = applyInstallPlan({
        targetDir,
        plan,
        existingManifest,
      });

      expect(getPlannedAction(plan, ".claude/skills/archive-docs")).toMatchObject({
        type: "update",
        agenticRole: "native-exposure",
      });
      expect(getPlannedAction(plan, legacyStub)).toMatchObject({
        type: "remove-managed",
        agenticRole: "generated-stub",
      });
      expectNativeSkillExposure({
        targetDir,
        exposurePath: ".claude/skills/archive-docs",
        canonicalPath: ".make-docs/agentics/skills/archive-docs",
        expectedContent: expectedSkillContent,
      });
      expect(readFileSync(path.join(targetDir, legacyStub), "utf8")).toBe(
        expectedSkillContent,
      );
      expect(result.manifest.skillFiles).toContain(".claude/skills/archive-docs");
      expect(result.manifest.skillFiles).not.toContain(legacyStub);
      expect(result.manifest.files[legacyStub]).toBeUndefined();
      expect(result.manifest.files[".claude/skills/archive-docs"]?.skillExposure).toMatchObject({
        canonicalPayloadPath: ".make-docs/agentics/skills/archive-docs",
        harness: "claude-code",
      });
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("preserves modified manifest-owned generated skill stubs for review", async () => {
    const targetDir = createTempDir();
    try {
      const legacyStub = ".claude/skills/archive-docs/SKILL.md";
      const legacyStubContent = [
        "---",
        "name: archive-docs",
        "description: Generated Claude Code entrypoint for the shared Archive docs make-docs skill payload.",
        "---",
        "",
        "# Archive docs",
        "",
      ].join("\n");
      const modifiedStubContent = `${legacyStubContent}\nUser note: keep this local routing.\n`;

      mkdirSync(path.dirname(path.join(targetDir, legacyStub)), { recursive: true });
      writeFileSync(path.join(targetDir, legacyStub), modifiedStubContent, "utf8");

      const selections = defaultSelections();
      selections.skills = true;
      selections.selectedSkills = ["archive-docs"];
      selections.harnesses["claude-code"] = true;
      selections.harnesses.codex = false;

      const manifestPath = path.join(targetDir, ".make-docs/manifest.json");
      mkdirSync(path.dirname(manifestPath), { recursive: true });
      writeFileSync(
        manifestPath,
        `${JSON.stringify(
          {
            schemaVersion: 2,
            packageName: "@brucewaynedecoy/make-docs",
            packageVersion: "1.0.0-rc.1",
            updatedAt: new Date().toISOString(),
            profileId: "legacy-stubs",
            selections,
            effectiveCapabilities: ["designs", "plans", "prd", "work"],
            systemAssetMaterialization: {
              mode: "full-snapshot",
              localBootstrapPaths: [],
              deferredSystemAssetPaths: [],
              materializationClasses: {},
              recoveryGuidance: "legacy fixture",
              assets: {},
            },
            files: {
              [legacyStub]: {
                hash: hashText(legacyStubContent),
                sourceId: "skill-stub:claude-code:archive-docs",
              },
            },
            skillFiles: [legacyStub],
          },
          null,
          2,
        )}\n`,
        "utf8",
      );

      const existingManifest = loadManifest(targetDir);
      const plan = await planInstall({
        targetDir,
        selections,
        existingManifest,
      });

      expect(getPlannedAction(plan, ".claude/skills/archive-docs")).toMatchObject({
        type: "skip-conflict",
        agenticRole: "native-exposure",
      });
      expect(getPlannedAction(plan, legacyStub)).toMatchObject({
        type: "skip-conflict",
        agenticRole: "generated-stub",
      });
      expect(readFileSync(path.join(targetDir, legacyStub), "utf8")).toBe(
        modifiedStubContent,
      );
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("syncs skills without installing docs scaffold on first run", async () => {
    const targetDir = createTempDir();
    try {
      const { manifest } = await syncSkillsOnly(targetDir, enableAllSkills);

      expect(existsSync(path.join(targetDir, ".claude/skills/archive-docs/SKILL.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, ".agents/skills/archive-docs/SKILL.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/AGENTS.md"))).toBe(false);
      expect(existsSync(path.join(targetDir, ".make-docs/templates"))).toBe(false);
      expect(manifest.files).toEqual({});
      expect(manifest.skillFiles).toContain(".claude/skills/archive-docs");
      expect(manifest.skillFiles).toContain(".agents/skills/archive-docs");
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("skills-only sync writes global skill files under the home directory", async () => {
    const targetDir = createTempDir();
    const fakeHome = createTempDir("make-docs-home-");
    const restoreHome = mockHomeDirectory(fakeHome);
    try {
      const { manifest } = await syncSkillsOnly(targetDir, (selections) => {
        enableAllSkills(selections);
        selections.skillScope = "global";
      });

      expect(existsSync(path.join(fakeHome, ".claude/skills/archive-docs/SKILL.md"))).toBe(true);
      expect(existsSync(path.join(fakeHome, ".agents/skills/archive-docs/SKILL.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, ".claude/skills/archive-docs/SKILL.md"))).toBe(false);
      expect(existsSync(path.join(targetDir, ".agents/skills/archive-docs/SKILL.md"))).toBe(false);
      expect(manifest.skillFiles).toContain(
        path.join(fakeHome, ".claude/skills/archive-docs"),
      );
      expect(manifest.skillFiles).toContain(
        path.join(fakeHome, ".agents/skills/archive-docs"),
      );
    } finally {
      restoreHome();
      cleanupTempDir(targetDir);
      cleanupTempDir(fakeHome);
    }
  });

  test("skills-only sync respects disabled harness selections on first run", async () => {
    const targetDir = createTempDir();
    try {
      const { manifest } = await syncSkillsOnly(targetDir, (selections) => {
        enableAllSkills(selections);
        selections.harnesses.codex = false;
      });

      expect(existsSync(path.join(targetDir, ".claude/skills/archive-docs/SKILL.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, ".agents/skills/archive-docs/SKILL.md"))).toBe(false);
      expect(manifest.skillFiles.some((file) => file.startsWith(".claude/"))).toBe(true);
      expect(manifest.skillFiles.every((file) => !file.startsWith(".agents/"))).toBe(true);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("preserves non-skill manifest files during skills-only sync", async () => {
    const targetDir = createTempDir();
    try {
      await installWithSelections(targetDir, () => {});
      const before = loadManifest(targetDir)!;

      const { manifest } = await syncSkillsOnly(targetDir, (selections) => {
        selections.harnesses.codex = false;
      });

      expect(manifest.files["docs/AGENTS.md"]).toEqual(before.files["docs/AGENTS.md"]);
      expect(existsSync(path.join(targetDir, "docs/AGENTS.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, ".agents/skills/archive-docs/SKILL.md"))).toBe(false);
      expect(manifest.skillFiles.every((file) => !file.startsWith(".agents/"))).toBe(true);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("skills-only sync cleans up deselected skill files", async () => {
    const targetDir = createTempDir();
    try {
      await syncSkillsOnly(targetDir, (selections) => {
        selections.selectedSkills = ["decompose-codebase"];
      });

      expect(existsSync(path.join(targetDir, ".claude/skills/decompose-codebase/SKILL.md"))).toBe(
        true,
      );

      const { manifest } = await syncSkillsOnly(targetDir, (selections) => {
        selections.selectedSkills = [];
      });

      expect(existsSync(path.join(targetDir, ".claude/skills/decompose-codebase/SKILL.md"))).toBe(
        false,
      );
      expect(manifest.skillFiles.some((file) => file.includes("decompose-codebase"))).toBe(false);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("skills-only sync reviews retired lifecycle helper scripts", async () => {
    const targetDir = createTempDir();
    try {
      await syncSkillsOnly(targetDir, (selections) => {
        selections.selectedSkills = ["closeout-commit"];
      });

      const removableScript = ".claude/skills/closeout-commit/scripts/closeout_probe.py";
      const modifiedScript = ".claude/skills/closeout-commit/scripts/closeout_validate.py";
      const removableScriptPath = path.join(targetDir, removableScript);
      const modifiedScriptPath = path.join(targetDir, modifiedScript);

      mkdirSync(path.dirname(removableScriptPath), { recursive: true });
      writeFileSync(
        removableScriptPath,
        readSkillSourceFile("closeout-commit", "scripts/closeout_probe.py"),
        "utf8",
      );
      writeFileSync(
        modifiedScriptPath,
        `${readSkillSourceFile("closeout-commit", "scripts/closeout_validate.py")}\n# local edit\n`,
        "utf8",
      );

      const manifest = loadManifest(targetDir)!;
      manifest.skillFiles = Array.from(
        new Set([...manifest.skillFiles, removableScript, modifiedScript]),
      ).sort();
      writeManifestJson(targetDir, manifest);

      const { plan, manifest: nextManifest } = await syncSkillsOnly(targetDir);

      expect(plan.actions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: "remove-managed",
            relativePath: removableScript,
          }),
          expect.objectContaining({
            type: "skip-conflict",
            relativePath: modifiedScript,
          }),
        ]),
      );
      expect(existsSync(removableScriptPath)).toBe(false);
      expect(existsSync(modifiedScriptPath)).toBe(true);
      expect(nextManifest.skillFiles).not.toContain(removableScript);
      expect(nextManifest.skillFiles).toContain(modifiedScript);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("skills-only removal removes tracked skills and leaves unrelated files", async () => {
    const targetDir = createTempDir();
    try {
      await syncSkillsOnly(targetDir, enableAllSkills);
      const untracked = path.join(targetDir, ".claude/skills/local-note.md");
      mkdirSync(path.dirname(untracked), { recursive: true });
      writeFileSync(untracked, "local note\n", "utf8");

      const { manifest } = await syncSkillsOnly(targetDir, undefined, true);

      expect(existsSync(path.join(targetDir, ".claude/skills/archive-docs/SKILL.md"))).toBe(false);
      expect(existsSync(path.join(targetDir, ".agents/skills/archive-docs/SKILL.md"))).toBe(false);
      expect(existsSync(untracked)).toBe(true);
      expect(manifest.files).toEqual({});
      expect(manifest.skillFiles).toEqual([]);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("skills-only removal preserves modified managed skill files", async () => {
    const targetDir = createTempDir();
    try {
      await syncSkillsOnly(targetDir, enableAllSkills);
      const skillPath = path.join(targetDir, ".claude/skills/archive-docs/SKILL.md");
      writeFileSync(skillPath, "local skill edits\n", "utf8");

      const { manifest } = await syncSkillsOnly(targetDir, undefined, true);

      expect(existsSync(skillPath)).toBe(true);
      expect(readFileSync(skillPath, "utf8")).toBe("local skill edits\n");
      expect(manifest.skillFiles).toContain(".claude/skills/archive-docs");
    } finally {
      cleanupTempDir(targetDir);
    }
  });
});
