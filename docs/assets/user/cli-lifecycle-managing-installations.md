---
title: Managing Installations with the Make Docs CLI
kind: guide
path: cli/lifecycle
persona: user
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
  - "getting-started-installing-make-docs.md"
  - "skills-installing-and-managing-skills.md"
  - "../maintainer/maintainer-docs-assets-and-runtime-state-boundaries.md"
  - "../maintainer/release-packaging-validation-and-release-reference.md"
  - "../../prd/05-installation-profile-and-manifest-lifecycle.md"
  - "../../prd/07-cli-command-surface-and-lifecycle.md"
  - "../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md"
  - "../../prd/38-global-store-and-project-state.md"
---

# Managing Installations with the Make Docs CLI

This guide covers the current lifecycle commands for an existing `make-docs` installation. Use it when you need to sync managed files, change selections, preview changes, create backups, remove managed assets, or recover safely from a bad lifecycle change.

For the first install and initial profile selection, use [Installing Make Docs](getting-started-installing-make-docs.md).

## Prerequisites

- A project that already has a `make-docs` installation or a target directory where you want to manage one.
- A runnable CLI entrypoint such as `make-docs`.
- Write access to the target directory and, when using global skills, your home directory.

## Current command model

Installation lifecycle work lives under the `setup` command, and the tool's own machine-level footprint has two top-level self-management commands:

| Need | Command |
| --- | --- |
| Apply or sync the current Store-backed installation | `make-docs setup` |
| Change managed selections before applying them | `make-docs setup reconfigure` |
| Work with recovery-oriented lifecycle actions | `make-docs setup backup` and `make-docs setup remove` |
| Update the installed tool itself | `make-docs update` |
| Remove the tool's machine-level footprint | `make-docs uninstall` |

`make-docs` does not use a separate `sync` command. Running `make-docs setup` uses the Store installation record to distinguish setup from sync. Legacy or ambiguous evidence requires a reviewed migration; absence of a local manifest is not proof of a fresh target.

Bare `make-docs` is context-aware and never syncs. In a project that already has an install, it shows the current installation status and help. In a project with no install, an interactive run starts a guided setup; non-interactive and flag-driven installs must go through `make-docs setup`.

The current runnable product is the npm-delivered TypeScript installer-maintainer CLI. The same package also ships a read-first MCP stdio server through `make-docs mcp`; it is intended for tool clients that need installed-state inspection, Store installation/config reads, compatibility classification, dry-run planning, and work/lifecycle operation helpers. Ordinary users should keep using the CLI commands below for install, reconfigure, skills, backup, and removal work.

Historical `init`, `--reconfigure`, and `--skills` surfaces are not current commands or flags, and the pre-reorganization top-level `reconfigure`, `skills`, `backup`, and `uninstall` command spellings no longer exist and have no aliases. Use `make-docs setup` for install or sync, `make-docs setup reconfigure` to change selections, and `make-docs setup skills` for skills-only work. Note that top-level `update` and `uninstall` now mean tool self-management, not project maintenance.

For the maintainer-facing explanation of why lifecycle state lives in the global Make Docs Store while project documents stay local, use [Docs Assets and Runtime State Boundaries](../maintainer/maintainer-docs-assets-and-runtime-state-boundaries.md).

## Apply or sync an installation

Run the setup command from the target project:

```bash
make-docs setup
```

For an existing install, the CLI reads the saved Store installation record, plans changes against the current package version, and updates only managed files that are still safe to update in place.

### What sync preserves

- Managed files that still match the previously installed version can be updated in place.
- Managed files with local differences are preserved unless you explicitly choose to overwrite them during review.
- The lifecycle plan reports what would change before anything is written.

The project identifier lives in `.make-docs/config.yaml`; the Store holds its installation record and managed-file inventory. The CLI preserves an existing valid identifier. Older project-local manifests are migration evidence only. Let the reviewed CLI upgrade transfer valid evidence rather than adding new state to an old manifest.

Every managed mutation requires Store intent before it writes project files. If required Store records are unavailable, the operation stops safely. Ordinary content work can still continue without the CLI or optional capture, with no local fallback, queued capture, direct Store write, or false success claim.

