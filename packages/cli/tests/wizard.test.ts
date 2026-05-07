import { beforeEach, describe, expect, test, vi } from "vitest";
import { defaultSelections } from "../src/profile";
import type {
  Capability,
  Harness,
  ReviewableManagedFileConflict,
} from "../src/types";
import type {
  WizardOptionSelections,
  WizardRenderer,
  WizardReviewAction,
} from "../src/wizard";
import {
  applyCapabilitySelections,
  buildSkillSelectionState,
  applyWizardOptionSelections,
  buildCapabilityChecklistState,
  getWizardOptionSelections,
  promptForManagedFileConflictResolutions,
  renderWizardReviewSummary,
  runSelectionWizardWithRenderer,
  shouldPromptForSkillSelection,
} from "../src/wizard";

const clackMocks = vi.hoisted(() => ({
  isCancel: vi.fn(),
  note: vi.fn(),
  select: vi.fn(),
}));

const cancelPrompt = Symbol("cancel prompt");

vi.mock("@clack/prompts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@clack/prompts")>();

  return {
    ...actual,
    isCancel: clackMocks.isCancel,
    note: clackMocks.note,
    select: clackMocks.select,
  };
});

class MockWizardRenderer implements WizardRenderer {
  public readonly seenCapabilityStates: Capability[][] = [];
  public readonly seenHarnessStates: Parameters<
    WizardRenderer["editHarnesses"]
  >[0][] = [];
  public readonly seenOptionStates: Parameters<
    WizardRenderer["editOptions"]
  >[0][] = [];
  public readonly seenReviewActions: WizardReviewAction[] = [];
  public readonly introTitles: string[] = [];

  constructor(
    private readonly capabilityAnswers: Array<Capability[] | null>,
    private readonly harnessAnswers: Array<Harness[] | null>,
    private readonly optionAnswers: Array<WizardOptionSelections | null>,
    private readonly reviewAnswers: WizardReviewAction[],
  ) {}

  beginSession(title: string): void {
    this.introTitles.push(title);
  }

  async editCapabilities(
    state: Parameters<WizardRenderer["editCapabilities"]>[0],
  ) {
    this.seenCapabilityStates.push(state.checklist.selectedCapabilities);
    return this.capabilityAnswers.shift() ?? null;
  }

  async editHarnesses(state: Parameters<WizardRenderer["editHarnesses"]>[0]) {
    this.seenHarnessStates.push(state);
    return this.harnessAnswers.shift() ?? null;
  }

  async editOptions(state: Parameters<WizardRenderer["editOptions"]>[0]) {
    this.seenOptionStates.push(state);
    return this.optionAnswers.shift() ?? null;
  }

  async review() {
    const answer = this.reviewAnswers.shift();
    if (!answer) {
      throw new Error("No review answer queued.");
    }
    this.seenReviewActions.push(answer);
    return answer;
  }
}

function managedFileConflict(
  relativePath: string,
  group: ReviewableManagedFileConflict["group"],
): ReviewableManagedFileConflict {
  return {
    relativePath,
    group,
    sourceId: `source:${relativePath}`,
    reason: "local content differs",
  };
}

beforeEach(() => {
  clackMocks.note.mockReset();
  clackMocks.select.mockReset();
  clackMocks.isCancel.mockReset();
  clackMocks.isCancel.mockImplementation((value) => value === cancelPrompt);
});

