---
title: "W19 R2 Performance Evidence Governance Work Backlog"
kind: "work"
status: "complete"
coordinate: "W19 R2"
follow_on:
  route: "implementation-loop"
  next_prompt: ".make-docs/system/references/execution-workflow.md"
  why: "P1 through P5 are complete. Staging and the P5 commit need separate owner authority."
  coordinate_handoff: "Carry W19 R2 as completed implementation history. Keep the P5 commit and every later release or support action separate."
source:
  type: "prd"
  path: "docs/prd/48-performance-evidence-governance.md"
---

# W19 R2 Performance Evidence Governance Work Backlog

> In v2, work backlogs are directories. This `00-index.md` is the entry point; phase detail lives in sibling files.

## Purpose

Turn the accepted W19 R2 plan and reconciled PRD authority into a dependency-ordered implementation queue for documentation-first performance-evidence governance. This backlog preserves target-class authority, characterization before threshold promotion, versioned `PERF-###` profiles, finite budgets and diminishing-return stops, unchanged-result reuse, affected-only reruns, explicit single-execution expiry or release requalification, normalized outcomes, non-sacrificable correctness and safety constraints, and proof-mode separation. It creates no universal target, sample-count default, statistical recipe, benchmark framework, release authority, or support claim.

W19 R2 P1 records completed PRD reconciliation. Its authority landed in commit `02002ba` and later received current static-adapter and testing-boundary updates. P2 landed in `f79ec885`, P3 in `b840b746`, and P4 in `d868bdc5`. P5 is complete and awaits separate staging and commit authority. The phase files are historical closeout evidence, not rerun queues.

## Authority And Source Inputs

- [Accepted W19 R2 plan](../../plans/2026-08-13-w19-r2-performance-evidence-governance/00-overview.md)
- [Accepted W19 R2 P1 plan phase](../../plans/2026-08-13-w19-r2-performance-evidence-governance/01-prd-authority-and-target-inventory.md)
- [PRD 03 — Open Questions and Risk Register](../../prd/03-open-questions-and-risk-register.md)
- [PRD 25 — TypeScript Runtime, CLI, MCP, and Operation Boundaries](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md)
- [PRD 39 — CLI Command Model and Operation Registry](../../prd/39-cli-command-model-and-operation-registry.md)
- [PRD 48 — Performance Evidence Governance](../../prd/48-performance-evidence-governance.md)
- [PRD 49 — Human Experience Standard and Intent](../../prd/49-human-experience-standard-and-intent.md)
- [PRD 50 — Proportionate Testing and Human-Centered Validation](../../prd/50-proportionate-testing-and-human-centered-validation.md)
- The exact current consumer PRDs listed in each phase file
- Current normative PRD bodies are product authority. The plan supplies sequencing; PRD requirement history supplies provenance only.

## 2026-09-16 Authority Rewrite

PRDs 20, 43, and 44 and their dynamic tuple, registry, scenario-kit, and lab-session system are retired. Current installed-harness authority uses source-owned static adapters and direct installed-product proof under PRDs 10, 16, 28, 30, 36, 39, 48, and 50. Active W19 R2 work must not restore the retired system.

Current testing language uses Automated Implementation Testing, Performance Testing, Guided Progress Review, and Unassisted Goal Testing. Human Experience Review is required agent work and is not a fifth testing type. A normal experience handoff is optional. A missing human response does not block closeout unless accepted authority defines an explicit human acceptance gate.

P4 remains `blocked / not-authorized`. W19 R2 can complete through P2, P3, and P5 with an explicit P4 disposition. No validator obligation exists. P4 can activate only after a later owner decision and current PRD 25 and PRD 39 authority.

The accepted design, plan, and P1 digest record keep their historical terms as provenance. This active backlog and current PRD 48 control implementation.

## 2026-09-17 P4 Admission Decision

The owner admitted P4 as a dual-path Performance Evidence validator. This decision supersedes only the prospective P4 status in the 2026-09-16 rewrite. It does not rewrite the historical fact that P4 was not authorized when P2 and P3 closed.

The admitted capability contains:

- one read-only `performance.evidence.validate` TypeScript core;
- one CLI projection and one derived MCP tool with the same complete result;
- one canonical installed agent method for CLI-absent projects and catalog-marked judgment questions;
- one stable rule catalog that maps deterministic rules, agent instructions, diagnostics, fixtures, and explicit one-sided reasons; and
- distinct `validator-passed`, `agent-reviewed`, and `combined` proof states that cannot certify the other method or prove a performance outcome.

This decision authorizes only the PRD, plan, work, risk, and requirement-history updates needed to record the direction. It does not authorize P4 implementation, staging, commit, push, benchmark execution, publication, release, or support promotion. P4 implementation stays locked until these decision-only changes pass focused validation, receive a separate reviewed commit, record that commit SHA in the P4 phase-entry record, and receive separate implementation authority.

## Human Experience Trace

