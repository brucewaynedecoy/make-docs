import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
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
import { loadManifest } from "../src/manifest";
import { defaultSelections, resolveInstallProfile } from "../src/profile";
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
  "docs/assets/history",
  "docs/guides",
  "docs/designs",
  "docs/plans",
  "docs/prd",
  "docs/work",
  "docs/assets/references",
  "docs/assets/templates",
  "docs/assets/prompts",
] as const;

function getInstructionPaths(instructionKind: "AGENTS.md" | "CLAUDE.md"): string[] {
  return FULL_PROFILE_INSTRUCTION_DIRS.map((relativeDir) =>
    relativeDir === "." ? instructionKind : path.join(relativeDir, instructionKind),
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

describe("installer integration", () => {
  beforeEach(() => {
    mockSkillFetches();
  });

  afterEach(() => {
    vi.restoreAllMocks();
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
      const { manifest } = await installWithSelections(targetDir, () => {});

      expect(manifest.effectiveCapabilities).toEqual(["designs", "plans", "prd", "work"]);
      expect(existsSync(path.join(targetDir, ".claude/skills/archive-docs/SKILL.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, ".agents/skills/archive-docs/SKILL.md"))).toBe(true);
      expect(
        existsSync(path.join(targetDir, ".claude/skills/archive-docs/agents/openai.yaml")),
      ).toBe(true);
      expect(
        existsSync(path.join(targetDir, ".agents/skills/archive-docs/agents/openai.yaml")),
      ).toBe(true);
      expect(
        existsSync(
          path.join(targetDir, ".claude/skills/archive-docs/references/archive-workflow.md"),
        ),
      ).toBe(true);
      expect(
        existsSync(
          path.join(targetDir, ".agents/skills/archive-docs/references/archive-workflow.md"),
        ),
      ).toBe(true);
      expect(
        existsSync(
          path.join(targetDir, ".claude/skills/archive-docs/scripts/trace_relationships.py"),
        ),
      ).toBe(true);
      expect(
        existsSync(
          path.join(targetDir, ".agents/skills/archive-docs/scripts/trace_relationships.py"),
        ),
      ).toBe(true);
      expect(existsSync(path.join(targetDir, ".claude/skill-assets"))).toBe(false);
      expect(existsSync(path.join(targetDir, ".agents/skill-assets"))).toBe(false);
      expect(
        existsSync(path.join(targetDir, ".claude/skills/decompose-codebase/SKILL.md")),
      ).toBe(true);
      expect(existsSync(path.join(targetDir, ".claude/skills/work-on-wave/SKILL.md"))).toBe(
        true,
      );
      expect(existsSync(path.join(targetDir, ".agents/skills/work-on-wave/SKILL.md"))).toBe(
        true,
      );
      expect(existsSync(path.join(targetDir, ".claude/skills/closeout-commit/SKILL.md"))).toBe(
        true,
      );
      expect(existsSync(path.join(targetDir, ".agents/skills/closeout-commit/SKILL.md"))).toBe(
        true,
      );
      expect(
        existsSync(path.join(targetDir, ".claude/skills/closeout-commit/agents/openai.yaml")),
      ).toBe(true);
      expect(
        existsSync(path.join(targetDir, ".agents/skills/closeout-commit/agents/openai.yaml")),
      ).toBe(true);
      expect(
        existsSync(
          path.join(
            targetDir,
            ".claude/skills/closeout-commit/references/closeout-commit-workflow.md",
          ),
        ),
      ).toBe(true);
      expect(
        existsSync(
          path.join(
            targetDir,
            ".agents/skills/closeout-commit/references/closeout-commit-workflow.md",
          ),
        ),
      ).toBe(true);
      expect(existsSync(path.join(targetDir, ".claude/skills/closeout-phase/SKILL.md"))).toBe(
        true,
      );
      expect(existsSync(path.join(targetDir, ".agents/skills/closeout-phase/SKILL.md"))).toBe(
        true,
      );
      expect(
        existsSync(path.join(targetDir, ".claude/skills/closeout-phase/agents/openai.yaml")),
      ).toBe(true);
      expect(
        existsSync(path.join(targetDir, ".agents/skills/closeout-phase/agents/openai.yaml")),
      ).toBe(true);
      expect(
        existsSync(
          path.join(targetDir, ".claude/skills/closeout-phase/references/closeout-workflow.md"),
        ),
      ).toBe(true);
      expect(
        existsSync(
          path.join(targetDir, ".agents/skills/closeout-phase/references/closeout-workflow.md"),
        ),
      ).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/work/AGENTS.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/assets/prompts/designs-to-plan.prompt.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/assets/prompts/work-to-guides.prompt.md"))).toBe(true);
      expect(
        existsSync(path.join(targetDir, "docs/assets/references/harness-capability-matrix.md")),
      ).toBe(true);

      expect(existsSync(path.join(targetDir, "docs/assets/references/guide-contract.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/assets/templates/guide-developer.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/assets/templates/guide-user.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/guides/AGENTS.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/guides/CLAUDE.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/assets/AGENTS.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/assets/CLAUDE.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/assets/archive/AGENTS.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/assets/archive/CLAUDE.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/assets/history/AGENTS.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/assets/history/CLAUDE.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/assets/references/AGENTS.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/assets/references/CLAUDE.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/guides/agent"))).toBe(false);

      const guidesRouter = readFileSync(path.join(targetDir, "docs/guides/AGENTS.md"), "utf8");
      expect(guidesRouter).toContain("guide-contract.md");
      expect(guidesRouter).toContain("developer`, `user`, `both`, `update-existing`, `link-only`, or `none");
      expect(guidesRouter).toContain("re-check overlapping guides");
      expect(guidesRouter).toContain("## Future Coverage");
      expect(guidesRouter).not.toContain("docs/guides/agent");
      expect(manifest.skillFiles).toContain(".claude/skills/archive-docs/SKILL.md");
      expect(manifest.skillFiles).toContain(".agents/skills/archive-docs/SKILL.md");
      expect(manifest.skillFiles).toContain(".claude/skills/closeout-commit/SKILL.md");
      expect(manifest.skillFiles).toContain(".agents/skills/closeout-commit/SKILL.md");
      expect(manifest.skillFiles).toContain(".claude/skills/closeout-phase/SKILL.md");
      expect(manifest.skillFiles).toContain(".agents/skills/closeout-phase/SKILL.md");
      expect(manifest.skillFiles).toContain(".claude/skills/decompose-codebase/SKILL.md");
      expect(manifest.skillFiles).toContain(".agents/skills/decompose-codebase/SKILL.md");
      expect(manifest.skillFiles).toContain(".claude/skills/work-on-wave/SKILL.md");
      expect(manifest.skillFiles).toContain(".agents/skills/work-on-wave/SKILL.md");
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
        selections.selectedSkills = ["decompose-codebase"];
      });

      for (const harnessRoot of [".claude", ".agents"]) {
        const skillRoot = path.join(targetDir, harnessRoot, "skills/decompose-codebase");

        expect(existsSync(path.join(skillRoot, "SKILL.md"))).toBe(true);
        expect(existsSync(path.join(skillRoot, "references/mcp-playbook.md"))).toBe(true);
        expect(existsSync(path.join(skillRoot, "scripts/validate_output.py"))).toBe(true);
        expect(
          existsSync(path.join(skillRoot, "assets/templates/decomposition-plan.md")),
        ).toBe(true);
        expect(
          existsSync(path.join(skillRoot, "assets/templates/rebuild-backlog-index.md")),
        ).toBe(true);
        expect(
          existsSync(path.join(skillRoot, "assets/templates/rebuild-backlog-phase.md")),
        ).toBe(true);
        expect(existsSync(path.join(skillRoot, "assets/templates/rebuild-backlog.md"))).toBe(
          false,
        );
        expect(existsSync(path.join(skillRoot, "assets/README.md"))).toBe(false);
        expect(existsSync(path.join(skillRoot, "scripts/test_validate_output.py"))).toBe(false);
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

  test("installs only Claude Code harness instructions and skills when Codex is disabled", async () => {
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

      expect(existsSync(path.join(targetDir, ".claude/skills/archive-docs/SKILL.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, ".agents"))).toBe(false);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("installs only Codex harness instructions and skills when Claude Code is disabled", async () => {
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

      expect(existsSync(path.join(targetDir, ".agents/skills/archive-docs/SKILL.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, ".claude"))).toBe(false);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("keeps installed skill references valid inside each harness skill directory", async () => {
    const targetDir = createTempDir();
    try {
      await installWithSelections(targetDir, () => {});

      for (const harnessRoot of [".claude", ".agents"]) {
        const skillPath = path.join(targetDir, harnessRoot, "skills/archive-docs/SKILL.md");
        const contents = readFileSync(skillPath, "utf8");

        for (const relativeLink of [
          "./references/archive-workflow.md",
          "./scripts/trace_relationships.py",
          "./agents/openai.yaml",
        ]) {
          expect(contents).toContain(`(${relativeLink})`);
          expect(existsSync(path.join(path.dirname(skillPath), relativeLink))).toBe(true);
        }

        const closeoutSkillPath = path.join(
          targetDir,
          harnessRoot,
          "skills/closeout-phase/SKILL.md",
        );
        const closeoutContents = readFileSync(closeoutSkillPath, "utf8");

        for (const relativeLink of [
          "./references/closeout-workflow.md",
          "./scripts/work_phase_state.py",
          "./scripts/closeout_probe.py",
          "./scripts/guide_coverage_probe.py",
          "./scripts/closeout_validate.py",
          "./scripts/closeout_history.py",
        ]) {
          expect(closeoutContents).toContain(`(${relativeLink})`);
          expect(existsSync(path.join(path.dirname(closeoutSkillPath), relativeLink))).toBe(true);
        }
        expect(existsSync(path.join(path.dirname(closeoutSkillPath), "./agents/openai.yaml"))).toBe(
          true,
        );

        const closeoutCommitSkillPath = path.join(
          targetDir,
          harnessRoot,
          "skills/closeout-commit/SKILL.md",
        );
        const closeoutCommitContents = readFileSync(closeoutCommitSkillPath, "utf8");

        for (const relativeLink of [
          "./references/closeout-commit-workflow.md",
          "./scripts/closeout_probe.py",
          "./scripts/closeout_validate.py",
          "./scripts/closeout_history.py",
        ]) {
          expect(closeoutCommitContents).toContain(`(${relativeLink})`);
          expect(existsSync(path.join(path.dirname(closeoutCommitSkillPath), relativeLink))).toBe(
            true,
          );
        }
        expect(
          existsSync(path.join(path.dirname(closeoutCommitSkillPath), "./agents/openai.yaml")),
        ).toBe(true);

        const workOnWaveSkillPath = path.join(
          targetDir,
          harnessRoot,
          "skills/work-on-wave/SKILL.md",
        );
        const workOnWaveContents = readFileSync(workOnWaveSkillPath, "utf8");

        for (const relativeLink of [
          "./references/wave-implementation-workflow.md",
          "./scripts/resolve_wave.py",
          "./scripts/wave_status.py",
          "./scripts/phase_plan.py",
          "./scripts/checkpoint.py",
          "./scripts/scope_guard.py",
          "./scripts/phase_gate.py",
        ]) {
          expect(workOnWaveContents).toContain(`(${relativeLink})`);
          expect(existsSync(path.join(path.dirname(workOnWaveSkillPath), relativeLink))).toBe(
            true,
          );
        }
        expect(
          existsSync(
            path.join(path.dirname(workOnWaveSkillPath), "./scripts/work_on_wave_common.py"),
          ),
        ).toBe(true);
        expect(
          existsSync(path.join(path.dirname(workOnWaveSkillPath), "./agents/openai.yaml")),
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
        existsSync(path.join(targetDir, "docs/assets/prompts/request-to-design.prompt.md")),
      ).toBe(true);
      expect(
        existsSync(path.join(targetDir, "docs/assets/prompts/designs-to-plan.prompt.md")),
      ).toBe(false);
      expect(readFileSync(path.join(targetDir, "docs/AGENTS.md"), "utf8")).not.toContain(
        "docs/plans/",
      );
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
      expect(existsSync(path.join(targetDir, "docs/assets/templates/plan-overview.md"))).toBe(true);
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

      expect(existsSync(path.join(targetDir, "docs/assets/references/guide-contract.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/assets/references/wave-model.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/assets/references/history-record-contract.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/assets/templates/guide-developer.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/assets/templates/guide-user.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/assets/templates/history-record.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/guides/AGENTS.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/guides/CLAUDE.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/assets/AGENTS.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/assets/CLAUDE.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/assets/history/AGENTS.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/assets/history/CLAUDE.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/assets/references/AGENTS.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/assets/references/CLAUDE.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/guides/agent"))).toBe(false);
      expect(existsSync(path.join(targetDir, "docs/assets/archive/AGENTS.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/assets/archive/CLAUDE.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/assets/prompts/session-to-history-record.prompt.md"))).toBe(true);
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
        path.join(targetDir, "docs/assets/references/design-workflow.md"),
        "utf8",
      );
      const docsRouter = readFileSync(path.join(targetDir, "docs/AGENTS.md"), "utf8");

      expect(workflow).toContain("planning-not-installed");
      expect(workflow).not.toContain("docs/assets/prompts/");
      expect(docsRouter).toContain("docs/designs/");
      expect(docsRouter).not.toContain("docs/plans/");
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
        existsSync(path.join(targetDir, "docs/assets/prompts/session-to-history-record.prompt.md")),
      ).toBe(true);
      expect(
        existsSync(path.join(targetDir, "docs/assets/prompts/plan-to-prd-green-field.prompt.md")),
      ).toBe(false);
      expect(
        existsSync(path.join(targetDir, "docs/assets/prompts/prd-to-work-full-prd.prompt.md")),
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
        existsSync(path.join(targetDir, "docs/assets/prompts/plan-to-prd-green-field.prompt.md")),
      ).toBe(true);
      expect(
        existsSync(path.join(targetDir, "docs/assets/prompts/prd-to-work-full-prd.prompt.md")),
      ).toBe(false);
      expect(readFileSync(path.join(targetDir, "docs/AGENTS.md"), "utf8")).not.toContain(
        "docs/work/",
      );
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("treats existing selected file diffs as reviewable before apply", async () => {
    const targetDir = createTempDir();
    try {
      mkdirSync(path.join(targetDir, "docs"), { recursive: true });
      writeFileSync(path.join(targetDir, "AGENTS.md"), "custom root agents\n", "utf8");
      writeFileSync(path.join(targetDir, "docs/AGENTS.md"), "custom docs agents\n", "utf8");

      const existingManifest = loadManifest(targetDir);
      const plan = await planInstall({
        targetDir,
        selections: defaultSelections(),
        existingManifest,
      });
      const rootInstructionAction = getPlannedAction(plan, "AGENTS.md");
      const docsInstructionAction = getPlannedAction(plan, "docs/AGENTS.md");

      expect(rootInstructionAction).toMatchObject({
        type: "skip-conflict",
        reason:
          "Existing conflicting agent instruction file was skipped because no overwrite resolution was provided.",
      });
      expect(docsInstructionAction).toMatchObject({
        type: "skip-conflict",
        reason:
          "Existing conflicting agent instruction file was skipped because no overwrite resolution was provided.",
      });
      expect(
        findReviewableManagedFileConflicts(plan).map((conflict) => conflict.relativePath),
      ).toEqual(["AGENTS.md", "docs/AGENTS.md"]);
      expect(() =>
        applyInstallPlan({
          targetDir,
          plan,
          existingManifest,
        }),
      ).toThrow(
        "Cannot apply install plan with unresolved managed-file conflicts: AGENTS.md, docs/AGENTS.md.",
      );
      expect(readFileSync(path.join(targetDir, "AGENTS.md"), "utf8")).toBe("custom root agents\n");
      expect(readFileSync(path.join(targetDir, "docs/AGENTS.md"), "utf8")).toBe(
        "custom docs agents\n",
      );

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

  test("creates update actions when overwriting reviewable managed-file conflicts", async () => {
    const targetDir = createTempDir();
    try {
      writeFileSync(path.join(targetDir, "AGENTS.md"), "custom root agents\n", "utf8");
      mkdirSync(path.join(targetDir, "docs/assets/references"), { recursive: true });
      writeFileSync(
        path.join(targetDir, "docs/assets/references/guide-contract.md"),
        "custom guide contract\n",
        "utf8",
      );
      mkdirSync(path.join(targetDir, "docs/assets/templates"), { recursive: true });
      writeFileSync(
        path.join(targetDir, "docs/assets/templates/guide-user.md"),
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
        "AGENTS.md",
        "docs/assets/references/guide-contract.md",
        "docs/assets/templates/guide-user.md",
      ]);

      const plan = await planInstall({
        targetDir,
        selections,
        existingManifest,
        managedFileConflictResolutions: {
          "AGENTS.md": "overwrite",
          "docs/assets/references/guide-contract.md": "overwrite",
          "docs/assets/templates/guide-user.md": "overwrite",
        },
      });

      expect(getPlannedAction(plan, "AGENTS.md")).toMatchObject({
        type: "update",
        content: readPackageFile("AGENTS.md"),
        reason: "Overwrite existing conflicting agent instruction file.",
      });
      expect(getPlannedAction(plan, "docs/assets/references/guide-contract.md")).toMatchObject({
        type: "update",
        content: readPackageFile("docs/assets/references/guide-contract.md"),
        reason: "Overwrite existing conflicting reference file.",
      });
      expect(getPlannedAction(plan, "docs/assets/templates/guide-user.md")).toMatchObject({
        type: "update",
        content: readPackageFile("docs/assets/templates/guide-user.md"),
        reason: "Overwrite existing conflicting template file.",
      });

      const result = applyInstallPlan({ targetDir, plan, existingManifest });

      expect(readFileSync(path.join(targetDir, "AGENTS.md"), "utf8")).toBe(
        readPackageFile("AGENTS.md"),
      );
      expect(
        readFileSync(path.join(targetDir, "docs/assets/references/guide-contract.md"), "utf8"),
      ).toBe(readPackageFile("docs/assets/references/guide-contract.md"));
      expect(
        readFileSync(path.join(targetDir, "docs/assets/templates/guide-user.md"), "utf8"),
      ).toBe(readPackageFile("docs/assets/templates/guide-user.md"));
      expect(result.manifest.files["AGENTS.md"]).toBeDefined();
      expect(result.manifest.files["docs/assets/references/guide-contract.md"]).toBeDefined();
      expect(result.manifest.files["docs/assets/templates/guide-user.md"]).toBeDefined();
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("keeps explicitly skipped managed-file conflicts as final skip actions", async () => {
    const targetDir = createTempDir();
    try {
      writeFileSync(path.join(targetDir, "AGENTS.md"), "custom root agents\n", "utf8");
      mkdirSync(path.join(targetDir, "docs/assets/references"), { recursive: true });
      writeFileSync(
        path.join(targetDir, "docs/assets/references/guide-contract.md"),
        "custom guide contract\n",
        "utf8",
      );
      mkdirSync(path.join(targetDir, "docs/assets/templates"), { recursive: true });
      writeFileSync(
        path.join(targetDir, "docs/assets/templates/guide-user.md"),
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
          "docs/assets/references/guide-contract.md": "skip",
          "docs/assets/templates/guide-user.md": "skip",
        },
      });

      expect(getPlannedAction(plan, "AGENTS.md")).toMatchObject({
        type: "skip",
        reason: "Existing conflicting agent instruction file was explicitly skipped.",
      });
      expect(getPlannedAction(plan, "docs/assets/references/guide-contract.md")).toMatchObject({
        type: "skip",
        reason: "Existing conflicting reference file was explicitly skipped.",
      });
      expect(getPlannedAction(plan, "docs/assets/templates/guide-user.md")).toMatchObject({
        type: "skip",
        reason: "Existing conflicting template file was explicitly skipped.",
      });

      const result = applyInstallPlan({ targetDir, plan, existingManifest });

      expect(readFileSync(path.join(targetDir, "AGENTS.md"), "utf8")).toBe("custom root agents\n");
      expect(
        readFileSync(path.join(targetDir, "docs/assets/references/guide-contract.md"), "utf8"),
      ).toBe(
        "custom guide contract\n",
      );
      expect(
        readFileSync(path.join(targetDir, "docs/assets/templates/guide-user.md"), "utf8"),
      ).toBe("custom guide template\n");
      expect(result.manifest.files["AGENTS.md"]).toBeUndefined();
      expect(result.manifest.files["docs/assets/references/guide-contract.md"]).toBeUndefined();
      expect(result.manifest.files["docs/assets/templates/guide-user.md"]).toBeUndefined();
      expect(result.conflictFiles).toEqual([]);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("orders reviewable managed-file conflicts by group and path", async () => {
    const targetDir = createTempDir();
    try {
      const conflictingPaths = [
        "docs/assets/templates/guide-user.md",
        "docs/assets/references/wave-model.md",
        "AGENTS.md",
        "docs/assets/templates/guide-developer.md",
        "docs/AGENTS.md",
        "docs/assets/references/guide-contract.md",
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
        "AGENTS.md",
        "docs/AGENTS.md",
        "docs/assets/references/guide-contract.md",
        "docs/assets/references/wave-model.md",
        "docs/assets/templates/guide-developer.md",
        "docs/assets/templates/guide-user.md",
      ]);
      expect(conflicts.map((conflict) => conflict.group)).toEqual([
        "agent-instructions",
        "agent-instructions",
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
        reason: "Overwrite existing conflicting agent instruction file.",
      });

      const result = applyInstallPlan({
        targetDir,
        plan,
        existingManifest,
      });

      expect(readFileSync(path.join(targetDir, "AGENTS.md"), "utf8")).toBe(
        readPackageFile("AGENTS.md"),
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

  test("preserves planner actions for create update generate noop and skills", async () => {
    const targetDir = createTempDir();
    try {
      const selections = defaultSelections();
      const createPlan = await planInstall({
        targetDir,
        selections,
        existingManifest: loadManifest(targetDir),
      });

      expect(
        getPlannedAction(createPlan, "docs/assets/references/guide-contract.md"),
      ).toMatchObject({
        type: "create",
        content: readPackageFile("docs/assets/references/guide-contract.md"),
      });
      expect(getPlannedAction(createPlan, "AGENTS.md")).toMatchObject({
        type: "generate",
        content: readPackageFile("AGENTS.md"),
      });
      expect(getPlannedAction(createPlan, ".claude/skills/archive-docs/SKILL.md")).toMatchObject({
        type: "create",
      });

      const initialResult = applyInstallPlan({
        targetDir,
        plan: createPlan,
        existingManifest: loadManifest(targetDir),
      });
      expect(initialResult.manifest.skillFiles).toContain(".claude/skills/archive-docs/SKILL.md");

      const noopPlan = await planInstall({
        targetDir,
        selections,
        existingManifest: loadManifest(targetDir),
      });
      expect(getPlannedAction(noopPlan, "docs/assets/references/guide-contract.md")).toMatchObject(
        {
          type: "noop",
        },
      );
      expect(getPlannedAction(noopPlan, "AGENTS.md")).toMatchObject({
        type: "noop",
      });
      expect(getPlannedAction(noopPlan, ".claude/skills/archive-docs/SKILL.md")).toMatchObject({
        type: "noop",
      });

      const managedReferencePath = "docs/assets/references/guide-contract.md";
      writeFileSync(
        path.join(targetDir, managedReferencePath),
        "previous managed reference\n",
        "utf8",
      );
      const manifest = loadManifest(targetDir)!;
      manifest.files[managedReferencePath] = {
        hash: hashText("previous managed reference\n"),
        sourceId: "package:docs/assets/references/guide-contract.md",
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

  test("blocks apply for unresolved reviewable managed-file diffs", async () => {
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
        findReviewableManagedFileConflicts(plan).map((conflict) => conflict.relativePath),
      ).toEqual(["docs/AGENTS.md"]);

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
      expect(existsSync(path.join(targetDir, "docs/assets/prompts/designs-to-plan.prompt.md"))).toBe(
        true,
      );
      expect(existsSync(path.join(targetDir, "docs/assets/prompts/prd-to-work-full-prd.prompt.md"))).toBe(
        false,
      );

      await installWithSelections(targetDir, () => {});

      expect(existsSync(path.join(targetDir, "docs/work/AGENTS.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/assets/prompts/designs-to-plan.prompt.md"))).toBe(
        true,
      );
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("removes deselected harness skill files on reconfigure", async () => {
    const targetDir = createTempDir();
    try {
      await installWithSelections(targetDir, () => {});

      const { manifest } = await installWithSelections(targetDir, (selections) => {
        selections.harnesses.codex = false;
      });

      expect(existsSync(path.join(targetDir, ".claude/skills/archive-docs/SKILL.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, ".agents/skills/archive-docs/SKILL.md"))).toBe(false);
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

      await installWithSelections(targetDir, () => {});

      expect(existsSync(oldClaudeSkill)).toBe(false);
      expect(existsSync(oldCodexSkill)).toBe(false);
      expect(existsSync(oldAsset)).toBe(false);
      expect(existsSync(path.join(targetDir, ".claude/skills/archive-docs/SKILL.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, ".agents/skills/archive-docs/SKILL.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, ".claude/skill-assets"))).toBe(false);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("syncs skills without installing docs scaffold on first run", async () => {
    const targetDir = createTempDir();
    try {
      const { manifest } = await syncSkillsOnly(targetDir);

      expect(existsSync(path.join(targetDir, ".claude/skills/archive-docs/SKILL.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, ".agents/skills/archive-docs/SKILL.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/AGENTS.md"))).toBe(false);
      expect(existsSync(path.join(targetDir, "docs/assets/templates"))).toBe(false);
      expect(manifest.files).toEqual({});
      expect(manifest.skillFiles).toContain(".claude/skills/archive-docs/SKILL.md");
      expect(manifest.skillFiles).toContain(".agents/skills/archive-docs/SKILL.md");
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
        selections.skillScope = "global";
      });

      expect(existsSync(path.join(fakeHome, ".claude/skills/archive-docs/SKILL.md"))).toBe(true);
      expect(existsSync(path.join(fakeHome, ".agents/skills/archive-docs/SKILL.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, ".claude/skills/archive-docs/SKILL.md"))).toBe(false);
      expect(existsSync(path.join(targetDir, ".agents/skills/archive-docs/SKILL.md"))).toBe(false);
      expect(manifest.skillFiles).toContain(
        path.join(fakeHome, ".claude/skills/archive-docs/SKILL.md"),
      );
      expect(manifest.skillFiles).toContain(
        path.join(fakeHome, ".agents/skills/archive-docs/SKILL.md"),
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

  test("skills-only removal removes tracked skills and leaves unrelated files", async () => {
    const targetDir = createTempDir();
    try {
      await syncSkillsOnly(targetDir);
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
      await syncSkillsOnly(targetDir);
      const skillPath = path.join(targetDir, ".claude/skills/archive-docs/SKILL.md");
      writeFileSync(skillPath, "local skill edits\n", "utf8");

      const { manifest } = await syncSkillsOnly(targetDir, undefined, true);

      expect(existsSync(skillPath)).toBe(true);
      expect(readFileSync(skillPath, "utf8")).toBe("local skill edits\n");
      expect(manifest.skillFiles).toContain(".claude/skills/archive-docs/SKILL.md");
    } finally {
      cleanupTempDir(targetDir);
    }
  });
});
