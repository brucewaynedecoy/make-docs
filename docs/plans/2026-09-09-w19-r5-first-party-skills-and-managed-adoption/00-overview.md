---
title: W19 R5 First-Party Skills and Managed Adoption Plan
kind: plan
status: active
coordinate: W19 R5
source:
  type: design
  path: ../../designs/2026-09-09-first-party-skills-and-managed-adoption.md
follow_on:
  route: prd-generation
  why: Put the settled Skill delivery and adoption behavior into existing product owners before deriving work.
  coordinate_handoff: Carry W19 R5 into the one-phase backlog; W20 and W21 stay paused.
---

# W19 R5 First-Party Skills and Managed Adoption Plan

## Purpose

Turn the [design](../../designs/2026-09-09-first-party-skills-and-managed-adoption.md) into current product authority and one reviewable work phase. Embed all seven first-party Skills directly from their sole `packages/skills/<name>/` sources in CLI build output. Package the compiled output, preserve optional behavior, and add safe CLI adoption of existing copies. No replicated Skill trees may be created under `packages/cli` or `packages/docs`, even as ignored or temporary build mirrors.

## Objective

The owner accepted the corrected design, plan, maintained PRDs, and one-phase backlog on 2026-09-09 and authorized implementation. They agree on source ownership, embedded offline delivery, exact adoption review, Store recovery, and proof.

The backlog acceptance gate is satisfied. All implementation tasks remain pending at this documentation-only package commit. W20 and W21 remain paused.

## Governing Invariant

`docs/prd/` describes the product contract. Put current requirements inline in the existing owners. Keep implementation sequencing here and in work; preserve material prior contracts only in standardized, non-normative requirement history. No new PRD, archive, or wholesale PRD rewrite is needed.

## Coordinate Decision

- Coordinate: `W19 R5`
- Classification: `revision`
- Evidence: The owner selected a further W19 interrupt after R3 Store ownership and R4 asset/Persona recovery. This work resolves the retained D-005 delivery choice and extends the existing Skill lifecycle, rather than creating a new wave.

## Maintenance Inputs

