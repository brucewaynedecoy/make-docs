import path from "node:path";
import { stdin as input, stdout as output } from "node:process";
import { confirm, isCancel } from "@clack/prompts";
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

type Command = "init" | "update";

interface ParsedArgs {
  command?: Command;
  targetDir?: string;
  dryRun: boolean;
  yes: boolean;
  help: boolean;
  reconfigure: boolean;
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

export async function runCli(argv = process.argv.slice(2)): Promise<void> {
  const parsed = parseArgs(argv);
  if (parsed.help) {
    printHelp();
    return;
  }

  const targetDir = path.resolve(parsed.targetDir ?? process.cwd());
  const existingManifest = loadManifest(targetDir);
  const command = inferCommand(parsed, existingManifest);

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

function parseArgs(argv: string[]): ParsedArgs {
  const parsed: ParsedArgs = {
    dryRun: false,
    yes: false,
    help: false,
    reconfigure: false,
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
  if (args[0] === "init" || args[0] === "update") {
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

function validateParsedArgs(parsed: ParsedArgs): void {
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

function printHelp(): void {
  output.write(`starter-docs\n
Usage:
  starter-docs
  starter-docs init [--target <dir>] [--dry-run] [--yes] [--no-designs] [--no-plans] [--no-prd] [--no-work] [--no-prompts] [--templates required|all] [--references required|all] [--no-codex] [--no-claude-code] [--no-skills] [--skill-scope project|global] [--optional-skills <csv|none>]
  starter-docs update [--target <dir>] [--dry-run] [--yes]
  starter-docs update --reconfigure [selection flags]

Selection flags:
  --no-codex                     Skip Codex harness (deprecated alias: --no-agents)
  --no-claude-code              Skip Claude Code harness (deprecated alias: --no-claude)
  --no-skills                   Skip skill installation
  --skill-scope project|global  Set skill install scope
  --optional-skills <csv|none>  Replace selected optional skills
\n`);
}
