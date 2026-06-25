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

export type LifecycleLabelKey = (typeof LIFECYCLE_LABEL_KEYS)[number];
export type DocumentKindLabelKey = (typeof DOCUMENT_KIND_LABEL_KEYS)[number];
export type CoordinateLabelKey = (typeof COORDINATE_LABEL_KEYS)[number];

export interface MakeDocsPersonaConfig {
  slug: string;
  label: string;
  description: string;
  primitive: PersonaPrimitive;
}

export interface MakeDocsConfig {
  labels: {
    lifecycle: Record<LifecycleLabelKey, string>;
    documentKinds: Record<DocumentKindLabelKey, string>;
    coordinates: Record<CoordinateLabelKey, string>;
  };
  personas: MakeDocsPersonaConfig[];
  generatedProse: Record<string, string>;
}

export interface MakeDocsConfigDiagnostic {
  code:
    | "duplicate-persona-slug"
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

const TOP_LEVEL_KEYS = new Set(["labels", "personas", "generatedProse"]);
const LABEL_GROUP_KEYS = new Set(["lifecycle", "documentKinds", "coordinates"]);
const PERSONA_KEYS = new Set(["slug", "label", "description", "primitive"]);

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
