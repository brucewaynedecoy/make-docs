# Performance Evidence Reference

## Purpose

Use this reference to understand the performance evidence workflow in plain language.

The [Performance Evidence Governance Contract](../contracts/performance-evidence-governance.md) owns the rules. The [performance coverage prompt](../prompts/performance-coverage.prompt.md) orders the inventory. The [performance evidence profile template](../templates/performance-evidence-profile.md) supplies the record shape.

## Qualify Before You Measure

Start with the decision, not the benchmark.

Ask what user or business outcome needs protection. Ask what decision the evidence can change. Then record the cost of failure, current product maturity, support scope, risk, reversibility, source authority, current baseline, owner, and lifecycle point.

This step can end with no measurement. `Not-needed` means evidence cannot change a current decision. `Reject-unsupported` means the proposed claim has no sound basis. `Defer-required` sends an accepted later outcome to one `O-###` record. These are complete governance results.

Only `required-now` and `characterize-now` can lead to an executable profile.

## Understand Target Classes

A target class says what authority the record has.

A `hard-product-requirement` is the only product target. It lives in the active PRD that owns the protected outcome. The owner must approve it.

An `engineering-guardrail` protects bounded engineering work. A `characterization-baseline` describes observed behavior and uncertainty. An `experiment-or-stretch` supports a bounded inquiry. These profiles live in accepted plan or work authority. They do not define product support.

A `deferred-required-outcome` stays in an `O-###` record until activation. An `unsupported-assumption` has no executable profile.

Characterization is not promotion. A measured baseline becomes a threshold only after the owner accepts the reason, trade-offs, comparison basis, and authority change. Product promotion needs PRD maintenance and explicit lineage.

## Keep One Profile Identity

Use one `PERF-###` ID for one protected outcome and workload. Keep that ID when details change. Increase `profile_version` for a meaningful change to the target, authority, scope, environment, workload, method, analysis, or outcome rules.

Use a new ID for a different outcome or workload. Bind each result to the exact ID, version, and source digest.

Lineage explains where a profile came from and what replaced it. Record promotion, predecessor, successor, supersession, and retirement links. This prevents an old result from looking current.

## Use Fingerprints For Comparison And Reuse

An evidence fingerprint identifies the exact profile, build, dependencies, configuration, environment, workload, fixture, instrument, and analysis method used for a result.

Matching fingerprints support direct comparison and reuse. A declared equivalence rule can support comparison when a controlled difference is known and justified. A silent environment or workload difference does not.

If the fingerprint is unchanged, use the current applicable result. Wanting another answer is not a reason to rerun.

If something material changed, rerun only the checks affected by that change. Keep valid unaffected evidence.

## Use A Finite Budget

Every execution has a fixed budget before it starts. The budget covers characterization passes, distinct correction attempts, review cycles, elapsed time, compute, and outside spend.

The budget ledger shows what authority supplied the budget. It also shows each attempt, affected checks, resources used, remaining budget, reused evidence, and the stop reason.

Stop when the budget ends. Stop when distinct attempts no longer change the decision. Stop when a possible gain is below the declared resolution or tolerance. Stop when the next attempt costs more than the remaining budget.

The next result can be `blocked`, `revise`, a scoped `fail`, or an owner decision. The budget does not grow by itself.

## Read Outcomes Carefully

`Pass` applies only to the exact profile version and supported scope. It also requires all protected constraints to remain intact.

`Fail` needs comparable and reproducible evidence of a valid miss. `Revise` means the decision record or method is not fit. `Blocked` means a required precondition is missing and proves neither pass nor fail. `Waived` means an owner accepts a bounded risk. A waiver is never a pass.

Findings keep the observed behavior, expected outcome, severity, reproducibility, scope, evidence, owner, disposition, expiry, and later result together. A task closure does not close a finding by itself.

Waivers need an exact scope, owner, approver, risk, end point, and review trigger. Link an `O-###` when future work remains owed.

## Expiry Does Not Authorize A Rerun

Evidence can expire after a material profile, build, environment, workload, scope, dependency, instrument, analysis, time, or release change. It remains useful history but no longer supports a current pass.

Expiry does not create a new budget. Requalification needs separate authority and a new finite budget.

When the fingerprint is unchanged, one authorized requalification event permits one bounded qualification execution. Then the new result is reused until another valid trigger and another explicit authorization.

## Keep Authority Failures Visible

Stop and report an authority gap when:

- a hard target has no active owning PRD or owner approval;
- a plan or work guardrail is presented as product authority;
- a baseline is used as a pass/fail threshold without promotion;
- two live records define the same target;
- a deferred outcome has no accepted `O-###`;
- a result lacks its exact profile version or digest;
- a comparison lacks a matching fingerprint or justified equivalence rule;
- an execution has no finite budget or stop rule;
- a waiver lacks an owner, approver, scope, or end point; or
- a rerun lacks a material change or separate requalification authority.

Do not fill these gaps with guessed values.

## Keep Proof Modes And State Separate

Performance evidence can support another review. It cannot replace automated tests, Guided Progress Review, Unassisted Goal Testing, Human Experience Review, accessibility review, installed-product proof, release validation, or support approval.

Repository records own product meaning. Project State or the Global Store can hold operational run state and evidence references. That state is a rebuildable aid. It is not product authority.
