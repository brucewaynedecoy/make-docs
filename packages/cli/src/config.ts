import { existsSync } from "node:fs";
import path from "node:path";
import { parseDocument } from "yaml";
import { TOOL_DIRECTORY_CONFIG_RELATIVE_PATH } from "./tool-directory";
import { readTextFile } from "./utils";

export const PERSONA_PRIMITIVES = ["agent", "maintainer", "user"] as const;
export type PersonaPrimitive = (typeof PERSONA_PRIMITIVES)[number];

export const PERSONA_SLUG_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

export const LIFECYCLE_LABEL_KEYS = [
  "design",
  "plan",
  "prd",
  "work",
  "implementation",
  "history",
  "guide",
  "playbook",
] as const;

export const DOCUMENT_KIND_LABEL_KEYS = [
  "design",
  "plan",
  "prd",
  "work",
  "history",
  "guide",
  "playbook",
] as const;

export const COORDINATE_LABEL_KEYS = ["wave", "revision", "phase"] as const;

export const HARNESS_CAPABILITY_IDS = [
  "goal_managed_execution",
  "long_running_runs",
  "resume_after_interrupt",
  "parallel_playbook_runs",
  "subagent_delegation",
  "user_gate_prompts",
] as const;

/**
 * Packaging-precondition states absorbable from project config (W18 R12 P3;
 * PRD 39 R-FLAG-2). Mirrors `PackageAdapterPreconditionState` in the
 * playbook-packaging types; config stays convenience, never authority — the
 * CLI merges these under explicit `--precondition` flags, which always win,
 * and a missing block changes no behavior. This follows the
 * `harnessCapabilities` precedent from PRD 24.
 */
export const PACKAGING_PRECONDITION_STATES = ["satisfied", "unknown", "unsupported"] as const;

export type LifecycleLabelKey = (typeof LIFECYCLE_LABEL_KEYS)[number];
export type DocumentKindLabelKey = (typeof DOCUMENT_KIND_LABEL_KEYS)[number];
export type CoordinateLabelKey = (typeof COORDINATE_LABEL_KEYS)[number];
export type HarnessCapabilityId = (typeof HARNESS_CAPABILITY_IDS)[number];
export type HarnessCapabilityReviewStatus = "reviewed" | "unreviewed";
export type PackagingPreconditionState = (typeof PACKAGING_PRECONDITION_STATES)[number];

export interface MakeDocsPersonaConfig {
  slug: string;
  label: string;
  description: string;
  primitive: PersonaPrimitive;
}

export interface HarnessCapabilityRecord {
  harness: string;
  reviewStatus: HarnessCapabilityReviewStatus;
  capabilities: Partial<Record<HarnessCapabilityId, boolean>>;
  source?: string;
  caveats: string[];
}

export interface MakeDocsPackagingConfig {
  /** Precondition-state defaults keyed by adapter precondition id (R-FLAG-2). */
  preconditions: Record<string, PackagingPreconditionState>;
}

export interface MakeDocsConfig {
  labels: {
    lifecycle: Record<LifecycleLabelKey, string>;
    documentKinds: Record<DocumentKindLabelKey, string>;
    coordinates: Record<CoordinateLabelKey, string>;
  };
  personas: MakeDocsPersonaConfig[];
  generatedProse: Record<string, string>;
  harnessCapabilities: HarnessCapabilityRecord[];
  packaging: MakeDocsPackagingConfig;
}

export interface MakeDocsConfigDiagnostic {
  code:
    | "duplicate-persona-slug"
    | "duplicate-harness-capability-record"
    | "invalid-harness-capability-id"
    | "invalid-review-status"
    | "invalid-primitive"
    | "invalid-type"
    | "missing-required-key"
    | "parse-error"
    | "structural-rename-attempt"
    | "unknown-key";
  filePath: string;
  keyPath: string;
  message: string;
}

