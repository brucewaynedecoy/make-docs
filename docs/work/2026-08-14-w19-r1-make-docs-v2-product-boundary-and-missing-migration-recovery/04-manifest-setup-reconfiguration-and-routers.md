---
title: "Phase 4: Manifest, Setup, Reconfiguration, and Routers"
kind: "work"
status: "active"
coordinate: "W19 R1 P4"
source:
  type: "prd"
  path: "docs/prd/05-installation-profile-and-manifest-lifecycle.md"
---

# Phase 4: Manifest, Setup, Reconfiguration, and Routers

## Purpose

Implement explicit resource selection, manifest ownership and provenance, dry-run lifecycle planning, evidence-backed routers, optional projection, update/uninstall safety, and typed receipts.

## Overview

Provider resources remain available independently of project projection. Setup and reconfiguration record selection identity, distinguish provider content from managed projection and project-owned content, and stop on ambiguous ownership. Routers advertise only capabilities actually installed or available through the canonical CLI/MCP surface.

## Source PRD Docs

- [PRD 05 — Installation Profile and Manifest Lifecycle](../../prd/05-installation-profile-and-manifest-lifecycle.md)
- [PRD 07 — CLI Command Surface and Lifecycle](../../prd/07-cli-command-surface-and-lifecycle.md)
- [PRD 15 — Agent Instruction Ownership and Managed Blocks](../../prd/15-agent-instruction-ownership-and-managed-blocks.md)
- [PRD 17 — System Asset Materialization and Local Bootstrap](../../prd/17-system-asset-materialization-and-local-bootstrap.md)
- [PRD 18 — Compatibility Classification and Migration Safety](../../prd/18-compatibility-classification-and-migration-safety.md)
- [PRD 21 — Project Tool Directory and Resource Tiers](../../prd/21-project-tool-directory-and-resource-tiers.md)
- [PRD 22 — Project Documentation Asset Model](../../prd/22-project-documentation-asset-model.md)
- [PRD 39 — CLI Command Model and Operation Registry](../../prd/39-cli-command-model-and-operation-registry.md)
- [PRD 03 — Open Questions and Risk Register](../../prd/03-open-questions-and-risk-register.md)

## Source Obligations, Scenarios, And Findings

- O-001 remains separate W18 R3 work; O-002 remains superseded.
- Q-019 is relevant only if this phase introduces interactive Persona setup UX; the ordinary setup/resource work must not broaden into that UX by implication.
- A user-visible setup or reconfiguration change does not by itself require Unassisted Goal Testing. P4 applies Human Experience Review to every applicable experience promise and can reuse suitable evidence.
- Record `not-needed-now` for Unassisted Goal Testing when no material unassisted-use question remains. If the evidence is not sufficient, select the smallest additional testing activity that can answer the question.
- Link or create a canonical scenario only when Unassisted Goal Testing is active or explicit current authority requires it. Do not invent a `NUAT-###` identity.
- Findings and capability status remain owned by their canonical records.

## Stage 1 - Phase-Entry PRD Question And Risk Gate

### Tasks

- [x] t1: Verify the exact worktree, branch, HEAD, free disk, dirty-state allowlist, accepted P2/P3 closeouts, and implementation authorization; stop on unexpected user work or unsafe growth.
- [x] t2: Reread every Source PRD and PRD 03 from the live worktree and record each revision or content digest.
- [x] t3: Reevaluate at minimum Q-017, Q-018, R-004, R-006, R-014, and R-017; include Q-019 only if interactive Persona setup UX is introduced, preserve Q-017's per-project authority unless separately redesigned, and add newly relevant items.
- [x] t4: Record the required ID, digest, impact, classification (`blocking`, `impacted-nonblocking`, `unrelated`, `closed-regression-check`, or `new-authority-gap`), disposition, and rationale for every relevant item.
- [x] t5: Record an explicit no-blocker determination and finite phase correction/review budget before unlocking t8 when no blocker or gap remains.
- [x] t6: Stop before implementation for any blocker or authority gap and present an owner decision package with source anchors, affected phase and PRDs, bounded options and trade-offs, recommendation, consequences, exact PRD/register/history edits, focused validation, and a decision-only commit boundary; create no standalone decision file.
- [x] t7: Require canonical PRD/register/history changes, focused validation, a separate decision commit, and its recorded SHA before unlock; do not infer governance closure from work completion.
- [x] t8: Record the Stage 1 outcome, authority digests, accepted dependency evidence, and implementation unlock or stop result.

