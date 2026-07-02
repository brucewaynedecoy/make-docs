import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { classifyCompatibilityState } from "../src/compatibility";
import {
  detectInstallSource,
  detectPreV2Install,
  promptPreV2Choice,
  runToolUninstallCommand,
  runToolUpdateCommand,
  SELF_PACKAGE_NAME,
  type SelfCommandOutput,
} from "../src/self";
import { bootstrapGlobalStore, getStoreDatabasePath } from "../src/store";
import { createCompatibilityFixture } from "./compatibility-fixtures";
import { cleanupTempDir, createTempDir, setTTY } from "./helpers";

const clackMocks = vi.hoisted(() => ({
  confirm: vi.fn(),
  select: vi.fn(),
  intro: vi.fn(),
  note: vi.fn(),
  outro: vi.fn(),
}));

vi.mock("@clack/prompts", async () => {
  const actual =
    await vi.importActual<typeof import("@clack/prompts")>("@clack/prompts");

  return {
    ...actual,
    confirm: clackMocks.confirm,
    select: clackMocks.select,
    intro: clackMocks.intro,
    isCancel: (value: unknown) => value === "cancelled",
    note: clackMocks.note,
    outro: clackMocks.outro,
  };
});

const NPX_ARGV1 =
  "/Users/tester/.npm/_npx/1a2b3c4d/node_modules/@brucewaynedecoy/make-docs/dist/cli.js";
const NPM_GLOBAL_ARGV1 =
  "/usr/local/lib/node_modules/@brucewaynedecoy/make-docs/dist/cli.js";
const AMBIGUOUS_ARGV1 =
  "/Users/tester/dev/make-docs/packages/cli/dist/cli.js";
const FAKE_EXEC_PATH = "/usr/local/bin/node";

const identityRealpath = (candidate: string) => candidate;

function createOutputCollector(): { output: SelfCommandOutput; lines: string[] } {
  const lines: string[] = [];
  return {
    lines,
    output: {
      write(text) {
        lines.push(text);
      },
    },
  };
}

function createExecMock() {
  return vi.fn(async () => ({ exitCode: 0 }));
}

