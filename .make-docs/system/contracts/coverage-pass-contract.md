# Coverage Pass Contract

## Purpose

Use this contract for closeout-style coverage passes that decide whether a completed change needs follow-on documentation, testing, PRD reconciliation, or history updates.

The contract owns the pass mechanics only: the skeleton, verdict vocabulary, surface mappings, Persona targeting, backlog evidence reports and acceptance-case captures, history idempotency, and validation checklist. It does not replace the detailed content contracts for guides, PRDs, work outputs, system resources, or history records.

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

### Guide And System-Resource Coverage

Guide and system-resource coverage uses the verdict spine directly: `create`, `update-existing`, `link-only`, or `none`.

Guide verdicts carry a configured Persona target when the guide is Persona-bearing. System-resource verdicts carry one of the four peer types: contract, prompt, reference, or template. A system resource does not become Persona-bearing unless its owning contract says so.

The Persona target is separate from the verdict. `create` answers what to do. The Persona target answers who the artifact is for.

Guide content remains governed by [guide-contract.md](guide-contract.md). System-resource content remains governed by [system-resource-contract.md](system-resource-contract.md) and its type-specific authority.

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

Never use `create` for a document that describes an addition, enhancement, revision, removal, migration, reconciliation, or other editorial operation. PRD content remains governed by [prd-change-management.md](../references/prd-change-management.md) and [output-contract.md](output-contract.md).

### Testing Coverage

Keep each testing type as a separate current decision. Consider automated implementation testing, performance testing, guided progress review, Unassisted Goal Testing, specialist accessibility testing, visual regression, conformance, and owner or architecture review.

Each testing decision records:

- `Testing type`;
- `Decision informed`;
- `Reason now`;
- `Product maturity`;
- `Scope`;
- `Executor`;
- `Gate effect`;
- `Effort budget`;
- `Stop condition`;
- `Evidence retained`; and
- `Rerun trigger`.

Use the artifact verdict spine only for the files or links that support a testing decision. A test decision is not reduced to `create`, `update-existing`, `link-only`, or `none`.

Activate Unassisted Goal Testing only when an unassisted attempt can answer a material current human-experience uncertainty, or when explicit current authority requires it. Otherwise record `not-needed-now`, the reason, and the evidence that already answers the uncertainty. Do not create a scenario or durable obligation only for this result.

Each activated run selects one eligible configured Persona and defaults to canonical `user` when none is supplied. Persona selection controls audience framing and evidence routing. It does not prove executor qualification.

Use one run result: `clear`, `friction`, `blocked`, or `invalid-run`. Keep the default gate effect advisory. Use a blocking effect only when explicit current authority names the result and the blocked outcome or claim.

Reuse unchanged evidence. Expand the test boundary only after a failure signal, a cross-cutting change, an explicit support claim, or accepted risk.

## Acceptance-Case Evidence Retention

### Central Evidence Report

When a work backlog retains evidence for acceptance or review, create or update `<work>/evidence.md`. Here, `<work>` is the owning backlog directory under `docs/work/`, not an individual phase file. This written report is the main entry point for the evidence. A folder of captures, a list of links, or a bare pass/fail statement does not replace it. The report is required even when all supporting evidence already exists elsewhere and no new capture folder is needed.

Keep one central report for the backlog. Start with a short summary of the current findings. Group the detail by phase and acceptance-case ID, or by named review when no case applies. For each case or review, record:

- The claim or user goal being checked and the surface or behavior reviewed.
- The tested revision or package identity, the relevant environment, and any limits in identifying the tested build.
- The check performed, the result, and what the reviewer observed.
- The conclusion supported by those observations, the reviewer, the review limits, and any unresolved gaps or follow-up.
- Relative links to supporting files and relevant report sections where applicable. State which run supports the current conclusion.

Link the report from the backlog's `00-index.md`. Link the relevant report sections from each owning phase's acceptance or closeout record. Keep these links current as evidence changes. A detailed report inside a case folder is optional when it adds useful detail; link it from the central report and summarize its finding there.

