import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GIT_HOOK_NAMES } from "../src/git-hooks";
import type { InstallSelections } from "../src/types";
import { realPath } from "./git-hook-proof";
import { createHookFixture, hookFile, hookTexts, readPreference, type HookFixture } from "./git-hook-setup";

/**
 * W35 R0 P5 Stage 2 (T5 to T7): the interactive offer and the machine
 * preference question. The prompts are replaced by test answers, and each test
 * records the first choice that a prompt showed. Each run works in a temporary
 * repository, with a temporary Store and a temporary home folder.
 */

const confirmMock = vi.fn();
const selectMock = vi.fn();
const noteMock = vi.fn();
const runSelectionWizardMock = vi.fn();

vi.mock("@clack/prompts", async () => {
  const actual = await vi.importActual<typeof import("@clack/prompts")>("@clack/prompts");
  return { ...actual, confirm: confirmMock, select: selectMock, note: noteMock, isCancel: (value: unknown) => value === "cancelled" };
});

vi.mock("../src/wizard", () => ({
  runSelectionWizard: runSelectionWizardMock,
  promptForManagedFileConflictResolutions: vi.fn(),
}));

const PREFERENCE_QUESTION = "Install the Make Docs git hooks automatically in each new project on this computer?";
const HOOK_QUESTION = "Install these four Make Docs git hooks for this project?";
const NONE = { "post-commit": null, "post-merge": null, "post-rewrite": null, "post-checkout": null };

let fixture: HookFixture;
/** The answers of the person, by question. A question with no answer here gets "yes" for a confirm and "none" for a method. */
let answers: { preference?: "yes" | "no" | "cancelled"; hooks?: boolean };
/** The order of each review and each question, to prove that the review comes before the question and the write. */
let events: string[];

function setTTY(value: boolean): void {
  Object.defineProperty(process.stdin, "isTTY", { configurable: true, value });
  Object.defineProperty(process.stdout, "isTTY", { configurable: true, value });
}

beforeEach(() => {
  fixture = createHookFixture("make-docs-w35-p5-offer-");
  const home = path.join(fixture.proof.root, "home");
  vi.stubEnv("HOME", home);
  vi.stubEnv("USERPROFILE", home);
  vi.spyOn(os, "homedir").mockReturnValue(home);
  answers = {};
  events = [];
  confirmMock.mockReset();
  confirmMock.mockImplementation(async (options: { message: string; initialValue?: boolean }) => {
    events.push(`confirm:${options.message}`);
    return options.message === HOOK_QUESTION ? answers.hooks ?? false : true;
  });
  selectMock.mockReset();
  selectMock.mockImplementation(async (options: { message: string }) => {
    events.push(`select:${options.message}`);
    return options.message === PREFERENCE_QUESTION ? answers.preference ?? "cancelled" : "none";
  });
  noteMock.mockReset();
  noteMock.mockImplementation((_text: string, title: string) => { events.push(`note:${title}`); });
  runSelectionWizardMock.mockReset();
  // The wizard runs the machine step after the agent tool selection, and then gives back the selections.
  runSelectionWizardMock.mockImplementation(async (options: { initialSelections: InstallSelections; afterHarnessSelection?: (selections: InstallSelections) => Promise<boolean> }) => {
    await options.afterHarnessSelection?.(options.initialSelections);
    return options.initialSelections;
  });
  vi.spyOn(process.stdout, "write").mockImplementation(() => true);
  setTTY(true);
});

afterEach(() => {
  setTTY(false);
  fixture.cleanup();
});

async function run(argv: string[]): Promise<void> {
  const { runCli } = await import("../src/cli");
  await runCli(argv);
}

function questionOf(mock: typeof confirmMock, message: string): { message: string; initialValue?: unknown; options?: Array<{ value: string; label: string }> } | undefined {
  return mock.mock.calls.map((call) => call[0] as { message: string }).find((options) => options.message === message);
}

