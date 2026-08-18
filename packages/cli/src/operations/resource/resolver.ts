import { createHash } from "node:crypto";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  realpathSync,
  statSync,
  writeFileSync,
} from "node:fs";
import type { Stats } from "node:fs";
import path from "node:path";
import { createSystemResourceIdentity, parseSystemResourceUri } from "./identity";
import {
  SYSTEM_RESOURCE_ENSURE_APPROVAL,
  SYSTEM_RESOURCE_TYPES,
  SYSTEM_RESOURCE_TYPE_DIRECTORIES,
  type EnsureSystemResourceInput,
  type ListedSystemResource,
  type ResolvedSystemResource,
  type SystemResourceDigestEvidence,
  type SystemResourceDigestSource,
  type SystemResourceEnsure,
  type SystemResourceError,
  type SystemResourceFileFingerprint,
  type SystemResourceList,
  type SystemResourceOrigin,
  type SystemResourceProjectContext,
  type SystemResourceProjectEvidence,
  type SystemResourceProviderEntry,
  type SystemResourceProviderInventory,
  type SystemResourceRead,
  type SystemResourceResult,
} from "./types";

interface ValidatedProjectContext {
  root: string;
  evidenceByUri: Map<string, SystemResourceProjectEvidence>;
  digestEvidenceByPath: Map<string, SystemResourceDigestEvidence>;
}

interface LocalResourceFile {
  path: string;
  content: Uint8Array;
  digest: string;
  digestSource: SystemResourceDigestSource;
  digestEvidence: SystemResourceDigestEvidence;
  trustKey: string;
}

interface LocalPathInspection {
  status: "absent" | "present";
  path: string;
}

interface ValidatedProviderEntry extends Omit<SystemResourceProviderEntry, "readContent"> {
  content: Uint8Array;
}

const SHA256_DIGEST = /^[0-9a-f]{64}$/;
const VERIFIED_LOCAL_DIGEST_LIMIT = 512;
const verifiedLocalDigests = new Map<string, string>();
let localHashObserver: (() => void) | null = null;

/** @internal Test-only control. This function is not exported from the resource core. */
export function __configureSystemResourceDigestTrustForTests(
  observer: (() => void) | null,
): void {
  verifiedLocalDigests.clear();
  localHashObserver = observer;
}

export function resolveSystemResource(
  uri: string,
  provider: SystemResourceProviderInventory,
  project: SystemResourceProjectContext,
  origin: SystemResourceOrigin = "effective",
): SystemResourceResult<ResolvedSystemResource> {
  const identity = parseSystemResourceUri(uri);
  if (!identity.ok) {
    return identity;
  }
  const providerEntries = providerEntryMap(provider);
  if (!providerEntries.ok) {
    return providerEntries;
  }
  const providerEntry = providerEntries.value.get(uri) ?? null;
  if (origin === "installed") {
    if (!providerEntry) {
      return failure(
        "resource-not-found",
        `System resource ${uri} is not available from the installed provider.`,
        "Check the resource URI or restore the installed provider.",
        uri,
      );
    }
    return { ok: true, value: fromProvider(provider, providerEntry) };
  }
  const validatedProject = validateProjectContext(project);
  if (!validatedProject.ok) {
    return validatedProject;
  }
  const projectEvidence = validatedProject.value.evidenceByUri.get(uri) ?? null;
  const localRelativePath = projectionRelativePath(identity.value.type, identity.value.path);
  if (projectEvidence?.localPath && projectEvidence.localPath !== localRelativePath) {
    return failure(
      "provenance-untrusted",
      `Manifest path evidence for ${uri} does not match its canonical projection path.`,
      "Review and repair the manifest provenance before using the local file.",
      uri,
      projectEvidence.localPath,
    );
  }

  const local = inspectLocalPath(validatedProject.value.root, localRelativePath);
  if (!local.ok) {
    return local;
  }
  if (local.value.status === "absent") {
    if (origin === "local" || !providerEntry) {
      return failure(
        "resource-not-found",
        origin === "local"
          ? `System resource ${uri} is not available from the project.`
          : `System resource ${uri} is not available from the project or installed provider.`,
        origin === "local"
          ? "Select a trusted local projection or project override."
          : "Check the resource URI or restore the installed provider.",
        uri,
        local.value.path,
      );
    }
    return { ok: true, value: fromProvider(provider, providerEntry) };
  }

  if (!projectEvidence || !projectEvidence.selected) {
    return failure(
      "provenance-untrusted",
      `Local system resource ${uri} has no trustworthy selected ownership evidence.`,
      "Review the file and record it as a managed projection or explicit project override.",
      uri,
      local.value.path,
    );
  }
  const evidenceValidation = validateEvidence(projectEvidence, provider);
  if (!evidenceValidation.ok) {
    return evidenceValidation;
  }

  const localFile = readLocalFile(
    local.value.path,
    validatedProject.value.digestEvidenceByPath.get(local.value.path),
    uri,
    localDigestTrustScope(
      identity.value,
      local.value.path,
      projectEvidence,
      provider,
      providerEntry,
    ),
  );
  if (!localFile.ok) {
    return localFile;
  }
  if (localFile.value.digest !== projectEvidence.expectedDigest) {
    return failure(
      "resource-conflict",
      `Local content for ${uri} does not match its recorded hash.`,
      "Review the conflict, then preserve it as a project override or replace it with provider content.",
      uri,
      local.value.path,
    );
  }

  if (projectEvidence.ownership === "managed-projection") {
    if (!providerEntry) {
      return failure(
        "provider-unavailable",
        `Managed projection ${uri} has no matching resource in the installed provider.`,
        "Restore the matching provider or review the file as a project override.",
        uri,
        local.value.path,
      );
    }
    if (providerEntry.digest !== projectEvidence.expectedDigest) {
      return failure(
        "resource-conflict",
        `Managed projection ${uri} was recorded for different provider content.`,
        "Use the reviewed refresh flow before replacing local content.",
        uri,
        local.value.path,
      );
    }
    rememberVerifiedLocalDigest(localFile.value.trustKey, localFile.value.digest);
    return {
      ok: true,
      value: fromLocal(
        identity.value,
        "clean-projection",
        "managed-projection",
        providerEntry.mediaType,
        localFile.value,
        provider,
        projectEvidence,
      ),
    };
  }

  rememberVerifiedLocalDigest(localFile.value.trustKey, localFile.value.digest);
  return {
    ok: true,
    value: fromLocal(
      identity.value,
      "explicit-override",
      "project-override",
      providerEntry?.mediaType ?? "application/octet-stream",
      localFile.value,
      providerEntry ? provider : null,
      projectEvidence,
    ),
  };
}

