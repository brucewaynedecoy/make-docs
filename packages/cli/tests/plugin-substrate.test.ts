import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import { createManifest, loadManifest, writeManifest } from "../src/manifest";
import {
  createPluginManifestFileEntries,
  formatPluginSubstrateDryRunLines,
  resolvePluginPayloadRoot,
  resolvePluginSubstrate,
  validatePluginArtifactDefinition,
  validatePluginHarnessExposureDeclaration,
  type PluginArtifactDefinition,
  type PluginHarnessExposureDeclaration,
} from "../src/plugin-substrate";
import { defaultSelections, resolveInstallProfile } from "../src/profile";
import { createEmptySystemAssetManifestState } from "../src/system-assets";

const tempRoots: string[] = [];

function createTempRoot(): string {
  const root = mkdtempSync(path.join(tmpdir(), "make-docs-plugin-substrate-"));
  tempRoots.push(root);
  return root;
}

function pluginDefinition(
  overrides: Partial<PluginArtifactDefinition> = {},
): PluginArtifactDefinition {
  return {
    pluginId: "product-development-review",
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

function exposureDeclarations(): PluginHarnessExposureDeclaration[] {
  return [
    {
      harness: "codex",
      exposureKind: "native",
      pathTemplate: ".agents/plugins/{pluginId}",
    },
    {
      harness: "claude-code",
      exposureKind: "generated-adapter",
      pathTemplate: ".claude/plugins/{pluginId}/plugin.json",
      adapterContent: "{\"adapter\":\"claude-code\"}\n",
      adapterDigest: "sha256:adapter-digest",
    },
  ];
}

describe("plugin substrate", () => {
  afterEach(() => {
    for (const root of tempRoots.splice(0)) {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("resolves project plugin payloads and separates native exposures from adapters", () => {
    const resolution = resolvePluginSubstrate(
      pluginDefinition(),
      { scope: "project" },
      exposureDeclarations(),
    );

    expect(resolution.canonicalPayloadPath).toBe(
      ".make-docs/agentics/plugins/product-development-review",
    );
    expect(resolution.payloadAssets.map((asset) => asset.relativePath)).toEqual([
      ".make-docs/agentics/plugins/product-development-review/plugin.json",
      ".make-docs/agentics/plugins/product-development-review/README.md",
    ]);
    expect(
      resolution.payloadAssets.every(
        (asset) => asset.agenticOwnership.role === "plugin-payload",
      ),
    ).toBe(true);

    const codexExposure = resolution.exposureAssets.find(
      (asset) => asset.pluginExposure.harness === "codex",
    );
    const claudeAdapter = resolution.exposureAssets.find(
      (asset) => asset.pluginExposure.harness === "claude-code",
    );

    expect(codexExposure?.relativePath).toBe(
      ".agents/plugins/product-development-review",
    );
    expect(codexExposure?.agenticOwnership).toMatchObject({
      artifactKind: "plugin",
      role: "plugin-native-exposure",
      pathKind: "directory",
      exposureMode: "symlink",
    });
    expect(codexExposure?.pluginExposure).toMatchObject({
      canonicalPayloadPath: ".make-docs/agentics/plugins/product-development-review",
      symlinkTarget: "../../.make-docs/agentics/plugins/product-development-review",
      preferredMode: "symlink",
    });
    expect(codexExposure?.copyMirrorAssets.map((asset) => asset.relativePath)).toEqual([
      ".agents/plugins/product-development-review/plugin.json",
      ".agents/plugins/product-development-review/README.md",
    ]);
    expect(
      codexExposure?.copyMirrorAssets.every(
        (asset) => asset.agenticOwnership.role === "plugin-copy-mirror",
      ),
    ).toBe(true);

    expect(claudeAdapter?.relativePath).toBe(
      ".claude/plugins/product-development-review/plugin.json",
    );
    expect(claudeAdapter?.agenticOwnership).toMatchObject({
      artifactKind: "plugin",
      role: "plugin-generated-adapter",
      pathKind: "file",
      exposureMode: "generated-adapter",
    });
    expect(claudeAdapter?.copyMirrorAssets).toEqual([]);
    expect(claudeAdapter?.generatedAdapterAsset?.content).toBe(
      "{\"adapter\":\"claude-code\"}\n",
    );
  });

  test("resolves global plugin payloads and exposures under the home-scoped root", () => {
    const homeDir = path.join(tmpdir(), "make-docs-home");
    const normalizedHomeDir = homeDir.split(path.sep).join("/");
    const resolution = resolvePluginSubstrate(
      pluginDefinition({
        supportedHarnesses: ["codex"],
      }),
      { scope: "global", homeDir },
      [
        {
          harness: "codex",
          exposureKind: "native",
          pathTemplate: ".agents/plugins/{pluginId}",
        },
      ],
    );

    expect(resolvePluginPayloadRoot("product-development-review", {
      scope: "global",
      homeDir,
    })).toBe(`${normalizedHomeDir}/.make-docs/agentics/plugins/product-development-review`);
    expect(
      resolution.payloadAssets.every((asset) =>
        asset.relativePath.startsWith(
          `${normalizedHomeDir}/.make-docs/agentics/plugins/product-development-review/`,
        ),
      ),
    ).toBe(true);
    expect(resolution.exposureAssets[0]?.relativePath).toBe(
      `${normalizedHomeDir}/.agents/plugins/product-development-review`,
    );
  });

  test("creates manifest ownership entries that survive manifest validation", () => {
    const targetDir = createTempRoot();
    const resolution = resolvePluginSubstrate(
      pluginDefinition(),
      { scope: "project" },
      exposureDeclarations(),
    );
    const files = createPluginManifestFileEntries(resolution);
    const manifest = createManifest(
      { name: "@brucewaynedecoy/make-docs", version: "0.0.0-test" },
      resolveInstallProfile(defaultSelections()),
      files,
      [],
      createEmptySystemAssetManifestState(),
    );

    writeManifest(targetDir, manifest);
    const loaded = loadManifest(targetDir);

    expect(
      loaded?.files[
        ".make-docs/agentics/plugins/product-development-review/plugin.json"
      ]?.agenticOwnership,
    ).toMatchObject({
      artifactKind: "plugin",
      role: "plugin-payload",
      sourceManifest: "first-party-plugins",
      trustPolicy: { kind: "first-party" },
      supportStatus: "provisional",
    });
    expect(
      loaded?.files[".agents/plugins/product-development-review"]?.agenticOwnership,
    ).toMatchObject({
      artifactKind: "plugin",
      role: "plugin-native-exposure",
      pathKind: "directory",
    });
    expect(
      loaded?.files[
        ".claude/plugins/product-development-review/plugin.json"
      ]?.agenticOwnership?.role,
    ).toBe("plugin-generated-adapter");
  });

  test("formats dry-run lines with plugin payload and exposure paths separated", () => {
    const resolution = resolvePluginSubstrate(
      pluginDefinition(),
      { scope: "project" },
      exposureDeclarations(),
    );

    expect(formatPluginSubstrateDryRunLines(resolution)).toEqual([
      "- plugin generated adapter: .claude/plugins/product-development-review/plugin.json",
      "- plugin native harness exposure: .agents/plugins/product-development-review",
      "- plugin payload: .make-docs/agentics/plugins/product-development-review/README.md",
      "- plugin payload: .make-docs/agentics/plugins/product-development-review/plugin.json",
    ]);
    expect(
      formatPluginSubstrateDryRunLines(resolution, { includeCopyMirrors: true }),
    ).toContain(
      "- plugin managed copy mirror: .agents/plugins/product-development-review/plugin.json",
    );
  });

  test("fails closed for unsafe plugin substrate fixtures", () => {
    expect(() => validatePluginArtifactDefinition(pluginDefinition({
      pluginId: "Product Review",
    }))).toThrow("pluginId must be a lowercase slug");
    expect(() => validatePluginArtifactDefinition(pluginDefinition({
      payload: [],
    }))).toThrow("payload must include at least one file");
    expect(() => validatePluginHarnessExposureDeclaration({
      harness: "codex",
      exposureKind: "native",
      pathTemplate: ".agents/plugins/review",
    })).toThrow("pathTemplate must include {pluginId}");
  });
});
