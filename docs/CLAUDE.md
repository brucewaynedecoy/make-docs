# Documentation Router

Use `docs/` only as a router. Do not create generated files directly in this directory.
- For design docs, read `docs/assets/references/design-workflow.md`, `docs/assets/references/design-contract.md`, and `docs/assets/templates/design.md`, then continue in `docs/designs/`.
- For plans, read `docs/assets/references/planning-workflow.md` and the selected plan template in `docs/assets/templates/`, then continue in `docs/plans/`.
- For PRD or work generation, read `docs/assets/references/execution-workflow.md`, `docs/assets/references/output-contract.md`, and the selected template in `docs/assets/templates/`, then continue in `docs/prd/` or `docs/work/`.
- For requirement changes, also read `docs/assets/references/prd-change-management.md` before choosing change templates or delta outputs.
- For gaps, drift, unresolved questions, risks, decisions, or closeout findings, first update `docs/prd/03-open-questions-and-risk-register.md` when it exists; do not create separate questions, decisions, risks, gaps, or architecture-decision files unless the user explicitly asks.
- For guides, continue in `docs/guides/`. User-facing and developer-facing guides live in `docs/guides/user/` and `docs/guides/developer/` — read `docs/assets/references/guide-contract.md` and the matching template (`docs/assets/templates/guide-developer.md` or `docs/assets/templates/guide-user.md`) before writing.
- For history records, continue in `docs/assets/history/` — read `docs/assets/references/history-record-contract.md` and `docs/assets/templates/history-record.md` before writing.
- For reusable prompt starters, use `docs/assets/prompts/`; prompts are optional starters, not authority.
