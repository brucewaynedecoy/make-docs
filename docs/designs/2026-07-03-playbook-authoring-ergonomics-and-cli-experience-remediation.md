# Playbook Authoring Ergonomics and CLI Experience Remediation

## Purpose

This design defines the W18 R7/R8 UAT remediation round: a batched revision of the Playbook authoring contract for human ergonomics, a human-experience render and grammar layer for the `run playbook` and `run package` CLI surfaces, and the correction of the two functional defects the UAT confirmed. It exists because the 2026-07-03 hand-run user-acceptance pass against the built CLI (W18 R7 executed fully; W18 R8 executed through step 2.3) proved that the shipped system is functionally sound but optimized for its parser and its agent consumers at the expense of the human author and operator, and it surfaced one real generation defect and one state-hygiene defect along the way.

Three constraints frame everything below. First, agent behavior must not change: operation results, MCP tool output, and machine-readable CLI output stay byte-identical except for additive fields (an explicit user constraint, stated as R-INV-1). Second, the contract changes are batched into one clean v2 break: nothing built on the v1 contract was ever distributed, so the old forms are removed outright rather than deprecated, and the break happens exactly once (user-approved). Third, this round runs before W18 R9 conformance executes, because R9's evidence would otherwise bind to generated-package content and command spellings this round changes (user-approved sequencing; see D10).

## Context

The UAT produced three families of findings plus two deferred product directions.

**Functional defects.** F1: the generated `cli` and `package-manager` dependency-check scripts probe the first word of the dependency's `Source` column — `executableToken` in `packages/cli/src/operations/playbook-packaging/materialization.ts` — instead of the dependency `ID`. A dependency `git` with Source `system install` generates a check for a binary named `system`, which exits 1 despite git being installed. The root cause is structural: the probe target is machine meaning living inside prose, in direct tension with the playbook contract's own rule that narrative prose must never carry machine meaning. The unit fixtures missed it because their Source text happened to begin with the binary name. F2: `PlaybookRunState.resumeHints` accumulates forever — `withHint` in `packages/cli/src/operations/playbook/progression.ts` only appends, so hints from long-completed steps ("Delegated step `prepare` is waiting for its executor") persist through close and mislead any agent reading hints as current guidance.

**Contract ergonomics (C1–C3).** The authoring format is optimized for the parser, not the author. The `## Dependencies` Markdown table has positional columns that are error-prone to hand-author and stringly-typed prose cells — and F1 is the direct cost of that shape. The frontmatter keys `schemaVersion` and `workflowSchemaVersion` are long-winded. The required-section headings carry jargon and cognitive load, `## Inputs And Authority` and `## Workflow Contract` most of all.

**CLI experience (X1–X7).** One output channel serves two audiences, and the grammar mismatches intent. Every `run` and `run package` command dumps the full JSON operation result (`printJson` at the end of the dispatcher in `packages/cli/src/run/cli.ts`); the state echo grows monotonically with the evidence log (~200 lines by close), the capability snapshot paragraph repeats verbatim in every echo, and the humanly useful part — the execution report, the next hint — is buried or absent (X1, X7). `run package write` does not write without `--write`: the fail-before-write posture is PRD-mandated and correct, but the naming violates least surprise (X2). Extracting a plan for the write step requires jq surgery (X3). Run IDs are 24-character timestamps, an unexpected and unwieldy shape for an "ID" (X4). `--repo-root`/`--store-root` boilerplate rides on every command and `--precondition k=v` three times per write (X5). Node's SQLite ExperimentalWarning prints on every invocation (X6). Notably, `OperationRenderMode` already exists in `packages/cli/src/operations/types.ts` and is unused — the render seam was anticipated and never built.

**Deferred directions.** A Clack-based interactive mode for driving runs, and a full TUI over the store, run state machine, and packaging surfaces, are captured in the risk register as [Q-015](../prd/03-open-questions-and-risk-register.md) and [Q-016](../prd/03-open-questions-and-risk-register.md) and are explicitly out of scope here (see D11): an interactive mode built over the current grammar and output would wallpaper the problems this design fixes.

