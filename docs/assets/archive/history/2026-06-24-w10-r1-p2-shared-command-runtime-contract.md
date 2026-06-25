---
date: "2026-06-24"
coordinate: "W10 R1 P2"
branch: "make-docs-v2"
status: "complete"
summary: "Completed the W10 R1 shared command and runtime contract phase."
---

# W10 R1 P2 Shared Command and Runtime Contract

## Changes

Completed W10 R1 Phase 2 by locking the public command boundary to the single `make-docs` executable, adding regression coverage for rejected compatibility aliases, and documenting the npm package lookup, installed command, and future PATH-selected runtime boundary.

| Area | Summary |
| --- | --- |
| Command boundary | Verified the scoped npm package exposes only the `make-docs` binary and that the TypeScript CLI still exposes only the no-command install/sync path plus `reconfigure`, `skills`, `backup`, and `uninstall`. |
| Test coverage | Added CLI regression coverage for rejected `makedocs`, `make-docs-js`, and `make-docs-rs` aliases while preserving removed-command migration guidance for `init`, `update`, `--reconfigure`, and `--skills`. |
| User docs | Clarified in the root and package READMEs that `@brucewaynedecoy/make-docs` is the npm lookup package and `make-docs` is the installed executable, with future npm/Rust implementations selected by shell `PATH` order. |
| Runtime/MCP boundary | Left TypeScript-only help/version output unchanged because runtime/version disclosure is required before dual-runtime support, and preserved Rust as the long-term MCP runtime owner. |
| Workflow | Deferred UAT/manual testing until the full W10 R1 wave is complete, matching the user-directed build-process departure from the default loop. |

## Documentation

### Project

| Path | Description |
| --- | --- |
| [../../work/2026-06-23-w10-r1-package-and-deployment-boundaries/02-shared-command-and-runtime-contract.md](../../work/2026-06-23-w10-r1-package-and-deployment-boundaries/02-shared-command-and-runtime-contract.md) | Marked Phase 2 tasks complete and recorded implementation notes for the command/runtime boundary. |

### Developer

| Path | Description |
| --- | --- |
| [../../../README.md](../../../README.md) | Clarified scoped npm lookup versus the installed `make-docs` command and future PATH-selected runtime behavior. |
| [../../../packages/cli/README.md](../../../packages/cli/README.md) | Matched package README command guidance to the root README command/runtime boundary. |

### User

| Path | Description |
| --- | --- |
| [../../../README.md](../../../README.md) | Clarified how users should interpret `npx @brucewaynedecoy/make-docs@next` versus the `make-docs` executable. |
| [../../../packages/cli/README.md](../../../packages/cli/README.md) | Clarified package lookup and installed command naming for package consumers. |
