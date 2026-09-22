import { beforeEach, afterEach, describe, expect, test, vi } from "vitest";
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { applyInstallPlan, planInstall } from "../src/install";
import { loadMakeDocsConfig } from "../src/config";
import { CODEX_HARNESS_ADAPTER, fingerprintEntry, sha256, verifyMakeDocsExecutable } from "../src/harness-access";
import { loadGlobalConfig, writeGlobalConfig } from "../src/store/global-config";
import { CURRENT_STORE_SCHEMA_VERSION, STORE_MIGRATIONS } from "../src/store";
import { readPendingHarnessSystemOperation } from "../src/store/harness-system-operations";
import {
  preparePlannedFileChange,
  readInstallationStatus,
  recoverInstallationOperation,
  sealInstallationOperation,
  withInstallationOperation,
} from "../src/store/installation-state";
import {
  applySetupProjectRecovery,
  prepareSetupProjectRecoveryReview,
  SetupProjectRecoveryError,
  type SetupProjectRecoveryReview,
} from "../src/setup-project-recovery";
import { loadManifest } from "../src/manifest";
import { MigrationSafetyError } from "../src/migration";
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
const selectMock = vi.fn();
const runUninstallCommandMock = vi.fn();
const runSkillsCommandMock = vi.fn();
const ALL_SKILL_NAMES = [
  "archive-docs",
  "cleanup-docs",
  "decompose-codebase",
  "naive-uat",
];
const NONE_METHODS = ["--codex-method", "none", "--claude-code-method", "none"] as const;

function seedSchemaThreeStore(storeRoot: string): void {
  mkdirSync(storeRoot, { recursive: true });
  const db = new DatabaseSync(path.join(storeRoot, "store.db"));
  db.exec("PRAGMA foreign_keys=ON");
  for (const migration of STORE_MIGRATIONS.filter((candidate) => candidate.version <= 3)) {
    for (const statement of migration.statements) db.exec(statement);
    db.exec(`PRAGMA user_version=${migration.version}`);
  }
  db.close();
}

