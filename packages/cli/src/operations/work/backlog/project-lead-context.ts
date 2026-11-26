import { createHash } from "node:crypto";
import { existsSync, readFileSync, realpathSync } from "node:fs";
import path from "node:path";

/**
 * Project-lead context collector (PRD 51 R-BACKLOG-SKILL-21).
 *
 * This is the one home of the collector logic. The Skill ships
 * `packages/skills/backlog-review/scripts/collect-project-lead-context.mjs`
 * as a generated bundle of this file, so it must use Node built-ins only.
 */

const excerptLimit = 2_000;
const excerptBlockLimit = 2;
const maxCurrentRecords = 3;

export const PROJECT_LEAD_CONTEXT_USAGE =
  "Usage: node collect-project-lead-context.mjs --target-root <project> [--current-record <record-path>]...";

/** A refused input. The script wrapper prints the message and the usage line, then exits 2. */
export class ProjectLeadContextUsageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProjectLeadContextUsageError";
  }
}

export type ProjectLeadContextRole = "purpose" | "currentStatus" | "currentObjective";

export interface ProjectLeadContextSource {
  id: string;
  role: ProjectLeadContextRole;
  path: string;
  heading: string | null;
  line: number;
  excerpt: string;
  contentHash: string;
}

export interface ProjectLeadContextPacket {
  schemaVersion: 1;
  targetRoot: string;
  sources: ProjectLeadContextSource[];
}

export interface ProjectLeadContextOptions {
  targetRoot: string;
  currentRecords: string[];
}

interface SourceFile {
  relativePath: string;
  content: string;
  contentHash: string;
}

interface MarkdownSection {
  heading: string;
  line: number;
  body: string;
}

interface MarkdownCandidate {
  id: string;
  role: ProjectLeadContextRole;
  path: string;
  headings: string[];
  allowIntroduction: boolean;
}

export function parseProjectLeadContextArgs(values: readonly string[]): ProjectLeadContextOptions {
  let targetRoot: string | null = null;
  const currentRecords: string[] = [];
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (value === "--target-root" || value === "--current-record") {
      const next = values[index + 1];
      if (!next || next.startsWith("--")) throw new ProjectLeadContextUsageError(`Missing value for ${value}.`);
      if (value === "--target-root") targetRoot = next;
      else currentRecords.push(next);
      index += 1;
    } else {
      throw new ProjectLeadContextUsageError(`Unknown option: ${value}`);
    }
  }
  if (!targetRoot) throw new ProjectLeadContextUsageError("--target-root is required.");
  if (currentRecords.length > maxCurrentRecords) {
    throw new ProjectLeadContextUsageError("Use no more than three current records.");
  }
  return { targetRoot, currentRecords };
}

function safeRelativePath(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    !path.isAbsolute(value) &&
    !value.includes("\\") &&
    !value.split("/").includes("..")
  );
}

function sourceFile(targetRoot: string, relativePath: string): SourceFile | null {
  if (!safeRelativePath(relativePath)) throw new ProjectLeadContextUsageError(`Unsafe project path: ${relativePath}`);
  const absolutePath = path.resolve(targetRoot, relativePath);
  if (absolutePath !== targetRoot && !absolutePath.startsWith(`${targetRoot}${path.sep}`)) {
    throw new ProjectLeadContextUsageError(`Project path escapes the target root: ${relativePath}`);
  }
  if (!existsSync(absolutePath)) return null;
  const realRoot = realpathSync(targetRoot);
  const realPath = realpathSync(absolutePath);
  if (realPath !== realRoot && !realPath.startsWith(`${realRoot}${path.sep}`)) {
    throw new ProjectLeadContextUsageError(`Project path escapes the target root: ${relativePath}`);
  }
  const content = readFileSync(realPath, "utf8");
  return {
    relativePath,
    content,
    contentHash: createHash("sha256").update(content).digest("hex"),
  };
}

