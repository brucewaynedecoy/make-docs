import {
  closeSync,
  constants,
  fchmodSync,
  fstatSync,
  fsyncSync,
  lstatSync,
  openSync,
  readdirSync,
  realpathSync,
  renameSync,
  statfsSync,
  type Stats,
} from "node:fs";
import os from "node:os";
import path from "node:path";

export type CorePlatform = "win32" | "darwin" | "linux";
export type ProcessLiveness = "alive" | "dead" | "unknown";
export type GuardedFileKind = "file" | "directory";

export interface FileMutationGuard {
  strategy: "object-number" | "metadata";
  kind: GuardedFileKind;
  device?: number;
  inode?: number;
  size: number;
  mode: number;
  birthtimeMs: number;
  ctimeMs: number;
}

export interface PlatformPath {
  displayPath: string;
  canonicalPath: string;
  comparisonKey: string;
}

export interface PlatformService {
  readonly kind: CorePlatform;
  readonly hostname: string;
  readonly caseSensitiveComparison: boolean;
  readonly canMutateOpenPaths: boolean;
  userHome(options?: { homeDir?: string }): string;
  userDataRoot(options?: { env?: NodeJS.ProcessEnv; homeDir?: string }): string;
  describePath(input: string): PlatformPath;
  comparisonKey(input: string): string;
  samePath(left: string, right: string): boolean;
  isPathInside(root: string, candidate: string): boolean;
  assertPathInside(root: string, candidate: string): void;
  acceptsExecutableMode(mode: number): boolean;
  matchesFileMode(actual: number, expected: number): boolean;
  applyPrivateMode(fd: number, mode: number): void;
  findExecutable(executableName: string, executablePath?: string): string | null;
  processLiveness(pid: number, ownerHostname?: string): ProcessLiveness;
  captureFileGuard(stats: Stats, kind?: GuardedFileKind): FileMutationGuard;
  matchesFileGuard(stats: Stats, guard: FileMutationGuard): boolean;
  matchesFileIdentity(stats: Stats, guard: FileMutationGuard): boolean;
  sameFileObject(left: Stats, right: Stats, kind?: GuardedFileKind): boolean;
  atomicReplace(source: string, target: string): void;
  syncDirectory(directory: string): void;
  availableBytes(input: string): bigint;
}

export class PlatformOperationError extends Error {
  constructor(
    readonly code:
      | "unsupported-platform"
      | "unsafe-path"
      | "path-unavailable"
      | "atomic-replace-failed"
      | "directory-sync-failed",
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "PlatformOperationError";
  }
}

function corePlatform(value: NodeJS.Platform): CorePlatform {
  if (value === "win32" || value === "darwin" || value === "linux") return value;
  throw new PlatformOperationError(
    "unsupported-platform",
    `Make Docs core file operations do not support ${value}. No files changed.`,
  );
}

function pathApi(kind: CorePlatform): typeof path.win32 | typeof path.posix {
  return kind === "win32" ? path.win32 : path.posix;
}

/** Pure path syntax normalization used by fixtures for every supported platform. */
export function normalizePathSyntax(
  input: string,
  kind: CorePlatform,
  cwd = kind === "win32" ? "C:\\" : "/",
): string {
  if (!input.trim()) {
    throw new PlatformOperationError("unsafe-path", "A path cannot be empty.");
  }
  const api = pathApi(kind);
  const normalized = api.isAbsolute(input) ? api.normalize(input) : api.resolve(cwd, input);
  const root = api.parse(normalized).root;
  return normalized.length > root.length ? normalized.replace(/[\\/]+$/, "") : normalized;
}

/** Pure comparison-key logic. Native path discovery is kept separate. */
export function comparisonKeyForPath(input: string, kind: CorePlatform, cwd?: string): string {
  const normalized = normalizePathSyntax(input, kind, cwd);
  return kind === "win32" ? normalized.replaceAll("/", "\\").toLocaleLowerCase("en-US") : normalized;
}

function canonicalNativePath(input: string, kind: CorePlatform): string {
  if (kind !== "win32" && (/^[A-Za-z]:[\\/]/.test(input) || input.startsWith("\\\\"))) {
    throw new PlatformOperationError(
      "unsafe-path",
      "A Windows drive or UNC path cannot identify local state on this host.",
    );
  }
  let current = path.resolve(input);
  const missing: string[] = [];
  while (!lstatSync(current, { throwIfNoEntry: false })) {
    const parent = path.dirname(current);
    if (parent === current) {
      throw new PlatformOperationError("path-unavailable", `The path cannot be resolved: ${input}`);
    }
    missing.unshift(path.basename(current));
    current = parent;
  }
  try {
    return path.join(realpathSync.native(current), ...missing);
  } catch (error) {
    throw new PlatformOperationError(
      "path-unavailable",
      `The path contains an unresolved link: ${current}`,
      error,
    );
  }
}

