import path from "node:path";
import { stdin as input, stdout as output } from "node:process";
import { confirm, isCancel, note } from "@clack/prompts";
import { runBackupCommand } from "./backup";
import { applyInstallPlan, findInstructionConflicts, planInstall } from "./install";
import { loadManifest } from "./manifest";
import { cloneSelections, defaultSelections, hasEffectiveCapabilities } from "./profile";
import {
  getOptionalSkills,
  getRequiredSkills,
  loadSkillRegistry,
} from "./skill-registry";
import type {
  InstallManifest,
  InstallSelections,
  LifecyclePermissionsMode,
  PlannedAction,
  ReferencesMode,
  TemplatesMode,
} from "./types";
import { PACKAGE_ROOT, readPackageMeta } from "./utils";
import {
  promptForInstructionConflictResolutions,
  runSelectionWizard,
} from "./wizard";

type Command = "reconfigure" | "backup" | "uninstall";
type InstallIntent = "apply" | "reconfigure";

interface ParsedArgs {
  command?: Command;
  targetDir?: string;
  dryRun: boolean;
  yes: boolean;
  help: boolean;
  backup: boolean;
  noDesigns: boolean;
  noPlans: boolean;
  noPrd: boolean;
  noWork: boolean;
  noPrompts: boolean;
  noCodex: boolean;
  noClaudeCode: boolean;
  noSkills: boolean;
  templatesMode?: TemplatesMode;
  referencesMode?: ReferencesMode;
  skillScope?: InstallSelections["skillScope"];
  optionalSkills?: string[];
}

type UninstallCommandOptions = {
  targetDir: string;
  backup: boolean;
  permissions: LifecyclePermissionsMode;
};

type UninstallCommandRunner = (options: UninstallCommandOptions) => Promise<void>;
type UninstallCommandLoader = () => Promise<UninstallCommandRunner>;

let uninstallCommandLoaderOverride: UninstallCommandLoader | null = null;

