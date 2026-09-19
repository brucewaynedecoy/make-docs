import * as os from "node:os";
import path from "node:path";
import type { Harness, InstallSelections } from "./types";

const HARNESS_SKILL_DIRS: Record<Harness, string> = { "claude-code": ".claude/skills", codex: ".agents/skills" };

export function getCanonicalSkillDirectory(selections: InstallSelections): string {
  const tools = selections.skillHarnesses ?? selections.harnesses;
  return selections.skillScope === "project" && !tools.codex && tools["claude-code"]
    ? ".claude/skills" : ".agents/skills";
}

export function getHarnessSkillDirectory(harness: Harness, scope: InstallSelections["skillScope"], homeDir = os.homedir()): string {
  if (scope === "project") return HARNESS_SKILL_DIRS[harness];
  const configuredHome = harness === "codex" ? process.env.CODEX_HOME : process.env.CLAUDE_CONFIG_DIR;
  return path.join(configuredHome ? path.resolve(configuredHome) : path.join(homeDir, harness === "codex" ? ".codex" : ".claude"), "skills");
}
