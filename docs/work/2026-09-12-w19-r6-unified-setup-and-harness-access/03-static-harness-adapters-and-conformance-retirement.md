---
title: "Phase 3: Static Harness Adapters and Conformance Retirement"
kind: "work"
status: "active"
coordinate: "W19 R6 P3"
source:
  type: "prd"
  path: "../../prd/28-shared-agentics-installation-and-harness-exposure.md"
---

# Phase 3: Static Harness Adapters and Conformance Retirement

## Purpose

Execute the P3 authority reset and product correction after the owner gives implementation authority.

## Overview

P3 replaces the obsolete dynamic conformance gate with static product-owned adapters for Codex and Claude Code.

The work starts with PRD correction. It then classifies the current P2 diff. It ends with direct installed proof and Human Experience Review.

## Human Experience Outcome

The user sees installed known harnesses. The user selects a safe built-in method. The user does not supply scenario, provider, model, runtime, or tuple data.

The user sees each computer, project, and Store effect before approval. Existing config stays intact. Repeat and recovery states give one clear next action.

## Current Testing Decisions

| Testing type | Current decision | Reason |
| --- | --- | --- |
| Automated Implementation Testing | selected | Static adapter, setup, config, safety, package, and repeat rules need exact tests. |
| Performance Testing | not-needed-now | P3 adds no speed claim. W19 R3 Store session checks remain the guard. |
| Guided Progress Review | selected | Installed screen order, explanations, state, and blocker actions need review. |
| Unassisted Goal Testing | not-needed-now | Direct installed review and fresh real-harness checks cover the current goal. |

Human Experience Review is a separate required acceptance lens.

## Source PRD Docs

P3 will make these the current owners:

- PRD 07: setup lifecycle and review.
- PRD 08: shared project Skill choice.
- PRD 10: package contents.
- PRD 16: installed and release checks.
- PRD 17: system resources.
- PRD 24: project harness intent.
- PRD 25: Store access and caller identity.
- PRD 28: static harness adapters and native entries.
- PRD 30: source-owned adapter admission.
- PRD 36: current agentics package boundary only.
- PRD 38: native config receipts and drift.
- PRD 39: setup command model.
- PRD 48: performance boundary.
- PRD 50: test and review evidence.

PRDs 20, 43, and 44 are retirement inputs. They are not P3 product owners.

## Source Findings

- P2 made an obsolete Playbooks proof engine a setup support gate.
- That gate caused setup to require exact provider, model, runtime, scenario, and result facts.
- The active authority made those facts into test assertions.
- The missing facts were therefore an authority defect, not a needed setup feature.
- Current production coupling is narrow. `setup-system.ts` and `harness-access/contract.ts` are the main direct imports.
- Wider conformance code is mainly maintainer tooling, scripts, fixtures, and tests. Each item still needs a use check before removal.
- The P2 diff also contains valid unified setup, config, Store, and native access work.

## Promise Trace and Close Evidence

| Promise | P3 tasks | Required evidence | Human review | Current state |
| --- | --- | --- | --- | --- |
| Find known harnesses without tuple questions. | t6-t9, t14 | Static detection tests and installed transcript. | User sees no obsolete fact prompt. | Not started. |
| Show only safe product-owned methods and effects. | t7-t12, t14 | Plan, apply, verify, blocked, and review tests. | User can explain each effect. | Not started. |
| Use MCP with caller identity in Codex and Claude Code. | t8, t12, t15 | Disposable read and write runs. | User sees the selected method work. | Not started. |
| Keep Codex rules narrow. | t8, t12, t15 | Allowed and rejected sandbox runs. | User sees the access limit. | Not started. |
| Preserve config through apply, repeat, drift, and recovery. | t7, t10-t11, t14 | YAML, native file, receipt, and failure tests. | User sees no lost content or repeat loop. | Not started. |
| Keep resource reads Store-free. | t9, t13, t15 | Store-absent, locked, unreadable, and unsafe runs. | User reads a resource with no Store setup. | Not started. |

## Stage 1 — Reset Authority and Trace Dependencies

### Tasks

