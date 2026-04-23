---
title: Managing Installations with the Make Docs CLI
path: cli/lifecycle
status: draft
order: 10
tags:
  - cli
  - lifecycle
  - backup
  - uninstall
  - recovery
applies-to:
  - cli
related:
  - ./getting-started-installing-make-docs.md
  - ./skills-installing-and-managing-skills.md
  - ../developer/maintainer-docs-assets-and-runtime-state-boundaries.md
  - ../developer/release-packaging-validation-and-release-reference.md
  - ../../prd/05-installation-profile-and-manifest-lifecycle.md
  - ../../prd/07-cli-command-surface-and-lifecycle.md
---

# Managing Installations with the Make Docs CLI

This guide covers the current lifecycle commands for an existing `make-docs` installation. Use it when you need to sync managed files, change selections, preview changes, create backups, uninstall managed assets, or recover safely from a bad lifecycle change.

For the first install and initial profile selection, use [Installing Make Docs](./getting-started-installing-make-docs.md).

## Prerequisites

- A project that already has a `make-docs` installation or a target directory where you want to manage one.
- A runnable CLI entrypoint such as `make-docs`.
- Write access to the target directory and, when using global skills, your home directory.

## Current command model

The lifecycle surface has three main modes:

| Need | Command |
| --- | --- |
| Apply or sync the current manifest-backed installation | `make-docs` |
| Change managed selections before applying them | `make-docs reconfigure` |
| Work with recovery-oriented lifecycle actions | `make-docs backup` and `make-docs uninstall` |

`make-docs` does not use a separate `sync` command. Running the bare command applies a first install when no manifest exists and performs a sync when one does.

For the maintainer-facing explanation of why lifecycle state lives under `.make-docs/` while document resources stay under `docs/assets/`, use [Docs Assets and Runtime State Boundaries](../developer/maintainer-docs-assets-and-runtime-state-boundaries.md).

## Apply or sync an installation

Run the bare command from the target project:

```bash
make-docs
```

For an existing install, the CLI reads the saved manifest, plans changes against the current package version, and updates only managed files that are still safe to update in place.

### What sync preserves

- Managed files that still match the previously installed version can be updated in place.
- Managed files you edited locally are preserved instead of being overwritten.
- The lifecycle plan reports what would change before anything is written.

### Apply or sync a different directory

```bash
make-docs --target ~/Projects/example
```

Use `--target` when the project you want to manage is not the current working directory.

## Reconfigure managed selections

Use `reconfigure` when you want to change the current installation profile rather than merely sync it.

```bash
make-docs reconfigure
```

Typical reconfigure changes include:

- adding or removing docs capabilities
- changing harness targets
- enabling or disabling skills
- switching skill scope
- replacing the selected optional skills

For non-interactive reconfiguration, pair `--yes` with at least one selection flag:

```bash
make-docs reconfigure --yes --no-codex --skill-scope global --optional-skills decompose-codebase
```

Use `reconfigure` when you intend to change the manifest-backed selection set. Use bare `make-docs` when you want the current selection set applied as-is.

## Preview changes with `--dry-run`

Use `--dry-run` to render the plan without writing files:

```bash
make-docs --dry-run
make-docs reconfigure --dry-run
```

Dry-run is the safest way to:

- confirm which files would change during sync
- check whether a reconfigure command is targeting the right harnesses or skills
- inspect lifecycle work before running `backup` or `uninstall`

If the plan is a no-op, the CLI explains that no managed file changes would be made.

## Use built-in help

Use command help whenever you need the current flag set rather than historical examples:

```bash
make-docs --help
make-docs reconfigure --help
make-docs backup --help
make-docs uninstall --help
```

The command help is the source of truth for:

- current flags
- command-specific examples
- lifecycle-only options such as `--backup`

## Create a backup before destructive changes

Use `backup` to copy removable managed files into the project-local `.backup/` tree before you uninstall or perform other risky cleanup.

```bash
make-docs backup
```

The backup command uses the same audit engine as uninstall. It inspects managed files, determines which files are safe to copy, and creates a dated destination under `.backup/` only when there is real backup work to do.

### When to run `backup`

- before `make-docs uninstall`
- before a large reconfigure that removes capabilities or skills
- before manual cleanup when you are unsure which files are still make-docs-managed

### Preview a backup first

```bash
make-docs backup --dry-run
```

If the audit finds nothing that needs backup, the CLI reports that and does not create an empty backup destination.

## Uninstall managed assets

Use `uninstall` to remove files that the lifecycle audit classifies as safe to delete.

```bash
make-docs uninstall
```

Useful variants:

```bash
make-docs uninstall --backup
make-docs uninstall --dry-run
```

`--backup` runs backup handling as part of the uninstall flow before removable files are deleted.

### What uninstall does not remove blindly

The audit flow distinguishes between:

- removable managed files
- preserved files that appear user-modified or otherwise unsafe to delete
- skipped paths such as items inside `.backup/`
- directories that become safely prunable only after removable descendants are gone

That separation is why uninstall and recovery guidance belong together: removal decisions depend on audit classification, not just pathname matching.

## Recovery guidance

If a lifecycle action did not do what you expected, use this order of operations:

1. Run the same command again with `--dry-run` to inspect the current plan.
2. Review the project-local `.backup/` tree if you used `backup` or `uninstall --backup`.
3. Re-run `make-docs reconfigure` if the problem was caused by the wrong selections.
4. Use command help to confirm the exact flags you intended to use.

### Recover from an incorrect reconfigure

If the wrong capability, harness, or skill set was selected, rerun:

```bash
make-docs reconfigure
```

or a non-interactive equivalent with the correct flags, then preview with `--dry-run` before applying.

### Recover after uninstall

If you uninstalled with backup enabled, inspect the newest `.backup/` directory in the target project and restore only the files you actually want back. After restoring files, rerun `make-docs` or `make-docs reconfigure` so the manifest-backed install returns to a consistent state.

## Troubleshooting

### `make-docs` shows a plan when I expected a separate sync command

That is current behavior. The bare command is the apply-or-sync entrypoint.

### I want to change selections, not just update files

Use `make-docs reconfigure`, not bare `make-docs`.

### I only want to see what would happen

Add `--dry-run` to the command you plan to run.

### I am not sure whether uninstall will delete too much

Run `make-docs uninstall --dry-run` first. If you want extra safety, use `make-docs uninstall --backup`.
