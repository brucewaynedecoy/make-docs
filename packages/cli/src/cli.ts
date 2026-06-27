import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { stdin as input, stdout as output } from "node:process";
import { confirm, isCancel, note } from "@clack/prompts";
import { formatAgenticSkillFileRole } from "./agentic-skill-roles";
import { runBackupCommand } from "./backup";
import {
  classifyCompatibilityState,
  formatCompatibilityClassification,
  type CompatibilityClassification,
} from "./compatibility";
import {
  getConfigRenderingLabels,
  loadMakeDocsConfigOrThrow,
  type MakeDocsConfig,
} from "./config";
import {
  applyInstallPlan,
  findReviewableManagedFileConflicts,
  planInstall,
} from "./install";
import { loadManifest, MANIFEST_RELATIVE_PATH } from "./manifest";
import { runOperationsCommand } from "./operations";
import { cloneSelections, defaultSelections, hasEffectiveCapabilities } from "./profile";
import { applySkillRegistrySelectionMetadata } from "./skill-catalog";
import {
  getSkillRegistryNames,
  loadEffectiveSkillRegistry,
  type EffectiveSkillRegistry,
  type SkillRegistry,
} from "./skill-registry";
import type {
  InstallManifest,
  InstallSelections,
  LifecyclePermissionsMode,
  PlannedAction,
} from "./types";
import { PACKAGE_ROOT, readPackageMeta } from "./utils";
import {
  promptForManagedFileConflictResolutions,
  runSelectionWizard,
} from "./wizard";

type Command = "reconfigure" | "skills" | "backup" | "uninstall" | "operations" | "mcp";
type InstallIntent = "apply" | "reconfigure";
type RenderedActionKind = "generate" | "update" | "skip" | "remove";

const RENDERED_ACTION_KIND_ORDER: Record<RenderedActionKind, number> = {
  generate: 0,
  update: 1,
  skip: 2,
  remove: 3,
};

interface ParsedArgs {
  command?: Command;
  targetDir?: string;
  dryRun: boolean;
  yes: boolean;
  help: boolean;
  backup: boolean;
  remove: boolean;
  noDesigns: boolean;
  noPlans: boolean;
  noPrd: boolean;
  noWork: boolean;
  noCodex: boolean;
  noClaudeCode: boolean;
  noSkills: boolean;
  skillScope?: InstallSelections["skillScope"];
  selectedSkills?: string[];
  selectedSkillsValue?: string;
  skillsManifest?: string;
  operationArgs: string[];
}

type UninstallCommandOptions = {
  targetDir: string;
  backup: boolean;
  permissions: LifecyclePermissionsMode;
};

type UninstallCommandRunner = (options: UninstallCommandOptions) => Promise<void>;
type UninstallCommandLoader = () => Promise<UninstallCommandRunner>;

type SkillsCommandOptions = {
  targetDir: string;
  dryRun: boolean;
  yes: boolean;
  remove: boolean;
  noCodex: boolean;
  noClaudeCode: boolean;
  skillScope?: InstallSelections["skillScope"];
  selectedSkills?: string[];
  skillsManifest?: string;
};

type SkillsCommandRunner = (options: SkillsCommandOptions) => Promise<void>;

let uninstallCommandLoaderOverride: UninstallCommandLoader | null = null;
let skillsCommandRunnerOverride: SkillsCommandRunner | null = null;

