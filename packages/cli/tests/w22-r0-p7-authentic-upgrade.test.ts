import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { DatabaseSync } from "node:sqlite";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  readlinkSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { loadManifest } from "../src/manifest";
import { parseManagedBlock, renderManagedBlock } from "../src/managed-block";
import { defaultSelections } from "../src/profile";
import { CURRENT_STORE_SCHEMA_VERSION } from "../src/store";
import { readInstallationStatus } from "../src/store/installation-state";
import { hashText } from "../src/utils";

const runSelectionWizardMock = vi.fn();
const promptForManagedFileConflictResolutionsMock = vi.fn();
const confirmMock = vi.fn();
const selectMock = vi.fn();

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

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const LEGACY_PACKAGE_ROOT = path.join(
  REPO_ROOT,
  "packages/cli/tests/fixtures/legacy-packages",
);

interface LegacyPackageCase {
  packageName: string;
  version: string;
  archive: string;
  sha256: string;
  manifestSchema: number;
  expectedWholeFileRouter?: string;
  args: (targetDir: string) => string[];
}

const LEGACY_PACKAGES: LegacyPackageCase[] = [
  {
    packageName: "make-docs",
    version: "0.1.0",
    archive: "make-docs-0.1.0.tgz",
    sha256: "aa9c10e20a49dfeb5afbcd3e26fd9873d4362311fe277145be5a4332a80d6acb",
    manifestSchema: 1,
    expectedWholeFileRouter: "AGENTS.md",
    args: (targetDir) => [
      "--yes",
      "--target",
      targetDir,
      "--no-skills",
    ],
  },
  {
    packageName: "@brucewaynedecoy/make-docs",
    version: "1.0.0-rc.1",
    archive: "brucewaynedecoy-make-docs-1.0.0-rc.1.tgz",
    sha256: "dfad170ceffc6e74c2afd397b390be5c900bd2e74e63491598c394382e209d71",
    manifestSchema: 1,
    args: (targetDir) => [
      "--yes",
      "--target",
      targetDir,
      "--no-skills",
      "--no-codex",
      "--no-claude-code",
    ],
  },
];

const SCHEMA_THREE_PACKAGE: LegacyPackageCase = {
  packageName: "@brucewaynedecoy/make-docs",
  version: "2.0.0-rc",
  archive: "brucewaynedecoy-make-docs-2.0.0-rc-f5fd5579.tgz",
  sha256: "6008ee431f8e42d3714da8df512a934aa5e3f5d930a7a0c8104a17768a0fb878",
  manifestSchema: 4,
  args: (targetDir) => [
    "setup",
    "--yes",
    "--target",
    targetDir,
    "--no-skills",
    "--no-codex",
    "--no-claude-code",
    "--project-resources",
    "all",
  ],
};

const MODIFIED_MANAGED_PATHS = [
  ".make-docs/system/contracts/output-contract.md",
  ".make-docs/system/references/execution-workflow.md",
  ".make-docs/system/contracts/human-experience-contract.md",
  ".make-docs/system/references/human-experience.md",
  ".make-docs/system/contracts/performance-evidence-governance.md",
  ".make-docs/system/references/performance-evidence.md",
] as const;

const LEGACY_PLAYBOOK_PATH =
  ".make-docs/archive/legacy-playbooks/agent/make-docs-lifecycle.playbook.md";

function digest(file: string): string {
  return createHash("sha256").update(readFileSync(file)).digest("hex");
}

function snapshotProjectFiles(targetDir: string): Record<string, string> {
  const entries: Array<[string, string]> = [];
  const visit = (directory: string): void => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const absolutePath = path.join(directory, entry.name);
      const relativePath = path.relative(targetDir, absolutePath);
      if (entry.isDirectory()) {
        visit(absolutePath);
      } else if (entry.isSymbolicLink()) {
        entries.push([relativePath, `symlink:${readlinkSync(absolutePath)}`]);
      } else if (entry.isFile()) {
        entries.push([relativePath, digest(absolutePath)]);
      }
    }
  };
  visit(targetDir);
  return Object.fromEntries(entries.sort(([left], [right]) => left.localeCompare(right)));
}

