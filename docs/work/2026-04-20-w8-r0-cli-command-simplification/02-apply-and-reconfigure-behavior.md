# Phase 2: Apply and Reconfigure Behavior

> Derives from [Phase 2 of the plan](../../plans/2026-04-20-w8-r0-cli-command-simplification/02-apply-and-reconfigure-behavior.md).

## Purpose

Implement the behavior behind bare apply/sync and explicit reconfigure after the command grammar is fixed.

## Overview

This phase keeps the existing install planner, manifest, and selection machinery as the foundation. It changes when those pieces are invoked and how command-line selection flags affect existing installs.

## Source Plan Phases

- [02-apply-and-reconfigure-behavior.md](../../plans/2026-04-20-w8-r0-cli-command-simplification/02-apply-and-reconfigure-behavior.md)

## Stage 1 — Implement bare apply/sync

### Tasks

1. Update command resolution so no command enters an apply/sync path.
2. With no manifest, apply default selections plus command-line selection flags.
3. With an existing manifest and no selection flags, apply the saved manifest selections.
4. Remove the current interactive update-vs-reconfigure choice from the bare existing-install path.

### Acceptance criteria

- [ ] `starter-docs --yes` installs when no manifest exists
- [ ] `starter-docs --yes` syncs saved selections when a manifest exists
- [ ] bare existing-install sync does not ask update vs reconfigure

### Dependencies

- Phase 1

## Stage 2 — Treat bare selection flags as desired state

### Tasks

1. Allow bare selection flags to override saved manifest selections on existing installs.
2. Persist the resulting selections through the normal manifest write path.
3. Apply the resulting plan in the same run.
4. Preserve existing validation for incompatible selection flags such as `--no-skills` with skill-selection options.

### Acceptance criteria

- [ ] `starter-docs --yes --no-skills` disables skills on an existing install
- [ ] Desired-state selection changes are saved to the manifest
- [ ] Desired-state selection changes are applied in the same run
- [ ] Existing incompatible selection flag validation still applies

### Dependencies

- Stage 1

## Stage 3 — Implement `starter-docs reconfigure`

### Tasks

1. Require an existing manifest for `starter-docs reconfigure`.
2. In interactive mode, open the selection wizard from current manifest selections.
3. In non-interactive mode, require at least one selection flag.
4. Fail `starter-docs reconfigure --yes` without selection flags with clear guidance.
5. Apply and persist reconfigured selections through the existing install planner.

### Acceptance criteria

- [ ] `starter-docs reconfigure` opens the wizard from existing selections
- [ ] `starter-docs reconfigure --yes --no-skills` changes and applies selections
- [ ] `starter-docs reconfigure --yes` without selection flags fails clearly
- [ ] `starter-docs reconfigure` without a manifest fails with guidance to run `starter-docs` first

### Dependencies

- Stages 1 and 2

## Stage 4 — Preserve install safety behavior

### Tasks

1. Keep `--dry-run` behavior for apply and reconfigure.
2. Keep `--yes` prompt skipping for apply and reconfigure when sufficient CLI input exists.
3. Preserve instruction-conflict handling.
4. Avoid changing lifecycle executor behavior.

### Acceptance criteria

- [ ] `--dry-run` does not write files
- [ ] `--yes` skips prompts only when the command has enough input to proceed
- [ ] instruction conflict handling still runs when needed
- [ ] `backup --yes` and `uninstall --yes` still work

### Dependencies

- Stages 1-3

## Stage 5 — Add behavior tests

### Tasks

1. Add first-install bare command tests.
2. Add existing-install sync tests.
3. Add existing-install desired-state selection tests.
4. Add interactive and non-interactive reconfigure tests.
5. Add no-manifest reconfigure failure tests.

### Acceptance criteria

- [ ] First-install apply behavior is covered
- [ ] Existing-install sync behavior is covered
- [ ] Desired-state selection changes are covered
- [ ] Reconfigure success and failure paths are covered
- [ ] Targeted CLI tests pass

### Dependencies

- Stages 1-4
