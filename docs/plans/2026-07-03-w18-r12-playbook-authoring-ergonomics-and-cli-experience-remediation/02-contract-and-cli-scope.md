---
title: "W18 R12 Phase 2: Contract and CLI Scope"
kind: "plan"
status: "draft"
coordinate: "W18 R12"
---

# W18 R12 Phase 2: Contract and CLI Scope

## Purpose

Settle the implementation scope the delta backlog must encode, grounded in design decisions D0–D12 and the three resolved user decisions, so the backlog phases are decision-complete.

## Fixed Decisions the Backlog Must Encode

### Contract v2 (D1–D5, clean break)

- One authoritative fenced `playbook` block in `## Dependencies` with top-level key `dependencies`; a `playbook` fence whose top-level key does not match its section is an error.
- Field constraints per design R-DEP-2, including `probe` matching the executable-token pattern when present and defaulting to `id`; `used_by` a typed YAML list; `source` and `fallback` prose.
- The v1 parser surface is deleted: `packages/cli/src/playbook/parser/dependency-table.ts` is removed and replaced by a dependencies-block parser; the frontmatter and headings modules accept only the v2 keys and spellings; the schema version accepts only the v2 identifier.
- Pointed diagnostics, not legacy support: each removed form fails with an error diagnostic naming the v2 replacement shape. No PB-DEP-008/PB-FM-009/PB-DOC-010 deprecation warnings exist.
- Upstream-first authoring: `packages/docs/template/.make-docs/contracts/system/playbook-contract.md` and `packages/docs/template/docs/assets/playbooks/agent/make-docs-lifecycle.playbook.md` are the authored sources; the repo's `.make-docs/contracts/system/playbook-contract.md` and `docs/assets/playbooks/agent/make-docs-lifecycle.playbook.md` are re-seeded dogfood copies; dogfood-only authoring guides update in place downstream.
- In-repo migration is total: no v1 document survives in fixtures, shipped assets, or templates.

### Compiler and hints (D9)

- `executableToken` scraping of `source` in `packages/cli/src/operations/playbook-packaging/materialization.ts` is removed; `cli` and `package-manager` checks probe `probe` (or `id` when absent); `skill`/`plugin` kinds use `probe` as the manifest reference identifier.
- Regression fixtures include `source` prose that does not begin with the binary name, including the UAT repro (`git` with source `system install of git`).
- `withHint` in `packages/cli/src/operations/playbook/progression.ts` gains subject scoping; every mutating transition (`advance`, `gate`, `resume`, `close`) retires hints whose subject reached a resolved status; `close` retires all guidance hints; any run-state serialization change is additive and migrated per the store's schema-versioning rules.

### CLI experience (D6–D8, agent invariance)

- Render layer at the `printJson(invocation.value)` seam in `packages/cli/src/run/cli.ts`, keyed by the existing unused `OperationRenderMode` in `packages/cli/src/operations/types.ts`; TTY → human text, `--json` → byte-identical full result, non-TTY default → unchanged JSON, MCP untouched.
- Grammar: `run package plan --output <path>`, `run package preview`, `run package write` (writes; `--write` retired with guidance naming the new grammar), and `run package ship` surfacing the registered `package.ship` composite.
- `package.ship` semantics: plan → preview → write through the operation core; abort at the first stop, unresolved proposal, or warning with guidance naming the granular command to continue with; classification write; all fail-before-write rails preserved; zero-unresolved plans proceed without human judgment.
- Ergonomics: `--run-id` prefix resolution with ambiguous-prefix failure listing candidates, `--last`; `--repo-root` defaulting to the nearest `.make-docs/manifest.json` ancestor and `--store-root` to the real global store; a packaging-preconditions config block with explicit flags always overriding; a targeted process-warning filter for the SQLite ExperimentalWarning only.

## Explicit Non-Goals

- Q-015 (Clack interactive mode) and Q-016 (full TUI) stay deferred in the register.
- No operation result schema or MCP tool schema changes beyond additive fields and flags.
- No change to any fail-before-write stop, precondition, digest check, or ownership guard.
- No redefinition of progression semantics, packaging pipeline internals, registry materialization rules, or conformance evidence (design R-SCOPE-1).

## Implementer Freedoms

The design fixes outcomes, not internals: parser module organization for the dependencies block, render-layer text wording and layout, the ship operation's internal composition style, the config block's exact key names under the packaging preconditions namespace, and warning-filter implementation are open, provided every R-* requirement and test bar holds.
