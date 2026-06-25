---
date: "2026-04-16"
coordinate: "W5 R2 P1"
---

# Phase 1: CLI Skill Installation R2 — Type System and Harness Model

## Changes

Replaced the `instructionKinds: Record<InstructionKind, boolean>` selection model with a harness-oriented shape (`harnesses: Record<Harness, boolean>` + `skillScope: "project" | "global"`) across the CLI package, and added a backward-compat migration so existing manifests continue to load without user intervention.

| Area | Summary |
| --- | --- |
| `types.ts` | Added `HARNESSES` const (`"claude-code" | "codex"`) and `Harness` type. Replaced `instructionKinds` with `harnesses` in `InstallSelections` and added `skillScope`. Exported a shared `INSTRUCTION_KIND_TO_HARNESS` map (`"AGENTS.md" → "codex"`, `"CLAUDE.md" → "claude-code"`). |
| `profile.ts` | Updated `defaultSelections()` to return both harnesses true and `skillScope: "project"`; updated `isFullDefaultProfile()` to check harnesses + `skillScope`; updated `profileId` hash input to include harnesses and `skillScope`. |
| `manifest.ts` | Added `migrateSelections()` — detects legacy manifests with `instructionKinds` and derives the new `harnesses` + `skillScope` fields, stripping `instructionKinds` from the returned object. Invoked in `loadManifest()` so every loaded manifest is normalized. |
| `catalog.ts`, `wizard.ts`, `cli.ts` | Rewired all `selections.instructionKinds[...]` reads/writes to use `selections.harnesses[INSTRUCTION_KIND_TO_HARNESS[kind]]`. Wizard's internal `WizardOptionSelections.instructionKinds: InstructionKind[]` is intentionally preserved — Phase 6 restructures the wizard flow. |
| `cli.ts::resolveSelections` | Replaced the field-by-field `InstallSelections` rebuild with `cloneSelections(baseSelections)` so future `InstallSelections` additions don't require touching this call site. |
| Tests | Updated two assertions in `wizard.test.ts` that read the new shape (`selections.harnesses["claude-code"]` / `result?.harnesses`). All 44 tests pass; `tsc --noEmit` and `npm run build -w make-docs` clean. |

Files modified:

```text
packages/cli/
├── src/
│   ├── types.ts
│   ├── profile.ts
│   ├── manifest.ts
│   ├── catalog.ts
│   ├── cli.ts
│   └── wizard.ts
└── tests/
    └── wizard.test.ts
```

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/assets/archive/work/2026-04-16-w5-r2-cli-skill-installation/01-type-system-and-harness-model.md](../archive/work/2026-04-16-w5-r2-cli-skill-installation/01-type-system-and-harness-model.md) | Work backlog phase — all four stages closed, acceptance criteria met. |
| [docs/assets/archive/plans/2026-04-16-w5-r2-cli-skill-installation/01-type-system-and-harness-model.md](../archive/plans/2026-04-16-w5-r2-cli-skill-installation/01-type-system-and-harness-model.md) | Source plan — design-level detail on each file change and the migration contract. |

### Developer

None this session.

### User

None this session.
