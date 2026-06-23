<!-- make-docs:begin -->
# Agent Instructions

- When asked to create documentation for this project that is not `README.md`, read the same-named instruction file in `docs/` before writing.
- For documentation lifecycle order or skip/reorder/revisit decisions, read `docs/assets/references/lifecycle.md` and surface departures from the default arc.
<!-- make-docs:end -->

# Code Files and Project Docs

Never forget to use the jcodemunch mcp server for searching and reading code files and function signatures, and the jdocmunch mcp server for searching and reading project docs (if these mcp servers are available); these mcp servers are much faster and far more token-efficient than using ls and grep and batch reading files. If you can't find something because it isn't indexed, it just means the index is stale; when this happens, go ahead and reindex and then try searching again.

If you cannot use the jdocmunch mcp server to find something because the index doesn't exist or is stale, you should immediately attempt to reindex (rather than immediately falling back to direct file reads).

If you search for code files or function signatures using the jcodemunch mcp server and cannot find or read it because the index doesn't exist or is stale, you should immediately attempt to reindex (rather than falling back to direct file reads).

Only fallback to direct file reads, `ls`, or `grep` when reindexing jdocmunch or jcodemunch doesn't work.
