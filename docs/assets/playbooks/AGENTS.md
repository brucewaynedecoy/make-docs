<!-- make-docs:begin -->
# Reader-Facing Playbook Assets

Use `docs/assets/playbooks/<persona-slug>/` for reader-facing playbooks that describe repeatable human or agent workflows.

- Playbooks are documents, not plugins, executors, or hidden tool resources.
- Before writing, changing, or validating a playbook, read `.make-docs/contracts/system/playbook-contract.md`; it is the normative authority for playbook naming, frontmatter, the heading spine, the workflow contract, and the dependency registry.
- Persona-scoped playbooks must live under the matching persona slug. The `persona` frontmatter value is authoritative; Phase 03 adds validation for missing frontmatter and path/frontmatter drift.
- Link playbooks to their supporting lifecycle, guide, or reference contract rather than duplicating the contract text.
- Keep future playbook work under `docs/assets/playbooks/**`.
- History and breadcrumb records are not playbooks. Route them through `docs/assets/archive/history/` instead.
<!-- make-docs:end -->
