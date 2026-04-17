# CLI Skill Installation R2 — Harness-Aware, Registry-Based Skill Delivery

> Filename: `2026-04-16-cli-skill-installation-r2.md`. See `docs/.references/design-contract.md` for naming and structural rules.

## Purpose

Redesign the CLI's skill installation and agent-harness configuration model. Replace the instruction-kind selection ("which instruction files: AGENTS.md / CLAUDE.md?") with a harness selection ("which agent platforms: Claude Code / Codex?"), add a skill registry that lists available skills with configurable sources, and let users choose between global and project-scoped skill installation. This unifies three concerns — harness targeting, skill delivery, and install scope — into a single coherent flow.

## Context

### What R1 got wrong (bundling)

The R1 design proposed bundling `packages/skills/` into the CLI package at publish time. This was implemented and reverted because it duplicated files (including test files, `__pycache__`, agent YAMLs), didn't support external skill sources, and conflated the CLI with the skills it installs.

### What R1 got right (retained)

- `skills: boolean` in `InstallSelections` — gates skill installation regardless of delivery mechanism.
- `skillFiles?` in `InstallManifest` — tracks installed skills for update/reconfigure.
- The `structuredClone` refactor in `cloneSelections`.
- The `profileId` hash now includes `skills`.

### What the original R2 draft missed

The original R2 draft (now superseded by this rewrite) correctly introduced registry-based delivery and the `local:` protocol. However, it kept the old instruction-kind selection model and hardcoded `.claude/skills/` as the only install target. It did not address:

1. **Harness selection.** Users should choose which agent platforms to support (Claude Code, Codex, or both), not which instruction files to install. The CLI should derive instruction files from the harness choice — Claude Code needs `CLAUDE.md`, Codex needs `AGENTS.md`, selecting both installs both.
2. **Install scope.** Skills can be installed globally (`~/.claude/skills/`, `~/.agents/skills/`) or per-project (`./.claude/skills/`, `./.agents/skills/`). The user should choose.
3. **Multi-harness install targets.** Each harness has its own skill directory. The CLI needs to install skills into the correct directory for each selected harness.

### Current wizard flow vs. proposed flow

**Current flow:**
```
Capabilities → Options (prompts, templates, references, instruction kinds: AGENTS.md / CLAUDE.md) → Review → Apply
```

**Proposed flow:**
```
Capabilities → Harnesses (Claude Code / Codex) → Options (prompts, templates, references) → Skills (select optional skills, choose scope) → Review → Apply
```

The instruction-kind multiselect is removed. The harness selection replaces it and determines which instruction files are installed.

## Decision

### 1. Harness selection model

Replace `instructionKinds: Record<InstructionKind, boolean>` with a harness-based model:

```ts
export type Harness = "claude-code" | "codex";
export const HARNESSES = ["claude-code", "codex"] as const;

export interface InstallSelections {
  capabilities: Record<Capability, boolean>;
  prompts: boolean;
  templatesMode: TemplatesMode;
  referencesMode: ReferencesMode;
  harnesses: Record<Harness, boolean>;  // replaces instructionKinds
  skills: boolean;
  skillScope: "project" | "global";
}
```

The mapping from harness to instruction files:

| Harness | Instruction file | Skill directory (project) | Skill directory (global) |
| --- | --- | --- | --- |
| `claude-code` | `CLAUDE.md` | `.claude/skills/` | `~/.claude/skills/` |
| `codex` | `AGENTS.md` | `.agents/skills/` | `~/.agents/skills/` |

When both harnesses are selected, both instruction files AND both skill directories are populated. This is additive — selecting Claude Code doesn't prevent Codex files from being installed, and vice versa.

### 2. Backward compatibility

The `instructionKinds` field in existing manifests maps cleanly:

- `"CLAUDE.md": true` → `harnesses: { "claude-code": true }`
- `"AGENTS.md": true` → `harnesses: { "codex": true }`

The manifest loader should handle both old (`instructionKinds`) and new (`harnesses`) schemas gracefully. When loading an old manifest, derive `harnesses` from `instructionKinds`.

### 3. Skill registry config

The registry model from the original R2 draft is retained. The `installTarget` field changes from a single path to a harness-relative path:

