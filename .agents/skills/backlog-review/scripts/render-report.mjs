#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderBacklogStaticHtml } from "./report-contract.mjs";

const skillRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const templatePath = path.join(skillRoot, "assets", "backlog-review-report.html");

function usage(message) {
  if (message) console.error(message);
  console.error("Usage: node render-report.mjs --input <report.json> --output <report.html> [--force]");
  process.exit(2);
}

function parseArgs(values) {
  const result = { input: null, output: null, force: false };
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (value === "--force") result.force = true;
    else if (value === "--input" || value === "--output") {
      const next = values[index + 1];
      if (!next || next.startsWith("--")) usage(`Missing value for ${value}.`);
      result[value.slice(2)] = next;
      index += 1;
    } else usage(`Unknown option: ${value}`);
  }
  if (!result.input || !result.output) usage("Both --input and --output are required.");
  return result;
}

const options = parseArgs(process.argv.slice(2));
const inputPath = path.resolve(options.input);
const outputPath = path.resolve(options.output);
if (path.extname(outputPath).toLowerCase() !== ".html") throw new Error("The selected output path must end in .html.");
if (inputPath === outputPath) throw new Error("The input and output paths must be different.");
if (existsSync(outputPath) && !options.force) {
  throw new Error("The selected output file already exists. Confirm replacement, then use --force.");
}
try {
  const input = JSON.parse(readFileSync(inputPath, "utf8"));
  const html = renderBacklogStaticHtml(input, readFileSync(templatePath, "utf8"));
  writeFileSync(outputPath, html, { encoding: "utf8", flag: options.force ? "w" : "wx" });
  console.log(outputPath);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
