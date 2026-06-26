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
  createDefaultMakeDocsConfig,
  getDocumentKindLabel,
  type DocumentKindLabelKey,
  type MakeDocsConfig,
} from "./config";
import {
  getRecommendedSkillChoices,
  type WizardSkillChoice,
} from "./skill-catalog";
import type { SkillRegistry } from "./skill-registry";
import {
  CAPABILITIES,
  HARNESSES,
  type Capability,
  type Harness,
  type InstallProfile,
  type InstallSelections,
  type ManagedFileConflictGroup,
  type ManagedFileConflictResolution,
  type ManagedFileConflictResolutions,
  type ReviewableManagedFileConflict,
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

const MANAGED_FILE_CONFLICT_GROUP_ORDER: readonly string[] = [
  "agent-instructions",
  "references",
  "templates",
  "prompts",
  "skills",
  "managed-files",
  "router-files",
  "routers",
  "other",
];

const MANAGED_FILE_CONFLICT_GROUP_LABELS: Record<string, string> = {
  "agent-instructions": "Agent instructions",
  references: "References",
  templates: "Templates",
  prompts: "Prompts",
  skills: "Skills",
  "managed-files": "Managed files",
  "router-files": "Router files",
  routers: "Router files",
  other: "Other managed files",
};

const CAPABILITY_DOCUMENT_KIND_LABELS: Record<Capability, DocumentKindLabelKey> = {
  designs: "design",
  plans: "plan",
  prd: "prd",
  work: "work",
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
  config?: MakeDocsConfig;
  skillRegistry?: SkillRegistry;
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
  selectedSkills: string[];
}

export interface CapabilityStepState {
  selections: InstallSelections;
  checklist: CapabilityChecklistState;
  config: MakeDocsConfig;
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
  rowKind: "skill";
  detailLines: string[];
}

export interface SkillSelectionState {
  skills: WizardSkillChoice[];
  promptOptions: SkillSelectionPromptOption[];
  selectedSkillNames: string[];
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
    selectedSkills: [...selections.selectedSkills].sort(),
  };
}

export function buildSkillSelectionState(
  options: WizardOptionSelections,
  skillChoices: WizardSkillChoice[],
): SkillSelectionState {
  const selectedSkillSet = new Set(options.selectedSkills);
  const selectedSkillNames = skillChoices
    .filter((skill) => selectedSkillSet.has(skill.name))
    .map((skill) => skill.name);
  const promptOptions = skillChoices.map((skill) => ({
    value: skill.name,
    label: `${formatSkillPurposeLabels(skill)} / ${skill.name}`,
    hint: formatSkillChoiceHint(skill),
    disabled: false,
    rowKind: "skill" as const,
    detailLines: [
      skill.description,
      "",
      `Purpose: ${formatSkillPurposeLabels(skill)}`,
      `Candidate skill: ${skill.name}`,
      `Source policy: ${skill.sourcePolicyKind}`,
      `Skill source: ${skill.source}`,
      `Harness support: ${formatInlineList(skill.supportedHarnesses)}`,
      `Provenance: ${skill.provenanceLabel} (${skill.provenanceKind})`,
    ],
  }));

  return {
    skills: skillChoices,
    promptOptions,
    selectedSkillNames,
  };
}

export function shouldPromptForSkillSelection(
  skillSelection: SkillSelectionState,
): boolean {
  return skillSelection.skills.length > 0;
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
  skillRegistry?: SkillRegistry,
): OptionsStepState {
  const options = getWizardOptionSelections(selections);
  const skillChoices = getRecommendedSkillChoices(skillRegistry);

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
  next.selectedSkills = options.skills
    ? Array.from(new Set(options.selectedSkills)).sort()
    : [];

  return next;
}

