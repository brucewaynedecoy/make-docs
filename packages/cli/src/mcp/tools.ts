import path from "node:path";
import { z } from "zod";
import { classifyCompatibilityState } from "../compatibility";
import { getConfigRenderingLabels, loadMakeDocsConfigOrThrow } from "../config";
import { findReviewableManagedFileConflicts, planInstall } from "../install";
import { loadManifest } from "../manifest";
import { HARNESS_CALLER_IDENTITY_ENV } from "../harness-access/contract";
import { createExecutionContext } from "../operations/context";
import { listOperationDomains } from "../operations/index";
import {
  getOperation,
  invokeOperation,
  listOperationAccessFacts,
  listOperations,
  operationFullCliPath,
  type OperationDefinition,
} from "../operations/registry";
import { MCP_NAME_MAX_LENGTH, mcpNameForCliPath } from "../operations/name-catalog";
import {
  CommandRenamedError,
  findMcpMigrationAlias,
  listMcpMigrationAliases,
  migrationAliasState,
  type McpMigrationAlias,
  type MigrationAliasState,
} from "../operations/migration-aliases";
import type { OperationAccess } from "../operations/access";
import {
  assertMcpToolMetadata,
  cloneMcpToolMetadata,
  parseMcpServerProfile,
  type McpProfileOptions,
  type McpServerProfile,
  type McpToolMetadata,
} from "../operations/mcp-metadata";
import { cloneSelections, defaultSelections } from "../profile";
import type {
  InstallPlan,
  InstallSelections,
  PlannedAction,
} from "../types";
import { readPackageMeta } from "../utils";
import { WORK_REMINDER_MCP_LINE, isRefusedOperationValue } from "../operations/work/work-queue/reminder";

/**
 * CLI paths of the six hand-defined tools (PRD 39 R-NAME-3, owner decision
 * ND-10). No CLI command exists for them. Each MCP name is built from the
 * path it would have.
 */
const HAND_DEFINED_MCP_TOOL_PATHS = {
  mcp_domains_list: "mcp domains list",
  setup_status: "setup status",
  setup_manifest_read: "setup manifest read",
  setup_config_read: "setup config read",
  setup_compatibility_check: "setup compatibility check",
  setup_plan: "setup plan",
} as const;

type HandDefinedMcpToolName = keyof typeof HAND_DEFINED_MCP_TOOL_PATHS;

type McpToolInput = Record<string, unknown>;

export interface MakeDocsMcpToolDescriptor {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, z.ZodType>;
  /** Present for tools projected from the operation registry. */
  operation?: string;
  access?: OperationAccess;
  mcpReady?: boolean;
  /** Copied from canonical operation metadata, or declared on a non-operation tool. */
  mcp?: McpToolMetadata;
  _meta?: { ui: { resourceUri: string } };
}

interface DerivedMcpToolDescriptor extends MakeDocsMcpToolDescriptor {
  /** The registry identifier this tool is derived from. */
  operation: string;
}

const targetDirSchema = z
  .string()
  .optional()
  .describe("Project root to inspect. Defaults to the current working directory.");

const systemAssetMaterializationModeSchema = z.enum([
  "full-snapshot",
  "provider-backed",
  "hybrid-pinned-cache",
]);

/**
 * The six hand-defined non-operation tools: read-first inspection and
 * planning surfaces that are not registry operations. Everything else on
 * the MCP tool list is DERIVED from the operation registry below (R-REG-2).
 */
