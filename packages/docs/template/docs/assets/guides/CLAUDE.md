<!-- make-docs:begin -->
# Reader-Facing Guide Assets

Use `docs/assets/guides/<persona-slug>/` for reader-facing guide assets that are selected, shipped, or seeded by make-docs.

- Before writing or moving a guide, read `docs/assets/references/guide-contract.md` and `docs/assets/references/coverage-pass-contract.md`.
- Persona-scoped guides must live under the matching persona slug. The default transition slugs are `developer` and `user`; later custom personas use the same lowercase kebab-case slug rule.
- The `persona` frontmatter value is the durable target audience. Phase 03 adds validation for missing frontmatter and path/frontmatter drift.
- Use `docs/assets/templates/guide-developer.md` or `docs/assets/templates/guide-user.md` until persona-aware guide templates exist.
- Keep `docs/guides/**` readable during the W9 R3 transition. Do not duplicate a full guide across old and new locations unless the work backlog explicitly calls for a migration copy.
- History records are not guides. Route them through `docs/assets/history/` instead.
<!-- make-docs:end -->
