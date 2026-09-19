---
title: "Phase 3: Static Harness Adapters and Conformance Retirement"
kind: "work"
status: "complete"
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

The authority reset and production implementation are complete. Codex MCP, Codex rules, and Claude Code MCP pass live checks. Claude Code permission rules failed their live check and stay blocked as allowed by A35. The agent-owned Human Experience Review records `satisfied` for all six promises.

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

Human Experience Review is separate required agent review work. No explicit human acceptance gate applies to P3.

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
| Find known harnesses without tuple questions. | t6-t9, t14 | Static detection tests and installed transcript. | User sees no obsolete fact prompt. | `satisfied`: automated and installed setup checks show no tuple questions. |
| Show only safe product-owned methods and effects. | t7-t12, t14 | Plan, apply, verify, blocked, and review tests. | User can explain each effect. | `satisfied`: setup shows declared methods and keeps the failed Claude permission-rule method blocked. |
| Use MCP with caller identity in Codex and Claude Code. | t8, t12, t15 | Disposable read and write runs. | User sees the selected method work. | `satisfied`: Codex and Claude Code MCP read and write calls pass. |
| Keep Codex rules narrow. | t8, t12, t15 | Allowed and rejected sandbox runs. | User sees the access limit. | `satisfied`: the no-rule control fails, the narrow read and write pass, and execpolicy rejects wider direct token lists. |
| Preserve config through apply, repeat, drift, and recovery. | t7, t10-t11, t14 | YAML, native file, receipt, and failure tests. | User sees no lost content or repeat loop. | `satisfied`: preservation checks, the setup matrix, and three no-write repeats pass. |
| Keep resource reads Store-free. | t9, t13, t15 | Store-absent, locked, unreadable, and unsafe runs. | User reads a resource with no Store setup. | `satisfied`: installed resource reads and unsafe-Store cases pass without a Store session. |

## Stage 1 — Reset Authority and Trace Dependencies

### Reference inventory

The pre-removal jdocmunch backlink inventory found these references:

| Retired PRD | Backlinks | Source files | Current classification and disposition |
| --- | ---: | ---: | --- |
| PRD 20 | 103 | 65 | Current authority and support text moved to the owners below. Dated design, plan, completed-work, requirement-history, and archive text remains historical. |
| PRD 43 | 68 | 42 | Current scenario-kit and dynamic registry authority is retired. Current support text now uses direct installed-product checks. Historical records keep their dated meaning. |
| PRD 44 | 43 | 32 | Current lab-session and result-promotion authority is retired. Current testing text now uses direct installed-product evidence. Historical records keep their dated meaning. |

The active-set scan classified `docs/prd/` requirements, active risk decisions, active maintainer guides, package guidance, and current W19 R6 work as current text. It classified dated designs, plans, completed or superseded work, requirement-history blocks, and `.make-docs/archive/**` as historical records. Git history is the record of the three retired PRD files. No archive copies were created.

### Current rule owners

| Current rule | Single owner |
| --- | --- |
| Setup flow, review, method presentation, and useful blocker action | PRD 07 |
| Package checks and exclusion of dynamic registry and lab assets | PRD 10 |
| Packed runtime and release boundary | PRD 16 |
| Project harness intent and config-preserving YAML writes | PRD 24 |
| Caller identity, Store access policy, and Store-free resource reads | PRD 25 |
| Static adapter declarations, native methods, owned entries, and access limits | PRD 28 |
| Admission of any future harness integration | PRD 30 |
| No revival of Playbook packaging, dynamic support registries, or lab assets | PRD 36 |
| Store receipts, pending operations, retry, drift, and recovery | PRD 38 |
| Public command grammar and the shared setup operation path | PRD 39 |
| Separation of performance proof from harness support | PRD 48 |
| Proportionate direct tests and installed-product evidence | PRD 50 |

### Tasks

- [x] t1: Inventory all current and historical references to PRDs 20, 43, and 44.
- [x] t2: Remove PRDs 20, 43, and 44 from the active set. Update PRD 00.
- [x] t3: Move valid current rules to PRDs 07, 10, 16, 24, 25, 28, 30, 36, 38, 39, 48, and 50 as needed.
- [x] t4: Update D-033 with the invalid authority, release effect, correction, and close proof.
- [x] t5: Update active guides and package docs. Preserve historical meaning. Run PRD, path, and link checks.

### Acceptance criteria

- [x] A41: No active product rule uses PRDs 20, 43, or 44 as authority.
- [x] A42: Each preserved rule has one current owner.
- [x] A43: PRD 00 shows the corrected active set.
- [x] A44: D-033 states the P3 correction and exact close proof.

