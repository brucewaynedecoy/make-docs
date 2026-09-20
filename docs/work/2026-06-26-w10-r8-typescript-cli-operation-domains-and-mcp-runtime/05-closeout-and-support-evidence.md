# Phase 05: Closeout and Support Evidence

## Purpose

Close out the TypeScript operation-domain and MCP runtime implementation with product, package, and support-claim evidence.

## Tasks

- [x] t1: Run the full CLI/package validation chain.
- [x] t2: Record MCP support evidence and any remaining write-permission limits.
- [x] t3: Update PRD/risk entries with implementation evidence.
- [x] t4: Add closeout history under `docs/assets/archive/history/**`.
- [x] t5: Decide whether manual testing is worthwhile after automated parity and package-runner validation.

## Acceptance Criteria

- TypeScript CLI and MCP runtime support can be claimed for the validated surfaces.
- Remaining limitations are explicit and do not reopen Rust runtime assumptions.

## Implementation Notes

Phase 5 closes W10 R8 by tying the phase-level implementation evidence together into a bounded support claim.

- The TypeScript CLI runtime can be claimed for the existing install, lifecycle, operation-domain, and package-runner surfaces validated by W10 R8.
- `make-docs operations ...` remains behavior-compatible while closeout, work, and lifecycle behavior now lives in modular operation domains.
- `make-docs mcp` is a shipped TypeScript stdio surface for read-first and plan-first tools that reuse the same operation domains and planner/classifier modules as CLI behavior.
- MCP write behavior remains intentionally narrow. The closeout validation tool rejects validation execution unless the caller passes explicit `allowRun=true`; broader writes, provider-backed operations, plugin/shared-agentics parity, playbook execution, adversarial review, and migration link rewriting require future implementation proof.
- Remote execution support is validated from the packed tarball through `npx --package`, `pnpm dlx`, and `bun x --package` in isolated temp roots.

## Coverage Decisions

- PRD coverage: `baseline-change-note`. Updated PRD 16, PRD 25, and the risk register in place because W10 R8 implements existing runtime, MCP, and package-validation requirements rather than introducing a new product requirement.
- Developer-guide coverage: `none`. Phase 1 and Phase 4 already updated the operation-domain and packaging maintainer guides; Phase 5 only records support evidence and closeout.
- User-guide coverage: `none`. The closeout does not introduce a new end-user workflow beyond the already-documented CLI/MCP and remote execution surfaces.
- Manual/UAT coverage: `not worthwhile`. The user-observable package-runner surface is already exercised by `npm run smoke:pack` against real packed-tarball `npx`, `pnpm dlx`, and Bun installs in isolated temp roots, while the MCP surface is covered by parser-free operation-domain tests, MCP parity tests, and the built-server MCP client smoke. A hand-run scenario would duplicate those protocol/package checks without adding a human-judgment element.

## Validation Evidence

- `npm test -w packages/cli -- --reporter=dot`
- `npm run validate:defaults -w packages/cli`
- `npm run build -w packages/cli`
- `npm run smoke:pack`
- `python3 .make-docs/scripts/check_path_hygiene.py --repo-root . --format json`
- `bash scripts/check-wave-numbering.sh`
- Refreshed the local jdocmunch docs index
- Changed-file Markdown link check
- `git diff --check`
- `bash scripts/check-instruction-routers.sh` reported the known root-router baseline (`./AGENTS.md` and `./CLAUDE.md` differ; `./CLAUDE.md` exceeds the 12-line budget). No W10 R8 Phase 5 router regression was introduced.
