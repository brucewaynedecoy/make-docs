import { mkdirSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { applyInstallPlan, planInstall } from "../src/install";
import { getManifestPath, loadManifest, writeManifest } from "../src/manifest";
import { defaultSelections } from "../src/profile";
import { createSystemAssetManifestState } from "../src/system-assets";
import type {
  InstallManifest,
  InstallSelections,
  SystemAssetManifestState,
  SystemAssetMaterializationMode,
} from "../src/types";
import { createTempDir } from "./helpers";

export type CompatibilitySourceState =
  | "clean-v1"
  | "clean-v2-full-snapshot"
  | "clean-v2-provider-backed"
  | "clean-v2-hybrid-pinned-cache"
  | "modified-v1"
  | "partial-install"
  | "malformed-manifest"
  | "missing-manifest-recognizable"
  | "unknown-shape";

export type CompatibilityDisposition =
  | "sync"
  | "migrate"
  | "migrate-with-review"
  | "backup-and-reinstall"
  | "manual-review-required";

export type CompatibilityFixtureVariant =
  | "provider-unavailable"
  | "stale-cache-hashes"
  | "malformed-managed-block"
  | "canonical-missing-manifest-files"
  | "ambiguous-missing-manifest-files"
  | "non-make-docs-path-collision";

export interface CompatibilityFixtureCase {
  id: string;
  state: CompatibilitySourceState;
  disposition: CompatibilityDisposition;
  variant?: CompatibilityFixtureVariant;
}

export interface CompatibilityFixture extends CompatibilityFixtureCase {
  targetDir: string;
  manifestPath: string;
  manifest: InstallManifest | null;
}

export const COMPATIBILITY_SOURCE_STATES = [
  "clean-v1",
  "clean-v2-full-snapshot",
  "clean-v2-provider-backed",
  "clean-v2-hybrid-pinned-cache",
  "modified-v1",
  "partial-install",
  "malformed-manifest",
  "missing-manifest-recognizable",
  "unknown-shape",
] as const satisfies readonly CompatibilitySourceState[];

export const COMPATIBILITY_DEFAULT_DISPOSITIONS = {
  "clean-v1": "migrate",
  "clean-v2-full-snapshot": "sync",
  "clean-v2-provider-backed": "sync",
  "clean-v2-hybrid-pinned-cache": "sync",
  "modified-v1": "migrate-with-review",
  "partial-install": "migrate-with-review",
  "malformed-manifest": "backup-and-reinstall",
  "missing-manifest-recognizable": "migrate-with-review",
  "unknown-shape": "manual-review-required",
} as const satisfies Record<CompatibilitySourceState, CompatibilityDisposition>;

export const COMPATIBILITY_FIXTURE_CASES = [
  createCase("clean-v1"),
  createCase("clean-v2-full-snapshot"),
  createCase("clean-v2-provider-backed"),
  createCase("clean-v2-hybrid-pinned-cache"),
  createCase("modified-v1"),
  createCase("partial-install"),
  createCase("malformed-manifest"),
  createCase("missing-manifest-recognizable"),
  createCase("unknown-shape"),
  createCase("clean-v2-provider-backed", "provider-unavailable"),
  createCase("clean-v2-hybrid-pinned-cache", "stale-cache-hashes"),
  createCase("modified-v1", "malformed-managed-block"),
  createCase("missing-manifest-recognizable", "canonical-missing-manifest-files"),
  createCase("missing-manifest-recognizable", "ambiguous-missing-manifest-files"),
  createCase("unknown-shape", "non-make-docs-path-collision"),
] as const satisfies readonly CompatibilityFixtureCase[];

export async function createCompatibilityFixture(
  fixtureCase: CompatibilityFixtureCase,
): Promise<CompatibilityFixture> {
  const targetDir = createTempDir("make-docs-compat-");
  const manifestPath = getManifestPath(targetDir);

  switch (fixtureCase.id) {
    case "clean-v1":
      await installFixture(targetDir);
      writeLegacyV1Manifest(targetDir);
      break;
    case "clean-v2-full-snapshot":
      await installFixture(targetDir);
      ensureSystemAssetManifestState(targetDir, "full-snapshot");
      break;
    case "clean-v2-provider-backed":
      await installFixture(targetDir, undefined, "provider-backed");
      ensureSystemAssetManifestState(targetDir, "provider-backed");
      break;
    case "clean-v2-hybrid-pinned-cache":
      await installFixture(targetDir, undefined, "hybrid-pinned-cache");
      ensureSystemAssetManifestState(targetDir, "hybrid-pinned-cache");
      break;
    case "modified-v1":
      await installFixture(targetDir);
      writeLegacyV1Manifest(targetDir);
      writeFixtureFile(targetDir, "docs/AGENTS.md", "user modified managed file\n");
      break;
    case "partial-install":
      await installFixture(targetDir);
      rmSync(path.join(targetDir, ".make-docs/references/system"), {
        recursive: true,
        force: true,
      });
      break;
    case "malformed-manifest":
      writeFixtureFile(targetDir, ".make-docs/manifest.json", "{ malformed\n");
      writeFixtureFile(targetDir, "docs/AGENTS.md", "# make-docs managed candidate\n");
      break;
    case "missing-manifest-recognizable":
      await installFixture(targetDir);
      unlinkSync(manifestPath);
      break;
    case "unknown-shape":
      writeFixtureFile(targetDir, "notes/project.md", "# User notes\n");
      break;
    case "clean-v2-provider-backed-provider-unavailable":
      await installFixture(targetDir, undefined, "provider-backed");
      markFirstSystemAssetProviderUnavailable(targetDir);
      break;
    case "clean-v2-hybrid-pinned-cache-stale-cache-hashes":
      await installFixture(targetDir, undefined, "hybrid-pinned-cache");
      markFirstSystemAssetHashStale(targetDir);
      break;
    case "modified-v1-malformed-managed-block":
      await installFixture(targetDir);
      writeLegacyV1Manifest(targetDir);
      writeFixtureFile(
        targetDir,
        "AGENTS.md",
        "<!-- make-docs:begin -->\nunterminated managed block\n",
      );
      break;
    case "missing-manifest-recognizable-canonical-missing-manifest-files":
      await installFixture(targetDir);
      unlinkSync(manifestPath);
      break;
    case "missing-manifest-recognizable-ambiguous-missing-manifest-files":
      await installFixture(targetDir);
      unlinkSync(manifestPath);
      writeFixtureFile(targetDir, "docs/AGENTS.md", "# Local docs instructions\n");
      break;
    case "unknown-shape-non-make-docs-path-collision":
      writeFixtureFile(targetDir, "notes/AGENTS.md", "# Local notes agent file\n");
      break;
    default:
      throw new Error(`Unsupported compatibility fixture: ${fixtureCase.id}`);
  }

  return {
    ...fixtureCase,
    targetDir,
    manifestPath,
    manifest: loadFixtureManifest(targetDir),
  };
}

export async function createCompatibilityFixtureMatrix(): Promise<
  CompatibilityFixture[]
> {
  return Promise.all(
    COMPATIBILITY_FIXTURE_CASES.map((fixtureCase) =>
      createCompatibilityFixture(fixtureCase),
    ),
  );
}

function createCase(
  state: CompatibilitySourceState,
  variant?: CompatibilityFixtureVariant,
): CompatibilityFixtureCase {
  return {
    id: variant === undefined ? state : `${state}-${variant}`,
    state,
    disposition: COMPATIBILITY_DEFAULT_DISPOSITIONS[state],
    ...(variant === undefined ? {} : { variant }),
  };
}

async function installFixture(
  targetDir: string,
  configure: (selections: InstallSelections) => void = () => {},
  systemAssetMaterializationMode?: SystemAssetMaterializationMode,
): Promise<InstallManifest> {
  const selections = defaultSelections();
  configure(selections);
  const existingManifest = loadManifest(targetDir);
  const plan = await planInstall({
    targetDir,
    selections,
    existingManifest,
    systemAssetMaterializationMode,
  });
  applyInstallPlan({ targetDir, plan, existingManifest });
  return loadManifest(targetDir)!;
}

function writeLegacyV1Manifest(targetDir: string): void {
  const manifest = loadManifest(targetDir)!;
  const legacyManifest = {
    ...manifest,
    schemaVersion: 1,
    updatedAt: "2026-06-25T00:00:00.000Z",
  } as Record<string, unknown>;
  delete legacyManifest.systemAssetMaterialization;
  writeFixtureFile(
    targetDir,
    ".make-docs/manifest.json",
    `${JSON.stringify(legacyManifest, null, 2)}\n`,
  );
}

function markFirstSystemAssetProviderUnavailable(targetDir: string): void {
  const manifest = ensureSystemAssetManifestState(targetDir, "provider-backed");
  const firstEntry = Object.values(manifest.systemAssetMaterialization.assets)[0];
  if (firstEntry !== undefined) {
    firstEntry.sourceProvider = "unavailable-test-provider";
  }
  writeManifest(targetDir, manifest);
}

function markFirstSystemAssetHashStale(targetDir: string): void {
  const manifest = ensureSystemAssetManifestState(targetDir, "hybrid-pinned-cache");
  const firstEntry = Object.values(manifest.systemAssetMaterialization.assets)[0];
  if (firstEntry !== undefined) {
    firstEntry.expectedHashes = ["stale-fixture-hash"];
  }
  writeManifest(targetDir, manifest);
}

function ensureSystemAssetManifestState(
  targetDir: string,
  mode: SystemAssetMaterializationMode,
): InstallManifest & { systemAssetMaterialization: SystemAssetManifestState } {
  const manifest = loadManifest(targetDir)! as InstallManifest & {
    systemAssetMaterialization?: SystemAssetManifestState;
  };
  const existingEntries = manifest.systemAssetMaterialization?.assets;
  if (existingEntries !== undefined && Object.keys(existingEntries).length > 0) {
    return manifest as InstallManifest & {
      systemAssetMaterialization: SystemAssetManifestState;
    };
  }

  manifest.systemAssetMaterialization = createSystemAssetManifestState({
    mode,
    sourcePackage: manifest.packageName,
    sourceVersion: manifest.packageVersion,
    localBootstrapPaths: ["AGENTS.md"],
    deferredSystemAssetPaths: [".make-docs/references/system/lifecycle.md"],
    materializationClasses: {
      "AGENTS.md": "always-local-bootstrap",
      ".make-docs/references/system/lifecycle.md": "materialized-system-asset",
    },
    expectedFiles: {
      ".make-docs/references/system/lifecycle.md": {
        hash: "fixture-expected-hash",
        sourceId: ".make-docs/references/system/lifecycle.md",
      },
    },
    materializedFiles: {
      ".make-docs/references/system/lifecycle.md": {
        hash: "fixture-expected-hash",
        sourceId: ".make-docs/references/system/lifecycle.md",
      },
    },
  });
  writeManifest(targetDir, manifest as InstallManifest);
  return manifest as InstallManifest & {
    systemAssetMaterialization: SystemAssetManifestState;
  };
}

function loadFixtureManifest(targetDir: string): InstallManifest | null {
  try {
    return loadManifest(targetDir);
  } catch {
    return null;
  }
}

function writeFixtureFile(
  targetDir: string,
  relativePath: string,
  content: string,
): void {
  const absolutePath = path.join(targetDir, relativePath);
  mkdirSync(path.dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, content);
}
