---
title: "W19 R1 Make Docs v2 Product Boundary and Missing Migration Recovery Work Backlog"
kind: "work"
status: "completed"
coordinate: "W19 R1"
follow_on:
  route: "none"
  next_prompt: "none"
  why: "All ten W19 R1 phases now have completed or explicit not-applicable dispositions."
  coordinate_handoff: "No W19 R1 work remains. Later work can cite the recorded phase evidence by exact scope."
source:
  type: "prd"
  path: "docs/prd/01-product-overview.md"
---

# W19 R1 Make Docs v2 Product Boundary and Missing Migration Recovery Work Backlog

> In v2, work backlogs are directories. This `00-index.md` is the entry point; phase detail lives in sibling files.

## Purpose

Turn the accepted W19 R1 plan and reconciled PRD authority into a dependency-ordered implementation queue for the reduced product boundary, four peer system-resource types, CLI/MCP availability, optional project projection, fail-closed lifecycle migration, general run capture, Persona-executed Naive UAT, traced retirement, optional agentics, and upstream-to-package-to-dogfood validation. This backlog preserves user-owned and ambiguous content, opaque legacy `playbook_runs`, anti-coaching, installed-product, scenario, evidence, finding, and gate semantics. It does not authorize implementation, commit, integration, publication, release, or deployment.

## Authority And Source Inputs

- [Accepted W19 R1 plan](../../plans/2026-08-13-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/00-overview.md)
- [Accepted recovery design](../../designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md)
- [PRD 00 — Active PRD Index](../../prd/00-index.md)
- [PRD 03 — Open Questions and Risk Register](../../prd/03-open-questions-and-risk-register.md)
- The exact current owner PRDs listed in each phase file
- Current normative PRD bodies are product authority. The plan supplies sequencing and rationale; requirement history supplies provenance only.

## Phase-Entry PRD Question And Risk Gate

Every phase begins with `Stage 1 - Phase-Entry PRD Question And Risk Gate` before any implementation write or destructive trace. The executor must reread the phase's current owning PRDs and PRD 03 from the active worktree, record their revision or content digest, and reevaluate the phase's candidate mapping as a non-exhaustive starter that is overridden by the live authority read.

For every relevant `Open`, `Confirming`, `Deferred`, or closed regression item, record the ID, current authority revision or digest, phase impact, one classification (`blocking`, `impacted-nonblocking`, `unrelated`, `closed-regression-check`, or `new-authority-gap`), disposition, and rationale. If no blocker or authority gap exists, record an explicit no-blocker result before unlocking implementation.

If an item is blocking or exposes a new authority gap, stop before implementation writes and present a bounded owner decision package in the coordination channel rather than creating a standalone decision file. The package must include the source anchor, affected phase and PRDs, bounded options and trade-offs, recommendation, consequences, exact PRD/register/history changes, focused validation, and a decision-only commit boundary. After the owner decides, update canonical PRD authority and applicable history, validate it, commit the decision separately, and record the decision commit SHA in the phase-entry record before implementation unlocks.

Task completion never closes a question, risk, finding, waiver, deferred obligation, acceptance scenario, or capability by implication.

## Phase Map

