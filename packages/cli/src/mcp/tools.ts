import path from "node:path";
import { z } from "zod";
import { classifyCompatibilityState } from "../compatibility";
import { getConfigRenderingLabels, loadMakeDocsConfigOrThrow } from "../config";
import { findReviewableManagedFileConflicts, planInstall } from "../install";
import { loadManifest } from "../manifest";
import {
  buildCloseoutProbe,
  runCloseoutValidate,
} from "../operations/closeout";
import {
  buildPhaseGateReport,
  buildScopeReport,
} from "../operations/lifecycle";
import { listOperationDomains } from "../operations/index";
import {
  catalogPlaybooks,
  createPlaybookRunState,
  evaluateHarnessCapabilities,
  invokePlaybook,
  readPlaybookRunState,
  resolvePlaybook,
  validatePlaybooks,
} from "../operations/playbook";
import {
  buildPhasePlan,
  buildWaveStatus,
  parseWorkPhase,
  renderPhasePlan,
  resolveWaveTarget,
} from "../operations/work";
import { cloneSelections, defaultSelections } from "../profile";
import type { InstallPlan, InstallSelections, PlannedAction } from "../types";
import { readPackageMeta } from "../utils";

type McpToolName =
  | "make_docs_operation_domains"
  | "make_docs_installed_state"
  | "make_docs_manifest_read"
  | "make_docs_config_read"
  | "make_docs_compatibility_classify"
  | "make_docs_install_plan"
  | "make_docs_closeout_probe"
  | "make_docs_closeout_validate"
  | "make_docs_work_phase_state"
  | "make_docs_wave_resolve"
  | "make_docs_wave_status"
  | "make_docs_phase_plan"
  | "make_docs_scope_guard"
  | "make_docs_phase_gate"
  | "make_docs_playbook_validate"
  | "make_docs_playbook_catalog"
  | "make_docs_playbook_resolve"
  | "make_docs_playbook_capabilities"
  | "make_docs_playbook_run_start"
  | "make_docs_playbook_run_invoke"
  | "make_docs_playbook_run_read";

type McpToolInput = Record<string, unknown>;

export interface MakeDocsMcpToolDescriptor {
  name: McpToolName;
  title: string;
  description: string;
  inputSchema: Record<string, z.ZodType>;
}

const targetDirSchema = z
  .string()
  .optional()
  .describe("Project root to inspect. Defaults to the current working directory.");
const repoRootSchema = z
  .string()
  .optional()
  .describe("Repository root to inspect. Defaults to the current working directory.");
const targetSchema = z.string().describe("Work coordinate, work directory, or work phase path.");

