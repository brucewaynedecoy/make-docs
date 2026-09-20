---
title: "Phase 5: Package Parity and Acceptance"
kind: "work"
status: "draft"
coordinate: "W23 R0 P5"
source:
  type: "prd"
  path: "docs/prd/51-backlog-review-and-reporting.md"
---

# Phase 5: Package Parity and Acceptance

## Purpose

Prove the complete capability from one identified extracted package and close only the claims supported by evidence.

## Overview

This phase validates source and package parity, installed CLI and MCP meaning, Skill independence, offline HTML use, accessibility, and the accepted human outcomes.

## Human Experience Outcome

- Impact and governing promise or preserved boundary: Direct. The complete review keeps people oriented, shows evidence and limits, and gives a useful next action in both report formats.
- Intended human outcome: A maintainer can use the installed capability to decide what needs attention and can verify a material claim without reconstructing the system.
- Human-facing surface or indirect effect: Installed Skill, in-chat report, HTML report, and bounded CLI output.
- Implementation work: Package assembly, smoke proof, installed flows, parity review, browser review, Human Experience Review, and closeout.
- Evidence source or testing type selected under current authority: Automated package and installed tests, Guided Progress Review, and Human Experience Review.
- Executor: Validation agent, with optional owner feedback.
- Accepted obligation or deferral route: None.

This phase follows [PRD 51](../../prd/51-backlog-review-and-reporting.md) and the [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md).

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | Required | Full, package, installed, parity, offline, safety, and browser checks. |
| Performance Testing | `not-needed-now` | No accepted target or decision requires a performance run. |
| Guided Progress Review | Required | Final owner review can identify material information or visual gaps before release. |
| Unassisted Goal Testing | `not-needed-now` | No accepted independent discoverability question or qualified separate-executor gate exists. |

- Base maintenance action: `create`
- Performance applicability: `not-needed-now`
- Canonical `PERF-###` profile link or `none`: none
- Finite evidence budget and stop-rule reference or `not-applicable`: not-applicable
- Execution packet link or `not-applicable`: not-applicable
- Outcome and evidence handoff or `none`: none
- Gate disposition and supported-scope limit or `not-applicable`: not-applicable

## Source PRD Docs

- [PRD 51 Backlog Review and Reporting](../../prd/51-backlog-review-and-reporting.md)
- [PRD 08 Skills Catalog and Distribution](../../prd/08-skills-catalog-and-distribution.md)
- [PRD 10 Packaging, Validation, and Release Reference](../../prd/10-packaging-validation-and-release-reference.md)
- [PRD 16 Package Runtime and Deployment Boundaries](../../prd/16-package-runtime-and-deployment-boundaries.md)
- [PRD 39 CLI Command Model and Operation Registry](../../prd/39-cli-command-model-and-operation-registry.md)
- [PRD 49 Human Experience Standard and Intent](../../prd/49-human-experience-standard-and-intent.md)
- [PRD 50 Proportionate Testing and Human-Centered Validation](../../prd/50-proportionate-testing-and-human-centered-validation.md)

## Source Obligations, Scenarios, And Findings

- `O: none`
- `NUAT: not-needed-now`
- `Finding: none`

## Stage 1 - Package and installed proof

### Tasks

- [ ] t1: Build one identified package candidate from reviewed source.
- [ ] t2: Verify source, built output, packed output, registry, operation, Skill support files, and HTML template parity.
- [ ] t3: Exercise installed CLI and MCP success, partial, conflict, unavailable, and failure cases.
- [ ] t4: Exercise the installed Skill through MCP, CLI fallback, and agentic fallback with correct method reporting.
- [ ] t5: Exercise Store absent, denied, unsafe, and unavailable cases plus Git available and unavailable cases.

### Acceptance criteria

- A37: The identified package contains the operation, registry metadata, Skill, references, examples, and HTML template required by PRD 51.
- A38: Installed CLI JSON and MCP results preserve matching values, diagnostics, and capability availability.
- A39: The installed Skill works without the maintainer checkout, network, sibling Skill, or Store access.
- A40: Optional evidence failure narrows the result and does not erase independent repository facts.

### Dependencies

- P2-P4 complete.
- One reviewed package candidate.

## Stage 2 - Report parity and Human Experience closeout

### Tasks

- [ ] t6: Compare chat and HTML output for the same report model across the fixture matrix.
- [ ] t7: Repeat desktop, mobile, keyboard, reduced-motion, print, offline, and hostile-content browser checks from the package.
- [ ] t8: Complete the per-promise Human Experience Review with observations, conclusions, evidence, limits, and next actions.
- [ ] t9: Resolve each material finding or narrow the affected completion claim with an accepted bounded caveat.
- [ ] t10: Prepare the optional owner experience handoff and the release-readiness recommendation.

### Acceptance criteria

- A41: Chat and HTML preserve the same fixed wave statuses, status reasons, four portfolio tallies, conflicts, evidence classes, recommendation rationale, and limits.
- A42: A reviewer can reach source evidence for every material fact, inference, and recommendation in the selected acceptance cases.
- A43: Human Experience Review records a supported conclusion for every accepted promise and does not claim the owner's lived reaction.
- A44: Final status names the exact supported scope, remaining limits, W22 compatibility basis, and whether release requires more authority or evidence.

### Dependencies

- A37-A40 complete.

### Closeout Notes

- Four testing decisions: Automated required; Performance not-needed-now; Guided required; Unassisted not-needed-now.
- Performance evidence: none.
- Human Experience Review: Required per-promise record with evidence, observations, conclusions, limits, and next actions.
- Optional experience handoff: Open the chat report, open the saved HTML file, filter to Attention, expand one wave, and optionally report any unclear state or source path.
- Explicit human acceptance gate: none.
- Evidence report: Create and link the central report after evidence exists.
- Phase / capability status: P5 closes only the scope supported by package, installed, browser, parity, and Human Experience evidence.