export interface LoadedMakeDocsConfig {
  config: MakeDocsConfig;
  configPath: string;
  diagnostics: MakeDocsConfigDiagnostic[];
  present: boolean;
  valid: boolean;
}

export interface ConfigRenderingLabels {
  documentKinds: string;
  lifecycle: string;
  coordinates: string;
  personas: string;
}

const TOP_LEVEL_KEYS = new Set([
  "labels",
  "personas",
  "generatedProse",
  "harnessCapabilities",
  "packaging",
]);
const PACKAGING_KEYS = new Set(["preconditions"]);
const LABEL_GROUP_KEYS = new Set(["lifecycle", "documentKinds", "coordinates"]);
const PERSONA_KEYS = new Set(["slug", "label", "description", "primitive"]);
const HARNESS_CAPABILITY_RECORD_KEYS = new Set([
  "harness",
  "reviewStatus",
  "capabilities",
  "source",
  "caveats",
]);

const STRUCTURAL_RENAME_KEYS = new Set([
  "contractName",
  "contractNames",
  "coordinate",
  "coordinateModel",
  "coordinates",
  "directory",
  "directories",
  "field",
  "fields",
  "frontmatter",
  "frontmatterField",
  "frontmatterFields",
  "harnessName",
  "harnessNames",
  "kind",
  "kindValue",
  "kindValues",
  "kinds",
  "lifecycleSlug",
  "lifecycleSlugs",
  "manifest",
  "manifestKey",
  "manifestKeys",
  "metadata",
  "metadataKey",
  "metadataKeys",
  "path",
  "paths",
  "persona",
  "primitive",
  "primitiveValue",
  "primitiveValues",
  "promptPath",
  "promptPaths",
  "route",
  "routeId",
  "routeIds",
  "routes",
  "schemaKey",
  "schemaKeys",
  "skillName",
  "skillNames",
  "sourceType",
  "sourceTypes",
]);

export function getMakeDocsConfigPath(targetDir: string): string {
  return path.join(targetDir, TOOL_DIRECTORY_CONFIG_RELATIVE_PATH);
}

export function createDefaultMakeDocsConfig(): MakeDocsConfig {
  return {
    labels: {
      lifecycle: {
        design: "design",
        plan: "plan",
        prd: "PRD",
        work: "work",
        implementation: "implementation",
        history: "history",
        guide: "guide",
        playbook: "playbook",
      },
      documentKinds: {
        design: "design",
        plan: "plan",
        prd: "PRD",
        work: "work",
        history: "history",
        guide: "guide",
        playbook: "playbook",
      },
      coordinates: {
        wave: "Wave",
        revision: "Revision",
        phase: "Phase",
      },
    },
    generatedProse: {},
    harnessCapabilities: [],
    packaging: { preconditions: {} },
    personas: [
      {
        slug: "agent",
        label: "Agent",
        description:
          "Agents executing make-docs workflows, coverage passes, closeout, and lifecycle tasks.",
        primitive: "agent",
      },
      {
        slug: "developer",
        label: "Developer",
        description:
          "Maintainers, contributors, integrators, operators, validation owners, and extension authors.",
        primitive: "maintainer",
      },
      {
        slug: "user",
        label: "User",
        description:
          "People using the shipped product, reading task guidance, or adopting a documented workflow.",
        primitive: "user",
      },
    ],
  };
}

export function getConfigRenderingLabels(
  config: MakeDocsConfig = createDefaultMakeDocsConfig(),
): ConfigRenderingLabels {
  return {
    documentKinds: formatLabelEntries(config.labels.documentKinds),
    lifecycle: formatLabelEntries(config.labels.lifecycle),
    coordinates: formatLabelEntries(config.labels.coordinates),
    personas: config.personas
      .map((persona) => `${persona.slug}=${persona.label}`)
      .join(", "),
  };
}

export function getDocumentKindLabel(
  config: MakeDocsConfig,
  key: DocumentKindLabelKey,
): string {
  return config.labels.documentKinds[key];
}

