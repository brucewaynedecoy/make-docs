# CLI Runtime and Command Boundary

## Objective

Preserve the current npm CLI behavior while documenting the future Rust agent-runtime boundary.

## Tasks

- Audit public docs for command posture and removed command references.
- Keep no-command install/sync behavior intact.
- Preserve explicit command behavior for `reconfigure`, `skills`, `backup`, and `uninstall`.
- Add future dual-runtime documentation requirements for version/runtime disclosure and PATH-order behavior.
- Avoid adding Rust or MCP bridge commands until implementation planning defines them.

## Acceptance Criteria

- Public docs describe npm as installer-first.
- Removed commands remain rejected.
- No command-router-first `npx` posture is introduced.
- Future Rust ownership is documented without claiming implementation support.
