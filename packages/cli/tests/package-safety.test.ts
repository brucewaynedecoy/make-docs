/** Test layer: unit. PRDs 10, 16, and 38 package and ownership safety. */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { TEMPLATE_ROOT } from "../src/utils";

const REPO_ROOT = path.resolve(TEMPLATE_ROOT, "..", "..", "..");
const CONTENT_MARKERS = [
  "make-docs.conformance.tuple-registry",
  "conformance.scenario.v1",
  "conformance.result.v1",
  "conformance.result.v2",
] as const;
const PATH_PATTERNS = [
  /(?:^|\/)conformance(?:\/|$)/,
  /(?:^|\/)docs\/assets\/conformance(?:\/|$)/,
  /(?:^|\/)(?:tuple-registry\.json|conformance-(?:kit|ingest|scenario|result|transcript|bootstrap)[^/]*)$/,
  /(?:^|\/)[^/]*conformance-lab[^/]*$/,
  /(?:^|\/)[^/]*(?:support|setup)-lab-(?:result|scenario|transcript|bootstrap)[^/]*$/,
] as const;

function walkFiles(root: string): string[] {
  if (!existsSync(root)) return [];
  const files: string[] = [];
  const pending = [root];
  while (pending.length > 0) {
    const current = pending.pop()!;
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) pending.push(absolute);
      else files.push(absolute);
    }
  }
  return files.sort();
}

function listRetiredConformanceAssets(root: string): string[] {
  const violations: string[] = [];
  for (const absolute of walkFiles(root)) {
    const relative = path.relative(root, absolute).split(path.sep).join("/");
    if (PATH_PATTERNS.some((pattern) => pattern.test(relative))) {
      violations.push(relative);
      continue;
    }
    const content = readFileSync(absolute, "utf8");
    if (CONTENT_MARKERS.some((marker) => content.includes(marker))) violations.push(relative);
  }
  return violations;
}

describe("current package safety", () => {
  test("the publish allowlist and copy step have no retired conformance input", () => {
    const packageJson = JSON.parse(
      readFileSync(path.join(REPO_ROOT, "packages/cli/package.json"), "utf8"),
    ) as { files?: string[]; scripts?: Record<string, string> };
    expect(packageJson.files ?? []).toEqual([
      "dist",
      "template",
      "skill-registry.json",
      "skill-registry.schema.json",
      "README.md",
    ]);
    expect(Object.keys(packageJson.scripts ?? {})).not.toContain("conformance:kit");
    expect(Object.keys(packageJson.scripts ?? {})).not.toContain("conformance:ingest");

    const copyScript = readFileSync(path.join(REPO_ROOT, "scripts/copy-template-to-cli.mjs"), "utf8");
    expect(copyScript).not.toContain("tuple-registry");
    expect(copyScript).not.toContain('path.join(repoRoot, "conformance"');
  });

  test("the source and generated package templates contain no retired conformance asset", () => {
    expect(listRetiredConformanceAssets(path.join(REPO_ROOT, "packages/docs/template"))).toEqual([]);
    expect(listRetiredConformanceAssets(path.join(REPO_ROOT, "packages/cli/template"))).toEqual([]);
  });

  test("packed validation retains managed-file, exact-CLI, and Store-free checks", () => {
    const smoke = readFileSync(path.join(REPO_ROOT, "scripts/smoke-pack.mjs"), "utf8");
    expect(smoke).toContain("managedPathsBeforeRemoval");
    expect(smoke).toContain("Store-owned managed file");
    expect(smoke).toContain('process.execPath, [resolvedPackedMakeDocs, "--version"]');
    expect(smoke).toContain("resource-store-must-not-open");
    expect(smoke).toContain("Packed Store-free resource operations opened a Store session");
    const stateStatusCheck = smoke.slice(
      smoke.indexOf("function assertPackedStateStatus"),
      smoke.indexOf("function assertStoreBootstrapAndNoRepoStateWrites"),
    );
    expect(stateStatusCheck).not.toContain("inspectStore(");
    expect(stateStatusCheck).not.toContain("catch (");
  });
});