const HAND_DEFINED_MCP_TOOLS: (MakeDocsMcpToolDescriptor & {
  name: HandDefinedMcpToolName;
  mcp: McpToolMetadata;
})[] = [
  {
    name: "mcp_domains_list",
    mcp: { profiles: ["core"], defaultExposure: "eager" },
    title: "List Make Docs Operation Domains",
    description: "List deterministic operation domains shared by CLI and MCP tools.",
    inputSchema: {},
  },
  {
    name: "setup_status",
    mcp: { profiles: ["core", "setup"], defaultExposure: "eager" },
    title: "Inspect Make Docs Installed State",
    description:
      "Inspect manifest, config, compatibility, and package state for a make-docs project.",
    inputSchema: { targetDir: targetDirSchema },
  },
  {
    name: "setup_manifest_read",
    mcp: { profiles: ["core", "setup"], defaultExposure: "eager" },
    title: "Read Make Docs Manifest",
    description: "Read .make-docs/manifest.json without mutating the project.",
    inputSchema: { targetDir: targetDirSchema },
  },
  {
    name: "setup_config_read",
    mcp: { profiles: ["core", "setup"], defaultExposure: "eager" },
    title: "Read Make Docs Config",
    description: "Read .make-docs/config.yaml with default overlay diagnostics.",
    inputSchema: { targetDir: targetDirSchema },
  },
  {
    name: "setup_compatibility_check",
    mcp: { profiles: ["setup"], defaultExposure: "deferred" },
    title: "Classify Make Docs Compatibility State",
    description: "Run the same compatibility classifier used by the CLI.",
    inputSchema: { targetDir: targetDirSchema },
  },
  {
    name: "setup_plan",
    mcp: { profiles: ["setup"], defaultExposure: "deferred" },
    title: "Plan Make Docs Install Or Sync",
    description:
      "Create a dry-run install/sync plan using CLI planner semantics and without file writes.",
    inputSchema: {
      targetDir: targetDirSchema,
      selections: z.unknown().optional().describe("Optional InstallSelections override."),
      systemAssetMaterializationMode:
        systemAssetMaterializationModeSchema.optional(),
    },
  },
];

/**
 * The MCP tool name of a registry operation (PRD 39 R-NAME-3, R-MIG-3): its
 * CLI path after `make-docs`, with spaces and hyphens as underscores. No
 * other mapping exists. Registry IDs remain the operation authority.
 */
export function deriveMcpToolName(operationId: string): string {
  return mcpNameForCliPath(operationFullCliPath(operationId));
}

/**
 * Context-only tool arguments. They ride the execution context, never the
 * operation input; the generic dispatch strips them before delegating.
 */
const allowWriteSchema = z
  .boolean()
  .optional()
  .describe(
    "Set true to permit this mutating operation to write. Enforced uniformly by the operation core.",
  );
const dryRunSchema = z
  .boolean()
  .optional()
  .describe("Set true to plan rather than write; rides the execution context, not the input.");
const approvalsSchema = z
  .array(z.string())
  .optional()
  .describe(
    "Named approval tokens granted to the operation (e.g. reviewed-overwrite); rides the execution context, not the input.",
  );

/**
 * Registry input contracts are `z.object` / `z.looseObject`, which expose
 * `.shape`. Documented fallback: a non-object input schema derives no named
 * tool arguments — the generic dispatch still passes all non-context args
 * through as the operation input, and the core's own schema validation
 * remains authoritative.
 */
function operationInputShape(schema: OperationDefinition["inputSchema"]): Record<string, z.ZodType> {
  if (schema instanceof z.ZodObject) {
    return { ...(schema.shape as Record<string, z.ZodType>) };
  }
  return {};
}

function deriveToolInputSchema(definition: OperationDefinition): Record<string, z.ZodType> {
  return {
    ...operationInputShape(definition.inputSchema),
    ...(definition.mutates === "write" ? { allowWrite: allowWriteSchema } : {}),
    dryRun: dryRunSchema,
    approvals: approvalsSchema,
  };
}

function deriveToolDescription(definition: OperationDefinition): string {
  const parts = [
    definition.summary,
    `Access: Store ${definition.access.store}; project ${definition.access.project}; host configuration ${definition.access.hostConfig}.`,
  ];
  if (definition.status === "pending") {
    parts.push(
      `Pending: reserved registry identifier whose semantics land with ${definition.pendingLineage}; invocation is refused until then.`,
    );
  }
  if (definition.storeAdmission === "step") {
    parts.push("Mutating operation: its write step needs allowWrite=true and write access. Without them the tool still answers: it does its read steps, changes nothing, and says that the write step did not run.");
  } else if (definition.mutates === "write") {
    parts.push("Mutating operation: requires allowWrite=true, enforced by the operation core.");
  }
  if (definition.storeAdmission === "optional") {
    parts.push("Store access is optional. The tool still answers without it, and it uses the Store only when the Store is admitted.");
  }
  return parts.join(" ");
}

