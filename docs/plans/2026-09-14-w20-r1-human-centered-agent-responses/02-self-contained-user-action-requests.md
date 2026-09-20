# W20 R1 P2 Self-Contained User Action Requests

## Purpose

Close the Human Experience gap in which a reply gives correct internal state but does not give the user a complete request that they can understand and answer.

## Source Authority

The source authority is the owner's 2026-09-17 direction to add P2 to this W20 R1 package. The direction assigns the rule to the Human Experience authority. It excludes W19 R2 P3 performance rules.

PRD 49 remains the product owner for human-facing meaning, state, next actions, and progressive detail. PRD 15 remains the owner for short managed router discovery. No current PRD meaning changes in P2.

The Human Experience Contract must add this binding rule:

> When a reply asks the user to act, make the request self-contained. State what the user must do, why it is needed, whether it is required or optional, what work it blocks, where supporting detail is available, and what should happen after the action. Explain internal terms and identifiers. A link can provide detail, but the user must not need to open it to understand the request.

## Outcome

A material reply that asks the user to act gives the full meaning and action in the reply. A linked work record can supply audit detail. It cannot supply meaning that is missing from the reply.

The user can tell:

- what to do;
- why the action is needed now;
- whether it is required, optional, or a separate authorization;
- what work waits for it;
- where supporting detail is available; and
- what to return or expect after the action.

## Scope

### Included

- Add the binding rule to the upstream Human Experience Contract.
- Add a short checklist to the upstream Human Experience Reference.
- Add one weak-versus-useful example to the Reference.
- Add a final requested-action check to the upstream Execution Workflow.
- Add the plain-language next-step clarification to the upstream Output Contract.
- Audit the upstream `AGENTS.md` route and make no change unless a small routing correction is required.
- Dogfood the four changed resources into this maintainer repo.
- Generate the CLI template projection from the upstream template and verify the four projected resources.
- Add focused static checks, representative reply evidence, and Human Experience Review.
- Keep implementation, staging, and commit as separate gates.

### Excluded

- W19 R2 P3 performance rules, files, tests, or acceptance.
- A new response schema or fixed reply layout.
- A second Human Experience authority.
- A full router policy copy.
- A change to the meaning of PRD 49 or PRD 15.
- Broad lifecycle, template, or Skill changes.
- Release, publication, or push work.

## File Decisions

| Upstream source | Required P2 change | Dogfood duty | Generated projection duty |
| --- | --- | --- | --- |
| `packages/docs/template/.make-docs/system/contracts/human-experience-contract.md` | Add the exact binding rule for self-contained user action requests. | Copy to `.make-docs/system/contracts/human-experience-contract.md` through the existing dogfood route. | Generate `packages/cli/template/.make-docs/system/contracts/human-experience-contract.md` with `scripts/copy-template-to-cli.mjs` and compare bytes. |
| `packages/docs/template/.make-docs/system/references/human-experience.md` | Add the five-question checklist and a weak-versus-useful example. | Copy to `.make-docs/system/references/human-experience.md`. | Generate and compare the matching CLI template resource. |
| `packages/docs/template/.make-docs/system/references/execution-workflow.md` | Add the final check that a requested action is clear without another document. | Copy to `.make-docs/system/references/execution-workflow.md`. Preserve unrelated W19 R2 P3 hunks. | Generate and compare the matching CLI template resource. |
| `packages/docs/template/.make-docs/system/contracts/output-contract.md` | State that a route, coordinate, workflow term, or task ID does not replace a plain-language next step. | Copy to `.make-docs/system/contracts/output-contract.md`. | Generate and compare the matching CLI template resource. |
| `packages/docs/template/AGENTS.md` | Audit only. Add a small route correction only if current discovery does not reach the Contract and Reference for material replies. Do not copy the detailed rule. | Update root `AGENTS.md` only when the upstream router changes. Preserve all text outside the managed block. | Generate and compare `packages/cli/template/AGENTS.md` only when the upstream router changes. |

Do not author `packages/cli/template/`. It is generated from `packages/docs/template/` during the package build.

