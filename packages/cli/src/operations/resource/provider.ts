import { createHash } from "node:crypto";
import {
  existsSync,
  lstatSync,
  readdirSync,
  readFileSync,
  realpathSync,
  statSync,
} from "node:fs";
import path from "node:path";
import { TEMPLATE_ROOT, readPackageMeta } from "../../utils";
import { canonicalSystemResourcePath, createSystemResourceIdentity, isSystemResourceType } from "./identity";
import {
  SYSTEM_RESOURCE_TYPES,
  SYSTEM_RESOURCE_TYPE_DIRECTORIES,
  type LoadSystemResourceProviderInput,
  type SystemResourceCatalogRule,
  type SystemResourceError,
  type SystemResourceProviderEntry,
  type SystemResourceProviderInventory,
  type SystemResourceResult,
  type SystemResourceType,
} from "./types";

interface ResourceCatalogType {
  type: unknown;
  sourceRoot: unknown;
  include: unknown;
  exclude: unknown;
}

interface ResourceCatalog {
  schemaVersion?: unknown;
  pathBase?: unknown;
  identityTemplate?: unknown;
  defaultMediaType?: unknown;
  resourceTypes?: unknown;
}

interface ValidatedCatalog {
  mediaType: string;
  resourceTypes: readonly (ResourceCatalogType & {
    type: SystemResourceType;
    sourceRoot: string;
    include: string[];
    exclude: string[];
  })[];
}

const DEFAULT_CATALOG_PATH = ".make-docs/system-resources.catalog.json";

export function loadSystemResourceProvider(
  input: LoadSystemResourceProviderInput,
): SystemResourceResult<SystemResourceProviderInventory> {
  const root = inspectRoot(input.root, "provider");
  if (!root.ok) {
    return root;
  }

  const catalogRelativePath = input.catalogRelativePath ?? DEFAULT_CATALOG_PATH;
  const catalogPath = resolveExistingSafePath(root.value, catalogRelativePath, "file");
  if (!catalogPath.ok) {
    return withCode(catalogPath.error, "provider-catalog-invalid", catalogRelativePath);
  }

  let catalog: ResourceCatalog;
  try {
    catalog = JSON.parse(readFileSync(catalogPath.value, "utf8")) as ResourceCatalog;
  } catch (error) {
    return failure(
      "provider-catalog-invalid",
      `Could not parse the system-resource catalog: ${errorMessage(error)}.`,
      "Restore a valid shipped system-resource catalog.",
      undefined,
      catalogPath.value,
    );
  }

  const catalogTypes = validateCatalog(catalog);
  if (!catalogTypes.ok) {
    return catalogTypes;
  }

  const resources: SystemResourceProviderEntry[] = [];
  const seen = new Set<string>();

  for (const catalogType of catalogTypes.value.resourceTypes) {
    const sourceRoot = resolveExistingSafePath(root.value, catalogType.sourceRoot, "directory");
    if (!sourceRoot.ok) {
      return withCode(sourceRoot.error, "provider-unavailable", catalogType.sourceRoot);
    }
    const files = listSafeFiles(root.value, sourceRoot.value);
    if (!files.ok) {
      return files;
    }

    for (const filePath of files.value) {
      const relativePath = toPosix(path.relative(sourceRoot.value, filePath));
      if (!matchesAny(relativePath, catalogType.include) || matchesAny(relativePath, catalogType.exclude)) {
        continue;
      }
      const identity = createSystemResourceIdentity(catalogType.type, relativePath);
      if (!identity.ok) {
        return identity;
      }
      if (seen.has(identity.value.uri)) {
        return failure(
          "duplicate-resource-identity",
          `The provider contains duplicate logical identity ${identity.value.uri}.`,
          "Remove the duplicate catalog mapping or provider file.",
          identity.value.uri,
          filePath,
        );
      }
      seen.add(identity.value.uri);

      let content: Buffer;
      try {
        content = readFileSync(filePath);
      } catch (error) {
        return failure(
          "filesystem-error",
          `Could not read provider resource ${identity.value.uri}: ${errorMessage(error)}.`,
          "Repair the installed provider and retry.",
          identity.value.uri,
          filePath,
        );
      }
      const storedContent = Uint8Array.from(content);
      resources.push(Object.freeze({
        identity: Object.freeze(identity.value),
        mediaType: catalogTypes.value.mediaType,
        digest: sha256(storedContent),
        byteLength: storedContent.byteLength,
        sourcePath: filePath,
        readContent: () => Uint8Array.from(storedContent),
      }));
    }
  }

  resources.sort((left, right) => compareCodeUnits(left.identity.uri, right.identity.uri));
  const inventoryDigest = sha256(
    Buffer.from(resources.map((entry) => `${entry.identity.uri}\0${entry.digest}`).join("\n")),
  );
  const immutableRef = input.immutableRef ?? `sha256:${inventoryDigest}`;

  const providerIdentity = Object.freeze({
    packageName: input.packageName,
    version: input.version,
    immutableRef,
    source: input.source,
  });
  const providerMetadata = Object.freeze({
    identity: providerIdentity,
    root: root.value,
    catalogPath: catalogPath.value,
    catalogRules: Object.freeze(catalogTypes.value.resourceTypes.map((entry) => Object.freeze({
      type: entry.type,
      include: Object.freeze([...entry.include]),
      exclude: Object.freeze([...entry.exclude]),
    }))),
    inventoryDigest,
  });
  const inventory = Object.freeze({
    provider: providerMetadata,
    resources: Object.freeze([...resources]),
  });

  return {
    ok: true,
    value: inventory,
  };
}

