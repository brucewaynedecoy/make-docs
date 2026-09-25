#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual } from "node:util";

const skillRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const templatePath = path.join(skillRoot, "assets", "backlog-review-report.html");
const dataSlot = "__MAKE_DOCS_BACKLOG_REPORT_DATA__";
const fixedStatuses = new Set([
  "attention",
  "current",
  "conflict",
  "deferred",
  "complete",
  "history",
]);

function usage(message) {
  if (message) console.error(message);
  console.error("Usage: node render-report.mjs --input <report.json> --output <report.html> [--force]");
  process.exit(2);
}

function parseArgs(values) {
  const result = { input: null, output: null, force: false };
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (value === "--force") {
      result.force = true;
    } else if (value === "--input" || value === "--output") {
      const next = values[index + 1];
      if (!next || next.startsWith("--")) usage(`Missing value for ${value}.`);
      result[value.slice(2)] = next;
      index += 1;
    } else {
      usage(`Unknown option: ${value}`);
    }
  }
  if (!result.input || !result.output) usage("Both --input and --output are required.");
  return result;
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function validateProjectLead(projectLead) {
  if (projectLead === null) return;
  if (
    !isObject(projectLead) ||
    !Array.isArray(projectLead.sources) ||
    projectLead.sources.length < 2 ||
    projectLead.sources.length > 6 ||
    !Array.isArray(projectLead.sentences) ||
    projectLead.sentences.length < 2 ||
    projectLead.sentences.length > 3
  ) {
    throw new Error("The project lead must contain two or three source-backed sentences.");
  }
  const sourcesById = new Map();
  for (const source of projectLead.sources) {
    if (
      !isObject(source) ||
      typeof source.id !== "string" ||
      !["purpose", "currentStatus", "currentObjective"].includes(source.role) ||
      typeof source.path !== "string" ||
      typeof source.excerpt !== "string" ||
      !/^[a-f0-9]{64}$/.test(source.contentHash) ||
      sourcesById.has(source.id)
    ) {
      throw new Error("The project lead contains an invalid context source.");
    }
    sourcesById.set(source.id, source);
  }
  const roles = projectLead.sentences.map((sentence) => sentence?.role);
  if (
    roles[0] !== "purpose" ||
    !["currentStatus", "currentObjective"].includes(roles[1]) ||
    new Set(roles).size !== roles.length
  ) {
    throw new Error("The project lead must begin with purpose, then current status or objective.");
  }
  for (const sentence of projectLead.sentences) {
    if (
      !isObject(sentence) ||
      typeof sentence.text !== "string" ||
      sentence.text.trim().length === 0 ||
      sentence.text.length > 320 ||
      /[\r\n]/.test(sentence.text) ||
      !Array.isArray(sentence.evidenceSourceIds) ||
      sentence.evidenceSourceIds.length < 1 ||
      sentence.evidenceSourceIds.length > 3 ||
      sentence.evidenceSourceIds.some(
        (sourceId) => sourcesById.get(sourceId)?.role !== sentence.role,
      )
    ) {
      throw new Error("Each project lead sentence must cite supplied context for its role.");
    }
  }
}

