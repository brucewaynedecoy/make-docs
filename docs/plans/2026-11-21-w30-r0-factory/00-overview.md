---
title: "W30 R0 Factory Plan"
kind: "plan"
status: "draft"
coordinate: "W30 R0"
follow_on:
  route: "prd-generation"
  next_prompt: "make-docs://system/prompt/plan-to-prd-change.prompt.md"
  why: "The plan creates one new capability owner and updates the Skill, Store, config, template, operation, and backlog review owners before the work backlog is written."
  coordinate_handoff: "Carry W30 R0 into PRD 53 source lineage, the requirement-history entries of the updated owners, and the downstream work backlog."
source:
  type: "design"
  path: "docs/designs/2026-11-21-factory.md"
lifecycle:
  default_arc: "design -> plan -> PRD -> work -> implementation"
  departure: "full-package draft"
  reason: "The owner asked for the complete design, plan, PRD, and backlog package before implementation. Implementation starts after W29 R0 ships."
---

# W30 R0 Factory Plan

## Purpose

Plan the [factory](../../designs/2026-11-21-factory.md): a tool-agnostic, opt-in area of Make Docs that sets up a person's agent tools once, proves the wiring, saves it, and runs ready work through builders, reviewers, and corrections, with a human channel for the decisions that need a person. It uses the [W29 work store](../2026-11-21-w29-r0-work-store/00-overview.md) as its queue.

This plan, its PRD changes, and its work backlog are review material. They do not authorize CLI, MCP, Store, template, Skill, installation, commit, push, or release changes. Implementation starts after W29 R0 ships and needs separate owner authority.

## Objective

Completion requires:

- one upstream factory contract and three workflow type references, with no new resource type;
- one append-only Store migration that adds machine tools, bindings, grants, assignments, proofs, and backup records, with R-MIN rows in PRD 38 first;
- one `factory:` block in `.make-docs/config.yaml` for portable workflow choices;
- generated, read-only, gitignored copies in `.make-docs/factory/` and a `run factory restore` operation;
- the `run factory` operations with CLI and MCP parity in a new `factory` MCP profile;
- a new `factory-setup` Skill and a rewritten `factory` Skill, both explicit-invocation-only;
- file backups outside git with automatic cleanup and a note in the backup folder;
- the backlog review "Work on this wave" handoff to the foreman when a workflow is ready;
- two first-release proofs described by capability, with the real tools named in the release notes.

## Human Experience Propagation

The source design has `direct` impact. Authority: [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md).

| Promise | Owning PRD | Human-facing surface or indirect effect | Work phase | Evidence source or selected testing type | Accepted obligation, if any |
| --- | --- | --- | --- | --- | --- |
| Setup ends with a plain summary of roles, wake method, human channel, test result, and open manual steps. | [PRD 53](../../prd/53-factory-setup-and-orchestration.md) | `factory-setup` Skill closing summary | [P4](04-factory-setup-skill.md), [P6](06-proofs-and-acceptance.md) | Two capability proofs, Guided Progress Review | None |
| The person hears only floor events and added events. Each message says what happened, what is needed, and what happens next. | [PRD 53](../../prd/53-factory-setup-and-orchestration.md) | Human channel messages from the front desk | [P1](01-factory-contract-and-workflow-types.md), [P5](05-factory-run-skill-and-handoffs.md) | Escalation fixtures, Guided Progress Review of real messages | None |
| `run factory status` shows each claimed unit, its tool, its state, and the last check, in human words first. | [PRD 53](../../prd/53-factory-setup-and-orchestration.md) | `run factory status` CLI and `factory_status` MCP output | [P3](03-factory-operations.md) | Parity fixtures, Guided Progress Review | None |
| At the end of the given scope, the person gets one acceptance request with the reviewed result and evidence. | [PRD 53](../../prd/53-factory-setup-and-orchestration.md) | Acceptance message and status | [P5](05-factory-run-skill-and-handoffs.md), [P6](06-proofs-and-acceptance.md) | Capability proofs, Human Experience Review | None |
| A drifted workflow says so before it takes new work and names the smallest fix. | [PRD 53](../../prd/53-factory-setup-and-orchestration.md) | Status, the foreman's first step, and an escalation message | [P3](03-factory-operations.md), [P5](05-factory-run-skill-and-handoffs.md) | Drift test that removes a wired tool | None |

