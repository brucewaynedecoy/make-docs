---
title: Installing and Managing Skills
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
  - ./cli-lifecycle-managing-installations.md
  - ./skills-decomposing-an-existing-codebase.md
  - ../developer/skills-catalog-and-distribution-model.md
  - ../developer/release-packaging-validation-and-release-reference.md
  - ../../../prd/08-skills-catalog-and-distribution.md
---

# Installing and Managing Skills

This guide explains the current shipped skills model from a user point of view: how to install skills, how the selected skill set behaves, how project and global scope differ, and how to manage skills without changing the rest of the installation.

## Prerequisites

- A `make-docs` installation in the target project.
- The `make-docs` CLI available in your shell.
- A target project directory, plus access to your home directory if you plan to use global skills.

## Skills in the current model

Skills are managed separately from the rest of the docs template, but they still follow the installation manifest.

The first-party catalog currently exposes these selectable skills:

| Skill | Purpose |
| --- | --- |
| `archive-docs` | Archive management |
| `decompose-codebase` | Codebase decomposition and plan creation |
| `cleanup-docs` | Documentation maintenance |
| `closeout-commit` | Lifecycle closeout |
| `closeout-phase` | Lifecycle closeout |
| `work-on-phase` | Workflow execution |
| `work-on-wave` | Workflow execution |

Skills are installed only when skills are enabled and the skill is in the selected set. The CLI selection UI groups candidates by purpose and shows the candidate skill name, source policy, supported harnesses, and provenance.

When a skill is selected, Make Docs installs the canonical skill payload once under `.make-docs/agentics/skills/<skill-name>/` for project scope or under `$HOME/.make-docs/agentics/skills/<skill-name>/` for global scope. Enabled harnesses receive generated `SKILL.md` stubs under `.claude/skills/<skill-name>/` and `.agents/skills/<skill-name>/`; those stubs point back to the canonical payload instead of duplicating the full skill directory.

## Install or sync skills

Use the dedicated skills command when you want to manage skills without changing the rest of the install:

```bash
make-docs setup skills
```

This command uses the current installation state and lets you update only the skills portion of the manifest-backed configuration.

### Preview skill changes

```bash
make-docs setup skills --dry-run
```

Use dry-run before:

- switching from project to global scope
- removing skills
- adding a selected skill
- changing harness targets

Dry-run output labels skill operations as shared payloads, generated harness stubs, or legacy duplicated payloads so you can tell whether Make Docs is installing canonical skill content, exposing it to a harness, or migrating an older duplicated install.

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

## Alternate local skills manifest

Use `--skill-manifest` when you want a run to use an explicit local skills manifest instead of the packaged first-party manifest:

```bash
make-docs setup skills --yes --skill-manifest ./skills.manifest.json --selected-skills all
```

With `--selected-skills all`, `all` expands against the effective manifest for that run. The install manifest preserves the selected skill names and records the skills manifest and selection provenance that produced them.

Remote manifest inputs are policy-gated. Unpinned remote manifests and unpinned remote skill payloads stop before install state is written.

## Project versus global scope

Skills can be installed in either project scope or global scope.

| Scope | Result |
| --- | --- |
| `project` | The shared payload and generated harness stubs are installed under the current target project. |
| `global` | The shared payload and generated harness stubs are installed under your home directory. |

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

Select it when you want Make Docs to install the canonical skill payload and generated stubs for the enabled harnesses.

## When to use `decompose-codebase`

Use `decompose-codebase` when the starting point is an existing repository and you want an agent to reverse-engineer it into a structured PRD set and rebuild backlog.

That workflow has its own guide:

- [Decomposing an Existing Codebase](./skills-decomposing-an-existing-codebase.md)

## Troubleshooting

### I want to manage skills without reconfiguring docs capabilities

Use `make-docs setup skills`, not `make-docs setup reconfigure`.

### I expected a skill to be installed automatically

Skills are installed only when explicitly selected.

### I switched to global scope and cannot find the skill in the project

That is expected. Global scope installs the shared payload and generated harness stubs in your home directory instead of the target repo.

### I want to remove skills but keep the rest of the install

Use `make-docs setup skills --remove`.

### I see legacy duplicated payloads in a plan

That means Make Docs found files from the older per-harness skill layout. Clean manifest-owned files can migrate to the shared payload plus stub model; edited or ambiguous files are preserved or routed to review instead of being removed by path name alone.
