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
  - "cli-setting-up-projects-and-harness-access.md"
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

On a first install, `make-docs setup` opens the setup flow and walks you through:

1. project state
2. harnesses and their current support state
3. optional Skills and resource placement
4. one grouped review with separate computer and project approvals

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

Fresh setup installs:

- all four capabilities: `designs`, `plans`, `prd`, and `work`
- the reviewed Codex and Claude Code project routers, such as `AGENTS.md` and `CLAUDE.md`
- short routes to prompts, templates, and references, with optional local resource bodies according to the reviewed projection selection
- no selected skill payloads or harness stubs unless you explicitly select skills

That gives you the documentation routes and a Store installation record for later sync and reconfigure runs. `docs/assets/` is created only when needed. Fresh setup does not create empty audience directories.

No Store-backed Codex or Claude Code connection method is supported yet. Exact real-harness evidence is missing. You can select `none` and still use project routers, Skills, and Store-free resource reads.

## Project Surface

Fresh setup uses the complete project surface:

| Capability | What it adds |
| --- | --- |
| `designs` | Design docs and design-routing support |
| `plans` | Plan docs and planning workflow assets |
| `prd` | The active PRD namespace and PRD workflow assets |
| `work` | Work backlogs tied to PRD outputs |

Setup does not ask a fresh project to select document types.

An existing partial project keeps its current document set during a normal repeat. Use `make-docs setup reconfigure` to review an expansion. Make Docs does not add the missing areas until you approve the project plan.

## Choosing Harnesses and Install Options

After project state, setup asks which harnesses and install options you want.

The main choices are:

- whether to target the Codex harness, the Claude Code harness, or both
- whether to choose `none` for Store-backed harness access
- whether to install skills
- whether skills should live in the project or global scope
- whether to replace the selected skill set
- whether templates and references should be `all` or `required`

Examples:

```bash
# Install only the Codex harness
npx @brucewaynedecoy/make-docs@next setup --yes --no-claude-code

# Skip skills on the first install
npx @brucewaynedecoy/make-docs@next setup --yes --no-skills

# Select a specific skill during install
npx @brucewaynedecoy/make-docs@next setup --yes --selected-skills decompose-codebase
```

Detection does not prove support. Setup can show detected, configured, drifted, blocked, or unsupported state. Pi is unsupported.

This guide stops at initial selection. Use [Setting Up Projects and Harness Access](cli-setting-up-projects-and-harness-access.md) for the full access, review, and recovery model. Use [Installing and Managing Skills](skills-installing-and-managing-skills.md) for ongoing Skill changes. Use [Managing Installations with the Make Docs CLI](cli-lifecycle-managing-installations.md) for lifecycle operations after the first install.

## Your First Apply

The final review has two groups when both scopes have changes:

- **This computer** shows machine intent and native harness files.
- **This project** shows project routers, Skills, config, resource copies, and document areas.

The two groups need separate approval. Make Docs applies and verifies the computer plan first. It then applies the project plan. A valid computer change stays in place if the project apply fails.

Before managed files change, the CLI records the required operation intent in the global Make Docs Store. On a successful apply it writes the selected root and documentation instruction files, selected optional resource bodies, and project configuration and identity. Installation ownership, selections, progress, and completion remain in the Store.

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
- use [Setting Up Projects and Harness Access](cli-setting-up-projects-and-harness-access.md) for computer and project approval, harness limits, and safe recovery
- use [Managing Installations with the Make Docs CLI](cli-lifecycle-managing-installations.md) for apply or sync, reconfigure, backup, removal, and recovery

For ongoing apply or sync, reconfigure, backup, removal, and recovery, continue with [Managing Installations with the Make Docs CLI](cli-lifecycle-managing-installations.md).
