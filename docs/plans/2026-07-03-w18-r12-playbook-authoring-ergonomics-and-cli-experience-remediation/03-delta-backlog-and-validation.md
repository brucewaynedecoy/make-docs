---
title: "W18 R12 Phase 3: Delta Backlog and Validation"
kind: "plan"
status: "draft"
coordinate: "W18 R12"
---

# W18 R12 Phase 3: Delta Backlog and Validation

## Purpose

Generate the dependency-ordered W18 R12 delta backlog and run the closing validation pass over every document this round writes or annotates.

## Backlog Shape

Directory: `docs/work/2026-07-03-w18-r12-playbook-authoring-ergonomics-and-cli-experience-remediation/` with `00-index.md` plus four phase files. Task checkboxes use `- [ ] tN:` with phase-local IDs incrementing across the whole phase file; acceptance criteria are plain bullets; every phase names its PRD requirement anchors and cites its source PRD docs.

| Phase | Scope | Primary anchors |
| --- | --- | --- |
| P1 | Contract v2: dependencies-block parser replacing `dependency-table.ts`, frontmatter keys, heading spine, v2 schema identifier, pointed old-form diagnostics, upstream template and contract authoring, default Playbook and fixture migration | PRD 40 R-DEP, R-FM, R-HEAD, R-MIG, R-RIPPLE, R-TEST-1 |
| P2 | Compiler and hints on the v2 model: `probe`-targeted materialization (F1 root fix), regression fixtures, resume-hint retirement (F2) | PRD 40 R-FIX-1, R-DEP-3, R-TEST-2; PRD 41 R-FIX-2, R-TEST-3 |
| P3 | CLI grammar, `package.ship`, render layer, and ergonomics: plan/preview/write, `plan --output`, ship composite registration and MCP derivation, TTY render with `--json`/non-TTY invariance, run-id prefix and `--last`, flag defaults, precondition config, warning suppression | PRD 41 R-INV-1, R-RENDER, R-GRAM, R-RUNID, R-FLAG, R-NOISE, R-TEST-4/5/6 |
| P4 | Verification and reconciliation: full test sweep, PRD 37 and W18 R9 backlog reconciliation for invalidated assumptions, UAT-doc regeneration handoff note | PRD 40 R-TEST-1/2; PRD 41 R-TEST-3..6, R-SEQ-1/2; register R-026 |

Dependency order: P1 owns the model everything else compiles against; P2 consumes the v2 model's `probe` field; P3 renames and renders surfaces P2's operations expose; P4 verifies the whole and reconciles downstream consumers.

## Validation Pass

1. `npm run validate:defaults` — extend the consistency-test pins only if the register/index shape requires it; this round does not change the operation register itself, so no pin change is expected beyond what `package.ship` implementation (not this documentation round) will later require.
2. `python3 .make-docs/scripts/check_path_hygiene.py` over the changed docs.
3. Relative-link resolution across the design, plan, PRD 40/41, annotated baselines, index, register, and backlog.
4. Template conformance: revision-template headings in PRD 40/41; work index/phase headings and task/acceptance syntax in the backlog.
5. Traceability: every backlog phase cites PRD 40 and/or PRD 41 plus the still-constraining baselines; the effective requirement resolves by following change-note links from each impacted baseline to the newest change doc.
6. `git diff --check` for whitespace errors; no placeholders remain in any written doc.

## Exit Criteria

- The backlog exists with the four phases, dependency-ordered, decision-complete against phases 1–2 of this plan.
- All validation steps pass or their fix-ups are applied.
- Nothing was committed; the round awaits user review.
