# Phase 3: Help, Router, and Documentation Text

> Derives from [Phase 3 of the plan](../../plans/2026-04-20-w8-r0-cli-command-simplification/03-help-router-and-doc-text.md).

## Purpose

Update user-facing and generated guidance so the simplified command model is discoverable and old command names do not continue to teach the previous model.

## Overview

This phase owns help output, generated router messages, and docs references that would otherwise mislead users or future agents.

## Source Plan Phases

- [03-help-router-and-doc-text.md](../../plans/2026-04-20-w8-r0-cli-command-simplification/03-help-router-and-doc-text.md)

## Stage 1 — Rewrite top-level help

### Tasks

1. Update `make-docs --help` usage to show bare `make-docs [options]`.
2. List commands as `reconfigure`, `backup`, and `uninstall`.
3. Explain bare apply/sync as the primary workflow.
4. Remove `init`, `update`, and `--reconfigure` examples.

### Acceptance criteria

- [ ] Top-level help teaches bare apply/sync
- [ ] Top-level help lists `reconfigure`, `backup`, and `uninstall`
- [ ] Top-level help does not list `init` or `update`
- [ ] Top-level examples contain no `--reconfigure`

### Dependencies

- Phases 1 and 2

## Stage 2 — Add `reconfigure --help`

### Tasks

1. Add command-specific help for `make-docs reconfigure --help`.
2. Document the existing manifest requirement.
3. Document interactive wizard behavior.
4. Document non-interactive selection flag requirements.
5. Include examples for interactive and non-interactive reconfiguration.

### Acceptance criteria

- [ ] `make-docs reconfigure --help` renders without requiring a manifest
- [ ] Help explains interactive reconfiguration
- [ ] Help explains `--yes` plus selection flags
- [ ] Help explains that `reconfigure --yes` without flags is invalid

### Dependencies

- Stage 1

## Stage 3 — Update generated router guidance

### Tasks

1. Search generated renderer output for `npx make-docs update --reconfigure`.
2. Replace those messages with `npx make-docs reconfigure`.
3. Keep capability-specific guidance accurate when prompts, plans, or skills are missing.

### Acceptance criteria

- [ ] Generated renderer text no longer references `update --reconfigure`
- [ ] Replacement guidance uses `npx make-docs reconfigure`
- [ ] Capability-specific missing-install guidance remains understandable

### Dependencies

- Phase 1 command names fixed

## Stage 4 — Update active project docs

### Tasks

1. Update this wave's design, plan, work, and future agent-guide docs if implementation changes refine command wording.
2. Update any active non-historical docs that instruct users to run removed commands.
3. Leave clearly historical references only when they describe prior behavior or migration error coverage.

### Acceptance criteria

- [ ] Active docs for this wave use the simplified command model
- [ ] User-facing current guidance does not recommend removed commands
- [ ] Historical references are either removed or clearly intentional

### Dependencies

- Stages 1-3

## Stage 5 — Add help and text tests

### Tasks

1. Update top-level help assertions.
2. Add `reconfigure --help` assertions.
3. Add stale renderer text assertions if practical.
4. Add a stale-reference search to manual validation notes.

### Acceptance criteria

- [ ] Help tests cover the final command vocabulary
- [ ] Renderer guidance updates are covered directly or by stale-reference validation
- [ ] Targeted CLI tests pass

### Dependencies

- Stages 1-4
