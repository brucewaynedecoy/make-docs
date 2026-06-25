# CLI Runtime and Command Boundary

## Objective

Preserve the current npm CLI behavior while documenting the future Rust agent-runtime boundary.

## Tasks

- [x] t1: Audit public docs for command posture and removed command references.
- [x] t2: Keep no-command install/sync behavior intact.
- [x] t3: Preserve explicit command behavior for `reconfigure`, `skills`, `backup`, and `uninstall`.
- [x] t4: Add future dual-runtime documentation requirements for version/runtime disclosure and PATH-order behavior.
- [x] t5: Avoid adding Rust or MCP bridge commands until implementation planning defines them.

## Acceptance Criteria

- Public docs describe npm as installer-first.
- Removed commands remain rejected.
- No command-router-first `npx` posture is introduced.
- Future Rust ownership is documented without claiming implementation support.

## Implementation Notes

| Task | Evidence |
| --- | --- |
| t1 | Audited [README.md](../../../README.md), [packages/cli/README.md](../../../packages/cli/README.md), current user/developer guides under `docs/assets/library/**`, `packages/cli/src/cli.ts`, and `packages/cli/tests/cli.test.ts` for public command posture, removed command references, and Rust/MCP wording. |
| t2 | No-command install/sync behavior in `packages/cli/src/cli.ts` was not changed; the focused CLI test suite still passed. |
| t3 | Added parser validation so `--dry-run` is rejected for lifecycle commands instead of being silently ignored by `backup` or `uninstall`, while `reconfigure` and `skills` dry-run behavior remains accepted and tested. |
| t4 | Updated root README, package README, and CLI developer/user guides so current docs describe the npm TypeScript CLI as installer-maintainer, treat Rust/MCP as future unsupported surfaces, and state that future dual-runtime support requires runtime/version identity and parity. |
| t5 | No Rust command, MCP bridge command, or command-router-first `npx` posture was added. |

## Coverage Decisions

- PRD coverage: no PRD file changed. PRD 25 already owns the command-boundary requirement, and this phase implemented it without changing the requirement surface.
- Developer-guide coverage: updated [Building and Installing the CLI Locally](../../assets/library/developer/cli-development-local-build-and-install.md) because maintainers need the current TypeScript-only boundary and future Rust/MCP caveat while validating local CLI changes.
- User-guide coverage: updated [Managing Installations with the Make Docs CLI](../../assets/library/user/cli-lifecycle-managing-installations.md), [Installing Make Docs](../../assets/library/user/getting-started-installing-make-docs.md), [Installing and Managing Skills](../../assets/library/user/skills-installing-and-managing-skills.md), and [Decomposing an Existing Codebase](../../assets/library/user/skills-decomposing-an-existing-codebase.md) because users need corrected command examples, supported dry-run guidance, and the current npm/TypeScript command boundary.
- UAT: deferred until the full W10 R6 wave is complete, per the active wave instruction.
