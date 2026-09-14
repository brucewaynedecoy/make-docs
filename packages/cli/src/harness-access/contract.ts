import { createHash } from "node:crypto";
import { lstatSync, readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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

export interface HarnessConformanceEvidence extends HarnessConformanceIdentity {
  schemaVersion: 1;
  resultId: string;
  verdict: "pass" | "pass-with-caveats" | "inconsistent" | "unsupported" | "blocked";
  eligible: boolean;
  assertions: {
    install: boolean;
    discover: boolean;
    invoke: boolean;
    uninstall: boolean;
  };
  caveats?: readonly string[];
}

export interface HarnessConformanceEvidenceRecord {
  schemaVersion: 1;
  provenance: {
    kind: "make-docs-harness-conformance";
    storage: "committed-conformance-registry";
    evidenceId: string;
    recordedAt: string;
  };
  evidence: HarnessConformanceEvidence;
  digest: string;
}

export interface ResolvedHarnessMethodSupport {
  state: "not-run" | "experimental" | "conformance-validated" | "unsupported";
  selectable: boolean;
  publicSupportClaim: boolean;
  reason: string;
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
const validatedConformanceEvidence = new WeakMap<
  object,
  { evidencePath: string; digest: string }
>();

export function sha256(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

export function verifyMakeDocsExecutable(
  input: VerifyExecutableInput,
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

  const packaged = resolvePackagedExecutableIdentity();
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

export function loadHarnessConformanceEvidence(input: {
  trustedRoot: string;
  evidencePath: string;
}): HarnessConformanceEvidence {
  if (!path.isAbsolute(input.trustedRoot) || !path.isAbsolute(input.evidencePath)) {
    throw new Error("Conformance evidence paths must be absolute.");
  }
  const rootStat = lstatSync(input.trustedRoot);
  if (rootStat.isSymbolicLink() || !rootStat.isDirectory()) {
    throw new Error("The trusted conformance Store root must be a non-symbolic-link directory.");
  }
  const lexicalRelative = path.relative(input.trustedRoot, input.evidencePath);
  if (
    lexicalRelative === ".." ||
    lexicalRelative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(lexicalRelative)
  ) {
    throw new Error("Conformance evidence is outside the trusted Store root.");
  }
  let current = input.trustedRoot;
  for (const segment of lexicalRelative.split(path.sep).filter(Boolean)) {
    current = path.join(current, segment);
    const part = lstatSync(current);
    if (part.isSymbolicLink()) {
      throw new Error("Conformance evidence paths must not use symbolic links.");
    }
  }
  const trustedRoot = realpathSync(input.trustedRoot);
  const evidencePath = realpathSync(input.evidencePath);
  const relative = path.relative(trustedRoot, evidencePath);
  if (relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error("Conformance evidence is outside the trusted Store root.");
  }
  const stat = lstatSync(evidencePath);
  if (stat.isSymbolicLink() || !stat.isFile()) {
    throw new Error("Conformance evidence must be a regular non-symbolic-link file.");
  }
  let value: unknown;
  try {
    value = JSON.parse(readFileSync(evidencePath, "utf8"));
  } catch {
    throw new Error("Conformance evidence is not valid JSON.");
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Conformance evidence is not a record.");
  }
  const record = value as Partial<HarnessConformanceEvidenceRecord>;
  const provenance = record.provenance;
  const evidence = record.evidence;
  if (
    record.schemaVersion !== 1 ||
    !provenance ||
    provenance.kind !== "make-docs-harness-conformance" ||
    provenance.storage !== "committed-conformance-registry" ||
    !provenance.evidenceId?.trim() ||
    !Number.isFinite(Date.parse(provenance.recordedAt ?? "")) ||
    !evidence ||
    evidence.schemaVersion !== 1 ||
    typeof evidence.adapterId !== "string" ||
    !Number.isSafeInteger(evidence.adapterVersion) ||
    (evidence.harnessId !== "codex" && evidence.harnessId !== "claude-code") ||
    !["mcp", "command-rules", "permission-rules"].includes(evidence.connectionMethod) ||
    !["mcp", "cli-command-rules", "cli-permission-rules"].includes(evidence.surface) ||
    evidence.resultId !== provenance.evidenceId ||
    !["pass", "pass-with-caveats", "inconsistent", "unsupported", "blocked"].includes(evidence.verdict) ||
    typeof evidence.eligible !== "boolean" ||
    !evidence.assertions ||
    Object.values(evidence.assertions).length !== 4 ||
    Object.values(evidence.assertions).some(assertion => typeof assertion !== "boolean") ||
    (evidence.caveats !== undefined &&
      (!Array.isArray(evidence.caveats) || evidence.caveats.some(caveat => typeof caveat !== "string"))) ||
    !record.digest ||
    !SHA256.test(record.digest)
  ) {
    throw new Error("Conformance evidence provenance is incomplete or invalid.");
  }
  const expectedDigest = harnessConformanceEvidenceDigest({
    schemaVersion: 1,
    provenance: provenance as HarnessConformanceEvidenceRecord["provenance"],
    evidence,
  });
  if (record.digest !== expectedDigest) {
    throw new Error("Conformance evidence digest does not match its durable record.");
  }
  validatedConformanceEvidence.set(evidence, {
    evidencePath,
    digest: record.digest,
  });
  return Object.freeze(evidence);
}

export function harnessConformanceEvidenceDigest(
  record: Omit<HarnessConformanceEvidenceRecord, "digest">,
): string {
  return sha256(canonicalJson(record as unknown as NativeEntryValue));
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
  evidence?: HarnessConformanceEvidence,
): ResolvedHarnessMethodSupport {
  const method = adapter.methods.find(candidate => candidate.id === methodId);
  if (!method) {
    return {
      state: "unsupported",
      selectable: false,
      publicSupportClaim: false,
      reason: `${adapter.displayName} does not implement ${methodId}.`,
      caveats: [],
    };
  }
  if (!evidence) {
    return {
      state: "not-run",
      selectable: false,
      publicSupportClaim: false,
      reason: "The adapter exists, but exact real-harness conformance has not been supplied.",
      caveats: [],
    };
  }

  const validated = validatedConformanceEvidence.get(evidence);
  let durableEvidenceCurrent = false;
  if (validated) {
    try {
      const live = JSON.parse(readFileSync(validated.evidencePath, "utf8")) as HarnessConformanceEvidenceRecord;
      durableEvidenceCurrent =
        live.digest === validated.digest &&
        harnessConformanceEvidenceDigest({
          schemaVersion: live.schemaVersion,
          provenance: live.provenance,
          evidence: live.evidence,
        }) === live.digest;
    } catch {
      durableEvidenceCurrent = false;
    }
  }
  if (!validated || !durableEvidenceCurrent) {
    return {
      state: "experimental",
      selectable: false,
      publicSupportClaim: false,
      reason: "The supplied result was not loaded from validated durable conformance evidence.",
      caveats: [],
    };
  }

  const identity = adapter.conformanceIdentity(methodId);
  const sameIdentity =
    evidence.adapterId === identity.adapterId &&
    evidence.adapterVersion === identity.adapterVersion &&
    evidence.harnessId === identity.harnessId &&
    evidence.connectionMethod === identity.connectionMethod &&
    evidence.surface === identity.surface;
  const complete = Object.values(evidence.assertions).every(Boolean);
  const verdictEligible = evidence.verdict === "pass" || evidence.verdict === "pass-with-caveats";
  const caveats = evidence.caveats ?? [];
  const validCaveats = evidence.verdict !== "pass-with-caveats" || caveats.length > 0;

  if (!sameIdentity || !evidence.resultId.trim() || !evidence.eligible || !complete || !verdictEligible || !validCaveats) {
    return {
      state: "experimental",
      selectable: false,
      publicSupportClaim: false,
      reason: "The supplied result does not prove this exact adapter and method tuple.",
      caveats: [],
    };
  }

  return {
    state: "experimental",
    selectable: false,
    publicSupportClaim: false,
    reason:
      `Durable conformance result ${evidence.resultId} passed local validation, but this build ` +
      "has no authoritative PRD 20 tuple-registry projection for the exact connection method.",
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
