---
title: "W20 R0 Phase 1 PRD Authority and Requirement Trace"
kind: "plan"
status: "draft"
coordinate: "W20 R0 P1"
source:
  type: "plan"
  path: "docs/plans/2026-08-28-w20-r0-human-experience-standard-and-intent/00-overview.md"
---

# W20 R0 Phase 1: PRD Authority and Requirement Trace

## Purpose

Create current product authority before implementation begins.

This phase preserves the main reason for the work. Make Docs must not treat a technically correct result as sufficient when a person cannot understand the result, see its relationships, or know what to do next.

## Sources

- [Plan overview](00-overview.md)
- [Human Experience Standard and Intent design](../../designs/2026-08-28-human-experience-standard-and-intent.md)
- [PRD authority-maintenance rules](../../../.make-docs/references/system/prd-change-management.md)

## Preconditions

- The owner has accepted this plan.
- PRD generation has separate authority.
- The active PRD set remains the current baseline.
- No implementation file changes occur during this phase.

## New Capability Authority

Create `docs/prd/49-human-experience-standard-and-intent.md`.

The PRD must make the canonical standard normative. It must define the three impact values and the two conditional section forms. It must define the human-versus-machine boundary, lifecycle trace, evidence limits, prospective adoption, and non-requirements.

The PRD must use observable language. It must explain what a person must be able to understand or do. It must not define human quality as the presence of fields.

The PRD must keep these concepts distinct:

- Persona identifies the affected human.
- Human Experience Intent states the goal or effect and local promises.
- Human Experience Review is required acceptance work against every applicable promise. It records `satisfied`, `material gap`, or `insufficient evidence`.
- Unassisted Goal Testing is a conditional testing type. It uses a qualified human to attempt a public goal without private help when a material current uncertainty remains.
- Automated checks prove structure and deterministic behavior.
- Performance Testing, Guided Progress Review, accessibility, visual review, and architecture review keep their own scopes.

## Existing Owner Updates

Apply only the bounded changes listed in the overview.

| PRD | Owned change | Must remain unchanged |
| --- | --- | --- |
| 01 | Product capability and quality boundary | General product identity and unrelated capabilities |
| 06 | Resource ownership, upstream delivery, package projection, dogfood, and parity | Existing asset classes and source-authority model |
| 14 | Cross-cutting lifecycle lens, propagation, required Human Experience Review, and close rules | Lifecycle order and testing authority owned by PRD 50 |
| 15 | Router discovery and managed-block integration | User-owned text and instruction ownership boundaries |
| 23 | Body authority and no new first-version metadata fields | Current frontmatter and handoff schema |
| 46 | Experience promises as conditional Unassisted Goal Testing inputs | Qualified human, public goal, anti-coaching, evidence, advisory result, and finding rules |
| 47 | Persona-to-affected-human link | Persona schema, primitives, selection, and evidence paths |

## Experience Requirement Trace

Every normative requirement in PRD 49 must trace to one or more accepted design decisions.

The PRD draft must include a compact source map for:

- the canonical standard;
- impact classification;
- conditional section fields;
- universal principles;
- human and machine presentation;
- lifecycle propagation;
- evidence proportionality;
- structural validation limits;
- agent certification limits;
- prospective adoption;
- first-release scope.

The map can use source anchors and requirement identifiers. It must not copy the full design into the PRD.

## Shared Authority Assembly

Update PRD 00 after the owner PRDs are stable.

Add PRD 49 as a current capability. Add related links to PRDs 01, 06, 14, 15, 23, 46, and 47. Add the design and plan as source anchors.

Update PRD 03 with `R-033 Human Experience Structure Could Become Checklist Compliance`.

The risk must record:

- the issue: required fields can exist while the human path remains poor;
- why it matters: an agent can claim success without proving orientation, meaning, continuity, next action, or control;
- the recommendation: keep validators structural and require observable, failure-revealing evidence;
- to close: prove contract, conformance, and one real human outcome without agent-only certification.

## Requirement History

Add one `2026-08-28 — W20 R0` entry to each materially updated existing PRD.

Each entry must include the affected section, previous contract, replacement contract, rationale, and source. The current PRD body must carry the new normative requirement.

## Worker Boundaries

- One worker owns PRD 49.
- One worker owns PRDs 01, 06, 14, and 15.
- One worker owns PRDs 23, 46, and 47.
- One assembly worker owns PRD 00, PRD 03, cross-links, and history consistency.
- One validation worker performs the final authority pass.

Workers must not rewrite unrelated sections. The assembly worker resolves link and terminology conflicts after owner drafts are complete.

## Acceptance

- PRD 49 is a coherent product capability, not an editorial change record.
- The canonical standard remains short, universal, and normative.
- Each accepted design promise has a current PRD owner.
- Each cross-boundary PRD contains only the requirement it owns.
- Human Experience Review remains a required acceptance lens. It does not become a fifth testing type or duplicate test verdict.
- The four testing types and specialist authorities keep their own boundaries.
- No new experience fields enter frontmatter.
- PRD 00 exposes the new authority.
- PRD 03 contains R-033 with no duplicate item.
- Relative links resolve.
- Requirement history is complete and non-normative.
- No implementation or backlog file is created in the PRD-only gate.

## Handoff

Approved PRDs become the sole product requirement source for Phases 2 through 5 and the later delta backlog. This plan remains sequencing and provenance authority. It does not override the current PRD body.
