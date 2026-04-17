#!/usr/bin/env node
import { cpSync, existsSync, readFileSync, rmSync } from "node:fs";
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

syncDir(
  path.join(repoRoot, "packages", "docs", "template"),
  path.join(repoRoot, "packages", "cli", "template"),
);

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
