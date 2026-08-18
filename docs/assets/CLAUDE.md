<!-- make-docs:begin -->
# Document Assets Router

Use `docs/assets/<persona-slug>/` for Persona-scoped reader assets.

- Use `docs/assets/<persona-slug>/testing/` for Persona-specific Naive-UAT packets, runs, outcomes, findings, evidence metadata, and approved evidence.
- Use `docs/artifacts/**` for optional, non-authoritative source and analysis inputs.
- Use `.make-docs/archive/**` for Make Docs-managed archive and provenance records.
- Treat `docs/assets/archive/**`, `docs/assets/archive/history/**`, `docs/assets/artifacts/**`, `docs/assets/library/**`, and `docs/assets/playbooks/**` as legacy migration inputs, not current shipped targets.
- Legacy guide inputs can appear under `docs/assets/library/<persona-slug>/`. Legacy playbook inputs can appear under `docs/assets/playbooks/<persona-slug>/`.
- Current system resources are peer contracts, prompts, references, and templates under their `.make-docs/*/system/` roots.
- The installed provider is the default source of resource bytes. A local `.make-docs/system/**` projection is optional and must retain recorded source and hash evidence.
- Playbooks and Protocols are not current Make Docs product capabilities. Do not add new Playbook or Protocol assets.
- Make Docs runtime state does not belong under `docs/assets/`. Project state lives in `.make-docs/manifest.json` and `.make-docs/conflicts/<run-id>/`. General lifecycle runs and evidence references live in the machine Store.
- Do not create `docs/assets/config/`, `docs/assets/state/`, `docs/assets/manifest.json`, or `docs/assets/conflicts/`.
<!-- make-docs:end -->
