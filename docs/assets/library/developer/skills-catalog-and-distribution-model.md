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
  - ./development-workflows-choosing-the-right-route.md
  - ./maintainer-dogfood-and-maintainer-operations.md
  - ./release-packaging-validation-and-release-reference.md
  - ../user/skills-installing-and-managing-skills.md
  - ../user/skills-decomposing-an-existing-codebase.md
  - ../../references/execution-workflow.md
  - ../../../work/AGENTS.md
  - ../../../prd/08-skills-catalog-and-distribution.md
---

# Skills Catalog and Distribution Model

This guide explains the current shipped skills system from a maintainer point of view: where the catalog lives, how purpose-led selected skills are defined, how the CLI resolves project versus global scope, and how skills-only planning and apply differ from the rest of the installation lifecycle.

## Registry ownership

The shipped skill inventory is defined in `packages/cli/skill-registry.json`.

The first-party registry is a skills manifest. It defines:

- the manifest id, display name, and source policy
- canonical purpose ids with labels, ordering, and provenance
- skill names, display names, source locations, and install entrypoints
- supported harnesses for each skill
- skill provenance
- any extra assets that must be installed alongside the skill

The CLI loads and validates the packaged manifest at runtime through `packages/cli/src/skill-registry.ts`. Runs may also provide an explicit local manifest with `--skill-manifest`; local manifest paths are validated with the same schema and normalized into file sources before planning.

Remote manifests and remote skill payloads are intentionally policy-gated. Non-first-party manifests cannot install remote skill payloads unless the skill provenance is `remote-pinned` and includes an immutable ref plus digest. Unpinned remote manifest inputs stop before install state is written.

## Current shipped catalog

The current first-party catalog has three entries:

| Skill | Purpose |
| --- | --- |
| `archive-docs` | Archive management |
| `decompose-codebase` | Codebase decomposition and plan creation |
| `cleanup-docs` | Documentation maintenance |

The canonical purpose registry still declares the `lifecycle-closeout` and `workflow-execution` purposes, but no shipped skill occupies them: the four former lifecycle skills (`closeout-commit`, `closeout-phase`, `work-on-phase`, `work-on-wave`) were withdrawn from the catalog after they were found instructing the removed `make-docs operations` command surface, and their regeneration is owned by the agentics production pipeline lineage.

`all` expands against the effective manifest for the current run, so a local alternate manifest can replace this set without changing the packaged first-party catalog.

## Purpose-led selected-skill grouping

The grouping model is purpose-led and explicit:

- purpose metadata explains why a skill may be useful
- `selectedSkills` stores the concrete skill names that should be installed
- bare default installs keep `selectedSkills` empty and write no skill files

Purpose metadata drives selection presentation, but it does not make a skill required. A skills-enabled run installs only the skills named in the resolved selected-skill set for the effective manifest.

## Harness targets

Skill installation is harness-aware, but authoritative skill payloads are not duplicated into each harness root. The current selected-skill install roots are:

| Surface | Project-scope root | Global-scope root |
| --- | --- | --- |
| Canonical shared payload | `.make-docs/agentics/skills/<skill-name>/` | `$HOME/.make-docs/agentics/skills/<skill-name>/` |
| Claude Code generated stub | `.claude/skills/<skill-name>/SKILL.md` | `$HOME/.claude/skills/<skill-name>/SKILL.md` |
| Codex generated stub | `.agents/skills/<skill-name>/SKILL.md` | `$HOME/.agents/skills/<skill-name>/SKILL.md` |

The catalog builder resolves each selected skill payload once per scope, then generates a text entrypoint stub for each selected and supported harness. The stub names the canonical payload path, source/provenance, purpose summary, and deterministic operation guidance. Symlinks are not required.

Maintainers should treat harness layout as a catalog concern, not as ad hoc guide logic.

## Scope rules

The current model supports two scopes:

| Scope | Install root base |
| --- | --- |
| `project` | the target repository |
| `global` | the current user's home directory |

The CLI resolves the base install root from `skillScope` and then applies the harness-specific path under that base.

Implications:

- project scope keeps shared skill payloads and harness stubs versioned with the repo
- global scope keeps shared skill payloads and harness stubs available across repositories
- scope affects only skill-managed assets, not the rest of the docs template

## Skills-only planning and apply behavior

Skills are not maintained exclusively through full reconfigure flows. The dedicated `make-docs setup skills` command exists so users can change only the skills portion of the install.

From the implementation side, the skills command:

- loads the current manifest
- resolves the next `InstallSelections` state for skills only
- plans additions, updates, and removals for shared skill payloads and generated harness stubs
- annotates planned skill operations and audit records as shared payloads, generated harness stubs, or legacy duplicated payloads
- applies those changes without requiring a full docs-capability reconfigure

Clean manifest-owned installs from the older per-harness duplicated payload shape may be migrated into the shared payload plus generated-stub shape. Modified files, custom user skills, malformed state, and ambiguous missing-manifest roots remain review or preservation cases rather than path-name based ownership guesses.

This is why the user and developer guides stay distinct:

- the user guide explains when to run `make-docs setup skills`
- this guide explains why the registry, selection model, and per-harness asset mapping behave the way they do

## `archive-docs` as a first-party selectable skill

`archive-docs` is a first-party entry in the current catalog.

It ships with:

- `SKILL.md` as the canonical shared payload entrypoint
- harness metadata under `agents/`
- shared references
- helper scripts used by the skill workflow

Changes to `archive-docs` have packaging impact when the skill is selected explicitly or through `all`. They must not make bare default installs write shared payloads or harness stubs.

## `decompose-codebase` as a first-party selectable skill

`decompose-codebase` serves a narrower workflow than the default docs-maintenance baseline, so users select it explicitly when they need that workflow.

Its distributed payload includes:

- the skill entrypoint
- planning and execution workflow references
- MCP guidance
- output contract references
- templates and helper scripts used during decomposition work

When maintainers change that skill, they should validate both catalog metadata and the installed asset set rather than assuming the entrypoint alone is enough.

For source-authority questions inside the `make-docs` repository, the distributed `decompose-codebase` files are projections. Live repo contracts and accepted lifecycle artifacts decide backlog structure first; skill-local references and templates exist so installed skill copies remain self-contained when those live contracts are unavailable or when the task explicitly concerns the installed skill package.

## Maintainer guidance

When updating the skills model:

- change `packages/cli/skill-registry.json` first when the shipped inventory changes
- keep registry descriptions aligned with the actual skill contract
- keep purpose ids stable once shipped; add new purpose ids only when the existing purpose vocabulary cannot accurately describe the skill
- require supported harness and provenance metadata for every skill
- keep bundled skill references aligned with live repo contracts without treating them as the primary source for make-docs-owned backlog shape
- verify the shared payload root and both generated harness stubs when adding assets
- verify project and global scope behavior when changing install paths
- verify alternate local manifest behavior when changing registry validation or selection planning
- keep user-facing skill lifecycle guidance in `docs/assets/library/user/skills-*.md`, not in CLI lifecycle guides

## Troubleshooting

### A skill exists on disk but is not behaving like a shipped catalog entry

Check the registry first. The catalog, not the presence of a directory alone, defines shipped distribution behavior.

### A skill change worked for one harness but not the other

Review the shared payload path, generated harness stubs, and asset mapping produced by the skill catalog builder.

### A dry-run reports legacy duplicated payloads

Treat those paths as migration evidence from the older per-harness payload layout. Clean manifest-owned files can migrate automatically; modified or ambiguous files need review before make-docs removes or rewrites them.

### A user needs to manage only skills, not the full install

Point them to the dedicated `make-docs setup skills` workflow instead of the broader install lifecycle.