- [ ] t1: Inventory all current and historical references to PRDs 20, 43, and 44.
- [ ] t2: Remove PRDs 20, 43, and 44 from the active set. Update PRD 00.
- [ ] t3: Move valid current rules to PRDs 07, 10, 16, 24, 25, 28, 30, 36, 38, 39, 48, and 50 as needed.
- [ ] t4: Update D-033 with the invalid authority, release effect, correction, and close proof.
- [ ] t5: Update active guides and package docs. Preserve historical meaning. Run PRD, path, and link checks.

### Acceptance criteria

- A41: No active product rule uses PRDs 20, 43, or 44 as authority.
- A42: Each preserved rule has one current owner.
- A43: PRD 00 shows the corrected active set.
- A44: D-033 states the P3 correction and exact close proof.

### Dependencies

- The owner must authorize P3 implementation.
- Stage 1 must finish before product cleanup.

## Stage 2 — Correct Product Code and Tests

### Tasks

- [ ] t6: Record a hunk-level `keep`, `rework`, or `remove` decision for the P2 diff.
- [ ] t7: Keep and repair the unified setup service, method flags, JSON output, dry-run parity, YAML writer, project intent, receipts, and recovery.
- [ ] t8: Replace tuple-gated support in `setup-system.ts` and `harness-access/contract.ts` with static Codex and Claude Code adapters.
- [ ] t9: Remove provider, model, runtime, scenario, registry, result-promotion, and lab-bootstrap data from production setup.
- [ ] t10: Trace `packages/cli/src/conformance/**`, conformance scripts, commands, tests, fixtures, package copy steps, and `conformance/**`. Remove only items with no current owner.
- [ ] t11: Replace synthetic tuple tests with direct adapter, setup, config, repeat, recovery, and Store-free-read tests.
- [ ] t12: Prove MCP caller identity, bounded Codex rules, safe Claude Code behavior, and rejected broad access.
- [ ] t13: Re-run the W19 R3 Store session, contention, receipt, checkout-writer, pending-operation, and retry checks.

### Acceptance criteria

- A45: Production setup has no conformance registry or tuple dependency.
- A46: Static adapters define all shown methods and owned native entries.
- A47: Setup preserves project and user-owned native config.
- A48: Store access stays narrow. Store-free reads open no Store session.
- A49: No unchanged rerun loop or repeated verified machine write exists.

### Dependencies

- Stage 1 current PRDs are the only product authority.
- Native harness behavior must match the accepted adapter contract.

## Stage 3 — Installed Acceptance

### Tasks

- [ ] t14: Pack the candidate. Prove that it contains no registry, lab result, transcript, scenario, or bootstrap asset.
- [ ] t15: Run Codex MCP, Codex narrow rules, Claude Code MCP, Claude Code safe permission checks, and direct resource reads in disposable homes.
- [ ] t16: Run fresh, current, partial, no-method, unsupported, drifted, blocked, failed, recovered, and repeat setup cases.
- [ ] t17: Run the full CLI, Store, package, MCP, PRD, path, link, and diff checks.
- [ ] t18: Prepare the six-promise Human Experience packet.
- [ ] t19: Have the owner or maintainer record each observation, conclusion, limit, and next action.
- [ ] t20: Update `evidence.md`. Close P3 and D-033 only when every hard close rule passes.

### Acceptance criteria

- A50: Codex MCP, Codex narrow rules, and Claude Code MCP pass through the installed package.
- A51: Claude Code permission rules are supported only if narrow Store access passes.
- A52: The installed setup matrix passes without user-content loss or repeat writes.
- A53: All automated checks pass against the corrected authority.
- A54: Human Experience Review passes all six promises.

### Dependencies

- Stages 1 and 2 are complete.
- Real-harness work uses only disposable homes and projects.

## Hard Close Rules

The ten hard close rules in the P3 plan apply without exception.

## Implementation Gate

Status: `planned; implementation-not-authorized`.

This package defines the work. It does not authorize PRD edits, code edits, conformance removal, native harness changes, or real-harness runs.

It also does not authorize staging, commit, real-home installation, publication, or release.
