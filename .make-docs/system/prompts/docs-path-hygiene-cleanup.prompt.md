___
name: Docs Path Hygiene Cleanup
description: Instructs the agent to audit and repair Make Docs-managed documentation for local absolute checkout and user-specific paths.
___

Please audit and repair Make Docs-managed documentation for local, user-specific, or checkout-specific paths.

Before editing anything, read `docs/AGENTS.md`, and `.make-docs/system/references/path-and-link-hygiene.md`. Treat the path hygiene reference as the authority for project-relative paths, relative Markdown links, sanitized placeholders, and full-path exceptions.

Run the deterministic checker. It selects local content without a manifest, CLI, or Store. Use repeated `--path <project-relative-file-or-directory>` arguments for a custom docs root or a narrower reviewed scope. Never create operational state to make this check run:

```bash
python3 .make-docs/scripts/check_path_hygiene.py --format json
```

For each still-valid finding, repair the documentation with a project-relative path or sanitized placeholder. Preserve full paths only when the reference allows the exception, and add or preserve the `make-docs-path-hygiene: allow` comment with a clear reason.

After repairs, rerun:

```bash
python3 .make-docs/scripts/check_path_hygiene.py --format text
just docs-links docs
just docs-style docs
git diff --check
```

Report the files changed, the findings fixed, any findings intentionally skipped with reasons, and any validation command that could not be run.
