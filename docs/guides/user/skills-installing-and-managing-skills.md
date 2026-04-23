---
title: Installing and Managing Skills
path: skills
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
  - ../../prd/08-skills-catalog-and-distribution.md
---

# Installing and Managing Skills

This guide explains the current shipped skills model from a user point of view: how to install skills, how required and optional skills behave, how project and global scope differ, and how to manage skills without changing the rest of the installation.

## Prerequisites

- A `make-docs` installation in the target project.
- The `make-docs` CLI available in your shell.
- A target project directory, plus access to your home directory if you plan to use global skills.

## Skills in the current model

Skills are managed separately from the rest of the docs template, but they still follow the installation manifest.

The shipped catalog currently has two skill types:

| Skill type | Current shipped entry |
| --- | --- |
| Required | `archive-docs` |
| Optional | `decompose-codebase` |

Required skills are installed whenever skills are enabled. Optional skills are installed only when you select them.

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

## Required versus optional skills

The current registry separates skills into default required entries and optional add-ons.

### Required skills

`archive-docs` is the default required skill. If skills are enabled, it is installed automatically for the selected harnesses.

### Optional skills

Optional skills are opt-in. Today the optional shipped skill is `decompose-codebase`.

To enable it during a skills-only update:

```bash
make-docs skills --yes --optional-skills decompose-codebase
```

To clear optional skills:

```bash
make-docs skills --yes --optional-skills none
```

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

## `archive-docs` in the default skill set

`archive-docs` is the required skill that ships by default when skills are enabled.

Use it when you need an agent to:

- archive docs under `docs/`
- run a staleness check
- mark docs as deprecated in place
- produce a dry-run archive impact report

Because it is required, you normally do not select it manually. The main user decision is whether skills are enabled at all and whether they should live in project or global scope.

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