function setTTY(value: boolean): void {
  Object.defineProperty(process.stdin, "isTTY", { configurable: true, value });
  Object.defineProperty(process.stdout, "isTTY", { configurable: true, value });
}

function createAuthenticUpgradeSelections() {
  const selections = defaultSelections();
  selections.harnesses = { "claude-code": true, codex: true };
  selections.skills = false;
  selections.selectedSkills = [];
  selections.resourceProjection = [];
  return selections;
}

function createLegacyProject(input: {
  legacy: LegacyPackageCase;
  fixtureRoot: string;
  targetDir: string;
  homeDir: string;
  storeRoot: string;
}): void {
  const archivePath = path.join(LEGACY_PACKAGE_ROOT, input.legacy.archive);
  expect(digest(archivePath)).toBe(input.legacy.sha256);

  const unpackDir = path.join(input.fixtureRoot, "unpacked");
  mkdirSync(unpackDir, { recursive: true });
  execFileSync("tar", ["-xzf", archivePath, "-C", unpackDir], { stdio: "pipe" });

  const oldEntry = path.join(unpackDir, "package/dist/index.js");
  execFileSync(process.execPath, [oldEntry, ...input.legacy.args(input.targetDir)], {
    cwd: input.targetDir,
    env: {
      ...process.env,
      HOME: input.homeDir,
      MAKE_DOCS_HOME: input.storeRoot,
    },
    stdio: "pipe",
  });
}

