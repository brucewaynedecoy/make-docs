---
title: "W20 R0 P4 Human Experience Standard and Intent Evidence"
kind: "work"
status: "active"
coordinate: "W20 R0 P4"
source:
  type: "prd"
  path: "docs/prd/49-human-experience-standard-and-intent.md"
---

# W20 R0 Human Experience Standard and Intent Evidence

## Current Summary

The accepted P4 result makes each Human Experience Review conclusion affect completion in a clear way. It also adds fixture proof that a technically passing result can still have a material human gap.

The final automated checks passed. The focused Human Experience run passed 2 files and 51 tests. The full CLI run passed 83 files and 1,291 tests. The two Human Experience contract copies are byte-identical. Their SHA-256 value is `8deafedb6282a8cc82d1acfd90e28f17818e989661d41a558eb5fdb6fcf4e7ff`.

The final independent P4 review found no defect after the repairs. It confirmed that tasks t1 through t34 are complete. It also confirmed that R-033 stays open and that P4 does not claim P5 proof.

P4 is closed at commit `df0080a`. This acceptance closes the bounded P4 phase only.

P5 is active. Tasks t1 through t18 have evidence. The current packed CLI proves clean installation, stable offline resource reads, and update preservation with a constructed legacy fixture. It does not prove an actual released `0.1.0` installation.

P5 is not ready for acceptance. Stage 1 requires proof that real agents can reach the standard. No such result exists. Current PRD 20 requires `connectionMethod` in the support tuple. The conformance code still uses two retired output fields and has no `connectionMethod`. PRD 43 still names the older tuple. This blocks current Codex and Claude Code results. The strict P5 order also blocks later stage acceptance.

## Phase Identity and Environment

- Base revision: `564b0354688fb0c5f9682f48c44eba5fa742572d`.
- Final P4 identity: commit `df0080a`.
- Commit state: P4 is accepted and closed. The commit is present in the current `make-docs-v2` history.
- Repository state: local `make-docs-v2` branch in the Make Docs maintainer repository.
- Environment: macOS with the repository test workspace.
- Identity limit: this report binds the P4 result to `df0080a`. Later status corrections do not change that implementation identity.

## Phase 4 Review

### Conclusion and Completion Rules

Claim: The Human Experience contract uses only `satisfied`, `material gap`, and `insufficient evidence`. It states the completion effect for each conclusion.

