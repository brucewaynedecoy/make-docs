# Deferred Obligation Contract

## Purpose

Use this contract for accepted future product outcomes that cannot be completed in the current scope but must remain durable, visible, and routed.

Deferred obligations are product authority, not implementation scratch notes. They preserve required future work without turning every idea, risk, or rejected option into a tracked obligation.

## Canonical Register

The canonical register lives in `docs/prd/03-open-questions-and-risk-register.md` under a fixed `## Deferred Obligations` section.

Every record uses a stable heading of the form `### O-001 <title>`. IDs are append-only, never renumbered, never reused, and remain valid when owner, coordinate, status, or links change.

## When To Create An Obligation

Create an `O-###` record only when accepted authority establishes a required future outcome that must survive the current scope.

Do not create an obligation for:

- optional ideas;
- rejected alternatives;
- unresolved questions that do not yet establish owed work;
- ordinary implementation notes;
- future automation possibilities that remain explicitly optional.

## Required Record Fields

Every obligation record includes:

| Field | Requirement |
| --- | --- |
| `ID` | Stable `O-###` identity matching the heading |
| `Title` | Short product-language title |
| `Status` | `Active`, `Deferred`, `Fulfilled`, `Cancelled`, or `Superseded` |
| `Summary` | Concise statement of the owed future outcome |
| `Source authority` | PRD, design, plan, work, or finding links that establish or materially change the obligation |
| `Owner` | Durable owner authority responsible for future completion or disposition |
| `Target coordinate` | Concrete future coordinate or explicit owner-routed target |
| `Future trigger` | Concrete condition that activates the obligation when it is not immediately runnable |
| `Dependencies` | Blocking authorities, work, platforms, or approvals |
| `Acceptance exit criteria` | Evidence required to treat the obligation as fulfilled |
| `Related requirements and findings` | Owning requirements plus any linked finding or scenario refs |
| `History / disposition note` | Concise reason when status becomes terminal or materially rerouted |

## Status Semantics

| Status | Meaning |
| --- | --- |
| `Active` | Required future work is accepted and currently actionable or awaiting immediate routing |
| `Deferred` | Required future work is accepted but awaits its stated trigger, dependency, or owner-ready coordinate |
| `Fulfilled` | Exit criteria were met and the authority chain now records completion |
| `Cancelled` | Product authority explicitly removed the requirement and recorded why it is no longer owed |
| `Superseded` | A newer obligation replaced this one; the replacement `O-###` must be linked |

Terminal statuses require a concise rationale. `Superseded` must link the replacement record. `Cancelled` must cite the authority that removed the requirement.

## Authority Chain And Backlinks

Obligations link bidirectionally while active:

- the obligation links every source that establishes or materially changes it;
- active PRDs, plans, work phases, scenarios, findings, and history entries link back to the `O-###` when they consume it.

Do not create a second obligation register in plans, work, scenarios, or history. Those surfaces route the canonical record; they do not replace it.

## Orphan Audit

Phase closeout includes a non-persona orphan audit. The audit checks whether accepted future outcomes, deferred findings, valid future-trigger `none` decisions, or scope-narrowing claims are fully routed.

An orphan audit does not replace:

- guide or playbook coverage;
- PRD reconciliation;
- validation;
- naive UAT;
- accessibility or other manual testing.

A phase with an unresolved orphan does not claim capability completion.

## Completion Language

Use exact status language:

- `Phase complete` means the current phase finished its approved scope.
- `Capability complete` means no accepted required outcome for that capability remains active, deferred, blocked by missing routing, or otherwise owed.

A phase may be complete while capability status remains partial. Do not collapse those states.

## Repository And Operational State Boundary

Repository-canonical:

- obligation identity and meaning;
- owner, trigger, target, dependencies, and exit criteria;
- links to requirements, findings, scenarios, work, and history.

Operational or machine-local:

- audit progress;
- sign-off progress;
- local validation evidence;
- raw notes that do not change authority meaning.

The documentation-first round does not require a new runtime schema, store table, or CLI operation.

## Compatibility And Migration

Adopt obligations conservatively:

- preserve existing `D-###`, `Q-###`, and `R-###` identities;
- create `O-###` prospectively when accepted authority proves future work is owed;
- do not rewrite archives;
- stop for review when active content is modified or ambiguous.

A deferred question or risk becomes an obligation only when accepted authority establishes a required future outcome.

## Non-Goals

- No automatic conversion of every deferred item into `O-###`.
- No second canonical register.
- No runtime automation requirement.
- No database or Global Store schema requirement.
- No hidden completion claims without explicit authority maintenance.
