import * as os from "node:os";
import path from "node:path";
import { resolveSkillSource } from "./skill-resolver";
import {
  getOptionalSkills,
  getRequiredSkills,
  loadSkillRegistry,
  type SkillRegistryEntry,
} from "./skill-registry";
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

export interface WizardSkillChoice {
  name: string;
  description: string;
}

export interface GroupedSkillChoices {
  defaultSkills: WizardSkillChoice[];
  optionalSkills: WizardSkillChoice[];
}

export async function getDesiredSkillAssets(
  selections: InstallSelections,
): Promise<ResolvedAsset[]> {
  if (!selections.skills) {
    return [];
  }

  const registry = loadSkillRegistry(PACKAGE_ROOT);
  const selectedOptionalSkills = new Set(selections.optionalSkills);
  const selectedEntries = registry.skills.filter(
    (entry) => entry.required || selectedOptionalSkills.has(entry.name),
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

export function getGroupedSkillChoices(): GroupedSkillChoices {
  const registry = loadSkillRegistry(PACKAGE_ROOT);

  const toChoice = (
    entry: Pick<SkillRegistryEntry, "name" | "description">,
  ): WizardSkillChoice => ({
    name: entry.name,
    description: entry.description,
  });

  return {
    defaultSkills: getRequiredSkills(registry)
      .map(toChoice)
      .sort((left, right) => left.name.localeCompare(right.name)),
    optionalSkills: getOptionalSkills(registry)
      .map(toChoice)
      .sort((left, right) => left.name.localeCompare(right.name)),
  };
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