const volumeCaseSensitivity = new Map<string, boolean>();

function volumeUsesCaseSensitiveNames(input: string, kind: CorePlatform): boolean {
  if (kind === "win32") return false;
  if (kind === "linux") return true;
  let current = lstatSync(input, { throwIfNoEntry: false })?.isDirectory() ? input : path.dirname(input);
  const visited: string[] = [];
  const remember = (value: boolean): boolean => {
    for (const directory of visited) volumeCaseSensitivity.set(`${kind}:${directory}`, value);
    return value;
  };
  while (true) {
    const cached = volumeCaseSensitivity.get(`${kind}:${current}`);
    if (cached !== undefined) return remember(cached);
    visited.push(current);
    try {
      for (const name of readdirSync(current)) {
        const index = name.search(/[A-Za-z]/);
        if (index < 0) continue;
        const character = name[index];
        const changed = character === character.toLocaleLowerCase("en-US")
          ? character.toLocaleUpperCase("en-US")
          : character.toLocaleLowerCase("en-US");
        const alternateName = `${name.slice(0, index)}${changed}${name.slice(index + 1)}`;
        if (alternateName === name) continue;
        const original = path.join(current, name);
        const alternate = path.join(current, alternateName);
        if (!lstatSync(alternate, { throwIfNoEntry: false })) return remember(true);
        return remember(realpathSync.native(original) !== realpathSync.native(alternate));
      }
    } catch {
      // Try an accessible parent. If none can prove the volume rule, preserve case.
    }
    const parent = path.dirname(current);
    if (parent === current) return remember(true);
    current = parent;
  }
}

function fileKind(stats: Stats): GuardedFileKind | null {
  if (stats.isFile()) return "file";
  if (stats.isDirectory()) return "directory";
  return null;
}

function hasObjectNumbers(stats: Stats): boolean {
  return Number.isSafeInteger(stats.dev) && Number.isSafeInteger(stats.ino) &&
    (stats.dev !== 0 || stats.ino !== 0);
}

