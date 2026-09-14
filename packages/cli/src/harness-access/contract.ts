import { createHash } from "node:crypto";
import { lstatSync, readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  getConformanceTupleEntry,
  runQualifiesForConformanceValidation,
  type ConformanceTupleRegistry,
} from "../conformance/registry";
import type { ConformanceSupportTuple } from "../conformance/tuple";

export type HarnessId = "codex" | "claude-code";
export type HarnessScope = "machine" | "project";
export type HarnessConnectionMethod = "mcp" | "command-rules" | "permission-rules";
export type HarnessMethodSelection = "none" | HarnessConnectionMethod;
export type HarnessAccessState =
  | "current"
  | "missing"
  | "drifted"
  | "unsupported"
  | "blocked";

export type HarnessNativeFormat =
  | "codex-mcp-toml"
  | "codex-command-rules"
  | "claude-mcp-json"
  | "claude-permission-json";

export interface VerifiedExecutableIdentity {
  kind: "make-docs";
  path: string;
  sha256: string;
  size: number;
  productMarker: "@brucewaynedecoy/make-docs:package-bin";
  packageName: "@brucewaynedecoy/make-docs";
  packageVersion: string;
  packageRoot: string;
  binRelativePath: string;
}

export const HARNESS_CALLER_IDENTITY_ENV = "MAKE_DOCS_HARNESS_CALLER_IDENTITY" as const;

/**
 * Launch identity emitted by a first-party MCP native entry. This value is an
 * input to receipt verification. It does not grant access by itself.
 */
export interface HarnessCallerIdentity {
  schemaVersion: 1;
  kind: "make-docs-harness-caller";
  adapterId: string;
  adapterVersion: number;
  harnessId: HarnessId;
  connectionMethod: HarnessConnectionMethod;
  scope: "machine";
  root: string;
  executable: VerifiedExecutableIdentity;
}

export interface VerifyExecutableInput {
  executablePath: string;
  expectedSha256?: string;
}

export interface VerifyReviewedPackageExecutableInput extends VerifyExecutableInput {
  packageRoot: string;
}

export interface HarnessCommandRule {
  id: string;
  commandPrefix: readonly string[];
  operationIds: readonly string[];
  access: {
    store: "none" | "read" | "write";
    project: "none" | "read" | "write";
    hostConfig: "none";
  };
}

/**
 * The composition root supplies the operation registry through this leaf contract.
 * This keeps the adapter independent from registry module assembly while still
 * requiring the registry to validate every native command rule.
 */
export interface HarnessCommandRuleAuthority {
  list(): readonly HarnessCommandRule[];
  validate(rules: readonly HarnessCommandRule[]): readonly HarnessCommandRule[];
}

export interface HarnessMethodDefinition {
  id: HarnessConnectionMethod;
  scopes: readonly HarnessScope[];
  nativeFormat: HarnessNativeFormat;
  requiresExecutable: true;
  requiresCommandRules: boolean;
  nativeFile(scope: HarnessScope): string;
  admittedOperations: "operation-registry-derived";
  accessRequirements: "operation-registry-derived";
  implementationState: "implemented";
  publicSupportClaim: false;
  conformanceState: "not-run";
}

export interface HarnessDetectionResult {
  adapterId: string;
  harnessId: HarnessId;
  scope: HarnessScope;
  state: "detected" | "not-detected" | "blocked";
  evidence: readonly string[];
  reason?: string;
}

export interface HarnessConformanceIdentity {
  adapterId: string;
  adapterVersion: number;
  harnessId: HarnessId;
  connectionMethod: HarnessConnectionMethod;
  surface: "mcp" | "cli-command-rules" | "cli-permission-rules";
}

export type HarnessSupportUnavailableReason =
  | "adapter-not-admitted"
  | "method-not-admitted"
  | "tuple-not-registered"
  | "runtime-facts-unavailable"
  | "tuple-not-validated"
  | "qualifying-result-missing"
  | "make-docs-version-mismatch"
  | "executable-digest-mismatch"
  | "behavior-digest-mismatch"
  | "harness-version-mismatch";

