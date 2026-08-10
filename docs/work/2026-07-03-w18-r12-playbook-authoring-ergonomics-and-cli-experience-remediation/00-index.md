---
title: "W18 R12 Playbook Authoring Ergonomics and CLI Experience Remediation Work"
kind: "work"
status: "active"
coordinate: "W18 R12"
follow_on:
  route: "implementation-loop"
  next_prompt: ".make-docs/references/system/execution-workflow.md"
  why: "The backlog is the implementation queue derived from the W18 R12 plan and PRD contract, and the W18 R9 conformance wave is gated behind it."
  coordinate_handoff: "Carry W18 R12 into phase history records and commits, adding the active P coordinate for each phase; W18 R9 executes only after Phase 4 completes (register item R-026)."
source:
  type: "prd"
  path: "docs/prd/34-playbook-authoring-contract-and-model.md"
---

# W18 R12 Playbook Authoring Ergonomics and CLI Experience Remediation Work

## Purpose

Implement the UAT remediation round required by [40 Revise Playbook Authoring Contract v2](../../prd/34-playbook-authoring-contract-and-model.md) and [41 Revise CLI Human Experience and Package Grammar](../../prd/39-cli-command-model-and-operation-registry.md#human-experience-and-package-grammar): the clean-break v2 authoring contract (fenced YAML dependencies with the `probe` field, `schema`/`workflowSchema` keys, the simplified heading spine, pointed old-form diagnostics, in-repo migration of the default Playbook, fixtures, and the upstream template), the compiler probe fix that removes `source` scraping (F1, register item D-015), resume-hint retirement (F2, register item D-016), and the CLI human-experience layer under agent invariance — the render layer, the `plan`/`preview`/`write` grammar with `--write` retired, the registered `package.ship` composite, run-id prefix resolution with `--last`, flag defaults with precondition config absorption, and targeted warning suppression. The source chain is [the design](../../designs/2026-07-03-playbook-authoring-ergonomics-and-cli-experience-remediation.md), [the W18 R12 plan](../../plans/2026-07-03-w18-r12-playbook-authoring-ergonomics-and-cli-experience-remediation/00-overview.md), and former PRDs 40 and 41, with [PRD 34](../../prd/34-playbook-authoring-contract-and-model.md), [PRD 35](../../prd/35-run-playbook-state-machine-and-portability.md), [PRD 36](../../prd/36-playbook-packaging-compiler-and-harness-adapters.md), [PRD 38](../../prd/38-global-store-and-project-state.md), [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md), [PRD 24](../../prd/24-project-configuration-and-convention-overlay.md), [PRD 25](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md), and [PRD 06](../../prd/06-template-contracts-and-generated-assets.md#template-source-authority) as still-constraining baselines.

## Phase Map

| File | Purpose |
| --- | --- |
| [01-playbook-contract-v2.md](./01-playbook-contract-v2.md) | Land the clean-break v2 contract: dependencies-block parser replacing the table parser, `schema`/`workflowSchema` keys, the simplified heading spine, the v2 schema identifier, pointed old-form diagnostics, upstream contract/template authoring, and migration of the default Playbook and every fixture. |
| [02-compiler-probe-and-hint-retirement.md](./02-compiler-probe-and-hint-retirement.md) | Rebuild dependency materialization on the v2 model's `probe` field with `source` scraping removed (F1 root fix), pin the regression with adversarial fixtures, and land subject-scoped resume-hint retirement (F2). |
| [03-cli-grammar-ship-render-and-ergonomics.md](./03-cli-grammar-ship-render-and-ergonomics.md) | Land the `plan`/`preview`/`write` grammar with `plan --output` and `--write` retired, the registered `package.ship` composite with MCP derivation, the TTY render layer under agent invariance, run-id prefix and `--last`, flag defaults, precondition config, and warning suppression. |
| [04-verification-and-conformance-reconciliation.md](./04-verification-and-conformance-reconciliation.md) | Run the full verification sweep (R-TEST-1 through R-TEST-6), reconcile PRD 37 and the W18 R9 backlog for the invalidated assumptions (R-026), and hand off the UAT-doc regeneration note. |

## Usage Notes

- Read phases in order; they are dependency-ordered — Phase 1 owns the v2 model everything else compiles against, Phase 2 consumes its `probe` field, Phase 3 renames and renders the surfaces Phase 2's operations expose, and Phase 4 verifies the whole and reconciles downstream consumers.
- Agent invariance (PRD 41 R-INV-1) is a MUST across every phase: operation result objects, MCP tool output, and `--json`/non-TTY CLI output stay byte-identical except for additive fields and flags; no MCP tool schema changes.
- The contract revision is a clean break (PRD 40 R-MIG-1..4): no accept-old-warn window, no deprecation diagnostics, no legacy parsing; old forms fail with pointed diagnostics naming the v2 replacement shape, and no v1 document survives in-tree.
- The playbook contract and the default Playbook are dogfooded template assets: author them upstream in `packages/docs/template/.make-docs/contracts/system/playbook-contract.md` and `packages/docs/template/docs/assets/playbooks/agent/` first, then re-seed the repo's `.make-docs/` and `docs/` instances (PRD 40 R-RIPPLE-2, PRD 19). The parser, validator, compiler, and CLI are ordinary source code under `packages/cli/`.
- Preserve every fail-before-write rail from PRD 36 unchanged: `preview` and `ship` compose the existing pipeline; the grammar renames how intent is spelled, never what is allowed.
- `package.ship` is a registered operation per the PRD 39 append-only rule and the W18 R11 parity rule — never a CLI-only composite; it derives to MCP like every other operation (PRD 41 R-GRAM-3).
- Any run-state serialization change for hint subjects is additive and migrated per the PRD 38 schema-versioning rules; the evidence log is never altered.
- W18 R9 execution is gated behind Phase 4 (register item [R-026](../../prd/03-open-questions-and-risk-register.md)).
- Keep task checkboxes as `- [ ] tN: ...` with IDs incrementing across each entire phase file and acceptance criteria as plain bullets.

## Intended Follow-On

This handoff is advisory-default-but-overridable: it is authoritative unless the user explicitly overrides it, and it is not a gate or precondition.

- Route: `implementation-loop`
- Next step: Start with Phase 1 and continue phase-by-phase.
- Why: The backlog is the implementation queue derived from the W18 R12 plan and PRD contract, and the W18 R9 conformance wave binds its evidence to the surfaces this backlog remediates.
- Coordinate Handoff: Carry `W18 R12` into phase history records and commits, adding the active P coordinate for each phase; begin W18 R9 only after Phase 4 completes and PRD 37 plus the W18 R9 backlog are reconciled.
