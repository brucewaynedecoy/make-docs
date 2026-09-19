---
title: "W19 R2 Phase 1: PRD Authority and Target Inventory"
kind: "plan"
status: "draft"
coordinate: "W19 R2 P1"
---

# W19 R2 Phase 1: PRD Authority and Target Inventory

## Purpose

Make [Performance Evidence Governance](../../designs/2026-08-12-performance-testing-guardrails.md) current product authority before any resources or code are changed. This phase repeats the bounded preflight, creates PRD 48, updates exact consumers surgically, and stops for owner review.

## Preconditions

- The owner has approved the W19 R2 plan and separately authorized PRD maintenance.
- W19 R1 has reconciled the shared Make Docs v2 resource, workflow, state, and Naive-UAT/Persona boundaries.
- The active PRD set has been re-read from `docs/prd/00-index.md`; no newer authority owns this coherent subject and slot 48 remains available.
- Free disk space and dirty-state allowlists are recorded before any index refresh or validator run.

## Bounded Target Inventory

Scan active `docs/prd/**/*.md` only for:

- explicit latency, throughput, capacity, duration, percentile, percentage, regression, artifact-size, memory, compute, or resource numbers;
- absolute or target-shaped language such as fast, instant, real-time, zero-regression, at-scale, production-grade, or quick;
- work-like budgets or thresholds accidentally embedded as product authority; and
- existing evidence, benchmark, or support claims that may be mistaken for performance authority.

For each result, record:

1. exact PRD and owning section;
2. protected outcome and current source authority;
3. performance applicability disposition;
4. target class if applicable;
5. PRD maintenance decision and reason; and
6. whether a material former contract needs Requirement History.

The current preflight found no numeric performance targets. It found PRD 38's qualitative "quick access" phrase plus the independent one-result conformance and one-run naive-UAT sufficiency rules in PRDs 20 and 46. Do not reinterpret the latter two as performance sample counts.

## New Capability Authority

Create `docs/prd/48-performance-evidence-governance.md` with product-oriented frontmatter and no document-level coordinate. Its normative sections own:

- applicability: `required-now`, `characterize-now`, `defer-required`, `not-needed`, and `reject-unsupported`;
- maturity-based proportionality without exemptions or automatic thresholds;
- target classes and the single authority rule by class;
- stable append-only `PERF-###` identities, meaningful profile versions, required fields, and superseding lineage;
- product-owned hard profiles versus bounded phase-owned engineering/characterization/experiment profiles;
- explicit owner-approved promotion from plan/work guardrail to one superseding PRD-owned profile;
- predeclared measurement, comparability, uncertainty, outlier visibility, and environmental variance treatment;
- correctness, safety, durability, security, privacy, accessibility, portability, cost, and maintainability as non-sacrificable constraints;
- finite evidence budgets, affected-check-only reruns, diminishing-return stops, and unchanged-result reuse;
- `pass`, `fail`, `revise`, `blocked`, and `waived`, plus severity, reproducibility, findings, escalation, and support-scope limits;
- expiry and release invalidation without automatic execution or budget replenishment;
- requalification only through a separately authorized, newly budgeted event that permits exactly one bounded qualification execution on an unchanged fingerprint, after which unchanged repeats are prohibited;
- repository-canonical knowledge, optional operational evidence capture, and rebuildable non-authoritative projections; and
- documentation-first delivery and limits on future deterministic automation.

PRD 48 must not declare universal targets, sample counts, statistics, environments, budgets, or benchmark infrastructure.

## Existing Owner Updates

Use the exact section targets in [the overview](00-overview.md#existing-prds-to-update). Split writing into disjoint PRD groups, then reserve shared surfaces for assembly:

| Group | PRDs | Purpose |
| --- | --- | --- |
| Delivery | 06, 10 | Upstream-first resources, package/dogfood proof, and no claim promotion. |
| Lifecycle | 14, 18 | Coverage, phase gates, conservative adoption, and migration safety. |
| Proof boundaries | 20, 43, 44, 46 | Keep support, conformance, lab, and naive UAT semantically independent. |
| State and obligation | 38, 45 | Optional run projection, repository authority, deferred outcomes, and waiver remediation. |
| Shared assembly | 00, 03 | Add the new capability and risks only after subject PRDs settle. |

PRDs 21, 25, and 39 receive no duplicate substantive authority in this phase. PRD 21's layout is consumed from W19 R1. PRDs 25 and 39 remain unchanged until a later owner explicitly admits a validator operation.

## Requirement History

Add a history entry only when this phase materially replaces, removes, or reclassifies an existing product contract. Each entry records date, `W19 R2`, affected requirement, previous contract, replacement contract, rationale, and a resolving source link. Additive links and the new PRD 48 do not need history.

## Shared Surface Assembly

After all subject PRDs are stable:

- add PRD 48 to the index as a `capability` with current status and direct related authorities;
- update related-authority links only where navigation improves discovery;
- add or update risk-register entries for invented targets, plan/work authority leakage, unbounded reruns, expired-evidence reuse, and optional-state authority drift;
- preserve every stable D/Q/R/O identity and avoid duplicating an existing item; and
- leave the glossary unchanged unless execution finds a truly ambiguous term not defined by PRD 48.

## Worker Boundaries

Each worker owns an exact file allowlist. A dedicated new-PRD worker writes PRD 48; consumer groups are disjoint; a shared-surface worker writes 00 and 03 only after subject work. The coordinator writes nothing while delegation is available. No worker edits designs, plans, work backlogs, templates, code, tests, or generated copies in this phase.

## Acceptance

- Every inventory candidate has both a performance disposition and one PRD maintenance decision with a reason.
- PRD 48 is coherent, product-oriented, and complete without arbitrary universal numbers.
- All existing updates are surgical and preserve unrelated authority.
- Product targets and plan/work guardrails remain distinguishable by canonical owner and gate effect.
- Requirement History is non-normative and used only when material.
- Relative links and anchors resolve.
- The PRD-authority validator passes as a regression check.
- The dirty-state allowlist contains only authorized PRD files in addition to the accepted designs and plan bundles.

## Handoff

Stop for owner review of the maintained PRD authority. PRD completion does not authorize work generation or implementation. Only after separate work-generation authorization may the W19 R2 delta backlog render Phases 2-5 into executable tasks.
