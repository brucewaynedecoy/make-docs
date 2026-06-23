# Active PRD and Risk Reconciliation

## Purpose

Register the maintainer-only conformance lab in the active PRD set without turning it into shipped product surface.

## Required PRD Changes

- Add `docs/prd/20-revise-agent-harness-model-conformance-lab.md`.
- Update `docs/prd/00-index.md` routing, source anchors, audience paths, and intended follow-on.
- Annotate active PRDs for CLI/harness behavior, skills/harness scope, packaging validation, and W10 shared contracts.
- Update existing risk-register entries Q-007, Q-009, Q-012, Q-013, D-007, R-003, R-004, R-006, R-007, and R-014 without creating duplicate IDs.

## Acceptance Criteria

- PRD 20 states that the lab is maintainer-only evidence infrastructure.
- Baseline docs do not imply OpenCode, Goose, Pi, or future IDEs are current shipped harnesses.
- Risk updates distinguish lab evidence from product support claims.