```json
{
  "skills": [
    {
      "name": "decompose-codebase",
      "source": "local:packages/skills/decompose-codebase",
      "entryPoint": "SKILL.md",
      "installName": "decompose-codebase.md",
      "required": false,
      "description": "Plan and reverse-engineer repos into structured PRDs.",
      "assets": []
    },
    {
      "name": "archive",
      "source": "local:packages/skills/archive-docs/skills/archive",
      "entryPoint": "SKILL.md",
      "installName": "archive-docs-archive.md",
      "required": false,
      "description": "Relationship-aware archival with 4 modes.",
      "plugin": "archive-docs",
      "assets": [
        {
          "source": "local:packages/skills/archive-docs/references/archive-workflow.md",
          "installPath": "archive-docs/references/archive-workflow.md"
        },
        {
          "source": "local:packages/skills/archive-docs/scripts/trace_relationships.py",
          "installPath": "archive-docs/scripts/trace_relationships.py"
        }
      ]
    }
  ]
}
```

Key change from original R2: `installTarget` (absolute path) is replaced by `installName` (filename only) and `installPath` (relative path for assets). The CLI computes the full install path at runtime based on the selected harness(es) and scope:

- Skill: `<scope-root>/<harness-skills-dir>/<installName>`
- Asset: `<scope-root>/<harness-skill-assets-dir>/<installPath>`

Where:
- `<scope-root>` is `.` for project scope or `~` for global scope
- `<harness-skills-dir>` is `.claude/skills/` or `.agents/skills/`
- `<harness-skill-assets-dir>` is `.claude/skill-assets/` or `.agents/skill-assets/`

### 4. Source protocol

Retained from original R2:

| Protocol | Format | Status |
| --- | --- | --- |
| `local:` | `local:<relative-path>` | Implemented (initial release) |
| `github:` | `github:<owner>/<repo>/<path>[@<ref>]` | Defined, deferred |
| `url:` | `url:<https://...>` | Defined, deferred |

### 5. Install logic

When skills are enabled (`selections.skills === true`), for each selected harness:

1. Load the skill registry.
2. Determine the install root based on scope: `.` (project) or `~` (global).
3. Determine the skills directory for the harness: `.claude/skills/` or `.agents/skills/`.
4. For each skill to install:
   a. Resolve the source via protocol handler.
   b. Read the entry point content.
   c. Rewrite relative references to point to the harness-specific asset location.
   d. Write to `<install-root>/<harness-skills-dir>/<installName>`.
5. For each declared asset:
   a. Read from source.
   b. Write to `<install-root>/<harness-skill-assets-dir>/<installPath>`.
6. Track installed files in `manifest.skillFiles` (keyed by harness + scope).

### 6. Selective prepack for publishing

Retained from original R2: the prepack script reads `skill-registry.json` and selectively copies only declared entry points and assets to a staging directory. No full-tree copying.

### 7. Wizard flow

The wizard gains a new step structure:

```
Step 1: Capabilities       (existing — designs, plans, prd, work)
Step 2: Harnesses          (NEW — Claude Code, Codex — multiselect, at least one required)
Step 3: Options            (existing minus instruction-kinds — prompts, templates, references)
Step 4: Skills             (NEW — select optional skills; choose project vs global scope)
Step 5: Review             (existing — updated to show harnesses, skills, scope)
```

**Step 2 — Harness selection:**
```
? Which agent platforms should be supported? (select at least one)
  ● Claude Code    — Claude-compatible instructions and skills (.claude/)
  ○ Codex          — OpenAI Codex instructions and skills (.agents/)
```

**Step 4 — Skills:**
```
? Install agent skills? (Y/n)
? Install skills globally or in this project?
  ● Project    — .claude/skills/ and/or .agents/skills/ in this project
  ○ Global     — ~/.claude/skills/ and/or ~/.agents/skills/ for all projects
```

### 8. CLI flags

Replace `--no-agents` and `--no-claude` with harness-specific flags:

| Old flag | New flag | Effect |
| --- | --- | --- |
| `--no-claude` | `--no-claude-code` | Skip Claude Code harness |
| `--no-agents` | `--no-codex` | Skip Codex harness |
| *(new)* | `--no-skills` | Skip skill installation |
| *(new)* | `--skill-scope project\|global` | Set skill install scope (default: `project`) |

The old flags (`--no-claude`, `--no-agents`) should be accepted as aliases for backward compatibility but mapped to the new harness model internally.

### 9. Instruction file derivation

The CLI no longer asks which instruction files to install. Instead, it derives them:

- Claude Code selected → install `CLAUDE.md` routers in all relevant directories
- Codex selected → install `AGENTS.md` routers in all relevant directories
- Both selected → install both (current default behavior)

The existing `addInstructionAssets` function in `catalog.ts` continues to work — it iterates over `INSTRUCTION_KINDS` and adds files per directory. The gating changes from `selections.instructionKinds[kind]` to a harness-derived check:

