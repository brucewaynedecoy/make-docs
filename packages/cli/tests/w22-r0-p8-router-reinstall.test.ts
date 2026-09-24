import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createAuditReport } from "../src/audit";
import { runCli } from "../src/cli";
import {
  classifyCompatibilityState,
  scopeCompatibilityToInstallPlan,
} from "../src/compatibility";
import { applyInstallPlan, planInstall } from "../src/install";
import {
  createAuditPathMetadata,
  getManifestFileHash,
  loadManifest,
} from "../src/manifest";
import { parseManagedBlock } from "../src/managed-block";
import { defaultSelections } from "../src/profile";
import { createProjectSurfaceRouterAssets } from "../src/project-projection";
import {
  readInstallationStatus,
  recoverInstallationOperation,
  reviewCompletedRemovalHandoff,
  saveInstallationManifest,
} from "../src/store/installation-state";
import { PROJECT_RESOURCE_TYPES, type AuditRemovableFile } from "../src/types";
import { runUninstallCommand } from "../src/uninstall";
import { hashText, readPackageMeta } from "../src/utils";
import * as fileUtils from "../src/utils";
import { cleanupTempDir, createTempDir, setTTY } from "./helpers";

const NONE_METHODS = [
  "--codex-method",
  "none",
  "--claude-code-method",
  "none",
] as const;
const BACKUP_ROUTER_COUNT = 52;
const LEGACY_BACKUP_ROUTER_COUNT = BACKUP_ROUTER_COUNT - 2;
const UNRELATED_ROUTER_COUNT = 36;
const NOW = new Date("2026-09-23T12:00:00.000Z");
const {
  runSelectionWizardMock,
  promptForManagedFileConflictResolutionsMock,
  confirmMock,
  selectMock,
} = vi.hoisted(() => ({
  runSelectionWizardMock: vi.fn(),
  promptForManagedFileConflictResolutionsMock: vi.fn(),
  confirmMock: vi.fn(),
  selectMock: vi.fn(),
}));

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

interface CompletedRemovalFixture {
  fixtureRoot: string;
  targetDir: string;
  homeDir: string;
  storeRoot: string;
  backupRoot: string;
  projectId: string;
  checkoutId: string;
  sharedRouterPath: string;
  sharedRouterContent: string;
  assetRouterPaths: string[];
  unrelatedRouters: Map<string, string>;
  backupRouters: Map<string, string>;
}

