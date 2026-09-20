import { existsSync, readFileSync } from "node:fs";
import { getGlobalConfigPath } from "./paths";
import { writeStoreJsonFile } from "./json-files";
import {
  getFirstPartyHarnessAdapter,
  validateHarnessMethodSelection,
  type HarnessMethodSelection,
} from "../harness-access";
import { NO_ACCESS, type OperationAccess } from "../operations/access";

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

export interface GlobalHarnessIntent {
  /** Whether this harness is selected for Make Docs setup on this machine. */
  selected: boolean;
  /** Most permissive adapter method the user approved, or none/null when disabled. */
  maximumMethod: string | null;
  /** Maximum operation access approved for this harness on this machine. */
  accessCeiling: OperationAccess;
  /** Preserve newer or harness-owned settings during an older CLI round trip. */
  [key: string]: unknown;
}

export interface GlobalConfigSettings {
  /** How the CLI handles tool self-updates on this machine. */
  selfUpdate: SelfUpdatePreference;
  /** Opt-in for automatic marketplace registration (default: off). */
  marketplaceAutoRegistration: boolean;
  /** Machine intent only. Live native harness configuration remains authority. */
  harnesses: Record<string, GlobalHarnessIntent>;
  /** Preserve settings owned by a newer CLI. */
  [key: string]: unknown;
}

export interface GlobalConfig {
  schemaVersion: number;
  settings: GlobalConfigSettings;
  /** Preserve top-level fields owned by a newer CLI. */
  [key: string]: unknown;
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
  harnesses: {},
};

export const DEFAULT_HARNESS_ACCESS_CEILING: OperationAccess = Object.freeze({
  store: "write",
  project: "write",
  hostConfig: "none",
});

export function defaultGlobalConfig(): GlobalConfig {
  return {
    schemaVersion: GLOBAL_CONFIG_SCHEMA_VERSION,
    settings: { ...DEFAULT_GLOBAL_CONFIG_SETTINGS, harnesses: {} },
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

  const settings: GlobalConfigSettings = {
    ...settingsRaw,
    ...DEFAULT_GLOBAL_CONFIG_SETTINGS,
    harnesses: {},
  };

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

  const harnesses = settingsRaw.harnesses;
  if (harnesses !== undefined) {
    if (typeof harnesses !== "object" || harnesses === null || Array.isArray(harnesses)) {
      warnings.push(
        'Global config setting "harnesses" must be an object; using no selected harnesses.',
      );
    } else {
      for (const [harness, value] of Object.entries(harnesses)) {
        if (!/^[a-z][a-z0-9-]*$/.test(harness)) {
          warnings.push(`Global config harness ${JSON.stringify(harness)} is not a safe identifier; it was ignored.`);
          continue;
        }
        if (typeof value !== "object" || value === null || Array.isArray(value)) {
          warnings.push(`Global config harness "${harness}" must be an object; it was ignored.`);
          continue;
        }
        const intent = value as Record<string, unknown>;
        const selected = intent.selected;
        const maximumMethod = intent.maximumMethod;
        if (typeof selected !== "boolean") {
          warnings.push(`Global config harness "${harness}" must declare a boolean selected value; it was ignored.`);
          continue;
        }
        if (
          maximumMethod !== null &&
          (typeof maximumMethod !== "string" || !/^[a-z][a-z0-9-]*$/.test(maximumMethod))
        ) {
          warnings.push(`Global config harness "${harness}" has an unsafe maximumMethod; it was ignored.`);
          continue;
        }
        if (selected && maximumMethod === null) {
          warnings.push(`Global config harness "${harness}" is selected but has no maximumMethod; it was ignored.`);
          continue;
        }
        const adapter = getFirstPartyHarnessAdapter(harness);
        if (adapter && maximumMethod !== null) {
          try {
            validateHarnessMethodSelection({
              harnessId: harness,
              method: maximumMethod as HarnessMethodSelection,
            });
          } catch (error) {
            warnings.push(`Global config harness "${harness}" has an unsupported maximumMethod (${toMessage(error)}); it was ignored.`);
            continue;
          }
        }
        if (selected && maximumMethod === "none") {
          warnings.push(`Global config harness "${harness}" is selected but maximumMethod is none; it was ignored.`);
          continue;
        }
        const accessCeiling = normalizeHarnessAccessCeiling(
          intent.accessCeiling,
          selected ? DEFAULT_HARNESS_ACCESS_CEILING : NO_ACCESS,
          configPath,
          harness,
          warnings,
        );
        if (!accessCeiling) continue;
        settings.harnesses[harness] = {
          ...intent,
          selected,
          maximumMethod,
          accessCeiling,
        };
      }
    }
  }

  return {
    ...record,
    schemaVersion:
      typeof record.schemaVersion === "number"
        ? record.schemaVersion
        : GLOBAL_CONFIG_SCHEMA_VERSION,
    settings,
  };
}

function normalizeHarnessAccessCeiling(
  value: unknown,
  fallback: OperationAccess,
  configPath: string,
  harness: string,
  warnings: string[],
): OperationAccess | null {
  if (value === undefined) return { ...fallback };
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    warnings.push(`Global config harness "${harness}" has an invalid accessCeiling at ${configPath}; it was ignored.`);
    return null;
  }
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  if (
    keys.join(",") !== "hostConfig,project,store" ||
    !isAccessLevel(record.store) ||
    !isAccessLevel(record.project) ||
    record.hostConfig !== "none"
  ) {
    warnings.push(`Global config harness "${harness}" has an invalid accessCeiling at ${configPath}; it was ignored.`);
    return null;
  }
  return {
    store: record.store,
    project: record.project,
    hostConfig: "none",
  };
}

function isAccessLevel(value: unknown): value is "none" | "read" | "write" {
  return value === "none" || value === "read" || value === "write";
}

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
