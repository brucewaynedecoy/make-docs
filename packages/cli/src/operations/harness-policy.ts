import {
  encodeHarnessCallerIdentity,
  parseHarnessCallerIdentity,
  parseHarnessCallerReference,
  requireFirstPartyHarnessAdapter,
  sha256,
  validateHarnessMethodSelection,
  verifyMakeDocsExecutable,
  type HarnessCallerIdentity,
  type HarnessCallerReference,
  type HarnessCommandRuleAuthority,
  type HarnessConnectionMethod,
  type HarnessId,
  type VerifiedExecutableIdentity,
} from "../harness-access";
import {
  loadMakeDocsConfigOrThrow,
  resolveEffectiveHarnessIntegration,
  type MachineHarnessApproval,
  type ProjectHarnessIntegrationRecord,
} from "../config";
import { loadGlobalConfig } from "../store/global-config";
import { readCurrentHarnessIntegrationReceipt } from "../store/harness-integration-receipts";
import { validateInstallationStoreRoot } from "../store/installation-state";
import { NO_ACCESS, type OperationAccess } from "./access";
import type { OperationRoute } from "./context";
import { OperationError } from "./types";

const FULL_OPERATION_ACCESS: OperationAccess = Object.freeze({
  store: "write",
  project: "write",
  hostConfig: "none",
});

export interface ProjectHarnessAccessProjection {
  configured: boolean;
  access: OperationAccess;
  reason: string;
}

export interface HarnessOperationPolicyResult extends ProjectHarnessAccessProjection {
  verified: boolean;
  harnesses: readonly string[];
  methods: readonly HarnessConnectionMethod[];
}

export class HarnessOperationAccessDeniedError extends OperationError {
  readonly code = "harness-operation-access-denied";

  constructor(message: string) {
    super(message);
    this.name = "HarnessOperationAccessDeniedError";
  }
}

/**
 * Derive the Store-free part of MCP exposure from project intent. This never
 * grants machine trust. A runtime invocation still verifies machine intent,
 * the current Store receipt, the package binary, and the native entry.
 */
export function resolveProjectHarnessAccessProjection(
  targetRoot: string,
  method: HarnessConnectionMethod,
  callerIdentityRaw?: string,
  callerReference?: HarnessCallerReference,
  runtimeExecutablePath?: string,
): ProjectHarnessAccessProjection {
  const records = loadMakeDocsConfigOrThrow(targetRoot).config.harnessIntegrations;
  let identity: HarnessCallerIdentity | undefined;
  if (callerIdentityRaw || callerReference) {
    try {
      identity = resolveCallerIdentity({
        callerIdentityRaw,
        callerReference,
        runtimeExecutablePath,
      });
    } catch (error) {
      return deniedProjection(`The harness tool-list identity is invalid: ${message(error)}`);
    }
  }
  if (records.length === 0) {
    return {
      configured: false,
      access: { ...FULL_OPERATION_ACCESS },
      reason: "The project has no harness access override.",
    };
  }

  if (!identity) {
    return deniedProjection("The harness tool list has no native launch identity.");
  }

  let adapter: ReturnType<typeof requireFirstPartyHarnessAdapter>;
  try {
    adapter = requireFirstPartyHarnessAdapter(identity.harnessId);
  } catch (error) {
    return deniedProjection(`The harness tool-list identity is not supported: ${message(error)}`);
  }
  if (
    identity.adapterId !== adapter.id ||
    identity.adapterVersion !== adapter.version ||
    identity.connectionMethod !== method ||
    identity.scope !== "machine"
  ) {
    return deniedProjection("The harness tool-list identity does not match the active adapter method.");
  }

  const record = records.find(candidate => candidate.harness === identity.harnessId);
  if (!record) {
    return {
      configured: true,
      access: { ...FULL_OPERATION_ACCESS },
      reason: `Project harness '${identity.harnessId}' has no access override.`,
    };
  }
  if (!safeFirstPartyRecord(record)) {
    return deniedProjection(`Project harness '${record.harness}' has no runtime adapter.`);
  }
  if (record.mode === "disable" || (record.method && record.method !== method)) {
    return deniedProjection(`Project harness '${record.harness}' does not admit method '${method}'.`);
  }
  return {
    configured: true,
    access: record.accessCeiling ? { ...record.accessCeiling } : { ...FULL_OPERATION_ACCESS },
    reason: `Access uses the active '${record.harness}' project harness limit.`,
  };
}

