import * as os from "node:os";
import path from "node:path";
import { resolveLocalPath, resolveSkillSource } from "./skill-resolver";
import { loadSkillRegistry, type SkillAssetEntry, type SkillRegistryEntry } from "./skill-registry";
import { HARNESSES, type Harness, type InstallSelections, type ResolvedAsset } from "./types";
import { PACKAGE_ROOT } from "./utils";

const REPO_ROOT = path.resolve(PACKAGE_ROOT, "..", "..");

const HARNESS_DIRS: Record<Harness, { skillsDir: string; assetsDir: string }> = {
  "claude-code": {
    skillsDir: ".claude/skills",
    assetsDir: ".claude/skill-assets",
  },
  codex: {
    skillsDir: ".agents/skills",
    assetsDir: ".agents/skill-assets",
  },
};

const MARKDOWN_LINK_RE = /(!?\[[^\]]*]\()(<[^>\n]+>|[^)\s]+)([^)]*\))/g;
const CODE_SPAN_RE = /`([^`\n]+)`/g;

interface AssetRewriteTarget {
  sourcePath: string;
  installPath: string;
}

interface RewriteOptions {
  content: string;
  sourceRoot: string;
  sourceEntryPointPath: string;
  skillInstallPath: string;
  assetTargets: AssetRewriteTarget[];
}

export function getDesiredSkillAssets(selections: InstallSelections): ResolvedAsset[] {
  if (!selections.skills) {
    return [];
  }

  const registry = loadSkillRegistry(PACKAGE_ROOT);
  const installRoot = selections.skillScope === "project" ? "." : os.homedir();
  const desiredAssets: ResolvedAsset[] = [];

  for (const harness of HARNESSES) {
    if (!selections.harnesses[harness]) {
      continue;
    }

    for (const entry of registry.skills) {
      desiredAssets.push(...buildSkillAssets(entry, harness, installRoot));
    }
  }

  return desiredAssets.sort((left, right) => left.relativePath.localeCompare(right.relativePath));
}

function buildSkillAssets(
  entry: SkillRegistryEntry,
  harness: Harness,
  installRoot: string,
): ResolvedAsset[] {
  const sourceDir = resolveLocalPath(entry.source, REPO_ROOT);
  const resolvedSkill = resolveSkillSource(entry.source, entry.entryPoint, entry.assets, REPO_ROOT);
  const harnessDirs = HARNESS_DIRS[harness];
  const skillInstallPath = getInstallPath(installRoot, harnessDirs.skillsDir, entry.installName);
  const assetTargets = entry.assets.map((asset) => ({
    sourcePath: resolveLocalPath(asset.source, REPO_ROOT),
    installPath: getInstallPath(installRoot, harnessDirs.assetsDir, asset.installPath),
  }));

  const desiredAssets: ResolvedAsset[] = [
    {
      relativePath: skillInstallPath,
      assetClass: "static",
      sourceId: getSkillSourceId(entry, harness),
      content: rewriteSkillEntryPoint({
        content: resolvedSkill.entryPointContent,
        sourceRoot: getSourceRoot(sourceDir, entry.assets),
        sourceEntryPointPath: path.join(sourceDir, entry.entryPoint),
        skillInstallPath,
        assetTargets,
      }),
    },
  ];

  resolvedSkill.assets.forEach((asset, index) => {
    desiredAssets.push({
      relativePath: assetTargets[index].installPath,
      assetClass: "static",
      sourceId: getSkillAssetSourceId(entry, harness, entry.assets[index]),
      content: typeof asset.content === "string" ? asset.content : asset.content.toString("utf8"),
    });
  });

  return desiredAssets;
}

function rewriteSkillEntryPoint(options: RewriteOptions): string {
  const assetTargetsByResolvedPath = new Map(
    options.assetTargets.map((target) => [path.resolve(target.sourcePath), target.installPath]),
  );
  const assetTargetsByLogicalPath = new Map(
    options.assetTargets.map((target) => [
      normalizeMarkdownPath(path.relative(options.sourceRoot, target.sourcePath)),
      target.installPath,
    ]),
  );
  const sourceEntryDir = path.dirname(options.sourceEntryPointPath);
  const skillInstallDir = path.dirname(options.skillInstallPath);

  const rewriteReference = (rawReference: string): string | null => {
    const [referencePath, suffix] = splitReferenceSuffix(rawReference);
    if (!isRelativeReference(referencePath)) {
      return null;
    }

    const resolvedSourcePath = path.resolve(sourceEntryDir, referencePath);
    const installPath =
      assetTargetsByResolvedPath.get(resolvedSourcePath) ??
      assetTargetsByLogicalPath.get(normalizeMarkdownPath(referencePath));
    if (!installPath) {
      return null;
    }

    const rewrittenPath = path.relative(skillInstallDir, installPath);
    return `${normalizeMarkdownPath(rewrittenPath)}${suffix}`;
  };

  let rewritten = options.content.replace(
    MARKDOWN_LINK_RE,
    (match, prefix: string, target: string, suffix: string) => {
      const wrappedInAngles = target.startsWith("<") && target.endsWith(">");
      const rawTarget = wrappedInAngles ? target.slice(1, -1) : target;
      const rewrittenTarget = rewriteReference(rawTarget);
      if (!rewrittenTarget) {
        return match;
      }

      const nextTarget = wrappedInAngles ? `<${rewrittenTarget}>` : rewrittenTarget;
      return `${prefix}${nextTarget}${suffix}`;
    },
  );

  rewritten = rewritten.replace(CODE_SPAN_RE, (match, codeContent: string) => {
    const tokenMatch = /^(\S+)([\s\S]*)$/.exec(codeContent);
    if (!tokenMatch) {
      return match;
    }

    const rewrittenToken = rewriteReference(tokenMatch[1]);
    if (!rewrittenToken) {
      return match;
    }

    return `\`${rewrittenToken}${tokenMatch[2]}\``;
  });

  return rewritten;
}

