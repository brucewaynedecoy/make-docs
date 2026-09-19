import { readFile } from "node:fs/promises";
import { lstatSync, readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { SkillAssetEntry } from "./skill-registry";
import type { EmbeddedSkillBundle } from "./embedded-skill-types";
import { PACKAGE_ROOT } from "./utils";

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
  if (source.startsWith("embedded:")) {
    return resolveEmbeddedSkill(source, entryPoint, assets);
  }
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

const sha256 = (value: string | Buffer) => createHash("sha256").update(value).digest("hex");

export function validateEmbeddedSkillBundle(candidate: unknown): asserts candidate is EmbeddedSkillBundle {
  const invalid = () => { throw new Error("The embedded first-party Skill bundle is missing or corrupt. Reinstall the CLI package."); };
  const object = (value: unknown): value is Record<string, any> => !!value && typeof value === "object" && !Array.isArray(value);
  const digest = (value: unknown) => typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
  const filePath = (value: unknown): value is string => typeof value === "string" && !!value &&
    !/[\\:\x00-\x1f]/.test(value) && value.split("/").every((part) => !!part && !part.startsWith("."));
  if (!object(candidate) || candidate.schemaVersion !== 1 || !object(candidate.payloads) ||
      !digest(candidate.packageDigest) || !digest(candidate.registryDigest) || !digest(candidate.digest)) return invalid();
  if (sha256(JSON.stringify({ packageDigest: candidate.packageDigest, registryDigest: candidate.registryDigest, payloads: candidate.payloads })) !== candidate.digest) return invalid();
  for (const [name, payload] of Object.entries(candidate.payloads)) {
    if (!/^[a-z0-9][a-z0-9-]*$/.test(name) || !object(payload) || !filePath(payload.entryPoint) ||
        !Array.isArray(payload.assets) || !object(payload.files)) return invalid();
    const expected = new Set<string>([payload.entryPoint]);
    const destinations = new Set<string>([payload.entryPoint.toLowerCase()]);
    for (const asset of payload.assets) {
      if (!object(asset) || !filePath(asset.source) || !filePath(asset.installPath) || destinations.has(asset.installPath.toLowerCase())) return invalid();
      destinations.add(asset.installPath.toLowerCase());
      expected.add(asset.source);
    }
    if (Object.keys(payload.files).length !== expected.size) return invalid();
    for (const source of expected) {
      const file = Object.hasOwn(payload.files, source) ? payload.files[source] : undefined;
      if (!object(file) || typeof file.base64 !== "string" || !digest(file.sha256)) return invalid();
      const bytes = Buffer.from(file.base64, "base64");
      if (bytes.toString("base64") !== file.base64 || sha256(bytes) !== file.sha256 ||
          (source === payload.entryPoint && !Buffer.from(bytes.toString("utf8")).equals(bytes))) return invalid();
    }
  }
}

async function loadEmbeddedSkillBundle(): Promise<EmbeddedSkillBundle> {
  try {
    const { bundle, sourceTestAdapter } = await import("virtual:make-docs-first-party-skills");
    validateEmbeddedSkillBundle(bundle);
    const [registryBytes, packageBytes] = await Promise.all([
      readFile(path.join(PACKAGE_ROOT, "skill-registry.json")),
      readFile(path.join(PACKAGE_ROOT, "package.json")),
    ]);
    if (sha256(registryBytes) !== bundle.registryDigest || sha256(packageBytes) !== bundle.packageDigest) {
      throw new Error("The embedded Skill bundle does not match this CLI package and registry.");
    }
    loadedEmbeddedBundle = bundle;
    loadedSourceTestAdapter = sourceTestAdapter === true;
    return bundle;
  } catch (cause) {
    throw new Error("Cannot load the embedded first-party Skills. Rebuild or reinstall the CLI package; no source fallback is used.", { cause });
  }
}

let loadedEmbeddedBundle: EmbeddedSkillBundle | undefined;
let loadedSourceTestAdapter = false;

/** Bind the complete installed runtime, including file names and raw bytes. */
export function readSkillRuntimeDigest(packageRoot: string, sourceTestAdapter = false): string {
  const runtimeRoot = path.join(packageRoot, "dist");
  const runtimeStat = lstatSync(runtimeRoot, { throwIfNoEntry: false });
  if (!runtimeStat && sourceTestAdapter) return sha256("explicit-source-test-adapter:no-dist");
  if (!runtimeStat?.isDirectory() || runtimeStat.isSymbolicLink()) {
    throw new Error("The reviewed CLI runtime is missing or unsafe. Rebuild or reinstall the CLI package.");
  }
  const files: Array<[string, string]> = [];
  const visit = (directory: string) => {
    for (const name of readdirSync(directory).sort()) {
      const file = path.join(directory, name);
      const stat = lstatSync(file);
      if (stat.isDirectory() && !stat.isSymbolicLink()) visit(file);
      else if (stat.isFile() && !stat.isSymbolicLink()) files.push([path.relative(runtimeRoot, file).split(path.sep).join("/"), sha256(readFileSync(file))]);
      else throw new Error("The reviewed CLI runtime contains an unsafe file. Reinstall the CLI package.");
    }
  };
  visit(runtimeRoot);
  if (!files.some(([name]) => name === "index.js")) throw new Error("The reviewed CLI runtime entry point is missing. Rebuild or reinstall the CLI package.");
  return sha256(JSON.stringify(files));
}

function reviewedPackageDigest(bundle: EmbeddedSkillBundle): string {
  return sha256(JSON.stringify({ bundleDigest: bundle.digest, runtimeDigest: readSkillRuntimeDigest(PACKAGE_ROOT, loadedSourceTestAdapter) }));
}

/** Recheck the exact loaded payload and package inputs inside a writer's lock. */
export function assertEmbeddedSkillPackageDigest(expectedDigest: string): void {
  const bundle = loadedEmbeddedBundle;
  if (!bundle || reviewedPackageDigest(bundle) !== expectedDigest) {
    throw new Error("The reviewed embedded Skill package is not loaded or has changed.");
  }
  validateEmbeddedSkillBundle(bundle);
  if (sha256(readFileSync(path.join(PACKAGE_ROOT, "skill-registry.json"))) !== bundle.registryDigest ||
      sha256(readFileSync(path.join(PACKAGE_ROOT, "package.json"))) !== bundle.packageDigest) {
    throw new Error("The reviewed Skill package or registry has changed. Preview the operation again.");
  }
}

export async function getEmbeddedSkillPackageDigest(): Promise<string> {
  return reviewedPackageDigest(await loadEmbeddedSkillBundle());
}

async function resolveEmbeddedSkill(source: string, entryPoint: string, assets: SkillAssetEntry[]): Promise<ResolvedSkill> {
  const bundle = await loadEmbeddedSkillBundle();
  const name = source.slice("embedded:".length);
  const payload = Object.hasOwn(bundle.payloads, name) ? bundle.payloads[name] : undefined;
  if (!payload || payload.entryPoint !== entryPoint || JSON.stringify(payload.assets) !== JSON.stringify(assets)) {
    throw new Error(`Embedded first-party Skill inventory does not match ${source}. Reinstall the CLI package.`);
  }
  const read = (filePath: string) => {
    const file = Object.hasOwn(payload.files, filePath) ? payload.files[filePath] : undefined;
    if (!file) throw new Error(`Embedded first-party Skill file is missing: ${source}/${filePath}`);
    return Buffer.from(file.base64, "base64");
  };
  return {
    entryPointContent: read(entryPoint).toString("utf8"),
    assets: assets.map((asset) => {
      const bytes = read(asset.source);
      const text = bytes.toString("utf8");
      return {
        installPath: asset.installPath,
        content: isMarkdownPath(asset.source) && Buffer.from(text).equals(bytes) ? text : bytes,
        sourcePath: `${source}/${asset.source}`,
      };
    }),
  };
}

function resolveSourceDirectory(source: string): ResolvedDirectory {
  if (isFileSource(source)) {
    const location = normalizeFileSource(source, { directory: true });
    return {
      location,
      virtualPath: toFileVirtualPath(location),
    };
  }

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
  if (isFileSource(source)) {
    const location = normalizeFileSource(source, { directory: false });
    return {
      location,
      virtualPath: toFileVirtualPath(location),
    };
  }

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
  const location = isFileSource(nextUrl)
    ? normalizeFileSource(nextUrl, { directory: false })
    : normalizeRemoteSource(nextUrl, { directory: false });
  return {
    location,
    virtualPath: isFileSource(location)
      ? toFileVirtualPath(location)
      : toRemoteVirtualPath(location),
  };
}

async function readSourceText(file: ResolvedFile): Promise<string> {
  if (isFileSource(file.location)) {
    return readFile(fileURLToPath(file.location), "utf8");
  }

  return fetchRemoteText(file.location);
}

async function readSourceBinary(file: ResolvedFile): Promise<Buffer> {
  if (isFileSource(file.location)) {
    return readFile(fileURLToPath(file.location));
  }

  return fetchRemoteBinary(file.location);
}

function isFileSource(source: string): boolean {
  return source.startsWith("file:");
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

function normalizeFileSource(source: string, options: { directory: boolean }): string {
  const url = new URL(source);
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

function toFileVirtualPath(source: string): string {
  return fileURLToPath(source);
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
