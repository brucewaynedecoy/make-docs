import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { applyInstallPlan, planInstall } from "../src/install";
import { loadManifest, writeManifest } from "../src/manifest";
import { skillChangesLeftForSkillsSetup, skillChangesNextAction } from "../src/migration";
import {
  KEPT_FOR_REVIEW_HEADING,
  KEPT_FOR_REVIEW_REASON,
  runSkillsCommand,
  WOULD_KEEP_FOR_REVIEW_HEADING,
} from "../src/skills-command";
import { defaultSelections } from "../src/profile";
import { loadSkillRegistry } from "../src/skill-registry";
import type { InstallManifest } from "../src/types";
import { hashText } from "../src/utils";
import { cleanupTempDir, createTempDir, mockSkillFetches } from "./helpers";

// W34 R0 P4 (PRD 08 R-SKILL-BUNDLE-7 and Validation Boundary, PRD 25 Managed
// Removal and MCP Safety): the Python helpers that older releases installed are
// gone from the registry. The project update path removes an installed copy
// that Make Docs wrote and that nobody changed since, and keeps a changed copy
// as a conflict for review. `make-docs update` updates only the tool. The
// project update is `make-docs setup`, which plans each removal through
// `planStaleSkillFile` and leaves Skill file changes to `make-docs setup
// skills` (PRD 08 R-SKILL-SETUP-6), which applies them. The tests run with the
// temporary `MAKE_DOCS_HOME` that `tests/setup.ts` sets, never the real Store.

const PACKAGE_ROOT = path.resolve(__dirname, "..");

/** Each file that a release before W34 R0 installed, by Skill. */
const REMOVED_INSTALLED_SCRIPTS = [
  { skill: "archive-docs", installPath: "scripts/trace_relationships.py" },
  { skill: "cleanup-docs", installPath: "scripts/check_markdown_style.py" },
  { skill: "decompose-codebase", installPath: "scripts/probe_environment.py" },
  { skill: "decompose-codebase", installPath: "scripts/validate_output.py" },
] as const;

const SELECTED_SKILLS = ["archive-docs", "cleanup-docs", "decompose-codebase"];

const KEPT_REASON =
  "Existing managed file differs from the recorded manifest and will not be removed automatically.";

/** The `make-docs setup` plan for an existing install, and the Skill changes it leaves to `setup skills`. */
async function planSetup(targetDir: string) {
  const existingManifest = loadManifest(targetDir);
  const plan = await planInstall({
    targetDir,
    selections: structuredClone(existingManifest!.selections),
    existingManifest,
  });
  return { plan, leftForSkillsSetup: skillChangesLeftForSkillsSetup(plan) };
}

