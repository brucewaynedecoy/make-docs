---
title: "Phase 5: Delivery, Installed Evidence, and Delta Closeout"
kind: "work"
status: "completed"
coordinate: "W20 R0 P5"
source:
  type: "prd"
  path: "docs/prd/49-human-experience-standard-and-intent.md"
---

# Phase 5: Delivery, Installed Evidence, and Delta Closeout

## Current Authority

[W20 R2](../../plans/2026-09-15-w20-r2-human-experience-review-and-feedback-boundary/00-overview.md) corrects the review boundary. The agent owns Human Experience Review. A normal experience handoff is optional. Human acceptance blocks only when accepted authority defines an explicit gate.

[W19 R6](../2026-09-12-w19-r6-unified-setup-and-harness-access/00-index.md) retires the dynamic conformance system. Current harness proof uses static product-owned adapters and direct installed-product checks. PRDs 20, 43, and 44 are not current authority. This phase does not restore tuples, registries, scenario kits, lab sessions, Playbook or Protocol runtime, or a recurring owner-response gate.

## Purpose

Prove that the Human Experience capability reaches installed projects and supported agent paths. Prove that a real human-facing Make Docs flow uses the capability. Close W20 R0 without claiming a lived human reaction or granting release authority.

## Source PRD Docs

- [PRD 01 — Product Overview](../../prd/01-product-overview.md)
- [PRD 06 — Template Contracts and Generated Assets](../../prd/06-template-contracts-and-generated-assets.md)
- [PRD 07 — CLI Command Surface and Lifecycle](../../prd/07-cli-command-surface-and-lifecycle.md)
- [PRD 09 — Dogfood and Maintainer Operations](../../prd/09-dogfood-and-maintainer-operations.md)
- [PRD 10 — Packaging, Validation, and Release Reference](../../prd/10-packaging-validation-and-release-reference.md)
- [PRD 14 — Lifecycle Workflow and Coverage Passes](../../prd/14-lifecycle-workflow-and-coverage-passes.md)
- [PRD 15 — Agent Instruction Ownership and Managed Blocks](../../prd/15-agent-instruction-ownership-and-managed-blocks.md)
- [PRD 23 — Generated Document Metadata and Lifecycle Handoffs](../../prd/23-generated-document-metadata-and-lifecycle-handoffs.md)
- [PRD 25 — TypeScript Runtime, CLI, and MCP Operation Boundaries](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md)
- [PRD 28 — Shared Agentics Installation and Harness Exposure](../../prd/28-shared-agentics-installation-and-harness-exposure.md)
- [PRD 39 — CLI Command Model and Operation Registry](../../prd/39-cli-command-model-and-operation-registry.md)
- [PRD 45 — Deferred Obligation Governance](../../prd/45-deferred-obligation-governance.md)
- [PRD 46 — Unassisted Goal Testing](../../prd/46-naive-end-user-acceptance-testing.md)
- [PRD 47 — Persona Model](../../prd/47-persona-model.md)
- [PRD 49 — Human Experience Standard and Intent](../../prd/49-human-experience-standard-and-intent.md)
- [PRD 50 — Proportionate Testing and Human-Centered Validation](../../prd/50-proportionate-testing-and-human-centered-validation.md)

## Evidence Reuse Decision

The P5 package proof already covers the Human Experience resources in clean and constructed-update projects. The [W19 R6 evidence](../2026-09-12-w19-r6-unified-setup-and-harness-access/evidence.md) adds the missing real-agent and real-surface proof. It covers installed Codex MCP, Codex command rules, Claude Code MCP, safe blocked-method behavior, Store-free resource reads, setup recovery, repeated setup, and an agent-owned six-promise Human Experience Review.

This evidence is reusable because it uses the same packaged resources, CLI, Store policy, setup flow, and static adapter code that P5 must assess. The direct human-facing surface is the installed Make Docs setup and harness-access flow. The originating product problem is not used as a fixture.

Evidence limits remain active:

- The review is agent evidence. It is not lived human judgment.
- Claude Code permission rules remain blocked because the tested live command path was unsafe. Claude Code MCP is the safe supported alternative.
- Current proof supports the tested macOS package and harness paths. It does not make a wider platform or release claim.
- Publication, deployment, release, and real-project recovery remain separate actions.

## Stage 1: Package, Projection, and Dogfood Proof

### Tasks

- [x] t1: Confirm that reviewed system-resource and default-asset changes exist first under `packages/docs/template/`.
- [x] t2: Confirm that catalogs, resource discovery, validation, routers, and managed-block expectations include the Human Experience resources.
- [x] t3: Build the CLI package projection through the supported package path.
- [x] t4: Verify that the package contains the reviewed Human Experience contract, reference, templates, prompts, lifecycle edits, routers, and defaults.
- [x] t5: Reseed only affected template-owned dogfood files after upstream review.
- [x] t6: Verify required byte or semantic parity across upstream, package projection, and dogfood copies.
- [x] t7: Pack and install the CLI into a clean project. Verify stable resource URIs through list and read operations.
- [x] t8: Update an existing project with historical designs and modified user-owned router text. Verify managed changes and preserved user content.
- [x] t9: Verify offline behavior and recovery for unavailable or invalid resource requests.

