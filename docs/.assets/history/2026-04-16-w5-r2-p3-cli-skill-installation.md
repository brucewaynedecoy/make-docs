---
date: "2026-04-16"
coordinate: "W5 R2 P3"
---

# Phase 3: CLI Skill Installation R2 — Instruction Derivation

## Changes

Replaced direct reads of the old `instructionKinds` selection shape in the asset pipeline with a single derivation helper that maps active harnesses to the set of active instruction-file kinds. All per-harness gating now routes through one function.

| Area | Summary |
| --- | --- |
| `types.ts` | Added `HARNESS_TO_INSTRUCTION` const (inverse of the existing `INSTRUCTION_KIND_TO_HARNESS`) and an exported `getActiveInstructionKinds(selections: Pick<InstallSelections, "harnesses">): Set<InstructionKind>` helper that iterates `HARNESSES` and builds the active instruction-kind set from `selections.harnesses`. |
| `catalog.ts` | Hoisted the harness filter to the caller: `getDesiredAssets` now iterates `getActiveInstructionKinds(profile.selections)` instead of all `INSTRUCTION_KINDS`. Dropped the inline `harnesses[...]` guard inside `addInstructionAssets` (caller now pre-filters), renamed its param to `activeInstructionKind` to make that contract visible. |
| `renderers.ts` | No code change required. A jcodemunch text search confirmed zero `instructionKinds` references — its path-matching sets are harness-agnostic by design, and by the time a path reaches `renderBuildableAsset`, `catalog.ts` has already excluded any disabled-harness paths. Acceptance criterion trivially satisfied. |
| `wizard.ts` (simplify pass) | Collapsed two duplicate `INSTRUCTION_KINDS.filter(kind => selections.harnesses[INSTRUCTION_KIND_TO_HARNESS[kind]])` expressions in `getWizardOptionSelections` and `renderWizardReviewSummary` down to `Array.from(getActiveInstructionKinds(selections))` — same logic now flows through the new Phase 3 helper. |
| Validation | `tsc --noEmit` clean, `npm run build -w starter-docs` succeeds, all 44 existing tests pass. Final grep for `instructionKinds` in `catalog.ts` and `renderers.ts` returns zero matches. |

Files modified:

```text
packages/cli/
└── src/
    ├── types.ts        (added HARNESS_TO_INSTRUCTION + getActiveInstructionKinds)
    ├── catalog.ts      (consume helper; rename param for contract clarity)
    └── wizard.ts       (simplify pass: reuse helper at 2 call sites)
```

Notes for future phases:

- `applyWizardOptionSelections` in `wizard.ts` still uses `INSTRUCTION_KINDS` + `INSTRUCTION_KIND_TO_HARNESS` because it maps the *inverse* direction (input `InstructionKind[]` array → `harnesses` record). Phase 6 rewrites this step entirely.
- `renderers.ts` intentionally does not consume `getActiveInstructionKinds`. The path-matching sets (`ROOT_INSTRUCTIONS`, `DOCS_ROUTER_INSTRUCTIONS`, etc.) are format-only; gating happens in the catalog one layer up.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/work/2026-04-16-w5-r2-cli-skill-installation/03-instruction-derivation.md](../../work/2026-04-16-w5-r2-cli-skill-installation/03-instruction-derivation.md) | Work backlog phase — all four stages closed, acceptance criteria met. |
| [docs/plans/2026-04-16-w5-r2-cli-skill-installation/03-instruction-derivation.md](../../plans/2026-04-16-w5-r2-cli-skill-installation/03-instruction-derivation.md) | Source plan — specifies the derivation helper, catalog wiring, and renderer guard replacement. |

### Developer

None this session.

### User

None this session.