export function getLifecycleLabel(
  config: MakeDocsConfig,
  key: LifecycleLabelKey,
): string {
  return config.labels.lifecycle[key];
}

export function getCoordinateLabel(
  config: MakeDocsConfig,
  key: CoordinateLabelKey,
): string {
  return config.labels.coordinates[key];
}

export function getPersonaLabel(config: MakeDocsConfig, slug: string): string {
  return config.personas.find((persona) => persona.slug === slug)?.label ?? slug;
}

export function loadMakeDocsConfig(targetDir: string): LoadedMakeDocsConfig {
  const configPath = getMakeDocsConfigPath(targetDir);
  const defaults = createDefaultMakeDocsConfig();

  if (!existsSync(configPath)) {
    return {
      config: defaults,
      configPath,
      diagnostics: [],
      present: false,
      valid: true,
    };
  }

  const diagnostics: MakeDocsConfigDiagnostic[] = [];
  const raw = readTextFile(configPath);
  const document = parseDocument(raw);

  for (const error of document.errors) {
    diagnostics.push({
      code: "parse-error",
      filePath: configPath,
      keyPath: "<root>",
      message: `Invalid YAML in ${configPath} at <root>: ${error.message}`,
    });
  }

  if (diagnostics.length > 0) {
    return invalidConfigResult(configPath, diagnostics);
  }

  const parsed = document.toJSON() as unknown;
  if (parsed === null || parsed === undefined) {
    return {
      config: defaults,
      configPath,
      diagnostics: [],
      present: true,
      valid: true,
    };
  }

  if (!isPlainObject(parsed)) {
    diagnostics.push({
      code: "invalid-type",
      filePath: configPath,
      keyPath: "<root>",
      message: `Invalid make-docs config at ${configPath} (<root>): expected an object.`,
    });
    return invalidConfigResult(configPath, diagnostics);
  }

  const config = createDefaultMakeDocsConfig();
  validateKeys({
    allowedKeys: TOP_LEVEL_KEYS,
    diagnostics,
    filePath: configPath,
    keyPath: "",
    value: parsed,
  });
  applyLabels(parsed.labels, config, configPath, diagnostics);
  applyGeneratedProse(parsed.generatedProse, config, configPath, diagnostics);
  applyPersonas(parsed.personas, config, configPath, diagnostics);
  applyHarnessCapabilities(parsed.harnessCapabilities, config, configPath, diagnostics);
  applyPackaging(parsed.packaging, config, configPath, diagnostics);

  if (diagnostics.length > 0) {
    return invalidConfigResult(configPath, diagnostics);
  }

  return {
    config,
    configPath,
    diagnostics: [],
    present: true,
    valid: true,
  };
}

export function loadMakeDocsConfigOrThrow(targetDir: string): LoadedMakeDocsConfig {
  const loaded = loadMakeDocsConfig(targetDir);
  if (!loaded.valid) {
    throw new Error(formatMakeDocsConfigDiagnostics(loaded));
  }

  return loaded;
}

export function formatMakeDocsConfigDiagnostics(
  loaded: Pick<LoadedMakeDocsConfig, "configPath" | "diagnostics">,
): string {
  const detailLines = loaded.diagnostics.map(
    (diagnostic) => `- ${diagnostic.keyPath}: ${diagnostic.message}`,
  );

  return [
    `Invalid make-docs config: ${loaded.configPath}`,
    ...detailLines,
  ].join("\n");
}

function invalidConfigResult(
  configPath: string,
  diagnostics: MakeDocsConfigDiagnostic[],
): LoadedMakeDocsConfig {
  return {
    config: createDefaultMakeDocsConfig(),
    configPath,
    diagnostics,
    present: true,
    valid: false,
  };
}

