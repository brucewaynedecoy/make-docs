<!-- make-docs:begin -->
# Reader-Facing Playbook Assets

Use `docs/assets/playbooks/<persona-slug>/` for reader-facing playbooks that describe repeatable human or agent workflows.

- Playbooks are documents, not plugins, executors, or hidden tool resources.
- Persona-scoped playbooks must live under the matching persona slug. The `persona` frontmatter value is authoritative; Phase 03 adds validation for missing frontmatter and path/frontmatter drift.
- Link playbooks to their supporting lifecycle, guide, or reference contract rather than duplicating the contract text.
- Keep legacy `docs/library/playbooks/**` links readable during the W9 R3 transition. Prefer adding a canonical copy or mapping note before removing the legacy path.
- Breadcrumb records are not playbooks. Route them through `docs/assets/breadcrumbs/` instead.
<!-- make-docs:end -->
