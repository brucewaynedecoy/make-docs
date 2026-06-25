<!-- make-docs:begin -->
# PRD Router

This directory is an output target for the active PRD namespace and its change docs.

- Files use `NN-<slug>.md`; fixed-core filenames and lifecycle rules live in `.make-docs/contracts/system/output-contract.md`.
- `03-open-questions-and-risk-register.md` is the living register for gap state, open questions, resolved decisions, confirmed drift, and rebuild risks.
- Update the register directly for newly discovered or resolved gaps; do not create separate questions, decisions, risks, gaps, or architecture-decision files unless the user explicitly asks.
- Before writing, read `.make-docs/references/system/execution-workflow.md`, `.make-docs/contracts/system/output-contract.md`, `.make-docs/references/system/prd-change-management.md`, and the matching `prd-*` template in `.make-docs/templates/system/`.
- Treat the reference docs as the authority for namespace lifecycle, numbering, and validation.
<!-- make-docs:end -->
