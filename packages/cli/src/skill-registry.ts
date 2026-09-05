import path from "node:path";
import { pathToFileURL } from "node:url";
import { readTextFile, resolveTemplateRoot } from "./utils";

export type SkillManifestSourcePolicyKind =
  | "first-party"
  | "local"
  | "remote-pinned";

export type SkillProvenanceKind =
  | SkillManifestSourcePolicyKind
  | "third-party";

export type SkillSupportedHarness = "claude-code" | "codex";

export interface SkillAssetEntry {
  source: string;
  installPath: string;
}

export interface SkillProvenance {
  kind: SkillProvenanceKind;
  label: string;
  manifestId?: string;
  repository?: string;
  ref?: string;
  digest?: string;
}

export interface SkillPurpose {
  id: string;
  label: string;
  description: string;
  order?: number;
  provenance: SkillProvenance;
}

export interface SkillManifestSourcePolicy {
  kind: SkillManifestSourcePolicyKind;
  label: string;
  allowRemoteSkillSources?: boolean;
}

export interface SkillRegistryEntry {
  name: string;
  displayName: string;
  source: string;
  entryPoint: string;
  installName: string;
  description: string;
  purposes: string[];
  supportedHarnesses: SkillSupportedHarness[];
  provenance: SkillProvenance;
  defaultForPurposes?: string[];
  assets: SkillAssetEntry[];
}

export interface SkillRegistry {
  schemaVersion: number;
  manifestId: string;
  displayName: string;
  description?: string;
  sourcePolicy: SkillManifestSourcePolicy;
  purposes: SkillPurpose[];
  skills: SkillRegistryEntry[];
}

export interface EffectiveSkillRegistry {
  registry: SkillRegistry;
  source: EffectiveSkillRegistrySource;
}

export type EffectiveSkillRegistrySource =
  | { kind: "built-in" }
  | { kind: "file"; path: string }
  | { kind: "remote-pinned"; reference: string; digest: string };

const REGISTRY_FILENAME = "skill-registry.json";
const FIRST_PARTY_MANIFEST_ID = "make-docs.first-party";
// D-005 permits only the P7 UGT payload to use bundled first-party delivery.
const BUNDLED_UGT_SOURCE = "local:template/.make-docs/agentics/skills/naive-uat";
const FIRST_PARTY_PURPOSE_IDS = new Set([
  "archive-management",
  "codebase-decomposition",
  "documentation-maintenance",
  "lifecycle-closeout",
  "workflow-execution",
  "naive-uat",
  "plan-creation",
  "migration-support",
]);
const SOURCE_POLICY_KINDS = new Set<SkillManifestSourcePolicyKind>([
  "first-party",
  "local",
  "remote-pinned",
]);
const PROVENANCE_KINDS = new Set<SkillProvenanceKind>([
  "first-party",
  "local",
  "remote-pinned",
  "third-party",
]);
const SUPPORTED_HARNESSES = new Set<SkillSupportedHarness>([
  "claude-code",
  "codex",
]);

export function loadSkillRegistry(packageRoot: string): SkillRegistry {
  const registryPath = path.join(packageRoot, REGISTRY_FILENAME);
  return loadSkillRegistryFromPath(registryPath);
}

export function loadEffectiveSkillRegistry(options: {
  packageRoot: string;
  manifestReference?: string;
}): EffectiveSkillRegistry {
  if (!options.manifestReference) {
    return {
      registry: loadSkillRegistry(options.packageRoot),
      source: { kind: "built-in" },
    };
  }

  if (isRemoteSource(options.manifestReference)) {
    throw new Error(
      "Remote skills manifests require an immutable reference plus digest before install. Use a local file manifest for now or provide a future remote-pinned manifest input.",
    );
  }

  const registryPath = path.resolve(options.manifestReference);
  return {
    registry: loadSkillRegistryFromPath(registryPath),
    source: { kind: "file", path: registryPath },
  };
}

