import { beforeEach, afterEach, describe, expect, test, vi } from "vitest";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { applyInstallPlan, planInstall } from "../src/install";
import { loadManifest } from "../src/manifest";
import { renderManagedBlock } from "../src/managed-block";
import { defaultSelections } from "../src/profile";
import { createTempDir, cleanupTempDir, mockSkillFetches } from "./helpers";
import {
  COMPATIBILITY_FIXTURE_CASES,
  createCompatibilityFixture,
} from "./compatibility-fixtures";

const runSelectionWizardMock = vi.fn();
const promptForManagedFileConflictResolutionsMock = vi.fn();
const confirmMock = vi.fn();
const runUninstallCommandMock = vi.fn();
const runSkillsCommandMock = vi.fn();
const ALL_SKILL_NAMES = [
  "archive-docs",
  "cleanup-docs",
  "decompose-codebase",
];

vi.mock("../src/wizard", () => ({
  runSelectionWizard: runSelectionWizardMock,
  promptForManagedFileConflictResolutions: promptForManagedFileConflictResolutionsMock,
}));

vi.mock("@clack/prompts", async () => {
  const actual = await vi.importActual<typeof import("@clack/prompts")>("@clack/prompts");

  return {
    ...actual,
    confirm: confirmMock,
    isCancel: (value: unknown) => value === "cancelled",
  };
});

function setTTY(value: boolean) {
  Object.defineProperty(process.stdin, "isTTY", {
    configurable: true,
    value,
  });
  Object.defineProperty(process.stdout, "isTTY", {
    configurable: true,
    value,
  });
}

async function installManifest(
  targetDir: string,
  configure?: (selections: ReturnType<typeof defaultSelections>) => void,
) {
  const selections = defaultSelections();
  configure?.(selections);
  const plan = await planInstall({
    targetDir,
    selections,
    existingManifest: loadManifest(targetDir),
  });

  applyInstallPlan({
    targetDir,
    plan,
    existingManifest: loadManifest(targetDir),
  });
}

function enableAllSkills(selections: ReturnType<typeof defaultSelections>): void {
  selections.skills = true;
  selections.selectedSkills = [...ALL_SKILL_NAMES];
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

function listConflictFiles(targetDir: string): string[] {
  const conflictDir = path.join(targetDir, ".make-docs/conflicts");
  if (!existsSync(conflictDir)) {
    return [];
  }

  const files: string[] = [];
  const collect = (directory: string) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        collect(entryPath);
        continue;
      }

      files.push(path.relative(targetDir, entryPath));
    }
  };

  collect(conflictDir);
  return files.sort();
}

function writeCustomManagedFile(targetDir: string, relativePath: string, content: string) {
  const absolutePath = path.join(targetDir, relativePath);
  mkdirSync(path.dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, content, "utf8");
}

function createLocalSkillManifestFixture(
  sourceOverride: Partial<Record<string, unknown>> = {},
) {
  const rootDir = createTempDir("make-docs-skill-manifest-");
  const skillDir = path.join(rootDir, "skills/acme-release");
  mkdirSync(skillDir, { recursive: true });
  writeFileSync(
    path.join(skillDir, "SKILL.md"),
    "# Acme release\n\nPrepare Acme release docs.\n",
    "utf8",
  );

  const manifestPath = path.join(rootDir, "skills.manifest.json");
  const manifest = {
    schemaVersion: 1,
    manifestId: "acme.local",
    displayName: "Acme local skills",
    sourcePolicy: {
      kind: "local",
      label: "Local Acme registry",
    },
    purposes: [
      {
        id: "acme.release-readiness",
        label: "Release readiness",
        description: "Prepare releases.",
        provenance: {
          kind: "local",
          label: "Local purpose",
        },
      },
    ],
    skills: [
      {
        name: "acme-release",
        displayName: "Acme release",
        source: "local:skills/acme-release",
        entryPoint: "SKILL.md",
        installName: "acme-release",
        description: "Prepare Acme release docs.",
        purposes: ["acme.release-readiness"],
        supportedHarnesses: ["codex"],
        provenance: {
          kind: "local",
          label: "Local Acme skill",
        },
        assets: [],
        ...sourceOverride,
      },
    ],
  };

  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  return { rootDir, manifestPath };
}

function writeConflictingRootInstruction(targetDir: string) {
  writeCustomManagedFile(
    targetDir,
    "AGENTS.md",
    `${renderManagedBlock("- Locally edited make-docs routing.\n")}\n`,
  );
}

function getCompatibilityFixtureCase(id: string) {
  const fixtureCase = COMPATIBILITY_FIXTURE_CASES.find((entry) => entry.id === id);
  if (!fixtureCase) {
    throw new Error(`Missing compatibility fixture case: ${id}`);
  }

  return fixtureCase;
}

async function captureCliOutput(argv: string[]): Promise<string> {
  const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

  try {
    const { runCli } = await import("../src/cli");

    await runCli(argv);
    return writeSpy.mock.calls.map(([chunk]) => String(chunk)).join("");
  } finally {
    writeSpy.mockRestore();
  }
}

async function captureCliError(argv: string[]): Promise<Error> {
  const { runCli } = await import("../src/cli");

  try {
    await runCli(argv);
  } catch (error) {
    if (error instanceof Error) {
      return error;
    }

    throw error;
  }

  throw new Error(`Expected CLI invocation to fail: ${argv.join(" ")}`);
}