This repository is the Make Docs maintainer repo and a dogfood instance. The playbook contract, the shipped default Playbook, and any other Make Docs-owned resource this design changes are authored upstream in `packages/docs/template/` first and dogfooded downstream, per the maintainer dogfooding rule. The parser, validator, compiler, and CLI are ordinary source code under `packages/cli/`.

## Decision

### D0. Scope and Boundaries

This design owns exactly: the batched playbook authoring-contract revision (D1–D4), its parser/validator/compiler/template/guide ripple (D5), the CLI render layer and command grammar (D6–D7), the remaining CLI-experience corrections (D8), the defect corrections (D9), and the W18 R9 reconciliation obligation (D10).

R-SCOPE-1 (MUST NOT). The following are owned elsewhere and MUST NOT be redefined: the run-state machine's progression semantics ([Run Playbook State Machine](2026-07-01-run-playbook-state-machine.md)) beyond the F2 hint-retirement rule; the packaging pipeline, adapter contracts, and verification gates ([Playbook Packaging Compiler and Harness Adapters](2026-07-01-playbook-packaging-compiler-and-harness-adapters.md)) beyond the F1 probe consumption; the operation registry and command-tree materialization rules ([CLI Command Reorganization and Operation Registry](2026-07-01-cli-command-reorganization-and-operation-registry.md)); conformance evidence ([Playbook and Package Conformance](2026-07-01-playbook-and-package-conformance.md)).

R-INV-1 (MUST). Agent invariance is a design rule for every change below: operation result objects, MCP tool output, and the machine-readable CLI output remain byte-identical to today's shapes, except for additive fields and additive flags. No MCP tool schema changes. Any behavior an agent scripts against today must be reachable identically after this round.

### D1. Dependencies Become a Fenced YAML Block (C1, root fix for F1)

R-DEP-1 (MUST). The `## Dependencies` Markdown table is replaced by a fenced block using the info string `playbook`, the same discipline as the workflow contract block, distinguished by its top-level key. Exactly one authoritative `playbook` fence is allowed per governed section; a `playbook` fence whose top-level key does not match its section is an error. The canonical shape:

`````md
## Dependencies

```playbook
dependencies:
  - id: git
    kind: cli
    requirement: required
    probe: git
    source: system install of git
    used_by: [check]
    fallback: stop with install guidance
```
`````

R-DEP-2 (MUST). Per-entry fields:

| Field | Constraint |
| --- | --- |
| `id` | Required. Stable local identifier, unique within the Playbook, referenced by steps via `uses` and `requires`. |
| `kind` | Required. The existing W18 R6 kind enumeration, unchanged. |
| `requirement` | Required. One of `required`, `optional`, `preferred`, `conditional`, unchanged. |
| `probe` | Optional. The executable or reference target that generated dependency checks verify. Defaults to `id`. For `cli` and `package-manager` kinds this is the binary probed with `command -v`; for `skill` and `plugin` kinds it is the manifest reference identifier; other kinds reserve it. Must match the executable-token pattern when present. |
| `source` | Required. Human provenance prose — where the dependency comes from. Never parsed for machine meaning by anything, restoring the contract's own narrative-prose rule. |
| `used_by` | Required. A YAML list of step ids or workflow phase names (a typed list, not comma prose). |
| `fallback` | Required. Prose describing what execution does when the dependency is missing. |

R-DEP-3 (MUST). `probe` is the only field the packaging compiler's dependency materialization may target for check generation. `executableToken` scraping of `source` is removed entirely; `source` returns to pure human provenance that nothing parses. This is the root fix for F1.

### D2. Frontmatter Key Simplification (C2)

R-FM-1 (MUST). `schema` replaces `schemaVersion` and `workflowSchema` replaces `workflowSchemaVersion` as the canonical required frontmatter keys. Values and semantics are unchanged. The old keys are removed, not deprecated (D4): a document declaring `schemaVersion` or `workflowSchemaVersion` fails validation with a pointed diagnostic naming the v2 key it must use.

### D3. Required-Heading Simplification (C3)

R-HEAD-1 (MUST). The required heading spine simplifies as follows; order and presence rules are unchanged:

| Position | Current | Proposed |
| --- | --- | --- |
| 1 | `# <Title>` | unchanged |
| 2 | `## Purpose` | unchanged |
| 3 | `## When To Use` | unchanged |
| 4 | `## Inputs And Authority` | `## Inputs` |
| 5 | `## Dependencies` | unchanged |
| 6 | `## Workflow Contract` | `## Workflow` |
| 7 | `## Step Guidance` | unchanged |
| 8 | `## Gates And Decisions` | `## Gates` |
| 9 | `## Outputs And Handoff` | `## Outputs` |
| 10 | `## Validation` | unchanged |
| 11 | `## Packaging Notes` | unchanged |

The `## Inputs And Authority` fold is a resolved user decision: the authority/precedence concept survives as guidance content inside `## Inputs` and as prose in the contract template text, not as heading vocabulary. The handoff guidance likewise folds into `## Outputs`. Only the v2 spellings are valid: an old spelling fails validation with a pointed diagnostic naming the v2 heading for that slot (D4).

### D4. Clean v2 Break (user-approved)

R-MIG-1 (MUST). All three contract changes (D1–D3) ship as one contract revision, and the revision is a clean break: the v1 dependency-table parser, the old heading spellings, and the old frontmatter keys are removed, not deprecated. Nothing built on the v1 contract was ever distributed, so there are no external documents to protect; an accept-old-warn window would preserve dead parsing surface for zero consumers. The deprecation diagnostics the earlier draft proposed (PB-DEP-008, PB-FM-009, PB-DOC-010) are dropped. This aligns with, rather than departs from, the W18 R11 no-alias precedent.

R-MIG-2 (MUST). Old-form documents fail with pointed diagnostics that name the v2 replacement shape: a `## Dependencies` Markdown table fails naming the fenced `playbook` dependencies block; `schemaVersion`/`workflowSchemaVersion` fail naming `schema`/`workflowSchema`; an old heading spelling fails naming the v2 heading for that slot. This is a good error message, not legacy support — the old forms never parse to a model.

R-MIG-3 (MUST). The document schema version advances (for example `make-docs.playbook.v2`) and the parser accepts only the v2 version; a v1 version value fails with a pointed diagnostic naming the v2 identifier.

R-MIG-4 (MUST). No v1 document survives in-tree: the shipped default Playbook, every parser/validator/compiler fixture, and the upstream template source of truth in `packages/docs/template/` migrate in place within this round.

### D5. Ripple: Parser, Validator, Compiler, Template, Guides — Upstream First

R-RIPPLE-1 (MUST). The change lands coherently across: the parser (`packages/cli/src/playbook/parser/` — a dependencies-block parser replacing `dependency-table.ts`, which is deleted), the validator layers and diagnostics catalog, the packaging compiler's dependency materialization (D9/F1), the playbook contract document, and the shipped default Playbook `docs/assets/playbooks/agent/make-docs-lifecycle.playbook.md`, which migrates to the new forms as the canonical example. The contract's worked example is rewritten to the new shape.

R-RIPPLE-2 (MUST). The playbook contract and the default Playbook are dogfooded template assets: they are authored upstream in `packages/docs/template/.make-docs/contracts/system/playbook-contract.md` and `packages/docs/template/docs/assets/playbooks/agent/`, then re-seeded into this repo's `.make-docs/` and `docs/` instances. Dogfood-only library guides that teach playbook authoring update in place downstream.

### D6. CLI Render Layer (X1, X7)

R-RENDER-1 (MUST). The `run` dispatcher gains a render layer at the seam where `printJson(invocation.value)` sits today, keyed by the existing (currently unused) `OperationRenderMode`. On a TTY, the default rendering is human text per operation: what just happened (the execution report), where the run stands (a compact cursor/status line, not the full state echo), and what to do next (the next hint and the exact next command). `--json` always emits the full operation result, byte-identical to today's output. When stdout is not a TTY, the default remains the full JSON, so existing scripts and agents observe no change without passing any flag (R-INV-1).

