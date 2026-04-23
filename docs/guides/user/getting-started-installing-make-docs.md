---
title: Installing Make Docs
path: getting-started
status: draft
order: 10
tags:
  - installation
  - setup
  - onboarding
  - cli
applies-to:
  - cli
  - docs
related:
  - ./cli-lifecycle-managing-installations.md
  - ./skills-installing-and-managing-skills.md
  - ./concepts-wave-revision-phase-coordinates.md
  - ./workflows-how-make-docs-stages-fit-together.md
  - ./workflows-choosing-the-right-route-for-your-project.md
  - ../developer/maintainer-docs-assets-and-runtime-state-boundaries.md
  - ../../prd/05-installation-profile-and-manifest-lifecycle.md
  - ../../prd/07-cli-command-surface-and-lifecycle.md
---

# Installing Make Docs

Use this guide for the first install only: prerequisites, the initial `make-docs` run, your first apply, and the main capability choices. Ongoing sync, reconfigure, backup, uninstall, and recovery flows are covered in [Managing Installations with the Make Docs CLI](./cli-lifecycle-managing-installations.md).

## Before You Start

You need:

| Requirement | Why it matters |
| --- | --- |
| Node.js 18 or later | The CLI is Node-based. |
| npm and `npx` | `npx make-docs` is the main install entry point. |
| A target project directory | The installer writes the selected docs scaffold into that repo. |

Run the installer from the root of the project you want to set up.

## First Install

The standard entry point is:

```bash
npx make-docs
```

On a first install, `make-docs` opens the selection wizard and walks you through:

1. capabilities
2. harnesses
3. install options
4. review and apply

If you want the default first install without prompts, run:

```bash
npx make-docs --yes
```

If you want to preview the first install without writing files, run:

```bash
npx make-docs --dry-run
```

`make-docs` treats a run with no existing manifest as a first install. The first successful apply creates `.make-docs/manifest.json`, which becomes the saved state for later lifecycle operations.

## What the Default First Install Includes

The default profile installs:

- all four capabilities: `designs`, `plans`, `prd`, and `work`
- both supported harnesses, which generate `AGENTS.md` and `CLAUDE.md`
- prompt starters
- all valid templates
- all valid references
- skills in project scope, with no optional skills selected by default

That gives you a full starter docs system plus the saved manifest needed for later sync and reconfigure runs.

## Choosing Capabilities

Capabilities control which major docs families `make-docs` manages:

| Capability | What it adds |
| --- | --- |
| `designs` | Design docs and design-routing support |
| `plans` | Plan docs and planning workflow assets |
| `prd` | The active PRD namespace and PRD workflow assets |
| `work` | Work backlogs tied to PRD outputs |

Two dependency rules matter on day one:

- `prd` depends on `plans`
- `work` depends on both `plans` and `prd`

That means disabling `plans` also disables `prd` and `work`, and disabling `prd` also disables `work`.

Examples:

```bash
# Keep a full install, but skip work backlogs
npx make-docs --yes --no-work

# Install only design and planning surfaces
npx make-docs --yes --no-prd --no-work
```

## Choosing Harnesses and Install Options

After capabilities, the wizard asks which harnesses and install options you want.

The main choices are:

- whether to target the Codex harness, the Claude Code harness, or both
- whether to install skills
- whether skills should live in the project or global scope
- whether to add any optional skills
- whether templates and references should be `all` or `required`

Examples:

```bash
# Install only the Codex harness
npx make-docs --yes --no-claude

# Skip skills on the first install
npx make-docs --yes --no-skills

# Add an optional skill during install
npx make-docs --yes --optional-skills decompose-codebase
```

This guide stops at initial selection. Use [Installing and Managing Skills](./skills-installing-and-managing-skills.md) for ongoing skill changes and [Managing Installations with the Make Docs CLI](./cli-lifecycle-managing-installations.md) for lifecycle operations after the first install.

## Your First Apply

The review step shows:

- the target directory
- whether this is a first install
- which selections are being applied
- how many files will be created, generated, updated, skipped, or left unchanged

On the first successful apply, `make-docs` writes:

- the selected root instruction files
- the selected `docs/` scaffold
- `.make-docs/manifest.json`

The installer is non-destructive. If it finds a conflicting unmanaged root instruction file, it prompts for a conflict decision. If a managed file has already been modified locally, later generated replacements are staged under `.make-docs/conflicts/` instead of overwriting your copy.

If you need the maintainer-facing explanation for why runtime state lives under `.make-docs/` while document resources live under `docs/assets/`, use [Docs Assets and Runtime State Boundaries](../developer/maintainer-docs-assets-and-runtime-state-boundaries.md).

## What to Do Next

After the first install:

- use [How Make Docs Stages Fit Together](./workflows-how-make-docs-stages-fit-together.md) to understand the overall artifact model
- use [Choosing the Right Route for Your Project](./workflows-choosing-the-right-route-for-your-project.md) to pick the right documentation route
- use [Understanding W/R/P Coordinates](./concepts-wave-revision-phase-coordinates.md) when you start working with plan and backlog lineage
- use [Installing and Managing Skills](./skills-installing-and-managing-skills.md) when you want to adjust shipped skills after the first install
- use [Managing Installations with the Make Docs CLI](./cli-lifecycle-managing-installations.md) for apply or sync, reconfigure, backup, uninstall, and recovery

For ongoing apply or sync, reconfigure, backup, uninstall, and recovery, continue with [Managing Installations with the Make Docs CLI](./cli-lifecycle-managing-installations.md).
