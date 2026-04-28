import {
  intro,
  isCancel,
  multiselect,
  note,
  select,
} from "@clack/prompts";
import { getRecommendedSkillChoices } from "./skill-catalog";
import type { WizardSkillChoice } from "./skill-catalog";
import {
  HARNESSES,
  type Harness,
  type InstallSelections,
  type PlannedAction,
} from "./types";
import { formatInlineList } from "./utils";

export type SkillsUiAction = "sync" | "remove";
export type SkillsUiStep = "action" | "platforms" | "scope" | "skills" | "review";
export type SkillsReviewAction =
  | "apply"
  | "edit-action"
  | "edit-platforms"
  | "edit-scope"
  | "edit-skills"
  | "cancel";

export interface SkillsUiState {
  action: SkillsUiAction;
  targetDir: string;
  harnesses: Harness[];
  skillScope: InstallSelections["skillScope"];
  selectedSkills: string[];
}

export interface SkillsActionStepState {
  state: SkillsUiState;
  options: Array<{ value: SkillsUiAction; label: string; hint: string }>;
}

export interface SkillsPlatformStepState {
  state: SkillsUiState;
  options: Array<{ value: Harness; label: string; hint: string }>;
  selectedHarnesses: Harness[];
}

export interface SkillsScopeStepState {
  state: SkillsUiState;
  options: Array<{
    value: InstallSelections["skillScope"];
    label: string;
    hint: string;
  }>;
}

export interface SkillsSelectionStepState {
  state: SkillsUiState;
  skills: WizardSkillChoice[];
  selectedSkills: string[];
}

export interface SkillsReviewStepState {
  state: SkillsUiState;
  summary: string;
  actions: SkillsReviewAction[];
}

export interface SkillsUiRenderer {
  beginSession?(title: string): void | Promise<void>;
  chooseAction(state: SkillsActionStepState): Promise<SkillsUiAction | null>;
  chooseHarnesses(state: SkillsPlatformStepState): Promise<Harness[] | null>;
  chooseScope(
    state: SkillsScopeStepState,
  ): Promise<InstallSelections["skillScope"] | null>;
  chooseSelectedSkills(
    state: SkillsSelectionStepState,
  ): Promise<string[] | null>;
  review(state: SkillsReviewStepState): Promise<SkillsReviewAction>;
}

export interface RunSkillsUiOptions {
  initialState: SkillsUiState;
  introTitle: string;
  startStep?: SkillsUiStep;
  buildReviewState?: (
    state: SkillsUiState,
  ) => Promise<SkillsReviewStepState> | SkillsReviewStepState;
}

const HARNESS_METADATA: Record<Harness, { label: string; hint: string }> = {
  "claude-code": {
    label: "Claude Code",
    hint: "CLAUDE.md + .claude/",
  },
  codex: {
    label: "Codex",
    hint: "AGENTS.md + .agents/",
  },
};

export async function runSkillsUiWithRenderer(
  renderer: SkillsUiRenderer,
  options: RunSkillsUiOptions,
): Promise<SkillsUiState | null> {
  let state = cloneSkillsUiState(options.initialState);
  let step = options.startStep ?? "action";

  await renderer.beginSession?.(options.introTitle);

  while (true) {
    if (step === "action") {
      const action = await renderer.chooseAction(buildActionStepState(state));
      if (!action) {
        return null;
      }

      state = { ...state, action };
      step = action === "sync" ? "platforms" : "review";
      continue;
    }

    if (step === "platforms") {
      const harnesses = await renderer.chooseHarnesses(
        buildPlatformStepState(state),
      );
      if (!harnesses) {
        return null;
      }
      if (harnesses.length === 0) {
        continue;
      }

      state = { ...state, harnesses };
      step = "scope";
      continue;
    }

    if (step === "scope") {
      const skillScope = await renderer.chooseScope(buildScopeStepState(state));
      if (!skillScope) {
        return null;
      }

      state = { ...state, skillScope };
      step = "skills";
      continue;
    }

    if (step === "skills") {
      const selectedSkills = await renderer.chooseSelectedSkills(
        buildSkillsSelectionStepState(state),
      );
      if (!selectedSkills) {
        return null;
      }

      state = { ...state, selectedSkills };
      step = "review";
      continue;
    }

    const reviewState = await buildReviewState(state, options);
    const reviewAction = await renderer.review(reviewState);

    if (reviewAction === "apply") {
      return cloneSkillsUiState(state);
    }
    if (reviewAction === "edit-action") {
      step = "action";
      continue;
    }
    if (reviewAction === "edit-platforms" && state.action === "sync") {
      step = "platforms";
      continue;
    }
    if (reviewAction === "edit-scope" && state.action === "sync") {
      step = "scope";
      continue;
    }
    if (reviewAction === "edit-skills" && state.action === "sync") {
      step = "skills";
      continue;
    }

    return null;
  }
}

