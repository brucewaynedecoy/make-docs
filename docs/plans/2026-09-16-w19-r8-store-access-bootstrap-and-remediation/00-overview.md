---
title: "W19 R8 Store Access Bootstrap and Remediation Plan"
kind: "plan"
status: "draft"
coordinate: "W19 R8"
source:
  type: "design"
  path: "docs/designs/2026-09-16-store-access-bootstrap-and-remediation.md"
follow_on:
  route: "prd-generation"
  next_prompt: "../../../.make-docs/system/prompts/plan-to-prd-change.prompt.md"
  why: "Make the current setup, Store, package, and harness owners exact before implementation starts."
  coordinate_handoff: "Carry W19 R8 into requirement history and the one-phase delta backlog."
---

# W19 R8 Store Access Bootstrap and Remediation Plan

## Purpose

Plan one complete correction for the closed loop between Make Docs setup, Store access, upgrade recovery, and agent work. This plan follows the [Store Access Bootstrap and Remediation design](../../designs/2026-09-16-store-access-bootstrap-and-remediation.md). It uses authoritative PRD maintenance and one implementation phase.

This package does not authorize implementation. It does not authorize a release, commit, push, or write to an affected real project or its Store.

## Objective

Deliver one exact packaged CLI candidate that accepts a normal verified package-manager launcher, applies independent setup subplans, remains useful with no Store configured, limits Store failure to the affected operation, supports mid-task access recovery, supplies a bounded generic MCP profile, and safely recovers v1, early-v2, partial, and interrupted setup.

Completion requires the full automated and isolated-package matrix. A source-only, unit-only, or local-build-only pass is not complete.

## Governing Invariant

`docs/prd/` states the current product contract. This plan owns correction order. The delta backlog owns implementation work. The Store owns operational state when the Store is configured and usable. Store absence does not create project-local operational authority.

### Remediation execution rule

This work repairs the Make Docs CLI and Store-access path. Store access, MCP access, a harness receipt, a Store-backed lifecycle run, and successful `make-docs setup` are not prerequisites for implementation.

A missing or unreachable Store is expected evidence. It must not stop repository inspection, code changes, tests, package construction, isolated-home proof, evidence capture, or review. The implementation agent must not ask the user to repair the broken setup first. It must not use Store-backed lifecycle recording as a gate for this correction.

The agent can stop only for a real safety risk, missing authority, missing required source material, a required product choice, or an environment fault that also prevents isolated proof.

## Coordinate Decision

- Coordinate: `W19 R8`.
- Classification: `revision`.
- Evidence: The work corrects W19 R3 Store-owned state, W19 R5 Skills adoption, W19 R6 harness setup, and the unimplemented W19 R7 setup and recovery correction. R8 is the next unused revision in that lineage.
- Phase count: Exactly one implementation phase. Four ordered stages keep the package fast while preserving one final candidate gate.

## Maintenance Inputs

| Input | Format and location | Confidence and use |
| --- | --- | --- |
| User terminal transcripts, September 16 | Direct task evidence | High confidence for the two blocked setup paths and their exact public text. |
| Linked agent task | Codex task transcript | High confidence that agent guidance repeats an already answered method choice and stops instead of preserving Store-free progress. |
| Active launcher check | `command -v make-docs` and filesystem evidence | High confidence that the normal global npm launcher is a symbolic link to the package bin. |
| Current executable verification | `packages/cli/src/harness-access/contract.ts` and `packages/cli/src/setup-system.ts` | High confidence that the verifier rejects links before `realpath`, drops the exact error, and emits a generic reinstall action. |
| Current setup composition | `packages/cli/src/cli.ts`, `packages/cli/src/wizard.ts`, `packages/cli/src/setup-system.ts`, and `packages/cli/src/skills-ui.ts` | High confidence that one late Skill or system blocker can prevent useful independent setup work. Recheck current source before implementation. |
| Current operation policy | `packages/cli/src/operations/harness-policy.ts`, operation registry, and Store bootstrap | High confidence for current caller, receipt, Store, and access checks. |
| Prior correction | [W19 R7 design](../../designs/2026-09-15-setup-interview-and-recovery-correction.md), plan, PRD updates, and backlog | Accepted planning authority that remains unimplemented and is superseded by this wider correction. |
| Current product authority | PRDs 07, 08, 10, 18, 25, 28, 38, and 39 | Existing owners for all affected product behavior. |

## Human Experience Propagation

