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
import {
  Checkpoint9ReceiptProjectionError,
  executeInstallPlanMigration,
  executeStoreCheckpoint9Migration,
} from "./migration";
import { createExecutionContext } from "./operations/context";
import { invokeOperation } from "./operations/registry";
import { runRunCommand } from "./run/cli";
import { runProjectCommand, runResourceCommand } from "./run/root-operations";
import {
  bootstrapGlobalStore,
  mirrorProjectManifest,
  resolveStoreRoot,
  withStoreDatabase,
} from "./store";
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
  ProjectResourceType,
} from "./types";
import { PROJECT_RESOURCE_TYPES } from "./types";
import { PACKAGE_ROOT, readPackageMeta } from "./utils";
import {
  promptForManagedFileConflictResolutions,
  runSelectionWizard,
} from "./wizard";

/**
 * The seven-command top level per PRD 39 R-TOP-1.
 */
type Command =
  | "setup"
  | "project"
  | "resource"
  | "run"
  | "mcp"
  | "update"
  | "uninstall";
type SetupSubcommand = "reconfigure" | "skills" | "backup" | "remove";
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
  setupSubcommand?: SetupSubcommand;
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
  projectResources?: ProjectResourceType[];
  skillsManifest?: string;
  runArgs: string[];
}

type UninstallCommandOptions = {
  targetDir: string;
  backup: boolean;
  permissions: LifecyclePermissionsMode;
};

type UninstallCommandRunner = (options: UninstallCommandOptions) => Promise<unknown>;
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

/**
 * Parses and validates one make-docs CLI argv WITHOUT executing it, throwing
 * exactly where {@link runCli} would refuse the invocation (unknown command,
 * unknown flag, flag/subcommand mismatch). Exposed for the W18 R13
 * conformance kit generator's executable-by-construction check (PRD 43
 * R-KIT-3): rendered scenario commands are projected through the REAL parser
 * — never a kit-local grammar table — so a command the current CLI does not
 * accept fails kit generation, before any lab session starts. `run` argv is
 * intentionally not deep-validated here; the run tree's own resolver and
 * adapters (`adaptRunCliArgv` in src/run/cli.ts) own that surface.
 */
export function validateMakeDocsCliArgv(argv: string[]): void {
  validateParsedArgs(parseArgs(argv));
}

