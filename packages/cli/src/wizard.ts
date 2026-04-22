import {
  S_BAR,
  S_BAR_END,
  S_CHECKBOX_ACTIVE,
  S_CHECKBOX_INACTIVE,
  S_CHECKBOX_SELECTED,
  confirm,
  intro,
  isCancel,
  multiselect,
  note,
  select,
  symbol,
} from "@clack/prompts";
import { MultiSelectPrompt, wrapTextWithPrefix } from "@clack/core";
import { styleText } from "node:util";
import {
  CAPABILITY_DEPENDENCIES,
  cloneSelections,
  resolveInstallProfile,
} from "./profile";
import {
  getGroupedSkillChoices,
  type GroupedSkillChoices,
  type WizardSkillChoice,
} from "./skill-catalog";
import {
  CAPABILITIES,
  HARNESSES,
  type Capability,
  type Harness,
  type InstallProfile,
  type InstallSelections,
  type InstructionConflict,
  type InstructionConflictResolution,
  type InstructionConflictResolutions,
  type ReferencesMode,
  type TemplatesMode,
} from "./types";
import { formatInlineList } from "./utils";

const CAPABILITY_METADATA: Record<
  Capability,
  {
    label: string;
    hint: string;
    description: string;
  }
> = {
  designs: {
    label: "Designs",
    hint: "Architecture decisions and rationale",
    description:
      "Adds the architectural decision flow, design templates, and scoped references for long-lived design documentation.",
  },
  plans: {
    label: "Plans",
    hint: "Execution plans and strategy docs",
    description:
      "Adds planning workflows, plan templates, and the shared planning references that drive delivery before implementation starts.",
  },
  prd: {
    label: "PRD",
    hint: "Product requirements documents",
    description:
      "Adds the structured PRD set, architecture overview templates, and requirement references for descriptive product documentation.",
  },
  work: {
    label: "Work",
    hint: "Implementation backlogs and task lists",
    description:
      "Adds execution backlogs, phased work templates, and the prompts that decompose approved PRDs into buildable work.",
  },
};

const OPTION_METADATA = {
  skills: {
    label: "Skills",
    description:
      "Install reusable agent skills under the selected harness skill directories.",
  },
  skillScope: {
    label: "Skill scope",
    project: "Install skills into this project.",
    global:
      "Install skills into your home directory for reuse across projects.",
  },
  prompts: {
    label: "Prompt starters",
    description:
      "Reusable starter prompts under `docs/assets/prompts/` for common design, planning, PRD, and work handoff flows.",
  },
  templatesMode: {
    label: "Templates",
    all: "Install every valid template for the chosen profile.",
    required:
      "Install only the minimal template set required for the chosen profile.",
  },
  referencesMode: {
    label: "References",
    all: "Install every valid reference file for the chosen profile.",
    required:
      "Install only the minimal reference set required for the chosen profile.",
  },
};

const HARNESS_METADATA: Record<
  Harness,
  {
    label: string;
    hint: string;
  }
> = {
  "claude-code": {
    label: "Claude Code",
    hint: "CLAUDE.md + .claude/",
  },
  codex: {
    label: "Codex",
    hint: "AGENTS.md + .agents/",
  },
};

export type WizardStep = "capabilities" | "harnesses" | "options" | "review";
export type WizardReviewAction =
  | "apply"
  | "edit-capabilities"
  | "edit-harnesses"
  | "edit-options"
  | "cancel";

export interface RunSelectionWizardOptions {
  initialSelections: InstallSelections;
  introTitle: string;
  startStep?: WizardStep;
}

export interface CapabilityChecklistOption {
  value: Capability;
  label: string;
  hint: string;
  disabled: boolean;
  description: string;
  dependencyText: string;
  statusText: string;
}

export interface CapabilityChecklistState {
  selections: InstallSelections;
  profile: InstallProfile;
  options: CapabilityChecklistOption[];
  selectedCapabilities: Capability[];
}

export interface WizardOptionSelections {
  skills: boolean;
  skillScope: InstallSelections["skillScope"];
  optionalSkills: string[];
  prompts: boolean;
  templatesMode: TemplatesMode;
  referencesMode: ReferencesMode;
}

export interface CapabilityStepState {
  selections: InstallSelections;
  checklist: CapabilityChecklistState;
}

export interface HarnessSelectionOption {
  value: Harness;
  label: string;
  hint: string;
}

export interface HarnessStepState {
  selections: InstallSelections;
  options: HarnessSelectionOption[];
  selectedHarnesses: Harness[];
}

