import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createAuditReport } from "../src/audit";
import { planInstall } from "../src/install";
import { createManifest, loadManifest, writeManifest } from "../src/manifest";
import {
  createPluginManifestFileEntries,
  resolvePluginSubstrate,
  type PluginArtifactDefinition,
  type PluginHarnessExposureDeclaration,
} from "../src/plugin-substrate";
import { defaultSelections, resolveInstallProfile } from "../src/profile";
import { createEmptySystemAssetManifestState } from "../src/system-assets";
import type {
  InstallManifest,
  ManifestFileEntry,
  ResolvedPluginPayloadAsset,
  ResolvedPluginExposureAsset,
} from "../src/types";
import { runUninstallCommand } from "../src/uninstall";
import { hashText } from "../src/utils";
import { mockSkillFetches } from "./helpers";

const tempRoots: string[] = [];
const PLUGIN_ID = "product-development-review";

function createTempRoot(): string {
  const root = mkdtempSync(path.join(tmpdir(), "make-docs-plugin-lifecycle-"));
  tempRoots.push(root);
  return root;
}

function pluginDefinition(
  overrides: Partial<PluginArtifactDefinition> = {},
): PluginArtifactDefinition {
  return {
    pluginId: PLUGIN_ID,
    title: "Product Development Review",
    summary: "Review product-development work through a supported harness plugin.",
    status: "provisional",
    sourceManifest: {
      manifestId: "first-party-plugins",
      displayName: "Make Docs first-party plugins",
      source: "built-in",
    },
    ref: "package:first-party/product-development-review",
    version: "0.0.0-test",
    digest: "sha256:plugin-digest",
    provenance: "make-docs first-party plugin fixture",
    trustPolicy: {
      kind: "first-party",
      description: "Bundled make-docs fixture.",
    },
    supportedHarnesses: ["codex", "claude-code"],
    supportStatus: "provisional",
    payload: [
      {
        installPath: "plugin.json",
        content: "{\"name\":\"product-development-review\"}\n",
      },
      {
        installPath: "README.md",
        content: "# Product Development Review\n",
      },
    ],
    ...overrides,
  };
}

function nativeCodexExposure(): PluginHarnessExposureDeclaration {
  return {
    harness: "codex",
    exposureKind: "native",
    pathTemplate: ".agents/plugins/{pluginId}",
  };
}

function generatedClaudeExposure(): PluginHarnessExposureDeclaration {
  return {
    harness: "claude-code",
    exposureKind: "generated-adapter",
    pathTemplate: ".claude/plugins/{pluginId}/plugin.json",
    adapterContent: "{\"adapter\":\"claude-code\"}\n",
    adapterDigest: "sha256:adapter-digest",
  };
}

function createPluginSelections() {
  const selections = defaultSelections();
  selections.plugins = true;
  selections.pluginScope = "project";
  selections.selectedPlugins = [PLUGIN_ID];
  selections.pluginManifest = {
    manifestId: "first-party-plugins",
    displayName: "Make Docs first-party plugins",
    sourcePolicyKind: "first-party",
    source: "built-in",
    digest: "sha256:plugins-manifest",
  };
  selections.pluginSelectionProvenance = [
    {
      pluginId: PLUGIN_ID,
      title: "Product Development Review",
      manifestId: "first-party-plugins",
      manifestDisplayName: "Make Docs first-party plugins",
      sourcePolicyKind: "first-party",
      supportedHarnesses: ["codex", "claude-code"],
      pluginSource: "built-in",
      provenanceKind: "first-party",
      provenanceLabel: "Bundled make-docs plugin fixture",
      supportStatus: "provisional",
      ref: "package:first-party/product-development-review",
      digest: "sha256:plugin-digest",
    },
  ];
  return selections;
}

function createPluginManifest(
  targetDir: string,
  files: Record<string, ManifestFileEntry>,
): InstallManifest {
  const manifest = createManifest(
    { name: "@brucewaynedecoy/make-docs", version: "0.0.0-test" },
    resolveInstallProfile(createPluginSelections()),
    files,
    [],
    createEmptySystemAssetManifestState(),
    "plugin-lifecycle-test-project",
  );
  writeManifest(targetDir, manifest);
  return loadManifest(targetDir)!;
}

function writePluginPayloads(
  targetDir: string,
  payloadAssets: ResolvedPluginPayloadAsset[],
): void {
  for (const asset of payloadAssets) {
    writeProjectFile(targetDir, asset.relativePath, asset.content);
  }
}

