import { readFileSync } from "node:fs";
import path from "node:path";
import type { SkillAssetEntry } from "./skill-registry";
import { readTextFile } from "./utils";

const LOCAL_PROTOCOL = "local:";

export interface ResolvedSkillAsset {
  installPath: string;
  content: string | Buffer;
}

export interface ResolvedSkill {
  entryPointContent: string;
  assets: ResolvedSkillAsset[];
}

export class UnsupportedProtocolError extends Error {
  constructor(public readonly protocol: string) {
    super(`Unsupported skill source protocol: \`${protocol}\``);
    this.name = "UnsupportedProtocolError";
  }
}

export function resolveLocalPath(localUri: string, repoRoot: string): string {
  if (!localUri.startsWith(LOCAL_PROTOCOL)) {
    throw new UnsupportedProtocolError(extractProtocol(localUri));
  }

  const relative = localUri.slice(LOCAL_PROTOCOL.length);
  const normalizedRoot = path.resolve(repoRoot);
  const resolved = path.resolve(normalizedRoot, relative);

  const rootWithSep = normalizedRoot.endsWith(path.sep)
    ? normalizedRoot
    : `${normalizedRoot}${path.sep}`;
  if (resolved !== normalizedRoot && !resolved.startsWith(rootWithSep)) {
    throw new Error(
      `Resolved skill path \`${resolved}\` escapes repo root \`${normalizedRoot}\``,
    );
  }

  return resolved;
}

export function resolveSkillSource(
  source: string,
  entryPoint: string,
  assets: SkillAssetEntry[],
  repoRoot: string,
): ResolvedSkill {
  const sourceDir = resolveLocalPath(source, repoRoot);
  const entryPointContent = readTextFile(path.join(sourceDir, entryPoint));

  const resolvedAssets: ResolvedSkillAsset[] = assets.map((asset) => {
    const assetPath = resolveLocalPath(asset.source, repoRoot);
    const content = path.extname(assetPath).toLowerCase() === ".md"
      ? readTextFile(assetPath)
      : readFileSync(assetPath);
    return { installPath: asset.installPath, content };
  });

  return { entryPointContent, assets: resolvedAssets };
}

function extractProtocol(uri: string): string {
  const colon = uri.indexOf(":");
  return colon === -1 ? uri : uri.slice(0, colon + 1);
}