export function listSystemResources(
  provider: SystemResourceProviderInventory,
  project: SystemResourceProjectContext,
  origin: SystemResourceOrigin = "effective",
): SystemResourceResult<SystemResourceList> {
  const providerEntries = providerEntryMap(provider);
  if (!providerEntries.ok) {
    return providerEntries;
  }
  let uris: Set<string>;
  if (origin === "installed") {
    uris = new Set(providerEntries.value.keys());
  } else {
    const validatedProject = validateProjectContext(project);
    if (!validatedProject.ok) {
      return validatedProject;
    }
    const localUris = listProjectedUris(validatedProject.value.root);
    if (!localUris.ok) {
      return localUris;
    }
    uris = new Set([
      ...(origin === "effective" ? providerEntries.value.keys() : []),
      ...validatedProject.value.evidenceByUri.keys(),
      ...localUris.value,
    ]);
  }
  const resources: ListedSystemResource[] = [...uris]
    .sort(compareCodeUnits)
    .map((uri) => {
      const result = resolveSystemResource(uri, provider, project, origin);
      if (!result.ok) {
        return { uri, result };
      }
      return { uri, result: { ok: true, value: withoutContent(result.value) } };
    });
  return { ok: true, value: { resources } };
}

export function readSystemResource(
  uri: string,
  provider: SystemResourceProviderInventory,
  project: SystemResourceProjectContext,
  origin: SystemResourceOrigin = "effective",
): SystemResourceResult<SystemResourceRead> {
  const result = resolveSystemResource(uri, provider, project, origin);
  return result.ok ? { ok: true, value: { resource: result.value } } : result;
}