## Performance Evidence Plan

| Candidate | Base maintenance action | Performance applicability | Target class | Canonical `PERF-###` or next record | Finite budget and stop reference | Lifecycle point |
| --- | --- | --- | --- | --- | --- | --- |
| None. Claim time limits and check intervals are correctness settings. The selected tools own their own run time. | `none` | `not-needed` | None | None | Not applicable | None |

## Coordinate Decision

- Coordinate: `W30 R0`
- Classification: `new-wave`
- Evidence: Explicit owner guidance in the 2026-11-21 grill (W30 for the factory, after W29 for the work store). The outcome test agrees: the existing `factory` Skill promised a coordination aid, not saved setup, proved wiring, Store-backed assignments, or a human channel. Those are new outcomes. The rewrite of the existing Skill is part of this new outcome, not a revision of a completed Wave.

## Maintenance Inputs

| Input | Format | Location | Confidence |
| --- | --- | --- | --- |
| Factory design | Markdown | [2026-11-21-factory.md](../../designs/2026-11-21-factory.md) | High. Owner-confirmed decisions. |
| Work store design and plan | Markdown | [Design](../../designs/2026-11-21-work-store.md), [plan](../2026-11-21-w29-r0-work-store/00-overview.md) | High. Queue interface. |
| Current factory Skill | Markdown | `packages/skills/factory/` | High. Read at `ba4b95b5`. |
| Lifecycle and evidence operations | TypeScript | `packages/cli/src/operations/lifecycle/`, `packages/cli/src/operations/work/ops/` | High. Read at `ba4b95b5`. |
| Preflight and backlog review Skills | Markdown | `packages/skills/preflight/`, `packages/skills/backlog-review/` | High. |

## Product Authority Decision

| Candidate | Decision | Owner | Reason |
| --- | --- | --- | --- |
| Factory roles, setup, capability matching, workflow types, saved records, assignments, loop, waking, human channel, escalation floor, acceptance, working rules, backups outside git, and operations | `create` | [PRD 53](../../prd/53-factory-setup-and-orchestration.md) | A coherent new product subject. PRDs 08 and 25 own only the thin Skill boundary today. |
| `factory-setup` Skill and the rewritten `factory` Skill | `update-existing` | [PRD 08](../../prd/08-skills-catalog-and-distribution.md) | PRD 08 owns the first-party Skill catalog and R-SKILL-BUNDLE-3. |
| Skill runtime boundary and the `factory` MCP profile | `update-existing` | [PRD 25](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md) | PRD 25 owns R-SKILL-RUNTIME-2 and -4 and the MCP profiles. |
| Factory tables, R-MIN rows, the narrow copy rule, and backup records | `update-existing` | [PRD 38](../../prd/38-global-store-and-project-state.md) | PRD 38 owns every Store field, R-DB-5, and migration. |
| `factory:` config block | `update-existing` | [PRD 24](../../prd/24-project-configuration-and-convention-overlay.md) | PRD 24 owns config keys. |
| `.make-docs/factory/` and `.make-docs/backup/factory/` paths | `update-existing` | [PRD 21](../../prd/21-project-tool-directory-and-resource-tiers.md) | PRD 21 owns the `.make-docs/` directory model. |
| Factory contract and workflow type references | `update-existing` | [PRD 06](../../prd/06-template-contracts-and-generated-assets.md) | PRD 06 owns stable resource identity. |
| CLI command paths | `update-existing` | [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) | PRD 39 owns the admitted CLI paths. |
| Backlog review handoff to the foreman | `update-existing` | [PRD 51](../../prd/51-backlog-review-and-reporting.md) | PRD 51 owns the review button. |
| Lifecycle runs at stage `implementation` | `link-only` | [PRD 14](../../prd/14-lifecycle-workflow-and-coverage-passes.md) | No lifecycle rule changes. The factory uses the existing stage. |
| Glossary terms: factory, front desk, foreman, builder, reviewer, workflow type, human channel, escalation floor, grant | `update-existing` | [PRD 04](../../prd/04-glossary.md) | Shared terms. |
| Active PRD navigation | `update-existing` | [PRD Index](../../prd/00-index.md) | The new owner needs a discoverable path. |