function markdownSections(content: string): MarkdownSection[] {
  const lines = content.split(/\r?\n/);
  const sections: MarkdownSection[] = [];
  for (let index = 0; index < lines.length; index += 1) {
    const match = /^(#{1,6})\s+(.+?)\s*$/.exec(lines[index]!);
    if (!match) continue;
    const level = match[1]!.length;
    let end = index + 1;
    while (end < lines.length) {
      const next = /^(#{1,6})\s+/.exec(lines[end]!);
      if (next && next[1]!.length <= level) break;
      end += 1;
    }
    sections.push({
      heading: match[2]!.replace(/\s+#+\s*$/, "").trim(),
      line: index + 1,
      body: lines.slice(index + 1, end).join("\n").trim(),
    });
  }
  return sections;
}

function introduction(content: string): { line: number; body: string } {
  const lines = content.split(/\r?\n/);
  let start = 0;
  if (lines[0] === "---") {
    const close = lines.indexOf("---", 1);
    if (close !== -1) start = close + 1;
  }
  while (start < lines.length && !/^#\s+/.test(lines[start]!)) start += 1;
  if (start < lines.length) start += 1;
  let end = start;
  while (end < lines.length && !/^##\s+/.test(lines[end]!)) end += 1;
  return { line: start + 1, body: lines.slice(start, end).join("\n").trim() };
}

export function boundedProjectLeadExcerpt(value: string): string {
  const normalized = value
    .trim()
    .split(/\n\s*\n/)
    .slice(0, excerptBlockLimit)
    .join("\n\n");
  if (normalized.length <= excerptLimit) return normalized;
  const candidate = normalized.slice(0, excerptLimit + 1);
  const boundary = Math.max(candidate.lastIndexOf("\n"), candidate.lastIndexOf(". "));
  return `${candidate.slice(0, boundary > 400 ? boundary + 1 : excerptLimit).trim()}…`;
}

function addMarkdownSource(sources: ProjectLeadContextSource[], targetRoot: string, candidate: MarkdownCandidate): boolean {
  const file = sourceFile(targetRoot, candidate.path);
  if (!file) return false;
  const sections = markdownSections(file.content);
  const section = candidate.headings
    .map((heading) => sections.find((item) => item.heading.toLowerCase() === heading.toLowerCase()))
    .find(Boolean);
  const selected = section || (candidate.allowIntroduction ? introduction(file.content) : null);
  if (!selected?.body) return false;
  sources.push({
    id: candidate.id,
    role: candidate.role,
    path: file.relativePath,
    heading: section?.heading || null,
    line: selected.line,
    excerpt: boundedProjectLeadExcerpt(selected.body),
    contentHash: file.contentHash,
  });
  return true;
}

function collectPurpose(sources: ProjectLeadContextSource[], targetRoot: string): void {
  if (
    addMarkdownSource(sources, targetRoot, {
      id: "purpose-product-overview",
      role: "purpose",
      path: "docs/prd/01-product-overview.md",
      headings: ["Purpose", "Product Overview", "Overview"],
      allowIntroduction: true,
    })
  ) {
    return;
  }
  if (
    addMarkdownSource(sources, targetRoot, {
      id: "purpose-readme",
      role: "purpose",
      path: "README.md",
      headings: ["Purpose", "Overview"],
      allowIntroduction: true,
    })
  ) {
    return;
  }
  const manifest = sourceFile(targetRoot, "package.json");
  if (!manifest) return;
  try {
    const description: unknown = JSON.parse(manifest.content).description;
    if (typeof description !== "string" || description.trim().length === 0) return;
    sources.push({
      id: "purpose-package-description",
      role: "purpose",
      path: manifest.relativePath,
      heading: "description",
      line: 1,
      excerpt: boundedProjectLeadExcerpt(description),
      contentHash: manifest.contentHash,
    });
  } catch {
    // A malformed package manifest is not a supported summary source.
  }
}

function collectCurrentStatus(sources: ProjectLeadContextSource[], targetRoot: string): void {
  addMarkdownSource(sources, targetRoot, {
    id: "current-status-prd-index",
    role: "currentStatus",
    path: "docs/prd/00-index.md",
    headings: ["Current Status", "Current State", "Current Focus"],
    allowIntroduction: false,
  });
}

function collectCurrentObjectives(sources: ProjectLeadContextSource[], targetRoot: string, currentRecords: readonly string[]): void {
  currentRecords.forEach((recordPath, index) => {
    const indexPath = recordPath.endsWith(".md") ? recordPath : `${recordPath}/00-index.md`;
    addMarkdownSource(sources, targetRoot, {
      id: `current-objective-${index + 1}`,
      role: "currentObjective",
      path: indexPath,
      headings: ["Purpose", "Objective", "Overview"],
      allowIntroduction: false,
    });
  });
}

/**
 * Collect bounded purpose, current-status, and current-objective excerpts in a fixed source order.
 * Throws `ProjectLeadContextUsageError` for an unsafe path or a path that escapes the target root.
 */
export function collectProjectLeadContext(options: ProjectLeadContextOptions): ProjectLeadContextPacket {
  const targetRoot = path.resolve(options.targetRoot);
  const sources: ProjectLeadContextSource[] = [];
  collectPurpose(sources, targetRoot);
  collectCurrentStatus(sources, targetRoot);
  collectCurrentObjectives(sources, targetRoot, options.currentRecords);
  return { schemaVersion: 1, targetRoot, sources };
}

/** The Skill script body: parse arguments, collect, and print the packet as JSON. */
export function runCollectProjectLeadContextScript(argv: readonly string[]): void {
  try {
    const packet = collectProjectLeadContext(parseProjectLeadContextArgs(argv));
    console.log(JSON.stringify(packet, null, 2));
  } catch (error) {
    if (!(error instanceof ProjectLeadContextUsageError)) throw error;
    if (error.message) console.error(error.message);
    console.error(PROJECT_LEAD_CONTEXT_USAGE);
    process.exit(2);
  }
}