export interface HarnessSupportFacts {
  registry: ConformanceTupleRegistry;
  tuple: ConformanceSupportTuple;
  makeDocsVersion: string;
  executableDigest: string;
  behaviorDigest: string;
  harnessVersion: string;
}

export interface ResolvedHarnessMethodSupport {
  state: "not-run" | "experimental" | "conformance-validated" | "unsupported";
  selectable: boolean;
  publicSupportClaim: boolean;
  reason: string;
  unavailableReason: HarnessSupportUnavailableReason | null;
  nextAction: string | null;
  caveats: readonly string[];
}

export type NativeEntryValue =
  | null
  | boolean
  | number
  | string
  | NativeEntryValue[]
  | { [key: string]: NativeEntryValue };

export interface HarnessReceiptEntry {
  path: string;
  entryId: string;
  ownership: "make-docs";
  beforeEntryFingerprint: string | null;
  beforeFileFingerprint: string | null;
  beforeValue: NativeEntryValue | null;
  entryFingerprint: string;
  fileFingerprint: string;
  value: NativeEntryValue;
}

export interface HarnessAccessReceipt {
  schemaVersion: 1;
  operationId: string;
  adapterId: string;
  adapterVersion: number;
  harnessId: HarnessId;
  connectionMethod: HarnessConnectionMethod;
  scope: HarnessScope;
  executable: VerifiedExecutableIdentity;
  appliedVersion: string;
  verifiedAt: string;
  entries: readonly HarnessReceiptEntry[];
  result: "verified";
  verificationResult: "passed";
  driftState: "current";
  recoveryStatus: "complete";
}

export interface HarnessNativeChange {
  path: string;
  entryId: string;
  action: "create" | "update" | "remove" | "none";
  ownership: "missing" | "make-docs-owned" | "unverified";
  beforeFileFingerprint: string | null;
  afterFileFingerprint: string | null;
  beforeEntryValue: NativeEntryValue | null;
  beforeEntryFingerprint: string | null;
  afterEntryFingerprint: string | null;
  afterEntryValue: NativeEntryValue | null;
  blockedReason?: string;
}

export interface HarnessAccessPlan {
  schemaVersion: 1;
  kind: "apply" | "remove";
  adapterId: string;
  adapterVersion: number;
  harnessId: HarnessId;
  connectionMethod: HarnessConnectionMethod;
  scope: HarnessScope;
  root: string;
  executable: VerifiedExecutableIdentity;
  state: HarnessAccessState;
  changes: readonly HarnessNativeChange[];
  reviewFingerprint: string;
  nextAction: string;
}

export interface HarnessPlanInput {
  method: HarnessConnectionMethod;
  scope: HarnessScope;
  root: string;
  executable: VerifiedExecutableIdentity;
  commandRules?: readonly HarnessCommandRule[];
  commandRuleAuthority?: HarnessCommandRuleAuthority;
  receipt?: HarnessAccessReceipt;
}

export interface HarnessRemoveInput {
  method: HarnessConnectionMethod;
  scope: HarnessScope;
  root: string;
  executable: VerifiedExecutableIdentity;
  receipt: HarnessAccessReceipt;
}

export interface HarnessVerifyInput extends HarnessPlanInput {}

export interface HarnessVerificationResult {
  adapterId: string;
  adapterVersion: number;
  harnessId: HarnessId;
  connectionMethod: HarnessConnectionMethod;
  scope: HarnessScope;
  state: HarnessAccessState;
  entries: readonly HarnessReceiptEntry[];
  reason?: string;
}

export interface HarnessApplyResult {
  changedPaths: readonly string[];
  verification: HarnessVerificationResult;
  receipt: HarnessAccessReceipt;
}

export interface HarnessRemovalResult {
  changedPaths: readonly string[];
  verification: HarnessVerificationResult;
}