export const MAKE_DOCS_MCP_TOOLS: MakeDocsMcpToolDescriptor[] = [
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
      systemAssetMaterializationMode: z
        .enum(["full-snapshot", "provider-backed", "hybrid-pinned-cache"])
        .optional(),
    },
  },
  {
    name: "make_docs_closeout_probe",
    title: "Probe Closeout State",
    description: "Run the closeout probe operation without invoking the CLI parser.",
    inputSchema: {
      repoRoot: repoRootSchema,
      scope: z.enum(["auto", "staged", "unstaged", "full"]).optional(),
    },
  },
  {
    name: "make_docs_closeout_validate",
    title: "Plan Or Run Closeout Validation",
    description:
      "Select closeout validation commands from probe JSON; command execution requires allowRun.",
    inputSchema: {
      repoRoot: repoRootSchema,
      probeJson: z.string(),
      run: z.boolean().optional(),
      allowRun: z.boolean().optional(),
    },
  },
  {
    name: "make_docs_work_phase_state",
    title: "Read Work Phase State",
    description: "Parse one docs/work phase into task and acceptance JSON.",
    inputSchema: { phasePath: z.string() },
  },
  {
    name: "make_docs_wave_resolve",
    title: "Resolve Work Wave",
    description: "Resolve a W/R or W/R/P coordinate or docs/work path.",
    inputSchema: { target: targetSchema },
  },
  {
    name: "make_docs_wave_status",
    title: "Read Work Wave Status",
    description: "Report phase completion state for a work backlog wave.",
    inputSchema: { target: targetSchema },
  },
  {
    name: "make_docs_phase_plan",
    title: "Build Work Phase Plan",
    description: "Create a deterministic phase implementation brief.",
    inputSchema: {
      target: targetSchema,
      render: z.boolean().optional(),
    },
  },
  {
    name: "make_docs_scope_guard",
    title: "Guard Phase Scope",
    description: "Detect changed files outside the current phase scope.",
    inputSchema: {
      target: targetSchema,
      changed: z.array(z.string()).optional(),
    },
  },
  {
    name: "make_docs_phase_gate",
    title: "Check Phase Gate",
    description: "Check validation, closeout, review, and commit evidence for a phase.",
    inputSchema: {
      target: targetSchema,
      commitPolicy: z.string().optional(),
    },
  },
  {
    name: "make_docs_playbook_validate",
    title: "Validate Playbooks",
    description:
      "Operation playbook.validate: parse one or more Playbooks through the Playbook library and report the full diagnostic set with codes, severities, locations, and fix hints.",
    inputSchema: {
      repoRoot: repoRootSchema,
      refs: z
        .array(z.string())
        .optional()
        .describe(
          "Explicit .md paths or canonical persona/slug references. Defaults to every detected Playbook.",
        ),
    },
  },
  {
    name: "make_docs_playbook_catalog",
    title: "Read Playbook Catalog",
    description:
      "Operation playbook.catalog: enumerate Playbooks by canonical persona/slug reference with frontmatter identity, detecting the suffix and deprecated plain file forms.",
    inputSchema: { repoRoot: repoRootSchema },
  },
  {
    name: "make_docs_playbook_resolve",
    title: "Resolve Playbook Reference",
    description:
      "Resolve an explicit path, persona/slug, or unique bare playbook reference without executing it.",
    inputSchema: {
      repoRoot: repoRootSchema,
      ref: z.string(),
      stack: z.enum(["build", "run"]).optional(),
    },
  },
  {
    name: "make_docs_playbook_capabilities",
    title: "Evaluate Playbook Harness Capabilities",
    description:
      "Evaluate reviewed harness capabilities for required/preferred Playbook execution assists.",
    inputSchema: {
      repoRoot: repoRootSchema,
      harness: z.string(),
      requiredCapabilities: z.array(z.string()).optional(),
      preferredCapabilities: z.array(z.string()).optional(),
    },
  },
  {
    name: "make_docs_playbook_run_start",
    title: "Create Playbook Run State",
    description:
      "Create Make Docs-owned Playbook run state. Requires allowWrite=true because it writes .make-docs/runs/playbooks/**.",
    inputSchema: {
      repoRoot: repoRootSchema,
      ref: z.string(),
      stack: z.enum(["build", "run"]).optional(),
      harness: z.string(),
      runId: z.string().optional(),
      parentRunId: z.string().optional(),
      executionMode: z.enum(["serial", "parallel"]).optional(),
      outputSurfaceClaims: z.array(z.string()).optional(),
      currentStep: z.string().optional(),
      currentGate: z.string().optional(),
      status: z.enum(["planned", "running", "paused", "blocked", "completed"]).optional(),
      resumeHints: z.array(z.string()).optional(),
      requiredCapabilities: z.array(z.string()).optional(),
      preferredCapabilities: z.array(z.string()).optional(),
      allowWrite: z.boolean().optional(),
    },
  },
  {
    name: "make_docs_playbook_run_invoke",
    title: "Invoke Run Playbook Model",
    description:
      "Build a generic Run Playbook invocation plan and create run state. Requires allowWrite=true because it writes .make-docs/runs/playbooks/**.",
    inputSchema: {
      repoRoot: repoRootSchema,
      ref: z.string(),
      stack: z.enum(["build", "run"]).optional(),
      harness: z.string(),
      runId: z.string().optional(),
      outputSurfaceClaims: z.array(z.string()).optional(),
      allowUnattended: z.boolean().optional(),
      requiredCapabilities: z.array(z.string()).optional(),
      preferredCapabilities: z.array(z.string()).optional(),
      allowWrite: z.boolean().optional(),
    },
  },
  {
    name: "make_docs_playbook_run_read",
    title: "Read Playbook Run State",
    description: "Read Make Docs-owned Playbook run state for resume or audit.",
    inputSchema: {
      repoRoot: repoRootSchema,
      runId: z.string(),
    },
  },
];

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
    case "make_docs_closeout_probe":
      return mcpPayload(
        name,
        buildCloseoutProbe({
          repoRoot: resolveRepoRoot(args),
          scope: parseScope(args.scope),
        }),
      );
    case "make_docs_closeout_validate":
      return mcpPayload(name, runCloseoutValidation(args));
    case "make_docs_work_phase_state":
      return mcpPayload(name, parseWorkPhase(requiredString(args, "phasePath")));
    case "make_docs_wave_resolve":
      return mcpPayload(name, resolveWaveTarget(requiredString(args, "target")));
    case "make_docs_wave_status":
      return mcpPayload(name, buildWaveStatus(requiredString(args, "target")));
    case "make_docs_phase_plan": {
      const plan = buildPhasePlan(requiredString(args, "target"));
      return mcpPayload(name, {
        plan,
        rendered: args.render === true ? renderPhasePlan(plan) : null,
      });
    }
    case "make_docs_scope_guard":
      return mcpPayload(
        name,
        buildScopeReport(
          requiredString(args, "target"),
          Array.isArray(args.changed) ? args.changed.map(String) : [],
        ),
      );
    case "make_docs_phase_gate":
      return mcpPayload(
        name,
        buildPhaseGateReport(
          requiredString(args, "target"),
          optionalString(args, "commitPolicy"),
        ),
      );
    case "make_docs_playbook_validate":
      return mcpPayload(
        name,
        validatePlaybooks({
          repoRoot: resolveRepoRoot(args),
          refs: optionalStringArray(args, "refs"),
        }),
      );
    case "make_docs_playbook_catalog":
      return mcpPayload(name, catalogPlaybooks({ repoRoot: resolveRepoRoot(args) }));
    case "make_docs_playbook_resolve":
      return mcpPayload(
        name,
        resolvePlaybook({
          repoRoot: resolveRepoRoot(args),
          ref: requiredString(args, "ref"),
          requestedStack: optionalString(args, "stack"),
        }),
      );
    case "make_docs_playbook_capabilities":
      return mcpPayload(
        name,
        evaluateHarnessCapabilities({
          repoRoot: resolveRepoRoot(args),
          harness: requiredString(args, "harness"),
          requiredCapabilities: optionalStringArray(args, "requiredCapabilities"),
          preferredCapabilities: optionalStringArray(args, "preferredCapabilities"),
        }),
      );
    case "make_docs_playbook_run_start":
      if (args.allowWrite !== true) {
        throw new Error("`make_docs_playbook_run_start` requires allowWrite=true.");
      }
      return mcpPayload(
        name,
        createPlaybookRunState({
          repoRoot: resolveRepoRoot(args),
          ref: requiredString(args, "ref"),
          requestedStack: optionalString(args, "stack"),
          harness: requiredString(args, "harness"),
          runId: optionalString(args, "runId"),
          parentRunId: optionalString(args, "parentRunId"),
          executionMode: optionalString(args, "executionMode") as "serial" | "parallel" | undefined,
          outputSurfaceClaims: optionalStringArray(args, "outputSurfaceClaims"),
          currentStep: optionalString(args, "currentStep"),
          currentGate: optionalString(args, "currentGate"),
          status: optionalString(args, "status") as Parameters<typeof createPlaybookRunState>[0]["status"],
          resumeHints: optionalStringArray(args, "resumeHints"),
          requiredCapabilities: optionalStringArray(args, "requiredCapabilities"),
          preferredCapabilities: optionalStringArray(args, "preferredCapabilities"),
        }),
      );
    case "make_docs_playbook_run_invoke":
      if (args.allowWrite !== true) {
        throw new Error("`make_docs_playbook_run_invoke` requires allowWrite=true.");
      }
      return mcpPayload(
        name,
        invokePlaybook({
          repoRoot: resolveRepoRoot(args),
          ref: requiredString(args, "ref"),
          requestedStack: optionalString(args, "stack"),
          harness: requiredString(args, "harness"),
          runId: optionalString(args, "runId"),
          outputSurfaceClaims: optionalStringArray(args, "outputSurfaceClaims"),
          allowUnattended: args.allowUnattended === true,
          requiredCapabilities: optionalStringArray(args, "requiredCapabilities"),
          preferredCapabilities: optionalStringArray(args, "preferredCapabilities"),
        }),
      );
    case "make_docs_playbook_run_read":
      return mcpPayload(
        name,
        readPlaybookRunState({
          repoRoot: resolveRepoRoot(args),
          runId: requiredString(args, "runId"),
        }),
      );
    default:
      throw new Error(`Unknown make-docs MCP tool: ${name}`);
  }
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
      typeof args.systemAssetMaterializationMode === "string"
        ? args.systemAssetMaterializationMode
        : undefined,
  });
  const conflicts = findReviewableManagedFileConflicts(plan);

  return summarizeInstallPlan(plan, conflicts);
}

function runCloseoutValidation(args: McpToolInput): Record<string, unknown> {
  const run = args.run === true;
  if (run && args.allowRun !== true) {
    throw new Error(
      "`make_docs_closeout_validate` requires allowRun=true when run=true.",
    );
  }

  return runCloseoutValidate({
    repoRoot: resolveRepoRoot(args),
    probeJson: requiredString(args, "probeJson"),
    run,
  });
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

function resolveRepoRoot(args: McpToolInput): string {
  return path.resolve(optionalString(args, "repoRoot") ?? process.cwd());
}

function requiredString(args: McpToolInput, key: string): string {
  const value = args[key];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`\`${key}\` is required.`);
  }
  return value;
}

function optionalString(args: McpToolInput, key: string): string | undefined {
  const value = args[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function optionalStringArray(args: McpToolInput, key: string): string[] {
  const value = args[key];
  return Array.isArray(value) ? value.map(String) : [];
}

function parseScope(value: unknown): "auto" | "staged" | "unstaged" | "full" {
  if (
    value === undefined ||
    value === "auto" ||
    value === "staged" ||
    value === "unstaged" ||
    value === "full"
  ) {
    return value ?? "auto";
  }
  throw new Error("`scope` must be auto, staged, unstaged, or full.");
}
