import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { renderBacklogStaticHtml } from "./presentation.js";

/**
 * Static report file writer (PRD 51 R-BACKLOG-SKILL-21).
 *
 * This is the one home of the render wrapper logic. The Skill ships
 * `packages/skills/backlog-review/scripts/render-report.mjs` as a generated
 * bundle of this file. The caller passes the renderer, so that bundle takes it
 * from the sibling `./report-contract.mjs` bundle and uses Node built-ins only.
 */

export type BacklogStaticHtmlRenderer = typeof renderBacklogStaticHtml;

export const BACKLOG_REPORT_FILE_USAGE =
  "Usage: node render-report.mjs --input <report.json> --output <report.html> [--force]";

/** A refused input. The script wrapper prints the message and the usage line, then exits 2. */
export class BacklogReportFileUsageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BacklogReportFileUsageError";
  }
}

export interface BacklogReportFileOptions {
  input: string;
  output: string;
  force: boolean;
}

export function parseBacklogReportFileArgs(values: readonly string[]): BacklogReportFileOptions {
  const result: { input: string | null; output: string | null; force: boolean } = { input: null, output: null, force: false };
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (value === "--force") result.force = true;
    else if (value === "--input" || value === "--output") {
      const next = values[index + 1];
      if (!next || next.startsWith("--")) throw new BacklogReportFileUsageError(`Missing value for ${value}.`);
      result[value === "--input" ? "input" : "output"] = next;
      index += 1;
    } else throw new BacklogReportFileUsageError(`Unknown option: ${value}`);
  }
  if (!result.input || !result.output) throw new BacklogReportFileUsageError("Both --input and --output are required.");
  return { input: result.input, output: result.output, force: result.force };
}

/** The bundled report template, relative to the Skill root that holds `scripts/`. */
export function backlogReportTemplatePath(scriptUrl: string): string {
  const skillRoot = path.resolve(path.dirname(fileURLToPath(scriptUrl)), "..");
  return path.join(skillRoot, "assets", "backlog-review-report.html");
}

/**
 * Check the selected paths before any read. These throws are outside the
 * render step, so the script ends with an uncaught error, as before.
 */
export function resolveBacklogReportFilePaths(options: BacklogReportFileOptions): { inputPath: string; outputPath: string } {
  const inputPath = path.resolve(options.input);
  const outputPath = path.resolve(options.output);
  if (path.extname(outputPath).toLowerCase() !== ".html") throw new Error("The selected output path must end in .html.");
  if (inputPath === outputPath) throw new Error("The input and output paths must be different.");
  if (existsSync(outputPath) && !options.force) {
    throw new Error("The selected output file already exists. Confirm replacement, then use --force.");
  }
  return { inputPath, outputPath };
}

/** Validate the report, render it into the template, and create the file. Replace it only with `force`. */
export function writeBacklogReportFile(
  render: BacklogStaticHtmlRenderer, inputPath: string, outputPath: string, templatePath: string, force: boolean,
): void {
  const input: unknown = JSON.parse(readFileSync(inputPath, "utf8"));
  const html = render(input, readFileSync(templatePath, "utf8"));
  writeFileSync(outputPath, html, { encoding: "utf8", flag: force ? "w" : "wx" });
}

/** The Skill script body. `scriptUrl` is the script's own `import.meta.url`. */
export function runRenderReportScript(argv: readonly string[], scriptUrl: string, render: BacklogStaticHtmlRenderer): void {
  let options: BacklogReportFileOptions;
  try {
    options = parseBacklogReportFileArgs(argv);
  } catch (error) {
    if (!(error instanceof BacklogReportFileUsageError)) throw error;
    if (error.message) console.error(error.message);
    console.error(BACKLOG_REPORT_FILE_USAGE);
    process.exit(2);
  }
  const { inputPath, outputPath } = resolveBacklogReportFilePaths(options);
  try {
    writeBacklogReportFile(render, inputPath, outputPath, backlogReportTemplatePath(scriptUrl), options.force);
    console.log(outputPath);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
