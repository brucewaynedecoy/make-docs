# Validation and Closeout

## Validation Commands

- `git diff --check`
- changed-file Markdown link checks
- `bash scripts/check-wave-numbering.sh`
- future-facing runtime assumption scan

## Search Acceptance

The final scan must confirm:

- no future-facing doc treats Rust as required v2 runtime;
- no future-facing doc treats MCP as optional for v2;
- no future-facing doc claims PATH-order npm/Rust runtime selection as the target model;
- W16 R3 is referenced as completed operation-boundary evidence, not reopened work.

## Closeout

Create a history record under `docs/assets/archive/history/**` for the W10 R7 pivot. Record that W10 R7 changed authority and generated the W10 R8 implementation backlog, without implementing code modularization or MCP behavior.