### Acceptance criteria

- Live setup, resource, migration, and router questions/risks have explicit current classifications.
- Q-017 and Q-019 are not silently broadened.
- Implementation remains locked until every blocker is resolved in canonical authority and a separate decision commit.

### Dependencies

- Accepted P2 resource core and P3 public operations.
- Current PRD authority and separate P4 implementation authorization.

### Closeout Notes

- Decision authority commit `133fd63cc1e77639b5ce0846cb5408595386225d` records the accepted P4 testing and review rules.
- The phase-entry review found no remaining blocker. P2 and P3 supplied the accepted resource and operation dependencies.

#### Baseline and dependency evidence

- Repository: Make Docs maintainer repository on `make-docs-v2`.
- Preflight HEAD: `26dd6dfd3affbfb08df9bd99c86b3e45ba431b59`.
- The worktree was clean before the required phase-state record was created. The only allowed preflight state path is `.make-docs/state/phase-state.yaml`.
- Free disk at preflight: 87 GB.
- P2 dependency evidence: decision closeout `f7d11867` and resource-core implementation `6bf85e59`.
- P3 dependency evidence: public-operation implementation `93749c9e`, provider follow-up `f2ed36c6`, and closeout `c13e99c5`.

#### Authority digests

The values below are Git blob IDs from the preflight HEAD.

| Authority | Git blob |
| --- | --- |
| Recovery design | `a5ce662c1cf96c6154347a6d36dcc4d3af21b01a` |
| W19 R1 plan overview | `dd7d39e130a679ebc7db4522d7b21351ed0717fd` |
| W19 R1 work index | `2f68f009c52adb74ed9b061115ea09f2c77efd38` |
| P4 work baseline | `0fc5ca25e0ba6e8a52e2ecf042da0537d8df9a9f` |
| PRD 03 | `9904e0d72acbb07af490aabee974a9e3a08e6085` |
| PRD 05 | `9cf32d380b06cbe59c919e84a7c6e89d80dabd04` |
| PRD 07 | `366abab21cf921b3665273207261ac7a2f27a69d` |
| PRD 15 | `c09afd8e739b5896d5afe23bf92cd94492a1815f` |
| PRD 17 | `961bcf73fe40648111efba9f19b291762c7638b6` |
| PRD 18 | `ae2e61f2ab53026b2e843796bc4b8dc32d637d48` |
| PRD 21 | `59faa61c7aa2dc8588883fc422e76b1fa134da9e` |
| PRD 22 | `95be2fb4d8bfcb3188099bd9f6af3957cbd5c60e` |
| PRD 39 | `1e46d7d535ecd57a9809bc92cc18fbe58fdbad88` |
| PRD 46 | `6902a83f8efddcd8df4ec9881a28360ea9b6e7ec` |
| PRD 50 | `6b7346b870ff53e142daafa81d2fc9dc10421143` |

#### Phase-entry classifications

