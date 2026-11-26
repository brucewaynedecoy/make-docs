/**
 * W34 R0 P1: document relations (PRD 39 R-SKILL-CHECK-3, R-SKILL-CHECK-7).
 *
 * This is the TypeScript form of the logic that lived in the Python relation
 * tracer of the archive-docs Skill (removed in W34 R0 P4). It finds
 * designs, plans, work backlogs, history records, and guides, and the four
 * kinds of relation between them. Each relation names its kind and the file
 * that holds it. The archive-docs Skill text is the agent form and uses the
 * same kind IDs (PRD 25 R-SKILL-RUNTIME-7).
 *
 * Planned changes from the script: guide folders come from the effective
 * Persona set, paths are project-relative, a link's `#fragment` is not part of
 * its target, and a W/R coordinate does not match a longer number (`r1` does
 * not match `r10`).
 */
import { existsSync, readdirSync, readFileSync, realpathSync, statSync } from "node:fs";
import path from "node:path";
import { RESERVED_PERSONA_SLUGS } from "../../config";
import { listProjectPersonas } from "../../persona";
import { OperationError } from "../types";

export const RELATION_KINDS = [
  {
    id: "relations.markdown-link",
    description: "A Markdown link in one artifact to another: work to plan, plan to design, and back.",
  },
  {
    id: "relations.related-front-matter",
    description: "An entry in the `related:` list of a guide's front matter.",
  },
  {
    id: "relations.history-coordinate",
    description: "A history record and a plan or work backlog with the same W/R coordinate.",
  },
  {
    id: "relations.same-slug",
    description: "Two artifacts whose names have the same slug after the date and W/R parts. It is a guess, not a link.",
  },
] as const;
export type RelationKindId = (typeof RELATION_KINDS)[number]["id"];
export const RELATION_KIND_IDS: readonly RelationKindId[] = RELATION_KINDS.map((kind) => kind.id);

export type ArtifactType = "history-record" | "design" | "plan" | "work" | "guide";
export type RelationDirection = "upstream" | "downstream" | "lateral";

export interface Relation {
  /** Project-relative path of the other artifact. A folder ends with `/`. */
  target: string;
  kind: RelationKindId;
  /** Project-relative path of the file that holds the relation. */
  sourceFile: string;
}

export interface Artifact {
  path: string;
  type: ArtifactType;
  /** The Persona of a guide folder. */
  persona?: string;
  upstream: Relation[];
  downstream: Relation[];
  lateral: Relation[];
}

export type ArtifactMap = Map<string, Artifact>;

const LINK_RE = /\[([^\]]*)\]\(([^)]+)\)/g;
const DATE_PREFIX_RE = /^\d{4}-\d{2}-\d{2}-/;
const WAVE_PREFIX_RE = /^w\d+-r\d+-/;
const HISTORY_COORDINATE_RE = /\bW(\d+)\s+R(\d+)/i;
const LEGACY_HISTORY_WR_RE = /w(\d+)-r(\d+)/;
const COORDINATE_RE = /^coordinate:\s*["']?([^"'\n]+)["']?/m;
const ROUTER_FILENAMES = new Set(["AGENTS.md", "CLAUDE.md"]);
const RELATED_BLOCK_RE = /^related:\s*\n((?:\s*-\s*.+\n?)+)/m;
const RELATED_ITEM_RE = /^\s*-\s*(.+)/gm;
const FRONTMATTER_RE = /^---\s*\n([\s\S]*?)\n---/;

const UPSTREAM_MAP: Partial<Record<ArtifactType, ArtifactType>> = { work: "plan", plan: "design" };
const DOWNSTREAM_MAP: Partial<Record<ArtifactType, ArtifactType>> = { design: "plan", plan: "work" };

function toPosix(value: string): string {
  return value.split(path.sep).join("/");
}

function isDirectory(target: string): boolean {
  try {
    return statSync(target).isDirectory();
  } catch {
    return false;
  }
}

function isFile(target: string): boolean {
  try {
    return statSync(target).isFile();
  } catch {
    return false;
  }
}

function readText(file: string): string | null {
  try {
    return readFileSync(file, "utf8").replace(/\r\n?/g, "\n");
  } catch {
    return null;
  }
}

function markdownUnder(directory: string): string[] {
  const out: string[] = [];
  const walk = (current: string) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && entry.name.endsWith(".md")) out.push(full);
    }
  };
  walk(directory);
  return out.sort((left, right) => comparePathParts(toPosix(left), toPosix(right)));
}

