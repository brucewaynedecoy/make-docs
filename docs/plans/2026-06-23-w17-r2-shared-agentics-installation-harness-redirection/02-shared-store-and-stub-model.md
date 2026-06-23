# Shared Store and Stub Model

## Objective

Plan the shared installed-state shape for selected skills first, while reserving compatible plugin payload placement for later designs.

## Store Shape

```text
.make-docs/agentics/
  skills/<skill-name>/
  plugins/<plugin-id>/
  manifests/
```

Project scope uses the project `.make-docs/agentics/` tree. Global scope uses the home-scoped `.make-docs/agentics/` tree.

## Generated Stubs

- Harness roots receive normal text entrypoint stubs.
- Stubs include harness-native discovery metadata, a short purpose summary, and the exact canonical shared-payload path.
- Stubs are the harness boundary for names, wrappers, and entrypoint filenames.
- Symlinks may be a later explicit optimization only when manifest, audit, fallback, and cross-platform behavior are specified.

## Acceptance

- Skills install one canonical payload per selected skill and scope.
- Each selected harness receives only generated exposure files.
- Windows, macOS, and Linux behavior does not depend on symlink or junction privileges.