export function createClackSkillsUiRenderer(): SkillsUiRenderer {
  return {
    beginSession(title) {
      intro(title);
    },
    async chooseAction(state) {
      const action = await select<SkillsUiAction>({
        message: "What would you like to do with make-docs skills?",
        withGuide: true,
        initialValue: state.state.action,
        options: state.options,
      });

      return isCancel(action) ? null : action;
    },
    async chooseHarnesses(state) {
      const harnesses = await multiselect<Harness>({
        message: "Which agent platforms should receive skills?",
        withGuide: true,
        required: true,
        initialValues: state.selectedHarnesses,
        options: state.options,
      });

      return isCancel(harnesses) ? null : harnesses;
    },
    async chooseScope(state) {
      const scope = await select<InstallSelections["skillScope"]>({
        message: "Where should skills be installed?",
        withGuide: true,
        initialValue: state.state.skillScope,
        options: state.options,
      });

      return isCancel(scope) ? null : scope;
    },
    async chooseSelectedSkills(state) {
      if (state.skills.length === 0) {
        return [];
      }

      const selectedSkills = await multiselect<string>({
        message: "Which skills should be installed?",
        withGuide: true,
        required: false,
        initialValues: state.selectedSkills,
        options: state.skills.map((skill) => ({
          value: skill.name,
          label: skill.name,
          hint: skill.description,
        })),
      });

      return isCancel(selectedSkills) ? null : selectedSkills;
    },
    async review(state) {
      note(state.summary, "Review skills changes");

      const action = await select<SkillsReviewAction>({
        message: "What would you like to do next?",
        withGuide: true,
        options: state.actions.map((value) => reviewActionOption(value)),
      });

      return isCancel(action) ? "cancel" : action;
    },
  };
}

export function stateFromSkillsSelections(options: {
  action: SkillsUiAction;
  targetDir: string;
  selections: InstallSelections;
}): SkillsUiState {
  return {
    action: options.action,
    targetDir: options.targetDir,
    harnesses: getSelectedHarnesses(options.selections),
    skillScope: options.selections.skillScope,
    selectedSkills: [...options.selections.selectedSkills],
  };
}

export function applySkillsUiStateToSelections(
  state: SkillsUiState,
  baseSelections: InstallSelections,
): InstallSelections {
  const selections = structuredClone(baseSelections);
  selections.skills = true;
  if (state.action === "remove") {
    return selections;
  }

  selections.harnesses = Object.fromEntries(
    HARNESSES.map((harness) => [harness, state.harnesses.includes(harness)]),
  ) as Record<Harness, boolean>;
  selections.skillScope = state.skillScope;
  selections.selectedSkills = [...state.selectedSkills];
  return selections;
}

export function renderSkillsPlanSummary(options: {
  state: SkillsUiState;
  actions: PlannedAction[];
  dryRun: boolean;
}): string {
  const counts = countSkillActions(options.actions);
  const lines = [
    `Target: ${options.state.targetDir}`,
    `Action: ${options.state.action === "remove" ? "remove managed skills" : "sync skills"}`,
    `Mode: ${options.dryRun ? "dry run" : "apply"}`,
  ];

  if (options.state.action === "sync") {
    lines.push(
      `Platforms: ${formatHarnesses(options.state.harnesses)}`,
      `Scope: ${options.state.skillScope}`,
      `Selected skills: ${formatSelectedSkills(options.state.selectedSkills)}`,
    );
  } else {
    lines.push("Removal scope: all manifest-tracked skill files");
  }

  lines.push(
    `Managed skill files evaluated: ${options.actions.length}`,
    `Already current: ${counts.noop}`,
    `Create: ${counts.create + counts.generate}`,
    `Update: ${counts.update + counts["update-conflict"]}`,
    `Remove managed: ${counts["remove-managed"]}`,
    `Stage conflicts: ${counts["skip-conflict"]}`,
    "",
    "Planned skill file operations:",
  );

  const plannedOperations = options.actions.filter((action) => action.type !== "noop");
  if (plannedOperations.length === 0) {
    lines.push("- none");
  } else {
    for (const action of plannedOperations) {
      lines.push(`- ${formatSkillActionLine(action)}`);
    }
  }

  return lines.join("\n");
}

