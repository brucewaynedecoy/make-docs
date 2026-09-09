<!-- make-docs:begin -->
# Archive Router

This directory holds historical and provenance records, not current product authority.

- Use `.make-docs/archive/history/` for session history. Preserve recorded outcomes and coordinates; repair links only through a recorded reviewed move.
- Before writing, use valid local `.make-docs/system/contracts/history-record-contract.md` and `.make-docs/system/templates/history-record.md`; read absent bodies with `make-docs resource read` at `make-docs://system/contract/history-record-contract.md` and `make-docs://system/template/history-record.md`.
- Shared material uses `docs/assets/project/`; audience assets use `docs/assets/<persona-slug>/`.
- Retired Playbooks stay inactive under `.make-docs/archive/legacy-playbooks/`. Do not infer a current workflow from them.
- Operational state stays in the global Store through the CLI. Archive or backup content is not an operational fallback.
<!-- make-docs:end -->