/**
 * The operation tool list (R-REG-2, R-MIG-3): every admitted registry
 * identifier gets one MCP name derived from its CLI path. Other tool fields come from its
 * registry definition.
 */
const DERIVED_MCP_OPERATION_TOOLS: DerivedMcpToolDescriptor[] = listOperations().map(
  (operation) => {
    const definition = getOperation(operation.id);
    const accessFact = listOperationAccessFacts().find((fact) => fact.operation === operation.id)!;
    return {
      name: deriveMcpToolName(operation.id),
      operation: operation.id,
      title: `Make Docs Operation ${operation.id}`,
      description: deriveToolDescription(definition),
      inputSchema: deriveToolInputSchema(definition),
      access: { ...accessFact.access },
      mcpReady: accessFact.mcpReady,
      ...(definition.mcp ? { mcp: cloneMcpToolMetadata(definition.mcp) } : {}),
      ...(definition.mcp?.uiResourceUri ? { _meta: { ui: { resourceUri: definition.mcp.uiResourceUri } } } : {}),
    };
  },
);

const DERIVED_TOOLS_BY_NAME = new Map<string, DerivedMcpToolDescriptor>(
  DERIVED_MCP_OPERATION_TOOLS.map((tool) => [tool.name, tool]),
);

export const MAKE_DOCS_MCP_TOOLS: MakeDocsMcpToolDescriptor[] = [
  ...HAND_DEFINED_MCP_TOOLS,
  ...DERIVED_MCP_OPERATION_TOOLS,
];

for (const tool of HAND_DEFINED_MCP_TOOLS) {
  if (tool.name !== mcpNameForCliPath(HAND_DEFINED_MCP_TOOL_PATHS[tool.name])) {
    throw new Error(`Hand-defined MCP tool ${tool.name} does not match its CLI path.`);
  }
}
for (const tool of MAKE_DOCS_MCP_TOOLS) {
  if (tool.name.length > MCP_NAME_MAX_LENGTH) {
    throw new Error(`MCP tool name ${tool.name} has more than ${MCP_NAME_MAX_LENGTH} characters.`);
  }
}
if (new Set(MAKE_DOCS_MCP_TOOLS.map((tool) => tool.name)).size !== MAKE_DOCS_MCP_TOOLS.length) {
  throw new Error("MCP tool names must be unique");
}

for (const tool of MAKE_DOCS_MCP_TOOLS) {
  if (tool.mcpReady !== false || tool.mcp !== undefined) {
    assertMcpToolMetadata(tool.name, tool.mcp);
  }
}

/**
 * List the ready tools assigned to the selected profile. Access policy runs
 * at invocation time so a caller can receive the typed not-configured,
 * unavailable, unsafe, or denied result instead of an incorrect tool-not-found result.
 */
export function listMakeDocsMcpTools(
  targetRoot = process.cwd(),
  options: McpProfileOptions = {},
): MakeDocsMcpToolDescriptor[] {
  const profile = parseMcpServerProfile(options.profile);
  void targetRoot;
  return MAKE_DOCS_MCP_TOOLS.filter((tool) => isToolInProfile(tool, profile)).map(
    (tool) => ({
      ...tool,
      ...(tool.access ? { access: { ...tool.access } } : {}),
      ...(tool.mcp ? { mcp: cloneMcpToolMetadata(tool.mcp) } : {}),
      ...(tool._meta ? { _meta: { ui: { ...tool._meta.ui } } } : {}),
    }),
  );
}

function isToolInProfile(tool: MakeDocsMcpToolDescriptor, profile: McpServerProfile): boolean {
  return tool.mcpReady !== false && (profile === "all" || tool.mcp!.profiles.includes(profile));
}

