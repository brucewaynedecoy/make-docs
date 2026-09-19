import * as os from "node:os";
import path from "node:path";
import { resolveSkillSource } from "./skill-resolver";
import {
  loadSkillRegistry,
  type EffectiveSkillRegistry,
  type SkillRegistry,
  type SkillRegistryEntry,
} from "./skill-registry";
import {
  HARNESSES,
  type Harness,
  type InstallSelections,
  type ResolvedFileAsset,
  type ResolvedInstallAsset,
  type ResolvedSkillExposureAsset,
  type SkillManifestSelectionSource,
  type SkillSelectionProvenanceEntry,
} from "./types";
import { PACKAGE_ROOT } from "./utils";

import { getCanonicalSkillDirectory, getHarnessSkillDirectory } from "./skill-paths";
export { getCanonicalSkillDirectory, getHarnessSkillDirectory } from "./skill-paths";

// No registry skill currently carries retired managed assets. The map stays
// as the seam for future skill-asset retirements; the four withdrawn
// lifecycle skills (closeout-commit, closeout-phase, work-on-phase,
// work-on-wave) were pulled from the registry entirely (D-020 stopgap), so
// their retired-script cleanup now flows through the generic stale-skill
// removal path instead of per-skill retirement entries.
const RETIRED_MANAGED_SKILL_ASSETS: Record<string, string[]> = {};

export interface WizardSkillChoice {
  name: string;
  displayName: string;
  description: string;
  purposes: Array<{ id: string; label: string; description: string }>;
  source: string;
  sourcePolicyKind: SkillRegistry["sourcePolicy"]["kind"];
  supportedHarnesses: Harness[];
  provenanceLabel: string;
  provenanceKind: SkillRegistryEntry["provenance"]["kind"];
}

export async function getDesiredSkillAssets(
  selections: InstallSelections,
  registry = loadSkillRegistry(PACKAGE_ROOT),
): Promise<ResolvedInstallAsset[]> {
  if (!selections.skills) {
    return [];
  }

  const selectedSkills = new Set(selections.selectedSkills);
  const selectedEntries = registry.skills.filter((entry) =>
    selectedSkills.has(entry.name),
  );

  if (selectedEntries.length === 0) {
    return [];
  }

  const installRoot = selections.skillScope === "project" ? "." : os.homedir();
  const desiredAssets = (
    await Promise.all(
      selectedEntries.map(async (entry) => {
        const selectedTools = selections.skillHarnesses ?? selections.harnesses;
        const supportedTools = Object.fromEntries(HARNESSES.map(harness => [harness, selectedTools[harness] && entry.supportedHarnesses.includes(harness)])) as Record<Harness, boolean>;
        if (!HARNESSES.some(harness => supportedTools[harness])) return [];
        const canonicalDirectory = getCanonicalSkillDirectory({ ...selections, skillHarnesses: supportedTools });
        const canonicalRoot = getInstallPath(installRoot, canonicalDirectory);
        const nativeRoots = HARNESSES.filter(harness => supportedTools[harness]).map(harness => getInstallPath(installRoot, getHarnessSkillDirectory(harness, selections.skillScope)));
        if (nativeRoots.some((root,index) => root !== canonicalRoot && nativeRoots.indexOf(root) !== index)) throw new Error(`Selected tools share the same noncanonical Skill directory: ${nativeRoots.join(", ")}. Use distinct CODEX_HOME and CLAUDE_CONFIG_DIR values, or select one tool, then run a fresh review.`);
        const sharedAssets = await buildSharedSkillAssets(entry, installRoot, canonicalDirectory);
        const exposureAssets = HARNESSES.flatMap((harness) => {
          if (
            !(selections.skillHarnesses ?? selections.harnesses)[harness] ||
            !entry.supportedHarnesses.includes(harness) ||
            getInstallPath(installRoot, getHarnessSkillDirectory(harness, selections.skillScope)) === getInstallPath(installRoot, canonicalDirectory)
          ) {
            return [];
          }

          return [
            buildHarnessSkillExposureAsset(
              entry,
              harness,
              installRoot,
              sharedAssets,
              canonicalDirectory,
              getHarnessSkillDirectory(harness, selections.skillScope),
            ),
          ];
        });

        return [...sharedAssets, ...exposureAssets];
      }),
    )
  ).flat();

  return desiredAssets.sort((left, right) =>
    left.relativePath.localeCompare(right.relativePath),
  );
}

