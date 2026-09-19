___
name: Coverage Pass - Maintainer Guide
description: Runs the maintainer-guide coverage pass for completed work using the coverage-pass and guide contracts.
___

When generating or materially rewriting make-docs documents, include PRD 23 YAML frontmatter: common `title`, `kind`, and `status`; add `coordinate`, `persona`, `source`, `lifecycle`, and `follow_on` only when their conditions apply; omit unknown coordinate levels rather than inserting placeholders.

Please run the maintainer-guide coverage pass for the completed work context supplied with this request.

Before writing anything, read `.make-docs/system/contracts/coverage-pass-contract.md`, `.make-docs/system/contracts/guide-contract.md`, and the router at `docs/assets/AGENTS.md` (or `CLAUDE.md`). Treat those files as the authority; cite them in your closeout summary but do not restate their shared mechanics.

Use the guide coverage surface from the coverage-pass contract and the maintainer-guide audience rules from the guide contract. Choose an effective Persona with the `maintainer` primitive from the merged built-in defaults and valid project config. Without custom configuration, target `maintainer`. Either role can be human or agent; do not infer the audience from the executor.

Inspect existing guides under the selected effective Persona path and related guides for other effective Personas. Built-in paths are `docs/assets/maintainer/` and `docs/assets/user/`. Enumerate every candidate maintainer-facing capability, workflow, validation path, contract, extension point, operator task, or troubleshooting item from the completed work.

Assign exactly one verdict to every candidate: `create`, `update-existing`, `link-only`, or `none`. Include the target persona and a reason for each candidate, including `none`. Prefer updating an existing guide when it owns the topic.

Apply the history idempotency rule in `coverage-pass-contract.md` for this session and follow `history-record-contract.md` only if the pass creates or updates a history breadcrumb. Reference the validation checklist in `coverage-pass-contract.md` instead of restating it, and run focused validation for any changed files.

Close with a concise pass summary: verdict table, artifacts changed, validation run, no-change rationales, and remaining handoffs. If commit-message work is needed, read `make-docs://system/prompt/work-to-commit-message.prompt.md` with `make-docs resource read`; do not create a duplicate commit-message starter.
