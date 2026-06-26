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

## Install or sync skills

Use the dedicated skills command when you want to manage skills without changing the rest of the install:

```bash
make-docs skills
```

This command uses the current installation state and lets you update only the skills portion of the manifest-backed configuration.

### Preview skill changes

```bash
make-docs skills --dry-run
```

Use dry-run before:

- switching from project to global scope
- removing skills
- adding an optional skill
- changing harness targets

## Selected skills

The current registry exposes skills that can be selected explicitly. A skills-enabled install can replace the selected set with a comma-separated list, `all`, or `none`.

### Default skill

`archive-docs` is the default selected skill. If skills are enabled and you do not replace the selected set, it is installed for the selected harnesses.

### Select one or more skills

To select one skill during a skills-only update:

```bash
make-docs skills --yes --selected-skills decompose-codebase
```

To select every skill in the effective manifest:

```bash
make-docs skills --yes --selected-skills all
```

To clear the selected skill set:

```bash
make-docs skills --yes --selected-skills none
```

## Alternate local skills manifest

Use `--skill-manifest` when you want a run to use an explicit local skills manifest instead of the packaged first-party manifest:

```bash
make-docs skills --yes --skill-manifest ./skills.manifest.json --selected-skills all
```

With `--selected-skills all`, `all` expands against the effective manifest for that run. The install manifest preserves the selected skill names and records the skills manifest and selection provenance that produced them.

Remote manifest inputs are policy-gated. Unpinned remote manifests and unpinned remote skill payloads stop before install state is written.

## Project versus global scope

Skills can be installed in either project scope or global scope.

| Scope | Result |
| --- | --- |
| `project` | Skill files are installed under the current target project. |
| `global` | Skill files are installed under your home directory for the selected harnesses. |

Set scope explicitly with:

```bash
make-docs skills --yes --skill-scope project
make-docs skills --yes --skill-scope global
```

Choose project scope when the skill should travel with the repository. Choose global scope when you want the harness to reuse the same installed skills across projects.

## Harness-aware installation

Skills are installed only for enabled harnesses. The command accepts the same harness controls used elsewhere in the CLI.

Examples:

```bash
make-docs skills --yes --no-codex
make-docs skills --yes --no-claude-code
```

Use these flags when one harness should keep the skill and the other should not.

## Remove installed skills

Use `--remove` for a skills-only removal flow:

```bash
make-docs skills --remove
```

Preview removal first when you are not certain where the current skill files live:

```bash
make-docs skills --remove --dry-run
```

Removing skills updates only the skill-managed part of the installation. It does not uninstall the rest of the docs template.

## When to use `archive-docs`

`archive-docs` supports archive management workflows.

Use it when you need an agent to:

- archive docs under `docs/`
- run a staleness check
- mark docs as deprecated in place
- produce a dry-run archive impact report

Select it when you want Make Docs to install that skill for the enabled harnesses.

## When to use `decompose-codebase`

Use `decompose-codebase` when the starting point is an existing repository and you want an agent to reverse-engineer it into a structured PRD set and rebuild backlog.

That workflow has its own guide:

- [Decomposing an Existing Codebase](./skills-decomposing-an-existing-codebase.md)

## Troubleshooting

### I want to manage skills without reconfiguring docs capabilities

Use `make-docs skills`, not `make-docs reconfigure`.

### I expected an optional skill to be installed automatically

Optional skills are installed only when explicitly selected.

### I switched to global scope and cannot find the skill in the project

That is expected. Global scope installs skill files in your home directory instead of the target repo.

### I want to remove skills but keep the rest of the install

Use `make-docs skills --remove`.