export function ensureSystemResource(
  input: EnsureSystemResourceInput,
): SystemResourceResult<SystemResourceEnsure> {
  const identity = parseSystemResourceUri(input.uri);
  if (!identity.ok) {
    return identity;
  }
  const entries = providerEntryMap(input.provider);
  if (!entries.ok) {
    return entries;
  }
  const providerEntry = entries.value.get(input.uri);
  if (!providerEntry) {
    return failure(
      "resource-not-found",
      `System resource ${input.uri} is not available from the installed provider.`,
      "Restore the installed provider or select an available resource.",
      input.uri,
    );
  }
  const project = validateProjectContext(input.project);
  if (!project.ok) {
    return project;
  }
  const evidence = project.value.evidenceByUri.get(input.uri);
  if (!evidence || !evidence.selected) {
    return failure(
      "projection-not-selected",
      `System resource ${input.uri} is not selected for local projection.`,
      "Select this resource through setup or reconfiguration before materialization.",
      input.uri,
    );
  }
  if (evidence.ownership !== "managed-projection") {
    return failure(
      "override-not-materializable",
      `System resource ${input.uri} is an explicit project override.`,
      "Use the managed conflict review flow instead of replacing project-owned content.",
      input.uri,
    );
  }
  const evidenceValidation = validateEvidence(evidence, input.provider);
  if (!evidenceValidation.ok) {
    return evidenceValidation;
  }
  if (evidence.expectedDigest !== providerEntry.digest) {
    return failure(
      "resource-conflict",
      `Projection evidence for ${input.uri} does not match the current provider.`,
      "Review and accept the provider refresh before materialization.",
      input.uri,
    );
  }

  const relativePath = projectionRelativePath(identity.value.type, identity.value.path);
  if (evidence.localPath && evidence.localPath !== relativePath) {
    return failure(
      "provenance-untrusted",
      `Projection path evidence for ${input.uri} is not canonical.`,
      "Repair the manifest provenance before materialization.",
      input.uri,
      evidence.localPath,
    );
  }
  const target = inspectLocalPath(project.value.root, relativePath);
  if (!target.ok) {
    return target;
  }
  if (target.value.status === "present") {
    const resolved = resolveSystemResource(input.uri, input.provider, input.project);
    if (!resolved.ok) {
      return resolved;
    }
    return {
      ok: true,
      value: { action: "reused", path: target.value.path, resource: withoutContent(resolved.value) },
    };
  }

  const planned = plannedProjection(input.provider, providerEntry, target.value.path);
  if (input.execution.dryRun) {
    return { ok: true, value: { action: "planned", path: target.value.path, resource: planned } };
  }
  if (!input.execution.writesAllowed) {
    return failure(
      "write-not-authorized",
      `Writing projection ${input.uri} is not authorized.`,
      "Grant write permission and retry the explicit ensure operation.",
      input.uri,
      target.value.path,
    );
  }
  if (!input.execution.approvals.has(SYSTEM_RESOURCE_ENSURE_APPROVAL)) {
    return failure(
      "approval-required",
      `Writing projection ${input.uri} requires reviewed approval.`,
      `Grant the ${SYSTEM_RESOURCE_ENSURE_APPROVAL} approval after review.`,
      input.uri,
      target.value.path,
    );
  }

  const parents = ensureSafeParents(project.value.root, path.dirname(target.value.path));
  if (!parents.ok) {
    return parents;
  }
  try {
    writeFileSync(target.value.path, providerEntry.content, { flag: "wx" });
  } catch (error) {
    if (isAlreadyExistsError(error)) {
      const raced = resolveSystemResource(input.uri, input.provider, input.project);
      if (raced.ok) {
        return {
          ok: true,
          value: { action: "reused", path: target.value.path, resource: withoutContent(raced.value) },
        };
      }
      return raced;
    }
    return failure(
      "filesystem-error",
      `Could not materialize ${input.uri}: ${errorMessage(error)}.`,
      "Repair the project projection path and retry.",
      input.uri,
      target.value.path,
    );
  }

  const resolved = resolveSystemResource(input.uri, input.provider, input.project);
  if (!resolved.ok) {
    return resolved;
  }
  return {
    ok: true,
    value: { action: "created", path: target.value.path, resource: withoutContent(resolved.value) },
  };
}

function providerEntryMap(
  provider: SystemResourceProviderInventory,
): SystemResourceResult<Map<string, ValidatedProviderEntry>> {
  const result = new Map<string, ValidatedProviderEntry>();
  for (const entry of provider.resources) {
    if (
      !isPlainObject(entry) ||
      !isPlainObject(entry.identity) ||
      typeof entry.identity.uri !== "string" ||
      typeof entry.identity.type !== "string" ||
      typeof entry.identity.path !== "string" ||
      typeof entry.mediaType !== "string" ||
      entry.mediaType.length === 0 ||
      typeof entry.digest !== "string" ||
      !SHA256_DIGEST.test(entry.digest) ||
      typeof entry.byteLength !== "number" ||
      !Number.isSafeInteger(entry.byteLength) ||
      entry.byteLength < 0 ||
      typeof entry.sourcePath !== "string" ||
      typeof entry.readContent !== "function"
    ) {
      return failure(
        "provider-catalog-invalid",
        "Provider inventory contains malformed resource metadata.",
        "Reload the installed provider inventory.",
      );
    }
    const parsed = parseSystemResourceUri(entry.identity.uri);
    if (!parsed.ok || parsed.value.type !== entry.identity.type || parsed.value.path !== entry.identity.path) {
      return failure(
        "provider-catalog-invalid",
        `Provider metadata contains an invalid logical identity: ${entry.identity.uri}.`,
        "Restore a valid installed provider inventory.",
        entry.identity.uri,
      );
    }
    if (result.has(entry.identity.uri)) {
      return failure(
        "duplicate-resource-identity",
        `Provider inventory repeats ${entry.identity.uri}.`,
        "Remove the duplicate provider identity.",
        entry.identity.uri,
      );
    }
    let content: Uint8Array;
    try {
      const supplied = entry.readContent();
      if (!(supplied instanceof Uint8Array)) {
        return failure(
          "provider-catalog-invalid",
          `Provider content reader returned invalid bytes for ${entry.identity.uri}.`,
          "Reload the installed provider inventory.",
          entry.identity.uri,
        );
      }
      content = Uint8Array.from(supplied);
    } catch (error) {
      return failure(
        "provider-unavailable",
        `Could not read provider bytes for ${entry.identity.uri}: ${errorMessage(error)}.`,
        "Restore the installed provider and retry.",
        entry.identity.uri,
      );
    }
    if (content.byteLength !== entry.byteLength || sha256(content) !== entry.digest) {
      return failure(
        "provider-catalog-invalid",
        `Provider bytes do not match the inventory digest for ${entry.identity.uri}.`,
        "Reload or restore the installed provider inventory.",
        entry.identity.uri,
      );
    }
    result.set(entry.identity.uri, {
      identity: entry.identity,
      mediaType: entry.mediaType,
      digest: entry.digest,
      byteLength: entry.byteLength,
      sourcePath: entry.sourcePath,
      content,
    });
  }
  return { ok: true, value: result };
}