export function buildCapabilityChecklistState(
  selections: InstallSelections,
  config: MakeDocsConfig = createDefaultMakeDocsConfig(),
): CapabilityChecklistState {
  const normalizedSelections = normalizeWizardSelections(selections);
  const profile = resolveInstallProfile(normalizedSelections);

  const options = CAPABILITIES.map((capability) => {
    const metadata = CAPABILITY_METADATA[capability];
    const label = getCapabilityLabel(config, capability);
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
      label,
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
  config: MakeDocsConfig = createDefaultMakeDocsConfig(),
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
  const selectedSkillSummary =
    normalizedSelections.selectedSkills.length > 0
      ? formatInlineList(normalizedSelections.selectedSkills)
      : "none";
  const skillsSummary = normalizedSelections.skills
    ? `Yes (${normalizedSelections.skillScope})`
    : "No";

  return [
    "Document types",
    ...CAPABILITIES.map((capability) => {
      const state = profile.capabilityState[capability];
      const label = getCapabilityLabel(config, capability);
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
    `- Selected skills: ${normalizedSelections.skills ? selectedSkillSummary : "n/a"}`,
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
  const config = options.config ?? createDefaultMakeDocsConfig();

  await renderer.beginSession?.(options.introTitle);

  while (true) {
    if (step === "capabilities") {
      const selectedCapabilities = await renderer.editCapabilities({
        selections,
        checklist: buildCapabilityChecklistState(selections, config),
        config,
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
        buildOptionsStepState(selections, options.skillRegistry),
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
      summary: renderWizardReviewSummary(selections, config),
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

export async function promptForManagedFileConflictResolutions(
  conflicts: ReviewableManagedFileConflict[],
): Promise<ManagedFileConflictResolutions | null> {
  if (conflicts.length === 0) {
    return {};
  }

  const sortedConflicts = sortManagedFileConflicts(conflicts);

  note(
    renderManagedFileConflictSummary(sortedConflicts),
    "Resolve managed file conflicts",
  );

  const batchResolution = await select<
    "overwrite-all" | "skip-all" | "review-each"
  >({
    message: "How should make-docs handle these existing files?",
    withGuide: true,
    initialValue: "review-each",
    options: [
      {
        value: "overwrite-all",
        label: "Overwrite all",
      },
      {
        value: "skip-all",
        label: "Skip all",
      },
      {
        value: "review-each",
        label: "Review each",
      },
    ],
  });

  if (isCancel(batchResolution)) {
    return null;
  }

  if (batchResolution === "overwrite-all") {
    return buildManagedFileConflictResolutions(sortedConflicts, "overwrite");
  }

  if (batchResolution === "skip-all") {
    return buildManagedFileConflictResolutions(sortedConflicts, "skip");
  }

  const resolutions: ManagedFileConflictResolutions = {};

  for (const group of getManagedFileConflictGroups(sortedConflicts)) {
    const groupConflicts = sortedConflicts.filter(
      (conflict) => getManagedFileConflictGroupKey(conflict) === group,
    );

    if (groupConflicts.length === 0) {
      continue;
    }

    note(
      `${groupConflicts.length} ${pluralizeFile(groupConflicts.length)} to review.`,
      styleText("cyan", getManagedFileConflictGroupLabel(group)),
    );

    for (const conflict of groupConflicts) {
      const fileNumber = sortedConflicts.indexOf(conflict) + 1;

      note(
        [
          `Group: ${getManagedFileConflictGroupLabel(conflict.group)}`,
          `Path: ${conflict.relativePath}`,
          `Conflict: ${conflict.reason}`,
          `File ${fileNumber} of ${sortedConflicts.length}`,
        ].join("\n"),
        "Existing managed file",
      );

      const resolution = await select<ManagedFileConflictResolution>({
        message: `How should make-docs handle ${conflict.relativePath}?`,
        withGuide: true,
        initialValue:
          conflict.scope === "managed-block" ? "overwrite" : "skip",
        options: [
          {
            value: "overwrite",
            label:
              conflict.scope === "managed-block"
                ? "Reassert managed block"
                : "Overwrite",
          },
          {
            value: "skip",
            label:
              conflict.scope === "managed-block" ? "Keep local block" : "Skip",
          },
        ],
      });

      if (isCancel(resolution)) {
        return null;
      }

      resolutions[conflict.relativePath] = resolution;
    }
  }

  return resolutions;
}

function sortManagedFileConflicts(
  conflicts: ReviewableManagedFileConflict[],
): ReviewableManagedFileConflict[] {
  return [...conflicts].sort((left, right) => {
    const leftGroup = getManagedFileConflictGroupKey(left);
    const rightGroup = getManagedFileConflictGroupKey(right);
    const groupOrder =
      getManagedFileConflictGroupOrder(leftGroup) -
      getManagedFileConflictGroupOrder(rightGroup);

    if (groupOrder !== 0) {
      return groupOrder;
    }

    const groupNameOrder = leftGroup.localeCompare(rightGroup);
    if (groupNameOrder !== 0) {
      return groupNameOrder;
    }

    return left.relativePath.localeCompare(right.relativePath);
  });
}

function renderManagedFileConflictSummary(
  conflicts: ReviewableManagedFileConflict[],
): string {
  const groups = getManagedFileConflictGroups(conflicts);
  const counts = new Map<string, number>(groups.map((group) => [group, 0]));

  for (const conflict of conflicts) {
    const group = getManagedFileConflictGroupKey(conflict);
    counts.set(group, (counts.get(group) ?? 0) + 1);
  }

  return [
    `make-docs found ${conflicts.length} existing managed ${pluralizeFile(
      conflicts.length,
    )} with content that differs from make-docs.`,
    ...groups.map(
      (group) =>
        `${getManagedFileConflictGroupLabel(group)}: ${counts.get(group) ?? 0}`,
    ),
    `Review order: ${groups
      .map((group) => getManagedFileConflictGroupLabel(group).toLowerCase())
      .join(", ")}.`,
  ].join("\n");
}

function buildManagedFileConflictResolutions(
  conflicts: ReviewableManagedFileConflict[],
  resolution: ManagedFileConflictResolution,
): ManagedFileConflictResolutions {
  const resolutions: ManagedFileConflictResolutions = {};

  for (const conflict of conflicts) {
    resolutions[conflict.relativePath] = resolution;
  }

  return resolutions;
}

function pluralizeFile(count: number): string {
  return count === 1 ? "file" : "files";
}

function getManagedFileConflictGroups(
  conflicts: ReviewableManagedFileConflict[],
): string[] {
  const groupKeys = conflicts.map((conflict) =>
    getManagedFileConflictGroupKey(conflict),
  );

  return Array.from(new Set(groupKeys)).sort((left, right) => {
    const groupOrder =
      getManagedFileConflictGroupOrder(left) -
      getManagedFileConflictGroupOrder(right);

    if (groupOrder !== 0) {
      return groupOrder;
    }

    return left.localeCompare(right);
  });
}

function getManagedFileConflictGroupKey(
  conflict: ReviewableManagedFileConflict,
): string {
  return conflict.group;
}

function getManagedFileConflictGroupOrder(group: string): number {
  const index = MANAGED_FILE_CONFLICT_GROUP_ORDER.indexOf(group);
  return index === -1 ? MANAGED_FILE_CONFLICT_GROUP_ORDER.length : index;
}

function getManagedFileConflictGroupLabel(
  group: ManagedFileConflictGroup | string,
): string {
  return MANAGED_FILE_CONFLICT_GROUP_LABELS[group] ?? toTitleCase(group);
}

function getCapabilityLabel(
  config: MakeDocsConfig,
  capability: Capability,
): string {
  return getDocumentKindLabel(config, CAPABILITY_DOCUMENT_KIND_LABELS[capability]);
}

function toTitleCase(value: string): string {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => `${word.slice(0, 1).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

function createClackWizardRenderer(): WizardRenderer {
  return {
    beginSession(title) {
      intro(title);
    },
    async editCapabilities(state) {
      return promptForCapabilities(state.selections, state.config);
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
            hint: "Adjust skills and skill scope",
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
  config: MakeDocsConfig = createDefaultMakeDocsConfig(),
): Promise<Capability[] | null> {
  const promptState = {
    selections: normalizeWizardSelections(selections),
  };

  const prompt = new MultiSelectPrompt<CapabilityChecklistOption>({
    options: buildCapabilityChecklistState(promptState.selections, config).options,
    initialValues: buildCapabilityChecklistState(promptState.selections, config)
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

    const checklist = buildCapabilityChecklistState(promptState.selections, config);
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

  return buildCapabilityChecklistState(promptState.selections, config)
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
  let selectedSkills = options.selectedSkills;

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
      });

      const skillResult = await prompt.prompt();
      if (isCancel(skillResult)) {
        return null;
      }

      const selectedSkillSet = new Set(skillResult);
      selectedSkills = skillSelection.skills
        .filter((skill) => selectedSkillSet.has(skill.name))
        .map((skill) => skill.name);
    } else {
      selectedSkills = [];
    }
  } else {
    selectedSkills = [];
  }

  return {
    skills: skillsResult,
    skillScope,
    selectedSkills,
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
      ...(focusedOption.detailLines.length > 0
        ? focusedOption.detailLines
        : [focusedOption.hint || "No additional description available."]),
      "",
      `Status: ${
        selectedSkillNames.has(focusedOption.value) ? "Selected" : "Available"
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
      "Space toggles skills",
    )} • ${styleText("dim", "Enter to confirm")}`,
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
    footer,
    ...errorLines,
  ].join("\n");
}

function getFocusedSkillSelectionOption(
  prompt: MultiSelectPrompt<SkillSelectionPromptOption>,
  skillSelection: SkillSelectionState,
): SkillSelectionPromptOption {
  const activeOption = skillSelection.promptOptions[prompt.cursor];
  if (activeOption) {
    return activeOption;
  }

  return (
    skillSelection.promptOptions[0] ?? {
      value: "__skills",
      label: "Skills",
      hint: "",
      disabled: true,
      rowKind: "skill",
    }
  );
}

function renderSkillSelectionOption(
  option: SkillSelectionPromptOption,
  active: boolean,
  selectedSkillNames: ReadonlySet<string>,
): string {
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
    lines.push(
      renderSkillSelectionOption(
        option,
        index === activeIndex,
        selectedSkillNames,
      ),
    );
  });

  return lines;
}

function formatSkillPurposeLabels(skill: WizardSkillChoice): string {
  return skill.purposes.length > 0
    ? skill.purposes.map((purpose) => purpose.label).join(", ")
    : "Uncategorized";
}

function formatSkillChoiceHint(skill: WizardSkillChoice): string {
  return [
    skill.description,
    `Source: ${skill.sourcePolicyKind}`,
    `Harnesses: ${formatInlineList(skill.supportedHarnesses)}`,
    `Provenance: ${skill.provenanceLabel}`,
  ].join(" | ");
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
