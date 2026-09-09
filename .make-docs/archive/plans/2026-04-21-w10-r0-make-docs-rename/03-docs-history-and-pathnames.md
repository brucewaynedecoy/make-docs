# Docs, History, and Pathnames

## Purpose

Rewrite repo documentation and tracked pathnames so the dogfood docs, historical records, and user-facing guides consistently use `make-docs`.

## Scope

- Root `README.md`, package READMEs, and source README files.
- Repo-root docs under `docs/`, including designs, plans, work backlogs, references, prompts, guides, and history records.
- User guide path finalization at `getting-started-installing-make-docs.md`.
- Markdown links, GitHub URL examples, local temp path examples, command examples, and history record links.
- Tracked pathnames containing old product-name segments.

## Implementation Steps

1. Rename the user install guide file and repair every link to it.
2. Rewrite active user/developer docs and package READMEs so commands, package names, source-install examples, GitHub paths, and troubleshooting text use `make-docs`.
3. Rewrite historical design, plan, work, and history Markdown files as part of the alpha global rename.
4. Rename any tracked docs directory or file path segment that contains the old product name.
5. Run link-oriented searches after path renames to catch stale relative links caused by renamed files.

## Parallelization

This phase can run in parallel with Phase 2 once Phase 1 establishes package/bin naming. It should own repo docs and historical docs only. If a link points into a template-owned file changed by Phase 2, leave final cross-scope link verification to the integration worker.

## Dependencies and Blockers

- Depends on final CLI command names from Phase 1.
- The guide filename rename blocks link validation until all references are repaired.
- Historical docs are in scope, so old-name matches in historical folders are blockers, not accepted residuals.

## Acceptance Criteria

- The install guide lives at `docs/guides/user/getting-started-installing-make-docs.md`.
- No tracked Markdown file or tracked pathname contains an old product-name variant.
- Relative links affected by renamed files resolve.
- GitHub clone, curl, degit, and raw URL examples use the future `make-docs` repository path.