function writeGeneratedAdapter(
  targetDir: string,
  exposure: ResolvedPluginExposureAsset,
): void {
  if (exposure.generatedAdapterAsset) {
    writeProjectFile(
      targetDir,
      exposure.generatedAdapterAsset.relativePath,
      exposure.generatedAdapterAsset.content,
    );
  }
}

function writeNativeSymlinkExposure(
  targetDir: string,
  exposure: ResolvedPluginExposureAsset,
): void {
  const absoluteExposurePath = path.join(targetDir, exposure.relativePath);
  mkdirSync(path.dirname(absoluteExposurePath), { recursive: true });
  symlinkSync(
    exposure.pluginExposure.symlinkTarget ?? "",
    absoluteExposurePath,
    "dir",
  );
}

function writeCopyMirrorExposure(
  targetDir: string,
  exposure: ResolvedPluginExposureAsset,
): void {
  for (const mirror of exposure.copyMirrorAssets) {
    writeProjectFile(targetDir, mirror.relativePath, mirror.content);
  }
}

function activateCopyMirrorExposure(
  exposure: ResolvedPluginExposureAsset,
): void {
  exposure.pluginExposure.mode = "copy-mirror";
  exposure.agenticOwnership.exposureMode = "copy-mirror";
}

function addCopyMirrorEntries(
  files: Record<string, ManifestFileEntry>,
  exposure: ResolvedPluginExposureAsset,
): void {
  for (const mirror of exposure.copyMirrorAssets) {
    files[mirror.relativePath] = {
      hash: hashText(mirror.content),
      sourceId: mirror.sourceId,
      agenticOwnership: mirror.agenticOwnership,
    };
  }
}

function writeProjectFile(
  targetDir: string,
  relativePath: string,
  content: string,
): void {
  const absolutePath = path.isAbsolute(relativePath)
    ? relativePath
    : path.join(targetDir, relativePath);
  mkdirSync(path.dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, content, "utf8");
}

async function captureStdout<T>(callback: () => Promise<T>): Promise<T> {
  const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

  try {
    return await callback();
  } finally {
    writeSpy.mockRestore();
  }
}

