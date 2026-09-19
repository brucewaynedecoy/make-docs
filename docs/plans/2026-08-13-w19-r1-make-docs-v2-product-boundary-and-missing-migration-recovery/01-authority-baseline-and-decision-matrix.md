---
title: "W19 R1 Phase 1: Authority Baseline And Decision Matrix"
kind: "plan"
status: "draft"
coordinate: "W19 R1 P1"
source:
  type: "design"
  path: "docs/designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md"
---

# Phase 1: Authority Baseline And Decision Matrix

## Purpose

Freeze the accepted design inputs, bounded implementation trace, PRD candidate decisions, full-subject retirement disposition, requirement-history obligations, and future worker boundaries before any separately authorized PRD reconciliation begins.

## Fixed Inputs

- The accepted [recovery design](../../designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md) is the design authority.
- [The overview](00-overview.md) owns coordinate, lifecycle, candidate, output, and approval handling.
- Active PRDs remain current authority until the owner separately authorizes their reconciliation.
- Bear notes are supporting context only and are not inputs to PRD wording.
- The unexecuted W19 R0 Protocol plan is provenance, not current product authority.
- No new PRD, work backlog, implementation, setup, migration, projection, dogfood regeneration, or deletion is produced in this phase.

## Bounded Consumer Trace

The planning preflight characterized only the surfaces necessary to keep future removal and retention decisions evidence-backed.

| Primitive | Observed non-Playbook production use | Classification |
| --- | --- | --- |
| Skill registry/catalog | Audit, CLI, installation, planner, Skills commands, wizard | Retain |
| Agentic Skill roles | Audit, CLI, manifest, planner, Skills UI | Retain |
| Operation registry | MCP derivation, run CLI, PRD authority validation, work evidence, work-item operations | Retain |
| Project registry and work evidence Store state | General project and work consumers | Retain |
| `playbook_runs` | Legacy Playbook-specific state | Preserve opaque; retire only under compatible later authority |
| Plugin substrate | Tests only in the focused import trace | Removal candidate |
| Hook and extension descriptors | Playbook packaging/compiler/conformance only | Removal candidate |
| Harness-adapter registry | Playbook packaging/planner/writers only | Removal candidate |
| Packaging-specific conformance | Scripts/tests and Playbook packaging surfaces | Removal candidate or narrowing target |
| Router mapping | `AGENTS.md -> codex`; `CLAUDE.md -> claude-code` | Retain these evidence-backed mappings |
| Naive-UAT CLI/workflow/Skill | No implementation found | Absent; later implementation required |

### Trace Rule

Unknown is not proof of either use or non-use. Immediately before implementation-time deletion, perform one current import/registration trace for each removal candidate. If no production consumer is found, removal may proceed under accepted PRD and work authority. If a consumer appears, stop that deletion and reconcile its existing PRD owner. Do not add a speculative compatibility contract.

## Candidate Classification Rules

Every accepted requirement uses exactly one disposition:

- `update-existing`: an existing product PRD already owns the coherent subject.
- `create`: reserved for a coherent new product subject with no existing owner.
- `link-only`: navigation, provenance, or separately governed authority.
- `none`: intentionally no product requirement or no artifact.

There are no `create` candidates. Recovery, reconciliation, migration, and removal describe editorial or execution operations, not product subjects.

## Full-Subject Retirement Disposition

PRDs 34, 35, and 36 currently own Playbook authoring, run-state, and packaging/compiler subjects. The accepted design removes both Playbooks and Protocols from Make Docs. During separately authorized PRD maintenance:

1. update each document’s current normative body to state the present product boundary;
2. state explicit non-goals for the removed behavior without narrating the editorial change as a product requirement;
3. retain document number and identity so incoming links and requirement history remain intelligible;
4. append standardized, non-normative `## Requirement History` only after current text is correct;
5. do not archive, delete, renumber, or replace the documents with recovery/removal PRDs; and
6. do not preserve the unexecuted W19 R0 Protocol direction as an active obligation.

The current product boundary is that Make Docs owns no Playbook authoring model, Protocol placeholder, workflow runner, Playbook state machine, packaging compiler, harness-adapter registry, or Playbook-generated Skill/plugin payload.

## PRD Maintenance Groups

| Group | Exclusive PRDs | Decision boundary |
| --- | --- | --- |
| Core/resource | 01, 02, 06, 16, 17, 21, 23, 24, 25, 39 | Product/resource/runtime/CLI/MCP authority |
| Lifecycle/migration | 05, 07, 09, 10, 15, 18, 22, 38 | Selection, provenance, IA, compatibility, Store, package/dogfood |
| Skills/agentics/retirement | 08, 20, 28, 30, 34, 35, 36, 43, 44 | Retained Skill substrate, optional agentics, removed Playbook/Protocol subjects and claims |
| UAT/Persona | 14, 45, 46, 47 | UAT semantics, reporting, Persona configuration/default, evidence routing |
| Shared assembly | 00, 03, 04 | Index, risk/decision register, glossary, cross-links |