export function loadInstalledSystemResourceProvider(): SystemResourceResult<SystemResourceProviderInventory> {
  try {
    const packageMeta = readPackageMeta();
    const source = path.basename(path.dirname(TEMPLATE_ROOT)) === "docs" ? "development" : "packed";
    return loadSystemResourceProvider({
      root: TEMPLATE_ROOT,
      packageName: packageMeta.name,
      version: packageMeta.version,
      immutableRef: `package:${packageMeta.name}@${packageMeta.version}`,
      source,
    });
  } catch (error) {
    return failure(
      "provider-unavailable",
      `Could not identify the installed provider: ${errorMessage(error)}.`,
      "Repair the installed package metadata and retry.",
      undefined,
      TEMPLATE_ROOT,
    );
  }
}

export function matchesSystemResourceCatalogPath(
  provider: SystemResourceProviderInventory,
  type: SystemResourceType,
  resourcePath: string,
): SystemResourceResult<boolean> {
  const rules = provider?.provider?.catalogRules;
  if (
    !Array.isArray(rules) ||
    rules.length !== SYSTEM_RESOURCE_TYPES.length ||
    !SYSTEM_RESOURCE_TYPES.every(
      (expectedType) => rules.filter((rule) => rule?.type === expectedType).length === 1,
    )
  ) {
    return invalidCatalogType("Provider inventory catalog rules are incomplete or duplicated.");
  }
  const rule = rules.find((candidate) => candidate.type === type) as
    | SystemResourceCatalogRule
    | undefined;
  if (
    !rule ||
    !isStringArray(rule.include) ||
    rule.include.length === 0 ||
    !isStringArray(rule.exclude)
  ) {
    return invalidCatalogType(`Provider inventory catalog rules for ${type} are invalid.`);
  }
  return {
    ok: true,
    value: matchesAny(resourcePath, rule.include) && !matchesAny(resourcePath, rule.exclude),
  };
}