function validateReport(report) {
  if (!isObject(report) || report.schemaVersion !== 1) {
    throw new Error("The input must be a version 1 backlog report model.");
  }
  if (!isObject(report.snapshot) || !Array.isArray(report.snapshot.records)) {
    throw new Error("The report must include its complete source snapshot.");
  }
  if (!Array.isArray(report.records) || !isObject(report.tallies)) {
    throw new Error("The report must include records and the four fixed tallies.");
  }
  if (!("projectLead" in report)) {
    throw new Error("The report must include a project lead or an explicit null value.");
  }
  validateProjectLead(report.projectLead);
  const paths = report.records.map((record) => record?.recordPath);
  const snapshotPaths = report.snapshot.records.map((record) => record?.recordPath);
  const snapshotByPath = new Map(report.snapshot.records.map((record) => [record?.recordPath, record]));
  if (
    paths.some((value) => typeof value !== "string" || value.length === 0) ||
    new Set(paths).size !== paths.length ||
    paths.length !== snapshotPaths.length ||
    paths.some((value) => !snapshotPaths.includes(value))
  ) {
    throw new Error("The report must preserve every snapshot record exactly once.");
  }
  for (const record of report.records) {
    const source = snapshotByPath.get(record.recordPath);
    if (
      record.scope !== source.scope ||
      !isDeepStrictEqual(record.createdAt, source.createdAt) ||
      !isDeepStrictEqual(record.lastUpdatedAt, source.lastUpdatedAt)
    ) {
      throw new Error(`Record ${record.recordPath} must preserve its snapshot scope and dates.`);
    }
    if (record.scope === "live" && !fixedStatuses.has(record.waveStatus)) {
      throw new Error(`Live record ${record.recordPath} needs one fixed wave status.`);
    }
    if (record.scope === "archived" && record.waveStatus !== null) {
      throw new Error(`Archived record ${record.recordPath} must use a null wave status.`);
    }
    if (typeof record.statusReason !== "string" || record.statusReason.trim().length === 0) {
      throw new Error(`Record ${record.recordPath} needs a status reason.`);
    }
  }
  if (!Array.isArray(report.attentionFindings)) {
    throw new Error("The report must include its Attention items.");
  }
  for (const [index, finding] of report.attentionFindings.entries()) {
    if (!isObject(finding) || !("recordPath" in finding)) {
      throw new Error(`Attention item ${index + 1} must declare a wave path or null.`);
    }
    if (
      finding.recordPath !== null &&
      paths.filter((recordPath) => recordPath === finding.recordPath).length !== 1
    ) {
      throw new Error(
        `Attention item ${index + 1} must refer to exactly one included report record.`,
      );
    }
  }
  if (!Array.isArray(report.recommendationOrder)) {
    throw new Error("The report must include its Next items.");
  }
  for (const [index, item] of report.recommendationOrder.entries()) {
    if (
      !isObject(item) ||
      typeof item.recordPath !== "string" ||
      paths.filter((recordPath) => recordPath === item.recordPath).length !== 1
    ) {
      throw new Error(`Next item ${index + 1} must refer to exactly one included report record.`);
    }
    if (
      !Number.isInteger(item.rank) || item.rank < 1 ||
      !isObject(item.claim) || item.claim.class !== "recommendation" ||
      typeof item.claim.text !== "string" || item.claim.text.trim().length === 0 ||
      typeof item.claim.rationale !== "string" || item.claim.rationale.trim().length === 0
    ) {
      throw new Error(`Next item ${index + 1} needs a ranked recommendation claim.`);
    }
  }
  const archived = report.records.filter((record) => record.scope === "archived").length;
  const historical = report.records.filter(
    (record) => record.scope === "live" && record.waveStatus === "history",
  ).length;
  const inScope = report.records.length - archived - historical;
  const expected = {
    workRecordsFound: report.records.length,
    workRecordsStillInScope: inScope,
    historicalRecords: historical,
    archivedRecords: archived,
  };
  for (const [field, value] of Object.entries(expected)) {
    if (report.tallies[field] !== value) {
      throw new Error(`Report tally ${field} does not match the complete record set.`);
    }
  }
}

function serializeForHtml(value) {
  return JSON.stringify(value)
    .replaceAll("&", "\\u0026")
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");
}

const options = parseArgs(process.argv.slice(2));
const inputPath = path.resolve(options.input);
const outputPath = path.resolve(options.output);

if (path.extname(outputPath).toLowerCase() !== ".html") {
  throw new Error("The selected output path must end in .html.");
}
if (inputPath === outputPath) {
  throw new Error("The input and output paths must be different.");
}
if (existsSync(outputPath) && !options.force) {
  throw new Error("The selected output file already exists. Confirm replacement, then use --force.");
}

const report = JSON.parse(readFileSync(inputPath, "utf8"));
validateReport(report);
const template = readFileSync(templatePath, "utf8");
if (template.split(dataSlot).length !== 2) {
  throw new Error("The bundled report template has an invalid data slot.");
}
const html = template.replace(dataSlot, serializeForHtml(report));
writeFileSync(outputPath, html, { encoding: "utf8", flag: options.force ? "w" : "wx" });
console.log(outputPath);
