import {
  encodeHarnessCallerIdentity,
  parseHarnessCallerIdentityValue,
  parseHarnessCallerReference,
  requireFirstPartyHarnessAdapter,
  sha256,
  validateHarnessMethodSelection,
  verifyMakeDocsExecutable,
  type HarnessCallerIdentity,
  type ParsedHarnessCallerIdentity,
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
import { StoreAccessStateError, makeStoreAccessStateError } from "./store-access";

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

export class HarnessOperationAccessDeniedError extends StoreAccessStateError {
  constructor(
    operation: string,
    message: string,
    targetRoot: string,
    code: "store-not-configured" | "store-denied" = "store-denied",
    nextAction?: string,
  ) {
    super(
      code,
      operation,
      message,
      nextAction ?? (code === "store-not-configured"
        ? `Run \`make-docs setup --generic-mcp-client <label> --target ${JSON.stringify(targetRoot)}\` for an unsupported MCP client, or run normal setup and select Codex or Claude Code.`
        : `Run \`make-docs setup --target ${JSON.stringify(targetRoot)}\` to review machine and project access.`),
      { projectRoot: targetRoot },
    );
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
  let identity: ParsedHarnessCallerIdentity | undefined;
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

  const record = records.find(candidate => candidate.harness === identity.harnessId);
  if (identity.kind === "make-docs-generic-mcp-caller") {
    if (
      method !== "mcp" ||
      identity.connectionMethod !== "mcp" ||
      identity.adapterId !== "generic-mcp" ||
      !record ||
      record.mode !== "narrow" ||
      record.method !== "mcp"
    ) {
      return deniedProjection("The generic MCP tool-list identity has no matching project intent.");
    }
    return {
      configured: true,
      access: record.accessCeiling ? { ...record.accessCeiling } : { ...FULL_OPERATION_ACCESS },
      reason: `Access uses the reviewed '${record.harness}' generic MCP project limit.`,
    };
  }

  let adapter: ReturnType<typeof requireFirstPartyHarnessAdapter>;
  try {
    adapter = requireFirstPartyHarnessAdapter(identity.harnessId);
  } catch (error) {
    return deniedProjection(`The harness tool-list identity is not supported: ${message(error)}`);
  }
  if (
    identity.kind !== "make-docs-harness-caller" ||
    identity.adapterId !== adapter.id ||
    identity.adapterVersion !== adapter.version ||
    identity.connectionMethod !== method ||
    identity.scope !== "machine"
  ) {
    return deniedProjection("The harness tool-list identity does not match the active adapter method.");
  }

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
  operation?: string;
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
  let identity: ParsedHarnessCallerIdentity;
  try {
    identity = resolveCallerIdentity(input);
  } catch (error) {
    throw denied(input.operation ?? "unknown", `The harness caller identity is invalid: ${message(error)}`, input.targetRoot);
  }
  if (input.route === "mcp" && identity.connectionMethod !== "mcp") {
    throw denied(input.operation ?? "unknown", "The MCP route needs an exact MCP caller identity.", input.targetRoot);
  }
  if (input.route === "native-rule" && identity.connectionMethod === "mcp") {
    throw denied(input.operation ?? "unknown", "The native-rule route needs an exact command-rule or permission-rule caller identity.", input.targetRoot);
  }
  const project = records.find((record) => record.harness === identity.harnessId);
  const access = identity.kind === "make-docs-generic-mcp-caller"
    ? verifyGenericMcpIntegration({
        targetRoot: input.targetRoot,
        project,
        machine: global.settings.harnesses[identity.harnessId],
        identity,
        operation: input.operation ?? "unknown",
      })
    : verifyIntegration({
        targetRoot: input.targetRoot,
        storeRoot,
        project,
        machine: machineApproval(global.settings.harnesses[identity.harnessId]),
        identity,
        operation: input.operation ?? "unknown",
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
  if (
    input.route !== "direct-cli" &&
    loadMakeDocsConfigOrThrow(input.targetRoot).config.harnessIntegrations.length === 0
  ) {
    throw new HarnessOperationAccessDeniedError(
      input.operation,
      "This project has no Store access configuration for an agent harness.",
      input.targetRoot,
      "store-not-configured",
    );
  }
  let policy: HarnessOperationPolicyResult;
  try {
    policy = resolveHarnessOperationPolicy(input);
  } catch (error) {
    if (error instanceof StoreAccessStateError) {
      if (error.operation === "unknown") {
        throw makeStoreAccessStateError({
          code: error.code,
          operation: input.operation,
          reason: error.reason,
          nextAction: error.nextAction,
          details: error.details,
        });
      }
      throw error;
    }
    const record = error && typeof error === "object" ? error as Record<string, unknown> : {};
    const issue = record.issue && typeof record.issue === "object"
      ? record.issue as Record<string, unknown>
      : null;
    if (record.code === "store-unavailable") {
      const unsafe = issue?.code === "corrupt" || issue?.code === "schema-newer" || issue?.code === "schema-unknown";
      throw makeStoreAccessStateError({
        code: unsafe ? "store-unsafe" : "store-unavailable",
        operation: input.operation,
        reason: message(error),
        nextAction: unsafe
          ? `Run \`make-docs project state status --target-root ${JSON.stringify(input.targetRoot)}\` and review the Store state.`
          : "Restore access to the configured Make Docs Store, then retry only this operation.",
        details: { projectRoot: input.targetRoot, ...(issue ? { issue: { ...issue } } : {}) },
      });
    }
    if (["writer-active", "ownership-unverified", "recovery-required", "snapshot-drift"].includes(String(record.code))) {
      throw makeStoreAccessStateError({
        code: "store-unsafe",
        operation: input.operation,
        reason: message(error),
        nextAction: `Run \`make-docs project state status --target-root ${JSON.stringify(input.targetRoot)}\` and use its exact recovery action.`,
        details: { projectRoot: input.targetRoot, priorCode: record.code },
      });
    }
    throw denied(input.operation, message(error), input.targetRoot);
  }
  if (!policy.configured && input.route !== "direct-cli") {
    throw new HarnessOperationAccessDeniedError(
      input.operation,
      "This project has no Store access configuration for an agent harness.",
      input.targetRoot,
      "store-not-configured",
    );
  }
  if (!accessAtMost(input.required, policy.access)) {
    throw denied(
      input.operation,
      `Harness access for this project does not allow operation '${input.operation}'. ` +
        `It needs ${formatAccess(input.required)}, but effective access is ${formatAccess(policy.access)}.`,
      input.targetRoot,
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
  let identity: ParsedHarnessCallerIdentity;
  try {
    identity = resolveCallerIdentity(input);
  } catch (error) {
    throw denied(input.operation, `The harness caller identity is invalid: ${message(error)}`, input.targetRoot);
  }
  if (input.route === "mcp" && identity.connectionMethod !== "mcp") {
    throw denied(input.operation, "The MCP route needs an exact MCP caller identity.", input.targetRoot);
  }
  if (input.route === "native-rule" && identity.connectionMethod === "mcp") {
    throw denied(input.operation, "The native-rule route needs an exact command-rule or permission-rule caller identity.", input.targetRoot);
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
      input.operation,
      `Harness access for this project does not allow operation '${input.operation}'. ` +
        `It needs ${formatAccess(input.required)}, but effective access is ${formatAccess(projection.access)}.`,
      input.targetRoot,
    );
  }
  return projection;
}

function resolveCallerIdentity(input: {
  callerIdentityRaw?: string;
  callerReference?: HarnessCallerReference;
  runtimeExecutablePath?: string;
}): ParsedHarnessCallerIdentity {
  if (input.callerIdentityRaw && input.callerReference) {
    throw new Error("The harness caller identity and reference cannot be used together.");
  }
  if (input.callerIdentityRaw) return parseHarnessCallerIdentityValue(input.callerIdentityRaw);
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
  operation: string;
}): OperationAccess {
  const adapter = requireFirstPartyHarnessAdapter(input.identity.harnessId);
  if (
    input.identity.adapterId !== adapter.id ||
    input.identity.adapterVersion !== adapter.version ||
    input.identity.scope !== "machine"
  ) {
    throw denied(input.operation, "The harness caller does not match the active first-party adapter.", input.targetRoot);
  }
  const effective = resolveEffectiveHarnessIntegration(
    input.project,
    input.machine,
    input.identity.harnessId,
  );
  if (!effective.enabled || effective.method !== input.identity.connectionMethod) {
    throw denied(input.operation, "The project and machine settings do not admit this harness method.", input.targetRoot);
  }
  const method = validateHarnessMethodSelection({
    harnessId: input.identity.harnessId,
    method: input.identity.connectionMethod,
    scope: "machine",
  });
  if (!method) throw denied(input.operation, "The harness method is disabled.", input.targetRoot);
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
    throw denied(input.operation, "No exact current Store receipt proves this harness caller.", input.targetRoot);
  }
  let executable: VerifiedExecutableIdentity;
  try {
    executable = verifyMakeDocsExecutable({
      executablePath: input.identity.executable.path,
      expectedSha256: input.identity.executable.sha256,
    });
  } catch (error) {
    throw denied(input.operation, `The active Make Docs package binary is not verified: ${message(error)}`, input.targetRoot);
  }
  if (!sameExecutable(executable, receipt.executable)) {
    throw denied(input.operation, "The current package binary differs from the harness receipt.", input.targetRoot);
  }
  const rules = method.requiresCommandRules
    ? input.commandRuleAuthority?.validate(input.commandRuleAuthority.list())
    : undefined;
  if (method.requiresCommandRules && !rules) {
    throw denied(input.operation, "The native command method has no operation-registry authority.", input.targetRoot);
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
      input.operation,
      `The harness-native entry is not current: ${verification.reason ?? verification.state}.`,
      input.targetRoot,
    );
  }
  return { ...effective.access };
}

function verifyGenericMcpIntegration(input: {
  targetRoot: string;
  project: ProjectHarnessIntegrationRecord | undefined;
  machine: unknown;
  identity: Extract<ParsedHarnessCallerIdentity, { kind: "make-docs-generic-mcp-caller" }>;
  operation: string;
}): OperationAccess {
  if (!input.project) {
    const label = input.identity.harnessId.slice("generic-mcp-".length);
    throw new HarnessOperationAccessDeniedError(
      input.operation,
      "This generic MCP client has no reviewed project access intent.",
      input.targetRoot,
      "store-not-configured",
      `Run \`make-docs setup --generic-mcp-client ${label} --target ${JSON.stringify(input.targetRoot)}\` to add project access, then retry only this operation.`,
    );
  }
  if (input.project.mode !== "narrow" || input.project.method !== "mcp") {
    throw denied(input.operation, "This generic MCP client has no reviewed project access intent.", input.targetRoot);
  }
  if (!input.machine || typeof input.machine !== "object" || Array.isArray(input.machine)) {
    throw denied(input.operation, "This generic MCP client has no reviewed machine profile.", input.targetRoot);
  }
  const machine = input.machine as Record<string, unknown>;
  if (
    machine.selected !== true ||
    machine.maximumMethod !== "mcp" ||
    machine.profileKind !== "generic-mcp" ||
    machine.lifecycleState !== "active" ||
    machine.clientLabel !== input.identity.harnessId.slice("generic-mcp-".length) ||
    machine.machineRoot !== input.identity.root ||
    typeof machine.proofSha256 !== "string" ||
    !/^[a-f0-9]{64}$/.test(machine.proofSha256) ||
    sha256(input.identity.proof) !== machine.proofSha256
  ) {
    throw denied(input.operation, "The generic MCP identity proof is absent, stale, or does not match the reviewed profile.", input.targetRoot);
  }
  let executable: VerifiedExecutableIdentity;
  try {
    executable = verifyMakeDocsExecutable({
      executablePath: input.identity.executable.launchPath ?? input.identity.executable.path,
      expectedSha256: input.identity.executable.sha256,
    });
  } catch (error) {
    throw denied(input.operation, `The active Make Docs package binary is not verified: ${message(error)}`, input.targetRoot);
  }
  if (!sameExecutable(executable, input.identity.executable)) {
    throw denied(input.operation, "The current package binary differs from the generic MCP profile.", input.targetRoot);
  }
  const expectedConfiguration = {
    mcpServers: {
      "make-docs": {
        command: executable.path,
        args: ["mcp"],
        env: { MAKE_DOCS_HARNESS_CALLER_IDENTITY: encodeHarnessCallerIdentity(input.identity) },
      },
    },
  };
  if (
    typeof machine.configurationDigest !== "string" ||
    sha256(JSON.stringify(expectedConfiguration)) !== machine.configurationDigest
  ) {
    throw denied(input.operation, "The generic MCP configuration does not match the reviewed profile.", input.targetRoot);
  }
  const machineAccess = machineApproval(machine).accessCeiling;
  return intersectAccess(machineAccess, input.project.accessCeiling ?? FULL_OPERATION_ACCESS);
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

function denied(operation: string, reason: string, targetRoot: string): HarnessOperationAccessDeniedError {
  return new HarnessOperationAccessDeniedError(operation, reason, targetRoot);
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
