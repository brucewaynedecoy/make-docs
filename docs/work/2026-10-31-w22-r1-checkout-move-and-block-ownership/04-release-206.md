---
title: "Phase 4: Make Docs 2.0.6 Release Preparation"
kind: "work"
status: "draft"
coordinate: "W22 R1 P4"
source:
  type: "prd"
  path: "docs/prd/10-packaging-validation-and-release-reference.md"
---

# Phase 4: Make Docs 2.0.6 Release Preparation

## Purpose

Prepare a versioned 2.0.6 candidate after development proof. Prove the final artifact before a separate release decision. See [plan P4](../../plans/2026-10-31-w22-r1-checkout-move-and-block-ownership/04-release-206.md).

## Overview

The version bump is a future task. Keep the private root at 0.0.0 and unrelated dependencies unchanged. One final tarball digest must connect source, installed cases, real hosts, stage review, and public verification. Publication and the owner's live repair remain separate authorized actions.

## Current Testing Decisions

Use the [common decision record](00-index.md#common-testing-decision-record). It supplies the reason, maturity, executor, gate effect, budget, stop condition, retained evidence, and rerun trigger. The phase scope is final-tree checks, exact final tarball, authentic upgrade, full smoke, and required real-host proof.

| Testing type | Current decision | Phase record |
| --- | --- | --- |
| Automated Implementation Testing | Planned; required for exact correctness claims after authorization | final-tree checks, exact final tarball, authentic upgrade, full smoke, and required real-host proof; affected-first tests before broader proof; use the shared finite budget. |
| Performance Testing | not-needed-now | No speed/scale claim; zero runs. Revisit only for a new accepted performance claim or relevant cost risk. |
| Guided Progress Review | Optional and advisory | Use the optional P3 offer unless a material UI change creates a useful reason for another bounded offer. A decline or no response creates no gate or obligation. |
| Unassisted Goal Testing | not-needed-now | The known failure can be answered by automated proof and agent review. Revisit for material discoverability uncertainty those cannot answer, or explicit product/release authority. No scenario or tester is selected. |

Human Experience Review remains required agent work. Inspect the available real result for each promise and record the reviewer, observations, conclusion, evidence, limit, and next action in [evidence.md](evidence.md). It is not a fifth test type. No explicit human acceptance gate is selected.

Performance fields: base action is correctness repair; applicability is not-needed-now; canonical profile is none; budget, packet, outcome, and performance gate are not-applicable. Do not run a benchmark.

## Human Experience Outcome

- Impact and promise: direct; release notes describe the shipped fix, real limits, and separate root/kit targeting.
- Intended human outcome: a maintainer can identify the exact tested candidate and safely choose whether to release it.
- Surface: version output, release evidence, release notes, stage review, and public package facts.
- Work: version metadata, exact-artifact proof, security/limit review, and separately approved publication.
- Evidence: source/tree identity, package/lock versions, tarball hash/integrity, installed results, host matrix, security decision, and public checks.
- Executor: authorized maintainer/agent for preparation; human npm approval requires separate authority and two-factor authentication.
- Obligation route: none. Missing required host/seed proof is a blocker unless current PRD 10 has an explicit valid bounded exception.
- Authority: [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md).

## Source PRD Docs

- [PRD 10: packaging and release](../../prd/10-packaging-validation-and-release-reference.md), Installed Legacy-Project Candidate Proof; Core Platform Candidate Proof.
- [PRD 15: ownership](../../prd/15-agent-instruction-ownership-and-managed-blocks.md).
- [PRD 18: migration safety](../../prd/18-compatibility-classification-and-migration-safety.md).
- [PRD 38: Store safety](../../prd/38-global-store-and-project-state.md).
- [PRD 50: testing](../../prd/50-proportionate-testing-and-human-centered-validation.md).

## Source Obligations, Scenarios, And Findings

- Accepted obligations and activated NUAT scenarios: none.
- Finding: [D-049](../../prd/03-open-questions-and-risk-register.md#d-049-moved-checkout-setup-bypasses-project-identity-and-managed-block-ownership), open until exact installed proof passes.
- Dependency: [P3 development evidence](03-tests-and-package-proof.md).
- Release authority: [RELEASING.md](../../../RELEASING.md) and current PRD 10.

## Stage 1 - Prepare Version and Release Material

### Tasks

- [x] t1: After P3 proof and implementation authorization, bump packages/cli/package.json from 2.0.5 to 2.0.6 and update only its workspace version entries in package-lock.json through supported tooling. Keep the private root at 0.0.0.
- [x] t2: Update only current-version claims and owning generated metadata. Author reusable guidance in packages/docs/template first; rebuild through scripts. Preserve historical 2.0.5 records and unrelated dependencies.
- [x] t3: Write a scoped release note using its actual writing date and the established 2.0.5 note shape. Update RELEASING.md, PRD 10, and the maintainer release guide only where steps/proof change.
- [ ] t4: Review candidate contents, license, dependency changes, automated results, and open GitHub security alerts under RELEASING.md. Resolve or explicitly assess high-severity findings. Carry prior platform/client and bounded performance caveats unless exact fresh proof closes them.

### Acceptance criteria

- A25: CLI and lock metadata agree on 2.0.6. Private root/dependencies and historical evidence are preserved.
- A26: Release notes explain move review, block-only checks, preserved identity/history, unsafe-case limits, and independent root/kit targeting. Security decisions and old caveats are explicit.

### Dependencies

- P3 required development proof and separate execution authorization.
- Current release guidance and relevant GitHub security evidence. Do not expand into unrelated upgrades.

### Closeout Notes

Version and notes remain unchanged until execution. A security review is scoped evidence, not authority for broad dependency work. No publication action is approved by this stage.

## Stage 2 - Prove One Final 2.0.6 Artifact

### Tasks

- [x] t5: Run required final-tree source and full CLI checks, defaults, build, and current release commands. Record reviewed source revision/tree state, package/lock versions, and exact command results. Pack one final 2.0.6 tarball and record SHA-256 and contents.
- [ ] t6: Install that tarball in clean isolated test roots with explicit disposable Stores and source repository unavailable. Confirm metadata and --version report 2.0.6. Repeat the authentic 2.0.5 rename fixture, entire PRD 10 fixed legacy/setup/Store matrix, persistent package-manager link proof, no-scripts checks, and CLI/MCP parity.
- [x] t7: Run complete npm run smoke:pack, including local and online package-runner paths, against that same tarball. Record one common digest. Separate passing runs on different tarballs cannot satisfy this gate.
- [ ] t8: Run the required installed matrix on real Windows, macOS, and Linux hosts with Node.js 24 and source unavailable. Record exact runtime/package manager/host and common artifact digest. Missing seed, host, capability, or required case is blocked unless PRD 10 has an explicit valid time-bounded owner exception.

### Acceptance criteria

- A27: The final artifact, installed version, source/tree state, and package/lock metadata identify one 2.0.6 candidate. A later rebuild or relevant tree change invalidates artifact-bound proof.
- A28: Exact final installed authentic-upgrade, full smoke, existing PRD 10 matrix, and real-host results pass or name precise release blockers. Simulated paths and old unrelated waivers do not replace native proof.
- A29: Required agent Human Experience Review uses the final installed flow and current promises. Any Guided Progress Review stays advisory. No speed, scale, Copilot-client, or unassisted claim is inferred.

### Dependencies

- Stage 1 final version and verified 2.0.5 seed.
- Existing platform-safety and package-proof workflow extensions from P3.

### Closeout Notes

Retain exact results and limitations in evidence.md. D-049 can close only after its required tests and installed proof pass. Version bump alone, development proof, and approval requests are not completion.

## Stage 3 - Review Release and Separately Approved Publication

### Tasks

- [x] t9: Review publish-npm.yml and platform-safety.yml against the final candidate. Add an artifact-match guard so a tag workflow rebuild cannot silently replace the approved digest. If different, stop staging until that replacement passes required proof.
- [ ] t10: Prepare the release decision with exact source, tested digest, security findings, limits, notes, and clean scoped diff. Obtain separate explicit authorization for tag/GitHub release, push/merge as needed, npm staging, and public npm approval. Stop at the first unapproved action.
- [ ] t11: Only after those approvals, execute the approved release/stage steps. Verify stage identity and staged tarball digest before human npm approval with two-factor authentication. A GitHub release or staging job alone is not public npm availability.
- [ ] t12: After separately approved public release, verify public 2.0.6, stable latest tag, provenance link, downloaded integrity/digest, and clean installed version. Record actual availability. Keep the live Make Kit root/kit repair separate, with its own later previews and authorization.

### Acceptance criteria

- A30: The approved, tested, and staged package digests agree. Artifact replacement stops staging until the replacement is proved.
- A31: Each publication action has explicit separate authority. Pending npm approval and public availability are distinct states.
- A32: Public package/version/latest/provenance/integrity/install checks support only the actual released scope. No live root/kit repair or global install change occurs under candidate readiness alone.

### Dependencies

- Stage 2 final proof and current release workflow.
- Separate approvals at each release boundary. No tag, push, merge, npm stage, public approval, or live Store repair is authorized by this documentation task.

### Closeout Notes

Record four testing decisions, security scope, required agent review, exact public/stage results, and remaining limits in evidence.md. Keep optional feedback separate from release permission. Phase/capability/release status remains planned until real evidence exists.