function comparePathParts(left: string, right: string): number {
  const a = left.split("/");
  const b = right.split("/");
  for (let index = 0; index < Math.min(a.length, b.length); index += 1) {
    if (a[index] !== b[index]) return a[index]! < b[index]! ? -1 : 1;
  }
  return a.length - b.length;
}

/** The slug of a name: the date, the W/R part, and `.md` removed. */
export function extractSlug(name: string): string {
  let slug = name.replace(DATE_PREFIX_RE, "").replace(WAVE_PREFIX_RE, "");
  if (slug.endsWith(".md")) slug = slug.slice(0, -3);
  return slug.replace(/\/+$/, "");
}

export interface ArtifactFolder {
  /** Project-relative folder. */
  folder: string;
  type: ArtifactType;
  persona?: string;
}

/** The folders that hold artifacts: the fixed ones, then one guide folder for each effective Persona. */
export function artifactFolders(targetRoot: string): ArtifactFolder[] {
  const personas = listProjectPersonas(targetRoot).personas.map((persona) => persona.slug);
  return [
    { folder: ".make-docs/archive/history", type: "history-record" },
    { folder: "docs/designs", type: "design" },
    { folder: "docs/plans", type: "plan" },
    { folder: "docs/work", type: "work" },
    ...personas.map((slug) => ({ folder: `docs/assets/${slug}`, type: "guide" as const, persona: slug })),
  ];
}

function newArtifact(artifactPath: string, folder: ArtifactFolder): Artifact {
  return {
    path: artifactPath,
    type: folder.type,
    ...(folder.persona ? { persona: folder.persona } : {}),
    upstream: [],
    downstream: [],
    lateral: [],
  };
}

/** Find the artifacts: each Markdown file and each folder at the top of an artifact folder, and the Markdown files in each such folder. */
export function discoverArtifacts(targetRoot: string, folders: readonly ArtifactFolder[] = artifactFolders(targetRoot)): ArtifactMap {
  const artifacts: ArtifactMap = new Map();
  for (const folder of folders) {
    const directory = path.join(targetRoot, folder.folder);
    if (!isDirectory(directory)) continue;
    for (const name of readdirSync(directory).sort()) {
      const entry = path.join(directory, name);
      if (isFile(entry) && name.endsWith(".md")) {
        if (ROUTER_FILENAMES.has(name)) continue;
        const key = toPosix(path.relative(targetRoot, entry));
        artifacts.set(key, newArtifact(key, folder));
      } else if (isDirectory(entry)) {
        const key = `${toPosix(path.relative(targetRoot, entry))}/`;
        artifacts.set(key, newArtifact(key, folder));
        for (const child of markdownUnder(entry)) {
          const childKey = toPosix(path.relative(targetRoot, child));
          if (!artifacts.has(childKey)) artifacts.set(childKey, newArtifact(childKey, folder));
        }
      }
    }
  }
  return artifacts;
}

function extractLinks(text: string): string[] {
  const targets: string[] = [];
  for (const match of text.matchAll(LINK_RE)) {
    const href = match[2]!;
    if (["http://", "https://", "#", "mailto:"].some((prefix) => href.startsWith(prefix))) continue;
    targets.push(href);
  }
  return targets;
}

/** The `related:` list in a file's front matter. */
export function extractRelated(text: string): string[] {
  const frontmatter = FRONTMATTER_RE.exec(text);
  if (!frontmatter) return [];
  const block = RELATED_BLOCK_RE.exec(frontmatter[1]!);
  if (!block) return [];
  return [...block[1]!.matchAll(RELATED_ITEM_RE)].map((match) => match[1]!.trim());
}

/** The W/R of a history record: the `coordinate:` front matter, else a legacy `wN-rN` file name. */
export function extractHistoryCoordinate(text: string, fileName: string): [string, string] | null {
  const frontmatter = FRONTMATTER_RE.exec(text);
  if (frontmatter) {
    const coordinate = COORDINATE_RE.exec(frontmatter[1]!);
    if (coordinate) {
      const wr = HISTORY_COORDINATE_RE.exec(coordinate[1]!);
      if (wr) return [wr[1]!, wr[2]!];
    }
  }
  const legacy = LEGACY_HISTORY_WR_RE.exec(fileName);
  return legacy ? [legacy[1]!, legacy[2]!] : null;
}

