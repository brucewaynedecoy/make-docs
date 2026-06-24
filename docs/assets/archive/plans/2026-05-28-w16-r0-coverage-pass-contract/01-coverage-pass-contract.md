# Phase 01 — Coverage Pass Contract

## Purpose

Author `docs/assets/references/coverage-pass-contract.md`, the single source
for the decision-frame mechanics shared by every closeout-style coverage pass.
It owns mechanics only — never the content of any guide, playbook, PRD, or
history record.

## What to build

- **Pass skeleton** (seven steps): load authority → enumerate candidates → one
  verdict per candidate → prefer update-over-create → reconcile session history
  (idempotency rule) → validate → closeout summary.
- **Base verdict semantics (the spine):** `create`, `update-existing`,
  `link-only`, `none`. A semantic spine, not a strict superset —
  pass-specific sets *map onto* it.
- **Named coverage surfaces** with their verdict sets:
  - Guide / playbook (persona-scoped): `create` / `update-existing` /
    `link-only` / `none`, each carrying target persona(s).
  - History (non-persona): `create` / `update-existing` / `link-only` /
    `none`.
  - PRD reconciliation (non-persona): `prd-change-doc`→create;
    `baseline-change-note`, `risk-register-update`, `index-only`→update-existing;
    `link-only`; `none`.
  - Testing / UAT (non-persona): `create` / `update-existing` / `link-only` /
    `none`, including the "no test warranted → record why" case.
- **Verdict-vs-persona-target separation:** persona set sourced from
  configuration; never hard-coded; legacy Developer/User mapping applies before
  any configuration exists.
- **History idempotency rule:** one normative paragraph (mechanics deferred to
  `history-record-contract.md`) plus the dual-role note — history is both
  skeleton step 5 of every pass and a standalone coverage surface.
- **Verdict-and-reason rule:** every candidate records a verdict and a reason;
  `none` is first-class and never silent.
- **Validation checklist** (prose; any future enforcement is CLI-side).
- **"Defining a new coverage pass" recipe** and explicit **non-goals**.

## Router wiring

- Link the contract from `docs/assets/references/AGENTS.md`.
- Replace the inline verdict lists in `docs/CLAUDE.md` and
  `docs/guides/AGENTS.md` with pointers to the contract.

## Acceptance criteria

- The file exists and defines the skeleton, the spine, the four surfaces with
  their mappings, the verdict-vs-persona separation, the idempotency rule, the
  verdict-and-reason rule, the validation checklist, and the non-goals.
- The routers link it and no longer restate the verdict list inline.
- Referenced content contracts are unchanged except optional back-links. No
  placeholders remain.

## Dependencies

Foundation phase. The anchor (02), playbook (03), and starter prompts (06)
cite this contract.