| Promise | Existing owning PRD | Human-facing surface or indirect effect | Work phase | Evidence source or selected testing type | Accepted obligation, if any |
| --- | --- | --- | --- | --- | --- |
| HX-1: normal installed launcher verifies or gives exact repair detail | [PRD 10](../../prd/10-packaging-validation-and-release-reference.md), [PRD 25](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md), and [PRD 28](../../prd/28-shared-agentics-installation-and-harness-exposure.md) | `setup system` method state and blocker text | [P1](01-store-access-bootstrap-and-remediation.md) | Automated link matrix and isolated global-install transcript | None |
| HX-2: independent setup subplans keep valid results | [PRD 07](../../prd/07-cli-command-surface-and-lifecycle.md), [PRD 08](../../prd/08-skills-catalog-and-distribution.md), [PRD 38](../../prd/38-global-store-and-project-state.md), and [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) | Full setup review, apply, failure, and repeat setup | [P1](01-store-access-bootstrap-and-remediation.md) | Fault-injected integration tests and packaged transcripts | None |
| HX-3: setup and upgrade are safe to run again | [PRD 18](../../prd/18-compatibility-classification-and-migration-safety.md), [PRD 38](../../prd/38-global-store-and-project-state.md), and [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) | v1, early-v2, partial, interrupted, and repeated setup | [P1](01-store-access-bootstrap-and-remediation.md) | Upgrade and recovery matrix | None |
| HX-4: no Store configuration remains valid | [PRD 25](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md), [PRD 38](../../prd/38-global-store-and-project-state.md), and [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) | Store-free agent and CLI operations | [P1](01-store-access-bootstrap-and-remediation.md) | Store-open spy tests and agent-path transcript | None |
| HX-5: Store errors are typed and scoped | [PRD 25](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md), [PRD 38](../../prd/38-global-store-and-project-state.md), and [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) | Human, JSON, MCP, and agent guidance | [P1](01-store-access-bootstrap-and-remediation.md) | Typed-result parity and continuation tests | None |
| HX-6: mid-task access setup retries only the affected operation | [PRD 28](../../prd/28-shared-agentics-installation-and-harness-exposure.md) and [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) | Active agent task and focused setup help | [P1](01-store-access-bootstrap-and-remediation.md) | Agent transcript with before, setup, refresh, retry, and continuation | None |
| HX-7: generic MCP clients receive bounded setup | [PRD 25](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md) and [PRD 28](../../prd/28-shared-agentics-installation-and-harness-exposure.md) | Interactive setup, non-interactive setup, and on-demand help | [P1](01-store-access-bootstrap-and-remediation.md) | Generic-client identity, access-ceiling, rotation, removal, and preservation tests | None |
| HX-8: remediation never depends on the broken Store path | [PRD 10](../../prd/10-packaging-validation-and-release-reference.md) and [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) | Implementation instructions and package gate | [P1](01-store-access-bootstrap-and-remediation.md) | Store-off implementation transcript and isolated proof | None |

## Active Authority Baseline

The active PRD set remains the product authority. No archive gate or new PRD is needed. The maintenance is surgical.

W19 R7 PRD text is present but its work is not implemented. W19 R8 updates the current requirements in place and records that R8 supersedes the open R7 implementation route. Completed W19 R3, R5, and R6 evidence remains historical lineage.

The worktree contains unrelated user changes. Execution must preserve them. The W19 R8 document and implementation scopes must not restore older file versions or stage unrelated work.

## Candidate Decision Matrix

