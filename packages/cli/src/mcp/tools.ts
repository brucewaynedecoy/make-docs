import path from "node:path";
import { z } from "zod";
import { classifyCompatibilityState } from "../compatibility";
import { getConfigRenderingLabels, loadMakeDocsConfigOrThrow } from "../config";
import { findReviewableManagedFileConflicts, planInstall } from "../install";
import { loadManifest } from "../manifest";
import { createExecutionContext } from "../operations/context";
import { listOperationDomains } from "../operations/index";
import {
  getOperation,
  invokeOperation,
  listOperations,
  type OperationDefinition,
} from "../operations/registry";
import { cloneSelections, defaultSelections } from "../profile";
import type {
  InstallPlan,
  InstallSelections,
  PlannedAction,
} from "../types";
import { readPackageMeta } from "../utils";

type HandDefinedMcpToolName =
  | "make_docs_operation_domains"
  | "make_docs_installed_state"
  | "make_docs_manifest_read"
  | "make_docs_config_read"
  | "make_docs_compatibility_classify"
  | "make_docs_install_plan";

type McpToolInput = Record<string, unknown>;

export interface MakeDocsMcpToolDescriptor {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, z.ZodType>;
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
const HAND_DEFINED_MCP_TOOLS: (MakeDocsMcpToolDescriptor & { name: HandDefinedMcpToolName })[] = [
  {
    name: "make_docs_operation_domains",
    title: "List Make Docs Operation Domains",
    description: "List deterministic operation domains shared by CLI and MCP tools.",
    inputSchema: {},
  },
  {
    name: "make_docs_installed_state",
    title: "Inspect Make Docs Installed State",
    description:
      "Inspect manifest, config, compatibility, and package state for a make-docs project.",
    inputSchema: { targetDir: targetDirSchema },
  },
  {
    name: "make_docs_manifest_read",
    title: "Read Make Docs Manifest",
    description: "Read .make-docs/manifest.json without mutating the project.",
    inputSchema: { targetDir: targetDirSchema },
  },
  {
    name: "make_docs_config_read",
    title: "Read Make Docs Config",
    description: "Read .make-docs/config.yaml with default overlay diagnostics.",
    inputSchema: { targetDir: targetDirSchema },
  },
  {
    name: "make_docs_compatibility_classify",
    title: "Classify Make Docs Compatibility State",
    description: "Run the same compatibility classifier used by the CLI.",
    inputSchema: { targetDir: targetDirSchema },
  },
  {
    name: "make_docs_install_plan",
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
 * MCP tool-name derivation rule (R-MIG-3): `make_docs_` + the registry
 * identifier with its `.` and `-` separators mapped to `_`
 * (`playbook.catalog` -> `make_docs_playbook_catalog`,
 * `package.surface-resolve` -> `make_docs_package_surface_resolve`).
 */
export function deriveMcpToolName(operationId: string): string {
  return `make_docs_${operationId.replace(/[.-]/g, "_")}`;
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
  const parts = [definition.summary];
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
 * The derived operation tool list (R-REG-2, R-MIG-3): every registry
 * identifier — active and pending — gets exactly one MCP tool, with name,
 * title, description, and input schema derived from its registry
 * definition. No operation tool is hand-maintained here.
 */
const DERIVED_MCP_OPERATION_TOOLS: DerivedMcpToolDescriptor[] = listOperations().map(
  (operation) => {
    const definition = getOperation(operation.id);
    return {
      name: deriveMcpToolName(operation.id),
      operation: operation.id,
      title: `Make Docs Operation ${operation.id}`,
      description: deriveToolDescription(definition),
      inputSchema: deriveToolInputSchema(definition),
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

/**
 * Conformance seam (R-TEST-1): the derived tool-name/operation pairs, for
 * tests pinning derived-tool/registry parity in both directions.
 */
export function listDerivedMcpOperationTools(): { name: string; operation: string }[] {
  return DERIVED_MCP_OPERATION_TOOLS.map(({ name, operation }) => ({ name, operation }));
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
    if (tool.name !== deriveMcpToolName(tool.operation)) {
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
): Promise<Record<string, unknown>> {
  switch (name) {
    case "make_docs_operation_domains":
      return mcpPayload(name, listOperationDomains());
    case "make_docs_installed_state":
      return mcpPayload(name, await readInstalledState(resolveTargetDir(args)));
    case "make_docs_manifest_read":
      return mcpPayload(name, readManifest(resolveTargetDir(args)));
    case "make_docs_config_read":
      return mcpPayload(name, readConfig(resolveTargetDir(args)));
    case "make_docs_compatibility_classify":
      return mcpPayload(
        name,
        await classifyCompatibilityState({ targetDir: resolveTargetDir(args) }),
      );
    case "make_docs_install_plan":
      return mcpPayload(name, await buildInstallPlan(resolveTargetDir(args), args));
  }
  const derived = DERIVED_TOOLS_BY_NAME.get(name);
  if (derived === undefined) {
    throw new Error(`Unknown make-docs MCP tool: ${name}`);
  }
  return mcpPayload(name, await invokeDerivedOperationTool(derived.operation, args));
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

function mcpPayload(tool: string, result: unknown): Record<string, unknown> {
  return {
    tool,
    source: "mcp",
    result,
  };
}

function resolveTargetDir(args: McpToolInput): string {
  return path.resolve(optionalString(args, "targetDir") ?? process.cwd());
}

function optionalString(args: McpToolInput, key: string): string | undefined {
  const value = args[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}