### Review planned changes and diffs

Before install, sync, or reconfigure writes files, the CLI shows a plan grouped by the operation it intends to perform:

| Label | Meaning |
| --- | --- |
| `generate` | Create a managed file that does not exist yet. |
| `update` | Replace a managed file that is safe to update or that you explicitly chose to overwrite. |
| `skip` | Leave a file unchanged. |
| `remove` | Delete a managed file that is no longer selected. |

When the plan finds existing managed files whose content differs from the new make-docs content, the CLI pauses for a diff review before the final apply prompt.
The review can include agent instruction files, references, templates, prompts, skill assets, and other managed files selected for the current install.

You can choose one batch action:

- `Overwrite all` applies the new make-docs content for every listed file.
- `Skip all` preserves every listed file.
- `Review each` walks each file one at a time so you can overwrite or skip per file after inspecting the diff.

No file changes are applied until you confirm the final apply prompt.
If you cancel during diff review or at the final apply prompt, the command exits before writing the planned changes.
In non-interactive mode, including `--yes`, the CLI cannot ask you to resolve reviewable diffs; unresolved diffs fail the command instead of silently overwriting or skipping them.

### Apply or sync a different directory

```bash
make-docs setup --target ~/Projects/example
```

Use `--target` when the project you want to manage is not the current working directory.

## Reconfigure managed selections

Use `setup reconfigure` when you want to change the current installation profile rather than merely sync it.

```bash
make-docs setup reconfigure
```

Typical reconfigure changes include:

- adding or removing docs capabilities
- changing harness targets
- enabling or disabling skills
- switching skill scope
- replacing the selected optional skills

For non-interactive reconfiguration, pair `--yes` with at least one selection flag:

```bash
make-docs setup reconfigure --yes --no-codex --skill-scope global --selected-skills decompose-codebase
```

Use `setup reconfigure` when you intend to change the Store-backed selection set. Use `make-docs setup` when you want the current selection set applied as-is.

## Preview changes with `--dry-run`

Use `--dry-run` to render the plan without writing files:

```bash
make-docs setup --dry-run
make-docs setup reconfigure --dry-run
```

Dry-run is the safest way to:

- confirm which files would change during sync
- check whether a reconfigure command is targeting the right harnesses or skills
- inspect lifecycle work before running `setup backup` or `setup remove`

If the plan is a no-op, the CLI explains that no managed file changes would be made.

## Use built-in help

Use command help whenever you need the current flag set rather than historical examples:

```bash
make-docs --help
make-docs setup --help
make-docs setup reconfigure --help
make-docs setup backup --help
make-docs setup remove --help
```

The command help is the source of truth for:

- current flags
- command-specific examples
- lifecycle-only options such as `--backup`

## Create a backup before destructive changes

Use `setup backup` to copy removable managed files into the project-local `.make-docs/backup/` tree before you remove the installation or perform other risky cleanup.

```bash
make-docs setup backup
```

The backup command uses the same audit engine as removal. It inspects managed files, determines which files are safe to copy, and creates a dated destination under `.make-docs/backup/` only when there is real backup work to do. Existing root `.backup/` directories from older Make Docs runs are protected legacy backup payloads; current backup runs do not create new snapshots there.

### When to run `setup backup`

- before `make-docs setup remove`
- before a large reconfigure that removes capabilities or skills
- before manual cleanup when you are unsure which files are still make-docs-managed

### Preview backup scope safely

`setup backup` does not currently have a dry-run mode. Run `make-docs setup backup` interactively when you want to inspect the audit summary before confirming backup creation. If the audit finds nothing that needs backup, the CLI reports that and does not create an empty backup destination.

## Remove managed assets

Use `setup remove` to remove files that the lifecycle audit classifies as safe to delete.

```bash
make-docs setup remove
```

Useful variants:

```bash
make-docs setup remove --backup
```

`--backup` runs backup handling as part of the removal flow before removable files are deleted.

### What removal does not delete blindly

The audit flow distinguishes between:

- removable managed files
- preserved files that appear user-modified or otherwise unsafe to delete
- skipped paths such as items inside `.make-docs/backup/` or legacy `.backup/`
- directories that become safely prunable only after removable descendants are gone

That separation is why removal and recovery guidance belong together: removal decisions depend on audit classification, not just pathname matching.

### What removal reports about the machine-level store

Make Docs keeps installation and operation records in an external global Store, normally `~/.make-docs/`. Project removal uses that authority and reports the Store result. It does not delete the all-projects Store or other projects' state. Backup payloads under `.make-docs/backup/` and legacy `.backup/` remain protected according to the reviewed removal plan.

Do not delete Store files by hand because the last project was removed. Machine-wide Store cleanup is a separate explicit CLI choice. If required Store evidence is unavailable, removal must stop safely rather than guess ownership from paths.

The Store's project lookup records stay on the machine. Export or sharing requires separate explicit authority.

## Manage the tool itself

Two top-level commands manage Make Docs' machine-level footprint rather than any single project.

`make-docs update` updates a persistent global install of the tool. It detects which install manager owns the running binary and delegates to it; when detection is ambiguous it prints the exact update command and the affected store path instead of acting. If you run Make Docs through `npx`, `pnpm dlx`, or `bunx` — the primary posture — the command reports that there is nothing persistent to update, because the runner fetches the requested version each time. Every `update` run also applies any pending machine-level store schema migration.

`make-docs uninstall` manages the installed tool footprint and preserves the Store by default. `--remove-store` is the separate explicit Store cleanup choice. The command reports its scope and required confirmation. It does not remove project content; project removal is `make-docs setup remove`.

### Upgrading a pre-v2 installation

`make-docs setup`, `make-docs setup reconfigure`, and `make-docs update` detect an installation created by a pre-v2 version of Make Docs by its fingerprints (a v1 manifest schema). When one is found, the command presents a warning that itemizes what can break on upgrade — the replaced command spellings, the renamed project removal, the relocated run state and work evidence, the renamed MCP tools, and the manifest schema change — followed by a choice between backing up and installing the latest version (recommended) and cancelling. Cancelling leaves the installation untouched, and non-interactive runs never upgrade a pre-v2 installation silently.

## Recovery guidance

If a lifecycle action did not do what you expected, use this order of operations:

1. Run `make-docs project state status --target-root <project-path> --json`. If an operation is pending, follow the reported `project state recover` instructions before attempting another mutation. Otherwise, use the original command with `--dry-run` to inspect its plan.
2. Review the project-local `.make-docs/backup/` tree if you used `setup backup` or `setup remove --backup`.
3. Re-run `make-docs setup reconfigure` if the problem was caused by the wrong selections.
4. Use command help to confirm the exact flags you intended to use.

### Recover from an incorrect reconfigure

If the wrong capability, harness, or skill set was selected, rerun:

```bash
make-docs setup reconfigure
```

or a non-interactive equivalent with the correct flags, then preview with `--dry-run` before applying.

### Recover after removal

If you removed the installation with backup enabled, inspect the newest `.make-docs/backup/` directory in the target project and restore only the files you actually want back. If your project also has a root `.backup/` directory from an older Make Docs run, treat it as legacy recovery evidence and do not delete it blindly. After restoring files, rerun `make-docs setup` or `make-docs setup reconfigure` so the Store-backed install returns to a consistent state.

## Troubleshooting

### Bare `make-docs` shows status instead of syncing

That is current behavior. With an install present, the bare command reports installation status and help and never syncs. Run `make-docs setup` when you want an apply or sync.

### I want to change selections, not just update files

Use `make-docs setup reconfigure`, not `make-docs setup`.

### I only want to see what would happen

Add `--dry-run` to install, sync, reconfigure, or skills commands. For `setup backup` or `setup remove`, run the command interactively and stop at the confirmation prompt after reviewing the audit summary.

### I am not sure whether removal will delete too much

Run `make-docs setup remove` interactively and stop at the confirmation prompt after reviewing the audit summary. If you want extra safety before removal, use `make-docs setup remove --backup`.

## Future Coverage

None currently tracked; the W18 R11 command reorganization triggers recorded here are resolved.
