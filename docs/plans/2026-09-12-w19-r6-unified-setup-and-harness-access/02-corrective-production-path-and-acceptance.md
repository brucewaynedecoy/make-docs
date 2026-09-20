---
title: "Phase 2: Corrective Production Path and Acceptance"
kind: "plan"
status: "superseded"
coordinate: "W19 R6 P2"
source:
  type: "design"
  path: "../../designs/2026-09-12-unified-setup-and-harness-access.md"
---

# Phase 2: Corrective Production Path and Acceptance

P3 supersedes this plan. P2 used PRDs 20, 43, and 44 as current product authority. Those PRDs describe the removed Playbooks conformance system. Keep this file as a record of the work and tests that followed that invalid authority. Do not execute it as the current plan.

## Purpose

Close the gap between the W19 R6 product promise and the P1 code candidate. This phase keeps the useful P1 foundation. It replaces test-only proof paths, completes production setup, and requires installed acceptance before release readiness.

## Fixed Decisions

- `conformance/tuple-registry.json` is the only support-status authority.
- Every support tuple has exactly seven parts: `scenario`, `harness`, `connectionMethod`, `surface`, `scope`, `modelOrProvider`, and `runtime`.
- Production setup loads validated registry data. Tests use the same loader boundary.
- A lab-only bootstrap can create provisional tuple and disposable-session inputs. It cannot promote support.
- Every native route supplies exact caller and connection-method identity.
- Codex command rules use exact verified executable prefixes.
- Claude Code permission rules and Claude Code sandbox access are separate. Broad home access is prohibited.
- Project setup writes the reviewed `harnessIntegrations` state. It preserves unrelated project config.
- Machine setup works without project initialization.
- Non-interactive setup requires explicit method choices. It does not silently choose `none`.
- Store-free resource list and read stay independent of harness setup.
- The W19 R3 shared Store session gate remains the concurrency baseline.

## Stage 1 — Authority Reconciliation

Update PRDs 07, 20, 24, 25, 28, 39, 43, and 44. Add D-033 to the living risk register. Remove the six-part tuple conflict. Define the production registry load, lab bootstrap, exact caller identity, safe native-rule boundaries, project config write, machine-only entry, non-interactive method inputs, repeat-state model, and blocker-action rules.

P1 remains a foundation code candidate and incomplete acceptance attempt. Unit and integration tests from P1 remain useful. They cannot satisfy setup, conformance, or Human Experience acceptance.

## Stage 2 — Production-Path Completion

Connect the normal CLI to the central conformance loader. Remove test-only reviewed-plan injection as a support route. Add the lab-only bootstrap needed to create provisional exact tuples and disposable inputs. Make an eligible method selectable only from validated central evidence.

Complete the interactive flow in this order: project state, harness selection, method and access explanation for each harness, optional Skills for that harness, resource placement, grouped computer and project review, machine apply and verify, project apply and verify, and one final result. Write reviewed project intent. Add explicit non-interactive method inputs and exact dry-run output.

Carry exact caller and method identity through MCP and rule routes. Prove Codex exact-prefix behavior. Treat Claude Code permission and sandbox controls separately. Keep the Claude rule choice unavailable if narrow Store access cannot be proved without broad home access.

## Stage 3 — Installed Conformance and Human Experience Acceptance

Use disposable homes and projects. Bootstrap exact provisional tuples through the lab-only path. Run the real Codex and Claude Code harness for every method that the CLI can show. Record results through the normal PRD 44 seam. Then read those results through production setup.

Review the installed CLI for fresh, current, partial, no-method, supported-method, unsupported-method, drift, blocker, failure, recovery, repeat, dry-run, and non-interactive states. Confirm that every blocker gives one useful next action. Confirm that Store-free resource reads remain usable with no harness method and an unavailable Store.

## Hard Close Rules

1. The central registry uses the seven-part tuple and no active six-part or eight-part runtime tuple remains.
2. Production setup reads support only through the validated central registry loader.
3. Tests and adapters cannot inject a reviewed support plan that production cannot load.
4. Each method shown by setup is selectable from exact eligible central evidence and no other source.
5. The real lab can bootstrap provisional inputs and record real disposable-harness results without changing a user home.
6. MCP and rule routes supply the exact caller and method identity required by the operation policy.
7. Codex rules pass real-harness proof. Claude rules pass separate permission and sandbox proof or remain unavailable with a useful reason.
8. Interactive, machine-only, dry-run, and non-interactive setup write or preserve the exact reviewed machine and project state.
9. Repeat setup reports current, drifted, blocked, unsupported, or incomplete state and gives a useful action without a rerun loop.
10. Installed conformance, Store-free resource proof, full automated checks, and Human Experience Review pass for every public promise.

## Implementation Authority and Exclusions

The owner authorizes later W19 R6 P2 implementation and real disposable Codex and Claude Code lab runs within this phase. This authority does not include the real user home, Pi support, a new Store architecture, broad home access, staging, commit, installation, publication, or release.

This documentation update does not start implementation or a lab run.