R-RENDER-2 (MUST). The evidence log and the capability snapshot are not repeated in text mode: the capability snapshot renders once at `start`, and later text renderings reference rather than restate it (X7). The full record stays available via `--json` and `status --json`.

R-RENDER-3 (MUST). MCP output derives from the operation result exactly as today; the render layer is CLI-only.

### D7. Package Command Grammar (X2, X3)

R-GRAM-1 (MUST). The packaging surface becomes intent-named, preserving the same review rails and every fail-before-write stop:

- `run package plan` — pure computation and review, as today; gains `--output <path>` to write the plan artifact directly (X3, mirroring `run playbook run export --output`), removing the jq surgery from the plan-to-write handoff.
- `run package preview` — the full write pipeline with no writes: today's `write` without `--write`. Every diagnostic, stop, and generated-output record, nothing on disk.
- `run package write` — writes. Today's `write --write`; the `--write` flag is retired on the CLI. All preconditions, digest-mismatch stops, ownership-conflict stops, and fail-before-write semantics are unchanged.

R-GRAM-2 (MUST). This renames CLI spellings only: the underlying operation, its dry-run input, and the MCP tools are untouched (R-INV-1). The old `write`-as-dry-run spelling is not aliased; invoking `write` still fails closed before writing whenever any stop applies, so the least-surprise hazard runs in the safe direction.

R-GRAM-3 (MUST). `package.ship` is added as a composite single-entry operation: a real registered operation in the operation registry, per the W18 R11 parity rule that every CLI path mirrors a registry identifier — no CLI-only composites. It surfaces as `run package ship` and derives to MCP exactly like every other operation. Semantics: it executes plan → preview → write through the operation core, aborting at the first stop, unresolved proposal, or warning with guidance that names the granular command (`plan`, `preview`, or `write`) to continue with; it performs the classification write; every existing fail-before-write rail is preserved unchanged. A plan with zero unresolved items proceeds end-to-end without human judgment; anything that needs review still stops.

### D8. Remaining Experience Corrections (X4–X6)

R-RUNID-1 (MUST). Run identifiers keep their sortable internal form, but every `--run-id` acceptor resolves an unambiguous prefix, and a `--last` alias selects the most recent run for the resolved project. An ambiguous prefix fails listing the candidates (X4).

R-FLAG-1 (MUST). `--repo-root` defaults to the nearest ancestor of the working directory carrying `.make-docs/manifest.json`; `--store-root` defaults to the real global store. Both flags remain as overrides (X5).

R-FLAG-2 (SHOULD). The packaging preconditions ceremony (`--precondition k=v` three times per write) is absorbable into project config (for example a packaging preconditions block in `.make-docs/config.yaml`), with explicit flags always overriding; config remains convenience, never authority, consistent with the harness-capabilities precedent.

R-NOISE-1 (MUST). The Node SQLite ExperimentalWarning is suppressed by a targeted process-warning filter at CLI entry that matches only that warning; never a blanket suppression (X6).

### D9. Defect Corrections

R-FIX-1 (MUST). F1 is fixed at the root by D1's `probe` field (R-DEP-3); with the v1 table parser deleted (D4), no `source`-scraping path survives anywhere — nothing ever parses `source` prose. The regression is pinned by fixtures whose `source` prose does not begin with the binary name — the exact blind spot that let the defect through — including the UAT repro (`git` with source `system install of git`).

R-FIX-2 (MUST). F2 gains retirement semantics: resume hints become subject-scoped (each hint records the step or gate it advises about), and on every mutating transition (`advance`, `gate`, `resume`, `close`) hints whose subject has reached a resolved status are retired. `close` retires all guidance hints, so a closed run's state carries none. The durable audit trail is the evidence log, which is unchanged; hints are current guidance only. Any run-state serialization change is additive and migrated per the store's schema-versioning rules.

### D10. Sequencing: This Round Runs Before W18 R9 (user-approved)

R-SEQ-1 (MUST). This remediation round (W18 R12) lands before the W18 R9 conformance wave executes, because R9's evidence bar binds to generated-package content (dependency-check scripts become probe-based) and to CLI command spellings (`plan`/`preview`/`write`) that this round changes. Running R9 first would mint conformance evidence against surfaces about to move.