function validateProjectContext(
  project: SystemResourceProjectContext,
): SystemResourceResult<ValidatedProjectContext> {
  const rawProject = project as unknown;
  if (!isPlainObject(rawProject)) {
    return invalidProjectEvidence("The project resource context must be an object.");
  }
  if (typeof rawProject.projectRoot !== "string" || rawProject.projectRoot.length === 0) {
    return invalidProjectEvidence("The project root must be a non-empty string.");
  }
  if (!Array.isArray(rawProject.evidence)) {
    return invalidProjectEvidence("Project resource evidence must be an array.");
  }
  if (rawProject.digestEvidence !== undefined && !Array.isArray(rawProject.digestEvidence)) {
    return invalidProjectEvidence("Project digest evidence must be an array when supplied.");
  }

  const root = inspectProjectRoot(rawProject.projectRoot);
  if (!root.ok) {
    return root;
  }
  const evidenceByUri = new Map<string, SystemResourceProjectEvidence>();
  for (const rawEntry of rawProject.evidence) {
    if (!isPlainObject(rawEntry)) {
      return invalidProjectEvidence("Each project evidence entry must be an object.");
    }
    if (typeof rawEntry.uri !== "string") {
      return invalidProjectEvidence("Each project evidence entry must contain a resource URI.");
    }
    const parsed = parseSystemResourceUri(rawEntry.uri);
    if (!parsed.ok) {
      return invalidProjectEvidence(parsed.error.message, rawEntry.uri);
    }
    if (evidenceByUri.has(rawEntry.uri)) {
      return failure(
        "duplicate-resource-identity",
        `Project evidence repeats ${rawEntry.uri}.`,
        "Keep one authoritative evidence record for each logical resource.",
        rawEntry.uri,
      );
    }
    if (typeof rawEntry.selected !== "boolean") {
      return invalidProjectEvidence(
        `Project evidence for ${rawEntry.uri} has an invalid selected value.`,
        rawEntry.uri,
      );
    }
    if (rawEntry.ownership !== "managed-projection" && rawEntry.ownership !== "project-override") {
      return invalidProjectEvidence(
        `Project evidence for ${rawEntry.uri} has an invalid ownership value.`,
        rawEntry.uri,
      );
    }
    if (typeof rawEntry.expectedDigest !== "string" || !SHA256_DIGEST.test(rawEntry.expectedDigest)) {
      return invalidProjectEvidence(
        `Project evidence for ${rawEntry.uri} has an invalid SHA-256 digest.`,
        rawEntry.uri,
      );
    }
    if (
      rawEntry.providerImmutableRef !== undefined &&
      (typeof rawEntry.providerImmutableRef !== "string" || rawEntry.providerImmutableRef.length === 0)
    ) {
      return invalidProjectEvidence(
        `Project evidence for ${rawEntry.uri} has an invalid provider reference.`,
        rawEntry.uri,
      );
    }
    if (
      rawEntry.ownership === "managed-projection" &&
      typeof rawEntry.providerImmutableRef !== "string"
    ) {
      return invalidProjectEvidence(
        `Managed projection evidence for ${rawEntry.uri} has no immutable provider reference.`,
        rawEntry.uri,
      );
    }
    const expectedLocalPath = projectionRelativePath(parsed.value.type, parsed.value.path);
    if (
      rawEntry.localPath !== undefined &&
      (typeof rawEntry.localPath !== "string" || rawEntry.localPath !== expectedLocalPath)
    ) {
      return invalidProjectEvidence(
        `Project evidence for ${rawEntry.uri} has a non-canonical local path.`,
        rawEntry.uri,
        typeof rawEntry.localPath === "string" ? rawEntry.localPath : undefined,
      );
    }
    const entry: SystemResourceProjectEvidence = {
      uri: rawEntry.uri,
      selected: rawEntry.selected,
      ownership: rawEntry.ownership,
      expectedDigest: rawEntry.expectedDigest,
      providerImmutableRef: rawEntry.providerImmutableRef,
      localPath: rawEntry.localPath,
    };
    evidenceByUri.set(entry.uri, entry);
  }

  const digestEvidenceByPath = new Map<string, SystemResourceDigestEvidence>();
  for (const rawEvidence of rawProject.digestEvidence ?? []) {
    if (
      !isPlainObject(rawEvidence) ||
      typeof rawEvidence.path !== "string" ||
      !path.isAbsolute(rawEvidence.path) ||
      typeof rawEvidence.digest !== "string" ||
      !SHA256_DIGEST.test(rawEvidence.digest) ||
      !isPlainObject(rawEvidence.fingerprint) ||
      !isValidFingerprint(rawEvidence.fingerprint)
    ) {
      return invalidProjectEvidence("Project digest evidence is malformed.");
    }
    const evidencePath = path.resolve(rawEvidence.path);
    if (!isWithinRoot(root.value, evidencePath)) {
      return invalidProjectEvidence(
        "Project digest evidence points outside the project root.",
        undefined,
        evidencePath,
      );
    }
    if (digestEvidenceByPath.has(evidencePath)) {
      return invalidProjectEvidence(
        "Project digest evidence repeats one local path.",
        undefined,
        evidencePath,
      );
    }
    digestEvidenceByPath.set(evidencePath, {
      path: evidencePath,
      fingerprint: {
        size: rawEvidence.fingerprint.size,
        mtimeMs: rawEvidence.fingerprint.mtimeMs,
        ctimeMs: rawEvidence.fingerprint.ctimeMs,
        device: rawEvidence.fingerprint.device,
        inode: rawEvidence.fingerprint.inode,
      },
      digest: rawEvidence.digest,
    });
  }
  return { ok: true, value: { root: root.value, evidenceByUri, digestEvidenceByPath } };
}