export function loadSkillRegistryFromPath(registryPath: string): SkillRegistry {
  let raw: string;
  try {
    raw = readTextFile(registryPath);
  } catch (cause) {
    throw new Error(`Skill registry not found at ${registryPath}`, { cause });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (cause) {
    throw new Error(`Skill registry at ${registryPath} is not valid JSON`, {
      cause,
    });
  }

  return normalizeLocalSkillSources(
    validateSkillRegistryManifest(parsed, registryPath),
    registryPath,
  );
}

export function validateSkillRegistryManifest(
  parsed: unknown,
  registryPath = "skill-registry.json",
): SkillRegistry {
  const errors: string[] = [];

  if (!isPlainObject(parsed)) {
    throw new Error(`Skill registry at ${registryPath} must be an object`);
  }

  const schemaVersion = readRequiredNumber(
    parsed,
    "schemaVersion",
    "manifest",
    errors,
  );
  const manifestId = readRequiredString(
    parsed,
    "manifestId",
    "manifest",
    errors,
  );
  const displayName = readRequiredString(
    parsed,
    "displayName",
    "manifest",
    errors,
  );
  const description = readOptionalString(parsed, "description", "manifest", errors);
  const sourcePolicy = validateSourcePolicy(parsed.sourcePolicy, errors);
  if (
    sourcePolicy.kind === "first-party" &&
    manifestId !== null &&
    manifestId !== FIRST_PARTY_MANIFEST_ID
  ) {
    errors.push(
      `first-party source policy is reserved for manifest \`${FIRST_PARTY_MANIFEST_ID}\``,
    );
  }
  const purposes = validatePurposes(
    Array.isArray(parsed.purposes) ? parsed.purposes : null,
    sourcePolicy,
    manifestId,
    errors,
  );
  if (!Array.isArray(parsed.purposes)) {
    errors.push("manifest is missing required `purposes` array");
  }
  if (!Array.isArray(parsed.skills)) {
    errors.push("manifest is missing required `skills` array");
  }

  const skills: SkillRegistryEntry[] = [];
  if (Array.isArray(parsed.skills)) {
    const purposeIds = new Set(purposes.map((purpose) => purpose.id));
    for (const [index, entry] of parsed.skills.entries()) {
      const validated = validateEntry(
        entry,
        index,
        sourcePolicy,
        purposeIds,
        errors,
      );
      if (!validated) {
        continue;
      }
      skills.push(validated);
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `Skill registry at ${registryPath} is invalid:\n- ${errors.join("\n- ")}`,
    );
  }

  return {
    schemaVersion: schemaVersion ?? 1,
    manifestId: manifestId ?? "",
    displayName: displayName ?? "",
    ...(description === undefined ? {} : { description }),
    sourcePolicy,
    purposes,
    skills,
  };
}

export function getSkillRegistryNames(registry: SkillRegistry): string[] {
  return registry.skills.map((skill) => skill.name).sort();
}

function validateEntry(
  entry: unknown,
  index: number,
  sourcePolicy: SkillManifestSourcePolicy,
  purposeIds: Set<string>,
  errors: string[],
): SkillRegistryEntry | null {
  if (!isPlainObject(entry)) {
    errors.push(`skill at index ${index} must be an object`);
    return null;
  }

  const name = readRequiredString(entry, "name", `skill at index ${index}`, errors);
  if (name === null) return null;

  const displayName =
    readRequiredString(entry, "displayName", `skill \`${name}\``, errors) ??
    name;
  const source = readRequiredString(entry, "source", `skill \`${name}\``, errors);
  const entryPoint = readRequiredString(
    entry,
    "entryPoint",
    `skill \`${name}\``,
    errors,
  );
  const installName = readRequiredString(
    entry,
    "installName",
    `skill \`${name}\``,
    errors,
  );
  if (source === null || entryPoint === null || installName === null)
    return null;

  const bundledUgt = sourcePolicy.kind === "first-party" &&
    name === "naive-uat" && source === BUNDLED_UGT_SOURCE;
  if (sourcePolicy.kind !== "local" && !isRemoteSource(source) && !bundledUgt) {
    errors.push(
      `skill \`${name}\` must use a remote source URL unless the manifest source policy is local`,
    );
  }

  const description = readRequiredString(
    entry,
    "description",
    `skill \`${name}\``,
    errors,
  );
  const purposes = validateStringArray(
    entry.purposes,
    `skill \`${name}\` purposes`,
    errors,
    { minItems: 1 },
  );
  for (const purposeId of purposes) {
    if (!purposeIds.has(purposeId)) {
      errors.push(`skill \`${name}\` references missing purpose \`${purposeId}\``);
    }
  }
  const supportedHarnesses = validateSupportedHarnesses(
    entry.supportedHarnesses,
    name,
    errors,
  );
  const provenance = validateProvenance(
    entry.provenance,
    `skill \`${name}\` provenance`,
    errors,
  );
  if (
    isRemoteSource(source) &&
    sourcePolicy.kind !== "first-party" &&
    !hasRemotePinnedProvenance(provenance)
  ) {
    errors.push(
      `skill \`${name}\` remote source requires remote-pinned provenance with immutable ref and digest`,
    );
  }
  const defaultForPurposes =
    entry.defaultForPurposes === undefined
      ? undefined
      : validateStringArray(
          entry.defaultForPurposes,
          `skill \`${name}\` defaultForPurposes`,
          errors,
        );
  if (defaultForPurposes) {
    for (const purposeId of defaultForPurposes) {
      if (!purposes.includes(purposeId)) {
        errors.push(
          `skill \`${name}\` default purpose \`${purposeId}\` must also appear in its purposes`,
        );
      }
    }
  }

  if (!Array.isArray(entry.assets)) {
    errors.push(`skill \`${name}\` is missing required \`assets\` array`);
    return null;
  }

  const assets: SkillAssetEntry[] = [];
  for (const [assetIndex, asset] of entry.assets.entries()) {
    if (
      !isPlainObject(asset) ||
      typeof asset.source !== "string" ||
      typeof asset.installPath !== "string"
    ) {
      errors.push(
        `skill \`${name}\` asset at index ${assetIndex} must include string source and installPath`,
      );
      continue;
    }
    assets.push({ source: asset.source, installPath: asset.installPath });
  }

  return {
    name,
    displayName,
    source,
    entryPoint,
    installName,
    description: description ?? "",
    purposes,
    supportedHarnesses,
    provenance,
    ...(defaultForPurposes === undefined ? {} : { defaultForPurposes }),
    assets,
  };
}

function validateSourcePolicy(
  value: unknown,
  errors: string[],
): SkillManifestSourcePolicy {
  if (!isPlainObject(value)) {
    errors.push("manifest is missing required `sourcePolicy` metadata");
    return { kind: "local", label: "" };
  }

  const kind = readRequiredString(value, "kind", "sourcePolicy", errors);
  const label = readRequiredString(value, "label", "sourcePolicy", errors);
  const allowRemoteSkillSources =
    value.allowRemoteSkillSources === undefined
      ? undefined
      : readRequiredBoolean(
          value,
          "allowRemoteSkillSources",
          "sourcePolicy",
          errors,
        );

  if (kind !== null && !SOURCE_POLICY_KINDS.has(kind as SkillManifestSourcePolicyKind)) {
    errors.push(
      "sourcePolicy.kind must be one of first-party, local, or remote-pinned",
    );
  }

  return {
    kind: SOURCE_POLICY_KINDS.has(kind as SkillManifestSourcePolicyKind)
      ? (kind as SkillManifestSourcePolicyKind)
      : "local",
    label: label ?? "",
    ...(allowRemoteSkillSources === undefined ? {} : { allowRemoteSkillSources }),
  };
}

function validatePurposes(
  values: unknown[] | null,
  sourcePolicy: SkillManifestSourcePolicy,
  manifestId: string | null,
  errors: string[],
): SkillPurpose[] {
  if (!values) {
    return [];
  }

  const purposes: SkillPurpose[] = [];
  const seenPurposeIds = new Set<string>();
  for (const [index, value] of values.entries()) {
    if (!isPlainObject(value)) {
      errors.push(`purpose at index ${index} must be an object`);
      continue;
    }

    const id = readRequiredString(value, "id", `purpose at index ${index}`, errors);
    if (id === null) {
      continue;
    }
    if (seenPurposeIds.has(id)) {
      errors.push(`duplicate purpose id \`${id}\``);
    }
    seenPurposeIds.add(id);

    const provenance = validateProvenance(
      value.provenance,
      `purpose \`${id}\` provenance`,
      errors,
    );
    const firstPartyPurpose = FIRST_PARTY_PURPOSE_IDS.has(id);
    const firstPartyDefinition =
      provenance.kind === "first-party" &&
      provenance.manifestId === FIRST_PARTY_MANIFEST_ID;
    if (
      firstPartyPurpose &&
      sourcePolicy.kind !== "first-party" &&
      !firstPartyDefinition
    ) {
      errors.push(
        `purpose \`${id}\` collides with a first-party purpose id without first-party provenance`,
      );
    }
    if (!firstPartyPurpose && !isNamespacedPurposeId(id)) {
      errors.push(`third-party purpose id \`${id}\` must be namespaced`);
    }
    if (
      sourcePolicy.kind === "first-party" &&
      manifestId === FIRST_PARTY_MANIFEST_ID &&
      !firstPartyPurpose
    ) {
      errors.push(
        `first-party manifest purpose \`${id}\` must be a canonical make-docs purpose id`,
      );
    }

    const label = readRequiredString(value, "label", `purpose \`${id}\``, errors);
    const description = readRequiredString(
      value,
      "description",
      `purpose \`${id}\``,
      errors,
    );
    const order =
      value.order === undefined
        ? undefined
        : readRequiredNumber(value, "order", `purpose \`${id}\``, errors);

    purposes.push({
      id,
      label: label ?? "",
      description: description ?? "",
      ...(order === undefined || order === null ? {} : { order }),
      provenance,
    });
  }

  return purposes;
}

function validateProvenance(
  value: unknown,
  context: string,
  errors: string[],
): SkillProvenance {
  if (!isPlainObject(value)) {
    errors.push(`${context} is missing required provenance metadata`);
    return { kind: "local", label: "" };
  }

  const kind = readRequiredString(value, "kind", context, errors);
  const label = readRequiredString(value, "label", context, errors);
  const manifestId = readOptionalString(value, "manifestId", context, errors);
  const repository = readOptionalString(value, "repository", context, errors);
  const ref = readOptionalString(value, "ref", context, errors);
  const digest = readOptionalString(value, "digest", context, errors);

  if (kind !== null && !PROVENANCE_KINDS.has(kind as SkillProvenanceKind)) {
    errors.push(
      `${context}.kind must be one of first-party, local, remote-pinned, or third-party`,
    );
  }

  return {
    kind: PROVENANCE_KINDS.has(kind as SkillProvenanceKind)
      ? (kind as SkillProvenanceKind)
      : "local",
    label: label ?? "",
    ...(manifestId === undefined ? {} : { manifestId }),
    ...(repository === undefined ? {} : { repository }),
    ...(ref === undefined ? {} : { ref }),
    ...(digest === undefined ? {} : { digest }),
  };
}

function validateSupportedHarnesses(
  value: unknown,
  skillName: string,
  errors: string[],
): SkillSupportedHarness[] {
  const harnesses = validateStringArray(
    value,
    `skill \`${skillName}\` supportedHarnesses`,
    errors,
    { minItems: 1 },
  );
  const unique = Array.from(new Set(harnesses));
  if (unique.length !== harnesses.length) {
    errors.push(`skill \`${skillName}\` supportedHarnesses must be unique`);
  }
  for (const harness of unique) {
    if (!SUPPORTED_HARNESSES.has(harness as SkillSupportedHarness)) {
      errors.push(
        `skill \`${skillName}\` supportedHarnesses contains unsupported harness \`${harness}\``,
      );
    }
  }

  return unique.filter((harness): harness is SkillSupportedHarness =>
    SUPPORTED_HARNESSES.has(harness as SkillSupportedHarness),
  );
}

function validateStringArray(
  value: unknown,
  context: string,
  errors: string[],
  options: { minItems?: number } = {},
): string[] {
  if (!Array.isArray(value)) {
    errors.push(`${context} must be an array`);
    return [];
  }

  const strings: string[] = [];
  for (const [index, entry] of value.entries()) {
    if (typeof entry !== "string" || entry.length === 0) {
      errors.push(`${context}.${index} must be a non-empty string`);
      continue;
    }
    strings.push(entry);
  }

  if (options.minItems && strings.length < options.minItems) {
    errors.push(`${context} must contain at least ${options.minItems} item`);
  }

  return strings;
}

function readRequiredString(
  entry: Record<string, unknown>,
  field: string,
  context: string,
  errors: string[],
): string | null {
  const value = entry[field];
  if (typeof value !== "string" || value.length === 0) {
    errors.push(`${context} is missing required string field \`${field}\``);
    return null;
  }
  return value;
}

function readOptionalString(
  entry: Record<string, unknown>,
  field: string,
  context: string,
  errors: string[],
): string | undefined {
  const value = entry[field];
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== "string" || value.length === 0) {
    errors.push(`${context} field \`${field}\` must be a non-empty string`);
    return undefined;
  }
  return value;
}

