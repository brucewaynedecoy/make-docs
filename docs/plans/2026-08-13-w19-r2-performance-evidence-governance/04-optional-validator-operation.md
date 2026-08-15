---
title: "W19 R2 Phase 4: Optional Validator Operation"
kind: "plan"
status: "draft"
coordinate: "W19 R2 P4"
---

# W19 R2 Phase 4: Optional Validator Operation

## Purpose

Describe the separately gated boundary for a future deterministic TypeScript validator. This phase is optional. Its presence in the plan does not authorize PRD 25/39 edits, code, tests, CLI/MCP exposure, or execution.

## Admission Gate

Before any validator work:

1. the owner explicitly accepts the need for the validator after documentation-first use produces evidence;
2. PRD maintenance decides whether the operation belongs in PRD 39 and the shared TypeScript boundary in PRD 25;
3. the registry admission rule confirms the operation reports deterministic facts rather than product judgment;
4. a separate finite backlog scope names exact modules, fixtures, and supported documents; and
5. CLI and MCP exposure, if any, derive from one operation core and result schema.

If these conditions are not met, this phase is `not-authorized` and Phase 5 validates documentation-only delivery.

## Deterministic Scope

The validator may:

- inventory candidate numeric units, rates, percentiles, percentages, resource quantities, relative comparisons, and absolute performance language;
- validate `PERF-###` syntax, append-only identity, profile version, required fields, links, owner/location by target class, approval, expiry, budget, stop rules, and outcome vocabulary;
- compare a declared fingerprint to referenced prior evidence and report unchanged status;
- detect work acceptance criteria stricter than linked product authority;
- check profile-to-work/result/finding traceability and evidence references; and
- emit complete structured diagnostics with stable codes and remediation text.

It may not decide applicability, maturity, target value, statistical method, representative environment, comparability, user impact, severity, acceptable trade-off, waiver approval, obligation fulfillment, support scope, or support-claim promotion.

## Operation Shape

- One TypeScript operation core owns parsing, validation, and a structured result.
- Registry metadata declares read-only behavior, inputs, outputs, permissions, and failure modes.
- Human CLI rendering and MCP tool output project the same complete result without separate business logic.
- Missing, unreadable, unsafe, or escaping targets fail closed with typed diagnostics.
- The operation does not execute benchmarks, rewrite files, choose remediation, or loop on results.

## Fingerprint Handling

The validator may compute or compare a fingerprint only from declared fields. It reports `unchanged`, `materially-changed`, or `not-comparable` with reasons. It cannot authorize a rerun. A newly authorized expiry/release qualification event remains external authority and permits one bounded qualification execution regardless of an unchanged report.

## Fixtures And Tests

Use bounded representative fixtures for:

- each target class and canonical owner;
- missing/duplicate/invalid identities;
- unsupported stricter work criteria;
- expired evidence and unchanged fingerprints;
- valid single-event requalification versus prohibited repeat;
- missing evidence, broken links, and unsafe target roots;
- CLI/MCP result parity if those projections are admitted; and
- explicit non-decisions where human/owner judgment is required.

Do not create a benchmark harness, universal profile library, sample-count defaults, environment matrix, or performance test suite.

## Acceptance

- The separate owner gate and PRD admission are evidenced.
- The operation remains read-only and deterministic.
- CLI/MCP outputs derive from one core and preserve complete diagnostics.
- Judgment boundaries are tested as non-capabilities.
- Unchanged detection cannot authorize execution or retry.
- Focused operation, registry, router, path, and parity tests pass.
- No benchmark is run and no product target is changed.

## Handoff

Return to Phase 5 with either a validated optional operation or an explicit documentation-only disposition. No release or support claim follows automatically from either outcome.
