import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { isMap, isScalar, isSeq, parseDocument } from "yaml";
import { TOOL_DIRECTORY_CONFIG_RELATIVE_PATH } from "./tool-directory";
import { assertManagedPathHasNoSymlinks, readTextFile } from "./utils";
import {
  getFirstPartyHarnessAdapter,
  validateHarnessMethodSelection,
  type HarnessMethodSelection,
} from "./harness-access";
import { NO_ACCESS, type OperationAccess } from "./operations/access";

export const PERSONA_PRIMITIVES = ["user", "maintainer"] as const;
export const RESERVED_PERSONA_SLUGS = new Set(["project", "archive", "artifacts", "library", "playbooks"]);
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
] as const;

export const DOCUMENT_KIND_LABEL_KEYS = [
  "design",
  "plan",
  "prd",
  "work",
  "history",
  "guide",
] as const;

export const COORDINATE_LABEL_KEYS = ["wave", "revision", "phase"] as const;

export const HARNESS_CAPABILITY_IDS = [
  "goal_managed_execution",
  "long_running_runs",
  "resume_after_interrupt",
  "subagent_delegation",
  "user_gate_prompts",
] as const;

export type LifecycleLabelKey = (typeof LIFECYCLE_LABEL_KEYS)[number];
export type DocumentKindLabelKey = (typeof DOCUMENT_KIND_LABEL_KEYS)[number];
export type CoordinateLabelKey = (typeof COORDINATE_LABEL_KEYS)[number];
export type HarnessCapabilityId = (typeof HARNESS_CAPABILITY_IDS)[number];
export type HarnessCapabilityReviewStatus = "reviewed" | "unreviewed";

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

export type ProjectHarnessIntegrationMode = "inherit" | "narrow" | "disable";

/** Project intent only. This record cannot grant machine or native permission. */
export interface ProjectHarnessIntegrationRecord {
  harness: string;
  mode: ProjectHarnessIntegrationMode;
  /** Optional narrower method. Forbidden for inherit and disable. */
  method?: string;
  /** Optional narrower operation access. Forbidden for inherit and disable. */
  accessCeiling?: OperationAccess;
}

export interface MachineHarnessApproval {
  selected: boolean;
  maximumMethod: string | null;
  /** Maximum operation access approved for this harness on this machine. */
  accessCeiling: OperationAccess;
}

export interface EffectiveHarnessIntegration {
  enabled: boolean;
  method: string | null;
  access: OperationAccess;
  source: "machine" | "project-narrow" | "project-disable";
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
  harnessIntegrations: ProjectHarnessIntegrationRecord[];
}

export interface MakeDocsConfigDiagnostic {
  code:
    | "duplicate-persona-slug"
    | "duplicate-harness-capability-record"
    | "duplicate-harness-integration-record"
    | "invalid-harness-integration-mode"
    | "invalid-harness-identifier"
    | "invalid-harness-method"
    | "invalid-harness-access"
    | "invalid-harness-integration-combination"
    | "invalid-harness-capability-id"
    | "invalid-review-status"
    | "invalid-primitive"
    | "reserved-persona-slug"
    | "fixed-persona-primitive"
    | "invalid-type"
    | "missing-required-key"
    | "parse-error"
    | "structural-rename-attempt"
    | "unknown-key";
  filePath: string;
  keyPath: string;
  message: string;
}

export interface PersonaDisplaySources {
  label: "shipped" | "configured";
  description: "shipped" | "configured";
}

