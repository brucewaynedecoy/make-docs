<!-- make-docs:begin -->
# Reader-Facing Library Assets

Use `docs/assets/library/<persona-slug>/` for reader-facing guide and persona-library assets that are selected, shipped, or seeded by make-docs.

- Before writing or moving a guide, read `.make-docs/contracts/system/guide-contract.md` and `.make-docs/contracts/system/coverage-pass-contract.md`, inspect existing guides for overlap, decide whether the right outcome is `developer`, `user`, `both`, `update-existing`, `link-only`, or `none`, and use the coverage-pass contract to decide the guide/playbook verdict and target persona(s).
- Persona-scoped guides must live under the matching persona slug. The default transition slugs are `developer` and `user`; later custom personas use the same lowercase kebab-case slug rule.
- The `persona` frontmatter value is the durable target audience. Phase 03 adds validation for missing frontmatter and path/frontmatter drift.
- Use `.make-docs/templates/system/guide-developer.md` or `.make-docs/templates/system/guide-user.md` until persona-aware guide templates exist.
- Keep `docs/assets/library/**` as the canonical managed guide and persona-library asset namespace.
- Keep guide and persona documentation in this library tree; do not add new shipped-current files in legacy guide roots.
- After creating or updating guides, re-check overlapping guides and add reciprocal links, `related` frontmatter, or concise supplemental context when the new work improves their discoverability.
- If current confirmed behavior is useful but downstream work will expand it, write the current coverage now and add `## Future Coverage` for the blocked guide update.
- Do not create design docs, architecture decisions, or PRD risk-register items solely to remember future guide work.
- History and breadcrumb records are not guides. Route them through `docs/assets/archive/history/` instead.
<!-- make-docs:end -->