```ts
const activeInstructionKinds = new Set<InstructionKind>();
if (selections.harnesses["claude-code"]) activeInstructionKinds.add("CLAUDE.md");
if (selections.harnesses["codex"]) activeInstructionKinds.add("AGENTS.md");
```

### 10. Dogfood approach

For this project:

1. Run the CLI with both harnesses selected and project scope.
2. Claude Code skills install to `.claude/skills/`.
3. Codex skills install to `.agents/skills/`.
4. Instruction files (`CLAUDE.md` + `AGENTS.md`) install as today.
5. Open a new Claude Code session — skills are discoverable.

### 11. What changes from original R2

| Aspect | Original R2 | This rewrite |
| --- | --- | --- |
| Selection model | Instruction kinds (AGENTS.md / CLAUDE.md) | Harness selection (Claude Code / Codex) |
| Install scope | Project only | Project or global |
| Install targets | `.claude/skills/` only | Per-harness: `.claude/skills/`, `.agents/skills/` |
| Registry installTarget | Absolute path per skill | `installName` + runtime path computation |
| Wizard flow | Skills step only | Harness step + skills step with scope |
| CLI flags | `--no-skills` only | `--no-claude-code`, `--no-codex`, `--no-skills`, `--skill-scope` |
| Backward compat | None | Old `--no-claude`/`--no-agents` accepted as aliases |

## Alternatives Considered

**Keep instruction-kind selection and add skills alongside.** The user would still pick AGENTS.md/CLAUDE.md, then separately pick skills. Rejected because: instruction kinds are an implementation detail that users shouldn't think about. "Which platforms do you use?" is a much clearer question, and the instruction files follow logically.

**Always install skills for all harnesses regardless of selection.** If the user picks Claude Code only, still install into `.agents/skills/` in case they add Codex later. Rejected because: it creates unexpected directories and files in the project. The user should get exactly what they asked for.

**Default to global scope.** Skills are globally useful — install them in `~/.claude/skills/` by default. Rejected because: global installs affect all projects and are harder to version-control. Project scope is safer as a default; global is an explicit opt-in.

**Separate harness selection from the wizard into a config file.** A `.starter-docs-config.json` at the project root could declare target harnesses. Rejected for now because: the wizard flow is the right UX for first-time setup. A config file may be useful later for CI/headless use.

## Consequences

**What improves:**
- Users think in terms of platforms (Claude Code, Codex), not instruction files.
- Skills install into the correct harness-specific directory automatically.
- Global vs. project scope gives users control over how broadly skills are applied.
- Multi-harness support is first-class — selecting both installs everything for both.
- Backward compatibility with old manifests and CLI flags is maintained.

**What shifts:**
- `InstallSelections` replaces `instructionKinds` with `harnesses` and adds `skillScope`.
- The wizard gains a harness step and a skills+scope step.
- `addInstructionAssets` derives instruction kinds from harness selection.
- The skill registry's `installTarget` becomes harness-relative (`installName` + runtime computation).
- CLI argument parsing adds 4 new flags and 2 backward-compat aliases.
- Manifest schema evolves (harnesses field, backward-compat with instructionKinds).

**Risks:**
- **Manifest migration:** Old manifests with `instructionKinds` need to be handled. Mitigation: the loader derives `harnesses` from `instructionKinds` when the field is present. Clean migration path.
- **Global scope safety:** Installing to `~/.claude/skills/` affects all projects. Mitigation: global is never the default; it requires explicit selection in the wizard or `--skill-scope global`.
- **Codex directory convention:** `.agents/skills/` is our best understanding of Codex conventions, which are still evolving. Mitigation: the harness-to-directory mapping is a single config, easy to update.

**Deferred:**
- `github:` and `url:` protocol handlers.
- Per-skill selection in the wizard.
- Auto-generation of registry from `plugin.json` files.
- Additional harness targets (Cursor, Windsurf, Aider) — these can be added as new `Harness` values with their own directory mappings.

## Design Lineage

- Update Mode: `new-doc-related`
- Prior Design Docs: [2026-04-16-cli-skill-installation.md](2026-04-16-cli-skill-installation.md)
- Reason: R1's copy-based bundling was reverted. The original R2 draft introduced registry-based delivery but missed harness selection, install scope, and multi-target support. This rewrite incorporates all three alongside the registry model.

## Intended Follow-On

- Route: `baseline-plan`
- Next Prompt: [designs-to-plan.prompt.md](../.prompts/designs-to-plan.prompt.md)
- Why: The downstream plan should be `w5-r2` and should cover: registry creation, resolver, harness type system changes, instruction-kind-to-harness migration, skill catalog with multi-target support, wizard harness+skills steps, CLI flags, selective prepack, tests, and dogfood validation.
