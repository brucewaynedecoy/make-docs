import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { vi } from "vitest";
import { applyInstallPlan, planInstall } from "../src/install";
import { getManifestPath, loadManifest, mintProjectId } from "../src/manifest";
import { defaultSelections } from "../src/profile";
import { assertNoRepoRunState, trackTempDir, untrackTempDir } from "./run-state-boundary";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const RAW_REPO_PREFIX = "https://raw.githubusercontent.com/brucewaynedecoy/make-docs/main/";

export type TestInstallSelections = ReturnType<typeof defaultSelections>;

export function createTempDir(prefix = "make-docs-test-"): string {
  const tempDir = mkdtempSync(path.join(os.tmpdir(), prefix));
  // Registered for the suite-wide R-TEST-5 run-state boundary sweep; see
  // tests/run-state-boundary.ts.
  trackTempDir(tempDir);
  return tempDir;
}

export function cleanupTempDir(targetDir: string): void {
  // Suite-enforced R-TEST-5 boundary check: fail the owning test if any
  // Playbook run state landed under `.make-docs/runs/` in this fixture.
  assertNoRepoRunState(targetDir);
  rmSync(targetDir, { recursive: true, force: true });
  untrackTempDir(targetDir);
}

export function collectFiles(rootDir: string): string[] {
  return walk(rootDir).sort();
}

export function collectMarkdownContents(rootDir: string): string[] {
  return walk(rootDir)
    .filter((relativePath) => relativePath.endsWith(".md"))
    .map((relativePath) => readFileSync(path.join(rootDir, relativePath), "utf8"));
}

export function setTTY(value: boolean): void {
  Object.defineProperty(process.stdin, "isTTY", {
    configurable: true,
    value,
  });
  Object.defineProperty(process.stdout, "isTTY", {
    configurable: true,
    value,
  });
}

export async function installMakeDocsTarget(
  targetDir: string,
  configure?: (selections: TestInstallSelections) => void,
): Promise<void> {
  const selections = defaultSelections();
  configure?.(selections);

  const existingManifest = loadManifest(targetDir);
  const plan = await planInstall({
    targetDir,
    selections,
    existingManifest,
  });

  applyInstallPlan({
    targetDir,
    plan,
    existingManifest,
  });
}

/**
 * Writes a minimal but fully valid `.make-docs/manifest.json` carrying a
 * manifest-minted project identifier, without running the full installer.
 * Fixtures that exercise identity-keyed operations (lifecycle evidence,
 * registry mirroring) use this to stay fast.
 */
export function writeMinimalManifest(targetDir: string, projectId = mintProjectId()): string {
  const manifestPath = getManifestPath(targetDir);
  mkdirSync(path.dirname(manifestPath), { recursive: true });
  writeFileSync(
    manifestPath,
    `${JSON.stringify(
      {
        schemaVersion: 2,
        projectId,
        packageName: "make-docs-test",
        packageVersion: "0.0.0-test",
        updatedAt: new Date().toISOString(),
        profileId: "test",
        selections: {
          capabilities: { designs: true, plans: true, prd: true, work: true },
          harnesses: { "claude-code": true, codex: true },
          skills: false,
          skillScope: "project",
          selectedSkills: [],
          plugins: false,
          pluginScope: "project",
          selectedPlugins: [],
        },
        effectiveCapabilities: ["designs", "plans", "prd", "work"],
        files: {},
        skillFiles: [],
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
  return projectId;
}

export function mockHomeDirectory(homeDir: string): () => void {
  const previousHome = process.env.HOME;
  process.env.HOME = homeDir;
  vi.spyOn(os, "homedir").mockReturnValue(homeDir);

  return () => {
    if (previousHome === undefined) {
      delete process.env.HOME;
      return;
    }

    process.env.HOME = previousHome;
  };
}

export function mockSkillFetches(): void {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: unknown) => {
      const url = getRequestUrl(input);
      if (!url.startsWith(RAW_REPO_PREFIX)) {
        return createMockResponse(404, "Not Found", Buffer.from(""));
      }

      const relativePath = decodeURIComponent(url.slice(RAW_REPO_PREFIX.length));
      try {
        const body = readFileSync(path.join(REPO_ROOT, relativePath));
        return createMockResponse(200, "OK", body);
      } catch {
        return createMockResponse(404, "Not Found", Buffer.from(""));
      }
    }),
  );
}

function walk(rootDir: string, currentDir = rootDir): string[] {
  const entries = readdirSync(currentDir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const absolutePath = path.join(currentDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(rootDir, absolutePath));
    } else {
      files.push(path.relative(rootDir, absolutePath).split(path.sep).join("/"));
    }
  }

  return files;
}

function getRequestUrl(input: unknown): string {
  if (typeof input === "string") {
    return input;
  }

  if (input instanceof URL) {
    return input.href;
  }

  if (
    typeof input === "object" &&
    input !== null &&
    "url" in input &&
    typeof (input as { url: unknown }).url === "string"
  ) {
    return (input as { url: string }).url;
  }

  throw new Error(`Unsupported fetch input: ${String(input)}`);
}

function createMockResponse(status: number, statusText: string, body: Buffer): Response {
  const arrayBuffer = body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength);
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText,
    text: async () => body.toString("utf8"),
    arrayBuffer: async () => arrayBuffer,
  } as Response;
}