## Requirement History Entries

| Owning PRD | Date / coordinate | Affected requirement or section | Previous contract | Replacement contract | Rationale | Source |
| --- | --- | --- | --- | --- | --- | --- |
| PRD 08 | 2026-11-21 / W30 R0 | R-SKILL-BUNDLE-3 and the Skill list | Eight first-party Skills. `factory` is a coordination aid with no saved setup. | Nine Skills. `factory-setup` and `factory` stay explicit-invocation-only. `factory` runs saved workflows. | Saved, proved setup. | [Design](../../designs/2026-11-21-factory.md) |
| PRD 25 | 2026-11-21 / W30 R0 | R-SKILL-RUNTIME-4 | The factory records no assignments and keeps worker status only in the selected tool. | The factory records assignments in the Store. It still cannot authorize implementation by itself. | Crash and handoff recovery. | [Design](../../designs/2026-11-21-factory.md) |
| PRD 38 | 2026-11-21 / W30 R0 | R-DB-5 | No project-local copy of Store records. | One narrow exception for generated, read-only, gitignored factory copies. | The owner kept readable local copies. | [Design](../../designs/2026-11-21-factory.md) |

## Phase Map

| File | Purpose |
| --- | --- |
| [01-factory-contract-and-workflow-types.md](01-factory-contract-and-workflow-types.md) | Author the factory contract, the capability catalog, and three workflow type references upstream. |
| [02-store-records-config-and-copies.md](02-store-records-config-and-copies.md) | Add the factory tables, the `factory:` config block, the generated copies, and backup records. |
| [03-factory-operations.md](03-factory-operations.md) | Build the `run factory` operations and the `factory` MCP profile. |
| [04-factory-setup-skill.md](04-factory-setup-skill.md) | Build the `factory-setup` Skill: find, read, interview, wire, prove, and save. |
| [05-factory-run-skill-and-handoffs.md](05-factory-run-skill-and-handoffs.md) | Rewrite the `factory` Skill around the loop, and add the backlog review handoff. |
| [06-proofs-and-acceptance.md](06-proofs-and-acceptance.md) | Prove two setups by capability, drift, work outside git, package parity, and Human Experience outcomes. |

## Dependencies

- W29 R0 P4 and P6 are complete before P2 starts. P1 can start earlier.
- P2 depends on P1 and on the PRD 38 R-MIN rows. Its migration follows W29's v8.
- P3 depends on P2.
- P4 and P5 depend on P1 and P3. They can run in parallel with separate write scopes.
- P6 depends on P2 to P5 and one identified package candidate.
- The first proof needs real tools that the owner picks at test time. The plan names them only by capability.

## Output Contract

- Design: `docs/designs/2026-11-21-factory.md`.
- Plan: this directory with `00-overview.md` and six phase files.
- New product authority: `docs/prd/53-factory-setup-and-orchestration.md`.
- Updated owners: PRDs 00, 04, 06, 08, 21, 24, 25, 38, 39, and 51.
- Work backlog: `docs/work/2026-11-21-w30-r0-factory/` with `00-index.md` and six phase files.
- No implementation source, shipped asset, Store, installation, staging, commit, push, or release change is part of this package-writing pass.

## Worker Ownership

Use disjoint write scopes when implementation is authorized.

