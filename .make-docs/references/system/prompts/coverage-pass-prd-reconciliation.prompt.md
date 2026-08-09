___
name: Coverage Pass - PRD Reconciliation
description: Runs the PRD reconciliation coverage pass for completed work using the coverage-pass and PRD authority-maintenance contracts.
___

When generating or materially rewriting make-docs documents, include PRD 23 YAML frontmatter: common `title`, `kind`, and `status`; add `coordinate`, `persona`, `source`, `lifecycle`, and `follow_on` only when their conditions apply; omit unknown coordinate levels rather than inserting placeholders.

Please run the PRD reconciliation coverage pass for the completed work context supplied with this request.

Before writing anything, read `.make-docs/contracts/system/coverage-pass-contract.md`, `.make-docs/references/system/prd-change-management.md`, `.make-docs/contracts/system/output-contract.md`, `docs/prd/AGENTS.md` (or `CLAUDE.md`), `docs/prd/00-index.md`, and `docs/prd/03-open-questions-and-risk-register.md`. Treat those files as the authority; cite them in your closeout summary but do not restate their shared mechanics.

Use the PRD reconciliation coverage surface from the coverage-pass contract. Inspect the active PRD namespace and enumerate every candidate current-requirement update, genuinely new capability authority, requirement-history entry, risk-register item, index/status update, discoverability pointer, or no-change decision raised by the completed work.

Assign exactly one verdict to every candidate: `create`, `update-existing`, `link-only`, or `none`. Include a reason for each candidate, including `none`. Update the active PRD owner in place when its subject owns the requirement. Use `create` only for a coherent, wholesale new capability, subsystem, or product boundary with no suitable owner. Never create a PRD that describes the editorial operation used to change product authority.

Apply the history idempotency rule in `coverage-pass-contract.md` for this session and follow `history-record-contract.md` only if the pass creates or updates a history breadcrumb. Reference the validation checklist in `coverage-pass-contract.md` and the PRD validation checklist in `prd-change-management.md` instead of restating them, and run focused validation for any changed files.

Close with a concise pass summary: verdict table, artifacts changed, validation run, no-change rationales, and remaining handoffs. If commit-message work is needed, use the existing `.make-docs/references/system/prompts/work-to-commit-message.prompt.md`; do not create a duplicate commit-message starter.