describe("selection wizard", () => {
  test("derives disabled capability rows from unmet prerequisites", () => {
    const selections = defaultSelections();
    selections.capabilities.plans = false;
    selections.capabilities.prd = true;
    selections.capabilities.work = true;

    const checklist = buildCapabilityChecklistState(selections);

    expect(checklist.selectedCapabilities).toEqual(["designs"]);
    expect(
      checklist.options.find((option) => option.value === "prd"),
    ).toMatchObject({
      disabled: true,
      statusText: "prd requires plans",
    });
    expect(
      checklist.options.find((option) => option.value === "work"),
    ).toMatchObject({
      disabled: true,
      statusText: "work requires plans and prd",
    });
  });

  test("auto-clears dependent capabilities when a prerequisite is removed", () => {
    const selections = applyCapabilitySelections(defaultSelections(), [
      "designs",
      "plans",
    ]);

    expect(selections.capabilities.designs).toBe(true);
    expect(selections.capabilities.plans).toBe(true);
    expect(selections.capabilities.prd).toBe(false);
    expect(selections.capabilities.work).toBe(false);
  });

  test("maps grouped option answers back into install selections without mutating harnesses", () => {
    const initialSelections = defaultSelections();
    initialSelections.harnesses["claude-code"] = false;

    const selections = applyWizardOptionSelections(initialSelections, {
      skills: true,
      skillScope: "global",
      selectedSkills: ["decompose-codebase"],
    });

    expect(getWizardOptionSelections(selections)).toEqual({
      skills: true,
      skillScope: "global",
      selectedSkills: ["decompose-codebase"],
    });
    expect(selections.harnesses["claude-code"]).toBe(false);
    expect(selections.harnesses.codex).toBe(true);
  });

  test("builds one selectable skill state from recommended skills", () => {
    const skillSelection = buildSkillSelectionState(
      {
        skills: true,
        skillScope: "project",
        selectedSkills: ["decompose-codebase"],
      },
      [
        {
          name: "archive-docs",
          description: "Relationship-aware archival.",
        },
        {
          name: "cleanup-docs",
          description: "Clean Markdown docs formatting drift.",
        },
        {
          name: "closeout-commit",
          description: "Close out uncommitted changes.",
        },
        {
          name: "closeout-phase",
          description: "Close out completed phases.",
        },
        {
          name: "decompose-codebase",
          description:
            "Plan and reverse-engineer repos into structured PRDs.",
        },
        {
          name: "work-on-wave",
          description: "Implement docs/work waves.",
        },
      ],
    );

    expect(skillSelection.selectedSkillNames).toEqual(["decompose-codebase"]);
    expect(skillSelection.promptOptions).toEqual([
      {
        value: "archive-docs",
        label: "archive-docs",
        hint: "Relationship-aware archival.",
        disabled: false,
        rowKind: "skill",
      },
      {
        value: "cleanup-docs",
        label: "cleanup-docs",
        hint: "Clean Markdown docs formatting drift.",
        disabled: false,
        rowKind: "skill",
      },
      {
        value: "closeout-commit",
        label: "closeout-commit",
        hint: "Close out uncommitted changes.",
        disabled: false,
        rowKind: "skill",
      },
      {
        value: "closeout-phase",
        label: "closeout-phase",
        hint: "Close out completed phases.",
        disabled: false,
        rowKind: "skill",
      },
      {
        value: "decompose-codebase",
        label: "decompose-codebase",
        hint: "Plan and reverse-engineer repos into structured PRDs.",
        disabled: false,
        rowKind: "skill",
      },
      {
        value: "work-on-wave",
        label: "work-on-wave",
        hint: "Implement docs/work waves.",
        disabled: false,
        rowKind: "skill",
      },
    ]);
  });

  test("skips the skill prompt when there are no recommended skills", () => {
    const skillSelection = buildSkillSelectionState(
      {
        skills: true,
        skillScope: "project",
        selectedSkills: [],
      },
      [],
    );

    expect(shouldPromptForSkillSelection(skillSelection)).toBe(false);
    expect(skillSelection.selectedSkillNames).toEqual([]);
  });

  test("renders harnesses and skill scope in the review summary", () => {
    const selections = defaultSelections();
    selections.skillScope = "global";
    selections.selectedSkills = ["decompose-codebase"];

    const summary = renderWizardReviewSummary(selections);

    expect(summary).toContain("- Harnesses: Claude Code and Codex");
    expect(summary).toContain("- Skills: Yes (global)");
    expect(summary).toContain("- Selected skills: decompose-codebase");
    expect(summary).not.toContain("- Optional skills:");
    expect(summary).not.toContain("- Agents:");
  });

  test("renders harness options and applies harness selections", async () => {
    const renderer = new MockWizardRenderer(
      [["designs", "plans", "prd", "work"]],
      [["claude-code"]],
      [
        {
          skills: false,
          skillScope: "project",
          selectedSkills: [],
        },
      ],
      ["apply"],
    );

    const result = await runSelectionWizardWithRenderer(renderer, {
      initialSelections: defaultSelections(),
      introTitle: "Configure make-docs",
    });

    expect(renderer.seenHarnessStates[0]?.options).toEqual([
      {
        value: "claude-code",
        label: "Claude Code",
        hint: "CLAUDE.md + .claude/",
      },
      {
        value: "codex",
        label: "Codex",
        hint: "AGENTS.md + .agents/",
      },
    ]);
    expect(result?.harnesses).toEqual({
      "claude-code": true,
      codex: false,
    });
  });

  test("renders skill scope options and applies the chosen scope", async () => {
    const renderer = new MockWizardRenderer(
      [["designs", "plans", "prd", "work"]],
      [["claude-code", "codex"]],
      [
        {
          skills: true,
          skillScope: "global",
          selectedSkills: ["decompose-codebase"],
        },
      ],
      ["apply"],
    );

    const result = await runSelectionWizardWithRenderer(renderer, {
      initialSelections: defaultSelections(),
      introTitle: "Configure make-docs",
    });

    expect(renderer.seenOptionStates[0]?.skillScopeOptions).toEqual([
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
    ]);
    expect(renderer.seenOptionStates[0]?.skillSelection.skills).toEqual([
      {
        name: "archive-docs",
        description:
          "Relationship-aware archival, staleness detection, deprecation, and impact analysis for docs/ artifacts.",
      },
      {
        name: "cleanup-docs",
        description:
          "Audit and clean Markdown docs formatting drift, hard-wrapped prose, list spacing, and document-contract issues.",
      },
      {
        name: "closeout-commit",
        description:
          "Capture gaps, write history, and draft commit messages for uncommitted changes.",
      },
      {
        name: "closeout-phase",
        description:
          "Close out completed work backlog phases with checked tasks, acceptance evidence, guides, gap capture, history, and commit-message drafts.",
      },
      {
        name: "decompose-codebase",
        description: "Plan and reverse-engineer repos into structured PRDs.",
      },
      {
        name: "work-on-wave",
        description:
          "Work on docs/work waves through implementation, validation, closeout, and phase commits.",
      },
    ]);
    expect(result?.skillScope).toBe("global");
    expect(result?.selectedSkills).toEqual(["decompose-codebase"]);
  });

  test("allows the wizard to continue with every skill deselected", async () => {
    const renderer = new MockWizardRenderer(
      [["designs", "plans", "prd", "work"]],
      [["claude-code", "codex"]],
      [
        {
          skills: true,
          skillScope: "project",
          selectedSkills: [],
        },
      ],
      ["apply"],
    );

    const result = await runSelectionWizardWithRenderer(renderer, {
      initialSelections: defaultSelections(),
      introTitle: "Configure make-docs",
    });

    expect(
      renderer.seenOptionStates[0]?.skillSelection.selectedSkillNames,
    ).toEqual([
      "archive-docs",
      "cleanup-docs",
      "closeout-commit",
      "closeout-phase",
      "decompose-codebase",
      "work-on-wave",
    ]);
    expect(result?.skills).toBe(true);
    expect(result?.selectedSkills).toEqual([]);
  });

  test("re-prompts harness selection when all harnesses are deselected", async () => {
    const renderer = new MockWizardRenderer(
      [["designs", "plans", "prd", "work"]],
      [[], ["codex"]],
      [
        {
          skills: false,
          skillScope: "project",
          selectedSkills: [],
        },
      ],
      ["apply"],
    );

    const result = await runSelectionWizardWithRenderer(renderer, {
      initialSelections: defaultSelections(),
      introTitle: "Configure make-docs",
    });

    expect(renderer.seenHarnessStates).toHaveLength(2);
    expect(result?.harnesses).toEqual({
      "claude-code": false,
      codex: true,
    });
  });

  test("supports editing options from the review step before applying", async () => {
    const renderer = new MockWizardRenderer(
      [["designs", "plans", "prd", "work"]],
      [["claude-code", "codex"]],
      [
        {
          skills: true,
          skillScope: "project",
          selectedSkills: [],
        },
        {
          skills: true,
          skillScope: "global",
          selectedSkills: ["decompose-codebase"],
        },
      ],
      ["edit-options", "apply"],
    );

    const result = await runSelectionWizardWithRenderer(renderer, {
      initialSelections: defaultSelections(),
      introTitle: "Configure make-docs",
    });

    expect(result).toMatchObject({
      skills: true,
      skillScope: "global",
      selectedSkills: ["decompose-codebase"],
    });
    expect(renderer.introTitles).toEqual(["Configure make-docs"]);
    expect(renderer.seenOptionStates).toHaveLength(2);
  });

  test("cancels when the renderer stops at the capability step", async () => {
    const renderer = new MockWizardRenderer([null], [], [], []);

    const result = await runSelectionWizardWithRenderer(renderer, {
      initialSelections: defaultSelections(),
      introTitle: "Configure make-docs",
    });

    expect(result).toBeNull();
  });
});

