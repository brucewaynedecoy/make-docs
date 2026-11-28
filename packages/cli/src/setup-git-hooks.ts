import {
  applyGitHooks,
  gitHookKeptLine,
  planGitHooks,
  renderGitHookReview,
  renderGitHookStatus,
  type GitHookApplyResult,
  type GitHookCommand,
  type GitHookPlan,
} from "./git-hooks";

/**
 * W35 R0 P5: what project setup decides about the git hooks of one project
 * (PRD 07 R-SETUP-CLI-15 to R-SETUP-CLI-20). The git hooks are opt-in for each
 * project. Setup installs them only by an explicit hook input, by an explicit
 * answer in interactive setup, or by the machine preference that the person
 * set, and that preference counts only in a new project.
 *
 * Only the explicit hook input replaces a block that a person changed, records
 * or replaces a block that no record of this clone covers, or takes over the
 * record of a clone at another folder (PRD 07 R-SETUP-CLI-23). Every other run
 * keeps such a block, changes no hook, and says so in one line.
 *
 * This module holds the decision and its words. It asks no question. The setup
 * flow in `cli.ts` shows the review and asks.
 */

/** The hook input flags of project setup. */
export const GIT_HOOKS_INPUT_FLAG = "--git-hooks";
export const GIT_HOOKS_SKIP_FLAG = "--no-git-hooks";
export const GIT_HOOKS_INSTALL_COMMAND = `make-docs setup ${GIT_HOOKS_INPUT_FLAG}`;

export type SetupGitHooksSource = "hook-input" | "no-hook-input" | "machine-preference" | "answer" | "none";

/**
 * - `install`: this run installs the hooks, or would in a dry run.
 * - `ask`: an interactive run shows the review and asks.
 * - `status`: this project has the hooks, and this run changes none.
 * - `none`: this run installs no hook, and one line says why.
 */
export type SetupGitHooksMode = "install" | "ask" | "status" | "none";

export interface SetupGitHooksDecision {
  mode: SetupGitHooksMode;
  source: SetupGitHooksSource;
  /** The first choice of the interactive question. True only with the preference on, in a new project. */
  askDefault: boolean;
  /** One line for the person, or null when the review says it. */
  line: string | null;
  plan: GitHookPlan;
  preferenceOn: boolean;
  newProject: boolean;
}

export interface SetupGitHooksInput {
  targetDir: string;
  storeRoot: string;
  /** `true` for the hook input, `false` for the "no hooks" input, `undefined` for neither. */
  hookInput: boolean | undefined;
  interactive: boolean;
  yes: boolean;
  dryRun: boolean;
  /** The machine preference, as this run would leave it. An absent value is off. */
  preferenceOn: boolean;
  /** A fresh setup target with no config file, as for the project name (PRD 38 R-ID-8). */
  newProject: boolean;
  command?: GitHookCommand;
}

const NONE_PREFERENCE_OFF = `Git hooks: none installed. The machine preference for git hooks is off. To install them for this project, run \`${GIT_HOOKS_INSTALL_COMMAND}\`.`;
const NONE_OLDER_PROJECT = `Git hooks: none installed. The machine preference installs them only in a new project, and this project was set up before. To install them here, run \`${GIT_HOOKS_INSTALL_COMMAND}\`.`;
const NONE_NO_APPROVAL = "Git hooks: none installed. A setup with no terminal installs them only with `--yes`.";