| File | Coordinate | State | Purpose |
| --- | --- | --- | --- |
| [01-upstream-documentation-authority.md](./01-upstream-documentation-authority.md) | W19 R1 P1 | Complete at `aa6560b` | Established upstream documentation authority for peer resources and the reduced product boundary. |
| [02-resource-identity-and-resolver-core.md](./02-resource-identity-and-resolver-core.md) | W19 R1 P2 | Complete and owner-accepted; pushed through `6bf85e59` | Implement stable identity, providers, resolution, provenance, path safety, and typed resource operations. |
| [03-operation-registry-cli-and-mcp.md](./03-operation-registry-cli-and-mcp.md) | W19 R1 P3 | Complete and owner-accepted; pushed through `f2ed36c6` | Project the typed resource, run, and Naive-UAT operations consistently through CLI and MCP. |
| [04-manifest-setup-reconfiguration-and-routers.md](./04-manifest-setup-reconfiguration-and-routers.md) | W19 R1 P4 | Documentation-surface recovery complete through `2f07b568` | D-030 is corrected and closed. The authority, runtime, tests, package output, dogfood, installed-project proof, independent review, owner acceptance, and final corrective closeout now agree. |
| [05-compatibility-quiescence-backup-and-migration.md](./05-compatibility-quiescence-backup-and-migration.md) | W19 R1 P5 | Complete and owner-accepted; committed at `96582ab4` | Implement compatibility classification, quiescence, backup/rollback, and the accepted migration order. |
| [06-global-store-evolution.md](./06-global-store-evolution.md) | W19 R1 P6 | Complete and owner-accepted at `bac3eb2` | Add transactional `runs` and `run_evidence` while preserving legacy state opaquely. |
| [07-naive-uat-workflow-persona-and-evidence.md](./07-naive-uat-workflow-persona-and-evidence.md) | W19 R1 P7 | Complete and owner-accepted at `03a8dfdd`; late documentation closeout recorded | The six validators, provider workflow, optional bundled Skill, and checkpoint 10 are complete within the recorded test and human-review limits. Checkpoint 11 is owned by P8. |
| [08-traced-playbook-protocol-retirement.md](./08-traced-playbook-protocol-retirement.md) | W19 R1 P8 | Complete and owner-accepted at `45dc1c2` | Removed the 18 frozen operations and retired runtime. Retired four packaging scenarios from current coverage. Preserved history, opaque legacy input, authored Skills, and shared current tools. |
| [09-optional-agentics.md](./09-optional-agentics.md) | W19 R1 P9 | Complete; checkpoint 12 is `not applicable` | The owner selected no optional integrations. Current core, Skill, and static-harness evidence proves that no extra integration is required. |
| [10-package-projection-dogfood-and-installed-project-validation.md](./10-package-projection-dogfood-and-installed-project-validation.md) | W19 R1 P10 | Complete; checkpoint 13 closed by current evidence | Current package, dogfood, migration, installed-product, and direct harness evidence closes the final checkpoint without publishing or releasing. |

## Usage Notes

- Read and execute phases in dependency order. Do not silently reorder the accepted 13-stage migration sequence embedded in P5.
- Candidate Q/R mappings in each Stage 1 are minimum starters. The live PRD 03 and owner-PRD reread controls.
- `Q-017` retains the current per-project resource model unless separately redesigned. `Q-019` concerns only interactive Persona setup UX and is relevant only when that scope is introduced.
- O-001 remains a separate W18 R3 surface-neutral adversarial-review obligation. O-002 is superseded and must not be reopened as Playbook or Protocol exposure work.
- No `NUAT-###` identity is invented by this backlog. A later activated user-observable slice must use or establish canonical PRD-owned scenario authority before execution.
- Every phase allows at most two materially distinct correction attempts and two review cycles. Retry only affected failed checks after a material change and reuse unchanged valid evidence.
- Record free disk before resource-heavy work and stop on unsafe growth, memory/context pressure, contradictory authority, budget exhaustion, or diminishing returns.
- Performance qualification is governed separately by PRD 48. No phase invents a latency, throughput, memory, capacity, availability, bundle-size, sample-count, or benchmark target.
- Work tasks may implement only their named phase. They cannot silently change product authority or close questions, risks, findings, waivers, deferred obligations, scenarios, or capability status.

## Intended Follow-On

W19 R1 is complete. P1 through P8 keep their accepted implementation records. P9 has an explicit `none` disposition. P10 consumes the later W19 R3 through R6 proof and closes checkpoint 13 for the tested candidate. No publication, release, deployment, or real-project mutation is authorized by this record.