/** Resolve verified effective access for one exact caller or all project limits. */
export function resolveHarnessOperationPolicy(input: {
  targetRoot: string;
  storeRoot: string;
  route: Exclude<OperationRoute, "test">;
  callerIdentityRaw?: string;
  callerReference?: HarnessCallerReference;
  /** Test seam. Production uses the exact executable in process.argv[1]. */
  runtimeExecutablePath?: string;
  commandRuleAuthority?: HarnessCommandRuleAuthority;
}): HarnessOperationPolicyResult {
  const loadedProject = loadMakeDocsConfigOrThrow(input.targetRoot);
  const records = loadedProject.config.harnessIntegrations;
  const hasCaller = Boolean(input.callerIdentityRaw || input.callerReference);
  if (input.route === "direct-cli") {
    return {
      configured: records.length > 0,
      verified: true,
      access: { ...FULL_OPERATION_ACCESS },
      harnesses: [],
      methods: [],
      reason: "The operation came from the explicit trusted direct CLI route.",
    };
  }

  if (!hasCaller) {
    return {
      configured: records.length > 0,
      verified: false,
      access: { ...NO_ACCESS },
      harnesses: records.map(record => record.harness),
      methods: [],
      reason:
        `The ${input.route} Store-backed call has no harness-proved native launch identity. ` +
        "An executable path, native rule, or project setting alone cannot grant Store access.",
    };
  }

  const storeRoot = validateInstallationStoreRoot(input.targetRoot, input.storeRoot);
  const global = loadGlobalConfig(storeRoot).config;
  let identity: HarnessCallerIdentity;
  try {
    identity = resolveCallerIdentity(input);
  } catch (error) {
    throw denied(`The harness caller identity is invalid: ${message(error)}`);
  }
  if (input.route === "mcp" && identity.connectionMethod !== "mcp") {
    throw denied("The MCP route needs an exact MCP caller identity.");
  }
  if (input.route === "native-rule" && identity.connectionMethod === "mcp") {
    throw denied("The native-rule route needs an exact command-rule or permission-rule caller identity.");
  }
  const project = records.find((record) => record.harness === identity.harnessId);
  const access = verifyIntegration({
    targetRoot: input.targetRoot,
    storeRoot,
    project,
    machine: machineApproval(global.settings.harnesses[identity.harnessId]),
    identity,
    commandRuleAuthority: input.commandRuleAuthority,
  });
  return {
    configured: true,
    verified: true,
    access,
    harnesses: [identity.harnessId],
    methods: [identity.connectionMethod],
    reason: "The exact harness caller, method, Store receipt, package binary, and native entry are current.",
  };
}

export function assertHarnessOperationAllowed(input: {
  operation: string;
  required: OperationAccess;
  targetRoot: string;
  storeRoot: string;
  route: Exclude<OperationRoute, "test">;
  callerIdentityRaw?: string;
  callerReference?: HarnessCallerReference;
  runtimeExecutablePath?: string;
  commandRuleAuthority?: HarnessCommandRuleAuthority;
}): HarnessOperationPolicyResult {
  const policy = resolveHarnessOperationPolicy(input);
  if (!accessAtMost(input.required, policy.access)) {
    throw denied(
      `Harness access for this project does not allow operation '${input.operation}'. ` +
        `It needs ${formatAccess(input.required)}, but effective access is ${formatAccess(policy.access)}.`,
    );
  }
  return policy;
}