function applyLabels(
  value: unknown,
  config: MakeDocsConfig,
  filePath: string,
  diagnostics: MakeDocsConfigDiagnostic[],
): void {
  if (value === undefined) {
    return;
  }

  if (!isPlainObject(value)) {
    addInvalidTypeDiagnostic(diagnostics, filePath, "labels", "an object");
    return;
  }

  validateKeys({
    allowedKeys: LABEL_GROUP_KEYS,
    diagnostics,
    filePath,
    keyPath: "labels",
    value,
  });

  applyLabelGroup({
    allowedKeys: new Set(LIFECYCLE_LABEL_KEYS),
    diagnostics,
    filePath,
    group: config.labels.lifecycle,
    keyPath: "labels.lifecycle",
    value: value.lifecycle,
  });
  applyLabelGroup({
    allowedKeys: new Set(DOCUMENT_KIND_LABEL_KEYS),
    diagnostics,
    filePath,
    group: config.labels.documentKinds,
    keyPath: "labels.documentKinds",
    value: value.documentKinds,
  });
  applyLabelGroup({
    allowedKeys: new Set(COORDINATE_LABEL_KEYS),
    diagnostics,
    filePath,
    group: config.labels.coordinates,
    keyPath: "labels.coordinates",
    value: value.coordinates,
  });
}

function applyLabelGroup(options: {
  allowedKeys: Set<string>;
  diagnostics: MakeDocsConfigDiagnostic[];
  filePath: string;
  group: Record<string, string>;
  keyPath: string;
  value: unknown;
}): void {
  const { allowedKeys, diagnostics, filePath, group, keyPath, value } = options;
  if (value === undefined) {
    return;
  }

  if (!isPlainObject(value)) {
    addInvalidTypeDiagnostic(diagnostics, filePath, keyPath, "an object");
    return;
  }

  validateKeys({ allowedKeys, diagnostics, filePath, keyPath, value });

  for (const [key, label] of Object.entries(value)) {
    if (!allowedKeys.has(key)) {
      continue;
    }

    if (!isNonEmptyString(label)) {
      addInvalidTypeDiagnostic(diagnostics, filePath, joinKeyPath(keyPath, key), "a non-empty string");
      continue;
    }

    group[key] = label.trim();
  }
}

function applyGeneratedProse(
  value: unknown,
  config: MakeDocsConfig,
  filePath: string,
  diagnostics: MakeDocsConfigDiagnostic[],
): void {
  if (value === undefined) {
    return;
  }

  if (!isPlainObject(value)) {
    addInvalidTypeDiagnostic(diagnostics, filePath, "generatedProse", "an object");
    return;
  }

  for (const [key, label] of Object.entries(value)) {
    const keyPath = joinKeyPath("generatedProse", key);
    if (isStructuralRenameKey(key)) {
      addStructuralRenameDiagnostic(diagnostics, filePath, keyPath);
      continue;
    }

    if (!isNonEmptyString(label)) {
      addInvalidTypeDiagnostic(diagnostics, filePath, keyPath, "a non-empty string");
      continue;
    }

    config.generatedProse[key] = label.trim();
  }
}

