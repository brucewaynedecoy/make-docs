<!-- make-docs:begin -->
# PRD Router

This directory is the active product-authority namespace.

- Files use `NN-<slug>.md`; fixed-core filenames and lifecycle rules live in `.make-docs/contracts/system/output-contract.md`.
- Governing invariant: `docs/prd/` describes the current authoritative shape of the product. It must never describe the editorial operation used to change that authority.
- For every candidate, choose `update-existing` when an owner exists, `create` only for a coherent ownerless capability, subsystem, or boundary, `link-only` when authority is sufficient but navigation needs a pointer, or `none` when no PRD change is warranted.
- Put current normative requirements inline. Preserve material prior contracts only in the owning PRD's standardized, non-normative `## Requirement History` section.
- Never use filenames, H1 titles, kinds, or document identities that describe additions, enhancements, revisions, removals, migrations, or reconciliation.
- PRDs do not use W/R/P as document identity; maintenance coordinates belong in source links and requirement-history entries.
- `03-open-questions-and-risk-register.md` is the living register for gap state, open questions, resolved decisions, confirmed drift, and rebuild risks.
- Update the register directly for newly discovered or resolved gaps; do not create separate questions, decisions, risks, gaps, or architecture-decision files unless the user explicitly asks.
- Before writing, read `.make-docs/references/system/execution-workflow.md`, `.make-docs/contracts/system/output-contract.md`, `.make-docs/references/system/prd-change-management.md`, and the matching `prd-*` template in `.make-docs/templates/system/`.
- Treat the reference docs as the authority for namespace lifecycle, ownership, numbering, requirement history, and validation; `make-docs run prd authority validate --target-root <project>` must exit zero before downstream work consumes the set, and invalid or escaping docs roots are blocking validation failures.
<!-- make-docs:end -->