export interface OptionsStepState {
  selections: InstallSelections;
  options: WizardOptionSelections;
  skillSelection: SkillSelectionState;
  skillScopeOptions: Array<{
    value: InstallSelections["skillScope"];
    label: string;
    hint: string;
  }>;
}

export interface ReviewStepState {
  selections: InstallSelections;
  profile: InstallProfile;
  summary: string;
}

export interface WizardRenderer {
  beginSession?(title: string): Promise<void> | void;
  editCapabilities(state: CapabilityStepState): Promise<Capability[] | null>;
  editHarnesses(state: HarnessStepState): Promise<Harness[] | null>;
  editOptions(state: OptionsStepState): Promise<WizardOptionSelections | null>;
  review(state: ReviewStepState): Promise<WizardReviewAction>;
}

export interface SkillSelectionPromptOption {
  value: string;
  label: string;
  hint: string;
  disabled: boolean;
  rowKind: "heading" | "default-skill" | "optional-skill";
}

export interface SkillSelectionState {
  defaultSkills: WizardSkillChoice[];
  optionalSkills: WizardSkillChoice[];
  promptOptions: SkillSelectionPromptOption[];
  selectedSkillNames: string[];
  selectedOptionalSkillNames: string[];
}

export function normalizeWizardSelections(
  selections: InstallSelections,
): InstallSelections {
  const next = cloneSelections(selections);

  for (const capability of CAPABILITIES) {
    const missingPrerequisites = CAPABILITY_DEPENDENCIES[capability].filter(
      (dependency) => !next.capabilities[dependency],
    );

    if (missingPrerequisites.length > 0) {
      next.capabilities[capability] = false;
    }
  }

  return next;
}

export function applyCapabilitySelections(
  selections: InstallSelections,
  selectedCapabilities: Iterable<Capability>,
): InstallSelections {
  const next = cloneSelections(selections);
  const selectedSet = new Set(selectedCapabilities);

  for (const capability of CAPABILITIES) {
    next.capabilities[capability] = selectedSet.has(capability);
  }

  return normalizeWizardSelections(next);
}

export function getWizardOptionSelections(
  selections: InstallSelections,
): WizardOptionSelections {
  return {
    skills: selections.skills,
    skillScope: selections.skillScope,
    optionalSkills: [...selections.optionalSkills].sort(),
    prompts: selections.prompts,
    templatesMode: selections.templatesMode,
    referencesMode: selections.referencesMode,
  };
}

export function buildSkillSelectionState(
  options: WizardOptionSelections,
  skillChoices: GroupedSkillChoices,
): SkillSelectionState {
  const selectedOptionalSkillSet = new Set(options.optionalSkills);
  const selectedOptionalSkillNames = skillChoices.optionalSkills
    .filter((skill) => selectedOptionalSkillSet.has(skill.name))
    .map((skill) => skill.name);
  const selectedSkillNames = [
    ...skillChoices.defaultSkills.map((skill) => skill.name),
    ...selectedOptionalSkillNames,
  ];
  const promptOptions: SkillSelectionPromptOption[] = [];

  if (skillChoices.defaultSkills.length > 0) {
    promptOptions.push({
      value: "__skill-group:default",
      label: "Default",
      hint: "Installed automatically",
      disabled: true,
      rowKind: "heading",
    });
    promptOptions.push(
      ...skillChoices.defaultSkills.map((skill) => ({
        value: skill.name,
        label: skill.name,
        hint: skill.description,
        disabled: true,
        rowKind: "default-skill" as const,
      })),
    );
  }

  if (skillChoices.optionalSkills.length > 0) {
    promptOptions.push({
      value: "__skill-group:optional",
      label: "Optional",
      hint: "Select any additional skills to install",
      disabled: true,
      rowKind: "heading",
    });
    promptOptions.push(
      ...skillChoices.optionalSkills.map((skill) => ({
        value: skill.name,
        label: skill.name,
        hint: skill.description,
        disabled: false,
        rowKind: "optional-skill" as const,
      })),
    );
  }

  return {
    defaultSkills: skillChoices.defaultSkills,
    optionalSkills: skillChoices.optionalSkills,
    promptOptions,
    selectedSkillNames,
    selectedOptionalSkillNames,
  };
}

export function shouldPromptForSkillSelection(
  skillSelection: SkillSelectionState,
): boolean {
  return skillSelection.optionalSkills.length > 0;
}

export function getSelectedHarnesses(
  selections: Pick<InstallSelections, "harnesses">,
): Harness[] {
  return HARNESSES.filter((harness) => selections.harnesses[harness]);
}

