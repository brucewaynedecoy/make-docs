---
title: "Checkout Move and Managed-Block Ownership Repair"
kind: "plan"
status: "draft"
coordinate: "W22 R1"
follow_on:
  route: "implementation-loop"
  next_prompt: "Obtain implementation authorization, then start the W22 R1 backlog with PRD authority reconciliation before code."
  why: "The repair needs clear product rules before implementation."
  coordinate_handoff: "Carry W22 R1 into the scoped work backlog and source links."
---

# Checkout Move and Managed-Block Ownership Repair

## Purpose

Plan the Make Docs 2.0.6 repair for a moved project directory. Setup must find the existing install by project ID before it calls the project fresh. Move checks must honor block ownership in shared instruction files. This plan records the user's 2026-10-31 request. It does not authorize implementation or a live Store repair.

## Objective

- Detect a moved checkout before install classification or the selection wizard.
- Offer a clear review of the old and new paths.
- Keep project IDs, checkout IDs, install records, and history when an existing checkout moves.
- Ignore user edits outside valid Make Docs blocks when checking durable ownership.
- Keep strict checks for changed blocks, unsafe paths, competing claims, and pending work.
- Test the installed 2.0.6 package against an authentic 2.0.5 install.
- Prepare the CLI version bump and release evidence as later work.

Completion means the approved repair meets the proof in [Phase 3](03-tests-and-package-proof.md) and the release checks in [Phase 4](04-release-206.md). No completion is claimed by this draft.

## Scope and Current Authority

This is a scoped repair to existing product behavior. The active PRD set stays in place. No new product PRD, full-set rewrite, or archive is planned.

The source defect is concrete. Make Kit was moved from `buildos` to `make-kit`. Its root and Make Blueprint have separate project IDs and saved Store checkout records at the old paths. The earlier read-only review found no pending install in either record. Both root Make Docs blocks matched the saved block hashes. The root whole-file checksums differed because of user text outside the blocks. Those findings are evidence for this plan, not permission to change that Store.

The [existing ownership rules](../../prd/15-agent-instruction-ownership-and-managed-blocks.md) already make reconciliation block-scoped. The current move check in `packages/cli/src/store/installation-state.ts` hashes whole files through `managedContentDigest`. Setup reads a path-bound manifest before its mutation path can bind the moved checkout. These two paths must use one ownership model and one move review.

## Authorization and Lifecycle

The user authorized a new branch and this saved plan, then plan review and a scoped backlog if the plan was sound. Both focused reviews corrected material gaps. The plan is review-ready for this documentation handoff. Draft status does not mean owner approval to implement. The branch is `fix/2.0.6-checkout-move-ownership`. The user barred Store changes and implementation.

This is a user-directed Plan-first departure from the default design-to-plan order in the [lifecycle reference](../../../.make-docs/system/references/lifecycle.md). The reported case and the user's ownership correction supply the change input. A separate design is not needed to restate them. The user directly requested backlog generation before full PRD reconciliation. This is a bounded order departure. The first unchecked backlog stage must reconcile the named PRD owners and validate current authority before any code. The PRD reconciliation was separately authorized and is now complete after independent semantic review and Store-free authority validation. No implementation or installed behavior is inferred from requirement text.

The user then authorized the named PRD updates and a gap review. Current writes include those existing PRD owners, narrow index/risk assembly, and this plan/backlog status and actual documentation evidence. The doc-stage review does not authorize code, product tests, or Store access. Do not change source code, tests, package versions, lock metadata, generated assets, installed files, or the Store in this planning task. Do not stage, commit, tag, publish, or repair Make Kit.

## Coordinate Decision

- Coordinate: `W22 R1`.
- Classification: `revision`.
- Lineage: this repairs W22 R0 checkout-path safety and router ownership. See the [W22 R0 overview](../2026-09-18-w22-r0-store-architecture-recovery-and-platform-neutral-foundation/00-overview.md), its [platform phase](../2026-09-18-w22-r0-store-architecture-recovery-and-platform-neutral-foundation/03-platform-neutral-filesystem-and-checkout-safety.md), and its [router repair phase](../2026-09-18-w22-r0-store-architecture-recovery-and-platform-neutral-foundation/08-router-ownership-and-reviewed-reinstall-repair.md).
- The plan and work directories contained W22 R0 and no later W22 revision when this plan was written. Newer unrelated waves do not change this lineage.

