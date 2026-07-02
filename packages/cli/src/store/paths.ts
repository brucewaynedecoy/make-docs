import os from "node:os";
import path from "node:path";

/**
 * Environment variable that overrides the global store root. Tests and
 * sandboxed environments set this so the store never touches the real
 * `~/.make-docs/` directory.
 */
export const STORE_ROOT_ENV_VAR = "MAKE_DOCS_HOME";

/** Directory name of the global store under the user's home directory. */
export const STORE_DIR_NAME = ".make-docs";

/** Global configuration file (machine-level and tool-level settings). */
export const GLOBAL_CONFIG_FILE = "config.json";

/** Global manifest file (tool-level state). */
export const GLOBAL_MANIFEST_FILE = "manifest.json";

/** SQLite database file (operational data). */
export const STORE_DATABASE_FILE = "store.db";

export interface ResolveStoreRootOptions {
  /** Explicit store root; wins over the environment and the home directory. */
  storeRoot?: string;
  /** Environment to consult for {@link STORE_ROOT_ENV_VAR}. Defaults to `process.env`. */
  env?: NodeJS.ProcessEnv;
  /** Home directory used for the default `~/.make-docs` location. */
  homeDir?: string;
}

/**
 * Resolves the global store root. Precedence: explicit option, then the
 * `MAKE_DOCS_HOME` environment variable, then `~/.make-docs`.
 */
export function resolveStoreRoot(options: ResolveStoreRootOptions = {}): string {
  if (options.storeRoot) {
    return path.resolve(options.storeRoot);
  }
  const env = options.env ?? process.env;
  const envRoot = env[STORE_ROOT_ENV_VAR];
  if (envRoot && envRoot.trim() !== "") {
    return path.resolve(envRoot);
  }
  return path.join(options.homeDir ?? os.homedir(), STORE_DIR_NAME);
}

export function getGlobalConfigPath(storeRoot: string): string {
  return path.join(storeRoot, GLOBAL_CONFIG_FILE);
}

export function getGlobalManifestPath(storeRoot: string): string {
  return path.join(storeRoot, GLOBAL_MANIFEST_FILE);
}

export function getStoreDatabasePath(storeRoot: string): string {
  return path.join(storeRoot, STORE_DATABASE_FILE);
}
