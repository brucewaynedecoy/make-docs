---
title: "W18 R15 Phase 2: System Contracts and Scenario Governance"
kind: "plan"
status: "draft"
coordinate: "W18 R15"
---

# W18 R15 Phase 2: System Contracts and Scenario Governance

## Purpose

Define the exact documentation-system resources that will encode PRDs 45 and 46. All shipped defaults are authored upstream under `packages/docs/template/`; no maintainer-installed `.make-docs/` or `docs/` copy is hand-authored.

## New Upstream Resources

Create these reusable system resources:

| Upstream source path | Installed projection | Responsibility |
| --- | --- | --- |
| `packages/docs/template/.make-docs/contracts/system/deferred-obligation-contract.md` | `.make-docs/contracts/system/deferred-obligation-contract.md` | `O-###` register, statuses, authority chain, orphan audit, completion language, evidence boundary, and compatibility |
| `packages/docs/template/.make-docs/contracts/system/naive-uat-contract.md` | `.make-docs/contracts/system/naive-uat-contract.md` | tester qualification, activation, `none`, modes, anti-coaching, scenarios, runs, findings, evidence, gates, migration, and future-automation limits |
| `packages/docs/template/.make-docs/templates/system/naive-uat-scenario.md` | `.make-docs/templates/system/naive-uat-scenario.md` | canonical operator view plus safe tester-packet projection for one `NUAT-###` scenario |

The two contracts cross-link rather than duplicate shared trigger, obligation, finding, capability-status, history, and Project State rules.

## Existing Contract Updates

Update these upstream contracts:

| Source path | Required change |
| --- | --- |
| `packages/docs/template/.make-docs/contracts/system/output-contract.md` | Add the fixed PRD register section, `O-###` and `NUAT-###` authority rules, scenario-owner rule, and phase/capability status language |
| `packages/docs/template/.make-docs/contracts/system/coverage-pass-contract.md` | Add the mandatory non-persona orphan audit and separate naive-UAT candidate mode while preserving the base verdict spine and testing/UAT non-persona scope |
| `packages/docs/template/.make-docs/contracts/system/history-record-contract.md` | Add concise obligation deltas, orphan-audit outcome, material naive-UAT outcomes/findings, and links without raw run-log duplication |

The current Playbook contract remains structurally sufficient. New Playbooks conform to it; this plan does not alter the Playbook schema merely to add workflows.

## Reference Updates

Update these upstream references:

| Source path | Required change |
| --- | --- |
| `packages/docs/template/.make-docs/references/system/lifecycle.md` | Add orphan-audit and naive-UAT consumption to the build loop; preserve design -> plan -> PRD -> work -> implementation ordering |
| `packages/docs/template/.make-docs/references/system/execution-workflow.md` | Require phase candidate enumeration, affected-obligation disposition, scenario or valid `none`, evidence references, and capability status at closeout |
| `packages/docs/template/.make-docs/references/system/planning-workflow.md` | Require an obligation-disposition section and user-observable-slice planning; keep PRD generation and implementation approval separate |
| `packages/docs/template/.make-docs/references/system/prd-change-management.md` | Define same-change-set updates for requirements, obligations, scenarios, findings, cancellation, supersession, scope narrowing, and backlinks |

No standalone phase-gate reference exists in the current template. Phase-gate behavior is updated through the coverage contract, execution workflow, lifecycle reference, work templates, and lifecycle Playbook rather than creating an unnecessary parallel authority.

## Prompt Updates

Update the following upstream prompts:

| Prompt | Required behavior |
| --- | --- |
| `designs-to-plan-change.prompt.md` | Load the obligation register, classify affected obligations, enumerate user-observable slices, and keep optional automation separate |
| `plan-to-prd-change.prompt.md` | Generate PRD obligation/scenario authority and required baseline annotations from the plan |
| `prd-change-to-work.prompt.md` | Preserve `O-###`, `NUAT-###`, finding, requirement, and phase-gate traceability in the delta backlog |
| `coverage-pass-prd-reconciliation.prompt.md` | Reconcile requirement, obligation, scenario, finding, and disposition changes together |
| `coverage-pass-testing-uat.prompt.md` | Enumerate all six test/review modes separately; emit complete naive-UAT candidates and reasoned `none` records; state `coverage_scope: non-persona` |
| `session-to-history-record.prompt.md` | Summarize durable obligation and UAT deltas once without copying raw evidence or operational logs |