for (const alias of listMcpMigrationAliases()) {
  if (!MAKE_DOCS_MCP_TOOLS.some((tool) => tool.name === alias.newMcp)) {
    throw new Error(`MCP alias ${alias.formerMcp} names no current tool: ${alias.newMcp}.`);
  }
  if (MAKE_DOCS_MCP_TOOLS.some((tool) => tool.name === alias.formerMcp)) {
    throw new Error(`MCP alias ${alias.formerMcp} is also a current tool name.`);
  }
}

export interface ActiveMcpMigrationAlias extends McpMigrationAlias {
  state: Exclude<MigrationAliasState, "removed">;
}

/**
 * An old MCP tool name that still answers in this profile (PRD 39 R-MIG-1).
 * An alias answers only where its new tool is in the profile, and only until
 * it is removed. It is never in `tools/list`.
 */
function resolveMcpMigrationAlias(name: string, profile: McpServerProfile): ActiveMcpMigrationAlias | null {
  const alias = findMcpMigrationAlias(name);
  if (!alias) return null;
  const state = migrationAliasState();
  if (state === "removed") return null;
  const target = MAKE_DOCS_MCP_TOOLS.find((tool) => tool.name === alias.newMcp);
  if (!target || !isToolInProfile(target, profile)) return null;
  return { ...alias, state };
}

/** The old MCP tool names that answer in a profile for the running version, with their new tools. */
export function listActiveMcpMigrationAliases(options: McpProfileOptions = {}): ActiveMcpMigrationAlias[] {
  const profile = parseMcpServerProfile(options.profile);
  return listMcpMigrationAliases()
    .map((alias) => resolveMcpMigrationAlias(alias.formerMcp, profile))
    .filter((alias): alias is ActiveMcpMigrationAlias => alias !== null);
}

/**
 * Conformance seam (R-TEST-1): the derived tool-name/operation pairs, for
 * tests pinning derived-tool/registry parity in both directions.
 */
export function listDerivedMcpOperationTools(): { name: string; operation: string }[] {
  return DERIVED_MCP_OPERATION_TOOLS.map(({ name, operation }) => ({ name, operation }));
}

/** Structured MCP exposure facts from the same operation access authority. */
export function listDerivedMcpOperationAccessFacts(): Array<{
  name: string;
  operation: string;
  access: OperationAccess;
  mcpReady: boolean;
}> {
  return DERIVED_MCP_OPERATION_TOOLS.map(({ name, operation, access, mcpReady }) => ({
    name,
    operation,
    access: { ...access! },
    mcpReady: mcpReady === true,
  }));
}

/**
 * Parity check against the LIVE registry (R-TEST-1): every registry
 * identifier must have exactly one derived MCP tool and every derived tool
 * must map to a registry identifier with the derived spelling. Returns the
 * mismatches so tests can assert both the green path and the failure mode
 * with a stubbed/filtered tool list.
 */
export function verifyDerivedMcpToolParity(
  tools: { name: string; operation: string }[] = listDerivedMcpOperationTools(),
): {
  missingOperations: string[];
  unknownOperations: string[];
  misderivedNames: string[];
  duplicateNames: string[];
} {
  const registryIds = new Set(listOperations().map((operation) => operation.id));
  const byOperation = new Map<string, number>();
  const nameCounts = new Map<string, number>();
  const unknownOperations: string[] = [];
  const misderivedNames: string[] = [];
  for (const tool of tools) {
    byOperation.set(tool.operation, (byOperation.get(tool.operation) ?? 0) + 1);
    nameCounts.set(tool.name, (nameCounts.get(tool.name) ?? 0) + 1);
    if (!registryIds.has(tool.operation)) {
      unknownOperations.push(tool.operation);
    }
    if (registryIds.has(tool.operation) && tool.name !== deriveMcpToolName(tool.operation)) {
      misderivedNames.push(tool.name);
    }
  }
  const missingOperations = [...registryIds].filter((id) => (byOperation.get(id) ?? 0) !== 1);
  const duplicateNames = [...nameCounts.entries()]
    .filter(([, count]) => count > 1)
    .map(([name]) => name);
  return { missingOperations, unknownOperations, misderivedNames, duplicateNames };
}