export async function getRetiredManagedSkillAssets(
  selections: InstallSelections,
  registry = loadSkillRegistry(PACKAGE_ROOT),
): Promise<ResolvedFileAsset[]> {
  if (!selections.skills) {
    return [];
  }

  const selectedSkills = new Set(selections.selectedSkills);
  const selectedEntries = registry.skills.filter((entry) =>
    selectedSkills.has(entry.name),
  );

  if (selectedEntries.length === 0) {
    return [];
  }

  const installRoot = selections.skillScope === "project" ? "." : os.homedir();
  const retiredAssets = (
    await Promise.all(
      HARNESSES.flatMap((harness) => {
        if (!(selections.skillHarnesses ?? selections.harnesses)[harness]) {
          return [];
        }

        return selectedEntries.map(async (entry) => {
          if (!entry.supportedHarnesses.includes(harness)) {
            return [];
          }

          const [duplicatedPayloadAssets, retiredSupportAssets] =
            await Promise.all([
              buildRetiredDuplicatedSkillPayloadAssets(
                entry,
                harness,
                installRoot,
              ),
              buildRetiredManagedSkillAssets(entry, harness, installRoot),
            ]);

          return [...duplicatedPayloadAssets, ...retiredSupportAssets];
        });
      }),
    )
  ).flat(2);

  return retiredAssets.sort((left, right) =>
    left.relativePath.localeCompare(right.relativePath),
  );
}

export function getRecommendedSkillChoices(
  registry = loadSkillRegistry(PACKAGE_ROOT),
): WizardSkillChoice[] {
  const purposeById = new Map(
    registry.purposes.map((purpose) => [purpose.id, purpose]),
  );
  const purposeOrder = new Map(
    registry.purposes.map((purpose, index) => [
      purpose.id,
      purpose.order ?? index,
    ]),
  );

  const toChoice = (entry: SkillRegistryEntry): WizardSkillChoice => ({
    name: entry.name,
    displayName: entry.displayName,
    description: entry.description,
    purposes: entry.purposes.map((purposeId) => {
      const purpose = purposeById.get(purposeId);
      return {
        id: purposeId,
        label: purpose?.label ?? purposeId,
        description: purpose?.description ?? "",
      };
    }),
    source: entry.source,
    sourcePolicyKind: registry.sourcePolicy.kind,
    supportedHarnesses: [...entry.supportedHarnesses],
    provenanceLabel: entry.provenance.label,
    provenanceKind: entry.provenance.kind,
  });

  return registry.skills
    .map(toChoice)
    .sort((left, right) => {
      const leftPurposeOrder = Math.min(
        ...left.purposes.map((purpose) => purposeOrder.get(purpose.id) ?? 10_000),
      );
      const rightPurposeOrder = Math.min(
        ...right.purposes.map((purpose) => purposeOrder.get(purpose.id) ?? 10_000),
      );
      if (leftPurposeOrder !== rightPurposeOrder) {
        return leftPurposeOrder - rightPurposeOrder;
      }
      return left.name.localeCompare(right.name);
    });
}

export function applySkillRegistrySelectionMetadata(
  selections: InstallSelections,
  effectiveRegistry: EffectiveSkillRegistry,
): InstallSelections {
  const next = structuredClone(selections);
  if (!next.skills) {
    delete next.skillManifest;
    delete next.skillSelectionProvenance;
    return next;
  }

  next.skillManifest = createSkillManifestSelectionSource(effectiveRegistry);
  next.skillSelectionProvenance = createSkillSelectionProvenance(
    effectiveRegistry.registry,
    next.selectedSkills,
  );
  return next;
}

