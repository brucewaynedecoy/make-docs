<!-- make-docs:begin -->
# Document Assets Router

This router describes the current `docs/assets/` document-resource namespace and the transition boundary for make-docs tool resources.

- Archive records belong in `docs/assets/archive/`.
- History records belong in `docs/assets/history/`; read `docs/assets/references/history-record-contract.md` and `docs/assets/templates/history-record.md` before writing.
- Current installed tool resources still live in `docs/assets/prompts/`, `docs/assets/references/`, and `docs/assets/templates/` until an implementation plan migrates them to `.make-docs/{prompts,references,templates}/system/`.
- Treat current tool resources as local, readable bootstrap material in full-snapshot, provider-backed, and hybrid-pinned-cache modes.
- Do not send agents to hidden provider-only `.make-docs/**` resources unless local manifest or bootstrap docs identify the provider, immutable ref or version, hashes, offline behavior, and recovery path.
- make-docs runtime state does not belong under `docs/assets/`; canonical state lives at `.make-docs/manifest.json` and `.make-docs/conflicts/<run-id>/`.
- Do not create `docs/assets/config/`, `docs/assets/state/`, `docs/assets/manifest.json`, or `docs/assets/conflicts/`.
<!-- make-docs:end -->
