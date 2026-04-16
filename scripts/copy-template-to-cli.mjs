#!/usr/bin/env node
import { cpSync, existsSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..");
const source = path.join(repoRoot, "packages", "docs", "template");
const target = path.join(repoRoot, "packages", "cli", "template");

if (!existsSync(source)) {
  console.error(`Source template not found at ${source}`);
  process.exit(1);
}

if (existsSync(target)) {
  rmSync(target, { recursive: true, force: true });
}

cpSync(source, target, { recursive: true });
console.error(`Copied ${source} -> ${target}`);

const skillsSource = path.join(repoRoot, "packages", "skills");
const skillsTarget = path.join(repoRoot, "packages", "cli", "skills");

if (existsSync(skillsSource)) {
  if (existsSync(skillsTarget)) {
    rmSync(skillsTarget, { recursive: true, force: true });
  }

  cpSync(skillsSource, skillsTarget, { recursive: true });
  console.error(`Copied ${skillsSource} -> ${skillsTarget}`);
} else {
  console.error(`Skills source not found at ${skillsSource}, skipping skills bundling`);
}
