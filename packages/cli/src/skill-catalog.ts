import * as os from "node:os";
import path from "node:path";
import { resolveSkillSource } from "./skill-resolver";
import { loadSkillRegistry, type SkillRegistryEntry } from "./skill-registry";
import {
  HARNESSES,
  type Harness,
  type InstallSelections,
  type ResolvedAsset,
} from "./types";
import { PACKAGE_ROOT } from "./utils";

const HARNESS_SKILL_DIRS: Record<Harness, string> = {
  "claude-code": ".claude/skills",
  codex: ".agents/skills",
};

const RETIRED_MANAGED_SKILL_ASSETS: Record<string, string[]> = {
  "closeout-commit": [
    "scripts/closeout_probe.py",
    "scripts/closeout_validate.py",
    "scripts/closeout_history.py",
  ],
  "closeout-phase": [
    "scripts/closeout_probe.py",
    "scripts/closeout_validate.py",
    "scripts/closeout_history.py",
    "scripts/work_phase_state.py",
  ],
  "work-on-phase": [
    "scripts/work_on_wave_common.py",
    "scripts/resolve_wave.py",
    "scripts/phase_plan.py",
    "scripts/checkpoint.py",
    "scripts/scope_guard.py",
    "scripts/phase_gate.py",
  ],
  "work-on-wave": [
    "scripts/work_on_wave_common.py",
    "scripts/resolve_wave.py",
    "scripts/wave_status.py",
    "scripts/phase_plan.py",
    "scripts/checkpoint.py",
    "scripts/scope_guard.py",
    "scripts/phase_gate.py",
  ],
};

export interface WizardSkillChoice {
  name: string;
  description: string;
}

export async function getDesiredSkillAssets(
  selections: InstallSelections,
): Promise<ResolvedAsset[]> {
  if (!selections.skills) {
    return [];
  }

  const registry = loadSkillRegistry(PACKAGE_ROOT);
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
      HARNESSES.flatMap((harness) => {
        if (!selections.harnesses[harness]) {
          return [];
        }

        return selectedEntries.map((entry) =>
          buildSkillAssets(entry, harness, installRoot),
        );
      }),
    )
  ).flat();

  return desiredAssets.sort((left, right) =>
    left.relativePath.localeCompare(right.relativePath),
  );
}

export async function getRetiredManagedSkillAssets(
  selections: InstallSelections,
): Promise<ResolvedAsset[]> {
  if (!selections.skills) {
    return [];
  }

  const registry = loadSkillRegistry(PACKAGE_ROOT);
  const selectedSkills = new Set(selections.selectedSkills);
  const selectedEntries = registry.skills.filter(
    (entry) =>
      selectedSkills.has(entry.name) &&
      RETIRED_MANAGED_SKILL_ASSETS[entry.name]?.length > 0,
  );

  if (selectedEntries.length === 0) {
    return [];
  }

  const installRoot = selections.skillScope === "project" ? "." : os.homedir();
  const retiredAssets = (
    await Promise.all(
      HARNESSES.flatMap((harness) => {
        if (!selections.harnesses[harness]) {
          return [];
        }

        return selectedEntries.map((entry) =>
          buildRetiredManagedSkillAssets(entry, harness, installRoot),
        );
      }),
    )
  ).flat();

  return retiredAssets.sort((left, right) =>
    left.relativePath.localeCompare(right.relativePath),
  );
}

export function getRecommendedSkillChoices(): WizardSkillChoice[] {
  const registry = loadSkillRegistry(PACKAGE_ROOT);

  const toChoice = (
    entry: Pick<SkillRegistryEntry, "name" | "description">,
  ): WizardSkillChoice => ({
    name: entry.name,
    description: entry.description,
  });

  return registry.skills
    .map(toChoice)
    .sort((left, right) => left.name.localeCompare(right.name));
}

async function buildSkillAssets(
  entry: SkillRegistryEntry,
  harness: Harness,
  installRoot: string,
): Promise<ResolvedAsset[]> {
  const resolvedSkill = await resolveSkillSource(
    entry.source,
    entry.entryPoint,
    entry.assets,
  );
  const skillInstallRoot = getInstallPath(
    installRoot,
    HARNESS_SKILL_DIRS[harness],
    entry.installName,
  );

  const desiredAssets: ResolvedAsset[] = [
    {
      relativePath: getInstallPath(skillInstallRoot, entry.entryPoint),
      assetClass: "static",
      sourceId: getSkillSourceId(entry, harness),
      content: resolvedSkill.entryPointContent,
    },
  ];

  resolvedSkill.assets.forEach((asset) => {
    desiredAssets.push({
      relativePath: getInstallPath(skillInstallRoot, asset.installPath),
      assetClass: "static",
      sourceId: getSkillAssetSourceId(harness, entry.name, asset.installPath),
      content:
        typeof asset.content === "string"
          ? asset.content
          : asset.content.toString("utf8"),
    });
  });

  return desiredAssets;
}

async function buildRetiredManagedSkillAssets(
  entry: SkillRegistryEntry,
  harness: Harness,
  installRoot: string,
): Promise<ResolvedAsset[]> {
  const retiredAssetPaths = RETIRED_MANAGED_SKILL_ASSETS[entry.name] ?? [];
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
    HARNESS_SKILL_DIRS[harness],
    entry.installName,
  );

  return resolvedSkill.assets.map((asset) => ({
    relativePath: getInstallPath(skillInstallRoot, asset.installPath),
    assetClass: "static",
    sourceId: getRetiredSkillAssetSourceId(harness, entry.name, asset.installPath),
    content:
      typeof asset.content === "string"
        ? asset.content
        : asset.content.toString("utf8"),
  }));
}

function getInstallPath(...segments: string[]): string {
  return path.join(...segments);
}

function getSkillSourceId(entry: SkillRegistryEntry, harness: Harness): string {
  return `skill:${harness}:${entry.name}`;
}

function getSkillAssetSourceId(
  harness: Harness,
  skillName: string,
  installPath: string,
): string {
  return `skill-asset:${harness}:${skillName}:${installPath}`;
}

function getRetiredSkillAssetSourceId(
  harness: Harness,
  skillName: string,
  installPath: string,
): string {
  return `retired-skill-asset:${harness}:${skillName}:${installPath}`;
}