function getInstallPath(installRoot: string, baseDir: string, filePath: string): string {
  const baseSegments = baseDir.split("/");
  const fileSegments = filePath.split("/");

  if (installRoot === ".") {
    return path.posix.join(...baseSegments, ...fileSegments);
  }

  return path.join(installRoot, ...baseSegments, ...fileSegments);
}

function getSkillSourceId(entry: SkillRegistryEntry, harness: Harness): string {
  return `skill:${harness}:${entry.source}:${entry.entryPoint}`;
}

function getSkillAssetSourceId(
  entry: SkillRegistryEntry,
  harness: Harness,
  asset: SkillAssetEntry,
): string {
  return `skill-asset:${harness}:${entry.source}:${asset.source}`;
}

function splitReferenceSuffix(reference: string): [string, string] {
  const hashIndex = reference.indexOf("#");
  const queryIndex = reference.indexOf("?");

  if (hashIndex === -1 && queryIndex === -1) {
    return [reference, ""];
  }

  if (hashIndex === -1) {
    return [reference.slice(0, queryIndex), reference.slice(queryIndex)];
  }

  if (queryIndex === -1) {
    return [reference.slice(0, hashIndex), reference.slice(hashIndex)];
  }

  const splitIndex = Math.min(hashIndex, queryIndex);
  return [reference.slice(0, splitIndex), reference.slice(splitIndex)];
}

function isRelativeReference(reference: string): boolean {
  return (
    reference.length > 0 &&
    !reference.startsWith("#") &&
    !reference.startsWith("/") &&
    !/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(reference)
  );
}

function normalizeMarkdownPath(filePath: string): string {
  return filePath.split(path.sep).join("/");
}

function getSourceRoot(sourceDir: string, assets: SkillAssetEntry[]): string {
  if (assets.length === 0) {
    return sourceDir;
  }

  const sourcePaths = [sourceDir, ...assets.map((asset) => resolveLocalPath(asset.source, REPO_ROOT))];
  return sourcePaths.reduce((currentRoot, candidate) => commonAncestor(currentRoot, candidate));
}

function commonAncestor(left: string, right: string): string {
  const leftParts = path.resolve(left).split(path.sep).filter(Boolean);
  const rightParts = path.resolve(right).split(path.sep).filter(Boolean);
  const shared: string[] = [];

  while (shared.length < leftParts.length && shared.length < rightParts.length) {
    if (leftParts[shared.length] !== rightParts[shared.length]) {
      break;
    }
    shared.push(leftParts[shared.length]);
  }

  if (shared.length === 0) {
    return path.parse(left).root;
  }

  return path.join(path.parse(left).root, ...shared);
}