function applyPersonas(
  value: unknown,
  config: MakeDocsConfig,
  filePath: string,
  diagnostics: MakeDocsConfigDiagnostic[],
): void {
  if (value === undefined) {
    return;
  }

  if (!Array.isArray(value)) {
    addInvalidTypeDiagnostic(diagnostics, filePath, "personas", "an array");
    return;
  }

  const personasBySlug = new Map(
    config.personas.map((persona) => [persona.slug, persona] as const),
  );
  const configuredSlugs = new Set<string>();

  for (const [index, entry] of value.entries()) {
    const entryPath = `personas[${index}]`;
    if (!isPlainObject(entry)) {
      addInvalidTypeDiagnostic(diagnostics, filePath, entryPath, "an object");
      continue;
    }

    validateKeys({
      allowedKeys: PERSONA_KEYS,
      diagnostics,
      filePath,
      keyPath: entryPath,
      value: entry,
    });

    const slug = getRequiredString(entry, "slug", entryPath, filePath, diagnostics);
    const label = getRequiredString(entry, "label", entryPath, filePath, diagnostics);
    const description = getRequiredString(
      entry,
      "description",
      entryPath,
      filePath,
      diagnostics,
    );
    const primitive = getRequiredString(
      entry,
      "primitive",
      entryPath,
      filePath,
      diagnostics,
    );

    if (!slug || !label || !description || !primitive) {
      continue;
    }

    if (!PERSONA_SLUG_PATTERN.test(slug)) {
      diagnostics.push({
        code: "invalid-type",
        filePath,
        keyPath: joinKeyPath(entryPath, "slug"),
        message: `Invalid make-docs config at ${filePath} (${joinKeyPath(entryPath, "slug")}): persona slug must be lowercase kebab-case.`,
      });
      continue;
    }

    if (configuredSlugs.has(slug)) {
      diagnostics.push({
        code: "duplicate-persona-slug",
        filePath,
        keyPath: joinKeyPath(entryPath, "slug"),
        message: `Invalid make-docs config at ${filePath} (${joinKeyPath(entryPath, "slug")}): duplicate persona slug '${slug}'.`,
      });
      continue;
    }
    configuredSlugs.add(slug);

    if (!PERSONA_PRIMITIVES.includes(primitive as PersonaPrimitive)) {
      diagnostics.push({
        code: "invalid-primitive",
        filePath,
        keyPath: joinKeyPath(entryPath, "primitive"),
        message: `Invalid make-docs config at ${filePath} (${joinKeyPath(entryPath, "primitive")}): primitive must be one of ${PERSONA_PRIMITIVES.join(", ")}.`,
      });
      continue;
    }

    personasBySlug.set(slug, {
      slug,
      label,
      description,
      primitive: primitive as PersonaPrimitive,
    });
  }

  config.personas = [...personasBySlug.values()];
}

function applyHarnessCapabilities(
  value: unknown,
  config: MakeDocsConfig,
  filePath: string,
  diagnostics: MakeDocsConfigDiagnostic[],
): void {
  if (value === undefined) {
    return;
  }

  if (!Array.isArray(value)) {
    addInvalidTypeDiagnostic(diagnostics, filePath, "harnessCapabilities", "an array");
    return;
  }

  const records: HarnessCapabilityRecord[] = [];
  const harnesses = new Set<string>();
  for (const [index, entry] of value.entries()) {
    const entryPath = `harnessCapabilities[${index}]`;
    if (!isPlainObject(entry)) {
      addInvalidTypeDiagnostic(diagnostics, filePath, entryPath, "an object");
      continue;
    }

    validateKeys({
      allowedKeys: HARNESS_CAPABILITY_RECORD_KEYS,
      diagnostics,
      filePath,
      keyPath: entryPath,
      value: entry,
    });

    const harness = getRequiredString(entry, "harness", entryPath, filePath, diagnostics);
    const reviewStatus = getRequiredString(entry, "reviewStatus", entryPath, filePath, diagnostics);
    const capabilities = parseHarnessCapabilityMap(
      entry.capabilities,
      joinKeyPath(entryPath, "capabilities"),
      filePath,
      diagnostics,
    );
    const source = getOptionalString(entry, "source", entryPath, filePath, diagnostics);
    const caveats = getOptionalStringArray(entry, "caveats", entryPath, filePath, diagnostics);

    if (!harness || !reviewStatus || capabilities === null || caveats === null) {
      continue;
    }

    if (harnesses.has(harness)) {
      diagnostics.push({
        code: "duplicate-harness-capability-record",
        filePath,
        keyPath: joinKeyPath(entryPath, "harness"),
        message: `Invalid make-docs config at ${filePath} (${joinKeyPath(entryPath, "harness")}): duplicate harness capability record '${harness}'.`,
      });
      continue;
    }
    harnesses.add(harness);

    if (reviewStatus !== "reviewed" && reviewStatus !== "unreviewed") {
      diagnostics.push({
        code: "invalid-review-status",
        filePath,
        keyPath: joinKeyPath(entryPath, "reviewStatus"),
        message: `Invalid make-docs config at ${filePath} (${joinKeyPath(entryPath, "reviewStatus")}): reviewStatus must be reviewed or unreviewed.`,
      });
      continue;
    }

    records.push({
      harness,
      reviewStatus,
      capabilities,
      ...(source ? { source } : {}),
      caveats,
    });
  }

  config.harnessCapabilities = records;
}

