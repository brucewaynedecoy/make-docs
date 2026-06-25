<!-- make-docs:begin -->
# Documentation Router

Use `docs/` only as a router. Do not create generated files directly in this directory. For lifecycle order or skip/reorder/revisit decisions, read `.make-docs/references/system/lifecycle.md` and surface departures from the default arc.

- Source Markdown NEVER uses semantic line breaks
- For path and link hygiene, use project-relative paths and relative Markdown links, and read `.make-docs/references/system/path-and-link-hygiene.md` when auditing or deciding whether an absolute path is warranted.
- For design docs, read `.make-docs/references/system/design-workflow.md`, `.make-docs/contracts/system/design-contract.md`, and `.make-docs/templates/system/design.md`, then continue in `docs/designs/`.
- For plans, read `.make-docs/references/system/planning-workflow.md` and the selected plan template in `.make-docs/templates/system/`, then continue in `docs/plans/`.
- For PRD or work generation, read `.make-docs/references/system/execution-workflow.md`, `.make-docs/contracts/system/output-contract.md`, and the selected template in `.make-docs/templates/system/`, then continue in `docs/prd/` or `docs/work/`; work phase tasks use `- [ ] t1: ...` checkbox items and acceptance criteria use plain bullets.
- For requirement changes, also read `.make-docs/references/system/prd-change-management.md` before choosing change templates or delta outputs.
- For gaps, drift, unresolved questions, risks, decisions, or closeout findings, first update `docs/prd/03-open-questions-and-risk-register.md` when it exists; do not create separate questions, decisions, risks, gaps, or architecture-decision files unless the user explicitly asks.
- For artifacts, use `docs/assets/artifacts/` as optional pre-design input material; do not create or preserve top-level `docs/artifacts/` as a shipped target.
- For archives, use `docs/assets/archive/`; do not create top-level `docs/archive/` as a shipped target.
- For breadcrumb records, use `docs/assets/breadcrumbs/`. Existing `docs/assets/history/` records are historical migration evidence; do not add new records there unless preserving or explicitly migrating existing history.
- For guides, continue in `docs/assets/guides/<persona-slug>/`; for playbooks, continue in `docs/assets/playbooks/<persona-slug>/`. Before guide or playbook coverage work, read `.make-docs/contracts/system/coverage-pass-contract.md`; before guide writing, also read `.make-docs/contracts/system/guide-contract.md`, inspect existing guides for overlap, choose the verdict and target persona(s), and use the matching guide template.
- After guide work, reconcile overlapping existing guides with reciprocal links, `related` frontmatter, or concise supplemental context when it improves discoverability.
- Use `## Future Coverage` inside guides for downstream-dependent guide updates. Do not create design docs, architecture decisions, or PRD risk-register items solely to remember future guide work.
- For closeout breadcrumb records, read `.make-docs/contracts/system/history-record-contract.md` and `.make-docs/templates/system/history-record.md`, then continue in `docs/assets/breadcrumbs/`.
- For reusable prompt starters, read `.make-docs/references/system/prompts/`; prompts are optional starters, not authority.
<!-- make-docs:end -->
