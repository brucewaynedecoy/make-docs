---
client: "Codex Desktop"
date: "2026-06-27"
coordinate: "W17 R3"
repo: "make-docs"
branch: "make-docs-v2"
status: "completed"
summary: "Captured the W17 R3 shared-agentics native harness exposure correction."
---

# W17 R3 Shared Agentics Native Harness Exposure Correction

## Changes

Generated the W17 R3 corrective design, plan bundle, PRD reconciliation, and work backlog for native shared-agentics harness exposure, superseding the W17 R2 generated-stub default with symlink-preferred exposure and managed copy-mirror fallback.

This pass did not implement package code. It made the product direction executable by establishing W17 R3 as the future-facing authority, preserving W17 R2 as historical evidence for shared payload placement and lifecycle classification, and updating active PRDs and downstream planning docs so future selected-skill work does not consume generated stubs as the target behavior.

- Created the W17 R3 corrective design and generated the matching W17 R3 plan/work bundle.
- Reconciled PRD 28 as the primary owner and updated supporting PRDs, including the risk register, package validation, CLI lifecycle, skills catalog, compatibility, source-of-truth, configuration, operation-boundary, plugin substrate, and PRD index entries.
- Added supersession notes to W17 R2 and W18 R2 planning surfaces so completed stub work remains evidence without acting as future implementation authority.
- Updated W18 R2/W18 R3 plugin and adversarial-review planning to inherit W17 R3 native exposure unless a later plugin-specific design supersedes it.
- Added backlog tasks for symlink-preferred native exposure, copy-mirror fallback, legacy stub migration, link-aware audit/backup/uninstall, package smoke validation, and manual harness UAT.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/designs/2026-06-27-shared-agentics-native-harness-exposure-correction.md](../../../designs/2026-06-27-shared-agentics-native-harness-exposure-correction.md) | New W17 R3 corrective design for native selected-skill harness exposure. |
| [docs/designs/2026-06-20-shared-agentics-installation-and-harness-redirection.md](../../../designs/2026-06-20-shared-agentics-installation-and-harness-redirection.md) | Added W17 R3 supersession note for the generated-stub default. |
| [docs/designs/2026-06-20-harness-plugin-substrate-and-workflow-bundles.md](../../../designs/2026-06-20-harness-plugin-substrate-and-workflow-bundles.md) | Updated plugin-substrate design to inherit W17 R3 native exposure and copy-mirror fallback. |
| [docs/plans/2026-06-27-w17-r3-shared-agentics-native-harness-exposure-correction/00-overview.md](../../../plans/2026-06-27-w17-r3-shared-agentics-native-harness-exposure-correction/00-overview.md) | New W17 R3 plan bundle overview. |
| [docs/work/2026-06-27-w17-r3-shared-agentics-native-harness-exposure-correction/00-index.md](../../../work/2026-06-27-w17-r3-shared-agentics-native-harness-exposure-correction/00-index.md) | New W17 R3 implementation backlog index. |
| [docs/prd/28-revise-shared-agentics-installation-harness-redirection.md](../../../prd/28-revise-shared-agentics-installation-harness-redirection.md) | Reconciled the primary shared-agentics PRD around native exposure, symlink preference, copy-mirror fallback, and legacy stub migration. |
| [docs/prd/03-open-questions-and-risk-register.md](../../../prd/03-open-questions-and-risk-register.md) | Updated Q-012, R-001, R-002, R-006, and R-014 to reflect native exposure and lifecycle-safety requirements. |
| [docs/prd/00-index.md](../../../prd/00-index.md) | Updated active PRD map and W17 intended follow-on to include W17 R3. |
| [docs/prd/30-revise-harness-plugin-substrate-workflow-bundles.md](../../../prd/30-revise-harness-plugin-substrate-workflow-bundles.md) | Updated plugin-substrate PRD to inherit W17 R3 native exposure and adapter boundaries. |
| [docs/plans/2026-06-23-w17-r2-shared-agentics-installation-harness-redirection/00-overview.md](../../../plans/2026-06-23-w17-r2-shared-agentics-installation-harness-redirection/00-overview.md) | Added W17 R3 supersession note while preserving W17 R2 historical evidence. |
| [docs/work/2026-06-23-w17-r2-shared-agentics-installation-harness-redirection/00-index.md](../../../work/2026-06-23-w17-r2-shared-agentics-installation-harness-redirection/00-index.md) | Added W17 R3 supersession note to the completed W17 R2 backlog. |
| [docs/plans/2026-06-23-w18-r2-harness-plugin-substrate-workflow-bundles/00-overview.md](../../../plans/2026-06-23-w18-r2-harness-plugin-substrate-workflow-bundles/00-overview.md) | Added W17 R3 native-exposure guardrail for future plugin work. |
| [docs/work/AGENTS.md](../../../work/AGENTS.md) | Clarified that legacy generated harness stubs are fallback/reference material, not backlog authority. |
| [docs/assets/archive/history/2026-06-27-w17-r3-shared-agentics-native-harness-exposure-correction.md](2026-06-27-w17-r3-shared-agentics-native-harness-exposure-correction.md) | Added this strategy and documentation-generation breadcrumb. |

### Developer

None this session.

### User

None this session.
