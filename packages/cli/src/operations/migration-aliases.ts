/**
 * W33 R0 P3 migration aliases (PRD 39 R-MIG-1, R-MIG-3).
 *
 * Every CLI path and MCP tool name that W33 R0 renamed stays a hidden alias
 * for two minor releases. In that window an alias runs the same operation,
 * prints one line that names the new command, and adds `renamedTo` to its
 * JSON or MCP result. For one more minor release the old name returns a
 * typed `command-renamed` result that names the new one. Then it is removed.
 *
 * The name catalog is the only source of old names: `formerCli` and
 * `formerMcp` on a current entry, when they differ from the new name.
 * Planned entries have no former names, so a name that never shipped gets
 * no alias.
 */
import { AsyncLocalStorage } from "node:async_hooks";
import { readPackageMeta } from "../utils";
import { NAME_CATALOG, type NameCatalogEntry } from "./name-catalog";
import { OperationError } from "./types";

/**
 * The release that introduces the W33 R0 renames (owner choice, 2026-11-23).
 * The migration window is counted in minor releases from this release.
 */
export const RENAME_RELEASE = "2.1.0";
/** Minor releases in which an old name runs as an alias. */
export const ALIAS_MINOR_RELEASES = 2;
/** Minor releases after the alias window in which an old name returns `command-renamed`. */
export const RENAMED_MINOR_RELEASES = 1;

/**
 * `alias`: the old name runs the same operation and names the new one.
 * `renamed`: the old name returns a typed `command-renamed` result.
 * `removed`: the old name is gone and fails as an unknown command.
 */
export type MigrationAliasState = "alias" | "renamed" | "removed";

interface MinorVersion {
  major: number;
  minor: number;
}

function parseMinorVersion(version: string): MinorVersion | null {
  const match = /^(\d+)\.(\d+)\.\d+(?:[-+].*)?$/.exec(version.trim());
  return match ? { major: Number(match[1]), minor: Number(match[2]) } : null;
}

function formatMinorVersion(version: MinorVersion): string {
  return `${version.major}.${version.minor}.0`;
}

let versionOverride: string | null = null;

/** Test seam: run the alias layer as if the package had this version. `null` restores the real version. */
export function __setMigrationAliasVersionForTests(version: string | null): void {
  versionOverride = version;
}

/** The package version the alias layer uses. */
export function migrationAliasVersion(): string {
  return versionOverride ?? readPackageMeta().version;
}

/**
 * The alias state for a package version. A version before the rename release
 * (a development build) keeps the alias. A later major release removes it.
 * A version that cannot be read keeps the alias, so an upgrade never breaks a
 * caller by mistake.
 */
export function migrationAliasState(
  version: string = migrationAliasVersion(),
  renameRelease: string = RENAME_RELEASE,
): MigrationAliasState {
  const current = parseMinorVersion(version);
  const introduced = parseMinorVersion(renameRelease);
  if (!current || !introduced) return "alias";
  if (current.major !== introduced.major) return current.major > introduced.major ? "removed" : "alias";
  const offset = current.minor - introduced.minor;
  if (offset < ALIAS_MINOR_RELEASES) return "alias";
  if (offset < ALIAS_MINOR_RELEASES + RENAMED_MINOR_RELEASES) return "renamed";
  return "removed";
}

/** The first release in which old names return `command-renamed`. */
export function aliasWindowEndRelease(renameRelease: string = RENAME_RELEASE): string {
  const introduced = parseMinorVersion(renameRelease)!;
  return formatMinorVersion({ major: introduced.major, minor: introduced.minor + ALIAS_MINOR_RELEASES });
}

/** The first release in which old names are removed. */
export function aliasRemovalRelease(renameRelease: string = RENAME_RELEASE): string {
  const introduced = parseMinorVersion(renameRelease)!;
  return formatMinorVersion({
    major: introduced.major,
    minor: introduced.minor + ALIAS_MINOR_RELEASES + RENAMED_MINOR_RELEASES,
  });
}

export interface CliMigrationAlias {
  /** Catalog ID: the registry operation. */
  id: string;
  /** Old CLI path after `make-docs`. */
  formerCli: string;
  /** New CLI path after `make-docs`. */
  newCli: string;
  renamedIn: string;
}

export interface McpMigrationAlias {
  /** Catalog ID: the registry operation, or the new name of a hand-defined tool. */
  id: string;
  formerMcp: string;
  newMcp: string;
  renamedIn: string;
}

function renamedCurrentEntries(): NameCatalogEntry[] {
  return NAME_CATALOG.filter((entry) => entry.status === "current");
}

/** Every old CLI path that W33 R0 renamed, from the name catalog. */
export function listCliMigrationAliases(): CliMigrationAlias[] {
  return renamedCurrentEntries()
    .filter((entry) => entry.cliCommand && entry.formerCli !== null && entry.formerCli !== entry.newCli)
    .map((entry) => ({ id: entry.id, formerCli: entry.formerCli!, newCli: entry.newCli, renamedIn: RENAME_RELEASE }));
}

/** Every old MCP tool name that W33 R0 renamed, from the name catalog. */
export function listMcpMigrationAliases(): McpMigrationAlias[] {
  return renamedCurrentEntries()
    .filter((entry) => entry.formerMcp !== null && entry.formerMcp !== entry.newMcp)
    .map((entry) => ({ id: entry.id, formerMcp: entry.formerMcp!, newMcp: entry.newMcp, renamedIn: RENAME_RELEASE }));
}

