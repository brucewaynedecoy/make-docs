<!-- make-docs:begin -->
# Document Assets Router

- Shared, non-authoritative material uses `docs/assets/project/`. Audience assets use `docs/assets/<persona-slug>/`; audience testing uses its `testing/` child.
- Defaults are `user` and `maintainer`. Either role can be human or agent. Merge valid `.make-docs/config.yaml` Personas with those defaults; `project` is reserved shared material. Do not infer an audience from the executor.
- Create only paths needed by actual content. Managed instruction files belong at this root only, for the harness files declared in the `docs/` router.
- Archives and history use `.make-docs/archive/`. Old Library, artifact, archive, and Playbook families require reviewed migration; no new Playbook or Protocol assets are supported.
- For guide work, use valid local `.make-docs/system/contracts/guide-contract.md` and `.make-docs/system/contracts/coverage-pass-contract.md`; read absent bodies with `make-docs resource read make-docs://system/contract/guide-contract.md` or `make-docs://system/contract/coverage-pass-contract.md`.
- For testing, use valid local `.make-docs/system/contracts/naive-uat-contract.md` and `.make-docs/system/references/naive-uat-workflow.md`; read absent bodies by `make-docs://system/contract/naive-uat-contract.md` or `make-docs://system/reference/naive-uat-workflow.md` with `make-docs resource read`.
- For configuration and layout migration, use `.make-docs/system/references/path-and-link-hygiene.md` or `make-docs://system/reference/path-and-link-hygiene.md` with `make-docs resource read`.
- All Make Docs installation, operation, and recovery state belongs in the global Make Docs Store through the CLI. Project knowledge, work status, and backup copies remain local content.
- Missing CLI or failed optional capture does not block ordinary content work. Report unavailable capture without direct Store writes, queued writes, local operational fallback, or false success. Required CLI operation records remain mandatory.
<!-- make-docs:end -->
