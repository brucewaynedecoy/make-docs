import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { vi } from "vitest";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const RAW_REPO_PREFIX = "https://raw.githubusercontent.com/brucewaynedecoy/starter-docs/main/";

export function createTempDir(prefix = "starter-docs-test-"): string {
  return mkdtempSync(path.join(os.tmpdir(), prefix));
}

export function cleanupTempDir(targetDir: string): void {
  rmSync(targetDir, { recursive: true, force: true });
}

export function collectFiles(rootDir: string): string[] {
  return walk(rootDir).sort();
}

export function collectMarkdownContents(rootDir: string): string[] {
  return walk(rootDir)
    .filter((relativePath) => relativePath.endsWith(".md"))
    .map((relativePath) => readFileSync(path.join(rootDir, relativePath), "utf8"));
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