/**
 * The `packaging` config block (W18 R12 P3; PRD 39 R-FLAG-2): precondition
 * state defaults absorbed by the CLI packaging adapters. Values are validated
 * against the shared precondition-state vocabulary; keys are adapter
 * precondition identifiers and stay freeform (they name adapter contract
 * preconditions, not renamable prose).
 */
function applyPackaging(
  value: unknown,
  config: MakeDocsConfig,
  filePath: string,
  diagnostics: MakeDocsConfigDiagnostic[],
): void {
  if (value === undefined) {
    return;
  }

  if (!isPlainObject(value)) {
    addInvalidTypeDiagnostic(diagnostics, filePath, "packaging", "an object");
    return;
  }

  validateKeys({
    allowedKeys: PACKAGING_KEYS,
    diagnostics,
    filePath,
    keyPath: "packaging",
    value,
  });

  const preconditions = value.preconditions;
  if (preconditions === undefined) {
    return;
  }
  if (!isPlainObject(preconditions)) {
    addInvalidTypeDiagnostic(diagnostics, filePath, "packaging.preconditions", "an object");
    return;
  }

  const states: Record<string, PackagingPreconditionState> = {};
  for (const [id, state] of Object.entries(preconditions)) {
    const keyPath = joinKeyPath("packaging.preconditions", id);
    if (
      typeof state !== "string" ||
      !PACKAGING_PRECONDITION_STATES.includes(state as PackagingPreconditionState)
    ) {
      addInvalidTypeDiagnostic(
        diagnostics,
        filePath,
        keyPath,
        `one of ${PACKAGING_PRECONDITION_STATES.join(", ")}`,
      );
      continue;
    }
    states[id] = state as PackagingPreconditionState;
  }
  config.packaging.preconditions = states;
}

function parseHarnessCapabilityMap(
  value: unknown,
  keyPath: string,
  filePath: string,
  diagnostics: MakeDocsConfigDiagnostic[],
): HarnessCapabilityRecord["capabilities"] | null {
  if (value === undefined) {
    diagnostics.push({
      code: "missing-required-key",
      filePath,
      keyPath,
      message: `Invalid make-docs config at ${filePath} (${keyPath}): missing required key 'capabilities'.`,
    });
    return null;
  }

  if (!isPlainObject(value)) {
    addInvalidTypeDiagnostic(diagnostics, filePath, keyPath, "an object");
    return null;
  }

  const capabilities: HarnessCapabilityRecord["capabilities"] = {};
  for (const [key, enabled] of Object.entries(value)) {
    const capabilityPath = joinKeyPath(keyPath, key);
    if (!HARNESS_CAPABILITY_IDS.includes(key as HarnessCapabilityId)) {
      diagnostics.push({
        code: "invalid-harness-capability-id",
        filePath,
        keyPath: capabilityPath,
        message: `Invalid make-docs config at ${filePath} (${capabilityPath}): unknown harness capability id '${key}'.`,
      });
      continue;
    }
    if (typeof enabled !== "boolean") {
      addInvalidTypeDiagnostic(diagnostics, filePath, capabilityPath, "a boolean");
      continue;
    }
    capabilities[key as HarnessCapabilityId] = enabled;
  }

  return capabilities;
}

