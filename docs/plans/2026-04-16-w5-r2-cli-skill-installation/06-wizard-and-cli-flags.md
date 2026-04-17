# Phase 6 — Wizard Harness Step, Skills+Scope Step, CLI Flags, Backward-Compat Aliases

## Objective

Restructure the wizard flow to add a harness selection step and a skills+scope step, remove instruction-kinds from the options step, and update the CLI flags with new names and backward-compatible aliases. The wizard flow changes from:

> Implemented divergence: the shipped CLI kept the harness-first wizard but finalized on canonical `--no-claude-code` / `--no-codex` flags, added `--no-skills`, `--skill-scope`, and `--optional-skills`, and retained the older names only as deprecated aliases. See the [updated design](../../designs/2026-04-16-cli-skill-installation-r2.md).

```
Capabilities -> Options (prompts, templates, references, instruction-kinds) -> Review
```

to:

```
Capabilities -> Harnesses (Claude Code / Codex) -> Options (prompts, templates, references) -> Skills (select skills, choose scope) -> Review
```

## Depends On

- Phase 1 (harness types, `Harness` const, `harnesses` and `skillScope` in `InstallSelections`)
- Phase 2 (registry must be loadable so the skills step has context)

Can run in parallel with Phases 3, 4, and 5.

## Files to Modify

| File | Change Summary |
| ---- | -------------- |
| `packages/cli/src/wizard.ts` | Add harness step, remove instruction-kinds from options step, add skills+scope step, update review summary. |
| `packages/cli/src/cli.ts` | Replace `--no-agents`/`--no-claude` with `--no-codex`/`--no-claude-code`, add `--no-skills` and `--skill-scope`, keep aliases, update `printHelp`. |

## Detailed Changes

### 1. `wizard.ts` — New harness step

Insert a new step between capabilities and options. Use a multiselect prompt with `"Claude Code"` and `"Codex"` as choices. At least one harness must be selected (validate and re-prompt if empty).

```ts
const harnessResult = await multiselect({
  message: "Which agent platforms will you use?",
  options: [
    { value: "claude-code", label: "Claude Code", hint: "CLAUDE.md + .claude/" },
    { value: "codex", label: "Codex", hint: "AGENTS.md + .agents/" },
  ],
  initialValues: HARNESSES.filter((h) => selections.harnesses[h]),
  required: true,
});
```

Map the result back to `selections.harnesses` by setting each harness key to `true` if it appears in the result array, `false` otherwise.

### 2. `wizard.ts` — Remove instruction-kinds from the options step

Remove the instruction-kinds multiselect prompt from `promptForOptions`. The `WizardOptionSelections` interface should no longer include `instructionKinds`. The options step now covers only prompts, templates mode, and references mode.

### 3. `wizard.ts` — New skills step

Add a new step after options. Two sequential prompts:

```ts
const installSkills = await confirm({
  message: "Install agent skills?",
  withGuide: true,
  initialValue: selections.skills,
  active: "Yes",
  inactive: "No",
});

if (installSkills) {
  const scopeResult = await select({
    message: "Skill installation scope?",
    options: [
      { value: "project", label: "Project", hint: "skills live in the repo" },
      { value: "global", label: "Global", hint: "skills live in ~/.claude or ~/.agents" },
    ],
    initialValue: selections.skillScope,
  });
  selections.skillScope = scopeResult;
}
selections.skills = installSkills;
```

If the user declines skills, skip the scope prompt and leave `skillScope` at its current value.

### 4. `wizard.ts` — Update review summary

In `renderWizardReviewSummary`, add lines for the new selections:

- **Harnesses**: list selected harness labels (e.g., `Claude Code, Codex` or `Claude Code`).
- **Skills**: `Yes (project)` / `Yes (global)` / `No`.

Remove the instruction-kinds line from the summary.

### 5. `cli.ts` — Replace flag names with backward-compat aliases

Update `ParsedArgs` and the `parseArgs` switch:

| New Flag | Old Alias | Effect |
| -------- | --------- | ------ |
| `--no-codex` | `--no-agents` | `selections.harnesses["codex"] = false` |
| `--no-claude-code` | `--no-claude` | `selections.harnesses["claude-code"] = false` |

Both the new name and the alias map to the same `ParsedArgs` field:

```ts
interface ParsedArgs {
  // ...existing fields...
  noClaudeCode: boolean;  // replaces noClaude
  noCodex: boolean;       // replaces noAgents
  noSkills: boolean;
  skillScope: "project" | "global" | undefined;
}
```

In `parseArgs`:

```ts
case "--no-claude-code":
case "--no-claude":        // backward-compat alias
  parsed.noClaudeCode = true;
  break;
case "--no-codex":
case "--no-agents":        // backward-compat alias
  parsed.noCodex = true;
  break;
case "--no-skills":
  parsed.noSkills = true;
  break;
case "--skill-scope":
  parsed.skillScope = args[++i] as "project" | "global";
  break;
```

### 6. `cli.ts` — resolveSelections

Apply the new parsed flags to selections:

```ts
if (parsed.noClaudeCode) selections.harnesses["claude-code"] = false;
if (parsed.noCodex) selections.harnesses["codex"] = false;
if (parsed.noSkills) selections.skills = false;
if (parsed.skillScope) selections.skillScope = parsed.skillScope;
```

Remove the old `noClaude` / `noAgents` application logic for `instructionKinds`.

### 7. `cli.ts` — hasSelectionOverrides

Add the new flags to the boolean-or expression:

```ts
return (
  parsed.noClaudeCode ||
  parsed.noCodex ||
  parsed.noSkills ||
  parsed.skillScope !== undefined ||
  // ...existing overrides...
);
```

### 8. `cli.ts` — printHelp

Update the help text to show the new flag names with alias notes:

```
Options:
  --no-claude-code   Skip Claude Code harness (alias: --no-claude)
  --no-codex         Skip Codex harness (alias: --no-agents)
  --no-skills        Skip skill installation
  --skill-scope <s>  Skill scope: project (default) or global
  ...existing flags...
```

## Parallelism

- All changes are within `wizard.ts` and `cli.ts` — no overlap with Phase 3 (catalog/renderers), Phase 4 (skill install pipeline), or Phase 5 (prepack).
- Can run in parallel with Phases 3, 4, and 5 once Phases 1 and 2 are complete.

## Acceptance Criteria

- [ ] Wizard flow follows: Capabilities -> Harnesses -> Options -> Skills -> Review.
- [ ] Harness step requires at least one selection.
- [ ] Instruction-kinds prompt is removed from the options step.
- [ ] Skills step prompts for install confirmation, then scope if accepted.
- [ ] Review summary displays harnesses, skills, and scope (no instruction-kinds).
- [ ] `--no-codex` disables the Codex harness; `--no-agents` works as an alias.
- [ ] `--no-claude-code` disables the Claude Code harness; `--no-claude` works as an alias.
- [ ] `--no-skills` disables skill installation.
- [ ] `--skill-scope project|global` sets the skill scope (default: project).
- [ ] `printHelp` documents all new flags and aliases.
- [ ] `npm run build -w starter-docs` succeeds with zero type errors.
- [ ] `npm test -w starter-docs` passes.
