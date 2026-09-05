---
title: "W19 R1 P8 Preflight Decision Closeout"
kind: "history"
status: "completed"
date: "2026-09-05"
client: "Codex Desktop"
coordinate: "W19 R1 P8"
repo: "make-docs"
branch: "make-docs-v2"
summary: "Recorded the approved legacy scenario retirement scope and kept P8 implementation gated."
---

# W19 R1 P8 Preflight Decision Closeout

## Changes

The owner approved retiring four legacy packaging scenarios from current coverage: `dependency-check-both-directions`, `plugin-marketplace-install`, `skills-bundle-discovery-invocation`, and `uninstall-backup-cleanliness`. P8 will not retarget these cases. Their source history, results, and evidence links remain. Shared lab tools remain where they serve current product capabilities. Old results cannot prove current support.

PRD 03 now separates retired packaging claims from open checks for current product behavior. PRD 43 records the approved current-coverage boundary. The P8 backlog records the decision in its existing Stage 1 closeout and task t16. It keeps P9 and P10 checks with their existing owners. It adds no duty to replace the four retired cases. P7 work and history records were updated separately from accepted P7 evidence.

The document update passed focused validation and is ready for preflight closeout. Product choices are settled. The separate decision commit required by P8 t7 has not been authorized or made. P8 implementation is not authorized and has not started. Stage 1 unlock still requires the fresh removal trace, authority digests, replacement proof, backup/restore coverage, lock/quiescence checks, finite budget, and explicit no-blocker/no-unknown-consumer result. This review supplies no deletion proof, budget approval, support verdict, or new Naive-UAT run.

Validation passed: `make-docs run prd authority validate --target-root . --json` reported no diagnostics across 39 PRDs. The managed path audit reported no findings across 83 files. Focused checks covered all seven changed Markdown files, 475 relative file links, and 10 local heading anchors. History headings, phase structure, task IDs, P8 checkbox states, portable paths, and whitespace passed. No runtime test suite was run for this document-only change.

The record uses `.make-docs/archive/history/` because the current documentation router and path contract assign managed archive and provenance records there. The generic system router and older history template still contain conflicting archive text. This update follows the specific current archive route. It does not move an archive or change a router or system resource.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [P8 work](../../../docs/work/2026-08-14-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/08-traced-playbook-protocol-retirement.md) | Approved four-scenario retirement scope, preserved history and shared tools, and pending implementation gates. |
| [PRD 03](../../../docs/prd/03-open-questions-and-risk-register.md) | Current v2 decisions and remaining current-product checks. |
| [PRD 43](../../../docs/prd/43-conformance-scenario-model-and-execution-kits.md) | Current coverage excludes the four retired packaging cases and does not reuse old results as current support proof. |
| [P7 work](../../../docs/work/2026-08-14-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/07-naive-uat-workflow-persona-and-evidence.md) | Separate P7 closeout from accepted implementation and test evidence. |

### Developer

None this session.

### User

None this session.