/** Check a native Store-free call without opening or verifying the Store. */
export function assertStoreFreeHarnessOperationAllowed(input: {
  operation: string;
  required: OperationAccess;
  targetRoot: string;
  route: Extract<OperationRoute, "mcp" | "native-rule">;
  callerIdentityRaw?: string;
  callerReference?: HarnessCallerReference;
  runtimeExecutablePath?: string;
}): ProjectHarnessAccessProjection {
  let identity: HarnessCallerIdentity;
  try {
    identity = resolveCallerIdentity(input);
  } catch (error) {
    throw denied(`The harness caller identity is invalid: ${message(error)}`);
  }
  if (input.route === "mcp" && identity.connectionMethod !== "mcp") {
    throw denied("The MCP route needs an exact MCP caller identity.");
  }
  if (input.route === "native-rule" && identity.connectionMethod === "mcp") {
    throw denied("The native-rule route needs an exact command-rule or permission-rule caller identity.");
  }
  const projection = resolveProjectHarnessAccessProjection(
    input.targetRoot,
    identity.connectionMethod,
    input.callerIdentityRaw,
    input.callerReference,
    input.runtimeExecutablePath,
  );
  if (!accessAtMost(input.required, projection.access)) {
    throw denied(
      `Harness access for this project does not allow operation '${input.operation}'. ` +
        `It needs ${formatAccess(input.required)}, but effective access is ${formatAccess(projection.access)}.`,
    );
  }
  return projection;
}

function resolveCallerIdentity(input: {
  callerIdentityRaw?: string;
  callerReference?: HarnessCallerReference;
  runtimeExecutablePath?: string;
}): HarnessCallerIdentity {
  if (input.callerIdentityRaw && input.callerReference) {
    throw new Error("The harness caller identity and reference cannot be used together.");
  }
  if (input.callerIdentityRaw) return parseHarnessCallerIdentity(input.callerIdentityRaw);
  if (!input.callerReference) throw new Error("The harness caller identity is missing.");

  const parsed = parseHarnessCallerReference(input.callerReference.raw);
  if (
    parsed.harnessId !== input.callerReference.harnessId ||
    parsed.connectionMethod !== input.callerReference.connectionMethod ||
    parsed.adapterVersion !== input.callerReference.adapterVersion ||
    parsed.root !== input.callerReference.root ||
    parsed.identitySha256 !== input.callerReference.identitySha256
  ) {
    throw new Error("The parsed harness caller reference changed after CLI validation.");
  }
  const adapter = requireFirstPartyHarnessAdapter(parsed.harnessId);
  if (adapter.version !== parsed.adapterVersion) {
    throw new Error("The harness caller reference does not match the active adapter version.");
  }
  const executablePath = input.runtimeExecutablePath ?? process.argv[1];
  if (!executablePath) throw new Error("The running Make Docs executable path is unavailable.");
  const executable = verifyMakeDocsExecutable({ executablePath });
  const identity: HarnessCallerIdentity = {
    schemaVersion: 1,
    kind: "make-docs-harness-caller",
    adapterId: adapter.id,
    adapterVersion: adapter.version,
    harnessId: parsed.harnessId,
    connectionMethod: parsed.connectionMethod,
    scope: "machine",
    root: parsed.root,
    executable,
  };
  if (sha256(encodeHarnessCallerIdentity(identity)) !== parsed.identitySha256) {
    throw new Error("The harness caller reference digest does not match the running Make Docs identity.");
  }
  return identity;
}

export function accessAtMost(required: OperationAccess, ceiling: OperationAccess): boolean {
  return rank(required.store) <= rank(ceiling.store) &&
    rank(required.project) <= rank(ceiling.project) &&
    rank(required.hostConfig) <= rank(ceiling.hostConfig);
}

