---
date: "2026-06-25"
coordinate: "W10 R6 P2"
repo: "make-docs"
branch: "make-docs-v2"
status: "completed"
summary: "Aligned the W10 R6 current CLI command boundary and future Rust/MCP documentation posture."
---

# W10 R6 P2 CLI Runtime and Command Boundary

## Changes

Completed W10 R6 Phase 2 by preserving the no-command npm install/sync posture, adding parser and regression-test coverage that rejects unsupported `--dry-run` lifecycle usage instead of silently ignoring it, correcting public command examples, and documenting the current TypeScript npm installer-maintainer boundary plus future Rust/MCP runtime disclosure and parity requirements without adding Rust or MCP bridge commands.

### Coverage Decisions

- PRD coverage: no PRD files changed. [historical closeout](2026-06-25-w10-r6-p4-package-validation-and-closeout.md) (retired action-PRD: `docs/prd/25-revise-cli-separation-and-mcp-boundary.md`) already owns the effective CLI/MCP boundary.
- Developer-guide coverage: updated [Building and Installing the CLI Locally](../../../assets/library/developer/cli-development-local-build-and-install.md) with the current TypeScript-only boundary and future Rust/MCP parity caveat.
- User-guide coverage: updated [Managing Installations with the Make Docs CLI](../../../assets/library/user/cli-lifecycle-managing-installations.md), [Installing Make Docs](../../../assets/library/user/getting-started-installing-make-docs.md), [Installing and Managing Skills](../../../assets/library/user/skills-installing-and-managing-skills.md), and [Decomposing an Existing Codebase](../../../assets/library/user/skills-decomposing-an-existing-codebase.md) with corrected `--selected-skills` usage, lifecycle dry-run guidance, current npm/TypeScript scope, and the unsupported Rust/MCP boundary.
- UAT: deferred until the full W10 R6 wave is complete, per the active wave instruction.

### Validation

- `npm test -w packages/cli -- --run tests/cli.test.ts --reporter=dot`
- `rg -n -- "--optional-skills|backup --dry-run|uninstall --dry-run|Rust CLI|MCP|runtime/version|TypeScript installer" README.md packages/cli/README.md docs/assets/library/user/cli-lifecycle-managing-installations.md docs/assets/library/developer/cli-development-local-build-and-install.md packages/cli/src/cli.ts packages/cli/tests/cli.test.ts`
- `python3 packages/skills/closeout-phase/scripts/work_phase_state.py docs/work/2026-06-23-w10-r6-cli-separation-and-mcp-boundary/02-cli-runtime-and-command-boundary.md --json`
- `git diff --check`
- `python3 .make-docs/scripts/check_path_hygiene.py --repo-root . --format json`
- Changed-file Markdown link resolver for this phase's docs.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [README.md](../../../../README.md) | Clarified that the current `npx` package is the TypeScript installer-maintainer CLI and that future Rust/MCP support requires runtime/version identity and parity. |
| [packages/cli/README.md](../../../../packages/cli/README.md) | Added the same shipped-package boundary to the npm package README. |
| [docs/work/2026-06-23-w10-r6-cli-separation-and-mcp-boundary/02-cli-runtime-and-command-boundary.md](../../../work/2026-06-23-w10-r6-cli-separation-and-mcp-boundary/02-cli-runtime-and-command-boundary.md) | Marked Phase 2 tasks complete and recorded implementation evidence. |
| [docs/assets/archive/history/2026-06-25-w10-r6-p2-cli-runtime-and-command-boundary.md](2026-06-25-w10-r6-p2-cli-runtime-and-command-boundary.md) | Added this phase closeout breadcrumb. |

### Developer

| Path | Description |
| --- | --- |
| [docs/assets/library/developer/cli-development-local-build-and-install.md](../../../assets/library/developer/cli-development-local-build-and-install.md) | Added persona frontmatter, PRD 25 as a related source, and the TypeScript-only current boundary. |

### User

| Path | Description |
| --- | --- |
| [docs/assets/library/user/cli-lifecycle-managing-installations.md](../../../assets/library/user/cli-lifecycle-managing-installations.md) | Added persona frontmatter, PRD 25 as a related source, corrected selected-skill usage, removed unsupported lifecycle dry-run examples, and documented current npm/TypeScript scope. |
| [docs/assets/library/user/getting-started-installing-make-docs.md](../../../assets/library/user/getting-started-installing-make-docs.md) | Added persona frontmatter and replaced removed optional-skill command wording with selected-skill guidance. |
| [docs/assets/library/user/skills-installing-and-managing-skills.md](../../../assets/library/user/skills-installing-and-managing-skills.md) | Added persona frontmatter and replaced optional-skill terminology with selected-skill command guidance. |
| [docs/assets/library/user/skills-decomposing-an-existing-codebase.md](../../../assets/library/user/skills-decomposing-an-existing-codebase.md) | Added persona frontmatter and replaced removed optional-skill command examples with `--selected-skills`. |
