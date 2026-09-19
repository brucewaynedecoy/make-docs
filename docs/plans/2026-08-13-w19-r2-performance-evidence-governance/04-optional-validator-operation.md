---
title: "W19 R2 Phase 4: Dual-Path Performance Evidence Validation"
kind: "plan"
status: "draft"
coordinate: "W19 R2 P4"
---

# W19 R2 Phase 4: Dual-Path Performance Evidence Validation

## Purpose

Implement the owner-admitted Performance Evidence validation twin. One read-only deterministic TypeScript core projects through CLI and MCP. One canonical agent method remains available when the CLI is absent or unavailable and handles questions that require judgment.

This plan records product and execution authority. It does not authorize P4 implementation, staging, commit, push, benchmark execution, publication, release, or support promotion.

## Authority Gate

The owner admitted this direction on 2026-09-17. P4 implementation remains locked until:

1. PRDs 03, 25, 39, and 48, this plan, and the active work backlog contain the accepted contract;
2. focused PRD and documentation validation passes;
3. the decision-only authority changes have a separate reviewed commit;
4. the decision commit is recorded in the P4 phase-entry record; and
5. the owner gives separate P4 implementation authority.

The required sequence is P2, P3, P4, then P5. P5 cannot treat P4 as optional after this admission.

## Validation Twin

- The deterministic operation is `performance.evidence.validate`.
- Its canonical CLI is `make-docs run performance evidence validate --target-root <project>`.
- Its derived MCP tool is `make_docs_performance_evidence_validate`.
- One TypeScript core owns parsing, rule evaluation, diagnostics, and the structured result.
- The canonical agent method lives in the installed Performance Evidence Governance instructions and uses repository authority when the CLI is absent or unavailable.
- A stable rule catalog maps each rule to its fact-or-decision class, deterministic support state, agent instruction location, judgment need, diagnostic code, focused fixtures or tests, and parity mapping or explicit one-sided reason.
- An earned proof state is `validator-passed`, `agent-reviewed`, or `combined`. A failed, blocked, or refused deterministic result records its typed status and no favorable proof state. The proof state identifies the accepted evidence path. It does not certify the other path or prove a performance outcome.

## Deterministic Scope

The deterministic operation may:

- inventory candidate numeric units, rates, percentiles, percentages, resource quantities, relative comparisons, and absolute performance language;
- validate `PERF-###` syntax, append-only identity, profile version, required fields, links, owner and location by target class, approval, expiry, finite budget, stop rules, and outcome vocabulary;
- compare a declared fingerprint with referenced prior evidence and report the declared equality result;
- detect work acceptance criteria stricter than linked product authority;
- check profile-to-work, result, finding, waiver, obligation, and evidence traceability; and
- emit complete structured diagnostics with stable codes and remediation text.

It may not decide applicability, maturity, target value, statistical method, representative environment, comparability, user impact, severity, acceptable trade-off, waiver approval, obligation fulfillment, supported scope, or support-claim promotion.

## Agentic Scope

The agent method must:

- perform the mapped structural and traceability review from repository authority;
- apply judgment only where the rule catalog marks it as required;
- state the exact evidence, observation, conclusion, limit, and next action;
- preserve missing, invalid, expired, non-comparable, adjacent-mode, and unsupported states without favorable inference;
- state that the deterministic operation did not run when it was unavailable or not selected; and
- avoid writes, repair, benchmark execution, retry authorization, budget renewal, and hidden state.

The agent method may report a product question. It cannot answer an authority choice that the owner or owning PRD must make.

## Operation and Proof Shape

- Registry metadata declares read-only behavior, inputs, outputs, project access, and failure modes.
- Missing, unreadable, unsafe, or escaping target roots fail closed with typed diagnostics.
- Human CLI and MCP output preserve the same complete result without separate business logic.
- A deterministic pass and a completed agent review remain separately inspectable when the proof state is `combined`.
- No proof state changes a `PERF-###` outcome, target authority, waiver, obligation, phase gate, release result, installed-product result, or support claim.

## Fingerprint Handling

The deterministic operation may compute or compare a fingerprint only from declared fields. It reports `unchanged`, `materially-changed`, or `not-comparable` with reasons. It cannot authorize a rerun. A newly authorized expiry or release qualification event remains external authority and permits one bounded qualification execution regardless of an unchanged report.

## Fixtures and Tests

Use bounded representative fixtures for:

- each target class and canonical owner;
- missing, duplicate, or invalid identities;
- unsupported stricter work criteria;
- expired evidence and unchanged fingerprints;
- valid single-event requalification and prohibited repeats;
- missing evidence, broken links, and unsafe target roots;
- all five performance outcomes without treating proof state as outcome;
- deterministic and agent mappings, judgment-only rules, and explicit one-sided reasons;
- CLI and MCP result parity;
- installed agent-method availability; and
- changes to either twin without review of the mapped twin.

Focused tests must fail for unmapped changes, unexplained one-sided rules, CLI/MCP differences, missing installed instructions, false cross-certification, hidden writes, or output-triggered retries.

Do not create a benchmark harness, universal profile library, sample-count defaults, environment matrix, Store table, daemon, retry service, or performance test suite.

## Acceptance

- The decision-only authority commit and separate implementation authority are evidenced.
- The operation remains read-only, deterministic, and fail-closed.
- CLI and MCP derive from one core and preserve complete diagnostics.
- The canonical installed agent method works without claiming that the deterministic operation ran.
- The rule catalog maps both methods and records every one-sided reason.
- Proof states are honest and cannot substitute for an outcome or adjacent proof.
- Judgment boundaries are tested as non-capabilities.
- Unchanged detection cannot authorize execution or retry.
- Focused operation, registry, catalog, router, installed-resource, path, and parity tests pass.
- No benchmark runs and no product target changes.

## Handoff

Return to P5 only after P4 is implemented, independently reviewed, accepted, and separately committed. P5 then proves package delivery, installed agent fallback, deterministic CLI/MCP parity, rule-catalog integrity, proof-state honesty, and the absence of benchmark or support-claim expansion.