function isInside(root: string, candidate: string): boolean {
  const relative = path.relative(root, candidate);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

/** Python `Path.resolve()` without `strict`. */
function resolvePath(value: string): string {
  let existing = path.resolve(value);
  const rest: string[] = [];
  while (!existsSync(existing)) {
    const parent = path.dirname(existing);
    if (parent === existing) break;
    rest.unshift(path.basename(existing));
    existing = parent;
  }
  let real = existing;
  try {
    real = realpathSync(existing);
  } catch {
    // Keep the lexical path.
  }
  return path.join(real, ...rest);
}

/**
 * Resolve a link in a project-relative source file to a project-relative
 * target under `docs/` or `.make-docs/archive/`, or null. A folder ends with `/`.
 */
export function resolveLink(targetRoot: string, sourceFile: string, href: string): string | null {
  const root = resolvePath(targetRoot);
  const source = path.join(root, sourceFile);
  const base = isFile(source) ? path.dirname(source) : source;
  const hrefPath = href.split("#", 1)[0]!;
  if (!hrefPath) return null;
  const resolved = resolvePath(path.join(base, hrefPath));
  const allowed = [resolvePath(path.join(root, "docs")), resolvePath(path.join(root, ".make-docs", "archive"))];
  if (!allowed.some((folder) => isInside(folder, resolved))) return null;
  const relative = toPosix(path.relative(root, resolved));
  return isDirectory(resolved) ? `${relative}/` : relative;
}

function addRelation(artifact: Artifact, direction: RelationDirection, target: string, kind: RelationKindId, sourceFile: string): void {
  if (artifact[direction].some((existing) => existing.target === target)) return;
  artifact[direction].push({ target, kind, sourceFile });
}

function artifactFiles(targetRoot: string, artifact: Artifact): string[] {
  const full = path.join(targetRoot, artifact.path.replace(/\/$/, ""));
  if (isFile(full) && full.endsWith(".md")) return [full];
  if (isDirectory(full)) return markdownUnder(full);
  return [];
}

/** Markdown links: work to plan and plan to design are upstream, the reverse is downstream. Returns the pair count. */
export function buildLinkRelationships(artifacts: ArtifactMap, targetRoot: string): number {
  let count = 0;
  for (const artifact of [...artifacts.values()]) {
    for (const file of artifactFiles(targetRoot, artifact)) {
      const text = readText(file);
      if (text === null) continue;
      const sourceFile = toPosix(path.relative(targetRoot, file));
      for (const href of extractLinks(text)) {
        const target = resolveLink(targetRoot, sourceFile, href);
        if (target === null || !artifacts.has(target)) continue;
        const other = artifacts.get(target)!;
        if (UPSTREAM_MAP[artifact.type] === other.type) {
          addRelation(artifact, "upstream", target, "relations.markdown-link", sourceFile);
          addRelation(other, "downstream", artifact.path, "relations.markdown-link", sourceFile);
          count += 1;
        } else if (DOWNSTREAM_MAP[artifact.type] === other.type) {
          addRelation(artifact, "downstream", target, "relations.markdown-link", sourceFile);
          addRelation(other, "upstream", artifact.path, "relations.markdown-link", sourceFile);
          count += 1;
        }
      }
    }
  }
  return count;
}

/** `related:` front matter in guides. Returns the pair count. */
export function buildRelatedRelationships(artifacts: ArtifactMap, targetRoot: string): number {
  let count = 0;
  for (const artifact of [...artifacts.values()]) {
    if (artifact.type !== "guide") continue;
    const full = path.join(targetRoot, artifact.path);
    if (!isFile(full)) continue;
    const text = readText(full);
    if (text === null) continue;
    for (const related of extractRelated(text)) {
      const target = resolveLink(targetRoot, artifact.path, related);
      if (target && artifacts.has(target)) {
        addRelation(artifact, "lateral", target, "relations.related-front-matter", artifact.path);
        addRelation(artifacts.get(target)!, "lateral", artifact.path, "relations.related-front-matter", artifact.path);
        count += 1;
      }
    }
  }
  return count;
}

/** History records and the plans and work in the same Wave and Revision. Returns the pair count. */
export function buildHistoryCoordinateRelationships(artifacts: ArtifactMap, targetRoot: string): number {
  let count = 0;
  const records = [...artifacts.values()].filter((artifact) => artifact.type === "history-record");
  const others = [...artifacts.values()].filter((artifact) => artifact.type === "plan" || artifact.type === "work");
  for (const record of records) {
    const full = path.join(targetRoot, record.path);
    if (!isFile(full)) continue;
    const text = readText(full);
    if (text === null) continue;
    const coordinate = extractHistoryCoordinate(text, path.posix.basename(record.path));
    if (!coordinate) continue;
    const [wave, revision] = coordinate;
    const pattern = new RegExp(`w${wave}-r${revision}(?!\\d)`);
    for (const other of others) {
      if (pattern.test(path.posix.basename(other.path.replace(/\/$/, "")))) {
        addRelation(record, "lateral", other.path, "relations.history-coordinate", record.path);
        addRelation(other, "lateral", record.path, "relations.history-coordinate", record.path);
        count += 1;
      }
    }
  }
  return count;
}

function alreadyLinked(artifact: Artifact, target: string): boolean {
  return (["upstream", "downstream", "lateral"] as const).some((direction) => artifact[direction].some((relation) => relation.target === target));
}

function slugDirection(source: ArtifactType, target: ArtifactType): RelationDirection {
  if (UPSTREAM_MAP[source] === target) return "upstream";
  if (DOWNSTREAM_MAP[source] === target) return "downstream";
  return "lateral";
}

function inverse(direction: RelationDirection): RelationDirection {
  return direction === "upstream" ? "downstream" : direction === "downstream" ? "upstream" : "lateral";
}

/** Same-slug matches between artifacts that no other relation joins. Returns the pair count. */
export function buildSameSlugRelationships(artifacts: ArtifactMap): number {
  let count = 0;
  const bySlug = new Map<string, string[]>();
  for (const key of artifacts.keys()) {
    const slug = extractSlug(path.posix.basename(key.replace(/\/$/, "")));
    if (slug) bySlug.set(slug, [...(bySlug.get(slug) ?? []), key]);
  }
  for (const keys of bySlug.values()) {
    for (let i = 0; i < keys.length; i += 1) {
      for (const b of keys.slice(i + 1)) {
        const a = keys[i]!;
        const left = artifacts.get(a)!;
        const right = artifacts.get(b)!;
        if (alreadyLinked(left, b)) continue;
        const direction = slugDirection(left.type, right.type);
        addRelation(left, direction, b, "relations.same-slug", a);
        addRelation(right, inverse(direction), a, "relations.same-slug", b);
        count += 1;
      }
    }
  }
  return count;
}

export interface SkippedAssetFolder {
  folder: string;
  reason: "not-a-persona";
}

/**
 * Folders under `docs/assets/` that are not a configured Persona and not a
 * reserved project folder, such as `project`. The script read them as guide
 * folders. The command skips them and names each one.
 */
export function skippedAssetFolders(targetRoot: string, folders: readonly ArtifactFolder[]): SkippedAssetFolder[] {
  const assets = path.join(targetRoot, "docs", "assets");
  if (!isDirectory(assets)) return [];
  const personas = new Set(folders.filter((folder) => folder.type === "guide").map((folder) => folder.persona));
  return readdirSync(assets, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.isSymbolicLink() && !personas.has(entry.name) && !RESERVED_PERSONA_SLUGS.has(entry.name))
    .map((entry) => ({ folder: `docs/assets/${entry.name}`, reason: "not-a-persona" as const }))
    .sort((left, right) => (left.folder < right.folder ? -1 : left.folder > right.folder ? 1 : 0));
}

export interface ProjectRelationsResult {
  schemaVersion: 1;
  operation: "project.relations.list";
  targetRoot: string;
  summary: string;
  /** The `--path` input, or null for the whole project. */
  focus: string | null;
  /** The folders that were read, with each guide folder's Persona. */
  folders: ArtifactFolder[];
  /** The `docs/assets/` folders that are not a configured Persona. They are not read. */
  skippedFolders: SkippedAssetFolder[];
  totals: {
    artifacts: number;
    shown: number;
    /** Relation entries in the shown artifacts. Each pair shows on both of its artifacts. */
    relations: number;
    /** Pairs found in the whole project, by kind. */
    pairsByKind: Record<RelationKindId, number>;
  };
  kinds: typeof RELATION_KINDS;
  artifacts: Artifact[];
}

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

/** `project relations list`: every artifact and its relations, or one artifact's with `path`. Changes nothing. */
export function listProjectRelations(input: { targetRoot: string; path?: string }): ProjectRelationsResult {
  const targetRoot = path.resolve(input.targetRoot);
  if (!isDirectory(targetRoot)) throw new OperationError(`The project folder ${targetRoot} does not exist.`);
  const folders = artifactFolders(targetRoot);
  const artifacts = discoverArtifacts(targetRoot, folders);
  const pairsByKind: Record<RelationKindId, number> = {
    "relations.markdown-link": buildLinkRelationships(artifacts, targetRoot),
    "relations.related-front-matter": buildRelatedRelationships(artifacts, targetRoot),
    "relations.history-coordinate": buildHistoryCoordinateRelationships(artifacts, targetRoot),
    "relations.same-slug": buildSameSlugRelationships(artifacts),
  };
  let shown = [...artifacts.values()];
  let focus: string | null = null;
  if (input.path !== undefined) {
    const absolute = path.resolve(targetRoot, input.path);
    if (!isInside(targetRoot, absolute)) throw new OperationError(`The path \`${input.path}\` is outside the project.`);
    focus = toPosix(path.relative(targetRoot, absolute)) + (input.path.endsWith("/") ? "/" : "");
    const exact = artifacts.get(focus) ?? artifacts.get(`${focus.replace(/\/$/, "")}/`);
    shown = exact ? [exact] : shown.filter((artifact) => artifact.path.startsWith(focus!));
  }
  shown.sort((left, right) => (left.path < right.path ? -1 : left.path > right.path ? 1 : 0));
  const relations = shown.reduce((sum, artifact) => sum + artifact.upstream.length + artifact.downstream.length + artifact.lateral.length, 0);
  const pairs = Object.values(pairsByKind).reduce((sum, value) => sum + value, 0);
  const summary = focus !== null && shown.length === 0
    ? `No artifact matches ${focus}. Read ${plural(artifacts.size, "artifact")}. Changes nothing.`
    : focus !== null
      ? `Showing ${plural(shown.length, "artifact")} that ${shown.length === 1 ? "matches" : "match"} ${focus}, with ${plural(relations, "relation")}. Changes nothing.`
      : `Read ${plural(artifacts.size, "artifact")} and found ${plural(pairs, "relation")}: ${pairsByKind["relations.markdown-link"]} Markdown links, ${pairsByKind["relations.related-front-matter"]} related: entries, ${pairsByKind["relations.history-coordinate"]} history coordinates, and ${pairsByKind["relations.same-slug"]} same-slug guesses. Changes nothing.`;
  return {
    schemaVersion: 1,
    operation: "project.relations.list",
    targetRoot,
    summary,
    focus,
    folders,
    skippedFolders: skippedAssetFolders(targetRoot, folders),
    totals: { artifacts: artifacts.size, shown: shown.length, relations, pairsByKind },
    kinds: RELATION_KINDS,
    artifacts: shown,
  };
}

/** Plain words for `project relations list`: the totals first, then each artifact and its relations. */
export function renderProjectRelations(result: ProjectRelationsResult): string {
  const guides = result.folders.filter((folder) => folder.type === "guide").map((folder) => folder.folder);
  const lines = [`Document relations: ${result.summary}`, `Project: ${result.targetRoot}`, `Guide folders from the Persona set: ${guides.join(", ")}`];
  for (const skipped of result.skippedFolders) lines.push(`Skipped: ${skipped.folder} (not a configured Persona folder; make-docs project persona list shows the Personas)`);
  for (const artifact of result.artifacts) {
    const relations = (["upstream", "downstream", "lateral"] as const).flatMap((direction) => artifact[direction].map((relation) => ({ direction, relation })));
    if (relations.length === 0 && result.focus === null) continue;
    lines.push("", `${artifact.path} (${artifact.type}${artifact.persona ? `, ${artifact.persona}` : ""})`);
    if (relations.length === 0) lines.push("  No relations.");
    for (const { direction, relation } of relations) {
      lines.push(`  ${direction} -> ${relation.target} [${relation.kind}, in ${relation.sourceFile}]`);
    }
  }
  if (result.focus === null && result.artifacts.some((artifact) => artifact.upstream.length + artifact.downstream.length + artifact.lateral.length === 0)) {
    lines.push("", "Artifacts with no relation are left out. Use --json to see every artifact.");
  }
  lines.push("");
  return lines.join("\n");
}
