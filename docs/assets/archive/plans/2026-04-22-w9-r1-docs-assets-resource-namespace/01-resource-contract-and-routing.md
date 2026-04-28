# Phase 1 - Resource Contract and Routing

## Objective

Establish the `docs/assets/` resource namespace contract and update active routing language so file moves, renderer changes, root `.make-docs/` state paths, and dogfood migration all follow the same path model.

## Depends On

- [2026-04-22-docs-assets-resource-namespace.md](../../designs/2026-04-22-docs-assets-resource-namespace.md)
- [2026-04-20-docs-assets-state-and-history.md](../../designs/2026-04-20-docs-assets-state-and-history.md)
- `docs/.references/planning-workflow.md`
- `docs/.references/wave-model.md`
- Current router files under `docs/`, `docs/.archive/`, `docs/.assets/`, `docs/.prompts/`, `docs/.references/`, and `docs/.templates/`

## Files to Modify

| File or Directory | Change Summary |
| ----------------- | -------------- |
| `docs/AGENTS.md` and `docs/CLAUDE.md` | Route support resources through `docs/assets/` while preserving direct project-doc outputs. |
| `docs/.references/*.md` | Replace active references to `.archive`, `.assets`, `.prompts`, `.references`, and `.templates` with the new `assets/*` locations. |
| `docs/.templates/*.md` | Update template comments and examples to reference `docs/assets/templates/`, `docs/assets/references/`, and `docs/assets/prompts/`. |
| `docs/.prompts/*.prompt.md` | Update prompt metadata and body text for new target paths. |
| `docs/.archive/AGENTS.md` and `docs/.archive/CLAUDE.md` | Prepare archive router wording for `docs/assets/archive/`. |
| `docs/.assets/AGENTS.md`, `docs/.assets/history/*`, `docs/.assets/config/*` | Prepare wording for the future `docs/assets/` layout and root `.make-docs/` CLI state location. |
| Matching `packages/docs/template/docs/**` router/source files | Keep template source wording aligned where the file still exists before Phase 2 moves it. |

## Detailed Changes

### 1. Define the new resource-root contract

Active contracts should describe this model:

```text
docs/
  assets/
    archive/
    history/
    prompts/
    references/
    templates/
```

Use `docs/assets/` as the support-resource namespace for document resources only. Do not describe `docs/.assets/` or `docs/assets/` as the future home for make-docs runtime state.

CLI state belongs at the install target root:

```text
.make-docs/
  manifest.json
  conflicts/
    <run-id>/
```

### 2. Preserve project document roots

The root docs router should continue routing generated project documents to:

```text
docs/designs/
docs/guides/
docs/plans/
docs/prd/
docs/work/
```

Only support resources move. The plan should not rename project output directories.

### 3. Update workflow and template links

Known active link classes to update:

- `docs/.references/*` to `docs/assets/references/*`
- `docs/.templates/*` to `docs/assets/templates/*`
- `docs/.prompts/*` to `docs/assets/prompts/*`
- `docs/.archive/*` to `docs/assets/archive/*`
- `docs/.assets/history/*` to `docs/assets/history/*`
- `docs/.assets/config/manifest.json` to `.make-docs/manifest.json`
- `docs/.assets/config/conflicts/*` to `.make-docs/conflicts/*`

If a required link target has not moved yet in Phase 1, preserve link validity during the phase by updating wording in the same commit or by sequencing the physical move in Phase 2 before link validation.

### 4. Separate CLI state from document resources

Active docs should not introduce `docs/assets/config/` or `docs/assets/state/`. The manifest should be described as root-level tool state:

```text
.make-docs/manifest.json
```

Conflict staging should be described as root-level tool state:

```text
.make-docs/conflicts/<run-id>/
```

Do not describe `manifest.json` or `conflicts/` as children of `docs/assets/`.

### 5. Clarify historical references

Historical docs may keep old paths when they describe earlier behavior. Active contracts, routers, templates, prompts, package docs, and skill instructions should not route future work to old hidden resource directories.

## Parallelism

Reference/template/prompt text can be updated in parallel with router wording, but one final pass should normalize all active links so Phase 2 does not inherit mixed path language.

## Acceptance Criteria

- [ ] Active router text distinguishes direct project docs from `docs/assets/` support resources.
- [ ] Active contracts and workflow references use `docs/assets/references/`, `docs/assets/templates/`, and `docs/assets/prompts/`.
- [ ] Active archive guidance points to `docs/assets/archive/`.
- [ ] Active history guidance points to `docs/assets/history/`.
- [ ] Active config/state guidance points to `.make-docs/manifest.json` and `.make-docs/conflicts/`.
- [ ] No active instruction introduces `docs/assets/config/`, `docs/assets/state/`, `docs/assets/manifest.json`, or `docs/assets/conflicts/`.
- [ ] Historical references that remain are intentionally historical, not future-facing instructions.
