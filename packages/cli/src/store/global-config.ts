import { existsSync, readFileSync } from "node:fs";
import { getGlobalConfigPath } from "./paths";
import { writeStoreJsonFile } from "./json-files";

/**
 * Global configuration file: machine-level and tool-level settings only
 * (R-STORE-2). This surface is deliberately separate from the project-owned
 * presentation overlay at `<repo>/.make-docs/config.yaml`:
 *
 * - Different location (`~/.make-docs/config.json`, never inside a repository).
 * - Different format (JSON, not YAML) so the two files cannot be mistaken for
 *   one another.
 * - Different loader: this module only ever reads the global store root; it
 *   never reads a project directory, and no project config loader reads this
 *   file. Neither file can override the other (R-KEEP-1).
 */

export const GLOBAL_CONFIG_SCHEMA_VERSION = 1;

/** Self-update preference for the CLI (machine-level setting). */
export type SelfUpdatePreference = "prompt" | "auto" | "off";

export interface GlobalConfigSettings {
  /** How the CLI handles tool self-updates on this machine. */
  selfUpdate: SelfUpdatePreference;
  /** Opt-in for automatic marketplace registration (default: off). */
  marketplaceAutoRegistration: boolean;
}

export interface GlobalConfig {
  schemaVersion: number;
  settings: GlobalConfigSettings;
}

export interface LoadedGlobalConfig {
  config: GlobalConfig;
  /** Absolute path the config was resolved against. */
  path: string;
  /** True when the file existed and parsed; false when defaults were used. */
  loadedFromDisk: boolean;
  warnings: string[];
}

export const DEFAULT_GLOBAL_CONFIG_SETTINGS: GlobalConfigSettings = {
  selfUpdate: "prompt",
  marketplaceAutoRegistration: false,
};

export function defaultGlobalConfig(): GlobalConfig {
  return {
    schemaVersion: GLOBAL_CONFIG_SCHEMA_VERSION,
    settings: { ...DEFAULT_GLOBAL_CONFIG_SETTINGS },
  };
}

/**
 * Loads the global config from the store root. Missing or unreadable files
 * degrade to defaults with a warning; the global config is operational state
 * and must never block the CLI (R-DB-4 spirit applies to the whole store).
 */
export function loadGlobalConfig(storeRoot: string): LoadedGlobalConfig {
  const configPath = getGlobalConfigPath(storeRoot);
  const warnings: string[] = [];
  if (!existsSync(configPath)) {
    return {
      config: defaultGlobalConfig(),
      path: configPath,
      loadedFromDisk: false,
      warnings,
    };
  }

  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(configPath, "utf8"));
  } catch (error) {
    warnings.push(
      `Global config at ${configPath} is not valid JSON (${toMessage(error)}); using defaults. ` +
        "This is recoverable operational state, not project data.",
    );
    return {
      config: defaultGlobalConfig(),
      path: configPath,
      loadedFromDisk: false,
      warnings,
    };
  }

  return {
    config: normalizeGlobalConfig(raw, configPath, warnings),
    path: configPath,
    loadedFromDisk: true,
    warnings,
  };
}

/** Writes the global config file (atomically via temp-file rename). */
export function writeGlobalConfig(storeRoot: string, config: GlobalConfig): string {
  const configPath = getGlobalConfigPath(storeRoot);
  writeStoreJsonFile(configPath, config);
  return configPath;
}

function normalizeGlobalConfig(
  raw: unknown,
  configPath: string,
  warnings: string[],
): GlobalConfig {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    warnings.push(
      `Global config at ${configPath} is not a JSON object; using defaults.`,
    );
    return defaultGlobalConfig();
  }

  const record = raw as Record<string, unknown>;
  const settingsRaw =
    typeof record.settings === "object" && record.settings !== null && !Array.isArray(record.settings)
      ? (record.settings as Record<string, unknown>)
      : {};

  const settings: GlobalConfigSettings = { ...DEFAULT_GLOBAL_CONFIG_SETTINGS };

  const selfUpdate = settingsRaw.selfUpdate;
  if (selfUpdate === "prompt" || selfUpdate === "auto" || selfUpdate === "off") {
    settings.selfUpdate = selfUpdate;
  } else if (selfUpdate !== undefined) {
    warnings.push(
      `Global config setting "selfUpdate" has unsupported value ${JSON.stringify(selfUpdate)}; using "${DEFAULT_GLOBAL_CONFIG_SETTINGS.selfUpdate}".`,
    );
  }

  const marketplaceAutoRegistration = settingsRaw.marketplaceAutoRegistration;
  if (typeof marketplaceAutoRegistration === "boolean") {
    settings.marketplaceAutoRegistration = marketplaceAutoRegistration;
  } else if (marketplaceAutoRegistration !== undefined) {
    warnings.push(
      'Global config setting "marketplaceAutoRegistration" must be a boolean; using the default (false).',
    );
  }

  return {
    schemaVersion:
      typeof record.schemaVersion === "number"
        ? record.schemaVersion
        : GLOBAL_CONFIG_SCHEMA_VERSION,
    settings,
  };
}

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