function validateCatalog(
  catalog: ResourceCatalog,
): SystemResourceResult<ValidatedCatalog> {
  if (
    catalog.schemaVersion !== 1 ||
    catalog.pathBase !== "template-root" ||
    catalog.identityTemplate !== "make-docs://system/{type}/{path}" ||
    typeof catalog.defaultMediaType !== "string" ||
    catalog.defaultMediaType.length === 0 ||
    !Array.isArray(catalog.resourceTypes)
  ) {
    return failure(
      "provider-catalog-invalid",
      "The system-resource catalog header is invalid.",
      "Restore the shipped schema version 1 catalog.",
    );
  }

  const result: Array<ResourceCatalogType & {
    type: SystemResourceType;
    sourceRoot: string;
    include: string[];
    exclude: string[];
  }> = [];
  const seenTypes = new Set<SystemResourceType>();

  for (const raw of catalog.resourceTypes) {
    if (!isPlainObject(raw)) {
      return invalidCatalogType("Each resourceTypes entry must be an object.");
    }
    const entry = raw as unknown as ResourceCatalogType;
    if (!isSystemResourceType(entry.type)) {
      return invalidCatalogType(`Unknown catalog resource type: ${String(entry.type)}.`);
    }
    if (seenTypes.has(entry.type)) {
      return failure(
        "duplicate-resource-identity",
        `The catalog repeats resource type ${entry.type}.`,
        "Keep exactly one catalog entry for each peer resource type.",
      );
    }
    seenTypes.add(entry.type);
    const expectedRoot = `.make-docs/system/${SYSTEM_RESOURCE_TYPE_DIRECTORIES[entry.type]}`;
    if (entry.sourceRoot !== expectedRoot) {
      return invalidCatalogType(
        `Catalog type ${entry.type} must use provider root ${expectedRoot}.`,
      );
    }
    const sourceRoot = canonicalSystemResourcePath(entry.sourceRoot);
    if (!sourceRoot.ok) {
      return withCode(sourceRoot.error, "provider-catalog-invalid", String(entry.sourceRoot));
    }
    if (!isStringArray(entry.include) || entry.include.length === 0 || !isStringArray(entry.exclude)) {
      return invalidCatalogType(`Catalog patterns for ${entry.type} are invalid.`);
    }
    result.push({
      ...entry,
      type: entry.type,
      sourceRoot: sourceRoot.value,
      include: [...entry.include],
      exclude: [...entry.exclude],
    });
  }

  if (
    result.length !== SYSTEM_RESOURCE_TYPES.length ||
    SYSTEM_RESOURCE_TYPES.some((type) => !seenTypes.has(type))
  ) {
    return invalidCatalogType("The catalog must contain exactly the four peer resource types.");
  }

  result.sort((left, right) => compareCodeUnits(left.type, right.type));
  return {
    ok: true,
    value: { mediaType: catalog.defaultMediaType, resourceTypes: result },
  };
}

function inspectRoot(rootInput: string, label: string): SystemResourceResult<string> {
  const absolute = path.resolve(rootInput);
  try {
    if (!existsSync(absolute)) {
      return failure(
        "provider-unavailable",
        `The ${label} root does not exist.`,
        `Restore the ${label} root and retry.`,
        undefined,
        absolute,
      );
    }
    if (lstatSync(absolute).isSymbolicLink()) {
      return failure(
        "symlink-not-allowed",
        `The ${label} root is a symbolic link.`,
        `Use a real ${label} directory.`,
        undefined,
        absolute,
      );
    }
    const real = realpathSync(absolute);
    if (!statSync(real).isDirectory()) {
      return failure(
        "unsafe-root",
        `The ${label} root is not a directory.`,
        `Use a real ${label} directory.`,
        undefined,
        absolute,
      );
    }
    return { ok: true, value: real };
  } catch (error) {
    return failure(
      "filesystem-error",
      `Could not inspect the ${label} root: ${errorMessage(error)}.`,
      `Repair the ${label} root and retry.`,
      undefined,
      absolute,
    );
  }
}