function validateEvidence(
  evidence: SystemResourceProjectEvidence,
  provider: SystemResourceProviderInventory,
): SystemResourceResult<true> {
  if (evidence.ownership === "managed-projection" && !evidence.providerImmutableRef) {
    return failure(
      "provenance-untrusted",
      `Managed projection evidence for ${evidence.uri} has no immutable provider reference.`,
      "Record the exact provider reference before using or refreshing local content.",
      evidence.uri,
    );
  }
  if (
    evidence.providerImmutableRef &&
    evidence.providerImmutableRef !== provider.provider.identity.immutableRef
  ) {
    return failure(
      "provenance-untrusted",
      `Project evidence for ${evidence.uri} names a different provider.`,
      "Review the provider change before using or refreshing local content.",
      evidence.uri,
    );
  }
  return { ok: true, value: true };
}

function inspectProjectRoot(rootInput: string): SystemResourceResult<string> {
  const absolute = path.resolve(rootInput);
  try {
    if (!existsSync(absolute)) {
      return failure(
        "unsafe-root",
        "The project root does not exist.",
        "Use an existing real project directory.",
        undefined,
        absolute,
      );
    }
    if (lstatSync(absolute).isSymbolicLink()) {
      return failure(
        "symlink-not-allowed",
        "The project root is a symbolic link.",
        "Use the real project directory.",
        undefined,
        absolute,
      );
    }
    const real = realpathSync(absolute);
    if (!statSync(real).isDirectory()) {
      return failure(
        "unsafe-root",
        "The project root is not a directory.",
        "Use an existing real project directory.",
        undefined,
        absolute,
      );
    }
    return { ok: true, value: real };
  } catch (error) {
    return failure(
      "filesystem-error",
      `Could not inspect the project root: ${errorMessage(error)}.`,
      "Repair the project root and retry.",
      undefined,
      absolute,
    );
  }
}