export async function runCli(argv = process.argv.slice(2)): Promise<void> {
  const parsed = parseArgs(argv);
  if (parsed.help) {
    printHelp(parsed.command);
    return;
  }

  validateParsedArgs(parsed);
  const effectiveSkillRegistry = loadEffectiveSkillRegistry({
    packageRoot: PACKAGE_ROOT,
    manifestReference: parsed.skillsManifest,
  });
  resolveParsedSelectedSkills(parsed, effectiveSkillRegistry.registry);
  validateParsedSelectedSkills(parsed, effectiveSkillRegistry.registry);

  const targetDir = path.resolve(parsed.targetDir ?? process.cwd());

  if (parsed.command === "backup") {
    await runBackupCommand({
      targetDir,
      permissions: parsed.yes ? "allow-all" : "confirm",
    });
    return;
  }

  if (parsed.command === "uninstall") {
    const runUninstallCommand = await loadUninstallCommand();
    await runUninstallCommand({
      targetDir,
      backup: parsed.backup,
      permissions: parsed.yes ? "allow-all" : "confirm",
    });
    return;
  }

  if (parsed.command === "skills") {
    await runSkillsCommand({
      targetDir,
      dryRun: parsed.dryRun,
      yes: parsed.yes,
      remove: parsed.remove,
      noCodex: parsed.noCodex,
      noClaudeCode: parsed.noClaudeCode,
      skillScope: parsed.skillScope,
      selectedSkills:
        parsed.selectedSkills === undefined ? undefined : [...parsed.selectedSkills],
      skillsManifest: parsed.skillsManifest,
    });
    return;
  }

  if (parsed.command === "operations") {
    await runOperationsCommand(parsed.operationArgs);
    return;
  }

  if (parsed.command === "mcp") {
    const { runMcpServer } = await import("./mcp/server");
    await runMcpServer();
    return;
  }

  const installIntent = inferInstallIntent(parsed);
  const loadedConfig = loadMakeDocsConfigOrThrow(targetDir);
  const makeDocsConfig = loadedConfig.config;
  const compatibilityClassification = await classifyCompatibilityState({
    targetDir,
  });
  const existingManifest = compatibilityClassification.evidence.manifestTrust.parseable
    ? loadManifest(targetDir)
    : null;
  const freshInstallTarget = isFreshInstallTarget({
    targetDir,
    existingManifest,
    installIntent,
    classification: compatibilityClassification,
  });

  if (
    installIntent === "reconfigure" &&
    !existingManifest &&
    !compatibilityClassification.evidence.manifestTrust.present
  ) {
    throw new Error(
      "No make-docs manifest was found in the target directory. Run `make-docs` first.",
    );
  }

  const interactive = !parsed.yes;
  guardCompatibilityDisposition({
    classification: compatibilityClassification,
    interactive,
    freshInstallTarget,
  });

  if (!interactive && installIntent === "reconfigure" && !hasSelectionOverrides(parsed)) {
    throw new Error(
      "`make-docs reconfigure --yes` requires at least one selection flag. Provide selection flags or run `make-docs reconfigure` interactively.",
    );
  }

  if (interactive && (!input.isTTY || !output.isTTY)) {
    throw new Error("Interactive prompts require a TTY. Use --yes for non-interactive runs.");
  }

  let selections = applySkillRegistrySelectionMetadata(
    resolveSelections({
      parsed,
      existingManifest,
    }),
    effectiveSkillRegistry,
  );
  let selectionSource = describeSelectionSource({
    parsed,
    existingManifest,
    installIntent,
  });
  let skipApplyConfirm = false;

  if (interactive) {
    if (!existingManifest && installIntent === "apply") {
      const wizardSelections = await runSelectionWizard({
        initialSelections: selections,
        introTitle: "Let's configure your make-docs install",
        config: makeDocsConfig,
        ...(parsed.skillsManifest
          ? { skillRegistry: effectiveSkillRegistry.registry }
          : {}),
      });
      if (!wizardSelections) {
        output.write("Installer cancelled.\n");
        return;
      }
      selections = applySkillRegistrySelectionMetadata(
        wizardSelections,
        effectiveSkillRegistry,
      );
      selectionSource = "interactive wizard selections";
      skipApplyConfirm = true;
    } else if (installIntent === "reconfigure") {
      const wizardSelections = await runSelectionWizard({
        initialSelections: selections,
        introTitle: "Let's reconfigure your make-docs install",
        config: makeDocsConfig,
        ...(parsed.skillsManifest
          ? { skillRegistry: effectiveSkillRegistry.registry }
          : {}),
      });
      if (!wizardSelections) {
        output.write("Installer cancelled.\n");
        return;
      }
      selections = applySkillRegistrySelectionMetadata(
        wizardSelections,
        effectiveSkillRegistry,
      );
      selectionSource = "interactive reconfigure wizard";
      skipApplyConfirm = true;
    }
  }

  const packageMeta = readPackageMeta();
  let plan = await planInstall({
    targetDir,
    selections,
    existingManifest,
    packageMeta,
    skillRegistry: effectiveSkillRegistry.registry,
  });

  if (interactive) {
    const managedFileConflicts = findReviewableManagedFileConflicts(plan);
    if (managedFileConflicts.length > 0) {
      const managedFileConflictResolutions =
        await promptForManagedFileConflictResolutions(managedFileConflicts);
      if (!managedFileConflictResolutions) {
        output.write("Installer cancelled.\n");
        return;
      }

      plan = await planInstall({
        targetDir,
        selections,
        existingManifest,
        packageMeta,
        managedFileConflictResolutions,
        skillRegistry: effectiveSkillRegistry.registry,
      });
    }
  }

  if (!hasEffectiveCapabilities(plan.profile)) {
    throw new Error("At least one capability must remain enabled.");
  }

  const hasPlannedChanges = plan.actions.some((action) => action.type !== "noop");
  printPlan({
    actions: plan.actions,
    dryRun: parsed.dryRun,
    existingManifest,
    installIntent,
    packageName: plan.packageName,
    packageVersion: plan.packageVersion,
    selectionSource,
    targetDir,
    compatibilityClassification: freshInstallTarget ? null : compatibilityClassification,
    config: makeDocsConfig,
  });

  if (parsed.dryRun) {
    output.write("\nDry run complete.\n");
    return;
  }

  const unresolvedManagedFileConflicts = findReviewableManagedFileConflicts(plan);
  if (!interactive && unresolvedManagedFileConflicts.length > 0) {
    throw new Error(
      [
        "Non-interactive make-docs runs cannot apply unresolved managed-file diffs.",
        "Run `make-docs` without `--yes` to review the conflicts interactively.",
        "",
        ...buildCompatibilitySummaryLines(compatibilityClassification),
        "",
        "Conflicting managed files:",
        ...unresolvedManagedFileConflicts.map(
          (conflict) => `- ${conflict.relativePath}`,
        ),
      ].join("\n"),
    );
  }

  if (interactive && !skipApplyConfirm && hasPlannedChanges) {
    const proceed = await confirm({
      message: getApplyConfirmationMessage({
        existingManifest,
        installIntent,
      }),
      initialValue: true,
      active: "Yes",
      inactive: "No",
      withGuide: true,
    });

    if (isCancel(proceed) || !proceed) {
      output.write("Installer cancelled.\n");
      return;
    }
  }

  const applied = applyInstallPlan({
    targetDir,
    plan,
    existingManifest,
  });

  if (hasPlannedChanges) {
    writeApplyCompletionSummary({
      existingManifest,
      installIntent,
      manifest: applied.manifest,
      targetDir,
    });
  }

  if (applied.conflictFiles.length > 0) {
    output.write("Conflicts were staged for manual review:\n");
    for (const conflictFile of applied.conflictFiles) {
      output.write(`- ${conflictFile}\n`);
    }
  }
}

