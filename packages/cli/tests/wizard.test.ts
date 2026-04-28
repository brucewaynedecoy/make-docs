import { describe, expect, test } from "vitest";
import { defaultSelections } from "../src/profile";
import type { Capability, Harness } from "../src/types";
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
  renderWizardReviewSummary,
  runSelectionWizardWithRenderer,
  shouldPromptForSkillSelection,
} from "../src/wizard";

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
          name: "decompose-codebase",
          description:
            "Plan and reverse-engineer repos into structured PRDs.",
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
        value: "decompose-codebase",
        label: "decompose-codebase",
        hint: "Plan and reverse-engineer repos into structured PRDs.",
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
        name: "decompose-codebase",
        description: "Plan and reverse-engineer repos into structured PRDs.",
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
    ).toEqual(["archive-docs", "decompose-codebase"]);
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