No two future workers write the same PRD. PRDs 46 and 47 are authored, reviewed, and merged as one paired unit even if one worker owns both.

## Exact Candidate-to-Owner Decisions

| Requirement family | Decision | Primary owner | Required companion owners |
| --- | --- | --- | --- |
| No Playbooks or Protocols | `update-existing` | PRDs 34-36 | 01, 02, 04 |
| Resource types and URI | `update-existing` | PRDs 17, 21 | 06, 25, 39 |
| CLI/MCP resource parity | `update-existing` | PRDs 25, 39 | 07 |
| Selection and optional projection | `update-existing` | PRDs 05, 17, 21 | 07, 15 |
| Provenance/conflict/rollback/uninstall | `update-existing` | PRDs 05, 18 | 15 |
| Target IA and evidence namespace | `update-existing` | PRD 22 | 17, 38, 46, 47 |
| Compatibility facets and ordered migration | `update-existing` | PRD 18 | 05, 15, 17, 21, 38 |
| General run capture | `update-existing` | PRDs 38, 39 | 25 |
| Naive-UAT workflow and Skill adapter | `update-existing` | PRD 46 | 08, 14, 25, 28 |
| Persona selection/default | `update-existing` | PRDs 46 and 47 | 22 |
| UAT findings and gates | `update-existing` | PRDs 45, 46 | 14 |
| Optional agentics and support claims | `update-existing` | PRDs 28, 30 | 08, 20, 43, 44 |
| Upstream/package/dogfood sequence | `update-existing` | PRDs 06, 17 | 09, 10, 16 |
| Cross-platform/security/privacy | `update-existing` | PRDs 18, 25, 38 | 05 |
| W19 R0 supersession | `link-only` | This plan | PRDs 00/03 receive normal maintenance only |
| Performance governance | `link-only` | Sibling accepted performance authority | No duplicate recovery PERF requirements |
| New product PRD | `none` | None | Existing owners are sufficient |

## Requirement-History Contract

Each history entry records:

- date and `W19 R1`;
- exact affected requirement or section;
- previous normative contract;
- replacement current contract;
- rationale grounded in the accepted design; and
- source links to the design and accepted plan.

History is non-normative. It must not contain unfinished work checklists, migration procedure, or an unresolved fallback that competes with current authority.

## Risk And Decision Register Disposition

Reconcile existing entries O-002, Q-015, Q-020, R-016, R-017, R-020, and R-027 in place where they cover the accepted product boundary, migration, provider, resource, or agentics decisions. Preserve stable identifiers and status vocabulary. Add a new ID only when a genuinely new unresolved risk remains after subject PRDs settle. The two bounded evidence questions in the overview are execution-time checks, not reasons to reopen the accepted design.

## Affected Links And Prior Artifacts

- Update `docs/prd/00-index.md` only after subject PRDs settle.
- Preserve W19 R0 unchanged. Add a supersession link only if later plan-maintenance authority includes that file.
- Do not edit archived designs, plans, work, history, or generated copies.
- The later W19 R1 backlog cites accepted PRDs as product authority and this plan only for sequencing.

## Phase Execution Mode

This phase is a PRD-maintenance blueprint, not current execution. Under later authorization:

1. assign the four disjoint subject groups;
2. review candidate decisions before writing;
3. update current normative sections;
4. add history only after current authority is coherent;
5. assemble shared surfaces;
6. perform one focused semantic/contract review and one bounded correction if needed.

The coordinator owns gates and merge order, not document-writing scope when delegation is available.

## Evidence Budget

- Planning characterization: one completed focused trace; no unchanged rerun.
- Later PRD authoring: one normal pass per group.
- Correction: at most one materially distinct correction pass per group unless the owner expands the budget.
- Review: one subject review and one assembled confirmation review.
- Deletion trace: one current import/registration pass per removal-candidate family.

Exhaustion produces an evidence-backed escalation, not an indefinite loop.

## Phase Validation

Confirm that:

- every candidate has one disposition and reason;
- all `update-existing` candidates name current PRD owners;
- `create` remains empty;
- PRDs 34-36 are retained in place as current retired-capability boundaries;
- PRDs 46/47 are paired;
- W19 R0 is superseded prospectively without being rewritten;
- unknown consumers are not invented; and
- no PRD, work, code, template, or generated file changed during plan creation.

## Handoff

After plan acceptance and separate PRD-stage authorization, use the worker scopes above. Phase 2 supplies the resource/product requirements, Phase 3 supplies lifecycle and migration requirements, Phase 4 supplies UAT/Persona/agentics requirements, and Phase 5 supplies assembly and later build sequencing.
