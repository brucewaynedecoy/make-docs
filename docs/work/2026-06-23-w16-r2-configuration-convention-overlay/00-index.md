# W16 R2 Configuration Convention Overlay Work Backlog

## W9 R4 Prerequisite

Before executing this backlog, apply [W9 R4 v2 Documentation Asset IA Hard Move](../2026-06-25-w9-r4-v2-documentation-asset-ia-hard-move/00-index.md). W16 R2 configuration overlays must preserve `.make-docs/**` system-resource ownership and `docs/assets/{archive,artifacts,breadcrumbs,guides,playbooks}/**` project-asset ownership instead of creating pre-pivot path aliases.

## Source Plan

- [Plan Overview](../../plans/2026-06-23-w16-r2-configuration-convention-overlay/00-overview.md)
- [PRD 24](../../prd/24-revise-configuration-convention-overlay.md)

## Work Phases

1. [Requirements and Register Reconciliation](01-requirements-and-register-reconciliation.md)
2. [Config Schema and Loader](02-config-schema-and-loader.md)
3. [Rendering and Validation](03-rendering-and-validation.md)
4. [Package Parity and Closeout](04-package-parity-and-closeout.md)

## Implementation Guardrails

- Do not treat configured labels as routing authority.
- Do not change canonical paths, metadata field names, route identifiers, or W/R/P coordinate metadata.
- Preserve project-owned `.make-docs/config.yaml` separately from make-docs-owned manifest, conflict, provider, and cache state.
- Keep default config template work source-first if a template is introduced.

## Validation Summary

- Unit tests for schema parsing, defaults, diagnostics, persona validation, and structural rename rejection.
- CLI tests for absent config, valid config rendering, invalid config diagnostics, and unchanged routing.
- Package/dogfood tests for template parity and local config preservation.
- Markdown/link validation for updated docs and generated backlog.