describe("promptForManagedFileConflictResolutions", () => {
  const conflicts = [
    managedFileConflict("docs/assets/templates/guide.md", "templates"),
    managedFileConflict("AGENTS.md", "agent-instructions"),
    managedFileConflict("docs/assets/references/style.md", "references"),
  ];

  test("returns an empty resolution map when there are no conflicts", async () => {
    const result = await promptForManagedFileConflictResolutions([]);

    expect(result).toEqual({});
    expect(clackMocks.select).not.toHaveBeenCalled();
  });

  test("maps every conflict path to overwrite when Overwrite all is selected", async () => {
    clackMocks.select.mockResolvedValue("overwrite-all");

    const result = await promptForManagedFileConflictResolutions(conflicts);

    expect(result).toEqual({
      "AGENTS.md": "overwrite",
      "docs/assets/references/style.md": "overwrite",
      "docs/assets/templates/guide.md": "overwrite",
    });
  });

  test("maps every conflict path to skip when Skip all is selected", async () => {
    clackMocks.select.mockResolvedValue("skip-all");

    const result = await promptForManagedFileConflictResolutions(conflicts);

    expect(result).toEqual({
      "AGENTS.md": "skip",
      "docs/assets/references/style.md": "skip",
      "docs/assets/templates/guide.md": "skip",
    });
  });

  test("prompts for a batch decision before review-each files in group order", async () => {
    clackMocks.select
      .mockResolvedValueOnce("review-each")
      .mockResolvedValueOnce("overwrite")
      .mockResolvedValueOnce("skip")
      .mockResolvedValueOnce("overwrite")
      .mockResolvedValueOnce("skip")
      .mockResolvedValueOnce("skip");

    const result = await promptForManagedFileConflictResolutions([
      managedFileConflict("docs/assets/templates/zeta.md", "templates"),
      managedFileConflict("docs/assets/references/bravo.md", "references"),
      managedFileConflict("docs/assets/templates/alpha.md", "templates"),
      managedFileConflict("AGENTS.md", "agent-instructions"),
      managedFileConflict("docs/assets/references/alpha.md", "references"),
    ]);

    expect(
      clackMocks.select.mock.calls.map(([options]) => options.message),
    ).toEqual([
      "How should make-docs handle these existing files?",
      "How should make-docs handle AGENTS.md?",
      "How should make-docs handle docs/assets/references/alpha.md?",
      "How should make-docs handle docs/assets/references/bravo.md?",
      "How should make-docs handle docs/assets/templates/alpha.md?",
      "How should make-docs handle docs/assets/templates/zeta.md?",
    ]);
    expect(result).toEqual({
      "AGENTS.md": "overwrite",
      "docs/assets/references/alpha.md": "skip",
      "docs/assets/references/bravo.md": "overwrite",
      "docs/assets/templates/alpha.md": "skip",
      "docs/assets/templates/zeta.md": "skip",
    });
  });

  test("renders conflict summary, group boundaries, and per-file progress notes", async () => {
    clackMocks.select
      .mockResolvedValueOnce("review-each")
      .mockResolvedValueOnce("skip")
      .mockResolvedValueOnce("skip")
      .mockResolvedValueOnce("skip")
      .mockResolvedValueOnce("skip")
      .mockResolvedValueOnce("skip");

    await promptForManagedFileConflictResolutions([
      managedFileConflict("docs/assets/templates/zeta.md", "templates"),
      managedFileConflict("docs/assets/references/bravo.md", "references"),
      managedFileConflict("docs/assets/templates/alpha.md", "templates"),
      managedFileConflict("AGENTS.md", "agent-instructions"),
      managedFileConflict("docs/assets/references/alpha.md", "references"),
    ]);

    const [summaryMessage, summaryTitle] = clackMocks.note.mock.calls[0] ?? [];

    expect(summaryTitle).toBe("Resolve managed file conflicts");
    expect(summaryMessage).toContain(
      "make-docs found 5 existing managed files with content that differs from make-docs.",
    );
    expect(summaryMessage).toContain("Agent instructions: 1");
    expect(summaryMessage).toContain("References: 2");
    expect(summaryMessage).toContain("Templates: 2");
    expect(summaryMessage).toContain(
      "Review order: agent instructions, references, templates.",
    );

    const groupBoundaryNotes = clackMocks.note.mock.calls
      .slice(1)
      .filter(([message]) => String(message).endsWith("to review."));

    expect(groupBoundaryNotes).toEqual([
      ["1 file to review.", expect.stringContaining("Agent instructions")],
      ["2 files to review.", expect.stringContaining("References")],
      ["2 files to review.", expect.stringContaining("Templates")],
    ]);

    const fileProgressNotes = clackMocks.note.mock.calls
      .filter(([, title]) => title === "Existing managed file")
      .map(([message]) => message);

    expect(fileProgressNotes).toEqual([
      [
        "Group: Agent instructions",
        "Path: AGENTS.md",
        "Conflict: local content differs",
        "File 1 of 5",
      ].join("\n"),
      [
        "Group: References",
        "Path: docs/assets/references/alpha.md",
        "Conflict: local content differs",
        "File 2 of 5",
      ].join("\n"),
      [
        "Group: References",
        "Path: docs/assets/references/bravo.md",
        "Conflict: local content differs",
        "File 3 of 5",
      ].join("\n"),
      [
        "Group: Templates",
        "Path: docs/assets/templates/alpha.md",
        "Conflict: local content differs",
        "File 4 of 5",
      ].join("\n"),
      [
        "Group: Templates",
        "Path: docs/assets/templates/zeta.md",
        "Conflict: local content differs",
        "File 5 of 5",
      ].join("\n"),
    ]);
  });

  test("returns null when the batch prompt is cancelled", async () => {
    clackMocks.select.mockResolvedValue(cancelPrompt);

    const result = await promptForManagedFileConflictResolutions(conflicts);

    expect(result).toBeNull();
    expect(clackMocks.select).toHaveBeenCalledTimes(1);
  });

  test("returns null without a partial map when per-file review is cancelled", async () => {
    clackMocks.select
      .mockResolvedValueOnce("review-each")
      .mockResolvedValueOnce("overwrite")
      .mockResolvedValueOnce(cancelPrompt);

    const result = await promptForManagedFileConflictResolutions(conflicts);

    expect(result).toBeNull();
    expect(clackMocks.select).toHaveBeenCalledTimes(3);
  });

  test("uses expected batch choices and no conflict-review option label is Update", async () => {
    clackMocks.select
      .mockResolvedValueOnce("review-each")
      .mockResolvedValueOnce("overwrite")
      .mockResolvedValueOnce("skip")
      .mockResolvedValueOnce("skip");

    await promptForManagedFileConflictResolutions(conflicts);

    const firstSelectOptions = clackMocks.select.mock.calls[0]?.[0];

    expect(firstSelectOptions?.message).toBe(
      "How should make-docs handle these existing files?",
    );
    expect(firstSelectOptions?.options).toEqual([
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
    ]);
    expect(
      clackMocks.select.mock.calls.flatMap(
        ([options]) => options.options?.map((option) => option.label) ?? [],
      ),
    ).not.toContain("Update");
  });
});
