___
name: Coverage Pass - Developer Guide
description: Runs the developer-guide coverage pass for completed work using the coverage-pass and guide contracts.
___

When generating or materially rewriting make-docs documents, include PRD 23 YAML frontmatter: common `title`, `kind`, and `status`; add `coordinate`, `persona`, `source`, `lifecycle`, and `follow_on` only when their conditions apply; omit unknown coordinate levels rather than inserting placeholders.

Please run the developer-guide coverage pass for the completed work context supplied with this request.

Before writing anything, read `.make-docs/contracts/system/coverage-pass-contract.md`, `.make-docs/contracts/system/guide-contract.md`, and the router at `docs/assets/library/AGENTS.md` (or `CLAUDE.md`). Treat those files as the authority; cite them in your closeout summary but do not restate their shared mechanics.

Use the guide coverage surface from the coverage-pass contract and the developer-guide audience rules from the guide contract. If persona configuration exists, use the configured persona names; otherwise target the legacy `Developer` persona.

Inspect existing guides under `docs/assets/library/developer/` and related user guides under `docs/assets/library/user/`. Enumerate every candidate developer-facing capability, workflow, validation path, contract, extension point, operator task, or troubleshooting item from the completed work.

Assign exactly one verdict to every candidate: `create`, `update-existing`, `link-only`, or `none`. Include the target persona and a reason for each candidate, including `none`. Prefer updating an existing guide when it owns the topic.

Apply the history idempotency rule in `coverage-pass-contract.md` for this session and follow `history-record-contract.md` only if the pass creates or updates a history breadcrumb. Reference the validation checklist in `coverage-pass-contract.md` instead of restating it, and run focused validation for any changed files.

Close with a concise pass summary: verdict table, artifacts changed, validation run, no-change rationales, and remaining handoffs. If commit-message work is needed, use the existing `.make-docs/references/system/prompts/work-to-commit-message.prompt.md`; do not create a duplicate commit-message starter.
