import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  applyInstallPlan,
  applySkillsOnlyInstallPlan,
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
  "docs/.assets",
  "docs/.assets/history",
  "docs/.assets/config",
  "docs/guides",
  "docs/.archive",
  "docs/designs",
  "docs/plans",
  "docs/prd",
  "docs/work",
  "docs/.references",
  "docs/.templates",
  "docs/.prompts",
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
      ).toBe(false);
      expect(existsSync(path.join(targetDir, "docs/work/AGENTS.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/.prompts/designs-to-plan.prompt.md"))).toBe(true);
      expect(
        existsSync(path.join(targetDir, "docs/.references/harness-capability-matrix.md")),
      ).toBe(true);

      expect(existsSync(path.join(targetDir, "docs/.references/guide-contract.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/.templates/guide-developer.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/.templates/guide-user.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/guides/AGENTS.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/guides/CLAUDE.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/.assets/AGENTS.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/.assets/CLAUDE.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/.assets/history/AGENTS.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/.assets/history/CLAUDE.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/.assets/config/AGENTS.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/.assets/config/CLAUDE.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/guides/agent"))).toBe(false);

      const guidesRouter = readFileSync(path.join(targetDir, "docs/guides/AGENTS.md"), "utf8");
      expect(guidesRouter).toContain("guide-contract.md");
      expect(guidesRouter).not.toContain("docs/guides/agent");
      expect(manifest.skillFiles).toContain(".claude/skills/archive-docs/SKILL.md");
      expect(manifest.skillFiles).toContain(".agents/skills/archive-docs/SKILL.md");
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("migrates legacy instructionKinds manifests to harness selections", () => {
    const targetDir = createTempDir();
    try {
      const manifestPath = path.join(targetDir, "docs/.assets/config/manifest.json");
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
              instructionKinds: {
                "CLAUDE.md": true,
                "AGENTS.md": false,
              },
              skills: true,
              skillScope: "project",
              optionalSkills: [],
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

      expect(manifest?.selections).toEqual(expectedSelections);
      expect(resolveInstallProfile(manifest!.selections).profileId).toBe(
        resolveInstallProfile(expectedSelections).profileId,
      );
      expect("instructionKinds" in (manifest?.selections ?? {})).toBe(false);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("installs an optional skill only when selected", async () => {
    const targetDir = createTempDir();
    try {
      await installWithSelections(targetDir, (selections) => {
        selections.optionalSkills = ["decompose-codebase"];
      });

      expect(existsSync(path.join(targetDir, ".claude/skills/decompose-codebase/SKILL.md"))).toBe(
        true,
      );
      expect(
        existsSync(
          path.join(targetDir, ".agents/skills/decompose-codebase/references/mcp-playbook.md"),
        ),
      ).toBe(true);
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
        existsSync(path.join(targetDir, "docs/.prompts/request-to-design.prompt.md")),
      ).toBe(true);
      expect(
        existsSync(path.join(targetDir, "docs/.prompts/designs-to-plan.prompt.md")),
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
      expect(existsSync(path.join(targetDir, "docs/.templates/plan-overview.md"))).toBe(true);
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

      expect(existsSync(path.join(targetDir, "docs/.references/guide-contract.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/.references/wave-model.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/.references/history-record-contract.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/.templates/guide-developer.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/.templates/guide-user.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/.templates/history-record.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/guides/AGENTS.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/guides/CLAUDE.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/.assets/AGENTS.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/.assets/CLAUDE.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/.assets/history/AGENTS.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/.assets/history/CLAUDE.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/.assets/config/AGENTS.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/.assets/config/CLAUDE.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/guides/agent"))).toBe(false);
      expect(existsSync(path.join(targetDir, "docs/.archive/AGENTS.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/.archive/CLAUDE.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/.prompts/session-to-history-record.prompt.md"))).toBe(true);
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
        path.join(targetDir, "docs/.references/design-workflow.md"),
        "utf8",
      );
      const docsRouter = readFileSync(path.join(targetDir, "docs/AGENTS.md"), "utf8");

      expect(workflow).toContain("planning-not-installed");
      expect(workflow).not.toContain("docs/.prompts/");
      expect(docsRouter).toContain("docs/designs/");
      expect(docsRouter).not.toContain("docs/plans/");
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("supports a plans-only install without prompts", async () => {
    const targetDir = createTempDir();
    try {
      await installWithSelections(targetDir, (selections) => {
        selections.capabilities.designs = false;
        selections.capabilities.prd = false;
        selections.capabilities.work = false;
        selections.prompts = false;
      });

      expect(existsSync(path.join(targetDir, "docs/plans/AGENTS.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/.prompts"))).toBe(false);
      expect(readFileSync(path.join(targetDir, "docs/AGENTS.md"), "utf8")).not.toContain(
        "docs/.prompts/",
      );
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
        existsSync(path.join(targetDir, "docs/.prompts/plan-to-prd-green-field.prompt.md")),
      ).toBe(true);
      expect(
        existsSync(path.join(targetDir, "docs/.prompts/prd-to-work-full-prd.prompt.md")),
      ).toBe(false);
      expect(readFileSync(path.join(targetDir, "docs/AGENTS.md"), "utf8")).not.toContain(
        "docs/work/",
      );
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("removes prompt references when prompts are disabled", async () => {
    const targetDir = createTempDir();
    try {
      await installWithSelections(targetDir, (selections) => {
        selections.prompts = false;
      });

      expect(existsSync(path.join(targetDir, "docs/.prompts"))).toBe(false);

      const contents = collectMarkdownContents(targetDir).join("\n");
      expect(contents).not.toContain("docs/.prompts/");
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("stages conflicting instruction files without overwriting them", async () => {
    const targetDir = createTempDir();
    try {
      mkdirSync(path.join(targetDir, "docs"), { recursive: true });
      writeFileSync(path.join(targetDir, "AGENTS.md"), "custom root agents\n", "utf8");
      writeFileSync(path.join(targetDir, "docs/AGENTS.md"), "custom docs agents\n", "utf8");

      const { manifest } = await installWithSelections(targetDir, () => {});

      expect(readFileSync(path.join(targetDir, "AGENTS.md"), "utf8")).toBe("custom root agents\n");
      expect(readFileSync(path.join(targetDir, "docs/AGENTS.md"), "utf8")).toBe(
        "custom docs agents\n",
      );

      const files = collectFiles(targetDir);
      const conflictFiles = files.filter((relativePath) =>
        relativePath.startsWith("docs/.assets/config/conflicts/"),
      );

      expect(conflictFiles.some((relativePath) => relativePath.endsWith("/AGENTS.md"))).toBe(true);
      expect(conflictFiles.some((relativePath) => relativePath.endsWith("/docs/AGENTS.md"))).toBe(
        true,
      );
      expect(manifest.files["AGENTS.md"]).toBeUndefined();
      expect(manifest.files["docs/AGENTS.md"]).toBeUndefined();
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("appends generated instructions when updating a conflicting instruction file", async () => {
    const targetDir = createTempDir();
    try {
      writeFileSync(path.join(targetDir, "AGENTS.md"), "custom root agents\n", "utf8");

      const selections = defaultSelections();
      const existingManifest = loadManifest(targetDir);
      const plan = await planInstall({
        targetDir,
        selections,
        existingManifest,
        instructionConflictResolutions: {
          "AGENTS.md": "update",
        },
      });

      expect(plan.actions.find((action) => action.relativePath === "AGENTS.md")).toMatchObject({
        type: "update-conflict",
      });

      const result = applyInstallPlan({
        targetDir,
        plan,
        existingManifest,
      });

      const merged = readFileSync(path.join(targetDir, "AGENTS.md"), "utf8");
      expect(merged).toContain("custom root agents\n");
      expect(merged).toContain(readPackageFile("AGENTS.md"));
      expect(result.manifest.files["AGENTS.md"]).toBeUndefined();
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
        instructionConflictResolutions: {
          "AGENTS.md": "overwrite",
        },
      });

      expect(plan.actions.find((action) => action.relativePath === "AGENTS.md")).toMatchObject({
        reason: "Overwrite existing conflicting agent instructions.",
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

  test("skips and stages updates for locally modified managed files", async () => {
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

      applyInstallPlan({
        targetDir,
        plan,
        existingManifest,
      });

      expect(readFileSync(path.join(targetDir, "docs/AGENTS.md"), "utf8")).toBe(
        "locally edited docs router\n",
      );

      const files = collectFiles(targetDir);
      expect(
        files.some(
          (relativePath) =>
            relativePath.startsWith("docs/.assets/config/conflicts/") &&
            relativePath.endsWith("/docs/AGENTS.md"),
        ),
      ).toBe(true);
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
        selections.prompts = false;
      });

      expect(existsSync(path.join(targetDir, "docs/work/AGENTS.md"))).toBe(false);
      expect(existsSync(path.join(targetDir, "docs/.prompts"))).toBe(false);

      await installWithSelections(targetDir, () => {});

      expect(existsSync(path.join(targetDir, "docs/work/AGENTS.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, "docs/.prompts/designs-to-plan.prompt.md"))).toBe(
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

      const manifestPath = path.join(targetDir, "docs/.assets/config/manifest.json");
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
              optionalSkills: [],
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
      expect(existsSync(path.join(targetDir, "docs/.templates"))).toBe(false);
      expect(manifest.files).toEqual({});
      expect(manifest.skillFiles).toContain(".claude/skills/archive-docs/SKILL.md");
      expect(manifest.skillFiles).toContain(".agents/skills/archive-docs/SKILL.md");
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

  test("skills-only sync cleans up deselected optional skill files", async () => {
    const targetDir = createTempDir();
    try {
      await syncSkillsOnly(targetDir, (selections) => {
        selections.optionalSkills = ["decompose-codebase"];
      });

      expect(existsSync(path.join(targetDir, ".claude/skills/decompose-codebase/SKILL.md"))).toBe(
        true,
      );

      const { manifest } = await syncSkillsOnly(targetDir, (selections) => {
        selections.optionalSkills = [];
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