| Input | Role and confidence |
| --- | --- |
| Owner-approved direction and [design](../../designs/2026-09-09-first-party-skills-and-managed-adoption.md) | Corrected package and backlog accepted on 2026-09-09; implementation authorized, tasks pending. |
| `.agents/skills/preflight/`, `software-factory/`, and `human-experience/` | Existing source intent to preserve; portability changes and complete file inventories still need implementation proof. |
| `packages/docs/template/.make-docs/agentics/skills/naive-uat/` | Existing thin UAT adapter to promote without changing its workflow authority. |
| `packages/skills/` and the first-party registry | Existing three Skills and declaration model; runtime/package delivery changes remain unimplemented. |
| [PRD 08](../../prd/08-skills-catalog-and-distribution.md), [PRD 28](../../prd/28-shared-agentics-installation-and-harness-exposure.md), [PRD 38](../../prd/38-global-store-and-project-state.md) | Existing product owners for selection, installed exposure, and Store-only state. |
| [D-005](../../prd/03-open-questions-and-risk-register.md#d-005-skills-delivery-diverges-from-earlier-bundled-payload-expectations) | Delivery decision is now bundled first-party payloads; evidence and implementation closure remain open. |

## Phase Map

| File | Purpose |
| --- | --- |
| [01-skills-and-managed-adoption.md](01-skills-and-managed-adoption.md) | One implementation phase with three ordered stages and a finite proof map. |

## Candidate Decision Matrix

| Candidate | Decision | Existing owner and reason |
| --- | --- | --- |
| Seven first-party entries, portable independent payloads, bundled resolution | `update-existing` | PRD 08 owns Skill inventory, selection, source trust, and distribution. |
| Compiled CLI embeds registry-declared bytes directly from the sole source; no replicated payload trees or first-party fallback | `update-existing` | PRDs 16 and 10 own package/runtime boundaries and package proof. |
| Reviewed adoption and later shared/native lifecycle | `update-existing` | PRD 28 owns installed exposure and ownership; PRD 38 owns durable intent and recovery. |
| Adoption/review flags and truthful review output | `update-existing` | PRD 39 owns public grammar and equivalent human/machine meaning. |
| Portable Skills route deterministic work through CLI/shared core | `update-existing` | PRD 25 owns that boundary; no Skill-local state or workflow engine. |
| Retire the template's UAT authoring tree | `update-existing` | PRD 06 owns template content and source separation. |
| Maintainer installed CLI adoption proof | `update-existing` | PRD 09 owns dogfood work and its authorized public CLI path. |
| Stable UAT Skill name, optional selection, shared workflow | `update-existing` | PRD 46 owns the thin adapter boundary; remove the temporary P7-only delivery qualification. |
| General command navigation | `link-only` | PRD 07 can route readers to PRD 39 without duplicating flag policy; repair only a direct contradiction if found. |
| Plugin product, mandatory Skills, workspace rename, new UAT policy | `none` | Explicitly outside the chosen boundary. |

## Existing PRDs To Update

| Owner | Sections and current change | Preserved authority |
| --- | --- | --- |
| [08 Skills](../../prd/08-skills-catalog-and-distribution.md) | Inventory, source/trust policy, selected-Skill model, UAT boundary, validation: seven bundled entries and independent optional use. | Alternate-manifest trust and effective `all`/`none` semantics. |
| [16 Package Runtime](../../prd/16-package-runtime-and-deployment-boundaries.md) | Package payload/deployment requirements: embedded first-party bytes work without checkout/network; actual-disk checks reject duplicate trees and empty mirror roots. | One CLI product and deployment boundary. |
| [28 Shared Installation](../../prd/28-shared-agentics-installation-and-harness-exposure.md) | Ownership and lifecycle safety: reviewed adoption, preservation, both scopes/native methods. | Installed shared roots and optional native exposure. |
| [38 Store](../../prd/38-global-store-and-project-state.md) | Required mutation intent, backup references, ownership-only transition, pending state/recovery. | Global authority and graceful optional capture. |
| [25 CLI/MCP](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md) | Skill/CLI boundary: reuse shared lifecycle behavior and portable references. | No duplicated deterministic policy. |
| [39 Commands](../../prd/39-cli-command-model-and-operation-registry.md) | Setup/adoption grammar, digest binding, invalid combinations, output and errors. | Existing setup and setup-skills paths. |
| [06 Templates](../../prd/06-template-contracts-and-generated-assets.md) | Authoring/source boundary: no UAT Skill author tree in docs template after promotion. | Optional system resources and valid installed payloads. |
| [09 Maintainer](../../prd/09-dogfood-and-maintainer-operations.md) | Build/package proof before recipe and reviewed public adoption of the real three copies. | Upstream-first work and owner-controlled installation. |
| [10 Release Proof](../../prd/10-packaging-validation-and-release-reference.md) | Package contents, offline isolated tests, native exposure, old-source upgrades. | Publication remains a separate authorized action. |
| [46 UAT](../../prd/46-naive-end-user-acceptance-testing.md) | Adapter distribution: canonical `packages/skills/naive-uat/` and stable optional CLI delegation. | Tester qualification, evidence, anti-coaching, and gate rules. |

## Requirement History and Shared Records

For each materially changed owner, add a `2026-09-09 — W19 R5` history entry with the affected section, previous contract, replacement, rationale, and this design/plan as source. Preserve prior three-entry/remote/P7-only statements as history, not active exceptions.

Update the PRD index and D-005 navigation. D-005 records that the bundled choice is settled and remains open only for implementation/proof. Reconcile directly related Q-001/Q-007 wording without changing third-party trust. Keep W20/W21 pause navigation explicit. No implementation history or evidence is fabricated during drafting. A planned evidence checklist may be created with results explicitly pending.

## Output Contract and Ownership

- Design: `docs/designs/2026-09-09-first-party-skills-and-managed-adoption.md`.
- Plan: this overview and one phase file.
- PRDs: existing owners above, with current requirements and non-normative history.
- Backlog: `docs/work/2026-09-09-w19-r5-first-party-skills-and-managed-adoption/00-index.md` plus one `01-skills-and-managed-adoption.md` phase.
- Evidence: the backlog's `evidence.md` may start as a planned checklist with implementation results pending. Retained results use numbered acceptance-case sections and only needed supporting captures.

Use disjoint document workers: design/plan and template/command/proof owners; core Skill/package/exposure/Store owners; shared register/navigation and backlog assembly. Maintain design → plan → PRD → backlog order. The coordinator integrates and checks boundaries; one worker writes each shared file. Use jdocmunch for docs and jcodemunch for source, refresh missing/stale indexes first, then use a bounded direct fallback only if refresh fails.

## Dependencies and Validation

R3/R4 are the state and layout baseline. PRD maintenance follows this plan before work generation. The backlog derives from the maintained PRDs and traces each design promise to a task, numbered acceptance case, phase, and evidence source. Keep implementation tasks unchecked until their work and required evidence are complete.

Validate links, frontmatter, Human Experience Intent, follow-on routing, candidate coverage, owner/history placement, task shape, and the one-phase gate. Independently review the assembled package for unsafe adoption gaps and unsupported completion claims. See the [phase proof map](01-skills-and-managed-adoption.md#verification-and-human-review) for implementation evidence; it is planned evidence, not a result.

## Intended Follow-On

- Route: `prd-generation`
- Next step: Maintain the existing PRDs from this plan, then generate the one-phase work backlog.
- Why: Product owners must carry the settled behavior before implementation tasks are derived.
- Coordinate Handoff: Carry W19 R5 into requirement history and work. The owner accepted the corrected backlog on 2026-09-09 and authorized code work after the package commit. W20 and W21 remain paused.
