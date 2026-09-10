---
title: Skills Catalog and Distribution Model
kind: guide
persona: maintainer
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
  - "development-workflows-choosing-the-right-route.md"
  - "maintainer-dogfood-and-maintainer-operations.md"
  - "release-packaging-validation-and-release-reference.md"
  - ../user/skills-installing-and-managing-skills.md
  - ../user/skills-decomposing-an-existing-codebase.md
  - "../../../.make-docs/system/references/execution-workflow.md"
  - "../../work/AGENTS.md"
  - "../../prd/08-skills-catalog-and-distribution.md"
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

The first-party catalog has seven entries. The CLI build embeds each complete declared payload from its sole source under `packages/skills/<name>/`; the installed CLI needs no network or maintainer checkout to install them.

| Skill | Purpose |
| --- | --- |
| `archive-docs` | Archive management |
| `decompose-codebase` | Codebase decomposition and plan creation |
| `cleanup-docs` | Documentation maintenance |
| `preflight` | Explicitly requested readiness review |
| `software-factory` | Explicitly requested implementation and review coordination |
| `human-experience` | Explicitly requested human experience review |
| `naive-uat` | Unassisted Goal Testing through the shared CLI workflow |

The former `closeout-commit`, `closeout-phase`, `work-on-phase`, and `work-on-wave` Skills remain retired. Installing preflight, software-factory, or human-experience does not invoke them or add a workflow gate. Each Skill can be installed alone; `naive-uat` delegates policy and state to the shared CLI workflow.

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
| Real Skill directory | Claude-only: `.claude/skills/<name>/`; Codex-only or both: `.agents/skills/<name>/` | `~/.agents/skills/<name>/` |
| Claude Code native exposure | `.claude/skills/<skill-name>/` | `$HOME/.claude/skills/<skill-name>/` |
| Codex native access | `.agents/skills/<skill-name>/` | `$HOME/.codex/skills/<skill-name>/` or configured `CODEX_HOME/skills/<skill-name>/` |

The catalog resolves each selected Skill once at the standard real directory. A matching native path uses it directly, never as a self-link. Additional selected access uses a directory link or supported full native copy. Project single-harness selection must not create the other harness's Skill root. The native `SKILL.md` is the real entrypoint. Generic generated stubs are legacy inputs, not the current exposure model.

Maintainers should treat harness layout as a catalog concern, not as ad hoc guide logic.

## Scope rules

The current model supports two scopes:

| Scope | Install root base |
| --- | --- |
| `project` | the target repository |
| `global` | the current user's home directory |

The CLI resolves the base install root from `skillScope` and then applies the harness-specific path under that base.

Implications:

- project scope keeps shared skill payloads and native harness exposures versioned with the repo
- global scope keeps shared skill payloads and native harness exposures available across repositories
- scope affects only skill-managed assets, not the rest of the docs template

## Skills-only planning and apply behavior

Skills are not maintained exclusively through full reconfigure flows. The dedicated `make-docs setup skills` command exists so users can change only the skills portion of the install.

From the implementation side, the skills command:

- loads installation ownership from the global Make Docs Store
- resolves the next `InstallSelections` state for skills only
- plans additions, updates, and removals for shared skill payloads and native harness exposures
- annotates planned skill operations and audit records as shared payloads, native harness exposures, or legacy duplicated payloads
- applies those changes without requiring a full docs-capability reconfigure

Clean Store-owned installs, including the wrong private `.make-docs/agentics/skills` layout, migrate through reviewed CLI changes into the standard scope/harness paths. Modified files, custom user skills, malformed state, and ambiguous missing-manifest roots remain review or preservation cases rather than path-name based ownership guesses.

This is why the user and maintainer guides stay distinct:

- the user guide explains when to run `make-docs setup skills`
- this guide explains why the registry, selection model, and per-harness asset mapping behave the way they do

## Reviewed adoption of existing copies

Use `make-docs setup skills --adopt-existing <csv>` when selected first-party copies already exist without managed ownership. Preview the same selected names and scope with `--dry-run`. Review exact files, differences, missing declared files, backups, native exposure, ownership changes, blockers, and digest. Noninteractive apply requires `--review <digest>`; `--yes` alone is not adoption authority.

Known-file differences can be reconciled only after review, with recoverable backups of replaced bytes. Unknown extra files, unsafe links, conflicting copies, and another recorded owner block adoption. Changed selection, source/package, scope/tools, inventory, or ownership invalidates the digest before writes. Names alone never prove ownership. Matching bytes still require a real Store ownership transition.

Required operation state and backup references stay in the global Store. Store failure stops managed writes. Use `make-docs project state status --target-root .` and its printed safe recovery action for a pending operation. Do not create a local receipt, edit Store rows, or copy files into managed roots by hand.

## `archive-docs` as a first-party selectable skill

`archive-docs` is a first-party entry in the current catalog.

It ships with:

- `SKILL.md` as the canonical shared payload entrypoint
- harness metadata under `agents/`
- shared references
- helper scripts used by the skill workflow

Changes to `archive-docs` have packaging impact when the skill is selected explicitly or through `all`. They must not make bare default installs write shared payloads or native harness exposures.

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

- author Skill content only under `packages/skills/<name>/` and update `packages/cli/skill-registry.json` when the declared inventory changes
- build directly from declared files into embedded CLI output; never create a separate copied Skill tree under `packages/cli` or `packages/docs`, even ignored or temporary mirrors
- inspect actual package disk paths, empty directories, and source/embedded/installed byte hashes; compiled output and genuine CLI-installed copies are allowed
- prove the extracted package offline before `just install-cli-pack`, then use the public installed CLI for reviewed maintainer adoption
- keep registry descriptions aligned with the actual skill contract
- keep purpose ids stable once shipped; add new purpose ids only when the existing purpose vocabulary cannot accurately describe the skill
- require supported harness and provenance metadata for every skill
- keep bundled skill references aligned with live repo contracts without treating them as the primary source for make-docs-owned backlog shape
- verify the shared payload root and both native harness exposures when adding assets
- verify project and global scope behavior when changing install paths
- verify alternate local manifest behavior when changing registry validation or selection planning
- keep user-facing skill lifecycle guidance in `docs/assets/user/skills-*.md`, not in CLI lifecycle guides

## Troubleshooting

### A skill exists on disk but is not behaving like a shipped catalog entry

Check the registry first. The catalog, not the presence of a directory alone, defines shipped distribution behavior.

### A skill change worked for one harness but not the other

Review the shared payload path, native harness exposures, and asset mapping produced by the skill catalog builder.

### A dry-run reports legacy duplicated payloads

Treat those paths as migration evidence from the older per-harness payload layout. Clean Store-owned files can migrate through the reviewed CLI lifecycle; modified or ambiguous files need review before make-docs removes or rewrites them.

### A user needs to manage only skills, not the full install

Point them to the dedicated `make-docs setup skills` workflow instead of the broader install lifecycle.

## Retired Private-Layout Upgrade

Wrong-private-layout cutover is forward-resume-only: review must state before apply that rollback would recreate the forbidden private layer and is not offered. Ordinary adoption already using standard locations keeps normal resume/rollback. Older saved operations that would write a retired private root refuse safely; never execute them to restore that layer. This correction adds no new URL-backed installation mode.

Use the reviewed CLI migration. Preserve edited or unknown old files and stop for a disposition. Completion requires verified standard destinations and no active private Skill tree; do not hand-delete the old layer.