/** Decide what this setup run does about the git hooks. It reads the hook files and the Store record, and it changes nothing. */
export function decideSetupGitHooks(input: SetupGitHooksInput): SetupGitHooksDecision {
  // Only the explicit hook input may replace a changed block, record a block with no record, or take a record over.
  const plan = planGitHooks({ projectRoot: input.targetDir, storeRoot: input.storeRoot, explicit: input.hookInput === true, ...(input.command ? { command: input.command } : {}) });
  const base = { plan, preferenceOn: input.preferenceOn, newProject: input.newProject, askDefault: input.preferenceOn && input.newProject };
  const none = (source: SetupGitHooksSource, line: string): SetupGitHooksDecision => ({ ...base, mode: "none", source, line });
  const has = plan.status === "ready" && plan.selected;

  if (input.hookInput === false) {
    return none("no-hook-input", `Git hooks: none installed in this run (${GIT_HOOKS_SKIP_FLAG}).${has ? " The hooks that this project already has stay." : ""}`);
  }
  // A block that a person changed, or that no record of this clone covers: with no hook input the run keeps it,
  // changes no hook, asks no question, and says the true state in one line with the next step.
  if (plan.status === "ready" && plan.kept.length > 0) {
    return {
      ...base,
      mode: has ? "status" : "none",
      source: "none",
      line: [`Git hooks: ${gitHookKeptLine(plan)}`, ...(has ? renderGitHookStatus(plan) : [])].join("\n"),
    };
  }
  let wanted: SetupGitHooksSource | "ask" | null = null;
  if (input.hookInput === true) wanted = "hook-input";
  else if (input.interactive && !input.dryRun) wanted = has && !plan.changed ? null : "ask";
  else if (input.preferenceOn && input.newProject) wanted = "machine-preference";

  if (wanted === null) {
    if (has) {
      const current = !plan.changed;
      return {
        ...base,
        mode: "status",
        source: "none",
        line: [
          current ? "Git hooks: this project has the Make Docs git hooks, and each block is current." : "Git hooks: this project has the Make Docs git hooks. This run changes none.",
          ...renderGitHookStatus(plan),
          ...(current ? [] : [`To write the current block again, run \`${GIT_HOOKS_INSTALL_COMMAND}\`.`]),
        ].join("\n"),
      };
    }
    return none("none", input.preferenceOn ? NONE_OLDER_PROJECT : NONE_PREFERENCE_OFF);
  }
  // PRD 07 R-SETUP-CLI-20: a refusal installs no hook, says why in one line, and the rest of the run goes on.
  if (plan.status !== "ready") {
    return none(wanted === "ask" ? "none" : wanted, wanted === "ask" ? `Git hooks: not offered. ${plan.reason}` : `Git hooks: none installed. ${plan.reason}`);
  }
  if (wanted === "ask") return { ...base, mode: "ask", source: "answer", line: null };
  // An interactive run with the hook input shows the review, and the input is the selection.
  if (!input.yes && !input.dryRun && !input.interactive) return none(wanted, NONE_NO_APPROVAL);
  if (has && !plan.changed) {
    return { ...base, mode: "status", source: wanted, line: ["Git hooks: this project has the Make Docs git hooks, and each block is current.", ...renderGitHookStatus(plan)].join("\n") };
  }
  return { ...base, mode: "install", source: wanted, line: null };
}

/** The answer of the person to the interactive question. */
export function answerSetupGitHooks(decision: SetupGitHooksDecision, yes: boolean): SetupGitHooksDecision {
  if (decision.mode !== "ask") return decision;
  return yes
    ? { ...decision, mode: "install", source: "answer", line: null }
    : { ...decision, mode: "none", source: "answer", line: `Git hooks: none installed. To install them later for this project, run \`${GIT_HOOKS_INSTALL_COMMAND}\`.` };
}

export function renderSetupGitHookReview(decision: SetupGitHooksDecision): string {
  return renderGitHookReview(decision.plan);
}

export interface SetupGitHooksJson {
  /** How the hooks were selected in this run. `none` is no selection. */
  selection: SetupGitHooksSource;
  /** The machine preference, as this run would leave it. */
  preferenceOn: boolean;
  newProject: boolean;
  /** `planned` in a dry run, `installed` or `current` after an apply, `selected` for hooks that this run did not change, and `none`, `refused`, or `unavailable` otherwise. */
  status: "planned" | "installed" | "current" | "selected" | "none" | "refused" | "unavailable";
  /** The line that a person sees when this run installs no hook, or the reason of a refusal. */
  message: string | null;
  hooksDir: string | null;
  hooks: Array<{ name: string; path: string; state: string; action: string; runs: string; notExecutable: boolean; block?: string; backup?: boolean; backupFile?: string }>;
  /** The blocks that this run keeps, because a person changed them or no record of this clone covers them. */
  kept: Array<{ name: string; path: string; state: string }>;
  /** The git folder of the record of another folder that this run takes over, or would in a dry run. Null for none. */
  takeoverFrom: string | null;
  /** The command that each hook runs first: the recorded `node` program and the recorded Make Docs command file. */
  command: { nodePath: string; commandFile: string };
  /** How each hook runs the checkpoint: `background`. Git does not wait, and the hook prints nothing. */
  runMode: string;
  /** What a hook does when the last background run of this checkout did not end: `foreground`. */
  runFallback: string;
  /** The folder in the Store folder that holds the facts of the hook runs of this checkout. */
  runStateDir: string;
}

