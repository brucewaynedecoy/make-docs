import { existsSync, lstatSync, readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import { assertManagedPathHasNoSymlinks } from "./utils";

export const PATH_HYGIENE_ALLOW_TOKEN = "make-docs-path-hygiene: allow";

export type PathHygieneFindingKind =
  | "repo_root_absolute_path"
  | "posix_user_home_path"
  | "wsl_user_home_path"
  | "windows_user_home_path"
  | "macos_temp_path"
  | "absolute_markdown_link_destination";

export interface PathHygieneFinding {
  file: string;
  line: number;
  column: number;
  kind: PathHygieneFindingKind;
  match: string;
  suggestion: string | null;
  autoFixable: boolean;
  allowed: boolean;
  reason: string | null;
}

export interface PathHygieneScanResult {
  checkedFiles: number;
  changedFiles: string[];
  findings: PathHygieneFinding[];
  ioErrors: string[];
}

export interface PathHygieneValidationResult extends PathHygieneScanResult {
  schemaVersion: 1;
  targetRoot: string;
  valid: boolean;
  failingFindings: number;
}

export function validateProjectPathHygiene(input: {
  projectRoot: string;
  manifestPath?: string;
  includeSkills?: boolean;
  allowToken?: string;
}): PathHygieneValidationResult {
  const targetRoot = realpathSync(path.resolve(input.projectRoot));
  const result = scanPathHygieneManifest({
    projectRoot: targetRoot,
    ...(input.manifestPath ? { manifestPath: input.manifestPath } : {}),
    ...(input.includeSkills !== undefined ? { includeSkills: input.includeSkills } : {}),
    ...(input.allowToken ? { allowToken: input.allowToken } : {}),
  });
  const failingFindings = failingPathHygieneFindings(result.findings).length;
  return {
    schemaVersion: 1,
    targetRoot,
    ...result,
    valid: failingFindings === 0 && result.ioErrors.length === 0,
    failingFindings,
  };
}

const TEXT_EXTENSIONS = new Set([".md", ".rst", ".txt"]);
const SKILL_TEXT_EXTENSIONS = new Set([
  ...TEXT_EXTENSIONS,
  ".json",
  ".py",
  ".toml",
  ".yaml",
  ".yml",
]);
const POSIX_HOME = /\/(?:Users|home)\/[^/\s`"'<>()\[\]{}]+(?:\/[^\s`"'<>()\[\]{}]+)*/g;
const WSL_HOME = /\/mnt\/[A-Za-z]\/Users\/[^/\s`"'<>()\[\]{}]+(?:\/[^\s`"'<>()\[\]{}]+)*/g;
const WINDOWS_HOME = /[A-Za-z]:\\Users\\[^\\\s`"'<>()\[\]{}]+(?:\\[^\s`"'<>()\[\]{}]+)*/g;
const MACHINE_TEMP = /\/(?:private\/)?var\/folders\/[^\s`"'<>()\[\]{}]+/g;
const MARKDOWN_LINK = /!?\[[^\]]+\]\(([^)\s]+)([^)]*)\)/g;

export function scanPathHygieneText(input: {
  file: string;
  text: string;
  repoRoot: string;
  allowToken?: string;
}): PathHygieneFinding[] {
  const allowToken = input.allowToken ?? PATH_HYGIENE_ALLOW_TOKEN;
  const lines = input.text.split(/\r?\n/);
  const findings: PathHygieneFinding[] = [];
  for (const [index, line] of lines.entries()) {
    const allowLine = [line, ...(index > 0 ? [lines[index - 1]!] : [])]
      .find((candidate) => candidate.includes(allowToken));
    const allowed = allowLine !== undefined;
    const reason = allowLine
      ? allowLine.split(allowToken, 2)[1]!.trim().replace(/^[-:<>\s]+|[-:<>\s]+$/g, "") ||
        "allow comment present"
      : null;
    const seen = new Set<string>();
    const occupied: Array<[number, number]> = [];
    const add = (
      kind: PathHygieneFindingKind,
      match: string,
      column: number,
      suggestion: string | null,
      autoFixable: boolean,
    ) => {
      const key = `${kind}:${column}:${match}`;
      if (seen.has(key)) return;
      seen.add(key);
      findings.push({
        file: input.file,
        line: index + 1,
        column: column + 1,
        kind,
        match,
        suggestion,
        autoFixable,
        allowed,
        reason,
      });
    };

    const normalizedRoot = input.repoRoot.replace(/[\\/]+$/, "");
    for (let position = line.indexOf(normalizedRoot); position >= 0; position = line.indexOf(normalizedRoot, position + 1)) {
      const tail = line.slice(position + normalizedRoot.length).match(/^[^\s`"'<>()\[\]{}]*/)?.[0] ?? "";
      const match = `${normalizedRoot}${tail}`;
      add(
        "repo_root_absolute_path",
        match,
        position,
        repositorySuggestion(normalizedRoot, match, markdownDestinationAt(line, position, position + match.length)),
        true,
      );
      occupied.push([position, position + match.length]);
    }
    const addPattern = (
      pattern: RegExp,
      kind: PathHygieneFindingKind,
      suggestion: (match: string) => string | null,
    ) => collectRegex(line, pattern, (match, column) => {
      if (occupied.some(([start, end]) => start <= column && column < end)) return;
      add(kind, match, column, suggestion(match), false);
      occupied.push([column, column + match.length]);
    });
    addPattern(WSL_HOME, "wsl_user_home_path", homeSuggestion);
    addPattern(WINDOWS_HOME, "windows_user_home_path", homeSuggestion);
    addPattern(POSIX_HOME, "posix_user_home_path", homeSuggestion);
    addPattern(MACHINE_TEMP, "macos_temp_path", tempSuggestion);
    collectRegex(line, MARKDOWN_LINK, (_whole, column, groups) => {
      const destination = groups[0]!;
      const destinationColumn = column + line.slice(column).indexOf(destination);
      if (
        destination.startsWith("/") &&
        !destination.startsWith("//") &&
        !occupied.some(([start, end]) => start <= destinationColumn && destinationColumn < end)
      ) {
        add(
          "absolute_markdown_link_destination",
          destination,
          destinationColumn,
          destination.startsWith(normalizedRoot)
            ? repositorySuggestion(normalizedRoot, destination, true)
            : destination.startsWith("/")
              ? destination.slice(1)
              : homeSuggestion(destination),
          false,
        );
        occupied.push([destinationColumn, destinationColumn + destination.length]);
      }
    });
  }
  return findings.sort((left, right) =>
    left.line - right.line || left.column - right.column || compareCodeUnits(left.kind, right.kind),
  );
}

export function scanPathHygieneManifest(input: {
  projectRoot: string;
  manifestPath?: string;
  includeSkills?: boolean;
  allowToken?: string;
}): PathHygieneScanResult {
  const projectRoot = realpathSync(path.resolve(input.projectRoot));
  const manifestPath = path.resolve(
    projectRoot,
    input.manifestPath ?? ".make-docs/manifest.json",
  );
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
    files?: Record<string, unknown> | unknown[];
    skillFiles?: unknown;
  };
  const paths = new Set<string>();
  collectManifestPaths(paths, manifest.files);
  if (input.includeSkills && Array.isArray(manifest.skillFiles)) {
    collectManifestPaths(paths, manifest.skillFiles);
  }
  const findings: PathHygieneFinding[] = [];
  const ioErrors: string[] = [];
  let checkedFiles = 0;
  for (const relativePath of [...paths].sort(compareCodeUnits)) {
    const extension = path.posix.extname(relativePath).toLowerCase();
    const accepted = input.includeSkills
      ? SKILL_TEXT_EXTENSIONS.has(extension)
      : TEXT_EXTENSIONS.has(extension);
    if (!accepted) continue;
    if (!isSafeManifestPath(relativePath)) {
      ioErrors.push(`${relativePath}: manifest path is not repository-relative POSIX.`);
      continue;
    }
    try {
      assertManagedPathHasNoSymlinks(projectRoot, relativePath);
      const absolutePath = path.join(projectRoot, ...relativePath.split("/"));
      if (!existsSync(absolutePath)) {
        ioErrors.push(`missing managed file: ${relativePath}`);
        continue;
      }
      if (!lstatSync(absolutePath).isFile()) {
        ioErrors.push(`cannot read ${relativePath}: expected a regular text file`);
        continue;
      }
      checkedFiles += 1;
      findings.push(
        ...scanPathHygieneText({
          file: relativePath,
          text: readFileSync(absolutePath, "utf8"),
          repoRoot: projectRoot,
          allowToken: input.allowToken,
        }),
      );
    } catch (error) {
      ioErrors.push(`${relativePath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return { checkedFiles, changedFiles: [], findings, ioErrors };
}

export function failingPathHygieneFindings(
  findings: readonly PathHygieneFinding[],
): PathHygieneFinding[] {
  return findings.filter((finding) => !finding.allowed);
}

export function fixRepositoryRootPaths(text: string, repoRoot: string): string {
  const root = repoRoot.replace(/[\\/]+$/, "");
  return text
    .split(/\r?\n/)
    .map((line) => {
      let updated = line;
      let position = updated.indexOf(root);
      while (position >= 0) {
        const tail = updated.slice(position + root.length).match(/^[^\s`"'<>()\[\]{}]*/)?.[0] ?? "";
        const matched = `${root}${tail}`;
        updated = `${updated.slice(0, position)}${repositorySuggestion(root, matched)}${updated.slice(position + matched.length)}`;
        position = updated.indexOf(root, position + 1);
      }
      return updated;
    })
    .join("\n");
}

function collectRegex(
  line: string,
  pattern: RegExp,
  collect: (match: string, column: number, groups: string[]) => void,
): void {
  pattern.lastIndex = 0;
  for (let match = pattern.exec(line); match; match = pattern.exec(line)) {
    collect(match[0], match.index, match.slice(1));
    if (match[0].length === 0) pattern.lastIndex += 1;
  }
}

function repositorySuggestion(root: string, matched: string, inLink = false): string {
  const relative = matched.slice(root.length).replace(/^[/\\]+/, "").replace(/\\/g, "/");
  if (relative.length === 0) return ".";
  return inLink ? relative : `./${relative}`;
}

function homeSuggestion(value: string): string {
  const normalized = value.replace(/\\/g, "/");
  const segments = normalized.split("/").filter(Boolean);
  const userIndex = segments.findIndex((segment) => segment === "Users" || segment === "home");
  const tail = userIndex >= 0 ? segments.slice(userIndex + 2).join("/") : "";
  const separator = value.includes("\\") ? "\\" : "/";
  return tail ? `<user-home>${separator}${tail.replace(/\//g, separator)}` : "<user-home>";
}

function tempSuggestion(value: string): string {
  const match = value.match(/^\/(?:private\/)?var\/folders\/[^/]+\/[^/]+\/(.*)$/);
  return match?.[1] ? `<temp-dir>/${match[1]}` : "<temp-dir>/...";
}

function markdownDestinationAt(line: string, start: number, end: number): boolean {
  MARKDOWN_LINK.lastIndex = 0;
  for (let match = MARKDOWN_LINK.exec(line); match; match = MARKDOWN_LINK.exec(line)) {
    const destination = match[1]!;
    const destinationStart = match.index + match[0].indexOf(destination);
    if (destinationStart <= start && end <= destinationStart + destination.length) return true;
  }
  return false;
}

function collectManifestPaths(paths: Set<string>, value: unknown): void {
  if (Array.isArray(value)) {
    for (const item of value) {
      if (typeof item === "string") paths.add(item);
      else if (
        typeof item === "object" &&
        item !== null &&
        typeof (item as { path?: unknown }).path === "string"
      ) {
        paths.add((item as { path: string }).path);
      }
    }
    return;
  }
  if (typeof value === "object" && value !== null) {
    for (const item of Object.keys(value)) paths.add(item);
  }
}

function isSafeManifestPath(value: string): boolean {
  return (
    value.length > 0 &&
    !value.includes("\\") &&
    !path.posix.isAbsolute(value) &&
    path.posix.normalize(value) === value &&
    !value.startsWith("../") &&
    value !== ".."
  );
}

function compareCodeUnits(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
