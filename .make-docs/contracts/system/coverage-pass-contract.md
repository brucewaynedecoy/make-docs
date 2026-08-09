# Coverage Pass Contract

## Purpose

Use this contract for closeout-style coverage passes that decide whether a completed change needs follow-on documentation, testing, PRD reconciliation, or history updates.

The contract owns the pass mechanics only: the skeleton, verdict vocabulary, surface mappings, persona targeting, history idempotency, and validation checklist. It does not replace the detailed content contracts for guides, PRDs, work outputs, prompt starters, or history records.

## Pass Skeleton

Every coverage pass follows this seven-step skeleton:

1. Load the authority docs for the surface being checked.
2. Enumerate every candidate capability, behavior, workflow, artifact, or finding that may need coverage.
3. Assign one verdict to every candidate.
4. Prefer updating existing coverage over creating a new artifact when an existing artifact owns the topic.
5. Reconcile the session history record using the idempotency rule below.
6. Validate the changed or intentionally unchanged coverage.
7. Close the pass with a concise summary of verdicts, reasons, artifacts changed, validation run, and any remaining handoffs.

Do not skip a candidate silently. A candidate that needs no artifact still receives a `none` verdict and a reason.

## Base Verdict Spine

Coverage verdicts map to this shared spine:

| Verdict | Use when |
| --- | --- |
| `create` | A new artifact is warranted because no current artifact owns the topic. |
| `update-existing` | An existing artifact owns the topic and should be updated in place. |
| `link-only` | Existing coverage is sufficient, but discoverability improves through a pointer, related link, router entry, or handoff note. |
| `none` | No artifact or link change is warranted; record the reason instead of omitting the decision. |

The spine is semantic, not a required superset. Surface-specific verdicts may use different names when they map clearly to one spine verdict.

## Coverage Surfaces

### Guide And Playbook Coverage

Guide and playbook coverage is persona-scoped. Use the verdict spine directly: `create`, `update-existing`, `link-only`, or `none`.

Each verdict must carry target persona information when a persona-specific artifact could be affected. The persona target is separate from the verdict: `create` answers what to do, while the persona target answers who the artifact is for.

Guide content remains governed by [guide-contract.md](guide-contract.md). Future playbook content remains governed by the playbook contract or router that introduces it.

### History Coverage

History coverage is not persona-scoped. Use the verdict spine directly: `create`, `update-existing`, `link-only`, or `none`.

History records remain governed by [history-record-contract.md](history-record-contract.md). This surface decides whether the pass needs a history breadcrumb; it does not redefine history filename, frontmatter, heading, or link rules.

### PRD Reconciliation Coverage

PRD reconciliation is not persona-scoped. Use the verdict spine directly: `create`, `update-existing`, `link-only`, or `none`.

The governing invariant is that `docs/prd/` describes the current authoritative shape of the product and never the editorial operation used to change that authority.

- Use `update-existing` when an existing PRD owns the changed requirement, when its non-normative requirement history needs a material prior contract recorded, or when the active index or risk register needs maintenance.
- Use `create` only when completed work establishes a coherent, wholesale new capability, subsystem, or product boundary with no suitable existing PRD owner.
- Use `link-only` when current product authority is sufficient but a navigation or related-authority pointer improves discoverability.
- Use `none` when no PRD, risk-register, index, or link change is warranted; record why the completed work implements or confirms existing authority.

Never use `create` for a document that describes an addition, enhancement, revision, removal, migration, reconciliation, or other editorial operation. PRD content remains governed by [prd-change-management.md](../../references/system/prd-change-management.md) and [output-contract.md](output-contract.md).

### Testing And UAT Coverage

Testing and UAT coverage is not persona-scoped. Use the verdict spine directly: `create`, `update-existing`, `link-only`, or `none`.

Use `create` when the work warrants a new manual-test scenario, runnable validation command, or acceptance script. Use `update-existing` when an existing scenario or validation note should be revised. Use `link-only` when existing automated or manual coverage is sufficient but should be surfaced. Use `none` when a manual or UAT pass would not add meaningful signal; record the reason, such as an internal-only docs change, behavior already fully covered by automated tests, or a scenario that is not practical to run manually.

## Persona Targets

Verdicts and persona targets are separate axes. A verdict says what coverage action to take; a target says which configured persona or audience receives that coverage.

Read the configured persona set and use persona slugs, not display labels, in machine-readable coverage output. The default configured target slugs are:

| Persona target | Primitive | Use for |
| --- | --- |
| `agent` | `agent` | Agents executing make-docs workflows, coverage passes, closeout, and lifecycle tasks. |
| `developer` | `maintainer` | Contributors, maintainers, integrators, operators, validation owners, and extension authors. |
| `user` | `user` | People using the shipped product, reading task guidance, or adopting a workflow. |

Custom persona targets use the same schema: `slug`, `label`, `description`, and `primitive`. Do not hard-code display labels in new contracts or prompts.

If both audiences need distinct coverage, record one verdict per target or one verdict with an explicit multi-target reason. Do not collapse different audience needs into one artifact merely because they share a source change.

## History Idempotency

Every coverage pass reconciles session history exactly once for the current work session. If no session history record exists yet, create one when the pass or closeout requires a breadcrumb. If a record for the current session already exists, update that same record instead of creating a duplicate. Follow [history-record-contract.md](history-record-contract.md) for filename, frontmatter, headings, table shape, and link rules.

History has a dual role: it is step 5 in every coverage pass skeleton, and it is also a standalone coverage surface when the pass is explicitly deciding whether history coverage is needed.

## Verdict And Reason Rule

Every candidate gets a verdict and a reason. The reason should name the evidence used, such as an existing guide owning the topic, a PRD already covering the requirement, a missing user-facing scenario, or a new artifact being warranted.

`none` is a first-class verdict. A silent skip is not a valid coverage decision.

## Validation Checklist

At close of pass, confirm:

1. The relevant authority docs were read.
2. Every candidate has exactly one verdict and a reason.
3. `create` decisions do not duplicate an existing owner artifact.
4. `update-existing` decisions preserve the owning artifact's contract.
5. `link-only` decisions use resolving relative links where applicable.
6. `none` decisions include the no-change rationale.
7. History idempotency was applied for the current session.
8. Changed docs have no unresolved placeholders such as `TODO`, `TBD`, or `{{...}}` unless the contract explicitly permits them.
9. Focused validation was run for the files touched by the pass, including `git diff --check` when files changed.

## Defining A New Coverage Pass

To define a new coverage pass:

1. Name the surface and the authority docs that govern its content.
2. State whether the surface is persona-scoped.
3. Define the pass-specific verdict set.
4. Map every pass-specific verdict to the base verdict spine.
5. State how the pass applies the history idempotency rule.
6. State the minimum validation expected before closeout.
7. Keep pass-specific content rules in the surface contract, not in this shared mechanics contract.

## Non-Goals

- This contract does not define guide content, PRD content, work backlog structure, prompt syntax, or history-record fields.
- This contract does not require every pass to create an artifact.
- This contract does not hard-code future persona names.
- This contract does not enforce CLI behavior; future automation may validate the mechanics separately.
- This contract does not turn advisory coverage passes into release, merge, publish, or push gates.
