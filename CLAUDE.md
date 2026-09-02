<!-- make-docs:begin -->
# Agent Instructions

- When asked to create documentation for this project that is not `README.md`, read the same-named instruction file in `docs/` before writing.
- For documentation lifecycle order or skip/reorder/revisit decisions, use a valid local `.make-docs/system/references/lifecycle.md` first. If that body is absent, read `make-docs://system/reference/lifecycle.md` with `make-docs resource read`, and surface departures from the default arc.
- Before staging or committing changes, use a valid local `.make-docs/system/contracts/commit-message-convention.md` first. If that body is absent, read `make-docs://system/contract/commit-message-convention.md` with `make-docs resource read`.
- Do not infer optional Skills, plugins, Playbooks, Protocols, or unavailable policy from this router.
<!-- make-docs:end -->

# Maintainer Dogfooding — Upstream First, Then Dogfood

This repository is the Make Docs **maintainer repo** and, at the same time, a **dogfood instance** of Make Docs. Do not author Make Docs system resources or default assets in this repo's own installed instance. Author them **upstream** in the shipped template source of truth at `packages/docs/template/` (which mirrors `.make-docs/` and `docs/`), then **dogfood** them **downstream** into this repo's installed instance at `./.make-docs/` and `./docs/`.

`packages/docs/template/` is the single upstream authority. The `packages/cli/` package does not maintain its own template; it pulls `packages/docs/template/` in only at build time.

Project artifacts this repo authors as a Make Docs *consumer* — designs, plans, PRDs, work backlogs, local guides, history, archives, and artifacts under `docs/` — are dogfood/project content and are edited in place here, not upstream. Full contract: `docs/designs/2026-06-19-template-package-and-dogfood-source-of-truth-contract.md`.

# Code Files and Project Docs

Never forget to use the jcodemunch mcp server for searching and reading code files and function signatures, and the jdocmunch mcp server for searching and reading project docs (if these mcp servers are available); these mcp servers are much faster and far more token-efficient than using ls and grep and batch reading files. If you can't find something because it isn't indexed, it just means the index is stale; when this happens, go ahead and reindex and then try searching again.

If you cannot use the jdocmunch mcp server to find something because the index doesn't exist or is stale, you should immediately attempt to reindex (rather than immediately falling back to direct file reads).

If you search for code files or function signatures using the jcodemunch mcp server and cannot find or read it because the index doesn't exist or is stale, you should immediately attempt to reindex (rather than falling back to direct file reads).

Only fallback to direct file reads, `ls`, or `grep` when reindexing jdocmunch or jcodemunch doesn't work.