describe("tool self-management", () => {
  beforeEach(() => {
    clackMocks.confirm.mockReset();
    clackMocks.select.mockReset();
    clackMocks.intro.mockReset();
    clackMocks.note.mockReset();
    clackMocks.outro.mockReset();
    setTTY(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("install-source detection matrix", () => {
    test("classifies npx cache paths as remote execution", () => {
      const detection = detectInstallSource({
        argv1: NPX_ARGV1,
        execPath: FAKE_EXEC_PATH,
        realpath: identityRealpath,
      });

      expect(detection.kind).toBe("remote");
    });

    test("classifies an npm global root as an npm-owned persistent install", () => {
      const detection = detectInstallSource({
        argv1: NPM_GLOBAL_ARGV1,
        execPath: FAKE_EXEC_PATH,
        realpath: identityRealpath,
      });

      expect(detection.kind).toBe("persistent");
      expect(detection.kind === "persistent" && detection.manager.id).toBe("npm");
    });

    test("classifies unknown paths as ambiguous, never guessing", () => {
      const detection = detectInstallSource({
        argv1: AMBIGUOUS_ARGV1,
        execPath: FAKE_EXEC_PATH,
        realpath: identityRealpath,
      });

      expect(detection.kind).toBe("ambiguous");
      expect(detection.kind === "ambiguous" && detection.candidates).toEqual([]);
    });
  });

  describe("runToolUninstallCommand (R-SELF-1, R-SELF-3)", () => {
    test("refuses without confirmation when non-TTY and --yes is absent", async () => {
      const storeRoot = createTempDir("make-docs-self-store-");
      bootstrapGlobalStore({ storeRoot });
      setTTY(false);
      const exec = createExecMock();
      const { output, lines } = createOutputCollector();

      try {
        const result = await runToolUninstallCommand({
          yes: false,
          storeRoot,
          argv1: NPM_GLOBAL_ARGV1,
          execPath: FAKE_EXEC_PATH,
          realpath: identityRealpath,
          exec,
          output,
        });

        expect(result.status).toBe("refused-non-interactive");
        expect(result.storeRemoval).toBeNull();
        expect(existsSync(getStoreDatabasePath(storeRoot))).toBe(true);
        expect(exec).not.toHaveBeenCalled();
        expect(lines.join("\n")).toContain("make-docs uninstall --yes");
      } finally {
        cleanupTempDir(storeRoot);
      }
    });

    test("cancelling the interactive confirmation removes nothing", async () => {
      const storeRoot = createTempDir("make-docs-self-store-");
      bootstrapGlobalStore({ storeRoot });
      clackMocks.confirm.mockResolvedValue(false);
      const exec = createExecMock();
      const { output } = createOutputCollector();

      try {
        const result = await runToolUninstallCommand({
          yes: false,
          storeRoot,
          argv1: NPM_GLOBAL_ARGV1,
          execPath: FAKE_EXEC_PATH,
          realpath: identityRealpath,
          exec,
          output,
        });

        expect(result.status).toBe("cancelled");
        expect(result.storeRemoval).toBeNull();
        expect(existsSync(getStoreDatabasePath(storeRoot))).toBe(true);
        expect(exec).not.toHaveBeenCalled();
      } finally {
        cleanupTempDir(storeRoot);
      }
    });

    test("--yes removes the store and reports no binary for a remote-execution path", async () => {
      const storeRoot = createTempDir("make-docs-self-store-");
      bootstrapGlobalStore({ storeRoot });
      const exec = createExecMock();
      const { output, lines } = createOutputCollector();

      const result = await runToolUninstallCommand({
        yes: true,
        storeRoot,
        argv1: NPX_ARGV1,
        execPath: FAKE_EXEC_PATH,
        realpath: identityRealpath,
        exec,
        output,
      });

      expect(result.status).toBe("completed");
      expect(result.storeRemoval?.status).toBe("removed");
      expect(existsSync(storeRoot)).toBe(false);
      expect(result.binary?.kind).toBe("not-installed");
      expect(exec).not.toHaveBeenCalled();
      expect(lines.join("\n")).toContain("No make-docs binary is installed");
    });

    test("runs the owning manager's uninstall command for an unambiguous persistent install", async () => {
      const storeRoot = createTempDir("make-docs-self-store-");
      bootstrapGlobalStore({ storeRoot });
      const exec = createExecMock();
      const { output } = createOutputCollector();

      const result = await runToolUninstallCommand({
        yes: true,
        storeRoot,
        argv1: NPM_GLOBAL_ARGV1,
        execPath: FAKE_EXEC_PATH,
        realpath: identityRealpath,
        exec,
        output,
      });

      expect(result.status).toBe("completed");
      expect(result.binary?.kind).toBe("removed");
      expect(exec).toHaveBeenCalledTimes(1);
      expect(exec).toHaveBeenCalledWith("npm", [
        "uninstall",
        "-g",
        SELF_PACKAGE_NAME,
      ]);
    });

    test("ambiguous binary ownership prints the exact commands and store path without executing", async () => {
      const storeRoot = createTempDir("make-docs-self-store-");
      bootstrapGlobalStore({ storeRoot });
      const exec = createExecMock();
      const { output, lines } = createOutputCollector();

      const result = await runToolUninstallCommand({
        yes: true,
        storeRoot,
        argv1: AMBIGUOUS_ARGV1,
        execPath: FAKE_EXEC_PATH,
        realpath: identityRealpath,
        exec,
        output,
      });

      expect(result.status).toBe("manual-binary-removal-required");
      expect(result.binary?.kind).toBe("manual");
      expect(exec).not.toHaveBeenCalled();
      const rendered = lines.join("\n");
      expect(rendered).toContain(`npm uninstall -g ${SELF_PACKAGE_NAME}`);
      expect(rendered).toContain(`Affected store path: ${storeRoot}`);
    });

    test("never deletes repository content: sibling repo fixture stays untouched and project-like roots are refused", async () => {
      const parentDir = createTempDir("make-docs-self-safety-");
      const storeRoot = path.join(parentDir, "store");
      bootstrapGlobalStore({ storeRoot });
      const repoDir = path.join(parentDir, "repo");
      mkdirSync(path.join(repoDir, "docs"), { recursive: true });
      writeFileSync(path.join(repoDir, "docs/AGENTS.md"), "# repo content\n");
      writeFileSync(path.join(repoDir, "README.md"), "# repo readme\n");
      const exec = createExecMock();

      try {
        const result = await runToolUninstallCommand({
          yes: true,
          storeRoot,
          argv1: NPX_ARGV1,
          execPath: FAKE_EXEC_PATH,
          realpath: identityRealpath,
          exec,
          output: createOutputCollector().output,
        });

        expect(result.storeRemoval?.status).toBe("removed");
        expect(existsSync(storeRoot)).toBe(false);
        expect(readFileSync(path.join(repoDir, "docs/AGENTS.md"), "utf8")).toBe(
          "# repo content\n",
        );
        expect(readFileSync(path.join(repoDir, "README.md"), "utf8")).toBe(
          "# repo readme\n",
        );

        // A store root that looks like a project .make-docs/ directory is
        // refused outright (R-LIFE-1 / R-TEST-4 seam).
        const projectLikeRoot = path.join(parentDir, "project-make-docs");
        mkdirSync(path.join(projectLikeRoot, "references"), { recursive: true });
        writeFileSync(path.join(projectLikeRoot, "config.yaml"), "profile: full\n");

        const refused = await runToolUninstallCommand({
          yes: true,
          storeRoot: projectLikeRoot,
          argv1: NPX_ARGV1,
          execPath: FAKE_EXEC_PATH,
          realpath: identityRealpath,
          exec,
          output: createOutputCollector().output,
        });

        expect(refused.storeRemoval?.status).toBe("refused");
        expect(existsSync(path.join(projectLikeRoot, "config.yaml"))).toBe(true);
        expect(existsSync(path.join(projectLikeRoot, "references"))).toBe(true);
        expect(exec).not.toHaveBeenCalled();
      } finally {
        cleanupTempDir(parentDir);
      }
    });
  });

  describe("runToolUpdateCommand (R-SELF-2, R-SELF-3)", () => {
    test("remote execution reports nothing persistent and still bootstraps the store", async () => {
      const storeRoot = createTempDir("make-docs-self-store-");
      cleanupTempDir(storeRoot);
      const targetDir = createTempDir("make-docs-self-target-");
      const exec = createExecMock();
      const { output, lines } = createOutputCollector();

      try {
        const result = await runToolUpdateCommand({
          yes: false,
          targetDir,
          storeRoot,
          argv1: NPX_ARGV1,
          execPath: FAKE_EXEC_PATH,
          realpath: identityRealpath,
          exec,
          output,
        });

        expect(result.status).toBe("nothing-persistent");
        expect(exec).not.toHaveBeenCalled();
        expect(existsSync(getStoreDatabasePath(storeRoot))).toBe(true);
        expect(["created", "ready"]).toContain(result.bootstrap.databaseStatus);
        expect(lines.join("\n")).toContain("Nothing persistent to update");
      } finally {
        cleanupTempDir(storeRoot);
        cleanupTempDir(targetDir);
      }
    });

    test("delegates to npm with the exact update command for an unambiguous global install", async () => {
      const storeRoot = createTempDir("make-docs-self-store-");
      const targetDir = createTempDir("make-docs-self-target-");
      const exec = createExecMock();
      const { output } = createOutputCollector();

      try {
        const result = await runToolUpdateCommand({
          yes: false,
          targetDir,
          storeRoot,
          argv1: NPM_GLOBAL_ARGV1,
          execPath: FAKE_EXEC_PATH,
          realpath: identityRealpath,
          exec,
          output,
        });

        expect(result.status).toBe("delegated");
        expect(result.executedCommand).toBe(
          `npm install -g ${SELF_PACKAGE_NAME}@latest`,
        );
        expect(exec).toHaveBeenCalledTimes(1);
        expect(exec).toHaveBeenCalledWith("npm", [
          "install",
          "-g",
          `${SELF_PACKAGE_NAME}@latest`,
        ]);
      } finally {
        cleanupTempDir(storeRoot);
        cleanupTempDir(targetDir);
      }
    });

    test("ambiguous detection prints the exact command and store path without executing", async () => {
      const storeRoot = createTempDir("make-docs-self-store-");
      const targetDir = createTempDir("make-docs-self-target-");
      const exec = createExecMock();
      const { output, lines } = createOutputCollector();

      try {
        const result = await runToolUpdateCommand({
          yes: false,
          targetDir,
          storeRoot,
          argv1: AMBIGUOUS_ARGV1,
          execPath: FAKE_EXEC_PATH,
          realpath: identityRealpath,
          exec,
          output,
        });

        expect(result.status).toBe("manual-update-required");
        expect(exec).not.toHaveBeenCalled();
        expect(result.printedCommands).toContain(
          `npm install -g ${SELF_PACKAGE_NAME}@latest`,
        );
        const rendered = lines.join("\n");
        expect(rendered).toContain(`npm install -g ${SELF_PACKAGE_NAME}@latest`);
        expect(rendered).toContain(`Affected store path: ${storeRoot}`);
      } finally {
        cleanupTempDir(storeRoot);
        cleanupTempDir(targetDir);
      }
    });

    test("a pre-v2 target cancels non-interactively without delegating (R-MIG-2)", async () => {
      const storeRoot = createTempDir("make-docs-self-store-");
      const fixture = await createCompatibilityFixture({
        id: "clean-v1",
        state: "clean-v1",
        disposition: "migrate",
      });
      setTTY(false);
      const exec = createExecMock();
      const { output, lines } = createOutputCollector();

      try {
        const result = await runToolUpdateCommand({
          yes: false,
          targetDir: fixture.targetDir,
          storeRoot,
          argv1: NPM_GLOBAL_ARGV1,
          execPath: FAKE_EXEC_PATH,
          realpath: identityRealpath,
          exec,
          output,
        });

        expect(result.status).toBe("cancelled-pre-v2");
        expect(result.preV2.preV2).toBe(true);
        expect(result.preV2Choice).toBe("cancel");
        expect(exec).not.toHaveBeenCalled();
        expect(lines.join("\n")).toContain("will not silently upgrade");
        // Manifest untouched: the pre-v2 install is left exactly as found.
        expect(
          JSON.parse(readFileSync(fixture.manifestPath, "utf8")).schemaVersion,
        ).toBe(1);
      } finally {
        cleanupTempDir(storeRoot);
        cleanupTempDir(fixture.targetDir);
      }
    });

    test("choosing backup-and-install backs up the pre-v2 target and then delegates", async () => {
      const storeRoot = createTempDir("make-docs-self-store-");
      const fixture = await createCompatibilityFixture({
        id: "clean-v1",
        state: "clean-v1",
        disposition: "migrate",
      });
      clackMocks.select.mockResolvedValue("backup-and-install");
      const exec = createExecMock();
      const runBackup = vi.fn(async () => {});
      const { output } = createOutputCollector();

      try {
        const result = await runToolUpdateCommand({
          yes: false,
          targetDir: fixture.targetDir,
          storeRoot,
          argv1: NPM_GLOBAL_ARGV1,
          execPath: FAKE_EXEC_PATH,
          realpath: identityRealpath,
          exec,
          runBackup,
          output,
        });

        expect(result.preV2Choice).toBe("backup-and-install");
        expect(runBackup).toHaveBeenCalledWith(fixture.targetDir);
        expect(result.status).toBe("delegated");
        expect(exec).toHaveBeenCalledWith("npm", [
          "install",
          "-g",
          `${SELF_PACKAGE_NAME}@latest`,
        ]);
      } finally {
        cleanupTempDir(storeRoot);
        cleanupTempDir(fixture.targetDir);
      }
    });
  });

  describe("pre-v2 detection and choice (R-MIG-2)", () => {
    test("flags a schemaVersion-1 manifest and not a v2 install", async () => {
      const v1Fixture = await createCompatibilityFixture({
        id: "clean-v1",
        state: "clean-v1",
        disposition: "migrate",
      });
      const v2Fixture = await createCompatibilityFixture({
        id: "clean-v2-full-snapshot",
        state: "clean-v2-full-snapshot",
        disposition: "sync",
      });

      try {
        const v1Classification = await classifyCompatibilityState({
          targetDir: v1Fixture.targetDir,
        });
        const v2Classification = await classifyCompatibilityState({
          targetDir: v2Fixture.targetDir,
        });

        const v1Detection = detectPreV2Install({
          targetDir: v1Fixture.targetDir,
          classification: v1Classification,
        });
        const v2Detection = detectPreV2Install({
          targetDir: v2Fixture.targetDir,
          classification: v2Classification,
        });

        expect(v1Detection.preV2).toBe(true);
        expect(v1Detection.fingerprints).toContain("manifest-schema-version-1");
        expect(v1Detection.fingerprints).toContain("state-clean-v1");
        expect(v2Detection.preV2).toBe(false);
        expect(v2Detection.fingerprints).toEqual([]);
      } finally {
        cleanupTempDir(v1Fixture.targetDir);
        cleanupTempDir(v2Fixture.targetDir);
      }
    });

    test("returns the selected choice interactively", async () => {
      const detection = {
        preV2: true,
        fingerprints: ["manifest-schema-version-1"],
      };

      clackMocks.select.mockResolvedValueOnce("backup-and-install");
      await expect(
        promptPreV2Choice({
          detection,
          interactive: true,
          command: "update",
          output: createOutputCollector().output,
        }),
      ).resolves.toBe("backup-and-install");

      clackMocks.select.mockResolvedValueOnce("cancel");
      await expect(
        promptPreV2Choice({
          detection,
          interactive: true,
          command: "setup",
          output: createOutputCollector().output,
        }),
      ).resolves.toBe("cancel");

      // A clack cancel (Ctrl+C) also maps to "cancel".
      clackMocks.select.mockResolvedValueOnce("cancelled");
      await expect(
        promptPreV2Choice({
          detection,
          interactive: true,
          command: "setup reconfigure",
          output: createOutputCollector().output,
        }),
      ).resolves.toBe("cancel");

      expect(clackMocks.note).toHaveBeenCalled();
    });

    test("refuses non-interactive runs with an explanation and no prompt", async () => {
      const { output, lines } = createOutputCollector();

      const choice = await promptPreV2Choice({
        detection: { preV2: true, fingerprints: ["state-modified-v1"] },
        interactive: false,
        command: "update",
        output,
      });

      expect(choice).toBe("cancel");
      expect(clackMocks.select).not.toHaveBeenCalled();
      const rendered = lines.join("\n");
      expect(rendered).toContain("will not silently upgrade");
      expect(rendered).toContain("make-docs setup remove");
    });
  });
});
