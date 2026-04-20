# Documentation Router

Use `docs/` only as a router. Do not create generated files directly in this directory.
- For design docs, read `docs/.references/design-workflow.md`, `docs/.references/design-contract.md`, and `docs/.templates/design.md`, then continue in `docs/designs/`.
- For plans, read `docs/.references/planning-workflow.md` and the selected plan template in `docs/.templates/`, then continue in `docs/plans/`.
- For PRD or work generation, read `docs/.references/execution-workflow.md`, `docs/.references/output-contract.md`, and the selected template in `docs/.templates/`, then continue in `docs/prd/` or `docs/work/`.
- For guides, continue in `docs/guides/`. User-facing and developer-facing guides live in `docs/guides/user/` and `docs/guides/developer/` — read `docs/.references/guide-contract.md` and the matching template (`docs/.templates/guide-developer.md` or `docs/.templates/guide-user.md`) before writing.
- For history records, continue in `docs/.assets/history/` — read `docs/.references/history-record-contract.md` and `docs/.templates/history-record.md` before writing.
- For requirement changes, also read `docs/.references/prd-change-management.md` before choosing change templates or delta outputs.
- For reusable prompt starters, use `docs/.prompts/`; prompts are optional starters, not authority.