/** Run `make-docs setup skills --yes` and return what it prints, as one line of plain text. */
async function runSetupSkills(
  targetDir: string,
  options: { remove?: boolean; noCodex?: boolean; dryRun?: boolean } = {},
): Promise<string> {
  let printed = "";
  const capture = (chunk: unknown) => {
    printed += String(chunk);
    return true;
  };
  const stdoutSpy = vi.spyOn(process.stdout, "write").mockImplementation(capture as never);
  const stderrSpy = vi.spyOn(process.stderr, "write").mockImplementation(capture as never);
  try {
    await runSkillsCommand({
      targetDir,
      dryRun: options.dryRun ?? false,
      yes: true,
      remove: options.remove ?? false,
      noCodex: options.noCodex ?? false,
      noClaudeCode: false,
    });
  } finally {
    stdoutSpy.mockRestore();
    stderrSpy.mockRestore();
  }
  // Strip colors and the note frame, and join wrapped lines, so the text reads as one line.
  return printed.replace(/\u001b\[[0-9;]*m/g, "").replace(/[│║]/g, " ").replace(/\s+/g, " ");
}

async function installCurrentSkills(
  targetDir: string,
  configure: (selections: ReturnType<typeof defaultSelections>) => void = () => {},
): Promise<void> {
  const selections = defaultSelections();
  selections.skills = true;
  selections.selectedSkills = [...SELECTED_SKILLS];
  configure(selections);
  const plan = await planInstall({ targetDir, selections, existingManifest: null });
  applyInstallPlan({ targetDir, plan, existingManifest: null });
}

/**
 * Turn a current install into an older one: write each removed script where an
 * older release put it, and record it in the Store manifest as a Make Docs file
 * with the hash that the older release wrote.
 */
function simulateOlderInstall(targetDir: string, skillsRoot = ".agents/skills"): Map<string, string> {
  const manifest = loadManifest(targetDir) as InstallManifest;
  const written = new Map<string, string>();
  for (const { skill, installPath } of REMOVED_INSTALLED_SCRIPTS) {
    const relativePath = `${skillsRoot}/${skill}/${installPath}`;
    const content = `#!/usr/bin/env python3\n# Older ${skill} helper: ${installPath}\nprint("ok")\n`;
    const absolutePath = path.join(targetDir, relativePath);
    mkdirSync(path.dirname(absolutePath), { recursive: true });
    writeFileSync(absolutePath, content, "utf8");
    manifest.files[relativePath] = {
      hash: hashText(content),
      sourceId: `skill-shared-asset:${skill}:${installPath}`,
    };
    manifest.skillFiles = [...new Set([...manifest.skillFiles, relativePath])].sort();
    written.set(relativePath, content);
  }
  writeManifest(targetDir, manifest);
  return written;
}

describe("W34 R0 P4 managed removal of the retired Python Skill scripts", () => {
  beforeEach(() => {
    mockSkillFetches();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  test("the registry no longer declares any removed script", () => {
    const registry = loadSkillRegistry(PACKAGE_ROOT);
    for (const { skill, installPath } of REMOVED_INSTALLED_SCRIPTS) {
      const entry = registry.skills.find((candidate) => candidate.name === skill);
      expect(entry, skill).toBeDefined();
      expect(entry!.assets.map((asset) => asset.installPath)).not.toContain(installPath);
    }
  });

  for (const { skill, installPath } of REMOVED_INSTALLED_SCRIPTS) {
    const relativePath = `.agents/skills/${skill}/${installPath}`;

    test(`setup plans removal of an unchanged ${skill}/${installPath} and routes it to setup skills`, async () => {
      const targetDir = createTempDir("make-docs-w34-p4-removal-");
      try {
        await installCurrentSkills(targetDir);
        simulateOlderInstall(targetDir);

        const { plan, leftForSkillsSetup } = await planSetup(targetDir);
        const action = plan.actions.find((candidate) => candidate.relativePath === relativePath);

        expect(action).toMatchObject({ type: "remove-managed", relativePath });
        expect(leftForSkillsSetup).toContain(action);
        expect(skillChangesNextAction(leftForSkillsSetup.length)).toContain("make-docs setup skills");
      } finally {
        cleanupTempDir(targetDir);
      }
    });

    test(`setup plans to keep a changed ${skill}/${installPath} as a conflict for review`, async () => {
      const targetDir = createTempDir("make-docs-w34-p4-removal-");
      try {
        await installCurrentSkills(targetDir);
        const written = simulateOlderInstall(targetDir);
        const changed = `${written.get(relativePath)}# A person changed this file.\n`;
        writeFileSync(path.join(targetDir, relativePath), changed, "utf8");

        const { plan, leftForSkillsSetup } = await planSetup(targetDir);
        const action = plan.actions.find((candidate) => candidate.relativePath === relativePath);

        expect(action).toMatchObject({ type: "skip-conflict", relativePath, reason: KEPT_REASON });
        expect(leftForSkillsSetup).toContain(action);
        expect(readFileSync(path.join(targetDir, relativePath), "utf8")).toBe(changed);
      } finally {
        cleanupTempDir(targetDir);
      }
    });

    test(`setup skills removes an unchanged ${skill}/${installPath} and shows it in the plan`, async () => {
      const targetDir = createTempDir("make-docs-w34-p4-removal-");
      try {
        await installCurrentSkills(targetDir);
        simulateOlderInstall(targetDir);

        const printed = await runSetupSkills(targetDir);
        const manifest = loadManifest(targetDir)!;

        expect(printed).toContain(`- remove: Skill files: ${relativePath} `);
        expect(printed).not.toContain(KEPT_FOR_REVIEW_HEADING);
        expect(existsSync(path.join(targetDir, relativePath))).toBe(false);
        expect(manifest.files[relativePath]).toBeUndefined();
        expect(manifest.skillFiles).not.toContain(relativePath);
        // The Skill itself stays installed.
        expect(existsSync(path.join(targetDir, `.agents/skills/${skill}/SKILL.md`))).toBe(true);
      } finally {
        cleanupTempDir(targetDir);
      }
    });

    test(`setup skills keeps a changed ${skill}/${installPath} and reports it for review`, async () => {
      const targetDir = createTempDir("make-docs-w34-p4-removal-");
      try {
        await installCurrentSkills(targetDir);
        const written = simulateOlderInstall(targetDir);
        const changed = `${written.get(relativePath)}# A person changed this file.\n`;
        writeFileSync(path.join(targetDir, relativePath), changed, "utf8");

        const printed = await runSetupSkills(targetDir);
        const manifest = loadManifest(targetDir)!;

        // The person's copy stays, byte for byte, and the output names it with its reason.
        expect(readFileSync(path.join(targetDir, relativePath), "utf8")).toBe(changed);
        expect(printed).toContain(`- skip: Skill files: ${relativePath} `);
        expect(printed).toContain(`${KEPT_FOR_REVIEW_HEADING} - ${relativePath}: ${KEPT_FOR_REVIEW_REASON} `);
        expect(manifest.skillFiles).toContain(relativePath);
        // Unchanged siblings are still removed in the same run.
        for (const other of REMOVED_INSTALLED_SCRIPTS) {
          const otherPath = `.agents/skills/${other.skill}/${other.installPath}`;
          if (otherPath === relativePath) continue;
          expect(printed, otherPath).toContain(`- remove: Skill files: ${otherPath} `);
          expect(existsSync(path.join(targetDir, otherPath)), otherPath).toBe(false);
        }
      } finally {
        cleanupTempDir(targetDir);
      }
    });
  }

  test("an old script with no Store record is never planned and stays, under setup and setup skills", async () => {
    const targetDir = createTempDir("make-docs-w34-p4-removal-");
    try {
      await installCurrentSkills(targetDir);
      // A copy that Make Docs did not record, for example one a person copied in by hand.
      const relativePath = ".agents/skills/cleanup-docs/scripts/check_markdown_style.py";
      const content = "# Copied in by hand.\n";
      mkdirSync(path.dirname(path.join(targetDir, relativePath)), { recursive: true });
      writeFileSync(path.join(targetDir, relativePath), content, "utf8");

      const { plan } = await planSetup(targetDir);
      expect(plan.actions.find((action) => action.relativePath === relativePath)).toBeUndefined();

      const printed = await runSetupSkills(targetDir);
      expect(printed).not.toContain(relativePath);
      expect(readFileSync(path.join(targetDir, relativePath), "utf8")).toBe(content);
      expect(loadManifest(targetDir)!.files[relativePath]).toBeUndefined();
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("setup skills --remove removes unchanged old scripts and keeps and lists a changed one", async () => {
    const targetDir = createTempDir("make-docs-w34-p4-removal-");
    try {
      await installCurrentSkills(targetDir);
      const written = simulateOlderInstall(targetDir);
      const changedPath = ".agents/skills/decompose-codebase/scripts/validate_output.py";
      const changed = `${written.get(changedPath)}# A person changed this file.\n`;
      writeFileSync(path.join(targetDir, changedPath), changed, "utf8");

      const printed = await runSetupSkills(targetDir, { remove: true });
      const manifest = loadManifest(targetDir)!;

      expect(printed).toContain("Action: remove managed skills");
      expect(readFileSync(path.join(targetDir, changedPath), "utf8")).toBe(changed);
      expect(printed).toContain(`- skip: Skill files: ${changedPath} `);
      expect(printed).toContain(`${KEPT_FOR_REVIEW_HEADING} - ${changedPath}: ${KEPT_FOR_REVIEW_REASON} `);
      expect(manifest.skillFiles).toContain(changedPath);
      for (const relativePath of written.keys()) {
        if (relativePath === changedPath) continue;
        expect(printed, relativePath).toContain(`- remove: Skill files: ${relativePath} `);
        expect(existsSync(path.join(targetDir, relativePath)), relativePath).toBe(false);
        expect(manifest.skillFiles, relativePath).not.toContain(relativePath);
      }
      // The current Skill files are removed too.
      expect(existsSync(path.join(targetDir, ".agents/skills/cleanup-docs/SKILL.md"))).toBe(false);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("a Claude-only older install under .claude/skills loses unchanged old scripts and keeps a changed one", async () => {
    const targetDir = createTempDir("make-docs-w34-p4-removal-");
    try {
      await installCurrentSkills(targetDir, (selections) => {
        selections.harnesses.codex = false;
        selections.harnesses["claude-code"] = true;
      });
      // The registry supports a Claude-only project install: the Skill payload lives in .claude/skills.
      expect(existsSync(path.join(targetDir, ".claude/skills/cleanup-docs/SKILL.md"))).toBe(true);
      expect(existsSync(path.join(targetDir, ".agents/skills"))).toBe(false);

      const written = simulateOlderInstall(targetDir, ".claude/skills");
      const changedPath = ".claude/skills/archive-docs/scripts/trace_relationships.py";
      const changed = `${written.get(changedPath)}# A person changed this file.\n`;
      writeFileSync(path.join(targetDir, changedPath), changed, "utf8");

      const printed = await runSetupSkills(targetDir, { noCodex: true });
      const manifest = loadManifest(targetDir)!;

      expect(readFileSync(path.join(targetDir, changedPath), "utf8")).toBe(changed);
      expect(printed).toContain(`${KEPT_FOR_REVIEW_HEADING} - ${changedPath}: ${KEPT_FOR_REVIEW_REASON} `);
      expect(manifest.skillFiles).toContain(changedPath);
      for (const relativePath of written.keys()) {
        if (relativePath === changedPath) continue;
        expect(printed, relativePath).toContain(`- remove: Skill files: ${relativePath} `);
        expect(existsSync(path.join(targetDir, relativePath)), relativePath).toBe(false);
        expect(manifest.skillFiles, relativePath).not.toContain(relativePath);
      }
      expect(existsSync(path.join(targetDir, ".claude/skills/cleanup-docs/SKILL.md"))).toBe(true);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  // PRD 08 R-SKILL-SETUP-8: the kept list uses a plain reason, a dry run says what would happen,
  // and a file whose update is staged appears only in the staged list.
  test("the kept list gives a plain reason, not the planner's internal reason", async () => {
    const targetDir = createTempDir("make-docs-w34-p4-removal-");
    try {
      await installCurrentSkills(targetDir);
      const written = simulateOlderInstall(targetDir);
      const changedPath = ".agents/skills/cleanup-docs/scripts/check_markdown_style.py";
      writeFileSync(path.join(targetDir, changedPath), `${written.get(changedPath)}# changed\n`, "utf8");

      const printed = await runSetupSkills(targetDir);

      expect(KEPT_FOR_REVIEW_REASON).toBe(
        "You changed this file, so Make Docs kept it. Review it, then delete it or keep it.",
      );
      expect(printed).toContain(`- ${changedPath}: ${KEPT_FOR_REVIEW_REASON}`);
      expect(printed).not.toContain(KEPT_REASON);
      expect(printed).not.toContain("recorded manifest");
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("a dry run says which changed files setup would keep, and changes nothing", async () => {
    const targetDir = createTempDir("make-docs-w34-p4-removal-");
    try {
      await installCurrentSkills(targetDir);
      const written = simulateOlderInstall(targetDir);
      const changedPath = ".agents/skills/archive-docs/scripts/trace_relationships.py";
      const changed = `${written.get(changedPath)}# changed\n`;
      writeFileSync(path.join(targetDir, changedPath), changed, "utf8");
      const manifestBefore = JSON.stringify(loadManifest(targetDir));

      const printed = await runSetupSkills(targetDir, { dryRun: true });

      expect(WOULD_KEEP_FOR_REVIEW_HEADING).toBe("Changed files that setup would keep for your review:");
      expect(printed).toContain(`${WOULD_KEEP_FOR_REVIEW_HEADING} - ${changedPath}: ${KEPT_FOR_REVIEW_REASON} `);
      expect(printed).not.toContain(KEPT_FOR_REVIEW_HEADING);
      expect(printed).toContain("Dry run complete.");
      // Nothing changed: every old file is still there, and the Store record is the same.
      for (const relativePath of written.keys()) {
        expect(existsSync(path.join(targetDir, relativePath)), relativePath).toBe(true);
      }
      expect(readFileSync(path.join(targetDir, changedPath), "utf8")).toBe(changed);
      expect(JSON.stringify(loadManifest(targetDir))).toBe(manifestBefore);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("a changed file whose update is staged appears only in the staged list", async () => {
    const targetDir = createTempDir("make-docs-w34-p4-removal-");
    try {
      await installCurrentSkills(targetDir);
      const written = simulateOlderInstall(targetDir);
      // A current Skill file that a person changed: setup skills keeps it and stages the new bytes.
      const stagedPath = ".agents/skills/cleanup-docs/SKILL.md";
      const personal = "# My own cleanup notes\n";
      writeFileSync(path.join(targetDir, stagedPath), personal, "utf8");
      // An old script that a person changed: setup skills keeps it and stages nothing.
      const keptPath = ".agents/skills/decompose-codebase/scripts/probe_environment.py";
      writeFileSync(path.join(targetDir, keptPath), `${written.get(keptPath)}# changed\n`, "utf8");

      const printed = await runSetupSkills(targetDir);

      expect(readFileSync(path.join(targetDir, stagedPath), "utf8")).toBe(personal);
      expect(printed).toMatch(
        /Conflicts were staged for manual review: - \S*\.make-docs\/conflicts\/\S+\/\.agents\/skills\/cleanup-docs\/SKILL\.md /,
      );
      const keptList = printed.slice(printed.indexOf(KEPT_FOR_REVIEW_HEADING));
      expect(printed.indexOf(KEPT_FOR_REVIEW_HEADING)).toBeGreaterThan(printed.indexOf("Conflicts were staged"));
      expect(keptList).toContain(`- ${keptPath}: ${KEPT_FOR_REVIEW_REASON}`);
      expect(keptList).not.toContain(stagedPath);
    } finally {
      cleanupTempDir(targetDir);
    }
  });
});