R-SEQ-2 (MUST). This round's PRD coverage reconciles [PRD 37](../prd/37-enhance-playbook-and-package-conformance.md) and the existing [W18 R9 backlog](../work/2026-07-01-w18-r9-playbook-and-package-conformance/00-index.md) for every assumption this round invalidates: dependency-table fixtures and generated-check expectations, command spellings in scenario scripts, and any scenario transcript that consumes CLI output (which must pin `--json`). The obligation is tracked as [R-026](../prd/03-open-questions-and-risk-register.md).

### D11. Non-Goals

- The Clack-based interactive run mode ([Q-015](../prd/03-open-questions-and-risk-register.md)) is out of scope; it is the natural next wave after this round lands, precisely so it is not built over the pre-remediation grammar and output.
- The full TUI over the store, run state machine, and packaging surfaces ([Q-016](../prd/03-open-questions-and-risk-register.md)) is out of scope; it is a named future design lineage, not part of this round.
- No changes to operation result schemas or MCP tool schemas beyond additive fields and additive flags (R-INV-1).
- No change to the fail-before-write safety posture anywhere: every stop, precondition, digest check, and ownership guard behaves exactly as PRD 36 mandates; D7 renames how intent is spelled, not what is allowed.

### D12. Verification

R-TEST-1 (MUST). Contract: the v2 dependencies block, frontmatter keys, and headings parse and validate; each removed v1 form (dependency table, `schemaVersion`/`workflowSchemaVersion`, old heading spellings, v1 schema identifier) fails with its pointed diagnostic naming the v2 replacement shape; no v1 form parses to a model.

R-TEST-2 (MUST). F1: generated `cli` and `package-manager` checks probe `probe` (or `id` when absent), with a fixture whose `source` does not start with the binary name; the UAT repro passes.

R-TEST-3 (MUST). F2: a run advanced past a delegated step no longer carries that step's waiting hint; a closed run carries no guidance hints; the evidence log is unchanged.

R-TEST-4 (MUST). Render invariance: `--json` output and non-TTY default output are byte-identical to the pre-remediation operation results (modulo additive fields); MCP derivation parity holds.

R-TEST-5 (MUST). Grammar: `plan --output` writes the reviewable plan; `preview` writes nothing under any input; `write` preserves every existing stop; the retired `--write` spelling fails with guidance naming the new grammar.

R-TEST-6 (MUST). Ship: `run package ship` on a plan with zero unresolved items completes plan → preview → write end-to-end with the classification write recorded; on the first stop, unresolved proposal, or warning it aborts before any disk write with guidance naming the granular command to continue with; `package.ship` is present in the operation registry and derives to MCP like every other operation.

## Alternatives Considered

Accept old forms with deprecation warnings and a stated removal horizon. Rejected (user decision). An earlier draft proposed accept-old-warn on the theory that playbooks are user-authored content that must not break on upgrade — but nothing built on the v1 contract was ever distributed, so a deprecation window would carry dead parsing surface for zero consumers. The clean v2 break removes the v1 forms outright; old-form documents fail with pointed diagnostics naming the v2 replacement shape, which is the good-error-message half of that proposal without the legacy-support half.

Ship C1, C2, and C3 as separate contract revisions. Rejected. Three revisions mean three deprecation windows and three migration passes over the same documents; batching opens the window once (user-approved).

Keep the Markdown table and add a `Probe` column. Rejected. It patches F1 but preserves the positional-column, stringly-typed shape that caused it, and adds a seventh column to hand-align.

Fix F1 only by defaulting the probe to the dependency ID, with no contract change. Rejected. It conflates naming with probing (a dependency `github-cli` probing binary `gh` would be inexpressible) and leaves structured data in prose. The ID default survives only as the in-contract default for an omitted `probe` field (R-DEP-2).

Surface a ship-style composite as a CLI-only chained command instead of a registered operation. Rejected. The W18 R11 parity rule requires every CLI path to mirror a registry identifier — no CLI-only composites; `package.ship` registers like every other operation and derives to MCP identically (R-GRAM-3).