## Human Experience Propagation

Impact: `direct`. The user must understand that an existing install moved. The user must control the path update without losing project text or history. Use the [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md) and [reference](../../../.make-docs/system/references/human-experience.md).

| Promise | Owning PRD | Surface | Phase | Required evidence | Accepted obligation |
| --- | --- | --- | --- | --- | --- |
| Setup names the moved install before showing fresh-install choices. | PRD 07 and PRD 38 | Setup and status output | 2 | CLI flow tests and installed-package transcript | None |
| User text outside Make Docs blocks survives without an ownership conflict. | PRD 15 and PRD 18 | Shared instruction files | 1–3 | Prefix/suffix byte comparisons and negative block cases | None |
| A path update keeps the selected checkout's identity and history. | PRD 38 | Store path review | 2–3 | Before/after record assertions in a disposable Store | None |
| Cancel, dry-run, and unsafe cases make no move. | PRD 07, PRD 18, and PRD 38 | Review and error output | 2–3 | No-change assertions and useful next-action checks | None |
| Root and kit installs stay separate. | PRD 24 and PRD 38 | Explicit target selection | 2–3 | Two-ID monorepo fixture | None |

Automated Implementation Testing is planned for exact correctness and release claims. Required agent Human Experience Review inspects the actual prompt and installed output. Guided Progress Review is optional and advisory. Unassisted Goal Testing is not-needed-now because automated proof and agent review can answer the known defect. Revisit only for material discoverability uncertainty those cannot answer, or explicit product/release authority. Use the bounded decisions in Phase 3. No tests, benchmark, tester, or human acceptance gate are authorized by this documentation task.

## Performance Evidence Plan

| Candidate | Base maintenance action | Performance applicability | Target class | Record | Budget and stop rule | Lifecycle point |
| --- | --- | --- | --- | --- | --- | --- |
| Checkout lookup and ownership checks | Repair correctness and user flow | `not-needed-now` | None | None | No benchmark run or speed claim | Revisit only if implementation adds a performance claim or finds a relevant cost risk |

This plan sets no response-time target and permits no benchmark.

## Candidate Decision Matrix

| Candidate | Decision | Existing owner and section | Planned change |
| --- | --- | --- | --- |
| Shared-file ownership | `update-existing` | [PRD 15](../../prd/15-agent-instruction-ownership-and-managed-blocks.md), Requirements | Make the existing block-only rule explicit for move evidence and old verification records. Preserve authentic legacy adoption rules. |
| Move discovery and review | `update-existing` | [PRD 07](../../prd/07-cli-command-surface-and-lifecycle.md), Interactive wizard and review flow; Plan review, confirmation, and apply orchestration | Put path review before fresh classification. Specify choices, cancellation, and non-interactive behavior. |
| Compatibility and old evidence | `update-existing` | [PRD 18](../../prd/18-compatibility-classification-and-migration-safety.md), Quiescence and Mutation Barrier; Compatibility Bridge Contract | Distinguish a missing path binding from a missing install. Require proven ownership before an old checksum record is replaced. |
| Checkout identity and path update | `update-existing` | [PRD 38](../../prd/38-global-store-and-project-state.md), R-CHECKOUT; R-ID; R-XFER; R-TEST | Specify read-only discovery, reviewed binding updates, atomic apply, and retry proof. |
| Config as project knowledge | `update-existing` | [PRD 24](../../prd/24-project-configuration-and-convention-overlay.md), Declarative Identity and Settings | Check valid project identity without making unrelated config text a durable move lock. |
| CLI and MCP operation contract | `update-existing` | [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) and [PRD 25](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md) | Use the shared move operation and its read/write admission. Adopt proposed project.checkout-move.preview/apply and command/tool projections before code. Preview is Store-read/project-read. Apply is Store-write/project-read. Both have host-config-none access. |
| Package proof | `update-existing` | [PRD 10](../../prd/10-packaging-validation-and-release-reference.md), Installed Legacy-Project Candidate Proof; Core Platform Candidate Proof | Add the moved-checkout package case to existing release proof. |
| Architecture | `link-only` | [PRD 02](../../prd/02-architecture-overview.md) | Reuse the existing identity and authority model. |
| New product PRD | `none` | Existing owners above | This repair creates no ownerless product subject. |

