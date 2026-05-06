# Documentation Router

Use `docs/` only as a router. Do not create generated files directly in this directory.
- Source Markdown uses semantic line breaks only: do not hard-wrap prose for visual width, use editor soft-wrap, and separate a completed list from following paragraph text with one blank line.
- For design docs, read `docs/assets/references/design-workflow.md`, `docs/assets/references/design-contract.md`, and `docs/assets/templates/design.md`, then continue in `docs/designs/`.
- For plans, read `docs/assets/references/planning-workflow.md` and the selected plan template in `docs/assets/templates/`, then continue in `docs/plans/`.
- For PRD or work generation, read `docs/assets/references/execution-workflow.md`, `docs/assets/references/output-contract.md`, and the selected template in `docs/assets/templates/`, then continue in `docs/prd/` or `docs/work/`; work phase tasks use `- [ ] t1: ...` checkbox items and acceptance criteria use plain bullets.
- For requirement changes, also read `docs/assets/references/prd-change-management.md` before choosing change templates or delta outputs.
- For gaps, drift, unresolved questions, risks, decisions, or closeout findings, first update `docs/prd/03-open-questions-and-risk-register.md` when it exists; do not create separate questions, decisions, risks, gaps, or architecture-decision files unless the user explicitly asks.
- For guides, continue in `docs/guides/`. Before writing, read `docs/assets/references/guide-contract.md`, inspect existing guides for overlap, choose `developer`, `user`, `both`, `update-existing`, `link-only`, or `none`, and use the matching template (`docs/assets/templates/guide-developer.md` or `docs/assets/templates/guide-user.md`).
- After guide work, reconcile overlapping existing guides with reciprocal links, `related` frontmatter, or concise supplemental context when it improves discoverability.
- Use `## Future Coverage` inside guides for downstream-dependent guide updates. Do not create design docs, architecture decisions, or PRD risk-register items solely to remember future guide work.
- For history records, continue in `docs/assets/history/` — read `docs/assets/references/history-record-contract.md` and `docs/assets/templates/history-record.md` before writing.
- For reusable prompt starters, use `docs/assets/prompts/`; prompts are optional starters, not authority.