/**
 * The new groups that took the commands under one former `run` group word,
 * such as `run work` -> `work` and `backlog`. Empty for any other word.
 */
export function formerRunGroupTargets(word: string | undefined): string[] {
  if (!word) return [];
  const groups = new Set<string>();
  for (const alias of listCliMigrationAliases()) {
    const [root, group] = alias.formerCli.split(" ");
    if (root === "run" && group === word) groups.add(alias.newCli.split(" ")[0]!);
  }
  return [...groups];
}

const MCP_ALIASES_BY_NAME =new Map(listMcpMigrationAliases().map((alias) => [alias.formerMcp, alias]));

export function findMcpMigrationAlias(name: string): McpMigrationAlias | undefined {
  return MCP_ALIASES_BY_NAME.get(name);
}

/**
 * The old CLI path at the start of `argv`, matched word by word. The longest
 * old path wins. Flags end the match.
 */
export function matchCliMigrationAlias(
  argv: readonly string[],
): { alias: CliMigrationAlias; rest: string[] } | null {
  let best: { alias: CliMigrationAlias; length: number } | null = null;
  for (const alias of listCliMigrationAliases()) {
    const words = alias.formerCli.split(" ");
    if (words.length > argv.length) continue;
    if (!words.every((word, index) => argv[index] === word)) continue;
    if (!best || words.length > best.length) best = { alias, length: words.length };
  }
  return best ? { alias: best.alias, rest: argv.slice(best.length) } : null;
}

/** The typed result for an old name after its alias window (R-MIG-1). */
export class CommandRenamedError extends OperationError {
  readonly code = "command-renamed";
  readonly renamedTo: string;
  readonly nextAction: string;
  readonly details: { formerName: string; renamedTo: string; renamedIn: string; removedIn: string };

  constructor(input: { formerName: string; renamedTo: string; renamedIn: string; surface: "cli" | "mcp" }) {
    const formerName = input.surface === "cli" ? `make-docs ${input.formerName}` : input.formerName;
    const renamedTo = input.surface === "cli" ? `make-docs ${input.renamedTo}` : input.renamedTo;
    const removedIn = aliasRemovalRelease(input.renamedIn);
    super(
      input.surface === "cli"
        ? `\`${formerName}\` was renamed. Use \`${renamedTo}\`. The old name is removed in ${removedIn}.`
        : `The MCP tool \`${formerName}\` was renamed. Use \`${renamedTo}\`. The old name is removed in ${removedIn}.`,
    );
    this.name = "CommandRenamedError";
    this.renamedTo = renamedTo;
    this.nextAction = input.surface === "cli" ? `Run \`${renamedTo}\`.` : `Call \`${renamedTo}\`.`;
    this.details = { formerName, renamedTo, renamedIn: input.renamedIn, removedIn };
  }
}

/** The one line an alias prints. It names the new command and when the old one stops. */
export function cliAliasNotice(alias: CliMigrationAlias): string {
  return `make-docs: \`make-docs ${alias.formerCli}\` is now \`make-docs ${alias.newCli}\`. The old name stops working in ${aliasWindowEndRelease(alias.renamedIn)}.\n`;
}

export interface ResolvedCliMigration {
  /** The argv to run: the new path and the remaining arguments. */
  argv: string[];
  alias: CliMigrationAlias;
}

/**
 * Resolve an old CLI path for the running version. In the alias window it
 * returns the new argv. After the window it throws `command-renamed`. When
 * the alias is removed, or argv names no old path, it returns null and the
 * argv runs as given.
 */
export function resolveCliMigration(argv: readonly string[]): ResolvedCliMigration | null {
  const match = matchCliMigrationAlias(argv);
  if (!match) return null;
  const state = migrationAliasState();
  if (state === "removed") return null;
  if (state === "renamed") {
    throw new CommandRenamedError({
      formerName: match.alias.formerCli,
      renamedTo: match.alias.newCli,
      renamedIn: match.alias.renamedIn,
      surface: "cli",
    });
  }
  return { argv: [...match.alias.newCli.split(" "), ...match.rest], alias: match.alias };
}

const activeCliAlias = new AsyncLocalStorage<CliMigrationAlias>();

/** Run one CLI command under an alias, so its JSON output and errors carry `renamedTo`. */
export async function runWithCliAlias<T>(alias: CliMigrationAlias, run: () => Promise<T>): Promise<T> {
  try {
    return await activeCliAlias.run(alias, run);
  } catch (error) {
    if (error !== null && typeof error === "object" && !("renamedTo" in error)) {
      Object.assign(error, { renamedTo: `make-docs ${alias.newCli}` });
    }
    throw error;
  }
}

/**
 * Add `renamedTo` to a JSON result when the command ran through an old CLI
 * path. Other values and other runs are unchanged.
 */
export function withCliRenamedTo(value: unknown): unknown {
  const alias = activeCliAlias.getStore();
  if (!alias || value === null || typeof value !== "object" || Array.isArray(value)) return value;
  return { ...(value as Record<string, unknown>), renamedTo: `make-docs ${alias.newCli}` };
}