function createSkillManifestSelectionSource(
  effectiveRegistry: EffectiveSkillRegistry,
): SkillManifestSelectionSource {
  const { registry, source } = effectiveRegistry;

  return {
    manifestId: registry.manifestId,
    displayName: registry.displayName,
    sourcePolicyKind: registry.sourcePolicy.kind,
    source:
      source.kind === "built-in"
        ? "built-in"
        : source.kind === "file"
          ? "file"
          : "remote-pinned",
    ...(source.kind === "file" ? { path: source.path } : {}),
    ...(source.kind === "remote-pinned" ? { digest: source.digest } : {}),
  };
}

function createSkillSelectionProvenance(
  registry: SkillRegistry,
  selectedSkills: string[],
): SkillSelectionProvenanceEntry[] {
  const purposeById = new Map(
    registry.purposes.map((purpose) => [purpose.id, purpose]),
  );
  const selectedSkillSet = new Set(selectedSkills);

  return registry.skills
    .filter((skill) => selectedSkillSet.has(skill.name))
    .map((skill) => ({
      skillName: skill.name,
      displayName: skill.displayName,
      manifestId: registry.manifestId,
      manifestDisplayName: registry.displayName,
      sourcePolicyKind: registry.sourcePolicy.kind,
      purposeIds: [...skill.purposes],
      purposeLabels: skill.purposes.map(
        (purposeId) => purposeById.get(purposeId)?.label ?? purposeId,
      ),
      supportedHarnesses: [...skill.supportedHarnesses],
      skillSource: skill.source,
      provenanceKind: skill.provenance.kind,
      provenanceLabel: skill.provenance.label,
      ...(skill.provenance.repository
        ? { repository: skill.provenance.repository }
        : {}),
      ...(skill.provenance.ref ? { ref: skill.provenance.ref } : {}),
      ...(skill.provenance.digest ? { digest: skill.provenance.digest } : {}),
    }))
    .sort((left, right) => left.skillName.localeCompare(right.skillName));
}

async function buildSharedSkillAssets(
  entry: SkillRegistryEntry,
  installRoot: string,
  canonicalDirectory: string,
): Promise<ResolvedFileAsset[]> {
  const resolvedSkill = await resolveSkillSource(
    entry.source,
    entry.entryPoint,
    entry.assets,
  );
  const skillInstallRoot = getInstallPath(
    installRoot,
    canonicalDirectory,
    entry.installName,
  );

  const desiredAssets: ResolvedFileAsset[] = [
    {
      relativePath: getInstallPath(skillInstallRoot, entry.entryPoint),
      assetClass: "static",
      sourceId: getSharedSkillSourceId(entry),
      content: resolvedSkill.entryPointContent,
    },
  ];

  resolvedSkill.assets.forEach((asset) => {
    desiredAssets.push({
      relativePath: getInstallPath(skillInstallRoot, asset.installPath),
      assetClass: "static",
      sourceId: getSharedSkillAssetSourceId(entry.name, asset.installPath),
      content: asset.content,
    });
  });

  return desiredAssets;
}

function buildHarnessSkillExposureAsset(
  entry: SkillRegistryEntry,
  harness: Harness,
  installRoot: string,
  sharedAssets: ResolvedFileAsset[],
  canonicalDirectory: string,
  harnessDirectory: string,
): ResolvedSkillExposureAsset {
  const exposureRoot = getInstallPath(
    installRoot,
    harnessDirectory,
    entry.installName,
  );
  const canonicalPayloadPath = getInstallPath(
    installRoot,
    canonicalDirectory,
    entry.installName,
  );
  const copyMirrorAssets = sharedAssets.map((asset) => {
    const skillRelativePath = path.relative(canonicalPayloadPath, asset.relativePath);

    return {
      ...asset,
      relativePath: getInstallPath(exposureRoot, skillRelativePath),
      sourceId: getCopyMirrorSkillAssetSourceId(
        harness,
        entry.name,
        skillRelativePath,
      ),
    };
  });

  return {
    kind: "skill-exposure",
    relativePath: exposureRoot,
    assetClass: "static",
    sourceId: getSkillExposureSourceId(entry, harness),
    copyMirrorAssets,
    skillExposure: {
      skillName: entry.name,
      installName: entry.installName,
      harness,
      scope: installRoot === "." ? "project" : "global",
      canonicalPayloadPath,
      exposurePath: exposureRoot,
      symlinkTarget: path.relative(path.dirname(exposureRoot), canonicalPayloadPath),
      preferredMode: "symlink",
      copyMirrorSource: canonicalPayloadPath,
    },
  };
}