export async function runCli(argv = process.argv.slice(2)): Promise<void> {
  if (argv[0] === "--version" || argv[0] === "-v") {
    output.write(`${readPackageMeta().version}\n`);
    return;
  }
  const parsed = parseArgs(argv);
  if (parsed.help) {
    printHelp(parsed.command, parsed.setupSubcommand);
    return;
  }

  if (parsed.command === "run") {
    await runRunCommand(parsed.runArgs);
    return;
  }

  if (parsed.command === "resource") {
    await runResourceCommand(parsed.runArgs);
    return;
  }

  if (parsed.command === "project") {
    if (parsed.runArgs[0] === "path-hygiene" && parsed.runArgs[1] === "validate") {
      await runProjectPathHygieneCommand(parsed.runArgs.slice(2));
      return;
    }
    await runProjectCommand(parsed.runArgs);
    return;
  }

  if (parsed.command === "mcp") {
    const { runMcpServer } = await import("./mcp/server");
    await runMcpServer();
    return;
  }

  if (parsed.command === "update") {
    const { runToolUpdateCommand } = await import("./self");
    await runToolUpdateCommand({
      yes: parsed.yes,
      ...(parsed.targetDir ? { targetDir: path.resolve(parsed.targetDir) } : {}),
    });
    return;
  }

  if (parsed.command === "uninstall") {
    const { runToolUninstallCommand } = await import("./self");
    await runToolUninstallCommand({ yes: parsed.yes });
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

  if (parsed.setupSubcommand === "backup") {
    await runBackupCommand({
      targetDir,
      permissions: parsed.yes ? "allow-all" : "confirm",
    });
    return;
  }

  if (parsed.setupSubcommand === "remove") {
    const runUninstallCommand = await loadUninstallCommand();
    await runUninstallCommand({
      targetDir,
      backup: parsed.backup,
      permissions: parsed.yes ? "allow-all" : "confirm",
    });
    return;
  }

  if (parsed.setupSubcommand === "skills") {
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

  // Context-aware bare invocation (R-BARE-1): with an install present, show
  // status and help and never auto-sync; with none, continue into the guided
  // interactive setup below, which asks before writing. The installer-first
  // posture survives without a forced command-router.
  if (parsed.command === undefined) {
    const bareClassification = await classifyCompatibilityState({ targetDir });
    if (bareClassification.evidence.manifestTrust.present) {
      const bareManifest = bareClassification.evidence.manifestTrust.parseable
        ? loadManifest(targetDir)
        : null;
      printInstallStatus({
        targetDir,
        manifest: bareManifest,
        classification: bareClassification,
      });
      return;
    }
    if (!input.isTTY || !output.isTTY) {
      output.write(
        [
          `No make-docs install was detected in ${targetDir}.`,
          "Bare `make-docs` starts a guided setup only in an interactive terminal.",
          "Run `make-docs setup` (interactive) or `make-docs setup --yes` (non-interactive) to install.",
          "",
        ].join("\n"),
      );
      return;
    }
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
      "No make-docs manifest was found in the target directory. Run `make-docs setup` first.",
    );
  }

  const interactive = !parsed.yes;

  // Pre-v2 detection on `setup` and `setup reconfigure` (R-MIG-2): a
  // fingerprinted pre-v2 install gets the warning-and-choice flow — back up
  // and install the latest version (recommended) or cancel — before any
  // compatibility disposition or write path runs. Cancelling leaves the
  // install untouched; there are no aliases to fall back to (R-MIG-1).
  if (!freshInstallTarget) {
    const { detectPreV2Install, promptPreV2Choice } = await import("./self");
    const preV2 = detectPreV2Install({
      targetDir,
      classification: compatibilityClassification,
    });
    if (preV2.preV2) {
      const choice = await promptPreV2Choice({
        detection: preV2,
        interactive,
        command: installIntent === "reconfigure" ? "setup reconfigure" : "setup",
      });
      if (choice === "cancel") {
        output.write("Setup cancelled. The existing pre-v2 install was left untouched.\n");
        return;
      }
      // The fixed migration coordinator creates and verifies the one reviewed
      // backup after it acquires the project lock and freezes the snapshot.
    }
  }

  guardCompatibilityDisposition({
    classification: compatibilityClassification,
    interactive,
    freshInstallTarget,
  });

  if (!interactive && installIntent === "reconfigure" && !hasSelectionOverrides(parsed)) {
    throw new Error(
      "`make-docs setup reconfigure --yes` requires at least one selection flag. Provide selection flags or run `make-docs setup reconfigure` interactively.",
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

  assertExistingInstallSkillSelectionUnchanged({
    existingManifest,
    selections,
  });

  const packageMeta = readPackageMeta();
  let plan = await planInstall({
    targetDir,
    selections,
    existingManifest,
    packageMeta,
    skillRegistry: effectiveSkillRegistry.registry,
    operation: installIntent === "reconfigure" ? "setup.reconfigure" : "setup",
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
        operation: installIntent === "reconfigure" ? "setup.reconfigure" : "setup",
      });
    }
  }

  if (!hasEffectiveCapabilities(plan.profile)) {
    throw new Error("At least one capability must remain enabled.");
  }

  const hasPlannedChanges = plan.actions.some((action) => action.type !== "noop");
  const requiresProjectIdMigration = Boolean(existingManifest && !existingManifest.projectId);
  const hasInstallMutation = hasPlannedChanges || requiresProjectIdMigration;
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
    selectedResourceTypes: plan.profile.selections.resourceProjection,
    stops: plan.stops ?? [],
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
        "Run `make-docs setup` without `--yes` to review the conflicts interactively.",
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

  if (interactive && !skipApplyConfirm && hasInstallMutation) {
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

  const storeRoot = resolveStoreRoot();
  if (freshInstallTarget || !hasInstallMutation) {
    const checkpoint9 = executeStoreCheckpoint9Migration({
      projectRoot: targetDir,
      storeRoot,
    });
    if (!checkpoint9.setupMayContinue) {
      throw new Checkpoint9ReceiptProjectionError(checkpoint9);
    }
  }
  const applied = !freshInstallTarget && hasInstallMutation
    ? executeInstallPlanMigration({
        projectRoot: targetDir,
        storeRoot,
        compatibility: compatibilityClassification,
        installPlan: plan,
        existingManifest,
      })
    : applyInstallPlan({
        targetDir,
        plan,
        existingManifest,
      });

  // Explicit migration signal for pre-identifier installs (PRD 38 R-ID-1):
  // when an existing manifest predates the stable project identifier, this
  // apply minted one, and the user is told rather than it happening silently.
  if (existingManifest && !existingManifest.projectId && applied.manifest.projectId) {
    output.write(
      `Minted stable project identifier ${applied.manifest.projectId} in ${MANIFEST_RELATIVE_PATH} ` +
        "(this install predated project identifiers; the identifier keys this project's " +
        "operational state in the global store and never changes).\n",
    );
  }

  if (hasInstallMutation) {
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

  // Machine-level global store bootstrap (R-STORE-1). Runs after the local
  // repository apply so the store can never influence it, writes only under
  // the store root, and never throws — store trouble degrades to warnings
  // because it is recoverable operational state, not project knowledge.
  const storeReport = bootstrapGlobalStore({ packageMeta });
  for (const warning of storeReport.warnings) {
    output.write(`Warning: ${warning}\n`);
  }

  // Install/directory registry mirror upsert (R-MIR-1), wired at the same
  // seam as the store bootstrap: refresh this project's mirror row from the
  // manifest the apply just wrote. The mirror is an index only — the
  // canonical install record stays `.make-docs/manifest.json` — so any
  // failure degrades to a warning and never affects the applied install.
  if (
    storeReport.databaseStatus === "created" ||
    storeReport.databaseStatus === "ready" ||
    storeReport.databaseStatus === "recovered"
  ) {
    try {
      withStoreDatabase(storeReport.storeRoot, (db) => {
        mirrorProjectManifest(db, { repoRoot: targetDir, manifest: applied.manifest });
      });
    } catch (error) {
      output.write(
        `Warning: could not refresh the install registry mirror (${error instanceof Error ? error.message : String(error)}). ` +
          "The project manifest remains the canonical install record; the mirror can be rebuilt from it.\n",
      );
    }
  }
}

async function runProjectPathHygieneCommand(argv: string[]): Promise<void> {
  let targetRoot: string | undefined;
  let manifest: string | undefined;
  let includeSkills = false;
  let allowCommentToken: string | undefined;
  const args = [...argv];
  while (args.length > 0) {
    const arg = args.shift()!;
    if (arg === "--target" || arg === "--target-root") {
      const value = args.shift();
      if (!value) throw new Error(`\`${arg}\` requires a path.`);
      targetRoot = path.resolve(value);
    } else if (arg === "--manifest") {
      const value = args.shift();
      if (!value) throw new Error("`--manifest` requires a path.");
      manifest = value;
    } else if (arg === "--include-skills") {
      includeSkills = true;
    } else if (arg === "--allow-comment-token") {
      const value = args.shift();
      if (!value) throw new Error("`--allow-comment-token` requires text.");
      allowCommentToken = value;
    } else {
      throw new Error(`Unknown project path-hygiene option: \`${arg}\`.`);
    }
  }
  const invocation = await invokeOperation(
    "project.path-hygiene.validate",
    {
      ...(targetRoot ? { targetRoot } : {}),
      ...(manifest ? { manifest } : {}),
      ...(includeSkills ? { includeSkills } : {}),
      ...(allowCommentToken ? { allowCommentToken } : {}),
    },
    createExecutionContext({ surface: "cli", cwd: targetRoot }),
  );
  output.write(`${JSON.stringify(invocation.value, null, 2)}\n`);
}

function inferInstallIntent(parsed: ParsedArgs): InstallIntent {
  return parsed.setupSubcommand === "reconfigure" ? "reconfigure" : "apply";
}

function printInstallStatus(options: {
  targetDir: string;
  manifest: InstallManifest | null;
  classification: CompatibilityClassification;
}): void {
  const { targetDir, manifest, classification } = options;
  const lines: string[] = [`make-docs install detected in ${targetDir}.`, ""];
  if (manifest) {
    const capabilities = Object.entries(manifest.selections.capabilities)
      .filter(([, enabled]) => enabled)
      .map(([name]) => name);
    const harnesses = Object.entries(manifest.selections.harnesses)
      .filter(([, enabled]) => enabled)
      .map(([name]) => name);
    lines.push(
      `Package: ${manifest.packageName}@${manifest.packageVersion}`,
      `Last applied: ${manifest.updatedAt}`,
      `Capabilities: ${capabilities.join(", ") || "none"}`,
      `Harnesses: ${harnesses.join(", ") || "none"}`,
      `Skills: ${manifest.selections.skills ? `${manifest.selections.selectedSkills.length} selected (${manifest.selections.skillScope} scope)` : "disabled"}`,
      `Local resource projection: ${(manifest.selections.resourceProjection ?? []).join(", ") || "none"}`,
    );
  } else {
    lines.push("A manifest is present but could not be parsed.");
  }
  lines.push(...buildCompatibilitySummaryLines(classification));
  lines.push(
    "",
    "Bare `make-docs` never syncs an existing install.",
    "Use `make-docs setup` to sync, `make-docs setup reconfigure` to change project selections, or `make-docs setup skills` to change skill selections.",
    "",
  );
  output.write(lines.join("\n"));
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
  if (
    selections.resourceProjection === undefined &&
    (!existingManifest || parsed.setupSubcommand === "reconfigure")
  ) {
    selections.resourceProjection = [];
  }

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
  if (parsed.projectResources !== undefined) {
    selections.resourceProjection = [...parsed.projectResources];
  }
  return selections;
}

const EXISTING_INSTALL_SKILL_SELECTION_CHANGE_ERROR =
  "Existing installs cannot change skill selections with `make-docs setup` or `make-docs setup reconfigure`. Use `make-docs setup skills` to change the enabled state, scope, selected skill names, manifest source, or selection provenance. No files were changed.";

function assertExistingInstallSkillSelectionUnchanged(options: {
  existingManifest: InstallManifest | null;
  selections: InstallSelections;
}): void {
  const { existingManifest, selections } = options;
  if (!existingManifest) {
    return;
  }

  const existingSelections = existingManifest.selections;
  const existingSkillNames = [...existingSelections.selectedSkills].sort();
  const requestedSkillNames = [...selections.selectedSkills].sort();
  const selectedSkillNamesChanged =
    existingSkillNames.length !== requestedSkillNames.length ||
    existingSkillNames.some((name, index) => name !== requestedSkillNames[index]);
  const existingSkillBinding = JSON.stringify({
    manifest: existingSelections.skillManifest ?? null,
    provenance: [...(existingSelections.skillSelectionProvenance ?? [])].sort((left, right) =>
      left.skillName.localeCompare(right.skillName),
    ),
  });
  const requestedSkillBinding = JSON.stringify({
    manifest: selections.skillManifest ?? null,
    provenance: [...(selections.skillSelectionProvenance ?? [])].sort((left, right) =>
      left.skillName.localeCompare(right.skillName),
    ),
  });

  if (
    existingSelections.skills !== selections.skills ||
    existingSelections.skillScope !== selections.skillScope ||
    selectedSkillNamesChanged ||
    existingSkillBinding !== requestedSkillBinding
  ) {
    throw new Error(EXISTING_INSTALL_SKILL_SELECTION_CHANGE_ERROR);
  }
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
      parsed.selectedSkills !== undefined ||
      parsed.projectResources !== undefined,
  );
}

function isLifecycleCommand(parsed: ParsedArgs): boolean {
  return parsed.setupSubcommand === "backup" || parsed.setupSubcommand === "remove";
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
  if (parsed.projectResources !== undefined) {
    flags.push("--project-resources");
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
    runArgs: [],
  };

  const args = [...argv];
  rejectRemovedUpdateReconfigure(args);
  rejectRemovedReconfigureFlag(args);
  rejectRemovedCommand(args);

  if (
    args[0] === "setup" ||
    args[0] === "project" ||
    args[0] === "resource" ||
    args[0] === "run" ||
    args[0] === "mcp" ||
    args[0] === "update" ||
    args[0] === "uninstall"
  ) {
    parsed.command = args.shift() as Command;
  }

  if (
    parsed.command === "setup" &&
    (args[0] === "reconfigure" || args[0] === "skills" || args[0] === "backup" || args[0] === "remove")
  ) {
    parsed.setupSubcommand = args.shift() as SetupSubcommand;
  }

  if (
    parsed.command === "run" ||
    parsed.command === "resource" ||
    parsed.command === "project"
  ) {
    parsed.runArgs = args;
    return parsed;
  }

  if (parsed.command === "update" || parsed.command === "uninstall") {
    while (args.length > 0) {
      const arg = args.shift();
      switch (arg) {
        case "--help":
        case "-h":
          parsed.help = true;
          break;
        case "--yes":
          parsed.yes = true;
          break;
        case "--target":
          if (parsed.command !== "update") {
            throw new Error("`--target` is not valid with `make-docs uninstall`; it removes the machine-level footprint, not a project.");
          }
          parsed.targetDir = args.shift();
          break;
        default:
          throw new Error(`Unknown argument: ${arg}`);
      }
    }
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
      case "--project-resources": {
        const value = args.shift();
        if (!value) {
          throw new Error("`--project-resources` requires a comma-separated value, `all`, or `none`.");
        }
        parsed.projectResources = parseProjectResourcesValue(value);
        break;
      }
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return parsed;
}

function parseProjectResourcesValue(value: string): ProjectResourceType[] {
  if (value === "none") return [];
  if (value === "all") return [...PROJECT_RESOURCE_TYPES];
  const values = Array.from(new Set(value.split(",").map((entry) => entry.trim()).filter(Boolean)));
  const invalid = values.filter((entry) => !PROJECT_RESOURCE_TYPES.includes(entry as ProjectResourceType));
  if (invalid.length > 0 || values.length === 0) {
    throw new Error(`\`--project-resources\` accepts ${PROJECT_RESOURCE_TYPES.join(", ")}, \`all\`, or \`none\`.`);
  }
  return (values as ProjectResourceType[]).sort();
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
    "The `update --reconfigure` command was removed. Use `make-docs setup reconfigure` instead.",
  );
}

/**
 * The W18 R11 hard cutover has no back-compatibility aliases (R-MIG-1): the
 * old top-level spellings fail with the new spelling named rather than
 * silently mapping onto it.
 */
function rejectRemovedCommand(args: string[]): void {
  const command = args[0];
  const replacements: Record<string, string> = {
    init: "make-docs setup",
    reconfigure: "make-docs setup reconfigure",
    skills: "make-docs setup skills",
    backup: "make-docs setup backup",
    operations: "make-docs run <domain> <verb>",
  };
  const replacement = command ? replacements[command] : undefined;
  if (!replacement) {
    return;
  }

  throw new Error(`The \`${command}\` command was removed. Use \`${replacement}\` instead.`);
}

function rejectRemovedReconfigureFlag(args: string[]): void {
  if (!args.includes("--reconfigure")) {
    return;
  }

  throw new Error(
    "`--reconfigure` was removed. Use `make-docs setup reconfigure` instead.",
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

function describeParsedCommand(parsed: ParsedArgs): string {
  if (!parsed.command) {
    return "bare `make-docs`";
  }
  return parsed.setupSubcommand
    ? `\`make-docs ${parsed.command} ${parsed.setupSubcommand}\``
    : `\`make-docs ${parsed.command}\``;
}

function validateParsedArgs(parsed: ParsedArgs): void {
  // Bare invocation is context-aware status/guided-setup only (R-BARE-1);
  // install and sync options belong to `setup`.
  if (parsed.command === undefined) {
    const bareFlags = [
      ...(parsed.dryRun ? ["--dry-run"] : []),
      ...(parsed.yes ? ["--yes"] : []),
      ...(parsed.backup ? ["--backup"] : []),
      ...(parsed.remove ? ["--remove"] : []),
      ...getSelectionOverrideFlags(parsed),
    ];
    if (bareFlags.length > 0) {
      throw new Error(
        `Bare \`make-docs\` shows status or starts a guided setup and accepts only \`--target\` and \`--help\`. Use \`make-docs setup ${bareFlags.join(" ")}\` for install and sync options.`,
      );
    }
  }

  if (parsed.backup && parsed.setupSubcommand !== "remove") {
    throw new Error(
      `\`--backup\` is only valid with \`make-docs setup remove\`, not ${describeParsedCommand(parsed)}.`,
    );
  }

  if (parsed.remove && parsed.setupSubcommand !== "skills") {
    throw new Error(
      `\`--remove\` is only valid with \`make-docs setup skills\`, not ${describeParsedCommand(parsed)}.`,
    );
  }

  if (parsed.dryRun && isLifecycleCommand(parsed)) {
    throw new Error(
      `\`--dry-run\` is only valid with \`make-docs setup\`, \`make-docs setup reconfigure\`, or \`make-docs setup skills\`, not ${describeParsedCommand(parsed)}.`,
    );
  }

  if (parsed.setupSubcommand === "skills") {
    const invalidSkillsFlags = getInvalidSkillsCommandFlags(parsed);
    if (invalidSkillsFlags.length > 0) {
      const label = invalidSkillsFlags.length === 1 ? "flag" : "flags";
      const verb = invalidSkillsFlags.length === 1 ? "is" : "are";
      throw new Error(
        `Selection ${label} ${invalidSkillsFlags.join(", ")} ${verb} not valid with \`make-docs setup skills\`. Use skills command options such as \`--remove\`, \`--skill-scope\`, or \`--selected-skills\`.`,
      );
    }

    if (parsed.remove && parsed.selectedSkillsValue !== undefined) {
      throw new Error(
        "`--selected-skills` cannot be combined with `make-docs setup skills --remove`.",
      );
    }
  }

  const selectionOverrideFlags = getSelectionOverrideFlags(parsed);
  if (
    isLifecycleCommand(parsed) &&
    selectionOverrideFlags.length > 0
  ) {
    const label = selectionOverrideFlags.length === 1 ? "flag" : "flags";
    const verb = selectionOverrideFlags.length === 1 ? "is" : "are";
    throw new Error(
      `Selection ${label} ${selectionOverrideFlags.join(", ")} ${verb} only valid with \`make-docs setup\` or \`make-docs setup reconfigure\`, not ${describeParsedCommand(parsed)}.`,
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
  selectedResourceTypes?: ProjectResourceType[];
  stops: string[];
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
    selectedResourceTypes,
    stops,
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
      `Local resource projection: ${selectedResourceTypes === undefined ? "legacy install (not yet selected)" : selectedResourceTypes.join(", ") || "none"}`,
      `Safety stops: ${stops.join(", ") || "none"}`,
      `Document kind labels: ${labels.documentKinds}`,
      `Lifecycle labels: ${labels.lifecycle}`,
      `Coordinate labels: ${labels.coordinates}`,
      `Persona labels: ${labels.personas}`,
      `Managed files evaluated: ${actions.length}`,
      `Already current: ${noopCount}`,
      `Changes planned: ${nonNoop.length}`,
      `Generate: ${counts.create + counts.generate}`,
      `Update: ${counts.update + counts["update-conflict"] + counts["strip-managed-block"]}`,
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
    "strip-managed-block": actions.filter((action) => action.type === "strip-managed-block").length,
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
          "Run `make-docs setup` interactively if the files are reviewable, or back up the target and reinstall into a clean tree.",
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
            "`make-docs setup` and `make-docs setup reconfigure` will not perform destructive backup-and-reinstall implicitly.",
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
    "- Run `make-docs setup reconfigure` to change which docs, harnesses, or project resources are managed.",
    "- Run `make-docs setup skills` to change managed skills.",
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
    case "strip-managed-block":
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


const SETUP_SHARED_OPTIONS = `General options:
  --target <dir>                 Operate on a different make-docs install directory.
  --dry-run                      Show planned changes without writing files.
  --yes                          Skip interactive prompts.
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

Resource options:
  --project-resources <csv|all|none>
                                  Copy only the selected system resource types into this project.`;

const RECONFIGURE_SHARED_OPTIONS = `General options:
  --target <dir>                 Operate on a different make-docs install directory.
  --dry-run                      Show planned changes without writing files.
  --yes                          Skip interactive prompts.
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

Skill selections:
  Existing installs keep their saved skill enabled state, scope, and names.
  Use \`make-docs setup skills\` to change skill selections.

Resource options:
  --project-resources <csv|all|none>
                                  Copy only the selected system resource types into this project.`;

function printHelp(command?: Command, setupSubcommand?: SetupSubcommand): void {
  if (command === "setup") {
    switch (setupSubcommand) {
      case "reconfigure":
        output.write(`make-docs setup reconfigure

Change the configured make-docs footprint for an existing install.
Requires an existing ${MANIFEST_RELATIVE_PATH} in the target directory.

Interactive runs open the selection wizard using the saved manifest selections.
Non-interactive runs with --yes must include at least one selection flag.

Usage:
  make-docs setup reconfigure [options]

${RECONFIGURE_SHARED_OPTIONS}

Examples:
  make-docs setup reconfigure
  make-docs setup reconfigure --target ~/Projects/example --dry-run
  make-docs setup reconfigure --yes --no-work
  make-docs setup reconfigure --yes --no-codex --project-resources none
`);
        return;
      case "skills":
        output.write(`make-docs setup skills

Sync or remove managed make-docs skills without changing the docs scaffold.

Usage:
  make-docs setup skills [options]

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
  make-docs setup skills
  make-docs setup skills --dry-run
  make-docs setup skills --remove
  make-docs setup skills --skill-scope global
  make-docs setup skills --selected-skills all
`);
        return;
      case "backup":
        output.write(`make-docs setup backup

Create a backup of the managed make-docs files in the target directory.
New backups are written under .make-docs/backup/<date>.
This command is non-destructive: source files remain in place.

Usage:
  make-docs setup backup [--target <dir>] [--yes] [--help]

Options:
  --target <dir>                   Back up a different make-docs install directory.
  --yes                            Skip confirmation prompts after showing the audit summary.
  --help, -h                       Show help for this command.

Examples:
  make-docs setup backup
  make-docs setup backup --target ~/Projects/example
  make-docs setup backup --yes
`);
        return;
      case "remove":
        output.write(`make-docs setup remove

Remove the managed make-docs files from the target directory.
This command is destructive: audited managed files are removed after review.
It removes this project's install only; \`make-docs uninstall\` is the
machine-level tool removal.

Usage:
  make-docs setup remove [--target <dir>] [--backup] [--yes] [--help]

Options:
  --target <dir>                   Remove from a different make-docs install directory.
  --backup                         Create a .make-docs/backup/<date> backup before removing files.
  --yes                            Skip confirmation prompts after showing warnings and the audit summary.
  --help, -h                       Show help for this command.

Examples:
  make-docs setup remove
  make-docs setup remove --backup
  make-docs setup remove --target ~/Projects/example --yes
`);
        return;
      default:
        output.write(`make-docs setup

Install make-docs into a new target or sync an existing install using saved selections.
Interactive fresh installs open the selection wizard; syncs review planned changes first.

Usage:
  make-docs setup [options]
  make-docs setup reconfigure [options]
  make-docs setup skills [options]
  make-docs setup backup [options]
  make-docs setup remove [options]

Subcommands:
  reconfigure  Change saved project selections for an existing install.
  skills       Change, sync, or remove managed skills.
  backup       Create a backup of managed files.
  remove       Remove this project's managed files, with an optional backup first.

${SETUP_SHARED_OPTIONS}

Examples:
  make-docs setup
  make-docs setup --yes
  make-docs setup --target ~/Projects/example --dry-run
  make-docs setup reconfigure --yes --no-work
  make-docs setup remove --backup
`);
        return;
    }
  }

  switch (command) {
    case "project":
      output.write(`make-docs project

Manage canonical project support surfaces.

Usage:
  make-docs project surface ensure <archive|artifacts|assets>
  make-docs project path-hygiene validate [--target <dir>] [--manifest <path>] [--include-skills] [--allow-comment-token <text>]

The ensure command creates only the selected on-demand directory after it
checks the trusted project manifest and configured routers. It reports the
applied or unchanged state, plan dispositions, receipt, and next check.

The path-hygiene command validates managed text paths through the same typed
operation that the MCP tool and migration checkpoint use.
`);
      return;
    case "resource":
      output.write(`make-docs resource

List, read, or explicitly ensure stable system resources.

Usage:
  make-docs resource list [--type <contract|prompt|reference|template>] [--prefix <path>] [--origin <effective|local|installed>] [--format table|json] [--target <dir>]
  make-docs resource read <uri> [--origin <effective|local|installed>] [--format raw|json] [--target <dir>]
  make-docs resource ensure <uri> --allow-write --approve resource-projection-write [--dry-run] [--target <dir>]
`);
      return;
    case "run":
      output.write(`make-docs run

Run deterministic registry operations. The operation tree is derived from the
operation registry; use \`make-docs run\` with no arguments to list operations.

Usage:
  make-docs run <domain> <verb> [options]

Examples:
  make-docs run lifecycle list --repo-root .
  make-docs run lifecycle show --run-id <run-id>
  make-docs run package plan --harness codex --output-kind plugin --surface native --scope project user/run-stack
  make-docs run work item resolve 'W18 R11 P2'
`);
      return;
    case "mcp":
      output.write(`make-docs mcp

Run the TypeScript-owned make-docs MCP server over stdio.

Usage:
  make-docs mcp [--help]

Behavior:
  The MCP server exposes read-first and plan-first tools for installed-state inspection, manifest/config reads, compatibility classification, dry-run install planning, and deterministic registry operations.
  MCP tools delegate to the same operation registry and core used by \`make-docs run\`; write operations require allowWrite=true, enforced uniformly by the operation core.

Examples:
  make-docs mcp
`);
      return;
    case "update":
      output.write(`make-docs update

Update the installed make-docs tool itself (machine-level self-management).
Detects the install manager that owns a persistent global install and
delegates to it; when detection is ambiguous it prints the exact command
instead of acting. For remote execution (npx, pnpm dlx, bunx) there is
nothing persistent to update, since the runner fetches the requested
version. Every run applies any pending global-store schema migration, and a
pre-v2 project install in the working directory triggers the
warning-and-choice migration flow before delegation.

Usage:
  make-docs update [--target <dir>] [--yes] [--help]

Options:
  --target <dir>                   Check a different project directory for pre-v2 state.
  --yes                            Skip interactive prompts where confirmation is not safety-critical.
  --help, -h                       Show help for this command.

To change a project's install, use \`make-docs setup\` or \`make-docs setup reconfigure\`.
`);
      return;
    case "uninstall":
      output.write(`make-docs uninstall

Remove make-docs' machine-level footprint: the global store at ~/.make-docs/
and the installed binary when one is present. It confirms before removing,
reports that no binary is installed for remote-execution users, and never
touches repository content. When the install method is ambiguous it prints
the exact removal command instead of acting.

Usage:
  make-docs uninstall [--yes] [--help]

Options:
  --yes                            Confirm removal without an interactive prompt.
  --help, -h                       Show help for this command.

To remove make-docs from a project, use \`make-docs setup remove\`.
`);
      return;
    default:
      output.write(`make-docs

Manage make-docs installs, run registry operations, and serve MCP.

Usage:
  make-docs
  make-docs setup [reconfigure|skills|backup|remove] [options]
  make-docs project surface ensure <archive|artifacts|assets>
  make-docs project path-hygiene validate [options]
  make-docs resource <list|read|ensure> [options]
  make-docs run <domain> <verb> [options]
  make-docs mcp
  make-docs update
  make-docs uninstall

Bare command:
  Run make-docs with no command to see install status (when installed) or start
  a guided setup (when not installed). Bare invocation never syncs.

Global flags:
  --version, -v   Print the installed make-docs version and exit.
  --help, -h      Show help for a command.

Commands:
  setup        Install or sync this project; subcommands reconfigure, skills, backup, remove.
  project      Manage canonical project support surfaces.
  resource     List, read, or ensure stable system resources.
  run          Run deterministic registry operations.
  mcp          Run the TypeScript MCP server over stdio.
  update       Update the installed make-docs tool itself.
  uninstall    Remove make-docs' machine-level footprint.

Examples:
  make-docs
  make-docs --version
  make-docs setup --yes
  make-docs setup reconfigure
  make-docs setup skills --dry-run
  make-docs setup remove --backup
  make-docs resource list
  make-docs run lifecycle list
  make-docs mcp

Use --help or -h with any command for command-specific options and examples.
`);
  }
}
