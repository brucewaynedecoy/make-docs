import path from "node:path";
import type { SkillAssetEntry } from "./skill-registry";

const URL_PROTOCOL = "url:";
const GITHUB_PROTOCOL = "github:";
const DEFAULT_GITHUB_REF = "main";
const RAW_GITHUB_HOST = "raw.githubusercontent.com";

interface ResolvedDirectory {
  location: string;
  virtualPath: string;
}

interface ResolvedFile {
  location: string;
  virtualPath: string;
}

const remoteTextCache = new Map<string, Promise<string>>();
const remoteBinaryCache = new Map<string, Promise<Buffer>>();

export interface ResolvedSkillAsset {
  installPath: string;
  content: string | Buffer;
  sourcePath: string;
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

export async function resolveSkillSource(
  source: string,
  entryPoint: string,
  assets: SkillAssetEntry[],
): Promise<ResolvedSkill> {
  const sourceDir = resolveSourceDirectory(source);
  const entryPointFile = resolveRelativeFile(entryPoint, sourceDir);
  const entryPointContent = await readSourceText(entryPointFile);

  const resolvedAssets = await Promise.all(
    assets.map(async (asset) => {
      const file = resolveSourceFile(asset.source, sourceDir);
      return {
        installPath: asset.installPath,
        content: isMarkdownPath(file.virtualPath)
          ? await readSourceText(file)
          : await readSourceBinary(file),
        sourcePath: file.virtualPath,
      };
    }),
  );

  return {
    entryPointContent,
    assets: resolvedAssets,
  };
}

function resolveSourceDirectory(source: string): ResolvedDirectory {
  if (!isRemoteSource(source)) {
    throw new UnsupportedProtocolError(extractProtocol(source));
  }

  const location = normalizeRemoteSource(source, { directory: true });
  return {
    location,
    virtualPath: toRemoteVirtualPath(location),
  };
}

function resolveSourceFile(source: string, baseDir: ResolvedDirectory): ResolvedFile {
  if (isRemoteSource(source)) {
    const location = normalizeRemoteSource(source, { directory: false });
    return {
      location,
      virtualPath: toRemoteVirtualPath(location),
    };
  }

  return resolveRelativeFile(source, baseDir);
}

function resolveRelativeFile(relativePath: string, baseDir: ResolvedDirectory): ResolvedFile {
  const nextUrl = new URL(relativePath, ensureTrailingSlash(baseDir.location)).href;
  const location = normalizeRemoteSource(nextUrl, { directory: false });
  return {
    location,
    virtualPath: toRemoteVirtualPath(location),
  };
}

async function readSourceText(file: ResolvedFile): Promise<string> {
  return fetchRemoteText(file.location);
}

async function readSourceBinary(file: ResolvedFile): Promise<Buffer> {
  return fetchRemoteBinary(file.location);
}

function isRemoteSource(source: string): boolean {
  return (
    source.startsWith(URL_PROTOCOL) ||
    source.startsWith(GITHUB_PROTOCOL) ||
    source.startsWith("https://") ||
    source.startsWith("http://")
  );
}

function normalizeRemoteSource(source: string, options: { directory: boolean }): string {
  if (source.startsWith(GITHUB_PROTOCOL)) {
    return normalizeGithubProtocol(source, options);
  }

  const rawSource = source.startsWith(URL_PROTOCOL)
    ? source.slice(URL_PROTOCOL.length)
    : source;
  const url = new URL(rawSource);

  if (url.hostname === "github.com") {
    return normalizeGithubUrl(url, options);
  }

  if (url.hostname === RAW_GITHUB_HOST) {
    return options.directory ? ensureTrailingSlash(url.href) : stripTrailingSlash(url.href);
  }

  return options.directory ? ensureTrailingSlash(url.href) : stripTrailingSlash(url.href);
}

function normalizeGithubProtocol(
  source: string,
  options: { directory: boolean },
): string {
  const rawSource = source.slice(GITHUB_PROTOCOL.length);
  const atIndex = rawSource.lastIndexOf("@");
  const withoutRef = atIndex === -1 ? rawSource : rawSource.slice(0, atIndex);
  const ref = atIndex === -1 ? DEFAULT_GITHUB_REF : rawSource.slice(atIndex + 1);
  const segments = withoutRef.split("/").filter(Boolean);

  if (segments.length < 3) {
    throw new Error(
      `GitHub skill source \`${source}\` must use github:<owner>/<repo>/<path>[@<ref>]`,
    );
  }

  const [owner, repo, ...pathSegments] = segments;
  return buildGithubRawUrl(owner, repo, ref, pathSegments, options.directory);
}

function normalizeGithubUrl(url: URL, options: { directory: boolean }): string {
  const segments = url.pathname.split("/").filter(Boolean);

  if (segments.length < 4) {
    throw new Error(
      `GitHub skill source \`${url.href}\` must point to a tree or blob URL.`,
    );
  }

  const [owner, repo, mode, ref, ...pathSegments] = segments;
  if (mode !== "tree" && mode !== "blob") {
    throw new Error(
      `GitHub skill source \`${url.href}\` must use /tree/ or /blob/ paths.`,
    );
  }

  return buildGithubRawUrl(owner, repo, ref, pathSegments, options.directory || mode === "tree");
}

function buildGithubRawUrl(
  owner: string,
  repo: string,
  ref: string,
  pathSegments: string[],
  directory: boolean,
): string {
  const pathname = pathSegments.join("/");
  const base = `https://${RAW_GITHUB_HOST}/${owner}/${repo}/${ref}/${pathname}`;
  return directory ? ensureTrailingSlash(base) : stripTrailingSlash(base);
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

function stripTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function toRemoteVirtualPath(source: string): string {
  const url = new URL(source);
  const joined = path.posix.join("/", url.host, url.pathname);
  return joined.endsWith("/") ? joined.slice(0, -1) : joined;
}

async function fetchRemoteText(url: string): Promise<string> {
  const cached = remoteTextCache.get(url);
  if (cached) {
    return cached;
  }

  const request = fetchRemote(url, "text") as Promise<string>;
  remoteTextCache.set(url, request);
  return request;
}

async function fetchRemoteBinary(url: string): Promise<Buffer> {
  const cached = remoteBinaryCache.get(url);
  if (cached) {
    return cached;
  }

  const request = fetchRemote(url, "binary") as Promise<Buffer>;
  remoteBinaryCache.set(url, request);
  return request;
}

async function fetchRemote(url: string, mode: "text" | "binary"): Promise<string | Buffer> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "make-docs-cli",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch skill source \`${url}\`: ${response.status} ${response.statusText}`,
    );
  }

  if (mode === "text") {
    return response.text();
  }

  return Buffer.from(await response.arrayBuffer());
}

function isMarkdownPath(filePath: string): boolean {
  return path.posix.extname(filePath).toLowerCase() === ".md";
}

function extractProtocol(uri: string): string {
  if (/^https?:\/\//.test(uri)) {
    const url = new URL(uri);
    return `${url.protocol}//`;
  }

  const colon = uri.indexOf(":");
  return colon === -1 ? uri : uri.slice(0, colon + 1);
}
