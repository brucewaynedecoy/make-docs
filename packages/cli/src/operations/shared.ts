import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { OperationError, type JsonValue } from "./types";

export function findRepoRoot(start?: string): string {
  let current = path.resolve(start ?? process.cwd());
  while (true) {
    if (existsSync(path.join(current, "docs", "work")) || existsSync(path.join(current, ".git"))) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) {
      return path.resolve(start ?? process.cwd());
    }
    current = parent;
  }
}

export function loadJsonFile(filePath: string): JsonValue | null {
  if (!existsSync(filePath)) {
    return null;
  }
  return JSON.parse(readText(filePath)) as JsonValue;
}

export function readJsonFile(filePath: string): Record<string, JsonValue> {
  const value = JSON.parse(readText(path.resolve(filePath))) as JsonValue;
  return valueAsRecord(value);
}

export function readText(filePath: string): string {
  return readFileSync(filePath, "utf8");
}

export function utcNow(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "+00:00");
}

export function repoRelativePath(value: string | null | undefined, repoRoot: string): string | null {
  if (!value) {
    return value ?? null;
  }
  if (!path.isAbsolute(value)) {
    return normalizePath(value);
  }
  const relative = path.relative(repoRoot, value);
  return relative.startsWith("..") ? normalizePath(value) : normalizePath(relative || ".");
}

export function localizeStatePaths(value: JsonValue, repoRoot: string): JsonValue {
  if (Array.isArray(value)) {
    return value.map((item) => localizeStatePaths(item, repoRoot));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, localizeStatePaths(item, repoRoot)]),
    );
  }
  if (typeof value !== "string") {
    return value;
  }
  const root = normalizePath(path.resolve(repoRoot));
  const normalized = normalizePath(value);
  if (normalized === root) {
    return ".";
  }
  return normalized.replace(`${root}/`, "");
}

export function ensureRecord(parent: Record<string, JsonValue>, key: string): Record<string, JsonValue> {
  const current = parent[key];
  if (current && typeof current === "object" && !Array.isArray(current)) {
    return current as Record<string, JsonValue>;
  }
  const created: Record<string, JsonValue> = {};
  parent[key] = created;
  return created;
}

export function ensureArray(parent: Record<string, JsonValue>, key: string): JsonValue[] {
  const current = parent[key];
  if (Array.isArray(current)) {
    return current;
  }
  const created: JsonValue[] = [];
  parent[key] = created;
  return created;
}

export function valueAsRecord(value: unknown): Record<string, JsonValue> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, JsonValue>;
  }
  return {};
}

export function safeRunGit(repoRoot: string, args: string[]): string {
  const result = spawnSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
  });
  return result.status === 0 ? result.stdout : "";
}

export function runGit(repoRoot: string, args: string[]): string {
  const result = spawnSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
  });
  if (result.status !== 0) {
    throw new OperationError(result.stderr.trim() || result.stdout.trim() || "git command failed");
  }
  return result.stdout;
}

export function normalizePath(value: string): string {
  return value.split(path.sep).join("/");
}
