# CLI Lifecycle Clack Standardization

## Purpose

Capture a change request for the CLI `backup` and `uninstall` command workflows. Testing showed that these lifecycle commands do not consistently use Clack for rendering their workflows, which makes their user experience feel different from the other interactive command surfaces in the CLI.

The goal of the follow-on work is to standardize lifecycle command presentation so `make-docs backup` and `make-docs uninstall` use the same Clack-backed interaction model as the primary apply, reconfigure, and skills flows.

## Context

The backup command was implemented as part of the lifecycle work recorded by the project history as W7 R0 P3. The uninstall command was implemented as W7 R0 P4. Those phases delivered the core behavior: audit, confirmation, backup copy, optional backup before uninstall, removal, pruning, and completion reporting.

The behavior is valuable, but the terminal surface is inconsistent. The current lifecycle UI uses some Clack primitives for confirmations and warning notes, while the main backup and uninstall workflow rendering still relies on direct stdout writes for audit boxes, path groups, noop messages, cancellation messages, completion summaries, and failure summaries.

That split creates several UX problems:

- lifecycle flows do not visually match the wizard, reconfigure, skills, and apply surfaces
- important safety information is rendered through a separate formatting style
- destructive and semi-destructive command reviews feel less integrated with the rest of the CLI
- tests can pass behavioral assertions while missing the intended interactive presentation contract

The original lifecycle design already treated terminal presentation as part of the safety contract. This change request tightens that contract by making Clack the required rendering layer for the backup and uninstall workflows, not just a prompt helper for selected checkpoints.

## Decision

### 1. Standardize lifecycle workflows on a Clack-backed renderer

`make-docs backup` and `make-docs uninstall` should render their user-facing workflow through a lifecycle UI abstraction backed by Clack primitives.

The lifecycle renderer should own:

- workflow start and end messaging
- warning panels
- audit summaries
- grouped path reviews
- confirmation prompts
- execution progress
- noop, cancellation, success, and failure summaries

Direct stdout formatting should no longer be the primary rendering mechanism for lifecycle command UX. Low-level output may still exist for test adapters or non-interactive plumbing, but the production CLI surface should go through the lifecycle renderer.

### 2. Treat Clack consistency as part of the safety contract

Backup and uninstall are safety-sensitive flows. Their rendering should make review and confirmation clear before anything is copied or removed.

The Clack-backed lifecycle UI should present:

- a clear command title or intro for the workflow
- a concise summary of the target and operation mode
- structured audit review sections for files, directories, preserved paths, and skipped paths
- explicit totals for copied, removed, pruned, preserved, and skipped paths
- warnings before destructive uninstall review begins
- final confirmations with wording that distinguishes backup-only, remove-only, and backup-then-remove flows
- completion and failure summaries that use the same visual vocabulary as the rest of the CLI

This does not require ornamental UI. It requires the lifecycle commands to use the same interaction system users already see elsewhere in the CLI.

### 3. Preserve the existing audit and execution semantics

This change should not alter the core backup or uninstall semantics.

The following behavior remains authoritative from the earlier lifecycle design:

- backup and uninstall use the same shared audit results
- backup is non-destructive
- uninstall removes only audited make-docs-managed files
- uninstall prunes directories only after leaf removal and only when safe
- root instruction files are preserved unless their generated content can be confirmed
- `.backup/` content is never considered for removal
- `uninstall --backup` audits once, backs up from that audit, then removes from that same audit
- `--yes` skips interactive confirmation prompts without broadening what the command may change

The rework is about presentation and workflow consistency, not about relaxing lifecycle safety rules.

### 4. Keep non-interactive behavior explicit

Clack standardization must not make automation brittle.

When `--yes` is present, backup and uninstall should still skip confirmation prompts. The command should still render useful summaries unless a future quiet mode explicitly changes that behavior.

When a prompt is required but no TTY is available, the command should continue to fail with actionable guidance that names the appropriate `--yes` form.

### 5. Add tests for the rendering contract

Follow-on implementation should add tests that make the rendering requirement visible.

Tests should cover:

- backup audit review uses the lifecycle renderer instead of raw stdout-only formatting
- uninstall warning and audit review use the lifecycle renderer
- backup cancellation, noop, success, and failure paths render through the same surface
- uninstall cancellation, success, partial failure, and backup-before-remove paths render through the same surface
- `--yes` skips confirmation prompts while preserving review and completion output
- non-TTY confirmation failures still produce clear guidance

The tests do not need to snapshot every decorative character. They should assert that lifecycle command output is routed through the Clack-backed renderer and that critical labels, totals, and safety messages remain present.

## Alternatives Considered

**Leave lifecycle rendering as direct stdout with minor wording changes.** Rejected because the problem found in testing is not just wording. The lifecycle commands should share the same rendering system as other CLI workflows.

**Only replace the confirmation prompts.** Rejected because confirmations already use Clack in part of the lifecycle surface. The inconsistency is in the broader workflow rendering around audit review, status, cancellation, completion, and failure states.

**Create a custom lifecycle-only visual style.** Rejected because backup and uninstall should not become a special terminal dialect. These commands should feel like part of the same product surface as apply, reconfigure, and skills.

**Change backup and uninstall behavior while touching the UI.** Rejected for this change request. Behavior changes would increase risk and obscure the goal, which is to standardize the workflow presentation without weakening the existing audit and safety model.

## Consequences

### Benefits

- Backup and uninstall will feel consistent with the rest of the CLI.
- Safety-critical reviews will use the same visual system as other interactive workflows.
- Future lifecycle UI changes can be made in one renderer instead of scattered stdout helpers.
- Tests will make the intended presentation contract harder to regress.

### Costs and constraints

- The lifecycle UI will need a small renderer abstraction or equivalent refactor.
- Existing tests that assume exact raw stdout boxes may need to move to semantic assertions.
- Implementation must keep non-interactive `--yes` and non-TTY error behavior stable.
- The rework should avoid changing audit, backup, or removal semantics while refactoring presentation.

### Follow-on implications

- Planning should treat this as a focused change plan against the shipped lifecycle command work.
- The implementation should start with the lifecycle UI boundary before updating backup and uninstall command tests.
- Any documentation or examples that show backup and uninstall output should be refreshed after the renderer changes land.

## Design Lineage

- Update Mode: `new-doc-related`
- Prior Design Docs: [2026-04-18-cli-help-backup-and-uninstall.md](2026-04-18-cli-help-backup-and-uninstall.md), [2026-04-20-cli-command-simplification.md](2026-04-20-cli-command-simplification.md)
- Reason: this design records rework for the backup and uninstall lifecycle command surfaces created by the earlier lifecycle design and preserved by the command simplification design. It creates a separate change request because the original behavior is already implemented and the new requirement is a UX standardization pass.

## Intended Follow-On

- Route: `change-plan`
- Next Prompt: [designs-to-plan-change.prompt.md](../.prompts/designs-to-plan-change.prompt.md)
- Why: this is targeted rework against shipped lifecycle commands, so downstream planning should produce an additive change plan rather than a fresh baseline plan.
