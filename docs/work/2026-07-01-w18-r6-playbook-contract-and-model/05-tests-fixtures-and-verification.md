---
title: "Phase 5: Tests, Fixtures, and Verification"
kind: "work"
status: "active"
coordinate: "W18 R6 P5"
source:
  type: "prd"
  path: "docs/prd/34-revise-playbook-contract-and-model.md"
---

# Phase 5: Tests, Fixtures, and Verification

## Purpose

Prove the contract, parser, validator, and migrated assets against the D7 verification requirements so contract violations are caught at validate time, not at run or package time.

## Overview

This phase lands the unit-test and fixture suite for the library and the closing verification passes across upstream and dogfood locations. It is the closure gate for the whole backlog: earlier phases are not done until their behavior survives this phase's coverage.

## Source PRD Docs

- [34 Revise Playbook Contract and Model](../../prd/34-revise-playbook-contract-and-model.md)
- [29 Revise Playbook Contract Run Playbook](../../prd/29-revise-playbook-contract-run-playbook.md)
- [33 Enhance Playbook Packaging and Harness Adapter Registry](../../prd/33-enhance-playbook-packaging-and-harness-adapter-registry.md)

## Stage 1 - Fixture and Unit-Test Suite

### Tasks

- [ ] t1: Build valid fixtures, including a fixture equivalent to the architecture artifact Section 2.6 worked example, and assert it parses without error (R-TEST-1, R-WF-7).
- [ ] t2: Build at least one failing fixture per diagnostic code — PB-DOC-001, PB-FM-002, PB-DEP-003, PB-DEP-004, PB-WF-005, PB-WF-006, PB-FILE-007 — and assert each triggers its exact code and severity (R-TEST-1).
- [ ] t3: Cover required-heading-order violations, including missing, reordered, and interleaved-unknown-section cases (R-TEST-2, R-DOC-5, R-DOC-7).
- [ ] t4: Cover dependency-table schema violations: wrong columns, invalid kind or requirement enums, and duplicate IDs (R-TEST-2, R-DEP-2, R-DEP-3).
- [ ] t5: Cover malformed and absent workflow blocks: zero blocks, two blocks, a `yaml` info string instead of `playbook`, and unparseable block content (R-TEST-2, R-WF-1).
- [ ] t6: Cover cross-reference integrity violations in both directions — step references to unknown dependency IDs and routing targets to unknown step ids — plus the `requires`-targets-`optional` contradiction and the unreferenced-dependency warning (R-TEST-2, R-DEP-4).
- [ ] t7: Cover legacy-filename detection for `kind: playbook` on a plain `<slug>.md` file (R-TEST-2, R-DOC-2).
- [ ] t8: Assert fail-soft diagnostic collection (multiple problems yield multiple diagnostics) and fail-closed runnability (any error marks the model not runnable) (R-MODEL-3).

### Acceptance criteria

- Every diagnostic code in the catalog has at least one failing fixture that triggers it (R-TEST-1).
- Every R-TEST-2 coverage area has explicit assertions.
- Tests exercise the library through its pure interface, with fixture reads as the only filesystem interaction.

### Dependencies

- Phase 3 validator and Phase 4 operations.

## Stage 2 - Cross-Location Verification and Closeout

### Tasks

- [ ] t9: Run validation over all shipped default Playbooks in `packages/docs/template/` and assert zero errors (R-TEST-3).
- [ ] t10: Run validation over the dogfood instance's `docs/assets/playbooks/**` and assert the migrated default Playbook validates with zero errors downstream (R-TEST-3).
- [ ] t11: Verify contract/validator parity by walking the Phase 1 contract's stated rules against the implemented validation layers and diagnostic catalog, and fix whichever side drifted (R-AUTH-3).
- [ ] t12: Run the standard package and consistency validation relevant to the touched surfaces (build, unit tests, defaults validation, and pack smoke where shipped files changed) so template, dogfood, and packaged copies agree.
- [ ] t13: Record the phase history breadcrumbs per the history-record contract with the `W18 R6 P<N>` coordinates as phases close.

### Acceptance criteria

- Zero validation errors for default Playbooks in both the upstream template and the dogfood instance (R-TEST-3).
- A Playbook that violates the contract fails `playbook.validate` before any run or packaging attempt is possible (R-TEST-4).
- No parity gap remains between contract text, validator behavior, and diagnostic catalog at closeout.

### Dependencies

- Stage 1 suite; Phase 4 migrated assets.
