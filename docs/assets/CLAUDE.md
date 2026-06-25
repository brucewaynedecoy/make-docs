<!-- make-docs:begin -->
# Document Assets Router

This router describes the current `docs/assets/` document-resource namespace and the transition boundary for make-docs tool resources.

- Reader-facing guide assets belong in `docs/assets/guides/<persona-slug>/`. The legacy `docs/assets/guides/**` tree is a transition surface for existing dogfood guides until the migration work updates links and frontmatter.
- Reader-facing playbook assets belong in `docs/assets/playbooks/<persona-slug>/`. The legacy `docs/library/playbooks/**` tree is a transition surface for existing dogfood playbooks until references migrate.
- Optional pre-design source material belongs in `docs/assets/artifacts/**`; top-level `docs/artifacts/**` is migration evidence, not a shipped target.
- Archive records belong in `docs/assets/archive/**`; top-level `docs/archive/**` is not a shipped target.
- Breadcrumb records belong in `docs/assets/breadcrumbs/**`. Existing `docs/assets/history/**` records remain historical migration evidence; do not add new records there unless preserving or explicitly migrating existing history.
- Installed system tool resources live in `.make-docs/contracts/system/**`, `.make-docs/references/system/**`, `.make-docs/templates/system/**`, and `.make-docs/scripts/system/**`.
- Reusable prompt starters are classified under `.make-docs/references/system/prompts/**`; do not preserve a shipped `.make-docs/prompts/**` family by default.
- Treat current tool resources as local, readable bootstrap material in full-snapshot, provider-backed, and hybrid-pinned-cache modes.
- Do not send agents to hidden provider-only `.make-docs/**` resources unless local manifest or bootstrap docs identify the provider, immutable ref or version, hashes, offline behavior, and recovery path.
- make-docs runtime state does not belong under `docs/assets/`; canonical state lives at `.make-docs/manifest.json` and `.make-docs/conflicts/<run-id>/`.
- Do not create `docs/assets/config/`, `docs/assets/state/`, `docs/assets/manifest.json`, or `docs/assets/conflicts/`.
<!-- make-docs:end -->