| Promise | Work phase | Evidence and gate |
| --- | --- | --- |
| A maintainer can decide whether performance evidence is useful now without inventing a target. | P2 and P3 | Review the real contract, prompt, reference, profile, and lifecycle examples. Unsupported candidates must stop without an executable profile. |
| A maintainer can identify the target owner, current evidence state, finite budget, stop condition, result, and next action. | P2, P3, and P5 | Agent Human Experience Review of the shipped and installed resources. A material gap blocks only the affected claim. |
| Internal Store, fingerprint, and schema detail stays out of the normal decision path while exact evidence remains available. | P3 and P5 | Inspect normal human-facing guidance and the detailed evidence path. Store projection remains non-authoritative. |
| A maintainer can use deterministic checks when the CLI is available or receive a clear bounded agent review when it is not, without confusing either path with a performance result. | P4 and P5 | Review CLI/MCP parity, installed agent instructions, rule mappings, proof states, and the real human-facing result. |
| The implementation does not ask a person to repeat automated proof or approve a report by default. | P5 | Guided Progress Review stays optional. Human feedback is invited only through a short optional handoff unless an explicit gate applies. |

## Phase-Entry PRD Question And Risk Gate

Every phase begins with `Stage 1 - Phase-Entry PRD Question And Risk Gate` before any implementation write. The executor must reread the phase's owning PRDs and PRD 03 from the current worktree, record their current revision or content digest, and reevaluate the phase's candidate question/risk mapping as a starter rather than a closed list.

For every relevant `Open`, `Confirming`, `Deferred`, or closed regression item, record the ID, current authority revision or digest, phase impact, one classification (`blocking`, `impacted-nonblocking`, `unrelated`, `closed-regression-check`, or `new-authority-gap`), disposition, and rationale. If no blocker or authority gap exists, record an explicit no-blocker result before unlocking implementation.

If an item is blocking or exposes a new authority gap, stop before implementation writes and present an owner decision package in the coordination channel rather than creating a standalone decision file. The package must include the source anchor, affected phase and PRDs, bounded options and trade-offs, recommendation, consequences, exact PRD/register/history changes, validation, and a decision-only commit boundary. After the owner decides, update canonical PRD authority and history, validate it, commit that decision separately, and record the decision commit SHA in the phase-entry record before implementation unlocks.

Task completion never closes a question, risk, finding, waiver, deferred obligation, or capability by implication.

## Phase Map

| File | Coordinate | State | Purpose |
| --- | --- | --- | --- |
| [01-prd-authority-and-target-inventory.md](./01-prd-authority-and-target-inventory.md) | W19 R2 P1 | Completed authority history; superseded terms are labeled | Preserve the original target inventory, PRD 48 creation, consumer updates, risk dispositions, and validation without treating retired PRDs as current authority. |
| [02-governance-resources-and-routing.md](./02-governance-resources-and-routing.md) | W19 R2 P2 | Completed and committed as `f79ec885` | Author the four peer governance resources upstream, keep routers thin, and prove resource resolution and projection lineage. |
| [03-lifecycle-evidence-compatibility-and-state.md](./03-lifecycle-evidence-compatibility-and-state.md) | W19 R2 P3 | Completed and committed as `b840b746` | Connect qualification, execution packets, results, expiry, gates, compatibility, proof-mode separation, and optional state without moving product authority. |
| [04-optional-validator-operation.md](./04-optional-validator-operation.md) | W19 R2 P4 | Completed and committed as `d868bdc5` | Implement and prove one deterministic CLI/MCP core, one installed agent method, one mapped rule catalog, and distinct proof states without benchmark or product judgment. |
| [05-packaging-validation-and-delta-handoff.md](./05-packaging-validation-and-delta-handoff.md) | W19 R2 P5 | Complete; final review passed, commit pending | Prove upstream, package, dogfood, installed agent fallback, CLI/MCP parity, catalog integrity, and bounded closeout. |

## Usage Notes

- Read P1 through P4 as completed history. P5 follows accepted and committed P4 delivery.
- Candidate mappings in phase-entry stages are minimum starters. The live PRD 03 reread controls.
- Each phase allows at most two materially distinct correction attempts and two review cycles. Retry only affected failed checks after a material change; reuse unchanged valid evidence.
- Stop on budget exhaustion, diminishing returns, unsafe resource growth, conflicting authority, or a blocking phase-entry item.
- No `O-###`, `NUAT-###`, or finding is assigned at backlog generation. Each phase records valid `none` until current authority and phase scope establish a real reference. The P4 admission decision creates no deferred obligation.
- Apply agent Human Experience Review to the maintainer-facing resources and installed result. Give a short optional experience handoff for direct work. Do not require a human response without an explicit gate.
- Work tasks may implement only their named phase. They may not silently promote plan/work guardrails to product authority or close findings, risks, or deferred obligations.
- P5 completion and commit, publication, release, deployment, benchmark execution, and support-claim promotion remain subject to their own authorization and phase gates.

## Intended Follow-On

This handoff is advisory-default-but-overridable: it is authoritative unless the user explicitly overrides it, and it is not a gate or precondition.

- Route: `implementation-loop`
- Next step: Obtain separate owner authority to stage the nine reviewed P5 files and create the P5 commit. Do not push.
- Why: P1 through P5 are complete. Automated checks and both independent review cycles pass within the recorded limits.
- Coordinate Handoff: Carry completed P1 through P5 as history. Keep the optional local-projection receipt repair as separate non-blocking follow-up work. Both correction attempts and both review cycles are used. Keep the P5 commit, push, publication, release, deployment, benchmark, and support gates separate.