| Item | Classification | Disposition |
| --- | --- | --- |
| P2 closeout | `closed-regression-check` | Accepted resource-core dependency is present. |
| P3 closeout | `closed-regression-check` | Accepted public-operation dependency is present. |
| Q-017 | `impacted-nonblocking` | Keep the broader machine-level layout deferred. P4 keeps the installed-provider default and explicit project-local projection. |
| Q-018 | `impacted-nonblocking` | Keep the broader configuration design open. P4 uses the current tool-owned manifest and accepted selection contract without redesigning configuration. |
| Q-019 | `unrelated` | P4 does not add interactive Persona setup or change Persona primitives, storage, or binding. |
| R-004 | `impacted-nonblocking` | Use focused consistency and path-hygiene proof for each P4 path or registry change. |
| R-006 | `impacted-nonblocking` | One frozen classification and audit snapshot drives review, backup, update, uninstall, and receipts. |
| R-014 | `impacted-nonblocking` | Land shared CLI and operation behavior before or with dependent router guidance. |
| R-017 | `impacted-nonblocking` | Keep routers thin. Do not copy workflow policy or imply unselected Skills or plugins. |
| Later Human Experience and testing routes | `impacted-nonblocking` | P4 owns safe router installation and reconciliation. W20 R0 and W21 R0 retain ownership of their policy resources and route content. P4 does not advertise content that is not installed. |
| Setup-change testing activation | `new-authority-gap` | Resolved by the accepted decision below. |
| Correction and review budget | `blocking` | Resolved by the accepted decision below. |
| P4 implementation authorization | `blocking` | Controlled by the later implementation gate. It is not granted by this closeout. |

#### Accepted decisions

Testing selection:

- P4 uses the current PRD 46 and PRD 50 testing-selection contract.
- A user-visible setup or reconfiguration change does not by itself require Unassisted Goal Testing.
- P4 still applies Human Experience Review to every applicable experience promise. The review can reuse suitable evidence.
- Record `not-needed-now` for Unassisted Goal Testing when no material unassisted-use question remains.
- If the evidence is not sufficient, select the smallest additional testing activity that can answer the question.
- Link or create a canonical scenario only when Unassisted Goal Testing is active or explicit current authority requires it. Do not invent a `NUAT-###` identity.

Correction and review budget:

- P4 has at most two bounded correction attempts and two independent review cycles.
- Each correction addresses only actionable defects inside the accepted P4 scope.
- After each correction, rerun the affected checks and all required fixed gates.
- A new product choice, authority conflict, dependency approval, or scope increase stops affected work and requires an owner decision.
- If the budget is used before acceptance, stop and report the remaining defects, evidence, and recommended next decision. Do not continue through repeated unchanged attempts.

#### Stage 1 result

- No unresolved product question, risk, dependency, contradiction, or new authority gap blocks the documentation-only decision commit.
- PRDs 46 and 50 already contain the accepted testing authority. PRD 03 needs no new item because the gap was stale P4 work wording, not a new product question or risk.
- This P4 work file is the only documentation change needed for the accepted decisions.
- Focused document validation and the separate documentation-only commit remain required.
- P4 implementation remains locked until the documentation-only commit SHA is recorded and the owner gives separate implementation authorization.
- Phase / capability status: Stage 1 preflight and owner decision review are complete. Implementation is not authorized.

## Stage 2 - Implement Selection And Manifest Authority

### Tasks

- [x] t9: Implement explicit projection selection as `none`, one or more of the four resource types, or the full system set without reviving `prompts`, `templatesMode`, or `referencesMode` legacy authority.
- [x] t10: Record manifest identity, schema version, effective selections, provider/resource provenance, managed destination, source digest, installed digest, ownership class, and operation lineage required by the PRDs.
- [x] t11: Keep provider availability, local managed projection, explicit project override, project documentation, runtime state, and selected Skill payloads as distinct manifest/audit classes.
- [x] t12: Fail closed when an existing path lacks trustworthy ownership or when selection/provenance cannot be reconstructed; never treat name or destination alone as ownership proof.

### Acceptance criteria

- Selection semantics are explicit, stable, and limited to current authority.
- Manifest data can distinguish every provider, projection, override, project, runtime, and Skill class needed for safe lifecycle behavior.
- Ambiguous ownership stops before mutation.
- Bare installation does not silently select resources for projection or install Skills.

### Dependencies

- Stage 1 unlock.
- P2 identity/provenance types and P3 operation contracts.

### Closeout Notes

- Testing-mode decision(s): selection resolution, manifest round-trip, provenance, legacy-field rejection, and ambiguous-ownership fixtures.
- Phase / capability status: selection and manifest authority are complete in implementation commit `efebfa2927907ef63f0993b0b22e8a34f795a62c`.

