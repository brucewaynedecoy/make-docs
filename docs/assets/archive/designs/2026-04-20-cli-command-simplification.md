# CLI Command Simplification

## Purpose

Define a simpler command model for `make-docs` before any CLI implementation changes are made. This design captures the decision to replace the overlapping `init`, `update`, and `update --reconfigure` mental model with a primary idempotent apply command and an explicit reconfigure command.

## Context

The current CLI exposes several ways to reach nearly identical install/update outcomes:

- `make-docs` infers `init` or `update` from whether the target has a manifest.
- `make-docs init --no-skills --yes` and `make-docs update --no-skills --yes` can appear equivalent to users when docs are already installed.
- `make-docs update --reconfigure` is the only explicit selection-change surface, even though reconfiguration is a user intent rather than a modifier on update.
- Top-level help currently lists `init` and `update` as first-class commands, which makes users and agents ask which verb they should choose before they understand the manifest inference behavior.

That overlap creates cognitive overhead. Users should not need to know whether they are initializing or updating in order to say “make this project match my desired make-docs configuration.” They should only need to choose between applying/syncing the installed state, changing the configured footprint, backing up managed files, or uninstalling managed files.

The CLI is still in alpha, so this design can remove confusing public command surfaces instead of preserving them indefinitely as compatibility aliases. Existing `backup` and `uninstall` behavior is intentionally out of scope and should remain stable.

## Decision

### 1. Make bare `make-docs` the primary apply/sync command

The primary command should be:

- `make-docs [options]`

This command means “apply the desired make-docs state to the target directory.”

When no manifest exists, `make-docs` installs make-docs using default selections plus any selection flags provided on the command line. When a manifest exists, `make-docs` syncs the existing install using the saved manifest selections unless selection flags are provided.

Selection flags on bare `make-docs` represent desired state. For example, `make-docs --no-skills --yes` should disable skills in the saved selections and apply that resulting state, even when a manifest already exists.

### 2. Add `make-docs reconfigure` for explicit selection changes

The reconfiguration command should be:

- `make-docs reconfigure [options]`

This command means “change the configured make-docs footprint for an existing install.”

`make-docs reconfigure` requires an existing manifest. In interactive mode, it should open the selection wizard from the current manifest selections. In non-interactive mode, it should require at least one selection flag because `--yes` removes the interactive input that would otherwise define the change.

`make-docs reconfigure --yes` without selection flags should fail clearly with guidance to either provide selection flags or run `make-docs reconfigure` interactively.

### 3. Remove `init`, `update`, and `--reconfigure` from the public model

The public command model should no longer include:

- `make-docs init`
- `make-docs update`
- `make-docs update --reconfigure`
- `make-docs --reconfigure`

These surfaces should not remain as silent aliases. Because the utility is still alpha, fully removing them keeps the CLI easier to explain and prevents users from learning old verbs that immediately become second-class.

Removed surfaces should fail with helpful guidance instead of generic unknown-command errors:

- `make-docs init ...` should tell users to run `make-docs ...`.
- `make-docs update ...` should tell users to run `make-docs ...`.
- `--reconfigure` should tell users to run `make-docs reconfigure`.

### 4. Keep lifecycle commands unchanged

The existing lifecycle commands remain first-class commands:

- `make-docs backup [--target <dir>] [--yes] [--help]`
- `make-docs uninstall [--target <dir>] [--backup] [--yes] [--help]`

Selection flags remain invalid for `backup` and `uninstall`. The `--yes` behavior added for lifecycle confirmations is unaffected by this design.

### 5. Make help output teach intent first

Top-level help should present:

- bare `make-docs [options]` as apply/sync
- `make-docs reconfigure [options]` as selection changes
- `make-docs backup` as non-destructive backup
- `make-docs uninstall` as destructive removal with safety controls

Help examples should avoid `init`, `update`, and `--reconfigure`. Generated router guidance that currently says `npx make-docs update --reconfigure` should instead say `npx make-docs reconfigure`.

## Alternatives Considered

**Keep `init` and `update`, but make bare flags more capable.** Rejected because it would reduce friction for advanced users while preserving the original source of confusion in help and examples.

**Keep `init` and `update` as hidden aliases.** Rejected because silent aliases make the implementation more complex and leave agents with multiple valid command spellings to rediscover.

**Warn on `init` and `update` but keep them working.** Rejected because the CLI is alpha and can still make a cleaner breaking change before users build durable automation around the old verbs.

**Make `init` mean install-or-update.** Rejected because `init` still implies “first setup” and does not read as naturally as bare `make-docs` for ongoing sync.

**Treat bare `make-docs` on an existing install as reconfigure.** Rejected because apply/sync is the lower-friction, safer default. Reconfiguration should remain explicit because it can change the saved footprint.

## Consequences

### Benefits

- Users get one primary command for the common path: `make-docs`.
- Reconfiguration becomes a clear verb instead of a modifier on update.
- Help output becomes easier for users and agents to scan.
- Non-interactive desired-state flows become concise and consistent.

### Costs and constraints

- Existing alpha scripts using `init`, `update`, or `--reconfigure` will need to change.
- Parser, help, test, and generated guidance updates must be coordinated so the removed verbs do not remain in examples.
- The implementation must distinguish apply/sync from reconfigure even though both use the same install planner and selection model internally.

### Follow-on implications

- Planning should treat this as a new CLI surface wave, not a small wording-only change.
- The work backlog should split parser/help changes from apply/reconfigure behavior changes so the command contract can land before final validation.
- Tests must cover both first-install and existing-install behavior for bare `make-docs`.

## Design Lineage

- Update Mode: `new-doc-related`
- Prior Design Docs: [2026-04-18-cli-help-backup-and-uninstall.md](2026-04-18-cli-help-backup-and-uninstall.md)
- Reason: this design revises the command surface created during the CLI lifecycle wave by simplifying the install/update/reconfigure portion while preserving the backup and uninstall lifecycle commands.

## Intended Follow-On

- Route: `baseline-plan`
- Next Prompt: [designs-to-plan.prompt.md](../.prompts/designs-to-plan.prompt.md)
- Why: this is a new end-to-end CLI surface initiative that should produce its own implementation plan and work backlog before any source changes are made.
