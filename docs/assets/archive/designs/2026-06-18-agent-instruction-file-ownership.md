# Agent Instruction File Ownership Model

## Purpose

Decide how the make-docs CLI should own and maintain agent instruction files
(`AGENTS.md` and `CLAUDE.md`, at the repo root and inside `docs/`) so that
make-docs can keep its routing instructions current while preserving both a
consuming project's own instructions and make-docs's project-specific
maintainer instructions. This replaces the current all-or-nothing
overwrite/skip-all conflict model.

## Context

The instruction files are the routers that make agents behave correctly. They
are technically optional, but without make-docs's routing at the repo root,
agents must be steered by hand for every task — the failure mode observed
repeatedly while building the W16 lifecycle work.

Previously the CLI treated root `AGENTS.md`/`CLAUDE.md` as whole-file managed
assets, recorded whole-file hashes in `.make-docs/manifest.json`, and resolved
conflicts only by overwrite or skip-all (the W14 R2 review flow, PRD
`13-revise-cli-conflict-resolution.md`). Consequences:

- A consuming project's own root instructions cannot coexist with make-docs's;
  a conflict forces a binary choice.
- make-docs's own repo has no stable home for project-specific maintainer
  instructions (for example, the template-first dogfood rule). Placed in the
  rendered root file, they are an unstable local modification that conflicts on
  the next reconfigure — the gap surfaced while reconciling the W16
  dogfood/template split (risk register D-014).

Prior attempts and why they were abandoned:

- **Append on conflict.** Failed because, without a delimiter, later CLI updates
  could not relocate make-docs's own region to update it in place.
- **Content recognition** (detect make-docs's lines heuristically). Considered
  and rejected as fragile — user or agent edits corrupt the recognizable text.
- The team fell back to overwrite/skip-all as the only deterministic options.

The crucial distinction the prior attempts missed: *recognizing content* is
fragile, but a *delimited region* is deterministic. The append failure was the
absence of delimiters, not an inherent impossibility.

## Decision

Adopt a delimited-block ownership model where make-docs's required routing lives
directly in the shared root instruction block.

1. **Delimited managed block (ownership primitive).** make-docs maintains only
   the text between explicit markers (working form `<!-- make-docs:begin -->`
   and `<!-- make-docs:end -->`) in any shared instruction file. The CLI
   locates, replaces, and re-asserts that block deterministically; everything
   outside the markers is owned by the project or user and is never modified.
2. **Inline root routing.** The required make-docs routing lives directly inside
   the managed block in the root `AGENTS.md` and `CLAUDE.md`. The block must be
   complete enough to guide agents without following links, imports, or
   auxiliary `.make-docs/<harness>.md` instruction files.
3. **Harness parity by default.** The root `CLAUDE.md` block mirrors the root
   `AGENTS.md` block. Route-specific differences are allowed only when the route
   needs different behavior; make-docs routing must not depend on a Claude Code
   import or a Codex-only pointer.
4. **Block-level reconciliation.** The CLI tracks the managed block's hash in
   the manifest and reconciles at the block level: a user editing their own
   content never triggers a conflict; a missing block is re-inserted
   idempotently; an edited block is re-asserted or surfaced as a block-scoped
   review, never a whole-file conflict.
5. **Stable home for project-specific content.** Project-specific instructions
   live outside the marker block in the shared file. The CLI never touches them,
   and they do not ship to consumers. Consumer-facing make-docs routing, such as
   lifecycle routing, belongs inside the managed block rather than outside it.
6. **No auxiliary instruction imports.** Dedicated imported instruction files
   under `.make-docs/` are out of scope for this model unless a future design and
   PRD explicitly approve that product shape.

## Alternatives Considered

**Content recognition.** Detect make-docs's lines heuristically and update them
in place. Rejected — corruptible by user or agent edits; the original failure
mode.

**Overwrite / skip-all (status quo).** Rejected — forces a binary loss and
leaves no home for user or project-specific content.

**make-docs-wins relocation.** On conflict, rename the existing file, write
make-docs's file as canonical, and point back to the preserved one. Rejected as
the default: it inverts the reliability problem (the user's content now depends
on a followed pointer) and silently relocating a project's `AGENTS.md` is
surprising. Retained only as a last-resort fallback for a harness that will not
import or follow pointers.

**Dedicated managed instruction file.** Put the bulk of make-docs routing in
`.make-docs/AGENTS.md` and `.make-docs/CLAUDE.md`, then point or import to it
from the root block. Rejected: it creates hidden managed assets, makes Claude and
Codex root files diverge for convenience rather than product need, and omits
consumer-facing routing unless every harness reliably loads the auxiliary file.

**Harness-specific import optimization.** Use Claude Code `@` imports where
available while keeping a Codex pointer fallback. Rejected: harness capability
should not drive the installed product shape when the required routing is small
enough to fit directly in the managed block.

**Full system/custom assembly first.** Generate the file purely from a `system`
and a `custom` source now. Deferred, not rejected — it is the clean end state
but a larger build; the inline marker-block model delivers the ownership boundary
without introducing auxiliary instruction files.

## Consequences

**Positive:**

- make-docs's routing reliably reaches the agent, and updates stay clean at the
  block level.
- A consuming project's own instructions and make-docs's project-specific
  instructions both survive, closing the project-specific-instruction gap
  surfaced alongside D-014.
- Root `AGENTS.md` and `CLAUDE.md` remain easy to inspect and can mirror each
  other unless a future route-specific difference is required.

**Negative and risks:**

- Implementation complexity: block parsing, idempotency, and edge cases
  (missing or edited markers, multiple harnesses, greenfield writes, and
  migrating existing installs whose root files are verbatim renders).
- The managed block is larger than a one-line pointer or import, so the block
  content must stay concise and limited to root-level routing.
- The marker block is a small remaining corruption surface, bounded to the block
  and recoverable by re-assertion.
- A one-time migration is needed for existing installs, including removal of the
  W17 dedicated instruction files when they are still manifest-clean.

**Operational:**

- Touches the static asset catalog, managed-block reconciliation, conflict
  review flow, and manifest handling; the template ships managed blocks
  directly and no dedicated `.make-docs/<harness>.md` instruction source.
- This is a CLI and product-template change: implementation is authored under
  `packages/` first (the source of truth) and then dogfooded, per the
  template-first rule.

## Intended Follow-On

- Route: `change-plan`
- Next Prompt: [designs-to-plan-change.prompt.md](../../prompts/designs-to-plan-change.prompt.md)
- Why: this revises an implemented capability — the CLI's instruction-file
  rendering and conflict handling across PRD `05`, `07`, `08`, and the W14 R2
  conflict-resolution revision — so it feeds change planning against the active
  PRD namespace rather than a fresh baseline.
- Coordinate Handoff: relates to the W14 R2 CLI conflict-resolution lineage and
  the CLI instruction and asset surface (PRD `07`/`08`). Because this introduces
  a substantial new ownership model rather than a tweak to the existing flow,
  recommend a new wave (next available after W16); the planner should confirm
  the coordinate during plan review.