describe("W22 R0 P7 and P8 authentic older-package upgrades", () => {
  let fixtureRoot: string;
  let previousHome: string | undefined;
  let previousMakeDocsHome: string | undefined;

  beforeEach(() => {
    fixtureRoot = mkdtempSync(path.join(os.tmpdir(), "make-docs-p7-authentic-"));
    previousHome = process.env.HOME;
    previousMakeDocsHome = process.env.MAKE_DOCS_HOME;
    runSelectionWizardMock.mockReset();
    promptForManagedFileConflictResolutionsMock.mockReset();
    confirmMock.mockReset();
    confirmMock.mockResolvedValue(true);
    selectMock.mockReset();
    setTTY(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (previousHome === undefined) delete process.env.HOME;
    else process.env.HOME = previousHome;
    if (previousMakeDocsHome === undefined) delete process.env.MAKE_DOCS_HOME;
    else process.env.MAKE_DOCS_HOME = previousMakeDocsHome;
    rmSync(fixtureRoot, { recursive: true, force: true });
  });

  test.each(LEGACY_PACKAGES)(
    "upgrades an authentic $version install through plain setup",
    async (legacy) => {
      const targetDir = path.join(fixtureRoot, "project");
      const homeDir = path.join(fixtureRoot, "home");
      const storeRoot = path.join(fixtureRoot, "store");
      mkdirSync(targetDir, { recursive: true });
      mkdirSync(homeDir, { recursive: true });

      createLegacyProject({ legacy, fixtureRoot, targetDir, homeDir, storeRoot });
      const legacyManifestPath = path.join(targetDir, ".make-docs/manifest.json");
      const legacyManifest = JSON.parse(readFileSync(legacyManifestPath, "utf8")) as {
        schemaVersion: number;
        packageName: string;
        packageVersion: string;
        files: Record<string, { hash: string; sourceId: string }>;
      };
      expect(legacyManifest).toMatchObject({
        schemaVersion: legacy.manifestSchema,
        packageName: legacy.packageName,
        packageVersion: legacy.version,
      });
      if (legacy.expectedWholeFileRouter) {
        const legacyRouterPath = path.join(targetDir, legacy.expectedWholeFileRouter);
        const legacyRouter = readFileSync(legacyRouterPath, "utf8");
        expect(parseManagedBlock(legacyRouter).state).toBe("absent");
        expect(legacyManifest.files[legacy.expectedWholeFileRouter]).toEqual({
          hash: digest(legacyRouterPath),
          sourceId: `build:${legacy.expectedWholeFileRouter}`,
        });
      }

      const userFile = path.join(targetDir, "README.md");
      writeFileSync(userFile, `# User file from ${legacy.version}\n`, "utf8");
      const unrelatedRouter = path.join(targetDir, "src/AGENTS.md");
      mkdirSync(path.dirname(unrelatedRouter), { recursive: true });
      writeFileSync(unrelatedRouter, "# Project-owned source router\n", "utf8");
      process.env.HOME = homeDir;
      process.env.MAKE_DOCS_HOME = storeRoot;
      vi.spyOn(os, "homedir").mockReturnValue(homeDir);
      runSelectionWizardMock.mockImplementation(async () =>
        createAuthenticUpgradeSelections(),
      );
      selectMock.mockResolvedValueOnce("backup-and-install").mockResolvedValue("none");
      const outputSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

      const { runCli } = await import("../src/cli");
      await runCli([
        "setup",
        "--codex-method",
        "none",
        "--claude-code-method",
        "none",
        "--project-resources",
        "none",
        "--target",
        targetDir,
      ]);

      expect(outputSpy).toHaveBeenCalled();
      expect(readFileSync(userFile, "utf8")).toBe(`# User file from ${legacy.version}\n`);
      expect(readFileSync(unrelatedRouter, "utf8")).toBe(
        "# Project-owned source router\n",
      );
      expect(loadManifest(targetDir)).toMatchObject({ schemaVersion: 4 });
      expect(readInstallationStatus(targetDir, storeRoot)).toMatchObject({
        status: "ready",
        pendingOperation: null,
      });
      expect(existsSync(path.join(targetDir, ".make-docs/state"))).toBe(false);
      if (legacy.expectedWholeFileRouter) {
        expect(
          parseManagedBlock(
            readFileSync(path.join(targetDir, legacy.expectedWholeFileRouter), "utf8"),
          ).state,
        ).toBe("valid");
      }

      const database = new DatabaseSync(path.join(storeRoot, "store.db"), { readOnly: true });
      try {
        const row = database.prepare("PRAGMA user_version").get() as { user_version: number };
        expect(row.user_version).toBe(CURRENT_STORE_SCHEMA_VERSION);
      } finally {
        database.close();
      }

      const firstRunFiles = snapshotProjectFiles(targetDir);
      await runCli([
        "setup",
        "--codex-method",
        "none",
        "--claude-code-method",
        "none",
        "--project-resources",
        "none",
        "--target",
        targetDir,
      ]);
      expect(snapshotProjectFiles(targetDir)).toEqual(firstRunFiles);
      expect(readInstallationStatus(targetDir, storeRoot)).toMatchObject({
        status: "ready",
        pendingOperation: null,
      });
    },
    60_000,
  );

  test.each([
    {
      label: "a changed whole-file router",
      change: (content: string) => `${content}\nProject-owned change.\n`,
      updateManifestHash: false,
    },
    {
      label: "a partial V2 marker",
      change: (content: string) => `${content}\n<!-- make-docs:begin -->\n`,
      updateManifestHash: true,
    },
    {
      label: "a malformed V2 end marker",
      change: (content: string) => `${content}\n<!-- make-docs:end -->\n`,
      updateManifestHash: true,
    },
    {
      label: "duplicated V2 blocks",
      change: (content: string) =>
        `${renderManagedBlock(content)}${renderManagedBlock(content)}`,
      updateManifestHash: true,
    },
    {
      label: "nested V2 blocks",
      change: (content: string) => renderManagedBlock(renderManagedBlock(content)),
      updateManifestHash: true,
    },
    {
      label: "a contradictory complete V2 block",
      change: (content: string) => renderManagedBlock(content),
      updateManifestHash: true,
    },
  ])(
    "stops authentic schema-1 ownership for $label before managed mutation",
    async ({ change, updateManifestHash }) => {
      const legacy = LEGACY_PACKAGES[0]!;
      const targetDir = path.join(fixtureRoot, "project");
      const homeDir = path.join(fixtureRoot, "home");
      const storeRoot = path.join(fixtureRoot, "store");
      mkdirSync(targetDir, { recursive: true });
      mkdirSync(homeDir, { recursive: true });
      createLegacyProject({ legacy, fixtureRoot, targetDir, homeDir, storeRoot });

      const routerPath = path.join(targetDir, legacy.expectedWholeFileRouter!);
      const changedRouter = change(readFileSync(routerPath, "utf8"));
      writeFileSync(routerPath, changedRouter, "utf8");
      if (updateManifestHash) {
        const manifestPath = path.join(targetDir, ".make-docs/manifest.json");
        const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
          files: Record<string, { hash: string }>;
        };
        manifest.files[legacy.expectedWholeFileRouter!]!.hash = hashText(changedRouter);
        writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
      }
      const projectBefore = snapshotProjectFiles(targetDir);
      const homeBefore = snapshotProjectFiles(homeDir);
      expect(existsSync(storeRoot)).toBe(false);

      process.env.HOME = homeDir;
      process.env.MAKE_DOCS_HOME = storeRoot;
      vi.spyOn(os, "homedir").mockReturnValue(homeDir);
      runSelectionWizardMock.mockImplementation(async () =>
        createAuthenticUpgradeSelections(),
      );
      selectMock.mockResolvedValueOnce("backup-and-install").mockResolvedValue("none");
      vi.spyOn(process.stdout, "write").mockImplementation(() => true);
      vi.spyOn(process.stderr, "write").mockImplementation(() => true);

      const { runCli } = await import("../src/cli");
      await expect(
        runCli([
          "setup",
          "--codex-method",
          "none",
          "--claude-code-method",
          "none",
          "--project-resources",
          "none",
          "--target",
          targetDir,
        ]),
      ).rejects.toThrow(/does not permit migration \(ambiguous-ownership\)/i);
      expect(snapshotProjectFiles(targetDir)).toEqual(projectBefore);
      expect(snapshotProjectFiles(homeDir)).toEqual(homeBefore);
      expect(existsSync(storeRoot)).toBe(false);
      expect(readFileSync(routerPath, "utf8")).toBe(changedRouter);
    },
    60_000,
  );

  test(
    "upgrades the authentic schema-3 partial install without a pending operation",
    async () => {
      const targetDir = path.join(fixtureRoot, "project");
      const homeDir = path.join(fixtureRoot, "home");
      const storeRoot = path.join(fixtureRoot, "store");
      mkdirSync(targetDir, { recursive: true });
      mkdirSync(homeDir, { recursive: true });

      createLegacyProject({
        legacy: SCHEMA_THREE_PACKAGE,
        fixtureRoot,
        targetDir,
        homeDir,
        storeRoot,
      });

      expect(existsSync(path.join(targetDir, ".make-docs/manifest.json"))).toBe(false);
      const legacyDatabase = new DatabaseSync(path.join(storeRoot, "store.db"), {
        readOnly: true,
      });
      try {
        const schema = legacyDatabase.prepare("PRAGMA user_version").get() as {
          user_version: number;
        };
        expect(schema.user_version).toBe(3);
        const ledger = legacyDatabase
          .prepare("SELECT manifest_json FROM installation_ledgers")
          .get() as { manifest_json: string };
        expect(JSON.parse(ledger.manifest_json)).toMatchObject({
          schemaVersion: SCHEMA_THREE_PACKAGE.manifestSchema,
          packageName: SCHEMA_THREE_PACKAGE.packageName,
          packageVersion: SCHEMA_THREE_PACKAGE.version,
        });
      } finally {
        legacyDatabase.close();
      }

      const preservedManagedFiles = new Map<string, string>();
      for (const [index, relativePath] of MODIFIED_MANAGED_PATHS.entries()) {
        const file = path.join(targetDir, relativePath);
        const modified = `${readFileSync(file, "utf8")}\nUser-owned change ${index + 1}.\n`;
        writeFileSync(file, modified, "utf8");
        preservedManagedFiles.set(file, modified);
      }

      const legacyPlaybook = path.join(targetDir, LEGACY_PLAYBOOK_PATH);
      const legacyPlaybookBody = "# User legacy playbook\n\nPreserve this body.\n";
      mkdirSync(path.dirname(legacyPlaybook), { recursive: true });
      writeFileSync(legacyPlaybook, legacyPlaybookBody, "utf8");

      process.env.HOME = homeDir;
      process.env.MAKE_DOCS_HOME = storeRoot;
      vi.spyOn(os, "homedir").mockReturnValue(homeDir);
      runSelectionWizardMock.mockResolvedValue({
        ...defaultSelections(),
        harnesses: { "claude-code": false, codex: false },
        resourceProjection: ["contract", "prompt", "reference", "template"],
      });
      promptForManagedFileConflictResolutionsMock.mockImplementation(
        async (conflicts: Array<{ relativePath: string }>) =>
          Object.fromEntries(conflicts.map(({ relativePath }) => [relativePath, "skip"])),
      );
      selectMock.mockResolvedValueOnce("backup-and-install").mockResolvedValue("none");
      const outputSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

      const { runCli } = await import("../src/cli");
      await runCli([
        "setup",
        "--codex-method",
        "none",
        "--claude-code-method",
        "none",
        "--target",
        targetDir,
      ]);

      const output = outputSpy.mock.calls.map(([chunk]) => String(chunk)).join("");
      expect(output).toContain("Compatibility state: partial-install");
      expect(output).not.toContain("Run make-docs project state status before recovery");
      for (const [file, expected] of preservedManagedFiles) {
        expect(readFileSync(file, "utf8")).toBe(expected);
      }
      expect(readFileSync(legacyPlaybook, "utf8")).toBe(legacyPlaybookBody);
      const upgradedManifest = loadManifest(targetDir)!;
      for (const relativePath of MODIFIED_MANAGED_PATHS) {
        const file = upgradedManifest.files[relativePath];
        expect(file).toMatchObject({
          ownershipClass: "project-owned",
          hash: digest(path.join(targetDir, relativePath)),
        });
        expect(file.sourceId.startsWith("resource:")).toBe(true);
        const uri = file.sourceId.slice("resource:".length);
        expect(upgradedManifest.resourceProjection?.resources[uri]).toMatchObject({
          managedDestination: relativePath,
          ownershipClass: "project-owned",
          installedDigest: file.hash,
        });
      }
      expect(readInstallationStatus(targetDir, storeRoot)).toMatchObject({
        status: "ready",
        pendingOperation: null,
      });
      expect(existsSync(path.join(targetDir, ".make-docs/state"))).toBe(false);

      const reviewedConflictCalls = promptForManagedFileConflictResolutionsMock.mock.calls.length;
      await runCli([
        "setup",
        "--codex-method",
        "none",
        "--claude-code-method",
        "none",
        "--target",
        targetDir,
      ]);
      expect(promptForManagedFileConflictResolutionsMock).toHaveBeenCalledTimes(
        reviewedConflictCalls,
      );
      for (const [file, expected] of preservedManagedFiles) {
        expect(readFileSync(file, "utf8")).toBe(expected);
      }
      expect(readFileSync(legacyPlaybook, "utf8")).toBe(legacyPlaybookBody);
      expect(readInstallationStatus(targetDir, storeRoot)).toMatchObject({
        status: "ready",
        pendingOperation: null,
      });

      const currentDatabase = new DatabaseSync(path.join(storeRoot, "store.db"), {
        readOnly: true,
      });
      try {
        const schema = currentDatabase.prepare("PRAGMA user_version").get() as {
          user_version: number;
        };
        expect(schema.user_version).toBe(CURRENT_STORE_SCHEMA_VERSION);
        const pending = currentDatabase
          .prepare("SELECT COUNT(*) AS count FROM installation_operations WHERE status = 'pending'")
          .get() as { count: number };
        expect(pending.count).toBe(0);
      } finally {
        currentDatabase.close();
      }
    },
    60_000,
  );
});