### Result

Complete. The original P5 package evidence proves clean install, constructed update, exact resource bytes, offline reads, useful missing-resource recovery, and user-content preservation. Current packed smoke again proves upstream, packed, and installed dogfood router parity.

## Stage 2: Structural and Functional Validation

### Tasks

- [x] t10: Run default-resource validation.
- [x] t11: Run focused and full CLI tests for Human Experience propagation, resource access, setup, Store, migration, routers, and managed content.
- [x] t12: Run packed-package smoke with dogfood parity.
- [x] t13: Run the instruction-router check.
- [x] t14: Run PRD authority, Markdown-link, and focused changed-file path checks.
- [x] t15: Run `git diff --check` and inspect generated state.
- [x] t16: Verify direct, indirect, none, missing, invalid, duplicate, unresolved, misleading, and historical validation cases.
- [x] t17: Verify that no new resource type, mandatory Skill, experience frontmatter, repository-wide rewrite, or unexpected local projection exists.
- [x] t18: Record versions, environment, results, evidence paths, and current testing decisions. Reuse unchanged evidence.

### Result

Complete. The current CLI suite passed 80 files and 1,264 tests. The build passed. Local packed-package smoke passed with dogfood parity. Default-resource checks passed 53 tests. PRD authority validation passed over 36 PRDs, 567 Markdown files, 196 structured files, and 1,090 links with no diagnostic. The instruction-router and wave-numbering checks passed. Focused path hygiene passed the changed files. Diff checks passed.

## Stage 3: Agent Reach and Application Proof

### Tasks

- [x] t19: Define the installed proof matrix from current static adapters and declared methods.
- [x] t20: Prove direct-impact handling through the W19 R6 setup and harness-access promises.
- [x] t21: Reuse the Human Experience fixture evidence for indirect-impact handling.
- [x] t22: Reuse the Human Experience fixture evidence for a valid `none` result and preservation proof.
- [x] t23: Verify that misleading agent-facing or headless wording does not hide a material human effect.
- [x] t24: Verify that a missing product choice stops or keeps the method blocked instead of exposing an unsafe internal path.
- [x] t25: Run deterministic structure checks for the applied results.
- [x] t26: Prepare and record the agent Human Experience Review. Inspect the installed result. Record each promise, evidence, conclusion, reviewer, limit, and next action.
- [x] t27: Record each tested harness, connection method, result, and bounded support claim under current static-adapter authority.

### Result

Complete. Codex MCP, Codex command rules, and Claude Code MCP passed direct installed read and write checks. Resource reads passed without Store access. The Codex no-rule control failed as expected. Wider commands were rejected. Claude Code permission rules stayed blocked after the live command path failed to preserve the exact safe command. The product shows the safe MCP alternative. No internal test is used as a substitute for required direct proof.

## Stage 4: Real-Surface Human Outcome Evidence

### Tasks

- [x] t28: Select the bounded installed Make Docs setup and harness-access flow.
- [x] t29: Record the intended human, public goal, starting risk, and experience promises before closeout.
- [x] t30: Use the installed package and real Codex and Claude Code paths for the applicable proof.
- [x] t31: Inspect the real CLI and harness-facing surfaces. Do not accept documents alone as the outcome.
- [x] t32: Capture the visible default result, safe alternatives, exact next actions, and optional detail without forcing internal identifiers into the normal path.
- [x] t33: Apply the agent Human Experience Review for orientation, continuity, meaning, information amount, next action, recovery, control, and terms.
- [x] t34: Keep Guided Progress Review optional. Record Unassisted Goal Testing as `not-needed-now` because current direct installed proof answers the closeout question.
- [x] t35: Compare the result with the prior tuple prompt, missing-tool result, unsafe broad-rule risk, and repeated-setup risk.
- [x] t36: Give every material finding a disposition and repeat only affected proof.

### Human Experience Review

