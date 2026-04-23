# Phase 03: Skills and CLI Lifecycle

## Purpose

This phase rebuilds the user-facing command surface and the dedicated skills-maintenance path on top of the install and asset foundations from Phases 01 and 02. The core surfaces live in `packages/cli/src/cli.ts:77-1019`, `packages/cli/src/wizard.ts:124-1011`, `packages/cli/src/skills-command.ts:32-193`, `packages/cli/src/skills-ui.ts:102-298`, `packages/cli/src/skill-catalog.ts:33-138`, and `packages/cli/src/skill-resolver.ts:40-226`.

## Overview

The shipped CLI treats no-command install/sync, explicit `reconfigure`, `skills`, `backup`, and `uninstall` as distinct first-class paths in `packages/cli/src/cli.ts:77-244` and `packages/cli/src/cli.ts:894-1019`. The skills subsystem is similarly separate on purpose: it uses the shared planner/apply path but maintains its own UI, registry, and manifest ownership split through `packages/cli/src/install.ts:45-96` and `packages/cli/src/planner.ts:204-390`. This phase therefore assumes both prior phases are already stable.

## Source PRD Docs

- [../../prd/01-product-overview.md](../../prd/01-product-overview.md)
- [../../prd/02-architecture-overview.md](../../prd/02-architecture-overview.md)
- [../../prd/07-cli-command-surface-and-lifecycle.md](../../prd/07-cli-command-surface-and-lifecycle.md)
- [../../prd/08-skills-catalog-and-distribution.md](../../prd/08-skills-catalog-and-distribution.md)
- [../../prd/05-installation-profile-and-manifest-lifecycle.md](../../prd/05-installation-profile-and-manifest-lifecycle.md)
- [../../prd/03-open-questions-and-risk-register.md](../../prd/03-open-questions-and-risk-register.md)
- [../../prd/04-glossary.md](../../prd/04-glossary.md)

## Stage 1 - Public Command Surface and Wizard Flow

### Tasks

- Preserve the no-command primary workflow, explicit `reconfigure`, `skills`, `backup`, and `uninstall` taxonomy, and removed-command rejections from `packages/cli/src/cli.ts:77-244` and `packages/cli/src/cli.ts:589-612`.
- Rebuild argument parsing, validation, and help output from `packages/cli/src/cli.ts:455-719` and `packages/cli/src/cli.ts:894-1019`.
- Preserve the dependency-aware wizard, mutable review checkpoint, and `skipApplyConfirm` behavior from `packages/cli/src/wizard.ts:124-1011` and `packages/cli/src/cli.ts:148-226`.

### Acceptance criteria

- Help output advertises only the shipped surface, and removed commands still fail with actionable guidance rather than silently aliasing to new behavior.
- Wizard capability lockouts and harness requirements still match the current dependency model from `packages/cli/src/profile.ts:10-15`.
- Interactive sync still uses the generic post-plan confirmation, while first install and reconfigure continue using the wizard review checkpoint as the apply confirmation.

### Dependencies

- Phase 01, especially plan/apply semantics.
- Phase 02, because wizard options still expose template and reference choices tied to asset selection.

## Stage 2 - Skills Catalog and Skills-Only Maintenance

### Tasks

- Rebuild packaged registry loading and required-vs-optional skill grouping from `packages/cli/src/skill-registry.ts:25-134` and `packages/cli/src/skill-catalog.ts:70-79`.
- Preserve harness-specific skill roots, project-vs-global scope, and `skillFiles` manifest ownership from `packages/cli/src/skill-catalog.ts:18-46`, `packages/cli/src/install.ts:96-163`, and `packages/cli/src/planner.ts:204-390`.
- Rebuild the dedicated skills UI and skills-specific review summaries in `packages/cli/src/skills-ui.ts:102-298`, including the shorter remove flow.

### Acceptance criteria

- Required skills remain default-installed when skills are enabled, while optional skills remain explicit opt-ins from the registry.
- Project and global installs still resolve to the correct roots for both `claude-code` and `codex`.
- `make-docs skills --remove` still operates only on skill ownership and does not accidentally widen into general scaffold removal.

### Dependencies

- Stage 1 - Public Command Surface and Wizard Flow.
- Phase 01 Stage 3, because safe skills removal depends on audit and manifest ownership boundaries.

## Stage 3 - Skills Delivery and Runtime Contract Alignment

### Tasks

- Choose and implement the long-term skills delivery contract: remote-fetch, bundled-local, or dual-mode fallback, reconciling `packages/cli/src/skill-registry.ts:134`, `packages/cli/src/skill-resolver.ts:6-226`, and the earlier bundled-payload design drift captured in the PRD set.
- Tighten allowed skill source protocols, ref handling, and integrity expectations so mutable remote URLs are a deliberate policy instead of an accident.
- Expand thin authoring guidance in `packages/skills/README.md` so contributors can add or revise a skill without rediscovering registry, asset, and install-path rules from code alone.

### Acceptance criteria

- Runtime behavior, skill registry shape, and skills authoring docs all describe the same delivery model.
- Protocol and ref handling are explicit enough that release validation can prove whether a skill source is acceptable.
- Adding a new required or optional skill has one documented flow that covers registry entry, asset structure, install path, tests, and packaging assumptions.

### Dependencies

- Stage 2 - Skills Catalog and Skills-Only Maintenance.
- Decision inputs from [../../prd/03-open-questions-and-risk-register.md](../../prd/03-open-questions-and-risk-register.md).