## Stage 3 - Implement Dry-Run Lifecycle Plans And Routers

### Tasks

- [x] t13: Implement setup and reconfigure dry-run plans that enumerate intended creates, updates, preserves, conflicts, skips, removals, and stops before apply. Activate the P3-pending `project.surface.ensure` handler for `make-docs project surface ensure <archive|artifacts|assets>` and its MCP tool. Create only the selected on-demand directory and configured routers through the reviewed plan.
- [x] t14: Route managed-file conflicts through explicit review using canonical source and installed digests; never append-merge or overwrite as a substitute for ownership evidence.
- [x] t15: Generate or update bounded `AGENTS.md` and `CLAUDE.md` managed blocks only from evidence-backed installed capabilities and canonical CLI/MCP access paths.
- [x] t16: Ensure routers identify top-level prompt/system-workflow access without embedding resource bodies, UAT policy, hidden implementation guidance, Playbook/Protocol claims, or optional integration claims that were not selected.
- [x] t17: Preserve unmanaged router content byte-for-byte outside the owned block and fail closed on malformed, duplicated, or ambiguous managed blocks.

### Acceptance criteria

- Every planned mutation has an explicit disposition before apply.
- Router claims match installed/provider capability evidence and remain thin.
- User-authored router content is preserved.
- Setup/reconfigure planning cannot silently overwrite, append-merge, select a Skill, or activate removed capabilities.
- P4 clears the `W19 R1 P4` pending state only after the `project.surface.ensure` handler, CLI projection, MCP tool, and focused tests pass.

### Dependencies

- Stage 2 manifest model.
- P3 CLI/MCP availability contracts.

### Closeout Notes

- Testing-mode decision(s): dry-run snapshots, conflict injection, managed-block idempotency, malformed-block, and capability-claim fixtures.
- Phase / capability status: dry-run planning, thin routers, and the `project.surface.ensure` CLI and MCP surfaces are complete in `efebfa2927907ef63f0993b0b22e8a34f795a62c`.

## Stage 4 - Implement Projection, Update, Uninstall, And Receipts

### Tasks

- [x] t18: Materialize only explicitly selected clean managed resources under `.make-docs/system/{contracts,prompts,references,templates}/` through the reviewed plan and shared ensure operation.
- [x] t19: Implement update so unchanged managed files advance deterministically, modified or ambiguous files enter review, project-owned overrides remain project-owned, and provider availability remains independent of projection.
- [x] t20: Implement uninstall so only proven owned matching bytes are removed, symlinks are unlinked without following targets, and parent directories with unmanaged descendants are preserved.
- [x] t21: Return typed lifecycle receipts that identify operation, project/manifest identity, selections, outcomes, conflicts, backup references where applicable, and commit time without claiming validation, acceptance, publication, or release.
- [x] t22: Preserve the accepted distinction between a dry-run/review result, repository mutation, Store receipt, validation evidence, and release recommendation.

### Acceptance criteria

- Projection is optional, selected, provenance-aware, and conflict-safe.
- Update and uninstall preserve modified, ambiguous, user-owned, and unmanaged content.
- Receipts are typed and bounded to the mutation they prove.
- No lifecycle action follows symlink targets or removes an unmanaged parent.

### Dependencies

- Stages 2 and 3.
- P5 backup/rollback primitives must gate destructive migration dispositions; ordinary safe update/uninstall may proceed only within current PRD authority.

### Closeout Notes

- Testing-mode decision(s): projection, update, uninstall, symlink, unmanaged-descendant, and receipt fixtures.
- Phase / capability status: selected projection, update, safe project removal, and bounded mutation receipts are complete in `efebfa2927907ef63f0993b0b22e8a34f795a62c`.

## Stage 5 - Validate Lifecycle Safety

### Tasks

