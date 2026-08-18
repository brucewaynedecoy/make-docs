<!-- make-docs:begin -->
# Documentation Router

Use `docs/` only as a router. Do not create generated files directly in this directory. For lifecycle order or skip/reorder/revisit decisions, read `.make-docs/references/system/lifecycle.md` and surface departures from the default arc.
- Source Markdown NEVER uses semantic line breaks; for path/link hygiene, use project-relative paths and relative Markdown links, and read `.make-docs/references/system/path-and-link-hygiene.md`.
- For design docs, read `.make-docs/references/system/design-workflow.md`, `.make-docs/contracts/system/design-contract.md`, and `.make-docs/templates/system/design.md`, then continue in `docs/designs/`; for plans, read `.make-docs/references/system/planning-workflow.md` and the selected plan template in `.make-docs/templates/system/`, then continue in `docs/plans/`.
- For PRD or work generation, read `.make-docs/references/system/execution-workflow.md`, `.make-docs/contracts/system/output-contract.md`, and the selected template in `.make-docs/templates/system/`, then continue in `docs/prd/` or `docs/work/`; work phase tasks use `- [ ] t1: ...` checkbox items and acceptance criteria use plain bullets.
- For requirement changes, read `.make-docs/references/system/prd-change-management.md`; for gaps, drift, questions, risks, decisions, or closeout findings, first update `docs/prd/03-open-questions-and-risk-register.md` when it exists.
- For non-authoritative source or analysis inputs, use `docs/artifacts/`. For Make Docs-managed archive and provenance records, use `.make-docs/archive/`.
- For Persona-scoped reader assets, use `docs/assets/<persona-slug>/`. For Naive-UAT packets, runs, findings, and approved evidence, use `docs/assets/<persona-slug>/testing/`.
- Before guide or system-resource coverage work, read `.make-docs/contracts/system/coverage-pass-contract.md`. Before guide writing, also read `.make-docs/contracts/system/guide-contract.md`, inspect existing guides for overlap, choose the verdict and target Persona, and use the matching guide template.
- When work changes deferred obligations or Naive UAT, read `.make-docs/contracts/system/deferred-obligation-contract.md`, `.make-docs/contracts/system/naive-uat-contract.md`, and `.make-docs/references/system/naive-uat-workflow.md`. Each activated Naive-UAT run selects one eligible configured Persona and keeps tester qualification separate.
- Playbooks and Protocols are not current Make Docs product capabilities. Treat existing Playbook- or Protocol-shaped paths as legacy migration inputs.
- After guide work, reconcile overlapping guides when useful; use `## Future Coverage` inside guides for downstream-dependent guide updates rather than creating design docs, architecture decisions, or PRD risks solely to remember future guide work.
- For closeout history records, read `.make-docs/contracts/system/history-record-contract.md` and `.make-docs/templates/system/history-record.md`, then use the current archive path owned by project authority.
- Read prompts by stable `make-docs://system/prompt/<posix-relative-path>` URI with `make-docs resource read`. Prompts are first-class system resources. A local projection is optional. Their governing contracts own reusable rules.
- **NEVER** use semantic line breaks when drafting/updating documentation.
- **NEVER** add YAML front matter to `README.md` files.
<!-- make-docs:end -->
