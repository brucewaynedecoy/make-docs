# Phase 5 - Template Contracts and Maintainer Operations

## Objective

Deliver the developer-facing guide coverage for the template and contract system, dogfood workflow, packaging, validation, and release operations. This phase is where the guide set explains how maintainers and extenders work on `make-docs` itself rather than how end users consume the installed docs system.

## Depends On

- Phase 2 guide delivery map
- Current authority in `docs/prd/06-template-contracts-and-generated-assets.md`, `docs/prd/09-dogfood-and-maintainer-operations.md`, `docs/prd/10-packaging-validation-and-release-reference.md`, and the current implementation surface they describe

## Files to Modify

| File | Change Summary |
| ---- | -------------- |
| `docs/guides/developer/template-*.md` | Update or create developer guides for the template tree, routers, contracts, and generated asset model approved in Phase 2. |
| `docs/guides/developer/maintainer-*.md` | Update or create maintainer guides for dogfood workflows, reseeding, and repo operations approved in Phase 2. |
| `docs/guides/developer/release-*.md` | Update or create release and validation guides for packaging, smoke-pack, validation, and publishing operations approved in Phase 2. |

## Detailed Changes

### 1. Keep this phase developer-facing by default

Unless Phase 2 explicitly marked a capability as `both`, this phase writes developer guides only.

Do not create user-facing files from this phase without an explicit Phase 2 assignment. If a row was resolved as `link-only`, implement that through links in the selected maintainer or contract guide instead of creating a thin standalone document.

### 2. Cover the contract and template system as it exists now

Template and contract guides should explain the current structure and authority boundaries, including where Phase 2 assigns coverage for:

- template-owned docs and routers
- contract and reference docs under `docs/assets/`
- generated guide, plan, design, PRD, work, and history expectations insofar as they matter to maintainers
- how the template package and dogfood docs relate to each other

These guides should cite current contracts and current code paths rather than restating historical refactors as the main narrative.

### 3. Cover maintainer, validation, and release operations

Maintainer and release guides should explain the current workflow where Phase 2 assigns coverage for:

- dogfood and reseed practices
- build and test expectations
- instruction-router verification
- smoke-pack validation
- packaging and release surfaces

If Phase 2 assigns roadmap-level material as `link-only`, keep `docs/guides/developer/roadmap.md` unchanged and link to it rather than folding roadmap strategy into operational guides.

### 4. Add `related` links back to user-facing entry points where useful

Even when a guide is developer-only, use `related` to point back to relevant user-facing docs when the maintainer surface exists to support them. This keeps the guide set navigable across audiences without duplicating full content.

### 5. Return structured handoff data

The worker must return:

- files changed
- ledger rows satisfied
- evidence used
- unresolved questions
- links added or deferred to assembly

## Acceptance Criteria

- [ ] All files modified in this phase stay within the developer-facing template, maintainer, or release families approved in Phase 2.
- [ ] Developer guides explain the current contract and maintainer surface rather than replaying historical refactors.
- [ ] `link-only` rows are implemented as links inside broader guides rather than as unnecessary standalone files.
- [ ] `docs/guides/developer/roadmap.md` is left untouched unless Phase 2 explicitly assigns it, and strategy remains distinct from operational coverage.
- [ ] New guides created in this phase use `status: draft`.
- [ ] The worker returns structured handoff data for assembly and validation.
