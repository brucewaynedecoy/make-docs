# Template Source and Dogfood Ownership

## Purpose

Define the implementation-facing ownership model for files that move between `packages/docs/template/`, repo-root `docs/`, and generated package copies.

## Requirements

- `packages/docs/template/` is the first mutation target for shipped template-owned docs assets.
- Root `docs/` is dogfood validation and a project-authored workspace, not the product source of truth.
- Dogfood reseeding is reviewed and scoped to template-owned files.
- Generated designs, plans, PRDs, work backlogs, local guides, local history/archive entries, artifacts, overlays, and config stay project-owned unless a later accepted plan deliberately promotes them into starter content.
- Mixed directories such as `docs/assets/archive/` and its on-demand `history/` subtree are directory-contract surfaces; routers and starter structure may be template-owned, but local records are not automatically shipped starter content.
- If reseeding encounters local changes, PRD 18 compatibility and managed-file conflict rules apply.

## Acceptance Criteria

- The implementation backlog has explicit tasks for source-of-truth docs, reseed scope, and project-owned exclusions.
- No task asks for a blind recursive copy into root `docs/`.
- Validation expectations include targeted parity proof for files expected to match exactly.