Surface reviewed: the upstream [Human Experience contract](../../../packages/docs/template/.make-docs/system/contracts/human-experience-contract.md#evidence-and-completion) and its [dogfood copy](../../../.make-docs/system/contracts/human-experience-contract.md#evidence-and-completion).

Check: The reviewer compared the new conclusion table in both files. A byte comparison also found no difference.

Observation: `satisfied` supports only the reviewed claim. `material gap` blocks complete status for the affected claim. An obligation can preserve an owed outcome but cannot resolve the gap. `insufficient evidence` supports no completion claim and calls for the smallest useful added testing activity.

Conclusion: `satisfied` for the P4 conclusion-effects claim.

Reviewer: Factory implementation worker, P4 closeout documentation worker, and independent P4 reviewer. The final independent review found no defect after repairs.

Review limit: This is an agent review of contract text and file parity. It does not prove a person's lived ease, confidence, understanding, or joy.

### Failure-Revealing Fixture

Claim: Complete Human Experience Intent fields and passing automated checks cannot hide an incoherent human path.

Surface reviewed: the synthetic [P4 review design](../../../packages/cli/tests/fixtures/human-experience-propagation/p4-review/design.md), [result transcript](../../../packages/cli/tests/fixtures/human-experience-propagation/p4-review/result.md), [review evidence](../../../packages/cli/tests/fixtures/human-experience-propagation/p4-review/evidence.md), [O-901 obligation example](../../../packages/cli/tests/fixtures/human-experience-propagation/p4-review/obligation.md), and [propagation test](../../../packages/cli/tests/human-experience-propagation.test.ts).

Check: The focused test validates the complete design form. Technical success comes from `result.md`. The human conclusions come from `evidence.md`. The test keeps these two results separate and requires the completion claim to stay blocked.

Observation: The synthetic result exposes a relationship only through raw IDs. It gives current state and history the same visual form. It returns an error code and retry token without a valid example, correction, or safe next action.

| Promise | Evidence | Observation | Conclusion | Reviewer | Reviewer limit | Disposition |
| --- | --- | --- | --- | --- | --- | --- |
| `HX-REL-01` | [`E-P4-01` synthetic result transcript](../../../packages/cli/tests/fixtures/human-experience-propagation/p4-review/result.md) | The relationship is only `rel_7f20 -> rec_9c11`. No product name or relationship meaning is visible. | `material gap` | Independent fixture reviewer | One synthetic transcript. No operator attempt occurred. | The fixture records remediation and repeated affected proof as the example path. |
| `HX-STATE-01` | [`E-P4-01` synthetic result transcript](../../../packages/cli/tests/fixtures/human-experience-propagation/p4-review/result.md) | The operator cannot tell current state from history. | `material gap` | Independent fixture reviewer | One synthetic transcript. No visual-accessibility result is closed. | The complete [synthetic bounded caveat](../../../packages/cli/tests/fixtures/human-experience-propagation/p4-review/evidence.md#synthetic-bounded-caveat-disposition-example) records no owner approval or real follow-on. |
| `HX-REC-01` | [`E-P4-01` synthetic result transcript](../../../packages/cli/tests/fixtures/human-experience-propagation/p4-review/result.md) | The invalid input has no valid example, correction, or safe next action. | `material gap` | Independent fixture reviewer | The fixture has no working resumable-upload path. | The complete [synthetic O-901 obligation](../../../packages/cli/tests/fixtures/human-experience-propagation/p4-review/obligation.md) is valid only inside the fixture. It creates no real obligation, owner, coordinate, or future work. |

Conclusion: `satisfied` for the P4 failure-revealing-proof claim. The three `material gap` conclusions belong to the synthetic result. They are not findings against an installed Make Docs product.

Reviewer: Factory implementation worker, P4 closeout documentation worker, and independent P4 reviewer. The final independent review found no defect after repairs.

Review limit: The evidence is synthetic. It is not P5 installed-product proof or lived-human proof.

### Evidence Reuse and Boundaries

Claim: One suitable activity can support automated proof and Human Experience Review without merging their rules or creating a duplicate verdict.

Check: The fixture uses `E-P4-01` for technical assertions and for the three human observations. It keeps Accessibility Review separate from the four core testing types. It also includes valid `indirect`, `none`, and `not-needed-now` cases.

Observation: The fixture keeps executor, scope, gate, and conclusion rules separate. A `not-needed-now` result creates no obligation. The valid indirect case ties reliability and wait evidence to manual replay risk. The valid none case proves unchanged public results, errors, steps, and timing.

Conclusion: `satisfied` for the P4 evidence-reuse and boundary claim.

Reviewer: Factory implementation worker and P4 closeout documentation worker.

Review limit: The specialist escalation is fixture proof only. It does not activate or close a real W20 accessibility review.

## Phase 5 Partial Implementation

### Package and Installed-Project Result

Claim: The reviewed Human Experience resources reach a clean packed install and a supported existing-project update without loss of user content.

Check: The packed smoke builds the CLI from `packages/docs/template/`. It compares raw bytes across upstream, generated CLI, dogfood, packed, and installed copies for both stable resources. It runs installed-origin list and read operations with Node network entry points blocked. It also constructs a legacy transfer fixture from the current clean install. The fixture removes project identity, uses a `0.1.0` package-version marker, replaces one managed router with an accepted older body, and adds historical user content.

Observation: The clean install returned installed-machine provenance and exact bytes for `make-docs://system/contract/human-experience-contract.md` and `make-docs://system/reference/human-experience.md`. The legacy update reported 23 current managed files and one `AGENTS.md` update. The current router body, user prefix, user suffix, and historical design bytes matched their expected values after the update. The missing-resource result named the unavailable URI and gave a repair action.

Conclusion: `satisfied` for P5 package, installed-resource, constructed-update, preservation, and offline-recovery task claims.

Reviewer: Factory implementation worker, independent package-proof reviewer, and coordinator verification.

Review limit: This result does not prove an actual released `0.1.0` distribution, current harness conformance, prospective agent adoption, or a lived human outcome. Stage 1 is not accepted until real-agent reach is proved.

### Supported-Agent Conformance Status

Current PRD 20 requires seven tuple parts: scenario, harness, connection method, surface, scope, model or provider, and runtime. Current code in `packages/cli/src/conformance/tuple.ts` still binds the older fields `outputKind` and `generatedOutputKind`. It has no `connectionMethod`. PRD 43 R-ING-2 also still names a six-part tuple. The current tuple registry has zero entries. The former packaging scenarios are retired.

Conclusion: `blocked`. No Codex or Claude Code result was run or recorded. No support claim is made. W19 R6 owns the PRD 20 `connectionMethod` change, but its implementation is not authorized. Its accepted PRD set does not include PRD 43, so that reconciliation has no current implementation authority. P5 does not expand into either change.

### Human Outcome and Adoption Status

P5 Stage 4 depends on Stage 3. The real-person exercise has not started. Human Experience Review is `insufficient evidence` for P5 completion. The agent cannot certify lived human understanding or pleasure.

The prospective adoption matrix also remains open. No P5 history record or final requirement reconciliation is created while the phase is active.

### P5 Current Testing Decisions

#### Automated Implementation Testing

- Testing type: Automated Implementation Testing.
- Decision informed: Do the packed resources reach clean and constructed-update projects without content loss or a resource regression?
- Reason now: P5 changes package smoke and installed-resource tests.
- Product maturity: Documentation-first package candidate before real-agent conformance.
- Scope: The two changed test files, the focused 12-file matrix, default validation, package smoke, router check, changed-file path check, PRD and link validation, and diff check.
- Executor: Agent test runner.
- Gate effect: `blocking-claim-only` for the package and structural claims.
- Effort budget: One focused pass and one expanded pass after the material review repairs. The final assertion-only repair uses the affected local smoke. No release-grade test run.
- Stop condition: Stop after affected checks pass and independent review has no open defect. Rerun only after a related change or failure.
- Evidence retained: [package smoke](../../../scripts/smoke-pack.mjs), [installed-resource test](../../../packages/cli/tests/human-experience-resources.test.ts), this report, and the P5 phase record.
- Rerun trigger: A change to package projection, installed resources, update handling, router preservation, or the related tests.
- Decision: `selected`.

#### Performance Testing

- Testing type: Performance Testing.
- Decision informed: Can a quantitative performance result change the current P5 package decision?
- Reason now: P5 has no accepted speed, load, wait, cost, or resource target.
- Product maturity: Documentation-first package candidate before real-agent conformance.
- Scope: Current package and resource-delivery behavior.
- Executor: Not assigned.
- Gate effect: `not-applicable`.
- Effort budget: None.
- Stop condition: Stop while no accepted quantitative outcome exists.
- Evidence retained: This current decision.
- Rerun trigger: An accepted quantitative outcome that can change a current decision.
- Decision: `not-needed-now`.

#### Guided Progress Review

- Testing type: Guided Progress Review.
- Decision informed: Can guided review change the current package-delivery decision before a real P5 result exists?
- Reason now: Stage 3 has not produced the actual result that P5 must offer for review.
- Product maturity: Package proof before real-agent and real-human execution.
- Scope: Current package-delivery result only.
- Executor: Not assigned. No review is active.
- Gate effect: `not-applicable` for the current package decision.
- Effort budget: None until a meaningful result exists.
- Stop condition: Stop without an empty review.
- Evidence retained: This current decision.
- Rerun trigger: A real P5 result exists. Offer the optional review then.
- Decision: `not-needed-now`. This current decision creates no obligation.

#### Unassisted Goal Testing

- Testing type: Unassisted Goal Testing.
- Decision informed: Can an unassisted attempt answer a material current P5 uncertainty now?
- Reason now: No current runnable P5 human surface exists.
- Product maturity: Package proof before real-agent and real-human execution.
- Scope: Current package-delivery result only.
- Executor: Not assigned. No qualified human run is selected.
- Gate effect: `not-applicable`.
- Effort budget: None.
- Stop condition: Stop while no runnable surface or material human uncertainty exists.
- Evidence retained: This current decision.
- Rerun trigger: Reconsider after Stage 3 if a material human uncertainty remains.
- Decision: `not-needed-now`. No `NUAT-###` scenario or obligation exists.

Human Experience Review remains a separate acceptance lens. It is not a fifth testing type. Its current P5 conclusion is `insufficient evidence`.

### P5 Check Results

Environment: macOS, Node `v24.19.0`, npm `11.17.0`, branch `make-docs-v2`, base HEAD `ec2f27bd9301219a0a3ece2fb86d58e679d1b759`.

| Check | Result | Limit |
| --- | --- | --- |
| Focused CLI matrix | Passed: 12 files and 204 tests | Covers resources, propagation, providers, routers, lifecycle, and update behavior. It is automated proof only. |
| `npm run validate:defaults` | Passed: 2 files and 51 tests | Covers default consistency and template links. |
| Expanded `npm run smoke:pack -- --verify-dogfood` | Passed | Covers package build, packed contents, clean install, constructed legacy update, offline stable resource access, npm, pnpm, Bun, and dogfood router parity. Registry access needed an approved network rerun. The final assertion-only repair then passed the affected local package smoke. |
| `npm run test:smoke-harness` | Passed: 13 tests | Covers the package-smoke runner. It is not agent-conformance evidence. |
| Instruction routers | Passed | Managed router structure passed. |
| PRD authority and Markdown links | Passed: 39 PRDs, 541 Markdown files, 199 structured files, and 1,050 links | Covers repository PRD authority and links. |
| Changed-file path hygiene | Passed | Covers the P5 Markdown files only. The full repository scan has 3,025 older findings and no changed files. |
| `git diff --check` | Passed | No whitespace error was reported. |
| Independent package review | Passed after three P1 or P2 repairs and one final P2 repair | The review corrected the update baseline, full-router assertion, network block, and recovery assertion. It cannot prove lived human experience. |

Exact command record:

```text
npm test -w packages/cli -- --run tests/human-experience-resources.test.ts tests/human-experience-propagation.test.ts tests/resource-identity-provider.test.ts tests/resource-provider-integration.test.ts tests/resource-resolver.test.ts tests/tool-directory.test.ts tests/system-assets.test.ts tests/p4-projection-lifecycle.test.ts tests/managed-block.test.ts tests/router-paths.test.ts tests/lifecycle.test.ts tests/p3-operation-surfaces.test.ts
npm run validate:defaults
npm run smoke:pack -- --verify-dogfood
npm run smoke:pack:local
npm run test:smoke-harness
bash scripts/check-instruction-routers.sh
node --import tsx packages/cli/src/index.ts project path-hygiene validate --target . --path docs/work/2026-08-28-w20-r0-human-experience-standard-and-intent/00-index.md --path docs/work/2026-08-28-w20-r0-human-experience-standard-and-intent/05-delivery-conformance-and-delta-closeout.md --path docs/work/2026-08-28-w20-r0-human-experience-standard-and-intent/evidence.md --format json
node --import tsx packages/cli/src/index.ts run prd authority validate --target-root .
git diff --check
```

Durable evidence paths are [scripts/smoke-pack.mjs](../../../scripts/smoke-pack.mjs), [packages/cli/tests/human-experience-resources.test.ts](../../../packages/cli/tests/human-experience-resources.test.ts), this central report, and [the P5 phase record](05-delivery-conformance-and-delta-closeout.md).

### P5 Finding and Disposition

The support-tuple mismatch is a material blocker. The disposition is a partial P5 status with no broad support claim. W19 R6 owns the PRD 20 change, but PRD 43 reconciliation remains an authority gap. No `O-###` obligation is created while P5 remains active and no future outcome has owner acceptance. R-033 stays open because the required real-human proof has not run.

## Current Testing Decisions

### Automated Implementation Testing

Testing type: Automated Implementation Testing

Decision informed: Do the changed contract and fixtures enforce the P4 conclusion, evidence, and finding rules without a relevant resource regression?

Reason now: P4 changes shared contract text and the propagation fixture suite.

Product maturity: Documentation-first P4 implementation candidate before P5 delivery proof.

Scope: Focused propagation and Human Experience resource tests during work, plus one expanded integration pass after the full P4 candidate became stable.

Executor: Agent test runner.

Gate effect: `blocking-claim-only`. A failure blocks only the P4 claim that the failed check covers.

Effort budget: One focused run after the affected changes and one expanded closeout pass. Do not run release-grade testing.

Stop condition: Stop after the focused checks and one justified expanded pass succeed, unless a failure or changed blast radius gives a reason to expand.

Evidence retained: The focused, consistency, expanded, defaults, parity, scan, decision-shape, link, diff, and review results in [Check Results](#check-results).

Rerun trigger: A change to the Human Experience contract, propagation fixtures, related validation, or a material test failure.

Decision: `selected`.

### Performance Testing

Testing type: Performance Testing

Decision informed: Can quantitative performance evidence change a current P4 product or implementation decision?

Reason now: No P4 outcome states a speed, load, wait, cost, or resource target.

Product maturity: Documentation-first P4 implementation candidate.

Scope: P4 contract, fixture, and review behavior.

Executor: Not assigned.

Gate effect: `not-applicable`.

Effort budget: None.

Stop condition: Stop while no accepted quantitative P4 outcome exists.

Evidence retained: This `not-needed-now` decision.

Rerun trigger: Reconsider only if implementation adds an accepted quantitative outcome that can change a current decision.

Decision: `not-needed-now`.

### Guided Progress Review

Testing type: Guided Progress Review

Decision informed: Can a Guided Progress Review change the current P4 contract or fixture decision?

Reason now: P4 has no meaningful real installed result. An offer now would be empty and cannot change the current P4 decision.

Product maturity: P4 synthetic proof before P5 installed-product delivery.

Scope: Current P4 contract and fixture work only. The prepared path below is not active.

Executor: Not assigned. No review is active.

Gate effect: `not-applicable`.

Effort budget: None for P4.

Stop condition: Stop without an empty P4 review.

Evidence retained: This `not-needed-now` decision and the non-activated review-path design below.

Rerun trigger: None in P4. P5 owns its own installed-result review decision under P5 authority.

Decision: `not-needed-now`. No review was run or declined. This result creates no obligation.

#### Prepared Review Path

Status: Non-activated design from t15 through t17. It is not a selected P4 activity. P5 can reassess it under P5 authority.

Safe starting state: Use a disposable installed project that P5 prepares and can remove. Do not use a project that holds the owner's work.

Goal: Identify the named subject, its relationship, its current state, and the next safe action without reading raw internal data.

1. Open the installed product through the public P5 path.
2. Run or view one normal result that has a subject, relationship, and state.
3. State what is current and what action is safe next.
4. Open optional detail and confirm that exact IDs remain available.
5. Give feedback about the result that was easy or hard to understand.

Result worth noticing: Human meaning appears before machine detail. Current state and the next action remain clear.

Optional troubleshooting: If the installed environment is not ready, stop with `blocked-by-environment`. Do not repair project data during the review.

Cleanup: Use the P5 cleanup step to remove the disposable project or restore its prepared state.

### Unassisted Goal Testing

Testing type: Unassisted Goal Testing

Decision informed: Can an unassisted attempt answer a material current P4 human-experience uncertainty that other evidence cannot answer well enough?

Reason now: The synthetic fixture already exposes the three current P4 gaps. An unassisted attempt cannot change that fixture decision.

Product maturity: P4 synthetic proof before P5 installed-product delivery.

Scope: The P4 conclusion and failure-revealing rules only.

Executor: Not assigned. No qualified human run is selected.

Gate effect: `not-applicable`.

Effort budget: None.

Stop condition: Stop without a ceremonial run.

Evidence retained: The synthetic fixture review and focused automated result.

Rerun trigger: None in P4. P5 makes its own decision under P5 authority.

Decision: `not-needed-now`. There is no `NUAT-###` scenario and no obligation.

## Check Results

| Check | Current result | Observation | Limit |
| --- | --- | --- | --- |
| Focused Human Experience tests | Passed: exit 0, 2 files, and 51 tests | The changed fixture behavior and Human Experience resource checks passed. | This is focused automated proof. |
| Consistency tests | Passed: exit 0, 1 file, and 39 tests | The consistency boundary passed. | This is the nearest consistency check. |
| Full CLI expanded pass | Passed: exit 0, 83 files, and 1,291 tests | The stable P4 candidate passed the one justified expanded run. | One warning said `DeprecationWarning: something else is deprecated`. The warning was non-blocking. No release-grade matrix ran. |
| `validate:defaults` | Passed: exit 0, 2 files, and 51 tests | The default-resource validation passed. | This does not replace P5 installed-product proof. |
| Contract byte comparison | Passed | Upstream and dogfood contract copies have SHA-256 `8deafedb6282a8cc82d1acfd90e28f17818e989661d41a558eb5fdb6fcf4e7ff`. | This does not prove a packaged or installed P5 copy. |
| Old-term and finding-ID scans | Passed: no matches | Exact scans found no old conclusion term or old finding ID in the affected P4 surface. | This is a text check, not a human judgment. |
| Testing-decision shape | Passed: 24 rows | Each row has 12 cells, a real `Decision informed` question, and a separate `selected` or `not-needed-now` value. | This proves record shape and separation only. |
| Changed-file link validation | Passed: 8 Markdown files and 0 link errors | The validator checked the changed P4 and new-fixture Markdown files. | The full repository has 345 older broken-link records outside this P4 scope. |
| `git diff --check` | Passed | No whitespace error was reported for the stable P4 candidate. | Run it again if the candidate changes. |
| Independent P4 review | Passed: no findings after repairs | The reviewer confirmed all prior defects were resolved, t1 through t34 are complete, R-033 stays open, and P4 and P5 claims stay separate. | This was an agent review. It cannot prove a lived human result. |

## Findings, Risk, and Follow-On

- The three fixture gaps are intentional failure-revealing cases. Their dispositions include a complete synthetic bounded caveat and a complete synthetic O-901 obligation. They create no real obligation, owner assignment, coordinate, or future work.
- No `NUAT-###` scenario is active.
- Specialist Accessibility Review stays separate. The fixture escalation does not create a real W20 specialist finding.
- `R-033` stays open. P4 proves that the review rules can reject correct form with a poor human path. P5 still owns shipped, installed, agent, and real human proof.
- P4 is accepted, closed, and committed at `df0080a`. This does not claim publication, release, or P5 installed-product proof.

## Coverage-Pass Dispositions

| Candidate | Verdict | Reason |
| --- | --- | --- |
| Central P4 evidence report | `create` | P4 retains review and acceptance evidence, so the coverage contract requires this report. |
| W20 backlog index | `update-existing` | It links this report, records the P3 and P4 commit states, and shows P4 as closed. |
| P4 phase record | `update-existing` | It records task status, decisions, evidence, limits, closeout, and the P5 handoff. |
| `R-033` | `update-existing` | A bounded P4 note can add the synthetic proof while the risk stays open. |
| PRD 49 and PRD 50 | `none` | Current authority already owns the P4 rules. The implementation does not change a normative requirement. |
| History record | `none` | No separate P4 history record was required. Commit `df0080a`, this evidence report, and the phase closeout preserve the accepted result. |
| New capture folders | `none` | The existing synthetic fixtures are enough for the P4 claim. No capture folder is needed. |