| Promise | Evidence and observation | Conclusion | Reviewer and limit | Disposition |
| --- | --- | --- | --- | --- |
| Explain computer, project, and Store effects before a write. | Installed setup shows scope, native file, owned entry, Store intent, project target, safety stops, and planned file actions. | `satisfied` | Implementation agent. This is an inspected CLI result, not a lived human reaction. | Accept the tested clarity claim. |
| Complete missing system setup inside the project setup flow. | The production path performs machine setup before project apply and gives an exact resume action after project failure. | `satisfied` | Tested disposable homes and automated recovery cases only. | Accept the tested continuity claim. |
| Keep resource reads Store-free. | Installed resource list and read pass with the Store absent, locked, unreadable, unsafe, and without a Store session. | `satisfied` | Covers shipped resource-provider reads only. | Accept the Store-free read claim. |
| Preserve existing project and user content. | Clean, partial, current, legacy-transfer, modified-router, and repeat cases preserve project content and user text. | `satisfied` | The legacy update is a constructed fixture, not every released historical version. | Accept the tested preservation claim. |
| Show only safe current harness methods. | Static adapter output shows available methods, exact effects, blocked methods, and safe alternatives. | `satisfied` | Applies to the tested Codex and Claude Code versions and declared methods. | Keep Claude Code permission rules blocked. |
| Keep repeated work calm and useful. | Repeat setup reports current state and performs no write. Failure recovery resumes only the unfinished project part. | `satisfied` | Covers tested setup states and injected failure paths. | Accept the tested repeat and recovery claim. |

No material Human Experience gap remains for the W20 R0 capability claim. The agent does not claim beauty, joy, or a lived human response.

## Stage 5: Prospective Adoption and Upgrade Proof

### Tasks

- [x] t37: Test a new project created after activation.
- [x] t38: Test an existing project with pre-activation historical designs.
- [x] t39: Test a substantial design update that uses the current contract.
- [x] t40: Test modified user-owned router text and project-owned documents.
- [x] t41: Test a valid no-human-impact change with the short `none` form and preservation proof.
- [x] t42: Test direct and indirect changes that activate full Human Experience Intent and downstream trace.
- [x] t43: Verify that upgrade does not force repository-wide rewriting or overwrite modified project content.
- [x] t44: Verify that future qualifying work finds the activation rule and stable authority without a mandatory Skill.

### Result

Complete. P2 through P4 provide direct, indirect, `none`, missing, historical, and update fixtures. P5 package and update proof shows prospective delivery and preservation. W19 R6 provides a substantial direct-impact use of the installed authority. W20 R2 proves that the agent review and optional handoff rules propagate without a new schema or runtime feature.

## Stage 6: Final Reconciliation and W20 R0 Closeout

### Tasks

- [x] t45: Reconcile `R-HX-01` through `R-HX-12` to implementation and evidence.
- [x] t46: Reconcile applicable owner PRD requirements and `R-033`.
- [x] t47: Record decisions for all four testing types and the Human Experience Review.
- [x] t48: Complete the finding and obligation audit.
- [x] t49: Bound product and release claims to exact installed paths, methods, and evidence.
- [x] t50: Update backlog tasks, status, notes, and evidence links.
- [x] t51: Create the W20 R0 history breadcrumb.
- [x] t52: Run final link, path, generated-state, and diff checks.
- [x] t53: Present the closeout and a short optional experience handoff. Do not require a response.

### Requirement Reconciliation

| Requirements | Close evidence |
| --- | --- |
| `R-HX-01` through `R-HX-06` | P1 and P2 authority, contract, reference, classification, intent form, universal principles, human and machine boundaries, and Persona limits. |
| `R-HX-07` through `R-HX-09` | P3 lifecycle propagation, P4 conclusion and evidence rules, and the W20 R2 agent-review, optional-handoff, and explicit-gate correction. |
| `R-HX-10` and `R-HX-11` | P2 resource/router authority, P5 package and installed reads, P4 failure-revealing fixtures, and the current full validation pass. |
| `R-HX-12` | P5 clean install, constructed update, historical-content preservation, direct/indirect/none fixtures, and W19 R6 qualifying direct work. |

`R-033` closes. Structural checks remain necessary but insufficient. The P4 fixture proves that complete form can still fail Human Experience Review. P5 adds installed resource, real agent path, real CLI surface, direct method, failure, recovery, preservation, and agent-review evidence. The default owner-response failure is separately corrected by W20 R2.

No real `O-###` or `NUAT-###` item is created. No accepted future Human Experience outcome remains unowned.

## Final Testing Decisions

| Testing type | Decision | Reason and gate effect |
| --- | --- | --- |
| Automated Implementation Testing | `selected` | Current full, focused, default, package, link, router, path, and diff checks support their exact claims. A failure blocks only its covered claim. |
| Performance Testing | `not-needed-now` | W20 R0 has no accepted quantitative performance outcome. |
| Guided Progress Review | `not-needed-now` | The optional handoff remains available. No current question needs a guided session to close. |
| Unassisted Goal Testing | `not-needed-now` | Direct installed product and real harness evidence answer the current closeout question. No separate naive-user claim is made. |

Human Experience Review is `satisfied` for all six applicable installed-flow promises. No explicit human acceptance gate applies to W20 R0 closeout.

## Final Status

W20 R0 P5 is complete. W20 R0 is complete. The capability is available through the shipped Human Experience resources and lifecycle guidance. `R-033` is closed. No publication, release, deployment, branch change, or real-project recovery is authorized by this record.