export function applyHarnessSelections(
  selections: InstallSelections,
  selectedHarnesses: Iterable<Harness>,
): InstallSelections {
  const next = cloneSelections(selections);
  const selectedSet = new Set(selectedHarnesses);

  for (const harness of HARNESSES) {
    next.harnesses[harness] = selectedSet.has(harness);
  }

  return next;
}

function buildOptionsStepState(
  selections: InstallSelections,
): OptionsStepState {
  const options = getWizardOptionSelections(selections);
  const skillChoices = getGroupedSkillChoices();

  return {
    selections,
    options,
    skillSelection: buildSkillSelectionState(options, skillChoices),
    skillScopeOptions: [
      {
        value: "project",
        label: "Project",
        hint: OPTION_METADATA.skillScope.project,
      },
      {
        value: "global",
        label: "Global",
        hint: OPTION_METADATA.skillScope.global,
      },
    ],
  };
}

export function applyWizardOptionSelections(
  selections: InstallSelections,
  options: WizardOptionSelections,
): InstallSelections {
  const next = cloneSelections(selections);
  next.skills = options.skills;
  next.skillScope = options.skillScope;
  next.optionalSkills = options.skills
    ? Array.from(new Set(options.optionalSkills)).sort()
    : [];
  next.prompts = options.prompts;
  next.templatesMode = options.templatesMode;
  next.referencesMode = options.referencesMode;

  return next;
}

export function buildCapabilityChecklistState(
  selections: InstallSelections,
): CapabilityChecklistState {
  const normalizedSelections = normalizeWizardSelections(selections);
  const profile = resolveInstallProfile(normalizedSelections);

  const options = CAPABILITIES.map((capability) => {
    const metadata = CAPABILITY_METADATA[capability];
    const state = profile.capabilityState[capability];
    const disabled = state.missingPrerequisites.length > 0;
    const dependencyText =
      CAPABILITY_DEPENDENCIES[capability].length === 0
        ? "No prerequisites"
        : `Requires ${formatInlineList(CAPABILITY_DEPENDENCIES[capability])}`;
    const statusText = state.effectiveSelection
      ? "Selected"
      : disabled
        ? (state.disabledReason ?? "Unavailable")
        : "Available";

    return {
      value: capability,
      label: metadata.label,
      hint: disabled ? (state.disabledReason ?? metadata.hint) : metadata.hint,
      disabled,
      description: metadata.description,
      dependencyText,
      statusText,
    } satisfies CapabilityChecklistOption;
  });

  return {
    selections: normalizedSelections,
    profile,
    options,
    selectedCapabilities: CAPABILITIES.filter(
      (capability) => normalizedSelections.capabilities[capability],
    ),
  };
}

export function renderWizardReviewSummary(
  selections: InstallSelections,
): string {
  const normalizedSelections = normalizeWizardSelections(selections);
  const profile = resolveInstallProfile(normalizedSelections);
  const selectedHarnesses = getSelectedHarnesses(normalizedSelections);
  const harnessSummary =
    selectedHarnesses.length > 0
      ? formatInlineList(
          selectedHarnesses.map((harness) => HARNESS_METADATA[harness].label),
        )
      : "none";
  const optionalSkillSummary =
    normalizedSelections.optionalSkills.length > 0
      ? formatInlineList(normalizedSelections.optionalSkills)
      : "required only";
  const skillsSummary = normalizedSelections.skills
    ? `Yes (${normalizedSelections.skillScope})`
    : "No";

  return [
    "Document types",
    ...CAPABILITIES.map((capability) => {
      const state = profile.capabilityState[capability];
      const label = CAPABILITY_METADATA[capability].label;
      const value = state.effectiveSelection
        ? "selected"
        : state.disabledReason
          ? `locked (${state.disabledReason})`
          : "off";

      return `- ${label}: ${value}`;
    }),
    "",
    "Options",
    `- Harnesses: ${harnessSummary}`,
    `- ${OPTION_METADATA.skills.label}: ${skillsSummary}`,
    `- Optional skills: ${normalizedSelections.skills ? optionalSkillSummary : "n/a"}`,
    `- ${OPTION_METADATA.prompts.label}: ${normalizedSelections.prompts ? "included" : "omitted"}`,
    `- ${OPTION_METADATA.templatesMode.label}: ${normalizedSelections.templatesMode}`,
    `- ${OPTION_METADATA.referencesMode.label}: ${normalizedSelections.referencesMode}`,
  ].join("\n");
}