function resolveExistingSafePath(
  root: string,
  relativeInput: string,
  kind: "file" | "directory",
): SystemResourceResult<string> {
  const relative = canonicalSystemResourcePath(relativeInput);
  if (!relative.ok) {
    return relative;
  }
  const segments = relative.value.split("/");
  let current = root;
  try {
    for (const segment of segments) {
      const candidate = path.join(current, segment);
      const entries = readdirSync(current);
      if (!entries.includes(segment)) {
        if (existsSync(candidate)) {
          return failure(
            "provider-unavailable",
            `Provider path case does not match the catalog: ${relative.value}.`,
            "Restore the exact provider path case.",
            undefined,
            candidate,
          );
        }
        return failure(
          "provider-unavailable",
          `Required provider path is missing: ${relative.value}.`,
          "Repair the installed provider and retry.",
          undefined,
          candidate,
        );
      }
      current = candidate;
      if (lstatSync(current).isSymbolicLink()) {
        return failure(
          "symlink-not-allowed",
          `Provider path contains a symbolic link: ${relative.value}.`,
          "Replace the link with provider-owned content.",
          undefined,
          current,
        );
      }
    }
    const real = realpathSync(current);
    if (!isWithinRoot(root, real)) {
      return failure(
        "root-escape",
        `Provider path escapes its approved root: ${relative.value}.`,
        "Restore the provider path beneath its approved root.",
        undefined,
        real,
      );
    }
    const stats = statSync(real);
    if ((kind === "file" && !stats.isFile()) || (kind === "directory" && !stats.isDirectory())) {
      return failure(
        "provider-unavailable",
        `Provider path is not a ${kind}: ${relative.value}.`,
        "Repair the installed provider and retry.",
        undefined,
        real,
      );
    }
    return { ok: true, value: real };
  } catch (error) {
    return failure(
      "filesystem-error",
      `Could not inspect provider path ${relative.value}: ${errorMessage(error)}.`,
      "Repair the installed provider and retry.",
      undefined,
      current,
    );
  }
}

function listSafeFiles(root: string, directory: string): SystemResourceResult<string[]> {
  const files: string[] = [];
  const visit = (current: string): SystemResourceError | null => {
    try {
      for (const entry of readdirSync(current).sort(compareCodeUnits)) {
        const candidate = path.join(current, entry);
        const stats = lstatSync(candidate);
        if (stats.isSymbolicLink()) {
          return {
            code: "symlink-not-allowed",
            message: `Provider inventory contains a symbolic link: ${candidate}.`,
            recovery: "Replace the link with provider-owned content.",
            path: candidate,
          };
        }
        const real = realpathSync(candidate);
        if (!isWithinRoot(root, real)) {
          return {
            code: "root-escape",
            message: `Provider inventory path escapes its approved root: ${candidate}.`,
            recovery: "Restore the resource beneath the provider root.",
            path: candidate,
          };
        }
        if (stats.isDirectory()) {
          const error = visit(real);
          if (error) return error;
        } else if (stats.isFile()) {
          files.push(real);
        }
      }
      return null;
    } catch (error) {
      return {
        code: "filesystem-error",
        message: `Could not inventory provider directory ${current}: ${errorMessage(error)}.`,
        recovery: "Repair the installed provider and retry.",
        path: current,
      };
    }
  };
  const error = visit(directory);
  return error ? { ok: false, error } : { ok: true, value: files };
}

function matchesAny(value: string, patterns: readonly string[]): boolean {
  return patterns.some((pattern) => globPattern(pattern).test(value));
}

function globPattern(pattern: string): RegExp {
  let source = "^";
  for (let index = 0; index < pattern.length; index += 1) {
    const character = pattern[index];
    if (character === "*" && pattern[index + 1] === "*") {
      source += ".*";
      index += 1;
    } else if (character === "*") {
      source += "[^/]*";
    } else if (character === "?") {
      source += "[^/]";
    } else {
      source += character.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
    }
  }
  return new RegExp(`${source}$`);
}

function isWithinRoot(root: string, candidate: string): boolean {
  const relative = path.relative(root, candidate);
  return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative));
}

function compareCodeUnits(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function sha256(content: Uint8Array): string {
  return createHash("sha256").update(content).digest("hex");
}

function toPosix(value: string): string {
  return value.split(path.sep).join("/");
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string" && entry.length > 0);
}

function invalidCatalogType(message: string): SystemResourceResult<never> {
  return failure(
    "provider-catalog-invalid",
    message,
    "Restore a catalog with exactly one valid entry for each peer resource type.",
  );
}

function withCode(
  error: SystemResourceError,
  code: SystemResourceError["code"],
  resourcePath: string,
): SystemResourceResult<never> {
  return { ok: false, error: { ...error, code, path: error.path ?? resourcePath } };
}

function failure(
  code: SystemResourceError["code"],
  message: string,
  recovery: string,
  uri?: string,
  resourcePath?: string,
): SystemResourceResult<never> {
  return { ok: false, error: { code, message, recovery, uri, path: resourcePath } };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
