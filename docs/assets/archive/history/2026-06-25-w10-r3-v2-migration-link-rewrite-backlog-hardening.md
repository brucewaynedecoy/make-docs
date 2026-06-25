---
date: "2026-06-25"
client: "Codex Desktop"
coordinate: "W10 R3"
repo: "make-docs"
branch: "make-docs-v2"
status: "completed"
summary: "Hardened V2 migration backlogs around packaged Markdown link rewriting."
---

# V2 Migration Link-Rewrite Backlog Hardening

## Changes

Updated the active V2 work backlogs so documentation tree moves during V1-to-V2 migration are treated as packaged CLI/shared-core behavior, not as repo-local dogfood cleanup. W10 R3 now carries the primary fixture, classifier, disposition, and validation hardening requirements for deterministic Markdown link rewrites, review/manual-review stops, and full destination-tree link validation; W9 R2, W9 R5, and W10 R4 now state that dogfood moves are evidence or fixture sources only, not shipped migration proof.

| Area | Summary |
| --- | --- |
| W10 R3 compatibility migration | Added backlog addenda for moved Markdown-tree fixtures, documentation ownership classification, reviewed move plans, safe Markdown rewriting, blocked unsafe rewrites, and destination-tree validation. |
| W9 R2 and W9 R5 dogfood moves | Marked existing dogfood moves and path fixtures as migration evidence, not sufficient V2 user migration acceptance. |
| W10 R4 package/source-of-truth work | Added package/source-of-truth guardrails requiring migration-relevant behavior to come from packaged CLI/shared-core logic or be recorded as a blocking dependency. |

## Documentation

### Project

| Path | Description |
| --- | --- |
| [W10 R3 compatibility backlog](../../../work/2026-06-23-w10-r3-compatibility-audit-and-migration-disposition/00-index.md) | Primary backlog owner for packaged migration hardening around documentation-tree move planning, link rewriting, review routing, and validation. |
| [W9 R2 tool-directory backlog](../../../work/2026-06-23-w9-r2-tool-directory-system-custom-resource-tiers/00-index.md) | Added guardrails that classify W9 R2 path work as fixture evidence rather than V2 migration proof. |
| [W9 R5 library/archive-history correction](../../../work/2026-06-25-w9-r5-v2-library-and-archive-history-ia-correction/03-dogfood-migration-and-link-repair.md) | Added guardrails that classify the W9 R5 dogfood migration and changed-file link checks as insufficient for shipped user migration acceptance. |
| [W10 R4 template/package source-of-truth backlog](../../../work/2026-06-23-w10-r4-template-package-dogfood-source-of-truth-contract/00-index.md) | Added package/source-of-truth prerequisites so dogfood cleanup cannot be cited as packaged migration behavior. |

### Developer

None this session.

### User

None this session.