export async function runSelectionWizard(
  options: RunSelectionWizardOptions,
): Promise<InstallSelections | null> {
  return runSelectionWizardWithRenderer(createClackWizardRenderer(), options);
}

export async function runSelectionWizardWithRenderer(
  renderer: WizardRenderer,
  options: RunSelectionWizardOptions,
): Promise<InstallSelections | null> {
  let selections = normalizeWizardSelections(options.initialSelections);
  let step = options.startStep ?? "capabilities";

  await renderer.beginSession?.(options.introTitle);

  while (true) {
    if (step === "capabilities") {
      const selectedCapabilities = await renderer.editCapabilities({
        selections,
        checklist: buildCapabilityChecklistState(selections),
      });

      if (!selectedCapabilities) {
        return null;
      }

      selections = applyCapabilitySelections(selections, selectedCapabilities);
      step = "harnesses";
      continue;
    }

    if (step === "harnesses") {
      const selectedHarnesses = await renderer.editHarnesses({
        selections,
        options: HARNESSES.map((harness) => ({
          value: harness,
          label: HARNESS_METADATA[harness].label,
          hint: HARNESS_METADATA[harness].hint,
        })),
        selectedHarnesses: getSelectedHarnesses(selections),
      });

      if (!selectedHarnesses) {
        return null;
      }

      if (selectedHarnesses.length === 0) {
        continue;
      }

      selections = applyHarnessSelections(selections, selectedHarnesses);
      step = "options";
      continue;
    }

    if (step === "options") {
      const nextOptions = await renderer.editOptions(
        buildOptionsStepState(selections),
      );

      if (!nextOptions) {
        return null;
      }

      selections = applyWizardOptionSelections(selections, nextOptions);
      step = "review";
      continue;
    }

    const reviewAction = await renderer.review({
      selections,
      profile: resolveInstallProfile(selections),
      summary: renderWizardReviewSummary(selections),
    });

    if (reviewAction === "apply") {
      return normalizeWizardSelections(selections);
    }

    if (reviewAction === "edit-capabilities") {
      step = "capabilities";
      continue;
    }

    if (reviewAction === "edit-harnesses") {
      step = "harnesses";
      continue;
    }

    if (reviewAction === "edit-options") {
      step = "options";
      continue;
    }

    return null;
  }
}

export async function promptForInstructionConflictResolutions(
  conflicts: InstructionConflict[],
): Promise<InstructionConflictResolutions | null> {
  if (conflicts.length === 0) {
    return {};
  }

  note(
    "make-docs found existing agent instruction files where managed guidance would normally be installed.\nChoose how to handle each conflict before continuing.",
    "Resolve agent instruction conflicts",
  );

  const resolutions: InstructionConflictResolutions = {};

  for (const conflict of conflicts) {
    note(
      [`Path: ${conflict.relativePath}`, `Conflict: ${conflict.reason}`].join(
        "\n",
      ),
      `Existing ${conflict.instructionKind} detected`,
    );

    const resolution = await select<InstructionConflictResolution>({
      message: `How should make-docs handle ${conflict.relativePath}?`,
      withGuide: true,
      initialValue: "update",
      options: [
        {
          value: "update",
          label: "Update",
          hint: "Append the make-docs instructions to the end of the existing file.",
        },
        {
          value: "overwrite",
          label: "Overwrite",
          hint: "Replace the existing file with the make-docs version and manage it directly.",
        },
        {
          value: "skip",
          label: "Skip",
          hint: "WARNING: Leave this file unchanged. Agent behavior and automation could be severely impacted if make-docs instructions are skipped here.",
        },
      ],
    });

    if (isCancel(resolution)) {
      return null;
    }

    resolutions[conflict.relativePath] = resolution;
  }

  return resolutions;
}

function createClackWizardRenderer(): WizardRenderer {
  return {
    beginSession(title) {
      intro(title);
    },
    async editCapabilities(state) {
      return promptForCapabilities(state.selections);
    },
    async editHarnesses(state) {
      return promptForHarnesses(state.selections);
    },
    async editOptions(state) {
      return promptForOptions(state);
    },
    async review(state) {
      note(state.summary, "Review selections");

      const result = await select<WizardReviewAction>({
        message: "What would you like to do next?",
        withGuide: true,
        options: [
          { value: "apply", label: "Apply", hint: "Use this configuration" },
          {
            value: "edit-capabilities",
            label: "Edit document types",
            hint: "Adjust managed document types",
          },
          {
            value: "edit-harnesses",
            label: "Edit harnesses",
            hint: "Adjust Claude Code and Codex support",
          },
          {
            value: "edit-options",
            label: "Edit options",
            hint: "Adjust skills, prompts, templates, and references",
          },
          {
            value: "cancel",
            label: "Cancel",
            hint: "Exit without applying changes",
          },
        ],
      });

      if (isCancel(result)) {
        return "cancel";
      }

      return result;
    },
  };
}