const PROJECT_ARGS = ["--no-codex", "--no-claude-code", "--no-skills"];

describe("W35 R0 P5 the machine preference question (T7; A53a)", () => {
  it("make-docs setup system asks the question with No first, and no answer leaves global config with no preference", async () => {
    const folder = fixture.proof.folder("machine-step");
    answers.preference = "cancelled";
    await run(["setup", "system", "--target", folder, "--no-codex", "--no-claude-code"]);
    const asked = questionOf(selectMock, PREFERENCE_QUESTION)!;
    expect(asked.initialValue).toBe("no");
    expect(asked.options!.map((option) => option.label)).toEqual(["No", "Yes"]);
    expect(readPreference(fixture)).toBeUndefined();

    // The person says yes. The review shows the change under "This computer", and the approval writes one value.
    answers.preference = "yes";
    selectMock.mockClear();
    noteMock.mockClear();
    await run(["setup", "system", "--target", folder, "--no-codex", "--no-claude-code"]);
    const review = noteMock.mock.calls.find((call) => call[1] === "This computer")![0] as string;
    expect(review).toContain("Git hooks for new projects: no answer, which means No -> Yes");
    expect(review).toContain("This change installs no hook in any project now.");
    expect(review).toContain("This preference never installs a hook that belongs to one agent tool.");
    expect(readPreference(fixture)).toBe(true);

    // The machine step shows the question again, with the current value first.
    answers.preference = "cancelled";
    selectMock.mockClear();
    await run(["setup", "system", "--target", folder, "--no-codex", "--no-claude-code"]);
    expect(questionOf(selectMock, PREFERENCE_QUESTION)!.initialValue).toBe("yes");
    expect(readPreference(fixture)).toBe(true);
  });
});