### Dependencies

- The owner must authorize P3 implementation.
- Stage 1 must finish before product cleanup.

## Stage 2 — Correct Product Code and Tests

### Tasks

- [x] t6: Record a hunk-level `keep`, `rework`, or `remove` decision for the P2 diff.
- [x] t7: Keep and repair the unified setup service, method flags, JSON output, dry-run parity, YAML writer, project intent, receipts, and recovery.
- [x] t8: Replace tuple-gated support in `setup-system.ts` and `harness-access/contract.ts` with static Codex and Claude Code adapters.
- [x] t9: Remove provider, model, runtime, scenario, registry, result-promotion, and lab-bootstrap data from production setup.
- [x] t10: Trace `packages/cli/src/conformance/**`, conformance scripts, commands, tests, fixtures, package copy steps, and `conformance/**`. Remove only items with no current owner.
- [x] t11: Replace synthetic tuple tests with direct adapter, setup, config, repeat, recovery, and Store-free-read tests.
- [x] t12: Prove MCP caller identity, bounded Codex rules, safe Claude Code behavior, and rejected broad access.
- [x] t13: Re-run the W19 R3 Store session, contention, receipt, checkout-writer, pending-operation, and retry checks.

### Acceptance criteria

- [x] A45: Production setup has no conformance registry or tuple dependency.
- [x] A46: Static adapters define all shown methods and owned native entries.
- [x] A47: Setup preserves project and user-owned native config.
- [x] A48: Store access stays narrow. Store-free reads open no Store session.
- [x] A49: No unchanged rerun loop or repeated verified machine write exists.

### Dependencies

- Stage 1 current PRDs are the only product authority.
- Native harness behavior must match the accepted adapter contract.

## Stage 3 — Installed Acceptance

### Tasks

- [x] t14: Pack the candidate. Prove that it contains no registry, lab result, transcript, scenario, or bootstrap asset. Installed package smoke passed.
- [x] t15: Run Codex MCP, Codex narrow rules, Claude Code MCP, Claude Code safe permission checks, and direct resource reads in disposable homes. Codex and Claude Code MCP read and write calls pass. The no-rule Codex control cannot reach the external Store. The Codex rule path reads project state and creates the archive surface with terminal commands only. The no-rule Claude control cannot run the Make Docs Store command. Claude permission rules stay blocked because Claude did not keep the full allowed command. Codex execpolicy proves the direct token boundary.
- [x] t16: Run fresh, current, partial, no-method, unsupported, drifted, blocked, failed, recovered, and repeat setup cases.
- [x] t17: Run the full CLI, Store, package, MCP, PRD, path, link, and diff checks. The coordinator-verified checks pass. After the authority and status cleanup, the path-hygiene validator passed against all 34 existing changed files with zero failing findings, zero I/O errors, and zero changed files.
- [x] t18: Use the existing promise trace and evidence as the review input. Do not require a separate packet or an owner-authored report.
- [x] t19: Prepare and record the agent-owned six-promise review. Record the evidence, observation, conclusion, reviewer, limit, and disposition. No explicit human acceptance gate applies.
- [x] t20: Update `evidence.md`. All ten hard close rules pass. Close P3, D-033, and W19 R6.

### Acceptance criteria

- [x] A50: Codex MCP, Codex narrow rules, and Claude Code MCP pass through the installed package. Native configs pass. Live Codex MCP and command-rule reads and writes pass. Codex execpolicy permits only the exact direct token prefix.
- [x] A51: Claude Code permission rules are supported only if narrow Store access passes. The compact rule carrier passes unit checks. The live command path fails. The method stays blocked.
- [x] A52: The installed setup matrix passes without user-content loss or repeat writes.
- [x] A53: All coordinator-verified automated checks pass against the corrected authority.
- [x] A54: Human Experience Review records `satisfied` for all six promises. The agent states its evidence limits and does not claim a lived human reaction.

### Dependencies

- Stages 1 and 2 are complete.
- Real-harness work uses only disposable homes and projects.

## Hard Close Rules

The ten hard close rules in the P3 plan apply without exception.

## Implementation Gate

Status: `implementation-authorized; stage-1-complete; stage-2-complete; installed-harness-acceptance-complete; stage-3-complete; p3-complete; w19-r6-complete`.

The user authorized P3 implementation on 2026-09-14. The authority reset, production implementation, installed harness acceptance, and agent-owned Human Experience Review are complete. P3, W19 R6, and D-033 are closed.

This authorization does not include staging, commit, real-home installation, publication, or release.
