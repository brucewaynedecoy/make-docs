---
title: "Phase 3: Package Proof and Closeout"
kind: "work"
status: "active"
coordinate: "W22 R2 P3"
source:
  type: "prd"
  path: "../../prd/39-cli-command-model-and-operation-registry.md"
---

# Phase 3: Package Proof and Closeout

## Purpose

Prove the full second-machine goal with a package and record the limits.

## Overview

Bump the CLI package from `2.0.6` to the next patch candidate, `2.0.7`. Then install on Store A, commit, clone, and adopt against a configured Store B with no record for that project. Check the command output, Store identity and ledger, git bytes, and package version. Run negative cases and a Human Experience Review. Update the user guide when the accepted command surface changes.

## Human Experience Outcome

- Impact and governing promise: A person can finish setup on a second machine with saved choices and no unwanted git change. [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md#setup-command-contract-r-setup) owns the command path.
- Intended human outcome: The person sees the adopted checkout, the kept project content, and a useful next action for every stop.
- Human-facing surface or indirect effect: Packaged CLI text and JSON, MCP result, guide, Store state, and git status.
- Implementation work: Package fixture, negative cases, coverage pass, guide decision, and closeout review.
- Evidence source or testing type: Automated package cases and agent Human Experience Review under the [contract](../../../.make-docs/system/contracts/human-experience-contract.md).
- Executor: Implementing agent.
- Accepted obligation or deferral route: None.

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | Activate | The Store A to Store B package path is the main acceptance proof. |
| Performance Testing | `not-needed-now` | No performance target or candidate is in this change. |
| Guided Progress Review | `not-needed-now` | Agent Human Experience Review can inspect the real packaged output. |
| Unassisted Goal Testing | `not-needed-now` | A package fixture and command review can decide this bounded setup goal now. Revisit if the real flow remains unclear. |

- Base maintenance action: `none`.
- Performance applicability: `not-needed`.
- Canonical `PERF-###` profile link or `none`: none.
- Finite evidence budget and stop-rule reference or `not-applicable`: `not-applicable`.
- Execution packet link or `not-applicable`: `not-applicable`.
- Outcome and evidence handoff or `none`: none.
- Gate disposition and supported-scope limit or `not-applicable`: `not-applicable`.

Human Experience Review is required for the packaged result. Record observations, limits, and next actions in [evidence.md](evidence.md). Offer a short optional try-it path after the command works.

## Source PRD Docs

- [PRD 05: install and conflict plan](../../prd/05-installation-profile-and-manifest-lifecycle.md)
- [PRD 06: resource projection](../../prd/06-template-contracts-and-generated-assets.md)
- [PRD 07: setup interaction](../../prd/07-cli-command-surface-and-lifecycle.md)
- [PRD 15: routers and blocks](../../prd/15-agent-instruction-ownership-and-managed-blocks.md)
- [PRD 18: compatibility state](../../prd/18-compatibility-classification-and-migration-safety.md)
- [PRD 24: saved config](../../prd/24-project-configuration-and-convention-overlay.md)
- [PRD 38: Store identity](../../prd/38-global-store-and-project-state.md)
- [PRD 39: CLI and status](../../prd/39-cli-command-model-and-operation-registry.md)

## Source Obligations, Scenarios, And Findings

- Obligations: none active.
- Unassisted Goal Testing scenarios: none active.
- Finding: [D-050](../../prd/03-open-questions-and-risk-register.md#d-050-second-machine-setup-cannot-adopt-a-portable-checkout).

## Stage 1 - Two-Store Package Proof

### Tasks

- [x] t1: Bump `packages/cli/package.json` from `2.0.6` to `2.0.7`. Update the CLI workspace entries in `package-lock.json` through the supported package process. Keep the private root at `0.0.0` and unrelated dependencies fixed. Follow the release-candidate digest gate for the final artifact.
- [x] t2: Build and pack the bumped CLI. Check its package name and `2.0.7` version. Install a project with all four resource types on Store A. Commit and clone it. Configure Store B with no record for that project.
- [ ] t3: Run status and checkout preview before setup. Run `setup --adopt --yes` with saved choices and the default keep policy. Repeat with `--conflicts keep`. Check one registered checkout, the saved project ID, ownership records, and git status.
- [ ] t4: Repeat with exact shipped files, changed managed blocks, changed resources, a bound row without a ledger, and a prior failed setup. Test repeat setup and lost-reply retry.
- [ ] t5: Test malformed config, unsafe paths, competing claims, stale plans, damaged markers, and partial resource projection. Check that each stop leaves no unintended Store or project change.
- [ ] t6: Compare CLI, JSON, and MCP state, conflict, and next-action results. Run the dry-run and apply parity cases.
- [x] t7: Run the two-Store plain-setup release check for 2.0.7. Cover plain setup, `setup --yes`, dry run, each interactive path choice, and `setup --adopt --yes`. Prove the first three make no Store or project write, `--yes` names the adopt command, adoption keeps the project ID, and git stays clean.

### Acceptance criteria

- A11: The CLI package and lock entries show `2.0.7`. The built package reports `2.0.7`; the private root remains `0.0.0`.
- A12: A clean clone adopts into Store B with its saved project ID, a distinct local checkout, and no tracked-byte change.
- A13: Changed valid blocks and resources stay in git under keep. Exact shipped content may become managed. A second run does not mint another checkout.
- A14: Before setup, after a failed setup, and after adoption, status and checkout preview agree on binding and ledger facts. Each unregistered or incomplete result names the adopt path.
- A15: Dry run and apply agree on ready or blocked state for each fixture. CLI, JSON, and MCP show the same affected paths and next action.
- A16: Malformed, unsafe, competing, stale, and marker-damaged inputs stop without an unintended mutation.
- A17: The 2.0.7 release check passes the two-Store plain-setup choice gate and the explicit adoption path. No package is ready for release if plain setup writes before a path choice or labels the checkout fresh.

### Dependencies

- P1 and P2 pass their acceptance cases.

### Closeout Notes

- Four testing decisions: Use the phase table.
- Performance evidence: none.
- Human Experience Review: Record the real output and limits in [evidence.md](evidence.md).
- Optional experience handoff: Give one to three normal-use steps after the package passes.
- Explicit human acceptance gate: none.
- Evidence report: [P3 result](evidence.md#next-evidence).
- Phase / capability status: Open until package cases pass.

## Stage 2 - Coverage and Guide

### Tasks

- [ ] t8: Run the applicable PRD, implementation, testing, and user-guide coverage checks. Record findings in the central evidence report and route any remaining gap to D-050.
- [x] t9: Update the existing installation lifecycle user guide for `--adopt`, `--conflicts`, saved choices, dry-run behavior, and the new version when the implemented command contract is confirmed.
- [ ] t10: Compare the owner's three named resource bodies with their source package when the bytes become available. Keep their cause `unknown` until then.
- [x] t11: Complete agent Human Experience Review for the status, preview, setup, and dry-run results. Record observations, conclusions, limits, and next actions.

### Acceptance criteria

- A18: The guide shows the verified adoption command, new version, and safe conflict choices. It does not claim behavior that the package check did not prove.
- A19: Coverage and Human Experience Review findings have links to evidence, a next action, and an accurate D-050 status. Unknown resource causes remain marked unknown.

### Dependencies

- Stage 1 gives the packaged command and its verified output.

### Closeout Notes

- Four testing decisions: Use the phase table.
- Performance evidence: none.
- Human Experience Review: Record promise conclusions, evidence, reviewer, and limits in [evidence.md](evidence.md).
- Optional experience handoff: Include short try-it steps and an optional feedback request in the phase report.
- Explicit human acceptance gate: none.
- Evidence report: [P3 result](evidence.md#next-evidence).
- Phase / capability status: Open until coverage and guide decisions are recorded.
