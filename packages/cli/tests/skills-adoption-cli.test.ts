import { existsSync, mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, expect, test, vi } from "vitest";
import { __setSkillsCommandRunnerForTests, runCli, validateMakeDocsCliArgv } from "../src/cli";

const roots: string[] = [];
const digest = "a".repeat(64);
afterEach(() => {
  __setSkillsCommandRunnerForTests(null);
  vi.restoreAllMocks();
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

test("forwards the exact adoption selection and digest without creating the target", async () => {
  const parent = mkdtempSync(path.join(os.tmpdir(), "make-docs-adoption-cli-")); roots.push(parent);
  const target = path.join(parent, "not-created");
  const run = vi.fn(async (_options: unknown) => {});
  __setSkillsCommandRunnerForTests(run);
  await runCli(["setup", "skills", "--target", target, "--selected-skills", "preflight,software-factory", "--adopt-existing", "preflight,software-factory", "--review", digest, "--yes", "--no-claude-code", "--skill-scope", "global"]);
  expect(run).toHaveBeenCalledWith({ targetDir: target, dryRun: false, yes: true, remove: false, noCodex: false, noClaudeCode: true, skillScope: "global", selectedSkills: ["preflight", "software-factory"], skillsManifest: undefined, adoptExisting: ["preflight", "software-factory"], review: digest });
  expect(existsSync(target)).toBe(false);
});

test.each([[], ["setup"], ["setup", "reconfigure"], ["setup", "backup"], ["setup", "remove"], ["update"], ["uninstall"], ["mcp"]].map(command => ({ command })))("rejects adoption flags outside setup skills: $command", async ({ command }) => {
  await expect(runCli([...command, "--adopt-existing", "preflight"])).rejects.toThrow();
  await expect(runCli([...command, "--review", digest])).rejects.toThrow();
});

test.each([
  ["--adopt-existing"],
  ["--adopt-existing", "all"],
  ["--adopt-existing", "none"],
  ["--adopt-existing", "preflight,,software-factory"],
  ["--adopt-existing", "../preflight"],
  ["--review", digest],
  ["--adopt-existing", "preflight", "--review", "short"],
  ["--adopt-existing", "preflight", "--review"],
  ["--adopt-existing", "preflight", "--remove"],
  ["--adopt-existing", "preflight", "--yes"],
].map(args => ({ args })))("refuses malformed or unreviewed adoption before dispatch: $args", async ({ args }) => {
  const run = vi.fn(async (_options: unknown) => {}); __setSkillsCommandRunnerForTests(run);
  await expect(runCli(["setup", "skills", ...args])).rejects.toThrow();
  expect(run).not.toHaveBeenCalled();
});

test("refuses unknown or explicitly unselected adoption names before dispatch", async () => {
  const run = vi.fn(async (_options: unknown) => {}); __setSkillsCommandRunnerForTests(run);
  await expect(runCli(["setup", "skills", "--adopt-existing", "unknown", "--dry-run"])).rejects.toThrow("Unknown adoption Skill");
  await expect(runCli(["setup", "skills", "--selected-skills", "preflight", "--adopt-existing", "software-factory", "--dry-run"])).rejects.toThrow("must be included");
  expect(run).not.toHaveBeenCalled();
});

test("allows a read-only preview with generic yes, but passes no apply review", async () => {
  const run = vi.fn(async (_options: unknown) => {}); __setSkillsCommandRunnerForTests(run);
  await runCli(["setup", "skills", "--selected-skills", "preflight", "--adopt-existing", "preflight", "--dry-run", "--yes"]);
  expect(run).toHaveBeenCalledWith(expect.objectContaining({ dryRun: true, adoptExisting: ["preflight"], yes: true }));
  expect(run.mock.calls[0]?.[0]).not.toHaveProperty("review");
});

test("documents the exact preview/apply path only in setup skills help", async () => {
  let output = "";
  vi.spyOn(process.stdout, "write").mockImplementation((chunk: any) => { output += chunk; return true; });
  await runCli(["setup", "skills", "--help"]);
  expect(output).toContain("--adopt-existing <csv>");
  expect(output).toContain("--review <digest>");
  expect(output).toContain("--yes alone is insufficient");
  expect(output).toContain("Use project paths or shared ~/.agents/skills with selected native tools.");
  expect(output).toContain("Project Codex-only uses .agents/skills; Claude-only uses .claude/skills.");
  expect(output).not.toContain("global Codex home");
  expect(output).toContain("Unknown extra files, unsafe links, conflicting copies, or another owner block adoption.");
  expect(output).toContain("Preserve existing content.");
  expect(output).toContain("A stale review cannot be applied.");
  expect(output).toContain("use its new --review digest");
  expect(output).toContain("A required Store failure stops managed writes.");
  expect(output).toContain("make-docs project state status");
  expect(output).toContain("Installation state has no project-local fallback.");
  expect(output).toContain("--selected-skills preflight --adopt-existing preflight --dry-run");
  expect(output).not.toContain("--json");
  output = "";
  await runCli(["setup", "--help"]);
  expect(output).not.toContain("--adopt-existing");
  expect(output).not.toContain("--review");
  // Existing project-layout review grammar remains with its own command parser.
  expect(() => validateMakeDocsCliArgv(["project", "layout", "prepare", "--review", digest])).not.toThrow();
});