describe("W35 R0 P5 the interactive offer in project setup (T5; A52, A53, A53d, A53g)", () => {
  it("with no preference, the inline machine step asks the question, the offer has no first, and a run with no selection writes no hook", async () => {
    const repo = realPath(fixture.proof.repo("aurora"));
    answers.preference = "no";
    answers.hooks = false;
    await run(["setup", "--target", repo, ...PROJECT_ARGS]);
    expect(questionOf(selectMock, PREFERENCE_QUESTION)!.initialValue).toBe("no");
    expect(readPreference(fixture)).toBe(false);
    // The review shows each of the four hook paths and the exact block, before the question.
    const review = noteMock.mock.calls.find((call) => call[1] === "Git hooks")![0] as string;
    for (const name of GIT_HOOK_NAMES) {
      expect(review).toContain(hookFile(fixture.proof, repo, name));
      expect(review).toContain(`The exact block for ${name}:`);
      expect(review).toContain(`# >>> make-docs git hook: ${name} >>>`);
      expect(review).toContain(`# <<< make-docs git hook: ${name} <<<`);
    }
    expect(review).toContain("make-docs project checkpoint --event commit");
    expect(review).toContain("make-docs project checkpoint --event branch-change");
    expect(review).toContain("Limits:");
    expect(events.indexOf("note:Git hooks")).toBeLessThan(events.indexOf(`confirm:${HOOK_QUESTION}`));
    expect(questionOf(confirmMock, HOOK_QUESTION)!.initialValue).toBe(false);
    expect(hookTexts(fixture.proof, repo)).toEqual(NONE);
    expect(existsSync(path.join(repo, ".make-docs", "config.yaml"))).toBe(true);

    // The machine step does not ask again in a later project setup: global config holds the answer.
    selectMock.mockClear();
    const second = realPath(fixture.proof.repo("second"));
    await run(["setup", "--target", second, ...PROJECT_ARGS]);
    expect(questionOf(selectMock, PREFERENCE_QUESTION)).toBeUndefined();
  });

  it("with the preference on, the offer in a new project has yes first, and the person confirms it", async () => {
    const repo = realPath(fixture.proof.repo("aurora"));
    answers.preference = "yes";
    answers.hooks = true;
    await run(["setup", "--target", repo, ...PROJECT_ARGS]);
    expect(readPreference(fixture)).toBe(true);
    expect(questionOf(confirmMock, HOOK_QUESTION)!.initialValue).toBe(true);
    expect(Object.values(hookTexts(fixture.proof, repo)).every((text) => text !== null)).toBe(true);
    expect(events.indexOf("note:Git hooks")).toBeLessThan(events.indexOf(`confirm:${HOOK_QUESTION}`));
  });

  it("in an older project the offer has no first also with the preference on, and an explicit yes installs the hooks", async () => {
    const repo = realPath(fixture.proof.repo("aurora"));
    answers.preference = "yes";
    answers.hooks = false;
    await run(["setup", "--target", repo, ...PROJECT_ARGS]);
    expect(questionOf(confirmMock, HOOK_QUESTION)!.initialValue).toBe(true);
    expect(hookTexts(fixture.proof, repo)).toEqual(NONE);

    // The project is an older project now. The preference is on, and "no" is first.
    confirmMock.mockClear();
    answers.hooks = true;
    await run(["setup", "--target", repo, ...PROJECT_ARGS]);
    expect(readPreference(fixture)).toBe(true);
    expect(questionOf(confirmMock, HOOK_QUESTION)!.initialValue).toBe(false);
    expect(Object.values(hookTexts(fixture.proof, repo)).every((text) => text !== null)).toBe(true);
  });

  it("after the person turns the preference off, no is first again, and the hooks of a project that has them stay", async () => {
    const hooked = realPath(fixture.proof.repo("hooked"));
    answers.preference = "yes";
    answers.hooks = true;
    await run(["setup", "--target", hooked, ...PROJECT_ARGS]);
    const texts = hookTexts(fixture.proof, hooked);

    answers.preference = "no";
    await run(["setup", "system", "--target", fixture.proof.folder("machine-step"), "--no-codex", "--no-claude-code"]);
    expect(readPreference(fixture)).toBe(false);
    expect(hookTexts(fixture.proof, hooked)).toEqual(texts);

    confirmMock.mockClear();
    answers.hooks = false;
    const fresh = realPath(fixture.proof.repo("fresh"));
    await run(["setup", "--target", fresh, ...PROJECT_ARGS]);
    expect(questionOf(confirmMock, HOOK_QUESTION)!.initialValue).toBe(false);
    expect(hookTexts(fixture.proof, fresh)).toEqual(NONE);
    // A project that has the hooks gets no question: setup reports their state.
    confirmMock.mockClear();
    await run(["setup", "--target", hooked, ...PROJECT_ARGS]);
    expect(questionOf(confirmMock, HOOK_QUESTION)).toBeUndefined();
    expect(hookTexts(fixture.proof, hooked)).toEqual(texts);
  });

  it("an explicit hook input installs the hooks in an interactive setup with no question, and the no-hooks input asks nothing", async () => {
    const repo = realPath(fixture.proof.repo("aurora"));
    answers.preference = "no";
    await run(["setup", "--target", repo, ...PROJECT_ARGS, "--git-hooks"]);
    expect(questionOf(confirmMock, HOOK_QUESTION)).toBeUndefined();
    expect(noteMock.mock.calls.some((call) => call[1] === "Git hooks")).toBe(true);
    expect(Object.values(hookTexts(fixture.proof, repo)).every((text) => text !== null)).toBe(true);

    const skipped = realPath(fixture.proof.repo("skipped"));
    confirmMock.mockClear();
    await run(["setup", "--target", skipped, ...PROJECT_ARGS, "--no-git-hooks"]);
    expect(questionOf(confirmMock, HOOK_QUESTION)).toBeUndefined();
    expect(hookTexts(fixture.proof, skipped)).toEqual(NONE);
  });
});
