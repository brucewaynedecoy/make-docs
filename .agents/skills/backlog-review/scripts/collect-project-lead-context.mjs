#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, readFileSync, realpathSync } from "node:fs";
import path from "node:path";

const excerptLimit = 2_000;
const excerptBlockLimit = 2;

function usage(message) {
  if (message) console.error(message);
  console.error(
    "Usage: node collect-project-lead-context.mjs --target-root <project> [--current-record <record-path>]...",
  );
  process.exit(2);
}

function parseArgs(values) {
  const result = { targetRoot: null, currentRecords: [] };
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (value === "--target-root" || value === "--current-record") {
      const next = values[index + 1];
      if (!next || next.startsWith("--")) usage(`Missing value for ${value}.`);
      if (value === "--target-root") result.targetRoot = next;
      else result.currentRecords.push(next);
      index += 1;
    } else {
      usage(`Unknown option: ${value}`);
    }
  }
  if (!result.targetRoot) usage("--target-root is required.");
  if (result.currentRecords.length > 3) usage("Use no more than three current records.");
  return result;
}

function safeRelativePath(value) {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    !path.isAbsolute(value) &&
    !value.includes("\\") &&
    !value.split("/").includes("..")
  );
}

function sourceFile(targetRoot, relativePath) {
  if (!safeRelativePath(relativePath)) usage(`Unsafe project path: ${relativePath}`);
  const absolutePath = path.resolve(targetRoot, relativePath);
  if (absolutePath !== targetRoot && !absolutePath.startsWith(`${targetRoot}${path.sep}`)) {
    usage(`Project path escapes the target root: ${relativePath}`);
  }
  if (!existsSync(absolutePath)) return null;
  const realRoot = realpathSync(targetRoot);
  const realPath = realpathSync(absolutePath);
  if (realPath !== realRoot && !realPath.startsWith(`${realRoot}${path.sep}`)) {
    usage(`Project path escapes the target root: ${relativePath}`);
  }
  const content = readFileSync(realPath, "utf8");
  return {
    relativePath,
    content,
    contentHash: createHash("sha256").update(content).digest("hex"),
  };
}

function markdownSections(content) {
  const lines = content.split(/\r?\n/);
  const sections = [];
  for (let index = 0; index < lines.length; index += 1) {
    const match = /^(#{1,6})\s+(.+?)\s*$/.exec(lines[index]);
    if (!match) continue;
    const level = match[1].length;
    let end = index + 1;
    while (end < lines.length) {
      const next = /^(#{1,6})\s+/.exec(lines[end]);
      if (next && next[1].length <= level) break;
      end += 1;
    }
    sections.push({
      heading: match[2].replace(/\s+#+\s*$/, "").trim(),
      line: index + 1,
      body: lines.slice(index + 1, end).join("\n").trim(),
    });
  }
  return sections;
}

function introduction(content) {
  const lines = content.split(/\r?\n/);
  let start = 0;
  if (lines[0] === "---") {
    const close = lines.indexOf("---", 1);
    if (close !== -1) start = close + 1;
  }
  while (start < lines.length && !/^#\s+/.test(lines[start])) start += 1;
  if (start < lines.length) start += 1;
  let end = start;
  while (end < lines.length && !/^##\s+/.test(lines[end])) end += 1;
  return { line: start + 1, body: lines.slice(start, end).join("\n").trim() };
}

function boundedExcerpt(value) {
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

function addMarkdownSource(sources, targetRoot, candidate) {
  const file = sourceFile(targetRoot, candidate.path);
  if (!file) return false;
  const sections = markdownSections(file.content);
  const section = candidate.headings
    .map((heading) =>
      sections.find((item) => item.heading.toLowerCase() === heading.toLowerCase()),
    )
    .find(Boolean);
  const selected = section || (candidate.allowIntroduction ? introduction(file.content) : null);
  if (!selected?.body) return false;
  sources.push({
    id: candidate.id,
    role: candidate.role,
    path: file.relativePath,
    heading: section?.heading || null,
    line: selected.line,
    excerpt: boundedExcerpt(selected.body),
    contentHash: file.contentHash,
  });
  return true;
}

function collectPurpose(sources, targetRoot) {
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
    const description = JSON.parse(manifest.content).description;
    if (typeof description !== "string" || description.trim().length === 0) return;
    sources.push({
      id: "purpose-package-description",
      role: "purpose",
      path: manifest.relativePath,
      heading: "description",
      line: 1,
      excerpt: boundedExcerpt(description),
      contentHash: manifest.contentHash,
    });
  } catch {
    // A malformed package manifest is not a supported summary source.
  }
}

function collectCurrentStatus(sources, targetRoot) {
  addMarkdownSource(sources, targetRoot, {
    id: "current-status-prd-index",
    role: "currentStatus",
    path: "docs/prd/00-index.md",
    headings: ["Current Status", "Current State", "Current Focus"],
    allowIntroduction: false,
  });
}

function collectCurrentObjectives(sources, targetRoot, currentRecords) {
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

const options = parseArgs(process.argv.slice(2));
const targetRoot = path.resolve(options.targetRoot);
const sources = [];
collectPurpose(sources, targetRoot);
collectCurrentStatus(sources, targetRoot);
collectCurrentObjectives(sources, targetRoot, options.currentRecords);

console.log(JSON.stringify({ schemaVersion: 1, targetRoot, sources }, null, 2));