export async function callMakeDocsMcpTool(
  name: string,
  args: McpToolInput = {},
  options: McpProfileOptions = {},
): Promise<Record<string, unknown>> {
  const profile = parseMcpServerProfile(options.profile);
  const alias = resolveMcpMigrationAlias(name, profile);
  if (alias) {
    if (alias.state === "renamed") {
      throw new CommandRenamedError({
        formerName: alias.formerMcp,
        renamedTo: alias.newMcp,
        renamedIn: alias.renamedIn,
        surface: "mcp",
      });
    }
    try {
      return { ...(await callMakeDocsMcpTool(alias.newMcp, args, { profile })), renamedTo: alias.newMcp };
    } catch (error) {
      if (error !== null && typeof error === "object" && !("renamedTo" in error)) {
        Object.assign(error, { renamedTo: alias.newMcp });
      }
      throw error;
    }
  }
  const tool = MAKE_DOCS_MCP_TOOLS.find((candidate) => candidate.name === name);
  if (tool === undefined || !isToolInProfile(tool, profile)) {
    throw new Error(`Unknown make-docs MCP tool: ${name}`);
  }
  switch (name) {
    case "mcp_domains_list":
      return mcpPayload(name, listOperationDomains());
    case "setup_status":
      return mcpPayload(name, await readInstalledState(resolveTargetDir(args)));
    case "setup_manifest_read":
      return mcpPayload(name, readManifest(resolveTargetDir(args)));
    case "setup_config_read":
      return mcpPayload(name, readConfig(resolveTargetDir(args)));
    case "setup_compatibility_check":
      return mcpPayload(
        name,
        await classifyCompatibilityState({ targetDir: resolveTargetDir(args) }),
      );
    case "setup_plan":
      return mcpPayload(name, await buildInstallPlan(resolveTargetDir(args), args));
  }
  const derived = DERIVED_TOOLS_BY_NAME.get(name);
  if (derived === undefined) {
    throw new Error(`Unknown make-docs MCP tool: ${name}`);
  }
  const targetRoot = resolveOperationTargetDir(args);
  const effective = listMakeDocsMcpTools(targetRoot, { profile }).find(
    (candidate) => candidate.name === name,
  );
  const invocation = await invokeDerivedOperationTool(derived.operation, args);
  // W35 R0 P2 (PRD 25 R-MCP-REMIND-1): the reminder is one field of the result
  // object, so it reaches a host through `content` and `structuredContent`. A
  // tool with a fixed result schema carries none.
  // A refusal carries none, as a failed CLI command prints none. The field
  // names the command and the tool, because an MCP-only caller has no command.
  const reminder = invocation.reminder !== undefined && getOperation(derived.operation).mcpResultSchema === undefined && !isRefusedOperationValue(invocation.value)
    ? { reminder: WORK_REMINDER_MCP_LINE }
    : {};
  return mcpPayload(name, invocation.value, {
    operation: derived.operation,
    access: { ...derived.access! },
    mcpReady: effective?.mcpReady === true,
  }, reminder);
}

/**
 * The single generic dispatch path for every derived operation tool
 * (R-CORE-1): strip the context-only fields (`allowWrite`, `dryRun`,
 * `approvals`) into the execution context, pass every remaining argument
 * through as the operation input, and delegate. Input validation, write
 * gating, named approvals, and pending-lineage refusal are all enforced
 * uniformly by the operation core; this adapter carries no per-tool checks.
 */
async function invokeDerivedOperationTool(id: string, args: McpToolInput): Promise<{ value: unknown; reminder?: string }> {
  const { allowWrite, dryRun, approvals, ...input } = args;
  const invocation = await invokeOperation(
    id,
    input,
    createExecutionContext({
      surface: "mcp",
      route: "mcp",
      callerIdentityRaw: process.env[HARNESS_CALLER_IDENTITY_ENV],
      mcpConnectionId: process.env.MAKE_DOCS_MCP_CONNECTION_ID,
      mcpConnectionKey: process.env.MAKE_DOCS_MCP_CONNECTION_KEY,
      writesAllowed: allowWrite === true,
      dryRun: dryRun === true,
      approvals: Array.isArray(approvals) ? approvals.map(String) : [],
    }),
  );
  return { value: invocation.value, ...(invocation.reminder ? { reminder: invocation.reminder } : {}) };
}