function inspectLocalPath(root: string, relativePath: string): SystemResourceResult<LocalPathInspection> {
  const segments = relativePath.split("/");
  let current = root;
  try {
    for (let index = 0; index < segments.length; index += 1) {
      const segment = segments[index];
      const candidate = path.join(current, segment);
      const entries = readdirSync(current);
      if (!entries.includes(segment)) {
        if (existsSync(candidate)) {
          return failure(
            "provenance-untrusted",
            `Projection path case does not match its resource URI: ${relativePath}.`,
            "Rename the projection path to match the exact canonical URI case.",
            undefined,
            candidate,
          );
        }
        return {
          ok: true,
          value: { status: "absent", path: path.join(candidate, ...segments.slice(index + 1)) },
        };
      }
      current = candidate;
      if (lstatSync(current).isSymbolicLink()) {
        return failure(
          "symlink-not-allowed",
          `Projection path contains a symbolic link: ${relativePath}.`,
          "Replace the link with reviewed local content beneath the project root.",
          undefined,
          current,
        );
      }
    }
    const real = realpathSync(current);
    if (!isWithinRoot(root, real)) {
      return failure(
        "root-escape",
        `Projection path escapes the project root: ${relativePath}.`,
        "Keep projection content beneath the approved project root.",
        undefined,
        real,
      );
    }
    if (!statSync(real).isFile()) {
      return failure(
        "provenance-untrusted",
        `Projection path is not a regular file: ${relativePath}.`,
        "Review and repair the projection path.",
        undefined,
        real,
      );
    }
    return { ok: true, value: { status: "present", path: real } };
  } catch (error) {
    return failure(
      "filesystem-error",
      `Could not inspect projection path ${relativePath}: ${errorMessage(error)}.`,
      "Review and repair the projection path.",
      undefined,
      current,
    );
  }
}

function readLocalFile(
  filePath: string,
  cached: SystemResourceDigestEvidence | undefined,
  uri: string,
  trustScope: string,
): SystemResourceResult<LocalResourceFile> {
  try {
    const fingerprint = fingerprintOf(statSync(filePath));
    const trustKey = localDigestTrustKey(trustScope, fingerprint);
    const verifiedDigest = verifiedLocalDigests.get(trustKey);
    const canReuse = Boolean(
      cached &&
      cached.path === filePath &&
      sameFingerprint(cached.fingerprint, fingerprint) &&
      cached.digest === verifiedDigest
    );
    const content = readFileSync(filePath);
    const afterReadFingerprint = fingerprintOf(statSync(filePath));
    if (
      !sameFingerprint(fingerprint, afterReadFingerprint) ||
      content.byteLength !== fingerprint.size
    ) {
      return failure(
        "resource-conflict",
        `Local content for ${uri} changed while it was read.`,
        "Retry after the local file is stable.",
        uri,
        filePath,
      );
    }
    const digest = canReuse && verifiedDigest ? verifiedDigest : sha256Local(content);
    const digestSource: SystemResourceDigestSource = canReuse ? "reused" : "computed";
    return {
      ok: true,
      value: {
        path: filePath,
        content,
        digest,
        digestSource,
        digestEvidence: { path: filePath, fingerprint, digest },
        trustKey,
      },
    };
  } catch (error) {
    return failure(
      "filesystem-error",
      `Could not read local resource ${uri}: ${errorMessage(error)}.`,
      "Repair the local file and retry.",
      uri,
      filePath,
    );
  }
}

function listProjectedUris(root: string): SystemResourceResult<Set<string>> {
  const uris = new Set<string>();
  for (const type of SYSTEM_RESOURCE_TYPES) {
    const relativeRoot = `.make-docs/system/${SYSTEM_RESOURCE_TYPE_DIRECTORIES[type]}`;
    const inspected = inspectOptionalDirectory(root, relativeRoot);
    if (!inspected.ok) {
      return inspected;
    }
    if (!inspected.value) continue;
    const files = listSafeProjectFiles(root, inspected.value);
    if (!files.ok) return files;
    for (const file of files.value) {
      const relative = path.relative(inspected.value, file).split(path.sep).join("/");
      const identity = createSystemResourceIdentity(type, relative);
      if (!identity.ok) return identity;
      uris.add(identity.value.uri);
    }
  }
  return { ok: true, value: uris };
}