function validateKeys(options: {
  allowedKeys: Set<string>;
  diagnostics: MakeDocsConfigDiagnostic[];
  filePath: string;
  keyPath: string;
  value: Record<string, unknown>;
}): void {
  const { allowedKeys, diagnostics, filePath, keyPath, value } = options;
  for (const key of Object.keys(value)) {
    if (allowedKeys.has(key)) {
      continue;
    }

    const fullKeyPath = joinKeyPath(keyPath, key);
    if (isStructuralRenameKey(key)) {
      addStructuralRenameDiagnostic(diagnostics, filePath, fullKeyPath);
      continue;
    }

    diagnostics.push({
      code: "unknown-key",
      filePath,
      keyPath: fullKeyPath,
      message: `Invalid make-docs config at ${filePath} (${fullKeyPath}): unknown key '${key}'.`,
    });
  }
}

function getRequiredString(
  value: Record<string, unknown>,
  key: string,
  parentKeyPath: string,
  filePath: string,
  diagnostics: MakeDocsConfigDiagnostic[],
): string | null {
  const keyPath = joinKeyPath(parentKeyPath, key);
  if (!(key in value)) {
    diagnostics.push({
      code: "missing-required-key",
      filePath,
      keyPath,
      message: `Invalid make-docs config at ${filePath} (${keyPath}): missing required key '${key}'.`,
    });
    return null;
  }

  const candidate = value[key];
  if (!isNonEmptyString(candidate)) {
    addInvalidTypeDiagnostic(diagnostics, filePath, keyPath, "a non-empty string");
    return null;
  }

  return candidate.trim();
}

function getOptionalString(
  value: Record<string, unknown>,
  key: string,
  parentKeyPath: string,
  filePath: string,
  diagnostics: MakeDocsConfigDiagnostic[],
): string | undefined {
  if (!(key in value)) {
    return undefined;
  }

  const candidate = value[key];
  if (!isNonEmptyString(candidate)) {
    addInvalidTypeDiagnostic(diagnostics, filePath, joinKeyPath(parentKeyPath, key), "a non-empty string");
    return undefined;
  }

  return candidate.trim();
}

function getOptionalStringArray(
  value: Record<string, unknown>,
  key: string,
  parentKeyPath: string,
  filePath: string,
  diagnostics: MakeDocsConfigDiagnostic[],
): string[] | null {
  if (!(key in value)) {
    return [];
  }

  const candidate = value[key];
  const keyPath = joinKeyPath(parentKeyPath, key);
  if (!Array.isArray(candidate)) {
    addInvalidTypeDiagnostic(diagnostics, filePath, keyPath, "an array of strings");
    return null;
  }

  const items: string[] = [];
  for (const [index, item] of candidate.entries()) {
    if (!isNonEmptyString(item)) {
      addInvalidTypeDiagnostic(diagnostics, filePath, `${keyPath}[${index}]`, "a non-empty string");
      continue;
    }
    items.push(item.trim());
  }
  return items;
}

function addInvalidTypeDiagnostic(
  diagnostics: MakeDocsConfigDiagnostic[],
  filePath: string,
  keyPath: string,
  expected: string,
): void {
  diagnostics.push({
    code: "invalid-type",
    filePath,
    keyPath,
    message: `Invalid make-docs config at ${filePath} (${keyPath}): expected ${expected}.`,
  });
}

function addStructuralRenameDiagnostic(
  diagnostics: MakeDocsConfigDiagnostic[],
  filePath: string,
  keyPath: string,
): void {
  diagnostics.push({
    code: "structural-rename-attempt",
    filePath,
    keyPath,
    message: `Invalid make-docs config at ${filePath} (${keyPath}): structural paths, metadata fields, kind values, route identifiers, primitive values, and schema keys are canonical and cannot be renamed by config.`,
  });
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isStructuralRenameKey(key: string): boolean {
  return STRUCTURAL_RENAME_KEYS.has(key);
}

function joinKeyPath(parent: string, key: string): string {
  return parent ? `${parent}.${key}` : key;
}

function formatLabelEntries(labels: Record<string, string>): string {
  return Object.entries(labels)
    .map(([key, value]) => `${key}=${value}`)
    .join(", ");
}