## Stage 1: Authority And Upstream Sources

Add the exact Contract rule. Keep it binding and short.

Add these five questions to the Reference checklist:

- What does the user need to do?
- Why is the action needed now?
- Is it required, optional, or a separate authorization?
- What work waits for it?
- What should the user return or expect afterward?

The weak example must rely on an internal route, coordinate, workflow term, task ID, or link. The useful example must state the action and meaning in plain language. It can link to the work record for exact files, evidence, and audit history.

Add one final check to the Execution Workflow. Add one plain-language rule to the Output Contract. Do not create a second response policy in either file.

## Stage 2: Dogfood And Generated Projection

Use the existing upstream-first dogfood route for the four resources. Prove raw-byte parity between each upstream file and its dogfood copy.

Run `node scripts/copy-template-to-cli.mjs` to generate the CLI template. Compare the four generated resource bytes with their upstream sources. Use the package smoke check to prove that the resources remain present in the packed CLI artifact.

The Execution Workflow files already contain unrelated W19 R2 P3 edits. Stop before P2 implementation if the live hunks cannot be separated. Do not stage or commit a W19 R2 hunk as part of P2.

## Stage 3: Evidence And Review

Use the existing Human Experience resource and propagation tests. Add focused assertions for the exact rule, all five checklist questions, the example boundary, the workflow final check, the Output Contract clarification, and the router no-change or bounded-correction result.

Review representative requests for:

1. required authorization;
2. optional user feedback;
3. an action that blocks only named work;
4. a request with a linked audit record; and
5. a request that includes an internal route, coordinate, workflow term, or task ID.

Human Experience Review must inspect the real example replies. It must record the promised human goal, surface, evidence, observation, conclusion, reviewer limits, and follow-up. Automated checks support this review. They do not prove lived human understanding.

## Stage 4: Separate Staging And Commit Gates

Implementation authority permits only the P2 implementation and focused validation. It does not authorize staging.

After implementation and review, present the exact P2 allowlist and request separate staging authority. After staging, inspect the staged diff and request separate commit authority. Read the current commit convention only before a commit is authorized.

## PRD Trace

| Requirement owner | P2 effect |
| --- | --- |
| PRD 49 `R-HX-04` and `R-HX-05` | Refines how a material reply presents a clear next action and progressive detail. |
| PRD 49 `R-HX-10` | Keeps the shared Human Experience authority discoverable from the router. |
| PRD 49 `R-HX-11` | Adds representative user-action requests to conformance evidence. |
| PRD 15 Human Experience Router Discovery | Preserves a short route and prevents policy duplication in `AGENTS.md`. |

## Validation

- The Contract contains the exact binding rule.
- The Reference contains all five checklist questions and one weak-versus-useful example.
- The useful example gives meaning and action without requiring the linked record.
- The Execution Workflow contains the final requested-action check.
- The Output Contract states that internal labels do not replace a plain-language next step.
- The upstream router is unchanged unless a small correction is proved necessary.
- Upstream and dogfood bytes match for every changed resource.
- Generated CLI template bytes match the upstream sources.
- The focused Human Experience resource and propagation tests pass.
- The packed CLI contains the changed resources.
- Human Experience Review records observations, conclusions, limits, and follow-up for each P2 promise.
- The final P2 diff contains no W19 R2 P3 change.
- No file is staged without separate staging authority.
- No commit is created without separate commit authority.

## Exit Gate

P2 can close only when the four rules and guidance changes agree, dogfood and generated projections match, focused checks pass, representative requests pass Human Experience Review, and the exact P2 allowlist contains no W19 R2 work.

P2 closeout does not authorize staging or commit.

## Intended Follow-On

- **Route:** `implementation-loop`
- **Next Prompt:** [Execution Workflow](../../../.make-docs/system/references/execution-workflow.md)
- **Why:** The accepted P2 phase needs implementation and focused validation before its separate staging and commit gates.
- **Coordinate Handoff:** Continue W20 R1 at P2. Keep W19 R2 P3 separate.