| Candidate | Decision | Owning PRD or product subject | Reason | Evidence |
| --- | --- | --- | --- | --- |
| Setup subplan independence and early validation | `update-existing` | PRD 07 and PRD 39 | Existing CLI and setup owners. | Full setup transcript and current grouped planner. |
| Skills selection routing | `update-existing` | PRD 08 | Existing selected-Skill owner. | Setup asks for a change that this path rejects late. |
| Installed launcher and candidate proof | `update-existing` | PRD 10 | Existing package proof owner. | Normal npm link is rejected and reinstall repeats it. |
| Repeat-safe upgrade and recovery | `update-existing` | PRD 18 | Existing compatibility and migration owner. | Failed and partial setup can leave no reachable next action. |
| Typed Store access and operation-scoped failure | `update-existing` | PRD 25 | Existing operation-access owner. | Store effect is already declared per operation but agent behavior broadens failure. |
| Exact executable identity, generic MCP, and mid-task setup | `update-existing` | PRD 28 | Existing harness adapter and exposure owner. | Current static list supports only known clients and has no generic setup route. |
| Optional Store state and independent receipts | `update-existing` | PRD 38 | Existing Store and harness-state owner. | No configuration must be distinct from unavailable or unsafe state. |
| Public setup grammar, access results, and agent continuation | `update-existing` | PRD 39 | Existing command and machine-result owner. | Current output hides the exact verifier fault and repeats invalid choices. |
| Confirmed closed-loop drift | `update-existing` | PRD 03 | Living confirmed-drift owner. | The full loop is reproduced and has a direct source cause. |
| New product PRD | `none` | Existing owners cover the full correction. | This is a cross-owner correction, not a new product subsystem. | Ownership review above. |
| PRD index update | `none` | Current index remains accurate. | No PRD is created, renamed, removed, or moved. | Current document map. |
| New deferred obligation | `none` | The whole result is required in P1. | Deferral would leave the closed loop in place. | User request and release-blocking effect. |
| New Unassisted Goal Test | `none` | Automated installed scenarios and agent Human Experience Review answer the current decisions. | A new scenario would not change the implementation decision now. | Current testing authority. |

## Existing PRDs To Update

| Existing PRD | Owning sections | Current normative update | Preserved surrounding authority |
| --- | --- | --- | --- |
| [03 Risk Register](../../prd/03-open-questions-and-risk-register.md) | Confirmed Drift | Add D-038 and route D-034 and D-035 to W19 R8. | Existing item numbers, states, and unrelated risks. |
| [07 CLI Command Surface](../../prd/07-cli-command-surface-and-lifecycle.md) | Interactive wizard; plan review and apply | Validate selections before final review and apply independent subplans without losing valid results. | Existing command names, conflict rules, and file ownership. |
| [08 Skills Catalog](../../prd/08-skills-catalog-and-distribution.md) | Explicit Selected-Skill Model | Keep one Skills interaction and prevent an invalid Skill change from blocking independent setup. | Catalog, trust, scope, payload, and adoption rules. |
| [10 Packaging](../../prd/10-packaging-validation-and-release-reference.md) | Validation Matrix; installed candidate proof | Add normal package-manager link proof and repository-unavailable Store-access cases. | Current tarball, runner, release, and Skill proof. |
| [18 Migration Safety](../../prd/18-compatibility-classification-and-migration-safety.md) | Ordered Migration | Make invalid, partial, interrupted, and repeated setup reachable and safe to rerun. | Backup, ownership, quiescence, and recovery evidence. |
| [25 Runtime and Operation Boundaries](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md) | Operation Access Contract | Define optional Store state, typed access failure, scoped stop, and generic-client proof. | Access metadata and shared-core ownership. |
| [28 Harness Exposure](../../prd/28-shared-agentics-installation-and-harness-exposure.md) | Harness Connection Methods | Verify resolved package links, add bounded generic MCP, and define mid-task refresh and retry. | Static first-party adapter inventory and native-config preservation. |
| [38 Global Store](../../prd/38-global-store-and-project-state.md) | R-SCOPE, R-LIFE, R-HARNESS-STATE, R-XFER, R-TEST | Distinguish unconfigured from unavailable, preserve independent machine results, and keep recovery reachable. | Store-only state, privacy, locks, checkout binding, and no local fallback. |
| [39 Command Model](../../prd/39-cli-command-model-and-operation-registry.md) | R-SETUP, R-MIG, R-STATE, R-TEST, R-INV | Expose real verifier errors, independent subplans, typed access, one exact action, and agent continuation. | Command tree, operation identity, and machine-result parity. |

## Genuinely New Product PRDs

None. The current CLI, package, migration, operation, harness, Store, and command PRDs own the full result.

## Requirement History Entries

Add a `2026-09-16 — W19 R8` entry to PRDs 07, 08, 10, 18, 25, 28, 38, and 39. Each entry records the prior closed-loop contract, the new reachable contract, the observed reason, and links to this plan and the design.

The risk register uses its own numbered drift records. D-034 and D-035 keep their identities. D-038 records the wider defect.

## Affected Links, Risks, Plans, And Work

