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
  type OperationDefinition,
} from "../operations/registry";
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

type HandDefinedMcpToolName =
  | "domains"
  | "install_status"
  | "manifest"
  | "config"
  | "compatibility"
  | "install_plan";

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
    name: "domains",
    mcp: { profiles: ["core"], defaultExposure: "eager" },
    title: "List Make Docs Operation Domains",
    description: "List deterministic operation domains shared by CLI and MCP tools.",
    inputSchema: {},
  },
  {
    name: "install_status",
    mcp: { profiles: ["core", "setup"], defaultExposure: "eager" },
    title: "Inspect Make Docs Installed State",
    description:
      "Inspect manifest, config, compatibility, and package state for a make-docs project.",
    inputSchema: { targetDir: targetDirSchema },
  },
  {
    name: "manifest",
    mcp: { profiles: ["core", "setup"], defaultExposure: "eager" },
    title: "Read Make Docs Manifest",
    description: "Read .make-docs/manifest.json without mutating the project.",
    inputSchema: { targetDir: targetDirSchema },
  },
  {
    name: "config",
    mcp: { profiles: ["core", "setup"], defaultExposure: "eager" },
    title: "Read Make Docs Config",
    description: "Read .make-docs/config.yaml with default overlay diagnostics.",
    inputSchema: { targetDir: targetDirSchema },
  },
  {
    name: "compatibility",
    mcp: { profiles: ["setup"], defaultExposure: "deferred" },
    title: "Classify Make Docs Compatibility State",
    description: "Run the same compatibility classifier used by the CLI.",
    inputSchema: { targetDir: targetDirSchema },
  },
  {
    name: "install_plan",
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
 * W26 R1 MCP presentation names. Registry IDs remain the operation authority.
 */
export const MCP_TOOL_NAME_BY_OPERATION: Readonly<Record<string, string>> = Object.freeze({
  "prd.authority.validate": "prd_validate",
  "performance.evidence.validate": "performance_validate",
  "work.item.resolve": "work_item_resolve",
  "work.evidence.record": "evidence_record",
  "work.evidence.read": "evidence_read",
  "work.backlog.snapshot": "backlog_snapshot",
  "work.backlog-cache.lookup": "backlog_cache_read",
  "work.backlog-cache.write": "backlog_cache_write",
  "resource.list": "resource_list",
  "resource.read": "resource_read",
  "resource.ensure": "resource_ensure",
  "project.state.status": "project_status",
  "project.state.recover": "project_recover",
  "project.persona.list": "personas",
  "project.layout.preview": "layout_preview",
  "project.layout.prepare": "layout_prepare",
  "project.layout.apply": "layout_apply",
  "project.layout.verify": "layout_verify",
  "project.surface.ensure": "surface_ensure",
  "project.path-hygiene.validate": "paths_validate",
  "project.path-hygiene.repair": "paths_repair",
  "lifecycle.start": "lifecycle_start",
  "lifecycle.show": "lifecycle_show",
  "lifecycle.list": "lifecycle_list",
  "lifecycle.checkpoint": "lifecycle_checkpoint",
  "lifecycle.pause": "lifecycle_pause",
  "lifecycle.resume": "lifecycle_resume",
  "lifecycle.attach-evidence": "lifecycle_attach_evidence",
  "lifecycle.complete": "lifecycle_complete",
  "lifecycle.fail": "lifecycle_fail",
  "lifecycle.abandon": "lifecycle_abandon",
  "uat.scenario.validate": "uat_scenario_validate",
  "uat.persona.resolve": "uat_persona_resolve",
  "uat.target.validate": "uat_target_validate",
  "uat.evidence-reference.validate": "uat_evidence_validate",
  "uat.finding.validate": "uat_finding_validate",
  "uat.result.validate": "uat_result_validate",
});

export function deriveMcpToolName(operationId: string): string {
  const name = MCP_TOOL_NAME_BY_OPERATION[operationId];
  if (name === undefined) {
    throw new Error(`Missing MCP tool name for operation: ${operationId}`);
  }
  return name;
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
  if (definition.mutates === "write") {
    parts.push("Mutating operation: requires allowWrite=true, enforced by the operation core.");
  }
  return parts.join(" ");
}

/**
 * The operation tool list (R-REG-2, R-MIG-3): every admitted registry
 * identifier gets one mapped MCP name. Other tool fields come from its
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

const registryToolIds = new Set(listOperations().map((operation) => operation.id));
const mappedToolIds = Object.keys(MCP_TOOL_NAME_BY_OPERATION);
if (
  mappedToolIds.some((id) => !registryToolIds.has(id)) ||
  [...registryToolIds].some((id) => !Object.hasOwn(MCP_TOOL_NAME_BY_OPERATION, id))
) {
  throw new Error("MCP tool name map must match admitted registry operations");
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
    }),
  );
}

function isToolInProfile(tool: MakeDocsMcpToolDescriptor, profile: McpServerProfile): boolean {
  return tool.mcpReady !== false && (profile === "all" || tool.mcp!.profiles.includes(profile));
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
  const tool = MAKE_DOCS_MCP_TOOLS.find((candidate) => candidate.name === name);
  if (tool === undefined || !isToolInProfile(tool, profile)) {
    throw new Error(`Unknown make-docs MCP tool: ${name}`);
  }
  switch (name) {
    case "domains":
      return mcpPayload(name, listOperationDomains());
    case "install_status":
      return mcpPayload(name, await readInstalledState(resolveTargetDir(args)));
    case "manifest":
      return mcpPayload(name, readManifest(resolveTargetDir(args)));
    case "config":
      return mcpPayload(name, readConfig(resolveTargetDir(args)));
    case "compatibility":
      return mcpPayload(
        name,
        await classifyCompatibilityState({ targetDir: resolveTargetDir(args) }),
      );
    case "install_plan":
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
  return mcpPayload(name, await invokeDerivedOperationTool(derived.operation, args), {
    operation: derived.operation,
    access: { ...derived.access! },
    mcpReady: effective?.mcpReady === true,
  });
}

/**
 * The single generic dispatch path for every derived operation tool
 * (R-CORE-1): strip the context-only fields (`allowWrite`, `dryRun`,
 * `approvals`) into the execution context, pass every remaining argument
 * through as the operation input, and delegate. Input validation, write
 * gating, named approvals, and pending-lineage refusal are all enforced
 * uniformly by the operation core; this adapter carries no per-tool checks.
 */
async function invokeDerivedOperationTool(id: string, args: McpToolInput): Promise<unknown> {
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
  return invocation.value;
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
): Record<string, unknown> {
  return {
    tool,
    source: "mcp",
    ...details,
    result,
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
