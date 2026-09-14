---
title: "Phase 3: Static Harness Adapters and Conformance Retirement"
kind: "plan"
status: "active"
coordinate: "W19 R6 P3"
source:
  type: "design"
  path: "../../designs/2026-09-14-static-harness-adapters-and-conformance-retirement.md"
---

# Phase 3: Static Harness Adapters and Conformance Retirement

## Purpose

Correct the product authority that caused P2 to build and test an obsolete Playbooks conformance path.

Then keep the useful setup and access work. Replace the production gate with static Codex and Claude Code adapters. Remove old conformance code and assets only after a traced use review.

## Fixed Decisions

- P2 is superseded because its conformance authority is invalid for the current product.
- PRDs 20, 43, and 44 leave the active PRD set.
- Git history preserves the retired PRDs. No archive copy is part of P3 without separate approval.
- PRD 28 owns static harness adapters.
- PRDs 07 and 39 own setup flow and command behavior.
- PRD 25 owns Store access and caller identity.
- PRD 24 owns project harness intent.
- PRD 50 owns proportionate tests and review.
- PRDs 10 and 16 own package and release checks.
- Setup does not use a tuple registry, scenario result, provider, model, or runtime value to select a method.
- Codex MCP, Codex narrow command rules, and Claude Code MCP are the required native paths.
- Claude Code permission rules may stay unavailable when narrow Store access cannot pass.
- Direct resource reads stay Store-free.
- P3 does not add Pi, broad home access, per-harness Skill sets, or a new Store design.

## Candidate Decision Matrix

| Candidate | P3 decision | Current owner or action |
| --- | --- | --- |
| Setup screen order, flags, dry-run, JSON, and non-TTY behavior | `update-existing` | PRDs 07 and 39. |
| Project `harnessIntegrations` intent | `update-existing` | PRD 24. |
| Store access, caller identity, and Store-free reads | `update-existing` | PRD 25. |
| Static Codex and Claude Code adapters | `update-existing` | PRD 28. |
| Skill selection and ownership | `link-only` | PRD 08. The shared project-wide choice does not change. |
| System resource placement | `link-only` | PRD 17. |
| Package contents and installed checks | `update-existing` | PRDs 10 and 16. |
| Global native config receipts and drift | `update-existing` | PRD 38. |
| Test and review standard | `update-existing` | PRDs 48 and 50. Remove old PRD 20 dependency. |
| Adapter admission and future harnesses | `update-existing` | PRD 30. Replace dynamic conformance admission with source-owned adapter review. |
| Agentics package boundary | `inspect-then-update` | PRD 36. Remove only Playbooks conformance dependencies. |
| Harness conformance claims | `remove-from-active` | Retire PRD 20. Move valid safety rules to PRDs 25 and 28. |
| Conformance scenarios and kits | `remove-from-active` | Retire PRD 43. Keep no setup authority. |
| Conformance lab sessions and results | `remove-from-active` | Retire PRD 44. Replace required proof with direct product checks. |
| PRD index | `update-existing` | PRD 00 must show the corrected active set. |
| W19 R6 risk | `update-existing` | Replace D-033's registry correction with the P3 authority correction and close proof. |

## Stage 1 — Reset Authority and Trace Dependencies

1. Inventory all active and historical references to PRDs 20, 43, and 44.
2. Classify each reference as current authority, current support text, or historical record.
3. Remove PRDs 20, 43, and 44 from the active PRD set.
4. Move every valid current rule to one named owner. Do not copy whole obsolete sections.
5. Update PRD 00 and D-033.
6. Update active guides, package docs, tests, and work records that still name the old authority.
7. Preserve historical meaning. Use Git history as the default record.
8. Run PRD authority, path, and link checks before product edits.

Stage 1 closes only when no active product rule depends on the retired PRDs.

## Stage 2 — Correct the Product and Tests

