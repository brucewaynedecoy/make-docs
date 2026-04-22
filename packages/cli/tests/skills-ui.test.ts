import { describe, expect, test } from "vitest";
import type { Harness, PlannedAction } from "../src/types";
import type {
  SkillsReviewAction,
  SkillsUiAction,
  SkillsUiRenderer,
  SkillsUiState,
} from "../src/skills-ui";
import {
  renderSkillsPlanSummary,
  runSkillsUiWithRenderer,
} from "../src/skills-ui";

class MockSkillsUiRenderer implements SkillsUiRenderer {
  public readonly introTitles: string[] = [];
  public readonly seenActionStates: Parameters<SkillsUiRenderer["chooseAction"]>[0][] = [];
  public readonly seenPlatformStates: Parameters<
    SkillsUiRenderer["chooseHarnesses"]
  >[0][] = [];
  public readonly seenScopeStates: Parameters<SkillsUiRenderer["chooseScope"]>[0][] = [];
  public readonly seenSkillStates: Parameters<
    SkillsUiRenderer["chooseOptionalSkills"]
  >[0][] = [];
  public readonly seenReviewStates: Parameters<SkillsUiRenderer["review"]>[0][] = [];

  constructor(
    private readonly actionAnswers: Array<SkillsUiAction | null>,
    private readonly harnessAnswers: Array<Harness[] | null>,
    private readonly scopeAnswers: Array<SkillsUiState["skillScope"] | null>,
    private readonly optionalSkillAnswers: Array<string[] | null>,
    private readonly reviewAnswers: SkillsReviewAction[],
  ) {}

  beginSession(title: string): void {
    this.introTitles.push(title);
  }

  async chooseAction(state: Parameters<SkillsUiRenderer["chooseAction"]>[0]) {
    this.seenActionStates.push(state);
    return this.actionAnswers.shift() ?? null;
  }

  async chooseHarnesses(state: Parameters<SkillsUiRenderer["chooseHarnesses"]>[0]) {
    this.seenPlatformStates.push(state);
    return this.harnessAnswers.shift() ?? null;
  }

  async chooseScope(state: Parameters<SkillsUiRenderer["chooseScope"]>[0]) {
    this.seenScopeStates.push(state);
    return this.scopeAnswers.shift() ?? null;
  }

  async chooseOptionalSkills(
    state: Parameters<SkillsUiRenderer["chooseOptionalSkills"]>[0],
  ) {
    this.seenSkillStates.push(state);
    return this.optionalSkillAnswers.shift() ?? null;
  }

  async review(state: Parameters<SkillsUiRenderer["review"]>[0]) {
    this.seenReviewStates.push(state);
    return this.reviewAnswers.shift() ?? "cancel";
  }
}

const initialState: SkillsUiState = {
  action: "sync",
  targetDir: "/tmp/project",
  harnesses: ["claude-code", "codex"],
  skillScope: "project",
  optionalSkills: [],
};

const sampleActions: PlannedAction[] = [
  {
    type: "create",
    relativePath: ".agents/skills/archive-docs/SKILL.md",
  },
  {
    type: "update",
    relativePath: ".claude/skills/decompose-codebase/SKILL.md",
  },
  {
    type: "noop",
    relativePath: ".claude/skills/archive-docs/SKILL.md",
  },
];

function buildReviewState(state: SkillsUiState) {
  return {
    state,
    summary: renderSkillsPlanSummary({
      state,
      actions: sampleActions,
      dryRun: false,
    }),
    actions:
      state.action === "sync"
        ? ([
            "apply",
            "edit-action",
            "edit-platforms",
            "edit-scope",
            "edit-skills",
            "cancel",
          ] as SkillsReviewAction[])
        : (["apply", "edit-action", "cancel"] as SkillsReviewAction[]),
  };
}

describe("skills-only UI", () => {
  test("drives the interactive sync flow with registry-backed skill choices", async () => {
    const renderer = new MockSkillsUiRenderer(
      ["sync"],
      [["codex"]],
      ["global"],
      [["decompose-codebase"]],
      ["apply"],
    );

    const result = await runSkillsUiWithRenderer(renderer, {
      initialState,
      introTitle: "Manage make-docs skills",
      buildReviewState,
    });

    expect(result).toEqual({
      action: "sync",
      targetDir: "/tmp/project",
      harnesses: ["codex"],
      skillScope: "global",
      optionalSkills: ["decompose-codebase"],
    });
    expect(renderer.introTitles).toEqual(["Manage make-docs skills"]);
    expect(renderer.seenPlatformStates[0]?.options).toEqual([
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
    expect(renderer.seenSkillStates[0]?.requiredSkills.map((skill) => skill.name)).toEqual([
      "archive-docs",
    ]);
    expect(renderer.seenSkillStates[0]?.optionalSkills.map((skill) => skill.name)).toEqual([
      "decompose-codebase",
    ]);
  });

  test("uses a concise removal flow without scope or optional skill prompts", async () => {
    const renderer = new MockSkillsUiRenderer(["remove"], [], [], [], ["apply"]);

    const result = await runSkillsUiWithRenderer(renderer, {
      initialState,
      introTitle: "Manage make-docs skills",
      buildReviewState,
    });

    expect(result?.action).toBe("remove");
    expect(renderer.seenPlatformStates).toHaveLength(0);
    expect(renderer.seenScopeStates).toHaveLength(0);
    expect(renderer.seenSkillStates).toHaveLength(0);
    expect(renderer.seenReviewStates[0]?.summary).toContain(
      "Removal scope: all manifest-tracked skill files",
    );
    expect(renderer.seenReviewStates[0]?.actions).toEqual([
      "apply",
      "edit-action",
      "cancel",
    ]);
  });

  test("supports editing prior sync screens from review", async () => {
    const renderer = new MockSkillsUiRenderer(
      ["sync"],
      [["codex"], ["claude-code", "codex"]],
      ["project", "global"],
      [[], ["decompose-codebase"]],
      ["edit-platforms", "apply"],
    );

    const result = await runSkillsUiWithRenderer(renderer, {
      initialState,
      introTitle: "Manage make-docs skills",
      buildReviewState,
    });

    expect(renderer.seenPlatformStates).toHaveLength(2);
    expect(renderer.seenReviewStates).toHaveLength(2);
    expect(result).toMatchObject({
      harnesses: ["claude-code", "codex"],
      skillScope: "global",
      optionalSkills: ["decompose-codebase"],
    });
  });

  test("cancels before returning an applyable state", async () => {
    const renderer = new MockSkillsUiRenderer(
      ["sync"],
      [["codex"]],
      ["project"],
      [[]],
      ["cancel"],
    );

    const result = await runSkillsUiWithRenderer(renderer, {
      initialState,
      introTitle: "Manage make-docs skills",
      buildReviewState,
    });

    expect(result).toBeNull();
  });

  test("renders only skill file operations in summaries", () => {
    const summary = renderSkillsPlanSummary({
      state: {
        ...initialState,
        optionalSkills: ["decompose-codebase"],
      },
      actions: sampleActions,
      dryRun: true,
    });

    expect(summary).toContain("Action: sync skills");
    expect(summary).toContain("Optional skills: decompose-codebase");
    expect(summary).toContain("Planned skill file operations:");
    expect(summary).toContain(".agents/skills/archive-docs/SKILL.md");
    expect(summary).toContain(".claude/skills/decompose-codebase/SKILL.md");
    expect(summary).not.toContain("docs/assets/prompts");
    expect(summary).not.toContain("templates");
    expect(summary).not.toContain("references");
  });
});
