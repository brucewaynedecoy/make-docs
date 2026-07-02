<!-- make-docs:begin -->
# Make Docs System Router

This directory owns make-docs machinery: contracts, references, templates, scripts, agentics, config, manifest, and runtime provenance.

- Use `.make-docs/contracts/system/` for make-docs-owned contracts.
- Use `.make-docs/references/system/` for make-docs-owned workflow references.
- Use `.make-docs/templates/system/` for make-docs-owned structural templates.
- Use `.make-docs/scripts/system/` for make-docs-owned deterministic helper scripts when they exist; `.make-docs/scripts/check_path_hygiene.py` remains a local bootstrap helper during migration.
- Use `.make-docs/agentics/` only for selected shared agentic payloads governed by accepted PRDs.
- Do not put project documentation assets, generated designs, plans, PRDs, work backlogs, archives, artifacts, breadcrumbs, guides, or playbooks here.
- Keep project state in `.make-docs/manifest.json`, `.make-docs/conflicts/`, and project config; run-state and work-execution evidence live in the machine-level global store at `~/.make-docs/`, not in this directory; do not copy runtime state into `docs/assets/`.
<!-- make-docs:end -->
