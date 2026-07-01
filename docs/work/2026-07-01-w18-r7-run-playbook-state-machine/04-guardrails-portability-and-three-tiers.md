---
title: "Phase 4: Guardrails, Portability, and Three-Tier Behavior"
kind: "work"
status: "active"
coordinate: "W18 R7 P4"
source:
  type: "prd"
  path: "docs/prd/35-revise-run-playbook-state-machine.md"
---

# Phase 4: Guardrails, Portability, and Three-Tier Behavior

## Purpose

Enforce the run-time safety rules the W18 R4 lineage established and this change makes executable — nesting, parallelism, output-surface conflicts, and unattended holds — and serve cross-machine handoff without putting run state back into the repository.

## Overview

Implement the R-GUARD guardrails against the orchestration policy and capability records inherited unchanged from PRD 29 and PRD 24, add explicit run export and import for portability, and verify the three-tier degradation guarantee end to end.

## Source PRD Docs

- [35 Revise Run Playbook State Machine](../../prd/35-revise-run-playbook-state-machine.md)
- [29 Revise Playbook Contract Run Playbook](../../prd/29-revise-playbook-contract-run-playbook.md)
- [24 Revise Configuration Convention Overlay](../../prd/24-revise-configuration-convention-overlay.md)
- [30 Revise Harness Plugin Substrate Workflow Bundles](../../prd/30-revise-harness-plugin-substrate-workflow-bundles.md)
- [34 Revise Playbook Contract and Model](../../prd/34-revise-playbook-contract-and-model.md)

## Stage 1 - Nested, Parallel, and Unattended Guardrails

### Tasks

- [ ] t1: Allow nested Playbooks only when the parent's orchestration policy permits child Playbooks, link each child run to its parent through child-run references and a shared root run identifier, and default child runs to serial (R-GUARD-1).
- [ ] t2: Require explicit parent permission, a harness capability or reviewed approval supporting parallel execution, and non-overlapping claimed output surfaces before running children in parallel, serializing or stopping for review when overlap cannot be proven safe (R-GUARD-2).
- [ ] t3: Stop rather than interleave writes whenever two steps or runs would claim the same output surface (R-GUARD-3).
- [ ] t4: In unattended mode, let only steps whose gates permit unattended continuation proceed without a human, setting every other gate step to `waiting-for-user` and holding (R-GUARD-4).
- [ ] t5: Consume the reviewed `harnessCapabilities` records and unknown-capability handling unchanged — never guess unknown capabilities, fall back to serial gated execution for optional ones, and stop with manual-review guidance for required ones (R-SCOPE-2, R-KEEP-1).

### Acceptance criteria

- Nesting requires parent policy permission, child runs link to parent and root run identifiers, and serial is the default.
- Parallel children require explicit permission, capability support or reviewed approval, and non-overlapping claimed output surfaces.
- Output-surface overlap always stops or serializes; writes are never interleaved.
- Unattended runs hold at every gate that does not permit unattended continuation.
- Make Docs-owned run state remains the source of truth for recovery, audit, nested runs, and overlap checks; harness goal or long-running features are assists only.

### Dependencies

- Phases 1–3.
- The orchestration policy fields on the workflow header (W18 R6) and the capability records from PRD 24, consumed unchanged.

## Stage 2 - Portability and Three-Tier Verification

### Tasks

- [ ] t6: Implement explicit run export that serializes the run record and its evidence into a portable artifact, and run import that rehydrates it elsewhere, both opt-in (R-PORT-1).
- [ ] t7: Ensure export and import never place run state into the repository by default (R-PORT-1).
- [ ] t8: Verify tier one — with neither Make Docs nor the CLI present the Playbook remains structured documentation a reader executes by hand, with no engine required (R-TIER-1).
- [ ] t9: Verify tier two — with Make Docs resources present but no CLI, an agent reads the same structure and the operation registry's documented command forms and executes without tracking (R-TIER-1).
- [ ] t10: Verify tier three — with the CLI present the full engine runs and records state in the global store (R-TIER-1).

### Acceptance criteria

- Cross-machine handoff works through opt-in export and import of the run record and evidence.
- No export, import, or tier path writes run state into the repository by default.
- All three degradation tiers behave as specified against the same Playbook source.

### Dependencies

- Stage 1 guardrails.
- The operation registry's documented command forms for the tier-two path.