export function createPlatformService(
  platformValue: NodeJS.Platform = process.platform,
  hostname = os.hostname(),
): PlatformService {
  const kind = corePlatform(platformValue);
  const nativeKind = corePlatform(process.platform);
  const caseSensitiveComparison = kind === "win32"
    ? false
    : kind === "linux"
      ? true
      : kind === nativeKind
        ? volumeUsesCaseSensitiveNames(canonicalNativePath(process.cwd(), kind), kind)
        : true;

  const describePath = (input: string): PlatformPath => {
    const canonicalPath = canonicalNativePath(input, kind);
    const caseSensitive = volumeUsesCaseSensitiveNames(canonicalPath, kind);
    return {
      displayPath: path.resolve(input),
      canonicalPath,
      comparisonKey: caseSensitive
        ? normalizePathSyntax(canonicalPath, kind, process.cwd())
        : normalizePathSyntax(canonicalPath, kind, process.cwd()).toLocaleLowerCase("en-US"),
    };
  };

  const captureFileGuard = (stats: Stats, expected?: GuardedFileKind): FileMutationGuard => {
    const kindValue = fileKind(stats);
    if (!kindValue || (expected && kindValue !== expected)) {
      throw new PlatformOperationError("unsafe-path", "The guarded path has an unsupported file type.");
    }
    return {
      strategy: hasObjectNumbers(stats) ? "object-number" : "metadata",
      kind: kindValue,
      ...(hasObjectNumbers(stats) ? { device: stats.dev, inode: stats.ino } : {}),
      size: stats.size,
      mode: stats.mode,
      birthtimeMs: stats.birthtimeMs,
      ctimeMs: stats.ctimeMs,
    };
  };

  const matchesFileGuard = (stats: Stats, guard: FileMutationGuard): boolean => {
    const currentKind = fileKind(stats);
    if (currentKind !== guard.kind) return false;
    if (guard.strategy === "object-number") {
      return stats.dev === guard.device && stats.ino === guard.inode;
    }
    const stableBirth = guard.birthtimeMs > 0 && stats.birthtimeMs > 0;
    return stats.mode === guard.mode && stats.size === guard.size &&
      (stableBirth
        ? stats.birthtimeMs === guard.birthtimeMs
        : stats.ctimeMs === guard.ctimeMs);
  };

  const matchesFileIdentity = (stats: Stats, guard: FileMutationGuard): boolean => {
    const currentKind = fileKind(stats);
    if (currentKind !== guard.kind) return false;
    if (guard.strategy === "object-number") {
      return stats.dev === guard.device && stats.ino === guard.inode;
    }
    const stableBirth = guard.birthtimeMs > 0 && stats.birthtimeMs > 0;
    return stableBirth
      ? stats.birthtimeMs === guard.birthtimeMs
      : stats.mode === guard.mode && stats.size === guard.size && stats.ctimeMs === guard.ctimeMs;
  };

  const service: PlatformService = {
    kind,
    hostname,
    caseSensitiveComparison,
    canMutateOpenPaths: kind !== "win32",
    userHome(options = {}) {
      return options.homeDir ?? os.homedir();
    },
    userDataRoot(options = {}) {
      const env = options.env ?? process.env;
      const homeDir = service.userHome({ homeDir: options.homeDir });
      if (kind === "win32") {
        return env.LOCALAPPDATA?.trim() || env.APPDATA?.trim() || homeDir;
      }
      return homeDir;
    },
    describePath,
    comparisonKey(input) {
      return describePath(input).comparisonKey;
    },
    samePath(left, right) {
      return service.comparisonKey(left) === service.comparisonKey(right);
    },
    isPathInside(root, candidate) {
      const rootPath = describePath(root);
      const candidatePath = describePath(candidate);
      const api = pathApi(kind);
      const relative = api.relative(rootPath.canonicalPath, candidatePath.canonicalPath);
      return relative === "" ||
        (!relative.startsWith(`..${api.sep}`) && relative !== ".." && !api.isAbsolute(relative));
    },
    assertPathInside(root, candidate) {
      if (service.isPathInside(root, candidate)) return;
      throw new PlatformOperationError(
        "unsafe-path",
        `The path escapes its approved root: ${path.resolve(candidate)}`,
      );
    },
    acceptsExecutableMode(mode) {
      return kind === "win32" || (mode & 0o111) !== 0;
    },
    matchesFileMode(actual, expected) {
      return kind === "win32" || (actual & 0o777) === (expected & 0o777);
    },
    applyPrivateMode(fd, mode) {
      if (kind !== "win32") fchmodSync(fd, mode);
    },
    findExecutable(executableName, executablePath = process.env.PATH ?? "") {
      const api = pathApi(kind);
      const pathEntries = executablePath.split(api.delimiter).filter(Boolean);
      const suffixes = kind === "win32"
        ? (process.env.PATHEXT ?? ".COM;.EXE;.BAT;.CMD").split(";").filter(Boolean)
        : [""];
      const names = kind === "win32" && !path.win32.extname(executableName)
        ? [executableName, ...suffixes.map(suffix => `${executableName}${suffix.toLocaleLowerCase("en-US")}`)]
        : [executableName];
      for (const entry of pathEntries) {
        for (const name of [...new Set(names)]) {
          const candidate = api.join(entry, name);
          try {
            const stat = lstatSync(candidate);
            if (stat.isFile() && service.acceptsExecutableMode(stat.mode)) return candidate;
          } catch {
            // A PATH entry that cannot be read cannot prove an executable.
          }
        }
      }
      return null;
    },
    processLiveness(pid, ownerHostname = hostname) {
      if (!Number.isSafeInteger(pid) || pid <= 0 || ownerHostname !== hostname) return "unknown";
      try {
        process.kill(pid, 0);
        return "alive";
      } catch (error) {
        return (error as NodeJS.ErrnoException).code === "ESRCH" ? "dead" : "unknown";
      }
    },
    captureFileGuard,
    matchesFileGuard,
    matchesFileIdentity,
    sameFileObject(left, right, expected) {
      return matchesFileIdentity(right, captureFileGuard(left, expected));
    },
    atomicReplace(source, target) {
      try {
        renameSync(source, target);
      } catch (error) {
        throw new PlatformOperationError(
          "atomic-replace-failed",
          `Atomic replacement failed. The reviewed target was preserved: ${target}`,
          error,
        );
      }
      service.syncDirectory(path.dirname(target));
    },
    syncDirectory(directory) {
      if (kind === "win32") return;
      let fd: number | null = null;
      try {
        const directoryFlag = typeof constants.O_DIRECTORY === "number" ? constants.O_DIRECTORY : 0;
        fd = openSync(directory, constants.O_RDONLY | directoryFlag);
        const stat = fstatSync(fd);
        if (!stat.isDirectory()) {
          throw new PlatformOperationError("unsafe-path", `The sync target is not a directory: ${directory}`);
        }
        fsyncSync(fd);
      } catch (error) {
        if (error instanceof PlatformOperationError) throw error;
        throw new PlatformOperationError(
          "directory-sync-failed",
          `The replacement completed, but its directory sync failed: ${directory}`,
          error,
        );
      } finally {
        if (fd !== null) closeSync(fd);
      }
    },
    availableBytes(input) {
      try {
        const stats = statfsSync(input, { bigint: true });
        return stats.bavail * stats.bsize;
      } catch (error) {
        throw new PlatformOperationError(
          "path-unavailable",
          `Available storage space cannot be verified for: ${path.resolve(input)}`,
          error,
        );
      }
    },
  };
  return Object.freeze(service);
}

export const platform = createPlatformService();