| Worker role | Responsibility | Primary write scope | Dependencies | Deliverable |
| --- | --- | --- | --- | --- |
| Contract owner | Factory contract, capability catalog, workflow types, rule catalog | `packages/docs/template/` factory resources, then package and dogfood copies | Accepted design | P1 resources |
| Store owner | Migration, factory tables, copies, restore, backups, cleanup | `packages/cli/src/store/` and focused tests | P1, W29 v8 | P2 records |
| Surface owner | Operations, registry, CLI, MCP profile | Registry, operation handlers, surface tests | P2 | P3 operations |
| Setup Skill owner | `factory-setup` Skill | `packages/skills/factory-setup/` and its registry entry | P1, P3 | P4 Skill |
| Run Skill owner | `factory` Skill rewrite and the backlog review handoff | `packages/skills/factory/`, backlog review handoff files | P1, P3 | P5 Skill |
| Validation owner | Capability proofs, drift test, outside-git test, package parity, Human Experience Review | Evidence file and bounded fixes returned to owners | P2 to P5 | P6 evidence |

## MCP Strategy

Use jdocmunch for project documents and jcodemunch for code during implementation. Reindex before falling back to direct reads. The Skills prefer the `factory` and `workflow` MCP profiles, then the CLI. Without the CLI or a usable Store, `factory-setup` stops and says why. The factory has no agentic fallback for saving, by design.

## Validation

- Validate design, plan, PRD, work, path, link, and metadata contracts.
- Run PRD authority validation before the work backlog is treated as implementation authority.
- Prove that no example, default, or fixture names a particular tool as required. Proof records name the tools actually used.
- Prove capability matching on fixtures where the same role is filled by tools with different names.
- Prove the readiness states: only a `ready` workflow takes new work, and a `drifted` workflow escalates first.
- Prove every escalation floor event reaches the human channel, and that a workflow cannot remove one.
- Prove assignment recovery: an `unknown` assignment is checked through its handle before any other step, and no work is sent twice.
- Prove grants stay in the Store and never reach committed config or copies.
- Prove `.make-docs/factory/` copies are generated, read-only, gitignored, never read as input, and restored by `run factory restore`.
- Prove backups outside git, their cleanup on close and after 30 days, and that cleanup never touches installation recovery backups.
- Prove CLI JSON and MCP parity for every new operation.
- Complete the two capability proofs and a Human Experience Review for each promise above.

Automated Implementation Testing is required for every implementation phase. Guided Progress Review is selected for the setup summary, status output, escalation messages, and the acceptance request. Unassisted Goal Testing is `not-needed-now`. Reassess at P6 if a normal-use discoverability question about first setup remains open.

## Intended Follow-On

This handoff is advisory-default-but-overridable.

- Route: `prd-generation`
- Next step: Create PRD 53 and update PRDs 00, 04, 06, 08, 21, 24, 25, 38, 39, and 51 from this plan.
- Why: The plan should become the product contract before the work backlog is written.
- Coordinate Handoff: Carry `W30 R0` into PRD 53 source lineage, the requirement-history entries, and `docs/work/2026-11-21-w30-r0-factory/`.

## Change History

### 2026-11-22 — W30 R0 P2

- Kind: `edit`
- Affected scope: P2 migration order and table rules.
- Previous scope: the factory migration followed W29's schema v7.
- Replacement scope: the factory migration follows W29's schema v8, and each factory table has the Store write guard triggers and a Store table catalog entry.
- Rationale: W32 R0 takes schema v7 and adds the write guard and the table catalog.
- PRD decision: `update-existing` — PRD 38 R-DB-7, R-WRITE-GUARD, and R-MAINT.
- Owner approval: the owner's choice on 2026-11-22 to finish the whole Store review first.
- Source: [W32 R0 plan](../../plans/2026-11-22-w32-r0-store-review-and-maintenance/00-overview.md)

### 2026-11-22 — W30 R0 P3

- Kind: `edit`
- Affected scope: P3 dependencies.
- Previous scope: P3 built its commands on the current command tree.
- Replacement scope: P3 waits for an accepted command tree review, and its command paths and MCP names follow that review.
- Rationale: the owner rated the inconsistent command tree a very serious problem and asked not to make it worse.
- PRD decision: `none` — the review decides the PRD 39 and PRD 25 changes.
- Owner approval: the owner's decision on 2026-11-22 to log register D-065.
- Source: [Register D-065](../../prd/03-open-questions-and-risk-register.md)
