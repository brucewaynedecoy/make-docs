---
title: "W23 R0 P7 Package Parity and Acceptance"
kind: "plan"
status: "draft"
coordinate: "W23 R0 P7"
source:
  type: "prd"
  path: "docs/prd/51-backlog-review-and-reporting.md"
---

# W23 R0 P7 Package Parity and Acceptance

## Purpose

Prove that the operation, Skill, chat report, and HTML report work together from one extracted package and preserve the accepted human outcomes.

## Outcome

One identified package candidate passes source, build, package, installed CLI, MCP, Skill, browser, and Human Experience checks. Evidence states what was proved and what remains unproved.

## Scope

- Verify source and built Skill payload parity, including the HTML template and all declared support files.
- Verify registry, CLI, MCP, and operation-core parity.
- Verify extracted-package use without the maintainer checkout or network.
- Exercise repository-only use with absent, denied, unsafe, and unavailable Store states.
- Verify exact cache reuse and invalidation, the full stateless fallback, and the user-requested raw-data surface from the installed package.
- Exercise Git available and unavailable cases.
- Compare chat and HTML results from one report model.
- Exercise all six accepted fixture groups across their applicable deterministic, agentic, chat, HTML, and human-error surfaces.
- Complete responsive, keyboard, reduced-motion, print, and safe-content browser checks.
- Complete the Human Experience Review with evidence, observations, conclusions, limits, and next actions.
- Prepare the short optional experience handoff for the owner.

## Acceptance Boundary

Package success does not prove that every historical Make Docs backlog is well-formed. The product must report unsupported or conflicting records honestly. Owner feedback on the finished report is useful and optional unless later accepted authority defines a specific human acceptance gate.

## Verification

- Focused and full tests pass for the identified candidate.
- Package smoke checks prove the expected files and no undeclared source dependency.
- Installed CLI and MCP return matching structured meaning.
- The installed Skill chooses the correct method and reports it.
- The HTML file remains usable offline and safe with hostile fixture text.
- Human Experience Review reaches a supported conclusion for each accepted promise or records a material gap or insufficient evidence.
