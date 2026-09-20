___
name: Performance Coverage
description: Inventories current performance candidates and records bounded governance decisions.
___

Inventory performance evidence needs for the current accepted work. Do not run a benchmark or change runtime state.

Before writing, read:

- `make-docs://system/contract/performance-evidence-governance.md`;
- `make-docs://system/reference/performance-evidence.md`;
- `make-docs://system/template/performance-evidence-profile.md`;
- the accepted PRD, plan, and work records for the changed surface; and
- the router for the target output directory.

Use the contract as the only reusable policy source.

## Bounded Inventory

Inventory only current candidates that can affect the accepted work or a current product decision. Include active numeric targets, relative regression claims, resource budgets, absolute performance words, current benchmark assets, and current evidence. Do not expand the inventory to unrelated history or future ideas.

For every candidate, record both axes:

1. Base maintenance action: `create`, `update-existing`, `link-only`, or `none`.
2. Performance applicability: `required-now`, `characterize-now`, `defer-required`, `not-needed`, or `reject-unsupported`.

Also record the qualification fields required by the contract. Give each decision a short reason that names the evidence or authority used. Do not skip a candidate silently.

For an applicable candidate, record one target class and its one canonical owner. Do not treat a plan or work guardrail as product authority. Do not turn a baseline into a threshold.

## Decision Questions

Ask a question only when the answer can change applicability, target class, canonical owner, supported scope, or execution authority.

Ask at most one grouped clarification round. Keep it to the unresolved decision fields. Do not ask for a preferred framework, sample count, environment, statistic, or target until accepted authority makes an executable profile necessary.

If authority remains missing after that round, record the missing authority and stop that candidate. Do not invent a target, owner, approval, `O-###`, `PERF-###`, environment, method, budget, or result.

## Progressive Output

Use the profile template for each recorded candidate.

- For `not-needed` or `reject-unsupported`, finish the applicability record and stop.
- For `defer-required`, link the accepted `O-###` and stop.
- For `required-now` or `characterize-now`, create or update a `PERF-###` profile only in its canonical owning record.

An executable profile must state its finite evidence budget and stop rules before any run. Reuse a current result when its fingerprint is unchanged. After a material change, route only affected checks. Stop at budget exhaustion or diminishing return.

## Closeout

Return a short table with each candidate, both decisions, target class or `none`, canonical owner, reason, and next record link.

Then state:

- files changed or `none`;
- profiles created or updated, with exact IDs;
- deferred obligations linked, with exact IDs;
- reused evidence;
- unresolved authority gaps;
- focused validation run; and
- the stop reason for the inventory.

Do not claim a performance result, product support, release readiness, or another proof mode from this coverage inventory.