Select output audience with an `--agent` flag instead of TTY detection plus `--json`. Rejected. Agents already parse today's JSON without passing any flag; a non-TTY JSON default preserves them unchanged, while an opt-in flag would break every existing agent invocation.

Make `write` write via a `--force`-style confirmation instead of renaming. Rejected. It keeps the misnamed verb and adds ceremony; intent-named `plan`/`preview`/`write` says what each command does while preserving identical rails.

Build the Clack interactive mode in this round. Rejected and deferred (Q-015). An interactive layer over the current grammar and output would wallpaper the problems; it should be built on the remediated surface.

Sequence W18 R9 conformance first, then remediate. Rejected (user decision). R9 evidence binds to package content and command spellings this round changes; evidence minted first would be invalidated immediately.

## Consequences

Authors get a typed, named-field dependency declaration, shorter frontmatter keys, and plainer headings; the parser carries exactly one accepted form per surface — the v1 parser is deleted rather than deprecated, and the only cost is that every in-tree v1 document (the default Playbook, fixtures, the upstream template) migrates within this round. F1 becomes structurally unrepresentable rather than merely patched: nothing anywhere parses `source` prose for machine meaning, and an old-form document fails loudly with the v2 shape named in the error.

Humans driving runs see reports and next steps instead of growing state echoes, while agents and scripts observe byte-identical machine output; the render layer finally consumes the `OperationRenderMode` seam the operation types reserved. The `plan`/`preview`/`write` grammar removes the least-surprise violation without weakening a single safety rail, and `package.ship` gives the no-judgment-needed path a single registered entry point that stops the instant human review is required.

The ripple is wide but shallow: contract and default Playbook upstream in `packages/docs/template/` then dogfooded; parser, validator, diagnostics, compiler materialization, run CLI, and tests in `packages/cli/`; the lineage PRDs (34, 35, 36, 39) receive revision coverage in planning; and PRD 37 plus the W18 R9 backlog must be reconciled before R9 executes, which this design makes an explicit obligation rather than a discovered surprise. W18 R9 is delayed by one round; the user judged that cheaper than re-minting conformance evidence.

The deferred directions (Q-015 interactive mode, Q-016 TUI) inherit a remediated substrate: a stable human render layer, an intent-named grammar, and pruned run-state hints are precisely the primitives an interactive or full-screen surface would consume.

## Design Lineage

Update Mode: new-doc-related.

Prior Design Docs: [Playbook Contract and Model](2026-06-30-playbook-contract-and-model.md), [Run Playbook State Machine](2026-07-01-run-playbook-state-machine.md), [Playbook Packaging Compiler and Harness Adapters](2026-07-01-playbook-packaging-compiler-and-harness-adapters.md), [CLI Command Reorganization and Operation Registry](2026-07-01-cli-command-reorganization-and-operation-registry.md).

Reason: This design revises the W18 R6 authoring contract's dependency registry, frontmatter keys, and heading spine for human ergonomics; adds hint-retirement semantics to the W18 R7 run state; corrects the W18 R8 dependency-check materialization defect at its root; and adds a human render layer and intent-named packaging grammar to the W18 R11 CLI surface — all driven by the first hand-run UAT of those waves. It preserves every prior safety, storage, verification, and registry decision unchanged.

## Intended Follow-On

Route: `change-plan`

Next Prompt: [designs-to-plan-change.prompt.md](../../.make-docs/references/system/prompts/designs-to-plan-change.prompt.md)

Why: This is a corrective evolution of active W18 requirements across the PRD 34/35/36/39 lineage, not a fresh baseline: it revises the shipped authoring contract, run state, packaging materialization, and CLI surface against the active PRD namespace.

Coordinate Handoff: Revises W18 R6 (playbook contract and model, PRD 34), W18 R7 (run playbook state machine, PRD 35), W18 R8 (packaging compiler, PRD 36), and W18 R11 (CLI command surface, PRD 39). Downstream coordinate: W18 R12. Sequencing constraint: W18 R12 lands before the planned W18 R9 conformance wave executes, and its planning must include the PRD 37 / W18 R9 backlog reconciliation recorded in register item R-026.