async function promptForCapabilities(
  selections: InstallSelections,
): Promise<Capability[] | null> {
  const promptState = {
    selections: normalizeWizardSelections(selections),
  };

  const prompt = new MultiSelectPrompt<CapabilityChecklistOption>({
    options: buildCapabilityChecklistState(promptState.selections).options,
    initialValues: buildCapabilityChecklistState(promptState.selections)
      .selectedCapabilities,
    required: true,
    render(this: MultiSelectPrompt<CapabilityChecklistOption>) {
      return renderCapabilitiesFrame(this, promptState.selections);
    },
    validate(value) {
      if (!value || value.length === 0) {
        return "Please keep at least one capability enabled.";
      }
    },
  });

  const syncPromptState = () => {
    promptState.selections = applyCapabilitySelections(
      selections,
      prompt.value ?? [],
    );

    const checklist = buildCapabilityChecklistState(promptState.selections);
    prompt.options = checklist.options;
    prompt.value = checklist.selectedCapabilities;

    if (prompt.options[prompt.cursor]?.disabled) {
      prompt.cursor = findNearestEnabledIndex(prompt.cursor, prompt.options);
    }
  };

  prompt.on("value", syncPromptState);
  prompt.on("cursor", syncPromptState);
  prompt.on("key", syncPromptState);
  syncPromptState();

  const result = await prompt.prompt();
  if (isCancel(result)) {
    return null;
  }

  return buildCapabilityChecklistState(promptState.selections)
    .selectedCapabilities;
}

async function promptForHarnesses(
  selections: InstallSelections,
): Promise<Harness[] | null> {
  const result = await multiselect<Harness>({
    message: "Which agent platforms will you use?",
    withGuide: true,
    initialValues: getSelectedHarnesses(selections),
    required: true,
    options: HARNESSES.map((harness) => ({
      value: harness,
      label: HARNESS_METADATA[harness].label,
      hint: HARNESS_METADATA[harness].hint,
    })),
  });

  if (isCancel(result)) {
    return null;
  }

  return result;
}

async function promptForOptions(
  state: OptionsStepState,
): Promise<WizardOptionSelections | null> {
  const { options, skillSelection, skillScopeOptions } = state;

  const skillsResult = await confirm({
    message: "Install agent skills?",
    withGuide: true,
    initialValue: options.skills,
    active: "Yes",
    inactive: "No",
  });

  if (isCancel(skillsResult)) {
    return null;
  }

  let skillScope: InstallSelections["skillScope"] = options.skillScope;
  let optionalSkills = options.optionalSkills;

  if (skillsResult) {
    const scopeResult = await select<InstallSelections["skillScope"]>({
      message: "Where should skills be installed?",
      withGuide: true,
      initialValue: options.skillScope,
      options: skillScopeOptions,
    });

    if (isCancel(scopeResult)) {
      return null;
    }

    skillScope = scopeResult;

    if (shouldPromptForSkillSelection(skillSelection)) {
      const prompt = new MultiSelectPrompt<SkillSelectionPromptOption>({
        options: skillSelection.promptOptions,
        initialValues: skillSelection.selectedSkillNames,
        required: false,
        render(this: MultiSelectPrompt<SkillSelectionPromptOption>) {
          return renderSkillSelectionFrame(this, skillSelection);
        },
        validate(value) {
          if (!value || value.length === 0) {
            return "Please keep at least one skill enabled.";
          }
        },
      });

      const optionalSkillSelection = await prompt.prompt();
      if (isCancel(optionalSkillSelection)) {
        return null;
      }

      const selectedSkillSet = new Set(optionalSkillSelection);
      optionalSkills = skillSelection.optionalSkills
        .filter((skill) => selectedSkillSet.has(skill.name))
        .map((skill) => skill.name);
    } else {
      optionalSkills = [];
    }
  } else {
    optionalSkills = [];
  }

  const promptsResult = await confirm({
    message: "Install starter prompts?",
    withGuide: true,
    initialValue: options.prompts,
    active: "Yes",
    inactive: "No",
  });

  if (isCancel(promptsResult)) {
    return null;
  }

  const templatesMode = await select<TemplatesMode>({
    message: "Which document templates should be installed?",
    withGuide: true,
    initialValue: options.templatesMode,
    options: [
      {
        value: "all",
        label: "All templates",
        hint: OPTION_METADATA.templatesMode.all,
      },
      {
        value: "required",
        label: "Required templates only",
        hint: OPTION_METADATA.templatesMode.required,
      },
    ],
  });

  if (isCancel(templatesMode)) {
    return null;
  }

  const referencesMode = await select<ReferencesMode>({
    message: "Which reference files should be installed?",
    withGuide: true,
    initialValue: options.referencesMode,
    options: [
      {
        value: "all",
        label: "All references",
        hint: OPTION_METADATA.referencesMode.all,
      },
      {
        value: "required",
        label: "Required references only",
        hint: OPTION_METADATA.referencesMode.required,
      },
    ],
  });

  if (isCancel(referencesMode)) {
    return null;
  }

  return {
    skills: skillsResult,
    skillScope,
    optionalSkills,
    prompts: promptsResult,
    templatesMode,
    referencesMode,
  };
}

