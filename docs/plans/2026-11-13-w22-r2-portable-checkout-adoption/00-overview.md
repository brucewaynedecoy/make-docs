---
title: "W22 R2 Portable Checkout Adoption Plan"
kind: "plan"
status: "active"
coordinate: "W22 R2"
source:
  type: "design"
  path: "docs/designs/2026-11-13-portable-checkout-adoption.md"
follow_on:
  route: "prd-generation"
  next_prompt: "make-docs://system/prompt/plan-to-prd-change.prompt.md"
  why: "Existing product PRDs own the adoption, setup, conflict, and Store rules."
  coordinate_handoff: "Carry W22 R2 into requirement history and the delta work backlog."
---

# W22 R2 Portable Checkout Adoption Plan

## Purpose

Post-release follow-up, 2026-11-14: 2.0.7 registers a second checkout, but a bare saved-choice sync can report false modified files and four new router conflicts. This revision keeps W22 R2 ownership because it repairs the same adoption promise. The patch target is 2.0.8. The [design](../../designs/2026-11-13-portable-checkout-adoption.md) and [D-051](../../prd/03-open-questions-and-risk-register.md#d-051-first-sync-after-adoption-is-blocked) govern this addition.

Turn the [portable checkout adoption design](../../designs/2026-11-13-portable-checkout-adoption.md) into current product requirements and a scoped implementation backlog. The reported 2.0.6 failure concerns a checked-in project on a second machine with no installed Store ledger.

## Objective

Confirm the reported setup states with separate Stores. Reconcile the existing PRDs without creating an editorial PRD. Create a W22 R2 delta backlog that can drive the implementation and package proof. Complete this plan when the PRD set validates and each accepted human outcome has a work task and evidence decision. This plan does not itself change CLI code or release a package.

## Governing Invariant

`docs/prd/` describes the current product contract. This plan and the work backlog carry investigation, sequencing, and editorial decisions. An earlier W22 R1 record does not prove current 2.0.6 behavior.

## Coordinate Decision

- Coordinate: `W22 R2`.
- Classification: `revision`.
- Evidence: The source design links this correction to W22 R1 checkout move and managed-block work. The [wave model](../../../.make-docs/system/references/wave-model.md) keeps a related correction in W22 and uses the next unused revision. No W22 R2 plan or work directory was found in the current indexed documentation tree.

## Maintenance Inputs

| Input | Format and location | Confidence and use |
| --- | --- | --- |
| Owner's 2.0.6 report and order correction | Conversation; captured in [D-050](../../prd/03-open-questions-and-risk-register.md#d-050-second-machine-setup-cannot-adopt-a-portable-checkout) | Observed result and command order; package and Store rows still need independent proof. The failed setup ran before registration preview. |
| [Portable checkout adoption design](../../designs/2026-11-13-portable-checkout-adoption.md) | Dated design | Accepted planning input for the proposed product behavior. |
| Active PRDs | [PRD index](../../prd/00-index.md) and owner files named below | Current product authority. |
| W22 R1 plan and work | [Plan](../2026-10-31-w22-r1-checkout-move-and-block-ownership/00-overview.md) and [work](../../work/2026-10-31-w22-r1-checkout-move-and-block-ownership/00-index.md) | Coordinate and historical scope only. Recheck release claims before reuse. |
| Current setup and Store source | `packages/cli/src/cli.ts`, `packages/cli/src/store/installation-state.ts`, `packages/cli/src/compatibility.ts`, `packages/cli/src/planner.ts` | Code anchors for reproduction. The code index was stale; direct source and packaged output must settle behavior. |
| Store A and Store B fixture | Isolated temporary Stores and a committed clone | Planned evidence. Do not use the maintainer's live Store for the regression. |

## Human Experience Propagation

The source [design intent](../../designs/2026-11-13-portable-checkout-adoption.md#human-experience-intent) has direct impact. The [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md) governs review. The work phases below are the proposed implementation backlog phases.

| Promise | Owning PRD | Surface | Work phase | Evidence or testing decision | Obligation |
| --- | --- | --- | --- | --- | --- |
| Identify adoption state and give one usable command. | [38](../../prd/38-global-store-and-project-state.md), [39](../../prd/39-cli-command-model-and-operation-registry.md) | Status, preview, setup | P1 | CLI and MCP result comparison before setup, after a blocked setup, and after adoption; agent review of human output | None |
| Show saved choices and each changed path before apply. | [24](../../prd/24-project-configuration-and-convention-overlay.md), [07](../../prd/07-cli-command-surface-and-lifecycle.md) | Setup review | P2 | Functional review of the frozen plan and actual CLI output | None |
| Complete non-interactive adoption with no tracked-file change. | [05](../../prd/05-installation-profile-and-manifest-lifecycle.md), [06](../../prd/06-template-contracts-and-generated-assets.md), [15](../../prd/15-agent-instruction-ownership-and-managed-blocks.md), [38](../../prd/38-global-store-and-project-state.md) | `setup --adopt --yes` | P2 and P3 | Two-Store package test, Store identity check, byte comparison, and clean git status | None |
| Make dry run show the same conflicts and blocked or ready result. | [07](../../prd/07-cli-command-surface-and-lifecycle.md), [39](../../prd/39-cli-command-model-and-operation-registry.md) | Interactive and non-interactive dry run | P2 and P3 | Paired dry-run and apply-plan tests; agent review of output | None |

Functional tests and agent review are selected now. Direct impact alone does not activate Unassisted Goal Testing. No accepted work is deferred.

## Performance Evidence Plan

| Candidate | Base action | Applicability | Target class | Next record | Budget and stop | Lifecycle point |
| --- | --- | --- | --- | --- | --- | --- |
| Local adoption inventory and hash scan | `none` | `not-needed` | None | None | No executable performance profile; stop at the design's qualification record | W22 R2 plan |

The current decision concerns ownership and correctness. No accepted latency target or comparable baseline would change it. Functional proof remains required.

## Active Authority Baseline

The active `docs/prd/` namespace is present. The PRD authority validator passed before this plan. This is authoritative PRD maintenance, not a full-set replacement. No archive gate or new numbered PRD is needed. The flat PRD tree remains suitable.

## Candidate Decision Matrix

| Candidate requirement | Decision | Owner | Reason |
| --- | --- | --- | --- |
| Distinguish portable project identity, target binding, and installed ledger. | `update-existing` | PRD 38 and PRD 39 | These own Store identity and status results. |
| Give an explicit adoption path and safe registration or reuse. | `update-existing` | PRD 38 and PRD 39 | Separate checkout registration exists, but setup must finish the reviewed baseline. |
| Keep adoption distinct from legacy missing-manifest migration. | `update-existing` | PRD 18 | Compatibility classification owns source-state order. |
| Recover desired methods and a complete local resource selection under review. | `update-existing` | PRD 24, PRD 07, and PRD 06 | Config owns explicit intent; setup owns review; resource ownership remains separate. |
| Adopt exact shipped files or blocks and preserve divergent content. | `update-existing` | PRD 05, PRD 06, and PRD 15 | These own file, resource, and block provenance. |
| Provide non-interactive keep or proved overwrite and dry-run parity. | `update-existing` | PRD 05, PRD 07, and PRD 39 | These own conflict planning and CLI behavior. |
| Point readers to current owners and D-050. | `link-only` | PRD 00 index and D-050 | Navigation and gap state need maintenance; no new product subject exists. |
| Add a performance threshold for adoption scanning. | `none` | PRD 39 | No accepted target or current performance decision exists. |

## Existing PRDs To Update

| PRD | Owning sections | Focus |
| --- | --- | --- |
| [05](../../prd/05-installation-profile-and-manifest-lifecycle.md) | Managed-File Conflict Planning; Selection and Manifest Invariants | Frozen per-path keep disposition, baseline ledger, and no project-file change. |
| [06](../../prd/06-template-contracts-and-generated-assets.md) | Resource Projection Ownership | Exact package-source comparison and project-owned divergent resources. |
| [07](../../prd/07-cli-command-surface-and-lifecycle.md) | Interactive Selection Contract; Conflict Review Contract; Plan review | Adoption review, saved choices, non-interactive conflict flag, and dry-run parity. |
| [15](../../prd/15-agent-instruction-ownership-and-managed-blocks.md) | Initialization and Adoption Safety; Managed-Block Conflict Resolution | Adopt only a proved block and preserve outside text. |
| [18](../../prd/18-compatibility-classification-and-migration-safety.md) | Requirements and source-state classification | Recognize a portable unregistered checkout before legacy fallback. |
| [24](../../prd/24-project-configuration-and-convention-overlay.md) | Declarative Identity and Settings; Harness Capability Records; Resource Selection | Saved method precedence and reviewed recovery of a missing resource choice. |
| [38](../../prd/38-global-store-and-project-state.md) | R-ID; R-CHECKOUT; R-TEST | New binding versus valid bound-without-ledger state; preserve separate checkout identity. |
| [39](../../prd/39-cli-command-model-and-operation-registry.md) | R-SETUP; R-STATE; R-CHECKOUT; R-TEST | `--adopt`, state and next action, setup composition, and CLI/MCP parity. |

Preserve unrelated requirements and existing numbering. Add no new product PRD.

## Requirement History Entries

Add one dated W22 R2 entry in an owner only when a current rule materially replaces earlier text. The likely owners are PRD 07 for non-interactive choice handling, PRD 18 for classification precedence, PRD 24 for missing resource-choice recovery, PRD 38 for separate checkout registration, and PRD 39 for setup grammar and status. Keep prior contract text only in non-normative history. Do not add boilerplate history to additive clarifications in PRD 05, 06, or 15.

## Affected Links, Risks, Plans, And Work

- Update [PRD 00](../../prd/00-index.md) only where navigation or focus changes.
- Keep [D-050](../../prd/03-open-questions-and-risk-register.md#d-050-second-machine-setup-cannot-adopt-a-portable-checkout) at `Confirming` until the two-Store reproduction. Close it only after package proof. Recheck D-049 separately if current release evidence changes its status.
- Keep the W22 R1 plan and work as historical lineage. Do not rewrite them to claim new completion.
- Create the delta backlog at `docs/work/2026-11-13-w22-r2-portable-checkout-adoption/` after PRD validation.
- Consider the existing installation guide during the later coverage pass. If a shipped system resource changes, edit `packages/docs/template/` first, then dogfood it into this repository.

## Output Contract

- Plan: `docs/plans/2026-11-13-w22-r2-portable-checkout-adoption/`, with this overview and three phase files.
- PRD maintenance: the eight existing owners above, plus PRD 00 and D-050 as needed.
- New PRD: none.
- Work: `docs/work/2026-11-13-w22-r2-portable-checkout-adoption/`, with an index and dependency-ordered phase files.

## Phase Map

| File | Purpose |
| --- | --- |
| [01-evidence-and-boundaries.md](01-evidence-and-boundaries.md) | Prove the reported states and settle package, Store, and resource evidence. |
| [02-prd-authority.md](02-prd-authority.md) | Update current owning requirements and relevant history. |
| [03-backlog-and-validation.md](03-backlog-and-validation.md) | Build the delta backlog and validate its authority and trace. |

## Dependencies

Use isolated temporary Stores for the reproduction. Capture the exact package version, target root, Store root, checkout rows, and ledger state before and after the blocked setup. The three differing resource files may be unavailable in this workspace; record that limit and keep their cause open. The safe adoption rule does not depend on the cause.

## Worker Ownership

The work is delegation-ready, with separate evidence, PRD-owner, assembly, backlog, and validation scopes. This session uses one agent under the current delegation rule. If a later harness permits parallel workers, each worker gets a disjoint document scope; assembly owns PRD 00 and D-050, and validation writes only fixes assigned after review. The coordinator does not claim another worker's output.

## MCP Strategy

Use jdocmunch for current docs and jcodemunch for code symbols. Use the Make Docs PRD validator for the authority gate. The docs index was refreshed. The code index reported stale files; a reindex was attempted. Direct code reads are permitted only where that index cannot answer the question.

## Validation

Check each candidate decision and each design promise against its owning current requirement. Run `make-docs run prd authority validate --target-root <project>` before creating work. Check relative links, Markdown source format, and frontmatter. Then check that work tasks cite current PRDs and that acceptance criteria cover Store identity, file bytes, no-op repeat, status and preview, dry run, conflicts, and unsafe cases. Record the limits of any missing machine B evidence. No release claim follows from passing document checks.

## Intended Follow-On

- Route: `prd-generation`.
- Next step: Use [plan-to-prd-change.prompt.md](../../../.make-docs/system/prompts/plan-to-prd-change.prompt.md) to update the active PRD owners, then create the W22 R2 delta backlog.
- Why: Existing product PRDs own the adoption, setup, conflict, and Store rules.
- Coordinate Handoff: Carry W22 R2 into requirement history and the delta work backlog.
