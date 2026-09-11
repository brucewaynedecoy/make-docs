---
title: Installing and Managing Skills
kind: guide
path: skills
persona: user
status: draft
order: 10
tags:
  - skills
  - cli
  - archive-docs
applies-to:
  - cli
  - skills
related:
  - "cli-lifecycle-managing-installations.md"
  - "skills-decomposing-an-existing-codebase.md"
  - "../maintainer/skills-catalog-and-distribution-model.md"
  - "../maintainer/release-packaging-validation-and-release-reference.md"
  - "../../prd/08-skills-catalog-and-distribution.md"
---

# Installing and Managing Skills

This guide explains the current shipped skills model from a user point of view: how to install skills, how the selected skill set behaves, how project and global scope differ, and how to manage skills without changing the rest of the installation.

## Prerequisites

- A `make-docs` installation in the target project.
- The `make-docs` CLI available in your shell.
- A target project directory, plus access to your home directory if you plan to use global skills.

## Skills in the current model

Skills are managed separately from the docs scaffold. Their selections, ownership, and required operation state are recorded in the global Make Docs Store through the CLI.

The first-party catalog currently exposes these selectable skills:

| Skill | Purpose |
| --- | --- |
| `archive-docs` | Archive management |
| `decompose-codebase` | Codebase decomposition and plan creation |
| `cleanup-docs` | Documentation maintenance |
| `preflight` | Readiness review when explicitly requested |
| `factory` | Implementation and review coordination when explicitly requested |
| `human-experience` | Human experience review when explicitly requested |
| `naive-uat` | Unassisted Goal Testing through the shared CLI workflow |

All seven first-party payloads are embedded in the CLI package. Each can be installed alone without a network or the Make Docs source checkout. A missing or corrupt bundle stops safely; it does not trigger a hidden download. Installing preflight, factory, or human-experience does not invoke it or activate another Skill.

Skills are installed only when skills are enabled and the skill is in the selected set. The CLI selection UI groups candidates by purpose and shows the candidate skill name, source policy, supported harnesses, and provenance.

Install Skill files in standard agent locations, selected by scope and harness:

| Scope and selected harnesses | Real Skill directory | Other selected access |
| --- | --- | --- |
| Project, Claude only | `.claude/skills/<name>/` | None; do not create `.agents/skills/`. |
| Project, Codex only | `.agents/skills/<name>/` | None; do not create `.claude/skills/`. |
| Project, both | `.agents/skills/<name>/` | `.claude/skills/<name>` links to it, or is a supported managed native copy. |
| Global, any selection | `~/.agents/skills/<name>/` | Selected Codex uses `~/.codex/skills/<name>` (or `CODEX_HOME/skills`); selected Claude uses its configured native Skill root, normally `~/.claude/skills/<name>`. Native access links to the canonical directory or uses a supported copy. Direct access applies only if the configured native path equals the canonical path. |

A harness that uses the real directory reads it directly. Never create a self-link or duplicate ownership entry for that same path. `none` creates no Skill directories. Preserve pre-existing unrelated content; absence checks on fresh fixtures must prove no unselected project Skill root was created.

There is no active `.make-docs/agentics/` installation layer, in the project or home. Skill source stays solely in `packages/skills/<name>/`; compiled CLI output embeds declared bytes. Installation identity, ownership, intent and recovery belong only in the global Make Docs Store. A symbolic link to a Make Docs resource URL is unsupported and is not a feature or deferred task in this correction.


## Install or sync skills

Use the dedicated skills command when you want to manage skills without changing the rest of the install:

```bash
make-docs setup skills
```

This command uses the current installation state and lets you update only the skills portion of the Store-owned selection.

### Preview skill changes

```bash
make-docs setup skills --dry-run
```

Use dry-run before:

- switching from project to global scope
- removing skills
- adding a selected skill
- changing harness targets

Dry-run output labels skill operations as shared payloads, native harness exposures, or legacy duplicated payloads so you can tell whether Make Docs is installing canonical skill content, exposing it to a harness, or migrating an older duplicated install.

## Selected skills

The current registry exposes skills that can be selected explicitly. A skills-enabled install can replace the selected set with a comma-separated list, `all`, or `none`.

### No default skill files

Bare default installs do not write skill files. If skills are enabled and the selected skill set is empty, no first-party skill is installed until you select one explicitly.

To install `archive-docs`, select it by name or use `all` against the effective manifest.

### Select one or more skills

To select one skill during a skills-only update:

```bash
make-docs setup skills --yes --selected-skills decompose-codebase
```

To select every skill in the effective manifest:

```bash
make-docs setup skills --yes --selected-skills all
```

To clear the selected skill set:

```bash
make-docs setup skills --yes --selected-skills none
```

## Adopt existing first-party copies

If a first-party Skill already exists outside managed ownership, review adoption before changing it. For example:

```bash
make-docs setup skills --target . --selected-skills preflight --adopt-existing preflight --dry-run
```

Read the exact file changes, backups, scope, harnesses, ownership changes, and blockers. Then use the returned digest with the same options:

```bash
make-docs setup skills --target . --selected-skills preflight --adopt-existing preflight --review <review-digest> --yes
```

The adoption list must be part of the selected first-party set. `--yes` alone is insufficient. `--review` without adoption and adoption with `--remove` are invalid. Ordinary `setup` does not accept adoption flags.

Known-file differences and missing declared files can be reconciled after review. Replaced bytes are backed up. Extra files, unsafe links, conflicting copies, and another owner stop the operation. If the input changes, preview again and review the new digest. Do not delete files just to force adoption.

The CLI records ownership even when bytes already match. Required Store failure stops managed writes. For interrupted work, run `make-docs project state status --target-root .` and follow its printed safe action. No local state file or manual Store edit is needed. Ordinary document work can continue without the CLI; it does not claim installation state was captured.

## Alternate local skills manifest

Use `--skill-manifest` when you want a run to use an explicit local skills manifest instead of the packaged first-party manifest:

```bash
make-docs setup skills --yes --skill-manifest ./skills.manifest.json --selected-skills all
```

With `--selected-skills all`, `all` expands against the effective manifest for that run. The global Store preserves the selected skill names and records the skills manifest and selection provenance that produced them.

Remote manifest inputs are policy-gated. Unpinned remote manifests and unpinned remote skill payloads stop before install state is written.

## Project versus global scope

Skills can be installed in either project scope or global scope.

| Scope | Result |
| --- | --- |
| `project` | The shared payload and native harness exposures are installed under the current target project. |
| `global` | The shared payload and native harness exposures are installed under your home directory. |

Set scope explicitly with:

```bash
make-docs setup skills --yes --skill-scope project
make-docs setup skills --yes --skill-scope global
```

Choose project scope when the skill should travel with the repository. Choose global scope when you want the harness to reuse the same installed skills across projects.

## Harness-aware installation

Skills are installed only for enabled harnesses. The command accepts the same harness controls used elsewhere in the CLI.

Examples:

```bash
make-docs setup skills --yes --no-codex
make-docs setup skills --yes --no-claude-code
```

Use these flags when one harness should keep the skill and the other should not.

## Remove installed skills

Use `--remove` for a skills-only removal flow:

```bash
make-docs setup skills --remove
```

Preview removal first when you are not certain where the current skill files live:

```bash
make-docs setup skills --remove --dry-run
```

Removing skills updates only the skill-managed part of the installation. It does not uninstall the rest of the docs template.

## When to use `archive-docs`

`archive-docs` supports archive management workflows.

Use it when you need an agent to:

- archive docs under `docs/`
- run a staleness check
- mark docs as deprecated in place
- produce a dry-run archive impact report

Select it when you want Make Docs to install the canonical skill payload and native exposures for the enabled harnesses.

## When to use `decompose-codebase`

Use `decompose-codebase` when the starting point is an existing repository and you want an agent to reverse-engineer it into a structured PRD set and rebuild backlog.

That workflow has its own guide:

- [Decomposing an Existing Codebase](skills-decomposing-an-existing-codebase.md)

## Troubleshooting

### I want to manage skills without reconfiguring docs capabilities

Use `make-docs setup skills`, not `make-docs setup reconfigure`.

### I expected a skill to be installed automatically

Skills are installed only when explicitly selected.

### I switched to global scope and cannot find the skill in the project

That is expected. Global scope installs the shared payload and native harness exposures in your home directory instead of the target repo.

### I want to remove skills but keep the rest of the install

Use `make-docs setup skills --remove`.

### I see legacy duplicated payloads in a plan

That means Make Docs found files from the older per-harness skill layout. Clean Store-owned files can migrate to the standard scope/harness paths; edited or ambiguous files are preserved or routed to review instead of being removed by path name alone.

## Retired Private-Layout Upgrade

Wrong-private-layout cutover is forward-resume-only: review must state before apply that rollback would recreate the forbidden private layer and is not offered. Ordinary adoption already using standard locations keeps normal resume/rollback. Older saved operations that would write a retired private root refuse safely; never execute them to restore that layer. This correction adds no new URL-backed installation mode.

Use the reviewed CLI migration. Preserve edited or unknown old files and stop for a disposition. Completion requires verified standard destinations and no active private Skill tree; do not hand-delete the old layer.