| Surface | Artifact | Required maintenance | Authority role |
| --- | --- | --- | --- |
| Risks | [PRD 03](../../prd/03-open-questions-and-risk-register.md) | Add D-038 and move the open D-034 and D-035 follow-up gate to W19 R8. | Living confirmed-drift record. |
| Prior plan and work | W19 R7 | Keep as superseded planning history. Do not implement it separately. | Prior diagnosis and narrower authority. |
| Plan | This directory | Keep one phase and the exact packaged gate. | Correction order and limits. |
| Work | [W19 R8 delta backlog](../../work/2026-09-16-w19-r8-store-access-bootstrap-and-remediation/00-index.md) | Carry all implementation, evidence, and review work. | Active implementation queue after separate authorization. |
| History | Future W19 R8 P1 closeout | Create only during an authorized closeout. | Execution history, not product authority. |

## Phase Map

| File | Purpose |
| --- | --- |
| [01-store-access-bootstrap-and-remediation.md](01-store-access-bootstrap-and-remediation.md) | Correct setup, executable trust, Store degradation, mid-task access, generic MCP, recovery, and packaged proof in one phase. |

## Output Contract

- Design: `docs/designs/2026-09-16-store-access-bootstrap-and-remediation.md`.
- Plan: this directory with one phase file.
- Current PRD updates: PRDs 03, 07, 08, 10, 18, 25, 28, 38, and 39.
- New PRDs: none.
- Delta backlog: `docs/work/2026-09-16-w19-r8-store-access-bootstrap-and-remediation/` with one phase file.
- Evidence during implementation: one central `evidence.md` plus case folders only when a durable capture is needed.

## Worker Ownership

The source changes are tightly coupled. Use one implementation owner for the runtime path. Use a separate validation owner when delegation is available. This split does not create another phase.

| Worker | Scope | Write Scope | Dependencies | Deliverables |
| --- | --- | --- | --- | --- |
| Runtime implementation owner | Setup composition, executable verification, operation access, Store results, generic MCP, guidance, and focused tests | Relevant `packages/cli/**`, shipped guidance in `packages/docs/template/**`, and the W19 R8 evidence area only | Approved implementation authority | One coherent implementation and focused proof |
| Validation and fix owner | Review candidate behavior, run full tests, build exact tarball, execute isolated matrix, record Human Experience Review, and make bounded fixes | Test/evidence files and exact implementation fixes found by validation | Runtime candidate | Final candidate proof and issue disposition |
| Coordinator | Scope, approval, status, and blocker routing | None when delegation is available | Worker results | User-facing status and gate handling |

No worker can use unavailable Store access as a reason to stop remediation. A worker that encounters Store failure records it as evidence and continues all independent work.

## MCP Strategy

- Preferred servers: jcodemunch and jdocmunch for source and document discovery when available.
- Make Docs Store or Make Docs MCP: optional during remediation and never a prerequisite.
- Fallback: direct repository reads after the required index refresh attempt, direct package commands, temporary homes, and temporary Store roots.
- A Store or MCP failure must not trigger `make-docs setup` as a precondition for this work.

## Validation

Validation must prove all of the following from one exact packed candidate:

- a normal global npm launcher resolves to and verifies the declared package bin;
- unsafe or mismatched links remain blocked with the exact reason and one useful action;
- machine, project, Skills, and resource subplans retain independent status and results;
- a project with no Store configuration can use all Store-free operations without opening the Store;
- `not-configured`, `unavailable`, `unsafe`, and `denied` remain distinct across human, JSON, MCP, and agent guidance;
- a mid-task access setup refreshes state and retries only the affected operation;
- generic MCP setup preserves client-owned files and enforces reviewed machine and project ceilings;
- v1, early-v2, partial, failed, interrupted, and repeated setup have a reachable next action;
- W19 R7 interview and recovery cases still pass inside the wider matrix;
- no project-local operational state, broad home permission, false success, or task-wide stop is introduced;
- each Human Experience promise has evidence, observation, conclusion, reviewer, and stated limits.

Run focused tests first. Then run the full CLI suite, default validation, package smoke proof, PRD authority validation, link/path checks, and the isolated upgrade matrix. Human feedback can follow as an optional experience handoff. It is not an acceptance gate.

## Intended Follow-On

This handoff is authoritative unless the user overrides it. It is not implementation authorization.

- Route: `prd-generation`.
- Next step: Maintain PRDs 03, 07, 08, 10, 18, 25, 28, 38, and 39 from this plan, then use the W19 R8 backlog.
- Why: Current product authority must state the reachable setup and scoped Store behavior before implementation begins.
- Coordinate Handoff: Carry W19 R8 into each requirement-history entry and W19 R8 P1 into implementation history and commits.