function renderSkillSelectionFrame(
  prompt: MultiSelectPrompt<SkillSelectionPromptOption>,
  skillSelection: SkillSelectionState,
): string {
  const lineColor = prompt.state === "error" ? "yellow" : "cyan";
  const header = [
    styleText("gray", S_BAR),
    wrapTextWithPrefix(
      process.stdout,
      "Select skills to install",
      `${styleText(lineColor, S_BAR)}  `,
      `${symbol(prompt.state)}  `,
    ),
  ];
  const bodyPrefix = `${styleText(lineColor, S_BAR)}  `;
  const selectedSkillNames = new Set(
    prompt.value ?? skillSelection.selectedSkillNames,
  );
  const selectedSummary =
    selectedSkillNames.size > 0
      ? formatInlineList(Array.from(selectedSkillNames))
      : "no skills";

  if (prompt.state === "submit") {
    return `${header.join("\n")}\n${styleText("gray", S_BAR)}  ${styleText("dim", selectedSummary)}`;
  }

  if (prompt.state === "cancel") {
    return `${header.join("\n")}\n${styleText("gray", S_BAR)}  ${styleText(
      ["strikethrough", "dim"],
      selectedSummary,
    )}`;
  }

  const focusedOption = getFocusedSkillSelectionOption(prompt, skillSelection);
  const skillLines = renderSkillSelectionLines(
    skillSelection.promptOptions,
    prompt.cursor,
    selectedSkillNames,
  );
  const detailLines = renderDetailBox(
    focusedOption.label,
    [
      focusedOption.hint || "No additional description available.",
      "",
      `Group: ${focusedOption.rowKind === "default-skill" ? "Default" : "Optional"}`,
      `Status: ${
        focusedOption.rowKind === "default-skill"
          ? "Installed automatically"
          : selectedSkillNames.has(focusedOption.value)
            ? "Selected"
            : "Available"
      }`,
    ],
    process.stdout.columns,
  );
  const hintLines = [
    `${styleText("dim", "Selected now:")} ${
      selectedSkillNames.size > 0 ? selectedSummary : styleText("dim", "none")
    }`,
    `${styleText("dim", "Use ↑/↓ to navigate")} • ${styleText(
      "dim",
      "Space toggles optional skills",
    )} • ${styleText("dim", "Enter to confirm")}`,
    styleText(
      "dim",
      "Default skills are installed automatically and cannot be changed here.",
    ),
  ];
  const footer = styleText(lineColor, S_BAR_END);
  const spacer = styleText(lineColor, S_BAR);
  const errorLines =
    prompt.state === "error" && prompt.error
      ? prompt.error
          .split("\n")
          .map((line, index) =>
            index === 0
              ? `${styleText("yellow", S_BAR_END)}  ${styleText("yellow", line)}`
              : `   ${styleText("yellow", line)}`,
          )
      : [];

  return [
    ...header,
    spacer,
    ...skillLines.map((line) => `${bodyPrefix}${line}`),
    spacer,
    ...detailLines.map((line) => `${bodyPrefix}${line}`),
    spacer,
    `${bodyPrefix}${hintLines[0]}`,
    `${bodyPrefix}${hintLines[1]}`,
    `${bodyPrefix}${hintLines[2]}`,
    footer,
    ...errorLines,
  ].join("\n");
}

