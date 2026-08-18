---
title: "W18 R15 Phase 1: PRD Capability Authority and Baseline Reconciliation"
kind: "plan"
status: "draft"
coordinate: "W18 R15"
---

# W18 R15 Phase 1: PRD Capability Authority and Baseline Reconciliation

## Purpose

Turn both designs into active PRD authority before any reusable Make Docs resource changes. This phase creates two coordinated capability-authority documents for genuinely novel capabilities, updates existing PRDs in place where they already own the affected behavior, updates the living register and glossary, and fixes the traceability needed by the later work backlog.

## New PRD 45

Path: `docs/prd/45-deferred-obligation-governance.md`

PRD 45 uses the feature-oriented shape from `.make-docs/templates/system/prd-subsystem.md` and defines these requirement families:

| Anchor family | Required content |
| --- | --- |
| `R-OBL-ID` | Fixed `## Deferred Obligations` section, append-only `O-###` identity, record fields, statuses, terminal rationales, and pre-PRD handoff |
| `R-OBL-AUTH` | Canonical register ownership, bidirectional links, design/plan/PRD/work/history responsibilities, and no database-owned product meaning |
| `R-OBL-AUDIT` | Mandatory non-persona phase-close orphan audit, candidate sources, verdict mapping, blocking conditions, history idempotency, and operational evidence |
| `R-OBL-COMPLETE` | Exact `Phase complete`, `Capability partial`, `Capability complete`, and `Capability status unverified` semantics |
| `R-OBL-FLOW` | Change-plan disposition, PRD reconciliation, backlog mapping, phase-gate consumption, and later-work fulfillment |
| `R-OBL-STATE` | Repository versus Global Store boundary, evidence-loss behavior, cross-machine continuation, and non-authoritative projections |
| `R-OBL-COMPAT` | New-install behavior, first qualifying migration, modified-content stop, stable legacy IDs, no archive rewrite, and no required schema migration |
| `R-OBL-ACCEPT` | The eight end-to-end acceptance scenarios from the design and their evidence expectations |

PRD 45 must state that an optional or rejected future idea is not automatically an obligation. A candidate becomes `O-###` only when accepted authority establishes a required future outcome.

## New PRD 46

Path: `docs/prd/46-naive-end-user-acceptance-testing.md`

PRD 46 uses the feature-oriented shape from `.make-docs/templates/system/prd-subsystem.md`, links PRD 45 as a normative sibling dependency, and defines these requirement families:

| Anchor family | Required content |
| --- | --- |
| `R-NUAT-SCOPE` | Qualified naive tester, installed-product boundary, target user, isolation evidence, and non-persona coverage rule |
| `R-NUAT-ACTIVATE` | User-observable-slice enumeration, earliest safe activation, valid `none`, required future trigger/owner/coordinate/obligation link, and later trigger activation |
| `R-NUAT-MODES` | Separate automated, owner/architecture, naive UAT, visual/manual, accessibility, and visual-regression verdicts |
| `R-NUAT-GOAL` | Goal-oriented tester prompt, operator/tester view separation, anti-coaching, safety intervention, and no discoverability compensation |
| `R-NUAT-SCENARIO` | Stable `NUAT-###` identity, versioning, canonical PRD owner, required scenario fields, operator view, tester packet, and cross-subsystem backlinks |
| `R-NUAT-EVIDENCE` | Setup, teardown, consent, run fields, outcomes, base severity, reproducibility, interaction/visual/accessibility evidence, and finding identity |
| `R-NUAT-COVERAGE` | `create`, `update-existing`, `link-only`, and complete `none` mechanics plus candidate-table fields and non-substitution rules |
| `R-NUAT-GATE` | Phase-gate behavior for `pass`, `fail`, `revise`, `blocked`, and `none`; remediation, deferral, history, and rerun rules |
| `R-NUAT-STATE` | Repository versus Project State and raw-evidence boundaries, missing-evidence behavior, and non-authoritative projections |
| `R-NUAT-SCOPE-MATRIX` | Cross-platform support claims, non-GUI applicability, accessibility basis, visual-evidence applicability, and risk-based tester count |
| `R-NUAT-COMPAT` | Prospective adoption, classification of existing UAT/manual artifacts, stable historical paths and aliases, and no immediate store migration |
| `R-NUAT-FUTURE` | Documentation-first boundary plus the permitted and prohibited behavior of later validators, CLI/MCP operations, and projections |

PRD 46 includes the Ursa headless-Core versus first-usable-shell example only as an illustrative acceptance scenario. It must not create an Ursa-specific Make Docs convention or require edits in the Ursa repository.

