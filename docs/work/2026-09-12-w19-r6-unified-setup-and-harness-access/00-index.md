---
title: "W19 R6 Unified Setup and Harness Access Work"
kind: "work"
status: "active"
coordinate: "W19 R6"
follow_on:
  route: "implementation-loop"
  next_prompt: ".make-docs/system/references/execution-workflow.md"
  why: "P3 must correct product authority before it changes the P2 implementation or runs installed acceptance."
  coordinate_handoff: "Keep P1 incomplete, keep P2 as superseded evidence, and use W19 R6 P3 for the next authorized work."
source:
  type: "prd"
  path: "../../prd/07-cli-command-surface-and-lifecycle.md"
---

# W19 R6 Unified Setup and Harness Access Work

## Purpose

Finish unified setup and harness access through the P3 authority reset and static adapter model.

P1 is incomplete. P2 contains useful code and evidence, but its active path followed an obsolete Playbooks conformance contract. P2 is superseded. P3 owns the authority correction, product cleanup, and installed proof.

## Human Experience Trace

| Promise | Source design and plan | Owning PRDs | Work phase | Evidence | Implementation gate | Obligation |
| --- | --- | --- | --- | --- | --- | --- |
| Explain system, project, and Store effects before approval. | [P3 design](../../designs/2026-09-14-static-harness-adapters-and-conformance-retirement.md), [plan](../../plans/2026-09-12-w19-r6-unified-setup-and-harness-access/00-overview.md) | PRDs 07, 28, 39 | [Phase 3](03-static-harness-adapters-and-conformance-retirement.md) | Installed terminal review and transcript assertions | Exact grouped review passes | None |
| Complete missing system setup inline. | Same | PRDs 07, 24, 28, 39 | Phase 3 | Production-path failure and resume matrix | Separate machine and project proof passes | None |
| Keep resource reads Store-free. | Same | PRDs 17, 25, 39 | Phase 3 | Store-absent, locked, denied, and no-session tests | All cases pass through source and packed CLI | None |
| Remove fresh document selection and preserve old partial projects. | Same | PRDs 07 and 39 | Phase 3 | Fresh and legacy installed inventories | No silent expansion | None |
| Show safe methods from static product-owned adapters. | Same | PRDs 25 and 28 | Phase 3 | Direct adapter tests and real Codex and Claude Code operations | No tuple, registry, provider, model, or runtime gate | None |
| Keep repeat setup safe and visible. | Same | PRDs 24, 28, 38, 39 | Phase 3 | Idempotence, drift, and blocker-action tests | No unreviewed writes or rerun loop | None |
| Preserve a valid machine change after project failure. | Same | PRDs 07, 28, 39 | Phase 3 | Failure injection and project-only resume proof | No repeated machine write | None |

## Phase Map

| File | Purpose |
| --- | --- |
| [01-unified-setup-and-harness-access.md](01-unified-setup-and-harness-access.md) | Retain the P1 foundation code and failed acceptance record. This phase is incomplete and not accepted. |
| [02-corrective-production-path-and-acceptance.md](02-corrective-production-path-and-acceptance.md) | Retain the P2 code and evidence record. This phase is superseded because it used invalid retained authority. |
| [03-static-harness-adapters-and-conformance-retirement.md](03-static-harness-adapters-and-conformance-retirement.md) | Reset authority, complete static harness setup, remove unused conformance work, and pass installed Human Experience acceptance. |
| [evidence.md](evidence.md) | Record the P1 and P2 limits, the P3 correction, and final acceptance proof. |

## Usage Notes

- Use the [P3 design](../../designs/2026-09-14-static-harness-adapters-and-conformance-retirement.md), [plan](../../plans/2026-09-12-w19-r6-unified-setup-and-harness-access/00-overview.md), and corrected current PRDs as authority.
- Read P1 and P2 as prior implementation evidence. Do not resume P2. Execute P3 only after implementation approval.
- Preserve unrelated worktree edits. At the live implementation baseline, `wizard.ts` and `wizard.test.ts` were clean.
- Keep system and project effects separate in code, tests, evidence, and review.
- Do not add Pi support, broad CLI cleanup, a local Store, a service process, or a new project undo path.
- Automated Implementation Testing and Guided Progress Review are selected. Performance Testing and Unassisted Goal Testing are `not-needed-now` for the reasons in Phase 3.
- Human Experience Review is the acceptance lens. It is not a fifth testing type.

## Guide Coverage

- User: [Setting Up Projects and Harness Access](../../assets/user/cli-setting-up-projects-and-harness-access.md).
- Maintainer: [Maintaining Setup and Harness Access](../../assets/maintainer/cli-maintaining-setup-and-harness-access.md).
- Evidence and current limits: [W19 R6 evidence](evidence.md).

## Implementation Gate

Status: `p1-incomplete; p2-superseded-invalid-authority; p3-authority-package-ready; p3-implementation-not-authorized`.

P1 produced useful foundation code and automated checks. It is not accepted feature delivery.

P2 connected setup to the old dynamic conformance system. This made tuple identity and result promotion part of the production gate. The tests correctly enforced that P2 authority. The authority did not match the current product need.

P3 removes the false exact-fact gap. It uses static product-owned adapters. It keeps valid setup, config, Store, and native safety work. D-033 remains open until P3 passes its ten hard close rules.

This package does not authorize staging, commits, package installation, publication, release, or a change to a real harness.

## Intended Follow-On

This handoff is advisory-default-but-overridable. It does not authorize P3 implementation or external actions.

- Route: `implementation-loop`
- Next step: Review and authorize [Phase 3](03-static-harness-adapters-and-conformance-retirement.md). Then execute its authority-reset stage first.
- Why: Product cleanup must follow the corrected static adapter authority.
- Coordinate Handoff: Use `W19 R6 P3` for authority changes, implementation, evidence, and later commits.
