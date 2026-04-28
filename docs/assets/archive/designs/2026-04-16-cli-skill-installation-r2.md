# CLI Skill Installation R2 — Remote Registry and Harness-Aware Skill Directories

## Purpose

Define the shipped `w5-r2` model for CLI-managed skill installation. The CLI should install documentation skills for Claude Code and Codex from a remote registry, preserve each skill as a directory-based unit, and let users manage harnesses, skill scope, and optional skills through both the interactive wizard and non-interactive flags.

## Context

The original `r2` direction corrected the earlier bundling approach, but the first written design and downstream plan/work docs still captured intermediate assumptions that did not survive implementation:

- registry entries using `local:` sources
- flattened skill outputs like `archive-docs-archive.md`
- projected support files under `skill-assets/`
- a selective prepack staging directory inside the published CLI
- `archive-docs` modeled as a plugin bundle instead of a single cross-harness skill

Implementation converged on a different shape because the actual requirements were narrower and cleaner:

1. The published CLI should ship a configurable registry, not bundled skill payloads.
2. `archive-docs` should be one installable skill with internal modes, not a harness-specific plugin abstraction.
3. Installed skills should keep their directory structure so references, scripts, and agent files stay colocated and work consistently across harnesses.
4. The interactive wizard and the non-interactive CLI must express the same harness and skill choices.

As a result, the design source of truth needs to be the final shipped behavior, while the `w5-r2` plan and work docs remain useful as historical execution artifacts.

## Decision

### 1. Remote-only skill registry

The CLI ships `packages/cli/skill-registry.json` as configuration. Registry entries point at public remote skill roots and declare the entrypoint plus any additional support files that must be installed.

Current shipped semantics:

- `archive-docs` is a required skill
- `decompose-codebase` is an optional skill
- registry `source` values are remote-only
- `local:` sources are not supported by the shipped registry model

Example shape:

```json
{
  "skills": [
    {
      "name": "archive-docs",
      "source": "https://github.com/brucewaynedecoy/make-docs/tree/main/packages/skills/archive-docs",
      "entryPoint": "SKILL.md",
      "installName": "archive-docs",
      "required": true,
      "description": "Relationship-aware archival, staleness detection, deprecation, and impact analysis for docs artifacts.",
      "assets": [
        {
          "source": "references/archive-workflow.md",
          "installPath": "references/archive-workflow.md"
        }
      ]
    }
  ]
}
```

Required skills are installed automatically whenever skills are enabled for a selected harness. Optional skills are the only entries surfaced as user choices.

### 2. Directory-based skill installation per harness and scope

Skills install as directories, not flattened markdown files.

| Harness | Project scope | Global scope | Instruction file |
| --- | --- | --- | --- |
| `claude-code` | `.claude/skills/<skill-name>/` | `~/.claude/skills/<skill-name>/` | `CLAUDE.md` |
| `codex` | `.agents/skills/<skill-name>/` | `~/.agents/skills/<skill-name>/` | `AGENTS.md` |

The CLI writes `SKILL.md` plus declared support files into the same installed skill directory. There is no parallel `skill-assets/` tree and no reference rewriting to a sibling asset directory. Relative references remain local to the installed skill folder.

This model applies to both shipped skills:

- `archive-docs` installs as one skill directory containing its root `SKILL.md`, shared workflow reference, tracing script, and agent YAML
- `decompose-codebase` installs as one skill directory containing its root `SKILL.md` plus the declared support files it depends on

### 3. `archive-docs` is a single skill, not a plugin

`archive-docs` is standardized on one root `SKILL.md` with internal routing for:

- `archive`
- `staleness-check`
- `deprecate`
- `archive-impact`

The skill explicitly identifies the detected mode before taking action. Shared materials such as `references/archive-workflow.md` and `scripts/trace_relationships.py` live alongside the root skill and are installed with it.

This intentionally avoids cross-harness plugin packaging for the current wave. Longer-term “agentics” packaging may still introduce plugins, hooks, MCP servers, or other installable types, but that is deferred beyond the shipped `w5-r2` behavior.

### 4. Harness-first UX with full headless parity

The CLI and wizard both operate on the same selection model:

- capabilities
- harnesses (`claude-code`, `codex`)
- prompts/templates/references
- skills enabled or disabled
- skill scope (`project` or `global`)
- optional skill selection

Canonical non-interactive flags:

| Flag | Meaning |
| --- | --- |
| `--no-claude-code` | Disable the Claude Code harness |
| `--no-codex` | Disable the Codex harness |
| `--no-skills` | Disable skill installation |
| `--skill-scope project|global` | Set skill installation scope |
| `--optional-skills <csv|none>` | Replace the optional skill set |

Backward-compat aliases are accepted but not documented as the primary interface:

- `--no-claude` → `--no-claude-code`
- `--no-agents` → `--no-codex`

The headless interface follows the same semantics as the wizard:

- disabling skills clears optional skill selections
- `--skill-scope` and `--optional-skills` imply `skills=true` when reconfiguring an install that previously had skills disabled
- required skills cannot be selected through `--optional-skills`

### 5. Published CLI ships registry metadata, not skill payloads

The npm package includes:

- the compiled CLI
- the docs template
- `skill-registry.json`
- `skill-registry.schema.json`

It does not include bundled skill directories or a staging copy of skills. The CLI resolves remote skill sources at install time.

The schema file exists so editor tooling and the packaged tarball can resolve the registry’s `$schema` reference. Runtime validation remains in the CLI code.

## Alternatives Considered

**Bundle skills in the CLI package.** Rejected because it duplicates source material, couples CLI publishing to skill contents, and prevents the registry from pointing at externally hosted skill roots.

**Keep `archive-docs` as a plugin abstraction.** Rejected for this wave because Claude Code and Codex do not share a single clean plugin runtime contract here, while one root skill works for both harnesses today.

**Flatten installed skills into one markdown file plus `skill-assets/`.** Rejected because it breaks the natural skill authoring layout, complicates reference rewriting, and makes shared files harder to reason about.

**Retain `local:` as a supported registry source.** Rejected in the shipped model because the public registry is intentionally remote-driven and there was no backward-compat requirement to preserve local-only registry entries.

## Consequences

### Benefits

- The published CLI stays small and configuration-driven.
- Skill source of truth remains the actual public skill folders.
- Claude Code and Codex receive the same logical skill package layout.
- `archive-docs` is simpler to author, install, and reason about as one skill.
- Interactive and headless installs now expose the same skill controls.

### Costs and constraints

- Skill installation now depends on remote source availability.
- Registry asset declarations must stay aligned with real skill dependencies.
- Historical `w5-r2` plan/work docs no longer exactly match implementation details.

### Operational rules

- The updated design doc is the living source of truth for this feature.
- The `w5-r2` plan and work docs remain historical execution artifacts and should be annotated when they materially diverge from shipped behavior.
- Future expansion beyond skills should happen as a new revision or follow-on design, not by reinterpreting this skill-centric `w5-r2` model.

## Design Lineage

- Update Mode: `updated-existing`
- Prior Design Docs: [2026-04-16-cli-skill-installation.md](2026-04-16-cli-skill-installation.md)
- Reason: the original `r2` effort was implemented through several requirement corrections. This document now reflects the final shipped behavior rather than the intermediate `local:`/plugin/`skill-assets` variants recorded in the initial revision materials.

## Intended Follow-On

- Route: `change-plan`
- Next Prompt: [designs-to-plan-change.prompt.md](../.prompts/designs-to-plan-change.prompt.md)
- Why: future work from here should be incremental to the shipped remote single-skill model, not a regeneration of the original `w5-r2` baseline plan.