function inspectOptionalDirectory(root: string, relativePath: string): SystemResourceResult<string | null> {
  const segments = relativePath.split("/");
  let current = root;
  try {
    for (const segment of segments) {
      const candidate = path.join(current, segment);
      const entries = readdirSync(current);
      if (!entries.includes(segment)) {
        if (existsSync(candidate)) {
          return failure(
            "provenance-untrusted",
            `Projection directory case does not match its canonical path: ${relativePath}.`,
            "Rename the projection directory to use the exact canonical case.",
            undefined,
            candidate,
          );
        }
        return { ok: true, value: null };
      }
      current = candidate;
      if (lstatSync(current).isSymbolicLink()) {
        return failure(
          "symlink-not-allowed",
          `Projection directory contains a symbolic link: ${relativePath}.`,
          "Replace the link with a real directory beneath the project root.",
          undefined,
          current,
        );
      }
    }
    const real = realpathSync(current);
    if (!isWithinRoot(root, real)) {
      return failure(
        "root-escape",
        `Projection directory escapes the project root: ${relativePath}.`,
        "Keep projection content beneath the approved project root.",
        undefined,
        real,
      );
    }
    if (!statSync(real).isDirectory()) {
      return failure(
        "provenance-untrusted",
        `Projection directory path is not a directory: ${relativePath}.`,
        "Review and repair the projection path.",
        undefined,
        real,
      );
    }
    return { ok: true, value: real };
  } catch (error) {
    return failure(
      "filesystem-error",
      `Could not inspect projection directory ${relativePath}: ${errorMessage(error)}.`,
      "Review and repair the projection path.",
      undefined,
      current,
    );
  }
}

