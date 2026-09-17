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
  /** The path used to launch Make Docs. It can be a verified package-manager link. */
  launchPath?: string;
  /** The resolved package bin. Native entries use this stable path. */
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
export const HARNESS_CALLER_IDENTITY_ARG = "--make-docs-harness-caller" as const;
export const HARNESS_CALLER_REFERENCE_ARG = "--make-docs-harness-caller-ref" as const;

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

/** A generic MCP client must present the reviewed secret proof. */
export interface GenericMcpCallerIdentity {
  schemaVersion: 1;
  kind: "make-docs-generic-mcp-caller";
  adapterId: "generic-mcp";
  adapterVersion: 1;
  harnessId: string;
  connectionMethod: "mcp";
  scope: "machine";
  root: string;
  executable: VerifiedExecutableIdentity;
  proof: string;
}

export type ParsedHarnessCallerIdentity = HarnessCallerIdentity | GenericMcpCallerIdentity;

/**
 * Compact Claude Code permission-rule carrier. This reference is not authority.
 * Store-backed calls must rebuild and verify the full caller identity and receipt.
 */
export interface HarnessCallerReference {
  raw: string;
  harnessId: "claude-code";
  connectionMethod: "permission-rules";
  adapterVersion: 1;
  root: string;
  identitySha256: string;
}

export interface VerifyExecutableInput {
  executablePath: string;
  expectedSha256?: string;
}

export type ExecutableVerificationCode =
  | "executable-path-not-absolute"
  | "executable-fingerprint-invalid"
  | "executable-path-missing"
  | "executable-link-broken"
  | "executable-not-file"
  | "executable-not-executable"
  | "executable-runner-forbidden"
  | "executable-fingerprint-mismatch"
  | "executable-package-mismatch";

export class ExecutableVerificationError extends Error {
  readonly name = "ExecutableVerificationError";

  constructor(
    readonly code: ExecutableVerificationCode,
    message: string,
    readonly launchPath: string,
    readonly resolvedPath: string | null,
    readonly failedRule: string,
    readonly nextAction: string,
  ) {
    super(message);
  }
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
  ownedEntries: readonly string[];
  allowedStoreOperations: "active-operation-registry" | "bounded-command-rule-registry";
  implementationState: "implemented";
  availability: "available" | "blocked";
  blocker: string | null;
  nextAction: string;
}

export interface HarnessDetectionResult {
  adapterId: string;
  harnessId: HarnessId;
  scope: HarnessScope;
  state: "detected" | "not-detected" | "blocked";
  evidence: readonly string[];
  reason?: string;
}

