# Package Validation and Closeout

## Objective

Close implementation with package, docs, and conformance evidence that respects the CLI/MCP boundary.

## Tasks

- Add package validation when shipped command routers, MCP setup files, or bootstrap instructions are introduced.
- Keep template-owned changes source-first under `packages/docs/template/`.
- Run package copy/prepack validation for affected template-owned files.
- Add conformance-lab scenarios before claiming public model/harness support for CLI/MCP behavior.
- Update public command docs and package README/tarball guidance only after implementation behavior exists.

## Acceptance Criteria

- Package validation covers affected CLI/MCP assets.
- Public docs do not claim unsupported Rust or MCP behavior.
- Conformance evidence exists before support claims.
- Closeout records remaining open questions for remote skills, alternate manifests, and shared plugin install.