function inferInstallIntent(parsed: ParsedArgs): InstallIntent {
  return parsed.command === "reconfigure" ? "reconfigure" : "apply";
}

function describeSelectionSource(options: {
  parsed: ParsedArgs;
  existingManifest: InstallManifest | null;
  installIntent: InstallIntent;
}): string {
  const { parsed, existingManifest, installIntent } = options;

  if (installIntent === "reconfigure") {
    return hasSelectionOverrides(parsed)
      ? "saved manifest selections plus reconfigure flags"
      : "saved manifest selections";
  }

  if (existingManifest) {
    return hasSelectionOverrides(parsed)
      ? "saved manifest selections plus command-line flags"
      : "saved manifest selections";
  }

  return hasSelectionOverrides(parsed)
    ? "default selections plus command-line flags"
    : "default selections";
}

function resolveSelections(options: {
  parsed: ParsedArgs;
  existingManifest: InstallManifest | null;
}): InstallSelections {
  const { parsed, existingManifest } = options;
  const baseSelections = existingManifest ? existingManifest.selections : defaultSelections();

  const selections = cloneSelections(baseSelections);

  if (parsed.noDesigns) {
    selections.capabilities.designs = false;
  }
  if (parsed.noPlans) {
    selections.capabilities.plans = false;
  }
  if (parsed.noPrd) {
    selections.capabilities.prd = false;
  }
  if (parsed.noWork) {
    selections.capabilities.work = false;
  }
  if (parsed.noCodex) {
    selections.harnesses.codex = false;
  }
  if (parsed.noClaudeCode) {
    selections.harnesses["claude-code"] = false;
  }
  if (parsed.noSkills) {
    selections.skills = false;
    selections.selectedSkills = [];
  } else {
    if (parsed.skillScope || parsed.selectedSkills !== undefined) {
      selections.skills = true;
    }
    if (parsed.skillScope) {
      selections.skillScope = parsed.skillScope;
    }
    if (parsed.selectedSkills !== undefined) {
      selections.selectedSkills = [...parsed.selectedSkills];
    }
  }
  return selections;
}

function hasSelectionOverrides(parsed: ParsedArgs): boolean {
  return Boolean(
    parsed.noDesigns ||
      parsed.noPlans ||
      parsed.noPrd ||
      parsed.noWork ||
      parsed.noCodex ||
      parsed.noClaudeCode ||
      parsed.noSkills ||
      parsed.skillsManifest ||
      parsed.skillScope ||
      parsed.selectedSkills !== undefined,
  );
}

function isLifecycleCommand(command?: Command): command is "backup" | "uninstall" {
  return command === "backup" || command === "uninstall";
}

export function __setUninstallCommandLoaderForTests(
  loader: UninstallCommandLoader | null,
): void {
  uninstallCommandLoaderOverride = loader;
}

export function __setSkillsCommandRunnerForTests(
  runner: SkillsCommandRunner | null,
): void {
  skillsCommandRunnerOverride = runner;
}

async function loadUninstallCommand(): Promise<UninstallCommandRunner> {
  if (uninstallCommandLoaderOverride) {
    return uninstallCommandLoaderOverride();
  }

  const uninstallModule = (await import("./uninstall")) as {
    runUninstallCommand?: UninstallCommandRunner;
  };

  if (typeof uninstallModule.runUninstallCommand !== "function") {
    throw new Error(
      "The `uninstall` command module must export `runUninstallCommand(options)`.",
    );
  }

  return uninstallModule.runUninstallCommand;
}

async function runSkillsCommand(options: SkillsCommandOptions): Promise<void> {
  if (skillsCommandRunnerOverride) {
    await skillsCommandRunnerOverride(options);
    return;
  }

  const skillsModule = (await import("./skills-command")) as {
    runSkillsCommand: SkillsCommandRunner;
  };
  await skillsModule.runSkillsCommand(options);
}

function getSelectionOverrideFlags(parsed: ParsedArgs): string[] {
  const flags: string[] = [];

  if (parsed.noDesigns) {
    flags.push("--no-designs");
  }
  if (parsed.noPlans) {
    flags.push("--no-plans");
  }
  if (parsed.noPrd) {
    flags.push("--no-prd");
  }
  if (parsed.noWork) {
    flags.push("--no-work");
  }
  if (parsed.noCodex) {
    flags.push("--no-codex");
  }
  if (parsed.noClaudeCode) {
    flags.push("--no-claude-code");
  }
  if (parsed.noSkills) {
    flags.push("--no-skills");
  }
  if (parsed.skillsManifest) {
    flags.push("--skill-manifest");
  }
  if (parsed.skillScope) {
    flags.push("--skill-scope");
  }
  if (parsed.selectedSkillsValue !== undefined) {
    flags.push("--selected-skills");
  }

  return flags;
}