function listSafeProjectFiles(root: string, directory: string): SystemResourceResult<string[]> {
  const files: string[] = [];
  const visit = (current: string): SystemResourceError | null => {
    try {
      for (const entry of readdirSync(current).sort(compareCodeUnits)) {
        const candidate = path.join(current, entry);
        const stats = lstatSync(candidate);
        if (stats.isSymbolicLink()) {
          return {
            code: "symlink-not-allowed",
            message: `Projection inventory contains a symbolic link: ${candidate}.`,
            recovery: "Replace the link with reviewed local content.",
            path: candidate,
          };
        }
        const real = realpathSync(candidate);
        if (!isWithinRoot(root, real)) {
          return {
            code: "root-escape",
            message: `Projection inventory path escapes the project root: ${candidate}.`,
            recovery: "Keep projection content beneath the project root.",
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
        message: `Could not list projection directory ${current}: ${errorMessage(error)}.`,
        recovery: "Review and repair the projection directory.",
        path: current,
      };
    }
  };
  const error = visit(directory);
  return error ? { ok: false, error } : { ok: true, value: files };
}

function ensureSafeParents(root: string, targetDirectory: string): SystemResourceResult<true> {
  const relative = path.relative(root, targetDirectory);
  if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    return failure(
      "root-escape",
      "Projection target escapes the project root.",
      "Keep projection content beneath the project root.",
      undefined,
      targetDirectory,
    );
  }
  let current = root;
  try {
    for (const segment of relative.split(path.sep).filter(Boolean)) {
      const candidate = path.join(current, segment);
      const entries = readdirSync(current);
      if (!entries.includes(segment)) {
        if (existsSync(candidate)) {
          return failure(
            "provenance-untrusted",
            "Projection parent case does not match its canonical path.",
            "Rename the projection parent to use the exact canonical case.",
            undefined,
            candidate,
          );
        }
        mkdirSync(candidate);
      }
      current = candidate;
      if (lstatSync(current).isSymbolicLink()) {
        return failure(
          "symlink-not-allowed",
          "Projection parent contains a symbolic link.",
          "Replace the link with a real directory beneath the project root.",
          undefined,
          current,
        );
      }
      const real = realpathSync(current);
      if (!isWithinRoot(root, real) || !statSync(real).isDirectory()) {
        return failure(
          "root-escape",
          "Projection parent is outside the approved project root.",
          "Keep projection content beneath the project root.",
          undefined,
          real,
        );
      }
    }
    return { ok: true, value: true };
  } catch (error) {
    return failure(
      "filesystem-error",
      `Could not create projection parents: ${errorMessage(error)}.`,
      "Review and repair the project projection path.",
      undefined,
      current,
    );
  }
}

function fromProvider(
  provider: SystemResourceProviderInventory,
  entry: ValidatedProviderEntry,
): ResolvedSystemResource {
  return {
    identity: entry.identity,
    state: "provider-only",
    source: "provider",
    mediaType: entry.mediaType,
    digest: entry.digest,
    byteLength: entry.byteLength,
    provenance: {
      source: "provider",
      provider: provider.provider.identity,
      projectOwnership: null,
      localPath: null,
      expectedDigest: entry.digest,
      actualDigest: entry.digest,
      digestSource: "reused",
    },
    content: Uint8Array.from(entry.content),
  };
}

function fromLocal(
  identity: ResolvedSystemResource["identity"],
  state: ResolvedSystemResource["state"],
  source: "managed-projection" | "project-override",
  mediaType: string,
  local: LocalResourceFile,
  provider: SystemResourceProviderInventory | null,
  evidence: SystemResourceProjectEvidence,
): ResolvedSystemResource {
  return {
    identity,
    state,
    source,
    mediaType,
    digest: local.digest,
    byteLength: local.content.byteLength,
    provenance: {
      source,
      provider: provider?.provider.identity ?? null,
      projectOwnership: evidence.ownership,
      localPath: local.path,
      expectedDigest: evidence.expectedDigest,
      actualDigest: local.digest,
      digestSource: local.digestSource,
    },
    content: local.content,
    digestEvidence: local.digestEvidence,
  };
}

function plannedProjection(
  provider: SystemResourceProviderInventory,
  entry: ValidatedProviderEntry,
  localPath: string,
): Omit<ResolvedSystemResource, "content"> {
  return {
    identity: entry.identity,
    state: "clean-projection",
    source: "managed-projection",
    mediaType: entry.mediaType,
    digest: entry.digest,
    byteLength: entry.byteLength,
    provenance: {
      source: "managed-projection",
      provider: provider.provider.identity,
      projectOwnership: "managed-projection",
      localPath,
      expectedDigest: entry.digest,
      actualDigest: entry.digest,
      digestSource: "reused",
    },
  };
}

function withoutContent(resource: ResolvedSystemResource): Omit<ResolvedSystemResource, "content"> {
  const { content: _content, ...metadata } = resource;
  return metadata;
}

function projectionRelativePath(type: (typeof SYSTEM_RESOURCE_TYPES)[number], resourcePath: string): string {
  return `.make-docs/system/${SYSTEM_RESOURCE_TYPE_DIRECTORIES[type]}/${resourcePath}`;
}

function localDigestTrustScope(
  identity: ResolvedSystemResource["identity"],
  localPath: string,
  evidence: SystemResourceProjectEvidence,
  provider: SystemResourceProviderInventory,
  providerEntry: ValidatedProviderEntry | null,
): string {
  return JSON.stringify([
    identity.uri,
    identity.type,
    identity.path,
    localPath,
    evidence.uri,
    evidence.selected,
    evidence.ownership,
    evidence.expectedDigest,
    evidence.providerImmutableRef ?? null,
    evidence.localPath ?? null,
    provider.provider.identity.packageName,
    provider.provider.identity.version,
    provider.provider.identity.immutableRef,
    provider.provider.identity.source,
    provider.provider.inventoryDigest,
    providerEntry?.digest ?? null,
    providerEntry?.byteLength ?? null,
    providerEntry?.mediaType ?? null,
    providerEntry?.sourcePath ?? null,
  ]);
}

function localDigestTrustKey(
  trustScope: string,
  fingerprint: SystemResourceFileFingerprint,
): string {
  return JSON.stringify([
    trustScope,
    fingerprint.size,
    fingerprint.mtimeMs,
    fingerprint.ctimeMs,
    fingerprint.device,
    fingerprint.inode,
  ]);
}

function rememberVerifiedLocalDigest(trustKey: string, digest: string): void {
  verifiedLocalDigests.delete(trustKey);
  verifiedLocalDigests.set(trustKey, digest);
  while (verifiedLocalDigests.size > VERIFIED_LOCAL_DIGEST_LIMIT) {
    const oldest = verifiedLocalDigests.keys().next().value as string | undefined;
    if (!oldest) break;
    verifiedLocalDigests.delete(oldest);
  }
}

function fingerprintOf(stats: Stats): SystemResourceFileFingerprint {
  return {
    size: stats.size,
    mtimeMs: stats.mtimeMs,
    ctimeMs: stats.ctimeMs,
    device: stats.dev,
    inode: stats.ino,
  };
}

function sameFingerprint(
  left: SystemResourceFileFingerprint,
  right: SystemResourceFileFingerprint,
): boolean {
  return (
    left.size === right.size &&
    left.mtimeMs === right.mtimeMs &&
    left.ctimeMs === right.ctimeMs &&
    left.device === right.device &&
    left.inode === right.inode
  );
}

function isValidFingerprint(value: Record<string, unknown>): value is Record<string, number> & SystemResourceFileFingerprint {
  return (
    isNonNegativeSafeInteger(value.size) &&
    isFiniteNumber(value.mtimeMs) &&
    isFiniteNumber(value.ctimeMs) &&
    isNonNegativeSafeInteger(value.device) &&
    isNonNegativeSafeInteger(value.inode)
  );
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isNonNegativeSafeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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

function sha256Local(content: Uint8Array): string {
  localHashObserver?.();
  return sha256(content);
}

function isAlreadyExistsError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "EEXIST";
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

function invalidProjectEvidence(
  message: string,
  uri?: string,
  resourcePath?: string,
): SystemResourceResult<never> {
  return failure(
    "invalid-project-evidence",
    message,
    "Repair the project resource evidence before resolving system resources.",
    uri,
    resourcePath,
  );
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