function verifyIntegration(input: {
  targetRoot: string;
  storeRoot: string;
  project: ProjectHarnessIntegrationRecord | undefined;
  machine: MachineHarnessApproval;
  identity: HarnessCallerIdentity;
  commandRuleAuthority?: HarnessCommandRuleAuthority;
}): OperationAccess {
  const adapter = requireFirstPartyHarnessAdapter(input.identity.harnessId);
  if (
    input.identity.adapterId !== adapter.id ||
    input.identity.adapterVersion !== adapter.version ||
    input.identity.scope !== "machine"
  ) {
    throw denied("The harness caller does not match the active first-party adapter.");
  }
  const effective = resolveEffectiveHarnessIntegration(
    input.project,
    input.machine,
    input.identity.harnessId,
  );
  if (!effective.enabled || effective.method !== input.identity.connectionMethod) {
    throw denied("The project and machine settings do not admit this harness method.");
  }
  const method = validateHarnessMethodSelection({
    harnessId: input.identity.harnessId,
    method: input.identity.connectionMethod,
    scope: "machine",
  });
  if (!method) throw denied("The harness method is disabled.");
  const receipt = readCurrentHarnessIntegrationReceipt(
    input.targetRoot,
    input.storeRoot,
    "machine",
    input.identity.harnessId,
    input.identity.connectionMethod,
  );
  if (
    !receipt ||
    receipt.adapterId !== adapter.id ||
    receipt.adapterVersion !== adapter.version ||
    receipt.scope !== "machine" ||
    !sameExecutable(receipt.executable, input.identity.executable)
  ) {
    throw denied("No exact current Store receipt proves this harness caller.");
  }
  let executable: VerifiedExecutableIdentity;
  try {
    executable = verifyMakeDocsExecutable({
      executablePath: input.identity.executable.path,
      expectedSha256: input.identity.executable.sha256,
    });
  } catch (error) {
    throw denied(`The active Make Docs package binary is not verified: ${message(error)}`);
  }
  if (!sameExecutable(executable, receipt.executable)) {
    throw denied("The current package binary differs from the harness receipt.");
  }
  const rules = method.requiresCommandRules
    ? input.commandRuleAuthority?.validate(input.commandRuleAuthority.list())
    : undefined;
  if (method.requiresCommandRules && !rules) {
    throw denied("The native command method has no operation-registry authority.");
  }
  const verification = adapter.verify({
    method: input.identity.connectionMethod,
    scope: "machine",
    root: input.identity.root,
    executable,
    receipt,
    ...(rules ? { commandRules: rules, commandRuleAuthority: input.commandRuleAuthority } : {}),
  });
  if (verification.state !== "current") {
    throw denied(
      `The harness-native entry is not current: ${verification.reason ?? verification.state}.`,
    );
  }
  return { ...effective.access };
}

function safeFirstPartyRecord(record: ProjectHarnessIntegrationRecord): boolean {
  try {
    requireFirstPartyHarnessAdapter(record.harness);
    return true;
  } catch {
    return false;
  }
}

function machineApproval(value: unknown): MachineHarnessApproval {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { selected: false, maximumMethod: null, accessCeiling: { ...NO_ACCESS } };
  }
  const intent = value as {
    selected?: unknown;
    maximumMethod?: unknown;
    accessCeiling?: unknown;
  };
  if (
    typeof intent.selected !== "boolean" ||
    (intent.maximumMethod !== null && typeof intent.maximumMethod !== "string") ||
    !intent.accessCeiling ||
    typeof intent.accessCeiling !== "object" ||
    Array.isArray(intent.accessCeiling)
  ) {
    return { selected: false, maximumMethod: null, accessCeiling: { ...NO_ACCESS } };
  }
  return {
    selected: intent.selected,
    maximumMethod: intent.maximumMethod as string | null,
    accessCeiling: { ...(intent.accessCeiling as OperationAccess) },
  };
}

function deniedProjection(reason: string): ProjectHarnessAccessProjection {
  return { configured: true, access: { ...NO_ACCESS }, reason };
}

function denied(reason: string): HarnessOperationAccessDeniedError {
  return new HarnessOperationAccessDeniedError(reason);
}

function sameExecutable(
  left: VerifiedExecutableIdentity,
  right: VerifiedExecutableIdentity,
): boolean {
  return left.kind === right.kind &&
    left.path === right.path &&
    left.sha256 === right.sha256 &&
    left.size === right.size &&
    left.productMarker === right.productMarker &&
    left.packageName === right.packageName &&
    left.packageVersion === right.packageVersion &&
    left.packageRoot === right.packageRoot &&
    left.binRelativePath === right.binRelativePath;
}

function intersectAccess(left: OperationAccess, right: OperationAccess): OperationAccess {
  return {
    store: lower(left.store, right.store),
    project: lower(left.project, right.project),
    hostConfig: lower(left.hostConfig, right.hostConfig),
  };
}

function lower<T extends "none" | "read" | "write">(left: T, right: T): T {
  return (rank(left) <= rank(right) ? left : right) as T;
}

function rank(value: "none" | "read" | "write"): number {
  return value === "none" ? 0 : value === "read" ? 1 : 2;
}

function formatAccess(access: OperationAccess): string {
  return `store:${access.store}, project:${access.project}, hostConfig:${access.hostConfig}`;
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
