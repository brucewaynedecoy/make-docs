<!-- make-docs:begin -->
# Reader-Facing Guide Assets

Use `docs/assets/guides/<persona-slug>/` for reader-facing guide assets that are selected, shipped, or seeded by make-docs.

- Before writing or moving a guide, read `.make-docs/contracts/system/guide-contract.md` and `.make-docs/contracts/system/coverage-pass-contract.md`, inspect existing guides for overlap, decide whether the right outcome is `developer`, `user`, `both`, `update-existing`, `link-only`, or `none`, and use the coverage-pass contract to decide the guide/playbook verdict and target persona(s).
- Persona-scoped guides must live under the matching persona slug. The default transition slugs are `developer` and `user`; later custom personas use the same lowercase kebab-case slug rule.
- The `persona` frontmatter value is the durable target audience. Phase 03 adds validation for missing frontmatter and path/frontmatter drift.
- Use `.make-docs/templates/system/guide-developer.md` or `.make-docs/templates/system/guide-user.md` until persona-aware guide templates exist.
- Keep `docs/assets/guides/**` as the canonical managed guide asset namespace.
- Keep legacy `docs/guides/**` links readable during the W9 R3 transition. Do not duplicate a full guide across old and new locations unless the work backlog explicitly calls for a migration copy.
- After creating or updating guides, re-check overlapping guides and add reciprocal links, `related` frontmatter, or concise supplemental context when the new work improves their discoverability.
- If current confirmed behavior is useful but downstream work will expand it, write the current coverage now and add `## Future Coverage` for the blocked guide update.
- Do not create design docs, architecture decisions, or PRD risk-register items solely to remember future guide work.
- Breadcrumb records are not guides. Route them through `docs/assets/breadcrumbs/` instead.
<!-- make-docs:end -->