describe("cli interactive flows", () => {
  beforeEach(() => {
    runSelectionWizardMock.mockReset();
    promptForManagedFileConflictResolutionsMock.mockReset();
    confirmMock.mockReset();
    runUninstallCommandMock.mockReset();
    runSkillsCommandMock.mockReset();
    mockSkillFetches();
    setTTY(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  test("uses the wizard for interactive setup without an existing manifest", async () => {
    const targetDir = createTempDir();
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    try {
      runSelectionWizardMock.mockResolvedValue(defaultSelections());
      const { runCli } = await import("../src/cli");

      await runCli(["setup", "--target", targetDir]);

      expect(runSelectionWizardMock).toHaveBeenCalledWith({
        initialSelections: expect.objectContaining({
          capabilities: expect.objectContaining({ designs: true, plans: true, prd: true, work: true }),
        }),
        introTitle: "Let's configure your make-docs install",
        config: expect.objectContaining({
          labels: expect.any(Object),
          personas: expect.any(Array),
        }),
      });
      expect(promptForManagedFileConflictResolutionsMock).not.toHaveBeenCalled();
      expect(confirmMock).not.toHaveBeenCalled();
      expect(writeSpy).toHaveBeenCalled();
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("uses the wizard for setup reconfigure", async () => {
    const targetDir = createTempDir();

    try {
      await installManifest(targetDir, (selections) => {
        selections.capabilities.work = false;
        selections.skills = false;
      });
      const wizardSelections = defaultSelections();
      wizardSelections.capabilities.work = false;
      wizardSelections.skills = false;
      runSelectionWizardMock.mockResolvedValue(wizardSelections);
      const { runCli } = await import("../src/cli");

      await runCli(["setup", "reconfigure", "--target", targetDir]);

      expect(runSelectionWizardMock).toHaveBeenCalledWith({
        initialSelections: expect.objectContaining({
          capabilities: expect.objectContaining({ designs: true, plans: true, prd: true, work: false }),
          skills: false,
        }),
        introTitle: "Let's reconfigure your make-docs install",
        config: expect.objectContaining({
          labels: expect.any(Object),
          personas: expect.any(Array),
        }),
      });
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("syncs saved selections on an interactive setup without opening the wizard", async () => {
    const targetDir = createTempDir();
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    try {
      await installManifest(targetDir, (selections) => {
        selections.capabilities.work = false;
        selections.skills = false;
      });
      const { runCli } = await import("../src/cli");

      await runCli(["setup", "--target", targetDir]);

      const output = writeSpy.mock.calls.map(([chunk]) => String(chunk)).join("");
      expect(runSelectionWizardMock).not.toHaveBeenCalled();
      expect(confirmMock).not.toHaveBeenCalled();
      expect(output).toContain("Information");
      expect(output).toContain("Mode: existing install sync");
      expect(output).toContain("Manifest:");
      expect(output).toContain(".make-docs/manifest.json");
      expect(output).toContain("(found)");
      expect(output).toContain("Selection source: saved manifest selections");
      expect(output).toContain("Changes planned: 0");
      expect(output).toContain("Results");
      expect(output).toContain("No managed file changes are needed.");
      expect(output).toContain("Every managed file already matched");
      expect(output).not.toContain("found an existing manifest");
      expect(output).not.toContain("It compared the saved selections");
      expect(output).not.toContain("make-docs is already up to date");
      expect(loadManifest(targetDir)?.selections.capabilities.work).toBe(false);
      expect(loadManifest(targetDir)?.selections.skills).toBe(false);
    } finally {
      writeSpy.mockRestore();
      cleanupTempDir(targetDir);
    }
  });

  test("ignores root instruction headings outside managed blocks during CLI sync", async () => {
    const targetDir = createTempDir();

    try {
      await installManifest(targetDir);
      for (const instructionFile of ["AGENTS.md", "CLAUDE.md"]) {
        const instructionPath = path.join(targetDir, instructionFile);
        const currentContent = readFileSync(instructionPath, "utf8");
        writeFileSync(instructionPath, `# Agent Instructions\n\n${currentContent}`, "utf8");
      }

      const output = await captureCliOutput(["setup", "--yes", "--target", targetDir, "--dry-run"]);

      expect(promptForManagedFileConflictResolutionsMock).not.toHaveBeenCalled();
      expect(output).toContain("Mode: existing install sync");
      expect(output).toContain("Already current:");
      expect(output).toContain("Changes planned: 0");
      expect(output).not.toContain("Resolve managed file conflicts");
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("renders configured labels in CLI summaries without changing selections", async () => {
    const targetDir = createTempDir();

    try {
      await installManifest(targetDir, (selections) => {
        selections.skills = false;
      });
      mkdirSync(path.join(targetDir, ".make-docs"), { recursive: true });
      writeFileSync(
        path.join(targetDir, ".make-docs/config.yaml"),
        `labels:
  documentKinds:
    design: Idea
    prd: Requirement
  coordinates:
    wave: Batch
    phase: Step
personas:
  - slug: user
    label: Reader
    description: People reading generated docs.
    primitive: user
`,
        "utf8",
      );

      const output = await captureCliOutput(["setup", "--yes", "--dry-run", "--target", targetDir]);

      expect(output).toContain("Document kind labels:");
      expect(output).toContain("design=Idea");
      expect(output).toContain("prd=Requirement");
      expect(output).toContain("Coordinate labels:");
      expect(output).toContain("wave=Batch");
      expect(output).toContain("phase=Step");
      expect(output).toContain("Persona labels:");
      expect(output).toContain("user=Reader");
      expect(loadManifest(targetDir)?.selections.skills).toBe(false);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("installs default selections on a non-interactive setup", async () => {
    const targetDir = createTempDir();

    try {
      setTTY(false);
      const { runCli } = await import("../src/cli");

      await runCli(["setup", "--yes", "--target", targetDir]);

      const manifest = loadManifest(targetDir);
      expect(runSelectionWizardMock).not.toHaveBeenCalled();
      expect(confirmMock).not.toHaveBeenCalled();
      expect(manifest?.selections.capabilities).toEqual({
        designs: true,
        plans: true,
        prd: true,
        work: true,
      });
      expect(manifest?.selections.skills).toBe(false);
      expect(manifest?.selections.selectedSkills).toEqual([]);
      expect(manifest?.skillFiles).toEqual([]);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("rejects invalid project config before writing install outputs", async () => {
    const targetDir = createTempDir();

    try {
      mkdirSync(path.join(targetDir, ".make-docs"), { recursive: true });
      writeFileSync(
        path.join(targetDir, ".make-docs/config.yaml"),
        `paths:
  designs: docs/ideas
`,
        "utf8",
      );
      setTTY(false);

      const error = await captureCliError(["setup", "--yes", "--target", targetDir]);

      expect(error.message).toContain("Invalid make-docs config");
      expect(error.message).toContain(".make-docs/config.yaml");
      expect(error.message).toContain("paths");
      expect(error.message).toContain("structural paths");
      expect(existsSync(path.join(targetDir, ".make-docs/manifest.json"))).toBe(false);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("presents the pre-v2 warning-and-choice flow on setup against a v1 install and cancels non-interactively", async () => {
    const fixture = await createCompatibilityFixture(getCompatibilityFixtureCase("clean-v1"));

    try {
      setTTY(false);

      // R-MIG-2: a fingerprinted pre-v2 install must never upgrade silently.
      // Non-interactive runs see the itemized warning and are cancelled with
      // the install untouched.
      const output = await captureCliOutput(["setup", "--yes", "--target", fixture.targetDir]);

      expect(output).toContain("pre-v2 make-docs install was detected");
      expect(output).toContain("Setup cancelled. The existing pre-v2 install was left untouched.");
      const rawManifest = JSON.parse(
        readFileSync(path.join(fixture.targetDir, ".make-docs/manifest.json"), "utf8"),
      ) as { schemaVersion: number };
      expect(rawManifest.schemaVersion).toBe(1);
    } finally {
      cleanupTempDir(fixture.targetDir);
    }
  });

  test("allows first install into non-empty projects without make-docs ownership evidence", async () => {
    const targetDir = createTempDir();

    try {
      writeFileSync(path.join(targetDir, "README.md"), "# Existing project\n");
      setTTY(false);

      const output = await captureCliOutput(["setup", "--yes", "--target", targetDir]);

      expect(output).toContain("Mode: first install");
      expect(output).not.toContain("Compatibility state:");
      expect(readFileSync(path.join(targetDir, "README.md"), "utf8")).toBe(
        "# Existing project\n",
      );
      expect(loadManifest(targetDir)?.schemaVersion).toBe(2);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("cancels non-interactive modified-v1 migration at the pre-v2 gate before writing changes", async () => {
    const fixture = await createCompatibilityFixture(getCompatibilityFixtureCase("modified-v1"));
    const modifiedPath = path.join(fixture.targetDir, "docs/AGENTS.md");

    try {
      setTTY(false);

      const output = await captureCliOutput(["setup", "--yes", "--target", fixture.targetDir]);

      expect(output).toContain("pre-v2 make-docs install was detected");
      expect(output).toContain("Setup cancelled. The existing pre-v2 install was left untouched.");
      expect(readFileSync(modifiedPath, "utf8")).toBe("user modified managed file\n");
    } finally {
      cleanupTempDir(fixture.targetDir);
    }
  });

  test("blocks backup-and-reinstall disposition from ordinary apply", async () => {
    const fixture = await createCompatibilityFixture(
      getCompatibilityFixtureCase("malformed-manifest"),
    );
    const manifestPath = path.join(fixture.targetDir, ".make-docs/manifest.json");

    try {
      setTTY(false);

      const error = await captureCliError(["setup", "--yes", "--target", fixture.targetDir]);

      expect(error.message).toContain(
        "requires an explicit backup-and-reinstall migration flow",
      );
      expect(error.message).toContain("Compatibility state: malformed-manifest");
      expect(error.message).toContain("Disposition: backup-and-reinstall");
      expect(readFileSync(manifestPath, "utf8")).toBe("{ malformed\n");
    } finally {
      cleanupTempDir(fixture.targetDir);
    }
  });

  test("blocks manual-review-required disposition for ambiguous first-install collisions", async () => {
    const fixture = await createCompatibilityFixture(getCompatibilityFixtureCase("unknown-shape"));
    const notesPath = path.join(fixture.targetDir, "notes/project.md");
    const collisionPath = path.join(fixture.targetDir, "AGENTS.md");

    try {
      writeFileSync(collisionPath, "existing agent instructions\n");
      setTTY(false);

      const error = await captureCliError(["setup", "--yes", "--target", fixture.targetDir]);

      expect(error.message).toContain(
        "make-docs cannot classify this target safely enough to write changes.",
      );
      expect(error.message).toContain("Compatibility state: unknown-shape");
      expect(error.message).toContain("Disposition: manual-review-required");
      expect(readFileSync(notesPath, "utf8")).toBe("# User notes\n");
      expect(readFileSync(collisionPath, "utf8")).toBe("existing agent instructions\n");
      expect(loadManifest(fixture.targetDir)).toBeNull();
    } finally {
      cleanupTempDir(fixture.targetDir);
    }
  });

  test("syncs saved selections on a non-interactive setup", async () => {
    const targetDir = createTempDir();

    try {
      await installManifest(targetDir, (selections) => {
        selections.capabilities.work = false;
        selections.skills = false;
      });
      setTTY(false);
      const { runCli } = await import("../src/cli");

      await runCli(["setup", "--yes", "--target", targetDir]);

      expect(runSelectionWizardMock).not.toHaveBeenCalled();
      expect(confirmMock).not.toHaveBeenCalled();
      expect(loadManifest(targetDir)?.selections.capabilities.work).toBe(false);
      expect(loadManifest(targetDir)?.selections.skills).toBe(false);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("preserves non-interactive flag behavior with --yes", async () => {
    const targetDir = createTempDir();

    try {
      const { runCli } = await import("../src/cli");

      await runCli(["setup", "--yes", "--no-work", "--target", targetDir]);

      expect(runSelectionWizardMock).not.toHaveBeenCalled();
      expect(promptForManagedFileConflictResolutionsMock).not.toHaveBeenCalled();
      expect(loadManifest(targetDir)?.selections.capabilities.work).toBe(false);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("applies selection flags on setup for an existing install", async () => {
    const targetDir = createTempDir();

    try {
      await installManifest(targetDir, enableAllSkills);
      const claudeSkillPath = path.join(targetDir, ".claude/skills/archive-docs");
      const codexSkillPath = path.join(targetDir, ".agents/skills/archive-docs");
      expect(existsSync(claudeSkillPath)).toBe(true);
      expect(existsSync(codexSkillPath)).toBe(true);
      confirmMock.mockResolvedValue(true);
      const { runCli } = await import("../src/cli");

      await runCli(["setup", "--no-skills", "--target", targetDir]);

      expect(runSelectionWizardMock).not.toHaveBeenCalled();
      expect(promptForManagedFileConflictResolutionsMock).not.toHaveBeenCalled();
      expect(loadManifest(targetDir)?.selections.skills).toBe(false);
      expect(loadManifest(targetDir)?.selections.selectedSkills).toEqual([]);
      expect(existsSync(claudeSkillPath)).toBe(false);
      expect(existsSync(codexSkillPath)).toBe(false);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("applies interactive managed file conflict overwrite resolutions", async () => {
    const targetDir = createTempDir();

    try {
      writeConflictingRootInstruction(targetDir);
      runSelectionWizardMock.mockResolvedValue(defaultSelections());
      promptForManagedFileConflictResolutionsMock.mockResolvedValue({
        "AGENTS.md": "overwrite",
      });
      const { runCli } = await import("../src/cli");

      await runCli(["setup", "--target", targetDir]);

      expect(promptForManagedFileConflictResolutionsMock).toHaveBeenCalledWith([
        {
          relativePath: "AGENTS.md",
          group: "agent-instructions",
          sourceId: "file:AGENTS.md",
          instructionKind: "AGENTS.md",
          scope: "managed-block",
          reason:
            "Existing conflicting make-docs managed block was skipped because no reassert resolution was provided.",
        },
      ]);
      expect(readFileSync(path.join(targetDir, "AGENTS.md"), "utf8")).not.toBe(
        `${renderManagedBlock("- Locally edited make-docs routing.\n")}\n`,
      );
      expect(loadManifest(targetDir)?.files["AGENTS.md"]).toEqual(
        expect.objectContaining({ sourceId: "file:AGENTS.md" }),
      );
      expect(listConflictFiles(targetDir).some((file) => file.endsWith("/AGENTS.md"))).toBe(
        false,
      );
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("blocks ambiguous missing-manifest conflicts before applying", async () => {
    const targetDir = createTempDir();

    try {
      writeConflictingRootInstruction(targetDir);
      writeCustomManagedFile(
        targetDir,
        ".make-docs/contracts/system/guide-contract.md",
        "custom guide contract\n",
      );
      writeCustomManagedFile(
        targetDir,
        ".make-docs/templates/system/guide-user.md",
        "custom guide template\n",
      );
      runSelectionWizardMock.mockResolvedValue(defaultSelections());
      promptForManagedFileConflictResolutionsMock.mockResolvedValue(null);

      const error = await captureCliError(["setup", "--target", targetDir]);

      expect(error.message).toContain(
        "requires an explicit backup-and-reinstall migration flow",
      );
      expect(error.message).toContain("Compatibility state: missing-manifest-recognizable");
      expect(error.message).toContain("Disposition: backup-and-reinstall");
      expect(promptForManagedFileConflictResolutionsMock).not.toHaveBeenCalled();
      expect(readFileSync(path.join(targetDir, "AGENTS.md"), "utf8")).toBe(
        `${renderManagedBlock("- Locally edited make-docs routing.\n")}\n`,
      );
      expect(
        readFileSync(path.join(targetDir, ".make-docs/contracts/system/guide-contract.md"), "utf8"),
      ).toBe("custom guide contract\n");
      expect(
        readFileSync(path.join(targetDir, ".make-docs/templates/system/guide-user.md"), "utf8"),
      ).toBe("custom guide template\n");
      expect(existsSync(path.join(targetDir, ".make-docs/manifest.json"))).toBe(false);
      expect(listConflictFiles(targetDir)).toEqual([]);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("fails non-interactive ambiguous missing-manifest conflicts before writing outputs", async () => {
    const targetDir = createTempDir();

    try {
      writeConflictingRootInstruction(targetDir);
      writeCustomManagedFile(
        targetDir,
        ".make-docs/contracts/system/guide-contract.md",
        "custom guide contract\n",
      );
      writeCustomManagedFile(
        targetDir,
        ".make-docs/templates/system/guide-user.md",
        "custom guide template\n",
      );
      const error = await captureCliError(["setup", "--yes", "--target", targetDir]);

      expect(promptForManagedFileConflictResolutionsMock).not.toHaveBeenCalled();
      expect(error.message).toContain(
        "requires an explicit backup-and-reinstall migration flow",
      );
      expect(error.message).toContain("Compatibility state: missing-manifest-recognizable");
      expect(error.message).toContain("Disposition: backup-and-reinstall");
      expect(readFileSync(path.join(targetDir, "AGENTS.md"), "utf8")).toBe(
        `${renderManagedBlock("- Locally edited make-docs routing.\n")}\n`,
      );
      expect(
        readFileSync(path.join(targetDir, ".make-docs/contracts/system/guide-contract.md"), "utf8"),
      ).toBe("custom guide contract\n");
      expect(
        readFileSync(path.join(targetDir, ".make-docs/templates/system/guide-user.md"), "utf8"),
      ).toBe("custom guide template\n");
      expect(loadManifest(targetDir)).toBeNull();
      expect(listConflictFiles(targetDir)).toEqual([]);
      expect(existsSync(path.join(targetDir, "docs/AGENTS.md"))).toBe(false);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("renders planned file operations by final generate update skip and remove groups", async () => {
    const targetDir = createTempDir();

    try {
      await installManifest(targetDir);
      rmSync(path.join(targetDir, ".make-docs/templates/system/guide-developer.md"));
      writeConflictingRootInstruction(targetDir);
      writeCustomManagedFile(
        targetDir,
        ".make-docs/contracts/system/guide-contract.md",
        "custom guide contract\n",
      );
      promptForManagedFileConflictResolutionsMock.mockResolvedValue({
        "AGENTS.md": "skip",
        ".make-docs/contracts/system/guide-contract.md": "overwrite",
      });

      const output = await captureCliOutput([
        "setup",
        "--dry-run",
        "--no-work",
        "--target",
        targetDir,
      ]);
      const plannedLines = output
        .replace(/\u001b\[[0-9;]*m/g, "")
        .split("\n")
        .map((line) => line.replace(/[│║]/g, "").trim())
        .filter((line) => /^- (generate|update|skip|remove): /.test(line));

      expect(output).toContain("Planned file operations");
      expect(plannedLines).toContain("- generate: .make-docs/templates/system/guide-developer.md");
      expect(plannedLines).toContain("- update: .make-docs/contracts/system/guide-contract.md");
      expect(plannedLines).toContain("- skip: AGENTS.md");
      expect(plannedLines.some((line) => line.startsWith("- remove: "))).toBe(true);
      expect(plannedLines.every((line) => !line.includes("("))).toBe(true);
      expect(output).not.toContain("skip-conflict");

      const firstGenerate = plannedLines.findIndex((line) => line.startsWith("- generate: "));
      const firstUpdate = plannedLines.findIndex((line) => line.startsWith("- update: "));
      const firstSkip = plannedLines.findIndex((line) => line.startsWith("- skip: "));
      const firstRemove = plannedLines.findIndex((line) => line.startsWith("- remove: "));
      expect(firstGenerate).toBeGreaterThanOrEqual(0);
      expect(firstUpdate).toBeGreaterThan(firstGenerate);
      expect(firstSkip).toBeGreaterThan(firstUpdate);
      expect(firstRemove).toBeGreaterThan(firstSkip);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("supports canonical harness and skill flags for non-interactive apply", async () => {
    const targetDir = createTempDir();
    const fakeHome = createTempDir("make-docs-home-");
    const restoreHome = mockHomeDirectory(fakeHome);

    try {
      const { runCli } = await import("../src/cli");

      await runCli([
        "setup",
        "--yes",
        "--no-codex",
        "--skill-scope",
        "global",
        "--selected-skills",
        "decompose-codebase",
        "--target",
        targetDir,
      ]);

      const manifest = loadManifest(targetDir);
      expect(manifest?.selections.harnesses).toEqual({
        "claude-code": true,
        codex: false,
      });
      expect(manifest?.selections.skills).toBe(true);
      expect(manifest?.selections.skillScope).toBe("global");
      expect(manifest?.selections.selectedSkills).toEqual(["decompose-codebase"]);
      expect(manifest?.skillFiles).toContain(
        path.join(fakeHome, ".claude/skills/decompose-codebase"),
      );
      expect(manifest?.skillFiles).not.toContain(
        path.join(fakeHome, ".agents/skills/decompose-codebase"),
      );
    } finally {
      restoreHome();
      cleanupTempDir(targetDir);
      cleanupTempDir(fakeHome);
    }
  });

  test.each([
    ["--no-claude-code", { "claude-code": false, codex: true }],
    ["--no-codex", { "claude-code": true, codex: false }],
  ])("applies %s to the harness selections", async (flag, expectedHarnesses) => {
    const targetDir = createTempDir();

    try {
      const { runCli } = await import("../src/cli");

      await runCli(["setup", "--yes", flag, "--target", targetDir]);

      expect(loadManifest(targetDir)?.selections.harnesses).toEqual(expectedHarnesses);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("supports --no-skills for non-interactive apply", async () => {
    const targetDir = createTempDir();

    try {
      const { runCli } = await import("../src/cli");

      await runCli(["setup", "--yes", "--no-skills", "--target", targetDir]);

      const manifest = loadManifest(targetDir);
      expect(manifest?.selections.skills).toBe(false);
      expect(manifest?.selections.selectedSkills).toEqual([]);
      expect(manifest?.skillFiles).toEqual([]);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("supports --selected-skills all and none for non-interactive apply", async () => {
    const targetDir = createTempDir();
    const allTargetDir = createTempDir();

    try {
      const { runCli } = await import("../src/cli");

      await runCli(["setup", "--yes", "--selected-skills", "none", "--target", targetDir]);

      let manifest = loadManifest(targetDir);
      expect(manifest?.selections.selectedSkills).toEqual([]);
      expect(manifest?.skillFiles).toEqual([]);

      await runCli([
        "setup",
        "--selected-skills",
        "all",
        "--yes",
        "--target",
        allTargetDir,
      ]);

      manifest = loadManifest(allTargetDir);
      expect(manifest?.selections.selectedSkills).toEqual([
        "archive-docs",
        "cleanup-docs",
        "decompose-codebase",
      ]);
      expect(manifest?.skillFiles).toContain(".claude/skills/archive-docs");
      expect(manifest?.skillFiles).toContain(".claude/skills/cleanup-docs");
      expect(manifest?.skillFiles).toContain(".claude/skills/decompose-codebase");
    } finally {
      cleanupTempDir(targetDir);
      cleanupTempDir(allTargetDir);
    }
  });

  test("expands --selected-skills all against an alternate local skills manifest", async () => {
    const targetDir = createTempDir();
    const { rootDir: manifestRoot, manifestPath } = createLocalSkillManifestFixture();

    try {
      const { runCli } = await import("../src/cli");

      await runCli([
        "setup",
        "--yes",
        "--skill-manifest",
        manifestPath,
        "--selected-skills",
        "all",
        "--target",
        targetDir,
      ]);

      const manifest = loadManifest(targetDir);
      expect(manifest?.selections.skills).toBe(true);
      expect(manifest?.selections.selectedSkills).toEqual(["acme-release"]);
      expect(manifest?.skillFiles).toContain(".agents/skills/acme-release");
      expect(manifest?.skillFiles).not.toContain(".agents/skills/archive-docs");
      expect(manifest?.selections.skillManifest).toEqual({
        manifestId: "acme.local",
        displayName: "Acme local skills",
        sourcePolicyKind: "local",
        source: "file",
        path: manifestPath,
      });
      expect(manifest?.selections.skillSelectionProvenance).toEqual([
        expect.objectContaining({
          skillName: "acme-release",
          displayName: "Acme release",
          manifestId: "acme.local",
          manifestDisplayName: "Acme local skills",
          sourcePolicyKind: "local",
          purposeIds: ["acme.release-readiness"],
          purposeLabels: ["Release readiness"],
          supportedHarnesses: ["codex"],
          provenanceKind: "local",
          provenanceLabel: "Local Acme skill",
        }),
      ]);
      expect(manifest?.selections.skillSelectionProvenance?.[0]?.skillSource).toMatch(
        /^file:\/\//,
      );
    } finally {
      cleanupTempDir(targetDir);
      cleanupTempDir(manifestRoot);
    }
  });

  test("rejects remote skills manifests before writing install state", async () => {
    const targetDir = createTempDir();

    try {
      const error = await captureCliError([
        "setup",
        "--yes",
        "--skill-manifest",
        "https://example.com/skills.manifest.json",
        "--selected-skills",
        "all",
        "--target",
        targetDir,
      ]);

      expect(error.message).toContain(
        "Remote skills manifests require an immutable reference plus digest before install.",
      );
      expect(loadManifest(targetDir)).toBeNull();
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("rejects unpinned remote skill payloads from alternate manifests before writing install state", async () => {
    const targetDir = createTempDir();
    const { rootDir: manifestRoot, manifestPath } = createLocalSkillManifestFixture({
      source: "https://example.com/acme-release",
      provenance: {
        kind: "third-party",
        label: "Unpinned remote skill",
      },
    });

    try {
      const error = await captureCliError([
        "setup",
        "--yes",
        "--skill-manifest",
        manifestPath,
        "--selected-skills",
        "all",
        "--target",
        targetDir,
      ]);

      expect(error.message).toContain(
        "skill `acme-release` remote source requires remote-pinned provenance with immutable ref and digest",
      );
      expect(loadManifest(targetDir)).toBeNull();
    } finally {
      cleanupTempDir(targetDir);
      cleanupTempDir(manifestRoot);
    }
  });

  test.each(["project", "global"] as const)(
    "supports --skill-scope %s for non-interactive apply",
    async (skillScope) => {
      const targetDir = createTempDir();
      const fakeHome = skillScope === "global" ? createTempDir("make-docs-home-") : null;
      const restoreHome = fakeHome ? mockHomeDirectory(fakeHome) : null;

      try {
        const { runCli } = await import("../src/cli");

        await runCli(["setup", "--yes", "--skill-scope", skillScope, "--target", targetDir]);

        const manifest = loadManifest(targetDir);
        expect(manifest?.selections.skills).toBe(true);
        expect(manifest?.selections.skillScope).toBe(skillScope);
      } finally {
        restoreHome?.();
        cleanupTempDir(targetDir);
        if (fakeHome) {
          cleanupTempDir(fakeHome);
        }
      }
    },
  );

  test("routes skills removal through the skills command boundary", async () => {
    const targetDir = createTempDir();
    const cli = await import("../src/cli");

    try {
      cli.__setSkillsCommandRunnerForTests(runSkillsCommandMock);

      await cli.runCli([
        "setup",
        "skills",
        "--yes",
        "--dry-run",
        "--remove",
        "--no-codex",
        "--no-claude-code",
        "--skill-scope",
        "global",
        "--target",
        targetDir,
      ]);

      expect(runSkillsCommandMock).toHaveBeenCalledTimes(1);
      expect(runSkillsCommandMock).toHaveBeenCalledWith({
        targetDir: path.resolve(targetDir),
        dryRun: true,
        yes: true,
        remove: true,
        noCodex: true,
        noClaudeCode: true,
        skillScope: "global",
        selectedSkills: undefined,
      });
    } finally {
      cli.__setSkillsCommandRunnerForTests(null);
      cleanupTempDir(targetDir);
    }
  });

  test("parses skills sync options without entering the apply path", async () => {
    const targetDir = createTempDir();
    const cli = await import("../src/cli");

    try {
      cli.__setSkillsCommandRunnerForTests(runSkillsCommandMock);

      await cli.runCli([
        "setup",
        "skills",
        "--yes",
        "--selected-skills",
        "decompose-codebase",
        "--target",
        targetDir,
      ]);

      expect(runSelectionWizardMock).not.toHaveBeenCalled();
      expect(runSkillsCommandMock).toHaveBeenCalledTimes(1);
      expect(runSkillsCommandMock).toHaveBeenCalledWith({
        targetDir: path.resolve(targetDir),
        dryRun: false,
        yes: true,
        remove: false,
        noCodex: false,
        noClaudeCode: false,
        skillScope: undefined,
        selectedSkills: ["decompose-codebase"],
      });
    } finally {
      cli.__setSkillsCommandRunnerForTests(null);
      cleanupTempDir(targetDir);
    }
  });

  test("skills removal without a manifest does not create one", async () => {
    const targetDir = createTempDir();
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    try {
      const { runCli } = await import("../src/cli");

      await runCli(["setup", "skills", "--yes", "--remove", "--target", targetDir]);

      const output = writeSpy.mock.calls.map(([chunk]) => String(chunk)).join("");
      expect(output).toContain("No make-docs skill changes are needed.");
      expect(existsSync(path.join(targetDir, ".make-docs/manifest.json"))).toBe(
        false,
      );
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("skills removal with no tracked skills is a no-op", async () => {
    const targetDir = createTempDir();

    try {
      await installManifest(targetDir, (selections) => {
        selections.skills = false;
      });

      const output = await captureCliOutput(["setup", "skills", "--yes", "--remove", "--target", targetDir]);
      const manifest = loadManifest(targetDir);

      expect(output).toContain("make-docs setup skills removal plan");
      expect(output).toContain("Removal scope: all manifest-tracked skill files");
      expect(output).toContain("No make-docs skill changes are needed.");
      expect(manifest?.skillFiles).toEqual([]);
      expect(existsSync(path.join(targetDir, "docs/AGENTS.md"))).toBe(true);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("skills sync output uses skills-specific language", async () => {
    const targetDir = createTempDir();

    try {
      const output = await captureCliOutput([
        "setup",
        "skills",
        "--yes",
        "--selected-skills",
        "all",
        "--target",
        targetDir,
      ]);

      expect(output).toContain("make-docs setup skills plan");
      expect(output).toContain("Planned skill file operations:");
      expect(output).toContain("shared payload:");
      expect(output).toContain(".make-docs/agentics/skills/archive-docs/SKILL.md");
      expect(output).toContain(
        "native harness exposure: .claude/skills/archive-docs",
      );
      expect(output).toContain(
        "native harness exposure: .agents/skills/archive-docs",
      );
      expect(output).toContain("Installed skills");
      expect(output).not.toContain("Installed make-docs");
      expect(output).not.toContain("Reconfigured make-docs");
      expect(output).not.toContain("docs/assets/prompts");
      expect(output).not.toContain("docs/assets/templates");
      expect(output).not.toContain("docs/assets/references");
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test.each([
    ["--no-claude", { "claude-code": false, codex: true }],
    ["--no-agents", { "claude-code": true, codex: false }],
  ])("supports deprecated harness alias %s", async (flag, expectedHarnesses) => {
    const targetDir = createTempDir();

    try {
      const { runCli } = await import("../src/cli");

      await runCli(["setup", "--yes", flag, "--target", targetDir]);

      expect(loadManifest(targetDir)?.selections.harnesses).toEqual(expectedHarnesses);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("supports deprecated harness aliases for backward compatibility", async () => {
    const targetDir = createTempDir();

    try {
      const { runCli } = await import("../src/cli");

      await runCli(["setup", "--yes", "--no-agents", "--no-claude", "--target", targetDir]);

      expect(loadManifest(targetDir)?.selections.harnesses).toEqual({
        "claude-code": false,
        codex: false,
      });
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("reconfigure can disable skills while preserving the stored skill scope", async () => {
    const targetDir = createTempDir();
    const fakeHome = createTempDir("make-docs-home-");
    const restoreHome = mockHomeDirectory(fakeHome);

    try {
      await installManifest(targetDir, (selections) => {
        selections.skills = true;
        selections.skillScope = "global";
        selections.selectedSkills = ["decompose-codebase"];
      });
      const { runCli } = await import("../src/cli");

      await runCli(["setup", "reconfigure", "--yes", "--no-skills", "--target", targetDir]);

      const manifest = loadManifest(targetDir);
      expect(manifest?.selections.skills).toBe(false);
      expect(manifest?.selections.skillScope).toBe("global");
      expect(manifest?.selections.selectedSkills).toEqual([]);
      expect(
        existsSync(path.join(targetDir, ".claude/skills/decompose-codebase")),
      ).toBe(false);
    } finally {
      restoreHome();
      cleanupTempDir(targetDir);
      cleanupTempDir(fakeHome);
    }
  });

  test("reconfigure can clear selected skills and change the skill scope", async () => {
    const targetDir = createTempDir();
    const fakeHome = createTempDir("make-docs-home-");
    const restoreHome = mockHomeDirectory(fakeHome);

    try {
      await installManifest(targetDir, (selections) => {
        selections.skills = true;
        selections.skillScope = "global";
        selections.selectedSkills = ["decompose-codebase"];
      });
      const { runCli } = await import("../src/cli");

      await runCli([
        "setup",
        "reconfigure",
        "--yes",
        "--skill-scope",
        "project",
        "--selected-skills",
        "none",
        "--target",
        targetDir,
      ]);

      const manifest = loadManifest(targetDir);
      expect(manifest?.selections.skills).toBe(true);
      expect(manifest?.selections.skillScope).toBe("project");
      expect(manifest?.selections.selectedSkills).toEqual([]);
      expect(existsSync(path.join(targetDir, ".claude/skills/archive-docs"))).toBe(
        false,
      );
      expect(
        existsSync(path.join(targetDir, ".claude/skills/decompose-codebase")),
      ).toBe(false);
    } finally {
      restoreHome();
      cleanupTempDir(targetDir);
      cleanupTempDir(fakeHome);
    }
  });

  test("rejects non-interactive setup reconfigure without selection flags", async () => {
    const targetDir = createTempDir();

    try {
      await installManifest(targetDir);

      const error = await captureCliError([
        "setup",
        "reconfigure",
        "--yes",
        "--target",
        targetDir,
      ]);

      expect(error.message).toContain("requires at least one selection flag");
      expect(error.message).toContain("make-docs setup reconfigure");
      expect(runSelectionWizardMock).not.toHaveBeenCalled();
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("rejects setup reconfigure without a manifest with first-run guidance", async () => {
    const targetDir = createTempDir();

    try {
      const error = await captureCliError(["setup", "reconfigure", "--target", targetDir]);

      expect(error.message).toContain("No make-docs manifest");
      expect(error.message).toContain("Run `make-docs setup` first");
      expect(runSelectionWizardMock).not.toHaveBeenCalled();
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("rejects conflicting and invalid selected-skill selections", async () => {
    const targetDir = createTempDir();

    try {
      const { runCli } = await import("../src/cli");

      await expect(
        runCli([
          "setup",
          "--yes",
          "--no-skills",
          "--skill-scope",
          "global",
          "--target",
          targetDir,
        ]),
      ).rejects.toThrow(
        "`--no-skills` cannot be combined with `--skill-scope` or `--selected-skills`.",
      );

      await expect(
        runCli([
          "setup",
          "--yes",
          "--no-skills",
          "--skill-manifest",
          "local-skills.json",
          "--target",
          targetDir,
        ]),
      ).rejects.toThrow("`--no-skills` cannot be combined with `--skill-manifest`.");

      await expect(
        runCli([
          "setup",
          "--yes",
          "--selected-skills",
          "unknown-skill",
          "--target",
          targetDir,
        ]),
      ).rejects.toThrow(
        "Unknown selected skill `unknown-skill`. Valid skills: archive-docs, cleanup-docs, decompose-codebase.",
      );
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test.each([
    [["--no-designs"], ["--no-designs", "make-docs setup skills"]],
  ])("rejects content selection flags under setup skills %s", async (argv, messageParts) => {
    const targetDir = createTempDir();

    try {
      const error = await captureCliError(["setup", "skills", ...argv, "--target", targetDir]);

      for (const part of messageParts) {
        expect(error.message).toContain(part);
      }
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test.each([
    ["--no-prompts"],
    ["--templates"],
    ["--references"],
    ["--optional-skills"],
  ])("rejects removed asset-selection flag %s", async (flag) => {
    const targetDir = createTempDir();

    try {
      const error = await captureCliError([flag, "--target", targetDir]);

      expect(error.message).toContain(`Unknown argument: ${flag}`);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("rejects selected skill selection during skills removal", async () => {
    const targetDir = createTempDir();

    try {
      const error = await captureCliError([
        "setup",
        "skills",
        "--remove",
        "--selected-skills",
        "decompose-codebase",
        "--target",
        targetDir,
      ]);

      expect(error.message).toContain(
        "`--selected-skills` cannot be combined with `make-docs setup skills --remove`.",
      );
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test.each([
    [["--remove"], ["--remove", "Bare `make-docs`", "make-docs setup --remove"]],
    [["setup", "reconfigure", "--remove"], ["--remove", "make-docs setup reconfigure"]],
    [["--skills"], ["Unknown argument", "--skills"]],
  ])("rejects invalid root and cross-command skills flags for %s", async (argv, messageParts) => {
    const targetDir = createTempDir();

    try {
      const error = await captureCliError([...argv, "--target", targetDir]);

      for (const part of messageParts) {
        expect(error.message).toContain(part);
      }
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test.each([
    ["backup"],
    ["remove"],
  ])("rejects dry-run on lifecycle command setup %s", async (command) => {
    const targetDir = createTempDir();

    try {
      const error = await captureCliError(["setup", command, "--dry-run", "--target", targetDir]);

      expect(error.message).toContain("`--dry-run` is only valid");
      expect(error.message).toContain(`not \`make-docs setup ${command}\``);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("prints structured top-level help with exactly the five public commands", async () => {
    setTTY(false);

    const output = await captureCliOutput(["--help"]);

    expect(output).toMatch(/make-docs/i);
    expect(output).toMatch(/\bCommands\b/i);
    expect(output).toMatch(/\bExamples\b/i);
    expect(output).toContain("make-docs setup [reconfigure|skills|backup|remove] [options]");
    expect(output).toContain("make-docs run <domain> <verb> [options]");
    expect(output).toContain("make-docs mcp");
    expect(output).toContain("make-docs update");
    expect(output).toContain("make-docs uninstall");
    expect(output).toContain("Bare invocation never syncs.");

    const commandsBlock = output.split("Commands:")[1]?.split("Examples:")[0] ?? "";
    const commandNames = commandsBlock
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => line.split(/\s+/)[0]);
    expect(commandNames).toEqual(["setup", "run", "mcp", "update", "uninstall"]);

    expect(output).toContain(
      "setup        Install or sync this project; subcommands reconfigure, skills, backup, remove.",
    );
    expect(output).toContain("run          Run deterministic registry operations.");
    expect(output).toContain("mcp          Run the TypeScript MCP server over stdio.");
    expect(output).toContain("update       Update the installed make-docs tool itself.");
    expect(output).toContain("uninstall    Remove make-docs' machine-level footprint.");
    expect(output).not.toContain("make-docs init");
    expect(output).not.toContain("makedocs");
    expect(output).not.toContain("make-docs-js");
    expect(output).not.toContain("make-docs-rs");
    expect(output).not.toContain("--reconfigure");
    expect(output).not.toContain("--skills");
    expect(output).toMatch(/--help/i);
  });

  test.each([["--help"], ["setup", "reconfigure", "--help"], ["setup", "skills", "--help"]])(
    "does not expose internal system asset materialization modes in %s help",
    async (...argv: string[]) => {
      setTTY(false);

      const output = await captureCliOutput(argv);

      expect(output).not.toContain("full-snapshot");
      expect(output).not.toContain("provider-backed");
      expect(output).not.toContain("hybrid-pinned-cache");
    },
  );

  test("documents setup reconfigure selection-change behavior", async () => {
    setTTY(false);

    const output = await captureCliOutput(["setup", "reconfigure", "--help"]);

    expect(output).toContain("make-docs setup reconfigure");
    expect(output).toContain("Requires an existing .make-docs/manifest.json");
    expect(output).toContain("Interactive runs open the selection wizard");
    expect(output).toContain("Non-interactive runs with --yes must include at least one selection flag");
    expect(output).toContain("--yes                          Skip interactive prompts.");
    expect(output).toContain("make-docs setup reconfigure --yes --no-work");
    expect(output).toContain("--selected-skills <csv|all|none>");
    expect(output).not.toContain("--optional-skills");
    expect(output).not.toContain("--no-prompts");
    expect(output).not.toContain("--templates required|all");
    expect(output).not.toContain("--references required|all");
    expect(output).not.toContain("make-docs init");
    expect(output).not.toContain("make-docs update");
    expect(output).not.toContain("--reconfigure");
  });

  test("documents setup skills command help with skills-specific options", async () => {
    setTTY(false);

    const output = await captureCliOutput(["setup", "skills", "--help"]);

    expect(output).toContain("make-docs setup skills");
    expect(output).toContain("Sync or remove managed make-docs skills");
    expect(output).toContain("Usage:");
    expect(output).toContain("General options:");
    expect(output).toContain("Platform options:");
    expect(output).toContain("Skill options:");
    expect(output).toContain("--remove");
    expect(output).toContain("--skill-scope project|global");
    expect(output).toContain("--selected-skills <csv|all|none>");
    expect(output).not.toContain("--optional-skills");
    expect(output).toContain("make-docs setup skills --dry-run");
    expect(output).toContain("make-docs setup skills --remove");
    expect(output).toContain("make-docs setup skills --skill-scope global");
    expect(output).not.toContain("--no-designs");
    expect(output).not.toContain("--templates required|all");
    expect(output).not.toContain("--skills");
  });

  test.each([
    ["reconfigure", ["Usage:", "General options:", "Examples:", "make-docs setup reconfigure"]],
    ["skills", ["Usage:", "Skill options:", "Examples:", "make-docs setup skills"]],
    ["backup", ["Usage:", "Options:", "Examples:", "make-docs setup backup"]],
    ["remove", ["Usage:", "Options:", "Examples:", "make-docs setup remove"]],
  ])("prints command-specific help for setup %s", async (command, snippets) => {
    setTTY(false);

    const output = await captureCliOutput(["setup", command, "--help"]);

    for (const snippet of snippets) {
      expect(output).toContain(snippet);
    }
  });

  test("prints setup help with the subcommand model", async () => {
    setTTY(false);

    const output = await captureCliOutput(["setup", "--help"]);

    expect(output).toContain("make-docs setup");
    expect(output).toContain("Subcommands:");
    expect(output).toContain("reconfigure  Change saved selections for an existing install.");
    expect(output).toContain("skills       Sync or remove managed skills.");
    expect(output).toContain("backup       Create a backup of managed files.");
    expect(output).toContain(
      "remove       Remove this project's managed files, with an optional backup first.",
    );
  });

  test.each([
    [["init", "--yes"], ["The `init` command was removed", "make-docs setup"]],
    [["reconfigure"], ["The `reconfigure` command was removed", "make-docs setup reconfigure"]],
    [["skills", "--dry-run"], ["The `skills` command was removed", "make-docs setup skills"]],
    [["backup", "--yes"], ["The `backup` command was removed", "make-docs setup backup"]],
    [
      ["operations", "closeout", "probe"],
      ["The `operations` command was removed", "make-docs run <domain> <verb>"],
    ],
    [["--reconfigure"], ["`--reconfigure` was removed", "make-docs setup reconfigure"]],
    [
      ["update", "--reconfigure", "--yes"],
      ["`update --reconfigure` command was removed", "make-docs setup reconfigure"],
    ],
  ])("reports migration guidance for removed command surface %s", async (argv, messageParts) => {
    const targetDir = createTempDir();

    try {
      const error = await captureCliError([...argv, "--target", targetDir]);

      for (const part of messageParts) {
        expect(error.message).toContain(part);
      }
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test.each(["makedocs", "make-docs-js", "make-docs-rs"])(
    "rejects default compatibility alias %s",
    async (alias) => {
      const targetDir = createTempDir();

      try {
        const error = await captureCliError([alias, "--target", targetDir]);

        expect(error.message).toContain(`Unknown argument: ${alias}`);
      } finally {
        cleanupTempDir(targetDir);
      }
    },
  );

  test("documents setup backup help with lifecycle-specific options", async () => {
    setTTY(false);

    const output = await captureCliOutput(["setup", "backup", "--help"]);

    expect(output).toContain("make-docs setup backup");
    expect(output).toContain("--target");
    expect(output).toContain("--yes");
    expect(output).toContain("Skip confirmation prompts");
    expect(output).toContain("non-destructive");
    expect(output).toContain("source files remain in place");
    expect(output).toContain(".make-docs/backup/<date>");
    expect(output).toContain("--help");
    expect(output).not.toContain("--no-skills");
  });

  test("documents setup remove help with backup and yes options", async () => {
    setTTY(false);

    const output = await captureCliOutput(["setup", "remove", "--help"]);

    expect(output).toContain("make-docs setup remove");
    expect(output).toContain("`make-docs uninstall` is the");
    expect(output).toContain("--target");
    expect(output).toContain("--backup");
    expect(output).toContain("--yes");
    expect(output).toContain("Skip confirmation prompts");
    expect(output).toContain(".make-docs/backup/<date>");
    expect(output).toContain("destructive");
    expect(output).toContain("audited managed files are removed");
    expect(output).toContain("--help");
    expect(output).not.toContain("--optional-skills");
  });

  test("keeps setup remove help on the help path without dispatching lifecycle work", async () => {
    setTTY(false);

    const output = await captureCliOutput(["setup", "remove", "--help"]);

    expect(output).toContain("make-docs setup remove");
    expect(runUninstallCommandMock).not.toHaveBeenCalled();
  });

  test("routes backup through the implemented lifecycle flow", async () => {
    const targetDir = createTempDir();
    const fakeHome = createTempDir("make-docs-home-");
    const restoreHome = mockHomeDirectory(fakeHome);

    try {
      setTTY(false);
      const output = await captureCliOutput([
        "setup",
        "backup",
        "--yes",
        "--target",
        targetDir,
      ]);

      expect(output).toContain("make-docs setup backup");
      expect(output).toContain("No make-docs-managed files required backup.");
    } finally {
      restoreHome();
      cleanupTempDir(targetDir);
      cleanupTempDir(fakeHome);
    }
  });

  test("defaults backup to confirmation mode", async () => {
    const targetDir = createTempDir();

    try {
      await installManifest(targetDir, (selections) => {
        selections.skills = false;
      });
      confirmMock.mockResolvedValue(false);
      const { runCli } = await import("../src/cli");

      await runCli(["setup", "backup", "--target", targetDir]);

      expect(confirmMock).toHaveBeenCalledTimes(1);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("uses --yes to skip backup confirmation prompts", async () => {
    const targetDir = createTempDir();

    try {
      setTTY(false);
      const { runCli } = await import("../src/cli");

      await runCli(["setup", "backup", "--yes", "--target", targetDir]);

      expect(confirmMock).not.toHaveBeenCalled();
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("routes setup remove through the implemented lifecycle flow", async () => {
    const targetDir = createTempDir();
    const cli = await import("../src/cli");

    try {
      cli.__setUninstallCommandLoaderForTests(async () => runUninstallCommandMock);

      await cli.runCli([
        "setup",
        "remove",
        "--backup",
        "--yes",
        "--target",
        targetDir,
      ]);

      expect(runUninstallCommandMock).toHaveBeenCalledTimes(1);
      expect(runUninstallCommandMock).toHaveBeenCalledWith({
        targetDir: path.resolve(targetDir),
        backup: true,
        permissions: "allow-all",
      });
    } finally {
      cli.__setUninstallCommandLoaderForTests(null);
      cleanupTempDir(targetDir);
    }
  });

  test("defaults setup remove to confirmation mode", async () => {
    const targetDir = createTempDir();
    const cli = await import("../src/cli");

    try {
      cli.__setUninstallCommandLoaderForTests(async () => runUninstallCommandMock);

      await cli.runCli(["setup", "remove", "--target", targetDir]);

      expect(runUninstallCommandMock).toHaveBeenCalledTimes(1);
      expect(runUninstallCommandMock).toHaveBeenCalledWith({
        targetDir: path.resolve(targetDir),
        backup: false,
        permissions: "confirm",
      });
    } finally {
      cli.__setUninstallCommandLoaderForTests(null);
      cleanupTempDir(targetDir);
    }
  });

  test("uses --yes to skip setup remove confirmation prompts", async () => {
    const targetDir = createTempDir();
    const cli = await import("../src/cli");

    try {
      cli.__setUninstallCommandLoaderForTests(async () => runUninstallCommandMock);

      await cli.runCli(["setup", "remove", "--yes", "--target", targetDir]);

      expect(runUninstallCommandMock).toHaveBeenCalledTimes(1);
      expect(runUninstallCommandMock).toHaveBeenCalledWith({
        targetDir: path.resolve(targetDir),
        backup: false,
        permissions: "allow-all",
      });
    } finally {
      cli.__setUninstallCommandLoaderForTests(null);
      cleanupTempDir(targetDir);
    }
  });

  test.each([
    [["setup", "backup", "--no-skills"], ["make-docs setup backup", "--no-skills"]],
    [
      ["setup", "remove", "--selected-skills", "decompose-codebase"],
      ["make-docs setup remove", "--selected-skills"],
    ],
    [["--permissions", "confirm"], ["Unknown argument", "--permissions"]],
    [["--backup"], ["Bare `make-docs`", "make-docs setup --backup"]],
    [["setup", "reconfigure", "--backup"], ["make-docs setup reconfigure", "--backup"]],
  ])("rejects invalid cross-command flag mixes for %s", async (argv, messageParts) => {
    const targetDir = createTempDir();

    try {
      const error = await captureCliError([...argv, "--target", targetDir]);

      for (const part of messageParts) {
        expect(error.message).toContain(part);
      }
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("bare invocation with an install prints status and never syncs", async () => {
    const targetDir = createTempDir();

    try {
      await installManifest(targetDir, (selections) => {
        selections.skills = false;
      });
      const manifestPath = path.join(targetDir, ".make-docs/manifest.json");
      const manifestBefore = readFileSync(manifestPath, "utf8");
      const mtimeBefore = statSync(manifestPath).mtimeMs;
      const manifest = loadManifest(targetDir);

      const output = await captureCliOutput(["--target", targetDir]);

      expect(output).toContain(`make-docs install detected in ${path.resolve(targetDir)}`);
      expect(output).toContain(`Package: ${manifest?.packageName}@${manifest?.packageVersion}`);
      expect(output).toContain("Bare `make-docs` never syncs an existing install.");
      expect(output).toContain("Use `make-docs setup` to sync");
      expect(runSelectionWizardMock).not.toHaveBeenCalled();
      expect(confirmMock).not.toHaveBeenCalled();
      expect(readFileSync(manifestPath, "utf8")).toBe(manifestBefore);
      expect(statSync(manifestPath).mtimeMs).toBe(mtimeBefore);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("bare invocation without an install and no TTY prints guided-setup guidance and writes nothing", async () => {
    const targetDir = createTempDir();

    try {
      setTTY(false);

      const output = await captureCliOutput(["--target", targetDir]);

      expect(output).toContain(`No make-docs install was detected in ${path.resolve(targetDir)}`);
      expect(output).toContain(
        "Bare `make-docs` starts a guided setup only in an interactive terminal.",
      );
      expect(output).toContain(
        "Run `make-docs setup` (interactive) or `make-docs setup --yes` (non-interactive) to install.",
      );
      expect(runSelectionWizardMock).not.toHaveBeenCalled();
      expect(readdirSync(targetDir)).toEqual([]);
      expect(loadManifest(targetDir)).toBeNull();
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("bare invocation without an install and a TTY starts the guided setup without writing on cancel", async () => {
    const targetDir = createTempDir();

    try {
      runSelectionWizardMock.mockResolvedValue(null);

      const output = await captureCliOutput(["--target", targetDir]);

      expect(runSelectionWizardMock).toHaveBeenCalledWith(
        expect.objectContaining({
          introTitle: "Let's configure your make-docs install",
        }),
      );
      expect(output).toContain("Installer cancelled.");
      expect(readdirSync(targetDir)).toEqual([]);
      expect(loadManifest(targetDir)).toBeNull();
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test.each([
    [["--yes"], "--yes"],
    [["--dry-run"], "--dry-run"],
    [["--no-work"], "--no-work"],
  ])("bare invocation rejects install and sync flag %s and names make-docs setup", async (argv, flag) => {
    const error = await captureCliError(argv);

    expect(error.message).toContain("Bare `make-docs`");
    expect(error.message).toContain("accepts only `--target` and `--help`");
    expect(error.message).toContain(`make-docs setup ${flag}`);
  });

  test("top-level update reports without executing for remote execution and migrates the temp store", async () => {
    const storeRoot = createTempDir("make-docs-update-store-");
    const targetDir = createTempDir();
    const previousStoreHome = process.env.MAKE_DOCS_HOME;
    process.env.MAKE_DOCS_HOME = storeRoot;

    try {
      // The vitest process path matches no persistent install-manager
      // pattern, so update must degrade to reporting rather than executing a
      // package-manager command; the store bootstrap targets the temp root.
      const output = await captureCliOutput(["update", "--yes", "--target", targetDir]);

      expect(output.length).toBeGreaterThan(0);
      expect(runUninstallCommandMock).not.toHaveBeenCalled();
      expect(existsSync(path.join(storeRoot, "store.db"))).toBe(true);
    } finally {
      if (previousStoreHome === undefined) {
        delete process.env.MAKE_DOCS_HOME;
      } else {
        process.env.MAKE_DOCS_HOME = previousStoreHome;
      }
      cleanupTempDir(storeRoot);
      cleanupTempDir(targetDir);
    }
  });

  test("top-level uninstall refuses without confirmation and never runs project removal", async () => {
    const storeRoot = createTempDir("make-docs-uninstall-store-");
    const previousStoreHome = process.env.MAKE_DOCS_HOME;
    process.env.MAKE_DOCS_HOME = storeRoot;
    const cli = await import("../src/cli");
    setTTY(false);

    try {
      cli.__setUninstallCommandLoaderForTests(async () => runUninstallCommandMock);
      writeFileSync(path.join(storeRoot, "store.db"), "placeholder\n");

      const output = await captureCliOutput(["uninstall"]);

      // Non-TTY without --yes must refuse; the store survives and the
      // project-level removal path is never invoked (hard cutover, R-TOP-2).
      expect(existsSync(path.join(storeRoot, "store.db"))).toBe(true);
      expect(output).toContain("--yes");
      expect(runUninstallCommandMock).not.toHaveBeenCalled();
    } finally {
      cli.__setUninstallCommandLoaderForTests(null);
      if (previousStoreHome === undefined) {
        delete process.env.MAKE_DOCS_HOME;
      } else {
        process.env.MAKE_DOCS_HOME = previousStoreHome;
      }
      cleanupTempDir(storeRoot);
    }
  });

  test("top-level uninstall rejects --target as a project-removal confusion guard", async () => {
    const error = await captureCliError(["uninstall", "--target", "somewhere"]);

    expect(error.message).toContain("`--target` is not valid with `make-docs uninstall`");
  });

  test.each([["update"], ["uninstall"]])(
    "prints machine-level self-management help for %s without acting",
    async (command) => {
      setTTY(false);

      const output = await captureCliOutput([command, "--help"]);

      expect(output).toContain(`make-docs ${command}`);
      expect(output.replace(/\n/g, " ")).toContain("machine-level");
      expect(runUninstallCommandMock).not.toHaveBeenCalled();
    },
  );
});