export interface HarnessAdapter {
  id: string;
  version: number;
  harnessId: HarnessId;
  displayName: string;
  projectRouterFiles: readonly string[];
  skillRoots: readonly string[];
  methods: readonly HarnessMethodDefinition[];
  detect(input: { scope: HarnessScope; root: string }): HarnessDetectionResult;
  plan(input: HarnessPlanInput): HarnessAccessPlan;
  apply(input: {
    plan: HarnessAccessPlan;
    approved: boolean;
    operationId: string;
    appliedVersion: string;
    verifiedAt?: string;
  }): HarnessApplyResult;
  applyRemoval(input: {
    plan: HarnessAccessPlan;
    approved: boolean;
  }): HarnessRemovalResult;
  verify(input: HarnessVerifyInput): HarnessVerificationResult;
  planRemoval(input: HarnessRemoveInput): HarnessAccessPlan;
  conformanceIdentity(method: HarnessConnectionMethod): HarnessConformanceIdentity;
}

const FORBIDDEN_EXECUTABLE_NAMES = new Set([
  "bash",
  "bun",
  "cmd",
  "deno",
  "node",
  "npm",
  "npx",
  "pnpm",
  "powershell",
  "pwsh",
  "sh",
  "yarn",
  "zsh",
]);

const FORBIDDEN_COMMAND_WORDS = new Set([
  "backup",
  "remove",
  "setup",
  "uninstall",
  "update",
]);

