<!-- make-docs:begin -->
# Agent Instructions

- When asked to create documentation for this project that is not `README.md`, read the same-named instruction file in `docs/` before writing.
- For documentation lifecycle order or skip/reorder/revisit decisions, read `.make-docs/references/system/lifecycle.md` and surface departures from the default arc.
<!-- make-docs:end -->

# Maintainer Dogfooding — Upstream First, Then Dogfood

This repository is the Make Docs **maintainer repo** and, at the same time, a **dogfood instance** of Make Docs. Do not author Make Docs system resources or default assets in this repo's own installed instance. Author them **upstream** in the shipped template source of truth at `packages/docs/template/` (which mirrors `.make-docs/` and `docs/`), then **dogfood** them **downstream** into this repo's installed instance at `./.make-docs/` and `./docs/`.

`packages/docs/template/` is the single upstream authority. The `packages/cli/` package does not maintain its own template; it pulls `packages/docs/template/` in only at build time.

Project artifacts this repo authors as a Make Docs *consumer* — designs, plans, PRDs, work backlogs, local guides, history, archives, and artifacts under `docs/` — are dogfood/project content and are edited in place here, not upstream. Full contract: `docs/designs/2026-06-19-template-package-and-dogfood-source-of-truth-contract.md`.
