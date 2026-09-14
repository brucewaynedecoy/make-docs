import os from "node:os";
import {
  HARNESS_CALLER_IDENTITY_ENV,
  parseHarnessCallerIdentity,
  requireFirstPartyHarnessAdapter,
  validateHarnessMethodSelection,
  verifyMakeDocsExecutable,
  type HarnessCallerIdentity,
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
): ProjectHarnessAccessProjection {
  const records = loadMakeDocsConfigOrThrow(targetRoot).config.harnessIntegrations;
  if (records.length === 0) {
    return {
      configured: false,
      access: { ...FULL_OPERATION_ACCESS },
      reason: "The project has no harness access override.",
    };
  }
  let access = { ...FULL_OPERATION_ACCESS };
  for (const record of records) {
    if (!safeFirstPartyRecord(record)) {
      return deniedProjection(`Project harness '${record.harness}' has no runtime adapter.`);
    }
    if (record.mode === "disable" || (record.method && record.method !== method)) {
      access = { ...NO_ACCESS };
      continue;
    }
    if (record.accessCeiling) access = intersectAccess(access, record.accessCeiling);
  }
  return {
    configured: true,
    access,
    reason: "Access is the intersection of every applicable project harness limit.",
  };
}

/** Resolve verified effective access for one exact caller or all project limits. */
export function resolveHarnessOperationPolicy(input: {
  targetRoot: string;
  storeRoot: string;
  callerIdentityRaw?: string;
  commandRuleAuthority?: HarnessCommandRuleAuthority;
}): HarnessOperationPolicyResult {
  const loadedProject = loadMakeDocsConfigOrThrow(input.targetRoot);
  const records = loadedProject.config.harnessIntegrations;
  const rawIdentity = input.callerIdentityRaw ?? process.env[HARNESS_CALLER_IDENTITY_ENV];
  if (!rawIdentity && records.length === 0) {
    return {
      configured: false,
      verified: false,
      access: { ...FULL_OPERATION_ACCESS },
      harnesses: [],
      methods: [],
      reason: "No harness caller or project harness limit applies to this direct CLI call.",
    };
  }

  const storeRoot = validateInstallationStoreRoot(input.targetRoot, input.storeRoot);
  const global = loadGlobalConfig(storeRoot).config;
  if (rawIdentity) {
    let identity: HarnessCallerIdentity;
    try {
      identity = parseHarnessCallerIdentity(rawIdentity);
    } catch (error) {
      throw denied(`The harness caller identity is invalid: ${message(error)}`);
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
      reason: "The exact harness caller, Store receipt, package binary, and native entry are current.",
    };
  }

  let access = { ...FULL_OPERATION_ACCESS };
  const methods: HarnessConnectionMethod[] = [];
  for (const project of records) {
    if (!safeFirstPartyRecord(project)) {
      return {
        configured: true,
        verified: false,
        access: { ...NO_ACCESS },
        harnesses: records.map((record) => record.harness),
        methods,
        reason: `Project harness '${project.harness}' has no verified runtime adapter.`,
      };
    }
    const machine = machineApproval(global.settings.harnesses[project.harness]);
    const effective = resolveEffectiveHarnessIntegration(project, machine, project.harness);
    if (!effective.enabled || !effective.method) {
      access = { ...NO_ACCESS };
      continue;
    }
    const method = effective.method as HarnessConnectionMethod;
    methods.push(method);
    const executable = currentReceiptExecutable(
      input.targetRoot,
      storeRoot,
      project.harness as HarnessId,
      method,
    );
    access = intersectAccess(access, verifyIntegration({
      targetRoot: input.targetRoot,
      storeRoot,
      project,
      machine,
      identity: {
        schemaVersion: 1,
        kind: "make-docs-harness-caller",
        adapterId: requireFirstPartyHarnessAdapter(project.harness).id,
        adapterVersion: requireFirstPartyHarnessAdapter(project.harness).version,
        harnessId: project.harness as HarnessId,
        connectionMethod: method,
        scope: "machine",
        root: os.homedir(),
        executable,
      },
      commandRuleAuthority: input.commandRuleAuthority,
    }));
  }
  return {
    configured: true,
    verified: true,
    access,
    harnesses: records.map((record) => record.harness),
    methods,
    reason: "Unknown caller access is the verified intersection of all project harness limits.",
  };
}

export function assertHarnessOperationAllowed(input: {
  operation: string;
  required: OperationAccess;
  targetRoot: string;
  storeRoot: string;
  callerIdentityRaw?: string;
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

function currentReceiptExecutable(
  targetRoot: string,
  storeRoot: string,
  harnessId: HarnessId,
  method: HarnessConnectionMethod,
): VerifiedExecutableIdentity {
  const receipt = readCurrentHarnessIntegrationReceipt(
    targetRoot,
    storeRoot,
    "machine",
    harnessId,
    method,
  );
  if (!receipt) throw denied(`No current Store receipt proves ${harnessId} ${method}.`);
  return receipt.executable;
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
