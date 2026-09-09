# Phase 4 — Re-seed and Validation

## Objective

Re-seed the repo-root dogfood docs from the updated template package, then run the full validation suite to confirm correctness.

## Depends On

- Phase 3 (all template and CLI changes must be complete).

## Re-seed Dogfood Docs

Copy the following files from `packages/docs/template/` to `docs/`:

| Source (in `packages/docs/template/`) | Target (in `docs/`) | Notes |
| --- | --- | --- |
| `docs/.references/wave-model.md` | `.references/wave-model.md` | Updated: Design row removed, Design Exemption added. |
| `docs/.references/design-contract.md` | `.references/design-contract.md` | Updated: Simplified Required Path. |
| `docs/.references/design-workflow.md` | `.references/design-workflow.md` | Updated: Simplified path patterns throughout. |
| `docs/.templates/design.md` | `.templates/design.md` | Updated: Simplified filename blockquote. |
| `docs/designs/AGENTS.md` | `designs/AGENTS.md` | Updated: Simplified naming convention. |
| `docs/designs/CLAUDE.md` | `designs/CLAUDE.md` | Updated: Mirror of AGENTS.md. |

Verify each target matches its source via `diff`.

Note: Existing design files in `docs/designs/` (the seven `w2-r0` designs plus the new `2026-04-16-design-naming-simplification.md`) are NOT modified. They are valid historical records.

## Validation Run

Execute in order:

1. **Unit and integration tests**
   ```bash
   npm test -w make-docs
   ```
   Expected: all tests pass with no regressions.

2. **Instruction router check**
   ```bash
   bash scripts/check-instruction-routers.sh
   ```
   Expected: exits 0.

3. **Smoke pack**
   ```bash
   node scripts/smoke-pack.mjs
   ```
   Expected: pack/install/verify succeeds. Installed design-related files should contain the simplified pattern.

4. **Manual spot-checks**
   - Fresh `init --yes` into a temp dir: verify `docs/.references/design-contract.md` shows `YYYY-MM-DD-<slug>.md` (no W/R).
   - Verify `docs/.references/wave-model.md` has the Design Exemption section.
   - Verify `docs/designs/AGENTS.md` shows the simplified naming convention and example.
   - Verify existing `w2-r0` designs in `docs/designs/` are untouched.

## Acceptance Criteria

- [ ] 6 files re-seeded from template; all verified byte-identical to source.
- [ ] Existing design files in `docs/designs/` are NOT modified.
- [ ] `npm test -w make-docs` exits 0.
- [ ] `bash scripts/check-instruction-routers.sh` exits 0.
- [ ] `node scripts/smoke-pack.mjs` exits 0.
- [ ] Fresh install contains simplified design naming pattern throughout.
- [ ] No regressions in any existing tests.
