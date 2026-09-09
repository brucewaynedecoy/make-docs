---
client: "Codex Desktop"
date: "2026-09-09"
coordinate: "W19 R4 P1"
repo: "make-docs"
branch: "make-docs-v2"
status: "completed"
summary: "Closed the accepted project assets and Persona discovery interrupt."
---

# Project Assets and Persona Discovery - Assets and Persona Cutover

## Changes

Implemented shared project assets and configurable audience discovery with `user` and `maintainer` defaults, on-demand asset routers, and reviewed CLI layout migration backed by the global Make Docs Store. Migrated the dogfood project through the installed CLI, repaired current guide and Persona instructions, and closed W19 R4 P1 after the owner accepted the corrected result.

The real migration moved 598 files through 1,418 reviewed path changes with independent read-back. A later Store-backed operation repaired three guide-template links in two files. No local operation-state fallback was introduced. D-032 is resolved. The owner-found missed guide name interrupted the first acceptance path; the corrected source, package and eight current guides were reviewed before renewed acceptance. The [central evidence report](../../../docs/work/2026-09-09-w19-r4-project-assets-and-persona-discovery/evidence.md) preserves prior build limits, A1–A12 results, the fresh-agent transcript, package identities and EP1–EP5 observations.

The corrected implementation suite passed 1,087 tests in 71 files. That result remains bound to its tested package. The later owner commits `41fb303` and `dc409fd` added documentation evidence rules and remain intact; focused checks cover the current delivery. Automated review is not qualified-human UAT. No new `O-###` or `NUAT-###` was needed for this bounded correction. W20 R0 and W21 R0 remain paused. R3 remains closed at `dabd0b36`. The owner requested this closeout and the implementation commit; no package archive move or publication was requested.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [Design](../../../docs/designs/2026-09-09-project-assets-and-persona-discovery.md) | Accepted asset, Persona and Store-backed migration boundary. |
| [Plan](../../../docs/plans/2026-09-09-w19-r4-project-assets-and-persona-discovery/00-overview.md) | Completed one-phase plan and current-owner trace. |
| [Work backlog](../../../docs/work/2026-09-09-w19-r4-project-assets-and-persona-discovery/00-index.md) | Completed tasks, owner acceptance and paused follow-on waves. |
| [Evidence report](../../../docs/work/2026-09-09-w19-r4-project-assets-and-persona-discovery/evidence.md) | Central acceptance-case and experience findings, supporting captures and review limits. |
| [Risk register](../../../docs/prd/03-open-questions-and-risk-register.md#d-032-project-asset-consolidation-and-persona-discovery-remain-incomplete) | Closed D-032 and corrected current Persona and path decisions while preserving history. |
| [Guide contract](../../system/contracts/guide-contract.md) | Current coverage verdicts, effective audience targets and current resource names. |
| [History contract](../../system/contracts/history-record-contract.md) | New Maintainer headings with historical Developer compatibility. |

### Maintainer

| Path | Description |
| --- | --- |
| [Guide authoring](../../../docs/assets/maintainer/template-contracts-guide-authoring.md) | Current templates and effective Persona targets. |
| [Template assets and routers](../../../docs/assets/maintainer/template-assets-and-generated-routers.md) | On-demand assets and selected root routers. |
| [State boundaries](../../../docs/assets/maintainer/maintainer-docs-assets-and-runtime-state-boundaries.md) | Store-owned operation state and declarative local config. |
| [Skills catalog](../../../docs/assets/maintainer/skills-catalog-and-distribution-model.md) | Current guide paths and audience labels. |
| [Dogfood operations](../../../docs/assets/maintainer/maintainer-dogfood-and-maintainer-operations.md) | Upstream source followed by checked package and public installed CLI. |
| [Packaging reference](../../../docs/assets/maintainer/release-packaging-validation-and-release-reference.md) | Current Store-safe delivery proof. |

### User

| Path | Description |
| --- | --- |
| [First installation](../../../docs/assets/user/getting-started-installing-make-docs.md) | Store authority, local identity and required-state refusal. |
| [Installation lifecycle](../../../docs/assets/user/cli-lifecycle-managing-installations.md) | Config identity, supported recovery and explicit Store removal choice. |
