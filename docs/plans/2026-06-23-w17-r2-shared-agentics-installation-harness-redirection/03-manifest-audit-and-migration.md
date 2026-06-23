# Manifest Audit and Migration

## Objective

Plan the manifest and lifecycle changes required to classify shared payloads, generated stubs, old duplicated payloads, modified skill files, home-scoped files, and custom user skills.

## Manifest Requirements

Structured agentic ownership records should identify:

- artifact kind, name, source manifest, immutable ref, digest, trust/provenance, and scope
- canonical shared payload paths
- generated harness stub paths
- exposure mode, defaulting to `generated-stub`
- harness name and path scope
- migrated, preserved, or skipped prior duplicated payloads

Until that schema exists, implementation may represent shared payloads and stubs through `skillFiles`, but dry-run output, audit, backup, uninstall, and migration diagnostics must still preserve the distinction.

## Migration Requirements

- Clean manifest-owned per-harness skill installs may migrate to shared payload plus stubs.
- Modified skill files, custom user skills, malformed manifests, and ambiguous missing-manifest states use existing review, backup-and-reinstall, or manual-review dispositions.
- Migration must never infer ownership over a user-authored harness skill only because its path matches a make-docs skill name.

## Acceptance

- Backup and uninstall consume one reviewed audit snapshot.
- Old duplicated payloads, shared payloads, stubs, and custom user skills have separate classification output.
- Global and project scopes both have fixture coverage.