Preserve material replaced contracts in each affected owner's non-normative Requirement History. Do not describe the full-file move defect as a valid prior ownership rule. Keep maintenance actions in this plan and later work records.

## Phase Map

| File | Purpose |
| --- | --- |
| [01-authority-and-ownership.md](01-authority-and-ownership.md) | Reconcile product rules and replace whole-file move evidence with ownership-scoped evidence. |
| [02-setup-path-move-flow.md](02-setup-path-move-flow.md) | Design the shared move operation and setup review. |
| [03-tests-and-package-proof.md](03-tests-and-package-proof.md) | Prove preservation, safe stops, old-record handling, and installed behavior. |
| [04-release-206.md](04-release-206.md) | Prepare version 2.0.6 and release evidence. |

Phase 1 starts with authority reconciliation before code. Focused red fixtures precede their P1/P2 code tasks. Phase 3 expands negative, integration, authentic-upgrade, and development package proof after those implementations. Phase 4 bumps the version after development proof, then proves one final 2.0.6 artifact before any separate release decision.

## Work Ownership and Output Contract

| Workstream | Future write scope | Depends on | Deliverable |
| --- | --- | --- | --- |
| Authority | Named PRD owners only | Plan review | Inline requirements and bounded history entries |
| Ownership core | Ownership parser and Store move-evidence code | Authority | Shared verifier and old-record compatibility |
| Setup flow | CLI preflight, shared operation, command/tool projections | Authority and ownership contract | Review and apply paths |
| Test and package proof | Scoped tests, fixture runner, disposable evidence | Core and setup contract | Regression results and installed transcript |
| Assembly and release | Index links if needed, drift register, scoped work backlog, release note, package metadata | Proof | Reviewable 2.0.6 candidate |
| Validation | Changed-file review and scoped fixes | Each deliverable | Trace, link, and scope checks |

Keep these scopes disjoint when workers run in parallel. Merge authority first, then core and setup, then proof, then release. The coordinator owns coordination and review. Authors own file writes.

The user-authorized [W22 R1 backlog](../../work/2026-10-31-w22-r1-checkout-move-and-block-ownership/00-index.md) is now saved. Its first authority stage gates code. The [documentation-review evidence](../../work/2026-10-31-w22-r1-checkout-move-and-block-ownership/evidence.md) records actual plan findings, not product results. Keep the active PRD index and [open drift D-049](../../prd/03-open-questions-and-risk-register.md#d-049-moved-checkout-setup-bypasses-project-identity-and-managed-block-ownership) linked to current authority. D-049 stays open until the required tests and installed-package proof pass. Preserve W22 R0 history.

## MCP Strategy

Use jdocmunch for project docs and jcodemunch for code and signatures. Reindex a missing or stale index before direct reads. The code index had conflicting local and Git identities during the source review; its attempted refresh failed. Direct reads were the bounded fallback for that code. Use Make Docs Store-free validation when useful. Do not call a Store mutator to validate this plan.

## Dependencies and Validation

Implementation requires separate user authorization. Before code changes, read `docs/assets/project/developing-deterministic-agentic-twins.md` and the named PRD owners. Recheck the package scripts and code touchpoints because this is a plan, not an implementation snapshot.

Validate this saved plan for relative links, complete phase references, draft state, scope, and no unfilled fields. Do not run product tests as part of the planning task. The later repair must pass the [test matrix](03-tests-and-package-proof.md), retain required existing W22 tests, and meet the [release gate](04-release-206.md).

## Intended Follow-On

- Route: `implementation-loop`.
- Next step: The authorized PRD reconciliation and gap review are complete. Obtain separate implementation authorization before code or product tests.
- Why: The user requested and received a reviewed backlog before full PRD maintenance. Its first stage preserves the product-authority gate.
- Coordinate Handoff: Carry `W22 R1` into the downstream work and source links.
- Execution remains unauthorized. A saved plan is not approval to change the Store, implement the repair, bump versions, or publish.