export interface ResolvedHarnessMethodSupport {
  state: "available" | "blocked" | "unsupported";
  selectable: boolean;
  reason: string;
  nextAction: string;
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
  executableNames: readonly string[];
  projectRouterFiles: readonly string[];
  skillRoots: readonly string[];
  methods: readonly HarnessMethodDefinition[];
  detect(input: { scope: HarnessScope; root: string; path?: string }): HarnessDetectionResult;
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
  repair(input: HarnessPlanInput): HarnessAccessPlan;
  planRemoval(input: HarnessRemoveInput): HarnessAccessPlan;
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
export function sha256(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

export function verifyMakeDocsExecutable(
  input: VerifyExecutableInput,
): VerifiedExecutableIdentity {
  return verifyExecutableAgainstPackage(input, resolvePackagedExecutableIdentity());
}

/** Recheck one identity against the package that owns this running process. */
export function reverifyMakeDocsExecutableIdentity(
  executable: VerifiedExecutableIdentity,
): VerifiedExecutableIdentity {
  return verifyMakeDocsExecutable({
    executablePath: executable.launchPath ?? executable.path,
    expectedSha256: executable.sha256,
  });
}

function verifyExecutableAgainstPackage(
  input: VerifyExecutableInput,
  packaged: ReturnType<typeof resolvePackagedExecutableIdentity>,
): VerifiedExecutableIdentity {
  if (!path.isAbsolute(input.executablePath)) {
    throw verificationError(
      "executable-path-not-absolute",
      "The Make Docs executable path must be absolute.",
      input.executablePath,
      null,
      "absolute-launch-path",
      "Run the installed `make-docs` command through its absolute package-manager link.",
    );
  }
  if (input.expectedSha256 !== undefined && !SHA256.test(input.expectedSha256)) {
    throw verificationError(
      "executable-fingerprint-invalid",
      "The expected Make Docs executable fingerprint must be a SHA-256 digest.",
      input.executablePath,
      null,
      "expected-sha256",
      "Create a new setup review from the active installed executable.",
    );
  }

  let launchStat: ReturnType<typeof lstatSync>;
  try {
    launchStat = lstatSync(input.executablePath);
  } catch (error) {
    throw verificationError(
      "executable-path-missing",
      `The Make Docs launch path cannot be read: ${toMessage(error)}`,
      input.executablePath,
      null,
      "launch-path-present",
      "Run setup from the installed `make-docs` command or reinstall the package if the link is missing.",
    );
  }

  let actualPath: string;
  try {
    actualPath = realpathSync(input.executablePath);
  } catch (error) {
    throw verificationError(
      "executable-link-broken",
      `The Make Docs launch path cannot resolve to a package binary: ${toMessage(error)}`,
      input.executablePath,
      null,
      "resolved-package-bin",
      "Repair or reinstall the broken package-manager link, then review setup again.",
    );
  }

  const stat = lstatSync(actualPath);
  if (!stat.isFile()) {
    throw verificationError(
      "executable-not-file",
      "The resolved Make Docs package binary is not a regular file.",
      input.executablePath,
      actualPath,
      "regular-package-bin",
      "Repair the installed package and review setup again.",
    );
  }
  if (process.platform !== "win32" && (stat.mode & 0o111) === 0) {
    throw verificationError(
      "executable-not-executable",
      "The resolved Make Docs package binary is not executable.",
      input.executablePath,
      actualPath,
      "executable-package-bin",
      "Repair the package file mode or reinstall the package, then review setup again.",
    );
  }

  const executableName = path.basename(input.executablePath).toLowerCase().replace(/\.exe$/, "");
  if (FORBIDDEN_EXECUTABLE_NAMES.has(executableName)) {
    throw verificationError(
      "executable-runner-forbidden",
      `A package runner or shell cannot be used as the Make Docs executable: ${executableName}.`,
      input.executablePath,
      actualPath,
      "direct-make-docs-launcher",
      "Run the installed `make-docs` command directly, then review setup again.",
    );
  }

  const bytes = readFileSync(actualPath);
  const actualSha256 = sha256(bytes);
  if (input.expectedSha256 !== undefined && actualSha256 !== input.expectedSha256) {
    throw verificationError(
      "executable-fingerprint-mismatch",
      "The Make Docs executable fingerprint does not match the reviewed executable.",
      input.executablePath,
      actualPath,
      "reviewed-sha256",
      "Create a new setup review from the current installed executable.",
    );
  }

  if (actualPath !== packaged.path) {
    throw verificationError(
      "executable-package-mismatch",
      "The executable is not the exact Make Docs package binary for this installation.",
      input.executablePath,
      actualPath,
      "declared-package-bin",
      "Run the `make-docs` command installed by this package, then review setup again.",
    );
  }

  return {
    kind: "make-docs",
    launchPath: input.executablePath,
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

function verificationError(
  code: ExecutableVerificationCode,
  message: string,
  launchPath: string,
  resolvedPath: string | null,
  failedRule: string,
  nextAction: string,
): ExecutableVerificationError {
  return new ExecutableVerificationError(
    code,
    message,
    launchPath,
    resolvedPath,
    failedRule,
    nextAction,
  );
}

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
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

export function encodeHarnessCallerIdentity(identity: ParsedHarnessCallerIdentity): string {
  assertHarnessCallerIdentityShape(identity);
  return canonicalJson(identity as unknown as NativeEntryValue);
}

/** Encode one caller identity as a shell-safe, plain command argument. */
export function encodeHarnessCallerIdentityArgument(identity: HarnessCallerIdentity): string {
  return Buffer.from(encodeHarnessCallerIdentity(identity), "utf8").toString("base64url");
}

/** Encode the compact, non-secret carrier used only by Claude Code permission rules. */
export function encodeHarnessCallerReference(identity: HarnessCallerIdentity): string {
  assertHarnessCallerIdentityShape(identity);
  if (
    identity.kind !== "make-docs-harness-caller" ||
    identity.harnessId !== "claude-code" ||
    identity.connectionMethod !== "permission-rules" ||
    identity.adapterVersion !== 1
  ) {
    throw new Error("A caller reference needs the Claude Code permission-rules v1 identity.");
  }
  const root = canonicalMachineRoot(identity.root);
  if (root !== identity.root) {
    throw new Error("The caller reference machine root must be canonical.");
  }
  const encodedRoot = Buffer.from(root, "utf8").toString("base64url");
  const digest = sha256(encodeHarnessCallerIdentity(identity));
  return `claude-code.permission-rules.v1.${encodedRoot}.${digest}`;
}

/** Parse and validate the compact Claude Code permission-rule carrier. */
export function parseHarnessCallerReference(raw: string): HarnessCallerReference {
  const match = /^claude-code\.permission-rules\.v1\.([A-Za-z0-9_-]+)\.([0-9a-f]{64})$/.exec(raw);
  if (!match) {
    throw new Error("The harness caller reference has an invalid format.");
  }
  const encodedRoot = match[1];
  const decodedBytes = Buffer.from(encodedRoot, "base64url");
  const root = decodedBytes.toString("utf8");
  if (!root || Buffer.from(root, "utf8").toString("base64url") !== encodedRoot) {
    throw new Error("The harness caller reference root is not canonical base64url.");
  }
  if (canonicalMachineRoot(root) !== root) {
    throw new Error("The harness caller reference root is not a canonical absolute path.");
  }
  return Object.freeze({
    raw,
    harnessId: "claude-code",
    connectionMethod: "permission-rules",
    adapterVersion: 1,
    root,
    identitySha256: match[2],
  });
}

function canonicalMachineRoot(root: string): string {
  if (!path.isAbsolute(root) || root.includes("\0") || path.normalize(root) !== root) {
    throw new Error("The harness caller reference root must be an absolute normalized path.");
  }
  let canonical: string;
  try {
    canonical = realpathSync(root);
  } catch {
    throw new Error("The harness caller reference root does not exist.");
  }
  return canonical;
}

/** Decode one shell-safe caller identity argument before normal CLI dispatch. */
export function parseHarnessCallerIdentityArgument(raw: string): ParsedHarnessCallerIdentity {
  if (!raw || !/^[A-Za-z0-9_-]+$/.test(raw)) {
    throw new Error("The harness caller identity argument is not valid base64url.");
  }
  const decoded = Buffer.from(raw, "base64url").toString("utf8");
  if (Buffer.from(decoded, "utf8").toString("base64url") !== raw) {
    throw new Error("The harness caller identity argument is not canonical base64url.");
  }
  return parseHarnessCallerIdentityValue(decoded);
}

/** Parse the marker shape only. The caller must still verify its receipt and package identity. */
export function parseHarnessCallerIdentityValue(raw: string): ParsedHarnessCallerIdentity {
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

/** Parse the first-party identity used by native adapter tests and rule carriers. */
export function parseHarnessCallerIdentity(raw: string): HarnessCallerIdentity {
  const parsed = parseHarnessCallerIdentityValue(raw);
  if (parsed.kind !== "make-docs-harness-caller") {
    throw new Error("The harness caller identity is not a first-party adapter identity.");
  }
  return parsed;
}

function assertHarnessCallerIdentityShape(value: unknown): asserts value is ParsedHarnessCallerIdentity {
  const generic = Boolean(
    value && typeof value === "object" && !Array.isArray(value) &&
    (value as Record<string, unknown>).kind === "make-docs-generic-mcp-caller",
  );
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
    ...(generic ? ["proof"] : []),
  ])) {
    throw new Error("The harness caller identity has an invalid object shape.");
  }
  if (
    value.schemaVersion !== 1 ||
    (value.kind !== "make-docs-harness-caller" && value.kind !== "make-docs-generic-mcp-caller") ||
    typeof value.adapterId !== "string" ||
    !value.adapterId.trim() ||
    !Number.isSafeInteger(value.adapterVersion) ||
    (value.adapterVersion as number) < 1 ||
    (generic
      ? typeof value.harnessId !== "string" || !/^generic-mcp-[a-z][a-z0-9-]*$/.test(value.harnessId)
      : value.harnessId !== "codex" && value.harnessId !== "claude-code") ||
    !["mcp", "command-rules", "permission-rules"].includes(value.connectionMethod as string) ||
    value.scope !== "machine" ||
    typeof value.root !== "string" ||
    !path.isAbsolute(value.root)
  ) {
    throw new Error("The harness caller identity fields are invalid.");
  }
  if (generic && (
    value.adapterId !== "generic-mcp" ||
    value.adapterVersion !== 1 ||
    value.connectionMethod !== "mcp" ||
    typeof value.proof !== "string" ||
    !/^[A-Za-z0-9_-]{32,}$/.test(value.proof)
  )) {
    throw new Error("The generic MCP caller identity fields are invalid.");
  }
  assertExecutableIdentityShape(value.executable);
}

function assertExecutableIdentityShape(value: unknown): asserts value is VerifiedExecutableIdentity {
  if (!isExactRecordWithOptionalKeys(value, [
    "kind",
    "path",
    "sha256",
    "size",
    "productMarker",
    "packageName",
    "packageVersion",
    "packageRoot",
    "binRelativePath",
  ], ["launchPath"])) {
    throw new Error("The harness caller executable identity has an invalid object shape.");
  }
  if (
    value.kind !== "make-docs" ||
    (value.launchPath !== undefined &&
      (typeof value.launchPath !== "string" || !path.isAbsolute(value.launchPath))) ||
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

function isExactRecordWithOptionalKeys(
  value: unknown,
  requiredKeys: readonly string[],
  optionalKeys: readonly string[],
): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const actual = Object.keys(value);
  const allowed = new Set([...requiredKeys, ...optionalKeys]);
  return requiredKeys.every(key => actual.includes(key)) && actual.every(key => allowed.has(key));
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
): ResolvedHarnessMethodSupport {
  const method = adapter.methods.find(candidate => candidate.id === methodId);
  if (!method) {
    return {
      state: "unsupported",
      selectable: false,
      reason: `${adapter.displayName} does not implement ${methodId}.`,
      nextAction: `Choose one of the methods admitted by ${adapter.displayName}.`,
    };
  }
  if (method.availability === "blocked") {
    return {
      state: "blocked",
      selectable: false,
      reason: method.blocker ?? `${adapter.displayName} ${methodId} is blocked.`,
      nextAction: method.nextAction,
    };
  }
  return {
    state: "available",
    selectable: true,
    reason: `${adapter.displayName} ${methodId} is a product-owned setup method.`,
    nextAction: method.nextAction,
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