/**
 * The git hook part of the setup JSON result. `outcome` says where the run ended: `planned` for a dry run,
 * `stopped` for a run that ended before the hook step, and `done` for a run that reached it.
 */
export function setupGitHooksJson(decision: SetupGitHooksDecision, applied: GitHookApplyResult | null, outcome: "planned" | "stopped" | "done"): SetupGitHooksJson {
  const { plan } = decision;
  const withBlocks = decision.mode === "install";
  let status: SetupGitHooksJson["status"];
  let message = decision.line;
  if (applied) {
    status = applied.status;
    if (applied.reason) message = `Git hooks: none installed. ${applied.reason}`;
  } else if ((decision.mode === "install" || decision.mode === "ask") && outcome !== "planned") {
    status = "none";
    message = "Git hooks: none installed. Setup stopped before the hook step.";
  } else if (decision.mode === "install") status = "planned";
  else if (decision.mode === "status") status = "selected";
  else if (plan.status === "refused" && decision.source !== "no-hook-input") status = "refused";
  else if (plan.status === "unavailable" && decision.source !== "no-hook-input") status = "unavailable";
  else status = "none";
  return {
    selection: decision.source,
    preferenceOn: decision.preferenceOn,
    newProject: decision.newProject,
    status,
    message,
    hooksDir: plan.hooksDir,
    hooks: plan.hooks.map((entry) => {
      const done = applied?.hooks.find((candidate) => candidate.name === entry.name);
      return {
        name: entry.name,
        path: entry.path,
        state: entry.state,
        action: done?.action ?? (withBlocks ? entry.action : entry.action === "keep" ? "keep" : "none"),
        runs: entry.runs,
        notExecutable: entry.notExecutable,
        ...(withBlocks ? { block: entry.block } : {}),
        ...(withBlocks && entry.backup ? { backup: true } : {}),
        ...(done?.backupFile ? { backupFile: done.backupFile } : {}),
      };
    }),
    kept: plan.kept.map((entry) => ({ name: entry.name, path: entry.path, state: entry.state })),
    takeoverFrom: withBlocks ? plan.takeover?.gitCommonDir ?? null : null,
    command: plan.command,
    runMode: plan.runMode,
    runFallback: plan.runFallback,
    runStateDir: plan.runStateDir,
  };
}

/** Install the hooks that the person selected, after the project is set up. */
export function applySetupGitHooks(decision: SetupGitHooksDecision, input: { targetDir: string; storeRoot: string; appliedVersion: string; command?: GitHookCommand }): GitHookApplyResult {
  return applyGitHooks({
    projectRoot: input.targetDir,
    storeRoot: input.storeRoot,
    appliedVersion: input.appliedVersion,
    reviewedFingerprint: decision.plan.fingerprint,
    explicit: decision.source === "hook-input",
    ...(input.command ? { command: input.command } : {}),
  });
}

/** The lines that a person sees after the hooks were installed, or were not. */
export function renderSetupGitHooksResult(applied: GitHookApplyResult): string {
  if (applied.status === "refused" || applied.status === "unavailable") return `Git hooks: none installed. ${applied.reason}`;
  const words: Record<string, string> = {
    "create-file": "created with the Make Docs block",
    "add-block": "the Make Docs block was added",
    "replace-block": "the Make Docs block was replaced",
    "record-block": "the Make Docs block was recorded",
    none: "current",
    keep: "no change",
  };
  return [
    applied.status === "installed" ? "Git hooks: installed for this project." : "Git hooks: current for this project.",
    ...applied.hooks.map((entry) => `- ${entry.path}: ${words[entry.action]}${entry.backupFile ? `. The old block text is in ${entry.backupFile}` : ""}`),
    ...(applied.tookOverFrom ? [`The Store record of these blocks was for the git folder ${applied.tookOverFrom}. It is now the record of this clone.`] : []),
    "`make-docs setup remove` takes the blocks out again.",
  ].join("\n");
}