function getFocusedSkillSelectionOption(
  prompt: MultiSelectPrompt<SkillSelectionPromptOption>,
  skillSelection: SkillSelectionState,
): SkillSelectionPromptOption {
  const activeOption = skillSelection.promptOptions[prompt.cursor];
  if (activeOption && activeOption.rowKind !== "heading") {
    return activeOption;
  }

  return (
    skillSelection.promptOptions.find(
      (option) => option.rowKind !== "heading",
    ) ?? {
      value: "__skills",
      label: "Skills",
      hint: "",
      disabled: true,
      rowKind: "heading",
    }
  );
}

function renderSkillSelectionOption(
  option: SkillSelectionPromptOption,
  active: boolean,
  selectedSkillNames: ReadonlySet<string>,
): string {
  if (option.rowKind === "heading") {
    return styleText(["bold", "white"], option.label);
  }

  if (option.rowKind === "default-skill") {
    return [
      "  ",
      styleText("green", S_CHECKBOX_SELECTED),
      ` ${option.label}`,
      styleText("dim", " (default, read-only)"),
      option.hint ? ` ${styleText("dim", `(${option.hint})`)}` : "",
    ].join("");
  }

  const selected = selectedSkillNames.has(option.value);
  if (selected && active) {
    return `  ${styleText("green", S_CHECKBOX_SELECTED)} ${styleText("white", option.label)}${
      option.hint ? ` ${styleText("dim", `(${option.hint})`)}` : ""
    }`;
  }

  if (selected) {
    return `  ${styleText("green", S_CHECKBOX_SELECTED)} ${styleText("dim", option.label)}${
      option.hint ? ` ${styleText("dim", `(${option.hint})`)}` : ""
    }`;
  }

  if (active) {
    return `  ${styleText("cyan", S_CHECKBOX_ACTIVE)} ${styleText(
      ["bold", "white"],
      option.label,
    )}${option.hint ? ` ${styleText("dim", `(${option.hint})`)}` : ""}`;
  }

  return `  ${styleText("dim", S_CHECKBOX_INACTIVE)} ${styleText("dim", option.label)}${
    option.hint ? ` ${styleText("dim", `(${option.hint})`)}` : ""
  }`;
}

function renderSkillSelectionLines(
  options: SkillSelectionPromptOption[],
  activeIndex: number,
  selectedSkillNames: ReadonlySet<string>,
): string[] {
  const lines: string[] = [];

  options.forEach((option, index) => {
    if (option.rowKind === "heading" && lines.length > 0) {
      lines.push("");
    }

    lines.push(
      renderSkillSelectionOption(
        option,
        index === activeIndex,
        selectedSkillNames,
      ),
    );

    if (option.rowKind === "heading") {
      lines.push("");
    }
  });

  return lines;
}

function renderCapabilitiesFrame(
  prompt: MultiSelectPrompt<CapabilityChecklistOption>,
  selections: InstallSelections,
): string {
  const checklist = buildCapabilityChecklistState(selections);
  const lineColor = prompt.state === "error" ? "yellow" : "cyan";
  const header = [
    styleText("gray", S_BAR),
    wrapTextWithPrefix(
      process.stdout,
      "Choose the document types to manage in this project:",
      `${styleText(lineColor, S_BAR)}  `,
      `${symbol(prompt.state)}  `,
    ),
  ];
  const bodyPrefix = `${styleText(lineColor, S_BAR)}  `;
  const focusedOption =
    checklist.options[prompt.cursor] ?? checklist.options[0];
  const selectedLabels =
    checklist.selectedCapabilities.length > 0
      ? checklist.selectedCapabilities.map(
          (capability) => CAPABILITY_METADATA[capability].label,
        )
      : [];

  if (prompt.state === "submit") {
    const submittedSummary =
      selectedLabels.length > 0
        ? formatInlineList(selectedLabels)
        : "no capability families";

    return `${header.join("\n")}\n${styleText("gray", S_BAR)}  ${styleText("dim", submittedSummary)}`;
  }

  if (prompt.state === "cancel") {
    const cancelledSummary =
      selectedLabels.length > 0
        ? formatInlineList(selectedLabels)
        : "no capability families";

    return `${header.join("\n")}\n${styleText("gray", S_BAR)}  ${styleText(
      ["strikethrough", "dim"],
      cancelledSummary,
    )}`;
  }

  const checklistLines = checklist.options.map((option, index) =>
    renderCapabilityOption(
      option,
      index === prompt.cursor,
      checklist.selectedCapabilities,
    ),
  );

  const detailLines = renderDetailBox(
    focusedOption.label,
    [
      `${focusedOption.description}`,
      "",
      `Status: ${focusedOption.statusText}`,
      `Prerequisites: ${focusedOption.dependencyText.replace(/^Requires /, "")}`,
    ],
    process.stdout.columns,
  );

  const hintLines = [
    `${styleText("dim", "Selected now:")} ${
      selectedLabels.length > 0
        ? formatInlineList(selectedLabels)
        : styleText("dim", "none")
    }`,
    `${styleText("dim", "Use ↑/↓ to navigate")} • ${styleText(
      "dim",
      "Space to select or deselect",
    )} • ${styleText("dim", "Enter to confirm")}`,
  ];

  const footer = styleText(lineColor, S_BAR_END);
  const spacer = styleText(lineColor, S_BAR);
  const errorLines =
    prompt.state === "error"
      ? prompt.error
          .split("\n")
          .map((line, index) =>
            index === 0
              ? `${styleText("yellow", S_BAR_END)}  ${styleText("yellow", line)}`
              : `   ${styleText("yellow", line)}`,
          )
      : [];

  return [
    ...header,
    spacer,
    ...checklistLines.map((line) => `${bodyPrefix}${line}`),
    spacer,
    ...detailLines.map((line) => `${bodyPrefix}${line}`),
    spacer,
    ...hintLines.map((line) => `${bodyPrefix}${line}`),
    footer,
    ...errorLines,
  ].join("\n");
}

