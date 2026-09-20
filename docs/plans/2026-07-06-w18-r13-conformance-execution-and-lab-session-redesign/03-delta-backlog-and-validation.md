---
title: "W18 R13 Phase 3: Delta Backlog and Validation"
kind: "plan"
status: "draft"
coordinate: "W18 R13"
---

# W18 R13 Phase 3: Delta Backlog and Validation

## Purpose

Generate the dependency-ordered W18 R13 delta backlog and run the closing validation pass over every document this round writes or annotates.

## Backlog Shape

Directory: `docs/work/2026-07-06-w18-r13-conformance-execution-and-lab-session-redesign/` with `00-index.md` plus four phase files. Task checkboxes use `- [ ] tN:` with phase-local IDs incrementing across the whole phase file; acceptance criteria are plain bullets; every phase names its PRD requirement anchors, cites its source PRD docs, and maps its coverage to the design's reconciliation-inventory entries so the inventory is exhausted across the four phases (R-028).

| Phase | Scope | Primary anchors |
| --- | --- | --- |
| P1 | Asset reorganization and spec migration: `scenarios/packaging/` with domain-qualified ids, the four `codex-*` specs replaced by harness-agnostic definitions with `targets` maps (Codex bound; Claude Code/Pi as reported gaps), committed steps executable as written (the three D-023 defects gone from committed text), registry `plannedScenarios` re-linkage, `scenario.ts` schema (`domain`, `targets`, `discoveryKit`), `REQUIRED_FIRST_PASS_SCENARIOS` and referencing tests, README/router Scope extension | PRD 43 R-ORG, R-SCHEMA, R-DISC (schema half); inventory entries 4, 5, 6, 7 (ids/paths), 9, 12, 13 |
| P2 | The kit: `kit.ts` per-target generation consuming capability descriptors (interrogation block authored into the descriptor type), instrument scripts per bar stage, the discovery kit as R-021's plan's first instance, prompt rendering, disposable lab-session workspace mechanics, lab-session vocabulary and evidence homes (`.gitignore` entry retired, store lab area defined narrowly) | PRD 43 R-KIT, R-HOME, R-INST, R-PROMPT, R-DISC; PRD 44 R-NAME; inventory entries 6 (transcript pointer), 8, 16, 17 |
| P3 | Ingestion and operator modes: fail-closed result assembly from instrument outputs into the unchanged `recordConformanceRunOnRegistryEntry` seam, attestations recorded as attestations, `conformance/operator-modes.md` with the three modes (the parked walkthrough as human-mode raw material, never modified) | PRD 43 R-ING; PRD 44 R-EXEC, R-MODE; inventory entries 12 (operator-modes routing), 15 |
| P4 | Verification and reconciliation: the D14 test bar including executable-by-construction proofs (every required definition projects to a command sequence the current CLI accepts), the reconciliation-inventory sweep with grep proof, developer guide rewrite and claim-surface verification, W18 R9 backlog reconciliation note, register closures (D-023/D-024/D-025, R-028), UAT/operator handoff | PRD 43 D14 bar, D12 inventory; PRD 44 R-EXEC/R-NAME closure evidence; inventory entries 1–3, 10, 11, 14, 18, 19, 20 |

Dependency order: P1 owns the definitions and schema everything else loads; P2 generates kits from P1's definitions and the descriptors; P3 ingests what P2's instruments produce; P4 proves the whole and closes the register items on the grep evidence.

## Validation Pass

1. `npm run validate:defaults` — this documentation round changes no code or registry pins; the implementation round owns any consistency-pin movement.
2. `python3 .make-docs/scripts/check_path_hygiene.py` over the changed docs.
3. Relative-link resolution across the design, plan, PRD 43/44, annotated baselines, index, and backlog.
4. Template conformance: revision-template headings in PRD 43/44; work index/phase headings and task/acceptance syntax in the backlog.
5. Traceability: every backlog phase cites PRD 43 and/or PRD 44 plus the still-constraining baselines and names its PRD requirement anchors; the effective requirement resolves by following change-note links from each impacted baseline to the newest change doc; the four-phase inventory mapping covers all twenty D12 entries.
6. `git diff --check` for whitespace errors; no placeholders remain in any written doc; `UAT-W18-R7-R8.md` and `CONFORMANCE-RUN-codex-plugin.md` untouched.

## Exit Criteria

- The backlog exists with the four phases, dependency-ordered, decision-complete against phases 1–2 of this plan, with the reconciliation inventory fully allocated.
- All validation steps pass or their fix-ups are applied.
- Nothing was committed; the round awaits user review.