function seedSchemaThreeInstallationLedger(
  storeRoot: string,
  targetDir: string,
  manifest: NonNullable<ReturnType<typeof loadManifest>>,
): void {
  seedSchemaThreeStore(storeRoot);
  const targetRoot = realpathSync(targetDir);
  const targetStat = statSync(targetRoot);
  const createdAt = new Date().toISOString();
  const db = new DatabaseSync(path.join(storeRoot, "store.db"));
  db.prepare(
    `INSERT INTO installation_checkouts
      (checkout_id, project_id, root_path, root_device, root_inode, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(
    "checkout-schema-three-preview",
    manifest.projectId!,
    targetRoot,
    String(targetStat.dev),
    String(targetStat.ino),
    createdAt,
  );
  db.prepare(
    `INSERT INTO installation_ledgers (checkout_id, manifest_json, updated_at)
     VALUES (?, ?, ?)`,
  ).run(
    "checkout-schema-three-preview",
    JSON.stringify(manifest),
    createdAt,
  );
  db.close();
}

vi.mock("../src/wizard", () => ({
  runSelectionWizard: runSelectionWizardMock,
  promptForManagedFileConflictResolutions: promptForManagedFileConflictResolutionsMock,
}));

vi.mock("@clack/prompts", async () => {
  const actual = await vi.importActual<typeof import("@clack/prompts")>("@clack/prompts");

  return {
    ...actual,
    confirm: confirmMock,
    select: selectMock,
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

function withRequiredSetupMethods(argv: string[]): string[] {
  if (argv[0] !== "setup" || ["skills", "backup", "remove", "reconfigure"].includes(argv[1] ?? "")) return argv;
  if (!argv.includes("--yes") && !argv.includes("--dry-run") && !argv.includes("--json") && process.stdin.isTTY) return argv;
  const result = [...argv];
  if (!result.includes("--codex-method") && !result.includes("--no-codex") && !result.includes("--no-agents")) {
    result.push("--codex-method", "none");
  }
  if (!result.includes("--claude-code-method") && !result.includes("--no-claude-code") && !result.includes("--no-claude")) {
    result.push("--claude-code-method", "none");
  }
  return result;
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

function createPendingSetupOperation(
  targetDir: string,
  options: { planComplete: boolean; applyChange?: boolean },
): void {
  const relativePath = "recovery-note.md";
  writeFileSync(path.join(targetDir, relativePath), "before\n", "utf8");
  expect(() => withInstallationOperation(targetDir, "setup.migration", () => {
    const apply = preparePlannedFileChange(
      targetDir,
      relativePath,
      { kind: "file", content: "after\n" },
      () => writeFileSync(path.join(targetDir, relativePath), "after\n", "utf8"),
    );
    if (options.planComplete) sealInstallationOperation(targetDir);
    if (options.applyChange) apply();
    throw new Error("simulated interrupted setup");
  })).toThrow("simulated interrupted setup");
}

function writePausedLegacyReceipt(targetDir: string): void {
  const canonicalTargetDir = realpathSync(targetDir);
  const receiptsDir = path.join(targetDir, ".make-docs/state/migration-receipts");
  const backupFilesDir = path.join(targetDir, ".make-docs/backup/one/files");
  mkdirSync(receiptsDir, { recursive: true });
  mkdirSync(backupFilesDir, { recursive: true });
  const snapshotId = `sha256:${sha256("legacy-paused-snapshot")}`;
  const subject = {
    status: "paused",
    checkpoint: 11,
    snapshotId,
    lockTokenDigest: sha256("legacy-paused-lock"),
    createdAt: "2026-09-22T00:00:00Z",
    code: null,
    message: "paused for recovery",
    rollback: {
      attempted: false,
      completed: false,
      restoredPaths: [],
      unrestoredPaths: [],
    },
  };
  const stable = (value: unknown): unknown =>
    Array.isArray(value)
      ? value.map(stable)
      : value && typeof value === "object"
        ? Object.fromEntries(
            Object.entries(value)
              .sort(([left], [right]) => left.localeCompare(right))
              .map(([key, entry]) => [key, stable(entry)]),
          )
        : value;
  const receiptId = `sha256:${sha256(JSON.stringify(stable(subject)))}`;
  writeFileSync(
    path.join(receiptsDir, `${receiptId.slice(7)}.json`),
    JSON.stringify({
      schemaVersion: 1,
      receiptId,
      ...subject,
      claims: {
        validated: false,
        accepted: false,
        downstreamAuthorized: false,
        released: false,
      },
    }),
    "utf8",
  );
  writeFileSync(path.join(targetDir, "doc.md"), "current knowledge", "utf8");
  writeFileSync(path.join(backupFilesDir, "doc.md"), "prior knowledge", "utf8");
  writeFileSync(
    path.join(targetDir, ".make-docs/backup/one/backup-manifest.json"),
    JSON.stringify({
      schemaVersion: 1,
      backupId: "one",
      snapshotId,
      projectRoot: canonicalTargetDir,
      repository: { projectRootDigest: sha256(canonicalTargetDir) },
      entries: [
        {
          relativePath: "doc.md",
          backupPath: "files/doc.md",
          original: {
            relativePath: "doc.md",
            digest: sha256("prior knowledge"),
          },
          copied: true,
          verified: true,
        },
      ],
    }),
    "utf8",
  );
}

function getCompatibilityFixtureCase(id: string) {
  const fixtureCase = COMPATIBILITY_FIXTURE_CASES.find((entry) => entry.id === id);
  if (!fixtureCase) {
    throw new Error(`Missing compatibility fixture case: ${id}`);
  }

  return fixtureCase;
}

async function captureCliOutput(
  argv: string[],
  priorProjectRecovery: SetupProjectRecoveryReview | null = null,
  priorProjectMutationApplied = false,
): Promise<string> {
  const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

  try {
    const { runCli } = await import("../src/cli");

    await runCli(
      withRequiredSetupMethods(argv),
      priorProjectRecovery,
      priorProjectMutationApplied,
    );
    return writeSpy.mock.calls.map(([chunk]) => String(chunk)).join("");
  } finally {
    writeSpy.mockRestore();
  }
}

async function captureCliError(argv: string[]): Promise<Error> {
  const { runCli } = await import("../src/cli");

  try {
    await runCli(withRequiredSetupMethods(argv));
  } catch (error) {
    if (error instanceof Error) {
      return error;
    }

    throw error;
  }

  throw new Error(`Expected CLI invocation to fail: ${argv.join(" ")}`);
}

describe("cli interactive flows", () => {
  let isolatedSetupHome: string;
  let previousMakeDocsHome: string | undefined;

  beforeEach(() => {
    isolatedSetupHome = createTempDir("make-docs-cli-home-");
    previousMakeDocsHome = process.env.MAKE_DOCS_HOME;
    process.env.MAKE_DOCS_HOME = path.join(isolatedSetupHome, "store");
    vi.spyOn(os, "homedir").mockReturnValue(isolatedSetupHome);
    runSelectionWizardMock.mockReset();
    promptForManagedFileConflictResolutionsMock.mockReset();
    confirmMock.mockReset();
    confirmMock.mockResolvedValue(true);
    selectMock.mockReset();
    selectMock.mockResolvedValue("none");
    runUninstallCommandMock.mockReset();
    runSkillsCommandMock.mockReset();
    mockSkillFetches();
    setTTY(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    if (previousMakeDocsHome === undefined) {
      delete process.env.MAKE_DOCS_HOME;
    } else {
      process.env.MAKE_DOCS_HOME = previousMakeDocsHome;
    }
    cleanupTempDir(isolatedSetupHome);
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
        projectState: "fresh",
        harnessSupport: expect.any(Array),
        afterHarnessSelection: expect.any(Function),
        config: expect.objectContaining({
          labels: expect.any(Object),
          personas: expect.any(Array),
        }),
      });
      expect(promptForManagedFileConflictResolutionsMock).not.toHaveBeenCalled();
      expect(confirmMock).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ message: "Apply the reviewed This computer changes?" }),
      );
      expect(confirmMock).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ message: "Install make-docs with this plan?" }),
      );
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
        projectState: "partial",
        allowCapabilityExpansion: true,
        harnessSupport: expect.any(Array),
        afterHarnessSelection: expect.any(Function),
        lockSkills: true,
        config: expect.objectContaining({
          labels: expect.any(Object),
          personas: expect.any(Array),
        }),
      });
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("reviews and preserves saved partial selections on interactive setup", async () => {
    const targetDir = createTempDir();
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    try {
      await installManifest(targetDir, (selections) => {
        selections.capabilities.work = false;
        selections.skills = false;
      });
      const saved = loadManifest(targetDir)!.selections;
      runSelectionWizardMock.mockResolvedValue(saved);
      const { runCli } = await import("../src/cli");

      await runCli(["setup", "--target", targetDir]);

      const output = writeSpy.mock.calls.map(([chunk]) => String(chunk)).join("");
      expect(runSelectionWizardMock).toHaveBeenCalledWith(expect.objectContaining({
        projectState: "partial",
        allowCapabilityExpansion: false,
      }));
      expect(confirmMock).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Apply the reviewed This computer changes?" }),
      );
      expect(output).toContain("This project");
      expect(output).toContain("Mode: existing install sync");
      expect(output).toContain("Installation record:");
      expect(output).toContain("global Make Docs Store");
      expect(output).toContain("found or verified for");
      expect(output).toContain("Selection source: interactive state review");
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

      await runCli(["setup", "--yes", ...NONE_METHODS, "--target", targetDir]);

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
        `harnessIntegrations: {}
`,
        "utf8",
      );
      setTTY(false);

      const error = await captureCliError(["setup", "--yes", "--target", targetDir]);

      expect(error.message).toContain("Invalid make-docs config");
      expect(error.message).toContain(".make-docs/config.yaml");
      expect(error.message).toContain("harnessIntegrations");
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

      expect(JSON.parse(output)).toMatchObject({
        schemaVersion: 2,
        operation: "setup",
        status: "complete",
      });
      expect(readFileSync(path.join(targetDir, "README.md"), "utf8")).toBe(
        "# Existing project\n",
      );
      expect(loadManifest(targetDir)?.schemaVersion).toBe(4);
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

      expect(error.message).toContain("Legacy installation state requires review");
      expect(error.message).toContain("Legacy manifest");
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

      await runCli(["setup", "--yes", ...NONE_METHODS, "--target", targetDir]);

      expect(runSelectionWizardMock).not.toHaveBeenCalled();
      expect(confirmMock).not.toHaveBeenCalled();
      expect(loadManifest(targetDir)?.selections.capabilities.work).toBe(false);
      expect(loadManifest(targetDir)?.selections.skills).toBe(false);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("rejects document-type flags on a fresh non-interactive setup", async () => {
    const targetDir = createTempDir();

    try {
      const error = await captureCliError([
        "setup",
        "--yes",
        "--no-work",
        "--target",
        targetDir,
      ]);

      expect(runSelectionWizardMock).not.toHaveBeenCalled();
      expect(promptForManagedFileConflictResolutionsMock).not.toHaveBeenCalled();
      expect(error.message).toContain(
        "Fresh setup always installs Designs, Plans, PRD, and Work",
      );
      expect(loadManifest(targetDir)).toBeNull();
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("routes an existing-install skill enabled-state change and continues other setup", async () => {
    const targetDir = createTempDir();

    try {
      await installManifest(targetDir, enableAllSkills);
      const claudeSkillPath = path.join(targetDir, ".claude/skills/archive-docs/SKILL.md");
      const codexSkillPath = path.join(targetDir, ".agents/skills/archive-docs/SKILL.md");
      const manifestBefore = loadManifest(targetDir)!;
      const skillSelectionBefore = {
        skills: manifestBefore.selections.skills,
        skillScope: manifestBefore.selections.skillScope,
        selectedSkills: manifestBefore.selections.selectedSkills,
        skillSelectionProvenance: manifestBefore.selections.skillSelectionProvenance,
      };
      const claudeSkillBefore = readFileSync(claudeSkillPath);
      const codexSkillBefore = readFileSync(codexSkillPath);
      confirmMock.mockResolvedValue(true);

      const output = await captureCliOutput(["setup", "--yes", ...NONE_METHODS, "--no-skills", "--target", targetDir]);

      expect(output).toContain("Existing installs cannot change skill selections");
      expect(output).toContain("Use `make-docs setup skills`");
      expect(runSelectionWizardMock).not.toHaveBeenCalled();
      expect(promptForManagedFileConflictResolutionsMock).not.toHaveBeenCalled();
      expect(confirmMock).not.toHaveBeenCalled();
      const manifestAfter = loadManifest(targetDir)!;
      expect(manifestAfter.selections.skills).toBe(skillSelectionBefore.skills);
      expect(manifestAfter.selections.skillScope).toBe(skillSelectionBefore.skillScope);
      expect(manifestAfter.selections.selectedSkills).toEqual(skillSelectionBefore.selectedSkills);
      expect(manifestAfter.selections.skillSelectionProvenance).toEqual(skillSelectionBefore.skillSelectionProvenance);
      expect(readFileSync(claudeSkillPath)).toEqual(claudeSkillBefore);
      expect(readFileSync(codexSkillPath)).toEqual(codexSkillBefore);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("routes existing-install skill source and provenance changes without changing Skills", async () => {
    const targetDir = createTempDir();
    const firstSource = createLocalSkillManifestFixture();
    const secondSource = createLocalSkillManifestFixture();

    try {
      const { runCli } = await import("../src/cli");
      await runCli([
        "setup",
        "--yes",
        ...NONE_METHODS,
        "--skill-manifest",
        firstSource.manifestPath,
        "--selected-skills",
        "acme-release",
        "--target",
        targetDir,
      ]);
      const sharedSkillPath = path.join(
        targetDir,
        ".agents/skills/acme-release/SKILL.md",
      );
      const codexSkillPath = path.join(targetDir, ".agents/skills/acme-release/SKILL.md");
      const manifestBefore = loadManifest(targetDir)!;
      const skillSelectionBefore = {
        skills: manifestBefore.selections.skills,
        skillScope: manifestBefore.selections.skillScope,
        selectedSkills: manifestBefore.selections.selectedSkills,
        skillSelectionProvenance: manifestBefore.selections.skillSelectionProvenance,
      };
      const sharedSkillBefore = readFileSync(sharedSkillPath);
      const codexSkillBefore = readFileSync(codexSkillPath);

      const sourceOutput = await captureCliOutput([
        "setup",
        "--yes",
        "--skill-manifest",
        secondSource.manifestPath,
        "--selected-skills",
        "acme-release",
        "--target",
        targetDir,
      ]);
      expect(sourceOutput).toContain("Use `make-docs setup skills`");
      expect(loadManifest(targetDir)?.selections).toMatchObject(skillSelectionBefore);
      expect(readFileSync(sharedSkillPath)).toEqual(sharedSkillBefore);
      expect(readFileSync(codexSkillPath)).toEqual(codexSkillBefore);

      const changedProvenanceManifest = JSON.parse(
        readFileSync(firstSource.manifestPath, "utf8"),
      );
      changedProvenanceManifest.skills[0].provenance.label = "Changed local provenance";
      writeFileSync(
        firstSource.manifestPath,
        `${JSON.stringify(changedProvenanceManifest, null, 2)}\n`,
        "utf8",
      );
      const provenanceOutput = await captureCliOutput([
        "setup",
        "--yes",
        "--skill-manifest",
        firstSource.manifestPath,
        "--selected-skills",
        "acme-release",
        "--target",
        targetDir,
      ]);
      expect(provenanceOutput).toContain("Use `make-docs setup skills`");
      expect(loadManifest(targetDir)?.selections).toMatchObject(skillSelectionBefore);
      expect(readFileSync(sharedSkillPath)).toEqual(sharedSkillBefore);
      expect(readFileSync(codexSkillPath)).toEqual(codexSkillBefore);
    } finally {
      cleanupTempDir(targetDir);
      cleanupTempDir(firstSource.rootDir);
      cleanupTempDir(secondSource.rootDir);
    }
  });

  test("transfers a legacy manifest to Store before unchanged setup", async () => {
    const targetDir = createTempDir();
    const oldRoot = createTempDir();
    try {
      await installManifest(oldRoot);
      cpSync(oldRoot, targetDir, { recursive: true });
      const legacy = loadManifest(oldRoot)!;
      delete legacy.projectId;
      writeFileSync(path.join(targetDir, ".make-docs/manifest.json"), `${JSON.stringify(legacy, null, 2)}\n`, "utf8");
      const configPath = path.join(targetDir, ".make-docs/config.yaml");
      writeFileSync(configPath, readFileSync(configPath, "utf8").replace(/^projectId:.*\n/m, ""));
      const { runCli } = await import("../src/cli");
      await runCli(["setup", "--yes", ...NONE_METHODS, "--target", targetDir]);
      expect(loadManifest(targetDir)?.projectId).toMatch(/^[0-9a-f-]{36}$/);
      expect(existsSync(path.join(targetDir, ".make-docs/manifest.json"))).toBe(false);
      expect(existsSync(path.join(targetDir, ".make-docs/state"))).toBe(false);
      expect(readFileSync(path.join(targetDir, "AGENTS.md"), "utf8")).toBe(readFileSync(path.join(oldRoot, "AGENTS.md"), "utf8"));
    } finally {
      cleanupTempDir(targetDir);
      cleanupTempDir(oldRoot);
    }
  });

  test("shows and reapproves the current project plan after legacy transfer", async () => {
    const targetDir = createTempDir("make-docs-legacy-reapproval-");
    const oldRoot = createTempDir("make-docs-legacy-reapproval-source-");
    try {
      await installManifest(oldRoot);
      cpSync(oldRoot, targetDir, { recursive: true });
      const legacy = loadManifest(oldRoot)!;
      delete legacy.projectId;
      writeFileSync(
        path.join(targetDir, ".make-docs/manifest.json"),
        `${JSON.stringify(legacy, null, 2)}\n`,
        "utf8",
      );
      const configPath = path.join(targetDir, ".make-docs/config.yaml");
      writeFileSync(
        configPath,
        readFileSync(configPath, "utf8").replace(/^projectId:.*\n/m, ""),
        "utf8",
      );
      selectMock.mockResolvedValue("backup-and-install");
      runSelectionWizardMock.mockResolvedValue(defaultSelections());

      const output = await captureCliOutput([
        "setup",
        ...NONE_METHODS,
        "--target",
        targetDir,
      ]);

      const confirmationMessages = confirmMock.mock.calls.map(
        ([options]) => String(options.message),
      );
      const projectConfirmations = confirmationMessages.filter(
        (message) => message !== "Apply the reviewed This computer changes?",
      );
      expect(projectConfirmations.length).toBeGreaterThanOrEqual(2);
      expect(output).toContain(
        "The legacy installation transfer changed the project review. Review the current project plan.",
      );
      expect(output.indexOf("This project")).toBeLessThan(
        output.indexOf("The legacy installation transfer changed the project review"),
      );
      expect(readInstallationStatus(targetDir).status).toBe("ready");
    } finally {
      cleanupTempDir(targetDir);
      cleanupTempDir(oldRoot);
    }
  });

  test("routes an imported pending legacy operation through plain setup review", async () => {
    setTTY(false);
    const targetDir = createTempDir("make-docs-legacy-pending-review-");
    try {
      writePausedLegacyReceipt(targetDir);

      const output = await captureCliOutput([
        "setup",
        "--yes",
        "--json",
        ...NONE_METHODS,
        "--target",
        targetDir,
      ]);
      const result = JSON.parse(output);

      expect(result).toMatchObject({
        status: "blocked",
        projectRecovery: {
          status: "blocked",
          operation: "legacy.recovery",
          selectedMode: null,
        },
        project: { changed: true, mutationState: "applied" },
      });
      expect(result.nextAction).toBe(
        "Preserve the project and review the listed conflicts. Setup cannot safely continue yet.",
      );
      expect(output).not.toContain("project state status");
      expect(readInstallationStatus(targetDir).status).toBe("recovery-required");
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("completes a reviewed overwrite without leaving migration recovery state", async () => {
    const targetDir = createTempDir();

    try {
      writeConflictingRootInstruction(targetDir);
      const agentsPath = path.join(targetDir, "AGENTS.md");
      runSelectionWizardMock.mockResolvedValue(defaultSelections());
      promptForManagedFileConflictResolutionsMock.mockResolvedValue({
        "AGENTS.md": "overwrite",
      });

      await captureCliOutput(["setup", "--target", targetDir]);

      expect(runSelectionWizardMock).toHaveBeenCalledOnce();
      expect(promptForManagedFileConflictResolutionsMock).toHaveBeenCalledOnce();
      expect(readFileSync(agentsPath, "utf8")).not.toContain("Locally edited make-docs routing");
      expect(loadManifest(targetDir)).not.toBeNull();
      expect(readInstallationStatus(targetDir)).toMatchObject({
        status: "ready",
        pendingOperation: null,
      });
      expect(existsSync(path.join(targetDir, ".make-docs/manifest.json"))).toBe(false);
      expect(existsSync(path.join(targetDir, ".make-docs/state"))).toBe(false);
      expect(listConflictFiles(targetDir)).toEqual([]);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("plain setup restores an incomplete project operation before it replans", async () => {
    const targetDir = createTempDir("make-docs-setup-restore-");
    try {
      await installManifest(targetDir);
      createPendingSetupOperation(targetDir, { planComplete: false });
      selectMock.mockResolvedValueOnce("restore");

      const output = await captureCliOutput([
        "setup",
        ...NONE_METHODS,
        "--target",
        targetDir,
      ]);

      expect(output).toContain("Setup found unfinished project work.");
      expect(output).toContain("Saved plan: incomplete.");
      expect(output).toContain("Recommended: Restore the prior project state.");
      expect(output).not.toContain("project state recover");
      expect(selectMock).toHaveBeenCalledWith(expect.objectContaining({
        options: expect.arrayContaining([
          expect.objectContaining({ value: "resume", disabled: true }),
          expect.objectContaining({ value: "restore", disabled: false }),
        ]),
      }));
      expect(readFileSync(path.join(targetDir, "recovery-note.md"), "utf8")).toBe("before\n");
      expect(readInstallationStatus(targetDir)).toMatchObject({
        status: "ready",
        pendingOperation: null,
      });
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("plain setup resumes a complete project operation before it replans", async () => {
    const targetDir = createTempDir("make-docs-setup-resume-");
    try {
      await installManifest(targetDir);
      createPendingSetupOperation(targetDir, { planComplete: true, applyChange: true });
      selectMock.mockResolvedValueOnce("resume");

      const output = await captureCliOutput([
        "setup",
        ...NONE_METHODS,
        "--target",
        targetDir,
      ]);

      expect(output).toContain("Saved plan: complete.");
      expect(output).toContain("Recommended: Resume reviewed work.");
      expect(output).toContain("Setup resumed and completed the unfinished project work.");
      expect(output).not.toContain("project state recover");
      expect(readFileSync(path.join(targetDir, "recovery-note.md"), "utf8")).toBe("after\n");
      expect(readInstallationStatus(targetDir)).toMatchObject({
        status: "ready",
        pendingOperation: null,
      });
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("plain setup cancel keeps unfinished project work unchanged", async () => {
    const targetDir = createTempDir("make-docs-setup-recovery-cancel-");
    try {
      await installManifest(targetDir);
      createPendingSetupOperation(targetDir, { planComplete: true, applyChange: true });
      const before = readFileSync(path.join(targetDir, "recovery-note.md"));
      selectMock.mockResolvedValueOnce("cancelled");

      const output = await captureCliOutput([
        "setup",
        ...NONE_METHODS,
        "--target",
        targetDir,
      ]);

      expect(output).toContain("Setup cancelled. The unfinished project work was not changed.");
      expect(readFileSync(path.join(targetDir, "recovery-note.md"))).toEqual(before);
      expect(readInstallationStatus(targetDir).status).toBe("recovery-required");
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("reports no mutation when a reviewed recovery becomes stale before apply", async () => {
    const targetDir = createTempDir("make-docs-setup-recovery-stale-");
    try {
      await installManifest(targetDir);
      createPendingSetupOperation(targetDir, { planComplete: true, applyChange: true });
      const review = prepareSetupProjectRecoveryReview(targetDir);
      expect(review).not.toBeNull();
      recoverInstallationOperation(
        targetDir,
        review!.operationId,
        "rollback",
        false,
      );

      try {
        applySetupProjectRecovery(review!, "resume");
        throw new Error("Expected stale recovery review to fail.");
      } catch (error) {
        expect(error).toBeInstanceOf(SetupProjectRecoveryError);
        expect((error as SetupProjectRecoveryError).mutationState).toBe("none");
      }
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("does not apply a second pending operation during one setup invocation", async () => {
    setTTY(false);
    const targetDir = createTempDir("make-docs-setup-recovery-bounded-");
    try {
      await installManifest(targetDir);
      createPendingSetupOperation(targetDir, { planComplete: true, applyChange: true });
      const before = readFileSync(path.join(targetDir, "recovery-note.md"));
      const pending = prepareSetupProjectRecoveryReview(targetDir)!;
      const priorRecovery = {
        ...pending,
        status: "rolled-back" as const,
        selectedMode: "restore" as const,
      };
      const { runCli } = await import("../src/cli");
      const output = await captureCliOutput([
        "setup",
        "--yes",
        "--json",
        "--recover",
        "resume",
        ...NONE_METHODS,
        "--target",
        targetDir,
      ], priorRecovery, true);

      expect(JSON.parse(output)).toMatchObject({
        status: "blocked",
        projectRecovery: {
          status: "blocked",
          operationId: pending.operationId,
          selectedMode: null,
        },
        project: { changed: true, mutationState: "applied" },
      });
      expect(output).toContain("No second recovery was applied");
      expect(readFileSync(path.join(targetDir, "recovery-note.md"))).toEqual(before);
      expect(readInstallationStatus(targetDir).status).toBe("recovery-required");
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("non-interactive setup needs an explicit recovery choice and emits the same review", async () => {
    setTTY(false);
    const targetDir = createTempDir("make-docs-setup-recovery-json-");
    try {
      await installManifest(targetDir);
      createPendingSetupOperation(targetDir, { planComplete: false });

      const blockedOutput = await captureCliOutput([
        "setup",
        "--yes",
        "--json",
        ...NONE_METHODS,
        "--target",
        targetDir,
      ]);
      expect(JSON.parse(blockedOutput)).toMatchObject({
        status: "blocked",
        projectRecovery: {
          status: "blocked",
          operation: "setup.migration",
          planComplete: false,
          recommendation: "restore",
          selectedMode: null,
          choices: expect.arrayContaining([
            expect.objectContaining({ mode: "resume", available: false }),
            expect.objectContaining({ mode: "restore", available: true }),
          ]),
        },
        project: { changed: false, mutationState: "none" },
      });
      expect(readInstallationStatus(targetDir).status).toBe("recovery-required");

      const completedOutput = await captureCliOutput([
        "setup",
        "--yes",
        "--json",
        "--recover",
        "restore",
        ...NONE_METHODS,
        "--target",
        targetDir,
      ]);
      expect(JSON.parse(completedOutput)).toMatchObject({
        status: "complete",
        projectRecovery: {
          status: "rolled-back",
          operation: "setup.migration",
          selectedMode: "restore",
        },
        project: {
          changed: true,
          mutationState: "applied",
        },
      });
      expect(readInstallationStatus(targetDir).status).toBe("ready");
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("uses the saved recovery action when no recovery choice is safe", async () => {
    setTTY(false);
    const targetDir = createTempDir("make-docs-setup-recovery-no-choice-");
    try {
      await installManifest(targetDir);
      createPendingSetupOperation(targetDir, { planComplete: true, applyChange: true });
      writeFileSync(path.join(targetDir, "recovery-note.md"), "outside change\n", "utf8");
      const review = prepareSetupProjectRecoveryReview(targetDir)!;
      expect(review.choices.every((choice) => !choice.available)).toBe(true);

      const result = JSON.parse(await captureCliOutput([
        "setup",
        "--yes",
        "--json",
        ...NONE_METHODS,
        "--target",
        targetDir,
      ]));

      expect(result).toMatchObject({
        status: "blocked",
        nextAction: review.nextAction,
        projectRecovery: {
          status: "blocked",
          nextAction: review.nextAction,
        },
      });
      expect(result.nextAction).not.toContain("interactive terminal");
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
        ".make-docs/system/contracts/guide-contract.md",
        "custom guide contract\n",
      );
      writeCustomManagedFile(
        targetDir,
        ".make-docs/system/templates/guide-user.md",
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
        readFileSync(path.join(targetDir, ".make-docs/system/contracts/guide-contract.md"), "utf8"),
      ).toBe("custom guide contract\n");
      expect(
        readFileSync(path.join(targetDir, ".make-docs/system/templates/guide-user.md"), "utf8"),
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
        ".make-docs/system/contracts/guide-contract.md",
        "custom guide contract\n",
      );
      writeCustomManagedFile(
        targetDir,
        ".make-docs/system/templates/guide-user.md",
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
        readFileSync(path.join(targetDir, ".make-docs/system/contracts/guide-contract.md"), "utf8"),
      ).toBe("custom guide contract\n");
      expect(
        readFileSync(path.join(targetDir, ".make-docs/system/templates/guide-user.md"), "utf8"),
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
      rmSync(path.join(targetDir, ".make-docs/system/templates/guide-maintainer.md"));
      writeConflictingRootInstruction(targetDir);
      writeCustomManagedFile(
        targetDir,
        ".make-docs/system/contracts/guide-contract.md",
        "custom guide contract\n",
      );
      promptForManagedFileConflictResolutionsMock.mockResolvedValue({
        "AGENTS.md": "skip",
        ".make-docs/system/contracts/guide-contract.md": "overwrite",
      });
      const reviewedSelections = defaultSelections();
      reviewedSelections.capabilities.work = false;
      runSelectionWizardMock.mockResolvedValue(reviewedSelections);
      confirmMock.mockResolvedValue(false);

      const output = await captureCliOutput([
        "setup",
        "--target",
        targetDir,
      ]);
      const plannedLines = output
        .replace(/\u001b\[[0-9;]*m/g, "")
        .split("\n")
        .map((line) => line.replace(/[│║]/g, "").trim())
        .filter((line) => /^- (generate|update|skip|remove): /.test(line));

      expect(output).toContain("Planned file operations");
      expect(plannedLines).toContain("- generate: .make-docs/system/templates/guide-maintainer.md");
      expect(plannedLines).toContain("- update: .make-docs/system/contracts/guide-contract.md");
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
        "--claude-code-method",
        "none",
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

      await runCli([
        "setup",
        "--yes",
        flag,
        ...(flag === "--no-codex" ? ["--claude-code-method", "none"] : ["--codex-method", "none"]),
        "--target",
        targetDir,
      ]);

      expect(loadManifest(targetDir)?.selections.harnesses).toEqual(expectedHarnesses);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("supports --no-skills for non-interactive apply", async () => {
    const targetDir = createTempDir();

    try {
      const { runCli } = await import("../src/cli");

      await runCli(["setup", "--yes", ...NONE_METHODS, "--no-skills", "--target", targetDir]);

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

      await runCli(["setup", "--yes", ...NONE_METHODS, "--selected-skills", "none", "--target", targetDir]);

      let manifest = loadManifest(targetDir);
      expect(manifest?.selections.selectedSkills).toEqual([]);
      expect(manifest?.skillFiles).toEqual([]);

      await runCli([
        "setup",
        "--selected-skills",
        "all",
        "--yes",
        ...NONE_METHODS,
        "--target",
        allTargetDir,
      ]);

      manifest = loadManifest(allTargetDir);
      expect(manifest?.selections.selectedSkills).toEqual([
        "archive-docs",
        "backlog-review",
        "cleanup-docs",
        "decompose-codebase",
        "factory",
        "human-experience",
        "naive-uat",
        "preflight",
      ]);
      expect(manifest?.skillFiles).toContain(".claude/skills/archive-docs");
      expect(manifest?.skillFiles).toContain(".claude/skills/backlog-review");
      expect(manifest?.skillFiles).toContain(".claude/skills/cleanup-docs");
      expect(manifest?.skillFiles).toContain(".claude/skills/decompose-codebase");
      expect(manifest?.skillFiles).toContain(".claude/skills/human-experience");
      expect(manifest?.skillFiles).toContain(".claude/skills/naive-uat");
      expect(manifest?.skillFiles).toContain(".claude/skills/preflight");
      expect(manifest?.skillFiles).toContain(".claude/skills/factory");
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
        ...NONE_METHODS,
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
      expect(manifest?.skillFiles).toContain(".agents/skills/acme-release/SKILL.md");
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

        await runCli(["setup", "--yes", ...NONE_METHODS, "--skill-scope", skillScope, "--target", targetDir]);

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
      expect(output).toContain("Skill files:");
      expect(output).toContain(".agents/skills/archive-docs/SKILL.md");
      expect(output).toContain(
        "native harness exposure: .claude/skills/archive-docs",
      );
      expect(output).not.toContain("native harness exposure: .agents/skills/archive-docs");
      expect(output).not.toContain(".make-docs/agentics");
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

      await runCli([
        "setup",
        "--yes",
        flag,
        ...(flag === "--no-agents" ? ["--claude-code-method", "none"] : ["--codex-method", "none"]),
        "--target",
        targetDir,
      ]);

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

  test("routes a reconfigure skill enabled-state change and keeps saved Skills", async () => {
    const targetDir = createTempDir();
    const fakeHome = createTempDir("make-docs-home-");
    const restoreHome = mockHomeDirectory(fakeHome);

    try {
      await installManifest(targetDir, (selections) => {
        selections.skills = true;
        selections.skillScope = "global";
        selections.selectedSkills = ["decompose-codebase"];
      });
      const skillPath = path.join(fakeHome, ".agents/skills/decompose-codebase/SKILL.md");
      const manifestBefore = loadManifest(targetDir)!;
      const skillSelectionBefore = {
        skills: manifestBefore.selections.skills,
        skillScope: manifestBefore.selections.skillScope,
        selectedSkills: manifestBefore.selections.selectedSkills,
        skillSelectionProvenance: manifestBefore.selections.skillSelectionProvenance,
      };
      const skillBefore = readFileSync(skillPath);

      const output = await captureCliOutput([
        "setup",
        "reconfigure",
        "--yes",
        ...NONE_METHODS,
        "--no-skills",
        "--target",
        targetDir,
      ]);

      expect(output).toContain("Use `make-docs setup skills`");
      const manifestAfter = loadManifest(targetDir)!;
      expect(manifestAfter.selections.skills).toBe(skillSelectionBefore.skills);
      expect(manifestAfter.selections.skillScope).toBe(skillSelectionBefore.skillScope);
      expect(manifestAfter.selections.selectedSkills).toEqual(skillSelectionBefore.selectedSkills);
      expect(manifestAfter.selections.skillSelectionProvenance).toEqual(skillSelectionBefore.skillSelectionProvenance);
      expect(readFileSync(skillPath)).toEqual(skillBefore);
    } finally {
      restoreHome();
      cleanupTempDir(targetDir);
      cleanupTempDir(fakeHome);
    }
  });

  test("routes reconfigure skill scope and selected-name changes without changing Skills", async () => {
    for (const skillChangeArgs of [
      ["--skill-scope", "project"],
      ["--selected-skills", "none"],
    ]) {
      const targetDir = createTempDir();
      const fakeHome = createTempDir("make-docs-home-");
      const restoreHome = mockHomeDirectory(fakeHome);

      try {
        await installManifest(targetDir, (selections) => {
          selections.skills = true;
          selections.skillScope = "global";
          selections.selectedSkills = ["decompose-codebase"];
        });
        const skillPath = path.join(
          fakeHome,
          ".agents/skills/decompose-codebase/SKILL.md",
        );
        const manifestBefore = loadManifest(targetDir)!;
        const skillSelectionBefore = {
          skills: manifestBefore.selections.skills,
          skillScope: manifestBefore.selections.skillScope,
          selectedSkills: manifestBefore.selections.selectedSkills,
          skillSelectionProvenance: manifestBefore.selections.skillSelectionProvenance,
        };
        const skillBefore = readFileSync(skillPath);

        const output = await captureCliOutput([
          "setup",
          "reconfigure",
          "--yes",
          ...NONE_METHODS,
          ...skillChangeArgs,
          "--target",
          targetDir,
        ]);

        expect(output).toContain("Use `make-docs setup skills`");
        const manifestAfter = loadManifest(targetDir)!;
        expect(manifestAfter.selections.skills).toBe(skillSelectionBefore.skills);
        expect(manifestAfter.selections.skillScope).toBe(skillSelectionBefore.skillScope);
        expect(manifestAfter.selections.selectedSkills).toEqual(skillSelectionBefore.selectedSkills);
        expect(manifestAfter.selections.skillSelectionProvenance).toEqual(skillSelectionBefore.skillSelectionProvenance);
        expect(readFileSync(skillPath)).toEqual(skillBefore);
      } finally {
        restoreHome();
        cleanupTempDir(targetDir);
        cleanupTempDir(fakeHome);
      }
    }
  }, 15000);

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
        "Unknown selected skill `unknown-skill`. Valid skills: archive-docs, backlog-review, cleanup-docs, decompose-codebase, factory, human-experience, naive-uat, preflight.",
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

  test("`--version` prints the package version and exits", async () => {
    const { readPackageMeta } = await import("../src/utils");
    expect((await captureCliOutput(["--version"])).trim()).toBe(readPackageMeta().version);
  });

  test("`-v` is an alias for `--version`", async () => {
    const { readPackageMeta } = await import("../src/utils");
    expect((await captureCliOutput(["-v"])).trim()).toBe(readPackageMeta().version);
  });

  test("prints structured top-level help with exactly the seven public commands", async () => {
    setTTY(true);

    const output = await captureCliOutput(["--help"]);

    expect(output).toMatch(/make-docs/i);
    expect(output).toMatch(/\bCommands\b/i);
    expect(output).toMatch(/\bExamples\b/i);
    expect(output).toContain("make-docs setup [system|reconfigure|skills|backup|remove] [options]");
    expect(output).toContain("make-docs project surface ensure <archive|artifacts|assets>");
    expect(output).toContain("make-docs resource <list|read|ensure> [options]");
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
    expect(commandNames).toEqual([
      "setup",
      "project",
      "resource",
      "run",
      "mcp",
      "update",
      "uninstall",
    ]);

    expect(output).toContain(
      "setup        Install or sync this project; subcommands system, reconfigure, skills, backup, remove.",
    );
    expect(output).toContain("project      Manage canonical project support surfaces.");
    expect(output).toContain("resource     List, read, or ensure stable system resources.");
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

  test.each([["--help"], ["setup", "system", "--help"], ["setup", "reconfigure", "--help"], ["setup", "skills", "--help"]])(
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
    expect(output).toContain("Requires a verified installation record in the global Make Docs Store");
    expect(output).toContain("Interactive runs open the selection wizard");
    expect(output).toContain("Non-interactive runs with --yes must include at least one selection flag");
    expect(output).toContain("--yes                          Approve a fully specified non-interactive plan.");
    expect(output).toContain("make-docs setup reconfigure --yes --no-work");
    expect(output).toContain("Use `make-docs setup skills` to change skill selections.");
    expect(output).not.toContain("--selected-skills <csv|all|none>");
    expect(output).not.toContain("--skill-scope project|global");
    expect(output).not.toContain("--no-skills");
    expect(output).not.toContain("--optional-skills");
    expect(output).not.toContain("--no-prompts");
    expect(output).not.toContain("--templates required|all");
    expect(output).not.toContain("--references required|all");
    expect(output).not.toContain("make-docs init");
    expect(output).not.toContain("make-docs update");
    expect(output).not.toContain("--reconfigure");
  });

  test("routes setup system without entering project or Skill setup", async () => {
    setTTY(false);

    const output = await captureCliOutput(["setup", "system", "--dry-run"]);

    expect(JSON.parse(output)).toMatchObject({
      schemaVersion: 2,
      scope: "machine",
      selections: { codex: "none", "claude-code": "none" },
    });
    expect(runSelectionWizardMock).not.toHaveBeenCalled();
    expect(runSkillsCommandMock).not.toHaveBeenCalled();
  });

  test("passes the parsed target to direct setup system", async () => {
    setTTY(false);
    const targetDir = createTempDir("make-docs-system-target-");
    try {
      const setupSystem = await import("../src/setup-system");
      const runSystem = vi.spyOn(setupSystem, "runSystemSetupCommand").mockResolvedValue({
        schemaVersion: 2,
        status: "skipped-none",
        scope: "machine",
        selections: { codex: "none", "claude-code": "none" },
        configured: [],
        skipped: ["codex", "claude-code"],
        blocked: [],
        attemptedWork: [],
        mutationState: "none",
        failedCondition: null,
        nextAction: null,
        recoveryAction: null,
      });
      const { runCli } = await import("../src/cli");

      await runCli(["setup", "system", "--dry-run", "--target", targetDir]);

      expect(runSystem).toHaveBeenCalledWith(expect.objectContaining({
        targetRoot: path.resolve(targetDir),
      }));
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("reviews a global-intent-only change and does not write it without approval", async () => {
    setTTY(true);
    const targetDir = createTempDir("make-docs-system-intent-review-");
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    confirmMock.mockResolvedValue(false);
    try {
      const { runCli } = await import("../src/cli");

      await runCli(["setup", "system", "--target", targetDir, "--no-claude-code"]);

      const configPath = path.join(isolatedSetupHome, "store", "config.json");
      expect(confirmMock).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Apply the reviewed This computer changes?" }),
      );
      const review = writeSpy.mock.calls.map(([chunk]) => String(chunk)).join("");
      expect(review).toContain("Global intent file:");
      expect(review).toContain("config.json");
      expect(existsSync(configPath)).toBe(false);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("keeps excluded Claude Code machine intent unchanged", async () => {
    setTTY(false);
    const targetDir = createTempDir("make-docs-system-excluded-");
    const storeRoot = path.join(isolatedSetupHome, "store");
    const global = loadGlobalConfig(storeRoot).config;
    global.settings.harnesses["claude-code"] = {
      selected: true,
      maximumMethod: "permission-rules",
      accessCeiling: { store: "read", project: "read", hostConfig: "none" },
    };
    writeGlobalConfig(storeRoot, global);
    try {
      const { runCli } = await import("../src/cli");

      await runCli([
        "setup",
        "system",
        "--yes",
        "--codex-method",
        "none",
        "--target",
        targetDir,
        "--no-claude-code",
      ]);

      expect(loadGlobalConfig(storeRoot).config.settings.harnesses["claude-code"])
        .toEqual(global.settings.harnesses["claude-code"]);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("shows the grouped final review before system and project writes", async () => {
    setTTY(true);
    const targetDir = createTempDir("make-docs-grouped-review-");
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    try {
      const setupSystem = await import("../src/setup-system");
      const applySystem = vi.spyOn(setupSystem, "applyPreparedSystemSetup").mockImplementation(async () => {
        const review = writeSpy.mock.calls.map(([chunk]) => String(chunk)).join("");
        expect(review).toContain("This computer");
        expect(review).toContain("This project");
        expect(loadManifest(targetDir)).toBeNull();
        return {
          schemaVersion: 2,
          status: "unchanged",
          scope: "machine",
          selections: { codex: "none", "claude-code": "none" },
          configured: [],
          skipped: ["codex", "claude-code"],
          blocked: [],
          attemptedWork: [],
          mutationState: "verified",
          failedCondition: null,
          nextAction: null,
          recoveryAction: null,
        };
      });
      const install = await import("../src/install");
      const applyProjectActual = install.applyInstallPlan;
      const applyProject = vi.spyOn(install, "applyInstallPlan").mockImplementation((input) => {
        const review = writeSpy.mock.calls.map(([chunk]) => String(chunk)).join("");
        expect(review).toContain("This computer");
        expect(review).toContain("This project");
        expect(applySystem).toHaveBeenCalledTimes(1);
        return applyProjectActual(input);
      });
      const { runCli } = await import("../src/cli");

      await runCli(["setup", "--yes", ...NONE_METHODS, "--target", targetDir]);

      expect(applySystem).toHaveBeenCalledTimes(1);
      expect(applyProject).toHaveBeenCalledTimes(1);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("runs normal setup system scope once before project apply", async () => {
    setTTY(false);
    const targetDir = createTempDir("make-docs-system-first-");
    try {
      const setupSystem = await import("../src/setup-system");
      const applySystem = vi.spyOn(setupSystem, "applyPreparedSystemSetup").mockImplementation(async () => {
        expect(loadManifest(targetDir)).toBeNull();
        return {
          schemaVersion: 2,
          status: "unchanged",
          scope: "machine",
          selections: { codex: "none", "claude-code": "none" },
          configured: [],
          skipped: ["codex", "claude-code"],
          blocked: [],
          attemptedWork: [],
          mutationState: "verified",
          failedCondition: null,
          nextAction: null,
          recoveryAction: null,
        };
      });
      const { runCli } = await import("../src/cli");

      await runCli(["setup", "--yes", ...NONE_METHODS, "--target", targetDir]);

      expect(applySystem).toHaveBeenCalledTimes(1);
      expect(loadManifest(targetDir)).not.toBeNull();
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("applies and verifies the reviewed Store bridge before system setup", async () => {
    setTTY(false);
    const targetDir = createTempDir("make-docs-store-before-system-");
    const storeRoot = path.join(isolatedSetupHome, "store");
    seedSchemaThreeStore(storeRoot);
    try {
      const setupSystem = await import("../src/setup-system");
      const applySystem = vi.spyOn(setupSystem, "applyPreparedSystemSetup").mockImplementation(async () => {
        const db = new DatabaseSync(path.join(storeRoot, "store.db"), { readOnly: true });
        expect(db.prepare("PRAGMA user_version").get()).toEqual({
          user_version: CURRENT_STORE_SCHEMA_VERSION,
        });
        db.close();
        return {
          schemaVersion: 2,
          status: "unchanged",
          scope: "machine",
          selections: { codex: "none", "claude-code": "none" },
          configured: [],
          skipped: ["codex", "claude-code"],
          blocked: [],
          attemptedWork: [],
          mutationState: "verified",
          failedCondition: null,
          nextAction: null,
          recoveryAction: null,
        };
      });
      const { runCli } = await import("../src/cli");

      await runCli(["setup", "--yes", ...NONE_METHODS, "--target", targetDir]);

      expect(applySystem).toHaveBeenCalledTimes(1);
      expect(loadManifest(targetDir)).not.toBeNull();
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("previews a schema-3 Store bridge for a target directory that does not exist yet", async () => {
    setTTY(false);
    const parentDir = createTempDir("make-docs-schema-three-missing-target-");
    const targetDir = path.join(parentDir, "new-project");
    const storeRoot = path.join(isolatedSetupHome, "store");
    seedSchemaThreeStore(storeRoot);
    try {
      const result = JSON.parse(await captureCliOutput([
        "setup",
        "--dry-run",
        "--json",
        ...NONE_METHODS,
        "--target",
        targetDir,
      ]));

      expect(result).toMatchObject({
        status: "planned",
        store: { sourceSchemaVersion: 3 },
      });
      expect(existsSync(targetDir)).toBe(false);
    } finally {
      cleanupTempDir(parentDir);
    }
  });

  test("rebuilds and reapproves the project plan after the Store bridge changes project state", async () => {
    setTTY(true);
    const targetDir = createTempDir("make-docs-store-project-reapproval-");
    const storeRoot = path.join(isolatedSetupHome, "store");
    const agentsPath = path.join(targetDir, "AGENTS.md");
    try {
      const predictedPlan = await planInstall({
        targetDir,
        selections: defaultSelections(),
        existingManifest: null,
      });
      const predictedAgentsAction = predictedPlan.actions.find(
        (action) => action.relativePath === "AGENTS.md",
      );
      expect(predictedAgentsAction?.type).toBe("create");
      expect(predictedAgentsAction?.content).toBeDefined();
      seedSchemaThreeStore(storeRoot);

      const migration = await import("../src/migration");
      const executeStoreCheckpoint9Migration = migration.executeStoreCheckpoint9Migration;
      const storeBridge = vi
        .spyOn(migration, "executeStoreCheckpoint9Migration")
        .mockImplementation((input) => {
          expect(existsSync(agentsPath)).toBe(false);
          expect(loadManifest(targetDir)).toBeNull();
          const result = executeStoreCheckpoint9Migration(input);
          writeFileSync(agentsPath, predictedAgentsAction!.content!);
          return result;
        });
      runSelectionWizardMock.mockResolvedValue(defaultSelections());

      const output = await captureCliOutput([
        "setup",
        ...NONE_METHODS,
        "--target",
        targetDir,
      ]);

      const confirmationMessages = confirmMock.mock.calls.map(
        ([options]) => String(options.message),
      );
      const projectConfirmations = confirmationMessages.filter(
        (message) => message === "Install make-docs with this plan?",
      );
      const refreshedReview = output.indexOf(
        "The verified Store state changed the project review. Review the current project plan.",
      );

      expect(storeBridge).toHaveBeenCalledTimes(1);
      expect(projectConfirmations).toHaveLength(2);
      expect(refreshedReview).toBeGreaterThan(-1);
      expect(output.slice(0, refreshedReview)).toContain("- generate: AGENTS.md");
      expect(output.slice(refreshedReview)).not.toContain("- generate: AGENTS.md");
      expect(promptForManagedFileConflictResolutionsMock).not.toHaveBeenCalled();
      expect(readFileSync(agentsPath, "utf8")).toBe(
        String(predictedAgentsAction!.content),
      );
      expect(readInstallationStatus(targetDir).status).toBe("ready");
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("previews the same final project actions that apply follows after a schema-3 Store bridge", async () => {
    setTTY(false);
    const targetDir = createTempDir("make-docs-schema-three-preview-parity-");
    const storeRoot = path.join(isolatedSetupHome, "store");
    try {
      await installManifest(targetDir);
      const installedManifest = loadManifest(targetDir)!;
      const agentsBefore = readFileSync(path.join(targetDir, "AGENTS.md"), "utf8");
      rmSync(storeRoot, { recursive: true, force: true });
      seedSchemaThreeInstallationLedger(storeRoot, targetDir, installedManifest);

      const preview = JSON.parse(await captureCliOutput([
        "setup",
        "--dry-run",
        "--json",
        ...NONE_METHODS,
        "--target",
        targetDir,
      ]));

      const previewDb = new DatabaseSync(path.join(storeRoot, "store.db"), { readOnly: true });
      expect(previewDb.prepare("PRAGMA user_version").get()).toEqual({ user_version: 3 });
      previewDb.close();
      expect(readFileSync(path.join(targetDir, "AGENTS.md"), "utf8")).toBe(agentsBefore);

      const applied = JSON.parse(await captureCliOutput([
        "setup",
        "--yes",
        "--json",
        ...NONE_METHODS,
        "--target",
        targetDir,
      ]));

      expect(preview.project.actions).toEqual(applied.project.actions);
      expect(readInstallationStatus(targetDir).status).toBe("ready");
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("does not ask for project approval again when the Store bridge leaves review facts unchanged", async () => {
    setTTY(true);
    const targetDir = createTempDir("make-docs-schema-three-stable-review-");
    const storeRoot = path.join(isolatedSetupHome, "store");
    try {
      await installManifest(targetDir);
      const installedManifest = loadManifest(targetDir)!;
      rmSync(storeRoot, { recursive: true, force: true });
      seedSchemaThreeInstallationLedger(storeRoot, targetDir, installedManifest);
      runSelectionWizardMock.mockResolvedValue(defaultSelections());

      const output = await captureCliOutput([
        "setup",
        ...NONE_METHODS,
        "--target",
        targetDir,
      ]);
      const projectConfirmations = confirmMock.mock.calls
        .map(([options]) => String(options.message))
        .filter((message) => message === "Apply this make-docs sync?");

      expect(projectConfirmations).toHaveLength(1);
      expect(output).not.toContain(
        "The verified Store state changed the project review. Review the current project plan.",
      );
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("checks compatibility again after a predicted schema-3 ledger becomes current", async () => {
    setTTY(false);
    const targetDir = createTempDir("make-docs-schema-three-reloaded-guard-");
    const storeRoot = path.join(isolatedSetupHome, "store");
    try {
      await installManifest(targetDir);
      const installedManifest = loadManifest(targetDir)!;
      rmSync(storeRoot, { recursive: true, force: true });
      seedSchemaThreeInstallationLedger(storeRoot, targetDir, installedManifest);
      const compatibility = await import("../src/compatibility");
      const classification = await compatibility.classifyCompatibilityState({ targetDir });
      vi.spyOn(compatibility, "classifyCompatibilityState").mockResolvedValue({
        ...classification,
        disposition: "manual-review-required",
      });

      const error = await captureCliError([
        "setup",
        "--yes",
        ...NONE_METHODS,
        "--target",
        targetDir,
      ]);

      expect(error.message).toContain(
        "make-docs cannot classify this target safely enough to write changes",
      );
      const db = new DatabaseSync(path.join(storeRoot, "store.db"), { readOnly: true });
      expect(db.prepare("PRAGMA user_version").get()).toEqual({
        user_version: CURRENT_STORE_SCHEMA_VERSION,
      });
      db.close();
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("reports a failed Store prerequisite without machine or project writes", async () => {
    setTTY(false);
    const targetDir = createTempDir("make-docs-store-prerequisite-failure-");
    const storeRoot = path.join(isolatedSetupHome, "store");
    seedSchemaThreeStore(storeRoot);
    try {
      const migration = await import("../src/migration");
      vi.spyOn(migration, "executeStoreCheckpoint9Migration").mockImplementation(() => {
        throw new MigrationSafetyError("permission-denied", "The Store backup path denied access.");
      });

      const output = await captureCliOutput([
        "setup",
        "--yes",
        "--json",
        ...NONE_METHODS,
        "--target",
        targetDir,
      ]);

      expect(JSON.parse(output)).toMatchObject({
        status: "blocked",
        store: { sourceSchemaVersion: 3, mutationState: "none" },
        project: { mutationState: "none" },
        failedCondition: "The Store backup path denied access.",
        nextAction: "Restore Store and backup-path access, then run `make-docs setup` again.",
      });
      const db = new DatabaseSync(path.join(storeRoot, "store.db"), { readOnly: true });
      expect(db.prepare("PRAGMA user_version").get()).toEqual({ user_version: 3 });
      db.close();
      expect(loadManifest(targetDir)).toBeNull();
      expect(existsSync(path.join(storeRoot, "config.json"))).toBe(false);
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("reports machine mutation state from the apply result instead of the reviewed plan", async () => {
    setTTY(false);
    const targetDir = createTempDir("make-docs-machine-result-state-");
    try {
      const setupSystem = await import("../src/setup-system");
      const prepareActual = setupSystem.prepareSystemSetupCommand;
      vi.spyOn(setupSystem, "prepareSystemSetupCommand").mockImplementation(async (options) => {
        const prepared = await prepareActual(options);
        return {
          ...prepared,
          changed: true,
          plans: [{
            harness: "codex",
            method: "none",
            status: "drifted",
            operations: ["injected reviewed machine operation"],
            operationEffects: [],
            allowedStoreOperations: "active-operation-registry",
            ownedEntries: [],
            machineFiles: [],
            changed: true,
            detail: "Injected reviewed machine change.",
            apply: async () => undefined,
            verify: async () => true,
          }],
        };
      });
      vi.spyOn(setupSystem, "applyPreparedSystemSetup").mockResolvedValue({
        schemaVersion: 2,
        status: "unchanged",
        scope: "machine",
        selections: { codex: "none", "claude-code": "none" },
        configured: [],
        skipped: ["codex", "claude-code"],
        blocked: [],
        attemptedWork: [],
        mutationState: "none",
        failedCondition: null,
        nextAction: null,
        recoveryAction: null,
      });

      const result = JSON.parse(await captureCliOutput([
        "setup",
        "--yes",
        "--json",
        ...NONE_METHODS,
        "--target",
        targetDir,
      ]));

      expect(result.machine.states[0]).toMatchObject({ mutationState: "none" });
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("does not report an unchanged machine plan as applied", async () => {
    setTTY(false);
    const targetDir = createTempDir("make-docs-machine-unchanged-result-state-");
    try {
      const setupSystem = await import("../src/setup-system");
      const prepareActual = setupSystem.prepareSystemSetupCommand;
      vi.spyOn(setupSystem, "prepareSystemSetupCommand").mockImplementation(async (options) => {
        const prepared = await prepareActual(options);
        return {
          ...prepared,
          plans: [{
            harness: "codex",
            method: "none",
            status: "current",
            operations: [],
            operationEffects: [],
            allowedStoreOperations: "active-operation-registry",
            ownedEntries: [],
            machineFiles: [],
            changed: false,
            detail: "No machine change is needed.",
            apply: async () => undefined,
            verify: async () => true,
          }],
        };
      });
      vi.spyOn(setupSystem, "applyPreparedSystemSetup").mockResolvedValue({
        schemaVersion: 2,
        status: "configured",
        scope: "machine",
        selections: { codex: "none", "claude-code": "none" },
        configured: ["codex"],
        skipped: ["claude-code"],
        blocked: [],
        attemptedWork: ["verified codex"],
        mutationState: "verified",
        failedCondition: null,
        nextAction: null,
        recoveryAction: null,
      });

      const result = JSON.parse(await captureCliOutput([
        "setup",
        "--yes",
        "--json",
        ...NONE_METHODS,
        "--target",
        targetDir,
      ]));

      expect(result.machine.states).toContainEqual(
        expect.objectContaining({
          harness: "codex",
          mutationState: "none",
        }),
      );
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("does not apply a Store-only machine prerequisite without This computer approval", async () => {
    setTTY(true);
    const targetDir = createTempDir("make-docs-store-approval-");
    const storeRoot = path.join(isolatedSetupHome, "store");
    const global = loadGlobalConfig(storeRoot).config;
    global.settings.harnesses.codex = {
      selected: false,
      maximumMethod: null,
      accessCeiling: { store: "none", project: "none", hostConfig: "none" },
    };
    global.settings.harnesses["claude-code"] = {
      selected: false,
      maximumMethod: null,
      accessCeiling: { store: "none", project: "none", hostConfig: "none" },
    };
    writeGlobalConfig(storeRoot, global);
    seedSchemaThreeStore(storeRoot);
    runSelectionWizardMock.mockResolvedValue(defaultSelections());
    confirmMock.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    try {
      const { runCli } = await import("../src/cli");

      await runCli(["setup", ...NONE_METHODS, "--target", targetDir]);

      expect(confirmMock).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ message: "Apply the reviewed This computer changes?" }),
      );
      const db = new DatabaseSync(path.join(storeRoot, "store.db"), { readOnly: true });
      expect(db.prepare("PRAGMA user_version").get()).toEqual({ user_version: 3 });
      db.close();
      expect(loadManifest(targetDir)).toBeNull();
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("closes the schema-3, Codex-drift, and new-Claude full-setup loop", async () => {
    setTTY(false);
    const targetDir = createTempDir("make-docs-p7-loop-");
    const storeRoot = path.join(isolatedSetupHome, "store");
    const executablePath = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      "../dist/index.js",
    );
    const executable = verifyMakeDocsExecutable({ executablePath });
    const priorArgv1 = process.argv[1];
    try {
      mkdirSync(path.join(isolatedSetupHome, ".codex"), { recursive: true });
      writeFileSync(
        path.join(isolatedSetupHome, ".codex/config.toml"),
        'model = "user-model"\n',
        "utf8",
      );
      writeFileSync(
        path.join(isolatedSetupHome, ".claude.json"),
        `${JSON.stringify({ theme: "user-theme" }, null, 2)}\n`,
        "utf8",
      );
      const initialPlan = CODEX_HARNESS_ADAPTER.plan({
        method: "mcp",
        scope: "machine",
        root: isolatedSetupHome,
        executable,
      });
      const initial = CODEX_HARNESS_ADAPTER.apply({
        plan: initialPlan,
        approved: true,
        operationId: "p7.codex.prior",
        appliedVersion: executable.packageVersion,
        verifiedAt: "2026-09-22T12:00:00.000Z",
      });
      const codexPath = path.join(isolatedSetupHome, initial.receipt.entries[0]!.path);
      const desiredEntry = initial.receipt.entries[0]!.value as string;
      const priorEntry = desiredEntry.replace(
        "# make-docs:end harness-access codex mcp",
        "# Prior Make Docs package\n# make-docs:end harness-access codex mcp",
      );
      const priorContent = readFileSync(codexPath, "utf8").replace(desiredEntry, priorEntry);
      writeFileSync(codexPath, priorContent, "utf8");
      const priorReceipt = {
        ...initial.receipt,
        entries: [{
          ...initial.receipt.entries[0]!,
          value: priorEntry,
          entryFingerprint: fingerprintEntry(priorEntry),
          fileFingerprint: sha256(priorContent),
        }],
      };

      seedSchemaThreeStore(storeRoot);
      const legacy = new DatabaseSync(path.join(storeRoot, "store.db"));
      const insertReceipt = legacy.prepare(
        "INSERT INTO tool_operations (operation_id,operation,status,pid,hostname,metadata_json,started_at,finished_at) VALUES (?,?,'completed',?,?,?,?,?)",
      );
      insertReceipt.run(
        `harness-receipt:${priorReceipt.operationId}`,
        "setup.system.receipt",
        process.pid,
        "p7-fixture",
        JSON.stringify(priorReceipt),
        priorReceipt.verifiedAt,
        priorReceipt.verifiedAt,
      );
      insertReceipt.run(
        "harness-receipt-current:machine:codex:mcp",
        "setup.system.receipt-current",
        process.pid,
        "p7-fixture",
        JSON.stringify(priorReceipt),
        priorReceipt.verifiedAt,
        priorReceipt.verifiedAt,
      );
      legacy.close();
      process.argv[1] = executablePath;

      const previewOutput = await captureCliOutput([
        "setup",
        "--dry-run",
        "--json",
        "--codex-method",
        "mcp",
        "--claude-code-method",
        "mcp",
        "--target",
        targetDir,
      ]);
      expect(JSON.parse(previewOutput)).toMatchObject({
        status: "planned",
        dryRun: true,
        store: {
          sourceSchemaVersion: 3,
          targetSchemaVersion: CURRENT_STORE_SCHEMA_VERSION,
          mutationState: "planned",
        },
        machine: {
          states: expect.arrayContaining([
            expect.objectContaining({ harness: "codex", state: "drifted" }),
            expect.objectContaining({ harness: "claude-code", state: "incomplete" }),
          ]),
        },
      });
      const previewDb = new DatabaseSync(path.join(storeRoot, "store.db"), { readOnly: true });
      expect(previewDb.prepare("PRAGMA user_version").get()).toEqual({ user_version: 3 });
      previewDb.close();
      expect(existsSync(path.join(targetDir, ".make-docs/manifest.json"))).toBe(false);

      const directJsonOutput = await captureCliOutput([
        "setup",
        "system",
        "--yes",
        "--json",
        "--codex-method",
        "mcp",
        "--claude-code-method",
        "mcp",
        "--target",
        targetDir,
      ]);
      const directJson = JSON.parse(directJsonOutput);
      expect(directJson).toMatchObject({
        status: "recovery",
        failedCondition: expect.stringContaining("supported legacy schema 3"),
        nextAction: expect.stringContaining("`make-docs setup`"),
      });
      expect(directJson.nextAction).not.toContain("setup system");
      expect(existsSync(path.join(storeRoot, "config.json"))).toBe(false);

      setTTY(true);
      const directHuman = await captureCliOutput([
        "setup",
        "system",
        "--yes",
        "--codex-method",
        "mcp",
        "--claude-code-method",
        "mcp",
        "--target",
        targetDir,
      ]);
      expect(directHuman).toContain("Machine setup: recovery.");
      expect(directHuman).toContain("Run `make-docs setup`");
      expect(directHuman).not.toContain("Run `make-docs setup system`");
      setTTY(false);

      const firstOutput = await captureCliOutput([
        "setup",
        "--yes",
        "--json",
        "--codex-method",
        "mcp",
        "--claude-code-method",
        "mcp",
        "--target",
        targetDir,
      ]);
      const first = JSON.parse(firstOutput);
      expect(first).toMatchObject({
        status: "complete",
        store: { sourceSchemaVersion: 3, targetSchemaVersion: CURRENT_STORE_SCHEMA_VERSION },
        machine: { configured: ["codex", "claude-code"] },
      });
      expect(readFileSync(codexPath, "utf8")).toContain('model = "user-model"');
      expect(readFileSync(codexPath, "utf8")).toContain(desiredEntry);
      expect(readFileSync(codexPath, "utf8")).not.toContain("Prior Make Docs package");
      expect(JSON.parse(readFileSync(path.join(isolatedSetupHome, ".claude.json"), "utf8")))
        .toMatchObject({ theme: "user-theme", mcpServers: { "make-docs": expect.any(Object) } });
      expect(readPendingHarnessSystemOperation(targetDir, storeRoot)).toBeNull();
      expect(loadGlobalConfig(storeRoot).config.settings.harnesses).toMatchObject({
        codex: { selected: true, maximumMethod: "mcp" },
        "claude-code": { selected: true, maximumMethod: "mcp" },
      });

      const repeatOutput = await captureCliOutput([
        "setup",
        "--yes",
        "--json",
        "--codex-method",
        "mcp",
        "--claude-code-method",
        "mcp",
        "--target",
        targetDir,
      ]);
      const repeat = JSON.parse(repeatOutput);
      expect(repeat).toMatchObject({
        status: "complete",
        store: { mutationState: "none" },
        machine: {
          configured: ["codex", "claude-code"],
          states: expect.arrayContaining([
            expect.objectContaining({ harness: "codex", state: "current", mutationState: "none" }),
            expect.objectContaining({ harness: "claude-code", state: "current", mutationState: "none" }),
          ]),
        },
        project: { changed: false, mutationState: "none" },
      });
    } finally {
      process.argv[1] = priorArgv1;
      cleanupTempDir(targetDir);
    }
  });

  test("keeps system success and gives project recovery after one project failure", async () => {
    setTTY(true);
    const targetDir = createTempDir("make-docs-project-failure-");
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    try {
      vi.resetModules();
      const setupSystem = await import("../src/setup-system");
      const applySystem = vi.spyOn(setupSystem, "applyPreparedSystemSetup").mockResolvedValue({
        schemaVersion: 2,
        status: "configured",
        scope: "machine",
        selections: { codex: "none", "claude-code": "none" },
        configured: ["codex"],
        skipped: ["claude-code"],
        blocked: [],
        attemptedWork: [],
        mutationState: "verified",
        failedCondition: null,
        nextAction: null,
        recoveryAction: null,
      });
      const install = await import("../src/install");
      const applyProject = vi.spyOn(install, "applyInstallPlan").mockImplementation(() => {
        throw new Error("injected project apply failure");
      });
      const { runCli } = await import("../src/cli");

      await expect(runCli(["setup", "--yes", ...NONE_METHODS, "--target", targetDir]))
        .rejects.toThrow("injected project apply failure");

      expect(applySystem).toHaveBeenCalledTimes(1);
      expect(applyProject).toHaveBeenCalledTimes(1);
      expect(writeSpy.mock.calls.map(([chunk]) => String(chunk)).join(""))
        .toContain("This computer remains configured. Project scope failed. Run `make-docs setup` to review and resume the project change.");
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("emits one canonical JSON result when project apply fails before mutation", async () => {
    setTTY(false);
    const targetDir = createTempDir("make-docs-project-json-failure-");
    try {
      vi.resetModules();
      const setupSystem = await import("../src/setup-system");
      vi.spyOn(setupSystem, "applyPreparedSystemSetup").mockResolvedValue({
        schemaVersion: 2,
        status: "unchanged",
        scope: "machine",
        selections: { codex: "none", "claude-code": "none" },
        configured: [],
        skipped: ["codex", "claude-code"],
        blocked: [],
        attemptedWork: [],
        mutationState: "none",
        failedCondition: null,
        nextAction: null,
        recoveryAction: null,
      });
      const install = await import("../src/install");
      vi.spyOn(install, "applyInstallPlan").mockImplementation(() => {
        throw new Error("injected JSON project apply failure");
      });

      const result = JSON.parse(await captureCliOutput([
        "setup",
        "--yes",
        "--json",
        ...NONE_METHODS,
        "--target",
        targetDir,
      ]));

      expect(result).toMatchObject({
        status: "blocked",
        project: { changed: false, mutationState: "none" },
        failedCondition: "injected JSON project apply failure",
      });
      expect(result.nextAction).toContain("review and recover the project change");
    } finally {
      cleanupTempDir(targetDir);
    }
  });

  test("preserves project harness disable intent during setup", async () => {
    setTTY(false);
    const targetDir = createTempDir("make-docs-project-harness-intent-");
    const configPath = path.join(targetDir, ".make-docs/config.yaml");
    const projectConfig = [
      "harnessIntegrations:",
      "  - harness: codex",
      "    mode: disable",
      "",
    ].join("\n");
    try {
      mkdirSync(path.dirname(configPath), { recursive: true });
      writeFileSync(configPath, projectConfig, "utf8");
      const { runCli } = await import("../src/cli");

      await runCli(["setup", "--yes", ...NONE_METHODS, "--target", targetDir]);

      expect(loadMakeDocsConfig(targetDir).config.harnessIntegrations).toEqual([
        { harness: "codex", mode: "disable" },
        { harness: "claude-code", mode: "disable" },
      ]);
    } finally {
      cleanupTempDir(targetDir);
    }
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
    ["system", ["Usage:", "Options:", "Examples:", "make-docs setup system"]],
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
    expect(output).toContain(
      "system       Configure reviewed machine-level harness support.",
    );
    expect(output).toContain(
      "reconfigure  Change saved project selections for an existing install.",
    );
    expect(output).toContain("skills       Change, sync, or remove managed skills.");
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
      const manifestPath = path.join(targetDir, ".make-docs/config.yaml");
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
