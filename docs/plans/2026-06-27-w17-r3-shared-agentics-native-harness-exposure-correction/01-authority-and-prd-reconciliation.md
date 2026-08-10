# Authority and PRD Reconciliation

## Purpose

Make the W17 R3 design the future-facing authority before implementation begins.

## Planned Changes

- Mark [Shared Agentics Installation and Harness Redirection](../../designs/2026-06-20-shared-agentics-installation-and-harness-redirection.md) as superseded for the default exposure decision.
- Reconcile [PRD 28](../../prd/28-shared-agentics-installation-and-harness-exposure.md) in place so it names symlink-first native harness exposure and managed copy-mirror fallback as the target.
- Update [PRD 03](../../prd/03-open-questions-and-risk-register.md) for Q-012, R-001, R-002, and R-006 so risk language tracks symlink exposure, copy mirrors, legacy stubs, and lifecycle safety.
- Update PRD index and affected baseline PRDs that currently describe generated stubs as future-facing behavior.
- Preserve W17 R2 history and completed backlog wording as historical implementation evidence.

## Acceptance Criteria

- Future-facing active PRDs no longer state that generated harness stubs are the default selected-skill exposure target.
- Historical W17 R2 references remain factual and are not rewritten as if stubs were never implemented.
- W17 R3 is named as the corrective authority for native harness exposure.
