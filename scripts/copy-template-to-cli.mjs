#!/usr/bin/env node
import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..");

function syncDir(source, target, { required = true } = {}) {
  if (!existsSync(source)) {
    if (required) {
      console.error(`Source not found at ${source}`);
      process.exit(1);
    }
    console.error(`Source not found at ${source}, skipping`);
    return;
  }

  rmSync(target, { recursive: true, force: true });
  cpSync(source, target, { recursive: true });
  console.error(`Copied ${source} -> ${target}`);
}

const templateRoot = path.join(repoRoot, "packages", "docs", "template");
// Fail before replacing the build copy if retired upstream paths return, even empty.
for (const retired of [
  "docs/assets/archive", "docs/assets/artifacts", "docs/assets/library", "docs/assets/playbooks",
  "docs/artifacts", "docs/archive", "docs/library",
  ...["contracts", "prompts", "references", "templates", "scripts"].map((type) => `.make-docs/${type}/system`),
]) {
  if (existsSync(path.join(templateRoot, retired))) throw new Error(`Retired template directory: ${retired}`);
}

syncDir(
  path.join(repoRoot, "packages", "docs", "template"),
  path.join(repoRoot, "packages", "cli", "template"),
);

const rootRegistry = path.join(repoRoot, "conformance", "tuple-registry.json");
const packagedRegistry = path.join(repoRoot, "packages", "cli", "conformance", "tuple-registry.json");
validateJsonFile(rootRegistry, "root conformance tuple registry");
mkdirSync(path.dirname(packagedRegistry), { recursive: true });
cpSync(rootRegistry, packagedRegistry);
const rootRegistryDigest = sha256(readFileSync(rootRegistry));
const packagedRegistryDigest = sha256(readFileSync(packagedRegistry));
if (rootRegistryDigest !== packagedRegistryDigest) {
  throw new Error("Packaged conformance tuple registry does not match the root source.");
}
console.error(`Copied conformance registry with digest ${rootRegistryDigest}`);

validateJsonFile(
  path.join(repoRoot, "packages", "cli", "skill-registry.json"),
  "CLI skill registry",
);

function validateJsonFile(filePath, label) {
  if (!existsSync(filePath)) {
    console.error(`${label} not found at ${filePath}`);
    process.exit(1);
  }

  try {
    JSON.parse(readFileSync(filePath, "utf8"));
  } catch (error) {
    console.error(`${label} at ${filePath} is not valid JSON`);
    console.error(error);
    process.exit(1);
  }
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}
