---
title: "W20 R0 Phase 2 Contract Reference and Design Entry"
kind: "plan"
status: "draft"
coordinate: "W20 R0 P2"
source:
  type: "plan"
  path: "docs/plans/2026-08-28-w20-r0-human-experience-standard-and-intent/00-overview.md"
---

# W20 R0 Phase 2: Contract, Reference, and Design Entry

## Purpose

Create one authoritative rule and one small design entry point.

This phase must make the standard easy for an agent to find and apply. It must not spread copied policy across routers, prompts, or Skills.

## Sources

- [Plan overview](00-overview.md)
- [Phase 1](01-prd-authority-and-requirement-trace.md)
- [Human Experience Standard and Intent design](../../designs/2026-08-28-human-experience-standard-and-intent.md)
- Approved PRD 49 and bounded owner updates

## Preconditions

- PRD 49 is approved and active.
- PRDs 06 and 14 contain the delivery and lifecycle boundaries.
- Stable resource names and body field names match PRD authority.

## New System Resources

Author upstream first:

- `packages/docs/template/.make-docs/contracts/system/human-experience-contract.md`
- `packages/docs/template/.make-docs/references/system/human-experience.md`

Use these stable URIs:

- `make-docs://system/contract/human-experience-contract.md`
- `make-docs://system/reference/human-experience.md`

The contract owns:

- the canonical standard;
- `direct`, `indirect`, and `none` meanings;
- the exact conditional section forms;
- field order and position in a design;
- lifecycle propagation requirements;
- evidence proportionality;
- the boundary between structural checks and human judgment;
- prospective activation.

The reference explains:

- how to interpret the standard across commands, interfaces, documents, APIs, workflows, file trees, and indirect system effects;
- how to identify the human goal or effect;
- how to state observable experience promises;
- what complexity should stay out of the normal human path;
- how to choose proof that can reveal failure;
- how to use `none` without inventing interaction;
- how to separate human and machine presentation;
- examples and counterexamples that do not become a second contract.

## Design Contract And Template

Update the upstream design contract and design template.

Every new generated design and every substantial update governed by the activated contract must contain exactly one `## Human Experience Intent` section after `## Context` and before `## Decision`.

For `direct` and `indirect`, require:

- `Impact`;
- `Affected humans`;
- `Human goal or effect`;
- `Experience promises`;
- `Complexity kept out of the human path`;
- `Evidence required`.

For `none`, require:

- `Impact`;
- `Reason`;
- `Preserved experience`;
- `Evidence required`.

Do not add these values to YAML frontmatter in the first version.

## Design Workflow And Prompt

Update the design workflow and request-to-design prompt.

The agent must:

1. consider human impact for the change, not for the fact that a person can read the design;
2. choose one valid impact value;
3. resolve affected Personas or human roles;
4. describe the goal or material effect before implementation details;
5. state observable promises;
6. state internal complexity that must not become required human knowledge;
7. state future evidence without claiming it already exists;
8. stop for a product choice when no coherent human path can be inferred.

## Structural Validation

Add deterministic checks for:

- one section in the required position;
- one allowed impact value;
- the full direct or indirect fields;
- the short none fields;
- duplicate sections;
- unresolved template placeholders;
- prospective activation so historical documents remain readable.

Tests must include:

- a direct command or interface change;
- an indirect reliability or recovery change;
- a valid internal none case;
- a misleading headless or agent-facing case with a real human effect;
- missing fields;
- invalid impact value;
- duplicate section;
- a pre-activation historical design.

Validators must not report that a design is beautiful, intuitive, joyful, or coherent. They can report only structural facts.

## Delivery Inventory

The later backlog must inspect and update the exact current catalog and validation owners before writing.

Expected code and test owners include:

- `packages/cli/src/rules.ts` for profile-owned resource paths;
- `packages/cli/src/tool-directory.ts` for stable system-resource discovery;
- `packages/cli/tests/consistency.test.ts` for catalog and template parity;
- `packages/cli/tests/template-links.test.ts` for resolving template links;
- the current document-validation owner for design heading and conditional field checks.

The code index, not this plan, decides the final symbol-level write scope.

## Upstream And Projection Order

1. Author or update upstream resources in `packages/docs/template/`.
2. Update catalog, rules, validation, and manifest expectations.
3. Build the package projection used by the CLI.
4. Reseed only affected template-owned dogfood files.
5. Verify byte or semantic parity where the ownership contract requires it.
6. Test a clean installed project and an updated project.

Do not author product system resources first in the repository dogfood copy.

## Acceptance

- The contract is the single normative source.
- The reference adds useful examples without changing policy.
- The design template contains one conditional section in the correct place.
- Direct, indirect, and none fixtures pass or fail as expected.
- Historical designs remain valid until prospective activation applies.
- The agent can find the stable URIs through supported resource access.
- Router and prompt text points to authority instead of copying the standard.
- No mandatory Skill or new resource type exists.

## Handoff

Phase 3 consumes the stable resource names, field names, impact values, and activation rules. Later consumers must link to this authority and carry only their local interpretation.