1. Record every P2 change as `keep`, `rework`, or `remove`.
2. Keep the unified setup service, method flags, dry-run parity, JSON output, YAML preservation, native writers, receipts, recovery, Store-free reads, caller identity, and bounded rules when they meet the new authority.
3. Rework `setup-system.ts` and `harness-access/contract.ts` around static adapters.
4. Remove registry lookup, tuple matching, result promotion, provider or model facts, runtime facts, and scenario facts from setup.
5. Trace the wider conformance tree. Remove only code, scripts, commands, tests, fixtures, and package copy steps that have no current owner.
6. Replace tuple tests with direct product contract tests.
7. Preserve the Store session gate, retry limits, ownership rules, and pending-operation behavior.
8. Stop if native Codex or Claude Code behavior differs from the accepted static adapter contract.

Stage 2 closes only when production setup has no import or data dependency on the retired conformance engine.

## Stage 3 — Prove Installed Behavior and Human Experience

1. Pack the candidate without conformance registry or lab assets.
2. Use disposable Codex and Claude Code homes and disposable projects.
3. Prove Codex MCP, Claude Code MCP, Codex narrow command rules, and direct resource reads.
4. Test Claude Code permission rules only as a separate safe-access check. Keep the method unavailable if narrow access fails.
5. Run the installed setup matrix for fresh, current, partial, no-method, unsupported, drifted, blocked, failed, recovered, and repeat states.
6. Prove exact native file ownership, cleanup, and user-content preservation.
7. Run the full CLI, Store, package, MCP, PRD, path, link, and diff checks.
8. Prepare the Human Experience packet for the six P3 promises.
9. Require the owner or maintainer to record each observation, conclusion, limit, and next action.

Stage 3 closes only after direct product proof and Human Experience Review pass.

## P3 Human Experience Promises

| Promise | Owner | Required evidence |
| --- | --- | --- |
| Setup finds known installed harnesses without tuple questions. | PRDs 07, 28, 39 | Installed setup transcript and detection tests. |
| Setup shows only product-owned safe methods and their effects. | PRDs 07, 28, 39 | Review screen tests and real native files. |
| MCP works for Codex and Claude Code with caller identity. | PRDs 25 and 28 | Disposable real-harness read and write checks. |
| Codex rules grant only the named narrow operations. | PRDs 25 and 28 | Allowed and rejected sandbox checks. |
| Project and user-owned native config stay intact across apply, repeat, drift, and recovery. | PRDs 24, 28, 38, 39 | Preservation, idempotence, and failure tests. |
| Resource reads work without Store or special harness access. | PRDs 17, 25, 39 | Store-absent, locked, unreadable, and unsafe checks. |

## Hard Close Rules

P3 cannot close until all rules pass:

1. PRDs 20, 43, and 44 are absent from the active PRD index.
2. Every valid current rule from those PRDs has one current owner or an explicit removal decision.
3. No production setup path imports or loads the old conformance engine.
4. The package contains no registry, lab result, transcript, scenario, or maintainer bootstrap asset.
5. Static Codex and Claude Code adapters pass direct contract tests.
6. Codex MCP, Codex narrow rules, and Claude Code MCP pass in disposable real harnesses.
7. Store-free reads pass without a Store session or caller identity.
8. The installed setup matrix passes with preserved user content and no repeat-write loop.
9. All automated product and documentation checks pass.
10. Human Experience Review passes all six promises.

P3 stays open for a material gap or insufficient evidence.

## Risks and Remaining Gaps

- The P2 diff mixes useful setup code with obsolete conformance code. File-level deletion can remove valid work.
- PRD 20 has many links. Most links are historical. A broad text replacement can corrupt the project record.
- PRDs 30, 36, 48, and 50 may contain useful current rules next to old Playbooks terms. They need a requirement-level review.
- Static adapters can drift when a harness changes its native format. Release checks must test the current format.
- Codex narrow rules still depend on a trusted native launch fact. If Codex cannot provide one, that method cannot ship.
- Claude Code permission rules may not provide narrow Store access. P3 permits that method to remain unavailable.
- Existing installed packages will learn new adapter rules only through a package update. This is expected for source-owned support.
- Human Experience Review needs a person. Automated agents cannot supply lived acceptance.

## Implementation Authority and Exclusions

This P3 authority package is documentation only. It does not authorize P3 implementation.

Later implementation must preserve unrelated worktree changes. It must not stage, commit, install into the real user home, publish, or release without separate authority.

It must use only disposable homes and projects for real-harness work.