async function readInstalledState(targetDir: string): Promise<Record<string, unknown>> {
  return {
    targetDir,
    package: readPackageMeta(),
    manifest: readManifest(targetDir),
    config: readConfig(targetDir),
    compatibility: await classifyCompatibilityState({ targetDir }),
    operationDomains: listOperationDomains(),
  };
}

function readManifest(targetDir: string): Record<string, unknown> {
  const manifest = loadManifest(targetDir);
  return {
    targetDir,
    present: manifest !== null,
    manifest,
  };
}

function readConfig(targetDir: string): Record<string, unknown> {
  const loaded = loadMakeDocsConfigOrThrow(targetDir);
  return {
    targetDir,
    present: loaded.present,
    valid: loaded.valid,
    configPath: loaded.configPath,
    diagnostics: loaded.diagnostics,
    config: loaded.config,
    renderingLabels: getConfigRenderingLabels(loaded.config),
  };
}

async function buildInstallPlan(
  targetDir: string,
  args: McpToolInput,
): Promise<Record<string, unknown>> {
  const existingManifest = loadManifest(targetDir);
  const selections = resolveSelections(existingManifest?.selections, args.selections);
  const plan = await planInstall({
    targetDir,
    selections,
    existingManifest,
    packageMeta: readPackageMeta(),
    systemAssetMaterializationMode:
      systemAssetMaterializationModeSchema.optional().parse(
        args.systemAssetMaterializationMode,
      ),
  });
  const conflicts = findReviewableManagedFileConflicts(plan);

  return summarizeInstallPlan(plan, conflicts);
}

function summarizeInstallPlan(
  plan: InstallPlan,
  conflicts: ReturnType<typeof findReviewableManagedFileConflicts>,
): Record<string, unknown> {
  const counts = {
    create: 0,
    generate: 0,
    noop: 0,
    removeManaged: 0,
    skipConflict: 0,
    update: 0,
    updateConflict: 0,
  };

  for (const action of plan.actions) {
    switch (action.type) {
      case "create":
        counts.create += 1;
        break;
      case "generate":
        counts.generate += 1;
        break;
      case "noop":
        counts.noop += 1;
        break;
      case "remove-managed":
        counts.removeManaged += 1;
        break;
      case "skip-conflict":
        counts.skipConflict += 1;
        break;
      case "update":
      case "strip-managed-block":
        counts.update += 1;
        break;
      case "update-conflict":
        counts.updateConflict += 1;
        break;
    }
  }

  return {
    packageName: plan.packageName,
    packageVersion: plan.packageVersion,
    profile: plan.profile,
    systemAssetMaterialization: plan.systemAssetMaterialization,
    actionCounts: counts,
    actions: plan.actions.map(summarizeAction),
    reviewableManagedFileConflicts: conflicts,
    writesFiles: false,
  };
}

function summarizeAction(action: PlannedAction): Record<string, unknown> {
  const { content: _content, ...summary } = action;
  return summary;
}

function resolveSelections(
  manifestSelections: InstallSelections | undefined,
  override: unknown,
): InstallSelections {
  if (override !== undefined) {
    return override as InstallSelections;
  }
  if (manifestSelections) {
    return cloneSelections(manifestSelections);
  }
  return defaultSelections();
}

function mcpPayload(
  tool: string,
  result: unknown,
  details: Record<string, unknown> = {},
  after: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    tool,
    source: "mcp",
    ...details,
    result,
    ...after,
  };
}

function resolveOperationTargetDir(args: McpToolInput): string {
  return path.resolve(
    optionalString(args, "targetRoot") ?? optionalString(args, "targetDir") ?? process.cwd(),
  );
}

function resolveTargetDir(args: McpToolInput): string {
  return path.resolve(optionalString(args, "targetDir") ?? process.cwd());
}

function optionalString(args: McpToolInput, key: string): string | undefined {
  const value = args[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}