describe("plugin lifecycle safety", () => {
  beforeEach(() => {
    mockSkillFetches();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    for (const root of tempRoots.splice(0)) {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("keeps selected skill state separate from future plugin selection state", async () => {
    const targetDir = createTempRoot();
    const selections = defaultSelections();
    selections.skills = true;
    selections.selectedSkills = ["archive-docs"];

    const plan = await planInstall({
      targetDir,
      selections,
      existingManifest: null,
    });

    expect(plan.profile.selections.plugins).toBe(false);
    expect(plan.profile.selections.selectedPlugins).toEqual([]);
    expect(plan.actions.map((action) => action.relativePath)).not.toEqual(
      expect.arrayContaining([
        expect.stringContaining(".make-docs/agentics/plugins/"),
        expect.stringContaining(".agents/plugins/"),
        expect.stringContaining(".claude/plugins/"),
      ]),
    );
  });

  test("round-trips explicit plugin selections through the manifest", () => {
    const targetDir = createTempRoot();
    const manifest = createPluginManifest(targetDir, {});

    expect(manifest.selections.plugins).toBe(true);
    expect(manifest.selections.pluginScope).toBe("project");
    expect(manifest.selections.selectedPlugins).toEqual([PLUGIN_ID]);
    expect(manifest.selections.pluginManifest).toMatchObject({
      manifestId: "first-party-plugins",
      sourcePolicyKind: "first-party",
      source: "built-in",
    });
    expect(manifest.selections.pluginSelectionProvenance).toEqual([
      expect.objectContaining({
        pluginId: PLUGIN_ID,
        provenanceKind: "first-party",
        supportStatus: "provisional",
      }),
    ]);
  });

  test.skipIf(process.platform === "win32")(
    "classifies plugin payloads, symlink exposures, generated adapters, and stale symlink-child records",
    async () => {
      const targetDir = createTempRoot();
      const resolution = resolvePluginSubstrate(
        pluginDefinition(),
        { scope: "project" },
        [nativeCodexExposure(), generatedClaudeExposure()],
      );
      const codexExposure = resolution.exposureAssets.find(
        (asset) => asset.pluginExposure.harness === "codex",
      )!;
      const claudeExposure = resolution.exposureAssets.find(
        (asset) => asset.pluginExposure.harness === "claude-code",
      )!;
      const files = createPluginManifestFileEntries(resolution);
      addCopyMirrorEntries(files, codexExposure);

      expect(files[`${codexExposure.relativePath}/plugin.json`]).toBeDefined();

      writePluginPayloads(targetDir, resolution.payloadAssets);
      writeNativeSymlinkExposure(targetDir, codexExposure);
      writeGeneratedAdapter(targetDir, claudeExposure);
      const manifest = createPluginManifest(targetDir, files);

      const report = await createAuditReport({ targetDir, manifest });

      expect(report.pluginSelectionReview).toMatchObject({
        pluginsEnabled: true,
        pluginScope: "project",
        selectedPlugins: [PLUGIN_ID],
      });
      expect(report.removableFiles).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ".make-docs/agentics/plugins/product-development-review/plugin.json",
            agenticRole: "plugin-payload",
            reasonCode: "managed-plugin-file-content-match",
          }),
          expect.objectContaining({
            path: ".agents/plugins/product-development-review",
            agenticRole: "plugin-native-exposure",
            kind: "directory",
            reasonCode: "managed-plugin-exposure-symlink-match",
          }),
          expect.objectContaining({
            path: ".claude/plugins/product-development-review/plugin.json",
            agenticRole: "plugin-generated-adapter",
            reasonCode: "managed-plugin-file-content-match",
          }),
        ]),
      );
      expect(report.removableFiles).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ".agents/plugins/product-development-review/plugin.json",
          }),
        ]),
      );
      expect(report.preservedPaths).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ".agents/plugins/product-development-review/plugin.json",
            agenticRole: "plugin-copy-mirror",
            reasonCode: "manifest-plugin-exposure-mismatch",
          }),
        ]),
      );
    },
  );

  test("classifies clean and modified plugin copy-mirror exposures", async () => {
    const targetDir = createTempRoot();
    const resolution = resolvePluginSubstrate(
      pluginDefinition({ supportedHarnesses: ["codex"] }),
      { scope: "project" },
      [nativeCodexExposure()],
    );
    const codexExposure = resolution.exposureAssets[0]!;
    activateCopyMirrorExposure(codexExposure);
    const files = createPluginManifestFileEntries(resolution);

    writePluginPayloads(targetDir, resolution.payloadAssets);
    writeCopyMirrorExposure(targetDir, codexExposure);
    const manifest = createPluginManifest(targetDir, files);

    const cleanReport = await createAuditReport({ targetDir, manifest });
    expect(cleanReport.removableFiles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ".agents/plugins/product-development-review",
          agenticRole: "plugin-native-exposure",
          reasonCode: "managed-plugin-exposure-copy-mirror-match",
        }),
        expect.objectContaining({
          path: ".agents/plugins/product-development-review/plugin.json",
          agenticRole: "plugin-copy-mirror",
          reasonCode: "managed-plugin-file-content-match",
        }),
      ]),
    );

    writeProjectFile(
      targetDir,
      ".agents/plugins/product-development-review/plugin.json",
      "{\"name\":\"local-edit\"}\n",
    );
    const modifiedReport = await createAuditReport({ targetDir, manifest });

    expect(modifiedReport.removableFiles).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ".agents/plugins/product-development-review",
        }),
      ]),
    );
      expect(modifiedReport.preservedPaths).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ".agents/plugins/product-development-review",
            reasonCode: "directory-contains-preserved-descendants",
            preservedDescendantPaths: [
              ".agents/plugins/product-development-review/plugin.json",
            ],
          }),
          expect.objectContaining({
            path: ".agents/plugins/product-development-review/plugin.json",
          agenticRole: "plugin-copy-mirror",
          reasonCode: "manifest-plugin-file-content-mismatch",
        }),
      ]),
    );
  });

  test("preserves user-authored harness plugins when no manifest proves ownership", async () => {
    const targetDir = createTempRoot();
    const userPluginPath = path.join(
      targetDir,
      ".agents/plugins/product-development-review/plugin.json",
    );
    mkdirSync(path.dirname(userPluginPath), { recursive: true });
    writeFileSync(userPluginPath, "{\"name\":\"user-authored\"}\n", "utf8");

    const report = await createAuditReport({ targetDir, manifest: null });

    expect(report.removableFiles.map((entry) => entry.path)).not.toContain(
      ".agents/plugins/product-development-review/plugin.json",
    );
    expect(report.preservedPaths).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ".agents/plugins",
          reasonCode: "fallback-ambiguous",
        }),
      ]),
    );

    await captureStdout(() =>
      runUninstallCommand({
        targetDir,
        backup: false,
        permissions: "allow-all",
      }),
    );

    expect(existsSync(userPluginPath)).toBe(true);
  });
});
