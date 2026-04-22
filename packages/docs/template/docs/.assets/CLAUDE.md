# Document Assets Router

This router describes the target `docs/assets/` document-resource namespace.
- Archive records belong in `docs/assets/archive/`.
- History records belong in `docs/assets/history/`; read `docs/assets/references/history-record-contract.md` and `docs/assets/templates/history-record.md` before writing.
- Reusable prompts, references, and templates belong in `docs/assets/prompts/`, `docs/assets/references/`, and `docs/assets/templates/`.
- make-docs runtime state does not belong under `docs/assets/`; canonical state lives at `.make-docs/manifest.json` and `.make-docs/conflicts/<run-id>/`.
- Do not create `docs/assets/config/`, `docs/assets/state/`, `docs/assets/manifest.json`, or `docs/assets/conflicts/`.
