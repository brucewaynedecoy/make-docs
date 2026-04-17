import path from "node:path";
import { readTextFile } from "./utils";

export interface SkillAssetEntry {
  source: string;
  installPath: string;
}

export interface SkillRegistryEntry {
  name: string;
  source: string;
  entryPoint: string;
  installName: string;
  required: boolean;
  description: string;
  plugin?: string;
  assets: SkillAssetEntry[];
}

export interface SkillRegistry {
  skills: SkillRegistryEntry[];
}

const REGISTRY_FILENAME = "skill-registry.json";

export function loadSkillRegistry(packageRoot: string): SkillRegistry {
  const registryPath = path.join(packageRoot, REGISTRY_FILENAME);

  let raw: string;
  try {
    raw = readTextFile(registryPath);
  } catch (cause) {
    throw new Error(`Skill registry not found at ${registryPath}`, { cause });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (cause) {
    throw new Error(`Skill registry at ${registryPath} is not valid JSON`, { cause });
  }

  if (!isPlainObject(parsed) || !Array.isArray((parsed as { skills?: unknown }).skills)) {
    throw new Error(`Skill registry at ${registryPath} must have a \`skills\` array`);
  }

  const skills: SkillRegistryEntry[] = [];
  for (const [index, entry] of ((parsed as { skills: unknown[] }).skills).entries()) {
    const validated = validateEntry(entry, index);
    if (validated) {
      skills.push(validated);
    }
  }

  return { skills };
}

export function getOptionalSkills(registry: SkillRegistry): SkillRegistryEntry[] {
  return registry.skills.filter((skill) => skill.required === false);
}

export function getRequiredSkills(registry: SkillRegistry): SkillRegistryEntry[] {
  return registry.skills.filter((skill) => skill.required === true);
}

export function getSkillsByPlugin(
  registry: SkillRegistry,
  plugin: string,
): SkillRegistryEntry[] {
  return registry.skills.filter((skill) => skill.plugin === plugin);
}

function validateEntry(entry: unknown, index: number): SkillRegistryEntry | null {
  if (!isPlainObject(entry)) {
    console.warn(`Skill registry entry at index ${index} is not an object; skipping.`);
    return null;
  }

  const name = readRequiredString(entry, "name", `entry at index ${index}`);
  if (name === null) return null;

  const source = readRequiredString(entry, "source", `entry \`${name}\``);
  const entryPoint = readRequiredString(entry, "entryPoint", `entry \`${name}\``);
  const installName = readRequiredString(entry, "installName", `entry \`${name}\``);
  if (source === null || entryPoint === null || installName === null) return null;

  if (!Array.isArray(entry.assets)) {
    console.warn(`Skill registry entry \`${name}\` is missing \`assets\` array; skipping.`);
    return null;
  }

  const assets: SkillAssetEntry[] = [];
  for (const [assetIndex, asset] of entry.assets.entries()) {
    if (
      !isPlainObject(asset) ||
      typeof asset.source !== "string" ||
      typeof asset.installPath !== "string"
    ) {
      console.warn(
        `Skill \`${name}\` asset at index ${assetIndex} is invalid; skipping asset.`,
      );
      continue;
    }
    assets.push({ source: asset.source, installPath: asset.installPath });
  }

  return {
    name,
    source,
    entryPoint,
    installName,
    required: entry.required === true,
    description: typeof entry.description === "string" ? entry.description : "",
    plugin: typeof entry.plugin === "string" ? entry.plugin : undefined,
    assets,
  };
}

function readRequiredString(
  entry: Record<string, unknown>,
  field: string,
  context: string,
): string | null {
  const value = entry[field];
  if (typeof value !== "string" || value.length === 0) {
    console.warn(`Skill registry ${context} is missing required field \`${field}\`; skipping.`);
    return null;
  }
  return value;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