function renderCapabilityOption(
  option: CapabilityChecklistOption,
  active: boolean,
  selectedCapabilities: Capability[],
): string {
  const selected = selectedCapabilities.includes(option.value);

  if (option.disabled) {
    return `${styleText("gray", S_CHECKBOX_INACTIVE)} ${styleText(
      ["strikethrough", "gray"],
      option.label,
    )}`;
  }

  if (selected && active) {
    return `${styleText("green", S_CHECKBOX_SELECTED)} ${option.label}`;
  }

  if (selected) {
    return `${styleText("green", S_CHECKBOX_SELECTED)} ${styleText("dim", option.label)}`;
  }

  if (active) {
    return `${styleText("cyan", S_CHECKBOX_ACTIVE)} ${option.label}`;
  }

  return `${styleText("dim", S_CHECKBOX_INACTIVE)} ${styleText("dim", option.label)}`;
}

function renderDetailBox(
  title: string,
  lines: string[],
  columns: number,
): string[] {
  const maxWidth = Math.max(46, Math.min(columns - 8, 88));
  const contentWidth = Math.max(24, maxWidth - 4);
  const boxLines = [
    `${unicodeFrame("╭", "+")} ${title} ${unicodeFrame("─", "-").repeat(
      Math.max(1, contentWidth - title.length),
    )}${unicodeFrame("╮", "+")}`,
  ];

  for (const line of lines) {
    for (const wrappedLine of wrapPlainText(line, contentWidth)) {
      boxLines.push(
        `${unicodeFrame("│", "|")} ${wrappedLine.padEnd(contentWidth)} ${unicodeFrame("│", "|")}`,
      );
    }
  }

  boxLines.push(
    `${unicodeFrame("╰", "+")}${unicodeFrame("─", "-").repeat(contentWidth + 2)}${unicodeFrame(
      "╯",
      "+",
    )}`,
  );

  return boxLines.map((line) => styleText("dim", line));
}

function wrapPlainText(text: string, width: number): string[] {
  const words = text.split(/\s+/).filter((word) => word.length > 0);
  if (words.length === 0) {
    return [""];
  }

  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current.length === 0 ? word : `${current} ${word}`;
    if (candidate.length <= width) {
      current = candidate;
      continue;
    }

    if (current.length > 0) {
      lines.push(current);
    }

    if (word.length <= width) {
      current = word;
      continue;
    }

    let remaining = word;
    while (remaining.length > width) {
      lines.push(remaining.slice(0, width - 1) + "…");
      remaining = remaining.slice(width - 1);
    }
    current = remaining;
  }

  if (current.length > 0) {
    lines.push(current);
  }

  return lines;
}

function unicodeFrame(primary: string, fallback: string): string {
  return process.env.TERM === "linux" ? fallback : primary;
}

function findNearestEnabledIndex(
  cursor: number,
  options: CapabilityChecklistOption[],
): number {
  const enabledIndices = options
    .map((option, index) => ({ option, index }))
    .filter(({ option }) => !option.disabled)
    .map(({ index }) => index);

  if (enabledIndices.length === 0) {
    return 0;
  }

  if (enabledIndices.includes(cursor)) {
    return cursor;
  }

  return enabledIndices.find((index) => index > cursor) ?? enabledIndices[0];
}