function readRequiredNumber(
  entry: Record<string, unknown>,
  field: string,
  context: string,
  errors: string[],
): number | null {
  const value = entry[field];
  if (typeof value !== "number" || !Number.isInteger(value)) {
    errors.push(`${context} is missing required integer field \`${field}\``);
    return null;
  }
  return value;
}

function readRequiredBoolean(
  entry: Record<string, unknown>,
  field: string,
  context: string,
  errors: string[],
): boolean | undefined {
  const value = entry[field];
  if (typeof value !== "boolean") {
    errors.push(`${context} field \`${field}\` must be a boolean`);
    return undefined;
  }
  return value;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNamespacedPurposeId(id: string): boolean {
  return /^[a-z0-9][a-z0-9-]*\.[a-z0-9][a-z0-9-]*$/.test(id);
}

function hasRemotePinnedProvenance(provenance: SkillProvenance): boolean {
  return (
    provenance.kind === "remote-pinned" &&
    typeof provenance.ref === "string" &&
    provenance.ref.length > 0 &&
    typeof provenance.digest === "string" &&
    provenance.digest.length > 0
  );
}

function normalizeLocalSkillSources(
  registry: SkillRegistry,
  registryPath: string,
): SkillRegistry {
  if (registry.sourcePolicy.kind === "first-party") {
    return {
      ...registry,
      skills: registry.skills.map((skill) => {
        if (skill.source !== BUNDLED_UGT_SOURCE) return skill;
        return {
          ...skill,
          source: pathToFileURL(path.join(
            resolveTemplateRoot(path.dirname(path.resolve(registryPath))),
            ".make-docs/agentics/skills/naive-uat",
          )).href,
        };
      }),
    };
  }
  if (registry.sourcePolicy.kind !== "local") {
    return registry;
  }

  const baseDir = path.dirname(path.resolve(registryPath));
  return {
    ...registry,
    skills: registry.skills.map((skill) => ({
      ...skill,
      source: isRemoteSource(skill.source)
        ? skill.source
        : normalizeLocalSource(skill.source, baseDir),
    })),
  };
}

function normalizeLocalSource(source: string, baseDir: string): string {
  if (source.startsWith("file:")) {
    return source;
  }

  const rawSource = source.startsWith("local:")
    ? source.slice("local:".length)
    : source;
  return pathToFileURL(path.resolve(baseDir, rawSource)).href;
}

function isRemoteSource(source: string): boolean {
  return (
    source.startsWith("https://") ||
    source.startsWith("http://") ||
    source.startsWith("github:") ||
    source.startsWith("url:")
  );
}
