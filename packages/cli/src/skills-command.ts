import { stdin as input, stdout as output } from "node:process";
import { confirm, isCancel, note } from "@clack/prompts";
import {
  applySkillsOnlyInstallPlan,
  planSkillsOnlyInstall,
} from "./install";
import { loadManifest } from "./manifest";
import { cloneSelections, defaultSelections } from "./profile";
import type { InstallManifest, InstallSelections, PlannedAction } from "./types";
import { readPackageMeta } from "./utils";

export type SkillsCommandOptions = {
  targetDir: string;
  dryRun: boolean;
  yes: boolean;
  remove: boolean;
  noCodex: boolean;
  noClaudeCode: boolean;
  skillScope?: InstallSelections["skillScope"];
  optionalSkills?: string[];
};

export async function runSkillsCommand(options: SkillsCommandOptions): Promise<void> {
  const existingManifest = loadManifest(options.targetDir);
  const selections = resolveSkillsSelections(options, existingManifest);
  const plan = await planSkillsOnlyInstall({
    targetDir: options.targetDir,
    selections,
    existingManifest,
    remove: options.remove,
    packageMeta: readPackageMeta(),
  });
  const hasPlannedChanges = plan.actions.some((action) => action.type !== "noop");

  printSkillsPlan({
    actions: plan.actions,
    dryRun: options.dryRun,
    remove: options.remove,
    targetDir: options.targetDir,
  });

  if (options.dryRun) {
    output.write("\nDry run complete.\n");
    return;
  }

  if (!hasPlannedChanges) {
    output.write("No make-docs skill changes are needed.\n");
    return;
  }

  if (!options.yes && hasPlannedChanges) {
    if (!input.isTTY || !output.isTTY) {
      throw new Error("Interactive prompts require a TTY. Use --yes for non-interactive runs.");
    }

    const proceed = await confirm({
      message: options.remove
        ? "Remove managed make-docs skill files?"
        : "Apply make-docs skill changes?",
      initialValue: true,
      active: "Yes",
      inactive: "No",
      withGuide: true,
    });

    if (isCancel(proceed) || !proceed) {
      output.write("Skills command cancelled.\n");
      return;
    }
  }

  const applied = applySkillsOnlyInstallPlan({
    targetDir: options.targetDir,
    plan,
    existingManifest,
  });

  output.write(
    options.remove
      ? `Removed make-docs skills. Manifest: ${options.targetDir}/docs/.assets/config/manifest.json\n`
      : `Synchronized make-docs skills. Manifest: ${options.targetDir}/docs/.assets/config/manifest.json\n`,
  );

  if (applied.conflictFiles.length > 0) {
    output.write("Conflicts were staged for manual review:\n");
    for (const conflictFile of applied.conflictFiles) {
      output.write(`- ${conflictFile}\n`);
    }
  }
}

function resolveSkillsSelections(
  options: SkillsCommandOptions,
  existingManifest: InstallManifest | null,
): InstallSelections {
  const baseSelections = existingManifest ? existingManifest.selections : defaultSelections();
  const selections = cloneSelections(baseSelections);

  selections.skills = true;
  if (options.noCodex) {
    selections.harnesses.codex = false;
  }
  if (options.noClaudeCode) {
    selections.harnesses["claude-code"] = false;
  }
  if (options.skillScope) {
    selections.skillScope = options.skillScope;
  }
  if (options.optionalSkills !== undefined) {
    selections.optionalSkills = [...options.optionalSkills];
  }

  return selections;
}

function printSkillsPlan(options: {
  actions: PlannedAction[];
  dryRun: boolean;
  remove: boolean;
  targetDir: string;
}): void {
  const counts = countActions(options.actions);
  const title = options.remove ? "make-docs skills removal plan" : "make-docs skills plan";
  note(
    [
      `Target: ${options.targetDir}`,
      `Mode: ${options.dryRun ? "dry run" : "apply"}`,
      `Already current: ${counts.noop}`,
      `Create/update: ${counts.create + counts.update + counts.generate}`,
      `Remove managed: ${counts["remove-managed"]}`,
      `Stage conflicts: ${counts["skip-conflict"]}`,
    ].join("\n"),
    title,
  );
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