describe("W22 R0 P8 router ownership and reviewed reinstall", () => {
  let previousHome: string | undefined;
  let previousMakeDocsHome: string | undefined;

  beforeEach(() => {
    previousHome = process.env.HOME;
    previousMakeDocsHome = process.env.MAKE_DOCS_HOME;
    runSelectionWizardMock.mockReset();
    promptForManagedFileConflictResolutionsMock.mockReset();
    confirmMock.mockReset();
    confirmMock.mockResolvedValue(true);
    selectMock.mockReset();
    selectMock.mockResolvedValue("none");
    setTTY(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (previousHome === undefined) delete process.env.HOME;
    else process.env.HOME = previousHome;
    if (previousMakeDocsHome === undefined) delete process.env.MAKE_DOCS_HOME;
    else process.env.MAKE_DOCS_HOME = previousMakeDocsHome;
  });

  test(
    "plans and applies an exact managed-block insertion in a project-owned router",
    async () => {
      const fixture = await createCompletedRemovalFixture("missing-managed-block");

      try {
        const handoff = reviewCompletedRemovalHandoff(
          fixture.targetDir,
          fixture.storeRoot,
        );
        if (handoff.status !== "ready") {
          throw new Error("The missing-block fixture did not produce a reviewed handoff.");
        }
        const selections = defaultSelections();
        selections.skills = false;
        const plan = await planInstall({
          targetDir: fixture.targetDir,
          selections,
          existingManifest: handoff.beforeManifest,
          managedFileConflictResolutions: { "AGENTS.md": "overwrite" },
        });
        const routerAction = plan.actions.find(
          (action) => action.relativePath === "AGENTS.md",
        );
        expect(routerAction?.type).toBe("update");
        expect(
          plan.actions.some(
            (action) => action.relativePath === "services/service-00/AGENTS.md",
          ),
        ).toBe(false);
        const classification = scopeCompatibilityToInstallPlan({
          classification: await classifyCompatibilityState({
            targetDir: fixture.targetDir,
            homeDir: fixture.homeDir,
          }),
          plan,
          completedRemovalHandoff: true,
        });
        expect(classification).toMatchObject({
          state: "unknown-shape",
          disposition: "migrate-with-review",
        });

        applyInstallPlan({
          targetDir: fixture.targetDir,
          plan,
          existingManifest: null,
        });

        const installedRouter = readFileSync(fixture.sharedRouterPath, "utf8");
        const parsed = parseManagedBlock(installedRouter);
        expect(parsed.state).toBe("valid");
        expect(parsed.prefix).toBe(fixture.sharedRouterContent);
        expect(parsed.suffix).toBe("\n");
        assertFileMapUnchanged(fixture.unrelatedRouters);
        assertFileMapUnchanged(fixture.backupRouters);
        expect(readInstallationStatus(fixture.targetDir, fixture.storeRoot)).toMatchObject({
          status: "ready",
          projectId: fixture.projectId,
          checkoutId: fixture.checkoutId,
          pendingOperation: null,
        });
      } finally {
        cleanupTempDir(fixture.fixtureRoot);
      }
    },
    120_000,
  );

  test(
    "uses the exact completed removal as a plain-setup handoff and ignores inactive and unrelated routers",
    async () => {
      const fixture = await createCompletedRemovalFixture();
      try {
        const handoff = reviewCompletedRemovalHandoff(
          fixture.targetDir,
          fixture.storeRoot,
        );
        expect(handoff).toMatchObject({
          status: "ready",
          projectId: fixture.projectId,
          checkoutId: fixture.checkoutId,
          backupRoot: path.relative(fixture.targetDir, fixture.backupRoot),
        });

        setTTY(true);
        const humanPreview = await captureStdout(() =>
          runCli([
            "setup",
            "--dry-run",
            "--yes",
            ...NONE_METHODS,
            "--target",
            fixture.targetDir,
          ]),
        );
        expect(humanPreview).toContain("Disposition: migrate-with-review");
        expect(humanPreview).toContain(
          "Local resource projection: contract, prompt, reference, template",
        );
        expect(humanPreview).toContain("Dry run complete.");
        expect(humanPreview).not.toContain("legacy/managed-00/AGENTS.md");
        expect(humanPreview).not.toContain("services/service-00/AGENTS.md");

        setTTY(false);
        const jsonPreview = JSON.parse(
          await captureStdout(() =>
            runCli([
              "setup",
              "--dry-run",
              "--yes",
              "--json",
              ...NONE_METHODS,
              "--target",
              fixture.targetDir,
            ]),
          ),
        ) as {
          status: string;
          project: { actions: Array<{ path: string; action: string }> };
        };
        expect(jsonPreview.status).toBe("planned");
        expect(
          jsonPreview.project.actions.map((action) => action.path),
        ).not.toContain("services/service-00/AGENTS.md");

        setTTY(true);
        const appliedOutput = await captureStdout(() =>
          runCli([
            "setup",
            "--yes",
            ...NONE_METHODS,
            "--target",
            fixture.targetDir,
          ]),
        );
        expect(appliedOutput).toContain(
          `Synced make-docs ${readPackageMeta().version}`,
        );
        expect(readFileSync(fixture.sharedRouterPath, "utf8")).toBe(
          fixture.sharedRouterContent,
        );
        assertFileMapUnchanged(fixture.unrelatedRouters);
        assertFileMapUnchanged(fixture.backupRouters);

        const manifest = loadManifest(fixture.targetDir);
        expect(manifest).not.toBeNull();
        expect(manifest?.projectId).toBe(fixture.projectId);
        expect(manifest?.selections.resourceProjection).toEqual(PROJECT_RESOURCE_TYPES);
        for (const relativePath of fixture.assetRouterPaths) {
          expect(existsSync(path.join(fixture.targetDir, relativePath))).toBe(true);
        }
        expect(readInstallationStatus(fixture.targetDir, fixture.storeRoot)).toMatchObject({
          status: "ready",
          projectId: fixture.projectId,
          checkoutId: fixture.checkoutId,
          pendingOperation: null,
        });

        setTTY(false);
        const repeat = JSON.parse(
          await captureStdout(() =>
            runCli([
              "setup",
              "--yes",
              "--json",
              ...NONE_METHODS,
              "--target",
              fixture.targetDir,
            ]),
          ),
        ) as {
          status: string;
          project: { changed: boolean; actions: Array<{ action: string }> };
        };
        expect(repeat.status).toBe("complete");
        expect(repeat.project.changed).toBe(false);
        expect(repeat.project.actions.every((action) => action.action === "noop")).toBe(true);
        expect(readInstallationStatus(fixture.targetDir, fixture.storeRoot)).toMatchObject({
          status: "ready",
          projectId: fixture.projectId,
          checkoutId: fixture.checkoutId,
          pendingOperation: null,
        });
      } finally {
        cleanupTempDir(fixture.fixtureRoot);
      }
    },
    120_000,
  );

  test(
    "requires an explicit resource choice when completed-removal evidence cannot recover it",
    async () => {
      const fixture = await createCompletedRemovalFixture(
        "managed-block",
        true,
        "unknown",
      );
      try {
        await expect(
          captureStdout(() =>
            runCli([
              "setup",
              "--yes",
              ...NONE_METHODS,
              "--target",
              fixture.targetDir,
            ]),
          ),
        ).rejects.toThrow(
          "The completed removal does not contain enough evidence to recover the prior local resource selection.",
        );

        const explicitSelectionOutput = await captureStdout(() =>
          runCli([
            "setup",
            "--yes",
            ...NONE_METHODS,
            "--project-resources",
            "none",
            "--target",
            fixture.targetDir,
          ]),
        );
        expect(JSON.parse(explicitSelectionOutput)).toMatchObject({
          status: "complete",
          project: { changed: true, mutationState: "applied" },
        });
        expect(loadManifest(fixture.targetDir)?.selections.resourceProjection ?? []).toEqual([]);
      } finally {
        cleanupTempDir(fixture.fixtureRoot);
      }
    },
    120_000,
  );

  test(
    "routes unknown completed-removal resource intent through the interactive state review",
    async () => {
      const fixture = await createCompletedRemovalFixture(
        "managed-block",
        true,
        "unknown",
      );
      try {
        const reviewedSelections = defaultSelections();
        reviewedSelections.skills = false;
        reviewedSelections.resourceProjection = ["contract"];
        runSelectionWizardMock.mockResolvedValue(reviewedSelections);
        setTTY(true);

        const output = await captureStdout(() =>
          runCli([
            "setup",
            ...NONE_METHODS,
            "--target",
            fixture.targetDir,
          ]),
        );

        expect(runSelectionWizardMock).toHaveBeenCalledWith(
          expect.objectContaining({
            projectState: "partial",
            introTitle: "Let's reconfigure your make-docs install",
          }),
        );
        expect(output).toContain(`Synced make-docs ${readPackageMeta().version}`);
        expect(loadManifest(fixture.targetDir)?.selections.resourceProjection).toEqual([
          "contract",
        ]);
      } finally {
        cleanupTempDir(fixture.fixtureRoot);
      }
    },
    120_000,
  );

  test(
    "preserves disabled capabilities from the completed-removal manifest",
    async () => {
      const fixture = await createCompletedRemovalFixture(
        "managed-block",
        true,
        "unknown",
        true,
      );
      try {
        const output = JSON.parse(
          await captureStdout(() =>
            runCli([
              "setup",
              "--yes",
              "--json",
              ...NONE_METHODS,
              "--project-resources",
              "none",
              "--target",
              fixture.targetDir,
            ]),
          ),
        ) as { status: string };
        expect(output.status).toBe("complete");

        const manifest = loadManifest(fixture.targetDir);
        expect(manifest?.selections.capabilities.designs).toBe(false);
        expect(manifest?.effectiveCapabilities).not.toContain("designs");
      } finally {
        cleanupTempDir(fixture.fixtureRoot);
      }
    },
    120_000,
  );

  test(
    "uses ordinary guarded setup after a completed removal without backup",
    async () => {
      const fixture = await createCompletedRemovalFixture("managed-block", false);
      try {
        expect(
          reviewCompletedRemovalHandoff(fixture.targetDir, fixture.storeRoot),
        ).toEqual({ status: "none" });

        await captureStdout(() =>
          runCli([
            "setup",
            "--yes",
            ...NONE_METHODS,
            "--target",
            fixture.targetDir,
          ]),
        );
        expect(readInstallationStatus(fixture.targetDir, fixture.storeRoot)).toMatchObject({
          status: "ready",
          projectId: fixture.projectId,
          checkoutId: fixture.checkoutId,
          pendingOperation: null,
        });
        assertFileMapUnchanged(fixture.unrelatedRouters);
      } finally {
        cleanupTempDir(fixture.fixtureRoot);
      }
    },
    120_000,
  );

  test(
    "uses ordinary guarded setup when the completed removal backup root is absent",
    async () => {
      const fixture = await createCompletedRemovalFixture();
      try {
        rmSync(fixture.backupRoot, { recursive: true, force: true });
        expect(
          reviewCompletedRemovalHandoff(fixture.targetDir, fixture.storeRoot),
        ).toEqual({ status: "none" });

        await captureStdout(() =>
          runCli([
            "setup",
            "--yes",
            ...NONE_METHODS,
            "--target",
            fixture.targetDir,
          ]),
        );
        expect(readInstallationStatus(fixture.targetDir, fixture.storeRoot)).toMatchObject({
          status: "ready",
          projectId: fixture.projectId,
          checkoutId: fixture.checkoutId,
          pendingOperation: null,
        });
        assertFileMapUnchanged(fixture.unrelatedRouters);
      } finally {
        cleanupTempDir(fixture.fixtureRoot);
      }
    },
    120_000,
  );

  test(
    "rejects changed backup evidence before a new project operation starts",
    async () => {
      const fixture = await createCompletedRemovalFixture();
      try {
        const [changedBackupPath] = fixture.backupRouters.keys();
        writeFileSync(changedBackupPath!, "changed backup bytes\n", "utf8");

        const review = reviewCompletedRemovalHandoff(
          fixture.targetDir,
          fixture.storeRoot,
        );
        expect(review).toMatchObject({ status: "blocked" });
        expect(
          review.status === "blocked" ? review.blockers.join("\n") : "",
        ).toContain("completed removal output changed");

        await expect(
          captureStdout(() =>
            runCli([
              "setup",
              "--yes",
              ...NONE_METHODS,
              "--target",
              fixture.targetDir,
            ]),
          ),
        ).rejects.toThrow("completed make-docs removal cannot be used");
        expect(readInstallationStatus(fixture.targetDir, fixture.storeRoot)).toMatchObject({
          status: "unregistered",
          projectId: fixture.projectId,
          checkoutId: fixture.checkoutId,
          pendingOperation: null,
        });
        expect(readFileSync(fixture.sharedRouterPath, "utf8")).toBe(
          fixture.sharedRouterContent,
        );
        assertFileMapUnchanged(fixture.unrelatedRouters);
      } finally {
        cleanupTempDir(fixture.fixtureRoot);
      }
    },
    120_000,
  );

  test(
    "rejects a symlink in the reviewed backup before a new project operation starts",
    async () => {
      const fixture = await createCompletedRemovalFixture();
      try {
        const backupPaths = [...fixture.backupRouters.keys()];
        const changedBackupPath = backupPaths[0]!;
        const linkTarget = backupPaths[1]!;
        rmSync(changedBackupPath);
        symlinkSync(linkTarget, changedBackupPath);

        const review = reviewCompletedRemovalHandoff(
          fixture.targetDir,
          fixture.storeRoot,
        );
        expect(review).toMatchObject({ status: "blocked" });
        expect(readInstallationStatus(fixture.targetDir, fixture.storeRoot)).toMatchObject({
          status: "unregistered",
          pendingOperation: null,
        });
        assertFileMapUnchanged(fixture.unrelatedRouters);
      } finally {
        cleanupTempDir(fixture.fixtureRoot);
      }
    },
    120_000,
  );

  test(
    "rejects a changed project identity before a new project operation starts",
    async () => {
      const fixture = await createCompletedRemovalFixture();
      try {
        const configPath = path.join(fixture.targetDir, ".make-docs/config.yaml");
        const config = readFileSync(configPath, "utf8");
        const changedConfig = config.replace(
          /projectId: [^\n]+/,
          "projectId: 00000000-0000-4000-8000-000000000008",
        );
        expect(changedConfig).not.toBe(config);
        writeFileSync(configPath, changedConfig, "utf8");

        const review = reviewCompletedRemovalHandoff(
          fixture.targetDir,
          fixture.storeRoot,
        );
        expect(review).toMatchObject({ status: "blocked" });
        expect(
          review.status === "blocked" ? review.blockers.join("\n") : "",
        ).toContain("project identity");
        expect(readInstallationStatus(fixture.targetDir, fixture.storeRoot)).toMatchObject({
          status: "ownership-unverified",
        });
        assertFileMapUnchanged(fixture.unrelatedRouters);
        assertFileMapUnchanged(fixture.backupRouters);
      } finally {
        cleanupTempDir(fixture.fixtureRoot);
      }
    },
    120_000,
  );

  test(
    "rejects malformed target router markers before a new project operation starts",
    async () => {
      const fixture = await createCompletedRemovalFixture();
      try {
        const malformed = `${fixture.sharedRouterContent}\n<!-- make-docs:begin -->\n`;
        writeFileSync(fixture.sharedRouterPath, malformed, "utf8");

        await expect(
          captureStdout(() =>
            runCli([
              "setup",
              "--yes",
              ...NONE_METHODS,
              "--target",
              fixture.targetDir,
            ]),
          ),
        ).rejects.toThrow(/unresolved managed-file diffs/i);
        expect(readInstallationStatus(fixture.targetDir, fixture.storeRoot)).toMatchObject({
          status: "unregistered",
          projectId: fixture.projectId,
          checkoutId: fixture.checkoutId,
          pendingOperation: null,
        });
        expect(readFileSync(fixture.sharedRouterPath, "utf8")).toBe(malformed);
        assertFileMapUnchanged(fixture.unrelatedRouters);
        assertFileMapUnchanged(fixture.backupRouters);
      } finally {
        cleanupTempDir(fixture.fixtureRoot);
      }
    },
    120_000,
  );

  test(
    "rejects a target change after review without creating a project operation",
    async () => {
      const fixture = await createCompletedRemovalFixture();
      try {
        const setupSystem = await import("../src/setup-system");
        const applySystem = setupSystem.applyPreparedSystemSetup;
        const changedTarget = `${fixture.sharedRouterContent}\nChanged after review.\n`;
        vi.spyOn(setupSystem, "applyPreparedSystemSetup").mockImplementation(
          async (prepared) => {
            const result = await applySystem(prepared);
            writeFileSync(fixture.sharedRouterPath, changedTarget, "utf8");
            return result;
          },
        );

        setTTY(true);
        await expect(
          captureStdout(() =>
            runCli([
              "setup",
              "--yes",
              ...NONE_METHODS,
              "--target",
              fixture.targetDir,
            ]),
          ),
        ).rejects.toThrow(/changed after review|snapshot|plan is stale/i);
        expect(readInstallationStatus(fixture.targetDir, fixture.storeRoot)).toMatchObject({
          status: "unregistered",
          projectId: fixture.projectId,
          checkoutId: fixture.checkoutId,
          pendingOperation: null,
        });
        expect(readFileSync(fixture.sharedRouterPath, "utf8")).toBe(changedTarget);
        assertFileMapUnchanged(fixture.unrelatedRouters);
        assertFileMapUnchanged(fixture.backupRouters);
      } finally {
        cleanupTempDir(fixture.fixtureRoot);
      }
    },
    120_000,
  );

  test(
    "resumes an interrupted reviewed reinstall and leaves repeat setup unchanged",
    async () => {
      const fixture = await createCompletedRemovalFixture();
      try {
        const writeContentFile = fileUtils.writeContentFile;
        let writeCount = 0;
        vi.spyOn(fileUtils, "writeContentFile").mockImplementation((target, content) => {
          writeCount += 1;
          if (writeCount === 2) throw new Error("simulated P8 interrupted writer");
          return writeContentFile(target, content);
        });

        setTTY(false);
        const interrupted = JSON.parse(
          await captureStdout(() =>
            runCli([
              "setup",
              "--yes",
              "--json",
              ...NONE_METHODS,
              "--target",
              fixture.targetDir,
            ]),
          ),
        ) as { status: string; project: { mutationState: string } };
        expect(interrupted).toMatchObject({
          status: "blocked",
          project: { mutationState: "partial" },
        });
        const interruptedStatus = readInstallationStatus(
          fixture.targetDir,
          fixture.storeRoot,
        );
        expect(interruptedStatus.status).toBe("recovery-required");
        if (
          !("pendingOperation" in interruptedStatus) ||
          !interruptedStatus.pendingOperation ||
          typeof interruptedStatus.pendingOperation !== "object" ||
          !("operation_id" in interruptedStatus.pendingOperation) ||
          typeof interruptedStatus.pendingOperation.operation_id !== "string"
        ) {
          throw new Error("The P8 interrupted fixture has no pending operation.");
        }

        vi.restoreAllMocks();
        process.env.HOME = fixture.homeDir;
        process.env.MAKE_DOCS_HOME = fixture.storeRoot;
        vi.spyOn(os, "homedir").mockReturnValue(fixture.homeDir);
        const recovered = recoverInstallationOperation(
          fixture.targetDir,
          interruptedStatus.pendingOperation.operation_id,
          "resume",
          false,
          fixture.storeRoot,
        );
        expect(recovered.status).toBe("completed");
        expect(readInstallationStatus(fixture.targetDir, fixture.storeRoot)).toMatchObject({
          status: "ready",
          projectId: fixture.projectId,
          checkoutId: fixture.checkoutId,
          pendingOperation: null,
        });
        assertFileMapUnchanged(fixture.unrelatedRouters);
        assertFileMapUnchanged(fixture.backupRouters);

        const repeat = JSON.parse(
          await captureStdout(() =>
            runCli([
              "setup",
              "--yes",
              "--json",
              ...NONE_METHODS,
              "--target",
              fixture.targetDir,
            ]),
          ),
        ) as { status: string; project: { changed: boolean } };
        expect(repeat).toMatchObject({
          status: "complete",
          project: { changed: false },
        });
      } finally {
        cleanupTempDir(fixture.fixtureRoot);
      }
    },
    120_000,
  );

  test(
    "rolls back an interrupted reviewed reinstall and can run plain setup again",
    async () => {
      const fixture = await createCompletedRemovalFixture();
      try {
        const writeContentFile = fileUtils.writeContentFile;
        let writeCount = 0;
        vi.spyOn(fileUtils, "writeContentFile").mockImplementation((target, content) => {
          writeCount += 1;
          if (writeCount === 2) throw new Error("simulated P8 rollback writer");
          return writeContentFile(target, content);
        });

        setTTY(false);
        await captureStdout(() =>
          runCli([
            "setup",
            "--yes",
            "--json",
            ...NONE_METHODS,
            "--target",
            fixture.targetDir,
          ]),
        );
        const interruptedStatus = readInstallationStatus(
          fixture.targetDir,
          fixture.storeRoot,
        );
        if (
          interruptedStatus.status !== "recovery-required" ||
          !("pendingOperation" in interruptedStatus) ||
          !interruptedStatus.pendingOperation ||
          typeof interruptedStatus.pendingOperation !== "object" ||
          !("operation_id" in interruptedStatus.pendingOperation) ||
          typeof interruptedStatus.pendingOperation.operation_id !== "string"
        ) {
          throw new Error("The P8 rollback fixture has no pending operation.");
        }

        vi.restoreAllMocks();
        process.env.HOME = fixture.homeDir;
        process.env.MAKE_DOCS_HOME = fixture.storeRoot;
        vi.spyOn(os, "homedir").mockReturnValue(fixture.homeDir);
        const rolledBack = recoverInstallationOperation(
          fixture.targetDir,
          interruptedStatus.pendingOperation.operation_id,
          "rollback",
          false,
          fixture.storeRoot,
        );
        expect(rolledBack.status).toBe("rolled-back");
        expect(reviewCompletedRemovalHandoff(
          fixture.targetDir,
          fixture.storeRoot,
        )).toMatchObject({ status: "ready" });

        await captureStdout(() =>
          runCli([
            "setup",
            "--yes",
            ...NONE_METHODS,
            "--target",
            fixture.targetDir,
          ]),
        );
        expect(readInstallationStatus(fixture.targetDir, fixture.storeRoot)).toMatchObject({
          status: "ready",
          projectId: fixture.projectId,
          checkoutId: fixture.checkoutId,
          pendingOperation: null,
        });
        assertFileMapUnchanged(fixture.unrelatedRouters);
        assertFileMapUnchanged(fixture.backupRouters);
      } finally {
        cleanupTempDir(fixture.fixtureRoot);
      }
    },
    120_000,
  );
});

async function createCompletedRemovalFixture(
  routerMode: "managed-block" | "missing-managed-block" = "managed-block",
  backup = true,
  legacyResourceProjection: "all" | "unknown" = "all",
  disableDesigns = false,
): Promise<CompletedRemovalFixture> {
  const fixtureRoot = createTempDir("make-docs-p8-router-reinstall-");
  const targetDir = path.join(fixtureRoot, "project");
  const homeDir = path.join(fixtureRoot, "home");
  const storeRoot = path.join(fixtureRoot, "store");
  mkdirSync(targetDir, { recursive: true });
  mkdirSync(homeDir, { recursive: true });
  process.env.HOME = homeDir;
  process.env.MAKE_DOCS_HOME = storeRoot;
  vi.spyOn(os, "homedir").mockReturnValue(homeDir);

  const selections = defaultSelections();
  selections.skills = false;
  if (disableDesigns) selections.capabilities.designs = false;
  if (legacyResourceProjection === "all") {
    selections.resourceProjection = [...PROJECT_RESOURCE_TYPES];
  }
  const installPlan = await planInstall({
    targetDir,
    selections,
    existingManifest: null,
  });
  applyInstallPlan({ targetDir, plan: installPlan, existingManifest: null });

  const installedStatus = readInstallationStatus(targetDir, storeRoot);
  if (
    installedStatus.status !== "ready" ||
    !("projectId" in installedStatus) ||
    !("checkoutId" in installedStatus) ||
    typeof installedStatus.projectId !== "string" ||
    typeof installedStatus.checkoutId !== "string"
  ) {
    throw new Error("The P8 fixture did not create a ready installation identity.");
  }

  const sharedRouterPath = path.join(targetDir, "AGENTS.md");
  let sharedRouterContent = [
    "# BuildOS project instructions",
    "",
    "Keep this project-owned prefix byte for byte.",
    "",
    readFileSync(sharedRouterPath, "utf8"),
    "Keep this project-owned suffix byte for byte.",
    "",
  ].join("\n");
  if (routerMode === "missing-managed-block") {
    const parsed = parseManagedBlock(sharedRouterContent);
    if (parsed.state !== "valid") {
      throw new Error("The P8 router fixture did not contain a valid managed block.");
    }
    sharedRouterContent = `${parsed.prefix}${parsed.suffix}`;
  }
  writeFileSync(sharedRouterPath, sharedRouterContent, "utf8");

  const assetRouterAssets = createProjectSurfaceRouterAssets(
    installPlan.profile,
    "assets",
  );
  const assetRouterPaths = assetRouterAssets.map((asset) => asset.relativePath);
  const installedManifest = loadManifest(targetDir);
  if (!installedManifest) {
    throw new Error("The P8 fixture lost its installation manifest before legacy conversion.");
  }
  const legacyFiles = { ...installedManifest.files };
  for (const asset of assetRouterAssets) {
    const absolutePath = path.join(targetDir, asset.relativePath);
    const content = typeof asset.content === "string"
      ? asset.content
      : Buffer.from(asset.content).toString("utf8");
    mkdirSync(path.dirname(absolutePath), { recursive: true });
    writeFileSync(absolutePath, content, "utf8");
    legacyFiles[asset.relativePath] = {
      hash: getManifestFileHash(asset.relativePath, content) ?? hashText(content),
      sourceId: asset.sourceId,
      ownershipClass: "managed-block",
    };
  }
  const {
    resourceProjection: _resourceProjection,
    routerOwnership: _routerOwnership,
    ...legacyManifestBase
  } = installedManifest;
  const {
    resourceProjection: _resourceProjectionSelection,
    ...legacySelections
  } = installedManifest.selections;
  saveInstallationManifest(targetDir, {
    ...legacyManifestBase,
    schemaVersion: 3,
    selections: legacySelections,
    files: legacyFiles,
  });

  const unrelatedRouters = new Map<string, string>();
  for (let index = 0; index < UNRELATED_ROUTER_COUNT; index += 1) {
    const relativePath = `services/service-${String(index).padStart(2, "0")}/AGENTS.md`;
    const absolutePath = path.join(targetDir, relativePath);
    const content = `# BuildOS service ${index}\n\nThis router is not owned by Make Docs.\n`;
    mkdirSync(path.dirname(absolutePath), { recursive: true });
    writeFileSync(absolutePath, content, "utf8");
    unrelatedRouters.set(absolutePath, content);
  }

  const syntheticManagedRouters: AuditRemovableFile[] = [];
  for (let index = 0; index < LEGACY_BACKUP_ROUTER_COUNT; index += 1) {
    const relativePath = `legacy/managed-${String(index).padStart(2, "0")}/AGENTS.md`;
    const absolutePath = path.join(targetDir, relativePath);
    const content = [
      "<!-- make-docs:begin -->",
      `# Legacy managed router ${index}`,
      "<!-- make-docs:end -->",
      "",
    ].join("\n");
    mkdirSync(path.dirname(absolutePath), { recursive: true });
    writeFileSync(absolutePath, content, "utf8");
    const currentHash = getManifestFileHash(relativePath, content) ?? hashText(content);
    syntheticManagedRouters.push({
      ...createAuditPathMetadata(targetDir, relativePath, "file", homeDir),
      kind: "file",
      ownershipSource: "manifest-file",
      sourceId: `fixture:legacy-router-${index}`,
      reason: "Exact P8 completed-removal router fixture.",
      reasonCode: "managed-file-hash-match",
      expectedHash: currentHash,
      currentHash,
    });
  }

  const manifest = loadManifest(targetDir);
  if (!manifest) throw new Error("The P8 fixture lost its installation manifest.");
  const audit = await createAuditReport({ targetDir, manifest, homeDir });
  audit.removableFiles.push(...syntheticManagedRouters);

  const removal = await captureStdout(() =>
    runUninstallCommand({
      targetDir,
      homeDir,
      storeRoot,
      auditReport: audit,
      backup,
      permissions: "allow-all",
      now: NOW,
    }),
  );
  expect(removal).toContain("make-docs setup remove");

  const backupRoot = path.join(targetDir, ".make-docs/backup/2026-09-23");
  expect(existsSync(backupRoot)).toBe(backup);
  rmSync(path.join(targetDir, "docs/assets"), { recursive: true, force: true });
  const backupRouters = new Map<string, string>();
  if (backup) {
    for (const relativePath of assetRouterPaths) {
      const backupPath = path.join(backupRoot, relativePath);
      expect(existsSync(path.join(targetDir, relativePath))).toBe(false);
      backupRouters.set(backupPath, readFileSync(backupPath, "utf8"));
    }
    for (let index = 0; index < LEGACY_BACKUP_ROUTER_COUNT; index += 1) {
      const relativePath = `legacy/managed-${String(index).padStart(2, "0")}/AGENTS.md`;
      const sourcePath = path.join(targetDir, relativePath);
      const backupPath = path.join(backupRoot, relativePath);
      expect(existsSync(sourcePath)).toBe(false);
      const content = readFileSync(backupPath, "utf8");
      backupRouters.set(backupPath, content);
    }
  }
  expect(backupRouters.size).toBe(backup ? BACKUP_ROUTER_COUNT : 0);

  return {
    fixtureRoot,
    targetDir,
    homeDir,
    storeRoot,
    backupRoot,
    projectId: installedStatus.projectId,
    checkoutId: installedStatus.checkoutId,
    sharedRouterPath,
    sharedRouterContent,
    assetRouterPaths,
    unrelatedRouters,
    backupRouters,
  };
}

async function captureStdout<T>(run: () => Promise<T>): Promise<string> {
  let output = "";
  const spy = vi.spyOn(process.stdout, "write").mockImplementation((chunk) => {
    output += String(chunk);
    return true;
  });
  try {
    await run();
    return output;
  } finally {
    spy.mockRestore();
  }
}

function assertFileMapUnchanged(files: Map<string, string>): void {
  for (const [file, expected] of files) {
    expect(readFileSync(file, "utf8")).toBe(expected);
  }
}
