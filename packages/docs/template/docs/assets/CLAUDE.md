<!-- make-docs:begin -->
# Document Assets Router

Use `docs/assets/<persona-slug>/` for Persona-scoped reader assets.

- Use `docs/assets/<persona-slug>/testing/` for Persona-specific Naive-UAT packets, runs, outcomes, findings, evidence metadata, and approved evidence.
- Use `docs/artifacts/**` for optional, non-authoritative source and analysis inputs.
- Use `.make-docs/archive/**` for Make Docs-managed archive and provenance records.
- Treat `docs/assets/archive/**`, `docs/assets/archive/history/**`, `docs/assets/artifacts/**`, `docs/assets/library/**`, and `docs/assets/playbooks/**` as legacy migration inputs, not current shipped targets.
- Legacy guide inputs can appear under `docs/assets/library/<persona-slug>/`. Legacy playbook inputs can appear under `docs/assets/playbooks/<persona-slug>/`.
- Current system resources are peer contracts, prompts, references, and templates under `.make-docs/system/<type>/`.
- Before Persona guide work, use valid local `.make-docs/system/contracts/guide-contract.md` and `.make-docs/system/contracts/coverage-pass-contract.md` bodies. When either is absent, run `make-docs resource read` with its exact `make-docs://system/contract/guide-contract.md` or `make-docs://system/contract/coverage-pass-contract.md` URI.
- Before Persona testing work, use valid local `.make-docs/system/contracts/naive-uat-contract.md` and `.make-docs/system/references/naive-uat-workflow.md` bodies. When either is absent, run `make-docs resource read` with its exact `make-docs://system/contract/naive-uat-contract.md` or `make-docs://system/reference/naive-uat-workflow.md` URI.
- The installed provider is the default source of resource bytes. A local `.make-docs/system/**` projection is optional and must retain recorded source and hash evidence.
- Playbooks and Protocols are not current Make Docs product capabilities. Do not add new Playbook or Protocol assets.
- Make Docs installation and operation state belongs only in the global Make Docs Store, managed through the CLI. Do not use a project manifest, state folder, conflict record, or reader asset as an operational fallback.
- Project history, work status, and testing records remain valid local project knowledge. Backup, archive, and conflict file copies may remain under their content contracts. Store records own live recovery decisions and progress.
- Missing CLI or failed optional lifecycle capture does not block ordinary project work. Report unavailable capture without claiming success, direct Store writes, queued writes, or local fallback state. Required CLI-managed operation records remain mandatory.
- Do not create `docs/assets/config/`, `docs/assets/state/`, `docs/assets/manifest.json`, or `docs/assets/conflicts/`.
<!-- make-docs:end -->