export function countSkillActions(
  actions: PlannedAction[],
): Record<PlannedAction["type"], number> {
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

function buildActionStepState(state: SkillsUiState): SkillsActionStepState {
  return {
    state: cloneSkillsUiState(state),
    options: [
      {
        value: "sync",
        label: "Sync or update skills",
        hint: "Install missing skills and refresh managed skill files",
      },
      {
        value: "remove",
        label: "Remove managed skills",
        hint: "Remove skill files tracked by the make-docs manifest",
      },
    ],
  };
}

function buildPlatformStepState(state: SkillsUiState): SkillsPlatformStepState {
  return {
    state: cloneSkillsUiState(state),
    options: HARNESSES.map((harness) => ({
      value: harness,
      label: HARNESS_METADATA[harness].label,
      hint: HARNESS_METADATA[harness].hint,
    })),
    selectedHarnesses: [...state.harnesses],
  };
}

function buildScopeStepState(state: SkillsUiState): SkillsScopeStepState {
  return {
    state: cloneSkillsUiState(state),
    options: [
      {
        value: "project",
        label: "Project",
        hint: "Install skills into this project.",
      },
      {
        value: "global",
        label: "Global",
        hint: "Install skills into your home directory for reuse across projects.",
      },
    ],
  };
}

function buildSkillsSelectionStepState(
  state: SkillsUiState,
  skillChoices: WizardSkillChoice[] = getRecommendedSkillChoices(),
): SkillsSelectionStepState {
  const skillNames = new Set(skillChoices.map((skill) => skill.name));

  return {
    state: cloneSkillsUiState(state),
    skills: skillChoices,
    selectedSkills: state.selectedSkills.filter((skillName) =>
      skillNames.has(skillName),
    ),
  };
}

async function buildReviewState(
  state: SkillsUiState,
  options: RunSkillsUiOptions,
): Promise<SkillsReviewStepState> {
  if (options.buildReviewState) {
    return options.buildReviewState(cloneSkillsUiState(state));
  }

  return {
    state: cloneSkillsUiState(state),
    summary: renderSkillsPlanSummary({
      state,
      actions: [],
      dryRun: false,
    }),
    actions: reviewActionsForState(state),
  };
}

function reviewActionsForState(state: SkillsUiState): SkillsReviewAction[] {
  return state.action === "sync"
    ? ["apply", "edit-action", "edit-platforms", "edit-scope", "edit-skills", "cancel"]
    : ["apply", "edit-action", "cancel"];
}

function reviewActionOption(
  value: SkillsReviewAction,
): { value: SkillsReviewAction; label: string; hint: string } {
  const options: Record<SkillsReviewAction, { label: string; hint: string }> = {
    apply: {
      label: "Apply",
      hint: "Use this skills configuration",
    },
    "edit-action": {
      label: "Edit action",
      hint: "Switch between sync and removal",
    },
    "edit-platforms": {
      label: "Edit platforms",
      hint: "Adjust Claude Code and Codex targets",
    },
    "edit-scope": {
      label: "Edit scope",
      hint: "Adjust project or global installation",
    },
    "edit-skills": {
      label: "Edit selected skills",
      hint: "Adjust selected skills",
    },
    cancel: {
      label: "Cancel",
      hint: "Exit without applying changes",
    },
  };

  return { value, ...options[value] };
}

function getSelectedHarnesses(selections: Pick<InstallSelections, "harnesses">): Harness[] {
  return HARNESSES.filter((harness) => selections.harnesses[harness]);
}

function formatHarnesses(harnesses: Harness[]): string {
  const labels = harnesses.map((harness) => HARNESS_METADATA[harness].label);
  return labels.length > 0 ? formatInlineList(labels) : "none";
}

function formatSelectedSkills(selectedSkills: string[]): string {
  return selectedSkills.length > 0 ? formatInlineList(selectedSkills) : "none";
}

function formatSkillActionLine(action: PlannedAction): string {
  const label: Record<PlannedAction["type"], string> = {
    create: "create",
    generate: "create",
    noop: "already current",
    "remove-managed": "remove",
    "skip-conflict": "conflict",
    update: "update",
    "update-conflict": "update conflict",
  };

  const reason = action.reason ? ` (${action.reason})` : "";
  return `${label[action.type]}: ${action.relativePath}${reason}`;
}

function cloneSkillsUiState(state: SkillsUiState): SkillsUiState {
  return {
    ...state,
    harnesses: [...state.harnesses],
    selectedSkills: [...state.selectedSkills],
  };
}