function parseArgs(argv: string[]): ParsedArgs {
  const parsed: ParsedArgs = {
    dryRun: false,
    yes: false,
    help: false,
    backup: false,
    remove: false,
    noDesigns: false,
    noPlans: false,
    noPrd: false,
    noWork: false,
    noCodex: false,
    noClaudeCode: false,
    noSkills: false,
    operationArgs: [],
  };

  const args = [...argv];
  rejectRemovedUpdateReconfigure(args);
  rejectRemovedReconfigureFlag(args);
  rejectRemovedCommand(args);

  if (
    args[0] === "reconfigure" ||
    args[0] === "skills" ||
    args[0] === "backup" ||
    args[0] === "uninstall" ||
    args[0] === "operations" ||
    args[0] === "mcp"
  ) {
    parsed.command = args.shift() as Command;
  }

  if (parsed.command === "operations") {
    parsed.operationArgs = args;
    return parsed;
  }

  if (parsed.command === "mcp") {
    for (const arg of args) {
      if (arg === "--help" || arg === "-h") {
        parsed.help = true;
        continue;
      }
      throw new Error(`Unknown argument: ${arg}`);
    }
    return parsed;
  }

  while (args.length > 0) {
    const arg = args.shift();
    switch (arg) {
      case "--target":
        parsed.targetDir = args.shift();
        break;
      case "--dry-run":
        parsed.dryRun = true;
        break;
      case "--yes":
        parsed.yes = true;
        break;
      case "--help":
      case "-h":
        parsed.help = true;
        break;
      case "--backup":
        parsed.backup = true;
        break;
      case "--remove":
        parsed.remove = true;
        break;
      case "--no-designs":
        parsed.noDesigns = true;
        break;
      case "--no-plans":
        parsed.noPlans = true;
        break;
      case "--no-prd":
        parsed.noPrd = true;
        break;
      case "--no-work":
        parsed.noWork = true;
        break;
      case "--no-codex":
      case "--no-agents":
        parsed.noCodex = true;
        break;
      case "--no-claude-code":
      case "--no-claude":
        parsed.noClaudeCode = true;
        break;
      case "--no-skills":
        parsed.noSkills = true;
        break;
      case "--skill-manifest": {
        const value = args.shift();
        if (!value) {
          throw new Error("`--skill-manifest` requires a file path.");
        }
        parsed.skillsManifest = value;
        break;
      }
      case "--skill-scope": {
        const value = args.shift();
        if (value !== "project" && value !== "global") {
          throw new Error("`--skill-scope` must be either `project` or `global`.");
        }
        parsed.skillScope = value;
        break;
      }
      case "--selected-skills": {
        const value = args.shift();
        if (!value) {
          throw new Error("`--selected-skills` requires a comma-separated value, `all`, or `none`.");
        }
        parsed.selectedSkillsValue = value;
        break;
      }
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return parsed;
}

function resolveParsedSelectedSkills(
  parsed: ParsedArgs,
  registry: SkillRegistry,
): void {
  if (parsed.selectedSkillsValue === undefined) {
    return;
  }

  parsed.selectedSkills = parseSelectedSkillsValue(
    parsed.selectedSkillsValue,
    registry,
  );

  if (
    parsed.selectedSkillsValue !== "none" &&
    parsed.selectedSkillsValue !== "all" &&
    parsed.selectedSkills.length === 0
  ) {
    throw new Error(
      "`--selected-skills` requires at least one skill id, `all`, or `none`.",
    );
  }
}

function parseSelectedSkillsValue(
  value: string,
  registry: SkillRegistry,
): string[] {
  if (value === "none") {
    return [];
  }

  if (value === "all") {
    return getSkillRegistryNames(registry);
  }

  return Array.from(
    new Set(
      value
        .split(",")
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0),
    ),
  ).sort();
}

function rejectRemovedUpdateReconfigure(args: string[]): void {
  if (args[0] !== "update" || !args.includes("--reconfigure")) {
    return;
  }

  throw new Error(
    "The `update --reconfigure` command was removed. Use `make-docs reconfigure` instead.",
  );
}

function rejectRemovedCommand(args: string[]): void {
  const command = args[0];
  if (command !== "init" && command !== "update") {
    return;
  }

  const suggestedArgs = args.slice(1).join(" ");
  const suggestedCommand = suggestedArgs ? `make-docs ${suggestedArgs}` : "make-docs";
  throw new Error(
    `The \`${command}\` command was removed. Use \`${suggestedCommand}\` instead.`,
  );
}

function rejectRemovedReconfigureFlag(args: string[]): void {
  if (!args.includes("--reconfigure")) {
    return;
  }

  throw new Error(
    "`--reconfigure` was removed. Use `make-docs reconfigure` instead.",
  );
}

function getInvalidSkillsCommandFlags(parsed: ParsedArgs): string[] {
  const flags: string[] = [];

  if (parsed.noDesigns) {
    flags.push("--no-designs");
  }
  if (parsed.noPlans) {
    flags.push("--no-plans");
  }
  if (parsed.noPrd) {
    flags.push("--no-prd");
  }
  if (parsed.noWork) {
    flags.push("--no-work");
  }
  if (parsed.noSkills) {
    flags.push("--no-skills");
  }

  return flags;
}

function validateParsedArgs(parsed: ParsedArgs): void {
  if (parsed.backup && parsed.command !== "uninstall") {
    throw new Error(
      `\`--backup\` is only valid with \`uninstall\`, not \`${parsed.command ?? "no command"}\`.`,
    );
  }

  if (parsed.remove && parsed.command !== "skills") {
    throw new Error(
      `\`--remove\` is only valid with \`make-docs skills\`, not \`${parsed.command ?? "no command"}\`.`,
    );
  }

  if (parsed.dryRun && isLifecycleCommand(parsed.command)) {
    throw new Error(
      `\`--dry-run\` is only valid with \`make-docs\`, \`make-docs reconfigure\`, or \`make-docs skills\`, not \`${parsed.command}\`.`,
    );
  }

  if (parsed.command === "skills") {
    const invalidSkillsFlags = getInvalidSkillsCommandFlags(parsed);
    if (invalidSkillsFlags.length > 0) {
      const label = invalidSkillsFlags.length === 1 ? "flag" : "flags";
      const verb = invalidSkillsFlags.length === 1 ? "is" : "are";
      throw new Error(
        `Selection ${label} ${invalidSkillsFlags.join(", ")} ${verb} not valid with \`make-docs skills\`. Use skills command options such as \`--remove\`, \`--skill-scope\`, or \`--selected-skills\`.`,
      );
    }

    if (parsed.remove && parsed.selectedSkillsValue !== undefined) {
      throw new Error(
        "`--selected-skills` cannot be combined with `make-docs skills --remove`.",
      );
    }
  }

  const selectionOverrideFlags = getSelectionOverrideFlags(parsed);
  if (
    isLifecycleCommand(parsed.command) &&
    selectionOverrideFlags.length > 0
  ) {
    const label = selectionOverrideFlags.length === 1 ? "flag" : "flags";
    const verb = selectionOverrideFlags.length === 1 ? "is" : "are";
    throw new Error(
      `Selection ${label} ${selectionOverrideFlags.join(", ")} ${verb} only valid with \`make-docs\` or \`make-docs reconfigure\`, not \`${parsed.command}\`.`,
    );
  }

  if (parsed.noSkills && parsed.skillsManifest) {
    throw new Error(
      "`--no-skills` cannot be combined with `--skill-manifest`.",
    );
  }

  if (parsed.noSkills && (parsed.skillScope || parsed.selectedSkillsValue !== undefined)) {
    throw new Error(
      "`--no-skills` cannot be combined with `--skill-scope` or `--selected-skills`.",
    );
  }
}

function validateParsedSelectedSkills(parsed: ParsedArgs, registry: SkillRegistry): void {
  if (parsed.selectedSkills === undefined) {
    return;
  }

  const registrySkills = new Set(getSkillRegistryNames(registry));

  for (const skillName of parsed.selectedSkills) {
    if (!registrySkills.has(skillName)) {
      const validList = Array.from(registrySkills).sort().join(", ");
      throw new Error(
        `Unknown selected skill \`${skillName}\`. Valid skills: ${validList || "(none)"}.`,
      );
    }
  }
}

function printPlan(options: {
  actions: PlannedAction[];
  dryRun: boolean;
  existingManifest: InstallManifest | null;
  installIntent: InstallIntent;
  packageName: string;
  packageVersion: string;
  selectionSource: string;
  targetDir: string;
  compatibilityClassification: CompatibilityClassification | null;
  config: MakeDocsConfig;
}): void {
  const {
    actions,
    dryRun,
    existingManifest,
    installIntent,
    packageName,
    packageVersion,
    selectionSource,
    targetDir,
    compatibilityClassification,
    config,
  } = options;
  const nonNoop = actions.filter((action) => action.type !== "noop");
  const renderedActions = getRenderedActions(actions);
  const noopCount = actions.length - nonNoop.length;
  const counts = countActions(actions);
  const manifestPath = path.join(targetDir, MANIFEST_RELATIVE_PATH);
  const mode = describeApplyMode({ existingManifest, installIntent });
  const labels = getConfigRenderingLabels(config);

  note(
    [
      `Target: ${targetDir}`,
      `Mode: ${mode}`,
      existingManifest
        ? `Manifest: ${manifestPath} (found)`
        : `Manifest: ${manifestPath} (will be created)`,
      existingManifest
        ? `Installed version: ${existingManifest.packageVersion}`
        : "Installed version: none detected",
      `Package version: ${packageName} ${packageVersion}`,
      ...(compatibilityClassification
        ? [
            `Compatibility state: ${compatibilityClassification.state}`,
            `Disposition: ${compatibilityClassification.disposition}`,
          ]
        : []),
      `Selection source: ${selectionSource}`,
      `Document kind labels: ${labels.documentKinds}`,
      `Lifecycle labels: ${labels.lifecycle}`,
      `Coordinate labels: ${labels.coordinates}`,
      `Persona labels: ${labels.personas}`,
      `Managed files evaluated: ${actions.length}`,
      `Already current: ${noopCount}`,
      `Changes planned: ${nonNoop.length}`,
      `Generate: ${counts.create + counts.generate}`,
      `Update: ${counts.update + counts["update-conflict"]}`,
      `Skip: ${counts.skip + counts["skip-conflict"]}`,
      `Remove: ${counts["remove-managed"]}`,
    ].join("\n"),
    "Information",
  );

  if (nonNoop.length === 0) {
    renderNoopExplanation({ dryRun, existingManifest });
    return;
  }

  note(renderedActions.map(formatActionLine).join("\n"), "Planned file operations");
}

function countActions(actions: PlannedAction[]): Record<PlannedAction["type"], number> {
  return {
    create: actions.filter((action) => action.type === "create").length,
    generate: actions.filter((action) => action.type === "generate").length,
    noop: actions.filter((action) => action.type === "noop").length,
    "remove-managed": actions.filter((action) => action.type === "remove-managed").length,
    skip: actions.filter((action) => action.type === "skip").length,
    "skip-conflict": actions.filter((action) => action.type === "skip-conflict").length,
    update: actions.filter((action) => action.type === "update").length,
    "update-conflict": actions.filter((action) => action.type === "update-conflict").length,
  };
}

function describeApplyMode(options: {
  existingManifest: InstallManifest | null;
  installIntent: InstallIntent;
}): string {
  if (options.installIntent === "reconfigure") {
    return "existing install reconfigure";
  }

  return options.existingManifest ? "existing install sync" : "first install";
}

function isFreshInstallTarget(options: {
  targetDir: string;
  existingManifest: InstallManifest | null;
  installIntent: InstallIntent;
  classification: CompatibilityClassification;
}): boolean {
  if (options.installIntent !== "apply" || options.existingManifest) {
    return false;
  }

  if (!existsSync(options.targetDir)) {
    return true;
  }

  if (readdirSync(options.targetDir).length === 0) {
    return true;
  }

  const filesystemTrust = options.classification.evidence.filesystemTrust;
  return (
    options.classification.state === "unknown-shape" &&
    filesystemTrust.recognizableManagedPaths.length === 0 &&
    filesystemTrust.ambiguousFallbackPaths.length === 0 &&
    filesystemTrust.nonMakeDocsPathCollisions.length === 0
  );
}

function guardCompatibilityDisposition(options: {
  classification: CompatibilityClassification;
  interactive: boolean;
  freshInstallTarget: boolean;
}): void {
  const { classification, interactive, freshInstallTarget } = options;
  if (freshInstallTarget) {
    return;
  }

  if (hasUnreviewedOwnershipAmbiguity(classification)) {
    throw new Error(
      buildCompatibilityError(
        "make-docs cannot sync this target until ownership ambiguity is reviewed.",
        classification,
        [
          "Run `make-docs` interactively if the files are reviewable, or back up the target and reinstall into a clean tree.",
        ],
      ),
    );
  }

  switch (classification.disposition) {
    case "sync":
      return;
    case "migrate":
      if (classification.state === "clean-v1") {
        return;
      }
      break;
    case "migrate-with-review":
      if (interactive) {
        note(
          buildCompatibilitySummaryLines(classification).join("\n"),
          "Compatibility review required",
        );
      }
      return;
    case "backup-and-reinstall":
      throw new Error(
        buildCompatibilityError(
          "This target requires an explicit backup-and-reinstall migration flow before make-docs can write changes.",
          classification,
          [
            "Bare `make-docs` and `make-docs reconfigure` will not perform destructive backup-and-reinstall implicitly.",
          ],
        ),
      );
    case "manual-review-required":
      throw new Error(
        buildCompatibilityError(
          "make-docs cannot classify this target safely enough to write changes.",
          classification,
          [
            "Review the failed evidence below, create a manual backup if needed, or install into a clean tree.",
          ],
        ),
      );
    default: {
      const exhaustiveCheck: never = classification.disposition;
      throw new Error(`Unhandled compatibility disposition: ${exhaustiveCheck}`);
    }
  }

  throw new Error(
    buildCompatibilityError(
      "make-docs cannot migrate this target because the classified state is not a clean trusted v1 install.",
      classification,
      ["Review the classification evidence before changing the target."],
    ),
  );
}

function hasUnreviewedOwnershipAmbiguity(
  classification: CompatibilityClassification,
): boolean {
  return (
    classification.disposition === "sync" &&
    (classification.evidence.filesystemTrust.ambiguousFallbackPaths.length > 0 ||
      classification.evidence.filesystemTrust.nonMakeDocsPathCollisions.length > 0)
  );
}

function buildCompatibilityError(
  headline: string,
  classification: CompatibilityClassification,
  nextSteps: string[],
): string {
  return [
    headline,
    "",
    ...buildCompatibilitySummaryLines(classification),
    "",
    "Next steps:",
    ...nextSteps.map((step) => `- ${step}`),
  ].join("\n");
}

function buildCompatibilitySummaryLines(
  classification: CompatibilityClassification,
): string[] {
  const auditReport = classification.auditReport;
  return [
    `Compatibility state: ${classification.state}`,
    `Disposition: ${classification.disposition}`,
    ...(auditReport
      ? [
          `Audit removable files: ${auditReport.removableFiles.length}`,
          `Audit preserved paths: ${auditReport.preservedPaths.length}`,
          `Audit skipped paths: ${auditReport.skippedPaths.length}`,
        ]
      : ["Audit summary: unavailable"]),
    "Evidence:",
    ...formatCompatibilityClassification(classification).map((line) => `- ${line}`),
  ];
}

function renderNoopExplanation(options: {
  dryRun: boolean;
  existingManifest: InstallManifest | null;
}): void {
  const noChangeText = options.dryRun
    ? "No managed file changes would be made."
    : "No managed file changes are needed.";

  const lines = [noChangeText];

  if (options.existingManifest) {
    lines.push(
      "Every managed file already matched the desired content.",
      "",
    );
  } else {
    lines.push(
      "make-docs did not find an existing manifest, so this run used first-install mode.",
      "The selected files already matched make-docs content.",
      "Applying will create the manifest that tracks future syncs.",
      "",
    );
  }

  lines.push(
    "Useful next steps:",
    "- Run `make-docs reconfigure` to change which docs, harnesses, or skills are managed.",
    "- Run `make-docs --dry-run` after upgrading make-docs to preview future changes.",
  );

  note(lines.join("\n"), "Results");
}

function getRenderedActions(actions: PlannedAction[]): PlannedAction[] {
  return actions
    .filter((action) => getRenderedActionKind(action) !== null)
    .sort(compareRenderedActions);
}

function formatActionLine(action: PlannedAction): string {
  const kind = getRenderedActionKind(action);
  if (!kind) {
    throw new Error(`Cannot render no-op action for ${action.relativePath}.`);
  }

  const agenticRole = formatAgenticSkillFileRole(action.agenticRole);
  return `- ${kind}: ${agenticRole ? `${agenticRole}: ` : ""}${action.relativePath}`;
}

function compareRenderedActions(left: PlannedAction, right: PlannedAction): number {
  const leftKind = getRenderedActionKind(left);
  const rightKind = getRenderedActionKind(right);

  if (leftKind && rightKind && leftKind !== rightKind) {
    return (
      RENDERED_ACTION_KIND_ORDER[leftKind] -
      RENDERED_ACTION_KIND_ORDER[rightKind]
    );
  }

  return comparePosixTreePath(left.relativePath, right.relativePath);
}

function getRenderedActionKind(action: PlannedAction): RenderedActionKind | null {
  switch (action.type) {
    case "create":
    case "generate":
      return "generate";
    case "update":
    case "update-conflict":
      return "update";
    case "skip":
    case "skip-conflict":
      return "skip";
    case "remove-managed":
      return "remove";
    case "noop":
      return null;
  }
}

function comparePosixTreePath(left: string, right: string): number {
  if (left === right) {
    return 0;
  }

  return left < right ? -1 : 1;
}

function getApplyConfirmationMessage(options: {
  existingManifest: InstallManifest | null;
  installIntent: InstallIntent;
}): string {
  if (options.installIntent === "reconfigure") {
    return "Apply this reconfiguration?";
  }

  return options.existingManifest
    ? "Apply this make-docs sync?"
    : "Install make-docs with this plan?";
}

function writeApplyCompletionSummary(options: {
  existingManifest: InstallManifest | null;
  installIntent: InstallIntent;
  manifest: InstallManifest;
  targetDir: string;
}): void {
  if (options.installIntent === "reconfigure") {
    output.write(
      `\nReconfigured make-docs ${options.manifest.packageVersion} in ${options.targetDir}.\n`,
    );
    return;
  }

  if (options.existingManifest) {
    output.write(
      `\nSynced make-docs ${options.manifest.packageVersion} in ${options.targetDir}.\n`,
    );
    return;
  }

  output.write(
    `\nInstalled make-docs ${options.manifest.packageVersion} into ${options.targetDir}.\n`,
  );
}

function printHelp(command?: Command): void {
  switch (command) {
    case "reconfigure":
      output.write(`make-docs reconfigure

Change the configured make-docs footprint for an existing install.
Requires an existing ${MANIFEST_RELATIVE_PATH} in the target directory.

Interactive runs open the selection wizard using the saved manifest selections.
Non-interactive runs with --yes must include at least one selection flag.

Usage:
  make-docs reconfigure [options]

Options:

General options:
  --target <dir>                 Reconfigure a different make-docs install directory.
  --dry-run                      Show planned changes without writing files.
  --yes                          Skip interactive prompts; requires a selection flag.
  --help, -h                     Show help for this command.

Content options:
  --no-designs                   Skip docs/designs scaffolding.
  --no-plans                     Skip docs/plans scaffolding.
  --no-prd                       Skip docs/prd scaffolding.
  --no-work                      Skip docs/work scaffolding.

Harness options:
  --no-codex                     Skip the Codex harness.
  --no-claude-code               Skip the Claude Code harness.
  Deprecated aliases: --no-agents, --no-claude

Skill options:
  --no-skills                    Skip skill installation entirely.
  --skill-manifest <file>       Use an explicit local skills manifest for this run.
  --skill-scope project|global   Choose whether skills install in the repo or the global Codex home.
  --selected-skills <csv|all|none>
                                  Replace the selected skill set.

Examples:
  make-docs reconfigure
  make-docs reconfigure --target ~/Projects/example --dry-run
  make-docs reconfigure --yes --no-work
  make-docs reconfigure --yes --no-codex --skill-scope global --selected-skills decompose-codebase
`);
      return;
    case "skills":
      output.write(`make-docs skills

Sync or remove managed make-docs skills without changing the docs scaffold.

Usage:
  make-docs skills [options]

General options:
  --target <dir>                 Sync skills for a different make-docs install directory.
  --dry-run                      Show planned skill changes without writing files.
  --yes                          Skip interactive prompts.
  --help, -h                     Show help for this command.

Platform options:
  --no-codex                     Skip Codex skill files.
  --no-claude-code               Skip Claude Code skill files.
  Deprecated aliases: --no-agents, --no-claude

Skill options:
  --remove                       Remove managed skills owned by make-docs.
  --skill-manifest <file>       Use an explicit local skills manifest for this run.
  --skill-scope project|global   Choose whether skills install in the repo or the global Codex home.
  --selected-skills <csv|all|none>
                                  Replace the selected skill set.

Examples:
  make-docs skills
  make-docs skills --dry-run
  make-docs skills --remove
  make-docs skills --skill-scope global
  make-docs skills --skill-manifest ./skills.manifest.json --selected-skills all
  make-docs skills --selected-skills all
`);
      return;
    case "backup":
      output.write(`make-docs backup

Create a backup of the managed make-docs files in the target directory.
New backups are written under .make-docs/backup/<date>.
This command is non-destructive: source files remain in place.

Usage:
  make-docs backup [--target <dir>] [--yes] [--help]

Options:
  --target <dir>                   Back up a different make-docs install directory.
  --yes                            Skip confirmation prompts after showing the audit summary.
  --help, -h                       Show help for this command.

Examples:
  make-docs backup
  make-docs backup --target ~/Projects/example
  make-docs backup --yes
`);
      return;
    case "uninstall":
      output.write(`make-docs uninstall

Remove the managed make-docs files from the target directory.
This command is destructive: audited managed files are removed after review.

Usage:
  make-docs uninstall [--target <dir>] [--backup] [--yes] [--help]

Options:
  --target <dir>                   Uninstall from a different make-docs install directory.
  --backup                         Create a .make-docs/backup/<date> backup before removing files.
  --yes                            Skip confirmation prompts after showing warnings and the audit summary.
  --help, -h                       Show help for this command.

Examples:
  make-docs uninstall
  make-docs uninstall --backup
  make-docs uninstall --target ~/Projects/example --yes
`);
      return;
    case "operations":
      output.write(`make-docs operations

Run deterministic make-docs shared-core operations for lifecycle skills and future automation surfaces.

Usage:
  make-docs operations <operation> [options]

Operations:
  closeout-probe       Summarize changed files, contracts, coordinates, risks, and validation hints.
  closeout-validate    Select or run closeout validation commands from probe JSON.
  closeout-history     Draft or write a closeout history skeleton.
  work-phase-state     Parse one docs/work phase into task and acceptance JSON.
  wave-resolve         Resolve a W/R or W/R/P coordinate or docs/work path.
  wave-status          Report phase completion state for a wave.
  phase-plan           Render a deterministic phase implementation brief.
  checkpoint           Create or update .make-docs/runs wave checkpoint state.
  scope-guard          Detect changed files outside the current phase scope.
  phase-gate           Check whether a phase has validation, closeout, review, and commit evidence.

Examples:
  make-docs operations wave-status 'W16 R3' --json
  make-docs operations phase-plan 'W16 R3 P2'
  make-docs operations closeout-probe --repo-root . --scope auto --json
`);
      return;
    case "mcp":
      output.write(`make-docs mcp

Run the TypeScript-owned make-docs MCP server over stdio.

Usage:
  make-docs mcp [--help]

Behavior:
  The MCP server exposes read-first and plan-first tools for installed-state inspection, manifest/config reads, compatibility classification, dry-run install planning, and deterministic operation-domain helpers.
  MCP tools delegate to the same TypeScript operation domains and planner/classifier modules used by the CLI.
  Write behavior is not exposed by default; run/write requests are rejected unless the matching tool explicitly requires an approval flag.

Examples:
  make-docs mcp
`);
      return;
    default:
      output.write(`make-docs

Apply, sync, reconfigure, back up, and remove make-docs installs.

Usage:
  make-docs [options]
  make-docs reconfigure [options]
  make-docs skills [options]
  make-docs backup [options]
  make-docs uninstall [options]
  make-docs operations <operation> [options]
  make-docs mcp

Primary workflow:
  Run make-docs with no command to install into a new target or sync an existing manifest using saved selections.

Commands:
  reconfigure  Change saved selections for an existing install.
  skills       Sync or remove managed skills.
  backup       Create a backup of managed files.
  uninstall    Remove managed files, with an optional backup first.
  operations   Run deterministic lifecycle operations for skills and automation.
  mcp          Run the TypeScript MCP server over stdio.

Examples:
  make-docs
  make-docs --yes
  make-docs --target ~/Projects/example --dry-run
  make-docs --skill-manifest ./skills.manifest.json --selected-skills all --yes
  make-docs reconfigure
  make-docs reconfigure --yes --no-skills
  make-docs skills --dry-run
  make-docs backup --yes
  make-docs uninstall --backup
  make-docs operations wave-status 'W16 R3' --json
  make-docs mcp

Use --help or -h with any command for command-specific options and examples.
`);
  }
}
