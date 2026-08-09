<!-- make-docs:begin -->
# Documentation Router

Use `docs/` only as a router. Do not create generated files directly in this directory. For lifecycle order or skip/reorder/revisit decisions, read `.make-docs/references/system/lifecycle.md` and surface departures from the default arc.
- Source Markdown NEVER uses semantic line breaks; for path/link hygiene, use project-relative paths and relative Markdown links, and read `.make-docs/references/system/path-and-link-hygiene.md`.
- For design docs, read `.make-docs/references/system/design-workflow.md`, `.make-docs/contracts/system/design-contract.md`, and `.make-docs/templates/system/design.md`, then continue in `docs/designs/`; for plans, read `.make-docs/references/system/planning-workflow.md` and the selected plan template in `.make-docs/templates/system/`, then continue in `docs/plans/`.
- For PRD or work generation, read `.make-docs/references/system/execution-workflow.md`, `.make-docs/contracts/system/output-contract.md`, and the selected template in `.make-docs/templates/system/`, then continue in `docs/prd/` or `docs/work/`; work phase tasks use `- [ ] t1: ...` checkbox items and acceptance criteria use plain bullets.
- For requirement changes, read `.make-docs/references/system/prd-change-management.md`; for gaps, drift, questions, risks, decisions, or closeout findings, first update `docs/prd/03-open-questions-and-risk-register.md` when it exists.
- For artifacts, use `docs/assets/artifacts/`; for archives, use `docs/assets/archive/`; for history and breadcrumb records, use `docs/assets/archive/history/`.
- For guide and persona documentation, continue in `docs/assets/library/<persona-slug>/`; for playbooks, continue in `docs/assets/playbooks/<persona-slug>/`. Before guide or playbook coverage work, read `.make-docs/contracts/system/coverage-pass-contract.md`; before guide writing, also read `.make-docs/contracts/system/guide-contract.md`, inspect existing guides for overlap, choose the verdict and target persona(s), and use the matching guide template; before playbook writing or validation, read `.make-docs/contracts/system/playbook-contract.md`.
- After guide work, reconcile overlapping guides when useful; use `## Future Coverage` inside guides for downstream-dependent guide updates rather than creating design docs, architecture decisions, or PRD risks solely to remember future guide work.
- For closeout breadcrumb records, read `.make-docs/contracts/system/history-record-contract.md` and `.make-docs/templates/system/history-record.md`, then continue in `docs/assets/archive/history/`.
- For reusable prompt starters, read `.make-docs/references/system/prompts/`; prompts are optional starters, not authority.
- **NEVER** use semantic line breaks when drafting/updating documentation.
- **NEVER** add YAML front matter to `README.md` files.
<!-- make-docs:end -->
