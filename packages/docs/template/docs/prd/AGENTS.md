<!-- make-docs:begin -->
# PRD Router

This directory is the active product-authority namespace.

- Files use `NN-<slug>.md`; fixed-core filenames and lifecycle rules live in `.make-docs/system/contracts/output-contract.md`. When that local body is absent, run `make-docs resource read make-docs://system/contract/output-contract.md`.
- Governing invariant: `docs/prd/` describes the current authoritative shape of the product. It must never describe the editorial operation used to change that authority.
- For every candidate, choose `update-existing` when an owner exists, `create` only for a coherent ownerless capability, subsystem, or boundary, `link-only` when authority is sufficient but navigation needs a pointer, or `none` when no PRD change is warranted.
- Put current normative requirements inline. Preserve material prior contracts only in the owning PRD's standardized, non-normative `## Requirement History` section.
- Never use filenames, H1 titles, kinds, or document identities that describe additions, enhancements, revisions, removals, migrations, or reconciliation.
- PRDs do not use W/R/P as document identity; maintenance coordinates belong in source links and requirement-history entries.
- `03-open-questions-and-risk-register.md` is the living register for gap state, open questions, resolved decisions, confirmed drift, and rebuild risks.
- Update the register directly for newly discovered or resolved gaps; do not create separate questions, decisions, risks, gaps, or architecture-decision files unless the user explicitly asks.
- Before writing, use valid local `.make-docs/system/references/execution-workflow.md`, `.make-docs/system/contracts/output-contract.md`, and `.make-docs/system/references/prd-change-management.md` bodies. When one is absent, run `make-docs resource read` with its exact `make-docs://system/reference/execution-workflow.md`, `make-docs://system/contract/output-contract.md`, or `make-docs://system/reference/prd-change-management.md` URI.
- Use the matching local template: `.make-docs/system/templates/prd-index.md`, `.make-docs/system/templates/prd-overview.md`, `.make-docs/system/templates/prd-architecture.md`, `.make-docs/system/templates/prd-subsystem.md`, `.make-docs/system/templates/prd-reference.md`, `.make-docs/system/templates/prd-glossary.md`, or `.make-docs/system/templates/prd-risk-register.md`. When it is absent, run `make-docs resource read` with its exact `make-docs://system/template/prd-index.md`, `make-docs://system/template/prd-overview.md`, `make-docs://system/template/prd-architecture.md`, `make-docs://system/template/prd-subsystem.md`, `make-docs://system/template/prd-reference.md`, `make-docs://system/template/prd-glossary.md`, or `make-docs://system/template/prd-risk-register.md` URI.
- Treat the reference docs as the authority for namespace lifecycle, ownership, numbering, requirement history, and validation; `make-docs run prd authority validate --target-root <project>` must exit zero before downstream work consumes the set, and invalid or escaping docs roots are blocking validation failures.
<!-- make-docs:end -->
