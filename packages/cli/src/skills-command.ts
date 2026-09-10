import { stdin as input, stdout as output, stderr as reviewOutput } from "node:process";
import { confirm, isCancel, note } from "@clack/prompts";
import {
  applySkillsOnlyInstallPlan,
  planSkillsOnlyInstall,
} from "./install";
import { loadMakeDocsConfigOrThrow, type MakeDocsConfig } from "./config";
import { loadManifest } from "./manifest";
import { applySkillAdoptionReview, buildSkillAdoptionReview, presentSkillAdoptionReview } from "./skills-adoption";
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
  adoptExisting?: string[];
  review?: string;
};

export async function runSkillsCommand(options: SkillsCommandOptions): Promise<void> {
  if (options.review && !options.adoptExisting) throw new Error("--review requires --adopt-existing.");
  if (options.adoptExisting && options.remove) throw new Error("--adopt-existing cannot be used with --remove.");
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
  if (options.adoptExisting) {
    const review = await buildSkillAdoptionReview({targetDir:options.targetDir,selections:initialSelections,adoptExisting:options.adoptExisting,effectiveRegistry:effectiveSkillRegistry});
    const presented = presentSkillAdoptionReview(review);
    reviewOutput.write(renderAdoptionSummary(presented));
    if (options.dryRun) { output.write(`${JSON.stringify(presented,null,2)}\n`); return; }
    if (presented.status === "blocked") throw new Error(review.blockers.join("\n"));
    let digest = options.review;
    if (!digest && presented.status !== "unchanged") {
      if (options.yes || !input.isTTY || !output.isTTY) throw new Error("Adoption requires --review <digest> from a complete dry run. --yes does not approve adoption.");
      output.write(`${JSON.stringify(presented,null,2)}\n`);
      const accepted = await confirm({message:"Apply this exact Skill adoption review?"});
      if (isCancel(accepted) || !accepted) { output.write("Skill adoption cancelled.\n"); return; }
      digest = review.digest;
    }
    const result = applySkillAdoptionReview(review,digest ?? review.digest);
    output.write(`${JSON.stringify({...result,review:presented},null,2)}\n`);
    return;
  }
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

function renderAdoptionSummary(review: ReturnType<typeof presentSkillAdoptionReview>): string {
  const effects = {register: 0, update: 0, remove: 0, retain: 0};
  for (const row of review.ownership) effects[row.effect]++;
  const files = review.ownership.filter(row => row.after && !row.after.skillExposure).length;
  const exposures = review.ownership.filter(row => row.after?.skillExposure).length;
  const registrations = review.ownership.filter(row => row.effect === 'register' && row.after && !row.after.skillExposure);
  const registeredFiles = registrations.length;
  const registeredSkills = new Set(registrations.flatMap(row => review.selectedSkills.filter(name => row.path.includes(`/skills/${name}/`)))).size;
  const skills = new Set(review.selectedSkills).size;
  const toolLabels: Record<string, string> = { codex: 'Codex', 'claude-code': 'Claude Code' };
  const skillRoots = [...new Set(review.ownership.flatMap(row => {
    if (!row.after) return [];
    const normalized = row.path.replace(/\\/g, '/');
    const segment = normalized.lastIndexOf('/skills/');
    return segment < 0 ? [] : [normalized.slice(0, segment + '/skills'.length)];
  }))].sort();
  const lines = [
    `Skill adoption review: ${review.status}.`,
    `Target: ${review.targetRoot}`,
    `Scope: ${review.scope}.`,
    `Selected tools: ${review.selectedTools.map(tool => toolLabels[tool] ?? tool).join(', ') || 'none'}.`,
    `Skill roots: ${skillRoots.join(', ') || 'none'}.`,
  ];
  if (review.status === 'blocked') {
    lines.push('Adoption is blocked. No changes have been made.', ...review.blockers.map(message => `- ${message}`));
  } else if (review.status === 'unchanged') {
    lines.push(`Make Docs already manages ${files} files and ${exposures} native exposures across ${skills} Skills.`, 'No file or ownership changes are needed.');
  } else {
    if (!review.changes.length) {
      lines.push('No file contents will change.');
      if (registeredFiles) lines.push(`If approved, Make Docs will manage ${registeredFiles} existing files across ${registeredSkills} ${registeredSkills === 1 ? 'Skill' : 'Skills'}.`);
      else lines.push('Ownership records will change only if you approve.');
    }
    lines.push(`Planned path changes: ${new Set(review.changes.map(change => change.path)).size}. Backup files: ${review.backups.length}.`);
    lines.push('No adoption changes have been applied.');
  }
  lines.push(`Ownership entries: ${effects.register} to register, ${effects.update} to update, ${effects.remove} to remove, ${effects.retain} to retain.`);
  lines.push(...review.recoveryLimits, review.nextAction);
  return lines.join('\n') + '\n';
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
  selections.harnesses = {...(baseSelections.skillHarnesses ?? baseSelections.harnesses)};

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
  selections.skillHarnesses = {...selections.harnesses};

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
    options.state.action === "remove" ? "make-docs setup skills removal plan" : "make-docs setup skills plan";
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
  if (options.state.action === "remove") {
    output.write("Removed managed skills. Ownership is recorded in the global Make Docs Store.\n");
    return;
  }

  const counts = countSkillActions(options.plan.actions);
  const changedCount =
    counts.create +
    counts.generate +
    counts.update +
    counts["update-conflict"] +
    counts["strip-managed-block"] +
    counts["remove-managed"];
  const verb = options.existingManifest ? "Updated" : "Installed";
  output.write(`${verb} skills (${changedCount} changed). Ownership is recorded in the global Make Docs Store.\n`);
}