## Canonical Scenario Ownership

The PRD execution fixes the scenario-section rule:

- Each active PRD document that owns a user-observable outcome may contain `## Naive UAT Scenarios`.
- A scenario that crosses subsystems is canonical in the PRD that owns the primary external outcome.
- Contributing PRDs add `### Change Notes` or requirement-level backlinks to that canonical `NUAT-###`.
- The new PRD 46 owns the reusable Make Docs scenario contract, not every consuming project's scenario instances.
- `docs/prd/03-open-questions-and-risk-register.md` owns deferred obligations and risks, not scenario bodies.
- Plans and work backlogs carry scenario references and outcomes; they never copy the canonical record.

## Living Register Migration

Update `docs/prd/03-open-questions-and-risk-register.md` in the same PRD reconciliation set:

1. Add one fixed `## Deferred Obligations` section before `## Confirmed Drift` so the existing drift/question/risk validation boundaries remain intact.
2. Add the section contract and `O-###` record shape without renumbering any existing item.
3. Inventory active deferral candidates from the two designs, active PRDs, active plans/work, and currently linked history.
4. Assign `O-###` only to accepted required outcomes.
5. Record reviewed optional future automation ideas as `not-an-obligation` in the PRD/change-round evidence, not as fake obligations.
6. Link any future naive-UAT trigger that remains genuinely owed to its obligation.
7. Mark capability status unverified until the maintainer dogfood's first orphan audit has valid Project State evidence.

The inventory is scoped to active authorities and the current governance change. It must not sweep or rewrite the entire archive.

## Index and Glossary

Update `docs/prd/00-index.md` to list PRDs 45 and 46 with their capability relationships and current status.

Update `docs/prd/04-glossary.md` with plain-language definitions for:

- deferred obligation;
- orphan audit and orphan finding;
- phase complete, capability partial, capability complete, and capability status unverified;
- naive end-user UAT and qualified naive tester;
- installed product and user-observable slice;
- tester packet and operator view;
- anti-coaching;
- `pass`, `fail`, `revise`, and `blocked`;
- support-scope cell;
- Project State evidence reference versus repository authority.

Terms must remain product-neutral and must not assume every Make Docs consumer builds software or a GUI.

## Baseline Reconciliation

Reconcile the exact existing-authority set in [the overview](./00-overview.md#current-authority-status). Each affected PRD:

- updates the requirement text it already owns rather than delegating effective meaning to another `revise-*` document;
- adds a concise W18 R15 reconciliation note naming PRD 45, PRD 46, or both;
- links to the applicable capability requirement anchor;
- preserves unrelated historical wording and stable document numbering;
- does not imply a store-schema, CLI, MCP, or runtime change.

PRD 38's annotation is especially narrow: existing evidence seams are consumed; no new evidence kind, table, payload schema, lock behavior, or write path is required.

PRD 22's annotation explicitly reconciles the rule that testing/UAT is non-persona coverage while tester and facilitator Playbooks remain persona-targeted reader artifacts.

PRDs 20 and 37 receive no default annotation. During PRD execution, verify that their conformance language does not claim naive-UAT equivalence. If it does, add the smallest `### Change Notes` clarification linking PRD 46; otherwise record the verification in execution evidence.

## Open Decisions and Risks

Any newly discovered ambiguity is added to PRD 03 under the existing `Q-###` or `R-###` namespaces. It becomes `O-###` only if resolution or mitigation leaves an accepted future outcome owed.

PRD 46 records these fixed planning resolutions rather than reopening them:

- one canonical scenario owner with backlinks;
- current Project State evidence kinds are sufficient for the documentation-first round;
- raw evidence layout remains outside this round;
- PRD product authority controls deferral, narrowing, cancellation, and supersession;
- one valid independent run per support-scope cell is the shared minimum, with project risk rules allowed to require more;
- accessibility basis is product-surface appropriate and not web-only;
- the combined coordinate is W18 R15.

## Exit Criteria

- PRD 45 and PRD 46 exist at capability-authority paths with complete requirement families, acceptance criteria, source anchors, and cross-links.
- PRD 03 has one valid deferred-obligations section and a scoped migration disposition.
- PRD 00 and PRD 04 reflect the new authorities and terminology.
- Every required in-place authority reconciliation resolves to the applicable capability requirement.
- No PRD file was renumbered, archived, or silently rewritten.
- No implementation resource, dogfood copy, work backlog, runtime, database, or external project was changed during this phase.