async function buildRetiredManagedSkillAssets(
  entry: SkillRegistryEntry,
  harness: Harness,
  installRoot: string,
): Promise<ResolvedFileAsset[]> {
  const retiredAssetPaths = RETIRED_MANAGED_SKILL_ASSETS[entry.name] ?? [];
  if (retiredAssetPaths.length === 0) return [];
  const resolvedSkill = await resolveSkillSource(
    entry.source,
    entry.entryPoint,
    retiredAssetPaths.map((assetPath) => ({
      source: assetPath,
      installPath: assetPath,
    })),
  );
  const skillInstallRoot = getInstallPath(
    installRoot,
    getHarnessSkillDirectory(harness, "project"),
    entry.installName,
  );

  return resolvedSkill.assets.map((asset) => ({
    relativePath: getInstallPath(skillInstallRoot, asset.installPath),
    assetClass: "static",
    sourceId: getRetiredSkillAssetSourceId(harness, entry.name, asset.installPath),
    content: asset.content,
  }));
}

async function buildRetiredDuplicatedSkillPayloadAssets(
  entry: SkillRegistryEntry,
  harness: Harness,
  installRoot: string,
): Promise<ResolvedFileAsset[]> {
  const resolvedSkill = await resolveSkillSource(
    entry.source,
    entry.entryPoint,
    entry.assets,
  );
  const skillInstallRoot = getInstallPath(
    installRoot,
    getHarnessSkillDirectory(harness, "project"),
    entry.installName,
  );

  const retiredAssets: ResolvedFileAsset[] = [
    {
      relativePath: getInstallPath(skillInstallRoot, entry.entryPoint),
      assetClass: "static",
      sourceId: getLegacyDuplicatedSkillSourceId(entry, harness),
      content: resolvedSkill.entryPointContent,
    },
  ];

  resolvedSkill.assets.forEach((asset) => {
    retiredAssets.push({
      relativePath: getInstallPath(skillInstallRoot, asset.installPath),
      assetClass: "static",
      sourceId: getLegacyDuplicatedSkillAssetSourceId(
        harness,
        entry.name,
        asset.installPath,
      ),
      content: asset.content,
    });
  });

  return retiredAssets;
}

function getInstallPath(...segments: string[]): string {
  return segments.length > 1 && path.isAbsolute(segments[1])
    ? path.join(...segments.slice(1)) : path.join(...segments);
}

function getSharedSkillSourceId(entry: SkillRegistryEntry): string {
  return `skill:shared:${entry.name}`;
}

function getSharedSkillAssetSourceId(
  skillName: string,
  installPath: string,
): string {
  return `skill-shared-asset:${skillName}:${installPath}`;
}

function getSkillExposureSourceId(
  entry: SkillRegistryEntry,
  harness: Harness,
): string {
  return `skill-exposure:${harness}:${entry.name}`;
}

function getCopyMirrorSkillAssetSourceId(
  harness: Harness,
  skillName: string,
  installPath: string,
): string {
  return `skill-copy-mirror-asset:${harness}:${skillName}:${installPath}`;
}

function getRetiredSkillAssetSourceId(
  harness: Harness,
  skillName: string,
  installPath: string,
): string {
  return `retired-skill-asset:${harness}:${skillName}:${installPath}`;
}

function getLegacyDuplicatedSkillSourceId(
  entry: SkillRegistryEntry,
  harness: Harness,
): string {
  return `skill:${harness}:${entry.name}`;
}

function getLegacyDuplicatedSkillAssetSourceId(
  harness: Harness,
  skillName: string,
  installPath: string,
): string {
  return `skill-asset:${harness}:${skillName}:${installPath}`;
}
