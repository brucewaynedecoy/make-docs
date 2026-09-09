---
title: Installing Make Docs
kind: guide
path: getting-started
persona: user
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
  - "cli-lifecycle-managing-installations.md"
  - "skills-installing-and-managing-skills.md"
  - "concepts-wave-revision-phase-coordinates.md"
  - "workflows-how-make-docs-stages-fit-together.md"
  - "workflows-choosing-the-right-route-for-your-project.md"
  - "../maintainer/maintainer-docs-assets-and-runtime-state-boundaries.md"
  - "../../prd/05-installation-profile-and-manifest-lifecycle.md"
  - "../../prd/07-cli-command-surface-and-lifecycle.md"
---

# Installing Make Docs

Use this guide for the first install only: prerequisites, the initial `make-docs setup` run, your first apply, and the main capability choices. Ongoing sync, reconfigure, backup, removal, and recovery flows are covered in [Managing Installations with the Make Docs CLI](cli-lifecycle-managing-installations.md).

## Before You Start

You need:

| Requirement | Why it matters |
| --- | --- |
| Node.js with built-in SQLite available | Managed installs require the Make Docs Store. An older Node version without SQLite cannot complete the install. |
| npm and `npx` | `npx @brucewaynedecoy/make-docs@next setup` is the main RC install entry point. |
| A target project directory | The installer writes the selected docs scaffold into that repo. |

Run the installer from the root of the project you want to set up.

## First Install

The standard entry point is:

```bash
npx @brucewaynedecoy/make-docs@next setup
```

On a first install, `make-docs setup` opens the selection wizard and walks you through:

1. capabilities
2. harnesses
3. install options
4. review and apply

Running bare `make-docs` (or bare `npx @brucewaynedecoy/make-docs@next`) is context-aware: in a project with no install, an interactive run starts the same guided setup; in a project that already has an install, it shows the current installation status and help, and never syncs or writes files. All non-interactive and flag-driven installs go through `setup`.

If you want the default first install without prompts, run:

```bash
npx @brucewaynedecoy/make-docs@next setup --yes
```

If you want to preview the first install without writing files, run:

```bash
npx @brucewaynedecoy/make-docs@next setup --dry-run
```

`make-docs setup` checks the installation record in the global Make Docs Store. A fresh target with no prior installation evidence uses the first-install flow. Legacy or ambiguous local evidence needs the CLI's reviewed migration path. A successful apply saves installation ownership and selections in the Store and keeps the project identity in `.make-docs/config.yaml`; it does not create a project-local manifest.

## What the Default First Install Includes

The default profile installs:

- all four capabilities: `designs`, `plans`, `prd`, and `work`
- both supported harnesses, which generate `AGENTS.md` and `CLAUDE.md`
- short routes to prompts, templates, and references, with optional local resource bodies according to the reviewed projection selection
- no selected skill payloads or harness stubs unless you explicitly select skills

That gives you the documentation routes and a Store installation record for later sync and reconfigure runs. `docs/assets/` is created only when needed; fresh setup does not create empty audience directories.

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
npx @brucewaynedecoy/make-docs@next setup --yes --no-work

# Install only design and planning surfaces
npx @brucewaynedecoy/make-docs@next setup --yes --no-prd --no-work
```

## Choosing Harnesses and Install Options

After capabilities, the wizard asks which harnesses and install options you want.

The main choices are:

- whether to target the Codex harness, the Claude Code harness, or both
- whether to install skills
- whether skills should live in the project or global scope
- whether to replace the selected skill set
- whether templates and references should be `all` or `required`

Examples:

```bash
# Install only the Codex harness
npx @brucewaynedecoy/make-docs@next setup --yes --no-claude

# Skip skills on the first install
npx @brucewaynedecoy/make-docs@next setup --yes --no-skills

# Select a specific skill during install
npx @brucewaynedecoy/make-docs@next setup --yes --selected-skills decompose-codebase
```

This guide stops at initial selection. Use [Installing and Managing Skills](skills-installing-and-managing-skills.md) for ongoing skill changes and [Managing Installations with the Make Docs CLI](cli-lifecycle-managing-installations.md) for lifecycle operations after the first install.

## Your First Apply

The review step shows:

- the target directory
- whether this is a first install
- which selections are being applied
- how many files will be created, generated, updated, skipped, or left unchanged

Before managed files change, the CLI records the required operation intent in the global Make Docs Store. On a successful apply it writes the selected root and documentation instruction files, selected optional resource bodies, and project configuration/identity. Installation ownership, selections, progress, and completion remain in the Store.

The Store defaults to `~/.make-docs/` outside the project. It holds operational records, not project knowledge. If the Store cannot provide required records, the managed install stops safely. It must not complete with only a warning or create local state as a fallback. Use the reported recovery instructions if an interrupted operation remains pending.

Conflicting or edited content requires review. The CLI preserves unresolved content; it does not silently overwrite it or use a local conflict directory as operational authority. When preservation needs backup payloads, those bytes may be kept under `.make-docs/backup/`, with operation records in the Store.

The project identifier is stored in `.make-docs/config.yaml` and is preserved by later setup runs. It is not derived from the directory path. Do not edit or replace it to clear an installation error.

Ordinary documentation work can continue without the CLI or when optional capture is unavailable. Report that capture did not occur. Do not substitute a local receipt, retry queue, direct Store write, or false success claim. This does not make required installation records optional.

For the ownership and recovery rules, read [Docs Assets and Runtime State Boundaries](../maintainer/maintainer-docs-assets-and-runtime-state-boundaries.md).

## What to Do Next

After the first install:

- use [How Make Docs Stages Fit Together](workflows-how-make-docs-stages-fit-together.md) to understand the overall artifact model
- use [Choosing the Right Route for Your Project](workflows-choosing-the-right-route-for-your-project.md) to pick the right documentation route
- use [Understanding W/R/P Coordinates](concepts-wave-revision-phase-coordinates.md) when you start working with plan and backlog lineage
- use [Installing and Managing Skills](skills-installing-and-managing-skills.md) when you want to adjust shipped skills after the first install
- use [Managing Installations with the Make Docs CLI](cli-lifecycle-managing-installations.md) for apply or sync, reconfigure, backup, removal, and recovery

For ongoing apply or sync, reconfigure, backup, removal, and recovery, continue with [Managing Installations with the Make Docs CLI](cli-lifecycle-managing-installations.md).
