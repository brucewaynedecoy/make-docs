---
title: "W21 R0 Phase 1 PRD Authority and Testing Model"
kind: "plan"
status: "draft"
coordinate: "W21 R0 P1"
source:
  type: "plan"
  path: "docs/plans/2026-08-28-w21-r0-proportionate-testing-and-human-centered-validation/00-overview.md"
---

# W21 R0 Phase 1: PRD Authority and Testing Model

## Purpose

Make the four-type testing model current product authority before any implementation or W20 R0 revision.

## Sources

- [Plan overview](00-overview.md)
- [Governing testing design](../../designs/2026-08-28-proportionate-testing-and-human-centered-validation.md)
- [PRD change management](../../../.make-docs/references/system/prd-change-management.md)
- [Active PRD index](../../prd/00-index.md)

## Preconditions

- Preserve the active PRD namespace.
- Do not renumber existing PRDs.
- Use PRD 50 only for the coherent ownerless testing-governance capability.
- Put current rules in normative sections.
- Put prior material rules only in non-normative Requirement History.
- Do not edit W20 R0 plan or work files in this phase.

## New Testing Authority

Create PRD 50 with requirements for:

- exactly four core testing types;
- the common current-decision process;
- `not-needed-now` as a valid result;
- affected-first automated proof and the focused, expanded, and release-grade levels;
- maturity-qualified selection;
- human testing experience;
- explicit gate effects;
- finite effort budgets and stop conditions;
- small evidence records and reuse;
- rerun triggers; and
- specialist-owner integration.

PRD 50 must not absorb the detailed `PERF-###` model from PRD 48 or the detailed human-executor and anti-coaching controls from PRD 46.

## Existing Owner Updates

Update the owners listed in the overview candidate matrix.

Use the following authority split:

- PRD 14 owns lifecycle routing and phase-close use.
- PRD 46 owns Unassisted Goal Testing details.
- PRD 48 owns Performance Testing details.
- PRD 49 owns the Human Experience Standard for the built result and the Human Experience Review lens.
- PRD 45 owns durable testing obligations.
- PRDs 20, 43, and 44 own support claims, scenarios, lab execution, and evidence.
- PRDs 06, 15, and 23 own system-resource delivery, router discovery, and document-body handoffs.
- PRD 47 owns Persona boundaries, not tester qualification by itself.

## Compatibility Rules

- Keep `docs/prd/46-naive-end-user-acceptance-testing.md` as the stable file path.
- Change its H1 and human-facing language to Unassisted Goal Testing.
- Keep existing `NUAT-###` identities valid.
- Do not bulk-rewrite historical designs, plans, work, results, or history records.
- Preserve `PERF-###` identities and valid performance evidence.

## Shared Authority Assembly

After owner documents settle:

1. update the PRD index;
2. add glossary definitions;
3. add the testing proportionality and gate-drift risk;
4. check related-document links;
5. add W21 R0 Requirement History to materially changed PRDs; and
6. run deterministic PRD authority validation.

## Worker Boundaries

When delegation is available, use separate write scopes for:

- PRD 50;
- lifecycle, obligation, and metadata owners;
- performance, unassisted, Persona, and Human Experience owners;
- conformance owners; and
- shared index, glossary, risk, and final link assembly.

## Acceptance

- A reader can identify all four core testing types and their distinct purposes.
- A test can be skipped because it cannot change a current decision.
- Every testing type has a clear default executor and gate effect.
- Guided Progress Review cannot become a formal sign-off gate.
- Unassisted Goal Testing is conditional and diagnostic by default.
- Performance remains maturity-qualified and authority-bound.
- Human Experience Review is a lens, not a fifth type.
- The active PRD validator exits zero.

## Handoff

Owner acceptance of the reconciled PRD set is required before Phase 2 implementation planning or any W20 R0 revision.