export interface LoadedMakeDocsConfig {
  configuredPersonaSlugs: string[];
  personaDisplaySources: Record<string, PersonaDisplaySources>;
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
  "projectId",
  "labels",
  "personas",
  "generatedProse",
  "harnessCapabilities",
  "harnessIntegrations",
]);
const LABEL_GROUP_KEYS = new Set(["lifecycle", "documentKinds", "coordinates"]);
const PERSONA_KEYS = new Set(["slug", "label", "description", "primitive"]);
const HARNESS_CAPABILITY_RECORD_KEYS = new Set([
  "harness",
  "reviewStatus",
  "capabilities",
  "source",
  "caveats",
]);
const HARNESS_INTEGRATION_RECORD_KEYS = new Set(["harness", "mode", "method", "accessCeiling"]);

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
      },
      documentKinds: {
        design: "design",
        plan: "plan",
        prd: "PRD",
        work: "work",
        history: "history",
        guide: "guide",
      },
      coordinates: {
        wave: "Wave",
        revision: "Revision",
        phase: "Phase",
      },
    },
    generatedProse: {},
    harnessCapabilities: [],
    harnessIntegrations: [],
    personas: [
      {
        slug: "user",
        label: "User",
        description: "People or agents that use the project.",
        primitive: "user",
      },
      {
        slug: "maintainer",
        label: "Maintainer",
        description: "People or agents that build, operate, maintain, or extend the project.",
        primitive: "maintainer",
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
  assertManagedPathHasNoSymlinks(targetDir, TOOL_DIRECTORY_CONFIG_RELATIVE_PATH);
  const configPath = getMakeDocsConfigPath(targetDir);
  const defaults = createDefaultMakeDocsConfig();

  if (!existsSync(configPath)) {
    return {
      config: defaults,
      configuredPersonaSlugs: [],
      personaDisplaySources: getPersonaDisplaySources(defaults, []),
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
  if ((parsed === null || parsed === undefined) && document.contents === null) {
    return {
      config: defaults,
      configuredPersonaSlugs: [],
      personaDisplaySources: getPersonaDisplaySources(defaults, []),
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
  applyHarnessIntegrations(parsed.harnessIntegrations, config, configPath, diagnostics);

  if (diagnostics.length > 0) {
    return invalidConfigResult(configPath, diagnostics);
  }

  return {
    config,
    configuredPersonaSlugs: Array.isArray(parsed.personas) ? parsed.personas.map((entry: { slug: string }) => entry.slug.trim()) : [],
    personaDisplaySources: getPersonaDisplaySources(config, parsed.personas),
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

export interface ProjectHarnessIntegrationYamlUpdate {
  content: string;
  changed: boolean;
}

export interface ProjectHarnessIntegrationWritePlan extends ProjectHarnessIntegrationYamlUpdate {
  configPath: string;
  beforeContent: string | null;
  reviewed: ProjectHarnessIntegrationRecord[];
}

export function planProjectHarnessIntegrationWrite(input: {
  targetDir: string;
  reviewed: readonly ProjectHarnessIntegrationRecord[];
  contentWhenMissing: string;
}): ProjectHarnessIntegrationWritePlan {
  const configPath = getMakeDocsConfigPath(input.targetDir);
  if (existsSync(configPath)) loadMakeDocsConfigOrThrow(input.targetDir);
  const beforeContent = existsSync(configPath) ? readFileSync(configPath, "utf8") : null;
  const updated = updateProjectHarnessIntegrationsYaml(
    beforeContent ?? input.contentWhenMissing,
    input.reviewed,
  );
  return {
    configPath,
    beforeContent,
    content: updated.content,
    changed: beforeContent === null || updated.content !== beforeContent,
    reviewed: input.reviewed.map(record => ({
      ...record,
      ...(record.accessCeiling ? { accessCeiling: { ...record.accessCeiling } } : {}),
    })),
  };
}

/**
 * Update only reviewed harness entries in one YAML document. The YAML node
 * model keeps comments, key order, scalar style, and all unrelated data.
 */
export function updateProjectHarnessIntegrationsYaml(
  raw: string,
  reviewed: readonly ProjectHarnessIntegrationRecord[],
): ProjectHarnessIntegrationYamlUpdate {
  const document = parseDocument(raw);
  if (document.errors.length > 0) {
    throw new Error(`Invalid make-docs config YAML: ${document.errors.map(error => error.message).join("; ")}`);
  }
  const seen = new Set<string>();
  for (const record of reviewed) {
    if (seen.has(record.harness)) throw new Error(`Duplicate reviewed harness entry '${record.harness}'.`);
    seen.add(record.harness);
    if (record.mode !== "narrow" && record.mode !== "disable") {
      throw new Error("Setup can write only explicit narrow or disable harness intent.");
    }
    if (record.mode === "narrow" && (!record.method || !record.accessCeiling)) {
      throw new Error(`Narrow harness entry '${record.harness}' requires a method and access ceiling.`);
    }
    if (record.mode === "disable" && (record.method || record.accessCeiling)) {
      throw new Error(`Disabled harness entry '${record.harness}' cannot include a method or access ceiling.`);
    }
  }

  if (document.contents === null) {
    document.contents = document.createNode({}) as NonNullable<typeof document.contents>;
  }
  if (!isMap(document.contents)) throw new Error("The make-docs config root must be a YAML map.");
  let sequence = getYamlMapValueNode(document.contents, "harnessIntegrations");
  if (sequence === undefined || sequence === null) {
    document.set("harnessIntegrations", document.createNode([]));
    sequence = getYamlMapValueNode(document.contents, "harnessIntegrations");
  }
  if (!isSeq(sequence)) throw new Error("harnessIntegrations must be a YAML sequence.");

  for (const record of reviewed) {
    const matches = sequence.items.filter(item => isMap(item) && item.get("harness") === record.harness);
    if (matches.length > 1) throw new Error(`Duplicate harness integration record '${record.harness}'.`);
    let map = matches[0];
    if (!map || !isMap(map)) {
      const created = document.createNode({ harness: record.harness, mode: record.mode });
      if (!isMap(created)) throw new Error("Could not create a harness integration YAML map.");
      sequence.add(created);
      map = created;
    }
    if (!isMap(map)) throw new Error("The harness integration entry is not a YAML map.");
    setYamlScalar(map, "harness", record.harness);
    setYamlScalar(map, "mode", record.mode);
    if (record.mode === "disable") {
      map.delete("method");
      map.delete("accessCeiling");
      continue;
    }
    setYamlScalar(map, "method", record.method!);
    let access = getYamlMapValueNode(map, "accessCeiling");
    if (!isMap(access)) {
      map.set("accessCeiling", document.createNode({}));
      access = getYamlMapValueNode(map, "accessCeiling");
    }
    if (!isMap(access)) throw new Error("Could not create the harness access ceiling YAML map.");
    setYamlScalar(access, "store", record.accessCeiling!.store);
    setYamlScalar(access, "project", record.accessCeiling!.project);
    setYamlScalar(access, "hostConfig", record.accessCeiling!.hostConfig);
  }
  const content = document.toString();
  return { content, changed: content !== raw };
}

function getYamlMapValueNode(
  map: { items: Array<{ key: unknown; value: unknown }> },
  key: string,
): unknown {
  return map.items.find(item =>
    (isScalar(item.key) && item.key.value === key) || item.key === key
  )?.value;
}

function setYamlScalar(
  map: { get(key: unknown, keepScalar?: boolean): unknown; set(key: unknown, value: unknown): unknown },
  key: string,
  value: string,
): void {
  const node = map.get(key, true);
  if (isScalar(node)) {
    node.value = value;
    return;
  }
  map.set(key, value);
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
    configuredPersonaSlugs: [],
    personaDisplaySources: getPersonaDisplaySources(createDefaultMakeDocsConfig(), []),
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

function getPersonaDisplaySources(config: MakeDocsConfig, value: unknown): Record<string, PersonaDisplaySources> {
  const entries = Array.isArray(value) ? value : [];
  return Object.fromEntries(config.personas.map(persona => {
    const configured = entries.find(entry => isPlainObject(entry) && typeof entry.slug === "string" && entry.slug.trim() === persona.slug);
    const builtin = persona.slug === "user" || persona.slug === "maintainer";
    return [persona.slug, {
      label: !builtin || (configured && Object.hasOwn(configured, "label")) ? "configured" : "shipped",
      description: !builtin || (configured && Object.hasOwn(configured, "description")) ? "configured" : "shipped",
    }];
  }));
}

function applyPersonas(
  value: unknown,
  config: MakeDocsConfig,
  filePath: string,
  diagnostics: MakeDocsConfigDiagnostic[],
): void {
  if (value === undefined) return;
  if (!Array.isArray(value)) {
    addInvalidTypeDiagnostic(diagnostics, filePath, "personas", "an array");
    return;
  }
  const personasBySlug = new Map(config.personas.map(persona => [persona.slug, persona]));
  const configuredSlugs = new Set<string>();
  for (const [index, entry] of value.entries()) {
    const entryPath = `personas[${index}]`;
    if (!isPlainObject(entry)) {
      addInvalidTypeDiagnostic(diagnostics, filePath, entryPath, "an object");
      continue;
    }
    validateKeys({ allowedKeys: PERSONA_KEYS, diagnostics, filePath, keyPath: entryPath, value: entry });
    const slug = getRequiredString(entry, "slug", entryPath, filePath, diagnostics);
    if (!slug) continue;
    if (!PERSONA_SLUG_PATTERN.test(slug)) {
      addInvalidTypeDiagnostic(diagnostics, filePath, `${entryPath}.slug`, "a lowercase kebab-case slug");
      continue;
    }
    if (configuredSlugs.has(slug)) {
      diagnostics.push({ code: "duplicate-persona-slug", filePath, keyPath: `${entryPath}.slug`, message: `Duplicate persona slug '${slug}'.` });
      continue;
    }
    configuredSlugs.add(slug);
    if (RESERVED_PERSONA_SLUGS.has(slug)) {
      diagnostics.push({ code: "reserved-persona-slug", filePath, keyPath: `${entryPath}.slug`, message: `Persona slug '${slug}' is reserved for project structure. Review a new slug and retained-content destination; no content was moved.` });
      continue;
    }
    const builtin = slug === "user" || slug === "maintainer" ? personasBySlug.get(slug)! : undefined;
    const field = (key: "label" | "description" | "primitive") =>
      builtin && !Object.hasOwn(entry, key) ? builtin[key] : getRequiredString(entry, key, entryPath, filePath, diagnostics);
    const label = field("label");
    const description = field("description");
    const primitive = field("primitive");
    if (!label || !description || !primitive) continue;
    if (!PERSONA_PRIMITIVES.includes(primitive as PersonaPrimitive)) {
      diagnostics.push({ code: "invalid-primitive", filePath, keyPath: `${entryPath}.primitive`, message: `Persona primitive must be one of ${PERSONA_PRIMITIVES.join(", ")}; actor technology does not define an audience.` });
      continue;
    }
    if (builtin && primitive !== builtin.primitive) {
      diagnostics.push({ code: "fixed-persona-primitive", filePath, keyPath: `${entryPath}.primitive`, message: `Built-in persona '${slug}' must retain primitive '${builtin.primitive}'.` });
      continue;
    }
    personasBySlug.set(slug, { slug, label, description, primitive: primitive as PersonaPrimitive });
  }
  config.personas = [...personasBySlug.values()];
}

function applyHarnessIntegrations(
  value: unknown,
  config: MakeDocsConfig,
  filePath: string,
  diagnostics: MakeDocsConfigDiagnostic[],
): void {
  if (value === undefined) {
    return;
  }

  if (!Array.isArray(value)) {
    addInvalidTypeDiagnostic(diagnostics, filePath, "harnessIntegrations", "an array");
    return;
  }

  const records: ProjectHarnessIntegrationRecord[] = [];
  const harnesses = new Set<string>();
  for (const [index, entry] of value.entries()) {
    const entryPath = `harnessIntegrations[${index}]`;
    if (!isPlainObject(entry)) {
      addInvalidTypeDiagnostic(diagnostics, filePath, entryPath, "an object");
      continue;
    }
    validateKeys({
      allowedKeys: HARNESS_INTEGRATION_RECORD_KEYS,
      diagnostics,
      filePath,
      keyPath: entryPath,
      value: entry,
    });

    const harness = getRequiredString(entry, "harness", entryPath, filePath, diagnostics);
    const mode = getRequiredString(entry, "mode", entryPath, filePath, diagnostics);
    const method = getOptionalString(entry, "method", entryPath, filePath, diagnostics);
    const accessCeiling = getHarnessAccessCeiling(
      entry.accessCeiling,
      `${entryPath}.accessCeiling`,
      filePath,
      diagnostics,
    );
    if (!harness || !mode) {
      continue;
    }
    if (!PERSONA_SLUG_PATTERN.test(harness)) {
      diagnostics.push({
        code: "invalid-harness-identifier",
        filePath,
        keyPath: `${entryPath}.harness`,
        message: `Invalid make-docs config at ${filePath} (${entryPath}.harness): use a lowercase harness identifier.`,
      });
      continue;
    }
    if (harnesses.has(harness)) {
      diagnostics.push({
        code: "duplicate-harness-integration-record",
        filePath,
        keyPath: `${entryPath}.harness`,
        message: `Invalid make-docs config at ${filePath} (${entryPath}.harness): duplicate harness integration record '${harness}'.`,
      });
      continue;
    }
    harnesses.add(harness);
    if (mode !== "inherit" && mode !== "narrow" && mode !== "disable") {
      diagnostics.push({
        code: "invalid-harness-integration-mode",
        filePath,
        keyPath: `${entryPath}.mode`,
        message: `Invalid make-docs config at ${filePath} (${entryPath}.mode): mode must be inherit, narrow, or disable.`,
      });
      continue;
    }
    if (method !== undefined && !PERSONA_SLUG_PATTERN.test(method)) {
      diagnostics.push({
        code: "invalid-harness-method",
        filePath,
        keyPath: `${entryPath}.method`,
        message: `Invalid make-docs config at ${filePath} (${entryPath}.method): use a lowercase connection method identifier.`,
      });
      continue;
    }
    if (method !== undefined && getFirstPartyHarnessAdapter(harness)) {
      try {
        validateHarnessMethodSelection({ harnessId: harness, method: method as HarnessMethodSelection, scope: "project" });
      } catch (error) {
        diagnostics.push({
          code: "invalid-harness-method",
          filePath,
          keyPath: `${entryPath}.method`,
          message: `Invalid make-docs config at ${filePath} (${entryPath}.method): ${error instanceof Error ? error.message : String(error)}`,
        });
        continue;
      }
    }
    const hasNarrowing = method !== undefined || accessCeiling !== undefined;
    if ((mode === "narrow") !== hasNarrowing) {
      diagnostics.push({
        code: "invalid-harness-integration-combination",
        filePath,
        keyPath: entryPath,
        message: `Invalid make-docs config at ${filePath} (${entryPath}): narrow requires a method or accessCeiling, while inherit and disable forbid them.`,
      });
      continue;
    }
    records.push({
      harness,
      mode,
      ...(method ? { method } : {}),
      ...(accessCeiling ? { accessCeiling } : {}),
    });
  }
  config.harnessIntegrations = records;
}

/**
 * Apply the most restrictive project choice to one machine-approved method.
 * MCP is the broad method within each current first-party adapter. Native rule
 * methods are narrower only inside their own harness.
 */
export function resolveEffectiveHarnessIntegration(
  project: ProjectHarnessIntegrationRecord | undefined,
  machine: MachineHarnessApproval,
  harnessId: string,
): EffectiveHarnessIntegration {
  assertHarnessAccessCeiling(machine.accessCeiling, "Machine harness access ceiling");
  if (project && project.harness !== harnessId) {
    throw new Error(`Project harness '${project.harness}' does not match '${harnessId}'.`);
  }
  if (project?.mode === "narrow" && !project.method && !project.accessCeiling) {
    throw new Error("Project narrow mode needs a narrower method or accessCeiling.");
  }
  if (
    project &&
    project.mode !== "narrow" &&
    (project.method !== undefined || project.accessCeiling !== undefined)
  ) {
    throw new Error(`Project ${project.mode} mode cannot declare a method or accessCeiling.`);
  }
  if (machine.maximumMethod === null || machine.maximumMethod === "none") {
    if (machine.selected) {
      throw new Error(`Selected harness '${harnessId}' must have an approved connection method.`);
    }
    return { enabled: false, method: null, access: { ...NO_ACCESS }, source: "machine" };
  }
  if (!machine.selected) {
    return { enabled: false, method: null, access: { ...NO_ACCESS }, source: "machine" };
  }
  validateHarnessMethodSelection({ harnessId, method: machine.maximumMethod as HarnessMethodSelection });
  if (!project || project.mode === "inherit") {
    return {
      enabled: true,
      method: machine.maximumMethod,
      access: { ...machine.accessCeiling },
      source: "machine",
    };
  }
  if (project.mode === "disable") {
    return { enabled: false, method: null, access: { ...NO_ACCESS }, source: "project-disable" };
  }
  const projectMethod = project.method ?? machine.maximumMethod;
  validateHarnessMethodSelection({ harnessId, method: projectMethod as HarnessMethodSelection, scope: "project" });
  if (machine.maximumMethod !== "mcp" && projectMethod !== machine.maximumMethod) {
    throw new Error(
      `Project method '${projectMethod}' is broader than machine-approved method '${machine.maximumMethod}'.`,
    );
  }
  const projectAccess = project.accessCeiling ?? machine.accessCeiling;
  assertHarnessAccessCeiling(projectAccess, "Project harness access ceiling");
  if (!accessAtMost(projectAccess, machine.accessCeiling)) {
    throw new Error("Project accessCeiling is broader than the machine-approved access ceiling.");
  }
  return {
    enabled: true,
    method: projectMethod,
    access: { ...projectAccess },
    source: "project-narrow",
  };
}

function getHarnessAccessCeiling(
  value: unknown,
  keyPath: string,
  filePath: string,
  diagnostics: MakeDocsConfigDiagnostic[],
): OperationAccess | undefined {
  if (value === undefined) return undefined;
  if (!isPlainObject(value)) {
    diagnostics.push({
      code: "invalid-harness-access",
      filePath,
      keyPath,
      message: `Invalid make-docs config at ${filePath} (${keyPath}): expected store, project, and hostConfig access.`,
    });
    return undefined;
  }
  const keys = Object.keys(value).sort();
  if (
    keys.join(",") !== "hostConfig,project,store" ||
    !isAccessLevel(value.store) ||
    !isAccessLevel(value.project) ||
    (value.hostConfig !== "none" && value.hostConfig !== "write")
  ) {
    diagnostics.push({
      code: "invalid-harness-access",
      filePath,
      keyPath,
      message: `Invalid make-docs config at ${filePath} (${keyPath}): accessCeiling must declare only store, project, and hostConfig with supported access values.`,
    });
    return undefined;
  }
  return {
    store: value.store,
    project: value.project,
    hostConfig: value.hostConfig,
  };
}

function assertHarnessAccessCeiling(value: OperationAccess, label: string): void {
  if (
    !value ||
    !isAccessLevel(value.store) ||
    !isAccessLevel(value.project) ||
    value.hostConfig !== "none"
  ) {
    throw new Error(`${label} must be complete and cannot grant host-configuration writes.`);
  }
}

function accessAtMost(candidate: OperationAccess, ceiling: OperationAccess): boolean {
  const rank = { none: 0, read: 1, write: 2 } as const;
  return rank[candidate.store] <= rank[ceiling.store] &&
    rank[candidate.project] <= rank[ceiling.project] &&
    candidate.hostConfig === "none";
}

function isAccessLevel(value: unknown): value is "none" | "read" | "write" {
  return value === "none" || value === "read" || value === "write";
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
    // Preserve known legacy config as opaque input. It has no current effect.
    if (key === "parallel_playbook_runs") continue;
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
  // Validate known fields in their apply functions. Unknown fields belong to
  // the project and remain opaque so setup can preserve future or local data.
  void options;
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