- [x] t23: Run focused setup, reconfigure, projection, router, update, uninstall, receipt, type, path-hygiene, and whitespace tests across clean, modified, ambiguous, missing, and legacy fixtures.
- [x] t24: Prove idempotent unchanged reruns reuse valid evidence, affected-only failures are retried within budget, and conflict or ambiguity never degrades to overwrite.
- [x] t25: Obtain independent review of selection, manifest provenance, router claims, conflict planning, removal safety, and receipts; correct only actionable defects within the finite budget.
- [x] t26: Record exact changed-file scope, validation evidence, nonblocking items, and P5 handoff without running migration, package projection, dogfood, release, or publication.

### Acceptance criteria

- Focused lifecycle and failure-injection tests pass.
- Independent review finds no unresolved ownership, router, conflict, or removal defect.
- Only accepted affected checks are rerun after correction.
- P5 receives explicit manifest, lock/backup prerequisites, and typed plan/receipt interfaces.

### Dependencies

- Stages 2 through 4 complete.
- Finite correction and review budget.

### Closeout Notes

- Testing-mode decision(s): deterministic lifecycle fixtures plus independent safety review.
- Phase / capability status: P4 is implemented, independently reviewed, owner-accepted, committed, and pushed through `efebfa2927907ef63f0993b0b22e8a34f795a62c`. P5 remains separately gated.
- Validation evidence: the independent review passed the focused P4 and affected CLI tests, zero-error TypeScript check, build, path-hygiene check, whitespace check, package smoke check, and direct human-surface review. The closeout pass reran all 13 focused P4 tests, the zero-error TypeScript check, and the build successfully.
- Human Experience Review: all applicable P4 experience promises are satisfied after the public project-help defect was corrected. Unassisted Goal Testing remains `not-needed-now` because no material unanswered unassisted-use question remains. Reconsider it if later evidence creates such a question.
- P5 handoff: P4 supplies explicit manifest selections, resource provenance and ownership evidence, lifecycle plan snapshots with stale-plan rejection, safe project update and removal behavior, and bounded mutation receipts. P5 must add its lock, quiescence, backup, rollback, and migration controls before any destructive migration disposition.

#### Coverage reconciliation

| Candidate | Verdict | Reason |
| --- | --- | --- |
| PRD authority and risk register | `none` | The committed work implements the accepted PRD 05, 07, 15, 17, 18, 21, 22, and 39 contracts. It does not change product authority or add a new risk. |
| P4 work record | `update-existing` | This file owns the phase tasks, validation evidence, completion state, and P5 handoff. |
| W19 R1 work index | `update-existing` | The index must show the proved P4 completion and implementation commit. |
| Project, developer, and user guides | `none` | P4 changes setup and lifecycle surfaces but adds no separate guide requirement. The shipped routers and command help are the owning user surfaces. |
| Automated implementation testing | `none` | The committed focused suite already covers selection, provenance, dry run, conflicts, routers, projection, update, removal, receipts, and CLI/MCP parity. The closeout rerun passed all 13 focused tests. |
| Human Experience Review | `update-existing` | This closeout note records the independent review result and the one corrected public-help defect. |
| Unassisted Goal Testing | `none` | Current direct runs, focused interaction tests, source review, and package smoke evidence answer the applicable P4 questions. Reopen only if later evidence shows a material unassisted-use question. |
| History | `create` | A new immutable P4 closeout breadcrumb records the accepted implementation and this coverage result. |
| Deferred obligations and findings | `none` | P4 creates no new obligation or finding. Existing P5 migration and backup work remains in the W19 R1 backlog. |

## Corrective Work Reopened - 2026-09-02

