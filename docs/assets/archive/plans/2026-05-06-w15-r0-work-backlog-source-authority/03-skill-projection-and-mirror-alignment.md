# Phase 3 - Skill Projection and Mirror Alignment

## Objective

Align `decompose-codebase` package skill guidance and mirrored skill copies with the root source-authority ladder.

## Depends On

- [02-contract-and-template-guidance.md](./02-contract-and-template-guidance.md)
- `packages/skills/decompose-codebase/SKILL.md`
- `packages/skills/decompose-codebase/references/`
- `packages/skills/decompose-codebase/assets/templates/`
- `.agents/skills/decompose-codebase/`
- `.claude/skills/decompose-codebase/`

## Files To Modify

- `packages/skills/decompose-codebase/SKILL.md`
- selected files under `packages/skills/decompose-codebase/references/`
- selected files under `packages/skills/decompose-codebase/assets/templates/`
- `.agents/skills/decompose-codebase/`, synced mechanically from package source
- `.claude/skills/decompose-codebase/`, synced mechanically from package source

## Detailed Changes

1. Update package skill guidance to say root `docs/assets/` contracts are primary inside this repo.
2. Clarify that skill-local `references/` and `assets/templates/` are bundled projections for installed skill execution.
3. Clarify that mirrored `.agents` and `.claude` copies are parity outputs and should not be edited independently.
4. Update skill-local references or templates only where they currently conflict with the source-authority ladder.
5. Sync the package skill tree into `.agents/skills/decompose-codebase/` and `.claude/skills/decompose-codebase/`.
6. Preserve validator behavior unless it conflicts with the updated contract.

## Parallelism

This phase depends on Phase 2 root contract wording. Keep package skill edits and mirror sync in one coordinated phase to avoid parity drift.

## Acceptance Criteria

- `packages/skills/decompose-codebase/SKILL.md` describes repo contracts as primary and skill projections as secondary.
- Mirrored `.agents` and `.claude` skill trees match the package skill source after sync.
- Skill-local bundled assets still make sense for installed-skill contexts.
- No mirror-only edits remain.