The testing/UAT starter must not use persona selection to filter product coverage. `target_user` describes the product audience; Playbook persona remains a separate artifact field.

## Template Updates

Update these upstream templates:

| Template | Required change |
| --- | --- |
| `prd-risk-register.md` | Add the fixed deferred-obligations section, record field table, ID/status rules, and legacy-state note |
| `plan-prd-change.md` | Add obligation dispositions, user-observable candidates, proposed scenario ownership, and future-trigger routing |
| `work-index.md` | Add source obligation/scenario inventory and capability-status summary |
| `work-phase.md` | Add applicable obligation/scenario/finding anchors, separate testing-mode decisions, and phase/capability closeout language |
| `history-record.md` | Add concise obligation/audit/UAT outcome and disposition fields or headings consistent with the history contract |

The naive-UAT scenario template is a section template, not a new top-level project artifact. Projects insert it into the canonical owning PRD.

## Deferred-Obligation Contract Details

The contract must encode:

- stable append-only `O-###` identity;
- all required record fields from the design;
- `Deferred`, `Active`, `Fulfilled`, `Cancelled`, and `Superseded`;
- exact terminal-rationale and replacement-link rules;
- pre-PRD temporary ownership and first-PRD migration;
- bidirectional authority links without a second register;
- orphan candidate sources and eight audit verdicts;
- incomplete-audit blockers;
- exact phase/capability completion vocabulary;
- database-loss and cross-machine behavior;
- conservative first-qualifying migration;
- optional future validator/projection boundaries.

The contract must explicitly say that an orphan audit is non-persona coverage and does not replace documentation, Playbook, history, PRD reconciliation, validation, UAT, accessibility, or other manual testing.

## Naive-UAT Contract Details

The contract must encode:

- the full qualified-tester boundary for humans and isolated agents;
- installed-product and public-resource limits;
- candidate enumeration at each stage and assembled phase;
- earliest safe activation and complete valid-`none` fields;
- separate test/review modes;
- goal-oriented prompts and anti-coaching;
- stable `NUAT-###` identity and versioning;
- the complete scenario/run/finding field contracts;
- setup, teardown, consent, privacy, redaction, and retention responsibilities;
- `pass`, `fail`, `revise`, and `blocked`;
- critical, major, moderate, and minor severity;
- support-scope, platform, non-GUI, visual, and accessibility rules;
- phase-gate and later-work consumption;
- repository, Project State, raw-evidence, and projection boundaries;
- conservative classification of existing manual/UAT artifacts;
- future automation checks versus prohibited authority decisions.

## Tester-Packet Safety

The scenario template has one canonical record and two rendered views:

1. The operator view contains all fields.
2. The tester packet contains only the realistic situation, user goal, starting state visible to a real user, allowed public resources, genuine constraints, consent notice, and tester-owned teardown steps.

The template marks operator-only fields explicitly. Documentation checks must be able to detect accidental copying, even before a dedicated validator exists. Required anti-leak checks include internal terms, requirement IDs, work coordinates, expected answers, success criteria, hidden setup, known defects, and prescribed product steps.

## Router and Instruction Updates

Update the upstream `AGENTS.md` and mirrored `CLAUDE.md` routers only where needed to route authors to the new contracts and templates:

- `.make-docs/contracts/system/`;
- `.make-docs/references/system/`;
- `.make-docs/references/system/prompts/`;
- `.make-docs/templates/system/`;
- `docs/prd/`;
- `docs/work/`;
- `docs/assets/playbooks/`.

Managed instruction updates must follow PRD 15 ownership rules and must not duplicate the full contract into every router. Routers point to authority; they do not become authority.

## Explicit Non-Goals

- No `packages/cli/src/**` change.
- No new operation registry entry, CLI command, MCP tool, or shared operation core.
- No validator implementation.
- No Global Store table, schema version, evidence kind, path layout, retention service, or projection.
- No automatic project migration.
- No skill or plugin.
- No binary evidence committed by default.
- No direct authoring in maintainer-installed `.make-docs/` or `docs/` trees.

## Exit Criteria

- The upstream resource catalog is exact and contains no filename ambiguity.
- Shared rules live in the two contracts and are referenced rather than copied.
- Coverage remains non-persona while reader-facing Playbooks remain persona-targeted.
- Scenario and obligation templates preserve one canonical repository authority.
- No runtime or database implementation slipped into the documentation-first scope.
- Every modified router points to the correct upstream-installed relative authority.
