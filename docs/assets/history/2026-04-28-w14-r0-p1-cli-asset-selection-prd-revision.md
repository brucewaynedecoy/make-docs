---
date: "2026-04-28"
client: "Codex Desktop"
repo: "make-docs"
status: "completed"
coordinate: "W14 R0 P1"
summary: "Recorded the PRD revision for removing user-facing prompt, template, and reference asset choices."
---

# CLI Asset Selection Simplification - Phase 1 PRD Revision

## Changes

Implemented W14 R0 Phase 1 from [the PRD change backlog](../../work/2026-04-28-w14-r0-cli-asset-selection-simplification/01-prd-change-and-baseline-annotations.md). The active PRD set now includes a dedicated revision describing the alpha cleanup: included prompt starters, document templates, and reference files are invariant managed assets, while the old wizard choices, CLI flags, and persisted selection fields are removed instead of preserved as compatibility inputs.

| Area | Summary |
| --- | --- |
| Active PRD revision | Added the CLI asset-selection simplification PRD and linked it to the W14 R0 plan and work backlog. |
| Baseline continuity | Annotated the template-contract PRD with the superseding requirement for prompt, template, and reference asset handling. |
| PRD index | Confirmed the active PRD index points maintainers to the W14 revision after the baseline subsystem docs. |

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/prd/11-revise-cli-asset-selection-simplification.md](../../prd/11-revise-cli-asset-selection-simplification.md) | Active PRD revision for treating prompts, templates, and references as managed assets rather than user-selectable groups. |
| [docs/prd/06-template-contracts-and-generated-assets.md](../../prd/06-template-contracts-and-generated-assets.md) | Baseline PRD annotated with the superseding asset-selection simplification requirement. |
| [docs/work/2026-04-28-w14-r0-cli-asset-selection-simplification/01-prd-change-and-baseline-annotations.md](../../work/2026-04-28-w14-r0-cli-asset-selection-simplification/01-prd-change-and-baseline-annotations.md) | Phase 1 implementation backlog item completed by the PRD revision and baseline annotation. |
| [docs/assets/history/2026-04-28-w14-r0-p1-cli-asset-selection-prd-revision.md](2026-04-28-w14-r0-p1-cli-asset-selection-prd-revision.md) | History record for the completed W14 R0 Phase 1 checkpoint. |

### Developer

None this session.

### User

None this session.
