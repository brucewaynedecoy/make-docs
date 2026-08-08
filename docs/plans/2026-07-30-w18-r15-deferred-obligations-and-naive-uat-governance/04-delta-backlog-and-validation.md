---
title: "W18 R15 Phase 4: Delta Backlog and Validation"
kind: "plan"
status: "draft"
coordinate: "W18 R15"
---

# W18 R15 Phase 4: Delta Backlog and Validation

## Purpose

Generate the single dependency-ordered W18 R15 work backlog after PRDs 45 and 46 are approved, then validate the complete planning handoff without starting implementation.

## Backlog Shape

Directory:

`docs/work/2026-07-30-w18-r15-deferred-obligations-and-naive-uat-governance/`

Files:

| Work phase | File | Scope |
| --- | --- | --- |
| P1 | `01-prd-authority-and-register-reconciliation.md` | Create PRDs 45/46, update PRDs 00/03/04, apply scoped baseline annotations, resolve cross-links, and perform the initial obligation/UAT inventory |
| P2 | `02-upstream-contracts-templates-and-prompts.md` | Create the two contracts and scenario template; update output, coverage, history, lifecycle, execution, planning, PRD, work, and prompt/template authorities under `packages/docs/template/.make-docs/` |
| P3 | `03-coverage-lifecycle-and-playbooks.md` | Add tester/facilitator Playbooks, update the lifecycle Playbook and routers, enforce anti-coaching and separate testing modes |
| P4 | `04-dogfood-projection-and-compatibility.md` | Project upstream resources, verify maintainer and fresh-project parity, exercise conservative legacy migration, and record first-use audit evidence through existing seams |
| P5 | `05-validation-and-closeout.md` | Run the full documentation/default/package validation bar, exercise acceptance fixtures, reconcile findings/obligations, and prepare the owner closeout without release or publication |

`00-index.md` summarizes the source chain, phase dependencies, applicable `O-###` and `NUAT-###` records, capability status, and intended follow-on.

Task IDs use phase-local `t1`, `t2`, and later ordinals across each entire phase file without resetting within stages. Each phase cites its PRD requirement anchors and affected obligations/scenarios.

## Dependency Order

- P1 is authoritative and blocks all later writing.
- P2 depends on approved PRD requirement anchors and creates the shared rules.
- P3 depends on P2 so Playbooks and routers link rather than duplicate.
- P4 depends on P2 and P3 because projection must originate from the complete upstream source state.
- P5 depends on every earlier phase and owns fix-ups, audit closure, capability-status wording, and owner handoff.

No phase may hand-author installed defaults before its upstream source exists.

## Required Phase Gates

Every backlog phase includes:

- automated and documentation validation appropriate to its changed files;
- orphan-audit candidate enumeration and verdicts;
- testing/UAT candidate rows for each applicable mode;
- a scenario reference or complete `none` rationale for naive UAT;
- obligation dispositions and next coordinates;
- Project State validation/review/closeout evidence references;
- `Phase complete` plus an explicit capability status;
- no commit, push, publish, release, or migration authorization inferred from phase completion.

A phase with an unresolved orphan cannot close. A phase with activated naive UAT in `fail`, `revise`, `blocked`, or unrun state cannot claim the user-observable capability accepted.

## Documentation-Round Validation

Before PRD/backlog handoff:

1. Validate all new plan files against the plan directory and frontmatter contracts.
2. Resolve every relative link within this bundle and to both designs, active PRDs, prompts, and planned work paths.
3. Run path hygiene and wave-numbering checks.
4. Run Markdown style and whitespace checks over the new files.
5. Confirm W18 R15 is unique across active plan/work directories.
6. Confirm this plan names no generated or installed copy as an authoring source.
7. Confirm the plan contains no placeholder, unresolved filename, or silent design decision.
8. Confirm both design documents remain unchanged.

## Future PRD/Backlog Validation

The PRD reconciliation round must prove:

- PRDs 45 and 46 use the feature-oriented subsystem contract because they are genuinely new capabilities;
- PRD 00 lists both documents;
- PRD 03 has one fixed deferred-obligations section and valid ID rules;
- PRD 04 defines the new terms;
- baseline backlinks resolve;
- the obligation and scenario authority chain has one canonical record for each identity;
- the work backlog traces every phase to PRD anchors, obligations, scenarios, findings, and affected baselines.

## Future Implementation Validation

The documentation-first implementation round must run, at minimum:

1. Repository-authoritative default/template validation.
2. Path and relative-link hygiene for all changed resources.
3. Markdown and Playbook contract checks.
4. Instruction-router parity and managed-block validation.
5. Upstream-to-dogfood source parity and manifest/freshness validation.
6. Fresh-project instantiation with the new contracts, templates, prompts, routers, Playbooks, and empty deferred-obligations section.
7. Legacy fixtures for missing managed defaults, known-clean defaults, modified content, ambiguous content, existing UAT artifacts, and absent Global Store evidence.
8. Acceptance fixtures covering all fourteen scenarios in Phase 3.
9. Negative checks proving:
   - no operator-only content reaches the tester packet;
   - a persona filter cannot remove testing/UAT candidates;
   - automated, conformance, visual, accessibility, and naive-UAT verdicts cannot substitute for each other;
   - invalid `none`, `blocked`, unresolved `fail`, or unresolved `revise` cannot satisfy acceptance;
   - no repository-local runtime-state or raw-evidence default is introduced;
   - no CLI, MCP, database, schema, or automatic migration change appears.
10. `git diff --check` and final status review with no staged files or commits unless separately authorized.

## Traceability Matrix

The backlog generator must allocate every design decision:

| Design decision group | Work ownership |
| --- | --- |
| Anti-orphan register, authority, completion, audit, flow, state, migration, scenarios | P1, P2, P4, and P5 |
| UAT scope, activation, modes, goals, scenario, evidence, coverage, gates, state, accessibility, migration, future boundary | P1 through P5 |
| Shared template/dogfood authority | P2 and P4 |
| Tester/facilitator/lifecycle Playbooks and agent instructions | P3 |
| End-to-end acceptance and negative checks | P5 |

The final backlog must use individual PRD requirement anchors rather than only citing whole designs or this plan.

## Stop Conditions

Stop and return to owner review if:

- PRD execution discovers an unresolved product decision that changes scenario ownership, product authority, or the documentation-first boundary;
- the existing template materializer cannot project the new resource classes without runtime changes;
- modified project-owned content would be overwritten;
- current Project State evidence seams cannot record references without a schema change;
- tester/facilitator separation cannot be represented by the Playbook contract;
- a proposed implementation adds CLI, MCP, database, schema, runtime, migration, publication, or release scope.

Those conditions require a plan revision or separate authorization; they are not implementer freedoms.

## Exit Criteria

- One W18 R15 backlog directory is specified with five dependency-ordered phases.
- Every fixed design decision and resolved open question has a PRD and work owner.
- Validation covers source authority, projection, compatibility, anti-coaching, evidence, accessibility, non-GUI use, and negative gates.
- Future deterministic support remains outside the backlog.
- The plan bundle is saved but no PRD, backlog, system resource, dogfood copy, migration, runtime, database, commit, push, publication, or release action has started.
