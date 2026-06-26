import { stdin as input, stdout as output } from "node:process";
import { note } from "@clack/prompts";
import {
  applySkillsOnlyInstallPlan,
  planSkillsOnlyInstall,
} from "./install";
import { loadMakeDocsConfigOrThrow, type MakeDocsConfig } from "./config";
import { loadManifest, MANIFEST_RELATIVE_PATH } from "./manifest";
import { cloneSelections, defaultSelections } from "./profile";
import {
  applySkillRegistrySelectionMetadata,
  getRecommendedSkillChoices,
} from "./skill-catalog";
import {
  loadEffectiveSkillRegistry,
  type EffectiveSkillRegistry,
  type SkillRegistry,
} from "./skill-registry";
import {
  applySkillsUiStateToSelections,
  countSkillActions,
  createClackSkillsUiRenderer,
  renderSkillsPlanSummary,
  runSkillsUiWithRenderer,
  stateFromSkillsSelections,
  type SkillsUiState,
} from "./skills-ui";
import type { InstallManifest, InstallPlan, InstallSelections } from "./types";
import { PACKAGE_ROOT, readPackageMeta } from "./utils";

export type SkillsCommandOptions = {
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

export async function runSkillsCommand(options: SkillsCommandOptions): Promise<void> {
  const loadedConfig = loadMakeDocsConfigOrThrow(options.targetDir);
  const makeDocsConfig = loadedConfig.config;
  const existingManifest = loadManifest(options.targetDir);
  const effectiveSkillRegistry = loadEffectiveSkillRegistry({
    packageRoot: PACKAGE_ROOT,
    manifestReference: options.skillsManifest,
  });
  const initialSelections = applySkillRegistrySelectionMetadata(
    resolveSkillsSelections(options, existingManifest),
    effectiveSkillRegistry,
  );
  const packageMeta = readPackageMeta();
  validateSelectedSkills(initialSelections, effectiveSkillRegistry.registry);
  const interactiveState = await resolveInteractiveSkillsState({
    options,
    existingManifest,
    initialSelections,
    packageMeta,
    config: makeDocsConfig,
    effectiveSkillRegistry,
    skillChoices: getRecommendedSkillChoices(effectiveSkillRegistry.registry),
  });

  if (interactiveState === null) {
    output.write("Skills command cancelled.\n");
    return;
  }

  const state =
    interactiveState ??
    stateFromSkillsSelections({
      action: options.remove ? "remove" : "sync",
      targetDir: options.targetDir,
      selections: initialSelections,
    });
  const selections = applySkillRegistrySelectionMetadata(
    applySkillsUiStateToSelections(state, initialSelections),
    effectiveSkillRegistry,
  );
  const plan = await planSkillsOnlyInstall({
    targetDir: options.targetDir,
    selections,
    existingManifest,
    remove: state.action === "remove",
    packageMeta,
    skillRegistry: effectiveSkillRegistry.registry,
  });
  const hasPlannedChanges = plan.actions.some((action) => action.type !== "noop");

  printSkillsPlan({
    dryRun: options.dryRun,
    plan,
    state,
    config: makeDocsConfig,
  });

  if (options.dryRun) {
    output.write("\nDry run complete.\n");
    return;
  }

  if (!hasPlannedChanges) {
    output.write("No make-docs skill changes are needed.\n");
    return;
  }

  if (!options.yes && (!input.isTTY || !output.isTTY)) {
    throw new Error("Interactive prompts require a TTY. Use --yes for non-interactive runs.");
  }

  const applied = applySkillsOnlyInstallPlan({
    targetDir: options.targetDir,
    plan,
    existingManifest,
  });

  writeSkillsCompletion({
    existingManifest,
    state,
    plan,
  });

  if (applied.conflictFiles.length > 0) {
    output.write("Conflicts were staged for manual review:\n");
    for (const conflictFile of applied.conflictFiles) {
      output.write(`- ${conflictFile}\n`);
    }
  }
}

async function resolveInteractiveSkillsState(options: {
  options: SkillsCommandOptions;
  existingManifest: InstallManifest | null;
  initialSelections: InstallSelections;
  packageMeta: ReturnType<typeof readPackageMeta>;
  config: MakeDocsConfig;
  effectiveSkillRegistry: EffectiveSkillRegistry;
  skillChoices: ReturnType<typeof getRecommendedSkillChoices>;
}): Promise<SkillsUiState | null | undefined> {
  const {
    options: commandOptions,
    existingManifest,
    initialSelections,
    packageMeta,
    config,
    effectiveSkillRegistry,
    skillChoices,
  } = options;

  if (commandOptions.yes || !input.isTTY || !output.isTTY) {
    return undefined;
  }

  const initialState = stateFromSkillsSelections({
    action: commandOptions.remove ? "remove" : "sync",
    targetDir: commandOptions.targetDir,
    selections: initialSelections,
  });

  return runSkillsUiWithRenderer(createClackSkillsUiRenderer(), {
    initialState,
    introTitle: "Manage make-docs skills",
    config,
    skillChoices,
    async buildReviewState(state) {
      const selections = applySkillRegistrySelectionMetadata(
        applySkillsUiStateToSelections(state, initialSelections),
        effectiveSkillRegistry,
      );
      const plan = await planSkillsOnlyInstall({
        targetDir: commandOptions.targetDir,
        selections,
        existingManifest,
        remove: state.action === "remove",
        packageMeta,
        skillRegistry: effectiveSkillRegistry.registry,
      });

      return {
        state,
        summary: renderSkillsPlanSummary({
          state,
          actions: plan.actions,
          dryRun: commandOptions.dryRun,
          config,
        }),
        actions:
          state.action === "sync"
            ? ["apply", "edit-action", "edit-platforms", "edit-scope", "edit-skills", "cancel"]
            : ["apply", "edit-action", "cancel"],
      };
    },
  });
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
  if (options.selectedSkills !== undefined) {
    selections.selectedSkills = [...options.selectedSkills];
  }

  return selections;
}

function validateSelectedSkills(
  selections: InstallSelections,
  registry: SkillRegistry,
): void {
  const registrySkills = new Set(registry.skills.map((skill) => skill.name));
  for (const skillName of selections.selectedSkills) {
    if (!registrySkills.has(skillName)) {
      const validList = Array.from(registrySkills).sort().join(", ");
      throw new Error(
        `Unknown selected skill \`${skillName}\`. Valid skills: ${validList || "(none)"}.`,
      );
    }
  }
}

function printSkillsPlan(options: {
  dryRun: boolean;
  plan: InstallPlan;
  state: SkillsUiState;
  config: MakeDocsConfig;
}): void {
  const title =
    options.state.action === "remove" ? "make-docs skills removal plan" : "make-docs skills plan";
  note(
    renderSkillsPlanSummary({
      state: options.state,
      actions: options.plan.actions,
      dryRun: options.dryRun,
      config: options.config,
    }),
    title,
  );
}

function writeSkillsCompletion(options: {
  existingManifest: InstallManifest | null;
  state: SkillsUiState;
  plan: InstallPlan;
}): void {
  const manifestPath = `${options.state.targetDir}/${MANIFEST_RELATIVE_PATH}`;
  if (options.state.action === "remove") {
    output.write(`Removed managed skills. Manifest: ${manifestPath}\n`);
    return;
  }

  const counts = countSkillActions(options.plan.actions);
  const changedCount =
    counts.create +
    counts.generate +
    counts.update +
    counts["update-conflict"] +
    counts["remove-managed"];
  const verb = options.existingManifest ? "Updated" : "Installed";
  output.write(`${verb} skills (${changedCount} changed). Manifest: ${manifestPath}\n`);
}
