---
title: Skills Catalog and Distribution Model
path: skills
status: draft
order: 10
tags:
  - skills
  - registry
  - distribution
  - harness
applies-to:
  - cli
  - skills
related:
  - ../user/skills-installing-and-managing-skills.md
  - ../user/skills-decomposing-an-existing-codebase.md
---

# Skills Catalog and Distribution Model

This guide explains the current shipped skills system from a maintainer point of view: where the catalog lives, how required and optional skills are defined, how the CLI resolves project versus global scope, and how skills-only planning and apply differ from the rest of the installation lifecycle.

## Registry ownership

The shipped skill inventory is defined in `packages/cli/skill-registry.json`.

Each registry entry defines:

- the skill name
- the source location
- the install entrypoint
- whether the skill is required
- a short description
- any extra assets that must be installed alongside the skill

The CLI loads and validates that registry at runtime through `packages/cli/src/skill-registry.ts`.

## Current shipped catalog

The current catalog has two entries:

| Skill | Required | Purpose |
| --- | --- | --- |
| `archive-docs` | yes | Relationship-aware archival, staleness detection, deprecation, and archive impact analysis for `docs/` artifacts |
| `decompose-codebase` | no | Reverse-engineer an existing repository into a structured PRD set and rebuild backlog |

`archive-docs` is the default required skill and therefore part of the standard skills-enabled installation profile.

## Required and optional skill grouping

The grouping model is simple:

- required skills come from `getRequiredSkills(...)`
- optional skills come from `getOptionalSkills(...)`

That split drives both the interactive skills UI and the non-interactive command surface.

Required skills are installed whenever skills are enabled. Optional skills are installed only when selected in the manifest-backed `optionalSkills` list.

## Harness targets

Skill installation is harness-aware. The current install roots are:

| Harness | Install root |
| --- | --- |
| Claude Code | `.claude/skills` |
| Codex | `.agents/skills` |

The catalog builder resolves skill assets per harness, so a single registry entry can produce the correct installed layout for either or both harnesses.

Maintainers should treat harness layout as a catalog concern, not as ad hoc guide logic.

## Scope rules

The current model supports two scopes:

| Scope | Install root base |
| --- | --- |
| `project` | the target repository |
| `global` | the current user's home directory |

The CLI resolves the base install root from `skillScope` and then applies the harness-specific path under that base.

Implications:

- project scope keeps skills versioned with the repo
- global scope keeps skills available across repositories
- scope affects only skill-managed assets, not the rest of the docs template

## Skills-only planning and apply behavior

Skills are not maintained exclusively through full reconfigure flows. The dedicated `make-docs skills` command exists so users can change only the skills portion of the install.

From the implementation side, the skills command:

- loads the current manifest
- resolves the next `InstallSelections` state for skills only
- plans asset additions, updates, and removals for skills and skill assets
- applies those changes without requiring a full docs-capability reconfigure

This is why the user and developer guides stay distinct:

- the user guide explains when to run `make-docs skills`
- this guide explains why the registry, selection model, and per-harness asset mapping behave the way they do

## `archive-docs` as the default shipped skill

`archive-docs` is the required baseline entry in the current catalog.

It ships with:

- `SKILL.md` as the entrypoint
- harness metadata under `agents/`
- shared references
- helper scripts used by the skill workflow

Because it is required, changes to `archive-docs` have packaging impact on every skills-enabled install. Treat it as part of the default distribution contract, not as an optional extension.

## `decompose-codebase` as an optional distributed skill

`decompose-codebase` is intentionally optional because it serves a narrower workflow than the default docs-maintenance baseline.

Its distributed payload includes:

- the skill entrypoint
- planning and execution workflow references
- MCP guidance
- output contract references
- templates and helper scripts used during decomposition work

When maintainers change that skill, they should validate both catalog metadata and the installed asset set rather than assuming the entrypoint alone is enough.

## Maintainer guidance

When updating the skills model:

- change `packages/cli/skill-registry.json` first when the shipped inventory changes
- keep registry descriptions aligned with the actual skill contract
- verify both harness roots when adding assets
- verify project and global scope behavior when changing install paths
- keep user-facing skill lifecycle guidance in `docs/guides/user/skills-*.md`, not in CLI lifecycle guides

## Troubleshooting

### A skill exists on disk but is not behaving like a shipped catalog entry

Check the registry first. The catalog, not the presence of a directory alone, defines shipped distribution behavior.

### A skill change worked for one harness but not the other

Review the per-harness install paths and asset mapping produced by the skill catalog builder.

### A user needs to manage only skills, not the full install

Point them to the dedicated `make-docs skills` workflow instead of the broader install lifecycle.