P4 is reopened because [D-029](../../prd/03-open-questions-and-risk-register.md#d-029-w19-r1-resource-topology-and-router-authority-drift) proves that commit `02002ba23` changed accepted authority and commit `efebfa29` implemented the changed router model. The prior closeout evidence remains historical evidence of what was accepted at that time. It is not changed into a claim that the corrected requirements were already met.

### Tasks

- [x] t1: Commit the owner-approved design, PRD, risk-register, plan, and work-authority correction.
- [x] t2: Normalize the sole current resource tree to `.make-docs/system/<type>/` for contracts, prompts, references, and templates while keeping stable `make-docs://system/<type>/<path>` identities.
- [x] t3: Install configured-harness routers at the project root, `docs/`, `.make-docs/`, `.make-docs/system/`, and every typed directory in fresh setup and reconfiguration.
- [x] t4: Make resource selection control resource bodies only, and record router ownership separately from resource projection in plans and manifests.
- [x] t5: Restore the exact `# Documentation Router` heading and full routing duties, with valid local resource use first and `make-docs resource read <uri>` fallback when a body is absent. Do not infer Skills, plugins, Playbooks, Protocols, or unavailable policy.
- [x] t6: Treat legacy `.make-docs/<type>/system/` content only as migration input, move or remove only verified clean managed files, and preserve all unknown, modified, mixed, unowned, or conflicting content for review.
- [x] t7: Prove fresh install, selection change, legacy migration, router-conflict, harness-selection, and uninstall behavior across the accepted test matrix.
- [x] t8: Prove template, generated package, dogfood, and installed-project parity without hand-editing generated package copies.
- [x] t9: Obtain an independent read-only review of authority, implementation, migration safety, and routing behavior.
- [x] t10: Create a new P4 corrective closeout history record after acceptance. Keep the original closeout and the open correction erratum unchanged.
- [x] t11: Refresh the P7 baseline and P4 dependency proof after recovery. Preserve `P7-AUTHORITY`, D-005, P7-BUDGET, and the accepted Persona, scenario, and six-operation meaning.

### Acceptance criteria

- Corrected design and PRD authority states that `.make-docs/system/<type>/` is the sole current tree.
- Every configured harness has the complete always-local router skeleton even when no resource bodies are selected.
- Resource selection changes bodies only and does not remove router files or typed directories.
- The `docs/` router has the exact `# Documentation Router` heading and full lifecycle, design, planning, PRD, work, risk, artifact, Persona, UAT, coverage, history, link, and formatting duties.
- No router infers Skills, plugins, Playbooks, Protocols, or unavailable policy.
- Local-first resolution and CLI fallback preserve stable resource URIs.
- Legacy layout migration is fail-closed and removes no file without verified managed ownership and matching trusted bytes.
- The accepted install, reconfigure, migration, conflict, harness, uninstall, build, validation, and smoke checks pass.
- An independent reviewer reports no unresolved authority, migration, or routing defect.
- A new corrective closeout history record proves the accepted correction without changing the old closeout or the open correction erratum.
- P7 remains paused until its baseline and P4 dependency proof are refreshed. P7 implementation is not authorized.

### Dependencies

- Owner-approved Make Docs Authority and Router Recovery Plan.
- Corrected PRDs 17 and 21 and D-029.
- Existing P2, P3, P5, and P6 behavior must remain compatible unless the corrective implementation proves a narrow required change.

### Closeout Notes

The correction is complete. Commit `40c4d231` corrected the accepted authority. Commit `e1bbec04` retired the unused content package. Commit `315dce5d` restored the router topology, ownership model, migration controls, and runtime behavior. Commit `8763e9b` aligned the package smoke proof with the migration state that setup creates. Commit `2f36f72` raised only the documentation-router managed-block cap to the owner-approved 25 lines.

The accepted test matrix passed. The proof includes 1,255 CLI tests, 49 default checks, 181 focused independent-review tests, the build, PRD authority validation, template parity, dogfood dry-run parity, `git diff --check`, and the full package smoke pack. The smoke pack passed through the `npx`, `pnpm dlx`, and `bun x` package-runner paths after its stale directory expectation was corrected.

Independent review found no unresolved authority, migration, routing, ownership, or smoke-proof defect. The owner reviewed and accepted each implementation boundary. The [corrective closeout](../../assets/archive/history/2026-09-02-w19-r1-p4-router-recovery-closeout.md) records the result. The original P4 closeout and the open correction erratum remain unchanged as historical records.

The P7 dependency proof is re-proved at `2f36f72`. `P7-AUTHORITY` remains accepted. D-005 and P7-BUDGET remain open. The active P7 baseline binds to the final closeout commit before owner decision review resumes at D-005. P7 implementation is not authorized.
