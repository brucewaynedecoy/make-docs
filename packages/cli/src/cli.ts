import path from "node:path";
import { stdin as input, stdout as output } from "node:process";
import { confirm, isCancel } from "@clack/prompts";
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
  promptForUpdateWizardAction,
  runSelectionWizard,
} from "./wizard";

type Command = "init" | "update" | "backup" | "uninstall";

interface ParsedArgs {
  command?: Command;
  targetDir?: string;
  dryRun: boolean;
  yes: boolean;
  help: boolean;
  reconfigure: boolean;
  backup: boolean;
  noDesigns: boolean;
  noPlans: boolean;
  noPrd: boolean;
  noWork: boolean;
  noPrompts: boolean;
  noCodex: boolean;
  noClaudeCode: boolean;
  noSkills: boolean;
  permissions?: LifecyclePermissionsMode;
  templatesMode?: TemplatesMode;
  referencesMode?: ReferencesMode;
  skillScope?: InstallSelections["skillScope"];
  optionalSkills?: string[];
}

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
      permissions: parsed.permissions ?? "confirm",
    });
    return;
  }

  if (parsed.command === "uninstall") {
    throw lifecycleCommandNotImplemented(parsed.command);
  }

  const existingManifest = loadManifest(targetDir);
  const command = inferCommand(parsed, existingManifest);

  if (parsed.reconfigure && command !== "update") {
    throw new Error("`--reconfigure` is only valid with `update`.");
  }

  if (command === "update" && !existingManifest) {
    throw new Error(
      "No starter-docs manifest was found in the target directory. Run `starter-docs init` first.",
    );
  }

  if (command === "update" && hasSelectionOverrides(parsed) && !parsed.reconfigure) {
    throw new Error(
      "Selection flags are only valid for `init` or `update --reconfigure`.",
    );
  }

  const interactive = !parsed.yes;
  if (interactive && (!input.isTTY || !output.isTTY)) {
    throw new Error("Interactive prompts require a TTY. Use --yes for non-interactive runs.");
  }

  let selections = resolveSelections({
    parsed,
    command,
    existingManifest,
  });
  let skipApplyConfirm = false;

  if (interactive) {
    if (command === "init") {
      const wizardSelections = await runSelectionWizard({
        initialSelections: selections,
        introTitle: "Let's configure your starter-docs install",
      });
      if (!wizardSelections) {
        output.write("Installer cancelled.\n");
        return;
      }
      selections = wizardSelections;
      skipApplyConfirm = true;
    } else if (parsed.reconfigure) {
      const wizardSelections = await runSelectionWizard({
        initialSelections: selections,
        introTitle: "Let's reconfigure your starter-docs install",
      });
      if (!wizardSelections) {
        output.write("Installer cancelled.\n");
        return;
      }
      selections = wizardSelections;
      skipApplyConfirm = true;
    } else if (!parsed.command && !hasSelectionOverrides(parsed)) {
      const updateAction = await promptForUpdateWizardAction();
      if (!updateAction) {
        output.write("Installer cancelled.\n");
        return;
      }

      const wizardSelections = await runSelectionWizard({
        initialSelections: selections,
        introTitle:
          updateAction === "update-existing"
            ? "Review your current starter-docs install"
            : "Let's reconfigure your starter-docs install",
        startStep: updateAction === "update-existing" ? "review" : "capabilities",
      });
      if (!wizardSelections) {
        output.write("Installer cancelled.\n");
        return;
      }
      selections = wizardSelections;
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

  printPlan(plan.actions);

  if (parsed.dryRun) {
    output.write("\nDry run complete.\n");
    return;
  }

  if (interactive && !skipApplyConfirm) {
    const proceed = await confirm({
      message: "Apply these changes?",
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

  output.write(
    `\nInstalled starter-docs ${applied.manifest.packageVersion} into ${targetDir}.\n`,
  );
  output.write(`Manifest: ${path.join(targetDir, "docs/.starter-docs/manifest.json")}\n`);
  if (applied.conflictFiles.length > 0) {
    output.write("Conflicts were staged for manual review:\n");
    for (const conflictFile of applied.conflictFiles) {
      output.write(`- ${conflictFile}\n`);
    }
  }
}

function inferCommand(
  parsed: ParsedArgs,
  existingManifest: InstallManifest | null,
): Command {
  if (parsed.command) {
    return parsed.command;
  }

  if (existingManifest) {
    return "update";
  }

  return "init";
}

function resolveSelections(options: {
  parsed: ParsedArgs;
  command: Command;
  existingManifest: InstallManifest | null;
}): InstallSelections {
  const { parsed, command, existingManifest } = options;
  const baseSelections =
    command === "update" && existingManifest
      ? existingManifest.selections
      : defaultSelections();

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
    reconfigure: false,
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
  if (
    args[0] === "init" ||
    args[0] === "update" ||
    args[0] === "backup" ||
    args[0] === "uninstall"
  ) {
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
      case "--reconfigure":
        parsed.reconfigure = true;
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
      case "--permissions": {
        const value = args.shift();
        if (value !== "confirm" && value !== "allow-all") {
          throw new Error("`--permissions` must be either `confirm` or `allow-all`.");
        }
        parsed.permissions = value;
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

function validateParsedArgs(parsed: ParsedArgs): void {
  if (parsed.backup && parsed.command !== "uninstall") {
    throw new Error(
      `\`--backup\` is only valid with \`uninstall\`, not \`${parsed.command ?? "no command"}\`.`,
    );
  }

  if (parsed.permissions && !isLifecycleCommand(parsed.command)) {
    throw new Error(
      `\`--permissions\` is only valid with \`backup\` or \`uninstall\`, not \`${parsed.command ?? "no command"}\`.`,
    );
  }

  if (parsed.reconfigure && parsed.command && parsed.command !== "update") {
    throw new Error("`--reconfigure` is only valid with `update`.");
  }

  const selectionOverrideFlags = getSelectionOverrideFlags(parsed);
  if (
    parsed.command &&
    selectionOverrideFlags.length > 0 &&
    (parsed.command !== "init" && (parsed.command !== "update" || !parsed.reconfigure))
  ) {
    const label = selectionOverrideFlags.length === 1 ? "flag" : "flags";
    const verb = selectionOverrideFlags.length === 1 ? "is" : "are";
    throw new Error(
      `Selection ${label} ${selectionOverrideFlags.join(", ")} ${verb} only valid with \`init\` or \`update --reconfigure\`, not \`${parsed.command}\`.`,
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

function printPlan(actions: PlannedAction[]): void {
  const nonNoop = actions.filter((action) => action.type !== "noop");
  const noopCount = actions.length - nonNoop.length;

  output.write("\nPlanned changes:\n");
  for (const action of nonNoop) {
    const actionLabel =
      action.type === "update-conflict"
        ? "update"
        : action.reason === "Overwrite existing conflicting agent instructions."
          ? "overwrite"
          : action.type;
    output.write(
      `- ${actionLabel}: ${action.relativePath}${action.reason ? ` (${action.reason})` : ""}\n`,
    );
  }
  output.write(`- noop: ${noopCount} file(s)\n`);
}

function lifecycleCommandNotImplemented(command: "backup" | "uninstall"): Error {
  return new Error(
    `The \`${command}\` command is not implemented yet. Run \`starter-docs ${command} --help\` to review the planned interface.`,
  );
}

function printHelp(command?: Command): void {
  switch (command) {
    case "init":
      output.write(`starter-docs init

Create a new starter-docs install in the target directory.

Usage:
  starter-docs init [options]

Options:

General options:
  --target <dir>                 Install into a different directory.
  --dry-run                      Show planned changes without writing files.
  --yes                          Skip interactive prompts when possible.
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
  starter-docs init
  starter-docs init --target ~/Projects/example --dry-run
  starter-docs init --no-designs --no-plans --optional-skills none
`);
      return;
    case "update":
      output.write(`starter-docs update

Update an existing starter-docs install in the target directory.

Usage:
  starter-docs update [--target <dir>] [--dry-run] [--yes] [--help]
  starter-docs update --reconfigure [options]

Options:

General options:
  --target <dir>                 Update a different starter-docs install directory.
  --dry-run                      Show planned changes without writing files.
  --yes                          Skip interactive prompts when possible.
  --help, -h                     Show help for this command.

Reconfigure options:
  --reconfigure                  Review and change install selections before applying updates.

Content options:
  --no-designs                   Skip docs/designs scaffolding when reconfiguring.
  --no-plans                     Skip docs/plans scaffolding when reconfiguring.
  --no-prd                       Skip docs/prd scaffolding when reconfiguring.
  --no-work                      Skip docs/work scaffolding when reconfiguring.
  --no-prompts                   Skip reusable prompt starters when reconfiguring.
  --templates required|all       Choose required templates only, or the full template set.
  --references required|all      Choose required references only, or the full reference set.

Harness options:
  --no-codex                     Skip the Codex harness when reconfiguring.
  --no-claude-code               Skip the Claude Code harness when reconfiguring.
  Deprecated aliases: --no-agents, --no-claude

Skill options:
  --no-skills                    Skip skill installation entirely when reconfiguring.
  --skill-scope project|global   Choose whether skills install in the repo or the global Codex home.
  --optional-skills <csv|none>   Replace the optional skill set with a comma-separated list or none.

Examples:
  starter-docs update
  starter-docs update --reconfigure
  starter-docs update --target ~/Projects/example --dry-run
`);
      return;
    case "backup":
      output.write(`starter-docs backup

Create a backup of the managed starter-docs files in the target directory.

Usage:
  starter-docs backup [--target <dir>] [--permissions confirm|allow-all] [--help]

Options:
  --target <dir>                   Back up a different starter-docs install directory.
  --permissions confirm|allow-all  Control confirmation prompts for the backup run.
                                   confirm asks before copying files.
                                   allow-all skips confirmation prompts after showing the audit summary.
  --help, -h                       Show help for this command.

Examples:
  starter-docs backup
  starter-docs backup --target ~/Projects/example
  starter-docs backup --permissions allow-all
`);
      return;
    case "uninstall":
      output.write(`starter-docs uninstall

Remove the managed starter-docs files from the target directory.

Usage:
  starter-docs uninstall [--target <dir>] [--backup] [--permissions confirm|allow-all] [--help]

Options:
  --target <dir>                   Uninstall from a different starter-docs install directory.
  --backup                         Create a backup before removing files.
  --permissions confirm|allow-all  Control confirmation prompts for the uninstall run.
                                   confirm asks before removing files.
                                   allow-all skips confirmation prompts after showing warnings and the audit summary.
  --help, -h                       Show help for this command.

Examples:
  starter-docs uninstall
  starter-docs uninstall --backup
  starter-docs uninstall --target ~/Projects/example --permissions allow-all
`);
      return;
    default:
      output.write(`starter-docs

Create, update, back up, and remove starter-docs installs.

Usage:
  starter-docs
  starter-docs <command> [options]
  starter-docs --help

Commands:
  init       Create a new starter-docs install in the target directory.
  update     Update an existing starter-docs install.
  backup     Create a backup of managed files before lifecycle changes.
  uninstall  Remove managed files, with an optional backup first.

Common patterns:
  starter-docs
  starter-docs init --target ~/Projects/example --dry-run
  starter-docs update --reconfigure
  starter-docs backup --permissions confirm
  starter-docs uninstall --backup

Run starter-docs with no command to choose init or update automatically based on the target manifest.
Run starter-docs <command> --help for command-specific options and examples.
`);
  }
}