const SAFE_COMMAND_WORD = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;
const SHA256 = /^[0-9a-f]{64}$/;
const PACKAGE_NAME = "@brucewaynedecoy/make-docs" as const;
const PRODUCT_MARKER = "@brucewaynedecoy/make-docs:package-bin" as const;
const reviewedPackageExecutableIdentities = new WeakSet<VerifiedExecutableIdentity>();
export function sha256(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

export function verifyMakeDocsExecutable(
  input: VerifyExecutableInput,
): VerifiedExecutableIdentity {
  return verifyExecutableAgainstPackage(input, resolvePackagedExecutableIdentity());
}

/**
 * Verify a reviewed packed candidate from a maintainer-only disposable lab.
 * Production setup continues to use `verifyMakeDocsExecutable`, which binds
 * the executable to the package that is running the setup process.
 */
export function verifyReviewedMakeDocsPackageExecutable(
  input: VerifyReviewedPackageExecutableInput,
): VerifiedExecutableIdentity {
  const identity = verifyExecutableAgainstPackage(
    input,
    resolveReviewedPackageExecutableIdentity(input.packageRoot),
  );
  reviewedPackageExecutableIdentities.add(identity);
  return identity;
}

/** Recheck one identity under the authority that first verified it. */
export function reverifyMakeDocsExecutableIdentity(
  executable: VerifiedExecutableIdentity,
): VerifiedExecutableIdentity {
  return reviewedPackageExecutableIdentities.has(executable)
    ? verifyExecutableAgainstPackage(
        { executablePath: executable.path, expectedSha256: executable.sha256 },
        resolveReviewedPackageExecutableIdentity(executable.packageRoot),
      )
    : verifyMakeDocsExecutable({
        executablePath: executable.path,
        expectedSha256: executable.sha256,
      });
}

function verifyExecutableAgainstPackage(
  input: VerifyExecutableInput,
  packaged: ReturnType<typeof resolvePackagedExecutableIdentity>,
): VerifiedExecutableIdentity {
  if (!path.isAbsolute(input.executablePath)) {
    throw new Error("The Make Docs executable path must be absolute.");
  }
  if (input.expectedSha256 !== undefined && !SHA256.test(input.expectedSha256)) {
    throw new Error("The expected Make Docs executable fingerprint must be a SHA-256 digest.");
  }

  const stat = lstatSync(input.executablePath);
  if (stat.isSymbolicLink()) {
    throw new Error("The Make Docs executable path must not be a symbolic link.");
  }
  if (!stat.isFile()) {
    throw new Error("The Make Docs executable path must name a regular file.");
  }
  if (process.platform !== "win32" && (stat.mode & 0o111) === 0) {
    throw new Error("The Make Docs executable file is not executable.");
  }

  const executableName = path.basename(input.executablePath).toLowerCase().replace(/\.exe$/, "");
  if (FORBIDDEN_EXECUTABLE_NAMES.has(executableName)) {
    throw new Error(`A package runner or shell cannot be used as the Make Docs executable: ${executableName}.`);
  }

  const bytes = readFileSync(input.executablePath);
  const actualSha256 = sha256(bytes);
  if (input.expectedSha256 !== undefined && actualSha256 !== input.expectedSha256) {
    throw new Error("The Make Docs executable fingerprint does not match the reviewed executable.");
  }

  const actualPath = realpathSync(input.executablePath);
  if (actualPath !== packaged.path) {
    throw new Error("The executable is not the exact Make Docs package binary for this installation.");
  }

  return {
    kind: "make-docs",
    path: packaged.path,
    sha256: actualSha256,
    size: bytes.byteLength,
    productMarker: PRODUCT_MARKER,
    packageName: PACKAGE_NAME,
    packageVersion: packaged.packageVersion,
    packageRoot: packaged.packageRoot,
    binRelativePath: packaged.binRelativePath,
  };
}

function resolveReviewedPackageExecutableIdentity(packageRoot: string): {
  path: string;
  packageVersion: string;
  packageRoot: string;
  binRelativePath: string;
} {
  if (!path.isAbsolute(packageRoot)) {
    throw new Error("The reviewed Make Docs package root must be absolute.");
  }
  const rootStat = lstatSync(packageRoot);
  if (rootStat.isSymbolicLink() || !rootStat.isDirectory()) {
    throw new Error("The reviewed Make Docs package root must be a real directory.");
  }
  const resolvedRoot = realpathSync(packageRoot);
  const manifestPath = path.join(resolvedRoot, "package.json");
  const manifestStat = lstatSync(manifestPath);
  if (manifestStat.isSymbolicLink() || !manifestStat.isFile()) {
    throw new Error("The reviewed Make Docs package manifest must be a real file.");
  }
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Record<string, unknown>;
  const bin = manifest.bin;
  if (
    manifest.name !== PACKAGE_NAME ||
    typeof manifest.version !== "string" ||
    !manifest.version.trim() ||
    !bin ||
    typeof bin !== "object" ||
    typeof (bin as Record<string, unknown>)["make-docs"] !== "string"
  ) {
    throw new Error("The reviewed package is not an exact Make Docs package.");
  }
  const binRelativePath = (bin as Record<string, string>)["make-docs"];
  const executablePath = realpathSync(path.resolve(resolvedRoot, binRelativePath));
  const relative = path.relative(resolvedRoot, executablePath);
  if (relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error("The reviewed Make Docs package binary escapes its package root.");
  }
  return {
    path: executablePath,
    packageVersion: manifest.version,
    packageRoot: resolvedRoot,
    binRelativePath,
  };
}

function resolvePackagedExecutableIdentity(): {
  path: string;
  packageVersion: string;
  packageRoot: string;
  binRelativePath: string;
} {
  let candidate = path.dirname(fileURLToPath(import.meta.url));
  for (let depth = 0; depth < 5; depth += 1) {
    const manifestPath = path.join(candidate, "package.json");
    try {
      const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Record<string, unknown>;
      const bin = manifest.bin;
      if (
        manifest.name === PACKAGE_NAME &&
        typeof manifest.version === "string" &&
        manifest.version.trim() &&
        bin &&
        typeof bin === "object" &&
        typeof (bin as Record<string, unknown>)["make-docs"] === "string"
      ) {
        const binRelativePath = (bin as Record<string, string>)["make-docs"];
        const packageRoot = realpathSync(candidate);
        const executablePath = realpathSync(path.resolve(packageRoot, binRelativePath));
        const relative = path.relative(packageRoot, executablePath);
        if (relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
          throw new Error("The Make Docs package binary escapes its package root.");
        }
        return {
          path: executablePath,
          packageVersion: manifest.version,
          packageRoot,
          binRelativePath,
        };
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    const parent = path.dirname(candidate);
    if (parent === candidate) break;
    candidate = parent;
  }
  throw new Error("The active Make Docs package identity could not be proved.");
}

export function validateHarnessCommandRules(
  rules: readonly HarnessCommandRule[] | undefined,
  authority?: HarnessCommandRuleAuthority,
): readonly HarnessCommandRule[] {
  if (!rules || rules.length === 0) {
    throw new Error("A command-rule method needs at least one registry-derived command prefix.");
  }
  if (!authority) {
    throw new Error("A command-rule method needs the operation registry validation authority.");
  }

  const ids = new Set<string>();
  const prefixes = new Set<string>();
  for (const rule of rules) {
    if (!rule.id.trim() || ids.has(rule.id)) {
      throw new Error(`Command-rule identifiers must be non-empty and unique: ${rule.id || "<empty>"}.`);
    }
    ids.add(rule.id);
    if (rule.commandPrefix.length < 2) {
      throw new Error(`Command rule ${rule.id} is too broad. Use a command and subcommand.`);
    }
    if (rule.operationIds.length === 0) {
      throw new Error(`Command rule ${rule.id} has no admitted operation.`);
    }
    if (isAdministrativeCommandRule(rule)) {
      throw new Error(`Command rule ${rule.id} cannot approve lifecycle or recovery administration.`);
    }
    if (rule.access.hostConfig !== "none") {
      throw new Error(`Command rule ${rule.id} cannot approve host-configuration writes.`);
    }
    for (const word of rule.commandPrefix) {
      if (!SAFE_COMMAND_WORD.test(word)) {
        throw new Error(`Command rule ${rule.id} contains an unsafe command word: ${word}.`);
      }
      if (FORBIDDEN_COMMAND_WORDS.has(word.toLowerCase())) {
        throw new Error(`Command rule ${rule.id} cannot approve ${word}.`);
      }
      if (FORBIDDEN_EXECUTABLE_NAMES.has(word.toLowerCase().replace(/\.exe$/, ""))) {
        throw new Error(`Command rule ${rule.id} cannot approve a wrapper or package runner: ${word}.`);
      }
      if (word.toLowerCase() === "make-docs") {
        throw new Error(`Command rule ${rule.id} contains an extra executable token.`);
      }
    }
    const prefixKey = rule.commandPrefix.join("\0");
    if (prefixes.has(prefixKey)) {
      throw new Error(`Command prefixes must be unique: ${rule.commandPrefix.join(" ")}.`);
    }
    prefixes.add(prefixKey);
  }

  authority.validate(rules);
  const registryRules = authority.list();
  const candidates = new Map(registryRules.map(rule => [rule.id, rule]));
  if (registryRules.length !== rules.length || candidates.size !== registryRules.length) {
    throw new Error("Command rules must contain every exact operation-registry candidate once.");
  }
  for (const rule of rules) {
    const candidate = candidates.get(rule.id);
    if (!candidate) {
      throw new Error(`Command rule ${rule.id} is not an exact operation-registry candidate.`);
    }
    if (
      rule.operationIds.length !== 1 ||
      rule.operationIds[0] !== candidate.operationIds[0] ||
      rule.commandPrefix.length !== candidate.commandPrefix.length ||
      rule.commandPrefix.some((word, index) => word !== candidate.commandPrefix[index]) ||
      rule.access.store !== candidate.access.store ||
      rule.access.project !== candidate.access.project ||
      rule.access.hostConfig !== candidate.access.hostConfig
    ) {
      throw new Error(`Command rule ${rule.id} does not match its exact operation-registry command and access declaration.`);
    }
  }
  return Object.freeze([...rules]);
}

export function listBoundedHarnessCommandRules(
  authority?: HarnessCommandRuleAuthority,
): readonly HarnessCommandRule[] {
  if (!authority) return Object.freeze([]);
  return validateHarnessCommandRules(authority.list(), authority);
}

function isAdministrativeCommandRule(rule: HarnessCommandRule): boolean {
  return rule.operationIds.some(
    operationId =>
      operationId.startsWith("lifecycle.") ||
      operationId === "project.state.recover",
  );
}

export function canonicalJson(value: NativeEntryValue): string {
  return JSON.stringify(sortJson(value));
}

export function fingerprintEntry(value: NativeEntryValue): string {
  return sha256(canonicalJson(value));
}

export function encodeHarnessCallerIdentity(identity: HarnessCallerIdentity): string {
  assertHarnessCallerIdentityShape(identity);
  return canonicalJson(identity as unknown as NativeEntryValue);
}

/** Parse the marker shape only. The caller must still verify its receipt and package identity. */
export function parseHarnessCallerIdentity(raw: string): HarnessCallerIdentity {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("The harness caller identity is not valid JSON.");
  }
  assertHarnessCallerIdentityShape(parsed);
  return Object.freeze({
    ...parsed,
    executable: Object.freeze({ ...parsed.executable }),
  });
}

function assertHarnessCallerIdentityShape(value: unknown): asserts value is HarnessCallerIdentity {
  if (!isExactRecord(value, [
    "schemaVersion",
    "kind",
    "adapterId",
    "adapterVersion",
    "harnessId",
    "connectionMethod",
    "scope",
    "root",
    "executable",
  ])) {
    throw new Error("The harness caller identity has an invalid object shape.");
  }
  if (
    value.schemaVersion !== 1 ||
    value.kind !== "make-docs-harness-caller" ||
    typeof value.adapterId !== "string" ||
    !value.adapterId.trim() ||
    !Number.isSafeInteger(value.adapterVersion) ||
    (value.adapterVersion as number) < 1 ||
    (value.harnessId !== "codex" && value.harnessId !== "claude-code") ||
    !["mcp", "command-rules", "permission-rules"].includes(value.connectionMethod as string) ||
    value.scope !== "machine" ||
    typeof value.root !== "string" ||
    !path.isAbsolute(value.root)
  ) {
    throw new Error("The harness caller identity fields are invalid.");
  }
  assertExecutableIdentityShape(value.executable);
}

function assertExecutableIdentityShape(value: unknown): asserts value is VerifiedExecutableIdentity {
  if (!isExactRecord(value, [
    "kind",
    "path",
    "sha256",
    "size",
    "productMarker",
    "packageName",
    "packageVersion",
    "packageRoot",
    "binRelativePath",
  ])) {
    throw new Error("The harness caller executable identity has an invalid object shape.");
  }
  if (
    value.kind !== "make-docs" ||
    typeof value.path !== "string" ||
    !path.isAbsolute(value.path) ||
    typeof value.sha256 !== "string" ||
    !SHA256.test(value.sha256) ||
    !Number.isSafeInteger(value.size) ||
    (value.size as number) < 1 ||
    value.productMarker !== PRODUCT_MARKER ||
    value.packageName !== PACKAGE_NAME ||
    typeof value.packageVersion !== "string" ||
    !value.packageVersion.trim() ||
    typeof value.packageRoot !== "string" ||
    !path.isAbsolute(value.packageRoot) ||
    typeof value.binRelativePath !== "string" ||
    !value.binRelativePath ||
    path.isAbsolute(value.binRelativePath) ||
    value.binRelativePath.split(/[\\/]/).includes("..")
  ) {
    throw new Error("The harness caller executable identity fields are invalid.");
  }
}

function isExactRecord(value: unknown, keys: readonly string[]): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

export function resolveHarnessMethodSupport(
  adapter: HarnessAdapter,
  methodId: HarnessConnectionMethod,
  facts?: HarnessSupportFacts,
): ResolvedHarnessMethodSupport {
  const method = adapter.methods.find(candidate => candidate.id === methodId);
  if (!method) {
    return {
      state: "unsupported",
      selectable: false,
      publicSupportClaim: false,
      reason: `${adapter.displayName} does not implement ${methodId}.`,
      unavailableReason: "method-not-admitted",
      nextAction: `Choose one of the methods admitted by ${adapter.displayName}.`,
      caveats: [],
    };
  }
  if (!facts || !facts.tuple || !facts.registry) {
    return {
      state: "not-run",
      selectable: false,
      publicSupportClaim: false,
      reason: "No exact runtime facts were supplied to the packaged registry resolver.",
      unavailableReason: "runtime-facts-unavailable",
      nextAction: "Set the exact provider or model and harness version facts, then review setup again.",
      caveats: [],
    };
  }
  const identity = adapter.conformanceIdentity(methodId);
  if (
    facts.tuple.harness !== identity.harnessId ||
    facts.tuple.connectionMethod !== identity.connectionMethod ||
    facts.tuple.surface !== identity.surface
  ) {
    return {
      state: "unsupported",
      selectable: false,
      publicSupportClaim: false,
      reason: "The requested tuple does not match this admitted adapter and method.",
      unavailableReason: "adapter-not-admitted",
      nextAction: "Use the adapter, harness, method, and surface recorded by the exact tuple.",
      caveats: [],
    };
  }
  const entry = getConformanceTupleEntry(facts.registry, facts.tuple);
  if (!entry) {
    return {
      state: "not-run",
      selectable: false,
      publicSupportClaim: false,
      reason: "The packaged registry has no entry for this exact seven-part tuple.",
      unavailableReason: "tuple-not-registered",
      nextAction: "Bootstrap only this exact tuple in a disposable lab session, then ingest its measured result.",
      caveats: [],
    };
  }
  if (entry.status !== "conformance-validated") {
    return {
      state: "experimental",
      selectable: false,
      publicSupportClaim: false,
      reason: `The exact registry tuple is ${entry.status}.`,
      unavailableReason: "tuple-not-validated",
      nextAction: "Complete and ingest a qualifying real-harness run for this tuple.",
      caveats: [],
    };
  }
  const qualifying = entry.recordedRuns.filter(runQualifiesForConformanceValidation);
  if (qualifying.length === 0) {
    return {
      state: "experimental",
      selectable: false,
      publicSupportClaim: false,
      reason: "The registry status has no qualifying recorded result.",
      unavailableReason: "qualifying-result-missing",
      nextAction: "Repair the registry through the normal ingestion and recording seam.",
      caveats: [],
    };
  }
  const checks: Array<{
    reason: HarnessSupportUnavailableReason;
    matches: (run: (typeof qualifying)[number]) => boolean;
    detail: string;
    nextAction: string;
  }> = [
    {
      reason: "make-docs-version-mismatch",
      matches: run => run.makeDocsVersion === facts.makeDocsVersion,
      detail: "No qualifying result matches this Make Docs version.",
      nextAction: "Run conformance for this Make Docs version.",
    },
    {
      reason: "executable-digest-mismatch",
      matches: run => run.executableDigest === facts.executableDigest,
      detail: "No qualifying result matches this installed executable digest.",
      nextAction: "Run conformance with this packed executable.",
    },
    {
      reason: "behavior-digest-mismatch",
      matches: run => run.behaviorDigest === facts.behaviorDigest,
      detail: "No qualifying result matches this Make Docs behavior digest.",
      nextAction: "Run conformance for this behavior build.",
    },
    {
      reason: "harness-version-mismatch",
      matches: run => run.harnessVersion === facts.harnessVersion,
      detail: "No qualifying result matches this harness version.",
      nextAction: "Run conformance with this harness version.",
    },
  ];
  let candidates = qualifying;
  for (const check of checks) {
    const next = candidates.filter(check.matches);
    if (next.length === 0) {
      return {
        state: "experimental",
        selectable: false,
        publicSupportClaim: false,
        reason: check.detail,
        unavailableReason: check.reason,
        nextAction: check.nextAction,
        caveats: [],
      };
    }
    candidates = next;
  }
  const caveats = [...new Set(candidates.flatMap(run => run.caveats))];
  return {
    state: "conformance-validated",
    selectable: true,
    publicSupportClaim: true,
    reason: `The packaged registry has qualifying evidence for result ${candidates.at(-1)!.runId}.`,
    unavailableReason: null,
    nextAction: null,
    caveats,
  };
}

function sortJson(value: NativeEntryValue): NativeEntryValue {
  if (Array.isArray(value)) return value.map(sortJson);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, sortJson(child)]),
    );
  }
  return value;
}