export async function runCli(argv = process.argv.slice(2)): Promise<void> {
  const parsed = parseArgs(argv);
  if (parsed.help) {
    printHelp(parsed.command);
    return;
  }

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

  const existingManifest = loadManifest(targetDir);
  const installIntent = inferInstallIntent(parsed);

  if (installIntent === "reconfigure" && !existingManifest) {
    throw new Error(
      "No starter-docs manifest was found in the target directory. Run `starter-docs` first.",
    );
  }

  const interactive = !parsed.yes;
  if (!interactive && installIntent === "reconfigure" && !hasSelectionOverrides(parsed)) {
    throw new Error(
      "`starter-docs reconfigure --yes` requires at least one selection flag. Provide selection flags or run `starter-docs reconfigure` interactively.",
    );
  }

  if (interactive && (!input.isTTY || !output.isTTY)) {
    throw new Error("Interactive prompts require a TTY. Use --yes for non-interactive runs.");
  }

  let selections = resolveSelections({
    parsed,
    existingManifest,
  });
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
        introTitle: "Let's configure your starter-docs install",
      });
      if (!wizardSelections) {
        output.write("Installer cancelled.\n");
        return;
      }
      selections = wizardSelections;
      selectionSource = "interactive wizard selections";
      skipApplyConfirm = true;
    } else if (installIntent === "reconfigure") {
      const wizardSelections = await runSelectionWizard({
        initialSelections: selections,
        introTitle: "Let's reconfigure your starter-docs install",
      });
      if (!wizardSelections) {
        output.write("Installer cancelled.\n");
        return;
      }
      selections = wizardSelections;
      selectionSource = "interactive reconfigure wizard";
      skipApplyConfirm = true;
    }
  }

  let plan = await planInstall({
    targetDir,
    selections,
    existingManifest,
    packageMeta: readPackageMeta(),
  });

  if (interactive) {
    const instructionConflicts = findInstructionConflicts(plan);
    if (instructionConflicts.length > 0) {
      const instructionConflictResolutions =
        await promptForInstructionConflictResolutions(instructionConflicts);
      if (!instructionConflictResolutions) {
        output.write("Installer cancelled.\n");
        return;
      }

      plan = await planInstall({
        targetDir,
        selections,
        existingManifest,
        packageMeta: readPackageMeta(),
        instructionConflictResolutions,
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
  });

  if (parsed.dryRun) {
    output.write("\nDry run complete.\n");
    return;
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
  if (parsed.noPrompts) {
    selections.prompts = false;
  }
  if (parsed.noCodex) {
    selections.harnesses.codex = false;
  }
  if (parsed.noClaudeCode) {
    selections.harnesses["claude-code"] = false;
  }
  if (parsed.noSkills) {
    selections.skills = false;
    selections.optionalSkills = [];
  } else {
    if (parsed.skillScope || parsed.optionalSkills !== undefined) {
      selections.skills = true;
    }
    if (parsed.skillScope) {
      selections.skillScope = parsed.skillScope;
    }
    if (parsed.optionalSkills !== undefined) {
      selections.optionalSkills = [...parsed.optionalSkills];
    }
  }
  if (parsed.templatesMode) {
    selections.templatesMode = parsed.templatesMode;
  }
  if (parsed.referencesMode) {
    selections.referencesMode = parsed.referencesMode;
  }

  return selections;
}

function hasSelectionOverrides(parsed: ParsedArgs): boolean {
  return Boolean(
    parsed.noDesigns ||
      parsed.noPlans ||
      parsed.noPrd ||
      parsed.noWork ||
      parsed.noPrompts ||
      parsed.noCodex ||
      parsed.noClaudeCode ||
      parsed.noSkills ||
      parsed.templatesMode ||
      parsed.referencesMode ||
      parsed.skillScope ||
      parsed.optionalSkills !== undefined,
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
  if (parsed.noPrompts) {
    flags.push("--no-prompts");
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
  if (parsed.templatesMode) {
    flags.push("--templates");
  }
  if (parsed.referencesMode) {
    flags.push("--references");
  }
  if (parsed.skillScope) {
    flags.push("--skill-scope");
  }
  if (parsed.optionalSkills !== undefined) {
    flags.push("--optional-skills");
  }

  return flags;
}

function parseArgs(argv: string[]): ParsedArgs {
  const parsed: ParsedArgs = {
    dryRun: false,
    yes: false,
    help: false,
    backup: false,
    noDesigns: false,
    noPlans: false,
    noPrd: false,
    noWork: false,
    noPrompts: false,
    noCodex: false,
    noClaudeCode: false,
    noSkills: false,
  };

  const args = [...argv];
  rejectRemovedUpdateReconfigure(args);
  rejectRemovedReconfigureFlag(args);
  rejectRemovedCommand(args);

  if (args[0] === "reconfigure" || args[0] === "backup" || args[0] === "uninstall") {
    parsed.command = args.shift() as Command;
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
      case "--no-prompts":
        parsed.noPrompts = true;
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
      case "--templates": {
        const value = args.shift();
        if (value !== "required" && value !== "all") {
          throw new Error("`--templates` must be either `required` or `all`.");
        }
        parsed.templatesMode = value;
        break;
      }
      case "--references": {
        const value = args.shift();
        if (value !== "required" && value !== "all") {
          throw new Error("`--references` must be either `required` or `all`.");
        }
        parsed.referencesMode = value;
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
      case "--optional-skills": {
        const value = args.shift();
        if (!value) {
          throw new Error("`--optional-skills` requires a comma-separated value or `none`.");
        }
        parsed.optionalSkills =
          value === "none"
            ? []
            : Array.from(
                new Set(
                  value
                    .split(",")
                    .map((entry) => entry.trim())
                    .filter((entry) => entry.length > 0),
                ),
              ).sort();

        if (value !== "none" && parsed.optionalSkills.length === 0) {
          throw new Error("`--optional-skills` requires at least one skill id or `none`.");
        }
        break;
      }
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  validateParsedArgs(parsed);
  return parsed;
}

function rejectRemovedUpdateReconfigure(args: string[]): void {
  if (args[0] !== "update" || !args.includes("--reconfigure")) {
    return;
  }

  throw new Error(
    "The `update --reconfigure` command was removed. Use `starter-docs reconfigure` instead.",
  );
}

function rejectRemovedCommand(args: string[]): void {
  const command = args[0];
  if (command !== "init" && command !== "update") {
    return;
  }

  const suggestedArgs = args.slice(1).join(" ");
  const suggestedCommand = suggestedArgs ? `starter-docs ${suggestedArgs}` : "starter-docs";
  throw new Error(
    `The \`${command}\` command was removed. Use \`${suggestedCommand}\` instead.`,
  );
}

function rejectRemovedReconfigureFlag(args: string[]): void {
  if (!args.includes("--reconfigure")) {
    return;
  }

  throw new Error(
    "`--reconfigure` was removed. Use `starter-docs reconfigure` instead.",
  );
}

function validateParsedArgs(parsed: ParsedArgs): void {
  if (parsed.backup && parsed.command !== "uninstall") {
    throw new Error(
      `\`--backup\` is only valid with \`uninstall\`, not \`${parsed.command ?? "no command"}\`.`,
    );
  }

  const selectionOverrideFlags = getSelectionOverrideFlags(parsed);
  if (
    isLifecycleCommand(parsed.command) &&
    selectionOverrideFlags.length > 0
  ) {
    const label = selectionOverrideFlags.length === 1 ? "flag" : "flags";
    const verb = selectionOverrideFlags.length === 1 ? "is" : "are";
    throw new Error(
      `Selection ${label} ${selectionOverrideFlags.join(", ")} ${verb} only valid with \`starter-docs\` or \`starter-docs reconfigure\`, not \`${parsed.command}\`.`,
    );
  }

  if (parsed.noSkills && (parsed.skillScope || parsed.optionalSkills !== undefined)) {
    throw new Error(
      "`--no-skills` cannot be combined with `--skill-scope` or `--optional-skills`.",
    );
  }

  if (parsed.optionalSkills === undefined) {
    return;
  }

  const registry = loadSkillRegistry(PACKAGE_ROOT);
  const optionalSkills = new Set(getOptionalSkills(registry).map((skill) => skill.name));
  const requiredSkills = new Set(getRequiredSkills(registry).map((skill) => skill.name));

  for (const skillName of parsed.optionalSkills) {
    if (requiredSkills.has(skillName)) {
      throw new Error(
        `Required skill \`${skillName}\` cannot be passed to \`--optional-skills\`.`,
      );
    }

    if (!optionalSkills.has(skillName)) {
      const validList = Array.from(optionalSkills).sort().join(", ");
      throw new Error(
        `Unknown optional skill \`${skillName}\`. Valid optional skills: ${validList || "(none)"}.`,
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
  } = options;
  const nonNoop = actions.filter((action) => action.type !== "noop");
  const noopCount = actions.length - nonNoop.length;
  const counts = countActions(actions);
  const manifestPath = path.join(targetDir, "docs/.starter-docs/manifest.json");
  const mode = describeApplyMode({ existingManifest, installIntent });

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
      `Selection source: ${selectionSource}`,
      `Managed files evaluated: ${actions.length}`,
      `Already current: ${noopCount}`,
      `Changes planned: ${nonNoop.length}`,
      `Create: ${counts.create}`,
      `Update/regenerate: ${counts.update + counts.generate + counts["update-conflict"]}`,
      `Remove managed: ${counts["remove-managed"]}`,
      `Stage conflicts: ${counts["skip-conflict"]}`,
    ].join("\n"),
    "Information",
  );

  if (nonNoop.length === 0) {
    renderNoopExplanation({ dryRun, existingManifest });
    return;
  }

  note(nonNoop.map(formatActionLine).join("\n"), "Planned file operations");
}

function countActions(actions: PlannedAction[]): Record<PlannedAction["type"], number> {
  return {
    create: actions.filter((action) => action.type === "create").length,
    generate: actions.filter((action) => action.type === "generate").length,
    noop: actions.filter((action) => action.type === "noop").length,
    "remove-managed": actions.filter((action) => action.type === "remove-managed").length,
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
      "starter-docs did not find an existing manifest, so this run used first-install mode.",
      "The selected files already matched starter-docs content.",
      "Applying will create the manifest that tracks future syncs.",
      "",
    );
  }

  lines.push(
    "Useful next steps:",
    "- Run `starter-docs reconfigure` to change which docs, prompts, harnesses, or skills are managed.",
    "- Run `starter-docs --dry-run` after upgrading starter-docs to preview future changes.",
  );

  note(lines.join("\n"), "Results");
}

function formatActionLabel(action: PlannedAction): string {
  if (action.type === "update-conflict") {
    return "update";
  }

  if (action.reason === "Overwrite existing conflicting agent instructions.") {
    return "overwrite";
  }

  return action.type;
}

function formatActionLine(action: PlannedAction): string {
  const reason = action.reason ? ` (${action.reason})` : "";

  return `- ${formatActionLabel(action)}: ${action.relativePath}${reason}`;
}

function getApplyConfirmationMessage(options: {
  existingManifest: InstallManifest | null;
  installIntent: InstallIntent;
}): string {
  if (options.installIntent === "reconfigure") {
    return "Apply this reconfiguration?";
  }

  return options.existingManifest
    ? "Apply this starter-docs sync?"
    : "Install starter-docs with this plan?";
}

function writeApplyCompletionSummary(options: {
  existingManifest: InstallManifest | null;
  installIntent: InstallIntent;
  manifest: InstallManifest;
  targetDir: string;
}): void {
  if (options.installIntent === "reconfigure") {
    output.write(
      `\nReconfigured starter-docs ${options.manifest.packageVersion} in ${options.targetDir}.\n`,
    );
    return;
  }

  if (options.existingManifest) {
    output.write(
      `\nSynced starter-docs ${options.manifest.packageVersion} in ${options.targetDir}.\n`,
    );
    return;
  }

  output.write(
    `\nInstalled starter-docs ${options.manifest.packageVersion} into ${options.targetDir}.\n`,
  );
}

function printHelp(command?: Command): void {
  switch (command) {
    case "reconfigure":
      output.write(`starter-docs reconfigure

Change the configured starter-docs footprint for an existing install.
Requires an existing docs/.starter-docs/manifest.json in the target directory.

Interactive runs open the selection wizard using the saved manifest selections.
Non-interactive runs with --yes must include at least one selection flag.

Usage:
  starter-docs reconfigure [options]

Options:

General options:
  --target <dir>                 Reconfigure a different starter-docs install directory.
  --dry-run                      Show planned changes without writing files.
  --yes                          Skip interactive prompts; requires a selection flag.
  --help, -h                     Show help for this command.

Content options:
  --no-designs                   Skip docs/designs scaffolding.
  --no-plans                     Skip docs/plans scaffolding.
  --no-prd                       Skip docs/prd scaffolding.
  --no-work                      Skip docs/work scaffolding.
  --no-prompts                   Skip reusable prompt starters.
  --templates required|all       Install required templates only, or the full template set.
  --references required|all      Install required references only, or the full reference set.

Harness options:
  --no-codex                     Skip the Codex harness.
  --no-claude-code               Skip the Claude Code harness.
  Deprecated aliases: --no-agents, --no-claude

Skill options:
  --no-skills                    Skip skill installation entirely.
  --skill-scope project|global   Choose whether skills install in the repo or the global Codex home.
  --optional-skills <csv|none>   Replace the optional skill set with a comma-separated list or none.

Examples:
  starter-docs reconfigure
  starter-docs reconfigure --target ~/Projects/example --dry-run
  starter-docs reconfigure --yes --no-work
  starter-docs reconfigure --yes --no-codex --skill-scope global --optional-skills decompose-codebase
`);
      return;
    case "backup":
      output.write(`starter-docs backup

Create a backup of the managed starter-docs files in the target directory.
This command is non-destructive: source files remain in place.

Usage:
  starter-docs backup [--target <dir>] [--yes] [--help]

Options:
  --target <dir>                   Back up a different starter-docs install directory.
  --yes                            Skip confirmation prompts after showing the audit summary.
  --help, -h                       Show help for this command.

Examples:
  starter-docs backup
  starter-docs backup --target ~/Projects/example
  starter-docs backup --yes
`);
      return;
    case "uninstall":
      output.write(`starter-docs uninstall

Remove the managed starter-docs files from the target directory.
This command is destructive: audited managed files are removed after review.

Usage:
  starter-docs uninstall [--target <dir>] [--backup] [--yes] [--help]

Options:
  --target <dir>                   Uninstall from a different starter-docs install directory.
  --backup                         Create a backup before removing files.
  --yes                            Skip confirmation prompts after showing warnings and the audit summary.
  --help, -h                       Show help for this command.

Examples:
  starter-docs uninstall
  starter-docs uninstall --backup
  starter-docs uninstall --target ~/Projects/example --yes
`);
      return;
    default:
      output.write(`starter-docs

Apply, sync, reconfigure, back up, and remove starter-docs installs.

Usage:
  starter-docs [options]
  starter-docs reconfigure [options]
  starter-docs backup [options]
  starter-docs uninstall [options]

Primary workflow:
  Run starter-docs with no command to install into a new target or sync an existing manifest using saved selections.

Commands:
  reconfigure  Change saved selections for an existing install.
  backup       Create a backup of managed files.
  uninstall    Remove managed files, with an optional backup first.

Examples:
  starter-docs
  starter-docs --yes
  starter-docs --target ~/Projects/example --dry-run
  starter-docs reconfigure
  starter-docs reconfigure --yes --no-skills
  starter-docs backup --yes
  starter-docs uninstall --backup

Use --help or -h with any command for command-specific options and examples.
`);
  }
}