Do not create an empty report when drafting a backlog or starting a phase. When no durable evidence record is needed, state the reason in the phase's acceptance or closeout record. A reason why no new capture is needed does not waive the report when existing evidence supports a retained acceptance or review finding.

### Supporting Captures

Keep new acceptance-case captures in `<work>/evidence/a<number>/`. Use the accepted case ID to choose the folder: case `A4` uses `evidence/a4/`; case `A12` uses `evidence/a12/`. The name `a4` is an example, not a fixed directory name.

Use stable `A<number>` IDs for acceptance cases. Each number must identify one case across the owning backlog, including all its phases. Keep existing IDs stable. Give a new case an unused number. Resolve duplicate IDs in the backlog before saving evidence for different cases to the same folder.

Create `evidence/` and a case folder only when new captures need to be kept. Do not create empty folders when drafting a backlog or starting a phase. Link existing evidence from the central report when that is sufficient. An accepted case can have a failed, blocked, or invalid result; retain those results when they help review or further work. Retention does not mean the case passed or the owner accepted the result.

For each retained case:

- Link useful captures from the case's section in the central report.
- Keep the prompt and context boundary, transcript, screenshots, file trees, output snapshots, or file hashes that support the claim. Select useful proof; do not require every capture type for every case.
- Preserve earlier evidence when a new run changes the result or tested build. Use named run subfolders within the same case folder when needed. State which run supports the current conclusion.
- Keep copied instructions inert. For example, save a captured `AGENTS.md` as `AGENTS.md.txt`, not as an active router file. Remove secrets and private material that the review does not need.

Link to evidence already owned by another contract instead of moving or duplicating it. This rule governs new backlog-owned captures. It does not require a bulk move of existing evidence.

The report and supporting files are review evidence, not Make Docs operation state. Keep authoritative installation, upgrade, migration, progress, and recovery state in the global Make Docs Store through the CLI. Do not create local state files or use the evidence report or folders as a fallback when the CLI or Store is unavailable.

## Persona Targets

Verdicts and persona targets are separate axes. A verdict says what coverage action to take; a target says which configured persona or audience receives that coverage.

Merge the built-in Personas with valid `.make-docs/config.yaml` overrides and custom entries. Missing or empty configuration keeps both defaults. Use persona slugs, not display labels, in machine-readable coverage output. The default configured target slugs are:

| Persona target | Primitive | Use for |
| --- | --- |
| `maintainer` | `maintainer` | Contributors, maintainers, integrators, operators, validation owners, and extension authors. |
| `user` | `user` | People or agents using the shipped product, reading task guidance, or adopting a workflow. |

Either primitive can be human or agent; actor identity does not select a Persona. `agent` is not a primitive. Custom persona targets retain their slug and use only `user` or `maintainer` as their primitive. Custom persona targets use the same schema: `slug`, `label`, `description`, and `primitive`. Do not hard-code display labels in new contracts or prompts.

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
10. Testing output preserves separate type decisions, finite budgets, stop conditions, and evidence reuse.
11. Each activated Unassisted Goal Test records one eligible configured Persona and a separately qualified executor.
12. Retained backlog evidence has a central `evidence.md` report with findings, supporting links, tested build and environment, reviewer, and review limits. The backlog index and relevant phase records link to it. This applies even when no new capture folder is needed. When no report is needed, the phase record states why.
13. New acceptance-case captures use the owning backlog's `evidence/a<number>/` path and stable case IDs. The central report links to them. Captured instructions are inert, and Make Docs operation state remains in the Store.

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

- This contract does not define guide content, PRD content, work backlog structure beyond evidence reports and acceptance-case captures, prompt syntax, or history-record fields.
- This contract does not require every pass to create an artifact.
- This contract does not hard-code future persona names.
- This contract does not enforce CLI behavior; future automation may validate the mechanics separately.
- This contract does not turn advisory coverage passes into release, merge, publish, or push gates.
